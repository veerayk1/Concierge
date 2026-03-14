# 09 -- Communication

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

The Communication module is how a building talks to its people. It handles everything from routine announcements ("elevator maintenance tomorrow") to life-safety emergency broadcasts ("evacuate the building now"). The module unifies announcements, multi-channel notifications, emergency broadcast, notification preferences, and read receipts into a single system that reaches every resident through their preferred channel.

### Why This Module Exists

Buildings fail at communication. Industry research revealed three consistent problems:

1. **Single-channel dependence** -- Most platforms rely on email only. Residents who do not check email miss critical updates.
2. **No engagement tracking** -- Buildings send announcements into the void with no way to know who read them.
3. **Emergency communication gaps** -- When a pipe bursts at 2 AM, there is no reliable way to reach every affected resident within minutes.

Concierge solves all three by supporting four delivery channels from day one (email, SMS, push notification, voice call), tracking read receipts per message, and providing an emergency broadcast cascade that escalates automatically until the message is acknowledged.

### Module Scope

| Area | What It Covers |
|------|---------------|
| **Announcements** | Create, schedule, distribute, archive, and pin building-wide or targeted announcements |
| **Multi-channel delivery** | Email, SMS, push notification, and voice call for every message type |
| **Emergency broadcast** | Cascade system: push then SMS then voice, with acknowledgment tracking |
| **Templates** | Reusable announcement and emergency templates with variable substitution |
| **Audience targeting** | All residents, specific buildings, floors, units, roles, or custom groups |
| **Rich text editor** | Full formatting with image and video embedding, file attachments |
| **Read receipts** | Per-resident delivery and read tracking across all channels |
| **Announcement archive** | Searchable history of all past announcements with engagement metrics |
| **Pinned announcements** | Sticky announcements that stay at the top of the resident portal |
| **Notification preferences** | Per-resident, per-module channel and frequency settings |
| **Email digests** | Daily or weekly rollup of non-urgent notifications |
| **Do-not-disturb** | Resident-defined quiet hours that suppress non-emergency notifications |

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Four channels at launch (email, SMS, push, voice) | Industry research showed that email-only platforms have 40-60% reach. Multi-channel closes that gap. |
| Emergency broadcasts bypass all preferences | Safety overrides convenience. A fire alarm notification must reach everyone regardless of DND or opt-out settings. |
| Read receipts are opt-in for residents | Privacy-respecting design. Building staff see aggregate engagement (70% read) but individual read tracking requires resident consent. |
| Templates use variable substitution, not merge fields | Simpler mental model. `{{building_name}}` is easier to understand than complex merge logic. |
| Announcements support draft state | Concierge staff can draft announcements for manager approval before distribution. This was missing in competitive platforms where security roles had zero authoring ability. |

---

## 2. Research Summary

Industry research across three competing platforms revealed the following patterns that shaped the Communication module:

### What Works (Adopted)

| Pattern | Source | How Concierge Adapts It |
|---------|--------|------------------------|
| Multi-channel distribution (web portal, mobile app, lobby screen) | Competitive analysis | Extended to 4 channels: email, SMS, push, voice. Added lobby display as a 5th output channel for v2. |
| Emergency SMS that bypasses notification preferences | Competitive analysis | Adopted and extended: emergency cascade goes push then SMS then voice with acknowledgment tracking. |
| Announcement expiry dates | Competitive analysis | Adopted. Every announcement requires an expiry date or explicit "never expire" selection. |
| Template-based announcement creation | Competitive analysis | Adopted. Template library with variable substitution and AI-assisted generation. |
| Scheduled delivery with date/time picker | Competitive analysis | Adopted. Added AI-powered optimal send time suggestion. |
| Custom recipient groups for targeted communication | Competitive analysis | Adopted and enhanced. Groups by building, floor, unit, role, or custom-defined segments. |
| Email delivery failure tracking | Competitive analysis | Adopted. Extended to all channels with per-channel delivery status. |
| Rich text editor with images, video, and file attachments | Competitive analysis | Adopted. Max 10 files, 25 MB total. Drag-and-drop upload. |

### What Fails (Avoided)

| Anti-Pattern | Problem | Concierge Solution |
|-------------|---------|-------------------|
| Email-only notifications | 40-60% of residents miss messages | Multi-channel delivery from day one |
| Read-only access for concierge/security roles | Staff who interact with residents daily cannot draft announcements | Draft-and-submit workflow: concierge drafts, manager approves |
| No read receipts or engagement tracking | Buildings have no idea if announcements are working | Aggregate engagement metrics on every announcement. Individual tracking with resident consent. |
| Announcements without categories or tags | Cannot filter or search past announcements effectively | Category system with tags for searchable archive |
| HTML stripped from previews causing text to run together | Unreadable previews on listing pages | Clean plaintext extraction with proper spacing |
| Single announcement type (no draft state) | No approval workflow possible | Draft, scheduled, published, expired lifecycle |
| No notification channel indicators on sent announcements | Cannot tell how a message was distributed | Channel badges showing which channels were used and delivery status per channel |
| Empty history/audit trail for non-admin roles | No transparency for staff about announcement lifecycle | Visible audit trail for all roles (who created, approved, sent, and when) |

### Gap Analysis

| Feature | Industry Status | Concierge Advantage |
|---------|----------------|-------------------|
| AI-assisted announcement drafting | Not found in any platform | Generate professional announcements from bullet points |
| Auto-translation for multilingual buildings | Not found in any platform | One-click translation to building's configured languages |
| Engagement prediction before sending | Not found in any platform | AI predicts open rate and suggests improvements |
| Emergency voice call cascade | Found in 1 of 3 platforms (premium) | Included in base product with acknowledgment tracking |
| Do-not-disturb hours | Not found in any platform | Resident-defined quiet hours with emergency override |
| Email digest option | Not found in any platform | Daily or weekly rollup reduces notification fatigue |

---

## 3. Feature Spec

### 3.1 Announcement Creation

#### 3.1.1 Create Announcement Form

| Field | Type | Required | Max Length | Default | Validation | Error Message |
|-------|------|----------|-----------|---------|-----------|---------------|
| Title | Text input | Yes | 200 chars | Empty | Min 3 chars, no special characters except `-`, `:`, `!`, `?` | "Title must be between 3 and 200 characters." |
| Category | Dropdown (single-select) | Yes | N/A | "General" | Must select from configured list | "Please select an announcement category." |
| Tags | Tag input (multi-select) | No | 50 chars per tag, max 10 tags | Empty | Alphanumeric and hyphens only | "Tags can only contain letters, numbers, and hyphens." |
| Body | Rich text editor | Yes | 10,000 chars | Empty | Min 10 chars | "Announcement body must be at least 10 characters." |
| Priority | Radio group | Yes | N/A | "Normal" | One of: Low, Normal, High, Urgent | N/A (always has a selection) |
| Audience | Audience selector (see 3.1.3) | Yes | N/A | "All Residents" | At least one audience segment selected | "Please select at least one audience." |
| Channels | Checkbox group | Yes | N/A | Email checked, Push checked | At least one channel selected | "Please select at least one delivery channel." |
| Expiry Date | Date picker | Conditional | N/A | 30 days from now | Must be in the future. Required unless "Never Expire" is checked. | "Expiry date must be in the future." |
| Never Expire | Checkbox | No | N/A | Unchecked | When checked, hides Expiry Date field | N/A |
| Attachments | File upload (drag-and-drop) | No | 10 files, 25 MB total | Empty | Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, HEIC, MP4. Max 10 MB per file. | "File exceeds 10 MB limit." / "Total attachments exceed 25 MB." / "File type not supported." |
| Pin to Top | Toggle | No | N/A | Off | Only Property Admin+ can enable | "You do not have permission to pin announcements." |
| Schedule for Later | Toggle | No | N/A | Off | When enabled, shows Schedule Date/Time | N/A |
| Schedule Date | Date picker | Conditional | N/A | Empty | Required if "Schedule for Later" is on. Must be at least 15 minutes in the future. | "Scheduled time must be at least 15 minutes from now." |
| Schedule Time | Time picker | Conditional | N/A | Empty | Required if "Schedule for Later" is on. | "Please select a scheduled time." |
| Send Copy to Self | Checkbox | No | N/A | Unchecked | N/A | N/A |
| Save to Library | Toggle | No | N/A | Off | N/A | N/A |
| Reply-To Setting | Radio group | No | N/A | "Management Office" | One of: None (no-reply address), Management Office (property's default email), Custom Email (text input appears, must be valid email) | "Please enter a valid email address." |

**Tooltip -- Priority levels**:
- **Low**: Informational. Delivered on next digest cycle if recipient uses digests.
- **Normal**: Standard delivery. Sent immediately through selected channels.
- **High**: Prominent visual treatment. Bypasses digest grouping.
- **Urgent**: Sent immediately on all selected channels. Appears with alert styling in resident portal.

#### 3.1.2 Rich Text Editor Toolbar

| Tool | Icon | Behavior |
|------|------|----------|
| Bold | **B** | Toggle bold on selected text |
| Italic | *I* | Toggle italic on selected text |
| Underline | U | Toggle underline on selected text |
| Strikethrough | ~~S~~ | Toggle strikethrough on selected text |
| Heading | H1/H2/H3 dropdown | Apply heading level to current block |
| Font Size | Size dropdown | 10, 12, 14, 16, 18, 20, 24, 28, 32 pt |
| Text Color | Color picker | Apply text color |
| Highlight | Highlight picker | Apply background highlight color |
| Align Left | Left icon | Left-align current block |
| Align Center | Center icon | Center-align current block |
| Align Right | Right icon | Right-align current block |
| Ordered List | 1. icon | Create or toggle numbered list |
| Unordered List | Bullet icon | Create or toggle bullet list |
| Indent | Right arrow | Increase indent level |
| Outdent | Left arrow | Decrease indent level |
| Insert Link | Link icon | Modal: URL (required), Display text (optional), Open in new tab (checkbox, default checked) |
| Insert Image | Image icon | Upload or paste URL. Max 5 MB. Supported: JPG, PNG, GIF, WebP. |
| Insert Video | Video icon | Paste YouTube or Vimeo URL. Embeds as responsive iframe. |
| Emoji | Smiley icon | Emoji picker panel |
| Undo | Undo arrow | Undo last action. Keyboard shortcut: Cmd/Ctrl+Z |
| Redo | Redo arrow | Redo last undone action. Keyboard shortcut: Cmd/Ctrl+Shift+Z |
| Word Count | "0 words" | Live word count display (read-only) |

#### 3.1.3 Audience Selector

The audience selector determines who receives the announcement. Multiple options can be combined.

| Option | Description | Selection UI |
|--------|-------------|-------------|
| All Residents | Every active resident including offsite owners | Single checkbox |
| All Residents (Excluding Offsite Owners) | Onsite residents only | Single checkbox |
| All Owners (Onsite and Offsite) | All owner-type accounts | Single checkbox |
| Tenants Only | All tenant-type accounts | Single checkbox |
| By Building | Specific building(s) in multi-building properties | Multi-select dropdown |
| By Floor | Specific floor(s) within selected building(s) | Multi-select dropdown (depends on building selection) |
| By Unit | Specific unit(s) | Searchable multi-select with typeahead |
| By Role | Staff roles (Security, Concierge, Maintenance, etc.) | Checkbox list |
| Custom Group | Predefined recipient groups | Multi-select dropdown |

**Targeting logic**: Options combine with OR logic. A recipient matching any selected criteria receives the announcement. Example: selecting "Floor 12" and "Custom Group: Board Members" sends to everyone on floor 12 plus all board members, even if they live on other floors.

**Recipient count preview**: As the audience is configured, a live count shows: "This announcement will reach approximately **147 residents** across **4 channels**."

#### 3.1.4 Form Buttons

| Button | Label | Role Required | Action | Loading State | Success State | Failure State |
|--------|-------|--------------|--------|--------------|--------------|--------------|
| Save as Draft | "Save Draft" | Front Desk+ | Saves announcement without sending. No notifications triggered. | Button disabled, spinner, label changes to "Saving..." | Toast: "Draft saved successfully." Redirect to announcement list. | Toast: "Failed to save draft. Please try again." Button re-enabled. |
| Send Now | "Send Announcement" | Property Manager+ | Validates form, confirms channel selection, sends immediately. | Button disabled, spinner, label changes to "Sending..." | Toast: "Announcement sent to 147 residents." Redirect to announcement detail with delivery tracker. | Toast: "Failed to send announcement. Error: {reason}." Button re-enabled. |
| Schedule | "Schedule" | Property Manager+ | Validates form, saves with scheduled date/time. | Button disabled, spinner, label changes to "Scheduling..." | Toast: "Announcement scheduled for {date} at {time}." Redirect to announcement list. | Toast: "Failed to schedule. Please try again." Button re-enabled. |
| Preview | "Preview" | Front Desk+ | Opens preview modal showing how the announcement will appear in email, push notification, and resident portal. | Modal opens with loading skeleton | Rendered preview across channels | Toast: "Preview failed to load." |
| Cancel | "Cancel" | Any | Discards unsaved changes. If form has been modified, shows confirmation dialog: "Discard unsaved changes?" | N/A | Redirect to announcement list | N/A |

**Send Now confirmation dialog**: Before sending, a modal appears:

> **Ready to send?**
>
> This announcement will be delivered to **147 residents** via:
> - Email (142 recipients with email on file)
> - Push notification (98 recipients with the app installed)
>
> 5 residents have no email address on file and will not receive email delivery.
>
> [Cancel] [Send Now]

#### 3.1.5 Draft-and-Approve Workflow

Roles below Property Manager (Front Desk, Security) can create announcement drafts but cannot send. The workflow:

1. Staff member creates announcement and clicks "Save Draft."
2. Draft appears in the announcement list with a "Draft" badge.
3. Property Manager or Admin sees pending drafts in their dashboard widget: "3 announcement drafts awaiting review."
4. Manager opens the draft, edits if needed, and clicks "Approve & Send" or "Reject."
5. On approval: announcement is sent. Original author receives a notification: "Your announcement '{title}' has been approved and sent."
6. On rejection: draft is marked "Rejected" with a reason. Author receives: "Your announcement '{title}' was not approved. Reason: {reason}."

### 3.2 Announcement List Page

#### 3.2.1 Filter Bar

| Filter | Type | Default | Options |
|--------|------|---------|---------|
| Search | Text input with search icon | Empty | Free-text search across title, body, author, tags. Placeholder: "Search announcements..." |
| Status | Dropdown | "Current" | Current, Scheduled, Draft, Expired, Rejected, All |
| Category | Dropdown | "All Categories" | All Categories + configured category list |
| Priority | Dropdown | "All Priorities" | All Priorities, Low, Normal, High, Urgent |
| Date Range | Date range picker | Last 30 days | Custom date range with presets: Today, Last 7 days, Last 30 days, Last 90 days, This year, All time |
| Building | Dropdown | "All Buildings" | All Buildings + building list (multi-building properties only) |
| Channel | Dropdown | "All Channels" | All Channels, Email, SMS, Push, Voice |

| Button | Label | Action |
|--------|-------|--------|
| Search | "Search" (primary) | Apply all filters |
| Reset | "Reset" (text link) | Clear all filters, restore defaults |
| Export | "Export" (secondary) | Export filtered list as CSV or PDF |

#### 3.2.2 Announcement Cards

Announcements display in a responsive card grid: 3 columns on desktop, 2 on tablet, 1 on mobile.

| Card Element | Description |
|-------------|-------------|
| **Title** | Announcement title. Clickable link to detail page. Truncated at 80 chars with ellipsis. |
| **Body Preview** | First 120 characters of plaintext body. HTML stripped with proper word boundaries. |
| **Category Badge** | Color-coded category badge (e.g., "Maintenance" in orange, "Safety" in red, "General" in blue). |
| **Priority Indicator** | Colored left border: gray (Low), blue (Normal), orange (High), red (Urgent). |
| **Status Badge** | Current (green), Scheduled (purple), Draft (gray), Expired (muted), Rejected (red). |
| **Pin Icon** | Thumbtack icon if pinned. Pinned announcements sort to top. |
| **Author** | "Posted by {name}" with avatar thumbnail. |
| **Date** | "Posted on {date}" or "Scheduled for {date}" or "Expires {date}". Relative time for recent ("2 hours ago"). |
| **Channel Icons** | Small icons showing which channels were used: envelope (email), phone (SMS), bell (push), speaker (voice). |
| **Engagement Summary** | "Read by 73%" progress bar (visible to Property Manager+ only). |

#### 3.2.3 Card Action Buttons

Each card has a three-dot overflow menu with the following actions:

| Action | Label | Role Required | Behavior |
|--------|-------|--------------|----------|
| View | "View Details" | All staff | Navigate to announcement detail page |
| Edit | "Edit" | Author or Property Manager+ | Open edit form (only for Draft or Scheduled status) |
| Duplicate | "Duplicate" | Front Desk+ | Create a new draft pre-filled with this announcement's content |
| Pin/Unpin | "Pin to Top" / "Unpin" | Property Manager+ | Toggle pinned state |
| Delivery Report | "Delivery Report" | Property Manager+ | Open delivery status modal |
| Delete | "Delete" | Property Admin+ | Confirmation dialog: "Delete this announcement? This cannot be undone." |

#### 3.2.4 Empty State

When no announcements match the current filters:

> **No announcements found**
>
> {Contextual message based on active filters}
>
> [Create Announcement] (primary button, if role permits)

Contextual messages:
- No filters active: "Your building has no announcements yet. Create your first announcement to keep residents informed."
- With filters: "No announcements match your current filters. Try adjusting your search or filters."
- Drafts tab: "No drafts pending. Announcements drafted by staff will appear here for your review."

### 3.3 Announcement Detail Page

#### 3.3.1 Header Section

| Element | Description |
|---------|-------------|
| Title | Full announcement title |
| Category badge | Color-coded category |
| Priority badge | Priority level with color |
| Status badge | Current status |
| Posted by | Author name with avatar, role, and timestamp |
| Expires | Expiry date or "Never expires" |
| Channel badges | Which channels were used for delivery |

#### 3.3.2 Body Section

Full rendered announcement body with all formatting, embedded images, and videos. File attachments appear below the body as downloadable cards showing filename, file type icon, and file size.

#### 3.3.3 Engagement Panel (Property Manager+ Only)

| Metric | Display |
|--------|---------|
| Total Recipients | Count of unique recipients across all channels |
| Delivery Rate | Percentage successfully delivered (with breakdown per channel) |
| Read Rate | Percentage who opened/read (with breakdown per channel) |
| Delivery Failures | Count with expandable failure list |
| Timeline | Chronological delivery and read events |

**Delivery failure table**:

| Column | Description |
|--------|-------------|
| Recipient | Resident name and unit number |
| Channel | Which channel failed (email, SMS, push, voice) |
| Sender Address | The "from" address used for this delivery attempt (e.g., "noreply@building.com", "office@building.com"). Useful when multiple sending addresses are configured. |
| Error | Error reason (e.g., "Invalid email address", "SMS undeliverable", "Push token expired") |
| Timestamp | When the delivery attempt occurred |
| Retry | "Retry" button to re-attempt delivery on this channel |

#### 3.3.4 Audit Trail

| Column | Description |
|--------|-------------|
| Date/Time | Timestamp of the action |
| Who | User name and role |
| Action | Created, Edited, Approved, Rejected, Sent, Pinned, Unpinned, Expired, Deleted |
| Details | Change description (e.g., "Changed title from 'X' to 'Y'") |

#### 3.3.5 Detail Page Buttons

| Button | Label | Role Required | Action |
|--------|-------|--------------|--------|
| Edit | "Edit" | Author or Property Manager+ | Open edit form (Draft/Scheduled only) |
| Resend | "Resend" | Property Manager+ | Resend to all recipients or only those who have not read it |
| Duplicate | "Duplicate" | Front Desk+ | Create new draft from this announcement |
| Delete | "Delete" | Property Admin+ | Confirmation dialog with permanent delete |
| Back | "Back to Announcements" | All | Return to announcement list |

### 3.4 Emergency Broadcast

Emergency broadcasts are a separate, elevated workflow designed for life-safety situations. They bypass all notification preferences, do-not-disturb hours, and digest settings.

#### 3.4.1 Emergency Broadcast Form

| Field | Type | Required | Max Length | Default | Validation | Error Message |
|-------|------|----------|-----------|---------|-----------|---------------|
| Emergency Type | Dropdown | Yes | N/A | Empty | Must select one | "Please select an emergency type." |
| Title | Text input | Yes | 100 chars | Auto-filled from template based on type | Min 3 chars | "Title is required." |
| Message | Textarea | Yes | 500 chars | Auto-filled from template | Min 10 chars | "Emergency message must be at least 10 characters." |
| Affected Area | Multi-select | No | N/A | "Entire Building" | N/A | N/A |
| Require Acknowledgment | Toggle | No | N/A | On | N/A | N/A |

**Emergency types** (configurable by Property Admin):

| Type | Default Template | Default Cascade |
|------|-----------------|----------------|
| Fire | "Fire alarm activated in {building_name}. {message}. Follow evacuation procedures." | Push > SMS > Voice |
| Flood / Water Leak | "Water emergency in {building_name}. {message}." | Push > SMS |
| Power Outage | "Power outage affecting {building_name}. {message}." | Push > SMS |
| Gas Leak | "Gas leak reported in {building_name}. {message}. Evacuate immediately." | Push > SMS > Voice |
| Security Threat | "Security alert for {building_name}. {message}. Shelter in place." | Push > SMS > Voice |
| Elevator Entrapment | "Elevator entrapment reported in {building_name}. {message}." | Push > SMS |
| Medical Emergency | "Medical emergency in {building_name}. {message}." | Push only |
| General Emergency | "{message}" | Push > SMS |

#### 3.4.2 Cascade Logic

The emergency cascade sends through multiple channels in sequence, waiting for acknowledgment between each step:

```
Step 1: Push notification sent to all recipients
  Wait 3 minutes for acknowledgment

Step 2: SMS sent to recipients who have NOT acknowledged
  Wait 5 minutes for acknowledgment

Step 3: Voice call placed to recipients who have NOT acknowledged
  Voice message plays the emergency message text (text-to-speech)
  Recipient presses 1 to acknowledge
```

**Cascade timing** is configurable by Property Admin. Defaults: 3 minutes between push and SMS, 5 minutes between SMS and voice.

**Acknowledgment**: Residents acknowledge by:
- Push: Tapping "I understand" button on notification
- SMS: Replying "OK" or "1"
- Voice: Pressing 1 on their phone keypad

#### 3.4.3 Emergency Broadcast Buttons

| Button | Label | Role Required | Action | Loading State | Success State | Failure State |
|--------|-------|--------------|--------|--------------|--------------|--------------|
| Send Emergency Broadcast | "SEND EMERGENCY BROADCAST" (red, full-width) | Property Manager+ | Confirmation dialog, then immediate cascade | "Broadcasting..." with live recipient counter | "Emergency broadcast sent to {count} residents. Tracking acknowledgments." | "Broadcast failed: {reason}. Retry immediately." |
| Cancel | "Cancel" | Any | Return to previous page | N/A | N/A | N/A |

**Confirmation dialog** (extra prominent for safety):

> **Confirm Emergency Broadcast**
>
> You are about to send an emergency broadcast to **{count} residents** via push notification, SMS, and voice call.
>
> This will override all notification preferences and do-not-disturb settings.
>
> Type "SEND" to confirm: [____________]
>
> [Cancel] [Confirm]

The user must type the word "SEND" to enable the Confirm button. This prevents accidental broadcasts.

#### 3.4.4 Emergency Dashboard

After sending, the emergency dashboard shows real-time tracking:

| Metric | Display |
|--------|---------|
| Total Recipients | Count |
| Acknowledged | Count + percentage + progress bar |
| Pending (Push sent) | Count |
| Pending (SMS sent) | Count |
| Pending (Voice sent) | Count |
| Not Reached | Count (delivery failures across all channels) |
| Time Since Broadcast | Live timer |

Each recipient row shows: Name, Unit, Channel reached, Acknowledged (Yes/No + timestamp).

### 3.5 Announcement Templates

#### 3.5.1 Template Library

Pre-built and custom templates for common announcement scenarios.

| Field | Type | Required | Max Length | Default | Validation | Error Message |
|-------|------|----------|-----------|---------|-----------|---------------|
| Template Name | Text input | Yes | 100 chars | Empty | Unique per property, min 3 chars | "Template name must be unique and at least 3 characters." |
| Category | Dropdown | Yes | N/A | "General" | Must select one | "Please select a category." |
| Subject Template | Text input | Yes | 200 chars | Empty | Supports `{{variables}}` | "Subject is required." |
| Body Template | Rich text editor | Yes | 10,000 chars | Empty | Min 10 chars. Supports `{{variables}}` | "Body must be at least 10 characters." |
| Available Variables | Read-only display | N/A | N/A | N/A | N/A | N/A |
| Default Channels | Checkbox group | No | N/A | Email + Push | N/A | N/A |
| Default Priority | Radio group | No | N/A | Normal | N/A | N/A |
| Default Audience | Audience selector | No | N/A | All Residents | N/A | N/A |

**System variables** available in templates:

| Variable | Resolves To | Example |
|----------|-----------|---------|
| `{{building_name}}` | Property name | "Maple Heights" |
| `{{building_address}}` | Property address | "123 Maple St, Toronto" |
| `{{current_date}}` | Today's date | "March 14, 2026" |
| `{{sender_name}}` | Author's display name | "Sarah Johnson" |
| `{{sender_title}}` | Author's role/title | "Property Manager" |
| `{{management_company}}` | Management company name | "Apex Property Management" |
| `{{management_phone}}` | Management phone number | "(416) 555-0123" |
| `{{management_email}}` | Management email | "info@apexproperty.com" |

#### 3.5.2 Template Buttons

| Button | Label | Role Required | Action | Loading State | Success State | Failure State |
|--------|-------|--------------|--------|--------------|--------------|--------------|
| Save Template | "Save Template" | Property Manager+ | Save new or update existing template | "Saving..." | Toast: "Template saved." | Toast: "Failed to save template." |
| Use Template | "Use This Template" | Front Desk+ | Open Create Announcement form pre-filled with template content | Redirect with pre-fill | Form opens with template applied | Toast: "Failed to load template." |
| Delete Template | "Delete" | Property Admin+ | Confirmation: "Delete this template? This cannot be undone." | "Deleting..." | Toast: "Template deleted." | Toast: "Failed to delete template." |

### 3.6 Custom Recipient Groups

#### 3.6.1 Group Management

| Field | Type | Required | Max Length | Default | Validation | Error Message |
|-------|------|----------|-----------|---------|-----------|---------------|
| Group Name | Text input | Yes | 100 chars | Empty | Unique per property, min 2 chars | "Group name must be unique." |
| Description | Text input | No | 200 chars | Empty | N/A | N/A |
| Filter by Building | Dropdown | No | N/A | "All Buildings" | N/A | N/A |
| Select Units | Searchable multi-select | Yes | N/A | Empty | At least 1 unit | "Please select at least one unit." |

#### 3.6.2 Group List Table

| Column | Description |
|--------|-------------|
| Group Name | Name (clickable to edit) |
| Members | Count of current members |
| Created By | Author name |
| Created On | Creation date |
| Last Used | Date group was last used in an announcement |
| Actions | Edit, Delete |

### 3.7 Notification Preferences (Resident-Facing)

Each resident configures their notification preferences on a per-module, per-channel basis.

#### 3.7.1 Preference Matrix

| Module | Email | SMS | Push | Notes |
|--------|:-----:|:---:|:----:|-------|
| Announcements (General) | Default On | Default Off | Default On | Cannot opt out of emergency broadcasts |
| Announcements (Urgent) | Default On | Default On | Default On | Cannot opt out |
| Package Arrivals | Default On | Default Off | Default On | |
| Package Reminders | Default On | Default Off | Default Off | |
| Maintenance Updates | Default On | Default Off | Default On | |
| Amenity Confirmations | Default On | Default Off | Default On | |
| Amenity Reminders | Default Off | Default Off | Default On | |
| Community Events | Default On | Default Off | Default Off | |
| Security Alerts | Default On | Default On | Default On | Cannot opt out |
| Parking Violations | Default On | Default Off | Default On | |

**Tooltip -- Cannot opt out**: "Emergency broadcasts and security alerts are critical safety communications that cannot be disabled. These are only sent in genuine emergency situations."

#### 3.7.2 Email Digest Settings

| Field | Type | Required | Default | Options |
|-------|------|----------|---------|---------|
| Digest Mode | Radio group | Yes | "Instant" | Instant (send each notification individually), Daily Digest (one email per day at chosen time), Weekly Digest (one email per week on chosen day) |
| Digest Time | Time picker | Conditional | 8:00 AM | Required if Daily Digest selected. Hour selection (6 AM - 10 PM). |
| Digest Day | Dropdown | Conditional | Monday | Required if Weekly Digest selected. Day of week. |

**Tooltip -- Digest mode**: "Digest mode bundles your non-urgent notifications into a single email. Urgent and emergency messages are always delivered immediately, regardless of this setting."

**Excluded from digests** (always sent immediately):
- Emergency broadcasts
- Security alerts
- Urgent-priority announcements
- Package arrival notifications (configurable -- resident can include in digest)

#### 3.7.3 Do-Not-Disturb Settings

| Field | Type | Required | Default | Validation | Error Message |
|-------|------|----------|---------|-----------|---------------|
| Enable DND | Toggle | No | Off | N/A | N/A |
| DND Start Time | Time picker | Conditional | 10:00 PM | Required if DND enabled. Must be different from end time. | "Start and end times cannot be the same." |
| DND End Time | Time picker | Conditional | 7:00 AM | Required if DND enabled. | "Please select an end time." |
| DND Days | Checkbox group | Conditional | All days checked | Required if DND enabled. At least one day. | "Please select at least one day." |

**Behavior during DND**:
- Normal and Low priority notifications are held and delivered when DND ends.
- High and Urgent priority notifications are delivered immediately.
- Emergency broadcasts always bypass DND.

**Tooltip -- Do Not Disturb**: "During quiet hours, normal notifications are held and delivered when your quiet hours end. High-priority and emergency messages are always delivered immediately for your safety."

#### 3.7.4 Preference Page Buttons

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|--------------|--------------|--------------|
| Save | "Save Preferences" | Save all preference changes | "Saving..." | Toast: "Preferences saved." | Toast: "Failed to save. Please try again." |
| Reset to Defaults | "Reset to Defaults" | Confirmation: "Reset all notification preferences to their defaults?" then restore defaults | "Resetting..." | Toast: "Preferences reset to defaults." | Toast: "Failed to reset. Please try again." |

#### 3.7.5 Staff Notification Preference Matrix

Staff roles have a separate set of notification categories reflecting operational events. Staff preferences are configured at Settings > Notification Preferences (same page, different section visible only to staff roles).

| Notification Category | Applicable Roles | Email Default | SMS Default | Push Default | Opt-Out Allowed |
|-----------------------|-----------------|:------------:|:----------:|:----------:|:---------------:|
| Resident Profile Edits | Property Admin, Property Manager | On | Off | Off | Yes |
| New Maintenance Request | Property Manager, Maintenance Staff | On | Off | On | Yes |
| Maintenance Status Change | Property Manager, Maintenance Staff | On | Off | On | Yes |
| Package Intake (new arrival) | Concierge, Security Guard, Security Supervisor | Off | Off | On | Yes |
| Parking Violation Created | Security Guard, Security Supervisor, Property Manager | On | Off | On | Yes |
| Parking Violation Updated | Security Guard, Security Supervisor, Property Manager | On | Off | Off | Yes |
| Emergency Assistance Trigger | All Staff Roles | On | On | On | No |
| Shift Handoff Posted | Concierge, Security Guard, Security Supervisor | Off | Off | On | Yes |
| Amenity Booking Request | Property Manager, Property Admin | On | Off | On | Yes |
| Vendor Insurance Expiring | Property Manager, Property Admin | On | On | On | No |
| Announcement Draft Submitted | Property Manager, Property Admin | On | Off | On | Yes |
| New Resident Registered | Property Admin, Concierge | On | Off | Off | Yes |

**Note**: Staff preferences use the same `NotificationPreference` data model (Section 4.6). The `module` enum is extended with staff-specific values: `staff_maintenance`, `staff_packages`, `staff_security`, `staff_parking`, `staff_amenities`, `staff_admin`. The UI renders the resident matrix or the staff matrix (or both) depending on the authenticated user's role.

### 3.8 Pinned Announcements

Pinned announcements stick to the top of the resident portal announcement feed and the resident dashboard.

| Rule | Detail |
|------|--------|
| Max pinned | 5 announcements per property |
| Who can pin | Property Manager+ |
| Display order | Pinned announcements sort by pin date (most recently pinned first), followed by unpinned announcements sorted by creation date |
| Visual treatment | Thumbtack icon, subtle highlight background, "Pinned" label |
| Expiry | Pinned announcements still expire on their expiry date. Expired pinned announcements are auto-unpinned. |

### 3.9 Announcement Archive

All announcements are retained indefinitely in the archive. The archive is the announcement list filtered to "All" status with full search capability.

| Archive Feature | Detail |
|----------------|--------|
| Retention | Indefinite. No auto-deletion. |
| Search | Full-text search across title, body, author, tags |
| Filter | By status, category, priority, date range, building, channel |
| Export | CSV and PDF export of filtered results |
| Access | All staff roles can view archive. Residents see only announcements that were sent to them. |

---

## 4. Data Model

### 4.1 Announcement

```
Announcement
├── id (UUID, auto-generated)
├── property_id → Property (required, tenant isolation)
├── title (varchar 200, required)
├── body (text, max 10,000 chars, required, stored as HTML)
├── body_plaintext (text, auto-generated, stripped HTML for search and previews)
├── category_id → AnnouncementCategory (required)
├── tags[] (varchar 50 each, max 10)
├── priority (enum: low, normal, high, urgent)
├── status (enum: draft, scheduled, published, expired, rejected)
├── audience (JSONB -- targeting criteria, see 4.3)
├── channels[] (enum array: email, sms, push, voice, lobby_display)
│   NOTE: lobby_display is a v2 channel for digital signage / lobby screens.
│   When lobby_display is selected, the announcement is pushed to the
│   property's configured lobby display devices (see 01-Architecture,
│   Digital Signage integration). Lobby display supports two modes:
│   static (full announcement card) and ticker (scrolling headline).
│   The mode is configured per display device in property settings.
├── is_pinned (boolean, default false)
├── pinned_at (timestamp, nullable)
├── pinned_by → User (nullable)
├── is_emergency (boolean, default false)
├── emergency_type_id → EmergencyType (nullable)
├── require_acknowledgment (boolean, default false)
├── template_id → AnnouncementTemplate (nullable -- if created from template)
├── expires_at (timestamp with timezone, nullable -- null means never expires)
├── scheduled_at (timestamp with timezone, nullable)
├── published_at (timestamp with timezone, nullable)
├── created_by → User (required)
├── created_at (timestamp with timezone)
├── approved_by → User (nullable)
├── approved_at (timestamp with timezone, nullable)
├── rejected_by → User (nullable)
├── rejected_at (timestamp with timezone, nullable)
├── rejection_reason (varchar 500, nullable)
├── updated_by → User (nullable)
├── updated_at (timestamp with timezone)
├── attachments[] → Attachment
├── ai_metadata (JSONB -- readability score, sentiment, suggested improvements)
├── engagement_summary (JSONB -- cached aggregate metrics)
└── audit_log[] → AuditEntry
```

### 4.2 AnnouncementDelivery

Tracks per-recipient, per-channel delivery and read status.

```
AnnouncementDelivery
├── id (UUID)
├── announcement_id → Announcement
├── recipient_id → User (resident or staff)
├── channel (enum: email, sms, push, voice, lobby_display)
├── sender_address (varchar 255, nullable -- the "from" address used for this delivery, applicable to email channel)
├── status (enum: queued, sent, delivered, read, failed, bounced)
├── sent_at (timestamp, nullable)
├── delivered_at (timestamp, nullable)
├── read_at (timestamp, nullable)
├── failed_at (timestamp, nullable)
├── failure_reason (varchar 500, nullable)
├── acknowledged (boolean, default false -- for emergency broadcasts)
├── acknowledged_at (timestamp, nullable)
├── retry_count (integer, default 0, max 3)
└── created_at (timestamp)
```

### 4.3 Audience Targeting (JSONB Schema)

```json
{
  "type": "all_residents | all_excluding_offsite | all_owners | tenants_only | custom",
  "buildings": ["building-uuid-1", "building-uuid-2"],
  "floors": [12, 14, 15],
  "units": ["unit-uuid-1", "unit-uuid-2"],
  "roles": ["security_guard", "front_desk"],
  "groups": ["group-uuid-1"],
  "logic": "or"
}
```

### 4.4 AnnouncementTemplate

```
AnnouncementTemplate
├── id (UUID)
├── property_id → Property (nullable -- null means system-wide template)
├── name (varchar 100, required, unique per property)
├── category_id → AnnouncementCategory
├── subject_template (varchar 200, supports {{variables}})
├── body_template (text, max 10,000 chars, supports {{variables}})
├── default_channels[] (enum array)
├── default_priority (enum)
├── default_audience (JSONB)
├── is_emergency (boolean, default false)
├── emergency_type_id → EmergencyType (nullable)
├── sort_order (integer)
├── active (boolean, default true)
├── created_by → User
├── created_at (timestamp)
├── updated_at (timestamp)
└── usage_count (integer, default 0 -- tracks how often this template is used)
```

### 4.5 AnnouncementCategory

```
AnnouncementCategory
├── id (UUID)
├── property_id → Property (nullable -- null means system default)
├── name (varchar 50, required)
├── color (varchar 7, hex color code)
├── icon (varchar 50, icon name)
├── sort_order (integer)
├── active (boolean, default true)
└── created_at (timestamp)
```

**System default categories**: General, Maintenance, Safety, Events, Policy, Financial, Community, Regulatory/Legal.

**Regulatory/Legal category special rules**:
- Announcements created under "Regulatory/Legal" are treated as mandatory notices (e.g., AGM notices, budget ratification, insurance renewal).
- These announcements are delivered to all owners regardless of individual notification opt-out preferences, similar to emergency broadcasts.
- Tenants receive Regulatory/Legal notices only when the "Include Tenants" toggle is explicitly enabled by the author.
- A "Compliance Delivery Report" is automatically generated showing proof of delivery to every owner, with timestamps. This report is downloadable as PDF for regulatory record-keeping.
- System-provided templates for this category include: AGM Notice, Budget Mailout (pre-set audience: all owners), Special Assessment Notice, Insurance Certificate Update.

**Budget Mailout template (system default)**:
- Category: Financial
- Default audience: All Owners (Onsite and Offsite)
- Default channels: Email + Push
- Body template includes variables: `{{fiscal_year}}`, `{{budget_total}}`, `{{assessment_change}}`, `{{effective_date}}`
- Reply-To: Management Office (default)

### 4.6 NotificationPreference

```
NotificationPreference
├── id (UUID)
├── user_id → User (required)
├── property_id → Property (required)
├── module (enum: announcements, packages, maintenance, amenities, community, security, parking, staff_maintenance, staff_packages, staff_security, staff_parking, staff_amenities, staff_admin)
├── channel (enum: email, sms, push)
├── enabled (boolean)
├── digest_mode (enum: instant, daily, weekly -- email channel only)
├── digest_time (time, nullable -- for daily digest)
├── digest_day (enum: mon-sun, nullable -- for weekly digest)
├── dnd_enabled (boolean, default false)
├── dnd_start (time, nullable)
├── dnd_end (time, nullable)
├── dnd_days[] (enum array: mon-sun, nullable)
└── updated_at (timestamp)
```

### 4.7 EmergencyBroadcast

```
EmergencyBroadcast
├── id (UUID)
├── property_id → Property
├── announcement_id → Announcement
├── emergency_type_id → EmergencyType
├── cascade_config (JSONB -- timing between cascade steps)
├── total_recipients (integer)
├── acknowledged_count (integer)
├── cascade_status (enum: push_phase, sms_phase, voice_phase, completed)
├── started_at (timestamp)
├── completed_at (timestamp, nullable)
├── initiated_by → User
└── created_at (timestamp)
```

### 4.8 RecipientGroup

```
RecipientGroup
├── id (UUID)
├── property_id → Property
├── name (varchar 100, required, unique per property)
├── description (varchar 200, nullable)
├── unit_ids[] (UUID array)
├── created_by → User
├── created_at (timestamp)
├── updated_at (timestamp)
└── last_used_at (timestamp, nullable)
```

---

## 5. User Flows

### 5.1 Property Manager Creates and Sends an Announcement

```
1. Manager clicks "Create Announcement" button on announcement list page
2. Form opens with empty fields and "General" category pre-selected
3. Manager types title: "Elevator Maintenance - March 18"
4. Manager selects category: "Maintenance"
5. Manager writes body in rich text editor
   → AI suggests: "Would you like to improve readability? Current score: Grade 12. Click to simplify to Grade 8."
   → Manager clicks suggestion → body is rewritten at lower reading level (shown as diff, manager accepts or rejects)
6. Manager selects audience: "All Residents (Excluding Offsite Owners)"
   → Recipient preview updates: "This will reach approximately 312 residents"
7. Manager selects channels: Email (checked), Push (checked)
8. Manager uploads a PDF floor plan attachment (drag-and-drop)
9. Manager clicks "Preview" → preview modal shows email rendering and push notification text
10. Manager clicks "Send Announcement"
11. Confirmation dialog appears with recipient count and channel breakdown
12. Manager clicks "Send Now" in dialog
13. System sends notifications across channels
14. Redirect to announcement detail page showing live delivery tracker
```

### 5.2 Concierge Drafts an Announcement for Manager Approval

```
1. Concierge clicks "Create Announcement"
2. Concierge writes announcement about a lobby furniture delivery
3. Concierge clicks "Save Draft" (Send button is not available for this role)
4. Toast: "Draft saved. A manager will review your announcement."
5. Property Manager sees dashboard widget: "1 announcement draft awaiting review"
6. Manager opens draft, reviews content
7. Manager edits the title for clarity
8. Manager clicks "Approve & Send"
9. Announcement is published and sent
10. Concierge receives notification: "Your announcement 'Lobby Furniture Delivery' has been approved and sent."
```

### 5.3 Property Manager Sends Emergency Broadcast

```
1. Manager clicks "Emergency Broadcast" button (red, always visible in top navigation)
2. Emergency broadcast form opens
3. Manager selects type: "Flood / Water Leak"
   → Template auto-fills title and message
4. Manager edits message: "Water pipe burst on floor 14. Avoid the east stairwell. Maintenance is on-site."
5. Manager selects affected area: "Floor 14", "Floor 13" (floors below)
6. "Require Acknowledgment" is on by default
7. Manager clicks "SEND EMERGENCY BROADCAST"
8. Confirmation dialog: "You are about to send an emergency broadcast to 87 residents..."
9. Manager types "SEND" in confirmation field
10. Manager clicks "Confirm"
11. Cascade begins:
    a. Push notifications sent to all 87 residents immediately
    b. Dashboard shows real-time acknowledgment counter: "23 of 87 acknowledged"
    c. After 3 minutes, SMS sent to 64 unacknowledged residents
    d. After 5 more minutes, voice calls placed to remaining unacknowledged residents
12. Manager monitors emergency dashboard until acknowledgment rate reaches acceptable level
```

### 5.4 Resident Configures Notification Preferences

```
1. Resident navigates to Settings > Notification Preferences
2. Preference matrix displays all modules with channel toggles
3. Resident disables SMS for "Package Arrivals" (prefers push only)
4. Resident enables "Daily Digest" for email
5. Resident sets digest time: 8:00 AM
6. Resident enables Do-Not-Disturb: 10:00 PM to 7:00 AM, all days
7. Resident clicks "Save Preferences"
8. Toast: "Preferences saved."
9. Tooltip appears: "Emergency broadcasts and security alerts will always be delivered immediately, even during quiet hours."
```

### 5.5 Resident Views Announcements

```
1. Resident opens the Concierge portal
2. Dashboard shows "2 new announcements" badge
3. Resident clicks "Announcements" in sidebar navigation
4. Announcement list shows current announcements, pinned items at top
5. Resident clicks on an announcement card
6. Full announcement detail page opens with formatted body, attachments, and post date
7. System records read receipt (if resident has opted in)
8. Resident downloads PDF attachment by clicking the file card
```

---

## 6. UI/UX

### 6.1 Layout Rules

| Screen | Layout |
|--------|--------|
| Announcement list | Card grid: 3 columns desktop, 2 tablet, 1 mobile. 16px gap between cards. |
| Create/edit form | Single-column centered form, max-width 720px. Rich text editor spans full form width. |
| Announcement detail | Single-column, max-width 800px. Engagement panel as right sidebar on desktop, stacked below on tablet/mobile. |
| Emergency broadcast | Single-column centered form, max-width 600px. Red accent border. |
| Notification preferences | Matrix table on desktop. Stacked cards per module on mobile. |
| Emergency dashboard | Full-width dashboard with stats row at top, recipient table below. |

### 6.2 Responsive Behavior

| Component | Desktop (1280px+) | Tablet (768px-1279px) | Mobile (<768px) |
|-----------|-------------------|----------------------|-----------------|
| Announcement cards | 3-column grid | 2-column grid | Single-column stack |
| Create form | Centered, 720px max | Full-width with 24px padding | Full-width with 16px padding |
| Audience selector | Horizontal row of options | Two-column grid | Single-column stack |
| Channel checkboxes | Horizontal inline | Horizontal inline | Vertical stack |
| Engagement panel | Right sidebar (320px) | Below body, full-width | Below body, full-width |
| Notification matrix | Full table with all columns | Scrollable table | Stacked cards per module |
| Filter bar | Single row, all filters visible | Two rows | Collapsible filter drawer |
| Emergency dashboard | Stats row + full table | Stats row + scrollable table | Stats cards + compact list |

### 6.3 Empty States

| Screen | Empty State Message | Action |
|--------|-------------------|--------|
| Announcement list (no announcements) | "No announcements yet. Keep your residents informed by creating your first announcement." | "Create Announcement" button (if role permits) |
| Announcement list (no results) | "No announcements match your filters." | "Reset Filters" link |
| Template library (no templates) | "No templates yet. Create reusable templates to speed up announcement creation." | "Create Template" button |
| Delivery report (no failures) | "All deliveries successful. Every recipient received this announcement." | None (positive state) |
| Notification preferences (new resident) | "Set up your notification preferences to control how and when you receive building updates." | Pre-filled defaults with "Save" button |
| Custom groups (no groups) | "No custom groups yet. Create groups to easily target announcements to specific residents." | "Create Group" button |

### 6.4 Loading States

| Component | Loading Treatment |
|-----------|------------------|
| Announcement list | Skeleton cards (gray pulsing rectangles matching card layout). Show 6 skeleton cards. |
| Announcement detail | Skeleton blocks for title, body, and engagement panel. |
| Delivery report | Skeleton rows in the delivery table. |
| Rich text editor | Toolbar loads immediately. Editor area shows "Loading editor..." placeholder. |
| Audience selector | Dropdown shows "Loading..." with spinner while fetching building/floor/unit data. |
| Engagement metrics | Individual metric cards show spinner independently (metrics may load at different speeds). |

### 6.5 Error States

| Error | Display | Recovery |
|-------|---------|----------|
| Failed to load announcements | Full-page error: "Unable to load announcements. Please check your connection and try again." | "Try Again" button |
| Failed to send announcement | Toast: "Failed to send announcement. Error: {reason}." Form remains open with all data preserved. | User clicks "Send" again |
| Failed to load delivery report | Inline error in engagement panel: "Delivery data temporarily unavailable." | "Refresh" link |
| Rich text editor failed to load | Fallback to plain textarea with message: "Rich editor unavailable. You can still write your announcement in plain text." | Auto-retry on next page load |
| Emergency broadcast failed | Red banner: "EMERGENCY BROADCAST FAILED. Error: {reason}. Retry immediately or use manual notification procedures." | "Retry" button prominently displayed |
| File upload failed | Inline error below upload area: "Failed to upload {filename}. {reason}." | "Try Again" link per file |

### 6.6 Component Usage

| Component | Where Used | Design System Reference |
|-----------|-----------|----------------------|
| Card | Announcement list items | Standard content card with left-border color accent |
| Badge | Status, category, priority, channel indicators | Pill-shaped badges from design system |
| Toggle | Schedule for later, pin, DND, digest, save to library | Standard toggle component |
| Date picker | Expiry date, schedule date, filter date range | Standard date picker with calendar popup |
| Rich text editor | Announcement body, template body | TipTap or ProseMirror-based editor |
| Multi-select | Audience selector (units, groups), tag input | Searchable dropdown with chips |
| Progress bar | Engagement rate, acknowledgment rate | Thin horizontal bar with percentage label |
| Modal | Send confirmation, preview, delivery failures | Standard modal with backdrop |
| Toast | Success/failure notifications | Bottom-right positioned, auto-dismiss 5s |
| Skeleton | Loading states for cards, tables, metrics | Gray pulsing rectangles matching content layout |

---

## 7. AI Integration

Ten AI capabilities are embedded in the Communication module. Each is optional, configurable by Super Admin, and has a manual fallback. See PRD 19 (AI Framework) for system-wide AI architecture, provider strategy, and cost management.

### 7.1 Draft from Bullet Points (AI ID: 43)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Generates a professional announcement draft from a brief topic description or bullet points |
| **Trigger** | User clicks "AI Draft" button in create form, enters bullet points in modal |
| **Input** | Topic, bullet points (up to 500 chars), target audience, urgency level |
| **Output** | Full announcement with title and body, inserted into the form for editing |
| **Default model** | Sonnet |
| **Estimated cost** | $0.005 per invocation |
| **Default state** | Enabled |
| **Graceful degradation** | User writes announcement manually. No AI button shown if disabled. |
| **UI treatment** | Small "AI Draft" button with sparkle icon next to the body field label. Opens a modal: "Describe your announcement in a few bullet points and we will draft it for you." Textarea + "Generate" button. Generated text appears in editor with a thin blue highlight indicating AI-generated content. User can edit freely. |

### 7.2 Tone and Readability Analysis (AI ID: 45)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Analyzes announcement text for readability level, tone (formal/casual/urgent), and suggests adjustments |
| **Trigger** | Automatic on content entry (debounced 2 seconds after typing stops) |
| **Input** | Announcement body text |
| **Output** | Readability grade level (e.g., "Grade 10"), tone classification, and a "Simplify" button if grade > 8 |
| **Default model** | Haiku |
| **Estimated cost** | $0.001 per invocation |
| **Default state** | Enabled |
| **Graceful degradation** | No readability indicator shown. User writes at whatever level they choose. |
| **UI treatment** | Small indicator below the editor: "Readability: Grade 8 -- Tone: Professional." If grade is high: "Readability: Grade 12. [Simplify]" link that rewrites the text at a lower reading level (shown as a diff for user to accept/reject). |

### 7.3 Auto-Translation (AI ID: 44)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Translates announcements into other languages based on building demographics |
| **Trigger** | User clicks "Translate" button on create form or detail page |
| **Input** | Announcement body + target language |
| **Output** | Translated announcement text appended below the original (with language header) |
| **Default model** | Sonnet |
| **Estimated cost** | $0.005 per language |
| **Default state** | Disabled (enabled per property by admin if multilingual building) |
| **Graceful degradation** | No translate button shown. Single-language announcements only. |
| **UI treatment** | "Translate" dropdown button showing configured languages (e.g., "French", "Mandarin", "Spanish"). Selected language generates translation appended below original text with a horizontal divider and language label. |

### 7.4 Readability Scoring (AI ID: 45 -- subcomponent)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Scores announcement text on the Flesch-Kincaid scale and provides a grade-level equivalent |
| **Trigger** | Runs as part of Tone and Readability Analysis (7.2) |
| **Input** | Announcement body text |
| **Output** | Grade level number (1-16+), descriptive label ("Easy to read", "Moderate", "Complex") |
| **UI treatment** | Color-coded badge: green (Grade 4-8), yellow (Grade 9-12), red (Grade 13+). Tooltip: "This measures how easy your announcement is to read. Aim for Grade 8 or below to reach the widest audience." |

### 7.5 Send Time Optimization (AI ID: 48)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Recommends the best time to send based on historical open rates and audience engagement patterns |
| **Trigger** | When user enables "Schedule for Later" toggle |
| **Input** | Historical engagement data for this property + selected audience segment |
| **Output** | Suggested date/time with explanation (e.g., "Tuesday at 10:00 AM -- highest open rate for this building") |
| **Default model** | Haiku |
| **Estimated cost** | $0.001 per invocation |
| **Default state** | Disabled |
| **Graceful degradation** | No suggestion shown. User picks their own send time. |
| **UI treatment** | Below the schedule date/time picker: "Suggested: Tuesday, March 18 at 10:00 AM (highest engagement for your audience). [Use this time]" button. |

### 7.6 Engagement Prediction (AI ID: 52 -- subcomponent)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Predicts the expected open/read rate before sending, based on subject, audience, time, and channel selection |
| **Trigger** | Runs when user clicks "Preview" or before send confirmation |
| **Input** | Title, body (first 200 chars), audience size, selected channels, scheduled time |
| **Output** | Predicted open rate (percentage) with confidence range |
| **Default model** | Haiku |
| **Estimated cost** | $0.001 per invocation |
| **Default state** | Disabled |
| **Graceful degradation** | No prediction shown. User sends without engagement forecast. |
| **UI treatment** | In the send confirmation dialog: "Predicted engagement: ~72% (65%-79%). Based on similar announcements to this audience." |

### 7.7 Subject Line Optimization (AI ID: 46)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Generates 3 alternative subject lines optimized for open rates |
| **Trigger** | User clicks sparkle icon next to the title field |
| **Input** | Announcement body + category + audience |
| **Output** | 3 subject line options ranked by predicted effectiveness |
| **Default model** | Haiku |
| **Estimated cost** | $0.001 per invocation |
| **Default state** | Enabled |
| **Graceful degradation** | No suggestions. User writes their own title. |
| **UI treatment** | Dropdown below title field showing 3 options. User clicks one to apply it. Options disappear after selection. |

### 7.8 TL;DR Generation (AI ID: 49)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Creates a short summary for push notifications from longer announcement content |
| **Trigger** | Automatic when push notification channel is selected and body exceeds 200 characters |
| **Input** | Full announcement body |
| **Output** | 160-character summary suitable for push notification |
| **Default model** | Haiku |
| **Estimated cost** | $0.001 per invocation |
| **Default state** | Enabled |
| **Graceful degradation** | Body is truncated at 160 characters with ellipsis for push notification text. |
| **UI treatment** | In the preview modal, the push notification tab shows the AI-generated summary with an "Edit" link. User can override with custom push text. |

### 7.9 Sentiment Analysis (AI ID: 51)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Analyzes the tone and sentiment of the announcement before sending to flag potentially negative or inflammatory language |
| **Trigger** | On submit (pre-send check) |
| **Input** | Announcement body + title |
| **Output** | Sentiment score (positive/neutral/negative) with flagged phrases |
| **Default model** | Sonnet |
| **Estimated cost** | $0.005 per invocation |
| **Default state** | Disabled |
| **Graceful degradation** | No sentiment check. Announcement sends as written. |
| **UI treatment** | If negative sentiment detected, a yellow warning appears before send: "This announcement may be perceived as [harsh/alarming/negative]. Consider softening: '{flagged phrase}'. [Send anyway] [Revise]." |

### 7.10 Emergency Draft Assistance (AI ID: 50)

| Attribute | Detail |
|-----------|--------|
| **What it does** | Identifies the emergency type from a brief description and pre-fills the appropriate template with relevant details |
| **Trigger** | When user opens emergency broadcast form and starts typing in the message field |
| **Input** | Emergency description + type indicators + building context |
| **Output** | Pre-filled emergency template with appropriate urgency and instructions |
| **Default model** | Haiku |
| **Estimated cost** | $0.001 per invocation |
| **Default state** | Enabled |
| **Graceful degradation** | User manually selects template and fills in details. |
| **UI treatment** | As user types in the message field, system suggests: "This sounds like a [Water Leak] emergency. [Use Water Leak template]" button. Clicking applies the template with the user's custom details merged in. |

---

## 8. Analytics

### 8.1 Operational Metrics (What Happened)

| Metric | Description | Refresh Rate |
|--------|------------|-------------|
| Announcements Sent (period) | Total announcements sent in the selected date range | Real-time |
| Total Deliveries | Sum of all individual channel deliveries | Real-time |
| Delivery Failure Rate | Percentage of failed deliveries across all channels | Real-time |
| Emergency Broadcasts (period) | Count of emergency broadcasts in date range | Real-time |
| Average Acknowledgment Rate | Average percentage of residents who acknowledged emergency broadcasts | Real-time |
| Drafts Pending Review | Count of announcement drafts awaiting manager approval | Real-time |
| Channel Distribution | Breakdown of deliveries by channel (email, SMS, push, voice) | Daily |
| Missing Contact Data | Count of residents missing email, phone, or push token | Daily |

**Communication Health Report** (Property Manager+):

Accessible from the Analytics section and optionally surfaced as a dashboard widget (see 14-Dashboard). This report proactively identifies and helps resolve contact data gaps that reduce announcement reach.

| Metric | Description | Action |
|--------|-------------|--------|
| Residents Missing Email | Count and list of residents with no email address on file | "View List" link navigates to User Management filtered to `email IS NULL` |
| Residents Missing Phone | Count and list of residents with no phone number on file | "View List" link navigates to User Management filtered to `phone IS NULL` |
| Residents Missing Push Token | Count and list of residents who have never installed the mobile app (no push token registered) | "View List" link navigates to User Management filtered to `push_token IS NULL` |
| Overall Reachability Score | Percentage of residents reachable on at least 2 channels | Displayed as a percentage with color coding: green (>90%), yellow (70-90%), red (<70%) |
| Channel Coverage Breakdown | Bar chart showing how many residents are reachable per channel (email, SMS, push) | Hover for exact counts |

### 8.2 Performance Metrics (How Well)

| Metric | Description | Refresh Rate |
|--------|------------|-------------|
| Average Open Rate | Percentage of delivered announcements that were read (across all channels) | Daily |
| Open Rate by Channel | Breakdown of open/read rate per channel | Daily |
| Open Rate by Category | Which announcement categories get the highest engagement | Weekly |
| Time to Read | Average time between delivery and read across all announcements | Weekly |
| Opt-Out Rate | Percentage of residents who have disabled non-mandatory notifications | Weekly |
| Digest Adoption | Percentage of residents using daily or weekly digest mode | Weekly |
| DND Adoption | Percentage of residents with do-not-disturb enabled | Weekly |
| Template Usage | Which templates are used most frequently | Monthly |

### 8.3 AI Insight Metrics (What to Do About It)

| Metric | Description | Refresh Rate |
|--------|------------|-------------|
| AI Draft Acceptance Rate | Percentage of AI-generated drafts accepted without major edits | Weekly |
| Readability Improvement Rate | How often users accept AI readability suggestions | Weekly |
| Subject Line AI Usage | Percentage of announcements using AI-suggested titles | Weekly |
| Translation Usage | Which languages are most frequently translated | Monthly |
| Send Time Compliance | How often users follow AI send-time suggestions and resulting engagement delta | Monthly |
| Engagement Prediction Accuracy | Deviation between predicted and actual open rates | Monthly |

---

## 9. Notifications

### 9.1 Notification Triggers (Staff-Facing)

| Trigger | Recipients | Channel | Template |
|---------|-----------|---------|----------|
| New draft submitted for review | Property Manager+ at the property | Push + Email | "New announcement draft from {author}: '{title}'. Review and approve." |
| Draft approved and sent | Draft author | Push + Email | "Your announcement '{title}' has been approved and sent to {count} residents." |
| Draft rejected | Draft author | Push + Email | "Your announcement '{title}' was not approved. Reason: {reason}." |
| Delivery failures exceed 5% | Announcement author + Property Manager | Push + Email | "Announcement '{title}' has {count} delivery failures ({percentage}%). Review delivery report." |
| Emergency broadcast acknowledgment below 50% after cascade complete | Property Manager+ | Push + SMS | "Emergency broadcast acknowledgment at {percentage}%. {count} residents not reached. Review emergency dashboard." |
| Scheduled announcement sent | Announcement author | Push | "Your scheduled announcement '{title}' has been sent to {count} residents." |

### 9.2 Notification Triggers (Resident-Facing)

| Trigger | Recipients | Channel | Respects Preferences | Template |
|---------|-----------|---------|---------------------|----------|
| New announcement (Normal/Low) | Target audience | Per resident preference | Yes | "{building_name}: {title}" with body preview |
| New announcement (High) | Target audience | Per resident preference, bypasses digest | Yes (except digest) | "Important: {title}" with body preview |
| New announcement (Urgent) | Target audience | All enabled channels simultaneously | Partially (bypasses digest and DND) | "URGENT: {title}" with body preview |
| Emergency broadcast | All residents in affected area | Push > SMS > Voice cascade | No (overrides all) | Emergency type template (see 3.4.1) |

### 9.3 Notification Preference Rules

| Rule | Detail |
|------|--------|
| New resident defaults | Email and Push enabled for all modules. SMS disabled (requires phone number verification). |
| Emergency override | Emergency broadcasts always deliver on all available channels regardless of preferences. |
| Digest batching | Low and Normal priority notifications are batched if resident has digest enabled. High and Urgent are always immediate. |
| DND hold and release | Notifications held during DND are delivered in a single batch when DND period ends. |
| Channel availability | If a resident has no phone number, SMS and Voice are silently skipped (no error). Push requires app installation. Email requires verified email. |
| Preference visibility | Staff can see aggregate preference stats ("78% of residents receive push notifications") but cannot see individual resident preferences. |

---

## 10. API

### 10.1 Endpoints

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|-----------|
| `GET` | `/api/v1/announcements` | List announcements with filters | Bearer token | 60/min |
| `GET` | `/api/v1/announcements/:id` | Get single announcement with engagement data | Bearer token | 60/min |
| `POST` | `/api/v1/announcements` | Create announcement (draft or publish) | Bearer token | 20/min |
| `PUT` | `/api/v1/announcements/:id` | Update announcement (draft/scheduled only) | Bearer token | 20/min |
| `DELETE` | `/api/v1/announcements/:id` | Delete announcement | Bearer token | 10/min |
| `POST` | `/api/v1/announcements/:id/send` | Send a draft announcement | Bearer token | 10/min |
| `POST` | `/api/v1/announcements/:id/approve` | Approve a draft for sending | Bearer token | 10/min |
| `POST` | `/api/v1/announcements/:id/reject` | Reject a draft with reason | Bearer token | 10/min |
| `POST` | `/api/v1/announcements/:id/pin` | Pin an announcement | Bearer token | 10/min |
| `DELETE` | `/api/v1/announcements/:id/pin` | Unpin an announcement | Bearer token | 10/min |
| `GET` | `/api/v1/announcements/:id/delivery` | Get delivery report | Bearer token | 30/min |
| `POST` | `/api/v1/announcements/:id/resend` | Resend to unread or all recipients | Bearer token | 5/min |
| `POST` | `/api/v1/emergency-broadcast` | Send emergency broadcast | Bearer token | 5/min |
| `GET` | `/api/v1/emergency-broadcast/:id` | Get emergency broadcast status | Bearer token | 60/min |
| `GET` | `/api/v1/announcement-templates` | List announcement templates | Bearer token | 30/min |
| `POST` | `/api/v1/announcement-templates` | Create template | Bearer token | 10/min |
| `PUT` | `/api/v1/announcement-templates/:id` | Update template | Bearer token | 10/min |
| `DELETE` | `/api/v1/announcement-templates/:id` | Delete template | Bearer token | 10/min |
| `GET` | `/api/v1/recipient-groups` | List custom groups | Bearer token | 30/min |
| `POST` | `/api/v1/recipient-groups` | Create custom group | Bearer token | 10/min |
| `PUT` | `/api/v1/recipient-groups/:id` | Update custom group | Bearer token | 10/min |
| `DELETE` | `/api/v1/recipient-groups/:id` | Delete custom group | Bearer token | 10/min |
| `GET` | `/api/v1/notification-preferences` | Get current user's notification preferences | Bearer token | 30/min |
| `PUT` | `/api/v1/notification-preferences` | Update current user's notification preferences | Bearer token | 10/min |

### 10.2 Key Payloads

#### Create Announcement (POST /api/v1/announcements)

```json
{
  "title": "Elevator Maintenance - March 18",
  "body": "<p>The east elevator will be out of service...</p>",
  "category_id": "uuid",
  "tags": ["maintenance", "elevator"],
  "priority": "normal",
  "status": "draft",
  "audience": {
    "type": "custom",
    "buildings": [],
    "floors": [],
    "units": [],
    "roles": [],
    "groups": [],
    "logic": "or"
  },
  "channels": ["email", "push"],
  "expires_at": "2026-03-25T23:59:59Z",
  "scheduled_at": null,
  "is_pinned": false,
  "send_copy_to_self": true,
  "save_to_library": false,
  "attachment_ids": ["uuid-1", "uuid-2"]
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "title": "Elevator Maintenance - March 18",
  "status": "draft",
  "created_at": "2026-03-14T10:30:00Z",
  "created_by": {
    "id": "uuid",
    "name": "Sarah Johnson",
    "role": "property_manager"
  },
  "recipient_count": 312,
  "channels": ["email", "push"]
}
```

#### Send Emergency Broadcast (POST /api/v1/emergency-broadcast)

```json
{
  "emergency_type_id": "uuid",
  "title": "Water Emergency - Floor 14",
  "message": "Water pipe burst on floor 14. Avoid the east stairwell. Maintenance is on-site.",
  "affected_area": {
    "buildings": [],
    "floors": [13, 14]
  },
  "require_acknowledgment": true,
  "cascade_config": {
    "push_to_sms_delay_minutes": 3,
    "sms_to_voice_delay_minutes": 5
  }
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "announcement_id": "uuid",
  "cascade_status": "push_phase",
  "total_recipients": 87,
  "acknowledged_count": 0,
  "started_at": "2026-03-14T14:22:00Z"
}
```

#### Update Notification Preferences (PUT /api/v1/notification-preferences)

```json
{
  "preferences": [
    {
      "module": "announcements",
      "channel": "email",
      "enabled": true
    },
    {
      "module": "packages",
      "channel": "sms",
      "enabled": false
    }
  ],
  "digest": {
    "mode": "daily",
    "time": "08:00"
  },
  "dnd": {
    "enabled": true,
    "start": "22:00",
    "end": "07:00",
    "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  }
}
```

### 10.3 Error Responses

| Status Code | Error | Description |
|------------|-------|-------------|
| 400 | `INVALID_AUDIENCE` | Audience targeting has no valid recipients |
| 400 | `BODY_TOO_SHORT` | Announcement body is below minimum length |
| 400 | `SCHEDULE_IN_PAST` | Scheduled time is in the past |
| 400 | `MAX_ATTACHMENTS_EXCEEDED` | More than 10 files or total size exceeds 25 MB |
| 403 | `DRAFT_ONLY` | User role can only save drafts, not send directly |
| 403 | `INSUFFICIENT_ROLE` | User does not have the required role for this action |
| 404 | `ANNOUNCEMENT_NOT_FOUND` | Announcement ID does not exist or belongs to another property |
| 409 | `ALREADY_SENT` | Cannot edit an announcement that has already been published |
| 409 | `ALREADY_PINNED` | Announcement is already pinned |
| 409 | `MAX_PINS_REACHED` | Property already has 5 pinned announcements |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests. Retry after `Retry-After` header value. |
| 500 | `DELIVERY_FAILED` | Internal error during notification delivery |
| 503 | `CHANNEL_UNAVAILABLE` | SMS/Voice provider temporarily unavailable |

### 10.4 WebSocket Events

Real-time events broadcast via WebSocket for live dashboard updates:

| Event | Payload | Who Receives |
|-------|---------|-------------|
| `announcement.created` | `{ id, title, status, created_by }` | All staff at the property |
| `announcement.sent` | `{ id, title, recipient_count }` | All staff at the property |
| `announcement.delivery_update` | `{ id, delivered_count, failed_count }` | Announcement author + Property Manager+ |
| `emergency.broadcast_started` | `{ id, type, total_recipients }` | All staff at the property |
| `emergency.acknowledgment` | `{ broadcast_id, acknowledged_count, total }` | All staff at the property |
| `emergency.cascade_step` | `{ broadcast_id, phase, pending_count }` | All staff at the property |
| `draft.submitted` | `{ id, title, author }` | Property Manager+ at the property |
| `draft.approved` | `{ id, title, approved_by }` | Draft author |
| `draft.rejected` | `{ id, title, reason }` | Draft author |

---

## 11. Completeness Checklist

### Feature Coverage

| Requirement | Section | Status |
|-------------|---------|--------|
| Announcement creation with all fields | 3.1 | Covered |
| Rich text editor with full toolbar | 3.1.2 | Covered |
| Audience targeting (all, building, floor, unit, role, group) | 3.1.3 | Covered |
| Scheduling with date/time picker | 3.1.1 | Covered |
| Draft-and-approve workflow for staff roles | 3.1.5 | Covered |
| Multi-channel delivery (email, SMS, push, voice) | 3.1.1, 9.2 | Covered |
| Emergency broadcast with cascade | 3.4 | Covered |
| Emergency type templates | 3.4.1 | Covered |
| Acknowledgment tracking | 3.4.2, 3.4.4 | Covered |
| Announcement templates with variables | 3.5 | Covered |
| Custom recipient groups | 3.6 | Covered |
| Pinned announcements | 3.8 | Covered |
| Announcement archive with search | 3.9 | Covered |
| Read receipts per channel | 4.2, 6.3.3 | Covered |
| Delivery failure tracking and retry | 3.3.3 | Covered |
| Notification preferences per module per channel | 3.7 | Covered |
| Email digest (daily/weekly) | 3.7.2 | Covered |
| Do-not-disturb hours | 3.7.3 | Covered |
| File attachments (10 files, 25 MB) | 3.1.1 | Covered |
| Announcement categories and tags | 3.1.1, 4.5 | Covered |

### AI Coverage

| AI Capability | AI ID | Section | Status |
|--------------|-------|---------|--------|
| Draft from Bullet Points | 43 | 7.1 | Covered |
| Tone and Readability Analysis | 45 | 7.2 | Covered |
| Auto-Translation | 44 | 7.3 | Covered |
| Readability Scoring | 45 | 7.4 | Covered |
| Send Time Optimization | 48 | 7.5 | Covered |
| Engagement Prediction | 52 | 7.6 | Covered |
| Subject Line Optimization | 46 | 7.7 | Covered |
| TL;DR Generation | 49 | 7.8 | Covered |
| Sentiment Analysis | 51 | 7.9 | Covered |
| Emergency Draft Assistance | 50 | 7.10 | Covered |

### Responsive Design

| Screen | Desktop | Tablet | Mobile | Empty State | Loading State | Error State |
|--------|---------|--------|--------|-------------|--------------|-------------|
| Announcement list | Covered | Covered | Covered | Covered | Covered | Covered |
| Create/Edit form | Covered | Covered | Covered | N/A | Covered | Covered |
| Announcement detail | Covered | Covered | Covered | N/A | Covered | Covered |
| Emergency broadcast | Covered | Covered | Covered | N/A | Covered | Covered |
| Emergency dashboard | Covered | Covered | Covered | N/A | Covered | Covered |
| Notification preferences | Covered | Covered | Covered | Covered | Covered | Covered |
| Template library | Covered | Covered | Covered | Covered | Covered | Covered |

### Role Access

| Feature | Front Desk | Security | Property Manager | Board Member | Resident |
|---------|:----------:|:--------:|:----------------:|:------------:|:--------:|
| View announcements | Yes | Yes | Yes | Yes | Yes (own) |
| Create draft | Yes | Yes | Yes | No | No |
| Send announcement | No | No | Yes | No | No |
| Approve/reject draft | No | No | Yes | No | No |
| Send emergency broadcast | No | No | Yes | No | No |
| View delivery report | No | No | Yes | No | No |
| Pin/unpin | No | No | Yes | No | No |
| Manage templates | No | No | Yes | No | No |
| Manage custom groups | No | No | Yes | No | No |
| Delete announcement | No | No | Property Admin+ | No | No |
| Configure preferences | N/A | N/A | N/A | N/A | Yes |
| View engagement metrics | No | No | Yes | Yes (aggregate) | No |

---

*Last updated: 2026-03-14*
*Module: Communication*
*Dependencies: 01-Architecture, 02-Roles and Permissions, 19-AI Framework*
*Integration points: Twilio (SMS, Voice), SendGrid (Email), Firebase (Push), AI Gateway (all AI features)*
