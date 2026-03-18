# 21 — Demo Environment & Training Sandbox

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture (Multi-Tenancy, Property Model), 02-Roles and Permissions, 11-Training LMS, 16-Settings Admin

---

## 1. Overview

### What It Is

The Demo Environment & Training Sandbox system provides two distinct non-production property modes within Concierge: **Sales Demo** and **Training Sandbox**. Both modes use the same multi-tenant architecture as production properties but are flagged with a special `property_type` that controls notification suppression, data reset capabilities, auto-expiry, UI badges, and billing exclusion.

A Sales Demo is a fully pre-seeded property environment that the Concierge sales team uses to walk prospective clients through the entire platform with realistic data. A Training Sandbox is a cloned property environment that building administrators create so new staff can learn the system safely without touching production data.

Neither mode requires separate infrastructure. Both are "just properties" with a different type flag and a set of behavioral overrides.

### Why It Exists

Selling building management software requires showing every feature with realistic data. Without a dedicated demo mode, sales teams are forced to use screenshots, slide decks, or — dangerously — live production data from a real property. None of these options give prospects a true feel for how the product works in their specific context.

Similarly, training new concierge and security staff is a persistent challenge for property management companies. Staff turnover in front-desk and security roles is high. Without a sandbox, new hires either learn on production data (risky — one wrong click sends a notification to 400 residents) or they shadow experienced staff for weeks without hands-on practice.

Industry research across multiple production platforms revealed that none of them offer a purpose-built demo mode with role switching, realistic seeded data, and prospect branding customization. Training environments are equally absent — new staff are typically given production access and told to be careful.

This is a competitive differentiator. A prospect who can log into a branded demo with their building's name and logo, switch between roles in one click, and see 6 months of realistic data will convert at a significantly higher rate than one watching a screen share.

### Which Roles Use It

| Role                                 | Access Level                                             | Primary Use                                    |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| **Super Admin**                      | Create, manage, reset, and destroy Sales Demos           | Provision demo environments for the sales team |
| **Sales Rep** (Super Admin sub-role) | Use existing Sales Demos, reset data, customize branding | Conduct prospect demonstrations                |
| **Property Admin**                   | Create and manage Training Sandboxes for their property  | Onboard new staff safely                       |
| **Property Manager**                 | Create and manage Training Sandboxes for their property  | Train new employees                            |
| **Trainee** (temporary role)         | Access Training Sandbox only                             | Learn the system with fake data                |

Roles that do **not** interact with this module: Board Member, Resident (Owner), Resident (Tenant), Family Member, Maintenance Staff. These roles never see demo or training management controls.

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across three production platforms revealed the following patterns and gaps related to demo and training environments:

| Capability                      | Where Observed                                                                                       | Our Approach                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **No dedicated demo mode**      | No platform observed offers a purpose-built demo environment with pre-seeded data and role switching | Build from scratch. This is a market gap.                                                                 |
| **No training sandbox**         | No platform observed provides a safe training environment that clones real property structure        | Build from scratch. Another market gap.                                                                   |
| **Role-specific dashboards**    | All platforms observed provide different views per role, but require full logout/login to switch     | Adopt and enhance. "View as [Role]" switcher that changes perspective instantly without re-authentication |
| **Realistic data patterns**     | One platform had courier-specific icons (Amazon, FedEx, UPS) on package cards for visual recognition | Adopt. Demo data must include branded courier entries with realistic distribution                         |
| **Multi-channel notifications** | Advanced platforms support email, SMS, push, and lobby display distribution                          | Critical for demo but must be suppressed. Demo environments never send real notifications.                |
| **Staff training modules**      | One platform had a unique LMS/training module with quizzes and pass/fail tracking                    | Integrate. Training Sandbox ties directly into the LMS module (PRD 11) for structured learning            |
| **Property branding**           | Platforms allow logo and color customization per property                                            | Leverage for demos. Prospect branding customization makes demos feel personalized                         |

### Best Practices Adopted

1. **Same architecture, different flag** — demo and training environments are regular properties with a type enum, not separate infrastructure that could drift from the real product
2. **Deterministic seeding** — mock data is generated from a fixed seed so demos are reproducible and consistent across resets
3. **Notification suppression at the property level** — a single flag prevents all outbound communication (email, SMS, push, voice) for non-production properties
4. **Auto-expiry with grace period** — unused environments are automatically cleaned up to prevent storage bloat
5. **Concurrent isolation** — multiple sales reps can each have their own demo running simultaneously without interference

### Pitfalls Avoided

1. **No separate database** — demo properties do not get their own database instance. This avoids schema drift where the demo environment behaves differently from production.
2. **No stale demo data** — the reset mechanism restores data to a known-good state so demos never show corrupted or manually altered data to prospects
3. **No real notification leakage** — the system must make it architecturally impossible for a demo or training property to send real emails, SMS, or push notifications. This is enforced at the notification service layer, not just the UI.
4. **No unlimited training accounts** — training environments are capped at 5 trainees to prevent abuse and resource consumption
5. **No permanent demo properties** — all non-production properties have an expiry mechanism to prevent orphaned data accumulation

---

## 3. Sales Demo Mode

### 3.1 Creation

Only Super Admins can create Sales Demo environments.

**Entry Point**: Super Admin Panel > Demo Management > "Create Demo Property"

**Creation Wizard** (3 steps):

| Step                      | Fields                                                                                                                                                                           | Description                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **1. Template Selection** | Template dropdown (initially only "Maple Heights"), description preview                                                                                                          | Select which demo template to use. v1 ships with one template. Additional templates can be added later. |
| **2. Prospect Branding**  | Prospect company name (text, required), Prospect logo (image upload, optional, max 2MB, PNG/SVG/JPEG), Primary accent color (color picker, optional, defaults to Concierge blue) | Personalize the demo for the prospect. These values are applied as property branding overrides.         |
| **3. Assignment**         | Assigned sales rep (dropdown of Super Admin users), Demo label (text, optional, e.g., "Acme Properties - March Demo"), Notes (textarea, optional)                                | Internal tracking. The label appears in the demo management list.                                       |

**On submit**:

1. System creates a new property record with `property_type = 'demo'`
2. Demo seeder runs asynchronously (takes 10-30 seconds)
3. Progress indicator shows seeding status: "Creating units... Creating residents... Generating events..."
4. On completion, the admin receives the demo URL and can begin the presentation

### 3.2 The "Maple Heights" Template

The default (and initially only) demo template simulates a realistic mid-size condominium property.

**Property Structure**:

| Attribute            | Value                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Property name**    | "Maple Heights Condominiums" (overridden by prospect name if provided)                                             |
| **Address**          | 1200 Maple Drive, Toronto, ON M5V 3A8                                                                              |
| **Type**             | Condominium                                                                                                        |
| **Towers**           | 2 (Tower A: "Maple Tower", Tower B: "Oak Tower")                                                                   |
| **Floors per tower** | 8 (no 13th floor — realistic for superstitious numbering)                                                          |
| **Units per floor**  | Tower A: 12 units/floor (101-112, 201-212, ..., 801-812), Tower B: 13 units/floor (113-125, 213-225, ..., 813-825) |
| **Total units**      | 200                                                                                                                |
| **Unit types**       | Studio (15%), 1BR (35%), 2BR (30%), 2BR+Den (12%), 3BR (5%), Penthouse (3%)                                        |
| **Amenity spaces**   | 8: Party Room, Fitness Centre, Swimming Pool, BBQ Terrace, Guest Suite, Theatre Room, Tennis Court, Yoga Studio    |
| **Parking levels**   | 3 underground levels (P1, P2, P3), 300 spots total                                                                 |
| **Storage lockers**  | 150 lockers across 2 levels                                                                                        |

### 3.3 Pre-Seeded Data

All data is generated using `@faker-js/faker` with a fixed seed value (`seed: 20260101`) so that every reset produces identical data. See Section 6 for the complete mock data specification.

**Summary counts**:

| Category             | Count    | Notes                                                                    |
| -------------------- | -------- | ------------------------------------------------------------------------ |
| Residents            | 400+     | Diverse names from multiple cultural backgrounds, realistic contact info |
| Staff accounts       | 12       | Across all operational roles                                             |
| Package entries      | 500+     | 6 months of history with courier brand distribution                      |
| Maintenance requests | 200+     | Across 15 categories and all statuses                                    |
| Amenity bookings     | 300+     | Across 3 months with revenue data                                        |
| Security incidents   | 50+      | Noise complaints, unauthorized access, property damage, etc.             |
| Visitor entries      | 200+     | With sign-in/sign-out times                                              |
| Shift log entries    | 180 days | Daily entries covering all shifts                                        |
| Announcements        | 30+      | Building updates, fire drills, maintenance notices, community events     |
| Parking violations   | 25       | Various violation types and statuses                                     |
| FOB records          | 400+     | With serial numbers and assignment history                               |
| Training courses     | 5        | With quiz results and completion certificates                            |
| Classified ads       | 15       | Furniture, electronics, services                                         |
| Community events     | 5        | Holiday party, AGM, BBQ, movie night, yoga class                         |
| Idea Board entries   | 8        | Resident suggestions with vote counts                                    |

### 3.4 "View as [Role]" Quick Switcher

The most important demo feature. This allows a sales rep to instantly switch the entire UI perspective to any role without logging out.

**Component**: `RoleSwitcherOverlay`

**Location**: Fixed position in the demo header bar, immediately right of the DEMO badge

**Behavior**:

| Aspect                | Specification                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Trigger**           | Click the "View as: [Current Role]" dropdown button                                                              |
| **Dropdown contents** | 5 pre-built persona cards, each showing: role icon, role name, persona name, one-line description                |
| **Switching speed**   | Instant. No page reload. The client re-renders with the new role's permissions, navigation, and dashboard.       |
| **Active indicator**  | The currently active persona has a blue highlight and checkmark                                                  |
| **Persistence**       | The selected role persists across page navigation within the demo session but resets to "Concierge" on new login |

**Pre-Built Personas**:

| #   | Persona Name     | Role                   | Description                                                                                                    |
| --- | ---------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | "Maria Chen"     | Front Desk / Concierge | Day-shift concierge. Sees the Security Console with package intake, visitor log, and shift notes.              |
| 2   | "James Okafor"   | Security Guard         | Night-shift security. Sees the Security Console with incident reporting, parking violations, and FOB tracking. |
| 3   | "Sarah Thompson" | Property Manager       | Building manager. Sees maintenance dashboard, vendor compliance, reports, and all administrative features.     |
| 4   | "David Kim"      | Board Member           | Board treasurer. Sees governance dashboard, financial reports, building analytics, and alteration approvals.   |
| 5   | "Priya Patel"    | Resident (Owner)       | Unit 507 owner. Sees resident portal with their packages, maintenance requests, bookings, and announcements.   |

**Technical implementation**:

- The switcher does NOT create separate user sessions. It overrides the `effectiveRole` on the current session token.
- All API calls include both the `actualRole` (Super Admin) and the `effectiveRole` (the persona role) in the request context.
- Server-side permission checks use `effectiveRole` for data filtering and feature gating.
- Audit logs record the `actualRole` so there is always a record of who actually performed the action.

### 3.5 Demo Badge

**Component**: `DemoBadge`

| Attribute            | Value                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Text**             | "DEMO"                                                                              |
| **Background color** | `oklch(0.75 0.18 55)` (orange-500)                                                  |
| **Text color**       | White                                                                               |
| **Font**             | System font, 11px, bold, uppercase, letter-spacing 0.5px                            |
| **Position**         | Header bar, left of the property name                                               |
| **Shape**            | Rounded pill (border-radius: 9999px), padding 2px 10px                              |
| **Visibility**       | Always visible on every page in demo mode. Cannot be hidden or dismissed.           |
| **Tooltip**          | "This is a demo environment. Data is simulated and no real notifications are sent." |

### 3.6 Reset Demo

**Purpose**: Restore all demo data to its original seeded state. Used between sales presentations so each prospect sees clean data.

**Entry point**: Demo header bar > "Reset Demo" button (icon: refresh arrow)

**Confirmation dialog**:

- Title: "Reset Demo Data?"
- Body: "This will restore all data to the original demo state. Any changes made during this session will be lost. This cannot be undone."
- Actions: "Cancel" (secondary), "Reset Demo" (destructive, red)
- Checkbox: "Also reset prospect branding to defaults" (unchecked by default)

**Reset behavior**:

1. All events, packages, maintenance requests, bookings, incidents, shift logs, and announcements are deleted for this property
2. All user accounts except the assigned sales rep's Super Admin account are deleted
3. Demo seeder re-runs with the same fixed seed, recreating all data identically
4. If the branding reset checkbox was checked, prospect name/logo/color revert to defaults
5. Active WebSocket connections to this property receive a `DEMO_RESET` event and the client displays a full-page overlay: "Demo has been reset. Reloading..."
6. Duration: 10-30 seconds. A progress indicator shows during reset.

### 3.7 Prospect Branding Customization

Sales reps can customize the demo to look like it belongs to the prospect's property.

**Customizable elements**:

| Element                  | How It Appears                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Property name**        | Replaces "Maple Heights Condominiums" everywhere: header, login page, emails (suppressed), generated reports   |
| **Property logo**        | Replaces default logo in sidebar, header, and login page                                                       |
| **Primary accent color** | Overrides `--concierge-color-primary-*` tokens so buttons, links, and active states match the prospect's brand |

**Entry point**: Demo header bar > gear icon > "Demo Settings" dialog

**Constraints**:

- Logo: PNG, SVG, or JPEG. Max 2MB. Minimum 128x128px. Square or landscape aspect ratio.
- Property name: 3-100 characters. Alphanumeric, spaces, hyphens, ampersands, and periods only.
- Color: Any valid hex or OKLCH value. A preview swatch updates live.

### 3.8 Concurrent Demos

Multiple demo properties can exist simultaneously.

**Rules**:

- Each demo property is an independent entity with its own ID, data, and branding
- No limit on concurrent demos (monitored by Super Admin)
- Each demo is assigned to one sales rep but can be accessed by any Super Admin
- The Demo Management page lists all active demos with: label, assigned rep, created date, last accessed date, prospect name, status

### 3.9 Auto-Expiry

Demo properties that are not accessed for 90 consecutive days are automatically expired.

**Expiry flow**:

1. Day 75 (15 days before expiry): System sends an email to the assigned sales rep: "Your demo '[label]' will expire in 15 days. Access it to keep it active or let it expire."
2. Day 85 (5 days before expiry): Second reminder email.
3. Day 90: Property status changes to `expired`. The property is soft-deleted (data retained for 30 more days, accessible only via Super Admin recovery).
4. Day 120: Hard delete. All data is permanently removed.

**Extending**: Any access to the demo property (login, page view) resets the 90-day counter.

**Manual destruction**: Super Admins can destroy a demo at any time from the Demo Management page.

---

## 4. Training Sandbox Mode

### 4.1 Creation

Property Admins and Property Managers can create Training Sandboxes for their own property.

**Entry point**: Settings > Training > "Create Training Environment"

**Creation form**:

| Field                       | Type                           | Required   | Description                                                                                                              |
| --------------------------- | ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Environment name**        | Text                           | Yes        | E.g., "March 2026 New Hire Training"                                                                                     |
| **Clone source**            | Auto-filled                    | —          | The current production property (read-only display)                                                                      |
| **Trainee accounts**        | Multi-row input (up to 5 rows) | At least 1 | Each row: Name, Email, Role assignment (dropdown: Front Desk, Security Guard, Maintenance Staff)                         |
| **Duration**                | Dropdown                       | Yes        | 7 days, 14 days, 30 days (default: 30 days)                                                                              |
| **Enable guided tutorials** | Toggle                         | No         | Default: On. When enabled, trainees see interactive tutorial overlays on first visit to each module.                     |
| **Enable assessment**       | Toggle                         | No         | Default: Off. When enabled, trainees must complete a quiz/checklist before the sandbox is marked as "training complete." |

**On submit**:

1. System creates a new property record with `property_type = 'training'` and `parent_property_id` pointing to the source property
2. Property structure is cloned: units, amenity spaces, event types, categories, notification templates, custom field definitions
3. All resident and staff data is replaced with faker-generated data (50 fake residents, 3 months of synthetic events)
4. Trainee user accounts are created and welcome emails are sent (these are real emails — the only real notifications the training environment sends)
5. The admin receives a confirmation with trainee login credentials

### 4.2 Cloned vs. Generated Data

| Data Category                                  | Behavior                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| **Property structure** (units, floors, towers) | Cloned exactly from production                                           |
| **Amenity spaces** (names, rules, hours)       | Cloned exactly from production                                           |
| **Event types** (names, icons, colors)         | Cloned exactly from production                                           |
| **Custom field definitions**                   | Cloned exactly from production                                           |
| **Notification templates**                     | Cloned exactly from production (but notifications are suppressed)        |
| **Residents**                                  | Generated. 50 fake residents with realistic names and contact info       |
| **Staff**                                      | Generated. 3 fake staff members (1 per operational role)                 |
| **Events**                                     | Generated. 3 months of synthetic events (packages, visitors, incidents)  |
| **Maintenance requests**                       | Generated. 10 open requests across various categories and statuses       |
| **Amenity bookings**                           | Generated. 5 pending bookings for trainees to practice approving/denying |
| **Announcements**                              | Generated. 3 draft announcements for trainees to practice publishing     |
| **Shift logs**                                 | Generated. 14 days of shift entries                                      |

### 4.3 Training Badge

**Component**: `TrainingBadge`

| Attribute            | Value                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Text**             | "TRAINING"                                                                              |
| **Background color** | `oklch(0.80 0.15 85)` (yellow-500)                                                      |
| **Text color**       | `oklch(0.25 0.05 85)` (dark brown for contrast)                                         |
| **Font**             | System font, 11px, bold, uppercase, letter-spacing 0.5px                                |
| **Position**         | Header bar, left of the property name                                                   |
| **Shape**            | Rounded pill (border-radius: 9999px), padding 2px 10px                                  |
| **Visibility**       | Always visible on every page in training mode. Cannot be hidden or dismissed.           |
| **Tooltip**          | "This is a training environment. Data is simulated and no real notifications are sent." |

### 4.4 Notification Suppression

Training environments NEVER send real notifications. This is enforced at the notification service layer.

**Suppressed channels**:

| Channel               | Behavior in Training Mode                                                         |
| --------------------- | --------------------------------------------------------------------------------- |
| **Email**             | Not sent. UI shows "Email sent (simulated)" with a green checkmark.               |
| **SMS**               | Not sent. UI shows "SMS sent (simulated)" with a green checkmark.                 |
| **Push notification** | Not sent. UI shows "Push sent (simulated)" with a green checkmark.                |
| **Voice call**        | Not sent. UI shows "Voice call initiated (simulated)" with a green checkmark.     |
| **Lobby display**     | Not rendered on any real display. UI shows "Posted to lobby display (simulated)." |

**The one exception**: The initial welcome email to trainees IS a real email because they need actual credentials to log in. After that, all notifications are suppressed.

**Implementation**: The notification service checks `property.type` before dispatching. If the property type is `demo` or `training`, the notification is logged to the `notification_log` table with `status = 'simulated'` but never sent to the external provider (SendGrid, Twilio, Firebase, etc.).

### 4.5 Guided Tutorial Overlays

When enabled, trainees see interactive step-by-step overlays the first time they visit each major module.

**Tutorial structure**:

| Module               | Steps   | What It Teaches                                                                                                                                             |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security Console** | 8 steps | Event stream navigation, quick-create icons, creating a package entry, logging a visitor, writing a shift note, using filters, batch mode, printing a label |
| **Maintenance**      | 5 steps | Creating a request, attaching photos, assigning to vendor, updating status, closing with resolution                                                         |
| **Amenity Booking**  | 4 steps | Viewing the calendar, approving a booking, denying with reason, creating an admin booking                                                                   |
| **Announcements**    | 3 steps | Creating a draft, selecting distribution channels, publishing                                                                                               |
| **Unit File**        | 4 steps | Searching for a unit, viewing resident details, adding a front-desk instruction, checking emergency contacts                                                |

**Overlay component**: `TutorialOverlay`

- Semi-transparent backdrop with a spotlight cutout around the target element
- Step counter: "Step 3 of 8"
- Description text (2-3 sentences per step)
- "Next" and "Previous" buttons
- "Skip Tutorial" link at bottom
- Completion: green checkmark animation and "Tutorial Complete!" message
- Tutorials can be replayed from the Help menu

**Progress is tracked per trainee per module** in the `training_progress` table.

### 4.6 Progress Tracking

Admins can monitor how each trainee is progressing through the training environment.

**Training Progress Dashboard** (Settings > Training > [Environment Name] > Progress):

| Column                  | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| **Trainee name**        | Full name of the trainee                                               |
| **Role**                | Assigned role in the training environment                              |
| **Last active**         | Timestamp of last login/activity                                       |
| **Tutorials completed** | X of Y tutorials finished (progress bar)                               |
| **Actions performed**   | Count of create/edit/delete actions taken                              |
| **Modules visited**     | Checkmarks for each module visited at least once                       |
| **Assessment status**   | Not started / In progress / Passed / Failed (if assessment is enabled) |

**Detail view** (click on a trainee row):

- Timeline of all actions taken, grouped by module
- Time spent in each module
- Tutorial step-by-step completion log
- Assessment quiz results (if applicable)

### 4.7 Assessment Integration (LMS Tie-In)

When the "Enable assessment" toggle is on, the training sandbox connects to the Training/LMS module (PRD 11).

**Flow**:

1. Admin selects one or more existing LMS courses to associate with this training environment
2. Trainees see a "Training Checklist" widget on their dashboard listing required courses
3. Each course can be started from the training environment — it opens the LMS module in context
4. Quiz completion and pass/fail results are recorded against the training environment
5. The admin's progress dashboard shows assessment results alongside practical activity metrics
6. When all required courses are passed and all tutorials are completed, the trainee's status changes to "Training Complete"

### 4.8 Trainee Account Lifecycle

| Event                  | Behavior                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Creation**           | Trainee receives a real welcome email with temporary password and training environment URL                                                                                                                                    |
| **First login**        | Trainee must change password. Training badge is immediately visible. Guided tutorial begins (if enabled).                                                                                                                     |
| **During training**    | Trainee can only access the training property. They cannot see or switch to production properties.                                                                                                                            |
| **Training complete**  | Admin sees "Training Complete" status. Admin can manually promote the trainee to a production account.                                                                                                                        |
| **Environment expiry** | All trainee accounts are deactivated. Trainees who were not promoted lose access entirely.                                                                                                                                    |
| **Promotion**          | Admin clicks "Promote to Production" on a trainee. The system creates a new user account on the production property with the same name, email, and role. The trainee's training progress is preserved as a historical record. |

### 4.9 Auto-Expiry

Training environments expire based on the duration selected during creation.

**Expiry flow**:

1. 3 days before expiry: Admin receives an email notification: "Training environment '[name]' expires in 3 days."
2. 1 day before expiry: Second reminder. Includes a summary of trainee progress.
3. On expiry day: Property status changes to `expired`. All trainee accounts are deactivated. Data is retained for 30 days (soft delete).
4. 30 days after expiry: Hard delete. All training data is permanently removed.

**Extension**: Admin can extend the duration from Settings > Training > [Environment Name] > "Extend" button. Options: +7 days, +14 days, +30 days.

### 4.10 Resource Limits

| Resource                                      | Limit                                       | Rationale                                                           |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| **Trainee accounts per environment**          | 5                                           | Prevents abuse. Most training cohorts are 1-3 people.               |
| **Active training environments per property** | 3                                           | Prevents resource bloat. Old environments should be cleaned up.     |
| **Storage per training environment**          | 500 MB                                      | Prevents large file uploads during training from consuming storage. |
| **Duration**                                  | Maximum 30 days (extendable to 60 days max) | Training should not be indefinite.                                  |

---

## 5. Technical Architecture

### 5.1 Property Type Enum

The `property_type` field on the `Property` model controls all behavioral differences.

```
enum PropertyType {
  PRODUCTION = 'production'   // Real property with real data and real notifications
  DEMO       = 'demo'         // Sales demo with seeded data and suppressed notifications
  TRAINING   = 'training'     // Training sandbox with cloned structure and suppressed notifications
}
```

**Behavioral matrix**:

| Behavior                          | Production | Demo                     | Training                          |
| --------------------------------- | ---------- | ------------------------ | --------------------------------- |
| Sends real notifications          | Yes        | No                       | No (except initial welcome email) |
| Counts toward billing             | Yes        | No                       | No                                |
| Supports data reset               | No         | Yes                      | No                                |
| Has auto-expiry                   | No         | Yes (90 days inactivity) | Yes (7-30 days configured)        |
| Shows environment badge           | No         | Yes (orange "DEMO")      | Yes (yellow "TRAINING")           |
| Role switcher available           | No         | Yes                      | No                                |
| Appears in portfolio dashboard    | Yes        | No                       | No                                |
| Appears in cross-property reports | Yes        | No                       | No                                |
| Indexed in global search          | Yes        | No                       | No                                |

### 5.2 Notification Suppression

Notification suppression is enforced at the **service layer**, not the UI layer. This is a critical architectural decision.

```
NotificationService.send(notification):
  1. Resolve property from notification context
  2. IF property.type !== 'production':
       a. Log notification to notification_log with status = 'simulated'
       b. Return { sent: false, simulated: true, reason: 'non-production property' }
       c. DO NOT call external provider (SendGrid, Twilio, Firebase, etc.)
  3. ELSE:
       a. Proceed with normal sending logic
```

**Exception handler**: The trainee welcome email bypasses this check by using a `force_send: true` flag that is ONLY available to the system account during training environment creation. No API endpoint exposes this flag.

### 5.3 Demo Data Seeder

The seeder is both a CLI tool and an internal service callable from the admin API.

**CLI commands**:

| Command                                                                  | Description                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `pnpm demo:seed --template=maple-heights --property-id=<id>`             | Seed a property with the Maple Heights template                 |
| `pnpm demo:reset --property-id=<id>`                                     | Delete all data for a demo property and re-seed                 |
| `pnpm demo:destroy --property-id=<id>`                                   | Permanently delete a demo property and all its data             |
| `pnpm training:seed --source-property-id=<id> --target-property-id=<id>` | Clone structure from source and generate fake data for training |
| `pnpm training:destroy --property-id=<id>`                               | Permanently delete a training property and all its data         |

**Seeder architecture**:

```
DemoSeeder
├── TemplateLoader         // Loads template definition (Maple Heights)
├── PropertyGenerator      // Creates property record with structure
├── UserGenerator          // Creates residents and staff with faker
├── EventGenerator         // Creates packages, visitors, incidents
├── MaintenanceGenerator   // Creates maintenance requests with photos
├── BookingGenerator       // Creates amenity bookings with revenue
├── SecurityGenerator      // Creates FOBs, parking violations, shift logs
├── AnnouncementGenerator  // Creates announcements with read rates
├── TrainingGenerator      // Creates LMS courses and quiz results
├── CommunityGenerator     // Creates classified ads, events, ideas
└── ReportDataGenerator    // Ensures 6 months of chartable data points
```

Each generator:

- Accepts a `faker` instance pre-configured with the fixed seed
- Returns a count of records created
- Supports idempotent execution (safe to re-run)
- Logs progress to stdout for CLI and to a progress channel for the admin UI

### 5.4 Faker Configuration

```typescript
import { faker } from '@faker-js/faker';

// Fixed seed for deterministic, reproducible demo data
faker.seed(20260101);

// Locale: en_CA for Canadian names, addresses, phone formats
faker.setLocale('en_CA');
```

**Why a fixed seed matters**: Every time a demo is reset, the same residents, packages, and events are regenerated in the same order. This means sales reps can rehearse specific data points ("Unit 507 has 3 outstanding packages — let me show you how the release flow works") and they will always be there.

### 5.5 Auto-Expiry Scheduler

A scheduled job runs daily at 02:00 UTC:

```
DemoExpiryJob (runs daily):
  1. Find all properties WHERE type IN ('demo', 'training') AND status = 'active'
  2. For each property:
     a. Calculate days since last access (last_accessed_at)
     b. IF demo AND days_inactive >= 90: mark as expired, send notification
     c. IF training AND NOW() > expires_at: mark as expired, send notification
  3. Find all properties WHERE status = 'expired' AND expired_at < NOW() - 30 days
  4. For each: hard delete all data and the property record
```

---

## 6. Mock Data Specification

### 6.1 Residents (400 total)

| Attribute                | Distribution                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cultural diversity**   | Names generated from en_CA locale with deliberate diversity — East Asian (20%), South Asian (20%), European (25%), Middle Eastern (10%), Latin American (10%), African (10%), Indigenous (5%) |
| **Unit occupancy**       | 85% of units occupied (170 of 200). 60% have 1 resident, 30% have 2 residents, 10% have 3+ residents.                                                                                         |
| **Contact completeness** | 95% have email, 80% have phone, 60% have emergency contacts                                                                                                                                   |
| **Move-in dates**        | Distribution across 5 years, with 15% moved in within the last 6 months                                                                                                                       |
| **Owner vs. Tenant**     | 55% owners, 40% tenants, 5% offsite owners                                                                                                                                                    |
| **Pets**                 | 25% of units have pets (60% dogs, 30% cats, 10% other)                                                                                                                                        |
| **Vehicles**             | 70% of units have at least one vehicle registered                                                                                                                                             |

### 6.2 Staff (12 total)

| Role                   | Count | Names                                                                              |
| ---------------------- | ----- | ---------------------------------------------------------------------------------- |
| Front Desk / Concierge | 6     | Maria Chen, Alex Rivera, Fatima Hassan, John Mitchell, Yuki Tanaka, Devon Williams |
| Security Guard         | 3     | James Okafor, Rajesh Patel, Elena Volkov                                           |
| Property Manager       | 1     | Sarah Thompson                                                                     |
| Board Member           | 1     | David Kim                                                                          |
| Super Admin            | 1     | System Admin (the sales rep's account)                                             |

### 6.3 Packages (500+ entries)

| Attribute             | Distribution                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Courier brands**    | Amazon 40%, FedEx 15%, UPS 12%, Canada Post 10%, Purolator 8%, DHL 5%, IntelCom 3%, Other 7%             |
| **Status**            | Picked up 60%, Pending pickup 25%, Notified 10%, Returned to sender 5%                                   |
| **Time distribution** | Heavier on weekdays (80%). Morning deliveries peak 10am-12pm. Pickups peak 5pm-8pm.                      |
| **Package types**     | Small parcel 50%, Medium box 25%, Large box 15%, Oversized 5%, Envelope 5%                               |
| **Storage locations** | Package room A (40%), Package room B (30%), Oversized storage (15%), Concierge desk (10%), Returned (5%) |
| **Date range**        | Spread across 180 days with realistic seasonal variation (higher volume Nov-Dec)                         |
| **Labels printed**    | 90% have printed labels                                                                                  |
| **Notification sent** | 95% have at least one notification sent                                                                  |

### 6.4 Maintenance Requests (200+ entries)

| Attribute               | Distribution                                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Categories**          | Plumbing 20%, Electrical 12%, HVAC 15%, Appliance 10%, Structural 8%, Elevator 5%, Pest Control 5%, Cleaning 8%, Painting 4%, Lock/Key 5%, Window 3%, Flooring 3%, Other 2% |
| **Status**              | Closed 45%, Open 30%, In Progress 15%, On Hold 10%                                                                                                                          |
| **Priority**            | Low 20%, Medium 50%, High 25%, Urgent 5%                                                                                                                                    |
| **Photo attachments**   | 40% have at least one photo                                                                                                                                                 |
| **Vendor assignments**  | 60% assigned to a vendor                                                                                                                                                    |
| **Permission to enter** | 75% grant permission to enter                                                                                                                                               |
| **Average resolution**  | 3.2 days (Closed requests)                                                                                                                                                  |
| **Date range**          | Spread across 180 days                                                                                                                                                      |

### 6.5 Amenity Bookings (300+ entries)

| Attribute          | Distribution                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spaces**         | Party Room 25%, Guest Suite 20%, BBQ Terrace 15%, Theatre Room 12%, Fitness Centre 10% (walk-in), Pool 8% (walk-in), Tennis Court 5%, Yoga Studio 5% |
| **Status**         | Confirmed 70%, Pending approval 15%, Completed 10%, Cancelled 5%                                                                                     |
| **Time slots**     | Weekday evenings 35%, Weekend daytime 30%, Weekend evenings 25%, Weekday daytime 10%                                                                 |
| **Revenue**        | $12,400 total. Party Room generates 50% of revenue ($50/booking). Guest Suite generates 30% ($75/night).                                             |
| **Repeat bookers** | 20% of residents account for 60% of bookings                                                                                                         |
| **Date range**     | Spread across 3 months (current month + 1 month past + 1 month future)                                                                               |

### 6.6 Security Data

**Incidents (50+ entries)**:

| Type                        | Count | Severity    |
| --------------------------- | ----- | ----------- |
| Noise complaint             | 18    | Low-Medium  |
| Unauthorized access attempt | 8     | High        |
| Property damage             | 6     | Medium-High |
| Suspicious person           | 5     | Medium      |
| Fire alarm (false)          | 4     | High        |
| Theft report                | 3     | High        |
| Elevator entrapment         | 2     | Critical    |
| Water leak                  | 2     | High        |
| Parking altercation         | 2     | Medium      |

**FOB Records (400+ entries)**:

- 85% of occupied units have at least one FOB assigned
- Each FOB has a unique 8-character serial number (format: `FOB-XXXXXXXX`)
- Status distribution: Active 80%, Deactivated 12%, Lost/Reported 5%, Replacement pending 3%

**Parking Violations (25 entries)**:

- Types: Unauthorized spot 40%, Expired permit 25%, Double parking 15%, Fire lane 10%, Speeding 10%
- Status: Warning issued 40%, Ticket issued 30%, Resolved 20%, Ban issued 10%

**Shift Logs (180 days)**:

- 3 shifts per day (Day 7am-3pm, Evening 3pm-11pm, Night 11pm-7am)
- Each entry: staff name, shift time, weather, handoff notes, notable events count
- Average 3-5 notable events per shift

### 6.7 Announcements (30+ entries)

| Type                        | Count | Urgency |
| --------------------------- | ----- | ------- |
| Building maintenance notice | 10    | Normal  |
| Community event             | 6     | Low     |
| Safety/security alert       | 4     | High    |
| Rule reminder               | 3     | Normal  |
| Fire drill                  | 3     | High    |
| Board meeting notice        | 2     | Normal  |
| Holiday greeting            | 2     | Low     |

**Distribution channels**: Email 80%, Push 60%, SMS 40%, Lobby display 20%
**Read rates**: Range from 45% (low urgency) to 92% (high urgency)

### 6.8 Training/LMS Data

**5 courses**:

| Course                           | Duration | Pass Rate | Quiz Questions |
| -------------------------------- | -------- | --------- | -------------- |
| Fire Safety & Emergency Response | 45 min   | 90%       | 15             |
| Package Handling Procedures      | 30 min   | 88%       | 10             |
| Visitor & Access Protocol        | 35 min   | 85%       | 12             |
| Emergency First Response         | 60 min   | 82%       | 20             |
| Customer Service Excellence      | 25 min   | 92%       | 8              |

All 12 staff members have completion records. Average score: 85%.

### 6.9 Community Data

**Classified Ads (15)**:

- Categories: Furniture (5), Electronics (3), Services (3), Free items (2), Wanted (2)
- All posted by different residents
- Ages: 1-30 days old

**Community Events (5)**:

- Holiday party, Annual General Meeting, Summer BBQ, Movie Night, Yoga Class
- Mix of past (2), upcoming (2), and ongoing (1)

**Idea Board (8)**:

- Suggestions like "Add EV charging stations," "Extend gym hours," "Install bike repair station"
- Vote counts: 3-47 votes each
- Status: Under review (3), Planned (2), Completed (1), Declined (1), New (1)

---

## 7. Data Model Changes

### 7.1 Property Model Additions

The following fields are added to the existing `Property` model:

| Field                     | Type                | Default        | Description                                                                                                         |
| ------------------------- | ------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `type`                    | `PropertyType` enum | `'production'` | One of: `production`, `demo`, `training`                                                                            |
| `expires_at`              | `DateTime?`         | `null`         | When this property auto-expires. Null for production properties.                                                    |
| `parent_property_id`      | `UUID?`             | `null`         | For training environments: references the production property this was cloned from. Null for production and demo.   |
| `demo_template_id`        | `UUID?`             | `null`         | For demo properties: references the template used to seed data. Null for production and training.                   |
| `assigned_sales_rep_id`   | `UUID?`             | `null`         | For demo properties: the Super Admin user assigned to this demo.                                                    |
| `demo_label`              | `String?`           | `null`         | For demo properties: internal label (e.g., "Acme Properties - March Demo").                                         |
| `last_accessed_at`        | `DateTime`          | `NOW()`        | Last time any user accessed this property. Updated on every authenticated request. Used for demo inactivity expiry. |
| `prospect_name`           | `String?`           | `null`         | For demo properties: the prospect's company name (overrides property name in UI).                                   |
| `prospect_logo_url`       | `String?`           | `null`         | For demo properties: URL to the prospect's uploaded logo.                                                           |
| `prospect_accent_color`   | `String?`           | `null`         | For demo properties: hex color override for the primary accent.                                                     |
| `notification_suppressed` | `Boolean`           | `false`        | Derived from `type !== 'production'`. Stored for query performance.                                                 |
| `max_trainees`            | `Integer?`          | `null`         | For training environments: maximum number of trainee accounts (default 5).                                          |
| `created_from_template`   | `String?`           | `null`         | Template identifier used during creation (e.g., "maple-heights").                                                   |

### 7.2 DemoTemplate Model

Stores the definition of demo templates.

| Field                         | Type              | Description                                                                      |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `id`                          | `UUID`            | Primary key                                                                      |
| `slug`                        | `String` (unique) | URL-safe identifier (e.g., "maple-heights")                                      |
| `name`                        | `String`          | Display name (e.g., "Maple Heights Condominiums")                                |
| `description`                 | `String`          | Short description shown in template selection                                    |
| `version`                     | `Integer`         | Template version number (incremented when template data changes)                 |
| `config`                      | `JSONB`           | Full template configuration: towers, floors, units, amenities, event types, etc. |
| `seed_value`                  | `Integer`         | The faker seed value for this template                                           |
| `estimated_seed_time_seconds` | `Integer`         | Expected seeding duration (used for progress estimation)                         |
| `is_active`                   | `Boolean`         | Whether this template is available for selection                                 |
| `created_at`                  | `DateTime`        | Record creation timestamp                                                        |
| `updated_at`                  | `DateTime`        | Record update timestamp                                                          |

### 7.3 TrainingProgress Model

Tracks trainee activity within a training environment.

| Field                     | Type        | Description                                                      |
| ------------------------- | ----------- | ---------------------------------------------------------------- |
| `id`                      | `UUID`      | Primary key                                                      |
| `property_id`             | `UUID`      | The training property                                            |
| `user_id`                 | `UUID`      | The trainee                                                      |
| `module_slug`             | `String`    | Which module (e.g., "security-console", "maintenance")           |
| `tutorial_completed`      | `Boolean`   | Whether the guided tutorial for this module is complete          |
| `tutorial_completed_at`   | `DateTime?` | When the tutorial was completed                                  |
| `actions_count`           | `Integer`   | Number of create/edit/delete actions in this module              |
| `first_visited_at`        | `DateTime?` | First time the trainee opened this module                        |
| `last_visited_at`         | `DateTime?` | Most recent visit                                                |
| `time_spent_seconds`      | `Integer`   | Cumulative time in this module                                   |
| `assessment_status`       | `String?`   | One of: `null`, `not_started`, `in_progress`, `passed`, `failed` |
| `assessment_score`        | `Float?`    | Quiz score (0.0 to 1.0)                                          |
| `assessment_completed_at` | `DateTime?` | When the assessment was completed                                |

### 7.4 DemoSession Model

Tracks role-switching activity in demo environments.

| Field                    | Type       | Description                                     |
| ------------------------ | ---------- | ----------------------------------------------- |
| `id`                     | `UUID`     | Primary key                                     |
| `property_id`            | `UUID`     | The demo property                               |
| `user_id`                | `UUID`     | The sales rep (Super Admin)                     |
| `effective_role`         | `String`   | The currently active persona role               |
| `effective_persona_name` | `String`   | The persona's display name (e.g., "Maria Chen") |
| `switched_at`            | `DateTime` | When the role switch occurred                   |

### 7.5 Indexes

| Index                        | Table              | Columns                  | Purpose                                      |
| ---------------------------- | ------------------ | ------------------------ | -------------------------------------------- |
| `idx_property_type`          | `Property`         | `type`                   | Fast filtering of demo/training properties   |
| `idx_property_expires_at`    | `Property`         | `expires_at`             | Efficient expiry job queries                 |
| `idx_property_parent`        | `Property`         | `parent_property_id`     | Find training envs for a production property |
| `idx_property_last_accessed` | `Property`         | `type, last_accessed_at` | Demo inactivity detection                    |
| `idx_training_progress_user` | `TrainingProgress` | `property_id, user_id`   | Trainee progress lookup                      |
| `idx_demo_session_property`  | `DemoSession`      | `property_id, user_id`   | Demo role-switch history                     |

---

## 8. API Endpoints

### 8.1 Sales Demo Endpoints

All demo endpoints require **Super Admin** role.

#### Create Demo

```
POST /api/admin/demo
```

**Request body**:

| Field                   | Type     | Required | Description                                 |
| ----------------------- | -------- | -------- | ------------------------------------------- |
| `template_slug`         | `string` | Yes      | Template identifier (e.g., "maple-heights") |
| `prospect_name`         | `string` | Yes      | Prospect company name                       |
| `prospect_logo`         | `file`   | No       | Logo image (PNG/SVG/JPEG, max 2MB)          |
| `prospect_accent_color` | `string` | No       | Hex color (e.g., "#2563eb")                 |
| `assigned_sales_rep_id` | `uuid`   | No       | Defaults to the requesting user             |
| `label`                 | `string` | No       | Internal label for the demo                 |
| `notes`                 | `string` | No       | Internal notes                              |

**Response** (201 Created):

```json
{
  "id": "uuid",
  "property_id": "uuid",
  "status": "seeding",
  "template": "maple-heights",
  "prospect_name": "Acme Properties",
  "demo_url": "https://app.concierge.com/demo/abc123",
  "estimated_ready_seconds": 25,
  "created_at": "2026-03-16T10:00:00Z"
}
```

**Seeding progress** (streamed via SSE):

```
GET /api/admin/demo/:id/progress
```

Returns server-sent events:

```
data: {"step": "Creating property structure", "progress": 10}
data: {"step": "Generating residents", "progress": 25}
data: {"step": "Seeding packages", "progress": 40}
data: {"step": "Seeding maintenance requests", "progress": 55}
data: {"step": "Seeding amenity bookings", "progress": 65}
data: {"step": "Seeding security data", "progress": 75}
data: {"step": "Seeding announcements", "progress": 85}
data: {"step": "Generating reports data", "progress": 95}
data: {"step": "Complete", "progress": 100, "demo_url": "..."}
```

#### Reset Demo

```
POST /api/admin/demo/:id/reset
```

**Request body**:

| Field            | Type      | Required | Description                                                                 |
| ---------------- | --------- | -------- | --------------------------------------------------------------------------- |
| `reset_branding` | `boolean` | No       | If true, also reset prospect branding to template defaults. Default: false. |

**Response** (200 OK):

```json
{
  "id": "uuid",
  "status": "resetting",
  "estimated_ready_seconds": 20
}
```

#### Destroy Demo

```
DELETE /api/admin/demo/:id
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "status": "destroyed",
  "data_deleted": true
}
```

#### List Demos

```
GET /api/admin/demo
```

**Query parameters**: `status` (active, expired, all), `assigned_to` (user ID), `page`, `limit`

**Response** (200 OK):

```json
{
  "demos": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "label": "Acme Properties - March Demo",
      "prospect_name": "Acme Properties",
      "status": "active",
      "template": "maple-heights",
      "assigned_sales_rep": { "id": "uuid", "name": "Jane Smith" },
      "created_at": "2026-03-16T10:00:00Z",
      "last_accessed_at": "2026-03-16T14:30:00Z",
      "expires_at": "2026-06-14T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

#### Update Demo Branding

```
PATCH /api/admin/demo/:id/branding
```

**Request body**: Any combination of `prospect_name`, `prospect_logo`, `prospect_accent_color`.

**Response** (200 OK): Updated demo object.

### 8.2 Training Sandbox Endpoints

Training endpoints require **Property Admin** or **Property Manager** role.

#### Create Training Environment

```
POST /api/admin/training
```

**Request body**:

| Field                   | Type      | Required | Description                                                 |
| ----------------------- | --------- | -------- | ----------------------------------------------------------- |
| `name`                  | `string`  | Yes      | Environment name                                            |
| `source_property_id`    | `uuid`    | Yes      | The production property to clone structure from             |
| `duration_days`         | `integer` | Yes      | 7, 14, or 30                                                |
| `trainees`              | `array`   | Yes      | Array of 1-5 trainee objects                                |
| `trainees[].name`       | `string`  | Yes      | Trainee full name                                           |
| `trainees[].email`      | `string`  | Yes      | Trainee email address                                       |
| `trainees[].role`       | `string`  | Yes      | One of: `front_desk`, `security_guard`, `maintenance_staff` |
| `enable_tutorials`      | `boolean` | No       | Default: true                                               |
| `enable_assessment`     | `boolean` | No       | Default: false                                              |
| `assessment_course_ids` | `uuid[]`  | No       | LMS course IDs to require (if assessment is enabled)        |

**Response** (201 Created):

```json
{
  "id": "uuid",
  "property_id": "uuid",
  "name": "March 2026 New Hire Training",
  "status": "provisioning",
  "source_property_id": "uuid",
  "expires_at": "2026-04-15T10:00:00Z",
  "trainees": [
    {
      "id": "uuid",
      "name": "Alex Johnson",
      "email": "alex.johnson@email.com",
      "role": "front_desk",
      "temporary_password": "auto-generated (shown once)",
      "login_url": "https://app.concierge.com/training/xyz789"
    }
  ]
}
```

#### Get Training Progress

```
GET /api/admin/training/:id/progress
```

**Response** (200 OK):

```json
{
  "environment_id": "uuid",
  "name": "March 2026 New Hire Training",
  "expires_at": "2026-04-15T10:00:00Z",
  "trainees": [
    {
      "id": "uuid",
      "name": "Alex Johnson",
      "role": "front_desk",
      "last_active": "2026-03-16T15:30:00Z",
      "tutorials_completed": 3,
      "tutorials_total": 5,
      "modules_visited": ["security-console", "amenity-booking", "announcements"],
      "total_actions": 47,
      "time_spent_minutes": 120,
      "assessment_status": "in_progress",
      "assessment_score": null
    }
  ]
}
```

#### Extend Training Environment

```
POST /api/admin/training/:id/extend
```

**Request body**:

| Field             | Type      | Required | Description                                                       |
| ----------------- | --------- | -------- | ----------------------------------------------------------------- |
| `additional_days` | `integer` | Yes      | 7, 14, or 30. Total cannot exceed 60 days from original creation. |

#### Destroy Training Environment

```
DELETE /api/admin/training/:id
```

Requires confirmation. Returns 200 OK on success.

#### Promote Trainee

```
POST /api/admin/training/:id/trainees/:trainee_id/promote
```

Creates a production user account on the parent property with the same name, email, and role.

**Response** (201 Created):

```json
{
  "production_user_id": "uuid",
  "property_id": "uuid",
  "name": "Alex Johnson",
  "email": "alex.johnson@email.com",
  "role": "front_desk",
  "training_record_preserved": true
}
```

---

## 9. Screen States & UI

### 9.1 Demo Management Page (Super Admin)

**Location**: Super Admin Panel > Demo Management

**Layout**: Full-width table with action buttons.

**Table columns**:

| Column            | Content                                                     |
| ----------------- | ----------------------------------------------------------- |
| **Label**         | Demo label or prospect name                                 |
| **Template**      | Template name (e.g., "Maple Heights")                       |
| **Assigned To**   | Sales rep name and avatar                                   |
| **Status**        | Badge: Active (green), Seeding (blue pulse), Expired (gray) |
| **Created**       | Relative date (e.g., "3 days ago")                          |
| **Last Accessed** | Relative date                                               |
| **Expires**       | Countdown or date                                           |
| **Actions**       | "Open" (link), "Reset" (button), "Delete" (icon)            |

**Empty state**: Illustration with text "No demo environments yet. Create one to start showcasing Concierge to prospects." and a primary "Create Demo" button.

**Header actions**: "Create Demo" (primary button)

### 9.2 Demo Creation Wizard

**Type**: Full-page wizard (3 steps)

**Step indicators**: Horizontal stepper at top showing: 1. Template > 2. Branding > 3. Assignment

**Step 1 — Template Selection**:

- Card-based selection (one card per template, initially only "Maple Heights")
- Each card shows: template name, unit count, description, preview thumbnail
- Selected card has blue border and checkmark

**Step 2 — Prospect Branding**:

- Prospect company name (text input, required)
- Logo upload (drag-and-drop zone with preview)
- Accent color picker with live preview swatch
- Live preview panel on the right showing how the header will look with the branding applied

**Step 3 — Assignment**:

- Assigned sales rep (searchable dropdown)
- Demo label (text input)
- Notes (textarea)
- Summary card showing all selections

**Footer**: "Back" (secondary), "Next" or "Create Demo" (primary on final step)

### 9.3 Role Switcher Component

**Location**: Demo header bar, right of the DEMO badge

**Collapsed state**: Pill-shaped button showing "View as: Maria Chen (Concierge)" with a chevron-down icon

**Expanded state**: Dropdown panel (320px wide) with 5 persona cards stacked vertically

**Persona card layout** (each card):

- Left: Role icon (24x24)
- Center: Persona name (bold) + Role name (secondary text) + One-line description (muted text)
- Right: Checkmark if active
- Hover: Light blue background
- Click: Instant role switch, dropdown closes, page re-renders

**Animation**: Fade transition (150ms) when switching roles. No full page reload.

### 9.4 Reset Confirmation Dialog

**Type**: Centered modal dialog with backdrop

**Content**:

- Warning icon (orange triangle)
- Title: "Reset Demo Data?"
- Body text: "This will restore all data to the original demo state. Any changes made during this session will be lost. This cannot be undone."
- Checkbox: "Also reset prospect branding to defaults"
- Buttons: "Cancel" (left, secondary), "Reset Demo" (right, red/destructive)

**During reset**: The dialog transforms to show a progress bar with step labels. Buttons are disabled. A "Resetting..." spinner appears.

**After reset**: Success message with green checkmark: "Demo data has been reset successfully." Auto-dismisses after 3 seconds.

### 9.5 Training Management Page (Property Admin / Manager)

**Location**: Settings > Training

**Layout**: Card grid showing active and expired training environments.

**Card layout** (each training environment):

- Header: Environment name + status badge (Active/Expired)
- Body: Created date, expires date, trainee count, progress summary (e.g., "2 of 3 trainees completed tutorials")
- Footer: "View Progress" (link), "Extend" (button, if active), "Delete" (icon)

**Empty state**: Illustration with text "No training environments. Create one to onboard new staff safely." and a primary "Create Training Environment" button.

### 9.6 Training Progress Dashboard

**Location**: Settings > Training > [Environment Name]

**Layout**: Two sections stacked vertically.

**Section 1 — Overview**:

- Environment name, status, expiry countdown
- Trainee count and overall completion percentage
- Quick actions: "Extend Duration", "Add Trainee" (if under limit), "Delete Environment"

**Section 2 — Trainee Table**:

| Column            | Content                                                    |
| ----------------- | ---------------------------------------------------------- |
| **Trainee**       | Name + avatar                                              |
| **Role**          | Assigned role badge                                        |
| **Last Active**   | Relative timestamp                                         |
| **Tutorials**     | Progress bar (X of Y)                                      |
| **Actions Taken** | Number                                                     |
| **Assessment**    | Status badge (Not started / In progress / Passed / Failed) |
| **Actions**       | "View Detail" (link), "Promote" (button)                   |

**Trainee detail view** (slide-out panel):

- Timeline of all actions grouped by date
- Module-by-module breakdown with time spent
- Tutorial completion log (step-by-step)
- Assessment results (if applicable)

---

## 10. Permissions

### 10.1 Demo Environment Permissions

| Action                    | Super Admin | Property Admin | Property Manager | Other Roles |
| ------------------------- | :---------: | :------------: | :--------------: | :---------: |
| Create demo property      |     Yes     |       No       |        No        |     No      |
| List all demos            |     Yes     |       No       |        No        |     No      |
| Open/use a demo           |     Yes     |       No       |        No        |     No      |
| Switch demo roles         |     Yes     |       No       |        No        |     No      |
| Reset demo data           |     Yes     |       No       |        No        |     No      |
| Update demo branding      |     Yes     |       No       |        No        |     No      |
| Destroy demo              |     Yes     |       No       |        No        |     No      |
| View demo management page |     Yes     |       No       |        No        |     No      |

### 10.2 Training Environment Permissions

| Action                         | Super Admin |   Property Admin   |  Property Manager  | Trainee | Other Roles |
| ------------------------------ | :---------: | :----------------: | :----------------: | :-----: | :---------: |
| Create training env            |     Yes     | Yes (own property) | Yes (own property) |   No    |     No      |
| List training envs             |  Yes (all)  | Yes (own property) | Yes (own property) |   No    |     No      |
| View trainee progress          |  Yes (all)  | Yes (own property) | Yes (own property) |   No    |     No      |
| Extend training env            |     Yes     | Yes (own property) | Yes (own property) |   No    |     No      |
| Destroy training env           |     Yes     | Yes (own property) |         No         |   No    |     No      |
| Promote trainee                |     Yes     | Yes (own property) |         No         |   No    |     No      |
| Access training env as trainee |     No      |         No         |         No         |   Yes   |     No      |
| Complete tutorials             |     No      |         No         |         No         |   Yes   |     No      |
| Take assessment                |     No      |         No         |         No         |   Yes   |     No      |

### 10.3 Cross-Cutting Permission Rules

1. **Demo properties are invisible to non-Super-Admin users**. They do not appear in property lists, switchers, search results, or reports for any other role.
2. **Training properties are visible only to their creator, other admins of the parent property, and assigned trainees**. They do not appear in portfolio dashboards or cross-property reports.
3. **Trainees can ONLY access their assigned training property**. They cannot see or switch to any production property, even if the same email is associated with a production account.
4. **The role switcher in demo mode does NOT grant actual permissions**. The sales rep remains a Super Admin for audit purposes. The `effectiveRole` is used only for UI rendering and data filtering — not for authorization of destructive actions (delete, destroy).

---

## 11. Edge Cases & Error Handling

### 11.1 Demo Data Reset During Active Session

**Scenario**: Sales rep A resets the demo while sales rep B is actively using the same demo property.

**Handling**:

1. When a reset is initiated, the server broadcasts a `DEMO_RESET_STARTED` WebSocket event to all connected clients on that property.
2. Active clients display a full-screen overlay: "This demo is being reset by [Rep A Name]. Please wait..."
3. During reset (10-30 seconds), all API calls to the demo property return `503 Service Unavailable` with a `Retry-After` header.
4. On completion, the server broadcasts `DEMO_RESET_COMPLETE`. Clients auto-reload to the dashboard.
5. Any unsaved form data is lost. This is acceptable because demo data is disposable.

### 11.2 Multiple Users in Same Demo Simultaneously

**Scenario**: Two sales reps share the same demo property during a joint presentation.

**Handling**:

1. Both users can be logged in simultaneously with independent role switcher states.
2. Real-time updates via WebSocket mean both see the same data changes.
3. If Rep A switches to "Resident" role and Rep B switches to "Manager" role, each sees the appropriate interface independently.
4. The `DemoSession` model tracks each user's current persona separately.
5. Conflict: If both users edit the same record simultaneously, standard optimistic locking applies (last write wins with a conflict notification).

### 11.3 Training Environment Hitting Storage Limits

**Scenario**: A trainee uploads many large files during training, approaching the 500 MB storage limit.

**Handling**:

1. At 80% (400 MB): Yellow warning banner appears in the training environment header: "Storage is nearly full (400 MB of 500 MB used)."
2. At 95% (475 MB): Orange warning banner. File upload buttons are disabled.
3. At 100% (500 MB): Upload attempts return `413 Payload Too Large` with message: "This training environment has reached its storage limit. Contact your administrator."
4. The admin's progress dashboard shows storage usage per training environment.
5. Admin can delete specific large files from the training environment via Settings > Training > [Env] > Storage.

### 11.4 Auto-Expiry During Active Demo Presentation

**Scenario**: A demo's 90-day inactivity timer expires while a sales rep is mid-presentation (unlikely but possible if the rep logged in after 89 days of inactivity and the expiry job runs).

**Handling**:

1. The daily expiry job checks `last_accessed_at`. Since the rep logged in today, the counter was reset. The job will not expire this property.
2. Safety measure: The expiry job explicitly skips properties where `last_accessed_at` is within the last 24 hours, regardless of calculated inactivity.
3. If a race condition somehow occurs and the property is marked expired during an active session, the client receives a `PROPERTY_EXPIRED` WebSocket event and shows: "This demo environment has expired. Please contact your administrator to restore it."
4. Super Admins can restore an expired (but not hard-deleted) demo from the Demo Management page via a "Restore" button that appears on expired demos for 30 days.

### 11.5 Demo Seeder Failure

**Scenario**: The seeding process fails mid-way (e.g., database timeout, out of memory).

**Handling**:

1. The seeder runs inside a database transaction. If any step fails, the entire transaction is rolled back.
2. The demo property status is set to `seed_failed`.
3. The admin sees an error state on the Demo Management page with a "Retry Seed" button.
4. Error details are logged to the server logs with the full stack trace.
5. After 3 consecutive failures, the system alerts the Super Admin via email and disables the retry button with a message: "Seeding has failed multiple times. Please contact support."

### 11.6 Training Trainee Accesses Production Property

**Scenario**: A trainee who also has a production account at the same property tries to access production data.

**Handling**:

1. Trainee accounts are created with a `training_only: true` flag.
2. The authentication middleware checks this flag. If `training_only: true`, the user can ONLY access the training property.
3. The property switcher is not shown to training-only users.
4. If a trainee manually navigates to a production URL, they receive a `403 Forbidden` with message: "Your account is restricted to the training environment."
5. After promotion, a new production user account is created. The training-only account remains separate and is deactivated on environment expiry.

### 11.7 Demo Template Version Mismatch

**Scenario**: The demo template is updated (e.g., new data categories added), but existing demo properties were seeded with the old version.

**Handling**:

1. Each demo property records the `template_version` it was seeded with.
2. When a template is updated, existing demos continue to function with their original data.
3. The Demo Management page shows a "Template Update Available" badge on demos with outdated versions.
4. Super Admins can choose to "Reset with Latest Template" which re-seeds with the new template version.
5. Template updates never automatically reset existing demos.

### 11.8 Concurrent Training Environment Limit

**Scenario**: A Property Admin tries to create a 4th training environment when the limit is 3.

**Handling**:

1. The API returns `422 Unprocessable Entity` with message: "Maximum 3 active training environments per property. Please delete or wait for an existing environment to expire before creating a new one."
2. The UI disables the "Create Training Environment" button when 3 active environments exist, with tooltip text explaining the limit.
3. Expired environments do not count toward the limit.

### 11.9 Trainee Email Already Exists as Production User

**Scenario**: Admin creates a training environment and enters a trainee email that already belongs to a production user at the same property.

**Handling**:

1. The system displays a warning: "[email] already has a production account at this property. A separate training account will be created."
2. The trainee gets a NEW training-only account with a different session. They can log into production and training independently.
3. When promoted, the system asks: "This trainee already has a production account. Replace the existing account role, or skip promotion?"
4. If "Replace" is chosen, the production account's role is updated and the training record is linked.

---

---

## 12. Completeness Checklist

### Feature Coverage

| #   | Requirement                                                          | Status  | Section |
| --- | -------------------------------------------------------------------- | ------- | ------- |
| 1   | Sales demo with "Maple Heights" template (200 units, 400+ residents) | Covered | 3       |
| 2   | Deterministic seeding with @faker-js/faker                           | Covered | 4       |
| 3   | "View as [Role]" quick switcher                                      | Covered | 5       |
| 4   | Training sandbox with staff onboarding                               | Covered | 6       |
| 5   | Demo watermark on all screens                                        | Covered | 7       |
| 6   | Notification suppression (logged but not delivered)                  | Covered | 7       |
| 7   | Auto-expiry for demo properties (configurable, default 30 days)      | Covered | 8       |
| 8   | Template versioning and upgrade path                                 | Covered | 11.7    |
| 9   | Concurrent training environment limit (max 3 per property)           | Covered | 11.8    |
| 10  | Data isolation using standard multi-tenant boundaries                | Covered | 7       |

### Edge Case Coverage

| #   | Requirement                                                                                                                                                                                                                                                                                    | Status  | Section         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------- |
| 1   | Demo expiry during active session                                                                                                                                                                                                                                                              | Covered | 11.1            |
| 2   | Template version mismatch                                                                                                                                                                                                                                                                      | Covered | 11.7            |
| 3   | Concurrent training limit exceeded                                                                                                                                                                                                                                                             | Covered | 11.8            |
| 4   | Trainee email collision with production user                                                                                                                                                                                                                                                   | Covered | 11.9            |
| 5   | Demo data reset while another user is viewing                                                                                                                                                                                                                                                  | Covered | 11.2            |
| 6   | Graceful demo expiry mid-session: active users see a modal "This demo has expired. Your session will end in 60 seconds." with a countdown timer. After 60 seconds, the user is redirected to a "Demo Expired" page with a "Request New Demo" CTA. No data loss because demo data is ephemeral. | Covered | 11.1 (expanded) |

---

## ADDENDUM: Gap Analysis Fixes (2026-03-17)

> Added from GAP-ANALYSIS-FINAL.md gap 21.1

### A1. Demo Usage Analytics for Sales Follow-Up (Gap 21.1, Medium)

The Training Sandbox has a TrainingProgress model that tracks trainee activity per module, but Sales Demos have no equivalent analytics. Sales reps need to know which features prospects interacted with and how much time they spent in each module to inform follow-up conversations.

#### DemoAnalytics Model

| Field                | Type     | Description                                                                                                            |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`                 | UUID     | Primary key                                                                                                            |
| `property_id`        | UUID     | The demo property                                                                                                      |
| `session_id`         | UUID     | Groups activity within a single demo session (from login to logout or 30-minute idle timeout)                          |
| `user_id`            | UUID     | The sales rep or prospect (if self-guided link is used)                                                                |
| `module_slug`        | String   | Which module was visited (e.g., "security-console", "packages", "maintenance")                                         |
| `first_visited_at`   | DateTime | First time this module was opened in this session                                                                      |
| `last_visited_at`    | DateTime | Most recent activity in this module in this session                                                                    |
| `time_spent_seconds` | Integer  | Cumulative active time in this module (pauses after 60 seconds of inactivity)                                          |
| `actions_count`      | Integer  | Number of create/edit/delete/view-detail actions taken                                                                 |
| `features_used`      | JSONB    | Array of specific feature identifiers interacted with (e.g., ["batch_event_create", "filter_by_status", "export_pdf"]) |

#### Demo Analytics Dashboard

Accessible from Demo Management > [Demo Name] > Analytics tab (visible to Super Admin and Sales Rep roles).

**Summary View:**

| #   | Metric              | Description                                          |
| --- | ------------------- | ---------------------------------------------------- |
| 1   | Total demo sessions | Count of distinct sessions for this demo environment |
| 2   | Total time spent    | Cumulative active time across all sessions           |
| 3   | Modules visited     | Checkmarks for each module visited at least once     |
| 4   | Most-used module    | Module with highest time_spent_seconds               |
| 5   | Features explored   | Count of distinct features interacted with           |
| 6   | Last session date   | When the demo was last accessed                      |

**Module Breakdown Table:**

| #   | Column       | Description                           |
| --- | ------------ | ------------------------------------- |
| 1   | Module       | Module name with icon                 |
| 2   | Visits       | Number of times the module was opened |
| 3   | Time Spent   | Formatted duration (e.g., "12m 30s")  |
| 4   | Actions      | Count of actions taken                |
| 5   | Key Features | Top 3 features used within the module |

**Session Timeline** (expandable):

Each session is shown as a horizontal timeline bar with colored segments per module (similar to a Gantt chart), showing the order and duration of module visits within that session. Hovering on a segment shows module name and time spent.

#### Sales Follow-Up Integration

- When a demo session ends (logout or expiry), the assigned sales rep receives an email summary: "Demo session completed for [Prospect Name]. They spent [X minutes] across [N modules]. Top interest: [Module Name] ([Y minutes])."
- The analytics data is exportable as CSV for CRM integration.
- A "Suggested talking points" section (AI-generated, v2) analyzes which modules the prospect spent the most time in and suggests relevant value propositions for the follow-up call.

---

_Last updated: 2026-03-17_
_Author: Concierge Product Team_
