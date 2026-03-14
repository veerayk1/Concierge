# Security & Concierge — Granular Deep Dive

Field-level documentation of every element in Condo Control's Security & Concierge module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/security/console/`
**Sidebar menu**: Security & Concierge (shield icon, expandable section — no sub-items)
**Breadcrumb**: None (console is a single-page application with dialogs)
**Page title**: "Security & Concierge | Condo Control"

The Security & Concierge Console is the **primary operational hub** for security staff. It combines a unified event stream with quick-create icons for 7 entry types. All creation and detail views open as **jQuery UI dialogs** overlaid on the console — no separate pages.

**Role access**: Security & Concierge has **full read/write access** — can create all entry types, view details, sign out visitors, release packages, update incident reports, create security shifts, and manage pass-on logs.

**Architecture**: Uses `NewItemDialog(type, jsonUrl)` JavaScript function for all creation dialogs. The function loads a dialog template based on the type parameter and fetches autocomplete data from the JSON URL.

---

## 2. Console Landing Page

**URL**: `/security/console/`

### 2.1 Filter Bar

| # | Field | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Search | Text input | (unnamed) | Empty | Free-text search. Placeholder: "Provide at least 3 digits/letters to search" |
| 2 | Filter | Select dropdown | `ddlFilter` | "Show All" | 20 filter options (see §2.2) |
| 3 | Search | Button | — | — | Teal `btn-primary`. Type: submit |
| 4 | Advanced Search | Link | — | — | Teal text. Toggles Advanced Search panel (see §2.3) |
| 5 | Reset | Link | — | — | Teal text. Clears all filters |

### 2.2 Filter Dropdown Options (Complete — 20 options)

| # | Value | Label | Description |
|---|-------|-------|-------------|
| 1 | `all` | Show All | Default. All entry types |
| 2 | `visitor-all` | All Visitors | All visitor entries |
| 3 | `visitor-signrd-in` | -Visitors Still Signed In | Sub-filter (dash-prefixed). Currently signed in |
| 4 | `visitor-signrd-out` | -Visitors Signed Out | Sub-filter. Already departed |
| 5 | `visitor-not-signed-in-yet` | -Visitors Not Signed In Yet | Sub-filter. Expected but not arrived |
| 6 | `package-all` | All Packages | All package entries |
| 7 | `package-outstanding` | -Outstanding Packages | Sub-filter. Not yet released/picked up |
| 8 | `package-delivered` | -Delivered Packages | Sub-filter. Already released |
| 9 | `security-shift` | Security Shift / Logs | Security shift entries with logs |
| 10 | `incident-report-all` | Incident Reports | All incident reports |
| 11 | `incident-report-open` | -Open Incident Reports | Sub-filter. Open status |
| 12 | `incident-report-closed` | -Closed Incident Reports | Sub-filter. Closed status |
| 13 | `incident-report-draft` | -Draft Incident Reports | Sub-filter. Draft status |
| 14 | `authorized-entries` | Authorized Entries | Authorized unit entry logs |
| 15 | `master-key` | Key Checkouts | All key checkouts |
| 16 | `master-key-checkedIn` | -Keys Checked In | Sub-filter. Keys returned |
| 17 | `master-key-checkedOut` | -Keys Checked Out | Sub-filter. Keys currently out |
| 18 | `pass-on-log` | Pass-On Logs | Shift handoff notes |
| 19 | `security-patrol` | Security Patrol | Patrol round entries |
| 20 | `valet-parking` | Valet Parking | Valet parking entries |

**Note**: Sub-filters are prefixed with a dash (`-`) in the label text, creating a visual hierarchy in the dropdown. The `visitor-signrd-in` value has a typo ("signrd" instead of "signed").

### 2.3 Advanced Search Panel

Toggled by clicking "Advanced Search" link. Collapsible panel with:

| # | Field | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | **Time Frame** heading | — | — | Section label |
| 2 | Start Time: | Text input (datetime) | Empty | Start date/time filter |
| 3 | End Time: | Text input (datetime) | Empty | End date/time filter |
| 4 | **Search Accuracy** heading | — | — | Section label |
| 5 | Exact Match | Radio button | Selected | Match exact search terms |
| 6 | Allow broad match | Radio button | Not selected | Fuzzy/broad matching |

**Validation**: "End date must be after start date." (validation message present in DOM)

---

## 3. Create Entry Icons

**Section heading**: "Click to create a new entry:" (grey text above icons)

7 teal circular icons arranged horizontally. Each triggers `NewItemDialog(type, jsonUrl)`.

| # | Icon | Label (tooltip) | Type Parameter | JSON URL | Description |
|---|------|-----------------|----------------|----------|-------------|
| 1 | Person with badge | Visitor Parking | `visitor` | `/security/get-json-user-list-for-visitors/` | Log a visitor with optional parking |
| 2 | Box/package | Package Tracking | `package` | `/security/get-json-user-list/` | Log incoming/outgoing package |
| 3 | Clipboard/shield | Security Log | `securitylog` | `/security/get-json-unit-list/` | Create new security shift |
| 4 | Document/report | Incident Report | `incidentreport` | `/security/get-json-unit-list/` | File an incident report |
| 5 | Door/entry | Authorized Entry | `authorizedentry` | `/security/get-json-unit-list/` | Log authorized unit entry |
| 6 | Key | Key Checkout | `masterkey` | `/security/get-json-unit-list/` | Log key checkout |
| 7 | Notepad/handoff | Pass-On Log | `passonlog` | `/security/get-json-unit-list/` | Create shift handoff note |

**Icon style**: Teal circular backgrounds (~60px diameter) with white outlined icons. Hover: slight opacity change.

**JSON URL pattern**: Two variants:
- `/security/get-json-user-list-for-visitors/` — Returns user list optimized for visitor lookup
- `/security/get-json-unit-list/` — Returns unit list for autocomplete (used by 5 of 7 types)
- `/security/get-json-user-list/` — Returns full user list (packages)

---

## 4. Events Table

The main console table shows all entries in reverse chronological order.

### 4.1 Table Columns

| # | Column | Description |
|---|--------|-------------|
| 1 | Type | Entry type text: "Visitor", "Package", "Security Shift", "Incident Report", "Authorized Entry", "Key Checkout", "Pass-On Log" |
| 2 | Reference # | Auto-generated sequential number (e.g., 903, 7259, 2327, 1766) |
| 3 | When | Date/time. Format: MM/DD/YYYY HH:MM:SS (24-hour) |
| 4 | What happened (click for full details) | Clickable teal link. Opens detail dialog. Descriptive text varies by type |
| 5 | Unit | Unit number (e.g., 0506, 1205). Empty for Security Shifts and some Incident Reports |
| 6 | Action | Context-specific action link (e.g., "Sign Out" for visitors, "Release" for packages) |

**Table header style**: Dark teal background, white text.

### 4.2 "What happened" Link Text Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Visitor (signed in) | "Visitor {name} signed in" | "Visitor Lucky signed in" |
| Visitor (signed out) | "Visitor {name} signed out" | "Visitor Mariana signed out" |
| Package (received) | "{Description} received for {LAST, First} ({unit}) from {courier} stored at {location}." | "Envelope received for WISENER, Andrew (1817) from Property Manager stored at Security Desk." |
| Package (picked up) | "Package picked up by {name}" | "Package picked up by Amit" |
| Security Shift | "{guard} security log for {date}" | "Junaid security log for 3/13/2026" |
| Incident Report | Free text title | "Improperly parked vehicle observed at P1" |

### 4.3 Action Column Values

| Type | Action | Condition |
|------|--------|-----------|
| Visitor (signed in) | "Sign Out" (teal link) | Visitor still signed in |
| Visitor (signed out) | (empty) | Visitor already departed |
| Package (outstanding) | "Release" (teal link) | Package not yet picked up |
| Package (delivered) | (empty) | Package already released |
| Security Shift | (empty) | No inline action |
| Incident Report | (empty) | No inline action |

### 4.4 Pagination

| # | Element | Description |
|---|---------|-------------|
| 1 | First | Navigate to first page |
| 2 | Previous | Navigate to previous page |
| 3 | Page numbers | 1, 2, 3... 10 + "..." | Current page highlighted |
| 4 | Next | Navigate to next page |
| 5 | Last | Navigate to last page |

**Pagination URL pattern**: `/security/Console?Page={pageNumber}`
**Total pages**: 1000+ (Last link points to Page=1000)
**Events per page**: 10
**Total events**: ~10,000+ entries

---

## 5. Creation Dialog: Visitor Parking

**Dialog title**: "New Visitor" (teal header bar with ✕ close button)
**Trigger**: `NewItemDialog('visitor', '/security/get-json-user-list-for-visitors/')`

### 5.1 Form Fields

| # | Label | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Unit # | Text input (autocomplete) | — | Empty | Autocomplete from user list. Populates unit data |
| 2 | Visitor Name | Text input | — | Empty | Placeholder: "New Visitor Name" |
| 3 | Visitor / Contractor | Toggle radio | — | Visitor | Two options: "Visitor" (default) / "Contractor" |
| 4 | Does the visitor need parking? | Checkbox | — | Unchecked | When checked, expands vehicle details section |
| 5 | Comments | Textarea | — | Empty | Free-text comments |

**Parking Details** (shown when parking checkbox is checked):

| # | Label | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Make / Model | Text input | Empty | Vehicle make and model |
| 2 | License Plate # | Text input | Empty | License plate number |
| 3 | Province | Text input | Empty | Province/state of plate |
| 4 | Parking Until | Datetime input | (pre-populated) | When parking permit expires |

### 5.2 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save | Teal `btn-primary` | Creates the visitor entry |
| 2 | Cancel | Dark outlined | Closes dialog without saving |

---

## 6. Creation Dialog: Package Tracking

**Dialog title**: "New Package" (teal header bar)
**Trigger**: `NewItemDialog('package', '/security/get-json-user-list/')`

### 6.1 Tabs

| # | Tab | Default | Description |
|---|-----|---------|-------------|
| 1 | Incoming | Yes (active) | Log a received package |
| 2 | Outgoing | No | Log an outgoing package |

### 6.2 Incoming Package Form Fields

| # | Label | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Ref# | Read-only text | — | Auto-generated (e.g., "7260") | Sequential reference number |
| 2 | Recipient | Text input (autocomplete) | — | Empty | Resident name autocomplete |
| 3 | Unit | Text input (autocomplete) | — | Empty | Auto-populated from recipient or manual entry |
| 4 | Courier | Icon grid | — | None selected | 10 courier options as clickable icons (see §6.3) |
| 5 | Tracking # | Text input | — | Empty | Package tracking number |
| 6 | Description | Text input | — | Empty | Package description (e.g., "Package", "Envelope", "White Package") |
| 7 | Perishable | Checkbox | — | Unchecked | Mark as perishable/time-sensitive |
| 8 | Storage Spot | Dropdown/text | — | "Security Desk" | Where the package is stored |

### 6.3 Courier Grid (10 Options)

Icon-based grid of courier/delivery companies:

| # | Courier | Icon |
|---|---------|------|
| 1 | Amazon | Amazon logo |
| 2 | Canada Post | Canada Post logo |
| 3 | Canpar | Canpar logo |
| 4 | DHL | DHL logo |
| 5 | FedEx | FedEx logo |
| 6 | Individual Drop-Off | Person icon |
| 7 | Other | Generic box icon |
| 8 | Property Manager | Building icon |
| 9 | Purolator | Purolator logo |
| 10 | UPS | UPS logo |

**Selection behavior**: Click to select (highlighted border). Only one can be selected at a time.

### 6.4 Multi-Package Feature

| # | Element | Description |
|---|---------|-------------|
| 1 | "Log Multiple Packages" | Button/link. Opens multi-entry mode for batch package logging |

### 6.5 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save | Teal `btn-primary` | Creates the package entry |
| 2 | Cancel | Dark outlined | Closes without saving |

---

## 7. Creation Dialog: Security Log (New Shift)

**Dialog title**: "Security Log" (teal header bar)
**Trigger**: `NewItemDialog('securitylog', '/security/get-json-unit-list/')`

### 7.1 Info Banner

Light blue/teal info box at top of dialog with live counts:

| # | Content | Example |
|---|---------|---------|
| 1 | Bookings count | "You have 0 booking(s) for today." |
| 2 | Keys checked out | "0 key(s) are checked out." |
| 3 | Vacations count | "0 people are on vacation." |

**Instruction text**: "You need to create a shift before you can create security logs."

### 7.2 Form Fields

| # | Label | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Start Time | Datetime input | Pre-populated with shift start (e.g., "3/13/2026 9:00:00 PM") | Shift start date/time |
| 2 | End Time | Datetime input | Pre-populated with shift end (e.g., "3/14/2026 5:00:00 AM") | Shift end date/time |
| 3 | Relieved | Select dropdown | "Select Guard" | Guard being relieved. 9 guards + "N/A - I am the first shift for today" |
| 4 | To Be Relieved By | Select dropdown | "Select Guard" | Next guard. 9 guards + "N/A - I am the last shift for today" |
| 5 | Equipment Received | Text input | Empty | Free-text field for equipment handoff notes |

### 7.3 Guard Dropdown Options (9 guards)

| # | Guard Name |
|---|-----------|
| 1 | Mrs. Dhana Lakshmi |
| 2 | Dillan Mohammed |
| 3 | Mr. Harsh Harsh |
| 4 | Temp Concierge |
| 5 | Mr. Junaid Syed |
| 6 | Manjot Singh |
| 7 | Security Front Desk |
| 8 | Mr. Nithin Surabhi |
| 9 | Mr. Ravi Chandra |

**Special options**:
- Relieved dropdown: Includes "N/A - I am the first shift for today"
- To Be Relieved By dropdown: Includes "N/A - I am the last shift for today"

### 7.4 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save | Teal `btn-primary` | Creates the security shift |
| 2 | Cancel | Dark outlined | Closes without saving |

---

## 8. Creation Dialog: Incident Report

**Dialog title**: "New Incident Report" (teal header bar)
**Trigger**: `NewItemDialog('incidentreport', '/security/get-json-unit-list/')`

### 8.1 Form Fields

| # | Label | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Unit # | Text input (autocomplete) | — | Empty | Optional unit association |
| 2 | Type | Select dropdown | `CRUDDataObject_Type` | (first option) | 17 incident types (see §8.2) |
| 3 | What Happened? | Textarea | — | Empty | Free-text incident description |
| 4 | Time Occurred | Datetime input | Current date/time | When the incident occurred |
| 5 | Urgency | Toggle | — | "Not Urgent" | Two states: "Not Urgent" / "Urgent" (with visual indicator) |
| 6 | Photos | File upload | — | — | "Upload Photos" button. Accepts image files |

### 8.2 Incident Type Dropdown (17 types)

| # | Type |
|---|------|
| 1 | Alarm System Occurrence |
| 2 | Doors or Aisleways Blocked |
| 3 | Doors or Windows Insecure |
| 4 | Fire Hazards |
| 5 | Fires |
| 6 | Infraction of Rules |
| 7 | Noise Complaint - Confirmed |
| 8 | Noise Complaint - Unconfirmed |
| 9 | Other |
| 10 | Parking Lot Occurrence |
| 11 | Rounds Missed |
| 12 | Rubbish Accumulation |
| 13 | Safety Hazards |
| 14 | Theft Occurrence |
| 15 | Trespassers |
| 16 | Valuables Lost/Found |
| 17 | Waste Water Power Etc. |

### 8.3 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save as Draft | Grey/outlined | Saves as draft (status: Draft) |
| 2 | Save | Teal `btn-primary` | Creates incident report (status: Open) |
| 3 | Cancel | Dark outlined | Closes without saving |

---

## 9. Creation Dialog: Authorized Entry

**Dialog title**: "New Authorized Entry" (teal header bar)
**Trigger**: `NewItemDialog('authorizedentry', '/security/get-json-unit-list/')`

### 9.1 Step 1: Select Unit

| # | Label | Type | Description |
|---|-------|------|-------------|
| 1 | Unit # | Text input (autocomplete) | Type unit number to search. Autocomplete from unit list. Fetches unit data from `/security/get-json-unit-list/` |

### 9.2 Step 2: Authorization Details (After Unit Selection)

After selecting a unit, the dialog expands to show authorization details:

| # | Label | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Authorized Person | Text input | Empty | Name of person being authorized for unit entry |
| 2 | Reason | Textarea | Empty | Reason for authorized entry |
| 3 | Date/Time | Datetime input | Current date/time | When the authorized entry occurs |
| 4 | Comments | Textarea | Empty | Additional notes about the entry |

### 9.3 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save | Teal `btn-primary` | Creates the authorized entry record |
| 2 | Cancel | Dark outlined | Closes without saving |

**Note**: The full authorized entry workflow was not exhaustively explored to avoid creating actual authorization records. The fields above are based on the form structure observed in the DOM. The authorized entry type tracks when maintenance workers, contractors, or others are given permission to enter a unit.

---

## 10. Creation Dialog: Key Checkout

**Dialog title**: "New Key Checkout" (teal header bar)
**Trigger**: `NewItemDialog('masterkey', '/security/get-json-unit-list/')`

### 10.1 Read-only Fields

| # | Label | Value | Description |
|---|-------|-------|-------------|
| 1 | Logged By: | Concierge, Temp | Current user (auto-populated) |
| 2 | Logged On: | 03/13/2026 21:39:28 | Current date/time (auto-populated) |

### 10.2 Form Fields

| # | Label | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Key: | Select (autocomplete) | — | "Select Options" placeholder | Key selection from key inventory |
| 2 | (New button) | Button | — | — | Teal button next to Key dropdown. Creates a new key entry |
| 3 | View Complete Key List | Link | — | — | Opens "View All Keys" sub-dialog (see §10.3) |
| 4 | Checked out to: | Text input | — | Empty | Name of person checking out key |
| 5 | Company: | Text input | — | Empty | Company name |
| 6 | **Identification Details** | Section header | — | — | Bold section heading |
| 7 | Id Type: | Text input | — | Empty | Type of identification presented |
| 8 | ID Number: | Text input | — | Empty | ID document number |
| 9 | Reason: | Textarea | — | Empty | Reason for key checkout |

### 10.3 View All Keys Sub-Dialog

**Dialog title**: "View All Keys" (teal header bar)

| # | Element | Description |
|---|---------|-------------|
| 1 | Search | Text input + "Search" button |
| 2 | Keys table | 4-column table |

**Keys Table Columns**:

| # | Column | Description |
|---|--------|-------------|
| 1 | Key Name | Key identifier (e.g., "SABA") |
| 2 | Key Details | Key description (e.g., "key # 33") |
| 3 | Key Owner | Assigned owner (can be empty) |
| 4 | Action | 3 buttons: Select, Update, Delete |

**Observed keys**: 1 key — SABA (key # 33), no owner assigned.

### 10.4 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save | Teal `btn-primary` | Creates the key checkout |
| 2 | Cancel | Link | `javascript:CloseDialog()` — closes without saving |

---

## 11. Creation Dialog: Pass-On Log

**Dialog title**: "New Pass-On Log" (teal header bar)
**Trigger**: `NewItemDialog('passonlog', '/security/get-json-unit-list/')`

### 11.1 Form Fields

| # | Label | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Subject: | Text input | Empty | Placeholder: "Subject". Log title |
| 2 | Details: | Rich text editor (CKEditor 5) | Empty | Placeholder: "Details...". Full description with formatting |
| 3 | Attach a file: | File upload | "No file selected" | "Choose File" button. Single file attachment |
| 4 | Send To: | Checkbox list | All unchecked | Team members to notify (see §11.2) |

### 11.2 Send To Team Members (9 members)

| # | Checkbox | Description |
|---|----------|-------------|
| 0 | ☐ Send to all team members | Master checkbox — selects all |
| 1 | ☐ Mrs. Dhana Lakshmi | Individual team member |
| 2 | ☐ Dillan Mohammed | Individual team member |
| 3 | ☐ Mr. Harsh Harsh | Individual team member |
| 4 | ☐ Temp Concierge | Individual team member (current user) |
| 5 | ☐ Mr. Junaid Syed | Individual team member |
| 6 | ☐ Manjot Singh | Individual team member |
| 7 | ☐ Security Front Desk | Shared account / desk station |
| 8 | ☐ Mr. Nithin Surabhi | Individual team member |
| 9 | ☐ Mr. Ravi Chandra | Individual team member |

**Note**: Same 9 team members as the guard dropdown in Security Log (§7.3). "Security Front Desk" appears to be a shared/station account.

### 11.3 CKEditor 5 Toolbar (Compact)

| # | Button | Description |
|---|--------|-------------|
| 1 | Undo (↩) | Undo last action |
| 2 | Redo (↪) | Redo |
| 3 | Bold (**B**) | Bold text |
| 4 | Italic (*I*) | Italic text |
| 5 | Underline (__U__) | Underline text |
| 6 | Strikethrough (~~S~~) | Strikethrough |
| 7 | Remove Format (Tₓ) | Clear formatting |
| 8 | Bulleted List | Unordered list |
| 9 | Numbered List | Ordered list |
| 10 | Text Alignment (≡▾) | Dropdown: left, center, right, justify |
| 11 | Show more items (⋮) | Expands: Font Family, Font Size, Font Color, Background Color, Link, Insert Image |

### 11.4 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Save | Teal `btn-primary` | Creates the pass-on log |
| 2 | Cancel | Dark outlined | Closes without saving |

---

## 12. Detail Dialog: Visitor Details

**Dialog title**: "Visitor Details" (teal header bar)
**Opened by**: Clicking a Visitor row's "What happened" link

### 12.1 Visitor Information

| # | Field | Description | Example Value |
|---|-------|-------------|---------------|
| 1 | Visiting Unit #: | Unit being visited | 0506 |
| 2 | Visitor Name: | Visitor's name | Lucky |
| 3 | Visitor Type: | Visitor or Contractor | Visitor |
| 4 | Arrival: | Sign-in time | 3/13/2026 9:24:07 PM |
| 5 | Departure: | Sign-out time or status | "Not yet departed" |
| 6 | Comment: | Any comments logged | (empty) |

### 12.2 Options Section

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Sign Out Visitor | Teal `btn-primary` | Signs out the visitor (sets departure time) |
| 2 | Print Parking Permit | Teal `btn-primary` | Prints parking permit |
| 3 | Revise Vehicle Details | Teal `btn-primary` | Edit vehicle information |
| 4 | Add Comment | Teal `btn-primary` | Add a comment to the visitor entry |

**Note**: Buttons 1-3 are conditional. "Sign Out Visitor" only appears if visitor is still signed in. "Print Parking Permit" and "Revise Vehicle Details" only appear if visitor has parking.

### 12.3 Parking Permits Section

Table of associated parking permits.

| # | Column | Description |
|---|--------|-------------|
| 1 | From | Permit start date/time |
| 2 | to | Permit end date/time |
| 3 | Make / Model | Vehicle make/model + color |
| 4 | License | Province + plate number |

**Example row**: 03/13/2026 21:24:07 → 03/14/2026 14:00:00 | Black Audi | Ontario XLUCKY

### 12.4 History Section

| # | Column | Description |
|---|--------|-------------|
| 1 | Date / Time | Action timestamp |
| 2 | Who | Email address of actor |
| 3 | Action | Action type (e.g., "Visitor Created") |
| 4 | Details | Description (e.g., "New visitor logged") |

---

## 13. Detail Dialog: Package Details

**Dialog title**: "Package Details" (teal header bar)
**Opened by**: Clicking a Package row's "What happened" link

### 13.1 Package Information

| # | Field | Description | Example (Outstanding) | Example (Released) |
|---|-------|-------------|----------------------|-------------------|
| 1 | Package Type: | Incoming or Outgoing | Incoming | Incoming |
| 2 | Reference #: | Auto-generated ref | 7088 | 7259 |
| 3 | Recipient: | Resident name (unit) | WISENER, Andrew (1817) | Singh, Sonali (1601) |
| 4 | Delivered By: | Courier/source | Property Manager | Other |
| 5 | Description: | Package type | Envelope | Package |
| 6 | Tracking #: | Tracking number | (empty) | (empty) |
| 7 | Perishable: | Yes/No flag | No | No |
| 8 | Stored In: | Storage location + (Edit) link | Security Desk. (Edit) | *(not shown when released)* |
| 9 | Released: | Release timestamp | *(not shown)* | 03/10/2026 18:01:07 |

**Note**: "Stored In" with (Edit) link only shown for outstanding packages. "Released" field only shown for delivered packages.

### 13.2 Action Buttons (Outstanding Packages Only)

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Send Email Reminder | Teal `btn-primary` | Sends reminder email to recipient about uncollected package |
| 2 | Release Package | Teal `btn-primary` | Opens Release Package sub-form (see §13.3) |
| 3 | Log Call | Teal `btn-primary` | Log a phone call about the package |

**Note**: Released/delivered packages show NO action buttons.

### 13.3 Release Package Sub-Form

Clicking "Release Package" reveals an inline form within the package detail dialog:

| # | Label | Type | Default | Description |
|---|-------|------|---------|-------------|
| 1 | Released to: | Text input | Empty | Name of person picking up the package |
| 2 | Comments: | Textarea | Empty | Optional notes about the release (e.g., "ID verified", "Left at door") |
| 3 | Signature: | *(premium feature)* | — | Signature capture field (may be greyed out / premium-gated) |

**Action Buttons**:

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Release | Teal `btn-primary` | Confirms package release — sets Released timestamp and logs "Package Picked Up" in history |
| 2 | Cancel | Link/button | Cancels release action, returns to detail view |

**Note**: After releasing, the package moves from "Outstanding" to "Delivered" status. The "Release" action is logged in the Package History section with timestamp and staff member.

### 13.4 Package History Section

| # | Column | Description |
|---|--------|-------------|
| 1 | Date / Time | Action timestamp |
| 2 | Who | Email address of actor |
| 3 | Action | Action type |
| 4 | Details | Description |

**Observed action types**:
- "Received Package" / "Received" — Package logged as received
- "Notification sent" / "Email Notification" — Email notification sent to resident
- "Package Picked Up" / "Package Picked Up" — Package released to recipient

---

## 14. Detail Dialog: Security Shift

**Dialog title**: "Security Log" (teal header bar)
**Opened by**: Clicking a Security Shift row's "What happened" link

The Security Shift detail dialog reopens the **same shift creation/edit form** as the creation dialog (§7). This allows editing the shift details after creation. Same fields: Start Time, End Time, Relieved, To Be Relieved By, Equipment Received — plus the info banner with bookings/keys/vacations counts.

**Note**: After a shift is created, security logs can be added to the shift. The instruction text "You need to create a shift before you can create security logs" indicates a two-step workflow: first create shift, then add logs to it.

---

## 15. Detail Dialog: Incident Report

**Dialog title**: "Incident Report" (teal header bar)
**Opened by**: Clicking an Incident Report row's "What happened" link

### 15.1 Report Metadata (Read-only)

| # | Field | Example Value |
|---|-------|---------------|
| 1 | Logged By: | Concierge, Temp |
| 2 | Logged On: | 03/13/2026 05:25:31 |
| 3 | Occurred on: | 03/13/2026 05:25:31 |
| 4 | Status: | Open |
| 5 | Related Unit: | NA |
| 6 | Type: | Parking Lot Occurrence |
| 7 | Reported By: | (empty — optional field) |
| 8 | Suspect: | (empty — optional field) |

### 15.2 Report Content

| # | Field | Description |
|---|-------|-------------|
| 1 | Title: | Incident title (e.g., "Improperly parked vehicle observed at P1") |
| 2 | Report: | Full incident report text. Rich text with bold formatting. Can include timestamped entries (e.g., "**05:04 hrs:** description... **05:15hrs:** follow-up...") |

### 15.3 Emergency Services Table

5-row table tracking emergency service contacts:

| # | Service | Columns |
|---|---------|---------|
| 1 | Police | Called (Yes/No), Time Called, Arrival Time, Name of Person Attending |
| 2 | Fire Department | Called (Yes/No), Time Called, Arrival Time, Name of Person Attending |
| 3 | Ambulance | Called (Yes/No), Time Called, Arrival Time, Name of Person Attending |
| 4 | Client Contact | Called (Yes/No), Time Called, Arrival Time, Name of Person Attending |
| 5 | Patrol Supervisor | Called (Yes/No), Time Called, Arrival Time, Name of Person Attending |

### 15.4 Attachments Table

| # | Column | Description |
|---|--------|-------------|
| 1 | Date | Upload timestamp (e.g., "3/13/2026 5:30:34 AM") |
| 2 | File Type | File extension (e.g., "jpg") |
| 3 | File Name | Auto-generated filename (format: YYYYMMDD HHMMSS, e.g., "20260313 050415"). Teal link — clickable to download |
| 4 | Action | Two icon buttons: Delete (🗑) and Download (💾) |

### 15.5 Updates Table

| # | Column | Description |
|---|--------|-------------|
| 1 | Date | Update timestamp |
| 2 | Details | Update description |
| 3 | Who | Staff member name |
| 4 | Status | Status at time of update (Open/Closed) |

### 15.6 Add an Update Section

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Attach a file (optional): | File upload | "Select Files" button (teal) |
| 2 | Add additional details: | Textarea | Free-text update description |
| 3 | New Status: | Select dropdown | ID: `Status`. Options: Open (1), Closed (0) |

### 15.7 Action Buttons

| # | Button | Style | Position | Description |
|---|--------|-------|----------|-------------|
| 1 | Update | Teal `btn-primary` | Bottom-left | Saves updates (details, status change, file) |
| 2 | Cancel | Dark outlined | Bottom-left (after Update) | Closes without saving |
| 3 | Print | Teal `btn-primary` | Bottom-right | Prints the incident report |

---

## 16. Data Model Observations

### 16.1 Entry Types and Reference Number Ranges

| Type | Ref # Range (Observed) | Description |
|------|----------------------|-------------|
| Visitor | 894-903 | Low-range sequential. Visitor-specific counter |
| Package | 7088-7259 | High-range sequential. Package-specific counter |
| Security Shift | 2325-2327 | Mid-range sequential. Shift-specific counter |
| Incident Report | 1766 | Mid-range sequential. Incident-specific counter |

**Note**: Each entry type has its own sequential reference number counter (not a shared global counter).

### 16.2 Entry Entity (Unified)

| Field | Type | Description |
|-------|------|-------------|
| ReferenceNumber | Integer | Auto-generated, per-type sequential |
| Type | Enum | visitor, package, security-shift, incident-report, authorized-entry, master-key, pass-on-log, security-patrol, valet-parking |
| When | DateTime | Entry creation timestamp |
| UnitNumber | String | Associated unit (optional for some types) |
| Details | Text/HTML | Varies by type — description, report text, or computed summary |
| Status | Enum | Type-specific statuses (Open/Closed for incidents, Outstanding/Delivered for packages, Signed In/Signed Out for visitors) |

### 16.3 Visitor Entity

| Field | Type | Description |
|-------|------|-------------|
| VisitorName | String | Visitor's name |
| VisitorType | Enum | Visitor, Contractor |
| UnitNumber | String | Unit being visited |
| Arrival | DateTime | Sign-in timestamp |
| Departure | DateTime | Sign-out timestamp (null if still signed in) |
| Comment | Text | Optional notes |
| ParkingPermit | Object | Optional: From, To, Make/Model, License |

### 16.4 Package Entity

| Field | Type | Description |
|-------|------|-------------|
| PackageType | Enum | Incoming, Outgoing |
| ReferenceNumber | Integer | Auto-generated sequential |
| Recipient | String | Resident name with unit number |
| DeliveredBy | String | Courier name (from 10 courier options) |
| Description | String | Package type description |
| TrackingNumber | String | Courier tracking number (optional) |
| Perishable | Boolean | Perishable flag |
| StorageSpot | String | Physical storage location (e.g., "Security Desk") |
| Released | DateTime | Release/pickup timestamp (null if outstanding) |

### 16.5 Incident Report Entity

| Field | Type | Description |
|-------|------|-------------|
| Title | String | Incident title |
| Report | HTML/Text | Full incident description |
| Type | Enum | One of 17 incident types |
| Status | Enum | Open (1), Closed (0), Draft |
| Urgency | Boolean | Not Urgent / Urgent |
| OccurredOn | DateTime | When incident occurred |
| RelatedUnit | String | Associated unit (optional, "NA" when none) |
| ReportedBy | String | Who reported (optional) |
| Suspect | String | Suspect name (optional) |
| EmergencyServices | Array | 5 rows: Police, Fire, Ambulance, Client Contact, Patrol Supervisor |
| Attachments | Array | Uploaded photos/files |
| Updates | Array | Update entries with details, who, status |

### 16.6 Security Shift Entity

| Field | Type | Description |
|-------|------|-------------|
| ShiftNumber | Integer | Sequential shift reference |
| StartTime | DateTime | Shift start |
| EndTime | DateTime | Shift end |
| Relieved | String | Guard being relieved |
| ToBeRelievedBy | String | Next guard |
| EquipmentReceived | String | Equipment handoff notes |
| Logs | Array | Security logs added during the shift |

### 16.7 Key Checkout Entity

| Field | Type | Description |
|-------|------|-------------|
| LoggedBy | String | Staff member who logged checkout |
| LoggedOn | DateTime | Checkout timestamp |
| Key | Object | Key from inventory (Name, Details, Owner) |
| CheckedOutTo | String | Person who received the key |
| Company | String | Company name |
| IdType | String | Identification type presented |
| IdNumber | String | ID number |
| Reason | String | Reason for checkout |

### 16.8 Pass-On Log Entity

| Field | Type | Description |
|-------|------|-------------|
| Subject | String | Log title |
| Details | HTML | Rich text content |
| Attachment | File | Optional file attachment |
| SendTo | Array | List of team member user IDs to notify |

---

## 17. URL Map

| Page | URL Pattern |
|------|-------------|
| Console (default) | `/security/console/` |
| Console (paginated) | `/security/Console?Page={pageNumber}` |
| User list JSON (visitors) | `/security/get-json-user-list-for-visitors/` |
| User list JSON (packages) | `/security/get-json-user-list/` |
| Unit list JSON | `/security/get-json-unit-list/` |

**Note**: No separate detail page URLs — all views are dialog overlays on the console page. The URL does not change when dialogs open.

---

## 18. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Unified console** — Single page for ALL security operations. No navigating between modules. Visitors, packages, shifts, incidents — all in one stream
2. **Quick-create icons** — 7 large teal icons for instant entry creation. Visual, one-click access to every entry type
3. **Dialog-based workflow** — All creation and detail views as overlays. Never loses context of the main console. Fast task switching
4. **Courier icon grid** — 10 courier-specific logos (Amazon, FedEx, UPS, etc.) instead of a text dropdown. Visual recognition for fast package logging
5. **Multi-package feature** — "Log Multiple Packages" for batch entry. Critical for busy front desks receiving many deliveries at once
6. **Smart filter hierarchy** — Sub-filters with dash prefix (e.g., "-Visitors Still Signed In" under "All Visitors"). Logical grouping in a single dropdown
7. **Emergency services tracking** — 5-row table on incident reports for Police, Fire, Ambulance, Client Contact, Patrol Supervisor. Professional incident documentation
8. **Package lifecycle** — Full lifecycle: Received → Notification sent → Email reminder → Released/Picked Up. Email notifications and reminders built in
9. **Shift handoff info box** — Live counts of bookings, keys checked out, and people on vacation displayed when creating a new shift. Context-aware onboarding for incoming guard
10. **Incident report updates** — Append-only update log with file attachments and status changes. Full audit trail
11. **Pass-on log notification** — Can select specific team members to notify. Targeted communication for shift handoffs
12. **Print functionality** — Incident reports have a Print button. Important for physical documentation requirements
13. **Auto-generated reference numbers** — Every entry gets a sequential reference number per type. Trackable and referenceable
14. **ID verification on key checkout** — ID Type and ID Number fields for verifying identity of person checking out keys. Security compliance

### What CondoControl Gets Wrong
1. **No dedicated Security Shift detail page** — Clicking a shift reopens the creation form. No read-only view of completed shifts. No way to see the logs added to a shift from the detail dialog
2. **Filter dropdown typo** — "visitor-signrd-in" and "visitor-signrd-out" have "signrd" instead of "signed"
3. **No column sorting on events table** — Cannot sort by Type, Reference #, When, or Unit. Only reverse chronological order
4. **1000+ pages of events with no archival** — Events table has 1000+ pages at 10 events per page. No archival, no date-range default, no "today only" quick filter
5. **24-hour time format inconsistency** — Console table uses 24-hour (21:24:28) while detail dialogs use 12-hour (9:24:07 PM). Mixed time formats
6. **No batch sign-out** — Must sign out visitors one at a time via individual "Sign Out" links. No "Sign Out All" for end-of-day processing
7. **Package description is free text** — "Package", "Envelope", "White Package" typed manually. Should be a dropdown with predefined types
8. **No search placeholder on main search** — Placeholder says "Provide at least 3 digits/letters to search" which is a validation message, not a placeholder hint
9. **Storage spot not prominently visible** — Package storage location ("Security Desk") only visible in the detail dialog, not on the main table. Front desk staff need to see this at a glance
10. **No real-time updates** — Console requires manual refresh or filter search to see new entries from other staff. No WebSocket/polling for live updates
11. **Incident report status is just Open/Closed** — Only 2 statuses (Open=1, Closed=0). No "In Progress", "Under Review", "Escalated" intermediate states
12. **Key inventory is basic** — Only 1 key ("SABA, key #33") in the system. No key categories, no checkout duration limits, no overdue alerts
13. **Pass-on log has single file attachment** — Only one "Choose File" input. Cannot attach multiple files to a pass-on log
14. **No notification preferences on visitor entry** — Cannot opt to notify the unit resident that their visitor has arrived. Must be done separately
15. **No photo preview on packages** — Unlike incident reports which support photo uploads, packages have no photo capability for documenting received items
16. **Authorized Entry dialog is basic** — Only tracks who entered, when, and why. No approval workflow, no pre-authorization by residents, no time-limited access grants
17. **Advanced Search requires clicking a link** — The date range filter is hidden behind "Advanced Search" instead of being always visible or a quick filter preset
18. **Package release has no photo verification** — No way to photograph the person picking up a package or capture proof of pickup. Signature feature appears to be premium-gated

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~700+*
