-- ==========================================================
-- SCRIPT SEGURO PARA SUPABASE
-- Verifica existencia antes de modificar (no falla si no existe)
-- ==========================================================

-- ==========================================================
-- 1. CLIENTES
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'tipo_cliente') THEN
        ALTER TABLE clientes ADD COLUMN tipo_cliente VARCHAR(20) DEFAULT 'PERSONA';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'empresa_id') THEN
        ALTER TABLE clientes ADD COLUMN empresa_id VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'empresa_nombre') THEN
        ALTER TABLE clientes ADD COLUMN empresa_nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'contacto_nombre') THEN
        ALTER TABLE clientes ADD COLUMN contacto_nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'contacto_cargo') THEN
        ALTER TABLE clientes ADD COLUMN contacto_cargo VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'contacto_telefono') THEN
        ALTER TABLE clientes ADD COLUMN contacto_telefono VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'contacto_email') THEN
        ALTER TABLE clientes ADD COLUMN contacto_email VARCHAR(255);
    END IF;
END $$;

ALTER TABLE clientes ALTER COLUMN created_at SET DEFAULT NOW();

-- ==========================================================
-- 2. USUARIOS
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'password_hash') THEN
        ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255);
    END IF;
END $$;

-- ==========================================================
-- 3. MOVIMIENTOS_STOCK
-- ==========================================================
DO $$
BEGIN
    -- Primero verificar si existe diferencia como columna normal
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_stock' AND column_name = 'diferencia') THEN
        -- Si existe, eliminarla y recrear como generada
        ALTER TABLE movimientos_stock DROP COLUMN diferencia;
    END IF;
    -- Crear como generated column
    ALTER TABLE movimientos_stock ADD COLUMN diferencia NUMERIC GENERATED ALWAYS AS (cantidad_nueva - cantidad_anterior) STORED;
EXCEPTION WHEN duplicate_column THEN
    -- Si ya existe como generada, ignorar
    NULL;
END $$;

-- ==========================================================
-- 4. VENTAS_COMERCIALES
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'fecha_venta') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN fecha_venta TIMESTAMP DEFAULT NOW();
    ELSE
        ALTER TABLE ventas_comerciales ALTER COLUMN fecha_venta SET DEFAULT NOW();
    END IF;
END $$;

-- ==========================================================
-- 5. VENTA_DETALLES
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venta_detalles' AND column_name = 'nombre') THEN
        ALTER TABLE venta_detalles ADD COLUMN nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venta_detalles' AND column_name = 'sku') THEN
        ALTER TABLE venta_detalles ADD COLUMN sku VARCHAR(255);
    END IF;
END $$;

-- ==========================================================
-- 6. PROFORMAS
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proformas' AND column_name = 'fecha_emision') THEN
        ALTER TABLE proformas ADD COLUMN fecha_emision TIMESTAMP DEFAULT NOW();
    ELSE
        ALTER TABLE proformas ALTER COLUMN fecha_emision SET DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proformas' AND column_name = 'cliente_nombre') THEN
        ALTER TABLE proformas ADD COLUMN cliente_nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proformas' AND column_name = 'cliente_email') THEN
        ALTER TABLE proformas ADD COLUMN cliente_email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proformas' AND column_name = 'representante_nombre') THEN
        ALTER TABLE proformas ADD COLUMN representante_nombre VARCHAR(255);
    END IF;
END $$;

-- ==========================================================
-- 7. PROFORMA_DETALLES
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proforma_detalles' AND column_name = 'nombre') THEN
        ALTER TABLE proforma_detalles ADD COLUMN nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proforma_detalles' AND column_name = 'sku') THEN
        ALTER TABLE proforma_detalles ADD COLUMN sku VARCHAR(255);
    END IF;
END $$;

-- ==========================================================
-- 8. ORDEN_PEDIDOS
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orden_pedidos' AND column_name = 'cliente_nombre') THEN
        ALTER TABLE orden_pedidos ADD COLUMN cliente_nombre VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orden_pedidos' AND column_name = 'codigo_proforma') THEN
        ALTER TABLE orden_pedidos ADD COLUMN codigo_proforma VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orden_pedidos' AND column_name = 'total') THEN
        ALTER TABLE orden_pedidos ADD COLUMN total NUMERIC(12,2);
    END IF;
END $$;

-- ==========================================================
-- 9. CAJA_TURNOS
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caja_turnos' AND column_name = 'fecha_cierre') THEN
        ALTER TABLE caja_turnos ADD COLUMN fecha_cierre TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caja_turnos' AND column_name = 'monto_cierre') THEN
        ALTER TABLE caja_turnos ADD COLUMN monto_cierre NUMERIC(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caja_turnos' AND column_name = 'vendedor_nombre') THEN
        ALTER TABLE caja_turnos ADD COLUMN vendedor_nombre VARCHAR(255);
    END IF;
END $$;

-- ==========================================================
-- 10. EMPRESAS
-- ==========================================================
ALTER TABLE empresas ALTER COLUMN created_at SET DEFAULT NOW();

-- ==========================================================
-- 11. CONTACTOS
-- ==========================================================
ALTER TABLE contactos ALTER COLUMN created_at SET DEFAULT NOW();

-- ==========================================================
-- 12. PRODUCTOS
-- ==========================================================
ALTER TABLE productos ALTER COLUMN updated_at SET DEFAULT NOW();

-- ==========================================================
-- 13. VENTAS_COMERCIALES - campos de factura (opcionales)
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'forma_pago') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN forma_pago VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'moneda') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN moneda VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'guia_remision') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN guia_remision VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'orden_compra') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN orden_compra VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'subtotal') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN subtotal NUMERIC(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'igv') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN igv NUMERIC(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'monto_letras') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN monto_letras VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'detraccion_monto') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN detraccion_monto NUMERIC(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'credito_monto_neto') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN credito_monto_neto NUMERIC(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'credito_total_cuotas') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN credito_total_cuotas INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ventas_comerciales' AND column_name = 'credito_cuotas') THEN
        ALTER TABLE ventas_comerciales ADD COLUMN credito_cuotas JSONB;
    END IF;
END $$;

-- ==========================================================
-- 14. CORRELATIVOS (tabla para comprobantes si no existe)
-- ==========================================================
CREATE TABLE IF NOT EXISTS correlativos (
    tipo VARCHAR(20) PRIMARY KEY,
    serie VARCHAR(10) DEFAULT '001',
    numero_actual INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inicializar correlativos si están vacíos
INSERT INTO correlativos (tipo, serie, numero_actual) VALUES ('BOLETA', 'B001', 0) ON CONFLICT (tipo) DO NOTHING;
INSERT INTO correlativos (tipo, serie, numero_actual) VALUES ('FACTURA', 'F001', 0) ON CONFLICT (tipo) DO NOTHING;
