# Dashboard & Global Layout — Granular Deep Dive

Field-level documentation of every element on Condo Control's Home Dashboard and global layout components.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Global Layout Structure

The application uses a persistent left sidebar + top bar layout across all pages.

### 1.1 Top Bar (Global Header)

**Persists on every page.** Fixed at the top of the viewport.

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Quick Search | Text input | Placeholder: "Quick Search". Magnifying glass icon on the left. No autocomplete — submits on Enter. Navigates to `/globalSearch/global-search?term={query}` |
| 2 | Help (lightbulb icon) | Button | Lightbulb icon. Labeled "Help" in accessibility tree. No visible tooltip or dropdown observed on click |
| 3 | Call (phone icon) | Button | Phone/handset icon. Labeled "Call" in accessibility tree. No visible action observed on click |
| 4 | User Avatar | Button | Circular avatar showing user initials ("TC" for Temp Concierge). No dropdown observed on click from this role |

### 1.2 Left Sidebar Navigation

**Width**: ~200px. Collapsible via "Collapse" button at the bottom.

**Header**: Property name "M.T.C.C. 872" displayed at top of sidebar.

| # | Menu Item | Icon | URL | Has Submenu | Submenu Items |
|---|-----------|------|-----|-------------|---------------|
| 1 | Home | House | `/my/my-home` | No | — |
| 2 | My Account | Person | `/my/unit` | Yes (chevron) | Change Password (`/change-password.aspx`), Email Preferences (`/my-account.aspx`), Package Preferences (`/my/unit#tab-14`) |
| 3 | Amenity Booking | Calendar | `/amenity/landing/` | No | — |
| 4 | Announcements | Megaphone | `/announcement/show-list/` | No | — |
| 5 | Classified Ads | Newspaper | `/forum/all-forums?mode=classifieds` | No | — |
| 6 | Events | Calendar/star | `/event/list-event/` | No | — |
| 7 | Library | Book | `/library/landing` | No | — |
| 8 | Reports | Clipboard | `/reportV2/reports/` | No | — |
| 9 | Security & Concierge | Shield | `/security/console/` | Yes (chevron) | Unit File (`/unit/view-unit-file/`) |
| 10 | Store | Shopping bag | (not captured from this view) | No | — |
| 11 | Survey | Document | (not captured from this view) | No | — |
| 12 | Training | People/grid | (not captured from this view) | No | — |
| 13 | Unit File | Document | (not captured from this view) | Yes (chevron) | Buzzer Codes |
| 14 | User Guide | Book | (not captured from this view) | No | — |
| 15 | Collapse | Sidebar icon | N/A (toggles sidebar) | No | — |

**Sidebar behavior notes**:
- Clicking a parent menu item (e.g., "My Account") navigates to that page AND expands/collapses the submenu
- Chevron (▼/▲) toggles the submenu without navigating
- Active page is indicated by a left teal/green border bar on the submenu item
- Sidebar scrolls independently if items exceed viewport height
- "Collapse" button at bottom collapses sidebar to icon-only mode

### 1.3 Footer (Global)

Present at the bottom of every page.

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Condo Control logo | Image | Small green folder icon |
| 2 | Copyright | Text | "Condo Control © 2026 Condo Control. All rights reserved." |
| 3 | System Status | Link | Links to system status page |
| 4 | Privacy | Link | Links to privacy policy |
| 5 | Help Center | Link | Links to help center |
| 6 | Downloads | Link | Links to downloads page (likely mobile apps) |
| 7 | App Store icon | Link/icon | Apple App Store download |
| 8 | Google Play icon | Link/icon | Google Play Store download |

### 1.4 Chat Widget

**Position**: Bottom-right corner of every page.
**Appearance**: Circular teal/dark chat bubble icon.
**Behavior**: Opens live chat or support widget when clicked (intercom-style).

---

## 2. Home Dashboard

**URL**: `/my/my-home`
**Breadcrumb**: None (this is the root page)
**Page title in browser tab**: "M.T.C.C. 872 - Home | Condo Control"

### 2.1 Hero Banner

Full-width banner image at top of content area.

| # | Element | Description |
|---|---------|-------------|
| 1 | Background image | Toronto city skyline at dusk/night. Full-width, ~100px height |
| 2 | Weather widget | Top-right of banner. Shows: cloud icon, temperature ("3° C"), city ("Toronto"), condition ("light rain") |
| 3 | Property name | Top-right of banner, below weather. Shows "M.T.C.C. 872" in white text |

**Note**: The weather widget appears to pull live weather data for the property's city (Toronto).

### 2.2 KPI Summary Cards

Four cards arranged in a 2×2 grid below the hero banner. Each card follows the same layout pattern.

#### Card Layout Template

```
┌─────────────────────────────────────────┐
│ [icon]  Card Title                      │
│                                         │
│ [large number]                          │
│                                         │
│ 📅 [time period]              View →    │
└─────────────────────────────────────────┘
```

#### Card 1: Active Visitors Permits

| Field | Value |
|-------|-------|
| **Title** | Active Visitors Permits |
| **Icon** | Clipboard/document icon (teal) |
| **Count** | 7 |
| **Time period badge** | "All Time" (calendar icon prefix) |
| **View link** | "View →" → navigates to `/SessionUpdate/RedirectToConsole?filter=visitor-signrd-in` |
| **Position** | Top-left |

**Note**: URL contains a typo: "signrd" instead of "signed".

#### Card 2: Outstanding Packages

| Field | Value |
|-------|-------|
| **Title** | Outstanding packages |
| **Icon** | Package/box icon (teal) |
| **Count** | 0 |
| **Time period badge** | "Last 30 Days" (calendar icon prefix) |
| **View link** | "View →" → navigates to `/SessionUpdate/RedirectToConsole?filter=package-outstanding` |
| **Position** | Top-right |

#### Card 3: Open Violations

| Field | Value |
|-------|-------|
| **Title** | Open violations |
| **Icon** | Warning/grid icon (teal) |
| **Count** | 36 |
| **Time period badge** | "This Month" (calendar icon prefix) |
| **View link** | "View →" → navigates to `/SessionUpdate/RedirectToConsole?filter=incident-report-all` |
| **Position** | Bottom-left |

#### Card 4: Key Checkouts

| Field | Value |
|-------|-------|
| **Title** | Key checkouts |
| **Icon** | Key icon (teal) |
| **Count** | 0 |
| **Time period badge** | "All Time" (calendar icon prefix) |
| **View link** | "View →" → navigates to `/SessionUpdate/RedirectToConsole?filter=master-key` |
| **Position** | Bottom-right |

**Card behavior notes**:
- All "View →" links redirect through `/SessionUpdate/RedirectToConsole` with a filter parameter, which routes to the Security & Concierge Console with the appropriate filter pre-applied
- Time period badges are display-only (not clickable/changeable)
- Card counts appear to be live/dynamic values
- Cards do not have hover states or click-to-expand behavior

### 2.3 Charts Section

Two charts displayed side-by-side below the KPI cards.

#### Chart 1: Security Activity (Left)

| Field | Value |
|-------|-------|
| **Title** | Security Activity |
| **Icon** | Shield outline icon |
| **Chart type** | Line chart |
| **X-axis** | Days of the week (Sun, Mon, Tue, Wed, Thu, Fri, Sat) |
| **Y-axis** | Count (0 to 16, increments of 4) |
| **Data observed** | Sun: ~8, Mon: ~8, Tue: ~11 (peak), Wed: ~9, Thu: ~6 (valley), Fri: ~8, Sat: ~1 |
| **Line color** | Light blue |
| **Data points** | Circular dots at each day |
| **Caption** | "Shows last 7 days security console activity" |
| **Time period badge** | "Last Week" (calendar icon prefix) |

#### Chart 2: Security Logs (Right)

| Field | Value |
|-------|-------|
| **Title** | Security Logs |
| **Icon** | Tools/wrench icon |
| **Chart type** | Vertical bar chart |
| **X-axis** | Months (Oct, Nov, Dec, Jan, Feb, Mar) |
| **Y-axis** | Count (0 to 100, increments of 25) |
| **Data observed** | Oct: ~65, Nov: ~75, Dec: ~75, Jan: ~75, Feb: ~70, Mar: ~40 (partial month) |
| **Bar color** | Teal/green |
| **Caption** | "Shows security logs created by month" |
| **Time period badge** | "Last 6 Months" (calendar icon prefix) |

**Chart behavior notes**:
- Charts are not interactive (no tooltips on hover observed)
- Time period badges are display-only
- Charts appear to render via a JavaScript charting library (likely Chart.js or similar)

### 2.4 Recent Announcements Section

Accordion-style expandable list below the charts.

| Field | Value |
|-------|-------|
| **Section title** | Recent Announcements |
| **Icon** | Megaphone icon |
| **Time period badge** | "All Time" (calendar icon prefix) |
| **Default state** | First announcement expanded, rest collapsed |

#### Observed Announcements

| # | Title | Date | Expanded by default | Has "View Announcement" button |
|---|-------|------|---------------------|-------------------------------|
| 1 | Possible noise during unit renovation - 12th Floor | 2/11/2026 2:29:44 PM | Yes (▲ chevron) | Yes (teal button) |
| 2 | Friendly Reminder: Renovation Notification | 12/22/2025 12:43:57 PM | No (▼ chevron) | — (collapsed) |
| 3 | Window Condensation & Humidity Control | 11/25/2025 11:19:00 AM | No (▼ chevron) | — (collapsed) |

**Expanded announcement content**:
- Shows full announcement body text (truncated with "..." if exceeding display area)
- "View Announcement" button (teal, right-aligned) — navigates to the full announcement page

**Announcement behavior notes**:
- Click chevron (▲/▼) to expand/collapse
- Only one announcement appears expandable at a time (accordion behavior)
- Shows most recent announcements first (sorted by date descending)

### 2.5 Two-Factor Authentication Prompt (Modal)

A Bootstrap modal dialog that appears on dashboard load when 2FA is not enabled for the user.

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Modal type | Bootstrap modal | Standard Bootstrap modal overlay with backdrop |
| 2 | Heading | H4/modal-title | "Two Factor Authentication" |
| 3 | Label | Bold text | "Protect your account with Two Factor Authentication" |
| 4 | Description | Paragraph | Informational text explaining the benefits of 2FA for account security |
| 5 | Setup Now | Link/button | Teal text link. Navigates to `/my/edit-authentication?userID=2071588` (user-specific URL with userID parameter) |
| 6 | Remind me later | Link | Teal text link. Dismisses the modal for the current session |

**Behavior**:
- Appears automatically on dashboard load when the user hasn't set up 2FA
- Modal can be dismissed by clicking "Remind me later", clicking the backdrop, or pressing Escape
- "Setup Now" navigates to the authentication settings page for the current user
- The `userID=2071588` parameter in the URL indicates the user ID for "Temp Concierge"
- Modal reappears on each new session until 2FA is actually configured

**URL discovered**: `/my/edit-authentication?userID={userId}` — authentication configuration page (not documented elsewhere in sidebar navigation)

---

## 3. Quick Search Results Page

**URL**: `/globalSearch/global-search?term={query}`
**Breadcrumb**: Home > Quick Search
**Page title in browser tab**: "Quick Search | Condo Control"

### 3.1 Search Input

Same Quick Search field in the top bar, retains the search term after submission.

### 3.2 Results Sections

Results are grouped by module. Each section displays independently with its own pagination. All sections appear regardless of whether they have results.

| # | Section | Icon | Columns (when results exist) | Pagination |
|---|---------|------|------------------------------|------------|
| 1 | **Unit File** | Green circle | (no results observed — shows "Your filter or search returned no results.") | — |
| 2 | **Security & Concierge Console** | Green circle | Type, Reference #, When, What happened (click for full details), Unit, Action | Page X of Y, Previous/Next buttons |
| 3 | **Announcements** | Green circle | (icon column), Title, Posted, Expires | Page X of Y, Previous/Next buttons |
| 4 | **Service Requests** | Green circle | (no results observed — shows "Your filter or search returned no results.") | — |
| 5 | **Amenity Bookings** | Green circle | (no results observed — shows "Your filter or search returned no results.") | — |
| 6 | **File Library** | Green circle | (no results observed — shows "Your filter or search returned no results.") | — |

#### Security & Concierge Console Results Table

| # | Column | Description |
|---|--------|-------------|
| 1 | Type | Event type (e.g., "Incident Report") |
| 2 | Reference # | Numeric reference number (e.g., 1765, 1661, 1648) |
| 3 | When | Date and time (format: MM/DD/YYYY HH:MM:SS) |
| 4 | What happened (click for full details) | Clickable link to full event details. Shows event description/title |
| 5 | Unit | Unit number if associated (e.g., "1411") |
| 6 | Action | Action buttons (not observed in results) |

**Pagination**: "Previous | Page 1 of 17 | Next" — Previous is greyed out on page 1, Next is teal/clickable.

#### Announcements Results Table

| # | Column | Description |
|---|--------|-------------|
| 1 | (icon) | Small icon indicating announcement type |
| 2 | Title | Announcement title text |
| 3 | Posted | Post date/time (format: M/DD/YYYY H:MM:SS AM/PM) |
| 4 | Expires | Expiry date/time (format: M/DD/YYYY H:MM:SS AM/PM) |

---

## 4. URL Map (Dashboard & Global)

| Page | URL Pattern |
|------|-------------|
| Home Dashboard | `/my/my-home` |
| Quick Search Results | `/globalSearch/global-search?term={query}` |
| View Visitors Permits (from dashboard) | `/SessionUpdate/RedirectToConsole?filter=visitor-signrd-in` |
| View Outstanding Packages (from dashboard) | `/SessionUpdate/RedirectToConsole?filter=package-outstanding` |
| View Open Violations (from dashboard) | `/SessionUpdate/RedirectToConsole?filter=incident-report-all` |
| View Key Checkouts (from dashboard) | `/SessionUpdate/RedirectToConsole?filter=master-key` |
| Edit Authentication (2FA setup) | `/my/edit-authentication?userID={userId}` |

---

## 5. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Live weather integration** — Shows current weather on dashboard banner. Contextually useful for building staff
2. **Security-focused KPIs** — Dashboard is clearly tailored for security/concierge roles. All 4 KPI cards are security-relevant
3. **Global search across modules** — Searches Unit File, Security Console, Announcements, Service Requests, Amenity Bookings, and File Library in one query
4. **Module-specific search results** — Results grouped by module with individual pagination. Easy to scan
5. **Console redirect pattern** — Dashboard KPI "View" links use a redirect pattern (`/SessionUpdate/RedirectToConsole?filter=`) that preserves filter context

### What CondoControl Gets Wrong
1. **No autocomplete on Quick Search** — Must press Enter and load a full results page. No typeahead suggestions
2. **Top bar icons lack feedback** — Help and Call buttons produce no visible response on click. No tooltips
3. **User avatar has no dropdown** — No visible logout, account switching, or profile access from the avatar
4. **Static time periods on KPIs** — Time period badges ("All Time", "Last 30 Days", "This Month") are not adjustable by the user
5. **Non-interactive charts** — No hover tooltips, no drill-down, no ability to change chart time ranges
6. **URL typo** — Visitor permit filter URL contains "signrd" instead of "signed"
7. **Legacy ASP.NET URLs mixed with modern** — Change Password uses `/change-password.aspx`, Email Preferences uses `/my-account.aspx`, while other pages use modern routes. Indicates platform migration in progress
8. **Sidebar requires scrolling** — All 15+ nav items don't fit in viewport. Store, Survey, Training, Unit File, User Guide are below the fold

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~290+*
