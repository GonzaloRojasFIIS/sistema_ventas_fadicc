-- =========================================================================
-- Script de Población de Datos FADICC v2.0 (Demo Completo)
-- Ejecutar en: Supabase > SQL Editor
-- Descripción: Agrega clientes, ventas, proformas, órdenes y movimientos
-- =========================================================================

-- =========================================================================
-- 1. MÁS CLIENTES (15 nuevos, total 20)
-- =========================================================================
INSERT INTO clientes (tipo_documento, numero_documento, razon_social_o_nombre, telefono, email, direccion, contacto_nombre, contacto_cargo, contacto_telefono, contacto_email) VALUES
('DNI', '11223344', 'Roberto Sánchez Vega',             '987654321', 'roberto.s@email.com',        'Av. Larco 340, Miraflores', NULL, NULL, NULL, NULL),
('DNI', '55667788', 'Lucía Fernández Gómez',            '912345678', 'lucia.f@email.com',          'Jr. Carabaya 120, Cercado', NULL, NULL, NULL, NULL),
('RUC', '20555566677', 'Restaurantes El Sabor S.A.C.',   '01-222-3333', 'admin@elsabor.pe',          'Av. La Marina 880, San Miguel', 'Juan Pérez', 'Jefe de Compras', '01-222-3334', 'jperez@elsabor.pe'),
('RUC', '20111122233', 'Inmobiliaria del Sol S.A.C.',    '01-777-8888', 'ventas@delsol.pe',          'Av. Javier Prado 2450, San Borja', 'Ana García', 'Gerente Comercial', '01-777-8889', 'agarcia@delsol.pe'),
('RUC', '20999988877', 'Hoteles Cusco E.I.R.L.',         '01-444-5555', 'reservas@hotelcusco.com',    'Calle Belén 256, Cusco', 'Luis Ramírez', 'Director de Operaciones', '01-444-5556', 'lramirez@hotelcusco.com'),
('DNI', '33445566', 'Carlos Mendoza Ríos',              '956789123', 'carlos.m@hotmail.com',       'Av. Angamos 780, Surquillo', NULL, NULL, NULL, NULL),
('RUC', '20666677788', 'Constructora Andina S.A.',       '01-333-9999', 'compras@andina.pe',          'Av. República de Panamá 2345, San Isidro', 'María López', 'Coordinadora de Proyectos', '01-333-9990', 'mlopez@andina.pe'),
('DNI', '77889900', 'Diana Quispe Huamán',              '943216578', 'diana.q@gmail.com',            'Av. Brasil 450, Pueblo Libre', NULL, NULL, NULL, NULL),
('RUC', '20333344455', 'Cafeterías del Centro S.A.C.',   '01-666-2222', 'pedidos@cafecentro.pe',      'Jr. de la Unión 560, Lima', 'Pedro Sánchez', 'Administrador', '01-666-2223', 'psanchez@cafecentro.pe'),
('DNI', '22334455', 'Pedro Castillo Torres',            '978901234', 'pedro.c@yahoo.com',            'Av. Arequipa 1890, Lince'),
('RUC', '20777788899', 'Supermercados Mega S.A.',        '01-555-4444', 'abastecimiento@mega.pe',     'Av. Panamericana Norte 3400, Los Olivos'),
('DNI', '66778899', 'Ana María Ruiz Díaz',              '934567890', 'anamaria.r@email.com',       'Calle Las Flores 123, San Borja'),
('RUC', '20444455566', 'Cadenas de Plata S.A.C.',        '01-888-7777', 'logistica@plata.pe',         'Av. El Derby 540, Surco'),
('DNI', '44556677', 'José Luis Ramírez',                '967890123', 'joseluis.r@gmail.com',       'Av. Paseo de la República 1200, San Isidro'),
('RUC', '20888899900', 'Panaderías La Espiga E.I.R.L.',  '01-999-1111', 'compras@laespiga.pe',        'Av. Guardia Civil 890, San Juan de Lurigancho')
ON CONFLICT (numero_documento) DO NOTHING;

-- =========================================================================
-- 2. MÁS VENTAS COMERCIALES (15 ventas, total ~20)
-- =========================================================================

-- Nota: Generamos UUIDs dinámicos para clientes/vendedores
DO $$
DECLARE
    v_carlos UUID;
    v_admin UUID;
    v_caja1 UUID;
    v_caja2 UUID;
    v_caja3 UUID;
BEGIN
    -- Obtener IDs de vendedores
    SELECT id INTO v_carlos FROM usuarios WHERE email = 'vendedor@fadicc.com';
    SELECT id INTO v_admin FROM usuarios WHERE email = 'admin@fadicc.com';

    -- Crear cajas de turno
    INSERT INTO caja_turnos (vendedor_id, fecha_apertura, monto_apertura, estado)
    VALUES (v_carlos, NOW() - INTERVAL '2 days', 200.00, 'CERRADA')
    RETURNING id INTO v_caja1;

    INSERT INTO caja_turnos (vendedor_id, fecha_apertura, monto_apertura, estado)
    VALUES (v_carlos, NOW() - INTERVAL '1 day', 250.00, 'CERRADA')
    RETURNING id INTO v_caja2;

    INSERT INTO caja_turnos (vendedor_id, fecha_apertura, monto_apertura, estado)
    VALUES (v_carlos, NOW(), 300.00, 'ABIERTA')
    RETURNING id INTO v_caja3;

    -- Cerrar las primeras 2 cajas
    UPDATE caja_turnos SET estado = 'CERRADA', fecha_cierre = fecha_apertura + INTERVAL '8 hours', monto_cierre = monto_apertura + 1500.00
    WHERE id IN (v_caja1, v_caja2);
END $$;

-- Insertar ventas con IDs de cajas existentes
INSERT INTO ventas_comerciales (cliente_id, vendedor_id, caja_turno_id, tipo_comprobante, numero_comprobante, total, fecha_venta)
SELECT 
    c.id,
    u.id,
    ct.id,
    CASE WHEN random() > 0.5 THEN 'BOLETA' ELSE 'FACTURA' END,
    'B001-' || LPAD((100000 + ROW_NUMBER() OVER ()::int)::text, 6, '0'),
    ROUND((random() * 2000 + 300)::numeric, 2),
    NOW() - (random() * INTERVAL '3 days')
FROM generate_series(1, 15) g
CROSS JOIN LATERAL (SELECT id FROM clientes ORDER BY random() LIMIT 1) c
CROSS JOIN LATERAL (SELECT id FROM usuarios WHERE rol = 'VENDEDOR' LIMIT 1) u
CROSS JOIN LATERAL (SELECT id FROM caja_turnos ORDER BY random() LIMIT 1) ct
ON CONFLICT (numero_comprobante) DO NOTHING;

-- =========================================================================
-- 3. DETALLES DE VENTA
-- =========================================================================
INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT 
    v.id,
    p.id,
    (random() * 3 + 1)::int,
    p.precio_base,
    (random() * 3 + 1)::int * p.precio_base
FROM ventas_comerciales v
CROSS JOIN LATERAL (SELECT id, precio_base FROM productos ORDER BY random() LIMIT 1) p
WHERE NOT EXISTS (SELECT 1 FROM venta_detalles vd WHERE vd.venta_id = v.id)
LIMIT 30;

-- =========================================================================
-- 4. MÁS PROFORMAS (8 nuevas)
-- =========================================================================
INSERT INTO proformas (cliente_id, representante_id, codigo_proforma, estado, fecha_emision, fecha_vencimiento, total)
SELECT 
    c.id,
    u.id,
    'PROF-2026-' || LPAD((10 + ROW_NUMBER() OVER ()::int)::text, 4, '0'),
    CASE 
        WHEN ROW_NUMBER() OVER () % 5 = 0 THEN 'PENDIENTE'
        WHEN ROW_NUMBER() OVER () % 5 = 1 THEN 'EN_NEGOCIACION'
        WHEN ROW_NUMBER() OVER () % 5 = 2 THEN 'APROBADA'
        WHEN ROW_NUMBER() OVER () % 5 = 3 THEN 'RECHAZADA'
        ELSE 'EXPIRADA'
    END,
    NOW() - (random() * INTERVAL '10 days'),
    NOW() + (random() * INTERVAL '20 days'),
    ROUND((random() * 10000 + 2000)::numeric, 2)
FROM generate_series(1, 8) g
CROSS JOIN LATERAL (SELECT id FROM clientes WHERE tipo_documento = 'RUC' ORDER BY random() LIMIT 1) c
CROSS JOIN LATERAL (SELECT id FROM usuarios WHERE rol = 'REPRESENTANTE' LIMIT 1) u
ON CONFLICT (codigo_proforma) DO NOTHING;

-- =========================================================================
-- 5. DETALLES DE PROFORMA
-- =========================================================================
INSERT INTO proforma_detalles (proforma_id, producto_id, cantidad, precio_pactado, subtotal)
SELECT 
    p.id,
    prod.id,
    (random() * 5 + 1)::int,
    prod.precio_base * (0.85 + random() * 0.3), -- precio pactado ±15%
    (random() * 5 + 1)::int * prod.precio_base * (0.85 + random() * 0.3)
FROM proformas p
CROSS JOIN LATERAL (SELECT id, precio_base FROM productos ORDER BY random() LIMIT 2) prod
WHERE NOT EXISTS (SELECT 1 FROM proforma_detalles pd WHERE pd.proforma_id = p.id)
LIMIT 40;

-- =========================================================================
-- 6. ÓRDENES DE PEDIDO (desde proformas APROBADAS)
-- =========================================================================
INSERT INTO orden_pedidos (proforma_id, codigo_pedido, estado_produccion, fecha_aprobacion, fecha_entrega_estimada)
SELECT 
    p.id,
    'PED-2026-' || LPAD((10 + ROW_NUMBER() OVER ()::int)::text, 4, '0'),
    CASE 
        WHEN ROW_NUMBER() OVER () % 3 = 0 THEN 'EN_PRODUCCION'
        WHEN ROW_NUMBER() OVER () % 3 = 1 THEN 'LISTO_PARA_DESPACHO'
        ELSE 'ENTREGADO'
    END,
    p.fecha_emision,
    p.fecha_emision + INTERVAL '15 days'
FROM proformas p
WHERE p.estado = 'APROBADA'
  AND NOT EXISTS (SELECT 1 FROM orden_pedidos o WHERE o.proforma_id = p.id)
ON CONFLICT (codigo_pedido) DO NOTHING;

-- =========================================================================
-- 7. MOVIMIENTOS DE STOCK (20 movimientos variados)
-- =========================================================================
INSERT INTO movimientos_stock (producto_id, tipo, motivo, cantidad_anterior, cantidad_nueva, usuario_id, observacion, fecha)
SELECT 
    p.id,
    CASE WHEN random() > 0.4 THEN 'ENTRADA' ELSE 'SALIDA' END,
    CASE WHEN random() > 0.4 THEN 'COMPRA_PROVEEDOR' ELSE 'AJUSTE_CONTEO' END,
    p.stock_actual,
    GREATEST(0, p.stock_actual + (CASE WHEN random() > 0.4 THEN (random() * 10 + 1)::int ELSE -(random() * 5 + 1)::int END)),
    (SELECT id FROM usuarios WHERE rol = 'ALMACEN' LIMIT 1),
    CASE 
        WHEN random() > 0.7 THEN 'Recepción de proveedor'
        WHEN random() > 0.5 THEN 'Ajuste por conteo físico'
        ELSE 'Merma detectada en inspección'
    END,
    NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 20) g
CROSS JOIN LATERAL (SELECT id, stock_actual FROM productos ORDER BY random() LIMIT 1) p
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 8. VERIFICACIÓN
-- =========================================================================
SELECT 
    (SELECT COUNT(*) FROM clientes) AS total_clientes,
    (SELECT COUNT(*) FROM ventas_comerciales) AS total_ventas,
    (SELECT COUNT(*) FROM proformas) AS total_proformas,
    (SELECT COUNT(*) FROM orden_pedidos) AS total_ordenes,
    (SELECT COUNT(*) FROM movimientos_stock) AS total_movimientos;
