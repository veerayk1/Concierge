# Manage Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Manage module sub-sections.

---

## Overview

The Manage module contains 12 sub-sections accessible from the sidebar navigation. This document covers: Employees, Calendar, Filtered Groups, Custom Fields, Pet Registry, Purchase Orders, Board Options, and Asset Manager.

*Note: Units/Occupants, Reservations, and Parking Management are covered in separate deep-dive documents.*

---

## 1. Employees

**URL**: `/v2/mgmt/employees/Default.aspx`

### Main Tabs (7)
1. **Employee List** (default)
2. **Contact Info**
3. **Photo Directory**
4. **Manage Work Schedules**
5. **Daily Schedule**
6. **Biometric ID**
7. **Special Permissions**

### Employee List Tab

#### Options Bar
| Control | Type | Default | Description |
|---------|------|---------|-------------|
| Photos | Checkbox | ☐ | Show employee photos |
| Paging | Checkbox | ☐ | Enable pagination |
| Records per page | Dropdown | 10 | Page size |
| Include Inactive Employees | Checkbox | ☐ | Show deactivated employees |

#### Legend
- **Scheduled to be**: 🟢 On Duty / 🔴 Off Duty

#### Actions
- **Export to Excel** button (green)
- **+ Add New Employee** button (green)

#### Employee List Table Columns (11)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Status dot) | Green=On Duty, Grey=Off Duty/No schedule |
| 2 | Employee Name | Full name |
| 3 | Initials | 2-letter initials |
| 4 | Status | active/inactive |
| 5 | Authority | Role level (Security Officer, Front Desk, Manager) |
| 6 | Can Log In to Website? | Yes/No |
| 7 | Can Log In to GEO? | Yes/No |
| 8 | Show in Directory? | Yes/No |
| 9 | Directory Photo | Yes/No |
| 10 | Assign to Maint Req? | Yes/No — can be assigned to maintenance requests |
| 11 | Last Login Date | Timestamp of last login |
| 12 | Notes | Free text notes |
| 13 | Action | Edit link |

### Observed Employees (10 in Employee List)
| Name | Initials | Status | Authority | Last Login |
|------|----------|--------|-----------|------------|
| BuildingLink Early Access | BE | active | Security Officer | — |
| Royal Security Front desk | RF | active | Front Desk | 3/13/26 1:43 PM |
| Rajesh Reddy Jonnalagadda | RJ | active | Manager | 3/13/26 1:42 PM |
| Susmitha Katuri | SK | active | Manager | 3/1/26 2:58 PM |
| Simranjeet Kaur | SK | active | Front Desk | 6/23/25 9:09 AM |
| Ray Kodavali | RK | active | Manager | 3/13/26 3:21 PM |
| Harsh Sandhu | HS | active | Front Desk | 3/8/26 6:00 AM |
| Mohammed Siddiqui | MS | active | Front Desk | 1/18/26 4:13 PM |
| Gledis Xhoxhi | GX | active | Security Officer | 2/6/25 9:34 PM |
| Gledis Xhoxhi | GX | active | Security Officer | 3/11/26 11:25 AM |

### Authority Levels Observed (3)
1. **Security Officer** — Highest level, can send emergency broadcasts
2. **Manager** — Property management level
3. **Front Desk** — Concierge/reception level

### Other Users Section (separate from Employee List)
| Name | Initials | Status | Authority |
|------|----------|--------|-----------|
| BuildingLink Installer | BI | active | Front Desk |
| BuildingLink Trainer | BT | active | Security Officer |

### Employee Permissions Observed
- All employees: Can Log In to Website = Yes, Can Log In to GEO = Yes
- Most employees: Show in Directory = No, Directory Photo = No
- Two Security Officers (Gledis Xhoxhi): Assign to Maint Req = Yes

---

## 2. Building Calendar

**URL**: `/calendar/staff` (Modern SPA)

### Main Tabs (3)
1. **Monthly view** (default)
2. **List view**
3. **Calendar categories**

### Top Bar Actions
| Button | Color | Description |
|--------|-------|-------------|
| Print view | Teal | Print-friendly calendar |
| Add calendar entry | Dark green | Create new calendar event |

### Additional Link
- **Reservation calendar** (top right, links to amenity calendar)

### Monthly View Controls
| Control | Type | Description |
|---------|------|-------------|
| Month navigation | < [Month Year ▼] > | Navigate months with arrows or dropdown |
| Today | Button (teal) | Jump to today's date |
| Search events | Text search with 🔍 | Search calendar entries |
| Categories | Dropdown | Filter by event category |
| Clear filters | Link | Reset all filters |

### Calendar Grid
- Standard monthly layout: Sun – Mon – Tue – Wed – Thu – Fri – Sat
- Today's date highlighted in yellow/cream
- 6 weeks visible (extends into adjacent months)
- No events observed for March 2026

---

## 3. Filtered Groups

**URL**: `/v2/mgmt/FilteredGroups/FilterGroups.aspx`

**Description**: "On this page, you can create new filtered groups of residents defined by your filtering rules, or, delete existing groups, or edit the specific filter rules that apply to an existing named group."

### Controls
- **+ Add New Filtered Group** button (green, top right)

### Observed Data
- **0 active Filter Groups defined** — "There are no active Filter Groups defined"

### Note
- Banner: "This page will soon receive an update. Learn more" — indicates planned modernization

---

## 4. Custom Fields

**URL**: `/v2/mgmt/customfields/search.aspx`

### Custom Field Search

#### Fields to Search (organized by category)

**Unit Profile/Occupancy (4 fields):**
| # | Field Name | Type |
|---|-----------|------|
| 1 | Account # | Checkbox |
| 2 | Pet Names | Checkbox |
| 3 | Breed | Checkbox |
| 4 | Pet Size | Checkbox |

**Physical Unit (3 fields):**
| # | Field Name | Type |
|---|-----------|------|
| 1 | If this is a company enter 'C' here | Checkbox |
| 2 | Parking | Checkbox |
| 3 | Locker | Checkbox |

**Occupant (1 field):**
| # | Field Name | Type |
|---|-----------|------|
| 1 | Account # | Checkbox |

#### Search Filters
| Field | Type | Description |
|-------|------|-------------|
| Search Fields | Text input | Optional text search within custom field values |
| Search For: Unit | Text input | Filter by unit |
| Search For: User | Text input | Filter by user |
| Omit Rows with no data | Yes/No radios | Default: ◉ Yes |
| Include Deactivated and Vacant Units | Checkbox | ☐ Default unchecked |

#### Actions
- **Search** button (blue)
- **Advanced Search** button (blue)
- **Reset** link

---

## 5. Pet Registry (Modern SPA)

**URL**: `/pet-registry/staff`

### Filter Bar
| Control | Type | Description |
|---------|------|-------------|
| Unit | Dropdown autocomplete | "Search unit or name" |
| Status | Dropdown with badge count (2) | Filter by approval status |
| Pet type | Dropdown | Filter by pet type |
| Vaccinated | Dropdown | Filter by vaccination status |
| Advanced | Dropdown | Additional filters |

### Actions
- **Add pet** button (green, top right)
- **Export to Excel** button (green, outlined)
- **Export to PDF** button (red, outlined)

### Pet Registry Table Columns (9)
| # | Column | Description |
|---|--------|-------------|
| 1 | Pet | Photo or initials avatar (colored circle) |
| 2 | Name/Type/Breed | Pet name + "Type/Breed" (e.g., "Cat/Russian blue", "Dog/Border Collie") |
| 3 | Owner | "Unit# · Family name" (e.g., "208 · Wang") |
| 4 | Birthday | Date of birth (e.g., "4/12/2023") |
| 5 | Weight | Weight with unit (e.g., "7 lbs", "3.6 kilos", "4 kilos", "11") |
| 6 | Notes | "About:" personality notes + "Submitted by:" name. "Accepted by:" name for approved |
| 7 | Submitted | Submission date |
| 8 | Changed | Last change date |
| 9 | Status | Color-coded badge (Submitted=yellow, Accepted=green) |

### Observed Pets (5)
| Pet Name | Type/Breed | Unit | Owner | Birthday | Weight | Status |
|----------|-----------|------|-------|----------|--------|--------|
| Mia | Cat/Russian blue | 208 | Wang | 4/12/2023 | 7 lbs | Submitted |
| Muffin | Dog/Border Collie | 324 | Lazarchuk | — | — | Submitted |
| Paquette Ceranto | Dog/CHIHUAHUA | 609 | Ceranto | 10/18/2018 | 3.6 kilos | Submitted |
| Paquito Ceranto | Dog/CHIHUAHUA | 609 | Ceranto | 7/30/2016 | 4 kilos | Submitted |
| Sidney Fish | Cat/Domestic Short Hair | 414 | Pelipel | — | 11 | Accepted |

### Pet Status Values (2 observed)
1. **Submitted** — Pending approval (yellow badge)
2. **Accepted** — Approved by staff (green badge)

### Pagination
- "Showing 1 to 5 of 5"
- Items per page: 25

---

## 6. Purchase Orders (Modern SPA)

**URL**: `/purchase-orders/staff/orders`

### Filter Bar
| Control | Type | Description |
|---------|------|-------------|
| Search purchase order n... | Dropdown autocomplete | Search by PO number |
| Search vendor | Dropdown autocomplete | Search by vendor |
| Search invoice number | Dropdown autocomplete | Search by invoice number |
| Date range | Date picker | Default: 1 month (e.g., "2/13/2026–3/13/2026") |
| Status | Dropdown | Filter by PO status |
| Group by | Dropdown | Grouping mode |
| Expense code | Dropdown | Filter by expense code |
| Clear filters | Link (red) | Reset all filters |

### Actions
- **Create purchase order** button (green, top right)
- **Export Excel** button (green, outlined)
- **⚙ Settings** gear icon (next to title)

### Table Columns (9)
| # | Column | Description |
|---|--------|-------------|
| 1 | PO number | Purchase order number |
| 2 | Invoice number | Invoice reference |
| 3 | Vendor | Vendor name |
| 4 | Date created | Creation date |
| 5 | Date requested | When PO was requested |
| 6 | Date submitted | When PO was submitted for approval |
| 7 | Date approved | When PO was approved |
| 8 | Total | Total amount |
| 9 | Status | PO status |

### PO Statuses (from URL parameters, 11 total)
Status IDs observed in URL: 1, 2, 3, 4, 5, 6, 7, 8, -1, -2, -3

### Pagination
- "Showing 1 to 0 of 0"
- Items per page: 25

---

## 7. Board Options

**URL**: `/v2/mgmt/Board/Default.aspx`

### Sections (5)

| # | Section | Color | Content |
|---|---------|-------|---------|
| 1 | Board Members | Green header | Board member listing (collapsed) |
| 2 | Send a Message | Red header | "Send Message to Manager" link |
| 3 | Board Documents In Library | Blue header | Document library filtered for board (collapsed) |
| 4 | Survey Questions | Teal header | Survey management for board (collapsed) |
| 5 | Today's Calendar Entries for the Board | Purple header | "There are no Calendar Events..." |

### Key Features
- Board member management
- Direct messaging to property manager
- Board-specific document library
- Board-specific surveys
- Board calendar integration

---

## 8. Asset Manager

**URL**: `/v2/mgmt/assets/dashboard.aspx`

### Main Tabs (6)
1. **Dashboard** (default)
2. **Appliances**
3. **Rental Items**
4. **Parking Spaces**
5. **Storage Spaces**
6. **Other Assets**

### Dashboard — 5 Asset Category Cards

#### 1. In-Unit Appliances/Equipment (0)
**View Options**: By Unit # | By Floor | Summary
**Appliance Types (14):**
| # | Type | Count |
|---|------|-------|
| 1 | A/C Units | 0 |
| 2 | Boilers | 0 |
| 3 | Dishwashers | 0 |
| 4 | Dryers | 0 |
| 5 | Fixtures | 0 |
| 6 | Flooring | 0 |
| 7 | Furnaces | 0 |
| 8 | Garbage Disposals | 0 |
| 9 | Microwaves | 0 |
| 10 | Ranges | 0 |
| 11 | Refrigerators | 0 |
| 12 | Stovetops | 0 |
| 13 | Trash Compactors | 0 |
| 14 | Wall Ovens | 0 |
| 15 | Washers | 0 |
| 16 | Water Heaters | 0 |

**Search**: "Appliances by Unit" with Unit Search input

#### 2. Other Assets (0)
**View Options**: Summary
**Asset Types (2):**
| # | Type | Count |
|---|------|-------|
| 1 | Electronic Equipment | 0 |
| 2 | Power Tools | 0 |

#### 3. Parking Spaces (0)
**View Options**: By Assigned To | By Floor | Summary
**Space Types (2):**
| # | Type | Count |
|---|------|-------|
| 1 | Indoor Parking | 0 |
| 2 | Outdoor Parking | 0 |

#### 4. Rental/Loaner Items (0)
**View Options**: By Assigned To | By Floor | Summary
**Item Types (9):**
| # | Type | Count |
|---|------|-------|
| 1 | Bicycles | 0 |
| 2 | Billiards sets | 0 |
| 3 | Books | 0 |
| 4 | Dart Sets | 0 |
| 5 | DVDs/CDs | 0 |
| 6 | Game Consoles | 0 |
| 7 | Golf Clubs | 0 |
| 8 | Ping-Pong sets | 0 |
| 9 | Tennis Rackets | 0 |
| 10 | Vehicles | 0 |

#### 5. Storage Spaces (0)
**View Options**: By Assigned To | By Floor | Summary
**Space Types (3):**
| # | Type | Count |
|---|------|-------|
| 1 | Bicycle Slots | 0 |
| 2 | Lockers | 0 |
| 3 | Storage Rooms | 0 |

---

## 9. Library (Document Library)

**URL**: `/V2/Mgmt/Library/Library.aspx`
**Architecture**: Legacy ASP.NET (iframe)

### Main Tabs (3)
1. **Active Documents** (default) — All non-expired library documents
2. **Recently Viewed** — Documents viewed within a configurable time window
3. **Expired Documents** — Documents past their expiration date

### Active Documents Tab

#### Options Bar
| # | Control | Type | Default | Description |
|---|---------|------|---------|-------------|
| 1 | Group by | Radio buttons (2) | ◉ Group by Category | Group by Category / Group by Date |
| 2 | Show Viewing Permissions | Checkbox | ☐ | Toggle permission columns in table |
| 3 | Select Category | Dropdown | All Categories | Filter by document category |
| 4 | Text Search | Text input | (empty) | Search document names |
| 5 | Search button | Button | — | Execute search |

#### Actions
- **+ Add New Document** button (green, top right)
- **- Hide All** / **+ Expand All** buttons (top right, above table)
- **Create SubCategory** (per category row) — Create sub-folder within a category

#### Table Columns (8)
| # | Column | Description |
|---|--------|-------------|
| 1 | Document Name | Document title (clickable link) |
| 2 | Document Date | Upload/creation date |
| 3 | Last Revised On | Last modification date |
| 4 | Expires On | Expiration date |
| 5 | Last 30 Days No. of Views | Recent view count |
| 6 | Lifetime No. of Views | Total view count |
| 7 | Att./Imp. | Attachment/Important indicators (icons) |
| 8 | (Actions) | Notify by Email, View, Edit/Delete |

#### Document Categories (6 configured)
| # | Category | Document Count |
|---|----------|---------------|
| 1 | Agreements and Waivers | 3 |
| 2 | Amenity Reservation Forms | 0 |
| 3 | Board of Directors Minutes | 0 |
| 4 | Common Announcement Library | 0 |
| 5 | Emergency Information | 0 |
| 6 | Newsletters | 0 |

#### Observed Documents (3 in "Agreements and Waivers")
| Document Name | Date | Views | Actions |
|---------------|------|-------|---------|
| TSCC2934 - Condominium Declaration | 3/19/25 | 20 | Notify by Email, View, Edit/Delete |
| TSCC2934 - Condominium Rules | 3/19/25 | 116 | Notify by Email, View, Edit/Delete |
| TSCC2934 - Product Library Available for Residents to Use | 8/26/25 | 76 | Notify by Email, View, Edit/Delete |

#### Per-Document Actions
- **Notify by Email** — Send email notification to residents about the document
- **View** — Open/download the document
- **Edit/Delete** — Modify document metadata or remove

### Recently Viewed Tab

**URL**: `/V2/Mgmt/Library/recent.aspx`

#### Time Filter
| Control | Type | Options | Default |
|---------|------|---------|---------|
| Show all documents viewed within the last | Radio buttons (3) | 7 days / 30 days / 90 days | 30 days |

#### Table Columns (12+)
| # | Column | Description |
|---|--------|-------------|
| 1 | Document Name | Document title |
| 2 | Category | Document category |
| 3 | Document Date | Upload date |
| 4 | Recent No. of Views | Views in selected time period |
| 5 | Att./Imp. | Attachment/Important flags |
| 6 | Tenant | Tenant viewing permission |
| 7 | Sub Tenant | Sub-tenant viewing permission |
| 8 | Board | Board member viewing permission |
| 9 | Front Text | Front desk text viewing permission |
| 10 | Maint | Maintenance viewing permission |
| 11 | Locations | Location-based viewing permission |

**Observed Data**: No records to display (no documents viewed recently)

### Expired Documents Tab

**URL**: `/V2/Mgmt/Library/expired.aspx`

#### Table Columns (12+)
| # | Column | Description |
|---|--------|-------------|
| 1 | Expired On | Date the document expired |
| 2 | Document Name | Document title |
| 3 | Category | Document category |
| 4 | Document Date | Original upload date |
| 5 | No. of Visits | Total visit count |
| 6 | Att./Imp. | Attachment/Important flags |
| 7-12 | (Permission columns) | Same as Recently Viewed: Tenant, Sub Tenant, Board, Front Text, Maint, Locations |

**Observed Data**: No records to display (no expired documents)

### Language Support
**Language dropdown** (top right): Supports 12 languages:
Chinese (Simplified), Chinese (Traditional), Czech, English (Australia), English (Canada), English (Ireland), English (United Kingdom), English (United States), French (Canada), Japanese, Spanish, Vietnamese

---

## Concierge Design Implications

### From Library Deep Dive
1. **6 document categories** — Pre-configured categories cover agreements, forms, board minutes, announcements, emergency info, newsletters
2. **Viewing permissions matrix** — 6+ permission levels (Tenant, Sub Tenant, Board, Front Text, Maint, Locations) control document visibility
3. **Document lifecycle** — Active → Expired workflow with separate tabs for each state
4. **View analytics** — Both 30-day and lifetime view counts tracked per document
5. **Email notification** — "Notify by Email" action per document for resident communication
6. **Multi-language support** — 12 languages for international buildings
7. **Subcategory support** — Categories can have nested subcategories for organization
8. **Recently Viewed tracking** — Configurable time window (7/30/90 days) for usage analytics

### From Employees Deep Dive
1. **3 authority levels** — Security Officer, Manager, Front Desk — maps to role-based access
2. **7 employee tabs** — Shows breadth of staff management: list, contact, photos, schedules, daily schedule, biometric, permissions
3. **GEO app access** column — Mobile app login separate from website login
4. **Maintenance assignment** column — Direct link between employees and maintenance workflow
5. **On Duty/Off Duty** status — Real-time staff availability tracking
6. **"Other Users"** section — System accounts (Installer, Trainer) separate from building staff

### From Calendar Deep Dive
1. **Modern SPA calendar** — Monthly and list views with search and category filtering
2. **Reservation calendar** link — Cross-module integration with amenity reservations
3. **Calendar categories** — Configurable event types for the calendar

### From Pet Registry Deep Dive
1. **2-status approval workflow** — Submitted → Accepted
2. **Photo support** — Pet photos displayed as avatars (with initials fallback)
3. **Dual export** — Both Excel and PDF export options
4. **Personality notes** — "About" field for pet behavior descriptions
5. **Weight flexibility** — Supports both lbs and kilos units
6. **Multiple pets per unit** — Unit 609 has 2 registered pets
7. **Resident-submitted** — Pets submitted by residents, accepted by staff

### From Asset Manager Deep Dive
1. **5 asset categories** — In-Unit Appliances, Other Assets, Parking Spaces, Rental/Loaner Items, Storage Spaces
2. **31+ asset sub-types** — 16 appliance types, 2 other assets, 2 parking, 10 rental, 3 storage
3. **3 view modes** per category — By Unit/Assigned To, By Floor, Summary
4. **Not actively used** at this property — All counts are 0, but structure is comprehensive
5. **Loaner items** — Unique feature for lending community items (bikes, games, books)

### From Purchase Orders Deep Dive
1. **Modern SPA** — Clean filter bar with multiple search dimensions
2. **11 PO statuses** — Very granular approval/tracking workflow
3. **Expense codes** — Budget categorization for financial tracking
4. **Vendor integration** — Linked to vendors directory

### From Board Options Deep Dive
1. **Board portal** — Dedicated section for condo board members
2. **5 sections** — Members, messaging, documents, surveys, calendar
3. **Cross-module integration** — Links to Library, Survey, and Calendar modules
