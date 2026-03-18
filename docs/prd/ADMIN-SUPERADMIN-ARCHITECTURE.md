# Admin & Super Admin Architecture

> **Status**: Draft
> **Last updated**: 2026-03-17
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 08-User Management, 16-Settings Admin, 19-AI Framework
> **Design context**: Admin is the BUYER. If Admin is unhappy, we lose the contract. Admin UX must be the best experience in the entire system. 99% of users are on desktop monitors. Users are non-technical.

---

## 1. Purpose

This document is the single architectural blueprint for every screen, action, and data point that Property Admins and Super Admins interact with. It exists because:

1. **We never had admin access to competitor platforms.** Every admin and super admin capability must be designed from first principles, not reverse-engineered from screenshots.
2. **Admin is the buyer.** A property management company evaluates software through the admin lens. If the admin experience is confusing, slow, or incomplete, we lose the contract regardless of how polished the resident portal is.
3. **Non-technical users on large screens.** Admins are property managers and building operators, not developers. Every screen must be self-explanatory, with tooltips on every non-obvious element. Designed for 1920x1080+ monitors.

### Design Principles for Admin Screens

| #   | Principle                         | Detail                                                                                                                                                                               |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Zero training required**        | A new Property Admin should be able to configure their property without reading documentation. Tooltips, inline help, and progressive disclosure make every screen self-teaching.    |
| 2   | **One primary action per screen** | Every admin page has exactly one primary CTA. Secondary actions use ghost/outline buttons. No competing CTAs.                                                                        |
| 3   | **Undo before commit**            | Every destructive action (delete event type, deactivate user, remove role) shows a confirmation dialog with consequences explained. Critical actions require typing the entity name. |
| 4   | **Audit everything**              | Every admin action is logged with who, what, when, before-state, and after-state. Admins trust systems they can audit.                                                               |
| 5   | **Progressive disclosure**        | Settings used by fewer than 20% of properties are hidden behind "Show Advanced Settings" toggles. The default view is clean and focused.                                             |
| 6   | **Instant feedback**              | Every save, toggle, and form submission shows immediate visual feedback: spinner, success toast, or inline error. No silent successes or failures.                                   |
| 7   | **Large-screen optimized**        | Two-column and three-column layouts for 1920px+ screens. Left navigation panels. Side-by-side comparisons. No single-column mobile-first layouts forced onto desktop.                |
| 8   | **Search everything**             | Every list, table, and directory has a search bar. Admins managing 500+ units cannot scroll to find things.                                                                          |

---

## 2. Property Admin Architecture

The Property Admin is the top-level administrator for a single property. They manage all operations, user accounts, roles, settings, and property-level configuration. They cannot access system-level settings or other properties.

### 2.1 Property Admin Dashboard

**URL**: `/dashboard` (role-aware rendering)
**Purpose**: Single-glance operational health of the entire property. This is the first screen after login and must answer: "Is anything on fire?"

#### 2.1.1 KPI Row (Top)

A horizontal row of 6-8 large KPI cards spanning the full width. Each card is clickable and navigates to the relevant module.

| #   | KPI Card              | Data Shown                                                                                                              | Click Target                          | Refresh               |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------- |
| 1   | Open Service Requests | Count of requests in Open or In Progress status. Red badge if any are > 48 hours old.                                   | `/maintenance?status=open`            | Real-time (WebSocket) |
| 2   | Unreleased Packages   | Count of packages awaiting pickup. Amber badge if any are > 72 hours.                                                   | `/packages?status=unreleased`         | Real-time             |
| 3   | Active Visitors       | Count of visitors currently signed in (not signed out).                                                                 | `/security?filter=visitors_active`    | Real-time             |
| 4   | Pending Approvals     | Combined count: amenity bookings awaiting approval + announcement drafts awaiting review + alteration requests pending. | `/approvals` (unified approvals page) | Real-time             |
| 5   | Upcoming Bookings     | Count of amenity bookings in the next 7 days.                                                                           | `/amenities?view=calendar`            | Hourly                |
| 6   | Resident Count        | Total active residents (owners + tenants + family). Percentage with missing email/phone shown as subtitle.              | `/users?role=resident`                | Daily                 |
| 7   | Staff Online          | Count of staff users with active sessions right now.                                                                    | `/users?role=staff&status=online`     | Real-time             |
| 8   | Building Health Score | Composite 0-100 score across 6 dimensions (see PRD 10). Green (80-100), Yellow (60-79), Red (0-59).                     | `/reports/health`                     | Daily                 |

**Time period selector**: Dropdown above the KPI row: "Today", "Last 7 Days", "Last 30 Days", "This Month", "Custom Range". Default: "Today". Persists per session.

**Tooltip on Building Health Score**: "A composite score measuring response times, resident satisfaction, maintenance backlog, security coverage, data completeness, and compliance status. Higher is better."

#### 2.1.2 Trend Charts (Middle)

Two side-by-side charts occupying the center area. Each chart has a title, time selector, and hover tooltips.

| #   | Chart                  | Type              | Data                                                                       | Default Period |
| --- | ---------------------- | ----------------- | -------------------------------------------------------------------------- | -------------- |
| 1   | Service Request Volume | Stacked bar chart | Requests by status (open, in progress, on hold, closed) per day/week/month | Last 30 days   |
| 2   | Package Volume         | Line chart        | Packages received vs released per day                                      | Last 30 days   |

**Progressive disclosure**: "Show More Charts" link reveals:

- Amenity utilization heatmap (hour-of-day vs day-of-week)
- Security event volume by type (line chart)
- Resident engagement rate (announcements opened / total)
- AI spend trend (cost per day)

#### 2.1.3 Activity Feed (Right Column)

A chronological feed of the last 50 building events, auto-updating via WebSocket.

| Element            | Detail                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **Each entry**     | Icon (color-coded by event type) + summary text + timestamp + actor name                       |
| **Filter**         | Dropdown: All, Packages, Maintenance, Security, Announcements, Bookings, User Changes          |
| **Click behavior** | Click any entry to navigate to the detail page                                                 |
| **Empty state**    | "No recent activity. Events will appear here as staff and residents interact with the system." |

#### 2.1.4 Alerts Panel (Below KPIs)

A dismissable alert banner area for items requiring admin attention.

| Alert Type               | Trigger                                           | Severity | Action                          |
| ------------------------ | ------------------------------------------------- | -------- | ------------------------------- |
| Overdue maintenance      | Any request > SLA threshold                       | Red      | "View Overdue Requests" link    |
| Expired vendor insurance | Any vendor with expired insurance docs (v2)       | Red      | "View Vendor Compliance" link   |
| Missing resident data    | More than 10% of residents missing email or phone | Amber    | "View Data Quality Report" link |
| Pending approvals        | Any booking or announcement waiting > 24 hours    | Amber    | "Review Approvals" link         |
| Staff training overdue   | Any staff member with overdue mandatory courses   | Amber    | "View Training Dashboard" link  |
| AI budget threshold      | AI spend exceeds 80% of monthly budget            | Amber    | "View AI Dashboard" link        |
| Backup warning           | Last backup older than 36 hours                   | Red      | "View Backup Status" link       |
| Suspicious login         | AI flagged an unusual login pattern               | Red      | "View Login Audit" link         |
| Upcoming permit expiry   | Parking permits expiring within 14 days           | Amber    | "View Expiring Permits" link    |
| Low storage              | Package storage room > 80% capacity               | Amber    | "View Storage Status" link      |

**Dismissal**: Each alert has an "X" button. Dismissed alerts reappear if the condition persists after 24 hours. Dismissals are logged in the audit trail.

#### 2.1.5 Quick Actions Bar

A horizontal bar of shortcut buttons for the most common admin tasks.

| #   | Action            | Icon      | Target                               |
| --- | ----------------- | --------- | ------------------------------------ |
| 1   | Create User       | Person+   | `/users/new`                         |
| 2   | Send Announcement | Megaphone | `/announcements/new`                 |
| 3   | View Reports      | Chart     | `/reports`                           |
| 4   | Open Settings     | Gear      | `/settings`                          |
| 5   | View Audit Log    | Clipboard | `/settings/audit-log`                |
| 6   | Search Users      | Search    | Opens global search focused on users |

#### 2.1.6 Staff Performance Summary (Bottom)

A compact table showing staff activity for the selected time period.

| Column             | Data                                                           |
| ------------------ | -------------------------------------------------------------- |
| Staff Name         | Name with role badge                                           |
| Events Logged      | Count of security events created                               |
| Packages Processed | Count of packages logged (intake + release)                    |
| Requests Handled   | Count of maintenance requests updated                          |
| Last Active        | Timestamp of most recent action                                |
| Training Status    | Green check (all complete), Amber (in progress), Red (overdue) |

**Sort**: Clickable column headers. Default: sort by "Last Active" descending.
**Click**: Click any row to open the staff member's profile.

#### 2.1.7 AI Daily Briefing Widget

| Element        | Detail                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Position**   | Top-right, collapsible card                                                                                        |
| **Content**    | AI-generated natural language summary of the last 24 hours: key events, anomalies, trends, and recommended actions |
| **Generation** | Auto-generated at 6 AM property time. Regenerate on demand via "Refresh Briefing" button.                          |
| **Model**      | Sonnet (see PRD 19)                                                                                                |
| **Cost**       | ~$0.01 per generation                                                                                              |
| **Fallback**   | If AI unavailable: "AI Briefing temporarily unavailable. View activity feed for recent events."                    |
| **Tooltip**    | "An AI-generated summary of the last 24 hours. Highlights trends, anomalies, and recommended actions."             |

---

### 2.2 Property Settings Hub

**URL**: `/settings`
**Layout**: Left sidebar with 18 setting tabs. Main content area renders the selected tab. Max content width: 900px centered with generous padding on 1920px+ monitors.

The Settings Hub is where Property Admins configure every aspect of how their property operates. All 18 tabs are listed here with a summary. Detailed field specifications are in PRD 16 (Settings Admin).

#### 2.2.1 Settings Navigation (Left Sidebar)

| #   | Tab                          | Icon       | Access                                                                    | Summary                                                                                                                              |
| --- | ---------------------------- | ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Property Setup               | Building   | Property Admin, Super Admin                                               | Property name, address, floors, units, timezone, contacts, operational toggles                                                       |
| 2   | Event Type Configuration     | Tag        | Property Admin, Super Admin                                               | Add/edit/remove event types and groups. Icons, colors, notification templates per type.                                              |
| 3   | Maintenance Categories       | Wrench     | Property Admin, Super Admin                                               | 43 default categories in a tree structure. Add/rename/disable categories. Auto-assignment rules. SLA timers per category.            |
| 4   | Amenity Management           | Calendar   | Property Admin, Super Admin                                               | Configure each amenity: pricing, hours, capacity, approval mode, terms, photos, sub-options, recurring rules, maintenance blackouts. |
| 5   | Notification Templates       | Bell       | Property Admin, Super Admin                                               | Email, SMS, push, voice templates. Merge field toolbar. Preview and test send. Per-event-type templates.                             |
| 6   | Role & Permission Management | Shield     | Property Admin, Super Admin                                               | View all roles. Create custom roles. Visual permission matrix with clone and preview.                                                |
| 7   | Custom Fields                | Form       | Property Admin, Super Admin                                               | Add fields to events, units, residents, maintenance requests. JSONB-backed. 10 field types.                                          |
| 8   | AI Configuration             | Brain      | Super Admin (full), Property Admin (feature toggles)                      | Per-feature AI on/off. Cost dashboard. Budget limits. Model selection (Super Admin only).                                            |
| 9   | Branding                     | Palette    | Property Admin, Super Admin                                               | Logo, colors, favicon, vanity URL, welcome message, email header/footer. Live preview.                                               |
| 10  | Audit Log                    | Clipboard  | Property Admin (full), Property Manager (read-only)                       | Immutable log of all actions. Before/after diffs. AI-generated change summaries. Export.                                             |
| 11  | System Health                | Activity   | Super Admin only                                                          | API response time, database performance, storage usage, WebSocket connections, error rates.                                          |
| 12  | Billing & Subscription       | CreditCard | Property Admin (manage), Property Manager (view), Board Member (invoices) | Current plan, usage meters, payment method, invoices, change plan.                                                                   |
| 13  | Data Import/Export           | Upload     | Property Admin, Super Admin                                               | CSV/Excel import with validation preview. Full data export in CSV/Excel/PDF.                                                         |
| 14  | API Keys                     | Key        | Super Admin (full), Property Admin (property-scoped)                      | Generate, scope, rotate, revoke API keys. Usage stats. Rate limit configuration.                                                     |
| 15  | Buzzer Codes                 | Phone      | Property Admin, Super Admin                                               | Building-wide buzzer directory. Per-unit codes. CSV import/export. Search by unit or code.                                           |
| 16  | Onboarding Wizard            | Rocket     | Property Admin, Super Admin                                               | Resume or re-run the 8-step property setup wizard. View completion status.                                                           |
| 17  | Demo Management              | Play       | Super Admin only                                                          | Create/manage/reset sales demos and training sandboxes. Template management.                                                         |
| 18  | Backup & Recovery            | Shield     | Super Admin only                                                          | Backup health, retention policies, disaster recovery controls, backup audit log.                                                     |

**Search in Settings**: A search bar at the top of the settings sidebar. Type "notification" to filter to Notification Templates. Type "logo" to jump to Branding. Search indexes tab names, field labels, and tooltip text.

**Tab states**:

- **Selected**: Blue left border + bold label + blue icon
- **Unselected**: Grey text + grey icon
- **Restricted**: Hidden entirely (not greyed, not disabled -- absent)
- **Has unsaved changes**: Orange dot next to tab name

---

### 2.3 User Management

**URL**: `/users`
**Purpose**: Full lifecycle management of every person who accesses the property. This is the second most visited admin page after the dashboard.

#### 2.3.1 User Directory Page

**Layout (1920px+)**: Full-width table with 8 visible columns. Filter bar above. Bulk action bar below (appears when rows are selected).

| Element           | Detail                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Page title**    | "User Management"                                                                             |
| **Primary CTA**   | "+ Create Account" button (blue filled, top-right)                                            |
| **Secondary CTA** | "Import" button (outlined, next to primary)                                                   |
| **Search**        | Full-width search bar: "Search by name, email, unit, or phone..." Instant filter as you type. |

**Filter Bar**:

| Filter       | Type                           | Options                                                               | Default |
| ------------ | ------------------------------ | --------------------------------------------------------------------- | ------- |
| Role         | Multi-select dropdown          | All built-in roles + custom roles                                     | All     |
| Status       | Multi-select dropdown          | Active, Pending Activation, Suspended, Deactivated                    | Active  |
| Building     | Dropdown (multi-building only) | All buildings                                                         | All     |
| Floor        | Dropdown                       | All floors                                                            | All     |
| 2FA Status   | Dropdown                       | Enabled, Not Enabled, All                                             | All     |
| Missing Data | Dropdown                       | Missing Email, Missing Phone, Missing Emergency Contact, All Complete | --      |
| Created Date | Date range picker              | Custom range                                                          | --      |
| Last Login   | Date range picker              | Custom range                                                          | --      |

**"More Filters" toggle** reveals: Created Date, Last Login, 2FA Status, Missing Data. These are hidden by default (progressive disclosure).

**Table Columns**:

| #   | Column     | Sortable | Width | Content                                                                             |
| --- | ---------- | -------- | ----- | ----------------------------------------------------------------------------------- |
| 1   | Checkbox   | No       | 40px  | Bulk selection                                                                      |
| 2   | Name       | Yes      | 200px | Full name with profile photo thumbnail (32px circle). Click to open profile.        |
| 3   | Email      | Yes      | 220px | Email address. Red "Missing" badge if empty.                                        |
| 4   | Unit       | Yes      | 80px  | Unit number. "--" for non-resident staff.                                           |
| 5   | Role       | Yes      | 150px | Role name with colored badge.                                                       |
| 6   | Status     | Yes      | 100px | Status badge: Green (Active), Grey (Pending), Amber (Suspended), Red (Deactivated). |
| 7   | Last Login | Yes      | 150px | Relative timestamp ("2 hours ago", "Never").                                        |
| 8   | Actions    | No       | 80px  | Kebab menu with context-sensitive actions.                                          |

**Kebab Menu Actions**:

| Action               | When Visible                       | Confirmation                                                                       |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| View Profile         | Always                             | None                                                                               |
| Edit                 | Status is Active or Suspended      | None                                                                               |
| Change Role          | Status is Active                   | Confirmation dialog with consequences                                              |
| Suspend              | Status is Active                   | "Suspend [Name]? All active sessions will be terminated."                          |
| Reactivate           | Status is Suspended or Deactivated | None                                                                               |
| Deactivate           | Status is Active or Suspended      | "Deactivate [Name]? This will revoke all access. Type the user's name to confirm." |
| Reset Password       | Status is Active or Suspended      | "A password reset link will be sent to [email]."                                   |
| Reset 2FA            | 2FA is enabled                     | "This will remove 2FA for [Name]. They will need to re-enroll."                    |
| Resend Welcome Email | Status is Pending Activation       | "Resend welcome email to [email]?"                                                 |
| Sign Out All Devices | Status is Active                   | "This will terminate all active sessions for [Name]."                              |

**Bulk Actions** (visible when 1+ rows selected):

| Action               | Detail                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| Change Role          | Assign a single role to all selected users. Confirmation dialog shows count.    |
| Send Announcement    | Open announcement composer pre-targeted to selected users.                      |
| Suspend              | Suspend all selected users. Confirmation with count.                            |
| Deactivate           | Deactivate all selected. Requires typing "DEACTIVATE [count] USERS" to confirm. |
| Export               | Export selected users to CSV.                                                   |
| Resend Welcome Email | Send to all Pending Activation users in selection.                              |

**Pagination**: "Showing 1-25 of 487 users" with page size dropdown (25, 50, 100) and page navigation.

**Empty State**:

```
+------------------------------------------------------------------+
|                                                                    |
|              [Person icon illustration]                            |
|                                                                    |
|          No users at this property yet.                            |
|                                                                    |
|    Create accounts to get your building started.                   |
|                                                                    |
|         [+ Create First Account]    [Import from CSV]              |
|                                                                    |
+------------------------------------------------------------------+
```

#### 2.3.2 Create Account Form

**URL**: `/users/new`
**Layout**: Single-column form, max width 600px, centered. Sections separated by horizontal dividers.

**Section 1: Account Type**

| Field        | Type              | Required | Options              | Behavior                                                                                                               |
| ------------ | ----------------- | -------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Account Type | Segmented control | Yes      | "Staff" / "Resident" | Selecting changes visible fields below. Staff shows role selector. Resident shows unit selector and resident sub-type. |

**Section 2: Personal Information**

| #   | Field        | Type  | Required | Max Length | Validation                                     | Error Message                                                |
| --- | ------------ | ----- | -------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------ |
| 1   | First Name   | Text  | Yes      | 50         | Non-empty, letters and hyphens only            | "First name is required"                                     |
| 2   | Last Name    | Text  | Yes      | 50         | Non-empty, letters and hyphens only            | "Last name is required"                                      |
| 3   | Email        | Email | Yes      | 254        | Valid email format. AI typo detection on blur. | "Enter a valid email address" / "Did you mean [suggestion]?" |
| 4   | Phone Number | Phone | No       | 20         | E.164 format with country code auto-detection  | "Enter a valid phone number"                                 |

**Section 3: Role Assignment**

| #   | Field    | Type         | Required                    | Behavior                                                                               |
| --- | -------- | ------------ | --------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Role     | Dropdown     | Yes                         | Lists all built-in and custom roles. Grouped by category: Staff Roles, Resident Roles. |
| 2   | Unit     | Autocomplete | Required for resident roles | Type unit number. Shows "Unit [number] - Floor [floor] ([occupant count] occupants)".  |
| 3   | Building | Dropdown     | Required for multi-building | Auto-selected if only one building.                                                    |

**Section 4: Welcome Email**

| #   | Field              | Type     | Default | Detail                                                                                                    |
| --- | ------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Send Welcome Email | Checkbox | Checked | When checked, system sends the welcome email template immediately after account creation.                 |
| 2   | Preview            | Link     | --      | "Preview Welcome Email" link opens a modal showing the rendered email with the new user's data merged in. |

**Create Account Button**:

| State       | Behavior                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Default** | "Create Account" -- blue filled button. Disabled until all required fields pass validation. |
| **Loading** | Spinner + "Creating..." All fields become read-only.                                        |
| **Success** | Toast: "Account created for [Name]. Welcome email sent." Redirect to user profile page.     |
| **Failure** | Toast (red): "Failed to create account: [error message]." Form retains entered data.        |

**Edge Cases**:

| Case                                  | Handling                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Duplicate email at same property      | Inline error: "An account with this email already exists at this property." Link: "View existing account." |
| Duplicate email at different property | Allow creation. Tooltip: "This email is associated with accounts at other properties."                     |
| Unit at max occupancy                 | Warning (non-blocking): "Unit [number] already has [count] occupants. Proceed?"                            |
| Last admin removal prevention         | Not applicable to creation -- relevant to role changes.                                                    |

#### 2.3.3 User Profile (Admin View)

**URL**: `/users/:id`
**Layout**: Header with user summary + 5 tabbed content sections below.

**Header**:

```
+------------------------------------------------------------------+
| [< Back to Directory]                                             |
|                                                                    |
| [Photo]  Jane Smith                               [Edit] [... v] |
|          Resident (Owner) - Unit 1205                              |
|          jane@email.com | +1-416-555-0100                         |
|          Status: Active (green badge)                              |
|          Last login: Mar 14, 2026 at 8:48 PM                      |
+------------------------------------------------------------------+
```

**Tabs**:

| #   | Tab           | Content                                                                                                                                                                      |
| --- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Profile       | All editable profile fields in a two-column form layout. Personal info, contact details, package preferences, about me, custom fields.                                       |
| 2   | Activity      | Login audit trail table (last 50 entries). Columns: Date, IP, Device, Location, Status, 2FA Used. Date range filter.                                                         |
| 3   | Security      | Active sessions table (device, IP, last active, "Terminate" button per row). 2FA status with enable/disable/reset. Password last changed.                                    |
| 4   | Notifications | Notification preference toggles organized by module (Packages, Maintenance, Amenities, Announcements, Security, Community). Per-notification per-channel (Email, SMS, Push). |
| 5   | Audit Log     | AccountAudit entries: all admin actions taken on this user. Columns: Date, Action, Actor, Details.                                                                           |

**Kebab Menu (...)**:

| #   | Option               | When Visible                                                  |
| --- | -------------------- | ------------------------------------------------------------- |
| 1   | Change Role          | User is Active                                                |
| 2   | Suspend Account      | User is Active                                                |
| 3   | Reactivate Account   | User is Suspended or Deactivated                              |
| 4   | Deactivate Account   | User is Active or Suspended                                   |
| 5   | Reset Password       | User is Active or Suspended                                   |
| 6   | Reset 2FA            | User has 2FA enabled                                          |
| 7   | Resend Welcome Email | User is Pending Activation                                    |
| 8   | Sign Out All Devices | User is Active                                                |
| 9   | Merge Accounts       | Super Admin only. User has same email at multiple properties. |

---

### 2.4 Role & Permission Builder

**URL**: `/settings/roles`
**Purpose**: Create, modify, and manage custom roles. View the complete permission matrix for all roles.

#### 2.4.1 Role List

| Column         | Data                                                              |
| -------------- | ----------------------------------------------------------------- |
| Role Name      | Name with "Built-in" or "Custom" badge                            |
| Type           | Staff or Resident                                                 |
| Users Assigned | Count of users currently assigned this role                       |
| Base Role      | For custom roles: which built-in role it was cloned from          |
| Created        | Date created (or "System" for built-in roles)                     |
| Actions        | Edit (custom only), Clone, Delete (custom only, 0 users assigned) |

**Primary CTA**: "Create Custom Role" button.
**Limit**: Maximum 20 custom roles per property. Counter shown: "Custom roles: 7 / 20".

#### 2.4.2 Permission Matrix View

A full-page, scrollable matrix showing all roles (columns) vs all permissions (rows), organized by module.

**Layout (1920px+)**:

```
+------------------------------------------------------------------------+
| Permission Matrix                                    [Export] [Print]   |
+------------------------------------------------------------------------+
| MODULE / ACTION        | SA | PA | BM | PM | SS | SG | FD | MT | RO | |
|------------------------|----|----|----|----|----|----|----|----|----|----|
| SECURITY CONSOLE       |    |    |    |    |    |    |    |    |    |  |
|   Create event         | F  | F  | -- | F  | F  | F  | F  | -- | -- |  |
|   View all events      | F  | F  | -- | F  | F  | VO | VO | -- | -- |  |
|   Edit events          | F  | F  | -- | F  | F  | OO | OO | -- | -- |  |
|   Delete events        | F  | F  | -- | C  | F  | -- | -- | -- | -- |  |
|   View analytics       | F  | F  | -- | F  | F  | -- | -- | -- | -- |  |
|   Export                | F  | F  | -- | F  | F  | -- | -- | -- | -- |  |
| PACKAGES               |    |    |    |    |    |    |    |    |    |  |
|   ...                  |    |    |    |    |    |    |    |    |    |  |
+------------------------------------------------------------------------+
Legend: F=Full, VO=View Only, OO=Own Only, C=Configurable, --=None
```

**Legend**: F = Full Access, VO = View Only, OO = Own Only, C = Configurable (per-role toggle), -- = No Access.

**Interactions**:

- Hover any cell to see a tooltip explaining the permission
- Click any column header (role name) to open that role's edit view
- For custom roles: cells are editable checkboxes. For built-in roles: cells are read-only.
- Export: Download the matrix as CSV or PDF

#### 2.4.3 Create/Edit Custom Role

**URL**: `/settings/roles/new` or `/settings/roles/:id/edit`

| Section               | Fields                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**          | Role Name (text, 3-50 chars, unique within property), Description (text, 200 chars), Role Type (Staff/Resident dropdown), Base Role (dropdown of built-in roles -- sets initial permissions)                  |
| **Permission Matrix** | Checkbox grid: rows = actions grouped by module, columns = View / Create / Edit / Delete / Export / Configure. Each checkbox is independently toggleable. Cannot exceed the creating admin's own permissions. |
| **Dashboard Config**  | Select which dashboard type this role uses (inherits from base role by default)                                                                                                                               |
| **Navigation Config** | Review which sidebar items will be visible based on the selected permissions (auto-calculated, read-only preview)                                                                                             |

**Validation**:

- Role name must be unique within the property
- Cannot reuse built-in role names
- Cannot create a role with more permissions than the creator
- Cannot create more than 20 custom roles

**Save Button States**:

| State   | Behavior                                                          |
| ------- | ----------------------------------------------------------------- |
| Default | "Create Role" / "Save Changes" -- blue filled                     |
| Loading | Spinner + "Saving..."                                             |
| Success | Toast: "Role [name] created. It is now available for assignment." |
| Failure | Toast (red): "Failed to save role: [error]."                      |

**Edge Cases**:

| Case                             | Handling                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Delete role with assigned users  | Block: "Cannot delete [role name]. [count] users are currently assigned. Reassign them first."                                  |
| Modify role reducing permissions | Warning: "[count] users will lose access to [list of removed permissions]. Continue?"                                           |
| Clone built-in role              | Opens the create form with all permissions pre-filled from the selected built-in role. Name pre-filled as "[role name] (Copy)". |

---

### 2.5 Event Type Configuration

**URL**: `/settings/event-types`
**Purpose**: Configure the event types and groups that power the Security Console and the unified event model.

#### 2.5.1 Event Type List

**Layout**: Event types grouped under their Event Group headers. Each group is collapsible. Drag-and-drop reordering within groups.

**Per Event Group**:

| Element         | Detail                                     |
| --------------- | ------------------------------------------ |
| Group Name      | Bold header with icon and color swatch     |
| Event Count     | "7 event types" subtitle                   |
| Collapse/Expand | Chevron toggle                             |
| Add Type        | "+ Add Event Type" button within the group |

**Per Event Type (within a group)**:

| Element       | Detail                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| Icon          | 24px icon in the event type's configured color                                 |
| Name          | Event type name                                                                |
| Status        | Active (green dot) or Inactive (grey dot)                                      |
| Events Count  | "1,247 events logged"                                                          |
| Notifications | Channel badges: email, SMS, push icons (filled = enabled, outlined = disabled) |
| Actions       | Edit, Duplicate, Deactivate/Activate                                           |

**Primary CTA**: "Add Event Type" button (top-right).
**Secondary CTA**: "Add Event Group" button.

#### 2.5.2 Add/Edit Event Type (Slide-Over Panel)

A right-side slide-over panel (480px wide) with the following sections:

**Section 1: Identity**

| Field       | Type         | Required | Max Length | Validation                           |
| ----------- | ------------ | -------- | ---------- | ------------------------------------ |
| Name        | Text         | Yes      | 100 chars  | Unique within property               |
| Event Group | Dropdown     | Yes      | --         | Must select existing group           |
| Icon        | Icon picker  | Yes      | --         | Select from 80+ icon library         |
| Color       | Color picker | Yes      | --         | Hex color, WCAG AA contrast required |
| Description | Textarea     | No       | 500 chars  | --                                   |

**Section 2: Behavior**

| Field                   | Type           | Default                  | Detail                                           |
| ----------------------- | -------------- | ------------------------ | ------------------------------------------------ |
| Reference Number Prefix | Text (3 chars) | Auto-generated from name | Format: `{PREFIX}-{YEAR}-{SEQUENCE}`             |
| Auto-Generate Reference | Toggle         | On                       | When off, staff enters manually                  |
| Expiry Hours            | Number         | 0 (never)                | Auto-close events after N hours                  |
| Require Photo           | Toggle         | Off                      | Makes photo upload mandatory on creation         |
| Require Signature       | Toggle         | Off                      | Makes signature capture mandatory                |
| Require Unit            | Toggle         | On                       | Whether unit selection is mandatory              |
| Allow Batch Entry       | Toggle         | On                       | Whether this type appears in batch creation mode |

**Section 3: Custom Fields**

Add custom fields specific to this event type (in addition to property-wide custom fields).

| Action    | Detail                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Add Field | Opens inline field builder: label, type (text/number/date/boolean/dropdown), required toggle, placeholder |
| Reorder   | Drag-and-drop to change field order                                                                       |
| Remove    | "X" button per field                                                                                      |

**Section 4: Notification Templates**

| Trigger   | Template                                                                                  |
| --------- | ----------------------------------------------------------------------------------------- |
| On Create | Select or create an email/SMS/push template to send when an event of this type is created |
| On Close  | Select or create a template for when the event is resolved                                |
| On Update | Optional: template for status changes                                                     |
| Auto-CC   | List of email addresses to always copy (e.g., property manager email)                     |

**Create/Save Button**: Bottom of the slide-over. States: Default, Loading, Success (panel closes), Failure (error shown inline).

**Edge Cases**:

| Case                             | Handling                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Deactivate type with open events | Warning: "[count] events are currently open with this type. They will remain visible but no new events can be created." |
| Delete event group with types    | Block: "Cannot delete group [name]. Move or delete the [count] event types first."                                      |
| Duplicate type name              | Inline error: "An event type with this name already exists."                                                            |

---

### 2.6 Amenity Configuration

**URL**: `/settings/amenities`
**Purpose**: Configure bookable amenities -- pricing, availability, rules, photos, terms.

Detailed in PRD 06 (Amenity Booking, Section 3.1.1) and PRD 16 (Settings Admin, Tab 4). Summary of admin capabilities:

#### 2.6.1 Amenity List

Table showing all configured amenities with columns: Name, Group, Status (Active/Inactive/Maintenance), Booking Count (last 30 days), Revenue (last 30 days), Actions (Edit, Deactivate, Duplicate).

**Primary CTA**: "+ Add Amenity" button.

#### 2.6.2 Amenity Setup (8 Sections)

Each amenity is configured through 8 sections (detailed in PRD 06, Section 3.1.1):

| Section               | Key Fields                                                                                  | Admin Decisions            |
| --------------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| A. Basic Information  | Name, description, group, display order, photos (up to 10), capacity                        | What is this amenity?      |
| B. Availability       | Operating hours per day of week, seasonal availability, holiday closures                    | When can it be booked?     |
| C. Booking Rules      | Slot duration, max advance booking, max bookings per unit, minimum notice, buffer time      | How do bookings work?      |
| D. Pricing            | Fee model (free/flat/hourly/per-guest), fee amount, deposit, payment methods, refund policy | What does it cost?         |
| E. Sub-Options        | Per-amenity extras with individual pricing (e.g., BBQ add-on for party room)                | What extras are available? |
| F. Approval           | Approval mode (auto/manager/admin), conditional rules (e.g., after 8 PM requires approval)  | Who approves bookings?     |
| G. Terms & Conditions | Rich text T&C that residents must accept before booking                                     | What are the rules?        |
| H. Maintenance        | Maintenance schedule blocking, closure date ranges                                          | When is it unavailable?    |

**Progressive Disclosure**: Sections E, F, G, and H are collapsed by default under "Advanced Settings".

---

### 2.7 Maintenance Categories & Workflows

**URL**: `/settings/maintenance-categories`
**Purpose**: Manage the category tree used for service request classification. Configure auto-assignment rules and SLA timers.

#### 2.7.1 Category Tree

A hierarchical list (up to 3 levels deep) of maintenance categories. 43 default categories pre-loaded.

**Layout**:

```
+------------------------------------------------------------------+
| Maintenance Categories                 [+ Add Category] [Reset]   |
+------------------------------------------------------------------+
| Search categories...                                              |
+------------------------------------------------------------------+
| v Plumbing (12 sub-categories)                          [Edit]   |
|   > Leaking Faucet                                      [Edit]   |
|   > Clogged Drain                                       [Edit]   |
|   > Running Toilet                                      [Edit]   |
|   > Water Heater                                        [Edit]   |
|   ...                                                             |
| v Electrical (8 sub-categories)                         [Edit]   |
|   > Light Fixture                                       [Edit]   |
|   > Outlet Not Working                                  [Edit]   |
|   ...                                                             |
| v HVAC (6 sub-categories)                               [Edit]   |
+------------------------------------------------------------------+
```

**Per Category (Edit)**:

| Field                 | Type             | Detail                                                                                           |
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| Name                  | Text (100 chars) | Category display name                                                                            |
| Parent                | Dropdown         | Parent category (or "Top Level")                                                                 |
| Default Priority      | Dropdown         | Low, Normal, High, Urgent                                                                        |
| Default Assignee      | Dropdown         | Staff member or "Unassigned"                                                                     |
| SLA Response Time     | Number (hours)   | Target time for first response                                                                   |
| SLA Resolution Time   | Number (hours)   | Target time for full resolution                                                                  |
| Auto-Assignment Rules | Rule builder     | Conditions: time of day, day of week, unit floor range. Action: assign to specific staff/vendor. |
| Active                | Toggle           | Inactive categories are hidden from the creation form but retained for historical data           |

**Edge Cases**:

| Case                                   | Handling                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Deactivate category with open requests | Warning: "[count] open requests use this category. They will retain the category but no new requests can be created with it."      |
| Exceed 3 nesting levels                | Block: "Maximum nesting depth is 3 levels."                                                                                        |
| "Reset to Defaults" button             | Confirmation: "This will restore the 43 default categories. Custom categories will be preserved and marked as 'Custom'. Continue?" |

---

### 2.8 Notification Settings

**URL**: `/settings/notification-templates`
**Purpose**: Manage all notification templates across all channels and trigger events.

#### 2.8.1 Template List

| Column        | Data                                                |
| ------------- | --------------------------------------------------- |
| Template Name | Descriptive name (e.g., "Package Arrival - Email")  |
| Channel       | Badge: Email / SMS / Push / Voice                   |
| Trigger       | Event type or system event that fires this template |
| Status        | Active (green) / Inactive (grey)                    |
| Last Sent     | Count + timestamp of last delivery                  |
| Open Rate     | Percentage (email only)                             |
| Actions       | Edit, Duplicate, Preview, Test Send, Deactivate     |

**Primary CTA**: "+ Create Template" button.
**Filter**: By channel, by trigger event, by status.

#### 2.8.2 Template Editor

**URL**: `/settings/notification-templates/:id/edit`

| Section             | Fields                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**        | Template Name, Channel (Email/SMS/Push/Voice), Trigger Event Type (dropdown), Trigger Action (On Create / On Close / On Update / Scheduled)                                              |
| **Content (Email)** | Subject line with merge field toolbar, Rich text body with merge field toolbar, Attachment toggle                                                                                        |
| **Content (SMS)**   | Body text (160 chars for single SMS, up to 1600 chars for concatenated), Merge fields                                                                                                    |
| **Content (Push)**  | Title (50 chars), Body (200 chars), Deep link URL                                                                                                                                        |
| **Content (Voice)** | Script text (read by text-to-speech), Language selection                                                                                                                                 |
| **Merge Fields**    | Toolbar of insertable fields: `{{resident_name}}`, `{{unit_number}}`, `{{property_name}}`, `{{event_reference}}`, `{{event_type}}`, `{{timestamp}}`, `{{staff_name}}`, and custom fields |
| **Preview**         | Right-side panel showing rendered template with sample data                                                                                                                              |
| **Test Send**       | "Send Test to Me" button sends the template to the logged-in admin's email/phone                                                                                                         |

**AI Integration**: "Grammar Check" button runs AI grammar and tone check before saving. Shows suggestions inline.

**System Default Templates** (pre-loaded, non-deletable but editable):

| #   | Template             | Channel            | Trigger                       |
| --- | -------------------- | ------------------ | ----------------------------- |
| 1   | Welcome Email        | Email              | Account creation              |
| 2   | Password Reset       | Email              | Password reset request        |
| 3   | Package Arrival      | Email + Push       | Package intake                |
| 4   | Maintenance Update   | Email + Push       | Service request status change |
| 5   | Booking Confirmation | Email              | Amenity booking approved      |
| 6   | Emergency Broadcast  | Push + SMS + Voice | Emergency announcement        |

---

### 2.9 Custom Fields Manager

**URL**: `/settings/custom-fields`
**Purpose**: Add property-specific fields to events, units, residents, and maintenance requests without code changes.

#### 2.9.1 Custom Fields List

**Grouped by entity type** (Events, Units, Residents, Maintenance Requests). Each group is collapsible.

**Per Field**:

| Column      | Data                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| Field Label | Display name                                                                     |
| Field Key   | Programmatic key (auto-generated from label)                                     |
| Type        | Text, Number, Date, Boolean, Dropdown, Multi-Select, URL, Email, Phone, Textarea |
| Required    | Yes/No badge                                                                     |
| Usage       | Percentage of records that have this field filled in                             |
| Sort Order  | Drag-and-drop handle                                                             |
| Actions     | Edit, Deactivate, Delete (if usage = 0%)                                         |

**Primary CTA**: "+ Add Custom Field" button.
**Limit**: Maximum 50 custom fields per entity type per property.

#### 2.9.2 Add/Edit Custom Field

| Field            | Type                         | Required                           | Detail                                                                                     |
| ---------------- | ---------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Entity Type      | Dropdown                     | Yes                                | Event, Unit, Resident, Maintenance Request                                                 |
| Field Label      | Text (100 chars)             | Yes                                | Display name shown on forms                                                                |
| Field Type       | Dropdown                     | Yes                                | 10 types: text, number, date, boolean, dropdown, multi_select, url, email, phone, textarea |
| Required         | Toggle                       | No                                 | Default: No. When Yes, the field must be filled on every create/edit form.                 |
| Default Value    | Dynamic (matches field type) | No                                 | Pre-filled value for new records                                                           |
| Placeholder      | Text (100 chars)             | No                                 | Hint text inside the empty field                                                           |
| Help Text        | Text (200 chars)             | No                                 | Tooltip text shown next to the field label                                                 |
| Options          | Repeatable text fields       | Required for dropdown/multi_select | List of selectable values. Min 2, max 50 options.                                          |
| Validation Rules | Depends on type              | No                                 | Number: min/max. Text: regex pattern. Date: min/max date.                                  |

**Edge Cases**:

| Case                         | Handling                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Make existing field required | Warning: "[count] existing records do not have this field filled. They will not be retroactively blocked but will show a 'missing data' indicator."                            |
| Delete field with data       | Soft delete only. Field is hidden from forms but data is retained in JSONB. "This field has data in [count] records. Deleting will hide the field but preserve existing data." |
| Change field type            | Block: "Cannot change the type of a field that has existing data. Create a new field and migrate data manually."                                                               |

---

### 2.10 Branding Settings

**URL**: `/settings/branding`
**Purpose**: Customize the visual identity of the property within the platform.

Detailed in PRD 16 (Additional Settings Tabs). Key fields:

| Field               | Type                                          | Detail                                                                           |
| ------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Property Logo       | File upload (PNG/SVG, 2 MB, 64x64 to 400x400) | Displayed on login page, sidebar, email headers                                  |
| Primary Brand Color | Color picker                                  | Used for buttons, active nav, accents. Must meet WCAG AA contrast.               |
| Vanity URL Slug     | Text (30 chars)                               | Creates `concierge.com/[slug]` login page. Unique across all properties.         |
| Welcome Message     | Text (200 chars)                              | Shown on the login page below the logo.                                          |
| Custom Favicon      | File upload (ICO/PNG, 32x32 or 64x64)         | Browser tab icon.                                                                |
| Email Header Logo   | File upload (PNG, max 600px wide)             | Used in all outgoing emails.                                                     |
| Email Footer Text   | Text (500 chars)                              | Merge fields: `{{property_name}}`, `{{property_address}}`, `{{property_phone}}`. |
| Email Reply-To      | Email (254 chars)                             | Must be a verified domain (SPF/DKIM).                                            |

**Live Preview Panel**: Right side of the Branding tab shows a live mockup of the login page updating in real-time as fields are modified.

---

### 2.11 Data Export & Reporting

**URL**: `/reports`
**Purpose**: Access 52 pre-built reports, create custom reports, schedule automated delivery, and export data.

Detailed in PRD 10 (Reports & Analytics). Admin-specific capabilities:

| Capability                    | Detail                                                                                                            | Permission     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| View all 52 reports           | Access every report category: Security, Packages, Maintenance, Amenities, Units, Parking, Communication, Training | Property Admin |
| Create custom reports         | Drag-and-drop report builder with column selection, filters, and chart types                                      | Property Admin |
| Schedule reports              | Configure daily/weekly/monthly email delivery of any report                                                       | Property Admin |
| Save report templates         | Save filter and column configurations for one-click reuse                                                         | Property Admin |
| Export                        | CSV, Excel, PDF, Word on every report                                                                             | Property Admin |
| AI Insights                   | Natural language report queries, executive summaries, trend narration, anomaly detection                          | Property Admin |
| Building Health Score         | View and drill into the composite 0-100 score across 6 dimensions                                                 | Property Admin |
| Board presentation generation | AI generates slide-ready summary for board meetings                                                               | Property Admin |

#### 2.11.1 Scheduled Reports Manager

| Field      | Detail                                                   |
| ---------- | -------------------------------------------------------- |
| Report     | Dropdown of all available reports                        |
| Schedule   | Daily (time), Weekly (day + time), Monthly (date + time) |
| Recipients | Multi-select of users. Can add external email addresses. |
| Format     | CSV, Excel, or PDF                                       |
| Filters    | Report-specific filter presets                           |
| Status     | Active / Paused                                          |
| Last Sent  | Timestamp + delivery status                              |
| Actions    | Edit, Pause, Delete, Send Now                            |

---

### 2.12 Audit Log Viewer

**URL**: `/settings/audit-log`
**Purpose**: View the immutable record of every action taken within the property.

#### 2.12.1 Audit Log Table

| Column    | Data                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Timestamp | Date and time with timezone                                                                                     |
| User      | Name + role badge of the actor                                                                                  |
| Action    | Create / Update / Delete / Login / Logout / Export / Configure / Import                                         |
| Module    | Which part of the system (Security Console, Packages, Maintenance, Amenities, Units, Users, Settings, Reports)  |
| Entity    | What was affected (e.g., "Event #INC-2026-00147", "User: Jane Smith", "Setting: Package Notification Template") |
| Summary   | AI-generated plain-English description of the change                                                            |

**Expandable Row**: Click to see before/after diff with red (removed) and green (added) highlighting.

**Filters**:

- Date range picker
- User filter (search by name)
- Action type (multi-select)
- Module filter (multi-select)

**Export**: "Export Audit Log" button. CSV or Excel. Respects current filters.

**Access**:

- Property Admin: Full access, export
- Property Manager: Read-only, no export
- All other roles: No access

**Immutability**: Audit log entries cannot be edited or deleted by any role, including Super Admin. This is a compliance requirement.

---

### 2.13 Integration Settings

**URL**: `/settings/api-keys`
**Purpose**: Manage API keys, webhooks, and third-party integrations for the property.

Detailed in PRD 16 (Tab 14) and PRD 26 (Developer Portal). Admin capabilities:

| Feature                 | Detail                                                                                           | Permission     |
| ----------------------- | ------------------------------------------------------------------------------------------------ | -------------- |
| Generate API Key        | Create a new key with name, scopes, property access, rate limit, IP whitelist, expiry            | Property Admin |
| View API Keys           | List all keys with prefix, scopes, last used, status                                             | Property Admin |
| Revoke API Key          | Immediately invalidate a key                                                                     | Property Admin |
| Rotate API Key          | Generate a new key while keeping the old one valid for a configurable grace period (default 24h) | Property Admin |
| Configure Webhooks (v2) | Set up endpoints to receive event notifications. Select events, configure retry policy.          | Property Admin |
| View Usage Stats        | API calls per day, response times, error rates per key                                           | Property Admin |
| View Audit Log          | Every API call logged with key ID, endpoint, method, timestamp, response status                  | Property Admin |

**Security**: API key value is shown exactly once at creation. After that, only the prefix (first 8 chars) is visible. Keys are stored as bcrypt hashes.

---

### 2.14 Billing & Subscription

**URL**: `/settings/billing`
**Purpose**: View and manage the property's subscription plan, payment method, and invoices.

Detailed in PRD 24 (Billing & Subscription). Admin capabilities:

| Feature             | Detail                                                                                          | Permission                                   |
| ------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| View Current Plan   | Plan name, price, features included, renewal date                                               | Property Admin, Property Manager (read-only) |
| Usage Meters        | 4 circular progress indicators: Units used, Storage used, API calls, SMS credits                | Property Admin                               |
| Change Plan         | Upgrade or downgrade with prorated billing preview. Confirmation required.                      | Property Admin                               |
| Payment Method      | View and update credit card via Stripe secure form. Card details never touch Concierge servers. | Property Admin                               |
| Invoice History     | Table of all invoices: date, amount, status (paid/pending/overdue), PDF download                | Property Admin, Board Member                 |
| Cancel Subscription | Multi-step cancellation with retention offer, reason collection, and 30-day grace period        | Property Admin                               |

**Dunning Banners** (shown to Property Admin when payment fails):

| Stage | Timing | Banner                                                                                 |
| ----- | ------ | -------------------------------------------------------------------------------------- |
| 1     | Day 1  | Yellow: "Payment failed. Please update your payment method."                           |
| 2     | Day 3  | Orange: "Second payment attempt failed. Update payment to avoid service interruption." |
| 3     | Day 7  | Red: "Final notice: your account will enter read-only mode in 7 days."                 |
| 4     | Day 14 | Red full-width: "Account is in read-only mode. Update payment to restore full access." |

---

## 3. Super Admin Architecture

The Super Admin is the platform operator with unrestricted access across all properties. They manage system-level configuration, multi-property oversight, billing, compliance, and platform health.

### 3.1 Multi-Property Dashboard

**URL**: `/system/dashboard`
**Purpose**: Bird's-eye view of every property on the platform. This is the Super Admin's home screen.

#### 3.1.1 Platform Health KPI Bar (Top)

| #   | KPI                  | Data                                                        | Alert Threshold |
| --- | -------------------- | ----------------------------------------------------------- | --------------- |
| 1   | Total Properties     | Count of active properties                                  | --              |
| 2   | Active Users         | Count across all properties (with 24h trend arrow)          | --              |
| 3   | AI Spend (MTD)       | Dollar amount with percentage of budget used                | > 80% budget    |
| 4   | System Uptime        | Percentage over last 30 days                                | < 99.9%         |
| 5   | Open Support Tickets | Count of unresolved support tickets                         | > 10 unresolved |
| 6   | MRR                  | Monthly recurring revenue with month-over-month change      | --              |
| 7   | Churn Rate           | Percentage of properties that cancelled in last 30 days     | > 2%            |
| 8   | Trial Conversions    | Percentage of trials that converted to paid in last 30 days | < 40%           |

#### 3.1.2 Property Health Grid (Center)

A card grid showing one card per property. Cards are sortable by name, health score, creation date, or user count.

**Per Property Card**:

| Element       | Data                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| Property Name | Name with logo thumbnail                                                        |
| Health Score  | 0-100 with color indicator (green/yellow/red)                                   |
| Plan          | Subscription tier badge (Starter, Professional, Enterprise)                     |
| Users         | Total active user count                                                         |
| Status        | Active (green), Trial (blue), Past Due (red), Suspended (grey)                  |
| Last Activity | Timestamp of most recent event across the property                              |
| Quick Actions | "Switch to Property" (enters property context), "View Details", "Contact Admin" |

**Filters**:

- Status: Active, Trial, Past Due, Suspended, All
- Plan: Starter, Professional, Enterprise, All
- Health: Healthy (80+), At Risk (60-79), Critical (< 60)
- Search: By property name or admin email

**Sort**: Health Score (ascending = worst first), User Count, Creation Date, Name.

#### 3.1.3 Revenue Dashboard (Below Grid)

| Chart             | Type            | Data                                                  |
| ----------------- | --------------- | ----------------------------------------------------- |
| MRR Trend         | Line chart      | Monthly recurring revenue over last 12 months         |
| Plan Distribution | Donut chart     | Properties by subscription tier                       |
| Churn Waterfall   | Waterfall chart | New, expansion, contraction, churn per month          |
| Trial Funnel      | Funnel chart    | Signed up > Activated > Converted > Active at 90 days |

#### 3.1.4 Alerts Feed (Right Column)

Chronological feed of platform-level alerts:

| Alert Type             | Detail                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| Property past due      | "[Property Name] payment failed. Day [N] of dunning sequence."       |
| Property churned       | "[Property Name] cancelled. Reason: [reason]."                       |
| System health degraded | "API response time exceeded 500ms for 10 minutes."                   |
| AI budget exceeded     | "AI spend has exceeded monthly budget for [Property Name]."          |
| Backup failure         | "Backup failed for [Property Name]. [count] consecutive failures."   |
| Security incident      | "Unusual login pattern detected at [Property Name]."                 |
| Compliance drift       | "Data retention policy at [Property Name] below regulatory minimum." |

---

### 3.2 Property Provisioning

**URL**: `/system/properties/new`
**Purpose**: Create new properties and launch them through the onboarding wizard.

#### 3.2.1 Create Property

| Field                | Type             | Required | Detail                                                                                                                                              |
| -------------------- | ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property Name        | Text (200 chars) | Yes      | Building name                                                                                                                                       |
| Property Admin Email | Email            | Yes      | Email for the person who will manage this property. Account created automatically.                                                                  |
| Property Admin Name  | Text             | Yes      | First + Last name                                                                                                                                   |
| Template             | Dropdown         | No       | Pre-configured property template (event types, categories, amenity defaults). Options: "Blank", "Standard Condo", "Luxury Tower", "Small Building". |
| Subscription Plan    | Dropdown         | Yes      | Starter, Professional, Enterprise                                                                                                                   |
| Trial                | Toggle           | Yes      | Default: On. When on, 14-day free trial.                                                                                                            |

**On Create**: System creates the property, creates the Property Admin account, sends the welcome email with onboarding wizard link, and redirects Super Admin to the new property's detail page.

#### 3.2.2 Property Detail (Super Admin View)

**URL**: `/system/properties/:id`

| Section           | Content                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Overview**      | Property name, address, plan, status, creation date, admin contact, health score           |
| **Usage**         | Unit count, user count, storage used, API calls, AI spend                                  |
| **Subscription**  | Plan details, billing status, next invoice, payment history                                |
| **Configuration** | Links to all settings tabs (enters property context)                                       |
| **Audit Log**     | Cross-property audit log filtered to this property                                         |
| **Backup Status** | Last backup, backup health, storage used                                                   |
| **Actions**       | Switch to Property, Contact Admin, Suspend, Deactivate, Delete (with extreme confirmation) |

**Delete Property** requires:

1. Typing the property name
2. Typing "DELETE PERMANENTLY"
3. Super Admin password re-entry
4. 72-hour cooling period before actual deletion (can be cancelled)

---

### 3.3 Global User Management

**URL**: `/system/users`
**Purpose**: Cross-property user lookup and management.

#### 3.3.1 Cross-Property User Search

| Feature     | Detail                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Search**  | Search by email, name, or phone across ALL properties                                                                                                 |
| **Results** | Table showing: Name, Email, Properties (list of property names with role at each), Status, Last Login                                                 |
| **Click**   | Opens a combined profile view showing the user's role and activity at each property                                                                   |
| **Merge**   | When a user has accounts at multiple properties with the same email: "Merge Accounts" button consolidates into a single login with per-property roles |

#### 3.3.2 Merged Account View

| Section            | Data                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| **Identity**       | Name, email, phone, profile photo                                      |
| **Properties**     | Table: Property Name, Role at Property, Last Login at Property, Status |
| **Switch Context** | "View as [Property Name]" links to enter that property's user profile  |
| **Global Audit**   | Combined audit log across all properties for this user                 |

---

### 3.4 Feature Flag Management

**URL**: `/system/feature-flags`
**Purpose**: Enable or disable features per property. Control rollout of new features.

#### 3.4.1 Feature Flag Matrix

| Column     | Data                                                 |
| ---------- | ---------------------------------------------------- |
| Feature    | Feature name with description                        |
| Category   | Module group (Security, Packages, Maintenance, etc.) |
| Status     | Global toggle (On/Off)                               |
| Properties | Count of properties with this feature enabled        |
| Override   | "All On", "All Off", or "Per Property"               |
| Actions    | Toggle, Configure per-property                       |

**Per-Property Override**:

When a feature is set to "Per Property", expanding the row shows a list of all properties with individual toggles.

#### 3.4.2 Feature Categories

| Category         | Features                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Core Modules** | Security Console, Package Management, Maintenance, Amenity Booking, Announcements       |
| **Community**    | Classified Ads, Idea Board, Discussion Forum, Photo Albums, Surveys                     |
| **AI Features**  | AI Daily Briefing, AI Categorization, AI Anomaly Detection, AI Drafting, AI Translation |
| **Integrations** | Stripe Payments, SMS Notifications, Voice Calls, Calendar Sync, Weather Widget          |
| **Advanced**     | Custom Fields, API Access, Scheduled Reports, Bulk Operations                           |
| **Business Ops** | Demo Environment, Training Sandbox, Help Center, Developer Portal                       |

---

### 3.5 Subscription & Billing Management

**URL**: `/system/billing`
**Purpose**: Platform-wide revenue management, plan configuration, and billing operations.

#### 3.5.1 Revenue Dashboard

| Widget                | Type           | Data                                                           |
| --------------------- | -------------- | -------------------------------------------------------------- |
| MRR                   | Large number   | Current monthly recurring revenue with month-over-month change |
| ARR                   | Large number   | Annual recurring revenue (MRR x 12)                            |
| Active Subscriptions  | Count by plan  | Starter: X, Professional: Y, Enterprise: Z                     |
| Trial Count           | Count          | Properties currently in trial                                  |
| Past Due              | Count + amount | Properties with failed payments. Total amount outstanding.     |
| Churn (30d)           | Percentage     | Properties cancelled in last 30 days                           |
| Net Revenue Retention | Percentage     | NRR over last 12 months                                        |
| ARPU                  | Amount         | Average revenue per property per month                         |

#### 3.5.2 Subscription List

| Column       | Data                                                       |
| ------------ | ---------------------------------------------------------- |
| Property     | Name + admin name                                          |
| Plan         | Tier badge                                                 |
| Status       | Active, Trial (days remaining), Past Due (days), Cancelled |
| MRR          | Monthly amount                                             |
| Created      | Account creation date                                      |
| Last Payment | Date + amount + status                                     |
| Actions      | View Details, Change Plan, Apply Credit, Cancel            |

**Filters**: By plan, by status, by creation date range, by MRR range.

#### 3.5.3 Plan Configuration

| Plan         | Unit Limit      | Storage | API Calls    | SMS         | AI                    | Price (managed in Stripe) |
| ------------ | --------------- | ------- | ------------ | ----------- | --------------------- | ------------------------- |
| Starter      | Up to 100 units | 5 GB    | 1,000/month  | 500/month   | Basic (Haiku only)    | --                        |
| Professional | Up to 500 units | 25 GB   | 10,000/month | 5,000/month | Full (Haiku + Sonnet) | --                        |
| Enterprise   | Unlimited       | 100 GB  | Unlimited    | Unlimited   | Full + custom models  | --                        |

**Custom pricing**: Super Admin can apply per-property pricing overrides (discounts, custom plans) with internal notes and approval documentation.

---

### 3.6 System Health Monitoring

**URL**: `/system/health`
**Purpose**: Real-time monitoring of platform performance, infrastructure status, and error rates.

#### 3.6.1 Health Dashboard

| Widget                       | Type             | Data                                            | Alert Threshold                            |
| ---------------------------- | ---------------- | ----------------------------------------------- | ------------------------------------------ |
| System Status                | Traffic light    | Green/Yellow/Red overall health                 | Yellow on any warning, Red on any critical |
| API Response Time            | Line chart (24h) | Average response time in ms per 5-minute window | > 500ms                                    |
| Database Performance         | Line chart (24h) | Query execution time in ms                      | > 100ms                                    |
| Error Rate                   | Line chart (24h) | 5xx errors per minute                           | > 0.1%                                     |
| Active WebSocket Connections | Gauge            | Current open connections                        | > 90% capacity                             |
| Storage Usage                | Progress bar     | Total storage used / total provisioned          | > 80%                                      |
| Background Job Queue         | Number           | Pending jobs (email, SMS, AI, import)           | > 1,000 pending                            |
| CDN Cache Hit Rate           | Percentage       | Cache hits / total requests                     | < 90%                                      |

#### 3.6.2 Service Status Grid

| Service              | Status Indicator | Last Check       |
| -------------------- | ---------------- | ---------------- |
| API Server           | Green/Yellow/Red | Every 30 seconds |
| Database (Primary)   | Green/Yellow/Red | Every 30 seconds |
| Database (Replica)   | Green/Yellow/Red | Every 30 seconds |
| Redis Cache          | Green/Yellow/Red | Every 30 seconds |
| WebSocket Server     | Green/Yellow/Red | Every 30 seconds |
| Stripe API           | Green/Yellow/Red | Every 5 minutes  |
| SendGrid API         | Green/Yellow/Red | Every 5 minutes  |
| Twilio API           | Green/Yellow/Red | Every 5 minutes  |
| AI Provider (Claude) | Green/Yellow/Red | Every 5 minutes  |
| AI Provider (OpenAI) | Green/Yellow/Red | Every 5 minutes  |
| S3 Storage           | Green/Yellow/Red | Every 5 minutes  |
| CDN                  | Green/Yellow/Red | Every 5 minutes  |

---

### 3.7 Demo Environment Management

**URL**: `/system/demos`
**Purpose**: Create, manage, and monitor demo and training environments for sales and onboarding.

Detailed in PRD 21 (Demo Environment) and PRD 16 (Settings Admin, Demo Management Tab). Summary:

| Capability              | Detail                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Create Sales Demo       | From template (4 templates). Pre-seeded with realistic data. Auto-expiry.                            |
| Create Training Sandbox | Clone a production property's configuration without resident data.                                   |
| Manage Active Demos     | List with name, template, created by, last accessed, expiry, status. Actions: Reset, Extend, Delete. |
| Template Management     | View, create (clone from production), edit, delete templates.                                        |
| Role Switcher           | In demo mode, any user can preview the platform as any role via top-bar dropdown.                    |
| Usage Analytics         | Which demos are accessed, by whom, for how long. Prospect engagement metrics.                        |

---

### 3.8 Global Event Type Library

**URL**: `/system/event-type-library`
**Purpose**: Manage the master library of event types and groups that new properties are initialized with.

#### 3.8.1 Library Management

| Feature                | Detail                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Default Types**      | The standard set of event types (Visitor, Package, Incident, Key Checkout, Cleaning, Note, etc.) that every new property receives |
| **Default Groups**     | The standard event groups (Security, Deliveries, Building Operations, Administrative)                                             |
| **Templates**          | Industry-specific type sets: "Standard Condo", "Luxury Tower", "Commercial Building", "Mixed-Use"                                 |
| **Add to Library**     | Create a new default type with icon, color, and default notification templates                                                    |
| **Push to Properties** | Push a new event type to all properties (as an optional type they can activate) or to specific properties                         |

---

### 3.9 Compliance Dashboard

**URL**: `/system/compliance`
**Purpose**: Monitor compliance across all properties for 8 regulatory frameworks.

Detailed in PRD 28 (Compliance Reports). Super Admin capabilities:

| Feature                 | Detail                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Compliance Health Score | Composite score per property across all frameworks                                                                                          |
| Framework Status        | Per-framework status card: PIPEDA, GDPR, SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, HIPAA                                            |
| Action Items            | Outstanding compliance tasks with priority and due date                                                                                     |
| 8 Compliance Reports    | Access Audit, Login Activity, Data Retention, Privacy Impact, Incident Response, Consent Tracking, Data Subject Requests, Vendor Compliance |
| Auditor Access          | Grant time-limited read-only access to external auditors                                                                                    |
| Automated Monitoring    | Background checks for encryption status, retention policies, access patterns. Alerts on drift.                                              |

---

### 3.10 Support Ticket Escalation

**URL**: `/system/support`
**Purpose**: View and manage support tickets submitted through the Help Center (PRD 25).

| Feature         | Detail                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Ticket List     | All tickets across all properties. Columns: ID, Property, Subject, Submitter, Priority, Status, Created, Assigned To |
| Filters         | By property, priority, status, category, date range                                                                  |
| Assignment      | Assign tickets to internal team members                                                                              |
| Internal Notes  | Add internal notes not visible to the submitter                                                                      |
| Status Workflow | New > In Progress > Waiting on Customer > Resolved > Closed                                                          |
| SLA Tracking    | Response time SLA per priority. Visual indicator (green/yellow/red) per ticket.                                      |
| Escalation      | Auto-escalate tickets that breach SLA to Super Admin notification                                                    |
| Analytics       | Ticket volume trend, average resolution time, CSAT scores, top categories                                            |

---

### 3.11 Platform Analytics

**URL**: `/system/analytics`
**Purpose**: Business intelligence across all properties.

| Report Category | Reports                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------ |
| **Engagement**  | DAU/WAU/MAU per property, feature adoption rates, session duration, most used features     |
| **Growth**      | Trial sign-ups, conversion rates, time-to-activation, referral sources                     |
| **Revenue**     | MRR trend, ARPU, LTV, churn analysis, cohort retention                                     |
| **Operations**  | Cross-property aggregate: total events, packages, requests. Peak times. Staffing patterns. |
| **AI**          | AI feature usage by property, cost per feature, quality scores, opt-out rates              |
| **Support**     | Ticket volume, resolution time, CSAT, top issues, self-service deflection rate             |

---

### 3.12 Release Management

**URL**: `/system/releases`
**Purpose**: Manage platform version releases and communicate changes to properties.

| Feature          | Detail                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Release Notes    | Create and publish release notes visible to all admins. Rich text with screenshots.         |
| Version Tracking | Current platform version displayed in the footer and settings.                              |
| What's New Modal | On first login after a release, show a "What's New" modal summarizing changes. Dismissable. |
| Changelog        | Public changelog at `concierge.com/changelog` (PRD 22).                                     |
| Staged Rollout   | Enable new features for a subset of properties before full rollout (uses Feature Flags).    |

---

## 4. Unified Approvals Center

**URL**: `/approvals`
**Purpose**: A single page where Property Admins see everything requiring their approval. Reduces the need to check multiple modules.

### 4.1 Pending Approvals Table

| Column       | Data                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Type         | Badge: Amenity Booking, Announcement Draft, Alteration Request (v2), Classified Ad, User Role Change |
| Item         | Description (e.g., "Party Room - Mar 22, 6-10 PM - Unit 1205")                                       |
| Requested By | Name + role + unit                                                                                   |
| Requested At | Timestamp with "X hours ago" relative time                                                           |
| Priority     | Normal, Urgent (for bookings within 48 hours)                                                        |
| Actions      | Approve, Decline (with reason), View Details                                                         |

**Batch Approve**: Select multiple items of the same type and approve in one click.

**Notification**: Approved/declined items trigger notification to the requester via their preferred channel.

**Empty State**: "No pending approvals. You're all caught up." with a checkmark illustration.

---

## 5. Admin Search & Command Palette

### 5.1 Global Search (Admin-Enhanced)

The global search bar (top navigation, always visible) searches across all modules. For Admin roles, search also covers:

| Search Scope  | Example Queries                         | Results                                            |
| ------------- | --------------------------------------- | -------------------------------------------------- |
| Users         | "jane smith", "1205", "jane@email.com"  | User profiles matching name, email, unit, or phone |
| Settings      | "notification template", "event type"   | Setting pages and specific configuration items     |
| Audit Log     | "deleted user", "changed role"          | Audit log entries matching the query               |
| Reports       | "package report", "maintenance summary" | Report templates                                   |
| Events        | "INC-2026-00147"                        | Specific event by reference number                 |
| Help Articles | "how to create event type"              | In-app help articles                               |

### 5.2 Command Palette

**Trigger**: `Ctrl/Cmd + K` from any page.
**Purpose**: Quick keyboard navigation for power users.

| Command                  | Action                                   |
| ------------------------ | ---------------------------------------- |
| `create user`            | Opens Create Account form                |
| `go to settings`         | Navigates to Settings Hub                |
| `go to audit log`        | Navigates to Audit Log                   |
| `create announcement`    | Opens Announcement creation              |
| `switch property [name]` | Super Admin: switches to named property  |
| `view reports`           | Navigates to Reports                     |
| `search users [query]`   | Searches user directory                  |
| `create event type`      | Opens Event Type creation                |
| `view health`            | Navigates to System Health (Super Admin) |

---

## 6. Edge Cases & Safety Mechanisms

### 6.1 Last Admin Protection

| Rule                                  | Enforcement                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cannot remove the last Property Admin | System blocks role change, deactivation, or deletion of the last Property Admin. Error: "This is the only Property Admin for [Property Name]. Assign another admin before making changes." |
| Cannot self-demote                    | A Property Admin cannot change their own role. Another admin must do it.                                                                                                                   |
| Super Admin override                  | Super Admin can always add themselves as a temporary Property Admin to resolve lockouts.                                                                                                   |

### 6.2 Bulk Operation Safety

| Rule                    | Enforcement                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Bulk deactivation cap   | Maximum 50 users per batch. Larger operations require CSV import.                                                    |
| Confirmation escalation | Bulk operations affecting > 10 users require typing "CONFIRM [count] USERS".                                         |
| Undo window             | Bulk deactivations have a 5-minute undo window (toast with "Undo" button). After 5 minutes, the action is permanent. |
| Excluded from bulk      | Property Admins and Super Admins cannot be included in bulk operations.                                              |

### 6.3 Data Deletion Safety

| Deletion Type           | Safeguard                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| User deactivation       | Soft delete. User data retained for 90 days. Can be reactivated.                         |
| Event type deactivation | Soft delete. Historical events retained. Type hidden from creation forms.                |
| Custom field deletion   | Soft delete. Data retained in JSONB. Field hidden from forms.                            |
| Property deletion       | 72-hour cooling period. Requires typing property name + "DELETE PERMANENTLY" + password. |
| Audit log               | Cannot be deleted by any role. Immutable.                                                |

### 6.4 Session Safety

| Rule                         | Detail                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Concurrent session limit     | Maximum 5 active sessions per user. New login terminates the oldest session.       |
| Session timeout              | Staff: 8 hours. Residents: 30 days (with "Remember Me"). Admin: 8 hours.           |
| Role change invalidation     | Any role change immediately invalidates all active sessions for the affected user. |
| Password change invalidation | Password change invalidates all active sessions except the current one.            |

---

## 7. Permission Quick Reference

### 7.1 Admin Actions Summary

A condensed reference of which admin actions require which role. Full matrix is in PRD 02.

| Action Category                  |    Property Admin    |      Super Admin       |
| -------------------------------- | :------------------: | :--------------------: |
| **User Management**              |                      |                        |
| Create user account              |         Yes          |          Yes           |
| Edit user profile                |         Yes          |          Yes           |
| Change user role                 |         Yes          |          Yes           |
| Deactivate user                  |         Yes          |          Yes           |
| Delete user (hard)               |          No          | Yes (with safeguards)  |
| Bulk import users (CSV)          |         Yes          |          Yes           |
| Merge cross-property accounts    |          No          |          Yes           |
| **Property Configuration**       |                      |                        |
| Edit property details            |         Yes          |          Yes           |
| Configure event types            |         Yes          |          Yes           |
| Configure amenities              |         Yes          |          Yes           |
| Configure maintenance categories |         Yes          |          Yes           |
| Manage notification templates    |         Yes          |          Yes           |
| Configure custom fields          |         Yes          |          Yes           |
| Manage branding                  |         Yes          |          Yes           |
| Manage roles & permissions       |         Yes          |          Yes           |
| **System Configuration**         |                      |                        |
| AI provider keys                 |          No          |          Yes           |
| AI global toggle                 |          No          |          Yes           |
| AI per-feature toggle            | Yes (property-level) |      Yes (global)      |
| System health monitoring         |          No          |          Yes           |
| Backup & disaster recovery       |          No          |          Yes           |
| Feature flag management          |          No          |          Yes           |
| **Billing**                      |                      |                        |
| View plan & usage                |         Yes          |          Yes           |
| Change plan                      |         Yes          | Yes (for any property) |
| Update payment method            |         Yes          | Yes (for any property) |
| View revenue dashboard           |          No          |          Yes           |
| Apply credits/discounts          |          No          |          Yes           |
| **Data & Compliance**            |                      |                        |
| View audit log                   |    Yes (property)    |      Yes (global)      |
| Export data                      |    Yes (property)    |      Yes (global)      |
| Import data                      |    Yes (property)    |      Yes (global)      |
| Compliance reports               |    Yes (property)    |      Yes (global)      |
| Grant auditor access             |          No          |          Yes           |
| **Platform Operations**          |                      |                        |
| Create property                  |          No          |          Yes           |
| Manage demos                     |          No          |          Yes           |
| Create training sandbox          |         Yes          |          Yes           |
| View platform analytics          |          No          |          Yes           |
| Manage releases                  |          No          |          Yes           |
| Support ticket escalation        |          No          |          Yes           |

### 7.2 Super Admin-Exclusive Capabilities

These actions are available ONLY to Super Admin and cannot be delegated to any other role:

1. Create and destroy properties
2. Configure AI provider keys and global AI settings
3. Manage system health and infrastructure monitoring
4. Access backup and disaster recovery controls
5. Manage feature flags per property
6. View and manage platform-wide billing and revenue
7. Access cross-property user management and account merging
8. Grant auditor access for compliance assessments
9. Manage the global event type library
10. Configure subscription plans and custom pricing
11. Access platform analytics (engagement, growth, revenue)
12. Manage release notes and staged rollouts
13. Delete properties (with 72-hour cooling period)
14. Emergency AI shutdown across all properties

---

## 8. Data Model Additions

### 8.1 AdminDashboardWidget

```
AdminDashboardWidget
  id              UUID          PK
  user_id         UUID          FK -> User
  property_id     UUID          FK -> Property (nullable for Super Admin system dashboard)
  widget_type     ENUM          'kpi', 'chart', 'feed', 'quick_action', 'briefing', 'alert'
  widget_key      VARCHAR(50)   Identifies the specific widget (e.g., 'open_requests', 'package_volume')
  position        INTEGER       Sort order (drag-and-drop)
  visible         BOOLEAN       DEFAULT true
  config          JSONB         Widget-specific configuration (time period, chart type, filters)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
```

### 8.2 AdminAlert

```
AdminAlert
  id              UUID          PK
  property_id     UUID          FK -> Property
  alert_type      VARCHAR(50)   NOT NULL (e.g., 'overdue_maintenance', 'missing_data', 'backup_warning')
  severity        ENUM          'info', 'warning', 'critical'
  title           VARCHAR(200)  NOT NULL
  description     TEXT          NOT NULL
  link_url        VARCHAR(500)  NULLABLE (deep link to relevant page)
  dismissed_at    TIMESTAMP     NULLABLE
  dismissed_by    UUID          FK -> User, NULLABLE
  auto_resolve    BOOLEAN       DEFAULT false
  resolved_at     TIMESTAMP     NULLABLE
  created_at      TIMESTAMP     NOT NULL
```

### 8.3 ScheduledReport

```
ScheduledReport
  id              UUID          PK
  property_id     UUID          FK -> Property
  report_type     VARCHAR(100)  NOT NULL
  report_config   JSONB         NOT NULL (filters, columns, sort)
  schedule        VARCHAR(50)   NOT NULL ('daily_0800', 'weekly_mon_0900', 'monthly_1_0600')
  format          ENUM          'csv', 'excel', 'pdf'
  recipients      JSONB         Array of user IDs and/or external email addresses
  active          BOOLEAN       DEFAULT true
  last_sent_at    TIMESTAMP     NULLABLE
  last_status     ENUM          'success', 'failed', NULLABLE
  created_by      UUID          FK -> User
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
```

### 8.4 FeatureFlag

```
FeatureFlag
  id              UUID          PK
  key             VARCHAR(100)  NOT NULL, UNIQUE
  name            VARCHAR(200)  NOT NULL
  description     TEXT          NULLABLE
  category        VARCHAR(50)   NOT NULL
  global_enabled  BOOLEAN       DEFAULT true
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
```

### 8.5 PropertyFeatureFlag

```
PropertyFeatureFlag
  id              UUID          PK
  property_id     UUID          FK -> Property
  feature_flag_id UUID          FK -> FeatureFlag
  enabled         BOOLEAN       NOT NULL
  overridden_by   UUID          FK -> User
  overridden_at   TIMESTAMP

  UNIQUE(property_id, feature_flag_id)
```

### 8.6 ApprovalItem

```
ApprovalItem
  id              UUID          PK
  property_id     UUID          FK -> Property
  item_type       ENUM          'amenity_booking', 'announcement_draft', 'alteration_request', 'classified_ad', 'role_change'
  item_id         UUID          FK to the source entity
  requested_by    UUID          FK -> User
  requested_at    TIMESTAMP     NOT NULL
  status          ENUM          'pending', 'approved', 'declined'
  decided_by      UUID          FK -> User, NULLABLE
  decided_at      TIMESTAMP     NULLABLE
  decline_reason  TEXT          NULLABLE, max 500 chars
  priority        ENUM          'normal', 'urgent'
  created_at      TIMESTAMP
```

---

## 9. API Endpoints (Admin-Specific)

### 9.1 Property Admin Endpoints

| Method | Endpoint                                        | Description                         | Auth            |
| ------ | ----------------------------------------------- | ----------------------------------- | --------------- |
| GET    | `/api/v1/admin/dashboard`                       | Dashboard data (KPIs, charts, feed) | Property Admin+ |
| GET    | `/api/v1/admin/alerts`                          | Active alerts for the property      | Property Admin+ |
| PATCH  | `/api/v1/admin/alerts/{id}/dismiss`             | Dismiss an alert                    | Property Admin+ |
| GET    | `/api/v1/admin/approvals`                       | Pending approval items              | Property Admin+ |
| POST   | `/api/v1/admin/approvals/{id}/approve`          | Approve an item                     | Property Admin+ |
| POST   | `/api/v1/admin/approvals/{id}/decline`          | Decline an item (with reason)       | Property Admin+ |
| POST   | `/api/v1/admin/approvals/batch`                 | Batch approve/decline               | Property Admin+ |
| GET    | `/api/v1/admin/staff-performance`               | Staff performance summary           | Property Admin+ |
| GET    | `/api/v1/admin/scheduled-reports`               | List scheduled reports              | Property Admin+ |
| POST   | `/api/v1/admin/scheduled-reports`               | Create scheduled report             | Property Admin+ |
| PATCH  | `/api/v1/admin/scheduled-reports/{id}`          | Update scheduled report             | Property Admin+ |
| DELETE | `/api/v1/admin/scheduled-reports/{id}`          | Delete scheduled report             | Property Admin+ |
| POST   | `/api/v1/admin/scheduled-reports/{id}/send-now` | Trigger immediate send              | Property Admin+ |

### 9.2 Super Admin Endpoints

| Method | Endpoint                                             | Description                              | Auth        |
| ------ | ---------------------------------------------------- | ---------------------------------------- | ----------- |
| GET    | `/api/v1/system/dashboard`                           | Multi-property dashboard data            | Super Admin |
| GET    | `/api/v1/system/properties`                          | List all properties with health scores   | Super Admin |
| POST   | `/api/v1/system/properties`                          | Create property                          | Super Admin |
| GET    | `/api/v1/system/properties/{id}`                     | Property detail (Super Admin view)       | Super Admin |
| DELETE | `/api/v1/system/properties/{id}`                     | Initiate property deletion (72h cooling) | Super Admin |
| POST   | `/api/v1/system/properties/{id}/cancel-deletion`     | Cancel pending deletion                  | Super Admin |
| GET    | `/api/v1/system/users`                               | Cross-property user search               | Super Admin |
| POST   | `/api/v1/system/users/merge`                         | Merge cross-property accounts            | Super Admin |
| GET    | `/api/v1/system/feature-flags`                       | List all feature flags                   | Super Admin |
| PATCH  | `/api/v1/system/feature-flags/{id}`                  | Update global feature flag               | Super Admin |
| PATCH  | `/api/v1/system/feature-flags/{id}/properties/{pid}` | Override feature flag per property       | Super Admin |
| GET    | `/api/v1/system/billing/revenue`                     | Revenue dashboard data                   | Super Admin |
| GET    | `/api/v1/system/billing/subscriptions`               | All subscriptions                        | Super Admin |
| POST   | `/api/v1/system/billing/subscriptions/{id}/credit`   | Apply credit to a subscription           | Super Admin |
| GET    | `/api/v1/system/health`                              | System health dashboard data             | Super Admin |
| GET    | `/api/v1/system/health/services`                     | Service status grid                      | Super Admin |
| GET    | `/api/v1/system/analytics/{category}`                | Platform analytics by category           | Super Admin |
| GET    | `/api/v1/system/compliance`                          | Compliance dashboard                     | Super Admin |
| POST   | `/api/v1/system/compliance/auditor-access`           | Grant auditor access                     | Super Admin |
| GET    | `/api/v1/system/event-type-library`                  | Global event type library                | Super Admin |
| POST   | `/api/v1/system/event-type-library`                  | Add to library                           | Super Admin |
| POST   | `/api/v1/system/event-type-library/{id}/push`        | Push to properties                       | Super Admin |
| GET    | `/api/v1/system/releases`                            | List release notes                       | Super Admin |
| POST   | `/api/v1/system/releases`                            | Create release note                      | Super Admin |
| GET    | `/api/v1/system/support/tickets`                     | List all support tickets                 | Super Admin |
| PATCH  | `/api/v1/system/support/tickets/{id}`                | Update ticket (assign, status, notes)    | Super Admin |

---

## 10. Completeness Checklist

| #   | Requirement                                                                        | Status | Section       |
| --- | ---------------------------------------------------------------------------------- | ------ | ------------- |
| 1   | Property Admin dashboard with KPIs, trends, alerts, staff performance              | Done   | 2.1           |
| 2   | Property settings hub (18 tabs, all documented)                                    | Done   | 2.2           |
| 3   | User management (invite, create, deactivate, role assignment, bulk ops)            | Done   | 2.3           |
| 4   | Role & permission builder (custom roles, granular permissions, matrix view)        | Done   | 2.4           |
| 5   | Event type configuration (add/edit/remove types, groups, icons, colors, templates) | Done   | 2.5           |
| 6   | Amenity configuration (8 sections, pricing, availability, approval, terms)         | Done   | 2.6           |
| 7   | Maintenance categories & workflows (tree, SLA, auto-assignment)                    | Done   | 2.7           |
| 8   | Notification settings (templates, channels, merge fields, test send)               | Done   | 2.8           |
| 9   | Custom fields manager (4 entity types, 10 field types, JSONB-backed)               | Done   | 2.9           |
| 10  | Branding settings (logo, colors, vanity URL, email, live preview)                  | Done   | 2.10          |
| 11  | Data export & reporting (52 reports, custom builder, scheduled delivery)           | Done   | 2.11          |
| 12  | Audit log viewer (immutable, before/after diffs, AI summaries, export)             | Done   | 2.12          |
| 13  | Integration settings (API keys, webhooks, usage stats)                             | Done   | 2.13          |
| 14  | Billing & subscription (plan, usage, payment, invoices, dunning)                   | Done   | 2.14          |
| 15  | Multi-property dashboard (health grid, revenue, alerts)                            | Done   | 3.1           |
| 16  | Property provisioning (create, template, onboarding wizard launch)                 | Done   | 3.2           |
| 17  | Global user management (cross-property search, merge)                              | Done   | 3.3           |
| 18  | Feature flag management (per property, global, matrix)                             | Done   | 3.4           |
| 19  | Subscription & billing management (revenue dashboard, plans, dunning)              | Done   | 3.5           |
| 20  | System health monitoring (services, metrics, alerts)                               | Done   | 3.6           |
| 21  | Demo environment management (sales demos, training sandboxes, templates)           | Done   | 3.7           |
| 22  | Global event type library (defaults, templates, push to properties)                | Done   | 3.8           |
| 23  | Compliance dashboard (8 frameworks, reports, monitoring, auditor access)           | Done   | 3.9           |
| 24  | Support ticket escalation (SLA tracking, assignment, analytics)                    | Done   | 3.10          |
| 25  | Platform analytics (engagement, growth, revenue, operations, AI, support)          | Done   | 3.11          |
| 26  | Release management (notes, changelog, staged rollout)                              | Done   | 3.12          |
| 27  | Unified approvals center                                                           | Done   | 4             |
| 28  | Admin search and command palette                                                   | Done   | 5             |
| 29  | Edge cases and safety mechanisms                                                   | Done   | 6             |
| 30  | Permission quick reference with Super Admin exclusives                             | Done   | 7             |
| 31  | Data models for new entities                                                       | Done   | 8             |
| 32  | API endpoints for admin and system operations                                      | Done   | 9             |
| 33  | Every admin screen: data shown, actions available, permissions, layout, edge cases | Done   | Throughout    |
| 34  | No competitor names referenced                                                     | Done   | Throughout    |
| 35  | Tooltips and progressive disclosure documented                                     | Done   | Throughout    |
| 36  | Empty, loading, and error states defined                                           | Done   | 2.1, 2.3, 2.5 |
| 37  | Desktop-first layouts for 1920px+ monitors                                         | Done   | Throughout    |

---

_Last updated: 2026-03-17_
_Cross-references: PRD 02, PRD 08, PRD 16, PRD 19, PRD 21, PRD 24, PRD 25, PRD 26, PRD 28_
