# Amenity Reservations Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Amenity Reservations module.

---

## Overview

**URL (Modern SPA)**: `/amenities/staff`
**URL (Legacy ASP.NET)**: `/V2/mgmt/amenities/listview.aspx`

The module has both a modern SPA interface and a legacy ASP.NET interface. The modern SPA provides list view; the legacy interface provides Calendar View, Availability Grid, and the Create/Edit Reservation forms.

---

## 1. List View (Modern SPA)

**URL**: `/amenities/staff`

### Top Bar Actions
| Button | Color | Action |
|--------|-------|--------|
| Print view | Teal | Opens print-friendly modal with all reservations |
| Create reservation ▼ | Dark green (split button) | Dropdown listing all amenities to create a booking |

### Create Reservation Dropdown (4 amenities configured)
1. BBQ 1
2. BBQ 2
3. Moving Elevator
4. Party room

### Filter Bar
| Control | Type | Description |
|---------|------|-------------|
| Enter unit # or name | Text search with 🔍 | Free text search |
| Date range start | Date picker | Default: today (3/13/2026) |
| Date range end | Date picker | Default: 3 months forward (6/13/2026) |
| Status | Multi-select dropdown (badge count) | Filter by reservation status |
| Amenities | Multi-select dropdown | Filter by amenity type |
| Advanced | Dropdown (badge count) | Additional filter options |
| Reset filters | Link | Reset all filters |

### 3 View Mode Icons (top right)
1. ☰ List view (default, active blue)
2. 📅 Calendar view (links to legacy calendar)
3. ⊞ Grid view (links to legacy availability grid)

### Status Filter Options (4 checkboxes)
| # | Status | Default | Color |
|---|--------|---------|-------|
| 1 | Requested | ☑ Checked | Green accent |
| 2 | Approved | ☑ Checked | Green accent |
| 3 | Declined | ☐ Unchecked | — |
| 4 | Cancelled | ☐ Unchecked | — |

### Amenities Filter Options (4 checkboxes)
1. ☐ BBQ 1
2. ☐ BBQ 2
3. ☐ Moving Elevator
4. ☐ Party room

### Table Columns (5)
1. **Reservation time** — Date + time range (e.g., "3/13/26 12:00 PM - 1:00 PM")
2. **Amenity** — Resource name (e.g., "Moving Elevator", "Party room")
3. **Requested for** — "Unit# · Resident Name" (e.g., "813 · Sheryl-Ann Marcelo")
4. **Description** — Booking notes (truncated with "..." if long)
5. **Status** — Color-coded badge with left accent line (green = Requested/Approved)

### Pagination
- Count display: "7 of 7"
- No items per page dropdown on this view

### Print Reservations Modal
- Title: "Print Reservations"
- Header: "Queensway Park Condos - TSCC 2934" + date/time stamp
- Table: Reservation Time, Amenity, Requested For, Description, Status
- **Print** button (blue, top right)
- ✕ Close button

---

## 2. Calendar View (Legacy ASP.NET)

**URL**: `/V2/mgmt/amenities/CalendarView.aspx`

### Top Bar
- **Building calendar** button (teal outlined)
- **Print view** button (teal)
- **Create reservation ▼** (dark green split button)

### Filters (same as list view minus date range)
- Enter unit # or name
- Status (badge count)
- Amenities dropdown
- Advanced (badge count)
- Reset filters

### Calendar Controls
| Control | Type | Description |
|---------|------|-------------|
| Month navigation | < [Month Year ▼] > | Navigate months with arrows or dropdown |
| Display units | Checkbox | ☐ Show unit numbers on calendar entries |

### Calendar Grid
- Standard monthly calendar layout: Sun – Mon – Tue – Wed – Thu – Fri – Sat
- Today's date highlighted in bold
- Reservation events shown as colored bars on calendar days:
  - **Orange/peach bars**: Moving Elevator bookings (show time + "Moving Elevator")
  - **Green bars**: Party room bookings (show time + "Party room")

### Day Detail Panel (right side)
When a day is selected:
- **Date heading**: "March 13, 2026"
- **Amenity bullet**: ● Moving Elevator (colored bullet)
- **Time**: 12:00 PM - 1:00 PM
- **Unit · Name**: 813 · Sheryl-Ann Marcelo

---

## 3. Availability Grid (Legacy ASP.NET)

**URL**: `/V2/mgmt/amenities/AvailabilityGrid.aspx`

### Header
- "Reservations Availability Grid" title bar (dark blue)
- **+ Make a New Reservation** button (dark blue, top right)

### Options Bar
| Control | Type | Description |
|---------|------|-------------|
| All Amenities | Checkbox | ☑ Show all amenities |
| Select one or more Amenities | Multi-select dropdown | Alternative: select specific amenities |
| Show Selection | Button | Apply selection |
| Status pills | Active filters | Requested (blue pill), Approved (blue pill) |

### Navigation
| Control | Type | Description |
|---------|------|-------------|
| Go to: Today | Button with refresh icon | Jump to today's date |
| Date picker | Date input | Navigate to specific date |
| Prev / Next | Navigation arrows | Move one day forward/back |
| Date display | Header | "Friday, March 13, 2026" |

### Grid Layout
- **Rows**: 30-minute time slots from 12:00 AM to 11:30 PM (48 rows)
- **Columns**: All configured amenities: BBQ 1 | BBQ 2 | Moving Elevator | Party room
- **Cell states**:
  - **"Restricted"** (grey background) — Outside amenity hours, not bookable
  - **Empty/White** — Available for booking
  - **Booked** (colored) — Reserved slot with resident info
  - **Clickable** — Available cells can be clicked to create a reservation

---

## 4. Reservation Detail Page (Legacy ASP.NET)

**URL**: `/V2/mgmt/amenities/editreservation.aspx?id=[ID]&from=0`

### Header
- **Title**: "Reservation for [Unit#] - [Name] ([Amenity])"
- **Tabs**: List View | Calendar View | Availability Grid
- ◀ **Back** button | 🖨 **Print** button

### Reservation Details Section (yellow/gold header)
| Field | Type | Description |
|-------|------|-------------|
| Amenity | Read-only | Amenity name (e.g., "Moving Elevator") |
| Requested For | Read-only | "Unit# - Name" (e.g., "523 - Jordan Parker") |
| Submitted By | Read-only | Staff who created it (e.g., "Rajesh Reddy Jonnalagadda") |
| From | Read-only | Start date/time (e.g., "Thursday 4/2/26 at 12:00 PM") |
| To | Read-only | End date/time (e.g., "Thursday 4/2/26 at 2:00 PM") |
| Contact Info - Name | Read-only | Resident name |
| Contact Info - Phone | Read-only | Phone with type prefix "(C) XXXXXXXXXX" |
| Contact Info - Email | Read-only | Email address |
| Reservation Details | Read-only | Booking notes text |
| ✏ Edit | Button | Edit reservation details |

### Reservation Status Panel (right side, yellow background)
| Status | Type |
|--------|------|
| ◉ Requested | Radio button (selected for this example) |
| ○ Approved | Radio button |
| ○ Declined | Radio button |
| ○ Cancelled | Radio button |

### Audit Trail
- "Last changed by [Name] on [date] at [time]"

### Reservation History & Notes Section (dark blue header)
- 📧 **Send Email To Resident** button
- ➕ **Add Note to Log** button
- History entries: "New request submitted by [Staff] for [Resident] On [datetime]"

---

## 5. Create Reservation Form (Legacy ASP.NET)

**URL**: `/V2/mgmt/amenities/newreservation.aspx?amenityId=[ID]&from=0&starts=undefined`

### Form Title
"Make a New Reservation"

### Left Column — Booking Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Reservation Status | Yes | Radio buttons (3) | ◉ Requested / ○ Approved / ○ Declined |
| Select Amenity | Yes (required) | Dropdown | Pre-selected based on what was clicked |
| Requested For | Yes (required) | Unit autocomplete + Occupant dropdown | "Unit # or name" + "Select Occupant" |
| Name | Auto | Text input | Auto-populated when unit selected |
| Phone | Auto | Text input | Auto-populated when unit selected |
| Email | Auto | Text input | Auto-populated when unit selected |
| Available Times Today | Display | Info box | Shows available time range (e.g., "1:00 PM - 8:00 PM") |
| Reservation Start Date | Yes | Date picker + Time picker | Default: today + start time "12:00 AM" |
| All Day Reservation | No | Link | Sets start and end to full day |
| Reservation End Date | Yes | Date picker + Time picker | Default: today + end time "1:00 AM" |
| Recurring Reservation | No | Checkbox | ☐ Enable recurring booking |
| Reservation Details | No (optional) | Textarea | 500 Characters Remaining |

### Right Panel — Amenity Information (auto-populated)

**Moving Elevator Example:**

**Operating Hours:**
| Day | Hours |
|-----|-------|
| Mondays | 12:00 PM to 4:00 PM |
| Tuesdays | 12:00 PM to 4:00 PM |
| Wednesdays | 12:00 PM to 4:00 PM |
| Thursdays | 12:00 PM to 4:00 PM |
| Fridays | 12:00 PM to 8:00 PM |
| Saturdays | 4:00 PM to 8:00 PM |

**Reservation Rules:**
- "This amenity cannot be reserved for more than a day."

**Allocation Limit:**
- "1 reservation(s) per 1 Day(s) per Unit."

**Instructions Shown to Residents:**
- Detailed slot information per day
- Sunday and Stat Holiday bookings not allowed
- Restrictions on 4:00-8:00 PM Mon-Fri
- MOVE IN/MOVE OUT/DELIVERY: $500.00 damage deposit cheque
- Cheques payable to TSCC 2934
- Bank drafts/certified cheques or money order accepted

### Action Buttons (duplicated top + bottom)
- ✖ **Cancel** (red)
- 💾 **Save** (green)

---

## Observed Data Summary

### Amenities Configured (4)
| Amenity | Type | Bookings Observed |
|---------|------|-------------------|
| BBQ 1 | Outdoor amenity | Party room bookings using this |
| BBQ 2 | Outdoor amenity | 0 |
| Moving Elevator | Service amenity | 6 bookings |
| Party room | Event space | 1-3 bookings |

### All Observed Reservations
| Date/Time | Amenity | Unit | Resident | Description | Status |
|-----------|---------|------|----------|-------------|--------|
| 3/1/26 5:00-11:00 PM | Party room | 324 | Anastasiia Lazarchuk | Cheques and forms are received | Requested |
| 3/6/26 5:00-11:00 PM | Party room | 316 | Joao Rodrigues | Deposit on file, drop off $50 | Requested |
| 3/9/26 3:00-9:00 PM | Party room | 304 | Aamena Panchbhaya | Booking form and cheques received, 3:00-10:00PM | Approved |
| 3/13/26 12:00-1:00 PM | Moving Elevator | 813 | Sheryl-Ann Marcelo | Cheques and form received | Requested |
| 3/14/26 4:00-6:00 PM | Moving Elevator | 312 | Angelo Licup Maralit | Cheques and forms received | Requested |
| 3/19/26 12:00-4:00 PM | Moving Elevator | 410 | Francesca Melia | Extra time approved by management, damage deposit received | Requested |
| 3/20/26 12:00-3:30 PM | Moving Elevator | 819 | Punit Padda | Access loading area/elevator by 10am | Requested |
| 3/21/26 4:00-6:00 PM | Moving Elevator | 212 | Molly Smith | Moving Large (couch/bed) into Unit 212 | Requested |
| 4/2/26 12:00-2:00 PM | Moving Elevator | 523 | Jordan Parker | — | Requested |
| 4/4/26 4:00-10:00 PM | Party room | 617 | Valentyna Pikhirovska | Form and cheques pending | Requested |

---

## Concierge Design Implications

### From Reservations Deep Dive
1. **4-status workflow**: Requested → Approved → (Declined/Cancelled) — simple but effective
2. **Amenity-specific information panel**: Hours, rules, allocation limits, and resident instructions displayed alongside booking form — critical for informed bookings
3. **3 view modes** serve different purposes:
   - **List view** for management/search
   - **Calendar view** for scheduling overview
   - **Availability grid** for real-time slot availability
4. **Availability grid with 30-min slots** is the most powerful view — shows all amenities side by side with restricted/available/booked states
5. **Financial requirements**: Damage deposits ($500), cheques payable to corporation — reservation system needs to track deposit status
6. **Recurring reservation** support — important for regular bookings
7. **Per-amenity operating hours** with day-of-week granularity — Mon-Fri different from Saturday, Sunday restricted
8. **Allocation limits**: "1 reservation per 1 day per unit" — prevents hoarding
9. **Submitted By vs Requested For**: Tracks both who booked and who it's for — important audit trail
10. **Contact info auto-population**: Selecting unit fills name, phone, email automatically
11. **Resident instructions**: Long-form configurable text shown to residents — property-specific rules
