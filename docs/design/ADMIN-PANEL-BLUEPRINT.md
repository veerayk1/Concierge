# Admin & Super Admin Panel Blueprint

> **Designed from first principles.** No competitor admin panels were observed during research.
> References: Stripe Dashboard, Shopify Admin, Firebase Console, Vercel Dashboard, Linear Settings, Notion Workspace Settings.
> Target quality: Paris Design Awards submission-ready.

---

## Document Metadata

| Field | Value |
|-------|-------|
| Product | Concierge |
| Version | 1.0 |
| Date | 2026-03-15 |
| Design Philosophy | "The admin who buys this software should have the best experience in the entire system" |
| Primary Target | 1920x1080 desktop monitor |
| Users | Non-technical building managers and platform operators |

---

## 1. Design Principles for Admin Panels

### 1.1 Why Admin Panels Matter Most

The admin is the **buyer**. If the admin is unhappy, we lose the contract. Unlike resident-facing features (which residents use passively), admin panels are where the building manager spends 6-8 hours daily configuring, monitoring, and managing their property.

### 1.2 Admin-Specific Design Rules

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **Progressive disclosure everywhere** | Non-technical users must never feel overwhelmed. Show basics first; reveal advanced under "Show Advanced" |
| 2 | **Tooltips on every non-obvious field** | Admins configure systems they don't fully understand. Every toggle, dropdown, and setting needs hover context |
| 3 | **Impact previews** | Before saving a destructive change, show what will happen. "Disabling SMS will affect 342 residents" |
| 4 | **Undo for 30 seconds** | Every settings change shows an "Undo" toast for 30 seconds. No confirmation dialogs for non-destructive changes |
| 5 | **Audit badge on every setting** | Small "Last changed by Sarah, 3 days ago" under fields that were recently modified |
| 6 | **Search within settings** | Cmd+K searches settings fields, not just pages. "notification email" → jumps to Notification Templates tab |
| 7 | **Contextual help panels** | Right-side help panel (Notion-style) with relevant documentation, video walkthroughs, and "Need help?" chat |
| 8 | **Zero-config defaults** | Every property starts with sensible defaults. Admin only changes what they need. |
| 9 | **Bulk operations** | Multi-select, bulk edit, bulk enable/disable for list-based settings |
| 10 | **Visual feedback for every save** | Inline save indicators, not page-level save buttons. Auto-save with debounce on text fields |

---

## 2. Two-Tier Admin Architecture

### 2.1 Super Admin vs Property Admin

```
┌─────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                           │
│  Platform operator. Sees ALL properties.                 │
│  Manages: system config, billing, AI, security,          │
│           API keys, cross-property analytics              │
│                                                           │
│  ┌───────────────────────────────────────────────┐       │
│  │              PROPERTY ADMIN                    │       │
│  │  Building manager. Sees ONE property.          │       │
│  │  Manages: property settings, event types,      │       │
│  │           staff, residents, amenities,          │       │
│  │           notifications, custom fields          │       │
│  │                                                 │       │
│  │  ┌─────────────────────────────────────┐       │       │
│  │  │        PROPERTY MANAGER             │       │       │
│  │  │  Day-to-day ops. View-only settings │       │       │
│  │  │  Can see but not change config      │       │       │
│  │  └─────────────────────────────────────┘       │       │
│  └───────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Visual Differentiation

| Element | Super Admin | Property Admin | Property Manager |
|---------|-------------|----------------|------------------|
| **Sidebar accent** | Purple gradient badge | Blue badge | No badge |
| **Header bar** | "Platform Administration" banner | Property name | Property name |
| **Settings icon** | Gear with shield overlay | Standard gear | Gear (greyed) |
| **System-level tabs** | Full access | Hidden | Hidden |
| **Property-level tabs** | Full access (all properties) | Full access (own property) | Read-only |
| **Audit log** | Cross-property | Own property | Own actions only |
| **Billing** | Full manage | View invoices | Hidden |

---

## 3. Super Admin Panel — Complete Blueprint

### 3.1 Super Admin Shell Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌───────┐ CONCIERGE PLATFORM     🔍 ⌘K     🔔 3    👤 Admin ▾ │
│  │ LOGO  │ Super Administration                                   │
│  └───────┘                                                        │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│  SYSTEM  │   Content Area (12-column grid, max-width 1440px)     │
│  ● Dash  │                                                        │
│    Health│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│    Props │   │ KPI Card │ │ KPI Card │ │ KPI Card │ │ KPI Card ││
│    Users │   │ w/spark  │ │ w/spark  │ │ w/spark  │ │ w/spark  ││
│          │   └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│  AI      │                                                        │
│    Config│   ┌─────────────────────┐ ┌──────────────────────────┐│
│    Costs │   │                     │ │                          ││
│    Models│   │  Primary Chart /    │ │  Activity Feed /         ││
│          │   │  Analytics Widget   │ │  Alerts Panel            ││
│  BILLING │   │  (8 cols)           │ │  (4 cols)                ││
│    Plans │   │                     │ │                          ││
│    Invoic│   └─────────────────────┘ └──────────────────────────┘│
│          │                                                        │
│  SECURTY │   ┌──────────────────────────────────────────────────┐│
│    Compli│   │  Data Table / Secondary Content                  ││
│    Audit │   │  (12 cols)                                       ││
│    Incid │   └──────────────────────────────────────────────────┘│
│          │                                                        │
│  API     │                                                        │
│    Keys  │                                                        │
│    Hooks │                                                        │
│          │                                                        │
│  ─────── │                                                        │
│  👤 Name │                                                        │
│  S.Admin │                                                        │
└──────────┴───────────────────────────────────────────────────────┘
```

### 3.2 Super Admin Navigation Structure

```
Super Admin Sidebar
├── SYSTEM
│   ├── Dashboard           → /admin/dashboard
│   ├── System Health       → /admin/health
│   ├── Properties          → /admin/properties
│   └── Users (Global)      → /admin/users
│
├── AI & INTELLIGENCE
│   ├── AI Configuration    → /admin/ai/config
│   ├── AI Cost Tracker     → /admin/ai/costs
│   └── AI Models           → /admin/ai/models
│
├── BILLING
│   ├── Plans & Pricing     → /admin/billing/plans
│   ├── Invoices            → /admin/billing/invoices
│   └── Usage Metering      → /admin/billing/usage
│
├── SECURITY & COMPLIANCE
│   ├── Compliance Dashboard → /admin/security/compliance
│   ├── Audit Trail (Global) → /admin/security/audit
│   ├── Incident Response    → /admin/security/incidents
│   └── Encryption Status    → /admin/security/encryption
│
├── DEVELOPER
│   ├── API Keys            → /admin/api/keys
│   ├── Webhooks            → /admin/api/webhooks
│   ├── Rate Limits         → /admin/api/rate-limits
│   └── Feature Flags       → /admin/api/features
│
└── MAINTENANCE
    ├── Backup Status       → /admin/maintenance/backups
    ├── Default Templates   → /admin/maintenance/templates
    └── System Settings     → /admin/maintenance/settings
```

### 3.3 System Dashboard (Super Admin Home)

**Route**: `/admin/dashboard`

**Purpose**: Platform-wide health and activity overview. The first thing the Super Admin sees every morning.

```
┌──────────────────────────────────────────────────────────────┐
│  System Dashboard                          March 15, 2026    │
│  Everything is running smoothly.  ● All systems operational  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│  │ Properties  │ │ Total Units │ │ Active Users │ │ Events  ││
│  │    12       │ │   4,830     │ │    2,156     │ │  Today  ││
│  │  ↑ +2 MTD   │ │  ↑ +450 MTD │ │  ↑ 89% DAU  │ │   847   ││
│  │  ▂▃▅▇█      │ │  ▂▃▄▅▆      │ │  ▅▆▇▇█      │ │  ▃▅▇██  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                                                               │
│  ┌─────────────────────────────┐ ┌───────────────────────────┐│
│  │  Platform Activity          │ │  Alerts & Attention       ││
│  │  (Area chart, 30 days)      │ │                           ││
│  │                              │ │  ⚠ Maple Towers          ││
│  │  Events ─── Packages ───     │ │    SSL cert expires in    ││
│  │  Maintenance ─── Users ───   │ │    7 days                 ││
│  │                              │ │                           ││
│  │  ┌─────────────────────┐    │ │  ⚠ AI Budget              ││
│  │  │ ╱╲                  │    │ │    Claude API at 78% of    ││
│  │  │╱  ╲    ╱╲           │    │ │    monthly budget          ││
│  │  │     ╲╱  ╲  ╱╲╱╲    │    │ │                           ││
│  │  └─────────────────────┘    │ │  ● Oakridge Gardens       ││
│  │                              │ │    3 unresolved incidents  ││
│  │  Tooltip: Hover any point    │ │    (oldest: 48 hours)     ││
│  │  to see property breakdown   │ │                           ││
│  └─────────────────────────────┘ │  ● Backup Health          ││
│                                   │    All backups completed   ││
│                                   │    Last: 6 hours ago       ││
│                                   └───────────────────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Property Health Overview                                 ││
│  │                                                           ││
│  │  Property          Units  Users  Events  Health   Status  ││
│  │  ─────────────────────────────────────────────────────── ││
│  │  Maple Towers       500   1,203    156   ●●●●○   ⚠ Alert ││
│  │  Oakridge Gardens   200     456     89   ●●●○○   ⚠ Alert ││
│  │  The Pinnacle       350     892    112   ●●●●●   ✓ Good  ││
│  │  Lakeview Suites    180     378     67   ●●●●●   ✓ Good  ││
│  │  Harbor Point       120     267     45   ●●●●○   ✓ Good  ││
│  │  ...                                                      ││
│  │                                       View All Properties →││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**KPI Cards Specification:**
| KPI | Sparkline | Trend Period | Click Action |
|-----|-----------|-------------|--------------|
| Total Properties | Mini bar chart (12 months) | Month-to-date | → /admin/properties |
| Total Units | Mini area chart | Month-to-date | → /admin/properties (sorted by units) |
| Active Users (DAU) | Mini line chart (30 days) | 30-day average | → /admin/users |
| Events Today | Mini bar chart (7 days) | vs yesterday | → cross-property event log |

**Health Score Algorithm:**
- 5 dots = Excellent (no alerts, all metrics green)
- 4 dots = Good (minor alerts, all critical metrics green)
- 3 dots = Attention (1-2 unresolved issues, some metrics yellow)
- 2 dots = Warning (3+ unresolved issues or any metric red)
- 1 dot = Critical (system-level failure, data loss risk, security incident)

### 3.4 Properties Management

**Route**: `/admin/properties`

**List View:**
```
┌──────────────────────────────────────────────────────────────┐
│  Properties                            ┌──────────────────┐  │
│  12 properties across 3 organizations  │ + Add Property   │  │
│                                        └──────────────────┘  │
│  ┌───────┐ ┌──────┐                                         │
│  │▦ Grid │ │≡ List│  🔍 Search properties...   Filter ▾     │
│  └───────┘ └──────┘                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐│
│  │ 🏢 Maple Towers  │ │ 🏢 Oakridge      │ │ 🏢 The         ││
│  │                   │ │     Gardens      │ │     Pinnacle   ││
│  │  500 units        │ │  200 units       │ │  350 units     ││
│  │  1,203 users      │ │  456 users       │ │  892 users     ││
│  │                   │ │                  │ │                ││
│  │  Health: ●●●●○    │ │  Health: ●●●○○   │ │  Health: ●●●●● ││
│  │  Plan: Enterprise │ │  Plan: Pro       │ │  Plan: Enterp  ││
│  │  Since: Jan 2025  │ │  Since: Mar 2025 │ │  Since: Nov 24 ││
│  │                   │ │                  │ │                ││
│  │  [Manage] [View]  │ │  [Manage] [View] │ │  [Manage] [View││
│  └──────────────────┘ └──────────────────┘ └────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Add Property Wizard (5 steps):**

| Step | Title | Fields | Validation |
|------|-------|--------|------------|
| 1 | Basic Information | Name, legal name, address, total floors, total units, timezone | All required fields validated |
| 2 | Organization | Select existing or create new organization, assign primary admin | Organization must exist |
| 3 | Initial Configuration | Default event types (from template library), default roles, notification channels | At least 1 event type, 1 admin role |
| 4 | Branding | Logo upload, primary color, property email, phone | Logo optional, color defaults to brand blue |
| 5 | Review & Launch | Summary of all settings, "Launch Property" button | All previous steps complete |

**Wizard UX:**
- Step indicator with animated progress bar at top
- Each step is a full-screen card with generous padding
- "Back" and "Next" buttons, keyboard navigable
- Validation on "Next" (not on blur, to reduce friction)
- Step 5 shows everything in a read-only summary with "Edit" links back to each step
- "Launch Property" sends welcome email to assigned admin

### 3.5 AI Configuration (Super Admin)

**Route**: `/admin/ai/config`

```
┌──────────────────────────────────────────────────────────────┐
│  AI Configuration                                             │
│  Manage AI providers, model selection, and budget limits      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  PROVIDER KEYS                                            ││
│  │                                                           ││
│  │  Claude (Anthropic)                                       ││
│  │  API Key: sk-ant-•••••••••••••••vK3m     [Rotate] [Test] ││
│  │  Status: ● Connected    Last verified: 2 hours ago        ││
│  │                                                           ││
│  │  OpenAI                                                   ││
│  │  API Key: sk-proj-•••••••••••••••8xQ     [Rotate] [Test] ││
│  │  Status: ● Connected    Last verified: 2 hours ago        ││
│  │                                                           ││
│  │  ⓘ Keys are encrypted with AES-256-GCM. Only the last   ││
│  │    4 characters are displayed.                            ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  PER-FEATURE MODEL SELECTION                              ││
│  │                                                           ││
│  │  Feature             Provider    Model           Fallback ││
│  │  ───────────────────────────────────────────────────────  ││
│  │  Event categorize    Auto ▾      Claude Haiku ▾  GPT-4o  ││
│  │  Grammar correction  Claude ▾    Claude Sonnet ▾ GPT-4o  ││
│  │  Package courier AI  Auto ▾      Claude Haiku ▾  GPT-4o-m││
│  │  Incident severity   Claude ▾    Claude Sonnet ▾ GPT-4o  ││
│  │  Report insights     Auto ▾      Claude Opus ▾   GPT-4o  ││
│  │  Natural lang search Auto ▾      Claude Haiku ▾  GPT-4o-m││
│  │  Shift summary       Claude ▾    Claude Sonnet ▾ GPT-4o  ││
│  │  Anomaly detection   Claude ▾    Claude Opus ▾   GPT-4o  ││
│  │                                                           ││
│  │  ⓘ "Auto" selects the cheapest available provider that   ││
│  │    meets latency requirements. Fallback activates if      ││
│  │    primary provider is unavailable or over budget.        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  BUDGET CONTROLS                                          ││
│  │                                                           ││
│  │  Global Monthly Budget: $  500.00   [Set]                 ││
│  │  Current Spend: $387.42 (78%)  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░         ││
│  │                                                           ││
│  │  Per-Property Limits:                                     ││
│  │  Maple Towers       $150/mo  $112.30 (75%)  ▓▓▓▓▓▓░░    ││
│  │  Oakridge Gardens    $75/mo   $58.20 (78%)  ▓▓▓▓▓▓░░    ││
│  │  The Pinnacle       $100/mo   $89.50 (90%)  ▓▓▓▓▓▓▓▓░   ││
│  │  ...                                                      ││
│  │                                                           ││
│  │  ⚠ Alert: The Pinnacle is at 90% of monthly budget.      ││
│  │    [Increase Limit] [Review Usage] [Notify Admin]         ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.6 AI Cost Tracker

**Route**: `/admin/ai/costs`

**Purpose**: Real-time cost visibility across all properties and features.

```
┌──────────────────────────────────────────────────────────────┐
│  AI Cost Tracker                    Period: March 2026 ▾      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│  │ Total Spend │ │ Avg / Day   │ │ Avg / Call  │ │ Total   ││
│  │   $387.42   │ │   $25.83    │ │   $0.0034   │ │ Calls   ││
│  │  ↑ 12% MoM  │ │  ↓ 3% MoM  │ │  ↓ 8% MoM  │ │ 113,947 ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Daily Cost Trend (Bar chart)                             ││
│  │  █ Claude   █ OpenAI                                      ││
│  │                                                           ││
│  │  $40 ┤                                                    ││
│  │      │    ██                                              ││
│  │  $30 ┤ ██ ██ ██       ██                                  ││
│  │      │ ██ ██ ██ ██ ██ ██ ██                               ││
│  │  $20 ┤ ██ ██ ██ ██ ██ ██ ██ ██                            ││
│  │      │ ██ ██ ██ ██ ██ ██ ██ ██ ██                         ││
│  │  $10 ┤ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██                      ││
│  │      └─────────────────────────────→                      ││
│  │       1  2  3  4  5  6  7  8  9  10 ...                   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌───────────────────────┐ ┌────────────────────────────────┐│
│  │  Cost by Feature      │ │  Cost by Property              ││
│  │  (Donut chart)        │ │  (Horizontal bar)              ││
│  │                       │ │                                ││
│  │    ╭───╮              │ │  Maple Towers    ▓▓▓▓▓▓▓  $112││
│  │   ╱ 28% ╲  Grammar   │ │  The Pinnacle    ▓▓▓▓▓▓   $90 ││
│  │  │  22%  │  Categorize│ │  Oakridge Gdns   ▓▓▓▓     $58 ││
│  │   ╲ 18% ╱  Search    │ │  Lakeview        ▓▓▓      $45 ││
│  │    ╰───╯   Other 32% │ │  Harbor Point    ▓▓       $38 ││
│  └───────────────────────┘ └────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.7 Billing & Subscriptions

**Route**: `/admin/billing/plans`

```
┌──────────────────────────────────────────────────────────────┐
│  Billing & Subscriptions                                      │
│  Manage property plans, invoices, and payment methods          │
├──────────────────────────────────────────────────────────────┤
│  [Plans & Pricing] [Invoices] [Payment Methods] [Usage]       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   MRR       │ │   ARR       │ │ Properties  │            │
│  │  $8,450     │ │  $101,400   │ │  Active: 12 │            │
│  │  ↑ 15% MoM  │ │  ↑ 22% YoY  │ │  Trial: 2   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                               │
│  Property          Plan         Units  MRR       Status      │
│  ────────────────────────────────────────────────────────── │
│  Maple Towers      Enterprise   500    $1,500    ● Active    │
│  The Pinnacle      Enterprise   350    $1,050    ● Active    │
│  Oakridge Gardens  Professional 200    $600      ● Active    │
│  Lakeview Suites   Professional 180    $540      ● Active    │
│  Harbor Point      Starter      120    $240      ● Active    │
│  Birchwood Manor   Starter       50    $100      ◐ Trial     │
│  ...                                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.8 Security & Compliance Dashboard

**Route**: `/admin/security/compliance`

```
┌──────────────────────────────────────────────────────────────┐
│  Security & Compliance                                        │
│  8 compliance frameworks tracked                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ PIPEDA   │ │ GDPR     │ │ SOC 2    │ │ ISO 27001│       │
│  │ ● Pass   │ │ ● Pass   │ │ ● Pass   │ │ ● Pass   │       │
│  │ 48/48    │ │ 52/52    │ │ 89/89    │ │ 114/114  │       │
│  │ controls │ │ controls │ │ controls │ │ controls │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ ISO 27701│ │ ISO 27017│ │ ISO 9001 │ │ HIPAA    │       │
│  │ ● Pass   │ │ ● Pass   │ │ ● Pass   │ │ ● Pass   │       │
│  │ 38/38    │ │ 29/29    │ │ 22/22    │ │ 45/45    │       │
│  │ controls │ │ controls │ │ controls │ │ controls │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  RECENT SECURITY EVENTS                                       │
│  ─────────────────────────────────────────────────────────── │
│  ● 2 min ago   Failed login attempt (5th) — IP 192.168.1.42 │
│  ● 15 min ago  API key rotated — Property: Maple Towers      │
│  ● 1 hour ago  Encryption key rotation completed             │
│  ● 3 hours ago SAST scan completed — 0 findings              │
│  ● 6 hours ago Automated backup — All properties successful  │
│                                                               │
│  ENCRYPTION KEY STATUS                                        │
│  ─────────────────────────────────────────────────────────── │
│  Property          Key Age    Next Rotation  Status           │
│  Maple Towers      67 days   23 days        ● Current        │
│  Oakridge Gardens  45 days   45 days        ● Current        │
│  The Pinnacle      89 days   1 day          ⚠ Rotate Soon    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.9 Global User Management

**Route**: `/admin/users`

```
┌──────────────────────────────────────────────────────────────┐
│  Users (System-Wide)                    ┌─────────────────┐  │
│  2,156 users across 12 properties       │ + Create User   │  │
│                                         └─────────────────┘  │
│  🔍 Search by name, email, role...                            │
│  Filter: Property ▾  Role ▾  Status ▾  Last Active ▾         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Name              Email              Property        Role    │
│  ────────────────────────────────────────────────────────── │
│  Sarah Chen        sarah@maple.ca     Maple Towers    Admin   │
│  John Park         john@maple.ca      Maple Towers    PM      │
│  Maria Garcia      maria@oakridge.ca  Oakridge Gdns   Admin   │
│  David Kim         david@maple.ca     Maple Towers    Guard   │
│  ...                                                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ACTIVE SESSIONS MONITOR                               │  │
│  │  Currently online: 47 users                            │  │
│  │                                                        │  │
│  │  Property          Online  Sessions  Avg Duration      │  │
│  │  Maple Towers      18      23        2h 14m            │  │
│  │  The Pinnacle      12      15        1h 45m            │  │
│  │  Oakridge Gardens   8       9        3h 02m            │  │
│  │  ...                                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.10 Feature Flags Management

**Route**: `/admin/api/features`

```
┌──────────────────────────────────────────────────────────────┐
│  Feature Flags                                                │
│  Control feature rollout across properties                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Feature                Status   Properties   Rollout        │
│  ─────────────────────────────────────────────────────────── │
│  AI Event Categorize    ● Live   12/12        100%  [━━━━━━] │
│  AI Grammar Correct     ● Live   12/12        100%  [━━━━━━] │
│  Voice Notifications    ◐ Beta    3/12         25%  [━━░░░░] │
│  Community Forum        ◐ Beta    1/12          8%  [━░░░░░] │
│  Dark Mode              ○ Dev     0/12          0%  [░░░░░░] │
│  Mobile Push v2         ○ Dev     0/12          0%  [░░░░░░] │
│                                                               │
│  Click any feature to manage rollout percentage,              │
│  enable/disable per property, and view usage metrics.         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Property Admin Panel — Complete Blueprint

### 4.1 Property Admin Shell Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌───────┐ CONCIERGE              🔍 ⌘K     🔔 5    👤 Sarah ▾ │
│  │ LOGO  │ Maple Towers ▾                                        │
│  └───────┘ (property switcher for multi-property admins)         │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│ OVERVIEW │   Content Area                                         │
│  ● Dash  │                                                        │
│    Units │                                                        │
│    Amens │                                                        │
│          │                                                        │
│ OPERATE  │                                                        │
│    Events│                                                        │
│    Pkgs  │                                                        │
│    Secur │                                                        │
│    Maint │                                                        │
│    Anncs │                                                        │
│    Shift │                                                        │
│          │                                                        │
│ MANAGE   │                                                        │
│    Users │                                                        │
│    Report│                                                        │
│    Train │                                                        │
│          │                                                        │
│ COMMUNITY│                                                        │
│    Forum │                                                        │
│    Class │                                                        │
│    Libr  │                                                        │
│          │                                                        │
│ ADMIN    │                                                        │
│  ⚙ Setts │                                                        │
│          │                                                        │
│ ──────── │                                                        │
│ 👤 Sarah │                                                        │
│ Prop.Adm │                                                        │
└──────────┴───────────────────────────────────────────────────────┘
```

### 4.2 Property Dashboard (Property Admin Home)

**Route**: `/dashboard`

**Purpose**: Building overview with actionable insights. The first screen every morning.

```
┌──────────────────────────────────────────────────────────────┐
│  Good morning, Sarah                     March 15, 2026      │
│  Maple Towers has 7 items needing your attention today.      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│  │ Occupancy   │ │ Open Events │ │ Unreleased  │ │ Maint   ││
│  │   94%       │ │     23      │ │  Packages   │ │ Requests││
│  │  478/500    │ │  ↓ 15% WoW  │ │     12      │ │    8    ││
│  │  units      │ │             │ │  oldest: 2d │ │  3 high ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                                                               │
│  ┌─────────────────────────────┐ ┌───────────────────────────┐│
│  │  Staff Activity Today       │ │  AI Insights              ││
│  │                              │ │                           ││
│  │  John (PM)     23 actions    │ │  💡 Package volume is 34% ││
│  │  David (Guard) 18 actions    │ │     higher than last week.││
│  │  Lisa (Desk)   45 actions    │ │     Consider adding a     ││
│  │  Ahmed (Maint) 12 actions    │ │     temporary storage     ││
│  │                              │ │     shelf near the lobby. ││
│  │  Total: 98 actions           │ │                           ││
│  │  Avg response: 4.2 min      │ │  💡 Unit 815 has submitted ││
│  └─────────────────────────────┘ │     3 maintenance requests ││
│                                   │     this month. May need   ││
│  ┌──────────────────────────────┐│     a wellness check.      ││
│  │  Compliance Status            │└───────────────────────────┘│
│  │                               │                             │
│  │  Fire Inspection    ● Up to date  Expires: Jun 2026        │
│  │  Elevator Cert      ● Up to date  Expires: Sep 2026        │
│  │  Insurance          ⚠ Expiring    Expires: Apr 2026        │
│  │  HVAC Maintenance   ● On schedule Next: Apr 1              │
│  │  Vendor Compliance  ⚠ 2 expired   [View Vendors →]        │
│  └──────────────────────────────┘                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Recent Activity (Real-time feed)                         ││
│  │                                                           ││
│  │  ● 3 min ago  Lisa logged package for Unit 1205 (Amazon) ││
│  │  ● 8 min ago  David completed patrol (North wing)        ││
│  │  ● 12 min ago Ahmed closed maint request #MR-2026-0342   ││
│  │  ● 20 min ago System: backup completed successfully      ││
│  │  ● 35 min ago John approved alteration for Unit 407      ││
│  │                                              Load More ↓ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Settings Panel (16 Tabs)

**Route**: `/settings`

**Layout**: Left sidebar tabs + right content area (Stripe Settings pattern)

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                           🔍 Search settings...     │
├──────────────┬───────────────────────────────────────────────┤
│              │                                                │
│  PROPERTY    │   [Tab Content Area]                           │
│  ● Setup    │                                                │
│    Events    │   Content changes based on selected tab.       │
│    Maint Cat │   Each tab auto-saves with debounce.           │
│    Amenities │   "Last saved 2 min ago" indicator at top.     │
│    Notifs    │                                                │
│    Roles     │                                                │
│    Fields    │                                                │
│    AI        │                                                │
│    Branding  │                                                │
│              │                                                │
│  SYSTEM      │                                                │
│    Audit Log │                                                │
│    Health    │                                                │
│    Billing   │                                                │
│    Import    │                                                │
│    API Keys  │                                                │
│    Buzzers   │                                                │
│    Backup    │                                                │
│              │                                                │
└──────────────┴───────────────────────────────────────────────┘
```

**Tab UX Patterns:**

| Pattern | Description | Used In |
|---------|-------------|---------|
| **Form sections** | Grouped form fields with section headers. Auto-save. | Property Setup, Branding |
| **Reorderable list** | Drag-to-reorder items with edit/delete/deactivate. | Event Types, Maint Categories |
| **Matrix grid** | Checkbox matrix (role x permission). | Roles & Permissions |
| **Template editor** | Rich text with variable insertion ({resident_name}). | Notification Templates |
| **Schema builder** | Drag-drop field types to build custom forms. | Custom Fields |
| **Provider config** | API key + model selection + budget. | AI Configuration |
| **File uploader** | Image preview + crop. | Branding |
| **Log viewer** | Filterable, searchable, exportable list. | Audit Log |
| **Dashboard** | Real-time metrics with charts. | System Health |
| **Billing table** | Invoices with download links. | Billing |
| **Import wizard** | Upload → Preview → Validate → Confirm. | Data Import/Export |
| **Key manager** | Generate, copy, rotate, revoke. | API Keys |
| **Directory** | Searchable table with inline edit. | Buzzer Codes |
| **Status panel** | Backup history with restore button. | Backup & Recovery |

### 4.4 Tab 2: Event Type Configuration (Detailed)

**Route**: `/settings/event-types`

This is one of the most complex settings tabs — it defines the configurable event types that replace hardcoded log types.

```
┌──────────────────────────────────────────────────────────────┐
│  Event Type Configuration                                     │
│  Configure the types of events that can be logged.            │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  EVENT GROUPS                    [+ Add Group]            ││
│  │                                                           ││
│  │  ≡ Security          6 types  ● Active                    ││
│  │  ≡ Package           4 types  ● Active                    ││
│  │  ≡ Maintenance       3 types  ● Active                    ││
│  │  ≡ Visitor           2 types  ● Active                    ││
│  │  ≡ General           5 types  ● Active                    ││
│  │  ≡ Cleaning          2 types  ● Active                    ││
│  │                                                           ││
│  │  ⓘ Drag groups to reorder. Groups organize event types   ││
│  │    in the creation dropdown.                              ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  SECURITY EVENT TYPES            [+ Add Type]             ││
│  │                                                           ││
│  │  ≡  🔴  Incident Report        Required fields: 4        ││
│  │     Notifications: Email + Push  [Edit] [Deactivate]      ││
│  │                                                           ││
│  │  ≡  🟠  Parking Violation      Required fields: 3        ││
│  │     Notifications: Email         [Edit] [Deactivate]      ││
│  │                                                           ││
│  │  ≡  🔵  Visitor Check-In       Required fields: 2        ││
│  │     Notifications: None          [Edit] [Deactivate]      ││
│  │                                                           ││
│  │  ≡  🟢  Key/FOB Sign-Out       Required fields: 2        ││
│  │     Notifications: None          [Edit] [Deactivate]      ││
│  │                                                           ││
│  │  ≡  🟣  Pass-On Note           Required fields: 1        ││
│  │     Notifications: None          [Edit] [Deactivate]      ││
│  │                                                           ││
│  │  ≡  ⚪  Patrol Log             Required fields: 1        ││
│  │     Notifications: None          [Edit] [Deactivate]      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Edit Event Type Modal:**

```
┌──────────────────────────────────────────────────────────────┐
│  Edit Event Type: Incident Report                    [×]      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  BASICS                                                       │
│  ┌────────────────────────┐  ┌──────────────────────────┐    │
│  │ Name                   │  │ Group: Security ▾        │    │
│  │ Incident Report        │  │                          │    │
│  └────────────────────────┘  └──────────────────────────┘    │
│  ┌────────────────────────┐  ┌──────────────────────────┐    │
│  │ Icon: 🔴 ▾             │  │ Color: #FF3B30 ▾        │    │
│  └────────────────────────┘  └──────────────────────────┘    │
│                                                               │
│  REQUIRED FIELDS                                              │
│  ☑ Title            ☑ Description        ☑ Unit              │
│  ☑ Priority         ☐ Resident           ☑ Location          │
│  ☐ Photo Required   ☐ Signature Required                     │
│                                                               │
│  CUSTOM FIELDS                     [+ Add Custom Field]       │
│  ≡ Severity Level    Dropdown   [Low, Medium, High, Critical] │
│  ≡ Witness Present   Toggle     [Yes/No]                      │
│  ≡ Police Notified   Toggle     [Yes/No]                      │
│  ≡ Report Number     Text       [Max 50 chars]                │
│                                                               │
│  NOTIFICATIONS                                                │
│  ☑ Email to Property Admin                                    │
│  ☑ Push to Property Manager                                   │
│  ☐ SMS to Emergency Contact                                   │
│  ☐ Voice call cascade                                         │
│                                                               │
│  ▸ Show Advanced (auto-close, SLA, AI features)               │
│                                                               │
│  [Cancel]                                    [Save Changes]   │
└──────────────────────────────────────────────────────────────┘
```

### 4.5 Tab 6: Role & Permission Management (Detailed)

**Route**: `/settings/roles`

```
┌──────────────────────────────────────────────────────────────┐
│  Role & Permission Management                                 │
│  Define what each role can see and do.                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ROLES                [+ Create Role]  [Clone Existing ▾]     │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Property │ │ Property │ │ Security │ │ Security │       │
│  │ Admin    │ │ Manager  │ │ Superv.  │ │ Guard    │       │
│  │ 3 users  │ │ 5 users  │ │ 2 users  │ │ 8 users  │       │
│  │ [Edit]   │ │ [Edit]   │ │ [Edit]   │ │ [Edit]   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Front    │ │ Maint.   │ │ Board    │ │ Resident │       │
│  │ Desk     │ │ Staff    │ │ Member   │ │          │       │
│  │ 4 users  │ │ 6 users  │ │ 5 users  │ │ 478 users│       │
│  │ [Edit]   │ │ [Edit]   │ │ [Edit]   │ │ [Edit]   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  PERMISSION MATRIX — Editing: Security Guard              ││
│  │                                                           ││
│  │  Module          View  Create  Edit  Delete  Export  Admin││
│  │  ─────────────────────────────────────────────────────── ││
│  │  Dashboard       ☑     -       -     -       -      -    ││
│  │  Events          ☑     ☑       ☑     ☐       ☑      ☐    ││
│  │  Packages        ☑     ☑       ☑     ☐       ☑      ☐    ││
│  │  Security        ☑     ☑       ☑     ☐       ☑      ☐    ││
│  │  Maintenance     ☐     ☐       ☐     ☐       ☐      ☐    ││
│  │  Amenities       ☐     ☐       ☐     ☐       ☐      ☐    ││
│  │  Announcements   ☑     ☐       ☐     ☐       ☐      ☐    ││
│  │  Units           ☑     ☐       ☐     ☐       ☐      ☐    ││
│  │  Users           ☐     ☐       ☐     ☐       ☐      ☐    ││
│  │  Reports         ☐     ☐       ☐     ☐       ☐      ☐    ││
│  │  Settings        ☐     ☐       ☐     ☐       ☐      ☐    ││
│  │  Training        ☑     ☐       ☐     ☐       ☐      ☐    ││
│  │  Community       ☐     ☐       ☐     ☐       ☐      ☐    ││
│  │  Shift Log       ☑     ☑       ☑     ☐       ☐      ☐    ││
│  │                                                           ││
│  │  ⓘ Changes auto-save. Affects 8 users with this role.    ││
│  │  ⚠ Removing "Events: View" will hide the Events page     ││
│  │    from all Security Guards. [Proceed] [Cancel]           ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.6 Tab 8: AI Configuration (Property-Level)

**Route**: `/settings/ai`

```
┌──────────────────────────────────────────────────────────────┐
│  AI Configuration — Maple Towers                              │
│  Override system-wide AI settings for this property.          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  AI FEATURES                                                  │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  Event Auto-Categorize                     ● Enabled  [━━━]  │
│  Automatically assigns event type based                       │
│  on description text.                                         │
│  Accuracy: 94.2% (last 30 days)                              │
│  ⓘ Uses Claude Haiku. ~$0.001 per call.                     │
│                                                               │
│  Grammar & Tone Correction                 ● Enabled  [━━━]  │
│  Polishes incident reports and announcements                  │
│  before they're shared.                                       │
│  Usage: 234 corrections this month                           │
│  ⓘ Uses Claude Sonnet. ~$0.003 per call.                    │
│                                                               │
│  Package Courier Detection                 ● Enabled  [━━━]  │
│  Identifies courier from package photo.                       │
│  Accuracy: 91.7% (last 30 days)                              │
│  ⓘ Uses Claude Haiku. ~$0.002 per call.                     │
│                                                               │
│  Incident Severity Classification          ○ Disabled [───]  │
│  Auto-assigns severity level to incidents.                    │
│  Not enabled for this property.                               │
│  ⓘ Uses Claude Sonnet. ~$0.003 per call.                    │
│                                                               │
│  Natural Language Search                   ● Enabled  [━━━]  │
│  Search using plain English queries.                          │
│  Usage: 89 queries this month                                │
│  ⓘ Uses Claude Haiku. ~$0.001 per call.                     │
│                                                               │
│  AI Daily Briefing                         ● Enabled  [━━━]  │
│  Morning summary of overnight events,                         │
│  patterns, and recommendations.                               │
│  ⓘ Uses Claude Sonnet. ~$0.005 per call.                    │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  MONTHLY AI COST FOR THIS PROPERTY                        ││
│  │                                                           ││
│  │  Budget: $150/month                                       ││
│  │  Spent:  $112.30 (75%)  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░                ││
│  │                                                           ││
│  │  ⓘ When budget is reached, AI features gracefully        ││
│  │    degrade to rule-based fallbacks. No disruption.        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.7 Tab 9: Branding & Theming

**Route**: `/settings/branding`

```
┌──────────────────────────────────────────────────────────────┐
│  Branding & Theming — Maple Towers                            │
│  Customize the look and feel for your property.               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  LOGO                                                         │
│  ┌──────────┐                                                │
│  │          │  Upload your property logo (PNG, SVG, max 2MB) │
│  │  [LOGO]  │  Recommended: 200x60px, transparent background │
│  │          │                                                │
│  └──────────┘  [Upload New Logo]  [Remove]                   │
│                                                               │
│  PRIMARY COLOR                                                │
│  ┌──────┐  Hex: #2563EB                                      │
│  │ ████ │  Used for: sidebar active state, primary buttons,  │
│  │ ████ │  links, and toggles.                               │
│  └──────┘  [Change Color]                                    │
│                                                               │
│  PREVIEW                                                      │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  ┌────────┐                                               ││
│  │  │ [LOGO] │  Maple Towers            🔔    👤            ││
│  │  ├────────┤                                               ││
│  │  │ ● Dash │  Welcome, Sarah                               ││
│  │  │   Units│  ┌──────────┐                                 ││
│  │  │   Pkgs │  │ Button   │  ← uses primary color          ││
│  │  │        │  └──────────┘                                 ││
│  │  └────────┘                                               ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  EMAIL HEADER                                                 │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  [LOGO]  Maple Towers                                     ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━  ← primary color accent bar  ││
│  │                                                           ││
│  │  Preview of email notification header.                    ││
│  │  All system emails will use this branding.                ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  LOGIN PAGE                                                   │
│  ☑ Show property logo on login page                          │
│  ☑ Show property name below logo                             │
│  ☐ Custom welcome message: [________________________]        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.8 Tab 10: Audit Log

**Route**: `/settings/audit`

```
┌──────────────────────────────────────────────────────────────┐
│  Audit Log — Maple Towers                                     │
│  Every configuration and data change is recorded.             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  🔍 Search...   Actor ▾   Action ▾   Entity ▾   Date Range ▾ │
│                                                               │
│  [Export CSV]  [Export PDF]                                    │
│                                                               │
│  Timestamp          Actor         Action    Entity   Detail   │
│  ────────────────────────────────────────────────────────── │
│  Mar 15 09:23 AM    Sarah Chen    UPDATE    Settings  Changed │
│                                                    notification│
│                                                    template for│
│                                                    Package     │
│                                                    Delivery    │
│                                             [View Changes →]  │
│                                                               │
│  Mar 15 09:18 AM    Sarah Chen    CREATE    User     Created  │
│                                                    new user    │
│                                                    david.kim   │
│                                                    with role   │
│                                                    Guard       │
│                                             [View Changes →]  │
│                                                               │
│  Mar 15 08:45 AM    John Park     UPDATE    Event    Closed   │
│                                                    event      │
│                                                    #EV-2026-  │
│                                                    0847       │
│                                             [View Changes →]  │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│  Showing 1-50 of 12,847 entries    ← 1 2 3 ... 257 →        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**"View Changes" Expandable:**
```
┌──────────────────────────────────────────────────────────────┐
│  Change Detail                                                │
│                                                               │
│  Field              Before              After                 │
│  ────────────────────────────────────────────────────────── │
│  Subject Line       "Package for {unit}" "📦 Package for     │
│                                          {unit_number}"       │
│  Body Template      [View full diff →]                        │
│  SMS Enabled        false                true                 │
│                                                               │
│  Changed by: Sarah Chen (sarah@maple.ca)                     │
│  IP: 192.168.1.42   Device: Chrome 124 / macOS               │
│  Timestamp: March 15, 2026 09:23:14 AM EST                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Cross-Cutting Admin UX Patterns

### 5.1 Settings Search

Cmd+K in settings context searches across ALL tabs:

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 Search settings...                                        │
│                                                               │
│  Results for "notification"                                   │
│                                                               │
│  SETTINGS                                                     │
│  📋 Notification Templates → Tab 5                            │
│  📋 Email Notification Toggle → Property Setup → Tab 1        │
│  📋 SMS Provider → AI Configuration → Tab 8                   │
│  📋 Do-Not-Disturb Hours → Notification Templates → Tab 5    │
│                                                               │
│  HELP                                                         │
│  📖 How to set up email notifications                         │
│  📖 Configuring SMS alerts for residents                      │
│  📖 Emergency broadcast setup guide                           │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Contextual Help Panel

Available on every settings tab:

```
                                        ┌───────────────────────┐
                                        │ ? HELP                │
                                        │                       │
                                        │ Event Types           │
                                        │ ─────────────────── │
                                        │ Event types define    │
                                        │ the categories your   │
                                        │ staff use to log      │
                                        │ activities.           │
                                        │                       │
                                        │ 📹 Watch 2-min video  │
                                        │                       │
                                        │ COMMON QUESTIONS       │
                                        │ ▸ How do I add a new  │
                                        │   event type?         │
                                        │ ▸ Can I delete an     │
                                        │   event type?         │
                                        │ ▸ What happens when I │
                                        │   deactivate a type?  │
                                        │                       │
                                        │ Need more help?       │
                                        │ [Contact Support]     │
                                        └───────────────────────┘
```

### 5.3 Impact Preview Pattern

Before saving destructive changes:

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Impact Preview                                            │
│                                                               │
│  You're about to disable "SMS Notifications"                  │
│                                                               │
│  This will affect:                                            │
│  • 342 residents who have SMS enabled                         │
│  • 12 notification templates that include SMS                 │
│  • Emergency broadcast will lose SMS channel                  │
│                                                               │
│  The following templates will be affected:                    │
│  • Package Delivery (sent 156 times last month)              │
│  • Maintenance Update (sent 89 times)                        │
│  • Announcement (sent 34 times)                              │
│                                                               │
│  [Cancel]                               [Disable SMS →]      │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 Inline Save Pattern

Settings use auto-save with visual feedback:

```
  Field Label                          ✓ Saved 2s ago
  ┌────────────────────────────────┐
  │ Current value                  │
  └────────────────────────────────┘
  Last changed by Sarah Chen, 3 days ago
```

States:
1. **Idle**: No indicator
2. **Editing**: Field border turns blue, "Saving..." appears after 1.5s debounce
3. **Saved**: Green checkmark "✓ Saved just now"
4. **Error**: Red "✗ Failed to save. [Retry]"

### 5.5 Bulk Operations Pattern

For list-based settings (event types, users, amenities):

```
┌──────────────────────────────────────────────────────────────┐
│  ☑ 3 items selected        [Activate] [Deactivate] [Delete]  │
│                                                               │
│  ☑ ≡ Incident Report      ● Active                           │
│  ☑ ≡ Parking Violation     ● Active                           │
│  ☐ ≡ Visitor Check-In      ● Active                           │
│  ☑ ≡ Key/FOB Sign-Out      ○ Inactive                         │
│  ☐ ≡ Pass-On Note          ● Active                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Navigation Differences by Admin Level

### 6.1 Super Admin Complete Nav

```
SYSTEM
├── Dashboard
├── System Health
├── Properties
└── Users (Global)

AI & INTELLIGENCE
├── AI Configuration
├── AI Cost Tracker
└── AI Models

BILLING
├── Plans & Pricing
├── Invoices
└── Usage Metering

SECURITY & COMPLIANCE
├── Compliance Dashboard
├── Audit Trail (Global)
├── Incident Response
└── Encryption Status

DEVELOPER
├── API Keys
├── Webhooks
├── Rate Limits
└── Feature Flags

MAINTENANCE
├── Backup Status
├── Default Templates
└── System Settings
```

### 6.2 Property Admin Complete Nav

```
OVERVIEW
├── Dashboard
├── Units & Residents
└── Amenities

OPERATIONS
├── Events
├── Packages
├── Security
├── Maintenance
├── Announcements
└── Shift Log

MANAGE
├── Users
├── Reports
└── Training

COMMUNITY
├── Forum
├── Classified Ads
└── Library

ADMIN
└── Settings (16 tabs)
```

### 6.3 Property Manager Complete Nav

Same as Property Admin but:
- Settings opens in **read-only** mode
- Users shows **view-only** (no create/edit)
- No access to: Billing tab, API Keys tab, Backup & Recovery tab

---

## 7. Admin Panel Interactions and Animations

### 7.1 Settings Tab Switch

```
Trigger: Click settings tab
Animation:
  Current tab content: { opacity: 1 → 0, x: 0 → -20 } 150ms ease-out
  New tab content:     { opacity: 0 → 1, x: 20 → 0 }   200ms ease-out
  Tab indicator:       { x: oldPosition → newPosition }  spring(300, 30)
```

### 7.2 Property Card Hover (Super Admin)

```
Trigger: Mouse enters property card
Animation:
  Card: { y: 0 → -2, shadow: sm → md } spring(400, 30)
  Health dots: { scale: 1 → 1.05 } spring(300, 25)
Trigger: Mouse leaves
  Reverse with same spring values
```

### 7.3 Permission Toggle

```
Trigger: Click checkbox in permission matrix
Animation:
  Checkbox: { scale: 0.8 → 1.2 → 1 } spring(400, 15)
  Row highlight: { backgroundColor: transparent → accent-subtle → transparent } 600ms
  Impact counter: number increment animation if visible
```

### 7.4 Inline Save

```
Trigger: Field value changes (after 1.5s debounce)
Animation:
  Save indicator: { opacity: 0, y: -4 } → { opacity: 1, y: 0 } spring(300, 25)
  Checkmark: { scale: 0, rotate: -45 } → { scale: 1, rotate: 0 } spring(350, 20)
  After 5s: { opacity: 1 → 0 } 300ms ease-out
```

### 7.5 Reorderable List Drag

```
Trigger: Mouse down on drag handle (≡)
Animation:
  Dragged item: { scale: 1 → 1.02, shadow: sm → xl, zIndex: 1 → 50 } spring(400, 25)
  Other items: { y: reflow } spring(300, 30) — items smoothly reorder
  Drop: { scale: 1.02 → 1, shadow: xl → sm } spring(300, 30)
  Flash: { backgroundColor: accent-subtle → transparent } 400ms
```

---

## 8. Admin Mobile Responsiveness

While admins primarily use desktop monitors, the system must be functional on tablets and phones for emergency access.

### 8.1 Tablet (768-1024px)

- Sidebar collapses to icon-only (64px)
- Settings tabs switch from left sidebar to horizontal tabs
- Permission matrix becomes horizontally scrollable
- Property cards stack 2 per row
- Charts maintain aspect ratio, data tables scroll horizontally

### 8.2 Mobile (<768px)

- Sidebar becomes hamburger-triggered overlay
- Settings tabs become a dropdown selector
- Permission matrix becomes an accordion (one module at a time)
- Property cards stack 1 per row
- All charts full-width, horizontal scroll for data tables
- Quick action buttons become a bottom fixed bar

---

## 9. Admin Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + K` | Open command palette / search settings |
| `⌘ + S` | Force save current settings (normally auto-saves) |
| `⌘ + Z` | Undo last change (within 30s window) |
| `[` | Toggle sidebar collapse/expand |
| `⌘ + 1-9` | Quick switch to settings tab 1-9 |
| `⌘ + ⇧ + P` | Open property switcher |
| `Esc` | Close modal/panel, cancel editing |
| `Tab` | Navigate through form fields |
| `Enter` | Confirm/save in modals |

---

## 10. Admin Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| All settings navigable by keyboard | Tab order follows visual order. Arrow keys within groups. |
| Permission matrix keyboard accessible | Arrow keys to navigate cells, Space to toggle, Enter to confirm |
| Screen reader announces changes | "Setting saved", "Role updated", "Feature enabled" via aria-live |
| Color-coded health dots have text labels | ● Excellent (5/5), ● Good (4/5), etc. |
| Settings search accessible | Cmd+K opens focused search, results navigable by arrow keys |
| Charts have tabular alternatives | Every chart has a "View as table" toggle for screen readers |
| High contrast mode | All admin interfaces pass WCAG 2.2 AA in high contrast |
| Focus indicators | 2px blue outline on all interactive elements when focused via keyboard |

---

## 11. Admin Error Handling

### 11.1 Settings Save Failure

```
┌──────────────────────────────────────────────────────────────┐
│  ✗ Failed to save notification template.                      │
│                                                               │
│  The server couldn't process your changes.                   │
│  Your changes are preserved locally.                         │
│                                                               │
│  [Retry Now]  [Copy Changes]  [Contact Support]              │
│                                                               │
│  ▸ Technical details (click to expand)                        │
│    Error: 500 Internal Server Error                          │
│    Request ID: req_abc123def456                              │
│    Timestamp: 2026-03-15T09:23:14.567Z                      │
└──────────────────────────────────────────────────────────────┘
```

### 11.2 Permission Conflict

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Permission Conflict Detected                              │
│                                                               │
│  You're granting "Events: Delete" to Security Guard,         │
│  but this role doesn't have "Events: Edit".                  │
│                                                               │
│  Recommendation: Enable "Events: Edit" as well, or           │
│  guards won't be able to modify events before deletion.      │
│                                                               │
│  [Add Edit Permission Too]  [Keep Delete Only]  [Cancel]     │
└──────────────────────────────────────────────────────────────┘
```

### 11.3 Session Timeout During Admin Work

```
┌──────────────────────────────────────────────────────────────┐
│  ⏱ Session Expired                                           │
│                                                               │
│  Your session has expired after 15 minutes of inactivity.    │
│                                                               │
│  Don't worry — your unsaved changes are preserved locally.   │
│  Log back in to continue where you left off.                 │
│                                                               │
│  [Log In Again]                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Admin Panel Data Density Guidelines

### 12.1 Monitor-First Optimization (1920x1080)

Since 99% of admin users are on desktop monitors:

| Element | Monitor (1920px) | Laptop (1280px) |
|---------|-----------------|-----------------|
| KPI cards per row | 4 | 3 |
| Table rows visible | 20-25 | 12-15 |
| Table columns | 8-10 | 5-6 (horizontal scroll) |
| Settings sidebar width | 240px fixed | 200px or collapsed |
| Content max-width | 1440px centered | Full width with 24px margin |
| Side help panel | Always visible | Toggle on demand |
| Chart height | 400px | 300px |
| Property cards per row | 4 | 3 |

### 12.2 Data Table Density Modes

Admin tables support 3 density modes (toggled by icon in table header):

| Mode | Row height | Font size | Use case |
|------|-----------|-----------|----------|
| Comfortable | 56px | 15px | Default. Good for browsing. |
| Compact | 40px | 14px | Audit logs, long lists. More rows visible. |
| Dense | 32px | 13px | Export preview, data review. Maximum density. |

---

## 13. Admin Onboarding Flow

### 13.1 First-Time Property Admin Experience

When a Property Admin logs in for the first time:

```
Step 1/5: Welcome
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│            🏢                                                 │
│                                                               │
│  Welcome to Concierge, Sarah!                                │
│                                                               │
│  Let's get Maple Towers set up. This will take               │
│  about 5 minutes, and you can always change                  │
│  settings later.                                             │
│                                                               │
│                         [Let's Go →]                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘

Step 2/5: Verify Property Details
Step 3/5: Choose Event Types (checkboxes from template library)
Step 4/5: Set Up Notifications (email toggle, SMS toggle)
Step 5/5: Invite Staff (email addresses + role selector)
```

### 13.2 Feature Discovery Tooltips

First login shows contextual tooltips on key features:

```
┌─── Tooltip 1 of 5 ──────────────────┐
│                                       │
│  📍 This is your Command Palette     │
│                                       │
│  Press ⌘K to quickly search for      │
│  anything — units, residents,         │
│  settings, or actions.               │
│                                       │
│  [Got it]         [Skip tour]        │
└───────────────────────────────────────┘
```

---

## 14. Performance Requirements for Admin Panels

| Metric | Target | Measurement |
|--------|--------|-------------|
| Settings page load | <500ms | Time to interactive |
| Tab switch | <200ms | Content visible |
| Permission matrix render | <300ms | For 12 roles x 14 modules |
| Audit log query | <1s | For 1M+ entries with filters |
| Property card load | <400ms | Including health calculation |
| Chart render | <500ms | Including data fetch |
| Search results | <200ms | Settings search with highlights |
| Auto-save round trip | <500ms | Save + confirmation |

---

*This blueprint is designed from first principles without access to competitor admin panels.*
*Design references: Stripe Dashboard, Shopify Admin, Firebase Console, Vercel Dashboard, Linear Settings.*
*Quality target: Paris Design Awards submission-ready.*
