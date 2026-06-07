---
name: FADICC Industrial Light
colors:
  surface: '#fff8f6'
  surface-dim: '#edd5cb'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#ffeae0'
  surface-container-high: '#fce3d9'
  surface-container-highest: '#f6ded3'
  on-surface: '#251913'
  on-surface-variant: '#584237'
  inverse-surface: '#3c2d26'
  inverse-on-surface: '#ffede6'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#fff8f6'
  on-background: '#251913'
  surface-variant: '#f6ded3'
  brand-hover: '#EA580C'
  brand-accent: '#FB923C'
  brand-amber: '#F59E0B'
  surface-base: '#F8FAFC'
  surface-card: '#FFFFFF'
  surface-elevated: '#F1F5F9'
  text-primary: '#0F172A'
  text-muted: '#64748B'
  border-standard: '#E2E8F0'
  success-green: '#22C55E'
  danger-red: '#EF4444'
  warning-yellow: '#F59E0B'
  info-blue: '#3B82F6'
typography:
  headline-4xl:
    fontFamily: Geist Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-2xl:
    fontFamily: Geist Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Geist Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  mono-code:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  gap-xs: 0.75rem
  gap-md: 1rem
  gap-lg: 1.5rem
  layout-margin: 2rem
  sidebar-width: 256px
---

## Brand & Style

The design system for FADICC S.A. embodies an **Industrial & High-Efficiency** aesthetic. It is tailored for the rigorous demands of kitchen manufacturing and industrial management, prioritizing clarity, precision, and operational speed. 

The style is **Modern Corporate**, characterized by a clean white-base environment that minimizes visual noise while utilizing bold brand orange accents to direct focus toward critical actions and key performance indicators. The interface evokes a sense of reliability and technical excellence, blending the robustness of industrial machinery with the sophistication of modern software.

Targeting professional managers and factory operators, the UI remains high-contrast and highly functional, ensuring that complex data sets are legible and actionable at a glance.

## Colors

The palette transitions from a dark-themed legacy to a **High-Contrast Light Theme**. The primary brand orange (`#F97316`) is the dominant chromatic signal, reserved for primary CTAs, active states, and brand-identifying elements.

- **Backgrounds:** A crisp white secondary color (`#FFFFFF`) serves as the foundation. Neutral backgrounds utilize `Slate-50` (`#F8FAFC`) to provide subtle contrast between the page body and white cards.
- **Surface Tiers:** Cards and containers use pure white. Elevated states, such as input backgrounds and hover states for table rows, use `Slate-100` (`#F1F5F9`).
- **Typography:** Text contrast is maximized using `Slate-900` (`#0F172A`) for primary content and `Slate-500` (`#64748B`) for secondary labels.
- **Semantics:** Status indicators (Success, Danger, Warning, Info) use standard industrial semantic colors with high-saturation values to ensure visibility against the light background.

## Typography

This design system uses the **Geist** typeface family to maintain a technical and precise atmosphere.

- **Geist Sans:** Used for all standard UI elements, including headings, paragraphs, and navigation components. It provides a clean, neutral tone that stays legible in high-density layouts.
- **Geist Mono:** Reserved for technical data, including SKUs, order IDs, financial figures, and timestamps. The monospaced nature ensures that columns of numbers align perfectly in tables and manufacturing logs.
- **Scaling:** For desktop usage, headlines are large and bold (`700` weight) to establish clear hierarchy in data-heavy screens. For mobile, headline sizes should scale down by 20% to prevent layout overflow.

## Layout & Spacing

The layout is designed for **maximum screen real estate**, catering to desktop-first industrial management workflows.

- **Grid System:** A 12-column fluid grid is used for the main content area, with a fixed 256px (`w-64`) sidebar on the left.
- **Density:** High-density spacing is achieved via a 4px base unit. Gaps between related items (like badges) use `0.75rem`, while structural page sections use `1.5rem`.
- **Breakpoints:**
    - **Desktop (1280px+):** Fixed sidebar, 3+ column data grids.
    - **Tablet (768px - 1024px):** Sidebar collapses to icons; tables transition to horizontal scroll or card view.
    - **Mobile (<768px):** Single column layout, bottom navigation bar, and full-width inputs.

## Elevation & Depth

To maintain an industrial and clean aesthetic, depth is achieved through **Tonal Layering** and **Subtle Shadows** rather than aggressive gradients.

- **Layering:** The base background is `Slate-50`. Cards and primary containers sit on top in pure `#FFFFFF`. Hovered or interactive elements use `Slate-100` to create a "recessed" or "active" feel.
- **Shadows:** Use extremely soft, low-opacity shadows. Standard cards utilize a `shadow-sm` (10% opacity black). Floating modals or dropdowns use a `shadow-lg` with a slight orange tint (`shadow-orange-500/5`) to reinforce brand presence.
- **Outlines:** All containers and inputs must have a `1px` border in `Slate-200`. This provides structural definition essential for manufacturing software.

## Shapes

The shape language is **Rounded**, balancing industrial hardness with modern software accessibility.

- **Inputs & Buttons:** Use `0.5rem` (rounded-lg) to provide a comfortable interactive target.
- **Cards & Modals:** Use `1rem` (rounded-xl) for large structural containers to soften the high-density information.
- **Badges:** Status badges use `0.25rem` (rounded-sm) to maintain a crisp, tag-like appearance.
- **Avatars/Dots:** Status indicators and user avatars are always `rounded-full`.

## Components

- **Buttons:** Primary buttons are Solid Brand Orange with white text. Secondary buttons use a white background with a `Slate-200` border and `Slate-900` text.
- **Inputs:** In this light theme, inputs use a white background with a `1px` border. On focus, the border transitions to Brand Orange with a `2px` ring.
- **StatusBadges:** Use a "Soft Color" pattern—light background (e.g., `Success-Green/10`) with high-contrast text (`Success-Green/900`) for maximum legibility.
- **Cards:** Always white background with a `1px Slate-200` border. KPI cards include a `2px` top-border accent using the brand orange or semantic color relevant to the metric.
- **Lists & Tables:** Use `Slate-100` for header backgrounds. Rows should have a subtle bottom border and a `Slate-50` hover state.
- **DarkInput (Specialty):** For high-focus data entry (like SKU counters), use a `Slate-900` background with `Slate-100` text to create a high-contrast focal point within the light UI.