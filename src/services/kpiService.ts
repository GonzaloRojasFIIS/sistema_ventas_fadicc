import { KpiData, VentaPorDia, TopProducto, Actividad, VendedorPerformance, MetasConfig, Producto, VentaComercial, Proforma, OrdenPedido, Usuario } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData, INITIAL_PRODUCTS, INITIAL_USERS } from '@/repositories/localStorageClient';
import { getProducts } from './productoService';
import { getProformas } from './proformaService';
import { getOrders } from './ordenService';
import { getUsuarios } from './usuarioService';
import { getVentasRecientes } from './ventaService';

// --- KPIs DINÁMICOS ---

export async function getKpis(): Promise<KpiData> {
  const hoyStart = new Date(); hoyStart.setHours(0, 0, 0, 0);
  const ayerStart = new Date(hoyStart); ayerStart.setDate(ayerStart.getDate() - 1);
  const mesStart = new Date(hoyStart); mesStart.setDate(1);

  if (supabase) {
    const [ventasHoy, ventasAyer, ventasMes, proformasAll, ordenes, productosAll, metas] = await Promise.all([
      supabase.from('ventas_comerciales').select('total').gte('fecha_venta', hoyStart.toISOString()),
      supabase.from('ventas_comerciales').select('total').gte('fecha_venta', ayerStart.toISOString()).lt('fecha_venta', hoyStart.toISOString()),
      supabase.from('ventas_comerciales').select('total').gte('fecha_venta', mesStart.toISOString()),
      supabase.from('proformas').select('estado'),
      supabase.from('orden_pedidos').select('id, estado_produccion, proformas(total)').neq('estado_produccion', 'ENTREGADO'),
      supabase.from('productos').select('stock_actual, stock_minimo, precio_base, costo'),
      supabase.from('metas_config').select('meta_mensual').eq('tipo', 'ventas').maybeSingle(),
    ]);

    const totalComercial = (ventasHoy.data || []).reduce((s: number, v: any) => s + v.total, 0);
    const countComercial = (ventasHoy.data || []).length;
    const totalAyer = (ventasAyer.data || []).reduce((s: number, v: any) => s + v.total, 0);
    const totalMes = (ventasMes.data || []).reduce((s: number, v: any) => s + v.total, 0);
    const allProfs = proformasAll.data || [];
    const aprobadas = allProfs.filter((p: any) => p.estado === 'APROBADA').length;
    const tasaConv = allProfs.length > 0 ? Math.round((aprobadas / allProfs.length) * 100) : 0;
    const totalIndustrial = (ordenes.data || []).reduce((s: number, o: any) => s + (o.proformas?.total || 0), 0);
    const bajosStock = (productosAll.data || []).filter((p: any) => p.stock_actual <= p.stock_minimo).length;
    const productosConCosto = (productosAll.data || []).filter((p: any) => p.costo && p.precio_base > 0);
    const margenPromedio = productosConCosto.length > 0
      ? productosConCosto.reduce((s: number, p: any) => s + ((p.precio_base - p.costo) / p.precio_base) * 100, 0) / productosConCosto.length
      : 0;
    const metaMensual = metas.data?.meta_mensual || 50000;

    return {
      venta_comercial_hoy: totalComercial,
      venta_comercial_ayer: totalAyer,
      venta_industrial_activa: totalIndustrial,
      tasa_conversion_proformas: tasaConv,
      proformas_total: allProfs.length,
      proformas_aprobadas: aprobadas,
      proformas_vencidas: allProfs.filter((p: any) => p.estado === 'EXPIRADA').length,
      productos_bajo_minimo: bajosStock,
      ventas_hoy_count: countComercial,
      ordenes_activas: (ordenes.data || []).length,
      ticket_promedio: countComercial > 0 ? totalComercial / countComercial : 0,
      margen_bruto_estimado: Math.round(margenPromedio * 10) / 10,
      meta_mensual: metaMensual,
      real_mensual: totalMes,
    };
  }

  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  const ventasHoy = ventas.filter(v => new Date(v.fecha_venta) >= hoyStart);
  const ventasAyer = ventas.filter(v => { const d = new Date(v.fecha_venta); return d >= ayerStart && d < hoyStart; });
  const ventasMes = ventas.filter(v => new Date(v.fecha_venta) >= mesStart);
  const proformas = getLocalData<Proforma[]>('fadicc_proformas', []);
  const proformasAprobadas = proformas.filter(p => p.estado === 'APROBADA');
  const ordenes = getLocalData<OrdenPedido[]>('fadicc_ordenes', []);
  const ordenesActivas = ordenes.filter(o => o.estado_produccion !== 'ENTREGADO');
  const productos = getLocalData<Producto[]>('fadicc_productos', INITIAL_PRODUCTS);
  const bajoMinimo = productos.filter(p => p.stock_actual <= p.stock_minimo);
  const productosConCosto = productos.filter(p => p.costo && p.precio_base > 0);
  const margenPromedio = productosConCosto.length > 0
    ? productosConCosto.reduce((s, p) => s + ((p.precio_base - p.costo!) / p.precio_base) * 100, 0) / productosConCosto.length
    : 0;
  const metas = getLocalData<MetasConfig>('fadicc_metas_config', { vendedor: 5000, representante: 8000 });
  const metaMensual = (metas as any)?.meta_mensual || 50000;

  const totalComercial = ventasHoy.reduce((s, v) => s + v.total, 0);
  const countComercial = ventasHoy.length;
  const ticketPromedio = countComercial > 0 ? totalComercial / countComercial : 0;

  return {
    venta_comercial_hoy: totalComercial,
    venta_comercial_ayer: ventasAyer.reduce((s, v) => s + v.total, 0),
    venta_industrial_activa: ordenesActivas.reduce((s, o) => s + (o.total || 0), 0),
    tasa_conversion_proformas: proformas.length > 0 ? Math.round((proformasAprobadas.length / proformas.length) * 100) : 0,
    proformas_total: proformas.length,
    proformas_aprobadas: proformasAprobadas.length,
    proformas_vencidas: proformas.filter(p => p.estado === 'EXPIRADA').length,
    productos_bajo_minimo: bajoMinimo.length,
    ventas_hoy_count: countComercial,
    ordenes_activas: ordenesActivas.length,
    ticket_promedio: ticketPromedio,
    margen_bruto_estimado: Math.round(margenPromedio * 10) / 10,
    meta_mensual: metaMensual,
    real_mensual: ventasMes.reduce((s, v) => s + v.total, 0),
  };
}

// --- GRÁFICOS Y REPORTES ---

export async function getVentasPorDia(): Promise<VentaPorDia[]> {
  const dias = 7;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(hoy); inicio.setDate(inicio.getDate() - (dias - 1));
  const data: VentaPorDia[] = [];

  if (supabase) {
    const { data: ventas } = await supabase
      .from('ventas_comerciales')
      .select('total, fecha_venta, tipo_comprobante')
      .gte('fecha_venta', inicio.toISOString());
    const { data: proformas } = await supabase
      .from('proformas')
      .select('total, fecha_emision')
      .gte('fecha_emision', inicio.toISOString());
    const ventasArr = ventas || [];
    const profsArr = proformas || [];

    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      const comercial = ventasArr
        .filter((v: any) => v.fecha_venta && v.fecha_venta.startsWith(dStr))
        .reduce((s: number, v: any) => s + v.total, 0);
      const industrial = profsArr
        .filter((p: any) => p.fecha_emision && p.fecha_emision.startsWith(dStr))
        .reduce((s: number, p: any) => s + p.total, 0);
      data.push({ fecha: label, comercial, industrial });
    }
    return data;
  }

  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  const proformas = getLocalData<Proforma[]>('fadicc_proformas', []);
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    const comercial = ventas
      .filter(v => v.fecha_venta && v.fecha_venta.startsWith(dStr))
      .reduce((s, v) => s + v.total, 0);
    const industrial = proformas
      .filter(p => p.fecha_emision && p.fecha_emision.startsWith(dStr))
      .reduce((s, p) => s + p.total, 0);
    data.push({ fecha: label, comercial, industrial });
  }
  return data;
}

export async function getTopProductos(): Promise<TopProducto[]> {
  if (supabase) {
    const { data: detalles } = await supabase
      .from('venta_detalles')
      .select('producto_id, cantidad, subtotal, productos(nombre, stock_actual)');
    if (detalles && detalles.length > 0) {
      const agrupado: Record<string, { nombre: string; unidades: number; ingreso: number; stock_restante: number }> = {};
      for (const d of detalles as any[]) {
        const pid = d.producto_id;
        const nombre = d.productos?.nombre || 'Producto';
        const stock = d.productos?.stock_actual || 0;
        if (!agrupado[pid]) agrupado[pid] = { nombre, unidades: 0, ingreso: 0, stock_restante: stock };
        agrupado[pid].unidades += d.cantidad || 0;
        agrupado[pid].ingreso += d.subtotal || 0;
      }
      return Object.values(agrupado)
        .sort((a, b) => b.ingreso - a.ingreso)
        .slice(0, 5);
    }
  }
  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  const productos = getLocalData<Producto[]>('fadicc_productos', INITIAL_PRODUCTS);
  const agrupado: Record<string, { nombre: string; unidades: number; ingreso: number; stock_restante: number }> = {};
  for (const v of ventas) {
    for (const d of v.detalles || []) {
      const pid = d.producto_id;
      const prod = productos.find(p => p.id === pid);
      if (!agrupado[pid]) agrupado[pid] = { nombre: d.nombre || prod?.nombre || 'Producto', unidades: 0, ingreso: 0, stock_restante: prod?.stock_actual || 0 };
      agrupado[pid].unidades += d.cantidad;
      agrupado[pid].ingreso += d.subtotal;
    }
  }
  return Object.values(agrupado).sort((a, b) => b.ingreso - a.ingreso).slice(0, 5);
}

export async function getActividadReciente(): Promise<Actividad[]> {
  const actividades: Actividad[] = [];
  if (supabase) {
    const [ventas, proformas, ordenes, movimientos] = await Promise.all([
      supabase.from('ventas_comerciales').select('id, numero_comprobante, total, fecha_venta, usuarios(nombre)').order('fecha_venta', { ascending: false }).limit(5),
      supabase.from('proformas').select('id, codigo_proforma, estado, fecha_emision, clientes(razon_social_o_nombre), usuarios!proformas_representante_id_fkey(nombre)').order('fecha_emision', { ascending: false }).limit(3),
      supabase.from('orden_pedidos').select('id, codigo_pedido, estado_produccion, fecha_aprobacion').order('fecha_aprobacion', { ascending: false }).limit(3),
      supabase.from('movimientos_stock').select('id, productos(nombre), cantidad_nueva, cantidad_anterior, fecha, usuarios(nombre)').order('fecha', { ascending: false }).limit(3),
    ]);
    for (const v of (ventas.data || []) as any[]) {
      actividades.push({
        id: v.id,
        tipo: 'venta',
        descripcion: `Venta ${v.numero_comprobante || 'N/A'} por S/ ${v.total?.toFixed(2) || '0.00'}`,
        usuario: v.usuarios?.nombre || 'Vendedor',
        timestamp: v.fecha_venta,
      });
    }
    for (const p of (proformas.data || []) as any[]) {
      actividades.push({
        id: p.id,
        tipo: 'proforma',
        descripcion: `Proforma ${p.codigo_proforma} ${p.estado?.toLowerCase().replace(/_/g, ' ')} — ${p.clientes?.razon_social_o_nombre || 'Cliente'}`,
        usuario: p.usuarios?.nombre || 'Representante',
        timestamp: p.fecha_emision,
      });
    }
    for (const o of (ordenes.data || []) as any[]) {
      actividades.push({
        id: o.id,
        tipo: 'pedido',
        descripcion: `Pedido ${o.codigo_pedido} pasó a "${o.estado_produccion?.replace(/_/g, ' ')}"`,
        usuario: 'Producción',
        timestamp: o.fecha_aprobacion,
      });
    }
    for (const m of (movimientos.data || []) as any[]) {
      const diff = (m.cantidad_nueva || 0) - (m.cantidad_anterior || 0);
      actividades.push({
        id: m.id,
        tipo: 'stock',
        descripcion: `Stock: ${m.productos?.nombre || 'Producto'} ajustado a ${m.cantidad_nueva} (${diff > 0 ? '+' : ''}${diff})`,
        usuario: m.usuarios?.nombre || 'Almacén',
        timestamp: m.fecha,
      });
    }
    return actividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }

  const ventasLocal = getLocalData<VentaComercial[]>('fadicc_ventas', []).slice(-5);
  const proformasLocal = getLocalData<Proforma[]>('fadicc_proformas', []).slice(-3);
  const ordenesLocal = getLocalData<OrdenPedido[]>('fadicc_ordenes', []).slice(-3);
  for (const v of ventasLocal) {
    actividades.push({ id: v.id, tipo: 'venta', descripcion: `Venta ${v.numero_comprobante || 'N/A'} por S/ ${v.total?.toFixed(2) || '0.00'}`, usuario: v.vendedor_nombre || 'Vendedor', timestamp: v.fecha_venta });
  }
  for (const p of proformasLocal) {
    actividades.push({ id: p.id, tipo: 'proforma', descripcion: `Proforma ${p.codigo_proforma} — ${p.cliente_nombre || 'Cliente'}`, usuario: p.representante_nombre || 'Representante', timestamp: p.fecha_emision });
  }
  for (const o of ordenesLocal) {
    actividades.push({ id: o.id, tipo: 'pedido', descripcion: `Pedido ${o.codigo_pedido} pasó a "${o.estado_produccion?.replace(/_/g, ' ')}"`, usuario: 'Producción', timestamp: o.fecha_aprobacion || new Date().toISOString() });
  }
  return actividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
}

export async function getVendedoresPerformance(): Promise<VendedorPerformance[]> {
  if (supabase) {
    const mesStart = new Date(); mesStart.setDate(1); mesStart.setHours(0, 0, 0, 0);
    const { data: ventas } = await supabase
      .from('ventas_comerciales')
      .select('vendedor_id, total, usuarios(nombre, rol)')
      .gte('fecha_venta', mesStart.toISOString());
    const { data: metas } = await supabase
      .from('metas_config')
      .select('tipo, meta_mensual')
      .eq('tipo', 'ventas')
      .maybeSingle();
    const metaMensual = metas?.meta_mensual || 50000;
    const usuariosArr = await getUsuarios();
    const vendedores = usuariosArr.filter(u => ['VENDEDOR', 'REPRESENTANTE', 'ADMIN'].includes(u.rol));
    const porVendedor: Record<string, { nombre: string; real: number; meta: number }> = {};
    for (const v of (ventas || []) as any[]) {
      const vid = v.vendedor_id;
      const nombre = v.usuarios?.nombre || 'Usuario';
      if (!porVendedor[vid]) porVendedor[vid] = { nombre, real: 0, meta: metaMensual };
      porVendedor[vid].real += v.total || 0;
    }
    for (const u of vendedores) {
      if (!porVendedor[u.id]) porVendedor[u.id] = { nombre: u.nombre, real: 0, meta: metaMensual };
    }
    return Object.values(porVendedor).map(v => ({
      nombre: v.nombre,
      meta: v.meta,
      real: Math.round(v.real * 100) / 100,
      porcentaje: v.meta > 0 ? Math.round((v.real / v.meta) * 100) : 0,
    })).sort((a, b) => b.real - a.real);
  }

  const mesStart = new Date(); mesStart.setDate(1); mesStart.setHours(0, 0, 0, 0);
  const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []).filter(v => new Date(v.fecha_venta) >= mesStart);
  const usuarios = getLocalData<Usuario[]>('fadicc_usuarios', INITIAL_USERS);
  const vendedores = usuarios.filter(u => ['VENDEDOR', 'REPRESENTANTE', 'ADMIN'].includes(u.rol));
  const metas = getLocalData<MetasConfig>('fadicc_metas_config', { vendedor: 5000, representante: 8000 });
  const metaMensual = (metas as any)?.meta_mensual || 50000;
  const porVendedor: Record<string, { nombre: string; real: number; meta: number }> = {};
  for (const v of ventas) {
    if (!porVendedor[v.vendedor_id]) {
      const u = usuarios.find(x => x.id === v.vendedor_id);
      porVendedor[v.vendedor_id] = { nombre: u?.nombre || v.vendedor_nombre || 'Usuario', real: 0, meta: metaMensual };
    }
    porVendedor[v.vendedor_id].real += v.total;
  }
  for (const u of vendedores) {
    if (!porVendedor[u.id]) porVendedor[u.id] = { nombre: u.nombre, real: 0, meta: metaMensual };
  }
  return Object.values(porVendedor).map(v => ({
    nombre: v.nombre,
    meta: v.meta,
    real: Math.round(v.real * 100) / 100,
    porcentaje: v.meta > 0 ? Math.round((v.real / v.meta) * 100) : 0,
  })).sort((a, b) => b.real - a.real);
}

// --- METAS CONFIG ---

export async function getMetasConfig(): Promise<MetasConfig> {
  return getLocalData<MetasConfig>('fadicc_metas_config', { vendedor: 5000, representante: 8000 });
}

export async function setMetasConfig(config: MetasConfig): Promise<void> {
  setLocalData('fadicc_metas_config', config);
}

export async function getMetaDiaria(): Promise<{ meta_comercial: number; meta_industrial: number; fecha: string }> {
  return { meta_comercial: 5000, meta_industrial: 8000, fecha: new Date().toISOString() };
}
