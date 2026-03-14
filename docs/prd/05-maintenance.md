# 05 — Maintenance / Service Requests

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

The Maintenance module manages every service request in a building -- from a dripping faucet in Unit 1205 to a broken lobby elevator. It is the single place where residents report problems, staff track work, vendors receive assignments, and managers monitor building health.

### Why This Module Exists

Buildings break. When they do, residents need an easy way to report problems, staff need a clear way to track repairs, and managers need visibility into what is open, what is stuck, and what is costing money. Without a centralized system, requests get lost in emails, sticky notes, and verbal hand-offs between shifts.

### Key Facts

| Aspect | Detail |
|--------|--------|
| **URL** | `/maintenance` (listing), `/maintenance/new` (create), `/maintenance/:id` (detail) |
| **Sidebar label** | Service Requests |
| **Sidebar group** | Operations |
| **Badge** | Count of open requests (visible to Property Manager, Maintenance Staff) |
| **v1 scope** | Service request lifecycle, 43 categories, vendor/employee assignment, attachments, work orders, comments |
| **v2 scope** | Equipment tracking, inspection checklists, recurring tasks, vendor compliance dashboard |
| **AI capabilities** | 12 features (IDs 23-34 in the AI Framework) |
| **Reference number format** | `SR-YYYY-NNNNN` (e.g., `SR-2026-00147`) |

### What This Module Does NOT Cover

- **Equipment lifecycle management** -- v2 (see Section 3.11)
- **Inspection checklists** -- v2 (see Section 3.12)
- **Recurring/preventive maintenance scheduling** -- v2 (see Section 3.13)
- **Vendor compliance and insurance tracking** -- v2 (see Section 3.14)
- **Alteration projects** (renovation tracking with permits) -- separate module

---

## 2. Research Summary

### Key Findings That Shaped Decisions

| # | Finding | Decision |
|---|---------|----------|
| 1 | The most basic platform observed had only 2 request types (In Suite Repairs, Service Request) with no photo uploads, no vendor assignment, and no equipment linkage. | Concierge ships with 43 categories across 2 groups (Common Areas and In-Suite), full photo/document attachments, and vendor + employee + equipment linkage from day one. |
| 2 | The most advanced platform observed used a two-column form layout with 20+ fields, including permission-to-enter, high urgency flag, and the ability to create requests in any status (Open, Hold, or Closed). | Concierge adopts the two-column layout. Left column holds problem details; right column holds assignment and logistics. Requests can be created in any initial status. |
| 3 | One platform supported 4000-character descriptions with 1000-character entry instructions, photo attachments (JPG/PNG/BMP/GIF/HEIC at 4MB), and document attachments (PDF/DOC/DOCX/XLS/XLSX at 4MB). | Concierge matches these limits exactly. |
| 4 | One platform had 7 sub-modules under Maintenance: requests, equipment, inspections, vendors, recurring tasks, reports, and search. | Concierge starts with requests in v1 and adds equipment, inspections, recurring tasks, and vendor compliance in v2. Reports live in the Reports module (PRD 10). |
| 5 | The most advanced platform offered inline preview of problem descriptions in the request listing, eliminating the need to click into each request. | Concierge shows a truncated description preview (first 120 characters) beneath each row in the table listing. |
| 6 | One platform had a "Don't show to residents" toggle, allowing staff to create internal-only requests. | Concierge supports a "Hide from resident" toggle on both requests and individual comments. |
| 7 | No platform observed had AI-powered auto-categorization, priority suggestion, duplicate detection, or predictive maintenance. | Concierge integrates 12 AI capabilities (IDs 23-34) as first-class features with graceful manual fallbacks. |

---

## 3. Feature Specification

### 3.1 Service Request Listing Page

**URL**: `/maintenance`

The listing page shows all service requests for the property in a filterable, sortable table with inline description previews.

#### Page Header

| Element | Spec |
|---------|------|
| **Page title** | "Service Requests" -- Display weight, 34px |
| **Primary action** | "New Request" button (Primary style, `--accent` background, white text, 44px height). One per screen. |
| **Secondary actions** | "Export to Excel" (Secondary button), "Print List" (Secondary button) |

**"New Request" button behavior**:
- **On click**: Navigates to `/maintenance/new`
- **Loading state**: Not applicable (navigation)
- **Who sees it**: Property Manager, Property Admin, Super Admin, Maintenance Staff, Resident (Owner), Resident (Tenant). Security Guard and Concierge do not see this button.
- **Tooltip**: "Create a new service request for a unit or common area"

**"Export to Excel" button behavior**:
- **On click**: Generates an `.xlsx` file containing all requests matching the current filters. Download begins immediately. File name: `service-requests-YYYY-MM-DD.xlsx`
- **Loading state**: Button label replaced with spinner. Button disabled. Label returns after download starts.
- **Success state**: Browser download dialog appears
- **Error state**: Toast notification: "Export failed. Please try again." (red, bottom-right, auto-dismiss after 5 seconds)
- **Who sees it**: Property Manager, Property Admin, Super Admin, Board Member
- **Tooltip**: "Download all filtered requests as an Excel spreadsheet"

**"Print List" button behavior**:
- **On click**: Opens browser print dialog with a print-optimized stylesheet applied
- **Loading state**: Not applicable
- **Who sees it**: Property Manager, Property Admin, Super Admin, Maintenance Staff
- **Tooltip**: "Print the current list of service requests"

#### Filters

| Filter | Type | Options | Default | Behavior |
|--------|------|---------|---------|----------|
| **Search** | Text input (44px height) with magnifying glass icon | Free text | Empty | Searches across: reference number, title, description, unit number, resident name, assigned employee name, assigned vendor name. Debounced 300ms. Minimum 2 characters. |
| **Status** | Dropdown with badge count | All, Open, On Hold, Closed | All | Badge shows count of active filters. Selecting a status immediately filters the table. |
| **Category** | Dropdown | All 43 categories (grouped by Common Areas / In-Suite) | All | Filters by maintenance category. |
| **Assigned Employee** | Dropdown | All staff members + "Unassigned" | All | Filters by who is assigned. |
| **Priority** | Dropdown | All, Low, Normal, High, Critical | All | Filters by priority level. |
| **Date Range** | Date range picker (two date inputs) | Start date, End date | Last 30 days | Filters by `created_at` date. |
| **Clear Filters** | Ghost button ("Clear") | -- | -- | Resets all filters to defaults. Only visible when at least one filter is active. |

**Filter error handling**: If no results match the filters, the table shows an empty state: centered illustration + "No service requests match your filters" + "Clear Filters" ghost button.

#### Table Columns

| Column | Width | Sortable | Content | Format |
|--------|-------|----------|---------|--------|
| **Checkbox** | 40px | No | Bulk selection checkbox | 20x20px checkbox |
| **Status** | 100px | Yes | Status badge (color-coded pill) | Open = `--status-info`, On Hold = `--status-warning`, Closed = `--status-success` |
| **ID** | 140px | Yes (default, descending) | Reference number | Monospace font, e.g., `SR-2026-00147` |
| **Unit** | 120px | Yes | Unit number + resident name below | Unit: Headline weight. Name: Caption, `--text-secondary` |
| **Category** | 160px | Yes | Maintenance category | Body weight |
| **Priority** | 100px | Yes | Priority badge | Low = gray, Normal = `--status-info`, High = `--status-warning`, Critical = `--status-error` |
| **Assignee** | 140px | Yes | Assigned employee name | Body weight. "Unassigned" shown in `--text-tertiary` if empty |
| **Requested** | 120px | Yes | Date requested + source label | Date: Body weight. Source: Caption badge ("Resident", "Staff", "AI Draft") |
| **Last Comment** | 120px | Yes | Date of most recent comment | Caption, `--text-secondary`. "None" if no comments |
| **Actions** | 48px | No | `...` icon button | Opens dropdown: View, Edit, Print Work Order, Delete |

**Inline preview**: Below each row, the first 120 characters of the problem description appear in Caption size, `--text-secondary`. This preview is always visible -- no click required.

**Pagination**: Bottom-right. Shows "Showing 1-25 of 342 requests". 25 rows per page default. Page navigation: `< 1 2 3 ... 14 >`.

**Bulk actions**: When one or more checkboxes are selected, a floating action bar appears at the bottom of the screen:
- "Assign to..." (dropdown of employees)
- "Change Status..." (dropdown: Open, On Hold, Closed)
- "Change Priority..." (dropdown: Low, Normal, High, Critical)
- "Export Selected" (generates Excel with selected rows only)
- "x selected" counter + "Deselect All" ghost button

**Row click behavior**: Clicking anywhere on a row (except the checkbox or actions button) navigates to `/maintenance/:id` (detail view).

---

### 3.2 Service Request Create Form

**URL**: `/maintenance/new`

Two-column layout inside the content area (12-column grid). Left column occupies 7 grid columns. Right column occupies 5 grid columns. On screens narrower than 768px, columns stack vertically (left column on top).

A "Back" ghost button (left arrow + "Back to Service Requests") appears above the form title. Clicking it navigates to `/maintenance`.

**Form title**: "New Service Request" -- Title 1, 28px, 700 weight.

#### Left Column -- Problem Details

| # | Field | Label | Type | Required | Max Length | Default | Validation | Error Message | Tooltip |
|---|-------|-------|------|----------|------------|---------|------------|---------------|---------|
| 1 | `building_id` | Building | Dropdown (44px) | Yes | -- | User's primary building | Must select a valid building | "Please select a building" | "The building where this issue is located" |
| 2 | `unit_id` | Unit | Autocomplete search (44px) | No | -- | Empty | Must be a valid unit in the selected building if provided. Typing filters by unit number or resident name. | "Unit not found. Check the unit number and try again." | "Start typing a unit number or resident name. Leave blank for common area requests." |
| 3 | `requested_by` | Requested By | Autocomplete search (44px) | Yes | -- | Logged-in user (if resident); empty (if staff) | Must be a valid resident or staff member | "Please select who is making this request" | "The person reporting this issue. For resident requests, select the resident. For staff-initiated requests, select yourself." |
| 4 | `title` | Title | Text input (44px) | Yes | 200 characters | Empty | Minimum 5 characters. Maximum 200 characters. No special character restrictions. | "Title must be between 5 and 200 characters" | "A brief summary of the issue (e.g., 'Leaking kitchen faucet')" |
| 5 | `description` | Problem Description | Textarea (min 88px, auto-grows to 200px, then scrolls) | No | 4,000 characters | Empty | Maximum 4,000 characters. Character counter appears when 3,600+ characters entered. | "Description cannot exceed 4,000 characters" | "Describe the issue in detail. Include when it started, how severe it is, and any steps you have already tried." |
| 6 | `category_id` | Category | Dropdown (44px) with grouped options | Yes | -- | Empty | Must select a category from the list | "Please select a category" | "Choose the category that best matches the issue. The system may suggest a category based on your description." |
| 7 | `permission_to_enter` | Permission to Enter | Radio group: "Yes" / "No" | Yes | -- | "No" | Must select one option | "Please indicate whether staff may enter the unit" | "Does building staff have permission to enter the unit to inspect or repair the issue?" |
| 8 | `entry_instructions` | Entry Instructions | Textarea (min 88px, auto-grows) | No | 1,000 characters | Empty | Only shown when `permission_to_enter` is "Yes". Maximum 1,000 characters. | "Entry instructions cannot exceed 1,000 characters" | "How should staff access the unit? (e.g., 'Key is under the mat', 'Call before entering', 'Available weekdays 9-5')" |
| 9 | `photo_attachments` | Photos | File upload zone (80px dashed border, drag-and-drop) | No | 10 files max | Empty | Accepted formats: JPG, JPEG, PNG, BMP, GIF, HEIC. Max file size: 4MB per file. Max 10 files total. | "File must be an image (JPG, PNG, BMP, GIF, or HEIC) and under 4MB" | "Upload photos of the issue. Drag and drop files here or click to browse. Maximum 10 photos, 4MB each." |
| 10 | `document_attachments` | Documents | File upload zone (80px dashed border, drag-and-drop) | No | 5 files max | Empty | Accepted formats: PDF, DOC, DOCX, XLS, XLSX. Max file size: 4MB per file. Max 5 files total. | "File must be a document (PDF, DOC, DOCX, XLS, or XLSX) and under 4MB" | "Upload related documents such as warranties, invoices, or previous repair records. Maximum 5 documents, 4MB each." |
| 11 | `hide_from_resident` | Don't show to resident | Toggle (iOS-style, 28x48px) | No | -- | Off (false) | -- | -- | "When enabled, this request is only visible to staff. The resident will not see it in their portal." |

#### Right Column -- Assignment and Logistics

| # | Field | Label | Type | Required | Max Length | Default | Validation | Error Message | Tooltip |
|---|-------|-------|------|----------|------------|---------|------------|---------------|---------|
| 12 | `assigned_employee_id` | Assigned Employee | Dropdown (44px) | No | -- | Empty ("Unassigned") | Must be a valid staff member if selected | "Selected employee not found" | "The staff member responsible for this request. You can assign someone later." |
| 13 | `assigned_vendor_id` | Assigned Vendor | Dropdown (44px) with search | No | -- | Empty ("None") | Must be a valid vendor from the vendor directory if selected | "Selected vendor not found" | "The external vendor or contractor assigned to this job. Vendors must be in the vendor directory first." |
| 14 | `equipment_id` | Linked Equipment | Dropdown (44px) with search | No | -- | Empty ("None") | Must be a valid equipment item if selected. Only available if equipment module is active (v2). | "Selected equipment not found" | "Link this request to a specific piece of equipment (e.g., Elevator #2, HVAC Unit 3A). Available when the equipment module is active." |
| 15 | `date_requested` | Date Requested | Date picker (44px, calendar popover) | Yes | -- | Today's date | Must be a valid date. Cannot be more than 30 days in the past. Cannot be a future date. | "Date must be within the last 30 days and not in the future" | "The date the issue was reported. Defaults to today." |
| 16 | `priority` | Priority | Dropdown (44px) | Yes | -- | "Normal" | Must select one of: Low, Normal, High, Critical | "Please select a priority level" | "How urgent is this request? Critical = safety hazard or building-wide impact. High = significant disruption. Normal = standard repair. Low = cosmetic or non-urgent." |
| 17 | `high_urgency` | High Urgency | Toggle (iOS-style, 28x48px) | No | -- | Off (false) | -- | -- | "Flag this request for immediate attention. High urgency requests appear at the top of every list and trigger an immediate notification to the assigned employee and Property Manager." |
| 18 | `initial_status` | Create with Status | Radio group: "Open" / "On Hold" / "Closed" | Yes | -- | "Open" | Must select one option | "Please select an initial status" | "Set the starting status. Use 'On Hold' if waiting for parts or a vendor. Use 'Closed' if logging a completed repair retroactively." |
| 19 | `hold_until_date` | Hold Until | Date picker (44px) | Conditional | -- | Empty | Only shown when `initial_status` is "On Hold". Must be a future date. | "Hold date must be in the future" | "When should this request come off hold? The system will automatically change the status to Open on this date and notify the assignee." |
| 20 | `closed_date` | Closed Date | Date picker (44px) | Conditional | -- | Today | Only shown when `initial_status` is "Closed". Must not be a future date. | "Closed date cannot be in the future" | "The date the issue was resolved. Used when logging a completed repair retroactively." |
| 21 | `contact_numbers` | Contact Numbers | Text input (44px) | No | 100 characters | Empty | No format enforcement (supports international formats). | "Contact numbers cannot exceed 100 characters" | "Phone numbers where the requester can be reached about this issue." |
| 22 | `email_notifications` | Email Notifications | Email tag input (44px, chips) | No | 5 emails max | Empty | Each entry must be a valid email address. Maximum 5 addresses. | "Please enter a valid email address" | "People to notify when this request is updated. They will receive email notifications for every status change and comment." |
| 23 | `additional_emails` | Additional CC | Email tag input (44px, chips) | No | 5 emails max | Empty | Each entry must be a valid email address. Maximum 5 addresses. | "Please enter a valid email address" | "Additional people to copy on notifications. They receive the same updates as the primary notification list." |
| 24 | `reference_number_external` | External Reference | Text input (44px) | No | 50 characters | Empty | No validation. Free text. | -- | "An optional reference number from an external system, vendor work order, or insurance claim." |
| 25 | `print_work_order` | Print Work Order | Toggle (iOS-style, 28x48px) | No | -- | Off (false) | -- | -- | "When enabled, a printable work order will be generated after saving. The work order includes all request details in a printer-friendly format." |

#### Form Action Buttons

| Button | Style | Position | Behavior |
|--------|-------|----------|----------|
| **Save** | Primary (accent background, white text, 44px) | Bottom-right of form | See below |
| **Save and Add Another** | Secondary (border, 44px) | Left of Save button | See below |
| **Clear** | Ghost (accent text, no border) | Left of Save and Add Another | See below |

**"Save" button behavior**:
- **On click**: Validates all required fields. If valid, creates the request, generates the reference number, sends notifications (if configured), and navigates to the newly created request detail page (`/maintenance/:id`). If `print_work_order` is enabled, opens the print dialog after navigation.
- **Loading state**: Button label replaced with spinner. Button width unchanged. All form inputs disabled. Button text: disabled.
- **Success state**: Toast notification: "Service request SR-2026-00148 created" (green, bottom-right, auto-dismiss 5s). Navigates to detail page.
- **Error state**: Inline validation errors appear beneath each invalid field (red text, Caption size). Page scrolls to the first error. Toast: "Please fix the errors below" (red, bottom-right, auto-dismiss 5s).
- **Duplicate detection (AI)**: Before saving, the system checks for potential duplicate requests (AI capability #25). If duplicates are found, a modal appears: "Similar requests found" with a list of matching requests (reference number, title, status, date). User can click "Create Anyway" (Primary button) or "View Existing" (Ghost button) to open the similar request. If AI is unavailable, the save proceeds without duplicate detection.

**"Save and Add Another" button behavior**:
- Same validation and save logic as "Save"
- **Success state**: Toast notification as above. Form resets to defaults (building and requested-by fields retain their values). Page stays on `/maintenance/new`.

**"Clear" button behavior**:
- **On click**: Confirmation dialog (small modal, 400px): "Clear all fields? You will lose any unsaved changes." Buttons: "Cancel" (Secondary) and "Clear" (Destructive).
- **Success state**: All fields reset to defaults. No toast.

---

### 3.3 Categories (43 Total)

Categories are pre-configured per property. Property Admins can add, rename, reorder, or deactivate categories in Settings. The 43 default categories below are installed for every new property.

#### Common Area Categories (33)

| # | Category Name | Description |
|---|---------------|-------------|
| 1 | Elevator | Elevator malfunction, stuck doors, noise, display issues |
| 2 | Lobby | Lobby furniture, flooring, lighting, signage, doors |
| 3 | Hallway | Hallway lighting, carpet, walls, ceiling, doors |
| 4 | Parking Garage | Garage lighting, gate, drainage, markings, concrete |
| 5 | Loading Dock | Loading dock doors, ramp, lighting, signage |
| 6 | Garbage / Recycling Room | Bins, chute, odor, lighting, signage, pest control |
| 7 | Mail Room | Mailboxes, lighting, parcel lockers, signage |
| 8 | Pool | Pool equipment, water quality, fencing, lighting, furniture |
| 9 | Gym / Fitness Center | Exercise equipment, flooring, mirrors, ventilation, cleaning |
| 10 | Party Room / Event Space | Tables, chairs, kitchen appliances, AV equipment, cleaning |
| 11 | Rooftop / Terrace | Furniture, planters, railings, lighting, drainage |
| 12 | Sauna / Steam Room | Temperature controls, benches, tiles, drainage, ventilation |
| 13 | Laundry Room | Washers, dryers, payment system, lint traps, plumbing |
| 14 | Concierge Desk | Desk equipment, computer, phone, signage, supplies |
| 15 | Security System | Cameras, intercoms, access control, alarm panels, monitors |
| 16 | Fire Safety | Fire extinguishers, sprinklers, alarms, exit signs, fire doors |
| 17 | HVAC (Building) | Building-wide heating, cooling, ventilation, boiler, chiller |
| 18 | Plumbing (Building) | Main water supply, sewer, risers, valves, water heater |
| 19 | Electrical (Building) | Transformers, panels, emergency generator, common lighting |
| 20 | Roof | Membrane, flashing, drains, vents, skylights, antenna |
| 21 | Exterior | Facade, windows (common), awnings, signage, landscaping |
| 22 | Stairwell | Lighting, handrails, doors, paint, floor surface |
| 23 | Storage Locker Area | Locker doors, lighting, ventilation, pest control |
| 24 | Bike Room | Bike racks, lighting, ventilation, access door |
| 25 | Guest Suite | Furniture, linens, appliances, bathroom, cleaning |
| 26 | Meeting Room | Table, chairs, projector, screen, whiteboard, phone |
| 27 | Workshop / Hobby Room | Tools, workbench, ventilation, lighting, storage |
| 28 | Pet Wash Station | Fixtures, drainage, hoses, ventilation, cleaning |
| 29 | Playground | Equipment, surfacing, fencing, lighting, signage |
| 30 | Garden / Courtyard | Plants, irrigation, walkways, benches, lighting |
| 31 | Intercom / Buzzer System | Buzzer panels, wiring, programming, handsets |
| 32 | Building Envelope | Windows (common), caulking, insulation, weather stripping |
| 33 | Other Common Area | Any common area issue not covered by the above categories |

#### In-Suite Categories (10)

| # | Category Name | Description |
|---|---------------|-------------|
| 34 | Plumbing (In-Suite) | Faucets, toilets, sinks, bathtubs, shower, water heater, pipes |
| 35 | Electrical (In-Suite) | Outlets, switches, light fixtures, circuit breaker, wiring |
| 36 | HVAC (In-Suite) | Thermostat, fan coil unit, vents, filters, heat pump |
| 37 | Appliances | Refrigerator, stove, dishwasher, microwave, washer/dryer |
| 38 | Doors / Locks | Entry door, balcony door, closet doors, locks, hinges, weather stripping |
| 39 | Windows (In-Suite) | Window glass, frames, seals, screens, blinds, hardware |
| 40 | Flooring | Hardwood, tile, carpet, vinyl, baseboard, transitions |
| 41 | Walls / Ceiling | Drywall, paint, cracks, water stains, mold, popcorn ceiling |
| 42 | Bathroom | Shower enclosure, caulking, exhaust fan, fixtures, tiles |
| 43 | Other In-Suite | Any in-suite issue not covered by the above categories |

---

### 3.4 Status Workflow

Service requests follow a three-state lifecycle. Each transition is logged in the activity timeline with the user who made the change and a timestamp.

```
┌────────┐     ┌─────────┐     ┌────────┐
│  Open  │────▶│ On Hold │────▶│ Closed │
│        │◀────│         │     │        │
│        │─────────────────────▶│        │
└────────┘     └─────────┘     └────────┘
     ▲               │
     └───────────────┘
     (can reopen from On Hold)

     Closed can be reopened (becomes Open) by Property Manager or above.
```

| Status | Badge Color | Meaning | Who Can Set | Required Fields on Transition |
|--------|-------------|---------|-------------|------------------------------|
| **Open** | `--status-info` (blue pill) | Request is active and awaiting action | Any authorized user | None |
| **On Hold** | `--status-warning` (orange pill) | Request is paused, waiting for parts, vendor, or resident | Property Manager, Maintenance Staff, Property Admin, Super Admin | `hold_until_date` (optional but recommended) and `hold_reason` (text, max 500 chars, required) |
| **Closed** | `--status-success` (green pill) | Request is resolved | Property Manager, Maintenance Staff, Property Admin, Super Admin | `closed_date` (defaults to now), `resolution_notes` (text, max 2000 chars, optional) |

**Automatic transitions**:
- When `hold_until_date` arrives, the system automatically changes status from "On Hold" to "Open" and sends a notification to the assigned employee.
- Requests open for more than 30 days without a comment trigger an automatic reminder notification to the assigned employee and Property Manager. The threshold (30 days) is configurable per property in Settings.

**Reopening a closed request**:
- Only Property Manager, Property Admin, or Super Admin can reopen.
- Reopening changes status to "Open" and logs the reopening in the activity timeline.
- A comment is required when reopening (text, max 2000 chars): "Please explain why this request is being reopened."

---

### 3.5 Service Request Detail Page

**URL**: `/maintenance/:id`

The detail page shows the full request with all fields, comments, attachments, and an activity timeline.

#### Layout

Two-column layout. Left column (8 grid columns): request details + comments. Right column (4 grid columns): assignment, status, metadata, and actions.

#### Left Column

**Request Header**:
- Reference number in monospace (e.g., `SR-2026-00147`) -- Title 3, 20px
- Title -- Title 1, 28px
- Status badge (pill) + Priority badge (pill) + High Urgency flag (red banner: "HIGH URGENCY" if enabled)
- Created by [name] on [date] at [time] -- Caption, `--text-secondary`

**Problem Description**: Full description text -- Body, 15px. If AI capability #34 (Request Description Enhancement) is active, an "Enhanced" badge appears next to the description, and a toggle lets the user switch between the original and enhanced versions.

**Attachments Section**:
- Photos displayed as a thumbnail grid (80x80px thumbnails). Click a thumbnail to open a lightbox viewer (full-screen overlay with left/right navigation arrows, close button, and download button).
- Documents displayed as a list with file icon, file name, file size, and a "Download" ghost button per file.
- "Add Attachment" ghost button to upload additional files after creation.

**Comments and Responses** (see Section 3.7)

**Activity Timeline** (see Section 3.8)

#### Right Column (Sticky Sidebar)

| Section | Content |
|---------|---------|
| **Status Card** | Current status badge. "Change Status" dropdown button. Hold/Close fields appear inline when selected. |
| **Assignment** | Assigned Employee (name + avatar, or "Unassigned"). "Reassign" ghost button opens a dropdown. Assigned Vendor (name, or "None"). "Assign Vendor" ghost button opens a dropdown. |
| **Details** | Category (with icon), Priority (badge), Date Requested, Unit + Resident name (linked to unit file), Permission to Enter (Yes/No + instructions if Yes), Contact Numbers, External Reference. |
| **Linked Equipment** | Equipment name (linked to equipment detail if v2 active), or "None" |
| **Notifications** | List of email addresses receiving updates. "Edit" ghost button to modify. |
| **Actions** | "Print Work Order" (Secondary button), "Delete Request" (Destructive button, requires confirmation). |

**"Delete Request" button behavior**:
- **On click**: Confirmation dialog (small modal): "Delete SR-2026-00147? This action cannot be undone. Type the reference number to confirm." Text input for confirmation. "Cancel" (Secondary) and "Delete" (Destructive, disabled until reference number is typed correctly).
- **Success state**: Toast: "Service request deleted" (green). Navigates to `/maintenance`.
- **Error state**: Toast: "Failed to delete request. Please try again." (red)
- **Who can delete**: Property Admin, Super Admin only. Property Managers can delete if property setting `allow_pm_delete_requests` is enabled (default: disabled).

---

### 3.6 Priority Levels

| Level | Badge Color | Meaning | Example |
|-------|-------------|---------|---------|
| **Low** | Gray pill (`--text-secondary` text, `--bg-secondary` background) | Cosmetic or non-urgent issue. No impact on daily living. | Scuffed paint in hallway, minor carpet stain |
| **Normal** | Blue pill (`--status-info`) | Standard repair needed. Moderate inconvenience. | Dripping faucet, squeaky door, burned-out light |
| **High** | Orange pill (`--status-warning`) | Significant disruption. Requires attention within 24 hours. | No hot water in unit, broken window latch, toilet running constantly |
| **Critical** | Red pill (`--status-error`) | Safety hazard or building-wide impact. Requires immediate action. | Water flooding from ceiling, gas smell, elevator stuck with occupants, power outage |

**AI Priority Suggestion (capability #24)**: When a user submits a request, the AI analyzes the description, unit history, and category to suggest a priority. The suggestion appears as a small chip below the Priority dropdown: "Suggested: High -- [reason]". The user can accept (click the chip) or ignore it and select their own priority.

---

### 3.7 Comments and Responses

Comments are threaded beneath the request description on the detail page. Each comment shows who wrote it, when, and whether it is visible to the resident.

#### Comment Form

| Field | Type | Required | Max Length | Default | Validation | Error Message |
|-------|------|----------|------------|---------|------------|---------------|
| `comment_text` | Textarea (min 88px, auto-grows) | Yes (when submitting) | 2,000 characters | Empty | Minimum 1 character. Maximum 2,000 characters. | "Comment cannot be empty" / "Comment cannot exceed 2,000 characters" |
| `hide_from_resident` | Toggle (iOS-style) | No | -- | Off (false) | -- | -- |
| `response_template` | Dropdown (appears above textarea) | No | -- | "Custom" (freeform) | -- | -- |

**"Post Comment" button behavior**:
- **On click**: Validates comment text. Saves the comment. Sends notifications to all configured email addresses. The comment appears immediately at the top of the comment list (newest first).
- **Loading state**: Button label replaced with spinner. Textarea disabled.
- **Success state**: Comment appears in the list. Textarea clears. Toast: "Comment added" (green, auto-dismiss 3s).
- **Error state**: Toast: "Failed to post comment. Please try again." (red, auto-dismiss 5s). Comment text is preserved in the textarea.

**"Hide from resident" toggle**: When enabled, the comment is only visible to staff roles (Property Manager, Maintenance Staff, Property Admin, Super Admin). Residents and Board Members cannot see it. Hidden comments display a small eye-slash icon and a gray left border.

#### Predefined Response Templates (7)

Staff can select a template from the dropdown above the comment textarea. Selecting a template pre-fills the textarea. The user can edit the text before posting.

| # | Template Name | Template Text |
|---|---------------|---------------|
| 1 | Received and Assigned | "We have received your request and assigned it to [employee_name]. You can expect an update within [X] business days." |
| 2 | Awaiting Parts | "The repair requires parts that have been ordered. We expect them to arrive by [date]. Your request is on hold until then." |
| 3 | Vendor Scheduled | "A vendor has been scheduled to address this issue on [date] between [time_range]. Please ensure access to the unit is available." |
| 4 | Inspection Completed | "Our team has inspected the issue. [Summary of findings]. Next steps: [next_steps]." |
| 5 | Work Completed | "The repair has been completed. Please check the area and let us know if you experience any further issues. We will close this request in [X] days if no response is received." |
| 6 | Unable to Access | "Our team attempted to access the unit but was unable to gain entry. Please contact us at [phone] to schedule a time for the repair." |
| 7 | Request Closed | "This request has been resolved and closed. If the issue recurs, please submit a new request and reference SR-[reference_number]." |

Bracketed values (e.g., `[employee_name]`, `[date]`) are placeholders that the user fills in manually. AI capability #32 (Response Template Generation) can auto-fill these placeholders based on request context when available.

---

### 3.8 Activity Timeline / Audit Log

The activity timeline is a chronological record of every change to the request. It is displayed below the comments section on the detail page. The timeline is immutable -- entries cannot be edited or deleted.

#### Timeline Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | Datetime | When the action occurred. Displayed as relative time ("2 hours ago") with full datetime on hover tooltip. |
| `actor` | User reference | Who performed the action. Displayed as avatar + name. System actions show a gear icon + "System". |
| `action_type` | Enum | One of: created, status_changed, priority_changed, assigned_employee, assigned_vendor, comment_added, attachment_added, category_changed, reopened, edited, deleted_attachment |
| `old_value` | String (nullable) | The previous value (for changes). Displayed with strikethrough. |
| `new_value` | String (nullable) | The new value (for changes). |
| `details` | String (nullable) | Additional context (e.g., hold reason, reopen reason). |

#### Timeline Display

```
─── Activity Timeline ────────────────────────

● Sarah Chen changed status from Open to On Hold
  "Waiting for replacement part from vendor"
  2 hours ago

● System automatically reopened from On Hold
  Hold-until date (Mar 10) reached
  Yesterday at 9:00 AM

● Mike Johnson assigned vendor: ABC Plumbing
  3 days ago

● Jane Doe created this request
  Mar 5, 2026 at 2:30 PM
```

Each entry: circle indicator (8px, `--accent` for human, `--text-tertiary` for system) + Body text + Caption timestamp. Connected by a thin vertical line (1px, `--border-subtle`).

---

### 3.9 Print Work Order

Clicking "Print Work Order" on the detail page or enabling the toggle on the create form generates a printer-friendly version of the request.

#### Work Order Contents

| Section | Fields Included |
|---------|----------------|
| **Header** | Property name, property address, property logo, "WORK ORDER" title, reference number, date printed |
| **Request Details** | Title, description, category, priority, date requested, requested by (name + unit) |
| **Assignment** | Assigned employee name, assigned vendor name, contact numbers |
| **Access** | Permission to enter (Yes/No), entry instructions |
| **Attachments** | Photo thumbnails (small, 4 per row), document file names |
| **Notes** | Blank lined area (8 lines) for handwritten notes by maintenance staff |
| **Signature** | Blank signature line: "Completed by: _____________ Date: _____________" |
| **Footer** | "Generated by Concierge on [datetime]" |

**Print behavior**: Uses `@media print` stylesheet. Hides navigation, sidebar, and interactive elements. Optimized for letter-size paper (8.5 x 11 inches).

---

### 3.10 High Urgency Flag

When the "High Urgency" toggle is enabled on a request:

| Behavior | Detail |
|----------|--------|
| **Visual indicator** | A red banner appears at the top of the request detail page and card: "HIGH URGENCY" in white text on `--status-error` background. |
| **List sorting** | Urgent requests always appear at the top of the listing, regardless of the active sort column. |
| **Notifications** | An immediate push notification and email are sent to the assigned employee AND the Property Manager, regardless of their notification preferences. |
| **Dashboard badge** | The "Open Requests" KPI card on the Property Manager and Maintenance Staff dashboards shows a sub-count: "3 urgent" in red. |
| **Who can set it** | Property Manager, Maintenance Staff, Property Admin, Super Admin. Residents cannot flag requests as high urgency. |

---

### 3.11 v2: Equipment Tracking

Equipment tracking links physical building equipment to maintenance requests, enabling lifecycle management and preventive maintenance.

#### Equipment Entity

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `id` | UUID | Auto | -- | Unique identifier |
| `name` | Varchar | Yes | 200 | Equipment name (e.g., "Elevator #2", "HVAC Unit 3A") |
| `category_id` | FK → EquipmentCategory | Yes | -- | Equipment category |
| `location` | Varchar | No | 200 | Where in the building (e.g., "Mechanical Room B2", "Lobby") |
| `manufacturer` | Varchar | No | 200 | Manufacturer name |
| `model_number` | Varchar | No | 100 | Model/part number |
| `serial_number` | Varchar | No | 100 | Serial number |
| `install_date` | Date | No | -- | When installed |
| `warranty_expiry` | Date | No | -- | Warranty end date |
| `expected_lifespan_years` | Integer | No | -- | Expected lifespan in years |
| `replacement_cost` | Decimal | No | -- | Estimated replacement cost |
| `status` | Enum | Yes | -- | Active, Inactive, Decommissioned |
| `notes` | Text | No | 2000 | General notes |
| `maintenance_requests[]` | Relation | Auto | -- | Linked service requests |
| `documents[]` | Relation | No | -- | Manuals, warranties, invoices |

#### Default Equipment Categories (6)

| Category | Examples |
|----------|----------|
| Electrical | Transformers, panels, generators, lighting systems |
| Fire | Sprinklers, alarm panels, extinguishers, fire pumps |
| Gas | Gas meters, regulators, shut-off valves |
| Mechanical | Elevators, pumps, motors, compressors |
| Roof | Membranes, drains, vents, satellite equipment |
| Valves | Water shut-offs, pressure regulators, backflow preventers |

#### Equipment Replacement Report

A table showing all equipment sorted by expected replacement date, including:
- Equipment name, category, location
- Install date, expected lifespan, calculated replacement year
- Current age vs. expected lifespan (progress bar)
- Estimated replacement cost
- Total replacement cost projection per year

---

### 3.12 v2: Inspection Checklists

Mobile-first inspection system for routine building checks.

| Feature | Detail |
|---------|--------|
| **Schedule inspections** | Set frequency (daily, weekly, monthly, quarterly, annually) per checklist |
| **Custom checklists** | Property Admin creates checklists with named items, pass/fail/N/A options, and photo capture per item |
| **Global checklists** | System provides 6 default checklists: Lobby, Stairwell, Parking Garage, Pool Area, Gym, Rooftop |
| **Completion** | Staff complete inspections on mobile devices. GPS verification confirms the inspector is on-site. |
| **Results** | Each completed inspection generates a report. Failed items automatically create service requests. |
| **History** | Full inspection history per area with trend visualization. |

---

### 3.13 v2: Recurring Tasks

Preventive maintenance scheduling for routine work.

| Feature | Detail |
|---------|--------|
| **Task definition** | Name, description, category, assigned employee, linked equipment |
| **Intervals** | Daily, weekly, bi-weekly, monthly, quarterly, semi-annually, annually, custom (every N days) |
| **Forecast** | A "Tasks Forecast" tab shows all upcoming tasks for the next 90 days in a timeline view |
| **Auto-creation** | When a recurring task is due, the system automatically creates a service request with pre-filled details |
| **Tracking** | Each recurring task tracks: last completed date, next scheduled date, completion rate (%), overdue count |
| **Export** | Export task list and forecast to Excel or PDF |

---

### 3.14 v2: Vendor Compliance Dashboard

A dashboard for tracking vendor insurance and compliance status.

| Feature | Detail |
|---------|--------|
| **5 status cards** | Compliant, Not Compliant, Expiring in 30 Days, Expired, Not Tracking -- each showing a count |
| **Insurance tracking** | Per vendor: liability insurance, workers' compensation, WSIB/WCB certificate. Expiry dates, policy numbers, document uploads. |
| **Auto-alerts** | 60, 30, and 7 days before insurance expiry, the system sends email alerts to the vendor contact and the Property Manager |
| **Compliance blocking** | Optionally, vendors with expired insurance cannot be assigned to new requests (configurable per property) |
| **Vendor directory** | Full vendor list with: name, address, phone, category, compliance status, notes, linked requests count |

---

## 4. Data Model

### 4.1 MaintenanceRequest

```
MaintenanceRequest
├── id (UUID, auto-generated)
├── property_id → Property (required, set from session)
├── reference_number (varchar 20, auto-generated, unique per property, format: SR-YYYY-NNNNN)
├── building_id → Building (required)
├── unit_id → Unit (nullable -- null for common area requests)
├── requested_by → User (required)
├── created_by → User (required, the staff member who entered it)
├── title (varchar 200, required, min 5 chars)
├── description (text, max 4000 chars, nullable)
├── category_id → MaintenanceCategory (required)
├── status (enum: open, on_hold, closed -- default: open)
├── priority (enum: low, normal, high, critical -- default: normal)
├── high_urgency (boolean, default: false)
├── permission_to_enter (boolean, required)
├── entry_instructions (text, max 1000 chars, nullable -- only when permission_to_enter is true)
├── hide_from_resident (boolean, default: false)
├── assigned_employee_id → User (nullable)
├── assigned_vendor_id → Vendor (nullable)
├── equipment_id → Equipment (nullable, v2)
├── date_requested (date, required, default: today)
├── hold_until_date (date, nullable -- only when status is on_hold)
├── hold_reason (text, max 500 chars, nullable -- required when transitioning to on_hold)
├── closed_date (date, nullable -- set when status transitions to closed)
├── resolution_notes (text, max 2000 chars, nullable)
├── contact_numbers (varchar 100, nullable)
├── email_notifications[] (array of email addresses, max 5)
├── additional_emails[] (array of email addresses, max 5)
├── reference_number_external (varchar 50, nullable)
├── print_work_order (boolean, default: false)
├── photo_attachments[] → Attachment (max 10, photo types only)
├── document_attachments[] → Attachment (max 5, document types only)
├── comments[] → MaintenanceComment
├── audit_log[] → AuditEntry (immutable)
├── ai_metadata (JSONB -- AI suggestions, classification scores)
├── created_at (timestamp with timezone, auto)
├── updated_at (timestamp with timezone, auto)
└── deleted_at (timestamp with timezone, nullable -- soft delete)
```

### 4.2 MaintenanceComment

```
MaintenanceComment
├── id (UUID, auto-generated)
├── request_id → MaintenanceRequest (required)
├── author_id → User (required)
├── comment_text (text, max 2000 chars, required)
├── hide_from_resident (boolean, default: false)
├── template_used (varchar 50, nullable -- which template was used, if any)
├── created_at (timestamp with timezone, auto)
└── updated_at (timestamp with timezone, auto)
```

### 4.3 MaintenanceCategory

```
MaintenanceCategory
├── id (UUID, auto-generated)
├── property_id → Property (nullable -- null means system default)
├── name (varchar 100, required)
├── group (enum: common_area, in_suite)
├── description (varchar 500, nullable)
├── icon (varchar 100, icon name reference)
├── sort_order (integer, default: 0)
├── active (boolean, default: true)
├── created_at (timestamp with timezone, auto)
└── updated_at (timestamp with timezone, auto)
```

### 4.4 Attachment

```
Attachment
├── id (UUID, auto-generated)
├── entity_type (enum: maintenance_request, equipment, inspection -- polymorphic)
├── entity_id (UUID, the linked record)
├── file_name (varchar 255, original file name)
├── file_type (enum: photo, document)
├── mime_type (varchar 100, e.g., image/jpeg, application/pdf)
├── file_size_bytes (integer, max 4194304 = 4MB)
├── storage_url (varchar 500, cloud storage path)
├── thumbnail_url (varchar 500, nullable -- generated for photos)
├── uploaded_by → User (required)
├── created_at (timestamp with timezone, auto)
└── deleted_at (timestamp with timezone, nullable -- soft delete)
```

### 4.5 Relationships

```
MaintenanceRequest ──────── belongs to ──────── Property
MaintenanceRequest ──────── belongs to ──────── Building
MaintenanceRequest ──────── optionally belongs to ── Unit
MaintenanceRequest ──────── belongs to ──────── User (requested_by)
MaintenanceRequest ──────── belongs to ──────── User (created_by)
MaintenanceRequest ──────── belongs to ──────── MaintenanceCategory
MaintenanceRequest ──────── optionally belongs to ── User (assigned_employee)
MaintenanceRequest ──────── optionally belongs to ── Vendor (assigned_vendor)
MaintenanceRequest ──────── optionally belongs to ── Equipment (v2)
MaintenanceRequest ──────── has many ─────────── MaintenanceComment
MaintenanceRequest ──────── has many ─────────── Attachment
MaintenanceRequest ──────── has many ─────────── AuditEntry
MaintenanceCategory ─────── belongs to ──────── Property (or system default)
```

---

## 5. User Flows

### 5.1 Resident Submits a Service Request

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Resident clicks "Submit Request" on their dashboard or navigates to Service Requests | Create form opens. Building and "Requested By" are pre-filled with the resident's info. Fields hidden from residents: `hide_from_resident`, `assigned_employee`, `assigned_vendor`, `equipment_id`, `initial_status` (always Open), `high_urgency`, `email_notifications`, `additional_emails`, `print_work_order`. |
| 2 | Resident fills in: Title, Description, Category, Permission to Enter | AI suggests category (capability #23) and priority (capability #24) as the resident types. Suggestions appear as small chips below the respective fields. |
| 3 | Resident uploads photos (optional) | Thumbnails appear in the upload zone. AI analyzes photos for damage assessment (capability #29, if enabled). |
| 4 | Resident clicks "Save" | System validates all fields. If duplicates detected (capability #25), a modal appears showing similar open requests. Resident can proceed or view existing. |
| 5 | Request is saved | Reference number generated (e.g., `SR-2026-00148`). Notification sent to Property Manager. Resident redirected to request detail page. |
| 6 | Resident views request detail | Resident sees: reference number, title, description, status, priority, their comments, staff comments (unless hidden). Resident cannot see: internal notes, assigned vendor details, audit log, hidden comments. |

### 5.2 Property Manager Handles a Request

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Property Manager views the listing page | Requests sorted by priority (critical first) and date. High urgency requests pinned to top with red banner. |
| 2 | PM clicks on a request to view details | Detail page opens. All fields visible. AI suggestions shown (if available): category confidence, priority reasoning, similar past requests, vendor recommendations, cost estimate, time-to-resolution estimate. |
| 3 | PM assigns an employee from the dropdown | Employee receives notification (email + push). Activity timeline records the assignment. |
| 4 | PM optionally assigns a vendor | Vendor receives notification (email only). Activity timeline records the assignment. If vendor compliance module is active (v2), a warning appears if the vendor's insurance is expired. |
| 5 | PM posts a comment using the "Vendor Scheduled" template | Template pre-fills the comment textarea. PM fills in the date and time range. Posts the comment. Resident receives notification (unless comment is hidden). |
| 6 | PM changes status to "Closed" | Closed date defaults to now. Resolution notes field appears (optional). Resident receives a "Request Closed" notification. Activity timeline records the closure. |

### 5.3 Maintenance Staff Completes a Work Order

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Maintenance staff views their dashboard | Dashboard shows assigned requests sorted by priority. Urgent requests highlighted. |
| 2 | Staff clicks "Print Work Order" on a request | Browser print dialog opens with a printer-friendly work order. |
| 3 | Staff completes the repair on-site | -- |
| 4 | Staff returns and adds a comment describing the work done | Comment saved. Photos of completed work can be uploaded as additional attachments. |
| 5 | Staff changes status to "Closed" | Resolution notes added. Status changes. Notifications sent. |

### 5.4 Staff Creates an Internal Request

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Staff clicks "New Request" | Create form opens. |
| 2 | Staff enables "Don't show to resident" toggle | Request will be invisible to residents. |
| 3 | Staff fills in details and saves | Request created. No resident notification sent (since hidden). Only staff notifications are sent. |

---

## 6. UI/UX

### 6.1 Listing Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Service Requests                    New Request  Export  Print  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search requests...   Status ▾   Category ▾   More ▾  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☑  Status  ID            Unit   Category  Priority  ...  │   │
│  │ ── ─────── ──────────── ────── ───────── ───────── ──── │   │
│  │ ☐  ● Open  SR-2026-0148 1205   Plumbing  ● High    ...  │   │
│  │    Leaking kitchen faucet, water dripping from handle... │   │
│  │ ☐  ● Hold  SR-2026-0147 Lobby  Elevator  ● Critical ...  │   │
│  │    Elevator #2 making grinding noise on floors 10-15...  │   │
│  │ ☐  ● Closed SR-2026-0146 302   Appliances ● Normal  ...  │   │
│  │    Dishwasher not draining after cycle completes...       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Showing 1-25 of 342 requests                     ◀ 1 2 3 ... ▶ │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Create Form Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Service Requests                                     │
│                                                                  │
│  New Service Request                                             │
│                                                                  │
│  ┌── Problem Details ──────────┐  ┌── Assignment ────────────┐  │
│  │                              │  │                          │  │
│  │  Building*         [Bond ▾]  │  │  Assigned Employee       │  │
│  │  Unit       [Search unit...] │  │  [Select employee... ▾]  │  │
│  │  Requested By*    [Search..] │  │                          │  │
│  │  Title*           [________] │  │  Assigned Vendor         │  │
│  │  Problem Description         │  │  [Select vendor... ▾]   │  │
│  │  [________________________]  │  │                          │  │
│  │  [________________________]  │  │  Linked Equipment        │  │
│  │  [________________________]  │  │  [Select equipment... ▾] │  │
│  │                              │  │                          │  │
│  │  Category*     [Select... ▾] │  │  Date Requested*         │  │
│  │  AI: Suggested: Plumbing 94% │  │  [Mar 14, 2026      📅] │  │
│  │                              │  │                          │  │
│  │  Permission to Enter*        │  │  Priority*     [Normal▾] │  │
│  │  ○ Yes  ● No                 │  │  AI: Suggested: High     │  │
│  │                              │  │                          │  │
│  │  Photos                      │  │  ☐ High Urgency          │  │
│  │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │  │                          │  │
│  │  │  Drop photos here     │  │  │  Create with Status*     │  │
│  │  │  or click to browse   │  │  │  ● Open ○ Hold ○ Closed  │  │
│  │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │  │                          │  │
│  │                              │  │  Contact Numbers         │  │
│  │  Documents                   │  │  [________________]      │  │
│  │  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │  │                          │  │
│  │  │  Drop documents here  │  │  │  Email Notifications     │  │
│  │  │  or click to browse   │  │  │  [email@example.com  ×]  │  │
│  │  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │  │                          │  │
│  │                              │  │  Additional CC           │  │
│  │  ☐ Don't show to resident   │  │  [________________]      │  │
│  │                              │  │                          │  │
│  └──────────────────────────────┘  │  External Reference      │  │
│                                     │  [________________]      │  │
│                                     │                          │  │
│                                     │  ☐ Print Work Order      │  │
│                                     │                          │  │
│                                     └──────────────────────────┘  │
│                                                                  │
│                          Clear    Save and Add Another    Save ▶  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Detail Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Service Requests                                     │
│                                                                  │
│  SR-2026-00148                                                   │
│  Leaking kitchen faucet                                          │
│  ● Open   ● High   🔴 HIGH URGENCY                              │
│  Created by John Smith (Unit 1205) on Mar 14, 2026 at 2:30 PM   │
│                                                                  │
│  ┌── Left Column (8 cols) ─────┐  ┌── Right Column (4 cols) ─┐ │
│  │                              │  │                          │ │
│  │  Problem Description         │  │  Status                  │ │
│  │  The kitchen faucet has been │  │  ● Open    [Change ▾]    │ │
│  │  dripping steadily for 3     │  │                          │ │
│  │  days. Water pools on the... │  │  Assignment              │ │
│  │                              │  │  Employee: Mike Johnson  │ │
│  │  Photos (3)                  │  │  [Reassign]              │ │
│  │  [thumb] [thumb] [thumb]     │  │  Vendor: ABC Plumbing    │ │
│  │                              │  │  [Change Vendor]         │ │
│  │  Documents (1)               │  │                          │ │
│  │  📄 warranty.pdf  120KB  ⬇   │  │  Details                 │ │
│  │                              │  │  Category: Plumbing      │ │
│  │  ─── Comments ────────────   │  │  Priority: ● High        │ │
│  │                              │  │  Requested: Mar 14, 2026 │ │
│  │  Template: [Custom ▾]        │  │  Unit: 1205 (John Smith) │ │
│  │  [________________________]  │  │  Entry: Yes              │ │
│  │  ☐ Hide from resident        │  │  "Call before entering"  │ │
│  │              [Post Comment]  │  │  Contact: 416-555-0123   │ │
│  │                              │  │                          │ │
│  │  Sarah Chen (PM) • 2h ago    │  │  Actions                 │ │
│  │  "Vendor scheduled for       │  │  [Print Work Order]      │ │
│  │  tomorrow 9-11 AM"           │  │  [Delete Request]        │ │
│  │                              │  │                          │ │
│  │  ─── Activity Timeline ───   │  └──────────────────────────┘ │
│  │                              │                                │
│  │  ● Status: Open → On Hold   │                                │
│  │    Sarah Chen • 2h ago       │                                │
│  │  ● Assigned to Mike Johnson  │                                │
│  │    Sarah Chen • 3h ago       │                                │
│  │  ● Request created           │                                │
│  │    John Smith • Mar 14       │                                │
│  │                              │                                │
│  └──────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (>1280px)** | Full two-column layout. All filters visible. Table shows all columns. |
| **Tablet (768-1280px)** | Two-column form stacks to single column. Table hides "Last Comment" and "Assignee" columns (accessible via row click). Filters collapse into a "Filters" button that opens a slide-over panel. |
| **Mobile (<768px)** | Single column for everything. Table becomes a card list (one card per request showing: status, ID, title, priority, date). Filters in a full-screen slide-over. Create form is full-width single column. |

### 6.5 Empty States

| Scenario | Display |
|----------|---------|
| **No requests exist** | Centered illustration (wrench icon) + "No service requests yet" (Title 2) + "Create your first request to start tracking maintenance issues." (Body, `--text-secondary`) + "New Request" (Primary button) |
| **No results match filters** | Centered illustration (search icon) + "No requests match your filters" (Title 2) + "Try adjusting your search or filters." (Body, `--text-secondary`) + "Clear Filters" (Ghost button) |
| **No comments on a request** | "No comments yet. Add a comment to provide an update." (Body, `--text-secondary`) |
| **No attachments on a request** | "No attachments. Upload photos or documents to support this request." (Body, `--text-secondary`) + "Add Attachment" (Ghost button) |

---

## 7. AI Integration

The Maintenance module integrates 12 AI capabilities (IDs 23-34 from the AI Framework, PRD 19). Each capability has a manual fallback -- the module works fully without AI.

### 7.1 AI Capabilities Summary

| ID | Name | Trigger | What the User Sees | Fallback |
|----|------|---------|---------------------|----------|
| 23 | Request Category Auto-Classification | On submit (after description is entered, debounced 500ms) | A chip below the Category dropdown: "Suggested: [category] ([confidence]%)" with an "Apply" button | User selects category manually from the dropdown |
| 24 | Priority Scoring | On submit (after description + category are set) | A chip below the Priority dropdown: "Suggested: [priority] -- [one-line reason]" with an "Apply" button | User selects priority manually from the dropdown |
| 25 | Duplicate Detection | On save (pre-save check) | A modal: "Similar requests found" listing 1-5 matching requests with reference number, title, status, and similarity percentage. Buttons: "Create Anyway" and "View Existing" | No duplicate check. Request saves immediately. |
| 26 | Vendor Auto-Suggestion | On category assignment (when category and vendor directory both exist) | A suggestion card in the vendor dropdown area: "Recommended: [vendor] -- [reason]" | User selects vendor manually from the dropdown |
| 27 | Time-to-Resolution Estimation | On submit (after category + priority) | A small info card on the detail page right sidebar: "Estimated resolution: [X] days ([confidence]%)" | No estimate shown |
| 28 | Work Order Generation | On "Print Work Order" click | AI enhances the work order with a structured summary, technical notes, and suggested tools/parts | Standard work order with raw field values |
| 29 | Photo-Based Damage Assessment | On photo upload | Below the uploaded photo, a text summary: "AI Assessment: [description of damage/issue visible in the photo]" | No assessment. Photo is stored as-is. |
| 30 | Recurring Issue Detection | Weekly scheduled (Tuesday 3:00 AM) | A "Recurring Issues" card on the Property Manager dashboard showing units or systems with repeated requests. Click opens a detail report. | No automated detection. PM reviews manually. |
| 31 | Cost Estimation | On demand (button on detail page) | An info card: "Estimated cost: $[low] - $[high] based on [N] similar past repairs" | No cost estimate. PM estimates manually. |
| 32 | Response Template Generation | On status change (auto-fills template) | Pre-filled comment text with placeholders resolved using request context (employee name, dates, vendor info) | Generic template text with manual placeholder entry |
| 33 | Equipment Failure Prediction | Weekly scheduled (Wednesday 3:00 AM, v2) | A "Equipment Risk" dashboard card showing equipment items ranked by failure probability | No prediction. Scheduled maintenance only. |
| 34 | Request Description Enhancement | On submit (after description entered) | An "Enhanced" badge on the detail page. Toggle between "Original" and "Enhanced" versions of the description. Enhanced version adds technical clarity. | Original description used as-is. |

### 7.2 AI Display Rules

1. AI suggestions are always non-blocking. The user can ignore every suggestion.
2. Suggestions appear as small chips or cards with a subtle AI indicator icon (sparkle icon, `--text-tertiary`). No "AI-powered" branding.
3. If the AI service is unavailable, the form works identically -- suggestions simply do not appear. No error messages shown to the user.
4. AI confidence scores are shown only when above 70%. Below 70%, no suggestion is made.
5. Every AI suggestion click is tracked for acceptance-rate analytics. Features below 60% acceptance rate are flagged for review.

---

## 8. Analytics

### 8.1 Operational Metrics (What Happened)

| Metric | Calculation | Displayed On |
|--------|-------------|--------------|
| **Open requests** | Count where status = Open | Dashboard KPI card, listing page header |
| **On hold requests** | Count where status = On Hold | Dashboard KPI card |
| **Avg. time to close** | Average (closed_date - created_at) for requests closed in the period | Dashboard KPI card, Reports |
| **Requests by category** | Count grouped by category | Bar chart on dashboard, Reports |
| **Requests by unit** | Count grouped by unit | Reports |
| **Requests by priority** | Count grouped by priority | Pie chart on dashboard, Reports |
| **Requests by status** | Count grouped by status | Reports |
| **Overdue requests** | Count where status = Open AND age > threshold (default 30 days) | Dashboard KPI card (red if > 0) |
| **Requests created per day/week/month** | Count grouped by created_at period | Line chart on dashboard, Reports |

### 8.2 Performance Metrics (How Well)

| Metric | Calculation | Displayed On |
|--------|-------------|--------------|
| **First response time** | Time from creation to first staff comment | Reports |
| **Resolution rate** | (Closed in period / Created in period) x 100 | Dashboard KPI card, Reports |
| **Employee workload** | Count of open requests per assigned employee | Reports, Manager dashboard |
| **Vendor performance** | Avg. resolution time per vendor | Reports |
| **Reopen rate** | (Reopened count / Total closed) x 100 | Reports |
| **SLA compliance** | % of requests closed within priority-based SLA targets | Reports |

### 8.3 AI Insight Metrics

| Metric | Source | Displayed On |
|--------|--------|--------------|
| **Category suggestion acceptance rate** | AI capability #23 tracking | AI dashboard (Super Admin) |
| **Priority suggestion acceptance rate** | AI capability #24 tracking | AI dashboard |
| **Duplicate detection hit rate** | AI capability #25 tracking | AI dashboard |
| **Recurring issue alerts** | AI capability #30 output | Property Manager dashboard card |
| **Cost estimation accuracy** | AI capability #31 vs. actual cost (when tracked) | AI dashboard |
| **Predicted equipment failures** | AI capability #33 output (v2) | Equipment dashboard |

### 8.4 SLA Targets (Configurable per Property)

| Priority | Default Target | Configurable |
|----------|---------------|--------------|
| Critical | 4 hours | Yes, in Settings > Maintenance > SLA |
| High | 24 hours | Yes |
| Normal | 5 business days | Yes |
| Low | 15 business days | Yes |

Requests exceeding their SLA target are flagged as "Overdue" in the listing with a red badge. The Property Manager receives a daily digest of overdue requests.

---

## 9. Notifications

### 9.1 Notification Triggers

| Event | Recipients | Channels | Template |
|-------|------------|----------|----------|
| **Request created (by resident)** | Property Manager, Assigned Employee (if set) | Email, Push | "New service request: [title] from [resident_name] (Unit [unit]). Priority: [priority]." |
| **Request created (by staff)** | Resident (unless hidden) | Email, Push | "A service request has been created for your unit: [title]. Reference: [reference_number]." |
| **Status changed** | Resident (unless hidden), Assigned Employee, Email notification list | Email, Push | "Service request [reference_number] status changed to [new_status]." |
| **Comment added** | Resident (unless comment is hidden), Assigned Employee, Email notification list | Email | "New comment on [reference_number]: [first 100 chars of comment]" |
| **Employee assigned** | Assigned Employee | Email, Push | "You have been assigned to service request [reference_number]: [title]." |
| **Vendor assigned** | Vendor contact email | Email | "You have been assigned to a service request at [property_name]. Reference: [reference_number]. Details: [title]." |
| **High urgency flagged** | Property Manager, Assigned Employee | Email, Push, SMS (if configured) | "URGENT: Service request [reference_number] has been flagged as high urgency. [title]." |
| **Hold expiry reached** | Assigned Employee, Property Manager | Email, Push | "Service request [reference_number] has come off hold and is now Open. Please review." |
| **Overdue reminder** | Assigned Employee, Property Manager | Email | "Reminder: Service request [reference_number] has been open for [N] days without update." |
| **Request closed** | Resident (unless hidden) | Email, Push | "Your service request [reference_number] has been resolved. If the issue persists, please submit a new request." |

### 9.2 Notification Preferences

Residents can configure their maintenance notification preferences in My Account > Email Preferences:

| Setting | Options | Default |
|---------|---------|---------|
| Request status updates | On / Off | On |
| New comments | On / Off | On |
| Preferred channel | Email / Push / Both | Both |

Staff notification preferences are managed by the Property Admin in Settings > Notifications.

### 9.3 Notification Rate Limits

| Rule | Detail |
|------|--------|
| Maximum emails per request per hour | 5 (to prevent spam during rapid updates) |
| Batch digest option | Staff can opt to receive a daily digest (8:00 AM) instead of individual notifications for non-urgent requests |
| Quiet hours | Notifications suppressed 10 PM - 7 AM (except high urgency and critical priority). Configurable per property. |

---

## 10. API

### 10.1 Endpoints

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|------------|
| `GET` | `/api/v1/maintenance` | List all requests (paginated, filterable) | Bearer token | 60/min |
| `GET` | `/api/v1/maintenance/:id` | Get request detail | Bearer token | 120/min |
| `POST` | `/api/v1/maintenance` | Create a new request | Bearer token | 30/min |
| `PATCH` | `/api/v1/maintenance/:id` | Update a request (partial update) | Bearer token | 60/min |
| `DELETE` | `/api/v1/maintenance/:id` | Soft-delete a request | Bearer token | 10/min |
| `POST` | `/api/v1/maintenance/:id/comments` | Add a comment | Bearer token | 30/min |
| `GET` | `/api/v1/maintenance/:id/comments` | List comments for a request | Bearer token | 120/min |
| `POST` | `/api/v1/maintenance/:id/attachments` | Upload an attachment | Bearer token | 20/min |
| `DELETE` | `/api/v1/maintenance/:id/attachments/:attachment_id` | Remove an attachment | Bearer token | 10/min |
| `GET` | `/api/v1/maintenance/:id/audit-log` | Get the activity timeline | Bearer token | 60/min |
| `GET` | `/api/v1/maintenance/export` | Export requests as Excel | Bearer token | 5/min |
| `GET` | `/api/v1/maintenance/categories` | List all categories for the property | Bearer token | 60/min |
| `GET` | `/api/v1/maintenance/:id/work-order` | Generate a printable work order (PDF) | Bearer token | 10/min |
| `POST` | `/api/v1/maintenance/:id/ai/suggest-category` | Get AI category suggestion | Bearer token | 30/min |
| `POST` | `/api/v1/maintenance/:id/ai/suggest-priority` | Get AI priority suggestion | Bearer token | 30/min |
| `POST` | `/api/v1/maintenance/:id/ai/check-duplicates` | Check for duplicate requests | Bearer token | 10/min |
| `POST` | `/api/v1/maintenance/:id/ai/estimate-cost` | Get AI cost estimation | Bearer token | 10/min |

### 10.2 List Endpoint Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | 1 | Page number |
| `per_page` | Integer | 25 | Items per page (max 100) |
| `status` | Enum | all | Filter by status: open, on_hold, closed, all |
| `priority` | Enum | all | Filter by priority: low, normal, high, critical, all |
| `category_id` | UUID | -- | Filter by category |
| `assigned_employee_id` | UUID | -- | Filter by assigned employee |
| `assigned_vendor_id` | UUID | -- | Filter by assigned vendor |
| `unit_id` | UUID | -- | Filter by unit |
| `search` | String | -- | Full-text search across title, description, reference number, unit, resident name |
| `date_from` | Date (ISO 8601) | 30 days ago | Start of date range |
| `date_to` | Date (ISO 8601) | today | End of date range |
| `sort_by` | String | created_at | Sort field: created_at, priority, status, category, assignee, last_comment |
| `sort_dir` | Enum | desc | Sort direction: asc, desc |
| `high_urgency` | Boolean | -- | Filter for high urgency requests only |
| `hide_from_resident` | Boolean | -- | Filter for internal-only requests (staff only) |

### 10.3 Create Request Payload

```json
{
  "building_id": "uuid",
  "unit_id": "uuid | null",
  "requested_by": "uuid",
  "title": "string (5-200 chars, required)",
  "description": "string (0-4000 chars)",
  "category_id": "uuid (required)",
  "permission_to_enter": "boolean (required)",
  "entry_instructions": "string (0-1000 chars, only if permission_to_enter is true)",
  "hide_from_resident": "boolean (default: false)",
  "assigned_employee_id": "uuid | null",
  "assigned_vendor_id": "uuid | null",
  "equipment_id": "uuid | null",
  "date_requested": "date (ISO 8601, required, default: today)",
  "priority": "low | normal | high | critical (default: normal)",
  "high_urgency": "boolean (default: false)",
  "initial_status": "open | on_hold | closed (default: open)",
  "hold_until_date": "date | null (required if initial_status is on_hold)",
  "hold_reason": "string (0-500 chars, required if initial_status is on_hold)",
  "closed_date": "date | null (required if initial_status is closed)",
  "resolution_notes": "string (0-2000 chars)",
  "contact_numbers": "string (0-100 chars)",
  "email_notifications": ["email1@example.com"],
  "additional_emails": ["email2@example.com"],
  "reference_number_external": "string (0-50 chars)",
  "print_work_order": "boolean (default: false)"
}
```

### 10.4 Response Format

All responses follow the standard Concierge API envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 342,
    "total_pages": 14
  },
  "errors": []
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "errors": [
    {
      "field": "title",
      "code": "required",
      "message": "Title must be between 5 and 200 characters"
    }
  ]
}
```

### 10.5 Role-Based API Filtering

The API automatically filters responses based on the authenticated user's role:

| Role | What They See | What Is Filtered Out |
|------|---------------|---------------------|
| Resident (Owner/Tenant) | Own requests only (where requested_by = self OR unit_id = own unit) | Other residents' requests, hidden requests, internal comments, audit log, vendor details |
| Family Member | Own unit's requests (read-only) | Everything filtered from residents, plus cannot create or comment |
| Maintenance Staff | Assigned requests + unassigned requests | Hidden from resident flag (they see all), financial data |
| Concierge / Front Desk | Cannot access maintenance API | -- |
| Security Guard | Cannot access maintenance API | -- |
| Property Manager | All requests for the property | Nothing filtered |
| Board Member | Summary/aggregate data only (for reports) | Individual request details, comments, attachments |
| Property Admin / Super Admin | All requests for the property (or all properties) | Nothing filtered |

---

## 11. Completeness Checklist

### Functional Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 1 | Service request listing with filters, sort, pagination, inline preview | 3.1 | Specified |
| 2 | Two-column create form with 25 fields fully specified | 3.2 | Specified |
| 3 | 43 categories (33 common area + 10 in-suite) listed | 3.3 | Specified |
| 4 | Three-state status workflow (Open, On Hold, Closed) with transition rules | 3.4 | Specified |
| 5 | Photo attachments (JPG/PNG/BMP/GIF/HEIC, 4MB, max 10) | 3.2 (field 9) | Specified |
| 6 | Document attachments (PDF/DOC/DOCX/XLS/XLSX, 4MB, max 5) | 3.2 (field 10) | Specified |
| 7 | Vendor assignment with dropdown | 3.2 (field 13), 5.2 | Specified |
| 8 | Employee assignment with dropdown | 3.2 (field 12), 5.2 | Specified |
| 9 | Equipment linkage (v2) | 3.2 (field 14), 3.11 | Specified |
| 10 | Print work order with contents defined | 3.9 | Specified |
| 11 | 7 predefined response templates | 3.7 | Specified |
| 12 | Comments with hide-from-resident toggle | 3.7 | Specified |
| 13 | Activity timeline / audit log | 3.8 | Specified |
| 14 | High urgency flag with behaviors | 3.10 | Specified |
| 15 | Permission to enter with instructions field | 3.2 (fields 7-8) | Specified |
| 16 | Email notifications configuration | 3.2 (fields 22-23), 9.1 | Specified |
| 17 | Export to Excel | 3.1, 10.1 | Specified |
| 18 | Bulk actions (assign, status change, priority change) | 3.1 | Specified |
| 19 | Role-based access and filtering | 5.x, 10.5 | Specified |
| 20 | Soft delete with confirmation dialog | 3.5 | Specified |

### v2 Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 21 | Equipment tracking with lifecycle management | 3.11 | Specified |
| 22 | Inspection checklists (mobile-first) | 3.12 | Specified |
| 23 | Recurring tasks with forecast | 3.13 | Specified |
| 24 | Vendor compliance dashboard (5-status) | 3.14 | Specified |

### AI Requirements

| # | Capability | AI ID | Section | Status |
|---|------------|-------|---------|--------|
| 25 | Auto-categorization | 23 | 7.1 | Specified |
| 26 | Priority suggestion | 24 | 7.1 | Specified |
| 27 | Duplicate detection | 25 | 7.1 | Specified |
| 28 | Vendor auto-suggestion | 26 | 7.1 | Specified |
| 29 | Time-to-resolution estimation | 27 | 7.1 | Specified |
| 30 | Work order generation | 28 | 7.1 | Specified |
| 31 | Photo-based damage assessment | 29 | 7.1 | Specified |
| 32 | Recurring issue detection | 30 | 7.1 | Specified |
| 33 | Cost estimation | 31 | 7.1 | Specified |
| 34 | Response template generation | 32 | 7.1 | Specified |
| 35 | Equipment failure prediction | 33 | 7.1 | Specified |
| 36 | Request description enhancement | 34 | 7.1 | Specified |

### Design Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 37 | Apple-grade design system compliance | 6.x | Specified |
| 38 | Two-column form layout | 6.2 | Specified |
| 39 | Responsive behavior (desktop, tablet, mobile) | 6.4 | Specified |
| 40 | Empty states for all scenarios | 6.5 | Specified |
| 41 | Role-aware navigation and visibility | 5.x, 10.5 | Specified |
| 42 | Accessible (44px touch targets, label placement, error states) | 6.x, 3.2 | Specified |

### Data Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 43 | MaintenanceRequest entity fully defined | 4.1 | Specified |
| 44 | MaintenanceComment entity fully defined | 4.2 | Specified |
| 45 | MaintenanceCategory entity fully defined | 4.3 | Specified |
| 46 | Attachment entity fully defined | 4.4 | Specified |
| 47 | All relationships mapped | 4.5 | Specified |

### API Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 48 | 17 API endpoints defined | 10.1 | Specified |
| 49 | Query parameters for list endpoint | 10.2 | Specified |
| 50 | Create payload with all fields | 10.3 | Specified |
| 51 | Standard response envelope | 10.4 | Specified |
| 52 | Role-based API filtering | 10.5 | Specified |

### Notification Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 53 | 10 notification triggers defined | 9.1 | Specified |
| 54 | Resident notification preferences | 9.2 | Specified |
| 55 | Rate limits and quiet hours | 9.3 | Specified |

### Analytics Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 56 | 9 operational metrics | 8.1 | Specified |
| 57 | 6 performance metrics | 8.2 | Specified |
| 58 | 6 AI insight metrics | 8.3 | Specified |
| 59 | Configurable SLA targets | 8.4 | Specified |

---

*Total: 59 requirements specified across 11 sections. 690+ lines.*
