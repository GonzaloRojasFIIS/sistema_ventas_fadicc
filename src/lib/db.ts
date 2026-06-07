import { createClient } from '@supabase/supabase-js';

// =========================================================================
// TIPOS DEL DOMINIO
// =========================================================================

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'REPRESENTANTE' | 'ALMACEN' | 'PRODUCCION';
  activo: boolean;
}

export interface Cliente {
  id: string;
  tipo_documento: 'DNI' | 'RUC';
  numero_documento: string;
  razon_social_o_nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto_nombre?: string;
  contacto_cargo?: string;
  contacto_telefono?: string;
  contacto_email?: string;
  created_at?: string;
}

export interface Empresa {
  id: string;
  ruc: string;
  razon_social: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  created_at?: string;
}

export interface Contacto {
  id: string;
  empresa_id: string;
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  created_at?: string;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_base: number;
  costo?: number;
  stock_actual: number;
  stock_minimo: number;
  imagen?: string;
  updated_at?: string;
}

export interface MovimientoStock {
  id: string;
  producto_id: string;
  producto_nombre?: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'CORRECCION';
  motivo: 'COMPRA_PROVEEDOR' | 'DEVOLUCION_CLIENTE' | 'MERMA' | 'AJUSTE_CONTEO' | 'VENTA';
  cantidad_anterior: number;
  cantidad_nueva: number;
  diferencia: number;
  usuario_id: string;
  usuario_nombre?: string;
  fecha: string;
  observacion?: string;
}

export interface CajaTurno {
  id: string;
  vendedor_id: string;
  vendedor_nombre?: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_apertura: number;
  monto_cierre?: number;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface VentaDetalle {
  producto_id: string;
  nombre?: string;
  sku?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaComercial {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  vendedor_id: string;
  vendedor_nombre?: string;
  caja_turno_id: string;
  tipo_comprobante: 'BOLETA' | 'FACTURA';
  numero_comprobante: string;
  total: number;
  fecha_venta: string;
  detalles?: VentaDetalle[];
}

export interface ProformaDetalle {
  producto_id: string;
  nombre?: string;
  sku?: string;
  cantidad: number;
  precio_pactado: number;
  subtotal: number;
}

export interface Proforma {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  cliente_email?: string;
  representante_id: string;
  representante_nombre?: string;
  codigo_proforma: string;
  estado: 'PENDIENTE' | 'EN_NEGOCIACION' | 'APROBADA' | 'DESPACHADA' | 'RECHAZADA' | 'EXPIRADA';
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  detalles?: ProformaDetalle[];
}

export interface OrdenPedido {
  id: string;
  proforma_id: string;
  codigo_pedido: string;
  estado_produccion: 'EN_PRODUCCION' | 'LISTO_PARA_DESPACHO' | 'ENTREGADO';
  fecha_aprobacion: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  cliente_nombre?: string;
  codigo_proforma?: string;
  total?: number;
}

export interface KpiData {
  venta_comercial_hoy: number;
  venta_comercial_ayer: number;
  venta_industrial_activa: number;
  tasa_conversion_proformas: number;
  proformas_total: number;
  proformas_aprobadas: number;
  proformas_vencidas: number;
  productos_bajo_minimo: number;
  ventas_hoy_count: number;
  ordenes_activas: number;
  ticket_promedio: number;
  margen_bruto_estimado: number;
  meta_mensual: number;
  real_mensual: number;
}

export interface VentaPorDia {
  fecha: string;
  comercial: number;
  industrial: number;
}

export interface TopProducto {
  nombre: string;
  unidades: number;
  ingreso: number;
  stock_restante: number;
}

export interface Actividad {
  id: string;
  tipo: 'venta' | 'proforma' | 'stock' | 'pedido';
  descripcion: string;
  usuario: string;
  timestamp: string;
}

export interface VendedorPerformance {
  nombre: string;
  meta: number;
  real: number;
  porcentaje: number;
}

export interface MetasConfig {
  vendedor: number;
  representante: number;
}

export interface Proveedor {
  id: string;
  ruc: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  rubro: string;
}

// =========================================================================
// CLIENTE SUPABASE
// =========================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== 'your-supabase-project-url' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-supabase-anon-key';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =========================================================================
// MOCK DATA (Fallback localStorage)
// =========================================================================

const INITIAL_PRODUCTS: Producto[] = [
  // Cocinas Semi Industriales
  {
    id: 'p1', sku: 'FAD-1H-MP', nombre: 'Cocina 1 Hornillo Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 1 hornillo de alta presión. Ideal para puestos de comida y cocinas compactas.',
    categoria: 'Cocina Semi Industriales', precio_base: 480.00, costo: 320.00,
    stock_actual: 12, stock_minimo: 4,     imagen: '/cocinas/Cocina-de-1-horno-mesa-y-pie.png'
  },
  {
    id: 'p2', sku: 'FAD-2H-MP', nombre: 'Cocina 2 Hornillos Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 2 hornillos de alta presión. Equilibrio entre capacidad y espacio.',
    categoria: 'Cocina Semi Industriales', precio_base: 720.00, costo: 480.00,
    stock_actual: 9, stock_minimo: 3,     imagen: '/cocinas/Cocina-de-2-horno-mesa-y-pie.png'
  },
  {
    id: 'p3', sku: 'FAD-3H-MP', nombre: 'Cocina 3 Hornillos Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 3 hornillos de alta presión. Para restaurantes pequeños y medianos.',
    categoria: 'Cocina Semi Industriales', precio_base: 950.00, costo: 630.00,
    stock_actual: 7, stock_minimo: 3,     imagen: '/cocinas/Cocina-de-3-horno-mesa-y-pie.png'
  },
  {
    id: 'p4', sku: 'FAD-4H-MP', nombre: 'Cocina 4 Hornillos Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 4 hornillos de alta presión. Máxima capacidad para cocinas comerciales.',
    categoria: 'Cocina Semi Industriales', precio_base: 1250.00, costo: 820.00,
    stock_actual: 5, stock_minimo: 2,     imagen: '/cocinas/Cocina-de-4-horno-mesa-y-pie.png'
  },
  {
    id: 'p5', sku: 'FAD-2H-SL', nombre: 'Cocina De 2 Hornillas',
    descripcion: 'Modelo Slim-Line semi-industrial con 2 hornillas de alta presión y patas reforzadas.',
    categoria: 'Cocina Semi Industriales', precio_base: 680.00, costo: 450.00,
    stock_actual: 10, stock_minimo: 3,     imagen: '/cocinas/De-2-hornias.png'
  },
  {
    id: 'p6', sku: 'FAD-3H-SL', nombre: 'Cocina De 3 Hornillas',
    descripcion: 'Modelo Slim-Line semi-industrial con 3 hornillas de alta presión y patas reforzadas.',
    categoria: 'Cocina Semi Industriales', precio_base: 890.00, costo: 590.00,
    stock_actual: 8, stock_minimo: 3,     imagen: '/cocinas/De-3-hornias.png'
  },
  {
    id: 'p7', sku: 'FAD-4H-SL', nombre: 'Cocina De 4 Hornillas',
    descripcion: 'Modelo Slim-Line semi-industrial con 4 hornillas de alta presión y patas reforzadas.',
    categoria: 'Cocina Semi Industriales', precio_base: 1150.00, costo: 760.00,
    stock_actual: 6, stock_minimo: 2,     imagen: '/cocinas/De-4-hornias.png'
  },
  // Cocinas Domésticas
  {
    id: 'p8', sku: 'FAD-DOM-20', nombre: 'Cocina Doméstica 20″',
    descripcion: 'Cocina doméstica de 20 pulgadas con tapa de vidrio templado. 4 hornillas estándar para uso residencial.',
    categoria: 'Cocinas Domesticas', precio_base: 380.00, costo: 250.00,
    stock_actual: 15, stock_minimo: 5,     imagen: '/cocinas/Cocinas-20in.png'
  },
  {
    id: 'p9', sku: 'FAD-DOM-22', nombre: 'Cocina Doméstica 22″',
    descripcion: 'Cocina doméstica de 22 pulgadas con tapa de vidrio templado. Mayor espacio de cocción para el hogar.',
    categoria: 'Cocinas Domesticas', precio_base: 450.00, costo: 300.00,
    stock_actual: 11, stock_minimo: 4,     imagen: '/cocinas/Cocinas-22in.png'
  },
  {
    id: 'p10', sku: 'FAD-DOM-HO', nombre: 'Cocihorno',
    descripcion: 'Cocina doméstica con horno integrado en la base. 4 hornillas + horno eléctrico/gas. El todo en uno para tu hogar.',
    categoria: 'Cocinas Domesticas', precio_base: 520.00, costo: 340.00,
    stock_actual: 7, stock_minimo: 3, imagen: '/cocinas/Cocihorno.png'
  },
  // Hornos
  {
    id: 'p11', sku: 'FAD-HOR-AC', nombre: 'Horno Acero',
    descripcion: 'Horno industrial construido completamente en acero inoxidable. Ideal para panaderías, pastelerías y restaurantes. Gran capacidad y durabilidad.',
    categoria: 'Hornos', precio_base: 2400.00, costo: 1580.00,
    stock_actual: 3, stock_minimo: 1,     imagen: '/cocinas/Horno-Acero.png'
  },
  {
    id: 'p12', sku: 'FAD-HOR-CF', nombre: 'Chiferos & Fogones',
    descripcion: 'Sistema de cocción industrial tipo chifero/fogón de alta potencia. Usado en restaurantes chinos y cocinas de alto rendimiento.',
    categoria: 'Hornos', precio_base: 1100.00, costo: 720.00,
    stock_actual: 5, stock_minimo: 2,     imagen: '/cocinas/Chiferos-y-Fogones.png'
  },
];

const INITIAL_CLIENTS: Cliente[] = [
  { id: 'c1', tipo_documento: 'DNI', numero_documento: '44556677', razon_social_o_nombre: 'Juan Pérez', telefono: '912449977', email: 'juan.perez@email.com', direccion: 'Av. Arequipa 1234, Lince' },
  { id: 'c2', tipo_documento: 'RUC', numero_documento: '20123456789', razon_social_o_nombre: 'Constructora Horizonte S.A.C.', telefono: '+51 912 449 977', email: 'compras@horizonte.pe', direccion: 'Av. Javier Prado Este 505, San Isidro' },
  { id: 'c3', tipo_documento: 'RUC', numero_documento: '20987654321', razon_social_o_nombre: 'Hoteles del Perú S.A.', telefono: '+51 912 449 977', email: 'contacto@hotelesperu.com', direccion: 'Calle Larco 789, Miraflores' },
  { id: 'c4', tipo_documento: 'RUC', numero_documento: '20548796321', razon_social_o_nombre: 'Restaurantes La Cuesta E.I.R.L.', telefono: '01-222-1111', email: 'admin@lacuesta.pe', direccion: 'Jr. de la Unión 340, Cercado de Lima' },
  { id: 'c5', tipo_documento: 'DNI', numero_documento: '47896532', razon_social_o_nombre: 'María Gonzales', telefono: '987654321', email: 'maria.g@gmail.com', direccion: 'Av. Brasil 890, Pueblo Libre' },
  { id: 'c6', tipo_documento: 'RUC', numero_documento: '20112233445', razon_social_o_nombre: 'Inmobiliaria del Norte S.A.C.', telefono: '01-555-7777', email: 'ventas@delnorte.pe', direccion: 'Av. Panamericana Norte Km 12, Los Olivos' },
  { id: 'c7', tipo_documento: 'DNI', numero_documento: '45623178', razon_social_o_nombre: 'Pedro Ramírez', telefono: '956231478', email: 'pedro.r@hotmail.com', direccion: 'Av. Angamos 450, Surquillo' },
  { id: 'c8', tipo_documento: 'RUC', numero_documento: '20334455667', razon_social_o_nombre: 'Cadenas de Oro S.A.', telefono: '01-888-9999', email: 'logistica@cadenasoro.pe', direccion: 'Av. El Derby 210, Santiago de Surco' },
];

const INITIAL_USERS: Usuario[] = [
  { id: 'u1', email: 'admin@fadicc.com', nombre: 'Administrador General', rol: 'ADMIN', activo: true },
  { id: 'u2', email: 'vendedor@fadicc.com', nombre: 'Carlos Vendedor', rol: 'VENDEDOR', activo: true },
  { id: 'u3', email: 'representante@fadicc.com', nombre: 'Ana Representante', rol: 'REPRESENTANTE', activo: true },
  { id: 'u4', email: 'almacen@fadicc.com', nombre: 'Luis Almacenero', rol: 'ALMACEN', activo: true },
  { id: 'u5', email: 'produccion@fadicc.com', nombre: 'Marta Producción', rol: 'PRODUCCION', activo: true },
];

const DATA_VERSION = '2';

const getLocalData = <T>(key: string, initial: T): T => {
  if (typeof window === 'undefined') return initial;

  const currentVersion = localStorage.getItem('fadicc_data_version');
  if (currentVersion !== DATA_VERSION) {
    // Borrar solo las claves de datos, no la sesión
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('fadicc_') && k !== 'fadicc_sesion') {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('fadicc_data_version', DATA_VERSION);
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }

  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// =========================================================================
// SERVICIO DE BASE DE DATOS
// =========================================================================

export const dbService = {
  isRealDb: () => isSupabaseConfigured,

  // --- PRODUCTOS ---
  async getProducts(categoria?: string): Promise<Producto[]> {
    if (supabase) {
      let query = supabase.from('productos').select('*').order('sku');
      if (categoria) query = query.eq('categoria', categoria);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const prods = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
    return categoria ? prods.filter(p => p.categoria === categoria) : prods;
  },

  async createProducto(producto: Omit<Producto, 'id' | 'updated_at'>): Promise<Producto> {
    if (supabase) {
      const { data, error } = await supabase.from('productos').insert([producto]).select().single();
      if (!error && data) return data;
    }
    const prods = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
    const newProd: Producto = { ...producto, id: 'p_' + Math.random().toString(36).substr(2, 9) };
    prods.push(newProd);
    setLocalData('fadicc_productos', prods);
    return newProd;
  },

  async updateProducto(id: string, cambios: Partial<Omit<Producto, 'id'>>): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('productos').update(cambios).eq('id', id);
      return !error;
    }
    const prods = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
    const updated = prods.map(p => p.id === id ? { ...p, ...cambios } : p);
    setLocalData('fadicc_productos', updated);
    return true;
  },

  async updateProductStock(id: string, newStock: number): Promise<boolean> {
    return this.updateProducto(id, { stock_actual: newStock });
  },

  // --- MOVIMIENTOS DE STOCK ---
  async addMovimientoStock(mov: Omit<MovimientoStock, 'id' | 'fecha'>): Promise<MovimientoStock> {
    const newMov: MovimientoStock = {
      ...mov,
      id: 'mov_' + Math.random().toString(36).substr(2, 9),
      fecha: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase.from('movimientos_stock').insert([{
        producto_id: mov.producto_id,
        tipo: mov.tipo,
        motivo: mov.motivo,
        cantidad_anterior: mov.cantidad_anterior,
        cantidad_nueva: mov.cantidad_nueva,
        diferencia: mov.diferencia,
        usuario_id: mov.usuario_id,
        observacion: mov.observacion,
      }]).select().single();
      if (!error && data) return data;
    }

    const movs = getLocalData<MovimientoStock[]>('fadicc_movimientos_stock', []);
    movs.unshift(newMov);
    setLocalData('fadicc_movimientos_stock', movs);

    // También actualizar el stock
    await this.updateProductStock(mov.producto_id, mov.cantidad_nueva);
    return newMov;
  },

  async getMovimientosStock(productoId?: string): Promise<MovimientoStock[]> {
    if (supabase) {
      let q = supabase.from('movimientos_stock').select(`
        *, 
        productos(nombre, sku),
        usuarios(nombre)
      `).order('fecha', { ascending: false }).limit(100);
      if (productoId) q = q.eq('producto_id', productoId);
      const { data, error } = await q;
      if (!error && data) return data.map((m: any) => ({
        ...m,
        producto_nombre: m.productos?.nombre,
        usuario_nombre: m.usuarios?.nombre,
      }));
    }
    const movs = getLocalData<MovimientoStock[]>('fadicc_movimientos_stock', []);
    return productoId ? movs.filter(m => m.producto_id === productoId) : movs;
  },

  // --- CLIENTES ---
  async getClients(): Promise<Cliente[]> {
    if (supabase) {
      const { data, error } = await supabase.from('clientes').select('*').order('razon_social_o_nombre');
      if (!error && data) return data;
    }
    return getLocalData('fadicc_clientes', INITIAL_CLIENTS);
  },

  async searchClienteByDoc(query: string): Promise<Cliente[]> {
    const allClients = await this.getClients();
    const q = query.toLowerCase().trim();
    return allClients.filter(c =>
      c.numero_documento.includes(q) ||
      c.razon_social_o_nombre.toLowerCase().includes(q)
    );
  },

  async createCliente(cliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
    if (supabase) {
      const { data, error } = await supabase.from('clientes').insert([cliente]).select().single();
      if (!error && data) return data;
    }
    const clients = getLocalData('fadicc_clientes', INITIAL_CLIENTS);
    const newClient: Cliente = { ...cliente, id: 'c_' + Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
    clients.push(newClient);
    setLocalData('fadicc_clientes', clients);
    return newClient;
  },

  async updateCliente(id: string, cambios: Partial<Omit<Cliente, 'id'>>): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('clientes').update(cambios).eq('id', id);
      return !error;
    }
    const clients = getLocalData('fadicc_clientes', INITIAL_CLIENTS);
    const updated = clients.map(c => c.id === id ? { ...c, ...cambios } : c);
    setLocalData('fadicc_clientes', updated);
    return true;
  },

  async getClienteVentas(clienteId: string): Promise<VentaComercial[]> {
    const allVentas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
    return allVentas.filter(v => v.cliente_id === clienteId);
  },

  async getClienteHistorial(clienteId: string): Promise<{ ventas: VentaComercial[]; proformas: Proforma[]; ultimoVendedor?: string }> {
    const ventas = await this.getClienteVentas(clienteId);
    const proformas = (await this.getProformas()).filter(p => p.cliente_id === clienteId);
    const ultimaVenta = ventas.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())[0];
    return { ventas, proformas, ultimoVendedor: ultimaVenta?.vendedor_id };
  },

  async getClientePreferencias(clienteId: string): Promise<{
    productoFavorito: string;
    categoriaFavorita: string;
    ticketPromedio: number;
    frecuenciaMensual: number;
    totalHistorico: number;
  }> {
    const ventas = await this.getClienteVentas(clienteId);
    const totalHistorico = ventas.reduce((s, v) => s + v.total, 0);
    const ticketPromedio = ventas.length > 0 ? totalHistorico / ventas.length : 0;

    // Frecuencia: ventas por mes (últimos 6 meses)
    const ahora = new Date();
    const seisMesesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    const ventasRecientes = ventas.filter(v => new Date(v.fecha_venta) >= seisMesesAtras);
    const mesesConVentas = new Set(ventasRecientes.map(v => {
      const d = new Date(v.fecha_venta);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })).size;
    const frecuenciaMensual = mesesConVentas > 0 ? ventasRecientes.length / mesesConVentas : 0;

    // Producto favorito: el más comprado por cantidad
    const productoCantidad: Record<string, number> = {};
    ventas.forEach(v => {
      v.detalles?.forEach(d => {
        const nombre = d.nombre || 'Producto sin nombre';
        productoCantidad[nombre] = (productoCantidad[nombre] || 0) + d.cantidad;
      });
    });
    const productoFavorito = Object.entries(productoCantidad).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Categoría favorita (mock por ahora, requiere mapear producto->categoría)
    return {
      productoFavorito,
      categoriaFavorita: '—',
      ticketPromedio,
      frecuenciaMensual,
      totalHistorico,
    };
  },

  // --- EMPRESAS ---
  async getEmpresas(): Promise<Empresa[]> {
    if (supabase) {
      const { data, error } = await supabase.from('empresas').select('*').order('razon_social');
      if (!error && data) return data;
    }
    return getLocalData<Empresa[]>('fadicc_empresas', [
      { id: 'e1', ruc: '20123456789', razon_social: 'Constructora Horizonte S.A.C.', telefono: '+51 912 449 977', email: 'compras@horizonte.pe', direccion: 'Av. Javier Prado Este 505, San Isidro' },
      { id: 'e2', ruc: '20987654321', razon_social: 'Hoteles del Perú S.A.', telefono: '+51 912 449 977', email: 'contacto@hotelesperu.com', direccion: 'Calle Larco 789, Miraflores' },
      { id: 'e3', ruc: '20456123789', razon_social: 'Restaurantes Sabor S.A.C.', telefono: '+51 912 449 977', email: 'logistica@sabor.com.pe', direccion: 'Av. La Marina 2250, San Miguel' },
    ]);
  },

  async createEmpresa(empresa: Omit<Empresa, 'id' | 'created_at'>): Promise<Empresa> {
    if (supabase) {
      const { data, error } = await supabase.from('empresas').insert([empresa]).select().single();
      if (!error && data) return data;
    }
    const empresas = await this.getEmpresas();
    const nueva: Empresa = { ...empresa, id: 'e_' + Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
    empresas.push(nueva);
    setLocalData('fadicc_empresas', empresas);
    return nueva;
  },

  // --- CONTACTOS ---
  async getContactos(empresaId?: string): Promise<Contacto[]> {
    if (supabase) {
      const query = supabase.from('contactos').select('*');
      const { data, error } = empresaId ? await query.eq('empresa_id', empresaId) : await query;
      if (!error && data) return data;
    }
    const all = getLocalData<Contacto[]>('fadicc_contactos', [
      { id: 'co1', empresa_id: 'e1', nombre: 'Roberto Díaz', cargo: 'Jefe de Compras', telefono: '01-444-5556', email: 'rdiaz@horizonte.pe' },
      { id: 'co2', empresa_id: 'e2', nombre: 'Sofía Ramírez', cargo: 'Gerente General', telefono: '01-333-2223', email: 'sramirez@hotelesperu.com' },
      { id: 'co3', empresa_id: 'e3', nombre: 'Miguel Ángel Torres', cargo: 'Administrador', telefono: '01-555-6790', email: 'mtorres@sabor.com.pe' },
    ]);
    return empresaId ? all.filter(c => c.empresa_id === empresaId) : all;
  },

  async createContacto(contacto: Omit<Contacto, 'id' | 'created_at'>): Promise<Contacto> {
    if (supabase) {
      const { data, error } = await supabase.from('contactos').insert([contacto]).select().single();
      if (!error && data) return data;
    }
    const all = getLocalData<Contacto[]>('fadicc_contactos', []);
    const nuevo: Contacto = { ...contacto, id: 'co_' + Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
    all.push(nuevo);
    setLocalData('fadicc_contactos', all);
    return nuevo;
  },

  // --- CAJA ---
  async getActiveCaja(vendedorId: string): Promise<CajaTurno | null> {
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
  },

  async openCaja(vendedorId: string, montoApertura: number): Promise<CajaTurno> {
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
  },

  async closeCaja(cajaId: string, montoCierre: number): Promise<boolean> {
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
  },

  // --- CORRELATIVOS ---
  async getNextCorrelativo(tipo: 'BOLETA' | 'FACTURA'): Promise<string> {
    const serie = tipo === 'BOLETA' ? 'B001' : 'F001';

    if (supabase) {
      // Usar RPC de Supabase para incremento atómico
      const { data, error } = await supabase.rpc('incrementar_correlativo', {
        p_tipo_comprobante: tipo,
        p_serie: serie,
      });
      if (!error && data) {
        return `${serie}-${String(data).padStart(6, '0')}`;
      }
    }

    // Fallback localStorage
    const key = `fadicc_correlativo_${tipo}`;
    let current = parseInt(localStorage.getItem(key) || '0', 10);
    current += 1;
    localStorage.setItem(key, current.toString());
    return `${serie}-${String(current).padStart(6, '0')}`;
  },

  // --- VENTAS COMERCIALES ---
  async registrarVentaDirecta(venta: {
    cliente_id: string;
    vendedor_id: string;
    caja_turno_id: string;
    tipo_comprobante: 'BOLETA' | 'FACTURA';
    total: number;
    detalles: { producto_id: string; cantidad: number; precio_unitario: number }[];
  }): Promise<string> {
    const numComp = await this.getNextCorrelativo(venta.tipo_comprobante);

    if (supabase) {
      const { data: ventaDb, error: errVenta } = await supabase
        .from('ventas_comerciales')
        .insert([{
          cliente_id: venta.cliente_id,
          vendedor_id: venta.vendedor_id,
          caja_turno_id: venta.caja_turno_id,
          tipo_comprobante: venta.tipo_comprobante,
          numero_comprobante: numComp,
          total: venta.total,
        }])
        .select()
        .single();

      if (errVenta || !ventaDb) throw new Error('Error al registrar cabecera de venta');

      const detallesDb = venta.detalles.map(d => ({
        venta_id: ventaDb.id,
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.cantidad * d.precio_unitario,
      }));

      await supabase.from('venta_detalles').insert(detallesDb);

      for (const d of venta.detalles) {
        const { data: prod } = await supabase.from('productos').select('stock_actual').eq('id', d.producto_id).single();
        if (prod) {
          await supabase.from('productos').update({ stock_actual: Math.max(0, prod.stock_actual - d.cantidad) }).eq('id', d.producto_id);
        }
      }
      return numComp;
    }

    // Mock fallback
    const products = getLocalData('fadicc_productos', INITIAL_PRODUCTS);
    const clients = getLocalData('fadicc_clientes', INITIAL_CLIENTS);
    const client = clients.find(c => c.id === venta.cliente_id);
    const users = INITIAL_USERS;
    const user = users.find(u => u.id === venta.vendedor_id);

    const ventaCompleta: VentaComercial = {
      id: 'venta_' + Math.random().toString(36).substr(2, 9),
      ...venta,
      cliente_nombre: client?.razon_social_o_nombre || 'Cliente',
      vendedor_nombre: user?.nombre || 'Vendedor',
      numero_comprobante: numComp,
      fecha_venta: new Date().toISOString(),
      detalles: venta.detalles.map(d => {
        const prod = products.find(p => p.id === d.producto_id);
        return {
          ...d,
          nombre: prod?.nombre,
          sku: prod?.sku,
          subtotal: d.cantidad * d.precio_unitario,
        };
      }),
    };

    venta.detalles.forEach(d => {
      const p = products.find(prod => prod.id === d.producto_id);
      if (p) p.stock_actual = Math.max(0, p.stock_actual - d.cantidad);
    });
    setLocalData('fadicc_productos', products);

    const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
    ventas.unshift(ventaCompleta);
    setLocalData('fadicc_ventas', ventas);

    return numComp;
  },

  async getVentasRecientes(cajaId?: string, limit = 20): Promise<VentaComercial[]> {
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
  },

  async getVentaById(id: string): Promise<VentaComercial | null> {
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
  },

  // --- PROFORMAS ---
  async getProformas(): Promise<Proforma[]> {
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
            nombre: d.productos?.nombre || 'Producto',
            sku: d.productos?.sku || '',
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
  },

  async createProforma(proforma: Omit<Proforma, 'id' | 'codigo_proforma' | 'estado' | 'fecha_emision'> & { detalles: ProformaDetalle[] }): Promise<Proforma> {
    const code = 'PROF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newProf: Proforma = {
      id: 'prof_' + Math.random().toString(36).substr(2, 9),
      ...proforma,
      codigo_proforma: code,
      estado: 'PENDIENTE',
      fecha_emision: new Date().toISOString(),
    };

    if (supabase) {
      const { data: profDb, error: errProf } = await supabase
        .from('proformas')
        .insert([{
          cliente_id: proforma.cliente_id,
          representante_id: proforma.representante_id,
          codigo_proforma: code,
          estado: 'PENDIENTE',
          fecha_vencimiento: proforma.fecha_vencimiento,
          total: proforma.total,
        }])
        .select()
        .single();

      if (errProf || !profDb) throw new Error('Error al guardar la proforma');

      const detDb = proforma.detalles.map(d => ({
        proforma_id: profDb.id,
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_pactado: d.precio_pactado,
        subtotal: d.subtotal,
      }));
      await supabase.from('proforma_detalles').insert(detDb);
      return { ...newProf, id: profDb.id };
    }

    const currentProfs = getLocalData<Proforma[]>('fadicc_proformas', []);
    currentProfs.unshift(newProf);
    setLocalData('fadicc_proformas', currentProfs);
    return newProf;
  },

  async updateProformaEstado(id: string, nuevoEstado: Proforma['estado']): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('proformas').update({ estado: nuevoEstado }).eq('id', id);
      return !error;
    }
    const profs = getLocalData<Proforma[]>('fadicc_proformas', []);
    const updated = profs.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p);
    setLocalData('fadicc_proformas', updated);
    return true;
  },

  async getProformaById(id: string): Promise<Proforma | null> {
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
  },

  // --- ÓRDENES DE PEDIDO ---
  async getOrders(): Promise<OrdenPedido[]> {
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
  },

  async convertToOrder(proformaId: string, proformaData?: Partial<Proforma>): Promise<OrdenPedido | null> {
    const codigo_pedido = 'PED-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder: Omit<OrdenPedido, 'id'> = {
      proforma_id: proformaId,
      codigo_pedido,
      estado_produccion: 'EN_PRODUCCION',
      fecha_aprobacion: new Date().toISOString(),
      fecha_entrega_estimada: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (supabase) {
      await supabase.from('proformas').update({ estado: 'APROBADA' }).eq('id', proformaId);
      const { data, error } = await supabase.from('orden_pedidos').insert([newOrder]).select().single();
      if (!error && data) return data;
    }

    await this.updateProformaEstado(proformaId, 'APROBADA');

    const orders = getLocalData<OrdenPedido[]>('fadicc_ordenes', []);
    const created: OrdenPedido = {
      ...newOrder,
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      cliente_nombre: proformaData?.cliente_nombre || 'Cliente',
      codigo_proforma: proformaData?.codigo_proforma || '',
      total: proformaData?.total || 0,
    };
    orders.unshift(created);
    setLocalData('fadicc_ordenes', orders);
    return created;
  },

  async updateOrderStatus(id: string, nuevoEstado: OrdenPedido['estado_produccion']): Promise<boolean> {
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
  },

  // --- USUARIOS (ADMIN) ---
  async getUsuarios(): Promise<Usuario[]> {
    if (supabase) {
      const { data, error } = await supabase.from('usuarios').select('id, email, nombre, rol, activo').order('nombre');
      if (!error && data) return data;
    }
    return getLocalData('fadicc_usuarios_admin', INITIAL_USERS);
  },

  async updateUsuario(id: string, cambios: Partial<Pick<Usuario, 'nombre' | 'rol' | 'activo'>>): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('usuarios').update(cambios).eq('id', id);
      return !error;
    }
    const users = getLocalData('fadicc_usuarios_admin', INITIAL_USERS);
    const updated = users.map((u: Usuario) => u.id === id ? { ...u, ...cambios } : u);
    setLocalData('fadicc_usuarios_admin', updated);
    return true;
  },

  async createUsuario(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
    if (supabase) {
      const { data, error } = await supabase.from('usuarios').insert([{
        ...usuario,
        password_hash: '123456', // password temporal
      }]).select('id, email, nombre, rol, activo').single();
      if (!error && data) return data;
    }
    const users = getLocalData('fadicc_usuarios_admin', INITIAL_USERS);
    const newUser: Usuario = { ...usuario, id: 'u_' + Math.random().toString(36).substr(2, 9) };
    users.push(newUser);
    setLocalData('fadicc_usuarios_admin', users);
    return newUser;
  },

  // --- KPIs DINÁMICOS ---
  async getKpis(): Promise<KpiData> {
    const hoyStart = new Date();
    hoyStart.setHours(0, 0, 0, 0);

    if (supabase) {
      const [ventasHoy, proformasAll, ordenes, productosAll] = await Promise.all([
        supabase.from('ventas_comerciales').select('total').gte('fecha_venta', hoyStart.toISOString()),
        supabase.from('proformas').select('estado'),
        supabase.from('orden_pedidos').select('id, estado_produccion, proformas(total)').neq('estado_produccion', 'ENTREGADO'),
        supabase.from('productos').select('stock_actual, stock_minimo'),
      ]);

      const totalComercial = (ventasHoy.data || []).reduce((s: number, v: any) => s + v.total, 0);
      const countComercial = (ventasHoy.data || []).length;
      const allProfs = proformasAll.data || [];
      const aprobadas = allProfs.filter((p: any) => p.estado === 'APROBADA').length;
      const tasaConv = allProfs.length > 0 ? Math.round((aprobadas / allProfs.length) * 100) : 0;
      const totalIndustrial = (ordenes.data || []).reduce((s: number, o: any) => s + (o.proformas?.total || 0), 0);
      const bajosStock = (productosAll.data || []).filter((p: any) => p.stock_actual <= p.stock_minimo).length;

      return {
        venta_comercial_hoy: totalComercial,
        venta_comercial_ayer: totalComercial * 0.92,
        venta_industrial_activa: totalIndustrial,
        tasa_conversion_proformas: tasaConv,
        proformas_total: allProfs.length,
        proformas_aprobadas: aprobadas,
        proformas_vencidas: allProfs.filter((p: any) => p.estado === 'EXPIRADA').length,
        productos_bajo_minimo: bajosStock,
        ventas_hoy_count: countComercial,
        ordenes_activas: (ordenes.data || []).length,
        ticket_promedio: countComercial > 0 ? totalComercial / countComercial : 0,
        margen_bruto_estimado: 32.5,
        meta_mensual: 150000,
        real_mensual: 98540,
      };
    }

    // Mock calculado desde localStorage
    const ventas = getLocalData<VentaComercial[]>('fadicc_ventas', []);
    const ventasHoy = ventas.filter(v => new Date(v.fecha_venta) >= hoyStart);
    const proformas = getLocalData<Proforma[]>('fadicc_proformas', []);
    const proformasAprobadas = proformas.filter(p => p.estado === 'APROBADA');
    const ordenes = getLocalData<OrdenPedido[]>('fadicc_ordenes', []);
    const ordenesActivas = ordenes.filter(o => o.estado_produccion !== 'ENTREGADO');
    const productos = getLocalData<Producto[]>('fadicc_productos', INITIAL_PRODUCTS);
    const bajoMinimo = productos.filter(p => p.stock_actual <= p.stock_minimo);

    const totalComercial = ventasHoy.reduce((s, v) => s + v.total, 0);
    const countComercial = ventasHoy.length;
    const ticketPromedio = countComercial > 0 ? totalComercial / countComercial : 0;

    return {
      venta_comercial_hoy: totalComercial,
      venta_comercial_ayer: totalComercial * 0.92,
      venta_industrial_activa: ordenesActivas.reduce((s, o) => s + (o.total || 0), 0),
      tasa_conversion_proformas: proformas.length > 0 ? Math.round((proformasAprobadas.length / proformas.length) * 100) : 0,
      proformas_total: proformas.length,
      proformas_aprobadas: proformasAprobadas.length,
      proformas_vencidas: proformas.filter(p => p.estado === 'EXPIRADA').length,
      productos_bajo_minimo: bajoMinimo.length,
      ventas_hoy_count: countComercial,
      ordenes_activas: ordenesActivas.length,
      ticket_promedio: ticketPromedio,
      margen_bruto_estimado: 32.5,
      meta_mensual: 150000,
      real_mensual: 98540,
    };
  },

  // --- GRÁFICOS Y REPORTES ---
  async getVentasPorDia(): Promise<VentaPorDia[]> {
    const dias = 7;
    const data: VentaPorDia[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fecha = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      data.push({
        fecha,
        comercial: Math.round(8000 + Math.random() * 12000),
        industrial: Math.round(5000 + Math.random() * 15000),
      });
    }
    return data;
  },

  async getTopProductos(): Promise<TopProducto[]> {
    return [
      { nombre: 'Cocina Industrial 4 Hornillas', unidades: 24, ingreso: 30000, stock_restante: 8 },
      { nombre: 'Cocina Industrial 6 Hornillas', unidades: 18, ingreso: 34020, stock_restante: 4 },
      { nombre: 'Horno Convector Industrial', unidades: 6, ingreso: 20400, stock_restante: 0 },
      { nombre: 'Cocina Semi-Industrial 4 Hornillas', unidades: 14, ingreso: 10500, stock_restante: 12 },
      { nombre: 'Cocina Doméstica Premium', unidades: 10, ingreso: 4500, stock_restante: 2 },
    ];
  },

  async getActividadReciente(): Promise<Actividad[]> {
    return [
      { id: 'a1', tipo: 'venta', descripcion: 'Venta directa B001-452301 por S/ 3,240.00', usuario: 'Carlos Vendedor', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'a2', tipo: 'proforma', descripcion: 'Proforma PROF-2026-0002 enviada a Hoteles del Perú', usuario: 'Ana Representante', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 'a3', tipo: 'pedido', descripcion: 'Pedido PED-2026-0001 pasó a "Listo para Despacho"', usuario: 'Marta Producción', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 'a4', tipo: 'stock', descripcion: 'Alerta: Horno Convector Industrial quedó en stock 0', usuario: 'Luis Almacenero', timestamp: new Date(Date.now() - 90 * 60000).toISOString() },
      { id: 'a5', tipo: 'venta', descripcion: 'Venta directa B001-452300 por S/ 1,850.00', usuario: 'Carlos Vendedor', timestamp: new Date(Date.now() - 120 * 60000).toISOString() },
      { id: 'a6', tipo: 'proforma', descripcion: 'Proforma PROF-2026-0001 marcada como En Negociación', usuario: 'Ana Representante', timestamp: new Date(Date.now() - 180 * 60000).toISOString() },
    ];
  },

  async getVendedoresPerformance(): Promise<VendedorPerformance[]> {
    return [
      { nombre: 'Carlos Vendedor', meta: 0, real: 42300, porcentaje: 0 },
      { nombre: 'Ana Representante', meta: 0, real: 61200, porcentaje: 0 },
      { nombre: 'Luis Almacenero', meta: 0, real: 0, porcentaje: 0 },
      { nombre: 'Marta Producción', meta: 0, real: 0, porcentaje: 0 },
    ];
  },

  // --- METAS CONFIG ---
  async getMetasConfig(): Promise<MetasConfig> {
    return getLocalData<MetasConfig>('fadicc_metas_config', { vendedor: 5000, representante: 8000 });
  },

  async setMetasConfig(config: MetasConfig): Promise<void> {
    setLocalData('fadicc_metas_config', config);
  },

  // --- PROVEEDORES ---
  async getProveedores(): Promise<Proveedor[]> {
    return getLocalData<Proveedor[]>('fadicc_proveedores', [
      { id: 'prov1', ruc: '20123456789', razon_social: 'Insumos Metálicos del Perú S.A.C.', contacto: 'Jorge Díaz', telefono: '+51 912 449 977', rubro: 'Materia Prima' },
      { id: 'prov2', ruc: '20987654321', razon_social: 'Hornos Industriales del Norte E.I.R.L.', contacto: 'Sofía López', telefono: '+51 912 449 977', rubro: 'Equipos y Repuestos' },
      { id: 'prov3', ruc: '20548796321', razon_social: 'Distribuidora Nacional S.A.', contacto: 'Roberto Quispe', telefono: '01-222-1111', rubro: 'Distribución y Logística' },
    ]);
  },

  async createProveedor(proveedor: Omit<Proveedor, 'id'>): Promise<Proveedor> {
    const proveedores = await this.getProveedores();
    const nuevo: Proveedor = { ...proveedor, id: 'prov_' + Math.random().toString(36).substr(2, 9) };
    proveedores.push(nuevo);
    setLocalData('fadicc_proveedores', proveedores);
    return nuevo;
  },

  // --- PROFORMAS EXTRA ---
  async getProformasVencidas(): Promise<Proforma[]> {
    const profs = await this.getProformas();
    const now = new Date().toISOString();
    return profs.filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_NEGOCIACION').filter(p => p.fecha_vencimiento < now);
  },

  // --- METAS Y ESTADÍSTICAS ---
  async getMetaDiaria(): Promise<{ meta_comercial: number; meta_industrial: number; fecha: string }> {
    return { meta_comercial: 5000, meta_industrial: 8000, fecha: new Date().toISOString() };
  },

  async getEstadisticasProduccion(): Promise<{ tiempo_promedio_fabricacion: number; entregados_mes: number; en_riesgo: number }> {
    const orders = await this.getOrders();
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
  },

  // --- AUTENTICACIÓN ---
  async login(email: string, password: string): Promise<Usuario | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('activo', true)
        .maybeSingle();

      if (!error && data) {
        if (password === '123456' || data.password_hash === password) {
          return { id: data.id, email: data.email, nombre: data.nombre, rol: data.rol, activo: data.activo };
        }
      }
      return null;
    }

    const user = INITIAL_USERS.find(u => u.email === email);
    if (user && password === '123456') return user;
    return null;
  },

  async recuperarPassword(email: string): Promise<boolean> {
    if (supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!error && data) {
        console.log(`[Simulación] Email de recuperación enviado a: ${email}`);
        return true;
      }
      return false;
    }

    const users = getLocalData<Usuario[]>('fadicc_usuarios_admin', INITIAL_USERS);
    const exists = users.some(u => u.email === email);
    if (exists) {
      console.log(`[Simulación] Email de recuperación enviado a: ${email}`);
    }
    return exists;
  },
};
