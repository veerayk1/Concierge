# Events — Granular Deep Dive

Field-level documentation of every element in Condo Control's Events module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/event/list-event/`
**Sidebar menu**: Events (calendar/star icon)
**Breadcrumb**: Home > Events
**Page title**: "Events | Condo Control"

The module has **2 view tabs**:
1. **Calendar View** (`#tab-1`) — FullCalendar month/week/day calendar
2. **List View** (`#tab-2`) — Sortable table of all events

**Total events**: 34 pages × ~15 events/page ≈ 500+ events (property has extensive event history)

**Role restriction**: Security & Concierge has **read-only** access. Can view events but cannot create, edit, or delete. No create event URL discovered.

---

## 2. Filter Bar

Shared across both Calendar View and List View tabs.

### 2.1 Search and Filter Controls

| # | Field | Type | ID/Name | Default | Options |
|---|-------|------|---------|---------|---------|
| 1 | Search | Text input | (unnamed) | Empty | Free-text search. No placeholder |
| 2 | Status | Select dropdown | `ddlFilterStatus` | "All Events" (5) | All Events (5), Future Events (3), Past Events (4), Cancelled Events (2) |
| 3 | Search | Button | — | — | Teal `btn-primary` |
| 4 | Reset | Link | — | — | Teal text. Clears filters (href="#") |

### 2.2 Calendar Toggle Buttons

Three color-coded toggle buttons filter events by calendar source. All checked by default.

| # | Label | Color | Default State | Description |
|---|-------|-------|---------------|-------------|
| 1 | All Calendars | Teal/dark (rgb ~dark teal) | ☑ Checked | Shows events from all calendars |
| 2 | INTERNAL CALENDAR | Red/coral (#FF0000-ish) | ☑ Checked (✕ icon) | Internal/staff events. Red badge |
| 3 | MTCC 872 Calendar | Teal/blue | ☑ Checked (✓ icon) | Property-specific/public events. Teal badge |

**Toggle behavior**:
- Each button toggles on/off independently
- "All Calendars" overrides individual selections
- Calendar colors persist into calendar events and list view badges
- INTERNAL CALENDAR events use red backgrounds; MTCC 872 Calendar events use blue/teal backgrounds

---

## 3. Calendar View Tab

**Tab**: `#tab-1` (default)

### 3.1 Calendar Navigation

| # | Element | Description |
|---|---------|-------------|
| 1 | Previous (◀) | Teal circle, left arrow |
| 2 | Next (▶) | Teal circle, right arrow |
| 3 | today | Teal badge button. Returns to current date |
| 4 | Month title | Center. Format: "March 2026" |
| 5 | month | View toggle (default) |
| 6 | week | View toggle |
| 7 | day | View toggle |

### 3.2 Print Calendar Button

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Print Calendar | Button (`type="button"`) | Prints the current calendar view. Positioned in the calendar toolbar area |

### 3.3 Calendar Legend Checkboxes

The calendar toggle buttons (§2.2) are implemented as checkboxes with specific IDs:

| # | Checkbox Label | Value | Color | Description |
|---|---------------|-------|-------|-------------|
| 1 | All Calendars | (master toggle) | Dark teal | Toggles all calendars on/off |
| 2 | INTERNAL CALENDAR | `16984` | Red (#FF0000) | Internal/staff calendar — ID 16984 |
| 3 | MTCC 872 Calendar | `16988` | Teal/blue | Property-specific calendar — ID 16988 |

**Calendar IDs**: These are the `calendarID` values used in the platform's backend. Each property can have multiple named calendars with unique IDs.

### 3.4 Calendar Grid

Same FullCalendar component as Amenity Booking module.

| Property | Value |
|----------|-------|
| Section ref | §3.4 |
| Columns | Sun, Mon, Tue, Wed, Thu, Fri, Sat |
| Header style | Teal background, white text |
| Today highlight | Date highlighted (yellow background on today's date) |
| Friday column | Highlighted in yellow/gold for current week |
| Event display | Color-coded by calendar source |
| Event format | Brief title text on calendar cell |

**Event colors on calendar**:
- INTERNAL CALENDAR events: Red/coral background
- MTCC 872 Calendar events: Teal/blue background

---

## 4. List View Tab

**Tab**: `#tab-2`

### 4.1 List View Notice

**Notice text** (displayed above or below the table): *"Please note that list view only shows list of events up to 4 years in advance."*

This means the list view has a built-in time horizon limit — events more than 4 years in the future are excluded from the list view (they may still appear on the calendar view).

### 4.2 Events Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | (icon) | No | Small calendar/document icon. Each row has an icon — clickable, links to `/event/event-details/{eventId}` |
| 2 | Description | No | Event title text. Clickable link to detail page |
| 3 | Type | No | Recurrence type: "Does Not Repeat" or "Monthly" (observed values) |
| 4 | Start | No | Start date/time. Format: M/DD/YYYY H:MM:SS AM/PM |
| 5 | End | No | End date/time. Format: M/DD/YYYY H:MM:SS AM/PM |
| 6 | Event Status | No | Status text: "Active" or "Cancelled" |
| 7 | Location | No | Location text (e.g., "4725 Sheppard Ave. E.", "Virtual", "Unit 1217") |
| 8 | Calendar | No | Calendar source badge. Color-coded: "INTERNAL CALENDAR" (red badge) or "MTCC 872 Calendar" (teal badge) |

**Table header style**: Dark teal background, white text (same as other modules).

### 4.2 Observed Event Data

| Description | Type | Start | End | Status | Location | Calendar |
|-------------|------|-------|-----|--------|----------|----------|
| BALCONY CLEANUP 1217 | Does Not Repeat | 4/15/2023 9:00:00 AM | 4/15/2023 5:00:00 PM | Active | Unit 1217 | INTERNAL CALENDAR |
| Glass Man - In-Suite Repairs | Does Not Repeat | 4/17/2023 9:00:00 AM | 4/17/2023 5:00:00 PM | Active | 4725 Sheppard Ave. E. | INTERNAL CALENDAR |
| Meeting of the Board of Directors | Monthly | 4/24/2023 7:00:00 PM | 4/24/2023 8:30:00 PM | Active | Virtual | MTCC 872 Calendar |
| BUDGET PACKAGE AND PERIODIC INFO CERTIFICATE | Does Not Repeat | 5/1/2023 8:00:00 AM | 5/1/2023 8:30:00 AM | Active | 4725 Sheppard Ave. E. | MTCC 872 Calendar |

**Key observations from data**:
- Events date back to at least April 2023 — all still marked "Active" (no archival)
- "Does Not Repeat" is the most common recurrence type
- "Monthly" used for recurring meetings (Board of Directors)
- Locations include physical addresses, unit numbers, and "Virtual"
- Most events are INTERNAL CALENDAR (staff/maintenance related)
- MTCC 872 Calendar events tend to be resident-facing (board meetings, info sessions)

### 4.3 Pagination

| # | Element | Description |
|---|---------|-------------|
| 1 | First | Navigate to first page |
| 2 | Previous | Navigate to previous page |
| 3 | Page numbers | 1, 2, 3... 10, ... | Current page highlighted (no background, bordered) |
| 4 | Next | Navigate to next page |
| 5 | Last | Navigate to last page |

**Pagination URL pattern**: `/event/list-event/?Page={pageNumber}`
**Total pages**: 34 (observed "Last" link points to Page=34)
**Events per page**: ~15

---

## 5. Event Detail Page

**URL**: `/event/event-details/{eventId}`
**Example**: `/event/event-details/76423`
**Page title**: "Event Details | Condo Control"
**Breadcrumb**: Home > Events > Event Details

### 5.1 Event Information Table

Read-only two-column layout: Label | Value.

| # | Field Label | Value (observed) | Description |
|---|------------|------------------|-------------|
| 1 | Title: | Alzemo (Designer) On-Site | Event title |
| 2 | Description: | Alzemo Perreira will be here 10:00-11:30ish. | Event description. Plain text |
| 3 | Recurrence Type: | Does Not Repeat | Recurrence pattern |
| 4 | Start Date Time: | 4/24/2023 10:00:00 AM | Start. Format: M/DD/YYYY H:MM:SS AM/PM |
| 5 | End Date Time: | 4/24/2023 12:00:00 PM | End. Format: M/DD/YYYY H:MM:SS AM/PM |
| 6 | Last Occurrence: | *(only on recurring events)* | Last occurrence date/time. Format: M/DD/YYYY H:MM:SS AM/PM. Example: "11/27/2023 7:00:00 PM". Only displayed for events with recurrence (e.g., Monthly). Not shown for "Does Not Repeat" events |
| 7 | Status: | Active | Event status |
| 8 | Location: | 4725 Sheppard Ave. E. | Event location |
| 9 | Attachments: | There are no attachments | Attachment section. Supports file attachments but none observed |

### 5.2 Action Buttons

**None observed** for Security & Concierge role. Page is read-only.

**Not present** (compared to other modules): No History section, no edit/delete buttons, no RSVP functionality.

---

## 6. Data Model Observations

### 6.1 Event Entity

| Field | Type | Description |
|-------|------|-------------|
| EventId | Integer | Unique identifier (e.g., 75680, 76423) |
| Title | String | Event title |
| Description | Text | Event description (plain text or HTML) |
| RecurrenceType | String | "Does Not Repeat", "Monthly" (possibly others: Daily, Weekly, Yearly) |
| StartDateTime | DateTime | Start date/time |
| EndDateTime | DateTime | End date/time |
| Status | Enum | Active, Cancelled. IDs: Cancelled=2, Future=3, Past=4, All=5 |
| Location | String | Free-text location (address, unit number, "Virtual") |
| Calendar | String | Calendar source: "INTERNAL CALENDAR" or property-specific name |
| Attachments | Array | File attachments (supports uploads, none observed) |

### 6.2 Status Filter IDs

| Status | ID | Description |
|--------|----|-------------|
| Cancelled Events | 2 | Only cancelled events |
| Future Events | 3 | Events with start date > now |
| Past Events | 4 | Events with start date < now |
| All Events | 5 | No date/status filter |

**Note**: IDs 1 is missing — possibly "Active Events" or "Draft Events".

### 6.3 Calendar Types

| Calendar | Color | Typical Use |
|----------|-------|-------------|
| INTERNAL CALENDAR | Red (#FF0000) | Staff/maintenance events: service calls, installations, cleanups |
| MTCC 872 Calendar | Teal/Blue | Resident-facing events: board meetings, info sessions, deadlines |

---

## 7. URL Map

| Page | URL Pattern |
|------|-------------|
| Events list (default: calendar view) | `/event/list-event/` |
| Events list (paginated) | `/event/list-event/?Page={pageNumber}` |
| Event detail | `/event/event-details/{eventId}` |

---

## 8. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Dual calendar system** — Internal (staff) and public (resident) calendars. Critical for condo management where staff need separate scheduling from resident-facing events
2. **Color-coded calendar badges** — Red for internal, teal for public. Instant visual identification in both calendar and list views
3. **Calendar toggle filters** — One-click filtering by calendar source. "All Calendars" master toggle
4. **Dual view modes** — Calendar View for visual scheduling, List View for detailed browsing. Good for different user preferences
5. **Location flexibility** — Supports physical addresses, unit numbers, and "Virtual". Covers all event types
6. **Recurrence support** — "Does Not Repeat" and "Monthly" observed. Likely supports full recurrence patterns
7. **Attachment support** — Events support file attachments (though none observed in practice)
8. **Extensive history** — 500+ events preserved going back years. Good audit trail

### What CondoControl Gets Wrong
1. **No RSVP or attendance tracking** — Events have no "Attend" button, no attendee count, no capacity limit. Just passive listings
2. **No event creation for Security & Concierge** — Read-only access. A concierge should be able to create internal calendar events at minimum
3. **All old events still "Active"** — Events from April 2023 are still "Active" status. No automatic archival or status transition when end date passes
4. **No event categories or tags** — Can't distinguish maintenance events from social events from board meetings without reading the title
5. **No search placeholder** — Search input has no placeholder text
6. **Date format includes seconds** — "4/15/2023 9:00:00 AM" shows unnecessary seconds precision
7. **No History section on detail page** — Unlike Amenity Booking and Announcements which have History, Events has no audit trail on the detail page
8. **Pagination shows all 34 pages** — No condensed pagination. Shows pages 1-10 + "..." + Last. Gets unwieldy with 34 pages
9. **No event notifications** — No indication of whether event reminders are sent or how residents are notified
10. **Calendar names are ALL CAPS** — "INTERNAL CALENDAR" is shouting. Unnecessary uppercase for UI labels
11. **List not sorted by most recent first** — Events display oldest first (April 2023). Should default to most recent or future events
12. **4-year list view limit** — List view arbitrarily cuts off at 4 years in advance. Calendar view doesn't have this restriction. Inconsistent data availability between views
13. **No print functionality on calendar** — Print Calendar button exists but produces a basic browser print. No PDF export or formatted print layout for posting on a notice board

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~270+*
