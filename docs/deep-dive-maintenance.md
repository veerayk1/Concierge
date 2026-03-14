# Deep Dive: Maintenance / Service Requests Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/service-requests`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/service-requests`
**Page title**: "Service Requests"
**Sidebar label**: "Maintenance"

### Page Layout
1. **Header**: Title "Service Requests" + 1 action button
2. **Filter bar**: Keyword search + status dropdown + Search/Reset Search/Print Requests buttons
3. **Card grid**: 3-column layout of service request cards (Semantic UI `ui centered three cards`)

### Action Button
| Button | Style | Action |
|--------|-------|--------|
| Create Service Request | Filled dark blue | Opens Create Service Request page/modal |

### Filter Bar
| Element | Type | Placeholder | Notes |
|---------|------|-------------|-------|
| Search by keyword | Text input with search icon | "Search by keyword" | Searches request titles/content |
| Status filter | Dropdown (combobox) | "All" | Filter by status (see Section 1.1) |
| Search | Button (filled red) | — | Execute search |
| Reset Search | Button (outlined blue) | — | Reset filters |
| Print Requests | Button (outlined blue) | — | Print service requests list |

### 1.1 Status Filter Options (5 options)
| # | Option | Description |
|---|--------|-------------|
| 1 | Open | Newly created, not yet actioned |
| 2 | Received | Acknowledged by staff |
| 3 | On hold | Temporarily paused |
| 4 | Closed | Resolved/completed |
| 5 | All | Show all statuses (default) |

---

## 2. Service Request Cards

Each service request displays as a Semantic UI `ui fluid raised card`.

### Card Content
| Element | Example | Notes |
|---------|---------|-------|
| Title | "Microwave Broken" | Bold heading, blue text, clickable |
| Status | "Open" | Status label |
| Sent By | "cameronclasper2" | Username of person who submitted |
| Request Type | "In Suite Repairs" | Category of request |
| Priority | "Normal" | Priority level |
| Posted On | "Mar 10, 2026 7:43 PM" | Full datetime with AM/PM |
| Assigned To | (may be empty) | Staff member assigned |

### Card Action Buttons (3 per card, at bottom — below the fold)
| Button | Style | Opens | Purpose |
|--------|-------|-------|---------|
| View | `ui button` | View Service Request modal | Read-only view of the request |
| Update | `ui button` | Update Service Request modal | Edit request fields, add comments |
| Delete | `ui button` | Confirmation dialog (presumed) | Delete the service request |

**Note**: Unlike Announcements (which have no Edit/Delete), Service Requests support full CRUD operations: Create, Read (View), Update, Delete.

**Observation**: 290 total service request cards loaded at once — no pagination visible. All cards rendered in DOM simultaneously.

---

## 3. Create Service Request Form

**Title**: "Create Service Request"
**Trigger**: Click "Create Service Request" button
**Opens**: Full-page form (not a modal — has Back button with left arrow)

### Form Fields (top to bottom)

| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Select Building | Dropdown (combobox) | Yes* | "Bond" | Pre-selected for single-building property |
| 2 | Request Type | Dropdown (combobox) | Yes | — | See Section 3.1 |
| 3 | Priority | Dropdown (combobox) | Yes | — | See Section 3.2 |
| 4 | Assign To | Dropdown (combobox) | Yes | — | Staff members list. See Section 3.3 |
| 5 | Select Unit | Dropdown (combobox) | No | — | Unit numbers (395 units). Searchable |
| 6 | Requested By | Dropdown (combobox) | Yes | — | All residents (2080 users). Format: "Name > (username)" |
| 7 | Title | Text input | Yes | — | Request title |
| 8 | Service Request Details | Textarea | No | — | Placeholder: "Request Details..." |
| 9 | Attach a file | Drag & drop zone | No | — | "Drop files here" |
| 10 | I authorize building staff to enter my suite | Checkbox | No | Unchecked | Permission to enter |
| 11 | Save | Button (filled dark blue) | — | — | Submits the request |

### 3.1 Request Type Options (6 options)
| # | Option |
|---|--------|
| 1 | Service Request |
| 2 | Status Certificate Request |
| 3 | Question |
| 4 | In Suite Repairs |
| 5 | Comment or Suggestion |
| 6 | Other |

### 3.2 Priority Options (4 options)
| # | Option |
|---|--------|
| 1 | Low |
| 2 | Normal |
| 3 | High |
| 4 | Critical |

### 3.3 Assign To Options (29 staff members)
| # | Name | Username |
|---|------|----------|
| 1 | admin pm | adminpm |
| 2 | Arbi Agastra | arbiagastra03 |
| 3 | Elona Charizai | elona |
| 4 | Jetmira Kolndreu | Jetmira |
| 5 | Melissa Minor | melissa |
| 6 | Ray Kodavali | Ray_007 |
| 7 | Shahid Haleem | shahid |
| 8 | Wayne | wayne |
| 9 | Dillan Mohammed | Dillan_Bond |
| 10 | Lasya Priya Somaraju | Lasya |
| 11 | Rayudu | Ray |
| 12 | Ben Steeves | bsteeves |
| 13 | Arnav Nigam | Arnav |
| 14 | Bhavjot Kaur Pal | Bhavjotkaur12 |
| 15 | Temporary Guard | Bond_Concierge |
| 16 | Dhana Lakshmi | Dhana123 |
| 17 | Harikirandeep Kaur | harkirandeep22 |
| 18 | Isha isha | isha1 |
| 19 | Junaid Syed | Junaid_syed |
| 20 | Manpreet Kaur | Kaursidhu123 |
| 21 | Mohammed Mujtaba | Mujtaba7 |
| 22 | Nandhini Alugu | Nandhini |
| 23 | Navjot Kaur | Navjot_Kaur |
| 24 | Nayana Sharma | Nayana2426 |
| 25 | Payal Arora | Payal |
| 26 | Mohammed Abdul Salaam Siddiqui | salaam_19 |
| 27 | Simrandeep Kaur | Simrandeep_15 |
| 28 | Sruthi K | Sruthik |
| 29 | Tejinderpal Singh | Tejinder147 |

**Key insight**: The "Assign To" list contains ALL staff members (property managers, supervisors, guards, temporary staff). There's no role-based filtering — any staff can be assigned any request. Format: "Display Name > (username)".

---

## 4. View Service Request Modal

**Modal title**: "View Service Request"
**Trigger**: Click "View" button on a card
**Style**: Full-width modal with X close button

### Content
| Element | Position | Example | Notes |
|---------|----------|---------|-------|
| Title | Top left, bold | "Microwave Broken" | Bold heading |
| Status | Top right | "Status : Open" | "Open" in red text |
| Priority | Right side | "Priority : Normal" | Below status |
| Assigned To | Right side | "Assigned To :" | May be empty |
| Posted By | Below title | "Posted By : cameronclasper2" | Bold label |
| Requested By | Below Posted By | "Requested By : cameronclasper2" | Bold label |
| Description | Body area | Full request text | Plain text |
| Posted On | Below description | "Posted On : 10-03-2026" | Calendar icon, DD-MM-YYYY format |
| Authorization | Below date | "I authorize building staff to enter my suite : Yes" | Person icon |
| Request Type | Bottom right | "Request Type : In Suite Repairs" | Blue link-style text |
| Comments | Below main content | "Comments" heading | Section for comments (may be empty) |

**Read-only** — no edit/update/delete functionality in this modal.

---

## 5. Update Service Request Modal

**Modal title**: "Update Service Request"
**Trigger**: Click "Update" button on a card
**Style**: Full-width modal with X close button

### Form Fields (top to bottom)

| # | Field | Type | Editable | Pre-filled | Notes |
|---|-------|------|----------|------------|-------|
| 1 | Title | Text input | Yes | Original title | Can modify title |
| 2 | Priority | Dropdown (combobox) | Yes | Original priority | Same 4 options as Create (Low/Normal/High/Critical) |
| 3 | Select Unit | Dropdown (combobox) | Yes | Original unit | Can reassign to different unit |
| 4 | Status | Dropdown (combobox) | Yes | Current status | See Section 5.1 |
| 5 | Request Type | Dropdown (combobox) | Appears disabled* | Original type | Gray text — may be read-only |
| 6 | Assign To | Dropdown (combobox) | Yes | — (empty) | Required*. Same staff list as Create |
| 7 | Requested By | Text input | Read-only | Original requester | Display only, not editable |
| 8 | Request Details | Plain text | Read-only | Original description | Not in an editable field |
| 9 | Comments | Section heading | — | — | Contains comment thread |
| 10 | Post a comment | Textarea | Yes | Empty | Placeholder: "Comment" |
| 11 | Authorization | Plain text | Read-only | — | "Requester authorized building staff to enter his suite : Yes" |
| 12 | Save | Button (outlined blue) | — | — | Saves updates |

### 5.1 Status Options in Update (5 options)
| # | Option | Description |
|---|--------|-------------|
| 1 | Open | Request is active |
| 2 | Received | Staff has acknowledged |
| 3 | On hold | Temporarily paused |
| 4 | Closed | Resolved/completed |
| 5 | All | (Likely a filter artifact — probably shouldn't appear here) |

**Key insight**: The Update form is a hybrid of editable and read-only fields. Title, Priority, Unit, Status, and Assign To can be modified. Request Type appears disabled. Request Details and Requested By are read-only. The Comment system allows staff to add notes without modifying the original request.

---

## 6. Service Request Lifecycle

```
[Create] → Fill form → [Save] → Card appears (Status: Open)
    ↓
[View] — Read-only detail view
    ↓
[Update] — Change status, assign staff, add comments
    │
    ├→ Status: Received (acknowledged)
    ├→ Status: On hold (paused)
    └→ Status: Closed (resolved)
    ↓
[Delete] — Remove request entirely
```

### Key behaviors:
- **Full CRUD** — Unlike Announcements (which are immutable), Service Requests support Create, Read, Update, and Delete
- **Status workflow** — 4 meaningful statuses: Open → Received → On hold → Closed
- **Comment system** — Staff can add comments during Update without modifying original request
- **Suite entry authorization** — Residents can pre-authorize building staff to enter their suite
- **Staff assignment** — Any staff member can be assigned to any request (no role filtering)
- **No auto-notification visible** — No visible toggle for notifying the resident when status changes
- **No photo/document viewing** — The View modal doesn't show any attachments that were uploaded during creation
- **No email tracking** — Unlike Announcements, no Mailing List or Email Failures tracking
- **No reference number** — Unlike Packages, no auto-generated reference number visible

---

## 7. Concierge Design Implications

### Strengths to Preserve
1. **Simple 4-status workflow** — Open/Received/On hold/Closed is clean and intuitive
2. **Comment system** — Staff can communicate about a request without modifying the original
3. **Suite entry authorization** — Important for in-suite repairs, captured at creation time
4. **6 request types** — Categorization helps route requests appropriately
5. **4 priority levels** — Low/Normal/High/Critical with "Critical" for urgent issues
6. **Full CRUD operations** — Can update and delete requests (unlike Announcements)
7. **Staff assignment** — Direct assignment to specific staff member
8. **Card-based grid** — Visual scanning of request status at a glance

### Gaps & Issues to Fix
1. **No photo/document viewing** — Files can be attached at creation but aren't visible in View/Update modals
2. **No email notifications** — No visible notification when request status changes or comments are added
3. **No reference numbers** — Requests have no trackable reference ID (unlike Packages)
4. **No pagination** — 290 cards loaded at once with no pagination. Performance concern at scale
5. **No category-based routing** — "In Suite Repairs" should auto-route to maintenance staff, not require manual assignment
6. **No SLA/deadline tracking** — No due dates, response time targets, or escalation rules
7. **No history/audit log** — No visible change history (who changed status, when)
8. **No attachment management** — Can attach files at creation but can't add more during Update
9. **Request Type appears locked in Update** — Can't reclassify a request after creation
10. **Request Details not editable** — Original description can't be updated by staff
11. **"All" option in Update status dropdown** — Filter option leaking into the status change dropdown
12. **No resident-facing status updates** — No visible mechanism for residents to see status changes in their portal
13. **No work order generation** — No print work order button (unlike BuildingLink's maintenance)
14. **No equipment linkage** — Can't link a request to a building system or equipment
15. **No vendor assignment** — Can only assign to internal staff, not external vendors
16. **No recurring request support** — Can't create recurring maintenance tasks

### Comparison: Aquarius Service Requests vs BuildingLink Maintenance

| Feature | Aquarius | BuildingLink |
|---------|----------|-------------|
| Request types | 6 configurable types | Category + sub-category system |
| Priority levels | 4 (Low/Normal/High/Critical) | Unknown |
| Status workflow | 4 statuses (Open/Received/On hold/Closed) | Multi-status with assignment |
| Photo uploads | At creation only | Yes, with inline viewing |
| Document uploads | At creation only | Yes, multiple attachment points |
| Comments | Plain text comments | Threaded comments with timestamps |
| Staff assignment | Single staff member | Staff + vendor assignment |
| Equipment linkage | No | Yes (equipment tracking module) |
| Work orders | No | Yes (print work order) |
| SLA tracking | No | Unknown |
| Recurring tasks | No | Yes (recurring maintenance) |
| Vendor compliance | No | Yes (insurance tracking) |
| Suite entry auth | Yes (checkbox) | Permission to enter (yes/no + instructions) |
| Reference numbers | No | Yes |
| Card grid view | Yes (3 columns) | List/table view |
| Pagination | No (all loaded) | Yes |
| Email notifications | Not visible | Multi-channel |
| Audit history | Not visible | Change log |
| Delete requests | Yes | Unknown |

---

## 8. Data Model (Deduced)

```
ServiceRequest
├── id (auto-generated, no visible reference number)
├── title (string, required)
├── request_details (text)
├── request_type (enum: Service Request | Status Certificate Request | Question | In Suite Repairs | Comment or Suggestion | Other)
├── priority (enum: Low | Normal | High | Critical)
├── status (enum: Open | Received | On hold | Closed)
├── building_id → Building
├── unit_id → Unit (optional)
├── requested_by → User (resident who submitted)
├── posted_by → User (who created in system — may differ from requested_by)
├── assigned_to → Staff (nullable)
├── authorize_suite_entry (boolean)
├── attachments[] → File (uploaded at creation)
├── comments[] → Comment
│   ├── text
│   ├── posted_by → User
│   └── posted_at (datetime)
├── posted_on (datetime, format: "Mar 10, 2026 7:43 PM" on card, "DD-MM-YYYY" in modal)
└── updated_at (datetime, not visible)
```

---

*Last updated: 2026-03-14*
*Total fields documented: ~40+*
*Dropdown options extracted: 4 (Request Type: 6, Priority: 4, Status: 5, Assign To: 29 staff)*
