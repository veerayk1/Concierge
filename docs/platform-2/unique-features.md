# Unique Features — BuildingLink Only

Features that exist in BuildingLink but have NO equivalent in Aquarius (Platform 1).

---

## 1. Emergency Voice & SMS Broadcast

**Location**: Communicate → Emergency broadcast
**URL**: `/v2/Mgmt/VoiceBroadcast/CreateBroadcast.aspx`

Automated emergency communication system that calls residents' phones and sends SMS messages.

### Tabs
1. **Send a Broadcast** — Create new emergency message
2. **View Broadcasts** — History of sent broadcasts (Date, Status, Message Info, Summary, Recipient Info)
3. **Authorized Broadcasters** — Access control for who can trigger broadcasts

### Broadcast Call Records
| Column | Description |
|--------|-------------|
| Date | When broadcast was sent |
| Status | Delivery status |
| Message Info | Message content details |
| Summary | Delivery summary |
| Recipient Info | Who received the broadcast |

### Concierge Implications
Critical safety feature. Modern implementation should use Twilio/similar for voice + SMS, with push notifications as primary channel.

---

## 2. Alteration Projects

**Location**: Other → Alterations
**URL**: `/v2/mgmt/alterations/default.aspx`

Full renovation and construction project tracking for unit modifications.

### Project Types (4)
- Alterations
- Decorations
- Fixture Replacements
- Repairs

### Status Values (6)
- Proposed
- Approved
- In-Progress
- Sign-offs Pending
- Completed
- Cancelled

### Momentum Tracking (4 levels)
| Level | Color | Meaning |
|-------|-------|---------|
| OK | Default | On track |
| Slow | Yellow | Behind schedule |
| Stalled | Blue | Progress stopped |
| Stopped | Red | Work halted |

### Table Columns (18)
1. Unit #
2. Description of Work
3. Work Type
4. Project Owner
5. Project Value ($$)
6. Deposit Received
7. Agreement Signed
8. Start Date (Actual)
9. Initial Project Length
10. Revised Project Length
11. Projected Complete Date
12. Electrical Permit Exp. Date
13. Insurance Exp. Date
14. License Exp. Date
15. Permit Exp. Date
16. Plumbing Permit Exp. Date
17. Status
18. Momentum

### Concierge Implications
Essential for luxury/large condos where renovations are frequent. Tracks permit compliance, insurance validity, and project momentum — protecting the building corporation.

---

## 3. Know Your Residents (Gamified Training)

**Location**: Other → Know your residents
**URL**: `/v2/mgmt/Games/KnowYourResidents.aspx`

Drag-and-drop game for front desk staff to learn resident names and faces.

### Game Modes (3)
1. First Name ↔ Photo or Apt# Match
2. Last Name ↔ Photo or Apt# Match
3. Apt. Number ↔ Full Name Match

### Features
- Player scoring with percentage
- High score list
- Sound on/off toggle
- 41 screens of residents (paginated)
- Name pills to drag onto unit/photo cards
- "NO PHOTO" placeholder when resident photo not uploaded

### Concierge Implications
Brilliant engagement feature. Staff who know residents by name deliver better service. Could modernize with spaced repetition algorithm for optimal learning.

---

## 4. Inspections with Checklists

**Location**: Maintenance → Inspections
**URL**: `/inspections/staff`

Mobile-first inspection system for building walkthroughs.

### Components
- **Upcoming Inspections** — Scheduled future inspections
- **Completed Inspections** — Searchable history by unit/area
- **Checklists** — Custom per-property checklists
- **Global Checklists** — 6 built-in templates from BuildingLink

### Key Constraint
"Inspections can only be completed via the BuildingLink GEO app" — mobile-only completion, suggesting GPS/location-verified inspections.

---

## 5. Recurring Task Scheduler with Forecasting

**Location**: Maintenance → Recurring tasks
**URL**: `/recurring-tasks/staff/tasks`

Automated preventive maintenance scheduling.

### Two Views
1. **Recurring tasks** — All configured tasks with next scheduled date
2. **Tasks forecast** — Future task calendar/projection

### Links To
- Equipment items
- Maintenance categories
- Staff assignments
- Unit assignments

---

## 6. Public Display Configuration

**Location**: Communicate → Public display

Digital signage/lobby screen management. Configure what content displays on building lobby screens.

### Observed Status
- "None with an Active Status" — feature available but not configured

### Channels Integration
Announcements can be distributed to Public Display channel along with Resident Site and Resident App.

---

## 7. Parking Permit System

**Location**: Manage → Parking management
**URL**: `/v2/mgmt/parking/issueparkingpermit.aspx`

### Three Main Tabs
1. **Parking Permits** — Issue and manage permits
2. **Vehicles** — Vehicle registry
3. **Parking Spaces** — Space inventory

### Parking Permits Sub-Navigation (5 pages)
1. Issue New Permit
2. View Issued Permits
3. Permits Summary Report
4. Permit Types Setup
5. Permit Parking Areas Setup

### Issue Permit Form
| Field | Required | Type |
|-------|----------|------|
| Unit | Yes | Autocomplete |
| Active Permits | Display | Shows current permits |
| Permit Type | Yes | Radio (e.g., "Daily or Overnight Parking Permit") |
| Start Time | Yes | DateTime picker |

### Actions
- Create Permit
- Create and Print Permit
- Cancel

### Delta from Aquarius
Aquarius has a simple parking spot text field on the unit form. BuildingLink has a full permit lifecycle: types, areas, issuance, printing, summary reports.

---

## 8. Equipment Lifecycle Management

**Location**: Maintenance → Equipment
**URL**: `/equipment/staff/equipment-items`

### Three Tabs
1. Equipment Items — Inventory with search, category grouping
2. Equipment Categories — 6 default: Electrical, Fire, Gas, Mechanical, Roof, Valves
3. Equipment Replacement Report — Replacement scheduling

### Key Features
- Links to recurring tasks
- Links to maintenance requests
- Category-based organization
- Active/inactive toggle
- Excel export

---

## 9. Vendor Insurance Compliance

**Location**: Maintenance → Vendors directory
**URL**: `/vendor-directory/staff/vendors`

### 5-Status Compliance Dashboard
Real-time vendor insurance status tracking with proactive expiry warnings.

### Master Vendor List
BuildingLink provides a shared vendor database that properties can import from — network effect across their customer base.

---

## 10. Shift Log

**Location**: Persistent in top navigation bar + Dashboard right panel
**URL**: Accessible via green "Shift log" button in top bar

Visible on every page — always-accessible staff shift handoff notes. Not a separate section but integrated into the platform's chrome.

---

## 11. Resident ID Verification System

**Location**: Other → Resident ID verify

Separate from resident passports. Dedicated identity verification workflow.

---

## 12. Photo Albums

**Location**: Communicate → Manage photo albums

Building photo gallery for community engagement. Separate from document management.

---

## 13. Building Directory

**Location**: Communicate → Building directory

Separate from resident directory. Building-level information directory (amenities, services, emergency contacts, building rules, etc.).

---

## Features Count Summary

| Category | Unique Features |
|----------|----------------|
| Safety & Emergency | Emergency Broadcast, Incident Reports |
| Maintenance & Operations | Equipment, Inspections, Recurring Tasks, Vendor Compliance |
| Resident Experience | Know Your Residents, Photo Albums, Public Display |
| Administration | Alterations, Parking Permits, Purchase Orders, Asset Manager |
| Identity & Security | Resident Passports, ID Cards, Resident ID Verify |
| Communication | Building Directory, Special Email Groups, Multi-channel Announcements |

**Total: 23 unique features not found in Aquarius**
