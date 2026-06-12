import { Cliente, Empresa, Contacto, Proforma, VentaComercial } from '@/types';
import { supabase } from '@/repositories/supabaseClient';
import { getLocalData, setLocalData, INITIAL_CLIENTS, INITIAL_EMPRESAS, INITIAL_CONTACTOS } from '@/repositories/localStorageClient';

// --- CLIENTES ---

export async function getClients(): Promise<Cliente[]> {
  let supabaseClients: Cliente[] = [];
  if (supabase) {
    const { data, error } = await supabase.from('clientes').select('*').order('razon_social_o_nombre');
    if (!error && data) supabaseClients = data;
  }
  const local = getLocalData<Cliente[]>('fadicc_clientes', []);
  const mapa = new Map<string, Cliente>();
  for (const c of supabaseClients) mapa.set(c.id, c);
  for (const c of local) if (!mapa.has(c.id)) mapa.set(c.id, c);
  const merged = Array.from(mapa.values());
  return merged.length > 0 ? merged : INITIAL_CLIENTS;
}

export async function searchClienteByDoc(query: string): Promise<Cliente[]> {
  const allClients = await getClients();
  const q = query.toLowerCase().trim();
  return allClients.filter(c =>
    c.numero_documento.includes(q) ||
    c.razon_social_o_nombre.toLowerCase().includes(q)
  );
}

export async function createCliente(cliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
  const newClient: Cliente = {
    ...cliente,
    id: 'c_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const insertPayload: any = {
        tipo_documento: cliente.tipo_documento,
        numero_documento: cliente.numero_documento,
        razon_social_o_nombre: cliente.razon_social_o_nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        tipo_cliente: cliente.tipo_cliente,
      };

      const { data, error } = await supabase.from('clientes').insert([insertPayload]).select().single();
      if (error) {
        console.warn('[db] Supabase insert cliente error:', error.message);
      } else if (data) {
        newClient.id = data.id;
        newClient.created_at = data.created_at || newClient.created_at;

        if (cliente.tipo_cliente === 'EMPRESA') {
          const empresaPayload: Omit<Empresa, 'id' | 'created_at'> = {
            cliente_id: data.id,
            ruc: cliente.numero_documento,
            razon_social: cliente.razon_social_o_nombre,
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion,
          };
          const { error: empError } = await supabase.from('empresas').insert([empresaPayload]);
          if (empError) {
            console.warn('[db] Supabase insert empresa automática error:', empError.message);
          }
        }
      }
    } catch (err) {
      console.warn('[db] Supabase insert cliente falló, usando localStorage:', err);
    }
  }

  const clients = getLocalData<Cliente[]>('fadicc_clientes', []);
  clients.unshift(newClient);
  setLocalData('fadicc_clientes', clients);

  if (cliente.tipo_cliente === 'EMPRESA') {
    const empresas = getLocalData<Empresa[]>('fadicc_empresas', []);
    const nuevaEmpresa: Empresa = {
      id: 'e_' + Math.random().toString(36).substr(2, 9),
      cliente_id: newClient.id,
      ruc: cliente.numero_documento,
      razon_social: cliente.razon_social_o_nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      created_at: newClient.created_at,
    };
    empresas.push(nuevaEmpresa);
    setLocalData('fadicc_empresas', empresas);
  }

  return newClient;
}

export async function updateCliente(id: string, cambios: Partial<Omit<Cliente, 'id'>>): Promise<Cliente | null> {
  const allowedFields: (keyof Omit<Cliente, 'id'>)[] = [
    'tipo_documento', 'numero_documento', 'razon_social_o_nombre',
    'telefono', 'email', 'direccion', 'tipo_cliente'
  ];
  const payload: Partial<Omit<Cliente, 'id'>> = {};
  for (const key of allowedFields) {
    if (key in cambios) {
      (payload as any)[key] = (cambios as any)[key];
    }
  }

  if (supabase) {
    const { error } = await supabase.from('clientes').update(payload).eq('id', id);
    if (!error) {
      const { data, error: fetchError } = await supabase.from('clientes').select('*').eq('id', id).single();
      if (!fetchError && data) return data as Cliente;
    }
  }
  const clients = getLocalData('fadicc_clientes', INITIAL_CLIENTS);
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const updated = { ...clients[idx], ...payload };
  clients[idx] = updated;
  setLocalData('fadicc_clientes', clients);
  return updated;
}

export async function getClienteVentas(clienteId: string): Promise<VentaComercial[]> {
  const allVentas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
  return allVentas.filter(v => v.cliente_id === clienteId);
}

export async function getClienteHistorial(clienteId: string): Promise<{ ventas: VentaComercial[]; proformas: Proforma[]; ultimoVendedor?: string }> {
  const ventas = await getClienteVentas(clienteId);
  const { getProformas } = await import('./proformaService');
  const proformas = (await getProformas()).filter(p => p.cliente_id === clienteId);
  const ultimaVenta = ventas.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())[0];
  return { ventas, proformas, ultimoVendedor: ultimaVenta?.vendedor_id };
}

export async function getClientePreferencias(clienteId: string): Promise<{
  productoFavorito: string;
  categoriaFavorita: string;
  ticketPromedio: number;
  frecuenciaMensual: number;
  totalHistorico: number;
}> {
  const ventas = await getClienteVentas(clienteId);
  const totalHistorico = ventas.reduce((s, v) => s + v.total, 0);
  const ticketPromedio = ventas.length > 0 ? totalHistorico / ventas.length : 0;

  const ahora = new Date();
  const seisMesesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
  const ventasRecientes = ventas.filter(v => new Date(v.fecha_venta) >= seisMesesAtras);
  const mesesConVentas = new Set(ventasRecientes.map(v => {
    const d = new Date(v.fecha_venta);
    return `${d.getFullYear()}-${d.getMonth()}`;
  })).size;
  const frecuenciaMensual = mesesConVentas > 0 ? ventasRecientes.length / mesesConVentas : 0;

  const productoCantidad: Record<string, number> = {};
  ventas.forEach(v => {
    v.detalles?.forEach(d => {
      const nombre = d.nombre || 'Producto sin nombre';
      productoCantidad[nombre] = (productoCantidad[nombre] || 0) + d.cantidad;
    });
  });
  const productoFavorito = Object.entries(productoCantidad).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  return {
    productoFavorito,
    categoriaFavorita: '—',
    ticketPromedio,
    frecuenciaMensual,
    totalHistorico,
  };
}

// --- EMPRESAS ---

export async function getEmpresas(): Promise<Empresa[]> {
  if (supabase) {
    const { data, error } = await supabase.from('empresas').select('*').order('razon_social');
    if (!error && data) return data;
  }
  return getLocalData<Empresa[]>('fadicc_empresas', INITIAL_EMPRESAS);
}

export async function createEmpresa(empresa: Omit<Empresa, 'id' | 'created_at'>): Promise<Empresa> {
  if (supabase) {
    const { data, error } = await supabase.from('empresas').insert([empresa]).select().single();
    if (!error && data) return data;
  }
  const empresas = await getEmpresas();
  const nueva: Empresa = { ...empresa, id: 'e_' + Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
  empresas.push(nueva);
  setLocalData('fadicc_empresas', empresas);
  return nueva;
}

export async function getEmpresaByClienteId(clienteId: string): Promise<Empresa | null> {
  if (supabase) {
    const { data, error } = await supabase.from('empresas').select('*').eq('cliente_id', clienteId).single();
    if (!error && data) return data;
  }
  const empresas = getLocalData<Empresa[]>('fadicc_empresas', []);
  return empresas.find(e => e.cliente_id === clienteId) || null;
}

export async function getEmpresaCompleta(clienteId: string): Promise<{ cliente: Cliente; empresa: Empresa; contactos: Contacto[] } | null> {
  const cliente = await getClients().then(clients => clients.find(c => c.id === clienteId) || null);
  if (!cliente) return null;

  const empresa = await getEmpresaByClienteId(clienteId);
  if (!empresa) return null;

  const contactos = await getContactosByEmpresaId(empresa.id);
  return { cliente, empresa, contactos };
}

// --- CONTACTOS ---

export async function getContactos(empresaId?: string): Promise<Contacto[]> {
  if (supabase) {
    const query = supabase.from('contactos').select('*');
    const { data, error } = empresaId ? await query.eq('empresa_id', empresaId) : await query;
    if (!error && data) return data;
  }
  const all = getLocalData<Contacto[]>('fadicc_contactos', INITIAL_CONTACTOS);
  return empresaId ? all.filter(c => c.empresa_id === empresaId) : all;
}

export async function getContactosByEmpresaId(empresaId: string): Promise<Contacto[]> {
  if (supabase) {
    const { data, error } = await supabase.from('contactos').select('*').eq('empresa_id', empresaId).order('nombre');
    if (!error && data) return data;
  }
  const all = getLocalData<Contacto[]>('fadicc_contactos', []);
  return all.filter(c => c.empresa_id === empresaId);
}

export async function createContacto(contacto: Omit<Contacto, 'id' | 'created_at'>): Promise<Contacto> {
  if (supabase) {
    const { data, error } = await supabase.from('contactos').insert([contacto]).select().single();
    if (!error && data) return data;
  }
  const all = getLocalData<Contacto[]>('fadicc_contactos', []);
  const nuevo: Contacto = { ...contacto, id: 'co_' + Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
  all.push(nuevo);
  setLocalData('fadicc_contactos', all);
  return nuevo;
}

export async function updateContacto(id: string, cambios: Partial<Omit<Contacto, 'id'>>): Promise<Contacto | null> {
  if (supabase) {
    const { error } = await supabase.from('contactos').update(cambios).eq('id', id);
    if (!error) {
      const { data, error: fetchError } = await supabase.from('contactos').select('*').eq('id', id).single();
      if (!fetchError && data) return data;
    }
  }
  const all = getLocalData<Contacto[]>('fadicc_contactos', []);
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...cambios };
  all[idx] = updated;
  setLocalData('fadicc_contactos', all);
  return updated;
}

export async function deleteContacto(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('contactos').delete().eq('id', id);
    if (!error) return true;
    console.warn('[db] Supabase delete contacto error:', error.message);
  }
  const all = getLocalData<Contacto[]>('fadicc_contactos', []);
  const filtered = all.filter(c => c.id !== id);
  if (filtered.length === all.length) return false;
  setLocalData('fadicc_contactos', filtered);
  return true;
}

export async function setContactoPrincipal(contactoId: string, empresaId: string): Promise<boolean> {
  if (supabase) {
    const { error: resetError } = await supabase.from('contactos')
      .update({ es_principal: false })
      .eq('empresa_id', empresaId);
    if (resetError) {
      console.warn('[db] Supabase reset contactos principales error:', resetError.message);
    }
    const { error: setError } = await supabase.from('contactos')
      .update({ es_principal: true })
      .eq('id', contactoId);
    if (!setError) return true;
    console.warn('[db] Supabase set contacto principal error:', setError.message);
  }
  const all = getLocalData<Contacto[]>('fadicc_contactos', []);
  const updated = all.map(c => {
    if (c.empresa_id !== empresaId) return c;
    return { ...c, es_principal: c.id === contactoId };
  });
  setLocalData('fadicc_contactos', updated);
  return true;
}


