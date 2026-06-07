# CLAUDE

@AGENTS.md

## Resumen de Cambios v2.0

### Diseño Visual — Modo Claro Premium
- Migración completa de dark mode a **modo claro premium** con degradados sutiles (`radial-gradient` global).
- Glassmorphism en tarjetas: `bg-white/90 backdrop-blur-sm` con bordes `border-slate-200`.
- Acento naranja-ámbar: `from-orange-500 to-amber-400` para botones primarios y badges activos.
- Fondo global claro con transición suave entre secciones.

### Sistema de Componentes UI (8 reutilizables)
Ubicados en `src/components/ui/`:
- **GradientCard** — Tarjeta glassmorphism con hover elevado.
- **GradientButton** — 5 variantes: `primary`, `secondary`, `ghost`, `danger`, `success`.
- **GlassInput** — Input con backdrop-blur, icono izquierdo, estados focus/error.
- **StatusBadge** — 6 variantes semánticas con dot: `success`, `warning`, `danger`, `info`, `neutral`, `violet`.
- **AnimatedCounter** — Contador animado de 0 al valor final (usado en KPIs).
- **GradientModal** — Modal con overlay oscuro y panel glassmorphism.
- **GradientDrawer** — Panel lateral deslizable glassmorphism.
- **GradientToast** — Notificaciones toast con 4 tipos y auto-dismiss.

### Íconos
- Biblioteca de 40+ SVGs inline en `src/components/Icons.tsx`.
- Sin dependencias de librerías de íconos externas.

### Módulos Implementados (7 completos)
Todas las rutas bajo `/dashboard/*`:
1. **Dashboard KPIs** (`/dashboard`) — 8 métricas animadas, gráficos Recharts (área + embudo), top productos, timeline de actividad, rendimiento de vendedores.
2. **Canal Comercial** (`/dashboard/comercial`) — Banner sticky de caja, catálogo con imágenes, filtros por categoría, carrito con IGV 18%, historial del turno, creación rápida de cliente.
3. **Canal Industrial** (`/dashboard/industrial`) — Kanban de 5 columnas (Pendiente, En Negociación, Aprobada, Rechazada, Expirada), wizard de 3 pasos para proformas, drawer de detalle.
4. **Producción** (`/dashboard/produccion`) — Stepper degradado de órdenes, filtros avanzados, métricas de tiempo y riesgo.
5. **Inventario** (`/dashboard/inventario`) — Tabla con miniaturas, modal de movimiento, drawer de historial.
6. **Clientes** (`/dashboard/clientes`) — Lista paginada, búsqueda por DNI/RUC, ficha con historial.
7. **Administración** (`/dashboard/admin`) — Gestión de usuarios, edición de roles, activación/desactivación.

### Backend y Datos
- **dbService** (`src/lib/db.ts`) — Patrón dual-mode: Supabase primario / localStorage fallback.
- Tipos completos: Producto, Cliente, VentaComercial, Proforma, OrdenPedido, MovimientoStock, KpiData, etc.
- Mock data ampliada: 12 productos con imágenes, 8 clientes, 5 usuarios.
- Schema SQL (`supabase_schema.sql`) — 10 tablas, índices, seed data.
- **Columna `imagen` agregada** a tabla `productos` para mostrar fotos en Canal Comercial.

### Stack Tecnológico
- Next.js 16.2.7 (App Router) con 11 páginas estáticas.
- React 19.2.4 + TypeScript 5.
- Tailwind CSS v4 (`@theme` en `globals.css`, sin `tailwind.config.js`).
- Recharts ^2 para gráficos.
- Supabase JS Client v2 conectado en producción y desarrollo.

### Sesión y Autenticación
- `SessionContext` con persistencia en localStorage.
- Login con email/contraseña contra tabla `usuarios` en Supabase.
- Contraseña universal de prueba: `123456`.
- RBAC: ADMIN, VENDEDOR, REPRESENTANTE, ALMACEN, PRODUCCION.

### Despliegue
- Repositorio GitHub: `GonzaloRojasFIIS/sistema_ventas_fadicc`
- Deploy en Vercel con variables de entorno de Supabase.
- Build exitoso — todas las rutas prerenderizadas.

### Documentación
- `fadicc_analisis_diseno.md` — Arquitectura, modelo de datos, casos de uso, diagramas.
- `fadicc_pantallas_flujos.md` — Especificación visual detallada de cada pantalla (modo claro premium).
- `AGENTS.md` — Convenciones de código y estructura de rutas.
- `README.md` — Guía de inicio rápido.
- `CONFIGURACION_LOCAL.md` (solo local) — Pasos completos de configuración.
