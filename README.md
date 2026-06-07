# FADICC ERP v2.0 — Sistema de Gestión Comercial e Industrial

> **Empresa:** FADICC S.A. — Fabricación y comercialización de cocinas industriales y domésticas  
> **Versión:** 2.0  
> **Fecha:** Junio 2026  
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase · Recharts

---

## 📖 Descripción

FADICC ERP es una plataforma web unificada que integra los dos canales de ventas de la empresa:

- **Canal Comercial:** Venta directa en tienda física con control de caja por turno, emisión de comprobantes (boleta/factura) y descuento automático de stock.
- **Canal Industrial:** Cotizaciones corporativas (proformas), negociación de precios por volumen, conversión a órdenes de pedido y seguimiento de producción hasta la entrega.

El sistema opera con un **patrón de base de datos dual**: Supabase (PostgreSQL) como fuente primaria y localStorage como fallback offline para garantizar la continuidad operativa del canal comercial ante interrupciones de conectividad.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (Next.js App Router / React 19)      │
│  ├── Login (/)                                               │
│  ├── Dashboard KPIs (/dashboard)                             │
│  ├── Canal Comercial (/dashboard/comercial)                  │
│  ├── Canal Industrial (/dashboard/industrial)              │
│  ├── Producción (/dashboard/produccion)                      │
│  ├── Inventario (/dashboard/inventario)                      │
│  ├── Clientes (/dashboard/clientes)                          │
│  └── Administración (/dashboard/admin)                       │
├─────────────────────────────────────────────────────────────┤
│  CAPA DE LÓGICA (Client Components + dbService)              │
│  ├── Autenticación custom (tabla usuarios)                   │
│  ├── Control de accesos RBAC                                 │
│  └── Servicio de datos dual-mode (Supabase / localStorage)   │
├─────────────────────────────────────────────────────────────┤
│  CAPA DE DATOS                                               │
│  ├── Supabase / PostgreSQL (Online — Primario)               │
│  └── localStorage Web API (Offline — Fallback)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Razón |
|:---|:---|:---|
| Framework | Next.js 16 (App Router) | SSR/CSR híbrido, Server Actions, rutas por archivos |
| UI | React 19 | Concurrent rendering, Suspense |
| Estilos | Tailwind CSS v4 | Utility-first, modo claro premium con degradados |
| Gráficos | Recharts | Áreas, barras, embudos, líneas de tendencia |
| Lenguaje | TypeScript 5 | Tipado estricto, IntelliSense |
| Base de Datos | Supabase (PostgreSQL) | BaaS con RLS, API REST automática |
| Fallback | localStorage | Persistencia offline de ventas y carrito |
| Fuentes | Geist Sans + Geist Mono + Playfair Display | Tipografía moderna y legible |

---

## 🎨 Sistema de Diseño

- **Modo:** Claro premium con degradados sutiles en fondos de página
- **Paleta:** Base `slate-50/white`, acento naranja-ámbar (`orange-500 → amber-400`)
- **Tarjetas:** Glassmorphism (`bg-white/90 backdrop-blur-sm`), bordes sutilmente degradados
- **Botones:** Degradado real naranja-ámbar con glow en hover
- **Inputs:** Fondo translúcido, focus con anillo degradado
- **Badges:** Pill semántico pastel con dot indicador
- **Animaciones:** Contadores animados, fade-in-up, scale-in, shake para errores

---

## 👥 Roles y Accesos (RBAC)

| Rol | Descripción | Módulos |
|:---|:---|:---|
| **ADMIN** | Gerencia / Administrador del sistema | Todos los módulos |
| **VENDEDOR** | Ventas directas en tienda (Canal Comercial) | Comercial, Clientes, Inventario (lectura) |
| **REPRESENTANTE** | Ventas corporativas (Canal Industrial) | Industrial, Clientes, Inventario (lectura) |
| **ALMACEN** | Control de inventario y despachos | Inventario, Producción, Clientes (lectura) |
| **PRODUCCION** | Jefe de planta y fabricación | Producción, Inventario (lectura) |

---

## 📦 Módulos del Sistema

### 1. Dashboard KPIs (`/dashboard`)
Panel gerencial exclusivo para ADMIN con 8 métricas clave, gráficos de ventas por canal (área), embudo de proformas (barras), top productos, timeline de actividad y rendimiento de vendedores.

### 2. Canal Comercial (`/dashboard/comercial`)
- Banner de estado de caja (apertura/cierre de turno)
- Catálogo buscable con filtros por categoría y validación de stock visual
- Carrito de venta con selector de cliente, toggle boleta/factura, IGV 18%
- Tab de historial del turno actual
- Creación rápida de cliente desde el panel de venta

### 3. Canal Industrial (`/dashboard/industrial`)
- Tablero Kanban de 5 columnas: Pendiente, En Negociación, Aprobada, Rechazada, Expirada
- Tarjetas con acciones dinámicas (negociar, aprobar, rechazar) y confirmación inline
- Drawer de detalle con datos del cliente, líneas de proforma y timeline de estados
- Wizard de 3 pasos para nueva proforma: Cliente → Productos → Confirmación
- Precio pactado editable con alertas de descuento/sobreprecio

### 4. Producción (`/dashboard/produccion`)
- Tabs: En Proceso / Entregados
- Tarjetas de orden con stepper visual de 4 pasos (degradados + pulso)
- Filtros avanzados: fechas, representante, cliente
- Métricas: tiempo promedio de fabricación, entregados del mes, en riesgo
- Drawer de detalle con proforma origen y timeline de producción

### 5. Inventario (`/dashboard/inventario`)
- Tabla de productos con estados semánticos (OK / Bajo / Limitado / Sin Stock)
- Filtro por categoría y búsqueda global
- Modal de registro de movimiento (Entrada / Ajuste Manual) con validación
- Drawer de historial de movimientos por producto
- Resaltado visual de filas con stock crítico

### 6. Clientes (`/dashboard/clientes`)
- Lista paginada con búsqueda por nombre o documento
- Drawer de ficha completa con edición inline
- Historial de ventas y proformas asociadas por cliente
- Modal de alta con validación de duplicado

### 7. Administración (`/dashboard/admin`)
- Tabla de usuarios con roles, estado activo/inactivo toggle y acciones
- Modal de edición (nombre, rol, estado)
- Modal de creación con contraseña temporal fija
- Cards de estadísticas del equipo

---

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd fadicc-app

# Instalar dependencias
npm install

# Variables de entorno (copiar y configurar)
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Supabase (opcional para modo fallback)
```

### Variables de entorno (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> Si no configuras Supabase, el sistema opera automáticamente en **modo fallback** (localStorage) con datos mock precargados.

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
http://localhost:3000
```

---

## 🔐 Cuentas de Prueba

Todas las cuentas usan la contraseña universal: **`123456`**

| Rol | Email |
|:---|:---|
| Administrador | `admin@fadicc.com` |
| Ventas Comercial | `vendedor@fadicc.com` |
| Ventas Industrial | `representante@fadicc.com` |
| Almacén | `almacen@fadicc.com` |
| Producción | `produccion@fadicc.com` |

---

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── globals.css              # Sistema de diseño global (modo claro + degradados)
│   ├── layout.tsx               # Root layout con SessionProvider
│   ├── page.tsx                 # Login público
│   └── dashboard/
│       ├── layout.tsx           # Layout con Sidebar protegido
│       ├── page.tsx             # Dashboard KPIs (8 métricas + Recharts)
│       ├── comercial/
│       │   └── page.tsx         # Canal Comercial (caja + catálogo + carrito)
│       ├── industrial/
│       │   └── page.tsx         # Canal Industrial (Kanban + wizard proformas)
│       ├── produccion/
│       │   └── page.tsx         # Centro de Producción (stepper + filtros)
│       ├── inventario/
│       │   └── page.tsx         # Control de Stock (movimientos + alertas)
│       ├── clientes/
│       │   └── page.tsx         # Gestión de Clientes (ficha + historial)
│       └── admin/
│           └── page.tsx         # Administración de Usuarios
├── components/
│   ├── ui/                      # Componentes base reutilizables
│   │   ├── GradientCard.tsx
│   │   ├── GradientButton.tsx
│   │   ├── GlassInput.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── AnimatedCounter.tsx
│   │   ├── GradientModal.tsx
│   │   ├── GradientDrawer.tsx
│   │   └── GradientToast.tsx
│   ├── Sidebar.tsx              # Navegación lateral con glassmorphism
│   ├── KpiCard.tsx              # Tarjeta de métrica con contador animado
│   ├── AlertToast.tsx           # Wrapper de GradientToast
│   ├── StockBadge.tsx           # Badge de estado de stock
│   └── Icons.tsx                # Biblioteca de íconos SVG (40+)
├── context/
│   └── SessionContext.tsx       # Gestión de sesión + caja activa
├── lib/
│   └── db.ts                    # dbService: capa de datos dual-mode
└── ...
```

---

## ✅ Estado de Implementación v2.0

| Módulo | Estado |
|:---|:---|
| Sistema de Diseño Premium (claro + degradados) | ✅ Completado |
| Dashboard Avanzado (8 KPIs, Recharts) | ✅ Completado |
| Canal Comercial (caja, carrito, catálogo) | ✅ Completado |
| Canal Industrial (Kanban, wizard, drawer) | ✅ Completado |
| Producción (stepper, filtros, métricas) | ✅ Completado |
| Inventario (movimientos, alertas) | ✅ Completado |
| Clientes (ficha, historial, paginación) | ✅ Completado |
| Administración (usuarios, roles, toggles) | ✅ Completado |
| Backend Dual-Mode extendido | ✅ Completado |
| Documentación README | ✅ Completado |

---

## 📄 Licencia

Proyecto interno de **FADICC S.A.** — Uso exclusivo y confidencial.

---

<p align="center">
  <strong>FADICC S.A.</strong> · Sistema de Gestión Comercial e Industrial v2.0
</p>
