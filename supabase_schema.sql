-- =========================================================================
-- Script de Inicialización de Base de Datos FADICC S.A. v2.0
-- Ejecutar en: Supabase > SQL Editor
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '123456',
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('ADMIN', 'VENDEDOR', 'REPRESENTANTE', 'ALMACEN', 'PRODUCCION')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(10) NOT NULL CHECK (tipo_documento IN ('DNI', 'RUC')),
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    razon_social_o_nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTOS (con campo categoría e imagen)
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100) DEFAULT 'General',
    precio_base NUMERIC(10, 2) NOT NULL,
    stock_actual INT DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT DEFAULT 5,
    imagen TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CAJAS DE TURNO
CREATE TABLE IF NOT EXISTS caja_turnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_apertura NUMERIC(10, 2) NOT NULL,
    monto_cierre NUMERIC(10, 2),
    estado VARCHAR(20) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

-- 5. VENTAS COMERCIALES (CANAL DIRECTO)
CREATE TABLE IF NOT EXISTS ventas_comerciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
    vendedor_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    caja_turno_id UUID REFERENCES caja_turnos(id) ON DELETE RESTRICT,
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('BOLETA', 'FACTURA')),
    numero_comprobante VARCHAR(50) UNIQUE NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DETALLES DE VENTA
CREATE TABLE IF NOT EXISTS venta_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID REFERENCES ventas_comerciales(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 7. PROFORMAS (CANAL INDUSTRIAL)
CREATE TABLE IF NOT EXISTS proformas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
    representante_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    codigo_proforma VARCHAR(50) UNIQUE NOT NULL,
    estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_NEGOCIACION', 'APROBADA', 'RECHAZADA', 'EXPIRADA')),
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

-- 8. DETALLES DE PROFORMA
CREATE TABLE IF NOT EXISTS proforma_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_id UUID REFERENCES proformas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_pactado NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 9. ÓRDENES DE PEDIDO (generadas desde Proformas aprobadas)
CREATE TABLE IF NOT EXISTS orden_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_id UUID UNIQUE REFERENCES proformas(id) ON DELETE RESTRICT,
    codigo_pedido VARCHAR(50) UNIQUE NOT NULL,
    estado_produccion VARCHAR(30) DEFAULT 'EN_PRODUCCION' CHECK (estado_produccion IN ('EN_PRODUCCION', 'LISTO_PARA_DESPACHO', 'ENTREGADO')),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada TIMESTAMP WITH TIME ZONE,
    fecha_entrega_real TIMESTAMP WITH TIME ZONE
);

-- 10. MOVIMIENTOS DE STOCK [NUEVA TABLA]
-- Registra toda entrada, salida o corrección de inventario para trazabilidad completa.
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'CORRECCION')),
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('COMPRA_PROVEEDOR', 'DEVOLUCION_CLIENTE', 'MERMA', 'AJUSTE_CONTEO', 'VENTA')),
    cantidad_anterior INT NOT NULL,
    cantidad_nueva INT NOT NULL,
    diferencia INT GENERATED ALWAYS AS (cantidad_nueva - cantidad_anterior) STORED,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
    observacion TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- ÍNDICES DE RENDIMIENTO
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas_comerciales(fecha_venta DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_caja ON ventas_comerciales(caja_turno_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas_comerciales(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proformas_estado ON proformas(estado);
CREATE INDEX IF NOT EXISTS idx_proformas_cliente ON proformas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON orden_pedidos(estado_produccion);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_doc ON clientes(tipo_documento, numero_documento);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_caja_vendedor ON caja_turnos(vendedor_id, estado);

-- =========================================================================
-- DATOS DE SEMILLA (SEED DATA)
-- =========================================================================

-- Usuarios (contraseña: 123456 para todos)
INSERT INTO usuarios (email, password_hash, nombre, rol, activo) VALUES
('admin@fadicc.com',           '123456', 'Administrador General',   'ADMIN',          true),
('vendedor@fadicc.com',        '123456', 'Carlos Mendoza',          'VENDEDOR',        true),
('vendedor2@fadicc.com',       '123456', 'Patricia Torres',         'VENDEDOR',        true),
('representante@fadicc.com',   '123456', 'Ana Quispe',              'REPRESENTANTE',   true),
('almacen@fadicc.com',         '123456', 'Luis Paredes',            'ALMACEN',         true),
('produccion@fadicc.com',      '123456', 'Marta Chávez',            'PRODUCCION',      true)
ON CONFLICT (email) DO NOTHING;

-- Clientes
INSERT INTO clientes (tipo_documento, numero_documento, razon_social_o_nombre, telefono, email, direccion) VALUES
('DNI', '44556677', 'Juan Pérez Quispe',                '999 888 777', 'juan.perez@email.com',       'Av. Arequipa 1234, Lince, Lima'),
('DNI', '78901234', 'María García López',               '987 654 321', 'maria.garcia@email.com',     'Jr. Lampa 456, Cercado, Lima'),
('RUC', '20123456789', 'Constructora Horizonte S.A.C.', '01-444-5555', 'compras@horizonte.pe',       'Av. Javier Prado Este 505, San Isidro'),
('RUC', '20987654321', 'Hoteles del Perú S.A.',         '01-333-2222', 'contacto@hotelesperu.com',   'Calle Larco 789, Miraflores'),
('RUC', '20456123789', 'Restaurantes Sabor S.A.C.',     '01-555-6789', 'logistica@sabor.com.pe',     'Av. La Marina 2250, San Miguel')
ON CONFLICT (numero_documento) DO NOTHING;

-- Productos (con categoría e imagen)
INSERT INTO productos (sku, nombre, descripcion, categoria, precio_base, stock_actual, stock_minimo, imagen) VALUES
('COC-IND-04', 'Cocina Industrial 4 Hornillas',      'Acero inoxidable 304, alta presión, quemadores de hierro fundido',        'Industrial',  1250.00, 8,  3, '/cocinas/Cocina-de-4-horno-mesa-y-pie.png'),
('COC-IND-06', 'Cocina Industrial 6 Hornillas',      'Con horno convector integrado, acero inoxidable, ideal restaurantes',     'Industrial',  1890.00, 4,  2, '/cocinas/De-3-hornias.png'),
('COC-IND-08', 'Cocina Industrial 8 Hornillas',      'Modelo profesional doble-cuerpo, para cocinas de gran volumen',          'Industrial',  2850.00, 2,  2, '/cocinas/De-4-hornias.png'),
('COC-COM-04', 'Cocina Semi-Industrial 4 Hornillas', 'Diseño compacto para uso comercial ligero o doméstico exigente',         'Comercial',    750.00, 12, 5, '/cocinas/Cocina-de-2-horno-mesa-y-pie.png'),
('COC-DOM-04', 'Cocina Doméstica Premium 4 Hornillas','Gas, encendido eléctrico, tapa de vidrio templado, rejillas de hierro', 'Doméstico',    450.00, 2,  5, '/cocinas/Cocinas-22in.png'),
('HOR-IND-01', 'Horno Convector Industrial',         'Capacidad 10 bandejas 60x40, control digital de temperatura',            'Industrial',  3400.00, 0,  1, '/cocinas/Horno-Acero.png'),
('HOR-COM-01', 'Horno Mixto Comercial',              'Gas/eléctrico, 6 bandejas, ideal panaderías y pastelerías medianas',     'Comercial',   1890.00, 3,  2, '/cocinas/Chiferos-y-Fogones.png'),
('ACC-PLA-01', 'Plancha Industrial Lisa',             'Acero grueso 10mm, doble quemador, mango antitérmico',                  'Accesorios',   890.00, 6,  3, '/cocinas/Cocina-de-1-horno-mesa-y-pie.png')
ON CONFLICT (sku) DO NOTHING;

-- Proforma de prueba (PENDIENTE)
INSERT INTO proformas (cliente_id, representante_id, codigo_proforma, estado, fecha_vencimiento, total)
VALUES (
    (SELECT id FROM clientes WHERE numero_documento = '20123456789'),
    (SELECT id FROM usuarios WHERE email = 'representante@fadicc.com'),
    'PROF-2026-0001',
    'PENDIENTE',
    NOW() + INTERVAL '15 days',
    3140.00
) ON CONFLICT (codigo_proforma) DO NOTHING;

-- Detalle de la proforma
INSERT INTO proforma_detalles (proforma_id, producto_id, cantidad, precio_pactado, subtotal)
SELECT 
    p.id,
    prod.id,
    2,
    1200.00,
    2400.00
FROM proformas p, productos prod
WHERE p.codigo_proforma = 'PROF-2026-0001' AND prod.sku = 'COC-IND-04'
ON CONFLICT DO NOTHING;

INSERT INTO proforma_detalles (proforma_id, producto_id, cantidad, precio_pactado, subtotal)
SELECT 
    p.id,
    prod.id,
    1,
    740.00,
    740.00
FROM proformas p, productos prod
WHERE p.codigo_proforma = 'PROF-2026-0001' AND prod.sku = 'COC-COM-04'
ON CONFLICT DO NOTHING;

-- Segunda proforma EN NEGOCIACION
INSERT INTO proformas (cliente_id, representante_id, codigo_proforma, estado, fecha_vencimiento, total)
VALUES (
    (SELECT id FROM clientes WHERE numero_documento = '20987654321'),
    (SELECT id FROM usuarios WHERE email = 'representante@fadicc.com'),
    'PROF-2026-0002',
    'EN_NEGOCIACION',
    NOW() + INTERVAL '10 days',
    9450.00
) ON CONFLICT (codigo_proforma) DO NOTHING;

INSERT INTO proforma_detalles (proforma_id, producto_id, cantidad, precio_pactado, subtotal)
SELECT 
    p.id,
    prod.id,
    5,
    1890.00,
    9450.00
FROM proformas p, productos prod
WHERE p.codigo_proforma = 'PROF-2026-0002' AND prod.sku = 'COC-IND-06'
ON CONFLICT DO NOTHING;
