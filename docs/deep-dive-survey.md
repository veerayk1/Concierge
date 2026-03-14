# Deep Dive: Survey Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/surveys`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/surveys`
**Page title**: "Survey"
**Sidebar label**: "Survey"

### Page Layout
1. **Header**: Blue clipboard icon + Title "Survey" + 1 action button
2. **Building filter**: "Select building:" dropdown (combobox)
3. **Survey list**: Card-style list of existing surveys (vertical stack)

### Action Button
| Button | Style | Action |
|--------|-------|--------|
| + Create New Survey | Outlined blue with white background, dark blue text | Opens Create New Survey modal |

---

## 2. Survey List (Card View)

Each survey is displayed as a card with the following fields:

### Survey Card Fields
| Field | Example | Notes |
|-------|---------|-------|
| Icon | Blue clipboard icon | Left side of card |
| Survey Name | "Bond Holiday Party Survey" | Bold title |
| Status Banner | "EXPIRED!" | Orange/yellow banner when expired |
| Status Message | "The survey has expired and is not visible to residents anymore." | Italic text below status |
| Visible to Owners | "Yes" or "No" | Whether owners can see the survey |
| Visible to Tenants | "Yes" or "No" | Whether tenants can see the survey |
| Expiry Date | "Nov 30, 2023 12:00 AM" | When the survey expires |
| Created On | "Nov 24, 2023 10:15 AM" | When the survey was created |
| Updated On | "Nov 30, 2023 12:00 AM" | Last update timestamp |
| View button | "View" | Outlined blue button (right side) |

### Existing Surveys (5 surveys observed)
| # | Survey Name | Visible Owners | Visible Tenants | Expiry Date | Created On |
|---|-------------|----------------|-----------------|-------------|------------|
| 1 | Bond Holiday Party Survey | Yes | Yes | Nov 30, 2023 | Nov 24, 2023 |
| 2 | Delivery Driver Access | Yes | Yes | Nov 29, 2023 | Nov 14, 2023 |
| 3 | Electric Vehicle Charging - Owner Survey Question | Yes | No | Sep 28, 2023 | Sep 11, 2023 |
| 4 | Electric Vehicle Charging - Owner Survey Question (duplicate) | Yes | No | Sep 26, 2023 | Sep 5, 2023 |
| 5 | Electric Vehicle Charging | Yes | No | Mar 4, 2022 | Feb 17, 2022 |

**Key insights**:
- All 5 surveys are **EXPIRED** — no active surveys at the time of observation
- Surveys targeting owners only (EV Charging) have "Visible to Tenants: No"
- The "Updated On" timestamp matches the Expiry Date for most surveys (auto-updated on expiry)
- Duplicate survey names exist (#3 and #4) — no uniqueness enforcement on survey titles

---

## 3. Survey View Modal (Results View)

**Modal title**: "Survey View"
**Trigger**: Click "View" button on a survey card
**Style**: Full-width modal with X close button

### Summary Section
| Field | Value | Notes |
|-------|-------|-------|
| Completion count | "Your survey has been completed by 21 unit/units" | Counts by unit, not individual responses |
| Question count | "Your survey had 6 Questions" | Total questions in survey |

### Action Button
| Button | Style | Notes |
|--------|-------|-------|
| Download Survey Report | Outlined button | Downloads report (likely Excel/PDF) |

### Questions Display
Questions are displayed as a numbered list with their answer options shown as bullet points.

**Sample Survey: "Bond Holiday Party Survey" (6 questions)**

| # | Question | Answer Type | Options |
|---|----------|-------------|---------|
| 1 | Did you attend last year's holiday party? | Single choice | YES, NO |
| 2 | What would make you want to attend this year's holiday party? | Single choice (with email fallback for multi-select) | Age Demographic, Dance floor and/or music, Video Games, Golf Simulator, Karaoke, Billiards, Snacks foods and beverages, Raffles\Prizes, Other |
| 3 | Approximately how many people would attend with you (including non-Bond residents)? | Single choice | Just me, 1, 2 |
| 4 | Would you be open to having a family-friendly event earlier in the day? | Single choice | YES, NO |
| 5 | What would be some of the activities you would like to see during the family-friendly event? | Single choice (with email fallback) | Santa Claus, Treats\Candies, Games, Face Painting, Other |
| 6 | Do you have any food restrictions and/or allergies? | Single choice (with email fallback) | YES, NO |

**Key insight**: The survey system only supports **single-choice (radio button) questions**. For questions requiring multiple answers, the workaround is asking residents to email the property manager separately. This is noted in the question text itself: "If you have multiple answers to this question, please send an email to: ray@iconpm.ca". This is a significant limitation.

---

## 4. Create New Survey Modal

**Modal title**: "Create New Survey"
**Trigger**: Click "+ Create New Survey" button
**Style**: Full-width modal with X close button and blue progress bar at top

### Form Fields (Step 1: Survey Metadata)
| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Select Building | Dropdown (combobox) | Yes | "Bond" (pre-selected) | Building selection |
| 2 | Brief Survey Description | Text input | Yes* (red asterisk) | — | Placeholder: "Brief Survey Description" |
| 3 | Expiry Date and Time | Date picker with X clear | No | Today's date (14-03-2026) | Format: DD-MM-YYYY |
| 4 | Visible to Owners | Checkbox | — | Checked (✓) | Default ON |
| 5 | Visible to Tenants | Checkbox | — | Unchecked | Default OFF |
| 6 | Save | Button (outlined blue) | — | — | Saves survey metadata, likely proceeds to question builder |

**Key insight**: Survey creation is a **2-step process**:
1. Step 1 (this modal): Set survey metadata (name, expiry, visibility)
2. Step 2 (after save): Add questions with answer options (question builder — not observed directly)

**Visibility model**: Binary owner/tenant targeting. Unlike Events (which use 16 user groups) or Announcements (which use 9 recipient groups with AND/OR logic), surveys have a simpler 2-checkbox visibility model.

---

## 5. Survey Lifecycle

```
[PM creates survey] → Step 1: Metadata (name, expiry, visibility)
    ↓
[PM adds questions] → Step 2: Question builder (add questions + options)
    ↓
[Survey goes live] → Visible to selected groups (owners/tenants)
    ↓
[Residents respond] → One response per unit
    ↓
[Survey expires] → Status changes to "EXPIRED!"
    ↓
[PM views results] → Survey View modal with completion count
    ↓
[PM downloads report] → "Download Survey Report" button
```

### Key behaviors:
- **Per-unit responses** — Counted by "unit/units", not individual residents
- **Expiry-based** — Surveys automatically expire at the set date/time
- **Binary visibility** — Only Owners and/or Tenants (no granular group targeting)
- **Single-choice only** — Questions support only single answer selection
- **Report download** — Survey results can be downloaded as a report
- **No edit visible** — No "Edit" or "Delete" buttons on survey cards (only "View")
- **No response viewing** — Cannot see individual responses, only aggregate count
- **No mandatory questions** — No indication of required vs optional questions
- **No question types** — Only multiple choice observed (no free text, rating scales, etc.)

---

## 6. Concierge Design Implications

### Strengths to Preserve
1. **Per-unit response tracking** — Counts by unit, preventing duplicate responses from same unit
2. **Expiry dates** — Automatic survey closing after deadline
3. **Visibility targeting** — Control who sees the survey (owners vs tenants)
4. **Report download** — Export survey results
5. **Simple creation flow** — 2-step process (metadata → questions)

### Gaps & Issues to Fix
1. **Single-choice only** — No multi-select, free text, rating scales, matrix, or ranking questions
2. **No multi-select workaround** — PM has to tell residents to email separately for multi-select answers
3. **Binary visibility** — Only Owners/Tenants; no targeting by floor, group, or custom criteria
4. **No individual response viewing** — Can't see who answered what (only aggregate count)
5. **No edit/delete** — No visible way to edit or delete published surveys
6. **No draft mode** — Surveys appear to go live immediately upon creation
7. **No anonymous option** — No toggle for anonymous vs identified responses
8. **No conditional logic** — No branching questions based on previous answers
9. **No reminder notifications** — No way to nudge non-respondents
10. **No response rate display** — Shows completions but not as % of eligible units
11. **No survey templates** — Can't save/reuse survey structures
12. **No question reordering** — No visible drag-and-drop or reorder mechanism
13. **No rich text in questions** — Plain text only for question text
14. **No images in questions** — Can't attach photos or diagrams to questions
15. **Duplicate names allowed** — No uniqueness enforcement (2 surveys with same name observed)

---

## 7. Data Model (Deduced)

```
Survey
├── id (auto-generated)
├── title / brief_description (string, required)
├── building_id → Building
├── expiry_date (datetime, format: DD-MM-YYYY)
├── visible_to_owners (boolean, default: true)
├── visible_to_tenants (boolean, default: false)
├── status (enum: Active | Expired — auto-calculated from expiry_date)
├── questions[] → SurveyQuestion
│   ├── id
│   ├── question_text (string)
│   ├── question_order (number)
│   └── options[] → SurveyOption
│       ├── id
│       ├── option_text (string)
│       └── option_order (number)
├── responses[] → SurveyResponse
│   ├── unit_id → Unit (one per unit)
│   └── answers[] → {question_id, selected_option_id}
├── completion_count (number — units that completed)
├── created_on (datetime)
└── updated_on (datetime)
```

---

*Last updated: 2026-03-14*
*Total surveys observed: 5 (all expired)*
*Question types: 1 (single choice / radio only)*
*Visibility options: 2 (Owners, Tenants)*
*Max questions observed: 6 (Bond Holiday Party Survey)*
