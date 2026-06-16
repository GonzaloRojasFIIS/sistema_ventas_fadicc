import { Proforma, ProformaDetalle } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData } from '@/repositories/localStorageClient';
import { getClients } from './clienteService';
import { getUsuarios } from './usuarioService';

export async function getProformas(): Promise<Proforma[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('proformas')
      .select(`*, clientes(razon_social_o_nombre), usuarios!proformas_representante_id_fkey(nombre), proforma_detalles(*, productos(nombre, sku))`)
      .order('fecha_emision', { ascending: false });

    if (!error && data) {
      return data.map((p: any) => ({
        ...p,
        cliente_nombre: p.clientes?.razon_social_o_nombre || 'Cliente',
        representante_nombre: p.usuarios?.nombre || 'Representante',
        detalles: p.proforma_detalles ? p.proforma_detalles.map((d: any) => ({
          producto_id: d.producto_id,
          nombre: d.nombre || d.productos?.nombre || 'Producto',
          sku: d.sku || d.productos?.sku || '',
          cantidad: d.cantidad,
          precio_pactado: d.precio_pactado,
          subtotal: d.subtotal,
        })) : [],
      }));
    }
  }

  return getLocalData<Proforma[]>('fadicc_proformas', [
    {
      id: 'prof1',
      cliente_id: 'c2',
      cliente_nombre: 'Constructora Horizonte S.A.C.',
      representante_id: 'u3',
      representante_nombre: 'Ana Representante',
      codigo_proforma: 'PROF-2026-0001',
      estado: 'PENDIENTE',
      fecha_emision: new Date().toISOString(),
      fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      total: 3140.00,
      detalles: [
        { producto_id: 'p1', sku: 'COC-IND-04', nombre: 'Cocina Industrial 4 Hornillas', cantidad: 2, precio_pactado: 1200.00, subtotal: 2400.00 },
        { producto_id: 'p3', sku: 'COC-COM-04', nombre: 'Cocina Semi-Industrial 4 Hornillas', cantidad: 1, precio_pactado: 740.00, subtotal: 740.00 },
      ],
    },
    {
      id: 'prof2',
      cliente_id: 'c3',
      cliente_nombre: 'Hoteles del Perú S.A.',
      representante_id: 'u3',
      representante_nombre: 'Ana Representante',
      codigo_proforma: 'PROF-2026-0002',
      estado: 'EN_NEGOCIACION',
      fecha_emision: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      fecha_vencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      total: 9450.00,
      detalles: [
        { producto_id: 'p2', sku: 'COC-IND-06', nombre: 'Cocina Industrial 6 Hornillas', cantidad: 5, precio_pactado: 1890.00, subtotal: 9450.00 },
      ],
    },
  ]);
}

export async function createProforma(proforma: Omit<Proforma, 'id' | 'codigo_proforma' | 'estado' | 'fecha_emision'> & { detalles: ProformaDetalle[] }): Promise<Proforma> {
  const code = 'PROF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const newProf: Proforma = {
    id: 'prof_' + Math.random().toString(36).substr(2, 9),
    ...proforma,
    codigo_proforma: code,
    estado: 'PENDIENTE',
    fecha_emision: new Date().toISOString(),
  };

  if (supabase) {
    try {
      // Solo buscar cliente/representante si no se pasó el nombre
      let clienteNombre = proforma.cliente_nombre;
      let clienteEmail = proforma.cliente_email;
      let representanteNombre = proforma.representante_nombre;

      if (!clienteNombre || !representanteNombre) {
        try {
          const [clients, users] = await Promise.all([getClients(), getUsuarios()]);
          const client = clients.find(c => c.id === proforma.cliente_id);
          const rep = users.find(u => u.id === proforma.representante_id);
          clienteNombre = clienteNombre || client?.razon_social_o_nombre || undefined;
          clienteEmail = clienteEmail || client?.email || undefined;
          representanteNombre = representanteNombre || rep?.nombre || undefined;
        } catch {
          // Silencioso: usar valores ya disponibles
        }
      }

      const insertPayload: any = {
        cliente_id: proforma.cliente_id,
        representante_id: proforma.representante_id,
        codigo_proforma: code,
        estado: 'PENDIENTE',
        fecha_vencimiento: proforma.fecha_vencimiento,
        total: proforma.total,
      };
      if (proforma.contacto_id) insertPayload.contacto_id = proforma.contacto_id;
      if (proforma.contacto_nombre) insertPayload.contacto_nombre = proforma.contacto_nombre;
      if (proforma.contacto_email) insertPayload.contacto_email = proforma.contacto_email;
      if (clienteNombre) insertPayload.cliente_nombre = clienteNombre;
      if (clienteEmail) insertPayload.cliente_email = clienteEmail;
      if (representanteNombre) insertPayload.representante_nombre = representanteNombre;

      const { data: profDb, error: errProf } = await supabase
        .from('proformas')
        .insert([insertPayload])
        .select()
        .single();

      if (errProf) {
        console.error('[db] Error insertando proforma:', errProf.message, errProf.details, errProf.hint);
        throw new Error(`Error al guardar la proforma: ${errProf.message}`);
      }
      if (!profDb) {
        throw new Error('Error al guardar la proforma: no se recibió respuesta de la base de datos');
      }

      const detDb = proforma.detalles.map(d => ({
        proforma_id: profDb.id,
        producto_id: d.producto_id,
        nombre: d.nombre || null,
        sku: d.sku || null,
        cantidad: d.cantidad,
        precio_pactado: d.precio_pactado,
        subtotal: d.subtotal,
      }));

      const { error: errDet } = await supabase.from('proforma_detalles').insert(detDb);
      if (errDet) {
        console.error('[db] Error insertando proforma_detalles:', errDet.message, errDet.details);
        // No lanzamos error aquí para no perder la proforma creada
      }

      return { ...newProf, id: profDb.id };
    } catch (err: any) {
      console.error('[db] createProforma error:', err?.message || err);
      throw err;
    }
  }

  const currentProfs = getLocalData<Proforma[]>('fadicc_proformas', []);
  currentProfs.unshift(newProf);
  setLocalData('fadicc_proformas', currentProfs);
  return newProf;
}

export async function updateProformaEstado(id: string, nuevoEstado: Proforma['estado']): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('proformas').update({ estado: nuevoEstado }).eq('id', id);
    return !error;
  }
  const profs = getLocalData<Proforma[]>('fadicc_proformas', []);
  const updated = profs.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p);
  setLocalData('fadicc_proformas', updated);
  return true;
}

export async function getProformaById(id: string): Promise<Proforma | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('proformas')
      .select(`*, clientes(razon_social_o_nombre), usuarios!proformas_representante_id_fkey(nombre), proforma_detalles(*, productos(nombre, sku))`)
      .eq('id', id)
      .single();

    if (!error && data) {
      return {
        ...data,
        cliente_nombre: data.clientes?.razon_social_o_nombre || 'Cliente',
        representante_nombre: data.usuarios?.nombre || 'Representante',
        detalles: data.proforma_detalles ? data.proforma_detalles.map((d: any) => ({
          producto_id: d.producto_id,
          nombre: d.productos?.nombre || 'Producto',
          sku: d.productos?.sku || '',
          cantidad: d.cantidad,
          precio_pactado: d.precio_pactado,
          subtotal: d.subtotal,
        })) : [],
      };
    }
  }
  const profs = getLocalData<Proforma[]>('fadicc_proformas', []);
  return profs.find(p => p.id === id) || null;
}

export async function getProformasVencidas(): Promise<Proforma[]> {
  const profs = await getProformas();
  const now = new Date().toISOString();
  return profs.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_NEGOCIACION').filter(p => p.fecha_vencimiento < now);
}

export async function getProformasByRepresentante(representanteId: string, limit = 100): Promise<Proforma[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('proformas')
      .select(`
        *,
        clientes(razon_social_o_nombre),
        usuarios!proformas_representante_id_fkey(nombre),
        proforma_detalles(*, productos(nombre, sku))
      `)
      .eq('representante_id', representanteId)
      .order('fecha_emision', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data.map((p: any) => ({
        ...p,
        cliente_nombre: p.clientes?.razon_social_o_nombre || 'Cliente',
        representante_nombre: p.usuarios?.nombre || 'Representante',
        detalles: p.proforma_detalles ? p.proforma_detalles.map((d: any) => ({
          producto_id: d.producto_id,
          nombre: d.productos?.nombre || 'Producto',
          sku: d.productos?.sku || '',
          cantidad: d.cantidad,
          precio_pactado: d.precio_pactado,
          subtotal: d.subtotal,
        })) : [],
      }));
    }
  }

  const profs = getLocalData<Proforma[]>('fadicc_proformas', []);
  return profs.filter(p => p.representante_id === representanteId).slice(0, limit);
}
