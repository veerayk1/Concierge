# Concierge Design System

> **Design Philosophy**: Apple-grade minimalism meets property management power.
> Every pixel earns its place. White space is a feature, not waste.

---

## 1. Design Principles

| #   | Principle                                   | Rule                                                                                                     |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **Clarity over decoration**                 | No gradients, no ornamental borders, no visual noise. If it doesn't communicate, remove it.              |
| 2   | **Content is the interface**                | Data, text, and actions should feel like they float on a clean white canvas — not trapped in boxes.      |
| 3   | **Hierarchy through typography, not color** | Use font weight and size to create hierarchy. Color is reserved for status and actions only.             |
| 4   | **Invisible until needed**                  | Secondary actions, filters, and advanced features reveal on hover/click. Don't show everything at once.  |
| 5   | **Role-aware by default**                   | The interface adapts to who's using it. A security guard sees a different dashboard than a board member. |
| 6   | **One action per moment**                   | Each screen guides the user to one primary action. Competing CTAs are a design failure.                  |

---

## 2. Color System

### 2.1 Foundation

| Token              | Value     | Usage                                                          |
| ------------------ | --------- | -------------------------------------------------------------- |
| `--bg-primary`     | `#FFFFFF` | Page background, cards, modals                                 |
| `--bg-secondary`   | `#F5F5F7` | Sidebar background, section separators, page-level grouping    |
| `--bg-tertiary`    | `#E8E8ED` | Hover states on secondary surfaces, disabled input backgrounds |
| `--text-primary`   | `#1D1D1F` | Headlines, primary labels, body text                           |
| `--text-secondary` | `#6E6E73` | Supporting text, timestamps, metadata                          |
| `--text-tertiary`  | `#AEAEB2` | Placeholders, disabled text, hints                             |
| `--border-subtle`  | `#E5E5EA` | Card borders, dividers (1px only, use sparingly)               |
| `--border-focus`   | `#0071E3` | Focused input rings, active states                             |

### 2.2 Accent (Interactive)

| Token              | Value                     | Usage                                                  |
| ------------------ | ------------------------- | ------------------------------------------------------ |
| `--accent`         | `#0071E3`                 | Primary buttons, links, active sidebar item, toggles   |
| `--accent-hover`   | `#0077ED`                 | Button hover state                                     |
| `--accent-pressed` | `#006EDB`                 | Button pressed/active state                            |
| `--accent-subtle`  | `rgba(0, 113, 227, 0.08)` | Active sidebar item background, selected row highlight |

### 2.3 Semantic (Status Only)

| Token                 | Value                      | Usage                                    |
| --------------------- | -------------------------- | ---------------------------------------- |
| `--status-success`    | `#34C759`                  | Resolved, delivered, completed, approved |
| `--status-success-bg` | `rgba(52, 199, 89, 0.10)`  | Success badge background                 |
| `--status-warning`    | `#FF9500`                  | Pending, on hold, expiring soon          |
| `--status-warning-bg` | `rgba(255, 149, 0, 0.10)`  | Warning badge background                 |
| `--status-error`      | `#FF3B30`                  | Failed, overdue, violation, emergency    |
| `--status-error-bg`   | `rgba(255, 59, 48, 0.10)`  | Error badge background                   |
| `--status-info`       | `#5AC8FA`                  | Informational, new, in progress          |
| `--status-info-bg`    | `rgba(90, 200, 250, 0.10)` | Info badge background                    |

### 2.4 Data Visualization Palette

```
Chart Series:  #0071E3 → #5AC8FA → #34C759 → #FF9500 → #AF52DE → #FF3B30
```

Use in order. Never more than 6 series in a single chart. If >6 needed, group into "Other."

---

## 3. Typography

**Font Stack**: `"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`

| Style    | Size | Weight | Line Height | Letter Spacing | Usage                                     |
| -------- | ---- | ------ | ----------- | -------------- | ----------------------------------------- |
| Display  | 34px | 700    | 40px        | -0.4px         | Page titles (Dashboard, Reports)          |
| Title 1  | 28px | 700    | 34px        | -0.3px         | Section headers                           |
| Title 2  | 22px | 600    | 28px        | -0.2px         | Card titles, modal headers                |
| Title 3  | 20px | 600    | 24px        | -0.1px         | Sub-section headers                       |
| Headline | 17px | 600    | 22px        | 0              | Table headers, label emphasis             |
| Body     | 15px | 400    | 22px        | 0              | Primary body text, descriptions           |
| Callout  | 14px | 400    | 20px        | 0              | Secondary info, metadata                  |
| Caption  | 12px | 500    | 16px        | 0.2px          | Timestamps, badges, helper text           |
| Overline | 11px | 600    | 14px        | 0.8px          | Section labels (uppercase), category tags |

### Rules

- **Never use more than 3 font sizes on a single card.**
- **Bold is for scanning, not emphasis.** If a user needs to read something, use regular weight.
- **Monospace** (`SF Mono`, `JetBrains Mono`) only for: unit numbers, tracking IDs, license plates, timestamps.

---

## 4. Spacing & Grid

### 4.1 Spacing Scale (8px base)

| Token       | Value | Usage                                          |
| ----------- | ----- | ---------------------------------------------- |
| `--space-1` | 4px   | Inline icon gaps, badge padding                |
| `--space-2` | 8px   | Between related elements within a component    |
| `--space-3` | 12px  | Input internal padding, list item gap          |
| `--space-4` | 16px  | Card internal padding (compact), group spacing |
| `--space-5` | 20px  | Standard card padding                          |
| `--space-6` | 24px  | Between cards, section padding                 |
| `--space-7` | 32px  | Major section separators                       |
| `--space-8` | 40px  | Page-level vertical rhythm                     |
| `--space-9` | 48px  | Top-of-page breathing room                     |

### 4.2 Layout Grid

```
┌──────────────────────────────────────────────────────────┐
│  Sidebar (240px / 64px collapsed)  │   Content Area      │
│                                    │                     │
│  Fixed left. Scrolls independently │   Max-width: 1440px │
│                                    │   Padding: 32px     │
│                                    │   Gap: 24px         │
│                                    │                     │
│                                    │   12-column grid    │
│                                    │   Column gap: 24px  │
│                                    │   Row gap: 24px     │
└──────────────────────────────────────────────────────────┘
```

- Content area uses a **12-column CSS grid**
- KPI cards: 3 per row (4 columns each) on desktop, stack on mobile
- Charts: 6 columns (half-width) or 12 columns (full-width)
- Tables: always 12 columns (full-width)

---

## 5. The Sidebar — Adaptive Navigation

### 5.1 Design

The sidebar is **role-aware** and **context-collapsible** — it shows different menu items and groupings depending on the logged-in user's role.

```
┌─────────────────────┐
│  ◉ Concierge        │  ← Logo + brand. Click → dashboard.
│                     │
│  OVERVIEW           │  ← Overline category label
│  ● Dashboard        │  ← Active: accent bg + accent text
│    Units & Residents│  ← Inactive: text-secondary
│    Amenities        │
│                     │
│  OPERATIONS         │
│    Security         │
│    Packages         │
│    Service Requests │
│    Announcements    │
│                     │
│  COMMUNITY          │
│    Events           │
│    Marketplace      │
│    Library          │
│    Surveys          │
│                     │
│  MANAGEMENT         │  ← Only visible to admin/PM roles
│    Reports          │
│    User Management  │
│    Logs             │
│    Settings         │
│                     │
│  ─────────────────  │
│  👤 Sarah Chen      │  ← Avatar + name. Click → profile menu.
│  Property Manager   │     Role shown as caption text.
│  Bond • TSCC 2584   │     Building shown below.
└─────────────────────┘
```

### 5.2 Behavior

| State                         | Sidebar Width | Content                                                           |
| ----------------------------- | ------------- | ----------------------------------------------------------------- |
| Expanded (default desktop)    | 240px         | Icon (20px) + Label + Category headers                            |
| Collapsed (toggle or <1280px) | 64px          | Icon only, centered. Tooltip on hover shows label.                |
| Mobile (<768px)               | 0px (overlay) | Full-width slide-over with backdrop. Hamburger trigger in header. |

### 5.3 Rules

- **Grouped by user workflow**, not by data type. "Operations" = daily tasks. "Community" = resident-facing. "Management" = admin-only.
- **Active state**: Left 3px accent border + `--accent-subtle` background + `--accent` text color.
- **Hover state**: `--bg-tertiary` background. 150ms ease transition.
- **Badge counts** appear on: Packages (unreleased), Service Requests (open), Announcements (unread).
- **Collapse toggle**: Chevron icon at bottom of sidebar, above user profile. Persists in `localStorage`.
- **Keyboard shortcut**: `[` to toggle sidebar.

### 5.4 Role-Based Visibility

| Menu Item         | Security Guard | Resident | Owner | Property Manager | Board Member |
| ----------------- | :------------: | :------: | :---: | :--------------: | :----------: |
| Dashboard         |       ✓        |    ✓     |   ✓   |        ✓         |      ✓       |
| Units & Residents |       —        |    —     |   —   |        ✓         |      ✓       |
| Amenities         |       —        |    ✓     |   ✓   |        ✓         |      ✓       |
| Security          |       ✓        |    —     |   —   |        ✓         |      —       |
| Packages          |       ✓        |    ✓     |   ✓   |        ✓         |      —       |
| Service Requests  |       —        |    ✓     |   ✓   |        ✓         |      ✓       |
| Announcements     |       —        |    ✓     |   ✓   |        ✓         |      ✓       |
| Events            |       —        |    ✓     |   ✓   |        ✓         |      ✓       |
| Marketplace       |       —        |    ✓     |   ✓   |        ✓         |      —       |
| Library           |       —        |    ✓     |   ✓   |        ✓         |      ✓       |
| Surveys           |       —        |    ✓     |   ✓   |        ✓         |      ✓       |
| Reports           |       —        |    —     |   —   |        ✓         |      ✓       |
| User Management   |       —        |    —     |   —   |        ✓         |      —       |
| Logs              |       ✓        |    —     |   —   |        ✓         |      —       |
| Settings          |       —        |    —     |   —   |        ✓         |      —       |

---

## 6. Top Bar / Header

```
┌──────────────────────────────────────────────────────────────────────┐
│  Dashboard                        ⌘K Search...      🔔 9    👤 ▾   │
│                                                                      │
│  Welcome back, Sarah — Bond Building has 3 items needing attention.  │
└──────────────────────────────────────────────────────────────────────┘
```

### Components:

| Element                     | Position               | Behavior                                                                                |
| --------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| **Page title**              | Left-aligned           | Matches current route. Display weight (34px).                                           |
| **Command palette trigger** | Center                 | Shows `⌘K` pill. Click or keyboard opens palette.                                       |
| **Notification bell**       | Right                  | Badge with unread count. Click opens dropdown panel.                                    |
| **User avatar**             | Far right              | Click opens profile flyout (View Profile, Switch Building, Language, Settings, Logout). |
| **Contextual greeting**     | Below title, Body size | Personalized. Shows building name + action items count. Disappears after first scroll.  |

### Command Palette (⌘K)

Full-screen overlay (like Spotlight). Searches across:

- **Pages**: "Security" → navigates to Security module
- **Units**: "Unit 1205" → opens unit file
- **Residents**: "John Smith" → opens resident profile
- **Actions**: "Create announcement" → opens announcement form
- **Amenities**: "Book party room" → opens booking flow

```
┌──────────────────────────────────────────────┐
│  🔍  Search pages, units, residents, actions │
│                                              │
│  RECENT                                      │
│  ↩ Unit 1205 — View Unit File                │
│  ↩ Announcements — Create Announcement       │
│                                              │
│  SUGGESTED                                   │
│  📦 3 packages awaiting release              │
│  🔧 2 open service requests                  │
│  📢 1 announcement draft                     │
└──────────────────────────────────────────────┘
```

---

## 7. Component Library

### 7.1 Cards

**Standard Card**

```css
background: #ffffff;
border: 1px solid var(--border-subtle); /* #E5E5EA */
border-radius: 16px;
padding: 20px;
box-shadow: none; /* No shadow by default */
transition: box-shadow 200ms ease;
```

**Card on Hover** (only for clickable cards):

```css
box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
```

**Stat/KPI Card**:

```
┌─────────────────────────────┐
│  Unreleased Packages     ↗  │  ← Title (Callout) + trend arrow
│                             │
│  47                         │  ← Value (Display, 34px, --text-primary)
│  ▃▅▇▅▆▇█                   │  ← Sparkline (48px tall, accent color)
│  +12% vs last week          │  ← Trend (Caption, success/error color)
└─────────────────────────────┘
```

Rules:

- KPI cards show **one metric only**. No multi-metric cards.
- Trend indicator: green ↑ for improvement, red ↓ for regression. Direction depends on metric (e.g., "open issues" going up = red).
- Sparkline is optional. Only show if historical data exists.

### 7.2 Buttons

| Type            | Style                                                                   | Usage                                                     |
| --------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| **Primary**     | `bg: --accent`, white text, 10px radius, 44px height                    | One per screen. The main action (Save, Create, Submit).   |
| **Secondary**   | `bg: transparent`, `border: 1px --border-subtle`, `--text-primary` text | Alternative actions (Cancel, Export, Filter).             |
| **Ghost**       | No border, no background, `--accent` text                               | Inline actions (View all, Edit, Clear).                   |
| **Destructive** | `bg: --status-error`, white text                                        | Delete, Remove, Ban. Always requires confirmation dialog. |
| **Icon button** | 36×36px circle, `--bg-secondary` bg, `--text-secondary` icon            | Toolbar actions (more ⋯, close ✕, filter).                |

### Rules:

- **44px minimum touch target** on all interactive elements.
- **No more than 2 buttons side-by-side.** Primary right, secondary left.
- **Loading state**: Replace label with spinner. Button stays same width. Disable pointer.
- **Disabled**: 40% opacity. No hover effect. `cursor: not-allowed`.

### 7.3 Tables

```
┌─────────────────────────────────────────────────────────────┐
│  ☑ Unit    Resident        Type     Status     Actions      │  ← Header: Headline weight
│  ─────────────────────────────────────────────────────────  │     --bg-secondary bg
│  ☐ 1205    Sarah Chen      Owner    Active     ⋯           │  ← Row: Body weight
│  ☐ 1304    Mike Johnson    Tenant   Active     ⋯           │     56px row height
│  ☐ 807     — (vacant)      —        Vacant     ⋯           │     Hover: --bg-secondary
└─────────────────────────────────────────────────────────────┘
  Showing 1-25 of 1,987 units                    ◀ 1 2 3 ▶     ← Footer: Caption size
```

Rules:

- **Row height**: 56px. Never less.
- **Alternating row colors**: NO. Use hover highlight only.
- **Selection**: Checkbox column on left. Selecting rows reveals a **floating action bar** at bottom.
- **Sort**: Click column header. Arrow indicator (↑↓). Only one column sortable at a time.
- **Pagination**: Bottom-right. Show total count. 25 rows default.
- **Empty state**: Centered illustration + "No [items] found" + action button.
- **Actions column**: Single `⋯` icon button. Click opens dropdown (View, Edit, Delete).

### 7.4 Forms & Inputs

**Text Input**:

```css
height: 44px;
padding: 0 12px;
border: 1px solid var(--border-subtle);
border-radius: 10px;
font-size: 15px;
background: #ffffff;
transition:
  border-color 200ms ease,
  box-shadow 200ms ease;
```

**Focus state**:

```css
border-color: var(--accent);
box-shadow: 0 0 0 3px var(--accent-subtle);
outline: none;
```

**Input types and heights**:
| Type | Height | Notes |
|------|--------|-------|
| Text, Email, Number | 44px | Single line |
| Textarea | Min 88px, grows | Auto-resize up to 200px, then scroll |
| Select / Dropdown | 44px | Custom styled, no native dropdown |
| Date picker | 44px | Calendar popover, not native |
| File upload | 80px | Dashed border zone, drag-and-drop |
| Toggle | 28×48px | iOS-style. No checkboxes for on/off states. |
| Checkbox | 20×20px | Only for multi-select lists |
| Radio | 20×20px | Only for mutually exclusive options (≤5) |

**Label placement**: Always above the input. Never inline/beside.
**Error state**: Red border + red caption text below input. Icon optional.
**Required indicator**: Red asterisk after label.

### 7.5 Modals & Dialogs

**Modal sizes**:
| Size | Width | Usage |
|------|-------|-------|
| Small | 400px | Confirmations, simple forms (1-3 fields) |
| Medium | 560px | Standard forms, details view |
| Large | 720px | Complex forms, multi-step wizards |
| Full-sheet | 90vw × 90vh | Reports, booking calendars, rich editors |

**Structure**:

```
┌──────────────────────────────────────┐
│  Create Announcement              ✕  │  ← Title 2 + close icon button
│  ──────────────────────────────────  │  ← 1px divider
│                                      │
│  [Form content, scrollable]          │  ← Max height: 70vh, then scroll
│                                      │
│  ──────────────────────────────────  │
│                    Cancel    Save  ▶  │  ← Sticky footer with actions
└──────────────────────────────────────┘
```

Rules:

- **Backdrop**: `rgba(0, 0, 0, 0.3)` with `backdrop-filter: blur(8px)`.
- **Animation**: Scale from 0.97 → 1.0 + fade in. 250ms ease-out.
- **Close**: ✕ button + Escape key + backdrop click.
- **Stacking**: Maximum 1 modal at a time. If a modal needs to open another, use a slide-over panel instead.
- **Destructive confirmations**: Use the small modal with red Destructive button. Require typing the item name for permanent deletes.

### 7.6 Status Badges

```
 Active     Pending     Overdue     Closed     Draft
  ●          ●           ●           ●          ●
```

- Pill shape: `border-radius: 999px`, `padding: 2px 10px`
- Background: semantic `*-bg` token
- Text: semantic color, Caption size, 500 weight
- Dot indicator: 6px circle before text, same semantic color

### 7.7 Notifications Panel

Triggered by bell icon. Slides in from right as a **320px-wide panel**.

```
┌──────────────────────┐
│  Notifications       │
│  Mark all read       │
│  ────────────────    │
│  TODAY               │
│  📦 Package arrived  │  ← Icon + title + time
│  for Unit 1205       │     Click → navigates
│  2 min ago           │
│                      │
│  🔧 Service request  │
│  #4521 updated       │
│  15 min ago          │
│  ────────────────    │
│  YESTERDAY           │
│  📢 New announcement │
│  ...                 │
│  ────────────────    │
│  View all →          │
└──────────────────────┘
```

---

## 8. Dashboard — Role-Based Layouts

The dashboard is not one layout. It adapts per role.

### 8.1 Property Manager Dashboard

High-density overview of building operations. This is the "command center."

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                    ⌘K    🔔 9   👤  │
│  Welcome back, Sarah — 7 items need attention today.            │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Open       │  │Unreleased│  │Active     │  │Amenity   │       │
│  │Requests   │  │Packages  │  │Visitors   │  │Bookings  │       │
│  │  12    ↑  │  │  47   ↓  │  │   8       │  │  23      │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ Recent Service Requests │  │ Recent Announcements     │      │
│  │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │  │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │      │
│  │ #4521 Leaking faucet   │  │ 📢 Elevator maintenance  │      │
│  │ #4520 Noise complaint  │  │ 📢 Board meeting Mar 20  │      │
│  │ #4519 Parking issue    │  │ 📢 Pool reopening        │      │
│  │ View all →             │  │ View all →               │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Resident Breakdown          │  Upcoming Events       │      │
│  │ ◕ Owners: 235               │  📅 Board Meeting      │      │
│  │ ◕ Tenants: 1,298            │     Mar 20, 7:00 PM    │      │
│  │ ◕ Offsite Owners: 454       │  📅 Fire Drill         │      │
│  │                              │     Mar 25, 10:00 AM   │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Resident Dashboard

Simple, clean. Only what they need.

```
┌─────────────────────────────────────────────────────┐
│  Good morning, John — Unit 1205                     │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ 📦 1 Package│  │ 🔧 2 Open  │  │ 📅 1 Booking│ │
│  │ awaiting    │  │ Requests    │  │ Tomorrow    │  │
│  │ Pick up →   │  │ View →      │  │ View →      │  │
│  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                      │
│  Recent Announcements                                │
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈                                │
│  Elevator maintenance — Mar 15-17                    │
│  Board meeting agenda posted                         │
│                                                      │
│  Quick Actions                                       │
│  [ Book Amenity ]  [ Submit Request ]  [ Directory ] │
└─────────────────────────────────────────────────────┘
```

### 8.3 Security Guard Dashboard

Action-oriented. Minimal reading, maximum doing.

```
┌──────────────────────────────────────────────────────┐
│  Security Dashboard — Bond Building                   │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Active Visitor│  │ Unreleased   │  │ Keys Out   │ │
│  │ Permits: 8   │  │ Packages: 47 │  │ 3          │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                       │
│  QUICK ACTIONS (large tap targets)                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ + Visitor   │  │ + Package  │  │ + Key       │    │
│  │   Parking   │  │   Release  │  │   Checkout  │    │
│  └────────────┘  └────────────┘  └────────────┘     │
│                                                       │
│  Recent Activity Log                                  │
│  10:45 AM  Package delivered — Unit 1205              │
│  10:32 AM  Visitor parking — Unit 807                 │
│  10:15 AM  Key checked out — Maintenance              │
└──────────────────────────────────────────────────────┘
```

---

## 9. Motion & Animation

| Action                  | Animation                   | Duration | Easing            |
| ----------------------- | --------------------------- | -------- | ----------------- |
| Page transition         | Content fade + 8px slide up | 200ms    | ease-out          |
| Modal open              | Scale 0.97→1.0 + fade       | 250ms    | ease-out          |
| Modal close             | Fade out                    | 150ms    | ease-in           |
| Sidebar expand/collapse | Width transition            | 200ms    | ease-in-out       |
| Dropdown open           | Scale Y 0.95→1.0 + fade     | 150ms    | ease-out          |
| Hover state             | Background color            | 150ms    | ease              |
| Toast notification      | Slide in from top-right     | 300ms    | spring(1, 80, 10) |
| Skeleton loading        | Shimmer gradient sweep      | 1.5s     | linear, infinite  |
| Button press            | Scale 0.98                  | 100ms    | ease              |

### Rules:

- **No animations >300ms.** Users should never feel like they're waiting for the UI.
- **Reduce motion**: Respect `prefers-reduced-motion`. Replace all motion with instant opacity changes.
- **Skeleton screens** instead of spinners for page/section loading. Match the layout of the loaded state.

---

## 10. Responsive Breakpoints

| Name       | Width       | Layout Changes                                    |
| ---------- | ----------- | ------------------------------------------------- |
| Desktop XL | ≥1440px     | Full sidebar (240px) + 12-col grid                |
| Desktop    | 1280–1439px | Sidebar auto-collapses to 64px                    |
| Tablet     | 768–1279px  | Sidebar hidden (hamburger trigger), 8-col grid    |
| Mobile     | <768px      | Single column, bottom tab bar for top 5 nav items |

### Mobile Bottom Tab Bar:

```
┌─────────────────────────────────────┐
│  🏠       📦       ➕       🔔     │
│ Home   Packages  Action  Alerts    │
│                                     │
│              ☰ More                 │
└─────────────────────────────────────┘
```

- The center `➕` is the context-aware quick-action (changes per role).
- "More" opens the full sidebar as an overlay.

---

## 11. Accessibility Standards

| Requirement         | Standard                                           |
| ------------------- | -------------------------------------------------- |
| Color contrast      | WCAG AA minimum (4.5:1 text, 3:1 large text/UI)    |
| Focus indicators    | 3px accent ring on all interactive elements        |
| Keyboard navigation | Full tab-order support on all views                |
| Screen reader       | ARIA labels on all icons, roles on dynamic content |
| Touch targets       | 44×44px minimum                                    |
| Error messages      | Text-based (never color-only)                      |
| Form labels         | Always visible (no placeholder-only labels)        |

---

## 12. Iconography

**Icon set**: [Lucide Icons](https://lucide.dev/) — clean, consistent, 24×24 default.

| Size    | px   | Usage                                    |
| ------- | ---- | ---------------------------------------- |
| Small   | 16px | Inline with text, badges, table actions  |
| Default | 20px | Sidebar items, button icons, input icons |
| Medium  | 24px | Card headers, notification icons         |
| Large   | 32px | Empty states, feature highlights         |
| Display | 48px | Dashboard quick-action buttons           |

Rules:

- **Stroke width**: 1.5px (matches Apple's SF Symbols feel).
- **Color**: Inherits text color. Never multi-color icons.
- **Interactive icons**: Always wrapped in a 36×36px or 44×44px button with hover state.

---

## 13. Empty States

Every list, table, and section must have a designed empty state.

```
┌─────────────────────────────────────┐
│                                     │
│           📭                        │
│                                     │
│    No packages to release           │  ← Title 3
│    New packages will appear here    │  ← Body, text-secondary
│    when they're checked in.         │
│                                     │
│         [ Check In Package ]        │  ← Primary button (optional)
│                                     │
└─────────────────────────────────────┘
```

---

## 14. Dark Mode

Support via `prefers-color-scheme` media query AND manual toggle in settings.

### Token Overrides:

| Token              | Light     | Dark      |
| ------------------ | --------- | --------- |
| `--bg-primary`     | `#FFFFFF` | `#1C1C1E` |
| `--bg-secondary`   | `#F5F5F7` | `#2C2C2E` |
| `--bg-tertiary`    | `#E8E8ED` | `#3A3A3C` |
| `--text-primary`   | `#1D1D1F` | `#F5F5F7` |
| `--text-secondary` | `#6E6E73` | `#AEAEB2` |
| `--text-tertiary`  | `#AEAEB2` | `#636366` |
| `--border-subtle`  | `#E5E5EA` | `#38383A` |
| `--accent`         | `#0071E3` | `#0A84FF` |

Cards in dark mode: No border, use subtle elevation (`box-shadow: 0 1px 4px rgba(0,0,0,0.3)`).

---

## 15. Error Handling & Feedback

| Scenario                 | Pattern                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Form validation error    | Inline red text below field, red border. Shown on blur or submit.                     |
| API failure              | Toast notification (top-right): red background, error icon, retry button.             |
| Empty search results     | Empty state with suggestion to broaden search.                                        |
| Permission denied        | Gray card with lock icon: "You don't have access to this section."                    |
| Successful action        | Toast notification (top-right): green check, auto-dismiss 4s.                         |
| Destructive confirmation | Small modal: "Are you sure?" + red button. Require name-typing for permanent deletes. |
| Network offline          | Persistent banner at top: "You're offline. Changes will sync when reconnected."       |

### Toast Notifications:

```
┌─────────────────────────────────┐
│ ✓  Announcement published       │  ← Auto-dismiss: 4s
│    Sent to 1,298 residents      │  ← Optional detail line
│                         Undo    │  ← Optional action
└─────────────────────────────────┘
```

- Max 3 toasts stacked. Oldest dismissed first.
- Position: top-right, 24px from edges.

---

## 16. Data Visualization Rules

1. **Donut charts**: Max 5 segments + "Other". Center label shows total.
2. **Line charts**: Max 3 series. Include legend above chart.
3. **Bar charts**: Horizontal preferred for categories. Vertical for time series.
4. **Sparklines**: No axes, no labels. Pure trend indicator inside KPI cards.
5. **Colors**: Use the visualization palette in order. Never use semantic colors for chart data.
6. **Tooltips**: On hover, show exact value + label. White card with subtle shadow.
7. **Responsive**: Charts resize fluidly. Below 400px width, switch to a simple number + trend arrow.

---

## 17. File Naming & Code Conventions

| Item             | Convention                      | Example                    |
| ---------------- | ------------------------------- | -------------------------- |
| Components       | PascalCase                      | `ServiceRequestCard.tsx`   |
| Hooks            | camelCase, `use` prefix         | `useNotifications.ts`      |
| Pages            | PascalCase                      | `SecurityDashboard.tsx`    |
| CSS tokens       | kebab-case, `--` prefix         | `--bg-primary`             |
| API routes       | kebab-case                      | `/api/v1/service-requests` |
| Types/Interfaces | PascalCase, `I` prefix optional | `ServiceRequest`, `IUser`  |

---

## 18. Performance Budgets

| Metric                   | Target                  |
| ------------------------ | ----------------------- |
| First Contentful Paint   | <1.2s                   |
| Largest Contentful Paint | <2.5s                   |
| Time to Interactive      | <3.0s                   |
| Cumulative Layout Shift  | <0.1                    |
| Bundle size (gzipped)    | <200KB initial JS       |
| Image format             | WebP with AVIF fallback |
| Skeleton → content       | <500ms perceived        |

---

## 19. Page Specifications

### 19.1 Login & Authentication

**Layout**: Split-screen — 50/50 on desktop, form-only on mobile.

```
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│   BUILDING IMAGE PANEL   │     AUTHENTICATION       │
│                          │          FORM            │
│   ┌──────────────────┐   │                          │
│   │                  │   │   ◉ Concierge            │
│   │  Building photo  │   │                          │
│   │  (full bleed,    │   │   Welcome back           │
│   │   object-fit:    │   │   Sign in to your account │
│   │   cover)         │   │                          │
│   │                  │   │   Email *                 │
│   │                  │   │   ┌──────────────────┐   │
│   │                  │   │   │ you@email.com    │   │
│   │                  │   │   └──────────────────┘   │
│   └──────────────────┘   │                          │
│                          │   Password *   Forgot?   │
│   ░░░░░░░░░░░░░░░░░░░   │   ┌──────────────────👁┐  │
│   Building Name          │   │ ••••••••          │   │
│   "Your home,            │   └──────────────────┘   │
│    your community"       │                          │
│                          │   ☑ Remember this device  │
│                          │                          │
│                          │   ┌──────────────────┐   │
│                          │   │    Sign In    ▶  │   │
│                          │   └──────────────────┘   │
│                          │                          │
│                          │   Need access? Contact    │
│                          │   your building admin     │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

#### Left Panel — Building Image

| Property            | Specification                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Width**           | 50% of viewport on desktop; hidden on mobile (<768px)                                                                                             |
| **Image source**    | Building-specific photo uploaded by property manager                                                                                              |
| **Fallback**        | If no building photo: subtle architectural line-art pattern on `--bg-secondary` background (similar to Hotelook's illustration style but minimal) |
| **Image treatment** | `object-fit: cover`, slight dark gradient overlay at bottom (`linear-gradient(transparent 60%, rgba(0,0,0,0.5))`)                                 |
| **Bottom overlay**  | Building name (Title 1, white) + optional tagline (Body, white 80% opacity)                                                                       |
| **Border radius**   | 0px (full bleed to edge) on desktop. On tablet: 24px radius with 24px margin, creating a card effect                                              |
| **Animation**       | Subtle parallax on scroll (mobile only when stacked). Ken Burns slow zoom (8s) on desktop for photo.                                              |

#### Multi-Building Support

When the portal serves multiple buildings, the left panel becomes a **building selector** on first visit:

```
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│   Select Your Building   │                          │
│                          │   Form appears AFTER     │
│   ┌────────┐ ┌────────┐ │   building selection     │
│   │ 📷     │ │ 📷     │ │                          │
│   │ Bond   │ │ Maple  │ │   (or shows building     │
│   │ Tower  │ │ Court  │ │    selector inline if     │
│   └────────┘ └────────┘ │    fewer than 6)          │
│                          │                          │
│   ┌────────┐ ┌────────┐ │                          │
│   │ 📷     │ │ 📷     │ │                          │
│   │ Lake   │ │ Park   │ │                          │
│   │ View   │ │ Place  │ │                          │
│   └────────┘ └────────┘ │                          │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

After selection, the building photo loads and the login form appears with a smooth transition.

#### Right Panel — Authentication Form

**Structure** (top to bottom):

| Order | Element             | Specification                                                                                                                                   |
| ----- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Logo**            | Concierge logo, 32px height, top-left of form panel. `margin-top: 48px`                                                                         |
| 2     | **Heading**         | "Welcome back" — Display size (34px), `--text-primary`                                                                                          |
| 3     | **Subheading**      | "Sign in to your account" — Body size, `--text-secondary`                                                                                       |
| 4     | **Email field**     | Label above ("Email"), 44px height, full-width. Mail icon inside (left).                                                                        |
| 5     | **Password field**  | Label above ("Password") with "Forgot?" link right-aligned on same line (`--accent` color, Caption size). 44px height. Eye toggle icon (right). |
| 6     | **Remember toggle** | "Remember this device" — iOS-style toggle (not checkbox). Default: on.                                                                          |
| 7     | **Sign In button**  | Full-width, 48px height, `--text-primary` background (#1D1D1F), white text, 12px radius. THE primary action.                                    |
| 8     | **Help text**       | "Need access? Contact your building administrator" — Caption size, centered, `--text-tertiary`.                                                 |

#### Form Behavior

| State                         | Behavior                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty**                     | Placeholder text in `--text-tertiary`. Sign In button disabled (40% opacity).                                                                   |
| **Typing**                    | Real-time email format validation (debounced 500ms). No validation on password length during typing.                                            |
| **Error — wrong credentials** | Shake animation on form (300ms). Red inline message: "Incorrect email or password. Please try again." below password field. Fields NOT cleared. |
| **Error — account locked**    | Red banner at top of form: "Account locked after 5 failed attempts. Contact your property manager."                                             |
| **Loading**                   | Sign In button shows spinner, text changes to "Signing in…", button disabled.                                                                   |
| **Success**                   | Button turns green with checkmark (200ms), then fade-transition to dashboard.                                                                   |
| **Forgot password**           | Replaces form content (slide-left transition) with email-only field + "Send Reset Link" button + "Back to sign in" ghost link.                  |

#### Access Hierarchy

There is **no self-registration and no SSO**. All access is admin-controlled:

```
Super Admin
  └── Creates Buildings
  └── Creates Building Admins
        └── Admin creates roles for their building:
              ├── Property Manager
              ├── Security Guard
              ├── Security Head Office
              ├── Superintendent
              ├── Supervisor
              ├── Board Member
              ├── Owner
              ├── Offsite Owner
              ├── Tenant
              ├── Family Member (Spouse/Child)
              ├── Other Occupant
              └── Custom roles as needed
```

**Login determines role automatically** — no role selection on the login screen. The system knows who you are from your account. If a user has multiple roles, the dashboard adapts accordingly.

#### Multi-Building Handling

If a user belongs to **multiple buildings**, after login they see a building picker (modal, not a new page):

```
┌──────────────────────────────────┐
│  Select Building                 │
│                                  │
│  ┌──────────────────────────┐    │
│  │ 🏢  Bond Tower           │ ←  │  Active: accent border
│  │     TSCC 2584 • Toronto  │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │ 🏢  Maple Court           │    │
│  │     TSCC 3201 • Toronto  │    │
│  └──────────────────────────┘    │
│                                  │
│  ☑ Remember my choice            │
│                    [ Continue ]   │
└──────────────────────────────────┘
```

#### Responsive Behavior

| Breakpoint          | Layout                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop (≥1024px)   | 50/50 split. Image left, form right.                                                                                                                           |
| Tablet (768–1023px) | Image panel becomes 40% width with 24px margin + 24px radius (card effect). Form panel 60%.                                                                    |
| Mobile (<768px)     | Image panel hidden entirely. Form takes full screen. Building name + logo shown at top of form instead. Subtle gradient background (white → `--bg-secondary`). |

#### Security Considerations

- No "Sign Up" link and no SSO — all accounts created by building admin via admin panel
- Rate limiting: 5 failed attempts → 15-minute lockout + email notification to user
- Password visibility toggle defaults to hidden
- "Remember this device" uses secure token, NOT "remember password"
- First-time login: user receives email invitation with temporary password, forced to set new password on first sign-in

---

### 19.2 Amenity Booking — Calendar & Scheduling

**Layout**: Left sidebar (filters + mini calendar) + Main area (calendar grid) + Booking popover.

```
┌────────────────┬──────────────────────────────────────────────────┐
│  FILTER PANEL  │  CALENDAR MAIN AREA                             │
│                │                                                  │
│  ┌──────────┐  │  March 2026          ◀  Today  ▶               │
│  │ Mini Cal │  │                                                  │
│  │ March    │  │  [ Month ]  [ Week ]  [ Day ]                   │
│  │ ◀  ▶    │  │                                                  │
│  │ grid...  │  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐  │
│  └──────────┘  │  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │  │
│                │  │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │  │
│  AMENITIES     │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤  │
│  ☑ All         │  │8am  │     │     │     │     │     │     │  │
│                │  │     │░░░░░│     │     │     │     │     │  │
│  ● Party Room  │  │9am  │Party│     │░░░░░│     │     │     │  │
│  ● Gym         │  │     │Room │     │Gym  │     │     │     │  │
│  ● BBQ Area    │  │10am │Unit │     │Unit │     │     │     │  │
│  ● Guest Suite │  │     │1205 │     │807  │     │     │     │  │
│  ● Pool        │  │11am │     │     │     │     │░░░░░│     │  │
│  ● Tennis      │  │     │     │     │     │     │BBQ  │     │  │
│  ● Yoga Studio │  │12pm │     │     │     │     │Area │     │  │
│  ● Rooftop     │  │     │     │     │     │     │     │     │  │
│                │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘  │
│  ────────────  │                                                  │
│  MY BOOKINGS   │                                                  │
│  3 upcoming    │                                                  │
│  View all →    │                                                  │
└────────────────┴──────────────────────────────────────────────────┘
```

#### Left Panel — Filter & Navigation (280px width)

| Section              | Specification                                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mini Calendar**    | Compact month grid. Dots below dates indicate existing bookings. Click date → jumps main calendar. Current date: accent circle fill. Selected date: accent border ring.                                     |
| **Amenity Filter**   | Checkbox list of all bookable amenities. Each amenity has a **color dot** (assigned from visualization palette). "All" toggle at top. Unchecking hides that amenity's blocks from the grid.                 |
| **Color Assignment** | Each amenity type gets a consistent color from the palette: Party Room `#0071E3`, Gym `#34C759`, BBQ `#FF9500`, Guest Suite `#AF52DE`, Pool `#5AC8FA`, Tennis `#FF3B30`, Yoga `#FFCC00`, Rooftop `#30D158`. |
| **My Bookings**      | Count of upcoming bookings for the logged-in user. "View all →" opens a list view of the user's bookings.                                                                                                   |
| **Collapse**         | Panel collapses to icon-only (64px) on screens <1280px. Toggle button at top.                                                                                                                               |

#### Main Area — Calendar Grid

**View Modes** (segmented control, top-right):

| Mode               | Layout                                                                                                                              | Best For                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Week** (default) | 7 columns × 24 hour rows. Time labels on left (30-min increments). Scrollable vertically.                                           | Day-to-day booking management                  |
| **Day**            | Single column, expanded. Larger time slots. Shows all amenities side-by-side as sub-columns.                                        | Security guards / front desk booking for today |
| **Month**          | Traditional month grid. Each day cell shows colored dots for bookings (max 3 visible + "+N more"). Click day → zooms into Day view. | Overview / finding open dates                  |

**Navigation Controls**:

```
March 2026          ◀  Today  ▶         [ Month ] [ ■ Week ] [ Day ]
```

- **Month/Year**: Title 1 size (28px). Click → opens month/year picker dropdown.
- **◀ ▶ arrows**: Navigate back/forward by current view period (week/day/month).
- **Today pill**: Accent background, white text. Click → jumps to current date. Only visible when viewing a date range that doesn't include today.
- **View switcher**: Segmented control. Active segment: `--accent` background, white text. Inactive: `--bg-secondary` background, `--text-secondary` text.

#### Booking Blocks (Calendar Events)

```
┌─────────────────────┐
│ ● Party Room        │  ← Amenity name (Caption, 600 weight)
│   9:00 — 11:00 AM   │  ← Time range (Caption, 400 weight)
│   Unit 1205          │  ← Booked by (Caption, --text-secondary)
└─────────────────────┘
```

| Property                 | Specification                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Background**           | Amenity color at 12% opacity (e.g., `rgba(0, 113, 227, 0.12)` for Party Room)                                                        |
| **Left border**          | 3px solid amenity color                                                                                                              |
| **Border radius**        | 8px                                                                                                                                  |
| **Height**               | Proportional to duration. 1 hour = 60px in week view. Minimum: 40px (30-min slot).                                                   |
| **Text**                 | Amenity name (600 weight) + time range + unit number. All truncate with ellipsis if block is too small.                              |
| **Hover**                | Elevate with shadow `0 2px 8px rgba(0,0,0,0.08)`. Cursor: pointer.                                                                   |
| **Click**                | Opens Booking Detail Popover.                                                                                                        |
| **Conflict/Unavailable** | Diagonal stripe pattern (`repeating-linear-gradient`) in `--bg-tertiary`. Non-clickable. Shows "Unavailable" or "Maintenance" label. |
| **Your booking**         | Slightly darker background (18% opacity instead of 12%). Small "Your booking" badge in top-right corner.                             |

#### Quick Booking — Click Empty Slot

Clicking an empty time slot opens a **Booking Popover** anchored to the click position:

```
┌──────────────────────────────────┐
│  New Booking                  ✕  │
│                                  │
│  Amenity *                       │
│  ┌──────────────────────────▾┐   │
│  │ Party Room                │   │
│  └──────────────────────────┘   │
│                                  │
│  Date                            │
│  ┌──────────────────────────┐   │
│  │ 📅  Wed, March 18, 2026  │   │
│  └──────────────────────────┘   │
│                                  │
│  Time                            │
│  ┌───────────┐  ┌───────────┐   │
│  │ 09:00 AM ▾│  │ 11:00 AM ▾│   │
│  └───────────┘  └───────────┘   │
│  Start            End            │
│                                  │
│  Unit * (admin only)             │
│  ┌──────────────────────────▾┐   │
│  │ 1205 — Sarah Chen         │   │
│  └──────────────────────────┘   │
│                                  │
│  Notes (optional)                │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ⓘ Max 4 hours • $50 deposit    │
│                                  │
│           Cancel    Book Now  ▶  │
└──────────────────────────────────┘
```

| Field                | Behavior                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Amenity dropdown** | Pre-filled if clicked from a specific amenity's column in Day view. Otherwise required selection. Shows availability indicator (green dot = open, red dot = fully booked today). |
| **Date**             | Pre-filled from clicked slot. Calendar picker on click. Blocked dates shown greyed out.                                                                                          |
| **Time — Start**     | Pre-filled from clicked slot. 30-min increment dropdown. Unavailable slots greyed out with strikethrough.                                                                        |
| **Time — End**       | Auto-calculated from amenity's default duration. Adjustable. Capped at amenity's max duration. Shows "exceeds max" warning in real-time.                                         |
| **Unit selector**    | Admin/PM only — pick any unit. Residents: auto-filled with their unit, not editable. Searchable dropdown with unit + resident name.                                              |
| **Notes**            | Optional textarea. Max 200 chars.                                                                                                                                                |
| **Info bar**         | Shows amenity rules: max duration, deposit required, cancellation policy. Dynamic per amenity. `--status-info-bg` background.                                                    |
| **Book Now**         | Primary button. Disabled until all required fields filled. On click: spinner → success toast → block appears on calendar.                                                        |

#### Booking Detail Popover (Click Existing Booking)

```
┌──────────────────────────────────┐
│  Party Room                   ✕  │
│  ● Confirmed                     │
│                                  │
│  📅  Wed, March 18, 2026         │
│  🕐  9:00 AM — 11:00 AM (2h)    │
│  🏠  Unit 1205 — Sarah Chen      │
│  📝  Birthday party setup        │
│                                  │
│  Booked on Mar 10 at 2:15 PM     │
│                                  │
│  ┌────────────┐  ┌────────────┐  │
│  │  Cancel     │  │  Modify    │  │  ← Only for booking owner or admin
│  └────────────┘  └────────────┘  │
└──────────────────────────────────┘
```

| Element           | Specification                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Status badge**  | Confirmed (green), Pending (yellow), Cancelled (red)                                                                |
| **Cancel button** | Secondary/destructive. Opens confirmation: "Cancel this booking? Cancellation policy: free if >24h before."         |
| **Modify button** | Secondary. Opens the booking form pre-filled. Only available if >24h before the booking (configurable per amenity). |
| **Admin view**    | Admin/PM sees additional: "Booked by [admin name] on behalf of Unit 1205." + "Override" button to bypass rules.     |

#### Availability Rules Engine (Admin-Configured Per Amenity)

| Rule                       | Example                              | UI Representation                                                                    |
| -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| **Operating hours**        | 8:00 AM — 10:00 PM                   | Time slots outside hours are greyed/hidden                                           |
| **Max duration**           | 4 hours                              | End time dropdown caps automatically                                                 |
| **Min advance booking**    | 24 hours                             | Slots within 24h show "Too late to book"                                             |
| **Max advance booking**    | 30 days                              | Dates >30 days out are disabled in picker                                            |
| **Bookings per unit/week** | 2 per week                           | After 2nd booking, unit sees "Limit reached this week"                               |
| **Deposit required**       | $50                                  | Info bar shows deposit. Booking marked "Pending" until confirmed.                    |
| **Maintenance blackout**   | Every Monday 8-10 AM                 | Diagonal stripe pattern block, label "Maintenance"                                   |
| **Concurrent bookings**    | 1 (exclusive) or 5 (shared like gym) | Shared: multiple blocks stack in same slot. Exclusive: slot blocked after 1 booking. |

#### Responsive Behavior

| Breakpoint                  | Layout                                                                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop (≥1280px)           | Full layout: filter panel (280px) + calendar grid                                                                                                                                                     |
| Desktop small (1024–1279px) | Filter panel collapsed to icons. Calendar grid full-width.                                                                                                                                            |
| Tablet (768–1023px)         | Filter panel hidden (hamburger toggle). Calendar defaults to Day view.                                                                                                                                |
| Mobile (<768px)             | **Completely different layout** — no grid calendar. Instead: date scroller at top (horizontal scroll of dates) → list of available time slots below → tap slot → booking sheet slides up from bottom. |

**Mobile Booking View**:

```
┌──────────────────────────┐
│  Book Party Room         │
│                          │
│  ◀ Mar 16  17  ■18  19 ▶│  ← Horizontal date scroller
│                          │
│  Available slots         │
│  ┌──────────────────┐    │
│  │ 9:00 — 11:00 AM  │ ✓ │  ← Tap to select
│  └──────────────────┘    │
│  ┌──────────────────┐    │
│  │ 11:00 — 1:00 PM  │   │
│  └──────────────────┘    │
│  ┌──────────────────┐    │
│  │ 2:00 — 4:00 PM   │   │
│  └──────────────────┘    │
│  ┌──────────────────┐    │
│  │ 6:00 — 8:00 PM   │   │
│  └──────────────────┘    │
│                          │
│  [ Book Selected Slot ]  │
└──────────────────────────┘
```

---

### 19.3 Service Requests (Ticket System)

**Layout**: Dual-view — Toggle between **Kanban board** (default for PM/admin) and **List view** (default for residents).

#### Kanban Board View (Property Manager / Admin)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Service Requests          + New Request     🔍 Filter   ≡ List  ▦ Board │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ OPEN (12)   │  │ IN PROGRESS │  │ ON HOLD (3) │  │ CLOSED     │ │
│  │             │  │ (5)         │  │             │  │ (89)       │ │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │            │ │
│  │ │🔴 High  │ │  │ │🟡 Med   │ │  │ │🔵 Low   │ │  │ ┌────────┐ │ │
│  │ │Leaking  │ │  │ │Elevator │ │  │ │Light    │ │  │ │✓ Fixed │ │ │
│  │ │faucet   │ │  │ │noise    │ │  │ │flickr   │ │  │ │parking │ │ │
│  │ │Unit 1205│ │  │ │Lobby    │ │  │ │Floor 8  │ │  │ │gate    │ │ │
│  │ │2h ago   │ │  │ │1d ago   │ │  │ │3d ago   │ │  │ └────────┘ │ │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │            │ │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │             │  │            │ │
│  │ │🟡 Med   │ │  │ │🔴 High  │ │  │             │  │            │ │
│  │ │Noise    │ │  │ │HVAC     │ │  │             │  │            │ │
│  │ │complnt  │ │  │ │repair   │ │  │             │  │            │ │
│  │ └─────────┘ │  │ └─────────┘ │  │             │  │            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Kanban Card**:

```
┌───────────────────────────┐
│ 🔴 High    #SR-4521       │  ← Priority dot + ID (Caption, monospace)
│                           │
│ Leaking faucet in kitchen │  ← Title (Headline, 1 line, truncate)
│                           │
│ 🏠 Unit 1205 • Plumbing   │  ← Unit + Category (Caption, --text-secondary)
│ 👤 → Mike (Maintenance)   │  ← Assigned to (Caption)
│ 🕐 2 hours ago            │  ← Time (Caption, --text-tertiary)
└───────────────────────────┘
```

| Property               | Specification                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Card width**         | Fills column (equal-width columns, min 280px)                                                                       |
| **Priority indicator** | Left 3px border: High `--status-error`, Medium `--status-warning`, Low `--status-info`, None `--border-subtle`      |
| **Drag-and-drop**      | PM/admin can drag cards between columns to change status. Animate: card lifts (shadow), column highlights on hover. |
| **Column count badge** | Shows count in header. Updates in real-time.                                                                        |
| **Overflow**           | Each column scrolls independently. Max visible: 8 cards, then scroll.                                               |
| **Empty column**       | Dashed border placeholder: "No requests [status]. Great job!"                                                       |

#### List View (Default for Residents)

Standard table following Section 7.3 table rules:

| Column      | Width | Content                                     |
| ----------- | ----- | ------------------------------------------- |
| Priority    | 48px  | Color dot only (no text)                    |
| ID          | 80px  | `#SR-4521` monospace                        |
| Title       | flex  | Truncated at 1 line                         |
| Category    | 120px | Plumbing, Electrical, HVAC, General, etc.   |
| Unit        | 80px  | Unit number                                 |
| Status      | 100px | Status badge pill                           |
| Assigned To | 140px | Name or "Unassigned"                        |
| Created     | 120px | Relative time ("2h ago") or date if >7 days |
| Actions     | 48px  | `⋯` menu                                    |

#### Create Service Request Modal (Medium — 560px)

| Order | Field                     | Type                                      | Notes                                                                          |
| ----- | ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| 1     | Title \*                  | Text input                                | Max 100 chars                                                                  |
| 2     | Category \*               | Dropdown                                  | Plumbing, Electrical, HVAC, Pest Control, Noise, Parking, Common Area, General |
| 3     | Priority \*               | Segmented control                         | Low / Medium / High — color-coded segments                                     |
| 4     | Unit \*                   | Dropdown (admin) / Auto-filled (resident) | Searchable for admin                                                           |
| 5     | Description \*            | Textarea                                  | Auto-resize, max 1000 chars                                                    |
| 6     | Attachments               | File upload zone                          | Max 4 files, 5MB each. Drag-drop or click. Shows thumbnails.                   |
| 7     | Suite entry authorization | Toggle                                    | "I authorize maintenance to enter my suite"                                    |
| 8     | Assign to (admin only)    | Dropdown                                  | Staff list. Optional — can assign later.                                       |

#### Ticket Detail View (Full-Sheet Modal — 90vw)

```
┌──────────────────────────────────────────────────────────────────┐
│  #SR-4521  Leaking faucet in kitchen                          ✕  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────┐  ┌────────────────────────┐ │
│  │  DETAILS                       │  │  ACTIVITY TIMELINE     │ │
│  │                                │  │                        │ │
│  │  Status:  ● In Progress        │  │  Mar 13, 10:45 AM      │ │
│  │  Priority: 🔴 High             │  │  Mike assigned himself │ │
│  │  Category: Plumbing            │  │                        │ │
│  │  Unit: 1205 — Sarah Chen       │  │  Mar 13, 10:30 AM      │ │
│  │  Assigned: Mike (Maintenance)  │  │  Status → In Progress  │ │
│  │  Created: Mar 13, 8:15 AM      │  │                        │ │
│  │  Entry Auth: ✓ Yes             │  │  Mar 13, 8:15 AM       │ │
│  │                                │  │  Sarah created request │ │
│  │  DESCRIPTION                   │  │  "Faucet is dripping   │ │
│  │  Kitchen faucet has been       │  │  constantly..."        │ │
│  │  dripping for 2 days...        │  │                        │ │
│  │                                │  │  ┌──────────────────┐  │ │
│  │  ATTACHMENTS                   │  │  │ Add comment...   │  │ │
│  │  📷 photo1.jpg  📷 photo2.jpg  │  │  │              Send│  │ │
│  │                                │  │  └──────────────────┘  │ │
│  └────────────────────────────────┘  └────────────────────────┘ │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Update   │  │ Assign   │  │ Close    │  │ Delete       │    │
│  │ Status ▾ │  │ To ▾     │  │ Request  │  │ (admin only) │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

- **Left panel (60%)**: Static details + description + attachments (clickable thumbnails for lightbox)
- **Right panel (40%)**: Activity timeline (all status changes, comments, assignments) + comment input at bottom
- **Timeline entries**: Timestamp (Caption, `--text-tertiary`) + action description + actor name. System actions in `--text-secondary`, user comments in `--text-primary`.

---

### 19.4 Package Management

**Layout**: Tab-based — **Pending Release** (default) | **Released** | **All Packages**

Primary user: security guard at front desk. Designed for speed — **large touch targets, minimal clicks to release**.

#### Package List View

```
┌──────────────────────────────────────────────────────────────────────┐
│  Packages                + Check In       🔍 Search    📊 12 pending │
│                                                                      │
│  [ ■ Pending ]  [ Released ]  [ All ]          Date: Today ▾        │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  ┌──────┬───────────┬──────────┬────────────┬──────────┬──────────┐ │
│  │ ☐    │ Unit      │ Carrier  │ Received   │ Status   │ Actions  │ │
│  ├──────┼───────────┼──────────┼────────────┼──────────┼──────────┤ │
│  │ ☐    │ 1205      │ FedEx    │ Today 9:15 │ ● Pending│ Release  │ │
│  │ ☐    │ 807       │ Amazon   │ Today 8:42 │ ● Pending│ Release  │ │
│  │ ☐    │ 1304      │ UPS      │ Ystrdy 4pm │ ● Pending│ Release  │ │
│  │ ☐    │ 502       │ Canada P │ Ystrdy 2pm │ ● Pending│ Release  │ │
│  └──────┴───────────┴──────────┴────────────┴──────────┴──────────┘ │
│                                                                      │
│  ☑ 2 selected                          [ Release Selected ]         │
└──────────────────────────────────────────────────────────────────────┘
```

| Feature            | Specification                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Release button** | Ghost button per row. Click → opens release confirmation. On the floating action bar: batch release for selected. |
| **Batch select**   | Checkboxes on left. Select multiple → floating action bar at bottom with "Release Selected (N)" primary button.   |
| **Search**         | Instant filter by unit number, carrier name, or tracking number.                                                  |
| **Pending count**  | Badge in header showing unreleased count. Updates in real-time.                                                   |
| **Row highlight**  | Packages older than 48h: subtle `--status-warning-bg` background to draw attention.                               |

#### Check-In Modal (Medium — 560px)

Optimized for speed. Guard should complete in <15 seconds.

| Order | Field        | Type                | Notes                                                                                         |
| ----- | ------------ | ------------------- | --------------------------------------------------------------------------------------------- |
| 1     | Unit \*      | Searchable dropdown | Type unit number — auto-completes. Shows resident name. Large text (Title 3).                 |
| 2     | Carrier \*   | Preset buttons      | `[Amazon] [FedEx] [UPS] [Canada Post] [Purolator] [Other]` — tap to select, one row of pills. |
| 3     | Tracking #   | Text input          | Optional. Monospace font. Paste-friendly.                                                     |
| 4     | Photo        | Camera capture      | One-tap camera button. Shows preview thumbnail. Optional.                                     |
| 5     | Notes        | Text input          | Single line, optional. "Fragile", "Large", etc.                                               |
| —     | **Check In** | Primary button      | 48px height. Immediately saves + shows success toast + resets form for next package.          |

**Key UX**: After check-in, form **does NOT close** — it resets for the next package. Guard is checking in 20+ packages at a time. "Done" ghost link in top-right to close when finished.

#### Release Flow

Clicking "Release" opens a **small confirmation modal (400px)**:

```
┌──────────────────────────────────┐
│  Release Package              ✕  │
│                                  │
│  📦 FedEx — Unit 1205            │
│  Checked in: Today 9:15 AM       │
│                                  │
│  Released to *                    │
│  ┌──────────────────────────┐    │
│  │ Sarah Chen (Unit Owner)  │    │
│  └──────────────────────────┘    │
│                                  │
│  ID Type                         │
│  [Driver's License] [Other] [None]│
│                                  │
│  Signature (optional)            │
│  ┌──────────────────────────┐    │
│  │    ✍ Tap to sign         │    │
│  └──────────────────────────┘    │
│                                  │
│            Cancel    Release  ▶  │
└──────────────────────────────────┘
```

- **Released to**: Auto-filled with unit residents. Dropdown to pick specific person.
- **Notification**: On release, resident receives push notification + email: "Your package has been released."

---

### 19.5 Unit File & Resident Profile

**Layout**: Master-detail — Unit header at top, tabbed content below.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◀ Back to Units                                                     │
│                                                                      │
│  Unit 1205                                          Edit Unit  ⋯    │
│  Bond Tower • Floor 12 • 2BR + Den • Owner-Occupied                  │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  [ ■ Residents ]  [ Vehicles ]  [ Packages ]  [ Requests ]  [ Logs ]│
│                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────┐ │
│  │  PRIMARY RESIDENT                │  │  QUICK STATS             │ │
│  │                                  │  │                          │ │
│  │  👤 Sarah Chen                   │  │  📦 3 pending packages   │ │
│  │  Role: Owner                     │  │  🔧 1 open request      │ │
│  │  📧 sarah.chen@email.com         │  │  📅 2 upcoming bookings │ │
│  │  📱 416-555-0123                 │  │  🚗 2 vehicles          │ │
│  │  Since: Jan 15, 2023             │  │  🔑 0 keys checked out  │ │
│  │                                  │  │                          │ │
│  │  ADDITIONAL OCCUPANTS            │  └──────────────────────────┘ │
│  │  👤 James Chen — Spouse          │                               │
│  │  👤 Lily Chen — Child            │  ┌──────────────────────────┐ │
│  │                                  │  │  RECENT ACTIVITY         │ │
│  │  ┌─────────────────────────┐     │  │  • Package released 2h   │ │
│  │  │ + Add Resident          │     │  │  • Booking confirmed 1d  │ │
│  │  └─────────────────────────┘     │  │  • Request #4519 closed  │ │
│  └──────────────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

#### Unit Header

| Element                | Specification                                                   |
| ---------------------- | --------------------------------------------------------------- |
| **Unit number**        | Display size (34px). Bold.                                      |
| **Building + details** | Body size, `--text-secondary`. Floor, layout, occupancy status. |
| **Edit button**        | Secondary button. Opens edit modal for unit details.            |
| **More menu (⋯)**      | Print unit report, Export PDF, View history.                    |

#### Tab Content

| Tab           | Content                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Residents** | Cards for each resident. Name, role, contact info, move-in date. + Add Resident button. Quick stats card. Recent activity timeline.              |
| **Vehicles**  | Table: Make, Model, Color, License Plate, Parking Spot. + Add Vehicle. License plates in monospace.                                              |
| **Packages**  | Filtered package list (same table as 19.4) showing only this unit's packages.                                                                    |
| **Requests**  | Filtered service request list showing only this unit's requests.                                                                                 |
| **Logs**      | Activity timeline: all events related to this unit (packages, requests, visitor parking, key checkouts, announcements sent). Filterable by type. |

---

### 19.6 Document Library

**Layout**: Two-panel — Folder tree (left) + File list (right).

```
┌────────────────┬──────────────────────────────────────────────────┐
│  FOLDERS       │  Documents > Rules & Regulations                 │
│                │                                                  │
│  📁 Documents  │  ┌──────┬──────────────────┬────────┬──────────┐│
│    📁 Rules    │  │ Type │ Name             │ Size   │ Actions  ││
│    📁 Forms    │  ├──────┼──────────────────┼────────┼──────────┤│
│    📁 Minutes  │  │ 📄   │ Noise Policy.pdf │ 245 KB │ ⬇  ⋯    ││
│    📁 Notices  │  │ 📄   │ Pet Rules.pdf    │ 180 KB │ ⬇  ⋯    ││
│    📁 Newsltrs │  │ 📄   │ Move-in Guide.pdf│ 1.2 MB │ ⬇  ⋯    ││
│  📁 Templates  │  └──────┴──────────────────┴────────┴──────────┘│
│  📁 Expert Tips│                                                  │
│                │  ┌───────────────────────────────────────┐      │
│  + New Folder  │  │   Drop files here or click to upload  │      │
│                │  └───────────────────────────────────────┘      │
│  ────────────  │                                                  │
│  Storage       │                                                  │
│  ▓▓▓▓░░░ 2.4GB│                                                  │
│  of 10GB used  │                                                  │
└────────────────┴──────────────────────────────────────────────────┘
```

| Feature               | Specification                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Folder tree**       | Collapsible tree. Active folder: accent text + `--accent-subtle` background. Drag files between folders. |
| **File icons**        | By type: 📄 PDF, 📊 Excel, 📝 Doc, 🖼 Image. Consistent 20px size.                                       |
| **Download**          | Direct download icon per file. No page navigation.                                                       |
| **More menu (⋯)**     | Rename, Move to, Delete, Permissions, Preview.                                                           |
| **Upload zone**       | Dashed border, 80px height at bottom of file list. Drag-and-drop + click. Progress bar during upload.    |
| **Permissions**       | Modal with role group checkboxes (14 roles). Read / Read-Write toggles per group.                        |
| **Storage indicator** | Left panel bottom. Progress bar + text. Warning color >80% used.                                         |
| **Breadcrumb**        | Top of right panel: "Documents > Rules & Regulations". Clickable segments.                               |
| **Search**            | Search bar above file list. Filters across all folders. Results show folder path.                        |

---

### 19.7 Announcement Composer

**Layout**: Full-sheet modal (720px wide) with rich text editor.

```
┌──────────────────────────────────────────────────────────────────┐
│  Create Announcement                                          ✕  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  🚨 Emergency SMS    (toggle — shows only for admin/PM)          │
│                                                                  │
│  Title *                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Elevator maintenance March 15-17                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Recipients *                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ All Residents                                         ▾  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Content *                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ B  I  U  H1 H2  • ─  🔗  📷  ≡                          │   │
│  │──────────────────────────────────────────────────────────│   │
│  │                                                          │   │
│  │ The elevators in Tower A will be undergoing scheduled    │   │
│  │ maintenance from March 15-17...                          │   │
│  │                                                          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ 📎 Attachments   │  │ 📅 Schedule Send  │                     │
│  │ 0 files (max 4)  │  │ Send immediately  │                     │
│  └──────────────────┘  └──────────────────┘                     │
│                                                                  │
│  Options                                                    ▾    │
│  ☐ Save copy to Library   ☐ Never expires   ☐ No-reply email    │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│  Preview                                        Cancel   Send ▶  │
└──────────────────────────────────────────────────────────────────┘
```

| Feature                 | Specification                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rich text toolbar**   | Bold, Italic, Underline, H1, H2, Bullet list, Horizontal rule, Link, Image embed, Code block. Sticky on scroll.                                                                       |
| **Recipients dropdown** | Options: All Residents (incl offsite), All Residents (excl offsite), All Owners, Tenants Only, Board Members, Select Units (multi-select with search), Custom Groups, Groups + Units. |
| **Attachments**         | Max 4 files, 5MB each. Thumbnails with remove button.                                                                                                                                 |
| **Schedule**            | Toggle opens datetime picker. Default: "Send immediately."                                                                                                                            |
| **Preview button**      | Ghost button, bottom-left. Opens a read-only preview in a new modal showing exactly how the announcement will appear to residents.                                                    |
| **Emergency SMS**       | Red-accented toggle. When on: sends SMS to all residents. Requires confirmation dialog: "This will send SMS to N phone numbers."                                                      |
| **Options section**     | Collapsed by default (accordion). Expands to show secondary checkboxes.                                                                                                               |

---

### 19.8 Reports & Analytics

**Layout**: KPI overview at top + Report category list below.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Reports                              Date Range: Last 30 Days  ▾   │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Owners   │  │ Tenants  │  │ Offsite  │  │ Board    │           │
│  │ 235      │  │ 1,298    │  │ 454      │  │ Members  │           │
│  │          │  │          │  │          │  │ 12       │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐   │
│  │ Resident Breakdown     ◕   │  │ Service Requests Trend  📈  │   │
│  │ [Donut chart]               │  │ [Line chart - 30 days]      │   │
│  └─────────────────────────────┘  └─────────────────────────────┘   │
│                                                                      │
│  REPORT CATEGORIES                                                   │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  📊 Amenity Reports                                            ▾    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Report Name                          Excel        PDF        │   │
│  │ Amenity Bookings Summary             [Generate]  [Generate]  │   │
│  │ Amenity Usage by Unit                [Generate]  [Generate]  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  📢 Announcement Reports                                       ▾    │
│  🔧 Service Request Reports                                    ▾    │
│  🔒 Security Reports                                           ▾    │
│  🏠 Unit and User Reports                                      ▾    │
│  📦 Package Reports                                            ▾    │
└──────────────────────────────────────────────────────────────────────┘
```

| Feature               | Specification                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **KPI cards**         | Top row. Follow Section 7.1 Stat/KPI Card style. Resident breakdown numbers.                                                              |
| **Charts**            | Donut for breakdown, Line for trends. Follow Section 16 data visualization rules.                                                         |
| **Report categories** | Accordion sections. Click to expand. Each report row has two generation buttons.                                                          |
| **Generate Excel**    | Secondary button with spreadsheet icon. Triggers download (with user confirmation per design system rules).                               |
| **Generate PDF**      | Secondary button with PDF icon. Opens PDF in new tab or triggers download.                                                                |
| **Date range**        | Global filter at top-right. Presets: Last 7 days, Last 30 days, Last 90 days, This year, Custom range. Applies to charts and report data. |

---

### 19.9 Survey Builder

**Layout**: Two views — **Survey List** (table) and **Survey Builder** (full-sheet modal).

#### Survey List

Standard table: Title, Status (Draft/Active/Closed), Responses count, Created date, Expiry date, Actions.

#### Survey Builder Modal (Full-Sheet — 90vw)

```
┌──────────────────────────────────────────────────────────────────┐
│  Create Survey                              Preview   Save Draft │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  Survey Title *                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Resident Satisfaction Survey 2026                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Expiry Date          Recipients                                 │
│  ┌──────────────┐    ┌──────────────────────────────────┐       │
│  │ Apr 15, 2026 │    │ All Residents                  ▾ │       │
│  └──────────────┘    └──────────────────────────────────┘       │
│                                                                  │
│  QUESTIONS                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  Q1. How satisfied are you with building maintenance?  │   │
│  │     Type: Rating (1-5 stars)                    ✏️  🗑   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  Q2. What improvements would you suggest?              │   │
│  │     Type: Free text                             ✏️  🗑   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ≡  Q3. Rate the following amenities                      │   │
│  │     Type: Multiple choice (matrix)              ✏️  🗑   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  + Add Question                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                            Cancel   Publish  ▶   │
└──────────────────────────────────────────────────────────────────┘
```

**Question Types**: Rating (1-5 stars), Multiple Choice (single), Multiple Choice (multi-select), Free Text, Yes/No, Matrix (rate multiple items on same scale).

**Drag handles (≡)**: Reorder questions via drag-and-drop.

**Edit question (✏️)**: Expands the question card inline to show editable fields (question text, type selector, options for multiple choice, required toggle).

**Survey Results View**: Bar charts per question. Response rate shown as progress ring. Export to Excel button.

---

### 19.10 Settings & Admin Panel

**Layout**: Left settings nav + Right content panel.

```
┌────────────────┬──────────────────────────────────────────────────┐
│  SETTINGS      │  User Management                                 │
│                │                                                  │
│  Building      │  + Create User            🔍 Search users        │
│  ■ Users       │                                                  │
│  Roles         │  ┌──────┬──────────┬─────────┬────────┬───────┐ │
│  Amenities     │  │ Name │ Unit     │ Role    │ Status │ ⋯     │ │
│  Announcements │  ├──────┼──────────┼─────────┼────────┼───────┤ │
│  Security      │  │ Sarah│ 1205     │ Owner   │●Active │ ⋯     │ │
│  Notifications │  │ Mike │ Staff    │ Maint.  │●Active │ ⋯     │ │
│  Integrations  │  │ John │ 807      │ Tenant  │●Inactive│ ⋯    │ │
│                │  └──────┴──────────┴─────────┴────────┴───────┘ │
│  ────────────  │                                                  │
│  Billing       │  Showing 1-25 of 1,987          ◀ 1 2 3 ▶       │
│  Audit Log     │                                                  │
└────────────────┴──────────────────────────────────────────────────┘
```

**Settings Categories**:

| Category          | Content                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Building**      | Building name, address, photo (for login page), timezone, contact info.                       |
| **Users**         | Full user CRUD table. Create sends email invitation. Bulk import via CSV.                     |
| **Roles**         | Role list with permission matrix. Toggles per module (View/Edit/Admin) per role.              |
| **Amenities**     | Amenity CRUD + rules engine (hours, max duration, deposits, booking limits).                  |
| **Announcements** | Default settings: expiry days, email templates, custom groups management.                     |
| **Security**      | Shift report config, parking rules, key management defaults.                                  |
| **Notifications** | Email/push notification templates. Per-event toggle (package arrived, request updated, etc.). |
| **Integrations**  | Third-party connections (if any). API keys management.                                        |
| **Billing**       | Subscription plan, payment history. Super admin only.                                         |
| **Audit Log**     | Searchable log of all admin actions with timestamp, user, action, details.                    |

**Role Permission Matrix**:

```
┌───────────────────┬──────────┬──────────┬──────────┐
│ Module            │ View     │ Edit     │ Admin    │
├───────────────────┼──────────┼──────────┼──────────┤
│ Dashboard         │ ◉        │ ○        │ ○        │
│ Amenities         │ ◉        │ ◉        │ ○        │
│ Service Requests  │ ◉        │ ◉        │ ◉        │
│ Packages          │ ◉        │ ◉        │ ○        │
│ Security          │ ○        │ ○        │ ○        │
│ ...               │          │          │          │
└───────────────────┴──────────┴──────────┴──────────┘
```

Radio buttons per cell. Changes save immediately (auto-save with toast confirmation).

---

### 19.11 Notification Center

**Notification Panel** (defined in Section 7.7) + **Full Notification Preferences Page** in Settings.

#### Notification Preferences

```
┌──────────────────────────────────────────────────────────────────┐
│  Notification Preferences                                        │
│                                                                  │
│  How would you like to be notified?                              │
│                                                                  │
│  ┌──────────────────────────────┬────────┬────────┬────────────┐│
│  │ Event                        │ In-App │ Email  │ Push (mob) ││
│  ├──────────────────────────────┼────────┼────────┼────────────┤│
│  │ Package received             │  ◉     │  ◉     │  ◉         ││
│  │ Package released             │  ◉     │  ○     │  ○         ││
│  │ Service request update       │  ◉     │  ◉     │  ◉         ││
│  │ New announcement             │  ◉     │  ◉     │  ○         ││
│  │ Amenity booking confirmed    │  ◉     │  ◉     │  ○         ││
│  │ Amenity booking reminder     │  ◉     │  ○     │  ◉         ││
│  │ Survey available             │  ◉     │  ◉     │  ○         ││
│  │ Emergency alert              │  ◉     │  ◉     │  ◉         ││
│  └──────────────────────────────┴────────┴────────┴────────────┘│
│                                                                  │
│  ◉ = On   ○ = Off   (toggle by clicking)                        │
│                                                                  │
│  Quiet Hours                                                     │
│  ┌────────────┐  to  ┌────────────┐                             │
│  │ 10:00 PM   │      │ 7:00 AM    │    ☑ Enabled                │
│  └────────────┘      └────────────┘                             │
│  (Emergency alerts always break through quiet hours)             │
│                                                                  │
│                                            Save Preferences  ▶   │
└──────────────────────────────────────────────────────────────────┘
```

- **In-App**: Always on for all events (cannot disable — greyed out toggle).
- **Email/Push**: User-controllable per event.
- **Emergency**: Always on for all channels (cannot disable). Noted in UI.
- **Quiet Hours**: Time range during which push notifications are suppressed (except emergency).

---

### 19.12 Events

**Layout**: Calendar view (reuses calendar component from 19.2) + Event cards.

The events calendar shares the same component as amenity booking but with different content:

| Difference from Amenity Booking | Specification                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **No booking flow**             | Click event → detail popover (view only for residents). No slot-click-to-book.                                                 |
| **Event blocks**                | Larger, can span multiple days. Show event title + time + attendee count.                                                      |
| **Color coding**                | By event type: Building events `#0071E3`, Board meetings `#AF52DE`, Social `#34C759`, Maintenance `#FF9500`.                   |
| **RSVP**                        | Detail popover has "Going / Not Going / Maybe" segmented control for residents.                                                |
| **Create event**                | Admin/PM only. Modal similar to announcement composer but with date/time, location, guard-required toggle, and group selector. |
| **Attendee list**               | Admin sees RSVP list in detail view. Avatar stack on event card (max 3 + "+N").                                                |

---

### 19.13 Marketplace / Online Store

**Layout**: Simple grid of product cards + Cart.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Marketplace                    🔍 Search         🛒 Cart (2)       │
│                                                                      │
│  [ All ]  [ Services ]  [ Rentals ]  [ Products ]                    │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 🖼           │  │ 🖼           │  │ 🖼           │              │
│  │              │  │              │  │              │              │
│  │ Parking Fob  │  │ Storage Unit │  │ Locker Key   │              │
│  │ $50.00       │  │ $75/month    │  │ $25.00       │              │
│  │ [Add to Cart]│  │ [Add to Cart]│  │ [Add to Cart]│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

- **Product card**: Image (1:1 ratio, `object-fit: cover`, 8px radius), Title (Headline), Price (Title 3, `--text-primary`), Action button.
- **Cart**: Slide-in panel from right (320px). Item list + quantities + total + "Place Order" button.
- **Order history**: Tab view — Place Order | My Orders | All Orders (admin).
- **Admin**: Can add/edit products, manage orders, view all orders.

---

### 19.15 Search

**Layout**: Integrated into the Command Palette (⌘K) as the primary search experience + dedicated `/search` page for advanced filtering.

The **Command Palette** (Section 6) handles 90% of search use cases — quick lookups of pages, units, residents, and actions. The dedicated search page is for filtered, multi-module deep search.

#### Dedicated Search Page (`/search`)

```
┌────────────────┬──────────────────────────────────────────────────┐
│  FILTERS       │  RESULTS                                         │
│                │                                                  │
│  Building      │  🔍 ┌──────────────────────────────────────┐    │
│  ☑ Bond Tower  │     │ "leaking"                         🔍  │    │
│  ☐ Maple Court │     └──────────────────────────────────────┘    │
│                │                                                  │
│  Search Mode   │  12 results for "leaking"                       │
│  ◉ Full Search │                                                  │
│  ○ Units/People│  ┌──────────────────────────────────────────┐   │
│                │  │ 🔧 Service Request #4521                  │   │
│  Content Types │  │    Leaking faucet in kitchen — Unit 1205  │   │
│  ☑ Service Req │  │    Open • High Priority • 2 hours ago     │   │
│  ☑ Logs        │  └──────────────────────────────────────────┘   │
│  ☑ Library     │  ┌──────────────────────────────────────────┐   │
│  ☑ Announcements│ │ 📢 Announcement                           │   │
│  ☑ Ads         │  │    Water leak protocol reminder            │   │
│  ☐ Incidents   │  │    Sent Mar 10 • 1,298 recipients         │   │
│                │  └──────────────────────────────────────────┘   │
│  Clear Filters │                                                  │
└────────────────┴──────────────────────────────────────────────────┘
```

| Feature                     | Specification                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Left filter panel**       | 240px width. Collapsible on tablet/mobile.                                                                       |
| **Building selector**       | Checkboxes. Multi-building search supported.                                                                     |
| **Search mode toggle**      | "Full Search" (default) searches all content. "Units/People" focuses on unit files and resident profiles.        |
| **Content type checkboxes** | Filter results by module. All checked by default. Unchecking hides those results instantly (client-side filter). |
| **Result cards**            | Module icon + title + excerpt + metadata (status, date, etc.). Clickable → navigates to the item.                |
| **Instant search**          | Debounced 300ms. Results update as you type. Skeleton loading for results area.                                  |
| **Empty state**             | "No results for '[query]'. Try broadening your filters."                                                         |
| **Keyboard nav**            | Arrow keys to navigate results, Enter to open, Escape to clear.                                                  |

---

### 19.16 Security Operations

**Layout**: Tabbed interface — **Visitor Parking** | **Key Checkout** | **Key Inventory** | **Parking Violations**

Primary users: security guards and front desk. Quick-create actions at top for speed.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Security & Concierge                                                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 🚗 + Visitor  │  │ 🔑 + Key     │  │ ⛔ + Violation│              │
│  │   Parking     │  │   Checkout   │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  [ ■ Visitor Parking ]  [ Key Checkout ]  [ Keys ]  [ Violations ]   │
│  ──────────────────────────────────────────────────────────────────  │
│  ...tab content...                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Quick-Create Action Buttons

Three large action buttons (Display icon size 48px, `--bg-secondary` background, 16px radius, 100px×80px) at the top. These are the most-used actions — always visible regardless of active tab.

| Button                   | Action                               |
| ------------------------ | ------------------------------------ |
| 🚗 **+ Visitor Parking** | Opens Create Visitor Parking modal   |
| 🔑 **+ Key Checkout**    | Opens Key Checkout modal             |
| ⛔ **+ Violation**       | Opens Create Parking Violation modal |

#### Tab 1: Visitor Parking

**Filter bar** (horizontal, above table):

| Filter          | Type                        | Specification                    |
| --------------- | --------------------------- | -------------------------------- |
| Plate Number    | Text input with search icon | Instant filter on keypress       |
| Building        | Dropdown                    | Default: current building        |
| Unit            | Dropdown                    | Filtered by selected building    |
| Date Range      | Start + End date pickers    | Default: last 14 days to +7 days |
| Include Deleted | Toggle                      | Default: off                     |
| Clear / Search  | Buttons                     | Secondary style                  |

**Table columns**: Start Time, End Time (override), Visitor Type, License Plate (monospace), Created By, Unit, Actions (Sign Out, View, Print, Edit, Delete).

**Create Visitor Parking Modal (Medium — 560px)**:

| Field           | Type                | Notes                                        |
| --------------- | ------------------- | -------------------------------------------- |
| Building \*     | Dropdown            | Default: current building                    |
| Unit \*         | Searchable dropdown | Shows resident name                          |
| Visitor Type \* | Segmented control   | Contractor, Delivery, Guest, Resident, Other |
| Guest Name      | Text input          | Optional                                     |
| Needs Parking   | Toggle              | Default: on                                  |
| Vehicle Photo   | Camera/upload       | Optional. One-tap capture.                   |
| Comments        | Textarea            | Optional, single line                        |
| **Save**        | Primary button      | Creates entry + success toast                |

#### Tab 2: Key Checkout

**Table columns**: Ref #, Key Number (monospace), Checkout Time, Checked Out To, Company, Signature (thumbnail), Check In (button/timestamp), Actions.

**Key Checkout Modal (Large — 720px)** — more fields, needs space:

| Field             | Type           | Notes                                               |
| ----------------- | -------------- | --------------------------------------------------- |
| Building \*       | Dropdown       |                                                     |
| Key \*            | Dropdown       | Only shows available (checked-in) keys              |
| Checked Out To \* | Text input     |                                                     |
| Company           | Text input     | Optional                                            |
| ID Type \*        | Dropdown       | Driver's License, Passport, Building ID, Other      |
| ID Number \*      | Text input     | Monospace                                           |
| Reason \*         | Text input     |                                                     |
| Signature \*      | Signature pad  | Canvas with Sign/Clear/Done controls. 200px height. |
| ID Photo (front)  | Camera capture | Optional                                            |
| ID Photo (back)   | Camera capture | Optional                                            |
| **Deliver Key**   | Primary button |                                                     |

#### Tab 3: Key Inventory

**Simple table**: Key #, Key Name, Status badge (Checked In = green, Checked Out = warning), Edit, Delete.

**Add Key Modal (Small — 400px)**: Building, Key Number, Key Name, Send button. "Bulk Add" toggle opens multi-line input mode.

#### Tab 4: Parking Violations

**Filter bar**: Plate Number, Date Range, Include Deleted toggle.

**Table columns**: Ref #, Ban Type (badge: Ban = red, Ticket = warning, Warning = info, Towed = error), License Plate (monospace), Issued By, Time, Actions.

**Create Violation Modal (Medium — 560px)**:

| Field            | Type              | Notes                                                         |
| ---------------- | ----------------- | ------------------------------------------------------------- |
| Building \*      | Dropdown          |                                                               |
| License Plate \* | Text input        | Uppercase auto-format. Monospace.                             |
| Type \*          | Segmented control | Ban / Ticket / Warning / Vehicle Towed — color-coded segments |
| Auto-lift Date   | Date picker       | Optional. When the restriction automatically expires.         |
| **Save**         | Primary button    |                                                               |

Warning banner at top of modal: "This action records a violation against a license plate." — `--status-warning-bg` background.

---

### 19.17 Emergency Procedures

**Layout**: Full-screen modal overlay — not a page. Accessible from sidebar on any page.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  🚨 Emergency Procedures                                     ✕  │
│     Bond Tower                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  FIRE EMERGENCY                                          │   │
│  │  1. Pull the nearest fire alarm                          │   │
│  │  2. Call 911                                             │   │
│  │  3. Evacuate via stairwell — do NOT use elevators        │   │
│  │  4. Proceed to assembly point at [location]              │   │
│  │                                                          │   │
│  │  MEDICAL EMERGENCY                                       │   │
│  │  1. Call 911                                             │   │
│  │  2. Contact concierge at ext. 100                        │   │
│  │  3. AED located at: Lobby, Floor 12, Floor 24            │   │
│  │                                                          │   │
│  │  FLOOD / WATER LEAK                                      │   │
│  │  1. Turn off water at main valve (under kitchen sink)    │   │
│  │  2. Contact concierge immediately                        │   │
│  │  3. Do NOT use electrical appliances near water           │   │
│  │                                                          │   │
│  │  BUILDING CONTACTS                                       │   │
│  │  Concierge: 416-555-0100                                 │   │
│  │  Property Manager: 416-555-0200                          │   │
│  │  Non-emergency Police: 416-808-2222                      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                    [ Print ]     │
└──────────────────────────────────────────────────────────────────┘
```

| Feature          | Specification                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**      | Sidebar item with 🚨 icon. Always visible to all roles. Red icon color (`--status-error`).                                        |
| **Modal size**   | Large (720px). Scrollable content area.                                                                                           |
| **Content**      | Rich text — configured by building admin in Settings. Supports headings, lists, bold, links, phone numbers (clickable on mobile). |
| **Backdrop**     | Slightly darker than standard modals: `rgba(0, 0, 0, 0.5)`. Conveys urgency.                                                      |
| **Print button** | Bottom-right. Opens browser print dialog with print-optimized CSS.                                                                |
| **Empty state**  | If no procedures configured: "Emergency procedures have not been set up for this building. Contact your property manager."        |
| **Admin edit**   | Admin/PM sees an "Edit" button in the modal header → opens rich text editor inline to update procedures.                          |

---

### 19.18 Advertisements (Classifieds)

**Layout**: Card grid with moderation workflow.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Classifieds               + Post Ad     Pending Review (3)         │
│                                                                      │
│  [ All ]  [ Approved ]  [ My Posts ]        🔍 Search               │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ 🖼               │  │ 🖼               │  │ 🖼               │  │
│  │                  │  │                  │  │                  │  │
│  │ Moving Sale      │  │ Dog Walker       │  │ Piano Lessons    │  │
│  │ Furniture & more │  │ Available        │  │ Experienced      │  │
│  │                  │  │                  │  │ teacher          │  │
│  │ $250  • Unit 1205│  │ Free • Unit 807  │  │ $40/hr • U. 502 │  │
│  │ ● Approved       │  │ ● Approved       │  │ ● Pending        │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Ad Card**:

- Image (16:9 ratio, placeholder if no image), Title (Headline), Description excerpt (Body, 2 lines max), Price (Title 3), Unit + Status badge.
- Click → detail view (inline panel or modal).

**Create Ad Form (Medium — 560px modal)**:

| Field             | Type           | Notes                                                    |
| ----------------- | -------------- | -------------------------------------------------------- |
| Building \*       | Dropdown       |                                                          |
| Category \*       | Dropdown       | For Sale, Services, Wanted, Free, Other                  |
| Title \*          | Text input     | Max 80 chars                                             |
| Description \*    | Textarea       | Max 500 chars                                            |
| Attachments       | Upload zone    | Max 4 files. Image thumbnails.                           |
| Price             | Text input     | Optional. Helper: "Enter price, 'Free', or 'Contact me'" |
| Terms checkbox \* | Checkbox       | "I agree to the community posting guidelines"            |
| **Post**          | Primary button |                                                          |

**Approval notice**: Info bar (`--status-info-bg`): "Your post will be reviewed by property management within 2 business days."

**Admin Approval Queue** ("Pending Review" button):

| Feature            | Specification                                                          |
| ------------------ | ---------------------------------------------------------------------- |
| **Badge count**    | Shows pending count. Only visible to admin/PM.                         |
| **Modal**          | Table: Approve (checkbox), Title, Category, Author, Unit, Price, Date. |
| **Approve action** | Check ads → "Approve Selected" button. Bulk approve supported.         |
| **Reject**         | Per-row action in `⋯` menu. Opens reason textarea. Notifies author.    |

---

### 19.19 Contractors Directory

**Layout**: Simple card list — read-only for residents, editable by admin.

```
┌──────────────────────────────────────────────────────────────────┐
│  Building Contractors                                    + Add   │
│  Bond Tower                         🔍 Filter by service type   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  LOCKSMITH                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔒  Citywide Locksmith                                   │   │
│  │     📞 905-264-4401                              ⋯       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  PLUMBING                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔧  ABC Plumbing Services                                │   │
│  │     📞 416-555-0300                              ⋯       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔧  Emergency Plumbing 24/7                              │   │
│  │     📞 416-555-0400                              ⋯       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  HVAC                                                            │
│  ...                                                             │
│                                                                  │
│  APPLIANCE REPAIR                                                │
│  ...                                                             │
└──────────────────────────────────────────────────────────────────┘
```

| Feature             | Specification                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Grouping**        | Contractors grouped by service category. Overline headers (uppercase, `--text-secondary`).                                      |
| **Contractor card** | Icon (by category) + Company name (Headline) + Phone number (Body, clickable `tel:` link on mobile). Minimal — no extra chrome. |
| **Search/filter**   | Dropdown or segmented control to filter by service type. Or "All" to show everything.                                           |
| **Phone click**     | On mobile: taps to call. On desktop: shows copy-to-clipboard tooltip.                                                           |
| **Admin actions**   | `⋯` menu per card: Edit, Delete. "+ Add" button in header opens modal (Company Name, Phone, Service Category, Notes).           |
| **Resident view**   | Read-only. No `⋯` menus, no "+ Add" button. Just the directory.                                                                 |
| **Empty state**     | "No contractors have been added for this building yet. Contact your property manager."                                          |

---

### 19.20 Cross-Reference: Dashboard & Top Bar

The following features are fully specified elsewhere in this document but are listed here for completeness:

| Feature                                                                    | Aquarius Doc        | Design System Section                                                                                            |
| -------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Dashboard** (role-based layouts, KPI cards, charts)                      | `dashboard.md`      | **Section 8** — Three role-specific layouts: PM command center, Resident simple view, Security guard action view |
| **Top Navigation Bar** (search, notifications, profile, building switcher) | `top-navigation.md` | **Section 6** — Top Bar / Header with command palette, notification bell, user avatar flyout                     |
| **Create User**                                                            | `top-navigation.md` | **Section 19.10** — Settings & Admin Panel → Users tab                                                           |
| **Create Unit**                                                            | `top-navigation.md` | **Section 19.10** — Settings & Admin Panel → Building tab (unit management)                                      |
| **Logs**                                                                   | `top-navigation.md` | **Section 19.10** — Settings & Admin Panel → Audit Log tab                                                       |
| **Packages**                                                               | `top-navigation.md` | **Section 19.4** — Package Management (dedicated page)                                                           |

---

### 19.14 Mobile Responsive — Global Rules

Beyond the per-page responsive specs above, these rules apply globally:

#### Bottom Navigation Bar (Mobile <768px)

Replaces the sidebar entirely. Fixed at bottom, 56px height.

```
┌────────────────────────────────────────┐
│                                        │
│   🏠        📦        ➕        🔔    ☰  │
│  Home    Packages  Action   Alerts  More│
│                                        │
└────────────────────────────────────────┘
```

| Item        | Role: Resident | Role: Security Guard | Role: PM/Admin |
| ----------- | :------------: | :------------------: | :------------: |
| Tab 1       |    🏠 Home     |       🏠 Home        |    🏠 Home     |
| Tab 2       |  📅 Bookings   |     📦 Packages      |  📋 Requests   |
| Tab 3 (CTA) |   ➕ Request   |     ➕ Check In      |   ➕ Create    |
| Tab 4       |   🔔 Alerts    |      🔔 Alerts       |   🔔 Alerts    |
| Tab 5       |    ☰ More     |       ☰ More        |    ☰ More     |

- **Center CTA (➕)** is elevated (floating, 56×56px circle, accent background). Changes per role.
- **Active tab**: Accent color icon + label. Inactive: `--text-tertiary`.
- **"More" menu**: Opens full sidebar as bottom sheet (slides up 70vh).

#### Mobile Table Adaptation

Tables on mobile transform into **card lists**:

```
Desktop table row:
│ Unit 1205 │ Sarah Chen │ Owner │ Active │ ⋯ │

Mobile card:
┌──────────────────────────────┐
│  Unit 1205           ● Active │
│  Sarah Chen • Owner           │
│                          ⋯    │
└──────────────────────────────┘
```

- Each row becomes a card with 16px padding.
- Primary info (unit, name) prominent. Secondary info (role, status) smaller.
- Actions via `⋯` or swipe gestures (swipe left → action buttons slide in).

#### Mobile Forms

- All inputs stack full-width.
- Modals become **full-screen sheets** (slide up from bottom, 100vh with top safe area).
- Buttons become full-width at bottom (sticky footer).
- File upload: direct camera access button alongside file picker.

---

## 20. Detailed Feature Documentation (Appendix)

The following standalone documentation files provide exhaustive field-level specifications captured from the reference platform (Aquarius/ICON). These supplement the design specs in Section 19 with real-world data models, form fields, validation rules, and workflow details.

### 20.1 Documentation Index

| File                                       | Section 19 Reference | Content                                                                                        |
| ------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`dashboard.md`](dashboard.md)             | 19.20                | Dashboard layout, stats cards, quick actions, recent activity tables                           |
| [`unit-file.md`](unit-file.md)             | 19.5                 | Unit file directory, resident profiles, unit details                                           |
| [`amenities.md`](amenities.md)             | 19.2                 | Amenity booking cards, availability calendar, reservation flow                                 |
| [`security-menu.md`](security-menu.md)     | 19.16                | Visitor parking, key checkout, key inventory, parking violations                               |
| [`announcement.md`](announcement.md)       | 19.7                 | Announcement creation, scheduling, multi-building distribution                                 |
| [`advertisement.md`](advertisement.md)     | 19.18                | Classified ads, approval workflow, category management                                         |
| [`maintenance.md`](maintenance.md)         | 19.3                 | Service request tickets, status tracking, assignment                                           |
| [`library.md`](library.md)                 | 19.6                 | Document library, file management, category organization                                       |
| [`store.md`](store.md)                     | 19.13                | Online store, product catalog, ordering system                                                 |
| [`events.md`](events.md)                   | 19.12                | Event creation, calendar, RSVP management                                                      |
| [`reports.md`](reports.md)                 | 19.8                 | Report generation, export options, analytics                                                   |
| [`search.md`](search.md)                   | 19.15                | Global search, filters, results display                                                        |
| [`survey.md`](survey.md)                   | 19.9                 | Survey builder, question types, response collection                                            |
| [`emergency.md`](emergency.md)             | 19.17                | Emergency contact info, assistance requirements                                                |
| [`contractors.md`](contractors.md)         | 19.19                | Contractor directory, service categories                                                       |
| [`top-navigation.md`](top-navigation.md)   | 19.20                | Top nav bar, profile dropdown, global search                                                   |
| [`logs.md`](logs.md)                       | 19.16                | **6 log types**: General, Incident, Fire, Noise, Inspection, Bulletin — complete form specs    |
| [`settings.md`](settings.md)               | 19.10                | **8 settings tabs**: General, Parking, Login, Payment, Amenity, Groups, Keys, Contractors      |
| [`packages.md`](packages.md)               | 19.4                 | Package receive/release workflow, parcel type management, search filters                       |
| [`user-profile.md`](user-profile.md)       | 19.5                 | **6 profile tabs**: User, Emergency Contacts, Notifications, Vehicles/Parking, Pets, Documents |
| [`user-management.md`](user-management.md) | 19.10                | User management menu, welcome email system                                                     |
| [`create-unit.md`](create-unit.md)         | 19.10                | Unit creation form — FOB/key/buzzer/parking/locker fields                                      |
| [`preferences.md`](preferences.md)         | 19.11                | **10 notification categories** with per-user toggle controls                                   |
| [`url-map.md`](url-map.md)                 | —                    | Complete URL routing map across all modules                                                    |

### 20.2 Key Data Points for Concierge Design

These critical details from the reference platform should inform our design decisions:

#### Role System (18 Groups, 4 Types)

- **admin** (1): Full system access
- **staff** (5): Property Manager, Superintendent, Supervisor, Security Head Office, Security Guard
- **tenant** (4): Family member - Spouse, Family Member - Child, Other Occupant, Tenant
- **owner** (8): Owner, Family member - Spouse, Family Member - Child, Family Member - Other, Other Occupant, Offsite Owner, Other Group, Board Member

#### Log System Complexity

- **Fire Log** is the most complex form: 10+ timestamp fields, 3 checklists (fire preparation, elevator response, device reset), 7+ device types to reset
- **Noise Log** has 14 complaint categories and 4 investigation assessment fields
- **General Log** supports rich text editing (WYSIWYG) and multi-building posting

#### Package Lifecycle

- Receive → Store (with parcel type + storage spot) → Release → 21-day history
- 11 configurable parcel type categories (size + color based)
- Perishable item flagging
- Bulk recording support

#### Settings Depth

- 8 configuration tabs per building
- 6 different email notification "from" addresses
- 4 auto-CC email lists (per log type)
- 9 role-based parking limit notifications
- 7 overnight parking limit types (per plate/unit, weekly/monthly/yearly + consecutive)

#### User Profile Depth

- 6 tabs of user data
- Up to 3 vehicles per user (plate, color, model each)
- Up to 6 FOB/Remote/Key entries per unit
- 2 buzzer codes, 2 garage clickers, 1 key tag per unit
- Parcel waiver tracking with signatures
- 3 legal document types (POA, Lease, Insurance)

### 20.3 Anticipated Behaviors & Deduced Workflows

These workflows were not directly observed but are confidently deduced from the complete data model, UI patterns, and cross-referencing multiple pages of the reference platform.

#### Package Release Flow

1. Staff clicks Release icon on a Non-Released package row
2. System prompts for confirmation (resident identity verification)
3. Package status transitions: Non-Released → Released
4. `ReleaseTime` populated with current timestamp
5. `Released By` populated with staff username
6. Row moves from Non-Released table to Released Packages section
7. Resident receives package pickup notification email (unless "Emails Declined" is on — but package notices are exempt from the opt-out)
8. Released package visible for 21 days, then archived

#### Group Permission Editing

1. Admin clicks Edit icon on a group row in Settings > Groups tab
2. Permission matrix modal opens with checkboxes per feature module
3. Modules likely include: Dashboard access, Unit File access, Amenity management, Log creation (per type), Package management, Maintenance tickets, Settings access, User management, Report generation
4. Permissions are building-scoped — a group's permissions apply within the assigned building
5. Custom groups can be created beyond the 18 defaults

#### Resident Onboarding Workflow

1. Admin creates unit via Create Unit form (`/unit`) — assigns FOBs, buzzer codes, parking, locker
2. Admin creates user via Create User (`/create-user`) — assigns to unit and user group
3. Admin sends Welcome Email from User Management (`/manage-users`) or individual profile
4. Welcome email uses template configured in Settings > Login Instructions tab
5. Resident receives email with login credentials and building information
6. Resident logs in and completes profile (emergency contacts, vehicles, pets, documents)
7. Resident sets notification preferences at `/preferences`

#### Parking Violation Lifecycle

1. Security guard observes violation (unauthorized parking, expired visitor pass, etc.)
2. Creates parking violation entry (likely via Security Menu)
3. System checks overnight parking limits configured in Settings > Parking:
   - Per plate: 1-12/year based on type (plate only, plate + unit, weekly, monthly, yearly, consecutive)
   - Per unit: 1-12/year based on same type options
   - Day visit limits with configurable number
4. Notification sent to up to 9 configured roles (from Settings > Parking > Notification toggles)
5. Resident receives violation notification if "Parking violation" preference is enabled
6. Violation appears in Security Menu > Parking Violations table

#### Security Log Notification Chain

1. Staff creates a log (General, Incident, Fire, Noise, or Inspection)
2. Auto-CC emails sent to configured addresses (Settings > General > Auto-CC per log type)
3. Users with "New security report/log created" preference enabled receive notification
4. Log appears in the Logs Menu under the appropriate section
5. Fire Logs trigger highest-priority workflow (PA announcements, fire department coordination, device resets)

#### Amenity Booking Chain

1. Resident browses amenity cards on Amenities page (7 configured amenities)
2. Selects date/time on availability calendar
3. System checks booking rules (configured in Settings > Amenity or `/new-amenity`)
4. Booking created → confirmation email sent to resident
5. Users with "Amenity booked" preference enabled receive notification
6. On cancellation → users with "Amenity booking cancelled" preference get notified
7. Pre-booking inspection → Inspection Log (Pre type) created → linked to booking
8. Post-booking inspection → Inspection Log (Post type) created → linked to booking

#### Multi-Building Context

1. User with access to multiple buildings sees "Switch Building" in profile dropdown
2. All data (units, packages, logs, settings) is building-scoped
3. "Post in all buildings" checkbox on General Log allows cross-building announcements
4. Settings > General > Parking > all configurations are per-building
5. User Management shows users for the currently selected building
6. Package Management filters by current building but supports cross-building search

#### Email Notification Architecture

The system has 3 layers of email configuration:

1. **Global "from" addresses** (Settings > General): 6 different "from" emails for different notification types
2. **Auto-CC lists** (Settings > General): Automatic CC recipients per log type (comma-separated)
3. **Per-user preferences** (`/preferences`): 10 toggle categories for individual notification control

Priority: System-critical emails (package notices, booking warnings) always send regardless of "Emails Declined" preference.

---

### 20.4 Complete Documentation Inventory

| #   | File                 | Description                                     | Fields Documented |
| --- | -------------------- | ----------------------------------------------- | ----------------- |
| 1   | `dashboard.md`       | Dashboard stats, quick actions, activity tables | ~15               |
| 2   | `unit-file.md`       | Unit directory, resident profiles, unit details | ~25               |
| 3   | `amenities.md`       | Amenity cards, calendar, reservation flow       | ~20               |
| 4   | `security-menu.md`   | Visitor parking, key checkout, violations       | ~30               |
| 5   | `announcement.md`    | Announcement creation, scheduling               | ~10               |
| 6   | `advertisement.md`   | Classified ads, approval workflow               | ~12               |
| 7   | `maintenance.md`     | Service requests, status tracking               | ~15               |
| 8   | `library.md`         | Document library, file management               | ~8                |
| 9   | `store.md`           | Online store, product catalog                   | ~10               |
| 10  | `events.md`          | Event creation, calendar, RSVP                  | ~12               |
| 11  | `reports.md`         | Report generation, exports                      | ~8                |
| 12  | `search.md`          | Global search, filters                          | ~6                |
| 13  | `survey.md`          | Survey builder, question types                  | ~10               |
| 14  | `emergency.md`       | Emergency contacts, assistance                  | ~8                |
| 15  | `contractors.md`     | Contractor directory                            | ~6                |
| 16  | `top-navigation.md`  | Top nav, profile dropdown, search               | ~12               |
| 17  | `logs.md`            | 6 log types with complete form specs            | ~85               |
| 18  | `settings.md`        | 8 settings tabs with every field                | ~120              |
| 19  | `packages.md`        | Package lifecycle, parcel types, search         | ~30               |
| 20  | `user-profile.md`    | 6 profile tabs, vehicles, pets, docs            | ~40               |
| 21  | `user-management.md` | User management, welcome emails                 | ~5                |
| 22  | `create-unit.md`     | Unit creation with FOB/buzzer/parking           | ~20               |
| 23  | `preferences.md`     | 10 notification categories                      | ~10               |
| 24  | `url-map.md`         | Complete URL routing (41 routes)                | —                 |

**Total documented fields**: ~500+ across 24 files

---

_This document is the single source of truth for all design decisions. Every component, page, and feature must comply with these standards. Deviations require explicit approval and documentation._

---

## 21. Advanced Navigation Patterns (2026 Update)

> Added 2026-03-17 based on research of Linear, Vercel, Stripe, Notion, and Clerk.

### 21.1 Command Palette (Cmd+K)

The command palette is the universal access point for power users. It replaces multi-level dropdown menus and deep sidebar navigation for experienced staff.

```
┌──────────────────────────────────────────────────────────┐
│  🔍  Search pages, units, residents, actions...          │
│  ────────────────────────────────────────────────────── │
│  RECENT                                                   │
│  ↩ Unit 1205 — View Unit File                            │
│  ↩ Announcements — Create Announcement                   │
│                                                           │
│  PAGES                                                    │
│  📊 Dashboard                                             │
│  🔒 Security Console                                     │
│  📦 Package Management                                   │
│                                                           │
│  ACTIONS                                                  │
│  ➕ Create Announcement                                  │
│  ➕ Log Package                                          │
│  ➕ Book Amenity                                         │
│                                                           │
│  SUGGESTED (AI)                                          │
│  📦 3 packages awaiting release                          │
│  🔧 2 open service requests                              │
└──────────────────────────────────────────────────────────┘
```

**Implementation**:

- Trigger: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) or click search pill in top bar
- Container: 640px wide, max 480px tall, centered at 20vh from top
- Backdrop: `rgba(0, 0, 0, 0.5)` with `backdrop-filter: blur(8px)`
- Search input: 56px height, 17px font size, no border (bottom border only)
- Result items: 44px height, icon (20px) + title + description
- Navigation: Arrow keys up/down, Enter to select, Escape to close
- Categories: RECENT, PAGES, UNITS, RESIDENTS, ACTIONS, SETTINGS, SUGGESTED
- Fuzzy search with highlighting on matched characters
- Results update as user types (debounced 150ms)

```css
.command-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.command-palette-container {
  width: 640px;
  max-height: 480px;
  background: var(--bg-primary);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}
```

**Accessibility**: `role="dialog"`. Input: `role="combobox"`, `aria-expanded`. Results: `role="listbox"`. `aria-activedescendant` tracks focused item.

### 21.2 Keyboard Shortcuts System

Every common action has a keyboard shortcut. Press `?` to show the shortcut reference overlay.

| Category       | Shortcut     | Action                          |
| -------------- | ------------ | ------------------------------- |
| **Navigation** | `Cmd+K`      | Open command palette            |
|                | `[`          | Toggle sidebar collapse         |
|                | `G` then `D` | Go to Dashboard                 |
|                | `G` then `S` | Go to Security Console          |
|                | `G` then `P` | Go to Packages                  |
|                | `G` then `M` | Go to Maintenance               |
|                | `G` then `A` | Go to Amenities                 |
|                | `G` then `U` | Go to Units                     |
| **Actions**    | `C`          | Create new (context-aware)      |
|                | `E`          | Edit current record             |
|                | `Escape`     | Close modal / cancel action     |
| **Tables**     | `/`          | Focus search/filter input       |
|                | `J` / `K`    | Navigate rows down/up           |
|                | `Enter`      | Open selected row               |
|                | `Space`      | Toggle row selection            |
|                | `Cmd+A`      | Select all rows                 |
| **Calendar**   | `T`          | Jump to today                   |
|                | `←` / `→`    | Previous/next period            |
| **Help**       | `?`          | Show keyboard shortcuts overlay |

**Implementation**: Shortcut hints appear as subtle badges next to menu items and buttons for discoverability. The `?` overlay is a searchable grid organized by category.

### 21.3 Building Switcher

For users with access to multiple buildings, the building context is always visible and switchable.

```
┌──────────────────────────────┐
│  🏢  Bond Tower         ▾    │  ← Top of sidebar, below logo
└──────────────────────────────┘
        │
        ▼ (dropdown on click)
┌──────────────────────────────┐
│  🔍 Search buildings...      │
│  ──────────────────────────  │
│  🏢  Bond Tower          ●   │  ← Current (accent dot)
│      TSCC 2584 • Toronto     │
│  🏢  Maple Court              │
│      TSCC 3201 • Toronto     │
│  🏢  Lake View               │
│      TSCC 4100 • Mississauga │
│  ──────────────────────────  │
│  ⚙ Manage Buildings          │  ← Admin only
└──────────────────────────────┘
```

- Switching buildings recontextualizes the entire sidebar, dashboard, and data scope
- "Remember my choice" toggle persists selection per device
- Admin can see all buildings; residents see only their building(s)

---

## 22. Advanced Table Patterns (2026 Update)

> Added 2026-03-17 based on Stripe, Linear, and enterprise data table research.

### 22.1 Filter Bar

Horizontal bar above every data table. Shows primary filters inline, with "More Filters" for advanced options.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Status: [All ▾]  Type: [All ▾]  Date: [Last 7 days ▾]  🔍 Search   More Filters  │
└────────────────────────────────────────────────────────────────────────┘
```

**Rules**:

- Show the 3 most-used filters inline. Everything else behind "More Filters"
- Active filters show a badge count: "More Filters (2)"
- "Clear All" link appears when any filter is active
- Filter state persists in URL params (shareable, bookmarkable, back/forward compatible)
- `prefers-reduced-motion`: filter transitions are instant

```css
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}

.filter-bar__active-count {
  background: var(--accent);
  color: white;
  border-radius: 999px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### 22.2 Bulk Action Bar

When rows are selected via checkboxes, a floating action bar appears at the bottom of the viewport.

```
┌────────────────────────────────────────────────────────┐
│  ☑ 3 selected    [ Mark Resolved ]  [ Assign To ]  [ Export ]  [ Delete ]  │  ✕
└────────────────────────────────────────────────────────┘
```

**Design**:

- Background: `--text-primary` (#1D1D1F) — dark bar contrasts with white page
- Text: white
- Buttons: white text, semi-transparent white border
- Delete button: `--status-error` background
- Close (✕): clears all selections
- Border radius: 12px
- Box shadow: `0 4px 24px rgba(0, 0, 0, 0.16)`
- Position: fixed, bottom 24px, centered
- Animation: slide up + fade in (200ms ease-out)

### 22.3 Column Resizing

Users can drag column borders to resize. Widths persist in localStorage per user per table.

- Cursor changes to `col-resize` on column border hover
- Minimum column width: 80px
- Double-click column border: auto-fit to content width
- Reset option in table settings dropdown

### 22.4 Inline Editing

Double-click a table cell to edit in-place without opening a modal.

- Edit icon (pencil) appears on cell hover for editable fields
- Double-click or Enter enters edit mode
- Cell becomes an input/select matching the field type
- Enter to save, Escape to cancel
- Tab to save and move to next editable cell
- Saving shows brief spinner, then success check animation
- Only enabled for specific field types (text, select, date) — not for complex fields

### 22.5 Expandable Rows

Click expand arrow to reveal additional row detail without navigating away.

```
│  ☐  1205    Sarah Chen    Owner    Active     ⋯  │  ← Standard row
│  ▼  ────────────────────────────────────────── │  ← Expanded content below
│     Phone: 416-555-1234 • Email: sarah@...     │
│     Pets: 1 dog (Max) • Vehicles: 1 (Tesla)   │
│     Last activity: Package release, 2h ago     │
│  ──────────────────────────────────────────── │
```

- Expand/collapse chevron on left (before checkbox if both present)
- Only one row expanded at a time (configurable for multi-expand)
- Expanded area: `--bg-secondary` background, 16px padding
- Animation: height auto with 200ms ease transition

---

## 23. Advanced Form Patterns (2026 Update)

> Added 2026-03-17 based on Stripe, Clerk, Notion, and Apple HIG research.

### 23.1 Progressive Disclosure in Forms

Forms show only essential fields by default. Advanced options are hidden behind a toggle.

```
┌──────────────────────────────────────────────┐
│  Log Package                                  │
│                                               │
│  Courier *     [📦 Amazon ▾]                  │
│  Unit *        [🔍 Search unit...]            │
│  Storage       [Parcel Room ▾]                │
│  Notes         [                         ]    │
│                                               │
│  ▸ Show more options                          │  ← Click to reveal
│    ──────────────────────────────             │
│    Signature Required  [ ○ ]                  │
│    Photo Capture       [Take Photo]           │
│    Notification        [☑ Email  ☑ SMS]      │
│    Label Printing      [ ○ ]                  │
│                                               │
│              Cancel      Log Package  ▶       │
└──────────────────────────────────────────────┘
```

**Rules**:

- Default visible fields: those used >80% of the time
- Hidden fields: used <20% of the time or optional
- Toggle text: "Show more options" / "Show fewer options"
- Hidden section remembers state per user (localStorage)
- Validation applies to hidden fields too if they have values

### 23.2 Conditional Fields

Fields appear or disappear based on other field values.

| Trigger                           | Conditional Field                     |
| --------------------------------- | ------------------------------------- |
| Maintenance category = "Plumbing" | Show "Floor drain access?" toggle     |
| Event type = "Incident"           | Show emergency services table         |
| Booking has payment               | Show payment method and amount fields |
| User role = "Security Guard"      | Show shift assignment field           |
| Package courier = "Other"         | Show custom courier name text input   |

**Animation**: Conditional fields slide down with height animation (200ms ease). `prefers-reduced-motion`: instant show/hide.

### 23.3 Smart Defaults (AI-Powered)

Form fields pre-fill with AI-predicted values based on historical data.

```
┌──────────────────────────────────────────────┐
│  Courier *     [📦 Amazon ▾]   💡 Suggested  │  ← AI suggestion indicator
│               Based on package appearance     │
└──────────────────────────────────────────────┘
```

- AI suggestions appear with a lightbulb icon and "Suggested" label
- User can accept (default), change, or dismiss
- AI confidence threshold: only suggest when >80% confident
- If AI is unavailable, fields show standard empty/default state

### 23.4 Multi-Step Forms (Wizard Pattern)

For complex flows with 4+ sections, use a wizard with step indicator.

```
   (●1)━━━(●2)━━━( 3 )━━━( 4 )━━━( 5 )━━━( 6 )━━━( 7 )━━━( 8 )
  Building  Units  Amenities  Roles  Events  Notify  Billing  Review
```

**Rules**:

- Step indicator: circles connected by lines
  - Completed: accent fill + white check icon
  - Current: accent ring + number
  - Future: gray border + number
- Each step validates before allowing Next
- "Skip for now" link on optional steps (underline, text-secondary)
- Back button always available (except step 1)
- Draft auto-saves every 30 seconds
- Progress bar below step indicator (thin accent line)
- Mobile: step indicator collapses to "Step 2 of 8" text

---

## 24. Advanced Card Patterns (2026 Update)

> Added 2026-03-17 based on Stripe, Linear, and property management research.

### 24.1 Event Card (Security Console)

Color-coded card for the unified event stream.

```
┌─────────────────────────────────────────────────┐
│  ● Visitor                    10:45 AM          │  ← Type badge (color-coded) + time
│                                                  │
│  John Smith — visiting Unit 1205                │  ← Title (Headline weight)
│  Vehicle: Blue Tesla Model 3 • License: ABC 123 │  ← Details (Callout, text-secondary)
│                                                  │
│  Logged by Sarah Chen          #VIS-2026-00847  │  ← Author + reference (monospace)
│                                                  │
│  ● Active                     ⋯                 │  ← Status badge + actions menu
└─────────────────────────────────────────────────┘
```

**Design**:

- Left border: 3px solid in event type color
- Background: white (default), `--bg-secondary` on hover
- Border radius: 12px
- Padding: 16px
- Real-time new events: brief pulse animation on card border
- Batch mode: compact view with less spacing

### 24.2 KPI Card with Sparkline

```
┌─────────────────────────────┐
│  Unreleased Packages     ↗  │  ← Title (Callout, 14px) + clickable arrow
│                             │
│  47                         │  ← Value (Display, 34px, 700 weight)
│  ▃▅▇▅▆▇█                   │  ← Sparkline (48px tall, accent color)
│  +12% vs last week     ↑   │  ← Trend (Caption, success/error color)
└─────────────────────────────┘
```

**Rules**:

- One metric per card. No multi-metric cards.
- Trend color: depends on metric meaning (packages going up = red, resolution rate going up = green)
- Sparkline: 7-day data, 48px tall, no axes or labels
- Click navigates to the detailed module filtered to the relevant data
- Time period selector: Today / 7 days / 30 days / All time (dropdown in card header)

### 24.3 Summary List Card

```
┌─────────────────────────────────────────┐
│  Recent Service Requests         View all → │
│  ─────────────────────────────────────── │
│  🔧 #4521 Leaking faucet    ● Open     │  ← Icon + ref + title + status
│     Unit 1205 • 2h ago                   │  ← Unit + time (Caption)
│  🔧 #4520 Noise complaint   ● Hold     │
│     Unit 807 • 5h ago                    │
│  🔧 #4519 Parking issue     ● Open     │
│     Unit 302 • Yesterday                 │
│  ─────────────────────────────────────── │
│  + 15 more open requests                 │
└─────────────────────────────────────────┘
```

**Rules**:

- Show 3-5 most recent/urgent items
- "View all" link in card header (ghost button style, right-aligned)
- Each item is clickable (navigates to detail view)
- Status badge inline with title
- "+ N more" counter at bottom

---

## 25. Slide-Over Panel Pattern (2026 Update)

> Added 2026-03-17. The slide-over panel is used when viewing record details from a table without losing context.

```
┌──────────────────────┬────────────────────────────────────┐
│  DATA TABLE          │  SLIDE-OVER PANEL (480px)          │
│  (background, dimmed)│                                    │
│                      │  Package Detail            ✕      │
│  ░░░░░░░░░░░░░░░░░░ │  ──────────────────────────────── │
│  ░░░░░░░░░░░░░░░░░░ │                                    │
│  ░░░░░░░░░░░░░░░░░░ │  Reference: PKG-2026-01847        │
│  ░░░░░░░░░░░░░░░░░░ │  Status: ● Checked In             │
│  ░░░░░░░░░░░░░░░░░░ │  Courier: 📦 Amazon                │
│  ░░░░░░░░░░░░░░░░░░ │  Unit: 1205 — Sarah Chen          │
│  ░░░░░░░░░░░░░░░░░░ │  Storage: Parcel Room A           │
│  ░░░░░░░░░░░░░░░░░░ │  Checked in: Mar 17, 10:45 AM     │
│  ░░░░░░░░░░░░░░░░░░ │  By: Front Desk — James           │
│                      │                                    │
│                      │  ──────────────────────────────── │
│                      │  Activity                          │
│                      │  10:45 AM Checked in by James     │
│                      │  10:46 AM Notification sent       │
│                      │                                    │
│                      │  ──────────────────────────────── │
│                      │       [Release Package  ▶]        │
└──────────────────────┴────────────────────────────────────┘
```

**Design**:

- Width: 480px (fixed)
- Position: right side of viewport
- Background: white
- Shadow: `-4px 0 24px rgba(0, 0, 0, 0.08)` on left edge
- Close: ✕ button + Escape key
- Scrollable content area
- Sticky footer with primary action
- Background table: slight dim overlay or no overlay (user choice)
- Animation: slide in from right (250ms ease-out)

**When to use slide-over vs modal**:

- **Slide-over**: viewing a record from a table (need to see table context)
- **Modal**: creating/editing a record (need user's full attention)

---

## 26. Loading & Skeleton Patterns (2026 Update)

> Added 2026-03-17 based on Vercel, Stripe, and Apple HIG research.

### 26.1 Skeleton Screen Requirements

**Every component MUST export a `.Skeleton` variant** that matches the exact dimensions and layout of the loaded state. This prevents Cumulative Layout Shift (CLS target: < 0.1).

```tsx
// Example: KPICard with matching Skeleton
export function KPICard({ title, value, trend }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-[34px] font-bold">{value}</p>
      <TrendIndicator {...trend} />
    </div>
  );
}

KPICard.Skeleton = function KPICardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="skeleton mb-3 h-4 w-32 rounded" />
      <div className="skeleton mb-2 h-10 w-20 rounded" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
};
```

### 26.2 Loading Strategy by Context

| Context                | Pattern                                             | Target            |
| ---------------------- | --------------------------------------------------- | ----------------- |
| Full page initial load | Page-level skeleton matching layout                 | < 500ms perceived |
| Table data fetch       | 5 skeleton rows + real header                       | < 500ms           |
| Card content           | Card outline with internal skeleton elements        | < 300ms           |
| Button async action    | Spinner replaces icon, text becomes "Saving..."     | < 2s              |
| Image loading          | Gray placeholder matching aspect ratio with shimmer | Until loaded      |
| Navigation transition  | Instant page shell with content skeleton            | < 100ms shell     |
| Search results         | Skeleton result items (3-5)                         | < 300ms           |

### 26.3 Optimistic UI Pattern

For actions where server confirmation is expected to succeed (>99% of the time), show the result immediately and reconcile in the background.

| Action                         | Optimistic Response                            | Rollback on Failure                    |
| ------------------------------ | ---------------------------------------------- | -------------------------------------- |
| Release package                | Package status changes to "Released" instantly | Revert to "Checked In" + error toast   |
| Toggle notification preference | Switch flips immediately                       | Revert toggle + error toast            |
| Reorder dashboard widgets      | New position applied instantly                 | Revert to previous order + error toast |
| Mark notification as read      | Unread indicator removed instantly             | Restore unread state + error toast     |

**Never use optimistic UI for**: Destructive actions (delete), financial actions (payment), or actions with external side effects (send notification to residents).

### 26.4 Shimmer CSS

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--bg-tertiary);
  }
}
```

---

## 27. Settings Page Architecture (2026 Update)

> Added 2026-03-17 based on Stripe, Clerk, and Linear settings research.

### 27.1 Layout

Settings uses a split layout: categorized navigation sidebar (240px) + form content area.

```
┌───────────────────┬──────────────────────────────────────────────┐
│ SETTINGS NAV      │  General Settings                            │
│                   │                                               │
│ General        ●  │  Building Information                         │
│ Event Types       │  ─────────────────────                        │
│ Notifications     │  Building Name *   [Bond Tower            ]   │
│ Amenities         │  Address *         [123 Bond St, Toronto  ]   │
│ Security          │  Corporation #     [TSCC 2584             ]   │
│ Maintenance       │                                               │
│ Users & Roles     │  Time & Locale                                │
│ Billing           │  ─────────────────────                        │
│ Integrations      │  Time Zone *       [America/Toronto      ▾]   │
│ Data              │  Date Format       [MMM d, yyyy           ▾]   │
│ Appearance        │  Language           [English              ▾]   │
│ Advanced          │                                               │
│                   │                                               │
│                   │  ──────────────────────────────────────────── │
│                   │                     [Cancel]  [Save Changes ▶]│
└───────────────────┴──────────────────────────────────────────────┘
```

### 27.2 Form Behavior

- Save is per-section (not per-page) — only changed fields are submitted
- Unsaved changes: warning banner appears + browser `beforeunload` confirmation
- Success: toast notification "Settings saved" + section header shows green check
- Error: inline field errors + toast "Could not save. Check the highlighted fields."
- Auto-save for toggle fields (save immediately on change with debounce)

### 27.3 Categories

| Category      | Icon       | Sections                                                     | Admin Level    |
| ------------- | ---------- | ------------------------------------------------------------ | -------------- |
| General       | Building   | Building info, time/locale, branding                         | Property Admin |
| Event Types   | Grid       | Type list, groups, colors, notification templates            | Property Admin |
| Notifications | Bell       | Channel config (email/SMS/push), templates, preferences      | Property Admin |
| Amenities     | Calendar   | Amenity list, rules, pricing, blackout dates                 | Property Admin |
| Security      | Shield     | FOB types, key categories, incident categories, cameras      | Property Admin |
| Maintenance   | Wrench     | 43 categories, priority rules, SLA settings, vendor defaults | Property Admin |
| Users & Roles | Users      | Role definitions, permissions matrix, invitation settings    | Property Admin |
| Billing       | CreditCard | Subscription tier, payment method, invoice history           | Super Admin    |
| Integrations  | Plug       | API keys, webhook URLs, third-party connections              | Super Admin    |
| Data          | Database   | Import/export, backup schedule, data retention policy        | Super Admin    |
| Appearance    | Palette    | Logo upload, color scheme, custom CSS                        | Property Admin |
| Advanced      | Settings   | Feature flags, audit log settings, compliance                | Super Admin    |

---

## 28. Cross-Reference Index

> Added 2026-03-17. Maps design system sections to related documents.

| Design System Section        | Related Documents                                                          |
| ---------------------------- | -------------------------------------------------------------------------- |
| Sections 1-18 (Original)     | `docs/design/DESIGN-SYSTEM-v2.md` (expanded token system)                  |
| Section 5 (Sidebar)          | `docs/prd/15-search-navigation.md`, `docs/prd/02-roles-and-permissions.md` |
| Section 7 (Components)       | `docs/design/COMPONENT-CATALOG.md` (92 components with full props)         |
| Section 8 (Dashboards)       | `docs/prd/14-dashboard.md` (12 role-specific layouts)                      |
| Section 9 (Motion)           | `docs/design/ANIMATION-PLAYBOOK.md` (detailed spring/tween configs)        |
| Section 10 (Responsive)      | `docs/design/RESPONSIVE-BREAKPOINTS.md` (all breakpoint specs)             |
| Section 13 (Empty States)    | `docs/design/SCREEN-STATES.md` (every screen's 6 states)                   |
| Section 19 (Page Specs)      | Individual PRDs in `docs/prd/` (28 module-specific specs)                  |
| Sections 21-27 (2026 Update) | `docs/DESIGN-INSPIRATION-2026.md` (research sources)                       |
| Component Cross-PRD Map      | `docs/design/COMPONENT-SPECS.md` (123 components mapped to PRDs)           |
| Admin Panel Blueprint        | `docs/design/ADMIN-PANEL-BLUEPRINT.md`                                     |
| User Journeys                | `docs/design/PERSONA-JOURNEYS.md`                                          |
