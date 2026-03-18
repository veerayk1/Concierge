# 27 — Data Migration

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 07-Unit Management, 08-User Management, 16-Settings Admin

---

## 1. Overview

### What It Is

The Data Migration module handles bulk import of existing property data into Concierge and the export of data out of Concierge. It has two halves:

1. **Import System** -- a wizard-driven interface that lets property administrators upload CSV or Excel files containing existing property data (units, residents, packages, maintenance history, FOB/key records, emergency contacts, amenity bookings, parking permits, and staff). The system maps source columns to Concierge fields, validates every row, and imports data transactionally.

2. **Export System** -- a compliance-driven interface that lets users export their own personal data (PIPEDA and GDPR right to data portability) and lets administrators export full property data, audit logs, and encrypted backups.

Together, these features eliminate the biggest barrier to platform adoption: the pain of re-entering years of historical data by hand.

### Why It Exists

Properties switching to Concierge from an existing management platform face a critical onboarding challenge. Without a bulk import tool, administrators must manually re-enter every unit, resident, key record, and maintenance ticket -- a process that can take days or weeks for a 500-unit building. This friction kills deals.

On the export side, Canadian privacy law (PIPEDA) and European privacy law (GDPR) require that any user can request a machine-readable copy of their personal data. Concierge must fulfill these requests within 30 calendar days (PIPEDA) or one calendar month (GDPR). The export system also supports property-level data portability so administrators are never locked into the platform.

### Which Roles Use It

| Role                       | Access Level                          | Primary Use                                                                                |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Super Admin**            | Unrestricted                          | Import data for any property, export full backups, manage DSAR queue across all properties |
| **Property Admin**         | Full import/export for their property | Onboard property data, export property data, process resident DSARs                        |
| **Property Manager**       | Export property data (read-only)      | Download property data exports, view import history                                        |
| **Resident**               | Export own data only                  | Download personal data package from My Account, submit DSAR                                |
| **Board Member**           | No access                             | Data migration is not relevant to governance role                                          |
| **Security Guard**         | No access                             | Operational role with no data migration needs                                              |
| **Front Desk / Concierge** | No access                             | Operational role with no data migration needs                                              |

Roles that do **not** access the Data Migration module: Board Member, Security Guard, Front Desk/Concierge, Maintenance Staff. These roles never see data migration in their navigation.

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across three production platforms and general SaaS migration best practices revealed these essential patterns:

| Capability                  | Where Observed                                                                                       | Our Approach                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **CSV and Excel import**    | All major platforms support CSV import as the baseline data ingestion method                         | Adopt. Support both CSV (.csv) and Excel (.xlsx) uploads                                    |
| **Downloadable templates**  | Best-in-class onboarding tools provide pre-formatted templates with example rows                     | Adopt. Provide a downloadable template for every importable data type with 2-3 example rows |
| **Field mapping interface** | Enterprise migration tools let users map source columns to destination fields via dropdown selectors | Adopt. Drag-and-drop or dropdown column mapping with auto-detection of common column names  |
| **Validation preview**      | Leading tools show a preview of validation results before committing the import                      | Adopt. Full validation pipeline with row-level error reporting before any data is written   |
| **Transactional import**    | Database migration best practices require all-or-nothing commits per batch                           | Adopt. Each import batch is wrapped in a database transaction; rollback on critical errors  |
| **Personal data export**    | PIPEDA and GDPR mandate machine-readable data portability for individuals                            | Adopt. JSON or CSV export of all personal data, generated within 72 hours                   |
| **Encrypted backup export** | Enterprise property management platforms offer full encrypted backups for disaster recovery          | Adopt. AES-256 encrypted ZIP archive for Super Admin export                                 |
| **DSAR management**         | Privacy-first platforms provide structured request intake and processing for data subject requests   | Adopt. Built-in DSAR workflow with SLA tracking                                             |

### Best Practices Adopted

1. **Two-pass import** -- when importing residents that reference units, the system imports units first, then residents. Dependency order is enforced automatically.
2. **Idempotent imports** -- re-uploading the same file does not create duplicates. Conflict resolution strategy (skip, overwrite, merge) is chosen before import starts.
3. **Async processing** -- files with more than 5,000 rows are processed in a background job with email notification on completion.
4. **Point-in-time export** -- exports capture a consistent snapshot of data, even if records are being modified concurrently.
5. **Audit trail** -- every import and export operation is logged with who initiated it, when, and what was affected.

### Pitfalls Avoided

1. **No silent data loss** -- every row that cannot be imported is reported with a specific error message and line number. Nothing is silently skipped.
2. **No vendor lock-in** -- property data can be fully exported at any time. No artificial barriers to leaving the platform.
3. **No manual DSAR processing** -- the system auto-generates data packages for access requests. Administrators review and approve, but do not manually compile data.
4. **No plaintext backups** -- full property backups are always encrypted with AES-256. Encryption keys are managed by the property administrator.
5. **No indefinite data retention** -- export download links expire after 7 days. Backups follow the configured retention policy.

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Import System

The import system accepts structured data files and loads them into the Concierge database after validation.

**Supported Data Types**:

| Data Type               | Priority                                | Description                                            |
| ----------------------- | --------------------------------------- | ------------------------------------------------------ |
| **Units**               | Required first                          | Building units with numbers, floors, and custom fields |
| **Residents**           | Required second (depends on units)      | People linked to units with contact information        |
| **Emergency Contacts**  | Optional (depends on residents)         | Emergency contacts linked to residents                 |
| **FOB/Key Records**     | Optional (depends on units)             | Physical access devices linked to units                |
| **Packages**            | Optional (depends on units + residents) | Historical package log entries                         |
| **Maintenance History** | Optional (depends on units)             | Historical maintenance requests                        |
| **Amenity Bookings**    | Optional (depends on units + residents) | Historical and future amenity reservations             |
| **Parking Permits**     | Optional (depends on units + residents) | Active and historical parking permits                  |
| **Staff**               | Optional (standalone)                   | Staff members with role assignments                    |

**Import Modes**:

| Mode         | File Type              | Max Size | Max Rows    |
| ------------ | ---------------------- | -------- | ----------- |
| CSV Upload   | `.csv` (UTF-8)         | 10 MB    | 50,000 rows |
| Excel Upload | `.xlsx` (single sheet) | 10 MB    | 50,000 rows |

**Encoding Handling**:

- Primary encoding: UTF-8
- BOM detection: if a UTF-8 BOM (byte order mark) is present, it is stripped before parsing
- Fallback detection: if UTF-8 decoding fails, the system attempts ISO-8859-1 (Latin-1) decoding and logs a warning
- If both decodings fail, the import is rejected with error: "File encoding not supported. Please save the file as UTF-8."

#### 3.1.2 Field Mapping Interface

After uploading a file, the user maps source columns to Concierge fields.

**Auto-Detection**: The system attempts to auto-map columns by matching source column headers to known field names. Common aliases are recognized:

| Concierge Field | Recognized Aliases                                                   |
| --------------- | -------------------------------------------------------------------- |
| `unit_number`   | "unit", "unit #", "unit no", "suite", "suite #", "apt", "apartment"  |
| `first_name`    | "first name", "fname", "given name", "first"                         |
| `last_name`     | "last name", "lname", "surname", "family name", "last"               |
| `email`         | "email", "email address", "e-mail"                                   |
| `phone`         | "phone", "phone number", "telephone", "mobile", "cell"               |
| `move_in_date`  | "move in", "move-in", "move in date", "start date", "occupancy date" |

**Manual Mapping**: Users can override auto-detected mappings or map unmapped columns using a dropdown selector. Each dropdown lists all available Concierge fields for the selected data type plus an "Ignore this column" option.

**Transform Rules**: Optional transforms can be applied during mapping:

| Transform         | Description                            | Example                                                    |
| ----------------- | -------------------------------------- | ---------------------------------------------------------- |
| `uppercase`       | Convert value to uppercase             | "john" becomes "JOHN"                                      |
| `lowercase`       | Convert value to lowercase             | "JOHN" becomes "john"                                      |
| `titlecase`       | Convert value to title case            | "john smith" becomes "John Smith"                          |
| `trim`            | Remove leading and trailing whitespace | " John " becomes "John"                                    |
| `date_format`     | Parse date from specified format       | "03/15/2026" with format "MM/DD/YYYY" becomes "2026-03-15" |
| `phone_normalize` | Normalize phone to E.164 format        | "(416) 555-1234" becomes "+14165551234"                    |
| `default_value`   | Set a default if the cell is empty     | Empty cell becomes "N/A"                                   |

#### 3.1.3 Validation Pipeline

Every import passes through a four-stage validation pipeline before any data is written to the database.

**Stage 1 -- Format Check**:

- Verify file is valid CSV or XLSX
- Verify all required columns are mapped
- Verify no duplicate column mappings (two source columns mapped to the same target)
- Verify file has at least 1 data row (not just headers)
- Verify file does not exceed 50,000 rows

**Stage 2 -- Cell-Level Validation**:

- Email fields match RFC 5322 format
- Phone fields are valid E.164 after normalization (10-15 digits with country code)
- Date fields parse successfully in the configured format
- Numeric fields contain valid numbers
- Enum fields match allowed values (e.g., resident_type must be "owner", "tenant", "occupant")
- Required fields are not empty
- String fields do not exceed maximum length

**Stage 3 -- Uniqueness Check**:

- Unit numbers are unique within the property
- Resident email addresses are unique within the property
- FOB serial numbers are unique within the property
- Parking permit numbers are unique within the property

**Stage 4 -- Referential Integrity**:

- Residents reference units that exist (either already in database or in the current import batch)
- Emergency contacts reference residents that exist
- Packages reference units and optionally residents that exist
- FOB records reference units that exist
- Maintenance requests reference units that exist and optionally reference valid categories

**Validation Output**:
After all four stages, the system produces a validation report:

| Field          | Description                                                                |
| -------------- | -------------------------------------------------------------------------- |
| `total_rows`   | Total number of data rows in the file                                      |
| `valid_rows`   | Number of rows passing all validation                                      |
| `warning_rows` | Number of rows with non-critical warnings (e.g., optional field missing)   |
| `error_rows`   | Number of rows with critical errors (will not be imported)                 |
| `errors`       | Array of error objects: `{ row_number, column, value, error_message }`     |
| `warnings`     | Array of warning objects: `{ row_number, column, value, warning_message }` |

#### 3.1.4 Conflict Resolution

When imported data conflicts with existing records, the user chooses a resolution strategy before confirming the import.

**Duplicate Detection Criteria**:

| Data Type       | Duplicate Key                   | Match Logic                    |
| --------------- | ------------------------------- | ------------------------------ |
| Units           | `unit_number` within property   | Exact match (case-insensitive) |
| Residents       | `email` within property         | Exact match (case-insensitive) |
| FOB/Key         | `serial_number` within property | Exact match                    |
| Parking Permits | `permit_number` within property | Exact match                    |
| Staff           | `email` globally                | Exact match (case-insensitive) |

**Resolution Strategies**:

| Strategy      | Behavior                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Skip**      | If a duplicate is found, skip the imported row entirely. Existing record is unchanged.                                                                  |
| **Overwrite** | If a duplicate is found, replace all fields of the existing record with the imported values. Existing fields not present in the import are set to null. |
| **Merge**     | If a duplicate is found, update only non-null imported fields. Existing fields that are not in the import file are preserved.                           |

The resolution strategy is set per-import (not per-row). Users can review the list of detected duplicates in the preview screen before confirming.

#### 3.1.5 Transactional Import

All database writes for a single import job are wrapped in a transaction.

- If any critical error occurs during the write phase, the entire batch is rolled back.
- "Critical error" means a database constraint violation, an unexpected null in a required column, or a foreign key violation that was not caught in validation.
- Warning rows are skipped but do not cause a rollback. The import continues with valid rows.
- After a successful import, a summary is written to the `ImportJob` record with `status = 'completed'`.
- After a failed import, the transaction is rolled back and `status = 'failed'` with the error stored in `error_log`.

#### 3.1.6 Progress Tracking and Async Processing

**Synchronous mode** (fewer than 5,000 rows):

- The import runs in the current request.
- A progress bar displays on screen: percentage complete, rows processed / total rows, estimated time remaining.
- The user must stay on the page until completion. Navigating away shows a confirmation dialog: "Import is in progress. Leaving this page will not cancel the import, but you will lose the progress view."

**Asynchronous mode** (5,000 or more rows):

- The import is queued as a background job.
- The user sees a confirmation: "Your import has been queued. You will receive an email when it is complete."
- The import runs in a worker process with its own database transaction.
- On completion, an email is sent to the user who initiated the import with a summary (rows imported, rows skipped, errors).
- The import status is also visible on the Import History page.

#### 3.1.7 Import History

A table listing all past import jobs for the property.

| Column           | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| **Date**         | Timestamp of when the import was initiated                     |
| **Data Type**    | What was imported (units, residents, etc.)                     |
| **File Name**    | Original uploaded file name                                    |
| **Status**       | Queued, Processing, Completed, Completed with Warnings, Failed |
| **Rows**         | Total / Imported / Skipped / Errors                            |
| **Initiated By** | User who started the import                                    |
| **Actions**      | Download error report, download original file                  |

### 3.2 Core Features (v1) -- Export System

#### 3.2.1 Personal Data Export (PIPEDA/GDPR)

Any authenticated user can export their own personal data from **My Account > Privacy > Export My Data**.

**What Is Included**:

| Data Category            | Fields                                            |
| ------------------------ | ------------------------------------------------- |
| **Profile**              | Name, email, phone, address, move-in date, role   |
| **Emergency Contacts**   | All emergency contacts on file                    |
| **Packages**             | All package records associated with the user      |
| **Maintenance Requests** | All maintenance requests submitted by the user    |
| **Amenity Bookings**     | All bookings made by the user                     |
| **Notifications**        | Notification preferences and delivery log         |
| **Login Activity**       | All login records (timestamp, IP, device, result) |
| **Consent Records**      | All consent grants and revocations                |

**Export Formats**:

| Format   | Structure                                                   |
| -------- | ----------------------------------------------------------- |
| **JSON** | Single JSON file with top-level keys for each data category |
| **CSV**  | ZIP file containing one CSV per data category               |

**Processing**:

- Export request is queued as a background job.
- Processing must complete within 72 hours (internal SLA, stricter than the 30-day PIPEDA requirement).
- User receives an email notification with a secure download link when the export is ready.
- Download link expires after 7 days.
- Download link requires authentication (user must be logged in).
- Download link is single-use per generation (a new link is generated if the user requests another download after the first use).

#### 3.2.2 Property Data Export

Property Admins and Super Admins can export all data for a property.

**Export Format**: Excel workbook (.xlsx) with one sheet per module:

| Sheet Name         | Contents                                              |
| ------------------ | ----------------------------------------------------- |
| Units              | All units with custom fields                          |
| Residents          | All residents with contact information (PII included) |
| Events             | All security console events                           |
| Packages           | All package records                                   |
| Maintenance        | All maintenance requests                              |
| Amenity Bookings   | All amenity reservations                              |
| Parking Permits    | All parking permits                                   |
| FOB/Keys           | All FOB and key records                               |
| Staff              | All staff members                                     |
| Emergency Contacts | All emergency contacts                                |
| Announcements      | All announcements                                     |

**Processing**: Same async model as personal data export. Large properties (10,000+ records across all modules) are processed in a background job with email notification.

#### 3.2.3 Audit Log Export

Super Admins can export the full audit trail for a property.

**Format**: CSV file with digital signature.

**Fields per row**:

| Field         | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `timestamp`   | ISO 8601 timestamp with timezone                                                   |
| `user_id`     | UUID of the user who performed the action                                          |
| `user_name`   | Display name at the time of the action                                             |
| `user_role`   | Role at the time of the action                                                     |
| `action`      | The action performed (create, read, update, delete, login, logout, export, import) |
| `module`      | The module the action occurred in (security_console, maintenance, etc.)            |
| `entity_type` | The type of entity affected (unit, resident, event, etc.)                          |
| `entity_id`   | UUID of the affected entity                                                        |
| `ip_address`  | IP address of the user                                                             |
| `device`      | User agent string (browser, OS)                                                    |
| `changes`     | JSON string describing what changed (for update actions)                           |

**Digital Signature**: The CSV file is signed using HMAC-SHA256 with a per-property key stored in AWS KMS. The signature is appended as a separate `.sig` file in the download ZIP. This allows verification that the audit log has not been tampered with after export.

#### 3.2.4 Full Property Backup

Super Admins can create a complete backup of all property data including uploaded files (photos, documents).

**Contents**:

- All database records for the property (exported as JSON)
- All uploaded files (photos, documents, attachments)
- Audit logs for the backup period
- Property configuration (settings, event types, categories, custom fields)

**Encryption**: AES-256-GCM encryption. The encryption key is derived from a passphrase that the Super Admin enters when initiating the backup. The key derivation uses PBKDF2 with 100,000 iterations.

**File Format**: `.zip.enc` (encrypted ZIP archive)

**Size Limit**: No hard limit. Large backups (>1 GB) are split into 500 MB parts.

**Retention**: Backup files are stored in S3 with a configurable retention period (default: 90 days). After the retention period, the backup is automatically deleted from S3.

#### 3.2.5 Scheduled Exports

Super Admins can configure automatic recurring exports.

| Setting          | Options                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Frequency**    | Weekly (every Sunday at 2:00 AM property timezone) or Monthly (1st of month at 2:00 AM) |
| **Export Type**  | Property Data Export or Full Property Backup                                            |
| **Destination**  | S3 bucket (configured in Settings > Integrations)                                       |
| **Encryption**   | Same AES-256 encryption as manual backups                                               |
| **Retention**    | Number of backups to keep (default: 4 for weekly, 12 for monthly)                       |
| **Notification** | Email sent to Super Admin on success or failure                                         |

### 3.3 Core Features (v1) -- Data Subject Access Requests (DSAR)

#### 3.3.1 DSAR Submission

Residents can submit two types of data subject requests from **My Account > Privacy**:

**Request Type 1 -- Access My Data**:

- Resident clicks "Request My Data" button.
- System shows confirmation: "We will compile all personal data associated with your account. You will receive an email with a download link within 30 days."
- Resident confirms.
- Request is created with status `pending`.

**Request Type 2 -- Delete My Data**:

- Resident clicks "Request Data Deletion" button.
- System shows warning: "This will permanently remove your personal data from Concierge. You will lose access to your account and all associated records. This action cannot be undone after processing."
- Resident must type "DELETE" to confirm.
- Request is created with status `pending_admin_review`.

#### 3.3.2 DSAR Processing

**Access Requests**:

1. Request appears in Admin's DSAR Management queue.
2. System auto-generates the data package (same as personal data export in 3.2.1).
3. Admin reviews the package (can preview before sending).
4. Admin clicks "Approve and Send" -- resident receives the download link via email.
5. Request status changes to `completed` with timestamp.

**Deletion Requests**:

1. Request appears in Admin's DSAR Management queue with "Deletion" label (highlighted in red).
2. Admin reviews the request and the user's data.
3. Admin clicks "Approve Deletion" or "Deny Deletion."
4. If approved, the system executes anonymization:
   - `first_name`, `last_name` replaced with "Deleted User"
   - `email` replaced with `deleted_{uuid}@anonymized.concierge.app`
   - `phone` set to null
   - `address` set to null
   - Profile photo deleted from storage
   - Emergency contacts deleted
   - Login history anonymized (IP addresses replaced with "0.0.0.0", device strings replaced with "anonymized")
   - Consent records retained (required for compliance proof) but user identifiers anonymized
   - Package records retained with anonymized resident reference (building needs the delivery history)
   - Maintenance requests retained with anonymized requester (building needs the maintenance history)
   - Amenity bookings cancelled if future, anonymized if past
   - The user's account is deactivated and cannot be logged into
5. If denied, Admin must provide a reason (free text, required). Reasons might include: "Legal hold", "Outstanding financial obligation", "Active lease agreement."
6. Request status changes to `completed` or `denied` with timestamp and processor ID.

**SLA Tracking**:

| Framework | Access Request SLA            | Deletion Request SLA          |
| --------- | ----------------------------- | ----------------------------- |
| PIPEDA    | 30 calendar days from request | 72 hours from admin approval  |
| GDPR      | 1 calendar month from request | 1 calendar month from request |

The system applies the stricter SLA when both frameworks apply (e.g., a GDPR-subject resident at a Canadian property).

SLA countdown begins at request creation. Warnings are sent to the admin at 50%, 75%, and 90% of the SLA window.

#### 3.3.3 DSAR for Staff Members

When a deletion request is submitted by someone who is both a resident and a staff member, the system handles the two identities separately:

- **Resident data** follows the standard DSAR deletion process above.
- **Staff data** (shift logs, security entries created by this user) is retained but the creator field is anonymized to "Former Staff Member." This data belongs to the property, not the individual.
- The staff account is deactivated separately by the Property Admin through User Management.

---

## 4. Data Model

### 4.1 ImportJob

```
ImportJob
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── data_type (enum: units, residents, emergency_contacts, fob_keys, packages,
│              maintenance_history, amenity_bookings, parking_permits, staff)
├── file_name (varchar 255, NOT NULL)
├── file_size_bytes (integer, NOT NULL)
├── file_url (varchar 500, NOT NULL) -- S3 URL of the uploaded file
├── status (enum: queued, validating, awaiting_confirmation, processing,
│           completed, completed_with_warnings, failed)
├── conflict_strategy (enum: skip, overwrite, merge)
├── total_rows (integer, NOT NULL)
├── processed_rows (integer, default 0)
├── imported_rows (integer, default 0)
├── skipped_rows (integer, default 0)
├── error_count (integer, default 0)
├── warning_count (integer, default 0)
├── error_log (jsonb, nullable) -- Array of { row_number, column, value, error_message }
├── warning_log (jsonb, nullable) -- Array of { row_number, column, value, warning_message }
├── validation_report (jsonb, nullable) -- Full validation report from pipeline
├── created_by → User (FK, NOT NULL)
├── started_at (timestamp with tz, nullable)
├── completed_at (timestamp with tz, nullable)
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_import_job_property_status (property_id, status)
  - idx_import_job_created_by (created_by)
  - idx_import_job_created_at (created_at DESC)
```

### 4.2 ImportMapping

```
ImportMapping
├── id (UUID, PK)
├── import_job_id → ImportJob (FK, NOT NULL, ON DELETE CASCADE)
├── source_column (varchar 255, NOT NULL) -- Column header from the uploaded file
├── source_column_index (integer, NOT NULL) -- Zero-based column position
├── target_field (varchar 255, NOT NULL) -- Concierge database field name
├── transform_rule (enum: none, uppercase, lowercase, titlecase, trim,
│                   date_format, phone_normalize, default_value, nullable)
├── transform_params (jsonb, nullable) -- Parameters for the transform (e.g., { "format": "MM/DD/YYYY" })
├── is_ignored (boolean, default false) -- True if user chose to ignore this column
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_import_mapping_job (import_job_id)

Constraints:
  - UNIQUE (import_job_id, target_field) WHERE is_ignored = false -- No two source columns map to the same target
```

### 4.3 DataExportRequest

```
DataExportRequest
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── user_id → User (FK, nullable) -- The user whose data is exported (null for property-level exports)
├── requested_by → User (FK, NOT NULL) -- The user who initiated the export
├── export_type (enum: personal_data, property_data, audit_log, full_backup)
├── format (enum: json, csv, xlsx, encrypted_zip)
├── status (enum: queued, processing, completed, failed, expired)
├── file_url (varchar 500, nullable) -- S3 URL of the generated export file
├── file_size_bytes (integer, nullable)
├── encryption_key_hash (varchar 255, nullable) -- For encrypted backups, hash of the passphrase
├── expires_at (timestamp with tz, nullable) -- When the download link expires
├── download_count (integer, default 0)
├── processed_at (timestamp with tz, nullable)
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_export_request_property (property_id, status)
  - idx_export_request_user (user_id)
  - idx_export_request_expires (expires_at) WHERE status = 'completed'
```

### 4.4 DSARRequest

```
DSARRequest
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── user_id → User (FK, NOT NULL) -- The user who submitted the request
├── request_type (enum: access, deletion)
├── status (enum: pending, pending_admin_review, in_progress, completed, denied)
├── applicable_frameworks (varchar[] , NOT NULL) -- e.g., ['PIPEDA'], ['PIPEDA', 'GDPR']
├── sla_deadline (timestamp with tz, NOT NULL) -- Calculated based on strictest applicable framework
├── denial_reason (text, nullable) -- Required when status = 'denied'
├── export_request_id → DataExportRequest (FK, nullable) -- Link to the generated data package
├── processed_by → User (FK, nullable) -- Admin who processed the request
├── processed_at (timestamp with tz, nullable)
├── anonymization_log (jsonb, nullable) -- For deletion requests: record of what was anonymized
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_dsar_property_status (property_id, status)
  - idx_dsar_user (user_id)
  - idx_dsar_sla_deadline (sla_deadline) WHERE status IN ('pending', 'pending_admin_review', 'in_progress')
```

### 4.5 ScheduledExport

```
ScheduledExport
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── export_type (enum: property_data, full_backup)
├── frequency (enum: weekly, monthly)
├── day_of_week (integer, nullable) -- 0 = Sunday, only for weekly
├── day_of_month (integer, nullable) -- 1-28, only for monthly
├── time_of_day (time, NOT NULL, default '02:00:00') -- In property timezone
├── destination_s3_bucket (varchar 255, NOT NULL)
├── destination_s3_prefix (varchar 255, nullable) -- S3 key prefix
├── encryption_passphrase_hash (varchar 255, NOT NULL)
├── retention_count (integer, NOT NULL, default 4)
├── is_enabled (boolean, default true)
├── last_run_at (timestamp with tz, nullable)
├── last_run_status (enum: success, failed, nullable)
├── next_run_at (timestamp with tz, NOT NULL)
├── created_by → User (FK, NOT NULL)
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_scheduled_export_property (property_id)
  - idx_scheduled_export_next_run (next_run_at) WHERE is_enabled = true
```

### 4.6 FieldMappingTemplate

```
FieldMappingTemplate
├── id (UUID, PK)
├── data_type (enum: units, residents, emergency_contacts, fob_keys, packages,
│              maintenance_history, amenity_bookings, parking_permits, staff)
├── template_name (varchar 100, NOT NULL) -- e.g., "Default Unit Import"
├── is_system (boolean, default false) -- System templates cannot be deleted
├── property_id → Property (FK, nullable) -- Null for system templates
├── column_mappings (jsonb, NOT NULL) -- Array of { source_pattern, target_field, transform_rule }
├── created_by → User (FK, nullable)
├── created_at (timestamp with tz, NOT NULL, default NOW())
└── updated_at (timestamp with tz, NOT NULL, default NOW())

Indexes:
  - idx_field_mapping_template_type (data_type)
  - idx_field_mapping_template_property (property_id)
```

---

## 5. CSV Template Specifications

### 5.1 Units Template

**File name**: `concierge-import-template-units.csv`

**Required Fields**:

| Column        | Format  | Max Length | Description                                     |
| ------------- | ------- | ---------- | ----------------------------------------------- |
| `unit_number` | String  | 20         | Unit identifier (e.g., "101", "PH-1", "B2-305") |
| `floor`       | Integer | --         | Floor number (e.g., 1, 2, 15)                   |

**Optional Fields**:

| Column           | Format  | Max Length | Description                                                                |
| ---------------- | ------- | ---------- | -------------------------------------------------------------------------- |
| `building`       | String  | 100        | Building name for multi-building properties                                |
| `unit_type`      | Enum    | --         | "residential", "commercial", "storage", "parking" (default: "residential") |
| `square_footage` | Integer | --         | Unit square footage                                                        |
| `bedrooms`       | Integer | --         | Number of bedrooms                                                         |
| `bathrooms`      | Decimal | --         | Number of bathrooms (e.g., 1.5)                                            |
| `notes`          | String  | 500        | General notes about the unit                                               |

**Example Rows**:

```csv
unit_number,floor,building,unit_type,square_footage,bedrooms,bathrooms,notes
101,1,Tower A,residential,850,2,1,"Corner unit, accessible entrance"
102,1,Tower A,residential,720,1,1,
PH-1,30,Tower A,residential,2200,3,2.5,Penthouse - two-level unit
```

### 5.2 Residents Template

**File name**: `concierge-import-template-residents.csv`

**Required Fields**:

| Column        | Format           | Max Length | Description                                                 |
| ------------- | ---------------- | ---------- | ----------------------------------------------------------- |
| `unit_number` | String           | 20         | Must match an existing unit or a unit in the current import |
| `first_name`  | String           | 100        | Resident first name                                         |
| `last_name`   | String           | 100        | Resident last name                                          |
| `email`       | Email (RFC 5322) | 255        | Primary email address                                       |

**Optional Fields**:

| Column          | Format                | Max Length | Description                                                     |
| --------------- | --------------------- | ---------- | --------------------------------------------------------------- |
| `phone`         | E.164 or local format | 20         | Primary phone number (normalized to +1XXXXXXXXXX)               |
| `resident_type` | Enum                  | --         | "owner", "tenant", "occupant" (default: "tenant")               |
| `move_in_date`  | Date (YYYY-MM-DD)     | --         | Date the resident moved in                                      |
| `move_out_date` | Date (YYYY-MM-DD)     | --         | Date the resident moved out (null if current)                   |
| `parking_spot`  | String                | 20         | Assigned parking spot number                                    |
| `locker_number` | String                | 20         | Assigned storage locker number                                  |
| `is_primary`    | Boolean               | --         | "true" or "false" (default: "true" for first resident per unit) |

**Example Rows**:

```csv
unit_number,first_name,last_name,email,phone,resident_type,move_in_date
101,Jane,Smith,jane.smith@email.com,(416) 555-1234,owner,2022-03-15
101,Bob,Smith,bob.smith@email.com,(416) 555-5678,owner,2022-03-15
102,Alice,Johnson,alice.j@email.com,+14165559999,tenant,2024-01-01
```

### 5.3 Emergency Contacts Template

**File name**: `concierge-import-template-emergency-contacts.csv`

**Required Fields**:

| Column           | Format                 | Max Length | Description                                                    |
| ---------------- | ---------------------- | ---------- | -------------------------------------------------------------- |
| `resident_email` | Email                  | 255        | Email of the resident this contact belongs to                  |
| `contact_name`   | String                 | 200        | Full name of the emergency contact                             |
| `contact_phone`  | Phone (E.164 or local) | 20         | Phone number                                                   |
| `relationship`   | String                 | 100        | Relationship to resident (e.g., "Spouse", "Parent", "Sibling") |

**Optional Fields**:

| Column          | Format  | Max Length | Description                                            |
| --------------- | ------- | ---------- | ------------------------------------------------------ |
| `contact_email` | Email   | 255        | Email of the emergency contact                         |
| `priority`      | Integer | --         | Contact priority order (1 = first to call, default: 1) |
| `notes`         | String  | 500        | Special instructions                                   |

**Example Rows**:

```csv
resident_email,contact_name,contact_phone,relationship,priority,notes
jane.smith@email.com,Mark Smith,+14165551111,Spouse,1,Has a key to the unit
jane.smith@email.com,Sarah Williams,(905) 555-2222,Sister,2,Lives in Mississauga
```

### 5.4 FOB/Key Records Template

**File name**: `concierge-import-template-fob-keys.csv`

**Required Fields**:

| Column          | Format | Max Length | Description                                   |
| --------------- | ------ | ---------- | --------------------------------------------- |
| `unit_number`   | String | 20         | Unit the device is assigned to                |
| `device_type`   | Enum   | --         | "fob", "key", "garage_clicker", "buzzer_code" |
| `serial_number` | String | 100        | Unique serial or identifier                   |

**Optional Fields**:

| Column              | Format            | Max Length | Description                                                  |
| ------------------- | ----------------- | ---------- | ------------------------------------------------------------ |
| `assigned_to_email` | Email             | 255        | Email of the person the device is assigned to                |
| `status`            | Enum              | --         | "active", "inactive", "lost", "returned" (default: "active") |
| `issued_date`       | Date (YYYY-MM-DD) | --         | Date the device was issued                                   |
| `notes`             | String            | 500        | Notes about the device                                       |

**Example Rows**:

```csv
unit_number,device_type,serial_number,assigned_to_email,status,issued_date
101,fob,FOB-2024-00123,jane.smith@email.com,active,2024-01-15
101,fob,FOB-2024-00124,bob.smith@email.com,active,2024-01-15
101,garage_clicker,GC-0456,,active,2024-01-15
```

### 5.5 Other Templates (Brief)

The following templates follow the same structure. Full template files are generated by the system and available for download from the Import Wizard.

| Template                | Required Fields                                                                   | Key Optional Fields                                                                     |
| ----------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Packages**            | `unit_number`, `package_type`, `courier`, `received_date`                         | `resident_email`, `tracking_number`, `released_date`, `released_to`, `storage_location` |
| **Maintenance History** | `unit_number`, `description`, `status`, `created_date`                            | `category`, `priority`, `assigned_to`, `closed_date`, `resolution_notes`                |
| **Amenity Bookings**    | `amenity_name`, `unit_number`, `resident_email`, `start_datetime`, `end_datetime` | `status`, `notes`, `amount_paid`                                                        |
| **Parking Permits**     | `unit_number`, `permit_type`, `license_plate`, `vehicle_make_model`               | `resident_email`, `start_date`, `end_date`, `spot_number`, `province_state`             |
| **Staff**               | `first_name`, `last_name`, `email`, `role`                                        | `phone`, `hire_date`, `department`, `notes`                                             |

---

## 6. User Flows

### 6.1 Import Wizard Flow

```
Step 1: Choose Data Type
  └── User selects what they are importing (e.g., "Residents")
  └── System displays: required columns, optional columns, download template link

Step 2: Upload File
  └── User drags and drops or clicks to browse for a CSV/XLSX file
  └── System validates: file type, file size (max 10 MB), encoding
  └── If invalid: show error message, allow re-upload

Step 3: Map Fields
  └── System displays a two-column mapping table:
       Left column: source headers from the uploaded file
       Right column: dropdown of Concierge fields (auto-populated where possible)
  └── Unmapped columns are highlighted in yellow
  └── Required fields that are not mapped are highlighted in red
  └── User can apply transforms (date format, phone normalize, etc.)
  └── User clicks "Validate" to proceed

Step 4: Validation Results
  └── System runs the 4-stage validation pipeline
  └── Displays summary: X valid, Y warnings, Z errors
  └── If errors > 0: user can download the error report (CSV with row numbers and error messages)
  └── User can fix the source file and re-upload, or proceed with valid rows only

Step 5: Conflict Resolution
  └── If duplicates are detected, system shows count: "12 duplicate units found"
  └── User selects strategy: Skip / Overwrite / Merge
  └── System shows a preview table of the first 5 duplicates with side-by-side comparison

Step 6: Preview and Confirm
  └── System shows a preview of the first 20 rows as they will appear in Concierge
  └── Summary card: "Ready to import 487 units. 12 duplicates will be skipped."
  └── User clicks "Start Import"

Step 7: Progress
  └── For < 5,000 rows: progress bar on screen
  └── For >= 5,000 rows: "Import queued" message with email notification promise

Step 8: Completion
  └── Success screen with summary: imported, skipped, warnings
  └── Links: "View imported records", "Download summary report", "Start another import"
```

### 6.2 Personal Data Export Flow

```
Step 1: Navigate to My Account > Privacy
Step 2: Click "Export My Data"
Step 3: Choose format: JSON or CSV
Step 4: Confirm request
Step 5: See confirmation: "Your data export is being prepared. You will receive an email."
Step 6: Receive email with secure download link (within 72 hours)
Step 7: Click link, authenticate, download file
```

### 6.3 DSAR Deletion Flow

```
Step 1: Resident navigates to My Account > Privacy
Step 2: Clicks "Request Data Deletion"
Step 3: Reads warning about permanent data removal
Step 4: Types "DELETE" in confirmation field
Step 5: Request submitted, sees "Your request is under review"
Step 6: Admin receives notification in DSAR Management queue
Step 7: Admin reviews request, clicks "Approve" or "Deny"
Step 8: If approved: system anonymizes data within 72 hours
Step 9: If denied: resident receives email with denial reason
Step 10: Resident receives confirmation email of outcome
```

---

## 7. UI/UX

### 7.1 Import Wizard Layout (Desktop)

The import wizard is a full-page stepped interface with a progress indicator at the top.

**Progress Indicator**: Horizontal step bar showing all 7 steps. Current step is highlighted in blue (#2563EB). Completed steps show a green checkmark. Future steps are grey.

**Content Area**: Centered container, max-width 960px, white background, 32px padding.

**Navigation Buttons**: "Back" (secondary, left-aligned) and "Next" (primary, right-aligned) at the bottom of each step.

**Field Mapping Table**:

- Left column header: "Your File Column" -- displays source column name and first 3 sample values in grey text
- Right column header: "Maps To" -- dropdown selector with search
- Status indicator: green checkmark (mapped), yellow warning (unmapped optional), red X (unmapped required)
- Transform column: gear icon that opens a dropdown to select a transform rule

**Validation Results Screen**:

- Summary cards at top: 3 cards showing Valid (green), Warnings (yellow), Errors (red) with counts
- Error table below: sortable by row number, column, error type
- Download button: "Download Error Report (CSV)"
- Action buttons: "Fix and Re-upload" (secondary) and "Import Valid Rows Only" (primary, disabled if 0 valid rows)

### 7.2 Export Dashboard Layout (Desktop)

Split into three sections:

**Section 1 -- Available Exports** (left, 60% width):

- Card for each export type (Personal Data, Property Data, Audit Log, Full Backup)
- Each card shows: description, estimated file size, last export date, "Export" button

**Section 2 -- Scheduled Exports** (right, 40% width):

- List of configured scheduled exports with status indicator
- "Add Schedule" button

**Section 3 -- Download History** (full width, below):

- Table: Date, Export Type, File Size, Status, Expires At, Download button
- Expired downloads show "Expired" badge, no download button

### 7.3 DSAR Management Layout (Desktop)

**Request Queue**:

- Table with columns: Date Submitted, Resident Name, Unit, Request Type (badge: blue "Access" or red "Deletion"), Status, SLA Remaining (countdown), Actions
- SLA Remaining shows days remaining. Turns yellow at 7 days remaining. Turns red at 3 days remaining.
- Sort by SLA Remaining (ascending) by default so urgent requests appear first.
- Action buttons: "Process" (opens detail panel), "Approve", "Deny"

**Detail Panel** (slides in from right, 40% width):

- Resident info summary
- Request details
- Data preview (for access requests)
- Approve / Deny buttons with confirmation dialog

### 7.4 Empty States

| Screen            | Empty State Message               | Call to Action                    |
| ----------------- | --------------------------------- | --------------------------------- |
| Import History    | "No imports yet"                  | "Start your first import" button  |
| Export History    | "No exports yet"                  | "Create your first export" button |
| DSAR Queue        | "No pending requests"             | None (informational)              |
| Scheduled Exports | "No scheduled exports configured" | "Set up automatic backups" button |

### 7.5 Error States

| Error                    | Message                                                                                        | Recovery                     |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| File too large           | "File exceeds the 10 MB limit. Please split into smaller files or remove unnecessary columns." | Re-upload                    |
| Too many rows            | "File exceeds the 50,000 row limit. Please split the data into multiple files."                | Re-upload                    |
| Invalid file type        | "Only .csv and .xlsx files are supported."                                                     | Re-upload                    |
| Export generation failed | "Export could not be generated. Our team has been notified."                                   | Retry button                 |
| Download link expired    | "This download link has expired. Please generate a new export."                                | "Generate New Export" button |

### 7.6 Tooltips

| Element                       | Tooltip Text                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Conflict Strategy: Skip       | "Existing records are kept unchanged. Imported duplicates are ignored."                                     |
| Conflict Strategy: Overwrite  | "Existing records are completely replaced with imported values. Fields not in the import file are cleared." |
| Conflict Strategy: Merge      | "Only non-empty imported fields are applied. Existing values for fields not in the import file are kept."   |
| Digital Signature (.sig file) | "This signature file proves the audit log has not been tampered with since export."                         |
| SLA Remaining                 | "Days remaining to fulfill this request per privacy regulations (PIPEDA: 30 days, GDPR: 1 month)."          |
| Full Backup Passphrase        | "This passphrase encrypts your backup. Store it securely -- if lost, the backup cannot be decrypted."       |

---

## 8. AI Integration

### 8.1 Smart Field Mapping (v1)

When a user uploads a file, the AI analyzes column headers and sample values to suggest mappings.

**How It Works**:

1. Extract column headers and first 5 rows of data from the uploaded file.
2. Send to Claude with the prompt: "Given these column headers and sample values, map each column to the most appropriate Concierge field from this list: [list of target fields with descriptions]."
3. AI returns suggested mappings with confidence scores (0-1).
4. Mappings with confidence > 0.8 are auto-applied. Mappings with confidence 0.5-0.8 are suggested (highlighted in blue). Mappings with confidence < 0.5 are left unmapped.

**Example**: A column named "Suite #" with values ["101", "102", "PH-1"] would be mapped to `unit_number` with confidence 0.95.

### 8.2 Import Error Assistance (v1)

When validation errors occur, the AI provides plain-language explanations and fix suggestions.

**Example**: If row 47 has email "jane.smith@" (missing domain), the AI suggests: "The email address in row 47 is incomplete. It should include a domain, for example: jane.smith@email.com."

### 8.3 Data Quality Report (v2)

After import, the AI analyzes the imported data for quality issues:

- Missing email addresses (percentage)
- Incomplete phone numbers
- Units with no residents
- Residents with no emergency contacts
- Duplicate-looking names across different units

This generates a "Data Quality Score" (0-100) with specific recommendations.

---

## 9. Analytics

### 9.1 Import Analytics

| Metric             | Description                       | Tracked By                                |
| ------------------ | --------------------------------- | ----------------------------------------- |
| `import_initiated` | Number of imports started         | Property, data type, user                 |
| `import_completed` | Number of imports completed       | Property, data type, success/partial/fail |
| `import_rows`      | Total rows imported               | Property, data type                       |
| `import_errors`    | Total validation errors           | Property, error type                      |
| `import_duration`  | Time from start to completion     | Property, data type, row count            |
| `import_abandoned` | Imports started but not confirmed | Property, step abandoned at               |

### 9.2 Export Analytics

| Metric              | Description                                    | Tracked By                       |
| ------------------- | ---------------------------------------------- | -------------------------------- |
| `export_requested`  | Number of exports requested                    | Property, export type, user role |
| `export_completed`  | Number of exports completed                    | Property, export type            |
| `export_downloaded` | Number of export files downloaded              | Property, export type            |
| `export_expired`    | Number of exports that expired before download | Property, export type            |

### 9.3 DSAR Analytics

| Metric               | Description                            | Tracked By                                  |
| -------------------- | -------------------------------------- | ------------------------------------------- |
| `dsar_submitted`     | Number of DSARs submitted              | Property, request type                      |
| `dsar_completed`     | Number of DSARs completed              | Property, request type, within SLA (yes/no) |
| `dsar_denied`        | Number of DSARs denied                 | Property, denial reason                     |
| `dsar_response_time` | Days between submission and completion | Property, request type                      |
| `dsar_sla_breach`    | Number of DSARs that breached SLA      | Property, framework                         |

---

## 10. Notifications

### 10.1 Import Notifications

| Trigger                  | Recipient       | Channels       | Template                                                                             |
| ------------------------ | --------------- | -------------- | ------------------------------------------------------------------------------------ |
| Import completed (sync)  | Initiating user | In-app toast   | "Import complete: {imported} of {total} rows imported."                              |
| Import completed (async) | Initiating user | Email + in-app | "Your {data_type} import is complete. {imported} records imported, {errors} errors." |
| Import failed (async)    | Initiating user | Email + in-app | "Your {data_type} import failed. Error: {error_message}."                            |

### 10.2 Export Notifications

| Trigger                  | Recipient       | Channels       | Template                                                               |
| ------------------------ | --------------- | -------------- | ---------------------------------------------------------------------- |
| Export ready             | Requesting user | Email + in-app | "Your data export is ready. Download it within 7 days."                |
| Export failed            | Requesting user | Email + in-app | "Your data export could not be generated. Please try again."           |
| Scheduled export success | Super Admin     | Email          | "Scheduled {export_type} backup completed successfully."               |
| Scheduled export failed  | Super Admin     | Email + SMS    | "Scheduled {export_type} backup FAILED. Immediate attention required." |

### 10.3 DSAR Notifications

| Trigger                  | Recipient                    | Channels       | Template                                                           |
| ------------------------ | ---------------------------- | -------------- | ------------------------------------------------------------------ |
| DSAR submitted           | Property Admin               | Email + in-app | "A data subject request has been submitted by {user_name}."        |
| DSAR SLA warning (50%)   | Property Admin               | Email          | "DSAR #{id} is at 50% of its SLA deadline. {days} days remaining." |
| DSAR SLA warning (75%)   | Property Admin               | Email + in-app | "DSAR #{id} is at 75% of its SLA deadline. {days} days remaining." |
| DSAR SLA critical (90%)  | Property Admin + Super Admin | Email + SMS    | "URGENT: DSAR #{id} has {days} days until SLA breach."             |
| DSAR approved (access)   | Resident                     | Email          | "Your data export is ready for download."                          |
| DSAR approved (deletion) | Resident                     | Email          | "Your data deletion request has been processed."                   |
| DSAR denied              | Resident                     | Email          | "Your data request has been denied. Reason: {reason}."             |

---

## 11. API Endpoints

### 11.1 Import Endpoints

**POST** `/api/v1/admin/import/upload`

- **Description**: Upload a CSV/XLSX file and create a new ImportJob
- **Auth**: Property Admin, Super Admin
- **Request**: Multipart form data with `file` (the CSV/XLSX) and `data_type` (enum)
- **Response**: `201 Created` with ImportJob object (status: "validating")
- **Errors**: `400` invalid file type or size, `403` unauthorized

**GET** `/api/v1/admin/import/:jobId`

- **Description**: Get import job status and details
- **Auth**: Property Admin, Super Admin (property-scoped)
- **Response**: `200 OK` with ImportJob object including progress percentage
- **Errors**: `404` not found, `403` unauthorized

**GET** `/api/v1/admin/import/:jobId/mappings`

- **Description**: Get auto-detected field mappings for review
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with array of ImportMapping objects plus AI suggestions
- **Errors**: `404` not found

**PUT** `/api/v1/admin/import/:jobId/mappings`

- **Description**: Update field mappings (user overrides)
- **Auth**: Property Admin, Super Admin
- **Request Body**: Array of `{ source_column_index, target_field, transform_rule, transform_params, is_ignored }`
- **Response**: `200 OK` with updated mappings
- **Errors**: `400` invalid mapping, `404` not found

**POST** `/api/v1/admin/import/:jobId/validate`

- **Description**: Run the 4-stage validation pipeline
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with validation report (valid_rows, error_rows, errors array)
- **Errors**: `400` mappings incomplete

**POST** `/api/v1/admin/import/:jobId/confirm`

- **Description**: Confirm and start the import
- **Auth**: Property Admin, Super Admin
- **Request Body**: `{ conflict_strategy: "skip" | "overwrite" | "merge" }`
- **Response**: `202 Accepted` (async) or `200 OK` (sync, <5000 rows) with ImportJob
- **Errors**: `400` validation not run, `409` already confirmed

**GET** `/api/v1/admin/import/:jobId/errors`

- **Description**: Download the error report as CSV
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with CSV file stream
- **Headers**: `Content-Disposition: attachment; filename="import-errors-{jobId}.csv"`

**GET** `/api/v1/admin/import/history`

- **Description**: List all import jobs for the property
- **Auth**: Property Admin, Property Manager, Super Admin
- **Query Params**: `page`, `per_page`, `status`, `data_type`, `date_from`, `date_to`
- **Response**: `200 OK` with paginated array of ImportJob objects

**GET** `/api/v1/admin/import/templates/:dataType`

- **Description**: Download the CSV template for a data type
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with CSV file stream
- **Headers**: `Content-Disposition: attachment; filename="concierge-import-template-{dataType}.csv"`

### 11.2 Export Endpoints

**POST** `/api/v1/admin/export/property`

- **Description**: Request a full property data export
- **Auth**: Property Admin, Super Admin
- **Request Body**: `{ format: "xlsx" }` (only xlsx supported for property export)
- **Response**: `202 Accepted` with DataExportRequest object
- **Errors**: `403` unauthorized

**POST** `/api/v1/admin/export/audit-log`

- **Description**: Request an audit log export with digital signature
- **Auth**: Super Admin
- **Request Body**: `{ date_from, date_to }` (ISO 8601 dates)
- **Response**: `202 Accepted` with DataExportRequest object
- **Errors**: `403` unauthorized

**POST** `/api/v1/admin/export/backup`

- **Description**: Request a full encrypted property backup
- **Auth**: Super Admin
- **Request Body**: `{ passphrase: string }` (min 16 characters)
- **Response**: `202 Accepted` with DataExportRequest object
- **Errors**: `400` passphrase too short, `403` unauthorized

**GET** `/api/v1/admin/export/:requestId`

- **Description**: Get export request status
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with DataExportRequest object

**GET** `/api/v1/admin/export/:requestId/download`

- **Description**: Download the generated export file
- **Auth**: Property Admin, Super Admin (must match original requester or Super Admin)
- **Response**: `200 OK` with file stream
- **Errors**: `404` not found, `410 Gone` if expired

**GET** `/api/v1/admin/export/history`

- **Description**: List all export requests for the property
- **Auth**: Property Admin, Property Manager, Super Admin
- **Query Params**: `page`, `per_page`, `status`, `export_type`
- **Response**: `200 OK` with paginated array

### 11.3 Personal Data Export Endpoints

**POST** `/api/v1/my-account/export`

- **Description**: Request personal data export
- **Auth**: Any authenticated user
- **Request Body**: `{ format: "json" | "csv" }`
- **Response**: `202 Accepted` with DataExportRequest object

**GET** `/api/v1/my-account/export/:requestId`

- **Description**: Get export request status
- **Auth**: Must be the requesting user
- **Response**: `200 OK` with DataExportRequest object

**GET** `/api/v1/my-account/export/:requestId/download`

- **Description**: Download personal data export
- **Auth**: Must be the requesting user
- **Response**: `200 OK` with file stream
- **Errors**: `410 Gone` if expired

### 11.4 DSAR Endpoints

**POST** `/api/v1/my-account/dsar`

- **Description**: Submit a data subject request
- **Auth**: Any authenticated user
- **Request Body**: `{ request_type: "access" | "deletion" }`
- **Response**: `201 Created` with DSARRequest object

**GET** `/api/v1/my-account/dsar`

- **Description**: List the user's own DSAR requests
- **Auth**: Any authenticated user
- **Response**: `200 OK` with array of DSARRequest objects

**GET** `/api/v1/admin/dsar`

- **Description**: List all DSAR requests for the property
- **Auth**: Property Admin, Super Admin
- **Query Params**: `page`, `per_page`, `status`, `request_type`
- **Response**: `200 OK` with paginated array

**GET** `/api/v1/admin/dsar/:requestId`

- **Description**: Get DSAR details
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with full DSARRequest including linked export and anonymization log

**POST** `/api/v1/admin/dsar/:requestId/approve`

- **Description**: Approve a DSAR request
- **Auth**: Property Admin, Super Admin
- **Response**: `200 OK` with updated DSARRequest
- **Errors**: `400` already processed, `404` not found

**POST** `/api/v1/admin/dsar/:requestId/deny`

- **Description**: Deny a DSAR request
- **Auth**: Property Admin, Super Admin
- **Request Body**: `{ reason: string }` (required, min 20 characters)
- **Response**: `200 OK` with updated DSARRequest
- **Errors**: `400` reason too short or already processed

### 11.5 Scheduled Export Endpoints

**POST** `/api/v1/admin/export/schedules`

- **Description**: Create a scheduled export
- **Auth**: Super Admin
- **Request Body**: `{ export_type, frequency, destination_s3_bucket, passphrase, retention_count }`
- **Response**: `201 Created` with ScheduledExport object

**GET** `/api/v1/admin/export/schedules`

- **Description**: List scheduled exports
- **Auth**: Super Admin
- **Response**: `200 OK` with array of ScheduledExport objects

**PUT** `/api/v1/admin/export/schedules/:scheduleId`

- **Description**: Update a scheduled export
- **Auth**: Super Admin
- **Request Body**: Partial ScheduledExport fields
- **Response**: `200 OK` with updated ScheduledExport

**DELETE** `/api/v1/admin/export/schedules/:scheduleId`

- **Description**: Delete a scheduled export
- **Auth**: Super Admin
- **Response**: `204 No Content`

---

## 12. Edge Cases

### 12.1 Encoding Issues

| Scenario                                          | Handling                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| CSV saved as Latin-1 (ISO-8859-1)                 | Auto-detect and convert to UTF-8. Log a warning: "File was converted from ISO-8859-1 to UTF-8." |
| CSV with UTF-8 BOM                                | Strip BOM before parsing. No user-visible effect.                                               |
| Excel file with special characters (accents, CJK) | XLSX natively supports Unicode. No conversion needed.                                           |
| CSV with mixed line endings (LF vs CRLF)          | Normalize to LF during parsing. No user-visible effect.                                         |

### 12.2 Dependency Ordering

| Scenario                                                               | Handling                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Importing residents that reference units not yet in the system         | The import wizard enforces dependency order: units must be imported before residents. If the user tries to import residents first, the system checks for missing units and shows: "X residents reference units that do not exist. Please import units first." |
| Importing emergency contacts that reference residents not yet imported | Same approach: residents must exist before emergency contacts.                                                                                                                                                                                                |
| Single file with units AND residents (mixed data)                      | Not supported. Each file must contain one data type. The wizard clearly labels this: "Each import file should contain one type of data."                                                                                                                      |

### 12.3 Large File Handling

| Scenario                                           | Handling                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| File exceeds 50,000 rows                           | Reject with error: "File contains {row_count} rows. Maximum is 50,000 per import. Please split into smaller files."           |
| File exceeds 10 MB                                 | Reject with error: "File is {size} MB. Maximum file size is 10 MB."                                                           |
| Async import (5,000+ rows) and user closes browser | Import continues in background. User can check status on Import History page or wait for email.                               |
| Async import takes more than 1 hour                | System logs a warning. If import takes more than 2 hours, it is terminated with status "failed" and error "Import timed out." |

### 12.4 Export Edge Cases

| Scenario                                                    | Handling                                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Export requested while data is actively being modified      | Export captures a point-in-time snapshot using a database read replica or serializable transaction isolation.                                  |
| Property with 100,000+ records across all modules           | Export is split into chunks. Processing may take up to 24 hours. User is notified of estimated wait time.                                      |
| Multiple export requests from the same user within 24 hours | Rate limit: maximum 3 export requests per user per 24 hours. After that: "You have reached the export limit. Please try again tomorrow."       |
| Download link accessed after expiry (7 days)                | Return `410 Gone` with message: "This download has expired. Please request a new export."                                                      |
| Scheduled backup destination S3 bucket is inaccessible      | Mark scheduled export as "failed". Send email + SMS to Super Admin: "Scheduled backup failed: S3 bucket unreachable." Retry once after 1 hour. |

### 12.5 DSAR Edge Cases

| Scenario                                                      | Handling                                                                                                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| DSAR for a user who is both resident and staff                | Separate handling per Section 3.3.3. Resident data follows DSAR rules. Staff operational data is retained with anonymized attribution.    |
| Duplicate DSAR submission (user submits twice)                | Second request is rejected: "You already have a pending request. Please wait for it to be processed."                                     |
| DSAR submitted by a user who then moves out before processing | Request is still processed. The move-out does not invalidate the privacy right. Admin is notified of the status change.                   |
| Admin denies deletion request but resident insists            | Resident is directed to escalate via external channels (privacy commissioner). System logs the dispute.                                   |
| Deletion request for a user involved in an active legal hold  | Admin denies with reason "Legal hold." System flags the user's data as "retention required -- legal hold" to prevent accidental deletion. |
| GDPR request from EU resident at Canadian property            | System detects the GDPR applicability and applies the stricter of PIPEDA and GDPR timelines for each aspect.                              |

---

## 12.6 Automated Data Retention Enforcement (Compliance Required)

This section defines the automated retention enforcement system required by PIPEDA Principle 5, GDPR Article 5(1)(e), SOC 2 P6.1, and ISO 27001 A.8.10. See `docs/tech/COMPLIANCE-MATRIX.md` gap C4 and Section 11.

### Retention Enforcer Job

A scheduled background job (`retention-enforcer`) runs daily at 3:00 AM UTC. It enforces the data retention matrix defined in `docs/tech/COMPLIANCE-MATRIX.md` Section 11.

**Job Behavior**:

| Step | Action                  | Detail                                                                                                                                                                                                                                                       |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | **Scan**                | For each data category in the retention matrix, query records where the retention period has expired based on the relevant date field (e.g., `move_out_date + retention_period` for resident accounts, `created_at + retention_period` for security events). |
| 2    | **Classify**            | Determine the action for each expired record: Anonymize, Soft-Delete, or Archive. The action is defined per data category in the retention matrix.                                                                                                           |
| 3    | **Exclude legal holds** | Skip any record flagged with `legal_hold = true`. Legal holds are set manually by admin.                                                                                                                                                                     |
| 4    | **Execute Anonymize**   | For "Anonymize" records: replace all PII fields (name, email, phone, address) with `[REDACTED]`. Set `anonymized_at = now()`. Retain the record structure and non-PII fields (timestamps, counts, categories) for aggregate reporting.                       |
| 5    | **Execute Soft-Delete** | For "Soft-Delete" records: set `deleted_at = now()`, `deleted_by = 'system:retention-enforcer'`. Record remains in database for 30-day grace period. After 30 days, hard-delete in next run.                                                                 |
| 6    | **Execute Archive**     | For "Archive" records: move to cold storage tier. Update the record pointer to reference cold storage location. Original record replaced with a stub: `{ archived_at, archive_reference, record_type, record_count }`.                                       |
| 7    | **Log**                 | Create a `RetentionEnforcementLog` entry: job run ID, data category, records scanned, records acted on (per action type), records skipped (legal hold), errors encountered, duration.                                                                        |
| 8    | **Report**              | Generate a monthly "Retention Enforcement Report" summarizing all actions taken. Send to Super Admin via email. Report is also available in the Compliance Dashboard (PRD 28).                                                                               |

**Retention Enforcer API Endpoints**:

| Method | Path                           | Description                                                                            | Auth        |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------- | ----------- |
| `GET`  | `/api/admin/retention/status`  | Returns the last run status, next scheduled run, and summary statistics                | Super Admin |
| `POST` | `/api/admin/retention/preview` | Dry-run: returns counts of records that would be affected without executing            | Super Admin |
| `POST` | `/api/admin/retention/execute` | Manual trigger: runs the retention enforcer immediately (in addition to scheduled run) | Super Admin |
| `GET`  | `/api/admin/retention/logs`    | Returns paginated enforcement logs                                                     | Super Admin |

**Safeguards**:

- The job runs in dry-run mode for the first 30 days after deployment. Dry-run results are emailed to Super Admin. No data is modified until Super Admin explicitly enables live mode.
- Every execution creates a backup snapshot before any modifications.
- If the error rate exceeds 1% (errors / total records processed), the job aborts and alerts Super Admin.
- Records in the 30-day soft-delete grace period can be restored by Super Admin via a "Restore" action on the retention log detail page.

### DSAR Erasure Exception Documentation (GDPR Art. 17)

When a DSAR deletion request cannot be fulfilled, the admin must select one of the following legally recognized exceptions. The selected exception, along with a free-text justification, is stored on the DSAR record. See `docs/tech/COMPLIANCE-MATRIX.md` gap M2.

| Exception Code     | Exception Name                                      | Legal Basis                            | Example                                                                        |
| ------------------ | --------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `legal_obligation` | Legal obligation to retain                          | GDPR Art. 17(3)(b), PIPEDA Principle 5 | Building security records required by municipal bylaw for 7 years              |
| `legal_claims`     | Establishment, exercise, or defense of legal claims | GDPR Art. 17(3)(e)                     | Resident involved in ongoing insurance claim related to a maintenance incident |
| `public_interest`  | Public interest in health                           | GDPR Art. 17(3)(c)                     | Emergency medical information required for building safety                     |
| `archiving`        | Archiving in the public interest                    | GDPR Art. 17(3)(d)                     | Historical building records for heritage property compliance                   |
| `legal_hold`       | Active legal hold                                   | Internal policy                        | Data subject to litigation hold requested by legal counsel                     |

**Denial Response**: When admin denies a DSAR with an exception, the resident receives an email explaining: (1) which data could not be deleted, (2) the legal basis for retention, (3) their right to challenge this decision with the Privacy Commissioner of Canada (PIPEDA) or the relevant Supervisory Authority (GDPR), (4) estimated date when the data will become eligible for deletion.

---

## 13. Completeness Checklist

### Functional Coverage

| Item                                        | Status  | Section        |
| ------------------------------------------- | ------- | -------------- |
| CSV and Excel import with field mapping     | Defined | 3.1.1, 3.1.2   |
| 9 importable data types with templates      | Defined | 3.1.1, 5.1-5.5 |
| 4-stage validation pipeline                 | Defined | 3.1.3          |
| Conflict resolution (skip/overwrite/merge)  | Defined | 3.1.4          |
| Transactional import with rollback          | Defined | 3.1.5          |
| Async processing for large files            | Defined | 3.1.6          |
| Import history and error reports            | Defined | 3.1.7          |
| Personal data export (PIPEDA/GDPR)          | Defined | 3.2.1          |
| Property data export (Excel workbook)       | Defined | 3.2.2          |
| Audit log export with digital signature     | Defined | 3.2.3          |
| Full encrypted property backup              | Defined | 3.2.4          |
| Scheduled automatic exports                 | Defined | 3.2.5          |
| DSAR submission (access and deletion)       | Defined | 3.3.1          |
| DSAR processing with SLA tracking           | Defined | 3.3.2          |
| DSAR for dual-role users (resident + staff) | Defined | 3.3.3          |

### Data Model Coverage

| Item                                         | Status  | Section |
| -------------------------------------------- | ------- | ------- |
| ImportJob with full lifecycle fields         | Defined | 4.1     |
| ImportMapping with transform support         | Defined | 4.2     |
| DataExportRequest with expiry and encryption | Defined | 4.3     |
| DSARRequest with SLA and framework tracking  | Defined | 4.4     |
| ScheduledExport with frequency and retention | Defined | 4.5     |
| FieldMappingTemplate for reusable mappings   | Defined | 4.6     |

### UI/UX Coverage

| Item                                   | Status  | Section  |
| -------------------------------------- | ------- | -------- |
| Import wizard (8-step flow)            | Defined | 6.1, 7.1 |
| Export dashboard with download history | Defined | 7.2      |
| DSAR management with SLA countdown     | Defined | 7.3      |
| Empty states for all screens           | Defined | 7.4      |
| Error states for all failure modes     | Defined | 7.5      |
| Tooltips for complex features          | Defined | 7.6      |

### AI Coverage

| Item                                       | Status  | Section |
| ------------------------------------------ | ------- | ------- |
| Smart field mapping with confidence scores | Defined | 8.1     |
| Import error plain-language assistance     | Defined | 8.2     |
| Post-import data quality report (v2)       | Defined | 8.3     |

### API Coverage

| Item                                             | Status  | Section |
| ------------------------------------------------ | ------- | ------- |
| Import upload, validate, confirm, status, errors | Defined | 11.1    |
| Property export, audit log export, backup        | Defined | 11.2    |
| Personal data export                             | Defined | 11.3    |
| DSAR submit, list, approve, deny                 | Defined | 11.4    |
| Scheduled export CRUD                            | Defined | 11.5    |

---

_Last updated: 2026-03-16_
_Author: Concierge Product Team_
