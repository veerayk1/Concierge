# Announcements

The Announcements section manages building-wide communications to residents via email and the portal.

**URL**: `/announcements`

---

## Page Header

- **Title**: "Announcements"
- **Manage Custom Groups** button — manage recipient groups
- **Create New Announcements** button — open the create announcement modal

## Search & Filters

| Filter | Type | Description |
|--------|------|-------------|
| Search | Text input | Search by announcement title/content |
| Select building | Dropdown | Filter by building |
| Search | Button | Execute search |
| Clear Search | Button | Reset filters |
| Print | Button | Print visible announcements |

---

## Announcement Cards

Displayed in a **3-column grid layout**. Each card contains:

| Element | Description |
|---------|-------------|
| Title | Announcement heading (e.g., "Women's Steam room - Out of Service") |
| Building | Which building it applies to (e.g., "Bond") |
| Expiry | "Never Expiring" or "Expiring On: DD-MM-YYYY HH:MM" |
| Posted By | Author name (e.g., "Lasya", "wayne") |
| Posted On | Date posted with calendar icon (e.g., "11-03-2026") |
| **Scheduled Badge** | Purple/green "Scheduled For Later" badge if scheduled |
| Scheduled Date | "Scheduled to be sent on: DD-MM-YYYY HH:MM" |
| Verification Note | For scheduled: "please verify that all attachments are working as expected..." |

### Card Action Buttons

Each card has three buttons:

| Button | Action |
|--------|--------|
| **Email Failures** | Opens "Non-Delivered Mailing List" modal showing failed email deliveries |
| **Mailing List** | Opens "Non-Delivered Mailing List" modal showing delivery status |
| **View** | Opens announcement detail/delivery status view |

---

## Non-Delivered Mailing List Modal

Opened by **Email Failures** or **Mailing List** buttons on each card.

| Column | Description |
|--------|-------------|
| Sender | Email sender address (e.g., no-reply@iconcon...) |
| Recipient Email | Target email address (blank if not on file) |
| Delivery Status | Status (e.g., "Not Delivered") |
| Error | Error reason (e.g., "blank email") |
| Username | Resident username (e.g., "Song_3007") |
| Unit #(If Resident) | Unit number of the resident |
| Time Recorded | Timestamp of the delivery attempt |

---

## Create Announcement Modal

Opened by **"Create New Announcements"** button.

**Title**: "Create Announcement"

### Basic Settings

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Emergency announcement text | No | Checkbox | "Do you want to send an emergency announcement text?" — Sends SMS to residents with phone numbers on file, regardless of text notification subscription |
| Title | Yes* | Text input | Announcement title (default: "New Announcement") |
| Expiry Date | No | Date picker | When announcement expires (default: 30 days from now) |
| Never Expire | No | Checkbox | If checked, announcement never expires |
| Send via no-reply | No | Checkbox | "Do you want to send an email through no-reply account?" |
| Virtual concierge board | No | Checkbox | "Do you also want to post the announcement to virtual concierge board?" — Red note: "Only select this if you have subscribed to our virtual concierge services" |

### Announcement Content

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Announcement Details | Yes* | Rich text editor | Full WYSIWYG editor with formatting |

**Rich Text Editor Toolbar Features:**
- Undo / Redo
- Bold, Italic, Underline, Strikethrough
- Font family selector (default: System Font)
- Font size selector (default: 12pt)
- Paragraph style dropdown
- Text alignment (left, center, right, justify)
- Indent / Outdent
- Ordered / Unordered lists
- Text color, highlight color
- Font effects (Aa)
- Special characters, emoji
- Insert image, insert video
- Insert link
- Print
- Word count display ("0 WORDS")

### Scheduling

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Scheduled For Later? | No | Toggle | Enable scheduled delivery |
| Scheduled Time | If scheduled | DateTime picker | "Emails will be delivered on this date and time" |

### Attachments

- **Max 4 files** can be attached (multi-select with CTRL/CMD)
- **Total file size must not exceed 5 MB** (info banner warning)
- Drag-and-drop upload area or click to select files

### Additional Options

| Field | Type | Description |
|-------|------|-------------|
| Save it to library? | Toggle | Save announcement to the document library |
| AGM Notice Opt-in | Toggle | "AGM Notice Opt-in notification setting only applies to tenants/owners. If you select any groups from below other than owners/tenants then the announcement will be delivered to all the people in those particular groups to whom AGM notice opt-in setting doesnt applies" |
| Send copy to yourself? | Toggle | "Would you like to send a copy of this announcement as an email to yourself?" |

### Recipient Targeting

**"Select who should receive it"** — Dropdown with options:

| Option | Description |
|--------|-------------|
| All Residents (Including Offsite Owners) | Send to every registered resident including offsite owners |
| All Residents (excluding offsite owners) | Send to onsite residents only |
| All owners (onsite and offsite) | Send to all owners regardless of residency |
| Custom Groups | Send to pre-defined custom groups |
| Tenants | Send to tenants only |
| Select from Groups | Choose specific role-based groups |
| Select individual Units | Pick specific units to receive the announcement |
| Groups Or Units (Inclusive) | "Both conditions DONT HAVE to be true i.e Email will be sent to a person who belongs to the selected group OR the selected unit" |

### Submit
- **Send** button — sends the announcement to selected recipients

---

## Manage Custom Groups Modal

Opened by **"Manage Custom Groups"** button.

### Existing Groups Table

| Column | Description |
|--------|-------------|
| Group Name | Name of the custom group |
| Group Units | Units included in the group |
| Edit | Edit group details |
| Delete | Remove the group |

### Add New Group Form

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Filter by Building | No | Dropdown | "By default units from all the accessible buildings will be available for selection" |
| Select units | Yes* | Multi-select dropdown | Choose units to include in the group |
| Group Name | Yes* | Text input | Name for the new group |
| Select Building | Yes* | Dropdown | "If you are selecting units from a single building then just select that building here. If you select units from different buildings for your group then the settings of your selected building will apply to the announcement you send in case of a conflict." |
| **Save** | — | Button | Create the new group |

---

## Features Summary

- Multi-building support with building filter
- Scheduled announcement delivery with date/time picker
- Emergency SMS text announcements (bypasses notification preferences)
- Expiry management (never expiring or date-based)
- Email delivery tracking (failures and mailing lists)
- Custom group management for targeted communications
- Rich text editor with full formatting, images, videos, links
- File attachments (up to 4 files, 5 MB total)
- Virtual concierge board integration
- AGM Notice opt-in compliance
- No-reply email option
- Self-copy option
- Print functionality
- Grid layout (3 cards per row)
