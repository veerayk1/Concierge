# Concierge PRD -- Master Index

| Field       | Value                          |
|-------------|--------------------------------|
| Product     | Concierge                      |
| Version     | v1.0-draft                     |
| Date        | 2026-03-14                     |
| Author      | Concierge Product Team         |

---

## What is Concierge

Concierge is a next-generation condo and building management portal designed to replace legacy platforms with AI-native intelligence, role-aware interfaces, and Apple-grade design. It combines the strongest capabilities observed across the industry -- unified event logging, deep maintenance workflows, modern security consoles, staff training, and community engagement -- into a single product that adapts to every role in a building's operation.

The core thesis: one platform that serves the front desk concierge, the security guard, the property manager, the board member, and the resident -- each seeing exactly what they need, nothing more.

---

## How to Read This PRD

This PRD is organized into **21 files** (numbered 00 through 20). Each module document follows a standard template with **11 sections**:

| #  | Section                  | Purpose                                                        |
|----|--------------------------|----------------------------------------------------------------|
| 1  | Overview                 | What this module does and why it exists                        |
| 2  | Research Summary         | Key findings from competitive analysis that shaped decisions   |
| 3  | Feature Spec             | Detailed feature list with acceptance criteria                 |
| 4  | Data Model               | Entity definitions, fields, relationships                     |
| 5  | User Flows               | Step-by-step workflows for each role                           |
| 6  | UI/UX                    | Wireframe guidance, layout rules, component usage              |
| 7  | AI Integration           | Where intelligence is embedded in this module                  |
| 8  | Analytics                | Operational, performance, and AI insight layers                |
| 9  | Notifications            | Channels, triggers, templates, and preference rules            |
| 10 | API                      | Endpoints, payloads, authentication, rate limits               |
| 11 | Completeness Checklist   | Verification that every requirement is addressed               |

Read **00 (this file)** and **01 (Architecture)** first. Then read any module in any order -- they are designed to be self-contained.

---

## PRD File Index

| #  | File                          | Module               | Description                                                              | Phase      |
|----|-------------------------------|----------------------|--------------------------------------------------------------------------|------------|
| 00 | `00-prd-index.md`             | Index                | This file -- master index and reading guide                              | Foundation |
| 01 | `01-architecture.md`          | Architecture         | Unified event model, data architecture, API design patterns              | Foundation |
| 02 | `02-roles-and-permissions.md` | RBAC                 | Role definitions, permission matrix, access hierarchy                    | Foundation |
| 03 | `03-security-console.md`      | Security Console     | Unified event logging, 7+ entry types, shift log, incident management   | Core       |
| 04 | `04-package-management.md`    | Package Management   | Package lifecycle, courier integration, batch intake, release flow       | Core       |
| 05 | `05-maintenance.md`           | Maintenance          | Service requests, 43 categories, vendor assignment, equipment linkage    | Core       |
| 06 | `06-amenity-booking.md`       | Amenity Booking      | Reservations, calendar views, payment, approval workflow                 | Core       |
| 07 | `07-unit-management.md`       | Unit Management      | Unit file, resident profiles, custom fields, front desk instructions     | Core       |
| 08 | `08-user-management.md`       | User Management      | Account lifecycle, onboarding, 2FA, login audit trail                    | Core       |
| 09 | `09-communication.md`         | Communication        | Announcements, multi-channel notifications, emergency broadcast          | Core       |
| 10 | `10-reports-analytics.md`     | Reports & Analytics  | Report builder, 39+ report types, AI-powered insights                    | Extended   |
| 11 | `11-training-lms.md`          | Training / LMS       | Learning paths, courses, quizzes, team progress tracking                 | Extended   |
| 12 | `12-community.md`             | Community            | Classified ads, idea board, events, library, discussion forum            | Extended   |
| 13 | `13-parking.md`               | Parking              | Visitor parking, permits, violations, enforcement lifecycle              | Extended   |
| 14 | `14-dashboard.md`             | Dashboard            | Role-aware dashboards, widgets, KPIs, real-time badges                   | Core       |
| 15 | `15-search-navigation.md`     | Search & Navigation  | Global search (Cmd+K), role-aware nav, quick actions                     | Core       |
| 16 | `16-settings-admin.md`        | Settings & Admin     | System configuration, 12+ settings tabs, property setup                  | Platform   |
| 17 | `17-mobile-responsive.md`     | Mobile & Responsive  | Responsive design, PWA, offline capability                               | Platform   |
| 18 | `18-integrations.md`          | Integrations         | Stripe, Twilio, SendGrid, Firebase, webhooks, API ecosystem              | Platform   |
| 19 | `19-ai-framework.md`          | AI Framework         | AI philosophy, 105 capabilities, dual provider, cost management          | Foundation |
| 20 | `20-innovation-roadmap.md`    | Innovation           | 32 features no competitor has -- our differentiators                     | Platform   |

---

## Version Priority

### v1 -- Core

The minimum product that can replace a legacy platform in a live building.

| Module                | File | Notes                                      |
|-----------------------|------|--------------------------------------------|
| Architecture          | 01   | Unified event model, API patterns          |
| Roles & Permissions   | 02   | Full RBAC from day one                     |
| Security Console      | 03   | 7+ entry types, shift log, incidents       |
| Package Management    | 04   | Full lifecycle with courier integration    |
| Maintenance           | 05   | Requests, categories, vendor assignment    |
| Amenity Booking       | 06   | Calendar, payment, approval workflow       |
| Unit Management       | 07   | Unit file, resident profiles, instructions |
| User Management       | 08   | Accounts, onboarding, 2FA                 |
| Communication         | 09   | Announcements, multi-channel notifications |
| Dashboard             | 14   | Role-aware dashboards with live badges     |
| Search & Navigation   | 15   | Global search, role-aware nav              |
| Settings (basic)      | 16   | Property setup, event type configuration   |
| AI Framework          | 19   | Core AI capabilities embedded in v1 modules|

### v2 -- Extended

Operational depth and community features.

| Module                | File | Notes                                         |
|-----------------------|------|-----------------------------------------------|
| Reports & Analytics   | 10   | Advanced report builder, AI insights          |
| Training / LMS        | 11   | Staff training, quizzes, progress tracking    |
| Community             | 12   | Classified ads, idea board, events, library   |
| Parking (full)        | 13   | Permits, violations, enforcement lifecycle    |
| Settings (advanced)   | 16   | Full configuration suite                      |
| Mobile app            | 17   | PWA with offline capability                   |
| Integrations          | 18   | Full third-party ecosystem                    |

### v3+ -- Innovation

Capabilities that do not exist in any competing product today.

- AI daily briefing for property managers (auto-generated shift summary)
- Predictive analytics (maintenance forecasting, occupancy trends)
- Voice-to-text incident reporting
- Digital signage integration (lobby screens, elevator displays)
- Multi-property portfolio management with cross-building analytics
- Resident sentiment analysis from maintenance and communication patterns
- Automated compliance monitoring and alerting

---

## Key Product Principles

1. **AI-native.** Intelligence is embedded at every interaction -- auto-categorization, smart suggestions, anomaly detection, natural language search. It is not a bolt-on feature.

2. **Role-aware.** Every screen adapts to who is looking at it. A concierge sees package intake and visitor logs. A board member sees financials and governance. No one sees 60 menu items.

3. **Apple-grade design.** White backgrounds, clean typography, generous spacing, progressive disclosure. Color is reserved for status and actions. One primary action per screen.

4. **Analytics-first.** Every module ships with three layers: operational metrics (what happened), performance metrics (how well), and AI insights (what to do about it).

5. **One primary action per screen.** If two CTAs compete for attention, the design is wrong. Redesign until there is a clear hierarchy.

6. **Every field earns its place.** If a field is not used 80% of the time, it is hidden behind progressive disclosure. Default forms are lean.

7. **Multi-channel from day one.** Email, SMS, push, and voice are supported at launch. Residents choose their preferred channels. No email-only dead ends.

8. **Configurable, not hardcoded.** Event types, custom fields, notification templates, categories, and workflows are all admin-configurable. No code changes required to adapt to a new building.

---

## Research Foundation

This PRD is grounded in exhaustive competitive analysis of **3 industry-leading condo and building management platforms**, conducted through direct observation of live production environments. The research covers:

- **800+ fields** documented across all modules
- **150+ features** compared in a three-way feature matrix
- **46 internal research documents** totaling approximately 10,000 lines
- **3 distinct architectural approaches** analyzed (legacy server-rendered, hybrid SPA, and modern SPA)
- **5 user roles** observed in production (admin, property manager, concierge, security, resident)

The internal `docs/` directory contains the complete research corpus for team members who need source material. The `PLATFORM-COMPARISON.md` file provides the consolidated three-way feature matrix with Concierge decisions for every feature.

---

## Stakeholders

| Role              | Name         | Responsibility                                    |
|-------------------|--------------|---------------------------------------------------|
| Product Owner     | TBD          | Feature prioritization, acceptance criteria        |
| Engineering Lead  | TBD          | Architecture decisions, technical feasibility      |
| Design Lead       | TBD          | Design system enforcement, UX quality              |
| QA Lead           | TBD          | Test strategy, acceptance testing, regression      |

---

*This is a living document. Update the index table whenever a new PRD file is added or restructured.*
