# Platform 3: Condo Control

**Product**: Condo Control (app.condocontrol.com)
**Property Observed**: M.T.C.C. 872
**Location**: Toronto, ON
**Logged-in Role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)
**Date Documented**: 2026-03-14
**Architecture**: Modern SPA (React-based) with some legacy ASP.NET WebForms pages

---

## Platform Overview

Condo Control is a modern condo/building management SaaS platform competing in the same space as Aquarius (Platform 1) and BuildingLink (Platform 2). It distinguishes itself with a cleaner, more modern UI built as a React SPA, a unique Training/LMS module, and community features like Classified Ads and an Idea Board. However, it retains legacy ASP.NET WebForms pages for certain account management functions (Change Password, Email Preferences, Buzzer Codes), creating an inconsistent experience in those areas.

### Architecture

- **Navigation**: Persistent left sidebar with 14 main items, some expanding to reveal sub-items; collapsible via toggle
- **Layout**: Full-width content area with sidebar; predominantly modern SPA with isolated legacy pages
- **URL patterns**: Mix of `/my/...`, `/amenity/...`, `/security/...` (modern SPA routes) and `/*.aspx` (legacy WebForms)
- **Top bar**: Quick Search input, Help/Ideas button (lightbulb icon), Call button (phone icon), User avatar (initials)
- **Chat widget**: Built-in chat widget in bottom-right corner

---

## Navigation Structure (14 main items + sub-items)

### 1. Home (Dashboard) `/my/my-home`
- Weather widget
- Quick action cards
- Recent announcements
- Upcoming events
- Building activity summary

### 2. My Account `/my/unit`
- **Change Password** `/change-password.aspx` (legacy ASP.NET WebForms)
- **Email Preferences** `/my-account.aspx` (legacy ASP.NET WebForms) — 12 granular notification types organized by module
- **Package Preferences** `/my/unit#tab-14` (hidden for Security & Concierge role)
- Vacation/away period tracking
- Electronic consent document tracking
- Email signature editor (CKEditor 5)
- 2FA configuration (user choice, not forced)

### 3. Amenity Booking `/amenity/landing/`
- Calendar and list views
- Payment integration (configurable per amenity)
- Approval workflows
- Recurring booking support

### 4. Announcements `/announcement/show-list/`
- Announcement listing with search and filters
- Multi-channel distribution

### 5. Classified Ads `/forum/all-forums?mode=classifieds`
- Forum-based marketplace for resident community
- Category-based browsing
- Unique to Condo Control (neither Aquarius nor BuildingLink has this)

### 6. Events `/event/list-event/`
- Dual calendar system (Internal + Property-specific)
- Event listing with filters

### 7. Library `/library/landing`
- Document library for building documents
- Category-based organization

### 8. Reports `/reportV2/reports/`
- Telerik-based reporting engine
- 39+ pre-built reports
- 10 export formats

### 9. Security & Concierge `/security/console/`
- Comprehensive console with 7 entry types and 20+ filters
- **Unit File** (sub-item) `/unit/view-unit-file/`

### 10. Store `/store/overview/`
- Online store (non-functional in observed property; payment gateway not configured)

### 11. Survey `/survey/list-surveys/`
- Survey creation and management (nearly empty in observed property)

### 12. Training `/training/overview/`
- Learning Management System (LMS)
- Learning paths with course sequencing
- Team progress tracking
- Unique to Condo Control (neither Aquarius nor BuildingLink has this)

### 13. Unit File `/unit/view-unit-file/`
- Unit profile and resident information
- **Buzzer Codes** (sub-item) `/list-items.aspx?type=BuzzerCode` (legacy ASP.NET WebForms)

### 14. User Guide
- External link to Zendesk help center

### 15. Collapse
- Sidebar toggle (expand/collapse)

---

## Top Bar Elements

| Element | Type | Behavior |
|---------|------|----------|
| Quick Search | Text input | Searches across all modules |
| Help/Ideas | Lightbulb icon button | Dropdown: "Post Idea", "Browse Ideas" |
| Call | Phone icon button | Click-to-call functionality |
| User Avatar | Initials circle ("TC") | Links to Change Password |

---

## Key Differentiators from Aquarius (Platform 1) and BuildingLink (Platform 2)

### Features Unique to Condo Control

1. **Training/LMS Module** — Full learning management system with learning paths, course sequencing, and team progress tracking. Neither Aquarius nor BuildingLink offers anything comparable.
2. **Classified Ads Marketplace** — Forum-based community marketplace for residents to buy/sell/trade. Unique community feature.
3. **Idea Board / Feature Request System** — Built-in "Post Idea" and "Browse Ideas" system accessible from the top bar. Users can suggest platform improvements directly.
4. **Built-in Chat Widget** — Persistent chat widget in the bottom-right corner for support or communication.
5. **Dual Calendar System** — Separate Internal and Property-specific calendars for events.
6. **12 Granular Email Notification Types** — Email preferences organized by module with fine-grained control per notification type.
7. **Electronic Consent Document Tracking** — Track and manage digital consent documents per user.
8. **Vacation/Away Period Tracking** — Users can set vacation or away periods, informing staff of absence.
9. **Email Signature Editor** — Rich text email signature editing powered by CKEditor 5.
10. **2FA as User Choice** — Two-factor authentication available but not forced (user opt-in).
11. **Telerik-based Reporting** — 39+ pre-built reports with 10 export formats via Telerik reporting engine.
12. **Weather Widget** — Dashboard weather display for the building's location.

### Architectural Differences

| Aspect | Aquarius (Platform 1) | BuildingLink (Platform 2) | Condo Control (Platform 3) |
|--------|----------------------|--------------------------|---------------------------|
| Frontend Architecture | Traditional server-rendered | Mix of modern + legacy ASP.NET | Modern React SPA + legacy ASP.NET pages |
| Navigation | Top nav + side panels | Collapsible left sidebar with nested menus | Persistent left sidebar with sub-items, collapsible |
| Event/Log Paradigm | 6 separate log types | Unified "Event" concept with event type groups | 7 entry types in Security & Concierge console |
| Training/LMS | None | None | Full LMS with learning paths |
| Community Features | None | Know Your Residents (gamified) | Classified Ads marketplace, Idea Board |
| Reporting Engine | Limited | Excel/PDF export on most pages | Telerik engine, 39+ reports, 10 export formats |
| Chat/Support | None | None | Built-in chat widget |
| 2FA | N/A | N/A | Optional (user choice) |
| URL Patterns | `/admin/...` server routes | Mix of `/v2/Mgmt/...aspx` + `/module/staff/...` | Mix of `/my/...`, `/security/...` (SPA) + `/*.aspx` (legacy) |
| Search | Global search | Quick search | Quick Search across all modules |
| Mobile | No mobile app | GEO app for inspections, Resident App | Not observed from this role |

---

## Strengths

1. **Clean, Modern UI** — Consistent sidebar navigation with a React SPA delivering a smooth, modern experience for most modules
2. **Training Module** — Unique LMS with learning paths and team tracking; no competitor offers this
3. **Comprehensive Security & Concierge Console** — 7 entry types with 20+ filters for powerful log management
4. **Classified Ads Marketplace** — Community-building feature for resident buy/sell/trade
5. **39+ Pre-built Reports** — Telerik-based reporting with 10 export formats (PDF, Excel, CSV, etc.)
6. **Full Amenity Booking System** — Calendar views, payment integration, and approval workflows
7. **Feature Request System** — Built-in Idea Board ("Post Idea" / "Browse Ideas") for user feedback
8. **Weather Widget** — Dashboard weather display adds practical value
9. **Quick Search** — Cross-module search from the top bar
10. **Granular Email Preferences** — 12 notification types organized by module for fine-grained control

## Weaknesses

1. **Mixed Architecture** — Modern React SPA coexists with legacy ASP.NET WebForms pages (Change Password, Email Preferences, Buzzer Codes), creating jarring transitions
2. **Store Module Non-functional** — Payment gateway not configured in observed property; module exists but serves no purpose
3. **Survey Module Nearly Empty** — Minimal content or functionality observed
4. **No Admin/Settings Access** — Security & Concierge role cannot access system configuration
5. **Role-Gating UX Bugs** — Visible navigation links lead to hidden or inaccessible tabs (e.g., Package Preferences visible but tab hidden)
6. **No Maintenance/Work Order Module** — Not visible from Security & Concierge role; unclear if it exists for other roles
7. **No Vendor/Contractor Management** — Not visible from this role
8. **Production Typo** — "notfications" typo in production code signals polish issues

---

## Documentation Files (15)

| File | Content | Lines |
|------|---------|-------|
| `deep-dive-sidebar-navigation.md` | Complete sidebar structure and navigation patterns | 220 |
| `deep-dive-dashboard.md` | Dashboard layout, widgets, and quick actions | 340 |
| `deep-dive-my-account.md` | Account settings, email prefs, 2FA, consent docs | 418 |
| `deep-dive-amenity-booking.md` | Amenity booking system with calendar, payment, approvals | 739 |
| `deep-dive-announcements.md` | Announcement creation and distribution | 249 |
| `deep-dive-classified-ads.md` | Forum-based classified ads marketplace | 269 |
| `deep-dive-events.md` | Event management with dual calendar system | 280 |
| `deep-dive-library.md` | Document library management | 340 |
| `deep-dive-reports.md` | Telerik reporting engine, 39+ reports, export formats | 374 |
| `deep-dive-security-concierge.md` | Security & Concierge console, 7 entry types, filters | 863 |
| `deep-dive-store.md` | Online store (non-functional) | 98 |
| `deep-dive-survey.md` | Survey module (minimal content) | 115 |
| `deep-dive-training.md` | Training/LMS module with learning paths | 389 |
| `deep-dive-unit-file.md` | Unit profiles and resident management | 349 |
| `deep-dive-buzzer-codes.md` | Buzzer code management (legacy ASP.NET) | 217 |

**Total documentation**: 15 files, ~5,280 lines
