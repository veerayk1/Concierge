# 10 -- Reports & Analytics

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

Reports & Analytics is the intelligence layer of Concierge. It turns raw operational data from every module into structured reports, visual dashboards, and AI-powered narratives that help staff, managers, and board members make better decisions.

### Why This Module Exists

Building management generates enormous amounts of data -- packages logged, maintenance requests filed, amenity bookings made, security incidents recorded, parking violations issued. Without structured reporting, this data sits unused. Property managers cannot identify trends. Board members cannot evaluate building health. Security supervisors cannot spot patterns in incidents.

This module solves that by providing three layers of reporting:

| Layer | What It Does | Who Uses It |
|-------|-------------|-------------|
| **Operational Reports** | Raw data export -- lists, tables, filtered views | Staff, Property Managers |
| **Performance Analytics** | Aggregated metrics, charts, KPIs, comparisons | Property Managers, Board Members |
| **AI Insights** | Natural language summaries, anomaly detection, predictions, root cause analysis | Property Managers, Board Members, Super Admin |

### Key Facts

| Aspect | Detail |
|--------|--------|
| **Report types** | 39+ pre-built reports across 8 categories |
| **Export formats** | CSV, Excel (.xlsx), PDF |
| **Scheduled reports** | Email delivery on daily, weekly, or monthly cadence |
| **Saved templates** | Users save filter/column configurations for one-click reuse |
| **Chart types** | Bar, line, pie, heatmap, stacked bar, donut |
| **AI capabilities** | 8 features (natural language queries, executive summaries, trend narration, anomaly highlighting, comparison narratives, board presentation generation, predictive analytics, root cause analysis) |
| **Building Health Score** | Composite 0--100 score across 6 dimensions |

---

## 2. Research Summary

### What Industry Leaders Do Well

Competitive analysis of three major condo management platforms revealed these strengths worth adopting:

| Finding | Source | How Concierge Improves |
|---------|--------|----------------------|
| 39 pre-built reports across 3 categories covering amenities, security, and unit data | Industry research | Expand to 39+ reports across 8 categories -- add maintenance, parking, communication, training, and community |
| 10 export formats (PDF, XLS, XLSX, RTF, DOCX, MHT, HTML, Text, CSV, Image) | Industry research | Consolidate to 3 formats (CSV, Excel, PDF) that cover 99% of use cases. Fewer choices, faster export. |
| Favourite/star system for frequently used reports | Industry research | Adopt -- add pinned reports to the top of the list with one-click access |
| Parameterized report viewer with date ranges and multi-select filters | Industry research | Adopt -- extend with saved filter templates and AI-suggested filters |
| Custom report builder for user-created reports | Industry research | Adopt -- add drag-and-drop column selection, visual query builder, and natural language queries |
| Dual export (Excel + PDF) on every report | Industry research | Adopt -- add CSV as a third option, include scheduled export via email |
| Category-based report organization (Amenity, Security, Unit File) | Industry research | Adopt -- expand to 8 categories matching all Concierge modules |

### What Industry Leaders Get Wrong

| Problem | Source | How Concierge Fixes It |
|---------|--------|----------------------|
| No report scheduling -- users must run reports manually every time | Industry research | Scheduled reports with email delivery (daily, weekly, monthly) |
| No data preview before running -- must generate full report to see any data | Industry research | Inline row count and data preview before full generation |
| No "recently run" section -- users navigate from scratch each time | Industry research | Recent Reports tab with last 10 reports and last-run timestamps |
| Truncated parameter labels in narrow sidebar panels | Industry research | Full-width parameter panel with clear labels and descriptions |
| Identical category icons -- no visual distinction between report groups | Industry research | Distinct icons per category (calendar for amenities, shield for security, wrench for maintenance, etc.) |
| No charts or visual analytics -- reports are table-only | Industry research | Chart builder with 6 chart types, KPI cards, and heatmaps |
| No comparative analysis -- no period-over-period comparison | Industry research | Built-in comparison toggle: current vs. previous period with change indicators |
| Empty custom reports tab with no guidance on how to create one | Industry research | Empty state with "Create Your First Report" button and guided wizard |
| No AI integration -- all analysis is manual | Industry research | 8 AI capabilities embedded directly in the report viewer |

---

## 3. Feature Spec

### 3.1 Report Library

The report library is the main entry point. It displays all available reports organized by category.

#### 3.1.1 Report Categories

| # | Category | Icon | Report Count | Description |
|---|----------|------|-------------|-------------|
| 1 | Security & Concierge | Shield | 10 | Incidents, visitors, keys, pass-on logs, shift summaries, activity reports |
| 2 | Package Management | Box | 5 | Package details, release status, unreleased packages, courier breakdown, volume trends |
| 3 | Maintenance | Wrench | 5 | Service requests, response times, category breakdown, vendor performance, recurring issues |
| 4 | Amenity Booking | Calendar | 4 | Usage statistics, payment reports, booking trends, capacity utilization |
| 5 | Unit & Resident | Building | 10 | Resident lists, unit details, pets, vehicles, emergency contacts, FOBs/keys, buzzer codes, vacations, front desk instructions |
| 6 | Communication | Megaphone | 3 | Announcement distribution, email delivery, notification channel usage |
| 7 | Parking | Car | 3 | Active permits, violations, visitor parking history |
| 8 | Training | Graduation cap | 2 | Course completion, quiz scores |

**Total standard reports**: 42

#### 3.1.2 Report Library Tabs

| # | Tab | Default | Description |
|---|-----|---------|-------------|
| 1 | All Reports | Yes | All standard reports organized by category |
| 2 | Pinned Reports | No | Reports the user has pinned for quick access |
| 3 | Recent Reports | No | Last 10 reports the user has run, sorted by recency |
| 4 | Scheduled Reports | No | Reports configured for automatic email delivery |
| 5 | Custom Reports | No | User-created reports from the report builder |

#### 3.1.3 Report Library -- Search

| Field | Type | Placeholder | Behavior |
|-------|------|-------------|----------|
| Search reports | `text` | "Search by report name..." | Filters the visible report list in real time as the user types. Searches report name and description. Debounce: 300ms. |

- **Empty search result**: "No reports match your search. Try a different keyword or browse by category."
- **Minimum characters**: 2 before filtering begins

#### 3.1.4 Report List Item

Each report in the library displays:

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Category icon | Icon | Color-coded icon matching the category (see 3.1.1) |
| 2 | Report name | Text | Primary label. Clickable -- navigates to the report viewer. |
| 3 | Description | Text (muted) | One-line description of what the report contains |
| 4 | Last run | Timestamp (muted) | "Last run 2 hours ago" or "Never run". Tooltip: full ISO timestamp. |
| 5 | Pin button | Icon toggle | Outline star = not pinned. Filled star = pinned. Click toggles. |
| 6 | Schedule indicator | Icon (optional) | Clock icon displayed if this report has an active schedule |

**Report Name -- Button Behavior**:
- **Click**: Navigate to the report viewer for this report
- **Loading**: Spinner replaces report canvas while data loads
- **Success**: Report viewer renders with data
- **Failure**: Error banner: "Unable to load this report. Please try again or contact support."

**Pin Button -- Button Behavior**:
- **Click**: Toggle pinned status. Optimistic UI update.
- **Success**: Toast: "Report pinned" / "Report unpinned". Report appears/disappears from Pinned tab.
- **Failure**: Revert toggle. Toast: "Could not update pin. Please try again."
- **Loading**: No visible loading -- optimistic update handles this.

---

### 3.2 Report Viewer

When a user clicks a report, they enter the report viewer. This is a full-page experience with a parameter panel, data table, optional charts, and an action toolbar.

#### 3.2.1 Report Viewer Layout

**Desktop (1280px+)**:

```
+------------------------------------------------------+
| Breadcrumb: Reports > {Report Name}                  |
+------------------------------------------------------+
| [Report Title]                    [Actions Toolbar]   |
+------------------------------------------------------+
| Parameter Bar (collapsible)                           |
| [Date Range] [Filters...] [Group By] [Apply] [Reset] |
+------------------------------------------------------+
| KPI Cards (optional, up to 4)                         |
| [Total] [Avg] [Trend] [Custom]                        |
+------------------------------------------------------+
| Chart Area (optional, collapsible)                    |
+------------------------------------------------------+
| Data Table                                             |
| Columns | Rows | Pagination                           |
+------------------------------------------------------+
```

**Tablet (768px--1279px)**:
- Parameter bar stacks vertically (2 filters per row)
- KPI cards: 2 per row instead of 4
- Chart area: full width, reduced height
- Data table: horizontal scroll enabled for wide tables

**Mobile (< 768px)**:
- Parameter bar collapses into a "Filters" button that opens a bottom sheet
- KPI cards: 1 per row, swipeable carousel
- Chart area: full width, tap to expand
- Data table: card view by default (each row becomes a card). Toggle to table view available.

#### 3.2.2 Parameter Bar

The parameter bar contains filters that control what data the report shows. Parameters vary by report but follow a standard pattern.

**Universal Parameters (every report)**:

| # | Field | Type | Default | Required | Validation | Error Message |
|---|-------|------|---------|----------|------------|---------------|
| 1 | Date Range Preset | `select` | "Last 30 days" | Yes | Must be a valid preset or "Custom" | -- |
| 2 | Start Date | `date` | Auto-calculated from preset | Yes (if Custom) | Must be a valid date. Cannot be in the future. Must be before End Date. Max range: 365 days. | "Start date cannot be after the end date" / "Date range cannot exceed 365 days" |
| 3 | End Date | `date` | Auto-calculated from preset | Yes (if Custom) | Must be a valid date. Cannot be more than 1 day in the future. Must be after Start Date. | "End date cannot be before the start date" |

**Date Range Presets**:

| # | Preset | Date Calculation |
|---|--------|-----------------|
| 1 | Today | Current day midnight to now |
| 2 | Yesterday | Previous day midnight to midnight |
| 3 | Last 7 days | 7 days ago to now |
| 4 | Last 30 days | 30 days ago to now (default) |
| 5 | Last 90 days | 90 days ago to now |
| 6 | This month | 1st of current month to now |
| 7 | Last month | 1st of previous month to last day of previous month |
| 8 | This quarter | 1st of current quarter to now |
| 9 | Last quarter | 1st of previous quarter to last day of previous quarter |
| 10 | This year | January 1 to now |
| 11 | Last year | January 1 to December 31 of previous year |
| 12 | Custom | User enters Start Date and End Date manually |

**Common Optional Parameters**:

| # | Field | Type | Used In | Default | Validation |
|---|-------|------|---------|---------|------------|
| 1 | Unit | `multi-select` (searchable) | Security, Package, Maintenance, Unit | All | -- |
| 2 | Staff Member | `multi-select` (searchable) | Security, Maintenance | All | -- |
| 3 | Status | `multi-select` | Maintenance, Package | All statuses | -- |
| 4 | Category | `multi-select` | Maintenance, Security | All categories | -- |
| 5 | Amenity | `multi-select` | Amenity | All amenities | -- |
| 6 | Group By | `select` | All reports | None | -- |
| 7 | Sort By | `select` | All reports | Date (newest first) | -- |

**Apply Button**:
- **Label**: "Apply Filters"
- **Click**: Regenerates the report with selected parameters
- **Loading**: Button shows spinner + "Generating..." text. Report canvas shows skeleton loading.
- **Success**: Report data refreshes. Row count updates. Toast: "Report generated -- {N} records found."
- **Failure**: Error banner above data table: "Failed to generate report. {error details}. Please try again."

**Reset Button**:
- **Label**: "Reset"
- **Style**: Ghost/text button
- **Click**: Resets all parameters to defaults. Auto-applies.

#### 3.2.3 KPI Cards

Reports may display up to 4 summary KPI cards above the data table. KPI cards provide at-a-glance metrics.

**KPI Card Structure**:

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Metric label | Text (muted, small) | e.g., "Total Packages" |
| 2 | Metric value | Text (large, bold) | e.g., "1,247" |
| 3 | Change indicator | Badge | Green up arrow / Red down arrow + percentage vs. previous period. Tooltip: "Compared to previous 30 days" |
| 4 | Sparkline | Mini chart (optional) | 30-day trend line. No axis labels. Visual-only. |

**KPI Card -- Click Behavior**:
- **Click**: Scrolls to the data table and applies a filter matching this KPI. For example, clicking "Open Requests (12)" filters the table to show only open requests.
- **Tooltip**: "Click to filter table to this metric"

**Example KPIs by Report Category**:

| Category | KPI 1 | KPI 2 | KPI 3 | KPI 4 |
|----------|-------|-------|-------|-------|
| Security | Total Incidents | Open Incidents | Avg. Response Time | Most Active Guard |
| Packages | Total Packages | Unreleased | Avg. Hold Time | Top Courier |
| Maintenance | Total Requests | Open Requests | Avg. Resolution Days | Most Common Category |
| Amenity | Total Bookings | Revenue | Most Booked Amenity | Avg. Bookings/Day |

#### 3.2.4 Data Table

The primary report output is a paginated data table.

**Table Features**:

| # | Feature | Description |
|---|---------|-------------|
| 1 | Column sorting | Click column header to sort ascending. Click again for descending. Third click removes sort. Active sort shown by arrow icon. |
| 2 | Column resizing | Drag column border to resize. Double-click border to auto-fit content width. |
| 3 | Column reordering | Drag column header to reorder. |
| 4 | Column visibility | "Columns" button opens a checklist to show/hide columns. |
| 5 | Row selection | Checkbox on each row. "Select All" checkbox in header. Selection enables bulk actions. |
| 6 | Row click | Click a row to open a detail panel (slide-in from right). |
| 7 | Pagination | Bottom of table: "Showing 1--25 of 1,247 results". Page size options: 25, 50, 100. |
| 8 | Inline search | Search box above the table filters visible rows. |
| 9 | Sticky header | Column headers remain visible while scrolling vertically. |
| 10 | Zebra striping | Alternating row backgrounds for readability. |

**Pagination Fields**:

| # | Field | Type | Default | Validation |
|---|-------|------|---------|------------|
| 1 | Page size | `select` | 25 | Options: 25, 50, 100 |
| 2 | Current page | `number` (read-only display) | 1 | Auto-calculated |
| 3 | Page navigation | Buttons | -- | First, Previous, Page numbers, Next, Last |

**Empty State**:
- **Message**: "No data found for the selected filters."
- **Guidance**: "Try expanding the date range or adjusting your filters."
- **Illustration**: Empty report illustration (paper with magnifying glass)

**Loading State**:
- Skeleton table with 10 shimmering rows and column headers

**Error State**:
- **Message**: "Something went wrong while generating this report."
- **Detail**: "{Error message from server}"
- **Action**: "Try Again" button

#### 3.2.5 Chart Builder

Users can visualize report data with charts. The chart area is above the data table and can be toggled on/off.

**Chart Toggle Button**:
- **Label**: "Show Chart" / "Hide Chart"
- **Icon**: Bar chart icon
- **Position**: Actions toolbar
- **Default**: Hidden (charts are opt-in)

**Chart Configuration Panel** (opens when chart is shown):

| # | Field | Type | Default | Required | Validation | Error Message |
|---|-------|------|---------|----------|------------|---------------|
| 1 | Chart Type | `select` | Bar | Yes | Must be one of: Bar, Line, Pie, Donut, Stacked Bar, Heatmap | -- |
| 2 | X-Axis / Category | `select` (from table columns) | First text/date column | Yes | Must be a valid column | "Select a column for the category axis" |
| 3 | Y-Axis / Value | `select` (from table columns) | First numeric column | Yes | Must be a numeric column | "Value axis must be a numeric column" |
| 4 | Group By | `select` (from table columns) | None | No | -- | -- |
| 5 | Color Scheme | `select` | Platform default | No | -- | -- |
| 6 | Show Labels | `toggle` | On | No | -- | -- |
| 7 | Show Legend | `toggle` | On | No | -- | -- |

**Chart Type Suitability** (tooltip guidance):

| Chart Type | Best For | Not Ideal For |
|------------|----------|---------------|
| Bar | Comparing quantities across categories | Time series data |
| Line | Trends over time | Categorical comparisons |
| Pie | Part-of-whole composition (< 8 segments) | Many categories, time series |
| Donut | Same as pie with a center metric | Same as pie |
| Stacked Bar | Part-of-whole across categories | Precise value reading |
| Heatmap | Density patterns (time vs. category) | Small datasets |

**AI Chart Recommendation** (see Section 7):
- When a user opens the chart builder, the system suggests the best chart type for the current data.
- Suggestion appears as a subtle banner: "Suggested: Line chart -- this data has a clear time dimension."
- User can dismiss or accept with one click.

#### 3.2.6 Actions Toolbar

The toolbar sits in the top-right of the report viewer.

| # | Button | Icon | Label | Behavior |
|---|--------|------|-------|----------|
| 1 | Export | Download | "Export" | Opens dropdown: CSV, Excel, PDF |
| 2 | Schedule | Clock | "Schedule" | Opens schedule modal (see 3.4) |
| 3 | Save Template | Bookmark | "Save" | Saves current filters + columns as a template (see 3.3) |
| 4 | Chart | Bar chart | "Chart" | Toggles chart visibility |
| 5 | AI Summary | Sparkle | "Summarize" | Generates AI executive summary (see 7.2) |
| 6 | Print | Printer | "Print" | Opens browser print dialog with print-optimized CSS |
| 7 | Share | Link | "Share" | Copies a deep link to this report with current filters encoded in URL |
| 8 | Full Screen | Expand | -- | Enters full-screen mode (hides navigation) |

**Export Button -- Dropdown Options**:

| # | Format | File Extension | Description |
|---|--------|---------------|-------------|
| 1 | CSV | `.csv` | Comma-separated values. All visible columns. UTF-8 encoding. |
| 2 | Excel | `.xlsx` | Formatted spreadsheet with headers, column widths, and filters. |
| 3 | PDF | `.pdf` | Print-ready document with property header, report title, filters summary, and paginated table. Charts included if visible. |

**Export -- Button States**:
- **Click**: Starts file generation
- **Loading**: Button shows spinner + "Exporting..."
- **Success**: Browser download triggered. Toast: "Report exported as {format}."
- **Failure**: Toast (error): "Export failed. Please try again." If report exceeds 50,000 rows: "This report is too large to export. Apply filters to reduce the data set."
- **Max export rows**: 50,000

**Share Button -- Behavior**:
- **Click**: Copies URL to clipboard
- **Success**: Toast: "Link copied. Anyone with access can view this report with these filters."
- **URL format**: `/reports/{reportSlug}?start=2026-01-01&end=2026-03-14&status=open&groupBy=category`

---

### 3.3 Saved Report Templates

Users can save their current filter and column configuration as a named template for future reuse.

#### 3.3.1 Save Template Modal

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 1 | Template Name | `text` | 100 chars | Yes | "" | Not empty. Unique per user per report. | "Template name is required" / "A template with this name already exists" |
| 2 | Description | `textarea` | 250 chars | No | "" | -- | -- |
| 3 | Share with team | `toggle` | -- | No | Off | -- | -- |

**Save Button**:
- **Label**: "Save Template"
- **Loading**: Spinner + "Saving..."
- **Success**: Modal closes. Toast: "Template saved." Template appears in the template dropdown.
- **Failure**: Inline error message below the form field that failed.

#### 3.3.2 Template Dropdown

When templates exist for a report, a dropdown appears in the parameter bar:

| # | Element | Description |
|---|---------|-------------|
| 1 | Label | "Saved Templates" |
| 2 | Default option | "Default" (system default filters) |
| 3 | User templates | Listed by name, most recent first |
| 4 | Shared templates | Listed under a "Shared by Team" divider |
| 5 | Delete action | Trash icon on hover. Confirmation: "Delete this template?" with Cancel/Delete buttons. |

**Selecting a Template**:
- **Click**: Applies saved filters and column configuration. Report regenerates automatically.
- **Loading**: Parameter bar shows brief skeleton. Report table shows skeleton.
- **Success**: Data loads with saved configuration. Toast: "Template '{name}' applied."

---

### 3.4 Scheduled Reports

Users can configure reports to run automatically and be emailed on a recurring schedule.

#### 3.4.1 Schedule Modal

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 1 | Frequency | `select` | -- | Yes | Weekly | Options: Daily, Weekly, Monthly | -- |
| 2 | Day of Week | `select` | -- | Yes (if Weekly) | Monday | Options: Monday through Sunday | -- |
| 3 | Day of Month | `select` | -- | Yes (if Monthly) | 1 | Options: 1--28 | -- |
| 4 | Time | `time` | -- | Yes | 08:00 AM | Must be a valid time. 15-minute increments. | "Select a delivery time" |
| 5 | Timezone | `select` | -- | Yes | Property timezone | Valid IANA timezone | -- |
| 6 | Format | `select` | -- | Yes | PDF | Options: CSV, Excel, PDF | -- |
| 7 | Recipients | `multi-select` (searchable) | -- | Yes | Current user | At least 1 recipient. Must be users with report access. Max 20 recipients. | "Add at least one recipient" / "Maximum 20 recipients" |
| 8 | Email Subject | `text` | 150 chars | No | "{Report Name} -- {Frequency} Report" | -- | -- |
| 9 | Include Chart | `toggle` | -- | No | On (if chart configured) | Only available if report has a chart | -- |
| 10 | Active | `toggle` | -- | No | On | -- | -- |

**Save Schedule Button**:
- **Label**: "Save Schedule"
- **Loading**: Spinner + "Saving..."
- **Success**: Modal closes. Toast: "Report scheduled. Next delivery: {date/time}." Clock icon appears on report list item.
- **Failure**: Inline field errors or toast: "Failed to save schedule."

#### 3.4.2 Scheduled Reports Tab (Report Library)

Displays all reports with active schedules.

| # | Column | Description |
|---|--------|-------------|
| 1 | Report Name | Clickable -- navigates to report viewer |
| 2 | Frequency | "Daily at 8:00 AM" / "Weekly on Monday at 8:00 AM" / "Monthly on the 1st at 8:00 AM" |
| 3 | Format | CSV / Excel / PDF |
| 4 | Recipients | Count + avatar stack. Tooltip: full list of names. |
| 5 | Next Delivery | Relative timestamp. "Tomorrow at 8:00 AM" or "In 3 days" |
| 6 | Last Delivered | Relative timestamp. "2 days ago" or "Never" |
| 7 | Status | Active (green) / Paused (grey) |
| 8 | Actions | Edit (pencil), Pause/Resume (toggle), Delete (trash) |

**Delete Schedule**:
- **Confirmation**: "Delete this scheduled report? Recipients will no longer receive it."
- **Cancel** / **Delete** buttons
- **Success**: Toast: "Schedule deleted."

**Empty State**:
- **Message**: "No scheduled reports yet."
- **Guidance**: "Open any report and click the Schedule button to set up automatic email delivery."

---

### 3.5 Custom Report Builder

Users can create ad-hoc reports by selecting data sources, columns, filters, and grouping.

#### 3.5.1 Report Builder Wizard -- Step 1: Data Source

| # | Field | Type | Required | Default | Validation | Error Message |
|---|-------|------|----------|---------|------------|---------------|
| 1 | Data Source | `select` | Yes | -- | Must select one | "Select a data source to continue" |

**Data Source Options**:

| # | Source | Description | Available Columns |
|---|--------|-------------|-------------------|
| 1 | Events | All unified events (security, packages, visitors, etc.) | Event type, date, unit, resident, status, created by, notes, etc. |
| 2 | Maintenance Requests | All service requests | Category, status, priority, unit, assigned to, created date, resolved date, etc. |
| 3 | Amenity Bookings | All reservations | Amenity, date, unit, resident, status, payment amount, etc. |
| 4 | Units | All unit records | Number, floor, building, occupant count, pet count, vehicle count, etc. |
| 5 | Residents | All resident records | Name, type (owner/tenant), unit, email, phone, move-in date, etc. |
| 6 | Parking | Permits and violations | Type, unit, plate, status, issue date, expiry date, etc. |
| 7 | Training | Course completions | Course, user, score, pass/fail, completion date, etc. |

#### 3.5.2 Report Builder Wizard -- Step 2: Columns

| # | Field | Type | Required | Default | Validation | Error Message |
|---|-------|------|----------|---------|------------|---------------|
| 1 | Available Columns | `dual-list` (drag and drop) | At least 1 | All columns selected | Minimum 1 column, maximum 20 columns | "Select at least one column" / "Maximum 20 columns allowed" |
| 2 | Column Order | Drag-and-drop reorder | -- | Source order | -- | -- |

#### 3.5.3 Report Builder Wizard -- Step 3: Filters & Grouping

| # | Field | Type | Required | Default | Validation | Error Message |
|---|-------|------|----------|---------|------------|---------------|
| 1 | Date Range | Same as 3.2.2 | Yes | Last 30 days | Same as 3.2.2 | Same as 3.2.2 |
| 2 | Filter conditions | Dynamic filter rows | No | None | Valid column + operator + value | "Enter a valid filter value" |
| 3 | Group By | `select` (from selected columns) | No | None | -- | -- |
| 4 | Sort By | `select` (from selected columns) | No | First column, ascending | -- | -- |

**Filter Condition Row**:

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Column | `select` | Which column to filter |
| 2 | Operator | `select` | Equals, Not equals, Contains, Greater than, Less than, Between, Is empty, Is not empty |
| 3 | Value | Dynamic (text / select / date / number) | Depends on column data type |
| 4 | Remove | Icon button (X) | Removes this filter row |

"+ Add Filter" link to add additional filter conditions. Conditions are combined with AND logic.

#### 3.5.4 Report Builder Wizard -- Step 4: Save & Run

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 1 | Report Name | `text` | 100 chars | Yes | "" | Not empty. Unique per user. | "Report name is required" / "A report with this name already exists" |
| 2 | Description | `textarea` | 250 chars | No | "" | -- | -- |

**Run Report Button**:
- **Label**: "Save & Run Report"
- **Loading**: Full-page loading with progress: "Saving report... Generating data..."
- **Success**: Navigates to the report viewer with data loaded. Toast: "Custom report created."
- **Failure**: Inline errors or toast: "Failed to create report. {error details}."

**Save as Draft Button**:
- **Label**: "Save Draft"
- **Style**: Ghost button
- **Behavior**: Saves without running. Report appears in Custom Reports tab.

---

### 3.6 Comparative Analytics

Any report can be viewed in comparison mode -- current period vs. a previous period.

#### 3.6.1 Comparison Toggle

| # | Field | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Enable Comparison | `toggle` | Off | Adds a "vs." row/column to the data table and overlays on charts |
| 2 | Compare To | `select` | Previous period | Options: Previous period (same duration), Same period last year, Custom range |

**When comparison is enabled**:
- KPI cards show delta badges (e.g., "+12% vs. last month" in green, "-5% vs. last month" in red)
- Charts overlay the comparison period as a dashed line (line charts) or grouped bars (bar charts)
- Data table adds a "Change" column showing the absolute and percentage difference
- AI automatically generates a Comparison Narrative (see Section 7.5)

#### 3.6.2 Change Indicators

| Change | Color | Icon | Example |
|--------|-------|------|---------|
| Increase > 10% | Green | Up arrow | "+15% (was 200, now 230)" |
| Increase 0--10% | Light green | Up arrow | "+3% (was 200, now 206)" |
| No change | Grey | Dash | "0% (unchanged)" |
| Decrease 0--10% | Light red | Down arrow | "-4% (was 200, now 192)" |
| Decrease > 10% | Red | Down arrow | "-18% (was 200, now 164)" |

Tooltip on every change indicator: "Compared to {comparison period label}: {previous value} --> {current value}"

---

### 3.7 Building Health Score

A composite score from 0 to 100 that represents overall building operational health. Displayed as a top-level widget on the Property Manager and Board Member dashboards, with drill-down into the Reports module.

#### 3.7.1 Health Score Dimensions

| # | Dimension | Weight | Data Source | Scoring Logic |
|---|-----------|--------|-------------|---------------|
| 1 | Maintenance Responsiveness | 25% | Maintenance requests | Based on avg. response time, open request count, overdue count. 100 = all resolved within SLA; 0 = all overdue. |
| 2 | Security Activity | 20% | Security events, incidents | Based on incident resolution rate, patrol completeness, open incidents. 100 = all resolved, full patrol coverage. |
| 3 | Amenity Utilization | 15% | Amenity bookings | Based on booking rate vs. capacity. 100 = healthy utilization (60--85%); lower scores for underuse or overuse. |
| 4 | Resident Engagement | 15% | Logins, bookings, community posts | Based on active resident percentage, amenity usage, community participation. 100 = high engagement. |
| 5 | Compliance | 15% | Vendor insurance, inspection status | Based on vendor compliance rate, overdue inspection count. 100 = all compliant, no overdue inspections. |
| 6 | Communication | 10% | Announcement reach, notification delivery | Based on announcement delivery rate, notification failure rate. 100 = high reach, no delivery failures. |

**Health Score Display**:

| # | Element | Description |
|---|---------|-------------|
| 1 | Score circle | Large circular gauge showing 0--100 score with color fill (red < 40, yellow 40--69, green 70+) |
| 2 | Score label | "Building Health Score" |
| 3 | Trend arrow | Up/down/flat arrow showing direction vs. previous month |
| 4 | Dimension bars | 6 horizontal progress bars, one per dimension, with individual scores |
| 5 | AI narrative | Short paragraph explaining the score and key contributors (see Section 7) |
| 6 | Drill-down | Click any dimension bar to navigate to the relevant report with pre-applied filters |

**Health Score -- Calculation Frequency**: Recalculated daily at 3:00 AM property local time. Cached for 24 hours.

---

## 4. Data Model

### 4.1 Report Entity

```
Report
  id              UUID          PK, auto-generated
  property_id     UUID          FK -> Property. Required.
  slug            VARCHAR(100)  URL-safe identifier. Unique per property. e.g., "security-log-summary"
  name            VARCHAR(150)  Display name. Required. Max 150 chars.
  description     VARCHAR(500)  One-line description. Optional. Max 500 chars.
  category        VARCHAR(50)   One of: security, packages, maintenance, amenity, unit_resident,
                                communication, parking, training. Required.
  type            ENUM          'standard' | 'custom'. Default: 'standard'.
  data_source     VARCHAR(50)   Source table/view. Required for custom reports.
  columns         JSONB         Ordered list of column definitions: [{key, label, type, visible, width}]
  default_filters JSONB         Default filter configuration: [{column, operator, value}]
  default_sort    JSONB         Default sort: {column, direction}
  default_group   VARCHAR(100)  Default group-by column. Nullable.
  kpi_config      JSONB         Up to 4 KPI card definitions: [{label, aggregation, column, format}]. Nullable.
  chart_config    JSONB         Default chart: {type, xAxis, yAxis, groupBy}. Nullable.
  is_system       BOOLEAN       True for standard reports (cannot be deleted). Default: true.
  created_by      UUID          FK -> User. Nullable for system reports.
  created_at      TIMESTAMP     Auto-set on creation.
  updated_at      TIMESTAMP     Auto-set on update.
```

### 4.2 ReportTemplate Entity

```
ReportTemplate
  id              UUID          PK, auto-generated
  report_id       UUID          FK -> Report. Required.
  user_id         UUID          FK -> User. Creator. Required.
  property_id     UUID          FK -> Property. Required.
  name            VARCHAR(100)  Display name. Required. Unique per user per report. Max 100 chars.
  description     VARCHAR(250)  Optional. Max 250 chars.
  filters         JSONB         Saved filter state: [{column, operator, value}]
  columns         JSONB         Saved column visibility + order: [{key, visible, width, position}]
  sort            JSONB         Saved sort: {column, direction}
  group_by        VARCHAR(100)  Saved group-by column. Nullable.
  is_shared       BOOLEAN       If true, visible to all users with access to this report. Default: false.
  created_at      TIMESTAMP     Auto-set.
  updated_at      TIMESTAMP     Auto-set.
```

### 4.3 ReportSchedule Entity

```
ReportSchedule
  id              UUID          PK, auto-generated
  report_id       UUID          FK -> Report. Required.
  template_id     UUID          FK -> ReportTemplate. Nullable (uses default if null).
  property_id     UUID          FK -> Property. Required.
  created_by      UUID          FK -> User. Required.
  frequency       ENUM          'daily' | 'weekly' | 'monthly'. Required.
  day_of_week     SMALLINT      0 (Sunday) through 6 (Saturday). Required if frequency = 'weekly'.
  day_of_month    SMALLINT      1 through 28. Required if frequency = 'monthly'.
  time            TIME          Delivery time in property timezone. Required.
  timezone        VARCHAR(50)   IANA timezone. Required.
  format          ENUM          'csv' | 'xlsx' | 'pdf'. Required. Default: 'pdf'.
  recipients      JSONB         Array of user IDs. Min 1, max 20.
  email_subject   VARCHAR(150)  Custom subject line. Optional.
  include_chart   BOOLEAN       Whether to include chart in PDF export. Default: true.
  is_active       BOOLEAN       Whether schedule is active. Default: true.
  last_run_at     TIMESTAMP     Last successful delivery. Nullable.
  next_run_at     TIMESTAMP     Next scheduled delivery. Calculated.
  created_at      TIMESTAMP     Auto-set.
  updated_at      TIMESTAMP     Auto-set.
```

### 4.4 ReportPin Entity

```
ReportPin
  id              UUID          PK, auto-generated
  report_id       UUID          FK -> Report. Required.
  user_id         UUID          FK -> User. Required.
  property_id     UUID          FK -> Property. Required.
  created_at      TIMESTAMP     Auto-set.
  UNIQUE(report_id, user_id, property_id)
```

### 4.5 ReportRun Entity (audit log)

```
ReportRun
  id              UUID          PK, auto-generated
  report_id       UUID          FK -> Report. Required.
  user_id         UUID          FK -> User. Required.
  property_id     UUID          FK -> Property. Required.
  filters         JSONB         Filters applied for this run.
  row_count       INTEGER       Number of rows returned.
  duration_ms     INTEGER       Time to generate in milliseconds.
  export_format   VARCHAR(10)   Nullable. Set if user exported after running.
  ai_summary      TEXT          Nullable. AI-generated summary if requested.
  created_at      TIMESTAMP     Auto-set.
```

### 4.6 HealthScore Entity

```
HealthScore
  id                      UUID        PK, auto-generated
  property_id             UUID        FK -> Property. Required.
  score                   SMALLINT    0--100 composite score. Required.
  maintenance_score       SMALLINT    0--100. Required.
  security_score          SMALLINT    0--100. Required.
  amenity_score           SMALLINT    0--100. Required.
  engagement_score        SMALLINT    0--100. Required.
  compliance_score        SMALLINT    0--100. Required.
  communication_score     SMALLINT    0--100. Required.
  ai_narrative            TEXT        AI-generated explanation. Nullable.
  calculated_at           TIMESTAMP   Auto-set.
  UNIQUE(property_id, DATE(calculated_at))
```

---

## 5. User Flows

### 5.1 Property Manager -- Run a Standard Report

| Step | Action | System Response |
|------|--------|----------------|
| 1 | Navigate to Reports from sidebar | Report library loads with All Reports tab active |
| 2 | Scan categories or use search bar | Reports filter in real time |
| 3 | Click "Service Requests" report | Report viewer loads with default filters (last 30 days) |
| 4 | Change date range to "Last Quarter" | Parameter bar updates date fields |
| 5 | Select status filter: "Open" | Filter tag appears |
| 6 | Click "Apply Filters" | Report regenerates. KPI cards update. Table loads with filtered data. |
| 7 | Click "Chart" to toggle chart on | Chart builder appears. AI suggests "Bar chart by category." |
| 8 | Accept chart suggestion | Bar chart renders above data table |
| 9 | Click "Export" > "PDF" | PDF downloads with table + chart + filters summary |

### 5.2 Property Manager -- Schedule a Report

| Step | Action | System Response |
|------|--------|----------------|
| 1 | From report viewer, click "Schedule" | Schedule modal opens |
| 2 | Select frequency: "Weekly" | Day of Week field appears |
| 3 | Select day: "Monday" | -- |
| 4 | Set time: 8:00 AM | -- |
| 5 | Set format: PDF | -- |
| 6 | Add recipients: self + board president | Recipient chips appear |
| 7 | Click "Save Schedule" | Modal closes. Toast: "Report scheduled. Next delivery: Monday at 8:00 AM." |

### 5.3 Board Member -- View Building Health Score

| Step | Action | System Response |
|------|--------|----------------|
| 1 | Log in and view Governance dashboard | Health Score widget visible with score, trend, dimension bars |
| 2 | Read AI narrative below the score | AI explains: "Score improved from 72 to 78. Maintenance responsiveness drove the gain." |
| 3 | Click the "Maintenance Responsiveness" bar | Navigates to Maintenance report with relevant filters applied |
| 4 | Review data and click "Summarize" | AI generates executive summary |
| 5 | Click "Export" > "PDF" | Downloads PDF suitable for board meeting |

### 5.4 Property Manager -- Create a Custom Report

| Step | Action | System Response |
|------|--------|----------------|
| 1 | Navigate to Reports > Custom Reports tab | Tab shows existing custom reports (or empty state) |
| 2 | Click "Create Report" button | Report Builder wizard opens at Step 1 |
| 3 | Select data source: "Maintenance Requests" | Step 2 loads with available columns |
| 4 | Select columns: Unit, Category, Status, Priority, Created Date, Resolved Date | Columns appear in the "Selected" list |
| 5 | Drag to reorder columns | Columns reorder via drag-and-drop |
| 6 | Click "Next" to Step 3 | Filters and grouping page loads |
| 7 | Set date range: Last 90 days | -- |
| 8 | Add filter: Status = Open | Filter row appears |
| 9 | Set Group By: Category | -- |
| 10 | Click "Next" to Step 4 | Save page loads |
| 11 | Name: "Open Requests by Category (90 days)" | -- |
| 12 | Click "Save & Run Report" | Report generates and displays in viewer |

### 5.5 Security Supervisor -- Use Natural Language Query

| Step | Action | System Response |
|------|--------|----------------|
| 1 | Navigate to Reports | Report library loads |
| 2 | Type in search bar: "Show me all incidents last week involving the parking garage" | AI processes the natural language query |
| 3 | System recognizes intent | AI translates to: Report = Incident Details, Date Range = Last 7 days, Location filter = "parking garage" |
| 4 | Confirmation prompt appears | "I will run the Incident Details report for the last 7 days filtered to parking garage. Run this report?" |
| 5 | Click "Run" | Report viewer loads with filters applied |

### 5.6 Resident -- View Available Reports

| Step | Action | System Response |
|------|--------|----------------|
| 1 | Navigate to Reports from resident portal | Only resident-visible reports appear: My Packages, My Requests, My Bookings |
| 2 | Click "My Packages" | Report shows only packages for the resident's unit |
| 3 | Set date range to "This Year" | Report regenerates with filtered data |
| 4 | Click "Export" > "CSV" | CSV downloads with the resident's package data |

---

## 6. UI/UX

### 6.1 Design Principles for Reports

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | Data density without clutter | Tables are compact but readable. 14px body text. 32px row height. |
| 2 | Progressive disclosure | Charts are opt-in. Advanced filters hidden behind "More Filters." AI summaries on demand. |
| 3 | One primary action | The primary CTA on the report viewer is "Apply Filters." Export, schedule, and chart are secondary. |
| 4 | Consistent empty states | Every empty state has an illustration, a message, and a guidance action. |
| 5 | Print-ready | PDF exports and print views use property branding, clean headers, and no interactive elements. |

### 6.2 Report Library Page Layout

**Desktop**:
- Left sidebar: Navigation (same as global nav)
- Main area: Full width. Tabs at top. Search bar below tabs. Report list below search.
- Report list: Cards in a single-column list layout. Each card spans full width.
- Spacing: 16px between cards.

**Tablet**:
- Sidebar collapses to hamburger menu
- Report cards span full width
- Search bar remains above card list

**Mobile**:
- Bottom navigation replaces sidebar
- Search bar is sticky at top
- Report cards become compact (name + category icon only, description hidden)
- Pin and schedule indicators remain visible

### 6.3 Report Viewer Layout Details

**Desktop**:
- Parameter bar: Single horizontal row. Date range on the left. Filters in the center. Apply/Reset on the right.
- KPI cards: 4 across in a grid row. Equal width. 8px gap.
- Chart area: Full width, 300px height. Resizable via drag handle on bottom border.
- Data table: Full width. Horizontal scroll only if columns exceed viewport.
- Actions toolbar: Top-right, icon-only with tooltips on desktop.

**Tablet**:
- Parameter bar: 2 columns. Date range spans full width on first row. Filters in 2-column grid.
- KPI cards: 2 per row.
- Chart area: Full width, 250px height.
- Data table: Horizontal scroll enabled. Sticky first column (typically Unit # or Name).

**Mobile**:
- Parameter bar: Collapsed into a "Filters (3)" button that opens a full-screen bottom sheet.
- KPI cards: Horizontal scrollable carousel. 1 card visible at a time with peek of next.
- Chart area: Full width, 200px height. Tap to expand to full screen.
- Data table: Card view by default. Each row rendered as a card showing key fields. Toggle icon to switch to table view (with horizontal scroll).

### 6.4 Empty States

| Screen | Empty State Message | Guidance | Illustration |
|--------|-------------------|----------|--------------|
| All Reports (no reports accessible) | "No reports available for your role." | "Contact your property manager to adjust your access." | Locked clipboard |
| Pinned Reports | "No pinned reports yet." | "Pin frequently used reports by clicking the star icon on any report." | Empty star |
| Recent Reports | "You haven't run any reports recently." | "Browse the All Reports tab to get started." | Empty clock |
| Scheduled Reports | "No scheduled reports yet." | "Open any report and click Schedule to set up automatic email delivery." | Empty calendar |
| Custom Reports | "No custom reports yet." | "Create Your First Report" (primary button that opens the wizard) | Blank page with plus icon |
| Report Viewer (no data) | "No data found for the selected filters." | "Try expanding the date range or adjusting your filters." | Magnifying glass over empty page |

### 6.5 Loading States

| Screen | Loading Behavior |
|--------|-----------------|
| Report Library | Skeleton cards (8 shimmer cards). Category headers render immediately. |
| Report Viewer -- initial load | Skeleton parameter bar + skeleton KPI cards + skeleton table (10 rows). |
| Report Viewer -- filter change | KPI cards show pulse animation. Table shows translucent overlay with centered spinner. |
| Chart generation | Chart area shows centered spinner with "Rendering chart..." text. |
| Export | Toolbar button shows spinner. No full-page loading. |
| AI Summary | AI summary section shows typing indicator (3 animated dots) for 2--8 seconds. |

### 6.6 Error States

| Error | Display | Recovery |
|-------|---------|----------|
| Report fails to load | Full-width error banner: "Unable to load this report." | "Try Again" button. Link: "Contact Support" |
| Filter produces server error | Inline error below parameter bar | "Reset Filters" button + "Try Again" |
| Export fails | Toast (error): "Export failed. Please try again." | Auto-dismiss after 5 seconds. User can retry. |
| Schedule fails to save | Inline errors in modal fields | Fix validation and retry |
| AI summary unavailable | Muted text in AI section: "AI summary is not available right now." | "Try Again" link. Falls back to no summary. |

### 6.7 Tooltips

| Element | Tooltip Text |
|---------|-------------|
| Pin button (star) | "Pin this report for quick access" |
| Schedule indicator (clock) | "This report is scheduled for automatic delivery" |
| KPI change indicator | "Compared to {comparison period}: {previous value} to {current value}" |
| AI Summarize button | "Generate an AI-powered executive summary of this report" |
| Chart Type selector | "Select how to visualize this data. AI will suggest the best option." |
| Comparison toggle | "Compare this report against a previous time period" |
| Health Score dimension bar | "Click to view the detailed report for this dimension" |
| Export button | "Download this report as CSV, Excel, or PDF" |
| Share button | "Copy a link to this report with current filters" |
| Column visibility toggle | "Choose which columns to show or hide" |
| Group By selector | "Group rows by this column to see subtotals" |
| Max export warning | "Reports with more than 50,000 rows must be filtered before exporting" |

---

## 7. AI Integration

Reports & Analytics is one of the most AI-enhanced modules in Concierge. Eight AI capabilities transform reports from static data tables into intelligent, narrative-driven insights.

All AI features follow the platform's AI principles (see PRD 19): graceful degradation, invisible intelligence, and privacy-first processing.

### 7.1 Natural Language Report Builder

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User types a natural language query in the report search bar |
| **Model** | Sonnet |
| **Cost** | ~$0.01 per query |
| **Input** | Natural language string + available report catalog + data schema |
| **Output** | Matched report + auto-applied filters + confirmation prompt |
| **Fallback** | Standard keyword search of report names and descriptions |
| **Toggle** | Enabled by default. Admin can disable. |

**How It Works**:
1. User types a question: "How many packages were delivered last week?"
2. AI parses the intent: Report = Package Details, Date Range = Last 7 days, Aggregation = count
3. System displays a confirmation card: "Run the Package Details report for the last 7 days? Estimated 142 results."
4. User clicks "Run" or modifies the suggestion
5. Report viewer opens with filters applied

**Supported Query Patterns**:
- "Show me {report subject} from {time period}" -- maps to report + date range
- "How many {entities} {condition} {time period}" -- maps to report + filter + count aggregation
- "Which {entity} has the most {metric}" -- maps to report + sort descending + limit 1
- "Compare {metric} this month vs last month" -- maps to report + comparison mode

**Error Handling**:
- If AI cannot parse the query: "I could not understand that query. Try something like 'Show me all open maintenance requests from last month.'"
- If multiple reports match: "Did you mean: (a) Incident Report Details, or (b) Security Log Summary?"

### 7.2 Executive Summary Generation

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User clicks "Summarize" button on the report viewer toolbar |
| **Model** | Sonnet |
| **Cost** | ~$0.005 per summary |
| **Input** | Report data (up to 500 rows sampled) + KPI values + filters applied |
| **Output** | 200--400 word narrative summary with key findings |
| **Fallback** | No summary displayed. Button remains available for retry. |
| **Toggle** | Enabled by default. Admin can disable. |

**Summary Structure**:
1. **Opening**: One sentence stating what the report covers and the time period
2. **Key Metrics**: 2--3 headline numbers with context (e.g., "There were 47 maintenance requests this month, a 12% increase from last month")
3. **Notable Patterns**: 1--2 observations about trends, outliers, or anomalies
4. **Recommendation** (if applicable): One actionable suggestion based on the data

**Display**:
- Summary appears in a collapsible card above the KPI cards
- Card has an "AI" badge in the top-left corner
- "Copy" button to copy the summary text
- "Regenerate" button to get a fresh summary
- Muted disclaimer: "AI-generated summary. Verify key figures before sharing."

### 7.3 Trend Narration

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Automatic on report generation (if the report spans 30+ days) |
| **Model** | Sonnet |
| **Cost** | ~$0.01 per narration |
| **Input** | Time-series data from the report + historical comparison |
| **Output** | Trend callout cards embedded in the chart area |
| **Fallback** | No trend callouts. Charts render without annotations. |
| **Toggle** | Enabled by default. Admin can disable. |

**Trend Callout Card**:
- Small card overlaid on the chart at the relevant data point
- Contains: Trend description (e.g., "Package volume spiked 40% on March 3") + possible explanation
- Click to dismiss. Click "Details" to see the underlying data.
- Maximum 3 callouts per chart to avoid clutter

### 7.4 Anomaly Highlighting

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Automatic on report generation |
| **Model** | Haiku |
| **Cost** | ~$0.002 per report |
| **Input** | Report dataset + statistical baselines |
| **Output** | Highlighted rows in the data table + anomaly explanation |
| **Fallback** | No highlighting. Standard table rendering. |
| **Toggle** | Enabled by default. Admin can disable. |

**How It Works**:
- AI identifies rows that deviate significantly from the norm (e.g., a maintenance request open for 90 days when the average is 5)
- Anomalous rows get a subtle amber left-border highlight
- Hovering over the highlighted row shows a tooltip: "This request has been open for 90 days -- 18x longer than the average resolution time of 5 days."
- Anomalies are also listed in a summary panel accessible via a "View Anomalies ({count})" link

### 7.5 Comparison Narratives

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Automatic when comparison mode is enabled (see Section 3.6) |
| **Model** | Sonnet |
| **Cost** | ~$0.005 per comparison |
| **Input** | Current period data + comparison period data + KPI deltas |
| **Output** | 2--3 sentence narrative explaining the most significant changes |
| **Fallback** | Numerical delta display only (no narrative) |
| **Toggle** | Enabled by default. Admin can disable. |

**Example Output**:
"Maintenance requests increased 23% compared to last quarter, driven primarily by a 45% rise in plumbing-related issues. Average resolution time improved from 6.2 days to 4.8 days, suggesting the new vendor assignment workflow is working. One concern: the number of requests marked 'high urgency' doubled from 8 to 16."

### 7.6 Board Presentation Generation

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User clicks "Generate Presentation" from the report viewer (Property Manager, Board Member roles only) |
| **Model** | Sonnet |
| **Cost** | ~$0.02 per presentation |
| **Input** | Report data + KPIs + charts + Building Health Score |
| **Output** | Structured presentation outline (exported as PDF) with executive summary, charts, key metrics, and recommendations |
| **Fallback** | Standard PDF export without narrative formatting |
| **Toggle** | Disabled by default. Admin can enable. |

**Presentation Structure** (auto-generated):
1. Cover page with property name, date, and report title
2. Executive Summary (AI-generated, 150--250 words)
3. Key Metrics page with KPI cards
4. Charts page with all configured visualizations
5. Trend Analysis page with AI-generated insights
6. Recommendations page with 2--3 actionable items
7. Data Appendix with the full data table

### 7.7 Predictive Analytics

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User enables "Show Forecast" toggle on a time-series report (requires 90+ days of historical data) |
| **Model** | Sonnet |
| **Cost** | ~$0.01 per forecast |
| **Input** | Historical data (minimum 90 days) + seasonal patterns |
| **Output** | Forecast projections for next 30, 60, or 90 days with confidence intervals |
| **Fallback** | Toggle greyed out with tooltip: "Forecasting requires at least 90 days of data." |
| **Toggle** | Disabled by default. Admin can enable. |

**Display**:
- Forecast appears as a dashed extension of the line chart
- Confidence interval shown as a shaded band around the forecast line
- Legend entry: "Forecast (90% confidence)"
- Forecast period selector: 30 / 60 / 90 days

### 7.8 Root Cause Analysis

| Attribute | Detail |
|-----------|--------|
| **Trigger** | User clicks "Why?" on an anomaly callout or KPI change indicator |
| **Model** | Sonnet |
| **Cost** | ~$0.01 per analysis |
| **Input** | The anomalous data point + related data from other modules (cross-module correlation) |
| **Output** | 2--4 possible root causes ranked by likelihood, with supporting evidence |
| **Fallback** | "Root cause analysis is not available. Review the data manually." |
| **Toggle** | Disabled by default. Admin can enable. |

**Example Output** (for a spike in maintenance requests):
1. "Weather event (85% likely): A freeze warning was issued on Feb 12. Pipe-related requests increased 300% in the following 3 days."
2. "Aging equipment (60% likely): 4 of the 12 requests involve HVAC units installed before 2015, which are past their recommended service life."
3. "Seasonal pattern (40% likely): February typically sees 15--20% more requests than January based on the past 2 years."

**Display**:
- Slide-in panel from the right
- Each cause is a card with a likelihood badge, explanation, and supporting data links
- "Dismiss" and "Mark as Helpful" buttons for feedback to improve future analyses

---

## 8. Analytics

The Reports module has its own operational analytics -- meta-reporting on how reports themselves are used.

### 8.1 Report Usage Analytics (Super Admin / Property Admin)

| Metric | Description | Visualization |
|--------|-------------|---------------|
| Most-run reports | Top 10 reports by run count (last 30 days) | Horizontal bar chart |
| Report generation time | Average, P95, and max generation time per report | Table with sparklines |
| Export usage | Count of exports by format (CSV vs. Excel vs. PDF) | Pie chart |
| Scheduled report delivery | Success/failure rate of scheduled deliveries | KPI card + trend line |
| Active users | Number of unique users running reports per week | Line chart |
| AI feature usage | Invocation count and acceptance rate for each AI capability | Table with progress bars |
| Custom report count | Number of custom reports created over time | Counter + trend |

### 8.2 Data Quality Metrics

| Metric | Description | Source |
|--------|-------------|--------|
| Missing email rate | Percentage of residents without email addresses | User records |
| Incomplete unit profiles | Units missing key fields (pets, vehicles, emergency contacts) | Unit records |
| Stale data | Records not updated in 90+ days | All entities |
| Duplicate detection | Potential duplicate residents or units | AI analysis |

These metrics feed into the Building Health Score and are surfaced via the Data Quality Alerts AI capability (see PRD 19, capability #58).

---

## 9. Notifications

### 9.1 Scheduled Report Delivery

| Trigger | Channel | Recipients | Template |
|---------|---------|------------|----------|
| Scheduled report time reached | Email | Configured recipients (1--20 users) | Report delivery email |
| Scheduled report fails to generate | Email | Schedule creator | Delivery failure notification |

**Report Delivery Email Template**:

| Element | Content |
|---------|---------|
| Subject | "{Report Name} -- {Frequency} Report ({Date})" or custom subject |
| Body | "Hi {First Name}, your scheduled report is attached. Report: {Name}. Period: {Date Range}. Records: {Count}. View online: {deep link}" |
| Attachment | Report file in configured format (CSV/Excel/PDF) |
| Footer | "Manage your scheduled reports: {link}. Unsubscribe from this report: {link}" |

**Delivery Failure Email Template**:

| Element | Content |
|---------|---------|
| Subject | "Scheduled Report Failed: {Report Name}" |
| Body | "Hi {First Name}, your scheduled report '{Name}' failed to generate. Error: {reason}. The system will retry at the next scheduled time. If this continues, contact your administrator." |

### 9.2 Health Score Alerts

| Trigger | Channel | Recipients | Template |
|---------|---------|------------|----------|
| Health Score drops below 50 | Email + Push | Property Manager, Property Admin | "Building Health Score Alert: Score dropped to {score}. {AI narrative}" |
| Health Score drops by 15+ points in a week | Email + Push | Property Manager, Property Admin, Board Members | "Building Health Score declined sharply: {previous} to {current}. {AI narrative}" |
| Health Score reaches 90+ | Email | Property Manager | "Building Health Score reached {score}. Great work!" |

### 9.3 AI Insight Notifications

| Trigger | Channel | Recipients | Template |
|---------|---------|------------|----------|
| AI detects a significant anomaly in scheduled report | Email (appended to report email) | Report recipients | Anomaly callout appended to the report email body |
| Predictive analytics flags an upcoming issue | Push | Property Manager | "Prediction: {description}. View the analysis: {link}" |

---

## 10. API

### 10.1 Report Library

**List Reports**

```
GET /api/v1/reports
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category slug |
| type | string | No | 'standard' or 'custom' |
| search | string | No | Search report name and description |
| pinned | boolean | No | If true, return only pinned reports |

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "service-requests",
      "name": "Service Requests",
      "description": "All maintenance and service request data",
      "category": "maintenance",
      "type": "standard",
      "is_pinned": true,
      "has_schedule": false,
      "last_run_at": "2026-03-14T10:30:00Z"
    }
  ],
  "meta": { "total": 42 }
}
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User role does not have report access

### 10.2 Run Report

**Generate Report Data**

```
POST /api/v1/reports/{reportId}/run
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | ISO date | Yes | Start of date range |
| end_date | ISO date | Yes | End of date range |
| filters | array | No | [{column, operator, value}] |
| sort | object | No | {column, direction} |
| group_by | string | No | Column to group by |
| page | integer | No | Page number (default: 1) |
| page_size | integer | No | Rows per page (default: 25, max: 100) |
| comparison | object | No | {enabled, compare_to, start_date, end_date} |

**Response**: `200 OK`

```json
{
  "data": {
    "columns": [
      {"key": "unit", "label": "Unit", "type": "string"},
      {"key": "category", "label": "Category", "type": "string"},
      {"key": "status", "label": "Status", "type": "enum"},
      {"key": "created_at", "label": "Created", "type": "datetime"}
    ],
    "rows": [...],
    "kpis": [
      {"label": "Total Requests", "value": 247, "change": 0.12, "period": "vs. last 30 days"}
    ],
    "comparison": {
      "current_total": 247,
      "previous_total": 220,
      "change_percent": 12.3
    },
    "meta": {
      "total_rows": 247,
      "page": 1,
      "page_size": 25,
      "total_pages": 10,
      "generation_time_ms": 340
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid date range, invalid filters
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Report not accessible to user role
- `404 Not Found`: Report does not exist
- `422 Unprocessable Entity`: Date range exceeds 365 days

### 10.3 Export Report

```
POST /api/v1/reports/{reportId}/export
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | Yes | 'csv', 'xlsx', or 'pdf' |
| filters | object | Yes | Same filter object as run endpoint |
| include_chart | boolean | No | Include chart in PDF (default: true) |

**Response**: `200 OK` with file download (Content-Disposition: attachment)

**Error Responses**:
- `400 Bad Request`: Invalid format
- `413 Payload Too Large`: Report exceeds 50,000 rows. Response body: `{"error": "Report exceeds maximum export size of 50,000 rows. Apply filters to reduce the data set."}`

### 10.4 Report Templates

**Save Template**

```
POST /api/v1/reports/{reportId}/templates
```

| Parameter | Type | Required | Max Length | Description |
|-----------|------|----------|-----------|-------------|
| name | string | Yes | 100 | Template name |
| description | string | No | 250 | Template description |
| filters | object | Yes | -- | Filter configuration |
| columns | array | Yes | -- | Column visibility and order |
| sort | object | No | -- | Sort configuration |
| group_by | string | No | -- | Group by column |
| is_shared | boolean | No | -- | Share with team (default: false) |

**Response**: `201 Created`

**Error Responses**:
- `400 Bad Request`: Missing required fields
- `409 Conflict`: Template name already exists for this user + report

**Delete Template**

```
DELETE /api/v1/reports/{reportId}/templates/{templateId}
```

**Response**: `204 No Content`

**Error Responses**:
- `403 Forbidden`: User does not own this template
- `404 Not Found`: Template does not exist

### 10.5 Report Schedules

**Create Schedule**

```
POST /api/v1/reports/{reportId}/schedules
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| frequency | string | Yes | 'daily', 'weekly', or 'monthly' |
| day_of_week | integer | Conditional | 0--6 (required if weekly) |
| day_of_month | integer | Conditional | 1--28 (required if monthly) |
| time | string | Yes | HH:MM format |
| timezone | string | Yes | IANA timezone |
| format | string | Yes | 'csv', 'xlsx', or 'pdf' |
| recipients | array | Yes | Array of user UUIDs (1--20) |
| email_subject | string | No | Custom subject (max 150 chars) |
| include_chart | boolean | No | Include chart in PDF |
| template_id | string | No | Use a saved template's filters |

**Response**: `201 Created`

**List Schedules**

```
GET /api/v1/reports/schedules
```

**Response**: `200 OK` with array of all active and paused schedules for the property.

**Update Schedule**

```
PATCH /api/v1/reports/{reportId}/schedules/{scheduleId}
```

**Delete Schedule**

```
DELETE /api/v1/reports/{reportId}/schedules/{scheduleId}
```

**Response**: `204 No Content`

### 10.6 Pin/Unpin Report

```
POST /api/v1/reports/{reportId}/pin
DELETE /api/v1/reports/{reportId}/pin
```

**Response**: `200 OK` (pin) / `204 No Content` (unpin)

### 10.7 Health Score

```
GET /api/v1/health-score
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | integer | No | Number of days of history (default: 30, max: 365) |

**Response**: `200 OK`

```json
{
  "data": {
    "current": {
      "score": 78,
      "maintenance": 82,
      "security": 75,
      "amenity": 80,
      "engagement": 70,
      "compliance": 85,
      "communication": 76,
      "ai_narrative": "Building health improved from 72 to 78...",
      "calculated_at": "2026-03-14T03:00:00Z"
    },
    "trend": [
      {"date": "2026-03-13", "score": 77},
      {"date": "2026-03-12", "score": 75}
    ]
  }
}
```

### 10.8 AI Endpoints

**Natural Language Query**

```
POST /api/v1/reports/ai/query
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Natural language query (max 500 chars) |

**Response**: `200 OK` with matched report, suggested filters, and confirmation prompt.

**Generate Summary**

```
POST /api/v1/reports/{reportId}/ai/summary
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| run_id | string | Yes | ID of the report run to summarize |

**Response**: `200 OK` with `{summary: string, generated_at: timestamp}`

**Root Cause Analysis**

```
POST /api/v1/reports/ai/root-cause
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| data_point | object | Yes | The anomalous data point |
| context | object | Yes | Surrounding data and metadata |

**Response**: `200 OK` with array of `{cause: string, likelihood: number, evidence: string[]}`

### 10.9 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Run report | 30 requests | Per minute per user |
| Export report | 10 requests | Per minute per user |
| AI query | 20 requests | Per minute per user |
| AI summary | 10 requests | Per minute per user |
| AI root cause | 5 requests | Per minute per user |
| Health score | 60 requests | Per minute per user |

---

## 11. Completeness Checklist

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 1 | 39+ pre-built report types across 8 categories | 3.1.1 | Defined (42 reports) |
| 2 | Date range filtering with 12 presets + custom | 3.2.2 | Defined |
| 3 | Grouping and sorting on all reports | 3.2.2, 3.2.4 | Defined |
| 4 | Export: CSV, Excel, PDF | 3.2.6 | Defined |
| 5 | Scheduled reports with email delivery (daily/weekly/monthly) | 3.4 | Defined |
| 6 | Saved report templates with share option | 3.3 | Defined |
| 7 | Role-based report access | 5.1--5.6 (user flows per role) | Defined |
| 8 | Custom report creation via wizard | 3.5 | Defined |
| 9 | Chart builder with 6 chart types | 3.2.5 | Defined |
| 10 | KPI cards with drill-down | 3.2.3 | Defined |
| 11 | Comparative analytics (period over period) | 3.6 | Defined |
| 12 | Building Health Score with 6 dimensions | 3.7 | Defined |
| 13 | AI: Natural Language Queries | 7.1 | Defined |
| 14 | AI: Executive Summary Generation | 7.2 | Defined |
| 15 | AI: Trend Narration | 7.3 | Defined |
| 16 | AI: Anomaly Highlighting | 7.4 | Defined |
| 17 | AI: Comparison Narratives | 7.5 | Defined |
| 18 | AI: Board Presentation Generation | 7.6 | Defined |
| 19 | AI: Predictive Analytics | 7.7 | Defined |
| 20 | AI: Root Cause Analysis | 7.8 | Defined |
| 21 | Every field: data type, max length, required, default, validation, error message | 3.2.2, 3.3.1, 3.4.1, 3.5 | Defined |
| 22 | Every button: action, success, failure, loading states | 3.1.4, 3.2.2, 3.2.6, 3.3.1, 3.4.1 | Defined |
| 23 | Responsive: desktop, tablet, mobile layouts | 6.2, 6.3 | Defined |
| 24 | Empty states with guidance | 6.4 | Defined |
| 25 | Loading states | 6.5 | Defined |
| 26 | Error states | 6.6 | Defined |
| 27 | Tooltips for complex features | 6.7 | Defined |
| 28 | Progressive disclosure | 6.1 | Defined |
| 29 | API endpoints with payloads and error responses | 10.1--10.8 | Defined |
| 30 | Rate limits | 10.9 | Defined |
| 31 | Notification templates for scheduled delivery and alerts | 9.1--9.3 | Defined |
| 32 | Data model with field types, constraints, and relationships | 4.1--4.6 | Defined |
| 33 | Report usage analytics (meta-reporting) | 8.1 | Defined |
| 34 | Data quality metrics | 8.2 | Defined |
| 35 | No competitor names referenced | All | Verified |

---

*End of PRD 10 -- Reports & Analytics*
