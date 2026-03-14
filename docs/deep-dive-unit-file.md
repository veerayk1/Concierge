# Unit File — Granular Deep Dive

Field-level documentation of every element on the Aquarius (ICON) Unit File module, including unit listing, unit detail view, user profile (6 tabs), edit forms, and staff management.

**URL**: `https://aquarius.iconconnect.ca/unit-file`
**Property**: TSCC 2584 - Toronto
**Logged-in user**: RAY_007
**Architecture**: Modern SPA (React/Material UI)

---

## 1. Unit Listing Page

**URL**: `/unit-file`
**Title**: "Units"

### Filter Controls (Top Bar)

| # | Element | Type | Options/Default | Description |
|---|---------|------|-----------------|-------------|
| 1 | Building selector | Dropdown (combobox) | Bond (only option observed) | Filter units by building; single-building property shows "Bond" |
| 2 | Manage Staff | Button (outlined, blue text) | — | Opens Staff Users modal (see Section 7) |
| 3 | Search All Buildings | Checkbox | Unchecked | When checked, searches across all buildings in the system |
| 4 | Status filter | Dropdown (combobox) with X clear | Active / Disabled | Default: Active; filter by user account status |

### Table Controls

| # | Element | Type | Options/Default | Description |
|---|---------|------|-----------------|-------------|
| 1 | Show entries | Dropdown | 50 (default) | Number of entries per page |
| 2 | Search | Text input | Placeholder: "Search" | Filter table rows in real-time |

### Unit Table Columns (14 columns total)

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | Unit# | Yes (▲▼) | Unit number (e.g., 701, 702, PH01); default sort ascending |
| 2 | Visit Unit | Yes (▼) | External link icon (↗) — opens unit detail page at `/view-unit/{building_id}/{unit_id}` in new tab |
| 3 | First Name | Yes (▼) | Resident's first name |
| 4 | Visit User | Yes (▼) | External link icon (↗) — opens user profile at `/view-user/{Username}` |
| 5 | Last Name | Yes (▼) | Resident's last name |
| 6 | Groups | Yes (▼) | User group: Owner, Tenant, Offsite Owner |
| 7 | Email | Yes (▼) | Email address (full address displayed) |
| 8 | Phone | Yes (▼) | Phone number (various formats: 416-xxx-xxxx, 1-xxx-xxx-xxxx, xxxxxxxxxx) |
| 9 | Front Desk Instructions | Yes (▼) | Per-unit instructions for front desk staff (can be lengthy text) |
| 10 | Active | Yes (▼) | Account status: "Yes" for active |
| 11 | Parking | Yes (▼) | Parking spot assignment (e.g., "B-10, B-11", "B-34", "D-35"); "null" if none |
| 12 | Locker Info | Yes (▼) | Locker assignment (e.g., "L2-2"); mostly empty |
| 13 | License Plate | Yes (▼) | Vehicle license plate; mostly empty |
| 14 | Home Phone | Yes (▼) | Alternate home phone number |
| 15 | Work Phone | Yes (▼) | Work phone number |

**Note**: Columns 12-15 are only visible by scrolling horizontally — they are off-screen at default viewport width.

### Table Footer

- **Footer row**: Repeats column headers at bottom of table
- **Pagination info**: "Showing 1 to 50 of 903 entries"
- **Pagination controls**: Previous / 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / Next
- **Total entries**: 903 (at 50 per page = ~18 pages, but only 8 pages shown, so possibly max 400 active entries)

### Key Observations

- **One unit = multiple rows**: A single unit (e.g., 704) can have multiple rows — one per resident (owners + tenants)
- **User groups observed**: Owner, Tenant, Offsite Owner
- **Unit number formats**: Numeric (701–1007+) and Penthouse (PH01)
- **Front Desk Instructions** are a critical feature — visible in both listing and detail views (e.g., PH01 has detailed security access instructions)
- **Username format**: `{FirstName}{LastName}_{UnitNumber}` (e.g., RobertBoyko_701)
- **Parking format**: Prefix-number (B-10, D-35, E-2, E-3, A-30, P1-A 21)

---

## 2. Unit Detail Page (View Unit)

**URL**: `/view-unit/{building_id}/{unit_id}` (e.g., `/view-unit/92/12653`)
**Title**: "Unit PH01" (unit number in header)

### Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Unit title | "Unit {number}" (e.g., "Unit PH01") |
| 2 | Edit Unit button | Outlined button — navigates to `/edit-unit/{building_id}/{unit_id}` |

### Section 1: Residents Table

| # | Column | Description |
|---|--------|-------------|
| 1 | Username | Format: `{FirstName}_{UnitNumber}` (e.g., Desmond_PH01) |
| 2 | Front Desk Instructions | Per-resident instructions (same text shared across all residents in unit) |
| 3 | User Group | owner, tenant, etc. |
| 4 | Email | Email address |
| 5 | Phone Number | Phone with trailing comma (e.g., "1 403-870-2581, ,") |
| 6 | Status | Active / Disabled |
| 7 | Edit | "Edit User" button — opens user edit form |

### Section 2: Packages (Received past 14 days)

**Header**: "Packages: Received past 14 days"
**Action button**: "Release Packages For This Unit" (outlined, top-right)

#### Package Table Columns (8)

| # | Column | Description |
|---|--------|-------------|
| 1 | Reference # | Auto-generated numeric ID (e.g., 1855, 1049, 1166) |
| 2 | Added by | Staff member who logged the package (e.g., Arnav, Lasya, Simrandeep_15) |
| 3 | For | Recipient: `{FirstName}_{UnitNumber}` (e.g., Desmond_PH01, Karen_PH01) |
| 4 | Released? | Status: "No" (unreleased) or "Yes, Released by: {staff}. Released To: {user}" |
| 5 | Details | Package description (free text: "brown box", "WHITE PACKAGE", "bottles", "Grey package") |
| 6 | Courier Name | Courier/carrier: Amazon, DHL, Canada Post, Other |
| 7 | Tracking Number | Tracking number (mostly "undefined" in observed data) |
| 8 | Storage Spot | Physical location: "CACF", "Parcel Room" |

### Section 3: Parking Permits (Issued this month)

**Header**: "Parking Permits: Issued this month"
**Action button**: "Issue Visitor Parking Pass" (outlined, top-right)

#### Parking Permit Table Columns (8)

| # | Column | Description |
|---|--------|-------------|
| 1 | Plate Number | Vehicle license plate |
| 2 | Added by | Staff who issued the permit |
| 3 | Start Time | Permit start datetime |
| 4 | End Time | Permit end datetime |
| 5 | Vehicle Details | Vehicle description |
| 6 | Visitor Type | Type of visitor |
| 7 | Visitor Name | Name of visitor |
| 8 | Signed Out? | Whether visitor has signed out |
| 9 | Comments | Additional notes |

### Section 4: Unit Details

| # | Field | Description |
|---|-------|-------------|
| 1 | Unit | Unit number (e.g., PH01) |
| 2 | Unit Address | Full address: "Suite: PH01, 290 Adelaide St., Toronto, ON, M5V0P3" |
| 3 | Locker | Locker assignment (null if none) |
| 4 | Parking Spot | Parking spot assignment (null if none) |
| 5 | Key Tag | Key tag identifier |
| 6 | Enterphone code | Intercom/buzzer code for the unit |
| 7 | Created On | Unit creation date (e.g., "September 5, 2020") |
| 8 | Updated On | Last update date (e.g., "September 5, 2020") |

**Edit Unit button**: Appears next to this section — links to edit form.

### Section 5: Vehicles

**Header**: "Vehicles"
Per-resident vehicle display:

| # | Field | Description |
|---|-------|-------------|
| 1 | Belongs To | Username (e.g., Desmond_PH01) |
| 2 | Vehicle Plate Number | License plate (comma-separated format: ", , ,") |
| 3 | Vehicle Color | Color with commas (", , , ,") |
| 4 | Vehicle Make and Model | Make/model with commas (", , , ,") |

**Note**: One vehicle row per resident in the unit. Data format appears to store multiple vehicles in comma-separated fields.

### Section 6: Fobs and Buzzers

**Header**: "Fobs and Buzzers:"
**Edit Unit button**: Appears next to this section.

#### FOB Slots (6)

| # | Label | Fields |
|---|-------|--------|
| 1 | Fob 1 | Fob Type (value) + Fob 1 Serial Number (value) |
| 2 | Fob 2 | Fob Type (value) + Fob 2 Serial Number (value) |
| 3 | Fob 3 | Fob Type (value) + Fob 3 Serial Number (value) |
| 4 | Fob 4 | Fob Type (value) + Fob 4 Serial Number (value) |
| 5 | Fob 5 | Fob Type (value) + Fob 5 Serial Number (value) |
| 6 | Fob 6 | Fob Type (value) + Fob 6 Serial Number (value) |

#### Buzzer Codes (2)

| # | Label | Fields |
|---|-------|--------|
| 1 | Buzzer Code 1 | Code value + Comment |
| 2 | Buzzer Code 2 | Code value + Comment |

#### Garage Clickers (2)

| # | Label | Description |
|---|-------|-------------|
| 1 | Garage Clicker 1 | Clicker identifier/serial |
| 2 | Garage Clicker 2 | Clicker identifier/serial |

---

## 3. Edit Unit Form

**URL**: `/edit-unit/{building_id}/{unit_id}` (e.g., `/edit-unit/92/12653`)
**Top nav highlight**: "Create Unit" is underlined (shares the same form layout)

### Form Fields

| # | Field | Type | Required | Default/Placeholder | Description |
|---|-------|------|----------|---------------------|-------------|
| 1 | Select building | Dropdown (combobox) | Yes (*) | Current building | Building selector |
| 2 | Unit Number | Text input | Yes (*) | Current unit number | Unit identifier |
| 3 | Package email notifications | Checkbox | No | Checked (✓) | "Do you want to send package related Email notification to all residents of this unit?" |
| 4 | Comments | Textarea (resizable) | No | Placeholder: "Comments" | General comments about the unit |
| 5 | EnterPhone code | Text input | No | Placeholder: "EnterPhone code" | Intercom/buzzer code |
| 6 | Parking Spot | Text input | No | Placeholder: "Parking Spot" | Parking assignment |
| 7 | Locker | Text input | No | Placeholder: "Locker" | Locker assignment |

### FOB/Remote/Key Section (6 slots)

Each slot has 2 fields:

| # | Slot | Type Field | Serial Number Field |
|---|------|-----------|-------------------|
| 1 | FOB/Remote/Key 1 | Dropdown (combobox): Access Card, FOB, Key, Remote | Text input: "Serial Number" |
| 2 | FOB/Remote/Key 2 | Dropdown (combobox): Access Card, FOB, Key, Remote | Text input: "Serial Number" |
| 3 | FOB/Remote/Key 3 | Dropdown (combobox): Access Card, FOB, Key, Remote | Text input: "Serial Number" |
| 4 | FOB/Remote/Key 4 | Dropdown (combobox): Access Card, FOB, Key, Remote | Text input: "Serial Number" |
| 5 | FOB/Remote/Key 5 | Dropdown (combobox): Access Card, FOB, Key, Remote | Text input: "Serial Number" |
| 6 | FOB/Remote/Key 6 | Dropdown (combobox): Access Card, FOB, Key, Remote | Text input: "Serial Number" |

**FOB Type options (4)**:
1. Access Card
2. FOB
3. Key
4. Remote

### Buzzer Codes Section (2 slots)

| # | Slot | Code Field | Comments Field |
|---|------|-----------|---------------|
| 1 | Buzzer Code 1 | Text: "Code 1:" | Text: "Comments" |
| 2 | Buzzer Code 2 | Text: "Code 2:" | Text: "Comments" |

### Garage Clickers Section (2 slots)

| # | Slot | Description |
|---|------|-------------|
| 1 | Garage Clicker 1 | Text input for clicker identifier |
| 2 | Garage Clicker 2 | Text input for clicker identifier |

### Key Tag Section

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Key Tag | Text input | Key tag identifier |

### Submit

| # | Button | Description |
|---|--------|-------------|
| 1 | Update | Submit button — saves all changes |

---

## 4. User Profile Page (View User)

**URL**: `/view-user/{Username}` (e.g., `/view-user/RobertBoyko_701`)
**Layout**: User name as page header with avatar icon

### Header Elements

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | User avatar | Icon | Person silhouette icon |
| 2 | User name | Heading | Full name in uppercase (e.g., "ROBERT BOYKO") |
| 3 | Edit | Button (filled blue) | Opens user edit form |
| 4 | Send Welcome Email | Button (filled dark blue) | Sends onboarding welcome email to user |

### Profile Tabs (6)

| # | Tab | Description |
|---|-----|-------------|
| 1 | User | Basic user details, related units, contacts, parcel waivers |
| 2 | Emergency Contacts | Emergency contact information (1 contact) |
| 3 | Notification Preferences | Email/notification opt-in settings (7 preferences) |
| 4 | Vehicles And Parking | Vehicle registration and parking rental info |
| 5 | Pets | Pet registration with details and image |
| 6 | Documents | Legal document uploads (3 types) |

---

## 5. User Profile — Tab Details

### Tab 1: User

#### USER DETAILS Section

| # | Field | Example Value | Description |
|---|-------|--------------|-------------|
| 1 | Username | RobertBoyko_701 | System username (auto-generated: FirstNameLastName_Unit) |
| 2 | Firstname | Robert Boyko | First name (may include middle name) |
| 3 | Lastname | (empty) | Last name |
| 4 | Front desk Instructions | (empty) | Per-user instructions for front desk staff |
| 5 | User Group | owner - (owner) | Role with display label: owner, tenant, offsite owner |
| 6 | Offsite Address | (empty) | Address if offsite owner |
| 7 | Email Address | rob@bearstargroup.com | Primary email |
| 8 | User Status | Active | Account status: Active / Disabled |
| 9 | Assistance Required | No | Accessibility/assistance flag |
| 10 | Last Logged In | (empty) | Last login timestamp |
| 11 | Account Created on | June 27, 2020 | Account creation date |
| 12 | Account Updated on | January 6, 2021 | Last account update date |

#### About you Section

| # | Field | Description |
|---|-------|-------------|
| 1 | About you | Free-text bio/description field (displays "null" when empty) |

#### RELATED UNITS Section

| # | Field | Description |
|---|-------|-------------|
| 1 | Unit | Unit number(s) the user is associated with (e.g., 701) |

#### CONTACTS Section

| # | Field | Example Value | Description |
|---|-------|--------------|-------------|
| 1 | Email | rob@bearstargroup.com | Contact email (same as User Details) |
| 2 | Phone Number | (empty) | Primary mobile phone |
| 3 | Home Phone | 647-537-2037 | Home phone number |
| 4 | Work Phone | (empty) | Work phone number |

#### PARCEL WAIVERS Section

| # | Field | Description |
|---|-------|-------------|
| 1 | Signed At | Date/time waiver was signed (null if not signed) |
| 2 | Attachment | File download link with size in KB (e.g., "--- KB") |
| 3 | Notes | Additional notes about the waiver |

### Tab 2: Emergency Contacts

**Header**: "Emergency Contacts" (blue text)

| # | Field | Example Value | Description |
|---|-------|--------------|-------------|
| 1 | Emergency Contact Name | Marine Frank | Full name of emergency contact |
| 2 | Emergency Contact Relationship | Girl Friend | Relationship to resident (free text) |
| 3 | Emergency Mobile Phone Number | 416-564-0415 | Mobile phone of emergency contact |
| 4 | Emergency Home Phone Number | (empty) | Home phone of emergency contact |
| 5 | Comments | null | Additional notes |
| 6 | Email | (empty) | Email of emergency contact |

**Note**: Only 1 emergency contact slot per user (unlike BuildingLink which has 2). This is a significant limitation for Concierge to address.

### Tab 3: Notification Preferences

**Header**: "Notification Preferences" (blue text)

| # | Preference | Type | Default | Description |
|---|-----------|------|---------|-------------|
| 1 | Routine emails | Yes/No | Yes | "Do you want to be included in routine emails sent by management and staff to residents?" |
| 2 | Emails Declined | Yes/No | No | Whether user has opted out of all emails |
| 3 | AGM Notice Opt-in | Yes/No | No | Annual General Meeting notice preference |
| 4 | Service request created | Yes/No | Yes | "Do you want to be notified when a service request is created?" |
| 5 | Service request updated | Yes/No | Yes | "Do you want to be notified when a service request is updated?" |
| 6 | New event added | Yes/No | Yes | "When a new event is added?" |
| 7 | Electronic notices consent | Yes/No | Yes | "Do you consent to receive notices electronically?" |

### Tab 4: Vehicles And Parking

**Header**: "Vehicles" (blue text)

#### Vehicle Slots (3 per user)

| # | Field | Example Value | Description |
|---|-------|--------------|-------------|
| 1 | Vehicle 1 Plate Number | sonnyv1 | License plate |
| 2 | Vehicle 1 Color | Orange | Vehicle color |
| 3 | Vehicle 1 Model | Lamborghini-2017 | Make, model, and year |
| 4 | Vehicle 2 Plate Number | cllz319 | License plate |
| 5 | Vehicle 2 Color | White Grey-2020 | Vehicle color with year |
| 6 | Vehicle 2 Model | -Grand Cherovelt | Make and model |
| 7 | Vehicle 3 Plate Number | null | License plate |
| 8 | Vehicle 3 Color | null | Vehicle color |
| 9 | Vehicle 3 Model | null | Make and model |

#### Parking Rental

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Renting a parking spot? | Yes/No | Whether user rents a parking spot from another unit |
| 2 | Which Unit Are You Renting From? | Text/Number | Unit number of parking spot owner |

### Tab 5: Pets

**Header**: "Pets" (blue text)

| # | Field | Type | Example | Description |
|---|-------|------|---------|-------------|
| 1 | User has pets? | Yes/No | Yes | Whether user has pets |
| 2 | Number of pets | Number | null | Total number of pets |
| 3 | Names of Pets | Text | null | "Separate multiple pets with a comma" |
| 4 | Age of pets | Text | null | Pet age(s) |
| 5 | Breed of Pets | Text | null | Pet breed(s) |
| 6 | Size of pets | Text | null | Pet size(s) |
| 7 | Weight of Pets | Text | null | "Separate multiple pets with a comma" |
| 8 | Image of Pet | Image upload | (broken image placeholder) | Photo of pet |
| 9 | Do you have a service dog | Yes/No | No | Service animal flag |

### Tab 6: Documents

**Header**: "Documents" (blue text)

| # | Document Type | Description |
|---|--------------|-------------|
| 1 | Power of Attorney for Owner? | Legal document: power of attorney (file upload) |
| 2 | Lease Agreement? | Lease/rental agreement document (file upload) |
| 3 | Insurance Certificate? | Insurance certificate document (file upload) |

**Note**: Each document type appears to be a file upload slot. The "?" suffix on labels suggests these are optional documents.

---

## 6. User Groups Observed

From the Unit File listing, these user groups appear in the "Groups" column:

| # | Group | Description |
|---|-------|-------------|
| 1 | Owner | Unit owner (resident or investor) |
| 2 | Tenant | Renter/lessee of the unit |
| 3 | Offsite Owner | Owner who doesn't live in the unit (investor/landlord) |

From the Staff Users modal (Manage Staff):

| # | Group | Description |
|---|-------|-------------|
| 1 | property manager | Property management staff (ICON PM employees) |
| 2 | supervisor | Supervisory staff |
| 3 | Guard | Security/concierge guard staff |

---

## 7. Manage Staff Modal

**Trigger**: "Manage Staff" button on Unit File listing page
**Title**: "Staff Users"
**Close**: X button (top-right)

### Staff Table Columns (7)

| # | Column | Description |
|---|--------|-------------|
| 1 | Username | Staff username (e.g., adminpm, Ray_007, Bond_Concierge) |
| 2 | First Name | First name |
| 3 | Last Name | Last name |
| 4 | Email | Staff email (property managers use @iconpm.ca, guards use personal emails) |
| 5 | Group | Staff role: property manager, supervisor, Guard |
| 6 | Account Status | Active (all observed are Active) |
| 7 | View | "View" button — opens staff profile (only shown for some staff) |

### Observed Staff Counts

| Group | Count | Email Domain |
|-------|-------|-------------|
| property manager | 8 | @iconpm.ca |
| supervisor | 2+ | @royalcas.ca, personal |
| Guard | 12+ | personal @gmail.com |

**Key observation**: "View" button only appears for some staff (supervisor and Guard roles), not for all property managers. The logged-in user (Ray_007) has a View button.

---

## 8. URL Patterns

| Page | URL Pattern | Example |
|------|-------------|---------|
| Unit listing | `/unit-file` | `/unit-file` |
| View unit | `/view-unit/{building_id}/{unit_id}` | `/view-unit/92/12653` |
| Edit unit | `/edit-unit/{building_id}/{unit_id}` | `/edit-unit/92/12653` |
| View user | `/view-user/{Username}` | `/view-user/RobertBoyko_701` |

---

## Concierge Design Implications

### From Unit File Deep Dive

1. **One row per resident, not per unit** — the listing page shows 903 entries for ~500 units because each resident gets a row. Concierge should allow grouping by unit with expandable residents, plus a flat "all residents" view.

2. **14 columns with horizontal scroll** — too many columns for a single table. Concierge should use column configuration (show/hide/reorder) and a card view alternative.

3. **Front Desk Instructions on listing AND detail** — this critical field is visible everywhere. Concierge must make per-unit instructions prominently accessible from any context (event logging, package intake, visitor registration).

4. **6 FOB slots with 4 types (Access Card, FOB, Key, Remote)** — fixed slot count is limiting. Concierge should use a dynamic list (add/remove) with the same type options plus extensibility.

5. **2 Buzzer Codes + 2 Garage Clickers** — physical access management is Aquarius's strength. Concierge must support all these access device types from day one.

6. **Only 1 emergency contact per user** — this is a significant gap. BuildingLink has 2 contacts. Concierge should support unlimited emergency contacts with priority ordering.

7. **3 vehicle slots with simple text fields** — no validation on plate numbers, colors, or makes. Concierge should have structured vehicle fields with Make/Model/Year dropdowns and plate number validation.

8. **Parking rental tracking** — "Renting a parking spot?" with unit linkage. This is unique to Aquarius and important for condo management. Concierge should support parking assignment AND rental tracking.

9. **Pet management with 9 fields including service dog flag** — comprehensive pet tracking. Concierge should adopt this but add structured fields (pet type dropdown: Dog/Cat/Other) instead of all free-text.

10. **3 document types (POA, Lease, Insurance)** — limited to 3 hardcoded types. Concierge should support configurable document categories with unlimited uploads per category.

11. **Parcel Waivers on user profile** — legal document management tied to individual users. Important for liability in package handling.

12. **"Send Welcome Email" button on every user profile** — onboarding workflow integrated into user management. Concierge should have configurable welcome email templates.

13. **Username = FirstNameLastName_UnitNumber** — auto-generated, predictable pattern. Concierge should allow configurable username generation or email-based login.

14. **Staff groups (property manager, supervisor, Guard)** — only 3 roles observed. Concierge needs more granular role-based access control with configurable permissions per role.

15. **"Release Packages For This Unit" button on unit detail** — quick action for bulk package release. Important for front desk workflow efficiency.

16. **7 notification preferences** — email-only settings including AGM notices and electronic consent. Concierge must extend this to SMS, push, and voice channels with per-notification-type granularity.

17. **Parking permits embedded in unit view** — "Issued this month" with visitor parking pass workflow. Concierge should link parking permits to both units and visitors.

18. **Packages show "past 14 days"** — fixed time window. Concierge should allow configurable time ranges and quick filters (today, 7d, 30d, all).

19. **Multiple "Edit Unit" buttons** — 3 Edit Unit buttons appear on the unit detail page (one per section). Concierge should use a single edit action that opens the full form, or inline editing per section.

20. **Assistance Required field on user profile** — accessibility/special needs flag. Important for emergency response and front desk awareness. Concierge should make this prominently visible.

---

## 9. Data Model (Deduced)

```
Building
├── id (integer, auto-generated)
├── name (string, e.g., "Bond")
└── units[] → Unit

Unit
├── id (integer, auto-generated)
├── building_id → Building
├── unit_number (string, e.g., "701", "PH01")
├── unit_address (string, e.g., "Suite: PH01, 290 Adelaide St., Toronto, ON, M5V0P3")
├── enterphone_code (string)
├── parking_spot (string, e.g., "B-10", "D-35")
├── locker (string, e.g., "L2-2")
├── key_tag (string)
├── package_email_notifications (boolean, default: true)
├── comments (text)
├── front_desk_instructions (text)
├── created_on (date)
├── updated_on (date)
├── residents[] → User
├── fobs[] → FOB (max 6)
├── buzzer_codes[] → BuzzerCode (max 2)
├── garage_clickers[] → GarageClicker (max 2)
├── packages[] → Package
└── parking_permits[] → ParkingPermit

User (Resident / Staff)
├── id (integer, auto-generated)
├── username (string, auto-generated: FirstNameLastName_UnitNumber)
├── first_name (string)
├── last_name (string)
├── email (string)
├── phone_number (string)
├── home_phone (string)
├── work_phone (string)
├── user_group (enum: owner, tenant, offsite_owner, property_manager, supervisor, guard)
├── user_status (enum: Active, Disabled)
├── offsite_address (string, nullable)
├── front_desk_instructions (text)
├── assistance_required (boolean, default: false)
├── about_you (text)
├── last_logged_in (datetime, nullable)
├── account_created_on (date)
├── account_updated_on (date)
├── related_units[] → Unit
├── emergency_contacts[] → EmergencyContact (max 1)
├── notification_preferences → NotificationPreferences
├── vehicles[] → Vehicle (max 3)
├── parking_rental → ParkingRental
├── pets[] → Pet
├── documents[] → UserDocument
└── parcel_waiver → ParcelWaiver

FOB
├── slot_number (integer, 1–6)
├── type (enum: Access Card, FOB, Key, Remote)
└── serial_number (string)

BuzzerCode
├── slot_number (integer, 1–2)
├── code (string)
└── comment (string)

GarageClicker
├── slot_number (integer, 1–2)
└── identifier (string)

EmergencyContact
├── name (string)
├── relationship (string)
├── mobile_phone (string)
├── home_phone (string)
├── email (string)
└── comments (text)

NotificationPreferences
├── routine_emails (boolean, default: true)
├── emails_declined (boolean, default: false)
├── agm_notice_opt_in (boolean, default: false)
├── service_request_created (boolean, default: true)
├── service_request_updated (boolean, default: true)
├── new_event_added (boolean, default: true)
└── electronic_notices_consent (boolean, default: true)

Vehicle
├── slot_number (integer, 1–3)
├── plate_number (string)
├── color (string)
└── make_and_model (string)

ParkingRental
├── renting (boolean)
└── renting_from_unit (string, nullable)

Pet
├── has_pets (boolean)
├── number_of_pets (integer, nullable)
├── names (string, comma-separated)
├── age (string)
├── breed (string)
├── size (string)
├── weight (string, comma-separated)
├── image (blob, nullable)
└── service_dog (boolean, default: false)

UserDocument
├── type (enum: Power of Attorney, Lease Agreement, Insurance Certificate)
└── file (blob)

ParcelWaiver
├── signed_at (datetime, nullable)
├── attachment (blob, with file size in KB)
└── notes (text)

Package
├── reference_number (integer, auto-generated)
├── added_by → User (staff)
├── for_user → User (resident)
├── released (boolean)
├── released_by → User (staff, nullable)
├── released_to → User (resident, nullable)
├── details (text, e.g., "brown box", "WHITE PACKAGE")
├── courier_name (string, e.g., Amazon, DHL, Canada Post, Other)
├── tracking_number (string, nullable)
└── storage_spot (string, e.g., "CACF", "Parcel Room")

ParkingPermit
├── plate_number (string)
├── added_by → User (staff)
├── start_time (datetime)
├── end_time (datetime)
├── vehicle_details (string)
├── visitor_type (string)
├── visitor_name (string)
├── signed_out (boolean)
└── comments (text)

StaffUser
├── username (string, e.g., "adminpm", "Ray_007", "Bond_Concierge")
├── first_name (string)
├── last_name (string)
├── email (string)
├── group (enum: property_manager, supervisor, guard)
└── account_status (enum: Active, Disabled)
```
