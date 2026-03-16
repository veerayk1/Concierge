# Business Operations Requirements

> **Purpose**: Documents every business-facing capability Concierge needs beyond core property management features.
> These are the systems that make Concierge a viable SaaS product — not just a software tool.

---

## Table of Contents

1. [Demo Environment System](#1-demo-environment-system)
2. [Customer-Facing Website](#2-customer-facing-website)
3. [Onboarding & Setup Wizard](#3-onboarding--setup-wizard)
4. [Multi-Property Management](#4-multi-property-management)
5. [White-Label & Branding](#5-white-label--branding)
6. [Subscription & Billing](#6-subscription--billing)
7. [Help Center & Knowledge Base](#7-help-center--knowledge-base)
8. [Status Page](#8-status-page)
9. [Developer Portal & API](#9-developer-portal--api)
10. [Data Import & Export](#10-data-import--export)
11. [Compliance & Audit Reports](#11-compliance--audit-reports)
12. [Implementation Priority](#12-implementation-priority)
13. [Cross-References to PRDs](#13-cross-references-to-prds)

---

## 1. Demo Environment System

### 1.1 Problem Statement

Sales teams need to walk potential clients through the ENTIRE platform with realistic data. New staff at existing properties need a safe place to learn the system without affecting production data. Without this, demos use screenshots or live data (dangerous), and training is sink-or-swim.

### 1.2 Two Modes

#### Mode A: Sales Demo (Super Admin Creates)

**Who**: Concierge sales team
**Purpose**: Showcase every feature of the platform to prospective property management companies
**Lifecycle**: Created once → reused across many demos → periodically refreshed

| Aspect                 | Specification                                                                                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creation**           | Super Admin clicks "Create Demo Property" from Super Admin panel                                                                                                                                                                                     |
| **Template**           | Pre-built "Maple Heights Condominiums" template with 200 units, 8 floors, 2 towers                                                                                                                                                                   |
| **Mock Data**          | 400+ residents, 12 staff members across all roles, 6 months of realistic event history                                                                                                                                                               |
| **Data Richness**      | Packages (500+ with courier logos), maintenance requests (200+ across all statuses), amenity bookings (300+), security incidents (50+), announcements (30+), parking violations (25+), shift logs (180 days), training courses (5 with quiz results) |
| **Personas Available** | Login as: Front Desk Concierge, Security Guard, Property Manager, Board Member, Resident, Super Admin                                                                                                                                                |
| **Quick Switch**       | "View as [Role]" dropdown in demo mode — instantly switches perspective without logging out                                                                                                                                                          |
| **Demo Badge**         | Orange "DEMO" badge in the header so it's never confused with production                                                                                                                                                                             |
| **Reset**              | "Reset Demo Data" button restores all data to original state (useful between sales calls)                                                                                                                                                            |
| **Isolation**          | Demo properties are completely isolated from production data                                                                                                                                                                                         |
| **Expiry**             | Demo environments auto-expire after 90 days of inactivity (configurable)                                                                                                                                                                             |
| **Concurrent Demos**   | Support multiple concurrent demo environments (e.g., one per sales rep)                                                                                                                                                                              |
| **Custom Branding**    | Demo can be branded with the prospect's logo/name for personalized presentations                                                                                                                                                                     |

**Mock Data Categories:**

```
Demo Data Package
├── Property: Maple Heights Condominiums (200 units, 2 towers)
│
├── Users (412 total)
│   ├── 400 residents (diverse names, contact info, move-in dates)
│   ├── 6 concierge/front desk staff
│   ├── 3 security guards
│   ├── 1 property manager
│   ├── 1 board member
│   └── 1 super admin
│
├── Events & Packages
│   ├── 500+ package entries (Amazon 40%, FedEx 15%, UPS 12%, Canada Post 10%, other 23%)
│   ├── Status distribution: 60% picked up, 25% pending, 10% notified, 5% returned
│   ├── 200+ visitor entries with sign-in/out times
│   └── 50+ delivery/move-in/move-out events
│
├── Maintenance
│   ├── 200+ requests across 15 categories
│   ├── Status: 45% closed, 30% open, 15% in progress, 10% on hold
│   ├── Photo attachments on 40% of requests
│   ├── Vendor assignments on 60% of requests
│   └── Average resolution time: 3.2 days
│
├── Amenities
│   ├── 8 amenity spaces (Party Room, Gym, Pool, BBQ Area, Guest Suite, Theatre, Tennis Court, Yoga Studio)
│   ├── 300+ bookings across 3 months
│   ├── Status: 70% confirmed, 15% pending approval, 10% completed, 5% cancelled
│   └── Revenue: $12,400 in booking fees
│
├── Security
│   ├── 50 incident reports (noise complaints, unauthorized access, property damage, etc.)
│   ├── 400+ FOB records with serial numbers
│   ├── 25 parking violations
│   ├── 180 days of shift log entries
│   └── Emergency contacts for every resident
│
├── Announcements
│   ├── 30 announcements (building updates, fire drills, maintenance notices, events)
│   ├── Distribution: 80% email, 60% push, 40% SMS, 20% lobby display
│   └── Read rates: 45-92% depending on urgency
│
├── Training (LMS)
│   ├── 5 courses (Fire Safety, Package Handling, Visitor Protocol, Emergency Response, Customer Service)
│   ├── Quiz results for all staff (85% avg pass rate)
│   └── Completion certificates
│
├── Community
│   ├── 15 classified ads (furniture, electronics, services)
│   ├── 5 community events (holiday party, AGM, BBQ, movie night, yoga class)
│   └── 8 ideas on the Idea Board
│
└── Reports
    ├── 6 months of historical data for all charts/graphs
    ├── Trend lines showing improvement over time
    └── Exportable in Excel/PDF format
```

#### Mode B: Training Sandbox (Building Admin Creates)

**Who**: Property Manager or Admin at an existing building
**Purpose**: Let new employees learn the system with realistic but fake data
**Lifecycle**: Created per training cohort → used for 2-4 weeks → deleted

| Aspect                  | Specification                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Creation**            | Admin clicks "Create Training Environment" from Settings → Training                                                            |
| **Template**            | Clones the current property structure (units, amenity spaces, event types) but replaces all resident/staff data with fake data |
| **User Limit**          | Up to 5 trainee accounts per training environment                                                                              |
| **Duration**            | Auto-expires after 30 days (configurable by admin)                                                                             |
| **Data Scope**          | 50 fake residents, 3 months of synthetic events, 10 open maintenance requests, 5 pending bookings                              |
| **Trainee View**        | Trainees see a yellow "TRAINING" badge in the header                                                                           |
| **Progress Tracking**   | Admin can see which features each trainee has interacted with                                                                  |
| **No External Effects** | Training environments NEVER send real emails, SMS, or push notifications                                                       |
| **Guided Mode**         | Optional interactive tutorial overlays that walk trainees through key workflows                                                |
| **Assessment**          | Optional quiz/checklist at the end of training (ties into Training/LMS module)                                                 |
| **Cost**                | Included in all plans (training environments don't count toward unit limits)                                                   |

### 1.3 Technical Architecture

```
┌──────────────────────────────────────────────┐
│              Multi-Tenant Database            │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Property  │  │ Property  │  │ Demo     │   │
│  │ (Prod)    │  │ (Prod)    │  │ Property │   │
│  │ ID: abc   │  │ ID: def   │  │ ID: demo │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  Demo/Training properties are just regular    │
│  properties with a `type` flag:               │
│  - production                                 │
│  - demo (sales)                               │
│  - training (sandbox)                         │
│                                               │
│  Flags control:                               │
│  - Notification suppression (no real sends)   │
│  - Data reset capability                      │
│  - Auto-expiry                                │
│  - UI badges                                  │
│  - Billing exclusion                          │
└──────────────────────────────────────────────┘
```

**Key**: Demo/training environments are NOT separate infrastructure. They use the same multi-tenant architecture but with a `property_type` enum (`production`, `demo`, `training`). This keeps the codebase simple and ensures demos always reflect the real product.

### 1.4 Demo Data Seeder

A CLI tool and admin UI action that populates a demo environment:

```
pnpm demo:seed --template=maple-heights --property-id=xxx
pnpm demo:reset --property-id=xxx
pnpm demo:destroy --property-id=xxx
```

The seeder uses `@faker-js/faker` with a fixed seed for reproducible data.

---

## 2. Customer-Facing Website

### 2.1 Overview

A public marketing website that serves as the front door for Concierge. This is NOT part of the app — it's a separate deployment that links TO the app.

### 2.2 Site Map

```
concierge.com/
├── / ........................... Hero + value proposition
├── /features .................. Feature showcase with role-based tabs
├── /pricing ................... Plan comparison (Starter, Professional, Enterprise)
├── /demo ..................... Request a demo form → triggers sales demo environment
├── /about .................... Company story, team, mission
├── /blog ..................... Thought leadership, product updates
├── /contact .................. Contact form, support email, phone
├── /security ................. Security practices, compliance badges
├── /status ................... Live system status (links to status page)
├── /login .................... Universal login → routes to correct property portal
├── /privacy .................. Privacy policy
├── /terms .................... Terms of service
└── /[property-slug] .......... Custom vanity URL per property (e.g., concierge.com/maple-heights)
```

### 2.3 Login & Property Routing

The login experience is critical. Users belong to specific properties. The flow:

```
User visits concierge.com/login
         │
         ├─── Option A: Direct URL
         │    concierge.com/maple-heights → Pre-filled property
         │    Shows property logo + name
         │    User enters email + password
         │
         ├─── Option B: Email-based routing
         │    User enters email address first
         │    System looks up which property(ies) they belong to
         │    If 1 property → proceed to password
         │    If multiple → show property picker
         │    If none → "No account found" with sign-up CTA
         │
         └─── Option C: Property code
              User enters a 6-character property code (e.g., "MPL-HTS")
              Provided by their building admin during onboarding
              Routes to the correct property login
```

### 2.4 Vanity URLs per Property

Each property can optionally get a vanity URL:

- `concierge.com/maple-heights` → Login page pre-scoped to that property
- Shows the property's custom logo, name, and welcome message
- This URL goes on physical signage in the building lobby, welcome packages, etc.
- Admin configures this in Settings → Branding → Custom URL Slug

### 2.5 Pages Detail

#### Landing Page (/)

- **Hero**: "The modern way to manage your building" with a screenshot/video
- **Social proof**: "Trusted by 500+ properties across Canada"
- **Feature highlights**: 6 key features with icons
- **Role showcase**: "Built for everyone" — tabs showing Concierge, Security, Manager, Resident views
- **CTA**: "Request a Demo" (primary), "See Pricing" (secondary)
- **Footer**: Links, compliance badges (SOC 2, ISO 27001, PIPEDA)

#### Features Page (/features)

- **Role-based tabs**: Click a role → see that role's specific features
- **Module deep-dives**: Expandable sections for each major module
- **Comparison table**: "Why switch from [competitor type]?" — feature checkmarks
- **Interactive demo**: Embedded read-only demo walkthrough (uses demo environment)

#### Pricing Page (/pricing)

- **Three tiers**: Starter (< 50 units), Professional (50-300 units), Enterprise (300+ units)
- **Per-unit pricing**: Transparent pricing model
- **Feature matrix**: What's included in each tier
- **FAQ**: Common pricing questions
- **CTA**: "Start Free Trial" or "Contact Sales"

#### Security Page (/security)

- **Compliance badges**: SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, PIPEDA, GDPR, HIPAA
- **Architecture overview**: High-level security architecture (no implementation details)
- **Data handling**: Where data is stored, encryption standards, backup policy
- **Incident response**: SLA commitments
- **Penetration testing**: Annual pen test schedule
- **Bug bounty**: Responsible disclosure program

#### Request Demo Page (/demo)

- **Form fields**: Name, email, company, number of properties, number of units, current platform, phone (optional)
- **On submit**: Creates a demo environment → sends login credentials → schedules call with sales team
- **Instant access**: "Try it now" option that creates a self-serve demo immediately

### 2.6 Technical Implementation

| Aspect          | Decision                                                     |
| --------------- | ------------------------------------------------------------ |
| **Framework**   | Same Next.js 15 codebase, separate route group `(marketing)` |
| **Deployment**  | Same app, different layout — no separate repo needed         |
| **CMS**         | MDX for blog posts, hardcoded for static pages initially     |
| **Analytics**   | Privacy-respecting analytics (Plausible or PostHog)          |
| **SEO**         | Full metadata, Open Graph, structured data, sitemap.xml      |
| **Performance** | Static generation for marketing pages, dynamic for login     |
| **i18n**        | English and French (Canadian market requirement)             |

---

## 3. Onboarding & Setup Wizard

### 3.1 Problem

When a new property signs their contract, they need to go from zero to fully operational. This is currently a manual process with competitors — Concierge automates it.

### 3.2 Wizard Flow

```
Step 1: Property Details
├── Property name, address, type (condo, apartment, co-op)
├── Number of towers/buildings
├── Number of floors per building
├── Total unit count
├── Property logo upload
└── Timezone selection

Step 2: Unit Setup
├── Option A: Bulk import from CSV/Excel
├── Option B: Auto-generate (e.g., 101-120 for floor 1, 201-220 for floor 2...)
├── Option C: Manual entry
└── Unit fields: Number, floor, building, type (1BR/2BR/3BR/studio/penthouse), square footage

Step 3: Amenity Spaces
├── Add amenity spaces (party room, gym, pool, etc.)
├── Set capacity, hours, booking rules
├── Set pricing (free / per-hour / per-booking)
└── Templates: "Standard Condo" pre-fills common amenities

Step 4: Event Types
├── Start with recommended defaults (Package, Visitor, Incident, Cleaning, etc.)
├── Customize: add/remove types, change icons/colors
├── Set notification rules per type
└── Configure auto-close rules

Step 5: Staff Setup
├── Invite staff by email
├── Assign roles (Concierge, Security, Manager)
├── Set shift schedules (optional)
└── Configure notification preferences per role

Step 6: Resident Import
├── Option A: Bulk import from CSV (name, email, unit, move-in date)
├── Option B: Manual entry
├── Option C: Send invite links — residents self-register
├── Welcome email configuration
└── Set move-in dates for future residents

Step 7: Branding & Communication
├── Upload property logo
├── Set primary color (maps to interactive-primary)
├── Configure welcome email template
├── Set announcement preferences
├── Configure vanity URL slug
└── Lobby display settings (if applicable)

Step 8: Go Live
├── Review summary of everything configured
├── "Send Welcome Emails" toggle
├── "Activate Property" button
└── Confetti animation (yes, really — first impressions matter)
```

### 3.3 Time to Value

**Target**: A new property should go from sign-up to fully operational in under 30 minutes.
**Competitor benchmark**: Competitors require 2-5 days of manual setup with support calls.

---

## 4. Multi-Property Management

### 4.1 Problem

Property management companies manage 5-50+ buildings. They need a unified view across all their properties without logging in/out of each one.

### 4.2 Features

| Feature                         | Description                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Portfolio Dashboard**         | Roll-up metrics: total open maintenance requests, packages pending, incidents today — across ALL properties |
| **Property Switcher**           | Dropdown in the header to switch between properties instantly (no re-login)                                 |
| **Cross-Property Reports**      | Compare metrics between properties: response times, resident satisfaction, staff efficiency                 |
| **Centralized User Management** | One staff member can have roles across multiple properties (e.g., a roaming security guard)                 |
| **Unified Search**              | Search for a resident across all managed properties                                                         |
| **Bulk Announcements**          | Send the same announcement to all properties at once                                                        |
| **Standardized Settings**       | Push event types, notification templates, or amenity rules from one property to all                         |
| **Staff Redeployment**          | Move/assign staff between properties from one interface                                                     |

### 4.3 Access Model

```
ManagementCompany (optional top-level entity)
├── Property A (200 units)
├── Property B (150 units)
├── Property C (300 units)
└── Property D (100 units)

Users have roles PER property:
- Jane: Property Manager at A, B, C, D (full access everywhere)
- Mike: Concierge at A and B (front desk at two buildings)
- Sarah: Security at C only
- Board: Board Members only see their own building
```

---

## 5. White-Label & Branding

### 5.1 Customization Levels

| Element             | What Admin Controls                                          |
| ------------------- | ------------------------------------------------------------ |
| **Logo**            | Property logo in sidebar, login page, emails, and mobile app |
| **Primary Color**   | Accent color mapped to `--concierge-color-primary-*` tokens  |
| **Property Name**   | Displayed in header, emails, and generated documents         |
| **Vanity URL**      | `concierge.com/[slug]` for property-specific login           |
| **Welcome Message** | Custom text on the login page                                |
| **Email Templates** | Customize email header/footer with property branding         |
| **Favicon**         | Custom favicon for browser tab                               |
| **Mobile App Name** | White-labeled PWA with property name (Enterprise tier)       |

### 5.2 Design Token Override

Branding works by overriding CSS custom properties at the property level:

```css
/* Default (Concierge brand) */
:root {
  --concierge-color-primary-500: oklch(0.55 0.19 250);
}

/* Property override (loaded dynamically) */
:root {
  --concierge-color-primary-500: oklch(0.48 0.16 145); /* Property's green */
}
```

This means the entire UI recolors itself based on the property's brand — no code changes needed.

---

## 6. Subscription & Billing

### 6.1 Plan Tiers

| Tier             | Unit Range   | Price         | Features                                                               |
| ---------------- | ------------ | ------------- | ---------------------------------------------------------------------- |
| **Starter**      | 1-50 units   | $X/unit/month | Core features: events, packages, maintenance, amenities, announcements |
| **Professional** | 51-300 units | $Y/unit/month | + Training/LMS, advanced reports, vendor compliance, 2FA, API access   |
| **Enterprise**   | 300+ units   | Custom        | + White-label, multi-property dashboard, SLA, dedicated support, SSO   |

### 6.2 Billing Features

- Monthly or annual billing (annual = 2 months free)
- Invoice generation and history
- Payment method management (credit card via Stripe)
- Usage tracking (units, storage, API calls)
- Upgrade/downgrade with prorated charges
- Dunning management (failed payment recovery)
- Tax handling (Canadian GST/HST)

### 6.3 Admin Billing Dashboard

```
Settings → Billing
├── Current Plan: Professional (150 units)
├── Next Invoice: $X on April 1, 2026
├── Payment Method: Visa ending 4242
├── Usage This Month
│   ├── Units: 147 / 300
│   ├── Storage: 12.4 GB / 50 GB
│   └── API Calls: 45,200 / 100,000
├── Invoice History (downloadable PDF)
└── Change Plan / Cancel
```

---

## 7. Help Center & Knowledge Base

### 7.1 In-App Help

| Feature                         | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| **Help Drawer**                 | `?` icon in the header opens a slide-out help panel         |
| **Contextual Help**             | Shows articles relevant to the current page                 |
| **Search**                      | Full-text search across all help articles                   |
| **Video Tutorials**             | Embedded how-to videos for key workflows                    |
| **Tooltips**                    | `(i)` icons on complex form fields with inline explanations |
| **Keyboard Shortcut Reference** | `?` key opens shortcut cheat sheet                          |

### 7.2 External Knowledge Base

- Public-facing at `help.concierge.com`
- Role-based article filtering (show Resident vs Staff articles)
- AI-powered search (natural language queries)
- Community forum for property managers
- Release notes and changelog

---

## 8. Status Page

### 8.1 Purpose

Properties depend on Concierge for daily operations. When the platform has issues, they need to know immediately — not discover it when a resident complains.

### 8.2 Features

- Real-time status for all services (Web App, API, Email, SMS, Push, Database)
- Incident timeline with updates
- Scheduled maintenance announcements
- Email/SMS subscription for status updates
- 90-day uptime history
- Response time metrics

### 8.3 Implementation

Use a service like Betterstack, Statuspage.io, or build custom using the health check endpoints already in the scaffold (`/api/health` and `/api/health/detailed`).

---

## 9. Developer Portal & API

### 9.1 Purpose

Enterprise customers and integration partners need programmatic access to Concierge data.

### 9.2 Scope (v2+)

| API Category      | Endpoints                              |
| ----------------- | -------------------------------------- |
| **Properties**    | CRUD, settings, branding               |
| **Units**         | CRUD, occupant history, instructions   |
| **Residents**     | CRUD, contact info, emergency contacts |
| **Events**        | Create, list, update, close events     |
| **Packages**      | Log, notify, release packages          |
| **Maintenance**   | Create, assign, update requests        |
| **Amenities**     | List spaces, create/cancel bookings    |
| **Announcements** | Create, distribute, track read rates   |
| **Reports**       | Generate and download reports          |

### 9.3 Developer Portal Features

- Interactive API documentation (OpenAPI/Swagger)
- API key management (per-property)
- Rate limiting dashboard
- Webhook configuration (event-driven integrations)
- SDKs (JavaScript, Python)
- Sandbox environment for testing

---

## 10. Data Import & Export

### 10.1 Import (Onboarding)

Support importing data from competitor platforms:

| Data Type           | Import Format | Validation                               |
| ------------------- | ------------- | ---------------------------------------- |
| Units               | CSV, Excel    | Unit number uniqueness, floor range      |
| Residents           | CSV, Excel    | Email format, phone format, unit mapping |
| Packages            | CSV           | Date parsing, unit mapping               |
| Maintenance History | CSV           | Category mapping, status mapping         |
| FOB/Key Records     | CSV           | Serial number format                     |
| Emergency Contacts  | CSV           | Resident mapping, phone format           |

### 10.2 Export (Compliance + Portability)

Per PIPEDA and GDPR, users have the right to export their data:

| Export Type                 | Who Can Export            | Format                           |
| --------------------------- | ------------------------- | -------------------------------- |
| Personal data (PIPEDA/GDPR) | Any user (their own data) | JSON or CSV                      |
| Property data               | Admin                     | Excel workbook (multiple sheets) |
| Audit logs                  | Super Admin               | CSV with digital signature       |
| Reports                     | Manager, Board, Admin     | PDF or Excel                     |
| Full property backup        | Super Admin               | Encrypted ZIP archive            |

---

## 11. Compliance & Audit Reports

### 11.1 Built-In Compliance Reports

| Report                    | Purpose                                             | Frequency            |
| ------------------------- | --------------------------------------------------- | -------------------- |
| **Access Audit**          | Who accessed what data and when                     | Monthly or on-demand |
| **Login Activity**        | All login attempts with IP, device, success/failure | Always available     |
| **Data Retention**        | What data is being retained and for how long        | Quarterly            |
| **Privacy Impact**        | PII access summary per role                         | Annual or on-demand  |
| **Incident Response**     | Security incident timeline and resolution           | Per incident         |
| **Consent Records**       | Resident consent for data processing                | Always available     |
| **Data Subject Requests** | PIPEDA/GDPR request log and response times          | Always available     |
| **Vendor Compliance**     | Insurance and certification status for all vendors  | Monthly              |

---

## 12. Implementation Priority

### Phase 1 (MVP — Build Now)

1. Property routing and login flow (vanity URLs)
2. Demo environment architecture (property_type flag)
3. Basic marketing pages (landing, login, pricing)
4. Onboarding wizard (Steps 1-6)

### Phase 2 (Post-Launch)

5. Demo data seeder (full mock data package)
6. Training sandbox mode
7. Multi-property switcher
8. Help center (in-app drawer)
9. Billing integration (Stripe)

### Phase 3 (Scale)

10. White-label branding engine
11. Developer portal and public API
12. Status page
13. Data import/export tools
14. Compliance report generator
15. Knowledge base
16. Multi-language support (French)

## 13. Cross-References to PRDs

Every business operations feature is now fully specified in a dedicated PRD:

| Business Operation                  | PRD    | Lines  |
| ----------------------------------- | ------ | ------ |
| Demo Environment (Sales + Training) | PRD 21 | ~950   |
| Marketing Website & Login Routing   | PRD 22 | ~1,000 |
| Onboarding Wizard (8-step setup)    | PRD 23 | ~750   |
| Billing & Subscription (Stripe)     | PRD 24 | ~780   |
| Help Center & Knowledge Base        | PRD 25 | ~600   |
| Developer Portal & Public API       | PRD 26 | ~760   |
| Data Migration (Import/Export/DSAR) | PRD 27 | ~1,290 |
| Compliance Reports & Monitoring     | PRD 28 | ~1,400 |

Supporting technical documentation:

- `docs/tech/INTERNATIONALIZATION.md` -- i18n strategy (en + fr-CA)
- `docs/tech/FEATURE-FLAGS.md` -- Per-property feature flag system
- `docs/tech/ANALYTICS-FRAMEWORK.md` -- Privacy-respecting product analytics
- `docs/tech/DATA-QUALITY.md` -- Validation, duplicate detection, quality scoring
- `docs/tech/TESTING-STRATEGY.md` -- Testing pyramid, CI/CD, security testing

---

_Last updated: 2026-03-16_
_Author: Concierge Product Team_
