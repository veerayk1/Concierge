# Reports — Granular Deep Dive

Field-level documentation of every element in Condo Control's Reports module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/reportV2/reports/`
**Sidebar menu**: Reports (clipboard icon)
**Breadcrumb**: Home > Reports (on list page); Home > Reports > {Report Name} (on report viewer)
**Page title**: "Reports | Condo Control"

The Reports module provides pre-built and custom reports with a paginated report viewer, parameter-based filtering, and multi-format export. Built on **Telerik Reporting** viewer component.

**Role access**: Security & Concierge has **full read access** — can view, run, and export all standard reports. Can favourite reports. Can run reports with parameter filters.

**Important access note**: During testing, navigating to `/reportV2/reports/` was observed to redirect to the Home dashboard (`/my/my-home`) for the Security & Concierge role in some sessions. This may be a session-state-dependent behavior or a role configuration that varies by property. When accessible, the full reports module is available as documented below.

---

## 2. Reports List Page

**URL**: `/reportV2/reports/`

### 2.1 Info Banner

| # | Element | Description |
|---|---------|-------------|
| 1 | Banner | Light blue/teal background. Text: "Welcome to our new reports! Click here to watch a short demo" |
| 2 | Demo link | "Click here to watch a short demo" — teal underlined link |

### 2.2 Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Icon | Clipboard/report icon (teal, circular) |
| 2 | Title | "Reports" — large heading |

### 2.3 Tabs

| # | Tab | URL Hash | Default | Description |
|---|-----|----------|---------|-------------|
| 1 | Standard Reports | `#tab-1` | Yes (active) | Pre-built reports organized by category |
| 2 | Custom Reports | `#tab-2` | No | User-created reports (empty for this role) |
| 3 | Favourite Reports | `#tab-3` | No | Reports marked as favourite by the user |

### 2.4 Search Bar

| # | Field | Type | Placeholder | Description |
|---|-------|------|-------------|-------------|
| 1 | Search | Text input | "Search" | Free-text search with magnifying glass icon (right-aligned). Filters reports by name |

---

## 3. Standard Reports Tab

**Tab**: `#tab-1` (default)

Reports are organized into **3 categories** with section headings. Each category has a teal circular icon.

### 3.1 Report Table Structure

Each category section contains a table with:

| # | Column | Description |
|---|--------|-------------|
| 1 | (icons) | Two icons per row: chart icon (📊 teal) for "Run" and star icon (☆ grey outline / ★ gold filled) for "Favourite" |
| 2 | Name | Report name text |
| 3 | Description | Report description text |

**Table header style**: Grey background, bold text ("Name", "Description").

**Icon behavior**:
- **Chart icon (📊)**: Links to `/reportV2/run-report/{reportId}` — runs the report
- **Star icon (☆/★)**: Toggles favourite status. Grey outline = not favourited; gold filled = favourited. Favourited reports appear in the Favourite Reports tab

### 3.2 Category 1: Amenity Booking & Payments

| # | Report Name | Report ID | Description |
|---|------------|-----------|-------------|
| 1 | Amenity Online Payments | 62 | Report provides details on the amenity bookings paid by credit cards. |
| 2 | Amenity Usage | 61 | Report provides amenity usage |

### 3.3 Category 2: Security & Concierge

| # | Report Name | Report ID | Description |
|---|------------|-----------|-------------|
| 1 | Incident Report Activity | 47 | Summary of incident report activity |
| 2 | Incident Report Details | 28 | List of incident report details within a given period |
| 3 | Key Checkouts | 22 | List of master key checkout details |
| 4 | Keys | 27 | List of permanent and temporary keys |
| 5 | Package Details | 20 | List of package details |
| 6 | Parking Permits | 19 | List of active visitor parking permits |
| 7 | Pass-on Logs | 23 | List of pass-on log details |
| 8 | Security & Concierge Activity Summary | 97 | Report provides summary of all the activities in Security & Concierge |
| 9 | Security Log Details | 26 | Details of security shifts and logs |
| 10 | Security Log Summary | 25 | Summary of security shifts and logs |
| 11 | Unit Entries | 21 | List of authorized unit entry details |
| 12 | Visitor Details | 18 | List of visitors and their parking permit details |

### 3.4 Category 3: Unit File

| # | Report Name | Report ID | Description |
|---|------------|-----------|-------------|
| 1 | Authorizations | 14 | List of authorizations for units |
| 2 | Buzzer Codes | 13 | List of buzzer code details |
| 3 | Common Elements | 8 | List of all unit common element details |
| 4 | Electronic Consent | 63 | List of all residents who have *or have not* signed up for electronic consent. |
| 5 | Emergency Contacts | 5 | List of users' emergency contact details |
| 6 | FOBs, Keys and Remotes | 7 | List of FOB, remote and key details |
| 7 | Individuals Requiring Assistance | 6 | List of users requiring assistance |
| 8 | Lease Details | 15 | List of unit lease details |
| 9 | Mailing Addresses | 2 | List of units with the users' names and mailing addresses |
| 10 | Notes | 4 | List of unit notes |
| 11 | Parcel Waivers | 3 | List of parcel waiver details |
| 12 | Pets | 9 | List of pet details |
| 13 | Phone Numbers and Emails | 1 | List of units and users with their emails and phone numbers |
| 14 | Special consent document | 157 | List of all residents who have *or have not* signed up for electronic document signing. |
| 15 | Unit History Records | 16 | List of all updates made to units |
| 16 | Unit Types | 24 | List of unit types and numbers of units of each type |
| 17 | Unsubscribed Users | 10 | List of users unsubscribed from emails |
| 18 | User Badge Scans | 1834 | Report provides a summary of badges scanned through mobile app |
| 19 | User Badges | 769 | List of user badges |
| 20 | User History Records | 17 | List of all updates made to users |
| 21 | User Logins | 46 | User login statistics |
| 22 | User Notes | 158 | List of user notes |
| 23 | User Registration | 492 | Report that shows a table of users that have registered and when they registered. |
| 24 | Vacations | 12 | List of user vacation details |
| 25 | Vehicles and Parking Allocations | 11 | List of vehicles with their parking spots |

**Total Standard Reports**: 39 (2 + 12 + 25)

---

## 4. Custom Reports Tab

**Tab**: `#tab-2`

### 4.1 Layout

Same search bar as Standard Reports tab.

**Empty state**: "There are no custom reports."

**Observed**: No custom reports exist for this role/property. The feature exists for creating user-defined reports, but none have been created.

**Hidden modals found in DOM**:
- "Are you sure you want to delete this report?" — confirmation dialog for custom report deletion
- "Edit report" — modal for editing custom reports

---

## 5. Favourite Reports Tab

**Tab**: `#tab-3`

### 5.1 Layout

Same table structure as Standard Reports but without category sections. Shows only reports the user has starred.

### 5.2 Observed Favourites

| # | Report Name | Report ID | Description |
|---|------------|-----------|-------------|
| 1 | Security Log Details | 26 | Details of security shifts and logs |

**Star icon**: Gold/yellow filled star (★) indicates favourited status.

**Behaviour**: Reports are added to favourites by clicking the star icon (☆ → ★) on the Standard Reports tab. Unfavouriting removes them from this tab.

---

## 6. Report Viewer Page

**URL**: `/reportV2/run-report/{reportId}`
**Example**: `/reportV2/run-report/25` (Security Log Summary)
**Breadcrumb**: Home > Reports > {Report Name}
**Page title**: "{Report Name} | Condo Control"

The report viewer is a **Telerik Reporting HTML5 Viewer** component with a toolbar, paginated report canvas, and a parameters sidebar.

### 6.1 Report Page Title

| # | Element | Description |
|---|---------|-------------|
| 1 | Report name | H1-level heading (e.g., "Security Log Summary") |

### 6.2 Toolbar (Top)

| # | Button | Icon | Description |
|---|--------|------|-------------|
| 1 | First Page | ⏮ | Navigate to first page |
| 2 | Previous Page | ◀ | Navigate to previous page |
| 3 | Page selector | Dropdown | "1 of 24" format. Dropdown to jump to specific page |
| 4 | Next Page | ▶ | Navigate to next page |
| 5 | Last Page | ⏭ | Navigate to last page |
| 6 | Zoom Out | ➖ | Decrease zoom level |
| 7 | Zoom selector | Dropdown | Default: "Whole Page". Options likely include percentage zoom and page-fit modes |
| 8 | Zoom In | ➕ | Increase zoom level |
| 9 | Highlight Editing Fields | Pencil/form icon | Highlights editable fields in the report (if any) |
| 10 | Print | Printer icon | Print entire report |
| 11 | Print Page | Single page printer icon | Print current page only |
| 12 | Export To | Upload/share icon ▾ | Dropdown menu with export format options (see §6.3) |
| 13 | Search | Magnifying glass icon | Search within report content |
| 14 | Full Screen | Expand icon | Toggle full-screen report view |

### 6.3 Export Formats

Dropdown menu from the "Export To" toolbar button. **10 export formats**:

| # | Format | File Type | Description |
|---|--------|-----------|-------------|
| 1 | PDF | .pdf | Adobe PDF |
| 2 | XLS | .xls | Excel 97-2003 |
| 3 | XLSX | .xlsx | Excel 2007+ |
| 4 | RTF | .rtf | Rich Text Format |
| 5 | DOCX | .docx | Word 2007+ |
| 6 | MHT | .mht | Web Archive (MIME HTML) |
| 7 | HTML | .html | Web page |
| 8 | Text | .txt | Plain text |
| 9 | CSV | .csv | Comma-separated values |
| 10 | Image | .png/.jpg | Image export |

### 6.4 Right Sidebar Icons

| # | Button | Icon | Description |
|---|--------|------|-------------|
| 1 | Parameters | Filter funnel (🔽) | Toggle the PREVIEW PARAMETERS panel |
| 2 | Export Options | Gear (⚙) | Report export/rendering settings |
| 3 | Search | Magnifying glass (🔍) | Search within report |

### 6.5 Preview Parameters Panel

Opened via the Parameters (funnel) button on the right sidebar. Panel title: "PREVIEW PARAMETERS".

**Parameters for Security Log Summary** (report ID 25):

| # | Parameter | Type | Default | Description |
|---|-----------|------|---------|-------------|
| 1 | Filter By Shift Da... | Dropdown | "This week" | Filter by shift date range. Full label likely "Filter By Shift Date" |
| 2 | ... Since: | Date picker | (none) | Custom start date. Calendar icon button for date picker |
| 3 | ... Until: | Date picker | (none) | Custom end date. Calendar icon button for date picker |
| 4 | Filter By Guards: | Multi-select | "All selected (9)" | Filter by specific security guards. Shows count of selected items. "S." tag visible = search/filter capability |

**Action buttons**:

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | RESET | Grey outlined | Reset parameters to defaults |
| 2 | SUBMIT | Dark/primary | Apply parameters and regenerate report |

**Note**: Parameters vary by report. Security Log Summary has 4 parameters. Other reports will have different parameter sets relevant to their data.

### 6.6 Report Canvas

The main report area renders a paginated, print-ready document with:

| # | Element | Description |
|---|---------|-------------|
| 1 | Property header | "M.T.C.C. 872" — top-left of report |
| 2 | Report title | Center heading (e.g., "Security Log Summary") |
| 3 | Filter summary | Shows active filter values (e.g., "Shift Date: This week", "Guards: All") |
| 4 | Report content | Tabular data with headers, rows, and detail sections |

**Security Log Summary report content structure**:

**Shift header row**:
| Field | Example Value |
|-------|---------------|
| Shift #: | 2312 |
| Shift Creator: | Concierge, Temp |
| Start Time: | 03/08/2026 12:00 AM |
| End Time: | 03/08/2026 12:00 PM |
| Guard Relieved: | Concierge, Temp |
| To be Relieved By: | Concierge, Temp |

**Security Logs table**:
| Column | Description |
|--------|-------------|
| Urgency | Log urgency level |
| Type | Log type |
| Logged Time | When the log was created |
| Security Guard | Who created the log |
| Details | Full log text content |
| Occurred Time | When the event occurred |

---

## 7. Data Model Observations

### 7.1 Report Entity

| Field | Type | Description |
|-------|------|-------------|
| ReportId | Integer | Unique identifier (e.g., 1-1834, non-sequential) |
| Name | String | Report display name |
| Description | String | Report description text |
| Category | String | Report category grouping (Amenity Booking & Payments, Security & Concierge, Unit File) |
| Type | Enum | Standard or Custom |
| IsFavourite | Boolean | Whether the current user has starred this report |
| Parameters | Array | Report-specific filter parameters |

### 7.2 Report ID Ranges

| ID Range | Observation |
|----------|-------------|
| 1-28 | Original core reports (Phone Numbers, Mailing Addresses, etc.) |
| 46-63 | Second generation reports (User Logins, Incident Report Activity, etc.) |
| 97-158 | Third generation (Activity Summary, Special consent, User Notes) |
| 492 | User Registration (standalone addition) |
| 769 | User Badges (standalone addition) |
| 1834 | User Badge Scans (most recent addition, mobile app feature) |

Non-sequential IDs indicate reports were added over time as features evolved.

### 7.3 Report Categories

| Category | Icon | Report Count | Focus |
|----------|------|-------------|-------|
| Amenity Booking & Payments | Teal circle | 2 | Amenity usage and payment data |
| Security & Concierge | Teal circle | 12 | Security operations, incidents, keys, packages, visitors |
| Unit File | Teal circle | 25 | Resident data, unit data, access devices, compliance |

---

## 8. URL Map

| Page | URL Pattern |
|------|-------------|
| Reports list | `/reportV2/reports/` |
| Standard Reports tab | `/reportV2/reports/#tab-1` |
| Custom Reports tab | `/reportV2/reports/#tab-2` |
| Favourite Reports tab | `/reportV2/reports/#tab-3` |
| Run report | `/reportV2/run-report/{reportId}` |

---

## 9. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Comprehensive report library** — 39 standard reports across 3 categories. Covers all major operational areas
2. **Telerik Reporting viewer** — Professional report viewer with pagination, zoom, search, and print capabilities
3. **10 export formats** — PDF, XLS, XLSX, RTF, DOCX, MHT, HTML, Text, CSV, Image. Excellent coverage for any downstream use case
4. **Parameterized reports** — Reports accept filter parameters (date ranges, guard selection, etc.) with a dedicated sidebar panel
5. **Favourite system** — Star icon to favourite frequently-used reports. Separate "Favourite Reports" tab for quick access
6. **Multi-select parameters** — Guard filter shows "All selected (9)" with multi-select capability
7. **Report search** — Search bar on list page filters reports by name. Search within report content on viewer page
8. **Custom reports support** — Tab exists for custom/user-created reports. Platform-level feature even if not used at this property
9. **Category organization** — Reports grouped by functional area (Amenity, Security, Unit File). Easy to find relevant reports
10. **Print capabilities** — Both "Print" (full report) and "Print Page" (current page) options

### What CondoControl Gets Wrong
1. **No report scheduling** — Cannot schedule reports to run automatically and be emailed. Must run manually each time
2. **No report preview/summary on list page** — Only name and description. No thumbnail, last-run date, or data freshness indicator
3. **Report IDs in URL are sequential integers** — `/run-report/25` exposes internal IDs. Could allow enumeration
4. **Parameter labels truncated** — "Filter By Shift Da..." is cut off. Panel width too narrow for full labels
5. **No recent/last-run reports** — No "Recently Run" section. Must navigate to the report each time
6. **Demo banner takes permanent space** — "Welcome to our new reports!" banner has no dismiss button. Wastes vertical space
7. **No data preview before running** — Must run the full report to see any data. No quick preview or row count
8. **Category icons are identical** — All 3 categories use the same teal circle icon. Should use distinct icons (calendar for amenity, shield for security, building for unit file)
9. **No date on reports** — Cannot see when a report was last generated or when data was last refreshed
10. **Custom Reports tab empty with no guidance** — Shows "There are no custom reports" but no button or link to create one (may be role-restricted)
11. **Inconsistent report naming** — Some start with "List of..." (Unit File reports), others start with "Report provides..." (Amenity reports), others start with "Summary of..." or "Details of..." (Security reports). No naming convention

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~280+*
