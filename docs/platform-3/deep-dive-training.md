# Online Training — Granular Deep Dive

Field-level documentation of every element in Condo Control's Online Training module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/training/overview/`
**Sidebar menu**: Training (people/group icon — two person outlines)
**Breadcrumb**: Home > Online Training (overview); Home > Online Training > {Course Name} (course detail); Home > Online Training > Team Results (team results)
**Page title**: "Online Training | Condo Control" (overview); "Course | Condo Control" (course detail); "Team Results | Condo Control" (team results)

The Online Training module is a **learning management system (LMS)** for staff training. It provides structured courses organized by learning paths, with module-level tracking of completion status. The module tracks individual progress and provides team-wide results for managers.

**Role access**: Security & Concierge has **full access** — can view courses, access training modules, view team results, and track own progress.

---

## 2. Training Overview Page

**URL**: `/training/overview/`

### 2.1 Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Icon | Teal circular icon with people/training graphic |
| 2 | Title | "Online Training" — large heading |
| 3 | View Team Results | Button, top-right. Dark teal outlined style. Links to `/training/get-team-results` |

### 2.2 Tabs (2 Learning Paths)

| # | Tab | Default | Description |
|---|-----|---------|-------------|
| 1 | Security & Concierge | Yes (active, teal filled) | Role-specific training courses. `#tab-2` |
| 2 | Product Updates | No (grey text) | Platform release notes and feature training. `#tab-4` |

**Note**: Tab IDs are `#tab-2` and `#tab-4` (not sequential). Missing `#tab-1` and `#tab-3` suggest other learning paths exist for other roles (e.g., Property Manager, Board Member).

### 2.3 Tab Style

| State | Style |
|-------|-------|
| Active tab | Teal filled background, white text, rounded pill shape |
| Inactive tab | Grey text, no background |

---

## 3. Security & Concierge Tab (#tab-2)

### 3.1 Course Listing (Complete — 16 courses)

Each course displays as a clickable card/row with the course title on the left and a status icon on the right.

| # | Course Code | Course Name | Course ID | Status | Status Icon |
|---|------------|-------------|-----------|--------|-------------|
| 1 | CCC100 | Training Introduction | 1 | Not Started | Red monitor icon |
| 2 | CCC200 | Security & Concierge: Console Overview | 18 | Not Started | Red monitor icon |
| 3 | CCC201 | Security & Concierge: Visitor Parking | 22 | Not Started | Red monitor icon |
| 4 | CCC202 | Security & Concierge: Package Tracking | 32 | Not Started | Red monitor icon |
| 5 | CCC203 | Security & Concierge: Security Log | 33 | Not Started | Red monitor icon |
| 6 | CCC204 | Security & Concierge: Incident Report | 34 | In Progress | Yellow/amber monitor icon |
| 7 | CCC205 | Security & Concierge: Authorized Entry | 39 | Not Started | Red monitor icon |
| 8 | CCC206 | Security & Concierge: Key Checkout | 40 | Not Started | Red monitor icon |
| 9 | CCC207 | Security & Concierge: Pass-on Log | 37 | Not Started | Red monitor icon |
| 10 | CCC208 | Security & Concierge: Valet Parking | 38 | Not Started | Red monitor icon |
| 11 | CCC209 | Security & Concierge: Setup Page | 55 | Not Started | Red monitor icon |
| 12 | CCC250 | Security Patrol | 41 | Not Started | Red monitor icon |
| 13 | CCC300 | Unit File | 26 | Not Started | Red monitor icon |
| 14 | CCC375 | Amenity Bookings | 13 | In Progress | Yellow/amber monitor icon |
| 15 | CCC400 | Service Requests | 44 | In Progress | Yellow/amber monitor icon |
| 16 | CCC900 | Reports | 42 | Not Started | Red monitor icon |

**Course URL pattern**: `/training/get-module-list?courseID={courseID}&lp=2`
- `courseID`: Unique course identifier (non-sequential integers)
- `lp`: Learning path ID. `lp=2` = Security & Concierge path

### 3.2 Course Code Naming Convention

| Code Range | Category | Description |
|------------|----------|-------------|
| CCC100 | Introduction | Platform onboarding |
| CCC200-CCC209 | Security & Concierge | Core security console features (one course per entry type) |
| CCC250 | Security Patrol | Mobile patrol feature |
| CCC300 | Unit File | Resident directory training |
| CCC375 | Amenity Bookings | Amenity reservation system |
| CCC400 | Service Requests | Maintenance/service request handling |
| CCC900 | Reports | Reporting system training |

**Note**: "CCC" prefix likely stands for "Condo Control Central" (the platform's former name before rebranding to "Property Control" then "Condo Control").

### 3.3 Status Icons

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| Not Started | Monitor/screen icon | Red/coral | User has not opened any modules in this course |
| In Progress | Monitor/screen icon | Yellow/amber | User has started but not completed all modules |
| Completed | Monitor/screen icon (inferred) | Green (inferred) | User has completed all modules (not observed for current user) |

---

## 4. Product Updates Tab (#tab-4)

### 4.1 Course Listing (Complete — 33 entries)

Product Updates are release training modules documenting platform changes over time. Listed newest-first.

| # | Course Name | Course ID | Naming Format | Status |
|---|------------|-----------|---------------|--------|
| 1 | What's New in Property Control - Nov. 2025 | 137 | New naming (Property Control) | Not Started |
| 2 | What's New in Property Control - Oct. 2025 | 136 | New naming (Property Control) | Not Started |
| 3 | What's New in Property Control - Sep. 2025 | 135 | New naming (Property Control) | Not Started |
| 4 | What's New in Condo Control - Aug. 2025 | 134 | Old naming (Condo Control) | Not Started |
| 5 | What's New in Condo Control - Jul. 2025 | 133 | Old naming | Not Started |
| 6 | What's New in Condo Control - Jun. 2025 | 132 | Old naming | Not Started |
| 7 | What's New in Condo Control - May 2025 | 131 | Old naming | Not Started |
| 8 | What's New in Condo Control - Apr. 2025 | 130 | Old naming | Not Started |
| 9 | What's New in Condo Control - Mar. 2025 | 129 | Old naming | Not Started |
| 10 | What's New in Condo Control - Feb. 2025 | 128 | Old naming | Not Started |
| 11 | What's New in Condo Control - Jan. 2025 | 127 | Old naming | Not Started |
| 12 | What's New in Condo Control - Dec. 2024 | 126 | Old naming | Not Started |
| 13 | What's New in Condo Control - Nov. 2024 | 125 | Old naming | Not Started |
| 14 | Release Training - May 29, 2024 | 124 | Older naming (Release Training) | Not Started |
| 15 | Release Training - May 1, 2024 | 123 | Older naming | Not Started |
| 16 | Release Training - March 6, 2024 | 122 | Older naming | Not Started |
| 17 | Release Training - February 21, 2024 | 121 | Older naming | Not Started |
| 18 | Release Training - December 14, 2023 | 120 | Older naming | Not Started |
| 19 | Release Training - November 29, 2023 | 119 | Older naming | Not Started |
| 20 | Release Training - October 18, 2023 | 118 | Older naming | Not Started |
| 21 | Release Training - September 7, 2023 | 117 | Older naming | Not Started |
| 22 | Release Training - August 23, 2023 | 116 | Older naming | Not Started |
| 23 | Release Training - August 9, 2023 | 115 | Older naming | Not Started |
| 24 | Release Training - July 19, 2023 | 114 | Older naming | Not Started |
| 25 | Release Training - July 5, 2023 | 113 | Older naming | Not Started |
| 26 | Release Training - June 7, 2023 | 112 | Older naming | Not Started |
| 27 | Release Training - May 24, 2023 | 110 | Older naming | Not Started |
| 28 | Release Training - May 10 2023 | 109 | Older naming | Not Started |
| 29 | Release Training - April 19 2023 | 108 | Older naming | Not Started |
| 30 | Release Training - April 5 2023 | 107 | Older naming | Not Started |
| 31 | Release Training - March 22 2023 | 106 | Older naming | Not Started |
| 32 | Release Training - March 9 2023 | 105 | Older naming | Not Started |
| 33 | Release Training - February 23 2023 | 104 | Older naming | Not Started |
| 34 | Release Training - February 8 2023 | 103 | Older naming | Not Started |
| 35 | Release Training - January 25 2023 | 102 | Older naming | Not Started |
| 36 | Release Training - December 14 2022 | 101 | Older naming | Not Started |
| 37 | Release Training - November 24 2022 | 100 | Older naming | Not Started |
| 38 | Release Training - October 26 2022 | 99 | Older naming | Not Started |
| 39 | Release Training - September 28 2022 | 97 | Older naming | Not Started |
| 40 | Release Training - August 31 2022 | 96 | Older naming | Not Started |
| 41 | Release Training - August 17 2022 | 95 | Older naming | Not Started |
| 42 | Release Training - July 7 2022 | 93 | Older naming | Not Started |
| 43 | Release Training - June 22 2022 | 92 | Older naming | Not Started |
| 44 | Release Training - June 8 2022 | 91 | Older naming | Not Started |
| 45 | Release Training - May 26 2022 | 90 | Older naming | Not Started |
| 46 | Release Training - May 12 2022 | 74 | Older naming | Not Started |
| 47 | Release Training - April 27 2022 | 71 | Older naming | Not Started |
| 48 | Release Training - April 13 2022 | 69 | Older naming | Not Started |
| 49 | Release Training - March 30 2022 | 68 | Older naming | Not Started |
| 50 | Release Training - March 16 2022 | 65 | Older naming | Not Started |
| 51 | Release Training - March 3 2022 | 63 | Older naming | Not Started |
| 52 | Release Training - February 16 2022 | 61 | Older naming | Not Started |
| 53 | Release Training - January 26 2022 | 56 | Older naming | Not Started |
| 54 | Release Training - January 13 2022 | 54 | Older naming | Not Started |
| 55 | Release Training - December 14 2021 | 53 | Older naming | Not Started |
| 56 | Release Training - November 25 2021 | 51 | Older naming | Not Started |
| 57 | Release Training - November 10 2021 | 48 | Older naming | Not Started |
| 58 | Release Training - October 14 2021 | 46 | Oldest | Not Started |

**Product Updates URL pattern**: `/training/get-module-list?courseID={courseID}&lp=4`
- `lp=4` = Product Updates learning path

**Naming evolution observed**:
1. **Oct 2021 – May 2024**: "Release Training - {Date}" format
2. **Nov 2024 – Aug 2025**: "What's New in Condo Control - {Month Year}" format
3. **Sep 2025 – Nov 2025**: "What's New in Property Control - {Month Year}" format (rebrand)

**Total product updates**: 58 entries spanning October 2021 to November 2025 (biweekly → monthly cadence).

---

## 5. Course Detail Page

**URL**: `/training/get-module-list?courseID={courseID}&lp={learningPathId}`
**Page title**: "Course | Condo Control"
**Breadcrumb**: Home > Online Training > {Course Code} - {Course Name}

### 5.1 Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | Course icon | Teal circular training icon (same as overview page) |
| 2 | Course title | Large heading: "{Course Code} – {Course Name}" (e.g., "CCC100 – Training Introduction") |
| 3 | Module list | List of individual training modules within the course |
| 4 | Next button | Green "Next" button at bottom-right. Navigates to next course in the learning path |

### 5.2 Module Row

Each module displays as a clickable link with a status icon.

| # | Element | Description |
|---|---------|-------------|
| 1 | Module title | Teal link text (e.g., "CCC100: Training Module Overview") |
| 2 | Status icon | Right-aligned. Red monitor = Not Started, Yellow = In Progress, Green = Completed |

**Observed**: CCC100 has 1 module ("CCC100: Training Module Overview"). Other courses likely have multiple modules covering different aspects of the feature.

### 5.3 Navigation

| # | Element | Description |
|---|---------|-------------|
| 1 | Next | Green button. Advances to the next course in the learning path sequence |

**Note**: No "Previous" button observed — navigation may be forward-only from the course detail page. Back navigation uses breadcrumb or browser back.

---

## 6. Team Results Page

**URL**: `/training/get-team-results`
**Page title**: "Team Results | Condo Control"
**Breadcrumb**: Home > Online Training > Team Results

### 6.1 Page Header

| # | Element | Description |
|---|---------|-------------|
| 1 | Icon | Teal circular training icon |
| 2 | Title | "Team Results" — large heading |

### 6.2 Tabs

| # | Tab | Description |
|---|-----|-------------|
| 1 | Security & Concierge | Active (teal filled). Shows team training progress for this learning path |

**Note**: Only the "Security & Concierge" tab is shown (no "Product Updates" tab on Team Results). Team Results appears to be scoped to role-specific training, not release updates.

### 6.3 Status Groups

Team members are organized into 3 status groups with summary counts.

| # | Group | Icon | Color | Count Format | Observed Count |
|---|-------|------|-------|-------------|----------------|
| 1 | Completed | Green monitor icon | Green | X/Y Users | 0/0 Users |
| 2 | In Progress | Yellow/amber monitor icon | Yellow | X/Y Users | 5/0 Users |
| 3 | Not Started | Red monitor icon | Red | X/Y Users | 4/0 Users |

**Count format**: "X/Y Users" where:
- X = Number of team members in this status
- Y = Number who have completed ALL courses (always 0 in observed data)

### 6.4 Team Member Rows

Each team member displays:

| # | Element | Description |
|---|---------|-------------|
| 1 | Avatar | Green circular person icon |
| 2 | Name | Full name (salutation included when applicable) |
| 3 | Progress | "X/16 Courses Completed" — shows completed out of total courses |
| 4 | Status icon | Right-aligned monitor icon matching the group color |

### 6.5 Observed Team Members (Complete — 9 members)

**In Progress (5 users)**:

| # | Name | Progress |
|---|------|----------|
| 1 | Manjot Singh | 0/16 Courses Completed |
| 2 | Mr. Harsh Harsh | 0/16 Courses Completed |
| 3 | Temp Concierge | 0/16 Courses Completed |
| 4 | Mr. Junaid Syed | 4/16 Courses Completed |
| 5 | Mrs. Dhana Lakshmi | 0/16 Courses Completed |

**Not Started (4 users)**:

| # | Name | Progress |
|---|------|----------|
| 1 | Dillan Mohammed | 0/16 Courses Completed |
| 2 | Security Front Desk | 0/16 Courses Completed |
| 3 | Mr. Ravi Chandra | 0/16 Courses Completed |
| 4 | Mr. Nithin Surabhi | 0/16 Courses Completed |

**Completed (0 users)**: No team members have completed all 16 courses.

**Note**: Total team size is 9 members. This matches the 9 guards listed in the Security & Concierge console's "Relieved" and "To Be Relieved By" dropdowns. The "In Progress" status appears to be assigned even when 0 courses are completed — likely triggered by simply opening a module.

---

## 7. Data Model Observations

### 7.1 Course Entity

| Field | Type | Description |
|-------|------|-------------|
| CourseID | Integer | Unique identifier (non-sequential: 1, 13, 18, 22, 26, 32-42, 44, 46-137) |
| CourseCode | String | Structured code (e.g., "CCC100", "CCC200") |
| CourseName | String | Display name |
| LearningPathID | Integer | Learning path grouping. Observed: 2 (Security & Concierge), 4 (Product Updates) |
| Status | Enum | Not Started, In Progress, Completed (per-user) |
| Modules | Array | Individual training modules within the course |

### 7.2 Learning Path Entity

| Field | Type | Description |
|-------|------|-------------|
| LearningPathID | Integer | Unique identifier |
| Name | String | Display name (e.g., "Security & Concierge", "Product Updates") |

**Observed learning paths**:

| LP ID | Name | Course Count | Description |
|-------|------|-------------|-------------|
| 2 | Security & Concierge | 16 | Role-specific operational training |
| 4 | Product Updates | 58 | Platform release notes and feature training |

**Missing learning paths** (inferred from non-sequential IDs):
- LP 1: Likely "General" or "Introduction" path
- LP 3: Likely "Property Manager" or "Board Member" path

### 7.3 Module Entity

| Field | Type | Description |
|-------|------|-------------|
| ModuleID | Integer | Unique identifier |
| CourseID | Integer | Parent course |
| Title | String | Module title (e.g., "CCC100: Training Module Overview") |
| Status | Enum | Not Started, In Progress, Completed (per-user) |
| ContentType | String | Likely video, text, or interactive content |

### 7.4 Team Result Entity

| Field | Type | Description |
|-------|------|-------------|
| UserID | Integer | Team member identifier |
| UserName | String | Full name with salutation |
| CompletedCourses | Integer | Number of courses completed |
| TotalCourses | Integer | Total courses in the learning path (16) |
| OverallStatus | Enum | Completed, In Progress, Not Started |

---

## 8. URL Map

| Page | URL Pattern |
|------|-------------|
| Training overview | `/training/overview/` |
| Course module list | `/training/get-module-list?courseID={courseID}&lp={lpID}` |
| Team results | `/training/get-team-results` |

---

## 9. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Built-in LMS** — Full learning management system integrated into the platform. Brilliant for onboarding new security staff without external training tools
2. **Course code system** — "CCC100", "CCC200" etc. gives professional structure. Easy to reference in job descriptions or performance reviews
3. **One course per feature** — CCC200-CCC209 maps exactly to the 7 Security Console entry types + Setup Page + Console Overview. Targeted, relevant training
4. **Team Results dashboard** — Managers can see who needs training at a glance. Groups by Completed/In Progress/Not Started
5. **Learning paths** — Separate paths for role-specific training (Security & Concierge) and platform updates (Product Updates). Different purposes, different tracks
6. **Progress tracking** — "4/16 Courses Completed" per team member. Clear, quantifiable progress metrics
7. **Product update archive** — 58 release training entries dating back to October 2021. Complete changelog documentation through training
8. **Status icons with color coding** — Red (Not Started), Yellow (In Progress), Green (Completed). Instant visual identification
9. **Naming evolution visible** — Can trace the platform rebrand: "Release Training" → "What's New in Condo Control" → "What's New in Property Control"

### What CondoControl Gets Wrong
1. **No completion certification** — No certificate or badge when a course is completed. No evidence of completion for staff records
2. **"In Progress" with 0 courses** — 4 of 5 "In Progress" users have 0/16 courses completed. Status categorization seems inaccurate — possibly triggered by merely opening a module page
3. **No estimated time** — Courses don't show expected duration. "CCC200 - Console Overview" could be 5 minutes or 5 hours — no way to know
4. **No search on training page** — Cannot search for a specific course. Must scroll through the list
5. **58 product updates with no filtering** — All 58 release training entries are listed in one long scrollable list. No date filter, no year grouping, no pagination
6. **Forward-only navigation on course detail** — Only "Next" button, no "Previous". Must use breadcrumb or browser back
7. **No course descriptions** — Course titles are self-explanatory but have no description, objectives, or prerequisites
8. **No quizzes or assessments** — No indication of knowledge validation. Completion seems to be based on viewing content, not demonstrating understanding
9. **Team Results only shows Security & Concierge path** — Product Updates tab is absent from Team Results. Can't track who has reviewed release notes
10. **All product update courses are "Not Started"** — Zero engagement with release training. Suggests the feature exists but isn't actively used/enforced
11. **No due dates or deadlines** — No way to set training completion deadlines for new hires or compliance requirements
12. **Course IDs are non-sequential and exposed in URL** — `/training/get-module-list?courseID=34&lp=2` reveals internal IDs

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~300+*
