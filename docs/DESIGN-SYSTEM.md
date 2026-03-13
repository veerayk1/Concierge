# Concierge Design System

> **Design Philosophy**: Apple-grade minimalism meets property management power.
> Every pixel earns its place. White space is a feature, not waste.

---

## 1. Design Principles

| # | Principle | Rule |
|---|-----------|------|
| 1 | **Clarity over decoration** | No gradients, no ornamental borders, no visual noise. If it doesn't communicate, remove it. |
| 2 | **Content is the interface** | Data, text, and actions should feel like they float on a clean white canvas — not trapped in boxes. |
| 3 | **Hierarchy through typography, not color** | Use font weight and size to create hierarchy. Color is reserved for status and actions only. |
| 4 | **Invisible until needed** | Secondary actions, filters, and advanced features reveal on hover/click. Don't show everything at once. |
| 5 | **Role-aware by default** | The interface adapts to who's using it. A security guard sees a different dashboard than a board member. |
| 6 | **One action per moment** | Each screen guides the user to one primary action. Competing CTAs are a design failure. |

---

## 2. Color System

### 2.1 Foundation

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#FFFFFF` | Page background, cards, modals |
| `--bg-secondary` | `#F5F5F7` | Sidebar background, section separators, page-level grouping |
| `--bg-tertiary` | `#E8E8ED` | Hover states on secondary surfaces, disabled input backgrounds |
| `--text-primary` | `#1D1D1F` | Headlines, primary labels, body text |
| `--text-secondary` | `#6E6E73` | Supporting text, timestamps, metadata |
| `--text-tertiary` | `#AEAEB2` | Placeholders, disabled text, hints |
| `--border-subtle` | `#E5E5EA` | Card borders, dividers (1px only, use sparingly) |
| `--border-focus` | `#0071E3` | Focused input rings, active states |

### 2.2 Accent (Interactive)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#0071E3` | Primary buttons, links, active sidebar item, toggles |
| `--accent-hover` | `#0077ED` | Button hover state |
| `--accent-pressed` | `#006EDB` | Button pressed/active state |
| `--accent-subtle` | `rgba(0, 113, 227, 0.08)` | Active sidebar item background, selected row highlight |

### 2.3 Semantic (Status Only)

| Token | Value | Usage |
|-------|-------|-------|
| `--status-success` | `#34C759` | Resolved, delivered, completed, approved |
| `--status-success-bg` | `rgba(52, 199, 89, 0.10)` | Success badge background |
| `--status-warning` | `#FF9500` | Pending, on hold, expiring soon |
| `--status-warning-bg` | `rgba(255, 149, 0, 0.10)` | Warning badge background |
| `--status-error` | `#FF3B30` | Failed, overdue, violation, emergency |
| `--status-error-bg` | `rgba(255, 59, 48, 0.10)` | Error badge background |
| `--status-info` | `#5AC8FA` | Informational, new, in progress |
| `--status-info-bg` | `rgba(90, 200, 250, 0.10)` | Info badge background |

### 2.4 Data Visualization Palette

```
Chart Series:  #0071E3 → #5AC8FA → #34C759 → #FF9500 → #AF52DE → #FF3B30
```

Use in order. Never more than 6 series in a single chart. If >6 needed, group into "Other."

---

## 3. Typography

**Font Stack**: `"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 34px | 700 | 40px | -0.4px | Page titles (Dashboard, Reports) |
| Title 1 | 28px | 700 | 34px | -0.3px | Section headers |
| Title 2 | 22px | 600 | 28px | -0.2px | Card titles, modal headers |
| Title 3 | 20px | 600 | 24px | -0.1px | Sub-section headers |
| Headline | 17px | 600 | 22px | 0 | Table headers, label emphasis |
| Body | 15px | 400 | 22px | 0 | Primary body text, descriptions |
| Callout | 14px | 400 | 20px | 0 | Secondary info, metadata |
| Caption | 12px | 500 | 16px | 0.2px | Timestamps, badges, helper text |
| Overline | 11px | 600 | 14px | 0.8px | Section labels (uppercase), category tags |

### Rules
- **Never use more than 3 font sizes on a single card.**
- **Bold is for scanning, not emphasis.** If a user needs to read something, use regular weight.
- **Monospace** (`SF Mono`, `JetBrains Mono`) only for: unit numbers, tracking IDs, license plates, timestamps.

---

## 4. Spacing & Grid

### 4.1 Spacing Scale (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Inline icon gaps, badge padding |
| `--space-2` | 8px | Between related elements within a component |
| `--space-3` | 12px | Input internal padding, list item gap |
| `--space-4` | 16px | Card internal padding (compact), group spacing |
| `--space-5` | 20px | Standard card padding |
| `--space-6` | 24px | Between cards, section padding |
| `--space-7` | 32px | Major section separators |
| `--space-8` | 40px | Page-level vertical rhythm |
| `--space-9` | 48px | Top-of-page breathing room |

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

| State | Sidebar Width | Content |
|-------|---------------|---------|
| Expanded (default desktop) | 240px | Icon (20px) + Label + Category headers |
| Collapsed (toggle or <1280px) | 64px | Icon only, centered. Tooltip on hover shows label. |
| Mobile (<768px) | 0px (overlay) | Full-width slide-over with backdrop. Hamburger trigger in header. |

### 5.3 Rules
- **Grouped by user workflow**, not by data type. "Operations" = daily tasks. "Community" = resident-facing. "Management" = admin-only.
- **Active state**: Left 3px accent border + `--accent-subtle` background + `--accent` text color.
- **Hover state**: `--bg-tertiary` background. 150ms ease transition.
- **Badge counts** appear on: Packages (unreleased), Service Requests (open), Announcements (unread).
- **Collapse toggle**: Chevron icon at bottom of sidebar, above user profile. Persists in `localStorage`.
- **Keyboard shortcut**: `[` to toggle sidebar.

### 5.4 Role-Based Visibility

| Menu Item | Security Guard | Resident | Owner | Property Manager | Board Member |
|-----------|:-:|:-:|:-:|:-:|:-:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Units & Residents | — | — | — | ✓ | ✓ |
| Amenities | — | ✓ | ✓ | ✓ | ✓ |
| Security | ✓ | — | — | ✓ | — |
| Packages | ✓ | ✓ | ✓ | ✓ | — |
| Service Requests | — | ✓ | ✓ | ✓ | ✓ |
| Announcements | — | ✓ | ✓ | ✓ | ✓ |
| Events | — | ✓ | ✓ | ✓ | ✓ |
| Marketplace | — | ✓ | ✓ | ✓ | — |
| Library | — | ✓ | ✓ | ✓ | ✓ |
| Surveys | — | ✓ | ✓ | ✓ | ✓ |
| Reports | — | — | — | ✓ | ✓ |
| User Management | — | — | — | ✓ | — |
| Logs | ✓ | — | — | ✓ | — |
| Settings | — | — | — | ✓ | — |

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
| Element | Position | Behavior |
|---------|----------|----------|
| **Page title** | Left-aligned | Matches current route. Display weight (34px). |
| **Command palette trigger** | Center | Shows `⌘K` pill. Click or keyboard opens palette. |
| **Notification bell** | Right | Badge with unread count. Click opens dropdown panel. |
| **User avatar** | Far right | Click opens profile flyout (View Profile, Switch Building, Language, Settings, Logout). |
| **Contextual greeting** | Below title, Body size | Personalized. Shows building name + action items count. Disappears after first scroll. |

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
background: #FFFFFF;
border: 1px solid var(--border-subtle);  /* #E5E5EA */
border-radius: 16px;
padding: 20px;
box-shadow: none;  /* No shadow by default */
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

| Type | Style | Usage |
|------|-------|-------|
| **Primary** | `bg: --accent`, white text, 10px radius, 44px height | One per screen. The main action (Save, Create, Submit). |
| **Secondary** | `bg: transparent`, `border: 1px --border-subtle`, `--text-primary` text | Alternative actions (Cancel, Export, Filter). |
| **Ghost** | No border, no background, `--accent` text | Inline actions (View all, Edit, Clear). |
| **Destructive** | `bg: --status-error`, white text | Delete, Remove, Ban. Always requires confirmation dialog. |
| **Icon button** | 36×36px circle, `--bg-secondary` bg, `--text-secondary` icon | Toolbar actions (more ⋯, close ✕, filter). |

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
background: #FFFFFF;
transition: border-color 200ms ease, box-shadow 200ms ease;
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

| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| Page transition | Content fade + 8px slide up | 200ms | ease-out |
| Modal open | Scale 0.97→1.0 + fade | 250ms | ease-out |
| Modal close | Fade out | 150ms | ease-in |
| Sidebar expand/collapse | Width transition | 200ms | ease-in-out |
| Dropdown open | Scale Y 0.95→1.0 + fade | 150ms | ease-out |
| Hover state | Background color | 150ms | ease |
| Toast notification | Slide in from top-right | 300ms | spring(1, 80, 10) |
| Skeleton loading | Shimmer gradient sweep | 1.5s | linear, infinite |
| Button press | Scale 0.98 | 100ms | ease |

### Rules:
- **No animations >300ms.** Users should never feel like they're waiting for the UI.
- **Reduce motion**: Respect `prefers-reduced-motion`. Replace all motion with instant opacity changes.
- **Skeleton screens** instead of spinners for page/section loading. Match the layout of the loaded state.

---

## 10. Responsive Breakpoints

| Name | Width | Layout Changes |
|------|-------|----------------|
| Desktop XL | ≥1440px | Full sidebar (240px) + 12-col grid |
| Desktop | 1280–1439px | Sidebar auto-collapses to 64px |
| Tablet | 768–1279px | Sidebar hidden (hamburger trigger), 8-col grid |
| Mobile | <768px | Single column, bottom tab bar for top 5 nav items |

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

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG AA minimum (4.5:1 text, 3:1 large text/UI) |
| Focus indicators | 3px accent ring on all interactive elements |
| Keyboard navigation | Full tab-order support on all views |
| Screen reader | ARIA labels on all icons, roles on dynamic content |
| Touch targets | 44×44px minimum |
| Error messages | Text-based (never color-only) |
| Form labels | Always visible (no placeholder-only labels) |

---

## 12. Iconography

**Icon set**: [Lucide Icons](https://lucide.dev/) — clean, consistent, 24×24 default.

| Size | px | Usage |
|------|----|-------|
| Small | 16px | Inline with text, badges, table actions |
| Default | 20px | Sidebar items, button icons, input icons |
| Medium | 24px | Card headers, notification icons |
| Large | 32px | Empty states, feature highlights |
| Display | 48px | Dashboard quick-action buttons |

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

| Token | Light | Dark |
|-------|-------|------|
| `--bg-primary` | `#FFFFFF` | `#1C1C1E` |
| `--bg-secondary` | `#F5F5F7` | `#2C2C2E` |
| `--bg-tertiary` | `#E8E8ED` | `#3A3A3C` |
| `--text-primary` | `#1D1D1F` | `#F5F5F7` |
| `--text-secondary` | `#6E6E73` | `#AEAEB2` |
| `--text-tertiary` | `#AEAEB2` | `#636366` |
| `--border-subtle` | `#E5E5EA` | `#38383A` |
| `--accent` | `#0071E3` | `#0A84FF` |

Cards in dark mode: No border, use subtle elevation (`box-shadow: 0 1px 4px rgba(0,0,0,0.3)`).

---

## 15. Error Handling & Feedback

| Scenario | Pattern |
|----------|---------|
| Form validation error | Inline red text below field, red border. Shown on blur or submit. |
| API failure | Toast notification (top-right): red background, error icon, retry button. |
| Empty search results | Empty state with suggestion to broaden search. |
| Permission denied | Gray card with lock icon: "You don't have access to this section." |
| Successful action | Toast notification (top-right): green check, auto-dismiss 4s. |
| Destructive confirmation | Small modal: "Are you sure?" + red button. Require name-typing for permanent deletes. |
| Network offline | Persistent banner at top: "You're offline. Changes will sync when reconnected." |

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

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ServiceRequestCard.tsx` |
| Hooks | camelCase, `use` prefix | `useNotifications.ts` |
| Pages | PascalCase | `SecurityDashboard.tsx` |
| CSS tokens | kebab-case, `--` prefix | `--bg-primary` |
| API routes | kebab-case | `/api/v1/service-requests` |
| Types/Interfaces | PascalCase, `I` prefix optional | `ServiceRequest`, `IUser` |

---

## 18. Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | <1.2s |
| Largest Contentful Paint | <2.5s |
| Time to Interactive | <3.0s |
| Cumulative Layout Shift | <0.1 |
| Bundle size (gzipped) | <200KB initial JS |
| Image format | WebP with AVIF fallback |
| Skeleton → content | <500ms perceived |

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
│   │   object-fit:    │   │   Sign in to continue    │
│   │   cover)         │   │                          │
│   │                  │   │   [ ▪ Sign in with Google ]│
│   │                  │   │   [ ▪ Sign in with Apple ] │
│   │                  │   │                          │
│   │                  │   │   ──── or ────            │
│   │                  │   │                          │
│   │                  │   │   Email *                 │
│   └──────────────────┘   │   ┌──────────────────┐   │
│                          │   │ you@email.com    │   │
│   ░░░░░░░░░░░░░░░░░░░   │   └──────────────────┘   │
│   Building Name          │                          │
│   "Your home,            │   Password *   Forgot?   │
│    your community"       │   ┌──────────────────👁┐  │
│                          │   │ ••••••••          │   │
│                          │   └──────────────────┘   │
│                          │                          │
│                          │   ☑ Remember this device  │
│                          │                          │
│                          │   ┌──────────────────┐   │
│                          │   │    Sign In    ▶  │   │
│                          │   └──────────────────┘   │
│                          │                          │
│                          │   First time? Contact     │
│                          │   your property manager   │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

#### Left Panel — Building Image

| Property | Specification |
|----------|---------------|
| **Width** | 50% of viewport on desktop; hidden on mobile (<768px) |
| **Image source** | Building-specific photo uploaded by property manager |
| **Fallback** | If no building photo: subtle architectural line-art pattern on `--bg-secondary` background (similar to Hotelook's illustration style but minimal) |
| **Image treatment** | `object-fit: cover`, slight dark gradient overlay at bottom (`linear-gradient(transparent 60%, rgba(0,0,0,0.5))`) |
| **Bottom overlay** | Building name (Title 1, white) + optional tagline (Body, white 80% opacity) |
| **Border radius** | 0px (full bleed to edge) on desktop. On tablet: 24px radius with 24px margin, creating a card effect |
| **Animation** | Subtle parallax on scroll (mobile only when stacked). Ken Burns slow zoom (8s) on desktop for photo. |

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

| Order | Element | Specification |
|-------|---------|---------------|
| 1 | **Logo** | Concierge logo, 32px height, top-left of form panel. `margin-top: 48px` |
| 2 | **Heading** | "Welcome back" — Display size (34px), `--text-primary` |
| 3 | **Subheading** | "Sign in to your account" — Body size, `--text-secondary` |
| 4 | **Email field** | Label above ("Email"), 44px height, full-width. Mail icon inside (left). |
| 5 | **Password field** | Label above ("Password") with "Forgot?" link right-aligned on same line (`--accent` color, Caption size). 44px height. Eye toggle icon (right). |
| 6 | **Remember toggle** | "Remember this device" — iOS-style toggle (not checkbox). Default: on. |
| 7 | **Sign In button** | Full-width, 48px height, `--text-primary` background (#1D1D1F), white text, 12px radius. THE primary action. |
| 8 | **Help text** | "Need access? Contact your building administrator" — Caption size, centered, `--text-tertiary`. |

#### Form Behavior

| State | Behavior |
|-------|----------|
| **Empty** | Placeholder text in `--text-tertiary`. Sign In button disabled (40% opacity). |
| **Typing** | Real-time email format validation (debounced 500ms). No validation on password length during typing. |
| **Error — wrong credentials** | Shake animation on form (300ms). Red inline message: "Incorrect email or password. Please try again." below password field. Fields NOT cleared. |
| **Error — account locked** | Red banner at top of form: "Account locked after 5 failed attempts. Contact your property manager." |
| **Loading** | Sign In button shows spinner, text changes to "Signing in…", button disabled. |
| **Success** | Button turns green with checkmark (200ms), then fade-transition to dashboard. |
| **Forgot password** | Replaces form content (slide-left transition) with email-only field + "Send Reset Link" button + "Back to sign in" ghost link. |

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

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | 50/50 split. Image left, form right. |
| Tablet (768–1023px) | Image panel becomes 40% width with 24px margin + 24px radius (card effect). Form panel 60%. |
| Mobile (<768px) | Image panel hidden entirely. Form takes full screen. Building name + logo shown at top of form instead. Subtle gradient background (white → `--bg-secondary`). |

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

| Section | Specification |
|---------|---------------|
| **Mini Calendar** | Compact month grid. Dots below dates indicate existing bookings. Click date → jumps main calendar. Current date: accent circle fill. Selected date: accent border ring. |
| **Amenity Filter** | Checkbox list of all bookable amenities. Each amenity has a **color dot** (assigned from visualization palette). "All" toggle at top. Unchecking hides that amenity's blocks from the grid. |
| **Color Assignment** | Each amenity type gets a consistent color from the palette: Party Room `#0071E3`, Gym `#34C759`, BBQ `#FF9500`, Guest Suite `#AF52DE`, Pool `#5AC8FA`, Tennis `#FF3B30`, Yoga `#FFCC00`, Rooftop `#30D158`. |
| **My Bookings** | Count of upcoming bookings for the logged-in user. "View all →" opens a list view of the user's bookings. |
| **Collapse** | Panel collapses to icon-only (64px) on screens <1280px. Toggle button at top. |

#### Main Area — Calendar Grid

**View Modes** (segmented control, top-right):

| Mode | Layout | Best For |
|------|--------|----------|
| **Week** (default) | 7 columns × 24 hour rows. Time labels on left (30-min increments). Scrollable vertically. | Day-to-day booking management |
| **Day** | Single column, expanded. Larger time slots. Shows all amenities side-by-side as sub-columns. | Security guards / front desk booking for today |
| **Month** | Traditional month grid. Each day cell shows colored dots for bookings (max 3 visible + "+N more"). Click day → zooms into Day view. | Overview / finding open dates |

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

| Property | Specification |
|----------|---------------|
| **Background** | Amenity color at 12% opacity (e.g., `rgba(0, 113, 227, 0.12)` for Party Room) |
| **Left border** | 3px solid amenity color |
| **Border radius** | 8px |
| **Height** | Proportional to duration. 1 hour = 60px in week view. Minimum: 40px (30-min slot). |
| **Text** | Amenity name (600 weight) + time range + unit number. All truncate with ellipsis if block is too small. |
| **Hover** | Elevate with shadow `0 2px 8px rgba(0,0,0,0.08)`. Cursor: pointer. |
| **Click** | Opens Booking Detail Popover. |
| **Conflict/Unavailable** | Diagonal stripe pattern (`repeating-linear-gradient`) in `--bg-tertiary`. Non-clickable. Shows "Unavailable" or "Maintenance" label. |
| **Your booking** | Slightly darker background (18% opacity instead of 12%). Small "Your booking" badge in top-right corner. |

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

| Field | Behavior |
|-------|----------|
| **Amenity dropdown** | Pre-filled if clicked from a specific amenity's column in Day view. Otherwise required selection. Shows availability indicator (green dot = open, red dot = fully booked today). |
| **Date** | Pre-filled from clicked slot. Calendar picker on click. Blocked dates shown greyed out. |
| **Time — Start** | Pre-filled from clicked slot. 30-min increment dropdown. Unavailable slots greyed out with strikethrough. |
| **Time — End** | Auto-calculated from amenity's default duration. Adjustable. Capped at amenity's max duration. Shows "exceeds max" warning in real-time. |
| **Unit selector** | Admin/PM only — pick any unit. Residents: auto-filled with their unit, not editable. Searchable dropdown with unit + resident name. |
| **Notes** | Optional textarea. Max 200 chars. |
| **Info bar** | Shows amenity rules: max duration, deposit required, cancellation policy. Dynamic per amenity. `--status-info-bg` background. |
| **Book Now** | Primary button. Disabled until all required fields filled. On click: spinner → success toast → block appears on calendar. |

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

| Element | Specification |
|---------|---------------|
| **Status badge** | Confirmed (green), Pending (yellow), Cancelled (red) |
| **Cancel button** | Secondary/destructive. Opens confirmation: "Cancel this booking? Cancellation policy: free if >24h before." |
| **Modify button** | Secondary. Opens the booking form pre-filled. Only available if >24h before the booking (configurable per amenity). |
| **Admin view** | Admin/PM sees additional: "Booked by [admin name] on behalf of Unit 1205." + "Override" button to bypass rules. |

#### Availability Rules Engine (Admin-Configured Per Amenity)

| Rule | Example | UI Representation |
|------|---------|-------------------|
| **Operating hours** | 8:00 AM — 10:00 PM | Time slots outside hours are greyed/hidden |
| **Max duration** | 4 hours | End time dropdown caps automatically |
| **Min advance booking** | 24 hours | Slots within 24h show "Too late to book" |
| **Max advance booking** | 30 days | Dates >30 days out are disabled in picker |
| **Bookings per unit/week** | 2 per week | After 2nd booking, unit sees "Limit reached this week" |
| **Deposit required** | $50 | Info bar shows deposit. Booking marked "Pending" until confirmed. |
| **Maintenance blackout** | Every Monday 8-10 AM | Diagonal stripe pattern block, label "Maintenance" |
| **Concurrent bookings** | 1 (exclusive) or 5 (shared like gym) | Shared: multiple blocks stack in same slot. Exclusive: slot blocked after 1 booking. |

#### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1280px) | Full layout: filter panel (280px) + calendar grid |
| Desktop small (1024–1279px) | Filter panel collapsed to icons. Calendar grid full-width. |
| Tablet (768–1023px) | Filter panel hidden (hamburger toggle). Calendar defaults to Day view. |
| Mobile (<768px) | **Completely different layout** — no grid calendar. Instead: date scroller at top (horizontal scroll of dates) → list of available time slots below → tap slot → booking sheet slides up from bottom. |

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

*This document is the single source of truth for all design decisions. Every component, page, and feature must comply with these standards. Deviations require explicit approval and documentation.*
