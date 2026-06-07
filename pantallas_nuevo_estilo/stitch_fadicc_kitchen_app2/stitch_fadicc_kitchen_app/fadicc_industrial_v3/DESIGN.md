---
name: FADICC Industrial V3
colors:
  primary: '#f97316'
  primary-container: '#ffedd5'
  on-primary: '#ffffff'
  surface: '#fff8f6'
  surface-dim: '#edd5cb'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#fdeee8'
  surface-container-high: '#f8e3db'
  surface-container-highest: '#f3d8cf'
  on-surface: '#231916'
  on-surface-variant: '#53433f'
  outline: '#85736e'
  outline-variant: '#d8c2bc'
  inverse-surface: '#392e2b'
  inverse-on-surface: '#ffede8'
  error: '#ba1a1a'
  error-container: '#ffdad6'
  on-error: '#ffffff'
  surface-tint: '#9d4300'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#6c5a56'
  on-secondary: '#ffffff'
  secondary-container: '#f2dbd5'
  on-secondary-container: '#705f5a'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#f5ddd8'
  secondary-fixed-dim: '#d8c2bc'
  on-secondary-fixed: '#251915'
  on-secondary-fixed-variant: '#53433f'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#fff8f6'
  on-background: '#251913'
  surface-variant: '#f6ded3'
  success: '#16a34a'
  info: '#2563eb'
  warning: '#f97316'
typography:
  font_family: Geist Sans
  headings: font-semibold tracking-tight text-on-surface
  body: font-normal text-on-surface-variant
  code: font-mono text-sm
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
roundness: ROUND_XL
spacing: COMPACT
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

# Sistema de Gestión FADICC S.A.

## Concepto
Un sistema de gestión industrial y comercial robusto que utiliza el **Naranja (#f97316)** como color de marca principal sobre una base clara y profesional.

## Componentes Compartidos

### Sidebar de Navegación (Role-Based)
- **Header**: Logo de FADICC y nombre de la empresa.
- **Navegación**: Items con iconos (Dashboard, Ventas, Proformas, Producción, Inventario, Clientes, Admin).
- **Footer**: Perfil de usuario con avatar y botón de cierre de sesión.

### Tablas de Alta Densidad
- Bordes redondeados `rounded-xl`.
- Headers en `bg-surface-container-low`.
- Filas con hover `hover:bg-surface-container-high`.
- Tipografía mono para SKUs y montos.

### Badges de Estado
- **Pendiente**: Naranja (Warning).
- **Aprobado/Entregado**: Verde (Success).
- **Error/Agotado**: Rojo (Error).
- **En Proceso**: Azul (Info).