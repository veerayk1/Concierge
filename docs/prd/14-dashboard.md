# 14 -- Dashboard

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

The Dashboard is the first screen every user sees after logging in. It is **role-aware by design** -- each role gets a fundamentally different layout with different widgets, KPIs, quick actions, and activity feeds. A security guard sees active visitors and keys out. A resident sees their packages and upcoming bookings. A property manager sees building operations at a glance.

### Core Principles

| # | Principle | Detail |
|---|-----------|--------|
| 1 | **Role determines layout** | Each of the 12 roles defined in 02-Roles and Permissions has a distinct dashboard configuration. Users never customize away from their role's intent -- they customize within it. |
| 2 | **Glanceable, not dense** | A user should understand the state of their world in under 5 seconds. Large numbers, status colors, and clear labels. No walls of text. |
| 3 | **Actionable, not decorative** | Every widget either answers a question ("How many packages are waiting?") or enables an action ("Log a visitor"). No vanity metrics. |
| 4 | **Real-time by default** | KPI counts, badges, and activity feeds update via WebSocket. No manual refresh required. |
| 5 | **AI-enhanced, not AI-dependent** | AI generates briefings, flags anomalies, and suggests priorities. If AI is unavailable, the dashboard still shows all KPIs and actions -- just without the intelligence layer. |
| 6 | **Customizable within guardrails** | Users can reorder widgets and toggle optional ones. They cannot remove mandatory KPI cards or add widgets outside their role's permitted set. |

### What This Module Covers

- Role-specific dashboard layouts for all 12 roles
- Widget system (KPI cards, charts, feeds, quick actions, weather, announcements)
- Drag-and-drop widget customization
- Real-time badge counts
- AI Daily Briefing and 5 additional AI capabilities
- Shift handoff summary
- Building Health Score
- Empty states, loading states, and error states for every component

### What This Module Does NOT Cover

- Global search and command palette (see 15-Search and Navigation)
- Sidebar navigation structure (see 15-Search and Navigation)
- Individual module detail pages (see respective module PRDs)
- System-level Super Admin dashboard for multi-property portfolio (see 01-Architecture)

---

## 2. Research Summary

### Key Findings from Competitive Analysis

| Finding | Source | Concierge Decision |
|---------|--------|--------------------|
| One platform shows 8 static summary cards (users, amenities, announcements, bookings, packages, bulletins, logs, service requests) with a fixed 24-hour window. No role awareness. | Industry research (Platform 1) | Role-specific KPI cards with configurable time windows. Each role sees only relevant metrics. |
| Another platform shows 4 KPI cards tailored to security (active visitors, outstanding packages, open violations, key checkouts). Time periods are static and not user-adjustable. | Industry research (Platform 3) | KPI cards with adjustable time periods (today, 7 days, 30 days, all time) and role-specific card sets. |
| One platform includes charts (maintenance by month, email delivery stats, user breakdown) that are non-interactive and cannot be filtered or drilled into. | Industry research (Platform 1) | Interactive charts with hover tooltips, click-to-drill-down, and configurable time ranges. |
| One platform provides a weather widget integrated into the dashboard banner. Useful for staff planning (snow removal, storm prep). | Industry research (Platform 3) | Weather widget with AI-powered building-specific alerts (storm prep, AC demand, snow removal). |
| Announcements are shown on the dashboard via accordion-style expansion. Only one is expanded at a time. | Industry research (Platform 3) | Announcements widget with card-based display. Top 3 shown with "View All" link. No accordion -- cards are scannable. |
| No platform observed offers a daily briefing, anomaly detection, or AI-driven priority inbox on the dashboard. | Competitive gap | AI Daily Briefing, Anomaly Badges, and AI Priority Inbox are first-class dashboard features. |
| One platform shows line charts and bar charts for security activity and logs by month. Non-interactive, static time ranges. | Industry research (Platform 3) | Interactive charts with tooltips, zoom, and configurable date ranges. Charts respond to role context. |
| No platform offers drag-and-drop widget customization on the dashboard. All observed dashboards are fixed layouts. | Competitive gap | Drag-and-drop widget reordering with per-user persistence. Role guardrails prevent removing mandatory widgets. |

### Design Principles Derived from Research

1. **Role-aware KPIs beat one-size-fits-all.** A guard does not need to see total user count. A resident does not need to see shift logs.
2. **Interactive charts beat static charts.** If a chart cannot be clicked, hovered, or filtered, it is decoration.
3. **Weather matters for building operations.** Snow, storms, and heat waves directly affect building tasks. Weather should trigger actionable alerts, not just show temperature.
4. **Quick actions reduce clicks.** The most common actions per role should be reachable in one click from the dashboard.
5. **AI briefings are a competitive gap.** No observed platform generates a morning summary. This is a major differentiator.

---

## 3. Feature Spec

### 3.1 Role-Aware Dashboard Layouts

Each role receives a pre-configured dashboard layout. Layouts differ in which widgets are shown, their order, and which quick actions are available.

#### Super Admin Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| Platform Health KPI Bar | Top | Yes | 4 KPIs: total properties, active users across all properties, AI spend (MTD), system uptime % |
| Cross-Property Alerts | Row 2, full width | Yes | Alerts from all properties requiring Super Admin attention (budget exceeded, provider down, critical incident) |
| AI Cost Summary | Row 3, left | Yes | Sparkline showing daily AI spend for the past 30 days. Click to open AI Cost Dashboard. |
| Property Overview Grid | Row 3, right | Yes | Card grid showing each property with its Building Health Score, open issues count, and last activity timestamp |
| Quick Actions | Floating bottom-right | Yes | Switch Property, View AI Config, Platform Settings |

#### Property Admin Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| Building Health Score | Top-left | Yes | Composite score 0-100 with trend arrow and contributing factors |
| AI Daily Briefing | Top-right | No | AI-generated morning summary of overnight events, pending items, and today's priorities |
| KPI Cards Row | Row 2 | Yes | 6 cards: Open Requests, Unreleased Packages, Active Visitors, Today's Bookings, Resident Count, Staff On Duty |
| Announcements Widget | Row 3, left | Yes | Latest 3 announcements with "View All" link |
| Activity Feed | Row 3, right | Yes | Real-time feed of all building activity (events, packages, requests, bookings) |
| Charts Row | Row 4 | No | Maintenance by month (line chart), Package volume trend (bar chart) |
| Quick Actions | Floating bottom-right | Yes | Create User, Send Announcement, View Reports, AI Briefing |

#### Property Manager Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| AI Daily Briefing | Top, full width | No | Morning briefing with prioritized action items |
| KPI Cards Row | Row 2 | Yes | 6 cards: Open Requests, Unreleased Packages, Active Visitors, Today's Bookings, Pending Approvals, Vendor Compliance % |
| Shift Handoff Summary | Row 3, left | Yes | Summary of the previous shift's events, flagged items, and notes from outgoing staff |
| Activity Feed | Row 3, right | Yes | Real-time feed filtered to operational events |
| Building Health Score | Row 4, left | No | Composite score with trend |
| Charts Row | Row 4, right | No | Configurable charts (maintenance trends, package volume, amenity utilization) |
| Quick Actions | Floating bottom-right | Yes | Create Announcement, Assign Request, View Reports, Log Event |

#### Board Member Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| Building Health Score | Top-left | Yes | Composite score with 90-day trend chart |
| Financial Summary | Top-right | Yes | Key financial KPIs (configurable by Property Admin) |
| KPI Cards Row | Row 2 | Yes | 4 cards: Pending Approvals, Open Requests (count only), Compliance %, Satisfaction Score |
| Announcements Widget | Row 3, left | Yes | Latest 3 announcements |
| Reports Widget | Row 3, right | No | Recently generated reports with quick-open links |
| Quick Actions | Floating bottom-right | Yes | View Reports, Upcoming Meetings, View Announcements |

#### Security Supervisor Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| AI Daily Briefing | Top, full width | No | Security-focused briefing with overnight incidents, risk assessment, and staffing recommendations |
| KPI Cards Row | Row 2 | Yes | 6 cards: Active Incidents, Active Visitors, Keys Out, Unreleased Packages, Guards On Duty, Patrol Coverage % |
| Security Activity Chart | Row 3, left | Yes | 7-day line chart of security console activity with interactive tooltips |
| Shift Handoff Summary | Row 3, right | Yes | Previous shift summary with flagged items |
| Activity Feed | Row 4 | Yes | Security events from all guards in real time |
| Quick Actions | Floating bottom-right | Yes | View Incidents, Manage Shifts, Export Report, Review Escalations |

#### Security Guard Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| KPI Cards Row | Top | Yes | 4 large cards with big numbers: Active Visitors, Unreleased Packages, Keys Out, Open Incidents |
| Quick Actions Grid | Row 2, full width | Yes | 4 large tap-target buttons: + Visitor, + Package, + Incident, + Key Checkout |
| Shift Handoff Summary | Row 3 | Yes | Notes from outgoing shift. Expandable. |
| Recent Activity | Row 4 | Yes | Last 20 events from own shift. Auto-updates via WebSocket. |
| Weather Widget | Sidebar or Row 5 | No | Current weather with any building-relevant alerts |

#### Front Desk / Concierge Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| KPI Cards Row | Top | Yes | 4 cards: Unreleased Packages, Expected Visitors, Pending Items, Shift Notes Count |
| Quick Actions Grid | Row 2, full width | Yes | 4 buttons: + Package, + Visitor, + Note, Look Up Unit |
| Shift Handoff Summary | Row 3 | Yes | Previous shift's notes and flagged items |
| Recent Activity | Row 4 | Yes | Front desk activity feed (packages, visitors, notes) |
| Announcements Widget | Row 5 | No | Latest announcements for resident inquiries |
| Weather Widget | Sidebar or Row 5 | No | Current conditions |

#### Maintenance Staff Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| Assigned Requests | Top, full width | Yes | Priority-sorted list of assigned work orders. Each shows: unit, category, priority badge, age. Click to open. |
| KPI Cards Row | Row 2 | Yes | 3 cards: My Open Requests, Equipment Alerts, Scheduled Tasks Today |
| Quick Actions | Row 3 | Yes | Update Request, Log Work, View Schedule |
| Recent Activity | Row 4 | No | Own work order updates |

#### Resident (Owner) Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| KPI Cards Row | Top | Yes | 3 cards: My Packages (unreleased), My Open Requests, Upcoming Bookings |
| Announcements Widget | Row 2 | Yes | Latest 3 building announcements |
| Quick Actions Row | Row 3 | Yes | Book Amenity, Submit Request, View My Packages |
| Upcoming Events | Row 4 | No | Next 3 community events |
| Weather Widget | Sidebar | No | Current conditions |

#### Resident (Tenant) Dashboard

Same as Resident (Owner) with the following differences:
- No Surveys or Governance documents in any widget
- Quick Actions: Book Amenity, Submit Request, View My Packages (no governance actions)

#### Resident (Offsite Owner) Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| Announcements Widget | Top, full width | Yes | Latest 3 building announcements |
| KPI Cards Row | Row 2 | Yes | 2 cards: Unread Announcements, Upcoming Events |
| Quick Actions Row | Row 3 | Yes | View Announcements, View Library |

#### Family Member Dashboard

| Widget | Position | Mandatory | Description |
|--------|----------|-----------|-------------|
| KPI Cards Row | Top | Yes | 2 cards: My Packages, Upcoming Bookings |
| Announcements Widget | Row 2 | Yes | Latest 3 building announcements |
| Quick Actions Row | Row 3 | Yes | Book Amenity, View My Packages |

---

### 3.2 Widget System

#### 3.2.1 KPI Card Widget

A KPI card displays a single metric with contextual information.

**Layout**:
```
+------------------------------------------+
|  [icon]  Card Title            [i]       |
|                                          |
|  142                                     |
|                                          |
|  [calendar] Last 7 Days     View ->      |
+------------------------------------------+
```

**Fields**:

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| title | string | 40 chars | Yes | (varies by KPI) | Non-empty | "Card title is required" |
| icon | enum | -- | Yes | (varies by KPI) | Must be a valid icon key | "Invalid icon" |
| count | integer | 7 digits | Yes | 0 | Non-negative integer | "Count must be a non-negative number" |
| time_period | enum | -- | Yes | "today" | One of: today, 7_days, 30_days, all_time | "Invalid time period" |
| trend_direction | enum | -- | No | null | One of: up, down, flat, null | -- |
| trend_percentage | decimal(5,2) | -- | No | null | 0.00-999.99, null if no trend | -- |
| link_url | string | 255 chars | Yes | -- | Valid internal route | "Invalid navigation target" |
| color | enum | -- | Yes | "neutral" | One of: neutral, success, warning, danger, info | "Invalid status color" |

**Time Period Selector**:

| Element | Behavior |
|---------|----------|
| Dropdown trigger | Click the time period badge to open a dropdown |
| Options | Today, Last 7 Days, Last 30 Days, All Time |
| Persistence | Selection persists per user per card via user preferences |
| Default | Configurable per card type by Property Admin in Settings |

**States**:

| State | Appearance |
|-------|------------|
| **Loading** | Card skeleton with pulsing gray placeholder for count and title |
| **Loaded** | Full card with count, title, icon, time period, and trend indicator |
| **Error** | Card shows title and icon. Count replaced with "--". Tooltip: "Unable to load data. Click to retry." |
| **Empty (zero)** | Count shows "0" in neutral gray. No error state -- zero is valid data. |
| **Real-time update** | Count animates (number ticks up/down) when WebSocket delivers a new value. Brief green/red pulse on the number. |

**"View" Link Button**:

| Aspect | Detail |
|--------|--------|
| **Label** | "View ->" |
| **Action** | Navigates to the module listing page with the card's time period filter pre-applied |
| **Loading state** | Arrow icon spins briefly during navigation |
| **Success state** | User lands on the filtered listing page |
| **Failure state** | Toast notification: "Could not navigate to [module name]. Please try again." |

**Tooltip (info icon)**:

| Aspect | Detail |
|--------|--------|
| **Trigger** | Hover (desktop), tap (mobile) on the [i] icon |
| **Content** | Brief explanation of what the KPI measures. Example: "Counts all packages received but not yet picked up by the resident." |
| **Dismiss** | Click/tap outside, or after 5 seconds on mobile |

#### 3.2.2 Quick Action Widget

Large, tap-friendly buttons for the most common actions per role.

**Layout (Staff roles)**:
```
+----------+  +----------+  +----------+  +----------+
| [+ icon] |  | [+ icon] |  | [+ icon] |  | [+ icon] |
| Visitor   |  | Package  |  | Incident |  | Key      |
+----------+  +----------+  +----------+  +----------+
```

**Button Spec**:

| Field | Data Type | Max Length | Required | Default | Validation |
|-------|-----------|-----------|----------|---------|------------|
| label | string | 20 chars | Yes | -- | Non-empty |
| icon | enum | -- | Yes | -- | Valid icon key from design system |
| action_type | enum | -- | Yes | -- | One of: navigate, modal, create_event |
| target | string | 255 chars | Yes | -- | Valid route or modal ID |
| permission | string | -- | Yes | -- | Must match a permission the user holds |

**Button States**:

| State | Appearance |
|-------|------------|
| **Default** | White card with icon and label. Subtle border. |
| **Hover** | Light gray background (#F9FAFB). Slight lift shadow. |
| **Active/pressed** | Darker gray background (#F3F4F6). Shadow inset. |
| **Loading** | Spinner replaces icon. Label remains visible. |
| **Success** | Brief green check animation (300ms), then navigates or opens modal. |
| **Failure** | Toast: "Could not open [action name]. Please try again." Button returns to default. |
| **Disabled** | Never shown. If a user lacks permission, the button is absent (not grayed out). |

#### 3.2.3 Weather Widget

Displays current weather conditions and building-relevant alerts.

**Data Source**: Third-party weather API (OpenWeatherMap or similar). Property address is used to determine location. Polling interval: every 30 minutes.

**Fields**:

| Field | Data Type | Max Length | Required | Default | Validation |
|-------|-----------|-----------|----------|---------|------------|
| temperature | decimal(4,1) | -- | Yes | -- | Valid numeric value |
| unit | enum | -- | Yes | "celsius" | One of: celsius, fahrenheit |
| condition | string | 30 chars | Yes | -- | Non-empty |
| condition_icon | enum | -- | Yes | -- | Maps to weather icon set (sun, cloud, rain, snow, storm, fog) |
| city | string | 100 chars | Yes | -- | From property address |
| wind_speed | decimal(5,1) | -- | No | null | Non-negative |
| humidity | integer | -- | No | null | 0-100 |
| feels_like | decimal(4,1) | -- | No | null | Valid numeric |
| alert | string | 200 chars | No | null | AI-generated or weather API alert text |

**Layout**:
```
+----------------------------------+
|  [cloud icon]  3 C               |
|  Light Rain    Toronto           |
|  Feels like -1 C                 |
|  Wind: 25 km/h  Humidity: 78%   |
|                                  |
|  [!] Storm warning: High winds   |
|      expected 3-6 PM today       |
+----------------------------------+
```

**States**:

| State | Appearance |
|-------|------------|
| **Loading** | Skeleton card with pulsing placeholders |
| **Loaded** | Full weather data with icon, temperature, conditions |
| **Error** | Shows last known weather with timestamp. Gray text: "Updated 2h ago. Weather service unavailable." |
| **Alert active** | Yellow warning banner below weather data. Alert text with exclamation icon. |
| **No location configured** | "Set your property address in Settings to enable weather." with link to Settings. |

#### 3.2.4 Announcements Widget

Shows the most recent building announcements.

**Layout**:
```
+------------------------------------------+
|  Announcements              View All ->   |
|                                          |
|  +--------------------------------------+|
|  | Unit renovation noise - 12th Floor   ||
|  | Feb 11, 2026 2:29 PM                 ||
|  +--------------------------------------+|
|  | Friendly Reminder: Renovation Rules   ||
|  | Dec 22, 2025 12:43 PM                ||
|  +--------------------------------------+|
|  | Window Condensation Notice            ||
|  | Nov 25, 2025 11:19 AM                ||
|  +--------------------------------------+|
+------------------------------------------+
```

**Fields per announcement card**:

| Field | Data Type | Max Length | Required | Default |
|-------|-----------|-----------|----------|---------|
| title | string | 100 chars | Yes | -- |
| posted_at | datetime | -- | Yes | -- |
| excerpt | string | 150 chars | No | First 150 chars of body |
| is_urgent | boolean | -- | Yes | false |
| read_status | boolean | -- | Yes | false (per user) |

**Behavior**:

| Action | Detail |
|--------|--------|
| Click card | Navigates to full announcement page |
| "View All" button | Navigates to Announcements listing |
| Urgent announcement | Card has orange left border. Shown first regardless of date. |
| Unread indicator | Blue dot on the left of unread announcements |
| Max shown | 3 cards. "View All" links to full list. |

**Empty State**: "No announcements yet. When building management posts updates, they will appear here."

#### 3.2.5 Activity Feed Widget

Real-time scrolling feed of recent building activity, scoped by role.

**Fields per feed item**:

| Field | Data Type | Max Length | Required | Default |
|-------|-----------|-----------|----------|---------|
| event_type | string | 40 chars | Yes | -- |
| event_type_icon | enum | -- | Yes | -- |
| event_type_color | hex color | 7 chars | Yes | -- |
| summary | string | 200 chars | Yes | -- |
| actor_name | string | 100 chars | Yes | -- |
| timestamp | datetime | -- | Yes | -- |
| unit_number | string | 10 chars | No | null |
| link_url | string | 255 chars | No | null |

**Behavior**:

| Action | Detail |
|--------|--------|
| New item arrives (WebSocket) | Item slides in at the top with a brief highlight animation (200ms) |
| Click item | Navigates to the event detail page |
| Scroll | Infinite scroll. Loads 20 items initially, then 20 more on scroll. |
| Max age | Shows events from the last 24 hours by default. Configurable. |

**Role Scoping**:

| Role | Feed Shows |
|------|-----------|
| Property Admin / Manager | All events across all modules |
| Security Supervisor | All security events from all guards |
| Security Guard | Own shift events only |
| Concierge | Front desk events (packages, visitors, notes) |
| Maintenance | Own assigned work orders |
| Residents | Own packages, requests, and building announcements |

**States**:

| State | Appearance |
|-------|------------|
| **Loading** | 3 skeleton feed items with pulsing placeholders |
| **Loaded** | Scrollable feed with colored icons per event type |
| **Empty** | "No recent activity. Events will appear here in real time as they happen." |
| **Error** | "Activity feed is temporarily unavailable. Refresh to try again." with Refresh button. |
| **Disconnected** | Yellow banner: "Live updates paused. Reconnecting..." Auto-reconnects. |

#### 3.2.6 Shift Handoff Summary Widget

Summarizes the previous shift's activity for incoming staff.

**Fields**:

| Field | Data Type | Max Length | Required | Default |
|-------|-----------|-----------|----------|---------|
| shift_date | date | -- | Yes | Previous shift date |
| shift_type | enum | -- | Yes | -- (morning/afternoon/night) |
| outgoing_staff | string | 100 chars | Yes | -- |
| event_count | integer | -- | Yes | 0 |
| flagged_items | array of objects | 10 items max | No | [] |
| notes | string | 2000 chars | No | "" |
| ai_summary | string | 500 chars | No | null (if AI enabled) |

**Layout**:
```
+------------------------------------------+
|  Shift Handoff                           |
|  Previous shift: Night (Mar 13)          |
|  Staff: J. Rodriguez                     |
|                                          |
|  [AI icon] AI Summary:                   |
|  Quiet night. 2 visitor check-ins, 1     |
|  noise complaint (resolved). No packages.|
|                                          |
|  Flagged Items (1):                      |
|  [!] Unit 1205 - Leak reported, plumber  |
|      scheduled for 9 AM                  |
|                                          |
|  [View Full Shift Log]                   |
+------------------------------------------+
```

**Button: "View Full Shift Log"**

| Aspect | Detail |
|--------|--------|
| **Action** | Navigates to the Shift Log module filtered to the previous shift |
| **Loading** | Button text changes to "Loading..." |
| **Success** | Lands on filtered shift log |
| **Failure** | Toast: "Could not open shift log. Please try again." |

**Empty State**: "No shift log entries from the previous shift. When outgoing staff adds shift notes, they will appear here."

#### 3.2.7 Building Health Score Widget

A composite score (0-100) calculated from maintenance, security, amenity, and satisfaction metrics.

**Fields**:

| Field | Data Type | Max Length | Required | Default |
|-------|-----------|-----------|----------|---------|
| score | integer | -- | Yes | -- |
| trend | enum | -- | Yes | "flat" (up/down/flat) |
| trend_change | decimal(4,1) | -- | No | null (% change from last period) |
| period | enum | -- | Yes | "30_days" |
| contributing_factors | array of objects | 6 max | Yes | -- |

**Contributing Factor Object**:

| Field | Data Type | Required |
|-------|-----------|----------|
| name | string | Yes |
| score | integer (0-100) | Yes |
| weight | decimal(3,2) | Yes |
| status | enum (good/warning/critical) | Yes |

**Default Contributing Factors**:

| Factor | Weight | Description |
|--------|--------|-------------|
| Maintenance Response Time | 0.20 | Average time to resolve service requests |
| Security Incident Rate | 0.15 | Incidents per 1000 units per month |
| Amenity Utilization | 0.15 | Percentage of available amenity slots booked |
| Package Turnaround | 0.15 | Average time from package intake to release |
| Vendor Compliance | 0.15 | Percentage of vendors with valid insurance |
| Resident Satisfaction | 0.20 | Derived from request resolution feedback |

**Score Display**:

| Range | Color | Label |
|-------|-------|-------|
| 90-100 | Green (#10B981) | Excellent |
| 75-89 | Blue (#3B82F6) | Good |
| 60-74 | Yellow (#F59E0B) | Fair |
| 40-59 | Orange (#F97316) | Needs Attention |
| 0-39 | Red (#EF4444) | Critical |

**Layout**:
```
+----------------------------------+
|  Building Health        [?]      |
|                                  |
|       [circular gauge]           |
|           82                     |
|          Good                    |
|       [up arrow] +3              |
|                                  |
|  Maintenance    ████████░░  85   |
|  Security       ███████░░░  72   |
|  Amenity Use    ██████░░░░  65   |
|  Packages       █████████░  92   |
|  Compliance     ████████░░  80   |
|  Satisfaction   ████████░░  78   |
+----------------------------------+
```

**Tooltip [?]**: "The Building Health Score is a composite metric calculated daily from 6 operational factors. Each factor is weighted and combined into a score from 0 to 100. Tap any factor to see details."

**States**:

| State | Appearance |
|-------|------------|
| **Loading** | Circular gauge skeleton, pulsing gray |
| **Loaded** | Gauge with color, score, trend, and factor bars |
| **Error** | Shows last known score with gray badge: "Last calculated [date]" |
| **Insufficient data** | "Not enough data to calculate a health score yet. This requires at least 7 days of activity." |

#### 3.2.8 Chart Widget

Configurable chart containers for trend visualization.

**Supported Chart Types**:

| Type | Use Case | Interaction |
|------|----------|-------------|
| Line chart | Trends over time (maintenance requests by month, security activity by day) | Hover for tooltip, click data point to drill down |
| Bar chart | Comparisons (packages by courier, events by type) | Hover for tooltip, click bar to filter |
| Donut chart | Proportions (unit breakdown, request status distribution) | Hover for segment label and count, click to filter |
| Sparkline | Inline trends in KPI cards | No interaction -- visual indicator only |

**Fields**:

| Field | Data Type | Max Length | Required | Default |
|-------|-----------|-----------|----------|---------|
| chart_type | enum | -- | Yes | "line" |
| title | string | 60 chars | Yes | -- |
| time_range | enum | -- | Yes | "30_days" (7_days/30_days/90_days/12_months) |
| data_source | enum | -- | Yes | -- (module-specific metric) |
| x_axis_label | string | 30 chars | No | auto-derived from time_range |
| y_axis_label | string | 30 chars | No | "Count" |

**Chart Interaction**:

| Action | Detail |
|--------|--------|
| Hover on data point | Tooltip shows exact value and date |
| Click data point | Navigates to the module listing filtered to that date/category |
| Time range selector | Dropdown above chart to switch between 7 days, 30 days, 90 days, 12 months |
| Full screen | Expand icon in chart header opens a full-width modal view |

**States**:

| State | Appearance |
|-------|------------|
| **Loading** | Chart area shows pulsing skeleton with axis labels visible |
| **Loaded** | Rendered chart with data points, labels, and interactive tooltips |
| **Empty** | "No data for this time range. Try expanding the date range." |
| **Error** | "Chart data is temporarily unavailable." with Retry link. |

---

### 3.3 Drag-and-Drop Widget Customization

Users can reorder widgets and toggle optional widgets within their role's permitted set.

**Rules**:

| Rule | Detail |
|------|--------|
| **Mandatory widgets cannot be removed** | KPI cards and Quick Actions are always visible. Users cannot hide them. |
| **Optional widgets can be toggled** | Weather, Charts, AI Briefing, and other optional widgets can be shown or hidden. |
| **Reorder within sections** | Users can drag widgets to rearrange their vertical order. |
| **No cross-role widgets** | A resident cannot add the Shift Handoff widget. A guard cannot add the Financial Summary. |
| **Persistence** | Layout is saved per user per property. Stored in `user_preferences` as JSON. |
| **Reset to default** | "Reset Dashboard" button in widget management restores the role's default layout. |

**Widget Management Panel**:

| Element | Detail |
|---------|--------|
| **Trigger** | "Customize" button (gear icon) in the dashboard header |
| **Panel type** | Slide-in panel from the right (400px width on desktop) |
| **Contents** | List of all available widgets for the user's role. Toggle switch for each optional widget. Drag handles for reordering. |
| **Save button** | "Save Layout" -- persists changes. Loading: button shows spinner. Success: panel closes, dashboard re-renders. Failure: toast "Could not save layout. Please try again." |
| **Cancel** | "Cancel" -- discards changes, closes panel. |
| **Reset** | "Reset to Default" -- confirmation dialog: "This will reset your dashboard to the default layout for your role. Continue?" [Reset] [Cancel] |

**Customization Data Model**:

| Field | Data Type | Max Length | Required | Default |
|-------|-----------|-----------|----------|---------|
| user_id | UUID | -- | Yes | -- |
| property_id | UUID | -- | Yes | -- |
| widget_order | jsonb | 4KB | Yes | Role default layout |
| hidden_widgets | array of strings | 20 items | No | [] |
| widget_settings | jsonb | 8KB | No | {} (per-widget config like time ranges) |
| updated_at | datetime | -- | Yes | now() |

---

### 3.4 Real-Time Badges

Live-updating badge counts appear on KPI cards and sidebar navigation items.

**Badge Behavior**:

| Aspect | Detail |
|--------|--------|
| **Transport** | WebSocket channel per property. Subscribes to relevant event types based on user role. |
| **Update trigger** | Any create, update, or delete event that changes the count for a subscribed KPI |
| **Animation** | Count number animates (ticks up/down) over 300ms. Brief color pulse: green for new item, red for removal. |
| **Stale detection** | If WebSocket disconnects for >30 seconds, badge shows a warning icon. Tooltip: "Live updates paused. Counts may be outdated." |
| **Reconnection** | On WebSocket reconnect, a full count refresh is fetched via REST API to resync. |
| **Sidebar badges** | Red dot with count on sidebar items (e.g., Packages shows "3" if 3 unreleased). Only for actionable counts. |

**Badge Fields**:

| Field | Data Type | Required | Validation |
|-------|-----------|----------|------------|
| module | enum | Yes | Valid module identifier |
| count | integer | Yes | Non-negative |
| is_urgent | boolean | No | If true, badge pulses red |
| last_updated | datetime | Yes | ISO 8601 |

---

## 4. Data Model

### 4.1 DashboardLayout Entity

Stores per-user dashboard configuration.

```
DashboardLayout
  id              UUID          PK, auto-generated
  user_id         UUID          FK -> User, required
  property_id     UUID          FK -> Property, required
  role_id         UUID          FK -> Role, required
  widget_order    JSONB         Array of widget IDs in display order, max 4KB
  hidden_widgets  TEXT[]        Array of widget IDs the user has hidden
  widget_settings JSONB         Per-widget configuration (time ranges, chart types), max 8KB
  created_at      TIMESTAMP     Auto-set on creation
  updated_at      TIMESTAMP     Auto-set on modification

  UNIQUE(user_id, property_id)
```

### 4.2 DashboardWidget Entity

Defines available widgets and their role assignments.

```
DashboardWidget
  id              UUID          PK, auto-generated
  widget_key      VARCHAR(50)   Unique key (e.g., "kpi_packages", "weather", "ai_briefing")
  display_name    VARCHAR(60)   Human-readable name
  description     VARCHAR(200)  Tooltip description
  widget_type     ENUM          kpi_card | quick_action | chart | feed | summary | info
  default_config  JSONB         Default settings (time range, data source, etc.)
  is_mandatory    BOOLEAN       If true, cannot be hidden by user
  min_role_tier   INTEGER       Minimum role tier that can see this widget
  allowed_roles   TEXT[]        Explicit list of role IDs that can use this widget
  default_order   INTEGER       Default position in the layout
  created_at      TIMESTAMP     Auto-set
```

### 4.3 BuildingHealthScore Entity

Stores daily computed Building Health Scores.

```
BuildingHealthScore
  id              UUID          PK, auto-generated
  property_id     UUID          FK -> Property, required
  score           INTEGER       0-100, required
  trend           ENUM          up | down | flat
  trend_change    DECIMAL(4,1)  Percentage change from previous period
  period          ENUM          7_days | 30_days | 90_days
  factors         JSONB         Array of {name, score, weight, status}
  calculated_at   TIMESTAMP     When this score was generated
  calculated_by   VARCHAR(20)   "ai" or "system" -- whether AI enhanced the calculation

  INDEX(property_id, calculated_at DESC)
```

### 4.4 AIBriefing Entity

Stores generated AI briefings for caching and audit.

```
AIBriefing
  id              UUID          PK, auto-generated
  property_id     UUID          FK -> Property, required
  user_id         UUID          FK -> User, required
  role_id         UUID          FK -> Role, required
  briefing_type   ENUM          daily | shift | weekly
  content         TEXT          Briefing text, max 2000 chars
  data_snapshot   JSONB         The data that was used to generate the briefing
  generated_at    TIMESTAMP     When the AI generated this briefing
  model_used      VARCHAR(40)   AI model identifier (e.g., "claude-sonnet")
  cost            DECIMAL(6,4)  Cost of the AI call in USD
  expires_at      TIMESTAMP     When this briefing is considered stale

  INDEX(user_id, generated_at DESC)
  INDEX(property_id, briefing_type, generated_at DESC)
```

### 4.5 ShiftHandoff Entity

```
ShiftHandoff
  id              UUID          PK, auto-generated
  property_id     UUID          FK -> Property, required
  shift_date      DATE          Required
  shift_type      ENUM          morning | afternoon | night
  outgoing_user_id UUID         FK -> User, required
  event_count     INTEGER       Total events during shift
  flagged_items   JSONB         Array of {description, priority, unit_number, event_id}
  notes           TEXT          Free-text notes, max 2000 chars
  ai_summary      TEXT          AI-generated summary, max 500 chars, nullable
  created_at      TIMESTAMP     Auto-set

  UNIQUE(property_id, shift_date, shift_type)
```

### 4.6 Relationships

```
User 1--* DashboardLayout (one per property)
Property 1--* DashboardLayout
Property 1--* BuildingHealthScore (one per day)
User 1--* AIBriefing
Property 1--* ShiftHandoff
DashboardWidget --* DashboardLayout.widget_order (referenced by widget_key)
```

---

## 5. User Flows

### 5.1 Staff Morning Login Flow

1. **User logs in** at the start of their shift.
2. **System identifies role** and loads the role-specific dashboard layout from `DashboardLayout` (or role defaults if no custom layout exists).
3. **KPI cards load** via parallel REST calls. Each card fetches its count independently. Skeleton loading state shown during fetch.
4. **WebSocket connects** for real-time updates. Badge counts begin updating live.
5. **Shift Handoff Summary** loads from the most recent `ShiftHandoff` record for the property.
6. **AI Daily Briefing** is fetched:
   - If a briefing exists for today and is not expired, it is displayed from cache.
   - If no briefing exists, a generation request is queued. A skeleton with "Generating your briefing..." is shown.
   - If AI is disabled, the AI Briefing widget is hidden and the dashboard still functions with all other widgets.
7. **Activity Feed** begins streaming recent events via WebSocket.
8. **User scans dashboard** (target: full comprehension in under 5 seconds).
9. **User takes action** via Quick Action buttons or by clicking a KPI card's "View" link.

### 5.2 Resident Login Flow

1. **Resident logs in** (or resumes session with "Remember me").
2. **System loads** the resident dashboard with personal KPI cards (My Packages, My Requests, Upcoming Bookings).
3. **Announcements widget** loads the 3 most recent building announcements. Unread items show a blue dot.
4. **Quick Actions** show: Book Amenity, Submit Request, View My Packages.
5. **Weather widget** shows current conditions (if enabled by Property Admin).
6. **Resident scans dashboard** and either takes action or navigates to a module via sidebar.

### 5.3 Widget Customization Flow

1. User clicks the **"Customize" gear icon** in the dashboard header.
2. **Slide-in panel** opens from the right showing all available widgets for the user's role.
3. Mandatory widgets show a lock icon and cannot be toggled off.
4. Optional widgets have a toggle switch (on/off).
5. User **drags widgets** to reorder using drag handles.
6. User clicks **"Save Layout"**.
   - **Loading**: Button shows spinner, text changes to "Saving..."
   - **Success**: Panel closes. Dashboard re-renders with new layout. Toast: "Dashboard layout saved."
   - **Failure**: Toast: "Could not save your layout. Please try again." Panel stays open.
7. Alternatively, user clicks **"Reset to Default"** which shows a confirmation dialog before resetting.

### 5.4 KPI Drill-Down Flow

1. User sees a KPI card showing "Unreleased Packages: 12".
2. User clicks **"View ->"** on the card.
3. System navigates to the Package listing page with filters pre-applied: status=unreleased, time_period=last_7_days (matching the card's selected time period).
4. User can further filter, search, or take action on individual packages.

### 5.5 Shift Handoff Flow

1. Outgoing staff member finishes their shift.
2. System auto-generates a `ShiftHandoff` record:
   - Counts all events created during the shift.
   - Flags any unresolved items (open incidents, unreleased packages).
   - Includes any manual notes the staff member added to the shift log.
3. If AI is enabled, an AI summary is generated from the shift's events (200-300 words).
4. Incoming staff member logs in and sees the **Shift Handoff Summary** widget populated with the previous shift's data.
5. Incoming staff clicks **"View Full Shift Log"** to see detailed entries if needed.

---

## 6. UI/UX

### 6.1 Desktop Layout (1280px+)

```
+----------------------------------------------------------+
|  [Property Name]    Dashboard    [Customize] [Time: Now]  |
+----------------------------------------------------------+
|                                                          |
|  [ AI Daily Briefing - full width card ]                 |
|                                                          |
+----------------------------------------------------------+
|  [KPI 1]   [KPI 2]   [KPI 3]   [KPI 4]   [KPI 5] [KPI 6]|
+----------------------------------------------------------+
|                          |                               |
|  [Widget A]              |  [Widget B]                   |
|  (e.g., Shift Handoff)   |  (e.g., Activity Feed)        |
|                          |                               |
+----------------------------------------------------------+
|                          |                               |
|  [Widget C]              |  [Widget D]                   |
|  (e.g., Charts)          |  (e.g., Weather)              |
|                          |                               |
+----------------------------------------------------------+
|                                                          |
|  [Quick Actions - floating bottom right]                 |
|     [+ Action 1] [+ Action 2] [+ Action 3] [+ Action 4] |
+----------------------------------------------------------+
```

**Grid rules**:
- Max 6 KPI cards per row. Cards auto-size to fill available width.
- Content area uses a 2-column grid below KPI cards. Widgets span 1 or 2 columns.
- Full-width widgets (AI Briefing, Announcements for residents) span both columns.
- Minimum card width: 200px. Maximum: 400px.
- Gap between cards: 16px. Gap between widget rows: 24px.

### 6.2 Tablet Layout (768px - 1279px)

- KPI cards: 3 per row (2 rows for 6 cards)
- Content area: single column stack
- Quick actions: 2 per row
- Widgets stack vertically in single column
- Shift Handoff and Activity Feed get equal treatment (no side-by-side)

### 6.3 Mobile Layout (<768px)

- KPI cards: 2 per row (3 rows for 6 cards). Cards shrink to show count and title only (no time period badge).
- Quick actions: 2 per row. Large tap targets (min 56px height).
- All widgets stack vertically in single column.
- AI Briefing: collapsed by default. Tap to expand. Shows first line as preview.
- Activity Feed: shows last 10 items (not 20). Scroll to load more.
- Charts: horizontal scroll for time-series charts. Donut charts remain as-is.
- Weather widget: condensed to icon + temperature + city only. Tap to expand.
- Customize button: moved to overflow menu (three-dot icon in header).

### 6.4 Component Specifications

**KPI Card Component**:

| Property | Value |
|----------|-------|
| Min width | 200px |
| Max width | 400px |
| Height | 120px (desktop), 96px (mobile) |
| Border radius | 12px |
| Background | White (#FFFFFF) |
| Border | 1px solid #E5E7EB |
| Shadow | 0 1px 3px rgba(0,0,0,0.04) |
| Title font | 14px, weight 500, color #6B7280 |
| Count font | 32px (desktop) / 24px (mobile), weight 700, color #111827 |
| Time period badge | 12px, weight 400, color #9CA3AF, calendar icon 12px |
| View link | 14px, weight 500, color #3B82F6 |

**Quick Action Button**:

| Property | Value |
|----------|-------|
| Width | Flexible, min 140px |
| Height | 72px (desktop), 56px (mobile) |
| Border radius | 12px |
| Background | White (#FFFFFF), hover: #F9FAFB |
| Border | 1px solid #E5E7EB |
| Icon size | 24px |
| Label font | 14px, weight 500, color #374151 |

**Activity Feed Item**:

| Property | Value |
|----------|-------|
| Height | Auto (min 48px) |
| Padding | 12px 16px |
| Icon | 20px circle with event type color |
| Title font | 14px, weight 500, color #111827 |
| Timestamp font | 12px, weight 400, color #9CA3AF |
| Divider | 1px solid #F3F4F6 between items |
| Hover | Background #F9FAFB |

### 6.5 Loading, Empty, and Error States Summary

| Widget | Loading State | Empty State | Error State |
|--------|--------------|-------------|-------------|
| KPI Card | Skeleton card (pulsing gray) | Shows "0" -- zero is valid | "--" with retry tooltip |
| Quick Actions | Skeleton buttons (pulsing) | N/A (always has actions per role) | Toast error if action fails |
| Weather | Skeleton with icon placeholder | "Configure property address in Settings" | Last known data + "Updated Xh ago" |
| Announcements | 3 skeleton cards | "No announcements yet" + guidance text | "Could not load announcements" + Retry |
| Activity Feed | 3 skeleton items | "No recent activity" + guidance text | "Feed unavailable" + Refresh button |
| Shift Handoff | Skeleton text block | "No shift notes from previous shift" | "Could not load shift summary" + Retry |
| Building Health | Gauge skeleton (gray circle) | "7+ days of data needed" | Last known score + gray timestamp |
| Charts | Skeleton chart with visible axes | "No data for this range" + suggestion | "Chart unavailable" + Retry |
| AI Briefing | "Generating your briefing..." spinner | N/A (generates on demand) | "Briefing unavailable. Your dashboard still shows all current data." |

---

## 7. AI Integration

Six AI capabilities are embedded in the Dashboard module. All follow the AI Framework principles defined in 19-AI Framework: invisible intelligence, graceful degradation, human confirms, privacy first, and cost-conscious routing.

### 7.1 AI Daily Briefing

| Attribute | Detail |
|-----------|--------|
| **AI Feature ID** | 79 (from 19-AI Framework) |
| **Description** | Generates a personalized morning briefing summarizing overnight events, pending items, and today's priorities. Adapts content to the user's role. |
| **Default Model** | Sonnet |
| **Estimated Cost** | $0.01 per briefing |
| **Trigger** | On first dashboard load after shift start (or 8:00 AM if no shift configured). Cached for 4 hours. |
| **Input** | Overnight events since last login, pending items across modules, today's calendar (bookings, scheduled maintenance), weather forecast, previous shift summary |
| **Output** | Structured briefing (200-300 words) with sections: Key Events, Action Items, Today's Schedule, Weather Impact |
| **Graceful Degradation** | If AI is unavailable, the briefing widget is hidden. Dashboard functions normally with all KPI cards, feeds, and actions. No placeholder or error -- the widget simply does not appear. |
| **Default** | Enabled for staff roles, disabled for resident roles |
| **Privacy** | Resident names replaced with "Resident [unit]" before API call. No PII leaves the system. |

**Briefing Format**:
```
Good morning, [first name]. Here is your briefing for March 14, 2026.

KEY EVENTS (overnight)
- 2 visitor check-ins, 1 noise complaint (Unit 804, resolved)
- 4 packages received (3 Amazon, 1 FedEx). All stored in Room B.

ACTION ITEMS
- 1 unreleased package from yesterday (Unit 302, perishable)
- Plumber arrival expected at 9 AM for Unit 1205 leak

TODAY'S SCHEDULE
- Party Room booked 2-6 PM (Unit 502)
- Gym closed for cleaning 7-8 AM

WEATHER
- 3C, light rain. No severe weather alerts.
```

**Interaction**:

| Action | Detail |
|--------|--------|
| Dismiss | "Dismiss" link collapses the briefing for the session. It returns on next login. |
| Expand/Collapse | Chevron toggles full briefing vs. first-line preview (mobile default). |
| Refresh | "Regenerate" link requests a new briefing from AI. Costs one additional API call. Loading: spinner replaces content. |
| Click action item | Items with associated records (packages, requests) are clickable links to the relevant detail page. |

### 7.2 Anomaly Badges

| Attribute | Detail |
|-----------|--------|
| **AI Feature ID** | 5, 80 (from 19-AI Framework: Anomaly Detection + Smart KPI Selection) |
| **Description** | Flags KPI cards with an anomaly badge when the current value deviates significantly from historical norms. Example: if package volume is 3x the weekly average, the Packages KPI card shows an orange anomaly icon. |
| **Default Model** | Haiku |
| **Estimated Cost** | $0.001-0.002 per check |
| **Trigger** | On dashboard load. Checks each KPI against 90-day historical averages. |
| **Input** | Current KPI value + 90-day daily averages for the same metric |
| **Output** | Per KPI: anomaly flag (boolean), anomaly description (string, max 100 chars), severity (info/warning/critical) |
| **Graceful Degradation** | No anomaly badges shown. KPIs display normally without any flags. |
| **Default** | Enabled |

**Anomaly Badge Display**:

| Severity | Badge Appearance | Example Description |
|----------|-----------------|---------------------|
| Info | Blue dot with [i] icon | "Package volume is 40% above weekly average" |
| Warning | Orange dot with [!] icon | "Incident rate is 2x the monthly norm" |
| Critical | Red pulsing dot with [!!] icon | "Unreleased packages are 5x the daily average" |

**Tooltip**: Hovering over an anomaly badge shows the AI-generated description. Example: "Package volume today (47) is 3.2x your weekly average (15). This may be due to a holiday weekend."

### 7.3 AI Priority Inbox

| Attribute | Detail |
|-----------|--------|
| **AI Feature ID** | 81 (from 19-AI Framework: Actionable Insight Cards) |
| **Description** | Surfaces 1-3 proactive insight cards on the dashboard that recommend actions based on cross-module data analysis. Not a separate inbox -- these are integrated as cards above the activity feed. |
| **Default Model** | Sonnet |
| **Estimated Cost** | $0.005 per insight set |
| **Trigger** | On dashboard load. Cached for 1 hour. |
| **Input** | Cross-module data: open requests, pending packages, upcoming bookings, vendor compliance, weather, historical patterns |
| **Output** | 1-3 insight cards, each with: title (string, max 80 chars), body (string, max 200 chars), recommended action (string, max 60 chars), action URL (string), priority (high/medium/low) |
| **Graceful Degradation** | No insight cards shown. Dashboard functions normally with standard widgets. |
| **Default** | Enabled |

**Insight Card Layout**:
```
+------------------------------------------+
| [lightbulb icon]  Staffing Alert    [x]  |
|                                          |
| Package volume is projected to be 2x     |
| normal this week due to holiday sales.   |
| Consider scheduling extra front desk     |
| coverage for Thursday-Saturday.          |
|                                          |
| [View Package Trends ->]                 |
+------------------------------------------+
```

**Card Actions**:

| Action | Detail |
|--------|--------|
| Click action link | Navigates to the relevant module with context |
| Dismiss [x] | Removes the card for this session. Not shown again today. |
| Loading | Cards show skeleton with pulsing gradient |
| Error | Cards do not appear. No error shown. |

### 7.4 Predictive Widgets

| Attribute | Detail |
|-----------|--------|
| **AI Feature ID** | 82 (from 19-AI Framework: Weather-Aware Alerts) |
| **Description** | Generates contextual predictions based on weather data, historical patterns, and scheduled events. Displayed as alert banners within relevant widgets. |
| **Default Model** | Haiku |
| **Estimated Cost** | $0.001 per prediction |
| **Trigger** | On weather API update (every 3 hours) and on dashboard load (cached) |
| **Input** | Weather forecast (next 48 hours) + building context (property type, amenities, location) + historical event data |
| **Output** | 0-3 predictive alerts, each with: message (string, max 200 chars), severity (info/warning/critical), relevant_widget (which widget to attach this to) |
| **Graceful Degradation** | No predictive alerts. Weather widget shows raw weather data without building-specific recommendations. |
| **Default** | Enabled |

**Example Predictions**:

| Weather Condition | Prediction | Severity |
|-------------------|-----------|----------|
| Snowfall > 10cm forecast | "Heavy snow expected tonight. Verify snow removal vendor is on standby." | Warning |
| Temperature > 35C | "Heat warning. Pool and AC system demand will be high. Check cooling equipment." | Warning |
| Thunderstorm forecast | "Thunderstorms expected 3-6 PM. Secure balcony furniture advisories may be needed." | Info |

### 7.5 Natural Language Dashboard Configuration

| Attribute | Detail |
|-----------|--------|
| **AI Feature ID** | New (extends 83 from 19-AI Framework: Resident Dashboard Personalization) |
| **Description** | Allows users to describe their ideal dashboard in plain language, and the AI translates that into a widget configuration. Available in the Customize panel. |
| **Default Model** | Haiku |
| **Estimated Cost** | $0.001 per configuration request |
| **Trigger** | On demand. User types a description in the Customize panel's "Describe your ideal dashboard" text field. |
| **Input** | User's natural language description + available widgets for their role |
| **Output** | Proposed widget_order and hidden_widgets configuration |
| **Graceful Degradation** | Manual drag-and-drop customization (the standard flow). The text field is hidden if AI is disabled. |
| **Default** | Disabled |

**Example Inputs and Outputs**:

| User Says | AI Does |
|-----------|---------|
| "I mainly care about packages and visitors" | Moves KPI cards for Packages and Active Visitors to top. Hides Charts and Building Health. Keeps Quick Actions. |
| "Show me everything about maintenance" | Moves Maintenance KPIs to top. Shows Maintenance chart. Adds Equipment Alerts widget. |
| "Keep it minimal" | Keeps only mandatory KPI cards and Quick Actions. Hides all optional widgets. |

**UI**:
```
+------------------------------------------+
|  Customize Dashboard                     |
|                                          |
|  Describe your ideal dashboard:          |
|  [________________________________]      |
|  [Apply]                                 |
|                                          |
|  -- OR customize manually below --       |
|                                          |
|  [drag-and-drop widget list]             |
+------------------------------------------+
```

**Apply Button**:

| Aspect | Detail |
|--------|--------|
| **Loading** | Button shows spinner. Text: "Configuring..." |
| **Success** | Widget list reorders to match AI suggestion. User reviews and clicks "Save Layout" to confirm. Changes are NOT auto-saved. |
| **Failure** | Toast: "Could not interpret your request. Try describing what you want to see first on your dashboard." |

### 7.6 Weekly Performance Digest

| Attribute | Detail |
|-----------|--------|
| **AI Feature ID** | New (extends 84 from 19-AI Framework: Building Health Score) |
| **Description** | Generates a weekly summary email/notification with building performance highlights, trends, and recommendations. Delivered every Monday morning. |
| **Default Model** | Sonnet |
| **Estimated Cost** | $0.01 per digest |
| **Trigger** | Weekly scheduled (Monday 7:00 AM property local time) |
| **Input** | All module metrics from the past 7 days: events, packages, requests, bookings, incidents, health scores |
| **Output** | Structured digest with: headline metric, week-over-week comparisons (5 categories), top 3 highlights, top 3 areas for improvement, Building Health Score trend |
| **Delivery** | Shown as a banner on the dashboard on Monday. Also sent via the user's preferred notification channel (email/push). |
| **Graceful Degradation** | No weekly digest generated. Individual module metrics remain available in Reports. |
| **Default** | Enabled for Property Admin, Property Manager, Security Supervisor. Disabled for all other roles. |
| **Privacy** | Aggregate data only. No individual resident names or unit-specific details in the digest. |

**Digest Format**:
```
WEEKLY BUILDING PERFORMANCE -- March 7-13, 2026

HEADLINE: Building Health Score improved from 78 to 82 (+5.1%)

WEEK OVER WEEK:
  Maintenance requests:  12 (down from 18, -33%)
  Package volume:        89 (up from 72, +24%)
  Security incidents:     3 (same as last week)
  Amenity bookings:      34 (up from 28, +21%)
  Avg. response time:    4.2h (down from 6.1h, -31%)

HIGHLIGHTS:
1. Maintenance response time improved 31% -- fastest week in 90 days
2. Zero critical security incidents
3. Amenity utilization up 21% -- party room most popular

AREAS FOR IMPROVEMENT:
1. 3 packages unclaimed for 48+ hours -- consider reminder cadence
2. Vendor ABC Insurance expires in 14 days -- renew needed
3. Gym equipment request pending for 5 days -- assign vendor
```

---

## 8. Analytics

### 8.1 Operational Metrics (Built-In)

| Metric | Calculation | Visible To |
|--------|------------|------------|
| Dashboard load time (p50, p95) | Time from route navigation to all KPI cards loaded | Super Admin |
| Widget render time per widget | Time from data fetch to render complete | Super Admin |
| WebSocket connection uptime | Percentage of time the real-time connection is active per session | Super Admin |
| KPI card click-through rate | (Clicks on "View") / (Dashboard loads) per card | Property Admin, Super Admin |
| Quick action usage frequency | Clicks per action button per day, per role | Property Admin, Super Admin |
| Widget customization rate | Percentage of users who customize their dashboard | Super Admin |
| Most-hidden widgets | Ranked list of widgets most frequently hidden by users | Product team (internal) |
| Average session start-to-action time | Time from dashboard load to first meaningful action (click, navigate) | Super Admin |

### 8.2 AI-Specific Metrics

| Metric | Calculation | Visible To |
|--------|------------|------------|
| Daily Briefing generation rate | Briefings generated / eligible users per day | Super Admin, Property Admin |
| Daily Briefing click-through rate | Action items clicked / total action items shown | Super Admin |
| Anomaly badge accuracy | (Badges acknowledged or acted on) / (total badges shown) | Super Admin |
| Insight card dismiss rate | Cards dismissed / cards shown | Super Admin |
| Insight card action rate | Action links clicked / cards shown | Super Admin |
| AI cost per dashboard load | Total AI cost for all dashboard features / number of loads | Super Admin |
| Weekly digest open rate | Digests opened / digests sent | Super Admin, Property Admin |
| NL config success rate | Successful configurations / total NL config attempts | Super Admin |

### 8.3 Performance Analytics Dashboard (for Super Admin)

Available at Settings > System Health > Dashboard Performance.

| Chart | Type | Description |
|-------|------|-------------|
| Dashboard load time trend | Line chart | P50 and P95 load times over 30 days |
| Widget popularity | Horizontal bar | Most-viewed widgets ranked by impression count |
| Quick action heatmap | Heatmap | Actions taken by role and time of day |
| AI feature adoption | Stacked bar | Briefing/anomaly/insight usage by property |

---

## 9. Notifications

The Dashboard itself does not send notifications in the traditional sense (those are handled by individual modules). However, it manages **real-time presence notifications** and **digest delivery**.

### 9.1 Real-Time Badge Notifications

| Trigger | Channel | Behavior |
|---------|---------|----------|
| KPI count changes | WebSocket (in-app) | Badge count updates with animation. No push/email. |
| WebSocket disconnects | In-app banner | Yellow banner: "Live updates paused. Reconnecting..." |
| WebSocket reconnects | In-app | Banner disappears. Full data refresh occurs silently. |

### 9.2 AI Briefing Notifications

| Trigger | Channel | Behavior |
|---------|---------|----------|
| Daily briefing ready | Dashboard widget | Briefing appears at top of dashboard on next load. No push notification for briefing alone. |
| Weekly digest ready | Email + Push + Dashboard banner | Monday morning delivery via user's preferred channel. Dashboard shows a blue banner: "Your weekly digest is ready. [View]" |

### 9.3 Anomaly Alerts

| Trigger | Channel | Behavior |
|---------|---------|----------|
| Critical anomaly detected | Dashboard badge + Push (if enabled) | Red pulsing badge on affected KPI card. Push notification: "[Property]: [KPI] is [X]x above normal." |
| Warning anomaly detected | Dashboard badge only | Orange badge on affected KPI card. No push. |
| Info anomaly detected | Dashboard badge only | Blue badge. No push. |

### 9.4 Notification Preferences

Users can configure dashboard notification behavior in My Account > Notification Preferences:

| Setting | Type | Default | Options |
|---------|------|---------|---------|
| Weekly digest delivery | enum | email | email, push, both, none |
| Critical anomaly push | boolean | true | true, false |
| Briefing auto-expand | boolean | true (desktop), false (mobile) | true, false |

---

## 10. API

### 10.1 Dashboard Data Endpoints

#### GET /api/v1/dashboard

Returns the complete dashboard configuration and data for the authenticated user.

**Authentication**: Bearer token (required)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| property_id | UUID | Yes | -- | Property to load dashboard for |

**Response (200 OK)**:

```json
{
  "layout": {
    "widget_order": ["ai_briefing", "kpi_row", "shift_handoff", "activity_feed", "charts"],
    "hidden_widgets": ["weather"],
    "widget_settings": {
      "kpi_packages": { "time_period": "7_days" },
      "chart_maintenance": { "time_range": "30_days", "chart_type": "line" }
    }
  },
  "kpis": [
    {
      "key": "unreleased_packages",
      "title": "Unreleased Packages",
      "count": 12,
      "trend": "up",
      "trend_percentage": 15.3,
      "time_period": "7_days",
      "link": "/packages?status=unreleased&period=7d",
      "anomaly": {
        "detected": true,
        "severity": "warning",
        "message": "Package volume is 2.1x the weekly average"
      }
    }
  ],
  "quick_actions": [
    {
      "label": "New Package",
      "icon": "package-plus",
      "action_type": "navigate",
      "target": "/packages/new"
    }
  ],
  "health_score": {
    "score": 82,
    "trend": "up",
    "trend_change": 3.0,
    "factors": []
  },
  "weather": {
    "temperature": 3.0,
    "unit": "celsius",
    "condition": "Light Rain",
    "city": "Toronto",
    "icon": "cloud-rain",
    "alerts": []
  }
}
```

**Error Responses**:

| Status | Body | When |
|--------|------|------|
| 401 | `{ "error": "unauthorized", "message": "Authentication required" }` | Missing or invalid token |
| 403 | `{ "error": "forbidden", "message": "No access to this property" }` | User not assigned to property |
| 500 | `{ "error": "server_error", "message": "Dashboard data could not be loaded" }` | Internal failure |

#### PUT /api/v1/dashboard/layout

Saves the user's custom dashboard layout.

**Authentication**: Bearer token (required)

**Request Body**:

```json
{
  "property_id": "uuid",
  "widget_order": ["kpi_row", "activity_feed", "shift_handoff"],
  "hidden_widgets": ["weather", "charts"],
  "widget_settings": {
    "kpi_packages": { "time_period": "30_days" }
  }
}
```

**Validation**:

| Field | Rule | Error Message |
|-------|------|---------------|
| property_id | Must be a property the user is assigned to | "You do not have access to this property" |
| widget_order | Must contain all mandatory widget keys for the user's role | "Required widget [name] cannot be removed from your layout" |
| hidden_widgets | Cannot contain mandatory widget keys | "Widget [name] is required for your role and cannot be hidden" |
| widget_settings | Values must match widget config schema | "Invalid setting for widget [name]" |

**Response (200 OK)**: `{ "saved": true, "updated_at": "2026-03-14T10:30:00Z" }`

**Error Responses**:

| Status | Body | When |
|--------|------|------|
| 400 | `{ "error": "validation_error", "details": [...] }` | Invalid layout configuration |
| 401 | `{ "error": "unauthorized" }` | Missing token |
| 403 | `{ "error": "forbidden" }` | Not assigned to property |

#### GET /api/v1/dashboard/briefing

Returns the AI daily briefing for the authenticated user.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| property_id | UUID | Yes | -- | Property |
| force_refresh | boolean | No | false | If true, generates a new briefing instead of returning cached |

**Response (200 OK)**:

```json
{
  "briefing": {
    "content": "Good morning, James. Here is your briefing...",
    "generated_at": "2026-03-14T08:00:00Z",
    "expires_at": "2026-03-14T12:00:00Z",
    "sections": {
      "key_events": "...",
      "action_items": ["..."],
      "schedule": "...",
      "weather_impact": "..."
    }
  }
}
```

**Response (204 No Content)**: AI is disabled or no briefing available.

#### GET /api/v1/dashboard/activity-feed

Returns the activity feed for the authenticated user.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| property_id | UUID | Yes | -- | Property |
| limit | integer | No | 20 | Items per page (max 50) |
| before | datetime | No | now() | Cursor for pagination (ISO 8601) |

**Response (200 OK)**:

```json
{
  "items": [
    {
      "event_type": "Package Received",
      "icon": "package",
      "color": "#3B82F6",
      "summary": "Amazon package received for Unit 502",
      "actor": "J. Rodriguez",
      "timestamp": "2026-03-14T09:15:00Z",
      "unit": "502",
      "link": "/events/uuid-here"
    }
  ],
  "has_more": true,
  "next_cursor": "2026-03-14T09:14:59Z"
}
```

#### GET /api/v1/dashboard/health-score

Returns the Building Health Score for a property.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| property_id | UUID | Yes | -- | Property |
| period | enum | No | "30_days" | 7_days, 30_days, 90_days |

**Response (200 OK)**:

```json
{
  "score": 82,
  "label": "Good",
  "color": "#3B82F6",
  "trend": "up",
  "trend_change": 3.0,
  "calculated_at": "2026-03-14T03:00:00Z",
  "factors": [
    { "name": "Maintenance Response Time", "score": 85, "weight": 0.20, "status": "good" },
    { "name": "Security Incident Rate", "score": 72, "weight": 0.15, "status": "warning" }
  ]
}
```

### 10.2 WebSocket Events

**Channel**: `ws://api/v1/dashboard/live?property_id={uuid}`

**Authentication**: Token passed as query parameter or in first frame.

**Event Types**:

| Event | Payload | Triggers |
|-------|---------|----------|
| `kpi.update` | `{ "key": "unreleased_packages", "count": 13, "trend": "up" }` | Any CRUD operation on a module that affects a KPI count |
| `feed.new_item` | Full activity feed item object | New event, package, request, or booking created |
| `anomaly.detected` | `{ "kpi_key": "packages", "severity": "warning", "message": "..." }` | AI detects an anomaly on a KPI |
| `briefing.ready` | `{ "briefing_id": "uuid" }` | AI briefing generation completes |
| `health_score.updated` | `{ "score": 82, "trend": "up" }` | Daily health score recalculation completes |

**Rate Limits**:

| Limit | Value |
|-------|-------|
| Max WebSocket connections per user | 3 (covers desktop, tablet, mobile) |
| Max events per second per property | 50 |
| Reconnection backoff | 1s, 2s, 4s, 8s, 16s, max 30s |

### 10.3 REST API Rate Limits

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| GET /dashboard | 60 requests | Per minute per user |
| PUT /dashboard/layout | 10 requests | Per minute per user |
| GET /dashboard/briefing | 10 requests | Per minute per user |
| GET /dashboard/activity-feed | 120 requests | Per minute per user |
| GET /dashboard/health-score | 30 requests | Per minute per user |

---

## 11. Completeness Checklist

### Functional Requirements

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | Role-aware dashboard layouts for all 12 roles | Defined | 3.1 |
| 2 | KPI cards with configurable time periods | Defined | 3.2.1 |
| 3 | Real-time badge counts via WebSocket | Defined | 3.4, 10.2 |
| 4 | Quick action buttons per role | Defined | 3.2.2 |
| 5 | Weather widget with location-based data | Defined | 3.2.3 |
| 6 | Announcements widget with unread indicators | Defined | 3.2.4 |
| 7 | Activity feed with real-time streaming | Defined | 3.2.5 |
| 8 | Shift handoff summary | Defined | 3.2.6 |
| 9 | Building Health Score (composite metric) | Defined | 3.2.7 |
| 10 | Interactive charts with drill-down | Defined | 3.2.8 |
| 11 | Drag-and-drop widget customization | Defined | 3.3 |
| 12 | AI Daily Briefing | Defined | 7.1 |
| 13 | Anomaly Badges on KPI cards | Defined | 7.2 |
| 14 | AI Priority Inbox (insight cards) | Defined | 7.3 |
| 15 | Predictive Widgets (weather-aware alerts) | Defined | 7.4 |
| 16 | Natural Language Dashboard Configuration | Defined | 7.5 |
| 17 | Weekly Performance Digest | Defined | 7.6 |

### Non-Functional Requirements

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 18 | Desktop layout (1280px+) | Defined | 6.1 |
| 19 | Tablet layout (768-1279px) | Defined | 6.2 |
| 20 | Mobile layout (<768px) | Defined | 6.3 |
| 21 | Loading states for all widgets | Defined | 6.5 |
| 22 | Empty states with guidance for all widgets | Defined | 6.5 |
| 23 | Error states with retry for all widgets | Defined | 6.5 |
| 24 | Tooltips for complex features (Health Score, Anomaly Badges) | Defined | 3.2.7, 7.2 |
| 25 | Progressive disclosure (AI Briefing collapse on mobile, Weather condensed) | Defined | 6.3 |
| 26 | Component specifications (sizes, fonts, colors) | Defined | 6.4 |
| 27 | WebSocket reconnection with backoff | Defined | 10.2 |
| 28 | API rate limits | Defined | 10.3 |
| 29 | Dashboard load time tracking | Defined | 8.1 |
| 30 | AI cost per dashboard load tracking | Defined | 8.2 |

### Data Model

| # | Entity | Status | Section |
|---|--------|--------|---------|
| 31 | DashboardLayout | Defined | 4.1 |
| 32 | DashboardWidget | Defined | 4.2 |
| 33 | BuildingHealthScore | Defined | 4.3 |
| 34 | AIBriefing | Defined | 4.4 |
| 35 | ShiftHandoff | Defined | 4.5 |

### Accessibility

| # | Requirement | Status |
|---|-------------|--------|
| 36 | All KPI cards have ARIA labels with count and title | Required |
| 37 | Activity feed items are keyboard-navigable | Required |
| 38 | Chart data available as accessible table alternative | Required |
| 39 | Color is never the sole indicator of status (always paired with text/icon) | Required |
| 40 | Quick action buttons have descriptive ARIA labels | Required |
| 41 | Screen reader announces real-time badge updates | Required |

---

*End of document.*
