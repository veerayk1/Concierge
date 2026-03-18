# Concierge -- Compliance Matrix

> **Version**: 1.0 | **Date**: 2026-03-17 | **Status**: MANDATORY
>
> This document maps every compliance requirement from 8 regulatory frameworks to specific Concierge
> PRDs, screens, workflows, and data fields. It identifies gaps where PRDs do not yet meet a
> requirement and provides actionable implementation notes.
>
> **Frameworks**: PIPEDA, GDPR, SOC 2 Type II, ISO 27001, ISO 27701, ISO 27017, ISO 9001, HIPAA

---

## Table of Contents

1. [Data Inventory by Framework](#1-data-inventory-by-framework)
2. [PIPEDA Requirements](#2-pipeda-requirements)
3. [GDPR Requirements](#3-gdpr-requirements)
4. [SOC 2 Type II Requirements](#4-soc-2-type-ii-requirements)
5. [ISO 27001 Requirements](#5-iso-27001-requirements)
6. [ISO 27701 Requirements](#6-iso-27701-requirements)
7. [ISO 27017 Requirements](#7-iso-27017-requirements)
8. [ISO 9001 Requirements](#8-iso-9001-requirements)
9. [HIPAA Requirements](#9-hipaa-requirements)
10. [Cross-Framework Consent Model](#10-cross-framework-consent-model)
11. [Data Retention Matrix](#11-data-retention-matrix)
12. [Breach Notification Matrix](#12-breach-notification-matrix)
13. [Encryption Requirements Matrix](#13-encryption-requirements-matrix)
14. [Gaps Summary and Remediation Plan](#14-gaps-summary-and-remediation-plan)

---

## 1. Data Inventory by Framework

Concierge collects the following categories of personal data. Each category lists the specific fields,
which modules collect them, which frameworks govern them, and the sensitivity tier.

### 1.1 Resident Personal Data

| Field                            | Module(s)                                  | Frameworks                     | Sensitivity | Encryption Tier                    |
| -------------------------------- | ------------------------------------------ | ------------------------------ | ----------- | ---------------------------------- |
| `first_name`                     | User Management (08), Unit Management (07) | PIPEDA, GDPR, ISO 27701        | Standard    | Tier 3 (storage-level AES-256)     |
| `last_name`                      | User Management (08), Unit Management (07) | PIPEDA, GDPR, ISO 27701        | Standard    | Tier 3                             |
| `email`                          | User Management (08)                       | PIPEDA, GDPR, ISO 27701        | Sensitive   | Tier 2 (app-level + storage-level) |
| `phone`                          | User Management (08)                       | PIPEDA, GDPR, ISO 27701        | Sensitive   | Tier 2                             |
| `date_of_birth`                  | User Management (08)                       | PIPEDA, GDPR, ISO 27701, HIPAA | Sensitive   | Tier 2                             |
| `address` (unit/mailing)         | Unit Management (07)                       | PIPEDA, GDPR, ISO 27701        | Sensitive   | Tier 2                             |
| `move_in_date` / `move_out_date` | User Management (08)                       | PIPEDA, GDPR                   | Standard    | Tier 3                             |
| `avatar_url` (photo)             | User Management (08)                       | PIPEDA, GDPR                   | Standard    | Tier 3                             |
| `company_name`                   | User Management (08)                       | PIPEDA                         | Standard    | Tier 3                             |
| `preferred_locale`               | User Management (08)                       | GDPR (profiling)               | Standard    | Tier 3                             |

### 1.2 Security and Access Data

| Field                    | Module(s)                                   | Frameworks                     | Sensitivity | Encryption Tier            |
| ------------------------ | ------------------------------------------- | ------------------------------ | ----------- | -------------------------- |
| `fob_serial_number`      | Security Console (03), Unit Management (07) | PIPEDA, ISO 27001              | Sensitive   | Tier 2                     |
| `buzzer_code`            | Security Console (03), Unit Management (07) | PIPEDA, ISO 27001              | Critical    | Tier 1 (double encryption) |
| `garage_clicker_serial`  | Unit Management (07)                        | PIPEDA, ISO 27001              | Sensitive   | Tier 2                     |
| `alarm_code`             | Unit Management (07)                        | PIPEDA, ISO 27001              | Critical    | Tier 1                     |
| `login_ip_address`       | User Management (08)                        | PIPEDA, GDPR, SOC 2, ISO 27001 | Sensitive   | Tier 2                     |
| `login_device_info`      | User Management (08)                        | GDPR, SOC 2                    | Standard    | Tier 3                     |
| `geo_location` (from IP) | Compliance Reports (28)                     | GDPR                           | Sensitive   | Tier 2                     |

### 1.3 Visitor and Third-Party Data

| Field                      | Module(s)                           | Frameworks   | Sensitivity | Encryption Tier |
| -------------------------- | ----------------------------------- | ------------ | ----------- | --------------- |
| `visitor_name`             | Security Console (03)               | PIPEDA, GDPR | Standard    | Tier 3          |
| `visitor_id_number`        | Security Console (03)               | PIPEDA, GDPR | Sensitive   | Tier 2          |
| `visitor_license_plate`    | Security Console (03), Parking (13) | PIPEDA       | Standard    | Tier 3          |
| `vendor_contact_name`      | Maintenance (05)                    | PIPEDA       | Standard    | Tier 3          |
| `vendor_contact_email`     | Maintenance (05)                    | PIPEDA, GDPR | Standard    | Tier 3          |
| `vendor_insurance_details` | Maintenance (05)                    | SOC 2        | Standard    | Tier 3          |

### 1.4 Health and Medical Data (PHI)

| Field                    | Module(s)                                  | Frameworks          | Sensitivity | Encryption Tier |
| ------------------------ | ------------------------------------------ | ------------------- | ----------- | --------------- |
| `medical_conditions`     | Unit Management (07)                       | HIPAA, PIPEDA, GDPR | Critical    | Tier 1          |
| `accessibility_needs`    | Unit Management (07), User Management (08) | HIPAA, PIPEDA       | Critical    | Tier 1          |
| `emergency_medical_info` | Unit Management (07)                       | HIPAA, PIPEDA       | Critical    | Tier 1          |
| `allergies`              | Unit Management (07)                       | HIPAA               | Critical    | Tier 1          |
| `medications`            | Unit Management (07)                       | HIPAA               | Critical    | Tier 1          |
| `hearing_impaired`       | Unit Management (07)                       | HIPAA, PIPEDA       | Critical    | Tier 1          |
| `vision_impaired`        | Unit Management (07)                       | HIPAA, PIPEDA       | Critical    | Tier 1          |
| `mobility_impaired`      | Unit Management (07)                       | HIPAA, PIPEDA       | Critical    | Tier 1          |
| `cognitive_impaired`     | Unit Management (07)                       | HIPAA, PIPEDA       | Critical    | Tier 1          |

### 1.5 Financial Data

| Field                           | Module(s)            | Frameworks       | Sensitivity | Encryption Tier                              |
| ------------------------------- | -------------------- | ---------------- | ----------- | -------------------------------------------- |
| `payment_method` (Stripe token) | Billing (24)         | PCI DSS, PIPEDA  | Critical    | Tier 1 (Stripe handles; we store only token) |
| `billing_address`               | Billing (24)         | PIPEDA           | Sensitive   | Tier 2                                       |
| `invoice_history`               | Billing (24)         | PIPEDA, ISO 9001 | Standard    | Tier 3                                       |
| `amenity_payment_records`       | Amenity Booking (06) | PIPEDA           | Standard    | Tier 3                                       |

### 1.6 Operational Data with PII Implications

| Field                             | Module(s)               | Frameworks                                   | Sensitivity | Encryption Tier |
| --------------------------------- | ----------------------- | -------------------------------------------- | ----------- | --------------- |
| `package_tracking_number`         | Package Management (04) | PIPEDA                                       | Standard    | Tier 3          |
| `maintenance_request_description` | Maintenance (05)        | PIPEDA (may contain PII)                     | Standard    | Tier 3          |
| `maintenance_photos`              | Maintenance (05)        | PIPEDA (may show unit interiors)             | Sensitive   | Tier 2          |
| `incident_report_description`     | Security Console (03)   | PIPEDA                                       | Standard    | Tier 3          |
| `shift_notes`                     | Security Console (03)   | PIPEDA (may reference individuals)           | Standard    | Tier 3          |
| `unit_instructions`               | Unit Management (07)    | PIPEDA (may reference medical/personal info) | Sensitive   | Tier 2          |
| `announcement_body`               | Communication (09)      | PIPEDA                                       | Standard    | Tier 3          |
| `classified_ad_content`           | Community (12)          | PIPEDA                                       | Standard    | Tier 3          |

---

## 2. PIPEDA Requirements

PIPEDA governs all personal information collected by Canadian organizations in the course of commercial activity.

### 2.1 Ten Fair Information Principles

| #   | Principle                                   | Requirement                                                                                                                | PRD Reference                                      | Status                                                                                                         | Implementation Notes                                                                                                                                                                                                                           |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Accountability**                          | Designate a person responsible for privacy compliance. Document policies.                                                  | 01-Architecture Section 13.8                       | **GAP**: No DPO appointment workflow in the platform                                                           | Add a "Data Protection Officer" field to the ManagementCompany entity. Display the DPO name and contact on the resident-facing Privacy page. PRD 16 (Settings Admin) must add a DPO configuration section.                                     |
| 2   | **Identifying Purposes**                    | Identify and document the purpose for each category of personal information collected before or at the time of collection. | 01-Architecture Section 13.8                       | **GAP**: Purposes are documented in architecture PRD but not surfaced to users at collection time              | Each form that collects PII must display a purpose statement. PRD 08 (User Management) account creation form needs a visible "Why we collect this" tooltip per field. PRD 23 (Onboarding) Step 1 must show a purpose-of-collection disclosure. |
| 3   | **Consent**                                 | Obtain meaningful consent for collection, use, and disclosure.                                                             | 28-Compliance (Report 6)                           | **PARTIAL**: Consent types defined but onboarding consent flow not fully specified                             | PRD 23 (Onboarding) must add a consent capture screen. PRD 08 (User Management) first-login flow Step 3 must include explicit consent checkboxes for each consent type (not bundled). See Section 10 of this document.                         |
| 4   | **Limiting Collection**                     | Collect only information necessary for the identified purposes.                                                            | 01-Architecture Section 13.7                       | **MET**: Progressive disclosure hides non-essential fields. Custom fields are property-configured.             | Verify every form: no optional fields that lack a clear purpose. PRD 07 (Unit Management) `company_name` on resident profiles should be justified or removed.                                                                                  |
| 5   | **Limiting Use, Disclosure, and Retention** | Use or disclose personal information only for the purpose it was collected. Retain only as long as necessary.              | 28-Compliance (Report 3)                           | **PARTIAL**: Retention policies defined in Report 3 but automated purge not yet specified in detail            | PRD 27 (Data Migration) must specify the automated purge job that deletes data past retention. See Section 11 of this document for the full retention matrix.                                                                                  |
| 6   | **Accuracy**                                | Keep personal information accurate, complete, and up-to-date.                                                              | DATA-QUALITY.md                                    | **MET**: Validation rules, missing data dashboard, weekly digest, duplicate detection all defined.             | Ensure self-service profile editing (PRD 08 Section 3.1.6) covers all PII fields. Residents must be able to correct their own data without admin intervention.                                                                                 |
| 7   | **Safeguards**                              | Protect personal information with security safeguards appropriate to the sensitivity.                                      | 01-Architecture Section 13.1, RULEBOOK Rule 12     | **MET**: Three-tier encryption, per-property keys, RLS, audit logging all defined.                             | No gaps.                                                                                                                                                                                                                                       |
| 8   | **Openness**                                | Make privacy policies and practices readily available.                                                                     | 22-Marketing Website                               | **GAP**: Marketing website has a Security page but no dedicated Privacy Policy page defined                    | PRD 22 (Marketing Website) must add a `/privacy` page with plain-language privacy policy. PRD 22 must also add `/terms` page. Both must be linked from every authenticated page footer.                                                        |
| 9   | **Individual Access**                       | On request, inform an individual of the existence, use, and disclosure of their personal information. Allow access.        | 27-Data Migration (DSAR), 28-Compliance (Report 7) | **PARTIAL**: DSAR workflow exists but resident self-service data export is not linked from an obvious location | PRD 08 (User Management) My Account page must add a "Download My Data" button under a Privacy tab. This triggers the data export from PRD 27 Section 3.2.1.                                                                                    |
| 10  | **Challenging Compliance**                  | Provide a process for individuals to challenge an organization's compliance.                                               | None                                               | **GAP**: No complaint/challenge mechanism defined                                                              | PRD 25 (Help Center) must add a "Privacy Complaint" ticket type. Complaints must be routed to the DPO. Response SLA: 30 calendar days.                                                                                                         |

### 2.2 Breach of Security Safeguards Regulations (BSSR)

| Requirement                                                                                          | PRD Reference                                             | Status                                                                      | Implementation Notes                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Report to Privacy Commissioner** within 72 hours if breach creates "real risk of significant harm" | 01-Architecture Section 13.8 (Breach Notification System) | **MET**: Step 6 reports within 72 hours                                     | Ensure the breach incident form includes a "real risk of significant harm" assessment checkbox with guidance criteria.                                                                      |
| **Notify affected individuals** as soon as feasible                                                  | 01-Architecture Section 13.8 (Step 5)                     | **MET**: Within 72 hours                                                    | Notification email template must include: description of breach, type of data affected, steps Concierge is taking, contact info for DPO, right to file complaint with Privacy Commissioner. |
| **Notify organizations** that may be able to reduce harm                                             | 01-Architecture Section 13.8                              | **GAP**: No step for notifying third parties (e.g., police, credit bureaus) | Add Step 4.5 to breach notification: if breach involves identity theft risk, notify affected individuals of credit monitoring options. Add configurable third-party notification list.      |
| **Keep records** of every breach for 2 years                                                         | 28-Compliance (Report 5)                                  | **MET**: Incident records retained indefinitely                             | Retention of 2 years minimum is met by the indefinite retention.                                                                                                                            |

### 2.3 Data Residency

| Requirement                                       | PRD Reference                    | Status                                                                                 | Implementation Notes                                                                                                                                                                                             |
| ------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All personal information must be stored in Canada | 01-Architecture Section 13.8     | **MET**: Toronto primary, Montreal secondary, Calgary cold                             | Ensure sub-processors (PostHog, Stripe, SMS providers) also store data in Canada or have DPAs covering cross-border transfers. PRD 18 (Integrations) must document data residency for every third-party service. |
| Third-party processors must comply                | ANALYTICS-FRAMEWORK.md Section 2 | **PARTIAL**: PostHog is self-hosted in Canada. Stripe and SMS providers not confirmed. | PRD 18 (Integrations) must add a "Data Residency" column to the integration registry table confirming Canadian hosting or DPA status for each provider.                                                          |

---

## 3. GDPR Requirements

GDPR applies when processing data of EU residents or if Concierge expands to the EU market.

### 3.1 Lawful Basis for Processing (Article 6)

| Data Category                                         | Lawful Basis                                       | Documented In                        | Status                                                                                          | Implementation Notes                                                                                                                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resident name, email, phone, unit                     | **Contract** -- necessary for service delivery     | 01-Architecture Section 13.8         | **GAP**: Lawful basis not documented per-field in a Record of Processing Activities (ROPA)      | Create a ROPA table as a new artifact in `docs/tech/ROPA.md`. Each row: field name, purpose, lawful basis, retention period, recipients, cross-border transfers. PRD 28 must add a "ROPA Report" as Report 9. |
| Security event logs (visitor names, incident details) | **Legitimate interest** -- building security       | Not formally documented              | **GAP**: Legitimate interest assessment not defined                                             | Create a Legitimate Interest Assessment (LIA) template. Document LIA for security data collection. Store in compliance evidence repository.                                                                   |
| Health/medical data                                   | **Explicit consent** + vital interests (emergency) | 01-Architecture Section 13.8 (HIPAA) | **PARTIAL**: HIPAA controls defined but GDPR Article 9 explicit consent not captured separately | PRD 08 (User Management) profile must include a separate explicit consent toggle for health data processing. This is distinct from the general privacy consent.                                               |
| Analytics events                                      | **Legitimate interest** with opt-out               | ANALYTICS-FRAMEWORK.md Section 10    | **MET**: Opt-out mechanism defined. No PII in events.                                           | No gaps.                                                                                                                                                                                                      |
| Marketing communications                              | **Consent**                                        | 28-Compliance (Report 6)             | **MET**: `marketing` consent type tracked.                                                      | No gaps.                                                                                                                                                                                                      |

### 3.2 Data Subject Rights (Articles 15-22)

| Right                            | Article | PRD Reference                                        | Status                                                                                                                                             | Implementation Notes                                                                                                                                                                                                                  |
| -------------------------------- | ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Right of access**              | Art. 15 | 27-Data Migration (Export), 28-Compliance (Report 7) | **PARTIAL**: DSAR workflow exists. Missing: machine-readable format spec and 30-day SLA enforcement.                                               | PRD 27 must specify JSON export schema. PRD 27 must add an automated SLA countdown timer visible to admin processing the request. GDPR deadline: 1 calendar month from receipt.                                                       |
| **Right to rectification**       | Art. 16 | 08-User Management (self-edit)                       | **PARTIAL**: Residents can edit name, phone, email. Cannot edit date of birth, unit instructions that reference them, or historical event records. | PRD 08 must add a "Request Correction" button for fields residents cannot self-edit. Admin receives the request and applies the correction. Log the correction in audit trail.                                                        |
| **Right to erasure**             | Art. 17 | 27-Data Migration (DSAR deletion)                    | **PARTIAL**: Deletion process defined but exceptions not documented                                                                                | PRD 27 Section 3.3.2 must document when erasure can be refused: legal obligation to retain (building security records), exercise of legal claims, public interest. Refusal must cite the specific exception.                          |
| **Right to restrict processing** | Art. 18 | 01-Architecture Section 13.8                         | **GAP**: Admin can disable processing per resident but no resident-facing mechanism                                                                | PRD 08 (User Management) My Account Privacy tab must add a "Restrict Processing" request button. When activated: data remains stored but is not processed (excluded from reports, notifications, AI). Admin is notified.              |
| **Right to data portability**    | Art. 20 | 27-Data Migration (Export)                           | **MET**: JSON and CSV export defined.                                                                                                              | Confirm JSON export follows a documented schema.                                                                                                                                                                                      |
| **Right to object**              | Art. 21 | ANALYTICS-FRAMEWORK.md (opt-out)                     | **PARTIAL**: Analytics opt-out exists. No objection mechanism for other processing.                                                                | PRD 08 must add a general "Object to Processing" option under My Account Privacy tab. Objects must be reviewed by admin within 30 days.                                                                                               |
| **Automated decision-making**    | Art. 22 | 19-AI Framework                                      | **GAP**: AI makes suggestions (priority classification, category assignment) but no right to contest                                               | PRD 19 (AI Framework) must add: (1) Disclosure that AI is used for classification, (2) Right to request human review of any AI decision, (3) "AI Made This Suggestion" badge on AI-classified items with "Request Human Review" link. |

### 3.3 Data Protection Impact Assessment (Article 35)

| Requirement                                          | PRD Reference                   | Status                                                                                                         | Implementation Notes                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DPIA required before processing that poses high risk | 28-Compliance (Report 4 -- PIA) | **PARTIAL**: PIA report exists but is reactive (analyzes existing access), not proactive (before new features) | Add a DPIA template to PRD 28 Section 3.1.4. Require DPIA sign-off before deploying any new feature that: (a) introduces a new PII field, (b) changes who can access PII, (c) introduces automated decision-making, (d) involves cross-border data transfer. |

### 3.4 Data Processing Agreements (Article 28)

| Requirement                                             | PRD Reference                | Status                                                                        | Implementation Notes                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DPA with every sub-processor                            | 01-Architecture Section 13.8 | **GAP**: DPA requirement mentioned but no DPA registry or management workflow | PRD 26 (Developer Portal) must include a "Sub-Processor List" public page listing all third-party services, their purpose, data they access, and their country of operation. PRD 16 (Settings Admin) must add a DPA management section for Super Admin to track DPA status per vendor. |
| Notify controller before adding/changing sub-processors | Not defined                  | **GAP**                                                                       | PRD 16 (Settings Admin) must add automated notification to all Property Admins when a new sub-processor is added. Provide 30-day objection window before new processor goes live.                                                                                                      |

### 3.5 Cross-Border Data Transfer (Chapter V)

| Requirement                                   | PRD Reference                | Status                                                                            | Implementation Notes                                                                                                      |
| --------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Adequate safeguards for transfers outside EEA | 01-Architecture Section 13.8 | **MET for current scope**: All data in Canada. Canada has GDPR adequacy decision. | If expanding to non-adequate countries, implement Standard Contractual Clauses (SCCs). Document in PRD 18 (Integrations). |
| Transfer Impact Assessment                    | Not defined                  | **GAP** (for future)                                                              | Create a Transfer Impact Assessment template in `docs/tech/` for use before onboarding any non-Canadian sub-processor.    |

---

## 4. SOC 2 Type II Requirements

SOC 2 covers five Trust Services Criteria (TSC). Each maps to specific controls.

### 4.1 Security (CC -- Common Criteria)

| Control | Requirement                                                | PRD Reference                                      | Status                                                                                                              | Implementation Notes                                                                                                                                                        |
| ------- | ---------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CC1.1   | COSO principle: commitment to integrity and ethical values | RULEBOOK.md                                        | **MET**: 21 mandatory rules documented.                                                                             | No gaps.                                                                                                                                                                    |
| CC2.1   | Internal and external communication of ISMS information    | 28-Compliance (Dashboard)                          | **PARTIAL**: Dashboard exists but no scheduled communication to stakeholders                                        | PRD 28 must add automated monthly compliance summary email to Property Admins.                                                                                              |
| CC3.1   | Risk assessment process                                    | 01-Architecture Section 13.8                       | **MET**: Formal risk register, quarterly reviews defined.                                                           | No gaps.                                                                                                                                                                    |
| CC5.1   | Accountability for internal controls                       | 01-Architecture Section 13.8                       | **GAP**: No control owner assignment mechanism                                                                      | PRD 28 Section 3.2 (Compliance Dashboard) must add a "Control Owners" table showing who owns each control, their last review date, and next review date.                    |
| CC6.1   | Logical access controls                                    | 02-Roles (RBAC), 01-Architecture (RLS)             | **MET**: 12+ roles, per-field permissions, RLS at DB level.                                                         | No gaps.                                                                                                                                                                    |
| CC6.2   | Registration and authorization of new users                | 08-User Management (Admin-created accounts)        | **MET**: Admin-only account creation, welcome email, role assignment.                                               | No gaps.                                                                                                                                                                    |
| CC6.3   | Removal of access when no longer needed                    | 08-User Management (Deactivation)                  | **PARTIAL**: Manual deactivation exists. No auto-deactivation on move-out date.                                     | PRD 08 must add: automated deactivation workflow when `move_out_date` passes. 7-day warning notification to admin before auto-deactivation. Admin can override with reason. |
| CC6.6   | Restriction and authorization of system changes            | TESTING-STRATEGY.md (CI/CD), RULEBOOK Rule 18      | **MET**: 12-gate release process, 2-reviewer PR requirement.                                                        | No gaps.                                                                                                                                                                    |
| CC6.8   | Prevention and detection of unauthorized software          | TESTING-STRATEGY.md (dependency scanning)          | **MET**: `pnpm audit`, `license-checker`, `gitleaks` all in CI.                                                     | No gaps.                                                                                                                                                                    |
| CC7.1   | Detection of security events                               | 28-Compliance (Report 2 -- Login Activity)         | **MET**: Anomaly detection with 6 flag types.                                                                       | No gaps.                                                                                                                                                                    |
| CC7.2   | Monitoring of system components                            | 01-Architecture Section 13.8                       | **PARTIAL**: Infrastructure monitoring defined but no application-level anomaly detection dashboard for Super Admin | PRD 28 compliance dashboard must add a "Security Anomalies" widget showing: unusual access patterns, off-hours activity spikes, bulk data access alerts.                    |
| CC7.3   | Evaluation of security events                              | 28-Compliance (Report 5 -- Incident Response)      | **MET**: P1-P4 classification, SLA adherence tracking.                                                              | No gaps.                                                                                                                                                                    |
| CC7.4   | Incident response activities                               | 01-Architecture Section 13.8 (Breach Notification) | **MET**: 7-step breach response, SLA timelines.                                                                     | No gaps.                                                                                                                                                                    |
| CC8.1   | System change management                                   | TESTING-STRATEGY.md (CI/CD pipeline)               | **MET**: PR pipeline, staging validation, gradual rollout.                                                          | No gaps.                                                                                                                                                                    |
| CC9.1   | Risk mitigation through business continuity                | 01-Architecture Section 13.5 (DR Plan)             | **MET**: RPO 1hr, RTO 4hr, geographic redundancy, quarterly drills.                                                 | No gaps.                                                                                                                                                                    |

### 4.2 Availability (A)

| Control | Requirement                    | PRD Reference                                 | Status                                                              | Implementation Notes                                                                                                                                                                 |
| ------- | ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1.1    | Processing capacity management | 01-Architecture Section 13.5                  | **GAP**: No capacity planning or auto-scaling thresholds documented | PRD 01 must add an auto-scaling policy: when CPU > 70% for 5 minutes, scale horizontally. When memory > 80%, alert Super Admin. Document in a new Section 14: "Capacity Management". |
| A1.2    | Environmental protections      | 01-Architecture Section 13.8 (cloud provider) | **MET**: Cloud provider responsibility. Verified via their SOC 2.   | No gaps.                                                                                                                                                                             |
| A1.3    | Recovery from incidents        | 01-Architecture Section 13.5                  | **MET**: DR plan, runbooks, quarterly drills.                       | No gaps.                                                                                                                                                                             |

### 4.3 Confidentiality (C)

| Control | Requirement                                | PRD Reference                                                   | Status                                                                            | Implementation Notes                                                                                                                                                                                                         |
| ------- | ------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1.1    | Identification of confidential information | 01-Architecture Section 13.7 (PII tiers)                        | **MET**: Three-tier classification (Critical/Sensitive/Standard).                 | No gaps.                                                                                                                                                                                                                     |
| C1.2    | Disposal of confidential information       | 27-Data Migration (DSAR deletion), 01-Architecture Section 13.7 | **PARTIAL**: Deletion process exists but no cryptographic erasure for backup data | PRD 01 Section 13.2 must specify: when property terminates, destroy per-property encryption keys within 30 days, rendering all backup data containing that property's data unrecoverable. Confirm this in ISO 27017 section. |

### 4.4 Privacy (P)

| Control | Requirement                               | PRD Reference                | Status                                                                     | Implementation Notes                                                    |
| ------- | ----------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| P1.1    | Privacy notice                            | 22-Marketing Website         | **GAP**: Privacy policy page not fully specified                           | See PIPEDA Section 2.1 Principle 8. PRD 22 must add `/privacy` page.    |
| P2.1    | Choice and consent                        | 28-Compliance (Report 6)     | **PARTIAL**: Consent types defined but collection flow not fully specified | See Section 10 of this document.                                        |
| P3.1    | Collection limited to identified purposes | 01-Architecture Section 13.7 | **MET**: Purpose limitation documented.                                    | No gaps.                                                                |
| P4.1    | Use limited to identified purposes        | 01-Architecture Section 13.7 | **MET**: Data not used beyond documented purpose.                          | No gaps.                                                                |
| P5.1    | Access by data subjects                   | 27-Data Migration (DSAR)     | **MET**: DSAR workflow, self-service export.                               | Ensure "Download My Data" button is added per PIPEDA Section 2.1 row 9. |
| P6.1    | Data retention and disposal               | 28-Compliance (Report 3)     | **PARTIAL**: Policies defined, automated purge not implemented             | See Section 11 of this document.                                        |
| P7.1    | Accuracy and quality                      | DATA-QUALITY.md              | **MET**: Comprehensive validation, duplicate detection, quality scoring.   | No gaps.                                                                |
| P8.1    | Complaints and disputes                   | None                         | **GAP**: No privacy complaint mechanism                                    | See PIPEDA Section 2.1 Principle 10.                                    |

---

## 5. ISO 27001 Requirements

ISO 27001 Annex A controls mapped to Concierge implementation.

| Annex A Control | Requirement                       | PRD Reference                                  | Status                                                                         | Implementation Notes                                                                                                                                                                                                                                                                                 |
| --------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A.5.1           | Policies for information security | RULEBOOK.md, 01-Architecture Section 13        | **MET**                                                                        | Annual review cycle must be enforced.                                                                                                                                                                                                                                                                |
| A.5.2           | Information security roles        | 02-Roles and Permissions                       | **GAP**: No "Security Officer" role defined within the platform                | PRD 02 must add a system-level "Security Officer" role tag that can be assigned to a Super Admin. This role receives all security alerts and is the point of contact for audits.                                                                                                                     |
| A.6.1           | Screening (before employment)     | Not applicable (SaaS, not employer)            | **N/A**                                                                        | Property management companies handle their own employee screening.                                                                                                                                                                                                                                   |
| A.7.1           | Inventory of assets               | 01-Architecture Section 13.8                   | **MET**: Data assets classified. Infrastructure tracked.                       | No gaps.                                                                                                                                                                                                                                                                                             |
| A.8.1           | Classification of information     | 01-Architecture Section 13.7 (PII tiers)       | **MET**: Three-tier classification.                                            | No gaps.                                                                                                                                                                                                                                                                                             |
| A.8.2           | Labeling of information           | Not defined                                    | **GAP**: No visual labels on PII fields in the UI                              | PRD 07 (Unit Management) and PRD 08 (User Management) must add a small "Sensitive" or "Protected" badge next to Tier 1 and Tier 2 fields in edit forms. Badge tooltip: "This field contains protected personal information. Access is logged."                                                       |
| A.8.10          | Deletion of information           | 27-Data Migration (DSAR deletion)              | **PARTIAL**: Deletion process exists. Automated retention purge not scheduled. | See Section 11 (Data Retention Matrix).                                                                                                                                                                                                                                                              |
| A.8.11          | Data masking                      | 01-Architecture Section 13.7                   | **GAP**: PII masking for non-essential display not defined                     | PRD 08 must specify: phone numbers display as `(416) ***-1234` to all roles except Admin and the resident themselves. Email displays as `j***@email.com` to all roles except Admin and the resident. PRD 10 (Reports) must mask PII in report previews -- full data only in exports that are logged. |
| A.8.12          | Data leakage prevention           | RULEBOOK Rule 12, 01-Architecture Section 13.7 | **PARTIAL**: PII stripped from logs and AI. No DLP for file uploads.           | PRD 05 (Maintenance) and PRD 03 (Security) must specify: uploaded photos and documents are scanned for PII (e.g., credit cards, IDs visible in photos) using AI. If detected, warn the uploader: "This file may contain sensitive information. Confirm upload?"                                      |
| A.9.1-9.4       | Access control                    | 02-Roles, 08-User Management                   | **MET**: RBAC, admin-created accounts, session management, 2FA.                | No gaps.                                                                                                                                                                                                                                                                                             |
| A.12.4          | Logging and monitoring            | 28-Compliance (Reports 1, 2)                   | **MET**: Access audit, login activity, immutable logs.                         | No gaps.                                                                                                                                                                                                                                                                                             |

---

## 6. ISO 27701 Requirements

ISO 27701 extends ISO 27001 for privacy. Only incremental requirements listed.

| Clause | Requirement                        | PRD Reference                                   | Status                                                                                      | Implementation Notes                                                                                                                                                 |
| ------ | ---------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.2.1  | Identify and document purpose      | 01-Architecture Section 13.8                    | **GAP**: No formal ROPA                                                                     | Create `docs/tech/ROPA.md`. See GDPR Section 3.1.                                                                                                                    |
| 7.2.2  | Identify lawful basis              | 01-Architecture Section 13.8                    | **GAP**: Lawful basis not per-field                                                         | ROPA must include lawful basis per field.                                                                                                                            |
| 7.2.3  | Determine consent requirements     | 28-Compliance (Report 6)                        | **PARTIAL**: Consent types defined. Consent withdrawal mechanism not specified in UI.       | PRD 08 (User Management) My Account Privacy tab must add toggle switches for each consent type. Toggling off = consent revocation. Revocation logged with timestamp. |
| 7.2.5  | Privacy impact assessment          | 28-Compliance (Report 4)                        | **PARTIAL**: Reactive PIA exists. Proactive DPIA not integrated into development lifecycle. | Add DPIA requirement to RULEBOOK.md as a new rule. Every PR that adds PII fields must include a DPIA review.                                                         |
| 7.2.6  | Contracts with PII processors      | Not defined                                     | **GAP**: No DPA management                                                                  | See GDPR Section 3.4.                                                                                                                                                |
| 7.3.1  | Obligations to data subjects       | 27-Data Migration (DSAR)                        | **MET**: DSAR workflow covers access, deletion.                                             | Ensure rectification and restriction are added per GDPR Section 3.2.                                                                                                 |
| 7.3.3  | Providing mechanism for objections | Not defined                                     | **GAP**                                                                                     | See GDPR Section 3.2 (Right to Object).                                                                                                                              |
| 7.3.9  | PII de-identification and deletion | 27-Data Migration, 01-Architecture Section 13.7 | **MET**: PII anonymization process defined.                                                 | No gaps.                                                                                                                                                             |
| 7.4.5  | PII sharing and transfer           | 01-Architecture Section 13.8                    | **MET**: All data in Canada (adequacy decision).                                            | Document adequacy decision reference in compliance evidence.                                                                                                         |
| 7.5.1  | PII de-identification              | ANALYTICS-FRAMEWORK.md                          | **MET**: Analytics uses hashed property IDs, no PII.                                        | No gaps.                                                                                                                                                             |

---

## 7. ISO 27017 Requirements

Cloud-specific security controls for multi-tenant SaaS.

| Control    | Requirement                                                        | PRD Reference                                         | Status                                                                                             | Implementation Notes                                                                                                                      |
| ---------- | ------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| CLD.6.3.1  | Shared responsibility model                                        | 01-Architecture Section 13.8                          | **MET**: Three-party responsibility matrix defined.                                                | Publish the shared responsibility model on the marketing website Security page (PRD 22).                                                  |
| CLD.8.1.5  | Removal of cloud service customer assets                           | 01-Architecture Section 13.8 (ISO 27017 section)      | **MET**: 30-day deletion, key destruction.                                                         | No gaps.                                                                                                                                  |
| CLD.9.5.1  | Virtual or cloud computing environment isolation                   | 01-Architecture Section 13.6 (RLS, per-property keys) | **MET**: RLS, per-property encryption keys, search index partitioning.                             | No gaps.                                                                                                                                  |
| CLD.9.5.2  | Virtual machine hardening                                          | 01-Architecture Section 13.8 (ISO 27017 section)      | **MET**: Container scanning, no root, read-only FS.                                                | No gaps.                                                                                                                                  |
| CLD.12.1.5 | Logging and monitoring for cloud services                          | 28-Compliance (Reports 1, 2)                          | **PARTIAL**: Application-level logging complete. Infrastructure-level change logging not surfaced. | PRD 28 compliance dashboard must add a "Infrastructure Changes" panel showing deployment logs, scaling events, and configuration changes. |
| CLD.12.4.5 | Monitoring of cloud services                                       | 28-Compliance (Dashboard)                             | **GAP**: No cloud service availability monitoring panel                                            | PRD 28 compliance dashboard must add uptime monitoring widget showing: current status, SLA compliance (target 99.9%), incident history.   |
| CLD.13.1.4 | Alignment of security management for virtual and physical networks | 01-Architecture (mTLS, network segmentation)          | **MET**: mTLS for service-to-service, network segmentation.                                        | No gaps.                                                                                                                                  |

---

## 8. ISO 9001 Requirements

Quality Management System requirements.

| Clause | Requirement                                       | PRD Reference                                            | Status                                                                 | Implementation Notes                                                                                                                                                   |
| ------ | ------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.4    | QMS and its processes                             | RULEBOOK.md, TESTING-STRATEGY.md                         | **MET**: 21 mandatory rules, documented testing strategy.              | No gaps.                                                                                                                                                               |
| 5.1.2  | Customer focus                                    | RULEBOOK Rule 3 (Admin experience paramount)             | **MET**: UX priority hierarchy defined.                                | No gaps.                                                                                                                                                               |
| 7.1.5  | Monitoring and measuring resources                | ANALYTICS-FRAMEWORK.md                                   | **MET**: Three analytics layers per module.                            | No gaps.                                                                                                                                                               |
| 7.5    | Documented information                            | RULEBOOK Rule 17                                         | **MET**: JSDoc, OpenAPI, ADRs, Storybook, Runbooks all mandatory.      | No gaps.                                                                                                                                                               |
| 8.2.1  | Customer communication                            | 09-Communication, 25-Help Center                         | **MET**: Multi-channel notifications, help center.                     | No gaps.                                                                                                                                                               |
| 8.5.1  | Control of production and service provision       | TESTING-STRATEGY.md (CI/CD), RULEBOOK Rule 18            | **MET**: 12-gate release process.                                      | No gaps.                                                                                                                                                               |
| 8.7    | Control of nonconforming outputs                  | RULEBOOK Rules 13-14 (95% coverage, integration testing) | **MET**: Zero-tolerance testing requirements.                          | No gaps.                                                                                                                                                               |
| 9.1    | Monitoring, measurement, analysis, and evaluation | 10-Reports (analytics layers)                            | **MET**: Three analytics layers.                                       | No gaps.                                                                                                                                                               |
| 9.2    | Internal audit                                    | 01-Architecture Section 13.8 (ISO 9001 section)          | **PARTIAL**: Quarterly self-assessment mentioned but no audit template | PRD 28 must add an "Internal Audit Checklist" report type (Report 10) that generates a pre-filled checklist against ISO 9001 clauses with pass/fail/N-A for each item. |
| 10.2   | Nonconformity and corrective action               | RULEBOOK Rule 18 (Bug SLAs)                              | **MET**: P1-P4 classification with defined response and fix times.     | No gaps.                                                                                                                                                               |
| 10.3   | Continual improvement                             | RULEBOOK Rule 10 (Analytics), AI Insights layer          | **MET**: AI-powered anomaly detection, improvement recommendations.    | No gaps.                                                                                                                                                               |

---

## 9. HIPAA Requirements

HIPAA applies to Protected Health Information (PHI) stored in resident profiles.

| HIPAA Rule                                      | Requirement                                                                       | PRD Reference                                | Status                                                                                        | Implementation Notes                                                                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Privacy Rule -- Minimum Necessary**           | Limit PHI access to the minimum needed                                            | 01-Architecture Section 13.8 (HIPAA)         | **MET**: Role-based PHI visibility. Security sees only accessibility flags, not full history. | No gaps.                                                                                                                                                                                                                            |
| **Privacy Rule -- Notice of Privacy Practices** | Provide notice describing PHI handling                                            | 22-Marketing Website                         | **GAP**: No Notice of Privacy Practices (NPP) for health data                                 | PRD 22 must add `/hipaa-notice` page. Properties storing health data must display NPP link during resident onboarding. PRD 08 first-login flow must show NPP acceptance for properties with HIPAA enabled.                          |
| **Privacy Rule -- Authorization**               | Obtain authorization before using PHI for non-treatment purposes                  | 01-Architecture Section 13.8                 | **GAP**: No separate PHI authorization form                                                   | PRD 08 (User Management) must add a "Health Information Authorization" consent type. This is separate from the general privacy consent. Must be revocable. Fields affected: all fields listed in Section 1.4 of this document.      |
| **Security Rule -- Administrative Safeguards**  | Security management process, assigned security responsibility, workforce security | 01-Architecture Section 13, RULEBOOK         | **MET**: Formal security policies, access controls, training.                                 | No gaps.                                                                                                                                                                                                                            |
| **Security Rule -- Physical Safeguards**        | Cloud provider responsibility                                                     | 01-Architecture Section 13.8                 | **MET**: Cloud provider SOC 2 / ISO 27001 required.                                           | No gaps.                                                                                                                                                                                                                            |
| **Security Rule -- Technical Safeguards**       | Access control, audit controls, integrity controls, transmission security         | 01-Architecture Section 13.1, 13.7           | **MET**: AES-256, TLS 1.3, Tier 1 double encryption for PHI, access logging.                  | No gaps.                                                                                                                                                                                                                            |
| **Security Rule -- Audit Controls**             | Record and examine access to PHI                                                  | 01-Architecture Section 13.9 (DataAccessLog) | **MET**: Every PHI read/write/export logged. 6-year retention.                                | No gaps.                                                                                                                                                                                                                            |
| **Breach Notification Rule**                    | Notify individuals within 60 days                                                 | 01-Architecture Section 13.8                 | **MET**: 60-day notification for HIPAA specified.                                             | If breach affects 500+ individuals, add HHS and media notification as documented in 01-Architecture. Confirm this is in the automated breach workflow.                                                                              |
| **BAA Requirements**                            | BAA with all business associates                                                  | 01-Architecture Section 13.8                 | **PARTIAL**: BAA requirement stated but no BAA registry                                       | PRD 16 (Settings Admin) Super Admin section must add a "BAA Registry" management screen listing: vendor name, BAA status (active/expired/pending), BAA start date, renewal date, scope of PHI access. Alerts 90 days before expiry. |

---

## 10. Cross-Framework Consent Model

This section defines the unified consent model that satisfies PIPEDA Principle 3, GDPR Articles 6-7, ISO 27701 Clause 7.2.3, and HIPAA Authorization requirements simultaneously.

### 10.1 Consent Types (Merged from All Frameworks)

| Consent Type                | PIPEDA | GDPR         | HIPAA | Required for Account?   | Default      | Collection Point      | Renewal          |
| --------------------------- | ------ | ------------ | ----- | ----------------------- | ------------ | --------------------- | ---------------- |
| `terms_of_service`          | Yes    | Yes          | --    | Yes                     | --           | Onboarding Step 1     | On policy update |
| `privacy_policy`            | Yes    | Yes          | --    | Yes                     | --           | Onboarding Step 1     | On policy update |
| `data_processing_general`   | Yes    | Yes (Art. 6) | --    | Yes                     | --           | Onboarding Step 1     | Annual           |
| `health_data_authorization` | --     | Yes (Art. 9) | Yes   | No (only if PHI stored) | Off          | Profile > Privacy tab | Annual           |
| `email_notifications`       | Yes    | Yes          | --    | No                      | On           | Onboarding Step 3     | None             |
| `sms_notifications`         | Yes    | Yes          | --    | No                      | Off          | Onboarding Step 3     | None             |
| `push_notifications`        | --     | Yes          | --    | No                      | On           | Onboarding Step 3     | None             |
| `data_sharing_management`   | Yes    | Yes (Art. 6) | --    | Yes                     | --           | Onboarding Step 1     | Annual           |
| `data_sharing_vendors`      | Yes    | Yes (Art. 6) | --    | No                      | Off          | Onboarding Step 1     | Annual           |
| `marketing`                 | Yes    | Yes          | --    | No                      | Off          | Onboarding Step 3     | None             |
| `analytics`                 | Yes    | Yes          | --    | No                      | On (opt-out) | Settings > Privacy    | None             |
| `emergency_data_access`     | Yes    | Yes (Art. 6) | Yes   | No (recommended)        | On           | Onboarding Step 1     | None             |
| `cross_border_transfer`     | --     | Yes (Ch. V)  | --    | No (only if applicable) | Off          | Settings > Privacy    | Per transfer     |

### 10.2 Consent Record Schema

Every consent grant or revocation must be stored with:

| Field                 | Type         | Description                                                                  |
| --------------------- | ------------ | ---------------------------------------------------------------------------- |
| `id`                  | UUID         | Primary key                                                                  |
| `user_id`             | UUID FK      | The data subject                                                             |
| `property_id`         | UUID FK      | Property context                                                             |
| `consent_type`        | enum         | One of the types above                                                       |
| `status`              | enum         | `granted`, `revoked`, `expired`, `pending`                                   |
| `granted_at`          | timestamptz  | When consent was given                                                       |
| `revoked_at`          | timestamptz  | When consent was withdrawn (null if still active)                            |
| `consent_version`     | varchar(20)  | Version of the policy document (e.g., "2.1")                                 |
| `policy_document_url` | varchar(500) | URL to the policy at the time of consent                                     |
| `collection_method`   | enum         | `onboarding_wizard`, `settings_page`, `email_prompt`, `in_app_prompt`, `api` |
| `ip_address`          | varchar(45)  | IP at time of consent action                                                 |
| `user_agent`          | varchar(500) | Browser/device at time of consent                                            |
| `created_at`          | timestamptz  | Record creation timestamp                                                    |

### 10.3 Consent Withdrawal Rules

- Withdrawing `data_processing_general` triggers account restriction: data retained but not processed. Admin and resident are notified. Resident must contact admin to reactivate or request deletion.
- Withdrawing `health_data_authorization` immediately hides all PHI fields from all roles. PHI data is retained (encrypted) but not displayed. Resident can re-grant at any time.
- Withdrawing `email_notifications`, `sms_notifications`, or `push_notifications` takes effect immediately. Emergency notifications are exempt.
- Withdrawing `analytics` takes effect on next page load.

---

## 11. Data Retention Matrix

This matrix defines the retention period for every data category, the legal basis for that period, the automated action when the period expires, and which frameworks drive the retention requirement.

| Data Category                       | Retention Period                            | Legal Basis                    | Frameworks               | Automated Action on Expiry                                           | PRD Reference          |
| ----------------------------------- | ------------------------------------------- | ------------------------------ | ------------------------ | -------------------------------------------------------------------- | ---------------------- |
| **Active user accounts**            | Duration of occupancy + 1 year              | Contractual necessity          | PIPEDA, GDPR             | After 1 year post-move-out: deactivate account, archive PII          | 08-User Management     |
| **Deactivated user accounts (PII)** | 2 years after deactivation                  | PIPEDA Principle 5             | PIPEDA, GDPR             | Anonymize PII fields, retain anonymized record                       | 08-User Management     |
| **Security events**                 | 7 years                                     | Building code, legal liability | PIPEDA, SOC 2, ISO 27001 | Archive to cold storage, retain anonymized summary                   | 03-Security Console    |
| **Package records**                 | 3 years                                     | Operational necessity          | PIPEDA                   | Delete PII (resident names), retain count-level data                 | 04-Package Management  |
| **Maintenance requests**            | 7 years                                     | Building code compliance       | PIPEDA, ISO 9001         | Archive to cold storage                                              | 05-Maintenance         |
| **Audit logs**                      | 10 years                                    | SOC 2, ISO 27001               | SOC 2, ISO 27001         | Archive to cold storage (never delete)                               | 01-Architecture        |
| **PHI access logs**                 | 6 years                                     | HIPAA                          | HIPAA                    | Archive to cold storage (never delete before 6 years)                | 01-Architecture        |
| **Login history**                   | 2 years                                     | SOC 2                          | SOC 2, GDPR              | Delete. Retain aggregated metrics only.                              | 08-User Management     |
| **Visitor records**                 | 3 years                                     | Building security              | PIPEDA                   | Anonymize visitor names and ID numbers                               | 03-Security Console    |
| **Amenity bookings**                | 2 years                                     | Operational                    | PIPEDA                   | Delete PII, retain usage statistics                                  | 06-Amenity Booking     |
| **Consent records**                 | Indefinite                                  | Legal proof of consent         | GDPR, PIPEDA, HIPAA      | Never delete                                                         | 28-Compliance          |
| **DSAR records**                    | 5 years after completion                    | Audit trail                    | GDPR, PIPEDA             | Archive to cold storage                                              | 27-Data Migration      |
| **Emergency contacts**              | Duration of occupancy                       | Safety                         | PIPEDA, HIPAA            | Delete on move-out + 30 day grace period                             | 07-Unit Management     |
| **Analytics events (raw)**          | 12 months                                   | Operational analytics          | GDPR, PIPEDA             | Delete raw events. Aggregated data retained indefinitely.            | ANALYTICS-FRAMEWORK.md |
| **Uploaded documents**              | Duration of relevance + 1 year              | Operational                    | PIPEDA                   | Flag for admin review. Do not auto-delete files.                     | 07-Unit Management     |
| **Backup data**                     | Per backup tier: Hot 7d, Warm 30d, Cold 1yr | DR requirements                | SOC 2, ISO 27001         | Auto-expire per tier. Property termination: destroy encryption keys. | 01-Architecture        |
| **Incident response records**       | Indefinite                                  | Audit trail                    | SOC 2, ISO 27001, PIPEDA | Never delete                                                         | 28-Compliance          |
| **Vendor compliance documents**     | Duration of vendor relationship + 3 years   | Liability                      | SOC 2, ISO 9001          | Archive after vendor relationship ends                               | 05-Maintenance         |
| **Training completion records**     | Duration of employment + 2 years            | HIPAA, ISO 9001                | HIPAA, ISO 9001          | Archive to cold storage                                              | 11-Training LMS        |
| **Classified ads**                  | 1 year after ad closure                     | Operational                    | PIPEDA                   | Delete                                                               | 12-Community           |
| **Billing/invoice records**         | 7 years                                     | Tax law (CRA)                  | PIPEDA, ISO 9001         | Archive to cold storage                                              | 24-Billing             |

### 11.1 Automated Retention Enforcement

**Implementation requirement for PRD 27 (Data Migration)**:

1. A daily scheduled job (`retention-enforcer`) runs at 3:00 AM UTC.
2. For each data category, it queries records past their retention period.
3. For categories with "Anonymize" action: replace PII fields with `[REDACTED]`, retain the record.
4. For categories with "Delete" action: soft-delete the record, then hard-delete after 30-day grace period.
5. For categories with "Archive" action: move to cold storage tier, update record pointer.
6. Every action is logged in the audit trail with: data category, record count, action taken, job run ID.
7. A monthly "Retention Report" is auto-generated and sent to Super Admin.

---

## 12. Breach Notification Matrix

Different frameworks have different notification timelines. The platform must satisfy the strictest applicable deadline.

| Framework     | Notify Regulator                                                                  | Notify Data Subjects                         | Notify Media                                | Other Notifications                                                |
| ------------- | --------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| **PIPEDA**    | Privacy Commissioner of Canada within 72 hours (if real risk of significant harm) | "As soon as feasible" after determining risk | Not required                                | Organizations that may reduce harm                                 |
| **GDPR**      | Supervisory Authority within 72 hours (unless unlikely to result in risk)         | "Without undue delay" if high risk           | Not required                                | No additional                                                      |
| **SOC 2**     | Not applicable (framework, not law)                                               | Per contractual obligation                   | Not applicable                              | Service organization's customers (Property Admins) within 24 hours |
| **ISO 27001** | Per legal requirements of operating jurisdiction                                  | Per legal requirements                       | Per legal requirements                      | Interested parties per communication plan                          |
| **HIPAA**     | HHS within 60 days (if 500+ individuals). Smaller breaches: annual log.           | Within 60 days                               | Local media if 500+ in a state/jurisdiction | Not applicable                                                     |

### 12.1 Concierge Unified Breach Timeline

To satisfy all frameworks simultaneously, Concierge follows this timeline:

| Time After Detection    | Action                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 - 15 minutes**      | Containment initiated. Affected systems identified. Security team alerted.                                                                                                                               |
| **15 minutes - 1 hour** | Super Admin notified (SMS + email + push). Affected properties identified from access logs.                                                                                                              |
| **1 - 24 hours**        | Property Admins of affected properties notified (email + push). Investigation and root cause analysis.                                                                                                   |
| **24 - 48 hours**       | Breach severity assessment completed. Determine if PIPEDA "real risk of significant harm" threshold met. Determine if GDPR "risk to rights and freedoms" threshold met. Determine if HIPAA PHI involved. |
| **48 - 72 hours**       | If PIPEDA threshold met: file report with Privacy Commissioner of Canada. If GDPR threshold met: file report with Supervisory Authority. Draft affected-individual notification.                         |
| **72 hours - 7 days**   | Notify affected individuals (all frameworks). If HIPAA PHI involved and 500+ affected: notify HHS and local media. Post-incident report drafted.                                                         |
| **7 - 60 days**         | If HIPAA applies: ensure individual notifications sent within 60 days. Final post-incident report. Remediation plan implemented. Lessons learned documented.                                             |

### 12.2 Breach Notification Content (All Frameworks)

Every breach notification to affected individuals must include:

1. Description of what happened and when
2. Types of personal information involved (list specific fields)
3. What Concierge has done and is doing to address the breach
4. What Concierge has done to mitigate harm
5. What the individual can do to protect themselves
6. Contact information for Concierge's DPO
7. Right to file a complaint with the Privacy Commissioner of Canada (PIPEDA)
8. Right to file a complaint with the Supervisory Authority (GDPR)
9. If HIPAA PHI involved: description of PHI types and toll-free number for questions

---

## 13. Encryption Requirements Matrix

| Data Classification     | At-Rest Encryption | In-Transit Encryption | Application-Level Encryption                 | Key Rotation | Examples                                                                                     |
| ----------------------- | ------------------ | --------------------- | -------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| **Tier 1 -- Critical**  | AES-256 (storage)  | TLS 1.3               | AES-256 (application-level, before DB write) | Quarterly    | SIN, buzzer codes, alarm codes, medical conditions, medications, allergies                   |
| **Tier 2 -- Sensitive** | AES-256 (storage)  | TLS 1.3               | AES-256 (application-level)                  | Quarterly    | Email, phone, address, date of birth, IP address, fob serial, maintenance photos, visitor ID |
| **Tier 3 -- Standard**  | AES-256 (storage)  | TLS 1.3               | None (storage encryption sufficient)         | Annual       | First name, last name, unit number, package tracking number, announcement text               |

### 13.1 Key Management

| Aspect            | Requirement                                          | PRD Reference                  |
| ----------------- | ---------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Key storage       | Cloud KMS (never alongside data)                     | 01-Architecture Section 13.1   |
| Per-property keys | Each property has its own encryption key             | 01-Architecture Section 13.1   |
| Key rotation      | Quarterly for Tier 1 and 2, Annual for Tier 3        | 01-Architecture Section 13.1   |
| Key destruction   | On property termination, destroy keys within 30 days | 01-Architecture Section 13.8   |
| Key access audit  | Every key access logged in KMS audit trail           | **GAP**: Not explicitly stated | PRD 01 must add: KMS audit log retention of 10 years. KMS key access events forwarded to compliance dashboard. |

---

## 14. Gaps Summary and Remediation Plan

This section consolidates all gaps identified throughout this document into a prioritized remediation plan.

### 14.1 Critical Gaps (Must resolve before v1 launch)

| #   | Gap                                                           | Affected Frameworks        | PRD to Update                                                    | Remediation                                                                                                                                                                                         |
| --- | ------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **No Privacy Policy page** on marketing website               | PIPEDA, GDPR, SOC 2 (P1.1) | 22-Marketing Website                                             | Add `/privacy` and `/terms` routes. Link from every authenticated page footer. Plain-language content. Bilingual (en + fr-CA).                                                                      |
| C2  | **Consent collection not fully specified** in onboarding flow | PIPEDA, GDPR, ISO 27701    | 23-Onboarding Wizard, 08-User Management                         | Onboarding Step 1 must include explicit consent checkboxes (not bundled) for: terms, privacy, data processing, data sharing. First-login flow Step 3 must capture notification consents separately. |
| C3  | **No resident-facing Privacy tab** in My Account              | PIPEDA, GDPR, ISO 27701    | 08-User Management                                               | Add "Privacy" tab to My Account with: Download My Data button, consent toggles, Restrict Processing request, Object to Processing request, Privacy Complaint link.                                  |
| C4  | **No automated data retention purge**                         | PIPEDA, GDPR, SOC 2 (P6.1) | 27-Data Migration                                                | Implement `retention-enforcer` daily job. See Section 11.1 for specification.                                                                                                                       |
| C5  | **No ROPA (Record of Processing Activities)**                 | GDPR, ISO 27701            | New document: `docs/tech/ROPA.md` + 28-Compliance (new Report 9) | Create ROPA document. Add ROPA Report to PRD 28.                                                                                                                                                    |
| C6  | **No DPO configuration** in platform                          | PIPEDA, GDPR               | 16-Settings Admin                                                | Add DPO name and contact fields to ManagementCompany settings. Display on Privacy Policy page and in breach notifications.                                                                          |
| C7  | **No privacy complaint mechanism**                            | PIPEDA, SOC 2 (P8.1)       | 25-Help Center                                                   | Add "Privacy Complaint" ticket type. Route to DPO. 30-day SLA.                                                                                                                                      |

### 14.2 High-Priority Gaps (Must resolve within 30 days post-launch)

| #   | Gap                                                                    | Affected Frameworks     | PRD to Update                          | Remediation                                                                                                                |
| --- | ---------------------------------------------------------------------- | ----------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| H1  | **AI decision transparency** -- no right to contest AI classifications | GDPR Art. 22            | 19-AI Framework                        | Add "AI Made This Suggestion" badge. Add "Request Human Review" link. Add disclosure in privacy policy.                    |
| H2  | **PII masking for non-essential display**                              | ISO 27001 A.8.11        | 08-User Management, 10-Reports         | Mask phone and email in display unless user is Admin or the data subject. Unmask requires logged click.                    |
| H3  | **Auto-deactivation on move-out**                                      | SOC 2 CC6.3             | 08-User Management                     | Add scheduled job: 7-day warning before move-out date, auto-deactivate on move-out date + 1 day. Admin override available. |
| H4  | **Sub-processor list and DPA management**                              | GDPR Art. 28, ISO 27701 | 26-Developer Portal, 16-Settings Admin | Public sub-processor list page. DPA registry for Super Admin. 30-day notification before new processor.                    |
| H5  | **BAA registry** for HIPAA                                             | HIPAA                   | 16-Settings Admin                      | BAA management screen for Super Admin. Track vendor, status, dates, scope. 90-day expiry alerts.                           |
| H6  | **PII labels in UI**                                                   | ISO 27001 A.8.2         | 07-Unit Management, 08-User Management | Add "Protected" badges next to Tier 1/2 fields in edit forms.                                                              |
| H7  | **Third-party data residency documentation**                           | PIPEDA                  | 18-Integrations                        | Add "Data Residency" column to integration registry. Confirm Canadian hosting or DPA status per provider.                  |
| H8  | **HIPAA Notice of Privacy Practices**                                  | HIPAA                   | 22-Marketing Website                   | Add `/hipaa-notice` page. Show acceptance during onboarding for HIPAA-enabled properties.                                  |
| H9  | **DLP for file uploads**                                               | ISO 27001 A.8.12        | 03-Security Console, 05-Maintenance    | AI-powered scan of uploaded photos/documents for visible PII. Warn before upload completes.                                |

### 14.3 Medium-Priority Gaps (Must resolve within 90 days post-launch)

| #   | Gap                                                                          | Affected Frameworks       | PRD to Update                     | Remediation                                                            |
| --- | ---------------------------------------------------------------------------- | ------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| M1  | **Right to Rectification -- request mechanism** for non-self-editable fields | GDPR Art. 16              | 08-User Management                | Add "Request Correction" button for fields residents cannot self-edit. |
| M2  | **Erasure exception documentation**                                          | GDPR Art. 17              | 27-Data Migration                 | Document when erasure can be refused with specific legal basis.        |
| M3  | **Legitimate Interest Assessment template**                                  | GDPR                      | New document                      | Create LIA template for security data collection.                      |
| M4  | **DPIA integrated into development lifecycle**                               | GDPR Art. 35, ISO 27701   | RULEBOOK.md                       | Add new rule: DPIA required for PRs introducing new PII fields.        |
| M5  | **SOC 2 control owner assignments**                                          | SOC 2 CC5.1               | 28-Compliance                     | Add "Control Owners" table to compliance dashboard.                    |
| M6  | **Infrastructure changes panel**                                             | ISO 27017 CLD.12.1.5      | 28-Compliance                     | Add infrastructure change log to compliance dashboard.                 |
| M7  | **Cloud uptime monitoring widget**                                           | ISO 27017 CLD.12.4.5      | 28-Compliance                     | Add SLA compliance and uptime widget.                                  |
| M8  | **Internal audit checklist report**                                          | ISO 9001 9.2              | 28-Compliance                     | Add Report 10: Internal Audit Checklist.                               |
| M9  | **Security Officer role designation**                                        | ISO 27001 A.5.2           | 02-Roles                          | Add Security Officer role tag.                                         |
| M10 | **Capacity management policy**                                               | SOC 2 A1.1                | 01-Architecture                   | Add Section 14: auto-scaling thresholds, capacity alerts.              |
| M11 | **Consent withdrawal for health data**                                       | HIPAA, GDPR Art. 9        | 08-User Management                | Separate health data consent toggle. Immediate effect on PHI display.  |
| M12 | **Purpose-of-collection disclosure per field**                               | PIPEDA Principle 2        | 08-User Management, 23-Onboarding | Tooltip per PII field showing why it is collected.                     |
| M13 | **Monthly compliance summary email**                                         | SOC 2 CC2.1               | 28-Compliance                     | Automated email to Property Admins summarizing compliance health.      |
| M14 | **KMS audit log forwarding**                                                 | All encryption frameworks | 01-Architecture                   | Forward KMS access events to compliance dashboard. 10-year retention.  |
| M15 | **Cross-border Transfer Impact Assessment template**                         | GDPR Ch. V                | New document                      | Create TIA template for non-Canadian sub-processor onboarding.         |

---

_Last updated: 2026-03-17_
_Frameworks covered: 8 (PIPEDA, GDPR, SOC 2 Type II, ISO 27001, ISO 27701, ISO 27017, ISO 9001, HIPAA)_
_Total gaps identified: 29 (7 Critical, 9 High, 15 Medium)_
_Total requirements mapped: 100+_
