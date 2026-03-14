# Unit File — Granular Deep Dive

Field-level documentation of every element in Condo Control's Unit File module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/unit/view-unit-file/`
**Sidebar menu**: Unit File (no icon observed — listed below Security & Concierge in sidebar)
**Breadcrumb**: Home > Unit File (on list page); Home > Unit File > {User Name} (on user detail)
**Page title**: "Unit File | Condo Control" (list); "{Salutation First Last} | Condo Control" (detail)

The Unit File module is a **resident directory** that lists all users (residents, staff, board members, managers) associated with the property. Users are organized by groups and can be searched/filtered.

**Role access**: Security & Concierge has **read-only** access. Can view user profiles, see contact information, emergency contacts, notes, vacations, transactions, and history records. No create/edit/delete functionality observed.

**Total users**: 1,028 (observed via navigation counter "User 649 of 1028")

---

## 2. Unit File List Page

**URL**: `/unit/view-unit-file/`

### 2.1 Filter Bar

| # | Field | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Search | Text input | (unnamed) | Empty | Free-text search. No placeholder |
| 2 | Groups | Select dropdown | `SelectedRoleID` | "All Groups" (0) | 31 group options (see §2.2) |
| 3 | Search Type | Select dropdown | (unnamed) | "Quick search" (0) | 2 options: Quick search (0), Search all fields (1) |
| 4 | Search | Button | — | — | Dark teal `btn-primary`. Type: submit |

### 2.2 Groups Dropdown (Complete — 31 options)

| # | Group Name | Value | Type |
|---|-----------|-------|------|
| 1 | All Groups | 0 | — |
| 2 | Board Members | 34062 | Staff |
| 3 | Constar Information | 83768 | Non Staff |
| 4 | Floor 1 | 35139 | Non Staff |
| 5 | Floor 2 | 35141 | Non Staff |
| 6 | Floor 3 | 35142 | Non Staff |
| 7 | Floor 4 | 35143 | Non Staff |
| 8 | Floor 5 | 35144 | Non Staff |
| 9 | Floor 6 | 35145 | Non Staff |
| 10 | Floor 7 | 35146 | Non Staff |
| 11 | Floor 8 | 35147 | Non Staff |
| 12 | Floor 9 | 35148 | Non Staff |
| 13 | Floor 10 | 35149 | Non Staff |
| 14 | Floor 11 | 35150 | Non Staff |
| 15 | Floor 12 | 35151 | Non Staff |
| 16 | Floor 14 | 35152 | Non Staff |
| 17 | Floor 15 | 35153 | Non Staff |
| 18 | Floor 16 | 35154 | Non Staff |
| 19 | Floor 17 | 35155 | Non Staff |
| 20 | Floor 18 | 35156 | Non Staff |
| 21 | Floor 19 | 35157 | Non Staff |
| 22 | Floor 20 | 35158 | Non Staff |
| 23 | Off-site Owner | 35140 | Non Staff |
| 24 | On-site Owner | 35138 | Non Staff |
| 25 | Owners | 34064 | Non Staff |
| 26 | Payment Administrators | 121106 | Staff |
| 27 | Property Managers | — | Staff |
| 28 | Renters | — | Non Staff |
| 29 | Residents | — | Non Staff |
| 30 | Security & Concierge | — | Staff |
| 31 | Superintendent | — | Staff |

**Group categories observed**:
- **Staff groups** (5): Board Members, Payment Administrators, Property Managers, Security & Concierge, Superintendent
- **Non-Staff groups** (25): Constar Information, Floors 1-20 (excluding Floor 13), Off-site Owner, On-site Owner, Owners, Renters, Residents

**Note**: Floor 13 is missing from the floor list — building likely skips floor 13 (common superstition-based numbering).

### 2.3 Search Type Dropdown

| # | Value | Label | Description |
|---|-------|-------|-------------|
| 1 | 0 | Quick search | Searches name fields only (fast) |
| 2 | 1 | Search all fields | Searches all user fields (slower, more comprehensive) |

### 2.4 Users Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | Unit | No | Unit number (e.g., "1001", "0103"). Empty for staff users |
| 2 | Name | No | Last, First Salutation format (e.g., "Gopalakrishan, Ramakrishna Ganapathy Mr."). Teal link to user detail page. Below: company name if applicable (e.g., "Royal Concierge and Security") |
| 3 | Groups | No | User group memberships. Multiple groups shown line by line (e.g., "Owners\nResidents\nOn-site Owner\nFloor 1") |
| 4 | Username/Phone | No | Email address (teal mailto: link) + phone numbers with type labels. Format: "(XXX) XXX-XXXX(Type)" where Type = Cell, Home, Work, Other |
| 5 | Offsite Address | No | Offsite/mailing address if available |

**Name format**: "Last, First Salutation" (e.g., "Pang, Ho Ki Mr.")
**Phone format**: "(437) 223-4489(Cell)" — number followed by type in parentheses
**Multiple phones**: Shown line by line under the email address

**Special indicators**:
- **"Invalid Email"** — shown in red text below name when email validation fails
- **Company name** — shown below user name in regular text when user has a company association

**Table header style**: Light grey background (different from dark teal used in other modules).

### 2.5 User Link URL Pattern

**URL**: `/user/view-user-details/{hashedId}`
**Example**: `/user/view-user-details/8LjM40Jgp6n`

**Note**: User IDs are hashed/encoded strings, not sequential integers. This prevents enumeration attacks.

### 2.6 Pagination

Not observed on the list page — appears to load all users visible for the current role. Staff users (no unit) are listed first, followed by residents organized by unit number.

---

## 3. User Detail Page

**URL**: `/user/view-user-details/{hashedId}`
**Page title**: "{Salutation First Last} | Condo Control"
**Breadcrumb**: Home > Unit File > {Salutation First Last}

### 3.1 Navigation

| # | Element | Description |
|---|---------|-------------|
| 1 | << Previous User | Button. Navigates to previous user in list |
| 2 | User X of Y | Text. Shows current position (e.g., "User 649 of 1028") |
| 3 | Next User >> | Button. Navigates to next user in list |

### 3.2 User Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Avatar icon | Teal circular person icon (default, no photo upload observed) |
| 2 | Full name | Large heading: "{Salutation} {First} {Last}" (e.g., "Mr. Ho Ki Pang") |

### 3.3 Tabs (6 tabs)

| # | Tab | Hash | Description |
|---|-----|------|-------------|
| 1 | User | `#tab-1` | Default. Basic user information |
| 2 | Emergency Contacts | `#tab-2` | Emergency contact records |
| 3 | Vacations | `#tab-4` | Vacation/away records |
| 4 | Notes | `#tab-7` | Staff-only notes |
| 5 | Transactions | `#tab-9` | Account balance and payment history |
| 6 | History Records | `#tab-8` | Audit trail of user changes |

**Note**: Tab IDs are non-sequential (1, 2, 4, 7, 9, 8) — suggests tabs 3, 5, 6 were removed or are hidden for this role.

---

## 4. User Tab (#tab-1)

### 4.1 Left Column — User Fields

| # | Label | Type | Example Value | Description |
|---|-------|------|---------------|-------------|
| 1 | First Name: | Read-only text | Ho Ki | First name |
| 2 | Last Name: | Read-only text | Pang | Last name |
| 3 | Commonly used name: | Read-only text | (empty) | Nickname or preferred name |
| 4 | Company Name: | Read-only text | (empty) | Company affiliation |
| 5 | Date of Birth: | Read-only text | (empty) | Date of birth |
| 6 | User Groups: | Read-only text (multi-line) | Owners, Floor 11 | Group memberships |
| 7 | Email Address: | Read-only link (mailto) | chiantipang@gmail.com | Email (teal link) |
| 8 | Language Preference: | Read-only text | English | UI language preference |
| 9 | Email Status: | Read-only text | Subscribed | Email subscription status |
| 10 | Registration Code: | Read-only text | HHXK9T | Self-registration code |
| 11 | Registration Code Status: | Read-only text | Not Used | Whether code has been used |
| 12 | Require Assistance: | Read-only text | No | Accessibility/assistance flag |
| 13 | User Login Status: | Read-only text | Registration incomplete | Account registration status |

### 4.2 Right Column — Widget Sections

| # | Widget | Icon | Description |
|---|--------|------|-------------|
| 1 | Related Units | Building icon (teal) | Units associated with this user. Empty: "There are no related units." |
| 2 | Phone Numbers | Phone icon (teal) | Phone numbers with types. Empty: "There are no phone numbers." |
| 3 | Parcel Waivers | Clipboard icon (teal) | Parcel waiver documents. Empty: "There are no parcel waivers." |
| 4 | Electronic Consent | Checkmark icon (teal) | E-consent status. Empty: "There are no e-consent documents signed." |

---

## 5. Emergency Contacts Tab (#tab-2)

### 5.1 Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | Section heading | "Emergency Contacts" with phone/emergency icon (teal) |
| 2 | Empty state | "There are no emergency contacts." |

**When populated**: Would display a table or list of emergency contact records with name, relationship, phone number, etc.

---

## 6. Vacations Tab (#tab-4)

### 6.1 Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | Section heading | "Vacations" with travel/calendar icon (teal) |
| 2 | Empty state | "There are no vacations." |

**When populated**: Would display vacation/away date ranges for the user.

---

## 7. Notes Tab (#tab-7)

### 7.1 Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | Section heading | "User Notes" with note icon (teal) |
| 2 | Info banner | Light blue banner: "Notes are visible only to staff and administrators. Owners and residents cannot view notes" |
| 3 | Empty state | "There are no note records for this user." |

**Access note**: Notes are staff/admin-only. This is critical — it's where concierge staff can add internal notes about residents (e.g., "Unit 815 has a dog that bites").

---

## 8. Transactions Tab (#tab-9)

### 8.1 Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | Section heading | "Transactions" with wallet/credit icon (teal) |
| 2 | Info banner | Light blue banner: "To get account balance, please click on the 'Get Account Balance' button below" |
| 3 | Unit: | Select dropdown | Unit selection for balance lookup |
| 4 | Get Account balance | Button | Grey outlined button. Retrieves account balance for selected unit |

**Note**: Account balance lookup is unit-specific. Users with multiple units can switch between them.

---

## 9. History Records Tab (#tab-8)

### 9.1 History Table

| # | Column | Description |
|---|--------|-------------|
| 1 | Date / Time | Action timestamp. Format: M/DD/YYYY H:MM:SS AM/PM |
| 2 | Who | Email address of person who made the change |
| 3 | Action | Action type (e.g., "Created", "Changed group membership") |
| 4 | Details | Description of the change |

**Observed action types**:
- "Created" — "User created."
- "Changed group membership" — "Added user '{email}' to group '{GroupName}'."

---

## 10. Data Model Observations

### 10.1 User Entity

| Field | Type | Description |
|-------|------|-------------|
| UserId | String (hashed) | Encoded unique identifier (e.g., "8LjM40Jgp6n") |
| FirstName | String | First name |
| LastName | String | Last name |
| Salutation | String | Mr., Mrs., Ms., etc. |
| CommonlyUsedName | String | Nickname/preferred name (optional) |
| CompanyName | String | Company affiliation (optional) |
| DateOfBirth | Date | Date of birth (optional) |
| EmailAddress | String | Primary email |
| EmailStatus | Enum | Subscribed, Unsubscribed |
| LanguagePreference | String | UI language (e.g., "English") |
| RegistrationCode | String | Self-registration code (6-char alphanumeric, e.g., "HHXK9T") |
| RegistrationCodeStatus | Enum | Not Used, Used |
| RequireAssistance | Boolean | Accessibility/assistance flag |
| UserLoginStatus | Enum | "Registration incomplete", likely also "Active", "Suspended" |
| UserGroups | Array | List of group memberships |
| PhoneNumbers | Array | Phone number objects with type (Home, Cell, Work, Other) |
| RelatedUnits | Array | Associated unit numbers |
| ParcelWaivers | Array | Parcel waiver documents |
| ElectronicConsent | Array | E-consent signed documents |

### 10.2 Group Entity

| Field | Type | Description |
|-------|------|-------------|
| GroupId | Integer | Unique identifier (e.g., 34062, 35139) |
| GroupName | String | Display name with type suffix (e.g., "Floor 11 (Non Staff)") |
| IsStaff | Boolean | Staff (true) or Non Staff (false) |

### 10.3 Phone Number Types

| Type | Description |
|------|-------------|
| Cell | Mobile phone |
| Home | Home/landline |
| Work | Work phone |
| Other | Other phone type |

---

## 11. URL Map

| Page | URL Pattern |
|------|-------------|
| Unit File list | `/unit/view-unit-file/` |
| User detail | `/user/view-user-details/{hashedId}` |

---

## 12. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Hashed user IDs in URLs** — `/user/view-user-details/8LjM40Jgp6n` prevents enumeration. Good security practice
2. **6-tab user profile** — User info, Emergency Contacts, Vacations, Notes, Transactions, History. Comprehensive user view
3. **Staff-only notes** — "Notes are visible only to staff and administrators. Owners and residents cannot view notes." Critical for per-user front desk instructions
4. **Group-based filtering** — 31 groups including per-floor groups. Can quickly find all residents on Floor 15 or all Board Members
5. **Quick search vs Search all fields** — Two search modes: fast name-only search and comprehensive all-fields search
6. **User navigation** — "<< Previous User | User 649 of 1028 | Next User >>" for sequential browsing without returning to list
7. **Registration code system** — 6-character registration codes (e.g., "HHXK9T") with used/not-used status. Self-service onboarding
8. **Multiple phone number types** — Home, Cell, Work, Other. Each phone number has a type label
9. **History Records audit trail** — Full audit log of who created/modified user records and when
10. **Parcel Waivers widget** — Dedicated section for parcel waiver documents per user
11. **Electronic Consent tracking** — E-consent document signing status visible on user profile
12. **Account balance lookup** — Transactions tab with per-unit account balance retrieval
13. **Invalid Email indicator** — Red "Invalid Email" text shown when email validation fails. Proactive data quality

### What CondoControl Gets Wrong
1. **No unit-centric view** — The "Unit File" is actually a **user directory**, not a unit directory. Can't click on a unit to see all residents, common elements, vehicles, etc. in that unit
2. **Missing Floor 13** — Floor groups skip from Floor 12 to Floor 14. While this is the building's numbering, the system should not expose this gap to avoid confusion
3. **No pagination on list page** — Appears to load all users for current role. Could be slow with 1028 users
4. **Group labels include "(Staff)" and "(Non Staff)"** — Internal categorization leaks into the UI. Users shouldn't see role-type annotations
5. **Tab IDs non-sequential** — Tabs are numbered 1, 2, 4, 7, 9, 8. Indicates removed/hidden tabs (3, 5, 6). Tab ordering in DOM doesn't match display order
6. **No photo/avatar** — Default teal person icon for all users. No profile photo upload visible
7. **No inline editing** — All fields are read-only for Security & Concierge. Should allow staff to update phone numbers, add notes, or flag changes
8. **Transactions tab is minimal** — Just a unit dropdown and "Get Account balance" button. No transaction history table, no payment details
9. **No search placeholder** — Search text input has no placeholder text
10. **No export** — Cannot export the user list to CSV/Excel for offline reference
11. **Name format is "Last, First"** — Less natural than "First Last". Column header just says "Name"
12. **Company shown under name** — "Royal Concierge and Security" appears under the user name like a subtitle. Should be a separate column or clearly labeled

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~350+*
