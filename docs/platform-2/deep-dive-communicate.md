# Communicate Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Communicate module.

---

## Overview

**URL**: `/v2/mgmt/dashboard/communicatehome.aspx`

The Communicate dashboard is the central hub for all communication tools. It provides a summary page with status indicators for each communication feature.

---

## 1. Communicate Home Dashboard

### Actions List (9 items)
| # | Action | Icon | Status | Description |
|---|--------|------|--------|-------------|
| 1 | Send Email | ✉ | — | Email composition tool |
| 2 | Mailbox | 📩 | — | Internal message inbox |
| 3 | Manage Library Documents | 📚 | 3 Active Documents | Document management |
| 4 | Manage Special Email Groups | 👥 | (1 with an Active Status) | Custom distribution lists |
| 5 | View/Edit Scrolling Announcements | 📢 | (None with an Active Status) | Ticker-style announcements |
| 6 | Send an Emergency Voice and/or SMS Broadcast | 🚨 | — | Emergency communication |
| 7 | View/Create Survey Questions | ✅ | — | Survey builder |
| 8 | Manage Photo Albums | 📷 | — | Photo gallery |
| 9 | Configure Public Display(s) | 🖥 | (None with an Active Status) | Lobby screen content |

### Right Panel — Directories
| Directory | Description |
|-----------|-------------|
| Resident Directory | Formerly "Address Book" — resident contact lookup |
| Building Directory | Building-level directory with facility information |

### Manage Missing Email Addresses
| Category | Count |
|----------|-------|
| Employees | 3 missing Email Addresses |
| Occupants | 19 missing Email Addresses |

---

## 2. Email / Mailbox (Modern SPA)

**URL**: `/email/staff/mailbox`

### Top Bar
| Control | Type | Description |
|---------|------|-------------|
| ✏ Compose | Button (teal) | Opens email composition dialog |
| Search emails… | Text search | Search across emails |
| Date range | Date picker | Default: 1 month (e.g., "2/13/2026 ~ 3/13/2026") |

### Mailbox Folder Structure (Left Sidebar)

**Standard Folders (4):**
| # | Folder | Icon | Description |
|---|--------|------|-------------|
| 1 | Inbox | 📥 | Received emails |
| 2 | Sent | ▶ | Sent emails |
| 3 | Draft | 📄 | Unsent draft emails |
| 4 | Scheduled | 🕐 | Emails scheduled for future sending |

**Inbox Sub-folder:**
- Notifications to staff

**Notifications Folders (5 sub-folders under "Notifications"):**
| # | Folder | Description |
|---|--------|-------------|
| 1 | Maintenance | Maintenance request notifications |
| 2 | Event log | Event log notifications |
| 3 | Bulletin board | Bulletin board notifications (expandable with ▶) |
| 4 | Amenities | Amenity reservation notifications |
| 5 | Other | Other system notifications |

### Email List View
- 3-column layout: Folder sidebar | Email list | Email preview
- Empty state: "This folder is empty" with illustration
- Preview pane: "Select an email from the left" with illustration

### Compose Email Dialog

**Title**: "New email"

**Window Controls (top right):**
- Fullscreen toggle (⤢)
- Close (✕)

#### Header Section
| Field | Type | Description |
|-------|------|-------------|
| From | Read-only link | Property email (e.g., "Queensway Park Condos - TSCC 2934 (queenswaypark.office...)") |
| To | Text input / autocomplete | Recipient field |
| Subject | Text input | "Enter subject" placeholder |

#### Recipient Selection Options (6 links in header)
| # | Option | Description |
|---|--------|-------------|
| 1 | Exclude | Exclude specific recipients |
| 2 | All occupants | Select all occupants |
| 3 | By location | Filter recipients by location |
| 4 | Type/Group | Filter by occupant type or group |
| 5 | View recipients | View selected recipients list |
| 6 | More | Additional recipient options |

#### Rich Text Editor Toolbar (16 tools)
| # | Tool | Icon | Description |
|---|------|------|-------------|
| 1 | Undo | ↶ | Undo last action |
| 2 | Redo | ↷ | Redo last action |
| 3 | Font family | Arial ▼ | Font family dropdown (default: Arial) |
| 4 | Font size | 16 ▼ | Font size dropdown (default: 16) |
| 5 | Bold | **B** | Bold text |
| 6 | Italic | *I* | Italic text |
| 7 | Underline | U̲ | Underline text |
| 8 | Text color | A̲ | Text color picker |
| 9 | Highlight | 🖍 | Background highlight color |
| 10 | Alignment | ≡ | Text alignment (left/center/right) |
| 11 | Bullet list | • | Unordered list |
| 12 | Numbered list | 1. | Ordered list |
| 13 | Link | 🔗 | Insert hyperlink |
| 14 | Image | 🖼 | Insert image |
| 15 | Table | ⊞ | Insert table |
| 16 | Strikethrough | S̶ | Strikethrough text |
| 17 | @ Variable | @ | Insert variable/merge field |

**Body Placeholder**: "Enter text or type @ to insert a variable..."

#### Action Buttons (Bottom Bar, 6 actions)
| # | Button | Color/Style | Description |
|---|--------|-------------|-------------|
| 1 | 📎 Attach | Grey text | Attach files to email |
| 2 | 🖨 Print | Grey text | Create printable copy (opens PDF generation dialog) |
| 3 | 🟢 Templates | Teal text | Load email template |
| 4 | ≡ Preview | Grey text | Preview email before sending |
| 5 | Discard | Red text | Discard draft |
| 6 | 🕐 Send later | Teal outline button | Schedule email for later |
| 7 | ▶ Send | Green button | Send email immediately |

#### Hidden Dialogs (discovered via accessibility tree)
| Dialog | Description |
|--------|-------------|
| Create a printable copy | PDF generation with radio options + "Generate PDF" button |
| Email preview | Preview with subject, To field, selected recipients |
| Search image gallery | Image search for inline insertion |
| Insert a link | Link URL insertion |
| Browse contacts | Contact browser for recipient selection |
| Recipients list | View and manage selected recipients |
| Schedule send | Schedule future send date/time |
| Name email group | Save recipient selection as named group |
| Error dialog | "The email could not be sent because..." error handling |
| Discard draft | Confirmation: "Permanently discard this draft?" |

---

## 3. Library Documents

**URL**: `/V2/Mgmt/Library/Library.aspx`

### Main Tabs (3)
1. **Active Documents** (default)
2. **Recently Viewed**
3. **Expired Documents**

### Active Documents Page

**Title Bar**: "All Library Documents (Non-Expired)"
- **+ Add New Document** button (green, top right)

#### Options Bar
| Control | Type | Default | Description |
|---------|------|---------|-------------|
| Group by Category | Radio | ◉ Selected | Group documents by category |
| Group by Date | Radio | ○ | Group documents by date |
| Show Viewing Permissions | Checkbox | ☐ | Show who can view each document |
| Select Category | Dropdown | All Categories | Filter by category |
| Text Search | Text input + Search button | Empty | Free text search |

#### Category Dropdown Options (7)
| # | Category | Document Count |
|---|----------|---------------|
| 1 | All Categories | — |
| 2 | Agreements and Waivers | 3 |
| 3 | Amenity Reservation Forms | 0 |
| 4 | Board of Directors Minutes | 0 |
| 5 | Common Announcement Library | 0 |
| 6 | Emergency Information | 0 |
| 7 | Newsletters | 0 |

#### Document Table Columns (8)
| # | Column | Description |
|---|--------|-------------|
| 1 | (Expand) | +/- expand icon to show documents in category |
| 2 | Document Name | Category name with count (e.g., "Agreements and Waivers (3)") |
| 3 | Document Date | When document was created/uploaded |
| 4 | Last Revised On | Last modification date |
| 5 | Expires On | Document expiration date |
| 6 | Last 30 Days No. of Views | View count in last month |
| 7 | Lifetime No. of Views | Total view count |
| 8 | Att./Imp. | Attachments/Importance indicator |

#### Category Actions
- ✏ **Create SubCategory** — per category, create sub-categories
- **- Hide All** / **+ Expand All** — toggle category expansion

---

## 4. Announcements (Modern SPA)

**URL**: `/content-creator/staff`

### Top Bar
- **Create announcement ▼** button (dark green, split button with dropdown, top right)

### Announcement List
Each announcement shows:
| Field | Description |
|-------|-------------|
| Status badge | Color-coded status with date (e.g., "Expired on 12/31/25" with red accent bar) |
| Content preview | Truncated announcement text |
| Channels | Distribution channels (e.g., "Channels: Public Display, Resident Site and Resident App") |

### Pagination
- "Showing 1 to 1 of 1"
- Page navigation: < 1 >
- Items per page: 25 (dropdown)

### Observed Announcements (1)
| Status | Date | Content | Channels |
|--------|------|---------|----------|
| Expired | 12/31/25 | "Welcome to your new resident portal! Please use it for accessing building information, making reques..." | Public Display, Resident Site and Resident App |

### Distribution Channels (3)
1. **Public Display** — Lobby screens / digital signage
2. **Resident Site** — Resident web portal
3. **Resident App** — Mobile application

---

## 5. Emergency Broadcast

**URL**: `/v2/Mgmt/VoiceBroadcast/CreateBroadcast.aspx`

### Main Tabs (3)
1. **Send a Broadcast** (marked "NEW")
2. **View Broadcasts** (default landing)
3. **Authorized Broadcasters**

### View Broadcasts Page

#### Controls
- **+ Send a New Broadcast** button (green)
- ☐ Include Archived Broadcasts (checkbox)

#### Broadcast Calls Table Columns (5)
| # | Column | Description |
|---|--------|-------------|
| 1 | Date | When broadcast was sent |
| 2 | Status | Broadcast status |
| 3 | Message Info | Message content/details |
| 4 | Summary | Broadcast summary |
| 5 | Recipient Info | Recipient details |

- "Click here to refresh your list of Broadcasts."
- "No records to display."

### Send a Broadcast Page
**Permission Required**: Security-Officer level users only
- Error: "You are not authorized to send a broadcast for this building. By default, only Security-Officer level users can send a broadcast. Click on the 'Authorized Broadcasters' tab to see more."

### Support Info
- Phone: (212) 501-7117
- Website: www.buildinglink.com

---

## 6. Manage Surveys

**URL**: `/v2/mgmt/survey/default.aspx`

### Controls
- **Create Survey +** button (green, top right)
- **Show Expired Surveys ▶** button (teal)

### Survey Table Columns (5)
| # | Column | Description |
|---|--------|-------------|
| 1 | Title | Survey title |
| 2 | Status | Active/Expired status |
| 3 | Posted | When survey was published |
| 4 | Expires | Expiration date |
| 5 | # of Respondents | Response count |

### Observed Data
- **0 surveys configured** — "No records to display."

---

## 7. Special Email Groups

**URL**: `/v2/mgmt/communicate/manageemailgroups.aspx`

### Controls
- **◀ Back to the Communicate Page** button (teal)
- **+ Add New Special Email Group** button (green, top right)
- ☐ Show Inactive Special Email Groups (checkbox)

### Groups Table
| Column | Description |
|--------|-------------|
| Group Name | Name of the email group |
| Status | Active/Inactive |
| Action | Edit link |

### Observed Groups (1)
| Group Name | Status | Action |
|------------|--------|--------|
| Tenants | Active | Edit |

---

## 8. Public Display

**URL**: `/v2/Mgmt/EventLog/Default.aspx` (shared with Event Log settings)

*Not deeply explored — links to lobby screen/digital signage configuration.*

### From Dashboard
- Status: "None with an Active Status"

---

## 9. Building Directory

**URL**: `/v2/mgmt/communicate/buildingdirectory.aspx?t=1`

*Not deeply explored — accessible from Communicate sidebar and dashboard.*

---

## 10. Photo Albums

**URL**: `/v2/mgmt/photoalbum/list.aspx`

*Not deeply explored — accessible from Communicate sidebar and dashboard.*

---

## Concierge Design Implications

### From Email/Mailbox Deep Dive
1. **Modern SPA email client** — Full-featured with compose, inbox, sent, drafts, scheduled folders
2. **Notification folders** — Auto-organized by module (Maintenance, Event log, Bulletin board, Amenities, Other) — excellent for filtering system notifications
3. **@ variable insertion** — Merge fields in email body — supports personalized bulk emails
4. **6 recipient targeting options** — Exclude, All occupants, By location, Type/Group, View recipients, More — powerful recipient management
5. **Schedule send** — Future-date email scheduling
6. **Email templates** — Reusable templates for common communications
7. **PDF generation** — Create printable copies of emails
8. **Image gallery** — Inline image insertion from gallery
9. **Table support** — Rich tables in email body

### From Library Deep Dive
1. **6 default document categories** — Agreements and Waivers, Amenity Reservation Forms, Board Minutes, Common Announcements, Emergency Info, Newsletters
2. **View tracking** — 30-day and lifetime view counts per document — useful analytics
3. **Sub-categories** — Hierarchical organization within categories
4. **3 document lifecycle states** — Active, Recently Viewed, Expired

### From Announcements Deep Dive
1. **3-channel simultaneous distribution** — Public Display + Resident Site + Resident App
2. **Auto-expiry** — Announcements expire on set date
3. **Split button creation** — Dropdown on "Create announcement" suggests multiple announcement types

### From Broadcast Deep Dive
1. **Role-based permission** — Only Security-Officer level can send broadcasts
2. **3-tab management** — Send, View history, Authorized broadcasters
3. **Voice + SMS channels** — Multi-channel emergency communication

### From Survey Deep Dive
1. **Simple list management** — Create, track respondents, auto-expire

### From Email Groups Deep Dive
1. **Custom distribution lists** — Beyond standard unit/building groups
2. **Active/Inactive toggle** — Soft delete pattern consistent across platform
