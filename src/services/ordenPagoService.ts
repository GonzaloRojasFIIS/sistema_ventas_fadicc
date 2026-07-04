import { OrdenPago } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData } from '@/repositories/localStorageClient';

export async function getOrdenesPago(): Promise<OrdenPago[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orden_pagos')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (!error && data) {
        return data.map((o: any) => ({
          id: o.id,
          proforma_id: o.proforma_id,
          proforma_codigo: o.proforma_codigo,
          cliente_id: o.cliente_id,
          cliente_nombre: o.cliente_nombre,
          monto: Number(o.monto),
          banco: o.banco,
          codigo_op: o.codigo_op,
          fecha_creacion: o.fecha_creacion,
          estado: o.estado,
        }));
      } else if (error) {
        console.warn('[db] Fallback a LocalStorage para ordenes_pago por error:', error.message);
      }
    } catch (e: any) {
      console.warn('[db] Error consultando Supabase ordenes_pago:', e.message);
    }
  }

  // Fallback a localStorage con algunos datos demo
  return getLocalData<OrdenPago[]>('fadicc_ordenes_pago', [
    {
      id: 'op1',
      proforma_id: 'prof1',
      proforma_codigo: 'PROF-2026-0001',
      cliente_id: 'c2',
      cliente_nombre: 'Constructora Horizonte S.A.C.',
      monto: 3140.00,
      banco: 'BCP',
      codigo_op: 'OP-2026-001',
      fecha_creacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      estado: 'GENERADA',
    },
  ]);
}

export async function createOrdenPago(orden: Omit<OrdenPago, 'id' | 'codigo_op' | 'fecha_creacion' | 'estado'>): Promise<OrdenPago> {
  const currentYear = new Date().getFullYear();
  
  // Generar código aleatorio secuencial
  let nextNum = 1;
  try {
    const list = await getOrdenesPago();
    if (list.length > 0) {
      // Intentar extraer el número más alto
      const nums = list.map(o => {
        const parts = o.codigo_op.split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        return isNaN(n) ? 0 : n;
      });
      nextNum = Math.max(...nums) + 1;
    }
  } catch {
    const localList = getLocalData<OrdenPago[]>('fadicc_ordenes_pago', []);
    nextNum = localList.length + 1;
  }
  
  const code = `OP-${currentYear}-${String(nextNum).padStart(3, '0')}`;

  const newOp: OrdenPago = {
    id: 'op_' + Math.random().toString(36).substr(2, 9),
    proforma_id: orden.proforma_id,
    proforma_codigo: orden.proforma_codigo,
    cliente_id: orden.cliente_id,
    cliente_nombre: orden.cliente_nombre,
    monto: orden.monto,
    banco: orden.banco,
    codigo_op: code,
    fecha_creacion: new Date().toISOString(),
    estado: 'GENERADA',
  };

  if (supabase) {
    try {
      const insertPayload = {
        proforma_id: orden.proforma_id,
        proforma_codigo: orden.proforma_codigo,
        cliente_id: orden.cliente_id,
        cliente_nombre: orden.cliente_nombre,
        monto: orden.monto,
        banco: orden.banco,
        codigo_op: code,
        estado: 'GENERADA',
      };

      const { data, error } = await supabase
        .from('orden_pagos')
        .insert([insertPayload])
        .select()
        .single();

      if (error || !data) {
        console.error('[db] Error insertando en Supabase orden_pagos:', error);
        throw new Error('No se pudo guardar la orden de pago en la base de datos');
      }

      return {
        ...newOp,
        id: data.id,
        codigo_op: data.codigo_op,
        fecha_creacion: data.fecha_creacion,
      };
    } catch (e: any) {
      console.error('[db] Excepción al guardar orden de pago en Supabase:', e.message);
      throw e;
    }
  }

  // Guardar en local storage solo si Supabase no está configurado
  const localList = getLocalData<OrdenPago[]>('fadicc_ordenes_pago', []);
  localList.unshift(newOp);
  setLocalData('fadicc_ordenes_pago', localList);
  return newOp;
}
