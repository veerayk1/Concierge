# Record of Processing Activities (ROPA)

> **Version**: 1.0 | **Date**: 2026-03-17 | **Status**: MANDATORY
>
> This document satisfies GDPR Article 30 (Records of Processing Activities), ISO 27701 Clause 7.2.8,
> and PIPEDA Principle 1 (Accountability). It must be kept up to date as new processing activities are
> introduced. See RULEBOOK.md Rule 22 for the DPIA requirement that triggers ROPA updates.
>
> **Controller**: The Management Company operating Concierge for each property.
> **Processor**: Concierge (the platform) acting on behalf of the Management Company.
> **DPO Contact**: Configured per property in Settings > Property Setup > Data Protection Officer (PRD 16).

---

## Table of Contents

1. [Processing Activity Register](#1-processing-activity-register)
2. [Resident Personal Data Processing](#2-resident-personal-data-processing)
3. [Security and Access Data Processing](#3-security-and-access-data-processing)
4. [Visitor and Third-Party Data Processing](#4-visitor-and-third-party-data-processing)
5. [Health and Medical Data Processing (PHI)](#5-health-and-medical-data-processing-phi)
6. [Financial Data Processing](#6-financial-data-processing)
7. [Operational Data Processing](#7-operational-data-processing)
8. [Staff and Employee Data Processing](#8-staff-and-employee-data-processing)
9. [Sub-Processors](#9-sub-processors)
10. [Cross-Border Transfers](#10-cross-border-transfers)
11. [Maintenance Instructions](#11-maintenance-instructions)

---

## 1. Processing Activity Register

This register lists every category of processing activity, its purpose, lawful basis, data subjects,
recipients, retention period, and security measures. It is organized by data category to match the
data inventory in `docs/tech/COMPLIANCE-MATRIX.md` Section 1.

### How to Read This Document

Each processing activity table contains:

| Column                     | Description                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | The type of personal data processed                                                                                             |
| **Specific Fields**        | Exact field names from the data model                                                                                           |
| **Purpose(s)**             | Why this data is collected and processed                                                                                        |
| **Lawful Basis (GDPR)**    | Art. 6(1) basis: (a) consent, (b) contract, (c) legal obligation, (d) vital interests, (e) public task, (f) legitimate interest |
| **Lawful Basis (PIPEDA)**  | Which PIPEDA Principle applies                                                                                                  |
| **Data Subjects**          | Who the data belongs to                                                                                                         |
| **Recipients**             | Who has access to the data (internal roles and external parties)                                                                |
| **Cross-Border Transfers** | Whether data leaves Canada, and to where                                                                                        |
| **Retention Period**       | How long data is kept (from COMPLIANCE-MATRIX.md Section 11)                                                                    |
| **Security Measures**      | Encryption tier and access controls                                                                                             |

---

## 2. Resident Personal Data Processing

### 2.1 Account and Identity Data

| Aspect                     | Detail                                                                                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Resident identity and contact information                                                                                                                                                                                                                   |
| **Specific Fields**        | `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `address`, `move_in_date`, `move_out_date`, `avatar_url`, `company_name`, `preferred_locale`                                                                                                  |
| **Purpose(s)**             | (1) Identify residents for building access and communication. (2) Enable notification delivery. (3) Comply with building management contractual obligations. (4) Emergency contact identification.                                                          |
| **Lawful Basis (GDPR)**    | Art. 6(1)(b) — Performance of a contract (condo management agreement). Art. 6(1)(f) — Legitimate interest for building security.                                                                                                                            |
| **Lawful Basis (PIPEDA)**  | Principle 2 (Limiting Collection) — collected only for identified purposes. Principle 3 (Consent) — explicit consent at onboarding.                                                                                                                         |
| **Data Subjects**          | Residents (owners, tenants, family members, offsite owners)                                                                                                                                                                                                 |
| **Internal Recipients**    | Property Admin (full access), Property Manager (full access), Front Desk/Concierge (name + unit only), Security Guard (name + unit only), Security Supervisor (name + unit + contact for escalations), Maintenance Staff (name + unit for service requests) |
| **External Recipients**    | None (data does not leave the platform except via notification channels — see Sub-Processors)                                                                                                                                                               |
| **Cross-Border Transfers** | Email addresses sent to SendGrid (US). Phone numbers sent to Twilio (US). See Section 10.                                                                                                                                                                   |
| **Retention Period**       | Duration of occupancy + 1 year. Anonymized 2 years after account deactivation.                                                                                                                                                                              |
| **Security Measures**      | Names: Tier 3 (storage-level AES-256). Email, phone, DOB, address: Tier 2 (app-level + storage-level AES-256). Per-property encryption keys. Row-Level Security.                                                                                            |

### 2.2 Authentication and Session Data

| Aspect                     | Detail                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Login credentials and session information                                                                                                                           |
| **Specific Fields**        | `password_hash`, `mfa_secret`, `session_token`, `login_ip_address`, `login_device_info`, `geo_location` (derived from IP), `last_login_at`, `failed_login_attempts` |
| **Purpose(s)**             | (1) Authenticate users. (2) Detect unauthorized access. (3) Comply with SOC 2 access monitoring. (4) Impossible travel detection.                                   |
| **Lawful Basis (GDPR)**    | Art. 6(1)(b) — Contract performance (account access). Art. 6(1)(f) — Legitimate interest (security monitoring).                                                     |
| **Lawful Basis (PIPEDA)**  | Principle 4 (Limiting Collection) — minimum data for security. Principle 7 (Safeguards) — access monitoring.                                                        |
| **Data Subjects**          | All users (residents, staff, admins, vendors with portal access)                                                                                                    |
| **Internal Recipients**    | Super Admin (audit log access), Property Admin (login activity reports), Security Officer (anomaly alerts)                                                          |
| **External Recipients**    | None                                                                                                                                                                |
| **Cross-Border Transfers** | None (processed and stored entirely in Canadian infrastructure)                                                                                                     |
| **Retention Period**       | Login history: 2 years. Audit logs: 10 years. Session tokens: deleted on logout or after 24-hour inactivity.                                                        |
| **Security Measures**      | Password: bcrypt hash (never stored in plaintext). IP/device: Tier 2 encryption. MFA secret: Tier 1 encryption.                                                     |

### 2.3 Notification Preferences

| Aspect                     | Detail                                                                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Communication preferences and consent records                                                                                                                                                 |
| **Specific Fields**        | `email_notifications` (consent), `sms_notifications` (consent), `push_notifications` (consent), `marketing` (consent), `analytics` (consent), `preferred_notification_channel`, `quiet_hours` |
| **Purpose(s)**             | (1) Respect data subject communication preferences. (2) Document consent for regulatory compliance. (3) Route notifications through preferred channel.                                        |
| **Lawful Basis (GDPR)**    | Art. 6(1)(a) — Consent for each notification channel. Art. 7 — Demonstrable, freely given consent.                                                                                            |
| **Lawful Basis (PIPEDA)**  | Principle 3 (Consent) — opt-in for each channel, revocable at any time.                                                                                                                       |
| **Data Subjects**          | All users                                                                                                                                                                                     |
| **Internal Recipients**    | System only (automated notification routing). Property Admin (consent coverage reports).                                                                                                      |
| **External Recipients**    | None (preferences stored locally; only delivery uses external providers)                                                                                                                      |
| **Cross-Border Transfers** | None                                                                                                                                                                                          |
| **Retention Period**       | Consent records: indefinite (legal proof). Preferences: duration of account.                                                                                                                  |
| **Security Measures**      | Tier 3 encryption. Consent records are append-only (immutable audit trail).                                                                                                                   |

---

## 3. Security and Access Data Processing

### 3.1 Physical Access Credentials

| Aspect                     | Detail                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Building access devices and codes                                                                                                  |
| **Specific Fields**        | `fob_serial_number`, `buzzer_code`, `garage_clicker_serial`, `alarm_code`                                                          |
| **Purpose(s)**             | (1) Manage physical access to the building. (2) Track device assignment for security. (3) Deactivate access on move-out.           |
| **Lawful Basis (GDPR)**    | Art. 6(1)(b) — Contract (building access is part of occupancy). Art. 6(1)(f) — Legitimate interest (building security).            |
| **Lawful Basis (PIPEDA)**  | Principle 4 (Limiting Collection). Principle 7 (Safeguards) — physical security.                                                   |
| **Data Subjects**          | Residents, staff                                                                                                                   |
| **Internal Recipients**    | Property Admin (full access), Security Supervisor (full access), Front Desk/Concierge (read-only for FOB verification)             |
| **External Recipients**    | None                                                                                                                               |
| **Cross-Border Transfers** | None                                                                                                                               |
| **Retention Period**       | Duration of occupancy. Deactivated and deleted 30 days after move-out.                                                             |
| **Security Measures**      | Buzzer codes, alarm codes: Tier 1 (double encryption — app-level AES-256 + storage AES-256). FOB serials, clicker serials: Tier 2. |

### 3.2 Security Event Records

| Aspect                     | Detail                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data Category**          | Security incidents, patrol logs, key tracking                                                                                                          |
| **Specific Fields**        | `incident_description`, `incident_type`, `involved_persons`, `location`, `photos`, `responding_officer`, `resolution`                                  |
| **Purpose(s)**             | (1) Document security incidents for liability protection. (2) Enable pattern analysis for building safety. (3) Comply with building code requirements. |
| **Lawful Basis (GDPR)**    | Art. 6(1)(f) — Legitimate interest (building safety and security).                                                                                     |
| **Lawful Basis (PIPEDA)**  | Principle 4 — collected for security purposes. Principle 5 — retained per building code.                                                               |
| **Data Subjects**          | Residents, visitors, staff, vendors                                                                                                                    |
| **Internal Recipients**    | Security Guard (create + own records), Security Supervisor (all records), Property Admin (all records), Property Manager (all records)                 |
| **External Recipients**    | Law enforcement (only upon legal request/subpoena). Insurance companies (only upon claim).                                                             |
| **Cross-Border Transfers** | None                                                                                                                                                   |
| **Retention Period**       | 7 years (building code, legal liability). Archived to cold storage after 2 years.                                                                      |
| **Security Measures**      | Description: Tier 3. Photos: Tier 2. Incident reports with PII references: audit-logged on access.                                                     |

---

## 4. Visitor and Third-Party Data Processing

| Aspect                     | Detail                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Visitor registration and vendor contact information                                                                                     |
| **Specific Fields**        | `visitor_name`, `visitor_id_number`, `visitor_license_plate`, `vendor_contact_name`, `vendor_contact_email`, `vendor_insurance_details` |
| **Purpose(s)**             | (1) Building access control. (2) Visitor tracking for security. (3) Vendor compliance management. (4) Insurance verification.           |
| **Lawful Basis (GDPR)**    | Art. 6(1)(f) — Legitimate interest (building security). Art. 6(1)(b) — Contract (for vendor services).                                  |
| **Lawful Basis (PIPEDA)**  | Principle 2 — limited to building access and vendor management purposes.                                                                |
| **Data Subjects**          | Visitors, vendors, delivery personnel                                                                                                   |
| **Internal Recipients**    | Front Desk/Concierge (create + view), Security Guard (create + view), Property Admin (full access), Property Manager (full access)      |
| **External Recipients**    | None                                                                                                                                    |
| **Cross-Border Transfers** | None                                                                                                                                    |
| **Retention Period**       | Visitors: 3 years, then anonymize names and ID numbers. Vendors: duration of vendor relationship + 3 years.                             |
| **Security Measures**      | Visitor ID numbers: Tier 2. Visitor names, license plates: Tier 3. Vendor insurance docs: Tier 3.                                       |

---

## 5. Health and Medical Data Processing (PHI)

> This section applies ONLY to properties with `enable_hipaa_compliance = true`.

| Aspect                     | Detail                                                                                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Protected Health Information (PHI) and accessibility data                                                                                                                                                                                                   |
| **Specific Fields**        | `medical_conditions`, `accessibility_needs`, `emergency_medical_info`, `allergies`, `medications`, `hearing_impaired`, `vision_impaired`, `mobility_impaired`, `cognitive_impaired`                                                                         |
| **Purpose(s)**             | (1) Emergency response — provide responders with critical medical information. (2) Accessibility accommodations — ensure building services meet resident needs. (3) Comply with duty of care obligations.                                                   |
| **Lawful Basis (GDPR)**    | Art. 9(2)(a) — Explicit consent (`health_data_authorization` consent type). Art. 9(2)(c) — Vital interests (emergency situations).                                                                                                                          |
| **Lawful Basis (PIPEDA)**  | Principle 3 — Sensitive information requires express consent.                                                                                                                                                                                               |
| **HIPAA Basis**            | Authorization obtained via Privacy tab (PRD 08, Section 6.3.2, subsection 7).                                                                                                                                                                               |
| **Data Subjects**          | Residents (those who opt in to sharing health data)                                                                                                                                                                                                         |
| **Internal Recipients**    | Property Admin (full access with health data authorization), Security Guard (emergency medical info ONLY, visible only during active emergency), Front Desk/Concierge (accessibility needs only)                                                            |
| **External Recipients**    | Emergency services (paramedics, fire department) — only during active emergencies, verbally communicated, not transmitted electronically                                                                                                                    |
| **Cross-Border Transfers** | NONE. PHI is never sent to any external provider, API, or service. PHI is never included in AI API calls. PHI is never included in email or SMS notifications.                                                                                              |
| **Retention Period**       | Duration of occupancy. Deleted within 30 days of move-out (after emergency contact grace period). PHI access logs retained for 6 years (HIPAA).                                                                                                             |
| **Security Measures**      | ALL PHI fields: Tier 1 (double encryption — app-level AES-256 + storage AES-256). Per-property encryption keys. Every PHI access logged in `DataAccessLog`. Access requires explicit role permission + health data authorization consent from the resident. |

---

## 6. Financial Data Processing

| Aspect                     | Detail                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Payment and billing information                                                                                                        |
| **Specific Fields**        | `payment_method` (Stripe token only), `billing_address`, `invoice_history`, `amenity_payment_records`                                  |
| **Purpose(s)**             | (1) Process payments for amenity bookings. (2) Manage subscription billing. (3) Generate invoices. (4) Tax compliance.                 |
| **Lawful Basis (GDPR)**    | Art. 6(1)(b) — Contract performance (payment for services). Art. 6(1)(c) — Legal obligation (tax records).                             |
| **Lawful Basis (PIPEDA)**  | Principle 2 — collected for payment processing only.                                                                                   |
| **Data Subjects**          | Property Admins (subscription billing), Residents (amenity payments)                                                                   |
| **Internal Recipients**    | Super Admin (all billing), Property Admin (property billing), Board Member (financial reports — aggregate only)                        |
| **External Recipients**    | Stripe (payment processor) — receives only tokenized payment data, never full card numbers                                             |
| **Cross-Border Transfers** | Stripe tokens processed in US (Stripe default). Canadian hosting available via Stripe Atlas. See PRD 18 Data Residency Registry.       |
| **Retention Period**       | Billing/invoice records: 7 years (CRA tax law). Payment tokens: deleted when payment method removed. Amenity payment records: 2 years. |
| **Security Measures**      | Payment tokens: Tier 1 (never stored in raw form — Stripe handles PCI DSS). Billing address: Tier 2. Invoice data: Tier 3.             |

---

## 7. Operational Data Processing

### 7.1 Package Management

| Aspect                  | Detail                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **Specific Fields**     | `package_tracking_number`, `carrier`, `recipient_name`, `storage_location`, `release_signature` |
| **Purpose(s)**          | Package intake, tracking, notification, and release management                                  |
| **Lawful Basis (GDPR)** | Art. 6(1)(b) — Contract (building service).                                                     |
| **Data Subjects**       | Residents                                                                                       |
| **Retention Period**    | 3 years. Anonymize resident names; retain count-level data.                                     |
| **Security Measures**   | Tier 3. Signatures: Tier 2.                                                                     |

### 7.2 Maintenance Requests

| Aspect                  | Detail                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Specific Fields**     | `request_description`, `category`, `priority`, `photos`, `unit_id`, `permission_to_enter`, `entry_instructions` |
| **Purpose(s)**          | Service request tracking, vendor assignment, work order management                                              |
| **Lawful Basis (GDPR)** | Art. 6(1)(b) — Contract (building maintenance services).                                                        |
| **Data Subjects**       | Residents (requesters), Staff (assignees), Vendors (service providers)                                          |
| **Retention Period**    | 7 years (building code). Archive to cold storage after 2 years.                                                 |
| **Security Measures**   | Description: Tier 3. Photos (may show unit interiors): Tier 2. Entry instructions: Tier 2.                      |

### 7.3 Amenity Bookings

| Aspect                  | Detail                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **Specific Fields**     | `amenity_id`, `resident_id`, `booking_date`, `time_slot`, `payment_amount`, `approval_status` |
| **Purpose(s)**          | Amenity reservation management, conflict prevention, payment processing                       |
| **Lawful Basis (GDPR)** | Art. 6(1)(b) — Contract.                                                                      |
| **Data Subjects**       | Residents                                                                                     |
| **Retention Period**    | 2 years. Delete PII, retain usage statistics.                                                 |
| **Security Measures**   | Tier 3.                                                                                       |

### 7.4 Communications

| Aspect                  | Detail                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Specific Fields**     | `announcement_body`, `announcement_recipients`, `classified_ad_content`, `shift_notes`, `unit_instructions`                                            |
| **Purpose(s)**          | Building communication, staff handoff, resident community engagement                                                                                   |
| **Lawful Basis (GDPR)** | Art. 6(1)(b) — Contract (building management communication). Art. 6(1)(f) — Legitimate interest (community engagement).                                |
| **Data Subjects**       | Residents (recipients), Staff (authors), Residents (classified ads)                                                                                    |
| **Retention Period**    | Announcements: 2 years. Classified ads: 1 year after closure. Shift notes: 7 years (security records). Unit instructions: duration of occupancy.       |
| **Security Measures**   | Announcements, classified ads: Tier 3. Shift notes (may reference individuals): Tier 3. Unit instructions (may contain medical/personal info): Tier 2. |

---

## 8. Staff and Employee Data Processing

| Aspect                     | Detail                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Data Category**          | Staff account and employment data                                                                                   |
| **Specific Fields**        | `first_name`, `last_name`, `email`, `phone`, `role`, `shift_schedule`, `training_completion`, `performance_metrics` |
| **Purpose(s)**             | (1) Staff account management. (2) Shift scheduling. (3) Training compliance tracking. (4) Performance monitoring.   |
| **Lawful Basis (GDPR)**    | Art. 6(1)(b) — Contract (employment/service agreement). Art. 6(1)(c) — Legal obligation (training compliance).      |
| **Lawful Basis (PIPEDA)**  | Principle 2 — collected for employment and building management purposes.                                            |
| **Data Subjects**          | Staff (Security Guards, Concierge, Maintenance, Supervisors, Property Managers)                                     |
| **Internal Recipients**    | Property Admin (full access), Security Supervisor (security team only), Property Manager (all staff)                |
| **External Recipients**    | None                                                                                                                |
| **Cross-Border Transfers** | None                                                                                                                |
| **Retention Period**       | Duration of employment + 2 years. Training records: duration of employment + 2 years (HIPAA, ISO 9001).             |
| **Security Measures**      | Name, email, phone: same tiers as resident data. Training records: Tier 3.                                          |

---

## 9. Sub-Processors

The following third-party services process personal data on behalf of Concierge. Each requires a Data Processing Agreement (DPA). Full details in PRD 18 Data Residency Registry.

| Sub-Processor              | Service                            | Data Processed                                     | Data Location                   | DPA Required | PII Sent                    |
| -------------------------- | ---------------------------------- | -------------------------------------------------- | ------------------------------- | ------------ | --------------------------- |
| **Stripe, Inc.**           | Payment processing                 | Payment tokens, billing emails                     | US (default), CA (configurable) | Yes          | Minimal (tokenized)         |
| **Twilio Inc. (SendGrid)** | Email delivery                     | Email addresses, notification content              | US                              | Yes          | Email addresses             |
| **Twilio Inc.**            | SMS and voice                      | Phone numbers, message content                     | US                              | Yes          | Phone numbers               |
| **Google (Firebase)**      | Push notifications                 | Device tokens, notification titles                 | US                              | Yes          | No PII (device tokens only) |
| **Anthropic**              | AI processing (Claude API)         | Anonymized text (PII stripped before transmission) | US                              | Yes          | None (PII stripped)         |
| **OpenAI**                 | AI processing (backup)             | Anonymized text (PII stripped before transmission) | US                              | Yes          | None (PII stripped)         |
| **AWS (Amazon)**           | Cloud infrastructure, file storage | All data categories                                | CA (ca-central-1)               | Yes          | All (encrypted at rest)     |
| **Weather API provider**   | Weather data                       | Property postal code only                          | US                              | No (no PII)  | None                        |

---

## 10. Cross-Border Transfers

### 10.1 Transfer Summary

| Data Type       | Destination            | Transfer Mechanism                              | Safeguards                                                                            |
| --------------- | ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Email addresses | US (SendGrid)          | DPA with Standard Contractual Clauses           | TLS 1.3 in transit, processed only for delivery, deleted from provider after delivery |
| Phone numbers   | US (Twilio)            | DPA with Standard Contractual Clauses           | TLS 1.3 in transit, processed only for delivery                                       |
| Anonymized text | US (Anthropic, OpenAI) | DPA, commercial API terms (no training on data) | PII stripped before transmission, TLS 1.3, responses cached max 24 hours then purged  |
| Payment tokens  | US (Stripe)            | DPA, PCI DSS Level 1 compliance                 | Tokenized (no raw card data leaves the platform), TLS 1.3                             |

### 10.2 Data That NEVER Leaves Canada

The following data categories are processed and stored exclusively in Canadian infrastructure (AWS ca-central-1):

- All PHI / health data (Section 5)
- All security and access credentials (Section 3.1)
- All security event records (Section 3.2)
- All audit logs
- All backup data
- All uploaded files and documents (S3 in ca-central-1)
- All database records (RDS in ca-central-1)

### 10.3 Resident Rights Regarding Cross-Border Transfers

Residents are informed of cross-border transfers via:

1. The Privacy Policy page (PRD 22, Section 9.5) — lists all sub-processors and their locations
2. The Sub-Processor List page (PRD 22, Section 9.8) — detailed list with 30-day notification before changes
3. The `cross_border_transfer` consent type (Section 2.3) — opt-in consent for non-essential transfers

---

## 11. Maintenance Instructions

### When to Update This Document

This ROPA must be updated when any of the following occurs:

1. **A new PII field is added** to any data model (triggers DPIA per RULEBOOK.md Rule 22 — update the relevant section in this ROPA within 5 business days of the PR merging)
2. **A new sub-processor is added** (update Section 9 and Section 10, notify users per PRD 22 Section 9.8)
3. **A retention period changes** (update the relevant section and COMPLIANCE-MATRIX.md Section 11)
4. **A new data subject category is introduced** (e.g., if a new role is added that collects different data)
5. **A new processing purpose is identified** for existing data
6. **A cross-border transfer is added or removed**
7. **Annually** — even if no changes occurred, review and re-confirm all entries (conducted by the DPO or Security Officer)

### Version History

| Version | Date       | Author          | Changes                                                             |
| ------- | ---------- | --------------- | ------------------------------------------------------------------- |
| 1.0     | 2026-03-17 | Compliance Team | Initial ROPA creation covering all 8 processing activity categories |

### Automated ROPA Generation

PRD 28 (Compliance Reports) includes Report 9: ROPA Report, which auto-generates a ROPA from the live data model. This static document serves as the master reference; the auto-generated report is used for ongoing validation that the static document matches the actual system state.

---

_Last updated: 2026-03-17_
_Frameworks satisfied: GDPR Article 30, ISO 27701 Clause 7.2.8, PIPEDA Principle 1_
_Total processing activities documented: 14 categories across 8 sections_
