# 05 — Maintenance

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

The Maintenance module manages the complete lifecycle of building service requests -- from a resident reporting a leaking faucet to a vendor completing the repair and the system logging the resolution. It is the operational backbone for property managers, maintenance staff, and residents.

### Why This Module Exists

Buildings break. Pipes leak, elevators stall, hallway lights burn out. The speed and quality of maintenance response directly affects resident satisfaction, property value, and legal liability. This module replaces paper work orders, email chains, and spreadsheet tracking with a structured, auditable, AI-enhanced workflow.

### Key Facts

| Aspect | Detail |
|--------|--------|
| **URL** | `/maintenance` (listing), `/maintenance/new` (create), `/maintenance/:id` (detail) |
| **Sidebar label** | Service Requests |
| **Sidebar group** | Operations |
| **Badge** | Count of open requests (visible to Property Manager, Maintenance Staff) |
| **v1 scope** | Service request lifecycle, 43 categories, vendor/employee assignment, attachments, work orders, comments |
| **v2 scope** | Equipment tracking, inspection checklists, recurring tasks, vendor compliance dashboard, alteration projects |
| **AI capabilities** | 12 features (IDs 23-34 in the AI Framework) |
| **Reference number format** | `SR-YYYY-NNNNN` (e.g., `SR-2026-00147`) |

### What This Module Does NOT Cover

- **Equipment lifecycle management** -- v2 (see Section 3.2.3)
- **Inspection checklists** -- v2 (see Section 3.2.2)
- **Recurring/preventive maintenance scheduling** -- v2 (see Section 3.2.1)
- **Vendor compliance tracking** -- v2 (see Section 3.2.4)
- **Alteration projects** -- v2 (see Section 3.2.5)
- **Security incidents** -- See PRD 03 (Security Console)
- **Common area cleaning logs** -- See PRD 03 (Security Console, event type)

### Key Metrics

| Metric | Target |
|--------|--------|
| Average time to first response | < 4 hours for high priority |
| Average resolution time | < 48 hours for normal priority |
| Resident satisfaction on closure | > 4.2 / 5.0 |
| Requests with AI-assisted categorization | > 80% |
| Duplicate request prevention rate | > 70% |

---

## 2. Research Summary

### Key Findings from Competitive Analysis

Our research across three industry-leading platforms revealed significant variation in maintenance capabilities:

| Finding | Detail |
|---------|--------|
| **Form depth varies dramatically** | One platform offers a basic 8-field form. Another provides 20+ fields including permission-to-enter, entry instructions, vendor assignment, equipment linkage, and urgency flags. Concierge adopts the richer form with progressive disclosure to avoid overwhelming users. |
| **Equipment and inspections are absent from most** | Only one platform provides equipment tracking, recurring tasks, and mobile-first inspections. These are essential for preventive maintenance -- buildings that only fix things when they break spend 3-5x more over 10 years. |
| **Vendor compliance is rare but critical** | One platform tracks vendor insurance with a 5-status dashboard (compliant, not compliant, expiring, expired, not tracking). This prevents liability exposure from uninsured contractors. |
| **Photo/document uploads are table stakes** | One platform has no attachment support at all. Modern maintenance requires photos of damage, receipts, permits, and work completion evidence. |
| **Work order printing matters** | Field staff and vendors often work without screens. Printable work orders bridge the digital-physical gap. |
| **Category systems should be configurable** | One platform hardcodes 11 categories. Another allows property-level customization. Concierge uses configurable categories because every building has different needs. |
| **Status workflows need flexibility** | The ability to create a request directly in "on hold" or "closed" status (for retroactive logging) was a valuable pattern observed in competitive research. |
| **Recurring tasks with forecasting** | Only one platform provides task forecasting -- showing what maintenance is coming up next week, next month. This transforms reactive maintenance into proactive management. |

### What We Take

- Rich request form with 20+ fields and progressive disclosure
- Equipment lifecycle management with categories and replacement scheduling
- Vendor compliance dashboard with insurance expiry tracking
- Recurring task scheduler with forecast view
- Mobile-first inspections with customizable checklists
- Work order generation (print and PDF)
- Configurable category system managed by property admins

### What We Avoid

- Text-only request descriptions with no attachment support
- Hardcoded, unchangeable category lists
- No equipment tracking or preventive maintenance
- Single-channel notifications (email only)
- No vendor compliance tracking

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Create Service Request

**Who can create**: Property Manager, Property Admin, Super Admin (full form). Residents -- Owner and Tenant (simplified form). Maintenance Staff cannot create requests -- they receive assignments.

##### Staff Form (Full)

| Field | Data Type | Max Length | Required | Default | Validation | Error Message | Tooltip |
|-------|-----------|-----------|----------|---------|------------|---------------|---------|
| Building | dropdown (select) | -- | Yes | Current building | Must select a valid building | "Please select a building" | -- |
| Unit | autocomplete | -- | No | None | Must match an existing unit if provided | "Unit not found. Check the number and try again." | "Leave blank for common area requests" |
| Requested By | autocomplete | -- | Yes | None | Must match an existing resident or "Walk-in" | "Please select who made this request" | "Type a resident name or unit number to search" |
| Title | text | 200 chars | Yes | None | Min 5 characters, no HTML tags | "Title must be between 5 and 200 characters" | -- |
| Description | textarea | 4,000 chars | No | None | None | -- | "Include as much detail as possible: what is broken, where exactly, when it started" |
| Category | dropdown | -- | Yes | AI-suggested (if enabled) | Must select from active categories | "Please select a category" | -- |
| Sub-Category | dropdown | -- | No | None | Options filter based on selected Category | -- | -- |
| Priority | dropdown | -- | Yes | "Normal" | Must be one of: Low, Normal, High, Critical | "Please select a priority level" | -- |
| Urgency Flag | toggle | -- | No | Off | -- | -- | "Urgent requests trigger immediate notifications to the property manager and assigned staff. Use for active water leaks, security hazards, or loss of essential services." |
| Permission to Enter | radio group | -- | Yes (if unit selected) | "Not Applicable" | Must select one of: Yes, No, Not Applicable | "Please indicate if staff can enter the unit" | "Does the resident allow maintenance staff to enter their unit without the resident being present?" |
| Entry Instructions | textarea | 1,000 chars | No (shown only if Permission = Yes) | None | None | -- | "Include lockbox codes, pet warnings, alarm info, or preferred entry times" |
| Assigned Employee | dropdown | -- | No | None | Must be an active staff member | "Selected staff member is no longer active" | -- |
| Assigned Vendor | dropdown | -- | No | None | Must be an active vendor | "Selected vendor is no longer active" | -- |
| Equipment | dropdown | -- | No | None | Must be active equipment for the selected building | "Equipment not found in this building" | "Link this request to specific building equipment to build maintenance history" |
| Contact Numbers | text | 100 chars | No | None | Phone format validation (digits, spaces, dashes, parentheses, +) | "Please enter a valid phone number" | -- |
| Email Notifications | email chips | -- | No | Submitter's email | Valid email format per chip | "Please enter a valid email address" | "Additional people to notify about updates" |
| Photo Attachments | file upload (drag-drop) | 4 MB each, max 10 files | No | None | JPG, JPEG, PNG, BMP, GIF, HEIC only | "File must be an image (JPG, PNG, GIF, HEIC) under 4 MB" | -- |
| Documents | file upload (drag-drop) | 4 MB each, max 5 files | No | None | PDF, DOC, DOCX, XLS, XLSX only | "File must be a document (PDF, DOC, XLS) under 4 MB" | -- |
| Create with Status | radio group | -- | No | "Open" | One of: Open, On Hold, Closed | -- | "Use On Hold or Closed to log past requests retroactively" |
| Hold/Close Date | date picker | -- | Yes (if status is On Hold or Closed) | Today | Cannot be in the future | "Date cannot be in the future" | -- |
| Print Work Order | checkbox | -- | No | Off | -- | -- | "Generate a printable PDF work order with all request details" |
| Internal Notes | textarea | 2,000 chars | No | None | Not visible to residents | -- | "Staff-only notes. Residents will never see these." |
| Scheduled Date | date picker | -- | No | None | Must be today or later | "Scheduled date cannot be in the past" | -- |

##### Resident Form (Simplified)

Residents see a streamlined form. Staff-only fields (assignment, equipment, internal notes, work order, create-with-status) are hidden entirely -- not greyed out, not disabled, absent.

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| Title | text | 200 chars | Yes | None | Min 5 characters | "Please describe your issue in at least 5 characters" |
| Description | textarea | 4,000 chars | Yes | None | Min 20 characters | "Please provide more detail so we can help you (at least 20 characters)" |
| Category | dropdown | -- | Yes | AI-suggested | Must select from active categories | "Please select a category" |
| Priority | dropdown | -- | No | "Normal" | Low, Normal, High (Critical hidden from residents) | "Please select a priority" |
| Permission to Enter | radio group | -- | Yes | None | Yes or No (Not Applicable hidden) | "Please let us know if staff can enter your unit" |
| Entry Instructions | textarea | 1,000 chars | No | None | Shown only if Permission = Yes | -- |
| Photos | file upload (drag-drop + camera on mobile) | 4 MB each, max 5 | No | None | Image formats only | "File must be an image under 4 MB" |
| Contact Number | text | 20 chars | No | Profile phone number | Phone format | "Please enter a valid phone number" |
| Authorization Checkbox | checkbox | -- | Yes | Off | Must be checked to submit | "Please confirm the information is accurate" |

##### Action Buttons

| Button | Label | Who Sees | Action | Loading State | Success State | Failure State |
|--------|-------|----------|--------|---------------|---------------|---------------|
| Primary | "Submit Request" | All | Saves request, generates reference number, sends notifications | Button disabled + spinner + "Submitting..." | Green toast: "Request SR-2026-XXXXX created successfully" + redirect to detail page | Red toast: "Failed to create request. Please try again." Form data preserved, no fields cleared. |
| Secondary | "Save and Create Another" | Staff only | Saves and clears form for next entry | Button disabled + spinner + "Saving..." | Green toast: "Request SR-2026-XXXXX created" + form resets with building/employee pre-filled | Red toast: "Failed to create request." Form data preserved. |
| Tertiary | "Clear" | Staff only | Resets all fields to defaults | Instant (no loading) | All fields reset, focus moves to first field | -- |
| Tertiary | "Cancel" | All | Returns to request list without saving | Instant | Navigate back to listing page | -- |

#### 3.1.2 Request Listing and Search

##### Filters

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Search | text input with search icon | Searches title, description, reference number, unit number, resident name | Empty |
| Status | multi-select dropdown with badge count | Open, In Progress, On Hold, Closed | Open, In Progress |
| Category | dropdown | All active categories + "All" | All |
| Priority | multi-select chips | Low, Normal, High, Critical | All |
| Assigned Employee | dropdown | All active staff + "Unassigned" + "All" | All |
| Assigned Vendor | dropdown | All active vendors + "None" + "All" | All |
| Date Range | date range picker | From / To dates | Last 30 days |
| Has Urgency Flag | toggle | Yes / No / All | All |
| Sort By | dropdown | Newest First, Oldest First, Priority (High-Low), Priority (Low-High), Last Updated | Newest First |

**Reset Filters**: A "Clear all filters" link appears when any filter is non-default. Clicking resets all to defaults instantly.

##### Listing Views

| View | Layout | Best For | Toggle Location |
|------|--------|----------|----------------|
| **Card View** (default) | 3-column grid (desktop), 2-column (tablet), 1-column (mobile) | Visual scanning, seeing status at a glance | Icon toggle in top-right of listing area |
| **Table View** | Sortable columns with inline description preview below each row | Bulk management, exporting, sorting | Icon toggle in top-right of listing area |

##### Card Contents

Each card displays:

| Element | Position | Detail |
|---------|----------|--------|
| Status Badge | Top-left | Color-coded pill |
| Priority Badge | Top-right | Color-coded pill |
| Urgency Icon | Top-right (before priority) | Red flame icon, only if urgency flag set |
| Reference Number | Below badges | Monospace font, e.g., "SR-2026-00089" |
| Title | Below reference | Truncated at 60 characters with ellipsis |
| Unit + Resident | Below title | "Unit 1205 -- Sarah Chen" or "Common Area" |
| Category | Below unit | Category name with icon |
| Assigned To | Bottom-left | Employee name or "Unassigned" (gray italic) |
| Created Date | Bottom-right | Relative time (e.g., "2 hours ago", "3 days ago") |
| Attachment Icon | Bottom, near date | Paperclip icon + count, only if attachments exist |

**Color coding for status**:

| Status | Badge Color | Hex | Text Color |
|--------|-------------|-----|------------|
| Open | Blue | `#2563EB` | White |
| In Progress | Amber | `#D97706` | White |
| On Hold | Gray | `#6B7280` | White |
| Closed | Green | `#059669` | White |

**Color coding for priority**:

| Priority | Badge Color | Hex | Text Color |
|----------|-------------|-----|------------|
| Low | Gray | `#9CA3AF` | White |
| Normal | Blue | `#3B82F6` | White |
| High | Orange | `#F97316` | White |
| Critical | Red | `#EF4444` | White |

##### Table View Columns

| Column | Sortable | Width |
|--------|----------|-------|
| Checkbox (bulk select) | No | 40px |
| Status | Yes | 100px |
| Reference # | Yes | 140px |
| Title | No | Flexible |
| Unit | Yes | 80px |
| Category | Yes | 150px |
| Priority | Yes | 90px |
| Assigned To | Yes | 140px |
| Created | Yes | 100px |
| Last Updated | Yes | 100px |

Clicking a row expands an inline preview showing the description (first 200 characters).

##### Bulk Actions (Table View Only)

| Action | Description | Confirmation Required |
|--------|-------------|----------------------|
| Change Status | Set status for all selected requests | Yes -- "Change status of [N] requests to [status]?" with [Confirm] and [Cancel] |
| Assign Employee | Assign a staff member to all selected | Yes -- "Assign [name] to [N] requests?" |
| Assign Vendor | Assign a vendor to all selected | Yes -- "Assign [vendor] to [N] requests?" |
| Change Priority | Update priority for all selected | Yes -- "Change priority of [N] requests to [priority]?" |
| Export Selected | Export selected rows to Excel or PDF | No confirmation needed |
| Print Work Orders | Generate work orders for all selected | No confirmation needed |

##### Top Bar Actions

| Button | Label | Icon | Action | Loading | Success | Failure |
|--------|-------|------|--------|---------|---------|---------|
| Primary | "Create Request" | Plus icon | Navigate to creation form | -- | -- | -- |
| Secondary | "Export to Excel" | Spreadsheet icon | Downloads filtered results as .xlsx | Spinner on button + "Exporting..." | Browser download starts | Toast: "Export failed. Try again." |
| Secondary | "Export to PDF" | PDF icon | Downloads filtered results as PDF | Spinner on button + "Exporting..." | Browser download starts | Toast: "Export failed. Try again." |
| Secondary | "Print List" | Printer icon | Opens browser print dialog with optimized print stylesheet | -- | Print dialog opens | -- |

##### Pagination

| Setting | Default | Options |
|---------|---------|---------|
| Items per page | 25 | 10, 25, 50, 100 |
| Navigation | Page numbers + Previous/Next arrows | -- |
| Showing indicator | "Showing 1-25 of 147 requests" | -- |

##### Empty States

**When no requests exist (staff view)**:
- Illustration: Simple line drawing of a wrench and clipboard
- Heading: "No service requests yet"
- Body: "When residents or staff create service requests, they will appear here."
- CTA Button: "Create First Request" (primary button)

**When no requests exist (resident view)**:
- Illustration: Simple line drawing of a toolbox
- Heading: "You don't have any service requests"
- Body: "Need something fixed? Submit a request and we'll take care of it."
- CTA Button: "Submit a Request" (primary button)

**When no requests exist (maintenance staff view)**:
- Illustration: Simple line drawing of a checkmark
- Heading: "No requests assigned to you"
- Body: "When a manager assigns a request to you, it will appear here."
- CTA: None (they cannot create requests)

**When filters return no results**:
- Heading: "No requests match your filters"
- Body: "Try adjusting your filters or clearing them to see all requests."
- Link: "Clear all filters" (resets to defaults)

##### Loading State

Skeleton cards matching the card layout: gray pulsing rectangles for each field position. Show 6 skeleton cards (2 rows of 3 on desktop).

##### Error State

Full-page error with illustration:
- Heading: "Unable to load requests"
- Body: "Check your internet connection and try again."
- CTA Button: "Retry" (primary button, triggers reload)

#### 3.1.3 Request Detail View

##### Header Section

| Element | Description |
|---------|-------------|
| Back Link | "< Back to Service Requests" (navigates to listing, preserves filters) |
| Reference Number | "SR-2026-00089" (large, monospace font, 20px) |
| Title | Request title (h2, 24px) |
| Status Badge | Color-coded current status pill |
| Priority Badge | Color-coded priority level pill |
| Urgency Banner | Full-width red banner if urgency flag set: "URGENT -- This request has been flagged as urgent" |
| Created Date | "Created Mar 14, 2026 at 2:30 PM by Sarah Chen" |

##### Detail Sections (Progressive Disclosure)

Sections expand and collapse. On desktop, the first 3 sections are expanded by default. On mobile, only the first section is expanded.

| Section | Always Visible | Expandable Content |
|---------|---------------|-------------------|
| **Request Information** | Title, Description, Category, Status, Priority | Sub-category, Contact Numbers, Scheduled Date, Created/Updated timestamps |
| **Unit and Resident** | Unit number, Resident name, Permission to enter | Entry instructions, Resident phone/email, Emergency contacts link, Unit front desk instructions |
| **Assignment** | Assigned Employee, Assigned Vendor | Employee phone/email, Vendor phone/email/address, Vendor compliance status badge |
| **Equipment** (if linked) | Equipment name, Category | Serial number, Location, Last service date, Total requests against this equipment, Status |
| **Attachments** | Photo thumbnail grid (3-column), Document list with icons | Full-size photo lightbox (swipeable), Document download links with file size |
| **Activity Timeline** | Last 5 entries | Full timeline with all entries (lazy-loaded in batches of 20) |
| **AI Insights** (if any AI features active) | Category/priority suggestions, Resolution time estimate | Duplicate detection results, Vendor recommendation, Cost estimate, Description enhancement |
| **Internal Notes** (staff only) | Notes content | Edit button to update notes |

##### Action Buttons (Detail View)

| Button | Label | Who Sees It | Action | Loading State | Success State | Failure State |
|--------|-------|-------------|--------|---------------|---------------|---------------|
| Primary | "Update Status" | PM, Admin, Maintenance Staff | Opens status change dialog | -- | -- | -- |
| Secondary | "Assign" | PM, Admin | Opens assignment panel (employee + vendor dropdowns) | -- | -- | -- |
| Secondary | "Print Work Order" | PM, Admin, Maintenance Staff | Generates and opens printable work order | Button disabled + "Generating..." | New tab opens with PDF | Toast: "Failed to generate work order. Try again." |
| Secondary | "Add Comment" | PM, Admin, Maintenance Staff, Resident (own request) | Expands comment input area below timeline | -- | -- | -- |
| Secondary | "Upload Files" | PM, Admin, Maintenance Staff, Resident (own request) | Opens file upload area | -- | -- | -- |
| Danger | "Delete" | Admin only | Confirmation dialog (see below) | Spinner in dialog + "Deleting..." | Toast: "Request deleted" + redirect to list | Toast: "Failed to delete request" |

**Delete Confirmation Dialog**:
- Heading: "Delete Service Request?"
- Body: "This will permanently delete request SR-2026-XXXXX and all associated comments, attachments, and history. This action cannot be undone."
- Buttons: "Delete Permanently" (red) | "Cancel" (gray)

##### Status Change Dialog

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| New Status | radio group: Open, In Progress, On Hold, Closed | Required | Current status pre-selected and disabled |
| Reason (if On Hold) | textarea, 500 chars | Required when selecting On Hold | "Why is this request being placed on hold?" |
| Resolution Notes (if Closed) | textarea, 2,000 chars | Required when closing | "Describe what was done to resolve this request" |
| Notify Resident | checkbox | -- | Default: On. Tooltip: "Send an update to the resident about this status change" |
| Predefined Response | dropdown | -- | Property-configured templates filter by applicable status |
| Custom Message | textarea, 1,000 chars | -- | Optional additional message appended to the notification |

**Status Change Button States**:
| State | Display |
|-------|---------|
| Loading | "Updating..." with spinner, dialog stays open |
| Success | Dialog closes, toast: "Status updated to [new status]", detail page refreshes |
| Failure | Dialog stays open, inline error: "Failed to update status. Please try again." |

#### 3.1.4 Activity Timeline

Every action on a request is logged with a timestamp, actor, and description. This creates an immutable audit trail that cannot be edited or deleted.

| Event Type | Icon | Display Text |
|------------|------|-------------|
| Created | Plus circle | "[User] created this request" |
| Status Changed | Arrow circle | "[User] changed status from [old] to [new]" + reason if provided |
| Assigned | User plus | "[User] assigned this request to [assignee]" |
| Unassigned | User minus | "[User] removed [assignee] from this request" |
| Comment Added | Chat bubble | "[User] commented: [first 100 chars]" with "Show more" link |
| Comment (internal) | Lock icon | "[User] added internal note" (staff only, hidden from residents) |
| Photo Added | Camera | "[User] added [N] photo(s)" with thumbnails inline |
| Document Added | Paperclip | "[User] added document: [filename]" |
| Priority Changed | Flag | "[User] changed priority from [old] to [new]" |
| Category Changed | Tag | "[User] changed category from [old] to [new]" |
| Urgency Set | Flame | "[User] flagged this request as urgent" |
| Urgency Removed | Flame (strikethrough) | "[User] removed urgency flag" |
| Notification Sent | Bell | "Notification sent to [recipient] via [channel]" |
| Work Order Printed | Printer | "[User] generated a work order" |
| AI Suggestion | Sparkle | "AI suggested category: [category] ([X]%)" |
| Scheduled Date Set | Calendar | "[User] scheduled visit for [date]" |

Timeline entries show:
- Relative time ("2 hours ago") with full timestamp on hover
- User avatar (small, 24px circle)
- Color-coded left border matching event type

#### 3.1.5 Maintenance Categories

Categories are configurable per property. A default set of 43 categories is pre-loaded when a property is created. Property Admins can add, edit, deactivate, and reorder categories at Settings > Maintenance > Categories.

##### Default Category Set (43 Categories)

| # | Category | Example Requests |
|---|----------|-----------------|
| 1 | Plumbing -- Leak | Dripping faucet, pipe leak, toilet running |
| 2 | Plumbing -- Drain/Clog | Clogged sink, slow drain, backed-up toilet |
| 3 | Plumbing -- Water Heater | No hot water, temperature issues |
| 4 | Electrical -- Lighting | Burnt-out bulbs, flickering lights, ballast replacement |
| 5 | Electrical -- Outlets/Switches | Dead outlet, broken switch, sparking |
| 6 | Electrical -- Circuit/Panel | Tripped breaker, panel issues |
| 7 | HVAC -- Heating | No heat, radiator noise, thermostat malfunction |
| 8 | HVAC -- Cooling | No AC, temperature issues, condensation |
| 9 | HVAC -- Ventilation | Exhaust fan, duct cleaning, air quality |
| 10 | Appliance -- Dishwasher | Not draining, not cleaning, leaking |
| 11 | Appliance -- Refrigerator | Not cooling, ice maker, noise |
| 12 | Appliance -- Stove/Oven | Not heating, burner issues, display |
| 13 | Appliance -- Washer/Dryer | Not spinning, leaking, not drying |
| 14 | Appliance -- Microwave | Not heating, turntable, display |
| 15 | Appliance -- Garbage Disposal | Jammed, not working, leaking |
| 16 | Door/Lock -- Entry Door | Lock broken, door not closing, hinges |
| 17 | Door/Lock -- Interior Door | Closet door, bathroom door, sliding door |
| 18 | Door/Lock -- Balcony/Patio | Sliding door track, screen door, weather seal |
| 19 | Window -- Glass | Cracked, broken, foggy between panes |
| 20 | Window -- Hardware | Latch broken, won't open/close, screen torn |
| 21 | Flooring -- Hardwood | Scratches, buckling, squeaking |
| 22 | Flooring -- Tile | Cracked tile, loose tile, grout repair |
| 23 | Flooring -- Carpet | Stain, tear, coming loose |
| 24 | Walls/Ceiling -- Paint | Peeling, stains, touch-up needed |
| 25 | Walls/Ceiling -- Drywall | Hole, crack, water damage |
| 26 | Walls/Ceiling -- Mold/Mildew | Visible mold, musty smell |
| 27 | Bathroom -- Toilet | Won't flush, running, loose |
| 28 | Bathroom -- Shower/Tub | Caulking, drain, showerhead, tiles |
| 29 | Bathroom -- Exhaust Fan | Not working, noisy, weak suction |
| 30 | Kitchen -- Countertop | Chip, crack, stain, loose edge |
| 31 | Kitchen -- Cabinets | Door off hinge, shelf broken, handle loose |
| 32 | Pest Control | Ants, roaches, mice, bedbugs |
| 33 | Common Area -- Hallway | Lighting, carpet, paint, damage |
| 34 | Common Area -- Lobby | Furniture, lighting, flooring |
| 35 | Common Area -- Elevator | Malfunction, noise, stuck between floors |
| 36 | Common Area -- Stairwell | Lighting, railing, cleaning |
| 37 | Common Area -- Laundry Room | Machine out of order, payment system |
| 38 | Common Area -- Gym/Fitness | Equipment broken, cleaning, ventilation |
| 39 | Common Area -- Pool/Sauna | Temperature, equipment, cleaning |
| 40 | Parking/Garage -- Gate/Door | Opener, sensor, motor |
| 41 | Parking/Garage -- Lighting | Burnt-out fixture, motion sensor |
| 42 | Exterior -- Landscaping | Tree trimming, irrigation, walkway repair |
| 43 | General/Other | Anything not covered above |

##### Category Configuration Fields

| Field | Data Type | Max Length | Required | Description |
|-------|-----------|-----------|----------|-------------|
| Name | text | 100 chars | Yes | Display name of the category |
| Icon | icon picker | -- | No | Icon displayed on cards and forms |
| Color | color picker | -- | No | Accent color for the category |
| Sub-Categories | text array | 100 chars each, max 20 | No | Optional sub-categories |
| Default Priority | dropdown | -- | No | Auto-set priority when this category is selected |
| Default Assignee | dropdown | -- | No | Auto-assign to this staff member |
| Active | toggle | -- | Yes | Whether this category appears in dropdowns |
| Sort Order | number (integer) | -- | Yes | Display position in dropdowns (lower = higher) |

#### 3.1.6 Predefined Response Templates

Property managers create reusable response templates for common status updates. Accessible at Settings > Maintenance > Response Templates.

| Field | Data Type | Max Length | Required | Validation | Error Message |
|-------|-----------|-----------|----------|------------|---------------|
| Template Name | text | 100 chars | Yes | Min 3 chars, unique per property | "Template name must be unique and at least 3 characters" |
| Template Body | textarea (rich text) | 2,000 chars | Yes | Min 10 chars. Supports placeholders: `[DATE]`, `[VENDOR]`, `[EMPLOYEE]`, `[RESIDENT]`, `[UNIT]`, `[REF]` | "Template body must be at least 10 characters" |
| Applicable Statuses | multi-select | -- | Yes | At least one status selected | "Select at least one status this template applies to" |
| Active | toggle | -- | Yes | -- | -- |

**Default Templates** (pre-loaded, editable):

| Name | Applicable Status | Body |
|------|-------------------|------|
| Received and Scheduled | In Progress | "We have received your request and scheduled a visit for [DATE]. Our team will contact you to confirm access to your unit." |
| Awaiting Parts | On Hold | "Your request is on hold while we wait for replacement parts. We expect delivery by [DATE] and will resume work promptly." |
| Completed Successfully | Closed | "The repair has been completed by [EMPLOYEE]. If you experience any further issues, please submit a new request." |
| Unable to Access Unit | On Hold | "Our team visited but was unable to access your unit. Please confirm your availability and entry instructions so we can reschedule." |
| Vendor Scheduled | In Progress | "We have assigned [VENDOR] to handle your request. They will contact you directly to schedule a visit." |
| Requires Board Approval | On Hold | "This request requires approval from the board of directors. We will update you once a decision is made." |

#### 3.1.7 Work Order Generation

A printable work order can be generated from any service request. The work order is a PDF document formatted for A4 or Letter paper (configurable per property at Settings > Maintenance > Work Order Format).

##### Work Order Layout

| Section | Fields |
|---------|--------|
| Header | Property name, Property logo, "WORK ORDER" title, Reference number (large), Date generated, Page number |
| Request Summary | Title, Description (full), Category, Sub-category, Priority, Urgency flag |
| Unit Information | Unit number, Building, Floor, Resident name, Contact phone, Contact email |
| Access Details | Permission to enter (Yes/No), Entry instructions (full text, highlighted box) |
| Assignment | Assigned employee name + phone, Assigned vendor name + phone, Scheduled date |
| Equipment | Equipment name, Serial number, Location, Category (only if equipment linked) |
| Photos | Thumbnail grid of attached photos (max 6 per page, additional pages as needed) |
| Notes | Internal notes (staff version only) |
| Completion Section | "Work Performed: ____________", "Parts Used: ____________", "Time Spent: ____", "Completed by: ____________ Date: ________", "Resident Signature: ____________" |

**Button behavior**:
| State | Display |
|-------|---------|
| Idle | "Print Work Order" button (secondary style) |
| Loading | Button disabled + "Generating..." (1-3 seconds) |
| Success | New browser tab opens with PDF. Toast: "Work order ready" |
| Failure | Toast: "Failed to generate work order. Please try again." |

#### 3.1.8 Vendor Assignment

When assigning a vendor to a request, the assignment panel shows vendor details to help the manager choose:

| Column | Description |
|--------|-------------|
| Company Name | Vendor business name |
| Specialty | Service category (e.g., "Plumbing", "Electrical") |
| Compliance Status | Color-coded badge: Compliant (green), Expiring Soon (amber), Expired (red), Not Tracked (gray) |
| Rating | Star rating 1-5 based on past request resolution quality (calculated from manager feedback on closed requests) |
| Active Requests | Count of currently assigned open requests (workload indicator) |
| Avg. Resolution Time | Average days to close assigned requests |
| AI Recommendation | "Recommended" badge with one-line reasoning (if AI vendor suggestion is enabled) |

**Compliance Warning**: If a vendor with "Expired" compliance status is selected, a blocking warning appears:

- Warning icon (amber triangle) + text: "[Vendor Name]'s insurance expired on [date]. Assigning an uninsured vendor may create liability."
- Buttons: "Assign Anyway" (requires typing "CONFIRM" in a text field) | "Choose Different Vendor" (primary)

#### 3.1.9 Equipment Linkage

When linking equipment to a request, the equipment picker shows:

| Column | Description |
|--------|-------------|
| Name | Equipment display name |
| Category | Equipment category (e.g., Electrical, Mechanical) |
| Location | Physical location in the building |
| Serial Number | Equipment serial/asset number |
| Status | Badge: Operational (green), Needs Repair (amber), Out of Service (red) |
| Request History | Total count of past requests linked to this equipment |
| Last Service | Date of most recent maintenance activity |

**Link Benefit Tooltip**: "Linking equipment builds a maintenance history for each piece of building equipment. Over time, this enables pattern detection, failure prediction, and replacement planning."

---

### 3.2 Enhanced Features (v2)

#### 3.2.1 Recurring Tasks

Scheduled preventive maintenance tasks that automatically generate service requests at defined intervals.

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| Task Name | text | 200 chars | Yes | None | Min 5 chars | "Task name must be at least 5 characters" |
| Description | textarea | 2,000 chars | No | None | -- | -- |
| Category | dropdown | -- | Yes | None | Must select active category | "Please select a category" |
| Unit or Area | dropdown + text | 200 chars | No | None | Unit must exist if selected | "Unit not found" |
| Assigned Employee | dropdown | -- | No | None | Must be active staff | -- |
| Equipment | dropdown | -- | No | None | Must be active equipment | -- |
| Interval | dropdown | -- | Yes | Monthly | One of: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Semi-annually, Annually, Custom | "Please select an interval" |
| Custom Interval (days) | number | -- | Yes if Custom | None | Integer, 1-365 | "Enter a number between 1 and 365 days" |
| Start Date | date | -- | Yes | Today | Must be today or later | "Start date cannot be in the past" |
| End Date | date | -- | No | None (indefinite) | Must be after start date | "End date must be after start date" |
| Auto-Create Request | toggle | -- | No | On | -- | -- |
| Default Priority | dropdown | -- | Yes | Normal | -- | -- |
| Active | toggle | -- | No | On | -- | -- |

**Auto-Create Behavior**: When a recurring task fires, it creates a new service request pre-filled with the task details. If Auto-Create is off, it sends a notification to the assigned employee and PM instead.

##### Task Forecast View

A forward-looking calendar/table showing all upcoming recurring task occurrences.

| Filter | Options |
|--------|---------|
| Time Range | Next 30 days, 60 days, 90 days |
| Category | All or specific |
| Assigned Employee | All or specific |
| Equipment | All or specific |

**Display**: Timeline view (default) or table view. Each occurrence shows: Task name, Category, Assigned employee, Equipment (if linked), Scheduled date.

**Empty State**: Heading: "No upcoming tasks" | Body: "Create a recurring task to see scheduled maintenance projected here." | CTA: "Create Recurring Task"

#### 3.2.2 Inspections

Checklist-driven inspection workflows designed for mobile-first execution.

| Component | Description |
|-----------|-------------|
| **Checklist Builder** | Drag-and-drop builder for creating inspection checklists. Item types: Pass/Fail toggle, Numeric measurement (with min/max range), Photo required (camera prompt), Text note, Dropdown selection. |
| **Schedule Inspector** | Assign inspections to dates, areas/units, and staff members. Calendar view of upcoming inspections. |
| **Mobile Execution** | Inspections completed on mobile device. GPS verification confirms inspector is on-site. Photo capture at each checkpoint. Works offline -- syncs when reconnected. |
| **Review and Sign-off** | Supervisor reviews completed inspections. Can add notes, flag items for follow-up, and digitally sign off. Failed items auto-generate service requests. |
| **Report Generation** | Auto-generate inspection reports: overall pass/fail percentage, failed items with photos, trend comparison to previous inspections. Export as PDF. |

##### Default Checklists (pre-loaded, editable)

| Checklist | Items | Typical Interval |
|-----------|-------|-----------------|
| Common Area Daily | 15 items (lobby, hallways, elevators, stairwells, mail room) | Daily |
| Fire Safety Monthly | 20 items (extinguishers, exit signs, sprinklers, alarms, fire doors) | Monthly |
| Parking Garage Quarterly | 12 items (lighting, gates, drainage, signage, surfaces) | Quarterly |
| Rooftop Semi-Annual | 10 items (membrane, drains, HVAC units, railings, antenna mounts) | Semi-annually |
| Pool/Amenity Weekly | 18 items (water quality, equipment, safety equipment, signage, cleanliness) | Weekly |
| Move-in/Move-out | 25 items (walls, floors, fixtures, appliances, keys, cleanliness, damage) | Per event |

#### 3.2.3 Equipment Tracking

Full lifecycle management for building equipment and assets.

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| Name | text | 200 chars | Yes | None | Min 3 chars | "Equipment name must be at least 3 characters" |
| Category | dropdown | -- | Yes | None | Must select from active categories | "Please select a category" |
| Sub-Category | dropdown | -- | No | None | -- | -- |
| Serial Number | text | 100 chars | No | None | Unique per property if provided | "This serial number already exists in this property" |
| Asset Tag | text | 50 chars | No | None | Unique per property if provided | "This asset tag already exists" |
| Location | text | 200 chars | Yes | None | Min 3 chars | "Please specify the equipment location" |
| Manufacturer | text | 200 chars | No | None | -- | -- |
| Model | text | 200 chars | No | None | -- | -- |
| Installation Date | date | -- | No | None | Cannot be in the future | "Installation date cannot be in the future" |
| Warranty Expiry | date | -- | No | None | Must be after installation date | "Warranty expiry must be after installation date" |
| Expected Replacement | date | -- | No | None | -- | -- |
| Replacement Cost | currency (decimal) | 12 digits | No | None | Positive number | "Cost must be a positive number" |
| Status | dropdown | -- | Yes | Operational | One of: Operational, Needs Repair, Out of Service, Decommissioned | -- |
| Photos | file upload | 4 MB each, max 5 | No | None | Image formats | -- |
| Documents | file upload | 4 MB each, max 5 | No | None | PDF, DOC, XLS | -- |
| Notes | textarea | 2,000 chars | No | None | -- | -- |

##### Default Equipment Categories (6)

| Category | Examples |
|----------|----------|
| Electrical | Generators, transformers, panel boards, emergency lighting |
| Fire | Sprinkler systems, extinguishers, alarms, fire pumps |
| Gas | Boilers, water heaters, gas meters, regulators |
| Mechanical | Elevators, HVAC units, pumps, motors, compressors |
| Roof | Membranes, drains, antenna mounts, skylights |
| Valves | Water shutoffs, pressure regulators, backflow preventers |

##### Equipment Replacement Report

A sortable table showing all equipment approaching or past its expected replacement date.

| Column | Description |
|--------|-------------|
| Equipment Name | Clickable link to equipment detail |
| Category | Equipment category |
| Location | Physical location |
| Age | Years since installation |
| Expected Replacement | Date (red if past due, amber if within 6 months) |
| Estimated Cost | Replacement cost estimate |
| Status | Current operational status |

Exportable to Excel and PDF. Filterable by category, status, and date range.

#### 3.2.4 Vendor Compliance Dashboard

A centralized view of all vendor insurance and compliance status, accessible at Maintenance > Vendors.

##### Compliance Summary Cards (top of page)

| Card | Color | Count Logic |
|------|-------|-------------|
| Compliant | Green `#059669` | All required documents current and verified |
| Expiring in 30 Days | Amber `#D97706` | Any required document expiring within 30 days |
| Expired | Red `#EF4444` | Any required document past expiry date |
| Not Compliant | Red `#DC2626` | Required documents missing entirely |
| Not Tracking | Gray `#6B7280` | Compliance tracking not enabled for this vendor |

Clicking a card filters the vendor list below to show only vendors in that status.

##### Vendor Compliance Fields

| Field | Data Type | Required | Description |
|-------|-----------|----------|-------------|
| General Liability Insurance | file upload (PDF) + expiry date | Yes (if tracking) | Certificate of insurance + expiry date |
| Workers Compensation | file upload (PDF) + expiry date | Yes (if tracking) | Workers comp certificate + expiry |
| WSIB Clearance | file upload (PDF) + expiry date | Configurable per property | Workplace safety clearance certificate |
| Professional License | file upload + license number (text, 50 chars) + expiry date | Configurable | Trade license verification |
| Background Check | file upload + verification date | Configurable | Background verification document |

##### Automated Compliance Alerts

| Alert | Trigger | Recipients | Channel |
|-------|---------|------------|---------|
| 30-day expiry warning | 30 days before any document expiry | Property Manager + Vendor | Email |
| 7-day expiry warning | 7 days before expiry | Property Manager + Vendor | Email + Push |
| Expired notice | On expiry date | Property Manager | Email + Push + Dashboard banner |
| Assignment blocked | Attempt to assign expired vendor | Assigning user | Inline warning on assignment form |

#### 3.2.5 Alteration Projects

Tracking unit renovations and modifications with permit and insurance compliance.

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| Project Name | text | 200 chars | Yes | None | Min 5 chars | "Project name must be at least 5 characters" |
| Unit | dropdown | -- | Yes | None | Must be active unit | "Please select a unit" |
| Resident | auto-populated | -- | -- | Primary resident of unit | -- | -- |
| Start Date | date | -- | Yes | None | -- | "Please select a start date" |
| End Date | date | -- | No | None | Must be after start date if set | "End date must be after start date" |
| Status | dropdown | -- | Yes | "Not Started" | One of: Not Started, In Progress, On Hold, Completed, Cancelled | -- |
| Momentum | auto-calculated | -- | -- | -- | Read-only, system-computed | -- |
| Contractor | dropdown | -- | Yes | None | Must be active vendor | "Please select a contractor" |
| Permit Required | toggle | -- | Yes | Off | -- | -- |
| Permit Number | text | 50 chars | Yes if permit required | None | -- | "Permit number is required when a permit is needed" |
| Permit Document | file upload | 4 MB | Yes if permit required | None | PDF only | "Please upload the permit document (PDF)" |
| Insurance Certificate | file upload | 4 MB | Yes | None | PDF only | "Please upload the contractor's insurance certificate" |
| Deposit Required | toggle | -- | No | Property default | -- | -- |
| Deposit Amount | currency | 10 digits | Yes if deposit required | None | Positive number | "Enter a valid deposit amount" |
| Deposit Status | dropdown | -- | -- | "Not Collected" | Collected, Refunded, Partially Refunded, Forfeited | -- |
| Approved By | dropdown | -- | Yes | None | Must be PM, Admin, or Board Member | "Please select who approved this project" |
| Notes/Conditions | textarea | 4,000 chars | No | None | -- | -- |

**Momentum Indicator**: Automatically calculated based on the timestamp of the last activity (status change, comment, document upload).

| Momentum | Color | Badge | Logic |
|----------|-------|-------|-------|
| OK | Green `#059669` | Green dot | Activity within last 7 days |
| Slow | Amber `#D97706` | Amber dot | No activity for 8-14 days |
| Stalled | Orange `#F97316` | Orange dot | No activity for 15-30 days |
| Stopped | Red `#EF4444` | Red dot | No activity for 30+ days |

---

### 3.3 Future Features (v3+)

| Feature | Description | Rationale |
|---------|-------------|-----------|
| **Resident Satisfaction Surveys** | Auto-send a brief survey on request closure, track NPS per category and staff member | Measure and improve service quality over time |
| **AI Root Cause Analysis** | Analyze clusters of related requests to identify systemic building issues | Move from reactive to proactive building management |
| **Vendor Bidding System** | Post work requests to multiple vendors, compare quotes, select best value | Cost optimization for larger projects |
| **IoT Sensor Integration** | Connect to smart building sensors for automatic fault detection and request creation | Catch problems before residents notice them |
| **Warranty Claim Management** | Track which repairs fall under equipment warranty and manage the claim process | Recover costs from manufacturers |
| **Budget Tracking per Category** | Set maintenance budgets per category, track spend, forecast overages | Financial planning and board reporting |
| **Resident Self-Schedule** | Let residents pick from available time slots for maintenance visits | Reduce scheduling back-and-forth |

---

## 4. Data Model

### 4.1 Primary Entity: MaintenanceRequest

Defined in full in `01-architecture.md`. Key fields reproduced here for reference:

```
MaintenanceRequest
├── id (UUID, primary key)
├── property_id → Property (required, indexed)
├── unit_id → Unit (nullable -- null for common area requests)
├── resident_id → User (who submitted, required)
├── correlated_event_id → Event (for unified timeline, auto-generated)
├── reference_number (varchar 20, auto-generated: "SR-YYYY-NNNNN", unique, indexed)
├── category_id → MaintenanceCategory (required)
├── sub_category (varchar 100, nullable)
├── title (varchar 200, required)
├── description (text, max 4000 chars)
├── status (enum: open, in_progress, on_hold, closed -- default: open, indexed)
├── priority (enum: low, normal, high, critical -- default: normal, indexed)
├── urgency_flag (boolean, default: false)
├── permission_to_enter (enum: yes, no, not_applicable -- default: not_applicable)
├── entry_instructions (text, max 1000 chars, nullable)
├── assigned_employee_id → User (nullable, indexed)
├── assigned_vendor_id → Vendor (nullable, indexed)
├── equipment_id → Equipment (nullable)
├── contact_numbers (varchar 100, nullable)
├── internal_notes (text, max 2000 chars, nullable -- hidden from residents)
├── print_work_order (boolean, default: false)
├── scheduled_date (date, nullable)
├── completed_date (date, nullable)
├── resolution_notes (text, max 2000 chars, nullable)
├── ai_metadata (JSONB -- structure defined in 4.3)
├── custom_fields (JSONB)
├── created_at (timestamp with timezone, auto-set)
├── updated_at (timestamp with timezone, auto-updated)
│
├── photos[] → Attachment (polymorphic, max 10)
├── documents[] → Attachment (polymorphic, max 5)
├── comments[] → MaintenanceComment (ordered by created_at)
├── status_history[] → MaintenanceStatusChange (ordered by created_at)
└── notifications[] → Notification (system-generated)
```

### 4.2 Supporting Entities

#### MaintenanceCategory

```
MaintenanceCategory
├── id (UUID)
├── property_id → Property (indexed)
├── name (varchar 100, required)
├── icon (varchar 50, nullable -- icon identifier)
├── color (varchar 7, nullable -- hex code e.g. "#3B82F6")
├── sub_categories (text[], nullable -- array of sub-category names)
├── default_priority (enum: low, normal, high, critical -- nullable)
├── default_assignee_id → User (nullable)
├── sort_order (integer, required)
├── active (boolean, default: true)
├── created_at (timestamp)
└── updated_at (timestamp)
```

#### MaintenanceComment

```
MaintenanceComment
├── id (UUID)
├── request_id → MaintenanceRequest (indexed)
├── author_id → User
├── body (text, max 2000 chars, required)
├── visible_to_resident (boolean, default: true)
├── attachments[] → Attachment (polymorphic, max 3)
├── is_from_template (boolean, default: false)
├── template_id → ResponseTemplate (nullable)
└── created_at (timestamp)
```

#### MaintenanceStatusChange

```
MaintenanceStatusChange
├── id (UUID)
├── request_id → MaintenanceRequest (indexed)
├── changed_by → User
├── from_status (enum: open, in_progress, on_hold, closed)
├── to_status (enum: open, in_progress, on_hold, closed)
├── reason (text, max 500 chars, nullable)
├── resolution_notes (text, max 2000 chars, nullable -- populated on close)
├── notification_sent (boolean, default: false)
└── created_at (timestamp)
```

#### ResponseTemplate

```
ResponseTemplate
├── id (UUID)
├── property_id → Property
├── name (varchar 100, required, unique per property)
├── body (text, max 2000 chars, required -- supports placeholders)
├── applicable_statuses (enum[], required -- at least one)
├── active (boolean, default: true)
├── usage_count (integer, default: 0 -- incremented on use)
├── created_by → User
├── created_at (timestamp)
└── updated_at (timestamp)
```

#### RecurringTask (v2)

```
RecurringTask
├── id (UUID)
├── property_id → Property
├── name (varchar 200, required)
├── description (text, max 2000 chars, nullable)
├── category_id → MaintenanceCategory
├── unit_id → Unit (nullable)
├── area_description (varchar 200, nullable -- for common areas)
├── assigned_employee_id → User (nullable)
├── equipment_id → Equipment (nullable)
├── interval_type (enum: daily, weekly, biweekly, monthly, quarterly, semiannually, annually, custom)
├── custom_interval_days (integer, nullable -- 1-365)
├── start_date (date, required)
├── end_date (date, nullable)
├── next_occurrence (date, computed)
├── auto_create_request (boolean, default: true)
├── default_priority (enum, default: normal)
├── active (boolean, default: true)
├── last_generated_at (timestamp, nullable)
├── generated_requests[] → MaintenanceRequest
├── created_by → User
└── created_at (timestamp)
```

### 4.3 AI Metadata Structure

The `ai_metadata` JSONB field on MaintenanceRequest stores all AI-related suggestions and decisions:

```json
{
  "category_suggestion": {
    "suggested_category_id": "uuid",
    "suggested_category_name": "Plumbing -- Leak",
    "confidence": 0.92,
    "accepted": true,
    "suggested_at": "2026-03-14T10:00:00Z"
  },
  "priority_suggestion": {
    "suggested_priority": "high",
    "reasoning": "Active water leak with potential for structural damage if delayed",
    "confidence": 0.87,
    "accepted": false,
    "user_selected": "normal",
    "suggested_at": "2026-03-14T10:00:00Z"
  },
  "duplicate_check": {
    "potential_duplicates": ["uuid1", "uuid2"],
    "similarity_scores": [0.91, 0.78],
    "user_confirmed_not_duplicate": true,
    "checked_at": "2026-03-14T10:00:00Z"
  },
  "vendor_suggestion": {
    "suggested_vendors": [
      { "vendor_id": "uuid1", "reasoning": "Highest rated for plumbing (4.8/5)" },
      { "vendor_id": "uuid2", "reasoning": "Fastest avg resolution (1.2 days)" },
      { "vendor_id": "uuid3", "reasoning": "Lowest avg cost ($185)" }
    ],
    "accepted_vendor_id": "uuid1",
    "suggested_at": "2026-03-14T10:01:00Z"
  },
  "cost_estimate": {
    "estimated_range_low": 150,
    "estimated_range_high": 400,
    "currency": "CAD",
    "confidence": 0.72,
    "basis": "Based on 47 similar plumbing requests at this property",
    "estimated_at": "2026-03-14T10:01:00Z"
  },
  "resolution_time_prediction": {
    "estimated_hours": 48,
    "confidence": 0.81,
    "predicted_at": "2026-03-14T10:00:00Z"
  },
  "description_enhancement": {
    "enhanced_text": "Kitchen faucet has a constant drip from the handle base...",
    "accepted": false,
    "enhanced_at": "2026-03-14T10:00:00Z"
  },
  "photo_analysis": [
    {
      "attachment_id": "uuid",
      "assessment": "Moderate water damage to cabinet base. Visible warping.",
      "severity": "moderate",
      "analyzed_at": "2026-03-14T10:02:00Z"
    }
  ],
  "satisfaction_prediction": {
    "predicted_score": 3.8,
    "risk_factors": ["Response time was 2x average for this priority level"],
    "predicted_at": "2026-03-14T18:00:00Z"
  }
}
```

---

## 5. User Flows

### 5.1 Resident Submits a Request

```
1. Resident logs in → sees "My Requests" in sidebar under "My Unit"
2. Clicks "Submit New Request" button
3. Form loads: unit auto-filled (read-only), category field has AI suggestion chips
4. Resident types title → after 500ms pause, AI auto-suggests category (chip below dropdown)
5. Resident fills description (min 20 chars) → AI may refine suggestion
6. Resident selects category (accepts AI suggestion or picks manually)
7. Resident selects Permission to Enter: Yes → Entry Instructions field appears
8. Resident fills entry instructions (e.g., "Lockbox code 4321, cat inside")
9. Optionally taps "Add Photos" → camera opens on mobile, file picker on desktop
10. Optionally adjusts priority (defaults to Normal)
11. Checks authorization checkbox
12. Clicks "Submit Request"
13. [If AI duplicate detection finds matches]: Modal shows similar open requests
    → Resident clicks "This is a new issue" or "View existing request SR-XXXX"
14. System: generates reference number, creates correlated Event, sends notifications
15. Success: toast "Request SR-2026-00089 submitted" + redirect to detail page
16. Resident receives email: "Your request has been received. Reference: SR-2026-00089"
```

### 5.2 Property Manager Triages a Request

```
1. PM sees "3 new requests" badge on Service Requests sidebar item
2. Navigates to Service Requests → default filter shows Open + In Progress
3. Scans card grid → spots new request with OPEN badge
4. Clicks card → detail page loads with all sections
5. Reviews AI Insights panel:
   - Category suggestion: "Plumbing -- Leak (92%)" → clicks "Apply" or overrides
   - Priority suggestion: "High -- Active water leak" → accepts or changes
   - Resolution estimate: "2-3 business days"
   - Duplicate check: "No duplicates found"
6. Clicks "Assign" button → assignment panel opens
   - AI vendor recommendation: "Recommended: FastFix Plumbing (4.8 rating, compliant)"
   - PM selects vendor from recommendation
   - PM selects employee (sees workload dots: green/amber/red per person)
7. Sets scheduled date for vendor visit
8. Clicks "Update Status" → selects "In Progress"
9. Selects predefined response: "Vendor Scheduled"
   → Template auto-fills with vendor name and date
10. Checks "Notify Resident" → clicks "Save"
11. System: logs all changes in timeline, sends notification to resident + vendor + employee
```

### 5.3 Maintenance Staff Completes a Request

```
1. Maintenance staff logs in → dashboard shows "My Assigned Requests" sorted by priority
2. Sees 3 requests: 1 Critical (red), 1 High (orange), 1 Normal (blue)
3. Taps Critical request → detail page loads
4. Reviews: description, photos of damage, entry instructions
5. Optionally taps "Print Work Order" → PDF opens for printing
6. Travels to unit, completes repair
7. Returns to app → taps "Update Status"
8. Selects "Closed"
9. Types resolution notes: "Replaced kitchen faucet cartridge. Tested -- no more drip."
10. Uploads 2 completion photos (taps camera icon on mobile)
11. Taps "Save"
12. System: logs closure, notifies resident, updates equipment history if linked
13. Resident receives: "Your request SR-2026-00089 has been resolved."
```

### 5.4 Resident Tracks Their Request

```
1. Resident navigates to "My Requests" in sidebar
2. Sees card list: each card shows status badge, title, date, reference number
3. Clicks into open request → sees full timeline:
   - "You created this request" (Mar 14, 2:30 PM)
   - "Status changed to In Progress" (Mar 14, 3:15 PM)
   - "Assigned to FastFix Plumbing" (Mar 14, 3:15 PM)
   - "Staff commented: FastFix Plumbing will visit on Mar 16..." (Mar 14, 3:16 PM)
4. Resident adds comment: "The leak got worse overnight, water under the sink now"
5. System notifies assigned employee + PM of new comment
6. Later: resident gets push notification "Status updated to Closed"
7. Resident views resolution notes and completion photos
8. [v3] Resident receives satisfaction survey
```

### 5.5 Bulk Request Management

```
1. PM navigates to Service Requests → clicks table view toggle
2. Uses filters: Category = "HVAC -- Heating", Status = "Open"
3. Sees 8 requests from different units all reporting heating issues
4. Selects all 8 via header checkbox
5. Clicks bulk action "Assign Vendor" → selects HVAC contractor
6. Confirmation dialog: "Assign ClimatePro HVAC to 8 requests?"
7. Clicks "Confirm"
8. System: updates all 8 requests, sends notifications to vendor and residents
9. PM exports the filtered list to Excel for board reporting
```

---

## 6. UI/UX

### 6.1 Desktop Layout (1280px+)

```
+------------------------------------------------------------------+
| Top Nav: Logo | Global Search | Notifications (3) | Profile       |
+----------+-------------------------------------------------------+
| Sidebar  | SERVICE REQUESTS                     [+ Create Request] |
|          |-------------------------------------------------------|
| OVERVIEW |  [Search...___________] [Status v] [Category v]        |
| Dashboard|  [Priority] [Employee v] [Date Range]  [Clear filters] |
| ------   |-------------------------------------------------------|
| OPERATIONS  Card/Table toggle -->                    [Export v]   |
| Security |-------------------------------------------------------|
| Packages |  +---Card 1---+  +---Card 2---+  +---Card 3---+      |
| *Service |  | SR-00089   |  | SR-00088   |  | SR-00087   |      |
|  Requests|  | [OPEN][HIGH]|  | [IN PROG]  |  | [CLOSED]   |      |
| Announce.|  | Leak Faucet |  | Elev Noise |  | Lobby Light|      |
| ------   |  | U1205-Chen |  | Common Area|  | Common Area|      |
| MGMT     |  | John S.    |  | Unassigned |  | Maria R.   |      |
| Reports  |  +------------+  +------------+  +------------+      |
| Training |                                                       |
| Logs     |  +---Card 4---+  +---Card 5---+  +---Card 6---+      |
|          |  | ...        |  | ...        |  | ...        |      |
|          |  +------------+  +------------+  +------------+      |
|          |                                                       |
|          |  Showing 1-25 of 147   < 1  2  3  4  5  6 >          |
+----------+-------------------------------------------------------+
```

### 6.2 Tablet Layout (768px - 1279px)

- Sidebar collapses to icon-only rail (40px wide). Tap hamburger icon to expand overlay.
- Card grid becomes 2 columns.
- Filters collapse into a single "Filters" button that opens a slide-over panel from the right.
- Active filter count shown as badge on the Filters button.
- Create button remains in header as a text button (not FAB).

### 6.3 Mobile Layout (< 768px)

- No sidebar. Bottom tab navigation: Dashboard, Requests, Packages, More.
- Card grid becomes single column, full-width cards.
- Filters behind a "Filter" icon button in top-right of header. Opens full-screen filter panel.
- Create request: Floating Action Button (FAB) in bottom-right corner, 56px diameter, primary color.
- Detail view: all sections stacked as expandable accordions (first section auto-expanded).
- Photos: horizontal swipeable gallery with counter "2 of 5".
- Activity timeline: chat-style thread, newest at bottom.
- Status change: full-screen modal instead of dialog.

### 6.4 Loading States

| Component | Loading Display |
|-----------|----------------|
| Request listing | 6 skeleton cards (2 rows of 3 on desktop). Each skeleton matches card layout: gray pulsing rectangles for badge, title, unit, assignee. |
| Request detail | Skeleton blocks for each section header + content area. Progressive: header loads first, then sections top-to-bottom. |
| Filter dropdowns | Spinner inside dropdown while options load. Dropdown disabled until loaded. |
| File upload | Per-file progress bar with percentage + file name. "Uploading 2 of 5..." |
| Status update | Submit button shows spinner + "Updating..." Dialog remains open until complete. |
| Work order PDF | Button disabled + "Generating..." for 1-3 seconds. |
| AI suggestions | Subtle shimmer animation on the suggestion chip area. Chips fade in when ready. Label: "Analyzing..." in gray italic. |
| Export | Button spinner + "Preparing export..." Toast when file ready: "Export ready -- downloading." |

### 6.5 Error States

| Scenario | Display |
|----------|---------|
| Network error on listing load | Full-page: wrench illustration + "Unable to load requests" + "Check your connection and try again." + [Retry] button (primary). |
| Network error on form submit | Red toast (persists until dismissed): "Unable to submit request. Your data has been saved locally. We'll retry automatically." + local draft indicator on the form. |
| Network error on detail load | Full-page: "Unable to load this request" + "Check your connection and try again." + [Retry] + [Back to Requests]. |
| File upload failure | Inline error below the specific file: red text "[filename] failed to upload" + [Retry] link + [Remove] link. Other files unaffected. |
| File too large | Inline error: "[filename] is too large. Maximum file size is 4 MB." File not added to upload queue. |
| Wrong file type | Inline error: "[filename] is not a supported format. Accepted: JPG, PNG, GIF, HEIC." |
| Validation errors on submit | Red border on each invalid field. Error message below each field in red. Page auto-scrolls to the first error. Submit button remains enabled. |
| Permission denied | Full-page: lock icon + "You don't have permission to view this request." + "Contact your property manager if you need access." + [Back to Requests]. |
| Request not found | Full-page: magnifying glass icon + "Request not found" + "It may have been deleted or moved to a different property." + [Back to Requests]. |
| AI service unavailable | Graceful: AI suggestion areas simply don't appear. No error message. Form works normally without suggestions. |

### 6.6 Empty States

Described inline in Section 3.1.2 (listing empty states) and throughout detail sections. Summary:

| Context | Heading | Body | CTA |
|---------|---------|------|-----|
| No requests (staff) | "No service requests yet" | "Requests from residents and staff will appear here." | "Create First Request" |
| No requests (resident) | "You don't have any service requests" | "Need something fixed? Submit a request and we'll take care of it." | "Submit a Request" |
| No assigned requests (maintenance staff) | "No requests assigned to you" | "When a manager assigns a request to you, it will appear here." | None |
| Filters return nothing | "No requests match your filters" | "Try adjusting your filters or clearing them." | "Clear all filters" (link) |
| No comments | "No comments yet" | "Add a comment to share an update." | "Add Comment" (text link) |
| No photos | "No photos attached" | "Photos help diagnose the issue faster." | "Add Photos" (text link) |
| No equipment (v2) | "No equipment registered" | "Add building equipment to track maintenance history." | "Add Equipment" |
| No recurring tasks (v2) | "No recurring tasks" | "Schedule preventive maintenance to avoid costly repairs." | "Create Recurring Task" |
| No vendors | "No vendors in directory" | "Add vendors to assign them to maintenance requests." | "Add Vendor" |

### 6.7 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements reachable via Tab. Enter/Space to activate buttons. Arrow keys navigate dropdowns and radio groups. Escape closes dialogs and panels. |
| Screen readers | Status badges: `aria-label="Status: Open"`. Priority badges: `aria-label="Priority: High"`. Card grid: `role="list"` with `role="listitem"` per card. Forms: all inputs have associated `<label>`. Errors linked via `aria-describedby`. |
| Color contrast | All text meets WCAG AA (4.5:1 minimum). Status and priority communicated by both color and text label -- never color alone. |
| Focus indicators | 2px blue focus ring (`#2563EB`) on all interactive elements, visible on both light and dark backgrounds. |
| Touch targets | Minimum 44x44px tap area for all buttons, links, and interactive elements on mobile. |
| Reduced motion | Users with `prefers-reduced-motion` see no skeleton shimmer, no transition animations. Instant state changes. |
| High contrast mode | Supports Windows High Contrast Mode. All status badges remain distinguishable. |

---

## 7. AI Integration

The Maintenance module integrates **12 AI capabilities** (IDs 23-34 from 19-ai-framework.md). Every capability follows the core principle: **AI suggests, human confirms**. Every feature works fully without AI.

### 7.1 Auto-Categorization (AI ID #23)

| Aspect | Detail |
|--------|--------|
| **What it does** | Classifies requests into the correct category based on the title and description text |
| **Trigger** | On typing (debounced 500ms after user stops typing in title or description) |
| **Input** | Request title + description text |
| **Output** | Top category suggestion with confidence score |
| **Model** | Haiku ($0.001/call) |
| **UX** | A chip appears below the Category dropdown: "[Category Name] ([X]%)" with "Apply" button. Clicking Apply selects the category. Chip has subtle sparkle icon. |
| **Confidence threshold** | Only show if confidence > 70%. Below 70%, no suggestion appears. |
| **Fallback** | User selects category manually from the dropdown. No indication AI was attempted. |
| **Default state** | Enabled |
| **Tracking** | Log: suggestion shown, accepted/rejected, user's final selection, confidence score |

### 7.2 Priority Suggestion (AI ID #24)

| Aspect | Detail |
|--------|--------|
| **What it does** | Recommends a priority level based on description keywords, category, and unit maintenance history |
| **Trigger** | On submit (after description and category are set) |
| **Input** | Title + description + category + unit ID + past 90 days of requests for this unit |
| **Output** | Priority level (Low/Normal/High/Critical) + one-sentence reasoning |
| **Model** | Haiku ($0.001/call) |
| **UX** | Priority dropdown auto-selects the AI suggestion. A small tooltip on the priority badge shows the reasoning (e.g., "Water damage can escalate quickly -- High recommended"). User can override. |
| **Fallback** | Priority defaults to "Normal". No suggestion shown. |
| **Default state** | Enabled |

### 7.3 Duplicate Detection (AI ID #25)

| Aspect | Detail |
|--------|--------|
| **What it does** | Finds potential duplicate or related open requests before saving |
| **Trigger** | Pre-save check (runs after user clicks Submit, before the request is persisted) |
| **Input** | New request title + description + unit ID. Compared against all open/in-progress requests for the same property. |
| **Output** | List of 0-5 potential duplicates with similarity scores |
| **Model** | Embeddings (for similarity search) + Haiku (for relevance ranking). $0.002/call. |
| **UX** | If matches found (similarity > 75%): modal appears listing each match with reference number, title, status, similarity %. Buttons: "This is a new issue -- create anyway" (primary) or "View [SR-XXXX]" (link per match). If no matches: request saves normally, no modal. |
| **Fallback** | No duplicate check. Request saves immediately on submit. |
| **Default state** | Enabled |

### 7.4 Vendor Recommendation (AI ID #26)

| Aspect | Detail |
|--------|--------|
| **What it does** | Recommends the best vendor based on category match, past ratings, current workload, compliance status, and average cost |
| **Trigger** | When opening the vendor assignment panel (and a category is already set) |
| **Input** | Request category + vendor directory + compliance status + performance history + current open assignments |
| **Output** | Top 3 vendor suggestions, each with a one-line reasoning |
| **Model** | Sonnet ($0.005/call) |
| **UX** | In the vendor dropdown, AI-recommended vendors appear at the top with a "Recommended" badge and reasoning text. Other vendors listed below. |
| **Fallback** | Vendor dropdown shows all vendors alphabetically. No recommendation badges. |
| **Default state** | Enabled |

### 7.5 Cost Estimation (AI ID #31)

| Aspect | Detail |
|--------|--------|
| **What it does** | Estimates repair cost range based on issue type, past similar repairs, and vendor pricing history |
| **Trigger** | On demand -- user clicks "Estimate Cost" button on the request detail page |
| **Input** | Request description + category + linked equipment + historical cost data for similar requests at this property |
| **Output** | Low-high cost range + confidence percentage + basis statement |
| **Model** | Sonnet ($0.005/call) |
| **UX** | Card in AI Insights section: "$150 - $400 (72% confidence). Based on 47 similar plumbing repairs at this property." |
| **Fallback** | "Estimate Cost" button hidden. No cost data shown. |
| **Default state** | Disabled (opt-in via admin settings) |

### 7.6 Predictive Maintenance (AI ID #33)

| Aspect | Detail |
|--------|--------|
| **What it does** | Analyzes equipment maintenance history to predict upcoming failures and recommend preventive action |
| **Trigger** | Weekly scheduled job (Wednesday 3:00 AM) |
| **Input** | All equipment records + their maintenance request history + age + manufacturer data |
| **Output** | Per-equipment failure risk score (0-100) + recommended maintenance action + urgency |
| **Model** | Sonnet ($0.01/call) |
| **UX** | Dashboard widget: "Equipment Risk Alerts" card listing high-risk items (score > 70). Click opens detail with recommended actions. |
| **Fallback** | No prediction. Equipment shows only historical data. PM relies on scheduled maintenance. |
| **Default state** | Disabled (requires v2 Equipment Tracking) |

### 7.7 Workload Balancing (AI ID #30 related)

| Aspect | Detail |
|--------|--------|
| **What it does** | Shows staff workload and suggests reassignment when load is imbalanced |
| **Trigger** | When opening the employee assignment dropdown |
| **Input** | Current open request count per staff member + priority distribution + estimated effort |
| **Output** | Workload indicator per employee (light/moderate/heavy) |
| **Model** | Haiku ($0.001/call) |
| **UX** | Each employee in the dropdown shows a colored dot: Green (< 5 open), Amber (5-10 open), Red (> 10 open). Tooltip: "[Name] has 8 open requests (3 High, 2 Critical)". If all staff are overloaded, a banner suggests: "All staff have heavy workloads. Consider assigning to a vendor." |
| **Fallback** | No workload indicators. Simple alphabetical staff list. |
| **Default state** | Enabled |

### 7.8 Closure Quality Check (AI ID #34 related)

| Aspect | Detail |
|--------|--------|
| **What it does** | Reviews resolution notes before closure to ensure completeness and professionalism |
| **Trigger** | When user changes status to "Closed" and enters resolution notes |
| **Input** | Resolution notes text + original request description + category |
| **Output** | Quality assessment (pass/needs improvement) + specific improvement suggestions |
| **Model** | Haiku ($0.001/call) |
| **UX** | If notes are too brief (< 20 chars) or vague: soft amber warning below the notes field. Example: "Consider adding: what was repaired, parts used, and whether follow-up is needed." User can proceed anyway or edit. Not blocking. |
| **Fallback** | No quality check. Notes accepted as-is. |
| **Default state** | Enabled |

### 7.9 Damage Photo Analysis (AI ID #29)

| Aspect | Detail |
|--------|--------|
| **What it does** | Analyzes uploaded photos to assess damage severity and suggest repair approaches |
| **Trigger** | On photo upload (after file is saved) |
| **Input** | Photo file + request description for context |
| **Output** | Damage severity (minor/moderate/severe) + description + repair suggestion |
| **Model** | GPT-4o Vision ($0.01/call) |
| **UX** | Small card below the uploaded photo thumbnail: "AI Assessment: Moderate water damage to drywall. Recommended: Replace affected section, check for mold behind wall." Card is collapsible. |
| **Fallback** | No analysis. Photos displayed as-is with no assessment. |
| **Default state** | Disabled (opt-in) |

### 7.10 Parts Suggestion (new capability)

| Aspect | Detail |
|--------|--------|
| **What it does** | Suggests parts, materials, or tools likely needed based on the request details |
| **Trigger** | On demand -- user clicks "Suggest Parts" button on detail page |
| **Input** | Request description + category + equipment details (if linked) + historical parts data from similar requests |
| **Output** | List of suggested parts with estimated quantities |
| **Model** | Sonnet ($0.005/call) |
| **UX** | Expandable card: "Suggested Parts: Faucet cartridge (1), Plumber's putty (1), Adjustable wrench". Staff can copy list to work order. |
| **Fallback** | Button hidden. Staff determines parts manually. |
| **Default state** | Disabled (opt-in) |

### 7.11 Resolution Time Prediction (AI ID #27)

| Aspect | Detail |
|--------|--------|
| **What it does** | Predicts how long the request will take to resolve |
| **Trigger** | On request creation (after category and priority are set) |
| **Input** | Category + priority + unit + historical resolution time data for similar requests |
| **Output** | Estimated time range (hours or days) + confidence level |
| **Model** | Haiku ($0.001/call) |
| **UX** | Small text on detail page header area: "Estimated resolution: 2-3 business days (81% confidence)". Shown to staff and PM only -- not visible to residents. |
| **Fallback** | No estimate shown. |
| **Default state** | Enabled |

### 7.12 Resident Satisfaction Prediction (new capability)

| Aspect | Detail |
|--------|--------|
| **What it does** | Predicts how satisfied the resident will be based on the full request lifecycle |
| **Trigger** | On request closure |
| **Input** | Time-to-first-response, total resolution time, number of status changes, comment quality, predicted vs actual resolution time |
| **Output** | Predicted satisfaction score (1.0-5.0) + risk factors |
| **Model** | Haiku ($0.001/call) |
| **UX** | Internal-only card on request detail (PM and Admin only): "Predicted satisfaction: 3.8/5. Risk: response time was 2x average." Not shown to residents or maintenance staff. |
| **Fallback** | No prediction. |
| **Default state** | Disabled (opt-in) |

### AI Display Rules (All Capabilities)

1. AI suggestions are **always non-blocking**. The user can ignore every suggestion and proceed normally.
2. Suggestions appear as small chips or cards with a subtle sparkle icon in `--text-tertiary` color. No "AI-powered" branding or badges.
3. If the AI provider is unavailable, suggestion areas simply do not render. No error messages. The form works identically without AI.
4. Confidence scores displayed only when above 70%. Below 70%, no suggestion is made.
5. Every AI suggestion interaction (shown, accepted, rejected, overridden) is logged for acceptance-rate analytics.
6. Features with acceptance rate below 60% for 30 consecutive days are flagged for review in the AI Dashboard.

---

## 8. Analytics

### 8.1 Operational Metrics (Real-Time Dashboard)

| Metric | Calculation | Display | Who Sees |
|--------|-------------|---------|----------|
| Open Requests | Count where status = open | Large number KPI card | PM, Admin |
| In Progress | Count where status = in_progress | Large number KPI card | PM, Admin |
| On Hold | Count where status = on_hold | Large number KPI card | PM, Admin |
| Unassigned | Count where status IN (open, in_progress) AND assigned_employee = null AND assigned_vendor = null | Large number (amber if > 0) | PM, Admin |
| Urgent | Count where urgency_flag = true AND status != closed | Large number (red if > 0) | PM, Admin |
| Overdue | Count where status IN (open, in_progress) AND age > SLA threshold | Large number (red if > 0) | PM, Admin |
| Avg. Response Time | Mean time from created_at to first status change away from "open" | Hours or days | PM, Admin, Board |
| Avg. Resolution Time | Mean time from created_at to status = closed | Hours or days | PM, Admin, Board |

### 8.2 Performance Reports

| Report | Contents | Frequency | Who Sees | Export |
|--------|----------|-----------|----------|--------|
| Request Volume | Requests created per day/week/month, grouped by category, unit, or priority. Line and bar charts. | Weekly, Monthly | PM, Admin, Board | Excel, PDF |
| Resolution Time | Average, median, P90 resolution time by category and priority. Trend line over time. | Weekly, Monthly | PM, Admin | Excel, PDF |
| Staff Workload | Requests per employee, resolution rate, avg handle time. Ranked table. | Weekly | PM, Admin | Excel, PDF |
| Category Breakdown | Pie chart and table of requests by category. Identifies top problem areas. | Monthly | PM, Admin, Board | Excel, PDF |
| Vendor Performance | Requests per vendor, avg resolution time, avg cost, compliance status. | Monthly | PM, Admin | Excel, PDF |
| Recurring Issues | Units or equipment with 3+ requests in the same category within 90 days. | Monthly | PM, Admin | Excel, PDF |
| SLA Compliance | Percentage of requests resolved within SLA by priority level. Traffic light indicators. | Weekly, Monthly | PM, Admin, Board | Excel, PDF |
| Cost Summary | Total maintenance spend by category, vendor, and period. Budget vs. actual (v3). | Monthly | PM, Admin, Board | Excel, PDF |

### 8.3 AI Analytics

| Metric | Calculation | Target | Purpose |
|--------|-------------|--------|---------|
| Category suggestion acceptance rate | Accepted / Total suggestions shown | > 80% | Is the AI categorizing accurately? |
| Priority suggestion acceptance rate | Accepted / Total suggestions shown | > 75% | Are priority recommendations useful? |
| Duplicate detection true positive rate | Confirmed duplicates / Total flagged | > 70% | Is the AI finding real duplicates? |
| Vendor recommendation acceptance rate | AI-recommended vendor selected / Total recommendations | > 60% | Are vendor suggestions helpful? |
| Cost estimate accuracy | Mean absolute % error between estimate and actual | < 30% | Are cost estimates useful for budgeting? |
| Resolution time prediction accuracy | Mean absolute % error between predicted and actual | < 25% | Is the prediction helpful for setting expectations? |
| AI feature usage rate | Requests with at least one AI interaction / Total requests | > 80% | Are users engaging with AI features? |

---

## 9. Notifications

### 9.1 Notification Events

| Event | Default Channels | Recipients | Template Preview |
|-------|-----------------|------------|-----------------|
| Request Created (by resident) | Email + Push | Property Manager, Assigned Employee (if set) | "New service request from Unit [UNIT]: [TITLE]. Priority: [PRIORITY]. Ref: [REF]." |
| Request Created (by staff) | Email | Resident (if unit-linked) | "A service request has been created for your unit: [TITLE]. Reference: [REF]. We'll keep you updated." |
| Status Changed to In Progress | Email + Push | Resident | "Your request [REF] is now being worked on. [CUSTOM_MESSAGE]" |
| Status Changed to On Hold | Email | Resident | "Your request [REF] has been placed on hold. Reason: [REASON]. We'll resume as soon as possible." |
| Status Changed to Closed | Email | Resident | "Your request [REF] has been resolved. [RESOLUTION_NOTES]. If the issue persists, submit a new request." |
| Comment Added (by staff) | Email + Push | Resident | "Update on your request [REF]: [COMMENT_PREVIEW]" |
| Comment Added (by resident) | Push | Assigned Employee, PM | "New comment from [RESIDENT] on [REF]: [COMMENT_PREVIEW]" |
| Employee Assigned | Email + Push | Assigned Employee | "You have been assigned to [REF]: [TITLE]. Priority: [PRIORITY]." |
| Vendor Assigned | Email | Vendor primary contact | "You have been assigned to request [REF] at [PROPERTY]. [WORK_ORDER_PDF_LINK if generated]." |
| Urgency Flag Set | Push + SMS (if configured) | Property Manager, Assigned Employee | "URGENT: Request [REF] flagged as urgent. [TITLE]. Immediate attention required." |
| Overdue Alert | Push | Property Manager | "[N] service requests are overdue. [REF_LIST]. Please review." |
| Vendor Compliance Expiring (v2) | Email | Property Manager, Vendor | "[VENDOR]'s [DOCUMENT_TYPE] expires on [DATE]. Please renew to maintain compliance." |

### 9.2 Resident Notification Preferences

Residents control their maintenance notification preferences at My Account > Notification Preferences:

| Notification Type | Default | Options | Can Disable? |
|-------------------|---------|---------|-------------|
| Request confirmation (on create) | Email | Email, Push, Both, Off | Yes |
| Status updates | Email + Push | Email, Push, Both, Off | Yes |
| Comments from staff | Push | Email, Push, Both, Off | Yes |
| Resolution notification | Email | Email only | No (always sent) |

Staff notification preferences are managed by Property Admin. Assignment and urgency notifications cannot be disabled for staff roles.

### 9.3 Escalation Rules

| Condition | Action | Delay | Configurable |
|-----------|--------|-------|-------------|
| Urgent request unassigned | Push notification to PM | 30 minutes | Yes (15 min - 2 hours) |
| High-priority request unassigned | Push notification to PM | 2 hours | Yes (1 - 8 hours) |
| Normal-priority request unassigned | Push notification to PM | 24 hours | Yes (4 - 72 hours) |
| Request open beyond SLA threshold | Email + Push to PM | At SLA threshold | Yes (per priority level) |
| Request open beyond 2x SLA | Email + Push to Property Admin | At 2x SLA | Yes |
| Vendor non-responsive (no activity after assignment) | Push to PM + AI suggests alternative vendor | 48 hours | Yes (24 - 72 hours) |

**Default SLA Thresholds** (configurable per property at Settings > Maintenance > SLA):

| Priority | First Response SLA | Resolution SLA |
|----------|-------------------|----------------|
| Critical | 1 hour | 24 hours |
| High | 4 hours | 48 hours |
| Normal | 24 hours | 7 days |
| Low | 48 hours | 14 days |

---

## 10. API

### 10.1 Endpoints

| Method | Path | Description | Authorized Roles |
|--------|------|-------------|-----------------|
| `POST` | `/api/v1/properties/{propertyId}/maintenance-requests` | Create a new service request | PM, Admin, Resident (own unit only) |
| `GET` | `/api/v1/properties/{propertyId}/maintenance-requests` | List requests (filtered, paginated, sorted) | PM, Admin, Maintenance Staff (assigned only), Board (read-only) |
| `GET` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}` | Get single request detail | PM, Admin, Maintenance Staff (if assigned), Resident (if own) |
| `PATCH` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}` | Update request fields | PM, Admin, Maintenance Staff (status + comments only) |
| `DELETE` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}` | Soft-delete request | Admin only |
| `POST` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}/comments` | Add a comment | PM, Admin, Maintenance Staff, Resident (own request) |
| `POST` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}/attachments` | Upload photo or document | PM, Admin, Maintenance Staff, Resident (own request) |
| `DELETE` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}/attachments/{attachmentId}` | Remove an attachment | PM, Admin |
| `POST` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}/assign` | Assign employee and/or vendor | PM, Admin |
| `POST` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}/status` | Change status with reason/resolution | PM, Admin, Maintenance Staff |
| `POST` | `/api/v1/properties/{propertyId}/maintenance-requests/{requestId}/work-order` | Generate work order PDF | PM, Admin, Maintenance Staff |
| `GET` | `/api/v1/properties/{propertyId}/maintenance-categories` | List all categories | All authenticated users |
| `POST` | `/api/v1/properties/{propertyId}/maintenance-categories` | Create a category | Admin only |
| `PATCH` | `/api/v1/properties/{propertyId}/maintenance-categories/{categoryId}` | Update a category | Admin only |
| `DELETE` | `/api/v1/properties/{propertyId}/maintenance-categories/{categoryId}` | Deactivate a category (soft delete) | Admin only |
| `GET` | `/api/v1/properties/{propertyId}/maintenance-requests/analytics` | Analytics summary data | PM, Admin, Board (read-only) |
| `GET` | `/api/v1/properties/{propertyId}/response-templates` | List response templates | PM, Admin, Maintenance Staff |
| `POST` | `/api/v1/properties/{propertyId}/response-templates` | Create a template | PM, Admin |
| `GET` | `/api/v1/residents/me/maintenance-requests` | Current resident's own requests | Any resident role |

### 10.2 Request/Response Examples

#### Create Request (Staff)

**Request**:
```http
POST /api/v1/properties/prop-abc123/maintenance-requests
Content-Type: application/json
Authorization: Bearer {token}

{
  "unit_id": "unit-456",
  "resident_id": "user-789",
  "title": "Leaking faucet in kitchen",
  "description": "Kitchen faucet drips constantly from the handle base. Water pooling under sink cabinet.",
  "category_id": "cat-plumbing-leak",
  "priority": "high",
  "urgency_flag": false,
  "permission_to_enter": "yes",
  "entry_instructions": "Lockbox code: 4321. Small cat in unit, keep door closed.",
  "assigned_employee_id": "staff-101",
  "scheduled_date": "2026-03-16",
  "status": "open"
}
```

**Response** (201 Created):
```json
{
  "id": "mr-uuid-001",
  "reference_number": "SR-2026-00089",
  "status": "open",
  "priority": "high",
  "created_at": "2026-03-14T14:30:00Z",
  "ai_metadata": {
    "category_suggestion": {
      "suggested_category_id": "cat-plumbing-leak",
      "confidence": 0.95,
      "accepted": true
    },
    "priority_suggestion": {
      "suggested_priority": "high",
      "reasoning": "Active water leak can cause structural damage if delayed",
      "confidence": 0.89
    },
    "resolution_time_prediction": {
      "estimated_hours": 48,
      "confidence": 0.81
    }
  },
  "links": {
    "self": "/api/v1/properties/prop-abc123/maintenance-requests/mr-uuid-001",
    "comments": "/api/v1/properties/prop-abc123/maintenance-requests/mr-uuid-001/comments",
    "attachments": "/api/v1/properties/prop-abc123/maintenance-requests/mr-uuid-001/attachments"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "validation_error",
  "message": "Request validation failed",
  "details": [
    { "field": "title", "code": "too_short", "message": "Title must be between 5 and 200 characters" },
    { "field": "category_id", "code": "required", "message": "Please select a category" }
  ]
}
```

**Error Response** (403 Forbidden):
```json
{
  "error": "forbidden",
  "message": "You do not have permission to create requests for this unit"
}
```

#### List Requests (Filtered + Paginated)

**Request**:
```http
GET /api/v1/properties/prop-abc123/maintenance-requests?status=open,in_progress&priority=high,critical&assigned_employee_id=staff-101&sort=priority_desc&page=1&per_page=25
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "mr-uuid-001",
      "reference_number": "SR-2026-00089",
      "title": "Leaking faucet in kitchen",
      "unit": { "number": "1205", "building": "Main" },
      "resident": { "name": "Sarah Chen" },
      "category": { "id": "cat-plumbing-leak", "name": "Plumbing -- Leak" },
      "status": "open",
      "priority": "high",
      "urgency_flag": false,
      "assigned_employee": { "id": "staff-101", "name": "John Smith" },
      "assigned_vendor": null,
      "attachment_count": 2,
      "comment_count": 1,
      "created_at": "2026-03-14T14:30:00Z",
      "updated_at": "2026-03-14T15:10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total_items": 47,
    "total_pages": 2
  },
  "filters_applied": {
    "status": ["open", "in_progress"],
    "priority": ["high", "critical"],
    "assigned_employee_id": "staff-101"
  }
}
```

### 10.3 Rate Limits

| Endpoint Pattern | Rate Limit | Per |
|-----------------|------------|-----|
| `POST .../maintenance-requests` | 30 requests/min | Per user |
| `GET .../maintenance-requests` (list) | 120 requests/min | Per user |
| `POST .../attachments` | 20 uploads/min | Per user |
| `POST .../work-order` | 10 requests/min | Per user |
| `GET .../analytics` | 30 requests/min | Per user |
| `GET /residents/me/maintenance-requests` | 60 requests/min | Per user |

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header (seconds).

### 10.4 Webhooks

External integrations can subscribe to maintenance events:

| Event | Payload |
|-------|---------|
| `maintenance.request.created` | Full request object |
| `maintenance.request.status_changed` | Request ID + old status + new status + changed_by + timestamp |
| `maintenance.request.assigned` | Request ID + assignee type (employee/vendor) + assignee details |
| `maintenance.request.closed` | Full request object + resolution_notes |
| `maintenance.request.comment_added` | Request ID + comment object |
| `maintenance.vendor.compliance_expiring` | Vendor ID + document type + expiry date (v2) |

---

## 11. Completeness Checklist

### Core (v1) Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 1 | Service request creation -- staff form (22 fields) | 3.1.1 | Specified |
| 2 | Service request creation -- resident form (9 fields) | 3.1.1 | Specified |
| 3 | 43 configurable categories with admin management | 3.1.5 | Specified |
| 4 | Request listing with card and table views | 3.1.2 | Specified |
| 5 | Multi-field filtering (9 filter types) and sorting | 3.1.2 | Specified |
| 6 | Request detail view with progressive disclosure (8 sections) | 3.1.3 | Specified |
| 7 | Status change workflow with predefined responses | 3.1.3, 3.1.6 | Specified |
| 8 | Immutable activity timeline (16 event types) | 3.1.4 | Specified |
| 9 | Photo uploads (JPG/PNG/GIF/HEIC, 4 MB, max 10) | 3.1.1 | Specified |
| 10 | Document uploads (PDF/DOC/XLS, 4 MB, max 5) | 3.1.1 | Specified |
| 11 | Vendor assignment with compliance warnings | 3.1.8 | Specified |
| 12 | Equipment linkage with history display | 3.1.9 | Specified |
| 13 | Work order PDF generation | 3.1.7 | Specified |
| 14 | Priority system (4 levels) + urgency flag | 3.1.1 | Specified |
| 15 | Permission-to-enter with entry instructions | 3.1.1 | Specified |
| 16 | Bulk actions (6 actions) in table view | 3.1.2 | Specified |
| 17 | Export to Excel and PDF | 3.1.2 | Specified |
| 18 | Predefined response templates (6 defaults) | 3.1.6 | Specified |
| 19 | Internal notes (staff-only, hidden from residents) | 3.1.1, 3.1.3 | Specified |
| 20 | Auto-generated reference numbers | 1 (Key Facts) | Specified |

### Enhanced (v2) Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 21 | Recurring tasks with forecast view | 3.2.1 | Specified |
| 22 | Inspections with checklist builder (6 defaults) | 3.2.2 | Specified |
| 23 | Equipment tracking with lifecycle management | 3.2.3 | Specified |
| 24 | Equipment replacement report | 3.2.3 | Specified |
| 25 | Vendor compliance dashboard (5-status cards) | 3.2.4 | Specified |
| 26 | Automated compliance alerts | 3.2.4 | Specified |
| 27 | Alteration projects with permits and deposits | 3.2.5 | Specified |
| 28 | Momentum indicator for alterations | 3.2.5 | Specified |

### AI Capabilities (12 total)

| # | AI Feature | AI Framework ID | Section | Default |
|---|------------|----------------|---------|---------|
| 29 | Auto-Categorization | #23 | 7.1 | Enabled |
| 30 | Priority Suggestion | #24 | 7.2 | Enabled |
| 31 | Duplicate Detection | #25 | 7.3 | Enabled |
| 32 | Vendor Recommendation | #26 | 7.4 | Enabled |
| 33 | Cost Estimation | #31 | 7.5 | Disabled |
| 34 | Predictive Maintenance | #33 | 7.6 | Disabled |
| 35 | Workload Balancing | #30 | 7.7 | Enabled |
| 36 | Closure Quality Check | #34 | 7.8 | Enabled |
| 37 | Damage Photo Analysis | #29 | 7.9 | Disabled |
| 38 | Parts Suggestion | new | 7.10 | Disabled |
| 39 | Resolution Time Prediction | #27 | 7.11 | Enabled |
| 40 | Resident Satisfaction Prediction | new | 7.12 | Disabled |

### UX Requirements

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 41 | Desktop layout (1280px+) | 6.1 | Specified |
| 42 | Tablet layout (768-1279px) | 6.2 | Specified |
| 43 | Mobile layout (< 768px) | 6.3 | Specified |
| 44 | Loading states for all components (8 types) | 6.4 | Specified |
| 45 | Error states for all failure scenarios (10 types) | 6.5 | Specified |
| 46 | Empty states with guidance and CTAs (9 contexts) | 6.6 | Specified |
| 47 | Accessibility -- WCAG AA compliance | 6.7 | Specified |
| 48 | Tooltips for complex features | 3.1.1 | Specified |
| 49 | Progressive disclosure on detail view | 3.1.3 | Specified |
| 50 | Color-coded status and priority badges | 3.1.2 | Specified |

### Data and API

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 51 | Full data model with types, lengths, defaults, validations | 4 | Specified |
| 52 | AI metadata JSONB structure with examples | 4.3 | Specified |
| 53 | REST API endpoints (19 endpoints) | 10.1 | Specified |
| 54 | Request/response examples with error cases | 10.2 | Specified |
| 55 | Rate limits per endpoint | 10.3 | Specified |
| 56 | Webhook events (6 event types) | 10.4 | Specified |
| 57 | Role-based API authorization per endpoint | 10.1 | Specified |

### Notifications

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 58 | Multi-channel notifications (Email, Push, SMS) | 9.1 | Specified |
| 59 | 12 notification event types with templates | 9.1 | Specified |
| 60 | Resident notification preferences (4 types) | 9.2 | Specified |
| 61 | Escalation rules with configurable thresholds | 9.3 | Specified |
| 62 | SLA thresholds per priority level | 9.3 | Specified |

### Analytics

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 63 | Real-time operational dashboard (8 metrics) | 8.1 | Specified |
| 64 | Performance reports (8 report types) | 8.2 | Specified |
| 65 | AI analytics (7 tracked metrics) | 8.3 | Specified |

**Total requirements: 65** | **All specified: Yes**

---

*End of document.*
