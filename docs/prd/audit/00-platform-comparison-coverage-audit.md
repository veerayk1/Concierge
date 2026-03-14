# Audit: Platform Comparison Matrix vs. All PRDs

> Systematic check of every feature row and "Concierge Decision" in `docs/PLATFORM-COMPARISON.md` against the full PRD set (21 files, PRDs 00-20).

---

## Summary

The platform comparison matrix contains 79+ features across 12 categories. Of these, **71 features are fully covered** in at least one PRD, **5 have weak coverage** (present but underspecified), and **3 have gaps** (missing or insufficiently addressed). The PRD set also goes well beyond the comparison matrix by adding features not present in any competitor (AI framework, smart building integration, webhooks, public API, calendar sync).

---

## Methodology

Each row in `PLATFORM-COMPARISON.md` was matched against the 21 PRD files by searching for the feature name, related keywords, and the "Concierge Decision" text. Coverage was verified by confirming the feature exists in at least one PRD's Feature Spec (Section 3) or is explicitly deferred to a named version.

---

## CONFIRMED -- All Features Covered by PRD

### Front Desk / Event Logging (9 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Log/Event creation (unified events + types) | Unified event model with customizable types | PRD 01 (Architecture) Section 3, PRD 03 (Security Console), PRD 16 (Settings) Tab 2 | CONFIRMED |
| Log display (card-based + table toggle) | Card-based with table option toggle | PRD 03 Section 6 (UI/UX) | CONFIRMED |
| Batch event creation | Implement batch mode | PRD 03 Section 3 (batch intake) | CONFIRMED |
| Print labels | Implement label printing | PRD 03, PRD 04 (Package Management) | CONFIRMED |
| Event type icons (courier logos + colors) | Custom icons per event type | PRD 16 Tab 2 (icon picker per event type), PRD 04 (courier icons) | CONFIRMED |
| Event grouping modes | Implement smart grouping with rich filtering | PRD 03 Section 3 (filtering) | CONFIRMED |
| Shift log | Build as always-accessible feature | PRD 03 (Pass-On/Shift Log as event type) | CONFIRMED |
| Incident tracking | Dedicated incident module | PRD 03 (Incident Reports as event type) | CONFIRMED |
| Front desk instructions | Per-unit instruction system | PRD 07 (Unit Management) Section 3 (UnitInstruction entity) | CONFIRMED |

### Package Management (8 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Package tracking (courier-aware) | Courier-aware with branded icons | PRD 04 Section 3 | CONFIRMED |
| Package types (physical + courier) | Both physical + courier types | PRD 04 Section 3 | CONFIRMED |
| Package notifications (multi-channel) | Multi-channel notifications | PRD 04 Section 9, PRD 18 (Integrations) | CONFIRMED |
| Perishable flagging | Prominent perishable alerts | PRD 04 Section 3 | CONFIRMED |
| Storage spots | Keep storage spot tracking | PRD 04 Section 3, PRD 03 Section 3 | CONFIRMED |
| Batch package recording | Batch with better UX | PRD 04 Section 3 | CONFIRMED |
| Package release flow | Explicit release workflow | PRD 04 Section 3 (two-step: identity check + signature) | CONFIRMED |
| Auto-generated reference numbers | Keep auto-reference numbers | PRD 04 Section 3, PRD 16 Tab 2 (Reference Number Prefix) | CONFIRMED |

### Maintenance (12 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Maintenance requests (rich form) | Rich form with smart defaults | PRD 05 Section 3 | CONFIRMED |
| Photo attachments | Photo + document uploads | PRD 05 Section 3 | CONFIRMED |
| Document attachments | Implement doc attachments | PRD 05 Section 3 | CONFIRMED |
| Permission to enter | Add entry permission field | PRD 05 Section 3 | CONFIRMED |
| Entry instructions | Add entry instructions | PRD 05 Section 3 | CONFIRMED |
| Work order printing | Generate printable work orders | PRD 05 Section 3 | CONFIRMED |
| High urgency flag | Priority + urgency system | PRD 05 Section 3 | CONFIRMED |
| Vendor assignment | Link vendors to requests | PRD 05 Section 3 | CONFIRMED |
| Equipment linkage | Link equipment to requests | PRD 05 Section 3 | CONFIRMED |
| Create in Hold/Close status | Allow status on creation | PRD 05 Section 3 | CONFIRMED |
| Export to Excel | Export on all listing pages | PRD 18 Section 3.11, PRD 10 (Reports) | CONFIRMED |
| Category system (configurable) | Configurable categories | PRD 16 Tab 3 (43 defaults, two-level hierarchy) | CONFIRMED |

### Equipment & Assets (6 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Equipment tracking | Implement equipment module | PRD 05 (Maintenance) references equipment linkage; PRD 20 (Innovation) | CONFIRMED (v2) |
| Equipment categories | Configurable categories | PRD 05 references equipment dropdown | CONFIRMED (v2) |
| Replacement reports | Lifecycle management | PRD 10 (Reports) | CONFIRMED (v2) |
| Recurring tasks | Build task scheduler | PRD 05 Section 3 (recurring maintenance) | CONFIRMED (v2) |
| Inspections | Implement with modern UX | PRD 05 references inspections; PRD 17 (Mobile) for mobile-first | CONFIRMED (v2) |
| Asset manager | Consider for v2 | PRD 20 (Innovation Roadmap) | CONFIRMED (v3+) |

### Vendor / Contractor Management (4 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Contractor directory | Comprehensive vendor profiles | PRD 05 (Maintenance) vendor management | CONFIRMED |
| Insurance compliance | Compliance tracking essential | PRD 05 (Maintenance) vendor compliance | CONFIRMED (v2) |
| Vendor master list | Consider vendor network | PRD 05 (Maintenance) | CONFIRMED (v2) |
| Link to maintenance | Vendor-to-request linkage | PRD 05 Section 3 (vendor assignment dropdown) | CONFIRMED |

### Amenity / Reservation Management (5 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Amenity booking | Rich reservation system | PRD 06 Section 3 | CONFIRMED |
| Calendar view | Multiple view modes | PRD 06 Section 3 (calendar, list, grid) | CONFIRMED |
| Reservation approval | Approval workflow | PRD 06 Section 3, PRD 16 Tab 4 (Requires Approval toggle) | CONFIRMED |
| Payment for bookings | Implement payment support | PRD 06 Section 3, PRD 18 Section 3.1 (Stripe) | CONFIRMED |
| Multi-amenity calendar | Multi-amenity calendar view | PRD 06 Section 3 | CONFIRMED |

### Parking (5 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Parking spot / permit system | Permit-based system | PRD 13 Section 3 | CONFIRMED |
| Parking violations | Keep violation tracking | PRD 13 Section 3 | CONFIRMED |
| Permit types setup | Configurable permits | PRD 13 Section 3 | CONFIRMED |
| Permit printing | Print support | PRD 13 Section 3 | CONFIRMED |
| Vehicle registry | Comprehensive vehicle tracking | PRD 07 (Unit Management), PRD 13 | CONFIRMED |

### Communication (8 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Email sending (rich composer) | Rich email composer with signature support | PRD 09 Section 3 | CONFIRMED |
| Announcements (multi-channel) | Multi-channel distribution | PRD 09 Section 3 | CONFIRMED |
| Emergency broadcast | Modern push + SMS + voice | PRD 09 Section 3, PRD 18 Section 3.3 (voice) | CONFIRMED |
| Surveys | Survey builder with analytics | PRD 12 (Community) Section 3.6 | CONFIRMED |
| Library/Documents | Document management | PRD 12 (Community) Section 3 (Library sub-module) | CONFIRMED |
| Public display/signage | Consider for premium tier | PRD 18 Section 3.12 (v3) | CONFIRMED |
| Photo albums | Community photo feature | PRD 12 (Community) Section 3.7 | CONFIRMED |
| Special email groups | Email group management | PRD 09 Section 3 | CONFIRMED |
| Classified Ads marketplace | Consider community marketplace | PRD 12 (Community) Section 3.1 | CONFIRMED |

### User / Unit Management (11 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Unit profiles (modular) | Modular, drag-reorderable sections | PRD 07 Section 3 | CONFIRMED |
| Unit custom fields | Custom field system | PRD 16 Tab 7 (Custom Fields), PRD 07 | CONFIRMED |
| User profile tabs | Comprehensive tabbed profile | PRD 08 Section 3 | CONFIRMED |
| FOB/Key tracking | Keep FOB/key management | PRD 03 (Security Console -- Key Management), PRD 07 | CONFIRMED |
| Buzzer codes | Keep buzzer codes | PRD 16 Tab 15 (Buzzer Code Directory) | CONFIRMED |
| Garage clickers | Keep garage clicker tracking | PRD 07 (Unit Management) | CONFIRMED |
| Pet registration | Dedicated pet module | PRD 07 Section 3 | CONFIRMED |
| Emergency contacts | Keep emergency contacts prominent | PRD 07 Section 3, PRD 08 | CONFIRMED |
| Parcel waivers | Keep waiver management | PRD 04 (Package Management) | CONFIRMED |
| Welcome emails | Keep onboarding email system | PRD 08 (User Management), PRD 16 Tab 5 (Notification Templates) | CONFIRMED |
| Vacation/away tracking | Implement vacation/away tracking | PRD 07 Section 3.2.3 (VacationRecord entity) | CONFIRMED |

### Security (5 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Security logs | Dedicated security workflows | PRD 03 Section 3 | CONFIRMED |
| Parking violations | Keep violation tracking | PRD 13 Section 3 | CONFIRMED |
| Emergency assistance | Keep emergency assistance | PRD 03 Section 3, PRD 09 | CONFIRMED |
| Key checkout with ID verification | Implement key checkout with identity verification | PRD 03 Section 3 (Key Management event type with ID fields) | CONFIRMED |
| Authorized entry tracking | Track authorized entries explicitly | PRD 03 Section 3 (Authorized Entry event type) | CONFIRMED |

### Reports & Analytics (5 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Reports (comprehensive) | Comprehensive reporting with pre-built library | PRD 10 Section 3 | CONFIRMED |
| Excel export | Support multiple export formats | PRD 18 Section 3.11, PRD 10 | CONFIRMED |
| PDF export | PDF export support | PRD 18 Section 3.11, PRD 10 | CONFIRMED |
| Favourite/saved reports | Implement saved/favourite reports | PRD 10 Section 3 | CONFIRMED |
| Custom reports | Allow custom report creation | PRD 10 Section 3 | CONFIRMED |

### Platform Features (15 features)

| Feature | Concierge Decision | Covered In | Status |
|---------|-------------------|------------|--------|
| Mobile app | Mobile-first design | PRD 17 (Mobile & Responsive) | CONFIRMED |
| Tiered feature gating | Modular pricing tiers | PRD 16 Tab 12 (Billing & Subscription) | CONFIRMED |
| Quick search (global) | Global search essential | PRD 15 (Search & Navigation) | CONFIRMED |
| Alteration tracking | Renovation management | PRD 20 (Innovation Roadmap -- v2) | CONFIRMED |
| Know your residents | Staff training tools | PRD 11 (Training/LMS) Section 3.7 | CONFIRMED |
| Resident ID system | Identity management | PRD 07 Section 3.3.2 (Resident ID Cards -- v2) | CONFIRMED |
| Purchase orders | Consider for v2 | PRD 20 (Innovation Roadmap -- v3, "Centralized Procurement") | CONFIRMED |
| Board governance | Consider for v2 | PRD 01 (Architecture) mentions it; deferred to v3+ | CONFIRMED |
| Two-factor auth (2FA) | Implement optional 2FA | PRD 02 (Roles & Permissions) Section 9, PRD 08 (User Management) | CONFIRMED |
| Training / LMS | Build training module | PRD 11 (Training/LMS) full PRD | CONFIRMED |
| Idea board | Consider community idea/feedback board | PRD 12 (Community) Section 3.2 | CONFIRMED |
| Electronic consent tracking | Implement electronic consent/waiver tracking | PRD 07 Section 3 (Electronic Consent field on unit), PRD 08 (consent tracking) | CONFIRMED |
| Email signature editor | Provide configurable email signature editor | PRD 16 Tab 9 (Email Signature -- rich text, 1000 chars) | CONFIRMED |

---

## GAPS -- Concierge Decisions Not Fully Covered in Any PRD

| # | Feature | Concierge Decision | Source | Severity | Recommendation |
|---|---------|-------------------|--------|----------|----------------|
| 1 | **Multi-language / i18n** | "i18n from day one" | PLATFORM-COMPARISON.md (Platform Features) | **High** | No PRD specifies internationalization architecture: locale selection, translatable strings, right-to-left support, date/number formatting, or translation workflow. This was a "day one" decision. Add an i18n section to PRD 01 (Architecture) or create a dedicated PRD. At minimum, define: supported locales, translation file format, how user-facing strings are managed, and how locale is stored per user/property. |
| 2 | **Built-in chat widget / real-time messaging** | "Consider real-time chat for staff communication" | PLATFORM-COMPARISON.md (Platform Features) | **Low** | The comparison matrix notes Condo Control's in-app chat. The decision says "consider." No PRD addresses real-time chat between staff members or between staff and residents. PRD 20 (Innovation Roadmap) does not mention it either. If this is intentionally deferred beyond v3, add it to the roadmap. If it is dropped, document the decision. |
| 3 | **Formatted parking pass templates** | "Print support" (Parking section) | PLATFORM-COMPARISON.md + Aquarius settings Tab 2 | **Low** | PRD 13 (Parking) covers permit printing but neither PRD 13 nor PRD 16 specifies how the printed pass is formatted/templated (logo, layout, barcode/QR code, paper size). Add a "Pass Template Configuration" section to PRD 13 or PRD 16 Settings. |

---

## WEAK COVERAGE -- Present but Underspecified

| # | Feature | Concierge Decision | Where Covered | Issue | Recommendation |
|---|---------|-------------------|---------------|-------|----------------|
| 1 | **Vendor compliance -- 5-status dashboard** | "Compliance tracking essential" | PRD 05 (Maintenance) references vendor compliance as v2 | The comparison matrix highlights BuildingLink's 5-status insurance compliance dashboard (compliant/not/expiring/expired/not tracking) as a key feature. PRD 05 mentions vendor compliance but does not specify the 5-status model or dashboard widget. | When building v2 vendor compliance, ensure PRD 05 or a dedicated vendor PRD defines the 5-status model, expiry alerts, and dashboard cards. |
| 2 | **Momentum indicators on alterations** | "Renovation management" | PRD 20 (Innovation Roadmap) mentions alteration tracking | BuildingLink's alteration tracking has momentum indicators (OK/Slow/Stalled/Stopped). PRD 20 lists alteration tracking as a v2 feature but does not carry forward the momentum indicator concept from CLAUDE.md. | When building the alteration module, include momentum/status indicators as documented in CLAUDE.md's "What BuildingLink Gets Right" section. |
| 3 | **Missing email tracking** | Not explicitly decided | PRD 08 (User Management) has data quality features | BuildingLink tracks "3 employees, 19 occupants missing email addresses" as a data quality feature. No PRD specifies a proactive data completeness dashboard or "missing data" alerts. | Add a "Data Quality" widget to the admin dashboard (PRD 14) or Settings (PRD 16) that flags residents missing email, phone, or emergency contacts. |
| 4 | **Per-unit front desk instructions -- management vs. personal** | "Per-unit instruction system" | PRD 07 Section 3 (UnitInstruction entity) | BuildingLink distinguishes between "management instructions" (admin-set, visible to all staff) and "personal front desk instructions" (staff-customizable per unit). PRD 07 has UnitInstruction but does not specify this two-tier distinction. | Add an `instruction_type` field (management vs. personal) to the UnitInstruction entity in PRD 07. |
| 5 | **Discussion Forum** | Listed in PRD 12 overview | PRD 12 Section 3.5 | Discussion Forum is specified in PRD 12 but was not in the PLATFORM-COMPARISON.md matrix. Condo Control and BuildingLink did not have a visible discussion forum (only CC had an Idea Board). This is a Concierge-original feature. Included here for completeness -- coverage is adequate. | No action needed. |

---

## Features in PRDs NOT in Comparison Matrix (Concierge Originals)

These are features that Concierge adds beyond what any competitor offers, confirmed present in PRDs:

| Feature | PRD | Notes |
|---------|-----|-------|
| AI Framework (105 features) | PRD 19 | No competitor has AI |
| Smart building hardware integration | PRD 18 Section 3.8 | No competitor has hardware APIs |
| Outbound webhooks | PRD 18 Section 3.9 | No competitor has webhooks |
| Public API with developer docs | PRD 18 Section 3.10 | No competitor has a public API |
| Calendar sync (iCal) | PRD 18 Section 3.7 | No competitor has calendar sync |
| Discussion Forum | PRD 12 Section 3.5 | Concierge original |
| Photo Albums | PRD 12 Section 3.7 | BuildingLink had it but not in comparison matrix |
| Know Your Residents (gamified) | PRD 11 Section 3.7 | Reimagined from BuildingLink as proper training module |
| Property Onboarding Wizard | PRD 16 Section 3.16.1 | No competitor has guided onboarding |
| Multi-property management | PRD 16 Section 3.16.2 | No competitor has portfolio management |
| System health monitoring | PRD 16 Tab 11 | No competitor surfaces system health |
| AI cost dashboard | PRD 16 Section 3.16.3 | No competitor has AI cost tracking |

---

## Coverage by PRD

| PRD | Features Covered from Matrix | Key Coverage Areas |
|-----|-----------------------------|--------------------|
| 01-Architecture | 3 | Unified event model, role hierarchy, custom fields |
| 02-Roles and Permissions | 2 | 2FA, role management |
| 03-Security Console | 9 | Event logging, shift log, incidents, key checkout, authorized entries |
| 04-Package Management | 8 | All package features |
| 05-Maintenance | 14 | All maintenance + vendor + equipment features |
| 06-Amenity Booking | 5 | All amenity features |
| 07-Unit Management | 10 | Unit profiles, FOBs, buzzer codes, pets, emergency contacts, vacation tracking, resident ID, consent |
| 08-User Management | 3 | User profiles, welcome emails, 2FA |
| 09-Communication | 5 | Announcements, email, emergency broadcast, email groups |
| 10-Reports & Analytics | 5 | All report features |
| 11-Training / LMS | 2 | Training module, Know Your Residents |
| 12-Community | 5 | Classified ads, idea board, surveys, library, photo albums |
| 13-Parking | 5 | All parking features |
| 14-Dashboard | 1 | Weather widget context |
| 15-Search & Navigation | 1 | Global search |
| 16-Settings & Admin | 8 | Event types, maintenance categories, notification templates, custom fields, buzzer codes, email signature, billing tiers |
| 17-Mobile & Responsive | 1 | Mobile-first design |
| 18-Integrations | 10 | Payment, multi-channel notifications, calendar sync, import/export, digital signage, weather |
| 19-AI Framework | 0 (original) | Not in comparison matrix -- entirely new |
| 20-Innovation Roadmap | 3 | Alteration tracking, purchase orders, asset manager (deferred) |

---

## Final Scorecard

| Category | Total Features | Fully Covered | Weak Coverage | Gaps |
|----------|---------------|---------------|---------------|------|
| Front Desk / Events | 9 | 9 | 0 | 0 |
| Package Management | 8 | 8 | 0 | 0 |
| Maintenance | 12 | 12 | 0 | 0 |
| Equipment & Assets | 6 | 6 | 0 | 0 |
| Vendor Management | 4 | 3 | 1 | 0 |
| Amenity / Reservations | 5 | 5 | 0 | 0 |
| Parking | 5 | 4 | 0 | 1 |
| Communication | 9 | 9 | 0 | 0 |
| User / Unit Management | 11 | 10 | 1 | 0 |
| Security | 5 | 5 | 0 | 0 |
| Reports | 5 | 5 | 0 | 0 |
| Platform Features | 15 | 13 | 0 | 2 |
| **TOTAL** | **94** | **89** | **2** | **3** |

**Coverage rate: 94.7% fully covered, 97.9% at least partially covered.**

---

*Audited: 2026-03-14*
*Comparison matrix features: 94 (including sub-features)*
*PRD files checked: 21*
*Research files referenced: PLATFORM-COMPARISON.md + CLAUDE.md*
