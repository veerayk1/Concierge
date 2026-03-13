# Other Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's "Other" sidebar section.

---

## Overview

The "Other" section in BuildingLink's sidebar navigation contains 6 sub-pages that don't fit neatly into the other major module categories. These cover integrations, staff training tools, renovation tracking, resident ID cards, and identity verification.

---

## 1. Integrations (Modern SPA)

**URL**: `/integrations/staff`

### Page Structure
- **Title**: "Integrations"
- **Left sidebar**: Categories navigation
- **Main content**: Integration cards grid

### Categories (1 observed)
1. **Accounting** — "BuildingLink offers integrations with a wide range of accounting software packages. Using these prebuilt integrations you can drastically reduce cost and complexity of custom integrations for your environment."

**Note**: "Platform charges an integration fee"

### Request Integration
- **"Don't see an integration you need?"** card with "Request an integration" link (dashed border)

### Accounting Integrations (13 available)

| # | Integration | Status | Description |
|---|------------|--------|-------------|
| 1 | Entrata | Request | Property management software |
| 2 | AMSI (Infor) | Request | Property management by Infor |
| 3 | Rent Manager | Request | Property management software |
| 4 | C3 | Request | Property management platform |
| 5 | TOPS | Request | Community association management |
| 6 | Condo Manager | Request | Condo-specific management |
| 7 | Remote Landlord | Request | Property management |
| 8 | Yardi | Request | Enterprise property management |
| 9 | OneSite (RealPage) | Request | RealPage property management |
| 10 | MRI | Request | MRI Real Estate Software |
| 11 | Jenark (CoreLogic) | Request | CoreLogic property management |
| 12 | Connect | Request | Property management integration |
| 13 | Caliber | Request | Property management |
| 14 | CINC Systems | Request | Community association management |
| 15 | MDS | Request | Property management |
| 16 | VMS | Request | Property management |
| 17 | Ledger by BuildingLink | Request | BuildingLink's own accounting module |

### Integration Card Layout
Each card shows:
- **Logo/Brand image** (large, centered)
- **Integration name** (bottom left)
- **"Request" button** (teal, bottom right)

### Integration Status
- All integrations show "Request" button — none are currently active for this property
- Integration is available on-demand, requires request and fee

---

## 2. Know Your Residents

**URL**: `/v2/mgmt/Games/KnowYourResidents.aspx`

**Description**: "A drag & drop game brought to you by BuildingLink."

### Purpose
Staff training tool — gamified way for front desk/concierge staff to learn resident names and match them to apartments. Particularly useful for new employees.

### Game Header
| Field | Description |
|-------|-------------|
| Player | Current logged-in user (e.g., "Ray Kodavali. You started this game today.") |
| Score | "Your current score is: 0%" |
| Stats | "(0 correct out of 0 tries)" |

### Game Controls
| Control | Type | Description |
|---------|------|-------------|
| Start a New Game | Button (blue) | Reset and start fresh game |
| View High Score List | Button (blue, trophy icon) | View leaderboard |
| Sound | Radio buttons | ◉ On 🔊 / ○ Off 🔇 |

### Game Mode Options (3 radio buttons)
1. ◉ **First Name <==> Photo or Apt# Match** (default)
2. ○ **Last Name <==> Photo or Apt# Match**
3. ○ **Apt. Number <==> Full Name Match**

### Game Grid
- **Progress**: "Screen 1 of 41" with progress slider
- **Name buttons** (top row, yellow background): 10 first names displayed as draggable buttons (e.g., Aamena, Ainna, Andrea, Didem, Kory, Kristine, Luciano, Luyang, Myna, Sandra D)
- **Apartment cards** (bottom grid, 2 rows × 5 columns): Unit number (large, colored: green/red) + "NO PHOTO" placeholder or resident photo
- **Observed unit numbers**: 619, 510, 514, 422, 510, 502, 221, 304, 217, 415

### Game Mechanics
- Drag a name button to the matching apartment card
- Green unit number = correct match expected
- Red unit number = incorrect or different status
- Photo placeholders show "NO PHOTO" when resident photos not uploaded
- 41 screens total (suggesting ~410 residents to match across all screens)

---

## 3. Alteration Projects

**URL**: `/v2/mgmt/alterations/default.aspx`

**Title**: "Alteration Projects"

### Search Projects Section

#### Project Type Filter (4 checkboxes, all checked by default)
1. ☑ Alterations
2. ☑ Decorations
3. ☑ Fixture Replacements
4. ☑ Repairs

#### Status Filter (6 checkboxes)
| # | Status | Default |
|---|--------|---------|
| 1 | Proposed | ☑ Checked |
| 2 | Approved | ☑ Checked |
| 3 | In-Progress | ☑ Checked |
| 4 | Sign-offs Pending | ☑ Checked |
| 5 | Completed | ☐ Unchecked |
| 6 | Cancelled | ☐ Unchecked |

#### Momentum Filter (4 checkboxes, all checked by default)
| # | Momentum | Color | Default |
|---|----------|-------|---------|
| 1 | OK | White | ☑ |
| 2 | Slow | Blue | ☑ |
| 3 | Stalled | Green | ☑ |
| 4 | Stopped | Red | ☑ |

#### Additional Filters
| Field | Type | Description |
|-------|------|-------------|
| Unit/Apt# | Text input | Filter by unit number |
| Description of Work | Radio + text | ◉ Truncate Description (default), ○ Show Full Description, Length: 24 |

#### Actions
- **🔍 Search** button (blue)

### Projects Table Columns (18)
| # | Column | Description |
|---|--------|-------------|
| 1 | Unit # | Unit number |
| 2 | Description of Work | Work description (truncatable) |
| 3 | Work Type | Alteration/Decoration/Fixture Replacement/Repair |
| 4 | Project Owner | Who manages the project |
| 5 | Proj Value | Project monetary value |
| 6 | Deposit Received | Deposit collection status |
| 7 | Agrmt Signed | Agreement signed status |
| 8 | Start Date (Actual) | Actual start date |
| 9 | Initial Proj. Length | Originally projected duration |
| 10 | Revised Proj. Length | Updated projected duration |
| 11 | Projected Complete Date | Expected completion date |
| 12 | Electrical Exp. Date | Electrical permit expiration |
| 13 | Insurance Exp. Date | Insurance expiration |
| 14 | License Exp. Date | Contractor license expiration |
| 15 | Permit Exp. Date | Building permit expiration |
| 16 | Plumbing Permit Exp. Date | Plumbing permit expiration |
| 17 | Status | Current project status |
| 18 | Momentum | OK/Slow/Stalled/Stopped |

### Actions
- **+ Add New Project** button (green, top right)
- **Export to Excel** button (green)

### Pagination
- Page size: 25 (dropdown)
- Navigation: |< < 1 > >|

### Observed Data
- **0 alteration projects** — "No records to display."

---

## 4. Resident Passports

**URL**: `/v2/Mgmt/Passport/PassportResidents.aspx`

### Main Tabs (4)
1. **Current Residents** (default)
2. **Current Staff**
3. **Card History**
4. **Card Definitions**

### Current Residents Tab — Search Form

**Title**: "Search Passports for Current Residents"

| Field | Type | Options/Default |
|-------|------|----------------|
| Passport Card Name | Dropdown | "No Cards Currently Available" |
| Occupant Last Name (optional) | Text input | Free text |
| Unit # | Autocomplete text + Clear link | "Unit # or name" |
| Residents to Display | Radio buttons (3) | ◉ All / ○ Residents with Active cards / ○ Residents without Active cards |
| Cards To Display | Radio buttons (2) | ◉ Active Cards only / ○ Active and Deactivated Cards |
| Additional Fields to Display | Checkbox | ☐ Photo |

**Actions:**
- **🔍 Search** button (blue)

### Card Definitions Tab

**Title**: "Available Card Definitions"
**Description**: "This screen shows the Resident Passport cards available for your building's residents and staff."

| Field | Type | Options |
|-------|------|---------|
| Passport Card Name | Dropdown | "No Cards Currently Available" |
| Template | Display | (empty — no cards defined) |
| Card Recipients | Checkboxes (3) | ☐ All Occupants / ☐ Specific Occupant Type(s) / ☐ Staff |
| How Should Cards be Generated | Radio buttons (3) | ○ Automatically, when occupant data is complete / ○ Manually by BuildingLink, when ready / ○ Hold for batch printing |
| Printing Location | Radio buttons (2) | ○ Print locally onsite / ○ Print by BuildingLink and mail to site |

### Observed Data
- **No passport cards currently defined** for this property
- The feature is available but not configured

---

## 5. Occupant ID Cards and Mailing Labels

**URL**: `/V2/mgmt/Dashboard/IdCardsAndLabelsHome.aspx`

**Title**: "Occupant ID Cards and Mailing Labels"

### Options (2 links)
| # | Option | URL |
|---|--------|-----|
| 1 | Occupant ID Cards | `/v2/mgmt/dashboard/OccupantIdCards.aspx` |
| 2 | Occupant Mailing Labels | `/v2/mgmt/Labels/OccupantLabels.aspx` |

### Connector Requirement
- **Banner**: "ATTENTION: Connector is now required on all computers that use BuildingLink peripherals (cameras, scanners, fingerprint readers)"
- **Install Connector** button
- Link to help documentation: `help.buildinglink.com/installing-and-troubleshooting-peripherals-with-connector`

---

## 6. Resident ID Verification Screen

**URL**: `/v2/mgmt/dashboard/ResidentIdVerify.aspx`

**Title**: "Resident Id Verification Screen"

### Section: View Resident Information

| Field | Type | Description |
|-------|------|-------------|
| Scan Barcode | Text input | Input field for barcode scanner or manual entry |
| Enable "invalid Barcode buzzer" | Checkbox (top right) | ☐ Unchecked — audio alert for invalid scans |

### Purpose
- Barcode scanning station for verifying resident identity
- Scans resident passport/ID card barcode to pull up resident information
- Optional audible alert for invalid barcodes
- Simple, focused interface for front desk verification workflow

---

## Concierge Design Implications

### From Integrations Deep Dive
1. **17 accounting integrations** available — shows the ecosystem BuildingLink connects to
2. **Request-based activation** — integrations aren't self-service, require BuildingLink involvement + fee
3. **Ledger by BuildingLink** — BL has its own accounting module, showing vertical integration strategy
4. **Major PM software covered**: Yardi, MRI, RealPage, Entrata, Rent Manager — critical for data sync
5. **Only Accounting category** visible — may have more categories for properties with additional modules

### From Know Your Residents Deep Dive
1. **Gamification for staff training** — unique feature for learning resident names/faces
2. **3 game modes** — First Name, Last Name, Apt# matching — covers different learning approaches
3. **Leaderboard** — competitive element for staff motivation
4. **41 screens × 10 residents** = ~410 residents in the system (useful metric)
5. **Photo dependency** — most cards show "NO PHOTO", reducing game effectiveness — shows photo upload adoption challenge

### From Alterations Deep Dive
1. **4 project types**: Alterations, Decorations, Fixture Replacements, Repairs — covers renovation scope
2. **6-stage lifecycle**: Proposed → Approved → In-Progress → Sign-offs Pending → Completed → Cancelled
3. **4 momentum indicators**: OK, Slow, Stalled, Stopped — unique visual tracking of project health
4. **18-column table** — most detailed table in the platform, heavy on compliance tracking
5. **5 expiration date columns** — Electrical, Insurance, License, Permit, Plumbing — regulatory compliance focus
6. **Financial tracking**: Project value + deposit received — budget management
7. **Agreement tracking**: Signed agreement status before work begins

### From Resident Passports Deep Dive
1. **Card-based ID system** with templates and batch printing
2. **3 generation modes**: Automatic, Manual by BL, Batch printing — flexibility for different property sizes
3. **2 printing locations**: Local or by BuildingLink — centralized or distributed printing
4. **Not configured** at this property — optional premium feature

### From ID Verification Deep Dive
1. **Barcode scanning workflow** — real-time identity verification at front desk
2. **Hardware integration** via Connector app — peripheral device support (cameras, scanners, fingerprint readers)
3. **Simple focused UI** — single purpose screen, no distractions
