# 03 — Security Console

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture (Unified Event Model), 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

### What Is the Security Console?

The Security Console is the **primary operational hub** for security staff, concierge teams, and property managers. It combines every security-related operation into a single, unified interface: visitor management, package tracking, incident reporting, key management, shift handoffs, parking enforcement, and authorized entry logging.

Instead of navigating between separate pages for each task, staff see one continuously updating event stream with quick-create buttons for each entry type. Everything happens on one screen through overlay dialogs -- no page navigation, no lost context.

### Why Does It Exist?

Buildings need a centralized place to track everything that happens during a shift. Without it, staff juggle paper logs, sticky notes, and separate systems for packages, visitors, and incidents. The Security Console replaces all of that with a single digital command center that:

- Records every operational event with timestamps and accountability
- Enables shift handoffs without information loss
- Provides searchable history across all event types
- Supports real-time collaboration between multiple staff members on the same shift
- Generates audit trails for legal and compliance purposes

### Which Roles Use It?

| Role | Access Level | Primary Use |
|------|-------------|-------------|
| **Security Guard** | Create + view events, release packages, sign out visitors | Front-line operations during shifts |
| **Front Desk / Concierge** | Create + view events (visitors, parcels, notes) | Resident-facing package and visitor operations |
| **Security Supervisor** | Full access + analytics + export | Team oversight, incident review, reporting |
| **Property Manager** | Full access + analytics + export | Operational oversight, escalation handling |
| **Property Admin** | Full access + configuration | Event type setup, console settings |
| **Super Admin** | Full access across all properties | Platform-wide oversight |

Resident, Board Member, Maintenance Staff, and Family Member roles have **no access** to the Security Console. It does not appear in their navigation.

---

## 2. Industry Research Summary

This module's design is informed by field-level research documented across three production platforms. No competitor names are used here; refer to the source files for full details.

| Research Area | Source File | Key Takeaways |
|--------------|------------|---------------|
| Security menu with visitor parking, key checkout, key inventory, parking violations | `docs/security-menu.md` | Quick-create icons, digital signature capture on key checkout, ID verification fields, parking violation lifecycle (Ban/Ticket/Warning/Vehicle Towed), auto-lift dates for bans |
| Six rigid log types (General, Incident, Fire, Noise, Inspection, Bulletin) | `docs/logs.md` | Fire log has specialized checklists (elevator verification, FD arrival times, device resets). Noise log has structured investigation fields. Pre-filled "Full Report to Follow..." pattern. Rich text editors for long-form reports. |
| Unified security console with 7 entry types on one page | `docs/platform-3/deep-dive-security-concierge.md` | Single-page design with dialog overlays for all creation and detail views. 20 filter options in one dropdown with sub-filter hierarchy. Courier icon grid for packages. Shift info banner showing live counts. Emergency services tracking table on incidents. Pass-on log with team member notification. Per-type sequential reference numbers. |
| Configurable event type system with card-based grid | `docs/platform-2/event-log.md` | Unified event model with configurable types, groups, icons, and colors. Card-based grid display with adjustable width and grouping modes. Batch event creation (4-row form). Multi-channel notifications (email, SMS, voice). Label printing integration. Public display (lobby screen) integration. |

### Key Improvements Over Researched Platforms

1. **Extensible event types** instead of hardcoded log categories -- properties add new types without code changes
2. **Real-time updates via WebSocket** instead of manual refresh -- all staff see new entries instantly
3. **Batch sign-out** for end-of-shift visitor processing
4. **Structured package descriptions** via dropdown instead of free text
5. **Storage location visible on the main grid** instead of buried in detail dialogs
6. **Column sorting** on the events table (all researched platforms lacked this)
7. **Date-range quick filters** ("Today", "This Shift", "Last 24 Hours") always visible instead of hidden behind a toggle
8. **Intermediate incident statuses** (Draft, Open, In Progress, Under Review, Escalated, Closed) instead of just Open/Closed
9. **Multi-file attachment** on pass-on logs instead of single file
10. **Resident notification on visitor arrival** integrated into the visitor creation flow

---

## 3. Feature Specification

### 3.1 v1 Features (Launch)

#### 3.1.1 Unified Event Grid

The main console view displaying all security events in reverse chronological order. Events render as **color-coded cards** in a responsive grid (not table rows) for rapid visual scanning.

##### Event Card Fields

Each card displays:

| Field | Source | Display |
|-------|--------|---------|
| Event type icon + color accent | `EventType.icon`, `EventType.color` | Left border (3px) colored by event type |
| Reference number | `Event.reference_number` | Monospace font, Caption size (e.g., `VST-2026-00903`) |
| Summary text | Computed from event data (see patterns below) | Body text, truncated to 2 lines |
| Unit number | `Event.unit_id` → `Unit.number` | Monospace, Caption size. Blank if no unit association |
| Timestamp | `Event.created_at` | Relative time ("5 min ago") if < 24h, date otherwise. Caption size, `--text-secondary` |
| Status badge | `Event.status` | Status badge component per Design System section 7.6 |
| Action button | Context-specific | "Sign Out", "Release", "Check In Key" -- or blank |
| Created by | `Event.created_by` → `User.display_name` | Caption size, `--text-secondary` |

##### Summary Text Patterns

| Event Type Group | Pattern | Example |
|-----------------|---------|---------|
| Visitor (signed in) | "{visitor_name} signed in to visit {unit}" | "Maria Garcia signed in to visit Unit 1205" |
| Visitor (signed out) | "{visitor_name} signed out from {unit}" | "Maria Garcia signed out from Unit 1205" |
| Package (received) | "{description} from {courier} for {resident_name} ({unit}) -- stored at {location}" | "Package from Amazon for J. Smith (1205) -- stored at Mailroom B" |
| Package (released) | "Package picked up by {released_to}" | "Package picked up by John Smith" |
| Security Shift | "{guard_name} shift log for {date}" | "M. Johnson shift log for Mar 14, 2026" |
| Incident Report | "{title}" | "Suspicious person reported near loading dock" |
| Authorized Entry | "{person_name} authorized to enter {unit}" | "ABC Plumbing authorized to enter Unit 807" |
| Key Checkout | "{key_name} checked out to {person_name}" | "Trade Key #1 checked out to Mike Chen" |
| Key Return | "{key_name} returned by {person_name}" | "Trade Key #1 returned by Mike Chen" |
| Pass-On Log | "{subject}" | "Elevator #2 out of service until Monday" |
| Parking Violation | "{violation_type} issued for plate {plate_number}" | "Warning issued for plate ABCD 123" |

##### Grid Layout

- **Desktop (>=1280px)**: 2-column card grid, cards 50% width
- **Tablet (768-1279px)**: Single-column card list, full width
- **Mobile (<768px)**: Single-column card list, compact layout (icon + summary + time only)
- Cards have `--bg-primary` background, `--border-subtle` bottom border, `--space-4` padding
- Hover state: `--bg-secondary` background, 150ms ease transition
- Click anywhere on the card opens the detail dialog

##### Pagination

| Field | Spec |
|-------|------|
| Default page size | 25 events |
| Page size options | 10, 25, 50, 100 |
| Pagination style | "Showing 1-25 of 1,247 events" with Previous/Next buttons and page number input |
| Infinite scroll option | Available on mobile. Loads next 25 on scroll to bottom. Loading skeleton shown during fetch. |

#### 3.1.2 Filter Bar

Always visible above the event grid.

##### Primary Filters (Always Visible)

| # | Field | Label | Type | Default | Behavior |
|---|-------|-------|------|---------|----------|
| 1 | `search` | "Search events..." | Text input | Empty | Free-text search across summary text, reference numbers, unit numbers, names. Minimum 3 characters. Debounced 300ms. |
| 2 | `filter_type` | "Filter by type" | Select dropdown | "All Types" | 20+ filter options with sub-filter hierarchy (see table below) |
| 3 | `quick_date` | (button group) | Segmented control | "Today" | Preset date ranges: "Today", "This Shift", "Last 24h", "Last 7 Days", "Custom" |
| 4 | `search_btn` | "Search" | Button (primary) | -- | Executes search. On click: applies all filters, shows loading skeleton, renders results. On error: toast "Search failed. Please try again." Loading state: button text changes to "Searching..." with spinner icon. |
| 5 | `reset_btn` | "Reset" | Button (ghost) | -- | Clears all filters, resets to defaults. On click: all filter fields reset, grid reloads with default "Today" view. |

##### Filter Dropdown Options (22 options)

| # | Value | Label | Description |
|---|-------|-------|-------------|
| 1 | `all` | All Types | Default. Shows all event types. |
| 2 | `visitor-all` | All Visitors | All visitor entries |
| 3 | `visitor-signed-in` | -- Visitors Still Signed In | Currently signed in (sub-filter, indented with dash) |
| 4 | `visitor-signed-out` | -- Visitors Signed Out | Already departed |
| 5 | `visitor-expected` | -- Expected Visitors | Pre-authorized but not yet arrived |
| 6 | `package-all` | All Packages | All package entries |
| 7 | `package-outstanding` | -- Outstanding Packages | Not yet released/picked up |
| 8 | `package-released` | -- Released Packages | Already picked up |
| 9 | `security-shift` | Security Shifts / Logs | All security shift entries |
| 10 | `incident-all` | All Incident Reports | All incident reports |
| 11 | `incident-open` | -- Open Incidents | Status: Open or In Progress |
| 12 | `incident-closed` | -- Closed Incidents | Status: Closed |
| 13 | `incident-draft` | -- Draft Incidents | Status: Draft (not yet submitted) |
| 14 | `incident-escalated` | -- Escalated Incidents | Status: Escalated |
| 15 | `authorized-entry` | Authorized Entries | All authorized unit entry logs |
| 16 | `key-all` | All Key Activity | All key checkouts and returns |
| 17 | `key-checked-out` | -- Keys Checked Out | Keys currently out |
| 18 | `key-checked-in` | -- Keys Returned | Completed key checkouts |
| 19 | `pass-on-log` | Pass-On Logs | Shift handoff notes |
| 20 | `parking-violation` | Parking Violations | All parking violations |
| 21 | `security-patrol` | Security Patrols | Patrol round entries (v2) |
| 22 | `valet-parking` | Valet Parking | Valet parking entries (v2) |

**Tooltip for filter dropdown**: "Filter events by type. Sub-filters (shown with dashes) narrow results within a category."

##### Advanced Search Panel

Toggled by clicking "Advanced Search" link below the filter bar. Collapsible panel.

| # | Field | Label | Type | Default | Validation | Error Message |
|---|-------|-------|------|---------|-----------|---------------|
| 1 | `adv_start_date` | "Start Date" | Datetime picker | Empty | Must be a valid date. Must be before End Date if End Date is set. Cannot be in the future. | "Start date must be before end date." / "Start date cannot be in the future." |
| 2 | `adv_end_date` | "End Date" | Datetime picker | Empty | Must be a valid date. Must be after Start Date if Start Date is set. | "End date must be after start date." |
| 3 | `adv_match_type` | "Search Accuracy" | Radio group | "Broad Match" | N/A | N/A |
| 4 | `adv_building` | "Building" | Select dropdown | "All Buildings" | N/A | N/A |
| 5 | `adv_unit` | "Unit" | Autocomplete text | Empty | Must match an existing unit number if provided. | "No unit found matching '{input}'." |
| 6 | `adv_created_by` | "Created By" | Select dropdown | "All Staff" | N/A | N/A |
| 7 | `adv_include_deleted` | "Include Deleted" | Toggle switch | Off | N/A | N/A |

**Tooltip for "Search Accuracy"**: "Exact Match finds events containing your exact search phrase. Broad Match finds events containing any of your search words."

**Tooltip for "Include Deleted"**: "Show soft-deleted events in results. Deleted events appear with a strikethrough style and cannot be edited."

#### 3.1.3 Quick-Create Icons

A row of circular icon buttons displayed above the event grid, below the filter bar.

**Section label**: "Create new entry:" (Overline text, `--text-secondary`)

| # | Icon (Lucide) | Label | Tooltip | Click Action | Success State | Error State | Loading State |
|---|--------------|-------|---------|-------------|---------------|-------------|---------------|
| 1 | `user-plus` | "Visitor" | "Log a visitor with optional parking" | Opens Visitor Parking dialog (section 3.1.4) | Dialog opens with empty form, focus on Unit field | Toast: "Failed to load form. Please try again." | Icon pulses, 200ms delay max |
| 2 | `package` | "Package" | "Log an incoming or outgoing package" | Opens Package Tracking dialog (section 3.1.5) | Dialog opens with Incoming tab active, reference number pre-populated | Toast: "Failed to load form. Please try again." | Icon pulses |
| 3 | `shield` | "Shift Log" | "Start a new security shift" | Opens Security Shift dialog (section 3.1.6) | Dialog opens with shift times pre-populated | Toast: "Failed to load form. Please try again." | Icon pulses |
| 4 | `file-warning` | "Incident" | "File an incident report" | Opens Incident Report dialog (section 3.1.7) | Dialog opens with current timestamp pre-filled | Toast: "Failed to load form. Please try again." | Icon pulses |
| 5 | `door-open` | "Entry" | "Log an authorized unit entry" | Opens Authorized Entry dialog (section 3.1.8) | Dialog opens with focus on Unit field | Toast: "Failed to load form. Please try again." | Icon pulses |
| 6 | `key` | "Key" | "Check out or return a key" | Opens Key Checkout dialog (section 3.1.9) | Dialog opens with key dropdown populated from inventory | Toast: "Failed to load form. Please try again." | Icon pulses |
| 7 | `message-square` | "Pass-On" | "Create a shift handoff note" | Opens Pass-On Log dialog (section 3.1.10) | Dialog opens with focus on Subject field | Toast: "Failed to load form. Please try again." | Icon pulses |

**Icon style**: 48px circular buttons. `--bg-secondary` background, `--text-primary` icon color. Hover: `--accent` background with white icon. Active/pressed: scale 0.98, 100ms ease. Label text below icon in Caption size.

**Responsive behavior**:
- Desktop: All 7 icons in a horizontal row
- Tablet: All 7 icons in a horizontal row (smaller, 40px)
- Mobile: Horizontal scrollable row with label text hidden (icon-only). Or accessed via the "+" floating action button which opens a bottom sheet with all 7 options listed vertically.

#### 3.1.4 Entry Type: Visitor Parking

**Dialog title**: "New Visitor"
**Dialog size**: 560px wide, auto-height
**Animation**: Scale 0.97 to 1.0 + fade, 250ms ease-out (per Design System section 9)

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `unit_number` | "Unit #" | Autocomplete text input | 20 chars | Yes | Empty | Must match an existing unit in the property. Autocomplete queries API on 2+ characters. | "Please select a valid unit number." | "Start typing a unit number to search." | "Search unit..." |
| 2 | `visitor_name` | "Visitor Name" | Text input | 100 chars | Yes | Empty | At least 2 characters. Letters, spaces, hyphens, apostrophes only. | "Visitor name is required (2-100 characters)." | -- | "Full name of visitor" |
| 3 | `visitor_type` | "Type" | Radio group | -- | Yes | "Visitor" | Must select one option. | "Please select visitor or contractor." | "Contractors are logged separately for compliance tracking." | -- |
| | | | Options: "Visitor", "Contractor" | | | | | | | |
| 4 | `needs_parking` | "Does the visitor need parking?" | Checkbox | -- | No | Unchecked | N/A | -- | "Check this to add vehicle details and print a parking pass." | -- |
| 5 | `notify_resident` | "Notify resident of arrival?" | Checkbox | -- | No | Checked | N/A | -- | "Sends an instant notification to the resident's preferred channel (push, SMS, or email)." | -- |
| 6 | `comments` | "Comments" | Textarea | 500 chars | No | Empty | N/A | -- | -- | "Optional notes about this visit..." |
| 7 | `photo` | "Photo" | File upload (image) | 4 MB | No | Empty | JPG, PNG, HEIC only. Max 4 MB. | "File must be JPG, PNG, or HEIC and under 4 MB." | "Upload a photo of the visitor's vehicle or ID for records." | -- |

##### Parking Details (shown when `needs_parking` is checked)

Expand with slide-down animation, 200ms ease-out.

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 8 | `vehicle_make_model` | "Vehicle Make / Model" | Text input | 100 chars | No | Empty | N/A | -- | -- | "e.g., Black Honda Civic" |
| 9 | `license_plate` | "License Plate #" | Text input | 15 chars | Yes (if parking checked) | Empty | 2-15 alphanumeric characters. Auto-uppercased. | "License plate is required for parking passes (2-15 characters)." | -- | "e.g., ABCD 123" |
| 10 | `plate_province` | "Province / State" | Select dropdown | -- | No | Property's default province | Valid province/state from list. | -- | -- | "Select..." |
| 11 | `parking_until` | "Parking Until" | Datetime picker | -- | Yes (if parking checked) | Current time + property's default visitor parking duration (e.g., 24 hours) | Must be in the future. Must not exceed property's max visitor parking duration. | "Parking end time must be in the future." / "Maximum visitor parking duration is {max_hours} hours." | "When the visitor's parking pass expires." | -- |

##### Action Buttons

| # | Button | Style | Position | Click Action | Success State | Error State | Loading State |
|---|--------|-------|----------|-------------|---------------|-------------|---------------|
| 1 | "Save" | Primary (accent) | Bottom-right | Validates all fields. Creates the visitor event. Sends notification if checked. Prints parking pass if parking checked and property has printing enabled. | Dialog closes. Toast: "Visitor {name} signed in." Event card appears at top of grid (WebSocket push). | Inline field errors shown. If server error: toast "Failed to save visitor. Please try again." | Button text: "Saving..." with spinner. Button disabled. |
| 2 | "Save & New" | Secondary (outlined) | Bottom-right, left of Save | Same as Save but dialog resets to empty form instead of closing. | Form clears. Toast: "Visitor {name} signed in." Focus returns to Unit field. | Same as Save. | Same as Save. |
| 3 | "Cancel" | Ghost | Bottom-left | Closes dialog without saving. If form has unsaved changes, shows confirmation: "Discard unsaved changes?" with "Discard" (red) and "Keep Editing" buttons. | Dialog closes with fade-out, 150ms ease-in. | -- | -- |

##### Visitor Detail View (opened by clicking a visitor card)

Shows all visitor information plus:
- **Sign Out Visitor** button (only if `departure` is null): Sets departure timestamp, logs "Visitor signed out" action
- **Print Parking Pass** button (only if parking details exist): Generates and prints parking pass
- **Edit Vehicle Details** button (only if parking details exist): Opens inline edit for vehicle fields
- **Add Comment** button: Appends a timestamped comment
- **History section**: Chronological audit log (Created, Notified, Signed Out, Comments Added)

#### 3.1.5 Entry Type: Package Tracking

**Dialog title**: "New Package"
**Dialog size**: 600px wide, auto-height

##### Tabs

| Tab | Default | Description |
|-----|---------|-------------|
| Incoming | Yes (active) | Log a package received at the front desk |
| Outgoing | No | Log a package being sent out by a resident |

##### Incoming Package Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `reference_number` | "Ref #" | Read-only text | -- | Auto | Auto-generated (e.g., "PKG-2026-07260") | N/A | -- | "This reference number is auto-generated and used to track this package." | -- |
| 2 | `recipient` | "Recipient" | Autocomplete text input | 100 chars | Yes | Empty | Must match an existing resident or unit occupant. Autocomplete on 2+ chars, shows "Name (Unit)" format. | "Please select a valid resident." | "Start typing a resident name or unit number." | "Search resident..." |
| 3 | `unit_number` | "Unit" | Autocomplete text input | 20 chars | Yes | Auto-populated from recipient selection | Must match an existing unit. | "Please select a valid unit number." | -- | "Auto-filled from recipient" |
| 4 | `courier` | "Courier" | Icon grid (single select) | -- | Yes | None selected | Must select one courier. | "Please select a courier." | "Select the delivery company. Choose 'Other' if not listed." | -- |
| 5 | `tracking_number` | "Tracking #" | Text input | 50 chars | No | Empty | Alphanumeric, hyphens, spaces allowed. | -- | "The carrier's tracking number, if visible on the package." | "e.g., 1Z999AA10123456784" |
| 6 | `description` | "Description" | Select dropdown | -- | Yes | "Package" | Must select one. | "Please select a package description." | -- | "Select..." |
| 7 | `perishable` | "Perishable" | Checkbox | -- | No | Unchecked | N/A | -- | "Mark if the package contains food, flowers, or other time-sensitive items. Triggers a priority notification." | -- |
| 8 | `storage_spot` | "Storage Location" | Select dropdown | -- | Yes | Property's default storage location (e.g., "Front Desk") | Must select one from configured locations. | "Please select a storage location." | "Where is this package physically stored?" | "Select location..." |
| 9 | `notify_resident` | "Notify Resident" | Checkbox | -- | No | Checked | N/A | -- | "Sends a notification to the resident that their package has arrived." | -- |
| 10 | `photo` | "Photo" | File upload (image) | 4 MB | No | Empty | JPG, PNG, HEIC. Max 4 MB. | "File must be JPG, PNG, or HEIC and under 4 MB." | "Photograph the package for documentation." | -- |

##### Courier Icon Grid (Configurable per Property)

Default couriers (property admin can add/remove/reorder):

| # | Courier | Icon | Color |
|---|---------|------|-------|
| 1 | Amazon | Amazon logo | `#FF9900` |
| 2 | FedEx | FedEx logo | `#4D148C` |
| 3 | UPS | UPS logo | `#351C15` |
| 4 | USPS / Canada Post | Postal logo | `#DA291C` |
| 5 | DHL | DHL logo | `#FFCC00` |
| 6 | Purolator | Purolator logo | `#CE1126` |
| 7 | Individual | `user` icon | `--text-secondary` |
| 8 | Other | `package` icon | `--text-secondary` |

**Selection behavior**: Click to select (2px `--accent` border). Only one selected at a time. Previously selected deselects.

##### Package Description Dropdown Options

| # | Value | Label |
|---|-------|-------|
| 1 | `package` | Package |
| 2 | `envelope` | Envelope |
| 3 | `box-small` | Small Box |
| 4 | `box-large` | Large Box |
| 5 | `bag` | Bag |
| 6 | `tube` | Tube / Cylinder |
| 7 | `perishable` | Perishable / Food |
| 8 | `flowers` | Flowers |
| 9 | `furniture` | Furniture / Oversized |
| 10 | `dry-cleaning` | Dry Cleaning |
| 11 | `pharmacy` | Pharmacy |
| 12 | `other` | Other |

##### Batch Package Entry ("Log Multiple Packages")

Button below the form toggles a batch entry mode with 4 rows, each containing:
- Recipient (autocomplete)
- Courier (dropdown, compact -- no icon grid in batch mode)
- Description (dropdown)
- Storage Location (dropdown)
- Notify (checkbox)
- Print Label (checkbox)

**Tooltip for "Log Multiple Packages"**: "Enter up to 4 packages at once. Useful when multiple deliveries arrive together."

##### Action Buttons

| # | Button | Style | Click Action | Success State | Error State | Loading State |
|---|--------|-------|-------------|---------------|-------------|---------------|
| 1 | "Save" | Primary | Validates and creates the package event. Prints label if property setting enabled. Sends notification if checked. | Dialog closes. Toast: "Package logged for {resident_name} ({unit})." | Inline errors + toast on server failure. | "Saving..." with spinner. |
| 2 | "Save & New" | Secondary | Same as Save, form resets. | Form clears. Ref # increments. Toast shown. Focus on Recipient. | Same as Save. | Same. |
| 3 | "Cancel" | Ghost | Closes with unsaved changes check. | Dialog closes. | -- | -- |

##### Package Detail View

Shows full package info plus:
- **Release Package** button (outstanding only): Expands inline release form with fields:
  - `released_to` (text, 100 chars, required): "Who is picking up?"
  - `release_comments` (textarea, 500 chars, optional): "Notes about the release"
  - `release_signature` (signature pad, optional): Digital signature capture
  - `release_photo` (file upload, optional): Photo of person picking up
  - "Release" button (primary): Marks package as released, logs timestamp and staff member
  - "Cancel" button (ghost): Hides release form
- **Send Email Reminder** button (outstanding only): Sends reminder to resident
- **Log Call** button (outstanding only): Logs that staff called resident about the package
- **Print Label** button: Reprints the package label
- **History section**: Package Received, Notification Sent, Reminder Sent, Package Released

#### 3.1.6 Entry Type: Security Shift / Log

**Dialog title**: "New Security Shift"
**Dialog size**: 560px wide, auto-height

##### Info Banner

Light blue info box at the top of the dialog showing live operational context:

| # | Content | Source | Example |
|---|---------|--------|---------|
| 1 | Active bookings | Amenity reservations for today | "You have 3 booking(s) for today." |
| 2 | Keys checked out | Key checkouts with status = checked_out | "2 key(s) are checked out." |
| 3 | Active visitors | Visitors with departure = null | "5 visitor(s) currently signed in." |
| 4 | Outstanding packages | Packages with released = null | "12 package(s) awaiting pickup." |

**Tooltip for banner**: "A summary of what is happening right now in the building. Review this at the start of your shift."

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `start_time` | "Shift Start" | Datetime picker | -- | Yes | Current time (rounded to nearest hour) | Must be a valid datetime. Cannot be more than 24 hours in the past. | "Shift start time is required." | -- | -- |
| 2 | `end_time` | "Shift End" | Datetime picker | -- | Yes | Start time + property's default shift duration (e.g., 8 hours) | Must be after start time. Shift duration cannot exceed 16 hours. | "Shift end must be after start time." / "Maximum shift duration is 16 hours." | -- | -- |
| 3 | `relieved` | "Relieved" | Select dropdown | -- | Yes | "Select..." | Must select a guard or "N/A - First shift of the day". | "Please select who you are relieving." | "The security guard whose shift you are taking over." | "Select guard..." |
| 4 | `to_be_relieved_by` | "To Be Relieved By" | Select dropdown | -- | Yes | "Select..." | Must select a guard or "N/A - Last shift of the day". | "Please select who will relieve you." | "The security guard who will take over after your shift." | "Select guard..." |
| 5 | `equipment_received` | "Equipment Received" | Text input | 500 chars | No | Empty | N/A | -- | "List all equipment received at the start of your shift (e.g., radio, keys, flashlight)." | "e.g., Radio #3, master key set, flashlight" |
| 6 | `shift_notes` | "Initial Notes" | Rich text editor | 4000 chars | No | Empty | N/A | -- | "Record any observations or notes at the start of your shift." | "Type shift notes here..." |

**Guard dropdown options**: Populated dynamically from all users with Security Guard or Security Supervisor roles at the current property. Plus two special options:
- "N/A - First shift of the day" (for `relieved`)
- "N/A - Last shift of the day" (for `to_be_relieved_by`)

##### Action Buttons

| # | Button | Style | Click Action | Success | Error | Loading |
|---|--------|-------|-------------|---------|-------|---------|
| 1 | "Start Shift" | Primary | Validates. Creates shift event. Makes this shift the "active shift" for the user. | Dialog closes. Toast: "Shift started. Stay safe." Shift log panel becomes accessible. | Inline errors. Server error toast. | "Starting..." spinner. |
| 2 | "Cancel" | Ghost | Close with unsaved check. | Dialog closes. | -- | -- |

##### Shift Detail View

When clicking a shift card, shows the full shift form plus:
- **Add Log Entry** button: Adds a timestamped note to the shift (subject + details rich text editor)
- **End Shift** button: Triggers shift summary (see AI section) and closes the shift
- **Print Shift Report** button: Exports shift as PDF with all log entries
- **Log entries list**: All entries added during the shift, chronological, with timestamps and author

#### 3.1.7 Entry Type: Incident Report

**Dialog title**: "New Incident Report"
**Dialog size**: 640px wide, auto-height

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `unit_number` | "Related Unit" | Autocomplete text | 20 chars | No | Empty | Must match existing unit if provided. | "No unit found matching '{input}'." | "The unit involved in this incident, if applicable." | "Search unit (optional)..." |
| 2 | `incident_type` | "Incident Type" | Select dropdown | -- | Yes | First option | Must select one. | "Please select an incident type." | "The category that best describes this incident." | "Select type..." |
| 3 | `title` | "Title" | Text input | 200 chars | Yes | Empty | 5-200 characters. | "Title is required (5-200 characters)." | -- | "Brief description of what happened" |
| 4 | `description` | "What Happened?" | Rich text editor | 4000 chars | Yes | Empty | At least 20 characters of text content. | "Please provide a description (at least 20 characters)." | "Describe what happened in detail. Include times, locations, and people involved." | "Describe the incident in detail..." |
| 5 | `time_occurred` | "Time Occurred" | Datetime picker | -- | Yes | Current date/time | Must be a valid datetime. Cannot be in the future. Cannot be more than 72 hours in the past. | "Time occurred cannot be in the future." / "Incidents older than 72 hours should be reported through management." | "When the incident actually happened (may differ from when you are filing this report)." | -- |
| 6 | `urgency` | "Urgency" | Toggle switch | -- | Yes | "Not Urgent" | N/A | -- | "Mark as Urgent to immediately notify the Security Supervisor and Property Manager." | -- |
| 7 | `reported_by` | "Reported By" | Text input | 100 chars | No | Empty | N/A | -- | "The person who reported this incident to you, if different from yourself." | "Name of person who reported this" |
| 8 | `suspect` | "Suspect Description" | Text input | 200 chars | No | Empty | N/A | -- | "Physical description or name of the suspect, if known." | "Description of suspect (optional)" |
| 9 | `photos` | "Photos" | Multi-file upload | 4 MB each, 10 max | No | Empty | JPG, PNG, HEIC. Max 4 MB per file, max 10 files. | "Each file must be JPG, PNG, or HEIC and under 4 MB. Maximum 10 files." | "Upload photos documenting the incident (damage, evidence, etc.)." | -- |
| 10 | `documents` | "Documents" | Multi-file upload | 10 MB each, 5 max | No | Empty | PDF, DOC, DOCX, XLS, XLSX. Max 10 MB per file, max 5 files. | "Each file must be PDF, DOC, DOCX, XLS, or XLSX and under 10 MB." | "Attach supporting documents (police reports, witness statements, etc.)." | -- |

##### Incident Type Dropdown Options (Configurable per Property)

Default types:

| # | Value | Label |
|---|-------|-------|
| 1 | `alarm-system` | Alarm System Occurrence |
| 2 | `doors-blocked` | Doors or Aisleways Blocked |
| 3 | `doors-insecure` | Doors or Windows Insecure |
| 4 | `fire-hazard` | Fire Hazard |
| 5 | `fire` | Fire |
| 6 | `rule-infraction` | Infraction of Rules |
| 7 | `noise-confirmed` | Noise Complaint - Confirmed |
| 8 | `noise-unconfirmed` | Noise Complaint - Unconfirmed |
| 9 | `parking-occurrence` | Parking Lot Occurrence |
| 10 | `rounds-missed` | Rounds Missed |
| 11 | `rubbish` | Rubbish Accumulation |
| 12 | `safety-hazard` | Safety Hazard |
| 13 | `theft` | Theft Occurrence |
| 14 | `trespasser` | Trespasser |
| 15 | `lost-found` | Lost / Found Property |
| 16 | `water-damage` | Water / Plumbing Issue |
| 17 | `elevator-issue` | Elevator Malfunction |
| 18 | `medical` | Medical Emergency |
| 19 | `vandalism` | Vandalism |
| 20 | `other` | Other |

##### Emergency Services Section

Displayed below the main form fields. A 5-row table for tracking emergency service contacts:

| Row | Service | Fields (all optional) |
|-----|---------|----------------------|
| 1 | Police | Called (Yes/No toggle), Time Called (datetime), Arrival Time (datetime), Attending Officer Name (text, 100 chars) |
| 2 | Fire Department | Called (Yes/No toggle), Time Called (datetime), Arrival Time (datetime), Attending Officer Name (text, 100 chars) |
| 3 | Ambulance | Called (Yes/No toggle), Time Called (datetime), Arrival Time (datetime), Attending Paramedic Name (text, 100 chars) |
| 4 | Property Contact | Called (Yes/No toggle), Time Called (datetime), Response Time (datetime), Contact Name (text, 100 chars) |
| 5 | Patrol Supervisor | Called (Yes/No toggle), Time Called (datetime), Arrival Time (datetime), Supervisor Name (text, 100 chars) |

**Tooltip for Emergency Services section**: "Track which emergency services were contacted and their response times. This information is critical for post-incident review and legal documentation."

##### Action Buttons

| # | Button | Style | Click Action | Success | Error | Loading |
|---|--------|-------|-------------|---------|-------|---------|
| 1 | "Submit Report" | Primary | Validates all required fields. Creates incident with status "Open". Sends notifications based on urgency. | Dialog closes. Toast: "Incident report #{ref} submitted." If urgent, additional toast: "Supervisor and management have been notified." | Inline field errors. Server error toast. | "Submitting..." spinner. |
| 2 | "Save as Draft" | Secondary | Saves with status "Draft". No notifications sent. | Dialog closes. Toast: "Draft saved. You can resume editing later." | Server error toast. | "Saving..." spinner. |
| 3 | "Cancel" | Ghost | Close with unsaved check. | Dialog closes. | -- | -- |

##### Incident Detail View

Shows full report plus:
- **Update section**: Add details (textarea), attach files, change status dropdown:
  - Draft, Open, In Progress, Under Review, Escalated, Closed
- **Emergency Services table**: Editable inline
- **Attachments table**: Date, type, filename (downloadable), delete button
- **Updates log**: Chronological list of all updates with timestamp, author, status at time of update
- **Print** button: Generates formatted PDF incident report
- **Escalate** button: Changes status to Escalated, notifies supervisor and property manager

##### Incident Statuses and Transitions

```
Draft ──→ Open ──→ In Progress ──→ Under Review ──→ Closed
                       │                               ↑
                       └──→ Escalated ─────────────────┘
```

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| Draft | Saved but not submitted. Not visible to supervisors. | Security Guard, Concierge |
| Open | Submitted, awaiting action. | Security Guard, Concierge (on submit) |
| In Progress | Actively being investigated or addressed. | Security Guard, Supervisor, Property Manager |
| Under Review | Investigation complete, awaiting supervisor sign-off. | Supervisor, Property Manager |
| Escalated | Requires management attention. Triggers notification to Property Manager. | Supervisor, Property Manager |
| Closed | Resolved. Immutable after 24 hours. | Supervisor, Property Manager |

#### 3.1.8 Entry Type: Authorized Entry

**Dialog title**: "New Authorized Entry"
**Dialog size**: 520px wide, auto-height

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `unit_number` | "Unit #" | Autocomplete text | 20 chars | Yes | Empty | Must match existing unit. | "Please select a valid unit number." | -- | "Search unit..." |
| 2 | `authorized_person` | "Authorized Person" | Text input | 100 chars | Yes | Empty | 2-100 characters. | "Name is required (2-100 characters)." | "The name of the person authorized to enter the unit." | "Full name of person entering" |
| 3 | `company` | "Company" | Text input | 100 chars | No | Empty | N/A | -- | "The company the person represents, if applicable." | "e.g., ABC Plumbing" |
| 4 | `reason` | "Reason for Entry" | Textarea | 500 chars | Yes | Empty | At least 5 characters. | "Reason is required (at least 5 characters)." | -- | "e.g., Water heater repair, carpet cleaning" |
| 5 | `entry_time` | "Entry Time" | Datetime picker | -- | Yes | Current date/time | Cannot be more than 1 hour in the future. | "Entry time cannot be more than 1 hour in the future." | "When the person entered or will enter the unit." | -- |
| 6 | `expected_duration` | "Expected Duration" | Select dropdown | -- | No | "1 hour" | N/A | -- | "How long the person is expected to be in the unit." | "Select..." |
| 7 | `id_verified` | "ID Verified" | Checkbox | -- | No | Unchecked | N/A | -- | "Check if you verified the person's identification before granting entry." | -- |
| 8 | `comments` | "Comments" | Textarea | 500 chars | No | Empty | N/A | -- | -- | "Additional notes..." |

**Expected Duration options**: 30 minutes, 1 hour, 2 hours, 4 hours, Full day, Unknown.

##### Action Buttons

| # | Button | Style | Click Action | Success | Error | Loading |
|---|--------|-------|-------------|---------|-------|---------|
| 1 | "Save" | Primary | Validates. Creates authorized entry event. | Dialog closes. Toast: "Entry logged for Unit {unit}." | Inline errors + server toast. | "Saving..." spinner. |
| 2 | "Cancel" | Ghost | Close with unsaved check. | Dialog closes. | -- | -- |

#### 3.1.9 Entry Type: Key Checkout

**Dialog title**: "Key Checkout"
**Dialog size**: 560px wide, auto-height

##### Read-Only Header

| Field | Value | Source |
|-------|-------|--------|
| Logged By | Current user's display name | Session |
| Logged On | Current date/time, formatted | System clock |

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `key_id` | "Key" | Select dropdown (searchable) | -- | Yes | "Select..." | Must select a key from inventory. Key must have status "Available". | "Please select an available key." | "Select the key being checked out. Only available keys are shown." | "Search key..." |
| 2 | `checked_out_to` | "Checked Out To" | Text input | 100 chars | Yes | Empty | 2-100 characters. | "Name is required (2-100 characters)." | -- | "Full name of person receiving key" |
| 3 | `company` | "Company" | Text input | 100 chars | No | Empty | N/A | -- | -- | "Company name (optional)" |
| 4 | `id_type` | "ID Type" | Select dropdown | -- | Yes | "Select..." | Must select one. | "ID type is required for key checkout." | "The type of identification the person presented." | "Select ID type..." |
| 5 | `id_number` | "ID Number" | Text input | 50 chars | Yes | Empty | 2-50 characters. | "ID number is required (2-50 characters)." | "The number on the identification document." | "e.g., DL-12345678" |
| 6 | `reason` | "Reason" | Textarea | 500 chars | Yes | Empty | At least 5 characters. | "Reason is required (at least 5 characters)." | -- | "Why is this key being checked out?" |
| 7 | `signature` | "Signature" | Signature pad (canvas) | -- | Yes (configurable per property) | Empty | Must contain a signature (canvas not blank). | "Signature is required." | "The person checking out the key must sign here." | -- |
| 8 | `id_photo_front` | "ID Photo (Front)" | File upload / camera capture | 4 MB | No | Empty | JPG, PNG, HEIC. Max 4 MB. | "File must be JPG, PNG, or HEIC and under 4 MB." | "Photograph the front of the person's ID." | -- |
| 9 | `id_photo_back` | "ID Photo (Back)" | File upload / camera capture | 4 MB | No | Empty | JPG, PNG, HEIC. Max 4 MB. | "File must be JPG, PNG, or HEIC and under 4 MB." | "Photograph the back of the person's ID." | -- |

**ID Type options**: Driver's License, Passport, Building ID, Government ID, Employee Badge, Other.

**Signature pad controls**:
- "Sign" button: Activates the canvas for drawing
- "Clear" button: Erases the signature
- "Done" button: Confirms the signature

**"View All Keys" link**: Opens a sub-dialog showing the complete key inventory table with columns: Key Name, Key Details, Assigned Owner, Status (Available/Checked Out), Actions (Select, Edit, Delete). Searchable.

**"+ New Key" button**: Next to the key dropdown. Opens inline form to add a new key to inventory (Key Name, Key Number, Building -- see Key Inventory section 3.1.12).

##### Action Buttons

| # | Button | Style | Click Action | Success | Error | Loading |
|---|--------|-------|-------------|---------|-------|---------|
| 1 | "Check Out Key" | Primary | Validates. Creates key checkout event. Changes key status to "Checked Out". | Dialog closes. Toast: "{key_name} checked out to {person_name}." | Inline errors + server toast. | "Processing..." spinner. |
| 2 | "Cancel" | Ghost | Close with unsaved check. | Dialog closes. | -- | -- |

##### Key Return Flow

When clicking "Check In" on a key checkout card in the grid:
1. Confirmation dialog: "Return {key_name} checked out to {person_name}?"
2. Optional return comments field (textarea, 500 chars)
3. "Return Key" button (primary): Sets key status back to "Available", logs return timestamp
4. "Cancel" button
5. Success toast: "{key_name} returned."

#### 3.1.10 Entry Type: Pass-On Log

**Dialog title**: "New Pass-On Log"
**Dialog size**: 600px wide, auto-height

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `subject` | "Subject" | Text input | 200 chars | Yes | Empty | 3-200 characters. | "Subject is required (3-200 characters)." | -- | "Brief description of what the next shift needs to know" |
| 2 | `details` | "Details" | Rich text editor (CKEditor-style) | 4000 chars | Yes | Empty | At least 10 characters of text content. | "Details are required (at least 10 characters)." | "Provide full details. Use formatting for clarity." | "Write the details here..." |
| 3 | `priority` | "Priority" | Select dropdown | -- | No | "Normal" | Must select one. | -- | "How urgent is this information for the next shift?" | -- |
| 4 | `attachments` | "Attachments" | Multi-file upload | 10 MB each, 5 max | No | Empty | JPG, PNG, HEIC, PDF, DOC, DOCX. Max 10 MB per file, max 5 files. | "Each file must be under 10 MB. Allowed types: JPG, PNG, HEIC, PDF, DOC, DOCX. Maximum 5 files." | "Attach photos, documents, or other files relevant to this note." | -- |
| 5 | `send_to` | "Notify Team Members" | Checkbox list | -- | No | All unchecked | N/A | -- | "Select specific team members to notify about this note, or use 'Send to all' to notify the entire team." | -- |

**Priority options**: Low, Normal, High, Critical.

**"Send to all team members" checkbox**: Master checkbox that selects/deselects all individual team members. Individual team members listed below, populated from all users with security/concierge roles at the property.

**Rich text editor toolbar**: Undo, Redo, Bold, Italic, Underline, Strikethrough, Remove Format, Bulleted List, Numbered List, Text Alignment, Font Size, Link, Insert Image.

##### Action Buttons

| # | Button | Style | Click Action | Success | Error | Loading |
|---|--------|-------|-------------|---------|-------|---------|
| 1 | "Save" | Primary | Validates. Creates pass-on log event. Sends notifications to selected team members. | Dialog closes. Toast: "Pass-on log saved." | Inline errors + server toast. | "Saving..." spinner. |
| 2 | "Cancel" | Ghost | Close with unsaved check. | Dialog closes. | -- | -- |

#### 3.1.11 Parking Violation Lifecycle

**Dialog title**: "New Parking Violation"
**Access**: Accessed via sidebar navigation (Security Console > Parking Violations) or through a dedicated quick-action on the Security Guard dashboard.

##### Form Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message | Tooltip | Placeholder |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|---------|-------------|
| 1 | `building` | "Building" | Select dropdown | -- | Yes | Property's default building | Must select one. | "Please select a building." | -- | "Select building..." |
| 2 | `license_plate` | "License Plate" | Text input | 15 chars | Yes | Empty | 2-15 alphanumeric characters. Auto-uppercased. | "License plate is required (2-15 characters)." | -- | "e.g., ABCD 123" |
| 3 | `plate_province` | "Province / State" | Select dropdown | -- | No | Property's default province | N/A | -- | -- | "Select..." |
| 4 | `violation_type` | "Violation Type" | Radio group | -- | Yes | None | Must select one. | "Please select a violation type." | -- | -- |
| 5 | `location` | "Location" | Text input | 100 chars | No | Empty | N/A | -- | "Where in the parking area the violation occurred." | "e.g., P1 Level, Visitor Spot #12" |
| 6 | `description` | "Description" | Textarea | 500 chars | No | Empty | N/A | -- | -- | "Additional details about the violation..." |
| 7 | `auto_lift_date` | "Automatically Lift On" | Date picker | -- | No | Empty | Must be in the future if provided. | "Auto-lift date must be in the future." | "The violation will be automatically resolved on this date. Leave empty for indefinite violations." | -- |
| 8 | `photos` | "Photos" | Multi-file upload | 4 MB each, 5 max | No | Empty | JPG, PNG, HEIC. Max 4 MB per file, max 5 files. | "Each file must be JPG, PNG, or HEIC and under 4 MB." | "Photograph the vehicle and the violation for documentation." | -- |

**Violation Type options**:
| # | Value | Label | Description |
|---|-------|-------|-------------|
| 1 | `warning` | Warning | First-time or minor offense. Documented but no further action. |
| 2 | `ticket` | Ticket | Formal citation issued. May result in fine. |
| 3 | `ban` | Ban | Vehicle banned from the property. |
| 4 | `tow` | Vehicle Towed | Vehicle has been or will be towed. |

**Notice banner** (yellow, above form): "This form documents parking violations for individual vehicles by license plate."

##### Violation Lifecycle (State Machine)

```
Created ──→ Active ──→ Resolved
               │           ↑
               └──→ Appealed ──→ Upheld ──→ Resolved
                        │
                        └──→ Overturned ──→ Resolved
```

| Status | Description |
|--------|-------------|
| Created | Just filed. Not yet reviewed. |
| Active | Confirmed and enforced. |
| Appealed | Vehicle owner has contested the violation. |
| Upheld | Appeal denied. Violation remains active. |
| Overturned | Appeal accepted. Violation voided. |
| Resolved | Violation expired, auto-lifted, or manually resolved. |

##### Action Buttons

| # | Button | Style | Click Action | Success | Error | Loading |
|---|--------|-------|-------------|---------|-------|---------|
| 1 | "Issue Violation" | Primary | Validates. Creates violation event. Generates reference number. | Dialog closes. Toast: "Violation #{ref} issued for {plate}." | Inline errors + server toast. | "Issuing..." spinner. |
| 2 | "Cancel" | Ghost | Close with unsaved check. | Dialog closes. | -- | -- |

#### 3.1.12 Key Inventory Management

Accessible from the Security Console sidebar sub-navigation or from within the Key Checkout dialog.

##### Key Inventory Table

| Column | Description | Sortable |
|--------|-------------|----------|
| Key # | System-assigned sequential number | Yes |
| Key Name | Descriptive name (e.g., "Trade Key #1", "Pool Room") | Yes |
| Building | Which building the key belongs to | Yes |
| Status | "Available" (green badge) or "Checked Out" (orange badge) | Yes |
| Checked Out To | Person name (if checked out) | No |
| Last Activity | Timestamp of last checkout/return | Yes |
| Actions | Edit, Delete, View History | -- |

##### Add Key Form

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|
| 1 | `building` | "Building" | Select dropdown | -- | Yes | Property default | Must select one. | "Please select a building." |
| 2 | `key_name` | "Key Name" | Text input | 100 chars | Yes | Empty | 2-100 characters. Unique within building. | "Key name is required and must be unique within this building." |
| 3 | `key_number` | "Key Number" | Text input | 20 chars | No | Auto-generated | Alphanumeric. | "Key number must be alphanumeric." |
| 4 | `key_type` | "Key Type" | Select dropdown | -- | No | "Physical Key" | N/A | -- |
| 5 | `description` | "Description" | Text input | 200 chars | No | Empty | N/A | -- |

**Key Type options**: Physical Key, FOB, Access Card, Garage Remote, Master Key, Other.

**Bulk Add**: Button opens a simplified form for adding multiple keys at once (name + building, 10 rows).

#### 3.1.13 FOB / Access Device Management

Each resident/unit can have up to:
- **6 FOB slots** (key fobs for building access)
- **2 Buzzer codes** (intercom/buzzer directory entries)
- **2 Garage clickers** (garage door remotes)

##### FOB Record Fields

| # | Field Name | Label | Type | Max Length | Required | Default | Validation | Error Message |
|---|-----------|-------|------|-----------|----------|---------|-----------|---------------|
| 1 | `fob_serial` | "Serial Number" | Text input | 30 chars | Yes | Empty | 4-30 alphanumeric characters. Unique within property. | "Serial number is required and must be unique." |
| 2 | `fob_type` | "Type" | Select dropdown | -- | Yes | "Standard FOB" | Must select one. | "Please select a FOB type." |
| 3 | `assigned_to` | "Assigned To" | Autocomplete (resident) | -- | Yes | Empty | Must match existing resident. | "Please select a valid resident." |
| 4 | `unit_number` | "Unit" | Auto-populated | -- | Yes | From resident | N/A | -- |
| 5 | `status` | "Status" | Select dropdown | -- | Yes | "Active" | N/A | -- |
| 6 | `issued_date` | "Issued Date" | Date picker | -- | Yes | Today | Cannot be in the future. | "Issue date cannot be in the future." |
| 7 | `deposit_paid` | "Deposit Paid" | Currency input | -- | No | $0.00 | Non-negative number. | "Deposit must be a non-negative amount." |
| 8 | `notes` | "Notes" | Text input | 200 chars | No | Empty | N/A | -- |

**FOB Type options**: Standard FOB, Proximity Card, Key Card, Wristband.
**Status options**: Active, Deactivated, Lost, Stolen, Returned.

#### 3.1.14 Emergency Procedures Quick Access

A persistent button in the console header labeled "Emergency" with a `--status-error` background. Visible to all security and concierge roles.

**Click action**: Opens a full-screen modal with:

1. **Emergency Contact Directory**: Property manager, superintendent, fire department, police (non-emergency), ambulance, building insurance, elevator company, plumber (emergency), electrician (emergency). Each entry: Name, Phone (click-to-call on mobile), Role/Service.

2. **Emergency Procedure Quick Cards** (expandable sections):
   - Fire Alarm Procedure (checklist format, mirrors the Fire Log fields)
   - Medical Emergency
   - Flood / Water Leak
   - Power Outage
   - Suspicious Person / Intruder
   - Elevator Entrapment
   - Gas Leak / Chemical Spill

Each procedure card contains a numbered step-by-step list, configurable by Property Admin under Settings.

3. **Quick-Create Incident** button: Pre-selects the relevant incident type and opens the incident report dialog.

**Tooltip for Emergency button**: "Access emergency contacts and step-by-step procedures for common emergency situations."

#### 3.1.15 Emergency Contacts Quick Access

A button in each unit's detail view and accessible from the console search results. Shows:
- Emergency contacts for the specific unit/resident
- Up to 3 contacts per resident: Name, Relationship, Phone (click-to-call), Email
- Prominent display, no more than 2 clicks from the main console

#### 3.1.16 Shift Log (Persistent Access)

The Shift Log is **always accessible** from a persistent tab/panel in the console, not buried in navigation. During an active shift, it appears as a collapsible panel on the right side of the console (desktop) or as a bottom sheet (mobile).

- Shows all log entries for the current active shift
- "Add Entry" button always visible at top of the panel
- Each entry: timestamp, subject, details (expandable), author
- "End Shift" button at the bottom triggers shift summary generation

#### 3.1.17 Batch Event Creation

A "Batch Entry" button in the console toolbar opens a multi-row form:

| Feature | Spec |
|---------|------|
| Max rows | 10 (configurable by property admin, max 20) |
| Per-row fields | Event Type (dropdown), Unit (autocomplete), Description/Comment (text), Print Label (checkbox), Send Notification (dropdown: No Notification / Primary Email / All Emails) |
| Submit action | "Save All" creates all events in a single transaction |
| Success state | Toast: "{n} events created." All new cards appear in the grid. |
| Error state | Rows with errors highlighted in red. Valid rows saved, error rows remain for correction. |
| Loading state | Progress bar showing "{n} of {total} saved..." |

**Tooltip for Batch Entry**: "Create multiple events at once. Useful when several packages or visitors arrive simultaneously."

#### 3.1.18 Batch Sign-Out

An action button visible when filter is set to "Visitors Still Signed In":
- "Sign Out All" button (secondary, with confirmation)
- Confirmation dialog: "Sign out {n} visitors? This will set the departure time to now for all currently signed-in visitors."
- Success toast: "{n} visitors signed out."

### 3.2 v2 Features

| Feature | Description |
|---------|-------------|
| **Security Patrol Module** | GPS-tracked patrol rounds with checkpoint verification, route mapping, missed checkpoint alerts |
| **Valet Parking Module** | Full valet workflow: vehicle intake with photos, key tag assignment, retrieval queue, vehicle damage documentation |
| **Custom Event Types** | Property Admin creates entirely new event types with custom field schemas through a visual builder |
| **Digital Signage Integration** | Push selected events to lobby display screens (packages ready for pickup, visitor welcome messages) |
| **Camera Feed Integration** | Embed live camera feeds from building security cameras directly in the console |
| **Fire Log Template** | Specialized fire log with checklist fields (elevator verification, fire department timeline, device reset checklist) inheriting from Incident Report |
| **Noise Log Template** | Structured noise investigation form with complaint type checkboxes, investigation assessment dropdowns, contact method tracking |
| **Visitor Pre-Authorization** | Residents pre-authorize expected visitors through the resident portal; visitors show as "Expected" in the console |
| **Signature Capture on Package Release** | Digital signature pad integrated into the package release flow |
| **License Plate OCR** | Camera-based license plate reading for automatic parking pass creation |

### 3.3 v3 Features

| Feature | Description |
|---------|-------------|
| **Know Your Residents** | Gamified training module where staff learn resident names, faces, and unit numbers |
| **Predictive Staffing** | AI-based staffing recommendations based on historical event volume, weather, and building events |
| **Automated Report Generation** | Scheduled security reports (daily, weekly, monthly) auto-generated and emailed to management |
| **Biometric Key Checkout** | Fingerprint or facial verification for high-security key checkouts |
| **IoT Sensor Integration** | Automatic event creation from building sensors (door propped open, water leak detected, temperature anomaly) |

---

## 4. Data Model

All Security Console data builds on the Unified Event Model defined in `docs/prd/01-architecture.md` (Section 3). Security-specific entry types are implemented as **EventType** configurations with specialized `custom_fields` schemas.

### 4.1 Core Entities (Security-Specific Extensions)

#### VisitorEntry (custom_fields schema for EventType "Visitor Check-In")

```
{
  visitor_name:        varchar(100), required
  visitor_type:        enum("visitor", "contractor"), required, default "visitor"
  needs_parking:       boolean, default false
  notify_resident:     boolean, default true
  comments:            text(500), optional
  departure_time:      timestamp, nullable (null = still signed in)
  signed_out_by:       UUID → User, nullable
  parking: {                              // present only if needs_parking = true
    vehicle_make_model:  varchar(100), optional
    license_plate:       varchar(15), required if parking
    plate_province:      varchar(50), optional
    parking_until:       timestamp, required if parking
    pass_printed:        boolean, default false
  }
}
```

**Relationships**: Event.unit_id → Unit, Event.resident_id → Resident (occupant being visited), Event.created_by → User (staff who logged the visitor).

#### PackageEntry (custom_fields schema for EventType "Package - *")

```
{
  package_type:        enum("incoming", "outgoing"), required, default "incoming"
  recipient_name:      varchar(100), required
  courier:             varchar(50), required (from courier configuration)
  courier_icon:        varchar(100), derived from courier config
  tracking_number:     varchar(50), optional
  description:         varchar(50), required (from description dropdown)
  perishable:          boolean, default false
  storage_spot:        varchar(100), required (from location configuration)
  notify_resident:     boolean, default true
  label_printed:       boolean, default false
  released_at:         timestamp, nullable (null = outstanding)
  released_to:         varchar(100), nullable
  released_by:         UUID → User, nullable
  release_comments:    text(500), nullable
  release_signature:   binary, nullable
  release_photo_url:   varchar(500), nullable
  reminders_sent:      integer, default 0
  last_reminder_at:    timestamp, nullable
}
```

#### IncidentReport (custom_fields schema for EventType "Incident Report")

```
{
  incident_type:       varchar(50), required (from incident type config)
  title:               varchar(200), required
  time_occurred:       timestamp, required
  urgency:             boolean, default false
  reported_by:         varchar(100), optional
  suspect_description: varchar(200), optional
  emergency_services: [
    {
      service:         enum("police", "fire", "ambulance", "property_contact", "patrol_supervisor")
      called:          boolean, default false
      time_called:     timestamp, nullable
      arrival_time:    timestamp, nullable
      attending_name:  varchar(100), nullable
    }
  ]
  updates: [
    {
      timestamp:       timestamp, auto-generated
      author_id:       UUID → User
      details:         text(2000)
      status_at_time:  enum("draft", "open", "in_progress", "under_review", "escalated", "closed")
      attachments:     [UUID → Attachment]
    }
  ]
}
```

#### SecurityShift (custom_fields schema for EventType "Security Shift")

```
{
  start_time:          timestamp, required
  end_time:            timestamp, required
  relieved_guard_id:   UUID → User, nullable (null = first shift)
  relieved_by_guard_id: UUID → User, nullable (null = last shift)
  equipment_received:  varchar(500), optional
  shift_notes:         text(4000), optional (rich text HTML)
  log_entries: [
    {
      entry_id:        UUID, auto-generated
      timestamp:       timestamp, auto-generated
      author_id:       UUID → User
      subject:         varchar(200), required
      details:         text(2000), optional (rich text HTML)
    }
  ]
  shift_summary:       text(2000), nullable (AI-generated or manual)
  shift_ended:         boolean, default false
}
```

#### AuthorizedEntry (custom_fields schema for EventType "Authorized Entry")

```
{
  authorized_person:   varchar(100), required
  company:             varchar(100), optional
  reason:              text(500), required
  entry_time:          timestamp, required
  expected_duration:   enum("30min", "1hr", "2hr", "4hr", "full_day", "unknown"), optional
  id_verified:         boolean, default false
  exit_time:           timestamp, nullable
  comments:            text(500), optional
}
```

#### KeyCheckout (custom_fields schema for EventType "Key Checkout")

```
{
  key_id:              UUID → Key, required
  checked_out_to:      varchar(100), required
  company:             varchar(100), optional
  id_type:             enum("drivers_license", "passport", "building_id", "government_id", "employee_badge", "other"), required
  id_number:           varchar(50), required
  reason:              text(500), required
  signature:           binary, required (configurable)
  id_photo_front_url:  varchar(500), nullable
  id_photo_back_url:   varchar(500), nullable
  checked_in_at:       timestamp, nullable (null = still checked out)
  checked_in_by:       UUID → User, nullable
  return_comments:     text(500), nullable
}
```

#### PassOnLog (custom_fields schema for EventType "Pass-On Log")

```
{
  subject:             varchar(200), required
  details:             text(4000), required (rich text HTML)
  priority:            enum("low", "normal", "high", "critical"), default "normal"
  send_to:             [UUID → User], optional (team members to notify)
  acknowledged_by:     [{ user_id: UUID, acknowledged_at: timestamp }]
}
```

#### ParkingViolation (custom_fields schema for EventType "Parking Violation")

```
{
  license_plate:       varchar(15), required
  plate_province:      varchar(50), optional
  violation_type:      enum("warning", "ticket", "ban", "tow"), required
  location:            varchar(100), optional
  description:         text(500), optional
  auto_lift_date:      date, nullable
  violation_status:    enum("created", "active", "appealed", "upheld", "overturned", "resolved"), default "created"
  appeal_details:      text(1000), nullable
  resolution_notes:    text(500), nullable
  resolved_at:         timestamp, nullable
  resolved_by:         UUID → User, nullable
}
```

### 4.2 Supporting Entities

#### Key (Inventory)

```
Key
├── id (UUID)
├── property_id → Property
├── building_id → Building
├── key_name (varchar 100, required, unique per building)
├── key_number (varchar 20, auto-generated if not provided)
├── key_type (enum: physical_key, fob, access_card, garage_remote, master_key, other)
├── description (varchar 200, optional)
├── status (enum: available, checked_out, lost, decommissioned)
├── current_checkout_event_id → Event (nullable, for cross-reference)
├── created_by → User
├── created_at, updated_at
└── checkout_history[] → Event (all key checkout events for this key)
```

#### FOB (Access Device)

```
FOB
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── resident_id → User
├── serial_number (varchar 30, required, unique per property)
├── fob_type (enum: standard_fob, proximity_card, key_card, wristband)
├── status (enum: active, deactivated, lost, stolen, returned)
├── issued_date (date, required)
├── deactivated_date (date, nullable)
├── deposit_paid (decimal, default 0.00)
├── notes (varchar 200, optional)
├── created_by → User
└── created_at, updated_at
```

#### BuzzerCode

```
BuzzerCode
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── code (varchar 10, required)
├── label (varchar 50, optional, e.g., "Main", "Secondary")
├── active (boolean, default true)
└── created_at, updated_at
```

#### GarageClicker

```
GarageClicker
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── resident_id → User
├── serial_number (varchar 30, required, unique per property)
├── status (enum: active, deactivated, lost, returned)
├── issued_date (date, required)
├── deposit_paid (decimal, default 0.00)
└── created_at, updated_at
```

### 4.3 Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| events | (property_id, created_at DESC) | B-tree | Default console grid query |
| events | (property_id, event_type_id, status) | B-tree | Filter by type and status |
| events | (property_id, unit_id) | B-tree | Unit-based event lookup |
| events | (reference_number) | Unique | Reference number search |
| events | (custom_fields->>'license_plate') | GIN | Plate number search across visitors and violations |
| events | (custom_fields->>'visitor_name') | GIN | Visitor name search |
| events | (custom_fields->>'tracking_number') | B-tree | Package tracking search |
| keys | (property_id, building_id, status) | B-tree | Available key lookup |
| fobs | (property_id, serial_number) | Unique | FOB serial lookup |
| fobs | (unit_id) | B-tree | Unit's FOB list |

---

## 5. User Flows and Workflows

### 5.1 Security Guard: Start-of-Shift Flow

```
1. Guard logs in → Dashboard shows Security Guard layout
2. Guard clicks "Shift Log" quick-create icon
3. Dialog opens with info banner (active bookings, keys out, visitors, packages)
4. Guard fills in: Start Time, End Time, Relieved guard, To Be Relieved By, Equipment
5. Guard clicks "Start Shift"
   → Shift event created
   → Shift Log panel becomes active
   → Toast: "Shift started. Stay safe."
6. Guard reviews pass-on logs from previous shift (highlighted if priority = High/Critical)
7. Guard acknowledges pass-on logs by clicking "Acknowledged" on each
```

### 5.2 Security Guard: Package Intake Flow

```
1. Courier delivers package(s) to front desk
2. Guard clicks "Package" quick-create icon
3. Dialog opens with "Incoming" tab, reference number pre-populated
4. Guard types recipient name → autocomplete suggests matching residents
5. Guard selects recipient → Unit auto-fills
6. Guard clicks courier icon (e.g., Amazon)
7. Guard enters tracking number (optional), selects description (e.g., "Package")
8. Guard selects storage location from dropdown
9. Guard clicks "Save"
   → Package event created
   → Notification sent to resident (if enabled)
   → Toast: "Package logged for J. Smith (1205)."
   → Card appears in grid via WebSocket

For multiple packages:
10. Guard clicks "Log Multiple Packages"
11. Batch form opens with 4 rows
12. Guard fills each row: recipient, courier, description, location
13. Guard clicks "Save All"
    → All packages created in one transaction
    → All residents notified
    → Toast: "4 packages logged."
```

### 5.3 Concierge: Package Release Flow

```
1. Resident arrives to pick up a package
2. Concierge searches by resident name or reference number in the filter bar
3. Concierge clicks the outstanding package card
4. Detail dialog opens showing package information
5. Concierge clicks "Release Package"
6. Inline release form expands:
   a. Enters resident's name in "Released To"
   b. Optionally captures signature (if property requires it)
   c. Optionally adds comments
7. Concierge clicks "Release"
   → Package status changes to "Released"
   → Released timestamp logged
   → Card in grid updates via WebSocket (status badge changes to green "Released")
   → Toast: "Package released to J. Smith."
```

### 5.4 Security Guard: Visitor Check-In/Out Flow

```
Check-In:
1. Visitor arrives at front desk
2. Guard clicks "Visitor" quick-create icon
3. Guard enters unit number (autocomplete)
4. Guard enters visitor name
5. Guard selects Visitor or Contractor
6. If visitor needs parking: checks parking checkbox, enters vehicle details
7. Guard clicks "Save"
   → Visitor event created with status "Signed In"
   → Resident notified (if enabled)
   → Parking pass prints (if parking selected and printing enabled)
   → Toast: "Visitor Maria Garcia signed in."

Check-Out:
8. When visitor leaves, guard finds visitor in grid (filter: "Visitors Still Signed In")
9. Guard clicks "Sign Out" action button on the visitor card
10. Confirmation: "Sign out Maria Garcia?"
11. Guard clicks "Confirm"
    → Departure time set to now
    → Card updates with "Signed Out" badge
    → Toast: "Visitor signed out."

End-of-Shift Batch Sign-Out:
12. Guard filters by "Visitors Still Signed In"
13. Guard clicks "Sign Out All"
14. Confirmation: "Sign out 3 visitors?"
15. Guard clicks "Confirm"
    → All visitors signed out with same timestamp
```

### 5.5 Incident Report Flow

```
1. Guard observes or receives report of an incident
2. Guard clicks "Incident" quick-create icon
3. Guard selects incident type from dropdown
4. Guard enters title and description
5. Guard sets time occurred (defaults to now)
6. If urgent: toggles urgency to "Urgent"
7. Guard uploads photos (optional)
8. Guard fills emergency services table if applicable
9. Guard clicks "Submit Report"
   → Incident created with status "Open"
   → If urgent: Supervisor and Property Manager notified immediately
   → Toast: "Incident report #INC-2026-01766 submitted."

Follow-up:
10. Supervisor opens incident from console
11. Supervisor reviews details, clicks "Add Update"
12. Enters additional details, changes status to "In Progress"
13. Clicks "Update"
    → Update logged with timestamp
    → Status badge changes on card

Resolution:
14. Supervisor changes status to "Closed"
15. Enters resolution notes
16. Clicks "Update"
    → Incident closed. Immutable after 24 hours.
```

### 5.6 Key Checkout/Return Flow

```
Checkout:
1. Contractor arrives, needs access key
2. Guard clicks "Key" quick-create icon
3. Guard selects key from dropdown (only "Available" keys shown)
4. Guard enters contractor name, company
5. Guard verifies ID: enters ID type, ID number
6. Guard enters reason
7. Contractor signs on signature pad
8. Guard optionally photographs ID (front/back)
9. Guard clicks "Check Out Key"
   → Key status changes to "Checked Out"
   → Event created
   → Toast: "Trade Key #1 checked out to Mike Chen."

Return:
10. Contractor returns, guard finds the checkout in grid (filter: "Keys Checked Out")
11. Guard clicks "Check In" action on the card
12. Confirmation: "Return Trade Key #1?"
13. Guard optionally adds return comments
14. Guard clicks "Return Key"
    → Key status changes to "Available"
    → Return timestamp logged
    → Toast: "Trade Key #1 returned."
```

### 5.7 End-of-Shift Flow

```
1. Guard clicks "End Shift" in the Shift Log panel
2. AI generates shift summary (if enabled) showing:
   - Total events logged during shift
   - Breakdown by type
   - Outstanding items (unsigned visitors, unreleased packages, keys out)
   - Any open incidents
3. Guard reviews summary, can edit before saving
4. Guard clicks "Close Shift"
   → Shift event closed
   → Summary saved to shift record
   → Toast: "Shift ended. Summary saved."
5. Guard creates pass-on log for next shift (if anything needs handoff)
```

### 5.8 Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Duplicate visitor** | Autocomplete warns "Maria Garcia last visited on Mar 12." Guard can proceed or view history. |
| **Package for unknown resident** | "No resident found" message. Guard can override with manual unit + name entry. Event flagged for admin review. |
| **Key already checked out** | Key does not appear in available keys dropdown. Guard sees "Currently checked out to {name}" if they search for it. |
| **Shift overlap** | Warning: "A shift is already active (Guard B, started at 3:00 PM). Do you want to end their shift and start yours?" |
| **Network disconnection** | Events queue locally. Banner: "Offline. Events will sync when reconnected." Queue visible in the shift log panel. On reconnect, queued events sync and timestamps are preserved. |
| **Concurrent edits** | WebSocket detects conflict. Dialog: "This event was updated by {other_user} at {time}. Reload to see changes?" |
| **Deleting an event** | Soft delete only. Confirmation: "Delete this event? It will be hidden from the console but preserved in audit logs." Only Supervisor/Property Manager/Admin can delete. |
| **Visitor with no unit** | Unit field can be left blank for building-wide visitors (e.g., postal worker, building inspector). Logs with unit = "Common Area". |

---

## 6. UI/UX Specification

### 6.1 Console Page Layout

```
Desktop (>=1280px):
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR   │  Security Console                    [Emergency] 🔔 👤    │
│  (240px)   │                                                           │
│            │  ┌─────────────────────────────────────────────────────┐  │
│            │  │ [Search events...]  [Filter ▾]  Today|Shift|24h|7d  │  │
│            │  │ Advanced Search ▾                          [Reset]  │  │
│            │  └─────────────────────────────────────────────────────┘  │
│            │                                                           │
│            │  Create new entry:                                        │
│            │  (👤) (📦) (🛡) (⚠) (🚪) (🔑) (💬)  [Batch Entry]     │
│            │                                                           │
│            │  ┌──────────────────────┐  ┌──────────────────────┐      │
│            │  │ VST-2026-00903       │  │ PKG-2026-07260       │      │
│            │  │ Maria Garcia signed  │  │ Package from Amazon  │      │
│            │  │ in to Unit 1205      │  │ for J. Smith (1205)  │      │
│            │  │ 5 min ago  [Sign Out]│  │ 12 min ago [Release] │      │
│            │  └──────────────────────┘  └──────────────────────┘      │
│            │  ┌──────────────────────┐  ┌──────────────────────┐      │
│            │  │ INC-2026-01766       │  │ KEY-2026-00045       │      │
│            │  │ Suspicious person    │  │ Trade Key #1 checked │      │
│            │  │ near loading dock    │  │ out to Mike Chen     │      │
│            │  │ 1 hr ago   ● Open   │  │ 2 hr ago  [Check In] │      │
│            │  └──────────────────────┘  └──────────────────────┘      │
│            │                                                           │
│            │  Showing 1-25 of 1,247  [< Prev]  [Next >]              │
└─────────────────────────────────────────────────────────────────────────┘

Mobile (<768px):
┌──────────────────────────┐
│ ☰ Security Console  [!]  │
│                           │
│ [Search...]  [Filter ▾]   │
│ Today | Shift | 24h       │
│                           │
│ ┌────────────────────────┐│
│ │ 👤 VST-2026-00903      ││
│ │ Maria Garcia → 1205    ││
│ │ 5m ago     [Sign Out]  ││
│ └────────────────────────┘│
│ ┌────────────────────────┐│
│ │ 📦 PKG-2026-07260      ││
│ │ Amazon → J. Smith 1205 ││
│ │ 12m ago    [Release]   ││
│ └────────────────────────┘│
│                           │
│     (+) Floating Action   │
│                           │
│ 🏠  📦   ➕   🔔   ☰    │
└──────────────────────────┘
```

### 6.2 Component Usage from Design System

| Component | Design System Reference | Usage in Security Console |
|-----------|------------------------|--------------------------|
| Status Badge | Section 7.6 | Event status (Open, Closed, Draft, etc.) |
| Segmented Control | Section 7 | Quick date filter ("Today", "This Shift", etc.) |
| Autocomplete Input | Section 7 | Unit search, resident search |
| Modal/Dialog | Section 9 (animation spec) | All creation and detail dialogs |
| Toast Notification | Section 15 | Success/error feedback |
| Signature Pad | Custom component | Key checkout signature capture |
| Icon Buttons | Section 12 (48px Display size) | Quick-create icons |
| Empty State | Section 13 | When no events match filters |
| Skeleton Loading | Section 9 (shimmer) | While events load |
| Card | Section 7 | Event cards in the grid |

### 6.3 Empty State

When no events match the current filter:
```
┌─────────────────────────────────────┐
│                                     │
│           🛡                        │
│                                     │
│    No events found                  │
│    Try adjusting your filters       │
│    or create a new entry above.     │
│                                     │
│         [ Reset Filters ]           │
│                                     │
└─────────────────────────────────────┘
```

### 6.4 Loading State

Skeleton screen matching the card grid layout: 4-6 card placeholders with shimmer animation (1.5s linear infinite per Design System section 9).

### 6.5 Error State

If the event grid fails to load:
```
┌─────────────────────────────────────┐
│                                     │
│           ⚠                         │
│                                     │
│    Unable to load events            │
│    Check your connection and        │
│    try again.                       │
│                                     │
│         [ Try Again ]               │
│                                     │
└─────────────────────────────────────┘
```

Plus toast: "Failed to load security events. Please try again." (red background, error icon, auto-dismiss 6s).

### 6.6 Dialog Animations

Per Design System section 9:
- **Open**: Scale 0.97 to 1.0 + fade in, 250ms ease-out. Backdrop fades to `rgba(0,0,0,0.4)`.
- **Close**: Fade out, 150ms ease-in.
- **Parking details expand**: Slide down, 200ms ease-out.
- **Unsaved changes confirmation**: Nested modal, same animation.

### 6.7 Real-Time Update Indicators

When a new event arrives via WebSocket:
1. New card slides in from top of grid (300ms spring animation)
2. Subtle blue pulse on the new card (fades after 2s)
3. If the user has scrolled away from the top, a "New events" pill appears at the top of the grid. Clicking it scrolls to top and shows new events.

---

## 7. AI Integration Points

All 12 AI capabilities for the Security Console are defined in `docs/prd/19-ai-framework.md` (Section 4.1). Below is how each integrates into the console UI.

### 7.1 Report Grammar and Tone Correction (AI #1)

| Aspect | Detail |
|--------|--------|
| **Where it appears** | Incident Report and Pass-On Log forms, on the rich text editor |
| **Trigger** | User clicks "Submit Report" or "Save" -- AI processes the text before submission |
| **UI element** | After processing, a subtle banner below the editor: "Text improved for clarity. [Review Changes] [Accept] [Use Original]" |
| **Review Changes view** | Side-by-side diff showing original vs. corrected text, changes highlighted in blue |
| **Graceful degradation** | If AI unavailable, report saves with original text. No blocking. |
| **Default model** | Claude Haiku ($0.001/call) |

### 7.2 Incident Category Auto-Suggestion (AI #2)

| Aspect | Detail |
|--------|--------|
| **Where** | Incident Report dialog, below the incident type dropdown |
| **Trigger** | Debounced 500ms after user stops typing in the "What Happened?" field (minimum 20 characters) |
| **UI** | Small pill below dropdown: "Suggested: Parking Lot Occurrence (87%)" -- clicking applies the suggestion |
| **Multiple suggestions** | Shows top 3 with confidence scores if top score < 80% |
| **Graceful degradation** | Dropdown works normally with manual selection. Suggestion pill hidden. |

### 7.3 Incident Severity Scoring (AI #3)

| Aspect | Detail |
|--------|--------|
| **Where** | Incident Report dialog, next to the urgency toggle |
| **Trigger** | On submit, before saving |
| **UI** | Banner: "Suggested severity: High -- This incident involves a safety hazard and should be escalated. [Apply] [Dismiss]" |
| **Graceful degradation** | Manual urgency toggle works without AI input. |

### 7.4 Pattern Detection (AI #4)

| Aspect | Detail |
|--------|--------|
| **Where** | Security Console dashboard (Supervisor/Property Manager view), "Insights" panel |
| **Trigger** | Daily at 2:00 AM, results cached |
| **UI** | Insight card: "Pattern detected: 4 noise complaints from Floor 12 in the last 2 weeks. [View Details]" |
| **Graceful degradation** | Insights panel shows "No automated insights available" with manual report link. |

### 7.5 Anomaly Detection (AI #5)

| Aspect | Detail |
|--------|--------|
| **Where** | Event cards in the grid |
| **Trigger** | On new event creation, compared against 90-day norms |
| **UI** | Small yellow warning icon on the event card with tooltip: "Unusual: This is the 3rd incident this week. Average is 1/month." |
| **Graceful degradation** | No warning icon shown. Events appear normally. |

### 7.6 Shift Report Auto-Summarization (AI #6)

| Aspect | Detail |
|--------|--------|
| **Where** | Shift detail view, "End Shift" flow |
| **Trigger** | Guard clicks "End Shift" or shift end time is reached |
| **UI** | AI-generated summary appears in an editable text area: "During this 8-hour shift, {guard_name} logged 12 events: 5 visitor check-ins, 4 package intakes, 2 key checkouts, and 1 incident report. 3 visitors remain signed in. No critical incidents occurred." |
| **Graceful degradation** | Empty summary text area. Guard writes manual summary. |

### 7.7 Guard Performance Scoring (AI #7)

| Aspect | Detail |
|--------|--------|
| **Where** | Security Supervisor dashboard only |
| **Trigger** | Weekly (Monday 6:00 AM) |
| **UI** | Performance scorecard per guard with metrics: events logged, avg response time, report quality score, patrol completion %. Accessible via Reports > Security > Guard Performance. |
| **Graceful degradation** | Raw activity counts shown without quality scoring. |
| **Default state** | Disabled. Must be explicitly enabled by Super Admin. |

### 7.8 Predictive Risk Assessment (AI #8)

| Aspect | Detail |
|--------|--------|
| **Where** | Security dashboard, "Risk Forecast" card |
| **Trigger** | Daily at 5:00 AM |
| **UI** | Card showing risk level (Low/Medium/High) with color coding and recommended staffing. e.g., "Today's Risk: Medium -- Community event expected. Consider additional lobby coverage." |
| **Graceful degradation** | Card hidden. Standard staffing levels apply. |
| **Default state** | Disabled. |

### 7.9 Voice-to-Text Reporting (AI #9)

| Aspect | Detail |
|--------|--------|
| **Where** | Incident Report and Pass-On Log rich text editors |
| **Trigger** | User clicks microphone button next to text editor |
| **UI** | Recording indicator (pulsing red dot), "Recording... Tap to stop." Transcribed text appears in editor after processing. |
| **Graceful degradation** | Microphone button hidden. Text entry only. |
| **Default state** | Disabled. |

### 7.10 Photo Analysis (AI #10)

| Aspect | Detail |
|--------|--------|
| **Where** | Incident Report photo upload section |
| **Trigger** | On photo upload |
| **UI** | After upload, small text below photo: "Detected: Damaged vehicle bumper, paint scrape. [Add to Description]" Clicking "Add to Description" appends the analysis to the description field. |
| **Graceful degradation** | No analysis text. Photo uploaded as-is. |
| **Default state** | Disabled. |

### 7.11 Similar Incident Linking (AI #11)

| Aspect | Detail |
|--------|--------|
| **Where** | Incident Report detail view, "Related Incidents" section |
| **Trigger** | On incident submission |
| **UI** | Section showing up to 5 related past incidents with relevance scores: "Related: INC-2026-01700 'Suspicious person in P2' (82% similar) -- Mar 8, 2026" |
| **Graceful degradation** | "Related Incidents" section hidden. Manual search available. |

### 7.12 Auto-Escalation Recommendation (AI #12)

| Aspect | Detail |
|--------|--------|
| **Where** | Incident Report dialog, after clicking "Submit Report" |
| **Trigger** | On submission |
| **UI** | If escalation recommended: banner "This incident may warrant escalation to your supervisor based on its severity and type. [Escalate Now] [Submit Without Escalation]" |
| **Graceful degradation** | No recommendation. Manual escalation decision. |

---

## 8. Analytics and Metrics

### 8.1 Operational KPIs

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Avg. Visitor Sign-In Time** | Total time from dialog open to save / count of visitor events | < 45 seconds | > 90 seconds |
| **Package Release Rate** | Packages released within 24h / total packages received | > 85% | < 70% |
| **Avg. Package Hold Time** | Sum(released_at - created_at) / count of released packages | < 24 hours | > 48 hours |
| **Incident Response Time** | Sum(first_update_at - created_at for urgent incidents) / count | < 30 minutes | > 60 minutes |
| **Open Incident Rate** | Open incidents / total incidents (rolling 30 days) | < 15% | > 30% |
| **Key Return Compliance** | Keys returned same day / total key checkouts | > 95% | < 85% |
| **Shift Coverage** | Shifts with no gaps / total shifts | 100% | < 95% |
| **Events Per Shift** | Total events / total shifts (rolling 30 days) | Informational | Anomaly if 2x above average |
| **Pass-On Log Acknowledgment** | Pass-on logs acknowledged by next shift / total logs | > 90% | < 75% |

### 8.2 Performance Metrics

| Metric | Target |
|--------|--------|
| Console page load time | < 1.5 seconds |
| Event creation (save click to toast) | < 2 seconds |
| Search results returned | < 1 second |
| WebSocket event delivery | < 500ms from creation |
| Filter application | < 500ms |

### 8.3 Charts

| Chart | Type | X-Axis | Y-Axis | Data | Location |
|-------|------|--------|--------|------|----------|
| Events by Type (Today) | Donut | N/A | N/A | Count per event type, max 6 segments + Other | Console dashboard |
| Events Over Time | Line | Days (7/30/90) | Event count | Daily event totals, 1-3 series (total, incidents, packages) | Reports > Security |
| Package Hold Time Distribution | Horizontal Bar | Hours (0-6, 6-12, 12-24, 24-48, 48+) | Package count | Released packages grouped by hold duration | Reports > Packages |
| Incident Types (Month) | Horizontal Bar | Count | Incident type labels | Incident count per type | Reports > Security |
| Key Checkout Duration | Line | Days | Avg. hours checked out | 30-day trend | Reports > Security |
| Visitor Traffic | Line | Hours (0-23) | Visitor count | Avg. visitors per hour of day, last 30 days | Reports > Security |
| Guard Activity Comparison | Grouped Bar | Guard names | Event count | Events per guard per type, current week | Supervisor dashboard |

### 8.4 Alert Thresholds

| Alert | Condition | Channel | Recipients |
|-------|-----------|---------|------------|
| Key overdue | Key checked out > 8 hours (configurable) | Push + Email | Security Supervisor, Property Manager |
| Outstanding packages | Package unreleased > 48 hours | Email | Property Manager |
| Shift gap | No active shift for > 30 minutes during staffed hours | Push | Security Supervisor |
| Urgent incident | Incident created with urgency = true | Push + SMS | Security Supervisor, Property Manager |
| High visitor volume | Active visitors > property's configured max | Push | Security Guard (current shift) |

---

## 9. Notifications

### 9.1 Notification Events

| Event | Channels | Recipients | Template |
|-------|----------|------------|----------|
| **Visitor signed in** | Push, Email (configurable) | Resident being visited | "Hi {resident_name}, your visitor {visitor_name} has arrived at the front desk." |
| **Package received** | Push, Email, SMS (resident preference) | Resident (recipient) | "Hi {resident_name}, a {description} from {courier} has been received and stored at {storage_spot}. Ref: {ref_number}." |
| **Package reminder** | Push, Email | Resident | "Reminder: You have a {description} (Ref: {ref_number}) waiting for pickup at {storage_spot}. Received {days_ago} days ago." |
| **Package released** | Push (optional) | Resident | "Your package (Ref: {ref_number}) has been picked up." |
| **Incident created (urgent)** | Push, SMS | Security Supervisor, Property Manager | "URGENT: {incident_type} reported. {title}. Ref: {ref_number}." |
| **Incident created (non-urgent)** | Email | Security Supervisor | "Incident report filed: {title}. Type: {incident_type}. Ref: {ref_number}." |
| **Incident escalated** | Push, SMS | Property Manager | "Incident {ref_number} has been escalated: {title}. Please review." |
| **Incident status changed** | Push | Creator of the incident | "Incident {ref_number} status changed to {new_status}." |
| **Key checkout overdue** | Push, Email | Security Supervisor, Property Manager | "Key '{key_name}' checked out to {person_name} has not been returned. Checked out {hours} hours ago." |
| **Pass-on log created** | Push | Selected team members | "New pass-on log from {author}: {subject}" |
| **Parking violation issued** | Email (if plate matches a resident) | Resident (if identifiable) | "A parking violation ({violation_type}) has been recorded for vehicle {plate_number}." |
| **Shift started** | System log only | N/A | N/A (logged for audit, not sent as notification) |
| **Shift ended** | Email (optional) | Property Manager | "Shift summary for {guard_name}, {date}: {summary_preview}..." |

### 9.2 Notification Preferences

Residents can configure per-module notification preferences in their account settings. The notification system respects:
- **Channel preference**: Email, SMS, Push, or combinations
- **Quiet hours**: Do not send push/SMS during configured hours (default 10 PM - 7 AM)
- **Exception for urgent**: Urgent notifications always bypass quiet hours

---

## 10. API Endpoints

### 10.1 Events (Security Console)

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `GET` | `/api/v1/events` | List events with filters | Staff roles | Query params: `type`, `status`, `unit_id`, `start_date`, `end_date`, `search`, `match_type`, `page`, `per_page`, `sort_by`, `sort_dir` | `{ data: Event[], meta: { total, page, per_page, total_pages } }` |
| `GET` | `/api/v1/events/:id` | Get event detail | Staff roles | -- | `{ data: Event }` |
| `POST` | `/api/v1/events` | Create event | Security Guard, Concierge, Supervisor, PM, Admin | `{ event_type_id, unit_id?, resident_id?, title, description, custom_fields, attachments[] }` | `{ data: Event }` (201 Created) |
| `PUT` | `/api/v1/events/:id` | Update event | Own events (Guard/Concierge), all events (Supervisor+) | `{ title?, description?, status?, custom_fields?, attachments[] }` | `{ data: Event }` |
| `DELETE` | `/api/v1/events/:id` | Soft-delete event | Supervisor, PM, Admin | -- | `{ success: true }` (200) |
| `POST` | `/api/v1/events/batch` | Batch create events | Staff roles | `{ events: [{ event_type_id, unit_id?, ... }] }` (max 20) | `{ data: Event[], errors: [{ index, message }] }` |
| `POST` | `/api/v1/events/:id/comments` | Add comment to event | Staff roles | `{ text: string }` | `{ data: EventComment }` (201) |
| `GET` | `/api/v1/events/export` | Export events as CSV/Excel/PDF | Supervisor, PM, Admin | Query params: same as list + `format` (csv/xlsx/pdf) | File download |

### 10.2 Packages

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `POST` | `/api/v1/packages/:id/release` | Release a package | Staff roles | `{ released_to, comments?, signature? }` | `{ data: Event }` |
| `POST` | `/api/v1/packages/:id/remind` | Send reminder notification | Staff roles | `{ channel?: "email" \| "sms" \| "push" }` | `{ success: true, notification_id }` |

### 10.3 Keys

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `GET` | `/api/v1/keys` | List key inventory | Staff roles | Query: `building_id?`, `status?`, `search?` | `{ data: Key[] }` |
| `POST` | `/api/v1/keys` | Add key to inventory | Supervisor, PM, Admin | `{ key_name, key_number?, building_id, key_type?, description? }` | `{ data: Key }` (201) |
| `PUT` | `/api/v1/keys/:id` | Update key | Supervisor, PM, Admin | `{ key_name?, description?, status? }` | `{ data: Key }` |
| `DELETE` | `/api/v1/keys/:id` | Delete key | Admin | -- | `{ success: true }` |
| `POST` | `/api/v1/keys/:id/checkout` | Check out key (creates event) | Staff roles | `{ checked_out_to, company?, id_type, id_number, reason, signature?, id_photo_front?, id_photo_back? }` | `{ data: Event }` (201) |
| `POST` | `/api/v1/keys/:id/checkin` | Return key (closes event) | Staff roles | `{ comments? }` | `{ data: Event }` |

### 10.4 Visitors

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `POST` | `/api/v1/visitors/:event_id/signout` | Sign out visitor | Staff roles | `{ comments? }` | `{ data: Event }` |
| `POST` | `/api/v1/visitors/batch-signout` | Sign out all active visitors | Staff roles | `{ visitor_event_ids: UUID[] }` | `{ data: { signed_out: number } }` |

### 10.5 Parking Violations

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `GET` | `/api/v1/parking-violations` | List violations | Staff roles | Query: `plate?`, `status?`, `start_date?`, `end_date?` | `{ data: Event[] }` |
| `POST` | `/api/v1/parking-violations` | Create violation | Security Guard, Supervisor, PM, Admin | `{ license_plate, violation_type, building_id, ... }` | `{ data: Event }` (201) |
| `PUT` | `/api/v1/parking-violations/:id/status` | Update violation status | Supervisor, PM, Admin | `{ status, notes? }` | `{ data: Event }` |

### 10.6 FOBs and Access Devices

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `GET` | `/api/v1/units/:id/fobs` | List FOBs for a unit | Staff roles | -- | `{ data: FOB[] }` |
| `POST` | `/api/v1/fobs` | Register new FOB | Supervisor, PM, Admin | `{ serial_number, fob_type, resident_id, unit_id, issued_date, deposit_paid? }` | `{ data: FOB }` (201) |
| `PUT` | `/api/v1/fobs/:id` | Update FOB (e.g., deactivate) | Supervisor, PM, Admin | `{ status?, notes? }` | `{ data: FOB }` |
| `GET` | `/api/v1/units/:id/buzzer-codes` | List buzzer codes for a unit | Staff roles | -- | `{ data: BuzzerCode[] }` |
| `GET` | `/api/v1/units/:id/garage-clickers` | List garage clickers for a unit | Staff roles | -- | `{ data: GarageClicker[] }` |

### 10.7 Shifts

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `GET` | `/api/v1/shifts/active` | Get the current user's active shift | Staff roles | -- | `{ data: Event \| null }` |
| `POST` | `/api/v1/shifts/:event_id/log-entry` | Add log entry to active shift | Staff roles | `{ subject, details? }` | `{ data: ShiftLogEntry }` (201) |
| `POST` | `/api/v1/shifts/:event_id/end` | End shift | Staff roles | `{ summary? }` | `{ data: Event }` |

### 10.8 Emergency

| Method | Endpoint | Description | Auth | Request Body | Response |
|--------|----------|-------------|------|-------------|----------|
| `GET` | `/api/v1/emergency/contacts` | Get emergency contact directory | Staff roles | -- | `{ data: EmergencyContact[] }` |
| `GET` | `/api/v1/emergency/procedures` | Get emergency procedures | Staff roles | -- | `{ data: EmergencyProcedure[] }` |
| `GET` | `/api/v1/units/:id/emergency-contacts` | Get unit's emergency contacts | Staff roles | -- | `{ data: ResidentEmergencyContact[] }` |

### 10.9 Autocomplete and Lookup

| Method | Endpoint | Description | Auth | Response |
|--------|----------|-------------|------|----------|
| `GET` | `/api/v1/lookup/residents?q={query}` | Search residents by name (autocomplete) | Staff | `{ data: [{ id, name, unit_number }] }` |
| `GET` | `/api/v1/lookup/units?q={query}` | Search units by number (autocomplete) | Staff | `{ data: [{ id, number, building, floor }] }` |
| `GET` | `/api/v1/lookup/guards` | List all security/concierge staff | Staff | `{ data: [{ id, display_name, role }] }` |

### 10.10 Authentication

All endpoints require a valid JWT bearer token in the `Authorization` header. Tokens are scoped to a property. Requests without a valid token return `401 Unauthorized`. Requests with insufficient role permissions return `403 Forbidden` with body `{ error: "Insufficient permissions", required_role: "security_supervisor" }`.

Rate limits:
- Standard endpoints: 100 requests/minute per user
- Batch endpoints: 10 requests/minute per user
- Export endpoints: 5 requests/minute per user
- Autocomplete/lookup: 200 requests/minute per user

---

## 11. Completeness Checklist

### Functional Coverage

- [x] 7 core entry types defined with full field specs (Visitor, Package, Security Shift, Incident, Authorized Entry, Key Checkout, Pass-On Log)
- [x] 2 additional entry types defined (Parking Violation, Security Patrol placeholder)
- [x] Extensible via configurable EventType system -- properties can add custom types
- [x] Unified event grid with color-coded cards
- [x] 22 filter options with sub-filter hierarchy
- [x] Advanced search (time frame, exact/broad match, building, unit, staff)
- [x] Batch event creation (up to 10 rows)
- [x] Batch visitor sign-out
- [x] Shift log (persistent panel, always accessible)
- [x] Key inventory management (CRUD + bulk add)
- [x] Key checkout with ID verification and signature capture
- [x] Parking violation lifecycle (create, active, appeal, resolve)
- [x] FOB/key management (6 FOB slots, 2 buzzer codes, 2 garage clickers per unit)
- [x] Emergency procedures modal with contacts and checklists
- [x] Emergency contacts quick access (per unit)
- [x] Real-time updates via WebSocket
- [x] Offline event queuing

### Field-Level Completeness

- [x] Every field has: name, label, type, max length, required/optional, default, validation, error message
- [x] Tooltips on all complex fields
- [x] Placeholder text on all text inputs

### UI/UX Completeness

- [x] Desktop, tablet, and mobile layouts specified
- [x] Empty state, loading state, and error state defined
- [x] Dialog open/close animations specified (per Design System)
- [x] Real-time update indicators defined
- [x] Responsive behavior for quick-create icons
- [x] Card layout for event grid (not table rows)

### Data Model Completeness

- [x] All 7 entry type custom_fields schemas defined
- [x] Supporting entities (Key, FOB, BuzzerCode, GarageClicker)
- [x] Database indexes for common queries
- [x] Relationships to Unified Event Model from architecture PRD

### AI Integration Completeness

- [x] All 12 AI capabilities from AI Framework mapped to UI locations
- [x] Trigger, input, output, and graceful degradation for each
- [x] Default enabled/disabled state for each

### Role Coverage

- [x] Security Guard flows (start shift, package intake, visitor check-in/out, incident report, key checkout)
- [x] Concierge flows (package release, visitor management)
- [x] Security Supervisor access (analytics, export, escalation)
- [x] Property Manager access (full operational oversight)
- [x] Permission matrix referenced from 02-roles-and-permissions.md

### API Completeness

- [x] CRUD endpoints for all entities
- [x] Batch endpoints
- [x] Export endpoint
- [x] Autocomplete/lookup endpoints
- [x] Authentication and rate limiting specified
- [x] Request/response schemas defined

### Notification Completeness

- [x] 13 notification events defined
- [x] Channels specified per event
- [x] Recipients specified per event
- [x] Template text provided
- [x] Quiet hours and preference handling noted

### Analytics Completeness

- [x] 9 operational KPIs with formulas, targets, and alert thresholds
- [x] 5 performance metrics with targets
- [x] 7 chart specifications with type, axes, and data sources
- [x] 5 automated alerts with conditions, channels, and recipients

---

*End of document.*
