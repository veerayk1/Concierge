# Deep Dive: Events Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/events`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/events`
**Page title**: "Events"
**Sidebar label**: "Events"

### Page Layout
1. **Header**: Title "Events" + 1 action button
2. **Tab navigation**: 2 tabs (Current Events, Manage Events)
3. **Calendar view**: Full calendar with multiple view modes

### Action Button
| Button | Style | Action |
|--------|-------|--------|
| + Create Event | Filled dark blue | Opens Create Event modal |

### Tabs
| Tab | Purpose | Content |
|-----|---------|---------|
| Current Events | View events on calendar | Calendar with events displayed |
| Manage Events | List/manage existing events | List view with management actions |

---

## 2. Current Events Tab (Calendar View)

### Calendar Navigation
| Element | Type | Purpose |
|---------|------|---------|
| Today | Button | Jump to current date |
| Back | Button | Go to previous period |
| Next | Button | Go to next period |
| Month title | Text | "March 2026" — current month/period |

### Calendar View Modes (5 modes)
| Mode | Description |
|------|-------------|
| Month | Full month grid (default) — Sun-Sat columns |
| Week | 7-day week view with time slots |
| Work Week | Mon-Fri only with time slots |
| Day | Single day with hourly time slots |
| Agenda | List view of upcoming events |

### Calendar Grid
- **Layout**: 7-column grid (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- **Today highlight**: Current date (14) highlighted in light blue
- **Next month dates**: Shown in lighter color (Apr 01-04 visible)
- **Empty state**: No events currently on calendar

---

## 3. Manage Events Tab

**Empty state**: "No events to show"

This tab provides a list/management view of all events. When events exist, it likely shows a table or card grid with edit/delete actions.

---

## 4. Create Event Modal

**Modal title**: "Create Event"
**Trigger**: Click "+ Create Event" button
**Style**: Full-width modal with X close button

### Form Fields (top to bottom)

| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Select Building | Dropdown (combobox) | Yes | — | "TSCC 2584 > Bond" |
| 2 | Title | Text input | No* | — | Event title |
| 3 | Event Start Date and Time | DateTime picker with X clear | No* | Today 00:26 | Format: DD-MM-YYYY HH:MM |
| 4 | Event End Date and Time | DateTime picker with X clear | No* | Today 10:26 | Format: DD-MM-YYYY HH:MM |
| 5 | Send Email Notification | Checkbox | — | Unchecked | "Send Email Notification to people who should see this event?" — has red asterisk |
| 6 | Guard Required? | Checkbox | — | Unchecked | Whether security guard is needed for the event — has red asterisk |
| 7 | Select groups that should see the event | Dropdown (multi-select) | Yes | — | See Section 4.1 |
| 8 | Event Details | Textarea | Yes | — | Placeholder: "Event Details" |
| 9 | Attach a file | Drag & drop zone | No | — | "Drag 'n' drop some files here, or click to select files" |
| 10 | Post | Button (outlined blue) | — | — | Creates the event |

### 4.1 Group Visibility Options (16 groups)
| # | Group | Description |
|---|-------|-------------|
| 1 | TSCC 2584 > admin | Admin staff |
| 2 | TSCC 2584 > Property Manager | Property management team |
| 3 | TSCC 2584 > Family member - Spouse | Spouse family members |
| 4 | TSCC 2584 > Family Member - Child | Child family members |
| 5 | TSCC 2584 > Other Occupant | Non-owner/tenant occupants |
| 6 | TSCC 2584 > Tenant | Renters |
| 7 | TSCC 2584 > Owner | Unit owners |
| 8 | TSCC 2584 > Family Member - Other | Other family members |
| 9 | TSCC 2584 > Offsite Owner | Absentee owners |
| 10 | TSCC 2584 > Other Group | Miscellaneous group |
| 11 | TSCC 2584 > Superintendent | Building superintendent |
| 12 | TSCC 2584 > Supervisor | Supervisory staff |
| 13 | TSCC 2584 > Security Head Office | Security management |
| 14 | TSCC 2584 > Board Member | Board of directors |
| 15 | TSCC 2584 > Security Guard | Security guards |
| 16 | TSCC 2584 > Family member - Spouse | (duplicate entry observed) |

**Key insight**: These 16 groups represent the **full user group taxonomy** in Aquarius. This is the same group system used across the platform for targeting announcements, managing permissions, etc. Groups include:
- **Staff roles**: admin, Property Manager, Superintendent, Supervisor, Security Head Office, Security Guard
- **Resident types**: Owner, Tenant, Offsite Owner, Other Occupant
- **Family members**: Spouse, Child, Other
- **Governance**: Board Member
- **Catch-all**: Other Group

---

## 5. Events Lifecycle

```
[Create Event] → Fill form → [Post] → Event appears on calendar
    ↓
[Current Events tab] — Calendar display (Month/Week/Day/Agenda)
    ↓
[Manage Events tab] — Edit/Delete events
    ↓
[Optional: Email notification] → Sent to selected groups
[Optional: Guard required] → Security team alerted
```

### Key behaviors:
- **Calendar-centric** — Events are primarily viewed on a calendar
- **Multi-view calendar** — 5 view modes (Month, Week, Work Week, Day, Agenda)
- **Group-based visibility** — Events are shown only to selected groups
- **Email notifications** — Optional email blast to event audience
- **Guard requirement** — Flag if security is needed (unique to condo environments)
- **File attachments** — Drag-and-drop file uploads
- **Date/time pickers** — Both start and end datetime with clear buttons
- **Plain textarea** — No rich text editor for event details (unlike Announcements)

---

## 6. Concierge Design Implications

### Strengths to Preserve
1. **Calendar view with 5 modes** — Month/Week/Work Week/Day/Agenda covers all use cases
2. **Guard Required flag** — Unique to condo environments, great for security planning
3. **Group-based targeting** — Events visible only to relevant groups
4. **Email notification option** — Proactive communication about events
5. **File attachments** — Attach event posters, flyers, agendas
6. **Date/time range** — Clear start and end datetime

### Gaps & Issues to Fix
1. **No recurring events** — Can't set up weekly/monthly recurring events
2. **No RSVP/attendance** — No way for residents to confirm attendance
3. **No capacity limits** — No maximum attendees setting
4. **No event categories** — No way to categorize (social, maintenance, governance, etc.)
5. **No event location** — No field for where the event is held
6. **No reminders** — No pre-event reminder notifications
7. **Plain textarea** — No rich text formatting for event descriptions
8. **No event images** — No dedicated image/banner upload (only generic file attach)
9. **No calendar integration** — No .ics export or Google/Outlook calendar sync
10. **No cost/fee field** — No way to indicate if the event has a cost
11. **No event registration** — No sign-up form capability
12. **Manage Events tab sparse** — Just "No events to show" with no management UI visible

### Comparison: Aquarius Events vs BuildingLink Events

| Feature | Aquarius | BuildingLink |
|---------|----------|-------------|
| Calendar view | Yes (5 modes) | Unknown |
| Recurring events | No | Unknown |
| RSVP/attendance | No | Unknown |
| Group targeting | Yes (16 groups) | Unknown |
| Email notification | Yes (checkbox) | Unknown |
| Guard required | Yes (unique) | Unknown |
| File attachments | Yes (drag-and-drop) | Unknown |
| Event categories | No | Unknown |
| Event location | No | Unknown |
| Rich text | No (plain textarea) | Unknown |
| Calendar sync (.ics) | No | Unknown |
| Capacity limits | No | Unknown |

---

## 7. Data Model (Deduced)

```
Event
├── id (auto-generated)
├── title (string)
├── event_details (text, required)
├── building_id → Building
├── start_datetime (datetime, format: DD-MM-YYYY HH:MM)
├── end_datetime (datetime, format: DD-MM-YYYY HH:MM)
├── send_email_notification (boolean)
├── guard_required (boolean)
├── target_groups[] → Group (multi-select, required)
├── attachments[] → File (drag-and-drop)
├── created_by → User
├── created_at (datetime)
└── updated_at (datetime)
```

---

*Last updated: 2026-03-14*
*Total fields documented: ~15*
*Dropdown options extracted: 2 (Building: 1 option, Groups: 16 options)*
