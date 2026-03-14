# Deep Dive: Announcements Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/announcements`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/announcements`
**Page title**: "Announcements"

### Page Layout
1. **Header**: Title "Announcements" + 2 action buttons
2. **Filter bar**: Search + building filter + Search/Clear/Print buttons
3. **Card grid**: 3-column layout of announcement cards (Semantic UI `ui centered three cards`)

### Action Buttons
| Button | Style | Action |
|--------|-------|--------|
| Manage Custom Groups | Outlined blue | Opens Custom Groups management modal |
| Create New Announcements | Outlined blue | Opens Create Announcement modal |

### Filter Bar
| Element | Type | Placeholder | Notes |
|---------|------|-------------|-------|
| Search | Text input | "Search" | Searches announcement titles/content |
| Select building | Dropdown (combobox) | "Select building" | Filter by building |
| Search | Button (outlined blue) | — | Execute search |
| Clear Search | Button (outlined blue) | — | Reset filters |
| Print | Button (outlined) | — | Print announcements list |

---

## 2. Announcement Cards

Each announcement displays as a Semantic UI `ui raised card` with dashed border.

### Card Content
| Element | Example | Notes |
|---------|---------|-------|
| Title | "Women's Steam room - Out of Service" | Bold heading |
| Building | "Bond" | Building name |
| Expiry | "Never Expiring" | Or expiry date |
| Author | "Posted By: Lasya" | Creator name |
| Post Date | "Posted On: 11-03-2026" | Calendar icon + date (in card footer) |

### Card Action Buttons (3 per card, at bottom)
| Button | Style | Opens | Purpose |
|--------|-------|-------|---------|
| Email Failures | `ui basic primary button` | Non-Delivered Mailing List modal | Shows failed email deliveries |
| Mailing List | `ui basic primary button` | Mailing List modal | Shows ALL recipients and delivery status |
| View | `ui basic primary button` | Announcement Details modal | Read-only view of the announcement |

**Note**: No Edit or Delete buttons visible on cards. Announcements appear to be immutable once posted.

---

## 3. Announcement Details Modal (View)

**Modal title**: "Announcement Details"
**Trigger**: Click "View" button on a card

### Content
| Element | Example | Notes |
|---------|---------|-------|
| Title | "Women's Steam room - Out of Service" | Bold heading |
| Expiry | "Never Expiring" | Top right |
| Author | "Posted By: Lasya" | Gray text below title |
| Body | Rich text content | Full announcement text |
| Posted On | 11-03-2026 | Calendar icon + date |
| Scheduled For Later | "No" | Person icon + text |
| Print | Button | Top right |

**Read-only** — no edit/delete functionality in this modal.

---

## 4. Create Announcement Modal

**Modal title**: "Create Announcement"
**Trigger**: Click "Create New Announcements" button

### Form Fields (top to bottom)

| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Emergency text | Checkbox | No | Unchecked | "Do you want to send an emergency announcement text?" — bypasses notification preferences, sends text to ALL residents with phone numbers |
| 2 | Title | Text input | Yes | "New Announcement" | Announcement title |
| 3 | Expiry Date | Date picker (with X clear) | No | 1 month ahead (e.g., 13-04-2026) | When the announcement expires |
| 4 | Never Expire | Checkbox | No | Unchecked | Overrides expiry date |
| 5 | No-reply email | Checkbox | No | Unchecked | "Do you want to send an email through no-reply account?" |
| 6 | Virtual concierge board | Checkbox | No | Unchecked | "Do you also want to post the announcement to virtual concierge board?" — Red warning: "Only select this if you have subscribed to our virtual concierge services" |
| 7 | Announcement Details | Rich text editor (WYSIWYG) | * (Required) | Empty | Full Froala-style editor (see Section 4.1) |
| 8 | Scheduled For Later? | Toggle switch | No | OFF | Enables delayed sending |
| 9 | Scheduled Time | (appears when #8 is ON) | Conditional | — | "Emails will be delivered on this date and time" |
| 10 | File attachments | Drag & drop zone | No | — | Max 4 files, total 5 MB limit. Multi-select with CTRL/CMD |
| 11 | Save it to library? | Toggle switch | No | OFF | Saves announcement to document Library |
| 12 | AGM Notice Opt-in | Toggle switch | No | OFF | "AGM Notice Opt-in notification setting only applies to tenants/owners. If you select any groups from below other than owners/tenants then the announcement will be delivered to all the people in those particular groups to whom AGM notice opt-in setting doesnt applies" |
| 13 | Send copy to self | Toggle switch | No | OFF | "Would you like to send a copy of this announcement as an email to yourself?" |
| 14 | Select who should receive it | Dropdown (combobox) | Yes | — | Recipient targeting (see Section 4.2) |
| 15 | Send | Button | — | — | Submits the announcement |

### 4.1 Rich Text Editor (WYSIWYG)

**Type**: Froala-style editor with 2 toolbar rows

**Toolbar Row 1**:
- Undo, Redo
- Bold (B), Italic (I), Underline (U), Strikethrough (S)
- Font Family (default: System Font)
- Font Size (default: 12pt)
- Paragraph format
- Align Left, Align Center, Align Right, Justify
- Increase Indent, Decrease Indent
- Ordered List, Unordered List (with sub-options)

**Toolbar Row 2**:
- Text Color, Background Color
- Font Formatting Clear
- Insert Special Character (Omega)
- Emoticons
- Find & Replace (eye icon)
- Insert File/Download
- Print
- Insert Image, Insert Video
- Insert Table
- Insert Link
- Bookmark/Flag
- Embed Code
- Show/Hide Formatting Marks
- Paragraph Direction (LTR/RTL)

**Footer**: Paragraph indicator ("P") + Word count ("0 WORDS") + Resize handle

**Paste warning** (red text): "If you are pasting content from an MS-word document then please use CTRL+V (ON WINDOWS) and CMD+V (ON MAC) to paste content with correct formatting"

### 4.2 Recipient Targeting Options (9 options)

| # | Option | Description |
|---|--------|-------------|
| 1 | All Residents (Including Offsite Owners) | Everyone in the building including absentee owners |
| 2 | All Residents (excluding offsite owners) | Only people physically living in the building |
| 3 | All owners (onsite and offsite) | All property owners regardless of residency |
| 4 | Custom Groups | Groups created via Manage Custom Groups |
| 5 | Tenants | Only tenants (renters, not owners) |
| 6 | Select from Groups | Choose from system-defined groups |
| 7 | Select individual Units | Target specific unit numbers |
| 8 | Groups Or Units (Inclusive) | "Both conditions DONT HAVE to be true" — sends to anyone in selected group OR selected units |
| 9 | Groups And Units (Exclusive) | "Both conditions HAVE to be true" — sends only to people in selected group AND selected units |

**Key insight**: Options 8 and 9 provide OR/AND boolean logic for complex targeting. This is a sophisticated feature allowing precise audience selection.

---

## 5. Mailing List Modal

**Modal title**: "Mailing List"
**Trigger**: Click "Mailing List" button on a card

Shows ALL recipients (successful deliveries) for an announcement.

### Table Columns
| Column | Example | Notes |
|--------|---------|-------|
| Sender | no-reply@iconcon... | From address (truncated) |
| Recipient Email | yue.zhuo@live... | Resident's email |
| Delivery Status | Delivered | Success status |
| Error | (blank for success) | Empty when delivered |
| Username | YueZhuo_2112 | System username |
| Unit #(If Resident) | 2112 | Unit number |
| Time Recorded | 11-03-2026 10:39 | Delivery timestamp |

---

## 6. Non-Delivered Mailing List Modal (Email Failures)

**Modal title**: "Non-Delivered Mailing List"
**Trigger**: Click "Email Failures" button on a card

Shows FAILED deliveries for an announcement.

### Table Columns
Same structure as Mailing List but with failure data:
| Column | Example | Notes |
|--------|---------|-------|
| Sender | no-reply@iconcon... | From address |
| Recipient Email | (blank) | Missing — that's often the error |
| Delivery Status | Not Delivered | Failure status |
| Error | blank email | Error reason |
| Username | Song_3007 | System username |
| Unit #(If Resident) | 3007 | Unit number |
| Time Recorded | 11-03-2026 10:38 | Timestamp |

**Key insight**: This is a proactive data quality feature. It identifies residents missing email addresses. Similar to BuildingLink's "missing email tracking" feature — Aquarius has this too! The error "blank email" clearly shows residents who haven't provided email addresses.

---

## 7. Manage Custom Groups Modal

**Modal title**: "Manage Custom Groups"
**Trigger**: Click "Manage Custom Groups" button on Announcements page

### Existing Groups Table
| Column | Notes |
|--------|-------|
| Group Name | Custom group name |
| Group Units | Units assigned to group |
| Edit | Edit icon/button |
| Delete | Delete icon/button |

*(Currently empty — no custom groups configured)*

### Add New Group Form
| Field | Type | Required | Placeholder | Notes |
|-------|------|----------|-------------|-------|
| Filter units by building | Dropdown | * | "Filter by Building" | "(By default units from all the accessible buildings will be available for selection)" |
| Select units | Dropdown (combobox) | * | "Select units" | Multi-select unit numbers |
| Group Name | Text input | * | "Group Name" | Name for the new group |
| Select Building | Dropdown | * | "Select building" | "(If you are selecting units from a single building then just select that building here. If you select units from different buildings for your group then the settings of your selected building will apply to the announcement you send in case of a conflict.)" |
| Save | Button | — | — | Creates the group |

---

## 8. Announcement Lifecycle

```
[Create] → Select recipients → [Send] → Announcement card appears
    ↓                                         ↓
(optional: Schedule)              [Email Failures] — track failed deliveries
    ↓                             [Mailing List] — track all deliveries
[Send at scheduled time]          [View] — read-only detail view
```

### Key behaviors:
- **No edit/delete after posting** — announcements appear immutable
- **Email-centric delivery** — primary distribution is via email (no SMS or push visible in delivery logs)
- **Emergency text override** — separate from normal delivery, uses phone numbers directly
- **Scheduling** — can defer sending to a future date/time
- **Library integration** — can save to Library module for archival
- **Expiry** — announcements can have an expiry date or be "Never Expiring"
- **Virtual concierge board** — optional cross-posting to a digital signage/board

---

## 9. Concierge Design Implications

### Strengths to Preserve
1. **Rich text editor** — Full WYSIWYG with image/video/table/link support. Professional-looking announcements
2. **Recipient targeting with boolean logic** — OR/AND targeting between groups and units is sophisticated
3. **Email delivery tracking** — Both success (Mailing List) and failure (Email Failures) per announcement
4. **Missing email detection** — "blank email" errors proactively identify data quality issues
5. **Emergency text override** — Bypasses notification preferences for critical announcements
6. **Scheduling** — Deferred sending for planned communications
7. **Library integration** — Cross-module connection (announcement → document library)
8. **Custom Groups** — Flexible audience segmentation by unit selection
9. **File attachments** — Up to 4 files, 5 MB total, drag-and-drop
10. **Expiry dates** — Auto-expire announcements with "Never Expire" option

### Gaps & Issues to Fix
1. **Email-only delivery** — No SMS or push notification delivery (only emergency text bypasses this). BuildingLink supports multi-channel
2. **No edit/delete** — Announcements appear immutable after posting. No way to correct typos or retract
3. **No announcement categories** — No way to categorize (maintenance, community, emergency, governance)
4. **No read receipts** — Delivery ≠ read. No tracking of who actually opened/read the announcement
5. **Card grid only** — No list/table view option for managing many announcements
6. **No pagination** — Only 3 announcements visible; if there are hundreds, no visible pagination
7. **No draft saving** — No visible "Save as Draft" option; it's create-and-send only
8. **No template system** — Every announcement starts from scratch. No reusable templates
9. **Button visibility issue** — Card action buttons (Email Failures, Mailing List, View) are below the fold, requiring scroll
10. **No resident portal view** — How residents see announcements in their portal isn't documented here (only staff view)
11. **Virtual concierge board** — Mentioned but no visibility into what this looks like or how it works
12. **No announcement pinning** — No way to pin important announcements to the top
13. **AGM opt-in complexity** — The AGM notice toggle explanation is confusing UX

### Comparison: Aquarius vs BuildingLink Announcements

| Feature | Aquarius | BuildingLink |
|---------|----------|-------------|
| Rich text editor | Yes (Froala) | Yes |
| Multi-channel delivery | Email only (+ emergency text) | Email + push + lobby screen |
| Recipient targeting | 9 options with OR/AND logic | Group-based |
| Delivery tracking | Yes (success + failure tables) | Unknown |
| Missing email detection | Yes ("blank email" errors) | Yes ("19 occupants missing email") |
| Scheduling | Yes | Unknown |
| File attachments | Yes (4 files, 5MB) | Unknown |
| Custom groups | Yes (unit-based) | Unknown |
| Announcement categories | No | No |
| Templates | No | No |
| Draft saving | No | Unknown |
| Edit after posting | No | Unknown |
| Virtual concierge board | Yes (cross-post option) | Lobby screen display |

---

## 10. Data Model (Deduced)

```
Announcement
├── id (integer, auto-generated)
├── building_id → Building
├── title (string, default: "New Announcement")
├── details (rich text — WYSIWYG Froala editor)
├── author → User (staff who posted)
├── posted_on (date)
├── expiry_date (date, nullable — default: 1 month from creation)
├── never_expire (boolean, default: false)
├── emergency_text (boolean, default: false — bypasses notification prefs)
├── no_reply_email (boolean, default: false)
├── virtual_concierge_board (boolean, default: false)
├── scheduled_for_later (boolean, default: false)
├── scheduled_time (datetime, nullable — when scheduled_for_later = true)
├── save_to_library (boolean, default: false)
├── agm_notice_opt_in (boolean, default: false)
├── send_copy_to_self (boolean, default: false)
├── recipient_targeting (enum: All Residents Including Offsite,
│   All Residents Excluding Offsite, All Owners, Custom Groups,
│   Tenants, Select from Groups, Select Individual Units,
│   Groups Or Units Inclusive, Groups And Units Exclusive)
├── targeted_units[] (integer — unit numbers, when applicable)
├── targeted_groups[] → CustomGroup (when applicable)
├── attachments[] (file, max 4 files, 5 MB total)
└── delivery_records[] → DeliveryRecord

DeliveryRecord
├── id (integer, auto-generated)
├── announcement_id → Announcement
├── sender (string, e.g., "no-reply@iconconnect.ca")
├── recipient_email (string, nullable — blank when missing)
├── delivery_status (enum: Delivered, Not Delivered)
├── error (string, nullable — e.g., "blank email")
├── username (string, e.g., "YueZhuo_2112")
├── unit_number (integer, nullable)
└── time_recorded (datetime)

CustomGroup
├── id (integer, auto-generated)
├── group_name (string)
├── building_id → Building
└── units[] (integer — unit numbers)
```

---

*Last updated: 2026-03-14*
*Total fields documented: ~30+*
*Dropdown options extracted: 1 (Recipient targeting: 9 options)*
