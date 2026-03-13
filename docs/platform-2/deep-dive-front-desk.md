# Front Desk Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Front Desk module.

---

## 1. Event Log

**URL**: `/event-log/staff/event-log`

### Top Bar Actions (4 buttons)
| Button | Color | Action |
|--------|-------|--------|
| Close multiple events | Orange/red outline | Bulk close workflow |
| Record multiple events | Teal | Opens batch creation modal |
| Record event | Dark blue | Opens single event creation modal |
| Settings | Gear icon (next to page title) | Event log configuration |

### Filter Bar
| Control | Type | Description |
|---------|------|-------------|
| Search | Text input | Free text search |
| Event group | Multi-select checkbox dropdown | Filter by event group (see below) |
| Event type | Dropdown | Filter by event type (see below) |
| Advanced search | Button (outlined) | Opens advanced search page |
| Send email reminders | Button (outlined) | Send reminders for open events |
| Print open events | Button (outlined) | Print all open events |

### Event Group Filter Options (7 groups, multi-select checkboxes)
1. Outgoing Items
2. Lockers
3. People
4. Incoming Deliveries
5. Keys
6. Loaner Items
7. Other

### Event Type Filter Options (19 total, format: "Name (Group Letter)")
| # | Event Type | Group |
|---|-----------|-------|
| 1 | All event types | — |
| 2 | Amazon (I) | Incoming Deliveries |
| 3 | Canada Post (I) | Incoming Deliveries |
| 4 | Canada Parcel (I) | Incoming Deliveries |
| 5 | Purolator (I) | Incoming Deliveries |
| 6 | DHL (I) | Incoming Deliveries |
| 7 | Fedex (I) | Incoming Deliveries |
| 8 | UPS (I) | Incoming Deliveries |
| 9 | Package (I) | Incoming Deliveries |
| 10 | Perishables (I) | Incoming Deliveries |
| 11 | Envelope (I) | Incoming Deliveries |
| 12 | Dry Cleaning/Laundry (I) | Incoming Deliveries |
| 13 | Pharmacy (I) | Incoming Deliveries |
| 14 | Flowers (I) | Incoming Deliveries |
| 15 | Other (I) | Incoming Deliveries |
| 16 | Contractor Keys (K) | Keys |
| 17 | Contractor-In (P) | People |
| 18 | Borrowed Item (L) | Loaner Items |
| 19 | FLEETOPTICS (I) | Incoming Deliveries (custom) |

### Display Controls
| Control | Options | Default |
|---------|---------|---------|
| Card width | - / + buttons (adjustable) | Medium |
| Font size | Extra Small, Small, Normal, Large, Extra Large | Normal |

### Grouping Modes (4 radio buttons)
1. **One box per event** (default) — Each event is a separate card
2. **One box per event type** — Group cards by event type
3. **One box per event group** — Group cards by event group
4. **One box per unit** — Group cards by unit number

### Display Checkboxes
- ☑ Company / Family name — Show resident name on card
- ☑ Event type — Show event type label on card

### Card Display Format
Each card shows:
- **Unit number** (large, bold, centered)
- **Resident/Company name** (below unit number)
- **Event type** (bottom label, e.g., "Amazon", "PKG", "Post", "UPS")
- **Color coding** by event type:
  - Yellow = Amazon
  - Red = Canada Post
  - Teal/Cyan = UPS
  - Brown/Tan = Package (PKG)
  - Green = Other types
  - Dark red = Fire/Alarm related

---

### Single Event Creation Modal

**Title**: "Open / Record an event"
**URL**: `/event-log/staff/event-log/add`

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Success banner | — | Info bar | Shows last created event: "Latest event: Unit 315 - Amazon on 03/13/26, 12:17 PM - #2178825660 Sent" |
| Unit number | Yes* | Autocomplete dropdown | "Type unit or name" |
| Select management unit | No | Link | Alternative to unit — assign to management |
| Event type | Yes* | Dropdown | "Select an event type" — same 18 event types |
| Notification Options | No | Dropdown | Dynamic — populates based on selected unit's email addresses |
| Comment | No | Textarea | 0/150 Characters remaining |

**Action Buttons:**
- Cancel
- Save event (red, split button with dropdown arrow ▼)

---

### Batch Event Creation Modal

**Title**: "Record multiple event"
**URL**: `/event-log/staff/event-log/add-multiple`

**Global field (top):**
- Event type* (required): Dropdown with all 18 event types — applies to all rows

**Per-row fields (4 identical rows):**
| Field | Type | Description |
|-------|------|-------------|
| Unit number | Autocomplete dropdown | "Search unit or name" |
| Comment | Text input | "max 150 characters" |
| Print label | Checkbox | Print label for this event |
| Send notification | Dropdown | Unit-dependent (shows "There are no options" until unit selected) |

**Notification options (when unit selected):**
- Dynamic — populated with unit occupant email addresses
- Each occupant shown with: name, email, phone number
- "No notification" as default option

**Action Buttons (3):**
- Cancel
- Save and add more (teal)
- Save events (dark blue)

---

### Edit Event Modal

**Title**: "Edit event #[ID]"
**URL pattern**: `/event-log/staff/event-log/[guid]/[timestamp]/edit`

| Field | Type | Description |
|-------|------|-------------|
| Unit number | Read-only | "Unit [#] Unit / [Names]" |
| Unit occupants | Read-only list | Each occupant with phone: "(C) +1 XXX XXX XXXX" with info icon |
| Event Type | Read-only | Event type name |
| Notification options | Read-only list | Each occupant with email + "Send email" link + phone |
| Opening Comment | Read-only | Original comment text |
| Event status | Radio buttons | ◉ Open / ○ Close |
| Closing comment | Textarea | 0/150 Characters Remaining |
| Opened by | Read-only audit | "[Role] on [date], [time]" |

**Premium Features (right side, all disabled in this property):**
| Feature | Status | Description |
|---------|--------|-------------|
| Signature | Disabled (grey dot) | Capture resident signature |
| App Authorization | Disabled (grey dot) | Mobile app authorization |
| Photo | Disabled (grey dot) | Photo capture on event |
| Driver's license / Photo ID | Disabled (grey dot) | Scan/capture identification |

**Action Buttons:**
- Cancel
- Save event (red)

---

### Advanced Search / Search Event Log

**URL**: `/event-log/staff/event-log-advanced-search`

**Filter Fields:**
| Field | Type | Default |
|-------|------|---------|
| Unit number | Search autocomplete | "Search unit number" |
| Exact match only | Checkbox | ☐ Unchecked |
| Search for text | Text input | Empty |
| Open | Checkbox | ☑ Checked |
| Closed | Checkbox | ☐ Unchecked |
| Event ID | Text input | Empty |
| Date range | Date range picker | 1 month default (e.g., "2/13/2026–3/13/2026") |
| Date type | Radio buttons | ◉ Event recorded date / ○ Closed date |
| Event type | Dropdown | "Select event type" (same 18 types) |
| Event source | Dropdown | "Select event source" (see below) |
| Include deactivated units | Checkbox | ☐ Unchecked |

**Event Source Options (7):**
1. All event sources
2. Web (browser interface)
3. GEO (staff mobile app — BuildingLink GEO)
4. ConciergeLink (third-party integration)
5. Package Concierge (automated package locker system)
6. Snaile (smart parcel locker integration)
7. GEO Resident (resident mobile app)

**Actions:**
- Search button (blue)
- Export to Excel (green button)
- "< Back to grid" navigation link

**Results Table Columns (10):**
1. Status — Color-coded badge (green "Open")
2. Event ID — Numeric ID
3. Unit number — With resident name
4. Event location — Location within building
5. Comment — Opening comment text
6. Event type — Type name (Amazon, UPS, etc.)
7. Open date — Full timestamp
8. Closed date — Full timestamp (if closed)
9. Opened source — Where event was created (Web, GEO, etc.)
10. Updated source — Where last update came from

**Note**: Results show real data — all "Opened source" values observed are "Web"

---

## 2. Front Desk Instructions

**URL**: `/front-desk-instructions/staff`

### Grid Page Controls

**Top Bar:**
| Control | Type | Description |
|---------|------|-------------|
| Search | Text input | Free text search |
| All instructions | Dropdown filter | Filter by instruction type |
| All Location | Dropdown filter | Filter by location (only "All Location" when Location module not configured) |
| Group by unit | Checkbox | Group instructions by unit |
| Company/Family name | Checkbox | Show company/family name |
| Start date | Checkbox | Show start date |
| Expire date | Checkbox | Show expiration date |
| Added last 24 hours | Checkbox | Filter to recent instructions |
| Future instructions | Checkbox | Show future-dated instructions |
| Advanced search | Button (outlined) | Navigate to `/front-desk-instructions/staff/instruction-search` |
| Print instructions | Button (outlined) | Print current view |
| Add instruction | Button (dark blue, top right) | Opens creation modal |
| Settings | Gear icon | Instruction settings |

### Instruction Type Filter Options (7)
1. All instructions
2. Instructions from Management
3. Pass-On Log
4. Housekeeper/Dogwalker etc
5. Permission to Enter - Permanent
6. Vacation
7. Do Not Allow

### Card Display
- Cards show: Unit # + instruction type abbreviation (e.g., "212 - H/D", "523 - Pass-On")
- Color coding: Yellow/gold for H/D type, lighter for Pass-On
- Collapsible "Current instructions" section with expand/collapse arrow
- Pagination: Items per page dropdown (default: 100)
- "Showing 1 to 4 of 4" count

### Instruction Detail Modal (click on card)

**Fields displayed:**
| Field | Description |
|-------|-------------|
| Title | "[Unit#] [Family name] / [Name]" |
| Unit # | Unit number with names |
| Entered by | "[Name] on [date] at [time]" |
| Instruction type | Type name (e.g., "Housekeeper/Dogwalker etc") |
| Instruction text | Full text content |
| Photo | "No photo" or photo display |
| Start date | Date |
| End date | Date or "No expiration date" |
| Status | Badge — "Current" (green) |
| Signature | "No signature" or signature image |
| ID scan | "No id scan" or ID scan image |

**Action Buttons (4):**
- Cancel
- Edit instruction (teal)
- Record event (dark blue) — directly create an event linked to this instruction
- Enter new instruction (dark blue) — create new instruction for same unit

### Enter Instruction Modal (creation form)

**Title**: "Enter instruction"

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Unit | Yes* | Autocomplete dropdown | "Search unit or name" |
| Instruction type | Yes* | Dropdown | 6 options (see below) |
| Instruction text | Yes* | Rich text editor | Full WYSIWYG editor |
| Add photo | No | Upload/Camera | "Upload photo" or "Take photo" buttons |
| Start date | Yes* | Date picker | Default: today |
| Expires | No | Radio + Date picker | ◉ Never / ○ [date range] |

**Instruction Type Options (6):**
1. Instructions from Management
2. Pass-On Log
3. Housekeeper/Dogwalker etc
4. Permission to Enter - Permanent
5. Vacation
6. Do Not Allow

**Rich Text Editor Toolbar:**
- Undo / Redo
- Font family dropdown (default: Arial)
- Font size dropdown (default: 14)
- Bold / Italic / Underline
- Text color / Highlight color
- Text alignment
- Bulleted list / Numbered list
- Insert link

**Photo Upload:**
- Supported files: JPG, JPEG, BMP, PNG and GIF
- Max size: 2 MB
- Two modes: "Upload photo" (file picker) / "Take photo" (camera capture)

**Expires Options:**
- ◉ Never — instruction has no expiration
- ○ Date range — "From" date picker to "To" date picker (mm/dd/yyyy format)

**Action Buttons (3):**
- Cancel
- Save and add another (teal)
- Save instruction (dark blue)

---

## 3. Incident Reports

**URL**: `/v2/Mgmt/IncidentReports/IncidentReportSearch.aspx`

**Note**: This is a legacy ASP.NET page rendered in an iframe. Has language selector (English United States) in top right.

### Search Filters

| Field | Type | Default |
|-------|------|---------|
| Incident Type | Dropdown | "All Incident Types" |
| Status | 5 checkboxes | ☑ Draft, ☑ Pending Approval, ☐ Finalized, ☐ Archived, ☐ Deleted |
| Incident Date Range | Date range | From: [3 months ago] To: [today] |
| Location | Dropdown | (empty — property-specific locations) |
| Report ID # | Text input | — |
| Keyword | Text input | Free text search |

### Incident Type Options (26 types + "All")
1. All Incident Types
2. Abuse
3. Accident/Injury
4. Altercation
5. Death
6. Drugs/Alcohol
7. Elevator Malfunction
8. Equipment Failure
9. Fire / Alarm Panel
10. Garbage/Recycling
11. Heat/HVAC
12. Lockout/Lost Keys
13. Medical Emergency
14. Natural Disaster
15. Noise Complaint
16. Odors
17. Other
18. Parking
19. Pets/Animals
20. Power Loss
21. Property Damage
22. Resident Complaints
23. Rules Infraction
24. Shift Change
25. Theft
26. Trespassing
27. Water Leaks/Flooding

### Status Values (5)
| Status | Color | Default |
|--------|-------|---------|
| Draft | Blue badge | ☑ Checked |
| Pending Approval | Teal badge | ☑ Checked |
| Finalized | Grey (unchecked) | ☐ Unchecked |
| Archived | Grey (unchecked) | ☐ Unchecked |
| Deleted | Red (unchecked) | ☐ Unchecked |

### Severity Values (observed)
- Minor

### Actions
- Search button
- "+ Create New Incident Report" (blue button, top right)
- "Export to Excel" (green button)

### Results Table Columns (9)
1. Date Created — Full timestamp (e.g., "3/12/26 4:43 AM")
2. Type — Incident type (e.g., "Other", "Fire / Alarm Panel")
3. Locations — Building location (e.g., "GYM Filter", "P2 elevator lobby", "CACF Room")
4. Created by — Staff member/role (e.g., "Royal Security Front desk")
5. Description — Full incident description text (long form narratives)
6. Id# — Incident ID number
7. Severity — Severity level (e.g., "Minor")
8. Status — Status badge (e.g., "Pending Approval" in purple)
9. Action — Action buttons/links

### Pagination
- Page size: 10 (dropdown)
- Navigation: |< < 1 2 3 4 5 > >|
- Display: "Page 1 of 5, Items 1 to 10 of 48"

### Observed Data (48 total incidents)
- All created by "Royal Security Front desk"
- All severity "Minor"
- All status "Pending Approval"
- Types used: "Other" (most common), "Fire / Alarm Panel"
- Descriptions are long-form narrative reports (hundreds of characters each)

---

## 4. Resident Directory

**URL**: `/V2/Mgmt/Communicate/ResidentDirectory.aspx?v=1`
**Architecture**: Legacy ASP.NET (iframe)

### Search Options
| # | Control | Type | Description |
|---|---------|------|-------------|
| 1 | Search | Text input | "Enter any part of the Unit#, Name or Email Address" |
| 2 | Search button | Button (teal) | Execute search |
| 3 | Show Advanced Search Options | Toggle button | Expand/collapse advanced filters |

### Advanced Search Options (expanded)
| # | Filter | Type | Options | Default |
|---|--------|------|---------|---------|
| 1 | Show residents | Radio buttons (3) | All / With photos / Without photos | All |
| 2 | Select Floors | Checkboxes | 1, 2, 3, 4, 5, 6, 7, 8 | All unchecked (= all floors) |
| 3 | Select Lines | (empty) | No lines configured for this property | — |
| 4 | Select Locations | (empty) | No locations configured for this property | — |
| 5 | Occupants to Include | Radio buttons (3) | All Occupants (Owners and Tenants) / Owners only (omit Tenants) / Current Residents only (omit Owners of units that have Tenants) | All Occupants |

### Layout Options (right panel)
| # | Option | Type | Default |
|---|--------|------|---------|
| 1 | Display mode | Radio buttons (2) | ◉ List / ○ Address Card |
| 2 | Sort order | Radio buttons (2) | ◉ Sort By Unit / ○ Sort By Name |

### Actions
- **Print** button (top right) — Print the directory

**Key observations**:
- Floor checkboxes match the 8 floors configured in Physical Units settings
- 3-way occupant filter supports owner/tenant distinction — critical for condo management
- "Current Residents only" option omits absentee owners who have tenants
- Dual layout modes (List vs Address Card) for different use cases
- No Lines or Locations configured for this property, but the filters exist for buildings with those designations

---

## 6. Front Desk Home

**URL**: `/v2/mgmt/dashboard/frontdeskhome.aspx`
**Architecture**: Legacy ASP.NET (iframe)

### Page Description
"The 'Front Desk' functions bring efficiency, accountability, and security to your door and lobby operations."

### Navigation Links (4)
| # | Link | Description | Expand Button |
|---|------|-------------|---------------|
| 1 | Event Log | Navigate to Event Log module | + About |
| 2 | Instructions | Navigate to Front Desk Instructions | + About |
| 3 | Incident Reports | Navigate to Incident Reports | + About |
| 4 | Resident Directory | Navigate to Resident Directory | + About |

Each link has a "+ About" expand button that shows a description of the module.

### Section: Front Desk Instructions from Management
Displays active management instructions for front desk staff. Shows instructions that management has posted for front desk awareness (same content as Dashboard section "Front desk instructions from management").

**Key observations**:
- Simple landing/hub page linking to the 4 Front Desk sub-modules
- Each module has a "+ About" expandable description for orientation
- "Front Desk Instructions from Management" section provides quick access to active instructions
- This is a legacy ASP.NET page, while the actual sub-modules (Event Log, Instructions) are modern SPA

---

## Concierge Design Implications

### From Event Log Deep Dive
1. **7 Event Groups** (not 4 as initially documented) — Outgoing Items, Lockers, People, Incoming Deliveries, Keys, Loaner Items, Other
2. **Event Source tracking** is critical — Web, GEO (staff mobile), GEO Resident (resident mobile), ConciergeLink, Package Concierge, Snaile
3. **Integration ecosystem** — BuildingLink integrates with package locker systems (Package Concierge, Snaile) — Concierge should have an integration API
4. **Split button pattern** on Save — "Save event" with dropdown for additional save options
5. **150 character comment limit** — very tight, may want to increase for Concierge
6. **Phone number format**: "(C) +1 XXX XXX XXXX" where prefix indicates type (C=Cell, H=Home)

### From Instructions Deep Dive
1. **Rich text editor** for instruction text — full WYSIWYG with font control
2. **Camera capture** ("Take photo") alongside file upload — mobile-friendly
3. **Instruction types map to front desk workflows** — Pass-On, Do Not Allow, Vacation, Permission to Enter are all distinct operational scenarios
4. **Linked actions** — from instruction detail, staff can directly "Record event" — cross-module linking is key

### From Incident Reports Deep Dive
1. **26 configurable incident types** — comprehensive categorization
2. **5-stage approval workflow** — Draft → Pending Approval → Finalized → Archived → Deleted
3. **Long-form narrative descriptions** — incident reports are detailed write-ups, not short notes
4. **Legacy ASP.NET iframe pattern** — this is the oldest part of the UI, Concierge should modernize this significantly

### From Resident Directory Deep Dive
1. **3-way occupant filter** — All Occupants / Owners only / Current Residents only — critical for condo owner vs tenant distinction
2. **Floor-based filtering** — Checkbox per floor for building section filtering
3. **Dual layout modes** — List and Address Card views for different use cases
4. **Photo filter** — Can filter to residents with/without photos for directory completeness
5. **Print capability** — Physical directory printout for front desk use
6. **Sort flexibility** — By Unit or By Name for different lookup patterns

### From Front Desk Home Deep Dive
1. **Hub page pattern** — Simple landing page linking to 4 sub-modules with descriptions
2. **Management instructions surfaced** — Front desk staff see active management instructions on their home page
3. **"+ About" expandable descriptions** — Self-documenting module orientation for new staff
