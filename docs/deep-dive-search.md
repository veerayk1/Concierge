# Deep Dive: Search Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/search`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/search`
**Page title**: "Search"
**Sidebar label**: "Search"

### Page Layout
1. **Header**: Instruction text "Type and press enter to search"
2. **Search bar**: Full-width text input with search icon (magnifying glass)
3. **Left panel**: Search filters (Building, Search Type, Search Options)
4. **Right panel**: Results area with "Search" tab label + pagination

### Search Bar
| Element | Type | Placeholder | Behavior |
|---------|------|-------------|----------|
| Search input | Text input | "Type and press enter to search" | Press Enter to execute search |
| Search icon | Magnifying glass icon | — | Visual indicator (right side) |

**Note**: There are TWO search bars — one in the top navigation (global) and one on the `/search` page (dedicated). The top nav search bar has the same "Type and press enter to search" placeholder.

---

## 2. Search Filters (Left Panel)

### 2.1 Select Building
| Element | Type | Notes |
|---------|------|-------|
| Bond | Checkbox | Pre-checked for single-building property |

**Key insight**: For multi-building properties, this section would show multiple building checkboxes allowing search across specific buildings.

### 2.2 Search Type
| # | Option | Default | Description |
|---|--------|---------|-------------|
| 1 | Full Search | Yes (Default) | Searches across all selected module data types |
| 2 | Unit/People Search | No | Searches only unit and resident/people data |

**Dropdown**: MUI combobox with 2 options (Full Search, Unit/People)

**Key behavior**: Selecting "Unit/People" hides the Search Options checkboxes entirely — the search is automatically scoped to people/unit data only. Selecting "Full Search" reveals the Search Options checkboxes.

### 2.3 Search Options (Full Search mode only)
All checkboxes are **checked by default**. Users can uncheck specific modules to narrow search scope.

| # | Option | Default | Data Source |
|---|--------|---------|-------------|
| 1 | General Logs | ✓ Checked | General log entries |
| 2 | Incident Logs | ✓ Checked | Incident log entries |
| 3 | Fire Logs | ✓ Checked | Fire log entries |
| 4 | Noise Logs | ✓ Checked | Noise log entries |
| 5 | Advertisements | ✓ Checked | Advertisement posts |
| 6 | Maintenance Requests | ✓ Checked | Service request entries |
| 7 | Library | ✓ Checked | Library files/documents |

**Key insight**: Search covers 7 data types across 4 log types + 3 other modules. Notably absent from search: Announcements, Events, Packages, Store orders, Surveys, Security Menu data (parking violations, etc.).

---

## 3. Search Results — Full Search Mode

### Pagination
| Element | Description |
|---------|-------------|
| Results counter | "Showing 1 - 10 of {N} results" (green text) |
| Page size | Fixed at 10 results per page |
| Page buttons | « (first), ‹ (prev), 1, 2, 3, 4, 5, ... N, › (next), » (last) |
| Current page | Highlighted/bordered page number |

### Result Card Format — Incident Log
| Field | Label | Example |
|-------|-------|---------|
| Title | "Title :" | "dog pooped in GF vestibule" |
| Action button | "View Incident Log" | Red/dark button (right side) |
| Building badge | — | "Bond" (teal badge) |
| Event Date | "Event Date :" | "25-03-2022 16:55" |
| Unit # | "Unit #:" | "3001" |
| Author | "Author:" | "kdkaur" |
| Details | "Details:" | Full text of the log entry (can be long) |
| Created On | "Created On:" | "March 25, 2022 6:11 PM" |

### Result Card Format — General Log
| Field | Label | Example |
|-------|-------|---------|
| Title | "Title :" | (log title) |
| Action button | "View General Log" | Button (right side) |
| Building badge | — | "Bond" (teal badge) |
| Event Date | "Event Date :" | Date/time |
| Unit # | "Unit #:" | Unit number |
| Author | "Author:" | Username |
| Details | "Details:" | Full text |
| Created On | "Created On:" | Date/time |

### Result Card Format — Maintenance Request
| Field | Label | Example |
|-------|-------|---------|
| Title | "Title :" | "No heat" |
| Action button | "Go To Maintenance Requests" | Button (right side) |
| Building badge | — | "Bond" (teal badge) |
| Assigned To | "Assigned To :" | "Ray" |
| Unit # | "Unit# :" | "2402" |
| Requested By | "Requested By:" | "Alexandria_2402" |
| Request Type | "Request Type:" | "Service Request" |
| Priority | "Priority:" | "High" |
| State | "State:" | "Closed" |
| Details | "Details:" | Full text of request |

### Result Card Action Buttons (4 types observed)
| Button | Style | Navigates To |
|--------|-------|-------------|
| View Incident Log | Red/dark | Incident log detail |
| View General Log | — | General log detail |
| Go To Maintenance Requests | — | Maintenance requests page |
| View Profile | — | User profile page |

**Key insight**: Action buttons vary by result type. Log entries use "View {Type} Log", Maintenance uses "Go To Maintenance Requests", and Unit/People results have "View Profile". Each button navigates to the source module.

---

## 4. Search Results — Unit/People Search Mode

### Result Card Format — Resident
| Field | Label | Example |
|-------|-------|---------|
| Result Id | "Result Id:" | "demo", "LynchB_2302" (username, right-aligned) |
| Resident Name | "Resident Name :" | Linked name (blue hyperlink) — e.g., "management", "Braydon Lynch" |
| Building badge | — | "Bond" (teal badge) |
| Unit Number | "Unit Number :" | "9999", "2302", "1211", "3106" |
| Group | "Group :" | "owner", "tenant", "Offsite Owner" |
| Email | "Email:" | Email address |
| Front Desk Instructions | "Front Desk Instructions:" | Per-unit staff notes (can be blank) |
| Mobile Phone | "Mobile Phone:" | Phone number (can be blank) |
| Home Phone | "Home Phone:" | Phone number (can be blank) |
| Work Phone | "Work Phone:" | Phone number (can be blank) |

**Key insight**: Unit/People search exposes resident PII directly in search results — name, email, phone numbers, unit number. The "Resident Name" is a clickable link (likely navigates to user profile). The "Result Id" field shows the user's username. Front Desk Instructions appear inline — critical for concierge use.

---

## 5. Search Behavior

### Key behaviors:
- **Enter to search** — Must press Enter to execute (no auto-suggest/typeahead)
- **Building-scoped** — Results filtered by selected building(s)
- **Module-filtered** — Full Search mode allows toggling which modules to search
- **Full-text search** — Searches title, details, author, and other text fields
- **Paginated** — 10 results per page with full pagination controls
- **No sorting** — No visible sort options (relevance-based by default?)
- **No date range** — No date filter to narrow results by time period
- **No advanced search** — No boolean operators, field-specific search, or wildcards visible
- **Cross-module results** — Different result types mixed together (logs + maintenance + etc.)
- **Rich result cards** — Full details displayed inline, not just titles

---

## 6. Concierge Design Implications

### Strengths to Preserve
1. **Cross-module search** — Single search across multiple data types
2. **Building scoping** — Search within specific buildings
3. **Module filtering** — Toggle which data types to include
4. **Two search modes** — Full Search vs Unit/People serves different needs
5. **Rich result cards** — Full details inline saves clicks
6. **Pagination** — 10 per page with full navigation controls
7. **Front desk instructions in people results** — Critical context for concierge staff
8. **Action buttons per result type** — Direct navigation to source module

### Gaps & Issues to Fix
1. **No auto-suggest/typeahead** — Must type full query and press Enter
2. **No date range filter** — Can't narrow by time period
3. **No sorting options** — Can't sort by date, relevance, type
4. **No advanced search** — No boolean operators, field-specific queries
5. **Missing modules** — Announcements, Events, Packages, Store, Surveys NOT searchable
6. **No result type grouping** — Different types mixed together, no grouping/tabs per type
7. **No search history** — No recent searches or saved queries
8. **No result highlighting** — Search terms not highlighted in results
9. **Only 4 log types searchable** — Missing Cleaning Logs and Visitor Logs from search options
10. **No export** — Can't export search results
11. **No result count per type** — Shows total count but not breakdown by type
12. **PII exposed in results** — Unit/People search shows emails and phone numbers directly

---

## 7. Data Model (Deduced)

```
Search Module
├── Search Input
│   ├── query (string — free text)
│   └── trigger (Enter key press)
├── Search Filters
│   ├── buildings[] (checkbox, multi-select)
│   ├── search_type (enum: "Full Search" | "Unit/People")
│   └── search_options[] (checkboxes — Full Search mode only)
│       ├── General Logs (boolean)
│       ├── Incident Logs (boolean)
│       ├── Fire Logs (boolean)
│       ├── Noise Logs (boolean)
│       ├── Advertisements (boolean)
│       ├── Maintenance Requests (boolean)
│       └── Library (boolean)
├── Search Results
│   ├── total_count (number)
│   ├── page_size (10, fixed)
│   ├── current_page (number)
│   └── results[] → SearchResult
│       ├── result_type (Log | MaintenanceRequest | Resident)
│       ├── title (string)
│       ├── details (text)
│       ├── building (string)
│       ├── action_button (type-specific navigation)
│       └── type-specific fields (see Section 3 & 4)
└── Pagination
    ├── first_page
    ├── prev_page
    ├── page_numbers[]
    ├── next_page
    └── last_page
```

---

*Last updated: 2026-03-14*
*Search types: 2 (Full Search, Unit/People)*
*Searchable modules: 7 (4 log types + Advertisements + Maintenance + Library)*
*Result card formats: 4 (Incident Log, General Log, Maintenance Request, Resident)*
