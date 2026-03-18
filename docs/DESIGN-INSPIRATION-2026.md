# Concierge — Design Inspiration Report 2026

> **Purpose**: Curated design inspiration from industry-leading SaaS products, design galleries, and platform guidelines.
> Filtered for: property management dashboards, admin panels, SaaS dashboards, condo management UIs.
> Design constraints: desktop monitors (1920x1080 primary), non-technical users, white backgrounds, color only for status.
>
> **Last Updated**: 2026-03-17

---

## Table of Contents

1. [Navigation Patterns](#1-navigation-patterns)
2. [Table & Data Grid Patterns](#2-table--data-grid-patterns)
3. [Form Patterns](#3-form-patterns)
4. [Dashboard & KPI Patterns](#4-dashboard--kpi-patterns)
5. [Card Patterns](#5-card-patterns)
6. [Modal & Dialog Patterns](#6-modal--dialog-patterns)
7. [Empty States](#7-empty-states)
8. [Loading States](#8-loading-states)
9. [Error States](#9-error-states)
10. [Settings Page Patterns](#10-settings-page-patterns)
11. [Command Palette & Search](#11-command-palette--search)
12. [Reference Product Analysis](#12-reference-product-analysis)
13. [Dribbble & Behance Inspiration](#13-dribbble--behance-inspiration)
14. [Anti-Patterns to Avoid](#14-anti-patterns-to-avoid)

---

## 1. Navigation Patterns

### 1.1 Best Approach: Collapsible Sidebar with Role-Aware Groups

**Inspiration Sources**: Linear, Vercel (2026 redesign), Stripe Dashboard

**The Pattern**:
A fixed left sidebar that groups navigation items by user workflow (not data type). Items are organized under overline category labels. The sidebar collapses to icon-only mode on smaller viewports or via keyboard shortcut.

**Why It Works for Concierge**:

- Property managers need 15+ menu items; security guards need 5. Role-aware grouping prevents the 60-item problem observed in competitor platforms.
- Collapsible sidebar preserves screen real estate for dense data tables on monitor displays.
- Linear's approach of dimming the sidebar slightly so the content area stands out ensures data focus.

**Key Principles from Research**:

| Principle                              | Source               | Application                                                                     |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Sidebar dimmer than content area       | Linear 2025 redesign | Sidebar uses `--bg-secondary` (#F5F5F7), content stays `--bg-primary` (#FFFFFF) |
| Category grouping with overline labels | Linear, Vercel       | "OPERATIONS", "COMMUNITY", "MANAGEMENT" groupings                               |
| Badge counts on nav items              | Linear, Stripe       | Unreleased packages (47), open service requests (12)                            |
| Keyboard shortcut to collapse          | Linear (`[`), Vercel | `[` toggles sidebar. Persists in localStorage                                   |
| User profile at sidebar bottom         | Linear, Clerk        | Avatar + name + role + building name                                            |
| Active state: left accent border       | Linear, Vercel       | 3px `--accent` left border + subtle background                                  |
| Resizable sidebar                      | Vercel 2026          | User can drag sidebar border to resize (240px-360px)                            |

**Tailwind/CSS Implementation Notes**:

```css
/* Sidebar container */
.sidebar {
  width: 240px; /* Expanded default */
  min-width: 64px; /* Collapsed */
  background: var(--bg-secondary); /* F5F5F7 — slightly dimmer */
  border-right: 1px solid var(--border-subtle);
  transition: width 200ms ease-in-out;
  overflow-y: auto;
  overflow-x: hidden;
  position: fixed;
  height: 100vh;
  z-index: 40;
}

/* Active nav item */
.nav-item--active {
  background: var(--accent-subtle); /* rgba(0, 113, 227, 0.08) */
  color: var(--accent);
  border-left: 3px solid var(--accent);
  font-weight: 600;
}

/* Hover state */
.nav-item:hover {
  background: var(--bg-tertiary); /* E8E8ED */
  transition: background 150ms ease;
}

/* Category overline */
.nav-category {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 20px 16px 4px;
}
```

**Tailwind Utility Classes**:

```
Sidebar: w-60 min-w-16 bg-gray-50 border-r border-gray-200 fixed h-screen
Active item: bg-blue-50 text-blue-600 border-l-3 border-blue-600 font-semibold
Hover: hover:bg-gray-100 transition-colors duration-150
Category label: text-[11px] font-semibold tracking-widest uppercase text-gray-400
```

### 1.2 Top Bar with Contextual Breadcrumbs

**Inspiration Sources**: Vercel, Stripe, Clerk

**The Pattern**:
A persistent top bar containing: page title (left), command palette trigger (center), notification bell + user avatar (right). Below the title, a contextual greeting or breadcrumb trail appears.

**Why It Works for Concierge**:

- The property manager managing multiple buildings needs breadcrumb context: "Bond Tower > Unit 1205 > Service Requests"
- Vercel's "projects as filters" approach maps to our "buildings as context" — switching between buildings recontextualizes the entire sidebar.

**Implementation Notes**:

```
Tailwind: h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8
Page title: text-2xl font-bold text-gray-900 tracking-tight
Breadcrumb: text-sm text-gray-500 flex items-center gap-1
```

### 1.3 Mobile Bottom Tab Bar

**Inspiration Sources**: Vercel 2026 (floating bottom bar), Apple HIG

**The Pattern**:
On mobile, the sidebar becomes a floating bottom tab bar with the 4-5 most important actions for the user's role, plus a "More" overflow that opens the full sidebar as an overlay.

**Key Detail from Vercel**: Optimized for one-handed use. The center action is context-aware (changes per role).

---

## 2. Table & Data Grid Patterns

### 2.1 Best Approach: Dense-but-Readable Tables with Progressive Actions

**Inspiration Sources**: Stripe Payments Dashboard, Linear Issues Table, Pencil & Paper UX research

**The Pattern**:
Full-width tables with 56px row height (not shorter, not taller), hover-revealed row actions, column sorting via header click, and a horizontal filter bar above the table. Pagination (not infinite scroll) with 25 rows default.

**Why It Works for Concierge**:

- Non-technical concierge staff need to scan hundreds of packages, service requests, or visitor logs quickly.
- 56px rows are the sweet spot: dense enough for monitors, readable enough for non-technical users.
- Stripe's approach of hiding detailed actions behind a row click (opening a side panel) prevents toolbar clutter.

**Key Principles from Research**:

| Principle                               | Source                      | Application                                                               |
| --------------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| Default sort: most recent / most urgent | Stripe, Pencil & Paper      | Package list: newest first. Service requests: open + urgent first         |
| Hover-revealed row actions              | Stripe, Linear              | `...` menu appears on hover. No visible action buttons in default state   |
| Filter bar above table                  | Stripe, Ronas IT (Dribbble) | Horizontal row: Status dropdown, Date range, Search input, "More Filters" |
| Checkbox column for bulk actions        | Stripe, Linear              | Left-most column. Selecting rows reveals floating action bar at bottom    |
| Floating action bar                     | Linear                      | "3 selected: [Mark Resolved] [Assign To] [Export] [Delete]"               |
| Click row to open detail panel          | Stripe                      | Right-side slide-over panel (480px) with full record detail               |
| No zebra stripes                        | Pencil & Paper, Stripe      | Simple line dividers. Hover highlight (`--bg-secondary`) is sufficient    |
| Pagination with total count             | Stripe                      | "Showing 1-25 of 1,987 units [< 1 2 3 ... 80 >]"                          |
| Column resizing                         | Linear                      | Drag column borders to resize. Persists in localStorage                   |
| Inline editing on double-click          | Linear, Notion              | Double-click cell enters edit mode. Enter confirms, Escape cancels        |
| Sticky header row                       | All                         | Header remains visible when scrolling                                     |

**Tailwind/CSS Implementation Notes**:

```css
/* Table container */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

/* Header row */
.data-table thead th {
  height: 44px;
  background: var(--bg-secondary);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: left;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--border-subtle);
  user-select: none;
  cursor: pointer;
}

/* Table row */
.data-table tbody tr {
  height: 56px;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 150ms ease;
}

.data-table tbody tr:hover {
  background: var(--bg-secondary);
}

/* Sort indicator */
.sort-indicator {
  display: inline-flex;
  margin-left: 4px;
  opacity: 0.5;
  transition: opacity 150ms;
}

.sort-indicator--active {
  opacity: 1;
  color: var(--accent);
}

/* Floating action bar */
.bulk-action-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary); /* Dark background */
  color: white;
  border-radius: 12px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.16);
  z-index: 50;
}
```

**Tailwind Utility Classes**:

```
Table: w-full table-fixed
Header: h-11 bg-gray-50 text-sm font-semibold text-gray-500 text-left px-4 sticky top-0
Row: h-14 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150
Floating bar: fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl px-4 py-2 shadow-xl
```

### 2.2 Filter Bar Pattern

**Inspiration Sources**: Stripe, Linear

**The Pattern**:
A horizontal bar above the table with: primary filters visible (Status, Type, Date range), a search input, and a "More Filters" button that expands additional filter rows.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Status: [All ▾]  Type: [All ▾]  Date: [Last 7 days ▾]  [🔍 Search]  [More Filters]  │
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation Notes**:

- Show the 3 most-used filters inline. Everything else behind "More Filters".
- Active filters show a count badge: "More Filters (2)".
- "Clear All" link appears when any filter is active.
- Filter state persists in URL params for shareability and browser back/forward.

---

## 3. Form Patterns

### 3.1 Best Approach: Label-Above with Progressive Disclosure

**Inspiration Sources**: Stripe, Clerk, Apple HIG, Notion

**The Pattern**:
Labels always above inputs (never inline). Required fields marked with red asterisk. Form sections grouped with headings. Advanced fields hidden behind "Show more options" toggle. Inline validation on blur.

**Why It Works for Concierge**:

- Non-technical front desk staff process 50+ package check-ins daily. Forms must be scannable and fast.
- Label-above is the fastest pattern for eye tracking (straight vertical scan).
- Progressive disclosure keeps the 80% use case fast while allowing the 20% advanced options.

**Key Principles from Research**:

| Principle                                 | Source                         | Application                                                        |
| ----------------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| Label above input, never beside           | Apple HIG, Stripe              | All Concierge forms use label-above                                |
| Required: red asterisk after label        | Stripe, Clerk                  | `Email *` with asterisk in `--status-error` color                  |
| Inline validation on blur                 | Stripe, Clerk                  | Email format validated on field blur (debounced 500ms)             |
| Error message below field                 | Stripe, Apple HIG              | Red text + red border. Icon optional                               |
| Multi-step forms for complex flows        | Behance prop management, Clerk | Onboarding wizard: 8-step form with progress bar                   |
| Progressive disclosure of advanced fields | Notion, Linear                 | "Show more options" toggle reveals fields used <20% of time        |
| Auto-focus first field on form open       | Stripe, Apple HIG              | Modal opens, first input is focused. Accessible: `aria-autofocus`  |
| Conditional fields                        | Notion Forms (2025)            | Show vendor selection only when maintenance category is "Plumbing" |
| Save draft indicator                      | Notion                         | "Draft saved" timestamp in form footer                             |
| Smart defaults via AI                     | Concierge AI framework         | Pre-fill courier name based on package appearance                  |

**Tailwind/CSS Implementation Notes**:

```css
/* Form field wrapper */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

/* Label */
.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-label--required::after {
  content: ' *';
  color: var(--status-error);
}

/* Input */
.form-input {
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  font-size: 15px;
  background: white;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
  outline: none;
}

.form-input--error {
  border-color: var(--status-error);
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
}

/* Error message */
.form-error {
  font-size: 12px;
  color: var(--status-error);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Section divider */
.form-section {
  border-top: 1px solid var(--border-subtle);
  padding-top: 24px;
  margin-top: 24px;
}

.form-section-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}
```

**Tailwind Utility Classes**:

```
Field wrapper: flex flex-col gap-1.5 mb-5
Label: text-sm font-medium text-gray-900
Required: after:content-['_*'] after:text-red-500
Input: h-11 px-3 border border-gray-200 rounded-[10px] text-[15px] focus:border-blue-600 focus:ring-3 focus:ring-blue-100
Error border: border-red-500 ring-3 ring-red-50
Error text: text-xs text-red-500 flex items-center gap-1
```

### 3.2 Multi-Step Form (Wizard) Pattern

**Inspiration Sources**: Clerk signup, Behance property onboarding, PRD-23 (Onboarding Wizard)

**The Pattern**:
Horizontal step indicator at top. One section per step. Back/Next navigation at bottom. Progress persists if user leaves.

```
┌────────────────────────────────────────────────────┐
│  Step 2 of 8: Building Details                     │
│                                                     │
│  (1)━━━(●2)━━━(3)━━━(4)━━━(5)━━━(6)━━━(7)━━━(8)  │
│                                                     │
│  [Form fields for this step]                        │
│                                                     │
│  ◀ Back                              Next ▶        │
│                                     Step 3: Units   │
└────────────────────────────────────────────────────┘
```

**Implementation Notes**:

- Step indicator: circles connected by lines. Completed = filled accent. Current = accent ring. Future = gray.
- Each step validates before allowing Next.
- "Skip for now" on optional steps.
- Draft auto-saves every 30 seconds.

---

## 4. Dashboard & KPI Patterns

### 4.1 Best Approach: F-Pattern KPI Row + Detail Cards Below

**Inspiration Sources**: Stripe Dashboard, Linear Dashboards (2025), UXPin research, Pencil & Paper

**The Pattern**:
Top row: 3-5 KPI stat cards in a horizontal grid. Below: 2-column layout with summary lists and charts. Bottom: activity feed or upcoming events.

**Why It Works for Concierge**:

- Property managers scanning the dashboard follow the F-pattern: top-left for most critical metric, scan right, then drop down.
- The KPI row answers "Is everything okay?" in 2 seconds.
- Summary lists below let them drill into specific areas.

**Key Principles from Research**:

| Principle                                | Source                          | Application                                                                   |
| ---------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| F-pattern: most critical metric top-left | Pencil & Paper, UXPin           | "Open Service Requests" top-left for Property Manager                         |
| 3-5 KPI cards in top row                 | Stripe, F1Studioz               | 4 KPIs: Open Requests, Unreleased Packages, Active Visitors, Today's Bookings |
| Trend indicator on each KPI              | Stripe, Setproduct              | "+12% vs last week" in green or red                                           |
| Sparkline in KPI card (optional)         | Stripe, Grafana                 | 48px tall mini chart showing 7-day trend                                      |
| Click KPI to drill down                  | All                             | Click "47 Unreleased" opens Package Management filtered to unreleased         |
| Role-adaptive dashboard                  | Linear, Concierge design system | Security guard sees different KPIs than property manager                      |
| Delta indicators with color              | Pencil & Paper                  | Green arrow up for improvement, red arrow down for regression                 |
| Contextual greeting                      | Vercel, Concierge design system | "Welcome back, Sarah - 7 items need attention today"                          |
| AI-powered insights card                 | UXPin, Concierge AI framework   | "Unusual: 3x more packages than typical Wednesday"                            |

**Tailwind/CSS Implementation Notes**:

```css
/* KPI card grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* KPI stat card */
.kpi-card {
  background: white;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 200ms ease;
}

.kpi-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* KPI value */
.kpi-value {
  font-size: 34px;
  font-weight: 700;
  line-height: 40px;
  letter-spacing: -0.4px;
  color: var(--text-primary);
}

/* KPI trend */
.kpi-trend--positive {
  color: var(--status-success);
  font-size: 12px;
  font-weight: 500;
}

.kpi-trend--negative {
  color: var(--status-error);
  font-size: 12px;
  font-weight: 500;
}

/* Two-column detail layout */
.dashboard-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1279px) {
  .dashboard-detail {
    grid-template-columns: 1fr;
  }
}
```

**Tailwind Utility Classes**:

```
KPI grid: grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8
KPI card: bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow
KPI value: text-[34px] font-bold leading-10 tracking-tight text-gray-900
Trend up: text-xs font-medium text-green-600
Trend down: text-xs font-medium text-red-500
Detail grid: grid grid-cols-2 gap-6 max-lg:grid-cols-1
```

### 4.2 Chart-Table Toggle

**Pattern**: Allow users to switch any data visualization between chart and table view.

**Why**: Non-technical users prefer tables; visual users prefer charts. Both are valid.

**Implementation**: Toggle in chart card header with icons for chart view and table view. Accessibility: chart data always available as a table via "Show as table" for screen readers.

---

## 5. Card Patterns

### 5.1 Best Approach: Minimal Cards with Hierarchy Through Typography

**Inspiration Sources**: Apple HIG, Stripe, Linear, Paperpillar (Dribbble)

**The Pattern**:
White background cards with 1px subtle border, 16px border radius, 20px padding. No shadows by default (shadow on hover for clickable cards only). Hierarchy established through font weight and size, never through background color variations.

**Why It Works for Concierge**:

- White-on-white with subtle borders matches our "content is the interface" principle.
- No decoration means the data itself is the visual element.
- Consistent card sizing on monitor displays creates a clean grid.

**Card Types for Concierge**:

| Type                  | Dimensions                    | Content                                   | Used In                     |
| --------------------- | ----------------------------- | ----------------------------------------- | --------------------------- |
| **KPI Stat Card**     | Min 240px wide                | Title + value + sparkline + trend         | Dashboards                  |
| **Record Card**       | Full width                    | Title + status badge + metadata + actions | Event log, packages         |
| **Profile Card**      | 280-360px                     | Avatar + name + role + contact + actions  | Unit file, user management  |
| **Summary Card**      | 6-col (half) or 12-col (full) | Title + list + "View all" link            | Dashboard summaries         |
| **Action Card**       | Min 200px                     | Icon + label + description                | Quick actions, empty states |
| **Notification Card** | 320px (panel width)           | Icon + title + description + time         | Notification panel          |

**CSS Implementation Notes**:

```css
/* Base card */
.card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 20px;
}

/* Clickable card */
.card--clickable {
  cursor: pointer;
  transition: box-shadow 200ms ease;
}

.card--clickable:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* Card header with title and action */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}
```

---

## 6. Modal & Dialog Patterns

### 6.1 Best Approach: Focused Modals with Strict Size Hierarchy

**Inspiration Sources**: Apple HIG, Stripe, Linear, W3C ARIA Dialog Pattern

**The Pattern**:
4 modal sizes mapped to task complexity. Backdrop blur. Focus trap. Escape/backdrop-click to close. Maximum 1 modal deep (nested actions use slide-over panels instead).

**Why It Works for Concierge**:

- Property managers handle many quick actions (release package, approve booking) that need a focused overlay.
- Strict "one modal at a time" prevents the Russian-doll nesting that plagues competitor platforms.
- Slide-over panels for secondary actions (viewing linked records) keep context.

**Key Principles from Research**:

| Principle                                       | Source            | Application                                                          |
| ----------------------------------------------- | ----------------- | -------------------------------------------------------------------- |
| Purpose obvious at a glance                     | Userpilot, Eleken | Modal header = verb + noun: "Release Package", "Create Announcement" |
| Keep body text brief                            | Userpilot         | Bullet points over paragraphs. Value understood in 2-3 seconds       |
| Action-oriented CTA copy                        | Userpilot         | "Release Package" not "OK". "Delete Unit" not "Confirm"              |
| Focus trap (Tab cycles within modal)            | W3C ARIA          | Tab stays inside modal. Shift+Tab cycles backward                    |
| `aria-modal="true"` + `aria-labelledby`         | W3C ARIA          | Announced by screen readers. Title linked via ID                     |
| Destructive actions require typing confirmation | Stripe, Linear    | "Type DELETE to confirm" for permanent operations                    |
| No modals on mobile for complex forms           | Vercel, Userpilot | Use full-page views on mobile instead of modals                      |

**Modal Sizes**:

| Size       | Width       | Max Height | Use Case                                             |
| ---------- | ----------- | ---------- | ---------------------------------------------------- |
| Small      | 400px       | 300px      | Confirmations, simple yes/no, delete confirmation    |
| Medium     | 560px       | 70vh       | Standard forms (3-8 fields), record detail           |
| Large      | 720px       | 80vh       | Complex forms, multi-section, file uploads           |
| Full-sheet | 90vw x 90vh | —          | Reports, calendars, rich editors, multi-step wizards |

**Slide-Over Panel** (for secondary context without losing modal):

```css
.slide-over {
  position: fixed;
  right: 0;
  top: 0;
  width: 480px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
  z-index: 50;
  transform: translateX(100%);
  transition: transform 250ms ease-out;
}

.slide-over--open {
  transform: translateX(0);
}
```

---

## 7. Empty States

### 7.1 Best Approach: Actionable Empty States with Contextual Guidance

**Inspiration Sources**: Linear, Notion, Eleken research, Carbon Design System, Cloudscape

**The Pattern**:
Line-art illustration (120x120px) + positive headline (3-6 words) + description (1-2 sentences explaining value) + primary CTA button + optional "Learn more" link. Progressive onboarding for first-time states.

**Why It Works for Concierge**:

- Non-technical users encountering empty screens need guidance, not just "No data found."
- First-use empty states are onboarding opportunities: "Your package log starts here. Check in your first package to begin."
- Competitor platforms show "No records" with no action button. This is hostile UX.

**Empty State Types**:

| Type             | When                                       | Content Strategy                                                         |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| **First-use**    | User has never created data in this module | Onboarding guidance: what this module does + first action                |
| **No results**   | Search/filter returned zero matches        | "No matches. Try broadening your search." + Clear Filters button         |
| **Cleared**      | User has processed all items (zero inbox)  | Celebratory: "All caught up! No pending packages."                       |
| **Error-caused** | Backend failure prevents data loading      | "Something went wrong. Try refreshing." + Refresh button                 |
| **Permission**   | User doesn't have access                   | Lock icon + "You don't have access to this section. Contact your admin." |

**Key Anti-Patterns to Avoid**:

| Bad                                    | Good                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| "No records found"                     | "Your package log starts here"                         |
| "Oops! Nothing here!"                  | "No matching results"                                  |
| Empty screen with no CTA               | Always include an action button                        |
| Generic illustration reused everywhere | Unique illustration per module                         |
| "Error" with no explanation            | "We couldn't load your data. Try refreshing the page." |

**Illustration Style**:

- Line-art only. Stroke weight: 1.5px.
- Primary color: `--text-tertiary` (#AEAEB2).
- One accent detail per illustration in `--accent` (#0071E3).
- Maximum 3 objects per illustration.
- No filled shapes, no gradients, no photographs.

**Animation**:

- Illustration fades in: opacity 0 to 1, 400ms, ease-out.
- Text fades in: 200ms delay, 300ms, ease-out.
- Button fades in: 300ms delay, 300ms, ease-out.
- `prefers-reduced-motion`: instant opacity, no animation.

---

## 8. Loading States

### 8.1 Best Approach: Skeleton Screens Matching Final Layout

**Inspiration Sources**: Vercel (optimistic UI), Stripe, Linear, Apple HIG

**The Pattern**:
Skeleton screens that exactly match the dimensions and layout of the loaded content. No spinners for page/section loading (spinners only for in-button or inline actions). Shimmer animation on skeleton elements.

**Why It Works for Concierge**:

- Prevents Cumulative Layout Shift (CLS < 0.1 target).
- Perceived load time drops when users see the shape of upcoming content.
- Vercel's approach of showing "building" state immediately (optimistic UI) reduces perceived latency.

**Loading State Types**:

| Type                | Pattern                                                 | Duration Target   |
| ------------------- | ------------------------------------------------------- | ----------------- |
| **Page load**       | Full skeleton matching page layout                      | < 500ms perceived |
| **Section load**    | Section-specific skeleton                               | < 300ms           |
| **Button action**   | Spinner replaces button icon, text becomes "Loading..." | < 2s              |
| **Table load**      | 5 skeleton rows matching column widths                  | < 500ms           |
| **Card load**       | Card outline with pulsing gradient                      | < 500ms           |
| **Image load**      | Gray placeholder matching aspect ratio                  | Until loaded      |
| **Infinite action** | Progress bar in top nav (like YouTube)                  | Indeterminate     |

**Skeleton CSS**:

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

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--bg-tertiary);
  }
}
```

**Every component must export a `.Skeleton` variant** with matching dimensions. Example:

```tsx
// KPICard.Skeleton
<div className="skeleton h-[120px] w-full rounded-2xl" />

// TableRow.Skeleton
<tr>
  <td><div className="skeleton h-4 w-20 rounded" /></td>
  <td><div className="skeleton h-4 w-32 rounded" /></td>
  <td><div className="skeleton h-4 w-24 rounded" /></td>
</tr>
```

---

## 9. Error States

### 9.1 Best Approach: Contextual, Actionable Error Communication

**Inspiration Sources**: Carbon Design System, Stripe, Apple HIG, Cloudscape

**The Pattern**:
Errors are communicated at the appropriate scope: field-level for form validation, toast for API failures, full-page for critical failures. Every error includes: what happened (plain language), why it matters, and what to do about it.

**Error State Types**:

| Scope          | Pattern                                      | Example                                                          |
| -------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **Field**      | Red border + red text below input            | "Please enter a valid email address"                             |
| **Form**       | Red banner at top of form + field highlights | "2 fields need your attention" with scroll-to-error              |
| **Action**     | Toast notification (top-right)               | "Couldn't release package. Try again." + Retry button            |
| **Section**    | Inline error card replacing content          | "We couldn't load service requests. [Refresh] [Go to Dashboard]" |
| **Page**       | Full-page error with illustration            | "Something went wrong" + description + "Go to Dashboard" button  |
| **Network**    | Persistent top banner                        | "You're offline. Changes will sync when reconnected."            |
| **Permission** | Gray card with lock icon                     | "You don't have access to this section."                         |

**Copy Rules for Errors**:

- Use plain language. "We couldn't save your changes" not "Error 500: Internal Server Error".
- Never blame the user. "We couldn't find that unit" not "You entered an invalid unit number".
- Always provide a next step. Every error has either a Retry, Go Back, or Contact Support action.
- No exclamation marks in error messages. No "Oops" or "Uh oh" or "Whoops".

**Toast Error CSS**:

```css
.toast--error {
  background: var(--status-error-bg);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-left: 4px solid var(--status-error);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 400px;
}
```

---

## 10. Settings Page Patterns

### 10.1 Best Approach: Categorized Sidebar + Form Sections

**Inspiration Sources**: Stripe Settings, Clerk Dashboard, Linear Settings (2025 redesign), SaaSFrame (184 examples)

**The Pattern**:
Left sidebar with categorized settings sections. Main area displays the selected section as a form with grouped fields. Save button fixed at bottom or per-section. Toggle-heavy for boolean preferences.

**Why It Works for Concierge**:

- Property managers configure 12+ settings categories. A flat list would be overwhelming.
- Clerk's approach of categorized sidebar + form sections maps directly to our settings architecture.
- Linear redesigned settings pages "from the ground up" to be easier to navigate.

**Settings Categories for Concierge**:

| Category          | Sections                                                  |
| ----------------- | --------------------------------------------------------- |
| **General**       | Building info, time zone, language, branding              |
| **Event Types**   | Configure event types, groups, icons, colors              |
| **Notifications** | Channels (email/SMS/push), templates, preferences         |
| **Amenities**     | Amenity list, booking rules, pricing, blackout dates      |
| **Security**      | FOB types, key categories, incident categories, cameras   |
| **Maintenance**   | Categories (43), priority rules, SLA settings             |
| **Users & Roles** | Role definitions, permissions matrix, invitation settings |
| **Billing**       | Subscription tier, payment method, invoice history        |
| **Integrations**  | API keys, webhook URLs, third-party connections           |
| **Data**          | Import/export, backup schedule, data retention policy     |
| **Appearance**    | Logo upload, color scheme, custom CSS                     |
| **Advanced**      | Feature flags, audit log settings, compliance             |

**Layout Pattern**:

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
│                   │                    [Cancel]  [Save Changes ▶] │
└───────────────────┴──────────────────────────────────────────────┘
```

---

## 11. Command Palette & Search

### 11.1 Best Approach: Linear-Style Full-Screen Command Palette

**Inspiration Sources**: Linear (gold standard), Vercel, Stripe Sigma

**The Pattern**:
`Cmd+K` opens a full-screen overlay with search input, categorized results (Pages, Units, Residents, Actions), recent items, and suggested actions. Every action in the product is accessible via the command palette.

**Why It Works for Concierge**:

- Linear's command palette is the gold standard because it eliminates navigation entirely for power users.
- Property managers who know the system can be 3x faster: type "Unit 1205" instead of navigating Sidebar > Units > Search > 1205.
- Non-technical users still use the sidebar, but power users graduate to Cmd+K.

**Command Categories**:

| Category      | Examples                                              |
| ------------- | ----------------------------------------------------- |
| **Pages**     | "Dashboard", "Security Console", "Package Management" |
| **Units**     | "Unit 1205", "Unit 807"                               |
| **Residents** | "Sarah Chen", "Mike Johnson"                          |
| **Actions**   | "Create Announcement", "Log Package", "Book Amenity"  |
| **Settings**  | "Event Type Settings", "Notification Preferences"     |
| **Recent**    | Last 5 items accessed                                 |
| **Suggested** | AI-suggested actions: "3 packages awaiting release"   |

**Implementation Notes**:

```css
/* Command palette overlay */
.command-palette {
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

/* Command palette container */
.command-palette-container {
  width: 640px;
  max-height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

/* Search input */
.command-palette-input {
  width: 100%;
  height: 56px;
  padding: 0 20px;
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 17px;
  outline: none;
}

/* Result item */
.command-palette-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 100ms ease;
}

.command-palette-result:hover,
.command-palette-result--selected {
  background: var(--bg-secondary);
}

/* Category header */
.command-palette-category {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 12px 20px 4px;
}
```

---

## 12. Reference Product Analysis

### 12.1 Linear

**What to Steal**:

- Command palette as the universal access point (Cmd+K)
- Keyboard-first design: nearly every action has a shortcut
- Dimmed sidebar that lets content area stand out
- `?` shortcut to show searchable keyboard shortcut reference
- Collapsible sidebar via `[` shortcut
- Monochrome aesthetic with color reserved for status only
- Settings redesigned from the ground up for navigability
- Personalized sidebar with user-reorderable items

**What to Adapt**:

- Linear targets developers (technical); Concierge targets non-technical staff. Keyboard shortcuts are a power-user layer, not the primary interface.

### 12.2 Notion

**What to Steal**:

- Progressive disclosure via collapsible accordion sections
- Clean, minimal interface despite comprehensive feature set
- Tooltips and live previews guiding user selections
- Forms with conditional logic (Notion Forms 2025)
- Empty states that blend into the interface with simple monochrome illustrations
- Database views: same data rendered as table, board, calendar, gallery, or list

**What to Adapt**:

- Notion's flexibility (users build their own structure) is wrong for Concierge. Property management needs opinionated workflows, not blank canvases.

### 12.3 Stripe Dashboard

**What to Steal**:

- Payments table design: clean rows, hover-revealed actions, click-to-detail panel
- Filter bar pattern: primary filters inline, advanced filters behind toggle
- Dashboard structure: KPI cards top, detail views below, drill-down on click
- Search that spans all entity types (customers, invoices, products, etc.)
- Cursor-based pagination for large data sets
- Sigma (SQL-in-dashboard) concept for our advanced reporting module

**What to Adapt**:

- Stripe is a developer product. Concierge needs to be accessible to someone who has never used a SaaS product before.

### 12.4 Vercel Dashboard (2026 Redesign)

**What to Steal**:

- Resizable sidebar navigation
- "Projects as filters" = our "Buildings as context"
- Optimistic UI: show state change immediately before server confirms
- Skeleton screens over loading spinners
- Favicon + page title updating with deployment status = our notification badge approach
- Geist typeface philosophy: optimized for small sizes (12-14px) common in dashboards
- Mobile: floating bottom bar optimized for one-handed use
- Performance-first: 1.2s improvement to First Meaningful Paint during redesign

**What to Adapt**:

- Vercel's dark default theme contradicts our white-background mandate. Use their layout patterns, not their color system.

### 12.5 Clerk

**What to Steal**:

- Authentication UI components: split sign-in/sign-up, MFA flow, password reset
- Settings page architecture: categorized sidebar with "User & Authentication" groups
- Organization switching (maps to our building switching)
- Prebuilt UI components with customizable appearance API
- Multi-factor authentication flow design

**What to Adapt**:

- Clerk allows self-registration and SSO. Concierge does not. All accounts are admin-created.

### 12.6 Apple Human Interface Guidelines (2025-2026)

**What to Adopt**:

- **Clarity**: interfaces legible, precise, easy to understand
- **Deference**: UI helps users focus on content by minimizing clutter
- **Depth**: visual layers convey hierarchy
- Lists and tables: Apple's pattern for structured data presentation
- Navigation: hierarchical navigation with sidebars for complex apps
- 44x44px minimum touch target for all interactive elements
- `prefers-reduced-motion` respect for all animations

**Liquid Glass (2025)**: Apple introduced translucent, glass-like UI elements. For Concierge, we do NOT adopt the glass aesthetic (it contradicts our clean white backgrounds), but we do adopt the underlying principle of **hierarchy through depth and layering** (backdrop blur on modals, subtle elevation on popovers).

---

## 13. Dribbble & Behance Inspiration

### 13.1 Property Management Dashboards (Dribbble)

| Designer / Studio         | Key Pattern for Concierge                                         | Source          |
| ------------------------- | ----------------------------------------------------------------- | --------------- |
| Paperpillar               | KPI card grid layout, sidebar icon sizing, chart card arrangement | Figma Community |
| Ronas IT                  | Table-above-filter layout, row action alignment, filter bar       | Dribbble        |
| Jacek Szpaczek (Everyway) | Activity timeline alongside main content, stat number hierarchy   | Dribbble        |
| Madbrains Technologies    | Multi-page consistency, calendar integration, tenant card layout  | Dribbble        |
| Kevin Dukkon              | Navigation grouping hierarchy, badge count placement              | Dribbble        |
| Masum Parvej (Halal Lab)  | Property-level stat cards, revenue visualization patterns         | Dribbble        |

### 13.2 Behance

| Project                                     | Key Pattern for Concierge                                 |
| ------------------------------------------- | --------------------------------------------------------- |
| Property Management Dashboard UI (Sep 2025) | View mode toggle (grid vs. list), form layout consistency |
| Property Management Dashboard UI/UX Web App | Multi-step onboarding flow, tenant management table       |
| Property Management App UI/UX               | Mobile card patterns, status timeline for maintenance     |

### 13.3 Figma Community

| Template                             | Key Pattern                                            |
| ------------------------------------ | ------------------------------------------------------ |
| Property Management System Dashboard | Login + dashboard + onboarding as complete system      |
| Building Management Dashboard        | Building-specific metrics, floor plan visualizations   |
| Real Estate Management Dashboard     | Property portfolio overview, financial tracking        |
| Responsive Real Estate Admin         | Responsive breakpoints documented, admin CRUD patterns |

### 13.4 SaaS Dashboard Galleries

| Gallery        | Count                              | Key Insight                                                     |
| -------------- | ---------------------------------- | --------------------------------------------------------------- |
| SaaS Interface | 148+ dashboards                    | Enterprise SaaS favors card-based layouts with metric summaries |
| SaaS Frame     | 166 dashboards, 184 settings pages | Card-based with sidebar nav is the dominant pattern             |
| SaaS UI Design | 20+ pattern types                  | Real screenshots from Linear, Notion, Intercom for reference    |

---

## 14. Anti-Patterns to Avoid

### Confirmed by 2025-2026 Research

| Anti-Pattern                      | Why It Fails                                  | Our Solution                                    | Source              |
| --------------------------------- | --------------------------------------------- | ----------------------------------------------- | ------------------- |
| **Dark sidebars**                 | Reduce readability, compete with content area | Light sidebar on `--bg-secondary`               | Linear redesign     |
| **Gradient headers**              | Visual noise, distraction from data           | Flat white headers, typography hierarchy        | Apple HIG           |
| **Color-coded navigation**        | Confuses information hierarchy                | Monochromatic nav, color for status only        | Stripe              |
| **Dense tables < 48px rows**      | Overwhelms non-technical users                | 56px row height, generous padding               | Pencil & Paper      |
| **Pie charts for >5 items**       | Slices become unreadable                      | Donut charts, max 5 segments + "Other"          | UXPin               |
| **Animated dashboard widgets**    | Distracting for operational tools             | Static data, manual refresh                     | F1Studioz           |
| **Greyed-out gated features**     | Hostile UX                                    | Hide features entirely if unavailable           | Competitor research |
| **Multi-level dropdown menus**    | Confusing, especially for non-technical users | Command palette (Cmd+K) for deep navigation     | Linear              |
| **Auto-playing carousels**        | Users miss content, accessibility nightmare   | Static card grids with "View all" links         | Apple HIG           |
| **Infinite scroll on tables**     | Loses position, not bookmarkable              | Pagination with page numbers, 25 rows default   | Stripe              |
| **Modals within modals**          | Confuses context, traps users                 | Max 1 modal; use slide-over panel for secondary | W3C ARIA            |
| **Spinners for page loads**       | No content preview, higher perceived wait     | Skeleton screens matching layout                | Vercel              |
| **"Oops!" or "Uh oh!" in errors** | Unprofessional for building management        | Clear, professional error language              | Carbon DS           |
| **Self-registration**             | Security risk for condo environments          | Admin-controlled account creation only          | Concierge policy    |
| **Email-only notifications**      | Residents miss critical info                  | Multi-channel: email + SMS + push + voice       | Competitor gap      |

---

## 15. 2026 Design Trend Alignment

### Trends We Adopt

| Trend                                           | How We Apply It                                                 |
| ----------------------------------------------- | --------------------------------------------------------------- |
| **Command palettes as universal access**        | Cmd+K searches pages, units, residents, actions                 |
| **Role-based experience design**                | Different interfaces per role, not just permission gating       |
| **Progressive disclosure elevated to art form** | Advanced features sequenced carefully, not removed              |
| **AI-powered insights in dashboards**           | Anomaly detection, auto-categorization, natural language search |
| **Optimistic UI**                               | Show state change immediately, sync in background               |
| **Skeleton screens over spinners**              | Every component has a `.Skeleton` variant                       |
| **Type-safe form validation**                   | React Hook Form + Zod for all forms                             |
| **Keyboard-first as power-user layer**          | Full shortcut system for experienced staff                      |

### Trends We Reject

| Trend                                     | Why We Reject It                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| **Liquid Glass / translucent UI**         | Contradicts clean white backgrounds; adds visual noise                    |
| **Dark mode as default**                  | Property management is a daytime workflow; white backgrounds are standard |
| **Bento grid layouts**                    | Too trendy, not functional for data-dense property management             |
| **Animated microinteractions everywhere** | Distracting for operational speed; only animate for feedback              |
| **AI chatbot as primary interface**       | Staff need structured workflows, not conversational UI                    |

---

_This document should be reviewed quarterly to incorporate new design trends._
_Next review: June 2026_
