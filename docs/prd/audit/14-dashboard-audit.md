# Audit: 14-Dashboard PRD vs Research

> **Date**: 2026-03-14
> **Auditor**: Cross-reference audit
> **Research sources**: docs/dashboard.md (Aquarius), docs/platform-3/deep-dive-dashboard.md (Condo Control)

---

## Summary

The Dashboard PRD (14-dashboard.md) is comprehensive and significantly exceeds the features observed in both competing platforms. It covers all 12 roles with distinct layouts, introduces novel AI features (Daily Briefing, Anomaly Badges, Priority Inbox), and addresses every competitive weakness identified in research (static time periods, non-interactive charts, no customization). A few minor observational details from the research are not explicitly carried forward.

**Coverage score**: 96/100

---

## GAPS (Features in research but missing from PRD)

### GAP-1: Successful/Failed Email Analytics Charts on Dashboard
- **Source**: Aquarius dashboard.md -- "Successful Emails" line chart (clicked, processed, open, delivered) and "Failed Emails" line chart (spams, invalid emails, bounces, blocks)
- **What's missing**: The PRD does not include email delivery analytics as a dashboard widget. Aquarius shows detailed email performance (clicked, processed, open, delivered, spams, invalid, bounces, blocks) directly on the main dashboard.
- **Impact**: Low-Medium. Email delivery health is operationally important. The Communication PRD (09) covers delivery metrics but they are not surfaced on the dashboard.
- **Recommendation**: Add an optional "Communication Health" chart widget available to Property Admin/Manager roles that shows email/SMS/push delivery success rates over time. This could pull from the Communication module's analytics.

### GAP-2: User/Unit Breakdown Donut Charts
- **Source**: Aquarius dashboard.md -- "User Breakdown" donut chart (Tenants 65.34%, Owners 34.66%) and "Unit Breakdown" donut chart (RentalUnits 287, OwnedUnits 392, EmptyUnits)
- **What's missing**: The PRD does not include resident demographics or unit occupancy as dashboard widgets. These are useful for Property Admin/Manager to understand building composition at a glance.
- **Impact**: Low. This is informational rather than actionable.
- **Recommendation**: Consider adding a "Building Demographics" optional chart widget for Property Admin showing tenant/owner split and unit occupancy. This aligns with the "glanceable" principle.

### GAP-3: 2FA Setup Prompt on Dashboard
- **Source**: Condo Control deep-dive-dashboard.md -- 2FA modal appears on dashboard load when not configured, with "Setup Now" and "Remind me later" options
- **What's missing**: The PRD does not mention a 2FA setup prompt or any security onboarding nudge on the dashboard. This is a security best practice.
- **Impact**: Low-Medium. Encouraging 2FA adoption is important for condo security.
- **Recommendation**: Add a conditional "Security Setup" banner widget that appears when the user has not configured 2FA. Dismissable with "Remind me later" (shows again in 7 days) or "Set up now" (navigates to account settings).

---

## WEAK COVERAGE (Features present but underspecified)

### WEAK-1: Total Summary Card Counts (Aquarius 8-Card Stat Bar)
- **Source**: Aquarius dashboard.md -- 8 summary cards in 24-hour window: Users (2,077), Amenities (7), Announcements (1,179), Bookings (53), Packages (154), Bulletins (27), Logs (7,132), Service Requests (74)
- **PRD coverage**: Section 3.1 defines 3-6 KPI cards per role, which is a deliberate improvement (role-aware, not one-size-fits-all). However, the PRD does not include a "Total Users" or "Total Amenities" card for any role. Some aggregate counts (total announcements, total logs) may be useful for Admin roles.
- **Recommendation**: Ensure the Property Admin dashboard's KPI set includes at least one aggregate metric (e.g., "Active Users" or "Total Units"). The current 6-card set is operationally focused, which is correct, but admins may want building-level totals.

### WEAK-2: Hero Banner / Property Image
- **Source**: Condo Control deep-dive-dashboard.md -- Full-width hero banner with Toronto skyline image, weather widget overlaid, property name in white text
- **PRD coverage**: The weather widget is specified (3.2.3) and the property name appears in the sidebar. However, there is no hero banner or property image on the dashboard. The PRD layout (Section 6.1) shows AI Briefing as the top full-width element.
- **Recommendation**: Consider allowing properties to set a banner image in Settings. This is a branding/personalization touch. Low priority but adds visual identity. Could be an optional widget slot above the KPI row.

### WEAK-3: "Reset View" Dashboard Action
- **Source**: Aquarius dashboard.md -- "Reset View" button resets the dashboard view
- **PRD coverage**: Section 3.3 has "Reset to Default" in the Widget Management Panel. However, this requires opening the Customize panel first. Aquarius has a simpler one-click reset button in the dashboard header.
- **Recommendation**: The current approach (reset inside Customize panel) is adequate and prevents accidental resets. No change needed.

### WEAK-4: Support / Help Access from Dashboard
- **Source**: Aquarius dashboard.md -- Floating "Support" button (bottom right). Condo Control deep-dive-dashboard.md -- Chat widget (bottom-right, circular teal button on every page)
- **PRD coverage**: The dashboard PRD does not mention a help/support widget. The Search & Navigation PRD (15) covers the help panel in the top bar. The dashboard does not have a floating support button.
- **Recommendation**: This is covered by the top-bar help icon in PRD 15. No additional dashboard-specific support widget needed, unless a live chat integration is planned (v2+).

### WEAK-5: Shift Log Quick Create from Dashboard
- **Source**: Aquarius dashboard.md -- "+ Shift Logs" button (blue button, top right of dashboard)
- **PRD coverage**: The Front Desk/Concierge dashboard has a Quick Action "+ Note" (Section 3.1, Front Desk Concierge Dashboard). The Security Guard has "+ Incident" and "+ Key Checkout". However, there is no explicit "+ Shift Log" quick action that maps directly to the Aquarius "Shift Logs" button.
- **Recommendation**: Verify that "+ Note" on the Concierge dashboard creates a shift log entry. If shift logs are a distinct module (not just "notes"), add "+ Shift Log" as a Quick Action for Concierge and Security Guard roles.

### WEAK-6: Contacts Quick Action
- **Source**: Aquarius dashboard.md -- "Contacts" quick access button on dashboard
- **PRD coverage**: No "Contacts" or "Emergency Contacts" quick action on any dashboard role. Looking up resident contacts requires navigating to the unit file.
- **Recommendation**: Consider adding a "Look Up Contact" quick action for Concierge and Security roles. This is a high-frequency task for front desk staff.

---

## CONFIRMED (Features properly covered)

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Weather widget with live data | 3.2.3 | Fully covered with AI-powered building alerts |
| 2 | KPI summary cards with counts | 3.2.1 | Covered with configurable time periods (improvement over static 24h) |
| 3 | Security-focused KPIs (visitors, packages, violations, keys) | 3.1 (Security Guard) | All four Condo Control KPIs present in Security Guard layout |
| 4 | Recent announcements on dashboard | 3.2.4 | Card-based display, top 3 with "View All" (improvement over accordion) |
| 5 | Line charts for security activity (7-day) | 3.2.8 + 3.1 (Security Supervisor) | Interactive charts with tooltips and drill-down |
| 6 | Bar charts for logs by month | 3.2.8 | Configurable chart types with time range selector |
| 7 | Maintenance requests by month line chart | 3.2.8 + 3.1 (Property Manager) | Covered as configurable chart widget |
| 8 | Adjustable time periods on KPIs | 3.2.1 | Today, 7 days, 30 days, all time (fixes static periods in competitors) |
| 9 | Interactive charts (hover, click, filter) | 3.2.8 | Hover tooltips, click-to-drill-down, time range selector |
| 10 | Dashboard customization | 3.3 | Drag-and-drop with role guardrails (unique to Concierge) |
| 11 | Role-aware dashboard layouts | 3.1 | 12 distinct role layouts (neither competitor has this) |
| 12 | Quick action buttons | 3.2.2 | Per-role quick actions with tap-friendly sizing |
| 13 | Real-time badge counts | 3.4 | WebSocket with animation and stale detection |
| 14 | Shift handoff summary | 3.2.6 | Full widget with AI summary, flagged items, notes |
| 15 | Activity feed (real-time) | 3.2.5 | Role-scoped, WebSocket streaming, infinite scroll |
| 16 | Building Health Score | 3.2.7 | Novel composite metric with 6 contributing factors |
| 17 | AI Daily Briefing | 7.1 | Novel feature, no competitor has this |
| 18 | Anomaly detection on KPIs | 7.2 | Novel feature with severity levels |
| 19 | Dashboard KPI "View" links to filtered lists | 3.2.1 | Covered with pre-applied filters (matches Condo Control redirect pattern) |
| 20 | Loading/empty/error states for all widgets | 6.5 | Comprehensive table covering all 8 widget types |
| 21 | Responsive layouts (desktop/tablet/mobile) | 6.1-6.3 | Three breakpoints with specific rules per widget |
| 22 | Unread announcement indicator | 3.2.4 | Blue dot on unread, orange border on urgent |

---

*Audit complete. 3 gaps identified (2 low-medium, 1 low). 6 areas of weak coverage identified. 22 features confirmed as properly covered.*
