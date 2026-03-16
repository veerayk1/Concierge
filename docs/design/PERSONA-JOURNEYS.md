# Persona Journey Maps

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product / Design
> **Depends on**: 02-Roles-and-Permissions, DESIGN-SYSTEM.md

---

## Table of Contents

1. [Overview](#1-overview)
2. [Persona 1: Super Admin](#2-persona-1-super-admin)
3. [Persona 2: Property Admin](#3-persona-2-property-admin)
4. [Persona 3: Property Manager](#4-persona-3-property-manager)
5. [Persona 4: Security Supervisor](#5-persona-4-security-supervisor)
6. [Persona 5: Security Guard](#6-persona-5-security-guard)
7. [Persona 6: Front Desk / Concierge](#7-persona-6-front-desk--concierge)
8. [Persona 7: Maintenance Staff](#8-persona-7-maintenance-staff)
9. [Persona 8: Board Member](#9-persona-8-board-member)
10. [Persona 9: Owner (Resident)](#10-persona-9-owner-resident)
11. [Persona 10: Tenant (Resident)](#11-persona-10-tenant-resident)
12. [Persona 11: Offsite Owner](#12-persona-11-offsite-owner)
13. [Persona 12: Family Member](#13-persona-12-family-member)
14. [Cross-Persona Interaction Map](#14-cross-persona-interaction-map)
15. [Handoff Points](#15-handoff-points)
16. [Conflict Scenarios and Resolution](#16-conflict-scenarios-and-resolution)
17. [Accessibility Matrix](#17-accessibility-matrix)
18. [Device Strategy Matrix](#18-device-strategy-matrix)

---

## 1. Overview

This document defines journey maps for all 12 personas in the Concierge platform. Each journey map captures the full picture of who uses the system, how they use it, what delights them, what frustrates them, and how their work connects to other personas.

### Design Philosophy Alignment

Every persona journey adheres to the Concierge design principles:
- **Role-aware interfaces**: Each persona sees only what they need. Nothing more.
- **One action per moment**: Critical tasks surface as the single primary action on each screen.
- **Progressive disclosure**: Power features reveal on demand. First-time users never feel overwhelmed.
- **Clarity over decoration**: Clean white canvas. Data floats. No visual noise.

### How to Read Each Persona

| Section | What It Tells You |
|---------|-------------------|
| **Profile** | Who this person is, their context, and their comfort with technology |
| **Goals** | What success looks like for them on any given day |
| **Frustrations** | Pain points from current industry tools that Concierge must solve |
| **Daily Workflow** | Hour-by-hour map of a typical shift or day |
| **Key Screens** | Every screen they touch, with route and frequency |
| **Navigation Items Visible** | Exact sidebar menu structure this role sees |
| **"Wow" Moment** | The feature that makes them evangelists |
| **Critical Tasks** | High-frequency actions that must be completable in under 3 clicks |
| **Edge Cases** | Unusual but real scenarios the system must handle |
| **Accessibility Needs** | Specific a11y requirements for this persona's context |
| **Mobile vs Desktop** | Device split and what they do on each |

---

## 2. Persona 1: Super Admin

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya Kaur |
| **Age** | 38 |
| **Title** | Platform Operations Director |
| **Tech Comfort** | Expert (9/10). Comfortable with APIs, dashboards, analytics tools. |
| **Daily Environment** | Home office or co-working space. Dual-monitor setup. Rarely visits physical properties. |
| **Devices** | Desktop (primary): 27" monitor with 2560x1440 resolution. Laptop (secondary): 14" MacBook Pro for travel. Phone: iPhone for emergency alerts only. |
| **Working Hours** | 8:00 AM - 6:00 PM, but monitors critical alerts after hours |
| **Properties Managed** | 15-50 properties across the platform |
| **Reports To** | CEO / Board of the SaaS company |

### Goals

1. **Platform stability**: Zero downtime, all properties operational, no data incidents.
2. **Cost optimization**: Keep AI spending within budget across all properties. Monitor per-property AI cost breakdown.
3. **Client success**: Ensure every Property Admin is active and their properties are well-configured.
4. **Growth metrics**: Track platform-wide KPIs -- active users, event volume, feature adoption rates.
5. **Compliance**: Maintain audit readiness across all properties. Ensure data isolation is airtight.

### Frustrations

1. **No cross-property visibility in existing tools**: Has to log into each property separately to check health. No aggregate dashboard.
2. **AI cost surprises**: No way to see which properties consume the most AI resources or set spending limits per property.
3. **Onboarding friction**: Setting up a new property takes hours of manual configuration. No templates, no bulk setup.
4. **Audit gaps**: When a compliance audit arrives, pulling logs across multiple properties is a manual nightmare.
5. **Stale data**: Property Admins who set up their account and then go silent. No way to detect inactive properties or underutilized features.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 8:00 AM | Check platform health dashboard. Review overnight alerts. | `/system/dashboard` |
| 8:15 AM | Review AI cost dashboard. Check per-property spending vs. budget. | `/system/ai-dashboard` |
| 8:30 AM | Check new property onboarding queue. Review pending setups. | `/system/properties` |
| 9:00 AM | Review platform-wide analytics: active users, event volume, feature adoption. | `/system/analytics` |
| 9:30 AM | Handle escalations from Property Admins (account issues, config problems). | `/system/support-queue` |
| 10:00 AM | Configure AI feature toggles for properties requesting new capabilities. | `/system/ai-config` |
| 11:00 AM | Review billing status across properties. Check for overdue accounts. | `/system/billing` |
| 12:00 PM | Lunch break |  |
| 1:00 PM | Onboard new property: create Property Admin account, apply template, verify config. | `/system/properties/new` |
| 2:00 PM | Run compliance audit report for a specific property chain. | `/system/reports` |
| 3:00 PM | Review user audit logs for flagged activities. | `/system/audit-logs` |
| 4:00 PM | Plan feature rollouts. Toggle beta features for select properties. | `/system/feature-flags` |
| 5:00 PM | End-of-day check on platform health. Set up overnight alert thresholds. | `/system/dashboard` |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Multi-Property Dashboard | `/system/dashboard` | 5+ times/day | Platform health overview, cross-property KPIs |
| AI Dashboard | `/system/ai-dashboard` | 2-3 times/day | AI cost monitoring, per-property spend breakdown |
| Property List | `/system/properties` | 2-3 times/day | Property management, onboarding queue |
| Property Detail | `/system/properties/:id` | 1-2 times/day | Deep-dive into specific property config |
| New Property Setup | `/system/properties/new` | 2-3 times/week | Onboard new properties with templates |
| Billing | `/system/billing` | 1 time/day | Invoice status, payment tracking |
| Platform Analytics | `/system/analytics` | 1-2 times/day | Usage metrics, feature adoption, growth trends |
| User Audit Logs | `/system/audit-logs` | 1 time/day | Security review, flagged activities |
| AI Configuration | `/system/ai-config` | 2-3 times/week | Provider keys, model selection, feature toggles |
| Platform Health | `/system/health` | 1 time/day | Uptime, error rates, response times |
| Reports | `/system/reports` | 2-3 times/week | Compliance reports, cross-property exports |
| Global Alerts | `/system/alerts` | As needed | Critical alerts requiring immediate action |
| Feature Flags | `/system/feature-flags` | Weekly | Beta feature rollout management |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **SYSTEM** | Multi-Property Dashboard, Platform Health, AI Dashboard, Billing |
| **OVERVIEW** | Dashboard, Units & Residents, Amenities |
| **OPERATIONS** | Security Console, Packages, Service Requests, Announcements |
| **COMMUNITY** | Events, Marketplace, Library, Surveys |
| **MANAGEMENT** | Reports, User Management, Training, Logs, Settings |

### "Wow" Moment

**Cross-property AI cost dashboard with per-property drill-down.** Priya logs in, sees a single chart showing AI spend across all 35 properties, color-coded by budget status. She clicks a property that is trending over budget and instantly sees which AI features are consuming costs, with a one-click toggle to throttle spending. No spreadsheets. No logging into each property. One screen, full control.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Check platform health | 5+ times/day | Login > Dashboard (auto-loads) |
| View AI spend for a property | 2-3 times/day | AI Dashboard > Click property row |
| Create Property Admin account | 2-3 times/week | Properties > + New > Fill form > Save |
| Toggle AI feature for property | 2-3 times/week | AI Config > Property dropdown > Toggle |
| Export compliance report | Weekly | Reports > Select type > Export |

### Edge Cases

1. **Property Admin goes inactive**: The platform must detect properties with no admin login for 30+ days and surface an alert on the Super Admin dashboard with a "Contact Admin" action.
2. **AI provider outage**: If an AI provider (e.g., OpenAI) goes down, the Super Admin needs a banner alert and the ability to switch all properties to a fallback provider in one action.
3. **Data isolation breach attempt**: If a bug or misconfiguration allows cross-property data access, the system must log the attempt and immediately notify the Super Admin with affected scope.
4. **Bulk property migration**: When onboarding a management company with 20 properties, the Super Admin needs CSV import with template application, not one-by-one setup.
5. **Billing disputes**: When a Property Admin disputes charges, the Super Admin needs a detailed audit trail of every billable event with timestamps.

### Accessibility Needs

- Standard desktop accessibility: keyboard navigation, screen reader support for all dashboard widgets.
- High contrast mode for extended screen time (dual monitors, full-day usage).
- No time-critical interactions. All tasks are deliberate and asynchronous.
- Export options must be accessible (properly structured Excel/PDF with headers and alt text for charts).

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Desktop (27" monitor) | 85% | All primary tasks. Dashboard monitoring, property configuration, report generation, AI management, billing. |
| Laptop (14") | 10% | Same tasks while traveling. Smaller viewport but still full functionality. |
| Phone | 5% | Emergency alerts only. Push notifications for critical platform health issues. No complex operations. |

---

## 3. Persona 2: Property Admin

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Marcus Thompson |
| **Age** | 52 |
| **Title** | Senior Property Manager / Property Admin |
| **Tech Comfort** | Moderate (6/10). Uses Excel and email daily but not comfortable with technical jargon. Prefers visual interfaces over text-heavy ones. |
| **Daily Environment** | On-site management office in a 500-unit high-rise condo. Private office with a single 24" desktop monitor. Occasionally works from home. |
| **Devices** | Desktop (primary): 24" Dell monitor, 1920x1080. Tablet (secondary): iPad for walk-throughs. Phone: Samsung Galaxy for calls and quick checks. |
| **Working Hours** | 8:30 AM - 5:30 PM weekdays. Available by phone weekends for emergencies. |
| **Property Size** | 500 units, 1,200+ residents, 15 staff members |
| **Reports To** | Management company regional director |

### Goals

1. **Operational control**: Full visibility into everything happening at the property -- security events, maintenance, packages, amenities.
2. **Staff accountability**: Know what every staff member is doing, ensure shift coverage, track performance.
3. **Resident satisfaction**: Minimize complaints, resolve issues quickly, communicate proactively.
4. **Compliance**: Board meeting-ready reports at all times. Insurance, vendor compliance, safety certifications always current.
5. **Efficient onboarding**: When new staff or residents join, get them set up and productive within minutes, not days.

### Frustrations

1. **Fragmented information**: Currently uses 3-4 separate systems for security, maintenance, communication. No single source of truth.
2. **Report generation takes hours**: Pulling data for board meetings requires exporting from multiple systems and manually combining in Excel.
3. **No visibility into staff activity**: Cannot easily see what the security guard did during the overnight shift without reading paper logs.
4. **Slow onboarding**: Creating user accounts, assigning roles, sending welcome emails is a multi-step manual process across different systems.
5. **Vendor compliance tracking is manual**: Tracks insurance expiry dates in a spreadsheet. Misses expirations regularly.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 8:30 AM | Review overnight activity: security events, incidents, shift log notes from night guard. | `/dashboard` |
| 8:45 AM | Check unreleased packages count. Follow up on packages older than 48 hours. | `/packages` |
| 9:00 AM | Review open service requests. Assign unassigned requests to staff or vendors. | `/service-requests` |
| 9:30 AM | Check vendor compliance dashboard. Follow up on expiring insurance. | `/vendors` |
| 10:00 AM | Draft and send building announcement (elevator maintenance, fire drill schedule). | `/announcements/new` |
| 10:30 AM | Review amenity booking queue. Approve pending reservations. | `/amenities` |
| 11:00 AM | Onboard new resident: create account, assign unit, send welcome email. | `/user-management/new` |
| 11:30 AM | Walk the building with iPad. Note maintenance issues. | Mobile / Tablet |
| 12:00 PM | Lunch |  |
| 1:00 PM | Run weekly report for management company. Export as PDF. | `/reports` |
| 1:30 PM | Review training completion for security team. Assign overdue courses. | `/training` |
| 2:00 PM | Handle resident complaint (noise, parking, maintenance delay). | `/units/:id` |
| 3:00 PM | Configure event types for a new security workflow (new courier added). | `/settings/event-types` |
| 3:30 PM | Review user audit logs. Check for suspicious login activity. | `/logs/audit` |
| 4:00 PM | Prepare board meeting materials. Generate reports, compile data. | `/reports` |
| 5:00 PM | End-of-day review: check all open items, set priorities for tomorrow. | `/dashboard` |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Management Dashboard | `/dashboard` | 10+ times/day | Building overview, KPI cards, activity feed |
| Service Requests List | `/service-requests` | 5-8 times/day | Assign, prioritize, track all requests |
| Service Request Detail | `/service-requests/:id` | 3-5 times/day | Review details, add comments, reassign |
| Packages | `/packages` | 3-5 times/day | Monitor unreleased packages, aging alerts |
| Security Console | `/security` | 3-5 times/day | Review events, incidents, visitor logs |
| Announcements | `/announcements` | 2-3 times/day | Draft, send, manage building communications |
| Announcement Editor | `/announcements/new` | 3-5 times/week | Create multi-channel announcements |
| Units & Residents | `/units` | 3-5 times/day | Look up unit info, resident details |
| Unit Detail | `/units/:id` | 2-3 times/day | Deep-dive into specific unit |
| User Management | `/user-management` | 1-2 times/day | Create accounts, assign roles |
| New User | `/user-management/new` | 2-3 times/week | Onboard new staff or resident |
| Amenities | `/amenities` | 2-3 times/day | Approve bookings, manage calendars |
| Reports | `/reports` | 1-2 times/day | Generate building reports |
| Training | `/training` | 1 time/day | Monitor staff training progress |
| Vendor Management | `/vendors` | 1 time/day | Insurance compliance, vendor directory |
| Settings | `/settings` | 2-3 times/week | Event types, notification templates, building config |
| Logs | `/logs` | 1 time/day | Audit trail review |
| Shift Log | `/shift-log` | 2-3 times/day | Review staff handoff notes |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard, Units & Residents, Amenities |
| **OPERATIONS** | Security Console, Packages, Service Requests, Announcements |
| **COMMUNITY** | Events, Marketplace, Library, Surveys |
| **MANAGEMENT** | Reports, User Management, Training, Logs, Settings |

### "Wow" Moment

**One-click board meeting package.** Marcus clicks "Generate Board Report" and the system compiles a comprehensive PDF with: monthly event summary, maintenance request stats (open/closed/average resolution time), vendor compliance status, amenity utilization rates, financial summary, and incident count. What used to take 4 hours of copying from different systems now takes 10 seconds. He sends it to the board with a single click.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| View overnight activity | Every morning | Login > Dashboard (auto-loads with overnight feed) |
| Assign a service request | 5-8 times/day | Service Requests > Click request > Assign dropdown > Select staff |
| Send an announcement | 3-5 times/week | Announcements > + New > Fill form > Send |
| Look up a unit | 3-5 times/day | Command palette (Cmd+K) > Type unit number > Enter |
| Create new resident account | 2-3 times/week | User Management > + New > Fill form > Save + Send Welcome Email |

### Edge Cases

1. **Mass resident onboarding**: New building opens with 200 units. Needs CSV bulk import with role assignment, unit mapping, and batch welcome email sending.
2. **Emergency lockdown**: Fire alarm triggers. Property Admin needs to broadcast an emergency announcement to all channels (push, SMS, email, lobby display) in under 30 seconds.
3. **Staff termination**: When a security guard is fired, the system must immediately deactivate their account, revoke all FOB/key access, invalidate sessions, and log the action -- all from one confirmation dialog.
4. **Board election**: Annual board election requires changing Board Member role assignments for 5-7 people simultaneously. Bulk role reassignment with notification.
5. **Insurance lapse**: A major vendor's insurance expires and they have an active work order. System must flag the conflict and prevent new assignments until compliance is restored.

### Accessibility Needs

- Large, readable fonts on dashboard KPI cards (designed for a single 24" monitor at arm's length).
- High contrast status badges for color-vision-impaired users.
- Keyboard shortcuts for frequent actions (Cmd+K search is essential).
- Print-friendly report layouts for board meeting binder distribution.
- Tooltips on all icons and abbreviated labels (Marcus is not a power user).

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Desktop (24" monitor) | 75% | All administrative tasks: user management, reports, settings, complex workflows. |
| Tablet (iPad) | 15% | Building walk-throughs: note maintenance issues, quick unit lookups, photo capture. |
| Phone | 10% | Emergency alerts, quick dashboard check, approve urgent requests while off-site. |

---

## 4. Persona 3: Property Manager

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Sarah Chen |
| **Age** | 34 |
| **Title** | Property Manager |
| **Tech Comfort** | High (7/10). Comfortable with web apps, spreadsheets, and mobile tools. Quick learner. |
| **Daily Environment** | Shared management office. Dual-purpose: desk work and resident-facing. Frequently walks the property. |
| **Devices** | Desktop (primary): Shared office computer, 24" monitor, 1920x1080. Phone (secondary): iPhone 15 Pro for on-the-go tasks. Tablet occasionally for inspections. |
| **Working Hours** | 9:00 AM - 5:00 PM weekdays, rotating on-call weekends |
| **Property Size** | 350 units, 800+ residents, 8 staff members |
| **Reports To** | Property Admin (Marcus) |

### Goals

1. **Operational efficiency**: Close service requests within SLA. Keep package backlogs under control. Ensure amenities run smoothly.
2. **Staff coordination**: Assign the right tasks to the right people. Ensure shift coverage. Track work completion.
3. **Resident communication**: Proactive announcements prevent reactive complaints. Keep residents informed before they need to ask.
4. **Vendor management**: Ensure contractors deliver quality work on time and maintain compliance.
5. **Data-driven decisions**: Use reports and analytics to identify patterns (recurring maintenance issues, peak booking times, frequent complainants).

### Frustrations

1. **Assignment chaos**: Maintenance requests pile up because there is no smart assignment. She manually matches skills to tasks.
2. **Communication gaps**: Sends an email announcement, but 40% of residents have no email on file. No fallback channel.
3. **Shift handoff information loss**: The night concierge writes notes on paper. By morning, context is lost or illegible.
4. **No vendor performance data**: Cannot compare vendors by response time, cost, or satisfaction. Relies on gut feeling.
5. **Amenity booking conflicts**: Double-bookings happen because the calendar does not enforce rules consistently.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 9:00 AM | Read shift log from overnight staff. Check dashboard for new items. | `/dashboard`, `/shift-log` |
| 9:15 AM | Triage new service requests: assign, set priority, add instructions. | `/service-requests` |
| 9:45 AM | Check package aging report. Follow up on unreleased packages > 24 hours. | `/packages` |
| 10:00 AM | Review security events from overnight. Escalate any incidents. | `/security` |
| 10:30 AM | Process amenity booking approvals. | `/amenities` |
| 11:00 AM | Building walk: inspect common areas, note issues on phone. | Mobile app |
| 12:00 PM | Lunch |  |
| 1:00 PM | Call vendors for open work orders. Update request status. | `/service-requests/:id` |
| 2:00 PM | Draft weekly newsletter announcement. Schedule distribution. | `/announcements/new` |
| 2:30 PM | Review training dashboard. Nudge staff with overdue courses. | `/training` |
| 3:00 PM | Handle resident walk-in inquiries. Look up unit files, booking info. | `/units/:id`, `/amenities` |
| 4:00 PM | Moderate classified ads and community posts. | `/marketplace` |
| 4:30 PM | Run end-of-day reports: requests closed, packages released, events logged. | `/reports` |
| 5:00 PM | Write shift log for evening staff. Log priorities and pending items. | `/shift-log/new` |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Operations Dashboard | `/dashboard` | 8+ times/day | Operational overview, alerts, quick actions |
| Service Requests List | `/service-requests` | 8-10 times/day | Triage, assign, track |
| Service Request Detail | `/service-requests/:id` | 5-8 times/day | Update status, add comments, reassign |
| Packages | `/packages` | 4-6 times/day | Monitor and manage |
| Security Console | `/security` | 3-5 times/day | Review events, escalate incidents |
| Amenities | `/amenities` | 3-4 times/day | Approve bookings, check calendar |
| Units & Residents | `/units` | 3-5 times/day | Unit lookups, resident info |
| Announcements | `/announcements` | 2-3 times/day | Draft, send, manage |
| Shift Log | `/shift-log` | 3-4 times/day | Read and write shift notes |
| Training | `/training` | 1-2 times/day | Staff progress monitoring |
| Reports | `/reports` | 1-2 times/day | Operational reports |
| Community / Marketplace | `/marketplace` | 1-2 times/day | Moderate community content |
| Events | `/events` | 1 time/day | Upcoming community events |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard, Units & Residents, Amenities |
| **OPERATIONS** | Security Console, Packages, Service Requests, Announcements |
| **COMMUNITY** | Events, Marketplace, Library, Surveys |
| **MANAGEMENT** | Reports, Training, Logs |

### "Wow" Moment

**AI-assisted service request triage.** Sarah opens the service requests queue and sees that the AI has already suggested assignments based on staff skills, current workload, and request category. "Leaking faucet in Unit 1205" is pre-assigned to Dave (plumbing specialist, lightest workload today). She reviews three suggestions in 10 seconds and approves all with a single "Accept All" button. What used to take 20 minutes of manual matching each morning now takes 30 seconds.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Assign a service request | 8-10 times/day | Click request > Assign dropdown > Select > Confirm |
| Read shift log | Every shift start | Dashboard > Shift Log widget (inline preview) |
| Approve amenity booking | 3-4 times/day | Amenities > Pending tab > Approve button |
| Look up a resident | 5+ times/day | Cmd+K > Type name > Enter |
| Write shift log entry | Every shift end | Shift Log > + New > Type > Save |

### Edge Cases

1. **Concurrent edits**: Two property managers update the same service request simultaneously. System must detect conflict and show a merge dialog.
2. **Vendor no-show**: Vendor fails to show up for a scheduled maintenance visit. System should allow one-click reassignment to alternate vendor with notification to resident.
3. **Amenity damage report**: After an event, damage is discovered. Property Manager needs to link the damage to the booking, the resident, and a new service request -- all in one flow.
4. **Escalation chain**: A resident complaint goes unresolved for 72 hours. System auto-escalates to Property Admin with full timeline.
5. **Seasonal surge**: December package volume triples. Dashboard must surface package metrics prominently and shift KPI thresholds.

### Accessibility Needs

- Quick-scan layouts: KPI cards with large numbers visible from a standing position (when helping a resident at the counter while glancing at screen).
- Mobile-optimized views for building walks: large tap targets, camera integration for photo capture.
- Voice-to-text for shift log entries on mobile.
- Color-coded status badges must also have text labels (not color-only indicators).

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Desktop (24" monitor) | 65% | Service request management, reports, announcements, user management, complex workflows. |
| Phone (iPhone) | 30% | Building walk notes, quick lookups, approvals, shift log entries, emergency response. |
| Tablet | 5% | Inspections with checklist forms, showing residents booking calendars. |

---

## 5. Persona 4: Security Supervisor

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | James Okafor |
| **Age** | 45 |
| **Title** | Head of Security |
| **Tech Comfort** | Moderate (5/10). Comfortable with security-specific software. Prefers clear, simple interfaces. Dislikes unnecessary complexity. |
| **Daily Environment** | Security office adjacent to the main lobby. Multiple CCTV monitors. Shared desk with rotating guards. |
| **Devices** | Desktop (primary): 22" monitor in security office. Phone: iPhone for patrol check-ins and alerts. Radio: Two-way radio for guard communication. |
| **Working Hours** | 7:00 AM - 3:00 PM weekdays, rotating weekend coverage |
| **Team Size** | 6 security guards (2 per shift, 3 shifts) |
| **Reports To** | Property Manager (Sarah) |

### Goals

1. **Team oversight**: Know where every guard is, what they are doing, and whether patrols are on schedule.
2. **Incident management**: Ensure every incident is properly documented, escalated when needed, and resolved.
3. **Access control**: FOBs, keys, and visitor passes are tracked meticulously. No unauthorized access.
4. **Trend analysis**: Identify patterns -- repeated parking violations, recurring incidents in specific areas, peak visitor times.
5. **Training compliance**: All guards complete mandatory training on time. New hires are onboarded with proper courses.

### Frustrations

1. **No team performance dashboard**: Cannot see at a glance which guard logged the most events, who has overdue training, or patrol completion rates.
2. **Paper-based patrol logs**: Guards carry clipboards. Data is never digitized, never analyzed.
3. **Incident report quality varies**: Some guards write detailed reports, others write two words. No template enforcement.
4. **Key checkout tracking is manual**: A notebook at the front desk tracks key checkouts. Keys go missing regularly.
5. **No analytics**: Cannot tell the board "incidents are down 15% this quarter" because there is no historical data comparison.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 7:00 AM | Review overnight shift log. Check for incidents requiring follow-up. | `/dashboard`, `/shift-log` |
| 7:15 AM | Review security analytics: incident count, visitor volume, parking violations for the past 24 hours. | `/security/analytics` |
| 7:30 AM | Brief the morning shift guards. Assign patrol routes and priorities. | In-person + `/security` |
| 8:00 AM | Review and quality-check overnight incident reports. Add supervisor notes. | `/security/events` |
| 8:30 AM | Check FOB/key management dashboard. Follow up on unreturned keys. | `/security/keys` |
| 9:00 AM | Review parking violation reports. Escalate repeat offenders to Property Manager. | `/parking/violations` |
| 10:00 AM | Monitor live event feed. Ensure guards are logging events consistently. | `/security` |
| 11:00 AM | Building perimeter walk. Verify access points, check camera angles. | Mobile |
| 12:00 PM | Lunch |  |
| 1:00 PM | Check training dashboard. Assign courses to guard who started last week. | `/training` |
| 1:30 PM | Generate weekly security report for Property Manager. | `/reports` |
| 2:00 PM | Review guard performance metrics: events logged, response times, shift coverage. | `/security/analytics` |
| 2:30 PM | Write shift log with priorities for afternoon supervisor (or guard). | `/shift-log/new` |
| 3:00 PM | End of shift. Handoff to afternoon security. | |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Security Analytics Dashboard | `/dashboard` | 6+ times/day | Incident trends, guard performance, patrol coverage |
| Security Console | `/security` | 10+ times/day | Live event feed, event review |
| Security Event Detail | `/security/events/:id` | 5-8 times/day | Review, annotate, escalate incidents |
| Security Analytics | `/security/analytics` | 3-4 times/day | Trend analysis, team performance |
| Shift Log | `/shift-log` | 4-5 times/day | Read and write handoff notes |
| Packages | `/packages` | 2-3 times/day | Monitor package volume, verify releases |
| Parking Violations | `/parking/violations` | 2-3 times/day | Review violations, escalate repeats |
| Parking Analytics | `/parking/analytics` | 1 time/day | Violation trends, visitor parking usage |
| FOB/Key Management | `/security/keys` | 2-3 times/day | Track checkouts, follow up on returns |
| Training (Team) | `/training` | 1-2 times/day | Assign courses, check team progress |
| Reports | `/reports` | 1 time/day | Generate security-specific reports |
| Unit File (View Only) | `/units/:id` | 1-2 times/day | Check emergency contacts, unit instructions |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard |
| **OPERATIONS** | Security Console, Packages, Parking |
| **MANAGEMENT** | Reports (security), Training (team), Shift Log |

### "Wow" Moment

**Guard performance heatmap.** James opens the security analytics dashboard and sees a visual heatmap of the building showing incident density by floor and time of day. He instantly spots that Floor 3 has had a spike in noise complaints between 10 PM and 1 AM this month. He drills down to see the specific units involved and discovers a pattern. He generates a report and presents it to the Property Manager with data-backed recommendations. His team went from "we feel like Floor 3 is a problem" to "here is the proof and the trend."

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Review overnight events | Every morning | Dashboard > Security widget (last 12 hours auto-filtered) |
| Add supervisor note to incident | 5-8 times/day | Security Console > Click event > Add Note > Save |
| Check key checkout status | 2-3 times/day | Security Console > Keys tab (shows outstanding) |
| Generate security report | Daily | Reports > Security Report > Export |
| Assign training course | Weekly | Training > + Assign > Select guard > Select course > Confirm |

### Edge Cases

1. **Guard calls in sick**: Last-minute shift gap. Supervisor needs to see available guards, contact them, and reassign the shift, all from the dashboard.
2. **Visitor overstay**: A visitor registered for 2 hours has been in the building for 6. System should alert the active guard and the supervisor.
3. **Key not returned at shift end**: System should auto-flag unreturned keys when a guard's shift ends and notify the supervisor.
4. **Incident involving a minor**: Requires special handling. System should prompt for additional fields and flag for immediate escalation.
5. **Multiple simultaneous incidents**: Two incidents on different floors. System must allow parallel event creation without losing context on either.

### Accessibility Needs

- High-contrast dashboard for a dimly lit security office (CCTV monitor glare).
- Large, tappable buttons on mobile for patrol use (gloved hands in winter).
- Audio notification option for critical alerts (supervisor may be looking at CCTV, not at the computer).
- Simple, scannable layouts. No dense paragraph text. Security data should be presented in grids and badges.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Desktop (22" monitor) | 70% | Analytics, report generation, incident review, training management, shift log. |
| Phone | 30% | Patrol check-ins, quick event review, emergency alerts, guard communication. |

---

## 6. Persona 5: Security Guard

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Daniel Park |
| **Age** | 28 |
| **Title** | Security Guard (Lobby) |
| **Tech Comfort** | Low-Moderate (4/10). Comfortable with phones and basic apps. Finds desktop software overwhelming if too many options are visible. |
| **Daily Environment** | Main lobby security desk. Standing or seated at a counter. Shared computer. Frequent interruptions from residents and visitors. |
| **Devices** | Desktop (primary): Shared lobby computer, 22" monitor. Phone (secondary): Personal phone for patrol. No dedicated work phone. |
| **Working Hours** | Rotating shifts: 7 AM - 3 PM / 3 PM - 11 PM / 11 PM - 7 AM |
| **Reports To** | Security Supervisor (James) |

### Goals

1. **Speed**: Log events fast. Every second at the keyboard is a second not watching the lobby.
2. **Accuracy**: Correctly identify courier types, unit numbers, and visitor names. Mistakes cause package misdelivery.
3. **Awareness**: Know who is expected, what packages are pending, which keys are out.
4. **Compliance**: Complete training on time. Follow incident reporting procedures. Write legible shift notes.
5. **Safety**: Respond to emergencies quickly. Know evacuation procedures and emergency contacts.

### Frustrations

1. **Too many fields in forms**: Current system asks for 15 fields to log a simple package arrival. Half are never used.
2. **Slow search**: Looking up a resident by name takes too long. Residents stand there impatiently while the guard types and waits.
3. **No quick actions**: Every task requires navigating through menus. Logging a visitor should be one screen, not four.
4. **Shared computer login issues**: Has to re-login when the previous shift's session expires. Login takes 30 seconds (feels like an eternity with a delivery person waiting).
5. **No visual cues for packages**: All packages look the same in the system. Cannot quickly see which ones are Amazon vs. UPS vs. perishable.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 7:00 AM (shift start) | Login. Read shift log from overnight guard. | `/dashboard`, `/shift-log` |
| 7:10 AM | Quick check: active visitors, unreleased packages, keys out. | `/dashboard` |
| 7:15 AM - 11:00 AM | Continuous: log packages as couriers arrive, register visitors, handle resident pickups. | `/security`, `/packages` |
| 11:00 AM | Mid-shift patrol. Walk all floors, check doors, note issues. | Mobile |
| 11:30 AM | Return to desk. Log patrol notes. | `/shift-log/new` |
| 11:30 AM - 2:30 PM | Continuous: afternoon package rush, visitor management, resident inquiries. | `/security`, `/packages` |
| 2:30 PM | Write end-of-shift log. Note outstanding items, pending visitors, keys still out. | `/shift-log/new` |
| 2:45 PM | Brief incoming guard. Transfer any physical keys/items. | In-person |
| 3:00 PM | Shift ends. Logout. | |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Security Action Dashboard | `/dashboard` | Continuously (always open) | Active visitors, unreleased packages, keys out, quick actions |
| Security Console (Create) | `/security/new` | 20-40 times/shift | Log visitors, parcels, incidents, notes |
| Package Intake | `/packages/new` | 15-30 times/shift | Log incoming packages |
| Package Release | `/packages/release` | 10-20 times/shift | Release packages to residents |
| Shift Log | `/shift-log` | 2-3 times/shift | Read previous notes, write own |
| Parking (Visitor Pass) | `/parking/visitor-pass` | 3-5 times/shift | Create visitor parking passes |
| Parking (Violation) | `/parking/violation/new` | 0-3 times/shift | Log parking violations |
| Unit File (View Only) | `/units/:id` | 3-5 times/shift | Check unit instructions, emergency contacts |
| Training | `/training` | When assigned | Complete training courses |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard |
| **OPERATIONS** | Security Console, Packages, Parking |
| **DAILY** | Shift Log, Training |

### "Wow" Moment

**One-tap package intake with courier auto-detection.** A FedEx courier walks up with 5 packages. Daniel scans the first tracking barcode with his phone camera. The system auto-detects "FedEx" from the tracking number format, pre-fills the courier field, and shows a simplified 3-field form: Unit, Recipient (auto-suggested from unit), Storage Location. Five packages logged in 45 seconds. The courier is impressed. Daniel is impressed. No more typing "FedEx" 30 times a day.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Log a package arrival | 15-30 times/shift | Dashboard > "+ Package" button > Fill 3 fields > Save |
| Release a package | 10-20 times/shift | Dashboard > "Packages" count > Click package > "Release" |
| Register a visitor | 5-15 times/shift | Dashboard > "+ Visitor" button > Fill form > Save |
| Check unit instructions | 3-5 times/shift | Cmd+K > Type unit > View instructions panel |
| Log a shift note | 2-3 times/shift | Dashboard > Shift Log widget > "+ Note" > Type > Save |

### Edge Cases

1. **Unknown courier**: A local restaurant delivery service not in the system. Guard must be able to type a custom courier name, not be blocked by a required dropdown.
2. **Resident not found**: Package addressed to "J. Smith" but three J. Smiths exist. System must show disambiguation with unit numbers and photos.
3. **Refused package**: Resident refuses delivery. System needs a "Refused" status with courier return tracking.
4. **Power outage**: Computer goes down. Guard needs a simplified mobile fallback that works on personal phone with limited connectivity.
5. **Aggressive visitor**: A visitor becomes confrontational. Guard needs a panic/emergency button that is always visible on screen, triggering silent alert to supervisor and Property Manager.

### Accessibility Needs

- **Large touch targets**: All primary action buttons must be at least 44px tall (design system minimum). Quick-action buttons on the dashboard should be 56px+.
- **High contrast on shared monitors**: Security desk monitors are often in bright lobby lighting. Contrast ratio must exceed WCAG AAA (7:1) for critical elements.
- **Minimal scrolling**: The dashboard must fit key information on a single viewport. Scrolling means missing something.
- **Forgiving inputs**: Typo tolerance in search. Fuzzy matching for resident names.
- **Keyboard-first data entry**: Tab order must be optimized for speed. Enter submits. No mouse required for common flows.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Desktop (22" shared) | 80% | All event logging, package intake/release, visitor registration, shift log. |
| Phone (personal) | 20% | Patrol notes, barcode scanning, emergency alerts, quick unit lookup during patrol. |

---

## 7. Persona 6: Front Desk / Concierge

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Maria Santos |
| **Age** | 32 |
| **Title** | Concierge |
| **Tech Comfort** | Moderate (5/10). Comfortable with hospitality software. Values simplicity and speed. Primary skill is people, not technology. |
| **Daily Environment** | Concierge desk in main lobby. Elegant setting. Desk is visible to all residents. Must look professional and attentive, not buried in a screen. |
| **Devices** | Desktop (primary): Sleek all-in-one computer at concierge desk, 24" monitor. Phone: Work phone for resident calls. |
| **Working Hours** | 8:00 AM - 4:00 PM weekdays, rotating weekend coverage |
| **Reports To** | Property Manager (Sarah) |

### Goals

1. **Resident satisfaction**: Every resident feels acknowledged, helped, and valued. The concierge desk is the building's first impression.
2. **Package throughput**: Packages are logged quickly, residents are notified immediately, and pickups are handled smoothly.
3. **Visitor experience**: Visitors are registered efficiently. Expected visitors are pre-cleared. No one waits unnecessarily.
4. **Information accuracy**: When a resident asks "when is the party room available?" the answer is instant and correct.
5. **Seamless handoffs**: When the shift changes, the next concierge knows everything -- who is expected, what is pending, any special instructions.

### Frustrations

1. **Package notification delays**: Logs a package but the resident does not get notified for 20 minutes. They call the desk asking "did my package arrive?"
2. **No expected visitor list**: A resident calls ahead to say "my plumber is coming at 2 PM." There is no way to pre-register this. The plumber arrives and the guard does not know they are expected.
3. **Amenity booking is clunky**: When a resident walks up and asks "is the gym available tonight?", checking the calendar takes 6 clicks.
4. **Per-unit instructions are buried**: Unit 815 has a note saying "resident is hard of hearing, knock loudly." This note is buried in a profile page instead of surfacing when that unit is referenced.
5. **Shift log is an afterthought**: Writing shift notes in the current system is painful. It is easier to text the next concierge, but then there is no official record.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 8:00 AM | Login. Read shift log from overnight. Check dashboard for pending items. | `/dashboard`, `/shift-log` |
| 8:15 AM | Review expected visitors list for the day. Note special instructions. | `/dashboard` (expected visitors widget) |
| 8:30 AM - 12:00 PM | Continuous: greet residents, log packages, register visitors, answer queries, book amenities on behalf of residents. | `/packages/new`, `/security/new`, `/amenities` |
| 10:00 AM | Mid-morning courier rush: UPS, FedEx, Amazon. Log packages rapidly. | `/packages/new` (batch mode) |
| 12:00 PM | Lunch (coverage by second concierge) |  |
| 1:00 PM | Afternoon: fewer packages, more resident interactions. Help with bookings, give building info, handle dry cleaning deliveries. | `/amenities`, `/security/new` |
| 2:00 PM | Check for packages unreleased > 24 hours. Call or notify residents. | `/packages` (aging filter) |
| 3:00 PM | Handle resident move-in: coordinate elevator booking, parking pass, FOB issuance. | `/amenities`, `/parking`, `/units/:id` |
| 3:30 PM | Write shift log for afternoon concierge. | `/shift-log/new` |
| 4:00 PM | Shift ends. Brief incoming concierge on pending items. | In-person |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Concierge Dashboard | `/dashboard` | Continuously | Unreleased packages, expected visitors, pending items, quick actions |
| Package Intake | `/packages/new` | 15-25 times/shift | Log incoming packages |
| Package Release | `/packages/release` | 10-20 times/shift | Release packages to residents |
| Package List | `/packages` | 5-8 times/shift | Search, filter, check aging |
| Security Console (Create) | `/security/new` | 10-20 times/shift | Register visitors, log notes |
| Amenity Calendar | `/amenities/calendar` | 5-10 times/shift | Check availability, book on behalf |
| Amenity Booking | `/amenities/book` | 3-5 times/shift | Create bookings for residents |
| Shift Log | `/shift-log` | 3-4 times/shift | Read and write handoff notes |
| Unit File (View Only) | `/units/:id` | 5-8 times/shift | Unit instructions, resident contacts |
| Announcements (View) | `/announcements` | 1-2 times/shift | Stay informed of building updates |
| Training | `/training` | When assigned | Complete training courses |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard |
| **OPERATIONS** | Security Console, Packages |
| **DAILY** | Shift Log, Training, Announcements (view) |

### "Wow" Moment

**Per-unit instruction toast on every interaction.** Maria types "1205" to log a package for Unit 1205. A subtle toast notification appears at the top: "Unit 1205: Resident travels frequently. Hold all packages. Do not mark as uncollected." She did not have to navigate to the unit file. The instruction found her. When a visitor arrives for Unit 815, the system shows: "Resident is hard of hearing. Use video intercom, not buzzer." Context appears precisely when needed, without extra clicks.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Log a package | 15-25 times/shift | Dashboard > "+ Package" > Fill 3 fields > Save |
| Release a package | 10-20 times/shift | Dashboard > Package count > Select > "Release" |
| Register a visitor | 10-20 times/shift | Dashboard > "+ Visitor" > Fill form > Save |
| Check amenity availability | 5-10 times/shift | Cmd+K > "Party room" > View calendar |
| Book amenity for resident | 3-5 times/shift | Amenity Calendar > Click time slot > Select resident > Confirm |

### Edge Cases

1. **Resident forgot FOB**: Resident locked out. Concierge must verify identity, issue a temporary pass, and log the event -- all without making the resident feel like a criminal.
2. **Large delivery (furniture)**: Requires elevator booking, loading dock access, and a security event. Three modules touched in one interaction. System should offer a "Move-In Assist" flow.
3. **VIP resident**: Board president walks up. System should surface their unit instructions (e.g., "always assist with dry cleaning, reserved parking space P-12") without the concierge having to look them up.
4. **Language barrier**: A visitor does not speak English. System should support multi-language visitor registration forms.
5. **Package storage overflow**: Storage room is full. System should display capacity warnings and suggest alternate storage locations.

### Accessibility Needs

- **Glanceable dashboard**: Information must be readable from arm's length while standing. Large KPI numbers (34px display weight).
- **Quick dismissal of notifications**: Toast notifications must auto-dismiss or have a large close button. Concierge cannot have popups blocking their view during resident conversations.
- **One-handed phone use**: Mobile fallback for when the concierge steps away from the desk.
- **Screen reader support for announcements**: Concierge reads announcements to residents. Announcement content must be well-structured.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Desktop (24" all-in-one) | 85% | All package operations, visitor registration, amenity bookings, shift log. |
| Phone (work phone) | 15% | Quick lookups when away from desk, calling residents, emergency alerts. |

---

## 8. Persona 7: Maintenance Staff

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Dave Kowalski |
| **Age** | 48 |
| **Title** | Building Superintendent |
| **Tech Comfort** | Low (3/10). Carries tools, not tablets. Prefers phone calls over apps. Will use a simple app if it makes his job easier, but abandons anything confusing. |
| **Daily Environment** | Maintenance workshop in the basement. Spends 70% of the day in hallways, mechanical rooms, and resident units. Hands are often dirty or gloved. |
| **Devices** | Phone (primary): Rugged Android phone with a protective case. Desktop (secondary): Workshop computer, shared with other maintenance staff, 20" monitor. |
| **Working Hours** | 7:00 AM - 3:30 PM weekdays, on-call rotation for emergencies |
| **Reports To** | Property Manager (Sarah) |

### Goals

1. **Clear work queue**: Know exactly what needs to be done today, in priority order. No ambiguity.
2. **Unit access information**: Know whether to knock, whether to enter, what the entry code is, and who to contact if no answer.
3. **Log work efficiently**: Record what was done, what parts were used, and what follow-up is needed -- without spending 20 minutes typing on a phone.
4. **Equipment tracking**: Know when boilers, elevators, and HVAC systems need preventive maintenance before they break.
5. **Minimize trips back to the workshop**: Have all the information for a job before going to the unit. Parts needed, tools required, access instructions.

### Frustrations

1. **Paper work orders**: Gets a printed work order, walks to the unit, discovers the problem is different from the description. Has to walk back to get more info.
2. **No photos from residents**: Resident says "the faucet is broken." No photo. Dave does not know which faucet, what type, or what parts to bring.
3. **No entry instructions**: Goes to a unit, knocks, no answer. Did the resident give permission to enter? Is there a pet? No one knows.
4. **Status updates require the office**: Has to walk back to the workshop computer to update a request status. By end of day, half the updates are forgotten.
5. **Equipment maintenance is guesswork**: No records of when equipment was last serviced. Boiler breaks because nobody tracked the 6-month service interval.

### Daily Workflow

| Time | Activity | Screen Used |
|------|----------|-------------|
| 7:00 AM | Check work queue on workshop computer. Print/review today's assigned requests by priority. | `/dashboard` |
| 7:15 AM | Review high-priority requests first. Check entry permissions, unit instructions, photos attached. | `/service-requests/:id` |
| 7:30 AM | Grab tools and parts for first job. Head to unit. | |
| 7:30 AM - 12:00 PM | Work on assigned requests. Update status on phone between jobs. | Mobile: `/service-requests/:id` |
| 10:00 AM | Check for new urgent requests assigned during the morning. | Mobile: `/dashboard` |
| 12:00 PM | Lunch |  |
| 12:30 PM | Check equipment alerts. Any scheduled preventive maintenance due today? | `/dashboard` (equipment widget) |
| 1:00 PM - 3:00 PM | Continue work orders. Log completion notes with photos of finished work. | Mobile: `/service-requests/:id` |
| 3:00 PM | Return to workshop. Finalize all status updates for the day. | Desktop: `/service-requests` |
| 3:15 PM | Write shift log for any incomplete work or items needing follow-up. | `/shift-log/new` |
| 3:30 PM | Shift ends. | |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Maintenance Dashboard | `/dashboard` | 5+ times/day | Work queue, priority sorting, equipment alerts |
| Service Request Detail | `/service-requests/:id` | 10-15 times/day | View details, update status, add notes/photos |
| Assigned Requests List | `/service-requests?assigned=me` | 5-8 times/day | Full list of assigned work |
| Equipment Dashboard | `/equipment` | 1-2 times/day | Equipment alerts, preventive maintenance schedule |
| Equipment Detail | `/equipment/:id` | As needed | Service history, manuals, parts list |
| Shift Log | `/shift-log` | 2-3 times/day | Read incoming notes, write end-of-day log |
| Training | `/training` | When assigned | Safety training, equipment certifications |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard |
| **OPERATIONS** | Service Requests (assigned) |
| **DAILY** | Shift Log, Training |

### "Wow" Moment

**Work order with everything attached.** Dave opens a service request on his phone. He sees: the resident's description, 3 photos of the issue (a leaking pipe under the kitchen sink), entry permission ("Yes -- spare key with concierge"), a note ("small dog, friendly"), the unit's plumbing history (last 3 service requests involving plumbing), and the recommended parts list (AI-suggested based on photo analysis). He knows exactly what to bring before leaving the workshop. Zero wasted trips.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| View next work order | 10-15 times/day | Dashboard > Top of queue (sorted by priority) |
| Update request to "In Progress" | 10-15 times/day | Request detail > Status dropdown > "In Progress" |
| Mark request complete | 5-10 times/day | Request detail > "Complete" button > Add note > Save |
| Attach completion photo | 5-10 times/day | Request detail > Camera icon > Snap photo > Auto-upload |
| Check entry permission | 10-15 times/day | Request detail > Entry permission badge (top of page) |

### Edge Cases

1. **Resident not home, no entry permission**: Dave arrives and no one answers. System must allow him to mark "Unable to access -- resident absent" with one tap and auto-reschedule.
2. **Emergency repair**: A burst pipe requires immediate action. System should surface "Emergency" requests with a red banner and bypass the normal queue.
3. **Parts needed but not in stock**: Dave discovers mid-repair that a part is needed. He should be able to log "Parts ordered -- awaiting delivery" status with a purchase reference.
4. **Multi-unit issue**: A plumbing problem affects units on three floors. System should allow linking related service requests and marking them as a batch.
5. **Hazardous material**: A request involves asbestos or mold. System should flag it with a safety warning and require a certified specialist, preventing Dave from accepting the request.

### Accessibility Needs

- **Large, tappable buttons on mobile**: Dave uses the phone with work gloves. Minimum 56px tap targets.
- **Voice-to-text**: For adding completion notes while hands are dirty. One-tap voice input.
- **High contrast**: Workshop lighting varies. Bright outdoor areas, dim basement mechanical rooms.
- **Offline capability**: Some areas of the building (basement, parking garage) have poor connectivity. Work orders must load and be updatable offline with sync when reconnected.
- **Photo-first interface**: The camera should be one tap away on every work order. No navigating through menus to attach a photo.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Phone (rugged Android) | 70% | View work orders, update status, take photos, add notes, voice input, receive new assignments. |
| Desktop (workshop, 20") | 30% | Morning queue review, end-of-day status finalization, shift log, equipment dashboard, training. |

---

## 9. Persona 8: Board Member

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Helen Liu |
| **Age** | 61 |
| **Title** | Board Treasurer |
| **Tech Comfort** | Low-Moderate (4/10). Uses email and banking apps daily but unfamiliar with property management software. Needs things to be self-explanatory. |
| **Daily Environment** | Home office or living room. Accesses the system on her personal devices. Not on-site. |
| **Devices** | Laptop (primary): 15" Windows laptop, 1920x1080. Tablet (secondary): iPad for reading documents. Phone: iPhone for email and notifications. |
| **Working Hours** | Evenings and weekends (board work is voluntary, alongside a full-time job) |
| **Board Tenure** | 3 years as Treasurer, 5 years on the board |
| **Reports To** | Board President, condo owners (elected position) |

### Goals

1. **Financial oversight**: Understand where money is being spent. Vendor costs, maintenance expenses, amenity revenue.
2. **Compliance assurance**: Know that insurance, safety certifications, and regulatory requirements are current.
3. **Data-driven governance**: Make decisions based on data, not anecdotes. Occupancy rates, satisfaction trends, maintenance backlogs.
4. **Efficient meeting prep**: Review reports, pending approvals, and building updates before board meetings without spending hours.
5. **Transparency**: Access the same data the management team uses, presented in a way that is understandable without operational context.

### Frustrations

1. **Information arrives as email attachments**: Monthly reports come as Excel files and PDFs via email. No interactive dashboard. Cannot drill into the data.
2. **No real-time visibility**: Reports are a month old by the time they arrive. Board makes decisions on stale data.
3. **Cannot find documents**: Meeting minutes, bylaws, insurance certificates are scattered across email threads and shared drives.
4. **No approval workflow**: Alteration requests and major expenditures require board approval, but the process is email-based with no tracking.
5. **Jargon-heavy reports**: Management reports assume familiarity with operational terms. Helen does not know what an "Event Type 6" is.

### Daily Workflow

Board Members do not use the system daily. Their usage is cyclical, peaking around board meetings.

| Timing | Activity | Screen Used |
|--------|----------|-------------|
| **Weekly (15 min)** | Check dashboard for building health summary. Read new announcements. | `/dashboard` |
| **Weekly** | Review any pending approvals (alteration requests, major expenditures). | `/dashboard` (approvals widget) |
| **Bi-weekly** | Browse reports: maintenance trends, package volume, amenity utilization. | `/reports` |
| **Pre-meeting (1-2 hours)** | Deep-dive into reports. Review financial summaries. Download documents from library. | `/reports`, `/library` |
| **During meeting** | Reference live data on tablet. Pull up specific reports when questions arise. | `/reports`, `/analytics` |
| **Post-meeting** | Check that action items are reflected in the system. | `/dashboard` |
| **Quarterly** | Review annual comparison reports. Budget vs. actuals. | `/reports` |
| **Annually** | Election period. Review governance documents. | `/library` |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Governance Dashboard | `/dashboard` | 2-3 times/week | Financial summary, compliance, approvals, building health |
| Reports | `/reports` | 2-3 times/week | Maintenance, financial, compliance, utilization reports |
| Building Analytics | `/analytics` | 1-2 times/week | Trends, year-over-year comparisons, satisfaction scores |
| Announcements | `/announcements` | 2-3 times/week | Building updates, management communications |
| Library | `/library` | 1-2 times/week | Meeting minutes, bylaws, insurance certificates, budgets |
| Events | `/events` | Weekly | Community events, board meeting schedule |
| Surveys | `/surveys` | Monthly | Resident satisfaction surveys, voting |
| Amenity Usage (View) | `/amenities` | Monthly | Utilization data for capacity planning |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **OVERVIEW** | Dashboard, Amenities |
| **INFORMATION** | Announcements, Events, Library, Surveys |
| **GOVERNANCE** | Reports, Building Analytics |

### "Wow" Moment

**Pre-meeting briefing package, auto-generated.** Two days before every board meeting, Helen receives an email notification: "Your Board Briefing Package is ready." She clicks through and sees a clean, executive-summary-style page: key metrics with green/yellow/red indicators, a chart showing maintenance request trends (down 12% this quarter), vendor compliance status (1 vendor insurance expiring in 14 days), amenity utilization heatmap, and three items requiring board approval. She downloads the entire package as a single PDF for her tablet. What used to require chasing the Property Manager for a week of email back-and-forth now arrives automatically.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| View building health summary | 2-3 times/week | Login > Dashboard (auto-loads) |
| Download a report | 2-3 times/week | Reports > Select report > Download PDF |
| Review pending approvals | Weekly | Dashboard > Approvals widget > Click item |
| Find a document in library | 1-2 times/week | Library > Search > Click document |
| View announcement | 2-3 times/week | Announcements > Click announcement |

### Edge Cases

1. **Special assessment vote**: Board needs to send a vote to all owners. System must support a secure voting mechanism that differentiates owners from tenants.
2. **Confidential document**: Some board documents (legal, financial) should only be visible to board members, not all residents. Library needs access control per document.
3. **Board member turnover**: When Helen's term ends, her Board Member access must be revoked and reassigned. All approval workflows she participated in should retain her historical data.
4. **Emergency expenditure**: A broken elevator requires immediate repair exceeding the approval threshold. System must support emergency approval with post-hoc ratification.
5. **Conflict of interest**: A board member owns the unit that submitted an alteration request. System should flag the conflict and allow recusal from the approval.

### Accessibility Needs

- **Large, readable text**: Helen reads reports on an iPad. Body text must be 15px minimum. Reports must be zoomable without layout breaking.
- **Print-friendly layouts**: Helen prints reports for the board binder. PDF exports must have proper pagination, headers, and page numbers.
- **Simple navigation**: No more than 3 levels deep. If Helen cannot find something in 2 clicks, she will email the Property Manager instead.
- **Plain-language labels**: No operational jargon. "Service Requests" not "Event Type 3." "Building Health Score" not "Composite KPI."
- **Consistent layout**: Every time Helen visits, the dashboard should look the same. No dynamic reordering that confuses returning users.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Laptop (15") | 50% | Report review, deep-dive analytics, document downloads, detailed reading. |
| Tablet (iPad) | 35% | During-meeting reference, announcement reading, document review. |
| Phone | 15% | Notification check, quick dashboard glance, announcement reading. |

---

## 10. Persona 9: Owner (Resident)

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | John Patel |
| **Age** | 42 |
| **Title** | Condo Owner (Unit 1205) |
| **Tech Comfort** | Moderate (6/10). Uses online banking, food delivery apps, and social media daily. Expects modern, app-like experiences. |
| **Daily Environment** | Works from home 3 days/week. Uses the condo portal from his home office. Picks up packages on the way in from work. |
| **Devices** | Phone (primary): iPhone 15. Laptop (secondary): MacBook Air 13" for detailed tasks. |
| **Condo Residency** | 4 years, lives with spouse and one child (age 10) |
| **Reports To** | N/A (owner, but subject to condo bylaws and board decisions) |

### Goals

1. **Package awareness**: Know the instant a package arrives. Pick it up without standing in line at the desk.
2. **Maintenance resolution**: Submit a request, get a timeline, and track progress without calling the office.
3. **Amenity convenience**: Book the gym, party room, or guest suite quickly. See real-time availability.
4. **Community engagement**: Stay informed about building events, announcements, and governance.
5. **Ownership responsibilities**: Participate in surveys, review governance documents, attend (virtually or physically) board meetings.

### Frustrations

1. **Package notification is unreliable**: Gets an email about a package 4 hours after it arrives. By then, the desk is closed.
2. **Maintenance requests disappear into a void**: Submits a request and hears nothing for days. Has to call the office to check status.
3. **Amenity booking is confusing**: Cannot tell if the party room is actually available or if there is a pending booking.
4. **Too many emails**: Gets 5 emails a day from the building system, none of which are the important one (package arrival).
5. **No transparency**: Board makes decisions that affect condo fees, but there is no easy way to see what was discussed or decided.

### Daily Workflow

Residents use the system in short bursts, not continuous sessions.

| Timing | Activity | Screen Used |
|--------|----------|-------------|
| **Morning (2 min)** | Check dashboard for new packages, announcements. | `/dashboard` (phone) |
| **As needed** | Receive push notification for package arrival. | Push notification |
| **After work** | Pick up packages from concierge desk. System marks as released. | Handled by staff |
| **Weekly (5 min)** | Check amenity calendar. Book gym or party room. | `/amenities` (phone or laptop) |
| **As needed** | Submit maintenance request with photos. | `/service-requests/new` (phone) |
| **As needed** | Check maintenance request status. | `/service-requests/:id` (phone) |
| **Weekly** | Read announcements. | `/announcements` |
| **Monthly** | Browse classified ads marketplace. Post an item for sale. | `/marketplace` |
| **Quarterly** | Review survey. Participate in governance votes. | `/surveys` |
| **Annually** | Review AGM documents in library. | `/library` |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Resident Dashboard | `/dashboard` | 1-2 times/day | Package count, open requests, upcoming bookings, announcements |
| My Packages | `/my-packages` | 1-2 times/day | View pending and historical packages |
| My Requests | `/my-requests` | 2-3 times/week | Track maintenance request status |
| New Service Request | `/service-requests/new` | 1-2 times/month | Submit a new maintenance request |
| Amenity Calendar | `/amenities/calendar` | 1-2 times/week | Check availability, make bookings |
| Amenity Booking | `/amenities/book` | 1-2 times/month | Book an amenity |
| Announcements | `/announcements` | 2-3 times/week | Read building announcements |
| Events | `/events` | Weekly | Browse community events |
| Marketplace | `/marketplace` | 1-2 times/month | Browse or post classified ads |
| Library | `/library` | Monthly | Access building documents, bylaws |
| Surveys | `/surveys` | Quarterly | Participate in surveys and votes |
| My Account | `/account` | Rarely | Update contact info, notification preferences |
| Emergency Contacts | `/account/emergency` | Rarely | Manage emergency contact information |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **HOME** | Dashboard |
| **MY UNIT** | My Packages, My Requests, Amenity Booking |
| **BUILDING** | Announcements, Events, Marketplace, Library, Surveys |
| **ACCOUNT** | My Account |

### "Wow" Moment

**Instant push notification with release QR code.** John is at work when his phone buzzes: "Package from Amazon arrived at 2:14 PM. Stored in Parcel Room B." He swipes the notification and sees a QR code. When he gets home at 6 PM, he shows the QR code to the concierge, who scans it. The package is released in 3 seconds. No name lookup, no signing a paper log, no waiting. John shows his wife and says, "This building is so well-run."

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Check if a package arrived | 1-2 times/day | Push notification (zero clicks) or Dashboard > Package card |
| Submit maintenance request | 1-2 times/month | Dashboard > "Submit Request" > Fill form > Submit |
| Book an amenity | 1-2 times/month | Amenity Booking > Calendar > Select slot > Confirm |
| Read an announcement | 2-3 times/week | Dashboard > Announcement card > Read |
| Check request status | 2-3 times/week | My Requests > Click request > View timeline |

### Edge Cases

1. **Package arrived but system says no packages**: System error or staff forgot to log it. Resident needs a "Report Missing Package" button.
2. **Maintenance request for common area**: John notices a broken light in the hallway. Request form must support common area issues, not just in-unit problems.
3. **Emergency contact update during crisis**: Earthquake. John needs to update his emergency contacts immediately. The form must be accessible under stress.
4. **Noise complaint against own unit**: John's child has a drum lesson. A neighbor complains. The system must handle bidirectional complaints with privacy (John should not see who complained).
5. **Extended vacation**: John travels for 3 weeks. He wants to put a hold on package notifications and set a "resident away" status so management knows the unit is unoccupied.

### Accessibility Needs

- **Mobile-first design**: All key tasks must work flawlessly on iPhone. No pinch-to-zoom required.
- **Push notification reliability**: Notifications must be instant (< 30 seconds from staff action to resident phone).
- **Dark mode support**: John uses his phone in bed at night. The portal should respect system dark mode preference.
- **Simple language**: No industry jargon. "Your Package Has Arrived" not "Event Created: Parcel Intake."
- **Photo upload from phone**: Camera integration for maintenance request photos. Direct from camera, not file picker.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Phone (iPhone) | 75% | Package notifications, quick dashboard checks, maintenance request submission, amenity booking, announcement reading. |
| Laptop (MacBook) | 25% | Detailed maintenance request writing, document review (library), survey completion, marketplace browsing. |

---

## 11. Persona 10: Tenant (Resident)

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Aisha Rahman |
| **Age** | 26 |
| **Title** | Tenant (Unit 903) |
| **Tech Comfort** | High (8/10). Digital native. Uses apps for everything. Expects instant responses and modern UX. Compares everything to consumer apps. |
| **Daily Environment** | Works at an office downtown. Uses the portal mostly on her phone during commute and evenings. |
| **Devices** | Phone (primary): iPhone 16. Laptop (secondary): Personal laptop for rare detailed tasks. |
| **Lease Duration** | 1.5 years into a 2-year lease. Lives alone. |
| **Reports To** | N/A (tenant, subject to lease terms and building rules) |

### Goals

1. **Convenience**: Everything should be as easy as ordering food on a delivery app. If it takes more than 3 taps, it is too complex.
2. **Responsive maintenance**: When the heating breaks in January, she needs same-day response, not a ticket number and silence.
3. **Community connection**: Wants to know about building events, meet neighbors, sell furniture she no longer needs.
4. **Transparent communication**: Wants to know about maintenance schedules, elevator outages, and water shutoffs before they happen.
5. **Privacy**: Does not want her personal information visible to other residents. Only management should see her data.

### Frustrations

1. **Outdated interfaces**: Current building portal looks like it was built in 2005. She avoids using it and calls the concierge instead.
2. **No mobile app experience**: The portal is not responsive. Forms are painful to fill on a phone.
3. **Notification overload or silence**: Either gets too many irrelevant emails or no notification at all when something matters.
4. **Cannot track maintenance**: Submits a request and has no visibility. Texts the property manager directly, which is unprofessional but effective.
5. **No community features**: Wants to sell her old couch to a neighbor. No marketplace. Posts on social media group chat instead.

### Daily Workflow

| Timing | Activity | Screen Used |
|--------|----------|-------------|
| **Morning commute (2 min)** | Check dashboard for packages, announcements. | `/dashboard` (phone) |
| **As needed** | Receive push notification for packages. | Push notification |
| **Evening (5 min)** | Browse announcements, events, marketplace. | `/announcements`, `/events`, `/marketplace` (phone) |
| **As needed** | Submit maintenance request with photos. | `/service-requests/new` (phone) |
| **As needed** | Check maintenance request status. | `/service-requests/:id` (phone) |
| **Weekly** | Book gym or yoga studio. | `/amenities` (phone) |
| **Monthly** | Post or browse classified ads. | `/marketplace` (phone) |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Resident Dashboard | `/dashboard` | 1-2 times/day | Packages, requests, bookings, announcements |
| My Packages | `/my-packages` | 1-2 times/day | View packages |
| My Requests | `/my-requests` | 1-2 times/week | Track maintenance requests |
| New Service Request | `/service-requests/new` | Monthly | Submit maintenance request |
| Amenity Calendar | `/amenities/calendar` | 1-2 times/week | Check and book amenities |
| Announcements | `/announcements` | 2-3 times/week | Building updates |
| Events | `/events` | Weekly | Community events |
| Marketplace | `/marketplace` | 1-2 times/week | Browse and post classified ads |
| Library | `/library` | Rarely | Building rules, lease info |
| My Account | `/account` | Rarely | Profile, notification preferences |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **HOME** | Dashboard |
| **MY UNIT** | My Packages, My Requests, Amenity Booking |
| **BUILDING** | Announcements, Events, Marketplace, Library |
| **ACCOUNT** | My Account |

### "Wow" Moment

**Maintenance request with live status timeline.** Aisha submits a request for a broken dishwasher at 8 PM on her phone. She attaches two photos. At 8:02 PM, she receives a push notification: "Request received. Priority: Medium. Estimated response: tomorrow morning." At 9:15 AM, another notification: "Maintenance staff assigned: Dave K. Arrival window: 10 AM - 12 PM." At 10:30 AM: "Dave is working on your request." At 11:15 AM: "Request resolved. Please confirm: is the issue fixed?" She taps "Yes, resolved" and adds a star rating. The entire experience felt like tracking a delivery. She texts her friend: "You need to move here."

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Check for packages | Daily | Push notification or Dashboard (auto-loads) |
| Submit maintenance request | Monthly | Dashboard > "Submit Request" > Photo + description > Submit |
| Book gym | Weekly | Amenity Booking > Select gym > Pick slot > Confirm |
| Read announcement | 2-3 times/week | Dashboard > Announcement card |
| Post classified ad | Monthly | Marketplace > "+ Post" > Fill form > Publish |

### Edge Cases

1. **Lease expiring**: System should surface a non-intrusive reminder 90 days before lease end. Tenant should be able to indicate renewal interest.
2. **Noise complaint from neighbor**: Aisha plays music. Neighbor complains. She should not see the complainant's identity, but she should receive a notification that a noise concern was raised regarding her floor/area.
3. **Subletting concerns**: If the building does not allow subletting, the system should not display vacation rental features to tenants.
4. **Emergency while alone**: Aisha lives alone. Her emergency contacts (parents in another city) should be prominently stored and accessible to security staff.
5. **Guest staying for extended period**: A friend stays for 2 weeks. Some buildings require guest registration beyond a certain duration. System should prompt if the building policy requires it.

### Accessibility Needs

- **Mobile-first everything**: Aisha uses her phone 95% of the time. Every screen must be a first-class mobile experience.
- **Fast load times**: If the page takes more than 2 seconds, she will close it. Optimize for mobile network speeds.
- **System dark mode**: Respects iOS dark mode setting automatically.
- **Haptic feedback**: Confirmations (booking confirmed, request submitted) should trigger subtle haptic feedback on iOS.
- **Gesture support**: Swipe to dismiss notifications, pull to refresh on list screens.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Phone (iPhone) | 90% | Everything: packages, requests, bookings, announcements, marketplace, events. |
| Laptop | 10% | Detailed maintenance request writing, document review in library. |

---

## 12. Persona 11: Offsite Owner

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Robert Kim |
| **Age** | 55 |
| **Title** | Property Investor / Offsite Owner (Unit 710) |
| **Tech Comfort** | Moderate (5/10). Uses email, banking, and real estate apps. Functional with web tools but not enthusiastic. |
| **Daily Environment** | Lives in a different city. Owns the unit as an investment. Tenant (Aisha) occupies the unit. Robert has never met the concierge staff. |
| **Devices** | Laptop (primary): 14" ThinkPad. Phone (secondary): Android phone for notifications. |
| **Properties Owned** | 2 condo units in different buildings |
| **Reports To** | N/A (owner, subject to condo corporation governance) |

### Goals

1. **Investment protection**: Know that his unit and the building are being well-maintained. No surprises.
2. **Governance participation**: Vote in board elections, review financials, ensure the condo corporation is well-managed.
3. **Communication from management**: Receive important building announcements (assessments, rule changes, construction) without noise.
4. **Document access**: Access meeting minutes, financial statements, bylaws, and reserve fund studies at any time.
5. **Minimal engagement**: Does not want daily updates. Only critical and governance-related information.

### Frustrations

1. **Gets the same emails as residents**: Receives announcements about pool hours and yoga classes. Irrelevant for someone who does not live there.
2. **No governance-specific view**: Has to dig through a resident-oriented portal to find board documents and financial reports.
3. **Cannot participate remotely**: Board meetings require physical attendance. No virtual option or proxy voting in the current system.
4. **Financial data is opaque**: Cannot see a simple breakdown of where condo fees go. Reserve fund health is a mystery.
5. **No tenant visibility**: Does not know if his tenant has outstanding issues, unpaid amenity fees, or maintenance requests affecting the unit.

### Daily Workflow

Offsite Owners interact with the system infrequently and deliberately.

| Timing | Activity | Screen Used |
|--------|----------|-------------|
| **Weekly (5 min)** | Check dashboard for any critical building updates. | `/dashboard` |
| **As needed** | Read important announcements (special assessments, construction, rule changes). | `/announcements` |
| **Monthly** | Review building financial summary (if available to role). | `/reports` (limited) |
| **Quarterly** | Review library: meeting minutes, financial statements. | `/library` |
| **Annually** | Participate in AGM: review documents, vote in elections, review budget. | `/library`, `/surveys` |
| **As needed** | View events affecting the building (construction schedule, fire drill). | `/events` |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Limited Dashboard | `/dashboard` | 1-2 times/week | Announcements, building updates |
| Announcements | `/announcements` | 1-2 times/week | Critical building communications |
| Library | `/library` | Monthly | Meeting minutes, financials, bylaws |
| Surveys | `/surveys` | Quarterly/Annually | Governance votes, owner surveys |
| Events (View Only) | `/events` | Monthly | Building events, construction schedules |
| My Account | `/account` | Rarely | Contact info, notification preferences |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **HOME** | Dashboard |
| **BUILDING** | Announcements, Events (view), Library, Surveys |
| **ACCOUNT** | My Account |

### "Wow" Moment

**Owner-specific digest email.** Instead of daily noise, Robert receives a weekly "Owner's Digest" email: building health score (green), one critical announcement (rooftop repairs starting next month), one governance item (AGM scheduled for April 15, proxy vote form attached), and a link to the latest financial statement. All relevant. Zero noise. He forwards it to his accountant. Takes 2 minutes per week to stay fully informed.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Read important announcement | Weekly | Email link or Dashboard > Announcement card |
| Download financial statement | Monthly | Library > Financials > Download PDF |
| Vote in survey/election | Annually | Surveys > Active survey > Vote > Submit |
| Update notification preferences | Rarely | My Account > Notification Preferences > Save |

### Edge Cases

1. **Special assessment**: Building needs a $50,000 roof repair. Each owner is assessed $500. Robert needs clear notification, breakdown, and payment instructions.
2. **Tenant complaint**: If Robert's tenant (Aisha) receives multiple noise complaints, Robert should be notified as the owner without seeing specific complaint details.
3. **Unit access for repairs**: Building needs to access Unit 710 for a plumbing inspection. Robert must grant permission remotely, since he does not live there and the tenant may not respond.
4. **Proxy voting**: Robert cannot attend the AGM in person. He needs to designate a proxy voter through the system.
5. **Selling the unit**: When Robert sells, his access must transfer to the new owner. System must support ownership transfer workflow.

### Accessibility Needs

- **Email-first communication**: Robert primarily interacts via email digest. The email must be well-formatted, mobile-responsive, and contain direct links to relevant pages.
- **Simple, self-explanatory pages**: Robert visits infrequently. The interface must be instantly understandable without a learning curve each time.
- **PDF download for offline review**: Financial documents must be downloadable as clean PDFs. Robert reviews them offline with his accountant.
- **Large text on governance documents**: Financial reports and bylaws must be readable without zooming.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Laptop (ThinkPad) | 60% | Document review, library browsing, survey completion, detailed reading. |
| Phone (Android) | 40% | Notification reading, quick dashboard check, announcement reading. |

---

## 13. Persona 12: Family Member

### Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Nina Patel |
| **Age** | 17 (turns 18 in 3 months; account created at 18) |
| **Title** | Family Member (Unit 1205, John Patel's daughter) |
| **Tech Comfort** | Very High (9/10). Digital native. Uses every app, learns new interfaces instantly. Expects consumer-grade UX. |
| **Daily Environment** | Lives with parents in Unit 1205. Uses the building's amenities frequently (gym, study room). Picks up family packages. |
| **Devices** | Phone (primary and only): iPhone 16. Does not use a computer for building tasks. |
| **Relationship** | Daughter of John Patel (Owner). Linked to Unit 1205. |
| **Reports To** | N/A (dependent of Owner) |

### Goals

1. **Pick up packages**: Know when family packages arrive. Pick them up without bothering parents.
2. **Book amenities**: Reserve the gym, study room, or party room for personal or family use.
3. **Stay informed**: Know about building events, social activities, and any disruptions (elevator maintenance).
4. **Simple and fast**: Open the app, do the thing, close the app. Under 30 seconds for any task.

### Frustrations

1. **No visibility into family packages**: Parents get the notification. Nina has to ask "did a package come?" before going downstairs.
2. **Cannot book amenities independently**: Has to ask parents to book the party room for a birthday gathering.
3. **Portal is not app-like**: Feels like a website, not a modern app. No swipe gestures, no animations, no dark mode.
4. **Too much information**: Dashboard shows building governance info and announcements about board meetings. Irrelevant for a teenager.

### Daily Workflow

| Timing | Activity | Screen Used |
|--------|----------|-------------|
| **After school (1 min)** | Check dashboard for packages. | `/dashboard` (phone) |
| **As needed** | Receive push notification for package arrival. Pick up package. | Push notification |
| **Weekly** | Book gym or study room. | `/amenities` (phone) |
| **Weekly** | Browse events (social events, community activities). | `/events` (phone) |
| **As needed** | Read announcements about building disruptions. | `/announcements` (phone) |

### Key Screens

| Screen | Route | Frequency | Purpose |
|--------|-------|-----------|---------|
| Basic Dashboard | `/dashboard` | 1 time/day | Package count, upcoming bookings |
| My Packages | `/my-packages` | 1 time/day | View family packages |
| Amenity Calendar | `/amenities/calendar` | 1-2 times/week | Check availability |
| Amenity Booking | `/amenities/book` | 1-2 times/week | Book amenity |
| Announcements | `/announcements` | 1-2 times/week | Building updates |
| Events | `/events` | Weekly | Community events |
| Library | `/library` | Rarely | Building rules (pool hours, gym rules) |
| My Account | `/account` | Rarely | Limited profile editing |

### Navigation Items Visible

| Section | Items |
|---------|-------|
| **HOME** | Dashboard |
| **MY UNIT** | My Packages, Amenity Booking |
| **BUILDING** | Announcements, Events, Library |
| **ACCOUNT** | My Account |

### "Wow" Moment

**Package notification shared with family.** A package arrives for "Patel, Unit 1205." Both John (Owner) and Nina (Family Member) receive push notifications. Nina is home. She goes downstairs, shows her QR code to the concierge, and picks up the package. John gets a follow-up notification: "Package picked up by Nina Patel at 4:12 PM." He does not need to worry. The system treated the family as a unit, not as individual accounts in isolation.

### Critical Tasks (< 3 clicks)

| Task | Frequency | Click Path |
|------|-----------|------------|
| Check for packages | Daily | Push notification or Dashboard > Package card |
| Book gym | Weekly | Amenity Booking > Gym > Select slot > Confirm |
| Read an event | Weekly | Events > Click event card |
| Pick up package (QR) | As needed | Push notification > Show QR > Scanned |

### Edge Cases

1. **Age verification for certain amenities**: Some amenities (pool after hours, gym with heavy equipment) may have age restrictions. System should enforce configurable age minimums per amenity.
2. **Family Member creates a maintenance request**: Family Members cannot create maintenance requests per role definition. The system must clearly direct them to ask the primary resident (Owner or Tenant).
3. **Family Member attempts to cancel Owner's booking**: Booking belongs to Dad. Nina should be able to cancel only her own bookings, not her father's.
4. **Family Member moves out**: Nina goes to university. Her Family Member access should be removable by the Owner (John) without admin intervention.
5. **Two family members book the same amenity**: Nina and her brother both try to book the gym at the same time. System should allow multiple family members if the amenity's per-unit concurrent booking limit is not exceeded.

### Accessibility Needs

- **100% mobile-optimized**: Nina will never use a desktop. Every pixel must be designed for a 6.1" phone screen.
- **Fast load times**: Instant. If it takes 3 seconds, she will use a different approach (text Dad).
- **Dark mode**: Non-negotiable. Uses phone in dark mode exclusively.
- **Gesture-based interactions**: Swipe to dismiss, pull to refresh, long-press for options. Standard iOS patterns.
- **Minimal text**: Icons and visual cues over paragraph descriptions. Use badges and counts, not sentences.

### Mobile vs Desktop

| Device | Usage Split | Tasks Performed |
|--------|-------------|-----------------|
| Phone (iPhone) | 100% | Everything. Packages, bookings, events, announcements. |
| Desktop | 0% | Never. |

---

## 14. Cross-Persona Interaction Map

This section documents who communicates with whom, what actions trigger cross-persona interactions, and the communication pathways within the system.

### 14.1 Communication Matrix

```
                    SuperAdmin  PropAdmin  PropMgr  SecSup  SecGuard  Concierge  Maint  Board  Owner  Tenant  Offsite  Family
SuperAdmin              -          A         .        .       .         .         .       .      .       .       .        .
PropAdmin              A           -         A        A       .         .         .       A      A       A       A        .
PropMgr                .           A         -        A       A         A         A       A      A       A       .        .
SecSup                 .           A         A        -       A         A         .       .      .       .       .        .
SecGuard               .           .         A        A       -         A         .       .      N       N       .        N
Concierge              .           .         A        A       A         -         .       .      N       N       .        N
Maint                  .           .         A        .       .         .         -       .      N       N       .        .
Board                  .           A         A        .       .         .         .       -      .       .       .        .
Owner                  .           A         A        .       .         N         N       .      -       .       .        .
Tenant                 .           A         A        .       .         N         N       .      .       -       .        .
Offsite                .           A         .        .       .         .         .       .      .       .       -        .
Family                 .           .         .        .       .         N         .       .      .       .       .        -

Legend:
A = Administrative communication (assignments, reports, approvals, directives)
N = Notification-based communication (package alerts, request updates, visitor confirmations)
. = No direct system communication
```

### 14.2 Communication Pathways

| From | To | Trigger | Channel | Content |
|------|----|---------|---------|---------|
| Concierge | Owner/Tenant/Family | Package intake | Push + Email | "Package arrived for Unit 1205" |
| Concierge | Owner/Tenant | Visitor arrival | Push | "Visitor John Doe at front desk for Unit 1205" |
| Security Guard | Security Supervisor | Incident created | In-app notification | "New incident: Unit 302 noise complaint" |
| Security Supervisor | Property Manager | Incident escalation | In-app + Email | "Escalated incident requires management attention" |
| Owner/Tenant | Property Manager | Maintenance request submitted | In-app notification | "New service request: Leaking faucet, Unit 1205" |
| Property Manager | Maintenance Staff | Request assigned | Push + In-app | "New assignment: Leaking faucet, Unit 1205, Priority: High" |
| Maintenance Staff | Owner/Tenant | Status update | Push | "Your request is in progress / resolved" |
| Property Manager | All Residents | Announcement | Push + Email + SMS | "Elevator maintenance scheduled March 20-22" |
| Property Admin | Board Member | Report generated | Email + In-app | "March Board Report is ready for review" |
| Property Admin | Offsite Owner | Governance notice | Email | "AGM Notice: April 15, proxy vote enclosed" |
| Board Member | Property Admin | Approval decision | In-app | "Alteration request for Unit 502: Approved" |
| Property Admin | All Staff | Training assignment | In-app + Email | "New training course assigned: Fire Safety 2026" |
| System | Security Supervisor | Key overdue alert | Push + In-app | "Key #K-045 not returned by end of shift" |
| System | Property Manager | SLA breach warning | In-app | "Service request #4521 approaching 48-hour SLA" |
| System | Property Admin | Vendor insurance expiring | Email + In-app | "ABC Plumbing insurance expires in 14 days" |

### 14.3 Information Flow Diagram

```
                                    ┌─────────────┐
                                    │ Super Admin  │
                                    │ (Platform)   │
                                    └──────┬───────┘
                                           │ Platform config, AI settings
                                           ▼
                                    ┌─────────────┐
                                    │ Prop Admin   │
                              ┌─────│ (Building)   │─────┐
                              │     └──────┬───────┘     │
                    Settings, │            │             │ Reports,
                    Users     │            │             │ Approvals
                              │     ┌──────┴───────┐     │
                              │     │ Prop Manager │     │
                              │     │ (Operations) │     │
                              │     └──┬───┬───┬───┘     │
                              │        │   │   │         │
                 ┌────────────┼────────┘   │   └─────────┼─────────────┐
                 │            │            │             │             │
          ┌──────┴─────┐  ┌──┴──────┐  ┌──┴────────┐  ┌┴──────────┐  │
          │ Sec Super  │  │Concierge│  │ Maint     │  │Board      │  │
          └──────┬─────┘  └────┬────┘  │ Staff     │  │Member     │  │
                 │             │       └─────┬─────┘  └───────────┘  │
          ┌──────┴─────┐       │             │                       │
          │ Sec Guard  │       │             │                       │
          └──────┬─────┘       │             │                       │
                 │             │             │                       │
                 └──────┬──────┴─────────────┘                       │
                        │                                            │
                        ▼ Notifications                              │
                 ┌─────────────┐                                     │
                 │  Residents  │◄────────────────────────────────────┘
                 │ Owner       │  Announcements, Reports
                 │ Tenant      │
                 │ Offsite     │
                 │ Family      │
                 └─────────────┘
```

### 14.4 Notification Routing Rules

The system must determine which personas receive notifications for each event type. Incorrect routing leads to noise (too many irrelevant notifications) or silence (missed critical alerts).

| Event Type | Immediate Notify | Digest Notify | Never Notify |
|------------|-----------------|---------------|--------------|
| Package arrival | Owner, Tenant, Family (for their unit) | -- | All other personas |
| Package unreleased > 24h | Concierge, Property Manager | Owner, Tenant | Board, Offsite, Family, Guards |
| Visitor arrival | Owner, Tenant (for their unit) | -- | All other personas |
| Security incident | Security Supervisor, Property Manager | Property Admin | Residents (unless their unit is involved) |
| Maintenance request created | Property Manager | Property Admin | All others except requestor |
| Maintenance request assigned | Maintenance Staff (assignee), Requestor | Property Manager | All others |
| Maintenance request resolved | Requestor | Property Manager, Property Admin | All others |
| Amenity booking confirmed | Requesting resident | Property Manager | All others |
| Amenity booking denied | Requesting resident | Property Manager | All others |
| Announcement published | All residents, all staff | Offsite Owner (weekly digest) | -- |
| Emergency broadcast | ALL personas (override all preferences) | -- | -- |
| Vendor insurance expiring | Property Admin, Property Manager | -- | All others |
| Training course assigned | Assigned staff member | Security Supervisor (for team) | All others |
| Training course overdue | Assigned staff member, their supervisor | Property Manager | All others |
| Board approval needed | All Board Members | Property Admin | All others |
| Shift log not written | Outgoing guard/concierge | Security Supervisor | All others |
| Key not returned | Security Supervisor, Property Manager | Property Admin | All others |
| SLA breach approaching | Property Manager | Property Admin | All others |
| Login from new device | The user themselves | Property Admin (for staff accounts) | All others |
| Parking violation created | Property Manager | Vehicle owner (if identifiable) | All others |

### 14.5 Persona Activity Overlap by Time of Day

Understanding when each persona is active helps with system load planning, notification timing, and support coverage.

```
Time     Super  Prop   Prop   Sec    Sec    Conc   Maint  Board  Owner  Tenant  Off    Family
         Admin  Admin  Mgr    Sup    Guard  ierge  Staff  Member               site
─────────────────────────────────────────────────────────────────────────────────────────────────
6 AM      .      .      .      .     ████    .      .      .      .      .      .      .
7 AM      .      .      .     ████   ████   ████   ████    .      ░░     .      .      .
8 AM     ████   ████    .     ████   ████   ████   ████    .      ░░     ░░     .      .
9 AM     ████   ████   ████   ████   ████   ████   ████    .      ░░     ░░     .      ░░
10 AM    ████   ████   ████   ████   ████   ████   ████    .      ░░     .      ░░     .
11 AM    ████   ████   ████   ████   ████   ████   ████    .      .      .      ░░     .
12 PM    ░░     ░░     ░░     ░░     ████   ░░     ░░      .      .      .      .      .
1 PM     ████   ████   ████   ████   ████   ████   ████    .      .      .      ░░     .
2 PM     ████   ████   ████   ████   ████   ████   ████    .      .      .      .      .
3 PM     ████   ████   ████   ░░     ████   ████   ████    .      .      .      .      ░░
4 PM     ████   ████   ████    .     ████   ████    .      .      ░░     .      .      ░░
5 PM     ████   ████   ████    .     ████    .      .      .      ░░     ░░     .      ░░
6 PM     ░░      .      .      .     ████    .      .      ░░     ████   ████    .     ████
7 PM      .      .      .      .     ████    .      .     ████    ████   ████    .     ████
8 PM      .      .      .      .     ████    .      .     ████    ░░     ████    .     ░░
9 PM      .      .      .      .     ████    .      .     ████    ░░     ░░      .      .
10 PM     .      .      .      .     ████    .      .      ░░     .      .       .      .
11 PM     .      .      .      .     ████    .      .      .      .      .       .      .

Legend: ████ = Primary active hours   ░░ = Occasional/light usage   . = Inactive
```

### 14.6 Persona Dependency Chain

Some personas cannot function effectively without actions from other personas. These dependencies must be considered in system design to prevent bottlenecks.

| Dependent Persona | Depends On | For What | Bottleneck Risk |
|-------------------|------------|----------|-----------------|
| Security Guard | Property Admin | Account creation, role assignment | Medium -- new hire cannot start until account exists |
| Security Guard | Security Supervisor | Shift assignments, training | Low -- supervisor is usually present |
| Maintenance Staff | Property Manager | Work order assignments | High -- unassigned requests sit idle |
| Board Member | Property Admin | Report generation, document upload | Medium -- board meetings depend on timely reports |
| Owner/Tenant | Concierge/Guard | Package logging and release | High -- residents cannot self-serve packages |
| Owner/Tenant | Property Manager | Maintenance resolution | High -- no self-service repair option |
| Family Member | Owner/Tenant | Account creation (must be linked by primary resident or admin) | Low -- one-time setup |
| Offsite Owner | Property Admin | Governance document upload | Medium -- AGM prep depends on admin |
| Concierge | Property Manager | Amenity booking rule configuration | Low -- rules rarely change |
| Property Manager | Property Admin | Settings and configuration changes | Low -- stable after initial setup |

---

## 15. Handoff Points

Handoff points are moments where one persona's action triggers a required response from another persona. These are critical for system design because a failure at any handoff means a dropped ball.

### 15.1 Package Lifecycle Handoff

```
Courier arrives
    │
    ▼
[Concierge/Guard] ──logs package──► System sends notification ──► [Owner/Tenant/Family]
                                                                         │
                                                                    Arrives at desk
                                                                         │
                                                                         ▼
[Concierge/Guard] ◄──shows QR code── [Owner/Tenant/Family]
    │
    ▼
[Concierge/Guard] ──scans/releases──► System marks released ──► [Owner/Tenant/Family]
                                                                   (confirmation)
```

**Critical Handoff**: Package logged to notification received. Must be < 30 seconds.

### 15.2 Maintenance Request Lifecycle Handoff

```
[Owner/Tenant] ──submits request──► System creates ticket
                                         │
                                         ▼
                                    [Property Manager] ──reviews + assigns──► [Maintenance Staff]
                                                                                    │
                                                                               Works on issue
                                                                                    │
                                                                                    ▼
[Owner/Tenant] ◄──status update──── [Maintenance Staff] ──updates status──► System notifies
    │
    ▼
[Owner/Tenant] ──confirms resolution──► System closes ticket ──► [Property Manager]
                                                                    (stats updated)
```

**Critical Handoff**: Request submitted to first response. Must be < 4 hours (SLA configurable).

### 15.3 Incident Escalation Handoff

```
[Security Guard] ──creates incident──► System logs event
                                            │
                                            ▼
                                       [Security Supervisor] ──reviews──► Decision:
                                                                           │
                                                          ┌────────────────┼─────────────────┐
                                                          │                │                 │
                                                     Resolved       Add notes         Escalate
                                                     (close)        (continue)            │
                                                                                          ▼
                                                                                    [Prop Manager]
                                                                                          │
                                                                              ┌───────────┴──────────┐
                                                                              │                      │
                                                                         Resolved              Escalate to
                                                                                              [Prop Admin]
```

**Critical Handoff**: Guard incident creation to Supervisor review. Must be visible within 1 minute (real-time feed).

### 15.4 Amenity Booking Approval Handoff

```
[Owner/Tenant/Family] ──requests booking──► System checks rules
                                                 │
                                         ┌───────┴────────┐
                                         │                │
                                    Auto-approved    Needs approval
                                    (instant)             │
                                         │                ▼
                                         │          [Property Manager] ──reviews──► Approve / Deny
                                         │                                              │
                                         ▼                                              ▼
                                    [Resident] ◄──confirmation────── System notifies both
```

**Critical Handoff**: Booking request to approval decision. Must be < 24 hours. Auto-approval for standard bookings, manual for premium amenities.

### 15.5 Emergency Broadcast Handoff

```
Emergency detected (fire alarm, flood, security threat)
    │
    ▼
[Prop Admin / Prop Manager / Sec Supervisor] ──triggers broadcast──► System sends:
                                                                         │
                                                          ┌──────────────┼──────────────┐
                                                          │              │              │
                                                     Push to ALL    SMS to ALL    Email to ALL
                                                     residents      residents     residents
                                                     + staff        + staff       + staff
                                                          │              │              │
                                                          └──────────────┴──────────────┘
                                                                         │
                                                                         ▼
                                                                    ALL PERSONAS
                                                                    receive alert
```

**Critical Handoff**: Trigger to delivery across all channels. Must be < 60 seconds for push, < 120 seconds for SMS, < 300 seconds for email.

### 15.6 Shift Change Handoff

```
[Outgoing Guard/Concierge] ──writes shift log──► System stores
                                                       │
                                                       ▼
[Incoming Guard/Concierge] ──reads shift log──► Acknowledges
                                                       │
                                                       ▼
                                                  System marks
                                                  "shift accepted"
                                                       │
                                                       ▼
                                               [Security Supervisor]
                                               sees shift transition
                                               confirmed in analytics
```

**Critical Handoff**: Shift log must be written before shift end. System should prompt 30 minutes before shift ends if no log entry exists.

### 15.7 Board Approval Handoff

```
[Property Manager] ──creates approval request──► System queues for board
                                                        │
                                                        ▼
                                                   [Board Members] ──review──► Vote (approve/deny/defer)
                                                                                    │
                                                                              ┌─────┴──────┐
                                                                              │            │
                                                                          Approved      Denied
                                                                              │            │
                                                                              ▼            ▼
                                                                     [Prop Manager]  [Prop Manager]
                                                                     executes        notifies
                                                                     decision        requestor
```

**Critical Handoff**: Request creation to board notification. Must happen within 24 hours. Reminder if no vote within 7 days.

---

## 16. Conflict Scenarios and Resolution

When personas have competing needs, the system must resolve conflicts gracefully. Below are the key conflict scenarios and how Concierge handles each.

### 16.1 Amenity Double-Booking

| Aspect | Detail |
|--------|--------|
| **Conflict** | Two residents attempt to book the same amenity at the same time slot. |
| **Personas Involved** | Owner (John) vs. Tenant (Aisha) |
| **Resolution** | First-come-first-served enforced by the system at the database level. The second request receives an instant rejection with alternative time suggestions. No manual intervention needed. |
| **Implementation** | Optimistic locking on the booking slot. If two requests arrive within the same second, the database transaction that commits first wins. The other receives a friendly error: "This slot was just booked. Here are 3 available alternatives." |
| **Escalation** | If a resident disputes, Property Manager can view booking timestamps and override if justified. |

### 16.2 Maintenance Priority Conflict

| Aspect | Detail |
|--------|--------|
| **Conflict** | Multiple residents submit urgent maintenance requests simultaneously. Limited maintenance staff available. |
| **Personas Involved** | Owner (John) submits "leaking ceiling" (water damage risk). Tenant (Aisha) submits "no hot water" (comfort issue). Only Dave is available. |
| **Resolution** | System uses priority scoring: safety/damage risk > habitability > comfort > cosmetic. Water damage outranks hot water. Property Manager sees AI-suggested priority order and can override. |
| **Implementation** | Each request category has a base priority score. "Water leak" = 90 (safety). "Hot water" = 60 (habitability). AI adjusts based on keywords, photos, and history. Property Manager dashboard shows priority-ranked queue with clear scoring rationale. |
| **Escalation** | If both are critical, Property Manager calls an external vendor for the lower-priority job. System supports one-click vendor dispatch. |

### 16.3 Package Storage Capacity

| Aspect | Detail |
|--------|--------|
| **Conflict** | Package room is at capacity. New packages keep arriving from couriers. |
| **Personas Involved** | Concierge (Maria) logging packages vs. Residents who have not picked up packages for days. |
| **Resolution** | System surfaces an aging report: packages unreleased for > 48 hours are highlighted. Concierge triggers reminder notifications to those residents. If a resident has 5+ unreleased packages, system sends an escalated notice. Property Manager can set a maximum hold period after which packages are returned to sender. |
| **Implementation** | Dashboard shows storage capacity as a percentage bar. At 80%, a yellow warning appears. At 95%, a red alert triggers auto-notifications to residents with the oldest packages. |

### 16.4 Noise Complaint: Resident vs. Resident

| Aspect | Detail |
|--------|--------|
| **Conflict** | Owner (John) complains about noise from the unit above. The unit above belongs to another Owner who is hosting a permitted event. |
| **Personas Involved** | Owner (complainant), Owner (event host), Security Guard (logs complaint), Property Manager (mediates). |
| **Resolution** | Security Guard logs the noise complaint as a security event without identifying the complainant to the subject. Property Manager reviews both the complaint and the amenity booking (party room or in-unit event). If the event is within permitted hours, Property Manager sends a polite reminder to the host about noise limits. If outside permitted hours, a formal warning is issued. |
| **Implementation** | Complaints are privacy-protected: the subject sees "a noise concern has been raised" but not the complainant's identity. Property Manager sees both sides. Pattern detection: if the same unit receives 3+ complaints in a month, auto-escalation to Property Admin. |

### 16.5 Board Approval Stalemate

| Aspect | Detail |
|--------|--------|
| **Conflict** | An alteration request requires board approval. Board members are split: 2 approve, 2 deny, 1 has not voted. |
| **Personas Involved** | Board Members (5), Property Manager (requesting), Owner (requesting alteration). |
| **Resolution** | System enforces the building's governance bylaws. If a simple majority is required (3 of 5), the system waits for the 5th vote with automated reminders at 3 days and 7 days. After 14 days without a quorum, the request is escalated to the Property Admin with a notice to the board chair. |
| **Implementation** | Configurable voting rules per property (simple majority, two-thirds, unanimous). Deadline-based reminders. Abstention is counted as a non-vote, not a vote. |

### 16.6 Staff vs. Resident: Access Conflict

| Aspect | Detail |
|--------|--------|
| **Conflict** | Maintenance Staff (Dave) needs to enter a unit for emergency pipe repair. Resident (Aisha) has set "no entry without my presence" and is at work. |
| **Personas Involved** | Maintenance Staff, Tenant, Property Manager. |
| **Resolution** | Emergency overrides resident preference. Property Manager authorizes emergency entry in the system, which logs the override with timestamp, reason, and authorizing manager. Resident receives a notification: "Emergency access to your unit was required for [reason]. Authorized by [name]. Contact management with questions." |
| **Implementation** | Entry permission field on work orders has three states: "Resident present," "Enter if absent," "Do not enter." Emergency override requires Property Manager or Property Admin authorization. All overrides are logged in the audit trail. |

### 16.7 Concurrent System Access: Guard Shift Change

| Aspect | Detail |
|--------|--------|
| **Conflict** | Outgoing guard is finishing a security event entry while incoming guard tries to log in on the same shared lobby computer. |
| **Personas Involved** | Security Guard (outgoing), Security Guard (incoming). |
| **Resolution** | System supports quick-switch user profiles on shared computers. A "Switch User" button in the sidebar user panel opens a fast-login screen (PIN or badge scan) without logging out the current user's unsaved work. The outgoing guard's draft event is preserved and auto-saved. |
| **Implementation** | Shared-device mode: enabled per device by Property Admin. Fast-switch preserves drafts in local storage. Each guard's session is isolated. Outgoing guard's session auto-locks after 5 minutes of inactivity on the same device. |

### 16.8 Notification Overload vs. Critical Alert

| Aspect | Detail |
|--------|--------|
| **Conflict** | A resident has muted package notifications (too many Amazon deliveries). But an emergency broadcast needs to reach everyone. |
| **Personas Involved** | All residents, Property Admin (broadcasting). |
| **Resolution** | Emergency broadcasts override all notification preferences. This is the one exception to user-controlled notification settings. The system distinguishes between three notification tiers: (1) Standard -- respects preferences, (2) Important -- bypasses "mute all" but respects "do not disturb" hours, (3) Emergency -- overrides everything, including DND. |
| **Implementation** | Notification tiers are set at the announcement level. Only Property Admin and above can send Tier 3 (Emergency). The system clearly labels emergency overrides so residents understand why they received the notification despite their preferences. |

---

## 17. Accessibility Matrix

This matrix summarizes accessibility needs across all personas, ensuring the system meets WCAG 2.2 AA standards for every user context.

| Persona | Primary Device | Lighting Condition | Motor Consideration | Vision Consideration | Cognitive Consideration |
|---------|---------------|-------------------|---------------------|---------------------|------------------------|
| Super Admin | Desktop 27" | Controlled (home office) | Standard keyboard/mouse | Extended screen time: high contrast mode needed | Dense data dashboards: progressive disclosure, clear hierarchy |
| Property Admin | Desktop 24" | Office lighting | Standard keyboard/mouse | Reading reports: 15px minimum, print-friendly | Non-technical user: plain language, tooltips on every icon |
| Property Manager | Desktop + Phone | Variable (office + outdoors) | Phone one-handed use during walks | Quick scanning: large KPI numbers | Context switching: clear navigation, breadcrumbs |
| Security Supervisor | Desktop 22" | Dim (security office, CCTV glare) | Standard | High contrast for dim environments | Analytical displays: clear charting, no data overload |
| Security Guard | Shared desktop + Phone | Bright lobby | Gloved hands (winter): 56px+ mobile targets | Bright ambient light: AAA contrast (7:1) | Time pressure: minimal reading, action-oriented buttons |
| Concierge | Desktop 24" | Lobby (variable) | Standard, minimal scrolling | Arm's-length reading: large display text | Frequent interruptions: auto-save all drafts |
| Maintenance Staff | Phone (primary) | Variable (basement to rooftop) | Dirty/gloved hands: 56px+ targets, voice input | Variable lighting: adaptive contrast | Low tech comfort: minimal text, photo-first |
| Board Member | Laptop + Tablet | Home lighting | Standard | Aging eyes: large text, zoomable layouts | Infrequent use: self-explanatory UI, no learning curve |
| Owner | Phone (primary) | Variable | Standard mobile use | Standard | Standard consumer expectations |
| Tenant | Phone (primary) | Variable | Standard mobile use | Dark mode support | Expects instant feedback, consumer-grade UX |
| Offsite Owner | Laptop | Home/office | Standard | PDF readability | Infrequent use: simple, obvious navigation |
| Family Member | Phone only | Variable | Standard mobile use | Dark mode essential | Digital native: expects gestures, haptics, speed |

### Universal Accessibility Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color contrast | WCAG 2.2 AA (4.5:1 text, 3:1 UI components) | All semantic colors validated against both white and dark backgrounds |
| Keyboard navigation | Full keyboard operability | Tab order optimized for each role's critical tasks. Skip links on every page. |
| Screen reader | ARIA labels on all interactive elements | Landmarks for sidebar, main content, and widgets. Live regions for real-time updates. |
| Focus indicators | Visible focus ring | 3px accent-color ring on all focusable elements. Never removed. |
| Touch targets | Minimum 44px (design system), 56px for field use | All primary action buttons, form controls, and navigation items meet minimum. |
| Text scaling | Responsive to browser zoom up to 200% | Layouts reflow gracefully. No horizontal scroll below 200% zoom. |
| Motion sensitivity | Reduced motion preference respected | `prefers-reduced-motion` disables animations, transitions use instant swap. |
| Error identification | Errors identified by color AND text AND icon | Red border + red text message + error icon on all form validation. |
| Time limits | No time limits without warning | Session timeout shows a 2-minute warning modal with "Extend" button. |
| Consistent navigation | Sidebar position and order never changes within a role | Menu items are fixed per role. No dynamic reordering. |

---

## 18. Device Strategy Matrix

This matrix provides a comprehensive view of device usage across all personas, informing responsive design priorities.

### 18.1 Device Usage by Persona

| Persona | Desktop | Laptop | Tablet | Phone | Primary Device |
|---------|:-------:|:------:|:------:|:-----:|:--------------:|
| Super Admin | 85% | 10% | 0% | 5% | Desktop (27") |
| Property Admin | 75% | 5% | 15% | 10% | Desktop (24") |
| Property Manager | 65% | 0% | 5% | 30% | Desktop (24") |
| Security Supervisor | 70% | 0% | 0% | 30% | Desktop (22") |
| Security Guard | 80% | 0% | 0% | 20% | Desktop (22" shared) |
| Concierge | 85% | 0% | 0% | 15% | Desktop (24") |
| Maintenance Staff | 30% | 0% | 0% | 70% | Phone |
| Board Member | 0% | 50% | 35% | 15% | Laptop (15") |
| Owner | 0% | 25% | 0% | 75% | Phone |
| Tenant | 0% | 10% | 0% | 90% | Phone |
| Offsite Owner | 0% | 60% | 0% | 40% | Laptop (14") |
| Family Member | 0% | 0% | 0% | 100% | Phone |

### 18.2 Design Priority by Viewport

| Viewport | Primary Users | Design Priority |
|----------|---------------|-----------------|
| **Large desktop (2560px+)** | Super Admin | Multi-panel dashboards, side-by-side analytics, dense data tables |
| **Standard desktop (1920px)** | Property Admin, Property Manager, Security Supervisor, Security Guard, Concierge | Full sidebar, 12-column grid, standard dashboards, all features |
| **Small desktop / Laptop (1280-1440px)** | Board Member, Offsite Owner | Collapsed sidebar option, slightly narrower content area, full functionality |
| **Tablet (768-1024px)** | Property Admin (walk-throughs), Board Member (meetings) | Collapsible sidebar, stacked cards, touch-optimized buttons |
| **Phone (375-428px)** | Maintenance Staff, Owner, Tenant, Family Member, all personas for alerts | Full-width cards, bottom navigation, camera integration, gesture support |

### 18.3 Shared Device Considerations

| Scenario | Personas | Requirement |
|----------|----------|-------------|
| Lobby security desk | Security Guard (all shifts) | Fast user switching (PIN/badge), session isolation, auto-lock on inactivity |
| Concierge desk | Concierge (day/evening) | Same as above, plus draft preservation across user switches |
| Maintenance workshop | Maintenance Staff (shared PC) | Fast login, personalized work queue loads immediately |
| Board meeting projector | Board Member + Property Admin | Presentation mode: hide sensitive data, show aggregates only |

### 18.4 Offline Requirements

| Persona | Offline Scenario | Required Capability |
|---------|------------------|---------------------|
| Security Guard | Parking garage patrol (no WiFi) | View cached unit instructions, create events offline, auto-sync when reconnected |
| Maintenance Staff | Basement mechanical rooms | View cached work orders with photos, update status offline, photo capture with queued upload |
| Concierge | Internet outage at lobby desk | Cached package list, offline event creation, auto-sync queue |
| Owner/Tenant | Elevator (brief loss) | Cached dashboard data, offline QR code for package pickup |

---

## 19. Persona Summary Comparison

A quick-reference table for the design and engineering team comparing all 12 personas side-by-side.

### 19.1 At-a-Glance Profile Comparison

| Attribute | Super Admin | Prop Admin | Prop Mgr | Sec Sup | Sec Guard | Concierge | Maint Staff | Board | Owner | Tenant | Offsite | Family |
|-----------|:-----------:|:----------:|:--------:|:-------:|:---------:|:---------:|:-----------:|:-----:|:-----:|:------:|:-------:|:------:|
| **Age** | 38 | 52 | 34 | 45 | 28 | 32 | 48 | 61 | 42 | 26 | 55 | 18 |
| **Tech (1-10)** | 9 | 6 | 7 | 5 | 4 | 5 | 3 | 4 | 6 | 8 | 5 | 9 |
| **Primary Device** | Desktop | Desktop | Desktop | Desktop | Desktop | Desktop | Phone | Laptop | Phone | Phone | Laptop | Phone |
| **Session Length** | Hours | Hours | Hours | Hours | Full shift | Full shift | Minutes | Minutes | Minutes | Minutes | Minutes | Seconds |
| **Daily Sessions** | 1-2 | 1-2 | 1-2 | 1-2 | 1 (all shift) | 1 (all shift) | 10-15 | 0-1 | 2-3 | 2-3 | 0-1 | 1-3 |
| **System Dependency** | Low | High | High | High | Critical | Critical | High | Low | Medium | Medium | Low | Low |

### 19.2 Task Frequency Comparison

| Task Category | Super Admin | Prop Admin | Prop Mgr | Sec Sup | Sec Guard | Concierge | Maint Staff | Board | Owner | Tenant | Offsite | Family |
|---------------|:-----------:|:----------:|:--------:|:-------:|:---------:|:---------:|:-----------:|:-----:|:-----:|:------:|:-------:|:------:|
| Dashboard review | 5/day | 10/day | 8/day | 6/day | Constant | Constant | 5/day | 2/week | 1/day | 1/day | 1/week | 1/day |
| Event/log creation | Never | Rare | Rare | Rare | 20-40/shift | 20-40/shift | Never | Never | Never | Never | Never | Never |
| Package operations | Never | Monitor | Monitor | Monitor | 25-50/shift | 25-50/shift | Never | Never | View | View | Never | View |
| Service requests | Never | 5-8/day | 8-10/day | Never | Never | Never | 10-15/day | View | 1-2/month | 1/month | Never | Never |
| Amenity booking | Never | 2-3/day | 3-4/day | Never | Never | 3-5/day | Never | Never | 1-2/month | 1-2/week | Never | 1-2/week |
| Report generation | Weekly | Daily | Daily | Daily | Never | Never | Never | Weekly | Never | Never | Monthly | Never |
| User management | Weekly | Daily | Never | Never | Never | Never | Never | Never | Never | Never | Never | Never |
| Announcements | Never | 3-5/week | 2-3/day | Never | Never | View | Never | View | View | View | View | View |
| Training | Never | Monitor | Monitor | Monitor | When assigned | When assigned | When assigned | Never | Never | Never | Never | Never |
| Settings/config | Weekly | Weekly | Never | Never | Never | Never | Never | Never | Rarely | Rarely | Rarely | Rarely |

### 19.3 "Wow" Moment Summary

| Persona | "Wow" Moment | Category |
|---------|-------------|----------|
| Super Admin | Cross-property AI cost dashboard with one-click throttle | Analytics |
| Property Admin | One-click board meeting report generation | Reporting |
| Property Manager | AI-assisted service request triage and assignment | AI / Automation |
| Security Supervisor | Incident density heatmap by floor and time of day | Analytics |
| Security Guard | One-tap package intake with courier auto-detection | Speed / UX |
| Concierge | Per-unit instruction toast on every unit interaction | Context / UX |
| Maintenance Staff | Work order with AI-suggested parts, photos, and entry info | Information completeness |
| Board Member | Auto-generated pre-meeting briefing package | Automation |
| Owner | Instant push notification with QR code for package pickup | Mobile / Speed |
| Tenant | Live status timeline for maintenance requests | Transparency |
| Offsite Owner | Owner-specific weekly digest email | Relevance / Noise reduction |
| Family Member | Shared family package notifications with pickup confirmation to owner | Family awareness |

### 19.4 Critical Path Dependencies

The following table identifies which personas block other personas and the maximum acceptable delay before the blocking becomes a pain point.

| Blocker | Blocked | Blocking Action | Max Acceptable Delay | Mitigation |
|---------|---------|-----------------|---------------------|------------|
| Property Admin | All staff | Account creation | 1 business day | Bulk import, CSV upload, templates |
| Property Manager | Maintenance Staff | Request assignment | 4 hours (SLA) | AI auto-suggest, auto-assign rules |
| Property Manager | Owner/Tenant | Amenity approval | 24 hours | Auto-approve rules for standard bookings |
| Concierge/Guard | Owner/Tenant/Family | Package logging | 5 minutes from courier drop-off | Batch intake, barcode scanning |
| Board Members | Property Manager | Approval votes | 7 days | Automated reminders at 3 and 7 days |
| Security Supervisor | Security Guard | Shift assignment | Before shift starts | Recurring schedule templates |
| Property Admin | Board Member | Report/doc upload | 48 hours before meeting | Auto-generated reports, scheduled delivery |
| System (uptime) | ALL personas | Platform availability | 0 (zero downtime target) | Offline mode, queue-based architecture |

---

## 20. Design Implications Summary

This section translates persona insights into concrete design requirements for the engineering team.

### 20.1 Performance Targets by Persona

| Persona Group | Page Load Target | Interaction Response | Justification |
|---------------|-----------------|---------------------|---------------|
| Security Guard, Concierge | < 1 second | < 200ms | Time-critical, customer-facing, high-frequency actions |
| Maintenance Staff (mobile) | < 2 seconds | < 300ms | Variable network conditions, impatient context |
| Property Manager, Security Supervisor | < 2 seconds | < 300ms | High-frequency desktop use, multi-tasking |
| Property Admin, Super Admin | < 3 seconds | < 500ms | Dense dashboards with many data points, acceptable |
| All Residents (mobile) | < 2 seconds | < 300ms | Consumer-grade expectations, competitor benchmarking |
| Board Member | < 3 seconds | < 500ms | Infrequent use, large report downloads acceptable |

### 20.2 Session Management Requirements

| Persona Group | Session Duration | Auto-Lock | Shared Device | Remember Me |
|---------------|-----------------|-----------|---------------|-------------|
| Super Admin | 8 hours | 30 min inactivity | No | Optional |
| Property Admin | 8 hours | 30 min inactivity | No | Optional |
| Property Manager | 8 hours | 15 min inactivity | Possible | Disabled on shared |
| Security Supervisor | 8 hours | 15 min inactivity | Yes (office PC) | Disabled |
| Security Guard | Full shift (12 hours max) | 5 min inactivity | Yes (lobby PC) | Disabled, PIN re-auth |
| Concierge | Full shift (10 hours max) | 5 min inactivity | Yes (desk PC) | Disabled, PIN re-auth |
| Maintenance Staff | 8 hours | 30 min inactivity | Yes (workshop) | Disabled on shared |
| Board Member | 30 days | Never (personal device) | No | Enabled |
| Owner | 30 days | Never (personal device) | No | Enabled |
| Tenant | 30 days | Never (personal device) | No | Enabled |
| Offsite Owner | 30 days | Never (personal device) | No | Enabled |
| Family Member | 30 days | Never (personal device) | No | Enabled |

### 20.3 Notification Channel Preferences by Persona

| Persona | Push | Email | SMS | In-App | Digest |
|---------|:----:|:-----:|:---:|:------:|:------:|
| Super Admin | Critical only | All | Emergency only | All | Weekly platform summary |
| Property Admin | All operations | Daily digest | Emergency only | All | Weekly management summary |
| Property Manager | All operations | Daily digest | Emergency only | All | -- |
| Security Supervisor | Security events | Shift summary | Emergency only | All | -- |
| Security Guard | Assignments | Never | Emergency only | All | -- |
| Concierge | Assignments | Never | Emergency only | All | -- |
| Maintenance Staff | New assignments | Never | Emergency only | All | -- |
| Board Member | Approvals | Governance items | Emergency only | Approvals | Pre-meeting briefing |
| Owner | Packages, requests | Announcements | Emergency only | All personal | -- |
| Tenant | Packages, requests | Announcements | Emergency only | All personal | -- |
| Offsite Owner | Governance only | Weekly digest | Emergency only | Limited | Weekly owner digest |
| Family Member | Packages only | Never | Emergency only | Limited | -- |

### 20.4 Onboarding Complexity by Persona

Each persona requires a different level of onboarding to become productive. This informs the design of first-run experiences, tooltips, and guided tours.

| Persona | Onboarding Complexity | First-Run Experience | Time to Productive |
|---------|----------------------|---------------------|-------------------|
| Super Admin | High | Guided setup wizard: add first property, configure AI, invite first Property Admin | 30-60 minutes |
| Property Admin | High | Guided setup wizard: building config, event types, amenity setup, first staff invite | 1-2 hours |
| Property Manager | Medium | Interactive tour: dashboard, service requests, packages, announcements | 15-30 minutes |
| Security Supervisor | Medium | Interactive tour: security analytics, team management, shift log | 15-20 minutes |
| Security Guard | Low | 5-screen tutorial: quick actions, package intake, visitor registration, shift log | 5-10 minutes |
| Concierge | Low | 5-screen tutorial: package intake, visitor registration, amenity booking, shift log | 5-10 minutes |
| Maintenance Staff | Low | 3-screen tutorial: work queue, status updates, photo capture | 3-5 minutes |
| Board Member | Low | Welcome email with 3 key links: dashboard, reports, library | 2-3 minutes |
| Owner | Minimal | Welcome email with app download link, first login shows package and booking highlights | 1-2 minutes |
| Tenant | Minimal | Same as Owner | 1-2 minutes |
| Offsite Owner | Minimal | Welcome email explaining digest frequency and governance access | 1 minute |
| Family Member | Minimal | Push notification from parent's invite, auto-configured for packages and bookings | 30 seconds |

---

*End of document.*

*Total personas documented: 12*
*Cross-persona interaction pathways: 15*
*Handoff points documented: 7*
*Conflict scenarios resolved: 8*
*Accessibility requirements: 10 universal + per-persona specifics*
*Device strategy breakdowns: 4 matrices*
*Design implication sections: 4*

*Last updated: 2026-03-16*

*Total personas documented: 12*
*Cross-persona interaction pathways: 15*
*Handoff points documented: 7*
*Conflict scenarios resolved: 8*
*Accessibility requirements: 10 universal + per-persona specifics*
*Device strategy breakdowns: 4 matrices*

*Last updated: 2026-03-16*
