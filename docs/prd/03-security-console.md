# 03 — Security Console

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture (Unified Event Model), 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

### What It Is

The Security Console is the **primary operational hub** for all front-line building staff -- security guards, concierges, and front desk attendants. It is a single-page application that combines a unified event stream with quick-create actions for 9+ entry types. Every building occurrence -- a visitor arriving, a package delivered, an incident reported, a key checked out -- flows through this console.

This is the **largest and most complex module** in Concierge. It is the screen that staff stare at for 8+ hours per shift. Every design decision must optimize for speed, clarity, and minimal cognitive load.

### Why It Exists

Buildings need a single source of truth for everything happening on-site. Industry research revealed three common approaches:

1. **Rigid log types** -- platforms with exactly 6 hardcoded log types that cannot be extended. Properties are forced into workarounds when their needs do not fit the predefined types.
2. **Unified but generic** -- platforms with a configurable event model but minimal specialized UIs for different event types. Flexible but slow for common tasks.
3. **Unified with specialization** -- a configurable event model (so properties can add custom types) combined with purpose-built UIs for the most common entry types (visitors, packages, incidents, keys). This is the approach Concierge takes.

### Which Roles Use It

| Role | Access Level | Primary Use |
|------|-------------|-------------|
| **Security Guard** | Full create and view, edit own entries | Log incidents, manage visitors, handle packages, check out keys, write shift notes |
| **Security Supervisor** | Full create/view/edit + analytics + export | Review all entries, run reports, manage escalations, review guard performance |
| **Front Desk / Concierge** | Full create and view, edit own entries | Package intake/release, visitor registration, general notes, shift handoffs |
| **Property Manager** | Full access + delete (configurable) | Oversight, escalation review, report generation |
| **Property Admin** | Full access + configuration | Configure event types, manage categories, set up notification rules |
| **Super Admin** | Unrestricted | All of the above across all properties |

Roles that do **not** access the Security Console: Board Member, Maintenance Staff, all Resident roles. These roles never see the Security Console in their navigation.

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across three production platforms revealed these essential patterns for a security console:

| Capability | Where Observed | Our Approach |
|-----------|----------------|-------------|
| **Unified event stream** | Multiple platforms combine visitors, packages, incidents, keys, and shift notes into a single timeline | Adopt. Single console page with all entry types in one filterable stream |
| **Quick-create icons** | Circular icon buttons for instant entry creation -- one click to open any form | Adopt. 9 quick-create icons with large tap targets for mobile and desktop |
| **Courier-specific package tracking** | Branded courier icons (Amazon, FedEx, UPS) instead of text dropdowns for visual recognition | Adopt. Icon grid for courier selection with branded logos |
| **Batch event creation** | Multi-row form for logging multiple events at once with per-row notification control | Adopt. Batch mode supporting up to 10 rows |
| **Smart filter hierarchy** | Sub-filters grouped under parent categories (e.g., "All Visitors" > "Visitors Still Signed In") | Adopt with enhancement. Add keyboard shortcuts and saved filter presets |
| **Emergency services tracking** | Structured table on incident reports for Police, Fire, Ambulance, Client Contact, Supervisor | Adopt. Extend with GPS coordinates and response time calculation |
| **Shift handoff info box** | Live counts of bookings, keys out, and residents on vacation displayed when starting a new shift | Adopt. Critical context for incoming guard |
| **Key checkout with ID verification** | ID Type and ID Number fields with optional photo capture of identification | Adopt. Mandatory ID verification with photo capture |
| **Parking violation lifecycle** | Create > Track > Resolve lifecycle with ban types (Ban, Ticket, Warning, Vehicle Towed) | Adopt. Add auto-expiry and repeat offender detection |
| **Per-type reference numbers** | Each entry type gets its own sequential counter with configurable prefix | Adopt. Format: `{PREFIX}-{YEAR}-{SEQUENCE}` (e.g., `INC-2026-00147`) |

### Best Practices Adopted

1. **Dialog-based workflow** -- all creation and detail views open as overlays on the console, so staff never lose context of the main event stream
2. **Real-time updates** -- WebSocket-powered live feed so multiple staff see new entries without refreshing
3. **Color-coded event cards** -- visual scanning is faster than reading text labels
4. **Print integration** -- label printing for packages, parking permits for visitors, work orders for incidents
5. **Audit trail on every entry** -- immutable history of who created, modified, and closed each event

### Pitfalls Avoided

1. **No hardcoded log types** -- properties must be able to add custom event types without code changes
2. **No mixed time formats** -- consistent time format throughout (user-configurable: 12h or 24h)
3. **No page-based navigation for events** -- infinite scroll with date-based grouping instead of numbered pages
4. **No silent failures** -- if a feature is not available for a role, the button is absent, not broken or hidden behind a visible-but-dead link
5. **No single-channel notifications** -- multi-channel from day one (email, SMS, push, voice)
6. **No manual-only refresh** -- real-time updates via WebSocket for collaborative shifts
7. **No free-text-only package descriptions** -- dropdown with predefined types plus an "Other" option for consistency
8. **No limited incident statuses** -- full lifecycle: Draft > Open > In Progress > Under Review > Escalated > Closed

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Unified Event Grid

The main console view. All events display in a reverse-chronological, filterable stream of cards.

**Display Modes**:

| Mode | Description | Default For |
|------|-------------|-------------|
| **Card Grid** | Color-coded cards in a responsive grid. Each card shows type icon, unit, summary, timestamp, and status. | Desktop |
| **Compact List** | Dense table rows for high-volume properties. Shows more entries per screen. | User preference |
| **Split View** | Event grid on left (60%), detail panel on right (40%). Clicking a card opens detail without losing grid context. | Desktop (optional) |

**Card Fields**:

| Field | Display | Description |
|-------|---------|-------------|
| Event type icon | Top-left corner | Color-coded icon matching the EventType configuration |
| Reference number | Top-right corner | Auto-generated (e.g., `PKG-2026-00147`) |
| Status badge | Below reference | Color-coded pill: Draft (grey), Open (blue), In Progress (amber), Closed (green), Escalated (red) |
| Title / summary | Card body | First 80 characters of description or auto-generated summary |
| Unit number | Card body | Unit badge (e.g., "Unit 1205"). Empty for non-unit events |
| Resident name | Card body | Resident associated with the event (if any) |
| Timestamp | Bottom-left | Relative time ("3 min ago") with full timestamp on hover |
| Created by | Bottom-right | Staff member initials or avatar |
| Quick action | Bottom-right | Context-specific: "Sign Out" for visitors, "Release" for packages, "Close" for incidents |

**Grouping Modes** (toggle via toolbar):

| Mode | Groups By | Use Case |
|------|-----------|----------|
| By Time | Today / Yesterday / This Week / Older | Default. Chronological context |
| By Type | Visitor / Package / Incident / Key / etc. | Scan all packages at once |
| By Status | Open / In Progress / Closed | Focus on unresolved items |
| By Unit | Sorted by unit number | See everything happening at a specific unit |

#### 3.1.2 Filter Bar

Always visible at the top of the console.

| # | Element | Type | Behavior |
|---|---------|------|----------|
| 1 | Search | Text input | Placeholder: "Search by name, unit, reference #, or keyword...". Searches across title, description, unit, resident name, reference number. Minimum 2 characters to trigger. Debounced 300ms. |
| 2 | Type filter | Multi-select dropdown | Lists all active EventTypes grouped by EventGroup. Multi-select with checkboxes. "Select All" / "Clear All" at top. Persists across page loads. |
| 3 | Status filter | Multi-select dropdown | Options: Draft, Open, In Progress, Under Review, Escalated, Closed. Default: all except Closed. |
| 4 | Date range | Date range picker | Presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Custom Range. Default: Today. |
| 5 | Building filter | Dropdown | Only shown for multi-building properties. "All Buildings" as default. |
| 6 | Reset | Text link | Resets all filters to defaults. Tooltip: "Clear all filters and show today's events" |
| 7 | Advanced toggle | Chevron link | Expands: Exact/Broad match toggle, Created By filter, Unit range filter, Priority filter |

**Filter validation**:
- Date range: End date must be after start date. Error: "End date must be after start date."
- Search: Minimum 2 characters. Error: "Enter at least 2 characters to search."
- If no results match filters: Show empty state with active filter summary and "Clear Filters" button

**Saved Filters**:
- Users can save current filter combinations as named presets
- Up to 10 saved filters per user
- Saved filters appear as quick-access pills below the filter bar
- Tooltip on each pill: "Click to apply. Right-click to rename or delete."

#### 3.1.3 Quick-Create Icons

A horizontal row of circular icon buttons below the filter bar. Each opens a creation dialog for a specific entry type.

| # | Icon | Label | Entry Type | Keyboard Shortcut |
|---|------|-------|-----------|-------------------|
| 1 | Person with badge | Visitor | visitor_checkin | `Alt+1` |
| 2 | Box/package | Package | package_intake | `Alt+2` |
| 3 | Shield/clipboard | Security Log | security_shift | `Alt+3` |
| 4 | Document/warning | Incident Report | incident_report | `Alt+4` |
| 5 | Door/entry | Authorized Entry | authorized_entry | `Alt+5` |
| 6 | Key | Key Checkout | key_checkout | `Alt+6` |
| 7 | Notepad/handoff | Pass-On Log | pass_on_log | `Alt+7` |
| 8 | Broom/sparkle | Cleaning Log | cleaning_log | `Alt+8` |
| 9 | Pencil/note | General Note | general_note | `Alt+9` |

**Icon Specifications**:
- Size: 56px diameter (desktop), 48px (tablet), 44px (mobile)
- Background: Primary brand color (default: system blue `#007AFF`)
- Icon color: White
- Hover: 10% darker background, slight scale up (1.05x)
- Active/pressed: 20% darker background
- Label: Below icon, 12px, medium weight, max 2 lines
- Tooltip: "{Type Name} -- {Keyboard Shortcut}" (e.g., "Visitor -- Alt+1")
- Focus ring: 2px blue outline for keyboard navigation (accessibility)

**Responsive behavior**:
- Desktop (>1024px): All 9 icons in a single row
- Tablet (768-1024px): All 9 icons in a single scrollable row
- Mobile (<768px): 2 rows of icons, 5 on top, 4 on bottom. Or a horizontal scrollable row with overflow indicator

#### 3.1.4 Visitor Management

**Create Visitor Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Unit # | Autocomplete text | Yes | 20 chars | Empty | Must match an existing unit | "No unit found. Check the unit number and try again." |
| 2 | Visitor Name | Text input | Yes | 100 chars | Empty | Min 2 characters | "Visitor name must be at least 2 characters." |
| 3 | Visitor Type | Toggle radio | Yes | -- | "Visitor" | Must select one | -- |
| 4 | Expected Departure | DateTime picker | No | -- | +4 hours from now | Must be in the future | "Expected departure must be in the future." |
| 5 | Needs Parking? | Checkbox | No | -- | Unchecked | -- | -- |
| 6 | Comments | Textarea | No | 500 chars | Empty | -- | Character count shown: "{count}/500" |
| 7 | Notify Resident | Checkbox | No | -- | Checked (configurable) | -- | Tooltip: "Send a notification to the resident that their visitor has arrived." |
| 8 | Photo | Camera/upload | No | 5MB, JPG/PNG | -- | File size and type check | "File must be JPG or PNG and under 5MB." |

**Visitor Type Options**:
- Visitor (default)
- Contractor
- Delivery Person
- Real Estate Agent
- Emergency Service
- Other

**Parking Details** (shown when "Needs Parking?" is checked):

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Vehicle Make/Model | Text input | Yes (if parking) | 100 chars | Empty | Min 2 characters | "Enter the vehicle make and model." |
| 2 | License Plate | Text input | Yes (if parking) | 20 chars | Empty | Alphanumeric, min 2 chars | "Enter a valid license plate number." |
| 3 | Province/State | Dropdown | Yes (if parking) | -- | Property's province | Must select one | "Select a province or state." |
| 4 | Vehicle Color | Text input | No | 30 chars | Empty | -- | -- |
| 5 | Parking Until | DateTime picker | Yes (if parking) | -- | +4 hours from now | Must be in the future | "Parking end time must be in the future." |
| 6 | Parking Area | Dropdown | No | -- | "Visitor Lot" | -- | Tooltip: "Select where the visitor should park. Options are configured by your property administrator." |

**Action Buttons**:

| Button | Style | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Save | Primary (filled) | Creates visitor event, sends notification if checked | Button text changes to "Saving..." with spinner. Form fields disabled. | Toast: "Visitor {name} signed in successfully." Dialog closes. New card appears in grid with slide-in animation. | Toast (error): "Failed to save visitor. Please try again." Form remains open with entered data preserved. |
| Save & Print Pass | Secondary (outline) | Creates visitor event + opens print dialog for visitor/parking pass | Same as Save + print dialog opens | Toast: "Visitor {name} signed in. Printing pass..." | Same as Save failure |
| Cancel | Text link | Closes dialog. If form has data, shows confirmation: "Discard visitor entry?" with Yes/No | -- | Dialog closes | -- |

**Sign Out Flow**:
- "Sign Out" quick action on visitor card or detail view
- Confirmation: "Sign out {visitor name}? This will end their visit and parking permit (if active)."
- On confirm: Sets departure timestamp, closes parking permit, updates card status to "Signed Out"
- Batch Sign Out: Available from toolbar. "Sign out all visitors" with confirmation showing count

**Visitor Detail View**:

| Section | Fields |
|---------|--------|
| Visitor Info | Name, Type, Unit visited, Arrival time, Departure time (or "Still signed in"), Comments, Photo |
| Parking Permits | Table: From, To, Make/Model, Color, License, Province, Area, Status |
| History | Audit trail: Date/Time, Who (staff), Action, Details |
| Actions | Sign Out (if signed in), Print Pass, Add Comment, Edit (own entries only) |

#### 3.1.5 Package Tracking

**Create Package Dialog -- Incoming Tab (default)**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Reference # | Read-only text | -- | -- | Auto-generated (e.g., `PKG-2026-00148`) | -- | -- |
| 2 | Recipient | Autocomplete text | Yes | 100 chars | Empty | Must match a resident or unit | "No resident found. Check the name or unit number." |
| 3 | Unit | Autocomplete text | Yes | 20 chars | Auto-populated from Recipient | Must match existing unit | "No unit found." |
| 4 | Courier | Icon grid | Yes | -- | None selected | Must select one | "Select a courier." |
| 5 | Tracking # | Text input | No | 50 chars | Empty | Alphanumeric with dashes | "Tracking number contains invalid characters." |
| 6 | Package Type | Dropdown | Yes | -- | "Package" | Must select one | -- |
| 7 | Perishable | Checkbox | No | -- | Unchecked | -- | Tooltip: "Mark as perishable to trigger priority notifications. Perishable packages are flagged on the dashboard." |
| 8 | Storage Spot | Dropdown | Yes | -- | Property default (e.g., "Front Desk") | Must select one | "Select a storage location." |
| 9 | Description | Text input | No | 200 chars | Empty | -- | -- |
| 10 | Photo | Camera/upload | No | 5MB, JPG/PNG | -- | File size and type | "File must be JPG or PNG and under 5MB." |
| 11 | Notification | Dropdown | Yes | -- | "Send to primary email" | -- | Tooltip: "Choose how to notify the resident about this package." |

**Courier Icon Grid**:

| # | Courier | Icon | Color |
|---|---------|------|-------|
| 1 | Amazon | Amazon logo | `#FF9900` |
| 2 | Canada Post | CP logo | `#FF0000` |
| 3 | FedEx | FedEx logo | `#4D148C` |
| 4 | UPS | UPS logo | `#351C15` |
| 5 | DHL | DHL logo | `#FFCC00` |
| 6 | Purolator | Purolator logo | `#E31837` |
| 7 | USPS | USPS logo | `#004B87` |
| 8 | Individual Drop-Off | Person icon | `#8E8E93` |
| 9 | Property Management | Building icon | `#5AC8FA` |
| 10 | Other | Generic box icon | `#8E8E93` |

Additional couriers configurable by Property Admin. When "Other" is selected, a text input appears: "Courier name" (required, max 50 chars).

**Package Type Options**: Package, Envelope, Box (Small), Box (Medium), Box (Large), Perishable, Flowers, Dry Cleaning, Pharmacy, Grocery, Furniture/Oversized, Other

**Storage Spot Options**: Configurable per property. Defaults: Front Desk, Package Room, Mailroom, Loading Dock, Concierge Desk, Oversized Storage, Refrigerator (for perishables), Other

**Notification Options**: Send to primary email, Send to all emails, Send SMS, No notification

**Package Type Dropdown Selection behavior**: Single-select. Icon appears next to the selected courier (highlighted border). Only one at a time.

**Batch Package Mode**:
- Triggered by "Log Multiple Packages" button in the dialog header
- Shows up to 10 rows, each with: Recipient (autocomplete), Unit (auto-fill), Courier (dropdown), Package Type (dropdown), Storage (dropdown), Notification (dropdown), Print Label (checkbox)
- "Add Row" button below rows
- "Save All" button: Creates all packages in a single batch. Success toast: "X packages logged successfully."
- Per-row validation: Each row validates independently. Invalid rows are highlighted with red border and error icons.

**Action Buttons (Single Package)**:

| Button | Style | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Save | Primary | Creates package event, sends notification | "Saving..." with spinner | Toast: "Package {ref#} logged for Unit {unit}." Dialog closes. | Toast (error): "Failed to log package." Form preserved. |
| Save & Print Label | Secondary | Creates package + prints label | "Saving..." then print dialog | Toast: "Package logged. Printing label..." | Same as Save failure |
| Cancel | Text link | Close with discard confirmation if data entered | -- | Dialog closes | -- |

**Release Package Flow**:
- "Release" quick action on package card or from detail view
- Release dialog fields:

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Released To | Text input | Yes | 100 chars | Empty | Min 2 chars | "Enter the name of the person picking up the package." |
| 2 | ID Verified | Checkbox | No | -- | Unchecked | -- | Tooltip: "Check if you verified the person's identity before releasing the package." |
| 3 | Comments | Textarea | No | 500 chars | Empty | -- | -- |
| 4 | Signature | Signature pad | Configurable | -- | Empty | Required if property setting enabled | "Signature is required to release this package." |
| 5 | Photo | Camera/upload | No | 5MB | -- | JPG/PNG | "File must be JPG or PNG and under 5MB." |

- Release confirmation: "Release package {ref#} to {name}?"
- On confirm: Package status changes to "Released". Release timestamp recorded. Card updates in grid.
- Toast: "Package {ref#} released to {name}."

**Outgoing Package Tab**:
Same form as incoming but without Courier grid and Storage Spot. Additional field: "Courier Pickup Expected" (DateTime, optional).

#### 3.1.6 Security Shift / Log

**Create Shift Dialog**

**Info Banner** (always shown at top of dialog -- light blue background):
- "You have {X} booking(s) scheduled for today." (links to Amenity calendar)
- "{X} key(s) are currently checked out." (links to key checkout list)
- "{X} resident(s) are on vacation." (links to vacation list)
- "{X} unreleased package(s)." (links to package list filtered to outstanding)

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Start Time | DateTime picker | Yes | -- | Current time (rounded to nearest 15 min) | Must be within last 2 hours | "Shift start time cannot be more than 2 hours in the past." |
| 2 | End Time | DateTime picker | Yes | -- | +8 hours from Start Time | Must be after Start Time | "End time must be after start time." |
| 3 | Relieved | Dropdown | Yes | -- | "Select Guard" | Must select a guard or N/A | "Select the guard you are relieving." |
| 4 | To Be Relieved By | Dropdown | Yes | -- | "Select Guard" | Must select a guard or N/A | "Select the guard who will relieve you." |
| 5 | Equipment Received | Textarea | No | 500 chars | Empty | -- | Tooltip: "List any equipment handed to you by the previous guard (radios, keys, devices, etc.)" |
| 6 | Opening Notes | Rich text editor | No | 2000 chars | Empty | -- | Tooltip: "Notes about the current state of the building as you start your shift." |

**Relieved / To Be Relieved By Options**:
- All active security/concierge staff for the property
- "N/A -- I am the first shift for today" (for Relieved)
- "N/A -- I am the last shift for today" (for To Be Relieved By)

**Shift Log Entries** (added to an active shift):
Once a shift is created, staff can add log entries throughout the shift:

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Time | DateTime picker | Yes | -- | Current time | Within shift time range | "Log entry time must be within the shift period." |
| 2 | Category | Dropdown | No | -- | "General" | -- | Options: General, Patrol Round, Building Check, Resident Interaction, Contractor Visit, Alarm Response, Other |
| 3 | Entry | Rich text editor | Yes | 2000 chars | Empty | Min 10 chars | "Log entry must be at least 10 characters." |
| 4 | Attachment | File upload | No | 10MB, JPG/PNG/PDF | -- | File type and size | "File must be JPG, PNG, or PDF and under 10MB." |

**End Shift Flow**:
- "End Shift" button on shift detail or dashboard
- Closing fields:

| # | Field | Type | Required | Default |
|---|-------|------|----------|---------|
| 1 | Actual End Time | DateTime picker | Yes | Current time |
| 2 | Equipment Returned | Textarea | No | Empty |
| 3 | Closing Notes | Rich text editor | No | Empty |
| 4 | AI Summary | Read-only text (generated) | No | Auto-generated summary of shift events |

- "End Shift" button: Primary. Loading: "Ending shift...". Success: "Shift ended. Summary generated."
- AI Summary: Auto-generated narrative of all events during the shift (see Section 7). Staff can edit before finalizing.

#### 3.1.7 Incident Report

**Create Incident Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Unit # | Autocomplete text | No | 20 chars | Empty | Must match existing unit if provided | "No unit found." |
| 2 | Incident Type | Dropdown | Yes | -- | First option | Must select one | "Select an incident type." |
| 3 | Title | Text input | Yes | 200 chars | Empty | Min 5 characters | "Title must be at least 5 characters." |
| 4 | What Happened | Rich text editor | Yes | 4000 chars | Empty | Min 20 characters | "Please provide at least 20 characters describing the incident." |
| 5 | Time Occurred | DateTime picker | Yes | -- | Current time | Cannot be in the future | "Incident time cannot be in the future." |
| 6 | Urgency | Toggle | Yes | -- | "Not Urgent" | -- | Tooltip: "Urgent incidents trigger immediate notifications to supervisors and management." |
| 7 | Priority | Dropdown | No | -- | AI-suggested or "Normal" | -- | Options: Low, Normal, High, Critical. Tooltip: "Priority determines the order incidents appear in review queues." |
| 8 | Reported By | Text input | No | 100 chars | Empty | -- | Tooltip: "Name of the person who reported this incident (if different from you)." |
| 9 | Suspect | Text input | No | 200 chars | Empty | -- | -- |
| 10 | Photos | File upload (multi) | No | 5 files, 5MB each, JPG/PNG | -- | File type, size, count | "Maximum 5 photos. Each must be JPG or PNG and under 5MB." |
| 11 | Attachments | File upload (multi) | No | 3 files, 10MB each, PDF/DOC/DOCX | -- | File type, size, count | "Maximum 3 documents. Each must be PDF or DOC and under 10MB." |

**Incident Type Options** (configurable per property, system defaults):

| # | Type | Default Priority |
|---|------|-----------------|
| 1 | Alarm System Occurrence | High |
| 2 | Doors/Windows Insecure | High |
| 3 | Fire / Fire Alarm | Critical |
| 4 | Fire Hazard | High |
| 5 | Flooding / Water Damage | Critical |
| 6 | Infraction of Rules | Normal |
| 7 | Medical Emergency | Critical |
| 8 | Noise Complaint -- Confirmed | Normal |
| 9 | Noise Complaint -- Unconfirmed | Low |
| 10 | Parking Lot Occurrence | Normal |
| 11 | Property Damage | High |
| 12 | Safety Hazard | High |
| 13 | Suspicious Activity | High |
| 14 | Theft / Break-In | Critical |
| 15 | Trespasser | High |
| 16 | Valuables Lost/Found | Low |
| 17 | Vandalism | High |
| 18 | Waste/Water/Power Issue | Normal |
| 19 | Other | Normal |

**Incident Status Lifecycle**:

```
Draft ──> Open ──> In Progress ──> Under Review ──> Closed
                       │                                ▲
                       │                                │
                       └──> Escalated ──> Under Review ─┘
```

| Status | Description | Who Can Set | Color |
|--------|-------------|------------|-------|
| Draft | Saved but not yet submitted | Creator | Grey `#8E8E93` |
| Open | Submitted and awaiting action | Creator, Supervisor, Manager | Blue `#007AFF` |
| In Progress | Being actively investigated or addressed | Guard, Supervisor, Manager | Amber `#FF9500` |
| Under Review | Investigation complete, awaiting supervisor review | Supervisor, Manager | Purple `#AF52DE` |
| Escalated | Requires management attention | Supervisor, Manager | Red `#FF3B30` |
| Closed | Resolved and documented | Supervisor, Manager | Green `#34C759` |

**Emergency Services Section** (collapsible, shown for High/Critical priority):

| # | Service | Fields |
|---|---------|--------|
| 1 | Police | Called (Yes/No), Time Called, Arrival Time, Badge # / Officer Name, Departure Time, Report # |
| 2 | Fire Department | Called (Yes/No), Time Called, Arrival Time, Captain / Unit Name, Departure Time |
| 3 | Ambulance / EMS | Called (Yes/No), Time Called, Arrival Time, Unit Name, Patient Transported (Yes/No) |
| 4 | Property Manager/Client | Called (Yes/No), Time Called, Responded (Yes/No), Notes |
| 5 | Supervisor | Called (Yes/No), Time Called, Arrived On-Site (Yes/No), Notes |

**Action Buttons**:

| Button | Style | Action | Loading | Success | Failure |
|--------|-------|--------|---------|---------|---------|
| Save as Draft | Tertiary (grey outline) | Saves with Draft status | "Saving..." | Toast: "Incident saved as draft." | Toast error |
| Submit | Primary | Saves with Open status, triggers notifications | "Submitting..." | Toast: "Incident {ref#} submitted." | Toast error |
| Cancel | Text link | Close with discard confirmation | -- | Dialog closes | -- |

**Incident Detail View (additional sections beyond creation fields)**:

| Section | Content |
|---------|---------|
| Emergency Services | Editable table (see above) |
| Updates | Append-only log. Each update: timestamp, staff name, text (2000 chars), status change, file attachment |
| Linked Incidents | AI-suggested similar past incidents (see Section 7). Manual linking via search. |
| Attachments | Gallery view of photos. Table view of documents. Each with download and delete (own uploads only). |
| Print | "Print Report" button generates a formatted PDF |
| Actions | Update Status (dropdown), Add Update (text + file), Escalate (with reason), Close (with resolution summary) |

#### 3.1.8 Authorized Entry

**Create Authorized Entry Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Unit # | Autocomplete text | Yes | 20 chars | Empty | Must match existing unit | "No unit found." |
| 2 | Authorized Person | Text input | Yes | 100 chars | Empty | Min 2 chars | "Enter the name of the authorized person." |
| 3 | Company | Text input | No | 100 chars | Empty | -- | -- |
| 4 | Reason | Dropdown + text | Yes | 200 chars | -- | Must select or type reason | "Enter a reason for authorized entry." |
| 5 | Date/Time | DateTime picker | Yes | -- | Current time | Within 24 hours | "Entry time must be within 24 hours of now." |
| 6 | Duration | Dropdown | No | -- | "Until departure" | -- | Options: 1 hour, 2 hours, 4 hours, Full day, Until departure |
| 7 | ID Verified | Checkbox | Yes (configurable) | -- | Unchecked | Must be checked if required by property | "ID verification is required before granting entry." |
| 8 | ID Type | Dropdown | If ID Verified | -- | -- | Must select if ID verified | "Select the type of ID presented." |
| 9 | ID Number | Text input | No | 30 chars | Empty | -- | -- |
| 10 | Resident Notified | Checkbox | No | -- | Unchecked | -- | Tooltip: "Check if you confirmed the entry with the unit's resident." |
| 11 | Comments | Textarea | No | 500 chars | Empty | -- | -- |
| 12 | Photo | Camera/upload | No | 5MB, JPG/PNG | -- | File type and size | "File must be JPG or PNG and under 5MB." |

**Reason Options**: Maintenance/Repair, Delivery/Installation, Cleaning, Inspection, Emergency, Real Estate Showing, Pet Service, Other (free text)

**ID Type Options**: Driver's License, Passport, Building ID, Company ID, Government ID, Other

#### 3.1.9 Key Checkout

**Create Key Checkout Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Logged By | Read-only | -- | -- | Current user (auto) | -- | -- |
| 2 | Logged On | Read-only | -- | -- | Current timestamp (auto) | -- | -- |
| 3 | Key | Searchable dropdown | Yes | -- | "Select a key" | Must select from inventory | "Select a key from the inventory." |
| 4 | Checked Out To | Text input | Yes | 100 chars | Empty | Min 2 chars | "Enter the name of the person checking out the key." |
| 5 | Company | Text input | No | 100 chars | Empty | -- | -- |
| 6 | ID Type | Dropdown | Yes | -- | -- | Must select one | "Select the type of ID presented." |
| 7 | ID Number | Text input | Yes | 30 chars | Empty | Min 3 chars | "Enter the ID number." |
| 8 | Reason | Textarea | Yes | 500 chars | Empty | Min 5 chars | "Provide a reason for the key checkout." |
| 9 | Expected Return | DateTime picker | No | -- | +4 hours from now | Must be in the future | "Expected return time must be in the future." |
| 10 | ID Photo (front) | Camera/upload | No | 5MB, JPG/PNG | -- | File type and size | "File must be JPG or PNG and under 5MB." |
| 11 | ID Photo (back) | Camera/upload | No | 5MB, JPG/PNG | -- | File type and size | -- |
| 12 | Signature | Signature pad | Configurable | -- | -- | Required if property setting enabled | "Signature is required for key checkout." |

**Key Return (Check-In) Flow**:
- "Check In" action on key checkout card or detail view
- Dialog fields: Return Time (auto: now), Condition Notes (optional, 200 chars), Returned By (auto: current user)
- Confirmation: "Return key {key name}? This will mark it as available."
- On confirm: Key status returns to "Available". Checkout event closed. Toast: "Key {name} returned."

**Overdue Key Alerts**:
- If a key is not returned by Expected Return time, an alert appears on the dashboard
- Notification sent to the guard who checked it out and to the Security Supervisor
- Overdue keys highlighted in red on the console

**Key Inventory View** (accessible via "View All Keys" link):

| Column | Description |
|--------|-------------|
| Key Name | Descriptive name (e.g., "Master Key #1", "Pool Room") |
| Key Number | System identifier |
| Status | Available, Checked Out, Lost, Decommissioned |
| Current Holder | Name (if checked out) |
| Checked Out Since | Timestamp (if checked out) |
| Actions | Select (for checkout), Edit (admin), History |

**Key Inventory Management** (Property Admin / Security Supervisor):
- Add Key: Name (required, 50 chars), Number (optional, 20 chars), Category (dropdown: Master, Unit, Common Area, Vehicle, Equipment, Other), Notes (optional, 200 chars)
- Bulk Add: CSV upload with columns: Name, Number, Category
- Edit Key: Same fields as Add
- Decommission Key: Soft delete with reason. Maintains history.

#### 3.1.10 Pass-On Log

**Create Pass-On Log Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Subject | Text input | Yes | 200 chars | Empty | Min 3 chars | "Subject must be at least 3 characters." |
| 2 | Priority | Dropdown | Yes | -- | "Normal" | Must select one | Options: Low, Normal, High, Urgent |
| 3 | Details | Rich text editor | Yes | 4000 chars | Empty | Min 10 chars | "Details must be at least 10 characters." |
| 4 | Attachments | File upload (multi) | No | 5 files, 10MB each | -- | File type and size | "Maximum 5 files. Each must be under 10MB." |
| 5 | Send To | Checkbox list | No | -- | All unchecked | -- | Shows all active security/concierge staff |
| 6 | Expires | DateTime picker | No | -- | +7 days from now | Must be in the future | "Expiry must be in the future." |

**"Send To" Behavior**:
- "Send to all team members" master checkbox at top
- Individual checkboxes for each staff member
- If no one selected, the log is created but no notification sent. It appears in the console for all staff to see.

**Rich Text Editor Toolbar**: Bold, Italic, Underline, Strikethrough, Bulleted List, Numbered List, Text Alignment, Font Size (12/14/16/18), Undo, Redo

#### 3.1.11 Cleaning Log

**Create Cleaning Log Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Area Cleaned | Dropdown (multi-select) | Yes | -- | -- | At least one | "Select at least one area." |
| 2 | Cleaning Type | Radio buttons | Yes | -- | "Routine" | -- | Options: Routine, Deep Clean, Emergency, Move-Out, Inspection Prep |
| 3 | Date/Time | DateTime picker | Yes | -- | Current time | Within last 4 hours | "Time must be within the last 4 hours." |
| 4 | Checklist | Checkbox list | Yes (configurable) | -- | Unchecked | At least 1 checked | "Complete at least one checklist item." |
| 5 | Notes | Textarea | No | 500 chars | Empty | -- | -- |
| 6 | Photos (Before) | Camera/upload (multi) | No | 3 files, 5MB each | -- | JPG/PNG | -- |
| 7 | Photos (After) | Camera/upload (multi) | No | 3 files, 5MB each | -- | JPG/PNG | -- |

**Area Options** (configurable per property): Lobby, Elevators, Hallways, Stairwells, Gym, Pool Area, Party Room, Rooftop, Parking Garage, Loading Dock, Mail Room, Laundry Room, Storage Areas, Exterior/Grounds, Other

**Checklist Items** (configurable per Area): Property Admin configures checklist items per area. Example for "Lobby": Floors Mopped, Glass Cleaned, Furniture Dusted, Trash Emptied, Mats Cleaned, Hand Sanitizer Refilled.

#### 3.1.12 General Note

**Create General Note Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | Unit # | Autocomplete text | No | 20 chars | Empty | Must match existing unit if provided | "No unit found." |
| 2 | Title | Text input | Yes | 200 chars | Empty | Min 3 chars | "Title must be at least 3 characters." |
| 3 | Date/Time | DateTime picker | Yes | -- | Current time | Within last 24 hours | -- |
| 4 | Details | Rich text editor | Yes | 4000 chars | Empty | Min 10 chars | "Please provide at least 10 characters." |
| 5 | Send Copy | Multi-select dropdown | No | -- | None | -- | Email recipients: Staff list + custom email |
| 6 | Attachments | File upload (multi) | No | 4 files, 10MB each | -- | File type and size | "Maximum 4 files. Each must be under 10MB." |

#### 3.1.13 Parking Violations

**Create Parking Violation Dialog**

| # | Field | Type | Required | Max Length | Default | Validation | Error Message |
|---|-------|------|----------|-----------|---------|------------|---------------|
| 1 | License Plate | Text input | Yes | 20 chars | Empty | Min 2 chars, alphanumeric | "Enter a valid license plate number." |
| 2 | Province/State | Dropdown | Yes | -- | Property's province | Must select | -- |
| 3 | Building | Dropdown | Yes (multi-building) | -- | Current building | -- | -- |
| 4 | Violation Type | Radio buttons | Yes | -- | -- | Must select | "Select a violation type." |
| 5 | Location | Text input | No | 100 chars | Empty | -- | Tooltip: "Where the violation was observed (e.g., P1 Level 2, Visitor Lot Spot #14)" |
| 6 | Description | Textarea | No | 500 chars | Empty | -- | -- |
| 7 | Vehicle Description | Text input | No | 200 chars | Empty | -- | Tooltip: "Color, make, model (e.g., Red Toyota Camry)" |
| 8 | Photos | Camera/upload (multi) | No | 3 files, 5MB each | -- | JPG/PNG | -- |
| 9 | Auto-Lift Ban On | Date picker | No | -- | Empty | Must be in the future if provided | "Ban expiry date must be in the future." |

**Violation Type Options**:
- Warning (no enforcement action, documentation only)
- Ticket (citation issued)
- Ban (vehicle prohibited from property)
- Vehicle Towed (enforcement action taken)

**Repeat Offender Detection**:
- When a license plate is entered, the system checks for previous violations
- If found: Yellow banner appears: "This plate has {X} previous violation(s). [View History]"
- AI capability: Suggests escalation if pattern detected (see Section 7)

#### 3.1.14 FOB / Access Device Management

Accessible from Security Console sidebar or Unit File.

**FOB Inventory per Unit**:

| Slot | Fields |
|------|--------|
| FOB 1-6 | Serial Number (text, 30 chars), Type (dropdown: Main Door, Garage, Elevator, Pool, Gym, Other), Status (Active, Lost, Deactivated), Assigned To (resident name), Issue Date, Notes |
| Buzzer Code 1-2 | Code (text, 10 chars), Type (Main/Visitor), Active (boolean), Notes |
| Garage Clicker 1-2 | Serial Number (text, 30 chars), Type (dropdown), Status (Active, Lost, Deactivated), Assigned To, Issue Date |

**Actions**: Add, Edit, Deactivate (with reason), Transfer (unit-to-unit), Report Lost (triggers security alert)

### 3.2 Enhanced Features (v2)

#### 3.2.1 Fire Log

Specialized incident report for fire events with a structured timeline workflow.

**Fire Log Fields** (in addition to standard Incident Report fields):

| Section | Fields |
|---------|--------|
| Alarm | Time alarm went off, Alarm location (floor/zone), Alarm type (smoke, heat, sprinkler, pull station, panel) |
| Initial Response | Time fire department called, Time first announcement made, Fire Safety Plan retrieved (checkbox), FD keys retrieved (checkbox), Residents needing assistance list pulled (checkbox) |
| Elevators | Status checklist per elevator: Elevator 1-4 (Responding/Not Responding/N/A) |
| Fire Department | Arrival time, Unit/Station number, Captain name |
| Resolution | Second announcement time, All-clear time, Third announcement time, FD departure time |
| Reset Checklist | Pull Station, Smoke Detector, Heat Detector, Sprinkler Head, Fire Panel, Mag Locks, Elevators (each: checkbox) |
| Post-Incident | Full report (rich text, 4000 chars), Photos, Documents |

#### 3.2.2 Noise Complaint Log

Specialized incident report with investigation structure.

**Noise Complaint Fields**:

| Section | Fields |
|---------|--------|
| Complaint | Nature of complaint (multi-select checkboxes): Loud Music, Banging/Hammering, Dog Barking, Children Playing, Party, Construction, Walking/Stomping, Cooking Odors, Smoking, Piano/Instrument, Verbal Argument, Other |
| Investigation | Complainant floor noise level (dropdown: Not noticeable, Faintly noticeable, Clearly noticeable, Loud, Very loud), Suspect floor noise level (same), Duration (dropdown: Under 5 min, 5-15 min, 15-30 min, 30-60 min, Over 1 hour), Volume assessment |
| Contact Attempt | Method (checkboxes: Phone, Door visit, Intercom, Not home), Result (dropdown: Resolved, Ongoing, No contact made) |
| Follow-Up | Complainant notified of action taken (checkbox), Follow-up required (checkbox) |

#### 3.2.3 Patrol / Inspection Rounds

Mobile-first patrol logging with GPS verification.

- **Checkpoint system**: Property Admin configures checkpoints (locations staff must visit during patrols)
- **NFC/QR scan**: Staff scans NFC tags or QR codes at each checkpoint to prove presence
- **GPS verification**: Optional GPS coordinate recording at each checkpoint
- **Patrol route**: Configurable sequence of checkpoints
- **Missed checkpoint alerts**: If a checkpoint is not scanned within the expected window, alert is generated
- **Patrol report**: Auto-generated report showing all checkpoints visited, timestamps, and any notes

#### 3.2.4 Emergency Broadcast Integration

Direct integration with the Announcements module for emergency scenarios.

- "Emergency" button on the console toolbar (red, prominent)
- Pre-configured emergency templates: Fire, Flood, Power Outage, Security Threat, Gas Leak, Medical Emergency, Elevator Entrapment, Other
- Multi-channel blast: Push notification + SMS + Email + Voice call (configurable cascade)
- Delivery tracking: Real-time dashboard showing notification delivery status per resident
- All-clear follow-up: Templated all-clear message with one click

#### 3.2.5 Pre/Post Inspection Log

Linked to amenity bookings for damage documentation.

| # | Field | Type | Required | Default |
|---|-------|------|----------|---------|
| 1 | Inspection Type | Toggle | Yes | "Pre-Inspection" (Pre/Post) |
| 2 | Linked Booking | Dropdown | No | Auto-populated if opened from booking |
| 3 | Amenity | Dropdown | Yes | Auto-populated from booking |
| 4 | Checklist | Configurable per amenity | Yes | Unchecked |
| 5 | Condition Notes | Rich text | No | Empty |
| 6 | Photos | Multi-upload | No | -- |
| 7 | Damage Found | Checkbox | No | Unchecked |
| 8 | Damage Description | Textarea (if damage found) | Yes (if damage) | Empty |
| 9 | Estimated Cost | Number input (if damage found) | No | 0.00 |

### 3.3 Future Features (v3+)

#### 3.3.1 Live Camera Feed Integration
- View camera feeds directly in the console (RTSP/ONVIF integration)
- Timestamp linking: Click a timeline event to jump to the corresponding camera footage
- Snapshot capture from feed and attach to events

#### 3.3.2 Visitor Pre-Registration
- Residents pre-register expected visitors via the resident portal
- Creates a "draft" visitor event that front desk confirms on arrival
- QR code sent to visitor for self-check-in at a kiosk

#### 3.3.3 Digital Signage Integration
- Console events flagged for "public display" appear on lobby screens
- Package notification display: "Unit 1205 -- You have a package at Front Desk"
- Emergency broadcast on all screens

#### 3.3.4 Biometric Access Log Integration
- Import access events from biometric readers (fingerprint, facial recognition)
- Correlate with visitor/authorized entry events
- Anomaly detection for unauthorized access attempts

---

## 4. Data Model

All Security Console data is built on the Unified Event Model defined in `01-architecture.md`. The Security Console adds specialized sub-entities for complex entry types.

### 4.1 Security Console Event Extensions

The base `Event` entity (see 01-Architecture, Section 3.1) provides: id, event_type_id, event_group_id, property_id, unit_id, resident_id, status, priority, created_by, created_at, updated_by, updated_at, closed_by, closed_at, title, description, comments, attachments, notification_sent, notification_channels, label_printed, signature, photo, location, reference_number, custom_fields, ai_metadata, audit_log.

The following entities extend Event for Security Console-specific data:

### 4.2 VisitorEntry

```
VisitorEntry
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── unit_id → Unit (FK)
├── visitor_name (varchar 100, NOT NULL)
├── visitor_type (enum: visitor, contractor, delivery_person, real_estate_agent, emergency_service, other)
├── arrival_at (timestamp with tz, NOT NULL)
├── departure_at (timestamp with tz, nullable -- null = still signed in)
├── expected_departure_at (timestamp with tz, nullable)
├── signed_out_by → User (FK, nullable)
├── parking_permit_id → VisitorParkingPermit (FK, nullable)
├── notify_resident (boolean, default true)
├── photo_url (varchar 500, nullable)
├── comments (text, 500 chars max)
└── created_at, updated_at

Indexes:
  - idx_visitor_property_arrival (property_id, arrival_at DESC)
  - idx_visitor_unit (unit_id)
  - idx_visitor_signed_in (property_id, departure_at IS NULL)
```

### 4.3 VisitorParkingPermit

```
VisitorParkingPermit
├── id (UUID, PK)
├── visitor_entry_id → VisitorEntry (FK)
├── property_id → Property (FK)
├── vehicle_make_model (varchar 100, NOT NULL)
├── license_plate (varchar 20, NOT NULL)
├── province_state (varchar 50, NOT NULL)
├── vehicle_color (varchar 30, nullable)
├── parking_area (varchar 100, nullable)
├── permit_start (timestamp with tz, NOT NULL)
├── permit_end (timestamp with tz, NOT NULL)
├── status (enum: active, expired, cancelled)
├── printed (boolean, default false)
└── created_at, updated_at

Indexes:
  - idx_parking_permit_plate (license_plate)
  - idx_parking_permit_active (property_id, status, permit_end)
```

### 4.4 PackageEntry

```
PackageEntry
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── unit_id → Unit (FK, NOT NULL)
├── resident_id → User (FK, nullable)
├── package_direction (enum: incoming, outgoing)
├── courier_id → CourierType (FK, nullable)
├── courier_other (varchar 50, nullable -- used when courier is "Other")
├── tracking_number (varchar 50, nullable)
├── package_type (enum: package, envelope, box_small, box_medium, box_large, perishable, flowers, dry_cleaning, pharmacy, grocery, furniture_oversized, other)
├── perishable (boolean, default false)
├── storage_spot (varchar 100, NOT NULL)
├── description (varchar 200, nullable)
├── photo_url (varchar 500, nullable)
├── released_at (timestamp with tz, nullable -- null = outstanding)
├── released_to (varchar 100, nullable)
├── released_by → User (FK, nullable)
├── release_signature_url (varchar 500, nullable)
├── release_photo_url (varchar 500, nullable)
├── release_comments (text, 500 chars, nullable)
├── notification_count (integer, default 0)
├── last_notified_at (timestamp with tz, nullable)
└── created_at, updated_at

Indexes:
  - idx_package_property_status (property_id, released_at IS NULL)
  - idx_package_unit (unit_id)
  - idx_package_tracking (tracking_number)
  - idx_package_courier (courier_id)
  - idx_package_perishable (property_id, perishable, released_at IS NULL)
```

### 4.5 CourierType

```
CourierType
├── id (UUID, PK)
├── property_id (UUID, nullable -- null = system default)
├── name (varchar 50, NOT NULL)
├── slug (varchar 50, NOT NULL)
├── icon_url (varchar 500, NOT NULL)
├── color (varchar 7, hex)
├── sort_order (integer)
├── active (boolean, default true)
└── created_at, updated_at

System defaults: Amazon, Canada Post, FedEx, UPS, DHL, Purolator, USPS, Individual Drop-Off, Property Management, Other
```

### 4.6 IncidentReport

```
IncidentReport
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── unit_id → Unit (FK, nullable)
├── incident_type_id → IncidentType (FK, NOT NULL)
├── title (varchar 200, NOT NULL)
├── report_body (text, 4000 chars, NOT NULL)
├── time_occurred (timestamp with tz, NOT NULL)
├── urgency (boolean, default false)
├── reported_by (varchar 100, nullable)
├── suspect_description (varchar 200, nullable)
├── emergency_services (JSONB, nullable -- structured: police, fire, ambulance, client, supervisor)
├── linked_incident_ids (UUID[], nullable -- related incidents)
├── resolution_summary (text, 2000 chars, nullable)
├── resolved_at (timestamp with tz, nullable)
├── resolved_by → User (FK, nullable)
├── escalated_at (timestamp with tz, nullable)
├── escalated_to → User (FK, nullable)
├── escalation_reason (text, 500 chars, nullable)
└── created_at, updated_at

Indexes:
  - idx_incident_property_status (property_id, status)
  - idx_incident_type (incident_type_id)
  - idx_incident_urgency (property_id, urgency, status)
  - idx_incident_occurred (property_id, time_occurred DESC)
```

### 4.7 IncidentType

```
IncidentType
├── id (UUID, PK)
├── property_id (UUID, nullable -- null = system default)
├── name (varchar 100, NOT NULL)
├── slug (varchar 50, NOT NULL)
├── default_priority (enum: low, normal, high, critical)
├── requires_emergency_services (boolean, default false)
├── auto_escalate (boolean, default false)
├── sort_order (integer)
├── active (boolean, default true)
└── created_at, updated_at
```

### 4.8 IncidentUpdate

```
IncidentUpdate
├── id (UUID, PK)
├── incident_report_id → IncidentReport (FK, NOT NULL)
├── update_text (text, 2000 chars, NOT NULL)
├── status_change (enum, nullable -- new status if changed)
├── attachments (JSONB, nullable -- [{filename, url, type, size}])
├── created_by → User (FK, NOT NULL)
└── created_at (immutable -- append-only)

Indexes:
  - idx_update_incident (incident_report_id, created_at DESC)
```

### 4.9 SecurityShift

```
SecurityShift
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── guard_id → User (FK, NOT NULL)
├── start_time (timestamp with tz, NOT NULL)
├── end_time (timestamp with tz, NOT NULL)
├── actual_end_time (timestamp with tz, nullable)
├── relieved_guard_id → User (FK, nullable)
├── relieving_guard_id → User (FK, nullable)
├── equipment_received (text, 500 chars, nullable)
├── equipment_returned (text, 500 chars, nullable)
├── opening_notes (text, 2000 chars, nullable)
├── closing_notes (text, 2000 chars, nullable)
├── ai_summary (text, 2000 chars, nullable)
├── status (enum: active, completed, abandoned)
├── log_entries[] → ShiftLogEntry
└── created_at, updated_at

Indexes:
  - idx_shift_property_guard (property_id, guard_id, start_time DESC)
  - idx_shift_active (property_id, status = 'active')
```

### 4.10 ShiftLogEntry

```
ShiftLogEntry
├── id (UUID, PK)
├── shift_id → SecurityShift (FK, NOT NULL)
├── entry_time (timestamp with tz, NOT NULL)
├── category (enum: general, patrol_round, building_check, resident_interaction, contractor_visit, alarm_response, other)
├── entry_text (text, 2000 chars, NOT NULL)
├── attachment_url (varchar 500, nullable)
├── created_by → User (FK, NOT NULL)
└── created_at (immutable)

Indexes:
  - idx_log_entry_shift (shift_id, entry_time DESC)
```

### 4.11 KeyCheckout

```
KeyCheckout
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── key_id → KeyInventory (FK, NOT NULL)
├── checked_out_to (varchar 100, NOT NULL)
├── company (varchar 100, nullable)
├── id_type (varchar 50, NOT NULL)
├── id_number (varchar 30, nullable)
├── reason (text, 500 chars, NOT NULL)
├── checkout_time (timestamp with tz, NOT NULL)
├── expected_return (timestamp with tz, nullable)
├── return_time (timestamp with tz, nullable -- null = still out)
├── returned_to → User (FK, nullable)
├── condition_notes (varchar 200, nullable)
├── id_photo_front_url (varchar 500, nullable)
├── id_photo_back_url (varchar 500, nullable)
├── signature_url (varchar 500, nullable)
├── checked_out_by → User (FK, NOT NULL)
└── created_at, updated_at

Indexes:
  - idx_key_checkout_property (property_id, return_time IS NULL)
  - idx_key_checkout_key (key_id)
  - idx_key_checkout_overdue (expected_return, return_time IS NULL)
```

### 4.12 KeyInventory

```
KeyInventory
├── id (UUID, PK)
├── property_id → Property (FK, NOT NULL)
├── key_name (varchar 50, NOT NULL)
├── key_number (varchar 20, nullable)
├── category (enum: master, unit, common_area, vehicle, equipment, other)
├── status (enum: available, checked_out, lost, decommissioned)
├── notes (varchar 200, nullable)
├── decommission_reason (varchar 200, nullable)
├── decommissioned_at (timestamp with tz, nullable)
├── created_by → User (FK, NOT NULL)
└── created_at, updated_at

Indexes:
  - idx_key_inventory_property_status (property_id, status)
```

### 4.13 PassOnLog

```
PassOnLog
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── subject (varchar 200, NOT NULL)
├── priority (enum: low, normal, high, urgent)
├── details (text, 4000 chars, NOT NULL)
├── expires_at (timestamp with tz, nullable)
├── notify_user_ids (UUID[], nullable -- staff to notify)
├── attachments (JSONB, nullable)
├── acknowledged_by (JSONB, nullable -- [{user_id, acknowledged_at}])
├── created_by → User (FK, NOT NULL)
└── created_at, updated_at

Indexes:
  - idx_pass_on_property (property_id, created_at DESC)
  - idx_pass_on_active (property_id, expires_at > NOW() OR expires_at IS NULL)
```

### 4.14 ParkingViolation

```
ParkingViolation
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── license_plate (varchar 20, NOT NULL)
├── province_state (varchar 50, NOT NULL)
├── building_id → Building (FK, nullable)
├── violation_type (enum: warning, ticket, ban, vehicle_towed)
├── location (varchar 100, nullable)
├── description (text, 500 chars, nullable)
├── vehicle_description (varchar 200, nullable)
├── photos (JSONB, nullable -- [{filename, url}])
├── auto_lift_on (date, nullable)
├── lifted_at (timestamp with tz, nullable)
├── lifted_by → User (FK, nullable)
├── lift_reason (varchar 200, nullable)
├── issued_by → User (FK, NOT NULL)
├── repeat_offender (boolean, default false)
├── previous_violation_count (integer, default 0)
└── created_at, updated_at

Indexes:
  - idx_violation_plate (license_plate)
  - idx_violation_property (property_id, created_at DESC)
  - idx_violation_active_bans (property_id, violation_type = 'ban', lifted_at IS NULL)
```

### 4.15 CleaningLog

```
CleaningLog
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── areas_cleaned (varchar[] -- array of area slugs)
├── cleaning_type (enum: routine, deep_clean, emergency, move_out, inspection_prep)
├── cleaned_at (timestamp with tz, NOT NULL)
├── checklist_completed (JSONB -- {area_slug: {item_slug: boolean}})
├── notes (text, 500 chars, nullable)
├── photos_before (JSONB, nullable -- [{url, filename}])
├── photos_after (JSONB, nullable -- [{url, filename}])
├── created_by → User (FK, NOT NULL)
└── created_at, updated_at

Indexes:
  - idx_cleaning_property (property_id, cleaned_at DESC)
  - idx_cleaning_area (property_id, areas_cleaned)
```

### 4.16 AuthorizedEntry

```
AuthorizedEntry
├── id (UUID, PK)
├── event_id → Event (FK, unique -- 1:1)
├── property_id → Property (FK)
├── unit_id → Unit (FK, NOT NULL)
├── authorized_person (varchar 100, NOT NULL)
├── company (varchar 100, nullable)
├── reason (varchar 200, NOT NULL)
├── entry_time (timestamp with tz, NOT NULL)
├── duration (enum: one_hour, two_hours, four_hours, full_day, until_departure)
├── departure_time (timestamp with tz, nullable)
├── id_verified (boolean, default false)
├── id_type (varchar 50, nullable)
├── id_number (varchar 30, nullable)
├── resident_notified (boolean, default false)
├── comments (text, 500 chars, nullable)
├── photo_url (varchar 500, nullable)
├── created_by → User (FK, NOT NULL)
└── created_at, updated_at

Indexes:
  - idx_auth_entry_property (property_id, entry_time DESC)
  - idx_auth_entry_unit (unit_id)
```

---

## 5. User Flows

### 5.1 Guard Starts Shift

```
1. Guard logs in → Directed to Security Console
2. Dashboard shows: "No active shift. Start your shift?" with prominent CTA
3. Guard clicks "Security Log" quick-create icon (or Alt+3)
4. Shift dialog opens with:
   - Info banner showing today's context (bookings, keys out, vacations, packages)
   - Start/End time pre-populated
   - Guard dropdown pre-populated with current user for "Relieved" (if previous shift ended)
5. Guard fills in: Relieved (selects previous guard), Equipment Received
6. Guard clicks "Save" → Loading: "Starting shift..."
7. Success: Toast "Shift started." Console header updates to show "Active Shift: [Guard Name] since [time]"
8. Permission check: Only Security Guard, Security Supervisor, Front Desk, Property Manager, Property Admin, Super Admin can create shifts

Edge cases:
- If a shift is already active for this guard: Warning "You already have an active shift. End it before starting a new one."
- If another guard has an active shift that overlaps: Info message "Note: [Other guard] has an active shift until [time]."
- Offline: Shift is queued and syncs when connection restored. Banner: "Shift saved offline. Will sync when connected."
```

### 5.2 Package Intake (Single)

```
1. Package arrives at front desk
2. Staff clicks "Package" icon (or Alt+2)
3. Package dialog opens with "Incoming" tab active
4. Staff types resident name → Autocomplete suggests matches
5. Selects resident → Unit auto-fills
6. Taps courier icon (e.g., Amazon) → Highlighted
7. Optional: Enters tracking number, selects package type, marks perishable
8. Selects storage spot from dropdown
9. Notification defaults to "Send to primary email"
10. Clicks "Save" or "Save & Print Label"
11. Success: Toast "Package PKG-2026-00148 logged for Unit 1205."
12. Resident receives notification: "A package from Amazon has arrived and is stored at Front Desk."

Permission check: Security Guard, Concierge, Security Supervisor, Property Manager, Admin roles
Edge cases:
- Unknown resident: Staff can type a name not in the system. Warning: "Recipient not found in resident directory. Package will be logged without resident notification."
- Duplicate tracking number: Warning "A package with this tracking number already exists (PKG-2026-00140). Continue anyway?"
- Perishable with no notification: Warning "This package is marked perishable but notification is set to None. Send notification?"
```

### 5.3 Package Release

```
1. Staff finds package in grid (filter by Type: Package, Status: Open)
2. Clicks "Release" quick action on card
3. Release dialog opens: "Release Package PKG-2026-00148"
4. Staff enters: Released To name
5. Optional: Checks "ID Verified", adds comments, captures signature
6. Clicks "Release" → Confirmation: "Release package PKG-2026-00148 to [name]?"
7. On confirm: Package status changes to "Released". Card updates.
8. Toast: "Package PKG-2026-00148 released to [name]."

Permission check: Security Guard, Concierge, Security Supervisor, Property Manager, Admin roles
Edge cases:
- Releasing to someone other than the resident: Info message "The recipient [name] does not match the resident [resident name]. Please verify identity."
- Package already released: Error "This package has already been released."
```

### 5.4 Incident Report and Escalation

```
1. Guard observes incident
2. Clicks "Incident Report" icon (or Alt+4)
3. Dialog opens with Incident Type dropdown and current time
4. Guard selects type (e.g., "Suspicious Activity") → AI suggests High priority
5. Guard writes description → AI checks grammar/tone (subtle inline corrections)
6. Guard sets Urgency to "Urgent"
7. Optional: Adds photos, fills suspect description
8. Clicks "Submit"
9. System:
   a. Creates incident with Open status
   b. AI analyzes: Suggests "Escalate to supervisor" based on urgency + type
   c. Notification sent to Security Supervisor
   d. AI links to 2 similar past incidents from last 90 days
10. Toast: "Incident INC-2026-00042 submitted. Supervisor notified."
11. Supervisor views incident, adds update, changes status to "Under Review"
12. Manager reviews, adds resolution, changes status to "Closed"

Permission check:
  - Create: Security Guard, Concierge, Security Supervisor, Property Manager, Admin
  - Escalate: Security Supervisor, Property Manager, Admin
  - Close: Security Supervisor, Property Manager, Admin
  - Guard can update and add to own incidents but cannot close them (unless configurable)

Edge cases:
- Draft saved but not submitted: Appears in "My Drafts" with yellow indicator
- Emergency services called: Emergency Services section auto-expands. Form prevents submission without filling Called time if "Yes" is selected.
- No unit associated: Valid -- incidents can occur in common areas
```

### 5.5 Key Checkout and Return

```
Checkout:
1. Contractor arrives needing access
2. Guard clicks "Key Checkout" icon (or Alt+6)
3. Selects key from inventory dropdown (only "Available" keys shown)
4. Enters: Checked Out To, Company, ID Type, ID Number, Reason
5. Optional: Captures ID photo, signature
6. Clicks "Deliver Key" → Key status changes to "Checked Out"
7. Toast: "Key [name] checked out to [person]."

Return:
1. Contractor returns key
2. Guard finds the checkout entry (filter by Type: Key Checkout, Status: Open)
3. Clicks "Check In" action
4. Return Time auto-fills to now. Optional condition notes.
5. Clicks "Return Key" → Key status returns to "Available"
6. Toast: "Key [name] returned."

Permission check: Security Guard, Security Supervisor, Property Manager, Admin
Edge cases:
- Key overdue: Dashboard alert after Expected Return. Guard and Supervisor notified.
- Key lost: "Report Lost" button on checkout detail. Key status changes to "Lost". Incident report auto-created.
- All keys checked out: Dropdown shows "No keys available" with link to View All Keys showing status.
```

### 5.6 End of Shift

```
1. Guard's shift is ending
2. Clicks "End Shift" on console header or shift detail
3. End Shift dialog:
   a. Actual End Time (default: now)
   b. Equipment Returned (textarea)
   c. Closing Notes (rich text)
   d. AI generates shift summary (loading for ~3 seconds)
4. AI Summary appears: "During this 8-hour shift, [Guard] logged 12 events: 5 visitor check-ins, 4 package intakes, 2 patrol rounds, and 1 incident report..."
5. Guard reviews and optionally edits the summary
6. Clicks "End Shift" → Shift status changes to "Completed"
7. Pass-On Log: Prompt appears: "Create a pass-on note for the next guard?"
8. Toast: "Shift ended. Summary saved."

Edge cases:
- Keys still checked out: Warning "You have X key(s) still checked out. Return them before ending your shift." (soft warning, not blocking)
- Visitors still signed in: Warning "X visitor(s) are still signed in." with option to batch sign out
- No log entries: Info "No log entries recorded during this shift. Add closing notes?"
```

---

## 6. UI/UX

### 6.1 Console Layout -- Desktop (>1024px)

```
+------------------------------------------------------------------+
|  [Logo]  Security Console         [Search] [Notif] [User Avatar]  |
+------------------------------------------------------------------+
|  Active Shift: John D. since 9:00 AM        [End Shift] [+ Shift] |
+------------------------------------------------------------------+
|  [Search............] [Type v] [Status v] [Date v] [Bldg v] [Reset]|
|  [Saved: Today's Packages] [My Incidents] [+ Save Filter]         |
+------------------------------------------------------------------+
|  Quick Create:                                                     |
|  (O) (O) (O) (O) (O) (O) (O) (O) (O)                            |
|  Vis  Pkg  Shft Inc  Auth Key  Pass Cln  Note                    |
+------------------------------------------------------------------+
|  [Card Grid] [Compact List] [Split View]    Group: [Time v]       |
+------------------------------------------------------------------+
|                                                                    |
|  TODAY                                                             |
|  +----------+ +----------+ +----------+ +----------+              |
|  | PKG      | | VST      | | INC      | | KEY      |              |
|  | Unit 1205| | Unit 506 | | Parking  | | Master#1 |              |
|  | Amazon   | | J. Smith | | Suspcious| | J. Doe   |              |
|  | 3 min ago| | 15 min   | | 1 hr ago | | 2 hrs    |              |
|  |  [Release]| | [Sign Out]| | [Open]  | | [Return] |              |
|  +----------+ +----------+ +----------+ +----------+              |
|                                                                    |
|  YESTERDAY                                                         |
|  +----------+ +----------+ +----------+ +----------+              |
|  | ...      | | ...      | | ...      | | ...      |              |
|  +----------+ +----------+ +----------+ +----------+              |
+------------------------------------------------------------------+
```

### 6.2 Console Layout -- Tablet (768-1024px)

- Filter bar wraps to 2 rows
- Quick-create icons in a single scrollable row
- Cards display 2 per row
- Split View not available (full-width card grid or list)
- Detail dialogs open as full-width bottom sheets

### 6.3 Console Layout -- Mobile (<768px)

- Filter bar collapses to: Search + Filter icon (opens full-screen filter panel)
- Quick-create icons: Horizontal scrollable row with overflow dots
- Cards: Full-width, stacked vertically, one per row
- Detail dialogs: Full-screen overlays with back button
- Touch targets: Minimum 44px height for all interactive elements
- Swipe actions: Swipe right on a visitor card to "Sign Out", swipe right on a package to "Release"

### 6.4 Empty States

| Screen | Empty State Message | Action |
|--------|-------------------|--------|
| Console (no events today) | "No events logged today. Use the icons above to create your first entry, or start your shift." | Quick-create icons remain visible and prominent |
| Console (filtered, no results) | "No events match your filters. [Clear Filters] to see all events, or adjust your search." | "Clear Filters" link resets to defaults |
| Package list (no outstanding) | "All packages have been released. Nice work! New packages will appear here when logged." | -- |
| Incident list (no open) | "No open incidents. Click + Incident Report to log one if needed." | Quick-create icon highlighted |
| Key inventory (empty) | "No keys in inventory. Ask your property administrator to add keys." | Link to Settings > Key Management (if admin) |
| Shift log (no entries) | "No log entries yet. Click + Add Entry to start documenting your shift." | "+ Add Entry" button |
| Pass-on log (empty) | "No pass-on notes. Create one to communicate important information to the next shift." | Quick-create icon highlighted |
| Saved filters (none) | "No saved filters yet. Set up filters above and click the save icon to create a quick-access preset." | -- |

### 6.5 Loading States

| Component | Loading Behavior |
|-----------|-----------------|
| Console page | Skeleton cards (8 placeholder cards with pulsing animation). Filter bar loads instantly. Quick-create icons load instantly. |
| Event cards (lazy load) | Cards load in batches of 20 with infinite scroll. Loading indicator at bottom: "Loading more events..." |
| Creation dialog | Fields render immediately. Autocomplete data fetches in background. Spinner in autocomplete dropdown while loading. |
| Detail view | Header renders with data. Sections load progressively (info first, then history, then attachments). Skeleton for slow sections. |
| AI features | Subtle shimmer animation on the field being processed. Text: "Analyzing..." or "Checking..." Small enough not to block the user. |
| Batch operations | Progress bar: "Saving package 3 of 10..." with per-row checkmarks as each completes. |

### 6.6 Error States

| Error Type | Display | User Action |
|-----------|---------|-------------|
| Network error | Red banner at top of console: "Connection lost. Changes will be saved when reconnected." Auto-dismiss on reconnect. | Wait for reconnect. Offline-queued changes sync automatically. |
| Form validation | Red border on invalid field. Error message below field in red text. Submit button remains disabled until all required fields are valid. | Fix the invalid field. Error clears on valid input. |
| Save failure (server) | Toast (error): "Failed to save. Please try again." Form data preserved. Retry button in toast. | Click retry or re-submit. |
| Permission denied | Toast (error): "You do not have permission to perform this action." | Contact admin. No retry possible. |
| Conflict (concurrent edit) | Modal: "This event was updated by [other user] at [time]. Your version / Their version. [Keep Mine] [Keep Theirs] [Merge]" | Select resolution option. |

### 6.7 Component Specifications

**Event Card**:
- Border radius: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.08)
- Padding: 16px
- Left border accent: 4px, color matches EventType color
- Hover: Shadow increases to 0 2px 8px rgba(0,0,0,0.12)
- Transition: all 0.15s ease
- Min height: 120px (desktop), 100px (mobile)

**Dialog/Modal**:
- Max width: 640px (single column), 960px (with sidebar)
- Border radius: 16px
- Backdrop: rgba(0,0,0,0.4)
- Animation: Slide up from bottom (mobile), fade in (desktop)
- Close: X button (top-right) + Escape key + click outside (with confirmation if unsaved data)

**Quick-Create Icon Button**:
- Size: 56px diameter (desktop), 44px (mobile)
- Background: System blue `#007AFF`
- Icon: 24px white SF Symbol or equivalent
- Label: 12px, medium weight, centered below
- Focus: 2px blue outline, 2px offset
- Active: Scale 0.95x, darker background

### 6.8 Tooltips

Tooltips use the info icon (i) for complex features. They appear on hover (desktop) or tap (mobile) with a 200ms delay.

| Feature | Tooltip Text |
|---------|-------------|
| Perishable checkbox | "Mark this package as perishable (food, flowers, medicine). Perishable packages get priority notifications and are highlighted on the dashboard so they are released quickly." |
| Urgency toggle | "Urgent incidents send immediate notifications to your supervisor and property manager. Use this for situations that need attention right now -- not for incidents that can wait until the next shift." |
| AI Summary | "This summary was generated automatically from the events logged during your shift. Review it for accuracy and edit anything that needs correction before saving." |
| Batch mode | "Log multiple packages at once. Each row creates a separate package entry. You can set different notification options for each package." |
| Saved filters | "Save your current filter combination for quick access. Saved filters appear as buttons below the search bar. You can save up to 10 filters." |
| Storage spot | "Where the package is physically stored. Your property administrator configures the available locations. If the package is too large for the standard spot, choose 'Oversized Storage' or 'Other'." |
| ID Verified checkbox | "Check this if you verified the person's identity using a government-issued ID. This is recorded in the audit trail for security compliance." |
| Expected Return (keys) | "When the key should be returned. If the key is not returned by this time, you and your supervisor will receive an overdue alert." |

---

## 7. AI Integration

All AI capabilities reference the patterns defined in `19-ai-framework.md`. The Security Console has 12 AI capabilities -- the most of any module.

### 7.1 AI-Assisted Input

#### 7.1.1 Report Grammar and Tone Correction (AI #1)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | When staff clicks "Submit" on any text field longer than 50 characters (incident reports, shift logs, pass-on notes) |
| **Input** | Raw text from the report field |
| **Output** | Corrected text with changes highlighted (strikethrough for removed, blue for added) |
| **UI** | Inline diff below the text field: "Suggested improvements:" with Accept All / Reject / Edit buttons |
| **Model** | Haiku (fast, $0.001/call) |
| **Fallback** | No correction shown. Manual proofreading. |
| **Privacy** | PII (resident names, unit numbers) stripped before API call. Replaced with tokens. Restored in response. |
| **User control** | Staff can toggle "Auto-correct my reports" in personal settings |

#### 7.1.2 Incident Category Auto-Suggestion (AI #2)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Debounced 500ms after typing stops in the "What Happened" field (minimum 20 characters) |
| **Input** | Description text (PII-stripped) |
| **Output** | Top 3 category suggestions with confidence percentages |
| **UI** | Below the Incident Type dropdown: 3 pills showing suggested categories. Click to select. Subtle grey text: "Suggested based on your description" |
| **Model** | Haiku ($0.001/call) |
| **Fallback** | Manual category selection from dropdown |

#### 7.1.3 Voice-to-Text Reporting (AI #9)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Microphone icon button on any rich text editor field |
| **Input** | Audio recording (up to 5 minutes) |
| **Output** | Structured text entry with auto-populated fields (type, location, suspect if mentioned) |
| **UI** | Microphone button next to text field. Recording indicator: red dot + timer. "Processing..." with waveform animation after recording. |
| **Model** | Whisper (speech-to-text) + Sonnet (structuring). $0.02/call |
| **Fallback** | Manual typing |
| **Default** | Disabled. Enabled by Super Admin per property. |

### 7.2 AI-Powered Analysis

#### 7.2.1 Incident Severity Scoring (AI #3)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | On incident submit (before save) |
| **Input** | Description + category + time of day + historical data for property |
| **Output** | Severity level (Low/Medium/High/Critical) with brief reasoning |
| **UI** | Severity badge auto-appears next to Priority field: "AI suggests: High -- [reason]". Staff can override. |
| **Model** | Haiku ($0.001/call) |
| **Fallback** | Manual severity selection |

#### 7.2.2 Similar Incident Linking (AI #11)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | On incident submit |
| **Input** | Current incident description (PII-stripped) |
| **Output** | Top 5 similar past incidents with relevance scores (0-100%) |
| **UI** | "Related Incidents" section on detail view. Cards showing: Reference #, Date, Title, Similarity %. Click to view. |
| **Model** | Embeddings (OpenAI) + Haiku. $0.002/call |
| **Fallback** | No automatic linking. Manual search. |

#### 7.2.3 Auto-Escalation Recommendation (AI #12)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | On incident submit |
| **Input** | Description + severity + category + time of day |
| **Output** | Escalate yes/no with reasoning |
| **UI** | If escalation recommended: Yellow banner on submit confirmation: "AI recommends escalating this incident. [Escalate Now] [Skip]" with brief reasoning. |
| **Model** | Haiku ($0.001/call) |
| **Fallback** | Manual escalation decision |

#### 7.2.4 Photo Analysis (AI #10)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | On photo upload for incidents or packages |
| **Input** | Uploaded photo + event context |
| **Output** | Damage assessment, hazard identification, condition notes |
| **UI** | Below the uploaded photo: "AI notes: [analysis]". Editable text field pre-populated with AI output. |
| **Model** | GPT-4o Vision. $0.01/call |
| **Default** | Disabled. Enabled per property. |
| **Fallback** | Manual description by staff |

### 7.3 AI-Generated Insights

#### 7.3.1 Pattern Detection (AI #4)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Daily scheduled job at 2:00 AM |
| **Input** | All incidents and events from past 30 days |
| **Output** | Pattern report: repeat offenders, time-based trends, location clusters, emerging issues |
| **UI** | "Insights" tab on Security Console (Supervisor and Manager roles only). Cards showing each pattern with charts. |
| **Model** | Sonnet. $0.01/call |
| **Default** | Enabled. Reports available to Supervisor+ roles. |
| **Fallback** | No automated report. Manual review of raw data. |

#### 7.3.2 Anomaly Detection (AI #5)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | On every new event creation |
| **Input** | Current event + 90-day historical data for the property |
| **Output** | Alert if the event is anomalous (e.g., incident at unusual time, unusual volume) |
| **UI** | If anomaly detected: Red dot on event card. Tooltip: "Unusual: [reason]". Also appears in Insights tab. |
| **Model** | Haiku. $0.002/call |
| **Fallback** | No real-time anomaly alerts |

#### 7.3.3 Shift Report Auto-Summarization (AI #6)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | End of shift (manual trigger via "End Shift" button, or auto at shift end time) |
| **Input** | All events and log entries during the shift |
| **Output** | Narrative summary (200-400 words) covering key events, visitor count, packages handled, incidents, notes |
| **UI** | Read-only text block in End Shift dialog. "AI Summary" label. Editable if staff wants to modify. |
| **Model** | Sonnet. $0.005/call |
| **Fallback** | Guard writes manual closing notes |

#### 7.3.4 Predictive Risk Assessment (AI #8)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Daily scheduled at 5:00 AM |
| **Input** | Historical incidents + weather API + event calendar + seasonal patterns |
| **Output** | Risk forecast for the upcoming 24 hours with recommended staffing levels |
| **UI** | Dashboard widget (Supervisor/Manager only): "Today's Risk Level: [Low/Medium/High]" with reasoning and staffing recommendation. |
| **Model** | Sonnet. $0.01/call |
| **Default** | Disabled. Opt-in per property. |
| **Fallback** | Standard staffing with no risk forecast |

#### 7.3.5 Guard Performance Scoring (AI #7)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Weekly scheduled (Monday 6:00 AM) |
| **Input** | All guard activity for the week: events logged, response times, report quality, patrol coverage |
| **Output** | Performance scorecard per guard with metrics and trend indicators |
| **UI** | "Team Performance" tab in Security Analytics (Supervisor only). Table with guard names, scores, and sparkline trends. |
| **Model** | Sonnet. $0.01/call |
| **Default** | Disabled. Opt-in per property. |
| **Fallback** | No automated scoring. Manual supervisor review. |

### 7.4 Model Selection and Cost

| AI Capability | Default Model | Est. Cost/Call | Monthly Est. (500-unit bldg) |
|--------------|---------------|----------------|------------------------------|
| Grammar/Tone Correction | Haiku | $0.001 | $1.50 (50 reports/day) |
| Category Auto-Suggestion | Haiku | $0.001 | $0.30 (10 incidents/day) |
| Severity Scoring | Haiku | $0.001 | $0.30 |
| Pattern Detection | Sonnet | $0.01 | $0.30 (daily) |
| Anomaly Detection | Haiku | $0.002 | $3.00 (50 events/day) |
| Shift Summarization | Sonnet | $0.005 | $0.45 (3 shifts/day) |
| Guard Performance | Sonnet | $0.01 | $0.04 (weekly) |
| Predictive Risk | Sonnet | $0.01 | $0.30 (daily) |
| Voice-to-Text | Whisper+Sonnet | $0.02 | $0.60 (1 report/day) |
| Photo Analysis | GPT-4o Vision | $0.01 | $1.50 (5 photos/day) |
| Similar Incident Linking | Embeddings+Haiku | $0.002 | $0.60 |
| Auto-Escalation | Haiku | $0.001 | $0.30 |
| **Total** | -- | -- | **~$9.19/month** |

### 7.5 Super Admin AI Controls

All controls defined in `19-ai-framework.md` Section 6 apply. Security Console-specific controls:

| Control | Options | Default |
|---------|---------|---------|
| Security Console AI (module toggle) | On / Off | On |
| Per-feature toggles (12 features) | On / Off each | See table in 7.4 |
| Grammar correction scope | All text fields / Incident reports only / Off | All text fields |
| Auto-escalation sensitivity | Conservative / Balanced / Aggressive | Balanced |
| Pattern detection lookback | 7 / 14 / 30 / 60 / 90 days | 30 days |
| Anomaly detection sensitivity | Low (fewer alerts) / Medium / High (more alerts) | Medium |
| Voice-to-text language | English / French / Spanish / Portuguese / Multilingual | English |

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric | Formula | Update Frequency | Visible To |
|--------|---------|-----------------|------------|
| Events Today | COUNT(events WHERE created_at = today AND property_id = current) | Real-time | All console users |
| Open Incidents | COUNT(incidents WHERE status IN (open, in_progress, escalated)) | Real-time | Guard, Supervisor, Manager |
| Unreleased Packages | COUNT(packages WHERE released_at IS NULL) | Real-time | All console users |
| Active Visitors | COUNT(visitors WHERE departure_at IS NULL) | Real-time | All console users |
| Keys Out | COUNT(key_checkouts WHERE return_time IS NULL) | Real-time | Guard, Supervisor, Manager |
| Avg. Incident Response Time | AVG(first_update_at - created_at) for incidents this month | Daily | Supervisor, Manager |
| Avg. Package Dwell Time | AVG(released_at - created_at) for packages this month | Daily | Supervisor, Manager |
| Shift Coverage | (hours_with_active_shift / total_hours) * 100 for current month | Daily | Supervisor, Manager |
| Events per Guard per Shift | COUNT(events) / COUNT(distinct guards) for selected period | Weekly | Supervisor, Manager |

### 8.2 Performance Metrics

| Metric | Formula | Threshold | Alert |
|--------|---------|-----------|-------|
| Incident Escalation Rate | COUNT(escalated) / COUNT(total incidents) * 100 | >30% = review | Weekly email to Supervisor |
| Package Release SLA | % of packages released within 24 hours | <90% = warning | Daily alert to Manager |
| Key Return Compliance | % of keys returned by expected time | <95% = warning | Per-occurrence alert |
| Shift Log Completeness | Shifts with >0 log entries / Total shifts * 100 | <80% = review | Weekly to Supervisor |
| Report Quality Score | AI grammar correction acceptance rate | <50% = training needed | Monthly report |
| Average Events per Shift | AVG(events logged) per shift period | Trend tracking | Monthly comparison |

### 8.3 Dashboards

#### 8.3.1 Security Operations Dashboard (Supervisor/Manager)

| Widget | Chart Type | X-Axis | Y-Axis | Data |
|--------|-----------|--------|--------|------|
| Events by Type | Horizontal bar chart | Event count | Event type | Last 30 days, grouped by type |
| Incident Trend | Line chart | Day | Count | Last 30 days, daily incident count |
| Package Volume | Area chart | Day | Count | Last 30 days, daily intake/release |
| Incident Status Distribution | Donut chart | -- | -- | Current: Open, In Progress, Escalated, Closed |
| Peak Activity Hours | Heatmap | Hour of day (0-23) | Day of week | Last 90 days, event count per hour/day |
| Top Incident Types | Treemap | -- | -- | Last 30 days, count by type |
| Guard Activity | Stacked bar | Guard name | Event count | Last 7 days, events by guard by type |
| Response Time Trend | Line chart | Week | Hours | Last 12 weeks, avg incident response time |

#### 8.3.2 Guard Shift Dashboard

| Widget | Chart Type | Data |
|--------|-----------|------|
| My Shift Summary | KPI cards | Events logged, packages handled, visitors signed in/out, patrol rounds |
| Active Items | Count badges | Unreleased packages, signed-in visitors, keys out, open incidents |
| Recent Activity | Timeline list | Last 20 events in reverse chronological order |

### 8.4 Alerts and Anomaly Detection

| Alert | Trigger | Recipients | Channel |
|-------|---------|------------|---------|
| Overdue Key | Key not returned by expected_return time | Guard who checked out + Supervisor | Push + In-app |
| Perishable Package Aging | Perishable package unreleased >4 hours | Guard on shift + Resident | Push + SMS |
| Incident Escalation | AI recommends escalation or manual escalation | Supervisor + Manager | Push + Email |
| Shift Gap | No active shift for >30 minutes during staffed hours | Supervisor | Push + SMS |
| Anomalous Event | AI anomaly detection flags an event | Supervisor | In-app |
| High Volume Alert | Event count exceeds 2x daily average within 2 hours | Supervisor + Manager | Push |
| Repeat Parking Violator | 3+ violations for same plate within 30 days | Security Supervisor | In-app + Email |
| Package Backlog | >20 unreleased packages | Manager | Email |

---

## 9. Notifications

### 9.1 Event Triggers and Recipients

| Event | Recipients | Channels | Template |
|-------|-----------|----------|----------|
| Visitor signed in | Unit resident (if notify enabled) | Email, Push | "Your visitor {name} has arrived and is at the front desk." |
| Visitor signed out | Unit resident | Push (optional) | "Your visitor {name} has departed." |
| Package received | Unit resident | Email (default), SMS, Push | "A {courier} {package_type} has arrived for your unit and is stored at {storage}. Reference: {ref#}." |
| Package reminder | Unit resident | Email, Push | "Reminder: You have an uncollected {package_type} ({ref#}) at {storage}. It arrived on {date}." |
| Package released | Unit resident | Push | "Your package {ref#} has been released to {released_to}." |
| Incident created (urgent) | Supervisor, Manager | Push, Email | "Urgent incident reported: {title}. Type: {type}. Location: {unit or area}." |
| Incident escalated | Manager, Admin | Push, Email, SMS | "Incident {ref#} has been escalated. Reason: {reason}. Please review immediately." |
| Key overdue | Guard, Supervisor | Push, In-app | "Key '{key_name}' is overdue. Checked out to {person} at {time}. Expected return: {expected}." |
| Shift started | Supervisor (optional) | In-app | "{guard} has started their shift." |
| Shift ended | Supervisor (optional) | In-app | "{guard} has ended their shift. {event_count} events logged." |
| Pass-on log created | Selected team members | Push, Email | "New pass-on note from {author}: {subject}" |
| Parking violation created | Supervisor | In-app | "Parking violation issued: {type} for plate {plate}." |
| Emergency broadcast | All residents + staff | Push, SMS, Email, Voice | "{emergency_type}: {message}" |

### 9.2 Notification Templates

Each notification template supports:
- **Variables**: `{resident_name}`, `{unit_number}`, `{ref_number}`, `{courier}`, `{package_type}`, `{storage}`, `{visitor_name}`, `{guard_name}`, `{incident_title}`, `{key_name}`, `{date}`, `{time}`
- **Channel-specific formatting**: Full HTML for email, 160 chars for SMS, 100 chars for push
- **Property admin customization**: Templates are editable per property. System defaults provided.
- **Multi-language**: Templates can be created per language. Resident's language preference determines which template is used.

### 9.3 Notification Preferences

Residents control their preferences per notification type:

| Notification Type | Email | SMS | Push | Off |
|-------------------|-------|-----|------|-----|
| Package received | Default | Opt-in | Opt-in | Allowed |
| Package reminder | Default | Off | Opt-in | Allowed |
| Visitor arrival | Opt-in | Off | Opt-in | Allowed |
| Emergency broadcast | Always on | Always on | Always on | Not allowed |

Staff notifications are configured by the Property Admin and cannot be individually disabled for safety-critical alerts.

---

## 10. API

### 10.1 REST Endpoints

All endpoints require authentication via Bearer token. Property isolation enforced at middleware layer.

#### Events (Unified)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/properties/{propertyId}/events` | List events with filters (type, status, date range, unit, search) | Guard, Concierge, Supervisor, Manager, Admin |
| GET | `/api/v1/properties/{propertyId}/events/{eventId}` | Get event detail | Guard, Concierge, Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/events` | Create event (generic) | Guard, Concierge, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/events/{eventId}` | Update event | Creator (own), Supervisor, Manager, Admin |
| DELETE | `/api/v1/properties/{propertyId}/events/{eventId}` | Soft-delete event | Manager (configurable), Admin |

#### Visitors

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/properties/{propertyId}/visitors` | Sign in visitor | Guard, Concierge, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/visitors/{id}/sign-out` | Sign out visitor | Guard, Concierge, Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/visitors/batch-sign-out` | Sign out all visitors | Supervisor, Manager, Admin |

#### Packages

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/properties/{propertyId}/packages` | Log package | Guard, Concierge, Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/packages/batch` | Log multiple packages | Guard, Concierge, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/packages/{id}/release` | Release package | Guard, Concierge, Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/packages/{id}/notify` | Send reminder notification | Guard, Concierge, Supervisor, Manager, Admin |

#### Incidents

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/properties/{propertyId}/incidents` | Create incident | Guard, Concierge, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/incidents/{id}` | Update incident | Creator (own), Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/incidents/{id}/updates` | Add update | Guard (own incidents), Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/incidents/{id}/escalate` | Escalate incident | Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/incidents/{id}/close` | Close incident | Supervisor, Manager, Admin |

#### Security Shifts

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/properties/{propertyId}/shifts` | Start shift | Guard, Concierge, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/shifts/{id}/end` | End shift | Creator, Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/shifts/{id}/entries` | Add log entry | Creator, Supervisor |
| GET | `/api/v1/properties/{propertyId}/shifts/active` | Get active shift for current user | Guard, Concierge |

#### Keys

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/properties/{propertyId}/keys` | List key inventory | Guard, Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/keys` | Add key to inventory | Supervisor, Manager, Admin |
| POST | `/api/v1/properties/{propertyId}/key-checkouts` | Check out key | Guard, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/key-checkouts/{id}/return` | Return key | Guard, Supervisor, Manager, Admin |

#### Parking Violations

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/properties/{propertyId}/parking-violations` | Create violation | Guard, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/parking-violations/{id}/lift` | Lift ban/violation | Supervisor, Manager, Admin |
| GET | `/api/v1/properties/{propertyId}/parking-violations/plate/{plate}` | Get violation history for plate | Guard, Supervisor, Manager, Admin |

#### Pass-On Logs

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/v1/properties/{propertyId}/pass-on-logs` | Create pass-on note | Guard, Concierge, Supervisor, Manager, Admin |
| PATCH | `/api/v1/properties/{propertyId}/pass-on-logs/{id}/acknowledge` | Mark as acknowledged | Guard, Concierge, Supervisor, Manager, Admin |

#### Analytics

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/properties/{propertyId}/security/analytics` | Get analytics dashboard data | Supervisor, Manager, Admin |
| GET | `/api/v1/properties/{propertyId}/security/analytics/export` | Export analytics (Excel/PDF) | Supervisor, Manager, Admin |
| GET | `/api/v1/properties/{propertyId}/security/insights` | Get AI-generated insights | Supervisor, Manager, Admin |

### 10.2 Request/Response Examples

**Create Visitor (POST /api/v1/properties/{propertyId}/visitors)**

Request:
```json
{
  "unit_id": "uuid-1205",
  "visitor_name": "John Smith",
  "visitor_type": "visitor",
  "expected_departure_at": "2026-03-14T17:00:00-05:00",
  "needs_parking": true,
  "parking": {
    "vehicle_make_model": "Black Audi A4",
    "license_plate": "XLUCKY",
    "province_state": "Ontario",
    "vehicle_color": "Black",
    "parking_area": "Visitor Lot",
    "permit_end": "2026-03-14T17:00:00-05:00"
  },
  "comments": "Visiting for dinner",
  "notify_resident": true
}
```

Response (201 Created):
```json
{
  "id": "uuid-visitor-1",
  "event_id": "uuid-event-1",
  "reference_number": "VST-2026-00903",
  "unit_id": "uuid-1205",
  "unit_number": "1205",
  "visitor_name": "John Smith",
  "visitor_type": "visitor",
  "arrival_at": "2026-03-14T13:00:00-05:00",
  "departure_at": null,
  "expected_departure_at": "2026-03-14T17:00:00-05:00",
  "parking_permit": {
    "id": "uuid-permit-1",
    "vehicle_make_model": "Black Audi A4",
    "license_plate": "XLUCKY",
    "province_state": "Ontario",
    "permit_start": "2026-03-14T13:00:00-05:00",
    "permit_end": "2026-03-14T17:00:00-05:00",
    "status": "active"
  },
  "notify_resident": true,
  "notification_sent": true,
  "created_by": {
    "id": "uuid-guard-1",
    "name": "Jane Doe"
  },
  "created_at": "2026-03-14T13:00:00-05:00"
}
```

**Error Response (422 Unprocessable Entity)**:
```json
{
  "error": "validation_error",
  "message": "Request validation failed.",
  "details": [
    {
      "field": "visitor_name",
      "message": "Visitor name must be at least 2 characters."
    },
    {
      "field": "parking.license_plate",
      "message": "Enter a valid license plate number."
    }
  ]
}
```

### 10.3 WebSocket Events

Real-time updates pushed to connected clients:

| Event | Payload | Broadcast To |
|-------|---------|-------------|
| `event.created` | Full event object | All console users for the property |
| `event.updated` | Event ID + changed fields | All console users for the property |
| `event.closed` | Event ID + closed_by + closed_at | All console users for the property |
| `visitor.signed_out` | Visitor ID + departure_at | All console users for the property |
| `package.released` | Package ID + released_to + released_at | All console users for the property |
| `shift.started` | Shift ID + guard name + start_time | All console users for the property |
| `shift.ended` | Shift ID + guard name + event count | All console users for the property |
| `key.overdue` | Key checkout ID + key name + expected_return | Guard + Supervisor |
| `incident.escalated` | Incident ID + escalation reason | Supervisor + Manager |
| `alert.anomaly` | Event ID + anomaly description | Supervisor |

---

## 11. Completeness Checklist

### Functional Coverage

| Item | Status | Section |
|------|--------|---------|
| 9+ entry types with dedicated creation forms | Defined | 3.1.3 - 3.1.12 |
| Unified event grid with card/list/split views | Defined | 3.1.1 |
| Filter bar with 7 filter dimensions + saved presets | Defined | 3.1.2 |
| Batch event creation (packages) | Defined | 3.1.5 |
| Visitor management (sign in, sign out, parking, batch sign out) | Defined | 3.1.4 |
| Package lifecycle (intake, track, notify, release, batch) | Defined | 3.1.5 |
| Incident management (create, update, escalate, close, link) | Defined | 3.1.7 |
| Security shift (start, log entries, end, AI summary) | Defined | 3.1.6 |
| Key checkout and return with ID verification | Defined | 3.1.9 |
| Key inventory management | Defined | 3.1.9 |
| Pass-on log with team notification | Defined | 3.1.10 |
| Cleaning log with checklists and before/after photos | Defined | 3.1.11 |
| General notes | Defined | 3.1.12 |
| Parking violations with repeat offender detection | Defined | 3.1.13 |
| FOB/Access device management | Defined | 3.1.14 |
| Fire log with structured timeline (v2) | Defined | 3.2.1 |
| Noise complaint with investigation structure (v2) | Defined | 3.2.2 |
| Patrol rounds with checkpoint verification (v2) | Defined | 3.2.3 |
| Emergency broadcast integration (v2) | Defined | 3.2.4 |
| Pre/Post inspection log (v2) | Defined | 3.2.5 |

### Data Model Coverage

| Item | Status | Section |
|------|--------|---------|
| All entities with fields, types, constraints | Defined | 4.1 - 4.16 |
| Foreign key relationships | Defined | All entities |
| Indexes for query performance | Defined | All entities |
| JSONB for flexible/configurable data | Defined | IncidentReport, CleaningLog, ParkingViolation, PassOnLog |
| 1:1 relationship to base Event entity | Defined | All sub-entities |

### UI/UX Coverage

| Item | Status | Section |
|------|--------|---------|
| Desktop layout | Defined | 6.1 |
| Tablet layout | Defined | 6.2 |
| Mobile layout | Defined | 6.3 |
| Empty states for all screens | Defined | 6.4 |
| Loading states for all components | Defined | 6.5 |
| Error states for all failure modes | Defined | 6.6 |
| Component specifications | Defined | 6.7 |
| Tooltips for complex features | Defined | 6.8 |
| Keyboard shortcuts | Defined | 3.1.3 |
| Accessibility (focus rings, touch targets) | Defined | 6.3, 6.7 |

### AI Coverage

| Item | Status | Section |
|------|--------|---------|
| All 12 AI capabilities specified | Defined | 7.1 - 7.3 |
| Model selection per capability | Defined | 7.4 |
| Cost estimates per capability | Defined | 7.4 |
| Graceful degradation per capability | Defined | 7.1 - 7.3 |
| Super Admin controls | Defined | 7.5 |
| Privacy (PII stripping) | Defined | 7.1.1 |

### Permission Coverage

| Item | Status | Section |
|------|--------|---------|
| Per-role access defined | Defined | 1 (Overview), 5 (User Flows) |
| Create/Read/Update/Delete per role | Defined | 02-Roles Section 3.1 (referenced) |
| Permission checks in user flows | Defined | 5.1 - 5.6 |
| API role enforcement | Defined | 10.1 |

### Integration Coverage

| Item | Status | Section |
|------|--------|---------|
| REST API endpoints | Defined | 10.1 |
| Request/Response schemas | Defined | 10.2 |
| WebSocket real-time events | Defined | 10.3 |
| Notification events and templates | Defined | 9.1 - 9.2 |
| Analytics metrics and dashboards | Defined | 8.1 - 8.3 |
| Alerts and anomaly detection | Defined | 8.4 |

### Cross-References

| Dependency | Document | What We Reference |
|-----------|----------|-------------------|
| Unified Event Model | 01-architecture.md Section 3 | Base Event entity, EventType, EventGroup |
| Role permissions | 02-roles-and-permissions.md Section 3.1 | Security Console permission matrix |
| AI capabilities | 19-ai-framework.md Section 4.1 | All 12 Security Console AI features |
| AI controls | 19-ai-framework.md Section 6 | Super Admin control panel |
| Notification system | 01-architecture.md | Multi-channel notification infrastructure |

---

*End of document.*
*Total entry types: 9 (v1) + 5 (v2) + 4 (v3+)*
*Total data model entities: 16*
*Total AI capabilities: 12*
*Total API endpoints: 25+*
*Total notification types: 13*
