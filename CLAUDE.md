# Concierge — Project Intelligence

> This file is the **single source of truth** for every future Claude session working on this project.
> Read this FIRST before touching any code or documentation.

---

## What Is This Project?

**Concierge** is a next-generation condo/building management portal designed to replace platforms like Aquarius (ICON), BuildingLink, and Condo Control. The goal is to combine the best features from all three platforms with an Apple-grade design system, role-aware interfaces, and modern architecture.

### The Thesis

> "Get as much data from different platforms and different tools so we can create something fantastic and comprehensive that doesn't exist in the market."

---

## Research Completed

We've reverse-engineered three live production platforms:

### Platform 1: Aquarius (ICON Condo Management)

- **Property**: ~500+ units observed
- **Documentation**: 24 files, 500+ fields, 2,200+ line design system
- **Location**: `docs/` (root-level files)
- **Strengths**: Security workflows, physical access management (FOBs, buzzers, clickers), emergency contacts, parking violations, simpler onboarding
- **Weaknesses**: Dated UI, single-channel notifications, no equipment/inspection tracking, rigid 6-log-type architecture

### Platform 2: BuildingLink

- **Property**: Queensway Park Condos - TSCC 2934 (171 units, Duka Property Management)
- **Documentation**: 5 files + comparison matrix
- **Location**: `docs/platform-2/`
- **Strengths**: Maintenance depth (7 sub-modules), unified event model, multi-channel communication, alteration tracking, equipment lifecycle, vendor compliance
- **Weaknesses**: Inconsistent UI (half modern, half legacy ASP.NET), feature bloat, hostile premium gating, no design system

### Platform 3: Condo Control

- **Property**: M.T.C.C. 872 (Toronto, ON)
- **Documentation**: 16 files (15 deep-dives + README), 5,649 lines
- **Location**: `docs/platform-3/`
- **Role Observed**: Security & Concierge ("Temp Concierge", Royal Concierge and Security)
- **Architecture**: Modern SPA (React-based) with legacy ASP.NET WebForms pages for account management
- **Strengths**: Training/LMS module (unique across all 3 platforms), community features (Classified Ads, Idea Board), clean modern UI, unified security console with 7 entry types, rich amenity booking with payment integration, 2FA support, login audit trail
- **Weaknesses**: Mixed architecture (SPA + legacy .aspx pages), role-gated features with visible-but-broken links (Package Preferences UX bug), no self-service profile editing, no maintenance module visible to Security role, Store and Survey modules non-functional, no vendor management observed
- **Role Limitation**: Security & Concierge role cannot access admin/settings, user management, maintenance module, vendor management, parking management, or financial settings — these features may exist but are undocumented

### Platform Comparison: `docs/PLATFORM-COMPARISON.md`

- **Three-way comparison**: Aquarius vs BuildingLink vs Condo Control across 79+ features
- BuildingLink is broadest, Aquarius is deepest in security/access, Condo Control is most modern UI with unique training features

---

## Strategic Product Decisions

### 1. Architecture: Unified Event Model (from BuildingLink)

**DO NOT** build 6 hardcoded log types like Aquarius. Instead:

- Everything is an "Event" with configurable Event Types grouped into Event Groups
- Properties can add/remove/customize event types without code changes
- Each event type gets: icon, color, notification template, display settings
- This handles packages, security logs, cleaning logs, incidents, visitors — ALL of it

### 2. Design: Apple-Grade Minimalism (our own)

The full design system is at `docs/DESIGN-SYSTEM.md` (2,243 lines). Key principles:

- White backgrounds, clean typography, no gradients or decoration
- Color is ONLY for status and actions
- Role-aware: different roles see different dashboards
- Progressive disclosure: advanced features reveal on demand
- One primary action per screen

### 3. Access Control: Admin-Controlled, No SSO

- **Super Admin → Admin → Roles** hierarchy
- No SSO — admin creates accounts and assigns roles
- Roles determine what's visible and actionable
- This is a deliberate choice for security-sensitive condo environments

### 4. Role-Aware Interfaces

This is our key differentiator that NEITHER platform does:

| Role                       | Primary View               | What They See                                                                    | What's Hidden                                            |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Front Desk / Concierge** | Event grid + quick actions | Package intake, visitor log, shift notes, unit instructions                      | Alteration projects, financial reports, board governance |
| **Security Guard**         | Security dashboard         | Incident log, parking violations, FOB tracking, emergency contacts, camera feeds | Maintenance requests, purchase orders, surveys           |
| **Property Manager**       | Management dashboard       | All maintenance, vendor compliance, alteration tracking, reports, financials     | Batch package entry, shift log                           |
| **Board Member**           | Governance view            | Reports, financials, alteration approvals, building analytics                    | Operational details, individual unit data                |
| **Resident**               | Resident portal            | Their packages, maintenance requests, bookings, announcements                    | Everything else                                          |

### 5. Feature Prioritization

#### Must-Have for v1 (from BOTH platforms)

1. **Unified event logging** — Configurable event types with courier-specific package tracking
2. **Maintenance requests** — Rich form with photo/document uploads, vendor assignment, equipment linkage
3. **Unit management** — Modular overview with custom fields, per-unit instructions
4. **Amenity reservations** — Calendar + list + grid views with approval workflow
5. **Announcements** — Multi-channel distribution (web portal, mobile push, email)
6. **Security features** — FOB/key tracking (from Aquarius), incident reporting, parking violations
7. **Resident portal** — Self-service packages, maintenance requests, bookings
8. **Notification system** — Email + SMS + push with per-resident preferences
9. **Shift log** — Always-accessible staff handoff notes
10. **Search** — Global search across all modules

#### Must-Have for v1 (Business Operations)

11. **Demo environment** — Sales demo with mock data + training sandbox for new staff (PRD 21)
12. **Marketing website** — Landing page, login routing, vanity URLs per property (PRD 22)
13. **Onboarding wizard** — 8-step guided property setup, under 30 minutes to go-live (PRD 23)
14. **Billing & subscription** — Stripe integration, 3 tiers, invoicing, dunning (PRD 24)
15. **Help center** — In-app contextual help, knowledge base, support tickets (PRD 25)
16. **Developer portal & API** — REST API, webhooks, API keys, SDKs (PRD 26)
17. **Data migration** — Import/export, CSV mapping, DSAR compliance, competitor migration (PRD 27)
18. **Compliance reports** — 8 report types, monitoring dashboards, audit automation (PRD 28)

#### Must-Have for v2

1. **Equipment tracking** — Lifecycle management with categories and replacement reports
2. **Inspections** — Mobile-first with checklists, GPS verification
3. **Recurring tasks** — Preventive maintenance scheduler with forecasting
4. **Vendor compliance** — Insurance tracking with 5-status dashboard and expiry alerts
5. **Alteration projects** — Renovation tracking with permit/insurance compliance
6. **Emergency broadcast** — Push + SMS + voice call cascade
7. **Parking permit system** — Full permit lifecycle with types, areas, printing
8. **Reports & analytics** — Exportable reports with Excel/PDF generation

#### Must-Have for v2 (continued, from Platform 3)

9. **Training/LMS module** — Staff training with quizzes and pass/fail tracking (from Condo Control, unique feature)
10. **Classified Ads** — Resident marketplace for community engagement (from Condo Control)
11. **Login audit trail** — Recent Account Activity with device, IP, status tracking (from Condo Control)

#### Nice-to-Have (v3+)

1. Know your residents (gamified staff training)
2. Public display/digital signage
3. Photo albums
4. Purchase orders
5. Board governance module
6. Asset manager
7. Resident passports & ID cards
8. Building directory
9. Idea Board (crowdsourced feature requests from residents, from Condo Control)
10. Discussion Forum (threaded resident discussions, from Condo Control)

---

## Critical Design Insights from Research

### What BuildingLink Gets Right (Steal These)

1. **Courier-specific package icons** — Amazon/FedEx/UPS logos on cards. Instant visual recognition.
2. **Vendor insurance compliance dashboard** — 5-status cards (compliant/not/expiring/expired/not tracking). Proactive.
3. **Modular unit overview** — Drag-reorderable widget sections. Staff customizes their view.
4. **Multi-channel announcements** — Distribute once → lobby screen + website + mobile app.
5. **Batch event creation** — 4-row form with per-row notification control. Fast for busy front desks.
6. **Momentum indicators on alterations** — OK/Slow/Stalled/Stopped with color coding. Brilliant status communication.
7. **Missing email tracking** — "3 employees, 19 occupants missing email addresses." Proactive data quality.
8. **Per-unit front desk instructions** — Unit 815 has a dog that bites. Unit 302 is deaf, use the doorbell twice. Critical context.

### What BuildingLink Gets Wrong (Avoid These)

1. **Inconsistent UI** — Modern pages mixed with 2008-era ASP.NET. Pick one design language and stick to it.
2. **Feature gating by showing disabled fields** — Signature, Photo, Driver's License visible but greyed out. This is hostile UX. Don't show what users can't use.
3. **Feature bloat in navigation** — 60+ menu items overwhelm. Use role-aware nav to show only relevant items.
4. **No design system** — Buttons, colors, spacing, typography vary across pages. We have a 2,200-line design system. Use it.
5. **Game inside a management tool** — "Know Your Residents" is fun but doesn't belong in primary navigation. If we build it, make it a training module, not a sidebar item.

### What Aquarius Gets Right (Keep These)

1. **FOB/key management with serial numbers** — 6 FOB slots, 2 buzzer codes, 2 garage clickers per user. Physical security matters.
2. **Dedicated security menu** — Security isn't just another event type. It deserves its own workflow.
3. **Emergency contacts prominently featured** — Dedicated tab on every resident. 2 clicks to find next-of-kin.
4. **Parking violation lifecycle** — Create → Track → Resolve. Separate from generic events.
5. **Parcel waivers** — Legal document management for package handling policies.
6. **Welcome email system** — Configurable onboarding templates. First impression matters.
7. **Auto-generated reference numbers** — Every package gets a trackable reference.
8. **Storage spot tracking** — Where physically is this package stored? Dropdown selection.

### What Condo Control Gets Right (Steal These)

1. **Training/LMS module** — Built-in staff training with quizzes, pass/fail tracking, and course management. Neither Aquarius nor BuildingLink has this. Essential for high-turnover concierge teams.
2. **Unified security console with 7 entry types** — Parcels, Visitors, Incidents, Keys, Pass-On Log, Cleaning, Notes all in one interface with color-coded cards. Best implementation of the unified event model concept.
3. **Login audit trail** — Recent Account Activity shows every login with device, IP, and status. Essential security feature for condo environments.
4. **Classified Ads** — Community marketplace for residents. Builds engagement. Neither competitor has this.
5. **Idea Board** — "Post Idea" / "Browse Ideas" from the help button. Crowdsourced feature requests from residents. Smart engagement tool.
6. **Module-organized email preferences** — 12 notification types organized by module (Amenity, Announcements, Events, etc.) is clearer than flat checkbox lists.
7. **Buzzer code management** — Dedicated admin page for building-wide buzzer directory with multi-field search, CSV export, and edit-in-place.
8. **Report builder with 23 report types** — Comprehensive reporting across all modules with date filtering, CSV/Excel/PDF export.

### What Condo Control Gets Wrong (Avoid These)

1. **Mixed architecture** — Modern SPA pages alongside legacy ASP.NET WebForms (.aspx). Change Password and Email Preferences feel like a different product. Pick one stack.
2. **Role-gated features with broken links** — Package Preferences sidebar link visible but tab hidden for Security role. Link should be hidden too. Silent failures are hostile UX.
3. **No self-service profile editing** — Users can't update their own name, email, or phone. Admin dependency for basic info changes.
4. **Empty states with no actions** — Emergency Contacts shows "no records" with no Add button. Phone numbers the same. If a section is empty, provide a way to populate it.
5. **Non-functional modules shipped** — Store page shows "No items" with no way to add. Survey page nearly empty. Don't ship broken modules.
6. **No password complexity feedback** — Change Password page doesn't show requirements. Users guess and fail.
7. **Training module lacks content management** — Good concept but the quiz builder and content authoring tools feel limited compared to dedicated LMS platforms.

### What Aquarius Gets Wrong (Fix These)

1. **6 rigid log types** — Can't add new types without code changes. Inflexible.
2. **Table-only display** — No card view, no visual scanning for front desk.
3. **Email-only notifications** — No SMS, no push, no voice. It's 2026.
4. **No photo/document uploads** — Maintenance requests are text-only.
5. **No equipment or inspection tracking** — Preventive maintenance is guesswork.
6. **No vendor compliance** — Is the plumber's insurance valid? Unknown.
7. **Single-channel announcements** — Post on website, hope residents check it.

---

## Technical Architecture Notes

### URL Structure (from Aquarius research)

Complete URL map at `docs/url-map.md` — 41 routes documented.

### Data Model Insights

#### Events (unified model)

```
Event
├── id (auto-generated)
├── event_type_id → EventType (configurable)
├── event_group_id → EventGroup
├── unit_id → Unit
├── resident_id → Resident (optional)
├── status (open/closed)
├── created_by → Staff
├── created_at
├── closed_by → Staff (nullable)
├── closed_at (nullable)
├── comments (text)
├── notification_sent (boolean)
├── notification_channel (email/sms/push/voice)
├── label_printed (boolean)
├── signature (blob, premium)
├── photo (blob, premium)
├── location (string, optional module)
└── custom_fields (jsonb)
```

#### Unit (modular overview)

```
Unit
├── id, number, floor, building
├── occupants[] → Resident
├── custom_fields (jsonb — configurable per property)
├── instructions[] → UnitInstruction
├── events[] → Event
├── maintenance_requests[] → MaintenanceRequest
├── reservations[] → Reservation
├── parking_permits[] → ParkingPermit
├── pets[] → Pet
├── vehicles[] → Vehicle
├── alterations[] → AlterationProject
├── fobs[] → FOB (serial, type, status)
├── buzzer_codes[]
├── garage_clickers[]
└── documents[] → Document
```

#### Maintenance Request (rich model)

```
MaintenanceRequest
├── id, unit_id, description (4000 char)
├── category_id → MaintenanceCategory (configurable)
├── status (open/hold/closed + dates)
├── priority, urgency_flag
├── permission_to_enter (yes/no)
├── entry_instructions (1000 char)
├── assigned_employee_id → Staff
├── assigned_vendor_id → Vendor
├── equipment_id → Equipment (optional)
├── photos[] → Attachment (JPG/PNG/GIF/HEIC, 4MB)
├── documents[] → Attachment (PDF/DOC/XLSX, 4MB)
├── reference_number
├── contact_numbers
├── email_notifications[]
├── print_work_order (boolean)
├── comments[] → Comment (with timestamps)
└── created_at, updated_at
```

---

## Deduced Workflows (from observation, not documentation)

Full workflow chains are documented in `docs/DESIGN-SYSTEM.md` Section 20.3, including:

1. Package Release Flow (8 steps)
2. Group Permission Editing (5 steps)
3. Resident Onboarding Workflow (7 steps)
4. Parking Violation Lifecycle (6 steps)
5. Security Log Notification Chain (5 steps)
6. Amenity Booking Chain (8 steps)
7. Multi-Building Context (6 behaviors)
8. Email Notification Architecture (3-layer system)

---

## File Inventory

### Root

| File        | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `CLAUDE.md` | **This file** — project intelligence for every session |

### `docs/` — Platform 1 (Aquarius) Documentation

| File                 | Content                            | Fields      |
| -------------------- | ---------------------------------- | ----------- |
| `DESIGN-SYSTEM.md`   | Complete design system + workflows | 2,243 lines |
| `README.md`          | Documentation overview             | —           |
| `dashboard.md`       | Dashboard layout and widgets       | ~20         |
| `unit-file.md`       | Unit management fields             | ~25         |
| `amenities.md`       | Amenity booking system             | ~15         |
| `search.md`          | Global search system               | ~6          |
| `emergency.md`       | Emergency contacts                 | ~8          |
| `top-navigation.md`  | Top nav and search                 | ~12         |
| `security-menu.md`   | Security features                  | ~15         |
| `announcement.md`    | Announcement system                | ~8          |
| `advertisement.md`   | Advertisement management           | ~5          |
| `maintenance.md`     | Maintenance requests               | ~15         |
| `contractors.md`     | Contractor directory               | ~6          |
| `survey.md`          | Survey builder                     | ~10         |
| `library.md`         | Document library                   | ~8          |
| `store.md`           | Online store                       | ~10         |
| `events.md`          | Community events                   | ~12         |
| `reports.md`         | Report generation                  | ~8          |
| `logs.md`            | 6 log types with form specs        | ~85         |
| `settings.md`        | 8 settings tabs                    | ~120        |
| `packages.md`        | Package lifecycle                  | ~30         |
| `user-profile.md`    | 6 profile tabs                     | ~40         |
| `user-management.md` | User management                    | ~5          |
| `create-unit.md`     | Unit creation                      | ~20         |
| `preferences.md`     | Notification preferences           | ~10         |
| `url-map.md`         | Complete URL routing (41 routes)   | —           |

### `docs/platform-2/` — Platform 2 (BuildingLink) Documentation

| File                        | Content                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `README.md`                 | Full platform overview, navigation structure, 23 differentiators |
| `event-log.md`              | Event type system, card grid, batch creation, general settings   |
| `maintenance.md`            | 7 maintenance sub-modules with field-level documentation         |
| `manage-and-communicate.md` | 23 sub-sections across Manage and Communicate                    |
| `unique-features.md`        | 23 features not found in Aquarius                                |

### `docs/platform-3/` — Platform 3 (Condo Control) Documentation

| File                              | Content                                                       | Lines |
| --------------------------------- | ------------------------------------------------------------- | ----- |
| `README.md`                       | Platform overview, navigation structure, strengths/weaknesses | 192   |
| `deep-dive-dashboard.md`          | Dashboard widgets, quick actions, weather                     | 340   |
| `deep-dive-my-account.md`         | 6 tabs + Change Password + Email Preferences                  | 436   |
| `deep-dive-amenity-booking.md`    | Calendar/list views, payment, approval workflows              | 739   |
| `deep-dive-announcements.md`      | Announcement creation and distribution                        | 249   |
| `deep-dive-classified-ads.md`     | Community marketplace (unique to P3)                          | 269   |
| `deep-dive-events.md`             | Community events module                                       | 280   |
| `deep-dive-library.md`            | File library with categories                                  | 340   |
| `deep-dive-reports.md`            | 23 report types with export                                   | 374   |
| `deep-dive-security-concierge.md` | 7 entry types, unified console (largest file)                 | 863   |
| `deep-dive-sidebar-navigation.md` | 14 sidebar items, collapsible nav                             | 220   |
| `deep-dive-store.md`              | Store module (non-functional)                                 | 98    |
| `deep-dive-survey.md`             | Survey module (nearly empty)                                  | 115   |
| `deep-dive-training.md`           | LMS/Training module (unique to P3)                            | 389   |
| `deep-dive-unit-file.md`          | Unit management, resident profiles                            | 349   |
| `deep-dive-buzzer-codes.md`       | Buzzer code admin directory                                   | 217   |

### `docs/prd/` — Product Requirements Documents (PRDs 21-28: Business Operations)

| File                         | Module                                                                  | Lines  |
| ---------------------------- | ----------------------------------------------------------------------- | ------ |
| `21-demo-environment.md`     | Demo Environment — Sales demo + training sandbox system                 | ~950   |
| `22-marketing-website.md`    | Marketing Website — Customer-facing website, login routing, vanity URLs | ~1,000 |
| `23-onboarding-wizard.md`    | Onboarding Wizard — 8-step guided property setup                        | ~750   |
| `24-billing-subscription.md` | Billing & Subscription — Stripe integration, tiers, invoicing, dunning  | ~780   |
| `25-help-center.md`          | Help Center — In-app help, knowledge base, support tickets              | ~600   |
| `26-developer-portal-api.md` | Developer Portal & API — REST API, webhooks, API keys, SDKs             | ~760   |
| `27-data-migration.md`       | Data Migration — Import/export, CSV mapping, DSAR, competitor migration | ~1,290 |
| `28-compliance-reports.md`   | Compliance Reports — 8 compliance reports, monitoring, audit automation | ~1,400 |

### `docs/tech/` — Technical Documentation

| File                      | Content                                          |
| ------------------------- | ------------------------------------------------ |
| `INTERNATIONALIZATION.md` | i18n strategy (en + fr-CA)                       |
| `FEATURE-FLAGS.md`        | Per-property feature flag system                 |
| `ANALYTICS-FRAMEWORK.md`  | Privacy-respecting product analytics             |
| `DATA-QUALITY.md`         | Validation, duplicate detection, quality scoring |
| `TESTING-STRATEGY.md`     | Testing pyramid, CI/CD, security testing         |

### `docs/PLATFORM-COMPARISON.md`

Three-way feature matrix: 79+ features compared across all 3 platforms, Concierge decisions for each.

---

## Development Reminders

### When building any feature, check:

1. **DESIGN-SYSTEM.md** — For component specs, colors, typography, spacing
2. **PLATFORM-COMPARISON.md** — For the "Concierge Decision" column on that feature
3. **The relevant Aquarius doc** — For field-level detail
4. **The relevant BuildingLink doc** — For what they added beyond Aquarius
5. **The relevant Condo Control doc** — For modern UI patterns and unique features
6. **This file's "Critical Design Insights"** — For what to steal vs avoid from ALL 3 platforms

### Design Non-Negotiables

- White backgrounds. No dark sidebars, no gradient headers.
- Role-aware navigation. Don't show 60 menu items to everyone.
- Progressive disclosure. Advanced features hide until needed.
- One primary action per screen. If there are 2 CTAs competing, redesign.
- Every field must earn its place. If it's not used 80% of the time, hide it.

### Technical Non-Negotiables

- Unified event model with configurable types. NOT hardcoded log types.
- Multi-channel notifications from day one. Email + SMS + Push.
- Custom fields as JSONB, not schema changes per property.
- Mobile-responsive from the start, not retrofitted.
- Export (Excel/PDF) on every listing page.
- Global search that works across all modules.

---

### Business Operations

- **BUSINESS-OPERATIONS.md** — Demo environments, customer-facing website, onboarding wizard, multi-property management, white-label branding, billing, help center, status page, developer portal, data import/export, compliance reports

---

## Development Readiness

> **Status**: Phase 1 COMPLETE, Phase 2 IN PROGRESS as of 2026-03-18
> **Full report**: `docs/audit/PRE-DEV-READINESS.md`

### What Is Complete

- **29 PRDs** (00-28) covering all v1, v2, and business operations modules. All scored A in quality audit.
- **Design system**: v1 (2,243 lines) + v2 (OKLCH tokens, typography, icons, motion). 92 components in COMPONENT-CATALOG.md, 123 in COMPONENT-SPECS.md. Screen states for 22 screen groups. Animation playbook. Responsive breakpoints. Admin panel blueprint. 12 persona journey maps.
- **Tech stack**: TECH-STACK-FINAL.md with 35 categories, every choice justified. 9 ADRs accepted.
- **Security**: SECURITY-RULEBOOK.md (100+ rules). ENTERPRISE-PRINCIPLES.md (coding patterns).
- **Compliance**: COMPLIANCE-MATRIX.md (8 frameworks). ROPA.md (14 processing categories).
- **Audit**: GAP-ANALYSIS-FINAL.md (47 gaps identified). PRD-QUALITY-REPORT.md (45 issues fixed).
- **Prisma schema**: 131 models covering all v1 and v2 entities. All API routes aligned with schema (0 TS errors).
- **API routes**: 66 v1 routes with auth guards, RBAC, XSS sanitization, tenant isolation.
- **Pages**: 14 pages wired to real database with role-aware navigation.
- **Tests**: 872 passing (53 test files) — unit, API, integration, component tests.
- **Workflows**: Package lifecycle, perishable escalation, maintenance SLA, visitor lifecycle, booking state machine.

### What Needs Attention

1. **GAP-ANALYSIS-FINAL.md fixes (8 critical, 16 high) have NOT been applied to the PRDs.** They exist only in the gap document. PRDs must be updated before developers code from them.
2. ~~**TECH-STACK.md vs TECH-STACK-FINAL.md**~~: Resolved. TECH-STACK.md archived as TECH-STACK-ARCHIVED.md. Use TECH-STACK-FINAL.md only.
3. ~~**Prisma schema ~40% complete**~~: Resolved. Schema now has 131 models, all routes aligned.

### Development Phases

| Phase                     | Weeks | Focus                                                                                                        | Key PRDs             |
| ------------------------- | ----- | ------------------------------------------------------------------------------------------------------------ | -------------------- |
| **1: Foundation**         | 1-6   | Scaffold, auth, RBAC, design tokens, layout shell, multi-tenancy, notifications                              | 01, 02, 08           |
| **2: Core Modules**       | 7-16  | Events, security console, packages, units, users, maintenance, amenities, comms, dashboard, search, settings | 03-09, 14-16         |
| **3: Extended + Biz Ops** | 17-28 | Reports, parking, training, community, billing, onboarding, marketing site, mobile, AI                       | 10-13, 17, 19, 22-24 |
| **4: Platform Maturity**  | 29-40 | Demo env, help center, dev portal, data migration, compliance, advanced settings, innovation                 | 20-21, 25-28         |

### Key Documents for Every Developer

| When                       | Read                                                                   |
| -------------------------- | ---------------------------------------------------------------------- |
| Before writing any code    | `docs/tech/ENTERPRISE-PRINCIPLES.md`, `docs/tech/SECURITY-RULEBOOK.md` |
| Before building a feature  | The relevant PRD + `docs/audit/GAP-ANALYSIS-FINAL.md` for that module  |
| Before styling a component | `docs/design/COMPONENT-CATALOG.md`, `docs/design/DESIGN-SYSTEM-v2.md`  |
| Before handling user data  | `docs/tech/COMPLIANCE-MATRIX.md`, `docs/tech/ROPA.md`                  |

---

_Last updated: 2026-03-17_
_Platforms researched: 3 (Aquarius, BuildingLink, Condo Control)_
_Total documentation: 80+ files, ~77,000 lines, 800+ fields documented_
