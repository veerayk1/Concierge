# Audit: PRD 16 -- Settings & Administration

> Cross-reference of PRD 16 against research files: `docs/settings.md` (Aquarius, 8 tabs), `docs/platform-3/deep-dive-buzzer-codes.md` (Condo Control), `docs/platform-3/deep-dive-store.md` (Condo Control), `docs/platform-3/deep-dive-survey.md` (Condo Control), and `docs/PLATFORM-COMPARISON.md`.

---

## Summary

PRD 16 is comprehensive and well-structured. It expands Aquarius's 8 settings tabs into 15 tabs, covering all observed research features and adding significant new capabilities (AI configuration, system health, billing, data import/export, API key management). The Buzzer Code Directory is fully specified with all improvements identified in the Condo Control research. Most Aquarius settings fields are accounted for. A few minor gaps remain, primarily around parking settings granularity and security company configuration.

---

## CONFIRMED -- Features Properly Covered

| Research Feature | Research Source | PRD 16 Location | Notes |
|-----------------|----------------|-----------------|-------|
| Building information (name, address, corp number, postal code) | Aquarius Tab 1 | 3.1.1 Building Information | All core fields present. PRD adds Total Floors, Total Units, Year Built, Timezone, Property Logo -- improvements over Aquarius |
| Contact information (desk email, PM email, multiple contacts) | Aquarius Tab 1 | 3.1.2 Contact Information | Repeatable contact block (1-10) with name, email, phone, role. Covers all Aquarius contact fields |
| Default email settings (from addresses per notification type) | Aquarius Tab 1 | 3.5 Notification Templates | Handled differently -- PRD uses per-template channel configuration rather than per-log-type email addresses. Better architecture |
| Feature toggles (maintenance, amenity, payments, etc.) | Aquarius Tab 1 | 3.1.3 Operational Toggles | All Aquarius boolean toggles accounted for: maintenance, amenity booking, offsite owner booking, in-person payments, online payments, auto-approve suite entry, package notifications |
| Parking settings (visitor limits, self-serve, printing) | Aquarius Tab 2 | PRD 13 (Parking) | Parking configuration moved to dedicated Parking PRD -- correct architectural choice |
| Login page customization (header text, welcome email) | Aquarius Tab 3 | 3.9 Branding & Theming | Login Page Header and Login Page Background in branding tab. Welcome email template in 3.5 Notification Templates |
| Payment processor configuration (Stripe keys) | Aquarius Tab 4 | PRD 18 (Integrations) Section 3.1 | Payment config moved to Integrations PRD. More detailed than Aquarius: includes webhook secret, currency, refund window, statement descriptor |
| Amenity card overview with availability | Aquarius Tab 5 | 3.4 Amenity Management | Full amenity configuration with 17 fields per amenity -- far exceeds Aquarius's card grid view |
| Role/group management (18 groups) | Aquarius Tab 6 | 3.6 Role & Permission Management | Visual permission matrix with clone, preview, and audit. Major improvement over Aquarius's simple table |
| Key inventory management | Aquarius Tab 7 | PRD 03 (Security Console) | Key management is in the Security Console PRD as part of the Key Management event group |
| Contractor directory | Aquarius Tab 8 | PRD 05 (Maintenance) | Vendor/contractor management covered in Maintenance PRD. Correct placement |
| Buzzer code directory (search, sort, detail view) | Condo Control buzzer-codes.md | 3.15 Buzzer Code Directory | Fully specified. Addresses all 10 issues identified in CC research: unit-based lookup, bulk export, "Last Updated" column, comments with suggested uses, one code per unit (not per resident), bulk import via CSV |
| Buzzer code pagination | Condo Control buzzer-codes.md | 3.15 (inherits platform pagination) | Standard platform pagination applies |
| Configurable event types | PLATFORM-COMPARISON.md | 3.2 Event Type Configuration | Full event group/type system with 17 fields per type, drag-to-reorder, deactivation. Core architectural requirement met |
| Maintenance categories (configurable) | PLATFORM-COMPARISON.md | 3.3 Maintenance Categories | Two-level hierarchy with 43 pre-loaded defaults. Exceeds both Aquarius (11 fixed) and BuildingLink (configurable) |
| Multi-channel notification templates | PLATFORM-COMPARISON.md | 3.5 Notification Templates | Email, SMS, push, voice templates with merge fields, preview, and test send |
| Custom fields as JSONB | CLAUDE.md technical non-negotiable | 3.7 Custom Fields Configuration | Full field builder with 12 field types, validation rules, help text. Stored as JSONB |
| Audit log | Condo Control (login audit trail) | 3.10 Audit Log | Immutable audit log with before/after JSON diffs, AI-generated summaries, cross-property view for Super Admin |
| Data import/export | PLATFORM-COMPARISON.md | 3.13 Data Import/Export | CSV and Excel import with validation preview, column mapping, error reports. Export in CSV, XLSX, JSON, PDF |
| Email signature editor | Condo Control (CKEditor 5) | 3.9 Branding & Theming | Email Signature field (rich text, 1000 chars) in branding tab |

---

## GAPS -- Features Missing from PRD 16

| # | Missing Feature | Research Source | Severity | Recommendation |
|---|----------------|----------------|----------|----------------|
| 1 | **Security Company configuration** (company name + logo upload) | Aquarius settings.md Tab 1 | Low | Add to Property Setup (3.1) as an optional "Security Provider" section with company name and logo. This branding appears on security reports and printed passes. |
| 2 | **Auto-CC email lists per event group** | Aquarius settings.md Tab 1 (auto-CC for General Log, Incident Log, Fire Log, Noise Log) | Medium | The notification template system (3.5) handles individual notifications but does not specify auto-CC distribution lists that get copied on every event of a certain type. Add a "CC Recipients" field to event type configuration (3.2.2) or notification templates. |
| 3 | **Signature pad type configuration** | Aquarius settings.md Tab 2 (Signature Pad Type field) | Low | PRD 16 has "Require signature on package release" toggle (3.1.3) but does not specify how the signature pad hardware/software type is configured. Add a "Signature Capture Method" dropdown (touchscreen/tablet/Topaz pad/none) to Property Setup or Integrations. |
| 4 | **Formatted parking passes configuration** | Aquarius settings.md Tab 2 (Formatted Parking Passes field) | Low | Parking pass printing is mentioned in PRD 13 (Parking) but the formatting/template configuration for printed passes is not specified in either PRD 13 or PRD 16. |

---

## WEAK COVERAGE -- Features Present but Underspecified

| # | Feature | Research Source | PRD 16 Location | Issue | Recommendation |
|---|---------|----------------|-----------------|-------|----------------|
| 1 | **Parking settings granularity** | Aquarius Tab 2 (7 overnight limits, 2 day visit limits, role-based parking notifications) | Deferred to PRD 13 | PRD 13 covers parking permits and violations but the detailed settings panel from Aquarius (per-plate/per-unit/per-week/per-month/per-year limits) should be verified in PRD 13. Cross-reference needed. | Verify PRD 13 has a settings section covering all 7 limit types and 9 role-based notification toggles from Aquarius. |
| 2 | **Welcome email system** | Aquarius Tab 3 (Login Instructions Email Subject + Body) | 3.9 Branding (Login Page Header) + 3.5 Notification Templates | The login page header is covered in Branding, but the dedicated "welcome email" that is sent to new users during onboarding is only implicitly covered by the notification template system. There is no pre-built "Welcome" template mentioned. | Add a system-default "Welcome / Onboarding Email" template to 3.5 that is auto-triggered on user account creation, with the subject and body pre-populated (editable by admin). |
| 3 | **"Allow editing locker info" toggle** | Aquarius Tab 1 (boolean toggle) | Not found | Locker management is a minor feature from Aquarius. The custom fields system (3.7) could handle locker info, but there is no explicit toggle for whether locker data is editable. | Low priority. Can be handled via custom fields or as a future feature toggle. |
| 4 | **Store module configuration** | Condo Control deep-dive-store.md | Not in PRD 16 | The Condo Control Store module (online ordering for property-related purchases like FOB replacements, parking permits) has no equivalent settings tab in PRD 16. However, the Store is listed as v3+ in CLAUDE.md's Nice-to-Have list, so this is expected. | No action needed for v1/v2. When Store module is built (v3+), add a "Store Configuration" settings tab. |
| 5 | **Survey module configuration** | Condo Control deep-dive-survey.md | Not in PRD 16 (covered in PRD 12) | Survey status lifecycle (Draft, Published, Expired, Inactive) and survey creation are covered in PRD 12 (Community), not in Settings. This is architecturally correct -- surveys are a community feature, not a settings feature. | No action needed. Confirm PRD 12 covers survey admin configuration (status management, survey builder, question types). |

---

## Cross-Reference Notes

- **Parking settings**: Full parking configuration audit should be in PRD 13 audit, not here. Aquarius had the most granular parking settings of any platform.
- **Key management**: Moved from Aquarius Settings Tab 7 to PRD 03 (Security Console). This is the correct architectural decision -- keys are operational, not administrative.
- **Contractor directory**: Moved from Aquarius Settings Tab 8 to PRD 05 (Maintenance). Correct -- contractors are part of the maintenance/vendor workflow.
- **Payment configuration**: Moved from Aquarius Settings Tab 4 to PRD 18 (Integrations). Correct -- Stripe is an integration, not a property setting.

---

*Audited: 2026-03-14*
*Research files checked: 5*
*PRD sections reviewed: 15 tabs + Super Admin features*
