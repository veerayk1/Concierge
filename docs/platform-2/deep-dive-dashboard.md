# Dashboard Module — Granular Deep Dive

Field-level documentation of every section, widget, and action on BuildingLink's Manager Dashboard.

---

## Overview

**URL**: `/manager-dashboard/staff/` (Modern SPA)
**Access**: Sidebar → Dashboard (click main "Dashboard" text)
**Sub-pages**: Dashboard sidebar has 1 sub-link: "My profile"

The Manager Dashboard is the primary landing page for building staff. It provides a real-time overview of building operations with actionable summary widgets and quick-access links.

---

## Layout

Two-column layout:
- **Left column** (main, ~65%): 5 collapsible information sections
- **Right column** (~35%): Shift log button + Employees logging-in widget

---

## Left Column — Main Dashboard

### Section 1: Action Items (collapsible)

**Title**: "Action items" with collapse toggle (^)

Displays counts of items requiring staff attention, arranged in a 2-column grid:

| # | Metric | Count | Color | Description |
|---|--------|-------|-------|-------------|
| 1 | Emergency broadcasts within the last 24 hours | 0 | Red text | Recent emergency broadcasts — clickable link |
| 2 | Incident reports pending approval | 124 | Blue text | Incidents awaiting review — clickable link |
| 3 | Amenity reservations to approve | (loading) | Blue text + spinner | Pending reservation requests — clickable link |
| 4 | Postings/Comments to approve | (loading) | Blue text + spinner | Resident posts awaiting moderation — clickable link |
| 5 | Open requests | 1 | Blue text | Open maintenance requests — clickable link |
| 6 | Purchase orders to approve | 0 | Blue text | Pending purchase orders — clickable link |
| 7 | Vendors are expired or will expire in the next 30 days | 0 | Blue text | Vendor compliance alerts — clickable link |

**Key observations**:
- Emergency broadcasts uses **red text** to indicate urgency
- Some items show loading spinners (async data fetch)
- All items are clickable links that navigate to the relevant module
- 124 incident reports pending suggests a significant backlog

### Section 2: Active Announcements (collapsible)

**Title**: "Active announcements"
**Actions**: **View** (blue link) | **+ Add announcement** (blue link)

| State | Display |
|-------|---------|
| Empty | "There are no active announcements at this time." |
| With data | List of active announcements (not observed) |

### Section 3: Amenity Reservations Today (collapsible)

**Title**: "Amenity reservations today"
**Actions**: **View** (blue link) | **Search** (blue link) | **+ Add Reservation** (blue link)

#### Table Columns (4)
| # | Column | Description |
|---|--------|-------------|
| 1 | Time | Time range (e.g., "12:00 PM - 01:00 PM") |
| 2 | Amenity | Amenity name (e.g., "Moving Elevator") |
| 3 | Requested for | Unit number (e.g., "813") |
| 4 | Status | Status badge with color (e.g., yellow "Requested") |

#### Observed Data
| Time | Amenity | Requested for | Status |
|------|---------|---------------|--------|
| 12:00 PM - 01:00 PM | Moving Elevator | 813 | Requested (yellow badge) |

### Section 4: Calendar Events Today (collapsible)

**Title**: "Calendar events today"
**Actions**: **View** (blue link) | **+ Add calendar entry** (blue link)

| State | Display |
|-------|---------|
| Empty | "There are no calendar events today." |
| With data | List of today's calendar events (not observed) |

### Section 5: Front Desk Instructions from Management (collapsible)

**Title**: "Front desk instructions from management"
**Actions**: **View** (blue link) | **+ Add instructions** (blue link)

| State | Display |
|-------|---------|
| Empty | "There are no front desk instructions from management at this time." |
| With data | List of active instructions (not observed) |

---

## Right Column — Staff & Shift Log

### Shift Log Button

**Element**: Large green button spanning full width of right column
**Label**: "✏ Shift log"
**Purpose**: Quick access to the shift log — always visible at top of right panel

### Section: Employees Logging-in Today (collapsible)

**Title**: "Employees logging-in today"

Displays currently logged-in staff as avatar cards in a grid layout:

| # | Employee | Role | Avatar |
|---|----------|------|--------|
| 1 | Ray Kodavali | Operations Manager | RK (blue circle) |
| 2 | Royal Security Front desk | (Front Desk) | RS (blue circle) |
| 3 | Rajesh Reddy Jonnalagadda | Security Supervisor | RR (blue circle) |

#### Employee Card Layout
- Circle avatar with initials
- Full name (bold)
- Role/title below name
- Cards arranged in 2-column grid

---

## Sidebar Navigation — Complete Tree

The Dashboard page reveals the full sidebar navigation structure. Here is the complete tree:

### Dashboard
- My profile

### Manage
- Units/occupants
- Filtered groups
- Custom fields
- Calendar
- Library
- Employees
- Reservations
- Pet registry
- Parking management
- Purchase orders
- Board options
- Asset manager

### Front desk
- Home
- Event log
- Instructions
- Incident reports
- Resident directory

### Maintenance
- New request
- Search requests
- Equipment
- Inspections
- Vendors directory
- Recurring tasks
- Maintenance reports

### Communicate
- Home
- Send email
- Library
- Announcements
- Emergency broadcast
- Survey
- Public display
- Resident directory
- Building directory
- Manage photo albums
- Manage special email groups

### Resident site
- Home
- Approve postings
- Offers & services
- View resident site

### Reports/Data
- Home
- Analytics
- Reports
- Download data

### Settings
(no sub-items — opens overlay panel with 23 categories)

### Other
- Integrations
- Know your residents
- Alterations
- Resident passports
- ID cards and labels
- Resident ID verify

---

## Settings Panel Overlay (accessed from sidebar)

When "Settings" is clicked, an overlay panel appears with the title "General Building Set-Up Options" listing all 23 categories:

1. Property directory — Main addresses, contacts, message links
2. Amenities
3. Asset Manager
4. Authorized computers
5. Calendar
6. Custom fields
7. Design center
8. Displays and consoles
9. Document types
10. Employees
11. Event log — General settings, event type, event locations
12. Event types
13. Front desk instructions
14. Holidays
15. Incident reports — Inactive and active types
16. Library categories
17. Maintenance/repair categories
18. Occupant types
19. Parking permits
20. Physical units
21. Predefined maintenance responses
22. Resident posting categories
23. Shift log settings
24. Special permissions

---

## Concierge Design Implications

### From Dashboard Deep Dive
1. **7 action item counters** — critical operational metrics at a glance; Concierge should expand this with trend graphs
2. **5 collapsible sections** — all sections are expandable/collapsible for customization; Concierge should add drag-to-reorder
3. **Real-time employee tracking** — "Employees logging-in today" provides shift awareness; useful for coverage planning
4. **Shift log prominence** — large green button always visible; shift log is a core daily workflow tool
5. **Today-focused view** — reservations and calendar events scoped to "today" by default; Concierge should add date navigation
6. **Quick-add actions on every section** — "+ Add" links on every section for creating content directly from dashboard
7. **Async loading** — some action items show spinners (async fetch); Concierge should pre-fetch for instant display
8. **124 pending incident reports** — shows that moderation queues can grow large; need efficient batch review tools
9. **Vendor compliance tracking on dashboard** — expiration alerts surfaced to front page; proactive compliance management
10. **No data visualization** — purely text/number based; Concierge should add charts, sparklines, and trend indicators
11. **Modern SPA** — Dashboard is a modern React/SPA page at `/manager-dashboard/staff/`, not legacy ASP.NET
12. **Sidebar reveals full navigation tree** — 8 top-level sections with 50+ sub-pages total
