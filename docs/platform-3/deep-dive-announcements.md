# Announcements — Granular Deep Dive

Field-level documentation of every element in Condo Control's Announcements module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/announcement/show-list/`
**Sidebar menu**: Announcements (megaphone icon)
**Breadcrumb**: Home > Announcements (on list page); Home > Announcements > View Announcement (on detail page)
**Page title**: "Announcements | Condo Control"

**Role restriction**: Security & Concierge role has **read-only** access. Cannot create, edit, or delete announcements. Navigating to `/announcement/create` or `/announcement/template-landing` redirects to Home dashboard.

---

## 2. Announcement List Page

**URL**: `/announcement/show-list/`

### 2.1 Filter Bar

| # | Field | Type | ID/Name | Default | Options/Behavior |
|---|-------|------|---------|---------|------------------|
| 1 | Search | Text input | (unnamed) | Empty | Free-text search. No placeholder text |
| 2 | Status | Select dropdown | `selectedAnnouncementStatus` / `SelectedAnnouncementStatus` | "Current Announcements" | Current Announcements (1), Past Announcements (3), All Announcements (4) |
| 3 | Search | Button | — | — | Teal `btn-primary`. Applies filters |
| 4 | Reset | Link | — | — | Teal text link. Navigates to `/announcement/show-list` (clears filters) |

### 2.2 Announcement Type Checkboxes

Below the filter bar, two checkboxes filter by announcement type.

| # | Checkbox | ID | Name | Default | Description |
|---|----------|----|------|---------|-------------|
| 1 | Regular Announcement | `checkBoxRegularAnnouncement` | `RegularAnnouncementSelected` | ☑ Checked | Standard announcements |
| 2 | Customized Announcement | `checkBoxBudgetMailOutAnnouncement` | `CustomizedAnnouncementSelected` | ☑ Checked | Custom/targeted announcements (ID references "BudgetMailOut" — legacy naming) |

**Note**: The internal name `checkBoxBudgetMailOutAnnouncement` suggests "Customized Announcement" was originally "Budget Mail Out" — a targeted mailing feature.

### 2.3 Announcements Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | Title | No | Teal link text — clickable, navigates to `/announcement/detail/{announcementId}`. Below the title: preview of announcement body (first ~80 characters, truncated with "...") |
| 2 | Time and Date Posted | No | Two lines: Posted date (format: M/DD/YYYY H:MM:SS AM/PM) and Expires date (format: "Expires: M/DD/YYYY H:MM:SS AM/PM") |

**Observed announcements**:

| # | Title | Body Preview | Posted | Expires |
|---|-------|-------------|--------|---------|
| 1 | Possible noise during unit renovation - 12th Floor | Dear Residents, Please be advised that renovation work will be taking place in one of the units ... | 2/11/2026 2:29:44 PM | 3/19/2026 11:59:59 PM |
| 2 | Friendly Reminder: Renovation Notification | Dear Residents, We hope this message finds you well.We would like to kindly remind residents tha... | 12/22/2025 12:43:57 PM | 1/1/2027 11:59:59 PM |
| 3 | Window Condensation & Humidity Control | Dear Residents,We have recently received concerns regarding condensation forming on interior wind... | 11/25/2025 11:19:00 AM | 6/30/2028 11:59:59 PM |

**Table behavior**:
- No sorting on columns
- Title is clickable link to detail page
- Body preview is plain text (HTML stripped), truncated
- Sorted by date descending (most recent first)

### 2.4 Pagination

Below the table.

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | First | Button/link | Navigate to first page |
| 2 | Previous | Button/link | Navigate to previous page |
| 3 | Page number(s) | Button | Current page highlighted in teal/blue. Format: "1" |
| 4 | Next | Button/link | Navigate to next page |
| 5 | Last | Button/link | Navigate to last page |

**Pagination style**: `First | Previous | [1] | Next | Last`

**Note**: Only 1 page observed (3 announcements). No total count displayed.

---

## 3. Announcement Detail Page

**URL**: `/announcement/detail/{announcementId}`
**Example**: `/announcement/detail/1370276`
**Page title**: "{Announcement Title} | Condo Control"
**Breadcrumb**: Home > Announcements > View Announcement

### 3.1 Announcement Header

Two-row header section with key metadata.

**Row 1**:

| # | Field | Position | Format | Value (observed) |
|---|-------|----------|--------|------------------|
| 1 | Title: | Left | Label + value | "Possible noise during unit renovation -12th Floor" |
| 2 | Expires: | Right | Label + value | "3/19/2026 11:59:59 PM" (format: M/DD/YYYY H:MM:SS AM/PM) |

**Row 2**:

| # | Field | Position | Format | Value (observed) |
|---|-------|----------|--------|------------------|
| 1 | Posted: | Left | Label + value | "2/11/2026 2:29:44 PM" |
| 2 | Posted By: | Right | Label + value | "Mr. Fazal Mehmood" (includes salutation) |

### 3.2 Details Section

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Details: | Label + body | Full announcement body text. Plain text with line breaks preserved. No rich text formatting observed in this example |

### 3.3 History Section

Audit trail table below announcement body.

**Section heading**: "History" (clock icon, teal)

| # | Column | Description |
|---|--------|-------------|
| 1 | Date / Time | Action timestamp |
| 2 | Who | Email of actor |
| 3 | Action | Action type |
| 4 | Details | Additional info |

**Observed**: "There are no history records for this section." — History appears empty for announcements viewed by Security & Concierge role (may only log admin edits).

### 3.4 Action Buttons

**None observed** for Security & Concierge role. The detail page is purely read-only — no Edit, Delete, Duplicate, or Share buttons visible.

---

### 3.5 Alert Banner (Conditional)

When an announcement is saved as a draft (by a higher-privileged role), a banner appears:

| # | Element | Description |
|---|---------|-------------|
| 1 | Alert banner | Light blue/info background. Text: "The announcement was saved as a draft. No notifications were sent out." |

**Note**: This banner is present in the DOM but may only be visible when navigating from a draft-save action. It indicates the platform supports draft announcements that don't trigger notifications.

### 3.6 Users List Section

Below the History section, an additional section exists:

| # | Element | Description |
|---|---------|-------------|
| 1 | Section heading | "Users List" — tracks which users/groups the announcement was distributed to |

**Note**: This section was observed in the DOM structure but may be empty or role-restricted for Security & Concierge. It likely shows the distribution list (which user groups or specific users received the announcement).

---

## 4. Create Announcement (Role-Restricted)

**URL**: `/announcement/create`
**Access**: Redirects to Home dashboard (`/my/my-home`) for Security & Concierge role.

**URL**: `/announcement/template-landing`
**Access**: Redirects to Home dashboard (`/my/my-home`) for Security & Concierge role.

### 4.1 Create Announcement Dialog (Modal)

A creation dialog exists in the DOM (hidden for this role) with **3 options**:

| # | Option | URL | Description |
|---|--------|-----|-------------|
| 1 | Regular Announcement | `/announcement/create` | Standard free-form announcement creation |
| 2 | Pick from our templates | `/announcement/template-landing` | Template-based announcement creation |
| 3 | Budget mailout | `/budgetmailout/choose-data` | Specialized mailout for budget/financial communications |

**Note**: All three options redirect to the Home dashboard for Security & Concierge role. The dialog is a Bootstrap modal triggered by a "Create Announcement" button that is either hidden or absent for this role. The `budgetmailout` URL suggests the platform supports targeted financial communications (likely for board-to-owner budget mailings).

Both regular and template creation require a higher role (likely Property Manager or Admin).

---

## 5. Data Model Observations

### 5.1 Announcement Entity

| Field | Type | Description |
|-------|------|-------------|
| AnnouncementID | Integer | Unique identifier (e.g., 1370276, 1332698, 1309706) |
| Title | String | Announcement title |
| Details | HTML/Text | Full announcement body. Supports rich text (HTML) |
| Posted | DateTime | Publication date/time (M/DD/YYYY H:MM:SS AM/PM) |
| Expires | DateTime | Expiry date/time. Far-future dates used for long-running announcements (e.g., 6/30/2028) |
| PostedBy | String | Author name with salutation (e.g., "Mr. Fazal Mehmood") |
| Type | Enum | Regular Announcement or Customized Announcement (legacy: BudgetMailOut) |
| Status | Derived | Current (not expired) or Past (expired). Based on Expires vs current date. IDs: Current=1, Past=3, All=4 |

### 5.2 Status Filter IDs

| Status | ID | Description |
|--------|----|-------------|
| Current Announcements | 1 | Announcements where Expires > now |
| Past Announcements | 3 | Announcements where Expires < now |
| All Announcements | 4 | No date filter |

**Note**: ID 2 is skipped — possibly a deleted or hidden status (e.g., "Draft"?).

---

## 6. URL Map

| Page | URL Pattern |
|------|-------------|
| Announcement list | `/announcement/show-list/` |
| Announcement detail | `/announcement/detail/{announcementId}` |
| Create announcement (role-restricted) | `/announcement/create` |
| Template landing (role-restricted) | `/announcement/template-landing` |
| Budget mailout (role-restricted) | `/budgetmailout/choose-data` |

---

## 7. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Simple, clean list** — Title + preview + dates. No unnecessary columns or visual clutter
2. **Expiry dates** — Every announcement has an expiry. Prevents stale content from lingering
3. **Type filtering** — Regular vs Customized checkboxes allow filtering by announcement type
4. **Status filtering** — Current/Past/All dropdown is practical for managing announcement lifecycle
5. **Posted By with salutation** — Shows full name with honorific ("Mr. Fazal Mehmood"). Professional touch
6. **Template-based creation** — Platform supports announcement templates (though not accessible to this role)

### What CondoControl Gets Wrong
1. **No create button visible on list page** — Even if restricted, the list page should indicate that creation exists somewhere. The create links are hidden in the DOM with no UI affordance
2. **No edit/delete from Security & Concierge role** — Completely read-only. A Concierge should at minimum be able to draft announcements for manager approval
3. **No attachments** — Announcements are text-only. No file attachments, images, or embedded media observed
4. **No notification channel indicators** — No indication of how the announcement was distributed (email, push, in-app only). Can't tell if residents were actually notified
5. **No read receipts or engagement metrics** — No "Viewed by X residents" or "Read by X%" counter
6. **Expiry time always 11:59:59 PM** — All observed expiry times are 11:59:59 PM. Suggests the expiry date picker doesn't allow time selection (always sets to end of day)
7. **Body preview lacks formatting** — HTML stripped from preview, causing words to run together (e.g., "well.We" and "wind...")
8. **No categories or tags** — Announcements can't be categorized (e.g., maintenance, events, safety). Only Regular vs Customized types
9. **Empty History section** — History table present but empty for all observed announcements. May only populate for admin actions, making it useless for view-only roles
10. **No search placeholder** — Search text input has no placeholder text, making its purpose unclear without the label
11. **Status ID gap** — IDs are 1, 3, 4 (skipping 2). Suggests possible "Draft" status that was removed or hidden

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~200+*
