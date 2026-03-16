# Concierge — Data Quality Framework

> **Version**: 1.0 | **Date**: 2026-03-16 | **Status**: APPROVED
>
> This document defines how the Concierge platform ensures data integrity, completeness, and
> consistency across all properties. The system proactively identifies data issues and provides
> tools for admins to fix them before they become operational problems.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Validation Rules](#2-validation-rules)
3. [Missing Data Dashboard](#3-missing-data-dashboard)
4. [Duplicate Detection](#4-duplicate-detection)
5. [Data Integrity Checks](#5-data-integrity-checks)
6. [Data Quality Score](#6-data-quality-score)
7. [Alerts & Notifications](#7-alerts--notifications)
8. [Automated Remediation](#8-automated-remediation)
9. [Data Model](#9-data-model)
10. [Implementation Schedule](#10-implementation-schedule)
11. [Developer Checklist](#11-developer-checklist)

---

## 1. Purpose

Data quality matters in building management because:

- **A missing email address** means a resident never gets notified about a package.
- **A duplicate resident record** means two notifications for the same person and confusion at the front desk.
- **An orphaned event** referencing a deleted unit corrupts reports and dashboards.
- **An invalid phone number** means the emergency broadcast system fails when it matters most.

This framework prevents these problems through three strategies:

1. **Prevention**: Strict validation at the point of entry (forms, imports, API).
2. **Detection**: Automated scans that find existing data issues.
3. **Remediation**: Tools for admins to fix issues, plus auto-fix for safe corrections.

---

## 2. Validation Rules

Every field in the system has a validation rule. These rules are enforced at two levels:

- **Client-side**: Zod schemas in React forms provide instant feedback.
- **Server-side**: The same Zod schemas validate API requests. Server validation is the source of truth.
  Client validation is a convenience, not a security measure.

### Email Addresses

| Check                | Rule                                       | Implementation                                                                                       |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Format**           | RFC 5322 compliant                         | Zod `.email()` with custom regex for edge cases                                                      |
| **MX record**        | Domain has valid mail exchange records     | Async check via `dns.resolveMx()` on server. Non-blocking: saves the record but flags if MX fails.   |
| **Disposable email** | Reject known disposable email domains      | Check against a maintained blocklist (e.g., `mailinator.com`, `guerrillamail.com`). Updated monthly. |
| **Normalization**    | Lowercase before storage                   | `email.toLowerCase().trim()` applied before insert/update                                            |
| **Uniqueness**       | One email per active resident per property | Database unique constraint on `(email, property_id)` where `status = 'active'`                       |

### Phone Numbers

| Check            | Rule                         | Implementation                                                               |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| **Format**       | E.164 international format   | Store as `+1XXXXXXXXXX`. Use `libphonenumber-js` for parsing and validation. |
| **Country code** | Must include country code    | If missing, default to `+1` (North America). Show country selector in form.  |
| **Length**       | Valid length for the country | `libphonenumber-js` validates length per country.                            |
| **Display**      | Locale-formatted for display | `+14165551234` displays as `(416) 555-1234` in Canadian locale.              |

### Postal Codes

| Country           | Format                                                      | Regex                           |
| ----------------- | ----------------------------------------------------------- | ------------------------------- |
| **Canada**        | `A1A 1A1` (letter-number-letter space number-letter-number) | `/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i` |
| **United States** | `12345` or `12345-6789`                                     | `/^\d{5}(-\d{4})?$/`            |

Normalization: Canadian postal codes always stored uppercase with a space (e.g., `m5v 2t6` → `M5V 2T6`).

### Dates

| Rule                 | Implementation                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Format**           | ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) in the database. Always UTC.                                             |
| **Past events**      | Cannot have a future date. Validated: `date <= now()`.                                                     |
| **Future bookings**  | Cannot have a past date. Validated: `date >= now()`.                                                       |
| **Reasonable range** | Move-in dates cannot be before the building was built. Move-out cannot be more than 2 years in the future. |

### Currency

| Rule               | Implementation                                                                  |
| ------------------ | ------------------------------------------------------------------------------- |
| **Storage**        | Integer cents (e.g., `2500` = $25.00). Never store floating-point values.       |
| **Decimal places** | Exactly 2 for display. Input field enforces this.                               |
| **Non-negative**   | `amount >= 0`. No negative amounts except for credits/refunds (explicit field). |
| **Range**          | Amenity booking fees: $0 - $10,000. Warn if > $1,000 (likely a typo).           |

### Names

| Rule                | Implementation                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| **Length**          | 1-100 characters                                                               |
| **No numeric-only** | Reject names like "12345". Must contain at least one letter.                   |
| **Unicode-aware**   | Accept accented characters, Chinese/Japanese/Korean characters, Arabic script. |
| **Trim**            | Leading and trailing whitespace removed. Multiple spaces collapsed to one.     |

### Unit Numbers

| Rule           | Implementation                                                                     |
| -------------- | ---------------------------------------------------------------------------------- |
| **Uniqueness** | Unique within a property. Database constraint: `UNIQUE(unit_number, property_id)`. |
| **Characters** | Alphanumeric, hyphens, periods allowed (e.g., `101`, `PH-2`, `B1.05`).             |
| **Length**     | 1-10 characters.                                                                   |
| **Case**       | Stored uppercase. `ph-2` → `PH-2`.                                                 |

---

## 3. Missing Data Dashboard

Located at **Admin → Data Quality** (Property Admin and above).

### Summary Cards

The top of the page shows 4-6 summary cards, each displaying a count of records missing critical data:

| Card                                 | Example Text                               | Priority |
| ------------------------------------ | ------------------------------------------ | -------- |
| **Residents Missing Email**          | "19 residents have no email address"       | Critical |
| **Residents Missing Phone**          | "8 residents have no phone number"         | High     |
| **Units Without Emergency Contacts** | "7 units have no emergency contact"        | Critical |
| **Staff Without 2FA**                | "3 staff members have not enabled 2FA"     | High     |
| **Units Without Instructions**       | "12 units have no front desk instructions" | Low      |
| **Residents Missing Move-In Date**   | "5 residents have no move-in date"         | Low      |

Each card is clickable. Clicking opens a filtered list of the affected records.

### Per-Module Breakdown

Below the summary cards, a table breaks down completeness by module:

| Module    | Required Fields                  | Completed | Missing | Completeness |
| --------- | -------------------------------- | --------- | ------- | ------------ |
| Residents | email, phone, unit, move-in date | 481       | 19      | 96.2%        |
| Units     | number, floor, emergency contact | 493       | 7       | 98.6%        |
| Staff     | email, role, 2FA                 | 12        | 3       | 80.0%        |
| Amenities | name, capacity, rules            | 8         | 0       | 100%         |

### Action Buttons

Each row in the affected records list has action buttons:

| Action            | Behavior                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **Send Reminder** | Sends an email to the resident asking them to update their profile. Uses a configurable email template.      |
| **Edit Record**   | Opens the record's edit form with the missing field highlighted.                                             |
| **Bulk Remind**   | Sends reminder emails to all residents missing a specific field. Rate-limited: once per 7 days per resident. |

### Trend Chart

A line chart shows data completeness percentage over the past 12 months. This helps admins
see whether data quality is improving or declining over time.

### Weekly Email Digest

Every Monday at 9:00 AM (property timezone), the Property Admin receives an email summarizing:

- Current data quality score
- New issues found since last week
- Issues resolved since last week
- Top 3 actions to improve the score

---

## 4. Duplicate Detection

### Resident Duplicates

The system detects potential duplicate residents using these signals:

| Signal              | Method                                         | Threshold                                          |
| ------------------- | ---------------------------------------------- | -------------------------------------------------- |
| **Name similarity** | Levenshtein distance on `firstName + lastName` | Distance <= 2 (e.g., "John Smith" and "Jon Smith") |
| **Email match**     | Exact match after normalization                | Same email across two active records               |
| **Phone match**     | Exact match in E.164 format                    | Same phone across two active records               |
| **Combined score**  | Weighted combination of all signals            | Score >= 0.7 on a 0-1 scale                        |

### Detection Schedule

- **On insert**: When a new resident is created, check for duplicates before saving. If a match
  is found with score >= 0.7, show a warning: "This person may already exist: {name}, Unit {number}.
  Create anyway?"
- **Weekly scan**: A scheduled job scans all active residents within each property for duplicates.
  Results appear in the Data Quality dashboard under the "Duplicates" tab.

### Merge Workflow

When an admin confirms two records are duplicates:

1. Admin selects the **primary record** (the one to keep).
2. The system shows a side-by-side comparison of all fields.
3. For each field where the secondary record has data and the primary does not, the admin can
   choose to copy the value to the primary.
4. All events, packages, maintenance requests, and bookings referencing the secondary record
   are reassigned to the primary record.
5. The secondary record is soft-deleted (marked as `merged_into: primaryId`).
6. The merge is logged in the audit trail with both record IDs and the admin who performed it.
7. The merge cannot be undone automatically. If a mistake is made, a Super Admin can restore
   the soft-deleted record.

### Event Duplicates

Events with the same type, same unit, and created within 5 minutes of each other are flagged
as potential duplicates. The admin sees a "Possible Duplicate" badge on the event card and can
dismiss or merge.

---

## 5. Data Integrity Checks

Automated jobs that run daily at 2:00 AM UTC and report issues to the Data Quality dashboard.

### Orphaned Records

| Check                              | Query Logic                                                                                                               | Severity |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| Events referencing deleted units   | `SELECT * FROM events WHERE unit_id NOT IN (SELECT id FROM units)`                                                        | High     |
| Bookings for deactivated amenities | `SELECT * FROM reservations WHERE amenity_id IN (SELECT id FROM amenities WHERE active = false) AND status = 'confirmed'` | Medium   |
| Assignments to deactivated staff   | `SELECT * FROM maintenance_requests WHERE assigned_to IN (SELECT id FROM users WHERE status = 'inactive')`                | Medium   |

### Referential Integrity

| Check                                    | What It Validates                              | Severity |
| ---------------------------------------- | ---------------------------------------------- | -------- |
| Every event has a valid property_id      | `events.property_id` exists in `properties.id` | Critical |
| Every event has a valid created_by       | `events.created_by` exists in `users.id`       | Critical |
| Every unit belongs to a valid property   | `units.property_id` exists in `properties.id`  | Critical |
| Every resident is linked to a valid unit | `residents.unit_id` exists in `units.id`       | High     |

### Stale Data

| Check                                              | Condition                                               | Action                |
| -------------------------------------------------- | ------------------------------------------------------- | --------------------- |
| Residents with move-out > 90 days ago still active | `move_out_date < now() - 90 days AND status = 'active'` | Flag for admin review |
| Maintenance requests open > 180 days               | `status = 'open' AND created_at < now() - 180 days`     | Flag as stale         |
| Unread notifications older than 30 days            | `read = false AND created_at < now() - 30 days`         | Auto-mark as expired  |

### Storage Integrity

| Check                       | What It Validates                                 | Severity          |
| --------------------------- | ------------------------------------------------- | ----------------- |
| DB references missing files | Attachment records in DB whose S3 key returns 404 | High              |
| S3 orphan files             | Files in S3 not referenced by any DB record       | Low (cleanup job) |
| File size mismatches        | DB records file size vs actual S3 object size     | Medium            |

### Timezone Consistency

All timestamps in the database must be in UTC. The daily check scans for:

- Timestamps with timezone offsets other than `+00:00`
- Timestamps that appear to be in local time (e.g., created_at in the future for the property's timezone)

---

## 6. Data Quality Score

Every property has a Data Quality Score from 0 to 100, calculated from four components:

| Component                 | Weight | What It Measures                                                           |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| **Field Completeness**    | 40%    | % of required fields that have values across all records                   |
| **Uniqueness**            | 20%    | % of records with no detected duplicates                                   |
| **Format Validity**       | 20%    | % of fields that pass format validation (email format, phone format, etc.) |
| **Referential Integrity** | 20%    | % of foreign key references that point to valid records                    |

### Score Calculation

```
Score = (completeness * 0.4) + (uniqueness * 0.2) + (validity * 0.2) + (integrity * 0.2)
```

Each component is a percentage (0-100). The final score is also 0-100.

### Score Display

The score is displayed as:

- **90-100**: Green badge, "Excellent"
- **80-89**: Blue badge, "Good"
- **60-79**: Yellow badge, "Needs Attention"
- **Below 60**: Red badge, "Critical"

The score is visible on the Admin Dashboard as a widget and on the Data Quality page as a
prominent header element.

### Score History

The score is recalculated daily. A line chart on the Data Quality page shows the score
over the past 12 months with a goal line at 90.

---

## 7. Alerts & Notifications

### Threshold-Based Alerts

| Condition                    | Recipients                   | Channel                           | Frequency                    |
| ---------------------------- | ---------------------------- | --------------------------------- | ---------------------------- |
| Score drops below 80         | Property Admin               | Email + in-app notification       | Once (on threshold crossing) |
| Score drops below 60         | Property Admin + Super Admin | Email + in-app notification + SMS | Once (on threshold crossing) |
| Score recovers above 80      | Property Admin               | Email                             | Once (on recovery)           |
| New critical integrity issue | Property Admin               | In-app notification               | Immediately                  |

### Import Alerts

When data is imported via CSV (e.g., bulk resident import):

| Condition        | Action                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Error rate <= 5% | Import proceeds. Errors are logged and shown in a post-import report.                |
| Error rate 5-10% | Import proceeds with a warning. Admin sees: "X rows had issues. Review recommended." |
| Error rate > 10% | Import is held for review. Admin must explicitly approve or reject.                  |

Error types in imports: missing required fields, invalid email format, duplicate records,
invalid unit numbers, malformed phone numbers.

---

## 8. Automated Remediation

Some data issues are safe to fix automatically. Others are too risky and require human judgment.

### Auto-Fix (Safe)

| Issue                                | Fix                                               | Risk                                               |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------- |
| Phone number missing country code    | Prepend `+1` (North America default)              | Low: almost all properties are Canadian/US         |
| Email with uppercase letters         | Convert to lowercase                              | None: email addresses are case-insensitive per RFC |
| Canadian postal code missing space   | Insert space at position 3 (`M5V2T6` → `M5V 2T6`) | None: deterministic formatting                     |
| Canadian postal code lowercase       | Convert to uppercase (`m5v 2t6` → `M5V 2T6`)      | None: deterministic formatting                     |
| Leading/trailing whitespace in names | Trim whitespace                                   | None: whitespace is never intentional              |
| Multiple spaces in names             | Collapse to single space                          | Low: multiple spaces are always a typo             |
| Date without timezone                | Assume UTC and add `+00:00`                       | Low: UTC is the storage standard                   |

All auto-fixes are logged in the audit trail with `action: 'auto_remediation'` and the
before/after values.

### Manual Fix Required (Risky)

| Issue                                   | Why Not Auto-Fix                                                   |
| --------------------------------------- | ------------------------------------------------------------------ |
| Name correction (e.g., "Jonh" → "John") | Could be a real name. Too risky to assume.                         |
| Address correction                      | Could change the meaning. Addresses have many valid formats.       |
| Duplicate merge                         | Requires human judgment to pick the primary record.                |
| Unit number correction                  | Could assign a resident to the wrong unit.                         |
| Stale resident deactivation             | Resident may have renewed their lease without updating the system. |

These issues appear in the Data Quality dashboard for manual resolution.

---

## 9. Data Model

### DataQualityScore Table

```sql
CREATE TABLE data_quality_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id),
  score           INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  completeness    INTEGER NOT NULL CHECK (completeness >= 0 AND completeness <= 100),
  uniqueness      INTEGER NOT NULL CHECK (uniqueness >= 0 AND uniqueness <= 100),
  validity        INTEGER NOT NULL CHECK (validity >= 0 AND validity <= 100),
  integrity       INTEGER NOT NULL CHECK (integrity >= 0 AND integrity <= 100),
  breakdown       JSONB NOT NULL DEFAULT '{}',
                  -- Detailed per-module scores: { "residents": { "completeness": 96, ... }, ... }
  calculated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dqs_property ON data_quality_scores(property_id, calculated_at DESC);
```

### DataQualityIssue Table

```sql
CREATE TABLE data_quality_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id),
  issue_type      VARCHAR(50) NOT NULL,
                  -- 'missing_email' | 'missing_phone' | 'duplicate_resident' |
                  -- 'orphaned_event' | 'stale_resident' | 'invalid_format' |
                  -- 'referential_integrity' | 'storage_mismatch'
  severity        VARCHAR(10) NOT NULL,
                  -- 'critical' | 'high' | 'medium' | 'low'
  description     TEXT NOT NULL,
  affected_table  VARCHAR(50) NOT NULL,
  affected_ids    UUID[] NOT NULL,
  auto_fixable    BOOLEAN NOT NULL DEFAULT false,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES users(id),
  resolution      VARCHAR(20),
                  -- 'auto_fixed' | 'manual_fixed' | 'dismissed' | 'merged'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dqi_property ON data_quality_issues(property_id, resolved_at);
CREATE INDEX idx_dqi_type ON data_quality_issues(issue_type, severity);
```

---

## 10. Implementation Schedule

| Phase             | Features                                                                        | Timeline |
| ----------------- | ------------------------------------------------------------------------------- | -------- |
| **v1 Launch**     | Field validation (all types), email/phone format checks, uniqueness constraints | Day 1    |
| **v1 + 2 weeks**  | Missing Data Dashboard, weekly email digest                                     | Sprint 2 |
| **v1 + 4 weeks**  | Data Quality Score, threshold alerts                                            | Sprint 3 |
| **v1 + 6 weeks**  | Duplicate detection (on insert), automated remediation                          | Sprint 4 |
| **v1 + 8 weeks**  | Duplicate detection (weekly scan), merge workflow                               | Sprint 5 |
| **v1 + 12 weeks** | Data integrity checks (daily jobs), storage integrity                           | Sprint 7 |

---

## 11. Developer Checklist

Before submitting a PR that adds a new data field or import:

- [ ] Zod validation schema defined for the field (shared between client and server)
- [ ] Validation error messages are in the i18n message files (see `INTERNATIONALIZATION.md`)
- [ ] Field added to the Data Quality completeness calculation if it is a required field
- [ ] Format normalization applied before storage (trim, lowercase email, format phone)
- [ ] Uniqueness constraint added to the database if the field must be unique
- [ ] Import validation handles the field (CSV import, bulk operations)
- [ ] Missing data query updated to include the new field (if critical)
- [ ] Unit test covers valid input, invalid input, boundary cases, and normalization

---

_Last updated: 2026-03-16_
