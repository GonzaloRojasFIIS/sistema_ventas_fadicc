import { Producto, Cliente, Usuario, Empresa, Contacto } from '@/types';

export const DATA_VERSION = '3';

export const INITIAL_PRODUCTS: Producto[] = [
  {
    id: 'p1', sku: 'FAD-1H-MP', nombre: 'Cocina 1 Hornillo Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 1 hornillo de alta presión. Ideal para puestos de comida y cocinas compactas.',
    categoria: 'Cocina Semi Industriales', precio_base: 480.00, costo: 320.00,
    stock_actual: 12, stock_minimo: 4, imagen: '/cocinas/Cocina-de-1-horno-mesa-y-pie.png'
  },
  {
    id: 'p2', sku: 'FAD-2H-MP', nombre: 'Cocina 2 Hornillos Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 2 hornillos de alta presión. Equilibrio entre capacidad y espacio.',
    categoria: 'Cocina Semi Industriales', precio_base: 720.00, costo: 480.00,
    stock_actual: 9, stock_minimo: 3, imagen: '/cocinas/Cocina-de-2-horno-mesa-y-pie.png'
  },
  {
    id: 'p3', sku: 'FAD-3H-MP', nombre: 'Cocina 3 Hornillos Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 3 hornillos de alta presión. Para restaurantes pequeños y medianos.',
    categoria: 'Cocina Semi Industriales', precio_base: 950.00, costo: 630.00,
    stock_actual: 7, stock_minimo: 3, imagen: '/cocinas/Cocina-de-3-horno-mesa-y-pie.png'
  },
  {
    id: 'p4', sku: 'FAD-4H-MP', nombre: 'Cocina 4 Hornillos Mesa y Pie',
    descripcion: 'Semi-industrial de acero inoxidable, 4 hornillos de alta presión. Máxima capacidad para cocinas comerciales.',
    categoria: 'Cocina Semi Industriales', precio_base: 1250.00, costo: 820.00,
    stock_actual: 5, stock_minimo: 2, imagen: '/cocinas/Cocina-de-4-horno-mesa-y-pie.png'
  },
  {
    id: 'p5', sku: 'FAD-2H-SL', nombre: 'Cocina De 2 Hornillas',
    descripcion: 'Modelo Slim-Line semi-industrial con 2 hornillas de alta presión y patas reforzadas.',
    categoria: 'Cocina Semi Industriales', precio_base: 680.00, costo: 450.00,
    stock_actual: 10, stock_minimo: 3, imagen: '/cocinas/De-2-hornias.png'
  },
  {
    id: 'p6', sku: 'FAD-3H-SL', nombre: 'Cocina De 3 Hornillas',
    descripcion: 'Modelo Slim-Line semi-industrial con 3 hornillas de alta presión y patas reforzadas.',
    categoria: 'Cocina Semi Industriales', precio_base: 890.00, costo: 590.00,
    stock_actual: 8, stock_minimo: 3, imagen: '/cocinas/De-3-hornias.png'
  },
  {
    id: 'p7', sku: 'FAD-4H-SL', nombre: 'Cocina De 4 Hornillas',
    descripcion: 'Modelo Slim-Line semi-industrial con 4 hornillas de alta presión y patas reforzadas.',
    categoria: 'Cocina Semi Industriales', precio_base: 1150.00, costo: 760.00,
    stock_actual: 6, stock_minimo: 2, imagen: '/cocinas/De-4-hornias.png'
  },
  {
    id: 'p8', sku: 'FAD-DOM-20', nombre: 'Cocina Doméstica 20″',
    descripcion: 'Cocina doméstica de 20 pulgadas con tapa de vidrio templado. 4 hornillas estándar para uso residencial.',
    categoria: 'Cocinas Domesticas', precio_base: 380.00, costo: 250.00,
    stock_actual: 15, stock_minimo: 5, imagen: '/cocinas/Cocinas-20in.png'
  },
  {
    id: 'p9', sku: 'FAD-DOM-22', nombre: 'Cocina Doméstica 22″',
    descripcion: 'Cocina doméstica de 22 pulgadas con tapa de vidrio templado. Mayor espacio de cocción para el hogar.',
    categoria: 'Cocinas Domesticas', precio_base: 450.00, costo: 300.00,
    stock_actual: 11, stock_minimo: 4, imagen: '/cocinas/Cocinas-22in.png'
  },
  {
    id: 'p10', sku: 'FAD-DOM-HO', nombre: 'Cocihorno',
    descripcion: 'Cocina doméstica con horno integrado en la base. 4 hornillas + horno eléctrico/gas. El todo en uno para tu hogar.',
    categoria: 'Cocinas Domesticas', precio_base: 520.00, costo: 340.00,
    stock_actual: 7, stock_minimo: 3, imagen: '/cocinas/Cocihorno.png'
  },
  {
    id: 'p11', sku: 'FAD-HOR-AC', nombre: 'Horno Acero',
    descripcion: 'Horno industrial construido completamente en acero inoxidable. Ideal para panaderías, pastelerías y restaurantes. Gran capacidad y durabilidad.',
    categoria: 'Hornos', precio_base: 2400.00, costo: 1580.00,
    stock_actual: 3, stock_minimo: 1, imagen: '/cocinas/Horno-Acero.png'
  },
  {
    id: 'p12', sku: 'FAD-HOR-CF', nombre: 'Chiferos & Fogones',
    descripcion: 'Sistema de cocción industrial tipo chifero/fogón de alta potencia. Usado en restaurantes chinos y cocinas de alto rendimiento.',
    categoria: 'Hornos', precio_base: 1100.00, costo: 720.00,
    stock_actual: 5, stock_minimo: 2, imagen: '/cocinas/Chiferos-y-Fogones.png'
  },
];

export const INITIAL_CLIENTS: Cliente[] = [
  { id: 'c1', tipo_documento: 'DNI', numero_documento: '44556677', razon_social_o_nombre: 'Juan Pérez', telefono: '912449977', email: 'juan.perez@email.com', direccion: 'Av. Arequipa 1234, Lince', tipo_cliente: 'PERSONA' },
  { id: 'c2', tipo_documento: 'RUC', numero_documento: '20123456789', razon_social_o_nombre: 'Constructora Horizonte S.A.C.', telefono: '+51 912 449 977', email: 'compras@horizonte.pe', direccion: 'Av. Javier Prado Este 505, San Isidro', tipo_cliente: 'EMPRESA' },
  { id: 'c3', tipo_documento: 'RUC', numero_documento: '20987654321', razon_social_o_nombre: 'Hoteles del Perú S.A.', telefono: '+51 912 449 977', email: 'contacto@hotelesperu.com', direccion: 'Calle Larco 789, Miraflores', tipo_cliente: 'EMPRESA' },
  { id: 'c4', tipo_documento: 'RUC', numero_documento: '20548796321', razon_social_o_nombre: 'Restaurantes La Cuesta E.I.R.L.', telefono: '01-222-1111', email: 'admin@lacuesta.pe', direccion: 'Jr. de la Unión 340, Cercado de Lima', tipo_cliente: 'EMPRESA' },
  { id: 'c5', tipo_documento: 'DNI', numero_documento: '47896532', razon_social_o_nombre: 'María Gonzales', telefono: '987654321', email: 'maria.g@gmail.com', direccion: 'Av. Brasil 890, Pueblo Libre', tipo_cliente: 'PERSONA' },
  { id: 'c6', tipo_documento: 'RUC', numero_documento: '20112233445', razon_social_o_nombre: 'Inmobiliaria del Norte S.A.C.', telefono: '01-555-7777', email: 'ventas@delnorte.pe', direccion: 'Av. Panamericana Norte Km 12, Los Olivos', tipo_cliente: 'EMPRESA' },
  { id: 'c7', tipo_documento: 'DNI', numero_documento: '45623178', razon_social_o_nombre: 'Pedro Ramírez', telefono: '956231478', email: 'pedro.r@hotmail.com', direccion: 'Av. Angamos 450, Surquillo', tipo_cliente: 'PERSONA' },
  { id: 'c8', tipo_documento: 'RUC', numero_documento: '20334455667', razon_social_o_nombre: 'Cadenas de Oro S.A.', telefono: '01-888-9999', email: 'logistica@cadenasoro.pe', direccion: 'Av. El Derby 210, Santiago de Surco', tipo_cliente: 'EMPRESA' },
];

export const INITIAL_USERS: Usuario[] = [
  { id: 'u1', email: 'admin@fadicc.com', nombre: 'Administrador General', rol: 'ADMIN', activo: true },
  { id: 'u2', email: 'vendedor@fadicc.com', nombre: 'Carlos Vendedor', rol: 'VENDEDOR', activo: true },
  { id: 'u3', email: 'representante@fadicc.com', nombre: 'Ana Representante', rol: 'REPRESENTANTE', activo: true },
  { id: 'u4', email: 'almacen@fadicc.com', nombre: 'Luis Almacenero', rol: 'ALMACEN', activo: true },
  { id: 'u5', email: 'produccion@fadicc.com', nombre: 'Marta Producción', rol: 'PRODUCCION', activo: true },
];

export const INITIAL_EMPRESAS: Empresa[] = [
  { id: 'e1', cliente_id: 'c2', ruc: '20123456789', razon_social: 'Constructora Horizonte S.A.C.', telefono: '+51 912 449 977', email: 'compras@horizonte.pe', direccion: 'Av. Javier Prado Este 505, San Isidro' },
  { id: 'e2', cliente_id: 'c3', ruc: '20987654321', razon_social: 'Hoteles del Perú S.A.', telefono: '+51 912 449 977', email: 'contacto@hotelesperu.com', direccion: 'Calle Larco 789, Miraflores' },
  { id: 'e3', cliente_id: 'c4', ruc: '20456123789', razon_social: 'Restaurantes Sabor S.A.C.', telefono: '+51 912 449 977', email: 'logistica@sabor.com.pe', direccion: 'Av. La Marina 2250, San Miguel' },
];

export const INITIAL_CONTACTOS: Contacto[] = [
  { id: 'co1', empresa_id: 'e1', nombre: 'Roberto Díaz', cargo: 'Jefe de Compras', telefono: '01-444-5556', email: 'rdiaz@horizonte.pe' },
  { id: 'co2', empresa_id: 'e2', nombre: 'Sofía Ramírez', cargo: 'Gerente General', telefono: '01-333-2223', email: 'sramirez@hotelesperu.com' },
  { id: 'co3', empresa_id: 'e3', nombre: 'Miguel Ángel Torres', cargo: 'Administrador', telefono: '01-555-6790', email: 'mtorres@sabor.com.pe' },
];

export const getLocalData = <T,>(key: string, initial: T): T => {
  if (typeof window === 'undefined') return initial;

  const currentVersion = localStorage.getItem('fadicc_data_version');
  if (currentVersion !== DATA_VERSION) {
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

export const setLocalData = <T,>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};
