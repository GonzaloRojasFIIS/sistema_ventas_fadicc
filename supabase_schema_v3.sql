-- ==========================================================
-- FADICC - SCHEMA v3 NORMALIZADO (Recreate desde cero)
-- ==========================================================
-- CAMBIOS PRINCIPALES:
-- 1. clientes: entidad legal única para facturación
-- 2. empresas: enriquecimiento B2B con FK a clientes
-- 3. contactos: personas de empresa, con es_principal
-- 4. proveedores: contacto y rubro agregados
-- 5. orden_pedidos: fecha_entrega_real agregado
-- 6. productos: trigger auto-update updated_at
-- 7. correlativos: función corregida (filtro por serie)
-- ==========================================================

-- 1. Eliminar tablas existentes
DROP TABLE IF EXISTS movimientos_stock CASCADE;
DROP TABLE IF EXISTS venta_detalles CASCADE;
DROP TABLE IF EXISTS ventas_comerciales CASCADE;
DROP TABLE IF EXISTS proforma_detalles CASCADE;
DROP TABLE IF EXISTS proformas CASCADE;
DROP TABLE IF EXISTS orden_pedidos CASCADE;
DROP TABLE IF EXISTS contactos CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS caja_turnos CASCADE;
DROP TABLE IF EXISTS correlativos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS metas_config CASCADE;

-- ==========================================================
-- 2. Tablas
-- ==========================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('ADMIN', 'VENDEDOR', 'REPRESENTANTE', 'ALMACEN', 'PRODUCCION')),
    activo BOOLEAN DEFAULT true,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(10) NOT NULL CHECK (tipo_documento IN ('DNI', 'RUC')),
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    razon_social_o_nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    tipo_cliente VARCHAR(20) DEFAULT 'PERSONA' CHECK (tipo_cliente IN ('PERSONA', 'EMPRESA')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) UNIQUE,
    ruc VARCHAR(11) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    sector VARCHAR(100),
    tamano VARCHAR(50),
    rango_compra VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    es_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio_base NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo NUMERIC(12,2),
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    imagen VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE caja_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NOT NULL REFERENCES usuarios(id),
    vendedor_nombre VARCHAR(255),
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    monto_apertura NUMERIC(12,2) NOT NULL,
    monto_cierre NUMERIC(12,2),
    estado VARCHAR(20) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

CREATE TABLE correlativos (
    tipo VARCHAR(20) PRIMARY KEY,
    serie VARCHAR(10) DEFAULT '001',
    numero_actual INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ventas_comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    vendedor_id UUID NOT NULL REFERENCES usuarios(id),
    caja_turno_id UUID REFERENCES caja_turnos(id),
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('BOLETA', 'FACTURA')),
    numero_comprobante VARCHAR(20) NOT NULL,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    fecha_venta TIMESTAMP DEFAULT NOW(),
    forma_pago VARCHAR(20),
    moneda VARCHAR(10),
    guia_remision VARCHAR(50),
    orden_compra VARCHAR(50),
    subtotal NUMERIC(12,2),
    igv NUMERIC(12,2),
    monto_letras VARCHAR(255),
    detraccion_monto NUMERIC(12,2),
    credito_monto_neto NUMERIC(12,2),
    credito_total_cuotas INTEGER,
    credito_cuotas JSONB,
    -- Denormalizado para histórico
    cliente_nombre VARCHAR(255),
    receptor_nombre VARCHAR(255),
    receptor_ruc VARCHAR(20)
);

CREATE TABLE venta_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas_comerciales(id),
    producto_id UUID NOT NULL REFERENCES productos(id),
    nombre VARCHAR(255),
    sku VARCHAR(255),
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE proformas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    contacto_id UUID REFERENCES contactos(id),
    contacto_nombre VARCHAR(255),
    contacto_email VARCHAR(255),
    cliente_nombre VARCHAR(255),
    cliente_email VARCHAR(255),
    representante_id UUID REFERENCES usuarios(id),
    representante_nombre VARCHAR(255),
    codigo_proforma VARCHAR(50) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_NEGOCIACION', 'APROBADA', 'DESPACHADA', 'RECHAZADA', 'EXPIRADA')),
    fecha_emision TIMESTAMP DEFAULT NOW(),
    fecha_vencimiento TIMESTAMP,
    total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE proforma_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proforma_id UUID NOT NULL REFERENCES proformas(id),
    producto_id UUID NOT NULL REFERENCES productos(id),
    nombre VARCHAR(255),
    sku VARCHAR(255),
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio_pactado NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE orden_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proforma_id UUID REFERENCES proformas(id),
    cliente_nombre VARCHAR(255),
    codigo_proforma VARCHAR(50),
    codigo_pedido VARCHAR(50) NOT NULL,
    total NUMERIC(12,2),
    estado_produccion VARCHAR(50) DEFAULT 'EN_PRODUCCION',
    fecha_aprobacion TIMESTAMP,
    fecha_entrega_estimada TIMESTAMP,
    fecha_entrega_real TIMESTAMP
);

CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'CORRECCION')),
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('COMPRA_PROVEEDOR', 'DEVOLUCION_CLIENTE', 'MERMA', 'AJUSTE_CONTEO', 'VENTA')),
    cantidad_anterior INTEGER NOT NULL DEFAULT 0,
    cantidad_nueva INTEGER NOT NULL DEFAULT 0,
    diferencia NUMERIC GENERATED ALWAYS AS (cantidad_nueva - cantidad_anterior) STORED,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    usuario_nombre VARCHAR(255),
    observacion TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE metas_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50),
    meta_mensual NUMERIC(12,2),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- 3. Índices para performance
-- ==========================================================
CREATE INDEX idx_empresas_cliente_id ON empresas(cliente_id);
CREATE INDEX idx_contactos_empresa_id ON contactos(empresa_id);
CREATE INDEX idx_contactos_principal ON contactos(empresa_id, es_principal);
CREATE INDEX idx_ventas_cliente_id ON ventas_comerciales(cliente_id);
CREATE INDEX idx_ventas_fecha ON ventas_comerciales(fecha_venta);
CREATE INDEX idx_proformas_cliente_id ON proformas(cliente_id);
CREATE INDEX idx_ordenes_proforma_id ON orden_pedidos(proforma_id);
CREATE INDEX idx_movimientos_producto_id ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_stock(fecha);

-- ==========================================================
-- 4. Triggers
-- ==========================================================

-- Auto-update updated_at en productos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 5. Datos iniciales
-- ==========================================================

INSERT INTO usuarios (email, nombre, rol, activo, password_hash) VALUES
('admin@fadicc.com', 'Administrador General', 'ADMIN', true, '123456'),
('vendedor@fadicc.com', 'Vendedor Demo', 'VENDEDOR', true, '123456'),
('representante@fadicc.com', 'Representante Demo', 'REPRESENTANTE', true, '123456'),
('almacen@fadicc.com', 'Almacén Demo', 'ALMACEN', true, '123456'),
('produccion@fadicc.com', 'Producción Demo', 'PRODUCCION', true, '123456');

INSERT INTO correlativos (tipo, serie, numero_actual) VALUES
('BOLETA', 'B001', 0),
('FACTURA', 'F001', 0);

INSERT INTO metas_config (tipo, meta_mensual) VALUES ('ventas', 50000.00);

INSERT INTO productos (sku, nombre, descripcion, categoria, precio_base, costo, stock_actual, stock_minimo, imagen) VALUES
('FAD-1H-MP', 'Cocina 1 Hornillo Mesa y Pie', 'Semi-industrial de acero inoxidable, 1 hornillo de alta presión.', 'Cocinas', 1299.00, 800.00, 12, 4, '/cocinas/Cocina-de-1-horno-mesa-y-pie.png'),
('FAD-2H-MP', 'Cocina 2 Hornillos Mesa y Pie', 'Semi-industrial de acero inoxidable, 2 hornillos de alta presión.', 'Cocinas', 1899.00, 1200.00, 9, 3, '/cocinas/Cocina-de-2-horno-mesa-y-pie.png'),
('FAD-3H-MP', 'Cocina 3 Hornillos Mesa y Pie', 'Semi-industrial de acero inoxidable, 3 hornillos de alta presión.', 'Cocinas', 2499.00, 1600.00, 7, 3, '/cocinas/Cocina-de-3-horno-mesa-y-pie.png'),
('FAD-4H-MP', 'Cocina 4 Hornillos Mesa y Pie', 'Semi-industrial de acero inoxidable, 4 hornillos de alta presión.', 'Cocinas', 3199.00, 2100.00, 5, 2, '/cocinas/Cocina-de-4-horno-mesa-y-pie.png'),
('FAD-2H-EM', 'Cocina 2 Hornillos Empotrable', 'Para empotrar en mesón, 2 hornillos de alta presión.', 'Cocinas', 1699.00, 1100.00, 10, 3, '/cocinas/De-2-hornias.png'),
('FAD-3H-EM', 'Cocina 3 Hornillos Empotrable', 'Para empotrar en mesón, 3 hornillos de alta presión.', 'Cocinas', 2299.00, 1500.00, 8, 3, '/cocinas/De-3-hornias.png'),
('FAD-4H-EM', 'Cocina 4 Hornillos Empotrable', 'Para empotrar en mesón, 4 hornillos de alta presión.', 'Cocinas', 2899.00, 1900.00, 6, 2, '/cocinas/De-4-hornias.png'),
('FAD-20IN', 'Cocina 20in', 'Cocina industrial estándar 20 pulgadas.', 'Cocinas', 3599.00, 2400.00, 15, 5, '/cocinas/Cocinas-20in.png'),
('FAD-22IN', 'Cocina 22in', 'Cocina industrial estándar 22 pulgadas.', 'Cocinas', 3999.00, 2700.00, 11, 4, '/cocinas/Cocinas-22in.png'),
('FAD-COCI', 'Cocihorno', 'Cocina con horno integrado.', 'Cocinas', 4599.00, 3100.00, 7, 3, '/cocinas/Cocihorno.png'),
('FAD-HAAC', 'Horno Acero', 'Horno industrial de acero inoxidable.', 'Hornos', 2899.00, 1900.00, 3, 1, '/cocinas/Horno-Acero.png'),
('FAD-CHIF', 'Chifero y Fogones', 'Equipo de chifero con fogones.', 'Accesorios', 1999.00, 1300.00, 5, 2, '/cocinas/Chiferos-y-Fogones.png');

-- Personas naturales
INSERT INTO clientes (tipo_documento, numero_documento, razon_social_o_nombre, telefono, email, direccion, tipo_cliente) VALUES
('DNI', '45678231', 'Juan Pérez García', '987654321', 'juan.perez@mail.com', 'Av. Principal 123, Lima', 'PERSONA');

-- Empresas (clientes + empresas + contactos)
INSERT INTO clientes (tipo_documento, numero_documento, razon_social_o_nombre, telefono, email, direccion, tipo_cliente) VALUES
('RUC', '20123456789', 'Constructora Horizonte S.A.C.', '+51 912 449 977', 'compras@horizonte.pe', 'Av. Javier Prado Este 505, San Isidro', 'EMPRESA'),
('RUC', '20987654321', 'Hoteles del Perú S.A.', '+51 912 449 977', 'contacto@hotelesperu.com', 'Calle Larco 789, Miraflores', 'EMPRESA'),
('RUC', '20548796321', 'Restaurantes La Cuesta E.I.R.L.', '01-222-1111', 'admin@lacuesta.pe', 'Jr. de la Unión 340, Cercado de Lima', 'EMPRESA');

-- Enriquecimiento de empresas (cliente_id se resuelve en el código de aplicación)
-- Nota: en producción, usar WITH para insertar con cliente_id

-- ==========================================================
-- 6. Row Level Security (RLS) - Desactivado para anon access
-- ==========================================================
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE contactos DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE caja_turnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_comerciales DISABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles DISABLE ROW LEVEL SECURITY;
ALTER TABLE proformas DISABLE ROW LEVEL SECURITY;
ALTER TABLE proforma_detalles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orden_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE correlativos DISABLE ROW LEVEL SECURITY;
ALTER TABLE metas_config DISABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 7. Funciones
-- ==========================================================

-- Correlativos (corregido: filtra por tipo AND serie)
CREATE OR REPLACE FUNCTION incrementar_correlativo(p_tipo_comprobante VARCHAR, p_serie VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_numero INTEGER;
BEGIN
    UPDATE correlativos
    SET numero_actual = numero_actual + 1,
        updated_at = NOW()
    WHERE tipo = p_tipo_comprobante AND serie = p_serie
    RETURNING numero_actual INTO v_numero;
    
    IF v_numero IS NULL THEN
        INSERT INTO correlativos (tipo, serie, numero_actual)
        VALUES (p_tipo_comprobante, p_serie, 1)
        RETURNING numero_actual INTO v_numero;
    END IF;
    
    RETURN v_numero;
END;
$$;

-- ==========================================================
-- 8. Verificación
-- ==========================================================
SELECT 'Schema v3 creado correctamente' as status;
