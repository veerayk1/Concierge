# 28 — Compliance Reports

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 10-Reports and Analytics, 16-Settings Admin, 27-Data Migration (DSAR)

---

## 1. Overview

### What It Is

The Compliance Reports module provides a centralized dashboard and report generation system for monitoring, documenting, and proving compliance across 8 regulatory and industry frameworks. It includes:

1. **8 built-in compliance reports** -- pre-configured reports covering access auditing, login activity, data retention, privacy impact, incident response, consent tracking, data subject requests, and vendor compliance.
2. **A compliance dashboard** -- a single page showing a real-time compliance health score, framework-by-framework status cards, outstanding action items, and trend charts.
3. **Automated compliance monitoring** -- background checks that continuously verify security controls, data retention policies, encryption status, and access patterns, alerting administrators when something drifts out of compliance.

This module does not perform compliance certification. It provides the evidence, documentation, and monitoring that auditors need during certification assessments.

### Why It Exists

Concierge handles sensitive personal data for residential buildings -- names, emails, phone numbers, unit occupancy, emergency contacts, access device serial numbers, and visitor logs. This data falls under multiple regulatory frameworks:

- **PIPEDA** (Personal Information Protection and Electronic Documents Act) -- Canadian federal privacy law. Applies to all Canadian properties.
- **GDPR** (General Data Protection Regulation) -- European privacy law. Applies when any resident is an EU citizen or when EU-based data subjects interact with the system.
- **SOC 2** (System and Organization Controls 2) -- Trust services criteria for security, availability, processing integrity, confidentiality, and privacy. Required by enterprise property management companies.
- **ISO 27001** -- Information security management system standard. Required by large property management firms.
- **ISO 27701** -- Privacy information management extension to ISO 27001. Increasingly required for GDPR compliance demonstration.
- **ISO 27017** -- Cloud security controls. Relevant because Concierge is a cloud-hosted SaaS platform.
- **ISO 9001** -- Quality management system standard. Relevant for operational quality of property management services.
- **HIPAA** (Health Insurance Portability and Accountability Act) -- U.S. healthcare privacy law. Relevant when properties house medical offices or store health-related resident data (e.g., accessibility needs, medical alerts in emergency contacts).

Without built-in compliance reporting, property managers must manually compile evidence for audits -- a process that takes weeks and is prone to gaps. Automated compliance monitoring catches drift before auditors do.

### Which Roles Use It

| Role                       | Access Level                 | Primary Use                                                                                    |
| -------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **Super Admin**            | Unrestricted                 | View all compliance reports across all properties, configure monitoring, manage auditor access |
| **Property Admin**         | Property-scoped reports      | Generate and view compliance reports for their property, review action items                   |
| **Board Member**           | Selected reports (read-only) | View access audit, incident response, and vendor compliance reports for governance oversight   |
| **Auditor**                | Read-only, time-limited      | Access all compliance data during audit windows. Cannot modify any data.                       |
| **Property Manager**       | View property-scoped reports | Review compliance status, download reports for stakeholder meetings                            |
| **Resident**               | No access                    | Compliance reporting is an administrative function                                             |
| **Security Guard**         | No access                    | Operational role with no compliance reporting needs                                            |
| **Front Desk / Concierge** | No access                    | Operational role with no compliance reporting needs                                            |

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across production property management platforms and enterprise compliance tools revealed these essential patterns:

| Capability                                | Where Observed                                                                                                       | Our Approach                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Login audit trail**                     | Leading platforms track every authentication attempt with device, IP, and location data                              | Adopt. Login Activity Report with GeoIP lookup, MFA method tracking, and anomaly detection    |
| **Report builder with 20+ report types**  | Best-in-class platforms offer comprehensive reporting across all modules with date filtering and multi-format export | Adopt. 8 dedicated compliance reports with CSV, PDF, and Excel export                         |
| **Vendor insurance compliance dashboard** | Property management platforms track vendor insurance with 5-status cards and expiry alerts                           | Adopt. Vendor Compliance Report with automated expiry notifications at 60, 30, 14, and 7 days |
| **Data retention policies**               | Privacy-first platforms enforce configurable retention periods per data category                                     | Adopt. Data Retention Report with per-module breakdown and automated purge identification     |
| **Consent management**                    | GDPR-compliant platforms maintain auditable consent records with version tracking                                    | Adopt. Consent Records Report with full audit trail of consent grants and revocations         |
| **Role-based PII access tracking**        | Enterprise security tools monitor which roles access personally identifiable information                             | Adopt. Privacy Impact Assessment with role-by-field access matrix                             |

### Best Practices Adopted

1. **Continuous monitoring over periodic audits** -- compliance checks run on automated schedules (daily, weekly, monthly) rather than only during audit preparation. Issues are caught early.
2. **Evidence generation, not certification** -- the system generates the documentation and evidence that auditors require. It does not claim or confer compliance status itself.
3. **Compliance health score** -- a single 0-100 score provides at-a-glance understanding of compliance posture. This is a weighted composite of all active checks.
4. **Framework-specific mapping** -- each report clearly indicates which frameworks it supports, so auditors can quickly find relevant evidence.
5. **Immutable audit logs** -- compliance-critical logs are append-only. They cannot be modified or deleted by any user, including Super Admins.
6. **Time-bounded auditor access** -- the Auditor role has an explicit start and end date. Access automatically revokes when the audit window closes.

### Pitfalls Avoided

1. **No compliance theater** -- reports show real data, not fabricated metrics. If a check fails, it shows as failed. There is no "suppress finding" option.
2. **No single-format exports** -- all reports support at least two export formats (CSV + PDF) so auditors can choose their preferred format.
3. **No manual-only compliance checks** -- all checks are automated. Manual verification is an optional supplement, not a requirement.
4. **No stale data** -- compliance dashboard data refreshes on every page load. Reports are generated from live data (or the most recent check result for resource-intensive checks).
5. **No unrestricted auditor access** -- auditors can read compliance data but cannot access operational features, modify settings, or view data outside their audit scope.

---

## 3. Feature Specification

### 3.1 Core Features (v1) -- Built-In Compliance Reports

#### 3.1.1 Report 1: Access Audit Report

Tracks who accessed what data, when, and from where. This is the primary evidence report for PIPEDA, GDPR, SOC 2, and ISO 27001.

**Report Parameters** (user-configurable before generation):

| Parameter            | Type                           | Default     | Description                               |
| -------------------- | ------------------------------ | ----------- | ----------------------------------------- |
| `date_from`          | Date                           | 30 days ago | Start of the reporting period             |
| `date_to`            | Date                           | Today       | End of the reporting period               |
| `user_filter`        | User selector (multi-select)   | All users   | Filter to specific users                  |
| `module_filter`      | Module selector (multi-select) | All modules | Filter to specific modules                |
| `access_type_filter` | Enum multi-select              | All types   | Filter by: read, write, delete, export    |
| `pii_only`           | Boolean                        | false       | Show only events that accessed PII fields |

**Report Columns**:

| Column         | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `timestamp`    | ISO 8601 timestamp with timezone                                            |
| `user_name`    | Display name of the user                                                    |
| `user_role`    | Role at the time of access                                                  |
| `module`       | Module accessed (e.g., "Unit Management", "Security Console")               |
| `action`       | Action performed (read, create, update, delete, export, bulk_read)          |
| `entity_type`  | Type of record accessed (unit, resident, event, maintenance_request, etc.)  |
| `entity_id`    | UUID of the accessed record                                                 |
| `pii_accessed` | Boolean flag: true if PII fields were read or modified                      |
| `pii_fields`   | Comma-separated list of PII fields accessed (e.g., "email, phone, address") |
| `ip_address`   | IP address of the requester                                                 |
| `device`       | Browser and OS from user agent                                              |
| `session_id`   | Session identifier for correlating multiple actions                         |

**Highlighted Rows** (visually distinct in the report):

| Highlight          | Color             | Condition                                                      |
| ------------------ | ----------------- | -------------------------------------------------------------- |
| PII access         | Yellow background | `pii_accessed = true`                                          |
| Bulk data access   | Orange background | More than 100 records accessed in a single request             |
| After-hours access | Red left border   | Access occurred outside 6:00 AM - 10:00 PM property local time |
| Deletion event     | Red background    | `action = delete`                                              |

**Summary Section** (appears at the top of the PDF report):

| Metric                       | Description                                  |
| ---------------------------- | -------------------------------------------- |
| Total access events          | Count of all access events in the period     |
| Unique users                 | Number of distinct users who accessed data   |
| PII access events            | Count and percentage of events involving PII |
| Bulk access events           | Count of events accessing 100+ records       |
| After-hours events           | Count of events outside business hours       |
| Top 5 users by access volume | Bar chart                                    |
| Access by module             | Pie chart                                    |

**Export Formats**: CSV, PDF

**Applicable Frameworks**: PIPEDA (Principle 9 -- Individual Access), GDPR (Article 15 -- Right of Access), SOC 2 (CC6.1 -- Logical Access), ISO 27001 (A.9 -- Access Control)

#### 3.1.2 Report 2: Login Activity Report

Tracks all authentication attempts across the platform, both successful and failed.

**Report Parameters**:

| Parameter        | Type          | Default     | Description                            |
| ---------------- | ------------- | ----------- | -------------------------------------- |
| `date_from`      | Date          | 30 days ago | Start of the reporting period          |
| `date_to`        | Date          | Today       | End of the reporting period            |
| `user_filter`    | User selector | All users   | Filter to specific users               |
| `result_filter`  | Enum          | All         | Filter by: success, failed, locked_out |
| `anomalies_only` | Boolean       | false       | Show only flagged anomalies            |

**Report Columns**:

| Column             | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `timestamp`        | ISO 8601 timestamp with timezone                                         |
| `user_email`       | Email used in the login attempt                                          |
| `user_name`        | Display name (if the user exists)                                        |
| `result`           | Enum: success, failed_password, failed_mfa, locked_out, account_disabled |
| `ip_address`       | IP address of the login attempt                                          |
| `geo_location`     | City, country from GeoIP lookup (e.g., "Toronto, Canada")                |
| `device`           | Browser, OS, device type from user agent                                 |
| `mfa_method`       | MFA method used (email_otp, authenticator_app, sms, none)                |
| `session_duration` | For successful logins, how long the session lasted                       |
| `anomaly_flags`    | Array of detected anomalies (see below)                                  |

**Anomaly Detection Flags**:

| Flag                | Condition                                                                | Severity |
| ------------------- | ------------------------------------------------------------------------ | -------- |
| `brute_force`       | 5+ failed attempts for the same email within 15 minutes                  | High     |
| `impossible_travel` | Successful login from two locations more than 500 km apart within 1 hour | High     |
| `new_device`        | First login from this device/browser combination                         | Medium   |
| `new_location`      | First login from this city/country                                       | Medium   |
| `after_hours`       | Login outside 6 AM - 10 PM property local time                           | Low      |
| `multiple_sessions` | User has 3+ concurrent active sessions                                   | Medium   |

**Summary Section**:

| Metric                      | Description                           |
| --------------------------- | ------------------------------------- |
| Total login attempts        | Count of all attempts in the period   |
| Success rate                | Percentage of successful logins       |
| Failed attempts             | Count and top reasons for failure     |
| Unique IPs                  | Number of distinct IP addresses       |
| Anomalies detected          | Count by severity (high, medium, low) |
| Login volume over time      | Line chart (daily)                    |
| Top 10 failed login targets | Table of most-targeted accounts       |

**Export Formats**: CSV, PDF

**Applicable Frameworks**: PIPEDA (Safeguards), GDPR (Article 32 -- Security of Processing), SOC 2 (CC6.1, CC6.2), ISO 27001 (A.9.4 -- System Access Control)

#### 3.1.3 Report 3: Data Retention Report

Documents what data categories the system stores, how long each is retained, and identifies data that has exceeded its retention period.

**Report Parameters**:

| Parameter    | Type | Default | Description                            |
| ------------ | ---- | ------- | -------------------------------------- |
| `as_of_date` | Date | Today   | The date to evaluate retention against |

**Report Sections**:

**Section A -- Retention Policy Summary**:

| Data Category            | Module             | Retention Period               | Legal Basis              | Last Purge Date           |
| ------------------------ | ------------------ | ------------------------------ | ------------------------ | ------------------------- |
| Security events          | Security Console   | 7 years                        | PIPEDA record-keeping    | (date or "Never")         |
| Package records          | Package Management | 3 years                        | Operational necessity    | (date or "Never")         |
| Maintenance requests     | Maintenance        | 7 years                        | Building code compliance | (date or "Never")         |
| Audit logs               | System             | 10 years                       | SOC 2, ISO 27001         | (date or "Never")         |
| User accounts (active)   | User Management    | Duration of occupancy + 1 year | Contractual              | (date or "Never")         |
| User accounts (inactive) | User Management    | 2 years after deactivation     | PIPEDA Principle 5       | (date or "Never")         |
| Login history            | Authentication     | 2 years                        | SOC 2                    | (date or "Never")         |
| Visitor records          | Security Console   | 3 years                        | Building security        | (date or "Never")         |
| Amenity bookings         | Amenity Booking    | 2 years                        | Operational              | (date or "Never")         |
| Uploaded documents       | Library            | Duration of relevance + 1 year | Operational              | (date or "Never")         |
| Emergency contacts       | Unit Management    | Duration of occupancy          | Safety                   | N/A (deleted on move-out) |
| Consent records          | Compliance         | Indefinite                     | Legal proof of consent   | N/A                       |
| DSAR records             | Compliance         | 5 years after completion       | Audit trail              | (date or "Never")         |

**Section B -- Data Past Retention**:

| Data Category           | Records Past Retention | Oldest Record | Recommended Action                 |
| ----------------------- | ---------------------- | ------------- | ---------------------------------- |
| (populated dynamically) | Count                  | Date          | "Purge", "Review", or "Legal hold" |

**Section C -- Storage Metrics**:

| Data Category                           | Record Count | Storage Size | Growth Rate (monthly) |
| --------------------------------------- | ------------ | ------------ | --------------------- |
| (populated dynamically for each module) |              |              |                       |

**Export Formats**: CSV, PDF

**Applicable Frameworks**: PIPEDA (Principle 5 -- Limiting Use, Disclosure, and Retention), GDPR (Article 5(1)(e) -- Storage Limitation), SOC 2 (P6.1 -- Retention), ISO 27001 (A.8.10 -- Deletion of Information)

#### 3.1.4 Report 4: Privacy Impact Assessment (PIA)

Summarizes which roles access which PII fields, evaluates whether the access is necessary, and recommends access reductions.

**Report Parameters**:

| Parameter   | Type | Default     | Description           |
| ----------- | ---- | ----------- | --------------------- |
| `date_from` | Date | 90 days ago | Analysis period start |
| `date_to`   | Date | Today       | Analysis period end   |

**Report Sections**:

**Section A -- PII Field Inventory**:

| PII Field                 | Module                          | Data Type | Sensitivity Level |
| ------------------------- | ------------------------------- | --------- | ----------------- |
| `first_name`              | User Management                 | varchar   | Medium            |
| `last_name`               | User Management                 | varchar   | Medium            |
| `email`                   | User Management                 | varchar   | Medium            |
| `phone`                   | User Management                 | varchar   | Medium            |
| `address`                 | Unit Management                 | varchar   | High              |
| `emergency_contact_name`  | Unit Management                 | varchar   | Medium            |
| `emergency_contact_phone` | Unit Management                 | varchar   | Medium            |
| `date_of_birth`           | User Management                 | date      | High              |
| `fob_serial_number`       | Security Console                | varchar   | Medium            |
| `license_plate`           | Parking                         | varchar   | Medium            |
| `ip_address`              | Authentication                  | varchar   | Medium            |
| `visitor_name`            | Security Console                | varchar   | Low               |
| `id_number`               | Security Console (Key Checkout) | varchar   | High              |
| `medical_notes`           | Unit Management (if configured) | text      | Critical          |

**Section B -- Role-by-Field Access Matrix**:

A matrix table with roles as rows and PII fields as columns. Each cell shows:

- **R** -- role has read access to this field
- **W** -- role has write access to this field
- **-** -- role has no access to this field
- **?** -- role accessed this field but the access may not be necessary (flagged for review)

Example:

| Role             | first_name | email     | phone     | address | emergency_contact | fob_serial | license_plate | medical_notes |
| ---------------- | ---------- | --------- | --------- | ------- | ----------------- | ---------- | ------------- | ------------- |
| Super Admin      | R/W        | R/W       | R/W       | R/W     | R/W               | R/W        | R/W           | R/W           |
| Property Admin   | R/W        | R/W       | R/W       | R/W     | R/W               | R/W        | R/W           | R/W           |
| Property Manager | R          | R         | R         | R       | R                 | R          | R             | R             |
| Front Desk       | R          | R         | R         | -       | R                 | R          | -             | ?             |
| Security Guard   | R          | -         | R         | -       | R                 | R          | R             | -             |
| Board Member     | -          | -         | -         | -       | -                 | -          | -             | -             |
| Resident         | R (own)    | R/W (own) | R/W (own) | R (own) | R/W (own)         | R (own)    | R (own)       | -             |

**Section C -- Access Frequency Analysis**:

For each role, how often did they actually access each PII field during the analysis period? High access to fields marked "?" triggers a recommendation for access reduction.

**Section D -- Recommendations**:

AI-generated (or rule-based) recommendations:

| Finding                                                      | Recommendation                                                                                            | Priority |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------- |
| "Front Desk role accessed medical_notes 12 times in 90 days" | "Review whether Front Desk needs access to medical_notes. Consider restricting to emergency-only access." | High     |
| "Security Guard role never accessed email field"             | "Consider removing email access from Security Guard role to follow principle of least privilege."         | Medium   |

**Export Formats**: PDF (primary), CSV (data tables only)

**Applicable Frameworks**: PIPEDA (Principle 4 -- Limiting Collection), GDPR (Article 35 -- Data Protection Impact Assessment), ISO 27701 (Section 7.2.5 -- Privacy Impact Assessment)

#### 3.1.5 Report 5: Incident Response Report

Documents security incidents with a structured timeline from detection through resolution.

**Report Parameters**:

| Parameter         | Type              | Default     | Description                             |
| ----------------- | ----------------- | ----------- | --------------------------------------- |
| `incident_id`     | UUID (optional)   | None        | Generate report for a specific incident |
| `date_from`       | Date              | 90 days ago | Start of the reporting period           |
| `date_to`         | Date              | Today       | End of the reporting period             |
| `severity_filter` | Enum multi-select | All         | Filter by: critical, high, medium, low  |

**Per-Incident Fields**:

| Field                     | Description                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `incident_id`             | Unique identifier (format: `INC-{YEAR}-{SEQUENCE}`)                                        |
| `title`                   | Brief description of the incident                                                          |
| `severity`                | Critical, High, Medium, or Low                                                             |
| `status`                  | Open, Investigating, Contained, Eradicated, Recovered, Closed                              |
| `detected_at`             | Timestamp when the incident was first detected                                             |
| `detection_method`        | How it was detected: automated_alert, user_report, audit_review, third_party_notification  |
| `affected_data`           | Categories of data affected (e.g., "resident PII", "login credentials", "package records") |
| `affected_users_count`    | Number of users whose data was affected                                                    |
| `affected_units_count`    | Number of units affected (if applicable)                                                   |
| `root_cause`              | Description of the root cause (filled after investigation)                                 |
| `containment_actions`     | List of actions taken to contain the incident                                              |
| `eradication_actions`     | List of actions taken to eliminate the root cause                                          |
| `recovery_actions`        | List of actions taken to restore normal operations                                         |
| `lessons_learned`         | Post-incident findings and recommendations                                                 |
| `notification_required`   | Boolean: were affected individuals notified per PIPEDA/GDPR?                               |
| `notification_sent_at`    | Timestamp of breach notification to affected users                                         |
| `regulatory_report_filed` | Boolean: was the incident reported to a regulatory body?                                   |
| `regulatory_report_date`  | Date of regulatory filing                                                                  |

**Timeline View**:

Each incident includes a chronological timeline:

```
[Detection] 2026-03-10 14:23 — Automated alert: unusual bulk data access
[Triage]    2026-03-10 14:35 — Assigned to Security Team, severity set to High
[Contain]   2026-03-10 14:42 — Affected user account suspended
[Investigate] 2026-03-10 15:00 — Root cause identified: compromised API key
[Eradicate] 2026-03-10 15:15 — API key revoked, new key issued
[Recover]   2026-03-10 16:00 — Normal operations restored
[Notify]    2026-03-10 17:30 — Affected users notified via email
[Close]     2026-03-11 09:00 — Incident closed after 24-hour monitoring period
```

**SLA Adherence Table**:

| SLA Metric                    | Target                                       | Actual       | Met?   |
| ----------------------------- | -------------------------------------------- | ------------ | ------ |
| Time to detect                | < 15 minutes (automated), < 4 hours (manual) | (calculated) | Yes/No |
| Time to contain               | < 1 hour (critical), < 4 hours (high)        | (calculated) | Yes/No |
| Time to notify affected users | < 72 hours (GDPR), reasonable (PIPEDA)       | (calculated) | Yes/No |
| Time to resolve               | < 24 hours (critical), < 72 hours (high)     | (calculated) | Yes/No |

**Export Formats**: PDF

**Applicable Frameworks**: PIPEDA (Breach of Security Safeguards Regulations), GDPR (Articles 33-34 -- Breach Notification), SOC 2 (CC7.3, CC7.4 -- Incident Response), ISO 27001 (A.16 -- Information Security Incident Management)

#### 3.1.6 Report 6: Consent Records Report

Tracks all residents' data processing consent status, changes over time, and identifies residents who have not provided required consents.

**Report Parameters**:

| Parameter             | Type              | Default    | Description                                   |
| --------------------- | ----------------- | ---------- | --------------------------------------------- |
| `date_from`           | Date              | 1 year ago | Start of the reporting period                 |
| `date_to`             | Date              | Today      | End of the reporting period                   |
| `consent_type_filter` | Enum multi-select | All        | Filter by consent type                        |
| `status_filter`       | Enum              | All        | Filter by: granted, revoked, pending, expired |

**Consent Types Tracked**:

| Consent Type              | Description                                                          | Required?                  | Renewal Period   |
| ------------------------- | -------------------------------------------------------------------- | -------------------------- | ---------------- |
| `terms_of_service`        | Acceptance of platform terms of service                              | Yes (for account creation) | On policy update |
| `privacy_policy`          | Acceptance of privacy policy                                         | Yes (for account creation) | On policy update |
| `email_notifications`     | Consent to receive email notifications                               | No (opt-in)                | None             |
| `sms_notifications`       | Consent to receive SMS notifications                                 | No (opt-in)                | None             |
| `push_notifications`      | Consent to receive push notifications                                | No (opt-in)                | None             |
| `data_sharing_management` | Consent to share data with property management company               | Yes (for service)          | Annual           |
| `data_sharing_vendors`    | Consent to share data with third-party vendors (maintenance, etc.)   | No (opt-in)                | Annual           |
| `marketing`               | Consent to receive marketing communications                          | No (opt-in)                | None             |
| `analytics`               | Consent to include data in anonymized analytics                      | No (opt-out default)       | None             |
| `emergency_data_access`   | Consent for emergency services to access unit/emergency contact data | Yes (recommended)          | None             |

**Report Columns**:

| Column              | Description                                                                             |
| ------------------- | --------------------------------------------------------------------------------------- |
| `resident_name`     | Display name                                                                            |
| `unit_number`       | Associated unit                                                                         |
| `consent_type`      | Type of consent                                                                         |
| `status`            | Granted, Revoked, Pending, Expired                                                      |
| `granted_at`        | Timestamp of consent grant                                                              |
| `revoked_at`        | Timestamp of revocation (if applicable)                                                 |
| `consent_version`   | Version of the policy the consent was granted under                                     |
| `collection_method` | How consent was obtained: onboarding_wizard, settings_page, email_prompt, in_app_prompt |

**Summary Section**:

| Metric                               | Value                 |
| ------------------------------------ | --------------------- |
| Total residents                      | Count                 |
| Residents with all required consents | Count and percentage  |
| Residents missing required consents  | Count (action needed) |
| Consent grants in period             | Count                 |
| Consent revocations in period        | Count                 |
| Most-revoked consent type            | Name and count        |

**Action Items**:

The report highlights residents who are missing required consents. For each:

- Resident name, unit, email
- Missing consent type(s)
- Days since account creation (to gauge urgency)
- "Send Reminder" button (triggers an email prompting the resident to grant consent)

**Export Formats**: CSV, PDF

**Applicable Frameworks**: GDPR (Articles 6-7 -- Lawfulness of Processing, Conditions for Consent), PIPEDA (Principle 3 -- Consent), ISO 27701 (Section 7.2.3 -- Determining Requirements for Consent)

#### 3.1.7 Report 7: Data Subject Request (DSAR) Report

Tracks all access and deletion requests submitted by residents, their processing status, and SLA adherence. This report draws data from the DSARRequest model defined in PRD 27 (Data Migration).

**Report Parameters**:

| Parameter             | Type | Default    | Description                                        |
| --------------------- | ---- | ---------- | -------------------------------------------------- |
| `date_from`           | Date | 1 year ago | Start of the reporting period                      |
| `date_to`             | Date | Today      | End of the reporting period                        |
| `request_type_filter` | Enum | All        | Filter by: access, deletion                        |
| `status_filter`       | Enum | All        | Filter by: pending, in_progress, completed, denied |

**Report Columns**:

| Column                  | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `request_id`            | DSAR request UUID                                                |
| `submitted_at`          | Timestamp of request submission                                  |
| `resident_name`         | Requesting resident (anonymized for completed deletion requests) |
| `unit_number`           | Associated unit                                                  |
| `request_type`          | Access or Deletion                                               |
| `status`                | Pending, In Progress, Completed, Denied                          |
| `applicable_frameworks` | Which privacy frameworks apply (e.g., "PIPEDA, GDPR")            |
| `sla_deadline`          | Calculated deadline based on strictest framework                 |
| `completed_at`          | Timestamp of completion (if applicable)                          |
| `response_time_days`    | Days between submission and completion                           |
| `within_sla`            | Boolean: was the request completed within the SLA?               |
| `processed_by`          | Admin who processed the request                                  |
| `denial_reason`         | Reason for denial (if denied)                                    |

**Summary Section**:

| Metric                | Value                             |
| --------------------- | --------------------------------- |
| Total DSARs in period | Count                             |
| Access requests       | Count                             |
| Deletion requests     | Count                             |
| Completed within SLA  | Count and percentage              |
| SLA breaches          | Count (highlighted in red if > 0) |
| Average response time | Days                              |
| Pending requests      | Count                             |
| Denied requests       | Count with top denial reasons     |

**SLA Performance Chart**: Bar chart showing monthly DSAR volume with color coding (green = within SLA, red = breached).

**Export Formats**: CSV, PDF

**Applicable Frameworks**: PIPEDA (Principle 9 -- Individual Access), GDPR (Articles 15-17 -- Rights of the Data Subject), ISO 27701 (Section 7.3 -- Individual Rights)

#### 3.1.8 Report 8: Vendor Compliance Report

Tracks all active vendors and their insurance, certification, and compliance status.

**Report Parameters**:

| Parameter               | Type              | Default | Description                                                         |
| ----------------------- | ----------------- | ------- | ------------------------------------------------------------------- |
| `status_filter`         | Enum multi-select | All     | Filter by: compliant, non_compliant, expiring, expired, not_tracked |
| `insurance_type_filter` | Enum multi-select | All     | Filter by insurance type                                            |

**Vendor Compliance Statuses**:

| Status            | Color  | Definition                                                    |
| ----------------- | ------ | ------------------------------------------------------------- |
| **Compliant**     | Green  | All required insurance and certifications are current         |
| **Non-Compliant** | Red    | One or more required documents are missing or invalid         |
| **Expiring**      | Yellow | One or more documents expire within 30 days                   |
| **Expired**       | Orange | One or more documents have passed their expiry date           |
| **Not Tracked**   | Grey   | Vendor exists but compliance tracking has not been configured |

**Report Columns**:

| Column                   | Description                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `vendor_name`            | Vendor company name                                                                           |
| `vendor_type`            | Type of service (plumbing, electrical, HVAC, cleaning, etc.)                                  |
| `overall_status`         | Compliance status (enum above)                                                                |
| `general_liability`      | Status and expiry date of general liability insurance                                         |
| `workers_compensation`   | Status and expiry date of workers' compensation insurance                                     |
| `professional_liability` | Status and expiry date of professional liability / E&O insurance                              |
| `wsib_clearance`         | Status and expiry of WSIB (Workplace Safety and Insurance Board) clearance (Ontario-specific) |
| `business_license`       | Status and expiry of business license                                                         |
| `next_expiry_date`       | Earliest upcoming expiry across all documents                                                 |
| `days_until_expiry`      | Days until the next expiry                                                                    |
| `document_urls`          | Links to uploaded insurance certificates                                                      |
| `last_verified_by`       | Admin who last verified the vendor's documents                                                |
| `last_verified_at`       | Date of last verification                                                                     |

**Summary Section**:

| Metric                  | Value                         |
| ----------------------- | ----------------------------- |
| Total active vendors    | Count                         |
| Compliant               | Count and percentage          |
| Non-compliant           | Count (highlighted in red)    |
| Expiring within 30 days | Count (highlighted in yellow) |
| Expired                 | Count (highlighted in orange) |
| Not tracked             | Count                         |

**Status Cards**: 5 color-coded cards showing the count for each status. Clicking a card filters the table to that status.

**Expiry Alert Schedule**:

| Days Before Expiry | Alert Type                        | Recipient                                       |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| 60                 | Email                             | Property Admin                                  |
| 30                 | Email + in-app notification       | Property Admin + Property Manager               |
| 14                 | Email + in-app notification       | Property Admin + Property Manager               |
| 7                  | Email + SMS + in-app notification | Property Admin + Property Manager + Super Admin |
| 0 (day of expiry)  | Email + SMS                       | Property Admin + Super Admin                    |
| -7 (7 days past)   | Email + SMS (escalation)          | Super Admin                                     |

**Export Formats**: CSV, PDF, Excel

**Applicable Frameworks**: ISO 9001 (Section 8.4 -- Control of Externally Provided Processes), SOC 2 (CC9.2 -- Vendor Risk Management)

### 3.2 Core Features (v2)

#### 3.2.1 SOC 2 Evidence Pack Generator

Automatically compiles all evidence artifacts needed for a SOC 2 Type II audit into a single downloadable package, organized by Trust Services Criteria.

#### 3.2.2 ISO 27001 Statement of Applicability Mapper

Maps Concierge's implemented controls to ISO 27001 Annex A controls, showing compliance status for each control objective.

#### 3.2.3 Regulatory Change Tracker

Monitors changes to applicable privacy and security regulations and flags configuration adjustments that may be needed.

---

## 4. Feature Specification -- Compliance Dashboard

### 4.1 Compliance Health Score

A single score from 0 to 100 representing the overall compliance posture of the property.

**Score Calculation**:

The score is a weighted average of individual check categories:

| Category              | Weight | Components                                                                    |
| --------------------- | ------ | ----------------------------------------------------------------------------- |
| **Data Security**     | 25%    | Encryption at rest verified, encryption in transit verified, backup integrity |
| **Access Control**    | 20%    | Role-based access configured, MFA enforcement, password policy compliance     |
| **Privacy**           | 20%    | Consent coverage, DSAR response times, data retention compliance              |
| **Audit Readiness**   | 15%    | Audit log completeness, login tracking active, access audit available         |
| **Vendor Management** | 10%    | Vendor compliance percentage                                                  |
| **Incident Response** | 10%    | Incident response plan documented, SLA adherence                              |

**Score Bands**:

| Score Range | Color  | Label           | Description                                      |
| ----------- | ------ | --------------- | ------------------------------------------------ |
| 90-100      | Green  | Excellent       | All compliance controls are met                  |
| 70-89       | Blue   | Good            | Minor issues exist but overall posture is strong |
| 50-69       | Yellow | Needs Attention | Several issues require remediation               |
| 0-49        | Red    | Critical        | Significant compliance gaps exist                |

### 4.2 Framework Status Cards

One card per active framework, displayed in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile).

**Card Contents**:

| Element                  | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Framework name**       | e.g., "PIPEDA", "GDPR", "SOC 2"                                              |
| **Status indicator**     | Green circle (compliant), Yellow circle (issues), Red circle (non-compliant) |
| **Score**                | Percentage score for this specific framework                                 |
| **Open issues**          | Count of unresolved findings for this framework                              |
| **Last assessment date** | When this framework was last evaluated                                       |
| **Next audit date**      | When the next scheduled audit is (if configured)                             |

Clicking a card navigates to a detail page showing all checks and findings for that framework.

### 4.3 Action Items

A prioritized list of compliance tasks requiring attention.

| Column           | Description                                        |
| ---------------- | -------------------------------------------------- |
| **Priority**     | Critical, High, Medium, Low (with color indicator) |
| **Finding**      | Description of the compliance gap                  |
| **Framework(s)** | Which framework(s) this finding relates to         |
| **Due Date**     | When remediation must be completed                 |
| **Assigned To**  | Admin responsible for resolution                   |
| **Status**       | Open, In Progress, Resolved, Accepted Risk         |

### 4.4 Compliance Calendar

A monthly calendar view showing:

- Upcoming audit dates (red markers)
- Certification renewal dates (yellow markers)
- Vendor insurance expiry dates (orange markers)
- Scheduled compliance report generation dates (blue markers)

### 4.5 Trend Chart

A line chart showing the compliance health score over time (last 12 months). Each data point represents the score at the end of that month.

The chart includes separate lines for the overall score and for each framework score, with a legend. Users can toggle individual framework lines on/off.

---

## 5. Feature Specification -- Automated Compliance Monitoring

### 5.1 Monitoring Checks

Automated checks run on configurable schedules. Each check verifies a specific compliance control.

| Check                            | Schedule                   | What It Verifies                                                                                     | Failure Action                     |
| -------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Encryption at rest**           | Daily (2:00 AM)            | All database volumes have encryption enabled. S3 buckets have SSE-S3 or SSE-KMS.                     | Alert Super Admin                  |
| **Encryption in transit**        | Daily (2:00 AM)            | TLS 1.2+ enforced on all endpoints. No HTTP-only connections allowed.                                | Alert Super Admin                  |
| **Access controls match policy** | Weekly (Sunday 3:00 AM)    | Role permissions in the database match the configured RBAC policy. No privilege escalation detected. | Alert Property Admin + Super Admin |
| **Backup integrity**             | Daily (4:00 AM)            | Latest backup exists, is within 24 hours, and passes checksum verification.                          | Alert Super Admin (critical)       |
| **Retention policy enforced**    | Monthly (1st, 5:00 AM)     | No data exists past its configured retention period. Flag records needing purge.                     | Add action item                    |
| **PII access patterns**          | Real-time                  | Monitor for unusual PII access volume (>3 standard deviations from baseline).                        | Alert Security Team                |
| **Password policy compliance**   | Weekly (Monday 6:00 AM)    | All active users meet current password policy requirements. Flag users with legacy hashes.           | Add action item                    |
| **MFA enforcement**              | Weekly (Monday 6:00 AM)    | All admin and staff roles have MFA enabled.                                                          | Alert Property Admin               |
| **Vendor insurance validity**    | Daily (7:00 AM)            | Check all vendor insurance expiry dates. Flag expiring/expired documents.                            | Trigger expiry alert email         |
| **Audit log integrity**          | Daily (3:00 AM)            | Verify audit log continuity (no gaps in sequence numbers). Verify tamper detection checksums.        | Alert Super Admin (critical)       |
| **Session management**           | Real-time                  | Monitor for sessions exceeding maximum duration. Detect concurrent session anomalies.                | Auto-terminate + alert             |
| **Consent coverage**             | Weekly (Wednesday 8:00 AM) | Calculate percentage of residents with all required consents. Flag residents missing consents.       | Add action item                    |

### 5.2 Check Results

Each check execution produces a result stored in the ComplianceCheck model.

**Result Structure** (stored in `result` JSONB field):

```json
{
  "status": "pass" | "fail" | "warning",
  "message": "All database volumes have encryption enabled.",
  "details": [
    {
      "resource": "primary-db-volume",
      "status": "pass",
      "info": "AES-256 encryption via AWS KMS"
    },
    {
      "resource": "s3-uploads-bucket",
      "status": "pass",
      "info": "SSE-S3 encryption enabled"
    }
  ],
  "remediation_suggestion": null,
  "checked_at": "2026-03-16T02:00:00Z",
  "duration_ms": 1250
}
```

When a check fails, the `remediation_suggestion` field contains a plain-language suggestion:

```json
{
  "status": "fail",
  "message": "Backup integrity check failed: latest backup is 36 hours old.",
  "remediation_suggestion": "The most recent backup is from 2026-03-14 16:00. Expected a backup within the last 24 hours. Check the backup scheduler and verify AWS RDS snapshot configuration.",
  "checked_at": "2026-03-16T04:00:00Z"
}
```

### 5.3 Compliance Drift Alerts

When a check transitions from `pass` to `fail`, the system sends a compliance drift alert.

**Alert Levels**:

| Check Status Change           | Alert Level | Notification Channels      |
| ----------------------------- | ----------- | -------------------------- |
| Pass to Fail (critical check) | Critical    | Email + SMS + in-app       |
| Pass to Fail (standard check) | High        | Email + in-app             |
| Pass to Warning               | Medium      | In-app only                |
| Fail to Pass (auto-recovery)  | Info        | In-app only                |
| Fail persists for 48+ hours   | Escalation  | Email + SMS to Super Admin |

The system does NOT auto-remediate failed checks. It generates alerts and remediation suggestions. Humans make remediation decisions.

---

## 6. Data Model

### 6.1 ComplianceReport

```
ComplianceReport
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── report_type (enum: access_audit, login_activity, data_retention, privacy_impact,
│                incident_response, consent_records, dsar, vendor_compliance)
├── status (enum: queued, generating, completed, failed)
├── parameters (jsonb, NOT NULL) -- The filter/configuration parameters used to generate the report
├── generated_by → User (FK, NOT NULL)
├── generated_at (timestamp with tz, nullable)
├── file_url_csv (varchar 500, nullable) -- S3 URL for CSV version
├── file_url_pdf (varchar 500, nullable) -- S3 URL for PDF version
├── file_url_xlsx (varchar 500, nullable) -- S3 URL for Excel version (vendor report only)
├── summary_data (jsonb, nullable) -- Summary metrics for dashboard display without regenerating
├── record_count (integer, nullable) -- Number of records in the report
├── expires_at (timestamp with tz, nullable) -- Download link expiry (default: 30 days)
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_compliance_report_property_type (property_id, report_type)
  - idx_compliance_report_generated_at (generated_at DESC)
  - idx_compliance_report_expires (expires_at) WHERE status = 'completed'
```

### 6.2 ComplianceCheck

```
ComplianceCheck
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── check_type (enum: encryption_at_rest, encryption_in_transit, access_controls,
│               backup_integrity, retention_policy, pii_access_patterns,
│               password_policy, mfa_enforcement, vendor_insurance,
│               audit_log_integrity, session_management, consent_coverage)
├── schedule (varchar 50, NOT NULL) -- Human-readable schedule description
├── cron_expression (varchar 50, nullable) -- Cron for scheduled checks, null for real-time
├── is_real_time (boolean, default false)
├── status (enum: pass, fail, warning, not_run)
├── last_run_at (timestamp with tz, nullable)
├── next_run_at (timestamp with tz, nullable)
├── result (jsonb, nullable) -- Structured result from the last run
├── consecutive_failures (integer, default 0) -- For escalation logic
├── is_enabled (boolean, default true)
├── applicable_frameworks (varchar[], NOT NULL) -- e.g., ['PIPEDA', 'SOC2', 'ISO27001']
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_compliance_check_property (property_id)
  - idx_compliance_check_next_run (next_run_at) WHERE is_enabled = true AND NOT is_real_time
  - idx_compliance_check_status (property_id, status) WHERE status IN ('fail', 'warning')
```

### 6.3 ConsentRecord

```
ConsentRecord
├── id (UUID, PK)
├── user_id → User (FK, NOT NULL)
├── property_id → Property (FK, NOT NULL)
├── consent_type (enum: terms_of_service, privacy_policy, email_notifications,
│                 sms_notifications, push_notifications, data_sharing_management,
│                 data_sharing_vendors, marketing, analytics, emergency_data_access)
├── granted (boolean, NOT NULL)
├── granted_at (timestamp with tz, NOT NULL)
├── revoked_at (timestamp with tz, nullable)
├── consent_version (varchar 50, NOT NULL) -- Version of the policy (e.g., "2.1")
├── policy_url (varchar 500, nullable) -- URL to the policy version consented to
├── collection_method (enum: onboarding_wizard, settings_page, email_prompt,
│                      in_app_prompt, admin_override)
├── ip_address (varchar 45, nullable) -- IP at time of consent for audit purposes
├── user_agent (varchar 500, nullable) -- Browser at time of consent
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_consent_user_type (user_id, consent_type)
  - idx_consent_property (property_id, consent_type)
  - idx_consent_granted (property_id, consent_type, granted) WHERE granted = true

Constraints:
  - Consent records are append-only. Updates create new records; old records are never modified.
  - When consent is revoked, a new record is created with granted = false.
```

### 6.4 VendorCompliance

```
VendorCompliance
├── id (UUID, PK)
├── vendor_id → Vendor (FK, NOT NULL)
├── property_id → Property (FK, NOT NULL)
├── insurance_type (enum: general_liability, workers_compensation,
│                   professional_liability, wsib_clearance, business_license)
├── policy_number (varchar 100, nullable)
├── insurer_name (varchar 200, nullable)
├── coverage_amount (decimal 12,2, nullable) -- Dollar amount of coverage
├── effective_date (date, NOT NULL)
├── expires_at (date, NOT NULL)
├── document_url (varchar 500, nullable) -- S3 URL of the uploaded certificate
├── document_type (enum: pdf, image)
├── ocr_extracted_expiry (date, nullable) -- Expiry date extracted via OCR from image uploads
├── status (enum: compliant, non_compliant, expiring, expired, not_tracked)
├── verified_by → User (FK, nullable)
├── verified_at (timestamp with tz, nullable)
├── alert_sent_60_days (boolean, default false)
├── alert_sent_30_days (boolean, default false)
├── alert_sent_14_days (boolean, default false)
├── alert_sent_7_days (boolean, default false)
├── alert_sent_expiry (boolean, default false)
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_vendor_compliance_vendor (vendor_id)
  - idx_vendor_compliance_property_status (property_id, status)
  - idx_vendor_compliance_expires (expires_at) WHERE status IN ('compliant', 'expiring')
```

### 6.5 ComplianceActionItem

```
ComplianceActionItem
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── check_id → ComplianceCheck (FK, nullable) -- Null for manually created items
├── report_id → ComplianceReport (FK, nullable) -- Null if not from a report
├── title (varchar 255, NOT NULL)
├── description (text, NOT NULL)
├── priority (enum: critical, high, medium, low)
├── applicable_frameworks (varchar[], NOT NULL)
├── status (enum: open, in_progress, resolved, accepted_risk)
├── assigned_to → User (FK, nullable)
├── due_date (date, nullable)
├── resolved_at (timestamp with tz, nullable)
├── resolved_by → User (FK, nullable)
├── resolution_notes (text, nullable)
├── accepted_risk_justification (text, nullable) -- Required when status = accepted_risk
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_action_item_property_status (property_id, status)
  - idx_action_item_assigned (assigned_to) WHERE status IN ('open', 'in_progress')
  - idx_action_item_due_date (due_date) WHERE status IN ('open', 'in_progress')
```

---

## 7. User Flows

### 7.1 Generate a Compliance Report

```
Step 1: Navigate to Compliance > Reports
Step 2: Select a report type from the 8 available reports
Step 3: Configure report parameters (date range, filters)
Step 4: Click "Generate Report"
Step 5: Report generation begins (progress indicator for large reports)
Step 6: Report appears in the report history table with status "Completed"
Step 7: Click "Download" to get CSV or PDF version
```

### 7.2 Review Compliance Dashboard

```
Step 1: Navigate to Compliance > Dashboard
Step 2: View the compliance health score (large number, centered)
Step 3: Review framework status cards (grid below score)
Step 4: Click any card to see framework-specific findings
Step 5: Review action items table (sorted by priority)
Step 6: Click an action item to view details and assign/resolve
Step 7: Check the compliance calendar for upcoming dates
Step 8: Review the trend chart for score trajectory
```

### 7.3 Respond to a Compliance Drift Alert

```
Step 1: Receive alert notification (email/SMS/in-app)
Step 2: Navigate to Compliance > Monitoring
Step 3: View the failed check with details and remediation suggestion
Step 4: Investigate the issue using the provided details
Step 5: Resolve the underlying problem
Step 6: Click "Re-run Check" to verify the fix
Step 7: If check passes, the compliance score auto-updates
Step 8: If check still fails, create an action item for follow-up
```

### 7.4 Grant Auditor Access

```
Step 1: Navigate to Settings > User Management
Step 2: Click "Invite User"
Step 3: Select role: "Auditor"
Step 4: Set audit window: start date and end date
Step 5: Enter auditor's email address
Step 6: Auditor receives invite email with temporary credentials
Step 7: Auditor accesses compliance reports and monitoring data (read-only)
Step 8: At end date, auditor access is automatically revoked
```

---

## 8. UI/UX

### 8.1 Compliance Dashboard Layout (Desktop)

**Top Section** (full width):

- Large compliance health score in the center (font size: 64px)
- Score label below ("Compliance Health Score")
- Color ring around the score matching the score band color

**Framework Cards** (below score, 4-column grid):

- Each card: 200px min-width, white background, 1px border, 16px padding
- Status circle (12px) in top-left corner
- Framework name in bold (16px)
- Score percentage (24px, bold)
- Open issues count with link

**Action Items** (below cards, full width):

- Table with sortable columns
- Priority column uses colored badges: red (critical), orange (high), yellow (medium), grey (low)
- "Assign" button opens user selector dropdown
- "Resolve" button opens resolution form

**Calendar** (below action items, 60% width, left):

- Standard month-view calendar
- Colored dots for different event types (see 4.4)

**Trend Chart** (below action items, 40% width, right):

- Line chart with 12-month x-axis
- Overall score as bold line, framework scores as thinner dashed lines

### 8.2 Report Generation Page Layout (Desktop)

**Left Panel** (30% width):

- List of 8 report types as clickable cards
- Active report type is highlighted with blue left border

**Right Panel** (70% width):

- Report name and description at top
- Parameters form (date pickers, dropdowns, checkboxes)
- "Generate Report" primary button
- Below: report history table for this report type

### 8.3 Monitoring Page Layout (Desktop)

**Check Grid** (full width):

- Card for each compliance check
- Card shows: check name, schedule, last run status (green/yellow/red circle), last run timestamp, next run timestamp
- Failed checks are sorted to the top with red border
- "Re-run Now" button on each card
- Clicking a card expands to show last result details

### 8.4 Empty States

| Screen                         | Empty State Message                                 | Call to Action                                              |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------------------------- |
| Compliance Dashboard (no data) | "Compliance monitoring has not been configured yet" | "Set Up Compliance Monitoring" button                       |
| Report History (no reports)    | "No reports have been generated yet"                | "Generate Your First Report" button                         |
| Action Items (none open)       | "No open compliance action items"                   | None (positive state)                                       |
| Vendor Compliance (no vendors) | "No vendors have been added to the system"          | "Add Your First Vendor" button (links to Vendor Management) |

### 8.5 Tooltips

| Element                            | Tooltip Text                                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Compliance Health Score            | "A weighted score (0-100) based on your compliance controls across all active frameworks. Updated daily."                   |
| Framework Status Card              | "Click to view detailed compliance status and findings for this framework."                                                 |
| Accepted Risk (action item status) | "The organization acknowledges this finding but has decided not to remediate it. A justification is required and recorded." |
| OCR Extracted Expiry               | "This expiry date was automatically extracted from the uploaded insurance certificate image. Please verify it is correct."  |
| Real-time Check                    | "This check runs continuously and alerts immediately when an anomaly is detected."                                          |
| Consecutive Failures               | "Number of times this check has failed in a row without returning to a passing state."                                      |

---

## 9. AI Integration

### 9.1 Compliance Recommendations (v1)

After generating any compliance report, the AI analyzes the results and provides 3-5 actionable recommendations.

**How It Works**:

1. Report summary data is sent to Claude along with the applicable frameworks.
2. AI returns recommendations with priority and effort level.
3. Recommendations are displayed in a "Suggestions" panel below the report.

**Example Output**:

- "3 staff members have not enabled MFA. Enable MFA enforcement for all admin roles to meet SOC 2 CC6.1 requirements." (Priority: High, Effort: Low)
- "The Security Guard role accessed email fields 0 times in 90 days. Consider removing email access to follow the principle of least privilege." (Priority: Medium, Effort: Low)

### 9.2 Anomaly Explanation (v1)

When the login activity report flags an anomaly, the AI provides a plain-language explanation of why it was flagged and what action to consider.

**Example**: "This login was flagged as 'impossible travel' because the user logged in from Toronto at 2:15 PM and then from Vancouver at 2:45 PM -- a distance of 3,360 km in 30 minutes. This could indicate a compromised account or VPN usage. Consider verifying with the user."

### 9.3 Vendor Document OCR (v1)

When a vendor uploads an insurance certificate as an image (JPEG, PNG) instead of a PDF, the AI extracts:

- Insurance company name
- Policy number
- Coverage amount
- Effective date
- Expiry date

Extracted values are pre-filled in the vendor compliance form for admin verification.

### 9.4 Compliance Gap Analysis (v2)

AI compares the current compliance posture against each framework's requirements and identifies gaps with recommended remediation steps.

---

## 10. Analytics

### 10.1 Dashboard Analytics

| Metric                          | Description                            | Tracked By                    |
| ------------------------------- | -------------------------------------- | ----------------------------- |
| `compliance_score_daily`        | Daily compliance health score snapshot | Property                      |
| `compliance_score_by_framework` | Per-framework score snapshot           | Property, framework           |
| `action_items_created`          | New compliance action items            | Property, priority, framework |
| `action_items_resolved`         | Resolved action items                  | Property, resolution time     |
| `action_items_overdue`          | Action items past due date             | Property                      |

### 10.2 Report Analytics

| Metric                   | Description                  | Tracked By                          |
| ------------------------ | ---------------------------- | ----------------------------------- |
| `report_generated`       | Number of reports generated  | Property, report type, user role    |
| `report_downloaded`      | Number of reports downloaded | Property, report type, format       |
| `report_generation_time` | Time to generate each report | Property, report type, record count |

### 10.3 Monitoring Analytics

| Metric                   | Description                                 | Tracked By           |
| ------------------------ | ------------------------------------------- | -------------------- |
| `check_executed`         | Number of compliance checks run             | Property, check type |
| `check_passed`           | Number of checks that passed                | Property, check type |
| `check_failed`           | Number of checks that failed                | Property, check type |
| `drift_alerts_sent`      | Number of compliance drift alerts           | Property, severity   |
| `mean_time_to_remediate` | Average time from drift alert to resolution | Property, check type |

---

## 11. Notifications

### 11.1 Compliance Monitoring Alerts

| Trigger                    | Recipient      | Channels             | Template                                                       |
| -------------------------- | -------------- | -------------------- | -------------------------------------------------------------- |
| Check fails (critical)     | Super Admin    | Email + SMS + in-app | "CRITICAL: {check_name} failed for {property_name}. {message}" |
| Check fails (standard)     | Property Admin | Email + in-app       | "Compliance check failed: {check_name}. {message}"             |
| Check warning              | Property Admin | In-app               | "Compliance warning: {check_name}. {message}"                  |
| Failure persists 48+ hours | Super Admin    | Email + SMS          | "ESCALATION: {check_name} has been failing for {hours} hours." |
| Check recovers             | Property Admin | In-app               | "Resolved: {check_name} is now passing."                       |

### 11.2 Vendor Compliance Alerts

| Trigger                       | Recipient                              | Channels             | Template                                                                                    |
| ----------------------------- | -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| Insurance expiring in 60 days | Property Admin                         | Email                | "{vendor_name}'s {insurance_type} expires on {date}. Please request updated documentation." |
| Insurance expiring in 30 days | Property Admin + Manager               | Email + in-app       | "REMINDER: {vendor_name}'s {insurance_type} expires in 30 days ({date})."                   |
| Insurance expiring in 14 days | Property Admin + Manager               | Email + in-app       | "URGENT: {vendor_name}'s {insurance_type} expires in 14 days ({date})."                     |
| Insurance expiring in 7 days  | Property Admin + Manager + Super Admin | Email + SMS + in-app | "ACTION REQUIRED: {vendor_name}'s {insurance_type} expires in 7 days ({date})."             |
| Insurance expired             | Property Admin + Super Admin           | Email + SMS          | "EXPIRED: {vendor_name}'s {insurance_type} expired on {date}. Vendor is now non-compliant." |

### 11.3 Action Item Alerts

| Trigger                             | Recipient                   | Channels       | Template                                                       |
| ----------------------------------- | --------------------------- | -------------- | -------------------------------------------------------------- |
| Action item created (critical/high) | Assigned user               | Email + in-app | "New compliance action item: {title} (Priority: {priority})."  |
| Action item due in 3 days           | Assigned user               | Email + in-app | "Compliance action item due soon: {title} is due on {date}."   |
| Action item overdue                 | Assigned user + Super Admin | Email          | "OVERDUE: Compliance action item '{title}' was due on {date}." |

### 11.4 Auditor Access Alerts

| Trigger                           | Recipient   | Channels       | Template                                                             |
| --------------------------------- | ----------- | -------------- | -------------------------------------------------------------------- |
| Auditor invited                   | Super Admin | Email          | "Auditor access granted to {email} from {start_date} to {end_date}." |
| Auditor access expiring in 3 days | Super Admin | Email + in-app | "Auditor access for {email} expires on {date}. Extend if needed."    |
| Auditor access revoked            | Super Admin | Email          | "Auditor access for {email} has been revoked."                       |

---

## 12. API Endpoints

### 12.1 Report Endpoints

**GET** `/api/v1/compliance/reports`

- **Description**: List available report types and recent report history
- **Auth**: Property Admin, Super Admin, Board Member (limited), Auditor
- **Query Params**: `page`, `per_page`, `report_type`, `date_from`, `date_to`
- **Response**: `200 OK` with array of ComplianceReport objects

**POST** `/api/v1/compliance/reports/:type/generate`

- **Description**: Generate a compliance report
- **Auth**: Property Admin, Super Admin, Auditor
- **Request Body**: Report-specific parameters (see Section 3.1 for each report type)
- **Response**: `202 Accepted` with ComplianceReport object (status: "generating")
- **Errors**: `400` invalid parameters, `403` unauthorized, `429` rate limit (max 5 reports per hour)

**GET** `/api/v1/compliance/reports/:reportId`

- **Description**: Get report status and metadata
- **Auth**: Property Admin, Super Admin, Board Member (if permitted report type), Auditor
- **Response**: `200 OK` with ComplianceReport object including summary_data

**GET** `/api/v1/compliance/reports/:reportId/download`

- **Description**: Download a generated report
- **Auth**: Must have access to the report type
- **Query Params**: `format` (csv, pdf, xlsx)
- **Response**: `200 OK` with file stream
- **Errors**: `404` not found, `410 Gone` if expired

### 12.2 Dashboard Endpoints

**GET** `/api/v1/compliance/dashboard`

- **Description**: Get compliance dashboard summary (health score, framework cards, action items count)
- **Auth**: Property Admin, Super Admin, Auditor
- **Response**: `200 OK` with dashboard data including health_score, framework_statuses, action_item_counts

**GET** `/api/v1/compliance/dashboard/trend`

- **Description**: Get compliance score trend data (last 12 months)
- **Auth**: Property Admin, Super Admin, Auditor
- **Response**: `200 OK` with array of monthly score data points

**GET** `/api/v1/compliance/dashboard/calendar`

- **Description**: Get compliance calendar events for a given month
- **Auth**: Property Admin, Super Admin
- **Query Params**: `year`, `month`
- **Response**: `200 OK` with array of calendar events

### 12.3 Monitoring Endpoints

**GET** `/api/v1/compliance/checks`

- **Description**: List all compliance checks with their current status
- **Auth**: Property Admin, Super Admin, Auditor
- **Response**: `200 OK` with array of ComplianceCheck objects

**GET** `/api/v1/compliance/checks/:checkId`

- **Description**: Get check details including latest result
- **Auth**: Property Admin, Super Admin, Auditor
- **Response**: `200 OK` with ComplianceCheck object with full result JSONB

**POST** `/api/v1/compliance/checks/:checkId/run`

- **Description**: Manually trigger a compliance check
- **Auth**: Super Admin
- **Response**: `202 Accepted` with updated ComplianceCheck (status will update asynchronously)
- **Errors**: `429` rate limit (max 1 manual run per check per hour)

**PUT** `/api/v1/compliance/checks/:checkId`

- **Description**: Update check configuration (enable/disable, change schedule)
- **Auth**: Super Admin
- **Request Body**: `{ is_enabled, cron_expression }`
- **Response**: `200 OK` with updated ComplianceCheck

### 12.4 Action Item Endpoints

**GET** `/api/v1/compliance/action-items`

- **Description**: List compliance action items
- **Auth**: Property Admin, Super Admin
- **Query Params**: `page`, `per_page`, `status`, `priority`, `assigned_to`, `framework`
- **Response**: `200 OK` with paginated array of ComplianceActionItem objects

**POST** `/api/v1/compliance/action-items`

- **Description**: Create a manual compliance action item
- **Auth**: Property Admin, Super Admin
- **Request Body**: `{ title, description, priority, applicable_frameworks, assigned_to, due_date }`
- **Response**: `201 Created` with ComplianceActionItem object

**PUT** `/api/v1/compliance/action-items/:itemId`

- **Description**: Update an action item (assign, change status, resolve)
- **Auth**: Property Admin, Super Admin, assigned user
- **Request Body**: Partial ComplianceActionItem fields
- **Response**: `200 OK` with updated ComplianceActionItem

### 12.5 Consent Endpoints

**GET** `/api/v1/compliance/consent/:userId`

- **Description**: Get all consent records for a user
- **Auth**: Property Admin, Super Admin, Auditor, or the user themselves
- **Response**: `200 OK` with array of ConsentRecord objects

**GET** `/api/v1/compliance/consent/summary`

- **Description**: Get consent coverage summary for the property
- **Auth**: Property Admin, Super Admin, Auditor
- **Response**: `200 OK` with summary (total residents, residents with all consents, missing consent breakdown)

### 12.6 Vendor Compliance Endpoints

**GET** `/api/v1/compliance/vendors`

- **Description**: List all vendors with compliance status
- **Auth**: Property Admin, Property Manager, Super Admin, Board Member, Auditor
- **Query Params**: `status`, `insurance_type`
- **Response**: `200 OK` with array of vendor compliance summaries

**GET** `/api/v1/compliance/vendors/:vendorId`

- **Description**: Get vendor compliance details with all insurance records
- **Auth**: Property Admin, Super Admin, Auditor
- **Response**: `200 OK` with vendor details and VendorCompliance array

**POST** `/api/v1/compliance/vendors/:vendorId/documents`

- **Description**: Upload a vendor insurance document
- **Auth**: Property Admin, Super Admin
- **Request**: Multipart form data with `file` and `insurance_type`
- **Response**: `201 Created` with VendorCompliance object (OCR extraction runs async)

**PUT** `/api/v1/compliance/vendors/:vendorId/documents/:documentId`

- **Description**: Update vendor compliance record (verify OCR results, update dates)
- **Auth**: Property Admin, Super Admin
- **Request Body**: Partial VendorCompliance fields
- **Response**: `200 OK` with updated VendorCompliance

---

## 13. Permissions

### 13.1 Permission Matrix

| Feature                   |        Super Admin        |      Property Admin       | Property Manager | Board Member |  Auditor  | Resident |
| ------------------------- | :-----------------------: | :-----------------------: | :--------------: | :----------: | :-------: | :------: |
| Compliance Dashboard      |           Full            |      Property-scoped      |    View only     |  View only   | View only |   None   |
| Access Audit Report       |      Generate + View      |      Generate + View      |       View       |     None     |   View    |   None   |
| Login Activity Report     |      Generate + View      |      Generate + View      |       View       |     None     |   View    |   None   |
| Data Retention Report     |      Generate + View      |      Generate + View      |       None       |     None     |   View    |   None   |
| Privacy Impact Assessment |      Generate + View      |      Generate + View      |       None       |     None     |   View    |   None   |
| Incident Response Report  |      Generate + View      |      Generate + View      |       View       |     View     |   View    |   None   |
| Consent Records Report    |      Generate + View      |      Generate + View      |       None       |     None     |   View    |   None   |
| DSAR Report               |      Generate + View      |      Generate + View      |       None       |     None     |   View    |   None   |
| Vendor Compliance Report  |      Generate + View      |      Generate + View      |       View       |     View     |   View    |   None   |
| Compliance Monitoring     |     Configure + View      |           View            |       None       |     None     |   View    |   None   |
| Action Items              | Create + Assign + Resolve | Create + Assign + Resolve |       View       |     None     |   View    |   None   |
| Auditor Access Management |      Grant + Revoke       |           None            |       None       |     None     |    N/A    |   None   |

### 13.2 Auditor Role Specifics

The Auditor role is unique in the system:

| Property             | Value                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Access type**      | Read-only across all compliance data                                                 |
| **Time-bounded**     | Must have a start_date and end_date                                                  |
| **Auto-revocation**  | Access is automatically revoked at end_date + 1 day                                  |
| **Maximum duration** | 90 days per audit window                                                             |
| **Extension**        | Super Admin can extend once for up to 30 additional days                             |
| **Audit scope**      | Property-scoped (auditor sees only one property's data)                              |
| **Data export**      | Can download compliance reports but cannot initiate property-level data exports      |
| **Cannot access**    | Settings, User Management, operational modules (Security Console, Maintenance, etc.) |

---

## 14. Edge Cases

### 14.1 Report Generation Edge Cases

| Scenario                                                                         | Handling                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property with 10+ years of data and user requests full-range Access Audit Report | Paginated generation: report is generated in chunks of 100,000 records. Streaming export for CSV. PDF is limited to the first 50,000 records with a note: "PDF truncated. Download CSV for complete data." |
| Report generation takes more than 30 minutes                                     | Mark as async. Send email notification when complete. Set a 2-hour timeout; if exceeded, mark as "failed" with error.                                                                                      |
| Two users generate the same report type with the same parameters simultaneously  | Deduplication: if an identical report (same type, same parameters, generated within the last hour) exists, return the existing report instead of generating a duplicate.                                   |
| Board Member requests a report type they cannot access                           | Return `403 Forbidden` with message: "Your role does not have access to this report type."                                                                                                                 |

### 14.2 Compliance Monitoring Edge Cases

| Scenario                                                   | Handling                                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compliance check fails and auto-remediation is tempting    | Never auto-remediate. Always generate an alert and remediation suggestion. Human decision required.                                                  |
| Multiple checks fail simultaneously (infrastructure issue) | Group related failures into a single alert: "3 compliance checks failed. This may indicate an infrastructure issue."                                 |
| Check fails during a scheduled maintenance window          | Super Admin can configure maintenance windows. Checks that fail during a window are marked as "warning" instead of "fail" and do not trigger alerts. |
| PII access pattern check has no baseline (new property)    | Require 30 days of data before activating anomaly detection. During the baseline period, collect statistics without alerting.                        |

### 14.3 Vendor Compliance Edge Cases

| Scenario                                                                | Handling                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vendor uploads insurance certificate as image (JPEG/PNG) instead of PDF | Run OCR to extract expiry date, policy number, and coverage amount. Pre-fill form fields. Admin must verify: "These values were extracted automatically. Please confirm they are correct." |
| OCR extraction fails or returns low-confidence results                  | Display warning: "We could not automatically extract information from this document. Please enter the details manually." All form fields remain empty.                                     |
| Vendor has insurance from a non-standard provider (international)       | System accepts any insurer name. Currency is stored alongside coverage amount.                                                                                                             |
| Vendor's WSIB clearance has "pending" status                            | Add a "Pending" sub-status under Non-Compliant. Vendor cannot be marked Compliant until clearance is confirmed.                                                                            |

### 14.4 Cross-Framework Edge Cases

| Scenario                                                  | Handling                                                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GDPR request from an EU resident at a Canadian property   | Apply the stricter of PIPEDA and GDPR requirements for each aspect. DSAR SLA uses GDPR's 1-month deadline. Data retention uses PIPEDA's requirements where stricter. |
| Property operates in multiple jurisdictions               | Framework applicability is configured per property in Settings. Reports indicate which frameworks are active for the property.                                       |
| New regulation enacted that the system does not yet cover | The compliance dashboard shows a "Custom Framework" option where admins can manually track requirements and action items for frameworks not built into the system.   |
| Auditor access expires during active report generation    | Report generation completes even after access expiry. The report file is accessible to Property Admin and Super Admin but not the expired auditor.                   |

---

## 15. Completeness Checklist

### Functional Coverage

| Item                                              | Status  | Section       |
| ------------------------------------------------- | ------- | ------------- |
| 8 built-in compliance reports with detailed specs | Defined | 3.1.1 - 3.1.8 |
| Compliance dashboard with health score            | Defined | 4.1           |
| Framework status cards                            | Defined | 4.2           |
| Action item management                            | Defined | 4.3           |
| Compliance calendar                               | Defined | 4.4           |
| Trend chart (12-month)                            | Defined | 4.5           |
| 12 automated compliance checks                    | Defined | 5.1           |
| Compliance drift alerts                           | Defined | 5.3           |
| Vendor compliance tracking with 5 statuses        | Defined | 3.1.8         |
| Vendor insurance expiry alerts                    | Defined | 3.1.8         |
| Auditor role with time-bounded access             | Defined | 13.2          |
| SOC 2 Evidence Pack Generator (v2)                | Defined | 3.2.1         |
| ISO 27001 SoA Mapper (v2)                         | Defined | 3.2.2         |
| Regulatory Change Tracker (v2)                    | Defined | 3.2.3         |

### Data Model Coverage

| Item                                              | Status  | Section |
| ------------------------------------------------- | ------- | ------- |
| ComplianceReport with multi-format file URLs      | Defined | 6.1     |
| ComplianceCheck with JSONB result and scheduling  | Defined | 6.2     |
| ConsentRecord (append-only) with version tracking | Defined | 6.3     |
| VendorCompliance with OCR and alert tracking      | Defined | 6.4     |
| ComplianceActionItem with priority and assignment | Defined | 6.5     |

### UI/UX Coverage

| Item                          | Status  | Section |
| ----------------------------- | ------- | ------- |
| Compliance dashboard layout   | Defined | 8.1     |
| Report generation page        | Defined | 8.2     |
| Monitoring page               | Defined | 8.3     |
| Empty states for all screens  | Defined | 8.4     |
| Tooltips for complex features | Defined | 8.5     |

### AI Coverage

| Item                         | Status  | Section |
| ---------------------------- | ------- | ------- |
| Compliance recommendations   | Defined | 9.1     |
| Anomaly explanation          | Defined | 9.2     |
| Vendor document OCR          | Defined | 9.3     |
| Compliance gap analysis (v2) | Defined | 9.4     |

### API Coverage

| Item                                | Status  | Section |
| ----------------------------------- | ------- | ------- |
| Report CRUD + download              | Defined | 12.1    |
| Dashboard + trend + calendar        | Defined | 12.2    |
| Monitoring checks + manual trigger  | Defined | 12.3    |
| Action items CRUD                   | Defined | 12.4    |
| Consent records                     | Defined | 12.5    |
| Vendor compliance + document upload | Defined | 12.6    |

### Permission Coverage

| Item                                           | Status  | Section |
| ---------------------------------------------- | ------- | ------- |
| Full permission matrix (6 roles x 11 features) | Defined | 13.1    |
| Auditor role specifications                    | Defined | 13.2    |

---

_Last updated: 2026-03-16_
_Author: Concierge Product Team_
