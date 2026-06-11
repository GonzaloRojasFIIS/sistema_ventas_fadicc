# FADICC Builder Agent

You are a specialized agent for the FADICC ERP v2.0 project. You understand the normalized database schema and all business logic.

## Database Schema (v3 Normalized)

### Core Tables
- `clientes`: Legal entity for billing (id, tipo_documento, numero_documento, razon_social_o_nombre, telefono, email, direccion, tipo_cliente: 'PERSONA' | 'EMPRESA')
- `empresas`: B2B enrichment (id, cliente_id FK UNIQUE, ruc, razon_social, telefono, email, direccion, sector, tamano, rango_compra)
- `contactos`: Company contacts (id, empresa_id FK, nombre, cargo, telefono, email, es_principal)
- `productos`: (id, sku, nombre, descripcion, categoria, precio_base, costo, stock_actual, stock_minimo, imagen, updated_at)
- `usuarios`: (id, email, nombre, rol, activo, password_hash)
- `proveedores`: (id, ruc, razon_social, contacto, telefono, email, direccion, rubro, estado)
- `caja_turnos`: (id, vendedor_id, fecha_apertura, fecha_cierre, monto_apertura, monto_cierre, estado)
- `correlativos`: (tipo PK, serie, numero_actual)
- `ventas_comerciales`: (id, cliente_id, vendedor_id, caja_turno_id, tipo_comprobante, numero_comprobante, total, fecha_venta, forma_pago, moneda, guia_remision, orden_compra, subtotal, igv, monto_letras, detraccion_monto, credito_monto_neto, credito_total_cuotas, credito_cuotas, cliente_nombre, receptor_nombre, receptor_ruc)
- `venta_detalles`: (id, venta_id, producto_id, nombre, sku, cantidad, precio_unitario, subtotal)
- `proformas`: (id, cliente_id, cliente_nombre, cliente_email, representante_id, representante_nombre, codigo_proforma, estado, fecha_emision, fecha_vencimiento, total)
- `proforma_detalles`: (id, proforma_id, producto_id, nombre, sku, cantidad, precio_pactado, subtotal)
- `orden_pedidos`: (id, proforma_id, cliente_nombre, codigo_proforma, codigo_pedido, total, estado_produccion, fecha_aprobacion, fecha_entrega_estimada, fecha_entrega_real)
- `movimientos_stock`: (id, producto_id, tipo, motivo, cantidad_anterior, cantidad_nueva, diferencia GENERATED, usuario_id, usuario_nombre, observacion, fecha)

### Key Relationships
- `clientes` → `empresas` (1:1, only if tipo_cliente='EMPRESA')
- `empresas` → `contactos` (1:N)
- All transactions point to `clientes.id` (ventas, proformas, ordenes)
- Denormalized fields (cliente_nombre, receptor_nombre) exist for historical records

### Business Rules
- `FACTURA` requires RUC (tipo_documento='RUC')
- `BOLETA` can be DNI or RUC
- Every empresa must have a client record (tipo_cliente='EMPRESA')
- Contacts live in `contactos`, not in `clientes`
- `es_principal` marks the primary contact for billing
- `numero_documento` is UNIQUE in `clientes`
- `diferencia` in `movimientos_stock` is GENERATED, never insert it

## Code Conventions
- Use `src/components/ui/` for UI components (GradientCard, GradientButton, GlassInput, StatusBadge, GradientModal, GradientDrawer, GradientToast)
- Use `src/components/Icons.tsx` for SVG icons (NO lucide-react)
- `dbService` is the single data source (dual-write: Supabase primary, localStorage fallback)
- `DATA_VERSION` in `src/lib/db.ts` clears localStorage when schema changes
- `cliente_nombre` in transactions is denormalized for historical purposes
- Use `'use client'` for pages with state/effects
- Tailwind CSS v4 with `@theme` in `globals.css`

## Important Notes
- Never access localStorage directly from pages; use `dbService`
- For modals: use `GradientModal` or `GradientDrawer`
- For inputs: use `GlassInput` instead of native `<input>`
- For badges: use `StatusBadge` with semantic variants
- For KPIs: use `AnimatedCounter` inside `GradientCard`
- RLS is disabled on all tables (permit anon access)
- Passwords are currently plaintext (will be hashed with bcryptjs)
