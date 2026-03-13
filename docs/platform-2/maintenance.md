# Maintenance Module

BuildingLink's Maintenance module is significantly more comprehensive than Aquarius's, with 7 sub-sections vs Aquarius's single maintenance request page.

---

## Sub-Sections

1. New request
2. Search requests
3. Equipment
4. Inspections
5. Vendors directory
6. Recurring tasks
7. Maintenance reports

---

## 1. New Maintenance Request

Two-column layout form.

### Left Column — Request Details

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Search unit number or name | Yes | Autocomplete | Unit/resident lookup |
| Don't show to residents | No | Checkbox | Hide from resident portal |
| Assign to management unit | No | Link | Assign to management instead of unit |
| Problem description | No | Textarea (4000 char) | Detailed issue description |
| Category | No | Dropdown | Maintenance category |
| Permission to enter | No | Radio: Yes/No | Does staff have permission to enter unit |
| Entry instructions | No | Textarea (1000 char) | How to access the unit |
| Photo attachments | No | File upload | JPG, JPEG, PNG, BMP, GIF, HEIC (4MB max) |
| Documents | No | File upload | PDF, DOC, DOCX, XLS, XLSX (4MB max) |
| Create with status | No | Toggle: Open/Hold/Close | Initial status (Hold and Close have date pickers) |
| Print work order | No | Checkbox | Generate printable work order |
| High urgency | No | Checkbox | Flag as urgent |

### Right Column — Additional Details

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Assigned employee | No | Dropdown | Staff member assignment |
| Date requested | Auto | Date picker | Defaults to today |
| Assigned vendor | No | Dropdown | Vendor from vendor directory |
| Equipment | No | Dropdown | Link to equipment item |
| Email notifications | No | Email input | Notification recipients |
| Additional emails | No | Email input | CC recipients |
| Contact numbers | No | Text input | Contact phone numbers |
| Optional reference number | No | Text input | External reference |
| Priority | No | Input | Priority level |

### Action Buttons
- **Save** — Create and save
- **Save and add another** — Create and start new form
- **Clear** — Reset form

### Delta from Aquarius
Aquarius's maintenance form has: Unit, Description, Category (dropdown with 11 types), Priority, Assigned Employee, Start/End dates, Status, Comments. BuildingLink adds: Permission to enter, Entry instructions, Photo/Document attachments, Vendor assignment, Equipment linkage, Work order printing, High urgency flag, and the ability to create in Hold or Closed status.

---

## 2. Search Requests (Listing)

### Top Bar Actions
- **Export to Excel** (green button)
- **Print List** (dark blue button)
- **Create New Request** (dark blue button)

### Filters
| Filter | Type | Description |
|--------|------|-------------|
| Search unit or ID | Text search | Search by unit number or request ID |
| Status | Dropdown with badge | Filter by status (badge shows active filter count) |
| Category | Dropdown | Filter by maintenance category |
| Employee | Dropdown | Filter by assigned employee |
| Advanced | Dropdown | Additional filter options |
| Clear Filters | Link | Reset all filters |

### Table Columns
| Column | Description |
|--------|-------------|
| Checkbox | Bulk selection |
| Status | Color-coded status badge (Open = green) |
| ID | Request ID number (sortable) |
| Unit | Unit number and resident name |
| Category | Maintenance category |
| Assignee | Assigned staff member |
| Requested | Date requested and source (e.g., "Resident") |
| Last Comment | Most recent comment date |
| Print icon | Print individual request |

### Inline Preview
Problem description shows directly below each row — no need to click to see the issue summary.

### Pagination
- Items per page: 25 (configurable)

---

## 3. Equipment

### Three Tabs

#### Equipment Items
- Search by name
- Group by category (checkbox)
- Category filter dropdown
- Additional fields to display (customizable columns)
- Include inactive equipment items (checkbox)
- Show recurring task detail (checkbox)
- Export to Excel
- Add equipment button

#### Equipment Categories (6 default)
| Category | Items |
|----------|-------|
| Electrical | 0 |
| Fire | 0 |
| Gas | 0 |
| Mechanical | 0 |
| Roof | 0 |
| Valves | 0 |

- Include inactive categories checkbox
- Add category button

#### Equipment Replacement Report
- Replacement scheduling and forecasting

### Delta from Aquarius
**Aquarius has no equipment tracking module.** This is a completely new feature for Concierge to consider. Equipment tracking is essential for preventive maintenance, warranty management, and compliance.

---

## 4. Inspections

### Key Feature: Mobile-First
Warning banner: "Inspections can only be completed via the BuildingLink GEO app"

### Layout
| Section | Description |
|---------|-------------|
| Upcoming Inspections | Scheduled inspections with "Schedule Inspection" button |
| Completed Inspections | Search by Unit or Area, Advanced filters |
| Checklists (right panel) | Custom checklists with "Create New Checklist" button |
| Global Checklists (right panel tab) | 6 built-in global checklists with "Generate Default Checklists" |

### Delta from Aquarius
**Aquarius has no inspections module.** BuildingLink ties inspections to equipment, locations, and checklists — enabling preventive maintenance workflows.

---

## 5. Vendors / Contractors Directory

### Vendor Insurance Compliance Summary (5 status cards)
| Status | Count | Description |
|--------|-------|-------------|
| Compliant | 1 | Insurance up to date |
| Not compliant | 0 | Insurance issues |
| Expiring in next 30 days | 0 | About to expire |
| Expired | 0 | Insurance lapsed |
| Not tracking compliance | 0 | No compliance data |

### Vendor List Columns
| Column | Description |
|--------|-------------|
| Name | Vendor company name |
| Address | Street address |
| City | City |
| State | State/Province |
| Zip | Postal code |
| Phone # | Contact phone |
| Assign to maint Req | Link vendor to maintenance request |
| Added By | Who added the vendor |
| Contact vendor | Direct contact action |
| Remove | Delete vendor |

### Toggle Columns
- Show category column
- Show compliance column
- Show notes

### Actions
- Export to Excel
- Add vendors from master list (BuildingLink provides a shared vendor database)

### Delta from Aquarius
Aquarius has a basic Contractors page with name, company, phone, email. BuildingLink adds: full address, insurance compliance tracking with 5-status dashboard, master vendor list, category system, and direct maintenance request linkage.

---

## 6. Recurring Tasks

### Two Tabs
1. **Recurring tasks** — Active scheduled tasks
2. **Tasks forecast** — Future task projections

### Filters
| Filter | Description |
|--------|-------------|
| Search unit or name | Text search |
| Include deactivated units | Checkbox |
| Show descriptions | Checkbox (checked by default) |
| Category | Dropdown |
| Task type | Dropdown |
| Equipment category | Dropdown |
| Equipment items | Dropdown |
| Interval | Dropdown |

### Table Columns
| Column | Description |
|--------|-------------|
| Task name | Name of the recurring task |
| Category | Task category |
| Equipment item | Linked equipment |
| Description | Task description |
| Unit # | Associated unit |
| Assigned to | Staff member |
| Interval | Frequency (daily, weekly, monthly, etc.) |
| Next date scheduled | Next occurrence |
| Maint. requests | Linked maintenance requests |

### Actions
- Settings button
- Add task button
- Export to Excel
- Export to PDF

### Delta from Aquarius
**Aquarius has no recurring tasks.** This is critical for preventive maintenance scheduling. Concierge should implement this with modern scheduling UX.

---

## Concierge Opportunity Summary

The maintenance module is where BuildingLink is most significantly ahead of Aquarius. For Concierge, we should implement:

1. **Equipment tracking** with lifecycle management
2. **Inspection system** with mobile-first checklist approach
3. **Vendor compliance dashboard** with expiry alerts
4. **Recurring task scheduler** with forecasting
5. **Rich maintenance forms** with photo/document uploads
6. **Work order printing** for field staff
7. **Urgency flagging** for priority management
