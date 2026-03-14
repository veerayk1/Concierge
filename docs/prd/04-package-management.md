# 04 — Package Management

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

Package Management is the module responsible for the entire lifecycle of deliveries at a residential building -- from the moment a courier drops off a parcel at the front desk to the moment a resident picks it up (or a staff member returns it). This module is one of the highest-traffic features in any condo management platform. A typical 500-unit building processes 50-200 packages per day, with peaks during holiday seasons reaching 400+.

### Why This Module Matters

- **Liability**: Buildings are responsible for packages once accepted. Proper tracking protects against loss claims.
- **Resident satisfaction**: Package pickup is the single most frequent reason residents interact with the front desk. A smooth experience builds trust.
- **Staff efficiency**: During peak delivery windows (10 AM - 2 PM), front desk staff may process 50+ packages in a single hour. Every second saved per package intake adds up.
- **Storage management**: Physical parcel rooms have finite space. Tracking what is stored where, and escalating uncollected items, prevents overflow.

### How It Fits in the Platform

Package Management is built on the Unified Event Model defined in the Architecture specification (PRD 01). Packages are a specialized event group with their own event types (one per courier), lifecycle states, and notification templates. This means packages benefit from the same configurable infrastructure as every other event type -- custom fields, notification routing, audit trails, and analytics -- without being hard-coded.

### Scope

This module covers:

- Single and batch package intake (logging received packages)
- Package release with identity verification, signature capture, and photo proof
- Storage spot tracking and capacity management
- Perishable and oversized package handling
- Label printing with reference numbers and barcodes
- Resident self-service package viewing and notification preferences
- Courier integration and tracking number management
- Package analytics and reporting
- Outgoing package logging

This module does NOT cover:

- Locker system hardware integration (v3+)
- Courier API real-time tracking webhooks (v3+)
- Return/RMA processing (v3+)

---

## 2. Research Summary

### What Industry Research Revealed

We analyzed three production platforms serving condominiums across North America. Key findings:

| Area | Best Practice Observed | Gap Identified | Our Decision |
|------|----------------------|----------------|--------------|
| **Courier tracking** | One platform uses 15 courier-specific event types with branded icons, colors, and notification templates per courier | Others use a single generic "parcel" type with a text-only courier dropdown | Courier-aware intake with branded icons for visual recognition + an "Other" option for unlisted couriers |
| **Package types** | One platform defines 11 physical description categories (e.g., "small brown box", "large white package") | No platform combines physical type with courier identity | Both dimensions: courier identity (who delivered) + physical description (what it looks like) |
| **Batch intake** | One platform offers a 4-row batch form with per-row notification control and print-label toggles | Others have single-package forms only, with a separate "bulk" button | Expandable batch form (1-20 rows) with per-row controls for notifications, labels, and storage |
| **Notifications** | One platform supports email + voice call + SMS per package event | Others offer email only | Multi-channel from v1: email + SMS + push notification |
| **Release flow** | One platform shows a dedicated release sub-form with "Released to" name, comments, and a premium signature capture field | Others use a single-click release button with no verification | Two-step release: identity check (name match or ID), then optional signature/photo proof |
| **Storage tracking** | One platform has a storage spot dropdown during intake | Others do not track physical location | Storage spot selection during intake + capacity tracking + AI-suggested storage |
| **Perishable handling** | Two platforms offer a perishable checkbox, one has a dedicated "Perishables" courier type with its own notification template | No platform escalates perishable items automatically | Perishable flag with automatic immediate notification + configurable escalation timer |
| **Reference numbers** | Two platforms auto-generate sequential reference numbers per package | One uses a shared global counter across all event types | Per-property sequential reference numbers with optional barcode encoding |
| **Label printing** | Two platforms integrate label printing per event during intake | One has no print capability | Label printing with reference number, unit, resident name, courier, barcode, and timestamp |
| **Resident self-service** | One platform shows packages in a resident portal; others restrict package views to staff only | No platform lets residents initiate self-service release (e.g., authorize a family member to pick up) | Resident portal shows pending packages, notification history, and authorized pickup delegates |
| **Analytics** | One platform generates weekly delivery pattern reports | No platform forecasts volume or identifies courier performance trends | AI-powered analytics: volume forecasting, courier performance, peak time staffing recommendations |

### Key Differentiators for Concierge

1. **AI-native intake**: Camera-based courier logo detection, tracking number OCR, and package description auto-generation reduce data entry to 2-3 taps per package.
2. **Smart notification batching**: Instead of bombarding a resident with 5 separate emails for 5 Amazon boxes, Concierge batches them into a single notification.
3. **Proactive escalation**: Perishable items and long-uncollected packages trigger escalation chains automatically -- no manual follow-up needed.
4. **Storage capacity awareness**: The system knows how full the parcel room is and warns staff when capacity is running low.
5. **Resident pickup delegation**: Residents can authorize other people (family, dog walker, cleaning service) to pick up packages on their behalf.

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Single Package Intake

Staff logs a received package through a quick-entry form.

**Entry points**:
- Dashboard quick-action button ("+ Package")
- Package listing page "New Package" button
- Security Console quick-create icon (package icon)
- Keyboard shortcut: `Ctrl/Cmd + Shift + P`

**Form fields**:

| # | Field | Label | Type | Required | Default | Max Length | Validation | Error Message | Tooltip |
|---|-------|-------|------|----------|---------|------------|------------|---------------|---------|
| 1 | `direction` | Direction | Toggle (2 options) | Yes | "Incoming" | -- | Must be "Incoming" or "Outgoing" | -- | "Incoming = received from courier. Outgoing = leaving the building (e.g., return shipment)." |
| 2 | `building_id` | Building | Dropdown | Yes | Current building (auto) | -- | Must be a valid building in the property | "Please select a building." | Only shown for multi-building properties. |
| 3 | `reference_number` | Reference # | Read-only text | Auto | Auto-generated | 10 chars | System-generated sequential | -- | "Unique tracking number assigned by the system. Use this when searching for the package." |
| 4 | `unit_id` | Unit | Autocomplete dropdown | Yes | Empty | -- | Must match a valid unit in the selected building | "Please select a valid unit." | "Start typing a unit number. The system will suggest matches." |
| 5 | `resident_id` | Recipient | Autocomplete dropdown | Yes | Auto-populated from unit | -- | Must be a resident or occupant of the selected unit | "Please select a valid recipient for this unit." | "The person the package is addressed to. If the name on the label doesn't match any resident, select the closest match and add a note." |
| 6 | `courier_id` | Courier | Icon grid (15 options) | No | None selected | -- | -- | -- | "Tap the courier logo. If the courier is not listed, select 'Other' and type the name." |
| 7 | `courier_other_name` | Courier Name | Text input | Cond. (if "Other" selected) | Empty | 100 chars | Min 1 character if "Other" selected | "Please enter the courier name." | Only visible when "Other" is selected from the courier grid. |
| 8 | `tracking_number` | Tracking # | Text input | No | Empty | 100 chars | Alphanumeric + hyphens only | "Tracking numbers can only contain letters, numbers, and hyphens." | "The tracking number from the shipping label. You can also scan it with your device camera." |
| 9 | `parcel_category_id` | Package Type | Dropdown | No | None | -- | Must match a configured parcel category | -- | "Describes the physical appearance. Helps residents identify their package at pickup." |
| 10 | `description` | Description | Text input | No | Empty | 500 chars | -- | -- | "Any additional details: sender name visible, condition notes, special markings." |
| 11 | `storage_spot_id` | Storage Location | Dropdown | No | Property default | -- | Must match a configured storage spot | -- | "Where you are physically placing this package. Helps colleagues find it during release." |
| 12 | `is_perishable` | Perishable | Toggle switch | No | Off | -- | -- | -- | "Turn on for food, flowers, medication, or anything that can spoil. The resident will be notified immediately." |
| 13 | `is_oversized` | Oversized | Toggle switch | No | Off | -- | -- | -- | "Turn on for items that won't fit in standard storage (furniture, appliances, large boxes)." |
| 14 | `photo` | Photo | Camera/upload button | No | None | 10 MB per photo, max 3 | JPG, PNG, HEIC only | "Photos must be JPG, PNG, or HEIC format and under 10 MB." | "Take a photo of the package for documentation. Useful for damage claims and identification." |
| 15 | `notify_resident` | Send Notification | Dropdown | No | "Default" | -- | -- | -- | "Choose how to notify the resident. 'Default' uses their preferred channel." |

**Notification dropdown options**:

| Value | Label | Behavior |
|-------|-------|----------|
| `default` | Default (use resident preference) | Sends via the channel the resident has configured in their notification settings |
| `email` | Email only | Sends email notification |
| `sms` | SMS only | Sends SMS notification |
| `push` | Push notification only | Sends mobile push notification |
| `all` | All channels | Sends via email + SMS + push |
| `none` | Do not notify | No notification sent (useful for packages already handed directly to resident) |

**Courier icon grid (15 couriers)**:

| # | Courier Name | Icon | Color Badge | Notification Template Subject |
|---|-------------|------|-------------|-------------------------------|
| 1 | Amazon | Amazon logo | Orange | "Your Amazon delivery has arrived" |
| 2 | Canada Post | Canada Post logo | Red | "You have a Canada Post delivery" |
| 3 | Canpar | Canpar logo | Blue | "Your Canpar package has arrived" |
| 4 | DHL | DHL logo | Yellow | "Your DHL delivery is here" |
| 5 | FedEx | FedEx logo | Purple | "Your FedEx package has arrived" |
| 6 | UPS | UPS logo | Brown | "Your UPS delivery is here" |
| 7 | Purolator | Purolator logo | Red | "Your Purolator package has arrived" |
| 8 | USPS | USPS logo | Blue | "Your USPS mail has arrived" |
| 9 | IntelCom | IntelCom logo | Green | "Your IntelCom delivery is here" |
| 10 | Uber Eats | Uber Eats logo | Black | "Your Uber Eats order is at the front desk" |
| 11 | DoorDash | DoorDash logo | Red | "Your DoorDash order is at the front desk" |
| 12 | SkipTheDishes | Skip logo | Orange | "Your SkipTheDishes order is at the front desk" |
| 13 | Individual Drop-Off | Person icon | Grey | "A personal delivery has arrived for you" |
| 14 | Property Management | Building icon | Teal | "You have a delivery from property management" |
| 15 | Other | Ellipsis icon | Grey | "You have a package delivery" |

**Parcel categories (11 default, configurable by admin)**:

| # | Category | Description |
|---|----------|-------------|
| 1 | Small Envelope | Letter-sized envelope or mailer |
| 2 | Large Envelope | Padded or oversized envelope |
| 3 | Small Box | Shoebox size or smaller |
| 4 | Medium Box | Standard moving box size |
| 5 | Large Box | Larger than standard box |
| 6 | Oversized Item | Furniture, appliances, or non-box items |
| 7 | Bag | Plastic or paper bag delivery |
| 8 | Tube | Poster tube or cylindrical package |
| 9 | Perishable Container | Insulated food/medicine packaging |
| 10 | Flowers | Floral delivery |
| 11 | Other | Anything not matching above categories |

**Button: "Save Package"**

| State | Behavior |
|-------|----------|
| **Default** | Blue primary button, label "Save Package" |
| **Loading** | Button disabled, spinner replaces text, label "Saving..." |
| **Success** | Toast notification: "Package #{reference_number} saved. {Resident name} notified via {channel}." Form resets for next entry. |
| **Success (no notification)** | Toast: "Package #{reference_number} saved. No notification sent." |
| **Failure (validation)** | Inline error messages appear below invalid fields. Button remains enabled. |
| **Failure (server)** | Toast error: "Could not save package. Please try again." Button re-enables. Package data preserved in form. |

**Button: "Save & New"**

Same behavior as "Save Package" but clears the form and keeps the focus in the form for the next entry. Building, storage location, and notification preference carry over from the previous entry.

**Button: "Cancel"**

Closes the form. If any fields have been modified, shows a confirmation dialog: "You have unsaved changes. Discard this package entry?" with "Discard" and "Keep Editing" buttons.

#### 3.1.2 Batch Package Intake

For high-volume delivery windows, staff can log multiple packages in a single form.

**Entry point**: "Batch Intake" button on the Package Intake form (top-right corner, secondary button style).

**Form layout**: A table-style form where each row represents one package. Starts with 4 rows, expandable to 20.

**Per-row fields**:

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | Unit | Autocomplete | Yes | Unit number |
| 2 | Recipient | Autocomplete | Yes | Auto-populated from unit |
| 3 | Courier | Icon selector (compact) | No | Compact courier dropdown with icons |
| 4 | Tracking # | Text input | No | Tracking number |
| 5 | Category | Dropdown | No | Parcel category |
| 6 | Storage | Dropdown | No | Storage location |
| 7 | Perishable | Checkbox | No | Perishable flag |
| 8 | Notify | Dropdown | No | Notification channel |
| 9 | Print Label | Checkbox | No | Print label on save |
| 10 | Remove | Icon button (trash) | -- | Remove this row |

**Buttons**:

| Button | Style | Action |
|--------|-------|--------|
| "+ Add Row" | Text link | Adds a new empty row. Maximum 20 rows. Disabled at 20 with tooltip "Maximum 20 packages per batch." |
| "Save All ({n})" | Primary | Saves all rows with valid data. `{n}` shows the count of valid rows. Loading state: "Saving {n} packages..." |
| "Cancel" | Secondary | Closes batch form. Confirmation dialog if any rows have data. |

**Success state**: Toast: "Saved {n} packages. {m} notifications sent. {p} labels queued for printing."

**Partial failure**: If some rows fail validation, valid rows are saved and invalid rows remain in the form with inline errors. Toast: "Saved {x} of {n} packages. {y} packages have errors -- please review."

#### 3.1.3 Package Release Flow

When a resident arrives to pick up a package, staff processes the release.

**Entry points**:
- "Release" button in the Action column of the package listing table
- "Release Package" button in the package detail view
- Quick-release via barcode scan (scan the label, system opens release dialog)

**Step 1 -- Verify Identity**

| # | Field | Label | Type | Required | Default | Validation | Error Message |
|---|-------|-------|------|----------|---------|------------|---------------|
| 1 | `released_to_name` | Picked Up By | Text input | Yes | Auto-filled with recipient name | Min 2 characters | "Please enter the name of the person picking up." |
| 2 | `id_verified` | ID Verified | Checkbox | Configurable (per property setting) | Unchecked | -- | -- |
| 3 | `is_authorized_delegate` | Authorized Delegate | Checkbox | No | Unchecked | If checked, must match an authorized delegate in the system | "This person is not listed as an authorized delegate for this unit." |
| 4 | `release_comments` | Comments | Text input | No | Empty | 500 chars max | -- |

**Step 2 -- Capture Proof (configurable per property)**

| # | Field | Label | Type | Required | Default | Validation | Error Message |
|---|-------|-------|------|----------|---------|------------|---------------|
| 1 | `signature` | Signature | Signature pad (touch/mouse draw) | Configurable | Empty | If required, must have at least one stroke | "Please provide a signature." |
| 2 | `release_photo` | Photo | Camera button | Configurable | None | JPG/PNG/HEIC, max 10 MB | "Photo must be JPG, PNG, or HEIC under 10 MB." |

**Button: "Release Package"**

| State | Behavior |
|-------|----------|
| **Default** | Green primary button, label "Release Package" |
| **Loading** | Disabled, spinner, "Releasing..." |
| **Success** | Toast: "Package #{ref} released to {name}." Package moves from "Unreleased" to "Released" section. |
| **Failure** | Toast: "Could not release package. Please try again." Form data preserved. |

**Batch release**: When a resident has multiple unreleased packages, the release dialog shows all of them in a checklist. Staff can select individual packages or "Select All" and process a single release with one signature/verification.

| Button | Label | Action |
|--------|-------|--------|
| "Release Selected ({n})" | Primary (green) | Releases all checked packages. Single signature covers all. |
| "Release All ({total})" | Secondary | Selects and releases all unreleased packages for this resident. |

#### 3.1.4 Package Listing and Search

The main Package Management page shows two sections.

**Section 1: Unreleased Packages**

Table showing all packages that have been received but not yet picked up.

| # | Column | Sortable | Default Sort | Description |
|---|--------|----------|-------------|-------------|
| 1 | Ref # | Yes | -- | Auto-generated reference number |
| 2 | Unit | Yes | -- | Unit number |
| 3 | Recipient | Yes | -- | Resident name |
| 4 | Courier | Yes | -- | Courier name with icon |
| 5 | Description | No | -- | Package description or category |
| 6 | Received | Yes | Descending (newest first) | Date/time package was logged |
| 7 | Age | Yes | -- | Time since receipt (e.g., "2h", "1d", "3d") with color coding: green (< 24h), yellow (24-72h), red (> 72h) |
| 8 | Storage | Yes | -- | Storage location |
| 9 | Perishable | Yes | -- | Perishable badge (red "PERISHABLE" tag) if flagged |
| 10 | Actions | No | -- | Release, View, Edit, Delete (icon buttons) |

**Default sort**: Perishable packages first, then by received date (newest first).

**Section 2: Released Packages**

Same columns as Section 1, plus:

| # | Additional Column | Description |
|---|-------------------|-------------|
| 11 | Released To | Name of person who picked up |
| 12 | Released At | Date/time of release |
| 13 | Released By | Staff member who processed release |

**Default date range**: Past 30 days (configurable in property settings).

**Search and Filter Bar**:

| # | Filter | Type | Description |
|---|--------|------|-------------|
| 1 | Search | Text input | Searches across: recipient name, reference number, tracking number, description, courier name |
| 2 | Building | Dropdown | Filter by building (multi-building properties) |
| 3 | Unit | Autocomplete | Filter by specific unit |
| 4 | Courier | Multi-select dropdown | Filter by one or more couriers |
| 5 | Status | Dropdown | "All", "Unreleased", "Released" |
| 6 | Perishable | Toggle | Show only perishable packages |
| 7 | Date Range | Date range picker | Start and end date |
| 8 | Storage Location | Dropdown | Filter by storage spot |

**Buttons on listing page**:

| Button | Label | Action | Permission |
|--------|-------|--------|------------|
| "New Package" | Primary | Opens single package intake form | Staff roles |
| "Batch Intake" | Secondary | Opens batch intake form | Staff roles |
| "Print Unreleased" | Secondary | Generates printable list of all unreleased packages | Staff roles |
| "Export" | Secondary | Export to Excel or PDF with current filters applied | Admin, Manager, Supervisor |

**Empty state (no packages)**:

```
+--------------------------------------------------+
|                                                    |
|              [Package icon illustration]           |
|                                                    |
|          No packages have been logged yet          |
|                                                    |
|   Packages will appear here as they are received   |
|   at the front desk.                               |
|                                                    |
|              [+ Log First Package]                 |
|                                                    |
+--------------------------------------------------+
```

**Empty state (no search results)**:

```
+--------------------------------------------------+
|                                                    |
|              [Search icon illustration]            |
|                                                    |
|       No packages match your search filters        |
|                                                    |
|   Try adjusting your filters or search terms.      |
|                                                    |
|              [Clear All Filters]                   |
|                                                    |
+--------------------------------------------------+
```

**Loading state**: Skeleton rows (8 rows) with pulsing animation replacing table content. Filter bar remains interactive during loading.

**Error state**: Inline error banner above the table: "Unable to load packages. Please try again." with a "Retry" button.

#### 3.1.5 Package Detail View

Clicking a package row (or "View" icon) opens the package detail panel.

**Layout**: Slide-out panel from the right (desktop) or full-screen modal (mobile/tablet).

**Sections**:

| Section | Fields Displayed |
|---------|-----------------|
| **Header** | Reference #, Status badge (Unreleased / Released), Perishable badge, Oversized badge |
| **Package Info** | Direction, Courier (with icon), Tracking # (linked to courier tracking page if available), Category, Description, Photo(s) |
| **Recipient Info** | Unit #, Resident name, Contact phone, Contact email |
| **Storage** | Storage location, Date received, Age |
| **Release Info** (if released) | Released to, Released by (staff), Released at (timestamp), Signature image, Release photo, Comments |
| **History** | Audit trail: Created, Notification sent, Reminder sent, Released -- each with timestamp and actor |

**Action buttons (unreleased packages)**:

| Button | Label | Style | Action |
|--------|-------|-------|--------|
| "Release" | Primary (green) | Opens release flow | -- |
| "Send Reminder" | Secondary | Sends reminder notification to resident | -- |
| "Edit" | Secondary | Opens edit form | -- |
| "Print Label" | Secondary | Prints package label | -- |
| "Delete" | Danger (red text) | Soft-deletes the package with confirmation dialog | -- |

**Send Reminder button states**:

| State | Behavior |
|-------|----------|
| **Default** | Secondary button, label "Send Reminder" |
| **Loading** | Disabled, spinner, "Sending..." |
| **Success** | Toast: "Reminder sent to {resident_name} via {channel}." Button changes to "Reminder Sent" (disabled) for 5 minutes to prevent spam. |
| **Failure** | Toast: "Could not send reminder. Please try again." |

**Action buttons (released packages)**: "Print Receipt" only (no editing or deleting released packages).

#### 3.1.6 Reference Number Generation

Every package receives a unique reference number on creation.

| Attribute | Value |
|-----------|-------|
| **Format** | `PKG-{PROPERTY_CODE}-{SEQUENTIAL_NUMBER}` |
| **Example** | `PKG-QPC-004821` |
| **Property code** | 2-5 uppercase alphanumeric characters, configured in property settings |
| **Sequential number** | 6-digit zero-padded integer, per property, never reused |
| **Barcode encoding** | Code 128, printed on package label |
| **Reset** | Never resets. Continues incrementing indefinitely. |

#### 3.1.7 Label Printing

Staff can print a label to affix to the physical package.

**Label content**:

| Line | Content | Font Size |
|------|---------|-----------|
| 1 | Property name | 10pt |
| 2 | Reference # (human-readable) | 14pt bold |
| 3 | Barcode (Code 128 of reference #) | -- |
| 4 | Unit # and Recipient name | 18pt bold |
| 5 | Courier name | 10pt |
| 6 | Storage location | 10pt |
| 7 | Received date/time | 8pt |
| 8 | "PERISHABLE" (if flagged) | 12pt bold red |

**Label size**: Standard 4" x 2" shipping label (configurable in settings).

**Print trigger**: Per-package "Print Label" button, batch print checkbox during intake, or "Print All Unreleased Labels" from the listing page.

**Print button states**:

| State | Behavior |
|-------|----------|
| **Default** | Secondary button with printer icon, label "Print Label" |
| **Loading** | Disabled, "Sending to printer..." |
| **Success** | Toast: "Label sent to printer." |
| **Failure (no printer)** | Toast: "No printer configured. Go to Settings > Packages > Label Printer to set up." |
| **Failure (printer error)** | Toast: "Printer error. Check the connection and try again." |

#### 3.1.8 Storage Spot Management

Administrators configure available storage locations. Staff assigns packages to spots during intake.

**Storage spot configuration (Settings > Packages > Storage Spots)**:

| # | Field | Type | Required | Max Length | Description |
|---|-------|------|----------|------------|-------------|
| 1 | `name` | Text input | Yes | 100 chars | Display name (e.g., "Parcel Room - Shelf A") |
| 2 | `code` | Text input | Yes | 10 chars | Short code for labels (e.g., "PR-A") |
| 3 | `capacity` | Number input | No | -- | Max packages this spot can hold (0 = unlimited) |
| 4 | `is_refrigerated` | Toggle | No | false | Marks spot as refrigerated (for perishable auto-assignment) |
| 5 | `building_id` | Dropdown | Yes | -- | Which building this spot belongs to |
| 6 | `sort_order` | Number input | No | 0 | Display order in dropdowns |
| 7 | `is_active` | Toggle | No | true | Active/inactive toggle |

**Capacity tracking**: When a storage spot has a capacity limit, the system tracks how many unreleased packages are assigned to it. The dropdown shows: "Parcel Room - Shelf A (12/20)" where 12 is current and 20 is capacity.

**Capacity warning**: When a spot reaches 80% capacity, it shows in yellow. At 100%, it shows in red and the system suggests alternative spots.

**Empty state (no storage spots configured)**:

```
+--------------------------------------------------+
|                                                    |
|          No storage spots configured yet           |
|                                                    |
|   Add storage locations so staff knows where to    |
|   place incoming packages.                         |
|                                                    |
|              [+ Add Storage Spot]                  |
|                                                    |
+--------------------------------------------------+
```

#### 3.1.9 Perishable Package Handling

Perishable packages require special attention due to spoilage risk.

**Behavior when `is_perishable` is toggled on**:

1. **Immediate notification**: Resident is notified immediately via all available channels (email + SMS + push), regardless of the notification preference selected on the form. Override message: "You have a perishable delivery that requires prompt pickup."
2. **Visual flag**: Package appears with a red "PERISHABLE" badge in all views.
3. **Escalation chain** (configurable in Settings > Packages > Perishable Rules):

| Timer | Action | Default |
|-------|--------|---------|
| 0h (intake) | Notify resident via all channels | Always |
| 4h | Send follow-up reminder | Enabled |
| 8h | Notify unit's secondary contact (if configured) | Enabled |
| 24h | Alert shift supervisor / property manager | Enabled |
| 48h | Flag for management review with disposal recommendation | Enabled |

Each timer is configurable by the Property Admin. Timers pause outside of business hours (configurable).

#### 3.1.10 Resident Self-Service Portal

Residents see their packages through the resident portal.

**What residents see**:

| Section | Content |
|---------|---------|
| **My Packages** | List of all packages addressed to them or their unit |
| **Pending Pickup** | Count badge on dashboard showing unreleased packages |
| **Package History** | Past 90 days of received and released packages |
| **Notification Preferences** | Preferred channel (email, SMS, push, all) for package notifications |
| **Authorized Delegates** | People authorized to pick up on their behalf |

**Authorized delegate management**:

| # | Field | Type | Required | Max Length | Description |
|---|-------|------|----------|------------|-------------|
| 1 | `delegate_name` | Text input | Yes | 100 chars | Full name of delegate |
| 2 | `delegate_phone` | Phone input | No | 20 chars | Contact phone |
| 3 | `delegate_relationship` | Dropdown | No | -- | Options: Family, Friend, Caregiver, Dog Walker, Cleaning Service, Other |
| 4 | `valid_from` | Date picker | No | -- | Start date (null = immediately) |
| 5 | `valid_until` | Date picker | No | -- | End date (null = indefinite) |
| 6 | `is_active` | Toggle | No | true | Active/inactive |

Maximum 5 authorized delegates per unit.

**Resident cannot**: Initiate a release, edit package details, or delete packages. These actions are staff-only.

**Empty state (resident, no packages)**:

```
+--------------------------------------------------+
|                                                    |
|              [Package icon illustration]           |
|                                                    |
|        You have no packages at the moment          |
|                                                    |
|   When a package arrives for you, it will appear   |
|   here and you will be notified automatically.     |
|                                                    |
+--------------------------------------------------+
```

#### 3.1.11 Outgoing Package Logging

Staff can log packages leaving the building (returns, outgoing shipments).

**Outgoing intake form**: Same form as incoming, but with `direction` set to "Outgoing" and the following differences:

| Difference | Incoming | Outgoing |
|------------|----------|----------|
| `courier_id` | Who delivered | Who is picking up |
| `storage_spot_id` | Where it is stored | Where it is staged for pickup |
| `is_perishable` | Triggers resident notification | Triggers staff reminder if courier hasn't arrived |
| Release flow | Resident picks up | Courier picks up |

### 3.2 Enhanced Features (v2)

#### 3.2.1 Courier Tracking Integration

Deep-link to courier tracking pages using the tracking number.

| Courier | Tracking URL Pattern |
|---------|---------------------|
| Amazon | `https://track.amazon.com/tracking/{tracking_number}` |
| Canada Post | `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking_number}` |
| FedEx | `https://www.fedex.com/fedextrack/?trknbr={tracking_number}` |
| UPS | `https://www.ups.com/track?tracknum={tracking_number}` |
| DHL | `https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}` |
| Purolator | `https://www.purolator.com/en/shipping/tracker?pin={tracking_number}` |
| USPS | `https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}` |

Tracking number field in the detail view becomes a clickable link that opens the courier's tracking page in a new tab.

#### 3.2.2 Package Waiver / Parcel Agreement

Residents sign a parcel handling agreement that establishes liability terms.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | `waiver_template` | Rich text | Admin-configured waiver text |
| 2 | `resident_signature` | Signature pad | Digital signature |
| 3 | `signed_date` | Auto timestamp | When signed |
| 4 | `ip_address` | Auto captured | For legal record |
| 5 | `waiver_version` | Auto | Version tracking for template changes |

Residents without a signed waiver see a banner in their portal: "Please review and sign the package handling agreement."

#### 3.2.3 Advanced Storage Management

- **Storage map**: Visual grid or floorplan of the parcel room with package locations marked
- **Shelf labels**: Printable shelf labels with QR codes for quick storage assignment via scan
- **Overflow alerts**: Automated notification to property manager when total building storage exceeds configurable threshold

#### 3.2.4 Package Return / Unclaimed Processing

For packages uncollected beyond a configurable period (default: 14 days).

| Step | Action | Trigger |
|------|--------|---------|
| 1 | Final notice to resident | 10 days uncollected |
| 2 | Management notification | 12 days uncollected |
| 3 | Mark as "Return to Sender" or "Dispose" | Manual action by manager at 14+ days |
| 4 | Log return/disposal with photo and notes | On action |
| 5 | Archive from active list | On action |

#### 3.2.5 Configurable Courier Management

Property Admins can customize the courier list in Settings > Packages > Couriers.

| Action | Description |
|--------|-------------|
| **Add courier** | Name, icon upload (SVG/PNG, 100x100px max), color hex, notification subject template, tracking URL template |
| **Reorder** | Drag-and-drop to change sort order in the icon grid |
| **Deactivate** | Hide a courier from the grid without deleting (historical data preserved) |
| **Edit** | Change name, icon, color, templates for existing couriers |

System-provided couriers (the 15 defaults) cannot be deleted but can be deactivated.

### 3.3 Future Features (v3+)

#### 3.3.1 Smart Locker Integration

Integration with physical package locker hardware (Luxer One, Parcel Pending, etc.) for buildings with automated locker systems.

#### 3.3.2 Courier API Webhooks

Real-time tracking updates via courier APIs. Package status auto-updates from "In Transit" to "Out for Delivery" to "Delivered" based on webhook data.

#### 3.3.3 Predictive Delivery Alerts

"Your Amazon order is likely arriving today" notifications to residents based on tracking data analysis.

#### 3.3.4 Return/RMA Processing

Full return merchandise authorization workflow: resident initiates return, staff stages outgoing package, courier pickup scheduled, return confirmed.

#### 3.3.5 Package Insurance Claims

For damaged or lost packages, a claims workflow that documents evidence, notifies the courier, and tracks resolution.

---

## 4. Data Model

### 4.1 Package Entity

```
Package
 |-- id                    UUID, primary key
 |-- property_id           UUID, FK -> Property (required, indexed)
 |-- building_id           UUID, FK -> Building (required, indexed)
 |-- unit_id               UUID, FK -> Unit (required, indexed)
 |-- resident_id           UUID, FK -> Resident (required, indexed)
 |-- reference_number      VARCHAR(20), unique per property, indexed
 |-- direction             ENUM('incoming', 'outgoing'), default 'incoming'
 |-- status                ENUM('unreleased', 'released', 'returned', 'disposed'), default 'unreleased'
 |-- courier_id            UUID, FK -> Courier (nullable)
 |-- courier_other_name    VARCHAR(100), nullable (when courier_id is "Other")
 |-- tracking_number       VARCHAR(100), nullable, indexed
 |-- parcel_category_id    UUID, FK -> ParcelCategory (nullable)
 |-- description           VARCHAR(500), nullable
 |-- storage_spot_id       UUID, FK -> StorageSpot (nullable)
 |-- is_perishable         BOOLEAN, default false
 |-- is_oversized          BOOLEAN, default false
 |-- notify_channel        ENUM('default','email','sms','push','all','none'), default 'default'
 |-- created_by            UUID, FK -> User (staff who logged it)
 |-- created_at            TIMESTAMPTZ, auto, indexed
 |-- released_to_name      VARCHAR(200), nullable
 |-- released_by           UUID, FK -> User (nullable)
 |-- released_at           TIMESTAMPTZ, nullable, indexed
 |-- id_verified           BOOLEAN, default false
 |-- release_comments      VARCHAR(500), nullable
 |-- is_authorized_delegate BOOLEAN, default false
 |-- deleted_at            TIMESTAMPTZ, nullable (soft delete)
 |-- updated_at            TIMESTAMPTZ, auto
```

### 4.2 Supporting Entities

```
PackagePhoto
 |-- id                    UUID, primary key
 |-- package_id            UUID, FK -> Package (indexed)
 |-- photo_type            ENUM('intake', 'release', 'damage')
 |-- file_url              VARCHAR(500)
 |-- file_size_bytes       INTEGER
 |-- uploaded_by           UUID, FK -> User
 |-- uploaded_at           TIMESTAMPTZ

PackageSignature
 |-- id                    UUID, primary key
 |-- package_id            UUID, FK -> Package (indexed)
 |-- signature_data        BYTEA (SVG or PNG blob)
 |-- signed_by_name        VARCHAR(200)
 |-- captured_at           TIMESTAMPTZ
 |-- captured_by           UUID, FK -> User (staff)

Courier
 |-- id                    UUID, primary key
 |-- property_id           UUID, FK -> Property (nullable; null = global/system courier)
 |-- name                  VARCHAR(100)
 |-- icon_url              VARCHAR(500)
 |-- color_hex             VARCHAR(7)
 |-- tracking_url_template VARCHAR(500), nullable
 |-- notification_subject  VARCHAR(200)
 |-- sort_order            INTEGER
 |-- is_system             BOOLEAN (system couriers can't be deleted)
 |-- is_active             BOOLEAN, default true

ParcelCategory
 |-- id                    UUID, primary key
 |-- property_id           UUID, FK -> Property
 |-- name                  VARCHAR(100)
 |-- sort_order            INTEGER
 |-- is_active             BOOLEAN, default true

StorageSpot
 |-- id                    UUID, primary key
 |-- property_id           UUID, FK -> Property
 |-- building_id           UUID, FK -> Building
 |-- name                  VARCHAR(100)
 |-- code                  VARCHAR(10)
 |-- capacity              INTEGER, default 0 (0 = unlimited)
 |-- is_refrigerated       BOOLEAN, default false
 |-- sort_order            INTEGER
 |-- is_active             BOOLEAN, default true

AuthorizedDelegate
 |-- id                    UUID, primary key
 |-- unit_id               UUID, FK -> Unit (indexed)
 |-- delegate_name         VARCHAR(100)
 |-- delegate_phone        VARCHAR(20), nullable
 |-- relationship          VARCHAR(50), nullable
 |-- valid_from            DATE, nullable
 |-- valid_until           DATE, nullable
 |-- is_active             BOOLEAN, default true
 |-- created_by            UUID, FK -> User
 |-- created_at            TIMESTAMPTZ

PackageHistory
 |-- id                    UUID, primary key
 |-- package_id            UUID, FK -> Package (indexed)
 |-- action                ENUM('created','notification_sent','reminder_sent',
 |                              'released','edited','deleted','escalated',
 |                              'returned','disposed')
 |-- actor_id              UUID, FK -> User
 |-- actor_name            VARCHAR(200)
 |-- details               TEXT, nullable
 |-- channel               VARCHAR(20), nullable (for notification actions)
 |-- created_at            TIMESTAMPTZ

PackageWaiver (v2)
 |-- id                    UUID, primary key
 |-- property_id           UUID, FK -> Property
 |-- resident_id           UUID, FK -> Resident
 |-- waiver_version        INTEGER
 |-- signature_data        BYTEA
 |-- signed_at             TIMESTAMPTZ
 |-- ip_address            INET
```

### 4.3 Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| Package | `idx_pkg_property_status` | `property_id, status` | Unreleased package queries |
| Package | `idx_pkg_unit_status` | `unit_id, status` | Resident portal queries |
| Package | `idx_pkg_reference` | `property_id, reference_number` | Reference number lookup |
| Package | `idx_pkg_tracking` | `tracking_number` | Tracking number search |
| Package | `idx_pkg_created` | `property_id, created_at DESC` | Chronological listing |
| Package | `idx_pkg_released` | `property_id, released_at DESC` | Released package history |
| Package | `idx_pkg_perishable` | `property_id, is_perishable, status` | Perishable escalation queries |
| Package | `idx_pkg_building` | `building_id, status, created_at DESC` | Per-building listing |

---

## 5. User Flows

### 5.1 Standard Package Intake (Single Package)

```
Courier arrives at front desk
       |
       v
Staff clicks "+ Package" (dashboard or listing page)
       |
       v
Intake form opens
       |
       v
Staff selects Unit (autocomplete) --> Recipient auto-populates
       |
       v
Staff taps Courier icon --> (Optional: AI detects courier from photo)
       |
       v
Staff enters Tracking # --> (Optional: scan barcode with camera)
       |
       v
Staff selects Storage Location --> (Optional: AI suggests based on size/capacity)
       |
       v
Staff toggles Perishable if applicable
       |
       v
Staff clicks "Save Package"
       |
       v
System generates reference number
       |
       v
System sends notification to resident (per preference)
       |
       v
System prints label (if configured for auto-print)
       |
       v
Staff affixes label and stores package
```

**Time target**: Under 15 seconds for a standard package with known unit and courier.

### 5.2 Package Release (Walk-in Pickup)

```
Resident arrives at front desk
       |
       v
Staff searches by unit # or resident name
       |
       v
System shows all unreleased packages for that unit
       |
       v
Staff selects package(s) to release
       |
       v
Release dialog opens with resident name pre-filled
       |
       v
Staff verifies identity (name match, optional ID check)
       |
       v
Staff captures signature (if required by property)
       |
       v
Staff clicks "Release Package"
       |
       v
System records release (who, when, by whom)
       |
       v
Package moves to Released section
       |
       v
Staff hands package(s) to resident
```

**Time target**: Under 20 seconds for a single-package release with signature.

### 5.3 Perishable Escalation Flow

```
Package logged with perishable flag
       |
       v
Immediate: Notify resident via ALL channels
       |
       v
+4 hours: Auto-send follow-up reminder
       |
       v
+8 hours: Notify secondary contact for unit
       |
       v
+24 hours: Alert shift supervisor / property manager
       |
       v
+48 hours: Flag for management review
       |           - Disposal recommendation
       |           - Photo documentation required
       v
Manager decides: Return to Sender | Dispose | Hold
       |
       v
Action logged with timestamp and notes
```

### 5.4 Resident Self-Service Flow

```
Resident receives notification: "You have a package"
       |
       v
Resident opens Concierge app or portal
       |
       v
Dashboard shows badge: "2 packages waiting"
       |
       v
Resident taps "My Packages"
       |
       v
Sees list of unreleased packages with details:
  - Courier, Category, Storage Location
  - Received date and age
  - "Visit the front desk to pick up"
       |
       v
Resident visits front desk
       |
       v
Staff processes normal release flow
```

### 5.5 Batch Intake Flow (Holiday Peak)

```
Courier delivers 15 Amazon packages
       |
       v
Staff clicks "Batch Intake"
       |
       v
Batch form opens with 4 rows (expandable)
       |
       v
Staff enters Unit in Row 1 --> Recipient auto-fills
Staff taps Amazon courier icon --> applies to Row 1
Staff clicks "+" to add rows as needed
       |
       v
For each row: Unit + Courier (minimum)
       |
       v
Staff checks "Print Label" for all rows
       |
       v
Staff clicks "Save All (15)"
       |
       v
System creates 15 packages with sequential reference numbers
       |
       v
System batches notifications: residents with multiple packages
get ONE notification listing all packages (if batching enabled)
       |
       v
Printer queues 15 labels
       |
       v
Staff affixes labels and stores packages
```

### 5.6 Authorized Delegate Pickup Flow

```
Delegate arrives at front desk: "I'm picking up for Unit 1205"
       |
       v
Staff searches by unit number
       |
       v
System shows unreleased packages for Unit 1205
       |
       v
Staff asks for delegate's name
       |
       v
Staff enters name in "Picked Up By" field
       |
       v
Staff checks "Authorized Delegate" checkbox
       |
       v
System validates name against authorized delegates for unit:
  - MATCH: Green checkmark, proceed
  - NO MATCH: Warning -- "This person is not listed as an
    authorized delegate. Continue anyway?" (requires manager override
    or resident phone confirmation)
       |
       v
Staff completes release with signature/photo
       |
       v
System logs delegate pickup in history
```

---

## 6. UI/UX

### 6.1 Desktop Layout (1280px+)

**Package listing page**:

```
+------------------------------------------------------------+
| PACKAGES                         [Batch Intake] [+ Package] |
+------------------------------------------------------------+
| Search: [_____________] Building: [All v]  Unit: [___]      |
| Courier: [All v]  Status: [Unreleased v]  Perishable: [ ]  |
| Date: [Start] - [End]   Storage: [All v]  [Clear Filters]  |
+------------------------------------------------------------+
|                                                              |
| UNRELEASED (47)                    [Print Unreleased] [Export]|
| +----------------------------------------------------------+|
| | Ref #    | Unit | Recipient  | Courier | Age  | Storage  ||
| |----------|------|------------|---------|------|----------- |
| | PKG-4821 | 1205 | J. Smith   | [amz]   | 2h   | PR-A    ||
| | PKG-4820 | 0803 | M. Chen    | [fedx]  | 5h   | PR-B    ||
| | PKG-4819 | 1401 | S. Patel   | [ups]   | 1d   | PR-A    ||
| +----------------------------------------------------------+|
|                         < 1 2 3 ... 5 >                     |
|                                                              |
| RELEASED (Past 30 days)                                      |
| +----------------------------------------------------------+|
| | Ref #    | Unit | Recipient  | Released To | Released At  ||
| |----------|------|------------|-------------|-------------- |
| | PKG-4818 | 0506 | R. Kim     | R. Kim      | Today 2:15p ||
| +----------------------------------------------------------+|
+------------------------------------------------------------+
```

**Package detail panel (slide-out, right side, 480px wide)**:

```
+--------------------------------------+
| < Back    Package #PKG-QPC-004821    |
|                                      |
| [UNRELEASED]  [PERISHABLE]           |
|                                      |
| PACKAGE INFO                         |
| Courier:    [Amazon icon] Amazon     |
| Tracking:   TBA123456789  [link]     |
| Category:   Medium Box              |
| Description: Brown box, sender       |
|              "Best Buy" visible       |
| Photo:      [thumbnail] [thumbnail]  |
|                                      |
| RECIPIENT                            |
| Unit:       1205                     |
| Resident:   Janet Smith             |
| Phone:      416-555-0123            |
|                                      |
| STORAGE                             |
| Location:   Parcel Room - Shelf A    |
| Received:   Mar 14, 2026 10:32 AM   |
| Age:        2 hours                  |
|                                      |
| HISTORY                             |
| 10:32 AM  Package received          |
|           by Front Desk (J. Lee)     |
| 10:32 AM  Email notification sent   |
|           to janet.smith@email.com   |
|                                      |
| [Release]  [Send Reminder] [Edit]    |
|            [Print Label]   [Delete]  |
+--------------------------------------+
```

### 6.2 Tablet Layout (768px - 1279px)

- Listing table drops Description and Storage columns; available via row expansion (tap row to reveal)
- Detail view opens as a full-width modal instead of slide-out panel
- Batch intake shows 2 visible fields per row; remaining fields available via row expansion
- Courier icon grid wraps to 3 rows of 5
- Filter bar collapses into a "Filters" button with a dropdown panel

### 6.3 Mobile Layout (< 768px)

- Listing switches from table to card layout:

```
+--------------------------------------+
| [Amazon icon]  PKG-4821             |
| Unit 1205 - Janet Smith              |
| Medium Box - Parcel Room A           |
| Received 2h ago                      |
|                      [Release] [...]  |
+--------------------------------------+
```

- Intake form becomes single-column, full-screen
- Courier icon grid becomes a 3x5 scrollable grid
- Batch intake is not available on mobile (too complex for small screens). Toast message: "Batch intake is available on tablet or desktop."
- Detail view is full-screen with sticky action buttons at the bottom
- Search is a single text field with a "Filters" icon button that opens a full-screen filter panel

### 6.4 Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All form fields, buttons, and table rows are focusable and operable via keyboard. Tab order follows visual layout. |
| Screen reader | All courier icons have `aria-label` (e.g., "Amazon courier"). Status badges have `aria-label` (e.g., "Status: Unreleased"). Age column includes full text (e.g., "2 hours ago"). |
| Color independence | Age column uses both color AND text labels. Perishable badge uses text + icon, not just red color. Capacity indicators use text percentages alongside color. |
| Touch targets | All buttons and interactive elements are minimum 44x44px |
| Focus management | After saving a package, focus returns to the form (for Save & New) or the listing (for Save). After release, focus returns to the listing. |
| Reduced motion | Loading skeletons use opacity fade instead of animation when `prefers-reduced-motion` is set |

---

## 7. AI Integration

Ten AI capabilities enhance Package Management. Each can be independently toggled by the Super Admin in Settings > AI Configuration. Every capability has a manual fallback -- the module works fully without AI.

### 7.1 Courier Label OCR (AI-13 in AI Framework: Courier Logo Auto-Detection)

| Attribute | Detail |
|-----------|--------|
| **What it does** | When staff takes a photo of a package during intake, AI analyzes the image to identify the courier logo and automatically selects the correct courier from the icon grid |
| **Trigger** | Photo upload during package intake |
| **Model** | Vision (GPT-4o) + Haiku for classification |
| **Estimated cost** | $0.005 per call |
| **Input** | Package label photo |
| **Output** | Courier name + confidence score. If confidence > 80%, auto-selects courier. If 50-80%, suggests with "Did you mean {courier}?" prompt. If < 50%, no suggestion. |
| **Graceful degradation** | Staff manually selects courier from icon grid |
| **Default state** | Enabled |
| **Privacy** | Photo is processed for courier identification only. No resident data is extracted or stored by the AI provider. |

### 7.2 Tracking Number Extraction -- OCR (AI-14)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Extracts the tracking number from a photo of the shipping label and auto-fills the tracking number field |
| **Trigger** | Photo upload during intake, or dedicated "Scan" button next to tracking number field |
| **Model** | Vision (GPT-4o) |
| **Estimated cost** | $0.005 per call |
| **Input** | Shipping label photo |
| **Output** | Extracted tracking number string + identified courier (if not already selected) |
| **Graceful degradation** | Staff types tracking number manually |
| **Default state** | Enabled |
| **UX detail** | Extracted number appears in the field with a brief highlight animation. A small "AI" indicator appears next to the field for 3 seconds, then fades. Staff can edit the extracted value. |

### 7.3 Delivery Time Prediction (AI-16: Package Volume Forecasting)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Predicts daily package volume for the next 7 days based on historical delivery patterns, day of week, holidays, and known sale events (Prime Day, Black Friday, etc.) |
| **Trigger** | Daily scheduled job at 6:00 AM |
| **Model** | Sonnet |
| **Estimated cost** | $0.005 per daily run |
| **Input** | 90 days of package history + calendar data (holidays, events) |
| **Output** | Forecast table: date, predicted volume (low/mid/high estimate), confidence level |
| **Where displayed** | Dashboard widget for Property Manager and Concierge roles: "Expected deliveries today: ~85 packages (based on patterns)" |
| **Graceful degradation** | No forecast shown. Staff plans based on experience. |
| **Default state** | Disabled (opt-in) |

### 7.4 Peak Time Staffing Recommendations (derived from AI-16)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Analyzes historical delivery patterns to identify peak hours and recommends optimal front desk staffing levels |
| **Trigger** | Weekly scheduled job (Monday 3:00 AM) |
| **Model** | Sonnet |
| **Estimated cost** | $0.01 per weekly run |
| **Input** | 30-day package intake timestamps + staffing data |
| **Output** | Heatmap of deliveries by hour and day of week + staffing recommendation (e.g., "Consider 2 staff members on Wednesday 11 AM - 2 PM based on 3-week trend of 40+ packages in that window") |
| **Where displayed** | Reports > Package Analytics > Staffing tab |
| **Graceful degradation** | No staffing recommendations. Manager reviews raw data. |
| **Default state** | Disabled |

### 7.5 Smart Notification Batching (AI-22: Resident Notification Optimization)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Instead of sending 5 separate notifications for 5 Amazon boxes, batches them into a single notification: "You have 5 packages waiting (3 Amazon, 1 FedEx, 1 Canada Post)" |
| **Trigger** | On package intake, system waits a configurable window (default 30 minutes) before sending |
| **Model** | Haiku |
| **Estimated cost** | $0.001 per batch |
| **Input** | Pending unsent notifications for the same resident + time window |
| **Output** | Single consolidated notification message |
| **Graceful degradation** | Each package triggers its own individual notification immediately |
| **Default state** | Disabled (can be disruptive if residents expect immediate notification) |
| **Configuration** | Batch window: 15/30/60 minutes. Perishable packages always send immediately and are never batched. |

### 7.6 Courier Performance Analytics (AI-19: Delivery Pattern Analysis)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Analyzes delivery data to generate insights: which couriers deliver most, average delivery times by courier, damage rates, peak delivery hours per courier |
| **Trigger** | Weekly scheduled job (Monday 3:00 AM) |
| **Model** | Sonnet |
| **Estimated cost** | $0.01 per weekly run |
| **Input** | All package data for past 30 days |
| **Output** | Analytics report with charts: courier volume breakdown, delivery hour heatmap, damage flag correlation |
| **Where displayed** | Reports > Package Analytics > Courier Performance tab |
| **Graceful degradation** | No automated analysis. Raw data available for manual export. |
| **Default state** | Enabled |

### 7.7 Anomaly Detection (derived from Security Console AI-5)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Flags unusual package activity: unexpected volume spikes, packages for vacant units, multiple packages to same unit from uncommon couriers, packages arriving outside normal delivery hours |
| **Trigger** | On each package creation |
| **Model** | Haiku |
| **Estimated cost** | $0.002 per check |
| **Input** | Current package details + 90-day historical norms for the property |
| **Output** | Alert (if anomalous) with explanation, or silent pass |
| **Where displayed** | Inline alert on the package listing page: "Unusual activity: 12 packages received for Unit 0803 today (average is 1.2)." Alert is dismissible. |
| **Graceful degradation** | No anomaly detection. Staff relies on visual observation. |
| **Default state** | Enabled |

### 7.8 Smart Storage Suggestion (AI-21)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Suggests the optimal storage location based on package size/type, current storage capacity, and perishable status (suggests refrigerated spot for perishable items) |
| **Trigger** | On package intake, after parcel category is selected |
| **Model** | Haiku |
| **Estimated cost** | $0.001 per suggestion |
| **Input** | Package category + perishable flag + current storage spot occupancy |
| **Output** | Suggested storage spot with reasoning (e.g., "Shelf B has 8/20 capacity. Shelf A is at 19/20.") |
| **UX detail** | Storage dropdown auto-selects the suggested spot with a subtle highlight. Staff can change it. A small tooltip explains: "Suggested based on current capacity." |
| **Graceful degradation** | Storage dropdown defaults to the property-level default spot |
| **Default state** | Enabled |

### 7.9 Auto-Courier Detection from Tracking Number (AI-13 variant)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Identifies the courier from the format of the tracking number (e.g., "1Z" prefix = UPS, "94" prefix = USPS, etc.) and auto-selects the courier icon |
| **Trigger** | On tracking number field blur (after user types or pastes a number) |
| **Model** | Rule-based (no AI call needed) + Haiku fallback for ambiguous formats |
| **Estimated cost** | $0.00 (rule-based) or $0.001 (Haiku fallback) |
| **Input** | Tracking number string |
| **Output** | Courier identification |
| **Known patterns** | `1Z[A-Z0-9]{16}` = UPS, `94[0-9]{20}` = USPS, `[0-9]{12,22}` with Amazon order = Amazon, `[0-9]{16}` = FedEx |
| **Graceful degradation** | Staff manually selects courier |
| **Default state** | Enabled |

### 7.10 Unreleased Package Escalation Intelligence (AI-17)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Generates personalized, contextual reminder messages for unclaimed packages. Considers the resident's pickup patterns, communication preferences, and package age. |
| **Trigger** | Configurable timers: 24h, 48h, 72h after intake (default) |
| **Model** | Haiku |
| **Estimated cost** | $0.001 per reminder |
| **Input** | Package details + resident contact preferences + past pickup behavior |
| **Output** | Personalized reminder message (e.g., "Hi Janet, you have a FedEx package (medium box) waiting at Parcel Room A since yesterday. The front desk is open until 10 PM tonight.") |
| **Graceful degradation** | Generic template-based reminder: "You have a package waiting at the front desk." |
| **Default state** | Enabled |

---

## 8. Analytics

### 8.1 Dashboard Widgets

| Widget | Roles That See It | Data |
|--------|-------------------|------|
| **Unreleased Package Count** | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin | Total unreleased packages, with perishable count highlighted in red |
| **Today's Intake** | Concierge, Property Manager | Packages received today vs. same day last week |
| **Average Pickup Time** | Property Manager, Property Admin | Mean time from intake to release (current week vs. previous week) |
| **Storage Capacity** | Concierge, Property Manager | Bar chart of storage spot utilization with color coding |
| **AI Forecast** (if enabled) | Concierge, Property Manager | "Expected deliveries today: ~{n}" |

### 8.2 Package Analytics Reports

Available under Reports > Package Analytics. Accessible to Property Admin, Property Manager, and Security Supervisor.

| Report | Description | Filters | Export Formats |
|--------|-------------|---------|---------------|
| **Volume by Date** | Package intake volume by day/week/month with trend line | Date range, building, courier | Excel, PDF, CSV |
| **Volume by Courier** | Breakdown of packages per courier with percentages and pie chart | Date range, building | Excel, PDF |
| **Average Pickup Time** | Mean and median time from intake to release, by day/week with trend | Date range, building, unit | Excel, PDF |
| **Unreleased Aging** | Current unreleased packages grouped by age bucket (< 24h, 1-3d, 3-7d, 7+ days) | Building, storage spot | Excel, PDF |
| **Peak Delivery Hours** | Heatmap of intake volume by hour of day and day of week | Date range (min 7 days), building | Excel, PDF |
| **Storage Utilization** | Average and peak capacity usage per storage spot over time | Date range, building, storage spot | Excel, PDF |
| **Perishable Summary** | Perishable packages: count, average pickup time, escalation rate | Date range | Excel, PDF |
| **Staff Performance** | Packages processed per staff member (intake count, release count, avg processing time) | Date range, staff member | Excel, PDF |
| **Courier Performance** | Volume trends per courier, average packages per day, delivery hour distribution | Date range | Excel, PDF |

### 8.3 KPIs Tracked

| KPI | Calculation | Target | Alert Threshold |
|-----|-------------|--------|-----------------|
| Average intake time | Mean time from form open to save | < 15 seconds | > 30 seconds |
| Average release time | Mean time from release dialog open to confirmation | < 20 seconds | > 45 seconds |
| Average pickup time | Mean elapsed time from package creation to release | < 24 hours | > 48 hours |
| Perishable pickup rate | % of perishable packages picked up within 4 hours | > 80% | < 60% |
| Notification delivery rate | % of package notifications successfully delivered | > 99% | < 95% |
| Label print success rate | % of print jobs completed without error | > 95% | < 85% |
| Storage utilization | Average % of configured capacity used across all spots | < 80% | > 90% |
| Unclaimed rate (7+ days) | % of packages uncollected after 7 days | < 5% | > 10% |

---

## 9. Notifications

### 9.1 Resident Notifications

| Event | Channel | Timing | Template | Configurable |
|-------|---------|--------|----------|-------------|
| **Package received** | Per resident preference (email/SMS/push/all) | Immediate (or batched, see AI 7.5) | "Hi {first_name}, you have a {courier} delivery ({category}) waiting at {storage_location}. Ref: {reference_number}." | Subject line, body text, sender name |
| **Package received (perishable)** | All channels | Immediate (never batched) | "URGENT: You have a perishable delivery at the front desk. Please pick up as soon as possible. Ref: {reference_number}." | Body text |
| **Reminder (unclaimed)** | Per resident preference | 24h / 48h / 72h (configurable) | "Reminder: You have {count} package(s) waiting since {date}. Please visit the front desk to collect." | Timing intervals, body text |
| **Final notice** | All channels | Configurable (default 10 days) | "Final notice: Your package (Ref: {reference_number}) has been waiting since {date}. If uncollected within {days} days, it may be returned to sender." | Timing, body text |
| **Package released** | Push only | Immediate | "Your package (Ref: {reference_number}) was picked up by {released_to_name} on {date}." | Enabled/disabled per property |

### 9.2 Staff Notifications

| Event | Recipients | Channel | Template |
|-------|------------|---------|----------|
| **Perishable escalation (4h)** | On-shift concierge/security | In-app alert | "Perishable package for Unit {unit} has been waiting {hours} hours." |
| **Perishable escalation (24h)** | Shift supervisor, Property Manager | Email + in-app | "Perishable package for Unit {unit} uncollected for 24 hours. Action required." |
| **Storage capacity warning (80%)** | On-shift staff | In-app alert | "{spot_name} is at {percent}% capacity ({current}/{max} packages)." |
| **Storage capacity full (100%)** | Property Manager | Email + in-app | "{spot_name} is full. {overflow_count} packages need alternate storage." |
| **Anomaly detected** | On-shift staff | In-app alert | "Unusual package activity detected: {anomaly_description}." |
| **Daily volume forecast** | Concierge, Property Manager | In-app (dashboard widget) | "Expected deliveries today: ~{forecast} packages." |
| **Weekly analytics ready** | Property Manager | Email | "Your weekly package analytics report is ready. [View Report]" |

### 9.3 Notification Settings (Property Admin)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `package_notification_enabled` | Toggle | On | Global toggle for all package notifications |
| `notification_sender_name` | Text input (200 chars) | Property name | From name on email notifications |
| `notification_sender_email` | Email input | `packages@{property_domain}` | From address for emails |
| `batch_notifications` | Toggle | Off | Enable notification batching (see AI 7.5) |
| `batch_window_minutes` | Dropdown (15/30/60) | 30 | Batching time window |
| `reminder_intervals` | Multi-select checkboxes | 24h, 48h, 72h | When to send unclaimed reminders |
| `perishable_escalation_enabled` | Toggle | On | Enable perishable escalation chain |
| `perishable_timers` | Number inputs (4 fields) | 4h, 8h, 24h, 48h | Escalation timer intervals |
| `perishable_pause_outside_hours` | Toggle | On | Pause escalation timers outside business hours |
| `business_hours_start` | Time picker | 7:00 AM | Business hours start (for timer pausing) |
| `business_hours_end` | Time picker | 11:00 PM | Business hours end |
| `final_notice_days` | Number input | 10 | Days before final notice |
| `return_to_sender_days` | Number input | 14 | Days before eligible for return |
| `release_notification_enabled` | Toggle | Off | Notify resident when package is released |
| `require_signature` | Toggle | Off | Require signature on package release |
| `require_id_verification` | Toggle | Off | Require ID verification checkbox on release |

---

## 10. API

### 10.1 REST Endpoints

| Method | Endpoint | Description | Auth Roles |
|--------|----------|-------------|------------|
| `POST` | `/api/v1/packages` | Create a new package | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin, Super Admin |
| `POST` | `/api/v1/packages/batch` | Create multiple packages (max 20) | Same as above |
| `GET` | `/api/v1/packages` | List packages with filters and pagination | Staff roles: all packages. Resident roles: own packages only. |
| `GET` | `/api/v1/packages/:id` | Get package details including history | Staff: any package. Resident: own only. |
| `PATCH` | `/api/v1/packages/:id` | Update package details | Concierge, Security Guard (own only), Security Supervisor, Property Manager, Property Admin, Super Admin |
| `POST` | `/api/v1/packages/:id/release` | Release a single package | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin, Super Admin |
| `POST` | `/api/v1/packages/release-batch` | Release multiple packages for same unit | Same as above |
| `DELETE` | `/api/v1/packages/:id` | Soft-delete a package (unreleased only) | Property Manager, Property Admin, Super Admin |
| `POST` | `/api/v1/packages/:id/notify` | Send reminder notification | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin, Super Admin |
| `GET` | `/api/v1/packages/:id/history` | Get package audit trail | Staff roles |
| `POST` | `/api/v1/packages/:id/photos` | Upload package photo (max 3) | Staff roles |
| `DELETE` | `/api/v1/packages/:id/photos/:photo_id` | Delete a package photo | Property Manager, Property Admin, Super Admin |
| `GET` | `/api/v1/packages/:id/label` | Generate label PDF for printing | Staff roles |
| `GET` | `/api/v1/packages/analytics/volume` | Package volume analytics | Property Manager, Property Admin, Security Supervisor |
| `GET` | `/api/v1/packages/analytics/courier` | Courier performance analytics | Property Manager, Property Admin |
| `GET` | `/api/v1/packages/analytics/storage` | Storage utilization data | Property Manager, Property Admin, Concierge |
| `GET` | `/api/v1/packages/export` | Export packages (Excel/PDF/CSV) | Property Manager, Property Admin, Security Supervisor |
| `GET` | `/api/v1/couriers` | List available couriers for property | All authenticated users |
| `GET` | `/api/v1/parcel-categories` | List parcel categories for property | All authenticated users |
| `GET` | `/api/v1/storage-spots` | List storage spots with capacity | Staff roles |
| `GET` | `/api/v1/units/:unit_id/delegates` | List authorized delegates for a unit | Staff roles, unit residents |
| `POST` | `/api/v1/units/:unit_id/delegates` | Add authorized delegate | Unit owner, unit tenant, Property Admin |
| `DELETE` | `/api/v1/units/:unit_id/delegates/:id` | Remove authorized delegate | Unit owner, unit tenant, Property Admin |

### 10.2 Query Parameters for `GET /api/v1/packages`

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | String | `unreleased`, `released`, `returned`, `disposed`, `all` | `unreleased` |
| `building_id` | UUID | Filter by building | All buildings |
| `unit_id` | UUID | Filter by unit | All units |
| `courier_id` | UUID (comma-separated for multiple) | Filter by courier(s) | All couriers |
| `is_perishable` | Boolean | Filter perishable packages | All |
| `storage_spot_id` | UUID | Filter by storage spot | All spots |
| `search` | String | Full-text search across recipient, reference #, tracking #, description | None |
| `date_from` | ISO date | Start date for created_at range | 90 days ago |
| `date_to` | ISO date | End date for created_at range | Today |
| `sort_by` | String | `created_at`, `released_at`, `reference_number`, `unit`, `age` | `created_at` |
| `sort_order` | String | `asc`, `desc` | `desc` |
| `page` | Integer (min 1) | Page number | 1 |
| `per_page` | Integer (min 1, max 100) | Items per page | 25 |

### 10.3 Request Body for `POST /api/v1/packages`

```json
{
  "building_id": "uuid",
  "unit_id": "uuid",
  "resident_id": "uuid",
  "direction": "incoming",
  "courier_id": "uuid | null",
  "courier_other_name": "string (required if courier is 'Other')",
  "tracking_number": "string | null",
  "parcel_category_id": "uuid | null",
  "description": "string | null",
  "storage_spot_id": "uuid | null",
  "is_perishable": false,
  "is_oversized": false,
  "notify_channel": "default"
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "reference_number": "PKG-QPC-004821",
  "status": "unreleased",
  "created_at": "2026-03-14T10:32:00Z",
  "created_by": { "id": "uuid", "name": "J. Lee" },
  "notification_sent": true,
  "notification_channel": "email",
  "label_url": "/api/v1/packages/{id}/label"
}
```

**Error responses**:

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "validation_error", "fields": { "unit_id": "Please select a valid unit." } }` | Invalid input |
| 401 | `{ "error": "unauthorized" }` | Not logged in |
| 403 | `{ "error": "forbidden", "message": "You do not have permission to create packages." }` | Insufficient role |
| 404 | `{ "error": "not_found", "message": "Unit not found." }` | Invalid reference |
| 429 | `{ "error": "rate_limited", "message": "Too many requests. Try again in {n} seconds." }` | Rate limit exceeded |
| 500 | `{ "error": "internal", "message": "An unexpected error occurred." }` | Server error |

### 10.4 Request Body for `POST /api/v1/packages/:id/release`

```json
{
  "released_to_name": "string (required)",
  "id_verified": true,
  "is_authorized_delegate": false,
  "release_comments": "string | null",
  "signature_data": "base64 encoded PNG (optional)",
  "release_photo": "multipart file (optional)"
}
```

**Response (200 OK)**:

```json
{
  "id": "uuid",
  "reference_number": "PKG-QPC-004821",
  "status": "released",
  "released_to_name": "Janet Smith",
  "released_by": { "id": "uuid", "name": "J. Lee" },
  "released_at": "2026-03-14T14:15:00Z"
}
```

### 10.5 Request Body for `POST /api/v1/packages/batch`

```json
{
  "packages": [
    {
      "building_id": "uuid",
      "unit_id": "uuid",
      "resident_id": "uuid",
      "direction": "incoming",
      "courier_id": "uuid",
      "tracking_number": "string | null",
      "parcel_category_id": "uuid | null",
      "storage_spot_id": "uuid | null",
      "is_perishable": false,
      "notify_channel": "default",
      "print_label": true
    }
  ]
}
```

**Response (207 Multi-Status)**:

```json
{
  "total": 15,
  "succeeded": 14,
  "failed": 1,
  "results": [
    { "index": 0, "status": "created", "id": "uuid", "reference_number": "PKG-QPC-004821" },
    { "index": 1, "status": "error", "error": "Unit not found." }
  ],
  "notifications_sent": 12,
  "labels_queued": 14
}
```

### 10.6 WebSocket Events

Real-time updates for staff working the same shift. Events are scoped to the current property.

| Event | Payload | Description |
|-------|---------|-------------|
| `package.created` | `{ id, reference_number, unit, resident, courier, is_perishable, storage_spot, created_by }` | New package logged by any staff |
| `package.released` | `{ id, reference_number, released_to, released_by, released_at }` | Package released by any staff |
| `package.deleted` | `{ id, reference_number, deleted_by }` | Package soft-deleted |
| `package.edited` | `{ id, reference_number, changed_fields, edited_by }` | Package details updated |
| `package.reminder_sent` | `{ id, reference_number, channel, sent_to }` | Reminder notification sent |
| `package.escalation` | `{ id, reference_number, escalation_level, message }` | Perishable escalation triggered |
| `storage.capacity_warning` | `{ spot_id, spot_name, current, capacity, percent }` | Storage spot capacity threshold reached |

---

## 11. Completeness Checklist

### Functional Coverage

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | Single package intake with all 15 fields | Covered | 3.1.1 |
| 2 | 15 courier types with branded icons | Covered | 3.1.1 (Courier icon grid) |
| 3 | 11 parcel categories (configurable) | Covered | 3.1.1 (Parcel categories) |
| 4 | Batch intake (1-20 rows) | Covered | 3.1.2 |
| 5 | Release flow with identity verification | Covered | 3.1.3 |
| 6 | Signature capture on release | Covered | 3.1.3 (Step 2) |
| 7 | Photo capture on release | Covered | 3.1.3 (Step 2) |
| 8 | Storage spot tracking with capacity | Covered | 3.1.8 |
| 9 | Perishable handling with escalation chain | Covered | 3.1.9 |
| 10 | Label printing with barcode | Covered | 3.1.7 |
| 11 | Reference number auto-generation | Covered | 3.1.6 |
| 12 | Resident self-service portal | Covered | 3.1.10 |
| 13 | Authorized pickup delegates | Covered | 3.1.10 |
| 14 | Outgoing package logging | Covered | 3.1.11 |
| 15 | Courier tracking integration (v2) | Covered | 3.2.1 |
| 16 | Package waiver/agreement (v2) | Covered | 3.2.2 |
| 17 | Unclaimed package processing (v2) | Covered | 3.2.4 |
| 18 | Configurable courier management (v2) | Covered | 3.2.5 |

### AI Coverage

| # | AI Capability | Status | Section |
|---|---------------|--------|---------|
| 1 | Courier Label OCR | Covered | 7.1 |
| 2 | Tracking Number Extraction (OCR) | Covered | 7.2 |
| 3 | Delivery Time Prediction / Volume Forecasting | Covered | 7.3 |
| 4 | Peak Time Staffing Recommendations | Covered | 7.4 |
| 5 | Smart Notification Batching | Covered | 7.5 |
| 6 | Courier Performance Analytics | Covered | 7.6 |
| 7 | Anomaly Detection | Covered | 7.7 |
| 8 | Smart Storage Suggestion | Covered | 7.8 |
| 9 | Auto-Courier Detection from Tracking # | Covered | 7.9 |
| 10 | Unreleased Package Escalation Intelligence | Covered | 7.10 |

### UX Coverage

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | Desktop layout (1280px+) | Covered | 6.1 |
| 2 | Tablet layout (768px-1279px) | Covered | 6.2 |
| 3 | Mobile layout (< 768px) | Covered | 6.3 |
| 4 | Empty state (no packages) | Covered | 3.1.4 |
| 5 | Empty state (no search results) | Covered | 3.1.4 |
| 6 | Empty state (resident, no packages) | Covered | 3.1.10 |
| 7 | Empty state (no storage spots) | Covered | 3.1.8 |
| 8 | Loading state | Covered | 3.1.4 |
| 9 | Error state | Covered | 3.1.4 |
| 10 | Button states (default, loading, success, failure) | Covered | 3.1.1, 3.1.3, 3.1.5, 3.1.7 |
| 11 | Tooltips for complex fields | Covered | 3.1.1 (all 15 form fields) |
| 12 | Progressive disclosure (batch intake, advanced filters, delegate management) | Covered | 3.1.2, 3.1.4, 3.1.10 |
| 13 | Accessibility (keyboard, screen reader, color independence, touch targets) | Covered | 6.4 |

### Data Coverage

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | All fields: data type, max length, required/optional, default, validation, error messages | Covered | 3.1.1, 4.1 |
| 2 | Data model with relationships and foreign keys | Covered | 4.1, 4.2 |
| 3 | Indexes for query performance | Covered | 4.3 |
| 4 | Soft delete support | Covered | 4.1 (`deleted_at`) |
| 5 | Audit trail (PackageHistory) | Covered | 4.2 |

### Integration Coverage

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | REST API with all CRUD operations | Covered | 10.1 |
| 2 | Query parameters for filtering and pagination | Covered | 10.2 |
| 3 | Request/response bodies with examples | Covered | 10.3, 10.4, 10.5 |
| 4 | Error response formats | Covered | 10.3 |
| 5 | WebSocket real-time events | Covered | 10.6 |
| 6 | Role-based API authorization | Covered | 10.1 (Auth Roles column) |
| 7 | Notification system integration | Covered | 9.1, 9.2 |
| 8 | Analytics and reporting | Covered | 8.1, 8.2, 8.3 |
| 9 | Export (Excel/PDF/CSV) | Covered | 8.2 |

---

*End of document.*
