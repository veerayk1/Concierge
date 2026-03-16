# Concierge Design System v2 — Implementation-Ready Expansion

> **Purpose**: This document EXPANDS upon the foundational Design System (v1) at `docs/DESIGN-SYSTEM.md`.
> It adds every missing specification needed for pixel-perfect implementation: OKLCH color science,
> extended typography, complete icon mappings, micro-interactions, component composition,
> data visualization, form catalogs, elevation systems, motion philosophy, dark mode preparation,
> and print stylesheets.
>
> **Relationship to v1**: v1 remains the single source of truth for page layouts, role-based dashboards,
> and feature specifications (Sections 1-20). This v2 provides the implementation substrate — the
> precise tokens, patterns, and rules that engineers need to build those pages.
>
> **Target audience**: Frontend engineers, design system maintainers, QA testers, accessibility auditors.

---

## Table of Contents

1. [OKLCH/LCH Color Space System](#1-oklchlch-color-space-system)
2. [Extended Typography System](#2-extended-typography-system)
3. [Complete Icon Library Mapping](#3-complete-icon-library-mapping)
4. [Micro-Interaction Library](#4-micro-interaction-library)
5. [Component Composition Rules](#5-component-composition-rules)
6. [Data Visualization Guidelines](#6-data-visualization-guidelines)
7. [Empty State Illustration Guidelines](#7-empty-state-illustration-guidelines)
8. [Form Field Design Catalog](#8-form-field-design-catalog)
9. [Elevation and Shadow System](#9-elevation-and-shadow-system)
10. [Motion System Summary](#10-motion-system-summary)
11. [Dark Mode Preparation](#11-dark-mode-preparation)
12. [Print Stylesheet Guidelines](#12-print-stylesheet-guidelines)

---

## 1. OKLCH/LCH Color Space System

### 1.1 Why OKLCH

Traditional HSL/RGB color spaces are not perceptually uniform. A green and a yellow at the same HSL lightness value do NOT appear equally bright to the human eye. This matters critically for Concierge because:

- **Status badges** (success green, warning amber, error red, info blue) must appear at consistent perceived brightness so no single status screams louder than others in a dashboard grid.
- **Chart colors** must be distinguishable by lightness alone for colorblind users.
- **Dark mode** color mappings require predictable lightness transformations.

OKLCH (Oklab Lightness, Chroma, Hue) solves this. It is the CSS Color Level 4 standard and is supported in all modern browsers (Chrome 111+, Safari 15.4+, Firefox 113+).

### 1.2 Color Token Architecture

Every color in Concierge is defined using three layers:

```
Layer 1: OKLCH Source Value     — The canonical definition (perceptually uniform)
Layer 2: Hex Fallback           — For older browsers and design tools
Layer 3: CSS Custom Property    — The token consumed by components
```

**CSS Implementation Pattern:**

```css
:root {
  /* Primary Blue — OKLCH source with hex fallback */
  --color-primary-500: oklch(0.546 0.245 262.88);

  /* For browsers without OKLCH support */
  @supports not (color: oklch(0 0 0)) {
    --color-primary-500: #0071E3;
  }
}
```

### 1.3 Primary Blue Scale

The primary interactive color. Used for CTAs, active navigation, links, focus rings, and toggles.

| Step | OKLCH Value | Hex Fallback | Usage | Contrast vs White | Contrast vs Dark (#1C1C1E) |
|------|-------------|-------------|-------|-------------------|---------------------------|
| 50 | `oklch(0.971 0.014 262.88)` | `#F0F5FF` | Subtle background tint, selected row | 1.05:1 | 15.9:1 |
| 100 | `oklch(0.932 0.032 262.88)` | `#DBEAFE` | Badge background, info highlight | 1.12:1 | 14.9:1 |
| 200 | `oklch(0.882 0.059 262.88)` | `#BFDBFE` | Hover background on light surfaces | 1.25:1 | 13.3:1 |
| 300 | `oklch(0.809 0.105 262.88)` | `#93C5FD` | Progress bar fill (light), border accent | 1.57:1 | 10.6:1 |
| 400 | `oklch(0.707 0.165 262.88)` | `#60A5FA` | Icon accent (decorative only, not text) | 2.31:1 | 7.22:1 |
| **500** | **`oklch(0.546 0.245 262.88)`** | **`#0071E3`** | **Primary buttons, links, active nav, toggles** | **4.62:1 AA** | **3.61:1** |
| 600 | `oklch(0.496 0.230 262.88)` | `#005BBB` | Hover state on primary buttons | 5.87:1 AAA | 2.84:1 |
| 700 | `oklch(0.440 0.200 262.88)` | `#004A99` | Pressed/active state | 7.56:1 AAA | 2.20:1 |
| 800 | `oklch(0.373 0.160 262.88)` | `#003A7A` | High-emphasis text on light backgrounds | 10.1:1 AAA | 1.65:1 |
| 900 | `oklch(0.305 0.120 262.88)` | `#002B5C` | Headings on primary-50 backgrounds | 13.2:1 AAA | 1.26:1 |
| 950 | `oklch(0.250 0.085 262.88)` | `#001D40` | Maximum contrast text | 16.0:1 AAA | 1.04:1 |

### 1.4 Success Green Scale

Used for: resolved, delivered, completed, approved, confirmed, paid, active statuses.

| Step | OKLCH Value | Hex Fallback | Usage | Contrast vs White | Contrast vs Dark |
|------|-------------|-------------|-------|-------------------|-----------------|
| 50 | `oklch(0.970 0.018 163.00)` | `#ECFDF5` | Success background tint | 1.05:1 | 15.9:1 |
| 100 | `oklch(0.935 0.040 163.00)` | `#D1FAE5` | Success badge background | 1.12:1 | 14.9:1 |
| 200 | `oklch(0.885 0.070 163.00)` | `#A7F3D0` | Progress indicator fill | 1.24:1 | 13.4:1 |
| 300 | `oklch(0.810 0.118 163.00)` | `#6EE7B7` | Decorative accents | 1.54:1 | 10.8:1 |
| 400 | `oklch(0.723 0.155 163.00)` | `#34D399` | Chart series, decorative icons | 2.06:1 | 8.10:1 |
| **500** | **`oklch(0.620 0.178 163.00)`** | **`#10B981`** | **Status dot on colored bg, event accent border** | **3.04:1** | **5.49:1** |
| 600 | `oklch(0.545 0.155 163.00)` | `#059669` | Icon on white (3:1 non-text), card accent | 4.18:1 AA-large | 3.99:1 |
| **700** | **`oklch(0.480 0.132 163.00)`** | **`#047857`** | **Text on white — primary success text color** | **5.36:1 AA** | **3.11:1** |
| 800 | `oklch(0.405 0.108 163.00)` | `#065F46` | Badge text on success-100 background | 7.40:1 AAA | 2.25:1 |
| 900 | `oklch(0.335 0.080 163.00)` | `#064E3B` | High-contrast success text | 9.94:1 AAA | 1.68:1 |
| 950 | `oklch(0.270 0.055 163.00)` | `#022C22` | Maximum contrast success | 14.0:1 AAA | 1.19:1 |

**Usage rule**: Steps 500 and below are decorative only (borders, dots, fills). Step 700 (`#047857`) is the minimum for text on white. Step 800 (`#065F46`) is used for badge text on success-100 backgrounds.

### 1.5 Warning Amber Scale

Used for: pending, on hold, expiring soon, attention needed, in progress.

| Step | OKLCH Value | Hex Fallback | Usage | Contrast vs White | Contrast vs Dark |
|------|-------------|-------------|-------|-------------------|-----------------|
| 50 | `oklch(0.977 0.015 80.00)` | `#FFFBEB` | Warning background tint | 1.03:1 | 16.2:1 |
| 100 | `oklch(0.948 0.035 80.00)` | `#FEF3C7` | Warning badge background | 1.07:1 | 15.6:1 |
| 200 | `oklch(0.905 0.065 80.00)` | `#FDE68A` | Light warning fill | 1.17:1 | 14.3:1 |
| 300 | `oklch(0.850 0.105 80.00)` | `#FCD34D` | Decorative accent | 1.36:1 | 12.3:1 |
| 400 | `oklch(0.795 0.145 80.00)` | `#FBBF24` | Chart series, sparkline | 1.59:1 | 10.5:1 |
| **500** | **`oklch(0.740 0.165 72.00)`** | **`#F59E0B`** | **Status dot on colored bg, event accent** | **1.93:1** | **8.65:1** |
| 600 | `oklch(0.650 0.155 60.00)` | `#D97706` | Icon on white (3:1+ non-text) | 3.08:1 | 5.42:1 |
| **700** | **`oklch(0.560 0.140 55.00)`** | **`#B45309`** | **Text on white — primary warning text color** | **4.70:1 AA** | **3.55:1** |
| 800 | `oklch(0.480 0.115 50.00)` | `#92400E` | Badge text on warning-100 background | 6.20:1 AAA | 2.69:1 |
| 900 | `oklch(0.400 0.090 48.00)` | `#78350F` | High-contrast warning text | 8.50:1 AAA | 1.96:1 |
| 950 | `oklch(0.320 0.065 45.00)` | `#5C2D0E` | Maximum contrast warning | 11.5:1 AAA | 1.45:1 |

### 1.6 Error Red Scale

Used for: failed, overdue, violation, emergency, urgent, critical, destructive actions.

| Step | OKLCH Value | Hex Fallback | Usage | Contrast vs White | Contrast vs Dark |
|------|-------------|-------------|-------|-------------------|-----------------|
| 50 | `oklch(0.971 0.013 25.00)` | `#FEF2F2` | Error background tint | 1.05:1 | 15.9:1 |
| 100 | `oklch(0.936 0.032 25.00)` | `#FEE2E2` | Error badge background | 1.11:1 | 15.0:1 |
| 200 | `oklch(0.885 0.060 25.00)` | `#FECACA` | Light error fill | 1.25:1 | 13.4:1 |
| 300 | `oklch(0.808 0.110 25.00)` | `#FCA5A5` | Decorative error accent | 1.58:1 | 10.6:1 |
| 400 | `oklch(0.710 0.165 25.00)` | `#F87171` | Chart series, decorative | 2.28:1 | 7.32:1 |
| **500** | **`oklch(0.630 0.215 25.00)`** | **`#EF4444`** | **Status dot, card accent border, destructive icon** | **3.15:1** | **5.29:1** |
| 600 | `oklch(0.560 0.210 25.00)` | `#DC2626` | Destructive button background | 4.52:1 AA | 3.69:1 |
| **700** | **`oklch(0.505 0.190 25.00)`** | **`#B91C1C`** | **Error text on white** | **5.74:1 AA** | **2.91:1** |
| 800 | `oklch(0.440 0.155 25.00)` | `#991B1B` | Badge text on error-100 background | 7.80:1 AAA | 2.14:1 |
| 900 | `oklch(0.370 0.120 25.00)` | `#7F1D1D` | High-contrast error text | 10.5:1 AAA | 1.59:1 |
| 950 | `oklch(0.300 0.085 25.00)` | `#5C0F0F` | Maximum contrast error | 14.1:1 AAA | 1.18:1 |

### 1.7 Info Blue Scale

Used for: informational notices, new items, in-progress states, general-purpose blue accents distinct from primary interactive blue.

| Step | OKLCH Value | Hex Fallback | Usage | Contrast vs White | Contrast vs Dark |
|------|-------------|-------------|-------|-------------------|-----------------|
| 50 | `oklch(0.970 0.014 240.00)` | `#EFF6FF` | Info background tint | 1.05:1 | 15.9:1 |
| 100 | `oklch(0.932 0.033 240.00)` | `#DBEAFE` | Info badge background | 1.12:1 | 14.9:1 |
| 200 | `oklch(0.880 0.060 240.00)` | `#BFDBFE` | Light info fill | 1.26:1 | 13.2:1 |
| 300 | `oklch(0.805 0.100 240.00)` | `#93C5FD` | Decorative info accent | 1.59:1 | 10.5:1 |
| 400 | `oklch(0.705 0.155 240.00)` | `#60A5FA` | Chart series, decorative icons | 2.33:1 | 7.16:1 |
| **500** | **`oklch(0.600 0.210 240.00)`** | **`#3B82F6`** | **Status dot, card accent, event type border** | **3.13:1** | **5.33:1** |
| 600 | `oklch(0.545 0.222 262.88)` | `#2563EB` | Info text on white (matches primary for consistency) | 5.10:1 AA | 3.27:1 |
| **700** | **`oklch(0.480 0.200 262.88)`** | **`#1D4ED8`** | **Badge text on info-100 background** | **6.10:1 AAA** | **2.73:1** |
| 800 | `oklch(0.415 0.170 262.88)` | `#1E40AF` | High-emphasis info text | 8.20:1 AAA | 2.03:1 |
| 900 | `oklch(0.345 0.130 262.88)` | `#1E3A8A` | Maximum emphasis | 11.0:1 AAA | 1.52:1 |
| 950 | `oklch(0.280 0.095 262.88)` | `#172554` | Deepest info | 14.5:1 AAA | 1.15:1 |

### 1.8 Neutral Gray Scale

The foundation palette. Used for text, backgrounds, borders, and all non-semantic UI.

| Step | OKLCH Value | Hex Fallback | Role | Contrast vs White |
|------|-------------|-------------|------|-------------------|
| 0 | `oklch(1.000 0.000 0)` | `#FFFFFF` | `--bg-primary` — Page background, cards | — |
| 50 | `oklch(0.985 0.002 260)` | `#F9FAFB` | Subtle alternate row, empty area | 1.02:1 |
| 100 | `oklch(0.968 0.003 260)` | `#F5F5F7` | `--bg-secondary` — Sidebar, section bg | 1.06:1 |
| 200 | `oklch(0.935 0.005 260)` | `#E8E8ED` | `--bg-tertiary` — Hover on secondary | 1.15:1 |
| 300 | `oklch(0.900 0.005 260)` | `#D1D1D6` | Disabled input border, scroll track | 1.30:1 |
| 400 | `oklch(0.820 0.005 260)` | `#AEAEB2` | `--text-tertiary` — Placeholder, disabled | 1.74:1 |
| 500 | `oklch(0.710 0.005 260)` | `#8E8E93` | Subtle icons, separators | 2.62:1 |
| 600 | `oklch(0.600 0.005 260)` | `#6E6E73` | `--text-secondary` — Labels, timestamps | 4.08:1 AA-large |
| 700 | `oklch(0.530 0.005 260)` | `#545458` | `--text-secondary` enhanced for small text | 5.52:1 AA |
| 800 | `oklch(0.420 0.005 260)` | `#3A3A3C` | Heavy emphasis secondary | 8.52:1 AAA |
| 900 | `oklch(0.300 0.005 260)` | `#1D1D1F` | `--text-primary` — Headlines, body | 14.5:1 AAA |
| 950 | `oklch(0.220 0.005 260)` | `#111114` | Maximum text contrast | 17.4:1 AAA |

### 1.9 Event Type Accent Colors (OKLCH)

These colors are used ONLY for decorative purposes: card left-border accents, status dots on colored backgrounds, and calendar event blocks. They are NEVER used for text on white.

| Event Type | OKLCH Value | Hex Fallback | Hue |
|-----------|-------------|-------------|-----|
| Package | `oklch(0.600 0.210 240.00)` | `#3B82F6` | Blue 240 |
| Visitor | `oklch(0.620 0.178 163.00)` | `#10B981` | Green 163 |
| Incident | `oklch(0.630 0.215 25.00)` | `#EF4444` | Red 25 |
| Cleaning | `oklch(0.640 0.140 200.00)` | `#06B6D4` | Cyan 200 |
| Key/FOB | `oklch(0.580 0.180 295.00)` | `#8B5CF6` | Purple 295 |
| Pass-On Note | `oklch(0.740 0.165 72.00)` | `#F59E0B` | Amber 72 |
| Maintenance | `oklch(0.680 0.190 45.00)` | `#F97316` | Orange 45 |
| Parking | `oklch(0.560 0.210 280.00)` | `#6366F1` | Indigo 280 |

### 1.10 Three Display Modes

#### Normal Mode (Light)

The default mode. All tokens defined above apply as-is. White backgrounds, dark text, colored accents.

```css
:root {
  color-scheme: light;

  /* Backgrounds */
  --bg-primary: oklch(1.000 0.000 0);           /* #FFFFFF */
  --bg-secondary: oklch(0.968 0.003 260);       /* #F5F5F7 */
  --bg-tertiary: oklch(0.935 0.005 260);        /* #E8E8ED */

  /* Text */
  --text-primary: oklch(0.300 0.005 260);       /* #1D1D1F */
  --text-secondary: oklch(0.600 0.005 260);     /* #6E6E73 */
  --text-tertiary: oklch(0.820 0.005 260);      /* #AEAEB2 — decorative only */
  --text-disabled: oklch(0.820 0.005 260);      /* Same as tertiary */

  /* Borders */
  --border-subtle: oklch(0.900 0.005 260);      /* #E5E5EA */
  --border-focus: oklch(0.546 0.245 262.88);    /* #0071E3 — primary accent */

  /* Interactive */
  --accent: oklch(0.546 0.245 262.88);          /* #0071E3 */
  --accent-hover: oklch(0.496 0.230 262.88);    /* #005BBB */
  --accent-pressed: oklch(0.440 0.200 262.88);  /* #004A99 */
  --accent-subtle: oklch(0.546 0.245 262.88 / 0.08); /* 8% opacity primary */

  /* Semantic — text-safe variants (for text/icons on white) */
  --color-success: oklch(0.480 0.132 163.00);   /* #047857 — 5.36:1 */
  --color-warning: oklch(0.560 0.140 55.00);    /* #B45309 — 4.70:1 */
  --color-error: oklch(0.560 0.210 25.00);      /* #DC2626 — 4.52:1 */
  --color-info: oklch(0.545 0.222 262.88);      /* #2563EB — 5.10:1 */

  /* Semantic — badge pairs */
  --badge-success-bg: oklch(0.935 0.040 163.00);  /* #D1FAE5 */
  --badge-success-text: oklch(0.405 0.108 163.00); /* #065F46 — 7.4:1 */
  --badge-warning-bg: oklch(0.948 0.035 80.00);   /* #FEF3C7 */
  --badge-warning-text: oklch(0.480 0.115 50.00);  /* #92400E — 6.2:1 */
  --badge-error-bg: oklch(0.936 0.032 25.00);     /* #FEE2E2 */
  --badge-error-text: oklch(0.440 0.155 25.00);    /* #991B1B — 7.8:1 */
  --badge-info-bg: oklch(0.932 0.033 240.00);     /* #DBEAFE */
  --badge-info-text: oklch(0.480 0.200 262.88);    /* #1D4ED8 — 6.1:1 */
  --badge-pending-bg: oklch(0.968 0.003 260);     /* #F3F4F6 */
  --badge-pending-text: oklch(0.420 0.005 260);    /* #374151 — 9.0:1 */

  /* Status dots and card accents (decorative — no text contrast requirement) */
  --status-success: oklch(0.620 0.178 163.00);    /* #10B981 */
  --status-success-bg: oklch(0.620 0.178 163.00 / 0.10);
  --status-warning: oklch(0.740 0.165 72.00);     /* #F59E0B */
  --status-warning-bg: oklch(0.740 0.165 72.00 / 0.10);
  --status-error: oklch(0.630 0.215 25.00);       /* #EF4444 */
  --status-error-bg: oklch(0.630 0.215 25.00 / 0.10);
  --status-info: oklch(0.600 0.210 240.00);       /* #3B82F6 */
  --status-info-bg: oklch(0.600 0.210 240.00 / 0.10);
}
```

#### Dark Mode (Future-Proofed)

Defined now for implementation later. See Section 11 for full specification.

```css
@media (prefers-color-scheme: dark) {
  :root[data-theme="auto"], :root[data-theme="dark"] {
    color-scheme: dark;

    --bg-primary: oklch(0.220 0.005 260);         /* #1C1C1E */
    --bg-secondary: oklch(0.270 0.005 260);       /* #2C2C2E */
    --bg-tertiary: oklch(0.320 0.005 260);        /* #3A3A3C */

    --text-primary: oklch(0.968 0.003 260);       /* #F5F5F7 */
    --text-secondary: oklch(0.820 0.005 260);     /* #AEAEB2 */
    --text-tertiary: oklch(0.600 0.005 260);      /* #636366 */

    --border-subtle: oklch(0.340 0.005 260);      /* #38383A */
    --accent: oklch(0.610 0.230 262.88);          /* #0A84FF */
  }
}
```

#### High Contrast Mode (WCAG AAA)

For users who enable increased contrast via OS settings or a Concierge setting toggle. Every text element meets 7:1 minimum contrast ratio (WCAG AAA).

```css
@media (prefers-contrast: more) {
  :root, :root[data-contrast="high"] {
    /* Text — all AAA on white */
    --text-primary: oklch(0.220 0.005 260);       /* #111114 — 17.4:1 */
    --text-secondary: oklch(0.420 0.005 260);     /* #3A3A3C — 8.52:1 */
    --text-tertiary: oklch(0.530 0.005 260);      /* #545458 — 5.52:1 (upgraded to readable) */

    /* Semantic text — all 7:1+ */
    --color-success: oklch(0.405 0.108 163.00);   /* #065F46 — 7.4:1 */
    --color-warning: oklch(0.400 0.090 48.00);    /* #78350F — 8.5:1 */
    --color-error: oklch(0.440 0.155 25.00);      /* #991B1B — 7.8:1 */
    --color-info: oklch(0.480 0.200 262.88);      /* #1D4ED8 — 6.1:1 → upgraded */

    /* Borders thickened to 2px and darkened */
    --border-subtle: oklch(0.710 0.005 260);      /* #8E8E93 — clearly visible */
    --border-focus: oklch(0.440 0.200 262.88);    /* #004A99 — very visible ring */

    /* Focus ring wider: 4px instead of 3px */
    --focus-ring-width: 4px;
    --focus-ring-offset: 2px;
  }
}
```

### 1.11 Colorblind-Safe Palette

For charts and any context where color alone distinguishes categories, use this optimized palette. These colors remain distinguishable under Protanopia (red-blind), Deuteranopia (green-blind), and Tritanopia (blue-blind).

| Slot | Name | OKLCH Value | Hex | Protanopia | Deuteranopia | Tritanopia |
|------|------|-------------|-----|-----------|-------------|-----------|
| 1 | Blue | `oklch(0.546 0.245 262.88)` | `#0071E3` | Distinct | Distinct | Distinct |
| 2 | Orange | `oklch(0.680 0.190 45.00)` | `#F97316` | Distinct (dark yellow) | Distinct (yellow) | Distinct (red-shift) |
| 3 | Purple | `oklch(0.480 0.150 310.00)` | `#7C3AED` | Distinct (blue-shift) | Distinct (blue-shift) | Distinct |
| 4 | Teal | `oklch(0.640 0.100 200.00)` | `#0891B2` | Distinct | Distinct | Merges with blue |
| 5 | Magenta | `oklch(0.550 0.200 350.00)` | `#DB2777` | Distinct (dark) | Distinct (dark) | Distinct |
| 6 | Lime | `oklch(0.750 0.160 130.00)` | `#65A30D` | Distinct (yellow) | Distinct (gold) | Distinct |

**Chart Accessibility Rules:**

1. Never rely on color alone. Always combine with: shape (different point markers), pattern (stripes, dots for fills), or direct labels.
2. When displaying more than 3 series, add pattern fills (`repeating-linear-gradient`) in addition to color.
3. All chart legends must include a swatch + text label.
4. Interactive charts must show detailed tooltips on hover (value, series name, percentage).
5. Print mode: patterns must work in grayscale. See Section 12.

### 1.12 Generating New Colors

If new event types or status categories are added, generate OKLCH colors using these rules:

1. **Choose a hue** that is at least 30 degrees away from existing hues on the OKLCH hue wheel.
2. **Lightness for decorative use (dots, borders)**: L = 0.55-0.65, C = 0.15-0.22
3. **Lightness for text on white**: L must yield 4.5:1+ contrast (generally L < 0.55)
4. **Lightness for badge background**: L > 0.92 (very light tint)
5. **Lightness for badge text**: L < 0.45 (dark enough for 6:1+ on the tint)
6. **Test**: Always verify with a WCAG contrast checker AND a colorblind simulator before committing a new color.

---


## 2. Extended Typography System

### 2.1 Font Loading Strategy

Concierge uses a three-tier font stack optimized for fast rendering and visual refinement:

```css
/* Tier 1: Display headings (H1, H2, hero text) */
--font-display: "Inter Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Tier 2: All other text (H3+, body, labels, captions) */
--font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Tier 3: Monospace (unit numbers, tracking IDs, timestamps, license plates) */
--font-mono: "JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Mono", monospace;
```

**Loading order** (via `@font-face` with `font-display: swap`):

1. Inter (400, 500, 600, 700) — loads first, covers 95% of the UI
2. Inter Display (600, 700) — loads second, upgrades H1/H2 rendering
3. JetBrains Mono (400, 500) — loads third, only needed for monospace contexts

**Performance**: Subset to Latin + Latin Extended. Estimated total: ~180KB WOFF2. Preload the Inter 400 weight to eliminate FOIT on first paint.

```html
<link rel="preload" href="/fonts/inter-v13-latin-400.woff2" as="font" type="font/woff2" crossorigin>
```

### 2.2 Why Inter Display for Headings

Inter Display is the optical-size variant of Inter, optimized for use at larger sizes (20px+). Differences from regular Inter:

- **Tighter letter-spacing** at large sizes (feels more refined, less "ransom note")
- **Thinner strokes on counters** for improved legibility at display sizes
- **Slightly different glyph shapes** that look better when rendered large

This follows the approach used by Linear, which uses Inter Display for their heading hierarchy. The visual difference is subtle but creates a "craft" feeling that distinguishes premium software.

**Fallback**: If Inter Display fails to load, Inter renders identically at functional level. No layout shift occurs.

### 2.3 Complete Type Scale

#### Display & Heading Styles

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Text Transform | Usage |
|-------|-------------|------|--------|-------------|----------------|----------------|-------|
| `--type-display-xl` | Inter Display | 48px | 700 | 52px (1.083) | -0.6px | none | Marketing hero, onboarding splash |
| `--type-display` | Inter Display | 34px | 700 | 40px (1.176) | -0.4px | none | Page titles (Dashboard, Reports, Packages) |
| `--type-title-1` | Inter Display | 28px | 700 | 34px (1.214) | -0.3px | none | Section headers, modal titles |
| `--type-title-2` | Inter | 22px | 600 | 28px (1.273) | -0.2px | none | Card titles, widget headings |
| `--type-title-3` | Inter | 20px | 600 | 24px (1.200) | -0.1px | none | Sub-section headers, sidebar group headers |
| `--type-headline` | Inter | 17px | 600 | 22px (1.294) | 0 | none | Table headers, label emphasis, bold callouts |

#### Body & UI Styles

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Text Transform | Usage |
|-------|-------------|------|--------|-------------|----------------|----------------|-------|
| `--type-body` | Inter | 15px | 400 | 22px (1.467) | 0 | none | Primary body text, form descriptions |
| `--type-body-medium` | Inter | 15px | 500 | 22px (1.467) | 0 | none | Button labels, nav items, selected states |
| `--type-callout` | Inter | 14px | 400 | 20px (1.429) | 0 | none | Secondary info, metadata, table cells |
| `--type-callout-medium` | Inter | 14px | 500 | 20px (1.429) | 0 | none | Active filter chips, tab labels |
| `--type-caption` | Inter | 12px | 500 | 16px (1.333) | 0.2px | none | Timestamps, badge text, helper text |
| `--type-caption-strong` | Inter | 12px | 600 | 16px (1.333) | 0.2px | none | Emphasis within captions |
| `--type-overline` | Inter | 11px | 600 | 14px (1.273) | 0.8px | uppercase | Section labels in sidebar, category tags |
| `--type-micro` | Inter | 10px | 500 | 14px (1.400) | 0.4px | none | Absolute minimum. Badge counts, tooltip hints |

#### Monospace Styles

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|-------------|------|--------|-------------|----------------|-------|
| `--type-mono` | JetBrains Mono | 13px | 400 | 18px (1.385) | 0 | Reference numbers (PKG-2026-0341), tracking IDs |
| `--type-mono-small` | JetBrains Mono | 12px | 400 | 16px (1.333) | 0 | License plates, key serial numbers |
| `--type-mono-large` | JetBrains Mono | 15px | 500 | 22px (1.467) | 0 | Unit numbers in headings (#1205) |

#### KPI / Metric Styles

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|-------------|------|--------|-------------|----------------|-------|
| `--type-kpi-value` | Inter Display | 34px | 700 | 40px (1.176) | -0.4px | Dashboard stat numbers (47, 1,298) |
| `--type-kpi-value-large` | Inter Display | 48px | 700 | 52px (1.083) | -0.6px | Single-metric hero display |
| `--type-kpi-label` | Inter | 12px | 500 | 16px (1.333) | 0.4px | KPI card labels (Unreleased Packages) |
| `--type-kpi-trend` | Inter | 12px | 600 | 16px (1.333) | 0 | Trend indicator (+12% vs last week) |

### 2.4 Responsive Type Scale

Typography sizes reduce at smaller breakpoints to maintain readability and proportional hierarchy. The scale uses a multiplier applied to the base desktop sizes.

| Breakpoint | Multiplier | Display | Title 1 | Title 2 | Title 3 | Body | Caption |
|-----------|-----------|---------|---------|---------|---------|------|---------|
| Desktop XL (>1440px) | 1.0x | 34px | 28px | 22px | 20px | 15px | 12px |
| Desktop (1280-1440px) | 1.0x | 34px | 28px | 22px | 20px | 15px | 12px |
| Tablet (768-1279px) | 0.92x | 31px | 26px | 20px | 18px | 15px | 12px |
| Mobile (<768px) | 0.85x | 28px | 24px | 19px | 17px | 15px | 12px |

**Rules:**
- Body text (15px) and caption (12px) NEVER reduce below their desktop sizes. Readability is non-negotiable.
- Only Display, Title 1, Title 2, and Title 3 scale down.
- KPI values scale: 34px desktop → 28px tablet → 24px mobile.
- The `--type-display-xl` (48px) reduces to 40px on tablet and 34px on mobile.

**CSS Implementation:**

```css
/* Desktop (default) */
:root {
  --type-scale: 1;
}

/* Tablet */
@media (max-width: 1279px) {
  :root {
    --type-scale: 0.92;
  }
}

/* Mobile */
@media (max-width: 767px) {
  :root {
    --type-scale: 0.85;
  }
}

.display {
  font-size: calc(34px * var(--type-scale));
  line-height: calc(40px * var(--type-scale));
}
```

### 2.5 Paragraph Typography

Long-form text (announcements, descriptions, emergency procedures) needs special treatment for readability.

| Property | Value | Reason |
|----------|-------|--------|
| `max-width` | 680px (approximately 65-75 characters per line) | Optimal reading line length per typographic research |
| `font-size` | 15px (`--type-body`) | Comfortable reading size on screens |
| `line-height` | 24px (1.6) | Generous leading for body text |
| `margin-bottom` between paragraphs | 16px (`--space-4`) | Clear paragraph separation |
| `color` | `--text-primary` (#1D1D1F) | Maximum readability |
| `font-weight` | 400 | Regular weight for sustained reading |

**Paragraph CSS:**

```css
.prose {
  max-width: 680px;
  font: 400 15px/1.6 var(--font-body);
  color: var(--text-primary);
}

.prose p + p {
  margin-top: 16px;
}

.prose h2 {
  font: 600 22px/1.273 var(--font-body);
  margin-top: 32px;
  margin-bottom: 12px;
}

.prose h3 {
  font: 600 20px/1.2 var(--font-body);
  margin-top: 24px;
  margin-bottom: 8px;
}

.prose ul, .prose ol {
  padding-left: 24px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.prose li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.prose li::marker {
  color: var(--text-secondary);
}
```

### 2.6 List Typography

| List Type | Bullet/Number Style | Indent | Item Spacing | Nesting |
|-----------|-------------------|--------|-------------|---------|
| Unordered (top-level) | `disc` (filled circle), color: `--text-secondary` | 24px left padding | 6px between items | Max 3 levels deep |
| Unordered (level 2) | `circle` (hollow circle) | 24px additional indent | 4px between items | |
| Unordered (level 3) | `square` (filled square) | 24px additional indent | 4px between items | |
| Ordered (top-level) | Decimal, weight 600 | 24px left padding | 8px between items | Max 3 levels deep |
| Ordered (level 2) | Lower-alpha (a, b, c) | 24px additional indent | 4px between items | |
| Checklist | Custom checkbox icon (16px) | 28px left padding | 8px between items | No nesting |

**Emergency Procedure Lists** (Section 19.17 of v1) use ordered lists with:
- Number weight: 700 (bold step numbers)
- Item text weight: 400
- Step spacing: 12px (larger for scanability during emergencies)
- Number color: `--color-error` for fire procedures, `--text-primary` for others

### 2.7 Typography Rules Summary

1. **Three sizes maximum per card.** A card might use Headline (title), Body (description), and Caption (timestamp). Never four.
2. **Inter Display only for H1 and H2 levels.** Everything H3 and below uses regular Inter. Mixing Inter Display into body text looks wrong.
3. **Bold (600-700) is for scanning, not emphasis.** If a user needs to *read* something carefully, keep it 400 weight. Bold text is for visual anchoring during rapid scanning.
4. **Monospace is surgical.** Only for: unit numbers (#1205), tracking IDs (PKG-2026-0341), license plates (ABCD 123), key serial numbers (FOB-4521), and timestamps in activity logs. Never for labels, headings, or body text.
5. **Never use more than 2 font weights on a single line.** A label + value pair can be `500 + 400` or `600 + 400`, but never `700 + 600 + 400` on one line.
6. **Uppercase is reserved for Overline.** The only place uppercase text appears is in section labels (sidebar categories: "OVERVIEW", "OPERATIONS") and filter tags. Never uppercase a heading, button label, or error message.
7. **Letter-spacing is negative for large text, positive for small.** Display (-0.4px) through Body (0) to Overline (+0.8px). This follows the optical compensation principle.

---


## 3. Complete Icon Library Mapping

### 3.1 Icon System Overview

**Library**: Lucide Icons (https://lucide.dev/)
**Style**: Outlined stroke icons, never filled.
**Stroke width**: 1.5px for all sizes (maintains visual consistency across scales).
**Color**: Icons inherit text color via `currentColor`. The only exceptions are event-type accent colors used decoratively.

### 3.2 Navigation Icons (Sidebar)

| Module | Lucide Icon Name | Size | Color Context | Notes |
|--------|-----------------|------|---------------|-------|
| Dashboard | `LayoutDashboard` | 20px | `--text-secondary` / `--accent` when active | Primary landing page |
| Units & Residents | `Building2` | 20px | `--text-secondary` / `--accent` when active | Building icon, not house |
| Amenities | `CalendarDays` | 20px | `--text-secondary` / `--accent` when active | Calendar with dots |
| Security | `ShieldCheck` | 20px | `--text-secondary` / `--accent` when active | Shield with checkmark |
| Packages | `Package` | 20px | `--text-secondary` / `--accent` when active | Box icon |
| Service Requests | `Wrench` | 20px | `--text-secondary` / `--accent` when active | Maintenance tool |
| Announcements | `Megaphone` | 20px | `--text-secondary` / `--accent` when active | Broadcast horn |
| Events | `CalendarHeart` | 20px | `--text-secondary` / `--accent` when active | Distinguishes from Amenities calendar |
| Marketplace | `Store` | 20px | `--text-secondary` / `--accent` when active | Storefront |
| Library | `FolderOpen` | 20px | `--text-secondary` / `--accent` when active | Open folder for documents |
| Surveys | `ClipboardList` | 20px | `--text-secondary` / `--accent` when active | Clipboard with checklist |
| Reports | `BarChart3` | 20px | `--text-secondary` / `--accent` when active | Bar chart |
| User Management | `Users` | 20px | `--text-secondary` / `--accent` when active | Multiple people |
| Logs | `ScrollText` | 20px | `--text-secondary` / `--accent` when active | Log/scroll icon |
| Settings | `Settings` | 20px | `--text-secondary` / `--accent` when active | Gear |
| Training | `GraduationCap` | 20px | `--text-secondary` / `--accent` when active | Learning module |
| Community | `MessageCircle` | 20px | `--text-secondary` / `--accent` when active | Discussion/forum |
| Parking | `CarFront` | 20px | `--text-secondary` / `--accent` when active | Vehicle management |
| Emergency Procedures | `Siren` | 20px | `--color-error` always | Always red to signal urgency |

### 3.3 Action Icons (Buttons, Toolbars, Menus)

| Action | Lucide Icon Name | Size | Color Context | Usage |
|--------|-----------------|------|---------------|-------|
| Add / Create | `Plus` | 16-20px | `--accent` or white (on primary button) | "+ Log Package", "+ New Request" |
| Edit | `Pencil` | 16px | `--text-secondary` | Edit buttons, inline edit triggers |
| Delete / Remove | `Trash2` | 16px | `--color-error` | Destructive actions |
| Save | `Save` | 16px | white (on primary button) | Form save actions |
| Cancel | `X` | 16px | `--text-secondary` | Close modals, dismiss items |
| Close | `X` | 20px | `--text-secondary` | Modal close, panel close |
| Search | `Search` | 20px | `--text-tertiary` | Search input prefix icon |
| Filter | `SlidersHorizontal` | 16px | `--text-secondary` | Filter toggles, advanced filters |
| Sort ascending | `ArrowUp` | 14px | `--text-secondary` | Table column sort indicator |
| Sort descending | `ArrowDown` | 14px | `--text-secondary` | Table column sort indicator |
| Expand / Chevron down | `ChevronDown` | 16px | `--text-secondary` | Dropdowns, accordion triggers |
| Collapse / Chevron up | `ChevronUp` | 16px | `--text-secondary` | Collapse accordions |
| Chevron right | `ChevronRight` | 16px | `--text-secondary` | "View all >" links, breadcrumb separator |
| Chevron left | `ChevronLeft` | 16px | `--text-secondary` | Back navigation, calendar previous |
| More options | `MoreHorizontal` | 16px | `--text-secondary` | Row action menus (three dots) |
| More vertical | `MoreVertical` | 16px | `--text-secondary` | Card action menus |
| Download | `Download` | 16px | `--text-secondary` | File download, export |
| Upload | `Upload` | 16px | `--text-secondary` | File upload zones |
| Print | `Printer` | 16px | `--text-secondary` | Print work orders, reports |
| Export | `FileDown` | 16px | `--text-secondary` | Export to Excel/PDF |
| Copy | `Copy` | 16px | `--text-secondary` | Copy to clipboard |
| Link | `Link` | 16px | `--accent` | Insert hyperlink, copy link |
| External link | `ExternalLink` | 14px | `--text-secondary` | Opens in new tab indicator |
| Refresh | `RefreshCw` | 16px | `--text-secondary` | Reload data |
| Undo | `Undo2` | 16px | `--text-secondary` | Undo action in toasts |
| Drag handle | `GripVertical` | 16px | `--text-tertiary` | Drag-and-drop reorder |
| Pin | `Pin` | 16px | `--accent` | Pin shift notes, pin announcements |
| Archive | `Archive` | 16px | `--text-secondary` | Archive items |
| Send | `Send` | 16px | white (on primary button) | Send messages, publish |
| Reply | `Reply` | 16px | `--text-secondary` | Reply to comments |
| Assign | `UserPlus` | 16px | `--text-secondary` | Assign staff to ticket |
| Unassign | `UserMinus` | 16px | `--text-secondary` | Remove assignment |
| Lock | `Lock` | 16px | `--text-tertiary` | Permission denied indicator |
| Unlock | `Unlock` | 16px | `--color-success` | Granted access |
| Eye (show) | `Eye` | 16px | `--text-secondary` | Password reveal, preview |
| Eye off (hide) | `EyeOff` | 16px | `--text-secondary` | Password hide |
| Calendar | `Calendar` | 16px | `--text-secondary` | Date picker trigger |
| Clock | `Clock` | 16px | `--text-secondary` | Time picker trigger |
| Camera | `Camera` | 20px | `--text-secondary` | Photo capture |
| Image | `Image` | 16px | `--text-secondary` | Image thumbnail indicator |
| File | `File` | 16px | `--text-secondary` | Generic file |
| FileText | `FileText` | 16px | `--text-secondary` | Document/PDF |
| Maximize | `Maximize2` | 16px | `--text-secondary` | Full-screen toggle |
| Minimize | `Minimize2` | 16px | `--text-secondary` | Exit full-screen |

### 3.4 Status Icons

| Status | Lucide Icon Name | Size | Color | Usage |
|--------|-----------------|------|-------|-------|
| Success / Resolved | `CheckCircle2` | 16-20px | `--color-success` | Confirmation, completed items |
| Check (simple) | `Check` | 14px | `--color-success` | Inline validation pass, checkbox |
| Warning | `AlertTriangle` | 16-20px | `--color-warning` | Expiring items, attention needed |
| Error / Failed | `AlertCircle` | 16-20px | `--color-error` | Failed operations, validation errors |
| Info | `Info` | 16-20px | `--color-info` | Informational tooltips, help text |
| Pending / Loading | `Loader2` | 16-20px | `--text-secondary` | Animated spin. CSS: `animation: spin 1s linear infinite` |
| Blocked | `Ban` | 16px | `--color-error` | Banned, blocked items |
| Scheduled | `CalendarClock` | 16px | `--color-info` | Scheduled for future |
| Draft | `FileEdit` | 16px | `--text-tertiary` | Draft items not yet published |
| Expired | `TimerOff` | 16px | `--color-error` | Expired permits, past-due |
| Active | `Zap` | 16px | `--color-success` | Currently active/live |

### 3.5 Module-Specific Icons

#### Package Module

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Package generic | `Package` | 20-24px | Default for any package |
| Package check-in | `PackagePlus` | 20px | Check-in action |
| Package release | `PackageCheck` | 20px | Release action |
| Package search | `PackageSearch` | 20px | Package lookup |
| Package open | `PackageOpen` | 24px | Package detail view header |
| Perishable flag | `Snowflake` | 14px | Perishable package indicator |
| Oversized flag | `Maximize` | 14px | Oversized package indicator |

#### Carrier Icons (Special Treatment)

Courier identification uses branded color chips rather than Lucide icons. Each carrier gets a small (24x24px) colored square with an abbreviation:

| Carrier | Abbreviation | Background | Text |
|---------|-------------|-----------|------|
| Amazon | AMZ | `#FF9900` | `#000000` |
| FedEx | FDX | `#4D148C` | `#FFFFFF` |
| UPS | UPS | `#351C15` | `#FFB500` |
| Canada Post | CP | `#DA291C` | `#FFFFFF` |
| Purolator | PUR | `#D71920` | `#FFFFFF` |
| DHL | DHL | `#FFCC00` | `#D40511` |
| Other/Unknown | `?` | `--bg-secondary` | `--text-secondary` |

These carrier chips are 24x24px with 4px border-radius, displayed inline in package tables and cards.

#### Security Module

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Visitor | `UserCheck` | 20px | Visitor logging |
| Key checkout | `Key` | 20px | Key management |
| Key return | `KeyRound` | 20px | Key check-in |
| FOB/Access card | `CreditCard` | 16px | FOB tracking |
| Buzzer | `Phone` | 16px | Buzzer code management |
| Parking permit | `ParkingCircle` | 20px | Visitor parking |
| Violation | `CircleSlash` | 20px | Parking violation |
| Incident | `AlertOctagon` | 20px | Security incident |
| Fire log | `Flame` | 20px | Fire log entry — color: `--color-error` |
| Noise complaint | `Volume2` | 20px | Noise log entry |
| Inspection | `ClipboardCheck` | 20px | Inspection log entry |
| CCTV / Camera | `Cctv` | 20px | Camera feed links |
| Patrol | `Footprints` | 20px | Security patrol log |
| Shift handoff | `ArrowRightLeft` | 20px | Shift note / handoff |

#### Maintenance Module

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Service request | `Wrench` | 20px | Generic request |
| Plumbing | `Droplets` | 16px | Category icon |
| Electrical | `Zap` | 16px | Category icon |
| HVAC | `Thermometer` | 16px | Category icon |
| Pest control | `Bug` | 16px | Category icon |
| General | `HelpCircle` | 16px | Category icon |
| Noise | `Volume2` | 16px | Category icon |
| Common area | `DoorOpen` | 16px | Category icon |
| Work order | `FileText` | 20px | Printed work order |
| Priority high | `ArrowUp` | 14px | Red, inline with priority text |
| Priority medium | `Minus` | 14px | Yellow, inline |
| Priority low | `ArrowDown` | 14px | Blue, inline |
| Entry authorized | `DoorOpen` | 16px | Suite entry permission |
| Equipment | `Cog` | 16px | Linked equipment |
| Vendor | `Briefcase` | 16px | Assigned vendor |

#### Amenity Module

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Party room | `PartyPopper` | 20px | Amenity type icon |
| Gym | `Dumbbell` | 20px | Amenity type icon |
| Pool | `Waves` | 20px | Amenity type icon |
| BBQ area | `Flame` | 20px | Amenity type icon |
| Guest suite | `BedDouble` | 20px | Amenity type icon |
| Tennis court | `Target` | 20px | Amenity type icon |
| Yoga studio | `Heart` | 20px | Amenity type icon |
| Rooftop | `Sunset` | 20px | Amenity type icon |
| Sauna | `Thermometer` | 20px | Amenity type icon |
| Theater/Lounge | `Tv` | 20px | Amenity type icon |
| Booking confirmed | `CalendarCheck` | 16px | Status icon |
| Booking pending | `CalendarClock` | 16px | Status icon |
| Booking cancelled | `CalendarX` | 16px | Status icon |

#### Community & Communication

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Announcement | `Megaphone` | 20px | Announcement creation and list |
| Emergency SMS | `MessageSquareWarning` | 20px | Emergency broadcast — color: `--color-error` |
| Email sent | `Mail` | 16px | Email notification indicator |
| Push sent | `Smartphone` | 16px | Push notification indicator |
| SMS sent | `MessageSquare` | 16px | SMS notification indicator |
| Read receipt | `MailCheck` | 16px | Email opened |
| Classified ad | `Tag` | 20px | Marketplace listing |
| Idea board | `Lightbulb` | 20px | Community ideas |
| Forum/Discussion | `MessageCircle` | 20px | Community discussion |
| Event RSVP going | `ThumbsUp` | 16px | RSVP positive |
| Event RSVP maybe | `HelpCircle` | 16px | RSVP maybe |
| Event RSVP not going | `ThumbsDown` | 16px | RSVP negative |

#### Reports & Data

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Report general | `BarChart3` | 20px | Report module |
| Line chart | `TrendingUp` | 16px | Trend report type |
| Pie/donut chart | `PieChart` | 16px | Distribution report type |
| Table report | `Table2` | 16px | Tabular report type |
| Excel export | `FileSpreadsheet` | 16px | Green tint icon |
| PDF export | `FileText` | 16px | Red tint icon |
| Date range | `CalendarRange` | 16px | Date filter |
| Trend up | `TrendingUp` | 14px | `--color-success` — positive KPI trend |
| Trend down | `TrendingDown` | 14px | `--color-error` — negative KPI trend |
| Trend flat | `Minus` | 14px | `--text-secondary` — no change |

#### Settings & Admin

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| Building settings | `Building` | 20px | Building configuration |
| User settings | `UserCog` | 20px | User management |
| Role settings | `Shield` | 20px | Role/permission management |
| Notification settings | `BellRing` | 20px | Notification configuration |
| Integration | `Plug` | 20px | Third-party integrations |
| API key | `KeyRound` | 16px | API management |
| Billing | `CreditCard` | 20px | Subscription/payment |
| Audit log | `History` | 20px | Admin audit trail |
| Backup | `HardDrive` | 20px | Data backup status |
| Import | `FileUp` | 16px | CSV/data import |
| Bulk action | `Layers` | 16px | Batch operations |

#### User & Profile

| Context | Lucide Icon Name | Size | Notes |
|---------|-----------------|------|-------|
| User profile | `User` | 20px | Single user |
| Multiple users | `Users` | 20px | Group/team |
| Avatar placeholder | `UserCircle` | 32-40px | When no photo uploaded |
| Owner | `Crown` | 14px | Owner role badge |
| Tenant | `Home` | 14px | Tenant role badge |
| Board member | `Award` | 14px | Board role badge |
| Staff | `BadgeCheck` | 14px | Staff role badge |
| Phone | `Phone` | 16px | Contact phone |
| Email | `Mail` | 16px | Contact email |
| Location | `MapPin` | 16px | Address/building |
| Pet | `PawPrint` | 16px | Pet management |
| Vehicle | `Car` | 16px | Vehicle management |
| Emergency contact | `HeartPulse` | 16px | Emergency contacts — color: `--color-error` |
| Document | `FileText` | 16px | Uploaded documents |
| Signature | `PenTool` | 16px | Signature pad |

### 3.6 Feedback & System Icons

| Context | Lucide Icon Name | Size | Color | Notes |
|---------|-----------------|------|-------|-------|
| Notification bell | `Bell` | 20px | `--text-secondary` | Top bar, with badge count |
| Notification bell active | `BellDot` | 20px | `--accent` | When unread notifications exist |
| Help | `HelpCircle` | 20px | `--text-secondary` | Help/tooltip trigger |
| Command palette | `Command` | 16px | `--text-tertiary` | Keyboard shortcut indicator |
| Keyboard shortcut | `Keyboard` | 16px | `--text-tertiary` | Shortcut hint |
| Sidebar collapse | `PanelLeftClose` | 20px | `--text-secondary` | Collapse sidebar |
| Sidebar expand | `PanelLeftOpen` | 20px | `--text-secondary` | Expand sidebar |
| Theme toggle | `SunMoon` | 20px | `--text-secondary` | Light/dark mode switch |
| Logout | `LogOut` | 20px | `--text-secondary` | Sign out |
| Switch building | `ArrowRightLeft` | 16px | `--text-secondary` | Building switcher |
| Language | `Globe` | 16px | `--text-secondary` | Language selector |
| Empty state | `Inbox` | 48px | `--text-tertiary` | Generic empty state |
| No results | `SearchX` | 48px | `--text-tertiary` | Search empty state |
| Offline | `WifiOff` | 20px | `--color-warning` | Network offline indicator |
| Sync | `RefreshCw` | 16px | `--accent` | Syncing data, animated spin |

### 3.7 Icon Usage Rules

1. **Never use an icon without a text label** in navigation. Collapsed sidebar shows tooltip labels on hover.
2. **Icons in tables** are 16px maximum. Larger icons waste vertical space in dense data views.
3. **Action icons in buttons** are placed LEFT of text with 8px gap. Exception: "Next" arrows go right.
4. **Status icons** always accompany text. Color alone is never sufficient (accessibility rule).
5. **Interactive icons** (clickable) must be wrapped in a minimum 36x36px touch target. The icon itself can be 16-20px but the clickable area must be 36px+.
6. **Animated icons**: Only `Loader2` (spin) and `RefreshCw` (sync spin) use animation. All other icons are static. CSS: `animation: spin 1s linear infinite`.
7. **Icon color inheritance**: Set color on the parent element, not the SVG. Icons use `currentColor` for fill/stroke.

**Total icon mappings in this section: 140+**

---


## 4. Micro-Interaction Library

### 4.1 Philosophy

Every animation in Concierge communicates state. We never animate for decoration. The three questions before adding any micro-interaction:

1. **Does it communicate a state change?** (hover → clickable, loading → loaded, open → closed)
2. **Does it provide feedback?** (click acknowledged, action succeeded, error occurred)
3. **Does it orient the user?** (where did this element come from, where is it going)

If the answer to all three is "no," the animation should not exist.

### 4.2 Interaction Catalog

#### MI-01: Button Press Feedback

| Property | Value |
|----------|-------|
| **Trigger** | `mousedown` / `touchstart` on any button |
| **Visual** | Scale down to 0.97, slight brightness reduction |
| **Timing** | 80ms ease-out on press, 120ms ease-out on release |
| **CSS** | `transform: scale(0.97); filter: brightness(0.97);` |
| **Reduced motion** | Instant opacity 0.8 on press, instant 1.0 on release |

```css
.btn {
  transition: transform 120ms ease-out, filter 120ms ease-out;
}
.btn:active {
  transform: scale(0.97);
  filter: brightness(0.97);
  transition-duration: 80ms;
}
```

#### MI-02: Button Hover Glow

| Property | Value |
|----------|-------|
| **Trigger** | `mouseenter` on primary and secondary buttons |
| **Visual** | Primary: background darkens 8%. Secondary: light accent tint appears. |
| **Timing** | 150ms ease |
| **CSS** | Primary: `background: var(--accent-hover)`. Secondary: `background: var(--accent-subtle)` |
| **Reduced motion** | Same — no motion involved, only color change |

#### MI-03: Card Hover Lift

| Property | Value |
|----------|-------|
| **Trigger** | `mouseenter` on clickable cards (KPI cards, event cards, package cards) |
| **Visual** | Card translates up 2px, shadow deepens from level 1 to level 3 |
| **Timing** | 200ms ease-out on enter, 150ms ease on leave |
| **CSS** | `transform: translateY(-2px); box-shadow: var(--shadow-3);` |
| **Reduced motion** | Shadow change only, no translate |

```css
.card-clickable {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
}
@media (prefers-reduced-motion: reduce) {
  .card-clickable:hover {
    transform: none;
  }
}
```

#### MI-04: Input Focus Ring

| Property | Value |
|----------|-------|
| **Trigger** | `focus` on any form input, select, textarea |
| **Visual** | Border transitions from `--border-subtle` to `--accent`. 3px accent-colored focus ring appears (offset 0px). |
| **Timing** | 200ms ease for border and ring |
| **CSS** | `border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle);` |
| **Reduced motion** | Instant — no timing change needed |

#### MI-05: Input Validation Error Shake

| Property | Value |
|----------|-------|
| **Trigger** | Form submission with invalid fields, or blur on invalid field |
| **Visual** | Input field shakes horizontally (3px left-right-left) + border turns red |
| **Timing** | 300ms total (3 oscillations at 100ms each) |
| **CSS** | `@keyframes shake { 0%,100% { translateX(0) } 25% { translateX(-3px) } 75% { translateX(3px) } }` |
| **Reduced motion** | No shake. Border turns red instantly. Error text appears with no animation. |

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-3px); }
}
.input-error {
  animation: shake 300ms ease;
  border-color: var(--color-error);
}
@media (prefers-reduced-motion: reduce) {
  .input-error {
    animation: none;
  }
}
```

#### MI-06: Input Validation Success Check

| Property | Value |
|----------|-------|
| **Trigger** | Field passes validation (on blur or debounced keystroke) |
| **Visual** | Green checkmark icon fades in at right edge of input, scales from 0.5 to 1.0 |
| **Timing** | 200ms ease-out |
| **CSS** | `opacity: 0 → 1; transform: scale(0.5) → scale(1.0)` |
| **Reduced motion** | Instant appear, no scale |

#### MI-07: Toggle Switch Slide

| Property | Value |
|----------|-------|
| **Trigger** | Click/tap on toggle switch |
| **Visual** | Knob slides from left to right (or vice versa). Track color transitions. |
| **Timing** | 200ms with spring physics — `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| **CSS** | Knob: `transform: translateX(0) → translateX(20px)`. Track: `background: --bg-tertiary → --accent` |
| **Reduced motion** | Instant position change, color transition reduced to 100ms |

```css
.toggle-track {
  transition: background-color 200ms ease;
}
.toggle-knob {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

#### MI-08: Dropdown Menu Open

| Property | Value |
|----------|-------|
| **Trigger** | Click on dropdown trigger (select, action menu) |
| **Visual** | Menu fades in + scales from 95% to 100% Y-axis. Origin: top-left (or top-right for right-aligned). |
| **Timing** | 150ms ease-out open, 100ms ease-in close |
| **CSS** | `opacity: 0 → 1; transform: scaleY(0.95) → scaleY(1); transform-origin: top;` |
| **Reduced motion** | Instant show/hide via opacity only |

#### MI-09: Modal Open/Close

| Property | Value |
|----------|-------|
| **Trigger** | Modal dialog triggered by user action |
| **Visual** | Backdrop fades in (0 → 0.3 opacity). Dialog scales from 0.97 to 1.0 + fades in. |
| **Timing** | Open: backdrop 200ms, dialog 250ms ease-out (50ms delay). Close: dialog 150ms ease-in, backdrop 150ms. |
| **CSS** | Dialog: `opacity: 0 → 1; transform: scale(0.97) → scale(1)` |
| **Reduced motion** | Instant opacity change. No scale transform. |

#### MI-10: Toast Notification Entry

| Property | Value |
|----------|-------|
| **Trigger** | System event (success, error, info) |
| **Visual** | Toast slides in from top-right, 12px downward. Icon scales with bounce. Timer bar animates. |
| **Timing** | Slide: 300ms spring(1, 80, 10). Icon bounce: 250ms. Timer: linear over dismiss duration (4-15s). |
| **CSS** | `transform: translateX(100%) → translateX(0); opacity: 0 → 1` |
| **Reduced motion** | Instant appear. Timer bar still animates (functional, not decorative). |

#### MI-11: Toast Notification Dismiss

| Property | Value |
|----------|-------|
| **Trigger** | Auto-dismiss timer complete, or user clicks dismiss |
| **Visual** | Toast slides up 12px + fades out. Remaining toasts in stack slide up to fill gap. |
| **Timing** | Dismiss: 200ms ease-in. Stack reflow: 300ms ease-out. |
| **Reduced motion** | Instant disappear. Stack reflow: instant. |

#### MI-12: Status Badge Transition

| Property | Value |
|----------|-------|
| **Trigger** | Status changes (e.g., Pending → In Progress, Open → Resolved) |
| **Visual** | Badge scales to 1.08x, old color fades out, new color fades in, single pulse ring emanates, badge scales back to 1.0x |
| **Timing** | Scale up: 150ms. Color transition: 200ms. Pulse ring: 400ms. Scale down: 150ms. Total: ~500ms. |
| **CSS** | See keyframe definition below |
| **Reduced motion** | Instant color change. No scale or pulse. |

```css
@keyframes status-change {
  0% { transform: scale(1); }
  20% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 var(--status-color-alpha); }
  100% { box-shadow: 0 0 0 8px transparent; }
}
```

#### MI-13: Table Row Hover

| Property | Value |
|----------|-------|
| **Trigger** | `mouseenter` on table data row |
| **Visual** | Row background transitions from transparent to `--bg-secondary` |
| **Timing** | 100ms ease |
| **Reduced motion** | Same — no motion involved |

#### MI-14: Table Row Selection

| Property | Value |
|----------|-------|
| **Trigger** | Checkbox click on table row |
| **Visual** | Row background transitions to `--accent-subtle`. Checkbox fills with accent color. |
| **Timing** | 150ms ease |
| **Reduced motion** | Same — color change only |

#### MI-15: Sidebar Navigation Indicator

| Property | Value |
|----------|-------|
| **Trigger** | Click on sidebar navigation item |
| **Visual** | 3px accent-colored left border slides vertically from previous active item to new one. Active item background transitions to `--accent-subtle`. |
| **Timing** | Border slide: 250ms spring (stiffness 300, damping 30). Background: 150ms ease. |
| **Reduced motion** | Instant position change for border. Background still transitions at 100ms. |

#### MI-16: Sidebar Expand/Collapse

| Property | Value |
|----------|-------|
| **Trigger** | Collapse toggle click or `[` keyboard shortcut |
| **Visual** | Sidebar width animates between 240px (expanded) and 64px (collapsed). Labels fade out at 180px threshold. Content area width adjusts correspondingly. |
| **Timing** | Width: 200ms ease-in-out. Label opacity: 100ms (out), 100ms (in, delayed until 180px reached). |
| **Reduced motion** | Instant width change. |

#### MI-17: Page Content Transition

| Property | Value |
|----------|-------|
| **Trigger** | Navigation between pages/routes |
| **Visual** | Outgoing content fades out + slides up 8px. Incoming content fades in + slides up from 8px below. |
| **Timing** | Exit: 150ms ease-in. Enter: 200ms ease-out, 50ms delay after exit. |
| **Reduced motion** | Instant swap. No fade or slide. |

#### MI-18: Skeleton Shimmer

| Property | Value |
|----------|-------|
| **Trigger** | Content loading (API fetch, page render) |
| **Visual** | Gray placeholder shapes matching target layout. Shimmer gradient sweeps left-to-right. |
| **Timing** | 1.5s linear, infinite loop |
| **CSS** | `background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%); background-size: 200% 100%; animation: shimmer 1.5s linear infinite;` |
| **Reduced motion** | Static gray blocks, no shimmer animation |

#### MI-19: Skeleton to Content Crossfade

| Property | Value |
|----------|-------|
| **Trigger** | Data loaded, replacing skeleton |
| **Visual** | Skeleton fades out while real content fades in simultaneously |
| **Timing** | 300ms ease crossfade |
| **Reduced motion** | Instant swap |

#### MI-20: Chart Draw-In

| Property | Value |
|----------|-------|
| **Trigger** | Chart data loaded and component mounts |
| **Visual** | Bar charts: bars grow from baseline to value. Line charts: line draws left-to-right. Donut charts: segments fill clockwise from 0 to final angle. |
| **Timing** | 800ms ease-out-cubic (`cubic-bezier(0.33, 1, 0.68, 1)`) |
| **Reduced motion** | Instant render at final state |

#### MI-21: Floating Action Bar Slide-Up

| Property | Value |
|----------|-------|
| **Trigger** | One or more table rows selected via checkbox |
| **Visual** | Action bar slides up from bottom edge, 48px height, with count and action buttons |
| **Timing** | 250ms ease-out slide up. 200ms ease slide down on deselect. |
| **Reduced motion** | Instant appear/disappear |

#### MI-22: Popover Anchor Appear

| Property | Value |
|----------|-------|
| **Trigger** | Click on a calendar slot, event card, or info trigger |
| **Visual** | Popover fades in + slides 4px from anchor direction. Arrow points to trigger element. |
| **Timing** | 150ms ease-out |
| **Reduced motion** | Instant appear |

#### MI-23: Slide-Over Panel Entry

| Property | Value |
|----------|-------|
| **Trigger** | "Check In Package" button, notification panel, or any slide-over |
| **Visual** | Panel slides in from right edge. Backdrop appears. Content area slightly shifts left (optional). |
| **Timing** | Panel: 300ms ease-out. Backdrop: 200ms. |
| **Reduced motion** | Instant appear. |

#### MI-24: Drag-and-Drop Card Lift

| Property | Value |
|----------|-------|
| **Trigger** | `dragstart` on Kanban card or sortable list item |
| **Visual** | Card elevates (shadow deepens to level 4), rotates 1-2 degrees, becomes slightly transparent (0.9 opacity). Drop zones highlight. |
| **Timing** | Lift: 150ms ease-out. Drop: 200ms ease with slight bounce. |
| **Reduced motion** | No rotation. Opacity change only. |

#### MI-25: Drag-and-Drop Column Highlight

| Property | Value |
|----------|-------|
| **Trigger** | Dragged card hovers over a valid drop column (Kanban status change) |
| **Visual** | Target column background transitions to `--accent-subtle`. Dashed border placeholder appears where card will land. |
| **Timing** | 150ms ease |
| **Reduced motion** | Same — color change only |

#### MI-26: Accordion Expand/Collapse

| Property | Value |
|----------|-------|
| **Trigger** | Click on accordion header (report categories, settings sections, filter groups) |
| **Visual** | Content slides down from 0 height. Chevron icon rotates 180 degrees. |
| **Timing** | Height: 200ms ease-out. Chevron: 200ms ease. |
| **Reduced motion** | Instant show/hide. Chevron instant rotation. |

#### MI-27: Tab Switch Underline Slide

| Property | Value |
|----------|-------|
| **Trigger** | Click on tab in tabbed interface (Unit file tabs, Package tabs, Security tabs) |
| **Visual** | Active underline (2px accent) slides horizontally from previous tab to new tab. Tab text color transitions. |
| **Timing** | Underline: 250ms spring. Text color: 150ms ease. |
| **Reduced motion** | Instant underline position change. |

#### MI-28: Notification Badge Bounce

| Property | Value |
|----------|-------|
| **Trigger** | New notification arrives while app is open (real-time update) |
| **Visual** | Red badge count on bell icon bounces once (scale 1.0 → 1.3 → 1.0) |
| **Timing** | 400ms spring (stiffness 400, damping 15) |
| **Reduced motion** | No bounce. Badge appears instantly. |

#### MI-29: Copy-to-Clipboard Confirmation

| Property | Value |
|----------|-------|
| **Trigger** | Click copy button (phone number, reference ID, tracking number) |
| **Visual** | Copy icon morphs to checkmark for 2 seconds, then morphs back. Tooltip shows "Copied!" |
| **Timing** | Icon morph: 200ms ease. Tooltip: instant appear, auto-dismiss 2s. |
| **Reduced motion** | Instant icon swap. |

#### MI-30: Password Strength Meter Fill

| Property | Value |
|----------|-------|
| **Trigger** | Keystroke in password field (create account, change password) |
| **Visual** | Horizontal bar fills progressively. Color transitions: red (weak) → orange (fair) → yellow (good) → green (strong). |
| **Timing** | Width and color: 300ms ease |
| **Reduced motion** | Same — bar fills are functional feedback |

#### MI-31: Signature Pad Drawing

| Property | Value |
|----------|-------|
| **Trigger** | Touch/mouse draw on signature canvas (key checkout, package release) |
| **Visual** | Ink-like line follows pointer with slight smoothing. Line width varies with speed (faster = thinner). |
| **Timing** | Real-time (requestAnimationFrame) |
| **Reduced motion** | Same — interactive drawing is functional |

#### MI-32: Image Lightbox Open

| Property | Value |
|----------|-------|
| **Trigger** | Click on attachment thumbnail (service request photos, ID photos) |
| **Visual** | Thumbnail expands to full viewport with backdrop. Image scales from thumbnail size to full size. |
| **Timing** | 300ms ease-out. Backdrop: 200ms. |
| **Reduced motion** | Instant full-screen display with backdrop. |

#### MI-33: Calendar Date Selection

| Property | Value |
|----------|-------|
| **Trigger** | Click on date in calendar widget (mini cal or main calendar) |
| **Visual** | Selected date gets filled accent circle background. Previous selection circle fades out. |
| **Timing** | 150ms ease |
| **Reduced motion** | Same — color only |

#### MI-34: Scroll-Triggered Fade-In

| Property | Value |
|----------|-------|
| **Trigger** | Element enters viewport during scroll (dashboard widgets below fold) |
| **Visual** | Element fades in + slides up 16px as it enters the viewport |
| **Timing** | 400ms ease-out, triggered at 20% visibility threshold |
| **Reduced motion** | Instant visibility. No fade or slide. |
| **Note** | Use `IntersectionObserver`. Only applies on first render, not on scroll-back. |

### 4.3 Global Reduced Motion Strategy

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Exceptions: these animations are functional, not decorative */
  .timer-bar,
  .progress-bar,
  .signature-canvas {
    transition-duration: inherit !important;
    animation-duration: inherit !important;
  }
}
```

**Functional animations preserved under reduced motion:**
- Timer bar on toast notifications (communicates countdown)
- Progress bars (communicates completion state)
- Password strength meter (communicates security level)
- Signature pad drawing (functional interaction)

---


## 5. Component Composition Rules

### 5.1 Composition Philosophy

Complex UI in Concierge is built by composing small, single-purpose components. This section defines how components combine, the maximum allowed nesting depth, and the spacing rules between composed elements.

**Core principle**: Every composite component can be understood as a flat list of sub-components arranged in a predictable spatial pattern. If a composition requires more than 3 nesting levels, the design needs simplification.

### 5.2 Compound Component Patterns

#### DataTable Composition

The most-used compound component in Concierge. Every list page (Packages, Service Requests, Users, Units, Logs) uses this pattern.

```
DataTable
├── TableToolbar
│   ├── PageTitle (Display text)
│   ├── PrimaryAction (Button — "+ Create")
│   ├── SearchInput (compact, right-aligned)
│   └── FilterBar (optional, below title row)
│       ├── FilterChip[]
│       └── ClearFiltersButton
├── TableHeader
│   └── TableHeaderCell[] (sortable, with sort indicator icon)
├── TableBody
│   └── TableRow[] (selectable via checkbox)
│       └── TableCell[] (text, badge, icon, action menu)
├── TableEmptyState (shown when rows = 0)
│   ├── EmptyIllustration (48px icon)
│   ├── EmptyTitle (Title 3)
│   ├── EmptyDescription (Body, --text-secondary)
│   └── EmptyCTA (Primary button)
├── FloatingActionBar (shown when rows selected)
│   ├── SelectionCount ("3 selected")
│   ├── BulkAction[] (buttons)
│   └── DeselectAll (ghost button)
└── TableFooter
    ├── RowCount ("Showing 1-25 of 1,987")
    └── Pagination
        ├── PreviousButton
        ├── PageNumber[] (max 5 visible + ellipsis)
        └── NextButton
```

**Spacing rules:**
- TableToolbar to TableHeader: 16px (`--space-4`)
- TableHeader row height: 44px
- TableRow height: 56px
- TableFooter top margin: 16px (`--space-4`)
- FloatingActionBar: fixed bottom, 16px from viewport edge, 48px height
- FilterBar: 12px below title row, 8px between filter chips

#### StatCardRow Composition

Used at the top of every dashboard and overview page.

```
StatCardRow
├── StatCard (repeated 3-4x)
│   ├── CardLabel (Overline or Caption, --text-secondary)
│   ├── CardValue (KPI Value style, --text-primary)
│   ├── TrendIndicator (optional)
│   │   ├── TrendArrow (ArrowUp or ArrowDown icon, 14px)
│   │   └── TrendText (Caption, success or error color)
│   └── Sparkline (optional, 48px tall, accent or trend color)
```

**Layout**: CSS Grid with `repeat(auto-fit, minmax(240px, 1fr))` and 24px gap. Cards distribute evenly.

**Spacing rules:**
- CardLabel to CardValue: 8px (`--space-2`)
- CardValue to TrendIndicator: 4px (`--space-1`)
- TrendIndicator to Sparkline: 12px (`--space-3`)
- Internal card padding: 20px (`--space-5`)
- StatCardRow bottom margin: 24px (`--space-6`)

#### FormSection Composition

Used inside modals and settings pages. Groups related form fields.

```
FormSection
├── SectionHeader (optional)
│   ├── SectionTitle (Title 3)
│   └── SectionDescription (Body, --text-secondary)
├── FormField (repeated)
│   ├── FieldLabel (Callout, 500 weight)
│   │   ├── LabelText
│   │   ├── RequiredIndicator (* in --color-error)
│   │   └── OptionalTag ("optional" in Caption, --text-tertiary)
│   ├── InputControl (text, select, textarea, toggle, etc.)
│   ├── HelpText (Caption, --text-secondary, below input)
│   └── ErrorMessage (Caption, --color-error, below input, replaces help text)
├── FormDivider (1px --border-subtle, 24px vertical margin)
└── FormActions (sticky footer in modals)
    ├── SecondaryButton (Cancel)
    └── PrimaryButton (Save / Create / Submit)
```

**Spacing rules:**
- SectionHeader to first FormField: 16px
- Between FormFields: 20px (`--space-5`)
- FieldLabel to InputControl: 6px
- InputControl to HelpText/ErrorMessage: 4px
- FormDivider vertical margin: 24px top, 24px bottom
- FormActions: 24px top padding, right-aligned, 12px gap between buttons

#### CardGrid Composition

Used for Classifieds, Marketplace, Events, and Amenity lists.

```
CardGrid
├── GridToolbar
│   ├── PageTitle
│   ├── PrimaryAction
│   ├── SearchInput
│   └── ViewToggle (Grid | List) — segmented control
├── FilterTabs (horizontal tab bar)
│   └── Tab[] (All, Category1, Category2, ...)
├── Grid (CSS Grid: repeat(auto-fill, minmax(280px, 1fr)))
│   └── ContentCard (repeated)
│       ├── CardImage (16:9 or 1:1 ratio, object-fit: cover)
│       ├── CardBody
│       │   ├── CardTitle (Headline)
│       │   ├── CardDescription (Callout, 2-line clamp)
│       │   ├── CardMeta (Caption — price, unit, date)
│       │   └── CardStatus (StatusBadge)
│       └── CardActions (ghost buttons or icon buttons)
└── LoadMoreButton or Pagination
```

**Spacing rules:**
- Grid gap: 24px (`--space-6`)
- Card internal padding: 0 (image bleeds to edge), 16px for body
- CardImage to CardBody: 0 (image is flush with card border)
- Between CardBody elements: 8px
- CardMeta to CardStatus: 12px
- FilterTabs to Grid: 20px

#### SidebarDetailLayout Composition

Used for Settings, Document Library, and Search results. A two-panel layout with navigation on left and content on right.

```
SidebarDetailLayout
├── SidePanel (240-280px fixed width)
│   ├── PanelHeader (optional search, title)
│   ├── NavList
│   │   └── NavItem[] (text + optional badge count)
│   │       ├── NavIcon (20px)
│   │       └── NavLabel (Body or Callout)
│   └── PanelFooter (optional summary, storage indicator)
├── Divider (1px vertical --border-subtle)
└── ContentPanel (flex: 1)
    ├── ContentHeader
    │   ├── Breadcrumb (Caption links)
    │   ├── ContentTitle (Title 1)
    │   └── ContentActions (buttons)
    └── ContentBody (scrollable)
```

**Spacing rules:**
- SidePanel internal padding: 16px
- NavItem height: 40px, full-width clickable
- Between NavItems: 2px
- NavList group spacing: 16px between groups
- ContentPanel padding: 32px
- Breadcrumb to ContentTitle: 8px
- ContentTitle to ContentBody: 24px

### 5.3 Card Composition Rules

Cards are the primary container for discrete information units. These rules govern what goes inside a card.

| Rule | Specification |
|------|---------------|
| **Maximum elements per card** | 6 distinct pieces of information. If more is needed, link to a detail view. |
| **Hierarchy within a card** | 1 title (Headline), 1 primary value or description (Body/Callout), up to 3 metadata items (Caption), 1 action or status. |
| **Image placement** | Always top of card. Never inline with text. Ratio: 16:9 (wide content) or 1:1 (product/avatar). |
| **Action placement** | Bottom of card or integrated as ghost buttons. Never more than 2 visible actions. Additional actions go in `...` menu. |
| **Status badge placement** | Top-right corner for status-first scanning (packages, requests). Bottom-left for identity-first scanning (residents, units). |
| **Left accent border** | 3px solid, used ONLY for event-type color coding. Never on cards that are not events. |
| **Card grouping** | When multiple cards form a group (KPI row, event feed), use equal widths and consistent heights within the row. Mismatched card heights in a row is a design failure. |

### 5.4 Layout Composition Rules

| Rule | Specification |
|------|---------------|
| **Maximum nesting depth** | 3 levels. Page → Section → Component. If you need a component within a component within a section within a page, flatten the hierarchy. |
| **Column count** | 12-column grid. Components span 3, 4, 6, 8, or 12 columns. Never 5, 7, 9, 10, or 11. Odd spans break visual rhythm. Exception: SidePanel at ~3.5 columns (280px fixed). |
| **Spacing between composed elements** | Same-level siblings: 24px gap. Parent-to-child: 16px padding. Related items within a component: 8px. |
| **Full-width elements** | Tables, charts, and hero sections always span 12 columns. Never have a table that shares horizontal space with another element. |
| **Sticky elements** | Only 3 things are ever sticky: the sidebar, the top header bar, and modal footers (action buttons). Never sticky table headers or sticky filter bars. |
| **Z-index stacking** | Sidebar: 40. Header: 30. Modal backdrop: 50. Modal dialog: 60. Toast: 70. Tooltip: 80. Dropdown: 45. Popover: 55. See Section 9 for full z-index scale. |

### 5.5 Responsive Composition Rules

| Breakpoint | Composition Behavior |
|-----------|---------------------|
| Desktop XL (>1440px) | All compositions render at full specification. Side panels visible. Grids at max columns. |
| Desktop (1280-1440px) | Side panels may collapse to icon-only. Grids reduce to fewer columns. |
| Tablet (768-1279px) | Side panels become overlay drawers triggered by toggle. CardGrids go to 2 columns. Tables remain but may hide non-essential columns. |
| Mobile (<768px) | Everything single-column. Tables transform to card lists. Modals become full-screen sheets. Side panels are bottom sheets. |

**Column visibility on responsive tables:**

| Column Type | Desktop | Tablet | Mobile |
|------------|---------|--------|--------|
| Primary identifier (name, ID) | Visible | Visible | Visible |
| Status badge | Visible | Visible | Visible |
| Secondary info (category, assigned) | Visible | Visible | Hidden (shown in card view) |
| Dates/timestamps | Visible | Hidden | Hidden |
| Checkbox selection | Visible | Visible | Swipe gesture replaces |
| Action menu | Visible | Visible | Visible |

---


## 6. Data Visualization Guidelines

### 6.1 Chart Type Selection Matrix

Choose the right chart for the data shape. This matrix covers every reporting scenario in Concierge.

| Data Shape | Chart Type | When to Use | Concierge Examples |
|-----------|-----------|-------------|-------------------|
| Single value + trend | **KPI Card + Sparkline** | One metric with historical context | Open requests (47, +12% vs last week) |
| Single value + goal | **Progress Ring** | Completion towards a target | Amenity utilization (73% booked this week) |
| Parts of a whole (2-5 segments) | **Donut Chart** | Distribution where total matters | Resident breakdown (Owners 235, Tenants 1298, Offsite 454) |
| Parts of a whole (6+ segments) | **Stacked Bar** (horizontal) | Too many segments for donut | Service requests by category (8 categories) |
| Time series (single metric) | **Line Chart** | Trend over time | Packages received per day (30-day view) |
| Time series (2-3 metrics) | **Multi-Line Chart** | Comparing trends | Open vs closed requests per week |
| Time series (comparison) | **Area Chart** (stacked) | Cumulative volume over time | Bookings by amenity type per month |
| Categories comparison | **Bar Chart** (horizontal) | Comparing discrete values | Top 10 units by service requests |
| Categories over time | **Grouped Bar Chart** (vertical) | Category changes across periods | Monthly requests: Plumbing vs Electrical vs HVAC |
| Distribution | **Histogram** | Frequency distribution | Package pickup times (hour of day) |
| Ranking | **Horizontal Bar** (sorted) | Top/bottom N items | Most active amenities, busiest concierge hours |
| Geo/Spatial | **Building Floor Plan** (v3+) | Physical location mapping | Not in v1. Future: heat map of incidents by floor. |

### 6.2 Chart Color Palette

Use the colorblind-safe palette from Section 1.11 for all chart series. Apply colors in this fixed order:

| Series # | Color Name | OKLCH | Hex | CSS Variable |
|----------|-----------|-------|-----|-------------|
| 1 | Primary Blue | `oklch(0.546 0.245 262.88)` | `#0071E3` | `--chart-1` |
| 2 | Vivid Orange | `oklch(0.680 0.190 45.00)` | `#F97316` | `--chart-2` |
| 3 | Deep Purple | `oklch(0.480 0.150 310.00)` | `#7C3AED` | `--chart-3` |
| 4 | Ocean Teal | `oklch(0.640 0.100 200.00)` | `#0891B2` | `--chart-4` |
| 5 | Rose Magenta | `oklch(0.550 0.200 350.00)` | `#DB2777` | `--chart-5` |
| 6 | Forest Lime | `oklch(0.750 0.160 130.00)` | `#65A30D` | `--chart-6` |
| Other/Overflow | Gray | `oklch(0.820 0.005 260)` | `#AEAEB2` | `--chart-other` |

**Rules:**
- Never use semantic colors (success green, error red) for chart data. Chart colors and status colors must be separate systems.
- Maximum 6 visible series. If more than 6 exist, group remaining into "Other" using `--chart-other`.
- In donut charts, "Other" segment is always last (positioned from 11 o'clock counterclockwise).

### 6.3 Chart Sizing and Aspect Ratios

| Chart Type | Minimum Width | Aspect Ratio | Height Calculation |
|-----------|--------------|-------------|-------------------|
| Line / Area | 320px | 16:9 | `width / 1.78` |
| Bar (vertical) | 320px | 4:3 | `width / 1.33` |
| Bar (horizontal) | 320px | Variable | 32px per bar + 48px for axes |
| Donut | 200px | 1:1 | `width` |
| Sparkline (in KPI card) | 100px | 4:1 | 48px fixed height |
| Progress Ring | 80px | 1:1 | `width` |

**Responsive behavior:**
- Below 400px width: line/bar charts collapse to a simple number + trend arrow (no chart drawn).
- Donut charts never render below 160px width.
- Sparklines maintain 48px height at all widths.
- On mobile (<768px): charts stack full-width, one per row.

### 6.4 Axis and Label Rules

| Element | Style | Notes |
|---------|-------|-------|
| X-axis labels | `--type-caption`, `--text-secondary` | Rotate 45 degrees if labels overlap. Max visible: 12 labels. |
| Y-axis labels | `--type-caption`, `--text-secondary` | Right-aligned, 8px from axis line. Use abbreviations (1K, 10K, 1M) for large numbers. |
| Axis lines | 1px `--border-subtle` | X-axis always visible. Y-axis optional (remove if gridlines present). |
| Gridlines | 1px dashed `--border-subtle` at 20% opacity | Horizontal only. 4-6 gridlines. Never vertical gridlines. |
| Legend | `--type-caption`, placed above chart | Horizontal layout. Color swatch (8px circle) + label. 16px gap between items. Max one row — if it wraps, reduce series count. |
| Chart title | `--type-title-2` | Above legend. Left-aligned. Optional — many charts in cards use the card title instead. |
| Value labels on bars | `--type-caption`, `--text-primary` | Inside bar if bar is wide enough (>40px), otherwise above bar. |
| Center label (donut) | `--type-kpi-value` + `--type-kpi-label` | Total value centered in donut hole. Label below value. |

### 6.5 Tooltip Design

All interactive charts show tooltips on hover.

```
┌──────────────────────────┐
│  Wed, March 18            │  ← Date/category (Caption, --text-secondary)
│                           │
│  ● Packages: 47           │  ← Series color dot + name + value
│  ● Visitors: 23           │  ← Repeat for each series
│  ● Incidents: 2           │
│                           │
│  Total: 72                │  ← Optional total (Callout, 600 weight)
└──────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | White (`--bg-primary`) |
| Border | 1px `--border-subtle` |
| Border radius | 8px |
| Shadow | `--shadow-3` (level 3 elevation) |
| Padding | 12px 16px |
| Max width | 240px |
| Pointer | 8px triangle pointing to data point |
| Animation | Fade in 100ms, follows cursor with 50ms throttle |
| Touch behavior | Tap-and-hold to show, release to dismiss |

### 6.6 Empty State for Charts

When a chart has no data:

```
┌──────────────────────────────────────────┐
│                                          │
│              📊                          │
│                                          │
│     No data for this period              │  ← Title 3, --text-primary
│     Try expanding the date range         │  ← Body, --text-secondary
│     or selecting different filters.      │
│                                          │
│         [ Expand Date Range ]            │  ← Secondary button
│                                          │
└──────────────────────────────────────────┘
```

- Chart area shows the empty state centered within the chart's allocated space.
- Axis lines and gridlines are NOT drawn.
- The icon uses the chart type icon (BarChart3 for bar, TrendingUp for line) at 48px, `--text-tertiary`.

### 6.7 Chart Animation (Draw-In Sequences)

| Chart Type | Animation | Duration | Easing |
|-----------|-----------|----------|--------|
| Bar (vertical) | Bars grow from baseline to value | 800ms | `ease-out-cubic` |
| Bar (horizontal) | Bars grow from left edge to value | 800ms | `ease-out-cubic` |
| Line | Line draws left-to-right using SVG `stroke-dashoffset` | 1000ms | `ease-out` |
| Area | Same as line, fill fades in 200ms after line completes | 1200ms total | `ease-out` |
| Donut | Segments fill clockwise from 12 o'clock | 800ms | `ease-out-cubic` |
| Progress Ring | Arc fills clockwise from 12 o'clock | 600ms | `ease-out` |
| Sparkline | Draws left-to-right | 500ms | `linear` |

**Stagger**: When multiple charts are on screen (e.g., Reports page), stagger animations by 100ms per chart.

**Reduced motion**: Charts render at final state instantly. No draw-in animation.

### 6.8 Chart Interaction Patterns

| Interaction | Behavior |
|------------|----------|
| Hover on data point | Tooltip appears. Data point enlarges (circle: 4px → 6px). Corresponding legend item bolds. |
| Click on legend item | Toggles series visibility. Hidden series: legend text gets strikethrough, color fades to 30% opacity. |
| Click on bar/segment | Drills down if drill-down data exists. Otherwise, shows tooltip. |
| Drag to zoom (line/area) | Selects date range for zoom. "Reset Zoom" button appears. |
| Resize viewport | Chart reflows to new container width. Transitions smoothly (200ms). |
| Print | See Section 12 for print-specific chart rendering. |

---

## 7. Empty State Illustration Guidelines

### 7.1 Illustration Style

All empty state illustrations follow a consistent visual language:

| Property | Specification |
|----------|---------------|
| **Art style** | Line art with consistent 1.5px stroke weight |
| **Color palette** | Single accent color (`--accent` / `#0071E3` at 60% opacity) + neutral gray strokes (`--text-tertiary` / `#AEAEB2`) |
| **Background** | Transparent (no background circle or shape behind the illustration) |
| **Size** | 200x200px canvas. Actual illustration fills ~160x160px centered within canvas. |
| **Complexity** | Simple, recognizable objects. 15-25 path elements maximum. No human figures (avoids diversity representation issues). |
| **File format** | Inline SVG for instant loading and color token support |

### 7.2 Empty State Anatomy

Every empty state follows this structure, without exception:

```
┌──────────────────────────────────────────┐
│                                          │
│            [Illustration]                │  ← 200x200px, centered
│                                          │
│          [Headline Text]                 │  ← Title 3 (20px, 600 weight), --text-primary
│                                          │
│        [Body Description]                │  ← Body (15px, 400 weight), --text-secondary
│        [up to 2 lines max]               │     max-width: 360px, centered
│                                          │
│          [ Primary CTA ]                 │  ← Primary button (optional but strongly preferred)
│                                          │
└──────────────────────────────────────────┘
```

**Spacing:**
- Illustration bottom to headline: 24px
- Headline to body: 8px
- Body to CTA: 20px
- Entire empty state container: centered both horizontally and vertically in its parent

### 7.3 Tone Guidelines

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Be encouraging | "No packages yet" | "No packages found" |
| Suggest next steps | "Check in your first package" | "There are 0 packages" |
| Be concise | 1 line headline, 1-2 line description | Paragraphs of explanation |
| Never blame the user | "Your search returned no results" | "You haven't searched correctly" |
| Use positive framing | "All caught up!" (when 0 pending) | "Nothing here" |

### 7.4 Module-Specific Empty States

#### Dashboard (No Activity)

```
Illustration: Clipboard with a single checkmark
Headline: "All caught up!"
Body: "No items need your attention right now. Check back later or start a new task."
CTA: [ Quick Action Menu ] (opens the role-specific action list)
```

#### Packages — No Pending Packages

```
Illustration: Open box with upward arrow (released package)
Headline: "No packages to release"
Body: "New packages will appear here when they are checked in at the front desk."
CTA: [ Check In Package ]
```

#### Packages — No Packages Found (Search)

```
Illustration: Magnifying glass over a box with "?"
Headline: "No packages match your search"
Body: "Try a different unit number, carrier, or tracking number."
CTA: [ Clear Search ]
```

#### Service Requests — No Open Requests

```
Illustration: Wrench with sparkle stars (everything fixed)
Headline: "No open requests"
Body: "All service requests have been addressed. Great job keeping up!"
CTA: [ Create Request ] (for residents) or [ View Closed ] (for PM)
```

#### Service Requests — Empty Kanban Column

```
Illustration: None (column-level empty uses text only)
Headline: "No [status] requests"
Body: "Drag cards here to change their status."
CTA: None (dashed border placeholder indicates drop zone)
```

#### Amenity Bookings — No Bookings

```
Illustration: Calendar with a clock
Headline: "No bookings yet"
Body: "Click any available time slot on the calendar to make a reservation."
CTA: [ View Available Amenities ]
```

#### Units & Residents — No Units

```
Illustration: Building outline with a "+" sign
Headline: "No units created"
Body: "Start by adding units to your building. You can import from CSV or add them one by one."
CTA: [ Add Unit ] or [ Import CSV ]
```

#### Security Logs — No Entries

```
Illustration: Shield with a checkmark
Headline: "No security entries today"
Body: "Visitor parking, key checkouts, and incidents will appear here as they are logged."
CTA: [ Log Visitor Parking ] or [ Check Out Key ]
```

#### Announcements — No Announcements

```
Illustration: Megaphone with sound waves
Headline: "No announcements"
Body: "Create an announcement to communicate with residents across multiple channels."
CTA: [ Create Announcement ]
```

#### Reports — No Data for Period

```
Illustration: Bar chart with flat/zero bars
Headline: "No data for this period"
Body: "Try expanding the date range or selecting different filters."
CTA: [ Expand Date Range ]
```

#### Document Library — Empty Folder

```
Illustration: Open folder with upward arrow
Headline: "This folder is empty"
Body: "Drag and drop files here, or click to upload documents."
CTA: [ Upload File ]
```

#### Surveys — No Surveys

```
Illustration: Clipboard with empty lines
Headline: "No surveys yet"
Body: "Create a survey to gather feedback from residents."
CTA: [ Create Survey ]
```

#### Marketplace / Classifieds — No Listings

```
Illustration: Store window with "Open" sign
Headline: "No listings yet"
Body: "Be the first to post! Share items for sale, services, or things you are looking for."
CTA: [ Post a Listing ]
```

#### Events — No Upcoming Events

```
Illustration: Calendar with party hat
Headline: "No upcoming events"
Body: "Community events will appear here when they are scheduled."
CTA: [ Create Event ] (admin only)
```

#### Notification Center — No Notifications

```
Illustration: Bell with "zzz" (sleeping bell)
Headline: "No notifications"
Body: "You will be notified when packages arrive, requests are updated, or announcements are posted."
CTA: None (this is a positive state)
```

#### Search Results — No Results

```
Illustration: Magnifying glass with "X"
Headline: "No results for '[query]'"
Body: "Try different keywords or broaden your filters."
CTA: [ Clear Filters ]
```

#### Training Module — No Courses (v2)

```
Illustration: Graduation cap with an open book
Headline: "No training courses available"
Body: "Your administrator will assign training courses when they become available."
CTA: None (for staff) or [ Create Course ] (for admin)
```

### 7.5 Empty State Implementation Rules

1. **Every list, table, grid, and timeline MUST have a designed empty state.** No blank white areas.
2. **The CTA must be the most logical next action.** For a package list, it is "Check In Package." For a search, it is "Clear Search." Never use generic "Go Back" or "Return Home."
3. **Empty states in modals** use smaller illustrations (120x120px) and shorter text.
4. **Empty states in cards** (e.g., "Recent Activity" card with no activity) use icon (32px) + single line text only. No illustration.
5. **Positive empty states** (all tasks done, no pending items) use green accent instead of blue. Headline tone is celebratory: "All caught up!" or "Looking good!"
6. **Error states are NOT empty states.** Network errors, permission denials, and server failures have their own patterns (see v1 Section 15). Empty states are for legitimate zero-data scenarios.

---


## 8. Form Field Design Catalog

### 8.1 Design Philosophy

Forms are the primary input mechanism in Concierge. Every package check-in, service request, visitor parking log, and setting change flows through a form. The design must optimize for:

1. **Speed** — Front desk staff check in 20+ packages per shift. Every millisecond of form friction compounds.
2. **Accuracy** — Incorrect unit numbers, missing fields, and typos create downstream problems.
3. **Accessibility** — All form fields must be keyboard-navigable, screen-reader labeled, and touch-target compliant.

### 8.2 Text Input — All States

#### Default (Idle) State

```css
.input {
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);      /* #E5E5EA */
  border-radius: 10px;
  font: 400 15px/22px var(--font-body);
  color: var(--text-primary);                   /* #1D1D1F */
  background: var(--bg-primary);                /* #FFFFFF */
  transition: border-color 200ms ease, box-shadow 200ms ease;
  outline: none;
}
```

#### Hover State

```css
.input:hover:not(:focus):not(:disabled) {
  border-color: oklch(0.710 0.005 260);         /* #8E8E93 — slightly darker border */
}
```

#### Focus State

```css
.input:focus {
  border-color: var(--accent);                  /* #0071E3 */
  box-shadow: 0 0 0 3px var(--accent-subtle);   /* rgba(0, 113, 227, 0.08) */
}
```

#### Filled State (has value, not focused)

```css
.input.has-value {
  /* Same as default. The presence of text IS the visual indicator. */
  /* No special styling — avoids visual noise. */
}
```

#### Error State

```css
.input.error {
  border-color: var(--color-error);             /* #DC2626 */
  box-shadow: 0 0 0 3px oklch(0.630 0.215 25.00 / 0.08); /* Error at 8% */
}
.input.error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px oklch(0.630 0.215 25.00 / 0.12);
}
```

#### Disabled State

```css
.input:disabled {
  background: var(--bg-secondary);              /* #F5F5F7 */
  color: var(--text-tertiary);                  /* #AEAEB2 */
  border-color: var(--border-subtle);
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### Read-Only State

```css
.input[readonly] {
  background: var(--bg-secondary);              /* #F5F5F7 */
  color: var(--text-primary);                   /* Still readable */
  border-color: transparent;                    /* No border — flat surface */
  cursor: default;
}
```

### 8.3 Input Dimensions Reference

| Input Type | Height | Padding | Border Radius | Font |
|-----------|--------|---------|---------------|------|
| Text (single line) | 44px | 0 12px | 10px | 15px/400 |
| Text with icon (left) | 44px | 0 12px 0 40px | 10px | 15px/400, icon: 20px at left 12px |
| Text with icon (right) | 44px | 0 40px 0 12px | 10px | 15px/400, icon: 20px at right 12px |
| Text with action button | 44px | 0 44px 0 12px | 10px | 15px/400, button: 36px square at right |
| Textarea | min 88px, grows | 12px | 10px | 15px/400, resize: vertical only |
| Textarea (auto-resize) | min 88px → max 200px | 12px | 10px | Grows with content, then scrolls |
| Select / Dropdown | 44px | 0 36px 0 12px | 10px | 15px/400, chevron: 16px at right 12px |
| Date picker | 44px | 0 40px 0 12px | 10px | 15px/400, calendar icon: 20px at right |
| Time picker | 44px | 0 40px 0 12px | 10px | 15px/400, clock icon: 20px at right |
| Search input | 44px | 0 12px 0 40px | 10px | 15px/400, search icon: 20px at left |
| Number input | 44px | 0 12px | 10px | 15px/400 monospace for certain fields |
| File upload zone | 80px | 16px | 10px | Dashed border, centered text + icon |
| Toggle switch | 28h x 48w px | — | 14px (pill shape) | Knob: 24px circle |
| Checkbox | 20x20px | — | 4px | Accent fill when checked, check icon 12px |
| Radio button | 20x20px | — | 10px (circle) | Accent fill dot: 8px |
| Segmented control | 40px | 4px internal | 8px | 14px/500 per segment |
| Signature pad | 200px | 16px | 10px | Canvas element, dashed border |

### 8.4 Label Positioning

**Rule**: Labels are ALWAYS positioned above the input. Never inline/beside, never floating/animated.

```
┌──────────────────────────────────┐
│  Label Text *                     │  ← Callout (14px), 500 weight
│                                   │     6px gap to input
│  ┌──────────────────────────────┐│
│  │ Placeholder text              ││  ← Input field
│  └──────────────────────────────┘│
│  Helper text appears here         │  ← Caption (12px), --text-secondary
└──────────────────────────────────┘     4px gap from input
```

| Element | Typography | Color | Spacing |
|---------|-----------|-------|---------|
| Label | Callout (14px), 500 weight | `--text-primary` | 0 bottom margin |
| Required indicator | " *" appended | `--color-error` | Inline after label text |
| Optional indicator | " (optional)" appended | `--text-tertiary` in Caption | Inline after label text |
| Gap: Label to Input | — | — | 6px |
| Help text | Caption (12px), 400 weight | `--text-secondary` | 4px below input |
| Error message | Caption (12px), 500 weight | `--color-error` | 4px below input, REPLACES help text |
| Character count | Caption (12px), 400 weight | `--text-tertiary` (normal), `--color-warning` (>90%), `--color-error` (at limit) | Right-aligned, same line as help text |

### 8.5 Error Message Design

```
  Label *
  ┌──────────────────────────────────┐
  │ Invalid input                     │  ← Red border (--color-error)
  └──────────────────────────────────┘
  ⚠ Error description goes here       ← AlertCircle icon (14px) + Caption text
```

| Property | Value |
|----------|-------|
| Icon | `AlertCircle` at 14px, `--color-error` |
| Text | Caption (12px), 500 weight, `--color-error` |
| Position | 4px below input, left-aligned |
| Animation | Slides down from 0 height to natural height over 200ms ease-out (MI-05 shake accompanies) |
| Max width | Same width as the input field |
| Multiple errors | Show only the first/most relevant error per field. Not a list. |

### 8.6 Required Field Indicator

```
  Email address *          ← Red asterisk, no tooltip needed
  ┌──────────────────┐
  │                  │
  └──────────────────┘
```

- The asterisk is colored `--color-error` and placed immediately after the label text with no space before the asterisk.
- On form submission with missing required fields, BOTH the field border turns red AND an error message appears: "This field is required."
- The first invalid field is auto-focused (scrolled into view if necessary).

### 8.7 Optional Field Indicator

```
  Notes (optional)         ← Gray "(optional)" text
  ┌──────────────────┐
  │                  │
  └──────────────────┘
```

- Use ONLY when the majority of fields in the form are required. If most fields are optional, mark the required ones and leave optional fields unlabeled.
- "(optional)" is Caption size, `--text-tertiary`, appended after the label.

### 8.8 Character Count

For fields with length limits (descriptions, notes, comments):

```
  Description *                                 0/1000
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

| State | Count Color |
|-------|------------|
| 0-89% of limit | `--text-tertiary` |
| 90-99% of limit | `--color-warning` |
| At limit (100%) | `--color-error` |
| Over limit (if allowed temporarily) | `--color-error`, bold, with "X characters over" message |

### 8.9 Password Strength Meter

Used on: account creation (admin-initiated), password change.

```
  New Password *
  ┌──────────────────────────────────────────────────┐
  │ ••••••••••                                    👁  │
  └──────────────────────────────────────────────────┘
  ████░░░░░░░░░░░░░░░░░░░░░  Fair
  
  Requirements:
  ✓ At least 8 characters
  ✗ One uppercase letter
  ✓ One number
  ✗ One special character
```

| Strength Level | Bar Fill | Color | Label |
|---------------|----------|-------|-------|
| Weak (0-25%) | 25% width | `--color-error` | "Weak" |
| Fair (26-50%) | 50% width | `--color-warning` | "Fair" |
| Good (51-75%) | 75% width | `--status-info` | "Good" |
| Strong (76-100%) | 100% width | `--color-success` | "Strong" |

**Bar spec**: 4px height, `--bg-tertiary` track background, colored fill, 4px border-radius, 300ms width and color transition.

**Requirements checklist**: Each requirement shows a `Check` (green) or `X` (red) icon at 14px + Caption text. Requirements update in real-time as the user types.

### 8.10 Multi-Step Form Layout

For complex forms that span multiple steps (resident onboarding, unit creation with many tabs):

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Step 1         Step 2         Step 3         Step 4 │
│  ● ─────────── ○ ─────────── ○ ─────────── ○       │
│  Unit Details    Residents     Access/FOBs   Review  │
│                                                      │
│  ──────────────────────────────────────────────────  │
│                                                      │
│  [Current step form fields]                          │
│                                                      │
│  ──────────────────────────────────────────────────  │
│                                                      │
│           ◀ Back                     Next Step ▶     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

| Element | Specification |
|---------|---------------|
| Step indicator | Horizontal stepper. Circles (24px) connected by lines. Completed: `--accent` filled. Current: `--accent` ring. Future: `--border-subtle` ring. |
| Step labels | Caption (12px), 500 weight. Active: `--accent`. Completed: `--text-primary`. Future: `--text-secondary`. |
| Step transition | Content crossfades (MI-17 page transition). Stepper indicator animates line fill (200ms). |
| Back button | Secondary button, left side of footer. Hidden on step 1. |
| Next button | Primary button, right side of footer. Changes to "Create" / "Submit" on final step. |
| Validation | Per-step validation. Next button disabled until current step is valid. Errors shown inline. |
| Progress | Mobile: replace stepper with "Step 2 of 4" text + progress bar. |

### 8.11 Form Layout Rules

| Rule | Specification |
|------|---------------|
| **Single column** | All forms are single-column by default. Two-column forms only for short fields that logically pair (Start Time + End Time, First Name + Last Name). |
| **Field width** | Full-width within the form container. Exception: paired short fields (date + time) split 50/50 with 12px gap. |
| **Form max-width** | 560px for modal forms. 680px for page-level forms. Centered horizontally. |
| **Group related fields** | Use a `FormDivider` (1px line with 24px margin) between logical groups. Use a `SectionHeader` (Title 3 + description) for multi-section forms. |
| **Field order** | Most important / most frequently filled fields first. Optional fields last. Long text fields (description, notes) near the bottom. |
| **Auto-focus** | First editable field receives focus on form open. If a form resets (package check-in after success), focus returns to the first field. |
| **Keyboard navigation** | Tab moves between fields in order. Enter submits the form (if all required fields are filled). Escape closes the modal. |
| **Inline actions** | Searchable dropdowns use type-ahead. Unit number fields auto-complete. Carrier fields use visual button selection (not dropdown). |

### 8.12 Specialized Input Patterns

#### Searchable Dropdown (Type-Ahead)

Used for: Unit selection, Resident selection, Staff assignment, Amenity selection.

```
  Unit *
  ┌──────────────────────────────────────┐
  │ 120                               ▾  │  ← User types "120"
  ├──────────────────────────────────────┤
  │ 🏠 1200 — James Park (Owner)        │  ← Matching results
  │ 🏠 1201 — Maria Lopez (Tenant)      │     Max 8 visible, then scroll
  │ 🏠 1205 — Sarah Chen (Owner)        │     Highlight match in bold
  │ 🏠 1208 — Vacant                    │
  └──────────────────────────────────────┘
```

- Dropdown opens on focus if empty, or on first keystroke.
- Results filter as user types. Minimum 0 characters to show all (on focus).
- Maximum 8 results visible before scroll. Total results shown: "Showing 8 of 24 matches."
- Arrow keys navigate. Enter selects. Escape closes.
- Selected value shows as: "1205 — Sarah Chen" in the input field.

#### Visual Button Selector

Used for: Carrier selection (Package check-in), Priority selection, Visitor type, Ban type.

```
  Carrier *
  [Amazon] [FedEx] [UPS] [Canada Post] [Purolator] [Other]
```

- Each option is a pill button (secondary style, 36px height, 12px horizontal padding).
- Selected: `--accent` background, white text, 200ms transition.
- Unselected: `--bg-secondary` background, `--text-primary` text.
- Only one selected at a time (radio behavior).
- Wrap to next line if container is too narrow.

#### Camera/Photo Capture

Used for: Package check-in photo, Vehicle photo, ID photo (key checkout).

```
  Photo (optional)
  ┌──────────────────────────────────┐
  │                                  │
  │         📷  Take Photo           │  ← Large tap target (80px height)
  │         or drag & drop           │     Dashed border, --text-secondary
  │                                  │
  └──────────────────────────────────┘
```

After capture:

```
  Photo (optional)
  ┌──────────┐
  │ 📷       │ ✕  ← Thumbnail (80x80px) with remove button
  │ photo1   │     Click thumbnail → lightbox
  └──────────┘
```

#### Signature Pad

Used for: Key checkout, Package release confirmation.

```
  Signature *
  ┌──────────────────────────────────────────────┐
  │                                              │
  │              ✍ Sign here                     │  ← 200px height canvas
  │                                              │     Dashed border when empty
  │                                              │     Solid border when signed
  └──────────────────────────────────────────────┘
  [Clear]  [Done]                                   ← Ghost buttons below pad
```

- Canvas uses touch and mouse events for drawing.
- Line width: 2px, color: `--text-primary`.
- Speed-sensitive: faster strokes → thinner lines (1px), slower strokes → thicker lines (3px).
- "Clear" removes all strokes. "Done" locks the signature (becomes read-only).
- Stored as PNG data URL or vector path data.

---


## 9. Elevation and Shadow System

### 9.1 Elevation Philosophy

Elevation in Concierge communicates hierarchy and interactivity. Higher elements cast deeper shadows and have higher z-index values. The system uses 6 levels (0-5), each mapped to specific UI contexts.

**Key rule**: Elevation changes communicate interaction. A card lifts on hover (level 1 → 2) to signal it is clickable. A modal sits at level 4 to signal it is above the page content. Elevation is never decorative.

### 9.2 Shadow Definitions

| Level | CSS Box-Shadow | Z-Index Range | Usage |
|-------|---------------|--------------|-------|
| **0** (Ground) | `none` | 0-9 | Flat elements: page content, inputs (default), table rows, static cards |
| **1** (Raised) | `0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04)` | 10-19 | Clickable cards at rest, subtle depth cues |
| **2** (Elevated) | `0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)` | 20-29 | Cards on hover, dropdown menus, popovers at rest |
| **3** (Floating) | `0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)` | 30-39 | Active popovers, floating action bar, tooltips |
| **4** (Overlay) | `0 12px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)` | 40-59 | Modals, slide-over panels, notification center |
| **5** (Top) | `0 20px 40px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08)` | 60-79 | Toast notifications, emergency overlays, drag-in-progress elements |

### 9.3 CSS Custom Properties

```css
:root {
  --shadow-0: none;
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-2: 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-3: 0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-4: 0 12px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
  --shadow-5: 0 20px 40px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08);

  /* Focus ring shadow (additive — combined with element shadow) */
  --shadow-focus: 0 0 0 3px var(--accent-subtle);
  --shadow-focus-error: 0 0 0 3px oklch(0.630 0.215 25.00 / 0.08);
}
```

### 9.4 Z-Index Scale

A managed z-index system prevents stacking context chaos. Every z-index in the codebase must use one of these tokens.

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default stacking |
| `--z-dropdown` | 10 | Dropdown menus, select option lists |
| `--z-sticky` | 20 | Sticky table headers (if ever used), sticky filters |
| `--z-header` | 30 | Top header bar |
| `--z-sidebar` | 40 | Sidebar navigation (overlaps content on mobile) |
| `--z-popover` | 45 | Popovers, booking detail, calendar event detail |
| `--z-overlay` | 50 | Modal backdrop |
| `--z-modal` | 55 | Modal dialog content |
| `--z-slide-over` | 55 | Slide-over panels (same level as modal) |
| `--z-floating-bar` | 58 | Floating action bar (bulk select actions) |
| `--z-toast` | 70 | Toast notifications (above everything) |
| `--z-tooltip` | 80 | Tooltips (absolute highest) |
| `--z-emergency` | 90 | Emergency procedure overlay (nothing above this) |

### 9.5 Elevation Context Guide

| Component | Resting Level | Hover Level | Active Level | Notes |
|-----------|:---:|:---:|:---:|-------|
| Page content | 0 | — | — | No shadow ever |
| Static card (non-clickable) | 0 | — | — | Border provides visual separation |
| Clickable card (KPI, event) | 0 or 1 | 2 | 0 (press) | Lift effect: MI-03 |
| Table row | 0 | 0 | 0 | Background color change only, no shadow |
| Dropdown menu | 2 | — | — | Appears at level 2 |
| Popover | 3 | — | — | Higher than dropdown |
| Tooltip | 3 | — | — | Same as popover |
| Notification panel | 4 | — | — | Slides in as overlay |
| Slide-over panel | 4 | — | — | Package check-in, notifications |
| Modal dialog | 4 | — | — | With backdrop |
| Toast notification | 5 | — | — | Highest persistent element |
| Drag-in-progress card | 5 | — | — | Lifted highest during drag |
| Emergency overlay | 5 | — | — | With darkened backdrop |

### 9.6 Dark Mode Shadow Adjustments

In dark mode, rgba shadows are invisible against dark backgrounds. Replace with:

```css
:root[data-theme="dark"] {
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.20), 0 1px 2px rgba(0, 0, 0, 0.14);
  --shadow-2: 0 2px 4px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.14);
  --shadow-3: 0 4px 8px rgba(0, 0, 0, 0.30), 0 2px 4px rgba(0, 0, 0, 0.16);
  --shadow-4: 0 12px 24px rgba(0, 0, 0, 0.40), 0 4px 8px rgba(0, 0, 0, 0.20);
  --shadow-5: 0 20px 40px rgba(0, 0, 0, 0.50), 0 8px 16px rgba(0, 0, 0, 0.24);
}
```

Additionally, dark mode cards use subtle border (`1px solid var(--border-subtle)`) instead of relying solely on shadow, because shadow contrast is inherently lower on dark backgrounds.

### 9.7 Border Radius by Elevation

Higher elevation elements get larger border radii to maintain visual balance (shadow spread visually enlarges the element):

| Level | Border Radius |
|-------|--------------|
| 0 | Component-specific (input: 10px, badge: 999px, etc.) |
| 1-2 | 12px (cards) |
| 3 | 12px (popovers, floating bars) |
| 4 | 16px (modals, panels) |
| 5 | 16px (toasts, drag items) |

---

## 10. Motion System Summary

### 10.1 Motion Philosophy

Concierge motion serves three purposes:

1. **Feedback**: Confirming that a user action was registered (button press, toggle switch, form submission).
2. **Orientation**: Showing where an element came from and where it is going (modal appears from center, panel slides from right, content slides up on page change).
3. **Continuity**: Maintaining spatial awareness during state changes (sidebar collapses, status badge changes color, tab underline slides).

**The anti-pattern**: Motion that exists to "look cool" without communicating anything. Bouncing logos, rotating decorative elements, parallax scrolling on dashboards — none of these belong in an enterprise management tool.

### 10.2 Spring Physics Defaults

For animations that benefit from natural-feeling motion (sidebar indicator, toggle switch, notification badge bounce), use spring physics rather than CSS easing curves.

| Spring Preset | Stiffness | Damping | Mass | Usage |
|--------------|-----------|---------|------|-------|
| **Responsive** | 300 | 30 | 1 | Sidebar active indicator slide, tab underline |
| **Bouncy** | 400 | 15 | 1 | Notification badge bounce, success checkmark |
| **Gentle** | 200 | 25 | 1 | Content slide transitions, expand/collapse |
| **Stiff** | 500 | 35 | 1 | Button press, instant-feeling interactions |

**CSS approximations** (for when spring physics library is unavailable):

```css
/* Responsive: slight overshoot then settle */
--ease-responsive: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Bouncy: noticeable overshoot */
--ease-bouncy: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Gentle: smooth, no overshoot */
--ease-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Stiff: fast, minimal overshoot */
--ease-stiff: cubic-bezier(0.12, 0.8, 0.32, 1);
```

### 10.3 Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `--duration-instant` | 0ms | Reduced motion replacements |
| `--duration-fast` | 80ms | Button press, checkbox toggle |
| `--duration-normal` | 150ms | Hover states, dropdown open, color transitions |
| `--duration-moderate` | 200ms | Sidebar expand, input focus, accordion |
| `--duration-slow` | 300ms | Modal open, page transition, slide-over |
| `--duration-deliberate` | 500ms | Status badge change (with pulse), complex state transitions |
| `--duration-chart` | 800ms | Chart draw-in animations |
| `--duration-shimmer` | 1500ms | Skeleton loading shimmer (linear, infinite) |

**Rule**: No user-facing animation exceeds 800ms (chart draw-in maximum). The 1500ms shimmer is infinite/looping and does not represent a discrete action.

### 10.4 Easing Functions

| Token | CSS Value | Usage |
|-------|-----------|-------|
| `--ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Elements appearing (fade in, slide in, scale up) |
| `--ease-in` | `cubic-bezier(0.32, 0, 0.67, 0)` | Elements disappearing (fade out, slide out) |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Continuous motion (sidebar width, position changes) |
| `--ease-linear` | `linear` | Progress bars, shimmer, timer countdowns |

### 10.5 Reduced Motion Strategy

All motion respects the `prefers-reduced-motion: reduce` media query. The strategy:

| Motion Type | Reduced Motion Behavior |
|------------|------------------------|
| Fade transitions | Duration reduced to near-instant (10ms) |
| Slide / translate | Removed entirely. Element appears in final position. |
| Scale transforms | Removed entirely. Element appears at final scale. |
| Spring animations | Replaced with instant position change |
| Color transitions | Kept at 100ms (color changes are not motion) |
| Shimmer loading | Static gray background (no animation) |
| Chart draw-in | Charts render at final state instantly |
| Progress/timer bars | Kept (functional, communicates time/progress) |
| Signature pad drawing | Kept (functional, user-initiated) |
| Spinner (Loader2 icon) | Kept (communicates loading state) |

See Section 4.3 for the global CSS implementation.

### 10.6 Motion Choreography Rules

1. **Entrances are slower than exits.** Open: 250ms. Close: 150ms. Users want to see what is appearing. They want departing elements to get out of the way quickly.
2. **Stagger related items.** When multiple items appear simultaneously (table rows loading, dashboard cards entering), stagger by 30ms per item, maximum 10 items staggered. Items 11+ appear with the 10th.
3. **Never animate layout.** Animating width/height causes reflow. Use `transform: scale()` or `clip-path` for size animations. The only exception is sidebar width (handled with will-change).
4. **Content behind modals does not move.** When a modal opens, the background stays fixed. No push, no blur animation on background content. Only the backdrop opacity changes.
5. **Return to sender.** Elements exit in the reverse direction they entered. Modal: scale up to open, scale down to close. Panel: slide in from right, slide out to right. Toast: slide in from top-right, slide out to top-right.

---


## 11. Dark Mode Preparation

### 11.1 Strategy

Dark mode is not in v1 scope, but the design system is built to support it without refactoring. Every color in the system is referenced via CSS custom properties (tokens), and every token has a dark equivalent defined here. When dark mode is enabled (v2+), a single class change on `<html>` activates the entire theme.

### 11.2 Activation Mechanism

```css
/* Three states: light (default), dark (forced), auto (follows OS) */
:root,
:root[data-theme="light"] {
  color-scheme: light;
  /* All light mode tokens (Section 1.10) */
}

:root[data-theme="dark"] {
  color-scheme: dark;
  /* All dark mode tokens below */
}

@media (prefers-color-scheme: dark) {
  :root[data-theme="auto"] {
    color-scheme: dark;
    /* Same dark mode tokens */
  }
}
```

**User setting** (in Settings > Appearance):
- Three-option segmented control: `[Light] [Dark] [Auto]`
- Default: `Light` (for v1 launch)
- Setting stored in `localStorage` and user profile (server-synced for multi-device)

### 11.3 Complete Dark Mode Token Map

#### Backgrounds

| Token | Light Value | Dark Value | Notes |
|-------|-----------|-----------|-------|
| `--bg-primary` | `#FFFFFF` | `#1C1C1E` | Apple dark mode standard |
| `--bg-secondary` | `#F5F5F7` | `#2C2C2E` | Sidebar, section backgrounds |
| `--bg-tertiary` | `#E8E8ED` | `#3A3A3C` | Hover states, disabled inputs |
| `--bg-elevated` | `#FFFFFF` | `#2C2C2E` | Cards in dark mode use elevated bg, not primary |
| `--bg-code` | `#F5F5F7` | `#1A1A1C` | Code blocks, monospace backgrounds |

#### Text

| Token | Light Value | Dark Value | Notes |
|-------|-----------|-----------|-------|
| `--text-primary` | `#1D1D1F` | `#F5F5F7` | Swapped near-black ↔ near-white |
| `--text-secondary` | `#6E6E73` | `#AEAEB2` | Both maintain AA contrast on respective bgs |
| `--text-tertiary` | `#AEAEB2` | `#636366` | Decorative / disabled only |
| `--text-on-accent` | `#FFFFFF` | `#FFFFFF` | White text on accent buttons (same in both) |

#### Borders

| Token | Light Value | Dark Value | Notes |
|-------|-----------|-----------|-------|
| `--border-subtle` | `#E5E5EA` | `#38383A` | Reduced visibility in dark mode |
| `--border-strong` | `#C7C7CC` | `#545458` | For higher-contrast borders when needed |
| `--border-focus` | `#0071E3` | `#0A84FF` | Brighter blue in dark mode for visibility |

#### Accent / Interactive

| Token | Light Value | Dark Value | Notes |
|-------|-----------|-----------|-------|
| `--accent` | `#0071E3` | `#0A84FF` | Apple's dark mode blue — higher lightness |
| `--accent-hover` | `#005BBB` | `#409CFF` | Lighter hover in dark mode |
| `--accent-pressed` | `#004A99` | `#0071E3` | Light mode accent becomes dark mode pressed |
| `--accent-subtle` | `rgba(0,113,227,0.08)` | `rgba(10,132,255,0.15)` | Higher opacity needed on dark backgrounds |

#### Semantic / Status

| Token | Light Value | Dark Value | Notes |
|-------|-----------|-----------|-------|
| `--color-success` | `#047857` | `#34D399` | Lighter green for dark backgrounds |
| `--color-warning` | `#B45309` | `#FBBF24` | Lighter amber for dark backgrounds |
| `--color-error` | `#DC2626` | `#F87171` | Lighter red for dark backgrounds |
| `--color-info` | `#2563EB` | `#60A5FA` | Lighter blue for dark backgrounds |
| `--status-success` | `#10B981` | `#34D399` | Decorative dot/border |
| `--status-warning` | `#F59E0B` | `#FBBF24` | Decorative dot/border |
| `--status-error` | `#EF4444` | `#F87171` | Decorative dot/border |
| `--status-info` | `#3B82F6` | `#60A5FA` | Decorative dot/border |

#### Badge Pairs (Dark Mode)

| Badge | Dark BG | Dark Text | Contrast |
|-------|---------|----------|---------|
| Success | `rgba(52,211,153,0.15)` | `#34D399` | 5.2:1 on dark bg |
| Warning | `rgba(251,191,36,0.15)` | `#FBBF24` | 5.8:1 on dark bg |
| Error | `rgba(248,113,113,0.15)` | `#F87171` | 5.1:1 on dark bg |
| Info | `rgba(96,165,250,0.15)` | `#60A5FA` | 5.4:1 on dark bg |
| Pending | `rgba(99,99,102,0.15)` | `#AEAEB2` | 4.8:1 on dark bg |

### 11.4 Component Adjustments for Dark Mode

| Component | Light Behavior | Dark Adjustment |
|-----------|---------------|-----------------|
| **Cards** | White bg, subtle border, no shadow | `--bg-elevated` bg, `--border-subtle` border, shadow level 1 (dark shadow values) |
| **Inputs** | White bg, subtle border | `--bg-tertiary` bg (darker than card), `--border-subtle` border |
| **Tables** | White bg, row hover to `--bg-secondary` | `--bg-primary` bg, row hover to `--bg-secondary` |
| **Modals** | White bg, dark backdrop | `--bg-elevated` bg, darker backdrop (0.5 opacity) |
| **Sidebar** | `--bg-secondary` bg | `--bg-secondary` bg (naturally dark) |
| **Skeleton loading** | Gray shimmer on white | Lighter gray shimmer on dark |
| **Charts** | Colored on white | Same colors, gridlines use dark `--border-subtle` |
| **Status dots** | Bright colors on white | Same brightness — already high-chroma |
| **Shadows** | Low-opacity black | Higher-opacity black (Section 9.6) |
| **Carrier chips** | Colored bg, colored text | Same — already high contrast internally |
| **Signature pad** | Dark ink on white canvas | White ink on dark canvas (`--text-primary` on `--bg-tertiary`) |

### 11.5 Image and Illustration Handling

| Content Type | Dark Mode Treatment |
|-------------|-------------------|
| **Building photos** (login page) | No change — photos are content |
| **User avatars** | No change — photos are content |
| **Empty state illustrations** | SVG stroke color switches from `--text-tertiary` to dark mode `--text-tertiary`. Accent color stays. |
| **Courier carrier chips** | No change — self-contained color pairs |
| **Document/file icons** | SVG icons adapt via `currentColor` |
| **Uploaded attachment thumbnails** | No change — content images |
| **Chart colors** | No change — chart palette is high-chroma, visible on both |
| **Decorative background patterns** | Opacity reduces from 100% to 60% |

### 11.6 CSS Custom Property Naming Convention

All tokens follow a consistent naming pattern that inherently supports theming:

```
--{category}-{variant}

Categories: bg, text, border, accent, color, status, badge, shadow, chart, event
Variants: primary, secondary, tertiary, subtle, hover, pressed, success, warning, error, info
```

**Rules for adding new tokens:**
1. Always define in BOTH light and dark theme blocks
2. Never hardcode a hex value in a component — always use a token
3. Test every new token against both backgrounds (white #FFFFFF and dark #1C1C1E)
4. Semantic tokens (`--color-success`, `--badge-warning-text`) MUST maintain AA contrast in both modes

### 11.7 Testing Dark Mode

Before shipping dark mode, every page must pass these checks:

| Check | Tool | Pass Criteria |
|-------|------|--------------|
| Text contrast | WCAG contrast checker | All text 4.5:1+ on respective backgrounds |
| Non-text contrast | Manual | Borders, icons 3:1+ on respective backgrounds |
| Badge readability | Visual | All badge text/bg pairs pass AA |
| Chart legibility | Visual | All chart series distinguishable on dark bg |
| Image borders | Visual | Photos don't blend into dark background (add 1px border if needed) |
| Input visibility | Visual | All form inputs clearly distinguishable from card background |
| Shadow visibility | Visual | Cards and elevated elements still look elevated |
| Print preview | Print test | Print stylesheet ignores dark mode (always prints light) |

---

## 12. Print Stylesheet Guidelines

### 12.1 Print Scope

The following content types must print cleanly:

| Content | Triggered By | Expected Output |
|---------|-------------|-----------------|
| **Work orders** | Print button on service request detail | Single-page work order with all details |
| **Package labels** | Print button after package check-in | Small label (4x6 inches) with unit, carrier, ref# |
| **Reports** | Print button on any generated report | Multi-page report with headers, page numbers |
| **Audit logs** | Print button on audit log page | Tabular log output |
| **Unit file summary** | Print button on unit detail page | Single-page summary of unit info |
| **Emergency procedures** | Print button on emergency modal | Multi-page procedures document |
| **Visitor parking permits** | Print button on visitor parking entry | Small permit card |
| **Booking confirmations** | Print button on booking detail | Single-page confirmation |
| **Survey results** | Print button on survey results page | Multi-page with charts rendered as images |

### 12.2 Global Print Rules

```css
@media print {
  /* === HIDE INTERACTIVE ELEMENTS === */
  nav,
  .sidebar,
  .header-bar,
  .bottom-tab-bar,
  .floating-action-bar,
  .toast-container,
  .notification-panel,
  .command-palette,
  .tooltip,
  .dropdown-menu,
  .modal-backdrop,
  button:not(.print-keep),
  .btn:not(.print-keep),
  input,
  select,
  textarea,
  .toggle-switch,
  .search-input,
  .filter-bar,
  .pagination,
  [aria-hidden="true"] {
    display: none !important;
  }

  /* === RESET BACKGROUNDS === */
  * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* === RESTORE SEMANTIC COLORS FOR STATUS === */
  .badge-success { color: #065F46 !important; background: #D1FAE5 !important; }
  .badge-warning { color: #92400E !important; background: #FEF3C7 !important; }
  .badge-error { color: #991B1B !important; background: #FEE2E2 !important; }
  .badge-info { color: #1D4ED8 !important; background: #DBEAFE !important; }
  .badge-pending { color: #374151 !important; background: #F3F4F6 !important; }

  /* === TYPOGRAPHY === */
  body {
    font: 400 11pt/1.5 "Inter", "Helvetica Neue", Arial, sans-serif;
    color: #000000;
    max-width: none;
  }

  h1 { font-size: 18pt; font-weight: 700; margin-top: 12pt; margin-bottom: 6pt; }
  h2 { font-size: 14pt; font-weight: 600; margin-top: 10pt; margin-bottom: 4pt; }
  h3 { font-size: 12pt; font-weight: 600; margin-top: 8pt; margin-bottom: 4pt; }

  .mono, .ref-number, .license-plate, .unit-number {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 10pt;
  }

  /* === TABLES === */
  table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  th {
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    padding: 6pt 8pt;
    border-bottom: 2pt solid #000;
    text-align: left;
  }

  td {
    font-size: 10pt;
    padding: 4pt 8pt;
    border-bottom: 0.5pt solid #CCCCCC;
    vertical-align: top;
  }

  /* === IMAGES === */
  img {
    max-width: 100% !important;
    page-break-inside: avoid;
  }

  /* Charts: rendered as raster images for print fidelity */
  .chart-container {
    page-break-inside: avoid;
  }

  /* === PAGE LAYOUT === */
  @page {
    size: letter;
    margin: 0.75in;
  }

  @page :first {
    margin-top: 1in;
  }

  /* === LINKS === */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 8pt;
    color: #666666 !important;
  }

  /* Don't expand internal links */
  a[href^="/"]:after,
  a[href^="#"]:after {
    content: "";
  }
}
```

### 12.3 Print Header and Footer

Every printed page includes:

```
┌──────────────────────────────────────────────────────────────┐
│  ◉ Concierge    Bond Tower    Report: Service Request #4521  │  ← Header
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  [Page content]                                              │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│  Printed on March 16, 2026 at 3:45 PM    Page 1 of 3        │  ← Footer
│  Confidential — Property Management Use Only                 │
└──────────────────────────────────────────────────────────────┘
```

| Element | Implementation |
|---------|---------------|
| **Header** | Generated via `@page` margin content or a `.print-header` div that is `display: none` on screen and `display: block` in print. |
| **Logo** | Concierge logo, grayscale (black), 20pt height. |
| **Building name** | Body weight, 10pt. |
| **Document title** | Bold, 10pt. Dynamically set based on what is being printed. |
| **Footer left** | Timestamp: "Printed on [date] at [time]" — 8pt, gray. |
| **Footer right** | Page counter: "Page X of Y" — 8pt, gray. Uses CSS `counter(page)` / `counter(pages)`. |
| **Confidentiality notice** | "Confidential — Property Management Use Only" — 7pt, gray, centered below page counter. |

### 12.4 Page Break Rules

```css
@media print {
  /* Force page break before these elements */
  .page-break-before {
    page-break-before: always;
    break-before: page;
  }

  /* Prevent orphaned headings */
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Keep card content together */
  .card, .section, .form-group {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Keep table rows together (avoid splitting a row across pages) */
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Charts never split */
  .chart-container, .kpi-card-row {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

### 12.5 Specific Print Templates

#### Work Order (Service Request Print)

```
┌──────────────────────────────────────────────────────────┐
│  ◉ Concierge — Work Order                                │
│  ────────────────────────────────────────────────────    │
│                                                          │
│  Request #: SR-4521            Date: March 13, 2026      │
│  Priority:  ● HIGH             Status: In Progress       │
│  Category:  Plumbing           Assigned: Mike (Maint.)   │
│                                                          │
│  UNIT                                                    │
│  Unit 1205 — Sarah Chen (Owner)                         │
│  Phone: 416-555-0123                                     │
│  Entry Authorized: Yes                                   │
│                                                          │
│  DESCRIPTION                                             │
│  Kitchen faucet has been dripping for 2 days.            │
│  Constant drip, even when handles fully closed.          │
│                                                          │
│  ATTACHMENTS                                             │
│  [photo1.jpg — thumbnail]  [photo2.jpg — thumbnail]     │
│                                                          │
│  ACTIVITY LOG                                            │
│  Mar 13, 10:45 AM — Mike assigned himself                │
│  Mar 13, 10:30 AM — Status changed to In Progress       │
│  Mar 13, 8:15 AM  — Sarah created request                │
│                                                          │
│  NOTES FOR TECHNICIAN                                    │
│  ___________________________________________________     │
│  ___________________________________________________     │
│  ___________________________________________________     │
│                                                          │
│  COMPLETION                                              │
│  Completed by: ________________  Date: _______________   │
│  Signature:    ________________                          │
│                                                          │
│  ────────────────────────────────────────────────────    │
│  Printed March 16, 2026 at 3:45 PM         Page 1 of 1  │
└──────────────────────────────────────────────────────────┘
```

**Work order includes** blank lines for technician notes and completion signature — these are printed but not present in the digital view.

#### Package Label (Small Format)

```
┌──────────────────────────────────┐
│                                  │
│  UNIT 1205                       │  ← Large, bold, 24pt
│  Sarah Chen                      │  ← 14pt
│                                  │
│  📦 FedEx                        │  ← Carrier
│  REF: PKG-2026-0341             │  ← Monospace, 12pt
│  Checked in: Mar 16, 10:15 AM   │  ← 10pt
│                                  │
│  Storage: Locker B-12            │  ← 12pt, bold
│                                  │
│  ░░░░░░░░░░░░░░░░░░             │  ← Barcode (if tracking # available)
│                                  │
└──────────────────────────────────┘
```

**Page setup for labels**:
```css
@page label {
  size: 4in 6in;
  margin: 0.25in;
}
.package-label {
  page: label;
}
```

#### Report (Multi-Page)

Reports use `@page :first` for a title page, then content pages:

- **Title page**: Report name, date range, building name, generated by, timestamp.
- **Content pages**: Tables with repeated headers (`thead { display: table-header-group; }`), charts as raster images.
- **Charts in print**: Before printing, charts are rendered to canvas and exported as PNG. SVG-based charts use a print-specific stylesheet that removes interactivity, ensures all text is black, and converts colored fills to patterns for grayscale printers.

### 12.6 Print-Specific Color Rules

| Element | Screen Color | Print Color |
|---------|-------------|------------|
| Body text | `--text-primary` (#1D1D1F) | Pure black (#000000) |
| Secondary text | `--text-secondary` (#6E6E73) | Dark gray (#444444) |
| Links | `--accent` (#0071E3) | Black with underline + URL suffix |
| Status badges | Colored bg + colored text | Same colors preserved (they print well) |
| Card borders | `--border-subtle` (#E5E5EA) | Medium gray (#CCCCCC) |
| Table headers | `--bg-secondary` bg | White bg, 2pt black bottom border |
| Chart colors | Colorblind-safe palette | Patterns added for grayscale: stripes, dots, crosshatch |
| Event card accent borders | 3px colored left border | Preserved (prints as solid color) |
| Priority dots | Colored circles | Preserved + text label added in print |

### 12.7 Print Testing Checklist

Before any page is considered "print-ready," verify:

| Check | Pass Criteria |
|-------|--------------|
| No interactive elements visible | Buttons, inputs, dropdowns, filters all hidden |
| Header and footer present | Logo, building name, document title, page numbers |
| Page breaks logical | No orphaned headings, no split table rows |
| Tables readable | Headers repeat on each page, columns fit within margins |
| Charts legible | All series distinguishable in grayscale |
| Images sized | No images overflow margins |
| Fonts load | Print-safe fallback fonts specified |
| Status badges readable | Color + text label (not color alone) |
| Monospace content preserved | Ref numbers, license plates use monospace |
| Dark mode ignored | Always prints light theme regardless of user setting |

---

## Appendix A: CSS Custom Property Complete Reference

This appendix lists EVERY CSS custom property defined in the design system for quick developer reference. Properties are grouped by category and listed with their light mode values.

### A.1 Color Tokens

```css
:root {
  /* Backgrounds */
  --bg-primary:          #FFFFFF;
  --bg-secondary:        #F5F5F7;
  --bg-tertiary:         #E8E8ED;
  --bg-elevated:         #FFFFFF;  /* Different in dark mode */
  --bg-code:             #F5F5F7;

  /* Text */
  --text-primary:        #1D1D1F;
  --text-secondary:      #6E6E73;
  --text-tertiary:       #AEAEB2;
  --text-disabled:       #AEAEB2;
  --text-on-accent:      #FFFFFF;

  /* Borders */
  --border-subtle:       #E5E5EA;
  --border-strong:       #C7C7CC;
  --border-focus:        #0071E3;

  /* Accent / Interactive */
  --accent:              #0071E3;
  --accent-hover:        #005BBB;
  --accent-pressed:      #004A99;
  --accent-subtle:       rgba(0, 113, 227, 0.08);

  /* Semantic (text-safe on white) */
  --color-success:       #047857;
  --color-warning:       #B45309;
  --color-error:         #DC2626;
  --color-info:          #2563EB;

  /* Status (decorative — dots, borders, fills) */
  --status-success:      #10B981;
  --status-success-bg:   rgba(16, 185, 129, 0.10);
  --status-warning:      #F59E0B;
  --status-warning-bg:   rgba(245, 158, 11, 0.10);
  --status-error:        #EF4444;
  --status-error-bg:     rgba(239, 68, 68, 0.10);
  --status-info:         #3B82F6;
  --status-info-bg:      rgba(59, 130, 246, 0.10);

  /* Badge pairs */
  --badge-success-bg:    #D1FAE5;
  --badge-success-text:  #065F46;
  --badge-warning-bg:    #FEF3C7;
  --badge-warning-text:  #92400E;
  --badge-error-bg:      #FEE2E2;
  --badge-error-text:    #991B1B;
  --badge-info-bg:       #DBEAFE;
  --badge-info-text:     #1D4ED8;
  --badge-pending-bg:    #F3F4F6;
  --badge-pending-text:  #374151;

  /* Event type accents (decorative only) */
  --event-package:       #3B82F6;
  --event-visitor:       #10B981;
  --event-incident:      #EF4444;
  --event-cleaning:      #06B6D4;
  --event-key:           #8B5CF6;
  --event-passon:        #F59E0B;
  --event-maintenance:   #F97316;
  --event-parking:       #6366F1;

  /* Chart palette */
  --chart-1:             #0071E3;
  --chart-2:             #F97316;
  --chart-3:             #7C3AED;
  --chart-4:             #0891B2;
  --chart-5:             #DB2777;
  --chart-6:             #65A30D;
  --chart-other:         #AEAEB2;
}
```

### A.2 Typography Tokens

```css
:root {
  --font-display:        "Inter Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-body:           "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono:           "JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Mono", monospace;
}
```

### A.3 Spacing Tokens

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-7:  32px;
  --space-8:  40px;
  --space-9:  48px;
  --space-10: 64px;
}
```

### A.4 Shadow Tokens

```css
:root {
  --shadow-0: none;
  --shadow-1: 0 1px 2px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-2: 0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-3: 0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-4: 0 12px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
  --shadow-5: 0 20px 40px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08);
  --shadow-focus: 0 0 0 3px var(--accent-subtle);
  --shadow-focus-error: 0 0 0 3px rgba(239,68,68,0.08);
}
```

### A.5 Z-Index Tokens

```css
:root {
  --z-base:          0;
  --z-dropdown:      10;
  --z-sticky:        20;
  --z-header:        30;
  --z-sidebar:       40;
  --z-popover:       45;
  --z-overlay:       50;
  --z-modal:         55;
  --z-slide-over:    55;
  --z-floating-bar:  58;
  --z-toast:         70;
  --z-tooltip:       80;
  --z-emergency:     90;
}
```

### A.6 Motion Tokens

```css
:root {
  --duration-instant:    0ms;
  --duration-fast:       80ms;
  --duration-normal:     150ms;
  --duration-moderate:   200ms;
  --duration-slow:       300ms;
  --duration-deliberate: 500ms;
  --duration-chart:      800ms;
  --duration-shimmer:    1500ms;

  --ease-out:     cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in:      cubic-bezier(0.32, 0, 0.67, 0);
  --ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1);
  --ease-linear:  linear;

  --ease-responsive: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bouncy:     cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-gentle:     cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-stiff:      cubic-bezier(0.12, 0.8, 0.32, 1);

  --focus-ring-width:  3px;
  --focus-ring-offset: 0px;
}
```

### A.7 Border Radius Tokens

```css
:root {
  --radius-sm:   4px;    /* Badges, small buttons, checkboxes */
  --radius-md:   8px;    /* Buttons, segmented controls */
  --radius-lg:   10px;   /* Inputs, cards (default) */
  --radius-xl:   12px;   /* Cards at elevation, larger containers */
  --radius-2xl:  16px;   /* Modals, large panels */
  --radius-full: 9999px; /* Pills, avatars, status dots, toggles */
}
```

---

## Appendix B: Design System Versioning

| Version | Date | Scope |
|---------|------|-------|
| v1.0 | 2026-03-14 | Foundation: colors, typography, spacing, components, page specs (2,243 lines) |
| v2.0 | 2026-03-16 | Expansion: OKLCH colors, extended typography, icon mapping, micro-interactions, component composition, data visualization, empty states, form catalog, elevation, motion, dark mode, print (this document) |

**How to use both documents:**
1. **For page layouts and feature specs** → Read v1 (`docs/DESIGN-SYSTEM.md`)
2. **For implementation details** (exact tokens, animation timings, component composition, accessibility) → Read this v2 document
3. **For visual inspiration and design direction** → Read `docs/DESIGN-INSPIRATION.md`

All three documents are complementary. There is no conflict between them. Where v2 provides more specific values than v1 (e.g., OKLCH color definitions vs hex-only), v2 takes precedence for implementation.

---

*Last updated: 2026-03-16*
*Total specifications: 12 sections + 2 appendices*
*Color tokens: 65+ (with OKLCH, hex, and CSS custom property for each)*
*Icon mappings: 140+*
*Micro-interactions: 34 defined*
*Form input states: 7 per input type*
*Print templates: 3 detailed*
*Design philosophy: Apple-grade minimalism — now implementation-ready*

---

## Appendix C: Component State Matrix

This appendix documents every visual state for every interactive component. Use this as a QA checklist — every cell must be implemented and tested.

### C.1 Button States

#### Primary Button

| State | Background | Text Color | Border | Shadow | Transform | Cursor | Opacity |
|-------|-----------|-----------|--------|--------|-----------|--------|---------|
| Default | `--accent` | `--text-on-accent` | none | `--shadow-0` | none | pointer | 1.0 |
| Hover | `--accent-hover` | `--text-on-accent` | none | `--shadow-1` | none | pointer | 1.0 |
| Focus (keyboard) | `--accent` | `--text-on-accent` | none | `--shadow-focus` | none | pointer | 1.0 |
| Active / Pressed | `--accent-pressed` | `--text-on-accent` | none | `--shadow-0` | `scale(0.97)` | pointer | 1.0 |
| Loading | `--accent` | hidden | none | `--shadow-0` | none | wait | 1.0 |
| Disabled | `--accent` | `--text-on-accent` | none | `--shadow-0` | none | not-allowed | 0.4 |

**Loading state details:**
- Label text is replaced by a 20px spinning `Loader2` icon (white)
- Button width is frozen at its pre-loading width (no layout shift)
- `pointer-events: none` prevents double-submit
- Minimum loading display: 400ms (even if API responds faster, to prevent flash)

#### Secondary Button

| State | Background | Text Color | Border | Shadow | Transform | Cursor | Opacity |
|-------|-----------|-----------|--------|--------|-----------|--------|---------|
| Default | transparent | `--text-primary` | 1px `--border-subtle` | `--shadow-0` | none | pointer | 1.0 |
| Hover | `--accent-subtle` | `--text-primary` | 1px `--border-subtle` | `--shadow-0` | none | pointer | 1.0 |
| Focus (keyboard) | transparent | `--text-primary` | 1px `--border-focus` | `--shadow-focus` | none | pointer | 1.0 |
| Active / Pressed | `--bg-tertiary` | `--text-primary` | 1px `--border-subtle` | `--shadow-0` | `scale(0.97)` | pointer | 1.0 |
| Loading | transparent | hidden | 1px `--border-subtle` | `--shadow-0` | none | wait | 1.0 |
| Disabled | transparent | `--text-tertiary` | 1px `--bg-tertiary` | `--shadow-0` | none | not-allowed | 0.5 |

#### Ghost Button

| State | Background | Text Color | Border | Shadow | Transform | Cursor | Opacity |
|-------|-----------|-----------|--------|--------|-----------|--------|---------|
| Default | transparent | `--accent` | none | none | none | pointer | 1.0 |
| Hover | `--accent-subtle` | `--accent` | none | none | none | pointer | 1.0 |
| Focus (keyboard) | transparent | `--accent` | none | `--shadow-focus` | none | pointer | 1.0 |
| Active / Pressed | `--accent-subtle` | `--accent-pressed` | none | none | `scale(0.97)` | pointer | 1.0 |
| Disabled | transparent | `--text-tertiary` | none | none | none | not-allowed | 0.5 |

#### Destructive Button

| State | Background | Text Color | Border | Shadow | Transform | Cursor | Opacity |
|-------|-----------|-----------|--------|--------|-----------|--------|---------|
| Default | `--color-error` | `#FFFFFF` | none | `--shadow-0` | none | pointer | 1.0 |
| Hover | `oklch(0.505 0.190 25.00)` (#B91C1C) | `#FFFFFF` | none | `--shadow-1` | none | pointer | 1.0 |
| Focus (keyboard) | `--color-error` | `#FFFFFF` | none | `--shadow-focus-error` | none | pointer | 1.0 |
| Active / Pressed | `oklch(0.440 0.155 25.00)` (#991B1B) | `#FFFFFF` | none | `--shadow-0` | `scale(0.97)` | pointer | 1.0 |
| Disabled | `--color-error` | `#FFFFFF` | none | `--shadow-0` | none | not-allowed | 0.4 |

#### Icon Button (Round)

| State | Background | Icon Color | Border | Shadow | Size |
|-------|-----------|-----------|--------|--------|------|
| Default | `--bg-secondary` | `--text-secondary` | none | none | 36x36px |
| Hover | `--bg-tertiary` | `--text-primary` | none | none | 36x36px |
| Focus | `--bg-secondary` | `--text-secondary` | none | `--shadow-focus` | 36x36px |
| Active | `--bg-tertiary` | `--text-primary` | none | none | 34x34px (scale 0.94) |
| Disabled | `--bg-secondary` | `--text-tertiary` | none | none | 36x36px, opacity 0.5 |

### C.2 Checkbox States

| State | Box Background | Box Border | Check Icon | Label Color |
|-------|---------------|-----------|-----------|------------|
| Unchecked | `--bg-primary` | 1.5px `--border-strong` | hidden | `--text-primary` |
| Unchecked:hover | `--bg-primary` | 1.5px `--accent` | hidden | `--text-primary` |
| Unchecked:focus | `--bg-primary` | 1.5px `--accent` | hidden, focus ring | `--text-primary` |
| Checked | `--accent` | none | `Check` (12px, white) | `--text-primary` |
| Checked:hover | `--accent-hover` | none | `Check` (12px, white) | `--text-primary` |
| Indeterminate | `--accent` | none | `Minus` (12px, white) | `--text-primary` |
| Disabled unchecked | `--bg-tertiary` | 1.5px `--bg-tertiary` | hidden | `--text-tertiary` |
| Disabled checked | `--accent` at 40% | none | `Check` (12px, white) | `--text-tertiary` |
| Error | `--bg-primary` | 1.5px `--color-error` | hidden | `--text-primary` |

**Animation**: On check, the checkmark draws from center-left to bottom to top-right over 150ms ease-out (stroke-dashoffset technique). On uncheck, instant hide (no reverse animation).

### C.3 Radio Button States

| State | Circle Background | Circle Border | Inner Dot | Label Color |
|-------|------------------|-------------|----------|------------|
| Unselected | `--bg-primary` | 1.5px `--border-strong` | hidden | `--text-primary` |
| Unselected:hover | `--bg-primary` | 1.5px `--accent` | hidden | `--text-primary` |
| Selected | `--bg-primary` | 1.5px `--accent` | 8px `--accent` filled circle | `--text-primary` |
| Selected:hover | `--bg-primary` | 1.5px `--accent-hover` | 8px `--accent-hover` | `--text-primary` |
| Disabled unselected | `--bg-tertiary` | 1.5px `--bg-tertiary` | hidden | `--text-tertiary` |
| Disabled selected | `--bg-tertiary` | 1.5px `--accent` at 40% | 8px `--accent` at 40% | `--text-tertiary` |

**Animation**: Inner dot scales from 0 to 1.0 with 150ms `--ease-responsive` (slight bounce).

### C.4 Toggle Switch States

| State | Track Background | Knob Position | Knob Shadow | Label |
|-------|-----------------|--------------|------------|-------|
| Off | `--bg-tertiary` | Left (translateX 0) | `--shadow-1` | Label text, `--text-primary` |
| Off:hover | `--border-strong` | Left | `--shadow-2` | Label text |
| On | `--accent` | Right (translateX 20px) | `--shadow-1` | Label text |
| On:hover | `--accent-hover` | Right | `--shadow-2` | Label text |
| Off:focus | `--bg-tertiary` | Left | Focus ring | Label text |
| On:focus | `--accent` | Right | Focus ring | Label text |
| Disabled:off | `--bg-tertiary` at 50% | Left | none | `--text-tertiary` |
| Disabled:on | `--accent` at 40% | Right | none | `--text-tertiary` |

**Dimensions**: Track: 48w x 28h px, border-radius 14px. Knob: 24x24px circle, 2px inset from track edges.
**Animation**: Knob slides with 200ms `--ease-responsive`. Track color transitions with 200ms ease.

### C.5 Segmented Control States

Used for: view switchers (Month/Week/Day), priority selection (Low/Medium/High), visitor type selection.

| State | Segment Background | Segment Text | Indicator |
|-------|-------------------|-------------|-----------|
| Inactive | transparent | `--text-secondary` | none |
| Inactive:hover | `--bg-secondary` | `--text-primary` | none |
| Active | `--accent` | `--text-on-accent` | White pill background behind text |
| Focus (keyboard on segment) | transparent | `--text-secondary` | Focus ring around control |
| Disabled segment | transparent | `--text-tertiary` | none, cursor: not-allowed |

**Container**: Height 40px, background `--bg-secondary`, border-radius 8px, padding 4px internal.
**Active indicator**: White pill (`--bg-primary`), border-radius 6px, slides horizontally to active segment with 200ms `--ease-responsive`.

### C.6 Tab States

| State | Text Color | Text Weight | Underline | Background |
|-------|-----------|------------|-----------|-----------|
| Inactive | `--text-secondary` | 400 | none | transparent |
| Inactive:hover | `--text-primary` | 400 | none | `--bg-secondary` (subtle) |
| Active | `--accent` | 600 | 2px solid `--accent` | transparent |
| Focus (keyboard) | `--text-secondary` | 400 | none | Focus ring |
| Disabled | `--text-tertiary` | 400 | none | transparent |

**Underline animation**: Slides from previous active tab to new tab with 250ms spring (MI-27). Width matches text width, not tab width.

### C.7 Badge States

Badges are non-interactive and have only one state per type (no hover/focus). They communicate status through color.

| Badge Type | Background | Text Color | Dot Color | Text |
|-----------|-----------|-----------|----------|------|
| Active / Open | `--badge-info-bg` | `--badge-info-text` | `--status-info` | "Active" / "Open" |
| In Progress | `--badge-warning-bg` | `--badge-warning-text` | `--status-warning` | "In Progress" |
| Resolved / Closed | `--badge-success-bg` | `--badge-success-text` | `--status-success` | "Resolved" / "Closed" |
| Urgent / Critical | `--badge-error-bg` | `--badge-error-text` | `--status-error` | "Urgent" / "Critical" |
| Pending | `--badge-pending-bg` | `--badge-pending-text` | `--text-tertiary` | "Pending" |
| Draft | `--badge-pending-bg` | `--badge-pending-text` | none | "Draft" |
| Expired | `--badge-error-bg` | `--badge-error-text` | `--status-error` | "Expired" |
| Scheduled | `--badge-info-bg` | `--badge-info-text` | `--status-info` | "Scheduled" |
| Confirmed | `--badge-success-bg` | `--badge-success-text` | `--status-success` | "Confirmed" |
| Cancelled | `--badge-error-bg` | `--badge-error-text` | `--status-error` | "Cancelled" |
| Compliant | `--badge-success-bg` | `--badge-success-text` | `--status-success` | "Compliant" |
| Non-Compliant | `--badge-error-bg` | `--badge-error-text` | `--status-error` | "Non-Compliant" |
| Expiring Soon | `--badge-warning-bg` | `--badge-warning-text` | `--status-warning` | "Expiring Soon" |
| Vacant | `--badge-pending-bg` | `--badge-pending-text` | none | "Vacant" |
| Occupied | `--badge-success-bg` | `--badge-success-text` | none | "Occupied" |
| Checked In | `--badge-success-bg` | `--badge-success-text` | `--status-success` | "Checked In" |
| Checked Out | `--badge-warning-bg` | `--badge-warning-text` | `--status-warning` | "Checked Out" |
| Released | `--badge-success-bg` | `--badge-success-text` | `--status-success` | "Released" |
| Pending Release | `--badge-warning-bg` | `--badge-warning-text` | `--status-warning` | "Pending Release" |
| Approved | `--badge-success-bg` | `--badge-success-text` | `--status-success` | "Approved" |
| Rejected | `--badge-error-bg` | `--badge-error-text` | `--status-error` | "Rejected" |
| Under Review | `--badge-warning-bg` | `--badge-warning-text` | `--status-warning` | "Under Review" |

**Badge anatomy**: `padding: 2px 10px; border-radius: 999px; font: 500 12px/16px Inter; display: inline-flex; align-items: center; gap: 6px;`
**Dot**: 6px circle, same semantic color, placed before text.

---

## Appendix D: Responsive Breakpoint Behavior Matrix

This appendix provides a complete lookup table for how every major UI element behaves at each breakpoint.

### D.1 Navigation

| Element | Desktop XL (>1440) | Desktop (1280-1440) | Tablet (768-1279) | Mobile (<768) |
|---------|:---:|:---:|:---:|:---:|
| Sidebar | 240px expanded | 240px (auto-collapse option) | Hidden, hamburger trigger | Hidden, bottom tab bar |
| Sidebar labels | Visible | Visible | N/A (hidden) | N/A |
| Sidebar tooltips | On collapse only | On collapse only | N/A | N/A |
| Top header | Full width minus sidebar | Full width minus sidebar | Full width | Full width, simplified |
| Command palette | Full Spotlight overlay | Full Spotlight overlay | Full Spotlight overlay | Full-screen search |
| Notification panel | 320px slide-in from right | 320px slide-in | 320px slide-in | Full-screen sheet |
| Bottom tab bar | Hidden | Hidden | Hidden | 56px fixed bottom |
| Breadcrumbs | Visible (full path) | Visible | Visible (truncated) | Hidden or 1-level |

### D.2 Content Layout

| Element | Desktop XL | Desktop | Tablet | Mobile |
|---------|:---:|:---:|:---:|:---:|
| Grid columns | 12 | 12 | 8 | 4 |
| Content max-width | 1440px | 1440px | 100% | 100% |
| Content padding | 32px | 32px | 24px | 16px |
| Grid gap | 24px | 24px | 20px | 16px |
| KPI cards per row | 4 | 3-4 | 2 | 1 (horizontal scroll option) |
| Chart width | 6 or 12 cols | 6 or 12 cols | 12 cols | 12 cols (simplified) |
| Two-panel layouts | Side-by-side | Side-by-side | Stacked or drawer | Stacked |

### D.3 Tables

| Element | Desktop XL | Desktop | Tablet | Mobile |
|---------|:---:|:---:|:---:|:---:|
| Display mode | Full table | Full table | Table (hide 1-2 cols) | Card list |
| Row height | 56px | 56px | 56px | Variable (card) |
| Checkbox column | Visible | Visible | Visible | Swipe gesture |
| Actions column | Visible | Visible | Visible | In card footer |
| Sort | Column click | Column click | Column click | Dropdown selector |
| Pagination | Full (page nums) | Full | Simplified (prev/next) | Simplified |
| Search | Inline above table | Inline | Inline | Full-width |
| Filter bar | Horizontal chips | Horizontal chips | Dropdown filter | Bottom sheet filter |

### D.4 Forms

| Element | Desktop XL | Desktop | Tablet | Mobile |
|---------|:---:|:---:|:---:|:---:|
| Modal size | As specified (400-720px) | As specified | 90vw | Full-screen sheet |
| Form width | max 560px centered | max 560px | 90vw | 100% |
| Field layout | Single column (default) | Single column | Single column | Single column |
| Paired fields (date+time) | Side by side 50/50 | Side by side | Side by side | Stacked full-width |
| Submit buttons | Bottom-right | Bottom-right | Bottom-right | Full-width sticky bottom |
| File upload | Drag-drop zone | Drag-drop zone | Drag-drop zone | Camera button prominent |
| Signature pad | 200px height | 200px height | 200px height | 150px height |

### D.5 Cards

| Element | Desktop XL | Desktop | Tablet | Mobile |
|---------|:---:|:---:|:---:|:---:|
| Card grid columns | auto-fill, min 280px | auto-fill, min 280px | 2 columns | 1 column |
| Card image ratio | 16:9 | 16:9 | 16:9 | 16:9 |
| KPI card sparkline | Visible | Visible | Visible | Hidden (number + trend only) |
| Event card details | Full | Full | Truncated | Truncated + expand |
| Card actions | Visible on hover | Visible on hover | Always visible | Always visible |

### D.6 Calendar (Amenity Booking)

| Element | Desktop XL | Desktop | Tablet | Mobile |
|---------|:---:|:---:|:---:|:---:|
| Default view | Week | Week | Day | Date scroller + time slots |
| Filter panel | 280px visible | 280px visible | Collapsed (icon toggle) | Bottom sheet |
| Mini calendar | Visible | Visible | Hidden | Hidden |
| Booking popover | Anchored to slot | Anchored to slot | Anchored | Full-screen sheet |
| Time slot height | 60px per hour | 60px per hour | 60px per hour | List items (48px) |

---

## Appendix E: Keyboard Shortcut Reference

All keyboard shortcuts for power users (front desk staff, property managers). These are discoverable via the Command Palette (Cmd+K).

### E.1 Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette | Any page |
| `[` | Toggle sidebar collapse/expand | Any page |
| `Escape` | Close current modal, popover, or panel | When overlay is open |
| `Cmd+/` / `Ctrl+/` | Open keyboard shortcut reference | Any page |
| `G then D` | Go to Dashboard | Sequential press |
| `G then P` | Go to Packages | Sequential press |
| `G then S` | Go to Service Requests | Sequential press |
| `G then A` | Go to Amenities | Sequential press |
| `G then U` | Go to Units | Sequential press |
| `G then R` | Go to Reports | Sequential press |
| `G then X` | Go to Security | Sequential press |
| `G then N` | Go to Announcements | Sequential press |
| `G then T` | Go to Settings | Sequential press |

### E.2 Page-Specific Shortcuts

| Page | Shortcut | Action |
|------|----------|--------|
| Packages | `N` | New package check-in |
| Packages | `R` | Release selected package(s) |
| Service Requests | `N` | New service request |
| Service Requests | `V` | Toggle Board/List view |
| Amenities | `N` | New booking |
| Amenities | `T` | Jump to today |
| Amenities | `1` / `2` / `3` | Switch to Month / Week / Day view |
| Announcements | `N` | New announcement |
| Security | `P` | New visitor parking |
| Security | `K` | New key checkout |
| Units | `/` | Focus unit search |
| Any table | `J` / `K` | Navigate rows down / up |
| Any table | `Enter` | Open selected row |
| Any table | `X` | Toggle row selection |
| Any table | `Cmd+A` | Select all rows |

### E.3 Form Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `Enter` | Submit form (when all required fields filled) |
| `Escape` | Cancel / close form |
| `Space` | Toggle checkbox or toggle switch |
| `Arrow Up/Down` | Navigate dropdown options |
| `Enter` | Select highlighted dropdown option |

### E.4 Command Palette Navigation

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Navigate suggestions |
| `Enter` | Execute selected action |
| `Escape` | Close palette |
| `Backspace` (on empty input) | Go back to previous palette level |
| `Tab` | Auto-complete highlighted suggestion |

---

## Appendix F: Accessibility Implementation Checklist

Every component and page must meet these requirements. This checklist extends v1 Section 11 with implementation-specific details.

### F.1 Color and Contrast

| Requirement | Standard | Test Method |
|------------|---------|------------|
| Body text contrast | 4.5:1 minimum (WCAG AA) | Automated: axe-core, Lighthouse |
| Large text contrast (18px+ or 14px+ bold) | 3:1 minimum | Automated |
| Non-text contrast (icons, borders, focus rings) | 3:1 minimum | Manual + automated |
| Status never by color alone | Text label or icon always accompanies color | Manual review |
| Focus indicator visible | 3px accent ring, 3:1 contrast against background | Manual |
| High contrast mode | All text 7:1+ (AAA) | Automated with HC mode enabled |
| Dark mode contrast | All tokens verified against dark backgrounds | Automated |

### F.2 Keyboard Navigation

| Requirement | Implementation |
|------------|---------------|
| All interactive elements focusable | `tabindex="0"` where needed, native elements preferred |
| Logical tab order | Matches visual left-to-right, top-to-bottom order |
| Focus trap in modals | Tab cycles within modal while open. `focus-trap` library. |
| Skip to main content | Hidden skip link, visible on focus: "Skip to main content" |
| Dropdown keyboard | Arrow keys navigate, Enter selects, Escape closes |
| Calendar keyboard | Arrow keys move between dates, Enter selects, Page Up/Down for months |
| Drag-and-drop alternative | Keyboard-accessible move actions (context menu or dedicated buttons) |
| Custom shortcuts documented | Command Palette lists all shortcuts |

### F.3 Screen Reader Support

| Requirement | Implementation |
|------------|---------------|
| All images have alt text | `alt=""` for decorative, descriptive for content |
| Icons have labels | `aria-label` on all icon-only buttons |
| Dynamic content announced | `aria-live="polite"` for toasts, `aria-live="assertive"` for errors |
| Form errors linked | `aria-describedby` links input to error message element |
| Required fields | `aria-required="true"` on required inputs |
| Modal role | `role="dialog"` with `aria-modal="true"` and `aria-labelledby` |
| Table semantics | `<table>`, `<thead>`, `<tbody>`, `<th scope="col">` — not divs |
| Status badges | `role="status"` or SR-only text: "Status: In Progress" |
| Progress indicators | `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Tab panels | `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected` |
| Sorted columns | `aria-sort="ascending"` / `"descending"` on active sort column |
| Selected rows | `aria-selected="true"` on selected table rows |
| Loading states | `aria-busy="true"` on containers while loading |
| Chart descriptions | `aria-label` with text summary: "Bar chart showing 47 packages this week, up 12% from last week" |

### F.4 Touch and Pointer

| Requirement | Implementation |
|------------|---------------|
| Touch target minimum | 44x44px on all interactive elements |
| Spacing between targets | 8px minimum between adjacent tap targets |
| No hover-only functionality | Everything accessible via hover MUST also work via click/tap |
| Swipe actions | Always provide a visible button alternative |
| Drag-and-drop | Touch: long-press to initiate. Always provide button alternative. |
| Pinch-to-zoom | Never disable viewport zoom (`user-scalable=yes`) |

### F.5 Motion and Animation

| Requirement | Implementation |
|------------|---------------|
| Reduced motion respected | `prefers-reduced-motion: reduce` — see Section 4.3 |
| No auto-playing video | Never. Static images only for decorative content. |
| Flashing content | No element flashes more than 3 times per second |
| Animation opt-out | Settings toggle: "Reduce motion" syncs with OS preference |

### F.6 Content and Semantics

| Requirement | Implementation |
|------------|---------------|
| Heading hierarchy | `h1` → `h2` → `h3`, no skipped levels per page |
| Landmark regions | `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` used correctly |
| Language attribute | `<html lang="en">` on root |
| Error prevention | Destructive actions require confirmation dialog |
| Undo support | Toast notifications include "Undo" for reversible actions |
| Session timeout warning | 2-minute warning before session expires, with extend option |
| Form error summary | On submit failure, summary at top of form lists all errors with links to fields |

---

## Appendix G: Component Size Reference

Quick reference for all fixed dimensions in the design system.

### G.1 Interactive Element Sizes

| Element | Width | Height | Min Width | Min Height |
|---------|-------|--------|-----------|-----------|
| Primary button | auto (content) | 44px | 120px | 44px |
| Secondary button | auto | 44px | 80px | 44px |
| Ghost button | auto | 36px | — | 36px |
| Icon button (round) | 36px | 36px | — | — |
| Icon button (large) | 44px | 44px | — | — |
| Input (text) | 100% parent | 44px | 120px | 44px |
| Textarea | 100% parent | min 88px | 200px | 88px |
| Select/Dropdown | 100% parent | 44px | 120px | 44px |
| Toggle switch | 48px | 28px | — | — |
| Toggle knob | 24px | 24px | — | — |
| Checkbox | 20px | 20px | — | — |
| Radio button | 20px | 20px | — | — |
| Segmented control | auto | 40px | — | 40px |
| Tab | auto | 44px | — | 44px |

### G.2 Layout Element Sizes

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| Sidebar (expanded) | 240px | 100vh | Fixed position |
| Sidebar (collapsed) | 64px | 100vh | Icon-only |
| Top header bar | 100% - sidebar | 64px | Fixed position |
| Content area | 100% - sidebar, max 1440px | auto | Scrollable |
| Content padding | — | — | 32px all sides |
| Bottom tab bar (mobile) | 100% | 56px | Fixed bottom |
| CTA button (mobile center) | 56px | 56px | Elevated circle |
| Command palette | 640px max | 480px max | Centered overlay |

### G.3 Overlay Element Sizes

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| Modal (small) | 400px | auto, max 80vh | Confirmation dialogs |
| Modal (medium) | 560px | auto, max 80vh | Standard forms |
| Modal (large) | 720px | auto, max 80vh | Complex forms |
| Modal (full-sheet) | 90vw | 90vh | Reports, calendars |
| Slide-over panel | 400px | 100vh | Package check-in, notifications |
| Notification panel | 320px | 100vh | Bell menu |
| Popover | 280-360px | auto, max 400px | Booking detail, event detail |
| Tooltip | max 240px | auto | Hover information |
| Toast notification | 360px | auto, min 56px | Alert/feedback |
| Dropdown menu | min 200px | auto, max 320px | Action menus |
| Modal backdrop | 100vw | 100vh | Semi-transparent overlay |

### G.4 Content Element Sizes

| Element | Width | Height | Notes |
|---------|-------|--------|-------|
| KPI card | min 240px (auto-fill grid) | auto (~120px) | Flexible grid |
| Event card | 100% parent | auto (~100px) | 3px left accent border |
| Marketplace card | min 280px (grid) | auto (~300px) | 16:9 image + body |
| Avatar (small) | 24px | 24px | Inline with text |
| Avatar (medium) | 32px | 32px | Table rows, comments |
| Avatar (large) | 40px | 40px | Profile headers |
| Avatar (display) | 64px | 64px | Unit file header |
| Status dot | 6px | 6px | Inside badges |
| Status dot (table) | 8px | 8px | Table status column |
| Sparkline | 100% card | 48px | Inside KPI cards |
| Progress ring | 80-120px | 80-120px | 1:1 ratio |
| Carrier chip | 24px | 24px | Package carrier ID |
| Empty state illustration | 200px | 200px | Centered in container |
| File upload zone | 100% parent | 80px | Dashed border |
| Signature pad | 100% parent | 200px | Canvas element |
| Calendar booking block | 100% column | proportional to duration | 60px = 1 hour |

### G.5 Spacing Quick Reference

| Context | Value | Token |
|---------|-------|-------|
| Between icon and text (inline) | 8px | `--space-2` |
| Between label and input | 6px | — |
| Between input and help/error | 4px | `--space-1` |
| Between form fields | 20px | `--space-5` |
| Between cards in grid | 24px | `--space-6` |
| Between major sections | 32px | `--space-7` |
| Page content padding | 32px | `--space-7` |
| Card internal padding | 20px | `--space-5` |
| Table row height | 56px | — |
| Table header height | 44px | — |
| Button internal padding (h) | 20px | `--space-5` |
| Button internal padding (v) | auto (centered in 44px) | — |
| Badge internal padding | 2px 10px | — |
| Sidebar item height | 40px | — |
| Sidebar group gap | 16px | `--space-4` |
| Toast stack gap | 8px | `--space-2` |
| Breadcrumb separator gap | 8px | `--space-2` |
| Modal footer padding | 20px 24px | — |
| Tab underline gap (below text) | 4px | `--space-1` |

---

*End of Concierge Design System v2*
*Total sections: 12 main + 7 appendices*
*This document, combined with v1 (DESIGN-SYSTEM.md) and the Design Inspiration doc, forms the complete visual specification for the Concierge platform.*

---

## Appendix H: Token Usage Patterns by Module

This appendix maps every Concierge module to the specific design tokens it consumes. Engineers use this to verify they are using the correct tokens for each context.

### H.1 Dashboard Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Page title "Dashboard" | `--type-display`, `--text-primary` | 34px, 700 weight |
| Greeting "Welcome back, Sarah" | `--type-body`, `--text-secondary` | Disappears on first scroll |
| KPI card container | `--bg-primary`, `--border-subtle`, `--radius-xl` | 12px radius, 1px border |
| KPI card label | `--type-kpi-label`, `--text-secondary` | 12px, 500w, 0.4px letter-spacing |
| KPI card value | `--type-kpi-value`, `--text-primary` | 34px Inter Display, 700w |
| KPI card trend (positive) | `--type-kpi-trend`, `--color-success` | +12% with ArrowUp icon |
| KPI card trend (negative) | `--type-kpi-trend`, `--color-error` | -5% with ArrowDown icon |
| KPI card sparkline | `--status-info` (neutral) or `--status-success`/`--status-error` | 48px tall, matches trend direction |
| Section title "Recent Service Requests" | `--type-title-2`, `--text-primary` | 22px, 600 weight |
| "View all" link | `--type-callout`, `--accent` + `ChevronRight` 14px | Ghost link style |
| Recent items list | `--type-callout`, `--text-primary` (title), `--text-secondary` (meta) | Caption for timestamps |
| Resident breakdown donut | `--chart-1` through `--chart-4` | Max 4 segments + "Other" |
| Building condition bars | `--accent` (fill), `--bg-tertiary` (track) | Body text for labels |

### H.2 Package Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Tab bar (Pending / Released / All) | `--type-callout-medium`, `--accent` (active), `--text-secondary` (inactive) | 2px underline indicator |
| Pending count badge | `--badge-warning-bg`, `--badge-warning-text` | Pill, in header |
| Table header | `--type-headline`, `--text-secondary`, `--bg-secondary` | 44px height, uppercase |
| Table row (normal) | `--type-callout`, `--text-primary` | 56px height |
| Table row (>48h old) | Same + `--status-warning-bg` background | Attention highlight |
| Carrier chip | Per-carrier colors (Section 3.5) | 24x24px, inline |
| "Release" ghost button | `--accent`, `--type-callout-medium` | Per-row action |
| Floating action bar | `--bg-primary`, `--shadow-3`, `--z-floating-bar` | Bottom fixed, 48px |
| Check-in modal | `--bg-primary`, `--shadow-4`, `--radius-2xl` | 560px width |
| Unit searchable dropdown | `--type-title-3` for unit number, `--type-callout` for resident name | Large text for quick scanning |
| Carrier selector pills | `--bg-secondary` (inactive), `--accent` + `--text-on-accent` (active) | 36px height buttons |
| Tracking number input | `--font-mono`, `--type-mono` | Monospace for pasting |
| Package reference number | `--font-mono`, `--type-mono`, `--text-secondary` | PKG-2026-0341 format |
| Storage location dropdown | `--type-callout`, standard dropdown | e.g., "Locker B-12" |
| Success toast | `--status-success` icon, `--text-primary` text, `--shadow-5` | Auto-dismiss 4s |

### H.3 Service Request Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Kanban board container | `--bg-secondary` background | Full-width below toolbar |
| Kanban column header | `--type-headline`, `--text-primary` | With count badge |
| Kanban column count | `--badge-pending-bg`, `--badge-pending-text` | e.g., "(12)" |
| Kanban card | `--bg-primary`, `--shadow-1`, `--radius-lg` | 3px left border = priority |
| Priority border (High) | 3px solid `--status-error` | Left border of card |
| Priority border (Medium) | 3px solid `--status-warning` | Left border of card |
| Priority border (Low) | 3px solid `--status-info` | Left border of card |
| Card title | `--type-headline`, `--text-primary` | 1 line, truncate |
| Card meta (unit, category) | `--type-caption`, `--text-secondary` | Icons: Building2, Tag |
| Card assigned to | `--type-caption`, `--text-secondary` | Icon: User |
| Card timestamp | `--type-caption`, `--text-tertiary` | Relative: "2h ago" |
| Request ID | `--font-mono`, `--type-mono-small`, `--text-secondary` | #SR-4521 |
| Drag placeholder | Dashed `--border-subtle`, `--bg-secondary` | Where card will land |
| Empty column | `--type-callout`, `--text-secondary` | "No requests. Great job!" |
| Create request modal | `--shadow-4`, 560px width | Standard form layout |
| Priority segmented control | Low: `--status-info`, Med: `--status-warning`, High: `--status-error` | Color-coded segments |
| Ticket detail — left panel | `--bg-primary`, 60% width | Static details + attachments |
| Ticket detail — right panel | `--bg-secondary`, 40% width | Activity timeline |
| Timeline entry (system) | `--type-caption`, `--text-secondary` | "Status changed to..." |
| Timeline entry (user) | `--type-callout`, `--text-primary` | User comments |
| Timeline timestamp | `--type-caption`, `--text-tertiary` | Left column, 120px |
| Comment input | Standard text input, 44px | Bottom of right panel |

### H.4 Security Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Quick action buttons (3) | `--bg-secondary`, `--text-primary`, 48px icon, `--radius-xl` | 100x80px each |
| Quick action icon | `--text-secondary` (default), `--accent` (hover) | 48px Display size |
| Tab bar | `--type-callout-medium`, standard tab styling | 4 tabs |
| Visitor parking table | Standard table tokens | Monospace for plates |
| License plate | `--font-mono`, `--type-mono`, `--text-primary` | Uppercase auto-format |
| Key checkout signature thumb | `--radius-md`, `--border-subtle`, 48x48px | Click for lightbox |
| Violation ban type badge (Ban) | `--badge-error-bg`, `--badge-error-text` | Red badge |
| Violation ban type badge (Ticket) | `--badge-warning-bg`, `--badge-warning-text` | Yellow badge |
| Violation ban type badge (Warning) | `--badge-info-bg`, `--badge-info-text` | Blue badge |
| Violation ban type badge (Towed) | `--badge-error-bg`, `--badge-error-text` | Red badge + Truck icon |
| Key status (Checked In) | `--badge-success-bg`, `--badge-success-text` | Green badge |
| Key status (Checked Out) | `--badge-warning-bg`, `--badge-warning-text` | Yellow badge |
| Key number | `--font-mono`, `--type-mono` | e.g., "KEY-001" |
| Visitor type selector | Segmented control with standard styling | 5 options |
| Parking warning banner | `--status-warning-bg`, `--color-warning`, `AlertTriangle` icon | Top of violation modal |

### H.5 Amenity Booking Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Filter panel background | `--bg-secondary` | 280px width |
| Mini calendar dates | `--type-caption`, `--text-primary` | 28px x 28px cells |
| Mini calendar today | `--accent` filled circle | White text |
| Mini calendar selected | `--accent` ring (outline) | Blue text |
| Mini calendar dots | Amenity colors at 100% | Under date numbers |
| Amenity filter checkboxes | Standard checkbox + amenity color dot | 8px dot before label |
| View switcher | Segmented control: Month / Week / Day | `--accent` active |
| Navigation arrows | `ChevronLeft` / `ChevronRight`, `--text-secondary` | 20px icons |
| "Today" pill | `--accent` bg, `--text-on-accent` | Only visible when not on today |
| Month/year title | `--type-title-1`, `--text-primary` | Clickable for picker |
| Calendar gridlines | 1px `--border-subtle` | Horizontal and vertical |
| Time labels (Y-axis) | `--type-caption`, `--text-secondary` | 30-min increments |
| Day labels (X-axis) | `--type-caption`, `--text-secondary`, uppercase | Mon-Sun |
| Booking block background | Amenity color at 12% opacity | e.g., `rgba(0,113,227,0.12)` |
| Booking block left border | 3px solid amenity color | |
| Booking block text | `--type-caption` (600w: name, 400w: time, `--text-secondary`: unit) | |
| Your booking indicator | 18% opacity instead of 12%, "Your booking" badge | |
| Unavailable slot | `--bg-tertiary` diagonal stripes | `repeating-linear-gradient` |
| Booking popover | `--bg-primary`, `--shadow-3`, `--radius-xl`, max 320px | |
| Quick booking form | Standard form tokens | Anchored to clicked slot |
| Rule info bar | `--status-info-bg`, `--color-info`, `Info` icon | "Max 4 hours, $50 deposit" |
| Booking status (Confirmed) | `--badge-success-bg`, `--badge-success-text` | Green badge |
| Booking status (Pending) | `--badge-warning-bg`, `--badge-warning-text` | Yellow badge |
| Booking status (Cancelled) | `--badge-error-bg`, `--badge-error-text` | Red badge |

### H.6 Announcement Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Announcement list card | `--bg-primary`, `--border-subtle` | No accent border |
| Announcement title | `--type-headline`, `--text-primary` | Clickable |
| Announcement excerpt | `--type-callout`, `--text-secondary` | 2-line clamp |
| Announcement date | `--type-caption`, `--text-tertiary` | "Posted 3 days ago" |
| Unread indicator | 8px `--accent` circle | Left of title |
| Rich text editor toolbar | `--bg-secondary` bg, `--border-subtle` bottom border | Sticky on scroll |
| Rich text editor body | `--bg-primary`, `--type-body` | Prose styles |
| Emergency SMS toggle | `--status-error` track color, `AlertTriangle` icon | Red-themed toggle |
| Recipients dropdown | Standard select | With grouped options |
| Attachment pills | `--bg-secondary`, `--text-primary`, `X` remove | Thumbnail + name |
| Schedule date picker | Standard date input | "Send immediately" default |
| Options accordion | `ChevronDown` icon, `--type-callout-medium` | Collapsed by default |

### H.7 Unit File Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Unit number heading | `--type-display`, `--text-primary` | 34px, bold, e.g., "Unit 1205" |
| Building + details subtext | `--type-body`, `--text-secondary` | "Bond Tower - Floor 12 - 2BR" |
| Tab bar | Standard tab styling | Residents / Vehicles / Packages / Requests / Logs |
| Resident card | `--bg-primary`, `--border-subtle` | Avatar + details |
| Resident avatar | 40px circle, `--radius-full` | Photo or UserCircle placeholder |
| Resident name | `--type-headline`, `--text-primary` | Clickable |
| Resident role | `--type-callout`, `--text-secondary` | "Owner", "Tenant", "Spouse" |
| Contact info icons | `Phone`, `Mail` at 16px, `--text-secondary` | Clickable (tel: and mailto:) |
| Quick stats card | `--bg-secondary`, `--radius-xl` | Package, request, booking counts |
| Quick stat icon | 20px, various module icons | `--text-secondary` |
| Quick stat value | `--type-headline`, `--text-primary` | "3 pending packages" |
| Recent activity timeline | `--border-subtle` left line, `--type-caption` timestamps | Vertical timeline |
| Activity dot | 8px circle, module-specific color | On the timeline line |
| Vehicle license plate | `--font-mono`, `--type-mono`, `--text-primary` | Table column |
| Parking spot | `--type-callout`, `--text-secondary` | e.g., "P2-045" |
| Pet entry | `PawPrint` icon, `--type-callout` | Name, type, weight |
| Emergency contact | `HeartPulse` icon (16px, `--color-error`), `--type-callout` | Phone prominent |
| FOB serial number | `--font-mono`, `--type-mono-small` | e.g., "FOB-00234" |
| Buzzer code | `--font-mono`, `--type-mono` | e.g., "4521" |

### H.8 Reports Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Date range selector | Standard select + date picker | Presets: 7d, 30d, 90d, YTD, Custom |
| KPI card row | Same as Dashboard KPI cards | Resident counts |
| Chart card | `--bg-primary`, `--border-subtle`, `--radius-xl` | Contains chart + title |
| Chart card title | `--type-title-2`, `--text-primary` | Above chart |
| Chart legend | `--type-caption`, `--text-secondary` + color swatches | Above chart area |
| Report category header | `--type-headline`, `--text-primary` + module icon | Accordion trigger |
| Report category chevron | `ChevronDown` 16px, `--text-secondary` | Rotates 180 on expand |
| Report row | `--type-callout`, `--text-primary` | Name of specific report |
| Generate Excel button | `FileSpreadsheet` icon, secondary button, green icon tint | Per report |
| Generate PDF button | `FileText` icon, secondary button, red icon tint | Per report |
| Export in-progress | `Loader2` spinning icon, replaces generate button | Disabled during generation |
| Download ready | `Download` icon + "Download" label | Replaces loader |

### H.9 Settings Module

| UI Element | Token(s) Used | Notes |
|-----------|--------------|-------|
| Settings nav (left panel) | `--bg-secondary`, 240px width | Vertical text nav |
| Active setting | `--accent` text, `--accent-subtle` bg | Left 3px accent border |
| Inactive setting | `--text-secondary` | No border |
| Setting page title | `--type-title-1`, `--text-primary` | e.g., "User Management" |
| Setting section title | `--type-title-3`, `--text-primary` | e.g., "General Settings" |
| Setting section description | `--type-body`, `--text-secondary` | Below section title |
| Two-column setting row | Left: label + description (40%). Right: control (60%). | `--border-subtle` divider |
| Setting label | `--type-callout-medium`, `--text-primary` | 14px, 500 weight |
| Setting description | `--type-caption`, `--text-secondary` | Below label |
| Danger zone | `--badge-error-bg` background section | Destructive actions |
| Danger zone title | `--type-headline`, `--color-error` | "Danger Zone" |
| Danger zone button | Destructive button style | e.g., "Delete Building" |
| Permission matrix | Standard table, radio buttons per cell | Role x Module matrix |
| Save indicator | Toast notification on auto-save | "Settings saved" |
| Unsaved changes bar | `--status-warning-bg`, sticky bottom, 48px | "Unsaved changes" + Save/Discard |

---

## Appendix I: Design Decision Log

Major design decisions and their rationale, for future reference.

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|----------------------|
| Color space | OKLCH | Perceptual uniformity for status badges across the dashboard. HSL produces visually uneven brightness. | HSL, LCH (older spec), RGB |
| Primary font | Inter + Inter Display | Most popular SaaS typeface. Proven at scale (Linear, GitHub, Figma). Inter Display adds heading refinement. | SF Pro (Apple-only licensing), Geist (Vercel, less mature), Satoshi |
| Monospace font | JetBrains Mono | Clean, purpose-built for UI contexts (not just code). Good number legibility for unit numbers and tracking IDs. | SF Mono (Apple-only), Fira Code (ligatures unnecessary), IBM Plex Mono |
| Icon library | Lucide | Open source, consistent 1.5px stroke, tree-shakeable, React-native support. 1000+ icons cover all our needs. | Heroicons (fewer icons), Phosphor (heavier), Feather (unmaintained fork source) |
| Sidebar navigation | 240px/64px collapsible | Industry standard (Vercel, Notion, Linear all converged on sidebar). 240px fits our longest label ("Maintenance Requests"). | Top navigation (rejected: too many modules), Command-bar only (rejected: discoverability) |
| Card border vs shadow | Border by default, shadow on hover | Apple-inspired flatness. Shadows are reserved for elevation changes. Border provides consistent separation without visual weight. | Always shadow (rejected: too heavy), No border (rejected: cards blend into bg) |
| Button height | 44px | WCAG touch target minimum. Also matches Apple HIG minimum touch target. | 36px (too small for touch), 48px (too tall for dense UIs) |
| Table row height | 56px | Provides comfortable scanning density while maintaining touch-target compliance. 25 rows fit on a standard 1080p viewport with header/footer. | 48px (too cramped for multi-line content), 64px (too sparse) |
| Form labels | Above input, always | Most accessible and scannable pattern. Inline labels cause reflow issues on focus. Floating labels hide important context. | Inline/beside (space-inefficient), Floating (hides label on fill), Placeholder-only (inaccessible) |
| Animation philosophy | Purposeful only | Enterprise tool for security guards and property managers. Decorative animation reduces perceived professionalism. | Playful (inappropriate for security/management context), None (too static) |
| Dark mode timing | Designed now, shipped later | Defining tokens now prevents expensive refactoring. Token-based architecture means dark mode is a CSS change, not a redesign. | Ship with v1 (scope risk), Design later (refactoring cost) |
| Colorblind safety | Dedicated chart palette | 8% of men have color vision deficiency. Property management dashboards with color-only charts are inaccessible to 1 in 12 male managers. | Rely on patterns only (ugly), Ignore (discriminatory) |
| Print support | Full print stylesheets | Work orders, violation reports, and emergency procedures are frequently printed. Front desk staff print package labels. Building managers print monthly reports for board meetings. | PDF export only (loses interactivity context), Ignore (users will complain) |
| Empty states | Illustration + CTA mandatory | Competitors showed empty tables with no guidance. This is hostile UX. Every zero-data state is an opportunity to guide the user. | Text-only (less engaging), No empty states (confusing) |
| Spacing base | 4px (with 8px primary rhythm) | 4px allows fine-grained control (badge padding: 4px). 8px primary rhythm aligns with all major design systems. | 8px only (too coarse for small elements), 5px (not compatible with standard grids) |
| Border radius | 10px inputs, 12px cards, 16px modals | Progressive radius by importance. Inputs are smaller/more numerous (10px). Cards are medium importance (12px). Modals demand attention (16px). | Uniform 8px (boring), Uniform 16px (too rounded for inputs), Sharp corners (dated) |
| Maximum chart series | 6 + "Other" | Beyond 6 series, charts become unreadable. Colorblind safety is compromised. Grouping into "Other" forces meaningful data hierarchy. | Unlimited (illegible), 4 (too restrictive for amenity reports) |

---

## Appendix J: Naming Convention Reference

Consistent naming across the codebase ensures tokens, components, and files are discoverable.

### J.1 CSS Custom Property Naming

```
Pattern: --{category}-{element}-{variant}-{state}

Examples:
  --bg-primary                    category=bg, variant=primary
  --text-secondary                category=text, variant=secondary
  --badge-success-bg              category=badge, element=success, variant=bg
  --badge-success-text            category=badge, element=success, variant=text
  --accent-hover                  category=accent, state=hover
  --shadow-3                      category=shadow, level=3
  --chart-1                       category=chart, series=1
  --event-package                 category=event, type=package
  --type-display                  category=type, level=display
  --space-4                       category=space, step=4
  --radius-lg                     category=radius, size=lg
  --z-modal                       category=z, element=modal
  --duration-slow                 category=duration, speed=slow
  --ease-out                      category=ease, direction=out
```

### J.2 Component File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase | `StatusBadge.tsx`, `DataTable.tsx` |
| Compound component parts | Parent.Part | `DataTable.Header.tsx`, `DataTable.Row.tsx` |
| Hook | camelCase with `use` prefix | `useNotifications.ts`, `useDebounce.ts` |
| Page component | PascalCase + Page | `DashboardPage.tsx`, `PackagesPage.tsx` |
| Layout component | PascalCase + Layout | `SidebarLayout.tsx`, `AuthLayout.tsx` |
| Context provider | PascalCase + Provider | `ThemeProvider.tsx`, `AuthProvider.tsx` |
| Type definition | PascalCase | `ServiceRequest.types.ts`, `User.types.ts` |
| CSS Module | Component name, kebab | `status-badge.module.css`, `data-table.module.css` |
| Test file | Component + `.test` | `StatusBadge.test.tsx`, `DataTable.test.tsx` |
| Story file | Component + `.stories` | `StatusBadge.stories.tsx` |

### J.3 Design Token File Structure

```
src/
  tokens/
    colors.css          /* All color custom properties */
    typography.css      /* Font families, type scale */
    spacing.css         /* Space scale, grid tokens */
    shadows.css         /* Elevation shadows */
    motion.css          /* Duration, easing, animation tokens */
    z-index.css         /* Z-index scale */
    radius.css          /* Border radius scale */
    index.css           /* Imports all token files */
    themes/
      light.css         /* Light mode overrides (default) */
      dark.css          /* Dark mode overrides */
      high-contrast.css /* High contrast overrides */
```

### J.4 API and URL Naming

| Resource | URL Pattern | Example |
|---------|------------|---------|
| Module list | `/api/v1/{module}` | `/api/v1/packages` |
| Module detail | `/api/v1/{module}/{id}` | `/api/v1/packages/PKG-2026-0341` |
| Module create | `POST /api/v1/{module}` | `POST /api/v1/service-requests` |
| Module update | `PATCH /api/v1/{module}/{id}` | `PATCH /api/v1/service-requests/SR-4521` |
| Module delete | `DELETE /api/v1/{module}/{id}` | `DELETE /api/v1/announcements/ANN-001` |
| Nested resource | `/api/v1/{parent}/{id}/{child}` | `/api/v1/units/1205/packages` |
| Search | `/api/v1/search?q={query}` | `/api/v1/search?q=leaking` |
| Frontend routes | `/{module}` | `/packages`, `/service-requests`, `/amenities` |
| Frontend detail | `/{module}/{id}` | `/service-requests/SR-4521` |
| Settings | `/settings/{tab}` | `/settings/users`, `/settings/amenities` |

---

*End of Concierge Design System v2 — Complete Edition*
*Document version: 2.0.0*
*Last updated: 2026-03-16*
*Total content: 12 sections + 10 appendices (A through J)*

---

## Appendix K: Interaction Flow Specifications

Detailed step-by-step interaction flows for the highest-frequency actions in Concierge. Each step specifies exact visual changes, animation timings, and token usage.

### K.1 Package Check-In Flow (Most Frequent Action)

This flow occurs 20-50 times per shift for front desk staff. Every millisecond matters.

#### Step 1: User clicks "+ Check In" button

```
Trigger:  Click on primary button in Packages page header
Visual:   Button press animation (MI-01: scale 0.97, 80ms)
Result:   Slide-over panel enters from right (MI-23: 300ms ease-out)
Tokens:   Panel: --bg-primary, --shadow-4, --z-slide-over, 400px width
          Backdrop: rgba(0,0,0,0.3), 200ms fade
```

#### Step 2: Panel appears, unit field auto-focused

```
Visual:   Panel is fully visible. Unit field has focus ring.
Tokens:   Unit input: --type-title-3 (20px, larger than normal for speed)
          Focus: --border-focus, --shadow-focus
Auto:     Cursor blinks in Unit field. Keyboard is ready.
Timing:   Focus occurs 50ms after panel animation completes (350ms total from click)
```

#### Step 3: User types unit number (e.g., "120")

```
Visual:   Type-ahead dropdown opens below input (MI-08: 150ms scaleY)
          Matching units filter in real-time (debounced 100ms, NOT 300ms — speed critical)
          Matched characters in bold: "1205 — Sarah Chen"
Tokens:   Dropdown: --bg-primary, --shadow-2, --radius-md, --z-dropdown
          Match highlight: bold (600 weight) on matching characters
          Result items: --type-callout, 44px height each
          Building2 icon: 16px, --text-secondary
```

#### Step 4: User selects unit (arrow key + Enter, or click)

```
Visual:   Dropdown closes (100ms fade). Input shows "1205 — Sarah Chen".
          Focus auto-advances to Carrier selector.
Tokens:   Input value: --type-title-3, --text-primary
          Carrier pills highlight: first option gets focus ring
Timing:   Auto-advance: 100ms after selection (allows visual confirmation)
```

#### Step 5: User selects carrier (e.g., clicks "Amazon")

```
Visual:   "Amazon" pill transitions to selected (--accent bg, white text, 200ms)
          All other pills remain unselected (--bg-secondary)
          Focus auto-advances to Tracking # field
Tokens:   Selected: --accent, --text-on-accent
          Unselected: --bg-secondary, --text-primary
          Carrier chip: AMZ chip appears next to carrier name after selection
```

#### Step 6: User optionally enters tracking number

```
Visual:   Standard input focus (MI-04)
          Monospace font for tracking number
Tokens:   --font-mono, --type-mono
          Paste from clipboard: instant fill, no special animation
Skip:     User can press Tab to skip to notes, or Enter to submit immediately
```

#### Step 7: User optionally captures photo

```
Visual:   Camera button shows camera icon at 20px
          On click: native camera opens (mobile) or file picker (desktop)
          On capture: thumbnail appears (80x80px) with remove X button
Tokens:   Camera button: --bg-secondary, Camera icon, --text-secondary
          Thumbnail: --radius-md, --border-subtle, 80x80px
          Remove X: 16px, absolute top-right of thumbnail, --bg-primary circle
```

#### Step 8: User clicks "Check In" (or presses Enter)

```
Visual:   Button shows loading spinner (MI-01 press, then Loader2 spin)
          Button width is frozen. Text replaced by 20px white spinner.
Tokens:   Loading: --accent bg maintained, Loader2 icon white
Timing:   API call (target: <500ms)
```

#### Step 9: Success — form resets for next package

```
Visual:   Success toast slides in (MI-10: 300ms spring from top-right)
          Toast: green CheckCircle2 icon + "Package checked in — Unit 1205"
          Form fields reset to empty (instant, no animation)
          Unit field re-focuses automatically
          Panel stays OPEN (critical: user is checking in multiple packages)
Tokens:   Toast: --color-success icon, --text-primary text, --shadow-5
          Toast auto-dismiss: 3s (shorter than default 4s for high-frequency action)
          Reset: instant, no transition on clearing fields
```

#### Step 10: User clicks "Done" to close panel

```
Visual:   Ghost link "Done" in panel header. Click closes panel.
          Panel slides out to right (MI-23 reverse: 250ms ease-in)
          Backdrop fades out (150ms)
          Package list table updates with new entry (fade in at top, MI-34)
Tokens:   "Done": --accent, --type-callout-medium, ghost button style
```

**Total time for experienced user**: ~5 seconds per package (unit selection + carrier + submit)
**Total time with all optional fields**: ~12 seconds

### K.2 Service Request Status Change (Kanban Drag)

#### Step 1: User long-presses (touch) or mousedowns (desktop) on a Kanban card

```
Trigger:  mousedown held 150ms (desktop) or touchstart held 200ms (mobile)
Visual:   Card lifts (MI-24):
          - Shadow deepens: --shadow-1 → --shadow-5
          - Card rotates 1.5 degrees clockwise
          - Opacity reduces to 0.92
          - Cursor changes to grab/grabbing
Tokens:   Lifted card: --shadow-5, --z-toast (highest), opacity 0.92
Timing:   Lift animation: 150ms ease-out
```

#### Step 2: User drags card over columns

```
Visual:   Card follows cursor/finger with 16ms frame updates
          Source column shows gap where card was (collapse with 200ms animation)
          Valid target columns highlight (MI-25):
          - Column background: --accent-subtle
          - Drop position indicator: 2px dashed --accent line between cards
          Invalid columns (if any): no highlight, cursor shows "not-allowed"
Tokens:   Target column: --accent-subtle bg
          Drop indicator: 2px dashed --accent, 4px vertical margin
          Card shadow: --shadow-5 (maintains highest elevation during drag)
```

#### Step 3: User drops card in target column

```
Visual:   Card settles into position:
          - Shadow reduces: --shadow-5 → --shadow-1
          - Rotation returns to 0 degrees
          - Opacity returns to 1.0
          - Slight bounce on landing (--ease-bouncy, 200ms)
          Column highlight clears
          Column count badges update (old column -1, new column +1)
          Status badge on card transitions color (MI-12: 500ms with pulse)
Tokens:   Settled card: --shadow-1 (normal resting state)
          Updated badge: new status badge colors
          Count badges: standard badge styling, counter updates
Timing:   Drop settle: 200ms bounce. Status transition: 500ms. Count update: instant.
API:      PATCH /api/v1/service-requests/{id} with new status
```

#### Step 4: Success toast confirms

```
Visual:   Toast: "Request #SR-4521 moved to In Progress" with CheckCircle2 icon
Tokens:   Standard success toast styling
Timing:   Toast appears 200ms after drop animation completes
```

### K.3 Amenity Quick Booking Flow

#### Step 1: User clicks empty time slot on calendar

```
Trigger:  Click on any unoccupied time slot in Week or Day view
Visual:   Slot briefly highlights (--accent-subtle, 100ms)
          Booking popover appears anchored to slot (MI-22: 150ms ease-out)
          Popover shows pre-filled date and time from clicked slot
Tokens:   Popover: --bg-primary, --shadow-3, --radius-xl, max 320px
          Pointer arrow: 8px triangle, --bg-primary with --shadow-3
          Pre-filled fields: --type-callout, --text-primary
```

#### Step 2: User selects amenity (if not pre-determined by view)

```
Visual:   Amenity dropdown shows options with availability dots
          Green dot: available for selected time. Red dot: fully booked.
Tokens:   Green dot: --status-success (8px). Red dot: --status-error (8px).
          Available option: --text-primary. Unavailable: --text-tertiary + strikethrough.
```

#### Step 3: User adjusts time if needed

```
Visual:   Start and End time dropdowns side-by-side
          Unavailable times greyed with strikethrough
          Duration auto-calculates and shows between fields: "2 hours"
Tokens:   Standard dropdown styling
          Duration label: --type-caption, --text-secondary
          Warning if over max: --color-warning text "Exceeds maximum 4 hours"
```

#### Step 4: User clicks "Book Now"

```
Visual:   Button loading state (spinner)
          On success:
          - Popover closes (150ms fade)
          - New booking block appears on calendar (fade + scale in, 200ms)
          - Block uses amenity color at 12% opacity + 3px left border
          - Success toast: "Party Room booked — Wed 9-11 AM"
Tokens:   Booking block: amenity color styling per Section H.5
          Toast: standard success toast
```

### K.4 Announcement Publish Flow

#### Step 1: User fills in announcement form

```
Visual:   Standard form interaction tokens and behaviors
          Rich text editor with toolbar (sticky top)
          Character count visible if applicable
Tokens:   Editor body: prose styling (Section 2.5)
          Toolbar: --bg-secondary, --border-subtle bottom
```

#### Step 2: User clicks "Preview"

```
Visual:   Ghost button triggers a secondary modal (stacked)
          Since max 1 modal rule: current form transitions (slide left, 200ms)
          Preview appears (slide in from right, 200ms)
          "Back to edit" link at top-left
Tokens:   Preview card: --bg-primary, rendered announcement with final styling
          "Back" link: --accent, ghost style, ChevronLeft icon
```

#### Step 3: User clicks "Send"

```
Visual:   Confirmation dialog (if >100 recipients):
          "Send to 1,298 residents?" with recipient breakdown
          Primary button: "Send Announcement"
          On confirm: button shows loader
Tokens:   Confirmation: small modal (400px)
          Recipient count: --type-headline, --text-primary
```

#### Step 4: Success

```
Visual:   Modal closes (150ms)
          Success toast: "Announcement published — Sent to 1,298 residents"
          Announcement list refreshes with new entry at top (fade in)
          Unread badge appears on announcement in sidebar nav
Tokens:   Toast: standard success toast
          Sidebar badge: --accent bg, white text, --type-micro, 16px pill
```

### K.5 Emergency Procedure Access

#### Step 1: User clicks Emergency Procedures in sidebar

```
Trigger:  Click on Siren icon (always red, --color-error)
Visual:   Emergency overlay appears immediately (no page navigation)
          Backdrop darker than normal: rgba(0,0,0,0.5)
          Modal: large (720px), scrollable content
          Red accent at top: 4px --status-error top border on modal
Tokens:   Backdrop: rgba(0,0,0,0.5), --z-emergency
          Modal: --bg-primary, --shadow-5, --radius-2xl
          Top border: 4px solid --status-error
          Title: --type-title-1, --color-error, Siren icon 24px
Timing:   Faster than normal modal: 150ms (urgency justifies speed)
```

#### Step 2: User reads or prints

```
Visual:   Content uses prose styling (Section 2.5)
          Emergency-specific list styling (bold step numbers, 12px spacing)
          Phone numbers are clickable (tel: links, --accent color, underline)
          Print button prominent: secondary button, bottom-right
Tokens:   Phone links: --accent, underline, Phone icon 16px
          Print button: Printer icon, secondary button styling
```

### K.6 Multi-Building Switch

#### Step 1: User clicks avatar in top-right header

```
Visual:   Profile flyout dropdown appears (MI-08: 150ms)
Tokens:   Dropdown: --bg-primary, --shadow-3, --radius-xl, --z-dropdown
          Width: 240px. Position: anchored below avatar, right-aligned.
```

#### Step 2: User clicks "Switch Building"

```
Visual:   Dropdown closes. Building picker modal appears (MI-09: 250ms)
          Modal shows building cards (photo + name + ID)
          Current building has accent border
Tokens:   Building card: --bg-primary, --border-subtle, --radius-xl
          Active building: 2px solid --accent border
          Building photo: 64x64px, --radius-md, object-fit: cover
          Building name: --type-headline, --text-primary
          Building ID: --type-caption, --text-secondary (e.g., "TSCC 2584")
```

#### Step 3: User selects different building

```
Visual:   Selected building card gets accent border (200ms transition)
          "Continue" button enables
          On click: full page reload with new building context
          Loading: skeleton dashboard appears
          All data refreshes for new building
Tokens:   Continue button: primary button, standard styling
Timing:   Page transition: standard (MI-17)
          Data load: skeleton shimmer (MI-18/19)
```

---

## Appendix L: Color Contrast Verification Table

Complete verification of all text/background color combinations used in Concierge. Every row must pass the stated WCAG level.

### L.1 Text on Light Backgrounds

| Text Token | Text Hex | Background Token | BG Hex | Contrast Ratio | WCAG Level | Pass |
|-----------|---------|-----------------|--------|:---:|:---:|:---:|
| `--text-primary` | #1D1D1F | `--bg-primary` | #FFFFFF | 16.75:1 | AAA | YES |
| `--text-primary` | #1D1D1F | `--bg-secondary` | #F5F5F7 | 14.53:1 | AAA | YES |
| `--text-primary` | #1D1D1F | `--bg-tertiary` | #E8E8ED | 12.08:1 | AAA | YES |
| `--text-secondary` | #6E6E73 | `--bg-primary` | #FFFFFF | 5.24:1 | AA | YES |
| `--text-secondary` | #6E6E73 | `--bg-secondary` | #F5F5F7 | 4.55:1 | AA | YES |
| `--text-tertiary` | #AEAEB2 | `--bg-primary` | #FFFFFF | 2.31:1 | — | DECORATIVE ONLY |
| `--accent` | #0071E3 | `--bg-primary` | #FFFFFF | 4.62:1 | AA | YES |
| `--accent` | #0071E3 | `--bg-secondary` | #F5F5F7 | 4.01:1 | AA-large | YES (large text only) |
| `--color-success` | #047857 | `--bg-primary` | #FFFFFF | 5.36:1 | AA | YES |
| `--color-warning` | #B45309 | `--bg-primary` | #FFFFFF | 4.70:1 | AA | YES |
| `--color-error` | #DC2626 | `--bg-primary` | #FFFFFF | 4.52:1 | AA | YES |
| `--color-info` | #2563EB | `--bg-primary` | #FFFFFF | 5.10:1 | AA | YES |

### L.2 Badge Text on Badge Backgrounds

| Badge | Text Hex | BG Hex | Contrast Ratio | WCAG Level | Pass |
|-------|---------|--------|:---:|:---:|:---:|
| Success | #065F46 | #D1FAE5 | 7.40:1 | AAA | YES |
| Warning | #92400E | #FEF3C7 | 6.20:1 | AA | YES |
| Error | #991B1B | #FEE2E2 | 7.80:1 | AAA | YES |
| Info | #1D4ED8 | #DBEAFE | 6.10:1 | AA | YES |
| Pending | #374151 | #F3F4F6 | 9.00:1 | AAA | YES |

### L.3 Text on Accent (Buttons)

| Text | Text Hex | Background | BG Hex | Contrast Ratio | WCAG Level | Pass |
|------|---------|-----------|--------|:---:|:---:|:---:|
| White on primary | #FFFFFF | `--accent` | #0071E3 | 4.62:1 | AA | YES |
| White on accent-hover | #FFFFFF | `--accent-hover` | #005BBB | 5.87:1 | AA | YES |
| White on error | #FFFFFF | `--color-error` | #DC2626 | 4.52:1 | AA | YES |
| White on error-hover | #FFFFFF | #B91C1C | 5.74:1 | AA | YES |

### L.4 Non-Text Contrast (Icons, Borders, Focus Rings)

| Element | Foreground | Background | Contrast Ratio | WCAG 1.4.11 (3:1) | Pass |
|---------|-----------|-----------|:---:|:---:|:---:|
| Border subtle on white | #E5E5EA | #FFFFFF | 1.36:1 | — | DECORATIVE (not required) |
| Focus ring on white | #0071E3 | #FFFFFF | 4.62:1 | 3:1+ | YES |
| Icon (text-secondary) on white | #6E6E73 | #FFFFFF | 5.24:1 | 3:1+ | YES |
| Status dot (success) on white | #10B981 | #FFFFFF | 2.77:1 | — | Must use with text label |
| Status dot (error) on white | #EF4444 | #FFFFFF | 3.94:1 | 3:1+ | YES |
| Status dot (warning) on white | #F59E0B | #FFFFFF | 2.15:1 | — | Must use with text label |
| Checkbox border on white | #C7C7CC | #FFFFFF | 1.70:1 | — | FAILS — increased to --border-strong |
| Input border on white | #E5E5EA | #FFFFFF | 1.36:1 | — | Passes via fill indicator, not border alone |

**Important notes on non-text contrast:**
- Status dots (success green, warning amber) alone do not meet 3:1 against white. This is by design — they are ALWAYS accompanied by text labels (badge text, status text). The dots are supplementary, never sole indicators.
- Input borders at 1.36:1 contrast rely on the input box shape (rectangular boundary) as the distinguishing indicator, not color alone. The WCAG 1.4.11 requirement applies to the input's overall perception as an interactive control, not solely the border color.

---

## Appendix M: Loading State Specifications

Every data-fetching context in Concierge has a defined loading state. Spinners are forbidden as primary loading indicators — skeleton screens are mandatory.

### M.1 Page-Level Loading

When navigating to a new page, the skeleton matches the page layout:

| Page | Skeleton Layout |
|------|----------------|
| Dashboard | 4 KPI card skeletons (same dimensions, gray blocks for value/label) + 2 card skeletons below (chart area + list area) |
| Packages | Tab bar (static, visible immediately) + Table skeleton (10 rows of gray blocks matching column widths) |
| Service Requests | Kanban: 4 column headers (static) + 3 card skeletons per column |
| Amenities | Calendar skeleton: grid lines visible, booking blocks as gray rounded rectangles in random positions |
| Unit File | Header skeleton (unit number block + subtext block) + tab bar (static) + content area skeleton |
| Reports | 4 KPI card skeletons + 2 chart card skeletons + accordion list skeleton |
| Settings | Left nav (static, visible immediately) + right content skeleton (form field blocks) |

### M.2 Skeleton Dimensions

| Element Being Loaded | Skeleton Shape | Width | Height | Border Radius |
|---------------------|---------------|-------|--------|---------------|
| Page title | Rectangle | 200px | 34px | 8px |
| KPI card value | Rectangle | 80px | 34px | 8px |
| KPI card label | Rectangle | 120px | 12px | 4px |
| KPI sparkline | Rectangle | 100% | 48px | 4px |
| Table header row | Full-width row | 100% | 44px | 0 |
| Table data row | Full-width row with column blocks | 100% | 56px | 0 |
| Table cell (text) | Rectangle | 60-140px (varies by column) | 16px | 4px |
| Table cell (badge) | Pill | 64px | 22px | 999px |
| Chart area | Rectangle | 100% | 300px | 12px |
| Card | Rectangle | 100% | 120px | 12px |
| Avatar | Circle | 32-40px | 32-40px | 999px |
| Form field label | Rectangle | 80px | 14px | 4px |
| Form field input | Rectangle | 100% | 44px | 10px |
| Calendar day cell | Rectangle | 100% column | 60-80px | 0 |
| Booking block | Rectangle | 80% column | 40-80px | 8px |
| Sidebar nav item | Rectangle | 80% sidebar width | 20px | 4px |

### M.3 Shimmer Animation

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: inherit;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--bg-secondary);
  }
}
```

### M.4 Loading Timing Targets

| Context | Target Load Time | Skeleton Display Threshold | Notes |
|---------|-----------------|--------------------------|-------|
| Page navigation | <500ms | Show skeleton if >200ms | Sub-200ms: no skeleton, content appears instantly |
| Table data fetch | <800ms | Show skeleton immediately | Tables always show skeleton on initial render |
| Modal content | <300ms | Show spinner in modal body | Modals use spinner (centered, 32px Loader2) not skeleton |
| Dropdown options | <200ms | Show "Loading..." text | Single line of loading text |
| Search results | <500ms | Show 3 skeleton result cards | Debounced 300ms before fetch begins |
| Chart data | <1000ms | Show chart skeleton immediately | Charts always skeleton |
| File upload | Variable | Show progress bar | Percentage-based progress bar, not skeleton |
| Export generation | Variable | Show spinner in button | Button stays disabled with spinner until complete |

### M.5 Skeleton to Content Transition

When data arrives and replaces the skeleton:

1. Skeleton elements fade out (opacity 1 → 0, 150ms)
2. Real content fades in simultaneously (opacity 0 → 1, 200ms)
3. Layout does NOT shift — skeleton dimensions match real content dimensions exactly
4. If skeleton is taller than real content, the container height smoothly reduces (200ms ease)

**Critical rule**: No Cumulative Layout Shift (CLS). The skeleton MUST match the dimensions of the final content. If a table has 25 rows, the skeleton must show placeholder blocks for 25 rows at 56px each. If only 3 results come back, the container smoothly shrinks.

---

## Appendix N: Toast Notification Catalog

Every user action that produces feedback maps to a specific toast type.

### N.1 Success Toasts

| Action | Toast Message | Detail Line | Undo Available | Auto-Dismiss |
|--------|-------------|-------------|:---:|:---:|
| Package checked in | "Package checked in" | "Unit 1205 — FedEx" | No | 3s |
| Package released | "Package released" | "Unit 1205 — Sarah Chen" | Yes (5s window) | 4s |
| Service request created | "Request created" | "#SR-4521" | No | 4s |
| Service request status changed | "Status updated" | "#SR-4521 → In Progress" | Yes | 4s |
| Amenity booked | "Booking confirmed" | "Party Room — Wed 9-11 AM" | Yes (if >24h away) | 4s |
| Amenity cancelled | "Booking cancelled" | "Party Room — Wed 9-11 AM" | Yes (if >24h away) | 4s |
| Announcement published | "Announcement published" | "Sent to 1,298 residents" | No (irreversible) | 5s |
| Announcement drafted | "Draft saved" | "Elevator Maintenance" | No | 3s |
| Visitor parking created | "Visitor parking logged" | "Unit 807 — ABC 1234" | Yes | 4s |
| Key checked out | "Key checked out" | "KEY-001 — John Smith" | No | 4s |
| Key returned | "Key returned" | "KEY-001" | No | 3s |
| Violation created | "Violation recorded" | "ABC 1234 — Ban" | Yes | 5s |
| User created | "User created" | "Sarah Chen — Owner" | No | 4s |
| Settings saved | "Settings saved" | none | No | 3s |
| File uploaded | "File uploaded" | "Noise-Policy.pdf (245 KB)" | No | 3s |
| Survey published | "Survey published" | "Sent to All Residents" | No | 4s |
| Ad posted | "Listing posted" | "Pending review" | No | 4s |
| Ad approved | "Listing approved" | "Moving Sale — Unit 1205" | No | 3s |
| Profile updated | "Profile updated" | none | No | 3s |
| Password changed | "Password changed" | "You may need to sign in again on other devices" | No | 5s |
| Bulk action completed | "N items updated" | "5 packages released" | Yes | 5s |
| Export generated | "Export ready" | "Download: packages-march-2026.xlsx" | No | 8s (longer for download) |
| Copied to clipboard | "Copied!" | none | No | 2s (short) |

### N.2 Error Toasts

| Trigger | Toast Message | Detail Line | Action Available | Auto-Dismiss |
|---------|-------------|-------------|:---:|:---:|
| API failure (generic) | "Something went wrong" | "Please try again" | "Retry" button | No (manual dismiss) |
| Network offline | "You are offline" | "Changes will sync when reconnected" | none | No (persistent banner) |
| Validation failure (submit) | "Please fix the errors below" | none | none | 5s |
| Permission denied | "You do not have permission" | "Contact your administrator" | none | 5s |
| Session expired | "Your session has expired" | "Please sign in again" | "Sign In" link | No (manual dismiss) |
| File too large | "File too large" | "Maximum size: 5 MB" | none | 5s |
| Upload failed | "Upload failed" | "filename.pdf" | "Retry" button | No |
| Booking conflict | "Time slot unavailable" | "Already booked by Unit 807" | none | 5s |
| Rate limit exceeded | "Too many requests" | "Please wait a moment" | none | 5s |

### N.3 Warning Toasts

| Trigger | Toast Message | Detail Line | Action Available | Auto-Dismiss |
|---------|-------------|-------------|:---:|:---:|
| Unsaved changes on navigate | "Unsaved changes" | "Your changes will be lost" | "Save" / "Discard" | No |
| Session timeout approaching | "Session expires in 2 minutes" | none | "Extend" button | No |
| Insurance expiring | "Insurance expiring" | "ABC Plumbing — 7 days" | "View" link | 8s |
| Package aging (>48h) | "12 packages over 48 hours old" | "Consider notifying residents" | "View" link | 8s |
| Storage nearing limit | "Storage at 85%" | "2.4 GB of 10 GB used" | "Manage" link | 8s |

### N.4 Info Toasts

| Trigger | Toast Message | Detail Line | Auto-Dismiss |
|---------|-------------|-------------|:---:|
| Real-time update (package arrived) | "New package for Unit 1205" | "FedEx — checked in by Sarah" | 5s |
| Real-time update (request assigned) | "Request #4521 assigned to you" | "Leaking faucet — Unit 1205" | 5s |
| Real-time update (new announcement) | "New announcement" | "Elevator maintenance Mar 15-17" | 5s |
| Background sync complete | "Data synced" | none | 2s |
| Feature tip (first use) | "Tip: Press Cmd+K for quick search" | none | 8s |

### N.5 Toast Stacking Rules

1. Maximum 3 toasts visible simultaneously
2. Newest toast appears at top of stack
3. When 4th toast arrives, oldest toast is auto-dismissed (fade out 200ms)
4. Stack position: top-right, 24px from viewport edges
5. Gap between stacked toasts: 8px (--space-2)
6. Toasts from the same action type (e.g., two success toasts in quick succession) replace rather than stack
7. Error toasts always stack on top of success/info toasts regardless of arrival order
8. Persistent toasts (no auto-dismiss) count toward the 3-toast limit

---

## Appendix O: Responsive Breakpoint Specifications

### O.1 Breakpoint Token Definitions

Concierge is desktop-monitor-first. The breakpoint system prioritizes large screens (1440px+) as the default experience, with progressive degradation for smaller viewports.

| Token | Value | Target | Grid Columns | Sidebar |
|-------|-------|--------|-------------|---------|
| `--bp-4k` | `2560px` | 4K monitors | 16 columns | 280px expanded |
| `--bp-ultrawide` | `1920px` | Ultrawide monitors | 14 columns | 280px expanded |
| `--bp-desktop-xl` | `1440px` | Standard monitors (DEFAULT) | 12 columns | 260px expanded |
| `--bp-desktop` | `1280px` | Smaller monitors / large laptops | 12 columns | 240px expanded |
| `--bp-laptop` | `1024px` | Standard laptops | 10 columns | Collapsed (64px) |
| `--bp-tablet-landscape` | `900px` | Tablets landscape | 8 columns | Collapsed (64px) |
| `--bp-tablet` | `768px` | Tablets portrait | 6 columns | Hidden (overlay) |
| `--bp-mobile-lg` | `480px` | Large phones | 4 columns | Hidden (overlay) |
| `--bp-mobile` | `375px` | Standard phones | 4 columns | Hidden (overlay) |

**CSS Implementation:**

```css
/* Desktop-first: base styles are for 1440px+ */
:root {
  --grid-columns: 12;
  --sidebar-width: 260px;
  --content-max-width: 1200px;
  --gutter: 24px;
}

/* 4K monitors: expand to use available space */
@media (min-width: 2560px) {
  :root {
    --grid-columns: 16;
    --sidebar-width: 280px;
    --content-max-width: 1600px;
    --gutter: 32px;
  }
}

/* Ultrawide monitors */
@media (min-width: 1920px) and (max-width: 2559px) {
  :root {
    --grid-columns: 14;
    --sidebar-width: 280px;
    --content-max-width: 1400px;
    --gutter: 28px;
  }
}

/* Smaller monitors */
@media (max-width: 1279px) {
  :root {
    --grid-columns: 12;
    --sidebar-width: 240px;
    --content-max-width: 1100px;
    --gutter: 20px;
  }
}

/* Laptops — sidebar collapses to icon-only rail */
@media (max-width: 1023px) {
  :root {
    --grid-columns: 10;
    --sidebar-width: 64px;
    --content-max-width: 920px;
    --gutter: 16px;
  }
}

/* Tablets landscape */
@media (max-width: 899px) {
  :root {
    --grid-columns: 8;
    --sidebar-width: 64px;
    --gutter: 16px;
  }
}

/* Tablets portrait — sidebar becomes overlay */
@media (max-width: 767px) {
  :root {
    --grid-columns: 6;
    --sidebar-width: 0px;
    --gutter: 16px;
  }
}

/* Mobile */
@media (max-width: 479px) {
  :root {
    --grid-columns: 4;
    --sidebar-width: 0px;
    --gutter: 12px;
  }
}
```

### O.2 Component Behavior at Breakpoints

#### Stat Card Row

| Breakpoint | Cards per Row | Card Min Width | Card Height |
|-----------|--------------|---------------|-------------|
| 4K | 6 | 240px | 120px |
| Ultrawide | 5 | 220px | 120px |
| Desktop XL (default) | 4 | 200px | 112px |
| Desktop | 4 | 180px | 112px |
| Laptop | 3 | 180px | 104px |
| Tablet Landscape | 2 | 200px | 104px |
| Tablet Portrait | 2 | Full width | 96px |
| Mobile | 1 | Full width | 88px |

```css
.stat-card-row {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(4, 1fr); /* default: 4 cards */
}

@media (min-width: 2560px) {
  .stat-card-row { grid-template-columns: repeat(6, 1fr); }
}

@media (min-width: 1920px) and (max-width: 2559px) {
  .stat-card-row { grid-template-columns: repeat(5, 1fr); }
}

@media (max-width: 1023px) {
  .stat-card-row { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 899px) {
  .stat-card-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 479px) {
  .stat-card-row { grid-template-columns: 1fr; }
}
```

#### Data Table Responsive Strategy

Tables DO NOT become card layouts on smaller screens. Instead:

1. **Desktop (1024px+)**: Full table with all columns visible
2. **Laptop (768-1023px)**: Horizontal scroll with sticky first column (unit/name identifier)
3. **Tablet (below 768px)**: Priority columns only (configurable per table), expansion row for hidden columns
4. **Mobile (below 480px)**: Priority columns only, tap row to expand full details in a slide-up panel

```css
/* Sticky first column for horizontal scrolling tables */
@media (max-width: 1023px) {
  .data-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .data-table th:first-child,
  .data-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--color-bg-primary);
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  }
}

/* Priority column system */
.data-table [data-priority="low"] {
  /* Hidden below tablet landscape */
}
@media (max-width: 899px) {
  .data-table [data-priority="low"] { display: none; }
}

.data-table [data-priority="medium"] {
  /* Hidden below tablet portrait */
}
@media (max-width: 767px) {
  .data-table [data-priority="medium"] { display: none; }
}

/* data-priority="high" columns are always visible */
```

#### Sidebar Navigation Responsive Behavior

| State | Width | Shows | Trigger |
|-------|-------|-------|---------|
| Expanded | 260px | Icon + label + badge count | Default at 1280px+ |
| Collapsed | 64px | Icon only + tooltip on hover | Default at 1024px-1279px, or user toggle |
| Hidden (Overlay) | 0px / 280px overlay | Full nav in overlay panel | Default below 768px, hamburger trigger |

**Sidebar Collapse Animation:**

```css
.sidebar {
  width: var(--sidebar-width);
  transition: width 250ms var(--ease-standard);
  overflow: hidden;
}

.sidebar--collapsed {
  --sidebar-width: 64px;
}

.sidebar--collapsed .sidebar__label,
.sidebar--collapsed .sidebar__badge {
  opacity: 0;
  transition: opacity 150ms ease-out;
  pointer-events: none;
}

.sidebar--collapsed .sidebar__item:hover .sidebar__tooltip {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 150ms ease-in 100ms, transform 150ms ease-in 100ms;
}
```

#### Modal / Dialog Responsive Behavior

| Breakpoint | Dialog Width | Position | Close Method |
|-----------|-------------|----------|-------------|
| Desktop XL+ | 480px-720px (size variants) | Center, 10% from top | X button, Escape, backdrop click |
| Desktop | 480px-640px | Center, 10% from top | X button, Escape, backdrop click |
| Laptop | 440px-600px | Center, 5% from top | X button, Escape, backdrop click |
| Tablet | 90vw, max 560px | Center, auto margins | X button, Escape, backdrop click |
| Mobile | 100vw, 100vh (full screen) | Bottom-up slide | X button, swipe down, back gesture |

```css
.dialog {
  width: min(var(--dialog-width, 560px), calc(100vw - 48px));
  max-height: calc(100vh - 10vh);
  border-radius: var(--radius-xl);
}

/* Full-screen dialog on mobile */
@media (max-width: 479px) {
  .dialog {
    width: 100vw;
    max-height: 100vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    transform: translateY(100%);
    animation: dialog-slide-up 300ms var(--ease-decelerate) forwards;
  }

  @keyframes dialog-slide-up {
    to { transform: translateY(0); }
  }
}
```

### O.3 Touch Target Specifications

On touch-capable devices, interactive elements MUST meet minimum tap target sizes:

| Element Type | Minimum Size | Recommended Size | Spacing Between |
|-------------|-------------|-----------------|----------------|
| Buttons (primary/secondary) | 44px x 44px | 48px x 48px | 8px |
| Icon buttons | 44px x 44px | 44px x 44px | 4px |
| Navigation items | 44px height | 48px height | 0px (full-width) |
| Table rows (tappable) | 48px height | 56px height | 1px (border) |
| Checkbox / Radio | 44px x 44px (hit area) | 44px x 44px | 12px |
| Form inputs | 44px height | 48px height | 16px vertical |
| Dropdown options | 44px height | 48px height | 0px |
| Tab items | 44px height | 48px height | 0px |
| Toast dismiss button | 44px x 44px | 44px x 44px | — |

```css
/* Touch target enlargement for mobile */
@media (pointer: coarse) {
  .btn { min-height: 44px; min-width: 44px; }
  .icon-btn { min-height: 44px; min-width: 44px; padding: 10px; }
  .form-input { min-height: 44px; }
  .table-row--interactive { min-height: 48px; }
  .checkbox-wrapper, .radio-wrapper { min-height: 44px; min-width: 44px; }
}
```

### O.4 Viewport Height Management

For full-height layouts (dashboard, split panes), account for browser chrome:

```css
/* Use dvh (dynamic viewport height) for mobile where address bar collapses */
.layout-full-height {
  height: 100vh; /* Fallback */
  height: 100dvh; /* Dynamic: adjusts as browser chrome hides/shows */
}

/* Safe area insets for notched devices */
.layout-full-height {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## Appendix P: Accessibility Compliance Checklist

This checklist ensures WCAG 2.2 AA compliance across every Concierge component and page. Each item maps to a specific WCAG success criterion.

### P.1 Perceivable

#### Text Alternatives (1.1.1 — Level A)

| Requirement | Implementation | Verification |
|------------|---------------|-------------|
| Every `<img>` has `alt` text | Descriptive alt for informational images; `alt=""` for decorative | Axe audit: zero `image-alt` violations |
| Icon-only buttons have accessible labels | `aria-label` on button OR visually hidden `<span>` | Screen reader announces action name |
| Charts have text alternatives | `<figcaption>` + data table fallback | Chart meaning conveyed without visual |
| SVG icons have `role="img"` when informational | `<svg role="img" aria-label="...">` | Screen reader announces icon meaning |
| Decorative SVGs are hidden | `<svg aria-hidden="true">` | Screen reader skips decoration |
| Logo images link to dashboard | `<a href="/"><img alt="Concierge — Return to dashboard"></a>` | Click and screen reader both work |
| Avatar images have person name as alt | `alt="Jane Smith's profile photo"` | Name announced, not "avatar" |
| Status icons paired with text labels | Never rely on color/icon alone for status | Status understandable without color |

#### Adaptable Content (1.3.1-1.3.5 — Level A/AA)

| Requirement | Implementation | Verification |
|------------|---------------|-------------|
| Semantic heading hierarchy | H1 (page title) → H2 (sections) → H3 (subsections), no skipped levels | HeadingsMap extension shows clean tree |
| Form inputs have associated labels | `<label for="id">` or `aria-labelledby` | Every input announced with label |
| Data tables use `<th>` with `scope` | `scope="col"` for column headers, `scope="row"` for row headers | Screen reader navigates table logically |
| Landmarks define page regions | `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>` | Landmark navigation works |
| Lists use semantic markup | `<ul>/<ol>/<dl>` for list content, not `<div>` chains | Screen reader announces list count |
| Required fields identified programmatically | `aria-required="true"` + visual indicator | Announced as "required" |
| Error messages associated with inputs | `aria-describedby` linking input to error `<span>` | Error read when field focused |
| Autocomplete attributes on personal data fields | `autocomplete="name"`, `autocomplete="email"`, etc. | Browser autofill works |
| Orientation not locked | No `orientation: portrait/landscape` lock in manifest | App works in both orientations |

#### Distinguishable (1.4.x — Level AA)

| Requirement | SC | Implementation | Min Ratio |
|------------|-----|---------------|-----------|
| Normal text contrast | 1.4.3 | All text on its background | 4.5:1 |
| Large text contrast (18px+ bold or 24px+) | 1.4.3 | Headings, large labels | 3:1 |
| Non-text contrast (icons, borders, focus rings) | 1.4.11 | UI component boundaries | 3:1 |
| Focus indicator contrast | 1.4.11 | 2px offset ring | 3:1 vs adjacent colors |
| Text spacing override | 1.4.12 | Content readable with 1.5x line-height, 2x letter-spacing, 2x word-spacing | No content loss |
| Reflow at 400% zoom | 1.4.10 | Single-column layout at 320px equivalent | No horizontal scroll |
| Content on hover/focus | 1.4.13 | Tooltips/popovers dismissible, hoverable, persistent | All three criteria met |
| No images of text | 1.4.5 | Use real text, not text rendered in images | Zero instances |

### P.2 Operable

#### Keyboard (2.1.1-2.1.4 — Level A/AA)

| Requirement | Implementation | Verification |
|------------|---------------|-------------|
| All interactions keyboard-accessible | Tab, Enter, Space, Arrow keys, Escape | Full workflow without mouse |
| No keyboard traps | Focus escapes all components via Tab or Escape | Focus never stuck |
| Focus visible on all interactive elements | 2px solid ring, 2px offset, `--color-focus-ring` | Ring visible on every focusable element |
| Focus order matches visual order | DOM order = visual order, `tabindex` only 0 or -1 | Tab order logical left-to-right, top-to-bottom |
| Skip navigation link | First focusable element: "Skip to main content" | Tab once from page load to activate |
| Character key shortcuts have off switch | Single-key shortcuts can be remapped or disabled | Settings toggle available |
| Escape closes overlays | Modals, dropdowns, popovers, toasts all close on Escape | Consistent behavior |

**Skip Link Implementation:**

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: 16px;
  z-index: 10000;
  padding: 8px 16px;
  background: var(--color-primary-500);
  color: white;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: top 200ms ease-out;
}

.skip-link:focus {
  top: 16px;
}
```

#### Timing (2.2.x — Level A)

| Requirement | Implementation |
|------------|---------------|
| Session timeout: 20+ minute warning | Warning dialog at 5 minutes remaining, option to extend |
| Auto-dismissing toasts: sufficient time | Success: 5s, Error: persistent, Warning: 8s, Info: 5s |
| No content auto-advancing without control | Carousels (if any) have pause button |
| Animations under 5 seconds or stoppable | All looping animations respect `prefers-reduced-motion` |

#### Seizures and Physical Reactions (2.3.1 — Level A)

| Requirement | Implementation |
|------------|---------------|
| No content flashes more than 3 times per second | Zero flashing content in design system |
| Reduced-motion respected | `prefers-reduced-motion: reduce` disables all non-essential animation |
| Parallax effects: none | Concierge has zero parallax effects |

#### Navigation (2.4.x — Level AA)

| Requirement | Implementation |
|------------|---------------|
| Page titles unique and descriptive | `<title>Units — Unit 815 — Concierge</title>` pattern |
| Link purpose clear from text | No "click here" or "read more" without context |
| Multiple navigation methods | Sidebar nav + global search + breadcrumbs |
| Headings describe content | Every section has a descriptive heading |
| Focus not obscured by sticky headers | Scroll padding accounts for sticky header height |

### P.3 Understandable

#### Readable (3.1.x — Level A/AA)

| Requirement | Implementation |
|------------|---------------|
| Page language declared | `<html lang="en-CA">` |
| Language of parts identified | `<span lang="fr">` for French content in bilingual buildings |
| Abbreviations expanded on first use | `<abbr title="Property Manager">PM</abbr>` |

#### Predictable (3.2.x — Level A/AA)

| Requirement | Implementation |
|------------|---------------|
| No context change on focus | Focus never triggers navigation or form submission |
| No context change on input | Select/checkbox changes filter, never navigates away |
| Consistent navigation across pages | Sidebar, header, breadcrumbs same position on every page |
| Consistent identification | Same icon + label for same action across modules |

#### Input Assistance (3.3.x — Level A/AA)

| Requirement | Implementation |
|------------|---------------|
| Error identification | Inline error message below field, red border, error icon |
| Labels or instructions | Every input has visible label; complex fields have helper text |
| Error suggestion | Error messages suggest how to fix (e.g., "Must be a valid email address") |
| Error prevention (legal, financial) | Confirmation step before irreversible actions |
| Redundant entry minimized | Auto-fill unit number when resident selected; remember last-used values |

### P.4 Robust

#### Compatible (4.1.x — Level A/AA)

| Requirement | Implementation |
|------------|---------------|
| Valid HTML | Zero parse errors in W3C validator |
| Name, role, value for custom widgets | ARIA roles on custom dropdowns, tabs, accordions, modals |
| Status messages programmatically determined | `role="status"` on toast container, `aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for errors |

### P.5 ARIA Pattern Reference

Custom components MUST follow WAI-ARIA Authoring Practices. These are the patterns used in Concierge:

| Component | ARIA Pattern | Key Attributes |
|-----------|-------------|----------------|
| Modal Dialog | Dialog (modal) | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Dropdown Menu | Menu | `role="menu"`, `role="menuitem"`, `aria-expanded` |
| Tab Bar | Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Sidebar Nav | Navigation | `<nav aria-label="Main navigation">` |
| Combobox / Autocomplete | Combobox | `role="combobox"`, `aria-autocomplete`, `aria-expanded`, `aria-activedescendant` |
| Toast Stack | Alert | `role="alert"` for errors, `role="status"` for success/info |
| Data Table | Table (sortable) | `aria-sort="ascending/descending/none"` on `<th>` |
| Accordion | Accordion | `aria-expanded`, `aria-controls`, unique `id` linkage |
| Date Picker | Dialog + Grid | `role="grid"` for calendar, arrow key navigation, `aria-selected` |
| Progress Bar | Progressbar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Badge / Tag | Status | `role="status"` if dynamic; static badges need no role |
| Breadcrumb | Navigation | `<nav aria-label="Breadcrumb">`, `aria-current="page"` on last item |
| Pagination | Navigation | `<nav aria-label="Pagination">`, `aria-current="page"` on active |
| Search Input | Search | `role="search"` on wrapper, `type="search"` on input |
| File Upload | Button | `<input type="file">` with associated label, drag-drop zone: `role="button"` |
| Toggle Switch | Switch | `role="switch"`, `aria-checked` |

---

## Appendix Q: Component State Matrix

Every interactive component in Concierge must handle ALL of the following states. This matrix defines visual treatments for each.

### Q.1 Button States

| State | Visual Treatment | Cursor | `aria-*` |
|-------|-----------------|--------|----------|
| Default | Solid fill (primary) or outlined (secondary) | `pointer` | — |
| Hover | Lightness shift -5% (OKLCH L value) | `pointer` | — |
| Active / Pressed | Lightness shift -10%, scale(0.98) | `pointer` | `aria-pressed="true"` (toggle buttons only) |
| Focus | Default + 2px focus ring offset 2px | `pointer` | — |
| Disabled | 40% opacity, no hover/active effects | `not-allowed` | `aria-disabled="true"` |
| Loading | Spinner replaces label, width preserved | `wait` | `aria-busy="true"` |

```css
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-600);
}

.btn-primary:active:not(:disabled) {
  background: var(--color-primary-700);
  transform: scale(0.98);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.btn-primary:disabled,
.btn-primary[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-primary[aria-busy="true"] {
  cursor: wait;
  pointer-events: none;
}

.btn-primary[aria-busy="true"] .btn__label {
  visibility: hidden;
}

.btn-primary[aria-busy="true"]::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: white;
  border-radius: 50%;
  animation: spinner 600ms linear infinite;
}
```

### Q.2 Form Input States

| State | Border | Background | Label | Helper Text |
|-------|--------|-----------|-------|------------|
| Default | `--color-neutral-300` 1px | `--color-bg-primary` (white) | `--color-text-secondary` | `--color-text-tertiary` |
| Hover | `--color-neutral-400` 1px | `--color-bg-primary` | `--color-text-secondary` | `--color-text-tertiary` |
| Focus | `--color-primary-500` 2px | `--color-bg-primary` | `--color-primary-600` | `--color-text-tertiary` |
| Filled | `--color-neutral-300` 1px | `--color-bg-primary` | `--color-text-secondary` | `--color-text-tertiary` |
| Error | `--color-error-500` 2px | `--color-error-50` | `--color-error-600` | `--color-error-500` (error msg) |
| Disabled | `--color-neutral-200` 1px | `--color-neutral-100` | `--color-text-tertiary` 60% | `--color-text-tertiary` 60% |
| Read-only | `--color-neutral-200` 1px dashed | `--color-neutral-50` | `--color-text-secondary` | `--color-text-tertiary` |

### Q.3 Table Row States

| State | Background | Left Border | Text Color |
|-------|-----------|------------|-----------|
| Default (even) | `--color-bg-primary` (white) | None | `--color-text-primary` |
| Default (odd) | `--color-neutral-50` | None | `--color-text-primary` |
| Hover | `--color-primary-50` | None | `--color-text-primary` |
| Selected | `--color-primary-100` | 3px `--color-primary-500` | `--color-text-primary` |
| Active/Pressed | `--color-primary-200` | 3px `--color-primary-500` | `--color-text-primary` |
| Expandable (collapsed) | Default | None, chevron-right icon | `--color-text-primary` |
| Expandable (expanded) | `--color-primary-50` | 3px `--color-primary-400` | `--color-text-primary` |
| Dragging | White, `shadow-3` elevation, 95% opacity | None | `--color-text-primary` |
| Drop target | `--color-primary-100`, 2px dashed border | None | `--color-text-primary` |
| Error row | `--color-error-50` | 3px `--color-error-500` | `--color-text-primary` |

### Q.4 Navigation Item States

| State | Background | Text | Icon | Indicator |
|-------|-----------|------|------|-----------|
| Default | Transparent | `--color-text-secondary` | `--color-text-tertiary` | None |
| Hover | `--color-neutral-100` | `--color-text-primary` | `--color-text-secondary` | None |
| Active (current page) | `--color-primary-50` | `--color-primary-600` | `--color-primary-500` | 3px left bar, `--color-primary-500` |
| Focus | Transparent + focus ring | `--color-text-primary` | `--color-text-secondary` | Focus ring |
| Collapsed hover | `--color-neutral-100` | Tooltip shown | `--color-text-secondary` | None |
| Collapsed active | `--color-primary-50` | Tooltip shown | `--color-primary-500` | 3px left bar |
| With badge | Default + badge | Default | Default | Badge count right-aligned |
| Section header | Transparent | `--color-text-tertiary` uppercase 11px | None | None |

### Q.5 Card States (Event Cards, Stat Cards)

| State | Border | Shadow | Transform | Additional |
|-------|--------|--------|-----------|-----------|
| Default | `--color-neutral-200` 1px | `shadow-1` | None | — |
| Hover | `--color-neutral-300` 1px | `shadow-2` | translateY(-1px) | Cursor: pointer (if clickable) |
| Active / Pressed | `--color-primary-300` 1px | `shadow-1` | translateY(0) | — |
| Focus | Default + focus ring | `shadow-1` | None | 2px focus ring |
| Selected | `--color-primary-500` 2px | `shadow-2` | None | Checkmark indicator |
| Dragging | None | `shadow-3` | scale(1.02), rotate(1deg) | 90% opacity, cursor: grabbing |
| Loading | Default | `shadow-1` | None | Skeleton shimmer overlay |
| Error | `--color-error-300` 1px | `shadow-1` | None | Error icon top-right |
| Disabled | `--color-neutral-200` 1px | `shadow-0` | None | 50% opacity |

### Q.6 Toggle / Switch States

| State | Track Color | Thumb Position | Thumb Color | Label |
|-------|-----------|---------------|------------|-------|
| Off (default) | `--color-neutral-300` | Left | White | "Off" or feature label |
| Off (hover) | `--color-neutral-400` | Left | White | — |
| On | `--color-success-500` | Right | White | "On" or feature label |
| On (hover) | `--color-success-600` | Right | White | — |
| Disabled off | `--color-neutral-200` | Left | `--color-neutral-100` | Grayed label |
| Disabled on | `--color-success-200` | Right | `--color-neutral-100` | Grayed label |
| Focus | Default + focus ring on thumb | Default | Default | — |

```css
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-neutral-300);
  position: relative;
  cursor: pointer;
  transition: background 200ms ease;
}

.toggle[aria-checked="true"] {
  background: var(--color-success-500);
}

.toggle__thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 200ms var(--ease-standard);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle[aria-checked="true"] .toggle__thumb {
  transform: translateX(20px);
}

.toggle:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

### Q.7 Badge / Chip States

| Variant | Background | Text | Border | Removable |
|---------|-----------|------|--------|-----------|
| Neutral | `--color-neutral-100` | `--color-neutral-700` | None | Optional X |
| Primary | `--color-primary-100` | `--color-primary-700` | None | Optional X |
| Success | `--color-success-100` | `--color-success-700` | None | Optional X |
| Warning | `--color-warning-100` | `--color-warning-800` | None | Optional X |
| Error | `--color-error-100` | `--color-error-700` | None | Optional X |
| Outline | Transparent | `--color-text-secondary` | 1px `--color-neutral-300` | Optional X |
| Selected | `--color-primary-500` | White | None | X button always shown |
| Disabled | `--color-neutral-100` 60% | `--color-neutral-500` | None | No |

**Removable Badge Interaction:**

```css
.badge__remove {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  cursor: pointer;
  transition: background 150ms ease;
}

.badge__remove:hover {
  background: rgba(0, 0, 0, 0.1);
}

.badge__remove:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}
```

---

## Appendix R: CSS Custom Property Complete Reference

Every design token in Concierge mapped to its CSS custom property, organized by category. This is the definitive token dictionary for implementation.

### R.1 Color Tokens

```css
:root {
  /* ---- Primary Blue Scale ---- */
  --color-primary-50:  oklch(0.971 0.014 262.88); /* #F0F5FF */
  --color-primary-100: oklch(0.932 0.032 262.88); /* #DBEAFE */
  --color-primary-200: oklch(0.882 0.059 262.88); /* #BFDBFE */
  --color-primary-300: oklch(0.809 0.105 262.88); /* #93C5FD */
  --color-primary-400: oklch(0.707 0.165 262.88); /* #60A5FA */
  --color-primary-500: oklch(0.546 0.245 262.88); /* #0071E3 — primary CTA */
  --color-primary-600: oklch(0.496 0.220 262.88); /* #005BBF — hover */
  --color-primary-700: oklch(0.446 0.195 262.88); /* #00459B — active */
  --color-primary-800: oklch(0.370 0.160 262.88); /* #003078 */
  --color-primary-900: oklch(0.294 0.125 262.88); /* #001C55 */

  /* ---- Neutral Scale ---- */
  --color-neutral-50:  oklch(0.985 0.000 0);      /* #FAFAFA */
  --color-neutral-100: oklch(0.962 0.001 264);     /* #F5F5F7 */
  --color-neutral-200: oklch(0.925 0.002 264);     /* #E8E8ED */
  --color-neutral-300: oklch(0.869 0.003 264);     /* #D2D2D7 */
  --color-neutral-400: oklch(0.738 0.004 264);     /* #AEAEB2 */
  --color-neutral-500: oklch(0.629 0.006 264);     /* #8E8E93 */
  --color-neutral-600: oklch(0.532 0.007 264);     /* #6C6C70 */
  --color-neutral-700: oklch(0.442 0.008 264);     /* #48484A */
  --color-neutral-800: oklch(0.345 0.009 264);     /* #2C2C2E */
  --color-neutral-900: oklch(0.250 0.009 264);     /* #1C1C1E */

  /* ---- Success Green Scale ---- */
  --color-success-50:  oklch(0.962 0.024 155);     /* #ECFDF5 */
  --color-success-100: oklch(0.920 0.050 155);     /* #D1FAE5 */
  --color-success-200: oklch(0.860 0.085 155);     /* #A7F3D0 */
  --color-success-300: oklch(0.782 0.128 155);     /* #6EE7B7 */
  --color-success-400: oklch(0.696 0.158 155);     /* #34D399 */
  --color-success-500: oklch(0.596 0.163 155);     /* #059669 — status: success */
  --color-success-600: oklch(0.530 0.145 155);     /* #047857 */
  --color-success-700: oklch(0.464 0.127 155);     /* #065F46 */

  /* ---- Warning Amber Scale ---- */
  --color-warning-50:  oklch(0.978 0.030 85);      /* #FFFBEB */
  --color-warning-100: oklch(0.950 0.062 85);      /* #FEF3C7 */
  --color-warning-200: oklch(0.910 0.103 85);      /* #FDE68A */
  --color-warning-300: oklch(0.860 0.145 85);      /* #FCD34D */
  --color-warning-400: oklch(0.808 0.170 85);      /* #FBBF24 */
  --color-warning-500: oklch(0.751 0.170 70);      /* #D97706 — status: warning */
  --color-warning-600: oklch(0.670 0.155 60);      /* #B45309 */
  --color-warning-700: oklch(0.585 0.130 55);      /* #92400E */
  --color-warning-800: oklch(0.500 0.108 50);      /* #78350F */

  /* ---- Error Red Scale ---- */
  --color-error-50:  oklch(0.971 0.018 25);        /* #FEF2F2 */
  --color-error-100: oklch(0.940 0.038 25);        /* #FEE2E2 */
  --color-error-200: oklch(0.892 0.072 25);        /* #FECACA */
  --color-error-300: oklch(0.820 0.120 25);        /* #FCA5A5 */
  --color-error-400: oklch(0.730 0.170 25);        /* #F87171 */
  --color-error-500: oklch(0.628 0.210 25);        /* #DC2626 — status: error */
  --color-error-600: oklch(0.560 0.195 25);        /* #B91C1C */
  --color-error-700: oklch(0.490 0.170 25);        /* #991B1B */

  /* ---- Info Blue Scale (distinct from Primary) ---- */
  --color-info-50:  oklch(0.965 0.018 240);        /* #EFF6FF */
  --color-info-100: oklch(0.928 0.038 240);        /* #DBEAFE */
  --color-info-500: oklch(0.588 0.200 255);        /* #3B82F6 — status: info */
  --color-info-600: oklch(0.520 0.190 255);        /* #2563EB */

  /* ---- Semantic / Purpose Tokens ---- */
  --color-bg-primary:      var(--color-neutral-50);    /* Page background */
  --color-bg-secondary:    white;                       /* Card/surface background */
  --color-bg-tertiary:     var(--color-neutral-100);    /* Nested surface */
  --color-bg-accent:       var(--color-primary-50);     /* Accent tint background */
  --color-bg-overlay:      oklch(0.15 0 0 / 0.6);      /* Modal backdrop */

  --color-text-primary:    var(--color-neutral-900);    /* Body text */
  --color-text-secondary:  var(--color-neutral-600);    /* Labels, secondary */
  --color-text-tertiary:   var(--color-neutral-500);    /* Placeholders, hints */
  --color-text-inverse:    white;                       /* Text on dark/primary bg */
  --color-text-link:       var(--color-primary-500);    /* Hyperlinks */

  --color-border-default:  var(--color-neutral-200);    /* Default borders */
  --color-border-strong:   var(--color-neutral-300);    /* Emphasized borders */
  --color-border-focus:    var(--color-primary-500);    /* Focus ring borders */

  --color-focus-ring:      var(--color-primary-500);    /* Focus ring color */
}
```

### R.2 Spacing Tokens

```css
:root {
  --space-0:   0px;
  --space-0.5: 2px;
  --space-1:   4px;
  --space-1.5: 6px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;

  /* Semantic spacing */
  --spacing-page-x:       var(--space-8);    /* Horizontal page padding */
  --spacing-page-y:       var(--space-6);    /* Vertical page padding */
  --spacing-section-gap:  var(--space-8);    /* Between major sections */
  --spacing-card-padding: var(--space-5);    /* Inside cards */
  --spacing-form-gap:     var(--space-5);    /* Between form fields */
  --spacing-inline-gap:   var(--space-3);    /* Between inline elements */
  --spacing-stack-gap:    var(--space-4);    /* Between stacked items */
}
```

### R.3 Typography Tokens

```css
:root {
  /* Font families */
  --font-display:   'Inter Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:      'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace;

  /* Font sizes */
  --text-xs:    11px;
  --text-sm:    13px;
  --text-base:  14px;
  --text-md:    15px;
  --text-lg:    16px;
  --text-xl:    18px;
  --text-2xl:   20px;
  --text-3xl:   24px;
  --text-4xl:   30px;
  --text-5xl:   36px;
  --text-6xl:   48px;

  /* Line heights */
  --leading-none:    1.0;
  --leading-tight:   1.2;
  --leading-snug:    1.375;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;
  --leading-loose:   2.0;

  /* Font weights */
  --weight-regular:   400;
  --weight-medium:    500;
  --weight-semibold:  600;
  --weight-bold:      700;

  /* Letter spacing */
  --tracking-tight:   -0.01em;
  --tracking-normal:  0;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;
  --tracking-widest:  0.1em;

  /* Heading presets — compose above tokens */
  /* H1: 30px/1.2, Inter Display, Semibold, -0.01em */
  /* H2: 24px/1.2, Inter Display, Semibold, -0.01em */
  /* H3: 20px/1.375, Inter, Semibold, 0 */
  /* H4: 16px/1.375, Inter, Semibold, 0 */
  /* H5: 14px/1.375, Inter, Semibold, 0 */
  /* H6: 13px/1.375, Inter, Semibold, 0.025em (uppercase) */
}
```

### R.4 Shadow / Elevation Tokens

```css
:root {
  --shadow-0: none;
  --shadow-1: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-2: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-3: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  --shadow-4: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
  --shadow-5: 0 25px 50px -12px rgba(0, 0, 0, 0.20);

  /* Focus ring shadow (used alongside outline for multi-ring effect) */
  --shadow-focus: 0 0 0 3px oklch(0.546 0.245 262.88 / 0.25);
}
```

### R.5 Border Radius Tokens

```css
:root {
  --radius-none: 0;
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-2xl:  16px;
  --radius-full: 9999px;

  /* Semantic radius */
  --radius-button:  var(--radius-lg);
  --radius-card:    var(--radius-xl);
  --radius-input:   var(--radius-md);
  --radius-badge:   var(--radius-full);
  --radius-avatar:  var(--radius-full);
  --radius-dialog:  var(--radius-xl);
  --radius-tooltip: var(--radius-md);
}
```

### R.6 Z-Index Scale

```css
:root {
  --z-behind:      -1;
  --z-default:     0;
  --z-dropdown:    100;
  --z-sticky:      200;
  --z-sidebar:     300;
  --z-overlay:     400;
  --z-modal:       500;
  --z-popover:     600;
  --z-tooltip:     700;
  --z-toast:       800;
  --z-debug:       9999;
}
```

### R.7 Animation Tokens

```css
:root {
  /* Durations */
  --duration-instant:  0ms;
  --duration-fast:     100ms;
  --duration-normal:   200ms;
  --duration-moderate: 300ms;
  --duration-slow:     400ms;
  --duration-slower:   500ms;

  /* Easing curves */
  --ease-standard:    cubic-bezier(0.2, 0.0, 0, 1.0);
  --ease-decelerate:  cubic-bezier(0.0, 0.0, 0, 1.0);
  --ease-accelerate:  cubic-bezier(0.3, 0.0, 1, 1.0);
  --ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-bounce:      cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-linear:      linear;

  /* Composite transitions (most common combos) */
  --transition-fast:     all 100ms var(--ease-standard);
  --transition-normal:   all 200ms var(--ease-standard);
  --transition-color:    color 150ms ease, background-color 150ms ease, border-color 150ms ease;
  --transition-shadow:   box-shadow 200ms var(--ease-standard);
  --transition-transform: transform 200ms var(--ease-standard);
  --transition-opacity:  opacity 200ms ease;
}

/* Reduced motion override — applies globally */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast:     0ms;
    --duration-normal:   0ms;
    --duration-moderate: 0ms;
    --duration-slow:     0ms;
    --duration-slower:   0ms;
  }

  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### R.8 Layout Tokens

```css
:root {
  /* Grid */
  --grid-columns:     12;
  --grid-gutter:      var(--space-6);
  --grid-margin:      var(--space-8);

  /* Content constraints */
  --content-max-width: 1200px;
  --content-narrow:    720px;
  --content-wide:      1400px;

  /* Sidebar */
  --sidebar-width-expanded:  260px;
  --sidebar-width-collapsed: 64px;

  /* Header */
  --header-height: 64px;

  /* Scroll padding (account for sticky header) */
  --scroll-padding-top: calc(var(--header-height) + var(--space-4));
}

html {
  scroll-padding-top: var(--scroll-padding-top);
}
```

---

*Final end of Concierge Design System v2*
*Document statistics:*
*- Main sections: 12*
*- Appendices: 18 (A through R)*
*- Color tokens defined: 85+ with OKLCH + hex + CSS custom properties*
*- Icon mappings: 140+*
*- Micro-interactions cataloged: 34*
*- Component states documented: 100+*
*- Badge types defined: 22*
*- Empty states specified: 17*
*- Form input types: 14*
*- Keyboard shortcuts: 40+*
*- Print templates: 3*
*- Toast notification types: 40+*
*- Interaction flows: 6 detailed step-by-step*
*- Loading skeletons: 15 element types*
*- Contrast ratios verified: 20+ combinations*
*- Design decisions logged: 15 with rationale*
*- Responsive breakpoints: 9 with component behavior specs*
*- ARIA patterns documented: 16*
*- Accessibility checklist items: 60+*
*- Complete CSS custom property reference: 120+ tokens*

---

## Appendix S: Design Token Usage Patterns Per Module

> This appendix maps every design token to the specific modules and screens that consume it.
> Engineers implementing a module can use this as a lookup table to pull the correct tokens
> without scanning the entire color system.

### S.1 Security Console Module

The Security Console is the most color-dense module in Concierge. It uses status colors extensively
because every entry type (parcels, visitors, incidents, keys, pass-on log, cleaning, notes) has
its own lifecycle with distinct states.

#### S.1.1 Entry Type Color Mapping

| Entry Type | Card Accent Color Token | Icon Token | Badge Background Token | Badge Text Token |
|------------|------------------------|------------|----------------------|-----------------|
| Parcels | `--color-warning-500` | `--icon-color-warning` | `--color-warning-50` | `--color-warning-700` |
| Visitors | `--color-primary-500` | `--icon-color-primary` | `--color-primary-50` | `--color-primary-700` |
| Incidents | `--color-error-500` | `--icon-color-error` | `--color-error-50` | `--color-error-700` |
| Key Sign-Out | `--color-neutral-500` | `--icon-color-neutral` | `--color-neutral-100` | `--color-neutral-700` |
| Pass-On Log | `--color-info-500` | `--icon-color-info` | `--color-info-50` | `--color-info-700` |
| Cleaning Log | `--color-success-500` | `--icon-color-success` | `--color-success-50` | `--color-success-700` |
| Notes | `--color-neutral-400` | `--icon-color-muted` | `--color-neutral-50` | `--color-neutral-600` |

#### S.1.2 Incident Severity Tokens

| Severity | Dot Color Token | Background Token | Border Token | Text Token |
|----------|----------------|-----------------|-------------|-----------|
| Critical | `--color-error-600` | `--color-error-50` | `--color-error-200` | `--color-error-800` |
| High | `--color-error-500` | `--color-error-50` | `--color-error-100` | `--color-error-700` |
| Medium | `--color-warning-500` | `--color-warning-50` | `--color-warning-100` | `--color-warning-700` |
| Low | `--color-info-500` | `--color-info-50` | `--color-info-100` | `--color-info-700` |
| Informational | `--color-neutral-400` | `--color-neutral-50` | `--color-neutral-100` | `--color-neutral-600` |

#### S.1.3 Security Console Timeline Tokens

```css
/* Timeline spine */
.security-timeline__spine {
  background: var(--color-neutral-200);
  width: 2px;
}

/* Timeline node (per entry) */
.security-timeline__node {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-bg-secondary);
  /* background set by entry type token */
}

/* Timeline connector line between nodes */
.security-timeline__connector {
  background: var(--color-neutral-200);
  width: 1px;
}

/* Current shift highlight band */
.security-timeline__current-shift {
  background: var(--color-primary-50);
  border-inline-start: 3px solid var(--color-primary-400);
}
```

#### S.1.4 Shift Handoff Panel Tokens

| Element | Token | Value |
|---------|-------|-------|
| Panel background | `--color-bg-tertiary` | Neutral-100 |
| Active shift indicator | `--color-success-500` | Green dot, pulsing |
| Previous shift label | `--color-text-tertiary` | Muted text |
| Handoff notes background | `--color-warning-50` | Light amber |
| Handoff notes border | `--color-warning-200` | Amber inline-start border |
| Urgent handoff flag | `--color-error-500` | Red exclamation icon |
| Handoff notes text | `--color-text-primary` | Standard body text |

### S.2 Package Management Module

#### S.2.1 Courier Brand Color Tokens

Courier logos and identification colors help front desk staff visually scan packages at speed.
These are decorative-only and never used for text or status indication.

| Courier | Brand Color Token | OKLCH Value | Hex Fallback | Card Stripe |
|---------|------------------|-------------|-------------|-------------|
| Amazon | `--courier-amazon` | `oklch(0.600 0.180 80.00)` | `#FF9900` | inline-start border 3px |
| FedEx | `--courier-fedex` | `oklch(0.480 0.180 310.00)` | `#4D148C` | inline-start border 3px |
| UPS | `--courier-ups` | `oklch(0.450 0.120 65.00)` | `#644117` | inline-start border 3px |
| Canada Post | `--courier-canadapost` | `oklch(0.530 0.220 25.00)` | `#E31837` | inline-start border 3px |
| Purolator | `--courier-purolator` | `oklch(0.530 0.220 25.00)` | `#DA291C` | inline-start border 3px |
| DHL | `--courier-dhl` | `oklch(0.650 0.200 75.00)` | `#FFCC00` | inline-start border 3px |
| IntelCom | `--courier-intelcom` | `oklch(0.546 0.245 262.88)` | `#0071E3` | inline-start border 3px |
| Other / Unknown | `--courier-other` | `oklch(0.550 0.000 0.00)` | `#737373` | inline-start border 3px |

#### S.2.2 Package Status Lifecycle Tokens

| Status | Badge Background | Badge Text | Status Dot | Row Highlight |
|--------|-----------------|-----------|-----------|--------------|
| Checked In | `--color-primary-50` | `--color-primary-700` | `--color-primary-500` | none |
| Notified | `--color-info-50` | `--color-info-600` | `--color-info-500` | none |
| Picked Up | `--color-success-50` | `--color-success-700` | `--color-success-500` | none |
| Aging (>24h) | `--color-warning-50` | `--color-warning-700` | `--color-warning-500` | `--color-warning-50` |
| Aging (>48h) | `--color-error-50` | `--color-error-700` | `--color-error-500` | `--color-error-50` |
| Returned | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-400` | none |
| Refused | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-400` | none |

#### S.2.3 Package Card Layout Tokens

```css
.package-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-card);
  padding: var(--spacing-card-padding);
  box-shadow: var(--shadow-1);
  transition: box-shadow var(--duration-fast) var(--ease-standard);
}

.package-card:hover {
  box-shadow: var(--shadow-2);
}

.package-card__courier-stripe {
  width: 3px;
  border-radius: var(--radius-full);
  /* color set by courier token */
}

.package-card__reference {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  letter-spacing: var(--tracking-wide);
}

.package-card__unit {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.package-card__timestamp {
  font-size: var(--text-xs);
  color: var(--color-neutral-400);
}
```

### S.3 Maintenance / Service Request Module

#### S.3.1 Priority Color Tokens

| Priority | Token | Badge Background | Badge Text | Kanban Column Header |
|----------|-------|-----------------|-----------|---------------------|
| Emergency | `--priority-emergency` | `--color-error-600` | `--color-text-inverse` | `--color-error-50` border-top 3px `--color-error-600` |
| Urgent | `--priority-urgent` | `--color-error-50` | `--color-error-700` | `--color-error-50` border-top 3px `--color-error-400` |
| High | `--priority-high` | `--color-warning-50` | `--color-warning-700` | `--color-warning-50` border-top 3px `--color-warning-500` |
| Normal | `--priority-normal` | `--color-primary-50` | `--color-primary-700` | `--color-primary-50` border-top 3px `--color-primary-400` |
| Low | `--priority-low` | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-50` border-top 3px `--color-neutral-300` |

#### S.3.2 Kanban Column Tokens

| Column | Header BG | Header Text | Card Count Badge | Drop Target Highlight |
|--------|-----------|------------|-----------------|---------------------|
| Open | `--color-primary-50` | `--color-primary-800` | `--color-primary-100` | `--color-primary-100` dashed border |
| In Progress | `--color-warning-50` | `--color-warning-800` | `--color-warning-100` | `--color-warning-100` dashed border |
| On Hold | `--color-neutral-50` | `--color-neutral-700` | `--color-neutral-100` | `--color-neutral-100` dashed border |
| Completed | `--color-success-50` | `--color-success-700` | `--color-success-100` | `--color-success-100` dashed border |
| Closed | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-200` | `--color-neutral-200` dashed border |

#### S.3.3 Service Request Card Tokens

```css
.service-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
}

.service-card--dragging {
  box-shadow: var(--shadow-4);
  opacity: 0.92;
  transform: rotate(2deg);
}

.service-card__priority-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  /* color set by priority token */
}

.service-card__category-icon {
  color: var(--color-neutral-400);
  width: 16px;
  height: 16px;
}

.service-card__age-warning {
  font-size: var(--text-xs);
  color: var(--color-warning-600);
}

.service-card__assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-avatar);
  border: 2px solid var(--color-bg-secondary);
}
```

### S.4 Amenity Booking Module

#### S.4.1 Booking Status Tokens

| Status | Calendar Cell BG | Calendar Cell Text | Badge BG | Badge Text |
|--------|-----------------|-------------------|----------|-----------|
| Available | `--color-bg-secondary` | `--color-neutral-400` | n/a | n/a |
| Booked (own) | `--color-primary-100` | `--color-primary-700` | `--color-primary-50` | `--color-primary-700` |
| Booked (others) | `--color-neutral-100` | `--color-neutral-500` | `--color-neutral-100` | `--color-neutral-600` |
| Pending Approval | `--color-warning-50` | `--color-warning-700` | `--color-warning-50` | `--color-warning-700` |
| Blocked / Maintenance | `--color-neutral-100` | `--color-neutral-400` | `--color-neutral-100` | `--color-neutral-500` |
| Past (uneditable) | `--color-neutral-50` | `--color-neutral-300` | n/a | n/a |

#### S.4.2 Calendar Grid Tokens

```css
.calendar-grid {
  --calendar-cell-height: 48px;
  --calendar-header-height: 40px;
  --calendar-border: 1px solid var(--color-neutral-100);
  --calendar-today-bg: var(--color-primary-50);
  --calendar-today-number: var(--color-primary-700);
  --calendar-weekend-bg: var(--color-neutral-50);
  --calendar-hover-bg: var(--color-bg-tertiary);
}

.calendar-grid__time-label {
  font-size: var(--text-xs);
  color: var(--color-neutral-400);
  width: 56px;
  text-align: end;
  padding-inline-end: var(--space-2);
}

.calendar-grid__now-line {
  border-top: 2px solid var(--color-error-500);
  position: absolute;
  width: 100%;
  z-index: var(--z-default);
}

.calendar-grid__now-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-error-500);
  position: absolute;
  inset-inline-start: -4px;
  top: -4px;
}
```

### S.5 Announcements Module

#### S.5.1 Announcement Type Tokens

| Type | Icon Color | Card Accent | Badge BG | Badge Text |
|------|-----------|-------------|----------|-----------|
| General | `--color-primary-500` | `--color-primary-100` inline-start border | `--color-primary-50` | `--color-primary-700` |
| Maintenance Notice | `--color-warning-500` | `--color-warning-100` inline-start border | `--color-warning-50` | `--color-warning-700` |
| Emergency / Urgent | `--color-error-500` | `--color-error-100` inline-start border | `--color-error-50` | `--color-error-700` |
| Event | `--color-success-500` | `--color-success-100` inline-start border | `--color-success-50` | `--color-success-700` |
| Community | `--color-info-500` | `--color-info-100` inline-start border | `--color-info-50` | `--color-info-700` |
| Rule / Policy Update | `--color-neutral-500` | `--color-neutral-200` inline-start border | `--color-neutral-100` | `--color-neutral-700` |

#### S.5.2 Distribution Channel Indicator Tokens

```css
.channel-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.channel-indicator__icon--email { color: var(--color-primary-500); }
.channel-indicator__icon--sms { color: var(--color-success-500); }
.channel-indicator__icon--push { color: var(--color-warning-500); }
.channel-indicator__icon--lobby-screen { color: var(--color-info-500); }
.channel-indicator__icon--portal { color: var(--color-neutral-400); }
```

### S.6 Unit File Module

#### S.6.1 Occupancy Status Tokens

| Status | Dot Token | Text Token | Row BG Token |
|--------|----------|-----------|-------------|
| Occupied — Owner | `--color-success-500` | `--color-success-700` | none |
| Occupied — Tenant | `--color-primary-500` | `--color-primary-700` | none |
| Vacant | `--color-neutral-300` | `--color-neutral-500` | `--color-neutral-50` |
| Under Renovation | `--color-warning-500` | `--color-warning-700` | `--color-warning-50` |
| Sold — Pending Move-In | `--color-info-500` | `--color-info-600` | none |

#### S.6.2 FOB / Key Status Tokens

| Status | Badge BG | Badge Text | Icon Color |
|--------|----------|-----------|-----------|
| Active | `--color-success-50` | `--color-success-700` | `--color-success-500` |
| Lost | `--color-error-50` | `--color-error-700` | `--color-error-500` |
| Deactivated | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-400` |
| Replacement Pending | `--color-warning-50` | `--color-warning-700` | `--color-warning-500` |

### S.7 Vendor Compliance Module

#### S.7.1 Compliance Status Tokens

| Status | Card BG | Card Border | Badge BG | Badge Text | Status Dot |
|--------|---------|------------|----------|-----------|-----------|
| Compliant | `--color-bg-secondary` | `--color-success-200` | `--color-success-50` | `--color-success-700` | `--color-success-500` |
| Expiring (<30 days) | `--color-warning-50` | `--color-warning-200` | `--color-warning-50` | `--color-warning-700` | `--color-warning-500` |
| Expired | `--color-error-50` | `--color-error-200` | `--color-error-50` | `--color-error-700` | `--color-error-500` |
| Not Submitted | `--color-neutral-50` | `--color-neutral-200` | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-400` |
| Not Tracking | `--color-bg-secondary` | `--color-neutral-100` | `--color-neutral-50` | `--color-neutral-500` | `--color-neutral-300` |

### S.8 Training / LMS Module

#### S.8.1 Course Progress Tokens

| Status | Badge BG | Badge Text | Progress Bar Fill |
|--------|----------|-----------|------------------|
| Not Started | `--color-neutral-100` | `--color-neutral-600` | `--color-neutral-200` |
| In Progress | `--color-primary-50` | `--color-primary-700` | `--color-primary-500` |
| Passed | `--color-success-50` | `--color-success-700` | `--color-success-500` |
| Failed | `--color-error-50` | `--color-error-700` | `--color-error-500` |
| Expired (re-cert needed) | `--color-warning-50` | `--color-warning-700` | `--color-warning-500` |

#### S.8.2 Quiz Answer Feedback Tokens

```css
.quiz-answer--correct {
  background: var(--color-success-50);
  border: 1px solid var(--color-success-300);
  color: var(--color-success-700);
}

.quiz-answer--incorrect {
  background: var(--color-error-50);
  border: 1px solid var(--color-error-300);
  color: var(--color-error-700);
}

.quiz-answer--selected {
  border: 2px solid var(--color-primary-500);
  box-shadow: var(--shadow-focus);
}

.quiz-progress-bar {
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  height: 6px;
}

.quiz-progress-bar__fill {
  background: var(--color-primary-500);
  border-radius: var(--radius-full);
  height: 6px;
  transition: width var(--duration-normal) var(--ease-standard);
}
```

### S.9 Reports Module

#### S.9.1 Export Button Tokens

```css
.export-btn--csv {
  color: var(--color-success-700);
  background: var(--color-success-50);
  border: 1px solid var(--color-success-200);
}

.export-btn--excel {
  color: var(--color-success-700);
  background: var(--color-success-50);
  border: 1px solid var(--color-success-200);
}

.export-btn--pdf {
  color: var(--color-error-700);
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
}

.export-btn--print {
  color: var(--color-neutral-700);
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
}
```

#### S.9.2 Chart Data Series Tokens (Module-Specific)

| Chart Context | Series 1 | Series 2 | Series 3 | Series 4 |
|--------------|----------|----------|----------|----------|
| Package volume by courier | `--courier-amazon` | `--courier-fedex` | `--courier-ups` | `--courier-canadapost` |
| Service requests by status | `--color-primary-500` | `--color-warning-500` | `--color-neutral-400` | `--color-success-500` |
| Amenity usage by type | `--chart-series-1` | `--chart-series-2` | `--chart-series-3` | `--chart-series-4` |
| Incident trends | `--color-error-500` | `--color-error-300` | `--color-warning-500` | `--color-warning-300` |
| Move-ins/outs | `--color-success-500` | `--color-error-400` | n/a | n/a |

### S.10 Classified Ads Module

#### S.10.1 Ad Category Tokens

| Category | Icon Color | Card Accent | Badge BG | Badge Text |
|----------|-----------|-------------|----------|-----------|
| For Sale | `--color-success-500` | `--color-success-100` | `--color-success-50` | `--color-success-700` |
| Wanted | `--color-primary-500` | `--color-primary-100` | `--color-primary-50` | `--color-primary-700` |
| Free | `--color-info-500` | `--color-info-100` | `--color-info-50` | `--color-info-600` |
| Services | `--color-warning-500` | `--color-warning-100` | `--color-warning-50` | `--color-warning-700` |
| Lost & Found | `--color-error-500` | `--color-error-100` | `--color-error-50` | `--color-error-700` |
| Expired Ad | `--color-neutral-300` | `--color-neutral-100` | `--color-neutral-100` | `--color-neutral-500` |

---

## Appendix T: Internationalization Preparation

> Concierge v1 launches in English (Canada) only, but the architecture must support future
> localization without structural refactoring. This appendix defines the preparation required.

### T.1 String Externalization Rules

All user-facing strings MUST be externalized. No hardcoded strings in components.

#### T.1.1 String File Structure

```
locales/
  en-CA/
    common.json          -- shared strings (Save, Cancel, Delete, etc.)
    navigation.json      -- sidebar, breadcrumb, page titles
    packages.json        -- package module strings
    maintenance.json     -- service request module strings
    security.json        -- security console strings
    amenities.json       -- amenity booking strings
    announcements.json   -- announcement module strings
    units.json           -- unit file module strings
    reports.json         -- report module strings
    settings.json        -- settings module strings
    errors.json          -- error messages
    validation.json      -- form validation messages
    training.json        -- training/LMS module strings
    vendors.json         -- vendor compliance strings
    classifieds.json     -- classified ads strings
```

#### T.1.2 String Key Naming Convention

```json
{
  "packages.checkIn.title": "Check In Package",
  "packages.checkIn.unitLabel": "Unit Number",
  "packages.checkIn.carrierLabel": "Carrier",
  "packages.checkIn.submitButton": "Check In",
  "packages.checkIn.successToast": "Package checked in for Unit {{unit}}",
  "packages.status.checkedIn": "Checked In",
  "packages.status.notified": "Notified",
  "packages.status.pickedUp": "Picked Up",
  "packages.status.aging": "Aging ({{hours}}h)",
  "packages.table.columns.reference": "Reference #",
  "packages.table.columns.unit": "Unit",
  "packages.table.columns.carrier": "Carrier",
  "packages.table.columns.checkedInBy": "Checked In By",
  "packages.table.columns.checkedInAt": "Date / Time",
  "packages.table.empty": "No packages to display",
  "packages.table.empty.action": "Check in a new package"
}
```

Key naming rules:
- Dot-separated namespace: `{module}.{section}.{element}`
- camelCase for each segment
- Interpolation variables in double curly braces: `{{variable}}`
- Pluralization keys use `.one` / `.other` suffixes

#### T.1.3 Strings That Must NOT Be Externalized

| Category | Example | Reason |
|----------|---------|--------|
| Unit numbers | "1205" | Data, not UI text |
| Resident names | "John Smith" | User-generated content |
| Reference numbers | "PKG-2024-001847" | System-generated identifiers |
| Courier names | "FedEx", "Amazon" | Proper nouns, brand names |
| Dates and numbers | "March 15, 2026" | Handled by formatting libraries |
| Building names | "Maple Tower" | Property-specific configuration |

### T.2 RTL (Right-to-Left) Layout Preparation

#### T.2.1 CSS Logical Properties

All layout properties MUST use CSS logical properties instead of physical properties:

| Physical (DO NOT USE) | Logical (USE THIS) |
|----------------------|-------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` | `float: inline-start` |
| `float: right` | `float: inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `right: 0` | `inset-inline-end: 0` |
| `width` (directional) | `inline-size` |
| `height` (directional) | `block-size` |

#### T.2.2 Exceptions Where Physical Properties Are Acceptable

| Context | Physical Property | Reason |
|---------|------------------|--------|
| Box shadows | `box-shadow: 2px 4px 8px` | Light source is top-left regardless of reading direction |
| Vertical positioning | `top`, `bottom` | Vertical axis is not directional |
| Animation transforms | `translateX()` | Must flip via JS direction-aware logic |
| Border-radius corners | `border-top-left-radius` | Logical equivalents have limited browser support |

#### T.2.3 RTL Icon Flipping Rules

| Icon Type | Flip in RTL? | Examples |
|-----------|:------------:|---------|
| Directional arrows | Yes | Back arrow, forward arrow, chevrons |
| Diagonal / decorative | No | Activity icon with slash |
| Objects | No | Package, key, wrench |
| Communication | No | Bell, envelope, phone |
| Text/document | Yes | Text align icons, list icons |
| Media controls | Yes | Play, skip forward, skip backward |
| Checkmarks | No | Check, X mark |
| Progress bars | Yes | Fill direction reverses |

#### T.2.4 RTL Testing Checklist

```
[ ] Sidebar appears on the right side of the viewport
[ ] Breadcrumb arrows reverse direction
[ ] Tables read right-to-left
[ ] Form labels align to the inline-end (right in RTL)
[ ] Input text aligns to the inline-end
[ ] Calendar week starts on Saturday (for Arabic locales)
[ ] Charts with horizontal axes read right-to-left
[ ] Toast notifications appear top-inline-start (top-left in RTL)
[ ] Dropdown menus open toward inline-start
[ ] Kanban board columns read right-to-left
[ ] Package card courier stripe on the inline-end edge
[ ] Timeline spine on the inline-end side
[ ] Tab underline animation direction reverses
[ ] Modal close button in top-inline-start (top-left in RTL)
[ ] Number input spinners remain on the right (exception)
```

### T.3 Date and Time Formatting

#### T.3.1 Format Tokens

All dates and times are formatted using the `Intl` API. Never construct date strings manually.

```typescript
// Correct approach — uses Intl
const formatter = new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// WRONG — manual string construction
const dateStr = `${month}/${day}/${year}`;
```

#### T.3.2 Date Format Patterns (en-CA Baseline)

| Context | Format | Example |
|---------|--------|---------|
| Full date | MMMM d, yyyy | March 15, 2026 |
| Short date | MMM d, yyyy | Mar 15, 2026 |
| Numeric date (ISO) | yyyy-MM-dd | 2026-03-15 |
| Time | h:mm a | 2:30 PM |
| Date + time | MMM d, yyyy 'at' h:mm a | Mar 15, 2026 at 2:30 PM |
| Relative time | (dynamic) | "2 hours ago", "Yesterday" |
| Duration | (dynamic) | "2h 15m", "45 minutes" |
| Calendar header | MMMM yyyy | March 2026 |
| Day of week (full) | EEEE | Saturday |
| Day of week (short) | EEE | Sat |

#### T.3.3 Relative Time Thresholds

| Age of Event | Display Format |
|-------------|---------------|
| < 60 seconds | "Just now" |
| 1-59 minutes | "X minutes ago" |
| 1-23 hours | "X hours ago" |
| 24-47 hours | "Yesterday at H:MM AM/PM" |
| 2-6 days | "X days ago" |
| 7-13 days | "Last [weekday]" |
| 14+ days | Full short date format |

### T.4 Number Formatting

```typescript
// Currency (Canadian dollars)
new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'CAD',
}).format(1234.50);
// en-CA result: "$1,234.50"

// Compact numbers (for dashboard summary cards)
new Intl.NumberFormat(locale, {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(12500);
// en-CA result: "12.5K"

// Percentages
new Intl.NumberFormat(locale, {
  style: 'percent',
  maximumFractionDigits: 1,
}).format(0.856);
// en-CA result: "85.6%"

// Plain counts (packages, requests, units)
new Intl.NumberFormat(locale).format(1847);
// en-CA result: "1,847"
```

### T.5 Pluralization Rules

Use ICU MessageFormat syntax for pluralization:

```json
{
  "packages.count": "{count, plural, =0 {No packages} one {1 package} other {{count} packages}}",
  "maintenance.pending": "{count, plural, =0 {No pending requests} one {1 pending request} other {{count} pending requests}}",
  "units.residents": "{count, plural, =0 {No residents} one {1 resident} other {{count} residents}}",
  "training.courses": "{count, plural, =0 {No courses assigned} one {1 course assigned} other {{count} courses assigned}}"
}
```

This handles languages with complex pluralization rules (Arabic has 6 plural forms, Russian has 3, French treats 0 as singular in some regions).

### T.6 Bi-Directional Content Handling

Mixed-direction text (e.g., English building name inside Arabic paragraph) requires proper isolation:

```html
<!-- Use bdi element for user-generated content that may be opposite direction -->
<p>Package for unit <bdi>1205</bdi> checked in by <bdi>Sarah Chen</bdi></p>

<!-- Use dir="auto" for dynamic content -->
<span dir="auto">{{ residentName }}</span>
```

---

## Appendix U: Performance Budget (Extended)

> Every component, page, and interaction has a performance target. These budgets are enforced
> in CI/CD and any PR that exceeds them must justify the regression before merging.

### U.1 Core Web Vitals Targets

| Metric | Target | Measurement Condition |
|--------|--------|----------------------|
| **Largest Contentful Paint (LCP)** | < 1.2 seconds | Desktop on 50 Mbps connection |
| **First Input Delay (FID)** | < 50ms | After initial page load |
| **Cumulative Layout Shift (CLS)** | < 0.05 | Full page lifecycle |
| **Interaction to Next Paint (INP)** | < 100ms | 75th percentile of all interactions |
| **Time to First Byte (TTFB)** | < 200ms | Origin server, excluding CDN |
| **First Contentful Paint (FCP)** | < 0.8 seconds | Desktop on 50 Mbps connection |

### U.2 Bundle Size Budgets

#### U.2.1 Per-Route Bundle Limits (gzipped)

| Route Category | Max Initial JS | Max Initial CSS | Total Max |
|---------------|---------------|----------------|-----------|
| Login / Auth pages | 45 KB | 12 KB | 57 KB |
| Dashboard (any role) | 80 KB | 18 KB | 98 KB |
| Package Management | 65 KB | 14 KB | 79 KB |
| Security Console | 75 KB | 16 KB | 91 KB |
| Maintenance / Kanban | 70 KB | 15 KB | 85 KB |
| Amenity Booking | 70 KB | 16 KB | 86 KB |
| Unit File | 60 KB | 13 KB | 73 KB |
| Reports | 85 KB | 14 KB | 99 KB |
| Settings | 55 KB | 12 KB | 67 KB |
| Announcements | 50 KB | 11 KB | 61 KB |
| Training / LMS | 60 KB | 13 KB | 73 KB |
| Classified Ads | 45 KB | 10 KB | 55 KB |
| Vendor Compliance | 50 KB | 12 KB | 62 KB |

#### U.2.2 Shared Bundle Limits (gzipped)

| Bundle | Max Size | Contents |
|--------|----------|----------|
| Framework (React + ReactDOM) | 42 KB | Core framework runtime |
| Router | 12 KB | React Router |
| State management | 8 KB | Zustand or equivalent |
| Motion library | 15 KB | framer-motion (tree-shaken) |
| Icon subset | 10 KB | Lucide icons (tree-shaken, ~50 icons per page max) |
| Design tokens CSS | 6 KB | All CSS custom properties |
| Base component styles | 14 KB | Shared UI primitives (buttons, badges, inputs) |
| i18n runtime | 5 KB | ICU MessageFormat parser |
| **Total shared** | **112 KB** | **Loaded on every page** |

#### U.2.3 Lazy-Loaded Asset Budgets

| Asset | Max Size | Load Trigger |
|-------|----------|-------------|
| Chart library (data visualization) | 35 KB | Reports page mount, dashboard widget intersection |
| Date picker | 12 KB | Any date input field focus |
| Rich text editor | 25 KB | Announcement creation, long-form text fields |
| Photo upload + crop | 18 KB | Photo capture interactions |
| PDF generator | 40 KB | Export to PDF button click |
| Excel generator | 30 KB | Export to Excel button click |
| Barcode / QR renderer | 8 KB | Package label print |
| Map component | 20 KB | Inspection GPS verification |

### U.3 Component Render Time Budgets

| Component | Max Initial Render | Max Re-render | Measurement Method |
|-----------|-------------------|--------------|-------------------|
| Dashboard shell (sidebar + header) | 16ms | 4ms | React Profiler |
| Data table (100 rows) | 25ms | 8ms | React Profiler |
| Data table (500 rows, virtual scroll) | 50ms | 12ms | React Profiler |
| Package card (single) | 2ms | 1ms | React Profiler |
| Package card grid (50 items) | 30ms | 10ms | React Profiler |
| Kanban board (5 columns, 20 cards each) | 35ms | 10ms | React Profiler |
| Calendar month view | 20ms | 6ms | React Profiler |
| Calendar week view (168 time cells) | 25ms | 8ms | React Profiler |
| Security timeline (50 entries) | 30ms | 10ms | React Profiler |
| Form (10 fields) | 12ms | 3ms | React Profiler |
| Form (25 fields) | 25ms | 6ms | React Profiler |
| Modal (open animation start) | 16ms | n/a | requestAnimationFrame |
| Dropdown menu (20 items) | 8ms | 3ms | React Profiler |
| Search results (instant, <10 items) | 10ms | 4ms | React Profiler |
| Toast notification | 3ms | 1ms | React Profiler |
| Badge / status dot | 0.5ms | 0.2ms | React Profiler |
| Avatar | 1ms | 0.3ms | React Profiler |
| Breadcrumb bar | 2ms | 0.5ms | React Profiler |
| Stat card (single) | 3ms | 1ms | React Profiler |
| Sidebar navigation (full) | 8ms | 2ms | React Profiler |

### U.4 Interaction Response Time Budgets

| Interaction | Max Response Time | Perceived Speed |
|------------|------------------|----------------|
| Button click visual feedback | 50ms | Instant |
| Navigation / route change | 200ms | Near-instant |
| Form field focus | 16ms | Instant |
| Dropdown open | 100ms | Near-instant |
| Modal open (including animation) | 150ms | Smooth |
| Search keystroke to results | 150ms | Real-time |
| Filter change to table update | 200ms | Near-instant |
| Kanban card drag initiation | 50ms | Instant |
| Kanban card drop to column update | 100ms | Near-instant |
| Sort column click to table reorder | 150ms | Near-instant |
| Pagination to next page | 200ms | Near-instant |
| Tab switch | 100ms | Instant |
| Toast notification appear | 50ms | Instant |
| Inline edit to confirmed save | 300ms | Fast |
| Photo upload to preview | 500ms | Acceptable |
| Report generation (server-side) | 3000ms | Show progress bar |
| PDF/Excel export | 5000ms | Show progress indicator |
| Bulk action (e.g., release 20 packages) | 2000ms | Show progress bar |

### U.5 Image and Media Budgets

| Asset Type | Max File Size | Format | Delivery Strategy |
|-----------|--------------|--------|------------------|
| Building logo | 50 KB | SVG preferred, WebP fallback | Cached, preloaded |
| Resident avatar | 30 KB | WebP with JPEG fallback | Lazy loaded |
| Package photo | 200 KB | WebP with JPEG fallback | Lazy loaded, progressive |
| Maintenance photo | 200 KB | WebP with JPEG fallback | Lazy loaded, progressive |
| Inspection photo | 200 KB | WebP with JPEG fallback | Lazy loaded, progressive |
| Document thumbnail | 40 KB | WebP | Lazy loaded |
| Courier logo/icon | 5 KB | SVG (inline) | Cached in component |
| Empty state illustration | 15 KB | SVG (inline) | Bundled with component |
| Amenity photo | 100 KB | WebP with JPEG fallback | Lazy loaded |
| Classified ad photo | 150 KB | WebP with JPEG fallback | Lazy loaded |

### U.6 Memory Usage Budgets

| Context | Max JS Heap | Measurement Tool |
|---------|------------|-----------------|
| Dashboard idle | 50 MB | Chrome DevTools Memory |
| Package list (500 packages loaded) | 80 MB | Chrome DevTools Memory |
| Security console (200 events, 1 shift) | 70 MB | Chrome DevTools Memory |
| Kanban board (100 cards total) | 60 MB | Chrome DevTools Memory |
| Report generation (in-browser) | 120 MB peak | Chrome DevTools Memory |
| Photo gallery (50 photos, virtual scroll) | 90 MB | Chrome DevTools Memory |
| Calendar month with 200 bookings | 55 MB | Chrome DevTools Memory |
| Maximum across any single page | 150 MB | Chrome DevTools Memory |

### U.7 Network Request Budgets

| Page Load Context | Max Requests | Max Total Payload |
|------------------|-------------|------------------|
| Initial page load (cold cache) | 25 requests | 500 KB |
| Subsequent navigation (warm cache) | 8 requests | 150 KB |
| Dashboard data refresh (polling interval) | 3 requests | 20 KB |
| Real-time updates (WebSocket) | 1 persistent connection | < 0.5 KB per message |
| Search keystroke | 1 request (debounced 150ms) | 10 KB response |
| Table pagination | 1 request | 30 KB response |
| Form submission | 1 request | 5 KB payload |
| Photo upload | 1 request | 200 KB compressed |
| Report export (streamed) | 1 request | Variable, streamed |

### U.8 Animation Frame Budget

All animations must maintain 60fps (16.67ms per frame). Budget allocation:

```
Total frame budget:         16.67ms
+-- JavaScript execution:    6.00ms max
+-- Style recalculation:     2.00ms max
+-- Layout (reflow):         2.00ms max
+-- Paint:                   2.00ms max
+-- Composite:               1.00ms max
+-- Idle / safety buffer:    3.67ms
```

Hard rules for animation performance:

1. Animations triggering Layout MUST be converted to `transform` / `opacity` only
2. `will-change` applied only during active animation, removed immediately on completion
3. No `requestAnimationFrame` loops running when no animation is active
4. Lists with 50+ items MUST use virtual scrolling to maintain 60fps during scroll
5. Drag-and-drop MUST use `transform` positioning (never `top`/`left`)
6. Modal backdrop uses `opacity` only (blur is set as a static value, never transitioned)
7. Skeleton shimmer uses a single CSS animation on a pseudo-element, not JS

### U.9 CI/CD Performance Enforcement

```yaml
# Performance budget checks run on every PR
performance_gates:

  lighthouse:
    performance: 95      # minimum score
    accessibility: 100   # zero tolerance for a11y regressions
    best-practices: 95
    seo: 90

  bundle_size:
    max_total_js: 250KB   # gzipped, shared + largest route combined
    max_total_css: 35KB   # gzipped, shared + largest route combined
    fail_on_increase: 5KB # any single PR adding >5KB requires justification in PR description

  render_time:
    max_initial_render: 50ms   # largest component under profiling
    max_rerender: 15ms         # largest component under profiling

  core_web_vitals:
    lcp: 1200     # milliseconds, must not exceed
    fid: 50       # milliseconds
    cls: 0.05     # cumulative layout shift score
    inp: 100      # interaction to next paint, milliseconds

  memory:
    max_heap_idle: 80MB     # measured after page load settles (10s)
    max_heap_peak: 150MB    # measured during heaviest interaction

  network:
    max_requests_initial: 25
    max_payload_initial: 500KB
```

---

## Appendix V: Print Stylesheet Guidelines (Extended)

> Work orders, package labels, reports, and inspection checklists are frequently printed.
> This appendix extends Section 12 with module-specific print layout specifications.

### V.1 Global Print Rules

```css
@media print {
  /* Remove all non-content chrome */
  .sidebar,
  .top-nav,
  .bottom-nav,
  .toast-container,
  .modal-overlay,
  .floating-action-btn,
  .chat-widget,
  .breadcrumb,
  .pagination,
  .filter-bar,
  .search-bar,
  [role="navigation"],
  [data-no-print] {
    display: none !important;
  }

  /* Reset backgrounds for ink conservation */
  body {
    background: white !important;
    color: black !important;
    font-size: 11pt !important;
    line-height: 1.4 !important;
    font-family: 'Inter', Arial, Helvetica, sans-serif !important;
  }

  /* Show URLs after external links */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 9pt;
    color: #666;
    word-break: break-all;
  }

  /* Prevent orphan rows and card splits */
  .package-card,
  .service-card,
  .incident-card,
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Force page breaks before major sections */
  .report-section,
  .print-page-break {
    page-break-before: always;
    break-before: page;
  }

  /* Remove all shadows */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }
}
```

### V.2 Work Order Print Layout

Work orders are the most frequently printed document. They must fit on a single US Letter
page (8.5 x 11 inches) or A4 (210mm x 297mm).

```css
@media print {
  .work-order {
    width: 100%;
    max-width: 7.5in;
    margin: 0 auto;
    padding: 0.5in;
    font-size: 10pt;
  }

  .work-order__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2pt solid black;
    padding-bottom: 12pt;
    margin-bottom: 16pt;
  }

  .work-order__logo {
    max-width: 180px;
    max-height: 60px;
    filter: grayscale(100%);
  }

  .work-order__ref-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14pt;
    font-weight: 700;
  }

  .work-order__field-grid {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 6pt 12pt;
    margin-bottom: 12pt;
  }

  .work-order__field-label {
    font-weight: 600;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #333;
  }

  .work-order__field-value {
    font-size: 10pt;
  }

  .work-order__description {
    border: 1pt solid #ccc;
    padding: 8pt;
    margin: 12pt 0;
    min-height: 80pt;
    font-size: 10pt;
    line-height: 1.5;
  }

  .work-order__photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8pt;
    margin: 12pt 0;
  }

  .work-order__photo {
    max-height: 150pt;
    object-fit: contain;
    border: 0.5pt solid #ccc;
  }

  .work-order__signature-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24pt;
    margin-top: 48pt;
    border-top: 1pt solid #ccc;
    padding-top: 12pt;
  }

  .work-order__signature-line {
    border-bottom: 1pt solid black;
    height: 36pt;
    margin-bottom: 4pt;
  }

  .work-order__signature-label {
    font-size: 8pt;
    color: #666;
  }
}
```

### V.3 Package Label Print Layout

Package labels are printed on thermal label printers (4 x 6 inch standard, or 2.25 x 1.25 inch small).

```css
@media print {
  .package-label {
    width: 4in;
    height: 6in;
    padding: 0.25in;
    page-break-after: always;
  }

  .package-label--small {
    width: 2.25in;
    height: 1.25in;
    padding: 0.1in;
  }

  .package-label__unit-number {
    font-size: 48pt;
    font-weight: 800;
    text-align: center;
    line-height: 1;
    margin-bottom: 8pt;
  }

  .package-label__resident-name {
    font-size: 14pt;
    font-weight: 600;
    text-align: center;
    margin-bottom: 4pt;
  }

  .package-label__ref {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10pt;
    text-align: center;
    margin-bottom: 8pt;
  }

  .package-label__barcode {
    text-align: center;
    margin: 8pt 0;
  }

  .package-label__courier {
    font-size: 12pt;
    text-align: center;
    font-weight: 600;
    text-transform: uppercase;
  }

  .package-label__storage {
    font-size: 11pt;
    text-align: center;
    font-weight: 600;
    border: 1pt solid black;
    padding: 4pt;
    margin-top: 8pt;
  }

  /* Compact variant for small labels */
  .package-label--small .package-label__unit-number {
    font-size: 24pt;
    margin-bottom: 2pt;
  }

  .package-label--small .package-label__resident-name {
    font-size: 8pt;
    margin-bottom: 1pt;
  }

  .package-label--small .package-label__ref {
    font-size: 7pt;
  }
}
```

### V.4 Report Print Layout

Reports are multi-page documents requiring running headers, page numbers, and table continuation.

```css
@media print {
  .report {
    font-size: 9pt;
    line-height: 1.3;
  }

  .report__title {
    font-size: 16pt;
    font-weight: 700;
    margin-bottom: 4pt;
  }

  .report__date-range {
    font-size: 9pt;
    color: #666;
    margin-bottom: 16pt;
  }

  /* Repeat table headers on every printed page */
  .report table thead {
    display: table-header-group;
  }

  .report table tfoot {
    display: table-footer-group;
  }

  .report table th {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-weight: 700;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 6pt 8pt;
    border-bottom: 1.5pt solid #333;
  }

  .report table td {
    padding: 4pt 8pt;
    border-bottom: 0.5pt solid #ddd;
    font-size: 9pt;
  }

  .report table tr:nth-child(even) td {
    background: #f9f9f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Summary statistics block */
  .report__summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12pt;
    margin-bottom: 16pt;
    padding: 8pt;
    border: 1pt solid #ccc;
  }

  .report__summary-value {
    font-size: 18pt;
    font-weight: 700;
    display: block;
    text-align: center;
  }

  .report__summary-label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    text-align: center;
  }

  /* Page numbering */
  @page {
    margin: 0.75in;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #999;
    }
  }
}
```

### V.5 Inspection Checklist Print Layout

```css
@media print {
  .inspection-checklist__item {
    display: grid;
    grid-template-columns: 24pt 1fr 80pt;
    gap: 8pt;
    align-items: start;
    padding: 6pt 0;
    border-bottom: 0.5pt solid #eee;
    page-break-inside: avoid;
  }

  .inspection-checklist__checkbox {
    width: 14pt;
    height: 14pt;
    border: 1.5pt solid #333;
    border-radius: 2pt;
    margin-top: 2pt;
  }

  .inspection-checklist__area-title {
    font-size: 13pt;
    font-weight: 700;
    margin-top: 16pt;
    margin-bottom: 8pt;
    border-bottom: 1pt solid #666;
    padding-bottom: 4pt;
  }

  .inspection-checklist__footer {
    margin-top: 24pt;
    padding-top: 12pt;
    border-top: 1pt solid #999;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16pt;
  }

  .inspection-checklist__footer-field {
    border-bottom: 1pt solid black;
    padding-bottom: 4pt;
    min-height: 20pt;
  }

  .inspection-checklist__footer-label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
    margin-top: 2pt;
  }
}
```

### V.6 Print Color Handling Strategy

Colored status indicators must remain meaningful when printed. Strategy: convert filled badges
to bordered grayscale, but preserve status dots using `print-color-adjust`.

```css
@media print {
  /* Badges convert to bordered style for ink conservation */
  .badge--success {
    background: white !important;
    border: 1pt solid #333 !important;
    color: black !important;
  }

  .badge--error {
    background: #eee !important;
    border: 1pt solid #333 !important;
    color: black !important;
  }

  .badge--warning {
    background: white !important;
    border: 1pt dashed #666 !important;
    color: black !important;
  }

  /* Priority dots — differentiate by size and fill pattern */
  .priority-dot--emergency {
    background: black !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    width: 10pt;
    height: 10pt;
  }

  .priority-dot--urgent {
    background: #666 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    width: 8pt;
    height: 8pt;
  }

  .priority-dot--normal {
    background: #999 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    width: 6pt;
    height: 6pt;
  }

  .priority-dot--low {
    background: white !important;
    border: 1pt solid #999 !important;
    width: 6pt;
    height: 6pt;
  }
}
```

### V.7 Shift Log Print Layout

Security staff frequently print shift logs during handoff. The layout must capture
all entries from the current shift in chronological order.

```css
@media print {
  .shift-log {
    font-size: 9pt;
    line-height: 1.3;
  }

  .shift-log__header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16pt;
    border-bottom: 2pt solid black;
    padding-bottom: 8pt;
    margin-bottom: 12pt;
  }

  .shift-log__shift-info {
    font-size: 11pt;
    font-weight: 600;
  }

  .shift-log__entry {
    display: grid;
    grid-template-columns: 60pt 60pt 1fr;
    gap: 8pt;
    padding: 4pt 0;
    border-bottom: 0.5pt solid #eee;
    page-break-inside: avoid;
  }

  .shift-log__entry-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
  }

  .shift-log__entry-type {
    font-weight: 600;
    font-size: 8pt;
    text-transform: uppercase;
  }

  .shift-log__entry-detail {
    font-size: 9pt;
  }

  .shift-log__handoff-notes {
    margin-top: 16pt;
    padding: 8pt;
    border: 1.5pt solid black;
    font-size: 10pt;
  }

  .shift-log__handoff-notes-title {
    font-weight: 700;
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.05em;
    margin-bottom: 4pt;
  }
}
```

---

## Appendix W: Design Decision Log (Extended)

> Supplements Appendix I with additional decisions made during the v2 design system expansion.
> Each entry records the decision, alternatives considered, rationale, and reversibility.

### W.1 Color Space: OKLCH over HSL

| Attribute | Detail |
|-----------|--------|
| **Decision** | Use OKLCH as the canonical color space; provide hex fallbacks |
| **Date** | 2026-03 |
| **Alternatives** | HSL, HWB, Display P3, LCH |
| **Rationale** | HSL is not perceptually uniform. A green and yellow at the same HSL lightness appear wildly different in brightness, breaking status badge consistency. OKLCH guarantees perceptual uniformity, is the CSS Color Level 4 standard, and has the best modern browser support. |
| **Trade-offs** | Pre-2023 browsers cannot parse OKLCH. Mitigated with `@supports` blocks. Figma does not natively support OKLCH; we define in OKLCH and convert to hex for design files. |
| **Reversibility** | Low risk. Tokens abstract color space from components. |

### W.2 Typography: Inter over System Fonts

| Attribute | Detail |
|-----------|--------|
| **Decision** | Use Inter as the primary typeface with system font fallback stack |
| **Date** | 2026-03 |
| **Alternatives** | SF Pro, Segoe UI, Roboto, Geist, system-only stack |
| **Rationale** | System fonts create cross-platform inconsistency (SF Pro on macOS vs Segoe UI on Windows). Front desk staff may use either. Inter provides: tall x-height for readability at 13-14px, tabular number alternates for data tables, proper currency symbols, and SIL Open Font License. |
| **Trade-offs** | ~100KB font download (woff2, 4 weights). Mitigated with `font-display: swap` and preloading Regular weight. |
| **Reversibility** | Medium. Requires re-testing all components for layout shift after font swap. |

### W.3 Motion: Spring Physics for Interactive Elements

| Attribute | Detail |
|-----------|--------|
| **Decision** | Spring-based easing for interactive elements; CSS cubic-bezier for non-interactive transitions |
| **Date** | 2026-03 |
| **Alternatives** | CSS-only cubic-bezier everywhere, GSAP timelines, Lottie for all motion |
| **Rationale** | Springs respond to input velocity and produce natural motion. A gently opened panel animates slowly; a quickly swiped one moves fast. Cubic-bezier is fixed-duration and cannot adapt. However, springs require JS (framer-motion), so we restrict them to interactive elements where quality improvement justifies the dependency. Non-interactive transitions (color, opacity) use CSS. |
| **Trade-offs** | framer-motion adds ~15KB gzipped. Restricted to interactive contexts only. |
| **Reversibility** | Medium. Spring physics are behind motion tokens; replacing with bezier changes feel but not layout. |

### W.4 Spacing: 4px Base Grid

| Attribute | Detail |
|-----------|--------|
| **Decision** | 4px as the base spacing unit |
| **Date** | 2026-03 |
| **Alternatives** | 8px base (Material Design), 5px base, arbitrary spacing |
| **Rationale** | Concierge is data-dense. Front desk staff view tables with 20+ rows, package cards, and security timelines simultaneously on desktop monitors. An 8px grid creates excessive whitespace and reduces visible information density. 4px base allows tighter packing (12px cell padding vs 16px) while maintaining visual rhythm. |
| **Trade-offs** | Touch targets on mobile views must be verified against 44px minimum. |
| **Reversibility** | Low. Spacing permeates every component; changing the base unit is a major refactor. |

### W.5 Icon Library: Lucide

| Attribute | Detail |
|-----------|--------|
| **Decision** | Lucide icons as the primary icon set |
| **Date** | 2026-03 |
| **Alternatives** | Heroicons, Material Symbols, Phosphor Icons, custom SVGs |
| **Rationale** | Lucide has 1,500+ icons covering every Concierge module (building, key, package, security-specific icons), consistent 24px grid with 1.5px stroke weight matching our visual language, tree-shakeable ESM exports, and MIT license. Heroicons has only ~300 icons. Material Symbols have a distinctly "Google" aesthetic that conflicts with the Apple-grade target. |
| **Trade-offs** | ~200 bytes per icon inline SVG. Typical page loads 20-30 icons = ~5KB. |
| **Reversibility** | Medium. Every icon usage must be audited in a library swap. |

### W.6 Border Radius: 12px Default Cards

| Attribute | Detail |
|-----------|--------|
| **Decision** | 12px (`--radius-xl`) as the default card border-radius |
| **Date** | 2026-03 |
| **Alternatives** | 8px (Material default), 16px (Apple HIG), 4px (minimal) |
| **Rationale** | 8px feels corporate and dated. 16px wastes space at corners and looks odd on cards below 200px width. 12px is modern and approachable without being bubbly. At desktop monitor sizes (primary target), 12px provides visual softness while maintaining data density. |
| **Trade-offs** | Non-standard; neither Material (8px) nor Apple (16px). |
| **Reversibility** | High. Single token change. |

### W.7 CSS Logical Properties by Default

| Attribute | Detail |
|-----------|--------|
| **Decision** | All new CSS uses logical properties (margin-inline-start, padding-block-end, etc.) |
| **Date** | 2026-03 |
| **Alternatives** | Physical properties with a future RTL refactor, physical-only |
| **Rationale** | RTL support is not in v1 scope, but retrofitting physical properties to logical is a costly whole-codebase refactor. Writing logical from day one costs nothing extra (same number of characters) and future-proofs for Arabic and Hebrew locale support. |
| **Trade-offs** | Slightly less familiar to developers used to `margin-left`. Mitigated with linting rules. |
| **Reversibility** | Low need; logical properties are a superset of physical. |

### W.8 Virtual Scrolling Threshold: 50 Items

| Attribute | Detail |
|-----------|--------|
| **Decision** | Lists and tables with 50+ items use virtual scrolling (react-virtual) |
| **Date** | 2026-03 |
| **Alternatives** | Paginate at 25 (server-side only), virtual at 100, no virtualization |
| **Rationale** | Testing showed that tables rendering 100+ DOM rows drop below 60fps during scroll on mid-range hardware. 50 items is the sweet spot: fast enough to render without virtualization on modern devices, but virtualization kicks in before performance degrades. Server-side pagination is still used for data fetching; virtual scrolling is the rendering strategy for large datasets already in memory. |
| **Trade-offs** | Virtual scrolling complicates Cmd+F (browser find). Mitigated by providing a search/filter bar above every virtualized list. |
| **Reversibility** | Medium. Removing virtualization is straightforward but re-adding is not. |

---

*Extended end of Concierge Design System v2*
*Document statistics (updated):*
*- Main sections: 12*
*- Appendices: 23 (A through W)*
*- Color tokens defined: 85+ with OKLCH + hex + CSS custom properties*
*- Icon mappings: 140+*
*- Micro-interactions cataloged: 34*
*- Component states documented: 100+*
*- Module-specific token maps: 10 modules fully mapped*
*- Badge types defined: 22*
*- Empty states specified: 17*
*- Form input types: 14*
*- Keyboard shortcuts: 40+*
*- Print templates: 5 (work order, package label, report, inspection, shift log)*
*- Toast notification types: 40+*
*- Interaction flows: 6 detailed step-by-step*
*- Loading skeletons: 15 element types*
*- Contrast ratios verified: 20+ combinations*
*- Design decisions logged: 23 with full rationale*
*- Responsive breakpoints: 9 with component behavior specs*
*- ARIA patterns documented: 16*
*- Accessibility checklist items: 60+*
*- Complete CSS custom property reference: 120+ tokens*
*- RTL preparation checklist: 15 items*
*- i18n string categories: 15 locale files*
*- Performance budgets: 9 categories with quantified targets*
*- CI/CD performance gates: 5 automated checks*
