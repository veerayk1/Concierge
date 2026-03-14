# Audit: PRD 11 -- Training / LMS

> Cross-reference of research docs against PRD 11-training-lms.md
> Research source: docs/platform-3/deep-dive-training.md (Condo Control)
> Date: 2026-03-14

---

## Summary

PRD 11 is exceptionally comprehensive and directly addresses every weakness identified in the Condo Control training module. The PRD goes far beyond what Condo Control offers: it adds a quiz engine with three question types (including AI-graded free-form), completion certificates, due dates/deadlines, course descriptions and objectives, search and filtering, compliance tracking, and a "Know Your Residents" gamified training feature. Seven AI capabilities are integrated. The PRD correctly identifies that Condo Control's training is the only LMS among all three platforms and systematically fixes every observed shortcoming.

---

## GAPS

### GAP-1: Product Updates / Release Notes Learning Path

**Research source**: Condo Control deep-dive-training.md -- "Product Updates" learning path (LP ID 4) with 58 release training entries spanning October 2021 to November 2025. This serves as a built-in changelog that doubles as training.

**What is missing**: The PRD specifies learning paths, course categories (including "Platform Training"), and the ability to create courses for software feature updates. However, it does not explicitly describe a system-generated or admin-managed "Product Updates" / "Release Notes" learning path that documents platform changes over time. Condo Control uses this as a dual-purpose feature: training AND changelog.

**Recommendation**: Add a note in Section 3.1 (Learning Paths) about a recommended "Platform Updates" learning path pattern, or build a lightweight release notes feature that auto-generates a module when new platform features ship. This could be a v2 enhancement.

---

### GAP-2: Course Code Naming Convention Documentation

**Research source**: Condo Control deep-dive-training.md -- Structured course code system: CCC100 (Intro), CCC200-209 (Security & Concierge), CCC250 (Security Patrol), CCC300 (Unit File), CCC375 (Amenity), CCC400 (Service Requests), CCC900 (Reports).

**What is missing**: The PRD defines the course_code field (Section 3.2) with pattern `[A-Z]{2,5}-[0-9]{3}` and auto-generation, but does not document a recommended naming convention or provide guidance on how properties should structure their codes.

**Recommendation**: Add a tooltip or admin guidance section suggesting a naming convention (e.g., SEC-100 for security courses, MNT-200 for maintenance). The PRD examples already use this pattern (SEC-100), so this is a documentation gap rather than a feature gap. Low priority.

---

## WEAK COVERAGE

### WEAK-1: Module-Level Content Viewing (vs. Course Completion Tracking)

**Research source**: Condo Control deep-dive-training.md -- Each course has individually clickable modules with per-module status icons (Red=Not Started, Yellow=In Progress, Green=Completed). Module URL: `/training/get-module-list?courseID={courseID}&lp={learningPathId}`.

**PRD coverage**: Section 3.3 (Course Modules) covers module content types, fields, and navigation. Section 3.5 tracks modules_completed count per enrollment. Section 6.2 shows module sidebar with status icons.

**Assessment**: Well covered. The PRD is more detailed than Condo Control's implementation, adding content types (rich text, video, document, interactive), allow_skip controls, and estimated minutes per module. The status icons match (not started, in progress, completed).

---

### WEAK-2: Team Results -- Multi-Path View

**Research source**: Condo Control deep-dive-training.md -- Team Results page only shows the Security & Concierge learning path tab. Product Updates tab is absent from Team Results. This was flagged as a weakness.

**PRD coverage**: Section 3.9 (Compliance Dashboard) and Section 5.4 (Review Team Progress) show team progress with filters by learning path, role, or individual. The export capability (Excel/PDF) is also specified.

**Assessment**: The PRD fixes this weakness by allowing filtering across all learning paths in a single unified Team Progress view. Well covered.

---

### WEAK-3: Forward-Only Navigation Fix

**Research source**: Condo Control deep-dive-training.md -- "Forward-only navigation on course detail -- Only 'Next' button, no 'Previous'. Must use breadcrumb or browser back."

**PRD coverage**: Section 6.2 (Course Detail layout) shows `[< Previous] [Next >]` navigation buttons and a module sidebar for direct access.

**Assessment**: Explicitly fixed. Bidirectional navigation plus sidebar module list.

---

### WEAK-4: "In Progress" Status Accuracy

**Research source**: Condo Control deep-dive-training.md -- "In Progress" status triggered by merely opening a page. 4 of 5 "In Progress" users had 0/16 courses completed.

**PRD coverage**: Section 3.5 defines explicit status logic: `in_progress` requires "at least one module opened OR at least one quiz attempt taken." Combined with modules_completed tracking, this is more meaningful than Condo Control's implementation.

**Assessment**: Addressed, though the same edge case could occur (user opens one module but never progresses). The PRD mitigates this by showing actual completion counts (e.g., "0/16 Courses Completed") alongside status.

---

## CONFIRMED

The following research features are confirmed present and well-covered in the PRD:

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Built-in LMS integrated into the platform | Entire PRD | Core premise |
| 2 | Learning paths grouped by role | 3.1 | assigned_roles field, mandatory toggle |
| 3 | Course code system (structured codes) | 3.2 | Pattern: [A-Z]{2,5}-[0-9]{3}, auto-generated |
| 4 | One course per feature/module | 3.2, category system | Category field maps courses to platform modules |
| 5 | Team Results dashboard | 3.9, 5.4, 6.2 | Compliance Dashboard with filters |
| 6 | Color-coded status icons (Red/Yellow/Green) | 6.2 | Module sidebar shows completion icons |
| 7 | Progress tracking per team member | 3.5 | Enrollment record with modules_completed, best_quiz_score, time_spent |
| 8 | No quizzes (FIXED) | 3.4 | Full quiz builder: multiple choice, true/false, free-form |
| 9 | No certificates (FIXED) | 3.6 | Auto-generated PDF certificates with QR verification |
| 10 | No estimated time (FIXED) | 3.2 | estimated_duration_minutes field (required, 5-480) |
| 11 | No search on training page (FIXED) | 6.2 | Search + category/status/role filters |
| 12 | 58 items without pagination (FIXED) | 6.2 | Paginated course library with 3-column card grid |
| 13 | No course descriptions (FIXED) | 3.2 | description (2000 chars), objectives (up to 10), prerequisites |
| 14 | No due dates (FIXED) | 3.1, 3.5 | deadline_days on learning paths, deadline on enrollment |
| 15 | Forward-only navigation (FIXED) | 6.2 | Bidirectional Previous/Next + module sidebar |
| 16 | No content management depth (FIXED) | 3.3 | Rich text, video, document, interactive content types |
| 17 | Know Your Residents gamified training | 3.7 | Full spec with game settings, flow, privacy controls, leaderboard |
| 18 | Training calendar | 3.8 | Month/week/list views with deadline indicators |
| 19 | Compliance dashboard | 3.9 | Compliance rate, at risk, overdue, recently completed, by role |
| 20 | AI: Quiz question generation | 7.1 | From course content, generates 10-20 draft questions |
| 21 | AI: Adaptive learning paths | 7.2 | Post-quiz course recommendations |
| 22 | AI: Knowledge gap detection | 7.3 | Weekly analysis, gap reports |
| 23 | AI: Course content generation | 7.4 | Draft module content from title/description/objectives |
| 24 | AI: Free-form answer grading | 7.5 | Sonnet-based grading with confidence scores |
| 25 | AI: Certification readiness score | 7.6 | Pre-quiz readiness widget |
| 26 | AI: Personalized study recommendations | 7.7 | Post-failure study plan with module links |
| 27 | Mandatory vs optional courses | 3.1, 3.2 | Both learning path and course level mandatory toggles |
| 28 | Role-specific assignment | 3.1 | assigned_roles on learning paths |
| 29 | Course versioning | 3.2 | version field, auto-incremented on publish |
| 30 | Notifications for all training events | 9.1 | 10 notification triggers with multi-channel delivery |

---

*Audit completed: 2026-03-14*
*Gaps found: 2 (both minor)*
*Weak coverage: 4 (all adequately addressed)*
*Confirmed: 30*
