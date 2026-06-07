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

function addLogoAndHeader(doc: jsPDF, titulo: string, fecha: string) {
  // Logo placeholder (texto grande como logo)
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.text('FADICC S.A.', 14, 20);

  // Subtítulo
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Fabricación de Cocinas Industriales y Domésticas', 14, 26);
  doc.text('RUC: 20548796321 | Lima, Perú', 14, 30);

  // Título del documento
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(titulo, 196, 20, { align: 'right' });

  // Fecha
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha emisión: ${new Date(fecha).toLocaleDateString('es-PE')}`, 196, 26, { align: 'right' });

  // Línea separadora
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);
}

function addFooter(doc: jsPDF, y: number) {
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('FADICC S.A. - Documento generado electrónicamente - www.fadicc.com.pe', 105, y, { align: 'center' });
  doc.text('Gracias por su preferencia', 105, y + 4, { align: 'center' });
}

export function generarPdfVenta(data: VentaPdfData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const tipoLabel = data.tipo_comprobante === 'BOLETA' ? 'BOLETA DE VENTA' : 'FACTURA';

  addLogoAndHeader(doc, `${tipoLabel} N° ${data.numero_comprobante}`, data.fecha_venta);

  // Datos del cliente y vendedor
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Cliente: ${data.cliente_nombre || 'Cliente General'}`, 14, 44);
  doc.text(`Vendedor: ${data.vendedor_nombre || 'Vendedor'}`, 14, 49);

  // Tabla de productos
  const body = (data.detalles || []).map((d) => [
    d.sku || '—',
    d.nombre || 'Producto',
    d.cantidad.toString(),
    `S/ ${d.precio_unitario.toFixed(2)}`,
    `S/ ${(d.cantidad * d.precio_unitario).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['SKU', 'Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22], // orange-500
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
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
  doc.text('Subtotal:', 150, finalY + 10, { align: 'right' });
  doc.text('IGV (18%):', 150, finalY + 16, { align: 'right' });
  doc.text('TOTAL:', 150, finalY + 24, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`S/ ${subtotal.toFixed(2)}`, 190, finalY + 10, { align: 'right' });
  doc.text(`S/ ${igv.toFixed(2)}`, 190, finalY + 16, { align: 'right' });

  doc.setFontSize(12);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${data.total.toFixed(2)}`, 190, finalY + 24, { align: 'right' });

  addFooter(doc, 285);
  doc.save(`${tipoLabel}_${data.numero_comprobante}.pdf`);
}

export function generarPdfProforma(data: ProformaPdfData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  addLogoAndHeader(doc, `PROFORMA N° ${data.codigo_proforma}`, data.fecha_emision);

  // Datos
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Cliente: ${data.cliente_nombre || 'Cliente'}`, 14, 44);
  doc.text(`Representante: ${data.representante_nombre || 'Representante'}`, 14, 49);
  doc.text(`Estado: ${data.estado}`, 14, 54);
  doc.text(`Válida hasta: ${new Date(data.fecha_vencimiento).toLocaleDateString('es-PE')}`, 14, 59);

  // Tabla
  const body = (data.detalles || []).map((d) => [
    d.sku || '—',
    d.nombre || 'Producto',
    d.cantidad.toString(),
    `S/ ${d.precio_pactado.toFixed(2)}`,
    `S/ ${d.subtotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['SKU', 'Producto', 'Cant.', 'Precio Pactado', 'Subtotal']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: [255, 255, 255],
      fontSize: 9,
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
  doc.text('TOTAL:', 150, finalY + 10, { align: 'right' });

  doc.setFontSize(13);
  doc.setTextColor(59, 130, 246); // blue-600
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${data.total.toFixed(2)}`, 190, finalY + 10, { align: 'right' });

  // Notas legales
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Esta proforma tiene una validez de 15 días calendario desde su fecha de emisión.', 14, finalY + 22);
  doc.text('Los precios pueden variar sin previo aviso después de la fecha de vencimiento.', 14, finalY + 26);
  doc.text('Para convertir en pedido, contacte a su representante asignado.', 14, finalY + 30);

  addFooter(doc, 285);
  doc.save(`PROFORMA_${data.codigo_proforma}.pdf`);
}
