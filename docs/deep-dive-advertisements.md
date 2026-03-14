# Deep Dive: Advertisement Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/advertisements`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/advertisements`
**Page title**: "Advertisement"
**Sidebar label**: "Advertisement"

### Page Layout
1. **Header**: Title "Advertisement" + 2 action buttons
2. **Filter**: Approval status dropdown (top right)
3. **Content area**: Card grid of advertisements (currently empty)

### Action Buttons
| Button | Style | Action |
|--------|-------|--------|
| + Create Advertisements | Filled dark blue | Opens Create Advertisements form page |
| Approve Advertisements | Outlined blue | Opens Unapproved Advertisements modal |

### Filter Dropdown
| # | Option | Description |
|---|--------|-------------|
| 1 | All | Show all advertisements (default) |
| 2 | Approved | Show only approved advertisements |
| 3 | Unapproved | Show only unapproved advertisements |

### Empty State
"No advertisements to show" — plain text, no illustration or CTA.

---

## 2. Create Advertisements Form

**Title**: "Create Advertisements"
**Trigger**: Click "+ Create Advertisements" button
**Opens**: Full-page form (not a modal — has Back button with left arrow)

### Approval Notice (top of form)
> "Please note that your post will need to be approved by the Property Manager before appearing on the site. Please allow at least 2 business days for them to review."

**Key insight**: Advertisements require Property Manager approval before publication. This is a moderation workflow — residents submit, managers approve.

### Form Fields (top to bottom)

| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Select building | Dropdown (combobox) | Yes | — | Building selection. Options: "TSCC 2584 > Bond" |
| 2 | Select Category | Dropdown (combobox) with X clear | Yes | "Biz" | See Section 2.1 |
| 3 | Title | Text input | Yes | — | Advertisement title |
| 4 | Advertisement Details | Textarea | Yes | — | Placeholder: "Advertisement Body..." |
| 5 | Attach any files | Drag & drop zone | No | — | "Max 4 files can be attached. Once you click the button select all files at once by pressing the CTRL button on windows or CMD button on a Mac)" |
| 6 | Price | Text input | No | — | "You can also mention that it's free or the interested person may contact" — Placeholder: "Provide a price (optional)" |
| 7 | I agree to term and conditions? | Checkbox | Yes | Unchecked | Required acceptance before posting |
| 8 | Post | Button (filled dark blue) | — | — | Submits the advertisement for approval |

### 2.1 Category Options (10 options)
| # | Option | Description |
|---|--------|-------------|
| 1 | Biz | General business advertisement |
| 2 | Biz dog walkers | Dog walking services |
| 3 | Biz Housekeepers | Housekeeping services |
| 4 | Biz Other | Other business services |
| 5 | Locker for rent | Locker space available for rent |
| 6 | Locker wanted | Looking for locker space |
| 7 | Parking for rent | Parking spot available for rent |
| 8 | Parking wanted | Looking for parking spot |
| 9 | Personal items for sale by resident | Resident selling personal items |
| 10 | Other | Miscellaneous |

**Key insight**: Categories are a mix of **marketplace** (buy/sell/rent) and **services** (business advertising). The "wanted/for rent" pairing for Lockers and Parking creates a natural supply/demand matching system. This is essentially a **classifieds board** for the building.

---

## 3. Approve Advertisements Modal (Unapproved Advertisements)

**Modal title**: "Unapproved Advertisements"
**Trigger**: Click "Approve Advertisements" button
**Style**: Full-width modal with X close button

### Table Columns
| Column | Notes |
|--------|-------|
| Approve: | Checkbox or button to approve (action column) |
| Title | Advertisement title |
| Advertisement Category | Category from creation |
| Advertisement Details | Body text |
| Expiry Date | When the advertisement expires |
| Building | Building name |
| Price | Listed price |
| Author | Who created the advertisement |
| Created On: | Creation date |

**Note**: Currently empty — no unapproved advertisements in the queue.

---

## 4. Advertisement Lifecycle

```
[Resident creates ad] → [Pending approval] → [PM reviews in Approve modal]
    ↓                                              ↓
[Post button]                              [Approve] → Ad appears on site
                                           [Reject?] → (mechanism not visible)
```

### Key behaviors:
- **Approval workflow** — Advertisements require Property Manager approval before publication
- **2 business day SLA** — Notice tells residents to allow 2 business days for review
- **Terms and conditions** — Required agreement before posting
- **Category-based classifieds** — Mix of services and marketplace listings
- **Expiry dates** — Advertisements have expiry dates (visible in approval table)
- **File attachments** — Max 4 files, multi-select supported
- **Price field** — Optional, free-text (can say "free" or "contact me")
- **No rich text editor** — Simple textarea, unlike Announcements' WYSIWYG editor
- **No edit/delete visible** — No visible mechanism to edit or delete posted advertisements
- **No search** — No keyword search on the advertisements listing page

---

## 5. Concierge Design Implications

### Strengths to Preserve
1. **Approval workflow** — Property Manager moderation prevents spam/inappropriate content
2. **Category system** — 10 categories covering services and marketplace needs
3. **Supply/demand pairing** — "Parking for rent" / "Parking wanted" creates natural matching
4. **File attachments** — Photos for items being sold
5. **Price field** — Flexible text field for pricing
6. **Terms and conditions** — Legal protection for the building

### Gaps & Issues to Fix
1. **No rejection mechanism visible** — How does a PM reject an ad? No reject button or reason field visible
2. **No notification** — No visible notification when ad is approved or rejected
3. **No edit capability** — Residents can't edit their posted ads
4. **No expiry management** — How are expiry dates set? Not visible in create form
5. **No search or filter by category** — Only approval status filter, no category filter
6. **No contact mechanism** — No built-in messaging between interested parties
7. **Plain textarea** — No rich text formatting for ad descriptions
8. **No image preview** — File attachments are drag-and-drop but no preview visible
9. **No flagging** — No way for residents to flag inappropriate ads
10. **No "sold" or "taken" status** — No way to mark an item as sold or a need as fulfilled
11. **No auto-expiry** — No visible auto-cleanup of old advertisements

### Comparison: Aquarius Advertisements vs BuildingLink Classifieds

| Feature | Aquarius | BuildingLink |
|---------|----------|-------------|
| Approval workflow | Yes (PM approval required) | Unknown |
| Categories | 10 (services + marketplace) | Unknown |
| Rich text | No (plain textarea) | Unknown |
| File attachments | Yes (max 4 files) | Unknown |
| Price field | Yes (optional, free text) | Unknown |
| Search | No | Unknown |
| Edit/Delete | Not visible | Unknown |
| Terms acceptance | Yes (required checkbox) | Unknown |
| Expiry dates | Yes (in approval table) | Unknown |
| Contact mechanism | No built-in | Unknown |

---

## 6. Data Model (Deduced)

```
Advertisement
├── id (auto-generated)
├── title (string, required)
├── advertisement_details (text, required)
├── category (enum: 10 options — Biz, Biz dog walkers, etc.)
├── building_id → Building
├── price (string, optional — free-text)
├── attachments[] → File (max 4 files)
├── author → User (who created)
├── approval_status (enum: Approved | Unapproved)
├── approved_by → User (PM who approved, nullable)
├── approved_at (datetime, nullable)
├── expiry_date (date — visible in approval table, not in create form)
├── terms_accepted (boolean, required true)
├── created_on (datetime)
└── updated_at (datetime)
```

---

*Last updated: 2026-03-14*
*Total fields documented: ~15*
*Dropdown options extracted: 2 (Category: 10 options, Approval Status: 3 options)*
