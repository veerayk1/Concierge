# Concierge — Next-Gen Condo Management Portal

> Research & design repository for a next-generation condo/building management portal designed to replace platforms like Aquarius (ICON) and BuildingLink.

---

## Project Status

| Milestone | Status |
|-----------|--------|
| Platform 1 (Aquarius) research | Done — 24 files, 500+ fields |
| Platform 2 (BuildingLink) research | Done — 17 files, 12 deep-dives, 5,300+ lines |
| Platform comparison matrix | Done — 79 features compared |
| Design system | Done — 2,200+ line spec |
| Product spec / build phase | Upcoming |

---

## Repository Structure

```
Concierge/
  CLAUDE.md                          # Project intelligence (read this first)
  docs/
    README.md                        # Platform 1 overview
    DESIGN-SYSTEM.md                 # 2,243-line design system
    PLATFORM-COMPARISON.md           # 79-feature comparison matrix

    # --- Platform 1: Aquarius (ICON) — 24 files ---
    dashboard.md                     # Dashboard layout & widgets
    unit-file.md                     # Unit management (~25 fields)
    amenities.md                     # Amenity booking system
    security-menu.md                 # Security features & logs
    announcement.md                  # Announcement system
    advertisement.md                 # Advertisement management
    maintenance.md                   # Maintenance requests
    library.md                       # Document library
    store.md                         # Online store
    events.md                        # Community events
    reports.md                       # Report generation
    search.md                        # Global search
    survey.md                        # Survey builder
    emergency.md                     # Emergency contacts
    contractors.md                   # Contractor directory
    top-navigation.md                # Top nav, Create User/Unit, Logs, Packages
    logs.md                          # 6 log types with form specs (~85 fields)
    settings.md                      # 8 settings tabs (~120 fields)
    packages.md                      # Package lifecycle (~30 fields)
    user-profile.md                  # 6 profile tabs (~40 fields)
    user-management.md               # User management
    create-unit.md                   # Unit creation (~20 fields)
    preferences.md                   # Notification preferences
    url-map.md                       # 41 routes documented

    # --- Platform 2: BuildingLink — 17 files ---
    platform-2/
      README.md                      # Platform overview & 23 differentiators
      event-log.md                   # Event type system & card grid
      maintenance.md                 # 7 maintenance sub-modules
      manage-and-communicate.md      # 23 sub-sections overview
      unique-features.md             # 23 features not in Aquarius

      # Deep-Dive Documents (field-level, every button/dropdown/form)
      deep-dive-dashboard.md         # Manager dashboard, sidebar, settings panel
      deep-dive-front-desk.md        # Event Log, Instructions, Incidents, Resident Directory
      deep-dive-manage.md            # Employees, Calendar, Pets, Library, Assets, POs, Board
      deep-dive-units-occupants.md   # Unit list, unit detail, occupant management
      deep-dive-maintenance.md       # Requests, Equipment, Inspections, Vendors, Recurring
      deep-dive-communicate.md       # Email, Announcements, Emergency, Surveys, Library
      deep-dive-reservations.md      # Amenity booking, approval workflow
      deep-dive-parking.md           # Parking management, permits, spaces
      deep-dive-reports.md           # Analytics, Download Data (9 tabs)
      deep-dive-settings.md          # All 24 settings categories (959 lines)
      deep-dive-resident-site.md     # Approve Postings, Offers, Resident Site
      deep-dive-other.md             # Integrations, Alterations, Passports, ID Cards
```

---

## Platforms Researched

### Platform 1: Aquarius (ICON Condo Management)
- **Property**: TSCC 2584, Toronto (~500+ units)
- **URL**: https://aquarius.iconconnect.ca
- **Documentation**: 24 files, 500+ fields, full URL map (41 routes)
- **Strengths**: Security workflows, FOB/key management, emergency contacts, parking violations

### Platform 2: BuildingLink
- **Property**: Queensway Park Condos — TSCC 2934 (171 units, Duka Property Management)
- **URL**: https://www.buildinglink.com
- **Documentation**: 17 files (5 overview + 12 deep-dives), 5,300+ lines of field-level detail
- **Deep-dives cover**: Every dropdown, button, form field, table column, filter option, permission level, and configuration setting across all modules
- **Strengths**: Maintenance depth, unified event model, multi-channel comms, vendor compliance, equipment tracking

### Platform Comparison
- **File**: [`docs/PLATFORM-COMPARISON.md`](docs/PLATFORM-COMPARISON.md)
- **79 features** compared across both platforms with Concierge decisions for each
- **Score**: Aquarius wins 11, BuildingLink wins 60, Tie 8

---

## Key Documents

| Document | What It Covers |
|----------|---------------|
| [`CLAUDE.md`](CLAUDE.md) | Project intelligence — start here for every session |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | 2,243-line design system: colors, typography, components, workflows |
| [`docs/PLATFORM-COMPARISON.md`](docs/PLATFORM-COMPARISON.md) | Side-by-side feature matrix with Concierge decisions |
| [`docs/platform-2/deep-dive-settings.md`](docs/platform-2/deep-dive-settings.md) | All 24 BuildingLink settings categories (959 lines) |

---

## Documentation Stats

| Metric | Count |
|--------|-------|
| Total documentation files | 44 |
| Total lines of documentation | ~16,800 |
| Platform 1 (Aquarius) fields documented | 500+ |
| Platform 2 (BuildingLink) deep-dive lines | 5,300+ |
| Features compared | 79 |
| Design system lines | 2,243 |
| BuildingLink settings categories | 24 |
| BuildingLink event types | 18 |
| BuildingLink maintenance categories | 45 |
| BuildingLink physical units | 170 |
| BuildingLink employees | 7+ |

---

*Last updated: 2026-03-13*
