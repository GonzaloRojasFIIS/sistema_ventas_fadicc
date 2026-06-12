import { OrdenPedido, Proforma } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData } from '@/repositories/localStorageClient';
import { updateProformaEstado, getProformaById } from './proformaService';

export async function getOrders(): Promise<OrdenPedido[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('orden_pedidos')
      .select(`*, proformas(codigo_proforma, total, clientes(razon_social_o_nombre))`)
      .order('fecha_aprobacion', { ascending: false });

    if (!error && data) {
      return data.map((o: any) => ({
        id: o.id,
        proforma_id: o.proforma_id,
        codigo_pedido: o.codigo_pedido,
        estado_produccion: o.estado_produccion,
        fecha_aprobacion: o.fecha_aprobacion,
        fecha_entrega_estimada: o.fecha_entrega_estimada,
        fecha_entrega_real: o.fecha_entrega_real,
        cliente_nombre: o.proformas?.clientes?.razon_social_o_nombre || 'Cliente',
        codigo_proforma: o.proformas?.codigo_proforma || '',
        total: o.proformas?.total || 0,
      }));
    }
  }

  return getLocalData<OrdenPedido[]>('fadicc_ordenes', [
    {
      id: 'ord1',
      proforma_id: 'prof1',
      codigo_pedido: 'PED-2026-0001',
      estado_produccion: 'EN_PRODUCCION',
      fecha_aprobacion: new Date().toISOString(),
      fecha_entrega_estimada: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      cliente_nombre: 'Constructora Horizonte S.A.C.',
      codigo_proforma: 'PROF-2026-0001',
      total: 3140.00,
    },
  ]);
}

export async function convertToOrder(proformaId: string, proformaData?: Partial<Proforma>): Promise<OrdenPedido | null> {
  const codigo_pedido = 'PED-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const newOrder: Omit<OrdenPedido, 'id'> = {
    proforma_id: proformaId,
    codigo_pedido,
    estado_produccion: 'EN_PRODUCCION',
    fecha_aprobacion: new Date().toISOString(),
    fecha_entrega_estimada: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  };

  let pf = proformaData;
  if (!pf) {
    const fullPf = await getProformaById(proformaId);
    if (fullPf) pf = fullPf;
  }
  const orderPayload = {
    ...newOrder,
    cliente_nombre: pf?.cliente_nombre || 'Cliente',
    codigo_proforma: pf?.codigo_proforma || '',
    total: pf?.total || 0,
  };

  if (supabase) {
    await supabase.from('proformas').update({ estado: 'APROBADA' }).eq('id', proformaId);
    const { data, error } = await supabase.from('orden_pedidos').insert([orderPayload]).select().single();
    if (!error && data) return data;
  }

  await updateProformaEstado(proformaId, 'APROBADA');

  const orders = getLocalData<OrdenPedido[]>('fadicc_ordenes', []);
  const created: OrdenPedido = {
    ...orderPayload,
    id: 'ord_' + Math.random().toString(36).substr(2, 9),
  };
  orders.unshift(created);
  setLocalData('fadicc_ordenes', orders);
  return created;
}

export async function updateOrderStatus(id: string, nuevoEstado: OrdenPedido['estado_produccion']): Promise<boolean> {
  if (supabase) {
    const update: any = { estado_produccion: nuevoEstado };
    if (nuevoEstado === 'ENTREGADO') update.fecha_entrega_real = new Date().toISOString();
    const { error } = await supabase.from('orden_pedidos').update(update).eq('id', id);
    return !error;
  }
  const orders = getLocalData<OrdenPedido[]>('fadicc_ordenes', []);
  const updated = orders.map(o => o.id === id
    ? { ...o, estado_produccion: nuevoEstado, ...(nuevoEstado === 'ENTREGADO' ? { fecha_entrega_real: new Date().toISOString() } : {}) }
    : o
  );
  setLocalData('fadicc_ordenes', updated);
  return true;
}

export async function getEstadisticasProduccion(): Promise<{ tiempo_promedio_fabricacion: number; entregados_mes: number; en_riesgo: number }> {
  const orders = await getOrders();
  const entregadosMes = orders.filter(o => o.estado_produccion === 'ENTREGADO');
  const enProceso = orders.filter(o => o.estado_produccion !== 'ENTREGADO');
  const riesgo = enProceso.filter(o => {
    if (!o.fecha_entrega_estimada) return false;
    return new Date(o.fecha_entrega_estimada) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  });
  return {
    tiempo_promedio_fabricacion: 12,
    entregados_mes: entregadosMes.length,
    en_riesgo: riesgo.length,
  };
}
