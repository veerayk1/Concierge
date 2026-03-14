# Classified Ads — Granular Deep Dive

Field-level documentation of every element in Condo Control's Classified Ads module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/forum/all-forums?mode=classifieds`
**Sidebar menu**: Classified Ads (newspaper icon)
**Breadcrumb**: Classified Ads (on list page); List Forums > Classified Ads (on forum view); List Forums > Classified Ads > Create new classified (on create page)
**Page title**: "Classified Ads | Condo Control"

The Classified Ads module is built on top of a **forum engine**. Each "classified ad" is a forum thread with additional fields (Price, Image, Expiration Date). The URL structure uses `/forum/` paths with a `?mode=classifieds` parameter.

**Role access**: Security & Concierge has **full access** — can view, create, and follow classified ads.

---

## 2. Forums List Page (Landing)

**URL**: `/forum/all-forums?mode=classifieds`
**Breadcrumb**: Classified Ads

### 2.1 Search Bar

| # | Field | Type | Placeholder | Button |
|---|-------|------|-------------|--------|
| 1 | Search | Text input | "Search" | "Search" (teal `btn-primary`) |

### 2.2 Forums Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | Forum Name | Yes (▼▲) | Forum name with icon. Teal link text. Links to `/forum/view-forum/{forumId}?mode=classifieds`. Info icon (ℹ) next to name |
| 2 | Threads | Yes (▼▲) | Number of threads/ads in this forum |
| 3 | Replies | Yes (▼▲) | Total replies across all threads |
| 4 | Views | Yes (▼▲) | Total views across all threads |
| 5 | Last Updated | Yes (▼▲) | Timestamp of most recent activity. Format: YYYY/MM/DD at HH:MM AM/PM |

**Table header style**: Dark teal/green background with white text.

**Observed forums**:

| Forum Name | Forum ID | Description | Threads | Replies | Views | Last Updated |
|------------|----------|-------------|---------|---------|-------|--------------|
| Classified Ads | 1042 | "to be post any classified ads within the Building" | 142 | 35 | 142 | 2025/12/11 at 10:59 AM |

**Forum description**: The info icon (ℹ) next to the forum name reveals the description text. The description text "to be post any classified ads within the Building" contains a grammatical error (should be "to post").

**Note**: Only 1 forum configured for this property. The platform supports multiple classified ad forums (the table structure suggests it), but this property uses a single "Classified Ads" forum.

---

## 3. Forum View Page (Thread List)

**URL**: `/forum/view-forum/{forumId}?mode=classifieds`
**Example**: `/forum/view-forum/1042?mode=classifieds`
**Breadcrumb**: List Forums > Classified Ads

### 3.1 Action Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Follow | Green `btn-success` | Subscribe to forum notifications. Toggles to "Unfollow" when active |
| 2 | New Classified | Dark outlined button | Creates a new classified ad. Links to `/forum/new-thread/{forumId}?mode=classifieds` |

### 3.2 Search Bar

| # | Field | Type | Placeholder | Button |
|---|-------|------|-------------|--------|
| 1 | Search | Text input | "Search" | "Search" (teal `btn-primary`) |

### 3.3 Classified Ads Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | Image | No | Thumbnail image of the classified ad item |
| 2 | Details | No | Ad title + description preview |
| 3 | Price | Yes (▼▲) | Dollar amount |

**Observed**: "No matching records found" — no active classified ads at time of documentation.

**Note**: The forum list page shows 32 threads, but the classified view shows none. This likely means all 32 threads have expired (past their Expiration Date) and the default view only shows active/current ads.

---

## 4. Create New Classified Page

**URL**: `/forum/new-thread/{forumId}?mode=classifieds`
**Example**: `/forum/new-thread/1042?mode=classifieds`
**Breadcrumb**: List Forums > Classified Ads > Create new classified
**Page title**: "Create new classified | Condo Control"

### 4.1 Form Fields

| # | Label | Type | ID/Name | Default | Required | Description |
|---|-------|------|---------|---------|----------|-------------|
| 1 | Topic: | Text input | `NewForumTopic_Topic` / `NewForumTopic.Topic` | Empty | — | Title of the classified ad |
| 2 | Message: | Rich text editor (CKEditor 5) | — | Empty | — | Full description of the item. Rich text with formatting |
| 3 | Price: $ | Text input | `NewForumTopic_Price` / `NewForumTopic.Price` | Empty | — | Dollar price. Info tooltip (ℹ) next to label |
| 4 | Expiration Date: | Text input (datetime) | `ExpirationDatePicker` / `NewForumTopic.ExpirationDate` | Today + 30 days (e.g., "04/14/2026 01:17:45") | — | When the ad expires and stops being visible. Format: MM/DD/YYYY HH:MM:SS |
| 5 | Upload image: | File upload | (file input) | — | — | "Upload Files" button (teal). Accepts image files |

### 4.2 Action Buttons

| # | Button | Type | Style | Description |
|---|--------|------|-------|-------------|
| 1 | Create | Submit | Teal `btn-primary` | ID: `btnCreate`. Submits the classified ad |
| 2 | Cancel | Button | Teal `btn-primary` | Returns to forum view without creating |

### 4.3 Message Rich Text Editor (CKEditor 5)

Same CKEditor 5 component used across the platform. Toolbar buttons:

#### Toolbar — Main Row

| # | Button | Shortcut | Description |
|---|--------|----------|-------------|
| 1 | Undo | ⌘Z | Undo last action |
| 2 | Redo | ⌘Y | Redo last undone action |
| 3 | Bold | ⌘B | Bold text |
| 4 | Italic | ⌘I | Italic text |
| 5 | Underline | ⌘U | Underline text |
| 6 | Strikethrough | ⌘⇧X | Strikethrough text |
| 7 | Remove Format | — | Clear all formatting |
| 8 | Bulleted List | — | Unordered list |
| 9 | Numbered List | — | Ordered list |
| 10 | Text alignment | — | Dropdown: Align left, Align right, Align center, Justify |
| 11 | Heading | — | Dropdown: Paragraph (default), Heading 1, Heading 2, Heading 3 |
| 12 | Show more items | — | Expands additional toolbar options (⋮ icon) |

#### Toolbar — Expanded ("Show more items")

| # | Button | Description |
|---|--------|-------------|
| 1 | Font Family | Dropdown: Default, Arial, Courier New, Georgia, Lucida Sans Unicode, Tahoma, Times New Roman, Trebuchet MS, Verdana |
| 2 | Font Size | Dropdown: Tiny, Small, Default, Big, Huge |
| 3 | Font Color | Color picker with "Remove color" option |
| 4 | Font Background Color | Background highlight color picker with "Remove color" option |
| 5 | Link | Insert/edit hyperlink |
| 6 | Insert image | Insert image into message body |

**Total toolbar options**: 18 buttons + 4 alignment sub-options + 4 heading sub-options + 9 font families + 5 font sizes + 2 color pickers = ~42 options

### 4.4 Price Field Info Tooltip

The info icon (ℹ) next to the Price label reveals: *"It will show negotiable when no specific price is added."*

This means if the price field is left empty, the classified ad displays "Negotiable" instead of a dollar amount.

### 4.5 Expiration Date Default

Default expiration is set to **current date + 30 days** with full timestamp precision. Example: `"04/14/2026 02:54:13"` (includes hours, minutes, seconds). Uses a datetime picker (jQuery UI datepicker).

### 4.6 Upload Image Fields

| # | Element | Description |
|---|---------|-------------|
| 1 | Upload image: | Label |
| 2 | File input 1 | First image upload slot |
| 3 | File input 2 | Second image upload slot |

**Note**: Two file input fields are provided, allowing up to 2 images per classified ad. Both use the standard HTML file input (no drag-and-drop).

---

## 5. Classified Ad Thread View

**URL**: `/forum/view-thread/{threadId}?mode=classifieds` (inferred from forum URL pattern)

### 5.1 Comment Section

Each classified ad thread supports comments/replies:

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Comment textarea | Textarea | Free-text comment input |
| 2 | Submit | Button | Submits the comment |
| 3 | Cancel | Button | Cancels the comment |

### 5.2 File Delete Confirmation

When deleting an uploaded file (image) from a classified ad, a confirmation dialog appears:

| # | Element | Description |
|---|---------|-------------|
| 1 | Dialog text | "Are you sure you want to delete this file?" |
| 2 | Confirm | Proceeds with deletion |
| 3 | Cancel | Aborts deletion |

---

## 6. Data Model Observations

### 5.1 Classified Ad Entity (Forum Thread)

| Field | Type | Description |
|-------|------|-------------|
| ForumId | Integer | Parent forum (1042 for "Classified Ads" at this property) |
| Topic | String | Ad title |
| Message | HTML | Rich text body with formatting |
| Price | Decimal | Dollar amount |
| ExpirationDate | DateTime | When ad expires. Default: current date + 30 days |
| Image | File | Uploaded product image |
| Threads | Integer | Derived — count of replies |
| Views | Integer | Derived — view count |
| LastUpdated | DateTime | Last activity timestamp |

### 5.2 Forum Entity

| Field | Type | Description |
|-------|------|-------------|
| ForumId | Integer | Unique identifier (e.g., 1042) |
| ForumName | String | Display name (e.g., "Classified Ads") |
| Mode | String | "classifieds" — URL parameter that switches between forum and classifieds view |
| Threads | Integer | Total thread count |
| Replies | Integer | Total reply count |
| Views | Integer | Total view count |

---

## 7. URL Map

| Page | URL Pattern |
|------|-------------|
| Forums list (classifieds mode) | `/forum/all-forums?mode=classifieds` |
| All classifieds (alternative) | `/forum/all-classifieds` |
| Forum view (thread list) | `/forum/view-forum/{forumId}?mode=classifieds` |
| Create new classified | `/forum/new-thread/{forumId}?mode=classifieds` |
| View thread (inferred) | `/forum/view-thread/{threadId}?mode=classifieds` |

**Note**: `/forum/all-classifieds` is an alternative URL that may bypass the forum list and go directly to a unified classifieds view.

---

## 8. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Built on forum engine** — Reuses forum infrastructure for classifieds. Replies allow negotiation/discussion. Smart code reuse
2. **Image support** — Each ad can have an uploaded image. Visual browsing in the table with Image column
3. **Auto-expiry** — 30-day default expiration. Prevents stale ads from cluttering the board
4. **Follow functionality** — Users can subscribe to forum notifications. Good for residents who want to watch for deals
5. **Rich text editor** — Full CKEditor 5 with fonts, colors, alignment, images, lists. Professional ad formatting
6. **Price field** — Dedicated price field with $ prefix. Enables sorting by price

### What CondoControl Gets Wrong
1. **Forum URL leaks through** — URL uses `/forum/` paths with `?mode=classifieds`. Exposes implementation detail. Users see "forum" in breadcrumbs ("List Forums > Classified Ads")
2. **Empty state is confusing** — Forum list shows 32 threads, but classified view shows "No matching records found". No explanation that expired ads aren't shown. Discrepancy is jarring
3. **No category/type filtering** — Can't filter by "For Sale", "Wanted", "Free", "Services". Just one flat list
4. **No ad status indicators** — No "Sold", "Available", "Pending" status on ads
5. **Price field is text input** — No validation for numeric input. Could accept non-numeric values. No currency formatting
6. **Only two images** — Two "Upload image" file inputs. Limited to 2 photos per ad — insufficient for showcasing furniture or appliances
7. **Expiration date includes time** — Default "04/14/2026 01:17:45" includes seconds-level precision. Unnecessary for classified ads. Should be date-only
8. **No contact information field** — Seller must include contact details in the message body. No structured phone/email fields
9. **Forum terminology in UI** — "List Forums" in breadcrumb, "Forum Name" column header. Should say "Classifieds" consistently
10. **No grid/card view** — Table-only display. Classified ads benefit from visual card layout with prominent images
11. **Forum description has grammatical error** — "to be post any classified ads within the Building" — should be "to post" or "for posting"
12. **Comment section is basic** — Simple textarea with Submit/Cancel. No threading, no rich text, no @mentions. Insufficient for negotiations

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~240+*
