import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VentaPdfData {
  numero_comprobante: string;
  tipo_comprobante: 'BOLETA' | 'FACTURA';
  fecha_venta: string;
  cliente_nombre?: string;
  vendedor_nombre?: string;
  total: number;
  detalles?: {
    nombre?: string;
    sku?: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
}

interface ProformaPdfData {
  codigo_proforma: string;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente_nombre?: string;
  representante_nombre?: string;
  total: number;
  detalles?: {
    nombre?: string;
    sku?: string;
    cantidad: number;
    precio_pactado: number;
    subtotal: number;
  }[];
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo-transparente.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addHeaderInfo(doc: jsPDF, titulo: string, fecha: string, logoBase64: string | null) {
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 8, 40, 12);
  } else {
    // Fallback: logo dibujado
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(14, 8, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('F', 18.5, 19);
    doc.setFontSize(16);
    doc.setTextColor(234, 88, 12);
    doc.text('FADICC', 30, 16);
  }

  // Título del documento
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 196, 16, { align: 'right' });

  // Fecha
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha emisión: ${new Date(fecha).toLocaleDateString('es-PE')}`, 196, 22, { align: 'right' });

  // Línea separadora
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);
}

function addFooter(doc: jsPDF, y: number) {
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FADICC S.A. - Documento generado electrónicamente - www.fadicc.com.pe', 105, y, { align: 'center' });
  doc.text('Gracias por su preferencia', 105, y + 4, { align: 'center' });
}

export async function generarPdfVenta(data: VentaPdfData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const tipoLabel = data.tipo_comprobante === 'BOLETA' ? 'BOLETA DE VENTA' : 'FACTURA';

  const logoBase64 = await loadLogoBase64();

  addHeaderInfo(doc, `${tipoLabel} N° ${data.numero_comprobante}`, data.fecha_venta, logoBase64);

  // Datos del cliente y vendedor
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${data.cliente_nombre || 'Cliente General'}`, 14, 38);
  doc.text(`Vendedor: ${data.vendedor_nombre || 'Vendedor'}`, 14, 43);

  // Tabla de productos
  const body = (data.detalles || []).map((d) => [
    d.sku || '—',
    d.nombre || 'Producto',
    d.cantidad.toString(),
    `S/ ${d.precio_unitario.toFixed(2)}`,
    `S/ ${(d.cantidad * d.precio_unitario).toFixed(2)}`,
  ]);

  if (body.length === 0) {
    body.push(['—', 'Sin productos registrados', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: 48,
    head: [['SKU', 'Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Totales
  const subtotal = data.total / 1.18;
  const igv = data.total - subtotal;
  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 150, finalY + 10, { align: 'right' });
  doc.text('IGV (18%):', 150, finalY + 16, { align: 'right' });
  doc.text('TOTAL:', 150, finalY + 24, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`S/ ${subtotal.toFixed(2)}`, 190, finalY + 10, { align: 'right' });
  doc.text(`S/ ${igv.toFixed(2)}`, 190, finalY + 16, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(234, 88, 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${data.total.toFixed(2)}`, 190, finalY + 24, { align: 'right' });

  addFooter(doc, 285);
  doc.save(`${tipoLabel}_${data.numero_comprobante}.pdf`);
}

export async function generarPdfProforma(data: ProformaPdfData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const logoBase64 = await loadLogoBase64();

  addHeaderInfo(doc, `PROFORMA N° ${data.codigo_proforma}`, data.fecha_emision, logoBase64);

  // Datos
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${data.cliente_nombre || 'Cliente'}`, 14, 38);
  doc.text(`Representante: ${data.representante_nombre || 'Representante'}`, 14, 43);
  doc.text(`Estado: ${data.estado}`, 14, 48);
  doc.text(`Válida hasta: ${new Date(data.fecha_vencimiento).toLocaleDateString('es-PE')}`, 14, 53);

  // Tabla
  const body = (data.detalles || []).map((d) => [
    d.sku || '—',
    d.nombre || 'Producto',
    d.cantidad.toString(),
    `S/ ${d.precio_pactado.toFixed(2)}`,
    `S/ ${d.subtotal.toFixed(2)}`,
  ]);

  if (body.length === 0) {
    body.push(['—', 'Sin productos registrados', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: 58,
    head: [['SKU', 'Producto', 'Cant.', 'Precio Pactado', 'Subtotal']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Total
  const finalY = (doc as any).lastAutoTable?.finalY || 130;
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL:', 150, finalY + 10, { align: 'right' });

  doc.setFontSize(13);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${data.total.toFixed(2)}`, 190, finalY + 10, { align: 'right' });

  // Notas legales
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Esta proforma tiene una validez de 15 días calendario desde su fecha de emisión.', 14, finalY + 22);
  doc.text('Los precios pueden variar sin previo aviso después de la fecha de vencimiento.', 14, finalY + 26);
  doc.text('Para convertir en pedido, contacte a su representante asignado.', 14, finalY + 30);

  addFooter(doc, 285);
  doc.save(`PROFORMA_${data.codigo_proforma}.pdf`);
}

export async function generarPdfFactura(data: {
  numero_comprobante: string;
  fecha_venta: string;
  cliente_nombre?: string;
  receptor_ruc?: string;
  receptor_direccion?: string;
  vendedor_nombre?: string;
  emisor_razon_social?: string;
  emisor_direccion?: string;
  emisor_ruc?: string;
  forma_pago?: string;
  moneda?: string;
  guia_remision?: string;
  orden_compra?: string;
  total: number;
  subtotal?: number;
  igv?: number;
  valor_venta?: number;
  monto_letras?: string;
  detraccion_leyenda?: string;
  detraccion_bien_servicio?: string;
  detraccion_medio_pago?: string;
  detraccion_cta_banco_nacion?: string;
  detraccion_porcentaje?: number;
  detraccion_monto?: number;
  credito_monto_neto?: number;
  credito_total_cuotas?: number;
  credito_cuotas?: { nro: number; fecha_vencimiento: string; monto: number }[];
  detalles?: {
    nombre?: string;
    sku?: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoBase64 = await loadLogoBase64();

  let y = 10;

  // Logo (top left)
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, y, 40, 12);
  } else {
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(14, y, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('F', 18.5, y + 11);
    doc.setFontSize(16);
    doc.setTextColor(234, 88, 12);
    doc.text('FADICC', 30, y + 6);
  }

  // Emisor (left side)
  const emisorRazonSocial = data.emisor_razon_social || 'SERVICIOS GENERALES ALASKA S.R.LTDA.';
  const emisorDireccion = data.emisor_direccion || 'PRL.ALEJANDRO BERTELLO URB. SAN REMO ET.II MZA. G LOTE. 13 AV.CANTA CALLAO CON PROL.BERTELLO, SAN MARTIN DE PORRES - LIMA - LIMA';
  const emisorRuc = data.emisor_ruc || '20335737319';

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('EMISOR', 14, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${emisorRazonSocial}`, 14, y + 27);
  doc.text(`Dirección: ${emisorDireccion}`, 14, y + 32);
  doc.text(`RUC: ${emisorRuc}`, 14, y + 37);

  // Header Box (top right)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(130, y + 18, 66, 28, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`RUC: ${emisorRuc}`, 196, y + 26, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text('FACTURA ELECTRÓNICA', 196, y + 32, { align: 'right' });
  doc.setFontSize(14);
  doc.text(data.numero_comprobante, 196, y + 40, { align: 'right' });

  y += 48;

  // Información General
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORMACIÓN GENERAL', 14, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 2, 196, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const fechaEmision = new Date(data.fecha_venta).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.text(`Fecha de Emisión: ${fechaEmision}`, 14, y + 8);
  doc.text(`Forma de pago: ${data.forma_pago || '—'}`, 90, y + 8);
  doc.text(`Guía de Remisión Remitente: ${data.guia_remision || '—'}`, 14, y + 13);
  doc.text(`Orden de Compra: ${data.orden_compra || '—'}`, 90, y + 13);
  doc.text(`Tipo de Moneda: ${data.moneda || '—'}`, 14, y + 18);

  y += 24;

  // Información del Receptor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INFORMACIÓN DEL RECEPTOR', 14, y);
  doc.line(14, y + 2, 196, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Señor(es): ${data.cliente_nombre || '—'}`, 14, y + 8);
  doc.text(`RUC: ${data.receptor_ruc || '—'}`, 14, y + 13);
  doc.text(`Dirección: ${data.receptor_direccion || '—'}`, 14, y + 18);

  y += 24;

  // Detalle de Productos/Servicios
  const body = (data.detalles || []).map(d => [
    d.cantidad.toString(),
    'UNIDAD',
    d.nombre || 'Producto',
    `S/ ${d.precio_unitario.toFixed(2)}`,
    '0.00',
  ]);

  if (body.length === 0) body.push(['—', '—', 'Sin productos registrados', '—', '0.00']);

  autoTable(doc, {
    startY: y,
    head: [['Cantidad', 'Unidad de Medida', 'Descripción', 'Valor Unitario', 'ICBPER']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  y = finalY + 8;

  // Resumen de Importes
  const resumenX = 120;
  const labelX = 170;
  const valueX = 196;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN DE IMPORTES', resumenX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const rows: [string, number][] = [
    ['Sub Total Ventas', data.subtotal || 0],
    ['Anticipos', 0],
    ['Descuentos', 0],
    ['Valor Venta', data.valor_venta || 0],
    ['ISC', 0],
    ['IGV', data.igv || 0],
    ['ICBPER', 0],
    ['Otros Cargos', 0],
    ['Otros Tributos', 0],
    ['Monto de redondeo', 0],
  ];

  let rowY = y + 6;
  rows.forEach(([label, value]) => {
    doc.setTextColor(100, 116, 139);
    doc.text(label, labelX, rowY, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.text(`S/ ${Number(value).toFixed(2)}`, valueX, rowY, { align: 'right' });
    rowY += 5;
  });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(11);
  doc.text('Importe Total', labelX, rowY + 2, { align: 'right' });
  doc.text(`S/ ${data.total.toFixed(2)}`, valueX, rowY + 2, { align: 'right' });

  rowY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Valor de Venta de Operaciones Gratuitas: S/ 0.00`, resumenX, rowY);
  rowY += 5;
  if (data.monto_letras) {
    doc.text(`Monto en letras: ${data.monto_letras}`, resumenX, rowY);
  }

  y = rowY + 6;

  // Información de la Detracción
  if (data.detraccion_monto) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('INFORMACIÓN DE LA DETRACCIÓN', 14, y);
    doc.line(14, y + 2, 196, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Leyenda: ${data.detraccion_leyenda || 'Operación sujeta al Sistema de Pago de Obligaciones Tributarias con el Gobierno Central'}`, 14, y + 8);
    doc.text(`Bien o Servicio: ${data.detraccion_bien_servicio || '020 Mantenimiento y reparación de bienes muebles'}`, 14, y + 13);
    doc.text(`Medio de pago: ${data.detraccion_medio_pago || '003 Transferencia de fondos'}`, 14, y + 18);
    doc.text(`Nro. Cta. Banco de la Nación: ${data.detraccion_cta_banco_nacion || '00007003714'}`, 90, y + 8);
    doc.text(`Porcentaje de detracción: ${(data.detraccion_porcentaje || 12).toFixed(2)}`, 14, y + 23);
    doc.text(`Monto detracción: S/ ${(data.detraccion_monto || 0).toFixed(2)}`, 90, y + 23);
    y += 30;
  }

  // Información del Crédito
  if (data.credito_cuotas && data.credito_cuotas.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('INFORMACIÓN DEL CRÉDITO', 14, y);
    doc.line(14, y + 2, 196, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Monto neto pendiente de pago: S/ ${(data.credito_monto_neto || 0).toFixed(2)}`, 14, y + 8);
    doc.text(`Total de Cuotas: ${data.credito_total_cuotas || 0}`, 90, y + 8);

    const cuotasBody = data.credito_cuotas.map(c => [
      c.nro.toString(),
      new Date(c.fecha_vencimiento).toLocaleDateString('es-PE'),
      `S/ ${c.monto.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: y + 12,
      head: [['Nro', 'Fecha Vencimiento', 'Monto']],
      body: cuotasBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc, 285);
  doc.save(`FACTURA_${data.numero_comprobante}.pdf`);
}

export async function generarPdfOrdenPago(data: {
  codigo_op: string;
  proforma_codigo: string;
  cliente_nombre: string;
  monto: number;
  banco: string;
  fecha_creacion: string;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logoBase64 = await loadLogoBase64();

  addHeaderInfo(doc, `ORDEN DE PAGO N° ${data.codigo_op}`, data.fecha_creacion, logoBase64);

  // Datos
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${data.cliente_nombre || 'Cliente'}`, 14, 38);
  doc.text(`Concepto: Pago de Proforma ${data.proforma_codigo}`, 14, 44);
  doc.text(`Banco Destinatario: ${data.banco}`, 14, 50);
  doc.text(`Estado: GENERADA / PENDIENTE`, 14, 56);
  doc.text(`Fecha Emisión: ${new Date(data.fecha_creacion).toLocaleString('es-PE')}`, 14, 62);

  // Un recuadro grande y elegante para el monto a pagar
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 70, 182, 35, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('MONTO A PAGAR:', 20, 80);

  doc.setFontSize(22);
  doc.setTextColor(139, 30, 30); // El color rojo oscuro #8B1E1E
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${data.monto.toFixed(2)}`, 20, 95);

  // Instrucciones de pago
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Instrucciones de Pago:', 14, 120);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`1. Ingrese a la banca móvil de ${data.banco} o acérquese a un agente autorizado.`, 14, 128);
  doc.text(`2. Realice una transferencia o pago de servicio por el monto de S/ ${data.monto.toFixed(2)}.`, 14, 134);
  doc.text(`3. Utilice el código de referencia ${data.codigo_op} e indique el pago de proforma ${data.proforma_codigo}.`, 14, 140);
  doc.text(`4. Una vez procesado, envíe el voucher a su representante comercial para registrar la conformidad.`, 14, 146);

  // Notas y pie
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Este documento sirve como comprobante de trámite de pago iniciado y no constituye una factura o boleta oficial.', 14, 270);
  doc.text('FADICC S.A. - RUC: 20123456789 - Central de Ventas Industriales.', 14, 274);

  addFooter(doc, 285);
  doc.save(`ORDEN_PAGO_${data.codigo_op}.pdf`);
}

