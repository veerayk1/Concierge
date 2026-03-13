# Platform 2: BuildingLink

**Product**: BuildingLink (buildinglink.com)
**Property Observed**: Queensway Park Condos - TSCC 2934
**Management Company**: Duka Property Management
**Facility ID**: 11871
**Date Documented**: 2026-03-13
**Version Observed**: v1.0.3690-1-g984b6351

---

## Platform Overview

BuildingLink is a mature, enterprise-grade condo/building management SaaS platform. It serves a similar purpose to Aquarius (Platform 1) but with significantly broader feature scope, deeper module integration, and a more modern UI approach in certain areas while retaining legacy ASP.NET patterns in others.

### Architecture

- **Navigation**: Collapsible left sidebar with 9 top-level sections, each expanding to reveal sub-items
- **Layout**: Full-width content area with sidebar; mix of modern card-based UIs and legacy table-based pages
- **URL patterns**: Mix of `/v2/Mgmt/...aspx` (legacy) and `/module/staff/...` (modern rewrite)
- **Multi-language**: Built-in language selector (English, French, etc.)
- **Top bar**: Property name, Quick search, Facility ID, user avatar, Shift Log button, Help

---

## Navigation Structure (9 top-level sections)

### 1. Dashboard
- Action items summary (emergency broadcasts, incident reports, reservations, requests, purchase orders, vendor compliance)
- Active announcements
- Amenity reservations today
- Calendar events today
- Front desk instructions from management
- Shift log (right panel)
- Employees logging-in today (right panel)

### 2. Manage (12 sub-items)
- **Units/occupants** — Search unit profiles, unit overview with 10 modular sections
- **Filtered groups** — Custom resident grouping
- **Custom fields** — Configurable fields per unit (Breed, Locker, Pet Names, Pet Size, Parking, etc.)
- **Calendar** — Building-wide calendar events
- **Library** — Document library
- **Employees** — Staff management
- **Reservations** — Amenity reservation system with list/calendar/grid views
- **Pet registry** — Pet tracking
- **Parking management** — Permit issuance, vehicles, parking spaces, permit types setup
- **Purchase orders** — Procurement tracking
- **Board options** — Board/governance features
- **Asset manager** — Building asset tracking

### 3. Front Desk (sub-items from previous session)
- **Home** — Front desk landing page
- **Event log** — Card-based event grid with color coding, grouping modes, adjustable display
- **Instructions** — Front desk instructions
- **Incidents** — Incident reporting and tracking
- **Shift log** — Staff shift handoff notes

### 4. Maintenance (7 sub-items)
- **New request** — Create maintenance request (2-column form, 20+ fields)
- **Search requests** — Maintenance request listing with filters
- **Equipment** — Equipment items, categories, replacement reports
- **Inspections** — Scheduled inspections with checklists (mobile GEO app required)
- **Vendors directory** — Vendor/contractor management with insurance compliance tracking
- **Recurring tasks** — Scheduled maintenance tasks with forecasting
- **Maintenance reports** — Maintenance analytics

### 5. Communicate (11 sub-items)
- **Home** — Communication dashboard hub
- **Send email** — Email composition
- **Library** — Document library (3 active documents)
- **Announcements** — Multi-channel announcements (Public Display, Resident Site, Resident App)
- **Emergency broadcast** — Voice and SMS broadcast system
- **Survey** — Survey creation and management
- **Public display** — Lobby screen configuration
- **Resident directory** — Resident address book
- **Building directory** — Building-level directory
- **Manage photo albums** — Photo gallery management
- **Manage special email groups** — Custom email distribution lists

### 6. Resident Site
- Resident-facing portal configuration

### 7. Reports/Data
- Management reports, Maintenance reports (8 types), Amenity reports, Occupant reports
- Analytics section
- Download data / Integrations

### 8. Settings
- 25+ configuration categories (observed from Reports page navigation)

### 9. Other (6 sub-items)
- **Integrations** — Third-party integrations
- **Know your residents** — Gamified staff training (drag-and-drop name/photo matching)
- **Alterations** — Renovation/construction project tracking (18-column tracker)
- **Resident passports** — Resident identity documents
- **ID cards and labels** — ID card generation
- **Resident ID verify** — Identity verification system

---

## Key Differentiators from Aquarius (Platform 1)

### Features BuildingLink Has That Aquarius Lacks

1. **Equipment Management** — Full equipment lifecycle tracking with categories (Electrical, Fire, Gas, Mechanical, Roof, Valves), replacement reports
2. **Inspections System** — Scheduled inspections with checklists, mobile GEO app integration, global checklists (6 built-in)
3. **Recurring Tasks** — Automated task scheduling with forecasting, interval management, equipment linkage
4. **Vendor Insurance Compliance** — 5-status compliance dashboard (compliant, not compliant, expiring, expired, not tracking)
5. **Emergency Voice/SMS Broadcast** — Automated phone calls and text messages to residents in emergencies
6. **Alteration Projects** — 18-column renovation tracker with momentum indicators (OK/Slow/Stalled/Stopped), permit/insurance/license expiry tracking
7. **Know Your Residents** — Gamified staff training tool with scoring and high score lists
8. **Parking Permit System** — Full permit issuance with types, areas, print permits
9. **Public Display Configuration** — Lobby screen/digital signage management
10. **Photo Albums** — Building photo gallery management
11. **Resident Passports & ID Cards** — Identity document and card generation
12. **Shift Log** — Staff shift handoff notes (top-bar persistent access)
13. **Custom Fields** — Configurable fields per unit
14. **Purchase Orders** — Procurement tracking with approval workflow
15. **Board Options** — Governance/board management features
16. **Asset Manager** — Building asset tracking
17. **Filtered Groups** — Custom resident grouping
18. **Building Directory** — Separate from resident directory
19. **Special Email Groups** — Custom email distribution lists
20. **Multi-channel Announcements** — Public Display + Resident Site + Resident App distribution
21. **Text/Voice Notifications for Packages** — SMS and voice call package alerts (opt-in)
22. **Calendar Events** — Integrated building calendar
23. **Incident Reports** — Dedicated incident tracking (123 pending approval observed)

### Architectural Differences

| Aspect | Aquarius (Platform 1) | BuildingLink (Platform 2) |
|--------|----------------------|--------------------------|
| Event/Log Paradigm | 6 separate log types | Unified "Event" concept with event type groups |
| Event Display | Table-based listing | Card-based grid with color coding, 4 grouping modes |
| Package Tracking | Type categories only | Courier-specific types (Amazon, FedEx, UPS, etc.) with branded icons |
| Maintenance Form | Basic fields | 20+ fields, 2-column layout, photo+document attachments |
| Notification Channels | Email only | Email + Voice + SMS + Push (Resident App) |
| Announcement Distribution | Single channel | Multi-channel (Public Display, Resident Site, Resident App) |
| Parking | Simple field on unit | Full permit system with types, areas, issuance, printing |
| Navigation | Top nav + side panels | Collapsible left sidebar with nested menus |
| Export | Limited | Excel and PDF export on most pages |
| Premium Features | All-or-nothing | Feature gating (Signature, App Auth, Photo ID visible but disabled) |
| Mobile | No mobile app | GEO app for inspections, Resident App |
| Multi-language | No | Built-in language selector |
