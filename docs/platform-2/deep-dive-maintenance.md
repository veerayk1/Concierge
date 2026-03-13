# Maintenance Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Maintenance module.

---

## Maintenance Home Page

**URL**: `/v2/mgmt/dashboard/MaintenanceHome.aspx`

Central hub for all Maintenance functions. Lists 8 sub-sections:

| # | Sub-section | Has "About" | Description |
|---|-------------|-------------|-------------|
| 1 | Search Requests | No | Maintenance request listing/search |
| 2 | New Request | No | Create new maintenance request |
| 3 | Equipment | ⊞ About | Equipment items, categories, replacement report |
| 4 | Inspections | No | Mobile-first inspections with checklists |
| 5 | Vendors Directory | No | Vendor/contractor management with compliance |
| 6 | Recurring Tasks | ⊞ About | Automated preventive maintenance scheduling |
| 7 | Maint Reports | ⊞ About | Maintenance reporting |
| 8 | Replicate | No | Replicate maintenance settings across properties |

---

## 1. New Maintenance Request

**URL**: `/maintenance2/staff/new`

Two-column layout form.

### Left Column — Request Details

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Search unit number or name | Yes* | Autocomplete dropdown | "Type unit or name" — unit/resident lookup |
| Don't show to residents | No | Checkbox | Hide request from resident portal |
| Assign to management unit | No | Link | Alternative — assign to management instead of unit |
| Problem description | No | Textarea | 0/4000 Characters remaining |
| Category | No | Dropdown | 2-tier hierarchy (see Category Options below) |
| Permission to enter | No | Radio: Yes/No | Does staff have permission to enter unit |
| Entry instructions | No | Textarea | 0/1000 Characters remaining |
| Photo attachments | No | File upload | Supported: JPG, JPEG, PNG, BMP, GIF, HEIC (4MB max) |
| Documents | No | File upload | Supported: PDF, DOC, DOCX, XLS, XLSX (4MB max) |
| Create with status | No | Toggle buttons | Open (default) / Hold (with date picker) / Close (with date picker) |
| Print work order | No | Checkbox | Generate printable work order on creation |
| High urgency | No | Checkbox | Flag as urgent |

### Right Column — Additional Details

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Assigned employee | No | Dropdown | Staff member assignment |
| Date requested | Auto | Date picker | Defaults to today |
| Assigned vendor | No | Dropdown | Vendor from vendor directory ("No data available" when empty) |
| Equipment | No | Dropdown | Link to equipment item ("No data available" when empty) |
| Email notifications | No | Email input | Notification recipients |
| Additional emails | No | Email input | CC recipients |
| Contact numbers | No | Text input | Contact phone numbers |
| Optional reference number | No | Text input | External reference number |
| Priority | No | Input | Priority level |

### Assigned Employee Options (observed)
- Gledis Xhoxhi (property has limited staff)

### Action Buttons (3)
- **Save** — Create and save
- **Save and add another** — Create and start new form
- **Clear** — Reset form

---

### Category Dropdown — 2-Tier Hierarchy

**Group 1: Common Areas (33 categories)**

Each category has a "Private" toggle option.

| # | Category |
|---|----------|
| 1 | Air Conditioning |
| 2 | Balcony |
| 3 | Building Exterior |
| 4 | CACF Room |
| 5 | Carpet/Flooring |
| 6 | Ceilings |
| 7 | Cleaning |
| 8 | Doors |
| 9 | Electrical |
| 10 | Elevators |
| 11 | Exercise Room |
| 12 | Fire Equipment |
| 13 | Garbage Room |
| 14 | Garage/Parking |
| 15 | GYM Filter |
| 16 | Hallways |
| 17 | Heating |
| 18 | HVAC |
| 19 | Interior |
| 20 | Landscaping |
| 21 | Laundry Room |
| 22 | Lighting |
| 23 | Lobby |
| 24 | Locks and Keys |
| 25 | Other |
| 26 | Painting |
| 27 | Plumbing |
| 28 | Pool/Sauna |
| 29 | Roof |
| 30 | Security System |
| 31 | Signs |
| 32 | Snow Removal |
| 33 | Windows |

**Group 2: In-Suite Repairs/Requests (10 categories)**

| # | Category |
|---|----------|
| 1 | Appliance |
| 2 | Bathroom |
| 3 | Doors |
| 4 | Electrical |
| 5 | HVAC |
| 6 | Kitchen |
| 7 | Other |
| 8 | Painting |
| 9 | Plumbing |
| 10 | Windows |

**Note**: Some categories appear in both groups (Doors, Electrical, HVAC, Other, Painting, Plumbing, Windows) — allows tracking whether the issue is in common areas or in-suite.

---

## 2. Search Requests (Listing Page)

**URL**: `/maintenance2/staff/`

### Top Bar Actions (3 buttons)
| Button | Color | Action |
|--------|-------|--------|
| Export to Excel | Green | Export current view to Excel |
| Print List | Dark blue | Print current list |
| Create New Request | Dark blue | Navigate to new request form |

### Settings Gear Icon
- Next to "Maintenance" page title — navigates to maintenance settings

### Filter Bar (5 filters)

| Filter | Type | Description |
|--------|------|-------------|
| Search unit or ID | Text input | Free text search by unit number or request ID |
| Status | Multi-select checkbox dropdown | Filter by status (badge shows active filter count) |
| Category | Multi-select checkbox dropdown | 2-tier hierarchy (Common Areas / In-Suite) |
| Employee | Multi-select checkbox dropdown | Filter by assigned employee |
| Advanced | Dropdown | Additional filter options |
| Clear Filters | Link | Reset all filters |

### Status Filter Options (5 checkboxes)
| # | Status | Default |
|---|--------|---------|
| 1 | Select All | Partially checked (—) |
| 2 | Open | ☑ Checked |
| 3 | On hold | ☐ Unchecked |
| 4 | On hold indefinitely | ☐ Unchecked |
| 5 | Closed | ☐ Unchecked |

### Category Filter (Search Page)
Same 2-tier structure as creation form:
- ☐ Select All
- ▸ Common Areas (expandable, with sub-categories)
- ▸ In-Suite Repairs/Requests (expandable, with sub-categories)

### Employee Filter Options
- ▸ Select Actions (expandable)
- ☐ Include Inactive
- ☐ Gledis Xhoxhi (listed — possibly twice for different roles)

### Advanced Filter Options
- Same structure as Employee filter — shows additional employee/assignment options
- ▸ Select Actions
- ☐ Include Inactive
- Employee checkboxes

### Table Columns (8 + actions)
| Column | Description |
|--------|-------------|
| Checkbox | Bulk selection |
| Status | Color-coded status badge (Open = green) |
| ID ↓ | Request ID number (sortable, default sort descending) |
| Unit ↑ | Unit number and resident name (sortable) |
| Category | Maintenance category name |
| Assignee | Assigned staff member |
| Requested | Date requested + source label (e.g., "Resident") |
| Last Comment | Most recent comment date |
| Print icon | Print individual request (🖨 icon) |

### Inline Preview
Problem description shows directly below each row in grey text — no need to click to see the issue summary.

### Pagination
- Items per page: 25 (configurable dropdown)
- Navigation: < 1 >
- Display: "Showing 1 to 1 of 1"

### Observed Data
- 1 maintenance request total
- ID 31, Unit 815 - Jin, Category "Other" (In-Suite Repairs/Requests > Other)
- Status: Open
- Requested by: Resident on 2/15/2026
- Description: "Pipe above parking spot 6 keeps leaking and has stained my rear window"

---

## 3. Request Detail Page

**URL**: `/maintenance2/staff/details/id/[guid]`

### Header Section
- **Title**: "[ID] · Unit [#] - [Name]"
- **Subtitle**: "Requested by **[Name]** (resident/staff) on [date] under **[Category Group] > [Category]**"
- **Status toggle buttons**: Open (blue when active) | Hold 📅 | Close 📅
  - Hold and Close have calendar icon — clicking reveals date picker

### Details Section
- **Details** label
- Full problem description text
- **Action links (3)**: Create invoice | Email residents | Print work order
- **Edit** button (✏ with link, right-aligned)

### Unit Details Section
- **Permission indicator**: 🔴 "No Permission to Enter" (red) or permission status
- **Contacts** heading
  - Resident name
  - Phone numbers with copy icon (📋): "+1-XXXXXXXXXX"
  - Multiple phone numbers listed separately

### Assignments Section
- **Employee**: Search autocomplete field
- **Vendor**: Search autocomplete field
- **Equipment**: "None" or linked equipment item
- **Compose work order** link (teal)

### Images Section
- **Add images** button (with camera icon)
- Drag and drop zone: "Drag and drop images here to upload"
- Supported files: JPG, JPEG, PNG, BMP, GIF, and HEIC of up to 4 MB

### Documents Section
- **Add documents** button (with document icon)
- Drag and drop zone: "Drag and drop documents here to upload"
- Supported files: PDF, DOC, DOCX, XLS and XLSX of up to 4 MB

### Right Panel — Comment & Response

| Control | Type | Description |
|---------|------|-------------|
| Comment | Textarea | Free text comment input |
| Predefined response | Dropdown | "Choose response" — pre-configured response templates |
| Add charges | Link | Add cost tracking to request |
| Add time spent | Link | Track time spent on request |
| Save | Button (grey until changes) | Save comment/changes |
| Hide from resident | Checkbox | Hide this comment from resident view |

### Predefined Response Options (7 observed)
1. Building Wide Problem
2. Checked – Good
3. On Hold
4. Out. Cont–In Suite Issue
5. Owner's Responsibility
6. Request Received
7. Work Completed

### Activity Log (right panel, below comment)
Timeline format showing all actions:
- Date + Time on left
- Blue dot timeline indicator
- **Action type** (bold): "New Request"
- Action description: "New Request Submitted - RequestId: '[ID]'"
- Full details text
- "by [Name]" attribution

---

## 4. Equipment

**URL**: `/equipment/staff/equipment-items`

### Three Tabs
1. **Equipment items** — Inventory listing
2. **Equipment categories** — Category management
3. **Equipment replacement report** — Replacement scheduling

### Tab 1: Equipment Items

**Controls:**
| Control | Type | Default |
|---------|------|---------|
| Search | Text input | Free text search |
| Group by category | Checkbox | ☑ Checked |
| Category | Dropdown filter | All categories |
| Additional fields to display | Dropdown | Customizable columns |
| Include inactive equipment items | Checkbox | ☐ Unchecked |
| Show recurring task detail | Checkbox | ☐ Unchecked |
| Export Excel | Button (green) | Export to Excel |
| Add equipment | Button (dark blue) | Add new equipment item |

**Empty state**: "No equipment items — When you add equipment items they will be listed here" (with package icon)

**Toast notification**: "Equipment has been redesigned! Click here to learn more >"

### Tab 2: Equipment Categories

**URL**: `/equipment/staff/equipment-categories`

**Controls:**
- ☐ Include inactive categories (checkbox)
- **Add category** button (dark blue, top right)

**Active Equipment Categories (6 default):**
| # | Category | Items |
|---|----------|-------|
| 1 | Electrical | 0 |
| 2 | Fire | 0 |
| 3 | Gas | 0 |
| 4 | Mechnical | 0 |
| 5 | Roof | 0 |
| 6 | Valves | 0 |

**Note**: "Mechnical" is a typo in BuildingLink (should be "Mechanical").

### Tab 3: Equipment Replacement Report

**URL**: `/equipment/staff/equipment-replacement-report`

**Filters:**
| Control | Type | Default |
|---------|------|---------|
| Replacement date range | Date range picker | [today] – [today + 5 years] (e.g., 3/13/2026–3/13/2031) |
| Subtotal by | Radio buttons (3) | ◉ Replacement year |

**Subtotal Options:**
1. ◉ Replacement year (default)
2. ○ Category
3. ○ None

**Apply** button (blue)

**Table Columns (8):**
1. Replacement date
2. Equipment item
3. Category
4. Install date
5. Actual / estimated
6. Calculated replacement date
7. Override replacement date
8. Replacement cost

---

## 5. Inspections

**URL**: `/inspections/staff`

**Warning banner**: ⚠️ "Inspections can only be completed via the BuildingLink GEO app."

### Layout — Left Side

**Upcoming Inspections:**
- Empty section when no inspections scheduled
- **Schedule Inspection** button (dark blue, top right)

**Completed Inspections:**
- Search: "Search Unit or Area" (text input)
- Advanced filter dropdown
- "No inspections found" — 0 of 0

### Layout — Right Side

**Checklists tab:**
- Empty state: "You don't have any checklists"
- **Generate Default Checklists** button (teal)
- **Create New Checklist** button (dark blue, top right)

**Global Checklists tab (6 built-in templates):**
| # | Checklist Name | Actions |
|---|---------------|---------|
| 1 | Property General | View, Copy to Checklists |
| 2 | Lobby | View, Copy to Checklists |
| 3 | Amenities | View, Copy to Checklists |
| 4 | Facility Exterior | View, Copy to Checklists |
| 5 | Inspection Plan | View, Copy to Checklists |
| 6 | Fire Prevention Checklist | View, Copy to Checklists |

**Version info**: v1.0.3690-1-g984b6351 | v1.0.128 | 2/24/2026

---

## 6. Vendors / Contractors Directory

**URL**: `/vendor-directory/staff/vendors`

### Vendor Insurance Compliance Summary (5 status cards)
| Count | Status Description |
|-------|--------------------|
| 1 | Vendors are compliant |
| 0 | Vendors are not compliant |
| 0 | Vendors are expiring in the next 30 days |
| 0 | Vendors are expired |
| 0 | Vendor is not tracking compliance |

### Vendor List Section

**Title**: "Vendor list - Queensway Park Condos - TSCC 2934"

**Toggle Columns (3 checkboxes):**
- ☐ Show category column
- ☐ Show compliance column
- ☐ Show notes

**Clear filters** link (right-aligned)

**Table Columns (10):**
1. Name — Vendor company name
2. Address — Street address
3. City — City
4. State — State/Province
5. Zip — Postal code
6. Phone # — Contact phone number
7. Assign to maint Req — Link to assign vendor to a maintenance request
8. Added By — Who added the vendor
9. Contact vendor — Direct contact action
10. Remove — Delete vendor

**Actions:**
- **Export to Excel** (green button)
- **Add vendors from master list** (dark blue button) — BuildingLink provides a shared vendor database

**Pagination**: "Showing 1 to 1 of 1"

**Toast notification**: "Vendors directory has been redesigned! Click here to learn more >"

---

## 7. Recurring Tasks

**URL**: `/recurring-tasks/staff/tasks`

### Header
- **Settings** button (blue outlined, next to title) — leads to recurring task settings

### Two Tabs
1. **Recurring tasks** (active) — All configured recurring tasks
2. **Tasks forecast** — Future task calendar/projection

### Filters (8 filter controls)
| Filter | Type | Default |
|--------|------|---------|
| Search unit or name | Text input | Free text search |
| Include deactivated units | Checkbox | ☐ Unchecked |
| Show descriptions | Checkbox | ☑ Checked |
| Category | Dropdown | All categories |
| Task type | Dropdown | All task types |
| Equipment category | Dropdown | All equipment categories |
| Equipment items | Dropdown | All equipment items |
| Interval | Dropdown | All intervals |
| Clear filters | Link | Reset all filters |

### Export Options
- **Export to Excel** (green button)
- **Export to PDF** (red button)

### Table Columns (9)
1. Task name — Name of the recurring task
2. Category — Task category
3. Equipment item — Linked equipment
4. Description — Task description text
5. Unit # — Associated unit
6. Assigned to — Staff member assignment
7. Interval — Frequency (daily, weekly, monthly, etc.)
8. Next date scheduled — Next occurrence date
9. Maint. requests — Linked maintenance requests

### Actions
- **Add task** button (dark blue, top right)

### Pagination
- Items per page: 25 (configurable dropdown)
- Navigation: |< < > >|
- Display: "Showing 1 to 0 of 0"

**Toast notification**: "Recurring tasks has been redesigned! Click here to learn more >"

---

## 8. Maintenance Reports

**URL**: `/v2/mgmt/maintenance/maintenancereports.aspx` (legacy ASP.NET)

**Note**: This is a legacy ASP.NET page accessible from the Maintenance Home Page. Direct URL navigation causes server error — must be accessed through the Maintenance Home Page hub.

---

## 9. Replicate

**URL**: Accessible from Maintenance Home Page

New feature for replicating maintenance configuration settings across properties.

---

## Concierge Design Implications

### From New Request Deep Dive
1. **2-tier category hierarchy** — Common Areas (33) + In-Suite (10) with overlapping categories is smart UX for tracking
2. **"Private" toggle** on categories — allows hiding certain categories from residents
3. **Permission to enter** is critical for in-suite work — must be prominently displayed
4. **4000 char description** but **1000 char entry instructions** — different limits for different purposes
5. **Multi-format file upload** — photos (including HEIC for iPhone) + documents (PDF, DOC, XLS) — comprehensive

### From Request Detail Deep Dive
1. **Predefined responses** — template system for quick staff responses is excellent for efficiency
2. **Create invoice** directly from request — billing integration
3. **Add charges + Add time spent** — built-in cost and time tracking
4. **Activity log timeline** — full audit trail of all actions
5. **Hide from resident** option — staff can add internal notes not visible to residents
6. **Inline description preview** on listing — reduces clicks

### From Equipment Deep Dive
1. **6 default categories** covering major building systems (Electrical, Fire, Gas, Mechanical, Roof, Valves)
2. **Replacement report** with 5-year forward view — lifecycle planning
3. **Links to recurring tasks** — equipment drives maintenance schedules

### From Inspections Deep Dive
1. **Mobile-only completion** — inspections are field work, not desk work
2. **6 built-in global checklists** — accelerate onboarding for new properties
3. **Copy to Checklists** pattern — global templates can be customized per property

### From Vendors Deep Dive
1. **5-status compliance dashboard** — proactive insurance tracking
2. **Master vendor list** — shared database creates network effects
3. **Direct maintenance request linkage** — assign vendor right from vendor list

### From Recurring Tasks Deep Dive
1. **8 filter dimensions** — comprehensive filtering for complex task lists
2. **Tasks forecast tab** — forward-looking view is critical for maintenance planning
3. **Equipment linkage** — ties tasks to specific equipment items
4. **Dual export** (Excel + PDF) — different formats for different audiences

### Status Model Comparison
| Context | Statuses |
|---------|----------|
| Maintenance Request (creation) | Open, Hold (with date), Close (with date) |
| Maintenance Request (search filter) | Open, On hold, On hold indefinitely, Closed |
| Incident Report | Draft, Pending Approval, Finalized, Archived, Deleted |

**Key insight**: "On hold indefinitely" is a separate status from "On hold" — indicates maintenance requests that are waiting with no expected resolution date. Concierge should implement this distinction.
