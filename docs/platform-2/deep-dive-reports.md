# Reports/Data Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Reports/Data module.

---

## Overview

**Access**: Sidebar > Reports/Data
**Sub-pages (3)**:
1. **Home** — `/v2/mgmt/dashboard/reportshome.aspx`
2. **Analytics** — `/v2/Mgmt/Reports/Metricshome.aspx`
3. **Reports** — `/v2/mgmt/Reports/ReportsWithDataGrid.aspx`
4. **Download data** — `/reports/staff/download-data/download-unit-profile-data` (Modern SPA)

The Reports/Data module is the central hub for data analytics, report generation, and data export.

---

## 1. Reports/Data Home Dashboard

**URL**: `/v2/mgmt/dashboard/reportshome.aspx`

### Section 1: BuildingLink Data
**Description**: "BuildingLink offers a complete set of features for managing all aspects of a building operation."

| # | Link | Description |
|---|------|-------------|
| 1 | Analytics | Report viewer with categorized report tree |
| 2 | Reports | Standard report generation with data grids |
| 3 | Download Data | Bulk data export tool (Modern SPA) |

### Section 2: External Data (Beta)
- **Status**: "There are no external data sources configured for you building."
- **Note**: Beta feature — suggests upcoming integration with external data sources

### Section 3: Aware! by BuildingLink - Sensor Data
- **Status**: "No current sensor solutions have been configured."
- **Note**: IoT/sensor integration module — supports smart building features
- **Product**: "Aware!" is BuildingLink's IoT sensor platform for building monitoring

---

## 2. Analytics

**URL**: `/v2/Mgmt/Reports/Metricshome.aspx`

### Layout
- **Left panel**: Report category tree (expandable/collapsible folders)
- **Right panel**: Report viewer/output area

### Report Tree Categories (4 top-level)

| # | Category | Description |
|---|----------|-------------|
| 1 | Event Log | Analytics related to front desk events, package tracking, deliveries |
| 2 | Maintenance | Maintenance request metrics and trends |
| 3 | Reservations | Amenity booking analytics |
| 4 | Units/Occupants | Occupancy, move-in/out, and unit-related analytics |

**Key observations**:
- Each category is an expandable folder in the left tree panel
- Clicking a report loads the report viewer in the right panel with parameter controls
- Report viewer includes standard export capabilities (Excel, PDF)
- Legacy ASP.NET page (iframe-based)

---

## 3. Reports

**URL**: `/v2/mgmt/Reports/ReportsWithDataGrid.aspx`

### Layout
- **Left panel**: Report category tree (similar to Analytics)
- **Right panel**: Data grid report viewer with filtering and export

### Report Viewer Features
- Standard report viewer with parameter selection
- Data grid display with sortable columns
- Export capabilities to various formats (Excel, PDF)
- Date range filters on applicable reports

---

## 4. Download Data (Modern SPA)

**URL**: `/reports/staff/download-data/download-unit-profile-data` (entry point)
**Back link**: "< Back to reports" (navigates to Reports/Data home)

### Tabs (9 total)

The Download Data module has 9 tabs. Some render within the SPA, others redirect to legacy ASP.NET pages or other SPA pages.

| # | Tab | Architecture | URL |
|---|-----|-------------|-----|
| 1 | Unit profile data | SPA (in-page) | `/reports/staff/download-data/download-unit-profile-data` |
| 2 | Occupant data | Legacy redirect | `/v2/mgmt/export/UserExport.aspx` |
| 3 | Employee data | Legacy redirect | `/v2/mgmt/export/EmployeeExport.aspx` |
| 4 | Maintenance requests | SPA (in-page) | `/reports/staff/download-data/download-maintenance-requests` |
| 5 | Maintenance requests actions | SPA (in-page) | `/reports/staff/download-data/download-maintenance-actions` |
| 6 | Event log | SPA redirect | `/event-log/staff/event-log-advanced-search` |
| 7 | Event type rules | Legacy redirect | `/v2/mgmt/export/EventTypeRulesSearch.aspx` |
| 8 | Front desk instructions | SPA redirect | `/front-desk-instructions/staff/instruction-search` |
| 9 | Survey results | Legacy redirect | `/v2/mgmt/export/SurveySearch.aspx` |

---

### Tab 1: Unit Profile Data (SPA)

**URL**: `/reports/staff/download-data/download-unit-profile-data`

#### Field Groups (3 checkbox groups)
| # | Group | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Primary unit profile fields | Checkbox | ☑ Checked (locked) | Core unit data — always included |
| 2 | Alt mailing address | Checkbox | ☐ Unchecked | Include alternate mailing addresses |
| 3 | Advanced fields | Checkbox | ☐ Unchecked | Include extended/advanced fields |

#### Filters
| # | Filter | Type | Default | Description |
|---|--------|------|---------|-------------|
| 1 | Move-In date | Date range picker | mm/dd/yyyy–mm/dd/yyyy | Filter by move-in date range |

#### Options (3 checkboxes)
| # | Option | Default | Description |
|---|--------|---------|-------------|
| 1 | Insert building address if alt mailing address is blank | ☐ | Auto-fill building address as fallback |
| 2 | Include deactivated units | ☐ | Include inactive/decommissioned units |
| 3 | Include custom fields | ☐ | Include custom field data in export |

#### Action
- **Export Excel** button (green with Excel icon)

---

### Tab 2: Occupant Data (Legacy Redirect)

**URL**: `/v2/mgmt/export/UserExport.aspx`
**Title**: "Data Download - Occupants"

#### Selection Options

##### Section: Scope
| # | Field | Type | Options | Default |
|---|-------|------|---------|---------|
| 1 | Export Scope | Radio buttons (3) | Current Residents / Previous Residents (moved out) / Both Current and Previous | Current Residents |

##### Section: Data Fields
| # | Checkbox Group | Description |
|---|---------------|-------------|
| 1 | Primary fields | Core occupant data (name, unit, type) — always included |
| 2 | Contact information | Phone numbers, email addresses |
| 3 | Move-in/out dates | Residency date range |
| 4 | Custom fields | Custom-defined fields for this property |
| 5 | Alt mailing address | Alternate mailing addresses |
| 6 | Emergency contacts | Emergency contact information |

#### Actions
- **< Back** button
- **Export To Excel** button (green with Excel icon)

---

### Tab 3: Employee Data (Legacy Redirect)

**URL**: `/v2/mgmt/export/EmployeeExport.aspx`
**Title**: "Data Download - Employees"

#### Selection Options
| # | Field | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Include Inactive Employees? | Radio buttons | ◉ No | Yes/No — include deactivated employee records |

#### Actions
- **< Back** button
- **Export To Excel** button (green with Excel icon)

**Key observation**: Simple export with minimal options — just active/inactive filter

---

### Tab 4: Maintenance Requests (SPA)

**URL**: `/reports/staff/download-data/download-maintenance-requests`

#### Filters
| # | Filter | Type | Default | Description |
|---|--------|------|---------|-------------|
| 1 | Created date range | Date range picker | mm/dd/yyyy–mm/dd/yyyy | Filter by request creation date |
| 2 | Category | Dropdown | All categories | Filter by maintenance category |
| 3 | Status | Multi-select dropdown | (badge count visible) | Filter by request status |
| 4 | Priority | Dropdown | All priorities | Filter by priority level |

#### Options
| # | Option | Type | Default | Description |
|---|--------|------|---------|-------------|
| 1 | Include deactivated units | Checkbox | ☐ | Include requests from inactive units |

#### Action
- **Export Excel** button (green with Excel icon)

---

### Tab 5: Maintenance Requests Actions (SPA)

**URL**: `/reports/staff/download-data/download-maintenance-actions`

#### Filters
| # | Filter | Type | Default | Description |
|---|--------|------|---------|-------------|
| 1 | Action date range | Date range picker | mm/dd/yyyy–mm/dd/yyyy | Filter by action date |
| 2 | Category | Dropdown | All categories | Filter by maintenance category |
| 3 | Status | Multi-select dropdown | (badge count visible) | Filter by request status |

#### Options
| # | Option | Type | Default | Description |
|---|--------|------|---------|-------------|
| 1 | Include deactivated units | Checkbox | ☐ | Include actions from inactive units |

#### Action
- **Export Excel** button (green with Excel icon)

---

### Tab 6: Event Log (SPA Redirect)

**URL**: `/event-log/staff/event-log-advanced-search`
**Behavior**: Redirects from Download Data to the Event Log Advanced Search page (Modern SPA)

This tab does NOT show an export form within Download Data. Instead, it opens the full Event Log Advanced Search interface, which has its own export capability.

**Note**: The Event Log Advanced Search is documented in detail in `deep-dive-front-desk.md`.

---

### Tab 7: Event Type Rules (Legacy Redirect)

**URL**: `/v2/mgmt/export/EventTypeRulesSearch.aspx`
**Title**: "Data Download - Event Type Rules"

#### Selection Options
| # | Field | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Include Inactive Event Types? | Radio buttons | ◉ No | Yes/No — include deactivated event types |

#### Actions
- **< Back** button
- **Export To Excel** button (green with Excel icon)

**Key observation**: Simple export — mirrors the Employee Data pattern with single active/inactive filter

---

### Tab 8: Front Desk Instructions (SPA Redirect)

**URL**: `/front-desk-instructions/staff/instruction-search`
**Title**: "Search front desk instructions"
**Back link**: "< Back to instructions grid"

This tab does NOT show an export form within Download Data. Instead, it opens the full Front Desk Instructions search page with its own export capability.

#### Search Controls
| # | Control | Type | Description |
|---|---------|------|-------------|
| 1 | Search | Text input | "Search unit or instruction text" |
| 2 | Search button | Button (teal) | Execute search |
| 3 | Date range | Dropdown | Filter by date range |
| 4 | Status | Dropdown (with badge "2") | Filter by instruction status |
| 5 | All instruction types | Dropdown | Filter by instruction type |

#### Checkboxes
| # | Option | Default | Description |
|---|--------|---------|-------------|
| 1 | Exact match only (for Unit # search) | ☐ | Strict unit number matching |
| 2 | Include deactivated units | ☐ | Include instructions for inactive units |

#### Results Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Start Date | When the instruction became active |
| 2 | End Date | Expiration date ("No Expiration Date" if permanent) |
| 3 | Status | Current/Expired/etc. (color-coded badge) |
| 4 | Unit # | Unit number and occupant name (e.g., "212 Guzman / Santo") |
| 5 | Instruction Type | Type category (e.g., "Housekeeper/Dogwalker etc", "Pass-On Log") |
| 6 | Entered by | Staff member who created the instruction |
| 7 | Instruction | Full instruction text |

#### Observed Data (4 instructions)
| Start Date | End Date | Status | Unit # | Type | Entered by |
|------------|----------|--------|--------|------|------------|
| 10/27/2025 | No Expiration Date | Current | 212 Guzman / Santo | Housekeeper/Dogwalker etc | Alejandra Guzman |
| 1/30/2025 | No Expiration Date | Current | 523 Dhondup / Youdon | Pass-On Log | Gledis Xhoxhi |
| 1/30/2025 | No Expiration Date | Current | 527 Juodis | Pass-On Log | Gledis Xhoxhi |
| 1/28/2025 | No Expiration Date | Current | 212 Guzman / Santo | Pass-On Log | Alejandra Guzman |

#### Actions
- **Export to Excel** button (green, top right)
- **Add instruction** button (top right)
- **Items per page**: Dropdown (default 25)
- **Pagination**: Available at bottom

---

### Tab 9: Survey Results (Legacy Redirect)

**URL**: `/v2/mgmt/export/SurveySearch.aspx`
**Title**: "Data Download - Survey Questions"

#### Instructions
"Click on the Survey Question for which you want to download the Responses"

#### Current State
**Empty**: "There are no Survey Questions for this Building."

**Key observation**: No surveys have been created for this property. When surveys exist, this page would list them as clickable links to download response data.

---

## Download Data — Architecture Summary

The 9 Download Data tabs use 3 different architectural patterns:

| Pattern | Tabs | Description |
|---------|------|-------------|
| **SPA in-page** | Unit profile data, Maintenance requests, Maintenance requests actions | Content renders within the Download Data SPA page with filters and Export Excel button |
| **SPA redirect** | Event log, Front desk instructions | Navigates to a different modern SPA page with full search/export capability |
| **Legacy redirect** | Occupant data, Employee data, Event type rules, Survey results | Navigates to legacy ASP.NET pages (`/v2/mgmt/export/...`) with simple export forms |

---

## Concierge Design Implications

### From Reports/Data Deep Dive
1. **3-tier data access**: Analytics (visual reports), Reports (data grids), Download Data (raw export) — covers all reporting needs
2. **External Data (Beta)** — forward-looking integration with external data sources; Concierge should plan API-first
3. **Aware! Sensor platform** — IoT integration for smart building monitoring (leak detection, temperature, humidity, etc.)
4. **9 export categories** in Download Data — comprehensive data portability
5. **Hybrid SPA/legacy architecture** — Download Data uses 3 different patterns (in-page SPA, SPA redirect, legacy redirect); Concierge should unify all exports into a single consistent interface
6. **Data export is critical** — properties need to extract data for board meetings, audits, compliance
7. **4 analytics report categories** — Event Log, Maintenance, Reservations, Units/Occupants
8. **Simple vs. complex export forms** — Employee data and Event type rules have just one filter (active/inactive), while Maintenance has rich multi-filter forms; Concierge should provide consistent filter richness
9. **Redirect pattern for search-heavy modules** — Event log and Front desk instructions redirect to their full search pages rather than providing a simplified export form
10. **Survey results tied to survey creation** — no surveys = no export available; export depends on Communicate > Survey module
11. **3 scopes for occupant export** — Current, Previous (moved out), Both — important for historical reporting
12. **Custom fields exportable** — Unit profile data can include custom fields, showing the extensibility of the data model
13. **Date range filtering** — consistent pattern across SPA tabs for time-scoped exports
14. **No scheduled exports** — all exports are manual/on-demand; Concierge should add scheduled/automated report delivery
15. **Excel-only export format** — no CSV, PDF, or other formats offered; Concierge should support multiple formats
