# Settings Module — Granular Deep Dive

Field-level documentation of every settings category, configuration option, and setup page in BuildingLink's Settings module.

---

## Overview

**Access**: Settings link in the left sidebar navigation (no submenu — direct panel open)
**Panel Title**: "General Building Set-Up Options"

The Settings module contains **24 configuration categories** displayed as a scrollable list in a panel that overlays the current page content. Each category links to a dedicated setup page.

**Navigation quirk**: The Settings panel is rendered as a hidden sidebar panel (Vue component). On legacy iframe-based pages it opens as a visible overlay. On modern SPA pages it exists in the DOM but requires programmatic interaction. Items use Vue @click handlers (not standard `<a>` links).

---

## Settings Categories (24 total)

| # | Category | Subtitle | URL |
|---|----------|----------|-----|
| 1 | Property directory | Main addresses, contacts, message links | `/v2/mgmt/Communicate/BuildingDirectorySettings.aspx` |
| 2 | Amenities | — | `/v2/mgmt/amenities/amenities.aspx` |
| 3 | Asset Manager | — | `/v2/mgmt/assets/setupgroups.aspx` |
| 4 | Authorized computers | — | `/v2/mgmt/Setup/BuildingLinkComputers.aspx` |
| 5 | Calendar | — | `/calendar/staff` (Modern SPA) |
| 6 | Custom fields | — | `/v2/mgmt/customfields/manage.aspx` |
| 7 | Design center | — | `/V2/Mgmt/DesignCenter/Dashboard.aspx` |
| 8 | Displays and consoles | — | `/v2/mgmt/publicterminalusers/default.aspx` |
| 9 | Document types | — | `/v2/mgmt/DocumentManagement/DocumentTypes.aspx` |
| 10 | Employees | — | `/v2/mgmt/employees/Default.aspx` |
| 11 | Event log | General settings, event type, event locations | `/event-log/staff/event-settings` (Modern SPA) |
| 12 | Event types | — | `/event-log/staff/event-type` (Modern SPA) |
| 13 | Front desk instructions | — | `/front-desk-instructions/staff/instruction-types` (Modern SPA) |
| 14 | Holidays | — | `/v2/mgmt/ETT/HolidayManagement.aspx` |
| 15 | Incident reports | Inactive and active types | `/v2/mgmt/incidentreports/IncidentReportSettings.aspx` |
| 16 | Library categories | — | `/v2/mgmt/library/LibraryCategories.aspx` |
| 17 | Maintenance/repair categories | — | `/maintenance2/staff/categories` (Modern SPA) |
| 18 | Occupant types | — | `/v2/Mgmt/Setup/DisplayUserTypes.aspx` (RESTRICTED) |
| 19 | Parking permits | — | `/v2/mgmt/Parking/ParkingPermitTypes.aspx` |
| 20 | Physical units | — | `/v2/mgmt/physicalunits/menu.aspx` |
| 21 | Predefined maintenance responses | — | `/maintenance2/staff/predefined-responses` (Modern SPA) |
| 22 | Resident posting categories | — | `/v2/Mgmt/Postings/categorymanager.aspx` |
| 23 | Shift log settings | — | `/shift-log/staff/settings` (Modern SPA) |
| 24 | Special permissions | — | `/v2/mgmt/permissions/staffpermissions.aspx` (RESTRICTED) |

---

## 1. Property Directory Settings

**URL**: `/v2/mgmt/Communicate/BuildingDirectorySettings.aspx`

### Section 1: Main Addresses
**Preview buttons (2, top right):**
- **Preview Staff "Building Directory" Page**
- **Preview Resident "Communicate" Page**

#### Addresses Table Columns (9)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Type) | Address type (Building, Management Company) |
| 2 | Name | Entity name |
| 3 | Address | Street address |
| 4 | City | City |
| 5 | State | Province/State |
| 6 | Zip | Postal code |
| 7 | Country | Country |
| 8 | Phone | Phone number |
| 9 | (Action) | Edit link |

#### Observed Addresses (2)
| Type | Name | Address | City | State | Zip | Country | Phone |
|------|------|---------|------|-------|-----|---------|-------|
| Building | Queensway Park Condos - TSCC 2934 | 7 Smith Crescent | Etobicoke | Ontario | M8Z 0G3 | Canada | 416-259-2323 |
| Management Company | Duka Property Management | 6205 Airport Rd | Mississauga | Ontario | ON L4V 1E1 | Canada | — |

### Section 2: Contacts
**Action**: **+ Add Contact** button (green, top right)

#### Contacts Table Columns (10)
| # | Column | Description |
|---|--------|-------------|
| 1 | Title | Contact role/title |
| 2 | First Name | First name |
| 3 | Last Name | Last name |
| 4 | Email | Email address |
| 5 | Work Phone | Work phone number |
| 6 | Cell Phone | Cell phone number |
| 7 | Fax | Fax number |
| 8 | Show Residents | Checkbox — visible to residents |
| 9 | (Order) | Display order dropdown |
| 10 | (Action) | Edit link |

#### Observed Contacts (3)
| Title | First Name | Last Name | Email | Work Phone | Order |
|-------|------------|-----------|-------|------------|-------|
| Property Manager | Gledis | Xhoxhi | queenswaypark.cm@dukamanagement.com | 416-259-2323 | 1 |
| Concierge | — | Desk | tscc2934concierge@royalcas.ca | 416-503-4806 | 2 |
| Site Administrator | Sidita | Nazifi | queenswaypark.office@dukamanagement.com | 416-259-2323 | 3 |

### Section 3: Message Links
**Action**: **+ Add Message Link** button (green, top right)

#### Message Links Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Title | Link name |
| 2 | Staff | Visible to staff |
| 3 | Owner | Visible to owners |
| 4 | Tenant | Visible to tenants |
| 5 | Board | Visible to board members |
| 6 | Recipients | Email recipients |
| 7 | (Order) | Display order |

#### Observed Message Links (1)
| Title | Staff | Owner | Tenant | Board | Recipients |
|-------|-------|-------|--------|-------|------------|
| Send Message to Manager | Yes | Yes | Yes | Yes | queenswaypark.office@dukamanagement.com |

---

## 2. Amenity Reservations Settings

**URL**: `/v2/mgmt/amenities/amenities.aspx`

### Tabs (2)
1. **Amenities** (default) — View/edit individual amenities
2. **Amenity Groups** — Group amenities together

### Options
- **Include inactive amenities** checkbox (unchecked)

### Amenities Table Columns (9)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Image) | Amenity photo or "No image" placeholder |
| 2 | Amenity Name | Name of the amenity |
| 3 | Status | Active/Inactive |
| 4 | Approve Automatically | Whether bookings auto-approve |
| 5 | Can Resident View? | Residents can see availability |
| 6 | Can Resident enter Multi-Day Reservations? | Multi-day booking support |
| 7 | Allow Reservations That Overlap | Concurrent booking support |
| 8 | Amenity Group (optional) | Group assignment |
| 9 | Mgmt Notifications Sent To | Email addresses for booking notifications |

### Observed Amenities (4)
| Amenity | Status | Auto-Approve | Resident View | Multi-Day | Overlap | Notifications |
|---------|--------|-------------|---------------|-----------|---------|---------------|
| BBQ 1 | Active | No | Yes | No | No | office + concierge |
| BBQ 2 | Active | No | Yes | No | No | office + concierge |
| Moving Elevator | Active | No | Yes | No | No | office + concierge |
| Party room | Active | No | Yes | No | No | office + concierge |

### Key Observations
- No amenities auto-approve — all require staff approval
- All amenities visible to residents
- None allow overlapping or multi-day reservations
- Dual notification recipients: queenswaypark.office@dukamanagement.com + tscc2934concierge@royalcas.ca
- **+ Add New Amenity** button (green, top right)

---

## 3. Asset Manager Settings

**URL**: `/v2/mgmt/assets/setupgroups.aspx`
**Title**: "Asset Manager Setup"

### Asset Groups (5)

#### Group 1: In-Unit Appliances/Equipment
| Field | Value |
|-------|-------|
| Status | Active |
| Equipment Types (17) | A/C Units, Boilers, Dishwashers, Dryers, Fixtures, Flooring, Furnaces, Garbage Disposals, Microwaves, Ranges, Refrigerators, Stovetops, Trash Compactors, Wall Ovens, Washers, Water Heaters |
| Form Fields | Equipment Type, Description, Manufacturer, Model, Serial Number, Color, Purchase Date, Last Service Date, Install Date, Unit #, Location, Warranty Exp. Date, Asset Tag, Notes, Active |

#### Group 2: Parking Spaces
| Field | Value |
|-------|-------|
| Status | Active |
| Parking Categories (2) | Indoor Parking, Outdoor Parking |
| Form Fields | Category, Space #, Size/Type, Location, Assigned To, Start Date, End Date, Asset Tag, Active, Notes |

#### Group 3: Rental/Loaner Items
| Field | Value |
|-------|-------|
| Status | Active |
| Categories (10) | Bicycles, Billiards sets, Books, Dart Sets, DVDs/CDs, Game Consoles, Golf Clubs, Ping-Pong sets, Tennis Rackets, Vehicles |
| Form Fields | Category, Description/Title, Current Availability Status, Assigned To, Start Date, End Date, Asset Tag, Notes, Active |

#### Group 4: Storage Spaces
| Field | Value |
|-------|-------|
| Status | Active |
| Storage Types (3) | Bicycle Slots, Lockers, Storage Rooms |
| Form Fields | Storage Type, Space#, Location, Size/Type, Assigned To, Start Date, End Date, Asset Tag, Notes, Active |

#### Group 5: Other Assets
| Field | Value |
|-------|-------|
| Status | Active |
| Categories (2) | Electronic Equipment, Power Tools |
| Form Fields | Category, Description, Sub-Category, Current Location, Location as of, Purchase Date, Purchased From, Asset Tag, Notes, Active |

### Per-Group Actions
- **Edit** link on Categories/Equipment Types
- **Edit** link on Form Fields
- **Change Status** link (activate/deactivate group)

---

## 4. Authorized Computers

**URL**: `/v2/mgmt/Setup/BuildingLinkComputers.aspx`
**Title**: "Authorized Computers Dashboard"

### Description
Allows restricting certain Employees or Employee types to logging in to BuildingLink only on computers designated as "Authorized". For example, restricting Front Desk staff to specific onsite computers.

### Section 1: Employee Login Restrictions
| Field | Description |
|-------|-------------|
| Employee | Employee name |
| Authority | Authority level |
| Permission Setting | Authorized Computers Only restriction |
| Action | Edit/Remove |
| **+ Add new record** | Button to add restriction |

**Current state**: No employee login restrictions configured.

### Section 2: Authorized Computers
- Shows current computer's ID# and authorization status
- Current computer (ID# 181581974): **Unauthorized** for Chrome browser at www.buildinglink.com
- **Authorize** link to designate current computer as authorized

---

## 5. Calendar Settings

**URL**: `/calendar/staff` (Modern SPA)
**Title**: "Building calendar"

### Tabs (3)
1. **Monthly view** — Standard calendar grid
2. **List view** — List of calendar events
3. **Calendar categories** — Category configuration (settings)

### Calendar Categories Tab
**Action**: **Add category** button (top right)

#### Category Table Columns (4)
| # | Column | Description |
|---|--------|-------------|
| 1 | Name/Color | Category name with color indicator |
| 2 | Public display | Whether shown on public display |
| 3 | Who can post | Permission level for creating events |
| 4 | Who can view | Permission level for viewing events |

#### Observed Categories (2)
| Name | Color | Public Display | Who Can Post | Who Can View |
|------|-------|---------------|-------------|-------------|
| Management Only | Pink/Red | No | Mgmt | Mgmt |
| Building Events | Light Blue | Yes | Mgmt, Non-mgmt employees | Board, Mgmt, Non-mgmt employees, Resident |

### Calendar Main View Features
- Month navigation (< > arrows, month/year dropdown)
- **Today** button (highlights current date)
- **Search events** text input
- **Categories** dropdown filter
- **Clear filters** link
- **Print view** button
- **Add calendar entry** button
- **Reservation calendar** link

---

## 6. Custom Fields Settings

**URL**: `/v2/mgmt/customfields/manage.aspx`
**Title**: "Custom Fields"

### Tabs (3)
1. **Physical Unit** — Fields attached to unit records
2. **Unit Profile/Occupancy** — Fields for occupancy records
3. **Occupant** — Fields for individual occupants

### Physical Unit Custom Fields Tab (default)
**Action**: **Add Physical Unit Custom Field** button
**Option**: **Show Inactive Fields** checkbox

#### Custom Fields Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Custom Field | Field name/label |
| 2 | Data Type | Text Field, Dropdown, etc. |
| 3 | Permission | Who can view/edit |
| 4 | Show to Front Desk | Visibility flag |
| 5 | Print on Work Order | Include on maintenance work orders |
| 6 | Action | Edit link |
| 7 | Sort Order | Drag-to-reorder (1, 2, 3) |

#### Observed Custom Fields (3)
| Custom Field | Data Type | Permission | Show to Front Desk |
|-------------|-----------|------------|-------------------|
| If this is a company, enter 'C' here | Text Field | Only Manager Can View/Edit | Show to Front Desk |
| Parking | Text Field | Only Manager Can View/Edit | Show to Front Desk |
| Locker | Text Field | Only Manager Can View/Edit | Show to Front Desk |

---

## 7. Design Center

**URL**: `/V2/Mgmt/DesignCenter/Dashboard.aspx`

### Customization Areas (5)
| # | Area | Description |
|---|------|-------------|
| 1 | Resident Passport | Customize resident ID card design |
| 2 | Public Displays | Configure lobby screen visual layout |
| 3 | Email Design Templates | Customize email templates and branding |
| 4 | Website Building Images | Upload/manage building photos for the portal |
| 5 | Mobile Apps | Configure mobile app branding/appearance |

Each area has a **About** expandable section for more details.

---

## 8. Displays and Consoles

**URL**: `/v2/mgmt/publicterminalusers/default.aspx`
**Title**: "Displays and Consoles"

### Description
Create and Manage Logins for any Displays and Consoles you wish to activate for your facility. "Display" logins allow you to create digital signage templates for public displays for packages or announcements. "Console" logins allow you to bring up special-purpose screens for employee time clock functions.

### Controls
- **Export to Excel** button
- **Add Display/Console** button
- **Options** dropdown
- **Include Inactive** checkbox
- Paging controls

### Current State
No displays or consoles configured (empty list).

---

## 9. Document Types

**URL**: `/v2/mgmt/DocumentManagement/DocumentTypes.aspx`
**Title**: "Document Types"

### Description
List of document types defined for each document workflow category active for this building.

**Action**: **Add New Document Type** button

### Document Types Table Columns (6)
| # | Column | Description |
|---|--------|-------------|
| 1 | Name | Document type name |
| 2 | Status | Active/Inactive |
| 3 | Permissions | Who can add, edit, view |
| 4 | Email Notification | Notification setting |
| 5 | Workflow Category | Document workflow category |
| 6 | # of Active Documents | Count of documents using this type |

### Observed Document Types (7+)
| Name | Status | Permissions | Notification | Workflow Category | Active Docs |
|------|--------|-------------|-------------|-------------------|-------------|
| Correspondence | Active | Manager Users can Add, Edit & View | No Notification | Unit/Apt. Documents | 0 |
| Floor Plans | Active | Manager Users can Add, Edit & View | No Notification | Unit/Apt. Documents | 0 |
| Insurance | Active | Manager Users can Add, Edit & View | No Notification | Unit/Apt. Documents | 0 |
| Lease Documents | Active | Manager Users can Add, Edit & View | No Notification | Unit/Apt. Documents | 0 |
| PoweG5 Model - Brochure and Technical Specifications | Active | Manager + Owners + Tenants can View | Residents | Unit/Apt. Documents | 0 |
| Signed Documents & Waivers | Active | Manager Users can Add, Edit & View | No Notification | Unit/Apt. Documents | 0+ |

---

## 10. Employees Settings

**URL**: `/v2/mgmt/employees/Default.aspx`
**Title**: "Employees"

### Tabs (7)
1. **Employee List** (default)
2. **Contact Info**
3. **Photo Directory**
4. **Manage Work Schedules**
5. **Daily Schedule**
6. **Biometric ID**
7. **Special Permissions**

### Employee List Tab
**Actions**: **Export to Excel**, **Add New Employee**
**Options**: **Photos** toggle, **Include Inactive Employees** checkbox
**Legend**: Scheduled to be On Duty (highlighted) / Off Duty

#### Employee Table Columns (12)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Photo) | Employee photo/initials |
| 2 | Employee Name | Full name with initials |
| 3 | Initials | 2-letter initials |
| 4 | Status | active/inactive |
| 5 | Authority | Security Officer / Manager / Front Desk |
| 6 | Can Log In to Website? | Yes/No |
| 7 | Can Log In to GEO? | Yes/No (mobile app) |
| 8 | Show in Directory? | Yes/No |
| 9 | Directory Photo | Yes/No |
| 10 | Assign to Maint Req? | Can be assigned to maintenance requests |
| 11 | Last Login Date | Timestamp of last login |
| 12 | Notes | Free text notes |

#### Observed Employees (7+)
| Name | Initials | Status | Authority | Last Login |
|------|----------|--------|-----------|------------|
| BuildingLink Early Access | BE | active | Security Officer | — |
| Royal Security Front desk | RF | active | Front Desk | 3/13/26 1:43 PM |
| Rajesh Reddy Jonnalagadda | RJ | active | Manager | 3/13/26 1:42 PM |
| Susmitha Katuri | SK | active | Manager | 3/1/26 2:58 PM |
| Simranjeet Kaur | SK | active | Front Desk | 6/23/25 9:09 AM |
| Ray Kodavali | RK | active | Manager | 3/13/26 3:21 PM |

---

## 11. Event Log Settings (Modern SPA)

**URL**: `/event-log/staff/event-settings`

### Tabs (2)
1. **Event types** — Manage event type definitions
2. **General Settings** (default when navigated from Settings panel)

### General Settings Fields

#### Email Notification Configuration
| Field | Type | Current Value |
|-------|------|---------------|
| Name | Tag input | "Queensway Park Condos - TSC..." |
| Email | Tag input | "tscc2934concierge@royalcas.ca" |

#### Notification Settings
| Setting | Type | Current Value |
|---------|------|---------------|
| Allow staff to select notification recipients on event creation | Checkbox | Checked |
| Default notification selection | Radio (3) | "All addresses" selected |
| Management unit events email notifications | Text input | Empty |

#### Signature & Privacy
| Setting | Type | Current Value |
|---------|------|---------------|
| Allowed to view captured signatures | Radio (2) | "All building staff" selected |

#### Module Toggles
| Setting | Type | Current Value |
|---------|------|---------------|
| Use the event "Location" Module | Checkbox | Unchecked |
| Assigning a location should be mandatory | Checkbox | Disabled (greyed out) |
| Show resident's phone numbers on new events | Checkbox | Unchecked |
| Residents can receive voice notifications for packages | Checkbox | Unchecked |
| Residents can receive text notifications for packages | Checkbox | Checked |

#### Audit
- **Last changed by**: BuildingLink Admin350 on 9/19/2025, 04:16 PM

---

## 12. Event Types (Modern SPA)

**URL**: `/event-log/staff/event-type`
**Title**: "Settings" > "Event types" tab

### Controls
- **Show inactive event types** checkbox (unchecked)
- **Add new event type** button (top right)

### Event Types Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Icon | Event type icon (delivery, key, person, etc.) |
| 2 | Color | Color-coded indicator |
| 3 | Event type | Name of the event type |
| 4 | Event group | Category group |
| 5 | On-Open | Action triggered when event is opened/recorded |
| 6 | On-Close | Action triggered when event is closed |
| 7 | Public display | Whether shown on lobby display |
| 8 | Sort order | Display ordering dropdown |

### Event Groups and Types

#### Group: Incoming Deliveries (15 types)
| Event Type | On-Open | Public Display | Sort |
|-----------|---------|---------------|------|
| Amazon | Send Email: You have an Amazon delivery | Yes | 1 |
| Canada Post | Send Email: You have a Canada post delivery | Yes | 2 |
| Canada Parcel | Send Email: A CanPar delivery has arrived for your unit | Yes | 3 |
| Purolator | Send Email: A Purolator package has arrived for your unit | Yes | 4 |
| DHL | Send Email: You have a DHL delivery | Yes | 5 |
| Fedex | Send Email: You have a FedEx delivery | Yes | 6 |
| UPS | Send Email: You have a UPS package | Yes | 7 |
| Package | Send Email: You have a package delivery | Yes | 8 |
| Perishables | Send Email: You have a perishable delivery | Yes | 9 |
| Envelope | Send Email: You have an envelope | Yes | 10 |
| Dry Cleaning/Laundry | Send Email: You have dry cleaning | Yes | 11 |
| Pharmacy | Send Email: You have a delivery from the pharmacy | — | 12 |
| Flowers | Send Email: You have a flower delivery | Yes | 13 |
| Other | Send Email: You have a delivery | Yes | 14 |
| FLEETOPTICS | Send Email: (custom) | Yes | 18 |

#### Group: Keys (1 type)
| Event Type | On-Open | Sort |
|-----------|---------|------|
| Contractor Keys | — | 15 |

#### Group: People (1 type)
| Event Type | On-Open | Sort |
|-----------|---------|------|
| Contractor-In | — | 16 |

#### Group: Loaner Items (1 type)
| Event Type | On-Open | Sort |
|-----------|---------|------|
| Borrowed Item | — | 17 |

### Key Observations
- 18 event types across 4 groups
- All Incoming Deliveries auto-send email notifications on open
- Most delivery types show on public display (lobby screen)
- Carrier-specific icons and colors for each delivery type
- Canadian carriers included (Canada Post, Canada Parcel, Purolator)

---

## 13. Front Desk Instructions Settings (Modern SPA)

**URL**: `/front-desk-instructions/staff/instruction-types`
**Title**: "Instruction settings"

### Tabs (3)
1. **Edit instructions types** (default)
2. **Notifications**
3. **Module configuration**

### Tab 1: Edit Instruction Types
**Action**: **Add a new instruction type** button
**Option**: **Show Inactive Instruction Types** checkbox

#### Instruction Types Table Columns (7)
| # | Column | Description |
|---|--------|-------------|
| 1 | Color | Color-coded indicator |
| 2 | Instruction type description | Name of the type |
| 3 | Abbreviation | Short code |
| 4 | Resident authority | What residents can do |
| 5 | Capture signature | Whether signature capture is enabled |
| 6 | Email notification to | Notification recipients |
| 7 | Order | Sort order |

#### Observed Instruction Types (6)
| Color | Type | Abbreviation | Resident Authority | Capture Sig | Email | Order |
|-------|------|-------------|-------------------|-------------|-------|-------|
| Pink | Instructions from Management | Notes | Cannot View, Enter or Edit | No | No | 1 |
| Yellow | Pass-On Log | Pass-On | Cannot View, Enter or Edit | No | No | 2 |
| Orange | Housekeeper/Dogwalker etc | H/D | View, Enter, Edit | No | No | 3 |
| Yellow-green | Permission to Enter - Permanent | PTE-Perm | View, Enter, Edit | No | No | 4 |
| Light blue | Vacation | Vac | View, Enter, Edit | No | No | 5 |
| Dark red | Do Not Allow | NoEntry | View, Enter, Edit | No | No | 6 |

### Tab 2: Notifications

#### Email Notification Triggers (6 checkboxes)
| # | Trigger | Default |
|---|---------|---------|
| 1 | A resident submits a new instruction | Unchecked |
| 2 | A resident changes an instruction | Unchecked |
| 3 | A resident manually expires an instruction | Unchecked |
| 4 | Building staff submit a new instruction | Unchecked |
| 5 | Building staff changes an instruction | Unchecked |
| 6 | Building staff manually expires an instruction | Unchecked |

#### Notification Settings
| Setting | Type | Current Value |
|---------|------|---------------|
| Email addresses for notifications | Text input (semicolon-separated) | Empty |
| Send confirmation email to resident on add/modify | Checkbox | Unchecked |
| For subtenant/non-resident owner units, who gets notification? | Radio (3) | "Subtenant" selected |
| Instructions automatic notification sender email | Text input | Empty |
| Instructions automatic notification sender name | Text input | Empty |

### Tab 3: Module Configuration

#### Photo/Image Settings
| Setting | Type | Current Value |
|---------|------|---------------|
| Can add photos: Manager users | Checkbox | Checked (locked) |
| Can add photos: Other property staff | Checkbox | Unchecked |
| Can add photos: Residents | Checkbox | Unchecked |
| Can delete photos: Manager users | Checkbox | Checked (locked) |
| Can delete photos: Other property staff | Checkbox | Unchecked |
| Can delete photos: Residents | Checkbox | Unchecked |

#### Other Module Settings
| Setting | Type | Current Value |
|---------|------|---------------|
| Allow staff/residents to specify start date | Radio (Yes/No) | No |
| Prevent access to expired instructions after X days | Number input | 0 (leave blank for indefinite) |

---

## 14. Holidays

**URL**: `/v2/mgmt/ETT/HolidayManagement.aspx`
**Title**: "Holiday Management"

**Action**: **Add Holidays** button

### Holiday Table Columns (9)
| # | Column | Description |
|---|--------|-------------|
| 1 | Holiday | Holiday name |
| 2 | Next Date | Next occurrence date |
| 3 | Recurring/One-Time | Whether it repeats annually |
| 4 | Country | Country association |
| 5 | Auto-add | Automatically added |
| 6 | Staff/Res Calendar | Show on calendars |
| 7 | Scroll Announce | Show as scrolling announcement |
| 8 | Amenities Closed | Close amenities on this day |
| 9 | Religion | Religious association |

### Current State
**No Holidays Selected** — no holidays configured for this building.

---

## 15. Incident Report Settings

**URL**: `/v2/mgmt/incidentreports/IncidentReportSettings.aspx`
**Title**: "Incident Report Settings"

### Description
List of Incident Report Types. Only Active types are available when creating new Incident Reports.

### Incident Types Table Columns (5)
| # | Column | Description |
|---|--------|-------------|
| 1 | Incident Report Name | Type name |
| 2 | Sections | Included report sections |
| 3 | Submitted for Approval Notification Emails | Who gets notified |
| 4 | Submit for Approval Required? | Whether approval workflow is active |
| 5 | Approved and Finalized Notification Emails | Who gets notified on approval |

### Observed Active Types (26, across 2 pages)

| # | Incident Report Name | Sections |
|---|---------------------|----------|
| 1 | Abuse | Emergency Services, Police, Ambulance, Medical/Injury, CCTV |
| 2 | Accident/Injury | Emergency Services, Police, Ambulance, Medical/Injury, Slip & Fall, CCTV |
| 3 | Altercation | Emergency Services, Police, Ambulance, CCTV |
| 4 | Death | Emergency Services, Police, Ambulance, CCTV |
| 5 | Drugs/Alcohol | Police |
| 6-20 | (additional types) | Various section combinations |
| 21 | Rules Infraction | (none) |
| 22 | Shift Change | CCTV |
| 23 | Theft | Police, CCTV |
| 24 | Trespassing | Police, CCTV |
| 25 | Water Leaks/Flooding | (none) |
| 26 | Other | (none) |

**Key observations**:
- All 26 types require approval (Submit for Approval Required: Yes)
- All notifications go to queenswaypark.office@dukamanagement.com
- Section modules include: Emergency Services, Police, Ambulance, Medical/Injury, Slip & Fall, CCTV, Fire, Noise/Odor
- Also has an **Inactive Incident Report Types** section

---

## 16. Library Categories

**URL**: `/v2/mgmt/library/LibraryCategories.aspx`
**Title**: "Library Categories"

**Action**: **Add New Library Category** button
**Option**: **Show Inactive Categories** checkbox

### Library Categories Table Columns (3)
| # | Column | Description |
|---|--------|-------------|
| 1 | Library Category | Category name |
| 2 | Number of Documents | Count of documents in category |
| 3 | Actions | Create Subcategory, Edit |

### Observed Categories (6)
| Category | Documents |
|----------|-----------|
| Agreements and Waivers | 3 |
| Amenity Reservation Forms | 0 |
| Board of Directors Minutes | 0 |
| Common Announcement Library | 0 |
| Emergency Information | 0 |
| Newsletters | 0 |

**Key observation**: Supports hierarchical categories with subcategory creation.

---

## 17. Maintenance/Repair Categories (Modern SPA)

**URL**: `/maintenance2/staff/categories`
**Title**: "Maintenance/Repair Categories"

**Actions**: **Print** button, **Add Category** button
**Options**: **Show inactive categories** checkbox, **Show email notifications** checkbox

### Category Table Columns (4)
| # | Column | Description |
|---|--------|-------------|
| 1 | Category | Category name (with subcategory indicator) |
| 2 | Available to | Who can use this category |
| 3 | Options | Additional settings |
| 4 | Last used | Date last used |

### Observed Categories (45 total, 2 pages)
Top-level parent: **Common Areas** with subcategories indicated by indentation.

Sample subcategories under Common Areas:
Barbecues, Concierge/Security Desk, Corridor Lights, Corridors, Doors & Locks, Electrical, Elevators, Exterior - Walls, Exterminator, Fire Hazard, Fitness Ctr - Equipment, Garage Common Areas, Garage Door, Garbage/Recycle Chutes, Heating - A/C, Housekeeping, Keys, Landscaping - Driveway and Entrance, Lighting, Painting/Touch-ups, Plumbing, Public Washrooms, Sidewalks & Curbs, Stairwell Lights, ...

**Key observations**:
- 45 categories total (showing 25 per page)
- Most available to "Building staff" only
- **Housekeeping** is available to "Building staff, residents" — one of the few resident-facing categories
- Most categories never used (Last used: "Never")
- Housekeeping last used 9/4/2025

---

## 18. Occupant Types (RESTRICTED)

**URL**: `/v2/Mgmt/Setup/DisplayUserTypes.aspx`

**Access**: Unauthorized — "You are not authorized to view this page. Please Log Out and try again."

**Note**: This settings page is restricted to Security Officer level or BuildingLink administrator accounts. The current Manager-level access cannot view or modify occupant type definitions.

---

## 19. Parking Permits Settings

**URL**: `/v2/mgmt/Parking/ParkingPermitTypes.aspx`
**Title**: "Parking Permits Setup"

### Navigation Tabs (7)
1. Parking Permits
2. Vehicles
3. Parking Spaces
4. Issue New Permit
5. View Issued Permits
6. Permits Summary Report
7. **Permit Types Setup** (current)
8. Permit Parking Areas Setup

### Permit Types Setup Tab
**Action**: **Add Permit Type** button
**Option**: **Include inactive permit types** checkbox

#### Permit Types Table Columns (4)
| # | Column | Description |
|---|--------|-------------|
| 1 | Name | Permit type name |
| 2 | Print Title | Title printed on permit |
| 3 | Concurrency Limit | Maximum active permits |
| 4 | Create Date | When the type was created |

#### Observed Permit Types (1)
| Name | Print Title | Concurrency Limit | Create Date |
|------|------------|-------------------|-------------|
| Daily or Overnight Parking Permit | Daily Parking Permit | Limited to 25 active permits | Mon 11/17/25 3:13 PM |

---

## 20. Physical Units

**URL**: `/v2/mgmt/physicalunits/menu.aspx`
**Title**: "Physical Units Menu"

### Define Physical Units
| Category | Count |
|----------|-------|
| Physical Units | 170 Physical Units Defined |
| Floors | 8 Floors Defined |
| Lines | 0 Lines Defined |
| Locations | 0 Locations Defined |

Each category is a clickable link to manage the respective definitions.

**Back to Settings Menu** link at top.

---

## 21. Predefined Maintenance Responses (Modern SPA)

**URL**: `/maintenance2/staff/predefined-responses`
**Title**: "Predefined maintenance responses"

**Action**: **Add response** button (top right)
**Option**: **Show Inactive Responses** checkbox

### Response Table Columns (2)
| # | Column | Description |
|---|--------|-------------|
| 1 | Response title | Short name for the canned response |
| 2 | Response text | Full text of the response |

### Observed Responses (7)
| Title | Response Text |
|-------|--------------|
| Building Wide Problem | Thanks for letting us know! This is a building-wide problem that we are aware of and working to fix. |
| Checked - Good | Checked all areas, everything looks good. |
| On Hold | Your maintenance request has been placed on hold while we await the arrival of parts. |
| Out. Cont-In Suite Issue | Please note that this is not the responsibility of the corporation as it is an in-suite issue. However we are happy to recommend a service provider if required. Thank you for reaching out regarding this matter. |
| Owner's Responsibility | As per the declaration of TSCC 2934, such repairs fall under the owner's responsibility as this is an issue that affects one specific unit. Management will be able to suggest a possible contractor, however, the owner will then be the one to coordinate the work. Should you have any questions or concerns, please do not hesitate to contact the Management Office. |
| Request Received | Please note that we have received your request and will look into it within 2 business days. If this is an emergency or you require faster service please contact the concierge or property management office. |
| Work Completed | Please be advised that the work requested for this suite has now been completed. Should you have any further questions, please contact Management. |

---

## 22. Resident Posting Categories

**URL**: `/v2/Mgmt/Postings/categorymanager.aspx`
**Title**: "Resident Postings" > "Category Settings" tab

### Navigation Tabs (4)
1. **Approve/Reject Postings** (with count badge)
2. **View Postings**
3. **Category Settings** (current)
4. **General Settings**

### Controls
**Action**: **Add Custom Category** button
**Option**: **Show Inactive Postings** checkbox

### Category Table Columns (8)
| # | Column | Description |
|---|--------|-------------|
| 1 | Categories | Hierarchical category name (Group > Subcategory) |
| 2 | Who Can Post | "Residents and Staff" or "Staff Only" |
| 3 | Instruction Text | Whether instructional text is shown |
| 4 | Requires Approval | Yes/No with Change link |
| 5 | Allow Threaded Comments | Yes/No with Change link |
| 6 | Max Post Days | Maximum days a post can be active |
| 7 | Default Post Days | Default post duration |
| 8 | Edit | Edit link |

### Observed Categories (partial list)

#### Marketplace Group (Max 90 days)
- Marketplace > Art
- Marketplace > Electronics
- Marketplace > Home Furnishings
- Marketplace > Other Items
- Marketplace > Tickets

#### Help Needed / Offered Group (Max 365 days)
- Help Needed / Offered > Babysitters / Childcare
- Help Needed / Offered > Dog Walkers / Pet Sitters/Care
- Help Needed / Offered > Other

**Key observations**:
- All categories: Residents and Staff can post
- All require approval (Yes)
- No threaded comments enabled
- Marketplace items expire in 90 days
- Help categories last 365 days
- Hierarchical naming pattern: "Group > Subcategory"

---

## 23. Shift Log Settings (Modern SPA)

**URL**: `/shift-log/staff/settings`
**Title**: "Shift log settings"

### Settings Fields
| Setting | Type | Current Value |
|---------|------|---------------|
| Shift log can be searched by | Radio (2) | "All property staff" selected (vs "Managers only") |
| Allow shift logs to record by location | Checkbox | Unchecked |
| Email a copy of the shift log nightly to management | Checkbox | Checked |
| Send nightly shift log with this name | Text input | "BuildingLink Notification" |
| Send nightly shift log with this email | Text input | "notify@buildinglink.com" |
| Send nightly shift log to these email addresses | Text input | tscc2934concierge@royalcas.ca, queenswaypark.office@dukamanagement.com, dillanm@royalcas.ca, rayk@royalcas... |
| Include only high priority notes in the email copy | Checkbox | Checked |

**Actions**: **Save all changes** button, **Cancel** link

---

## 24. Special Permissions (RESTRICTED)

**URL**: `/v2/mgmt/permissions/staffpermissions.aspx`

**Access**: "Only Security Officers are allowed to work with Special Permissions."

**Note**: This settings page is restricted to Security Officer authority level only. Manager and Front Desk levels cannot access it.

---

## Authorization Notes

### Restricted Settings (2 categories)
| Category | URL | Restriction |
|----------|-----|-------------|
| Occupant types | `/v2/Mgmt/Setup/DisplayUserTypes.aspx` | "You are not authorized to view this page" |
| Special permissions | `/v2/mgmt/permissions/staffpermissions.aspx` | "Only Security Officers are allowed" |

Both require Security Officer authority level or higher. Current Manager-level access cannot view or modify these settings.

---

## Architecture Notes

### Settings Page Architecture Mix
| Architecture | Categories |
|-------------|-----------|
| Modern SPA | Calendar, Event log, Event types, Front desk instructions, Maintenance/repair categories, Predefined maintenance responses, Shift log settings |
| Legacy ASP.NET (iframe) | Property directory, Amenities, Asset Manager, Authorized computers, Custom fields, Design center, Displays/consoles, Document types, Employees, Holidays, Incident reports, Library categories, Occupant types, Parking permits, Physical units, Resident posting categories, Special permissions |

---

## Concierge Design Implications

### From Settings Deep Dive
1. **24 configuration categories** — comprehensive but potentially overwhelming; Concierge should group these into logical sections (Property, People, Operations, Communication, Security)
2. **Panel overlay navigation** — Settings opens as a sidebar panel on top of current page, not a dedicated page — allows quick access from anywhere
3. **Property Directory is the identity hub** — addresses, contacts, message links define how the building presents itself
4. **Dual notification pattern** — office email + concierge email on all amenity notifications shows the multi-role workflow
5. **No auto-approve on any amenity** — staff-mediated workflow is the norm, not the exception
6. **Design Center with 5 customization areas** — significant branding/theming capability; Concierge should expand this
7. **Event log settings are granular** — 8+ toggleable features including location module, voice/text notifications, signature privacy
8. **Text notifications enabled, voice disabled** — shows preference for SMS over voice for package notifications
9. **Role-based settings access** — 2 categories restricted to Security Officer level
10. **Audit trail on settings changes** — "Last changed by" with timestamp on settings pages
11. **Contact ordering** — drag-to-reorder pattern for contacts and message links
12. **Message link visibility matrix** — Staff/Owner/Tenant/Board checkboxes per link — fine-grained audience control
13. **7 predefined maintenance responses** — comprehensive canned responses covering common scenarios (building-wide, on hold, owner responsibility, work completed)
14. **Holiday calendar** — centrally configured with 9 configurable fields per holiday, affects amenity hours and scrolling announcements
15. **5 asset groups with customizable form fields** — flexible asset tracking system with per-group categories
16. **45 maintenance categories** — extensive categorization with parent/child hierarchy
17. **26 incident report types** — comprehensive incident classification with per-type section modules (CCTV, Police, Ambulance, etc.)
18. **18 event types across 4 groups** — primarily delivery-focused with carrier-specific icons and auto-notification emails
19. **6 front desk instruction types** — color-coded with distinct resident authority levels (some visible to residents, some staff-only)
20. **170 physical units across 8 floors** — no lines or locations defined
21. **3 custom fields** — all text fields, manager-only, focused on parking/locker/company info
22. **Authorized computers feature** — IP/device-based access restriction capability (not currently used)
23. **Shift log nightly email** — automated daily digest to 4 email addresses with high-priority-only filtering
24. **Resident posting categories** — hierarchical (Marketplace > subcategory), all require approval, no threaded comments
25. **Parking permits** — single permit type with 25-concurrent-permit limit
26. **Modern SPA migration in progress** — 7 of 24 settings pages are modern SPA, rest are legacy ASP.NET
