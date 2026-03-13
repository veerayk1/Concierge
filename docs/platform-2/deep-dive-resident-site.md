# Resident Site Module — Granular Deep Dive

Field-level documentation of every dropdown, button, form field, and configuration option in BuildingLink's Resident Site management module.

---

## Overview

The Resident Site module allows property management to configure, moderate, and preview the resident-facing portal. It has 4 sub-pages accessible from the sidebar.

### Sidebar Sub-Navigation (4 links)
1. **Home** — `/v2/Mgmt/dashboard/residentportalhome.aspx`
2. **Approve postings** — `/V2/Mgmt/Postings/ApprovePostings.aspx?t=1`
3. **Offers & services** — `/v2/mgmt/providers/ExternalOffers.aspx`
4. **View resident site** — `/v2/mgmt/Dashboard/RedirectToTenant.aspx` (redirects to resident portal)

---

## 1. Resident Site Home

**URL**: `/v2/Mgmt/dashboard/residentportalhome.aspx`

### Dashboard Actions (5 items)
| # | Action | Icon | Description |
|---|--------|------|-------------|
| 1 | Approve Postings | 📋 | Review and moderate resident bulletin board posts |
| 2 | Manage Offers and Services | 🏷 | Manage vendor offers displayed to residents |
| 3 | View/Create Survey Questions | ✅ | Create and manage resident surveys |
| 4 | Manage Photo Albums | 📷 | Building photo galleries |
| 5 | Manage Library Documents | 📚 | Document library for residents |

### Cross-Module Links
- Survey Questions links to Communicate > Surveys module
- Photo Albums links to Communicate > Photo Albums
- Library Documents links to Communicate > Library Documents

---

## 2. Approve Postings

**URL**: `/V2/Mgmt/Postings/ApprovePostings.aspx?t=1`

### Main Tabs (4)
1. **Pending Approval** (default) — Posts awaiting moderator review
2. **Approved** — Published posts visible to residents
3. **Rejected** — Posts that were declined
4. **Expired** — Posts past their expiration date

### Posting Management
Each posting shows:
| Field | Description |
|-------|-------------|
| Posted By | Resident name and unit (e.g., "Unit 324 - Anastasiia Lazarchuk") |
| Posted Date | When the post was submitted |
| Category | Posting category (e.g., "For Sale", "Services", "Events") |
| Subject | Post title/subject line |
| Content | Post body text |
| Expiration | When the post expires |
| Status | Pending/Approved/Rejected/Expired |

### Moderation Actions
- **Approve** — Publish the post to the resident bulletin board
- **Reject** — Decline the post (optionally with reason)
- **Edit** — Modify post before approving

### Observed Data
- At least 1 posting observed in Pending Approval tab
- Posting categories include resident marketplace and community-oriented categories

---

## 3. Offers & Services (Resident Services & Offers)

**URL**: `/v2/mgmt/providers/ExternalOffers.aspx`

**Title**: "Resident Services & Offers"

### Main Tabs (3)
1. **Offers** (default)
2. **Directory of Local Businesses**
3. **Settings**

### Offers Tab — Sub-Navigation (5 links)
| # | Link | Count | Description |
|---|------|-------|-------------|
| 1 | Vendor - Created Offers | (0) | Offers created by vendors/providers |
| 2 | Offers created by your building | (0) | Property-created offers for residents |
| 3 | Pending Offers | (0) | Offers awaiting approval |
| 4 | Offers rejected by your building | — | Previously rejected vendor offers |
| 5 | Preview what Residents see | — | Preview the resident-facing offers page |

### Current Vendor Offers Section
**Title**: "Current Vendor Offers"
**Description**: "This page displays all Offers created by Vendors that are viewable by the residents of your building."
**Note**: "(Reminder: there are 0 Pending Offers you can choose to accept from.)"

**Status indicator**: "Offers displayed to the residents of your building. (* only offers that are currently in effect are displayed to residents)"

### Filter
| Control | Type | Default | Description |
|---------|------|---------|-------------|
| Filter by category | Dropdown | All Categories | Filter offers by category |

### Observed Data
- **0 vendor-created offers** — "There are no offers to display"
- **0 building-created offers**
- **0 pending offers**

---

## 4. View Resident Site

**URL**: `/v2/mgmt/Dashboard/RedirectToTenant.aspx`

**Description**: Redirects staff to the resident-facing portal for preview purposes. Allows management to see exactly what residents see when they log in.

---

## Resident Posting Categories (configured)

Based on the Approve Postings settings, properties can configure categories for resident bulletin board posts. Common categories include:
- For Sale
- Services Offered
- Services Wanted
- Events
- Lost & Found
- General Discussion
- Recommendations

---

## Concierge Design Implications

### From Resident Site Deep Dive
1. **4-tab moderation workflow** for postings — Pending → Approved/Rejected → Expired
2. **Resident bulletin board** with category-based posting — community marketplace feature
3. **Vendor offers platform** — local business can create offers for building residents, property approves
4. **Preview capability** — staff can see resident-facing site without switching accounts
5. **Cross-module integration** — Surveys, Photo Albums, Library Documents shared with Communicate module
6. **5 dashboard actions** — focused on content management and resident engagement
7. **Vendor offer approval workflow** — properties control what commercial offers residents see
8. **Directory of Local Businesses** — curated local business directory for residents
9. **Category filtering** for offers — organized by service type
10. **Moderation-first approach** — all resident content goes through approval before publishing
