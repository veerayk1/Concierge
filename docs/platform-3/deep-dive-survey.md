# Survey — Granular Deep Dive

Field-level documentation of every element in Condo Control's Survey module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/survey/list-surveys/`
**Sidebar menu**: Survey (clipboard/checklist icon)
**Breadcrumb**: Home > Surveys
**Page title**: "Surveys | Condo Control"

The Survey module allows property management to create and distribute surveys/polls to residents and staff. Surveys have lifecycle states (Published, Expired, Inactive).

**Role access**: Security & Concierge has **read access** — can view and search for published surveys. No survey creation or editing capability observed for this role.

---

## 2. Surveys List Page

**URL**: `/survey/list-surveys/`

### 2.1 Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Icon | Teal clipboard/checklist circular icon |
| 2 | Title | "Surveys" — large heading |

### 2.2 Filter Bar

| # | Field | Type | ID/Name | Default | Description |
|---|-------|------|---------|---------|-------------|
| 1 | Search | Text input | (unnamed) | Empty | Free-text search. No placeholder |
| 2 | Status | Select dropdown | `SelectedStatusID` | "All" (0) | Survey status filter (see §2.3) |
| 3 | Search | Button | — | — | Teal `btn-primary`. Type: submit |
| 4 | Reset | Link | — | — | Teal text. Clears filters (href="#") |

### 2.3 Status Dropdown Options (Complete — 4 options)

| # | Value | Label | Description |
|---|-------|-------|-------------|
| 1 | 0 | All | All surveys regardless of status |
| 2 | 2 | Published | Active, live surveys accepting responses |
| 3 | 4 | Expired | Surveys past their end date |
| 4 | 5 | Inactive | Manually deactivated surveys |

**Note**: Status IDs are non-sequential (0, 2, 4, 5). Missing IDs 1 and 3 suggest removed or hidden statuses — possibly "Draft" (1) and "Scheduled" (3) which may only be visible to admin/manager roles.

### 2.4 Results Area

| # | Element | Description |
|---|---------|-------------|
| 1 | Empty state | "No records to display." — plain text message |

**Observed**: No surveys exist for this property (or none are visible to Security & Concierge role). The empty state message is simple text with no call-to-action.

---

## 3. Data Model Observations

### 3.1 Survey Entity (Inferred)

| Field | Type | Description |
|-------|------|-------------|
| SurveyId | Integer | Unique identifier |
| Title | String | Survey title (searchable) |
| Status | Enum | All (0), Published (2), Expired (4), Inactive (5) |
| CreatedDate | DateTime | When the survey was created |
| StartDate | DateTime | When the survey becomes active |
| EndDate | DateTime | When the survey expires |
| Questions | Array | Survey questions |

### 3.2 Survey Status Lifecycle

```
Draft → Published → Expired
                 ↓
              Inactive (manual deactivation)
```

---

## 4. URL Map

| Page | URL Pattern |
|------|-------------|
| Survey list | `/survey/list-surveys/` |

---

## 5. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Status-based filtering** — Published, Expired, Inactive lifecycle states with dropdown filter
2. **Dedicated module** — Surveys have their own sidebar entry, not buried inside another module
3. **Search capability** — Free-text search for finding surveys by title/content

### What CondoControl Gets Wrong
1. **Empty state is unhelpful** — "No records to display" gives no context. Should say "No surveys have been published" or "Check back later for property surveys"
2. **No survey creation for staff** — Security & Concierge can't create quick polls (e.g., "How was your experience today?"). Should allow simple survey creation for staff-facing use cases
3. **No indication of survey count** — Unlike other modules, no count indicator shows how many surveys exist in each status
4. **No search placeholder** — Search input has no placeholder text explaining what can be searched
5. **Missing status values** — IDs 1 and 3 are absent. Likely "Draft" and "Scheduled" are hidden from this role, but the gap suggests incomplete role-based filtering

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~100+*
