# Events

The Events section provides a calendar-based event management system for building activities and community events.

**URL**: `/events`

---

## Page Header

- **Title**: "Events" (with calendar icon)
- **+ Create Event** button — opens the Create Event modal

## Navigation Tabs

| Tab | Description |
|-----|-------------|
| **Current Events** | View upcoming and current events on calendar |
| **Manage Events** | Manage and edit existing events |

---

## Calendar View (Current Events Tab)

### Navigation Controls
- **Today** button — Jump to current date
- **Back** button — Navigate to previous period
- **Next** button — Navigate to next period
- **Current Period Display** — Shows month and year (e.g., "March 2026")

### View Modes

| Mode | Description |
|------|-------------|
| **Month** | Full month calendar grid view (default) |
| **Week** | Weekly view with hourly time slots |
| **Work Week** | Monday-Friday view with time slots |
| **Day** | Single day detailed view with time slots |
| **Agenda** | List-based agenda view of upcoming events |

### Calendar Grid
- Standard 7-column layout (Sun-Sat)
- Current date highlighted in blue
- Events displayed within calendar cells
- Click on dates to view/create events

---

## Create Event Modal

Opened by clicking **"+ Create Event"** button.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building for the event |
| Title | Yes* | Text input | Event title/name |
| Start Date & Time | Yes* | DateTime picker | Event start date and time |
| End Date & Time | Yes* | DateTime picker | Event end date and time |
| Send email notification | No | Checkbox | Send email notification to residents about the event |
| Guard required | No | Checkbox | Flag that security guard presence is required |
| Select Groups | No | Dropdown | Choose which resident groups should receive the event notification |
| Event Details | No | Textarea | Full description of the event |
| Attach a file | No | Drag-and-drop upload | File attachment (e.g., event flyer, agenda) |
| **Post** | — | Button | Submit and publish the event |

---

## Features Summary

- Multiple calendar view options (Month, Week, Work Week, Day, Agenda)
- Event creation with date/time range
- Email notification to residents
- Security guard requirement flagging
- Group-based event targeting
- File attachment support
- Navigation between time periods
- Current date highlighting
- Tab-based interface for viewing vs. managing events
- Building-specific event management
