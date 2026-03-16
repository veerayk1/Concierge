# Responsive Design Specification

> **Design Target**: Desktop monitors (1920x1080) are the primary viewport.
> 99% of staff users operate on desktop monitors. Residents may use mobile devices.
> This document defines how the Concierge interface adapts across all screen sizes.

---

## 1. Breakpoint Scale

| Token | Name | Min-Width | Target Device | Priority |
|-------|------|-----------|---------------|----------|
| `--bp-xs` | xs | 0px | Small mobile (iPhone SE, Android compact) | Low |
| `--bp-sm` | sm | 640px | Large mobile (iPhone Pro Max, Galaxy S) | Low |
| `--bp-md` | md | 768px | Tablet portrait (iPad Mini, iPad) | Medium |
| `--bp-lg` | lg | 1024px | Tablet landscape / small laptop (iPad landscape, 13" laptop) | Medium |
| `--bp-xl` | xl | 1280px | Standard laptop (14"-15" display, 1366x768) | High |
| `--bp-2xl` | 2xl | 1536px | Large laptop / external display (15"-17", QHD scaled) | High |
| `--bp-monitor` | monitor | 1920px | Desktop monitor (1920x1080 and above) | **PRIMARY** |

### Implementation

```css
/* Mobile-first media queries (min-width) */
/* xs: default styles, no media query needed */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
@media (min-width: 1920px) { /* monitor */ }
```

### Why These Breakpoints

- **640px** catches the transition from cramped single-column to slightly wider layouts. Below this, everything stacks vertically.
- **768px** is the tablet portrait threshold where a collapsed sidebar becomes viable.
- **1024px** is where side-by-side layouts start working. The sidebar can appear as a persistent rail.
- **1280px** is the most common laptop resolution width. The sidebar fully expands here.
- **1536px** provides breathing room for three-column data grids and wider tables.
- **1920px** is the operational target. Every layout decision optimizes for this width first, then scales down.

---

## 2. Grid System at Each Breakpoint

### 2.1 Grid Configuration Table

| Breakpoint | Columns | Gutter | Page Margin | Content Max-Width | Sidebar State |
|------------|---------|--------|-------------|-------------------|---------------|
| xs (<640px) | 4 | 16px | 16px | 100% | Hidden (overlay) |
| sm (640px) | 4 | 16px | 16px | 100% | Hidden (overlay) |
| md (768px) | 8 | 20px | 24px | 100% | Collapsed rail (64px) |
| lg (1024px) | 12 | 20px | 24px | 100% | Collapsed rail (64px) |
| xl (1280px) | 12 | 24px | 32px | 100% | Expanded (240px) |
| 2xl (1536px) | 12 | 24px | 32px | 100% | Expanded (240px) |
| monitor (1920px+) | 12 | 24px | 32px | **No max-width** | Expanded (240px) |

### 2.2 Content Area Width Calculation

The content area is the viewport minus the sidebar:

```
Content Width = Viewport Width - Sidebar Width - (2 x Page Margin)

xs:      100vw - 0 - 32px  = ~608px max usable
sm:      640px - 0 - 32px  = 608px
md:      768px - 64px - 48px  = 656px
lg:      1024px - 64px - 48px = 912px
xl:      1280px - 240px - 64px = 976px
2xl:     1536px - 240px - 64px = 1232px
monitor: 1920px - 240px - 64px = 1616px
```

### 2.3 Why No Max-Width on Monitor

Traditional web apps center content in a 1200px or 1440px container, wasting 30-40% of a 1920px screen. Concierge rejects this pattern:

- **Staff users are data workers.** They need to see more rows, more columns, and more context simultaneously.
- **Wasted horizontal space is wasted productivity.** A property manager viewing a table of 500 units should see as many columns as the screen allows.
- **Side panels and split views fill the space meaningfully.** Instead of centering a narrow column, the extra width enables detail panels, contextual sidebars, and multi-column dashboards.
- **Content max-width of 1440px from the design system applies to prose-heavy pages only** (announcements, help articles, policy documents). Data-dense operational pages use the full width.

Rule: If the primary content is a table, grid, or dashboard, use the full available width. If the primary content is a form or article, cap readable line length at 720px per column but allow the remaining space for contextual panels.

---

## 3. Layout Patterns per Breakpoint

### 3.1 Dashboard Layout

**Monitor (1920px+) — PRIMARY TARGET**

```
+----------+--------------------------------------------------+
|          |  [Page Title]           [Search] [Bell] [Avatar]  |
|          |                                                    |
|  S  I    |  +----------+ +----------+ +----------+ +--------+|
|  I  D    |  | KPI Card | | KPI Card | | KPI Card | |KPI Card||
|  D  E    |  +----------+ +----------+ +----------+ +--------+|
|  E  B    |                                                    |
|  B  A    |  +------------------------+ +--------------------+|
|  A  R    |  |                        | |                    ||
|  R       |  |   Primary Chart        | |  Secondary Chart   ||
|          |  |   (8 columns)          | |  (4 columns)       ||
|          |  |                        | |                    ||
|          |  +------------------------+ +--------------------+|
|          |                                                    |
|          |  +----------------------------------------------+|
|          |  |   Recent Activity Table (12 columns)          ||
|          |  |   12+ visible rows, all columns shown         ||
|          |  +----------------------------------------------+|
+----------+--------------------------------------------------+
```

- 4 KPI cards across (3 columns each)
- Charts in 8+4 split
- Table uses full 12 columns with all data columns visible

**2xl (1536px)**

Same as monitor but KPI cards may compress slightly. Table still shows all columns.

**xl (1280px)**

```
+------+----------------------------------------+
|      |  [Page Title]    [Search] [Bell] [Av]  |
| SIDE |                                         |
| BAR  |  +----------+ +----------+ +----------+|
| 240  |  | KPI Card | | KPI Card | | KPI Card ||
|      |  +----------+ +----------+ +----------+|
|      |                                         |
|      |  +------------------------------------+|
|      |  |  Primary Chart (12 columns)        ||
|      |  +------------------------------------+|
|      |                                         |
|      |  +------------------------------------+|
|      |  |  Secondary Chart (12 columns)      ||
|      |  +------------------------------------+|
|      |                                         |
|      |  +------------------------------------+|
|      |  |  Table (12 col, may hide 1-2 cols) ||
|      |  +------------------------------------+|
+------+----------------------------------------+
```

- 3 KPI cards across (4 columns each)
- Charts stack vertically, each full-width
- Table may hide lowest-priority columns

**lg (1024px)**

```
+----+--------------------------------------+
|RAIL|  [Title]         [Search] [Bell] [Av]|
| 64 |                                      |
|    |  +----------+ +----------+           |
|    |  | KPI Card | | KPI Card |           |
|    |  +----------+ +----------+           |
|    |  +----------+ +----------+           |
|    |  | KPI Card | | KPI Card |           |
|    |  +----------+ +----------+           |
|    |                                      |
|    |  +----------------------------------+|
|    |  |  Chart (full width)              ||
|    |  +----------------------------------+|
|    |                                      |
|    |  +----------------------------------+|
|    |  |  Table (horizontal scroll)       ||
|    |  +----------------------------------+|
+----+--------------------------------------+
```

- Sidebar collapses to 64px icon rail
- KPI cards: 2 per row (6 columns each)
- Charts full width, stacked
- Table gains horizontal scroll for overflow columns

**md (768px)**

```
+----+--------------------------------------+
|RAIL|  [Hamburger] [Title]   [Bell] [Av]  |
| 64 |                                      |
|    |  +----------------------------------+|
|    |  | KPI Card (full width)            ||
|    |  +----------------------------------+|
|    |  | KPI Card (full width)            ||
|    |  +----------------------------------+|
|    |                                      |
|    |  +----------------------------------+|
|    |  |  Chart (full width)              ||
|    |  +----------------------------------+|
|    |                                      |
|    |  +----------------------------------+|
|    |  |  Card-stack (replaces table)     ||
|    |  +----------------------------------+|
+----+--------------------------------------+
```

- Sidebar as collapsed rail or hidden entirely
- KPI cards stack 1 per row
- Table converts to card stack

**sm and xs (<640px)**

```
+--------------------------------------+
|  [Hamburger] [Title]   [Bell] [Av]  |
|                                      |
|  +----------------------------------+|
|  | KPI Card (full width)            ||
|  +----------------------------------+|
|  | KPI Card (full width)            ||
|  +----------------------------------+|
|                                      |
|  +----------------------------------+|
|  |  Chart (full width, compact)     ||
|  +----------------------------------+|
|                                      |
|  +----------------------------------+|
|  |  Activity Card 1                 ||
|  +----------------------------------+|
|  |  Activity Card 2                 ||
|  +----------------------------------+|
+--------------------------------------+
```

- No sidebar visible. Hamburger triggers full-screen overlay nav.
- Everything single column. Full vertical stacking.

---

### 3.2 List View Layout (e.g., Packages, Service Requests, Units)

**Monitor (1920px+)**

```
+----------+--------------------------------------------------+
|          |  [Page Title]  [Filter Bar]  [+ New] [Export]     |
|  SIDE    |                                                    |
|  BAR     |  +----------------------------------------------+|
|          |  | Column A | Column B | Column C | ... | Col H  ||
|          |  |----------|----------|----------|-----|--------||
|          |  | row 1    | data     | data     | ... | data   ||
|          |  | row 2    | data     | data     | ... | data   ||
|          |  | ...      | ...      | ...      | ... | ...    ||
|          |  | row 20   | data     | data     | ... | data   ||
|          |  +----------------------------------------------+|
|          |  [Showing 1-20 of 347]        [< 1 2 3 ... 18 >] |
+----------+--------------------------------------------------+
```

- Full data table with 8+ visible columns
- 20 rows per page default (configurable: 20/50/100)
- Inline row actions on hover (Edit, View, Archive)
- Filter bar with advanced filters in a collapsible panel

**Monitor with Detail Panel (Split View)**

```
+----------+-------------------------------+-----------------+
|          |  [Filter Bar]   [+ New]       |  DETAIL PANEL   |
|  SIDE    |                               |                 |
|  BAR     |  +---------------------------+|  Unit 1205      |
|          |  | > row 1 (selected)        ||  ────────────   |
|          |  |   row 2                   ||  Occupants: 2   |
|          |  |   row 3                   ||  Status: Active  |
|          |  |   row 4                   ||  FOBs: 3/6      |
|          |  |   row 5                   ||                 |
|          |  |   row 6                   ||  [View Full]    |
|          |  |   row 7                   ||  [Edit]         |
|          |  +---------------------------+|                 |
+----------+-------------------------------+-----------------+
```

- Available at monitor and 2xl breakpoints only
- Table narrows to ~60% width, detail panel takes ~40%
- Clicking a row populates the detail panel without page navigation
- Panel can be dismissed to restore full-width table

**lg (1024px)**

- Table shows 5-6 columns. Lower-priority columns hidden.
- No split view. Row click navigates to detail page.

**md and below**

- Table converts to a card stack. Each card shows the key fields.
- Tap a card to navigate to the detail page.

---

### 3.3 Detail View Layout (e.g., Unit File, Resident Profile)

**Monitor (1920px+)**

```
+----------+--------------------------------------------------+
|          |  [< Back]  Unit 1205 — Floor 12       [Edit]      |
|  SIDE    |                                                    |
|  BAR     |  +------------------+ +---------------------------+|
|          |  | UNIT INFO        | | TAB BAR                   |
|          |  | ──────────────── | | [Occupants] [Events] ...  |
|          |  | Floor: 12        | |                           ||
|          |  | Type: 2BR        | | +-------------------------+|
|          |  | Owner: J. Smith  | | | Tab content area        ||
|          |  | Status: Active   | | | Full table or form      ||
|          |  | FOBs: 3/6       | | | within the tab           ||
|          |  |                  | | |                         ||
|          |  | INSTRUCTIONS     | | |                         ||
|          |  | Dog bites. Use   | | |                         ||
|          |  | buzzer twice.    | | |                         ||
|          |  +------------------+ +---------------------------+|
+----------+--------------------------------------------------+
```

- Persistent info sidebar (4 columns) + tab content area (8 columns)
- Both scroll independently

**lg and xl**

- Info sidebar collapses to a horizontal summary bar above the tabs
- Tabs use full 12 columns

**md and below**

- Summary as a collapsible accordion at the top
- Tabs convert to a vertical list or a swipeable tab bar

---

### 3.4 Form Layout (e.g., Create Event, New Service Request)

**Monitor (1920px+)**

```
+----------+--------------------------------------------------+
|          |  [< Back]  New Service Request        [Submit]     |
|  SIDE    |                                                    |
|  BAR     |  +---------------------------+  +--------------+  |
|          |  | Unit *         [________] |  | CONTEXTUAL   |  |
|          |  | Category *     [________] |  | HELP         |  |
|          |  | Priority       [________] |  |              |  |
|          |  | Description *             |  | Tips for     |  |
|          |  | [______________________]  |  | submitting   |  |
|          |  | [______________________]  |  | requests.    |  |
|          |  | [______________________]  |  |              |  |
|          |  |                           |  | Related:     |  |
|          |  | Attachments               |  | - Unit 1205  |  |
|          |  | [Drop files here]         |  | - 2 open SRs |  |
|          |  |                           |  |              |  |
|          |  | [Submit]     [Save Draft] |  +--------------+  |
|          |  +---------------------------+                     |
+----------+--------------------------------------------------+
```

- Form fields in an 8-column area, max line-length 720px for readability
- Contextual help panel in remaining 4 columns
- Two-column field layout for short fields (e.g., Priority + Category side by side)
- Long fields (Description, Attachments) span the full form width

**xl and below**

- Contextual help panel moves below the form or into a collapsible section
- Form remains single-column

**md and below**

- All fields single-column, full width
- Labels above inputs (not beside them)
- Submit button becomes sticky at the bottom of the viewport

---

### 3.5 Settings Layout

**Monitor (1920px+)**

```
+----------+--------------------------------------------------+
|          |  Settings                                          |
|  SIDE    |                                                    |
|  BAR     |  +------------+ +--------------------------------+|
|          |  | SETTINGS   | | General Settings                |
|          |  | NAV        | |                                 ||
|          |  | ────────── | | Property Name    [____________] ||
|          |  | > General  | | Address          [____________] ||
|          |  |   Security | | Timezone         [____________] ||
|          |  |   Notifs   | |                                 ||
|          |  |   Roles    | | Notification Defaults           ||
|          |  |   Billing  | | Email    [ON]                   ||
|          |  |   Integr.  | | SMS      [OFF]                  ||
|          |  |   Audit    | | Push     [ON]                   ||
|          |  +------------+ +--------------------------------+|
+----------+--------------------------------------------------+
```

- Settings navigation as a persistent left panel (3 columns)
- Settings content area (9 columns)

**lg and below**

- Settings nav becomes a horizontal tab bar or a dropdown selector above the content

**md and below**

- Settings nav becomes a full-width list. Tapping a category navigates to that settings page.

---

## 4. Component Behavior per Breakpoint

### 4.1 DataTable

| Breakpoint | Behavior | Details |
|------------|----------|---------|
| monitor | Full table | All columns visible. Inline row actions on hover. Resizable columns. 20+ visible rows. |
| 2xl | Full table | All columns visible. Slightly narrower cells. |
| xl | Condensed table | Hide 1-2 lowest-priority columns. Columns still resizable. |
| lg | Compact table | Hide 2-4 columns. Horizontal scroll enabled for overflow. Fixed first column (row identifier). |
| md | Card stack | Each row becomes a card. Key fields shown as label:value pairs. Tap to expand or navigate. |
| sm, xs | Card stack | Simplified cards. Only 3-4 most important fields shown. Actions behind a "..." menu. |

**Column Priority System**: Every table column has a priority from 1 (always visible) to 5 (hide first). The responsive system hides columns starting from priority 5 as the viewport narrows.

```
Priority 1: Always visible (ID, Name, Status)
Priority 2: Visible at lg+ (Date, Assigned To)
Priority 3: Visible at xl+ (Category, Last Updated)
Priority 4: Visible at 2xl+ (Created By, Notes preview)
Priority 5: Visible at monitor only (Audit fields, secondary metadata)
```

### 4.2 Sidebar Navigation

| Breakpoint | State | Width | Behavior |
|------------|-------|-------|----------|
| monitor | Expanded | 240px | Full labels, category headers, badge counts. Default state. |
| 2xl | Expanded | 240px | Same as monitor. |
| xl | Expanded | 240px | Same as monitor. Can be manually collapsed to 64px. |
| lg | Collapsed rail | 64px | Icons only, centered. Tooltip on hover shows label. Category headers hidden. |
| md | Collapsed rail | 64px | Same as lg. Hamburger menu available for full overlay. |
| sm, xs | Hidden | 0px | No sidebar visible. Hamburger icon in top-left triggers full-screen overlay with expanded nav. |

**Overlay Sidebar (mobile)**:

```
+--------------------------------------+
| [X Close]                            |
|                                      |
|  OVERVIEW                            |
|  > Dashboard                         |
|    Units & Residents                 |
|    Amenities                         |
|                                      |
|  OPERATIONS                          |
|  ...                                 |
|                                      |
|  ──────────────────────              |
|  Avatar  Sarah Chen                  |
|  Property Manager                    |
+--------------------------------------+
```

Full viewport width. Backdrop overlay at 50% opacity black. Tap backdrop or X to close. Slide-in from left with 250ms ease transition.

### 4.3 Stat Cards / KPI Cards

| Breakpoint | Cards Per Row | Card Min-Width |
|------------|---------------|----------------|
| monitor | 4 | 320px |
| 2xl | 4 | 280px |
| xl | 3 | 280px |
| lg | 2 | 280px |
| md | 1 | 100% |
| sm, xs | 1 | 100% |

Cards use `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` with the count capped per breakpoint. At monitor width, a 4th card slot opens because the content area (1616px) comfortably fits 4 x 320px + gutters.

### 4.4 Charts

| Breakpoint | Behavior |
|------------|----------|
| monitor | Two charts side by side (8+4 or 6+6 column split). Full legends visible. Tooltips on hover. |
| 2xl | Same as monitor but may use 7+5 split if data labels are long. |
| xl | Charts stack vertically, each full-width. Legends below or to the right. |
| lg | Full-width stacked. Legends below. |
| md | Full-width. Simplified legends (top 5 series + "Other"). Horizontal scroll for wide bar charts. |
| sm, xs | Full-width. Minimal labels. Tap to view data points. Legends as a separate expandable section. |

### 4.5 Modals and Dialogs

| Breakpoint | Behavior | Max-Width | Height |
|------------|----------|-----------|--------|
| monitor | Centered overlay | 640px (sm), 800px (md), 960px (lg) | max-height 80vh, scrollable |
| xl, 2xl | Centered overlay | Same sizing options | max-height 80vh |
| lg | Centered overlay | max 90vw | max-height 85vh |
| md | Near-full-screen | 95vw | max-height 90vh |
| sm, xs | Full-screen sheet | 100vw | 100vh (slide up from bottom) |

**Modal Sizes** (set per modal instance):
- **Small (sm)**: Confirmations, alerts, simple inputs. 480px max-width.
- **Medium (md)**: Standard forms, detail views. 640px max-width.
- **Large (lg)**: Complex forms, multi-step wizards. 800px max-width.
- **Extra-large (xl)**: Data-heavy modals (report previews, batch operations). 960px max-width.

### 4.6 Forms

| Breakpoint | Column Layout | Label Position | Button Placement |
|------------|---------------|----------------|------------------|
| monitor | 2 columns for short fields, 1 column for long fields | Left-aligned labels above inputs | Inline at bottom-right of form |
| xl, 2xl | Same as monitor | Same | Same |
| lg | 2 columns where space allows | Labels above | Inline at bottom |
| md | 1 column | Labels above | Sticky bottom bar |
| sm, xs | 1 column | Labels above | Sticky bottom bar, full-width button |

**Field Grouping**: Related fields (e.g., First Name + Last Name, Start Date + End Date) share a row at lg+ and stack at md and below.

### 4.7 Action Bars and Toolbars

| Breakpoint | Behavior |
|------------|----------|
| monitor | All actions visible as labeled buttons. Filter bar expanded inline. |
| xl, 2xl | All primary actions visible. Secondary actions in a "More" dropdown. |
| lg | Primary action as button. Secondary actions collapse into "..." menu. Filter bar collapsible. |
| md | Primary action as FAB (floating action button) or sticky bottom bar. Filters behind a "Filter" button opening a sheet. |
| sm, xs | FAB for primary action. All other actions in bottom sheet menu. Filters in full-screen overlay. |

---

## 5. Typography Scale per Breakpoint

Base sizes are defined at the monitor breakpoint. Smaller breakpoints apply a scale factor.

| Style | monitor (1920px+) | xl (1280px) | lg (1024px) | md (768px) | sm/xs (<640px) |
|-------|-------------------|-------------|-------------|------------|----------------|
| Display | 34px / 700 | 34px / 700 | 30px / 700 | 28px / 700 | 26px / 700 |
| Title 1 | 28px / 700 | 28px / 700 | 26px / 700 | 24px / 700 | 22px / 700 |
| Title 2 | 22px / 600 | 22px / 600 | 20px / 600 | 20px / 600 | 18px / 600 |
| Title 3 | 20px / 600 | 20px / 600 | 18px / 600 | 18px / 600 | 17px / 600 |
| Headline | 17px / 600 | 17px / 600 | 16px / 600 | 16px / 600 | 15px / 600 |
| Body | 15px / 400 | 15px / 400 | 15px / 400 | 15px / 400 | 15px / 400 |
| Callout | 14px / 400 | 14px / 400 | 14px / 400 | 13px / 400 | 13px / 400 |
| Caption | 12px / 500 | 12px / 500 | 12px / 500 | 12px / 500 | 12px / 500 |
| Overline | 11px / 600 | 11px / 600 | 11px / 600 | 11px / 600 | 11px / 600 |

### Rules

- **Body text never goes below 15px.** Readability is non-negotiable on any device.
- **Caption and Overline remain fixed.** They are already at minimum legible sizes.
- **Display and Title styles scale down on smaller screens** to prevent text from dominating limited viewport space.
- **Line heights scale proportionally.** Maintain the same ratio as the base design system.

### Implementation

```css
:root {
  --type-display: 34px;
  --type-title-1: 28px;
  --type-title-2: 22px;
  --type-title-3: 20px;
}

@media (max-width: 1023px) {
  :root {
    --type-display: 30px;
    --type-title-1: 26px;
    --type-title-2: 20px;
    --type-title-3: 18px;
  }
}

@media (max-width: 767px) {
  :root {
    --type-display: 28px;
    --type-title-1: 24px;
    --type-title-2: 20px;
    --type-title-3: 18px;
  }
}

@media (max-width: 639px) {
  :root {
    --type-display: 26px;
    --type-title-1: 22px;
    --type-title-2: 18px;
    --type-title-3: 17px;
  }
}
```

---

## 6. Spacing Scale per Breakpoint

The base 8px spacing scale from the design system applies at monitor/xl/2xl. Smaller breakpoints compress spacing to preserve content density.

| Token | monitor / xl / 2xl | lg (1024px) | md (768px) | sm / xs (<640px) |
|-------|---------------------|-------------|------------|------------------|
| `--space-1` | 4px | 4px | 4px | 4px |
| `--space-2` | 8px | 8px | 8px | 6px |
| `--space-3` | 12px | 12px | 10px | 8px |
| `--space-4` | 16px | 16px | 14px | 12px |
| `--space-5` | 20px | 20px | 16px | 14px |
| `--space-6` | 24px | 24px | 20px | 16px |
| `--space-7` | 32px | 28px | 24px | 20px |
| `--space-8` | 40px | 36px | 32px | 24px |
| `--space-9` | 48px | 40px | 36px | 28px |

### Rules

- **Spacing tokens space-1 and space-2 do not change.** Micro-spacing within components must remain consistent for visual coherence.
- **Larger tokens (space-7 through space-9) compress the most.** Page-level breathing room is the first sacrifice on small screens.
- **Card internal padding** (space-4 / space-5) compresses by one step at md and below.
- **Grid gutters** reduce from 24px to 20px at lg, and to 16px at md and below.
- **Page margins** reduce from 32px to 24px at lg, and to 16px at sm/xs.

### Implementation

```css
:root {
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --grid-gutter: 24px;
  --page-margin: 32px;
}

@media (max-width: 1023px) {
  :root {
    --space-7: 28px;
    --space-8: 36px;
    --space-9: 40px;
    --grid-gutter: 20px;
    --page-margin: 24px;
  }
}

@media (max-width: 767px) {
  :root {
    --space-3: 10px;
    --space-4: 14px;
    --space-5: 16px;
    --space-6: 20px;
    --space-7: 24px;
    --space-8: 32px;
    --space-9: 36px;
    --grid-gutter: 16px;
    --page-margin: 16px;
  }
}

@media (max-width: 639px) {
  :root {
    --space-2: 6px;
    --space-3: 8px;
    --space-4: 12px;
    --space-5: 14px;
    --space-6: 16px;
    --space-7: 20px;
    --space-8: 24px;
    --space-9: 28px;
    --grid-gutter: 16px;
    --page-margin: 16px;
  }
}
```

---

## 7. Touch Target Guidelines

### 7.1 Minimum Target Sizes

| Context | Minimum Size | Minimum Spacing Between Targets |
|---------|-------------|--------------------------------|
| Mobile (xs, sm) | 44 x 44px | 8px |
| Tablet (md) | 44 x 44px | 8px |
| Desktop with touch (lg) | 40 x 40px | 4px |
| Desktop mouse-only (xl+) | 32 x 32px | 2px |

### 7.2 Rules

- **All interactive elements must meet the minimum size for their breakpoint.** This includes buttons, links, checkboxes, radio buttons, icon buttons, dropdown triggers, and table row action icons.
- **Visual size can be smaller than the touch target.** Use transparent padding to extend the tappable area. A 20px icon on desktop can have 6px padding on each side to reach 32px.
- **Table rows at md and below**: The entire card becomes the tap target. No small inline action icons.
- **Close buttons on modals/sheets**: Always 44x44px regardless of breakpoint. Users reach for these quickly.
- **Navigation items in the sidebar overlay (mobile)**: 48px row height minimum with 44x44px tap targets.

### 7.3 Exceptions

- **Data table cells on desktop (xl+)**: Cells can be smaller than 32px height because row selection and actions are handled via the row hover state, not individual cell taps.
- **Breadcrumb links on desktop**: Can be standard text size (no padding extension) because they are supplementary navigation, not primary actions.
- **Chart data points**: Tooltips activate on hover (desktop) or tap (mobile) with a 24px invisible hit area around each point.

### 7.4 Implementation Pattern

```css
/* Icon button — meets 32px target on desktop, 44px on mobile */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 6px; /* Visual icon is 20px, total target is 32px */
}

@media (max-width: 1023px) {
  .icon-button {
    width: 44px;
    height: 44px;
    padding: 12px;
  }
}
```

---

## 8. Desktop Monitor Optimizations (1920px+)

This section defines patterns and rules specifically for the primary target viewport.

### 8.1 Using Extra Horizontal Space

On a 1920px monitor with the 240px sidebar, the content area is approximately 1616px wide after margins. This is 640px wider than a standard 976px laptop layout. That extra space must be used deliberately.

**Strategy 1: Wider Tables**

Show more columns. On a laptop, a packages table might show: ID, Unit, Courier, Status, Date. On a monitor, it should also show: Received By, Storage Location, Notification Sent, Released By, Release Date.

```
Laptop (976px content):   5 columns, horizontal scroll for more
Monitor (1616px content): 9-10 columns, no scroll needed
```

**Strategy 2: Split-View (Master-Detail)**

List pages gain a persistent detail panel on the right when a row is selected.

```
+---- 60% ----+---- 40% ----+
| List/Table   | Detail Panel |
|              |              |
| Rows...      | Selected     |
|              | item details |
+--------------+--------------+
```

This eliminates page navigation for quick inspection. The panel slides in from the right with a 200ms ease transition and can be dismissed with Escape or a close button.

- Activate automatically when a row is clicked at monitor+ breakpoints
- User preference stored in localStorage: `splitViewEnabled: true/false`
- Panel width is resizable via drag handle (min 320px, max 50%)

**Strategy 3: Multi-Column Dashboards**

At monitor width, dashboards use a 4-column KPI row and 2-column chart rows. This is not possible at laptop widths where space forces stacking.

**Strategy 4: Side Panels for Contextual Information**

Forms show a contextual help/info panel alongside the form fields. Detail views show a persistent metadata sidebar alongside the tabbed content area.

### 8.2 Data Density on Monitor

Staff users on monitors are power users. They want to see more data, not more whitespace.

| Metric | Laptop (xl) | Monitor (1920px+) |
|--------|-------------|-------------------|
| Table rows per page (default) | 15 | 20 |
| Table row height | 48px | 44px |
| Visible table columns | 5-7 | 8-12 |
| KPI cards per row | 3 | 4 |
| Chart pairs per row | 1 | 2 |
| Sidebar state | Expanded (240px) | Expanded (240px) |
| Split view available | No | Yes |

### 8.3 Why We Do NOT Center Content in a Narrow Column

Many web applications cap content width at 1200px or 1440px and center it, leaving hundreds of pixels of blank space on each side. Concierge explicitly rejects this pattern for operational pages.

**The problem with narrow centering on monitor:**

```
BAD: Centered narrow content on 1920px
+----------+---------+--[1200px content]--+---------+
| Sidebar  | EMPTY   |   Table (capped)   | EMPTY   |
| 240px    | 188px   |   1200px           | 188px   |
|          | wasted  |                    | wasted  |
+----------+---------+--------------------+---------+
  376px of screen space is doing nothing.
```

```
GOOD: Full-width content on 1920px
+----------+-------------------------------------------+
| Sidebar  |   Table (full width, more columns)        |
| 240px    |   1616px usable                           |
|          |   Every pixel shows useful data            |
+----------+-------------------------------------------+
```

**When narrow centering IS appropriate:**

- **Long-form text content**: Announcements, policy documents, help articles. Line length beyond 80 characters reduces readability. Cap these at 720px column width.
- **Single-purpose forms**: Simple forms (login, password reset) that have no contextual sidebar. Center these in the viewport.
- **Print-optimized views**: Report previews that map to A4/Letter paper width.

**Rule**: If the page's primary purpose is data consumption or operational workflow, use the full content width. If the page's primary purpose is reading prose, constrain width for readability.

### 8.4 Split-View Patterns for Large Screens

Split-view is a monitor-exclusive feature that avoids page navigation.

**Pattern 1: List + Detail**

Used on: Packages, Service Requests, Units, Events, Residents.

Clicking a row opens a detail panel on the right. The list remains visible and scrollable on the left. Keyboard navigation (arrow keys) moves through the list and updates the panel.

**Pattern 2: Inbox + Compose**

Used on: Announcements (draft + preview), Shift Log (log list + new entry form).

Left panel shows existing items. Right panel shows a creation/editing form. Submitting the form adds the item to the left list without page reload.

**Pattern 3: Settings Navigation + Settings Content**

The settings page always uses a left nav + right content split, but at monitor width the content area is wide enough for two-column form layouts within the right panel.

**Pattern 4: Dashboard Quadrants**

At monitor width, the dashboard can display four equally-sized quadrants:

```
+-----------------------+-----------------------+
| Recent Activity       | Open Service Requests |
| (table or feed)       | (table)               |
+-----------------------+-----------------------+
| Upcoming Events       | Building Stats        |
| (calendar mini)       | (charts)              |
+-----------------------+-----------------------+
```

Each quadrant is independently scrollable with a "View All" link.

### 8.5 Ultra-Wide Considerations (2560px+)

For users with ultra-wide or multi-monitor setups:

- Content area is still not max-width capped for data pages
- Tables gain even more visible columns (all priority levels)
- Split-view detail panels can be wider (up to 50% of content area)
- Dashboard quadrant layout becomes viable without feeling cramped
- Consider a max-width of 2400px for prose-heavy pages to prevent extremely long line lengths
- Sidebar remains 240px (does not grow further)

---

## 9. Responsive Testing Checklist

Before any release, verify the interface at these exact widths:

| Width | What to Check |
|-------|---------------|
| 375px | iPhone SE — minimum viable mobile. Everything must be usable. |
| 414px | iPhone 14 — most common mobile. |
| 768px | iPad portrait — tablet experience, sidebar rail. |
| 1024px | iPad landscape — sidebar rail, 2-column layouts. |
| 1280px | Common laptop — sidebar expanded, tables condensed. |
| 1366px | Most common laptop (1366x768) — verify nothing overflows. |
| 1536px | Large laptop / external display boundary. |
| 1920px | PRIMARY TARGET — verify all monitor optimizations work. |
| 2560px | Ultra-wide — verify nothing breaks at extreme widths. |

### Checklist per Width

- [ ] Sidebar state is correct (expanded / collapsed / hidden)
- [ ] Navigation is fully accessible
- [ ] Tables show appropriate columns (no empty columns, no critical data hidden)
- [ ] Forms are usable (labels readable, inputs reachable, submit button visible)
- [ ] Modals are appropriately sized (not clipped, not too small)
- [ ] Touch targets meet minimum size requirements
- [ ] Text is readable (no truncation that hides critical information)
- [ ] Charts are legible (legends visible, data points accessible)
- [ ] No horizontal scroll on the page body (only within table containers)
- [ ] Split-view activates/deactivates at correct breakpoints

---

## 10. CSS Architecture Notes

### 10.1 Breakpoint Utility Classes

```css
/* Visibility utilities */
.hide-below-sm  { }  @media (max-width: 639px)  { .hide-below-sm  { display: none; } }
.hide-below-md  { }  @media (max-width: 767px)  { .hide-below-md  { display: none; } }
.hide-below-lg  { }  @media (max-width: 1023px) { .hide-below-lg  { display: none; } }
.hide-below-xl  { }  @media (max-width: 1279px) { .hide-below-xl  { display: none; } }

.show-below-sm  { display: none; }  @media (max-width: 639px)  { .show-below-sm  { display: initial; } }
.show-below-md  { display: none; }  @media (max-width: 767px)  { .show-below-md  { display: initial; } }
.show-below-lg  { display: none; }  @media (max-width: 1023px) { .show-below-lg  { display: initial; } }

/* Monitor-only features */
.monitor-only { display: none; }
@media (min-width: 1920px) { .monitor-only { display: initial; } }
```

### 10.2 Container Query Support

Where supported, prefer container queries over media queries for component-level responsiveness. This allows components to adapt based on their available space rather than the viewport width.

```css
.card-grid {
  container-type: inline-size;
  container-name: card-grid;
}

@container card-grid (min-width: 800px) {
  .kpi-card { grid-column: span 3; }  /* 4 per row */
}

@container card-grid (min-width: 600px) and (max-width: 799px) {
  .kpi-card { grid-column: span 4; }  /* 3 per row */
}

@container card-grid (max-width: 599px) {
  .kpi-card { grid-column: span 12; } /* 1 per row */
}
```

### 10.3 Print Styles

```css
@media print {
  /* Hide non-content elements */
  .sidebar, .top-bar, .action-bar, .pagination { display: none; }

  /* Full width for content */
  .content-area { margin: 0; padding: 0; max-width: 100%; }

  /* Force white background */
  * { background: white !important; color: black !important; }

  /* Prevent page breaks inside cards and table rows */
  .card, tr { break-inside: avoid; }
}
```

---

*Last updated: 2026-03-16*
*Primary target: 1920x1080 desktop monitor*
*Breakpoints: 7 (xs, sm, md, lg, xl, 2xl, monitor)*
