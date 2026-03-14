# My Account — Granular Deep Dive

Field-level documentation of every tab, field, form, and setting in Condo Control's My Account module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Overview

**URL**: `/my/unit`
**Breadcrumb**: Home > My Account
**Page title in browser tab**: "My Account | Condo Control"
**Page icon**: Teal circle with person/profile icon

The My Account page is a tabbed interface with 6 tabs. The page also has 3 sidebar submenu links that navigate to separate pages or specific tabs.

### 1.1 Tab Structure

| # | Tab Name | Hash | Description |
|---|----------|------|-------------|
| 1 | User | `#tab-1` | Profile information (default active tab) |
| 2 | Emergency Contacts | `#tab-2` | Emergency contact records |
| 3 | Vacations | `#tab-4` | Vacation/away periods |
| 4 | Email Signature | `#tab-10` | Rich text email signature for outbound emails |
| 5 | Two Factor Authentication | `#tab-11` | 2FA enable/disable |
| 6 | Recent Account Activity | `#tab-12` | Login audit log |

**Tab numbering note**: Tab hash IDs are not sequential (1, 2, 4, 10, 11, 12) — suggesting some tabs were removed or are hidden for this role.

### 1.2 Sidebar Submenu Links

| # | Sidebar Item | URL | Destination |
|---|-------------|-----|-------------|
| 1 | Change Password | `/change-password.aspx` | Separate page (legacy ASP.NET) |
| 2 | Email Preferences | `/my-account.aspx` | Separate page (legacy ASP.NET) — email notification settings |
| 3 | Package Preferences | `/my/unit#tab-14` | Links to `#tab-14` on the My Account page, but this tab is NOT visible for the Security & Concierge role. Defaults to User tab. Likely a resident-only tab |

**Active indicator**: The currently selected sidebar submenu item has a teal/green left border bar.

---

## 2. Tab 1: User (Profile)

**URL**: `/my/unit` or `/my/unit#tab-1`
**Default tab**: Yes (active when My Account page loads)

### 2.1 Left Column — Profile Fields

Displayed as a label-value table (read-only, not editable from this view).

| # | Field Label | Value (observed) | Type | Notes |
|---|-------------|------------------|------|-------|
| 1 | First Name | Temp | Read-only text | — |
| 2 | Last Name | Concierge | Read-only text | — |
| 3 | Company Name | Royal Concierge and Security | Read-only text | Only shown for staff/vendor accounts |
| 4 | Date of Birth | (empty) | Read-only text | No value set |
| 5 | User Group | Security & Concierge | Read-only text | Determines role and permissions |
| 6 | Email Address | info@royalcas.ca | Read-only text | Primary login email |
| 7 | Unsubscribe from Email Notifications | "Unsubscribe from Email Notifications" | Link (teal text) | Clickable link to unsubscribe |
| 8 | Require Assistance | No | Read-only text | Accessibility/assistance flag |
| 9 | Language Preference | English ✏️ | Read-only text + edit icon | Pencil icon indicates editable. Clicking pencil likely opens language picker |

**Layout note**: Fields are displayed with bold labels right-aligned in left column, values left-aligned in right column, separated by horizontal rules.

### 2.2 Right Column — Phone Numbers

| Field | Value |
|-------|-------|
| **Section title** | Phone Numbers |
| **Section icon** | Phone/handset icon (teal circle) |
| **Content** | "No records to display." |

**Note**: No "Add" button visible — phone numbers may need to be added by an admin, or the feature is disabled for this role.

### 2.3 Right Column — Electronic Consent

| Field | Value |
|-------|-------|
| **Section title** | Electronic Consent |
| **Section icon** | Checkmark/document icon (teal circle) |
| **Content** | "There are no e-consent documents signed." |

**Note**: This section tracks legally required electronic consent documents (e.g., terms of service, privacy agreements). No documents have been signed by this user.

---

## 3. Tab 2: Emergency Contacts

**URL**: `/my/unit#tab-2`

| Field | Value |
|-------|-------|
| **Section title** | Emergency Contacts |
| **Section icon** | Medical cross / phone icon (teal circle) |
| **Content** | "No records to display" |

**Empty state**: Simple text message. No "Add Emergency Contact" button is visible on this view — may be editable by admin only, or available when clicked from a different context.

---

## 4. Tab 3: Vacations

**URL**: `/my/unit#tab-4`

| Field | Value |
|-------|-------|
| **Section title** | Vacations |
| **Section icon** | Suitcase/calendar icon (teal circle) |
| **Content** | "No records to display" |

**Purpose**: Allows residents/users to set vacation periods. During vacations, the system may hold packages, pause notifications, or flag the unit as unoccupied for security awareness.

**Empty state**: Same "No records to display" text. No "Add Vacation" button visible for this role.

---

## 5. Tab 4: Email Signature

**URL**: `/my/unit#tab-10`

### 5.1 Description Text

"Email signature will appear on emails sent to users when posting an Announcement, updating a Service Request or Violation."

**Contexts where signature is used**:
1. Posting an Announcement
2. Updating a Service Request
3. Updating a Violation

### 5.2 Rich Text Editor (CKEditor 5)

| Field | Value |
|-------|-------|
| **Label** | Email Signature: |
| **Editor type** | CKEditor 5 Rich Text Editor |
| **Accessibility label** | "Rich Text Editor, main" |
| **Editor area** | Large textarea (~400px height) |
| **Current content** | Empty |

### 5.3 Editor Toolbar — All Buttons (Left to Right)

**Row 1 (Primary toolbar, always visible)**:

| # | Button | Shortcut | Description |
|---|--------|----------|-------------|
| 1 | Undo | ⌘Z | Undo last change |
| 2 | Redo | ⌘Y | Redo last undone change |
| 3 | Bold | ⌘B | Bold text formatting |
| 4 | Italic | ⌘I | Italic text formatting |
| 5 | Underline | ⌘U | Underline text formatting |
| 6 | Strikethrough | ⌘⇧X | Strikethrough text formatting |
| 7 | Remove Format | — | Removes all formatting from selected text |
| 8 | Bulleted List | — | Insert/toggle bulleted (unordered) list |
| 9 | Numbered List | — | Insert/toggle numbered (ordered) list |
| 10 | Text alignment | — | Dropdown with sub-options |
| 11 | Heading/Paragraph | — | Dropdown, default "Paragraph" |
| 12 | Show more items (⋮) | — | Expands to reveal additional toolbar buttons |

**Text Alignment Sub-options** (dropdown):

| # | Option |
|---|--------|
| 1 | Align left |
| 2 | Align right |
| 3 | Align center |
| 4 | Justify |

**Heading/Paragraph Dropdown Options**:

| # | Option |
|---|--------|
| 1 | Paragraph (default) |
| 2 | Heading 1 |
| 3 | Heading 2 |
| 4 | Heading 3 |

**Row 2 (Expanded via "Show more items" ⋮ button)**:

| # | Button | Description |
|---|--------|-------------|
| 13 | Font Family | Dropdown — see font options below |
| 14 | Font Size | Dropdown — see size options below |
| 15 | Font Color | Color picker for text color, includes "Remove color" option |
| 16 | Font Background Color | Color picker for text highlight/background, includes "Remove color" option |
| 17 | Link | ⌘K — Insert/edit hyperlink |
| 18 | Insert image | Insert image into the editor |

**Font Family Dropdown Options**:

| # | Font |
|---|------|
| 1 | Default |
| 2 | Arial |
| 3 | Courier New |
| 4 | Georgia |
| 5 | Lucida Sans Unicode |
| 6 | Tahoma |
| 7 | Times New Roman |
| 8 | Trebuchet MS |
| 9 | Verdana |

**Font Size Dropdown Options**:

| # | Size |
|---|------|
| 1 | Tiny |
| 2 | Small |
| 3 | Default |
| 4 | Big |
| 5 | Huge |

### 5.4 Save Button

| Button | Color | Type | Action |
|--------|-------|------|--------|
| Save | Teal/dark (filled) | Submit | Saves the email signature |

---

## 6. Tab 5: Two Factor Authentication

**URL**: `/my/unit#tab-11`

| Field | Value |
|-------|-------|
| **Section title** | Two Factor Authentication |
| **Section icon** | Shield/lock icon (teal circle) |
| **Field label** | Enable two factor authentication: |
| **Current value** | No |
| **Edit button** | "Edit" (teal, filled) |

**Observed state**: 2FA is disabled. The "Edit" button presumably opens a form to enable 2FA (likely via email, SMS, or authenticator app — not explored to avoid account changes).

---

## 7. Tab 6: Recent Account Activity

**URL**: `/my/unit#tab-12`

### 7.1 Section Header

| Field | Value |
|-------|-------|
| **Section title** | Recent Account Activity |
| **Section icon** | Clock/history icon (teal circle) |

### 7.2 Activity Table

| # | Column | Description |
|---|--------|-------------|
| 1 | Date & Time | Login timestamp (format: M/DD/YYYY H:MM:SS AM/PM) |
| 2 | Browser / Device | Device/browser identification string |
| 3 | IP Address | IP address of the login attempt |
| 4 | Login Status | "Success" (green text) or "Failed" (red text) |

### 7.3 Observed Data

| Date & Time | Browser / Device | IP Address | Login Status |
|-------------|-----------------|------------|-------------|
| 3/13/2026 8:48:43 PM | Chrome Macintosh | 10.0.1.6 | Success (green) |
| 3/13/2026 8:48:33 PM | Chrome Macintosh | 10.0.1.6 | Failed (red) |
| 3/13/2026 5:28:09 PM | Mobile Application | 10.0.1.4 | Success (green) |
| 3/13/2026 5:28:05 PM | Mobile Application | 10.0.1.4 | Success (green) |
| 3/13/2026 5:27:53 PM | Mobile Application | 10.0.1.4 | Success (green) |
| 3/13/2026 5:24:41 PM | Mobile Application | 10.0.1.6 | Failed (red) |
| 3/13/2026 5:24:33 PM | Chrome Macintosh | 10.0.1.6 | Failed (red) |
| 3/13/2026 5:23:05 PM | Chrome Macintosh | 10.0.1.6 | Failed (red) |
| 3/13/2026 5:22:49 PM | Chrome Macintosh | 10.0.1.6 | Failed (red) |
| 3/13/2026 12:14:01 AM | Chrome Windows 10.0 | 10.0.1.4 | Success (green) |

**Browser / Device values observed**:
1. Chrome Macintosh
2. Mobile Application
3. Chrome Windows 10.0

**Status color coding**:
- **Green text**: "Success" — successful login
- **Red text**: "Failed" — failed login attempt

**Security insight**: Multiple failed logins followed by a success suggests password retry behavior. The system tracks all attempts for audit purposes.

---

## 8. Sub-Page: Change Password

**URL**: `/change-password.aspx?Step=0&UserID={encoded_id}`
**Breadcrumb**: Home > Change Password
**Page title**: "Change Your Password | Condo Control"
**Architecture**: Legacy ASP.NET WebForms page

### Page Layout

Header icon: Teal circle with lock icon
Header text: "Change Your Password"
Subtitle: "Complete this form to change your password."

### Form Fields

| # | Field Label | Type | Required | Notes |
|---|-------------|------|----------|-------|
| 1 | Current password | Password input | Yes | Validates against current password |
| 2 | New password | Password input | Yes | No complexity requirements displayed |
| 3 | Confirm new password | Password input | Yes | Must match New password |

### Form Actions

| Button | Style | Action |
|--------|-------|--------|
| Change Password | Teal filled button | Submits password change |
| Cancel | Teal filled button | Returns to previous page |

### Key Observations
- No password strength meter or complexity requirements shown
- No "show password" toggle on any field
- Uses legacy ASP.NET WebForms architecture (`.aspx` page)
- UserID is encoded/obfuscated in the URL query parameter (e.g., `d0e0dMgdewV`)
- Both buttons have identical teal styling (no visual hierarchy between primary and secondary action)

---

## 9. Sub-Page: Email Preferences

**URL**: `/my-account.aspx?Step=0&UserID={numeric_id}`
**Breadcrumb**: Home > Email Preferences
**Page title**: "My Account Settings | Condo Control"
**Architecture**: Legacy ASP.NET WebForms page

### Page Layout

Header icon: Teal circle with envelope icon
Header text: "Email Preferences"
Description: "The following settings control the types of email notfications you will receive. This setting will not impact critical emails such as password reset notifications."

**Note**: Typo in production — "notfications" instead of "notifications".

### Email Notification Types Table

| # | Module | Email Type | Default (observed) | Toggle |
|---|--------|-----------|-------------------|--------|
| 1 | Amenity Bookings | Email me when a new amenity booking is added. | ✅ ON | Green checkmark |
| 2 | Amenity Bookings | Email me when an amenity booking is cancelled | ❌ OFF | Red X |
| 3 | Announcements | Email me when a new announcement is added. | ✅ ON | Green checkmark |
| 4 | Classified Ads | Email me when a new classified ad is posted for the topic I follow | ✅ ON | Green checkmark |
| 5 | Discussion Forum | Email me when someone replies to my forum thread. | ✅ ON | Green checkmark |
| 6 | Discussion Forum | Email me when the discussion forum/topic I follow is updated | ✅ ON | Green checkmark |
| 7 | Events | Email me when a new event is added. | ✅ ON | Green checkmark |
| 8 | File Library | Email me when a new document is posted. | ✅ ON | Green checkmark |
| 9 | My Account | Email me when a visitor is created or signed out of my unit by Security | ✅ ON | Green checkmark |
| 10 | Security Console | Email me when resident creates a new visitor. | ❌ OFF | Red X |
| 11 | Surveys | Email me when a new survey is posted | ✅ ON | Green checkmark |
| 12 | Unit File | Email me when unit resident is deleted by owner of a unit. | ✅ ON | Green checkmark |

### Table Structure

| Column | Description |
|--------|-------------|
| Toggle icon | Green checkmark (✅) = enabled, Red X (❌) = disabled. Clickable to toggle. |
| Module | The platform module this notification relates to |
| Email Type | Description of the specific email notification |

### Key Observations
- **12 notification types** across 10 modules — significantly more granular than Aquarius (10 types)
- **Module-organized** — Notifications are grouped by platform module, making it clear what each email relates to
- **Toggle-based** — Click the icon to toggle on/off (no save button needed — appears to auto-save)
- **Discussion Forum** has 2 notification types — distinguishes between replies to own thread vs followed topics
- **Amenity Bookings** has 2 types — booking added vs cancelled, separate control
- **Security Console** notification is OFF by default for this concierge role — prevents self-notification loops
- **No SMS/push options** — Email-only notification system, same limitation as Aquarius
- **No frequency control** — No digest vs immediate option
- **No per-building preferences** — Single set of preferences across all properties
- **Critical emails exempted** — Password reset and similar system emails always sent regardless of preferences
- **Typo in production** — "notfications" in the page description

---

## 10. Sub-Page: Package Preferences

**URL**: `/my/unit#tab-14`
**Breadcrumb**: Home > My Account
**Architecture**: Modern SPA (same page as My Account, tab 14)

### Access Restriction
This tab (hash `#tab-14`) is **NOT visible** for the Security & Concierge role. Clicking the "Package Preferences" sidebar link navigates to the My Account page but the tab is not rendered — it defaults to the User tab.

**Likely purpose**: Resident-facing preferences for how packages are handled (e.g., leave at door vs hold at front desk, notification preferences for package arrival). Only visible to Tenant and Owner roles.

### Key Observations
- **Role-gated feature** — The sidebar link is visible but the tab is hidden. This is a UX bug — the link should also be hidden for unauthorized roles
- **Tab 14 is the highest tab ID observed** — Suggests tabs 3, 5, 6, 7, 8, 9, 13 are also hidden tabs for other role-specific features

---

## 11. URL Map (My Account Module)

| Page | URL Pattern |
|------|-------------|
| My Account (User tab) | `/my/unit` or `/my/unit#tab-1` |
| Emergency Contacts tab | `/my/unit#tab-2` |
| Vacations tab | `/my/unit#tab-4` |
| Email Signature tab | `/my/unit#tab-10` |
| Two Factor Authentication tab | `/my/unit#tab-11` |
| Recent Account Activity tab | `/my/unit#tab-12` |
| Package Preferences tab (hidden) | `/my/unit#tab-14` |
| Change Password | `/change-password.aspx?Step=0&UserID={encoded_id}` |
| Email Preferences | `/my-account.aspx?Step=0&UserID={numeric_id}` |

---

## 12. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Login audit trail** — Recent Account Activity shows every login attempt with device, IP, and status. Essential for security in condo environments
2. **Multi-module email preferences** — 12 notification types across 10 modules, individually toggleable. Granular control
3. **Email signature with rich text** — CKEditor 5 with full formatting (fonts, colors, lists, images, links). Professional email outreach
4. **Electronic consent tracking** — Dedicated section for tracking e-consent documents. Legal compliance feature
5. **Two Factor Authentication** — Available as a user-controlled toggle, not forced. User has choice
6. **Module-organized email preferences** — 12 notification types organized by module (Amenity, Announcements, Events, etc.) is clearer than Aquarius's flat list of 10 checkboxes

### What CondoControl Gets Wrong
1. **Role-based tab visibility bug** — Package Preferences sidebar link is visible but the target tab is hidden. Silent failure — should hide the link or show an "unavailable for your role" message
2. **No edit capability on User profile** — Profile fields are all read-only. User can't update their own name, email, or date of birth from this view. Admin dependency
3. **Empty Emergency Contacts with no Add button** — Users can't add their own emergency contacts. This is a critical safety feature that should be self-service
4. **No password requirements shown** — Change Password page doesn't display password complexity requirements. Users have to guess and fail
5. **Legacy ASP.NET pages mixed with modern** — Change Password and Email Preferences use legacy `.aspx` routes while the main account page is modern SPA. Inconsistent experience
6. **Non-sequential tab IDs** — Tab hashes skip numbers (1, 2, 4, 10, 11, 12, 14), suggesting deleted/hidden tabs. Technical debt visible in the URL structure
7. **No phone number self-service** — "No records to display" for phone numbers with no way to add them. Staff communication requires phone numbers
8. **Read-only email preferences** — Must click "Change email preferences" to enter edit mode. Would be better as inline toggles

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~300+*
