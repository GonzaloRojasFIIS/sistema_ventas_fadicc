# FADICC ERP v2.0 — Guía de Configuración y Despliegue

> **IMPORTANTE:** Este archivo es solo para uso local. NO subir al repositorio.

---

## 1. Requisitos Previos

| Herramienta | Versión | Link |
|:---|:---|:---|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | Incluido con Node.js |
| Cuenta Vercel | Gratis | https://vercel.com/signup |
| Cuenta Supabase | Gratis | https://supabase.com/signup |

---

## 2. Configuración de Supabase (Base de Datos)

### 2.1 Crear el proyecto
1. Inicia sesión en [https://supabase.com](https://supabase.com)
2. Haz clic en **New Project**
3. Completa:
   - **Name:** `fadicc-erp` (o el nombre que prefieras)
   - **Database Password:** Genera una segura y guárdala
   - **Region:** `South America (São Paulo)` (más cercano a Perú)
4. Espera a que el proyecto esté activo (tarda ~2 minutos)

### 2.2 Obtener las credenciales
1. Ve a **Project Settings** (icono de engranaje) → **API**
2. Copia y guarda estos dos valores:
   - **Project URL:** `https://fevowxhawfepadpvcflu.supabase.co`
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldm93eGhhd2ZlcGFkcHZjZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODEyODYsImV4cCI6MjA5NjM1NzI4Nn0.j2albu2fWESzZ8kgZTfHEnVkKYoGNSUHIHNQGhHIBGU`

### 2.3 Ejecutar el schema SQL
1. Ve al panel de tu proyecto → **SQL Editor** → **New query**
2. Abre el archivo `supabase_schema.sql` del repo (228 líneas)
3. Copia TODO el contenido y pégalo en el editor
4. Presiona **Run**

Esto crea:
- 10 tablas: `usuarios`, `clientes`, `productos`, `caja_turnos`, `ventas_comerciales`, `venta_detalles`, `proformas`, `proforma_detalles`, `orden_pedidos`, `movimientos_stock`
- Índices de rendimiento
- Datos de prueba (6 usuarios, 5 clientes, 8 productos, 2 proformas)

### 2.4 Verificar que las tablas existen
Ejecuta en SQL Editor:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
Debe mostrar las 10 tablas.

### 2.5 Verificar que la columna `imagen` existe
```sql
SELECT sku, nombre, imagen FROM productos;
```
Si da error `column "imagen" does not exist`, ejecuta:
```sql
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen TEXT;

UPDATE productos SET imagen = '/cocinas/Cocina-de-4-horno-mesa-y-pie.png' WHERE sku = 'COC-IND-04';
UPDATE productos SET imagen = '/cocinas/De-3-hornias.png' WHERE sku = 'COC-IND-06';
UPDATE productos SET imagen = '/cocinas/De-4-hornias.png' WHERE sku = 'COC-IND-08';
UPDATE productos SET imagen = '/cocinas/Cocina-de-2-horno-mesa-y-pie.png' WHERE sku = 'COC-COM-04';
UPDATE productos SET imagen = '/cocinas/Cocinas-22in.png' WHERE sku = 'COC-DOM-04';
UPDATE productos SET imagen = '/cocinas/Horno-Acero.png' WHERE sku = 'HOR-IND-01';
UPDATE productos SET imagen = '/cocinas/Chiferos-y-Fogones.png' WHERE sku = 'HOR-COM-01';
UPDATE productos SET imagen = '/cocinas/Cocina-de-1-horno-mesa-y-pie.png' WHERE sku = 'ACC-PLA-01';
```

---

## 3. Configuración Local (Tu PC)

### 3.1 Instalar dependencias
```bash
npm install
```

### 3.2 Crear el archivo de entorno
En la raíz del proyecto, crea un archivo llamado **`.env.local`** con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fevowxhawfepadpvcflu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldm93eGhhd2ZlcGFkcHZjZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODEyODYsImV4cCI6MjA5NjM1NzI4Nn0.j2albu2fWESzZ8kgZTfHEnVkKYoGNSUHIHNQGhHIBGU
```

> **Nota:** Este archivo está en `.gitignore` y NUNCA se sube a GitHub.

### 3.3 Ejecutar en modo desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 3.4 Credenciales de login (datos de prueba)
| Rol | Email | Contraseña |
|:---|:---|:---|
| Admin | `admin@fadicc.com` | `123456` |
| Vendedor | `vendedor@fadicc.com` | `123456` |
| Representante | `representante@fadicc.com` | `123456` |
| Almacén | `almacen@fadicc.com` | `123456` |
| Producción | `produccion@fadicc.com` | `123456` |

---

## 4. Despliegue en Vercel

### 4.1 Importar el repositorio
1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Autoriza a Vercel para acceder a tu GitHub
3. Busca y selecciona: `GonzaloRojasFIIS/sistema_ventas_fadicc`
4. Presiona **Import**

### 4.2 Configurar variables de entorno
En la pantalla de configuración, busca **Environment Variables** y agrega DOS variables:

#### Variable 1
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://fevowxhawfepadpvcflu.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldm93eGhhd2ZlcGFkcHZjZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODEyODYsImV4cCI6MjA5NjM1NzI4Nn0.j2albu2fWESzZ8kgZTfHEnVkKYoGNSUHIHNQGhHIBGU`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### 4.3 Deploy
Presiona **Deploy**. Espera ~1-2 minutos.

### 4.4 URL en vivo
Cuando termine, Vercel te dará una URL tipo:
```
https://sistema-ventas-fadicc.vercel.app
```

---

## 5. Trabajo en Equipo (Compartir con Amigos)

### 5.1 Lo que NUNCA compartes
- ❌ El archivo `.env.local` con las claves reales
- ❌ Subir credenciales a GitHub

### 5.2 Lo que SÍ compartes
- ✅ El repo de GitHub
- ✅ Las credenciales de Supabase por un canal seguro (WhatsApp, correo, etc.)

### 5.3 Pasos para cada miembro del equipo
1. Clonar el repo:
   ```bash
   git clone https://github.com/GonzaloRojasFIIS/sistema_ventas_fadicc.git
   cd sistema_ventas_fadicc
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear su `.env.local`:
   ```bash
   # En Windows PowerShell:
   copy .env.local.example .env.local
   # En Mac/Linux:
   cp .env.local.example .env.local
   ```
4. Editar `.env.local` y pegar las credenciales reales de Supabase
5. Ejecutar:
   ```bash
   npm run dev
   ```

### 5.4 Ventaja de compartir la misma base de datos
Todos los miembros del equipo conectan al **mismo proyecto de Supabase**, por lo que:
- Todos ven los mismos datos en tiempo real
- Las ventas, proformas y movimientos de stock son compartidos
- No necesitan cada uno su propia base de datos

---

## 6. Modo de Datos (Dual Mode)

La aplicación tiene un sistema inteligente:

| Modo | Cuándo ocurre | Dónde se guardan los datos |
|:---|:---|:---|
| **Supabase** (Real) | Cuando `.env.local` tiene credenciales válidas | Base de datos PostgreSQL en la nube |
| **localStorage** (Mock) | Cuando NO hay credenciales o están mal | Navegador del usuario (se pierden al borrar caché) |

**Para forzar el modo localStorage** (pruebas sin internet):
- Renombra `.env.local` a `.env.local.bak`
- Reinicia el servidor: `npm run dev`

---

## 7. Solución de Problemas Comunes

### ❌ "Las imágenes no se ven en Canal Comercial"
**Causa:** La tabla `productos` en Supabase no tiene la columna `imagen` o las rutas están vacías.
**Solución:** Ejecuta el `ALTER TABLE` y los `UPDATE` del paso 2.5. Luego redeploya en Vercel.

### ❌ "Error al conectar con Supabase"
**Causa:** La `ANON KEY` es incorrecta o el proyecto está pausado.
**Solución:**
- Verifica que la clave sea la de **anon public** (no la service role)
- Revisa que el proyecto de Supabase esté activo (no en pausa por inactividad)

### ❌ "No se pueden registrar ventas"
**Causa:** No hay una caja abierta.
**Solución:** En Canal Comercial, presiona **Abrir Turno** antes de agregar productos al carrito.

### ❌ "Los datos se borran al recargar la página"
**Causa:** Estás en modo `localStorage` (sin Supabase configurado).
**Solución:** Verifica que `.env.local` exista y tenga las credenciales correctas.

---

## 8. Estructura de Rutas y Roles

| Ruta | Módulo | Roles permitidos |
|:---|:---|:---|
| `/` | Login | Todos |
| `/dashboard` | Dashboard KPIs | ADMIN |
| `/dashboard/comercial` | Canal Comercial (caja, catálogo, carrito) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/industrial` | Canal Industrial (Kanban, proformas) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/produccion` | Producción (stepper, órdenes) | ADMIN, PRODUCCION, ALMACEN |
| `/dashboard/inventario` | Inventario (stock, movimientos) | ADMIN, ALMACEN, VENDEDOR, REPRESENTANTE |
| `/dashboard/clientes` | Clientes (ficha, historial) | ADMIN, VENDEDOR, REPRESENTANTE |
| `/dashboard/admin` | Administración (usuarios, roles) | ADMIN |

---

## 9. Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, TypeScript 5, Tailwind CSS v4
- **Base de Datos:** Supabase (PostgreSQL)
- **Gráficos:** Recharts
- **Despliegue:** Vercel
- **Íconos:** SVG inline personalizados (`src/components/Icons.tsx`)

---

## 10. Contacto y Recursos

- **Repositorio:** https://github.com/GonzaloRojasFIIS/sistema_ventas_fadicc
- **Supabase Dashboard:** https://supabase.com/dashboard/project/fevowxhawfepadpvcflu
- **Vercel Dashboard:** https://vercel.com/dashboard

---

> **Última actualización:** 2026-06-06
> **Versión:** FADICC ERP v2.0
