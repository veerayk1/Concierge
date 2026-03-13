# Reports/Data Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Reports/Data module.

---

## Overview

**URL**: `/v2/mgmt/dashboard/reportshome.aspx`

The Reports/Data module is the central hub for data analytics, report generation, and data export. It contains 3 main sections with links to sub-modules.

---

## 1. Reports/Data Home Dashboard

### Section 1: BuildingLink Data
**Description**: "BuildingLink offers a complete set of features for managing all aspects of a building operation."

| # | Link | Description |
|---|------|-------------|
| 1 | Analytics | Report viewer with categorized report tree |
| 2 | Reports | Standard report generation |
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

**URL**: `/v2/mgmt/Reports/ReportsWithDataGrid.aspx` (accessed via Reports/Data sidebar)

### Layout
- **Left panel**: Report category tree (expandable/collapsible)
- **Right panel**: Report viewer/output

### Report Tree Categories (observed)
The analytics report tree contains categorized reports organized in expandable folders. Reports cover:
- Event log analytics
- Maintenance request analytics
- Reservation analytics
- Occupant/unit analytics
- Parking analytics
- Communication analytics

### Report Viewer
- Standard report viewer with parameter selection
- Export capabilities to various formats

---

## 3. Download Data (Modern SPA)

**URL**: `/data-download/staff` (Modern SPA)

### Purpose
Bulk data export tool allowing management to download building data in spreadsheet format.

### Export Tabs (9 observed)
| # | Tab | Description |
|---|-----|-------------|
| 1 | Units | Unit/apartment data export |
| 2 | Occupants | Resident information export |
| 3 | Vehicles | Vehicle registry export |
| 4 | Pets | Pet registry data export |
| 5 | Event log | Package/delivery event data export |
| 6 | Maintenance | Maintenance request data export |
| 7 | Reservations | Amenity booking data export |
| 8 | Incident reports | Incident report data export |
| 9 | Front desk instructions | Instruction data export |

### Common Export Features
- **Date range filters** on applicable tabs
- **Column selection** for customizing export fields
- **Export to Excel** button on each tab
- **Modern SPA interface** with clean filter bars

---

## Concierge Design Implications

### From Reports/Data Deep Dive
1. **3-tier data access**: Analytics (visual reports), Reports (standard reports), Download Data (raw export) — covers all reporting needs
2. **External Data (Beta)** — forward-looking integration with external data sources
3. **Aware! Sensor platform** — IoT integration for smart building monitoring (leak detection, temperature, humidity, etc.)
4. **9 export categories** in Download Data — comprehensive data portability
5. **Modern SPA for Download Data** — newer module with clean UX, while Analytics uses legacy report viewer
6. **Data export is critical** — properties need to extract data for board meetings, audits, compliance
7. **Report tree categorization** — organized by module (events, maintenance, reservations) for easy discovery
