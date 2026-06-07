# fadicc_pantallas_flujos

> **Versión**: 3.0 | **Fecha**: 6 de junio de 2026  
> **Propósito**: Documentación de diseño lista para ser consumida por herramientas de generación de UI (Stitch, v0, Bolt, Figma).  
> **Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase

---

## 📐 SISTEMA DE DISEÑO GLOBAL

### Paleta de Colores

```
Tokens de color (Tailwind CSS v4 custom properties):

── PRIMARIOS (Marca)
  --color-brand-500:    #f97316   (orange-500)   → Acción principal
  --color-brand-600:    #ea580c   (orange-600)   → Hover sobre primario
  --color-brand-400:    #fb923c   (orange-400)   → Bordes de focus
  --color-brand-amber:  #f59e0b   (amber-500)    → Gradiente secundario de marca

── NEUTROS DE INTERFAZ (Base oscura)
  --color-bg-base:      #020617   (slate-950)    → Fondo de página
  --color-bg-card:      #0f172a   (slate-900)    → Fondo de tarjetas / sidebar
  --color-bg-elevated:  #1e293b   (slate-800)    → Inputs, hover de fila
  --color-bg-subtle:    #334155   (slate-700)    → Bordes de separadores
  --color-text-primary: #f1f5f9   (slate-100)    → Texto principal
  --color-text-muted:   #94a3b8   (slate-400)    → Labels, texto secundario
  --color-border:       #1e293b   (slate-800)    → Borde estándar de componentes

── SEMÁNTICOS
  --color-success-bg:   #052e16   (green-950)
  --color-success-text: #4ade80   (green-400)
  --color-success-ring: #166534   (green-800)

  --color-danger-bg:    #2d0a0a   → rojo muy oscuro personalizado
  --color-danger-text:  #f87171   (red-400)
  --color-danger-ring:  #991b1b   (red-800)

  --color-warning-bg:   #1c1100   → ámbar muy oscuro personalizado
  --color-warning-text: #fbbf24   (amber-400)
  --color-warning-ring: #92400e   (amber-800)

  --color-info-bg:      #0c1a2e   → azul muy oscuro personalizado
  --color-info-text:    #60a5fa   (blue-400)
  --color-info-ring:    #1e3a5f   (blue-800)
```

### Tipografía

```
Familia principal:    Geist Sans  → Todo el texto de UI (labels, párrafos, botones)
Familia monoespaciada: Geist Mono → SKUs de productos, códigos de pedido, montos financieros, números de documento

Escala tipográfica:
  text-xs    → 12px  → Metadatos, timestamps, etiquetas pequeñas
  text-sm    → 14px  → Labels de formulario, texto secundario de tarjetas
  text-base  → 16px  → Cuerpo de texto, filas de tabla
  text-lg    → 18px  → Encabezados de sección dentro de tarjetas
  text-xl    → 20px  → Títulos de página secundaria
  text-2xl   → 24px  → Valores de KPI, totales financieros
  text-3xl   → 30px  → Título principal del logo en login
  text-4xl   → 36px  → KPI principal destacado (ventas del día)

Pesos:
  font-normal  (400) → Cuerpo
  font-medium  (500) → Labels de input, badges
  font-semibold(600) → Encabezados de tarjeta, totales
  font-bold    (700) → Logo FADICC, KPI cifras grandes
```

### Espaciado y Bordes

```
Bordes redondeados:
  rounded-sm   → Badges de estado inline
  rounded      → Avatars de usuario pequeños
  rounded-lg   → Inputs, dropdowns, botones
  rounded-xl   → Tarjetas de producto, tarjetas KPI, modales
  rounded-2xl  → Tarjeta de login, sidebar
  rounded-full → Indicadores de punto pulsante, avatars circulares

Espaciado base: escala de 4px (Tailwind default)
  p-3  → Inputs
  p-4  → Cuerpo de tarjeta small
  p-5  → Cuerpo de tarjeta estándar
  p-6  → Cuerpo de tarjeta grande, sección de modal
  gap-3 → Grid de badges, iconos
  gap-4 → Grid de tarjetas producto
  gap-6 → Secciones de página
  gap-8 → Secciones de página con separación mayor

Sombras:
  shadow-lg              → Tarjetas flotantes
  shadow-orange-500/10   → Tarjeta KPI con acento naranja
  shadow-2xl             → Modales y drawers
```

---

### 🧩 COMPONENTES BASE REUTILIZABLES

#### `<StatusBadge>` — Badge de Estado

```
Estructura HTML:
  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium border">
    <span class="w-1.5 h-1.5 rounded-full [color-matching]" />
    {label}
  </span>

Variantes y colores:

  variant="success"  → bg-green-950/60  border-green-800/40  text-green-400   · dot: bg-green-400
  variant="danger"   → bg-red-950/60    border-red-800/40    text-red-400     · dot: bg-red-400
  variant="warning"  → bg-amber-950/60  border-amber-800/40  text-amber-400   · dot: bg-amber-400
  variant="info"     → bg-blue-950/60   border-blue-800/40   text-blue-400    · dot: bg-blue-400
  variant="neutral"  → bg-slate-800/60  border-slate-700/40  text-slate-400   · dot: bg-slate-400
  variant="violet"   → bg-violet-950/60 border-violet-800/40 text-violet-400  · dot: bg-violet-400

Casos de uso:
  Estado de proforma: PENDIENTE=warning, EN_NEGOCIACION=info, APROBADA=success, RECHAZADA=danger, EXPIRADA=neutral
  Estado de pedido:   EN_PRODUCCION=warning, LISTO_PARA_DESPACHO=info, ENTREGADO=success
  Rol de usuario:     ADMIN=warning(naranja), VENDEDOR=success, REPRESENTANTE=info, ALMACEN=violet, PRODUCCION=warning(ámbar)
  Stock de producto:  OK=success, BAJO=warning, SIN_STOCK=danger
```

#### `<Card>` — Tarjeta con Hover

```
Clases base:
  bg-slate-900 border border-slate-800 rounded-xl p-5
  transition-all duration-200 ease-in-out
  hover:border-slate-700 hover:shadow-lg hover:shadow-black/20

Variante "clickable" (agrega cursor-pointer y efecto de elevación):
  + cursor-pointer hover:bg-slate-900/80 hover:-translate-y-0.5

Variante "KPI" (acento de color en borde superior):
  + border-t-2 border-t-[accent-color]
  + shadow-[accent-color]/10
```

#### `<DarkInput>` — Input oscuro

```
Clases:
  bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5
  text-slate-100 placeholder:text-slate-500 text-sm
  focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
  transition-all duration-150
  disabled:opacity-50 disabled:cursor-not-allowed

Con icono izquierdo:
  pl-10 (el icono queda en absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4)

Error state:
  border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50
```

#### `<Button>` — Botones

```
BASE (compartido):
  inline-flex items-center justify-center gap-2 rounded-lg font-medium
  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
  disabled:opacity-50 disabled:cursor-not-allowed

Tamaños:
  size="sm"  → px-3 py-1.5 text-xs
  size="md"  → px-4 py-2   text-sm   (DEFAULT)
  size="lg"  → px-6 py-2.5 text-base

Variantes:
  variant="primary"
    → bg-gradient-to-r from-orange-600 to-amber-500
      text-white shadow-lg shadow-orange-500/20
      hover:from-orange-500 hover:to-amber-400
      focus:ring-orange-500/50

  variant="secondary"
    → bg-slate-800 border border-slate-700 text-slate-100
      hover:bg-slate-700 hover:border-slate-600
      focus:ring-slate-500/50

  variant="ghost"
    → bg-transparent text-slate-400
      hover:bg-slate-800/50 hover:text-slate-200
      focus:ring-slate-500/30

  variant="danger"
    → bg-red-950/40 border border-red-800/40 text-red-400
      hover:bg-red-900/40 hover:border-red-700/40 hover:text-red-300
      focus:ring-red-500/30

  variant="success"
    → bg-green-950/40 border border-green-800/40 text-green-400
      hover:bg-green-900/40 hover:border-green-700/40 hover:text-green-300
      focus:ring-green-500/30

Estado loading (agrega spinner):
  + <Loader2 className="w-4 h-4 animate-spin" /> antes del texto
```

#### `<Toast>` — Notificación emergente

```
Posición: fixed top-4 right-4 z-[9999]
Animación entrada: translate-x-0 opacity-100 (de translate-x-full opacity-0), duration-300 ease-out
Animación salida:  translate-x-full opacity-0, duration-200 ease-in

Estructura:
  <div class="flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl min-w-[320px] max-w-[420px]">
    <Icon /> {/* Ícono semántico según tipo */}
    <div>
      <p class="font-semibold text-sm">{título}</p>
      <p class="text-xs text-slate-400 mt-0.5">{mensaje}</p>
    </div>
    <button class="ml-auto ...">✕</button>
  </div>

Variantes:
  type="success" → bg-green-950/80  border-green-800/40  text-green-300   · icono: CheckCircle2
  type="error"   → bg-red-950/80    border-red-800/40    text-red-300     · icono: XCircle
  type="warning" → bg-amber-950/80  border-amber-800/40  text-amber-300   · icono: AlertTriangle
  type="info"    → bg-blue-950/80   border-blue-800/40   text-blue-300    · icono: Info

Duración autocierre: 4000ms (success/info), 6000ms (warning/error)
```

#### `<Modal>` — Modal con backdrop-blur

```
Overlay: fixed inset-0 z-50 flex items-center justify-center p-4
  Fondo: bg-black/70 backdrop-blur-sm
  Animación entrada: opacity-0 → opacity-100, duration-200

Panel:
  bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl
  w-full max-w-[tamaño] max-h-[90vh] overflow-y-auto
  Animación entrada: scale-95 opacity-0 → scale-100 opacity-100, duration-200 ease-out

Tamaños de panel:
  size="sm"  → max-w-md
  size="md"  → max-w-lg   (DEFAULT)
  size="lg"  → max-w-2xl
  size="xl"  → max-w-4xl

Estructura interna:
  Header:  flex items-center justify-between px-6 py-4 border-b border-slate-800
           Título: text-lg font-semibold text-slate-100
           Botón X: ghost, icono X, top-right
  Body:    px-6 py-5 space-y-4
  Footer:  flex justify-end gap-3 px-6 py-4 border-t border-slate-800
```

#### `<Drawer>` — Panel deslizable lateral

```
Overlay: fixed inset-0 z-50 flex justify-end
  Fondo: bg-black/60 backdrop-blur-sm
  Click en overlay cierra el drawer

Panel:
  bg-slate-900 border-l border-slate-800
  w-full max-w-[480px] h-full overflow-y-auto
  Animación entrada: translate-x-full → translate-x-0, duration-300 ease-out
  Animación salida:  translate-x-0 → translate-x-full, duration-200 ease-in

Estructura interna (igual que Modal: header/body con scroll)
```

---

## 🖥️ PANTALLA 1 — Login

**Ruta**: `/`  
**Rol requerido**: Ninguno (pública)  
**Componente raíz**: `src/app/page.tsx`

---

### Layout General

```
Viewport completo: min-h-screen w-full
Fondo: background: radial-gradient(ellipse at top, #0f172a 0%, #020617 50%, #000000 100%)
       + patrón de cuadrícula sutil opcional: bg-[size:60px_60px] bg-[image:linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]

Centrado: flex items-center justify-center px-4 py-12
```

### Tarjeta de Login

```
Dimensiones: w-full max-w-md
Estilo:
  bg-slate-900/80 backdrop-blur-xl
  border border-slate-800
  rounded-2xl shadow-2xl shadow-black/50
  p-8

Animación de entrada: opacity-0 translate-y-4 → opacity-100 translate-y-0
  duration-500 ease-out delay-100
```

### Sección Logo / Encabezado

```
Layout: flex flex-col items-center text-center mb-8 gap-3

Ícono logo:
  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
    <Flame className="w-8 h-8 text-white" />  {/* o ícono de cocina */}
  </div>

Título:
  <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent tracking-tight">
    FADICC S.A.
  </h1>

Subtítulo:
  <p class="text-slate-400 text-sm">Sistema de Gestión Comercial e Industrial</p>
```

### Formulario

```
<form> con space-y-5

─── Campo Email ───────────────────────────────────────────
Label: "Correo Electrónico" text-sm font-medium text-slate-300
Input: type="email" | placeholder="usuario@fadicc.com"
       Icono izquierdo: <Mail className="w-4 h-4" />
       Clase DarkInput estándar

─── Campo Contraseña ──────────────────────────────────────
Label: "Contraseña" text-sm font-medium text-slate-300
Input: type="password" (toggleable a type="text")
       Icono izquierdo: <Lock className="w-4 h-4" />
       Botón derecho toggle (absolute right-3):
         Estado cerrado: <Eye className="w-4 h-4 text-slate-500 hover:text-slate-300" />
         Estado abierto: <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-300" />
       Clase DarkInput con pr-10 (espacio para icono derecho)

─── Mensaje de Error ──────────────────────────────────────
Condicional: solo visible cuando error !== null
  <div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-900/40">
    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
    <p class="text-red-400 text-sm">{error}</p>
  </div>
Animación de aparición: opacity-0 → opacity-100 con fade-in 200ms

─── Botón Submit ──────────────────────────────────────────
Clase: Button variant="primary" size="lg" + w-full
Texto en idle:    "Iniciar Sesión"
Texto en loading: <Loader2 animate-spin /> "Verificando credenciales..."
El botón se deshabilita mientras isLoading === true
```

### Sección de Credenciales de Prueba

```
Elemento: <details> nativo del HTML5

<details class="mt-6 rounded-xl border border-slate-800 overflow-hidden">
  <summary class="flex items-center justify-between px-4 py-3 cursor-pointer
                  text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-800/40
                  transition-colors select-none list-none">
    <span class="flex items-center gap-2">
      <TestTube2 className="w-4 h-4" />
      Auto-llenar Credenciales de Prueba
    </span>
    <ChevronDown className="w-4 h-4 transition-transform details-open:rotate-180" />
  </summary>

  <div class="px-4 pb-4 pt-1">
    <p class="text-xs text-slate-500 mb-3">Contraseña universal: <code class="font-mono text-amber-400">123456</code></p>

    Grid 2 columnas con gap-2:
    ┌─────────────────────┬─────────────────────┐
    │ Btn: Admin          │ Btn: Vendedor        │
    │ admin@fadicc.com    │ vendedor@fadicc.com  │
    ├─────────────────────┼─────────────────────┤
    │ Btn: Representante  │ Btn: Producción      │
    │ rep@fadicc.com      │ prod@fadicc.com      │
    ├─────────────────────┼─────────────────────┤
    │ Btn: Almacén        │                      │
    │ almacen@fadicc.com  │                      │
    └─────────────────────┴─────────────────────┘

    Cada botón:
      variant="ghost" size="sm"
      Clase extra: w-full justify-start text-left font-mono text-xs
      Al hacer clic: auto-completa los campos email y password del formulario
```

### Estados de la Pantalla

```
idle:     Formulario vacío, botón habilitado, sin error
loading:  Botón con spinner, inputs con pointer-events-none
error:    Mensaje de error visible, inputs resaltados en rojo
success:  Router.push() al dashboard correspondiente según rol del usuario
```

---

## 🖥️ PANTALLA 2 — Dashboard KPIs (Admin)

**Ruta**: `/dashboard`  
**Rol requerido**: ADMIN  
**Componente**: `src/app/dashboard/page.tsx`

---

### Layout Shell (Compartido con todas las rutas `/dashboard/*`)

```
Estructura:
  <div class="flex h-screen bg-slate-950 overflow-hidden">
    <Sidebar />          {/* posición fixed o flex-shrink-0, w-64 */}
    <main class="flex-1 overflow-y-auto">
      <TopBar />         {/* sticky top-0 z-10 */}
      <div class="p-6">
        {children}       {/* contenido de página */}
      </div>
    </main>
  </div>

─── SIDEBAR ────────────────────────────────────────────────────────────────────
  Dimensiones: w-64 h-full flex-shrink-0
  Fondo: bg-slate-900 border-r border-slate-800
  Estructura interna:

  ┌── Logo (px-5 py-5) ──────────────────────────────────────────────────────┐
  │  <div class="flex items-center gap-3">                                   │
  │    [Ícono cuadrado brand gradient]                                       │
  │    <span class="font-bold text-lg text-slate-100">FADICC</span>          │
  │  </div>                                                                  │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌── Info de usuario (px-4 py-3 mx-2 rounded-xl bg-slate-800/50 mt-2) ─────┐
  │  [Avatar circular: iniciales del nombre, bg brand gradient, w-9 h-9]   │
  │  <div>                                                                   │
  │    <p class="text-sm font-medium text-slate-100">{nombre}</p>           │
  │    <StatusBadge variant según rol>{rol}</StatusBadge>                   │
  │  </div>                                                                  │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌── Menú de navegación (mt-6 space-y-1 px-3) ─────────────────────────────┐
  │  Cada ítem:                                                              │
  │  <Link class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm   │
  │               text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 │
  │               transition-all duration-150                                │
  │               [active: bg-slate-800 text-slate-100                       │
  │                + border-l-2 border-orange-500 -ml-px pl-[calc(0.75rem+1px)]│
  │               ]">                                                         │
  │    <Icon class="w-4 h-4" />                                             │
  │    {label}                                                               │
  │  </Link>                                                                 │
  │                                                                          │
  │  Ítems (visibilidad según rol):                                          │
  │  ├── Dashboard (/dashboard)              → LayoutDashboard  [ADMIN]     │
  │  ├── Canal Comercial (/dashboard/comercial) → ShoppingCart  [VEN/ADM]   │
  │  ├── Canal Industrial (/dashboard/industrial) → Factory     [REP/ADM]   │
  │  ├── Producción (/dashboard/produccion)  → Factory2         [PRO/ALM/ADM]│
  │  ├── Inventario (/dashboard/inventario)  → Package          [ALL]       │
  │  ├── Clientes (/dashboard/clientes)      → Users2           [VEN/REP/ADM]│
  │  └── Administración (/dashboard/admin)   → Settings         [ADMIN]     │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌── Botón Cerrar Sesión (mt-auto, border-t border-slate-800, px-3 py-4) ──┐
  │  Button variant="ghost" size="sm" + w-full justify-start text-red-400  │
  │  <LogOut className="w-4 h-4" /> Cerrar Sesión                          │
  └──────────────────────────────────────────────────────────────────────────┘

─── TOP BAR ────────────────────────────────────────────────────────────────────
  Clases: bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50 px-6 py-4
  Layout: flex items-center justify-between

  Izquierda:
    <h1 class="text-xl font-semibold text-slate-100">{título de sección}</h1>

  Derecha:
    Fecha y hora en vivo (actualizada cada segundo):
    <div class="flex items-center gap-2 text-slate-400 text-sm font-mono">
      <Clock className="w-4 h-4" />
      {diaDeSemana}, {fecha larga}  ·  {HH:MM:SS}
    </div>
```

### Contenido del Dashboard KPI

```
─── SECCIÓN 1: Tarjetas KPI (grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4) ──

  Todas las tarjetas tienen:
    Clase base Card variante "KPI"
    Un número grande que se anima al cargar (conteo desde 0 al valor real)
    duration-1000, easing ease-out, delay escalonado (0ms, 100ms, 200ms, 300ms)
    Un ícono grande en esquina superior derecha (opacity-20)

  ┌─── KPI 1: Venta Comercial Hoy ──────────────────────────────────┐
  │  Acento: border-t-orange-500, shadow-orange-500/10              │
  │  Ícono: <ShoppingBag className="w-12 h-12 text-orange-500/20"/> │
  │  Label: "Venta Comercial Hoy" text-slate-400 text-sm            │
  │  Valor: "S/ {total}" text-4xl font-bold text-slate-100          │
  │         font-mono para el número                                │
  │  Sub:   "{n} transacciones" text-sm text-slate-500              │
  │  Trend: <TrendingUp/> "+{%} vs ayer" text-green-400 text-xs     │
  └─────────────────────────────────────────────────────────────────┘

  ┌─── KPI 2: Pedidos Industriales ─────────────────────────────────┐
  │  Acento: border-t-blue-500, shadow-blue-500/10                  │
  │  Ícono: <Factory className="w-12 h-12 text-blue-500/20"/>       │
  │  Label: "Pedidos Industriales Activos"                          │
  │  Valor: "{n}" en text-4xl font-bold text-slate-100              │
  │  Sub:   desglose "En producción: {n} · Por despachar: {n}"      │
  └─────────────────────────────────────────────────────────────────┘

  ┌─── KPI 3: Tasa Conversión Proformas ────────────────────────────┐
  │  Acento: border-t-green-500, shadow-green-500/10                │
  │  Ícono: <BarChart3 className="w-12 h-12 text-green-500/20"/>    │
  │  Label: "Tasa Conversión Proformas"                             │
  │  Valor: "{%}%" text-4xl font-bold text-green-400                │
  │  Progress bar:                                                  │
  │    <div class="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">│
  │      <div class="h-full bg-green-500 rounded-full              │
  │                  transition-all duration-1000 ease-out"         │
  │           style="width: {%}%" />                                │
  │    </div>                                                       │
  │  Sub: "{aprobadas}/{total} proformas" text-slate-500 text-xs    │
  └─────────────────────────────────────────────────────────────────┘

  ┌─── KPI 4: Alertas Stock Crítico ────────────────────────────────┐
  │  Acento: border-t-red-500 (si > 0) o border-t-slate-700        │
  │  Ícono: <AlertTriangle className="w-12 h-12 text-red-500/20"/>  │
  │  Label: "Alertas Stock Crítico"                                 │
  │  Valor: "{n}" text-4xl font-bold                               │
  │         text-red-400 (si n > 0) / text-green-400 (si n === 0)  │
  │  Sub (si n > 0): "productos bajo mínimo" text-red-400/70        │
  │  Sub (si n = 0): "Todos los productos OK" text-green-400/70     │
  │  Link: "Ver inventario →" text-xs text-orange-400 hover:underline│
  └─────────────────────────────────────────────────────────────────┘

─── SECCIÓN 2: Fila media (grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4) ──

  ┌─── Últimas 5 Ventas del Día (col-span-3) ───────────────────────────┐
  │  Card con header:                                                   │
  │    "Últimas Ventas del Día" + Badge "{n} hoy" variant=success       │
  │  Tabla compacta (no overflow, caben 5 filas):                       │
  │    Columnas: Hora | Comprobante | Cliente | Total | Vendedor        │
  │    Filas: text-sm, border-b border-slate-800/50 last:border-b-0     │
  │    Hover fila: bg-slate-800/30                                      │
  │    Hora: font-mono text-slate-400 text-xs                          │
  │    Comprobante: text-orange-400 font-mono text-xs                  │
  │    Total: font-semibold text-slate-100 font-mono                   │
  │  Estado vacío: "No hay ventas registradas hoy"                      │
  │    centered, text-slate-500, icono ShoppingBag                     │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─── Proformas Pendientes (col-span-2) ───────────────────────────────┐
  │  Card con header:                                                   │
  │    "Proformas Pendientes" + Badge "{n}" variant=warning             │
  │  Lista (space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar):  │
  │    Cada ítem: flex items-center justify-between py-2               │
  │      Izq: código proforma (font-mono text-xs text-orange-400)      │
  │           empresa cliente (text-sm text-slate-200)                  │
  │      Der: monto total (font-mono text-slate-100 text-sm)           │
  │           StatusBadge del estado                                    │
  │      Separador: border-b border-slate-800/50                       │
  │  Link al final: "Ver todas las proformas →" text-orange-400 text-xs│
  └─────────────────────────────────────────────────────────────────────┘

─── SECCIÓN 3: Rendimiento de Vendedores (full width, mt-4) ──────────────

  Card con header: "Rendimiento de Vendedores — Hoy"
  Tabla:
    Columnas: # | Vendedor | # Ventas | Total S/ | Ticket Promedio
    Encabezados: text-xs font-medium text-slate-400 uppercase tracking-wider
                 px-4 py-3 border-b border-slate-800
    Filas:
      Número de puesto: w-8 h-8 rounded-full bg-slate-800 text-xs font-bold text-center
        Puesto 1: bg-gradient-to-br from-amber-500 to-orange-600 text-white
      Nombre vendedor: font-medium text-slate-200
      # Ventas: font-mono text-slate-300
      Total S/: font-mono font-semibold text-slate-100
      Ticket promedio: font-mono text-slate-400
    Hover fila: bg-slate-800/30 cursor-default
```

---

## 🖥️ PANTALLA 3 — Canal Comercial

**Ruta**: `/dashboard/comercial`  
**Rol requerido**: VENDEDOR, ADMIN  
**Componente**: `src/app/dashboard/comercial/page.tsx`

---

### Banner de Estado de Caja (Sticky)

```
Posición: sticky top-0 z-20 (sobre el contenido, bajo el TopBar del shell)

─── ESTADO: CAJA CERRADA ────────────────────────────────────────────────
  Clases: bg-red-950/30 border border-red-900/30 backdrop-blur-sm
          rounded-xl p-4 mb-6
  Layout: flex flex-col sm:flex-row items-start sm:items-center gap-4

  Izquierda:
    <div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full bg-red-500" /> {/* punto fijo, sin pulsar */}
      <span class="text-red-400 font-semibold text-sm">Caja Cerrada</span>
    </div>
    <p class="text-slate-400 text-xs mt-1">Debes abrir un turno de caja para registrar ventas.</p>

  Derecha (gap-3):
    Input: type="number" min="0" step="0.01"
      placeholder="S/ Monto de apertura"
      Clase DarkInput size reducido (py-2 text-sm)
      Icono: <DollarSign className="w-4 h-4" />
    Button: variant="success" size="sm"
      <Power className="w-4 h-4" /> "Abrir Turno"
      onClick → abre turno, guarda monto_apertura y hora_apertura en BD

─── ESTADO: CAJA ABIERTA ────────────────────────────────────────────────
  Clases: bg-green-950/20 border border-green-800/30 backdrop-blur-sm
          rounded-xl p-4 mb-6
  Layout: flex items-center gap-6

  Indicador pulsante:
    <div class="relative flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-green-500">
        <span class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
      </span>
      <span class="text-green-400 font-semibold text-sm">Caja Activa</span>
    </div>

  Info del turno:
    "Apertura: S/ {monto_apertura}" font-mono text-slate-300 text-sm
    "Desde: {hora_apertura}" text-slate-400 text-xs
    Badge: duración del turno ej. "2h 34min" variant=info

  Botón cierre:
    Button variant="danger" size="sm"
      <PowerOff className="w-4 h-4" /> "Cerrar Turno"
      onClick → abre modal de confirmación de cierre de caja
```

### Layout Principal 2 Columnas

```
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div class="lg:col-span-2"> → CATÁLOGO </div>
  <div class="lg:col-span-1"> → PANEL DE VENTA </div>
</div>
```

### Columna Izquierda — Catálogo de Productos

```
─── Buscador ────────────────────────────────────────────────────────────
  Clase DarkInput + w-full
  Icono izquierdo: <Search className="w-4 h-4" />
  placeholder="Buscar por nombre o código SKU..."
  Debounce de 300ms para filtrar la lista en tiempo real

─── Grid de Productos (grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4) ─────
  Cada tarjeta de producto:

  ┌── Tarjeta con stock disponible ──────────────────────────────────────┐
  │  Clases: Card variante "clickable" + relative overflow-hidden        │
  │                                                                      │
  │  ┌ Header de tarjeta: flex justify-between items-start mb-3 ────┐   │
  │  │ SKU: <span class="font-mono text-xs text-orange-400/80       │   │
  │  │              bg-orange-500/10 px-2 py-0.5 rounded">          │   │
  │  │        {sku}</span>                                           │   │
  │  │ StatusBadge stock:                                            │   │
  │  │   stock > minimo → variant=success "{n} uds"                 │   │
  │  │   stock <= minimo && > 0 → variant=warning "Bajo ({n})"      │   │
  │  └───────────────────────────────────────────────────────────────┘   │
  │                                                                      │
  │  Nombre: text-sm font-semibold text-slate-100 leading-tight         │
  │  Desc: text-xs text-slate-500 mt-1 line-clamp-2                     │
  │                                                                      │
  │  Precio: text-2xl font-bold text-slate-100 font-mono mt-3          │
  │    <span class="text-sm text-slate-400">S/ </span>{precio}          │
  │                                                                      │
  │  Footer: mt-3 pt-3 border-t border-slate-800/50                     │
  │  Button: variant="primary" size="sm" w-full                         │
  │    <ShoppingCart className="w-4 h-4" /> "+ Agregar al Carrito"      │
  └──────────────────────────────────────────────────────────────────────┘

  ┌── Tarjeta SIN stock (stock === 0) ───────────────────────────────────┐
  │  Clases base + opacity-60 cursor-not-allowed                        │
  │  Overlay: absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]      │
  │           flex flex-col items-center justify-center gap-1           │
  │    <Lock className="w-5 h-5 text-slate-500" />                      │
  │    <span class="text-xs text-slate-500 font-medium">Sin Stock</span> │
  │  Botón "+Carrito" → disabled=true + cursor-not-allowed              │
  └──────────────────────────────────────────────────────────────────────┘
```

### Columna Derecha — Panel de Venta

```
Card sticky: top-[88px] (debajo del TopBar + banner de caja)

─── Selector de Cliente ─────────────────────────────────────────────────
  Label: "Cliente" + asterisco rojo de obligatorio
  Layout: flex gap-2

  Combobox de búsqueda:
    Input con icono <Search/> que filtra clientes por nombre/DNI/RUC
    Dropdown: bg-slate-800 border border-slate-700 rounded-lg shadow-xl
    Máx visible: 6 clientes con scroll
    Cada opción:
      Nombre/razón social bold + número de documento (font-mono text-xs)
    Estado vacío: "Sin resultados — ¿Crear cliente nuevo?"

  Botón "+":
    Button variant="secondary" size="md" (ícono solo: UserPlus)
    tooltip: "Crear cliente rápido"
    onClick → abre Modal "Nuevo Cliente" en modo rápido

─── Toggle Tipo Comprobante ─────────────────────────────────────────────
  <div class="flex rounded-lg border border-slate-700 overflow-hidden p-0.5 bg-slate-800/50 mt-4">
    Opción "Boleta":
      Activa:   bg-slate-700 text-slate-100 font-semibold
      Inactiva: text-slate-400 hover:text-slate-300
      Clases: flex-1 text-center py-2 text-sm rounded-md transition-all cursor-pointer
    Opción "Factura": idéntico al anterior
  </div>

─── Lista del Carrito ───────────────────────────────────────────────────
  Contenedor: mt-4 space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar

  Estado vacío (carrito sin ítems):
    Centered: <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
    <p class="text-slate-500 text-sm text-center">El carrito está vacío</p>

  Cada ítem en carrito:
    <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40
                border border-slate-700/50 group">
      Nombre: text-sm text-slate-200 font-medium truncate flex-1
      Input cantidad:
        type="number" min=1 max={stock_disponible}
        Clases: w-16 text-center font-mono text-sm bg-slate-800 border border-slate-700
                rounded px-2 py-1 focus:ring-1 focus:ring-orange-500/50
        Al superar stock → vibración del input (animation: shake 400ms)
                         + Toast warning "Stock insuficiente. Máx: {n}"
      Precio unitario: text-xs text-slate-400 font-mono
      Subtotal del ítem: text-sm font-semibold text-slate-100 font-mono w-20 text-right
      Botón eliminar: ghost, icono <X className="w-3.5 h-3.5 text-slate-500
                      opacity-0 group-hover:opacity-100 transition-opacity"/>

─── Resumen Financiero ──────────────────────────────────────────────────
  Separador: border-t border-slate-700/50 mt-4 pt-4
  Layout: space-y-2

  Subtotal: flex justify-between
    "Subtotal" text-slate-400 text-sm
    "S/ {subtotal}" font-mono text-slate-300 text-sm

  IGV (18%): flex justify-between
    "IGV (18%)" text-slate-400 text-sm
    "S/ {igv}" font-mono text-slate-300 text-sm

  Separador: border-t border-slate-700/50

  TOTAL: flex justify-between items-baseline
    "TOTAL" text-slate-100 font-bold text-base
    "S/ {total}" font-mono font-bold text-2xl text-slate-100

─── Botón Confirmar Venta ───────────────────────────────────────────────
  Button variant="primary" size="lg" w-full mt-4
  Texto: "Confirmar Venta" + icono <CheckCircle2 />
  Bloqueado (disabled + tooltip) si:
    • caja cerrada → "Debes abrir la caja primero"
    • no hay cliente → "Selecciona un cliente"
    • carrito vacío → "Agrega productos al carrito"
  Al confirmar exitosamente:
    • Toast success: "Venta registrada — {tipo} N° {código}"
    • Carrito se limpia con animación fade-out
    • Stock de productos se actualiza en tiempo real

─── Tab: Historial del Turno ────────────────────────────────────────────
  Pestaña inferior dentro del mismo Card (TabPanel):
    Tab1: "Venta Actual" (el panel de arriba)
    Tab2: "Historial del Turno" (últimas ventas de ESTA caja en ESTE turno)

  Tabla historial:
    Columnas: Hora | Tipo | N° Documento | Cliente | Total | Acciones
    Filas en orden cronológico inverso (la más reciente primero)
    Acción: botón "Ver" → modal con detalle de la venta (líneas del comprobante)
```

---

## 🖥️ PANTALLA 4 — Canal Industrial · Proformas

**Ruta**: `/dashboard/industrial`  
**Rol requerido**: REPRESENTANTE, ADMIN  
**Componente**: `src/app/dashboard/industrial/page.tsx`

---

### Header y Toolbar

```
Header de página:
  Título: "Canal Industrial — Proformas"
  Sub-fila de contadores de estado (flex gap-4 flex-wrap):
    StatusBadge variant=warning  "Pendientes: {n}"
    StatusBadge variant=info     "En Negociación: {n}"
    StatusBadge variant=success  "Aprobadas: {n}"
    StatusBadge variant=danger   "Rechazadas: {n}"
    StatusBadge variant=neutral  "Expiradas: {n}"

Toolbar (mt-4 flex flex-col sm:flex-row gap-3):
  Izquierda:
    Button variant="primary" <Plus /> "Nueva Proforma"
      onClick → abre Modal Wizard "Nueva Proforma"

  Derecha (flex gap-3):
    Dropdown filtro de estado:
      Select oscuro con opciones: Todos | Pendiente | En Negociación | Aprobada | Rechazada | Expirada
      Icono: <Filter className="w-4 h-4" />

    Input búsqueda por cliente:
      DarkInput placeholder="Buscar por empresa o código..."
      Icono: <Search className="w-4 h-4" />
      Debounce 300ms
```

### Vista Kanban

```
Contenedor: mt-6 flex gap-4 overflow-x-auto pb-4
Cada columna: min-w-[280px] w-[280px] flex-shrink-0

─── Columna Kanban ────────────────────────────────────────────────────
  Header de columna:
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        StatusBadge del estado {n tarjetas}
      </div>
    </div>

  Cuerpo: space-y-3 min-h-[200px]

  ─── Tarjeta Kanban (cada proforma) ─────────────────────────────────
    Card variante clickable (onClick → abre Drawer de detalle)
    Estructura interna:

    TOP:
      flex justify-between items-start
      Código proforma: "PRO-2026-{n}" font-mono text-xs text-orange-400
      StatusBadge del estado (esquina derecha)

    EMPRESA:
      <Building2 className="w-3.5 h-3.5 text-slate-400"/> + nombre empresa
      text-sm font-semibold text-slate-200 mt-2

    REPRESENTANTE:
      <User className="w-3 h-3 text-slate-500"/> + nombre representante
      text-xs text-slate-400

    MONTO:
      text-xl font-bold font-mono text-slate-100 mt-3
      "S/ {monto_total}"

    VENCIMIENTO:
      flex items-center gap-1 mt-2
      <Clock className="w-3 h-3 text-slate-500"/>
      text-xs text-slate-400 "Vence: {fecha}"
      Si vence en < 3 días: texto en amber-400 + icono AlertTriangle

    BOTONES DE ACCIÓN (borde superior separator, pt-3 mt-3 flex flex-wrap gap-2):
      Columna PENDIENTE:
        Button size="sm" variant="secondary"  <ArrowRightLeft/> "Negociar"
        Button size="sm" variant="success"    <CheckCircle2/>  "Aprobar"
        Button size="sm" variant="danger"     <XCircle/>       "Rechazar"

      Columna EN_NEGOCIACIÓN:
        Button size="sm" variant="success"    <CheckCircle2/>  "Aprobar"
        Button size="sm" variant="danger"     <XCircle/>       "Rechazar"

      Columna APROBADA:
        <Link> text-xs text-blue-400 hover:underline flex items-center gap-1
               <ExternalLink className="w-3 h-3"/> "Ver Orden PED-{n}"

      Columnas RECHAZADA y EXPIRADA:
        Sin botones de acción. Solo lectura.
        Badge "Solo lectura" variant=neutral en subheader

    Al hacer clic en botón de acción:
      Muestra diálogo de confirmación inline (pequeño popover bajo el botón)
      "¿Confirmar [acción]? [Sí] [No]"
      Al confirmar: actualiza estado en BD, tarjeta se mueve a nueva columna con animación
```

### Drawer — Detalle de Proforma

```
Se abre al hacer clic en tarjeta Kanban (no en botones de acción)
Tamaño: max-w-[520px]

Secciones del Drawer Body:

1. ENCABEZADO DE PROFORMA
   Código: "PRO-2026-{n}" text-2xl font-mono font-bold text-orange-400
   StatusBadge del estado (grande)
   Fecha emisión: text-sm text-slate-400
   Fecha vencimiento: idem (con warning si pronto)

2. DATOS DEL CLIENTE
   Card interna (bg-slate-800/40):
     <Building2/> Empresa: nombre en bold
     <FileText/>  RUC: número en font-mono
     <User/>      Representante: nombre
     <Phone/>     Teléfono
     <Mail/>      Email

3. LÍNEAS DE DETALLE
   Tabla de productos de la proforma:
   Columnas: Producto | Cant | Precio Pactado | Subtotal
   Footer de tabla: TOTAL en bold font-mono text-xl
   Nota sobre descuento: "Precio de lista vs precio pactado"
     para cada línea con descuento: "Ahorro: S/ {diferencia}" text-green-400 text-xs

4. HISTORIAL DE ESTADOS (timeline vertical)
   Cada evento: punto + línea vertical + fecha + acción + usuario que la realizó
   Último evento resaltado con punto más grande

5. BOTONES DE ACCIÓN (en footer del Drawer, border-t)
   Iguales a los de la tarjeta Kanban (según estado)
```

### Modal Wizard — Nueva Proforma (3 pasos)

```
Tamaño: size="xl" (max-w-4xl)

─── Indicador de pasos (stepper horizontal) ─────────────────────────────
  <div class="flex items-center justify-center gap-0 mb-6">
    Paso 1: círculo numerado + label "Cliente"
    Línea conectora
    Paso 2: círculo numerado + label "Productos"
    Línea conectora
    Paso 3: círculo numerado + label "Confirmación"
  </div>
  Paso activo: bg-orange-500 text-white círculo + text-slate-100 label
  Paso completado: bg-green-600 + ícono <Check/>
  Paso pendiente: bg-slate-700 text-slate-400

─── PASO 1: Selección de Cliente ────────────────────────────────────────
  Label: "Seleccionar Cliente Industrial"
  Combobox de búsqueda (igual que en Canal Comercial pero solo empresas)
  Cards de resultado de búsqueda:
    Empresa + RUC + representante asignado
  Opción: "+ Crear nuevo cliente" al final de la lista (si no encuentra)
  Botón: "Siguiente →" (disabled si no hay cliente seleccionado)

─── PASO 2: Agregar Productos ───────────────────────────────────────────
  Sub-header: Cliente seleccionado mostrado en badge
  Sección de catálogo (lado izquierdo, 60% de ancho):
    Lista de productos disponibles (sin tarjeta, solo filas)
    Cada fila: SKU + Nombre + Precio lista + Botón "Agregar"
  Tabla editable (lado derecho, 40% de ancho):
    Columnas: Producto | Cant | Precio Pactado | Subtotal | Eliminar
    Fila editable:
      Cant: input numérico (min=1)
      Precio Pactado: input numérico (puede ser menor al precio lista)
        Si es menor al precio lista: texto en green-400 + "Descuento: {%}%"
        Si es mayor: texto en red-400 + warning
    Total progresivo actualizado en tiempo real
  Botones: "← Atrás" | "Siguiente →" (disabled si tabla vacía)

─── PASO 3: Confirmación ─────────────────────────────────────────────────
  Resumen completo de la proforma:
    Cliente (card visual con datos)
    Tabla de productos (no editable, solo lectura)
    Total final destacado
  Fecha de vencimiento:
    DarkInput type="date"
    Default: hoy + 15 días
    Min: hoy + 1 día
  Botón: "Generar Proforma" variant="primary" size="lg" w-full
    loading state: "Generando..."
    success: cierra modal + toast success + tarjeta aparece en columna PENDIENTE del Kanban
```

---

## 🖥️ PANTALLA 5 — Planta y Despachos

**Ruta**: `/dashboard/produccion`  
**Rol requerido**: PRODUCCION, ALMACEN, ADMIN  
**Componente**: `src/app/dashboard/produccion/page.tsx`

---

### Header con Contadores

```
Título: "Centro de Producción"
Sub-fila de contadores:
  StatusBadge variant=warning  "En Producción: {n}"
  StatusBadge variant=info     "Listos para Despacho: {n}"
  StatusBadge variant=success  "Entregados hoy: {n}"
```

### Barra de Filtros

```
flex flex-col sm:flex-row gap-3 mt-4

  Select de estado: Todos | En Producción | Listo para Despacho | Entregado
  DarkInput type="date" label="Desde"
  DarkInput type="date" label="Hasta"
  DarkInput buscador: placeholder="Buscar código de pedido..."
    Icono <Search/>
  Button variant="ghost" <RotateCcw/> "Limpiar filtros"
```

### Timeline Vertical de Órdenes Activas

```
Contenedor: mt-6 space-y-4

─── Tarjeta de Orden de Pedido ──────────────────────────────────────────
  Card variante estándar (no clickable por defecto)

  TOP (flex justify-between items-start):
    Izquierda:
      Código pedido: "PED-2026-{n}" font-mono text-lg font-bold text-slate-100
      Origen: "← Proforma PRO-2026-{n}" text-xs text-orange-400/70 flex items-center gap-1
    Derecha:
      StatusBadge del estado actual (tamaño normal)
      Monto total: "S/ {total}" font-mono font-bold text-xl text-slate-100

  CLIENTE:
    <Building2 className="w-4 h-4"/> + nombre empresa text-sm text-slate-300

  STEPPER VISUAL (mt-4):
    <div class="flex items-center gap-0 w-full">
      Para cada paso [APROBADO, EN_PRODUCCION, LISTO_PARA_DESPACHO, ENTREGADO]:

      ┌── Paso completado ──────────────────────────────────────────┐
      │  Círculo: bg-green-600 border-2 border-green-600 w-8 h-8   │
      │  Ícono: <Check className="w-4 h-4 text-white"/>             │
      │  Label (debajo): text-xs text-green-400 font-medium         │
      │  Línea: flex-1 h-0.5 bg-green-600                          │
      └─────────────────────────────────────────────────────────────┘

      ┌── Paso activo ──────────────────────────────────────────────┐
      │  Círculo: bg-orange-500 border-2 border-orange-400 w-8 h-8  │
      │           animate-pulse (solo el borde exterior)             │
      │  Número o ícono spinning si es en producción               │
      │  Label (debajo): text-xs text-orange-400 font-semibold      │
      │  Línea: flex-1 h-0.5 bg-slate-700                          │
      └─────────────────────────────────────────────────────────────┘

      ┌── Paso pendiente ───────────────────────────────────────────┐
      │  Círculo: bg-slate-800 border-2 border-slate-700 w-8 h-8   │
      │  Número: text-xs text-slate-500                             │
      │  Label (debajo): text-xs text-slate-500                     │
      │  Línea: flex-1 h-0.5 bg-slate-700                          │
      └─────────────────────────────────────────────────────────────┘

  BOTÓN DE ACCIÓN DINÁMICO (mt-4 pt-4 border-t border-slate-800/50):
    Condición → visibilidad y texto según rol + estado:

    ┌ Rol PRODUCCION + estado EN_PRODUCCION ────────────────────────┐
    │  Button variant="success" size="sm"                          │
    │  <CheckSquare className="w-4 h-4"/> "Marcar Fabricación Lista"│
    │  onClick → cambia estado a LISTO_PARA_DESPACHO               │
    │  + toast success + stepper se actualiza                      │
    └──────────────────────────────────────────────────────────────┘

    ┌ Rol ALMACEN + estado LISTO_PARA_DESPACHO ─────────────────────┐
    │  Button variant="primary" size="sm"                          │
    │  <Truck className="w-4 h-4"/> "Registrar Despacho"           │
    │  onClick → abre mini-modal con:                              │
    │    Campo: fecha y hora de entrega (default: ahora)           │
    │    Campo: nombre del receptor                                │
    │    Campo: observaciones (opcional)                           │
    │    Botón confirmar → cambia estado a ENTREGADO               │
    └──────────────────────────────────────────────────────────────┘

    ┌ Rol ADMIN → ve AMBOS botones si el estado lo permite ─────────┐
    └──────────────────────────────────────────────────────────────┘

    Si el estado no coincide o el rol no tiene acción:
      → No se muestra ningún botón de acción
      → Solo el stepper como indicador visual
```

### Tabla Secundaria — Pedidos Entregados del Mes

```
Título: "Pedidos Entregados — Mes Actual"
<details open>: colapsable para ahorrar espacio

Tabla:
  Columnas: Código | Cliente | Fecha Entrega | Monto | Vendedor/Rep | Acciones
  Encabezados: text-xs font-medium text-slate-400 uppercase tracking-wider
  Filas: text-sm con hover bg-slate-800/30
  Acción: "Ver detalle" → drawer lateral con información completa del pedido entregado

Paginación:
  "Mostrando {1-10} de {total}"
  Botones Anterior / Siguiente variant=ghost
```

---

## 🖥️ PANTALLA 6 — Inventario y Stock

**Ruta**: `/dashboard/inventario`  
**Rol requerido**: Todos (acceso de solo lectura a VENDEDOR/REP/PRODUCCION, lectura/escritura a ALMACEN/ADMIN)  
**Componente**: `src/app/dashboard/inventario/page.tsx`

---

### Banner de Alertas Críticas

```
Visible solo si hay productos con stock <= mínimo

Clases: bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-6
Layout: flex items-center justify-between gap-4

Izquierda:
  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0"/>
  <div>
    <p class="text-amber-400 font-semibold text-sm">
      {n} producto(s) con stock en nivel crítico
    </p>
    <p class="text-amber-400/70 text-xs">
      Revisa los productos resaltados en la tabla. Se requiere reposición.
    </p>
  </div>

Derecha:
  Button variant="ghost" size="sm" onClick → aplica filtro "Solo críticos"
  <Eye className="w-4 h-4"/> "Ver solo críticos"
```

### Barra de Herramientas

```
flex flex-col sm:flex-row gap-3 mt-4 items-start sm:items-center justify-between

Izquierda:
  DarkInput búsqueda: placeholder="Buscar por nombre o SKU..."
    Icono <Search/> | Debounce 300ms

  Select filtro por rango de stock:
    "Todos los productos"
    "Solo en stock normal"
    "Bajo mínimo (⚠)"
    "Sin stock (✗)"

Derecha (solo ADMIN/ALMACEN):
  Button variant="primary" <Plus/> "Nuevo Producto"
    onClick → abre Modal "Nuevo Producto"
```

### Tabla de Productos

```
Clases contenedor: mt-4 rounded-xl border border-slate-800 overflow-hidden

Encabezados (bg-slate-900 px-4 py-3 border-b border-slate-800):
  SKU | Nombre | Categoría | Stock Físico | Mínimo | Precio Venta | Acciones

Columna SKU:
  font-mono text-xs text-orange-400

Columna Nombre:
  text-sm font-medium text-slate-200

Columna Categoría:
  Badge small con nombre de categoría (neutral)

Columna "Stock Físico" (con color-coding crítico):
  ┌ stock === 0 ─────────────────────────────────────────────────────┐
  │  <span class="font-mono font-bold text-red-400">0</span>        │
  │  StatusBadge variant=danger "Sin Stock"                         │
  └──────────────────────────────────────────────────────────────────┘
  ┌ 0 < stock <= mínimo ─────────────────────────────────────────────┐
  │  <span class="font-mono font-bold text-amber-400">{n}</span>    │
  │  StatusBadge variant=warning "Bajo Mínimo"                      │
  └──────────────────────────────────────────────────────────────────┘
  ┌ stock > mínimo ──────────────────────────────────────────────────┐
  │  <span class="font-mono font-bold text-green-400">{n}</span>    │
  └──────────────────────────────────────────────────────────────────┘

Columna Mínimo:
  font-mono text-slate-400 text-sm

Columna Precio:
  "S/ {precio}" font-mono font-medium text-slate-200

Columna Acciones (solo ADMIN/ALMACEN):
  Button variant="secondary" size="sm"
  <Edit2 className="w-3.5 h-3.5"/> "Ajustar Stock"
  onClick → abre Modal "Ajuste de Stock" con el producto pre-seleccionado

Fila con stock crítico (stock <= mínimo):
  Fondo de fila: bg-amber-950/10 (sutil highlight de toda la fila)
  Borde izquierdo: border-l-2 border-amber-500 (indicador visual)

Hover fila: bg-slate-800/30

Paginación: igual a pantalla anterior
```

### Modal — Ajuste de Stock

```
Título: "Ajuste de Stock — {nombre del producto}"
Tamaño: size="md"

─── Nombre del producto ──────────────────────────────────────────────────
  Header informativo (bg-slate-800/40 rounded-lg p-3 mb-4):
    SKU + Nombre del producto
    "Stock actual: {n} unidades" font-mono

─── Tipo de Ajuste ───────────────────────────────────────────────────────
  Label: "Tipo de Movimiento" (requerido)
  RadioGroup con 3 opciones (renderizadas como cards seleccionables):

  ┌ ENTRADA (bg-green-950/20 border border-green-800/30 cuando seleccionado) ──┐
  │  <ArrowDownToLine className="text-green-400"/> "Entrada de Stock"         │
  │  text-xs text-slate-400 "Aumenta el inventario disponible"                │
  └────────────────────────────────────────────────────────────────────────────┘

  ┌ SALIDA (bg-red-950/20 border border-red-800/30 cuando seleccionado) ───────┐
  │  <ArrowUpFromLine className="text-red-400"/> "Salida de Stock"            │
  │  text-xs text-slate-400 "Reduce el inventario (pérdida, merma)"           │
  └────────────────────────────────────────────────────────────────────────────┘

  ┌ CORRECCIÓN (bg-blue-950/20 border border-blue-800/30 cuando seleccionado) ─┐
  │  <RefreshCw className="text-blue-400"/> "Corrección de Inventario"        │
  │  text-xs text-slate-400 "Establece el stock exacto tras conteo físico"    │
  └────────────────────────────────────────────────────────────────────────────┘

─── Motivo del Movimiento ────────────────────────────────────────────────
  Select oscuro con opciones contextuales según tipo elegido:
    ENTRADA: Compra a proveedor | Devolución de cliente | Producción interna
    SALIDA:  Venta directa | Merma / Deterioro | Pérdida por robo | Muestra
    CORRECCIÓN: Conteo físico periódico | Corrección de error | Auditoría

─── Cantidad ─────────────────────────────────────────────────────────────
  Para ENTRADA/SALIDA:
    Label: "Cantidad a {ingresar/retirar}"
    DarkInput type="number" min=1
    Preview: "Nuevo stock estimado: {resultado}" en text-sm text-slate-400
      Resultado: color-coded (verde si > mínimo, rojo si baja a 0)

  Para CORRECCIÓN:
    Label: "Nuevo stock exacto tras conteo"
    DarkInput type="number" min=0

─── Footer del Modal ─────────────────────────────────────────────────────
  Button variant="ghost" "Cancelar"
  Button variant="primary" "Confirmar Ajuste"
    loading: "Guardando..."
    success: cierra modal + toast "Stock actualizado correctamente"
             + fila de tabla se actualiza con el nuevo valor (sin reload)
```

### Tab Secundario — Historial de Movimientos

```
(Pestaña junto a la tabla principal de productos)
Tab1: "Productos" (tabla anterior)
Tab2: "Historial de Movimientos"

Tabla historial:
  Columnas: Fecha/Hora | Producto (SKU) | Tipo | Cantidad | Motivo | Usuario | Notas
  Tipo: Badge coloreado (Entrada=green, Salida=red, Corrección=blue)
  Cantidad: font-mono con prefijo + (entrada) o - (salida)
  Ordenado por fecha desc
  Filtros adicionales: por tipo de movimiento, por rango de fechas
  Exportar: Button variant="secondary" size="sm" <Download/> "Exportar CSV"
```

---

## 🖥️ PANTALLA 7 — Gestión de Clientes

**Ruta**: `/dashboard/clientes`  
**Rol requerido**: VENDEDOR, REPRESENTANTE, ADMIN  
**Componente**: `src/app/dashboard/clientes/page.tsx`

---

### Header y Toolbar

```
Título: "Gestión de Clientes"
Sub: "Base de datos de clientes comerciales e industriales"

Toolbar (flex gap-3 mt-4):
  Izquierda:
    DarkInput búsqueda: placeholder="Buscar por nombre, DNI o RUC..."
      Icono <Search/> | Debounce 300ms | min-w-[280px]

    Select filtro por tipo:
      "Todos los tipos"
      "Persona Natural (DNI)"
      "Empresa / Persona Jurídica (RUC)"

  Derecha:
    Button variant="primary" <UserPlus/> "Nuevo Cliente"
      onClick → abre Modal "Nuevo / Editar Cliente"
```

### Tabla de Clientes

```
Clases: rounded-xl border border-slate-800 overflow-hidden mt-4

Encabezados: Tipo | Nro. Documento | Nombre / Razón Social | Teléfono | Email | Ciudad | Acciones

Columna Tipo:
  Persona Natural: StatusBadge variant=info <User className="w-3 h-3"/> "DNI"
  Empresa:         StatusBadge variant=warning <Building2 className="w-3 h-3"/> "RUC"

Columna Nro. Documento:
  font-mono text-sm text-slate-300

Columna Nombre / Razón Social:
  text-sm font-medium text-slate-200
  Si es empresa: icono <Building2 className="w-3.5 h-3.5 text-slate-500"/> antes del nombre

Columna Teléfono:
  font-mono text-sm text-slate-400

Columna Email:
  text-sm text-slate-400 truncate max-w-[180px]

Columna Ciudad:
  text-sm text-slate-400

Columna Acciones (flex gap-2):
  Button variant="ghost" size="sm" <Eye/>  "Ver"
    onClick → abre Drawer de detalle del cliente

  Button variant="ghost" size="sm" <Edit2/> "Editar"
    onClick → abre Modal "Nuevo / Editar Cliente" con datos pre-cargados

  Button variant="ghost" size="sm" <History/> "Compras"
    onClick → abre Drawer en tab "Historial de Compras"

Fila hover: bg-slate-800/30 cursor-pointer
Clic en fila (no en acciones): abre Drawer de detalle

Paginación: igual a las anteriores
Estado vacío (sin resultados de búsqueda):
  Centered: <Users2 className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
  "No se encontraron clientes" text-slate-400
  "Intenta con otro término de búsqueda" text-slate-500 text-sm
  Button variant="primary" size="sm" "Crear nuevo cliente"
```

### Drawer — Detalle del Cliente

```
Tamaño: max-w-[520px]

─── Sección 1: Datos del Cliente ─────────────────────────────────────────
  Header del Drawer:
    Avatar grande: iniciales del nombre, bg-gradient brand, w-16 h-16 rounded-xl
    Nombre completo / Razón Social: text-xl font-bold text-slate-100
    StatusBadge tipo (DNI/RUC) + número de documento font-mono

  Grid de datos (grid grid-cols-2 gap-4 mt-4):
    Teléfono:  <Phone/> {valor}
    Email:     <Mail/>  {valor}
    Dirección: <MapPin/> {valor} (col-span-2 si es larga)
    Ciudad:    <Building/> {valor}
    Desde:     <Calendar/> "Cliente desde {fecha de registro}"

─── Sección 2: Estadísticas Rápidas ──────────────────────────────────────
  Grid 3 columnas (bg-slate-800/30 rounded-xl p-4):
    Total Comprado:    "S/ {suma}" font-mono font-bold text-xl text-slate-100
                       "Total histórico" text-xs text-slate-400
    # Transacciones:   "{n}" font-mono font-bold text-xl text-slate-100
                       "Compras realizadas" text-xs text-slate-400
    Última Compra:     "{fecha}" font-semibold text-slate-100
                       "Última transacción" text-xs text-slate-400

─── Sección 3: Historial de Compras ──────────────────────────────────────
  Tabla dentro del Drawer (max-h-[300px] overflow-y-auto):
  Columnas: Fecha | Comprobante | Total | Vendedor/Rep | Canal
  Canal: Badge "Comercial" (green) o "Industrial" (blue)
  Total: font-mono text-slate-100

  Paginación simple: "Ver más compras" Button ghost

─── Footer del Drawer ─────────────────────────────────────────────────────
  Button variant="secondary" <Edit2/> "Editar datos del cliente"
    onClick → abre Modal en modo edición
```

### Modal — Nuevo / Editar Cliente

```
Título: "Nuevo Cliente" o "Editar Cliente — {nombre}"
Tamaño: size="md"

─── Toggle Tipo de Documento ─────────────────────────────────────────────
  (igual al toggle Boleta/Factura del canal comercial)
  Opción "DNI — Persona Natural"
  Opción "RUC — Empresa / Persona Jurídica"

─── Campo Número de Documento ────────────────────────────────────────────
  Label contextual: "Número de DNI" o "Número de RUC"
  DarkInput type="text" inputMode="numeric"
    maxLength: 8 (DNI) o 11 (RUC)
    Validación inline:
      DNI: exactamente 8 dígitos numéricos
      RUC: exactamente 11 dígitos, empieza en 10, 15 o 20
    Icono derecho: spinner cuando consultando API SUNAT (si se implementa)

─── Campo Nombre / Razón Social ──────────────────────────────────────────
  Label: "Nombre completo" (DNI) o "Razón Social" (RUC)
  DarkInput text
  Autocompletado sugerido si se integra API SUNAT

─── Campos Adicionales ───────────────────────────────────────────────────
  Grid 2 columnas:
    Teléfono: DarkInput tel | <Phone/>
    Email:    DarkInput email | <Mail/>
  Dirección: DarkInput text (full width)
  Ciudad:    DarkInput text

─── Footer del Modal ─────────────────────────────────────────────────────
  Button variant="ghost" "Cancelar"
  Button variant="primary" "Guardar Cliente"
    loading: "Guardando..."
    success en creación: toast "Cliente registrado correctamente"
    success en edición:  toast "Datos del cliente actualizados"
```

---

## 🖥️ PANTALLA 8 — Administración de Usuarios

**Ruta**: `/dashboard/admin`  
**Rol requerido**: ADMIN (exclusivo)  
**Componente**: `src/app/dashboard/admin/page.tsx`  
**Middleware**: Redirige a `/dashboard` si el rol no es ADMIN

---

### Header

```
Título: "Administración del Sistema"
Sub: "Gestión de usuarios, roles y configuración de FADICC S.A."

Alerta de seguridad (visible siempre en esta sección):
  bg-amber-950/20 border border-amber-800/20 rounded-lg p-3 mb-6
  <ShieldAlert className="w-4 h-4 text-amber-400"/>
  "Zona de administración. Los cambios realizados aquí afectan a todos los usuarios del sistema."
```

### Sección: Tabla de Usuarios

```
Card con header:
  "Usuarios del Sistema" + Badge "{n} usuarios activos"
  Button variant="primary" size="sm" <UserPlus/> "Nuevo Usuario"
    onClick → Modal "Nuevo Usuario"

Tabla:
  Encabezados: Nombre | Correo | Rol | Estado | Último Acceso | Acciones

  Columna Nombre:
    Avatar circular (iniciales) + Nombre completo
    Avatar: bg-gradient según rol, w-8 h-8 rounded-full text-xs font-bold

  Columna Correo:
    font-mono text-sm text-slate-300

  Columna Rol:
    StatusBadge con colores por rol:
      ADMIN:          variant=warning(naranja)  "ADMIN"
      VENDEDOR:       variant=success(verde)    "VENDEDOR"
      REPRESENTANTE:  variant=info(azul)        "REP. INDUSTRIAL"
      ALMACEN:        variant=violet            "ALMACÉN"
      PRODUCCION:     variant=warning(ámbar)    "PRODUCCIÓN"

  Columna Estado:
    Toggle inline (switch):
      Activo:   bg-green-600, label "Activo"  text-green-400
      Inactivo: bg-slate-600, label "Inactivo" text-slate-400
      Al cambiar: toast confirmación "Estado del usuario actualizado"
      El usuario ADMIN logueado NO puede desactivarse a sí mismo (disabled + tooltip)

  Columna Último Acceso:
    "{hace X horas}" o "Nunca" con formato relativo
    text-sm text-slate-400

  Columna Acciones:
    Button variant="ghost" size="sm" <Edit2/> "Editar"
      onClick → Modal "Editar Usuario" con datos pre-cargados

    Button variant="ghost" size="sm" text-red-400 <Trash2/> "Eliminar"
      onClick → Modal de confirmación: "¿Eliminar usuario {nombre}?
                Esta acción no se puede deshacer. Se eliminarán todos
                sus registros de sesión."
              Botón confirmar: variant="danger" "Sí, eliminar"
      Inhabilitado para el propio usuario logueado

  Hover fila: bg-slate-800/30
```

### Modal — Nuevo Usuario

```
Título: "Crear Nuevo Usuario"
Tamaño: size="md"

─── Campos ───────────────────────────────────────────────────────────────
  Nombre completo: DarkInput text | <User/> | requerido
  Correo electrónico: DarkInput email | <Mail/> | requerido
    Validación: formato email + verificación de unicidad en tiempo real
    (icono spinner mientras verifica, ícono check o X al terminar)

  Rol: Select oscuro con todas las opciones de rol
    Incluye ícono de color por rol en cada opción del dropdown

  Contraseña temporal: DarkInput password | <Lock/>
    Botón toggle visibilidad
    Indicador de fortaleza (barra debajo):
      Débil: rojo | Media: ámbar | Fuerte: verde
    Helper text: "El usuario deberá cambiar su contraseña en el primer ingreso."

─── Footer ───────────────────────────────────────────────────────────────
  Button variant="ghost" "Cancelar"
  Button variant="primary" "Crear Usuario"
```

### Modal — Editar Usuario

```
Título: "Editar Usuario — {nombre}"
Idéntico al de creación pero sin el campo de contraseña
Campo adicional: "Restablecer contraseña" (checkbox o botón separado)
  Si se activa: aparece campo "Nueva contraseña temporal"
```

### Sección: Configuración del Sistema

```
Separador visual: mt-8 pt-8 border-t border-slate-800
Título: "Configuración del Sistema"
Sub: "Parámetros globales de la empresa y alertas de inventario"

Grid 2 columnas (gap-6):

─── Tarjeta: Datos de la Empresa ─────────────────────────────────────────
  Card con título "Información de la Empresa"
  Campos:
    Nombre de la empresa: DarkInput text  (default: "FADICC S.A.")
    RUC: DarkInput text 11 dígitos font-mono
    Dirección fiscal: DarkInput text
    Teléfono: DarkInput tel
    Email corporativo: DarkInput email
  Button variant="primary" w-full mt-4 "Guardar Cambios"

─── Tarjeta: Configuración de Stock ──────────────────────────────────────
  Card con título "Niveles de Alerta de Stock"
  Descripción:
    text-xs text-slate-400 "Define el stock mínimo global por defecto para
    nuevos productos. Este valor puede sobreescribirse por producto."
  Campo:
    "Stock mínimo global por defecto"
    DarkInput type="number" min=0
    Helper: "Los productos con stock ≤ a este valor aparecerán en alerta"
  Campo:
    "Días de anticipación para alerta de vencimiento de proformas"
    DarkInput type="number" min=1 max=30
    Helper: "Número de días antes del vencimiento para mostrar warning"
  Button variant="primary" w-full mt-4 "Guardar Configuración"
```

---

## 🌐 MODAL GLOBAL — Confirmación de Cierre de Caja

**Accesible desde**: Canal Comercial (botón "Cerrar Turno")  
**Componente**: Global, montado en el layout shell

```
Título: "Cerrar Turno de Caja"
Tamaño: size="md"

Resumen del turno (bg-slate-800/40 rounded-xl p-4):
  Grid 2 columnas de datos:
    Hora de apertura:  {hora}
    Duración del turno: {horas y minutos}
    Monto de apertura: "S/ {monto}" font-mono
    N° de ventas:      {cantidad}
    Total facturado:   "S/ {total}" font-mono font-bold text-xl text-green-400

Discrepancia (si la hay):
  Campo "Monto de cierre en efectivo":
    DarkInput type="number"
    Helper: "Cuenta el efectivo físico de la caja"
  Preview de diferencia:
    Si coincide: "✓ Sin diferencia" text-green-400
    Si difiere:  "Diferencia: ±S/ {diff}" text-amber-400
                 Nota: "Esta diferencia quedará registrada en el reporte de caja"

Footer:
  Button variant="ghost" "Cancelar"
  Button variant="danger" <PowerOff/> "Confirmar Cierre de Turno"
    loading: "Cerrando turno..."
    success: toast "Turno cerrado. Reporte generado."
             caja pasa a estado CERRADA
             banner de caja cambia a rojo
```

---

## 📱 COMPORTAMIENTO RESPONSIVE

```
Breakpoints y adaptaciones:

lg (1024px+):
  Sidebar visible a pantalla completa, fijo a la izquierda
  Layouts de 2-3 columnas activos

md (768px - 1023px):
  Sidebar colapsado a iconos (solo iconos, sin texto)
  Layouts de 2 columnas se convierten en 1 columna con tabs

sm (640px - 767px):
  Sidebar oculto, reemplazado por BottomBar de navegación
  Kanban: scroll horizontal con columnas de 260px min-width
  Tablas: scroll horizontal con columnas congeladas (nombre/acciones)

< sm (móvil):
  Mismas reglas que sm
  Tarjetas KPI: 2 columnas (en lugar de 4)
  Panel de venta: pantalla completa sobre catálogo (bottom sheet)

BottomBar (< lg):
  fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800
  flex justify-around items-center
  Íconos de navegación según rol, activo resaltado en naranja
```

---

## ⚡ PATRONES DE INTERACCIÓN GLOBALES

```
1. LOADING STATES
   - Skeleton loaders (bg-slate-800 animate-pulse rounded) para datos en carga
   - Spinner inline en botones durante mutaciones
   - Overlay de carga para operaciones críticas (confirmar venta)

2. OPTIMISTIC UI
   - Al mover tarjeta Kanban: el cambio visual es inmediato,
     revertido si la petición falla con Toast de error

3. TIEMPO REAL (Supabase Realtime)
   - Stock de productos: se actualiza en tiempo real sin reload
   - Estado de pedidos en producción: actualización automática
   - Nuevas proformas: aparecen en el Kanban sin reload

4. VALIDACIÓN DE FORMULARIOS
   - Validación en tiempo real (onChange) para campos críticos
   - Resumen de errores al intentar submit con campos vacíos
   - Foco automático en el primer campo con error

5. ATAJOS DE TECLADO
   - Escape: cierra modal o drawer activo
   - Ctrl+K: abre buscador global (productos / clientes)
   - Enter: confirma el formulario activo (si está válido)

6. CONFIRMACIONES DESTRUCTIVAS
   - Cualquier acción irreversible (eliminar, rechazar, cerrar caja)
     requiere un diálogo de confirmación explícita
   - Color danger (rojo) en botón de confirmación

7. PERSISTENCIA DE FILTROS
   - Los filtros de búsqueda y estado se guardan en URL params
   - Permite compartir/recargar la vista con el mismo estado
```

---

*Documento generado el 6 de junio de 2026 — FADICC S.A.*  
*Para uso con herramientas de generación de UI: Stitch · v0 · Bolt · Figma*
