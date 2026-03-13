# Units/Occupants Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Units/Occupants module.

---

## Overview

**Access**: Sidebar → Units/occupants (direct link)
**URL**: `/v2/mgmt/unitprofile/searchunit.aspx`

The Units/Occupants module is the core resident and unit management hub. It contains a searchable directory of all building units with 4 tabs per unit profile: Unit Overview (modern SPA), Unit Details (legacy ASP.NET), Occupants (legacy), and Documents (legacy).

---

## 1. Search Unit Profiles

**URL**: `/v2/mgmt/unitprofile/searchunit.aspx`

### Page Title
"Search Unit Profiles"

### Header Bar
- **Title**: "View Unit Profiles"
- **+ Create New Unit Profile** button (green, top right)

### Basic Search Fields

| Field | Type | Description |
|-------|------|-------------|
| Search for Unit | Text input | "Enter any part of Unit #, Company/Family Name, Contact Name or Email Address. Leave blank to display all entries." |
| Sort By | Radio buttons (2) | ◉ Unit # / ○ Company/Family Name |
| Include Deactivated Units | Checkbox | ☐ Unchecked by default |

### Actions
- **🔍 Search** button (blue)
- **🔍 Advanced Search** button (blue)

### Advanced Search Fields (revealed on click)

| Field | Type | Description |
|-------|------|-------------|
| Date Created | Date range (From/To) | Calendar picker icons, filter by unit creation date |
| Units to Include | Checkboxes (2) | ☐ Unit with Subtenants / ☐ Unit without Subtenants |
| (hide button) | Button | **< hide** — collapses advanced search |

### Results Table Columns (4)

| # | Column | Description |
|---|--------|-------------|
| 1 | Unit # | Unit/apartment number (clickable — links to Unit Overview) |
| 2 | Company/Family Name | Last name(s) of occupants, "/" separated. "(s)" prefix indicates subtenants |
| 3 | Contact Name | Full names of all occupants, "/" separated. "(s)" prefix for subtenants |
| 4 | Email | Email addresses of all occupants, semicolon separated |

### Pagination
- Page navigation: |< < 1 > >|
- Page size: dropdown (default "All")
- Display: "Page 1 of 1, Items 1 to 171 of 171"

### Special Unit Types Observed
| Unit # | Type | Description |
|--------|------|-------------|
| Commercial Unit | Commercial | Stores/businesses in the building (Dentistry, Education, Pharmacy, Store) |
| Bldg Mgmt | Management | Building management unit (no occupants listed) |
| Unit 13x | Residential | Standard residential unit |
| Unit 201–xxx | Residential | Standard numbered units |

### Key Observations
- **171 total units** in the property (170 + 1 page showing all)
- Family names use "/" separator for multiple families in same unit
- "(s)" notation indicates subtenant occupants
- Column headers are clickable for re-sorting (ascending/descending toggle)
- Email column shows all occupant emails for the unit

---

## 2. Unit Overview Tab (Modern SPA)

**URL**: `/unit-overview/staff?UnitId={id}&pid={pid}&IncludeInactive=0&SortBy=`

### Header
| Element | Description |
|---------|-------------|
| Unit number | Large heading: "Unit 204" |
| Previous/Next navigation | "< Unit 203  Unit 205 >" breadcrumb links |
| **Deactivate** button | Red button, top right |

### Tabs (4)
1. **Unit Overview** (default, modern SPA)
2. **Unit Details** (legacy ASP.NET)
3. **Occupants** (legacy ASP.NET)
4. **Documents** (legacy ASP.NET)

### Left Panel — Occupants Section

**Title**: "Occupants" with "Intercom:" label (shows intercom code if set)

#### Occupant Card Layout
Each occupant displays as a card with:

| Element | Description |
|---------|-------------|
| Avatar | Circle with initials (e.g., "SA", "FK", "TL") and edit pencil icon overlay |
| Name | Full name (e.g., "Tony R. Luna") |
| Type badge | Color-coded: **OWNER** (green/teal badge, green card border), **TENANT** (yellow/orange badge, orange card border) |
| Cellphone | Phone number with info icon (ℹ️) and star icon (☆) |
| Email | Clickable email link |
| Emergency Contact | Label (shows value if present) |
| **Send message** | Link — opens messaging interface |
| **Send email** | Link — opens email composer |
| Collapse/Expand | Arrow (▲) in top-right of card |

#### Multi-Occupant Display
- Multiple occupant cards stack vertically
- Border color differentiates type: **green border = Owner**, **orange border = Tenant**
- Each card independently expandable/collapsible

### Right Panel — Unit Sections (10 total)

**⚙ Hide/show content** — Toggle button at top of right panel for showing/hiding sections

All sections have drag handles (⋮⋮) for reordering.

#### Section 1: Instructions
| Element | Description |
|---------|-------------|
| Title | "Instructions" |
| Action | **Add new** link (teal) |
| Content | Front desk instructions specific to this unit |

#### Section 2: Events
| Element | Description |
|---------|-------------|
| Title | "Events" |
| Actions | **Closed events** link (teal) / **Add new** link (teal) |
| Table columns | Type, Date, Description |
| Color indicator | Yellow left border on event rows (indicates event type) |
| Observed data | Amazon event on 3/13/2026 — "white package" |

#### Section 3: Custom Fields
| Element | Description |
|---------|-------------|
| Title | "Custom Fields" |
| Action | **Edit** link (teal) |
| Layout | 2-column grid of custom field name-value pairs |
| Observed fields | Parking: R57, Locker: 84, "If this is a company, enter 'C' here", Pet Names, Breed, Pet Size |

#### Section 4: Maintenance Requests
| Element | Description |
|---------|-------------|
| Title | "Maintenance Requests" |
| Action | **Add new** link (teal) |
| Content | List of maintenance requests for this unit |

#### Section 5: Reservations
| Element | Description |
|---------|-------------|
| Title | "Reservations" |
| Actions | **Show previous** link (teal) / **Add new** link (teal) |
| Content | Amenity reservations for this unit |

#### Section 6: Parking Permits
| Element | Description |
|---------|-------------|
| Title | "Parking Permits" |
| Action | **Add new** link (teal) |
| Content | Parking permits assigned to this unit |

#### Section 7: Pets in Registry
| Element | Description |
|---------|-------------|
| Title | "Pets in Registry" |
| Action | **Add new** link (teal) |
| Content | Pets registered to this unit |

#### Section 8: Vehicle Information
| Element | Description |
|---------|-------------|
| Title | "Vehicle Information" |
| Action | **Add new** link (teal) |
| Content | Vehicles registered to this unit |

#### Section 9: Asset manager
| Element | Description |
|---------|-------------|
| Title | "Asset manager" |
| Content | Unit-level assets (no Add new observed) |

#### Section 10: Alterations
| Element | Description |
|---------|-------------|
| Title | "Alterations" |
| Content | Renovation/alteration projects for this unit |

---

## 3. Unit Details Tab (Legacy ASP.NET)

**URL**: `/v2/mgmt/UnitProfile/UnitDetails.aspx?UnitId={id}&pid={pid}`

### Header
| Element | Description |
|---------|-------------|
| Title | "Unit 203 Luna" |
| Navigation | "< 202 | Unit 5 of 170 | 204 >" |
| **✖ Move Out / Deactivate** | Red button |
| **+ Create New Unit Profile** | Green button |
| **🔍 Search** | Link to return to search |

### Actions
- **✏ Edit Unit Details** button (green)

### Section 1: Basic Unit Information

| # | Field | Type | Example Value |
|---|-------|------|---------------|
| 1 | Unit # | Display | Unit 203 |
| 2 | Account # | Text | (empty) |
| 3 | Family Name(s) / Company Name | Text | Luna |
| 4 | Subtenant Family Name(s) / Company Name | Text | (empty) |
| 5 | In an emergency, who else has a key? | Text | (empty) |
| 6 | Other Emergency Info. (contact, alarm, medical or fire info) | Text | (empty) |
| 7 | Intercom | Text | (empty) |
| 8 | Show this unit's Open Events on the Public Display monitor? | Display | Yes |

### Section 2: Physical Unit Custom Fields

| # | Field | Example Value |
|---|-------|---------------|
| 1 | If this is a company, enter 'C' here | (empty) |
| 2 | Parking | R113 |
| 3 | Locker | (empty) |

### Section 3: Unit Profile Custom Fields

| # | Field | Example Value |
|---|-------|---------------|
| 1 | Pet Names | (empty) |
| 2 | Breed | (empty) |
| 3 | Pet Size | (empty) |

### Section 4: Alternate Address

| # | Field | Description |
|---|-------|-------------|
| 1 | ☐ Use this address when printing mailing labels | Checkbox — *First Level Occupants only* |
| 2 | Name | Alternate contact name |
| 3 | Address Line 1 | Street address |
| 4 | Address Line 2 | Suite/apt |
| 5 | City | City |
| 6 | State / Country | State and country |
| 7 | Zip | Postal code |

### Audit Trail
- "This record was last changed by BuildingLink Admin404 on Thu 1/23/25 9:51 AM"

---

## 4. Occupants Tab (Legacy ASP.NET)

**URL**: `/v2/mgmt/UnitProfile/ManageOccupants.aspx?UnitId={id}&pid={pid}`

### Header
- **Title**: "Manage Occupants"
- **☐ Include Deactivated Occupants** — checkbox filter
- **+ Add Occupant** button (green, left)
- **✏ Edit All Occupants** button (white, right)

### Occupant Card Layout (per occupant)

Each occupant is displayed as a horizontal card with photo, details, and action buttons.

#### Photo Section
| Element | Description |
|---------|-------------|
| Photo | Resident photo or "NO PHOTO" silhouette placeholder |

#### Details Section — Column 1

| Field | Description |
|-------|-------------|
| **Name** | Full name with Type badge (Owner=yellow, Tenant=green) |
| Phone | "(C) 4163887927" — (C) = Cell, (H) = Home, (W) = Work |
| Email | Clickable email link |
| Emergency | Emergency contact info |
| Access Control ID | Access control system identifier |
| Account Number | Account reference number |

#### Details Section — Column 2

| Field | Description |
|-------|-------------|
| Username | Login username (e.g., "tluna8") |
| Login Information Sent? | Status: "Bulk Sent" / "Sent" / "Not Sent" |
| Last Login | Timestamp: "Sun 2/22/26 12:24 PM" or "Never" |
| Permissions | "Primary User" or other permission level |
| Created | Timestamp with creator: "1/23/25 9:54 AM by BuildingLink Admin404" |
| Last Changed | Timestamp with modifier: "12/3/25 2:38 PM by Tony R. Luna" |

#### Details Section — Column 3

| Field | Description |
|-------|-------------|
| Custom Fields | Header for occupant-specific custom fields |
| (custom fields) | Configurable per building |

#### Action Buttons (4, right column)

| # | Button | Color | Description |
|---|--------|-------|-------------|
| 1 | ✏ Edit Occupant | Blue | Opens edit form for this occupant |
| 2 | ✖ Remove Occupant | Red | Removes occupant from unit |
| 3 | ✉ Email Login Info | Green | Sends login credentials to occupant email |
| 4 | 🖨 Print Login Info | White | Prints login information |

### Multi-Occupant Display
- Occupant cards stack vertically with separating borders
- Each card has identical layout with independent action buttons
- **Occupant navigation**: "Occupant 1 of N" with Previous/Next when editing

### Observed Occupant Types
| Type | Badge Color | Description |
|------|------------|-------------|
| Owner | Yellow | Unit owner |
| Tenant | Green | Renting occupant |
| (subtenant) | — | Indicated by "(s)" in family names on search page |

---

## 5. Edit Occupant Form (Legacy ASP.NET)

**URL**: `/v2/mgmt/UnitProfile/EditOccupant.aspx?UserId={id}&UnitId={unitId}&pid={pid}`

### Header
- **Title**: "Edit - Tony R. Luna"
- **💾 Save Changes** button (green)
- **✖ Cancel** button (red)
- **Occupant navigation**: "< Previous | Occupant 1 of 1 | Next >"

### Section 1: Basic Occupant Information

| # | Field | Type | Required | Example |
|---|-------|------|----------|---------|
| 1 | First Name | Text input | No | Tony R. |
| 2 | Middle Name | Text input | No | (empty) |
| 3 | Last Name | Text input | Yes *(Required)* | Luna |
| 4 | Unit | Dropdown + checkbox | No | 203 + ☐ "Advanced Feature: Check here to move this user to a different unit." |
| 5 | List in Resident Directory (seen by other residents)? | Radio (2) | No | ○ Yes / ◉ No |

### Section 2: Security & Permissions

| # | Field | Type | Current Value |
|---|-------|------|---------------|
| 1 | Occupant Type | Display + link | **Owner** badge + "Change Occupant Type" link |
| 2 | Allow User to log in? | Radio (2) | ◉ Yes / ○ No |
| 3 | Login Name | Text input + 🔍 Suggest Username | "tluna8" |
| 4 | Password | Masked + link | ***** + "Generate A New Password" link |
| 5 | Display "Introduction for New Users" when logging in? | Radio (2) | ○ Yes / ◉ No |
| 6 | Board Member Status | Radio (2) | ◉ No / ○ Yes |
| 7 | Limit User to "Read Only" Authority? | Radio (2) | ◉ No / ○ Yes |

### Section 3: Occupant Custom Fields

| # | Field | Type | Example |
|---|-------|------|---------|
| 1 | Account Number | Text input | (empty) |

**Note**: Custom fields are configurable per building. This section shows building-defined occupant-level custom fields.

### Section 4: Occupant Photos (right panel)

| # | Photo Type | Description |
|---|-----------|-------------|
| 1 | Official Resident Photo (Captured by Staff) | Staff-captured photo, "NO PHOTO" placeholder with "ADD PHOTO" link |
| 2 | Public Profile Photo (Uploaded by Resident) | Resident self-uploaded photo, "NO PHOTO" placeholder |

### Section 5: Contact Information (right panel)

| # | Field | Type | Example |
|---|-------|------|---------|
| 1 | Home Phone | Text input | (empty) |
| 2 | Cell Phone | Text input | 4163887927 |
| 3 | Work Phone | Text input | (empty) |
| 4 | Fax | Text input | (empty) |
| 5 | Email | Text input | tonyluna269@hotmail.com |
| 6 | Emergency Contact Info | Textarea | (empty) |

### Section 6: Notification Preferences (right panel)

**Title**: "Notification Preferences for Tony R. Luna"

#### Text Message Consent
| Setting | Type | Current |
|---------|------|---------|
| Should Building Staff be able to contact you via Text Message when necessary? (This setting does not apply to Emergency Broadcasts.) | Radio (2) | ◉ Yes / ○ No |

#### Notifications from Management
**Action**: "Restore Building Default Settings" link (teal, right)

**Header**: "Do you want to be notified when . . ."

| # | Notification Trigger | Toggle | Email | SMS | Frequency |
|---|---------------------|--------|-------|-----|-----------|
| 1 | ...an action is taken on your open Maintenance Requests? | Yes (green) | ☑ Email | — | — |
| 2 | ...a new survey question is posted by Management? | Yes (green) | ☑ Email | — | — |
| 3 | ...a new event is recorded for your unit? (i.e. Packages, Deliveries, Pickups) | Yes (green) | ☑ Email | ☐ SMS Text Message | — |
| 4 | ...Calendar Event Notifications | No (grey) | ☐ Email | — | — |

#### Resident-to-Resident Communications
**Action**: "Restore Building Default Settings" link (teal, right)

**Header**: "Do you want to be notified when . . ."

| # | Notification Trigger | Toggle | Email | Frequency |
|---|---------------------|--------|-------|-----------|
| 1 | ...a new post is added to the Resident Bulletin Board? | Yes (green) | ☑ Email | Dropdown: "As it Occurs" |

### Audit Trail
- "This record was last changed by Tony R. Luna on"

---

## 6. Unit/Apt. Documents Tab (Legacy ASP.NET)

**URL**: `/v2/mgmt/UnitProfile/DocumentMgmt.aspx?UnitId={id}&pid={pid}`

### Header
- **Title**: "Unit/Apt. Documents (0)" — count in parentheses

### Actions
- **+ Add a New Document** button (green)

### Document List
- Empty state: No documents (just the header and Add button)
- Documents would list uploaded files associated with the unit

---

## Unit Type Notation Conventions

| Notation | Meaning |
|----------|---------|
| "/" between names | Multiple occupants/families in same unit |
| "(s)" prefix | Subtenant occupant (e.g., "(s) Salem Almashaqbeh") |
| Company names | Commercial units use business names instead of family names |
| "Bldg Mgmt" | Building management pseudo-unit |

---

## Concierge Design Implications

### From Units/Occupants Deep Dive
1. **4-tab unit profile** — Overview (modern SPA) + 3 legacy tabs; Concierge should unify into single modern interface
2. **10 right-panel sections on Unit Overview** — modular, drag-reorderable widgets covering all aspects of unit life
3. **Occupant type badges** with color coding — Owner (green/teal), Tenant (yellow/orange) — visual hierarchy for quick identification
4. **Dual photo system** — Official (staff-captured) vs Public (resident-uploaded) — important for security vs community features
5. **7 security/permission fields per occupant** — granular access control including login, board member status, read-only mode
6. **5 notification preference categories** — per-occupant notification settings with Email + SMS + frequency options
7. **Resident-to-Resident communication preferences** — separate from management notifications
8. **"Restore Building Default Settings"** — per-occupant override of building-wide notification defaults
9. **Advanced search with subtenant filter** — ability to find units with/without subtenants
10. **Login information management** — username suggestion, password generation, email/print login info — full self-service onboarding
11. **171 units** observed in this property with **170 numbered + 1 commercial + 1 management**
12. **Alternate address per unit** — for mailing labels, especially for first-level occupants
13. **Emergency information at unit level** — who has keys, medical/fire info — critical for building safety
14. **Public Display monitor toggle** — per-unit opt-in/out for lobby screen event display
15. **Account number field** — suggests integration with accounting/billing systems
16. **Access Control ID field** — integration point for physical access systems (FOBs, key cards)
17. **Custom fields at 3 levels**: Physical Unit fields, Unit Profile fields, Occupant fields — highly configurable
18. **Move user between units** — advanced feature checkbox on unit dropdown enables cross-unit transfers
19. **Deactivation workflow** — "Move Out / Deactivate" button with separate "Include Deactivated" filter for historical access
20. **Audit trail on every record** — both unit details and occupant records track who changed what and when
