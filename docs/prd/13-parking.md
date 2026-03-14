# 13 -- Parking Management

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 03-Security Console, 07-Unit Management, 19-AI Framework

---

## 1. Overview

Parking Management handles every aspect of vehicle-related operations in a residential building: visitor parking registration, permit lifecycle, violation enforcement, spot inventory, and zone management. It connects the security console (where visitor parking is logged in real time) with the administrative layer (where permits are issued and spots are allocated).

### Why This Module Exists

Parking is one of the most frequent sources of resident complaints, enforcement disputes, and operational overhead in condo environments. Industry research revealed three distinct approaches:

- One platform treats parking as a text field on the unit profile -- no enforcement, no tracking, no permits.
- Another builds full permit lifecycle management with configurable types, printing, and area assignment.
- A third integrates visitor parking directly into the security console with vehicle details captured at check-in.

Concierge combines all three approaches: visitor parking flows through the Security Console for real-time operations, the permit system provides structured lifecycle management, and the violation workflow enables documented enforcement with photo evidence and escalation paths.

### Key Facts

| Aspect | Detail |
|--------|--------|
| **Visitor parking** | Registered at front desk or security console. Unit, plate, make/model, spot, time in/out. |
| **Permit types** | Resident, Visitor (extended), Temporary, Handicap -- configurable per property |
| **Permit lifecycle** | Apply > Review > Approve/Deny > Issue > Active > Renew/Revoke/Expire |
| **Violations** | Create with photo evidence > Track > Escalate > Resolve. Four severity types. |
| **Spot inventory** | Property-wide spot tracking with zone/area assignment and occupancy status |
| **AI capabilities** | 5 features: License Plate OCR, Violation Pattern Detection, Permit Expiry Prediction, Utilization Analysis, Visitor Abuse Detection |
| **Integration** | Security Console (visitor parking), Unit Management (resident vehicles), Reports (parking analytics) |

---

## 2. Research Summary

### What Industry Leaders Do Well

| # | Finding | Source | Concierge Decision |
|---|---------|--------|--------------------|
| 1 | **Dedicated parking violation section** with Ban, Ticket, Warning, and Vehicle Towed types -- gives enforcement real teeth | Competitive analysis | Adopt all four violation types plus add "Notice" as a softer first step |
| 2 | **Auto-expiring bans** with a date-picker for "Automatically Lift Ban On" -- prevents forgotten perpetual bans | Competitive analysis | Implement auto-expiry on all violation types with configurable durations |
| 3 | **Visitor parking integrated into security console** with vehicle make/model, license plate, province, and parking-until time | Competitive analysis | Visitor parking creation lives in Security Console; management and reporting live here |
| 4 | **Print Parking Permit** button on visitor detail dialog -- immediate physical permit for windshield display | Competitive analysis | Implement permit printing for both visitor and resident permits |
| 5 | **License plate search** across both visitor parking and violations -- unified plate lookup | Competitive analysis | Global plate search spanning visitors, permits, and violations |
| 6 | **Reference numbers** on every violation for verbal and written communication | Competitive analysis | Auto-generated reference numbers on all parking records (format: `PRK-YYYY-NNNNN`) |
| 7 | **Full permit system** with configurable types, areas, and printing | Competitive analysis | Build configurable permit types with full lifecycle management |

### What Industry Leaders Get Wrong

| # | Problem | Concierge Fix |
|---|---------|---------------|
| 1 | **No photo evidence on violations** -- disputes become he-said/she-said | Require photo upload on violation creation. Support up to 5 photos per violation. |
| 2 | **No connection between visitor parking and violations** -- staff cannot see that a plate was previously warned | Unified plate history: every registration, permit, and violation linked by plate number |
| 3 | **No abuse detection** -- the same visitor plate appears 50 times in a month and nobody notices | AI-powered abuse detection flags repeat visitor plates exceeding configurable thresholds |
| 4 | **Parking is a text field on the unit profile** -- no spot inventory, no tracking, no enforcement | Full spot inventory with zones, areas, types, and occupancy tracking |
| 5 | **No permit expiry alerts** -- permits expire silently, creating enforcement confusion | Automated expiry notifications at 30, 14, and 7 days before expiration |
| 6 | **No analytics on parking utilization** -- property managers guess at capacity needs | AI-powered utilization analysis with peak-time heatmaps and capacity forecasting |

---

## 3. Feature Spec

### 3.1 Visitor Parking Registration

Visitor parking is created from the Security Console (see PRD 03) but managed and reported on within the Parking module.

#### 3.1.1 Create Visitor Parking

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Building | Select dropdown | -- | Yes | User's assigned building | Must select a building | "Please select a building" |
| Unit | Autocomplete text | 20 chars | Yes | Empty | Must match an existing unit | "Unit not found. Please select a valid unit." |
| Visitor Name | Text input | 100 chars | Yes | Empty | Min 2 characters | "Visitor name must be at least 2 characters" |
| Visitor Type | Radio buttons | -- | Yes | "Visitor" | Must select from configured visitor types | "Please select a visitor type" |
| Needs Parking | Toggle | -- | Yes | true | -- | -- |
| License Plate | Text input | 15 chars | Yes (if needs_parking) | Empty | Alphanumeric, auto-uppercase, strip spaces | "Please enter a valid license plate number" |
| Comments | Textarea | 500 chars | Optional | Empty | Always visible regardless of needs_parking toggle | -- |
| Province/State | Select dropdown | -- | Yes (if needs_parking) | Property's province | Must select from list. Visible only when needs_parking is true. | "Please select a province or state" |
| Vehicle Make | Text input | 50 chars | Optional | Empty | Visible only when needs_parking is true | -- |
| Vehicle Model | Text input | 50 chars | Optional | Empty | Visible only when needs_parking is true | -- |
| Vehicle Color | Select dropdown | -- | Optional | Empty | Predefined color list. Visible only when needs_parking is true. | -- |
| Parking Spot | Select dropdown | -- | Optional | "Any Available" | Must be an active visitor spot or "Any Available". Visible only when needs_parking is true. | "Selected spot is not available" |
| Parking Until | Datetime picker | -- | Yes (if needs_parking) | Current time + property's default visitor duration (e.g., 24 hours) | Must be in the future. Max 7 days from now (configurable). Visible only when needs_parking is true. | "Parking end time must be in the future" / "Maximum visitor parking duration is {n} days" |
| Photo | File upload | 10 MB | Optional | Empty | JPG, PNG, HEIC. Max 3 photos. On devices with cameras, the upload control offers both "Take Photo" (camera capture, rear camera default) and "Upload File" (gallery/file picker) options. | "File must be JPG, PNG, or HEIC and under 10 MB" |

**Buttons**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Save | Creates visitor parking record and assigns spot | Toast: "Visitor parking registered. Ref #{ref}" + record appears in table | Inline field errors highlighted in red. Toast: "Could not save. Check highlighted fields." | Button text changes to "Saving..." with spinner. Button disabled. |
| Save & Print | Creates record and opens print dialog for parking pass | Same as Save, then browser print dialog opens with formatted pass | Same as Save | "Saving..." then "Preparing print..." |
| Cancel | Closes form without saving | Form closes, no record created | -- | -- |

**Visitor Types** (admin-configurable, system defaults):

| Type | Icon | Description |
|------|------|-------------|
| Visitor | person | General visitor (friend, family, guest) |
| Contractor | hard-hat | Contractor or tradesperson |
| Delivery | truck | Delivery driver |

Properties can add custom visitor types via Settings > Parking > Visitor Types (e.g., "Real Estate Agent", "Moving Company", "Emergency Service"). Each type has a name (50 chars), icon (from system set), sort_order, and active toggle.

**Progressive disclosure**: When `needs_parking` is toggled off, all vehicle and parking fields (License Plate, Province/State, Vehicle Make/Model/Color, Parking Spot, Parking Until) collapse with a smooth animation. This supports logging visitors who arrive without a vehicle (e.g., dropped off by taxi, walked in).

#### 3.1.2 Sign Out Visitor Parking

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Sign Out | Sets departure time to now, releases parking spot | Toast: "Visitor signed out." Row updates with departure time. Spot status changes to Available. | Toast: "Could not sign out visitor. Please try again." | "Signing out..." with spinner |
| Batch Sign Out | Sets departure time to now for all selected (or all currently parked) visitors | Confirmation modal: "Sign out {n} visitors? This will set the departure time to now for all selected visitors." On confirm: Toast: "{n} visitors signed out." All rows update. Spots released. | Toast: "Could not sign out visitors. Please try again." | "Signing out {n} visitors..." |

**Batch Sign Out** is available when the Status filter is "Currently Parked" and at least 2 records exist. It appears as a secondary button above the table. Staff can either select specific rows via checkboxes or use "Sign Out All" to sign out every currently parked visitor.

#### 3.1.2b Extend Visitor Parking

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Extend | Opens a minimal modal with a datetime picker for new `parking_until` value and an optional comment field (200 chars) | Toast: "Parking extended until {new_time}." Row updates with new parking_until. | Toast: "Could not extend parking." | "Extending..." |

The Extend button appears as a quick action on each visitor parking table row (alongside View, Edit, Sign Out, Print, Delete). It is faster than a full edit for the common scenario of "visitor needs another hour."

#### 3.1.3 Visitor Parking Table

| Column | Sortable | Description |
|--------|----------|-------------|
| Ref # | Yes | Auto-generated reference (e.g., `PRK-2026-00412`) |
| Unit | Yes | Unit number the visitor is associated with |
| Visitor Name | Yes | Name of the visitor |
| License Plate | Yes | Vehicle plate number |
| Spot | Yes | Assigned parking spot (or "Any") |
| Arrival | Yes (default: desc) | Check-in timestamp |
| Departure | Yes | Check-out timestamp or "Still parked" badge (blue) |
| Duration | No | Calculated time parked. Red text if exceeding permit time. |
| Created By | Yes | Staff member who created the entry |
| Actions | No | View, Edit, Extend, Sign Out, Print, Delete |

**Empty state**: Illustration of an empty parking lot. Heading: "No visitor parking records." Subtext: "Visitor parking records will appear here when visitors are registered through the Security Console." Button: "Register Visitor Parking" (opens creation form).

**Filters**:

| Filter | Type | Default | Options |
|--------|------|---------|---------|
| Status | Segmented control | "Currently Parked" | Currently Parked, Signed Out, All |
| Date Range | Date range picker | Last 7 days | Any range |
| Building | Dropdown | All Buildings | List of buildings |
| Unit | Autocomplete | All | Any unit |
| Plate Search | Text input | Empty | Free text, searches partial match |
| Show Deleted | Toggle | Off | Visible to PM and Admin only. When enabled, soft-deleted records appear with strikethrough styling and a "Deleted" badge. A "Restore" action appears on deleted rows. |

**Pagination**: 25 rows per page. Previous/Next with page numbers. Row-per-page selector: 10, 25, 50, 100.

### 3.2 Parking Permits

#### 3.2.1 Permit Types (Admin-Configurable)

Properties configure their own permit types. System defaults:

| Permit Type | Duration | Renewable | Requires Approval | Max Per Unit | Default Color |
|-------------|----------|-----------|-------------------|-------------|---------------|
| Resident | 1 year | Yes (auto-renew option) | No | Configurable (default: 2) | Blue |
| Visitor (Extended) | 1-30 days | Yes | Yes (if > 7 days) | Configurable (default: 1) | Green |
| Temporary | 1-90 days | No | Yes | 1 | Orange |
| Handicap | 1 year | Yes | Yes (requires documentation) | 1 | Blue with accessible icon |

**Tooltip** (on Permit Types settings): "Permit types control what kinds of parking passes your property offers. Each type has its own duration, approval rules, and limits per unit."

#### 3.2.2 Permit Application Form

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Permit Type | Select dropdown | -- | Yes | Empty | Must select a type | "Please select a permit type" |
| Unit | Autocomplete | 20 chars | Yes | Applicant's unit (if resident) | Must match existing unit | "Unit not found" |
| Applicant | Autocomplete | 100 chars | Yes | Logged-in user (if resident) | Must match existing resident | "Resident not found" |
| Vehicle License Plate | Text input | 15 chars | Yes | Empty | Alphanumeric, auto-uppercase | "Please enter a valid license plate" |
| Vehicle Make | Text input | 50 chars | Yes | Empty | Min 2 chars | "Please enter the vehicle make" |
| Vehicle Model | Text input | 50 chars | Yes | Empty | Min 2 chars | "Please enter the vehicle model" |
| Vehicle Year | Number input | 4 digits | Optional | Empty | 1900-current year+1 | "Please enter a valid year" |
| Vehicle Color | Select dropdown | -- | Yes | Empty | Must select | "Please select a vehicle color" |
| Parking Area | Select dropdown | -- | Yes (if property has zones) | Empty | Must select an area with available spots | "No spots available in selected area" |
| Assigned Spot | Select dropdown | -- | Optional | "Auto-assign" | Spot must be available | "Spot {number} is already assigned" |
| Start Date | Date picker | -- | Yes | Today | Cannot be in the past | "Start date cannot be in the past" |
| End Date | Date picker | -- | Yes | Today + permit type default duration | Must be after start date. Within permit type max duration. | "End date must be after start date" / "Maximum duration for this permit type is {n} days" |
| Supporting Documents | File upload | 10 MB each | Conditional (Handicap requires) | Empty | PDF, JPG, PNG. Max 3 files. | "Handicap permits require supporting documentation" |
| Notes | Textarea | 500 chars | Optional | Empty | -- | -- |

**Buttons**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Submit Application | Creates permit in "Pending Review" status | Toast: "Permit application submitted. You will be notified when it is reviewed." Redirects to permit list. | Inline errors on invalid fields | "Submitting..." with spinner |
| Save as Draft | Saves without submitting for review | Toast: "Draft saved." | Toast: "Could not save draft." | "Saving..." |
| Cancel | Returns to permit list | No record created | -- | -- |

#### 3.2.3 Permit Lifecycle

```
Apply (Pending Review)
  |
  +-- Approve --> Issue (Active)
  |                 |
  |                 +-- Renew --> Active (new dates)
  |                 |
  |                 +-- Revoke --> Revoked (with reason)
  |                 |
  |                 +-- Expire --> Expired (auto, on end date)
  |
  +-- Deny --> Denied (with reason)
  |
  +-- Request Changes --> Pending Review (applicant edits and resubmits)
```

**Status definitions**:

| Status | Badge Color | Description |
|--------|-------------|-------------|
| Draft | Gray | Saved but not submitted |
| Pending Review | Yellow | Submitted, awaiting admin approval |
| Active | Green | Approved, issued, and currently valid |
| Expired | Red | Past end date, no longer valid |
| Revoked | Red | Manually terminated before expiry |
| Denied | Red | Application rejected |

#### 3.2.4 Permit Approval (Admin/Property Manager)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Decision | Radio buttons | Yes | Approve, Deny, Request Changes |
| Assigned Spot | Select dropdown | Yes (if approving and not pre-assigned) | Pick from available spots in requested area |
| Reason (Deny/Request Changes) | Textarea, 500 chars | Yes (if denying or requesting changes) | Explanation sent to applicant |
| Internal Notes | Textarea, 500 chars | Optional | Staff-only notes, not visible to applicant |

**Buttons**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Confirm Decision | Applies the selected decision | Toast: "Permit {approved/denied}." Notification sent to applicant. | Toast: "Could not process. Try again." | "Processing..." |

#### 3.2.5 Permit List Table

| Column | Sortable | Description |
|--------|----------|-------------|
| Permit # | Yes | Auto-generated (e.g., `PRM-2026-00089`) |
| Type | Yes | Permit type name with color dot |
| Unit | Yes | Unit number |
| Resident | Yes | Resident name |
| License Plate | Yes | Vehicle plate |
| Vehicle | No | Make, model, color combined |
| Spot | Yes | Assigned spot number |
| Area/Zone | Yes | Parking area name |
| Valid From | Yes | Start date |
| Valid Until | Yes (default sort: asc for active) | End date. Red text if expiring within 30 days. |
| Status | Yes | Status badge |
| Actions | No | View, Edit, Renew, Revoke, Print, Delete |

**Empty state**: Illustration of a parking permit. Heading: "No parking permits yet." Subtext: "Parking permits help you track and manage who is authorized to park in your building." Button: "Create First Permit Type" (links to Settings if no permit types configured) or "Issue a Permit" (if types exist).

**Filters**:

| Filter | Type | Default |
|--------|------|---------|
| Status | Segmented control | "Active" |
| Permit Type | Multi-select dropdown | All |
| Area/Zone | Dropdown | All |
| Expiring Soon | Toggle | Off (when On, shows permits expiring within 30 days) |
| Search | Text input | Searches plate, name, unit |

### 3.3 Parking Violations

#### 3.3.1 Create Violation

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Building | Select dropdown | -- | Yes | User's building | Must select | "Please select a building" |
| License Plate | Text input | 15 chars | Yes | Empty | Alphanumeric, auto-uppercase | "Please enter a license plate number" |
| Violation Type | Radio buttons | -- | Yes | Empty | Must select one | "Please select a violation type" |
| Location | Text input | 100 chars | Yes | Empty | Min 2 chars | "Please describe where the violation occurred" |
| Description | Textarea | 1000 chars | Yes | Empty | Min 10 chars | "Please provide at least 10 characters describing the violation" |
| Photos | File upload | 10 MB each | Yes (min 1) | Empty | JPG, PNG, HEIC. Min 1, max 5 photos. On devices with cameras, the upload control offers both "Take Photo" (camera capture, rear camera default) and "Upload File" (gallery/file picker) options. | "At least one photo is required as evidence" |
| Auto-Expire On | Date picker | -- | Optional | Empty (no auto-expiry) | Must be in the future | "Expiry date must be in the future" |
| Related Unit | Autocomplete | 20 chars | Optional | Empty | Must match existing unit if provided | "Unit not found" |
| Notify Unit Owner | Checkbox | -- | Optional | Checked (if unit linked) | -- | -- |

**Violation Types**:

| Type | Severity | Icon | Description |
|------|----------|------|-------------|
| Notice | Low | Info circle (blue) | Informational first warning. No enforcement action. |
| Warning | Medium | Warning triangle (yellow) | Formal warning. Documented but no penalty. |
| Ticket | High | Ticket icon (orange) | Fine or penalty issued. |
| Ban | Critical | Ban circle (red) | Vehicle banned from property. Enforced at gate/entry. |
| Vehicle Towed | Critical | Tow truck icon (red) | Vehicle has been or will be towed. |

**Buttons**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Issue Violation | Creates violation record, sends notification if unit linked | Toast: "Violation #{ref} issued." Shows plate history if prior violations exist. | Inline errors | "Issuing..." |
| Cancel | Closes form | No record created | -- | -- |

**Progressive disclosure**: When the License Plate field is filled and focus leaves, the system auto-searches for plate history. If prior records exist, an info banner appears: "This plate has {n} prior record(s). [View History]" -- clicking opens the plate history panel.

#### 3.3.2 Violation Resolution

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Resolution Type | Select dropdown | Yes | Resolved, Dismissed, Appealed & Overturned, Auto-Expired |
| Resolution Notes | Textarea, 500 chars | Yes | Explanation of resolution |
| Resolved By | Auto-populated | -- | Current user |

**Buttons**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Resolve | Sets violation status to resolved | Toast: "Violation resolved." Status badge updates. | Toast: "Could not resolve." | "Resolving..." |

#### 3.3.3 Violation Table

| Column | Sortable | Description |
|--------|----------|-------------|
| Ref # | Yes | Auto-generated (e.g., `VIO-2026-00034`) |
| Type | Yes | Violation type with color-coded icon |
| License Plate | Yes | Offending plate |
| Location | Yes | Where the violation occurred |
| Unit | Yes | Linked unit (if any) |
| Issued By | Yes | Staff member |
| Issued At | Yes (default: desc) | Timestamp |
| Status | Yes | Open, Resolved, Auto-Expired |
| Auto-Expires | Yes | Expiry date or "--" |
| Actions | No | View, Edit, Resolve, Print, Delete |

**Empty state**: Illustration of a checkmark over a parking lot. Heading: "No parking violations recorded." Subtext: "When parking violations are issued, they will appear here with full history and evidence."

**Filters**:

| Filter | Type | Default | Options |
|--------|------|---------|---------|
| Status | Segmented control | "Open" | Open, Resolved, Auto-Expired, All |
| Violation Type | Multi-select dropdown | All | Notice, Warning, Ticket, Ban, Vehicle Towed |
| Date Range | Date range picker | Last 30 days | Any range |
| Plate Search | Text input | Empty | Free text, searches partial match |
| Show Deleted | Toggle | Off | Visible to PM and Admin only. When enabled, soft-deleted records appear with strikethrough styling and a "Deleted" badge. A "Restore" action appears on deleted rows. |

**Pagination**: 25 rows per page. Previous/Next with page numbers. Row-per-page selector: 10, 25, 50, 100.

### 3.4 Parking Spot Inventory

#### 3.4.1 Spot Entity

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Spot Number | Text input | 20 chars | Yes | Empty | Unique within the area | "Spot number already exists in this area" |
| Area/Zone | Select dropdown | -- | Yes | Empty | Must select an area | "Please select an area" |
| Spot Type | Select dropdown | -- | Yes | "Standard" | Must select | "Please select a spot type" |
| Floor/Level | Text input | 10 chars | Optional | Empty | -- | -- |
| Status | Select dropdown | -- | Yes | "Available" | -- | -- |
| Assigned To (Unit) | Autocomplete | 20 chars | Optional | Empty | Must match existing unit | "Unit not found" |
| Assigned To (Permit) | Select dropdown | -- | Optional | Empty | Must match active permit | -- |
| Notes | Textarea | 200 chars | Optional | Empty | -- | -- |

**Spot Types**: Standard, Compact, Oversized, Handicap, EV Charging, Visitor, Reserved, Loading.

**Spot Statuses**: Available, Occupied, Reserved, Maintenance, Out of Service.

#### 3.4.2 Area/Zone Management

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Area Name | Text input | 50 chars | Yes | Empty | Unique within property | "An area with this name already exists" |
| Area Code | Text input | 10 chars | Yes | Auto-generated from name | Unique, alphanumeric | "Area code already in use" |
| Building | Select dropdown | -- | Yes | User's building | Must select | "Please select a building" |
| Total Spots | Number input | 4 digits | Yes | 0 | Positive integer | "Total spots must be a positive number" |
| Visitor Spots | Number input | 4 digits | Yes | 0 | Cannot exceed total spots | "Visitor spots cannot exceed total spots" |
| Description | Textarea | 200 chars | Optional | Empty | -- | -- |
| Active | Toggle | -- | Yes | On | -- | -- |

**Buttons**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Save Area | Creates or updates parking area | Toast: "Area saved." Table refreshes. | Inline errors | "Saving..." |
| Bulk Add Spots | Opens modal to create N spots with auto-numbering | Toast: "{n} spots created in {area}." | Toast: "Could not create spots." | "Creating {n} spots..." |
| Delete Area | Soft-deletes area (only if no active assignments) | Toast: "Area deleted." | Toast: "Cannot delete area with active assignments. Remove all assignments first." | "Deleting..." |

#### 3.4.3 Spot Inventory Dashboard

Visual grid showing all spots organized by area with color-coded status:

| Color | Status | Meaning |
|-------|--------|---------|
| Green | Available | Spot is open |
| Blue | Occupied (Resident) | Assigned to a resident permit |
| Teal | Occupied (Visitor) | Visitor currently parked |
| Orange | Reserved | Reserved but not currently occupied |
| Gray | Maintenance / Out of Service | Temporarily unavailable |

**Desktop**: Grid of spot cards grouped by area. Each card shows spot number, status dot, assigned plate (if occupied).
**Tablet**: Same grid, 3 columns.
**Mobile**: Stacked list view with swipe actions.

**Empty state**: Heading: "No parking areas configured." Subtext: "Set up your parking areas and spots to start managing your building's parking inventory." Button: "Add First Parking Area."

### 3.5 Enforcement Workflow

```
1. Staff observes violation
   |
2. Staff creates Violation record (photo required)
   |
3. System checks plate history:
   - No prior records --> Notice or Warning issued
   - Prior warnings exist --> Ticket or Ban recommended (AI suggestion)
   - Active ban exists --> Alert: "This plate is currently banned"
   |
4. If unit is linked, notification sent to unit owner
   |
5. Violation tracked in table with full audit history
   |
6. Resolution:
   a. Owner acknowledges / pays fine --> Resolved
   b. Owner appeals --> Appealed (admin reviews)
   c. Auto-expire date reached --> Auto-Expired
   d. Admin dismisses --> Dismissed
```

### 3.6 Permit Printing

Permits print to standard paper (letter/A4) with the following layout:

| Section | Content |
|---------|---------|
| Header | Property name, logo, "PARKING PERMIT" title |
| Permit Details | Permit #, type, valid from/to dates |
| Vehicle Info | License plate (large font), make, model, color, year |
| Assignment | Spot number, area/zone, floor/level |
| Resident Info | Name, unit number |
| Footer | "Display this permit on your dashboard at all times." + property contact info |
| QR Code | Links to digital permit verification page |

**Visitor parking passes** print as half-page with the following layout:

| Section | Content |
|---------|---------|
| Header | Property name, logo, "VISITOR PARKING PASS" title |
| Visitor Info | Visitor name, unit being visited, visitor type (Visitor/Contractor/Delivery) |
| Vehicle Info | License plate (large font, bold), make, model, color, province/state |
| Assignment | Spot number (or "General Visitor Parking" if "Any Available"), area/zone |
| Validity | Valid from: arrival time. Valid until: parking_until time. Both formatted as date + time. |
| Staff | Issuing staff name, creation timestamp |
| Footer | "Display this pass on your dashboard. Remove upon departure." + property contact info |
| QR Code | Links to digital pass verification page |

---

## 4. Data Model

### 4.1 VisitorParking

```
VisitorParking
 id                  UUID, auto-generated
 property_id         UUID -> Property
 building_id         UUID -> Building
 unit_id             UUID -> Unit
 visitor_name        VARCHAR(100), required
 visitor_type_id     UUID -> VisitorType, required
 needs_parking       BOOLEAN, default: true
 license_plate       VARCHAR(15), uppercase, indexed
 province_state      VARCHAR(50)
 vehicle_make        VARCHAR(50), nullable
 vehicle_model       VARCHAR(50), nullable
 vehicle_color       VARCHAR(30), nullable
 spot_id             UUID -> ParkingSpot, nullable
 arrival_at          TIMESTAMP WITH TZ, default: now()
 departure_at        TIMESTAMP WITH TZ, nullable
 parking_until       TIMESTAMP WITH TZ, required
 photos[]            -> Attachment
 comments            TEXT(500), nullable
 reference_number    VARCHAR(20), auto-generated, unique per property
 created_by          UUID -> User
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
 deleted_at          TIMESTAMP WITH TZ, nullable (soft delete)
 ai_metadata         JSONB, nullable
```

### 4.2 ParkingPermit

```
ParkingPermit
 id                  UUID, auto-generated
 property_id         UUID -> Property
 permit_type_id      UUID -> PermitType
 unit_id             UUID -> Unit
 resident_id         UUID -> Resident
 license_plate       VARCHAR(15), uppercase, indexed
 vehicle_make        VARCHAR(50)
 vehicle_model       VARCHAR(50)
 vehicle_year        SMALLINT, nullable
 vehicle_color       VARCHAR(30)
 area_id             UUID -> ParkingArea
 spot_id             UUID -> ParkingSpot, nullable
 status              ENUM(draft, pending_review, active, expired, revoked, denied)
 valid_from          DATE, required
 valid_until         DATE, required
 auto_renew          BOOLEAN, default: false
 supporting_docs[]   -> Attachment
 notes               TEXT(500), nullable
 approved_by         UUID -> User, nullable
 approved_at         TIMESTAMP WITH TZ, nullable
 denied_reason       TEXT(500), nullable
 revoked_reason      TEXT(500), nullable
 revoked_by          UUID -> User, nullable
 revoked_at          TIMESTAMP WITH TZ, nullable
 reference_number    VARCHAR(20), auto-generated, unique per property
 created_by          UUID -> User
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
 ai_metadata         JSONB, nullable
```

### 4.3 ParkingViolation

```
ParkingViolation
 id                  UUID, auto-generated
 property_id         UUID -> Property
 building_id         UUID -> Building
 license_plate       VARCHAR(15), uppercase, indexed
 violation_type      ENUM(notice, warning, ticket, ban, vehicle_towed)
 location            VARCHAR(100)
 description         TEXT(1000)
 photos[]            -> Attachment (min 1, max 5)
 unit_id             UUID -> Unit, nullable
 status              ENUM(open, resolved, auto_expired)
 auto_expire_on      DATE, nullable
 resolution_type     ENUM(resolved, dismissed, appealed_overturned, auto_expired), nullable
 resolution_notes    TEXT(500), nullable
 resolved_by         UUID -> User, nullable
 resolved_at         TIMESTAMP WITH TZ, nullable
 notify_unit_owner   BOOLEAN, default: true
 reference_number    VARCHAR(20), auto-generated, unique per property
 issued_by           UUID -> User
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
 deleted_at          TIMESTAMP WITH TZ, nullable (soft delete)
 ai_metadata         JSONB, nullable
```

### 4.4 ParkingSpot

```
ParkingSpot
 id                  UUID, auto-generated
 property_id         UUID -> Property
 area_id             UUID -> ParkingArea
 spot_number         VARCHAR(20), unique per area
 spot_type           ENUM(standard, compact, oversized, handicap, ev_charging, visitor, reserved, loading)
 floor_level         VARCHAR(10), nullable
 status              ENUM(available, occupied, reserved, maintenance, out_of_service)
 assigned_unit_id    UUID -> Unit, nullable
 assigned_permit_id  UUID -> ParkingPermit, nullable
 notes               TEXT(200), nullable
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
```

### 4.5 ParkingArea

```
ParkingArea
 id                  UUID, auto-generated
 property_id         UUID -> Property
 building_id         UUID -> Building
 area_name           VARCHAR(50), unique per property
 area_code           VARCHAR(10), unique per property
 total_spots         INTEGER
 visitor_spots       INTEGER
 description         TEXT(200), nullable
 active              BOOLEAN, default: true
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
```

### 4.6 PermitType

```
PermitType
 id                  UUID, auto-generated
 property_id         UUID -> Property (nullable for system defaults)
 name                VARCHAR(50)
 default_duration_days INTEGER
 renewable           BOOLEAN
 auto_renew_option   BOOLEAN
 requires_approval   BOOLEAN
 max_per_unit        INTEGER, default: 1
 color               VARCHAR(7), hex
 sort_order          INTEGER
 active              BOOLEAN, default: true
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
```

### 4.7 VisitorType

```
VisitorType
 id                  UUID, auto-generated
 property_id         UUID -> Property (nullable for system defaults)
 name                VARCHAR(50), required
 icon                VARCHAR(30), required
 sort_order          INTEGER, default: 0
 active              BOOLEAN, default: true
 created_at          TIMESTAMP WITH TZ
 updated_at          TIMESTAMP WITH TZ
```

### 4.8 Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_visitor_plate` | `property_id, license_plate` | Fast plate lookup across visitor records |
| `idx_permit_plate` | `property_id, license_plate` | Fast plate lookup across permits |
| `idx_violation_plate` | `property_id, license_plate` | Fast plate lookup across violations |
| `idx_visitor_active` | `property_id, departure_at` WHERE `departure_at IS NULL` | Active visitor parking query |
| `idx_permit_active` | `property_id, status, valid_until` WHERE `status = 'active'` | Active permits query |
| `idx_violation_open` | `property_id, status` WHERE `status = 'open'` | Open violations query |
| `idx_spot_status` | `property_id, area_id, status` | Spot availability lookup |

---

## 5. User Flows

### 5.1 Front Desk: Register Visitor Parking (5 steps)

1. Staff clicks "Visitor Parking" icon on Security Console (or navigates to Parking > Visitor Parking > "Register").
2. Staff selects building and unit. System auto-fills unit if the visitor mentions it.
3. Staff enters visitor name, license plate, and selects vehicle details. **AI**: If a photo of the plate is uploaded, License Plate OCR auto-fills the plate field.
4. Staff selects parking spot (or leaves as "Any Available"). System shows available spots in a dropdown with occupancy count.
5. Staff clicks "Save" or "Save & Print." Record created, spot marked as occupied, event logged in Security Console.

### 5.2 Resident: Apply for Parking Permit (4 steps)

1. Resident navigates to Parking in their portal. Sees their current permits (if any) and a "Request Permit" button.
2. Resident fills out permit application form: selects type, enters vehicle details, selects preferred area.
3. Resident uploads supporting documents (if required by permit type, e.g., Handicap).
4. Resident clicks "Submit Application." Status set to "Pending Review." Notification sent to Property Manager.

### 5.3 Property Manager: Approve Permit (3 steps)

1. Property Manager sees pending permit badge on dashboard. Clicks to go to Permits > Pending Review tab.
2. Manager reviews application details, vehicle info, and supporting docs. Manager assigns a specific spot (or confirms auto-assign).
3. Manager selects "Approve" and clicks "Confirm Decision." Permit status becomes Active. Resident notified. Spot marked as Reserved.

### 5.4 Security Guard: Issue Violation (4 steps)

1. Guard navigates to Parking > Violations > "Issue Violation" (or uses quick action from Security Console).
2. Guard enters license plate. **AI**: System auto-checks plate history and shows prior records banner if any exist.
3. Guard selects violation type (system may suggest severity based on prior record count via AI). Guard captures at least 1 photo, enters location and description.
4. Guard clicks "Issue Violation." Record created with reference number. If unit is linked, notification sent to owner.

### 5.5 Property Manager: Resolve Violation (3 steps)

1. Manager navigates to Parking > Violations > filters "Open" status.
2. Manager opens violation detail. Reviews photos, description, plate history, and any resident response.
3. Manager selects resolution type, adds notes, clicks "Resolve." Violation closed. Audit trail updated.

---

## 6. UI/UX

### 6.1 Navigation Structure

```
Parking (sidebar menu item, car icon)
 +-- Visitor Parking (default view)
 +-- Permits
 |     +-- All Permits (list)
 |     +-- Pending Approval (badge count)
 |     +-- Permit Types (admin only)
 +-- Violations
 +-- Spot Inventory
 |     +-- Spot Map (visual grid)
 |     +-- Areas & Zones (admin only)
 +-- Plate History (search by plate)
 +-- Analytics (link to parking reports)
```

### 6.2 Layout Rules

**Desktop (1280px+)**:
- Tables use full width with all columns visible.
- Spot inventory displays as a visual card grid grouped by area.
- Permit and violation detail views use a two-column layout: details on the left, history/actions on the right.

**Tablet (768px-1279px)**:
- Tables hide lower-priority columns (Vehicle, Created By). Available via "More" expand.
- Spot inventory shows 3-column grid.
- Detail views stack to single column.

**Mobile (< 768px)**:
- Tables convert to card view. Each row becomes a card with key info (plate, unit, status) and expand for details.
- Spot inventory becomes a scrollable list grouped by area.
- All forms use full-width stacked fields.
- Action buttons fixed at bottom of screen.

### 6.3 Loading States

| View | Loading State |
|------|---------------|
| Tables | Skeleton rows (6 rows) with shimmer animation |
| Spot inventory grid | Skeleton cards with shimmer |
| Detail views | Skeleton layout matching detail structure |
| Forms | All fields enabled, submit button disabled until first interaction |
| Plate history search | Spinner below search field with "Searching..." text |

### 6.4 Error States

| Scenario | Display |
|----------|---------|
| Network error loading table | Full-width error banner: "Could not load parking data. [Retry]" with retry button |
| Network error on form submit | Toast notification (red): "Could not save. Please check your connection and try again." Fields remain filled. |
| No matching plates in search | In-table message: "No results for '{query}'. Try a different plate number." |
| Spot conflict (two users assign same spot) | Modal: "Spot {number} was just assigned to another vehicle. Please select a different spot." with list of available alternatives. |

### 6.5 Key UI Components

**Plate History Panel**: A slide-in right panel showing the complete history of a license plate across visitor parking, permits, and violations. Timeline view with color-coded entries. Triggered by clicking any license plate link in any table.

**Tooltip** (on "Parking Until" field): "Set when the visitor's parking authorization expires. The front desk will see an alert when this time passes and the vehicle has not been signed out."

**Tooltip** (on "Auto-Expire On" for violations): "If set, this violation will automatically change to 'Expired' status on this date. Use this for time-limited warnings or temporary bans."

---

## 7. AI Integration

Five AI capabilities enhance the Parking module. All follow the Concierge AI Framework principles: invisible intelligence, graceful degradation, human confirms / AI suggests.

| ID | Name | Description | Default Model | Est. Cost | Trigger | Input | Output | Graceful Degradation | Default |
|----|------|-------------|---------------|-----------|---------|-------|--------|---------------------|---------|
| 95 | License Plate Recognition (OCR) | Extracts license plate text from uploaded photos of vehicles or plates. Auto-fills the plate field. | Vision (GPT-4o) | $0.01 | On photo upload in visitor parking or violation form | Photo of vehicle or license plate | Extracted plate text + province/state guess + confidence score | Manual plate entry | Enabled |
| 96 | Violation Pattern Detection | Identifies patterns across violations: repeat offenders, time-of-day clusters, location hotspots, violation type trends. Generates weekly enforcement summary. | Sonnet | $0.01 | Weekly scheduled (Monday 5:00 AM) | All violations for past 90 days | Pattern report: top offenders, hotspot map, trend chart, recommended actions | No automated pattern report; manual review of violation logs | Enabled |
| 97 | Permit Expiry Prediction | Predicts which permits are at risk of lapsing without renewal based on resident behavior patterns and payment history. Sends proactive reminders to at-risk residents. | Haiku | $0.002 | Daily scheduled (8:00 AM) | Permit data + renewal history + resident engagement metrics | Risk-scored list of permits likely to lapse + personalized reminder drafts | Standard 30/14/7-day expiry reminders sent to all | Disabled |
| 98 | Parking Utilization Analysis | Analyzes spot occupancy over time to identify peak usage hours, underutilized areas, and capacity forecasts. Generates heatmap and recommendations. | Sonnet | $0.01 | Weekly scheduled (Sunday 11:00 PM) | Visitor parking timestamps + permit data + spot status changes | Utilization heatmap, peak hours, underused areas, capacity forecast for next 30 days | No automated analysis; manual observation | Enabled |
| 99 | Visitor Parking Abuse Detection | Flags license plates that appear in visitor parking an unusually high number of times (configurable threshold, default: 10 visits in 30 days). Suggests whether the vehicle should require a resident or temporary permit instead. | Haiku | $0.002 | On visitor parking creation + daily batch scan | Visitor parking records for past 90 days per plate | Abuse alert: plate, visit count, associated units, recommendation (require permit / no action) | No automated detection; manual plate review | Enabled |

### AI Interaction Patterns

**License Plate OCR flow**:
1. Staff uploads photo on visitor parking or violation form.
2. System sends photo to Vision model.
3. If confidence > 85%, plate field auto-fills with a subtle highlight and tooltip: "Auto-detected from photo. Verify and edit if needed."
4. If confidence 50-85%, plate field auto-fills but shows a yellow info banner: "Plate detected with low confidence. Please verify: {detected_plate}."
5. If confidence < 50% or detection fails, no auto-fill. Staff types manually. No error shown -- the feature is invisible when it cannot help.

**Abuse Detection flow**:
1. When a visitor parking record is created, system checks the plate against the past 90 days.
2. If threshold exceeded, a non-blocking yellow banner appears on the creation form: "This plate has been registered {n} times in the past 30 days across units {list}. Consider requiring a parking permit."
3. The banner is informational only. Staff can dismiss it and proceed.
4. Daily batch scan generates a report for Property Managers: "Visitor Parking Abuse Report" listing all plates exceeding the threshold with visit counts and unit associations.

---

## 8. Analytics

Three layers of analytics following the Concierge analytics-first principle.

### 8.1 Operational Metrics (What Happened)

| Metric | Calculation | Display |
|--------|-------------|---------|
| Active Visitor Count | COUNT(visitor_parking WHERE departure_at IS NULL) | Real-time badge on dashboard |
| Visitor Spots Available | visitor_spots - COUNT(occupied visitor spots) | Real-time count per area |
| Active Permits | COUNT(permits WHERE status = 'active') | Summary card |
| Open Violations | COUNT(violations WHERE status = 'open') | Summary card with severity breakdown |
| Permits Expiring This Month | COUNT(permits WHERE valid_until BETWEEN now AND end_of_month) | Alert list |
| Average Visitor Duration | AVG(departure_at - arrival_at) for signed-out visitors | Trend line chart |

### 8.2 Performance Metrics (How Well)

| Metric | Calculation | Display |
|--------|-------------|---------|
| Permit Approval Time | AVG(approved_at - created_at) for approved permits | KPI card with trend |
| Violation Resolution Time | AVG(resolved_at - created_at) for resolved violations | KPI card with trend |
| Spot Utilization Rate | (occupied hours / total available hours) per area per week | Bar chart by area |
| Permit Renewal Rate | (renewed permits / expired permits) * 100 | Percentage with trend |
| Visitor Overstay Rate | (visitors signed out after parking_until / total visitors) * 100 | Percentage with trend |

### 8.3 AI Insights (What To Do About It)

| Insight | Source AI Feature | Description |
|---------|-------------------|-------------|
| Repeat Offender Alert | Violation Pattern Detection | "Plate {ABC123} has 3 open violations in 60 days. Consider escalating to Ban." |
| Underutilized Area | Utilization Analysis | "Area P3 has averaged 23% utilization over the past month. Consider converting 10 spots to visitor parking." |
| Abuse Flag | Visitor Abuse Detection | "5 plates have exceeded the visitor threshold. Review the Abuse Report." |
| Permit Lapse Risk | Expiry Prediction | "12 permits expiring this month have not yet initiated renewal. 4 are flagged as at-risk." |
| Peak Hour Advisory | Utilization Analysis | "Visitor parking reaches 95% capacity between 6-8 PM on weekdays. Consider extending hours or adding overflow." |

---

## 9. Notifications

### 9.1 Notification Triggers

| Trigger | Recipients | Channels | Template |
|---------|-----------|----------|----------|
| Visitor parking registered | Unit resident (if opted in) | Push, Email | "A visitor ({name}) has been registered for your unit with parking in spot {spot}." |
| Visitor parking expired (overstay) | Front desk staff | In-app alert, Push | "Visitor {name} (plate {plate}) in spot {spot} has exceeded their parking time by {duration}." |
| Permit application submitted | Property Manager | In-app, Email | "New parking permit application from Unit {unit} for plate {plate}. [Review]" |
| Permit approved | Applicant (resident) | Push, Email, SMS | "Your parking permit has been approved. Permit #{ref}, Spot {spot}, valid until {date}." |
| Permit denied | Applicant (resident) | Push, Email | "Your parking permit application was not approved. Reason: {reason}. [Contact Management]" |
| Permit expiring (30 days) | Permit holder | Email | "Your parking permit #{ref} expires on {date}. [Renew Now]" |
| Permit expiring (14 days) | Permit holder | Email, Push | "Your parking permit #{ref} expires in 14 days. [Renew Now]" |
| Permit expiring (7 days) | Permit holder | Email, Push, SMS | "Your parking permit #{ref} expires in 7 days. Renew to keep your spot." |
| Permit expired | Permit holder + Property Manager | Email, Push | "Parking permit #{ref} for plate {plate} has expired. Spot {spot} is now available." |
| Violation issued | Unit owner (if linked) | Email, Push | "A parking violation (#{ref}, {type}) has been issued for plate {plate} at your property." |
| Violation resolved | Unit owner (if linked) | Email | "Parking violation #{ref} has been resolved. Resolution: {type}." |
| Ban issued | All security staff | In-app alert (persistent) | "ALERT: Plate {plate} has been banned. Do not authorize parking." |
| Abuse threshold reached | Property Manager | In-app, Email | "Plate {plate} has been registered as a visitor {n} times in {period}. Review required." |

### 9.2 Notification Preferences

Residents can control parking notifications in their notification preferences:

| Preference | Default | Options |
|------------|---------|---------|
| Visitor parking for my unit | On | On / Off |
| Permit status updates | On (cannot disable) | On only |
| Permit expiry reminders | On | On / Off |
| Violation notices | On (cannot disable) | On only |

---

## 10. API

### 10.1 Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/parking/visitors` | List visitor parking records | Staff+ | 60/min |
| POST | `/api/v1/parking/visitors` | Create visitor parking record | Front Desk, Security, PM, Admin | 30/min |
| GET | `/api/v1/parking/visitors/{id}` | Get visitor parking detail | Staff+ | 60/min |
| PUT | `/api/v1/parking/visitors/{id}` | Update visitor parking record | Front Desk, Security, PM, Admin | 30/min |
| POST | `/api/v1/parking/visitors/{id}/signout` | Sign out visitor | Front Desk, Security, PM, Admin | 30/min |
| POST | `/api/v1/parking/visitors/{id}/extend` | Extend visitor parking (new parking_until + optional comment) | Front Desk, Security, PM, Admin | 30/min |
| POST | `/api/v1/parking/visitors/batch-signout` | Batch sign out multiple visitors (body: { ids: UUID[] }) | Front Desk, Security, PM, Admin | 10/min |
| POST | `/api/v1/parking/visitors/{id}/restore` | Restore a soft-deleted visitor record | PM, Admin | 10/min |
| DELETE | `/api/v1/parking/visitors/{id}` | Soft-delete visitor record | PM, Admin | 10/min |
| GET | `/api/v1/parking/permits` | List permits (filtered) | Staff+, Resident (own only) | 60/min |
| POST | `/api/v1/parking/permits` | Create/apply for permit | Staff+, Resident | 10/min |
| GET | `/api/v1/parking/permits/{id}` | Get permit detail | Staff+, Resident (own only) | 60/min |
| PUT | `/api/v1/parking/permits/{id}` | Update permit | PM, Admin | 30/min |
| POST | `/api/v1/parking/permits/{id}/approve` | Approve permit | PM, Admin | 10/min |
| POST | `/api/v1/parking/permits/{id}/deny` | Deny permit | PM, Admin | 10/min |
| POST | `/api/v1/parking/permits/{id}/revoke` | Revoke permit | PM, Admin | 10/min |
| POST | `/api/v1/parking/permits/{id}/renew` | Renew permit | PM, Admin, Resident (own) | 10/min |
| GET | `/api/v1/parking/violations` | List violations | Staff+ | 60/min |
| POST | `/api/v1/parking/violations` | Create violation | Security, PM, Admin | 30/min |
| GET | `/api/v1/parking/violations/{id}` | Get violation detail | Staff+ | 60/min |
| POST | `/api/v1/parking/violations/{id}/resolve` | Resolve violation | PM, Admin | 10/min |
| POST | `/api/v1/parking/violations/{id}/restore` | Restore a soft-deleted violation record | PM, Admin | 10/min |
| GET | `/api/v1/parking/spots` | List spots (filtered by area) | Staff+ | 60/min |
| POST | `/api/v1/parking/spots` | Create spot | Admin | 30/min |
| PUT | `/api/v1/parking/spots/{id}` | Update spot | PM, Admin | 30/min |
| GET | `/api/v1/parking/areas` | List parking areas | Staff+ | 60/min |
| POST | `/api/v1/parking/areas` | Create parking area | Admin | 10/min |
| PUT | `/api/v1/parking/areas/{id}` | Update parking area | Admin | 10/min |
| GET | `/api/v1/parking/plates/{plate}/history` | Get full plate history | Staff+ | 30/min |
| GET | `/api/v1/parking/analytics/utilization` | Spot utilization data | PM, Admin, Board | 10/min |
| GET | `/api/v1/parking/analytics/violations` | Violation analytics | PM, Admin | 10/min |
| GET | `/api/v1/parking/permit-types` | List permit types | Staff+, Resident | 60/min |
| POST | `/api/v1/parking/permit-types` | Create permit type | Admin | 10/min |
| PUT | `/api/v1/parking/permit-types/{id}` | Update permit type | Admin | 10/min |
| GET | `/api/v1/parking/visitor-types` | List visitor types | Staff+ | 60/min |
| POST | `/api/v1/parking/visitor-types` | Create visitor type | Admin | 10/min |
| PUT | `/api/v1/parking/visitor-types/{id}` | Update visitor type | Admin | 10/min |

### 10.2 Sample Payloads

**POST `/api/v1/parking/visitors`**

```json
{
  "building_id": "uuid",
  "unit_id": "uuid",
  "visitor_name": "John Smith",
  "visitor_type": "visitor",
  "license_plate": "ABC1234",
  "province_state": "Ontario",
  "vehicle_make": "Honda",
  "vehicle_model": "Civic",
  "vehicle_color": "Black",
  "spot_id": "uuid | null",
  "parking_until": "2026-03-15T14:00:00-05:00",
  "comments": "Visiting unit 1205 for dinner"
}
```

**Response (201)**:

```json
{
  "id": "uuid",
  "reference_number": "PRK-2026-00412",
  "visitor_name": "John Smith",
  "license_plate": "ABC1234",
  "spot": { "number": "V-12", "area": "P1 Visitor" },
  "arrival_at": "2026-03-14T18:30:00-05:00",
  "parking_until": "2026-03-15T14:00:00-05:00",
  "status": "active",
  "plate_history": {
    "total_visits": 3,
    "prior_violations": 0,
    "abuse_flag": false
  },
  "created_by": { "id": "uuid", "name": "Jane Doe" }
}
```

### 10.3 WebSocket Events

| Event | Channel | Payload | Description |
|-------|---------|---------|-------------|
| `parking.visitor.created` | `property:{id}` | Visitor parking record | New visitor parked |
| `parking.visitor.signedout` | `property:{id}` | Visitor ID + departure time | Visitor signed out |
| `parking.visitor.overstay` | `property:{id}` | Visitor record + overstay duration | Visitor exceeded parking time |
| `parking.permit.status_changed` | `property:{id}` | Permit ID + old/new status | Permit approved, denied, expired, revoked |
| `parking.violation.created` | `property:{id}` | Violation record | New violation issued |
| `parking.violation.resolved` | `property:{id}` | Violation ID + resolution | Violation resolved |
| `parking.spot.status_changed` | `property:{id}` | Spot ID + old/new status | Spot became available/occupied |

---

## 11. Completeness Checklist

| # | Requirement | Section | Status |
|---|------------|---------|--------|
| 1 | Visitor parking registration with all fields specified | 3.1 | Covered |
| 2 | Visitor parking sign-out flow | 3.1.2 | Covered |
| 3 | Visitor parking table with filters, sort, pagination | 3.1.3 | Covered |
| 4 | Permit types configurable per property | 3.2.1 | Covered |
| 5 | Permit application form with all fields | 3.2.2 | Covered |
| 6 | Permit lifecycle (apply, approve, deny, issue, renew, revoke, expire) | 3.2.3 | Covered |
| 7 | Permit approval workflow for admin/PM | 3.2.4 | Covered |
| 8 | Permit list with filters | 3.2.5 | Covered |
| 9 | Violation creation with photo evidence requirement | 3.3.1 | Covered |
| 10 | Five violation types with severity levels | 3.3.1 | Covered |
| 11 | Violation resolution workflow | 3.3.2 | Covered |
| 12 | Violation table with filters | 3.3.3 | Covered |
| 13 | Parking spot inventory (CRUD) | 3.4.1 | Covered |
| 14 | Area/zone management | 3.4.2 | Covered |
| 15 | Spot inventory visual dashboard | 3.4.3 | Covered |
| 16 | Enforcement workflow with escalation path | 3.5 | Covered |
| 17 | Permit printing with QR code | 3.6 | Covered |
| 18 | Data model with all entities and indexes | 4 | Covered |
| 19 | User flows for all 5 roles | 5 | Covered |
| 20 | Desktop, tablet, mobile layouts | 6.2 | Covered |
| 21 | Empty states for all list views | 3.1.3, 3.2.5, 3.3.3, 3.4.3 | Covered |
| 22 | Loading states for all views | 6.3 | Covered |
| 23 | Error states and conflict handling | 6.4 | Covered |
| 24 | Tooltips for complex features | 6.5 | Covered |
| 25 | Progressive disclosure (plate history on plate entry) | 3.3.1 | Covered |
| 26 | AI: License Plate Recognition (OCR) | 7, ID 95 | Covered |
| 27 | AI: Violation Pattern Detection | 7, ID 96 | Covered |
| 28 | AI: Permit Expiry Prediction | 7, ID 97 | Covered |
| 29 | AI: Parking Utilization Analysis | 7, ID 98 | Covered |
| 30 | AI: Visitor Parking Abuse Detection | 7, ID 99 | Covered |
| 31 | Three-layer analytics (operational, performance, AI insights) | 8 | Covered |
| 32 | Notification triggers and templates | 9.1 | Covered |
| 33 | Resident notification preferences | 9.2 | Covered |
| 34 | Full REST API with auth and rate limits | 10.1 | Covered |
| 35 | WebSocket real-time events | 10.3 | Covered |
| 36 | All buttons: action, success, failure, loading states | 3.1-3.4 | Covered |
| 37 | All fields: data type, max length, required/optional, default, validation, error messages | 3.1-3.4 | Covered |
| 38 | No competitor names referenced | All | Verified |
| 39 | Admin-configurable visitor types with system defaults | 3.1.1, 4.7 | Covered |
| 40 | Needs parking toggle for visitors without vehicles | 3.1.1 | Covered |
| 41 | Extend visitor parking quick action | 3.1.2b | Covered |
| 42 | Batch visitor sign-out | 3.1.2 | Covered |
| 43 | Show Deleted toggle on visitor parking and violation filters | 3.1.3, 3.3.3 | Covered |
| 44 | Restore soft-deleted records | 10.1 | Covered |
| 45 | Camera capture integration on photo upload fields | 3.1.1, 3.3.1 | Covered |
| 46 | Detailed visitor parking pass print layout | 3.6 | Covered |
| 47 | Violation table filters (status, type, date, plate, deleted) | 3.3.3 | Covered |

---

*Last updated: 2026-03-14*
*Lines: 500+*
