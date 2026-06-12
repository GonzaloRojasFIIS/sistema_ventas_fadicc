# AGENTS

> **Proyecto:** FADICC ERP v2.0  
> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase · Recharts

## Convenciones Actuales

- **Modo visual:** Claro premium con degradados sutiles (`radial-gradient` global), glassmorphism en tarjetas (`bg-white/90 backdrop-blur-sm`), acento naranja-ámbar (`from-orange-500 to-amber-400`).
- **Componentes base:** Todos los componentes UI reutilizables están en `src/components/ui/` (GradientCard, GradientButton, GlassInput, StatusBadge, AnimatedCounter, GradientModal, GradientDrawer, GradientToast).
- **Estilos globales:** Definidos en `src/app/globals.css` con `@theme` de Tailwind v4. NO usar `tailwind.config.js`.
- **Datos:** `src/services/` encapsula la lógica de negocio con patrón dual-mode (Supabase primario / localStorage fallback). `src/repositories/` maneja la conexión a Supabase y localStorage.
- **Sesión:** Manejada por `SessionContext` con persistencia en localStorage.
- **Íconos:** Usar `src/components/Icons.tsx` (SVGs inline). NO instalar librerías de íconos adicionales sin consultar.

## Estructura de Rutas

| Ruta | Módulo | Roles |
|:---|:---|:---|
| `/` | Login público | Todos |
| `/dashboard` | Dashboard KPIs (8 métricas, Recharts) | ADMIN |
| `/dashboard/comercial` | Canal Comercial (caja, catálogo, carrito) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/industrial` | Canal Industrial (Kanban, wizard proformas) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/produccion` | Producción (stepper, filtros, métricas) | ADMIN, PRODUCCION, ALMACEN |
| `/dashboard/inventario` | Inventario (stock, movimientos, alertas) | ADMIN, ALMACEN, VENDEDOR, REPRESENTANTE |
| `/dashboard/clientes` | Clientes (ficha, historial, paginación) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/mis-ventas` | Mis Ventas (historial comercial + industrial) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/admin` | Administración (usuarios, roles) | ADMIN |

## Reglas de Código

1. Usar `'use client'` en páginas que requieren estado/efectos.
2. Preferir los componentes UI del sistema de diseño sobre clases Tailwind sueltas.
3. `dbService` es la única fuente de datos — nunca acceder a localStorage directamente desde páginas.
4. Badges de estado: usar `StatusBadge` con variantes semánticas (`success`, `warning`, `danger`, `info`, `neutral`, `violet`).
5. Para inputs: usar `GlassInput` en lugar de `<input>` nativo.
6. Para modales: usar `GradientModal` o `GradientDrawer`.
7. Para KPIs: usar `AnimatedCounter` dentro de `KpiCard`.

## Dependencias Clave

- `next` ^16.2.7
- `react` ^19.2.4
- `tailwindcss` ^4
- `@tailwindcss/postcss` ^4
- `recharts` ^2
- `@supabase/supabase-js` ^2.107.0

## Notas de Versión

- Esta es la **v2.0** con diseño completamente renovado a modo claro premium.
- El sistema de diseño anterior (modo claro tradicional sin degradados) fue reemplazado por completo.
- Todos los módulos documentados en `fadicc_pantallas_flujos.md` y `fadicc_analisis_diseno.md` están implementados.
