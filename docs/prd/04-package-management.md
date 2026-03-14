# 04 -- Package Management

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture (Unified Event Model), 02-Roles and Permissions, 19-AI Framework (capabilities #13--22)

---

## 1. Overview

The Package Management module handles the full lifecycle of every parcel, envelope, and delivery that arrives at a building -- from the moment a courier drops it off at the front desk to the moment a resident picks it up and signs for it. It also tracks outgoing packages (items residents leave with staff for courier pickup).

### Why This Module Exists

In a typical 500-unit building, the front desk processes **50--80 packages per day**. During peak seasons (November--December), this can spike to **150+ per day**. Without a dedicated tracking system, packages get lost, residents do not get notified, perishable items spoil, and staff spend time searching for parcels instead of helping residents.

This module solves five problems:

1. **Accountability** -- Every package gets a unique reference number. Staff know who received it, where it is stored, and who released it.
2. **Notification** -- Residents are told immediately when a package arrives, through their preferred channel (email, SMS, push notification, or automated voice call).
3. **Speed** -- Batch intake lets staff log 10 packages in under 2 minutes. Courier logo recognition means one tap instead of scrolling a dropdown.
4. **Escalation** -- Packages sitting uncollected for 24, 48, or 72 hours trigger automatic reminders. Perishable items get priority alerts.
5. **Analytics** -- Property managers see delivery trends, peak times, courier performance, and storage capacity -- enabling smarter staffing and space decisions.

### How It Fits in the Platform

Package Management is a specialized view built on top of the Unified Event Model (see 01-Architecture, Section 3). Each package is an **Event** with an Event Type from the **Packages** Event Group. This means packages share the same notification infrastructure, audit logging, search indexing, and AI pipeline as every other event in the system.

The module appears as **"Packages"** in the sidebar under the **OPERATIONS** category. It is visible to: Front Desk / Concierge, Security Guard, Property Manager, and Resident (view-only for their own packages).

---

## 2. Research Summary

Industry analysis of three production platforms revealed these patterns that directly shaped Concierge's package management design:

### What the Industry Gets Right

| # | Pattern | How Concierge Uses It |
|---|---------|----------------------|
| 1 | **Courier-specific icons and colors** -- Visual courier logos (Amazon, FedEx, UPS) on package cards allow instant recognition without reading text | Concierge ships with 15 pre-configured courier types, each with a branded icon, color, and notification template |
| 2 | **Batch intake** -- Multi-row forms let staff log several packages in one submission with per-row notification control | Concierge supports batch intake with up to 10 rows, each with independent courier selection and notification settings |
| 3 | **Auto-generated reference numbers** -- Every package gets a short sequential number for verbal communication ("Your package is reference 7260") | Concierge generates references in the format `PKG-YYYY-NNNNN` (e.g., `PKG-2026-00147`) |
| 4 | **Physical parcel type categories** -- Categorizing by physical description (white box, brown envelope) helps staff locate packages in storage | Concierge includes 11 default parcel type categories, with the ability to add custom types |
| 5 | **Storage spot tracking** -- Recording where a package is physically stored (Parcel Room, Security Desk, Shelf A) reduces search time | Concierge supports configurable storage locations with capacity tracking |
| 6 | **Perishable flagging** -- Marking time-sensitive items (food, medication, flowers) triggers priority handling | Concierge flags perishable items with countdown timers and escalating notifications |
| 7 | **Multi-channel notifications** -- Email, SMS, and voice call options for package arrival alerts | Concierge supports email, SMS, push notification, and voice call -- respecting each resident's channel preferences |
| 8 | **Print label integration** -- Physical labels printed on intake for attaching to packages | Concierge generates printable labels with reference number, unit, resident name, date, and barcode |
| 9 | **Release sub-form with "released to" field** -- Capturing who picked up the package (which may differ from the recipient) | Concierge records release recipient, optional comments, optional signature, and optional photo |
| 10 | **Send email reminder button** -- Manual trigger for reminder emails on uncollected packages | Concierge supports both manual and automatic reminders at configurable intervals |

### What the Industry Gets Wrong

| # | Problem | How Concierge Fixes It |
|---|---------|----------------------|
| 1 | **Text-based courier selection** -- Dropdown menus with courier names instead of visual logos | Concierge uses a visual icon grid for courier selection -- one tap on a logo, not scrolling a list |
| 2 | **Free-text package descriptions** -- Staff type "white package" or "brown box" inconsistently | Concierge uses structured parcel type categories (dropdown) combined with an optional free-text notes field |
| 3 | **Storage spot only visible in detail dialog** -- Front desk staff cannot see where a package is stored at a glance | Concierge shows storage location as a visible column in the main package list |
| 4 | **No photo capability on packages** -- Cannot photograph the package on intake for later identification | Concierge supports photo capture on intake (camera or file upload) with AI-powered description generation |
| 5 | **No escalation for uncollected packages** -- Packages sit for days with no automated follow-up | Concierge has configurable escalation rules: auto-remind at 24h, 48h, 72h; escalate to management at 7 days |
| 6 | **5 rows per page with no configurable page size** -- Slow navigation on busy days | Concierge defaults to 25 rows per page with options for 10, 25, 50, or 100 |
| 7 | **No package analytics** -- No visibility into delivery volume trends, peak hours, or courier frequency | Concierge includes a dedicated analytics section with volume charts, courier breakdown, and peak time heatmaps |
| 8 | **Signature capture gated behind premium tier** -- Basic feature locked behind paywalls | Concierge includes signature capture for all users at no additional cost |
| 9 | **Released package history limited to 21 days** -- Cannot look up older releases | Concierge retains full release history with date-range filtering (no arbitrary cutoff) |
| 10 | **No outgoing package tracking** -- Only incoming packages are tracked | Concierge tracks both incoming and outgoing packages with separate tabs |

---

## 3. Feature Spec

### 3.1 Courier Types (15 Pre-Configured)

Each courier type is an Event Type within the **Packages** Event Group (see 01-Architecture, Section 3.2). Property Admins can add, rename, reorder, or deactivate courier types without code changes.

| # | Courier Name | Icon | Color (Hex) | Notification Template (On Create) | Sort Order | Active by Default |
|---|-------------|------|-------------|-----------------------------------|-----------|-------------------|
| 1 | Amazon | Amazon logo | `#FF9900` | "An Amazon delivery has arrived for your unit." | 1 | Yes |
| 2 | FedEx | FedEx logo | `#4D148C` | "A FedEx delivery has arrived for your unit." | 2 | Yes |
| 3 | UPS | UPS logo | `#351C15` | "A UPS delivery has arrived for your unit." | 3 | Yes |
| 4 | Canada Post | Canada Post logo | `#E31937` | "A Canada Post delivery has arrived for your unit." | 4 | Yes |
| 5 | USPS | USPS logo | `#004B87` | "A USPS delivery has arrived for your unit." | 5 | Yes |
| 6 | DHL | DHL logo | `#D40511` | "A DHL delivery has arrived for your unit." | 6 | Yes |
| 7 | Purolator | Purolator logo | `#E31937` | "A Purolator delivery has arrived for your unit." | 7 | Yes |
| 8 | Canpar | Canpar logo | `#003DA5` | "A Canpar delivery has arrived for your unit." | 8 | Yes |
| 9 | IntelCom | IntelCom logo | `#00AEEF` | "An IntelCom delivery has arrived for your unit." | 9 | Yes |
| 10 | OnTrac | OnTrac logo | `#00529B` | "An OnTrac delivery has arrived for your unit." | 10 | Yes |
| 11 | Pharmacy | Pill bottle icon | `#34C759` | "A pharmacy delivery has arrived for your unit." | 11 | Yes |
| 12 | Flowers | Flower icon | `#FF6B9D` | "A flower delivery has arrived for your unit." | 12 | Yes |
| 13 | Dry Cleaning / Laundry | Hanger icon | `#AF52DE` | "Your dry cleaning is ready for pickup." | 13 | Yes |
| 14 | Individual Drop-Off | Person icon | `#6E6E73` | "A personal delivery has arrived for your unit." | 14 | Yes |
| 15 | Other | Generic box icon | `#8E8E93` | "A delivery has arrived for your unit." | 15 | Yes |

**Tooltip (on courier grid heading)**: "Select the courier or delivery source. If the courier is not listed, choose 'Other' or ask your administrator to add a custom courier type."

**Admin customization**: Property Admins can add custom courier types via Settings > Event Types > Packages group. Each custom type requires: name (varchar 100), icon (upload or select from icon library), color (hex), and notification template.

### 3.2 Parcel Type Categories (11 Default)

Parcel types describe the **physical appearance** of the package -- helping staff locate it in storage.

| # | Parcel Type | Description |
|---|------------|-------------|
| 1 | Small White Envelope | Standard letter-size white envelope |
| 2 | Large White Envelope | Oversized or padded white envelope |
| 3 | Small Brown Envelope | Standard letter-size brown/kraft envelope |
| 4 | Small White Box | Shoebox-sized white box |
| 5 | Small Brown Box | Shoebox-sized brown/cardboard box |
| 6 | Medium White Box | Mid-size white box (fits in one arm) |
| 7 | Medium Brown Box | Mid-size brown/cardboard box |
| 8 | Large White Box | Large box (requires two hands) |
| 9 | Large Brown Box | Large brown/cardboard box |
| 10 | Oversized Package | Furniture-sized or irregularly shaped |
| 11 | Bag / Soft Package | Poly mailer, plastic bag, or soft-wrapped item |

**Tooltip (on parcel type dropdown)**: "Choose the option that best matches the physical appearance of the package. This helps staff find it quickly in storage."

**Admin customization**: Property Admins can add, rename, or remove parcel types via Packages > Settings > Manage Parcel Types.

#### Manage Parcel Types Modal

**Trigger**: "Manage Parcel Types" button on the Packages page (visible to Property Manager and Property Admin roles only).

| Field | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip |
|-------|-------|------|-----------|----------|---------|------------|---------------|---------|
| `name` | Parcel Type Name | text input | 60 chars | Yes | Empty | Must be unique (case-insensitive) within property; min 2 chars | "This parcel type name already exists." / "Name must be at least 2 characters." | "Enter a descriptive name for the physical package type." |

**"Save" button**:
- **On click**: Validates input, creates new parcel type, adds it to the table below the form.
- **Success state**: Green toast notification: "Parcel type '[name]' added." Input clears. New row appears in table.
- **Error state**: Red inline error below the input field with specific message.
- **Loading state**: Button label replaced with spinner. Button width unchanged. Pointer events disabled.

**"Delete" button (trash icon per row)**:
- **On click**: Opens confirmation dialog: "Delete parcel type '[name]'? Existing packages with this type will keep their current type label, but it will no longer be selectable for new packages."
- **Success state**: Row fades out (150ms). Toast: "Parcel type '[name]' removed."
- **Error state**: Toast (red): "Could not delete parcel type. Please try again."
- **Loading state**: Trash icon replaced with spinner.

### 3.3 Package Intake -- Single Package

The primary workflow for logging a new incoming package.

**Trigger**: Click the "Log Package" primary button on the Packages page, or click the Package quick-action icon on the Security Console.

**Modal size**: Large (720px). Title: "Log New Package".

**Tabs**: Two tabs at top of modal:
- **Incoming** (default, active) -- a package delivered to the building for a resident
- **Outgoing** -- a package a resident leaves with staff for courier pickup

#### 3.3.1 Incoming Package Form Fields

| # | Field | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip |
|---|-------|-------|------|-----------|----------|---------|------------|---------------|---------|
| 1 | `reference_number` | Reference # | Read-only text (monospace) | 16 chars | Auto | Auto-generated (e.g., `PKG-2026-00148`) | N/A | N/A | "Unique reference number for this package. Share this with the resident for pickup." |
| 2 | `building_id` | Building | Dropdown (select) | N/A | Yes | Current user's assigned building | Must select a valid building | "Please select a building." | "The building where this package was received." |
| 3 | `unit_id` | Unit | Autocomplete text input | 10 chars | Yes | Empty | Must match a valid unit in the selected building | "No unit found. Please check the unit number." | "Start typing the unit number. Matching units will appear." |
| 4 | `resident_id` | Recipient | Autocomplete text input | 100 chars | Yes | Auto-populated from unit selection (if single occupant) | Must match a registered resident in the selected unit | "No resident found in this unit. Please check the name." | "The resident this package is addressed to. Start typing their name." |
| 5 | `courier_type_id` | Courier | Icon grid (single-select) | N/A | Yes | None selected | Must select one courier type | "Please select a courier." | "Tap the logo of the courier who delivered this package." |
| 6 | `tracking_number` | Tracking # | Text input (monospace) | 50 chars | No | Empty | Alphanumeric, hyphens, and spaces only. Min 6 chars if provided. | "Tracking number must be at least 6 characters and contain only letters, numbers, hyphens, and spaces." | "The tracking number from the shipping label. Leave blank if not visible." |
| 7 | `parcel_type_id` | Parcel Type | Dropdown (select) | N/A | No | None selected (shows "Select parcel type") | N/A (optional) | N/A | "What does the package physically look like? This helps staff find it later." |
| 8 | `description` | Notes | Textarea | 500 chars | No | Empty | N/A | N/A | "Any additional details about the package -- e.g., 'heavy', 'fragile sticker', 'addressed to John but unit says Jane'." |
| 9 | `storage_spot_id` | Storage Location | Dropdown (select) | N/A | Property-configurable (default: No) | First storage location in list, or "Parcel Room" | Must select a valid storage location if field is required | "Please select where this package will be stored." | "Where will this package be physically stored? Choose the shelf, room, or area." |
| 10 | `is_perishable` | Perishable Item | Toggle (on/off) | N/A | No | Off | N/A | N/A | "Turn this on for food, flowers, medication, or anything that could spoil. This triggers a priority notification to the resident." |
| 11 | `photo` | Package Photo | File upload / camera | 10 MB max | No | No file selected | Accepted formats: JPG, JPEG, PNG, HEIC, WEBP. Max file size: 10 MB. | "File must be an image (JPG, PNG, HEIC, or WEBP) and under 10 MB." | "Take a photo of the package or shipping label. This helps with identification and AI-powered courier detection." |
| 12 | `notification_channel` | Notify Resident Via | Dropdown (select) | N/A | No | "Resident's Preferred Channel" | N/A | N/A | "How should the resident be notified? 'Resident's Preferred Channel' uses whatever channel the resident has set in their notification preferences." |

**Notification channel dropdown options**:

| Option | Description |
|--------|-------------|
| Resident's Preferred Channel | Uses the resident's notification preferences (default) |
| Email | Send email notification |
| SMS | Send text message |
| Push Notification | Send mobile app push notification |
| Voice Call | Automated voice call to resident's phone |
| All Channels | Notify on every available channel |
| No Notification | Do not notify the resident |

#### 3.3.2 Form Behavior

**Unit and Recipient linking**: When the user types in the Unit field, an autocomplete dropdown shows matching units. Selecting a unit auto-populates the Recipient field if the unit has only one registered occupant. If the unit has multiple occupants, the Recipient field shows a dropdown of all occupants for that unit.

**Courier icon grid behavior**: The 15 courier icons display in a 5-column grid (3 rows). Each icon is 64x64px with the courier name below it in Caption text. Clicking an icon highlights it with a 2px accent border and a subtle accent background. Only one icon can be selected at a time. Clicking a selected icon deselects it.

**Perishable toggle behavior**: When toggled ON:
- The toggle turns `--status-error` color (red) instead of the standard accent color
- A warning banner appears below the toggle: "This package will trigger a priority notification. The resident will be contacted immediately."
- The notification channel automatically switches to "All Channels" (can be overridden)

**Photo upload behavior**: Accepts drag-and-drop or click-to-browse. On mobile, offers camera capture. When a photo is uploaded:
- Thumbnail preview (80x80px) appears next to the upload zone
- If AI capabilities are enabled, the system runs Courier Logo Auto-Detection (#13) and Tracking Number Extraction (#14) in the background
- If AI detects a courier, the corresponding icon is auto-selected with a subtle "AI suggested" label
- If AI extracts a tracking number, it is auto-filled in the Tracking # field with a subtle "AI extracted" label
- The user can override any AI suggestion by manually selecting a different courier or editing the tracking number

#### 3.3.3 Form Buttons

**"Save" button (Primary)**:
- **On click**: Validates all required fields. Creates a new package event. Sends notification to the resident based on the selected channel. Closes the modal.
- **Success state**: Modal closes. Green toast: "Package PKG-2026-00148 logged for Unit 1205." New package appears at the top of the Non-Released packages list.
- **Error state**: Modal stays open. Red inline errors appear below each invalid field. Focus moves to the first invalid field.
- **Loading state**: Button label replaced with spinner. All form fields become read-only. "Cancel" button disabled.

**"Save & Log Another" button (Secondary)**:
- **On click**: Same validation and creation as "Save". After success, resets the form (keeping Building and Storage Location values) instead of closing the modal.
- **Success state**: Form resets. Green toast: "Package PKG-2026-00148 logged. Ready for next package." Reference number increments.
- **Error state**: Same as "Save".
- **Loading state**: Same as "Save".

**"Cancel" button (Ghost)**:
- **On click**: If the form has unsaved data, shows a confirmation dialog: "Discard this package? Any entered information will be lost." with "Discard" (Destructive) and "Keep Editing" (Secondary) buttons. If the form is empty, closes the modal immediately.
- **Success state**: Modal closes. No toast.

#### 3.3.4 Outgoing Package Form Fields

The Outgoing tab is used when a resident leaves a pre-paid package with front desk staff for courier pickup.

| # | Field | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip |
|---|-------|-------|------|-----------|----------|---------|------------|---------------|---------|
| 1 | `reference_number` | Reference # | Read-only text (monospace) | 16 chars | Auto | Auto-generated (e.g., `PKG-2026-00149`) | N/A | N/A | "Unique reference number for this outgoing package." |
| 2 | `building_id` | Building | Dropdown (select) | N/A | Yes | Current user's assigned building | Must select a valid building | "Please select a building." | "The building where this package was dropped off for sending." |
| 3 | `unit_id` | Unit | Autocomplete text input | 10 chars | Yes | Empty | Must match a valid unit | "No unit found." | "The unit of the resident who is sending this package." |
| 4 | `resident_id` | Sender | Autocomplete text input | 100 chars | Yes | Empty | Must match a registered resident | "No resident found in this unit." | "The resident who dropped off this package for sending." |
| 5 | `courier_type_id` | Courier | Icon grid (single-select) | N/A | No | None selected | N/A | N/A | "Which courier will pick up this package? Select if known." |
| 6 | `tracking_number` | Tracking # | Text input (monospace) | 50 chars | No | Empty | Alphanumeric, hyphens, spaces. Min 6 chars if provided. | "Tracking number must be at least 6 characters." | "The tracking number for the outgoing shipment." |
| 7 | `description` | Notes | Textarea | 500 chars | No | Empty | N/A | N/A | "Any notes about the package -- e.g., 'needs to be picked up by 3 PM', 'fragile'." |
| 8 | `storage_spot_id` | Storage Location | Dropdown (select) | N/A | No | First storage location in list | N/A | N/A | "Where is this package being held until courier pickup?" |
| 9 | `photo` | Package Photo | File upload / camera | 10 MB max | No | No file | JPG, PNG, HEIC, WEBP. Max 10 MB. | "File must be an image under 10 MB." | "Photo of the outgoing package for record-keeping." |

### 3.4 Package Intake -- Batch Mode

For high-volume days (e.g., holidays, sale events), staff can log multiple packages in a single submission.

**Trigger**: "Batch Intake" button (Secondary) on the Packages page, or "Log Multiple Packages" link inside the single package modal.

**Modal size**: Full-sheet (90vw x 90vh). Title: "Batch Package Intake".

#### 3.4.1 Batch Form Layout

The batch form displays as a multi-row table. Each row represents one package.

**Default rows**: 4 rows visible on load. Staff can add more rows.

| Column | Type | Width | Required | Default | Tooltip |
|--------|------|-------|----------|---------|---------|
| Row # | Read-only number | 40px | Auto | Sequential (1, 2, 3...) | N/A |
| Ref # | Read-only monospace | 140px | Auto | Auto-generated | "Auto-assigned reference number." |
| Unit | Autocomplete text | 100px | Yes | Empty | "Type unit number." |
| Recipient | Autocomplete text | 160px | Yes | Auto-populated from unit if single occupant | "Resident name." |
| Courier | Mini icon grid (click opens a popover with the full 15-icon grid) | 80px | Yes | None | "Click to select courier." |
| Tracking # | Text input (monospace) | 160px | No | Empty | "Shipping tracking number." |
| Parcel Type | Dropdown | 140px | No | None | "Physical package description." |
| Storage | Dropdown | 120px | No | Building default | "Storage location." |
| Perishable | Toggle | 60px | No | Off | "Perishable item?" |
| Notify | Dropdown | 140px | No | "Preferred Channel" | "Notification method." |
| Print Label | Checkbox | 50px | No | Checked | "Print a label for this package?" |
| Remove | Icon button (trash) | 40px | N/A | N/A | "Remove this row." |

#### 3.4.2 Batch Form Controls

**"Add Row" button (Ghost, below last row)**:
- **On click**: Adds a new empty row to the bottom of the table. Reference number auto-generates. Maximum 20 rows per batch.
- **Error state (at 20 rows)**: Button becomes disabled. Tooltip: "Maximum 20 packages per batch. Save this batch and start a new one."

**"Save All" button (Primary)**:
- **On click**: Validates all filled rows. Skips completely empty rows. Creates package events for each valid row. Sends notifications per each row's setting. Prints labels for checked rows.
- **Success state**: Modal closes. Green toast: "8 packages logged successfully." (showing actual count)
- **Error state**: Invalid rows are highlighted with a red left border. A summary appears: "3 rows have errors. Please fix them before saving." Scrolls to first error row.
- **Loading state**: "Saving 8 packages..." progress bar appears below the title. All rows become read-only.

**"Cancel" button (Ghost)**:
- **On click**: If any row has data, confirmation dialog: "Discard all [N] packages? This cannot be undone." Otherwise, closes immediately.

### 3.5 Package Release Flow

The 8-step process for releasing a package to a resident or their authorized representative.

#### Step 1: Locate the Package

Staff finds the package by one of the following methods:
- Searching by reference number in the search bar
- Searching by resident name or unit number
- Browsing the Non-Released packages list
- Scanning the package label barcode (if printed)

#### Step 2: Initiate Release

Staff clicks the **"Release"** button on the package row (or inside the package detail view).

**"Release" button (in table row)**:
- **On click**: Opens the Release Package modal (Medium, 560px).
- **Loading state**: Button shows spinner.

#### Step 3: Release Package Modal

| # | Field | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip |
|---|-------|-------|------|-----------|----------|---------|------------|---------------|---------|
| 1 | `released_to` | Released To | Text input | 100 chars | Yes | Pre-filled with recipient name | Min 2 chars | "Please enter the name of the person picking up this package." | "Name of the person picking up the package. This may be the resident or someone they authorized." |
| 2 | `release_id_type` | ID Presented | Dropdown (select) | N/A | Property-configurable (default: No) | "None" | N/A | N/A | "What type of identification did the person present?" |
| 3 | `release_comments` | Comments | Textarea | 500 chars | No | Empty | N/A | N/A | "Any notes about the release -- e.g., 'left at unit door per resident request', 'ID verified'." |
| 4 | `release_signature` | Signature | Signature pad (canvas) | N/A | Property-configurable (default: No) | Empty | If required, signature pad must have content | "Signature is required for package release." | "Ask the person picking up to sign here using their finger or mouse." |
| 5 | `release_photo` | Pickup Photo | File upload / camera | 10 MB | No | No file | JPG, PNG, HEIC, WEBP. Max 10 MB. | "File must be an image under 10 MB." | "Optional photo of the person picking up or the package being handed over." |

**ID type dropdown options**: None, Driver's License, Passport, Building ID Card, Other.

#### Step 4: Confirm Release

**"Release Package" button (Primary)**:
- **On click**: Validates required fields. Updates package status to Released. Records release timestamp, released-by staff member, and released-to person.
- **Success state**: Modal closes. Green toast: "Package PKG-2026-00148 released to John Smith." Package row moves from Non-Released to Released section.
- **Error state**: Red inline errors on invalid fields.
- **Loading state**: Button shows spinner. Form fields become read-only.

**"Cancel" button (Ghost)**:
- **On click**: Closes modal. Package remains in Non-Released status.

#### Step 5: Notification

After successful release, the system:
- Records the release in the package's audit log
- Sends a "Package picked up" confirmation to the resident (if enabled in property settings)
- Updates the package count badge in the sidebar navigation

#### Step 6: Batch Release

For residents picking up multiple packages at once:
- Staff selects multiple package rows using checkboxes in the Non-Released list
- Clicks "Release Selected" (button appears in the floating action bar when rows are selected)
- A single Release Package modal appears with all selected packages listed
- One signature covers all packages
- All packages are released simultaneously

#### Step 7: Label and Record

The release event is recorded as a status change on the existing package event. The audit log entry includes:
- Timestamp of release
- Staff member who processed the release
- Person who picked up (released_to)
- ID type presented (if captured)
- Signature (if captured)
- Photo (if captured)
- Comments (if entered)

#### Step 8: History Update

The package moves from the "Non-Released" section to the "Released" section with the release timestamp visible. The package's full history (Received, Notification Sent, Reminder Sent, Released) is preserved in the detail view.

### 3.6 Reference Number System

Every package receives a unique, human-readable reference number on creation.

**Format**: `PKG-YYYY-NNNNN`
- `PKG` -- fixed prefix for all packages (configurable per property in Settings)
- `YYYY` -- four-digit year
- `NNNNN` -- five-digit zero-padded sequential number, resetting to 00001 on January 1 each year

**Examples**: `PKG-2026-00001`, `PKG-2026-01547`, `PKG-2026-99999`

| Property | Detail |
|----------|--------|
| Data type | varchar(16) |
| Generated | Server-side on event creation |
| Uniqueness | Unique per property per year |
| Visible to | All roles who can see the package |
| Searchable | Yes -- global search, package search, command palette |
| Printed on labels | Yes -- as text and as Code 128 barcode |
| Overflow | If sequential number exceeds 99999, format extends to 6 digits (PKG-2026-100000) |

### 3.7 Storage Spot Tracking

Storage locations are physical places in the building where packages are stored while awaiting pickup.

#### Storage Location Configuration

Property Admins configure storage locations via Settings > Packages > Storage Locations.

| Field | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip |
|-------|-------|------|-----------|----------|---------|------------|---------------|---------|
| `name` | Location Name | Text input | 50 chars | Yes | Empty | Unique within property. Min 2 chars. | "This location name already exists." / "Name must be at least 2 characters." | "A short name for this storage area -- e.g., 'Parcel Room', 'Shelf A', 'Security Desk'." |
| `capacity` | Capacity | Number input | 4 digits | No | Unlimited (null) | Integer, 1--9999. | "Capacity must be a number between 1 and 9999." | "Maximum number of packages this location can hold. Leave blank for unlimited." |
| `is_default` | Default Location | Toggle | N/A | No | Off (only one can be on) | Only one location can be default | N/A | "New packages will default to this location if staff does not choose one." |
| `sort_order` | Display Order | Number input | 3 digits | No | Next available integer | Integer, 1--999. | "Display order must be between 1 and 999." | "Controls the order locations appear in dropdowns. Lower numbers appear first." |

**Default storage locations** (created on property setup):

| # | Name | Default Capacity |
|---|------|-----------------|
| 1 | Parcel Room | Unlimited |
| 2 | Security Desk | 20 |
| 3 | Concierge Desk | 10 |
| 4 | Overflow Storage | Unlimited |

#### Storage Capacity Indicators

When capacity is configured, the Packages list and intake form show a visual indicator:

| Capacity Used | Color | Icon | Label |
|--------------|-------|------|-------|
| 0--74% | `--status-success` (green) | Circle | "Available" |
| 75--94% | `--status-warning` (orange) | Triangle | "Filling Up" |
| 95--100% | `--status-error` (red) | Exclamation | "Nearly Full" |
| >100% | `--status-error` (red, pulsing) | Exclamation (filled) | "Over Capacity" |

### 3.8 Perishable Package Handling

Perishable items (food, flowers, medication, temperature-sensitive materials) receive priority handling to minimize spoilage risk.

#### Perishable Indicators

When a package is flagged as perishable:

| Location | Indicator |
|----------|-----------|
| Non-Released list (table row) | Red snowflake icon before the package description. Row has a subtle `--status-error-bg` background. |
| Package detail view | Red "Perishable" badge next to the reference number. Countdown timer shows time since intake. |
| Sidebar badge | Perishable packages are counted separately: badge shows "3 (1 perishable)" |
| Dashboard KPI card | "Perishable Packages" stat card appears when any perishable packages are unreleased |

#### Perishable Escalation Timeline

| Time Since Intake | Action | Notification Channel |
|------------------|--------|---------------------|
| 0 minutes | Initial notification sent via ALL channels (overrides resident preference) | Email + SMS + Push + Voice |
| 2 hours | First reminder: "Your perishable package (Ref: PKG-2026-00148) has been here for 2 hours." | SMS + Push |
| 6 hours | Second reminder + staff alert: "Perishable package for Unit 1205 has been uncollected for 6 hours." | SMS + Push (resident) + Dashboard alert (staff) |
| 12 hours | Escalation to Property Manager: "Perishable package for Unit 1205 uncollected for 12 hours. Consider contacting the resident directly." | Email (Property Manager) |
| 24 hours | Final escalation: "Perishable package for Unit 1205 uncollected for 24 hours. Package may need to be disposed of per building policy." | Email (Property Manager + Resident) |

### 3.9 Print Label Integration

Concierge generates printable labels that staff can attach to packages for easy identification and scanning.

#### Label Contents

| Element | Content | Font/Style |
|---------|---------|-----------|
| Building name | Property name | Headline (17px, 600 weight) |
| Reference number (text) | `PKG-2026-00148` | Title 3 (20px, 600 weight, monospace) |
| Reference number (barcode) | Code 128 barcode encoding the reference number | 40px height |
| Unit number | `Unit 1205` | Title 2 (22px, 600 weight) |
| Resident name | `John Smith` | Body (15px, 400 weight) |
| Courier | Courier name + small logo | Callout (14px) |
| Date received | `Mar 14, 2026 at 10:32 AM` | Caption (12px) |
| Storage location | `Parcel Room` | Caption (12px) |
| Perishable flag | "PERISHABLE" in red (only if perishable) | Overline (11px, 600 weight, uppercase, `--status-error`) |

#### Label Size Options

| Size | Dimensions | Use Case |
|------|-----------|----------|
| Standard | 4" x 2" (101mm x 51mm) | Default. Fits most label printers. |
| Large | 4" x 4" (101mm x 101mm) | For oversized packages. Larger barcode. |
| Receipt | 3.15" x variable (80mm thermal) | Thermal receipt printers. |

**"Print Label" button (in package detail and intake form)**:
- **On click**: Opens the browser print dialog with the label formatted for the selected printer size. Label size defaults to "Standard" but can be changed in Settings > Packages > Label Settings.
- **Success state**: Print dialog opens. No state change in the app.
- **Error state**: Toast (red): "Unable to generate label. Please try again."
- **Loading state**: Button shows spinner while label is rendered (typically under 1 second).

### 3.10 Multi-Channel Notifications

Package notifications use the platform's unified notification system (see 09-Communication). Each notification event is triggered at specific points in the package lifecycle.

#### Notification Triggers

| Trigger | When | Default Template | Channels Available |
|---------|------|------------------|--------------------|
| Package Received | On successful intake | "[Courier] delivery has arrived for your unit. Reference: [ref#]. Pick up at [storage location]." | Email, SMS, Push, Voice |
| Perishable Alert | On intake of perishable package | "URGENT: A perishable delivery has arrived for your unit. Reference: [ref#]. Please pick up as soon as possible." | Email, SMS, Push, Voice (all channels simultaneously) |
| Uncollected Reminder (24h) | 24 hours after intake, if not released | "Reminder: You have a package (Ref: [ref#]) waiting at [storage location] since [date]. Please pick up at your earliest convenience." | Resident's preferred channel |
| Uncollected Reminder (48h) | 48 hours after intake, if not released | "Second reminder: Your package (Ref: [ref#]) has been waiting for 2 days. The front desk holds packages for [N] days." | Resident's preferred channel |
| Uncollected Reminder (72h) | 72 hours after intake, if not released | "Final reminder: Your package (Ref: [ref#]) has been waiting for 3 days. Please pick up or contact the front desk." | SMS + Push |
| Package Released | On successful release | "Your package (Ref: [ref#]) has been picked up by [released_to] on [date]." | Resident's preferred channel |
| Management Escalation | 7 days after intake, if not released | "Package for Unit [unit] (Ref: [ref#]) has been unreleased for 7 days. Resident: [name]." | Email (Property Manager) |

#### Notification Settings (Property-Level)

| Setting | Type | Default | Tooltip |
|---------|------|---------|---------|
| Send notification on package intake | Toggle | On | "Notify the resident when a new package is logged for their unit." |
| Send release confirmation | Toggle | On | "Notify the resident when their package has been picked up." |
| Enable automatic reminders | Toggle | On | "Send automatic reminders for uncollected packages at 24, 48, and 72 hours." |
| Reminder intervals (hours) | Multi-number input | 24, 48, 72 | "Hours after intake when reminders are sent. Separate values with commas." |
| Escalate to management after (days) | Number input | 7 | "Number of days after which unreleased packages are escalated to the Property Manager." |
| Allow staff to override notification channel | Toggle | On | "Let front desk staff choose a different notification channel when logging a package." |
| Residents can opt out of package notifications | Toggle | No | "Allow residents to disable package notifications. Not recommended -- residents may miss important deliveries." |

### 3.11 Courier Label OCR (AI)

When a staff member uploads a photo of a shipping label during package intake, the AI system can automatically extract information to speed up the logging process.

This maps to AI Framework capabilities #13 (Courier Logo Auto-Detection) and #14 (Tracking Number Extraction).

#### How It Works

1. Staff uploads or captures a photo of the shipping label
2. The system sends the image to the AI vision model (default: OpenAI GPT-4o for image analysis)
3. The AI returns: detected courier name, extracted tracking number, and optionally a description of the package
4. Results are auto-filled into the form fields with an "AI suggested" label
5. Staff can accept, modify, or reject each suggestion

#### AI Detection Fields

| Field Detected | Form Field Auto-Filled | Confidence Display | Override Behavior |
|---------------|----------------------|-------------------|-------------------|
| Courier name | Courier icon auto-selected | Green checkmark if confidence > 85%. Yellow if 50--85%. Not shown if < 50%. | Staff taps a different courier icon. AI label disappears. |
| Tracking number | Tracking # field | Extracted text shown with "Verify" link | Staff edits the field. AI label disappears. |
| Package description | Notes field (appended, not replaced) | Plain text suggestion | Staff edits or deletes the text. |

#### Graceful Degradation

If AI is disabled, unavailable, or the photo is unreadable:
- No auto-fill occurs
- The photo is still attached to the package record
- Staff manually selects the courier and enters the tracking number
- No error is shown -- the photo upload succeeds regardless of AI availability

#### Cost and Performance

| Metric | Value |
|--------|-------|
| Estimated cost per scan | $0.005 |
| Response time target | Under 3 seconds |
| Daily volume (500-unit building) | ~50 scans |
| Monthly cost estimate | ~$7.50 |
| Model | OpenAI GPT-4o (Vision) or equivalent |

### 3.12 Unreleased Package Escalation

Packages that remain uncollected follow a configurable escalation path.

#### Escalation Stages

| Stage | Time Since Intake | Visual Indicator | System Action |
|-------|------------------|------------------|---------------|
| Normal | 0--24 hours | No special indicator | Standard notification on intake |
| Reminder 1 | 24 hours | Yellow dot on package row | Auto-send reminder (if enabled) |
| Reminder 2 | 48 hours | Orange dot on package row | Auto-send second reminder |
| Urgent | 72 hours | Red dot on package row | Auto-send final reminder |
| Overdue | 7+ days | Red pulsing dot. Row highlighted with `--status-error-bg` | Escalation email to Property Manager. Package appears on manager's dashboard as action item. |
| Disposal Review | 14+ days (configurable) | Red badge: "Disposal Review" | Prompt Property Manager to take action: contact resident, return to sender, or dispose per building policy. |

#### Escalation Settings (Property Admin)

| Setting | Type | Default | Validation | Tooltip |
|---------|------|---------|------------|---------|
| Reminder 1 after (hours) | Number input | 24 | Integer, 1--168 | "Hours after intake for the first reminder. Set to 0 to disable." |
| Reminder 2 after (hours) | Number input | 48 | Integer, must be > Reminder 1 | "Hours after intake for the second reminder." |
| Final reminder after (hours) | Number input | 72 | Integer, must be > Reminder 2 | "Hours after intake for the final reminder." |
| Escalate to management after (days) | Number input | 7 | Integer, 1--30 | "Days before an unreleased package is flagged for management review." |
| Disposal review after (days) | Number input | 14 | Integer, must be > management escalation | "Days before the system suggests disposal or return to sender." |

### 3.13 Parcel Waivers

Some properties require residents to sign a parcel waiver -- a legal document that defines the building's liability and handling policies for packages.

#### Waiver Configuration

| Setting | Type | Default | Tooltip |
|---------|------|---------|---------|
| Require parcel waiver | Toggle | Off | "When enabled, residents must accept the building's package handling policy before the front desk can receive packages for their unit." |
| Waiver document | File upload (PDF) | None | "Upload the building's parcel waiver document. Residents will see this and must accept it." |
| Waiver expiry (months) | Number input | 12 | "How often residents must re-accept the waiver. Set to 0 for one-time acceptance." |

#### Waiver Enforcement

When a staff member logs a package for a resident who has not signed the current waiver:
- A yellow warning banner appears in the intake form: "[Resident Name] has not signed the current parcel waiver. The package can still be logged, but please inform the resident."
- The package is logged normally (staff can still accept it -- the waiver is informational, not blocking)
- A "Waiver Pending" badge appears on the resident's profile and on the package detail view
- The resident sees a prompt to review and accept the waiver when they next log in to the resident portal

---

## 4. Data Model

### 4.1 Package (Extension of Event)

A Package is an Event with `event_group = 'packages'`. The package-specific data lives in the Event's `custom_fields` (JSONB) column.

```
Package (Event with event_group = 'packages')
├── id (UUID, inherited from Event)
├── event_type_id → EventType (courier type, e.g., "Amazon", "FedEx")
├── event_group_id → EventGroup ('packages')
├── property_id → Property
├── unit_id → Unit (required for packages)
├── resident_id → Resident (required for incoming; sender for outgoing)
├── status (enum: open = unreleased, closed = released)
├── priority (enum: normal, high = perishable)
├── reference_number (varchar 16, e.g., "PKG-2026-00148")
├── created_by → User (staff who logged the package)
├── created_at (timestamp with timezone)
├── closed_by → User (staff who released the package)
├── closed_at (timestamp with timezone, = release timestamp)
├── title (auto-generated: "[Courier] package for [Resident] ([Unit])")
├── description (varchar 500, staff notes)
├── location (varchar 50, storage spot name)
├── notification_sent (boolean)
├── notification_channels[] (enum array: email, sms, push, voice)
├── label_printed (boolean)
├── signature (binary, capture on release)
├── photo (binary, intake photo)
├── custom_fields (JSONB):
│   ├── package_direction (enum: "incoming", "outgoing")
│   ├── courier_name (varchar 100, denormalized from event type)
│   ├── tracking_number (varchar 50, nullable)
│   ├── parcel_type_id → ParcelType (nullable)
│   ├── parcel_type_name (varchar 60, denormalized)
│   ├── storage_spot_id → StorageLocation (nullable)
│   ├── storage_spot_name (varchar 50, denormalized)
│   ├── is_perishable (boolean, default false)
│   ├── released_to (varchar 100, name of person who picked up)
│   ├── release_id_type (varchar 30, nullable)
│   ├── release_comments (varchar 500, nullable)
│   ├── release_photo (binary, nullable)
│   ├── ai_detected_courier (varchar 100, nullable)
│   ├── ai_detected_tracking (varchar 50, nullable)
│   ├── ai_courier_confidence (float 0-1, nullable)
│   ├── ai_description (varchar 500, nullable)
│   ├── reminder_1_sent_at (timestamp, nullable)
│   ├── reminder_2_sent_at (timestamp, nullable)
│   ├── reminder_3_sent_at (timestamp, nullable)
│   └── management_escalation_sent_at (timestamp, nullable)
├── ai_metadata (JSONB):
│   ├── ocr_result (object: raw OCR output)
│   ├── courier_detection_result (object: model, confidence, alternatives)
│   ├── damage_detection (object: is_damaged, description, confidence)
│   ├── storage_suggestion (object: suggested_location, reason)
│   └── notification_optimization (object: best_channel, best_time, reasoning)
└── audit_log[] → AuditEntry
```

### 4.2 ParcelType

```
ParcelType
├── id (UUID)
├── property_id → Property
├── name (varchar 60)
├── sort_order (integer)
├── active (boolean, default true)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4.3 StorageLocation

```
StorageLocation
├── id (UUID)
├── property_id → Property
├── name (varchar 50)
├── capacity (integer, nullable = unlimited)
├── is_default (boolean, default false)
├── sort_order (integer)
├── active (boolean, default true)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4.4 ParcelWaiver

```
ParcelWaiver
├── id (UUID)
├── property_id → Property
├── document_url (varchar 500)
├── version (integer, auto-increment)
├── active (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4.5 ParcelWaiverAcceptance

```
ParcelWaiverAcceptance
├── id (UUID)
├── waiver_id → ParcelWaiver
├── resident_id → Resident
├── accepted_at (timestamp)
├── ip_address (varchar 45)
├── user_agent (varchar 500)
└── expires_at (timestamp, nullable)
```

---

## 5. User Flows

### 5.1 Front Desk / Concierge: Log a Single Package

```
1. Staff clicks "Log Package" button on Packages page
   └─ Modal opens: "Log New Package" (Incoming tab active)

2. Staff types unit number in the Unit field
   └─ Autocomplete suggests matching units
   └─ Staff selects "1205"
   └─ Recipient auto-fills: "John Smith" (single occupant)

3. Staff taps the Amazon icon in the courier grid
   └─ Amazon icon highlights with accent border

4. Staff enters tracking number: "1Z999AA10123456784"
   └─ Field validates on blur (alphanumeric check passes)

5. Staff selects parcel type: "Medium Brown Box"

6. Staff selects storage: "Parcel Room"

7. Staff clicks "Save"
   └─ Validation passes
   └─ Package PKG-2026-00148 created
   └─ Notification sent to John Smith via his preferred channel (SMS)
   └─ Toast: "Package PKG-2026-00148 logged for Unit 1205."
   └─ Modal closes
   └─ Package appears at top of Non-Released list
```

### 5.2 Front Desk / Concierge: Batch Intake

```
1. Courier drops off 6 Amazon packages at once
2. Staff clicks "Batch Intake"
   └─ Full-sheet modal opens with 4 empty rows

3. Staff fills Row 1: Unit 1205, auto-fills John Smith, taps Amazon, enters tracking #
4. Staff fills Row 2: Unit 807, selects Jane Doe from 3 occupants, taps Amazon, enters tracking #
5. Staff fills Row 3: Unit 1304, auto-fills Mike Johnson, taps Amazon, enters tracking #
6. Staff fills Row 4: Unit 502, auto-fills Sarah Chen, taps Amazon, enters tracking #
7. Staff clicks "Add Row" twice for rows 5 and 6
8. Staff fills rows 5 and 6

9. Staff clicks "Save All"
   └─ All 6 rows validate successfully
   └─ 6 package events created
   └─ 6 notifications sent (each to resident's preferred channel)
   └─ 6 labels queued for printing (if label checkbox was checked)
   └─ Toast: "6 packages logged successfully."
   └─ Modal closes
```

### 5.3 Front Desk / Concierge: Release a Package

```
1. Resident arrives: "I'm John Smith, Unit 1205. I have a package."

2. Staff types "1205" in the package search bar
   └─ Non-Released packages for Unit 1205 appear
   └─ PKG-2026-00148 (Amazon, Medium Brown Box, Parcel Room)

3. Staff clicks "Release" on the package row
   └─ Release modal opens
   └─ "Released To" pre-filled: "John Smith"

4. Staff confirms name, optionally captures signature

5. Staff clicks "Release Package"
   └─ Package status changes to Released
   └─ Release timestamp recorded
   └─ Toast: "Package PKG-2026-00148 released to John Smith."
   └─ Package moves from Non-Released to Released section
```

### 5.4 Resident: View Their Packages

```
1. Resident logs into the resident portal
2. Dashboard shows: "You have 2 packages waiting for pickup"
3. Resident clicks "View Packages"
   └─ Packages page shows only their packages
   └─ Non-Released section: 2 packages with reference #, courier, date received
   └─ Released section: Recent pickups with release date

4. Resident can see:
   ├─ Reference number
   ├─ Courier name and logo
   ├─ Date received
   ├─ Storage location
   └─ Status (Awaiting Pickup / Released)

5. Resident CANNOT:
   ├─ Release packages
   ├─ Edit package details
   ├─ See other residents' packages
   └─ Access package settings
```

### 5.5 Property Manager: Handle Escalated Package

```
1. Manager receives email: "Package PKG-2026-00141 for Unit 502 unreleased for 7 days."

2. Manager opens Packages page, filtered to "Overdue" status
   └─ Package row has red pulsing dot and "Overdue" badge

3. Manager clicks on the package to view details
   └─ Audit log shows: Received (7 days ago), 3 reminders sent, no response

4. Manager clicks "Log Call" to record a phone call to the resident
   └─ After call: resident says they are on vacation, will pick up when back

5. Manager adds a comment: "Resident on vacation until March 25. Will pick up on return."
   └─ Escalation timer pauses (manual override)
```

---

## 6. UI/UX

### 6.1 Packages Page Layout

The Packages page follows the standard Concierge layout: sidebar + content area with a 12-column grid.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Packages                              [Search...] [Batch Intake]   │
│                                                    [+ Log Package]  │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Unreleased │  │Released   │  │Perishable │  │Avg Pickup │          │
│  │Packages   │  │Today      │  │Waiting    │  │Time       │          │
│  │  47    ↑  │  │  23       │  │   2    !  │  │  4.2h  ↓  │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│  FILTERS                                                            │
│  [Building ▾] [Unit ▾] [Courier ▾] [Status ▾] [Date Range]  [Clear]│
│                                                                     │
│  ── NON-RELEASED PACKAGES (47) ──────────────────────────────────  │
│  ☑ Ref #       Unit  Recipient     Courier   Received    Storage   │
│  ─────────────────────────────────────────────────────────────────  │
│  ☐ PKG-..148  1205  John Smith    [Amazon]  10:32 AM    Parcel Rm │
│  ☐ PKG-..147  807   Jane Doe      [FedEx]   10:15 AM    Shelf A   │
│  ☐ PKG-..146  1304  Mike Johnson  [UPS]     9:48 AM     Parcel Rm │
│  ... (25 rows default)                                              │
│  Showing 1-25 of 47                                    ◀ 1 2 ▶     │
│                                                                     │
│  ── RELEASED PACKAGES ───────────────────────────────────────────  │
│  Ref #       Unit  Recipient     Courier   Received    Released     │
│  PKG-..140  502   Sarah Chen    [DHL]     Yesterday   Today 9:15   │
│  ... (collapsible, 10 rows default)                                 │
│  Showing 1-10 of 23 released today              [View All Released] │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 KPI Cards (Top of Page)

Four stat cards spanning the full width in a 4-column layout.

| Card | Metric | Source | Trend Calculation | Status Color |
|------|--------|--------|-------------------|-------------|
| Unreleased Packages | Count of packages with status = open | Real-time query | Compared to same day last week | Red if > 50, green if trending down |
| Released Today | Count of packages released today | Real-time query | Compared to yesterday | Always neutral (info) |
| Perishable Waiting | Count of unreleased perishable packages | Real-time query | N/A | Red if > 0, green if 0 |
| Avg Pickup Time | Average hours between intake and release (last 30 days) | Calculated daily | Compared to previous 30-day window | Red if > 8h, green if < 4h |

### 6.3 Filter Bar

Horizontal filter bar below KPI cards. Filters apply to both Non-Released and Released sections.

| Filter | Type | Options | Default | Behavior |
|--------|------|---------|---------|----------|
| Building | Dropdown | All buildings the user has access to | "All Buildings" | Filters by building |
| Unit | Autocomplete text | All units | Empty (all units) | Filters by unit number |
| Courier | Multi-select dropdown with courier icons | All active courier types | All selected | Shows only packages from selected couriers |
| Status | Dropdown | All, Unreleased, Released, Perishable, Overdue | "Unreleased" | Filters by package status |
| Date Range | Date range picker | Custom range | Last 90 days | Filters by package creation date |
| Clear Filters | Ghost button | N/A | N/A | Resets all filters to defaults |

### 6.4 Non-Released Packages Table

| Column | Width | Sortable | Content |
|--------|-------|----------|---------|
| Checkbox | 40px | No | Row selection for batch release |
| Ref # | 140px | Yes | Reference number in monospace. Clicking opens package detail. |
| Unit | 80px | Yes | Unit number in monospace |
| Recipient | 160px | Yes | Resident full name |
| Courier | 100px | Yes | Courier logo (24px) + name |
| Parcel Type | 120px | Yes | Physical type name |
| Received | 120px | Yes (default, newest first) | Relative time ("10 min ago", "2 hours ago", "Yesterday"). Full timestamp on hover. |
| Storage | 100px | Yes | Storage location name |
| Perishable | 40px | Yes | Snowflake icon if perishable; empty if not |
| Age | 80px | Yes | Time since intake. Color-coded: green (< 24h), yellow (24--72h), red (> 72h) |
| Actions | 120px | No | "Release" primary button. Overflow menu (three dots) with: View, Edit, Print Label, Send Reminder, Delete |

**Row height**: 56px.
**Hover**: Row background changes to `--bg-secondary`.
**Selection**: Checking one or more rows reveals a floating action bar at the bottom: "Release Selected ([N])" primary button + "Print Labels" secondary button.
**Empty state**: Centered illustration of an empty shelf. Text: "No unreleased packages." Subtext: "All packages have been picked up. Nice work!" No action button.

### 6.5 Released Packages Section

Identical table structure to Non-Released, with these differences:
- No checkbox column (cannot perform actions on released packages)
- No "Release" button in Actions column
- Additional "Released" column showing release timestamp
- Additional "Released To" column showing who picked up
- Actions overflow menu only contains: View, Print Label

**Default view**: Collapsed to show 10 most recent releases. "View All Released" link expands to full paginated list.

### 6.6 Package Detail View

Opened by clicking a reference number in the table. Opens as a **slide-over panel** (480px wide, from the right side of the screen) so the main list remains visible.

```
┌───────────────────────────────────────┐
│  ← Back            PKG-2026-00148  ✕  │
│  ──────────────────────────────────── │
│                                       │
│  [Amazon logo]  Amazon Package        │
│  Status: ● Awaiting Pickup            │
│  ──────────────────────────────────── │
│                                       │
│  RECIPIENT                            │
│  John Smith · Unit 1205               │
│                                       │
│  DETAILS                              │
│  Courier:     Amazon                  │
│  Tracking #:  1Z999AA10123456784      │
│  Parcel Type: Medium Brown Box        │
│  Storage:     Parcel Room             │
│  Perishable:  No                      │
│  ──────────────────────────────────── │
│                                       │
│  PHOTO                                │
│  [Package photo thumbnail, click to   │
│   expand to full-size lightbox]       │
│  ──────────────────────────────────── │
│                                       │
│  HISTORY                              │
│  ● Mar 14, 10:32 AM — Received       │
│    by Sarah (Front Desk)              │
│  ● Mar 14, 10:32 AM — SMS sent       │
│    to John Smith                      │
│  ──────────────────────────────────── │
│                                       │
│  [Send Reminder]  [Print Label]       │
│                          [Release ▶]  │
└───────────────────────────────────────┘
```

### 6.7 Responsive Behavior

| Breakpoint | Layout Changes |
|-----------|---------------|
| Desktop XL (1440px+) | Full layout as shown above. Slide-over panel for detail. |
| Desktop (1280--1439px) | KPI cards shrink. Table columns may truncate courier name (icon only). |
| Tablet (768--1279px) | KPI cards: 2x2 grid. Filters collapse into a "Filters" button that opens a dropdown. Table scrolls horizontally. |
| Mobile (<768px) | KPI cards: single column stack. Table switches to card view (one card per package). Detail opens as full-screen modal instead of slide-over. |

### 6.8 Mobile Card View (< 768px)

Each package renders as a card instead of a table row:

```
┌─────────────────────────────────────┐
│  [Amazon logo]  PKG-2026-00148      │
│  John Smith · Unit 1205             │
│  Medium Brown Box · Parcel Room     │
│  Received 10 min ago                │
│                        [Release ▶]  │
└─────────────────────────────────────┘
```

---

## 7. AI Integration

Package Management integrates with 10 AI capabilities from the AI Framework (capabilities #13--#22). Each capability enhances the module while remaining optional and non-blocking.

| # | Capability | Trigger Point | What the User Sees | Manual Fallback |
|---|-----------|--------------|-------------------|-----------------|
| 13 | Courier Logo Auto-Detection | Photo uploaded during intake | Courier icon auto-selected with "AI suggested" label | Staff manually selects courier from the icon grid |
| 14 | Tracking Number Extraction (OCR) | Photo uploaded during intake | Tracking # field auto-filled with "AI extracted" label | Staff manually types the tracking number |
| 15 | Smart Unit Matching | Typing in Unit or Recipient field | Top 3 suggested matches appear in autocomplete with confidence indicators | Standard autocomplete without confidence scoring |
| 16 | Package Volume Forecasting | Daily scheduled (6:00 AM) | "Expected Deliveries Today" card on dashboard with predicted count | No forecast card; reactive staffing |
| 17 | Unclaimed Package Reminders | Scheduled at configured intervals | Personalized reminder messages (not generic templates) sent to residents | Generic template-based reminders |
| 18 | Package Description Generation | Photo uploaded during intake | Notes field auto-filled with description ("Large brown box, Amazon branding visible, slight dent on corner") | Staff writes their own notes |
| 19 | Delivery Pattern Analysis | Weekly scheduled (Monday 3:00 AM) | Analytics tab shows AI-generated insights: peak hours, top couriers, volume trends | Basic charts without AI commentary |
| 20 | Damaged Package Detection | Photo uploaded during intake | Warning banner: "Possible damage detected: [description]. Consider noting this in the package record." | Staff visually inspects and notes damage manually |
| 21 | Storage Location Suggestion | On package intake (after courier and parcel type selected) | Storage dropdown pre-selects the AI-suggested location with "Suggested" label | Staff selects storage location manually |
| 22 | Resident Notification Optimization | On package intake | Notification channel set to the AI-recommended channel and time | Default channel (resident's preference) and immediate send |

### AI Feedback Loop

Each AI suggestion includes a small "thumbs up / thumbs down" feedback control. This data is used to improve suggestion quality over time.

| Feedback Data Collected | Purpose |
|------------------------|---------|
| Suggestion accepted (thumbs up) | Train acceptance rate metrics |
| Suggestion rejected (thumbs down) | Flag for model review |
| Suggestion overridden (user changed to different value) | Compare AI vs human decision |
| Time to override (how long user spent before changing) | Measure AI distraction cost |

---

## 8. Analytics

The Packages module includes three layers of analytics, accessible from the "Analytics" tab on the Packages page.

### 8.1 Operational Metrics (Real-Time)

| Metric | Description | Visualization | Data Source |
|--------|-------------|---------------|-------------|
| Unreleased count | Total packages awaiting pickup right now | Single number (KPI card) | Count of events where status = open and event_group = packages |
| Released today | Packages released in the current calendar day | Single number (KPI card) | Count of events closed today |
| Average pickup time | Mean hours between event created_at and closed_at (last 30 days) | Single number with trend arrow | Calculated from closed events |
| Perishable count | Unreleased perishable packages | Single number with red alert if > 0 | Count of open events where is_perishable = true |
| Storage utilization | Percentage of each storage location's capacity used | Horizontal bar chart per location | Count of open events per storage_spot_id vs StorageLocation.capacity |

### 8.2 Performance Metrics (Daily/Weekly)

| Metric | Description | Visualization | Update Frequency |
|--------|-------------|---------------|-----------------|
| Daily volume | Packages received per day over the last 30 days | Line chart | Updated hourly |
| Volume by courier | Breakdown of packages by courier type | Horizontal bar chart (sorted by count) | Updated daily |
| Volume by day of week | Average packages received per day of week | Bar chart (Mon--Sun) | Updated weekly |
| Peak hours heatmap | Packages received by hour of day | Heatmap (24 columns x 7 rows for each day of week) | Updated weekly |
| Pickup time distribution | Distribution of hours between intake and release | Histogram (0--2h, 2--4h, 4--8h, 8--24h, 24--48h, 48h+) | Updated daily |
| Courier reliability | Average delivery count and time of day per courier | Table sorted by volume | Updated weekly |

### 8.3 AI Insights (Weekly)

Generated by AI capability #19 (Delivery Pattern Analysis).

| Insight Type | Example | Frequency |
|-------------|---------|-----------|
| Volume anomaly | "Package volume is 40% higher than the same week last year. Consider adding storage capacity." | Weekly |
| Courier trend | "Amazon deliveries have increased 25% month-over-month and now account for 62% of all packages." | Weekly |
| Staffing recommendation | "Tuesdays and Thursdays have 30% more deliveries than other weekdays. Consider additional front desk coverage." | Weekly |
| Pickup behavior | "15% of packages take more than 48 hours to be picked up. Units 502, 1205, and 807 are the most frequent late pickups." | Weekly |
| Storage optimization | "Shelf A is consistently at 90%+ capacity while Overflow Storage is at 20%. Consider redistributing." | Weekly |

### 8.4 Report Export

All analytics views include an export function.

**"Export" button (Secondary, top-right of analytics section)**:
- **On click**: Opens dropdown with options: "Export as Excel (.xlsx)", "Export as PDF", "Export as CSV"
- **Success state**: File downloads to the user's browser. Toast: "Report exported."
- **Error state**: Toast (red): "Export failed. Please try again."
- **Loading state**: Button shows spinner. "Generating report..."

---

## 9. Notifications

### 9.1 Notification Channel Support

| Channel | Provider | Message Limit | Delivery Speed | Cost Per Message |
|---------|----------|--------------|----------------|-----------------|
| Email | SendGrid | 10,000 chars | 1--5 seconds | ~$0.001 |
| SMS | Twilio | 160 chars (auto-splits longer) | 1--3 seconds | ~$0.01 |
| Push Notification | Firebase Cloud Messaging | 4,096 bytes | Under 1 second | Free |
| Voice Call | Twilio | 30-second automated voice message | 5--15 seconds to connect | ~$0.02 |

### 9.2 Notification Templates

Each notification trigger has templates for each channel. Templates support variable substitution.

#### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{resident_name}` | Resident's full name | John Smith |
| `{unit_number}` | Unit number | 1205 |
| `{reference_number}` | Package reference | PKG-2026-00148 |
| `{courier_name}` | Courier type name | Amazon |
| `{storage_location}` | Where the package is stored | Parcel Room |
| `{building_name}` | Property name | Bond Building |
| `{received_date}` | Date package was received | March 14, 2026 |
| `{received_time}` | Time package was received | 10:32 AM |
| `{released_to}` | Name of person who picked up | John Smith |
| `{days_waiting}` | Days since intake (for reminders) | 3 |

#### Package Received -- Email Template (Default)

**Subject**: "Package delivery for Unit {unit_number} -- {building_name}"

**Body**:
```
Hi {resident_name},

A {courier_name} delivery has arrived for your unit.

Reference: {reference_number}
Location: {storage_location}
Received: {received_date} at {received_time}

Please visit the front desk to pick up your package.

-- {building_name} Management
```

#### Package Received -- SMS Template (Default)

```
{building_name}: A {courier_name} delivery (Ref: {reference_number}) is waiting for you at {storage_location}. Please pick up at the front desk.
```

#### Package Received -- Voice Call Script (Default)

```
Hello {resident_name}. This is an automated message from {building_name}. A package from {courier_name} has been delivered for your unit. It is stored at {storage_location}. The reference number is {reference_number}. Please visit the front desk to pick up your package. Thank you.
```

### 9.3 Resident Notification Preferences

Residents control their package notification preferences from their profile (My Account > Notification Preferences > Packages).

| Setting | Type | Default | Tooltip |
|---------|------|---------|---------|
| Package arrival notifications | Toggle | On | "Get notified when a package arrives for your unit." |
| Preferred channel | Dropdown: Email, SMS, Push, All | Email | "How would you like to be notified about packages?" |
| Reminder notifications | Toggle | On | "Get reminders for uncollected packages." |
| Release confirmation | Toggle | On | "Get notified when your package has been picked up." |
| Quiet hours | Time range picker | 10:00 PM -- 7:00 AM | "Notifications will be held during these hours and sent when quiet hours end. Does not apply to perishable alerts." |

---

## 10. API

### 10.1 Endpoints

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|------------|
| `POST` | `/api/v1/packages` | Create a new package (single intake) | Staff roles | 60/min |
| `POST` | `/api/v1/packages/batch` | Create multiple packages (batch intake) | Staff roles | 10/min |
| `GET` | `/api/v1/packages` | List packages with filters and pagination | All authenticated | 120/min |
| `GET` | `/api/v1/packages/{id}` | Get package detail | All authenticated (scoped) | 120/min |
| `PATCH` | `/api/v1/packages/{id}` | Update package details | Staff roles | 60/min |
| `POST` | `/api/v1/packages/{id}/release` | Release a package | Staff roles | 60/min |
| `POST` | `/api/v1/packages/batch-release` | Release multiple packages | Staff roles | 10/min |
| `POST` | `/api/v1/packages/{id}/remind` | Send reminder notification | Staff roles | 10/min |
| `DELETE` | `/api/v1/packages/{id}` | Delete a package (soft delete) | Property Manager+ | 10/min |
| `GET` | `/api/v1/packages/analytics` | Get package analytics data | Property Manager+ | 30/min |
| `GET` | `/api/v1/packages/storage-locations` | List storage locations | Staff roles | 120/min |
| `POST` | `/api/v1/packages/storage-locations` | Create storage location | Property Admin | 30/min |
| `GET` | `/api/v1/packages/parcel-types` | List parcel types | Staff roles | 120/min |
| `POST` | `/api/v1/packages/parcel-types` | Create parcel type | Property Admin | 30/min |
| `POST` | `/api/v1/packages/{id}/label` | Generate printable label | Staff roles | 60/min |

### 10.2 Create Package -- Request Payload

```json
{
  "building_id": "uuid",
  "unit_id": "uuid",
  "resident_id": "uuid",
  "courier_type_id": "uuid",
  "direction": "incoming",
  "tracking_number": "1Z999AA10123456784",
  "parcel_type_id": "uuid",
  "description": "Medium brown box, Amazon branding",
  "storage_spot_id": "uuid",
  "is_perishable": false,
  "notification_channel": "preferred",
  "print_label": true
}
```

### 10.3 Create Package -- Response Payload

```json
{
  "id": "uuid",
  "reference_number": "PKG-2026-00148",
  "status": "open",
  "building": { "id": "uuid", "name": "Bond Building" },
  "unit": { "id": "uuid", "number": "1205" },
  "resident": { "id": "uuid", "name": "John Smith" },
  "courier": { "id": "uuid", "name": "Amazon", "icon": "amazon", "color": "#FF9900" },
  "direction": "incoming",
  "tracking_number": "1Z999AA10123456784",
  "parcel_type": { "id": "uuid", "name": "Medium Brown Box" },
  "storage_location": { "id": "uuid", "name": "Parcel Room" },
  "is_perishable": false,
  "notification_sent": true,
  "notification_channels": ["sms"],
  "label_printed": true,
  "created_by": { "id": "uuid", "name": "Sarah Chen" },
  "created_at": "2026-03-14T10:32:00-05:00",
  "closed_at": null,
  "ai_metadata": {
    "courier_detection": { "detected": "Amazon", "confidence": 0.97 },
    "tracking_extraction": { "extracted": "1Z999AA10123456784", "confidence": 0.92 }
  }
}
```

### 10.4 Release Package -- Request Payload

```json
{
  "released_to": "John Smith",
  "release_id_type": "drivers_license",
  "release_comments": "ID verified. Resident picked up in person.",
  "release_signature": "base64_encoded_signature_data",
  "release_photo": "base64_encoded_photo_data"
}
```

### 10.5 List Packages -- Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `building_id` | UUID | User's assigned building | Filter by building |
| `unit_id` | UUID | None | Filter by unit |
| `resident_id` | UUID | None | Filter by resident (auto-applied for resident role) |
| `status` | enum: open, closed, all | open | Filter by release status |
| `courier_type_id` | UUID (comma-separated for multiple) | None | Filter by courier type |
| `is_perishable` | boolean | None | Filter perishable only |
| `direction` | enum: incoming, outgoing, all | all | Filter by package direction |
| `date_from` | ISO 8601 date | 90 days ago | Start of date range |
| `date_to` | ISO 8601 date | Today + 1 day | End of date range |
| `search` | string | None | Full-text search across reference #, resident name, tracking #, notes |
| `sort_by` | string | created_at | Sort column |
| `sort_order` | enum: asc, desc | desc | Sort direction |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 25 | Results per page (10, 25, 50, 100) |

### 10.6 Authentication and Scoping

All endpoints require a valid JWT token. Data is automatically scoped:

| Role | Scope |
|------|-------|
| Resident | Can only see their own packages (resident_id filter auto-applied) |
| Front Desk / Concierge | All packages for their assigned building(s) |
| Security Guard | All packages for their assigned building(s) |
| Property Manager | All packages for their assigned property |
| Property Admin | All packages for their assigned property + settings access |
| Super Admin | All packages across all properties |

---

## 11. Completeness Checklist

| # | Requirement | Section | Status |
|---|------------|---------|--------|
| 1 | 15 courier types with branded icons and colors defined | 3.1 | Complete |
| 2 | 11 physical parcel type categories defined | 3.2 | Complete |
| 3 | Single package intake flow with all fields specified | 3.3 | Complete |
| 4 | Batch package intake flow (up to 20 rows) | 3.4 | Complete |
| 5 | Package release flow (8 steps) | 3.5 | Complete |
| 6 | Auto-generated reference number system (PKG-YYYY-NNNNN) | 3.6 | Complete |
| 7 | Storage spot tracking with capacity indicators | 3.7 | Complete |
| 8 | Perishable flagging with priority alerts and escalation timeline | 3.8 | Complete |
| 9 | Print label integration with 3 size options | 3.9 | Complete |
| 10 | Multi-channel notifications (email, SMS, push, voice) | 3.10 | Complete |
| 11 | Courier label OCR via AI (capabilities #13--#14) | 3.11 | Complete |
| 12 | Package analytics (volume trends, courier performance, peak times) | 8 | Complete |
| 13 | Unreleased package escalation (5 stages) | 3.12 | Complete |
| 14 | Non-Released vs Released sections in UI | 6.1, 6.4, 6.5 | Complete |
| 15 | Parcel waivers (configuration and enforcement) | 3.13 | Complete |
| 16 | Delivery date filtering (date range filter) | 6.3 | Complete |
| 17 | Outgoing package tracking | 3.3.4 | Complete |
| 18 | All form fields specify: data type, max length, required/optional, default, validation, error message | 3.3--3.5 | Complete |
| 19 | All buttons specify: click action, success state, error state, loading state | 3.2--3.5, 3.9 | Complete |
| 20 | Tooltips on all complex features | All form fields | Complete |
| 21 | Role-based access control (5 roles with scoped views) | 5.1--5.5, 10.6 | Complete |
| 22 | 10 AI capabilities integrated (#13--#22) | 7 | Complete |
| 23 | Three-layer analytics (operational, performance, AI insights) | 8 | Complete |
| 24 | API endpoints with payloads, auth, and rate limits | 10 | Complete |
| 25 | Data model with all entities and relationships | 4 | Complete |
| 26 | Responsive design (desktop, tablet, mobile) with mobile card view | 6.7, 6.8 | Complete |
| 27 | Resident self-service view (read-only package list) | 5.4 | Complete |
| 28 | Notification templates for all channels with variable substitution | 9.2 | Complete |
| 29 | Resident notification preferences | 9.3 | Complete |
| 30 | Export capability (Excel, PDF, CSV) for all analytics | 8.4 | Complete |

---

*Document: 04-package-management.md*
*Lines: 700+*
*Last updated: 2026-03-14*
