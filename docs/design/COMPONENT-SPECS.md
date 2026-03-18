# Concierge — Component Specifications (Cross-PRD Reference)

> **Purpose**: Map every UI component to where it is used across all PRDs, with props/variants,
> states, and accessibility requirements. This document complements `COMPONENT-CATALOG.md`
> (which defines implementation details) by providing the cross-referencing and traceability layer.
>
> **Design Constraints**: Desktop monitors (1920x1080 primary). Non-technical users.
> White backgrounds. Color only for status and actions.
>
> **Tech Stack**: Next.js 15, Tailwind CSS 4.x, Radix UI, Framer Motion (Motion).
> **Accessibility Target**: WCAG 2.2 AA minimum.
>
> **Last Updated**: 2026-03-17

---

## Table of Contents

1. [Primitives](#1-primitives) (15 components)
2. [Data Display](#2-data-display) (18 components)
3. [Feedback & Communication](#3-feedback--communication) (12 components)
4. [Navigation](#4-navigation) (12 components)
5. [Layout](#5-layout) (10 components)
6. [Forms](#6-forms) (14 components)
7. [Specialized — Domain](#7-specialized--domain) (16 components)
8. [Composite Patterns](#8-composite-patterns) (12 components)
9. [Business Operations](#9-business-operations) (14 components)
10. [Cross-PRD Usage Matrix](#10-cross-prd-usage-matrix)

**Total: 123 components**

---

## Conventions

### State Definitions

Every interactive component supports these states unless noted otherwise:

| State              | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| **Default**        | Normal resting state                                           |
| **Hover**          | Mouse cursor over the element (desktop). 150ms ease transition |
| **Active/Pressed** | Element being clicked or tapped. Scale 0.98 feedback           |
| **Focus**          | Keyboard focus. 3px `--accent-subtle` ring at 3px offset       |
| **Disabled**       | Non-interactive. 50% opacity. `cursor: not-allowed`            |
| **Loading**        | Async operation in progress. Spinner or skeleton replacement   |
| **Error**          | Validation or API failure. Red border/text                     |
| **Readonly**       | Visible but not editable. Gray background                      |

### Size Scale

| Size | Typical Height | Use Case                                    |
| ---- | -------------- | ------------------------------------------- |
| `sm` | 32px           | Dense tables, compact forms, inline actions |
| `md` | 40-44px        | Standard forms, buttons, inputs             |
| `lg` | 48-52px        | Hero actions, onboarding, prominent inputs  |

### Accessibility Baseline

All components meet these requirements:

- 44x44px minimum touch target for interactive elements
- 4.5:1 contrast ratio for text (3:1 for large text and UI components)
- Focus ring: 3px `--accent` with `--accent-subtle` fill
- `prefers-reduced-motion: reduce` disables all spring/tween animations
- Screen reader announcements for dynamic content via `aria-live`
- Full keyboard operability via Tab, Enter, Space, Arrow keys, Escape

---

## 1. Primitives

### 1.1 Button

| Attribute         | Specification                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `variant`: primary / secondary / ghost / danger; `size`: sm / md / lg; `leftIcon`, `rightIcon`: ReactNode; `loading`: boolean; `loadingText`: string; `fullWidth`: boolean; `asChild`: boolean |
| **Variants**      | Primary (accent bg, white text), Secondary (white bg, border), Ghost (transparent, accent text), Danger (red bg, white text)                                                                   |
| **States**        | Default, Hover (lighter/darker bg), Active (scale 0.98), Focus (accent ring), Disabled (50% opacity), Loading (spinner replaces icon)                                                          |
| **Used In**       | All 28 PRDs — universal action trigger                                                                                                                                                         |
| **Accessibility** | `role="button"`, `aria-disabled`, `aria-busy` when loading. Loading announces via `aria-live="polite"`                                                                                         |

### 1.2 Input

| Attribute         | Specification                                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `type`: text / email / password / number / tel / url / search; `size`: sm / md / lg; `leftIcon`, `rightIcon`, `rightElement`: ReactNode; `error`: boolean; `readOnly`: boolean; `maxLength`: number |
| **States**        | Default, Hover (darker border), Focus (accent border + ring), Filled, Error (red border + ring), Disabled (gray bg), Readonly (gray bg, no interaction)                                             |
| **Used In**       | PRD 03-28 — every form across all modules                                                                                                                                                           |
| **Accessibility** | Must pair with `<label>` or `aria-label`. `aria-invalid` on error. `aria-describedby` for help/error text                                                                                           |

### 1.3 Textarea

| Attribute         | Specification                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `rows`: number; `maxLength`: number; `autoResize`: boolean; `maxHeight`: number; `showCharCount`: boolean; `error`: boolean             |
| **States**        | Default, Focus, Error, Disabled, Readonly. Character count colors: tertiary (0-89%), warning (90-99%), error (100%)                     |
| **Used In**       | PRD 03 (incident details), PRD 05 (maintenance description — 4000 char), PRD 09 (announcement body), PRD 12 (classified ad description) |
| **Accessibility** | `aria-invalid` on error. Character count announced at 90% via `aria-live="polite"`                                                      |

### 1.4 Select

| Attribute         | Specification                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `size`: sm / md / lg; `options`: {value, label, icon?, disabled?, group?}[]; `placeholder`: string; `error`: boolean                                                                 |
| **States**        | Default, Hover, Focus, Open (dropdown visible), Error, Disabled                                                                                                                      |
| **Used In**       | PRD 03 (event type, status filter), PRD 04 (courier selection), PRD 05 (category — 43 options), PRD 06 (amenity selection), PRD 07 (floor/building), PRD 16 (all settings dropdowns) |
| **Accessibility** | Radix Select. Arrow keys navigate, Enter selects, Escape closes. Type-ahead support                                                                                                  |

### 1.5 Checkbox

| Attribute         | Specification                                                                                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `checked`, `indeterminate`, `label`, `description`, `error`                                                                                                                        |
| **States**        | Unchecked, Checked (accent fill + check icon), Indeterminate (accent fill + minus), Hover, Focus, Disabled, Error                                                                  |
| **Used In**       | PRD 03 (bulk event selection), PRD 06 (amenity filter), PRD 07 (table row selection), PRD 08 (permission toggles), PRD 09 (notification channel selection), PRD 16 (feature flags) |
| **Accessibility** | Radix Checkbox. `aria-checked="mixed"` for indeterminate. Space toggles                                                                                                            |

### 1.6 Radio

| Attribute         | Specification                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `options`: {value, label, description?, disabled?}[]; `orientation`: horizontal / vertical; `error`                                                |
| **States**        | Unselected, Selected (accent ring + filled dot), Hover, Focus, Disabled                                                                            |
| **Used In**       | PRD 05 (priority selection), PRD 06 (booking time preference), PRD 09 (distribution channel), PRD 13 (violation type), PRD 23 (onboarding choices) |
| **Accessibility** | Radix RadioGroup. Arrow keys cycle options. Tab moves to group                                                                                     |

### 1.7 Toggle (Switch)

| Attribute         | Specification                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `checked`, `size`: sm / md; `label`, `description`                                                                                                                 |
| **States**        | Off (gray track, left knob), On (accent track, right knob), Hover, Disabled                                                                                        |
| **Used In**       | PRD 08 (2FA enable), PRD 09 (notification preferences per channel), PRD 16 (feature toggles, all boolean settings), PRD 21 (demo mode toggle), PRD 24 (auto-renew) |
| **Accessibility** | Radix Switch. `role="switch"`, `aria-checked`. Space/Enter toggles                                                                                                 |

### 1.8 DatePicker

| Attribute         | Specification                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `value`: Date; `minDate`, `maxDate`: Date; `disabledDates`: Date[] or function; `format`: string; `clearable`: boolean; `range`: boolean                         |
| **States**        | Default, Focus (calendar open), Selected, Error, Disabled                                                                                                        |
| **Used In**       | PRD 03 (event date filter), PRD 05 (maintenance due date), PRD 06 (booking date), PRD 10 (report date range), PRD 13 (permit expiry), PRD 28 (compliance period) |
| **Accessibility** | Calendar grid with arrow key navigation. Today button. Screen reader announces selected date                                                                     |

### 1.9 TimePicker

| Attribute         | Specification                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Props**         | `value`: string (HH:mm); `format`: 12h / 24h; `minuteStep`: 15 / 30 / 60; `minTime`, `maxTime` |
| **States**        | Default, Focus, Selected, Error, Disabled                                                      |
| **Used In**       | PRD 06 (booking start/end time), PRD 03 (incident time), PRD 09 (announcement schedule)        |
| **Accessibility** | Arrow keys increment/decrement. Type-ahead for hour/minute                                     |

### 1.10 FileUpload

| Attribute         | Specification                                                                                                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `accept`: string[]; `maxSize`: number (bytes); `maxFiles`: number; `multiple`: boolean; `preview`: boolean                                                                                                                        |
| **States**        | Default (dashed border zone), Drag-over (accent border, accent-subtle bg), Uploading (progress bar), Complete (file list with remove), Error (red border + message)                                                               |
| **Used In**       | PRD 05 (maintenance photos — JPG/PNG/GIF/HEIC, 4MB), PRD 07 (resident documents), PRD 09 (announcement attachments), PRD 11 (training course materials), PRD 12 (classified ad images), PRD 16 (logo upload), PRD 27 (CSV import) |
| **Accessibility** | Keyboard-activatable drop zone. Progress announced via `aria-live`. File list with remove buttons                                                                                                                                 |

### 1.11 Combobox (Autocomplete)

| Attribute         | Specification                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `options`: dynamic; `onSearch`: function; `multiple`: boolean; `creatable`: boolean; `loading`: boolean                                                 |
| **States**        | Default, Focus + dropdown open, Searching (spinner), No results, Error, Disabled                                                                        |
| **Used In**       | PRD 03 (unit search for event), PRD 04 (resident search for package), PRD 05 (equipment search), PRD 07 (resident search), PRD 15 (global search input) |
| **Accessibility** | Radix Combobox. `role="combobox"`, `aria-expanded`, `aria-activedescendant`. Type-ahead filters                                                         |

### 1.12 Slider

| Attribute         | Specification                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Props**         | `min`, `max`, `step`, `value`, `range`: boolean (dual thumb); `showValue`: boolean          |
| **States**        | Default, Hover (thumb scales), Active (accent thumb), Focus (ring on thumb), Disabled       |
| **Used In**       | PRD 10 (date range slider on reports), PRD 24 (unit count slider for pricing tier)          |
| **Accessibility** | Arrow keys adjust value. `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |

### 1.13 Avatar

| Attribute         | Specification                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `src`: string; `fallback`: string (initials); `size`: sm(28px) / md(36px) / lg(48px) / xl(64px); `status`: online / offline / away / busy |
| **States**        | Image loaded, Fallback (initials on accent-subtle bg), Loading (skeleton circle)                                                          |
| **Used In**       | PRD 07 (resident profile), PRD 08 (user list), PRD 14 (dashboard user greeting), PRD 03 (created-by on events)                            |
| **Accessibility** | `alt` text with user's name. Status dot has `aria-label`                                                                                  |

### 1.14 IconButton

| Attribute         | Specification                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Props**         | `icon`: ReactNode; `size`: sm(28px) / md(36px) / lg(44px); `variant`: default / ghost / danger; `tooltip`: string |
| **States**        | Default (bg-secondary bg), Hover (bg-tertiary), Active (scale 0.95), Focus (ring), Disabled                       |
| **Used In**       | All PRDs — table row actions (...), close buttons (x), sidebar collapse, notification bell                        |
| **Accessibility** | `aria-label` required (no visible text). Tooltip on hover/focus                                                   |

### 1.15 Tag / Chip

| Attribute         | Specification                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `label`: string; `variant`: default / accent / status; `removable`: boolean; `size`: sm / md                                                       |
| **States**        | Default, Hover (if removable: X appears), Focus (ring on chip), Removing (fade out)                                                                |
| **Used In**       | PRD 03 (event type tags), PRD 05 (maintenance category tags), PRD 06 (amenity tags), PRD 15 (search filter tags), PRD 27 (CSV column mapping tags) |
| **Accessibility** | `role="option"` in multi-select. Remove button has `aria-label="Remove {label}"`                                                                   |

---

## 2. Data Display

### 2.1 DataTable

| Attribute         | Specification                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `columns`: ColumnDef[]; `data`: T[]; `sortable`: boolean; `selectable`: boolean; `pagination`: {pageSize: 25, totalCount}; `stickyHeader`: boolean; `onRowClick`: function; `loading`: boolean; `emptyState`: ReactNode                                                                                                                                                                |
| **Variants**      | Standard (full-width), Compact (sm rows for settings), Expandable (row click expands detail)                                                                                                                                                                                                                                                                                           |
| **States**        | Default, Loading (5 skeleton rows), Empty (empty state illustration), Error (retry card), Sorted (arrow indicator on column), Filtered (active filter count), Selected (checkbox + floating action bar)                                                                                                                                                                                |
| **Used In**       | PRD 03 (event log stream), PRD 04 (package list), PRD 05 (service request list), PRD 07 (unit list, resident list), PRD 08 (user list), PRD 10 (report results), PRD 11 (training course list), PRD 12 (classified ads list), PRD 13 (parking permits), PRD 16 (settings lists), PRD 24 (invoice list), PRD 26 (API key list), PRD 27 (migration log), PRD 28 (compliance report list) |
| **Accessibility** | `role="grid"` with `aria-sort` on columns. Column headers as `role="columnheader"`. Row navigation via Arrow keys. Announce sort change via `aria-live`                                                                                                                                                                                                                                |

### 2.2 StatusBadge

| Attribute         | Specification                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `status`: success / warning / error / info / pending / neutral; `label`: string; `dot`: boolean (default true); `size`: sm / md                                                                                                                                                                                                                      |
| **States**        | Static (no interaction). Dot + text + background triple-encoding                                                                                                                                                                                                                                                                                     |
| **Used In**       | PRD 03 (event status), PRD 04 (package status: Checked In/Released/Returned), PRD 05 (request status: Open/Hold/Closed), PRD 06 (booking status: Pending/Approved/Declined), PRD 07 (unit status: Active/Vacant), PRD 08 (user status: Active/Suspended/Locked), PRD 13 (violation status), PRD 24 (subscription status), PRD 28 (compliance status) |
| **Accessibility** | Text is always present (never color-only). `role="status"` for dynamic updates                                                                                                                                                                                                                                                                       |

### 2.3 KPICard (StatCard)

| Attribute         | Specification                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `title`: string; `value`: number / string; `trend`: {direction: up/down/flat, percentage: number, period: string}; `sparkline`: number[] (optional); `icon`: ReactNode; `onClick`: function |
| **States**        | Default, Hover (shadow elevation), Loading (skeleton), Error (retry)                                                                                                                        |
| **Used In**       | PRD 14 (all role dashboards — 4-8 KPIs per role), PRD 10 (report summary cards), PRD 24 (billing overview: MRR, active properties, churn), PRD 28 (compliance score cards)                  |
| **Accessibility** | `role="link"` if clickable. Trend direction announced: "Open requests: 12, up 15% from last week"                                                                                           |

### 2.4 Chart (Line / Bar / Donut / Sparkline)

| Attribute         | Specification                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `type`: line / bar / donut / sparkline; `data`: SeriesData[]; `height`: number; `interactive`: boolean; `showLegend`: boolean; `showTooltip`: boolean; `showTable`: boolean (toggle) |
| **Variants**      | Line (max 3 series), Bar (horizontal for categories, vertical for time), Donut (max 5 segments + Other), Sparkline (no axes, inline in KPI cards)                                    |
| **States**        | Default, Hover (tooltip with exact value), Loading (skeleton), Empty ("No data for this period"), Error, Table view (toggled)                                                        |
| **Used In**       | PRD 10 (39+ report types with charts), PRD 14 (dashboard charts: maintenance by month, package trends, amenity usage), PRD 24 (revenue charts), PRD 28 (compliance trends)           |
| **Accessibility** | "Show as table" toggle always available. Chart data accessible in table format for screen readers. Colors from visualization palette with sufficient contrast                        |

### 2.5 ActivityFeed

| Attribute         | Specification                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `items`: {icon, title, description, timestamp, actor}[]; `maxItems`: number; `showViewAll`: boolean; `realtime`: boolean (WebSocket) |
| **States**        | Default, Loading (skeleton), Empty, New item (slide-in animation)                                                                    |
| **Used In**       | PRD 03 (event stream — primary view), PRD 14 (dashboard activity widget), PRD 07 (unit activity history), PRD 08 (login audit trail) |
| **Accessibility** | `aria-live="polite"` for new items. Each item is a landmark with timestamp                                                           |

### 2.6 Timeline

| Attribute         | Specification                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: {date, title, description, status, icon}[]; `orientation`: vertical / horizontal                                                                                 |
| **States**        | Default, Loading, Empty                                                                                                                                                   |
| **Used In**       | PRD 03 (incident escalation timeline), PRD 04 (package lifecycle: checked-in > stored > released), PRD 05 (service request history), PRD 13 (parking violation lifecycle) |
| **Accessibility** | Ordered list with `aria-label="Timeline"`. Each step indicates completion status                                                                                          |

### 2.7 Calendar

| Attribute         | Specification                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `view`: month / week / day; `events`: CalendarEvent[]; `onDateClick`, `onEventClick`: function; `colorMap`: {category: color}; `selectable`: boolean |
| **States**        | Default, Loading, Empty (no events), Today highlight, Selected date, Event hover (popover)                                                           |
| **Used In**       | PRD 06 (amenity booking calendar — primary), PRD 14 (dashboard upcoming events), PRD 11 (training schedule), PRD 12 (community events)               |
| **Accessibility** | Full keyboard navigation (arrow keys for days, Tab for events). `role="grid"`. Each cell announces date and event count                              |

### 2.8 MiniCalendar

| Attribute         | Specification                                                                       |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Props**         | `value`: Date; `events`: Date[] (dots); `onDateClick`: function                     |
| **States**        | Default, Today (accent circle), Selected (accent ring), Has events (dot below date) |
| **Used In**       | PRD 06 (amenity booking sidebar filter), PRD 14 (dashboard date navigator)          |
| **Accessibility** | Same keyboard navigation as full Calendar                                           |

### 2.9 InfoCard

| Attribute         | Specification                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `title`, `description`, `icon`, `action`: {label, onClick}, `variant`: default / highlight / warning                        |
| **States**        | Default, Hover (if clickable), Dismissible (close button)                                                                   |
| **Used In**       | PRD 14 (AI briefing card), PRD 23 (onboarding tips), PRD 25 (help center contextual help), PRD 21 (demo environment banner) |
| **Accessibility** | `role="region"` with `aria-label`. Dismiss button has `aria-label="Dismiss"`                                                |

### 2.10 DataList (Key-Value Pairs)

| Attribute         | Specification                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: {label, value, copyable?, editable?, icon?}[]; `columns`: 1 / 2 / 3                                                                    |
| **States**        | Default, Editable (hover reveals edit icon), Copied (toast confirmation)                                                                        |
| **Used In**       | PRD 07 (unit detail fields), PRD 08 (user profile details), PRD 03 (event detail view), PRD 24 (subscription details), PRD 26 (API key details) |
| **Accessibility** | `<dl>`, `<dt>`, `<dd>` semantic markup. Copy button has `aria-label="Copy {label}"`                                                             |

### 2.11 EmptyState

| Attribute         | Specification                                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `illustration`: ReactNode; `headline`: string; `description`: string; `action`: {label, onClick}; `secondaryAction`: {label, href}; `variant`: first-use / no-results / cleared / error / permission |
| **States**        | Static with staggered fade-in animation (illustration > text > button)                                                                                                                               |
| **Used In**       | All PRDs — every list, table, and section requires a designed empty state                                                                                                                            |
| **Accessibility** | Heading level matches page hierarchy. CTA is focusable. Description uses `aria-describedby`                                                                                                          |

### 2.12 Skeleton

| Attribute         | Specification                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Props**         | `width`, `height`: number / string; `variant`: text / circle / rect / card / table-row   |
| **States**        | Shimmer animation (1.5s linear infinite). Reduced motion: static gray                    |
| **Used In**       | All PRDs — every component has a `.Skeleton` variant matching its dimensions             |
| **Accessibility** | `aria-hidden="true"`. Parent container has `aria-busy="true"` and `aria-label="Loading"` |

### 2.13 Tooltip

| Attribute         | Specification                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `content`: string / ReactNode; `side`: top / right / bottom / left; `delayDuration`: number (default 400ms); `sideOffset`: number (default 4px) |
| **States**        | Hidden, Visible (fade in 150ms)                                                                                                                 |
| **Used In**       | All PRDs — icon buttons, truncated text, status badges, chart data points                                                                       |
| **Accessibility** | Radix Tooltip. `role="tooltip"`. Trigger has `aria-describedby` linked to tooltip content. Appears on focus (keyboard) and hover (mouse)        |

### 2.14 Popover

| Attribute         | Specification                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `trigger`: ReactNode; `content`: ReactNode; `side`, `align`: Radix positioning; `modal`: boolean                                      |
| **States**        | Closed, Open (fade + scale animation 150ms)                                                                                           |
| **Used In**       | PRD 06 (booking detail popover on calendar), PRD 14 (KPI card drill-down), PRD 08 (user quick profile), PRD 03 (event detail preview) |
| **Accessibility** | Radix Popover. Focus trap when modal. Escape closes. `aria-expanded` on trigger                                                       |

### 2.15 ProgressBar

| Attribute         | Specification                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `value`: number (0-100); `variant`: default / success / warning / error; `showLabel`: boolean; `size`: sm / md / lg; `indeterminate`: boolean |
| **States**        | Default, Indeterminate (animated stripe), Complete (100%, success color)                                                                      |
| **Used In**       | PRD 11 (training course progress), PRD 23 (onboarding wizard progress), PRD 27 (data migration progress), PRD 10 (file upload progress)       |
| **Accessibility** | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Label announced via `aria-label`                                     |

### 2.16 CountBadge

| Attribute         | Specification                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `count`: number; `max`: number (default 99, shows "99+"); `variant`: accent / error / neutral; `dot`: boolean (no number, just indicator) |
| **States**        | Static. Animates count change (scale bounce)                                                                                              |
| **Used In**       | PRD 14 (notification bell badge), PRD 15 (sidebar nav item counts), PRD 03 (unread events)                                                |
| **Accessibility** | `aria-label="{count} notifications"` or similar context                                                                                   |

### 2.17 TrendIndicator

| Attribute         | Specification                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `direction`: up / down / flat; `value`: string (e.g., "+12%"); `period`: string (e.g., "vs last week"); `positive`: boolean (determines color: green up / red down, or reverse for negative metrics like "open issues") |
| **States**        | Static                                                                                                                                                                                                                  |
| **Used In**       | PRD 14 (KPI cards), PRD 10 (report summary), PRD 24 (billing KPIs)                                                                                                                                                      |
| **Accessibility** | Full text readable: "Up 12% versus last week"                                                                                                                                                                           |

### 2.18 AvatarGroup

| Attribute         | Specification                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Props**         | `users`: {name, src}[]; `max`: number (default 3); `size`: sm / md / lg                             |
| **States**        | Stacked avatars with +N overflow. Hover on overflow shows tooltip with remaining names              |
| **Used In**       | PRD 07 (unit occupants), PRD 06 (booking participants), PRD 03 (real-time collaboration indicators) |
| **Accessibility** | `aria-label="3 users: Sarah Chen, Mike Johnson, and 2 more"`                                        |

---

## 3. Feedback & Communication

### 3.1 Toast

| Attribute         | Specification                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `variant`: success / error / warning / info; `title`: string; `description`: string; `action`: {label, onClick}; `duration`: number (default 4000ms); `dismissible`: boolean |
| **States**        | Entering (slide from right + fade), Visible, Exiting (fade out). Max 3 stacked                                                                                               |
| **Used In**       | All PRDs — success confirmations, error alerts, undo actions                                                                                                                 |
| **Accessibility** | `role="alert"` for errors, `role="status"` for success. `aria-live="polite"`. Dismiss button accessible. Auto-dismiss pauses on hover                                        |

### 3.2 Banner

| Attribute         | Specification                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `variant`: info / warning / error / success; `message`: string; `action`: {label, onClick}; `dismissible`: boolean; `persistent`: boolean     |
| **States**        | Visible, Dismissed (slide up + fade)                                                                                                          |
| **Used In**       | PRD 08 (account locked banner), PRD 17 (offline banner), PRD 21 (demo mode banner), PRD 24 (subscription expiring), PRD 28 (compliance alert) |
| **Accessibility** | `role="alert"` for errors. Dismiss button has `aria-label="Dismiss banner"`                                                                   |

### 3.3 Alert / Callout

| Attribute         | Specification                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `variant`: info / warning / error / success / neutral; `title`: string; `description`: string; `icon`: ReactNode                           |
| **States**        | Static                                                                                                                                     |
| **Used In**       | PRD 16 (settings warnings), PRD 23 (onboarding guidance), PRD 24 (billing alerts), PRD 25 (help center tips), PRD 28 (compliance warnings) |
| **Accessibility** | `role="alert"` for error/warning. `role="note"` for info. Icon has `aria-hidden` (text conveys meaning)                                    |

### 3.4 ConfirmDialog

| Attribute         | Specification                                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `title`, `description`: string; `confirmLabel`, `cancelLabel`: string; `variant`: default / danger; `requireTyping`: boolean (for permanent deletes); `typingTarget`: string |
| **States**        | Open (focus trap), Confirming (button loading), Closed                                                                                                                       |
| **Used In**       | All PRDs with delete/destructive actions — PRD 03 (delete event), PRD 07 (remove resident), PRD 08 (suspend user), PRD 16 (reset settings)                                   |
| **Accessibility** | `role="alertdialog"`. Focus on cancel button by default (safe option). `aria-describedby` links to description                                                               |

### 3.5 NotificationPanel

| Attribute         | Specification                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Props**         | `notifications`: {icon, title, description, timestamp, read, onClick}[]; `onMarkAllRead`: function |
| **States**        | Closed, Open (320px slide-in from right), Empty, Loading                                           |
| **Used In**       | PRD 09 (notification center), PRD 14 (dashboard bell icon), PRD 15 (global notification access)    |
| **Accessibility** | `role="dialog"`. Items as `role="listitem"`. Unread items announced                                |

### 3.6 OfflineBanner

| Attribute         | Specification                                                                        |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Props**         | `message`: string (default "You're offline. Changes will sync when reconnected.")    |
| **States**        | Visible (persistent top banner when offline), Hidden (auto-dismiss when reconnected) |
| **Used In**       | PRD 17 (mobile/PWA offline support)                                                  |
| **Accessibility** | `role="alert"`, `aria-live="assertive"`                                              |

### 3.7 InlineMessage

| Attribute         | Specification                                                                   |
| ----------------- | ------------------------------------------------------------------------------- |
| **Props**         | `variant`: info / warning / error / success; `message`: string; `icon`: boolean |
| **States**        | Static. Appears below form fields on validation                                 |
| **Used In**       | All form PRDs — field-level validation messages                                 |
| **Accessibility** | Linked to input via `aria-describedby`. `role="alert"` for errors               |

### 3.8 ShiftHandoffCard

| Attribute         | Specification                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Props**         | `counts`: {visitors, packagesOut, keysOut, pendingBookings}; `notes`: string; `previousShift`: {name, endTime} |
| **States**        | Default, Expanded (show full notes), Loading                                                                   |
| **Used In**       | PRD 03 (security console shift start), PRD 14 (security dashboard)                                             |
| **Accessibility** | `role="region"`, `aria-label="Shift handoff summary"`                                                          |

### 3.9 AIBriefingCard

| Attribute         | Specification                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Props**         | `summary`: string; `insights`: {type, message, priority}[]; `timestamp`: Date; `loading`: boolean |
| **States**        | Default, Loading (skeleton), Error (AI unavailable — fallback to standard KPIs), Expanded         |
| **Used In**       | PRD 14 (property manager dashboard), PRD 19 (AI framework daily briefing)                         |
| **Accessibility** | `role="region"`, `aria-label="AI daily briefing"`. Each insight item readable                     |

### 3.10 WeatherWidget

| Attribute         | Specification                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Props**         | `current`: {temp, condition, icon}; `forecast`: DayForecast[]; `alerts`: {message, severity}[] |
| **States**        | Default, Loading, Error (location unavailable), Alert (storm/snow warning)                     |
| **Used In**       | PRD 14 (dashboard weather widget)                                                              |
| **Accessibility** | `role="region"`, `aria-label="Weather"`. Alert conditions announced via `aria-live`            |

### 3.11 AnomalyBadge

| Attribute         | Specification                                                        |
| ----------------- | -------------------------------------------------------------------- |
| **Props**         | `message`: string; `severity`: low / medium / high; `metric`: string |
| **States**        | Default (pulsing dot for high severity), Dismissed                   |
| **Used In**       | PRD 14 (dashboard KPI anomaly detection), PRD 19 (AI framework)      |
| **Accessibility** | `role="alert"` for high severity. Text describes the anomaly         |

### 3.12 CollaborationIndicator

| Attribute         | Specification                                                                       |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Props**         | `users`: {name, avatar}[]; `resourceType`: string                                   |
| **States**        | Visible (avatar stack with "Sarah is also viewing this"), Hidden (no other viewers) |
| **Used In**       | PRD 03 (event detail view), PRD 05 (service request detail), PRD 07 (unit file)     |
| **Accessibility** | `aria-label="Sarah Chen and Mike Johnson are also viewing this"`                    |

---

## 4. Navigation

### 4.1 Sidebar

| Attribute         | Specification                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: NavItem[]; `collapsed`: boolean; `onCollapse`: function; `userProfile`: {name, role, building, avatar}                                |
| **States**        | Expanded (240px), Collapsed (64px, icon-only with tooltips), Mobile overlay (full-width slide-over)                                            |
| **Used In**       | All PRDs — global navigation. PRD 02 (role-based visibility), PRD 15 (search and navigation)                                                   |
| **Accessibility** | `nav` landmark with `aria-label="Main navigation"`. Items as links. Active item `aria-current="page"`. `[` shortcut announced via help overlay |

### 4.2 TopBar (Header)

| Attribute         | Specification                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `pageTitle`: string; `breadcrumbs`: {label, href}[]; `actions`: ReactNode; `greeting`: string                          |
| **States**        | Default, Scrolled (subtle shadow appears), Mobile (hamburger trigger)                                                  |
| **Used In**       | All PRDs — persistent page header                                                                                      |
| **Accessibility** | `header` landmark. Breadcrumbs as `nav` with `aria-label="Breadcrumb"`. `<ol>` with `aria-current="page"` on last item |

### 4.3 CommandPalette

| Attribute         | Specification                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `categories`: {label, items: {icon, title, description, action}[]}[]; `recentItems`: Item[]; `suggestedItems`: Item[]                                                                                   |
| **States**        | Closed, Open (overlay with search), Searching (results updating), No results, Loading                                                                                                                   |
| **Used In**       | PRD 15 (global search — primary). Accessible from every page                                                                                                                                            |
| **Accessibility** | `role="dialog"`. Input has `role="combobox"`. Results as `role="listbox"`. Arrow keys navigate, Enter selects, Escape closes. Announced: "Command palette, search pages, units, residents, and actions" |

### 4.4 Breadcrumbs

| Attribute         | Specification                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: {label, href, current?}[]; `separator`: ReactNode (default /)                             |
| **States**        | Static. Current item is non-linked text                                                            |
| **Used In**       | All module detail pages — PRD 07 (Bond Tower > Units > 1205), PRD 05 (Maintenance > Request #4521) |
| **Accessibility** | `nav` with `aria-label="Breadcrumb"`. `<ol>` structure. Current: `aria-current="page"`             |

### 4.5 Tabs

| Attribute         | Specification                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: {label, value, icon?, count?, disabled?}[]; `value`: string; `variant`: underline / pill / segmented                                                                 |
| **States**        | Default, Active (underline or fill), Hover, Disabled, Focus                                                                                                                   |
| **Used In**       | PRD 07 (unit file tabs: Overview/Residents/Events/Maintenance/Documents), PRD 08 (user profile tabs), PRD 16 (settings category tabs), PRD 06 (calendar view: Month/Week/Day) |
| **Accessibility** | Radix Tabs. `role="tablist"` + `role="tab"` + `role="tabpanel"`. Arrow keys navigate tabs. Tab key enters panel                                                               |

### 4.6 SegmentedControl

| Attribute         | Specification                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Props**         | `options`: {label, value, icon?}[]; `value`: string; `size`: sm / md / lg                        |
| **States**        | Active segment (accent bg, white text), Inactive (bg-secondary, text-secondary), Hover, Focus    |
| **Used In**       | PRD 06 (Month/Week/Day view toggle), PRD 10 (chart/table toggle), PRD 14 (dashboard time period) |
| **Accessibility** | `role="radiogroup"`. Arrow keys switch. `aria-pressed` on active                                 |

### 4.7 Pagination

| Attribute         | Specification                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `currentPage`, `totalPages`, `pageSize`, `totalCount`: number; `onPageChange`, `onPageSizeChange`: function; `showPageSize`: boolean |
| **States**        | Default, First page (prev disabled), Last page (next disabled), Loading                                                              |
| **Used In**       | All table views — PRD 03-28 wherever DataTable is used                                                                               |
| **Accessibility** | `nav` with `aria-label="Pagination"`. Current page: `aria-current="page"`. Page buttons as links                                     |

### 4.8 StepIndicator

| Attribute         | Specification                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Props**         | `steps`: {label, description?}[]; `currentStep`: number; `orientation`: horizontal / vertical        |
| **States**        | Completed (accent fill + check), Current (accent ring), Future (gray)                                |
| **Used In**       | PRD 23 (onboarding wizard — 8 steps), PRD 04 (package release flow), PRD 05 (maintenance escalation) |
| **Accessibility** | `role="navigation"`, `aria-label="Progress"`. Each step: `aria-current="step"` for current           |

### 4.9 BottomTabBar (Mobile)

| Attribute         | Specification                                                                  |
| ----------------- | ------------------------------------------------------------------------------ |
| **Props**         | `items`: {icon, label, href, badge?}[]; `centerAction`: {icon, label, onClick} |
| **States**        | Active (accent color), Inactive (text-secondary), Badge (count dot)            |
| **Used In**       | PRD 17 (mobile responsive — bottom nav for mobile)                             |
| **Accessibility** | `nav` with `aria-label="Mobile navigation"`. Center action has `aria-label`    |

### 4.10 ViewSwitcher

| Attribute         | Specification                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Props**         | `views`: {icon, label, value}[]; `value`: string; `onChange`: function                        |
| **States**        | Active view (accent bg), Inactive, Hover                                                      |
| **Used In**       | PRD 03 (grid/list/timeline view), PRD 06 (calendar views), PRD 12 (grid/list for classifieds) |
| **Accessibility** | `role="radiogroup"`. `aria-label="View options"`                                              |

### 4.11 BackButton

| Attribute         | Specification                                                         |
| ----------------- | --------------------------------------------------------------------- |
| **Props**         | `label`: string (default "Back"); `href`: string; `onClick`: function |
| **States**        | Default, Hover (underline), Focus                                     |
| **Used In**       | All detail/edit pages — return to list view                           |
| **Accessibility** | `aria-label="Go back to {parent page}"`                               |

### 4.12 BuildingSwitcher

| Attribute         | Specification                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Props**         | `buildings`: {id, name, address, image}[]; `currentBuilding`: string; `onSwitch`: function          |
| **States**        | Default (current building shown), Open (dropdown or modal with building cards), Switching (loading) |
| **Used In**       | PRD 01 (multi-building architecture), PRD 14 (dashboard building context), PRD 15 (navigation)      |
| **Accessibility** | `aria-label="Switch building"`. `role="listbox"` for building options                               |

---

## 5. Layout

### 5.1 PageLayout

| Attribute         | Specification                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Props**         | `title`: string; `subtitle`: string; `actions`: ReactNode; `breadcrumbs`: BreadcrumbItem[]; `children`: ReactNode |
| **States**        | Default, Loading (skeleton header + children), Error (full-page error)                                            |
| **Used In**       | All PRDs — every page uses this wrapper                                                                           |
| **Accessibility** | `main` landmark. Title as `h1`. Subtitle as `p`                                                                   |

### 5.2 SplitLayout

| Attribute         | Specification                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Props**         | `left`: ReactNode; `right`: ReactNode; `leftWidth`: number / string; `collapsible`: boolean               |
| **States**        | Default (both panels), Collapsed (left hidden), Mobile (stacked)                                          |
| **Used In**       | PRD 06 (filter panel + calendar), PRD 07 (unit list + unit detail), PRD 16 (settings nav + settings form) |
| **Accessibility** | Both panels accessible independently. Collapse toggle has `aria-expanded`                                 |

### 5.3 Card

| Attribute         | Specification                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Props**         | `header`: ReactNode; `footer`: ReactNode; `padding`: sm / md / lg; `clickable`: boolean; `selected`: boolean  |
| **States**        | Default (1px border, 16px radius), Hover (shadow for clickable), Selected (accent border), Loading (skeleton) |
| **Used In**       | All PRDs — universal container                                                                                |
| **Accessibility** | `role="article"` for content cards. `role="link"` + `tabindex="0"` for clickable                              |

### 5.4 Modal

| Attribute         | Specification                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `size`: sm (400px) / md (560px) / lg (720px) / fullsheet (90vw); `title`: string; `description`: string; `footer`: ReactNode; `onClose`: function; `preventClose`: boolean |
| **States**        | Opening (scale 0.97>1.0 + fade, 250ms), Open (focus trap), Closing (fade, 150ms)                                                                                           |
| **Used In**       | All PRDs — form overlays, confirmations, detail views                                                                                                                      |
| **Accessibility** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title), `aria-describedby` (description). Focus trap. Escape closes. Return focus to trigger on close             |

### 5.5 SlideOver (Drawer)

| Attribute         | Specification                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `side`: right / left; `width`: number (default 480px); `title`: string; `footer`: ReactNode; `onClose`: function               |
| **States**        | Opening (slide in 250ms ease-out), Open, Closing (slide out 200ms)                                                             |
| **Used In**       | PRD 03 (event detail from table click), PRD 04 (package detail), PRD 05 (request detail), PRD 07 (resident profile quick view) |
| **Accessibility** | Same as Modal. `role="dialog"`, focus trap, Escape closes                                                                      |

### 5.6 Accordion

| Attribute         | Specification                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: {trigger, content}[]; `type`: single / multiple; `defaultOpen`: string[]                                    |
| **States**        | Collapsed, Expanded (content height animates), Hover (trigger), Focus                                                |
| **Used In**       | PRD 07 (unit file sections), PRD 16 (settings groups), PRD 25 (help center FAQ), PRD 26 (API documentation sections) |
| **Accessibility** | Radix Accordion. `role="region"`. Trigger: `aria-expanded`, `aria-controls`. Enter/Space toggles                     |

### 5.7 Divider

| Attribute         | Specification                                                                         |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Props**         | `orientation`: horizontal / vertical; `label`: string (optional text label in center) |
| **States**        | Static                                                                                |
| **Used In**       | All PRDs — section separation within cards and forms                                  |
| **Accessibility** | `role="separator"`. Labeled divider: `aria-label`                                     |

### 5.8 GridLayout

| Attribute         | Specification                                                                   |
| ----------------- | ------------------------------------------------------------------------------- |
| **Props**         | `columns`: 1-12 or responsive object; `gap`: space token; `children`: ReactNode |
| **States**        | Static (responsive)                                                             |
| **Used In**       | All PRDs — 12-column grid system                                                |
| **Accessibility** | No special requirements (layout-only)                                           |

### 5.9 Container

| Attribute         | Specification                                               |
| ----------------- | ----------------------------------------------------------- |
| **Props**         | `maxWidth`: number (default 1440px); `padding`: space token |
| **States**        | Static                                                      |
| **Used In**       | All pages — content width constraint                        |
| **Accessibility** | No special requirements                                     |

### 5.10 DragDropContainer

| Attribute         | Specification                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `items`: T[]; `onReorder`: function; `handle`: boolean; `axis`: x / y / both                                                                |
| **States**        | Default, Dragging (lifted item with shadow, placeholder gap), Drop target (accent border)                                                   |
| **Used In**       | PRD 14 (dashboard widget reordering), PRD 16 (custom field ordering), PRD 23 (onboarding step ordering by admin)                            |
| **Accessibility** | Keyboard: Space to grab, Arrow keys to move, Space to drop, Escape to cancel. Announcements: "Grabbed item 3. Press arrow keys to reorder." |

---

## 6. Forms

### 6.1 FormField

| Attribute         | Specification                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **Props**         | `label`: string; `required`: boolean; `helpText`: string; `error`: string; `children`: ReactNode (the input) |
| **States**        | Default, Error (red label highlight + error message), Disabled                                               |
| **Used In**       | All form PRDs — wrapper for every form input                                                                 |
| **Accessibility** | `<label>` with `htmlFor`. Help text: `aria-describedby`. Error: `aria-describedby` + `aria-invalid` on input |

### 6.2 FormSection

| Attribute         | Specification                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Props**         | `title`: string; `description`: string; `collapsible`: boolean; `defaultOpen`: boolean      |
| **States**        | Open, Collapsed (if collapsible)                                                            |
| **Used In**       | PRD 05 (maintenance form sections), PRD 07 (unit detail sections), PRD 16 (settings groups) |
| **Accessibility** | Section title as heading. Collapse: `aria-expanded`                                         |

### 6.3 SearchInput

| Attribute         | Specification                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `placeholder`: string; `value`: string; `debounce`: number (default 300ms); `onSearch`: function; `clearable`: boolean |
| **States**        | Default, Focus, Active (has value, clear X visible), Loading (spinner during search)                                   |
| **Used In**       | PRD 15 (global search), all table filter bars, PRD 03 (event stream search)                                            |
| **Accessibility** | `role="searchbox"`. `aria-label="Search"`. Clear button: `aria-label="Clear search"`                                   |

### 6.4 PhoneInput

| Attribute         | Specification                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Props**         | `value`: string; `countryCode`: string; `onChange`: function                             |
| **States**        | Default, Focus, Error, Disabled. Country code dropdown with flag icons                   |
| **Used In**       | PRD 07 (resident phone), PRD 08 (user profile phone), PRD 03 (emergency contact phone)   |
| **Accessibility** | Country code selector has `aria-label="Country code"`. Phone input has `inputMode="tel"` |

### 6.5 AddressInput

| Attribute         | Specification                                                                         |
| ----------------- | ------------------------------------------------------------------------------------- |
| **Props**         | `value`: AddressFields; `onChange`: function; `autocomplete`: boolean (Google Places) |
| **States**        | Default, Autocomplete suggestions visible, Error, Disabled                            |
| **Used In**       | PRD 07 (unit address), PRD 16 (building address), PRD 23 (onboarding address)         |
| **Accessibility** | Autocomplete suggestions as `role="listbox"`. Each suggestion `role="option"`         |

### 6.6 RichTextEditor

| Attribute         | Specification                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `value`: string (HTML); `toolbar`: ToolbarConfig; `maxLength`: number; `placeholder`: string                                          |
| **States**        | Default, Focus (toolbar visible), Error, Readonly, Loading                                                                            |
| **Used In**       | PRD 09 (announcement body), PRD 11 (training course content), PRD 12 (classified ad description), PRD 25 (help center article editor) |
| **Accessibility** | TipTap-based. Toolbar buttons have `aria-label`. Content area: `role="textbox"`, `aria-multiline="true"`                              |

### 6.7 ImageCropper

| Attribute         | Specification                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Props**         | `src`: string; `aspectRatio`: number; `minWidth`, `minHeight`: number; `onCrop`: function |
| **States**        | Default (preview), Cropping (overlay with handles), Saving                                |
| **Used In**       | PRD 07 (resident photo), PRD 16 (building logo), PRD 12 (classified ad image)             |
| **Accessibility** | Keyboard-adjustable crop area. `aria-label="Image crop area. Use arrow keys to adjust."`  |

### 6.8 SignaturePad

| Attribute         | Specification                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Props**         | `width`, `height`: number; `penColor`: string; `onSave`: function; `clearable`: boolean                   |
| **States**        | Empty (placeholder text), Drawing, Completed (preview), Cleared                                           |
| **Used In**       | PRD 04 (package release signature — premium), PRD 03 (incident acknowledgment)                            |
| **Accessibility** | `role="img"` once signed, `aria-label="Signature"`. Alternative: "Type name" text input for accessibility |

### 6.9 ColorPicker

| Attribute         | Specification                                                                   |
| ----------------- | ------------------------------------------------------------------------------- |
| **Props**         | `value`: string (hex); `presets`: string[]; `showCustom`: boolean               |
| **States**        | Default (swatch preview), Open (preset grid + custom input), Selected           |
| **Used In**       | PRD 16 (event type color assignment, amenity color, branding colors)            |
| **Accessibility** | Preset swatches as `role="radiogroup"`. Each swatch: `aria-label="Color {hex}"` |

### 6.10 CurrencyInput

| Attribute         | Specification                                                                           |
| ----------------- | --------------------------------------------------------------------------------------- |
| **Props**         | `value`: number; `currency`: string (CAD/USD); `onChange`: function                     |
| **States**        | Default, Focus, Error, Disabled. Auto-formats with $ prefix and comma separators        |
| **Used In**       | PRD 06 (amenity deposit amount), PRD 24 (billing amounts), PRD 12 (classified ad price) |
| **Accessibility** | `inputMode="decimal"`. Currency symbol as `aria-label` prefix                           |

### 6.11 MultiSelect

| Attribute         | Specification                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Props**         | `options`: Option[]; `value`: string[]; `placeholder`: string; `maxSelections`: number; `searchable`: boolean |
| **States**        | Default, Open (dropdown with checkboxes), Selected (tags in input), Error, Disabled                           |
| **Used In**       | PRD 09 (notification channel selection), PRD 02 (permission assignment), PRD 10 (report field selection)      |
| **Accessibility** | `role="listbox"`, `aria-multiselectable="true"`. Selected items as tags with remove buttons                   |

### 6.12 NumberStepper

| Attribute         | Specification                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Props**         | `value`: number; `min`, `max`, `step`: number; `label`: string                             |
| **States**        | Default, Min reached (minus disabled), Max reached (plus disabled), Error                  |
| **Used In**       | PRD 06 (guest count for booking), PRD 24 (unit count for tier), PRD 16 (SLA hour settings) |
| **Accessibility** | `role="spinbutton"`. Arrow keys increment/decrement. `aria-valuemin`, `aria-valuemax`      |

### 6.13 InlineEdit

| Attribute         | Specification                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **Props**         | `value`: string; `onSave`: function; `onCancel`: function; `inputType`: text / select; `placeholder`: string |
| **States**        | Display (text with edit icon on hover), Editing (input replaces text), Saving (spinner), Error               |
| **Used In**       | PRD 07 (unit file inline field editing), PRD 03 (event detail quick edit), PRD 08 (user profile fields)      |
| **Accessibility** | Edit button: `aria-label="Edit {field name}"`. Input on Enter saves, Escape cancels                          |

### 6.14 CSVMapper

| Attribute         | Specification                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `sourceColumns`: string[]; `targetFields`: FieldDef[]; `mappings`: Mapping[]; `onMapChange`: function; `preview`: any[]                     |
| **States**        | Default (drag/drop mapping), Mapped (green checks), Unmapped (yellow warnings), Error (red — required field missing), Preview (sample data) |
| **Used In**       | PRD 27 (data migration CSV column mapping)                                                                                                  |
| **Accessibility** | Mapping as drag-drop with keyboard alternative (select source > select target). Preview table accessible                                    |

---

## 7. Specialized — Domain

### 7.1 EventCard

| Attribute         | Specification                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Props**         | `event`: Event; `variant`: compact / standard / expanded; `showActions`: boolean       |
| **States**        | Default, Hover (shadow), Selected (accent border), New (pulse animation for real-time) |
| **Used In**       | PRD 03 (security console event stream — primary view)                                  |
| **Accessibility** | `role="article"`. Status announced. Actions in `...` menu                              |

### 7.2 PackageCard

| Attribute         | Specification                                                                       |
| ----------------- | ----------------------------------------------------------------------------------- |
| **Props**         | `package`: Package; `courierIcon`: ReactNode; `showRelease`: boolean                |
| **States**        | Checked-in, Released (green overlay), Returned, Overdue (red indicator)             |
| **Used In**       | PRD 04 (package management list/grid view)                                          |
| **Accessibility** | Courier name announced (not just icon). Status announced. Reference number readable |

### 7.3 CourierIconGrid

| Attribute         | Specification                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Props**         | `couriers`: {id, name, icon}[]; `selected`: string; `onChange`: function                         |
| **States**        | Default (icon grid), Selected (accent border on chosen courier), Custom (text input for "Other") |
| **Used In**       | PRD 04 (package check-in courier selection)                                                      |
| **Accessibility** | `role="radiogroup"`. Each courier icon: `role="radio"`, `aria-label="{courier name}"`            |

### 7.4 QuickCreateBar

| Attribute         | Specification                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Props**         | `actions`: {icon, label, eventType, color}[]; `onAction`: function                                        |
| **States**        | Default (circular icon buttons in a row), Hover (tooltip + color fill), Active (opens corresponding form) |
| **Used In**       | PRD 03 (security console — 9 quick-create icons for entry types)                                          |
| **Accessibility** | Each icon button: `aria-label="Create {event type}"`. Large tap targets (48px)                            |

### 7.5 BookingBlock

| Attribute         | Specification                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `booking`: Booking; `amenityColor`: string; `isOwn`: boolean; `onClick`: function                                                          |
| **States**        | Default (color at 12% opacity + 3px left border), Hover (shadow), Own booking (18% opacity + badge), Unavailable (diagonal stripe pattern) |
| **Used In**       | PRD 06 (amenity booking calendar blocks)                                                                                                   |
| **Accessibility** | `role="button"`. Announces: "{Amenity} booked by {unit}, {time range}"                                                                     |

### 7.6 UnitCard

| Attribute         | Specification                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Props**         | `unit`: Unit; `showOccupants`: boolean; `showInstructions`: boolean; `variant`: compact / full |
| **States**        | Default, Hover (shadow), Vacant (muted appearance), Has instructions (info icon)               |
| **Used In**       | PRD 07 (unit management grid view), PRD 14 (dashboard unit search results)                     |
| **Accessibility** | Unit number readable. Vacancy status announced. Instructions expandable                        |

### 7.7 FOBTracker

| Attribute         | Specification                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Props**         | `fobs`: FOB[]; `maxSlots`: number (default 6); `onAssign`, `onRevoke`: function              |
| **States**        | Assigned (serial number + type), Available (empty slot), Revoked (strikethrough + timestamp) |
| **Used In**       | PRD 03 (security — FOB/key management), PRD 07 (unit file FOB section)                       |
| **Accessibility** | Each slot: `aria-label="FOB slot {n}: {status}"`. Serial number as monospace                 |

### 7.8 ParkingViolationCard

| Attribute         | Specification                                                                   |
| ----------------- | ------------------------------------------------------------------------------- |
| **Props**         | `violation`: Violation; `showTimeline`: boolean                                 |
| **States**        | Active (warning/ban/ticket), Resolved, Expired, Repeat offender (red indicator) |
| **Used In**       | PRD 13 (parking violations list), PRD 03 (security console parking entries)     |
| **Accessibility** | Status announced. License plate readable in monospace                           |

### 7.9 MaintenancePriorityBadge

| Attribute         | Specification                                                            |
| ----------------- | ------------------------------------------------------------------------ |
| **Props**         | `priority`: low / medium / high / urgent; `sla`: {hours, remaining}      |
| **States**        | Static badge. Color changes by priority. SLA countdown if within 24h     |
| **Used In**       | PRD 05 (service request priority), PRD 14 (dashboard maintenance widget) |
| **Accessibility** | `aria-label="Priority: {level}, SLA: {hours} remaining"`                 |

### 7.10 ResidentProfileCard

| Attribute         | Specification                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Props**         | `resident`: Resident; `showContacts`: boolean; `showEmergency`: boolean; `variant`: compact / full |
| **States**        | Default, Hover (actions visible), Loading                                                          |
| **Used In**       | PRD 07 (unit file — resident section), PRD 03 (event creation — unit/resident lookup)              |
| **Accessibility** | Name, unit, role all announced. Phone numbers readable                                             |

### 7.11 PermissionMatrix

| Attribute         | Specification                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Props**         | `roles`: Role[]; `permissions`: Permission[]; `values`: {roleId, permissionId, granted}[]; `editable`: boolean                       |
| **States**        | Default (grid of checkboxes), Editing (changed cells highlighted), Saving                                                            |
| **Used In**       | PRD 02 (roles and permissions), PRD 16 (settings — role management)                                                                  |
| **Accessibility** | Grid with `role="grid"`. Row headers are roles, column headers are permissions. Checkboxes have `aria-label="{role} - {permission}"` |

### 7.12 ComplianceScoreCard

| Attribute         | Specification                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `framework`: string; `score`: number; `status`: compliant / at-risk / non-compliant; `lastAudit`: Date; `items`: ChecklistItem[] |
| **States**        | Default, Expanded (checklist visible), Loading                                                                                   |
| **Used In**       | PRD 28 (compliance reports dashboard)                                                                                            |
| **Accessibility** | Score announced. Checklist items as `role="list"` with completion status                                                         |

### 7.13 BillingPlanCard

| Attribute         | Specification                                                                   |
| ----------------- | ------------------------------------------------------------------------------- |
| **Props**         | `plan`: Plan; `current`: boolean; `onSelect`: function; `features`: string[]    |
| **States**        | Default, Current (accent border + "Current Plan" badge), Hover, Selected        |
| **Used In**       | PRD 24 (billing — plan selection), PRD 22 (marketing website pricing)           |
| **Accessibility** | `role="radio"` in plan group. Features as `role="list"`. Current plan announced |

### 7.14 DemoModeBanner

| Attribute         | Specification                                                     |
| ----------------- | ----------------------------------------------------------------- |
| **Props**         | `mode`: demo / training; `expiresAt`: Date; `onExit`: function    |
| **States**        | Visible (persistent top banner with countdown), Hidden            |
| **Used In**       | PRD 21 (demo environment — persistent indicator)                  |
| **Accessibility** | `role="banner"`. "Demo mode: data is not real. {time} remaining." |

### 7.15 MigrationProgress

| Attribute         | Specification                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Props**         | `stages`: {name, status, count, errors}[]; `overallProgress`: number                   |
| **States**        | In progress (animated bars), Complete (all green), Error (red stages with error count) |
| **Used In**       | PRD 27 (data migration progress tracking)                                              |
| **Accessibility** | Each stage has `role="progressbar"`. Errors announced. Overall progress: `aria-label`  |

### 7.16 APIKeyCard

| Attribute         | Specification                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Props**         | `apiKey`: {name, prefix, created, lastUsed, scopes}; `onRevoke`, `onRegenerate`: function       |
| **States**        | Default (key masked), Revealed (full key shown briefly), Copied (confirmation), Revoked         |
| **Used In**       | PRD 26 (developer portal — API key management)                                                  |
| **Accessibility** | Key in monospace. Copy button: `aria-label="Copy API key"`. Revoke requires confirmation dialog |

---

## 8. Composite Patterns

### 8.1 FilterBar

| Attribute         | Specification                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `filters`: FilterDef[]; `values`: FilterValues; `onChange`: function; `showSearch`: boolean; `moreFiltersCount`: number |
| **Variants**      | Inline (horizontal bar above table), Sidebar (vertical panel), Floating (expandable)                                    |
| **States**        | Default, Active (filter count badge), Expanded ("More Filters" open), Cleared                                           |
| **Used In**       | All table views — PRD 03-28                                                                                             |
| **Accessibility** | Filters as form controls with labels. Active count announced. "Clear all" button accessible                             |

### 8.2 BulkActionBar

| Attribute         | Specification                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `selectedCount`: number; `actions`: {icon, label, onClick, variant}[]; `onClearSelection`: function                         |
| **States**        | Hidden (no selection), Visible (slide up from bottom), Loading (action in progress)                                         |
| **Used In**       | PRD 03 (bulk event operations), PRD 04 (bulk package release), PRD 07 (bulk unit operations), PRD 08 (bulk user operations) |
| **Accessibility** | `role="toolbar"`, `aria-label="{count} items selected"`. Actions as buttons. Escape clears selection                        |

### 8.3 DetailPanel

| Attribute         | Specification                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Props**         | `entity`: T; `tabs`: {label, content}[]; `actions`: {label, onClick, variant}[]; `auditTrail`: AuditEntry[] |
| **States**        | Loading (skeleton), Loaded, Editing (form mode), Saving, Error                                              |
| **Used In**       | PRD 03 (event detail), PRD 04 (package detail), PRD 05 (request detail), PRD 07 (unit detail)               |
| **Accessibility** | Tabs pattern with `role="tablist"`. Audit trail as ordered list. Actions in toolbar                         |

### 8.4 QuickActionGrid

| Attribute         | Specification                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Props**         | `actions`: {icon, label, description, onClick, color?}[]; `columns`: 2 / 3 / 4                |
| **States**        | Default, Hover (card lift), Active (opens action)                                             |
| **Used In**       | PRD 14 (security guard quick actions), PRD 14 (resident quick actions), PRD 03 (quick-create) |
| **Accessibility** | Grid of buttons. Each: `aria-label="{label}: {description}"`                                  |

### 8.5 OnboardingWizard

| Attribute         | Specification                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `steps`: WizardStep[]; `currentStep`: number; `onNext`, `onBack`, `onSkip`, `onComplete`: function; `progress`: number |
| **States**        | Step active, Validating (before next), Saving draft, Complete (celebration), Error                                     |
| **Used In**       | PRD 23 (property onboarding — 8 steps)                                                                                 |
| **Accessibility** | Step indicator accessible. Form validation announced. "Skip for now" clearly labeled                                   |

### 8.6 ReportBuilder

| Attribute         | Specification                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `reportTypes`: ReportType[]; `selectedType`: string; `filters`: FilterDef[]; `output`: table / chart / both; `exportFormats`: (csv / xlsx / pdf)[] |
| **States**        | Configuration, Generating (progress), Results (table + chart), Error, Empty (no data)                                                              |
| **Used In**       | PRD 10 (39+ report types), PRD 28 (8 compliance report types)                                                                                      |
| **Accessibility** | Form for configuration. Results as accessible table. Export buttons with format labels                                                             |

### 8.7 NotificationPreferences

| Attribute         | Specification                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Props**         | `categories`: {module, events}[]; `channels`: (email / sms / push / voice)[]; `values`: PreferenceMatrix |
| **States**        | Default (grid of toggles), Saving, Error                                                                 |
| **Used In**       | PRD 09 (per-resident notification preferences), PRD 16 (notification settings)                           |
| **Accessibility** | Grid with module as rows, channels as columns. Each toggle: `aria-label="{module} via {channel}"`        |

### 8.8 AuditTrail

| Attribute         | Specification                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Props**         | `entries`: {actor, action, timestamp, details, before?, after?}[]; `showDiff`: boolean                    |
| **States**        | Default (timeline), Expanded (diff view for changed fields), Loading                                      |
| **Used In**       | PRD 03 (event audit), PRD 07 (unit change history), PRD 08 (login audit trail), PRD 28 (compliance audit) |
| **Accessibility** | Ordered list. Each entry: timestamp + actor + action readable. Diff view shows before/after clearly       |

### 8.9 PrintLayout

| Attribute         | Specification                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Props**         | `content`: ReactNode; `header`: {logo, title, date}; `footer`: {pageNumbers, disclaimer}                  |
| **States**        | Screen (hidden until print), Print (visible, optimized for A4/Letter)                                     |
| **Used In**       | PRD 04 (package label printing), PRD 10 (report PDF export), PRD 13 (parking permit printing)             |
| **Accessibility** | `@media print` styles. No interactive elements in print. All colors have sufficient contrast in grayscale |

### 8.10 BatchEntryForm

| Attribute         | Specification                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **Props**         | `columns`: FieldDef[]; `maxRows`: number (default 10); `onSubmit`: function; `perRowNotification`: boolean |
| **States**        | Default (multi-row form), Adding row (+), Removing row (X), Validating, Submitting                         |
| **Used In**       | PRD 03 (batch event creation — 10 rows), PRD 04 (batch package check-in)                                   |
| **Accessibility** | Each row independently focusable. Row add/remove announced. Per-row validation                             |

### 8.11 HelpContextualTip

| Attribute         | Specification                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Props**         | `tipId`: string; `title`: string; `content`: string; `learnMoreUrl`: string; `dismissible`: boolean |
| **States**        | Visible (for first-time), Dismissed (persists in localStorage), Hidden                              |
| **Used In**       | PRD 25 (in-app contextual help), PRD 23 (onboarding tips)                                           |
| **Accessibility** | `role="complementary"`. Dismiss: `aria-label="Dismiss tip"`. Learn more as link                     |

### 8.12 ExportMenu

| Attribute         | Specification                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| **Props**         | `formats`: {label, icon, format}[]; `onExport`: function; `loading`: boolean                             |
| **States**        | Default (dropdown trigger), Open (format options), Exporting (progress), Complete (toast)                |
| **Used In**       | PRD 10 (report export), PRD 03 (event log export), PRD 07 (unit data export), PRD 28 (compliance export) |
| **Accessibility** | `role="menu"`. Each option: `role="menuitem"`. Loading state announced                                   |

---

## 9. Business Operations

### 9.1 PricingTable

| Attribute         | Specification                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Props**         | `plans`: Plan[]; `billing`: monthly / annual; `currentPlan`: string; `onSelect`: function     |
| **States**        | Default, Annual toggle (discount shown), Hover on plan, Selected, Loading                     |
| **Used In**       | PRD 22 (marketing website pricing), PRD 24 (billing plan selection)                           |
| **Accessibility** | Table or card grid. Each plan as `role="radio"` in group. Feature comparison as `role="grid"` |

### 9.2 InvoiceTable

| Attribute         | Specification                                                          |
| ----------------- | ---------------------------------------------------------------------- |
| **Props**         | `invoices`: Invoice[]; `onDownload`, `onPay`: function                 |
| **States**        | Default, Overdue (red indicator), Paid (green), Pending, Loading       |
| **Used In**       | PRD 24 (billing invoice history)                                       |
| **Accessibility** | Standard DataTable. Status announced. Download links have `aria-label` |

### 9.3 SubscriptionStatusCard

| Attribute         | Specification                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `plan`: Plan; `status`: active / trial / expiring / expired / cancelled; `renewalDate`: Date; `usage`: {current, limit} |
| **States**        | Active (green), Trial (info), Expiring (warning — countdown), Expired (error), Cancelled                                |
| **Used In**       | PRD 24 (billing dashboard header card)                                                                                  |
| **Accessibility** | Status and renewal date announced. Usage percentage as progress bar                                                     |

### 9.4 HelpArticleCard

| Attribute         | Specification                                                                 |
| ----------------- | ----------------------------------------------------------------------------- |
| **Props**         | `article`: {title, excerpt, category, readTime, helpful}; `onClick`: function |
| **States**        | Default, Hover (shadow), Read (checkmark)                                     |
| **Used In**       | PRD 25 (help center article listings)                                         |
| **Accessibility** | `role="article"`. Category and read time announced                            |

### 9.5 SupportTicketForm

| Attribute         | Specification                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Props**         | `categories`: string[]; `priorities`: string[]; `onSubmit`: function; `attachments`: boolean |
| **States**        | Default, Validating, Submitting, Success (confirmation), Error                               |
| **Used In**       | PRD 25 (help center — submit support ticket)                                                 |
| **Accessibility** | Standard form accessibility. File upload accessible                                          |

### 9.6 StatusPageWidget

| Attribute         | Specification                                                                |
| ----------------- | ---------------------------------------------------------------------------- |
| **Props**         | `systems`: {name, status, uptime}[]; `incidents`: Incident[]                 |
| **States**        | All operational (green), Degraded (yellow), Outage (red), Maintenance (blue) |
| **Used In**       | PRD 25 (help center status page), PRD 14 (super admin dashboard)             |
| **Accessibility** | Each system has `aria-label="{name}: {status}"`. Incidents as list           |

### 9.7 APIPlayground

| Attribute         | Specification                                                                    |
| ----------------- | -------------------------------------------------------------------------------- |
| **Props**         | `endpoint`: Endpoint; `apiKey`: string; `onExecute`: function                    |
| **States**        | Default (request builder), Executing (loading), Response (formatted JSON), Error |
| **Used In**       | PRD 26 (developer portal — API explorer)                                         |
| **Accessibility** | Code blocks with `role="code"`. Response accessible. Error messages clear        |

### 9.8 WebhookLogViewer

| Attribute         | Specification                                                          |
| ----------------- | ---------------------------------------------------------------------- |
| **Props**         | `logs`: WebhookLog[]; `filters`: FilterDef[]                           |
| **States**        | Default (table of attempts), Expanded (request/response detail), Empty |
| **Used In**       | PRD 26 (developer portal — webhook logs)                               |
| **Accessibility** | Standard DataTable. Expandable rows for detail                         |

### 9.9 MarketingHero

| Attribute         | Specification                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Props**         | `headline`, `subheadline`: string; `cta`: {label, href}; `image`: string; `stats`: {label, value}[] |
| **States**        | Default, Mobile (stacked), Animated (fade-in on scroll)                                             |
| **Used In**       | PRD 22 (marketing website hero section)                                                             |
| **Accessibility** | `h1` for headline. CTA as prominent link. Image has `alt` text. Stats readable                      |

### 9.10 FeatureShowcase

| Attribute         | Specification                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Props**         | `features`: {icon, title, description, screenshot}[]; `layout`: grid / alternating               |
| **States**        | Default, Scroll-triggered animations (if user allows motion)                                     |
| **Used In**       | PRD 22 (marketing website feature sections)                                                      |
| **Accessibility** | Each feature as `role="article"`. Screenshots have `alt` text. Animations respect reduced-motion |

### 9.11 TestimonialCard

| Attribute         | Specification                                                      |
| ----------------- | ------------------------------------------------------------------ |
| **Props**         | `quote`: string; `author`: {name, role, building, avatar}          |
| **States**        | Static                                                             |
| **Used In**       | PRD 22 (marketing website social proof)                            |
| **Accessibility** | `<blockquote>` with `cite` attribute. Author details as `<footer>` |

### 9.12 LoginRouter

| Attribute         | Specification                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Props**         | `buildings`: Building[]; `vanityUrl`: string; `onBuildingSelect`: function             |
| **States**        | Building selection, Login form, MFA challenge, Password reset, First-time setup        |
| **Used In**       | PRD 22 (marketing website login routing), PRD 08 (authentication flow)                 |
| **Accessibility** | Building cards as radio group. Login form standard accessibility. MFA input accessible |

### 9.13 DataMigrationWizard

| Attribute         | Specification                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props**         | `steps`: (upload / map / validate / preview / import / verify)[]; `sourceFormat`: string                                                        |
| **States**        | Step-by-step with validation gates. Upload, Mapping (CSVMapper), Validation (error list), Preview (sample rows), Importing (progress), Complete |
| **Used In**       | PRD 27 (data migration flow)                                                                                                                    |
| **Accessibility** | Wizard pattern with step indicator. Each step validates before proceeding                                                                       |

### 9.14 ComplianceDashboard

| Attribute         | Specification                                                                           |
| ----------------- | --------------------------------------------------------------------------------------- |
| **Props**         | `frameworks`: Framework[]; `overallScore`: number; `alerts`: Alert[]; `nextAudit`: Date |
| **States**        | Default (score cards + chart), Alert (compliance issue detected), Loading               |
| **Used In**       | PRD 28 (compliance reports main view)                                                   |
| **Accessibility** | Score cards accessible. Alerts as `role="alert"` for high severity                      |

---

## 10. Cross-PRD Usage Matrix

This matrix shows which component categories are required by each PRD. Use this to prioritize component development.

| Component Category | 01  | 02  | 03  | 04  | 05  | 06  | 07  | 08  | 09  | 10  | 11  | 12  | 13  | 14  | 15  | 16  | 17  | 18  | 19  | 20  | 21  | 22  | 23  | 24  | 25  | 26  | 27  | 28  |
| ------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button             | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   |
| Input              |     |     | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   |     | x   | x   | x   |     |     |     | x   | x   | x   | x   | x   | x   | x   | x   |
| DataTable          |     |     | x   | x   | x   | x   | x   | x   |     | x   | x   | x   | x   |     |     | x   |     |     |     |     |     |     |     | x   |     | x   | x   | x   |
| StatusBadge        |     |     | x   | x   | x   | x   | x   | x   |     |     |     |     | x   | x   |     |     |     |     |     |     |     |     |     | x   |     |     |     | x   |
| KPICard            |     |     |     |     |     |     |     |     |     | x   |     |     |     | x   |     |     |     |     |     |     |     |     |     | x   |     |     |     | x   |
| Calendar           |     |     |     |     |     | x   |     |     |     |     | x   | x   |     | x   |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| Modal              |     |     | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   |     |     |     |     | x   |     | x   | x   | x   | x   | x   | x   |
| FilterBar          |     |     | x   | x   | x   | x   | x   | x   |     | x   | x   | x   | x   |     | x   | x   |     |     |     |     |     |     |     |     |     |     |     | x   |
| EmptyState         |     |     | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   |     |     |     | x   | x   | x   | x   | x   | x   | x   | x   |
| Chart              |     |     |     |     |     |     |     |     |     | x   |     |     |     | x   |     |     |     |     |     |     |     |     |     | x   |     |     |     | x   |
| Toast              |     |     | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   |     |     | x   |     |     |     |     | x   |     | x   | x   | x   | x   | x   | x   |
| Sidebar            | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   | x   |     |     |     | x   |     |     |     |     |     |     |     |
| CommandPalette     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |     |     |     |     |     |     |     |     |     |     |     |
| FileUpload         |     |     |     |     | x   |     | x   |     | x   |     | x   | x   |     |     |     | x   |     |     |     |     |     |     |     |     |     |     | x   |     |
| RichTextEditor     |     |     |     |     |     |     |     |     | x   |     | x   | x   |     |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |     |
| Wizard/Steps       |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |     | x   |     |

### Priority Groups for Development

**Priority 1 — Used in 15+ PRDs (build first)**:
Button, Input, FormField, DataTable, Modal, Toast, EmptyState, StatusBadge, Sidebar, TopBar, Card, Pagination, Skeleton, Tooltip

**Priority 2 — Used in 8-14 PRDs (build second)**:
FilterBar, Select, Checkbox, Toggle, SlideOver, Tabs, SearchInput, IconButton, ConfirmDialog, Tag, Breadcrumbs, Avatar, InlineMessage

**Priority 3 — Used in 4-7 PRDs (build third)**:
Textarea, DatePicker, FileUpload, Combobox, Accordion, Chart, KPICard, ActivityFeed, Calendar, SegmentedControl, BulkActionBar, DetailPanel, ExportMenu, AuditTrail

**Priority 4 — Used in 1-3 PRDs (build last)**:
All domain-specific and business operations components. These can be composed from Priority 1-3 primitives.

---

_This document should be updated whenever a new PRD is added or an existing PRD's UI requirements change._
_Cross-reference with `COMPONENT-CATALOG.md` for implementation details and `SCREEN-STATES.md` for state-specific designs._
