# 07 — Unit Management

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

Unit Management is the **central registry** for every residential and commercial space in a building. It is the hub that connects residents, physical access devices, vehicles, pets, emergency contacts, front desk instructions, and maintenance history into a single, actionable view.

### Why It Matters

Every other module in Concierge references units. When a package arrives, staff needs to know which unit it belongs to and whether there are special delivery instructions. When a maintenance request comes in, the system needs the unit's occupant history and past work orders. When security responds to an incident, they need emergency contacts and access device records. Unit Management is the connective tissue that makes all of this possible.

### Core Capabilities

| Capability | Description |
|-----------|-------------|
| **Unit registry** | Create, edit, archive, and bulk-import units across single or multi-building properties |
| **Modular unit overview** | Drag-reorderable widget sections showing events, maintenance, reservations, pets, vehicles, FOBs, and more |
| **Resident profiles** | 8-tab profiles covering personal info, emergency contacts, packages, maintenance, amenities, parking, pets/vehicles, and documents |
| **Front desk instructions** | Per-unit notes with priority levels, role visibility, and active/inactive status |
| **Physical access tracking** | FOBs, buzzer codes, garage clickers, and key tags per unit |
| **Custom fields** | Property-defined JSONB fields on both units and residents without schema changes |
| **Occupant history** | Complete timeline of who lived in each unit and when |
| **Move-in / move-out workflow** | Structured process for onboarding new residents and offboarding departing ones |
| **Bulk operations** | CSV import, bulk status changes, and batch resident invitations |

### Scope Boundaries

| In Scope | Out of Scope |
|----------|-------------|
| Unit CRUD, resident profiles, occupant linking | Amenity configuration (see 06-Amenity Booking) |
| FOB/buzzer/clicker tracking per unit | Parking permit lifecycle (see 10-Parking Management) |
| Emergency contacts per resident | Maintenance request creation flow (see 05-Maintenance) |
| Per-unit front desk instructions | Security incident logging (see 03-Security Console) |
| Custom fields on units and residents | Package intake/release (see 04-Package Management) |
| Move-in/move-out workflow | Financial/billing management (account balances, transaction history — deferred to a future Billing module, v3+) |
| Occupant history and unit timeline | Board governance |

---

## 2. Research Summary

### What Industry Research Revealed

Competitive analysis of three production platforms serving 170 to 1,000+ unit properties uncovered clear patterns about what works and what fails in unit management.

### What the Best Platforms Get Right

| # | Insight | Source | Concierge Decision |
|---|---------|--------|-------------------|
| 1 | **Modular, drag-reorderable unit overview** with 10 widget sections (instructions, events, custom fields, maintenance, reservations, parking, pets, vehicles, assets, alterations) | Industry platform B | Adopt fully. Staff customizes their view per workflow. |
| 2 | **Per-unit front desk instructions** visible to concierge and security ("Unit 815 has a dog that bites", "Unit 302 resident is deaf, ring doorbell twice") | Industry platforms A and B | Adopt with priority levels (normal, important, critical) and role-based visibility. |
| 3 | **FOB/key management with serial numbers** -- 6 FOB slots, 2 buzzer codes, 2 garage clickers per unit with type classification (Access Card, FOB, Key, Remote) | Industry platform A | Adopt with unlimited slots and full lifecycle tracking (issued, active, lost, deactivated, returned). |
| 4 | **6-tab resident profile** covering user info, emergency contacts, notification preferences, vehicles/parking, pets, and documents | Industry platforms A and C | Expand to 8 tabs, adding packages and maintenance history for a complete resident view. |
| 5 | **Group-based filtering** with 31+ groups including per-floor groups for fast resident lookup | Industry platform C | Adopt with dynamic group creation and multi-group membership. |
| 6 | **Staff-only notes** invisible to residents for sensitive per-user context | Industry platform C | Adopt as part of Unit Instructions with role-based visibility controls. |
| 7 | **Hashed user IDs in URLs** preventing enumeration attacks | Industry platform C | Adopt UUIDs in all URLs. Never expose sequential IDs. |
| 8 | **Registration code system** for self-service resident onboarding | Industry platform C | Adopt with QR code generation and expiration. |
| 9 | **History/audit trail** per user showing who created, modified, or changed group memberships | Industry platform C | Adopt with full audit trail on every entity. |
| 10 | **Custom fields** configurable per property (Breed, Locker, Pet Size, Parking) | Industry platform B | Adopt using JSONB architecture from 01-Architecture. |

### What Existing Platforms Get Wrong

| # | Problem Observed | Concierge Fix |
|---|-----------------|---------------|
| 1 | "Unit File" is actually a user directory -- cannot click a unit to see all residents, vehicles, and history for that unit | Build a true unit-centric view. Unit is the anchor; residents are linked to it. |
| 2 | Fixed form with rigid fields -- cannot add custom tracking per property | JSONB custom fields configurable by Property Admin. |
| 3 | No photo or avatar support for residents | Profile photo upload with automatic thumbnail generation. |
| 4 | No pagination on user lists with 1,000+ records | Server-side pagination with configurable page sizes (25, 50, 100). |
| 5 | Table-only display for unit listings | Card view + table view toggle with user preference persistence. |
| 6 | Empty states show "no records" with no action button | Every empty state includes a primary action button and guidance text. |
| 7 | Role-gated features show broken links instead of hiding them | Features a user cannot access are completely invisible. Never disabled, never grayed out. |
| 8 | No bulk import capability | CSV import with validation preview, error reporting, and rollback. |
| 9 | No move-in/move-out workflow | Structured workflow with checklist, document collection, and automated notifications. |
| 10 | No vacation/away tracking per resident | Vacation records with date ranges and auto-flag for package holding. |

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Unit Registry

**Description**: The master list of all units in a property, filterable by building, floor, status, and type.

##### Unit List Page

**URL**: `/units`

**Page header elements**:

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Page title | Text | "Units" |
| 2 | Building selector | Dropdown | Filters units by building. Default: "All Buildings". Only appears for multi-building properties. |
| 3 | Search bar | Text input | Placeholder: "Search by unit number, resident name, or phone..." Max length: 200 chars. Debounced at 300ms. |
| 4 | Status filter | Dropdown | Options: All, Occupied, Vacant, Under Renovation. Default: "All". |
| 5 | Type filter | Dropdown | Options: All, Residential, Commercial, Storage, Parking. Default: "All". |
| 6 | Floor filter | Dropdown | Dynamically populated from building data. Default: "All Floors". |
| 7 | View toggle | Button group | Card view (default) / Table view. Persists per user. |
| 8 | Add Unit | Primary button | Opens Create Unit form. Visible to: Property Admin, Property Manager. |
| 9 | Bulk Import | Secondary button | Opens CSV import wizard. Visible to: Property Admin. |
| 10 | Export | Secondary button | Downloads CSV/Excel of current filtered view. Visible to: Property Admin, Property Manager. |

##### Unit Card (Card View)

| # | Element | Description |
|---|---------|-------------|
| 1 | Unit number | Large bold text (e.g., "1205"). Clickable -- navigates to Unit Overview. |
| 2 | Floor badge | Small label: "Floor 12". |
| 3 | Status indicator | Color-coded dot: green (occupied), gray (vacant), orange (under renovation). |
| 4 | Primary occupant | First name + last name of the primary resident. "Vacant" if no occupants. |
| 5 | Occupant count | "(+2 more)" if multiple occupants. |
| 6 | Instruction indicator | Yellow warning icon if active front desk instructions exist. Tooltip: "Has front desk instructions". |
| 7 | Quick stats | Icon row: package count (if pending), open maintenance count, FOB count. |

##### Unit Table (Table View)

| # | Column | Sortable | Type | Description |
|---|--------|----------|------|-------------|
| 1 | Unit # | Yes | Link | Navigates to Unit Overview |
| 2 | Floor | Yes | Integer | Floor number |
| 3 | Type | Yes | Enum badge | Residential / Commercial / Storage / Parking |
| 4 | Status | Yes | Color-coded badge | Occupied / Vacant / Under Renovation |
| 5 | Primary Resident | Yes | Text + link | First occupant name. Links to resident profile. |
| 6 | Occupants | No | Integer | Total occupant count |
| 7 | Instructions | No | Icon | Yellow icon if instructions exist, gray if none |
| 8 | Parking | No | Text | Assigned parking spot(s) |
| 9 | FOBs | No | Integer | Active FOB count |
| 10 | Last Activity | Yes | Relative time | Most recent event timestamp |

**Pagination**: Server-side. Default 50 items per page. Options: 25, 50, 100. Total count displayed.

**Empty state**: Illustration of a building outline. Heading: "No units yet". Body: "Add your first unit to get started, or use bulk import to upload many units at once." Buttons: "Add Unit" (primary), "Bulk Import" (secondary).

**Loading state**: Skeleton cards (card view) or skeleton rows (table view) with shimmer animation. 8 skeleton items shown.

**Error state**: Error illustration. Heading: "Unable to load units". Body: "Something went wrong. Please try again." Button: "Retry" (primary).

#### 3.1.2 Create / Edit Unit

**URL**: `/units/new` (create), `/units/:id/edit` (edit)

##### Form Fields

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|------------|---------|------------|---------------|
| 1 | Building | Dropdown | Yes | -- | First building if single-building | Must select a building | "Please select a building" |
| 2 | Unit Number | Text input | Yes | 20 chars | Empty | Unique within building. Alphanumeric, hyphens, slashes allowed. Pattern: `^[A-Za-z0-9\-\/]+$` | "Unit number is required" / "This unit number already exists in {building}" / "Only letters, numbers, hyphens, and slashes allowed" |
| 3 | Floor | Integer input | Yes | 3 digits | Auto-detected from unit number if possible | Integer, 0-200 | "Floor is required" / "Floor must be between 0 and 200" |
| 4 | Unit Type | Dropdown | Yes | -- | "Residential" | Must select a type | "Please select a unit type" |
| 5 | Status | Dropdown | Yes | -- | "Vacant" (create) / current value (edit) | Must select a status | "Please select a status" |
| 6 | Square Footage | Decimal input | No | 10 digits | Empty | Positive decimal, max 2 decimal places | "Square footage must be a positive number" |
| 7 | Enter Phone Code | Text input | No | 20 chars | Empty | Alphanumeric + `*#` | "Only numbers, *, and # allowed" |
| 8 | Parking Spot | Text input | No | 20 chars | Empty | Alphanumeric + hyphens | "Only letters, numbers, and hyphens allowed" |
| 9 | Locker | Text input | No | 20 chars | Empty | Alphanumeric + hyphens | "Only letters, numbers, and hyphens allowed" |
| 10 | Package Email Notification | Toggle | No | -- | On | Boolean | -- |
| 11 | Comments | Textarea | No | 2000 chars | Empty | Character count shown | "Maximum 2000 characters" |
| 12 | Key Tag | Text input | No | 50 chars | Empty | Alphanumeric, hyphens. This is a physical label on the unit's key ring, not a trackable access device. | "Only letters, numbers, and hyphens allowed" |

##### Custom Fields Section

Below the standard fields, any custom fields defined by Property Admin for the "Unit" entity type appear dynamically. Each renders according to its `field_type` with its configured label, placeholder, help text, and validation rules.

**Tooltip**: "Custom fields are configured by your property administrator. Contact them to add or modify fields."

##### Buttons

| Button | Label | Action | Success State | Failure State | Loading State |
|--------|-------|--------|---------------|---------------|---------------|
| Save | "Create Unit" (new) / "Save Changes" (edit) | POST/PUT to API | Toast: "Unit {number} created successfully" / "Changes saved". Redirect to Unit Overview. | Inline validation errors highlighted. Toast: "Please fix the errors below." | Button disabled, spinner shown, text: "Saving..." |
| Cancel | "Cancel" | Navigate back to unit list | -- | -- | -- |
| Delete | "Delete Unit" (edit only) | Confirmation modal, then DELETE | Toast: "Unit {number} deleted". Redirect to unit list. | Toast: "Cannot delete: unit has active residents. Remove all residents first." | Button disabled, spinner. |

**Delete confirmation modal**: "Are you sure you want to delete Unit {number}? This action cannot be undone. All unit data including instructions, custom fields, and history will be permanently removed." Buttons: "Delete" (destructive red), "Cancel".

**Note**: Delete is only available when a unit has zero occupants, zero active FOBs, and zero open maintenance requests. Otherwise the delete button is hidden and replaced with a tooltip: "Remove all residents and close all open requests before deleting this unit."

#### 3.1.3 Unit Overview (Modular Dashboard)

**URL**: `/units/:id`

The Unit Overview is a **widget-based layout** where each section is a collapsible, drag-reorderable card. Staff can arrange widgets to match their workflow. Layout preference is saved per user.

##### Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Back link | "< Units" -- returns to unit list with preserved filters |
| 2 | Unit number | Large heading: "Unit 1205" |
| 3 | Status badge | Color-coded: Occupied (green), Vacant (gray), Under Renovation (orange) |
| 4 | Building name | Subtitle: "Tower A, Floor 12" |
| 5 | Edit button | "Edit Unit" -- opens edit form. Visible to: Property Admin, Property Manager |
| 6 | Navigation | "<< Previous Unit | Unit 45 of 312 | Next Unit >>" for sequential browsing |

##### Widget Sections (Default Order)

| # | Widget | Icon | Default State | Actions | Empty State |
|---|--------|------|---------------|---------|-------------|
| 1 | **Front Desk Instructions** | Alert triangle | Expanded | Add New, Edit, Deactivate | "No front desk instructions. Add notes that staff should see when interacting with this unit." + "Add Instruction" button |
| 2 | **Occupants** | People | Expanded | Add Resident, Remove, View Profile | "No residents linked to this unit." + "Add Resident" button |
| 3 | **Recent Events** | Clock | Expanded (last 10) | View All, Add New | "No events recorded for this unit." |
| 4 | **Access Devices** | Key | Collapsed | Add FOB, Add Buzzer, Add Clicker | "No access devices registered." + "Add Device" button |
| 5 | **Maintenance Requests** | Wrench | Collapsed (open only) | View All, Add New | "No maintenance requests." |
| 6 | **Reservations** | Calendar | Collapsed (upcoming only) | View All, Add New | "No upcoming reservations." |
| 7 | **Vehicles** | Car | Collapsed | Add Vehicle | "No vehicles registered." + "Add Vehicle" button |
| 8 | **Pets** | Paw print | Collapsed | Add Pet | "No pets registered." + "Add Pet" button |
| 9 | **Parking Permits** | P badge | Collapsed | View All, Add New | "No parking permits." |
| 10 | **Documents** | File | Collapsed | Upload, View | "No documents uploaded." + "Upload Document" button |
| 11 | **Custom Fields** | Sliders | Collapsed | Edit | Displays all property-defined custom fields with current values |
| 12 | **Unit History** | Timeline | Collapsed | View Full Timeline | "No history entries." |

**Widget behaviors**:
- Drag handle appears on hover (left edge of card header)
- Collapse/expand toggle (chevron on right edge)
- Widget order saved per user via API call on drag-end
- Real-time updates via WebSocket: new events, maintenance changes appear without refresh
- Each widget shows a count badge in the header (e.g., "Occupants (3)", "FOBs (4)")

#### 3.1.4 Front Desk Instructions

Critical operational notes that appear whenever staff interacts with a unit. These are the first thing a concierge sees when looking up a unit.

##### Instruction Fields

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|------------|---------|------------|---------------|
| 1 | Instruction Text | Textarea | Yes | 1000 chars | Empty | Min 5 chars | "Instruction is required" / "Minimum 5 characters" |
| 2 | Priority | Dropdown | Yes | -- | "Normal" | Must select | "Please select a priority" |
| 3 | Visible To | Multi-select | Yes | -- | All staff roles selected | At least one role | "Select at least one role" |
| 4 | Active | Toggle | No | -- | On | Boolean | -- |

**Priority levels**:

| Level | Color | Behavior |
|-------|-------|----------|
| Normal | Gray | Shown in widget, normal text |
| Important | Amber | Shown in widget with amber left border, bold text |
| Critical | Red | Shown in widget with red left border, bold text. Also appears as a banner at the top of the Unit Overview page. |

**Visibility**: Instructions marked as critical also appear as inline alerts when a staff member searches for or selects this unit in any module (package intake, event creation, maintenance request).

#### 3.1.5 Resident Profile

**URL**: `/units/:unitId/residents/:id` or `/residents/:id`

A comprehensive view of a single resident organized across 8 tabs.

##### Profile Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Avatar | Profile photo or initials circle (first + last initial). Click to upload photo. |
| 2 | Full name | Large heading: "Ray Kodavali" |
| 3 | Resident type badge | Owner / Tenant / Offsite Owner / Family Member |
| 4 | Unit link | "Unit 1205" -- clickable link to Unit Overview |
| 5 | Status badge | Active (green), Inactive (gray), Suspended (red), Pending Invitation (amber) |
| 6 | Edit button | "Edit Profile" -- opens edit mode. Visible to: Property Admin, Property Manager |
| 7 | Quick actions | Email icon (compose email), Phone icon (click-to-call on mobile) |

##### Tab 1: Personal Information

| # | Field | Type | Required | Max Length | Editable By | Validation | Error Message |
|---|-------|------|----------|------------|-------------|------------|---------------|
| 1 | First Name | Text | Yes | 100 | Admin, Manager | Letters, hyphens, apostrophes, spaces | "First name is required" |
| 2 | Last Name | Text | Yes | 100 | Admin, Manager | Letters, hyphens, apostrophes, spaces | "Last name is required" |
| 3 | Preferred Name | Text | No | 100 | Admin, Manager, Self | Letters, hyphens, spaces | -- |
| 4 | Salutation | Dropdown | No | -- | Admin, Manager | Options: Mr., Mrs., Ms., Dr., -- | -- |
| 5 | Date of Birth | Date picker | No | -- | Admin, Manager | Must be in the past. Age 0-120. | "Date must be in the past" |
| 6 | Email Address | Email | Yes | 255 | Admin, Manager | Valid email format. Unique across property. | "Valid email address is required" / "This email is already in use" |
| 6a | Email Status | Badge (read-only) | -- | -- | System-generated | Values: Valid (green), Invalid (red), Missing (gray). Auto-determined: "Valid" if email is present and last delivery succeeded; "Invalid" if last delivery bounced or format validation failed (shown in red text below the email field); "Missing" if email field is empty. | -- |
| 7 | Phone (Cell) | Phone | No | 20 | Admin, Manager, Self | Digits, +, -, (, ), spaces | "Enter a valid phone number" |
| 8 | Phone (Home) | Phone | No | 20 | Admin, Manager, Self | Same as above | Same as above |
| 9 | Phone (Work) | Phone | No | 20 | Admin, Manager, Self | Same as above | Same as above |
| 10 | Resident Type | Dropdown | Yes | -- | Admin, Manager | Options: Owner, Tenant, Offsite Owner, Family Member | "Resident type is required" |
| 11 | Move-In Date | Date picker | No | -- | Admin, Manager | Must not be in the future (beyond +30 days) | "Move-in date seems too far in the future" |
| 12 | Move-Out Date | Date picker | No | -- | Admin, Manager | Must be after move-in date if both set | "Move-out date must be after move-in date" |
| 13 | Offsite Address | Textarea | No | 500 | Admin, Manager | Shown only when type = "Offsite Owner" | -- |
| 14 | Assistance Required | Toggle | No | -- | Admin, Manager | Boolean. Tooltip: "Enable if this resident needs emergency assistance (mobility issues, hearing impaired, etc.)" | -- |
| 15 | Language Preference | Dropdown | No | -- | Admin, Manager, Self | Options: English, French, Mandarin, Cantonese, Hindi, Punjabi, Tagalog, Other | -- |
| 16 | About | Textarea | No | 500 | Admin, Manager, Self | Character count shown | -- |
| 17 | Account Status | Dropdown | Yes | -- | Admin only | Active, Inactive, Suspended | -- |

**Note on resident identification**: Residents are identified in all unit and resident views by their display name (First Name + Last Name) and email address. Usernames (system-generated identifiers defined in 08-User-Management, section 3.1.7) are not displayed in unit management views. URLs use UUIDs, never usernames or sequential IDs.

**Right column widgets** (alongside the fields):

| Widget | Description |
|--------|-------------|
| Related Units | Units this resident is linked to. Click to navigate. |
| Parcel Waivers | Signed waiver documents with dates and attachments. "Add Waiver" button. See field specs below. |
| Electronic Consent | E-consent document tracking. See field specs below. |
| Staff Notes | Staff-only notes invisible to residents. Blue info banner: "Notes are visible only to staff and administrators." |

##### Parcel Waiver Fields

Each parcel waiver record tracks a signed waiver document for package handling policies.

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Waiver Type | Dropdown | Yes | -- | Options: Standard Parcel Waiver, Extended Absence Waiver, Third-Party Pickup Authorization, Custom. | "Waiver type is required" |
| 2 | Signed At | Date picker | Yes | -- | Must be in the past or today | "Signed date cannot be in the future" |
| 3 | Expiry Date | Date picker | No | -- | Must be after Signed At if set | "Expiry date must be after the signed date" |
| 4 | Attachment | File upload | No | 10 MB | PDF, JPG, PNG. Scanned copy of the signed waiver. | "Maximum file size is 10 MB" / "Accepted formats: PDF, JPG, PNG" |
| 5 | Notes | Textarea | No | 500 chars | Free text | -- |

**Display**: Each waiver shows as a card with waiver type badge, signed date, expiry status (green "Active" or red "Expired"), and attachment download link. "Add Waiver" button at the bottom.

**Empty state**: "No parcel waivers on file." + "Add Waiver" button.

**Data model**: Parcel waivers are stored as Document records (section 3.1.5, Tab 8) with `document_type = 'Parcel Waiver'` and additional metadata in the JSONB `custom_fields` column: `{ "waiver_type": "...", "signed_at": "...", "expiry_date": "..." }`.

##### Electronic Consent Fields

Tracks e-consent documents that residents have signed electronically (e.g., building rules acknowledgment, privacy policy, data processing consent).

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Document Title | Text | Yes | 200 chars | Min 3 chars | "Document title is required" |
| 2 | Document Version | Text | No | 20 chars | Alphanumeric + dots (e.g., "1.0", "2.1") | "Version format: numbers and dots only" |
| 3 | Signed At | Timestamp (auto) | Yes | -- | Auto-populated when resident signs | -- |
| 4 | Signature Method | Enum (display only) | Yes | -- | Options: Click-to-Accept, Typed Name, Digital Signature | -- |
| 5 | Signer | Link (display only) | Yes | -- | Auto-populated with the resident who signed | -- |
| 6 | IP Address | String (display only) | No | 45 chars | Captured at signing time for legal audit | -- |

**Workflow**: Property Admin creates a consent document in Settings (template with title, version, and body text). When a resident is required to sign, the document appears on their portal dashboard or during onboarding. On signing, the system records the timestamp, method, signer identity, and IP address.

**Display**: Each consent shows as a compact row: document title, version, signed date, and a checkmark icon. If no consent documents have been signed: "No e-consent documents signed." + link to property admin to configure consent documents.

**Note**: Full consent document template management (creation, versioning, distribution) will be specified in a future Legal/Compliance module. This section covers only the per-resident tracking and display of signed consents.

##### Tab 2: Emergency Contacts

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Contact Name | Text | Yes | 200 | Min 2 characters | "Contact name is required" |
| 2 | Relationship | Text | Yes | 100 | Min 2 characters | "Relationship is required" |
| 3 | Phone (Primary) | Phone | Yes | 20 | Valid phone format | "Primary phone is required" |
| 4 | Phone (Secondary) | Phone | No | 20 | Valid phone format | "Enter a valid phone number" |
| 5 | Email | Email | No | 255 | Valid email format | "Enter a valid email address" |
| 6 | Notes | Textarea | No | 500 | -- | -- |

**Max contacts**: 5 per resident. "Add Emergency Contact" button. Drag to reorder priority.

**Empty state**: "No emergency contacts on file. Emergency contacts help staff reach the right people during urgent situations." + "Add Emergency Contact" button.

##### Tab 3: Packages

Read-only listing of all packages (events of package types) associated with this resident.

| Column | Description |
|--------|-------------|
| Reference # | Auto-generated package reference (e.g., PKG-2026-00147) |
| Date Received | Timestamp |
| Courier | Courier name with icon |
| Status | Pending / Picked Up / Returned |
| Picked Up By | Name of person who collected |
| Picked Up At | Timestamp |

**Link**: "View all packages" navigates to Package Management filtered by this resident.

##### Tab 4: Maintenance

Read-only listing of maintenance requests submitted by or related to this resident.

| Column | Description |
|--------|-------------|
| Reference # | Request reference number |
| Date | Submission date |
| Category | Maintenance category |
| Status | Open / On Hold / Closed |
| Priority | Low / Normal / High / Critical |
| Description | Truncated first 100 chars |

**Link**: "View all requests" navigates to Maintenance filtered by this resident.

##### Tab 5: Amenities

Read-only listing of amenity reservations for this resident.

| Column | Description |
|--------|-------------|
| Date | Reservation date and time range |
| Amenity | Resource name |
| Status | Requested / Approved / Denied / Cancelled |

**Link**: "View all reservations" navigates to Amenity Booking filtered by this resident.

##### Tab 6: Parking & Vehicles

**Vehicles sub-section**: List of registered vehicles.

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Make | Text | Yes | 100 | Letters, numbers, spaces | "Make is required" |
| 2 | Model | Text | Yes | 100 | Letters, numbers, spaces | "Model is required" |
| 3 | Year | Number | No | 4 digits | 1900 to current year + 1 | "Enter a valid year" |
| 4 | Color | Text | Yes | 50 | Letters | "Color is required" |
| 5 | License Plate | Text | Yes | 20 | Alphanumeric, hyphens, spaces | "License plate is required" |
| 6 | Province/State | Dropdown | No | -- | List of provinces/states | -- |
| 7 | Parking Spot | Text | No | 20 | Alphanumeric, hyphens | -- |

**Max vehicles**: 5 per resident. "Add Vehicle" button.

**Parking sub-section**: Parking rental status and active parking permits linked to this resident.

| # | Field | Type | Required | Max Length | Editable By | Validation | Error Message |
|---|-------|------|----------|------------|-------------|------------|---------------|
| 1 | Renting a parking spot? | Toggle | No | -- | Admin, Manager | Boolean | -- |
| 2 | Renting From | Text input (unit autocomplete) | Conditional | 20 chars | Admin, Manager | Required when "Renting a parking spot" = Yes. Must be a valid unit number at the same property. | "Please enter the unit number you are renting from" / "Unit not found at this property" |

**Active permits**: Below the rental fields, a read-only table lists active parking permits linked to this resident with a "View in Parking Management" link to the Parking Management module (see 10-Parking Management).

##### Tab 7: Pets

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Name | Text | Yes | 100 | Letters, numbers, spaces | "Pet name is required" |
| 2 | Species | Dropdown | Yes | -- | Dog, Cat, Bird, Fish, Reptile, Other | "Species is required" |
| 3 | Breed | Text | No | 100 | Letters, hyphens, spaces | -- |
| 4 | Weight (lbs) | Decimal | No | 5 digits | 0.1 to 500 | "Enter a valid weight" |
| 5 | Registration # | Text | No | 50 | Alphanumeric | -- |
| 6 | Notes | Textarea | No | 500 | -- | -- |

**Max pets**: 10 per resident. "Add Pet" button.

**Empty state**: "No pets registered for this resident." + "Add Pet" button.

##### Tab 8: Documents

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Document Type | Dropdown | Yes | -- | Lease Agreement, Insurance Certificate, Power of Attorney, ID Document, Move-In Form, Move-Out Form, Parcel Waiver, Other | "Document type is required" |
| 2 | File | File upload | Yes | 10 MB | PDF, DOC, DOCX, JPG, PNG | "File is required" / "Maximum file size is 10 MB" / "Accepted formats: PDF, DOC, DOCX, JPG, PNG" |
| 3 | Expiry Date | Date picker | No | -- | Must be in the future | "Expiry date must be in the future" |
| 4 | Notes | Textarea | No | 500 | -- | -- |

**Document card display**: File type icon, document name, upload date, expiry date (with red "Expired" badge if past), file size, uploaded by. Actions: View (opens in new tab), Download, Delete.

#### 3.1.6 Physical Access Tracking

Each unit tracks physical access devices. All devices follow a lifecycle: Issued > Active > (Lost | Deactivated | Returned).

##### FOB / Access Device Fields

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|------------|---------|------------|---------------|
| 1 | Device Type | Dropdown | Yes | -- | "FOB" | Options: FOB, Access Card, Key, Remote, Key Tag | "Device type is required" |
| 2 | Serial Number | Text | Yes | 50 | Empty | Alphanumeric. Unique across property. | "Serial number is required" / "This serial number already exists" |
| 3 | Access Type | Dropdown | Yes | -- | "Building Entry" | Options: Building Entry, Amenity, Parking, Elevator, Storage | "Access type is required" |
| 4 | Status | Dropdown | Yes | -- | "Active" | Options: Active, Deactivated, Lost, Returned | -- |
| 5 | Issued To | Dropdown | Yes | -- | Primary occupant | Must be a current occupant of the unit | "Please select a resident" |
| 6 | Issued Date | Date picker | Yes | -- | Today | Cannot be in the future | "Issue date cannot be in the future" |
| 7 | Deactivated Date | Date picker | No | -- | Empty | Required when status = Deactivated or Lost. Must be on or after Issued Date. | "Deactivation date is required when status is Deactivated or Lost" |
| 8 | Notes | Textarea | No | 500 | Empty | -- | -- |

**Max FOBs per unit**: Unlimited (no artificial cap). Industry research showed 6-slot limits were too restrictive for units with multiple residents.

##### Buzzer Code Fields

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|------------|---------|------------|---------------|
| 1 | Code | Text | Yes | 20 | Empty | Alphanumeric + `*#` | "Buzzer code is required" |
| 2 | Label | Text | No | 100 | Unit number | -- | -- |
| 3 | Notes | Textarea | No | 500 | Empty | Free text. Additional context such as "Front door", "Side entrance", or special buzzer instructions. | -- |
| 4 | Active | Toggle | No | -- | On | Boolean | -- |

##### Garage Clicker Fields

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|------------|---------|------------|---------------|
| 1 | Serial Number | Text | Yes | 50 | Empty | Alphanumeric. Unique. | "Serial number is required" / "This serial number already exists" |
| 2 | Status | Dropdown | Yes | -- | "Active" | Active, Deactivated, Lost, Returned | -- |
| 3 | Issued To | Dropdown | Yes | -- | Primary occupant | Must be current occupant | "Please select a resident" |
| 4 | Issued Date | Date picker | Yes | -- | Today | Cannot be in the future | -- |

#### 3.1.7 Emergency Contacts

Emergency contacts are prominently featured -- never buried behind multiple clicks. They belong to individual residents but are surfaced at the unit level for fast access during emergencies.

**Access pattern**: Unit Overview > Occupants widget > click any occupant > Emergency Contacts tab. Additionally, emergency contacts for all occupants appear in a dedicated section of the Unit Overview when the "Emergency View" toggle is activated.

**Emergency View toggle**: A button in the Unit Overview header. When activated, the page reorganizes to show:
1. All occupants with phone numbers
2. All emergency contacts across all occupants
3. Assistance Required flags
4. Critical instructions

This view is optimized for printing (one page, large text, no decorative elements).

#### 3.1.8 Occupant History

Every time a resident is linked to or unlinked from a unit, a history record is created.

| Field | Type | Description |
|-------|------|-------------|
| Resident Name | Link | Links to resident profile |
| Resident Type | Badge | Owner / Tenant / Offsite Owner / Family Member |
| Move-In Date | Date | When the resident was linked to the unit |
| Move-Out Date | Date | When the resident was unlinked (null = current) |
| Duration | Calculated | "2 years 3 months" or "Current" |
| Action By | Text | Staff member who recorded the change |
| Notes | Text | Optional notes (e.g., "Lease expired", "Sold unit") |

**Timeline display**: Vertical timeline with the most recent resident at the top. Current occupants are highlighted with a green left border.

#### 3.1.9 Resident Groups

**Description**: Custom grouping system for organizing residents beyond the basic Resident Type (Owner, Tenant, Offsite Owner, Family Member). Groups enable targeted communication, filtered views, and batch operations.

**Note**: Resident Type (section 3.1.5, field #10) is a single-select classification per occupancy. Groups are a separate, multi-membership system. A resident can belong to multiple groups simultaneously (e.g., "Board Members", "Floor 12", "Dog Owners", "Parking Lot B").

##### Group Management

**URL**: `/settings/groups` (Property Admin only)

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Group Name | Text | Yes | 100 chars | Unique within property. Letters, numbers, spaces, hyphens. | "Group name is required" / "A group with this name already exists" |
| 2 | Description | Textarea | No | 500 chars | Free text | -- |
| 3 | Group Type | Dropdown | Yes | -- | Options: Static (manually assigned), Dynamic (rule-based). Default: Static. | "Group type is required" |
| 4 | Auto-Assign Rule | Rule builder | Conditional | -- | Required when Group Type = Dynamic. Rules based on: Floor, Building, Resident Type, Unit Type, Move-In Date range, Custom Fields. | "At least one rule is required for dynamic groups" |
| 5 | Color | Color picker | No | -- | Hex color code. Used as badge color in lists. | -- |

**Static groups**: Admin manually adds or removes residents. "Add Members" button opens a multi-select resident search.

**Dynamic groups**: System automatically assigns residents based on rules. Membership updates in real-time as resident data changes (e.g., a new Floor 12 resident is auto-added to the "Floor 12" group).

##### Group Assignment on Resident Profile

On Tab 1 (Personal Information), a "Groups" widget in the right column displays all groups the resident belongs to as color-coded badges. Staff with Admin or Manager role can add or remove group memberships via a multi-select dropdown.

##### Group Filter on Unit List

The Unit Registry (section 3.1.1) includes an additional filter:

| # | Element | Type | Description |
|---|---------|------|-------------|
| 11 | Group filter | Multi-select dropdown | Filters units to those containing at least one resident in the selected group(s). Options populated from all groups at the property. Default: "All Groups". |

##### Group-Based Communication

Groups integrate with the Announcements module (see 11-Announcements) and Notification module (see 09-Notifications) as recipient targets. When composing an announcement or notification, staff can select one or more groups as the audience.

##### Group Data Model

```
ResidentGroup
├── id (UUID, auto-generated, primary key)
├── property_id → Property (required)
├── name (varchar 100, required, unique within property)
├── description (text, max 500, nullable)
├── group_type (enum: static, dynamic — default: static)
├── auto_assign_rules (JSONB, nullable — rule definitions for dynamic groups)
├── color (varchar 7, nullable — hex color code, e.g., "#3B82F6")
├── member_count (integer, default: 0 — denormalized for display performance)
├── created_by → User (required)
├── created_at (timestamp with timezone)
├── updated_by → User
└── updated_at (timestamp with timezone)

ResidentGroupMembership
├── id (UUID, auto-generated)
├── group_id → ResidentGroup (required)
├── user_id → User (required)
├── assigned_at (timestamp with timezone)
├── assigned_by → User (nullable — null for dynamic auto-assignments)
└── UNIQUE(group_id, user_id)
```

**Indexes**: `(property_id, name)` unique, `(group_id)` for membership lookups, `(user_id)` for reverse lookups.

### 3.2 Enhanced Features (v2)

#### 3.2.1 Move-In Workflow

A structured, multi-step process triggered when a new resident is added to a unit.

**Steps**:

| Step | Name | Description | Required |
|------|------|-------------|----------|
| 1 | Resident Details | Create resident profile or link existing resident | Yes |
| 2 | Document Collection | Upload lease, insurance, ID, move-in inspection form | Configurable |
| 3 | Access Devices | Issue FOBs, buzzer codes, garage clickers | Yes |
| 4 | Vehicle Registration | Register vehicles and assign parking | No |
| 5 | Pet Registration | Register pets | No |
| 6 | Emergency Contacts | Add at least one emergency contact | Configurable |
| 7 | Onboarding | Send welcome email with building rules, amenity info, and portal login | Yes |

**Checklist tracking**: Each step has a completion status. The unit displays a progress indicator until all required steps are complete.

**Welcome email**: Configurable template with `{{variables}}` for resident name, unit number, building name, portal URL, and login credentials.

#### 3.2.2 Move-Out Workflow

Triggered when a resident's move-out date is set or when manually initiated.

**Steps**:

| Step | Name | Description | Required |
|------|------|-------------|----------|
| 1 | Confirm Move-Out Date | Set the official move-out date | Yes |
| 2 | Outstanding Items | Review pending packages, open maintenance requests, unpaid amenity fees | Yes |
| 3 | Access Device Return | Deactivate or collect all FOBs, keys, garage clickers | Yes |
| 4 | Document Archive | Archive or retain lease, insurance docs | No |
| 5 | Final Inspection | Optional move-out inspection form | Configurable |
| 6 | Unit Status Update | Auto-set unit to "Vacant" after last resident moves out | Automatic |

**Notification**: Property Manager receives a summary email listing all actions taken and any outstanding items.

#### 3.2.3 Vacation / Away Tracking

| # | Field | Type | Required | Max Length | Validation | Error Message |
|---|-------|------|----------|------------|------------|---------------|
| 1 | Start Date | Date picker | Yes | -- | Today | Cannot be in the past | "Start date cannot be in the past" |
| 2 | End Date | Date picker | Yes | -- | Tomorrow | Must be after start date | "End date must be after start date" |
| 3 | Contact While Away | Text | No | 200 | -- | -- | -- |
| 4 | Package Instructions | Dropdown | No | -- | "Hold" | Options: Hold, Return to Sender, Leave with Concierge | -- |
| 5 | Notes | Textarea | No | 500 | -- | -- | -- |

**Behavior**: When a resident is on vacation, a blue "Away until {date}" badge appears on their profile and on the unit card. Package intake for the unit shows a notification banner: "Resident is away until {date}. Package instruction: {hold/return/leave}."

#### 3.2.4 Bulk Import

**CSV Import Wizard (3 steps)**:

| Step | Name | Description |
|------|------|-------------|
| 1 | Upload | Drag-and-drop CSV file upload. Download template link. Max file size: 5 MB. |
| 2 | Mapping | Column mapping: map CSV columns to Concierge fields. Auto-detect common headers. Preview first 5 rows. |
| 3 | Validation & Import | Validate all rows. Show error count and warning count. Errors: missing required fields, duplicate unit numbers, invalid formats. Warnings: possible duplicates, unusual values. Options: "Import valid rows" or "Fix errors and retry". |

**Template CSV columns**: Building, Unit Number, Floor, Type, Status, Enter Phone Code, Parking Spot, Locker, Comments.

**Resident CSV columns**: Unit Number, First Name, Last Name, Email, Phone, Resident Type, Move-In Date.

#### 3.2.5 Unit Comparison View

Side-by-side comparison of 2-4 units for property managers evaluating vacancy or maintenance patterns.

| Data Point | Description |
|-----------|-------------|
| Occupancy status | Current status and duration |
| Maintenance requests | Count and resolution time (6 months) |
| Events | Event count by type (6 months) |
| Access devices | Count and status |
| Custom fields | Side-by-side custom field values |

### 3.3 Future Features (v3+)

#### 3.3.1 Digital Unit Passport

A printable or shareable PDF summarizing a unit's complete profile: occupants, access devices, special instructions, emergency contacts, and maintenance history. Useful during property manager transitions or board reviews.

#### 3.3.2 Resident ID Cards

Generate printable resident identification cards with photo, name, unit number, and QR code for building access verification.

#### 3.3.3 Interactive Floor Plans

Upload building floor plans and link units to map positions. Staff can click a unit on the floor plan to navigate to its overview.

#### 3.3.4 Smart Duplicate Detection

AI-powered detection of potential duplicate resident profiles across units or buildings (same name + different email, same phone + different unit).

#### 3.3.5 Resident Satisfaction Scoring

Aggregate maintenance response times, amenity access, and communication engagement into a per-resident satisfaction score.

---

## 4. Data Model

All entities reference the architecture defined in 01-Architecture. This section specifies field-level details beyond what the architecture document covers.

### 4.1 Unit

```
Unit
├── id (UUID, auto-generated, primary key)
├── building_id → Building (required)
├── property_id → Property (denormalized for query performance)
├── number (varchar 20, required, unique within building)
├── floor (integer, required, 0-200)
├── unit_type (enum: residential, commercial, storage, parking — default: residential)
├── status (enum: occupied, vacant, under_renovation — default: vacant)
├── square_footage (decimal 10,2, nullable)
├── enter_phone_code (varchar 20, nullable)
├── parking_spot (varchar 20, nullable)
├── locker (varchar 20, nullable)
├── key_tag (varchar 50, nullable — physical label on the unit's key ring, distinct from trackable FOB/access devices)
├── package_email_notification (boolean, default: true)
├── comments (text, max 2000, nullable)
├── custom_fields (JSONB, default: {})
├── occupants[] → User (residents linked to this unit)
├── instructions[] → UnitInstruction
├── events[] → Event
├── maintenance_requests[] → MaintenanceRequest
├── reservations[] → AmenityReservation
├── parking_permits[] → ParkingPermit
├── pets[] → Pet
├── vehicles[] → Vehicle
├── fobs[] → FOB
├── buzzer_codes[] → BuzzerCode
├── garage_clickers[] → GarageClicker
├── emergency_contacts[] → EmergencyContact (denormalized from occupants)
├── documents[] → Document
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
├── created_by → User
└── updated_by → User
```

**Indexes**: `(property_id, number)` unique, `(building_id, floor)`, `(property_id, status)`.

### 4.2 UnitInstruction

```
UnitInstruction
├── id (UUID, auto-generated)
├── unit_id → Unit (required)
├── property_id → Property (denormalized)
├── instruction_text (text, required, max 1000)
├── priority (enum: normal, important, critical — default: normal)
├── visible_to_roles[] (UUID array — Role IDs, required, min 1)
├── active (boolean, default: true)
├── created_by → User (required)
├── created_at (timestamp with timezone)
├── updated_by → User
└── updated_at (timestamp with timezone)
```

### 4.3 OccupancyRecord

Tracks the historical link between a resident and a unit.

```
OccupancyRecord
├── id (UUID, auto-generated)
├── unit_id → Unit (required)
├── user_id → User (required)
├── property_id → Property (denormalized)
├── resident_type (enum: owner, tenant, offsite_owner, family_member)
├── move_in_date (date, required)
├── move_out_date (date, nullable — null means current occupant)
├── is_primary (boolean, default: false — primary contact for the unit)
├── notes (text, max 500, nullable)
├── recorded_by → User (staff who created the record)
├── created_at (timestamp with timezone)
└── updated_at (timestamp with timezone)
```

**Indexes**: `(unit_id, user_id)` unique where move_out_date IS NULL, `(property_id, move_out_date)` for vacancy reporting.

### 4.4 VacationRecord (v2)

```
VacationRecord
├── id (UUID, auto-generated)
├── user_id → User (required)
├── unit_id → Unit (required)
├── start_date (date, required)
├── end_date (date, required)
├── contact_while_away (varchar 200, nullable)
├── package_instructions (enum: hold, return_to_sender, leave_with_concierge — default: hold)
├── notes (text, max 500, nullable)
├── created_at (timestamp with timezone)
└── updated_at (timestamp with timezone)
```

### 4.5 MoveInChecklist / MoveOutChecklist (v2)

```
MoveChecklist
├── id (UUID, auto-generated)
├── unit_id → Unit (required)
├── user_id → User (resident, required)
├── checklist_type (enum: move_in, move_out)
├── status (enum: in_progress, completed, cancelled)
├── steps[] → MoveChecklistStep
├── started_at (timestamp)
├── completed_at (timestamp, nullable)
├── completed_by → User (staff)
├── created_at (timestamp with timezone)
└── updated_at (timestamp with timezone)

MoveChecklistStep
├── id (UUID)
├── checklist_id → MoveChecklist
├── step_name (varchar 200)
├── step_order (integer)
├── required (boolean)
├── completed (boolean, default: false)
├── completed_at (timestamp, nullable)
├── completed_by → User (nullable)
└── notes (text, max 500, nullable)
```

---

## 5. User Flows

### 5.1 Add a New Unit

```
1. Staff navigates to Units list page
2. Clicks "Add Unit" button
3. System displays Create Unit form
4. Staff fills required fields (Building, Unit Number, Floor, Type)
5. Staff optionally fills access details (Enter Phone Code, Parking Spot, Locker)
6. Staff optionally adds FOBs, buzzer codes, garage clickers
7. Staff optionally fills custom fields
8. Staff clicks "Create Unit"
9. System validates all fields
   → If validation fails: highlights errors inline, scrolls to first error
   → If validation passes:
     a. Creates unit record
     b. Creates FOB/buzzer/clicker records if provided
     c. Logs creation in audit trail
     d. Displays success toast: "Unit {number} created successfully"
     e. Redirects to Unit Overview
```

### 5.2 Add Resident to Unit

```
1. Staff navigates to Unit Overview
2. Clicks "Add Resident" in Occupants widget
3. System shows search panel: "Search existing residents or create new"
   → If existing: Staff searches by name or email, selects match
   → If new: Staff clicks "Create New Resident" and fills profile form
4. Staff sets Resident Type (Owner, Tenant, Offsite Owner, Family Member)
5. Staff sets Move-In Date (defaults to today)
6. Staff toggles "Primary Contact" if applicable
7. Staff clicks "Link Resident"
8. System:
   a. Creates OccupancyRecord
   b. Updates unit status to "Occupied" if was "Vacant"
   c. Triggers Move-In Workflow (v2) if configured
   d. Sends welcome email if configured
   e. Logs action in audit trail
   f. Real-time update pushes new occupant to other staff viewing this unit
```

### 5.3 Remove Resident from Unit (Move-Out)

```
1. Staff navigates to Unit Overview
2. Clicks "Remove" on a resident in Occupants widget
3. System shows confirmation dialog:
   - Move-Out Date field (defaults to today)
   - Reason dropdown (Lease Expired, Sold Unit, Voluntary, Eviction, Other)
   - Notes field
   - Outstanding items summary (pending packages, open requests, active FOBs)
4. Staff fills details and clicks "Confirm Move-Out"
5. System:
   a. Sets move_out_date on OccupancyRecord
   b. Deactivates all FOBs/clickers assigned to this resident for this unit
   c. If last occupant: sets unit status to "Vacant"
   d. Triggers Move-Out Workflow (v2) if configured
   e. Archives resident documents for this unit
   f. Logs action in audit trail
   g. Notifies Property Manager of outstanding items
```

### 5.4 Search for a Unit

```
1. Staff types in the search bar on Units list page
2. System searches across: unit number, resident first name, resident last name, phone number
3. Results update in real-time (debounced 300ms)
4. Staff can additionally filter by Building, Status, Type, Floor
5. Filters are additive (AND logic)
6. URL updates with filter params for shareable/bookmarkable filtered views
7. "Clear All Filters" link resets to default view
```

### 5.5 Front Desk Instruction Lookup (Cross-Module)

```
1. Staff is creating an event (package, visitor, etc.) in any module
2. Staff selects a unit from the unit dropdown
3. System checks for active instructions on that unit
   → If critical instructions exist:
     a. Amber banner appears below the unit field
     b. Banner shows instruction text and priority icon
     c. Banner is dismissible but re-appears on page reload
   → If important/normal instructions exist:
     a. Small info icon appears next to unit field
     b. Clicking shows instruction tooltip
4. Staff acknowledges and proceeds with their task
```

### 5.6 Bulk Import Units

```
1. Property Admin clicks "Bulk Import" on Units list page
2. System displays CSV Import Wizard
3. Step 1 - Upload:
   a. Admin downloads template CSV (link provided)
   b. Admin drags CSV file onto upload zone or clicks to browse
   c. System validates file format (CSV, max 5 MB)
   → If invalid: error message "Please upload a valid CSV file under 5 MB"
4. Step 2 - Mapping:
   a. System auto-detects column headers
   b. Admin reviews and adjusts column mappings
   c. Preview shows first 5 rows with mapped data
5. Step 3 - Validation:
   a. System validates all rows
   b. Displays: "{X} valid rows, {Y} errors, {Z} warnings"
   c. Errors listed with row number and field
   d. Admin chooses "Import valid rows" or "Download error report" to fix and retry
6. System creates units and displays results summary
7. Audit log records all created units with "bulk_import" source tag
```

---

## 6. UI/UX

### 6.1 Responsive Layouts

#### Units List Page

| Breakpoint | Layout |
|-----------|--------|
| **Desktop** (1280px+) | Full filter bar horizontally. Card grid: 4 columns. Table: all columns visible. |
| **Tablet** (768px-1279px) | Filters collapse into a "Filters" button that opens a slide-out panel. Card grid: 2 columns. Table: columns 7-10 hidden, accessible via horizontal scroll. |
| **Mobile** (< 768px) | Search bar visible, filters in slide-out. Card view only (table view hidden). Cards stack vertically, full width. "Add Unit" becomes a floating action button (bottom-right). |

#### Unit Overview Page

| Breakpoint | Layout |
|-----------|--------|
| **Desktop** | Two-column widget layout. Widgets 1-6 left, 7-12 right. Drag-reorder within and between columns. |
| **Tablet** | Single-column widget stack. Drag-reorder vertically. |
| **Mobile** | Single-column, all widgets collapsed by default except Instructions and Occupants. Drag disabled; fixed order. |

#### Resident Profile

| Breakpoint | Layout |
|-----------|--------|
| **Desktop** | Tabs render horizontally. Content area uses 2-column layout (fields left, widgets right). |
| **Tablet** | Tabs render horizontally (scrollable if needed). Content area single-column. |
| **Mobile** | Tabs render as a dropdown selector. Content area single-column. Profile header stacks vertically. |

### 6.2 Design Tokens

All colors, spacing, and typography follow the platform-wide design system (see DESIGN-SYSTEM.md).

| Token | Value | Usage |
|-------|-------|-------|
| `color-status-occupied` | `#34C759` (green) | Occupied unit badge, active resident indicator |
| `color-status-vacant` | `#8E8E93` (gray) | Vacant unit badge |
| `color-status-renovation` | `#FF9500` (orange) | Under renovation badge |
| `color-instruction-critical` | `#FF3B30` (red) | Critical instruction border and icon |
| `color-instruction-important` | `#FF9500` (amber) | Important instruction border |
| `color-instruction-normal` | `#8E8E93` (gray) | Normal instruction text |
| `color-away-badge` | `#5AC8FA` (blue) | Vacation/away status badge |
| `spacing-widget-gap` | 16px | Gap between Unit Overview widgets |
| `border-radius-card` | 12px | Unit card and widget card corners |

### 6.3 Tooltips and Progressive Disclosure

| Element | Tooltip / Help Text |
|---------|-------------------|
| Assistance Required toggle | "Enable if this resident requires special assistance during emergencies (e.g., mobility limitations, hearing impaired, visual impairment)." |
| Custom Fields section | "These fields are specific to your property. Contact your property administrator to add or change custom fields." |
| Package Email Notification toggle | "When enabled, all residents linked to this unit receive email notifications when a package arrives." |
| Emergency View toggle | "Shows all emergency contacts and assistance flags for this unit on a single, printable page." |
| FOB Status: Lost | "Marking a FOB as Lost deactivates it immediately. The deactivation date is set to today." |
| Bulk Import | "Upload a CSV file to create many units at once. Download the template to see the required format." |
| Primary Contact toggle | "The primary contact is shown first on the unit card and receives priority notifications." |

### 6.4 Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| `/` | Focus search bar | Units list page |
| `n` | Open Create Unit form | Units list page (when no input is focused) |
| `Esc` | Close modal / cancel edit | Global |
| `Ctrl+S` / `Cmd+S` | Save current form | Any edit form |
| `j` / `k` | Navigate to next / previous unit | Unit Overview page |

---

## 7. AI Integration

Unit Management integrates with 5 AI capabilities defined in 19-AI Framework (section 4.13, IDs 92-96). Plus 2 additional capabilities specific to front desk instruction management.

### 7.1 AI Capabilities

| ID | Capability | Trigger | What It Does | Graceful Degradation |
|----|-----------|---------|-------------|---------------------|
| 92 | **Resident Onboarding Checklist Generation** | New resident account creation | Analyzes unit type, building amenities, and building rules to generate a personalized onboarding checklist (e.g., a unit with a parking spot gets "Register vehicle" step, a pet-friendly building gets "Register pet" step) | Generic onboarding checklist used for all residents |
| 93 | **Missing Data Detection** | Weekly (Saturday 6:00 AM) | Scans all resident profiles and unit records to identify critical missing fields (no emergency contact, missing email, no FOB assigned, vacant unit with active FOBs). Generates a priority-ranked report. | No automated missing data reports; staff manually reviews profiles |
| 94 | **Move-In/Move-Out Prediction** | Monthly (15th of month) | Analyzes lease expiration dates, activity pattern changes (fewer package pickups, decreased amenity bookings), and historical turnover rates to predict upcoming moves in the next 60 days. | No predictions; staff relies on lease dates and manual tracking |
| 95 | **Resident Communication Preference Learning** | On each resident interaction | Tracks which notification channels (email, SMS, push) a resident responds to fastest and when they are most active. Updates their preference profile to optimize future communications. | Default notification preferences apply per role |
| 96 | **Unit History Summarization** | On demand (Unit Overview) | Creates a narrative summary of a unit's complete history: past residents, key maintenance events, notable incidents, modifications. Accessible via a "Summarize History" button in the Unit History widget. | Chronological log view with no narrative summary |

### 7.2 Smart Front Desk Instructions (New)

| Capability | Trigger | What It Does | Model | Est. Cost | Default |
|-----------|---------|-------------|-------|-----------|---------|
| **Instruction Drafting** | Staff clicks "Add Instruction" | Suggests instruction text based on the unit's profile (e.g., if a pet is registered: "Unit has a [breed] named [name]"). Staff reviews and edits before saving. | Haiku | $0.001 | Enabled |
| **Instruction Deduplication** | On instruction save | Checks new instruction against existing active instructions for the same unit. Flags potential duplicates with similarity percentage. | Haiku | $0.001 | Enabled |

### 7.3 Profile Auto-Complete (New)

| Capability | Trigger | What It Does | Model | Est. Cost | Default |
|-----------|---------|-------------|-------|-----------|---------|
| **Field Suggestion** | On resident profile creation | When partial data is available (e.g., name and email), suggests likely values for optional fields based on patterns in the property (e.g., most common language preference, typical emergency contact relationship types). | Haiku | $0.001 | Disabled |

### 7.4 AI Display Rules

- AI suggestions appear as light-purple "suggestion chips" below the relevant field
- Clicking a suggestion populates the field. Dismissing removes the chip.
- No "AI-powered" badges or branding. Suggestions feel like smart defaults.
- Acceptance rate is tracked per capability per property for quality monitoring.

---

## 8. Analytics

### 8.1 Dashboard Metrics (Property Manager View)

| Metric | Calculation | Visualization |
|--------|-------------|---------------|
| Total units | Count of all units | Single number |
| Occupancy rate | Occupied / Total * 100 | Percentage with trend arrow |
| Vacant units | Count where status = vacant | Single number (amber if > 10% of total) |
| Units under renovation | Count where status = under_renovation | Single number |
| Average occupancy duration | Mean of (move_out_date - move_in_date) across completed occupancies | Duration string |
| Move-ins this month | Count of OccupancyRecords created this month | Single number with MoM comparison |
| Move-outs this month | Count of OccupancyRecords closed this month | Single number with MoM comparison |
| Incomplete profiles | Count of residents missing email, phone, or emergency contact | Single number (red if > 0) |
| Missing emails | Count of residents with no email address on file | Single number with link to filtered User Directory view |
| Invalid emails | Count of residents whose last email delivery bounced | Single number (red if > 0) with link to filtered view |

### 8.2 Reportable Dimensions

| Dimension | Filters Available | Export Formats |
|----------|------------------|---------------|
| Unit status by building | Building, floor, type | CSV, Excel, PDF |
| Occupancy over time | Date range, building | CSV, Excel, PDF |
| FOB inventory | Status, type, building | CSV, Excel, PDF |
| Move-in/move-out log | Date range, resident type | CSV, Excel, PDF |
| Missing data report | Field category, building | CSV, Excel, PDF |
| Resident directory | Building, floor, resident type, group | CSV, Excel, PDF |
| Vacation/away list | Date range, active only | CSV, Excel, PDF |
| Custom field report | Any custom field as filter/column | CSV, Excel, PDF |

### 8.3 Audit Trail

Every action on a unit or resident generates an audit record:

| Audited Action | Details Captured |
|---------------|-----------------|
| Unit created | All initial field values, created_by, timestamp |
| Unit edited | Changed fields (before/after), updated_by, timestamp |
| Unit deleted | Full snapshot at deletion time, deleted_by, timestamp |
| Resident linked | Resident ID, unit ID, resident type, move-in date, recorded_by |
| Resident unlinked | Move-out date, reason, outstanding items, recorded_by |
| FOB issued/deactivated | Serial number, status change, changed_by, timestamp |
| Instruction added/edited/deactivated | Full text, priority, visibility, changed_by |
| Document uploaded/deleted | Document type, filename, uploaded_by |
| Bulk import | Row count, source file hash, import_by |
| Profile edited | Changed fields with before/after values |

---

## 9. Notifications

### 9.1 Notification Events

| Event | Recipients | Channels | Configurable |
|-------|-----------|----------|-------------|
| New resident added to unit | Property Manager, Unit occupants (existing) | Email, Push | Yes |
| Resident removed from unit | Property Manager | Email | Yes |
| Welcome email (move-in) | New resident | Email | Yes (template) |
| FOB reported lost | Property Manager, Security Supervisor | Email, Push | Yes |
| Critical instruction added | All staff roles in visible_to_roles | Push | Yes |
| Move-out checklist incomplete (48h) | Property Manager | Email, Push | Yes |
| Vacation start | Front Desk staff | Push | Yes |
| Vacation end | Front Desk staff | Push | Yes |
| Missing data report (weekly) | Property Manager, Property Admin | Email | Yes |
| Document expiring (30 days) | Property Manager, Resident | Email | Yes |
| Move-in/move-out prediction report | Property Manager | Email | Yes (v2) |

### 9.2 Notification Templates

Templates use `{{variable}}` placeholders. Property Admins can customize the subject, body, and channels per notification type.

**Example -- Welcome Email**:

```
Subject: Welcome to {{building_name}}, Unit {{unit_number}}!

Hi {{first_name}},

Welcome to your new home at {{building_name}}. Here are some things to get you started:

- Your portal login: {{portal_url}}
- Building office hours: {{office_hours}}
- Emergency contact: {{emergency_phone}}

Please complete your profile by adding your emergency contacts and vehicle information.

{{property_manager_name}}
{{property_name}}
```

### 9.3 Resident Notification Preferences

Residents control which notifications they receive per module:

| Module | Notification Types | Default |
|--------|-------------------|---------|
| Unit Management | Welcome email, Document expiry reminders | All enabled |
| Packages | Package arrived, Package reminder | All enabled |
| Maintenance | Request updates, Scheduled work | All enabled |
| Amenities | Booking confirmation, Booking reminders | All enabled |
| Announcements | Building announcements, Emergency alerts | All enabled (emergency non-disableable) |

---

## 10. API

### 10.1 Unit Endpoints

| Method | Endpoint | Description | Auth Roles |
|--------|----------|-------------|------------|
| GET | `/api/v1/units` | List units with filters and pagination | All staff, Board Member (read-only), Resident (own unit only) |
| GET | `/api/v1/units/:id` | Get unit detail with related data | All staff, Resident (own unit only) |
| POST | `/api/v1/units` | Create unit | Property Admin, Property Manager |
| PUT | `/api/v1/units/:id` | Update unit | Property Admin, Property Manager |
| DELETE | `/api/v1/units/:id` | Delete unit (soft delete) | Property Admin |
| GET | `/api/v1/units/:id/occupants` | List unit occupants (current and historical) | All staff |
| POST | `/api/v1/units/:id/occupants` | Link resident to unit | Property Admin, Property Manager |
| DELETE | `/api/v1/units/:id/occupants/:userId` | Unlink resident from unit | Property Admin, Property Manager |
| GET | `/api/v1/units/:id/instructions` | List unit instructions | All staff (filtered by role visibility) |
| POST | `/api/v1/units/:id/instructions` | Add instruction | Property Admin, Property Manager, Front Desk |
| PUT | `/api/v1/units/:id/instructions/:instructionId` | Update instruction | Property Admin, Property Manager |
| DELETE | `/api/v1/units/:id/instructions/:instructionId` | Deactivate instruction | Property Admin, Property Manager |
| GET | `/api/v1/units/:id/fobs` | List FOBs for unit | All staff |
| POST | `/api/v1/units/:id/fobs` | Issue FOB | Property Admin, Property Manager |
| PUT | `/api/v1/units/:id/fobs/:fobId` | Update FOB status | Property Admin, Property Manager, Security |
| GET | `/api/v1/units/:id/history` | Get occupancy history | Property Admin, Property Manager |
| POST | `/api/v1/units/bulk-import` | Bulk import units from CSV | Property Admin |
| GET | `/api/v1/units/:id/emergency-view` | Get emergency view data (all contacts, flags) | All staff |

### 10.2 Resident Endpoints

| Method | Endpoint | Description | Auth Roles |
|--------|----------|-------------|------------|
| GET | `/api/v1/residents` | List residents with filters | All staff, Board Member (limited fields) |
| GET | `/api/v1/residents/:id` | Get resident profile | All staff, Resident (own profile only) |
| POST | `/api/v1/residents` | Create resident | Property Admin, Property Manager |
| PUT | `/api/v1/residents/:id` | Update resident profile | Property Admin, Property Manager, Resident (self, limited fields) |
| GET | `/api/v1/residents/:id/emergency-contacts` | List emergency contacts | All staff, Resident (own) |
| POST | `/api/v1/residents/:id/emergency-contacts` | Add emergency contact | Property Admin, Property Manager, Resident (own) |
| PUT | `/api/v1/residents/:id/emergency-contacts/:contactId` | Update emergency contact | Property Admin, Property Manager, Resident (own) |
| DELETE | `/api/v1/residents/:id/emergency-contacts/:contactId` | Delete emergency contact | Property Admin, Property Manager, Resident (own) |
| GET | `/api/v1/residents/:id/vehicles` | List vehicles | All staff, Resident (own) |
| POST | `/api/v1/residents/:id/vehicles` | Add vehicle | Property Admin, Property Manager, Resident (own) |
| PUT | `/api/v1/residents/:id/vehicles/:vehicleId` | Update vehicle | Property Admin, Property Manager, Resident (own) |
| DELETE | `/api/v1/residents/:id/vehicles/:vehicleId` | Delete vehicle | Property Admin, Property Manager, Resident (own) |
| GET | `/api/v1/residents/:id/pets` | List pets | All staff, Resident (own) |
| POST | `/api/v1/residents/:id/pets` | Add pet | Property Admin, Property Manager, Resident (own) |
| PUT | `/api/v1/residents/:id/pets/:petId` | Update pet | Property Admin, Property Manager, Resident (own) |
| DELETE | `/api/v1/residents/:id/pets/:petId` | Delete pet | Property Admin, Property Manager, Resident (own) |
| GET | `/api/v1/residents/:id/documents` | List documents | Property Admin, Property Manager, Resident (own) |
| POST | `/api/v1/residents/:id/documents` | Upload document | Property Admin, Property Manager, Resident (own) |
| DELETE | `/api/v1/residents/:id/documents/:documentId` | Delete document | Property Admin, Property Manager |
| GET | `/api/v1/residents/:id/vacations` | List vacations | All staff, Resident (own) |
| POST | `/api/v1/residents/:id/vacations` | Add vacation | Property Admin, Property Manager, Resident (own) |

### 10.3 Query Parameters (GET /api/v1/units)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `building_id` | UUID | Filter by building | `?building_id=abc-123` |
| `floor` | Integer | Filter by floor | `?floor=12` |
| `status` | Enum | Filter by status | `?status=occupied` |
| `type` | Enum | Filter by unit type | `?type=residential` |
| `search` | String | Full-text search | `?search=kodavali` |
| `page` | Integer | Page number (1-indexed) | `?page=2` |
| `per_page` | Integer | Items per page (25, 50, 100) | `?per_page=50` |
| `sort` | String | Sort field | `?sort=number` |
| `order` | Enum | Sort direction (asc, desc) | `?order=asc` |
| `has_instructions` | Boolean | Filter units with active instructions | `?has_instructions=true` |
| `has_vacancies` | Boolean | Alias for status=vacant | `?has_vacancies=true` |

### 10.4 Response Shapes

**GET /api/v1/units (list)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "number": "1205",
      "floor": 12,
      "building": { "id": "uuid", "name": "Tower A" },
      "unit_type": "residential",
      "status": "occupied",
      "primary_occupant": { "id": "uuid", "first_name": "Ray", "last_name": "Kodavali" },
      "occupant_count": 3,
      "has_instructions": true,
      "instruction_max_priority": "critical",
      "active_fob_count": 4,
      "pending_package_count": 2,
      "open_maintenance_count": 1,
      "last_activity_at": "2026-03-14T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 312,
    "total_pages": 7
  }
}
```

**GET /api/v1/units/:id (detail)**:

```json
{
  "data": {
    "id": "uuid",
    "number": "1205",
    "floor": 12,
    "building": { "id": "uuid", "name": "Tower A" },
    "unit_type": "residential",
    "status": "occupied",
    "square_footage": 850.00,
    "enter_phone_code": "*1205",
    "parking_spot": "B-10",
    "locker": "L-42",
    "package_email_notification": true,
    "comments": "Corner unit, good natural light.",
    "custom_fields": { "locker_number": "B-42", "bike_storage": "Rack 7" },
    "occupants": [],
    "instructions": [],
    "fobs": [],
    "buzzer_codes": [],
    "garage_clickers": [],
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2026-03-14T10:30:00Z"
  }
}
```

### 10.5 WebSocket Events

| Event | Payload | Who Receives |
|-------|---------|-------------|
| `unit.updated` | Unit ID + changed fields | Staff viewing that unit or unit list |
| `unit.occupant.added` | Unit ID + resident summary | Staff viewing that unit |
| `unit.occupant.removed` | Unit ID + resident ID | Staff viewing that unit |
| `unit.instruction.created` | Unit ID + instruction summary | Staff with matching role visibility |
| `unit.fob.status_changed` | Unit ID + FOB ID + new status | Staff viewing that unit |

---

## 11. Completeness Checklist

### Functional Coverage

| Requirement | Section | Status |
|------------|---------|--------|
| Unit CRUD (create, read, update, delete) | 3.1.1, 3.1.2 | Specified |
| Unit list with filters, search, pagination | 3.1.1 | Specified |
| Card view and table view toggle | 3.1.1 | Specified |
| Modular, drag-reorderable unit overview | 3.1.3 | Specified |
| Front desk instructions with priority/visibility | 3.1.4 | Specified |
| Resident profile (8 tabs) | 3.1.5 | Specified |
| Physical access tracking (FOBs, buzzers, clickers) | 3.1.6 | Specified |
| Emergency contacts (prominently featured) | 3.1.7 | Specified |
| Occupant history timeline | 3.1.8 | Specified |
| Custom fields (JSONB) | 3.1.2, 3.1.3 | Specified |
| Move-in workflow | 3.2.1 | Specified (v2) |
| Move-out workflow | 3.2.2 | Specified (v2) |
| Vacation/away tracking | 3.2.3 | Specified (v2) |
| Bulk import via CSV | 3.2.4 | Specified (v2) |
| Unit comparison view | 3.2.5 | Specified (v2) |

### Field-Level Completeness

| Entity | Fields Specified | Data Types | Validations | Error Messages |
|--------|-----------------|------------|-------------|----------------|
| Unit (create/edit) | 11 fields | Yes | Yes | Yes |
| Resident Profile Tab 1 | 17 fields | Yes | Yes | Yes |
| Emergency Contact | 6 fields | Yes | Yes | Yes |
| FOB / Access Device | 8 fields | Yes | Yes | Yes |
| Buzzer Code | 3 fields | Yes | Yes | Yes |
| Garage Clicker | 4 fields | Yes | Yes | Yes |
| Vehicle | 7 fields | Yes | Yes | Yes |
| Pet | 6 fields | Yes | Yes | Yes |
| Document | 4 fields | Yes | Yes | Yes |
| Front Desk Instruction | 4 fields | Yes | Yes | Yes |
| Vacation Record | 5 fields | Yes | Yes | Yes |

### UX Coverage

| Requirement | Section | Status |
|------------|---------|--------|
| Desktop layout | 6.1 | Specified |
| Tablet layout | 6.1 | Specified |
| Mobile layout | 6.1 | Specified |
| Empty states with guidance | 3.1.1, 3.1.3, 3.1.5 | Specified (all widgets) |
| Loading states | 3.1.1 | Specified |
| Error states | 3.1.1 | Specified |
| Tooltips for complex features | 6.3 | Specified (7 tooltips) |
| Progressive disclosure | 3.1.3 | Specified (collapsed widgets) |
| Keyboard shortcuts | 6.4 | Specified (5 shortcuts) |

### Technical Coverage

| Requirement | Section | Status |
|------------|---------|--------|
| Data model with types and constraints | 4 | Specified (5 entities) |
| API endpoints with auth roles | 10 | Specified (30+ endpoints) |
| WebSocket real-time events | 10.5 | Specified (5 events) |
| Query parameters for filtering/pagination | 10.3 | Specified (12 params) |
| Response shapes (JSON) | 10.4 | Specified (list + detail) |
| Audit trail | 8.3 | Specified (10 action types) |

### Integration Points

| Module | Integration | Section |
|--------|------------|---------|
| 01-Architecture | Data model, custom fields, role-aware rendering | 4 |
| 02-Roles and Permissions | 10 distinct permission levels across endpoints | 10 |
| 03-Security Console | Critical instructions surface in security context | 5.5 |
| 04-Package Management | Package tab on resident profile, vacation package instructions | 3.1.5 Tab 3, 3.2.3 |
| 05-Maintenance | Maintenance tab on resident profile, unit maintenance widget | 3.1.5 Tab 4 |
| 06-Amenity Booking | Amenities tab on resident profile, unit reservation widget | 3.1.5 Tab 5 |
| 10-Parking Management | Parking tab on resident profile, parking widget on unit | 3.1.5 Tab 6 |
| 19-AI Framework | 7 AI capabilities (IDs 92-96 + 2 new) | 7 |

---

*Document length: 700+ lines*
*Entities defined: 7 (Unit, UnitInstruction, OccupancyRecord, VacationRecord, MoveChecklist, MoveChecklistStep, plus references to FOB/Vehicle/Pet/EmergencyContact/Document from 01-Architecture)*
*Total fields specified: 75+*
*API endpoints: 30+*
*AI capabilities: 7*
