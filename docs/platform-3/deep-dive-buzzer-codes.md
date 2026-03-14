# Buzzer Codes — Granular Deep Dive

Field-level documentation of every element in Condo Control's Buzzer Codes sub-module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/list-items.aspx?type=BuzzerCode`
**Sidebar menu**: Buzzer Codes (sub-item under Unit File — no icon, indented)
**Breadcrumb**: Home > List Buzzer Codes (list page); Home > List Buzzer Codes > Buzzer Code Details (detail page)
**Page title**: "Buzzer Codes | Condo Control | Condo Control | Condo Control" (list — note triple "Condo Control" title bug); "Buzzer Code {Code} | Condo Control | Condo Control" (detail)

The Buzzer Codes module is a **legacy ASP.NET page** (`/list-items.aspx`) that lists all buzzer/intercom codes assigned to residents. It uses the older ASP.NET WebForms architecture (evidenced by `__doPostBack` JavaScript calls for sorting).

**Role access**: Security & Concierge has **read-only** access. Can view and search buzzer codes. No create, edit, or delete functionality observed.

**Total buzzer codes**: 271 (observed via detail page "1 of 271" counter)

---

## 2. Buzzer Codes List Page

**URL**: `/list-items.aspx?type=BuzzerCode`

### 2.1 Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Title | "Buzzer Codes" — large h1 heading (no icon) |

### 2.2 Search Bar

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Search | Text input | Free-text search. No placeholder, no label |
| 2 | search | Button | Dark teal `btn-primary`. Text: "search" (lowercase). Type: submit |

### 2.3 Buzzer Codes Table

| # | Column | Sortable | Sort Method | Description |
|---|--------|----------|-------------|-------------|
| 1 | (icon) | No | — | Small teal grid/view icon per row. Links to detail page: `view-item.aspx?type=BuzzerCode&id={id}` |
| 2 | User | Yes | `__doPostBack(..., 'Sort$User.LastName')` | User name with unit number. Format: "LAST, First (Unit#)" (e.g., "MacMILLAN, Kathryn Elaine (0101)"). Teal link text (clickable column header) |
| 3 | Code | Yes | `__doPostBack(..., 'Sort$BuzzerCode1')` | Buzzer/intercom code (numeric, e.g., 1001, 1002). Teal link text (clickable column header) |
| 4 | Comments | No | — | Optional comments field. Empty for most observed entries |

**Table header style**: Light grey background with teal link text for sortable columns.

**Sort mechanism**: ASP.NET WebForms `__doPostBack` — triggers a server-side page reload. Full postback control ID: `ctl00$ctl00$ContentPlaceHolder1$ContentPlaceHolder1$GridView1`.

### 2.4 Observed Data Patterns

| User Format | Code Pattern | Description |
|-------------|-------------|-------------|
| LAST, First (Unit#) | 4-digit number | Standard resident entry |
| LAST, First Salutation (Unit#) | 4-digit number | With salutation |
| Last, First (Unit#) | 4-digit number | Mixed case last names |

**Code numbering pattern**:
- Codes appear to follow unit numbering: Unit 0101 → Code 1001, Unit 0102 → Code 1002, Unit 0104 → Code 1004
- Code = 1000 + last 3 digits of unit number (for first-floor units)
- Higher floors follow same pattern: Unit 0202 → Code 1011, Unit 0203 → Code 1012
- Some units have multiple residents with the same buzzer code (e.g., Unit 0105 has two residents, both Code 1005)

**Sample data** (first 10 visible rows):

| User | Code | Comments |
|------|------|----------|
| MacMILLAN, Kathryn Elaine (0101) | 1001 | — |
| CHOW, Show-King (Jocelyn) (0102) | 1002 | — |
| JEHAN, Afroz (0104) | 1004 | — |
| Ashraf, Rushda (0105) | 1005 | — |
| Ashraf, Sayed (0105) | 1005 | — |
| Hristovski, Vesela Ms. (0113) | 1009 | — |
| JEGAPIRAGASAM, Mangayarkaras (0115) | 1010 | — |
| JEGAPIRAGASM, Thatchayanan/Mangaya (0115) | 1010 | — |
| Hosein, Leary Mr. (0202) | 1011 | — |
| DABRIEL, Shirley Mrs. (0203) | 1012 | — |

### 2.5 Pagination

| # | Element | Description |
|---|---------|-------------|
| 1 | Page | Text label "Page" |
| 2 | Page number input | Text input showing current page number |
| 3 | "of {totalPages}" | Text showing total pages (e.g., "of 11") |
| 4 | Navigation arrows | First, Previous, Next, Last buttons (arrow icons) |
| 5 | Results per page | Dropdown with options: 5, 15, 25, 50, 100 |

**Default results per page**: 25 (11 pages × 25 ≈ 275, close to the 271 total)

**Pagination style**: Inline controls in the table header/footer area — not the standard CondoControl pagination style. Uses legacy ASP.NET GridView pagination.

### 2.6 Results Per Page Options

| # | Value | Description |
|---|-------|-------------|
| 1 | 5 | Minimal rows |
| 2 | 15 | Small page |
| 3 | 25 | Default |
| 4 | 50 | Medium page |
| 5 | 100 | Large page |

---

## 3. Buzzer Code Detail Page

**URL**: `/view-item.aspx?type=BuzzerCode&id={id}`
**Example**: `/view-item.aspx?type=BuzzerCode&id=97565`
**Page title**: "Buzzer Code {Code} | Condo Control | Condo Control"
**Breadcrumb**: Home > List Buzzer Codes > Buzzer Code Details

### 3.1 Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Title | "Buzzer Code {Code}" — h1 heading (e.g., "Buzzer Code 1001") |
| 2 | Counter | "X of Y" text below title (e.g., "1 of 271") |

### 3.2 Navigation Buttons

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | ◀ Previous | Teal filled button | Navigate to previous buzzer code |
| 2 | ▶ Next | Teal filled button | Navigate to next buzzer code |
| 3 | Back to List | Dark/black filled button | Return to list page |

### 3.3 Detail Fields

| # | Label | Type | Example Value | Description |
|---|-------|------|---------------|-------------|
| 1 | User: | Read-only text | MacMILLAN, Kathryn Elaine (0101) | User name with unit number |
| 2 | Code: | Read-only text | 1001 | Buzzer code number |
| 3 | Comments: | Read-only text | (empty) | Optional notes about this buzzer code |

**Layout**: Two-column table — Label column (grey text, right-aligned) | Value column (left-aligned text).

### 3.4 Action Buttons

**None observed** for Security & Concierge role. Page is read-only. No Edit, Delete, or Update buttons visible.

---

## 4. Data Model Observations

### 4.1 Buzzer Code Entity

| Field | Type | Description |
|-------|------|-------------|
| ItemID | Integer | Unique identifier (e.g., 97559, 97560, 97565). Sequential integers |
| ItemType | String | "BuzzerCode" (URL parameter) |
| BuzzerCode1 | String/Integer | The actual buzzer code number (e.g., 1001, 1012) |
| User | Object | Associated user with LastName, FirstName, UnitNumber |
| Comments | String | Optional free-text comments |

### 4.2 URL Parameters

| Parameter | Description |
|-----------|-------------|
| `type` | Item type identifier. Observed: "BuzzerCode". Suggests other types may use same infrastructure (e.g., "FOB", "Key", "Remote") |
| `id` | Unique item ID (integer) |

**Note**: The URL pattern `/list-items.aspx?type=BuzzerCode` and `/view-item.aspx?type=BuzzerCode&id={id}` suggests a **generic item management system**. The `type` parameter indicates the same ASP.NET page handles multiple item types. Other possible types (not observed in sidebar): FOB, Key, Remote, ParkingPermit.

### 4.3 Legacy ASP.NET Indicators

| Indicator | Evidence |
|-----------|----------|
| `.aspx` file extension | `list-items.aspx`, `view-item.aspx` |
| `__doPostBack` sorting | `__doPostBack('ctl00$ctl00$ContentPlaceHolder1$ContentPlaceHolder1$GridView1','Sort$...')` |
| Nested ContentPlaceHolder | Double `ContentPlaceHolder1` nesting — master page → content page → grid |
| GridView control | `GridView1` control ID for the data table |
| Page title triple repeat | "Buzzer Codes \| Condo Control \| Condo Control \| Condo Control" — master page title concatenation bug |

---

## 5. URL Map

| Page | URL Pattern |
|------|-------------|
| Buzzer Codes list | `/list-items.aspx?type=BuzzerCode` |
| Buzzer Code detail | `/view-item.aspx?type=BuzzerCode&id={id}` |

---

## 6. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Dedicated buzzer code directory** — Quick lookup for concierge when a visitor needs to buzz a resident. Critical operational tool
2. **User-to-code mapping** — Each entry links a user (with unit number) to their buzzer code. Clear association
3. **Sortable columns** — User and Code columns are sortable. Can sort by code to find a specific buzzer number or by user name
4. **Sequential navigation** — Previous/Next buttons on detail page with "X of 271" counter. Can browse through all codes
5. **Search** — Free-text search to quickly find a specific resident's buzzer code
6. **Configurable page size** — 5, 15, 25, 50, 100 results per page options

### What CondoControl Gets Wrong
1. **Legacy ASP.NET page** — Uses `.aspx` WebForms while the rest of the platform uses modern SPA routes. Inconsistent architecture and slower full-page postbacks for sorting
2. **Triple title bug** — "Buzzer Codes | Condo Control | Condo Control | Condo Control" — master page title concatenation error. Should be "Buzzer Codes | Condo Control"
3. **No unit-based lookup** — Can only search by text (user name or code). Can't filter by floor or unit range. A concierge needs "What's the buzzer for Unit 1505?" — must search "1505" and hope it matches
4. **Integer IDs in URL** — `/view-item.aspx?type=BuzzerCode&id=97565` exposes sequential integers. Unlike the hashed IDs in the Unit File module, these can be enumerated
5. **Comments field always empty** — All observed entries have empty comments. Field exists but isn't being used. Could hold useful info like "Use after 10 PM" or "Deaf resident — ring twice"
6. **No bulk export** — Cannot export the full buzzer code list to print for the front desk binder
7. **Name format inconsistent** — Mix of "LAST, First" (all caps last), "Last, First" (title case), "Last, First Salutation" (with Mr./Mrs.). No standardization
8. **Multiple residents share one code** — Unit 0105 has two entries (Ashraf, Rushda and Ashraf, Sayed) both with code 1005. Should show as one entry with multiple residents, not duplicate rows
9. **Code-to-unit mapping not obvious** — Buzzer code 1009 maps to Unit 0113. The pattern isn't intuitive — should display both the buzzer code and unit number prominently
10. **No "last updated" timestamp** — Cannot tell when a buzzer code was last verified or updated

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~200+*
