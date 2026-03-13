# Parking Management Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Parking Management module.

---

## Overview

**URL**: `/v2/mgmt/parking/default.aspx` (redirects to Issue Parking Permit)
**Interface**: Legacy ASP.NET rendered in iframe

The Parking Management module has **3 main tabs** and **5 sub-pages** under the Parking Permits tab.

### Main Tabs
1. **Parking Permits** (default)
2. **Vehicles**
3. **Parking Spaces**

### Parking Permits Sub-Navigation (5 links)
1. Issue New Permit
2. View Issued Permits
3. Permits Summary Report
4. Permit Types Setup
5. Permit Parking Areas Setup

---

## 1. Issue New Permit (Parking Permits Tab)

**URL**: `/v2/mgmt/parking/IssueParkingPermit.aspx`

**Description**: "On this page you can issue new parking permits."

### Issue Parking Permit Form

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Unit | Yes (Required) | Autocomplete text input | "Unit # or name" — search for unit |
| Active Permits | Display | Read-only | Shows count of active permits for selected unit |
| Permit Type | Yes (Required) | Radio buttons | Lists configured permit types with Instructions panel |
| Start Time | Yes (Required) | DateTime picker | Date + Time with calendar popup and time view popup icons. Default: current date/time (e.g., "3/13/2026 4:03 PM") |

### Permit Type Options (1 configured)
| # | Permit Type | Value ID |
|---|-------------|----------|
| 1 | Daily or Overnight Parking Permit | 6764 |

**Instructions Panel**: Green header "Instructions:" — displays per-permit-type instructions (empty for this property's permit type)

### Action Buttons (3)
| Button | Color | Action |
|--------|-------|--------|
| 💾 Create Permit | Green | Create permit without printing |
| 💾 Create and Print Permit | Green | Create permit and open print dialog |
| ✖ Cancel | Red | Cancel and return |

---

## 2. View Issued Permits (Parking Permits Tab)

**URL**: `/v2/mgmt/parking/ParkingPermits.aspx`

**Description**: "On this page you can view open and expired parking permits."

### Top Bar
- **+ Issue New Permit** button (green, top right)

### Search Filters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Unit # | Autocomplete text + "All" checkbox | ☑ All checked | "Unit # or name" — filter by unit |
| Permit Status | 5 color-coded checkboxes | ☑ Current only | Filter by permit status |
| Permit Types | Checkboxes | ☑ All Permit Types | Filter by permit type |
| Fee Status | 3 checkboxes | ☑ All | Filter by fee status |
| Permit Date | Date range + date type radios | Empty | From/To date pickers with date type |
| License Plate | Text input | Empty | "Plate Number:" search |
| Show Notes | Radio buttons | ◉ No | Toggle notes display in results |

### Permit Status Options (5, color-coded badges)
| # | Status | Badge Color | Default |
|---|--------|-------------|---------|
| 1 | Current | Blue | ☑ Checked |
| 2 | Future | Green | ☐ Unchecked |
| 3 | Expired | Orange | ☐ Unchecked |
| 4 | Terminated | Red | ☐ Unchecked |
| 5 | Voided | Grey | ☐ Unchecked |

### Permit Types Filter (2 options)
1. ☑ All Permit Types
2. ☐ Daily or Overnight Parking Permit

### Fee Status Filter (3 options)
1. ☑ All
2. ☐ No Fee
3. ☐ With Fee

### Permit Date Type Radios (3)
1. ◉ Issued Date (default)
2. ○ Start Date
3. ○ Expiration Date

### Show Notes Radios (2)
1. ◉ No (default)
2. ○ Yes

### Results Table Columns (13)
| # | Column | Description |
|---|--------|-------------|
| 1 | Permit ID | Unique permit identifier |
| 2 | Unit | Unit number |
| 3 | Family/Company Name | Resident/company name |
| 4 | Permit Type | Type of permit issued |
| 5 | Status | Current/Future/Expired/Terminated/Voided |
| 6 | Vehicle | Vehicle description |
| 7 | License Plate | Plate number |
| 8 | Area | Parking area assignment |
| 9 | Issued Date | When permit was issued |
| 10 | Start Date | When permit becomes active |
| 11 | Expire Date | When permit expires |
| 12 | Printed Date | When permit was printed |
| 13 | Fee | Fee amount |

### Results Actions
- Sortable columns (click column headers)
- **Print** button (green)
- **Export to Excel** button (green)
- "No records to display." when no results match filters

---

## 3. Permits Summary Report (Parking Permits Tab)

**URL**: `/v2/mgmt/parking/ParkingPermitSummaryReports.aspx`

**Description**: "On this page you can view a summarized report of parking permits issued for each unit."

### Report Filters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Permit Date | Date range + date type radios | From: 1/1/2026, To: 3/13/2026 | Date range filter |
| Subtotal by Permit Type | Yes/No radios | ◉ Yes | Break down by permit type |
| Include Units With No Fees | Yes/No radios | ◉ Yes | Include zero-fee units |
| Include Deactivated Units | Yes/No radios | ◉ No | Include deactivated units |
| Show Fees | Yes/No radios | ◉ Yes | Display fee amounts |
| Show Account# | Yes/No radios | ◉ Yes | Display account numbers |
| Include Inactive Permit Types | Yes/No radios | ◉ No | Include inactive permit types |

### Date Type Radios (3)
1. ◉ Issued Date (default)
2. ○ Start Date
3. ○ Expire Date

### Report Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Unit# | Unit number |
| 2 | Unit Name | Resident/company name |
| 3 | Account Number | Unit account number |
| 4 | Daily or Overnight Parking Permit Charges | Charges for this permit type |
| 5 | Daily or Overnight Parking Permit Count | Count of permits issued |
| 6 | Total Charges | Sum of all charges |
| 7 | Total Count | Sum of all permit counts |

**Note**: Columns 4-5 are dynamic — one pair per active permit type. Column headers include the permit type name.

### Report Actions
- **Search** button (blue)
- **Print** button (green)
- **Export to Excel** button (green)
- "Sorting is not supported on this summary report."
- "No records to display." when empty

---

## 4. Permit Types Setup (Parking Permits Tab)

**URL**: `/v2/mgmt/parking/ParkingPermitTypes.aspx`

**Description**: "Define the different Permit Types and rules you wish to make available."

### Top Bar
- **+ Add Permit Type** button (green, top right)

### Filter
- ☐ Include inactive permit types (checkbox)

### Permit Types Table Columns (4)
| # | Column | Description |
|---|--------|-------------|
| 1 | Name | Permit type name |
| 2 | Print Title | Title shown on printed permit |
| 3 | Concurrency Limit | Max active permits allowed |
| 4 | Create Date | When permit type was created |

### Observed Permit Types (1)
| Name | Print Title | Concurrency Limit | Create Date |
|------|-------------|-------------------|-------------|
| Daily or Overnight Parking Permit | Daily Parking Permit | Limited to 25 active permits | Mon 11/17/25 3:13 PM |

### Row Actions (2)
- ✏ **Edit** — Edit permit type configuration
- 🗑 **Deactivate** — Deactivate permit type

---

## 5. Permit Parking Areas Setup (Parking Permits Tab)

**URL**: `/v2/mgmt/parking/ParkingPermitLocations.aspx`

**Description**: "Define the different Permit Parking Areas you wish to make available."

### Top Bar
- **+ Add New Parking Area** button (green, top right)

### Filter
- ☐ Include inactive parking areas (checkbox)

### Areas Table Columns (2)
| # | Column | Description |
|---|--------|-------------|
| 1 | Area Name | Name of the parking area |
| 2 | Create Date | When area was created |

### Observed Data
- **0 parking areas configured** — "No records to display."

---

## 6. Vehicles Tab

**URL**: `/v2/mgmt/parking/Vehicles.aspx`

### Vehicle Search Filters

| Field | Type | Description |
|-------|------|-------------|
| Unit No. | Autocomplete text input + Clear link | "Unit # or name" |
| Garage Tag #/Ticket # | Text input | Search by garage tag or ticket number |
| License Plate No. | Text input | Search by license plate |
| Color | Text input | Search by vehicle color |
| Make | Text input | Search by vehicle make |
| Model | Text input | Search by vehicle model |
| Parking Location | Text input | Search by parking location/spot |
| Display Options | 2 checkboxes | Additional display filters |

### Display Options Checkboxes (2)
1. ☐ Include Inactive Vehicles
2. ☐ Show Comments

### Actions
- **Search** button (blue)
- **Print** button (green)
- **Export to Excel** button (green)
- **+ Add Vehicle** button (green)

### Results Table Columns (10)
| # | Column | Description |
|---|--------|-------------|
| 1 | Unit | "Unit [#] - [Name] / [Occupant names]" |
| 2 | Color | Vehicle color (e.g., Yellow, White, Silver, Black, Blue) |
| 3 | Make | Vehicle manufacturer (e.g., Chevy, Audi, Mini, Mazda, Volkswagon, Kia) |
| 4 | Model | Vehicle model (e.g., Camaro, Q3, Cx9, Cooper, 3, Taos, Forte) |
| 5 | Year | Vehicle year (e.g., 2021, 2018; many blank) |
| 6 | License Plate # | Plate number (e.g., CCWZ538, CVBD180, CTYS522) |
| 7 | State | Province/state (blank in observed data) |
| 8 | Parking Location | Assigned spot (e.g., R145, R10, R57, R42, R114, R28, R125, R133) |
| 9 | Garage Tag #/Ticket # | Tag/ticket number (blank in observed data) |

### Row Actions (2)
- **Edit** — Edit vehicle details
- 🗑 **Deactivate** — Deactivate vehicle record

### Pagination
- Page navigation: |< < 1 2 3 > >|
- Page size dropdown: 50 (configurable)
- Display: "Page 1 of 3, Items 1 to 50 of 126"

### Observed Data Summary
- **126 total vehicles** across 3 pages
- Parking locations follow pattern: R + number (R10, R28, R42, R57, R114, R125, R133, R145)
- Some units have multiple vehicles (e.g., Unit 202 has 2 vehicles, Unit 210 has 2+ vehicles)
- Some vehicles have multiple license plates (e.g., Unit 206: "CRVC102, CFJT079, NULL")
- Color values observed: Yellow, White, Silver, Black, Blue, Red/Blue/Null, Dark Silver
- Makes observed: Chevy, Audi, Mini, Mazda, Volkswagon, Kia
- Year field often empty — not required
- State field empty for all observed records (likely Canadian plates don't use state codes)

---

## 7. Parking Spaces Tab

**URL**: `/v2/mgmt/parking/ParkingSpaces.aspx`

### Parking Space Search Filters

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Categories | Checkboxes + clear all/check all links | ☑ Indoor Parking, ☑ Outdoor Parking | Filter by parking category |
| Group By | Radio buttons (7 options) | ◉ No Grouping | Grouping mode for results |
| Status | Radio buttons (3 options) | ◉ All | Filter by assignment status |
| Unit # | Autocomplete text + Clear link | Empty | Filter by unit |
| Text Search | Text input + 5 field checkboxes | Empty | Free text search across selected fields |
| Include Deactivated Units | Yes/No radios | ◉ No | Include deactivated units |

### Categories Checkboxes (2)
1. ☑ Indoor Parking
2. ☑ Outdoor Parking
- **clear all** / **check all** links

### Group By Radio Buttons (7)
1. ◉ No Grouping (default)
2. ○ Sub Group
3. ○ Space#
4. ○ Type
5. ○ Location
6. ○ Link
7. ○ Asset Tag
8. ○ Floor

### Status Radio Buttons (3)
1. ◉ All (default)
2. ○ Assigned
3. ○ Unassigned

### Text Search Field Checkboxes (5)
1. ☑ Space#
2. ☑ Type
3. ☑ Location
4. ☑ Asset Tag
5. ☑ Notes

### Actions
- **Search** button (blue)
- **Advanced Search** button (blue, outlined)
- **Print** button (green)
- **Export to Excel** button (green)
- **+ Add New** button (green)

### Results Table Columns (10)
| # | Column | Description |
|---|--------|-------------|
| 1 | Sub Group | Parking sub-group |
| 2 | Space# | Space number/identifier |
| 3 | Type | Space type (indoor/outdoor/etc.) |
| 4 | Location | Physical location |
| 5 | Link | Linked unit |
| 6 | Start Date | Assignment start date |
| 7 | End Date | Assignment end date |
| 8 | Asset Tag | Asset tracking tag |
| 9 | Notes | Additional notes |
| 10 | (Actions) | Implied action column |

### Table Features
- "Right-click on any column header for filtering, sorting, and grouping options."
- Sortable and groupable columns

### Observed Data
- **0 parking spaces configured** — "There are no Parking Space configured for this Building."

---

## Observed Data Summary

### Overall Parking Module Stats
| Metric | Value |
|--------|-------|
| Permit Types Configured | 1 (Daily or Overnight Parking Permit) |
| Parking Areas Configured | 0 |
| Parking Spaces Configured | 0 |
| Vehicles Registered | 126 (across 3 pages) |
| Active Permits | 0 (no records found with Current filter) |
| Concurrency Limit | 25 active permits max |

### Vehicle Data Patterns
- Parking locations use "R" prefix + number (suggesting indoor/reserved spots)
- Location numbers range from R10 to R145+
- Not all vehicles have year or state data
- Multiple vehicles per unit supported
- Multiple license plates per vehicle supported (comma-separated)

---

## Concierge Design Implications

### From Parking Management Deep Dive
1. **3-tab architecture** works well — Permits, Vehicles, Spaces are logically separate concerns
2. **5-status permit lifecycle**: Current → Future → Expired → Terminated → Voided — more nuanced than reservations
3. **Concurrency limits** per permit type (25 active permits) — critical for visitor parking management
4. **Print permit** as first-class action — dedicated "Create and Print" button alongside "Create"
5. **Fee tracking** throughout — Fee Status filter, Show Fees toggle, charges in summary report
6. **Summary report** with dynamic columns per permit type — useful for accounting/billing
7. **Vehicle registry** is comprehensive — 10 columns including color, make, model, year, plate, parking location
8. **126 vehicles** for 171 units shows high vehicle-to-unit ratio — parking management is critical for this property
9. **Parking spaces** module exists but unused — suggests optional feature for properties with assigned parking
10. **7 grouping modes** for parking spaces — No Grouping, Sub Group, Space#, Type, Location, Link, Asset Tag, Floor
11. **Asset tag tracking** on parking spaces — connects to Asset Manager module
12. **Multiple license plates** per vehicle — handles cases where residents have personalized/seasonal plates
13. **Garage tag/ticket tracking** — for properties with automated parking gates
14. **Export to Excel** on every listing page — consistent pattern across the platform
15. **Date type flexibility** — search by Issued Date, Start Date, or Expiration Date
