# Deep Dive: Reports Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/reports`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/reports`
**Page title**: "Reports"
**Sidebar label**: "Reports"

### Page Layout
1. **Header**: Blue bar chart icon + Title "Reports"
2. **Resident distribution chart**: Donut/pie chart showing resident breakdown
3. **Report sections**: 4 grouped report categories with individual report items

---

## 2. Resident Distribution Chart

**Type**: Donut chart (ring chart)
**Position**: Top of page, large visual

### Data Points
| Segment | Count | Color | Pattern |
|---------|-------|-------|---------|
| owners | 238 | Yellow | Hatched |
| tenants | 1,299 | Coral/Salmon | Striped |
| offsiteowners | 454 | Yellow | Solid |
| boardmembers | (small) | Orange | Solid |

**Total users**: ~1,991 (238 + 1,299 + 454 + board members)

**Key insight**: This gives a quick visual of the property's resident composition. Tenants (1,299) vastly outnumber owners (238), which is typical for a large condo. 454 offsite owners is significant — nearly 2x the onsite owners.

---

## 3. Report Categories & Individual Reports

Each report has 1-2 export options:
- **Open Pdf Viewer** — View as PDF in browser
- **Generate Excel** — Download as Excel spreadsheet

### 3.1 Amenity Reports (1 report)
| Report | PDF | Excel |
|--------|-----|-------|
| Amenity Usage | ✓ | ✓ |

### 3.2 Announcement Reports (2 reports)
| Report | PDF | Excel |
|--------|-----|-------|
| Announcements | ✓ | ✓ |
| Announcement Mailings | ✓ | ✓ |

### 3.3 Service Request Reports (2 reports)
| Report | PDF | Excel |
|--------|-----|-------|
| Service Requests | ✓ | ✓ |
| Service Request Updates and Comments | ✓ | ✓ |

### 3.4 Security Reports (7 reports)
| Report | PDF | Excel |
|--------|-----|-------|
| Shift Report | ✓ | ✓ |
| Shift Logs (Last Day Report) | ✓ | ✓ |
| Active Visitor Parking Permits | ✓ | ✓ |
| Visitor Parking Permits By Unit | ✓ | ✓ |
| Visitor Parking - Last Week | ✓ | ✓ |
| Released Packages | ✓ | ✓ |
| Non-Released Packages | ✓ | ✓ |

### 3.5 Unit and User Reports (16 reports)
| Report | PDF | Excel |
|--------|-----|-------|
| Resident List | — | ✓ |
| Unit Details: Unit, Parking Spots, Locker, Phone Code | ✓ | ✓ |
| Pet Details | ✓ | ✓ |
| Vehicle Details | ✓ | ✓ |
| Rented Parking Spots | ✓ | ✓ |
| Electronic Notices | ✓ | ✓ |
| Signed Parcel Waiver Attachment | ✓ | ✓ |
| AGM Notice Opt-In | ✓ | ✓ |
| Front desk instructions | ✓ | ✓ |
| All Owners (Offsite + Onsite) | ✓ | ✓ |
| Onsite Owners | ✓ | ✓ |
| Offsite Owners | ✓ | ✓ |
| Active Owners | ✓ | ✓ |
| Active Tenants | ✓ | ✓ |
| Inactive Tenants | ✓ | ✓ |
| Inactive Owners | ✓ | ✓ |
| Emergency Assistance Required | ✓ | ✓ |

**Key insight**: "Resident List" is the only report that's Excel-only (no PDF option). All other reports support both PDF and Excel export.

---

## 4. Report Summary

| Category | Report Count | Focus Area |
|----------|-------------|------------|
| Amenity Reports | 1 | Amenity usage tracking |
| Announcement Reports | 2 | Announcement delivery and mailing |
| Service Request Reports | 2 | Maintenance request tracking |
| Security Reports | 7 | Shifts, parking, packages |
| Unit and User Reports | 16 | Resident data, unit details, compliance |
| **Total** | **28 reports** | — |

---

## 5. Concierge Design Implications

### Strengths to Preserve
1. **Dual export format** — Both PDF and Excel for almost every report
2. **28 pre-built reports** — Comprehensive coverage of key operational data
3. **Resident distribution chart** — Quick visual of building composition
4. **Security-focused reports** — 7 security reports show importance of this data
5. **Owner/tenant segmentation** — Multiple owner/tenant sub-reports (active/inactive/onsite/offsite)
6. **Front desk instructions report** — Exportable per-unit notes for shift handoffs
7. **Parcel waiver tracking** — Compliance report for signed waivers
8. **Emergency assistance report** — Quick access to who needs special help

### Gaps & Issues to Fix
1. **No date filtering** — No visible date range selector for reports
2. **No custom report builder** — Only pre-defined reports, can't create custom ones
3. **No scheduled reports** — Can't schedule automatic report delivery
4. **No charts beyond donut** — Single chart type; no trend/time-series data
5. **No building filter** — No visible building selection for multi-building properties
6. **No report search** — 28 reports with no search/filter capability
7. **No favorites/pinning** — Can't pin frequently used reports
8. **No maintenance reports** — No dedicated maintenance/work order reports
9. **No financial reports** — No revenue, expense, or budget reports
10. **No event reports** — No event attendance or participation reports
11. **No data visualization** — Reports appear to be tabular only (PDF/Excel), no dashboards
12. **Static grouping** — Report categories are fixed, not customizable

---

## 6. Data Model (Deduced)

```
Reports Module
├── Resident Distribution Chart
│   ├── owners_count (238)
│   ├── tenants_count (1299)
│   ├── offsiteowners_count (454)
│   └── boardmembers_count
├── Report Categories
│   ├── Amenity Reports (1)
│   ├── Announcement Reports (2)
│   ├── Service Request Reports (2)
│   ├── Security Reports (7)
│   └── Unit and User Reports (16)
└── Export Formats
    ├── PDF (via "Open Pdf Viewer")
    └── Excel (via "Generate Excel")
```

---

*Last updated: 2026-03-14*
*Total reports documented: 28*
*Export formats: 2 (PDF, Excel)*
*Report categories: 5*
