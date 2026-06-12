import { VentaComercial, CajaTurno } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData, INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_USERS } from '@/repositories/localStorageClient';
import { numeroALetras } from './formatoService';
import { getClients, createCliente } from './clienteService';
import { updateProductStock, addMovimientoStock } from './productoService';

// --- CAJA ---

export async function getActiveCaja(vendedorId: string): Promise<CajaTurno | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('caja_turnos')
      .select('*, usuarios(nombre)')
      .eq('vendedor_id', vendedorId)
      .eq('estado', 'ABIERTA')
      .maybeSingle();
    if (!error && data) return { ...data, vendedor_nombre: data.usuarios?.nombre };
  }
  const cajas = getLocalData<CajaTurno[]>('fadicc_cajas', []);
  return cajas.find(c => c.vendedor_id === vendedorId && c.estado === 'ABIERTA') || null;
}

export async function openCaja(vendedorId: string, montoApertura: number): Promise<CajaTurno> {
  const newCaja: Omit<CajaTurno, 'id'> = {
    vendedor_id: vendedorId,
    fecha_apertura: new Date().toISOString(),
    monto_apertura: montoApertura,
    estado: 'ABIERTA',
  };
  if (supabase) {
    const { data, error } = await supabase.from('caja_turnos').insert([newCaja]).select().single();
    if (!error && data) return data;
  }
  const cajas = getLocalData<CajaTurno[]>('fadicc_cajas', []);
  const created: CajaTurno = { ...newCaja, id: 'caja_' + Math.random().toString(36).substr(2, 9) };
  cajas.push(created);
  setLocalData('fadicc_cajas', cajas);
  return created;
}

export async function closeCaja(cajaId: string, montoCierre: number): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase
      .from('caja_turnos')
      .update({ estado: 'CERRADA', fecha_cierre: new Date().toISOString(), monto_cierre: montoCierre })
      .eq('id', cajaId);
    return !error;
  }
  const cajas = getLocalData<CajaTurno[]>('fadicc_cajas', []);
  const updated = cajas.map(c => c.id === cajaId
    ? { ...c, estado: 'CERRADA' as const, fecha_cierre: new Date().toISOString(), monto_cierre: montoCierre }
    : c
  );
  setLocalData('fadicc_cajas', updated);
  return true;
}

// --- CORRELATIVOS ---

export async function getNextCorrelativo(tipo: 'BOLETA' | 'FACTURA'): Promise<string> {
  const serie = tipo === 'BOLETA' ? 'B001' : 'F001';

  if (supabase) {
    const { data, error } = await supabase.rpc('incrementar_correlativo', {
      p_tipo_comprobante: tipo,
      p_serie: serie,
    });
    if (!error && data) {
      return `${serie}-${String(data).padStart(6, '0')}`;
    }
  }

  const key = `fadicc_correlativo_${tipo}`;
  let current = parseInt(localStorage.getItem(key) || '0', 10);
  current += 1;
  localStorage.setItem(key, current.toString());
  return `${serie}-${String(current).padStart(6, '0')}`;
}

// --- VENTAS COMERCIALES ---

export async function registrarVentaDirecta(venta: {
  cliente_id?: string;
  cliente_data?: {
    razon_social_o_nombre: string;
    numero_documento: string;
    direccion: string;
    telefono?: string;
    email?: string;
  };
  registrarCliente?: boolean;
  vendedor_id: string;
  caja_turno_id: string;
  tipo_comprobante: 'BOLETA' | 'FACTURA';
  total: number;
  detalles: { producto_id: string; cantidad: number; precio_unitario: number }[];
  forma_pago?: 'CONTADO' | 'CREDITO';
  moneda?: 'SOLES' | 'DOLARES';
  guia_remision?: string;
  orden_compra?: string;
  descuentos?: number;
  anticipos?: number;
  isc?: number;
  icbper?: number;
  otros_cargos?: number;
  otros_tributos?: number;
  monto_redondeo?: number;
  valor_venta_gratuitas?: number;
  credito_total_cuotas?: number;
  credito_cuotas?: { nro: number; fecha_vencimiento: string; monto: number }[];
}): Promise<string> {
  const numComp = await getNextCorrelativo(venta.tipo_comprobante);

  let clienteId = venta.cliente_id;
  let clienteReal: import('@/types').Cliente | null = null;

  if (venta.tipo_comprobante === 'FACTURA' && (venta.registrarCliente || !clienteId)) {
    if (venta.cliente_data) {
      const existingClients = await getClients();
      const existing = existingClients.find(c => c.numero_documento === venta.cliente_data!.numero_documento);
      if (existing) {
        clienteReal = existing;
        clienteId = existing.id;
      } else {
        const newClient = await createCliente({
          tipo_documento: 'RUC',
          numero_documento: venta.cliente_data.numero_documento,
          razon_social_o_nombre: venta.cliente_data.razon_social_o_nombre,
          direccion: venta.cliente_data.direccion,
          telefono: venta.cliente_data.telefono,
          email: venta.cliente_data.email,
          tipo_cliente: 'EMPRESA',
        });
        clienteReal = newClient;
        clienteId = newClient.id;
      }
    }
  }

  if (!clienteId) throw new Error('Cliente requerido');

  if (!clienteReal) {
    const allClients = await getClients();
    clienteReal = allClients.find(c => c.id === clienteId) || null;
  }

  const total = venta.total;
  const descuentos = venta.descuentos || 0;
  const anticipos = venta.anticipos || 0;
  const subtotal = total / 1.18;
  const igv = total - subtotal;
  const valorVenta = subtotal - descuentos - anticipos;
  const importeTotal = total + (venta.otros_cargos || 0) + (venta.monto_redondeo || 0);

  const enriched: Partial<VentaComercial> = {};
  enriched.forma_pago = venta.forma_pago || 'CONTADO';
  enriched.moneda = venta.moneda || 'SOLES';
  enriched.subtotal = Math.round(subtotal * 100) / 100;
  enriched.igv = Math.round(igv * 100) / 100;
  enriched.monto_letras = numeroALetras(importeTotal);
  enriched.cliente_nombre = clienteReal?.razon_social_o_nombre || venta.cliente_data?.razon_social_o_nombre || 'Cliente';
  enriched.receptor_nombre = clienteReal?.razon_social_o_nombre || venta.cliente_data?.razon_social_o_nombre;
  enriched.receptor_ruc = clienteReal?.numero_documento || venta.cliente_data?.numero_documento;

  if (venta.tipo_comprobante === 'FACTURA') {
    enriched.guia_remision = venta.guia_remision;
    enriched.orden_compra = venta.orden_compra;
    enriched.emisor_razon_social = 'FADICC S.A.';
    enriched.emisor_direccion = 'Av. Industrial 123, Lima, Perú';
    enriched.emisor_ruc = '20123456789';
    enriched.receptor_direccion = clienteReal?.direccion || venta.cliente_data?.direccion;
    enriched.anticipos = anticipos;
    enriched.descuentos = descuentos;
    enriched.valor_venta = Math.round(valorVenta * 100) / 100;
    enriched.isc = venta.isc || 0;
    enriched.icbper = venta.icbper || 0;
    enriched.otros_cargos = venta.otros_cargos || 0;
    enriched.otros_tributos = venta.otros_tributos || 0;
    enriched.monto_redondeo = venta.monto_redondeo || 0;
    enriched.importe_total = Math.round(importeTotal * 100) / 100;
    enriched.valor_venta_gratuitas = venta.valor_venta_gratuitas || 0;

    if (total >= 700) {
      const detraccionMonto = Math.round(total * 0.12 * 100) / 100;
      enriched.detraccion_leyenda = 'Operación sujeta a detracción';
      enriched.detraccion_bien_servicio = 'Bienes';
      enriched.detraccion_medio_pago = 'Depósito en cuenta';
      enriched.detraccion_cta_banco_nacion = '00-000-000000';
      enriched.detraccion_porcentaje = 12;
      enriched.detraccion_monto = detraccionMonto;
    }

    if (venta.forma_pago === 'CREDITO') {
      const detraccionMonto = enriched.detraccion_monto || 0;
      enriched.credito_monto_neto = Math.round((importeTotal - detraccionMonto) * 100) / 100;
      enriched.credito_total_cuotas = venta.credito_total_cuotas || 1;
      enriched.credito_cuotas = venta.credito_cuotas || [];
    }
  }

  if (supabase) {
    const insertPayload: any = {
      cliente_id: clienteId,
      vendedor_id: venta.vendedor_id,
      caja_turno_id: venta.caja_turno_id,
      tipo_comprobante: venta.tipo_comprobante,
      numero_comprobante: numComp,
      total: venta.total,
      fecha_venta: new Date().toISOString(),
      forma_pago: enriched.forma_pago,
      moneda: enriched.moneda,
      subtotal: enriched.subtotal,
      igv: enriched.igv,
      monto_letras: enriched.monto_letras,
      cliente_nombre: enriched.cliente_nombre,
      receptor_nombre: enriched.receptor_nombre,
      receptor_ruc: enriched.receptor_ruc,
    };

    if (venta.tipo_comprobante === 'FACTURA') {
      insertPayload.guia_remision = enriched.guia_remision;
      insertPayload.orden_compra = enriched.orden_compra;
      insertPayload.emisor_razon_social = enriched.emisor_razon_social;
      insertPayload.emisor_direccion = enriched.emisor_direccion;
      insertPayload.emisor_ruc = enriched.emisor_ruc;
      insertPayload.receptor_direccion = enriched.receptor_direccion;
      insertPayload.anticipos = enriched.anticipos;
      insertPayload.descuentos = enriched.descuentos;
      insertPayload.valor_venta = enriched.valor_venta;
      insertPayload.isc = enriched.isc;
      insertPayload.icbper = enriched.icbper;
      insertPayload.otros_cargos = enriched.otros_cargos;
      insertPayload.otros_tributos = enriched.otros_tributos;
      insertPayload.monto_redondeo = enriched.monto_redondeo;
      insertPayload.importe_total = enriched.importe_total;
      insertPayload.valor_venta_gratuitas = enriched.valor_venta_gratuitas;
      insertPayload.detraccion_leyenda = enriched.detraccion_leyenda;
      insertPayload.detraccion_bien_servicio = enriched.detraccion_bien_servicio;
      insertPayload.detraccion_medio_pago = enriched.detraccion_medio_pago;
      insertPayload.detraccion_cta_banco_nacion = enriched.detraccion_cta_banco_nacion;
      insertPayload.detraccion_porcentaje = enriched.detraccion_porcentaje;
      insertPayload.detraccion_monto = enriched.detraccion_monto;
      insertPayload.credito_monto_neto = enriched.credito_monto_neto;
      insertPayload.credito_total_cuotas = enriched.credito_total_cuotas;
      insertPayload.credito_cuotas = enriched.credito_cuotas;
    }

    const { data: ventaDb, error: errVenta } = await supabase
      .from('ventas_comerciales')
      .insert([insertPayload])
      .select()
      .single();

    if (errVenta || !ventaDb) throw new Error('Error al registrar cabecera de venta');

    const { data: productosData } = await supabase.from('productos').select('id, nombre, sku');
    const productosMap = new Map((productosData || []).map((p: any) => [p.id, p]));

    const detallesDb = venta.detalles.map(d => {
      const prod = productosMap.get(d.producto_id);
      return {
        venta_id: ventaDb.id,
        producto_id: d.producto_id,
        nombre: prod?.nombre || 'Producto',
        sku: prod?.sku || '',
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.cantidad * d.precio_unitario,
      };
    });

    await supabase.from('venta_detalles').insert(detallesDb);

    for (const d of venta.detalles) {
      const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', d.producto_id).single();
      if (prod) {
        const cantidadAnterior = prod.stock_actual;
        const cantidadNueva = Math.max(0, cantidadAnterior - d.cantidad);
        await supabase.from('productos').update({ stock_actual: cantidadNueva }).eq('id', d.producto_id);
        await addMovimientoStock({
          producto_id: d.producto_id,
          tipo: 'SALIDA',
          motivo: 'VENTA',
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: cantidadNueva,
          diferencia: -d.cantidad,
          usuario_id: venta.vendedor_id,
          observacion: `Venta ${numComp}`,
        }, true);
      }
    }
    return numComp;
  }

  const products = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
  const clients = getLocalData('fadicc_clientes', INITIAL_CLIENTS);
  const client = clients.find(c => c.id === clienteId);
  const users = INITIAL_USERS;
  const user = users.find(u => u.id === venta.vendedor_id);

  const ventaCompleta: VentaComercial = {
    id: 'venta_' + Math.random().toString(36).substr(2, 9),
    cliente_id: clienteId,
    vendedor_id: venta.vendedor_id,
    caja_turno_id: venta.caja_turno_id,
    tipo_comprobante: venta.tipo_comprobante,
    numero_comprobante: numComp,
    total: venta.total,
    fecha_venta: new Date().toISOString(),
    cliente_nombre: client?.razon_social_o_nombre || venta.cliente_data?.razon_social_o_nombre || 'Cliente',
    vendedor_nombre: user?.nombre || 'Vendedor',
    detalles: venta.detalles.map(d => {
      const prod = products.find(p => p.id === d.producto_id);
      return {
        ...d,
        nombre: prod?.nombre,
        sku: prod?.sku,
        subtotal: d.cantidad * d.precio_unitario,
      };
    }),
    ...enriched,
  };

  for (const d of venta.detalles) {
    const p = products.find(prod => prod.id === d.producto_id);
    if (p) {
      const cantidadAnterior = p.stock_actual;
      p.stock_actual = Math.max(0, p.stock_actual - d.cantidad);
      await addMovimientoStock({
        producto_id: d.producto_id,
        tipo: 'SALIDA',
        motivo: 'VENTA',
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: p.stock_actual,
        diferencia: -d.cantidad,
        usuario_id: venta.vendedor_id,
        observacion: `Venta ${numComp}`,
      }, true);
    }
  }
  setLocalData('fadicc_productos', products);

  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  ventas.unshift(ventaCompleta);
  setLocalData('fadicc_ventas', ventas);

  if (venta.tipo_comprobante === 'FACTURA') {
    const facturasCompletas = getLocalData<VentaComercial[]>('fadicc_facturas_completas', []);
    facturasCompletas.unshift(ventaCompleta);
    setLocalData('fadicc_facturas_completas', facturasCompletas);
  }

  return numComp;
}

export async function getVentasRecientes(cajaId?: string, limit = 20): Promise<VentaComercial[]> {
  if (supabase) {
    let q = supabase.from('ventas_comerciales').select(`
      *,
      clientes(razon_social_o_nombre),
      usuarios(nombre)
    `).order('fecha_venta', { ascending: false }).limit(limit);
    if (cajaId) q = q.eq('caja_turno_id', cajaId);
    const { data, error } = await q;
    if (!error && data) return data.map((v: any) => ({
      ...v,
      cliente_nombre: v.clientes?.razon_social_o_nombre,
      vendedor_nombre: v.usuarios?.nombre,
    }));
  }
  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  return cajaId ? ventas.filter(v => v.caja_turno_id === cajaId).slice(0, limit) : ventas.slice(0, limit);
}

export async function getVentaById(id: string): Promise<VentaComercial | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('ventas_comerciales')
      .select(`
        *,
        clientes(razon_social_o_nombre),
        usuarios(nombre),
        venta_detalles(productos(nombre, sku), cantidad, precio_unitario, subtotal)
      `)
      .eq('id', id)
      .single();
    if (!error && data) {
      return {
        ...data,
        cliente_nombre: data.clientes?.razon_social_o_nombre,
        vendedor_nombre: data.usuarios?.nombre,
        detalles: (data.venta_detalles || []).map((d: any) => ({
          nombre: d.productos?.nombre,
          sku: d.productos?.sku,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
        })),
      };
    }
  }
  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  return ventas.find(v => v.id === id) || null;
}
