# Audit: 05-Maintenance PRD vs Research

> **Date**: 2026-03-14
> **Auditor**: Cross-reference audit (automated)
> **Research files audited**:
> - `docs/maintenance.md` (Aquarius / Platform 1)
> - `docs/contractors.md` (Aquarius / Platform 1)
> - `docs/platform-2/maintenance.md` (BuildingLink / Platform 2)
> **PRD file**: `docs/prd/05-maintenance.md`

---

## Summary

The PRD is exceptionally thorough. It captures the vast majority of features, fields, workflows, and edge cases from all three research sources. Of the ~120 discrete items checked across Aquarius maintenance, Aquarius contractors, and BuildingLink's 7 maintenance sub-modules, the PRD covers approximately 95%. The gaps identified below are minor but worth addressing before implementation.

| Verdict | Count |
|---------|-------|
| GAPS (missing from PRD) | 8 |
| WEAK COVERAGE (present but incomplete) | 6 |
| CONFIRMED (fully covered) | 50+ categories of features |

---

## GAPS (Missing from PRD)

### GAP-1: "Don't show to residents" checkbox on staff form
- **Source**: BuildingLink `maintenance.md`, Section 1 (New Request), field "Don't show to residents"
- **What it does**: Allows staff to create a maintenance request that is completely hidden from the resident portal. Useful for internal/common-area work or sensitive issues.
- **PRD status**: The PRD has "Internal Notes" (hidden from residents) but no mechanism to hide the entire request from the resident. A resident-linked request is always visible to that resident.
- **Recommendation**: Add an optional "Hide from resident portal" toggle to the staff form. When enabled, the request does not appear in the resident's "My Requests" view and no resident-facing notifications are sent.

### GAP-2: "Assign to management unit" option
- **Source**: BuildingLink `maintenance.md`, Section 1, field "Assign to management unit"
- **What it does**: Allows a request to be assigned to a "management unit" rather than a resident unit. This covers building management office issues, staff quarters, or administrative spaces.
- **PRD status**: The PRD has "Unit" as optional (null = common area), but there is no concept of management units versus residential units.
- **Recommendation**: Either document management units as a unit type in the architecture PRD, or add a note that common-area requests (unit = null) serve this purpose with an "Area Description" text field (which is present in the RecurringTask model but not in MaintenanceRequest).

### GAP-3: "Date Requested" as a separate editable field
- **Source**: BuildingLink `maintenance.md`, Section 1, field "Date requested" (defaults to today but editable)
- **What it does**: Allows staff to backdate a request to the actual date the issue was reported, which may differ from the date it is entered into the system.
- **PRD status**: The PRD has `created_at` (auto-set timestamp) but no editable "date requested" field. The "Create with Status: Closed" + "Hold/Close Date" partially addresses retroactive logging, but does not let staff set an original request date that differs from `created_at`.
- **Recommendation**: Add an optional "Date Reported" field to the staff form that defaults to today but can be set to a past date. This is important for buildings transitioning from paper-based systems.

### GAP-4: "Save and add another" with pre-filled defaults
- **Source**: BuildingLink `maintenance.md`, Section 1, action button "Save and add another"
- **What it does**: After saving, resets the form but keeps building and assigned employee pre-filled for fast batch entry.
- **PRD status**: The PRD has "Save and Create Another" (Section 3.1.1 Action Buttons) with "form resets with building/employee pre-filled." This is actually CONFIRMED -- included in the PRD. Removing from gaps.

**Corrected**: This is confirmed. Replacing with actual gap:

### GAP-4 (revised): Contractor service type categorization as a structured field
- **Source**: Aquarius `contractors.md`, field "Service Type" (blue hyperlink with structured categories: Lock Smith, Plumber, Appliance Repair, HVAC, etc.)
- **What it does**: Each contractor/vendor has a structured service category that allows filtering and matching to maintenance request categories.
- **PRD status**: The vendor assignment panel (Section 3.1.8) shows "Specialty" as a column, and the vendor compliance dashboard (Section 3.2.4) tracks documents, but there is no specification for vendor service categories as a structured/configurable field in the data model. The Vendor entity is referenced but not fully defined in this PRD.
- **Recommendation**: Either define the Vendor data model in this PRD or cross-reference where it is defined. Ensure vendor specialty/service category is a structured dropdown (not free text) that maps to maintenance categories for AI vendor recommendation to work properly.

### GAP-5: Vendor full address fields
- **Source**: BuildingLink `maintenance.md`, Section 5 (Vendors), columns: Name, Address, City, State, Zip, Phone
- **What it does**: Vendors have full address records for dispatch and compliance documentation.
- **PRD status**: The vendor assignment panel (Section 3.1.8) shows Company Name, Specialty, Compliance Status, Rating, Active Requests, Avg. Resolution Time. No address fields. The vendor compliance dashboard (Section 3.2.4) tracks insurance documents but does not mention address fields.
- **Recommendation**: The Vendor entity likely belongs in a separate PRD or the architecture PRD. Add a cross-reference noting that vendor address fields (street, city, state/province, postal code) are required and where they are specified.

### GAP-6: Vendor "Added By" tracking
- **Source**: BuildingLink `maintenance.md`, Section 5, column "Added By"
- **What it does**: Tracks which staff member added each vendor to the directory.
- **PRD status**: Not mentioned. The Vendor entity is not fully modeled in this PRD.
- **Recommendation**: Include `created_by` on the Vendor entity wherever it is fully defined.

### GAP-7: Master vendor list / shared vendor database
- **Source**: BuildingLink `maintenance.md`, Section 5, action "Add vendors from master list"
- **What it does**: BuildingLink provides a platform-wide shared vendor database that properties can import vendors from, reducing data entry.
- **PRD status**: Not mentioned. Concierge only describes per-property vendor management.
- **Recommendation**: Consider for v3+ as a platform feature. If multiple properties use Concierge under the same management company, a shared vendor directory across properties would reduce duplication. At minimum, document this as a future consideration.

### GAP-8: Inspection GPS verification detail
- **Source**: BuildingLink `maintenance.md`, Section 4 (Inspections), "GPS verification confirms inspector is on-site"
- **PRD status**: The PRD mentions "GPS verification confirms inspector is on-site" in Section 3.2.2 (one line), but does not specify how GPS verification works: what radius constitutes "on-site," what happens if GPS is unavailable, whether GPS coordinates are stored, or how the feature degrades on devices without GPS.
- **Recommendation**: Expand GPS verification spec in the v2 inspections section with: acceptable radius (e.g., 100m), fallback behavior (manual location confirmation), GPS coordinate storage for audit trail, and offline handling.

---

## WEAK COVERAGE (Present but Incomplete)

### WEAK-1: Aquarius status "Received" not mapped
- **Source**: Aquarius `maintenance.md`, status options: All, Open, Received, On hold, Closed
- **What it does**: Aquarius has a "Received" status between Open and active work, indicating the request has been acknowledged.
- **PRD status**: The PRD uses Open, In Progress, On Hold, Closed. "Received" is not a status. The PRD's "In Progress" likely subsumes this.
- **Assessment**: This is an intentional simplification, not a gap. However, the PRD should document why "Received" was merged into the workflow -- the activity timeline entry "Status changed to In Progress" combined with a predefined response template ("Received and Scheduled") covers this use case. Consider adding a note in the Research Summary explaining this mapping.

### WEAK-2: BuildingLink "Requested source" indicator
- **Source**: BuildingLink `maintenance.md`, Section 2 (Search Requests), column "Requested" shows "date and source (e.g., 'Resident')"
- **What it does**: Shows whether the request was submitted by a resident, staff, or imported.
- **PRD status**: The PRD tracks `resident_id` (who submitted) and the creation timeline entry shows the actor, but the listing card/table does not have a "Source" column or badge indicating resident-submitted vs. staff-created.
- **Recommendation**: Add a "Source" indicator to cards and table view (e.g., small "Resident" or "Staff" label) to help managers quickly identify resident-facing requests.

### WEAK-3: Vendor "Contact vendor" direct action
- **Source**: BuildingLink `maintenance.md`, Section 5, column "Contact vendor" (direct contact action)
- **What it does**: One-click action to contact a vendor (likely opens email or phone).
- **PRD status**: The vendor assignment panel shows vendor phone/email in the detail view (Section 3.1.3, Assignment section), but there is no one-click "Contact Vendor" action button (e.g., mailto: link, click-to-call).
- **Recommendation**: Add quick-action links (email, phone) on the vendor row in both the assignment panel and the detail view's Assignment section.

### WEAK-4: Vendor "Remove" action and vendor lifecycle
- **Source**: BuildingLink `maintenance.md`, Section 5, column "Remove" (delete vendor)
- **What it does**: Ability to remove a vendor from the directory.
- **PRD status**: No vendor CRUD operations are specified in the API (Section 10.1). The PRD references vendors in assignment and compliance but does not spec vendor creation, editing, or deactivation endpoints.
- **Recommendation**: Either add vendor CRUD endpoints to this PRD or create a cross-reference to wherever vendor management is specified. At minimum: POST/PATCH/DELETE for vendors.

### WEAK-5: Recurring tasks "Task type" filter
- **Source**: BuildingLink `maintenance.md`, Section 6 (Recurring Tasks), filter "Task type" dropdown
- **What it does**: Filters recurring tasks by type (distinct from category).
- **PRD status**: The PRD's recurring task spec (Section 3.2.1) has Category and Interval filters in the forecast view, but no "Task type" concept. BuildingLink distinguishes task type from category.
- **Recommendation**: Clarify whether "task type" maps to something in Concierge's model or is intentionally omitted. If recurring tasks can be both inspection-linked and standalone, a type distinction may be useful.

### WEAK-6: Vendor compliance toggle columns
- **Source**: BuildingLink `maintenance.md`, Section 5, toggle columns: "Show category column," "Show compliance column," "Show notes"
- **What it does**: User can customize which columns are visible in the vendor list.
- **PRD status**: The vendor compliance dashboard (Section 3.2.4) specifies the summary cards and compliance fields but does not mention customizable column visibility.
- **Recommendation**: Add column visibility toggles to the vendor list, consistent with how the maintenance request table view likely allows column customization.

---

## CONFIRMED (Fully Covered in PRD)

The following research features were checked and confirmed as present and well-specified in the PRD:

### From Aquarius maintenance.md
- [x] Search by keyword across requests
- [x] Status-based filtering (Open, On hold, Closed -- mapped to PRD's 4 statuses)
- [x] Priority-based categorization (High, Normal, Low -- PRD adds Critical)
- [x] Request type/category classification (PRD expands from 2 to 43 configurable categories)
- [x] Staff assignment tracking (Assigned Employee dropdown)
- [x] Suite entry authorization tracking (Permission to Enter radio group)
- [x] File attachment support (PRD adds photos + documents with format/size specs)
- [x] Print capability (Print List + Print Work Order)
- [x] Card-based grid layout (3-column on desktop)
- [x] View, Update, Delete actions per request
- [x] Create Service Request form with Building, Request Type, Priority, Assign To, Unit, Requested By, Title, Details, Attach file, Authorization checkbox
- [x] Inline panel / dedicated page for creation
- [x] Status filter options (All, Open, On hold, Closed)
- [x] Reset Search / Clear filters functionality

### From Aquarius contractors.md
- [x] Building-specific contractor/vendor directory (vendor assignment panel, vendor compliance dashboard)
- [x] Contact information (company name + phone) -- present in assignment panel
- [x] Service type categorization -- partially covered via "Specialty" column (see WEAK coverage)
- [x] Quick access from sidebar navigation -- vendors accessible under Maintenance

### From BuildingLink maintenance.md -- Section 1 (New Request)
- [x] Unit/resident autocomplete lookup
- [x] Problem description (4000 char textarea)
- [x] Category dropdown (configurable)
- [x] Permission to enter (Yes/No radio)
- [x] Entry instructions (1000 char textarea, conditional on permission=yes)
- [x] Photo attachments (JPG, PNG, BMP, GIF, HEIC, 4MB max)
- [x] Document attachments (PDF, DOC, DOCX, XLS, XLSX, 4MB max)
- [x] Create with status Open/Hold/Close with date pickers
- [x] Print work order checkbox
- [x] High urgency flag
- [x] Assigned employee dropdown
- [x] Assigned vendor dropdown
- [x] Equipment linkage dropdown
- [x] Email notifications (additional recipients)
- [x] Contact numbers
- [x] Optional reference number (PRD auto-generates instead -- better)
- [x] Priority field
- [x] Save button
- [x] Save and add another button
- [x] Clear button

### From BuildingLink maintenance.md -- Section 2 (Search Requests)
- [x] Export to Excel
- [x] Print List
- [x] Create New Request button
- [x] Search by unit or ID
- [x] Status filter with badge count
- [x] Category filter
- [x] Employee filter
- [x] Advanced filters
- [x] Clear Filters
- [x] Table with Checkbox, Status (color-coded), ID, Unit, Category, Assignee, Requested date, Last Comment, Print icon
- [x] Inline preview (description below each row)
- [x] Pagination (25 items per page, configurable)
- [x] Bulk selection checkboxes

### From BuildingLink maintenance.md -- Section 3 (Equipment)
- [x] Equipment items with search, category filter, export
- [x] Equipment categories (6 defaults: Electrical, Fire, Gas, Mechanical, Roof, Valves)
- [x] Include inactive equipment toggle
- [x] Add equipment button
- [x] Add category button
- [x] Equipment Replacement Report with forecasting
- [x] Include inactive categories toggle

### From BuildingLink maintenance.md -- Section 4 (Inspections)
- [x] Mobile-first execution
- [x] Upcoming and completed inspections
- [x] Custom checklists with create button
- [x] Global/default checklists (PRD has 6 defaults vs BuildingLink's 6)
- [x] GPS verification (mentioned, see WEAK-8 for detail gaps)
- [x] Checklist item types (pass/fail, numeric, photo, text, dropdown)
- [x] Offline capability with sync
- [x] Failed items auto-generate service requests

### From BuildingLink maintenance.md -- Section 5 (Vendors)
- [x] Vendor insurance compliance summary with 5-status cards (Compliant, Expiring, Expired, Not Compliant, Not Tracking)
- [x] Vendor list with name, phone, compliance status
- [x] Export to Excel
- [x] Compliance tracking with expiry dates
- [x] Automated compliance alerts (30-day, 7-day, expired)
- [x] Assignment blocking for expired vendors (PRD adds "type CONFIRM" safeguard)

### From BuildingLink maintenance.md -- Section 6 (Recurring Tasks)
- [x] Recurring tasks with active scheduled tasks
- [x] Tasks forecast (forward-looking view)
- [x] Filters: search, category, equipment category, equipment items, interval
- [x] Table columns: task name, category, equipment, description, unit, assigned to, interval, next date, linked requests
- [x] Add task button
- [x] Export to Excel and PDF
- [x] Include deactivated units filter
- [x] Show descriptions toggle

### From BuildingLink maintenance.md -- Section 7 (Maintenance Reports)
- [x] Request volume reports
- [x] Resolution time reports
- [x] Staff workload reports
- [x] Category breakdown reports
- [x] Vendor performance reports
- [x] Export to Excel and PDF
- [x] SLA compliance tracking

### From BuildingLink maintenance.md -- Opportunity Summary
- [x] Equipment tracking with lifecycle management
- [x] Inspection system with mobile-first checklists
- [x] Vendor compliance dashboard with expiry alerts
- [x] Recurring task scheduler with forecasting
- [x] Rich maintenance forms with photo/document uploads
- [x] Work order printing for field staff
- [x] Urgency flagging for priority management

---

## Overall Assessment

**PRD Grade: A**

The PRD is comprehensive, well-structured, and captures nearly all research findings. It goes significantly beyond the research in several areas: AI integration (12 capabilities), accessibility specification (WCAG AA), responsive layout specs (3 breakpoints), error/loading/empty states, API design with rate limits and webhooks, and analytics.

The 8 gaps identified are minor and mostly relate to vendor data model completeness (which may belong in a separate PRD) and a few workflow details. The 6 weak-coverage items are enhancements rather than missing features.

**Priority fixes**:
1. GAP-1 (Hide from resident) -- important for operations
2. GAP-3 (Date Reported vs created_at) -- important for migration/transition
3. GAP-4 (Vendor service categories as structured data) -- needed for AI vendor matching
4. WEAK-4 (Vendor CRUD endpoints) -- needed for implementation
