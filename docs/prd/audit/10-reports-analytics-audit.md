# Audit: PRD 10 -- Reports & Analytics

> Cross-reference of research docs against PRD 10-reports-analytics.md
> Research sources: docs/reports.md (Aquarius), docs/platform-3/deep-dive-reports.md (Condo Control)
> Date: 2026-03-14

---

## Summary

PRD 10 is thorough and well-structured. It absorbs the strengths of both Aquarius (dual export, category-based organization) and Condo Control (39 standard reports, parameterized viewer, favourite system, 10 export formats) while adding significant innovations: AI-powered insights (8 capabilities), scheduled reports, comparative analytics, Building Health Score, and a custom report builder. The PRD consolidates export formats from 10 down to 3 (CSV, Excel, PDF), which is a sound simplification. Report categories expand from 3 (Condo Control) to 8, covering all Concierge modules.

---

## GAPS

### GAP-1: User Breakdown / Demographic Overview Report

**Research source**: Aquarius reports.md -- "User Breakdown Donut Chart" showing distribution by user type (Owners: 235, Tenants: 1,298, Offsite Owners: 454, Board Members).

**What is missing**: The PRD lists "Resident lists" under Unit & Resident category but does not explicitly include a demographic overview/breakdown chart as a standard report. The donut chart visualization showing user type distribution is a quick-read tool for property managers and board members.

**Recommendation**: Add a "Resident Demographics" standard report under the Unit & Resident category with a default donut chart showing user type distribution (Owners, Tenants, Offsite Owners, Board Members, Other Occupants).

---

### GAP-2: Signed Parcel Waiver Report

**Research source**: Aquarius reports.md -- "Signed Parcel Waiver Attachment" report. Condo Control deep-dive-reports.md -- "Parcel Waivers" (report ID 3).

**What is missing**: Both platforms provide dedicated parcel waiver tracking reports. The PRD's Package Management category (5 reports: package details, release status, unreleased, courier breakdown, volume trends) does not mention a parcel waiver compliance report.

**Recommendation**: Add a "Parcel Waiver Compliance" report under Package Management showing which residents have signed waivers vs. which have not. This is a legal compliance need.

---

### GAP-3: AGM Notice Opt-In / Electronic Consent Report

**Research source**: Aquarius reports.md -- "AGM Notice Opt-In" and "Electronic Notices". Condo Control deep-dive-reports.md -- "Electronic Consent" (report ID 63) and "Special consent document" (report ID 157).

**What is missing**: The PRD's Communication category has 3 reports (announcement distribution, email delivery, notification channel usage) but none for tracking electronic consent or AGM opt-in status. These are legal compliance requirements in Canadian condo management.

**Recommendation**: Add an "Electronic Consent Compliance" report under Communication or Unit & Resident showing consent status per resident/unit, and an "AGM Opt-In" report.

---

### GAP-4: Lease Details Report

**Research source**: Condo Control deep-dive-reports.md -- "Lease Details" (report ID 15), "List of unit lease details".

**What is missing**: The Unit & Resident category does not explicitly mention a lease details report. Lease tracking (start date, end date, renewal status) is critical for property managers managing tenant turnover.

**Recommendation**: Add a "Lease Details" report under Unit & Resident listing lease start/end dates, renewal status, and upcoming expirations.

---

### GAP-5: User Login / Account Activity Report

**Research source**: Condo Control deep-dive-reports.md -- "User Logins" (report ID 46), "User login statistics". Also "User Registration" (report ID 492).

**What is missing**: The PRD does not include a user login activity or registration report. CLAUDE.md explicitly calls out "Login audit trail" as a must-have for v2 (from Condo Control). The Reports PRD should include this as a standard report.

**Recommendation**: Add a "User Login Activity" report showing login frequency, last login date, device types, and a "User Registration" report tracking registration dates and onboarding completion.

---

### GAP-6: Unsubscribed Users Report

**Research source**: Condo Control deep-dive-reports.md -- "Unsubscribed Users" (report ID 10).

**What is missing**: No report tracking which users have unsubscribed from email notifications. This is important for communication reach assessment and compliance with notification preferences.

**Recommendation**: Add an "Unsubscribed Users" report under Communication.

---

### GAP-7: Unit History / User History Audit Reports

**Research source**: Condo Control deep-dive-reports.md -- "Unit History Records" (report ID 16), "User History Records" (report ID 17), "User Notes" (report ID 158), "Notes" (report ID 4).

**What is missing**: No audit trail reports for changes made to unit records or user records over time. These are important for dispute resolution and accountability.

**Recommendation**: Add "Unit Change History" and "User Change History" reports under Unit & Resident.

---

### GAP-8: Common Elements / Shared Facilities Report

**Research source**: Condo Control deep-dive-reports.md -- "Common Elements" (report ID 8), "List of all unit common element details".

**What is missing**: No report for tracking common element assignments (storage lockers, bike rooms, etc.) per unit. This is distinct from parking spots and amenities.

**Recommendation**: If common elements are tracked in Unit Management, add a "Common Element Assignments" report under Unit & Resident.

---

### GAP-9: User Badge / Badge Scan Report

**Research source**: Condo Control deep-dive-reports.md -- "User Badges" (report ID 769), "User Badge Scans" (report ID 1834).

**What is missing**: No report for mobile badge/access badge tracking and scan history. Condo Control's newest report (ID 1834) tracks badge scans through mobile app, which is relevant if Concierge implements mobile access.

**Recommendation**: Consider adding badge/access reports if mobile access features are planned for v2+.

---

## WEAK COVERAGE

### WEAK-1: Export Formats -- Missing RTF/DOCX/HTML/Image/Text Formats

**Research source**: Condo Control deep-dive-reports.md -- 10 export formats including RTF, DOCX, MHT, HTML, Text, Image.

**PRD coverage**: Section 3.2.6 limits to CSV, Excel, PDF.

**Assessment**: The PRD explicitly acknowledges this consolidation in Section 2 ("Consolidate to 3 formats that cover 99% of use cases"). This is a reasonable product decision. However, the PRD does not address the edge case of users who need Word-formatted reports for board meeting distribution.

**Recommendation**: Consider adding DOCX as a fourth format, especially for Board Presentation Generation (Section 7.6) where a Word-editable format would be valuable. Low priority.

---

### WEAK-2: Favourite/Pin Reports -- Dedicated Tab vs. Section

**Research source**: Condo Control deep-dive-reports.md -- dedicated "Favourite Reports" tab (#tab-3) with star toggle on each report.

**PRD coverage**: Section 3.1.2 includes a "Pinned Reports" tab (tab 2) with star toggle (Section 3.1.4). Functionally equivalent.

**Assessment**: Covered but using different terminology ("Pinned" vs "Favourite"). The PRD approach is actually better -- "Pinned" is more action-oriented.

---

### WEAK-3: Report Viewer Pagination Detail

**Research source**: Condo Control deep-dive-reports.md -- Telerik Reporting viewer with first/previous/page selector/next/last buttons, zoom controls, full-screen mode, print page vs. print all.

**PRD coverage**: Section 3.2.4 covers pagination (25/50/100 per page, page navigation). Section 3.2.6 covers full-screen and print. However, "Print Page" (single page only) is not specified -- only full report print.

**Assessment**: Minor gap. The ability to print a single page of a long report is a convenience feature. Low priority.

---

### WEAK-4: Report Search Within Content

**Research source**: Condo Control deep-dive-reports.md -- Search within report content (toolbar magnifying glass on report viewer).

**PRD coverage**: Section 3.2.4 mentions "Inline search" that "filters visible rows" in the data table. This is a table filter, not a full-text content search within the rendered report.

**Assessment**: For table-based reports, row filtering achieves the same goal. No action needed unless PDF-style rendered reports are planned.

---

### WEAK-5: Security-Specific Reports Depth

**Research source**: Condo Control has 12 security reports (Incident Activity, Incident Details, Key Checkouts, Keys, Package Details, Parking Permits, Pass-on Logs, Activity Summary, Security Log Details, Security Log Summary, Unit Entries, Visitor Details). Aquarius has 7 security reports (Shift Report, Shift Logs Last Day, Active Visitor Parking, Visitor Parking By Unit, Last Week Parking, Released Packages, Non-Released Packages).

**PRD coverage**: Security & Concierge category has 10 reports ("Incidents, visitors, keys, pass-on logs, shift summaries, activity reports").

**Assessment**: The PRD specifies 10 security reports which is reasonable, but the specific report names are not enumerated. Condo Control has specialized reports like "Security & Concierge Activity Summary" (ID 97) and "Security Log Details" vs "Security Log Summary" (separate detail vs summary views). The PRD should ensure both summary and detail views exist for key security data.

**Recommendation**: Enumerate the 10 security reports by name in the PRD to confirm complete coverage.

---

### WEAK-6: Vacation / Away Status Report

**Research source**: Condo Control deep-dive-reports.md -- "Vacations" (report ID 12), "List of user vacation details".

**PRD coverage**: Not mentioned in any report category. If Concierge tracks resident away/vacation status (relevant for packages, security awareness), a report is needed.

**Assessment**: Depends on whether vacation tracking is included in Unit Management. If yes, add a "Resident Vacations" report.

---

## CONFIRMED

The following research features are confirmed present and well-covered in the PRD:

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Category-based report organization | 3.1.1 | Expanded from 3 to 8 categories |
| 2 | Dual export (Excel + PDF) | 3.2.6 | Extended to CSV + Excel + PDF |
| 3 | Favourite/star system | 3.1.2, 3.1.4 | Implemented as "Pinned Reports" |
| 4 | Parameterized report viewer | 3.2.2 | Extended with saved templates |
| 5 | Custom reports | 3.5 | Full wizard-based builder, much richer than Condo Control's empty feature |
| 6 | Report search | 3.1.3 | Real-time search with 2-char minimum |
| 7 | Amenity Usage report | 3.1.1 | Under Amenity Booking category |
| 8 | Amenity Online Payments report | 3.1.1 | Under Amenity Booking category |
| 9 | Incident reports | 3.1.1 | Under Security & Concierge |
| 10 | Key checkout reports | 3.1.1 | Under Security & Concierge |
| 11 | Package details report | 3.1.1 | Under Package Management |
| 12 | Parking permits report | 3.1.1 | Under Parking |
| 13 | Pass-on logs report | 3.1.1 | Under Security & Concierge |
| 14 | Visitor details report | 3.1.1 | Under Security & Concierge |
| 15 | Resident list report | 3.1.1 | Under Unit & Resident |
| 16 | Buzzer codes report | 3.1.1 | Under Unit & Resident |
| 17 | Emergency contacts report | 3.1.1 | Under Unit & Resident |
| 18 | FOBs/keys/remotes report | 3.1.1 | Under Unit & Resident |
| 19 | Pet details report | 3.1.1 | Under Unit & Resident |
| 20 | Vehicle details report | 3.1.1 | Under Unit & Resident |
| 21 | Phone numbers and emails report | 3.1.1 | Under Unit & Resident (mailing addresses) |
| 22 | Service requests report | 3.1.1 | Under Maintenance |
| 23 | Shift log report | 3.1.1 | Under Security & Concierge |
| 24 | No report scheduling (fixed) | 3.4 | Full scheduled reports with email delivery |
| 25 | No data preview (fixed) | Sec 2 | Inline row count and data preview |
| 26 | No recently run section (fixed) | 3.1.2 | "Recent Reports" tab |
| 27 | Truncated parameter labels (fixed) | Sec 2 | Full-width parameter panel |
| 28 | Identical category icons (fixed) | 3.1.1 | Distinct icons per category |
| 29 | No charts (fixed) | 3.2.5 | Full chart builder with 6 types |
| 30 | No comparative analysis (fixed) | 3.6 | Built-in comparison toggle |
| 31 | Training reports | 3.1.1 | Under Training category (2 reports) |
| 32 | Front desk instructions report | 3.1.1 | Under Unit & Resident |

---

*Audit completed: 2026-03-14*
*Gaps found: 9*
*Weak coverage: 6*
*Confirmed: 32*
