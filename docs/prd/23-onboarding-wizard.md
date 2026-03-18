# 23 — Onboarding Wizard

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 07-Unit Management, 06-Amenity Booking, 03-Security Console (Event Types), 09-Communication (Email Templates), 19-AI Framework

---

## 1. Overview

### What It Is

The Onboarding Wizard is a **guided, 8-step setup experience** that takes a newly signed property from zero configuration to fully operational. It runs exactly once per property — immediately after contract signing — and walks the Property Admin through every decision needed to launch: property details, unit creation, amenity setup, event type configuration, staff invitations, resident imports, branding, and go-live activation.

This is the **first screen any paying customer ever sees**. It must be flawless. Every moment of friction here risks buyer's remorse, support tickets, and churn before the product even launches.

### Why It Exists

Industry research revealed that competing platforms require **2 to 5 business days** of manual setup with dedicated support staff. New properties must email spreadsheets, schedule onboarding calls, and wait for a support agent to configure their account. This delay kills momentum and creates a negative first impression.

Concierge eliminates this entirely. The target is **30 minutes from sign-up to fully operational** — no support calls, no back-and-forth emails, no waiting. The wizard is self-service, auto-saves progress, and can be resumed across sessions. A Property Admin with a laptop and a CSV file can have their entire 500-unit building live before lunch.

### Why This Matters to the Business

The Property Admin is the buyer. If their first experience is painful, slow, or confusing, Concierge loses the contract. The onboarding wizard is not a utility screen — it is a **sales conversion tool** that must reinforce the customer's decision to choose Concierge over incumbents.

### Which Roles Use It

| Role               | Access Level                                 | Primary Use                                        |
| ------------------ | -------------------------------------------- | -------------------------------------------------- |
| **Super Admin**    | Full access, can run wizard for any property | Platform-level property provisioning               |
| **Property Admin** | Full access for their own property           | Self-service property setup after contract signing |

Roles that do **not** access the Onboarding Wizard: Security Guard, Front Desk / Concierge, Property Manager, Board Member, Maintenance Staff, all Resident roles. These roles do not exist until the wizard creates them.

### Scope

| In Scope                                                    | Out of Scope                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| 8-step guided wizard flow                                   | Subscription and billing setup (see BUSINESS-OPERATIONS Section 6)     |
| Property detail capture and validation                      | Multi-property portfolio dashboard (see BUSINESS-OPERATIONS Section 4) |
| Bulk unit import (CSV/Excel), auto-generation, manual entry | Demo environment provisioning (see BUSINESS-OPERATIONS Section 1)      |
| Amenity space setup with templates                          | White-label mobile app configuration (Enterprise tier)                 |
| Event type configuration with defaults                      | Detailed shift scheduling (see 16-Settings-Admin)                      |
| Staff invitation and role assignment                        | Equipment and inspection setup (v2 feature)                            |
| Resident import and invite links                            | Vendor compliance onboarding (v2 feature)                              |
| Branding, vanity URL, welcome email customization           | Custom field schema design (configured post-wizard in Settings)        |
| Go-live activation with summary review                      | Lobby display / digital signage configuration                          |

---

## 2. Research Summary

### SaaS Onboarding Best Practices

Industry research across property management platforms and broader SaaS onboarding patterns revealed these principles.

| #   | Principle                               | Source                                                                                               | Concierge Application                                                                                      |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | **Time-to-value under 30 minutes**      | SaaS industry benchmark; competitive analysis shows 2-5 day setup is the norm in property management | 8-step wizard with auto-save, templates, and bulk import to hit 30-minute target                           |
| 2   | **Progress visibility**                 | Users abandon multi-step flows when they cannot see how far they are or how much remains             | Persistent progress bar with step names, completion percentage, and step count (e.g., "Step 3 of 8")       |
| 3   | **Skip and return**                     | Not every admin has all information on day one; forcing completion causes abandonment                | Every step except Step 1 (Property Details) can be skipped and completed later                             |
| 4   | **Auto-save on every interaction**      | Session loss (browser crash, timeout, accidental close) must never lose work                         | Each step auto-saves to server on field blur and on step completion; wizard resumes from last saved state  |
| 5   | **Sensible defaults with templates**    | Admins should not start from a blank slate; pre-filled templates reduce decisions                    | Amenity templates ("Standard Condo"), event type defaults (10 common types), notification preset bundles   |
| 6   | **Contextual help on every field**      | Non-technical users (condo board members, building managers) need inline guidance                    | Tooltip icons on every field with plain-language explanations; no jargon                                   |
| 7   | **Bulk import with validation preview** | Properties with 200+ units cannot enter data one row at a time                                       | CSV/Excel import with template download, column mapping, and row-level validation report before committing |
| 8   | **Celebratory activation moment**       | The go-live moment should feel like an achievement, not a checkbox                                   | Confetti animation, summary dashboard, and congratulations message on activation                           |

### Pitfalls Avoided

1. **No mandatory onboarding calls** — the wizard is entirely self-service. Support chat is available but never required.
2. **No all-or-nothing activation** — properties can go live with partial setup (e.g., units configured but no residents imported yet) and complete remaining steps post-launch.
3. **No data re-entry** — information entered in one step (e.g., property logo in Step 1) carries forward and does not need to be re-entered in Step 7 (Branding).
4. **No hidden steps** — all 8 steps are visible in the progress bar from the start. No surprise "one more thing" screens.
5. **No silent CSV failures** — every import produces a validation report showing exactly which rows passed and which failed, with actionable error messages.

---

## 3. Wizard Architecture

### 3.1 Flow Structure

The wizard is a **linear 8-step flow** with the following navigation rules:

| Rule                    | Behavior                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Forward navigation**  | Click "Next" or "Save & Continue" to advance. Step validation runs before proceeding.                                                               |
| **Backward navigation** | Click "Back" or click any completed/current step in the progress bar to return. No data is lost.                                                    |
| **Skip**                | Click "Skip for Now" to advance without completing the current step. Step 1 (Property Details) cannot be skipped — it is the minimum required data. |
| **Step clicking**       | Users can click any step at or before the current step in the progress bar. Future steps beyond current + 1 are not clickable.                      |
| **Resume**              | If the user leaves mid-wizard (closes browser, logs out, navigates away), they return to the last saved step on next login.                         |
| **Auto-save**           | Every field change triggers a debounced auto-save (500ms delay) to the server. The "Last saved" timestamp displays in the wizard footer.            |

### 3.2 Progress Bar

The progress bar is a horizontal stepper fixed at the top of the wizard container.

```
[ 1. Property ] ── [ 2. Units ] ── [ 3. Amenities ] ── [ 4. Events ] ── [ 5. Staff ] ── [ 6. Residents ] ── [ 7. Branding ] ── [ 8. Go Live ]
     ✓ Done         ● Current        ○ Upcoming        ○ Upcoming       ○ Upcoming      ○ Upcoming         ○ Upcoming        ○ Upcoming
```

**Visual states per step**:

| State         | Icon             | Color                         | Clickable |
| ------------- | ---------------- | ----------------------------- | --------- |
| **Completed** | Checkmark circle | `--color-success-500` (green) | Yes       |
| **Current**   | Filled circle    | `--color-primary-500` (blue)  | Yes       |
| **Skipped**   | Dashed circle    | `--color-warning-500` (amber) | Yes       |
| **Upcoming**  | Empty circle     | `--color-neutral-300` (gray)  | No        |

**Step completion percentage** displays below the progress bar: "Setup Progress: 37% complete (3 of 8 steps)"

### 3.3 Wizard Container Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Progress Bar: [ 1 ✓ ]──[ 2 ● ]──[ 3 ○ ]──[ 4 ○ ]──...──[ 8 ○ ] │
│  Setup Progress: 12% complete (1 of 8 steps)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step Title                                                         │
│  Step description text explaining what this step does               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Step Content Area                                          │   │
│  │  (forms, import tools, configuration panels)                │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  [ Back ]                    Last saved: 2 seconds ago   [ Next → ]│
│                                          [ Skip for Now ]          │
└─────────────────────────────────────────────────────────────────────┘
```

- Maximum content width: 800px, centered horizontally.
- White background. No sidebar during wizard — full-width layout.
- Footer is sticky at the bottom of the viewport.
- "Back" button is hidden on Step 1. "Skip for Now" is hidden on Steps 1 and 8.

### 3.4 Persistence Model

All wizard progress is stored server-side in the `OnboardingProgress` model (see Section 7). The wizard never relies on browser-local storage as the sole persistence layer. Local storage may be used as a write-ahead cache for offline resilience, but the server is the source of truth.

---

## 4. Step-by-Step Specification

### 4.1 Step 1: Property Details

**Purpose**: Capture the foundational information about the property. This step cannot be skipped because every subsequent step depends on property identity.

**Step header**: "Tell us about your property"
**Step description**: "Enter the basic details of your building. This information appears on your login page, email communications, and resident portal."

#### Fields

| Field                   | Type                                        | Required    | Validation                                                                  | Tooltip                                                                                                                    |
| ----------------------- | ------------------------------------------- | ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Property Name**       | Text input                                  | Yes         | 2-100 characters; no special characters except `&`, `-`, `'`                | "The official name of your building as residents know it (e.g., Maple Heights Condominiums)"                               |
| **Street Address**      | Address autocomplete                        | Yes         | Google Places API autocomplete; must resolve to a valid postal address      | "Start typing and select from the dropdown. This sets your property's location on maps and in emergency services records." |
| **City**                | Text (auto-filled from address)             | Yes         | Auto-populated from address selection                                       | —                                                                                                                          |
| **Province / State**    | Dropdown (auto-filled from address)         | Yes         | Auto-populated from address selection                                       | —                                                                                                                          |
| **Postal / ZIP Code**   | Text (auto-filled from address)             | Yes         | Auto-populated; validated against regional format                           | —                                                                                                                          |
| **Country**             | Dropdown (auto-filled from address)         | Yes         | Auto-populated; defaults to Canada                                          | —                                                                                                                          |
| **Property Type**       | Dropdown                                    | Yes         | Options: Condominium, Apartment, Co-operative, Townhouse Complex, Mixed-Use | "Select the type that best describes your property. This affects default terminology (e.g., 'unit' vs 'suite')."           |
| **Number of Buildings** | Numeric stepper                             | Yes         | 1-50; integer only                                                          | "How many separate buildings or towers does this property have? Single-building properties enter 1."                       |
| **Building Names**      | Repeating text fields (one per building)    | Conditional | Required if buildings > 1; 1-50 characters each                             | "Give each building a name or label (e.g., 'North Tower', 'Building A'). Residents will see these names."                  |
| **Floors per Building** | Repeating numeric fields (one per building) | Yes         | 1-200 per building; integer only                                            | "Total number of floors including ground, basement, and penthouse levels."                                                 |
| **Total Unit Count**    | Numeric input                               | Yes         | 1-10,000; integer only                                                      | "The total number of residential and commercial units across all buildings. You will set up individual units in Step 2."   |
| **Property Logo**       | File upload                                 | No          | PNG, JPG, or SVG; max 2 MB; min 200x200px; max 2000x2000px                  | "Your property logo appears on the login page, email headers, and resident portal. Square logos work best."                |
| **Timezone**            | Dropdown (auto-detected)                    | Yes         | Auto-detected from browser; selectable from IANA timezone list              | "All timestamps, booking calendars, and shift schedules use this timezone. Auto-detected from your browser."               |
| **Property Phone**      | Phone input                                 | Yes         | E.164 format with country code; validated with libphonenumber               | "The main phone number for your property's front desk or management office."                                               |
| **Property Email**      | Email input                                 | Yes         | Valid email format; confirmed via format check (not verification email)     | "The primary contact email for your property. Residents see this in the portal footer."                                    |
| **Property Website**    | URL input                                   | No          | Valid URL format if provided; auto-prepends `https://` if missing           | "Your property's external website, if one exists. Not required."                                                           |

#### Auto-Detection Behavior

- **Timezone**: On page load, the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` is read and pre-selected. The admin can override by selecting a different timezone from the dropdown.
- **Country**: Defaults to Canada. If the address autocomplete resolves to a different country, the country field updates automatically.
- **Building Names**: When "Number of Buildings" changes, the Building Names section dynamically adds or removes input fields. If reduced, a confirmation dialog warns that removing a building name may affect units assigned to it (if any exist from a resumed session).

#### Validation Rules

- All required fields must be filled before proceeding to Step 2.
- Property Name must be unique within the Concierge platform (checked via debounced API call on blur).
- Logo upload: file type is checked on the client; dimensions are validated on the server after upload. If validation fails, the upload is rejected with a clear error: "Logo must be a PNG, JPG, or SVG file under 2 MB, at least 200x200 pixels."
- All compliance consent checkboxes (see below) must be checked before proceeding.

#### Compliance Consent Capture (Required -- PIPEDA, GDPR, ISO 27701)

At the bottom of Step 1, after all property fields, a "Legal Agreements" section displays the following checkboxes. This section satisfies PIPEDA Principle 3 (Consent), GDPR Articles 6-7 (Lawfulness and Consent), and ISO 27701 Clause 7.2.3 (Determining Consent Requirements). See `docs/tech/COMPLIANCE-MATRIX.md` gap C2.

**Each consent must be a separate checkbox. Consents must NOT be bundled into a single "I agree to everything" checkbox.** This is a GDPR requirement (freely given, specific, informed, unambiguous).

| #   | Consent Type              | Checkbox Label                                                                                              | Required            | Link                                          |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------- |
| 1   | `terms_of_service`        | "I agree to the [Terms of Service]"                                                                         | Yes (blocks Step 2) | Opens `/terms` in a new tab                   |
| 2   | `privacy_policy`          | "I have read and agree to the [Privacy Policy]"                                                             | Yes (blocks Step 2) | Opens `/privacy` in a new tab                 |
| 3   | `data_processing_general` | "I consent to Concierge processing my property's data as described in the Privacy Policy"                   | Yes (blocks Step 2) | Opens `/privacy#data-processing` in a new tab |
| 4   | `data_sharing_management` | "I consent to sharing property data with my management company for building administration"                 | Yes (blocks Step 2) | Opens `/privacy#data-sharing` in a new tab    |
| 5   | `data_sharing_vendors`    | "I consent to sharing relevant data with approved third-party vendors for maintenance and service delivery" | No (opt-in)         | Opens `/privacy#vendors` in a new tab         |

**Consent Record Storage**: When the admin checks each box and clicks "Continue", a `ConsentRecord` is created for each consent with: `user_id`, `property_id`, `consent_type`, `status: granted`, `granted_at: now()`, `consent_version` (current policy version), `policy_document_url`, `collection_method: onboarding_wizard`, `ip_address`, `user_agent`. See `docs/tech/COMPLIANCE-MATRIX.md` Section 10.2 for the full schema.

**Validation**: If any required consent is unchecked when "Continue" is clicked, the unchecked items are highlighted in red with the message: "You must agree to this to continue." The page scrolls to the first unchecked required consent.

---

### 4.2 Step 2: Unit Setup

**Purpose**: Create every unit in the property. This is the heaviest data-entry step and offers three modes to minimize effort.

**Step header**: "Set up your units"
**Step description**: "Create all residential and commercial units. You can import from a spreadsheet, auto-generate based on your floor plan, or add them one at a time."

#### Input Modes

The admin selects one of three tabs at the top of the step content area:

**Tab A: Import from CSV/Excel**

| Element                    | Description                                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Template download**      | Link: "Download CSV template" and "Download Excel template". Templates include column headers and 3 example rows.                                                                                                                                 |
| **File upload**            | Drag-and-drop zone or click-to-browse. Accepts `.csv`, `.xlsx`, `.xls`. Max file size: 10 MB.                                                                                                                                                     |
| **Column mapping preview** | After upload, shows a table mapping detected columns to expected fields. Admin can reassign columns using dropdowns.                                                                                                                              |
| **Validation report**      | Before committing, displays: total rows detected, valid rows (green count), invalid rows (red count with expandable error list). Each error shows row number, field name, and reason (e.g., "Row 45: Unit Number '301' is duplicated in row 12"). |
| **Import button**          | "Import {N} Valid Units" — only enabled when at least 1 valid row exists. Invalid rows are skipped, not imported.                                                                                                                                 |

**Tab B: Auto-Generate**

| Element                 | Description                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Building selector**   | Dropdown listing buildings from Step 1. If single building, this is pre-selected and non-editable.                                                |
| **Floor range**         | For each building: "Floor {X}: Units from {start} to {end}" with numeric inputs for start and end unit numbers.                                   |
| **Unit type per floor** | Dropdown per floor row: Studio, 1 Bedroom, 2 Bedroom, 3 Bedroom, Penthouse, Commercial, Other.                                                    |
| **Preview**             | Live preview showing all units that will be generated: "This will create 120 units across 6 floors in North Tower."                               |
| **Generate button**     | "Generate {N} Units" — creates all units and shows them in an editable table below. Admin can rename or delete individual units after generation. |

**Tab C: Manual Entry**

| Element           | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Add Unit form** | Inline form at the top of the step with all unit fields. "Add Unit" button appends to the list below. |
| **Unit list**     | Scrollable table showing all added units with inline edit and delete actions.                         |

#### Fields per Unit

| Field              | Type            | Required                | Validation                                                                     | Tooltip                                                                                    |
| ------------------ | --------------- | ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Unit Number**    | Text            | Yes                     | 1-20 characters; alphanumeric plus `-` and `/`; unique within the property     | "The unit identifier as it appears on the door (e.g., '101', 'PH-A', '3/205')."            |
| **Floor**          | Numeric or text | Yes                     | Must correspond to a valid floor in the assigned building                      | "The floor this unit is on. Use numbers or labels like 'G' for ground, 'B1' for basement." |
| **Building**       | Dropdown        | Yes (if multi-building) | Must match a building name from Step 1                                         | "Which building or tower is this unit in?"                                                 |
| **Unit Type**      | Dropdown        | Yes                     | Options: Studio, 1 Bedroom, 2 Bedroom, 3 Bedroom, Penthouse, Commercial, Other | "The layout type of this unit."                                                            |
| **Square Footage** | Numeric         | No                      | 100-99,999 if provided; integer only                                           | "The unit's interior square footage, if known. Used for reporting only."                   |

#### Step Completion

This step is marked complete when at least 1 unit exists. The summary shows: "{N} units created across {M} buildings."

---

### 4.3 Step 3: Amenity Spaces

**Purpose**: Configure the shared spaces residents can book.

**Step header**: "Set up your amenity spaces"
**Step description**: "Add the shared spaces in your building that residents can reserve. Start with our template or build your own list."

#### Template System

On first visit, a template selector appears:

| Template                         | Pre-fills                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Standard Condo** (recommended) | Party Room, Gym, Pool, BBQ Area, Guest Suite, Theatre Room                                                  |
| **Small Building**               | Party Room, Gym, Rooftop Terrace                                                                            |
| **Luxury Building**              | Party Room, Gym, Pool, BBQ Area, Guest Suite, Theatre Room, Spa, Wine Cellar, Co-Working Space, Yoga Studio |
| **Start from Scratch**           | Empty — add amenities manually                                                                              |

After a template is selected, all pre-filled amenities appear in an editable card grid. The admin can add, remove, and customize any amenity.

#### Fields per Amenity

| Field                     | Type                    | Required    | Validation                                               | Tooltip                                                                                                      |
| ------------------------- | ----------------------- | ----------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Name**                  | Text                    | Yes         | 2-100 characters; unique within the property             | "The name residents see when browsing amenities (e.g., 'Rooftop Party Room')."                               |
| **Description**           | Textarea                | No          | Max 500 characters                                       | "A brief description of the space and what it includes (e.g., 'Seats 40 with full kitchen and A/V system')." |
| **Capacity**              | Numeric                 | Yes         | 1-1,000; integer                                         | "Maximum number of people allowed in this space at one time."                                                |
| **Operating Hours**       | Time range picker       | Yes         | Start time must be before end time; 15-minute increments | "The hours during which this amenity is available for booking."                                              |
| **Advance Booking Limit** | Numeric + unit selector | Yes         | 1-365 days                                               | "How far in advance can residents book? (e.g., '30 days' means residents can book up to 30 days ahead)."     |
| **Maximum Duration**      | Numeric + unit selector | Yes         | 1-24 hours or "Full Day"                                 | "The longest a single booking can last."                                                                     |
| **Cancellation Window**   | Numeric + unit selector | Yes         | 0-168 hours (0 = no cancellations)                       | "How many hours before the booking start time can a resident cancel without penalty?"                        |
| **Pricing Model**         | Dropdown                | Yes         | Options: Free, Per Hour, Per Booking (flat fee)          | "How residents are charged for using this space."                                                            |
| **Price**                 | Currency input          | Conditional | Required if pricing model is not "Free"; 0.01-99,999.99  | "The cost per hour or per booking, depending on the pricing model selected."                                 |
| **Photo**                 | File upload             | No          | PNG, JPG; max 5 MB; min 400x300px                        | "A photo of the amenity. Shown to residents on the booking page."                                            |

#### Step Completion

This step can be skipped (amenities can be added post-launch). Marked complete when at least 1 amenity is saved. Summary: "{N} amenities configured."

---

### 4.4 Step 4: Event Types

**Purpose**: Configure the categories of events that staff will log in the Security Console.

**Step header**: "Configure your event types"
**Step description**: "Event types define the categories of entries your staff logs — packages, visitors, incidents, and more. We have recommended a set of defaults. Add, remove, or customize them to match your building's needs."

#### Default Event Types

The following 10 types are pre-filled on first visit:

| Default Type           | Icon (Lucide)    | Color                               | Default Notification                          | Auto-Close                                |
| ---------------------- | ---------------- | ----------------------------------- | --------------------------------------------- | ----------------------------------------- |
| **Package**            | `package`        | `--color-info-500` (blue)           | Notify resident via email + push              | After resident pickup (manual close)      |
| **Visitor**            | `user-check`     | `--color-success-500` (green)       | Notify unit resident via push                 | After sign-out or 12 hours (configurable) |
| **Incident**           | `alert-triangle` | `--color-danger-500` (red)          | Notify Property Manager + Security Supervisor | Never (manual close required)             |
| **Key / FOB Checkout** | `key`            | `--color-warning-500` (amber)       | Notify unit resident via email                | After return (manual close)               |
| **Cleaning**           | `sparkles`       | `--color-neutral-500` (gray)        | No notification                               | On completion (manual close)              |
| **General Note**       | `file-text`      | `--color-neutral-400` (light gray)  | No notification                               | Immediate (auto-close on create)          |
| **Delivery**           | `truck`          | `--color-info-400` (light blue)     | Notify unit resident via push                 | After 24 hours if not closed              |
| **Move-In**            | `home`           | `--color-success-400` (light green) | Notify Property Manager                       | After 7 days                              |
| **Move-Out**           | `log-out`        | `--color-warning-400` (light amber) | Notify Property Manager                       | After 7 days                              |
| **Parking Violation**  | `car`            | `--color-danger-400` (light red)    | Notify Property Manager                       | Never (manual close required)             |

#### Fields per Event Type

| Field                       | Type                         | Required    | Validation                                                                            | Tooltip                                                                                                                    |
| --------------------------- | ---------------------------- | ----------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Name**                    | Text                         | Yes         | 2-50 characters; unique within the property                                           | "The label staff see when creating a new event (e.g., 'Package Received')."                                                |
| **Icon**                    | Icon picker (Lucide library) | Yes         | Must select one icon from the Lucide icon set                                         | "The icon shown on event cards in the Security Console."                                                                   |
| **Color**                   | Color picker                 | Yes         | Must select from the 12 predefined event palette colors; no arbitrary hex             | "The card background color in the event stream. Choose a color that makes this type visually distinct."                    |
| **Notification Recipients** | Multi-select                 | No          | Options: Unit Resident, Property Manager, Security Supervisor, Assigned Staff, Nobody | "Who should be notified when an event of this type is created?"                                                            |
| **Notification Channels**   | Multi-checkbox               | Conditional | Required if any recipients are selected; options: Email, Push, SMS                    | "How should recipients be notified?"                                                                                       |
| **Auto-Close Rule**         | Dropdown + Numeric           | No          | Options: Never (manual), After N hours, After N days, On completion                   | "Should events of this type automatically close after a certain time? Set to 'Never' if staff should manually close them." |

#### Custom Type Creation

Below the defaults list, a "+ Add Custom Event Type" button opens an inline form with the same fields. Custom types are visually marked with a "Custom" badge.

#### Step Completion

This step can be skipped but is recommended. Marked complete when at least 1 event type exists. Summary: "{N} event types configured ({M} default, {K} custom)."

---

### 4.5 Step 5: Staff Setup

**Purpose**: Invite the team members who will use Concierge daily.

**Step header**: "Invite your team"
**Step description**: "Add the staff members who will operate Concierge — concierges, security guards, property managers, and maintenance staff. They will receive an email invitation to create their account."

#### Invitation Interface

| Element                | Description                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single invite form** | Email address field + Role dropdown + "Add" button. Adds to the invite list below.                                                                                                                               |
| **Batch invite**       | "Invite Multiple" link opens a textarea where admin can paste multiple email addresses (one per line or comma-separated). All pasted emails receive the same role (selected from a dropdown above the textarea). |
| **Invite list**        | Table showing all pending invitations: Email, Role, Status (Pending / Sent / Accepted), Actions (Remove).                                                                                                        |
| **Invitation preview** | "Preview Invitation Email" link opens a modal showing exactly what the invited staff member will receive.                                                                                                        |

#### Role Options

| Role                       | Description shown in wizard                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **Front Desk / Concierge** | "Manages packages, visitors, and the event log. Primary front-desk operator."              |
| **Security Guard**         | "Logs incidents, manages visitor access, handles key checkouts, and writes shift notes."   |
| **Security Supervisor**    | "All security guard capabilities plus analytics, escalation review, and guard management." |
| **Property Manager**       | "Full operational access including maintenance, vendor management, and reporting."         |
| **Maintenance Staff**      | "Receives and completes maintenance work orders."                                          |

#### Optional: Shift Schedule

Below the invite list, a collapsible section labeled "Set Default Shifts (Optional)" allows the admin to define shift patterns:

| Field          | Type           | Required                                        | Validation                                           |
| -------------- | -------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **Shift Name** | Text           | No                                              | 2-50 characters                                      |
| **Start Time** | Time picker    | Conditional (required if shift name is entered) | 15-minute increments                                 |
| **End Time**   | Time picker    | Conditional                                     | Must be after start time (or next day for overnight) |
| **Days**       | Multi-checkbox | Conditional                                     | At least 1 day selected                              |

This section is explicitly marked "You can set this up later in Settings" to reduce pressure.

#### Step Completion

This step can be skipped. Marked complete when at least 1 staff invitation is added. Summary: "{N} staff invitations ({role counts})."

---

### 4.6 Step 6: Resident Import

**Purpose**: Import or invite the people who live in the building.

**Step header**: "Add your residents"
**Step description**: "Import your current residents, or generate invite links so residents can register themselves. You can also add residents one at a time."

#### Input Modes

Three tabs, identical pattern to Step 2 (Unit Setup):

**Tab A: Import from CSV**

| Element               | Description                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Template download** | Link: "Download Resident CSV Template" with headers and 3 example rows.                                                                                                                                         |
| **File upload**       | Drag-and-drop zone. Accepts `.csv`, `.xlsx`, `.xls`. Max 10 MB.                                                                                                                                                 |
| **Column mapping**    | Detected columns mapped to expected fields with reassignment dropdowns.                                                                                                                                         |
| **Validation report** | Total rows, valid count (green), invalid count (red with expandable errors). Errors include: "Row 12: Email 'john@example' is not a valid email address", "Row 33: Unit '999' does not exist in this property." |
| **Import button**     | "Import {N} Valid Residents" — skips invalid rows.                                                                                                                                                              |

**Tab B: Manual Entry**

| Element               | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **Add Resident form** | Inline form with all resident fields + "Add Resident" button. |
| **Resident list**     | Scrollable table with inline edit and delete.                 |

**Tab C: Invite Links**

| Element                    | Description                                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generate links**         | "Generate Invite Links" button creates a unique self-registration URL for each unit that has no resident assigned.                                               |
| **Link list**              | Table: Unit Number, Invite URL, Status (Not Sent / Sent / Registered), Copy button, Send Email button.                                                           |
| **Bulk send**              | "Send All Invite Links" button emails the invite URL to unit email addresses (if known) or generates a printable sheet of QR codes for lobby posting.            |
| **Self-registration flow** | When a resident visits their invite link, they see a registration form pre-filled with their unit number. They enter: name, email, phone, and create a password. |

#### Fields per Resident (CSV and Manual)

| Field             | Type            | Required | Validation                                                     | Tooltip                                                                                                  |
| ----------------- | --------------- | -------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **First Name**    | Text            | Yes      | 1-100 characters                                               | "Resident's first name as they would like to be addressed."                                              |
| **Last Name**     | Text            | Yes      | 1-100 characters                                               | "Resident's family name."                                                                                |
| **Email**         | Email           | Yes      | Valid email format; unique within the property                 | "The resident's email address. Used for login and notifications."                                        |
| **Unit Number**   | Text / Dropdown | Yes      | Must match an existing unit in this property                   | "The unit this resident lives in. Must be a unit created in Step 2."                                     |
| **Phone**         | Phone           | No       | E.164 format if provided                                       | "Mobile phone number for SMS notifications (optional)."                                                  |
| **Move-In Date**  | Date picker     | No       | Cannot be more than 1 year in the past or 1 year in the future | "When this resident moved in or is scheduled to move in. Future dates create a pending resident record." |
| **Resident Type** | Dropdown        | Yes      | Options: Owner, Tenant                                         | "Is this person the unit owner or a tenant?"                                                             |

#### Welcome Email Customization

Below the import interface, a collapsible section shows the welcome email template:

- **Subject line**: Editable text field. Default: "Welcome to {Property Name} on Concierge"
- **Body preview**: Rich-text preview showing the email the resident will receive. Includes: property name, property logo (from Step 1), login URL, and a "Set Up Your Account" button.
- **Customizable sections**: The admin can edit the greeting text and add a custom message paragraph. The system sections (login link, account setup instructions) are not editable.

#### Step Completion

This step can be skipped (residents can be imported post-launch). Marked complete when at least 1 resident exists or at least 1 invite link has been generated. Summary: "{N} residents imported, {M} invite links generated."

---

### 4.7 Step 7: Branding & Communication

**Purpose**: Customize the look and feel of the property's Concierge portal.

**Step header**: "Make it yours"
**Step description**: "Customize the appearance of your Concierge portal with your property's branding. Residents and staff will see these customizations on the login page, in the portal, and in all email communications."

#### Fields

| Field                                | Type                        | Required | Validation                                                                                                                 | Tooltip                                                                                                                        |
| ------------------------------------ | --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Property Logo**                    | File upload / Preview       | No       | Same rules as Step 1; if already uploaded in Step 1, shows current logo with "Change" option                               | "Your logo appears on the login page, sidebar, email headers, and mobile app. Already uploaded? You can change it here."       |
| **Primary Brand Color**              | Color picker with hex input | Yes      | Must pass WCAG 2.2 AA contrast ratio (4.5:1) against white background; picker shows pass/fail indicator                    | "This color is used for buttons, links, and active elements throughout the portal. Choose a color that represents your brand." |
| **Vanity URL Slug**                  | Text input with prefix      | No       | 3-50 characters; lowercase alphanumeric plus hyphens; no leading/trailing hyphens; uniqueness check via debounced API call | "Your property's custom login URL: concierge.app/{your-slug}. Residents type this to reach your login page."                   |
| **Vanity URL Availability**          | Inline status               | —        | Shows "Available" (green check) or "Taken" (red X) after the uniqueness check completes                                    | —                                                                                                                              |
| **Welcome Email Subject**            | Text input                  | Yes      | 5-200 characters                                                                                                           | "The subject line of the welcome email sent to new staff and residents."                                                       |
| **Welcome Email Custom Message**     | Textarea                    | No       | Max 1,000 characters                                                                                                       | "Add a personal message to the welcome email (e.g., greet new residents, share building rules)."                               |
| **Default Notification Preferences** | Radio group                 | Yes      | Options: Email Only, Email + Push, All Channels (Email + Push + SMS)                                                       | "The default notification setting for all new users. Individual users can change their preferences later."                     |

#### Live Preview

The right side of the step (on desktop) shows a live preview panel that updates in real-time as the admin makes changes:

| Preview Tab       | What It Shows                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **Login Page**    | Property logo, property name, brand color on the "Sign In" button, vanity URL in the browser bar mockup |
| **Welcome Email** | Full email preview with logo, custom message, and branded button                                        |
| **Portal Header** | Sidebar logo, brand-colored active states, property name                                                |

On viewports narrower than 1200px, the preview collapses into a "Preview" button that opens a modal.

#### Step Completion

This step can be skipped (defaults are applied: Concierge blue, no vanity URL, standard welcome email). Marked complete when the primary brand color is selected and confirmed. Summary: "Branding configured — {color swatch} {vanity URL or 'default URL'}."

---

### 4.8 Step 8: Go Live

**Purpose**: Review everything configured, activate the property, and optionally send welcome emails.

**Step header**: "Review and go live"
**Step description**: "Review your setup, then activate your property. Once activated, staff and residents can log in and start using Concierge."

#### Completion Checklist

A summary dashboard showing each wizard step and its result:

| Step                | Status                 | Detail                                                                                                  |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| 1. Property Details | Completed / Incomplete | "{Property Name}, {address}, {unit count} units"                                                        |
| 2. Unit Setup       | Completed / Skipped    | "{N} units across {M} buildings" or "No units created — add them later in Unit Management"              |
| 3. Amenity Spaces   | Completed / Skipped    | "{N} amenities configured" or "No amenities — add them later in Amenity Booking"                        |
| 4. Event Types      | Completed / Skipped    | "{N} event types ({M} default, {K} custom)" or "Using 10 default event types"                           |
| 5. Staff Setup      | Completed / Skipped    | "{N} staff invitations ({role breakdown})" or "No staff invited — invite them later in User Management" |
| 6. Residents        | Completed / Skipped    | "{N} residents imported, {M} invite links" or "No residents — import them later"                        |
| 7. Branding         | Completed / Skipped    | Color swatch + vanity URL display or "Using default Concierge branding"                                 |

Incomplete steps show a "Complete this step" link that navigates back to that step.

#### Activation Controls

| Element                        | Description                                                                                                                                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Send Welcome Emails toggle** | Default: ON. When on, activation sends invitation emails to all imported staff and residents. Toggle label: "Send welcome emails to {N} staff and {M} residents on activation." If no staff or residents exist, this toggle is disabled with text: "No staff or residents to notify." |
| **Activate Property button**   | Large primary button: "Activate Property". Disabled until Step 1 is complete (minimum requirement). If Step 1 is complete but other steps are skipped, the button is enabled with a note: "You can complete the remaining steps after activation."                                    |
| **Confirmation dialog**        | On click, a modal confirms: "Activate {Property Name}? This will make your property live on Concierge. Staff and residents will be able to log in." with "Activate" (primary) and "Go Back" (secondary) buttons.                                                                      |

#### Post-Activation

- Confetti animation plays for 3 seconds across the viewport.
- The wizard screen transitions to a congratulations view:
  - Heading: "Welcome to Concierge!"
  - Subheading: "{Property Name} is now live."
  - Three action cards:
    1. "Go to Dashboard" — navigates to the Property Admin dashboard.
    2. "Complete Remaining Setup" — navigates to Settings where skipped steps can be completed.
    3. "Invite More Team Members" — navigates to User Management.
- The wizard is now complete and cannot be re-entered. All skipped steps become configurable through the normal Settings and module interfaces.

#### Billing Handoff

Activation creates a Subscription record in **TRIAL** status with a 14-day free trial period. All Professional tier features are available during the trial -- there are no feature gates or limitations. No credit card is required to activate; billing setup happens in Settings > Billing (PRD 24). A trial countdown banner appears in the header from day 10 onward, prompting the Admin to select a plan and enter payment details before the trial expires.

---

## 5. CSV Templates

### 5.1 Unit Import Template

**Filename**: `concierge-unit-import-template.csv`

#### Column Specification

| Column | Header Text      | Required                                 | Format                                                                                      | Example       |
| ------ | ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------- |
| A      | `unit_number`    | Yes                                      | Text, 1-20 characters                                                                       | `101`         |
| B      | `floor`          | Yes                                      | Text or number                                                                              | `1`           |
| C      | `building`       | Conditional (required if multi-building) | Text, must match a building name from Step 1                                                | `North Tower` |
| D      | `unit_type`      | Yes                                      | One of: `Studio`, `1 Bedroom`, `2 Bedroom`, `3 Bedroom`, `Penthouse`, `Commercial`, `Other` | `2 Bedroom`   |
| E      | `square_footage` | No                                       | Integer, 100-99999                                                                          | `850`         |

#### Example Rows

```csv
unit_number,floor,building,unit_type,square_footage
101,1,North Tower,1 Bedroom,650
102,1,North Tower,Studio,450
201,2,North Tower,2 Bedroom,900
PH-A,20,North Tower,Penthouse,2200
B1-01,B1,North Tower,Commercial,1500
```

### 5.2 Resident Import Template

**Filename**: `concierge-resident-import-template.csv`

#### Column Specification

| Column | Header Text     | Required | Format                                  | Example                  |
| ------ | --------------- | -------- | --------------------------------------- | ------------------------ |
| A      | `first_name`    | Yes      | Text, 1-100 characters                  | `Maria`                  |
| B      | `last_name`     | Yes      | Text, 1-100 characters                  | `Santos`                 |
| C      | `email`         | Yes      | Valid email, unique                     | `maria.santos@email.com` |
| D      | `unit_number`   | Yes      | Must match existing unit                | `101`                    |
| E      | `phone`         | No       | E.164 format or 10-digit North American | `+14165551234`           |
| F      | `move_in_date`  | No       | ISO 8601 (`YYYY-MM-DD`)                 | `2025-06-15`             |
| G      | `resident_type` | Yes      | One of: `Owner`, `Tenant`               | `Owner`                  |

#### Example Rows

```csv
first_name,last_name,email,unit_number,phone,move_in_date,resident_type
Maria,Santos,maria.santos@email.com,101,+14165551234,2025-06-15,Owner
James,Chen,james.chen@email.com,102,,2025-09-01,Tenant
Aisha,Patel,aisha.patel@email.com,201,+14165559876,2024-03-10,Owner
```

### 5.3 Import Error Handling

When a CSV is uploaded, the system processes it in three phases:

**Phase 1: File Validation**

- File type check (`.csv`, `.xlsx`, `.xls` only)
- File size check (max 10 MB)
- Encoding detection (UTF-8, UTF-16, Windows-1252 supported; others rejected with "Unsupported encoding" error)
- Header row detection and column matching

**Phase 2: Row-Level Validation**

- Each row is validated independently against the column specification
- Errors are collected per row, not per file — one bad row does not block others
- Error format: `Row {N}: {Field} — {Error message}`

**Phase 3: Cross-Row Validation**

- Duplicate detection within the file (e.g., two rows with the same unit number)
- Duplicate detection against existing data (e.g., unit number already exists in the property)
- Referential integrity (e.g., resident's unit_number must match an existing unit)

#### Validation Report UI

```
┌──────────────────────────────────────────────────────────────┐
│  Import Results                                              │
│                                                              │
│  ✓  142 rows ready to import                                 │
│  ✗  8 rows have errors (expand to see details)               │
│                                                              │
│  ▼ Errors (8)                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Row 15: unit_number — "301" is duplicated in row 42     ││
│  │ Row 23: email — "not-an-email" is not a valid address   ││
│  │ Row 45: unit_number — "999" does not exist              ││
│  │ Row 67: resident_type — "Renter" is invalid; use        ││
│  │         "Owner" or "Tenant"                              ││
│  │ Row 89: first_name — cannot be empty                     ││
│  │ ...                                                      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [ Download Error Report ]     [ Import 142 Valid Rows → ]   │
└──────────────────────────────────────────────────────────────┘
```

The "Download Error Report" button exports a CSV containing only the failed rows with an additional `error` column describing what went wrong. The admin can fix these rows in their spreadsheet and re-import.

---

## 6. API Endpoints

### 6.1 Endpoint Specification

All endpoints require authentication. Only users with the `super_admin` or `property_admin` role can access onboarding endpoints.

| Method  | Path                                                  | Purpose                                                    | Request Body                                                                    | Response                                                                                    |
| ------- | ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `POST`  | `/api/admin/onboarding/property`                      | Create a new property and initialize the onboarding wizard | `{ name, address, type, buildings, floors, unitCount, timezone, phone, email }` | `201 Created` — `{ propertyId, onboardingId, currentStep: 1 }`                              |
| `GET`   | `/api/admin/onboarding/property/:id`                  | Get full onboarding state for a property                   | —                                                                               | `200 OK` — `{ propertyId, currentStep, completedSteps[], skippedSteps[], stepData: {...} }` |
| `PATCH` | `/api/admin/onboarding/property/:id/step/:step`       | Save progress on a specific step                           | Step-specific field data (see Section 4)                                        | `200 OK` — `{ step, status: "saved", savedAt }`                                             |
| `POST`  | `/api/admin/onboarding/property/:id/import/units`     | Upload and import unit CSV/Excel                           | `multipart/form-data` with file                                                 | `202 Accepted` — `{ importId, status: "processing" }` (async for large files)               |
| `GET`   | `/api/admin/onboarding/property/:id/import/:importId` | Poll import job status                                     | —                                                                               | `200 OK` — `{ importId, status, totalRows, validRows, invalidRows, errors[] }`              |
| `POST`  | `/api/admin/onboarding/property/:id/import/residents` | Upload and import resident CSV/Excel                       | `multipart/form-data` with file                                                 | `202 Accepted` — `{ importId, status: "processing" }`                                       |
| `POST`  | `/api/admin/onboarding/property/:id/generate-units`   | Auto-generate units from floor patterns                    | `{ buildings: [{ name, floors: [{ floor, startUnit, endUnit, unitType }] }] }`  | `200 OK` — `{ unitsCreated, units[] }`                                                      |
| `POST`  | `/api/admin/onboarding/property/:id/invite-links`     | Generate self-registration invite links for units          | `{ unitNumbers[] }`                                                             | `200 OK` — `{ links: [{ unitNumber, url, code }] }`                                         |
| `POST`  | `/api/admin/onboarding/property/:id/staff/invite`     | Send staff invitation emails                               | `{ invitations: [{ email, role }] }`                                            | `200 OK` — `{ sent, failed[] }`                                                             |
| `POST`  | `/api/admin/onboarding/property/:id/activate`         | Activate the property and optionally send welcome emails   | `{ sendWelcomeEmails: boolean }`                                                | `200 OK` — `{ status: "active", activatedAt, emailsSent }`                                  |
| `POST`  | `/api/admin/onboarding/property/:id/validate-slug`    | Check vanity URL slug availability                         | `{ slug }`                                                                      | `200 OK` — `{ available: boolean, suggestion?: string }`                                    |
| `POST`  | `/api/admin/onboarding/property/:id/validate-name`    | Check property name uniqueness                             | `{ name }`                                                                      | `200 OK` — `{ available: boolean }`                                                         |

### 6.2 Import Processing

CSV/Excel imports for files with more than 500 rows are processed asynchronously:

1. **Upload**: Client sends file via `multipart/form-data`. Server returns `202 Accepted` with an `importId`.
2. **Processing**: Server parses, validates, and stages the data. Progress is tracked in the `ImportJob` model.
3. **Polling**: Client polls `GET /api/admin/onboarding/property/:id/import/:importId` every 2 seconds until `status` is `completed` or `failed`.
4. **Review**: Client displays the validation report. Admin clicks "Import Valid Rows."
5. **Commit**: Client calls `PATCH` on the step endpoint with `{ importId, action: "commit" }` to persist the valid rows.

Files with 500 rows or fewer are processed synchronously — the response includes the validation report directly.

---

## 7. Data Model

### 7.1 OnboardingProgress

Tracks the overall wizard state for a property.

| Field            | Type                 | Description                                                                            |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------- |
| `id`             | UUID                 | Primary key                                                                            |
| `propertyId`     | UUID (FK → Property) | The property being onboarded                                                           |
| `currentStep`    | Integer (1-8)        | The step the admin is currently on                                                     |
| `completedSteps` | Integer[]            | Array of step numbers that are marked complete                                         |
| `skippedSteps`   | Integer[]            | Array of step numbers that were skipped                                                |
| `stepData`       | JSONB                | Per-step data snapshot, keyed by step number. Contains all field values for each step. |
| `status`         | Enum                 | `in_progress`, `completed`, `abandoned`                                                |
| `startedAt`      | Timestamp            | When the wizard was first opened                                                       |
| `completedAt`    | Timestamp (nullable) | When the property was activated                                                        |
| `lastSavedAt`    | Timestamp            | Last auto-save timestamp                                                               |
| `createdBy`      | UUID (FK → User)     | The admin who initiated onboarding                                                     |

### 7.2 ImportJob

Tracks CSV/Excel import operations.

| Field                  | Type                           | Description                                                                       |
| ---------------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| `id`                   | UUID                           | Primary key                                                                       |
| `propertyId`           | UUID (FK → Property)           | The property this import belongs to                                               |
| `onboardingProgressId` | UUID (FK → OnboardingProgress) | The associated onboarding session                                                 |
| `type`                 | Enum                           | `units`, `residents`                                                              |
| `status`               | Enum                           | `uploading`, `processing`, `awaiting_review`, `committing`, `completed`, `failed` |
| `fileName`             | String                         | Original uploaded file name                                                       |
| `fileSize`             | Integer                        | File size in bytes                                                                |
| `totalRows`            | Integer                        | Total data rows detected (excluding header)                                       |
| `validRows`            | Integer                        | Rows that passed validation                                                       |
| `invalidRows`          | Integer                        | Rows that failed validation                                                       |
| `errors`               | JSONB                          | Array of `{ row, field, message }` objects                                        |
| `committedAt`          | Timestamp (nullable)           | When the admin confirmed the import                                               |
| `createdAt`            | Timestamp                      | Upload timestamp                                                                  |

### 7.3 InviteLink

Tracks self-registration invite links for residents.

| Field          | Type                       | Description                                  |
| -------------- | -------------------------- | -------------------------------------------- |
| `id`           | UUID                       | Primary key                                  |
| `propertyId`   | UUID (FK → Property)       | The property                                 |
| `unitId`       | UUID (FK → Unit)           | The unit this link is for                    |
| `code`         | String (6 characters)      | Unique registration code                     |
| `url`          | String                     | Full invite URL                              |
| `status`       | Enum                       | `generated`, `sent`, `registered`, `expired` |
| `expiresAt`    | Timestamp                  | Default: 30 days from generation             |
| `registeredBy` | UUID (FK → User, nullable) | The user who registered via this link        |
| `createdAt`    | Timestamp                  | When the link was generated                  |

---

## 8. Screen States and UI

### 8.1 Wizard Loading State

When the wizard is loading (fetching saved state from the server):

- Progress bar shows with all steps in neutral/gray state.
- Content area shows a centered skeleton loader (pulsing gray rectangles matching form field layout).
- Footer buttons are disabled.
- Duration: typically under 500ms; skeleton disappears on data load.

### 8.2 Step States

Each step has the following possible states:

| State           | Trigger                                                      | Visual                                                                                                          |
| --------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Empty**       | First visit to the step, no data entered                     | Form fields are empty with placeholder text. Help tooltips are visible. "Skip for Now" button is prominent.     |
| **In Progress** | At least one field has data but step is not complete         | Fields show entered values. "Last saved" timestamp visible. Validation errors shown inline on fields that fail. |
| **Complete**    | All required fields pass validation and admin clicked "Next" | Progress bar shows green checkmark. Step data is summarized in Step 8.                                          |
| **Skipped**     | Admin clicked "Skip for Now"                                 | Progress bar shows amber dashed circle. Step 8 shows "Skipped — Complete this step" link.                       |
| **Resumed**     | User returns to a previously completed or in-progress step   | All saved data is restored. No data loss. Modified fields trigger auto-save.                                    |

### 8.3 Import Progress States

For CSV/Excel imports (Steps 2 and 6):

| State                   | Visual                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **No file**             | Drag-and-drop zone with dashed border, upload icon, and "Drag a CSV or Excel file here, or click to browse" text               |
| **Uploading**           | Progress bar showing upload percentage. File name and size displayed. "Cancel" button.                                         |
| **Processing**          | Spinner with "Validating {N} rows..." text. Progress updates as rows are processed.                                            |
| **Validation complete** | Summary: "{N} valid, {M} errors". Expandable error list. "Import Valid Rows" button enabled.                                   |
| **Importing**           | Progress bar: "Importing {N} rows..." with count incrementing.                                                                 |
| **Import complete**     | Success message: "{N} units/residents imported successfully." Table shows all imported records.                                |
| **Failed**              | Error banner: "Import failed: {reason}". "Try Again" button. Common reasons: file corrupt, encoding unsupported, server error. |

### 8.4 Error States

| Error Context                         | Display                                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Field validation**                  | Red border on field, error message below field in `--color-danger-500`, field label turns red                                                                                          |
| **Step validation (on "Next" click)** | Toast notification at top of step: "Please fix {N} errors before continuing." First error field scrolls into view and receives focus.                                                  |
| **Network error (auto-save failure)** | Yellow warning banner below progress bar: "Unable to save. Retrying..." with countdown. After 3 retries: "Connection lost. Your work is saved locally and will sync when reconnected." |
| **Server error (500)**                | Red error banner: "Something went wrong. Please try again. If this persists, contact support." with "Retry" button and support chat link.                                              |
| **Session expired**                   | Modal overlay: "Your session has expired. Please sign in again." with "Sign In" button. On re-auth, wizard resumes from last saved state.                                              |

### 8.5 Empty States for Optional Steps

When an optional step is visited but the admin decides not to configure anything:

| Step              | Empty State Message                                                                                             | CTA                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 3. Amenity Spaces | "No amenities configured yet. You can add amenity spaces now or set them up later in Amenity Booking settings." | "Add an Amenity" or "Skip for Now"   |
| 4. Event Types    | "No event types configured. We recommend using the defaults — they cover the most common building events."      | "Load Defaults" or "Skip for Now"    |
| 5. Staff Setup    | "No team members invited yet. You can invite staff now or add them later in User Management."                   | "Invite Staff" or "Skip for Now"     |
| 6. Residents      | "No residents added yet. You can import residents now or do it after your property is live."                    | "Import Residents" or "Skip for Now" |
| 7. Branding       | "Using default Concierge branding. Customize your property's look and feel, or keep the defaults."              | "Customize" or "Skip for Now"        |

---

## 9. Permissions

### 9.1 Access Control

| Action                                     | Super Admin | Property Admin                    | All Other Roles |
| ------------------------------------------ | ----------- | --------------------------------- | --------------- |
| Start onboarding wizard for a new property | Yes         | Yes (for their own property only) | No              |
| Complete any wizard step                   | Yes         | Yes                               | No              |
| Upload CSV files                           | Yes         | Yes                               | No              |
| Send staff invitations                     | Yes         | Yes                               | No              |
| Activate property                          | Yes         | Yes                               | No              |
| Resume an abandoned wizard                 | Yes         | Yes                               | No              |
| View onboarding progress                   | Yes         | Yes                               | No              |
| Delete an in-progress onboarding           | Yes         | No                                | No              |

### 9.2 Staff Invitation Permissions

- Staff invitations created in Step 5 are **pending** until the invited person accepts.
- Accepting an invitation does not require admin approval — the invitation itself is the approval.
- The invited staff member creates their own password during account setup.
- The admin can revoke a pending invitation before it is accepted.
- Invitation links expire after 30 days. The admin can re-send expired invitations.

### 9.3 Resident Self-Registration

- Invite links generated in Step 6 (Tab C) are scoped to a specific unit.
- The self-registration form validates that the unit code matches and that no other resident has already registered via that link.
- Self-registered residents receive the `Resident` role automatically. Their resident type (Owner/Tenant) defaults to `Tenant` and can be changed by the admin post-registration.
- The admin can deactivate invite links at any time.

---

## 10. Edge Cases

### 10.1 Wizard Abandonment and Resume

| Scenario                                                    | Behavior                                                                                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin closes browser mid-step                               | All field values are auto-saved (500ms debounce). On next login, the wizard opens to the last saved step with all data intact.                                                                 |
| Admin logs out mid-wizard                                   | Same as browser close. Wizard state persists server-side.                                                                                                                                      |
| Admin does not return for 30+ days                          | Wizard remains in `in_progress` state indefinitely. No timeout. No data loss.                                                                                                                  |
| Admin returns after property was activated by a Super Admin | Wizard shows the completed/congratulations view. No further wizard steps are available.                                                                                                        |
| Two admins access the wizard simultaneously                 | Last-write-wins with conflict detection. If Admin B saves a step while Admin A is editing, Admin A sees a notification: "This step was updated by another admin. Reload to see their changes?" |

### 10.2 Large CSV Imports

| Scenario                      | Behavior                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSV with 500 or fewer rows    | Processed synchronously. Validation report appears in 2-5 seconds.                                                                                                         |
| CSV with 501-10,000 rows      | Processed asynchronously. Client polls for status every 2 seconds. Progress indicator shows row count. Typical processing time: 10-30 seconds.                             |
| CSV with 10,001+ rows         | Server rejects with error: "File contains more than 10,000 rows. Please split into multiple files of 10,000 rows or fewer." This limit prevents timeout and memory issues. |
| CSV upload fails mid-transfer | Client detects network interruption and shows "Upload interrupted. Please try again." The partial upload is discarded server-side.                                         |

### 10.3 Data Conflicts

| Scenario                                                                      | Behavior                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate unit numbers in CSV                                                 | Flagged in validation report: "Row {N}: Unit number '{X}' is duplicated in row {M}." Both rows are marked invalid. Admin must fix the file and re-upload.                                                                                                                          |
| Unit number in CSV matches an existing unit                                   | Flagged as: "Row {N}: Unit '{X}' already exists in this property." The row is skipped.                                                                                                                                                                                             |
| Duplicate email in resident CSV                                               | Flagged as: "Row {N}: Email '{X}' is already used by another resident in this property." The duplicate row is skipped.                                                                                                                                                             |
| Resident's unit_number does not match any unit                                | Flagged as: "Row {N}: Unit '{X}' does not exist. Create it in Step 2 first."                                                                                                                                                                                                       |
| Admin changes property type (Step 1) after units were created (Step 2)        | No data loss. Property type is metadata only and does not affect unit structure. A confirmation dialog warns: "Changing the property type may affect default terminology. Your existing units will not be modified."                                                               |
| Admin reduces building count (Step 1) after units exist in a removed building | Blocked. Error: "Cannot remove {Building Name} because it has {N} units assigned. Delete or reassign those units in Step 2 first."                                                                                                                                                 |
| Admin reduces floor count after units exist on removed floors                 | Blocked with the same pattern. The floor cannot be removed while units reference it.                                                                                                                                                                                               |
| Vanity URL slug becomes taken between check and activation                    | On activation, the system re-validates the slug. If taken, activation proceeds but the slug is cleared, and the admin is notified: "Your custom URL '{slug}' was claimed by another property. Your property is live at the default URL. You can set a new custom URL in Settings." |

### 10.4 Email and Invitation Edge Cases

| Scenario                                                 | Behavior                                                                                                                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staff invitation email bounces                           | Status updates to "Bounced" in the invite list. Admin sees a warning icon with tooltip: "Email delivery failed. Verify the address and re-send."                                       |
| Invited staff member already has a Concierge account     | The invitation links them to the existing property with the assigned role. No new account is created. They see the new property in their property switcher.                            |
| Resident invite link is used twice                       | Second visitor sees: "This invite link has already been used. Contact your building management for assistance."                                                                        |
| Resident enters wrong unit code during self-registration | Form shows: "The information you entered does not match our records. Please check your invite link and try again." After 5 failed attempts, the link is temporarily locked for 1 hour. |

### 10.5 Browser and Device Edge Cases

| Scenario                                     | Behavior                                                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin uses mobile browser                    | Wizard is fully responsive. Progress bar collapses to show current step number and a dropdown for navigation. Form fields stack vertically. Live preview (Step 7) opens in a full-screen modal instead of side panel. |
| Admin uses Internet Explorer                 | Not supported. Redirect to a "Please use a modern browser" page listing Chrome, Firefox, Safari, and Edge.                                                                                                            |
| Admin has JavaScript disabled                | Server-rendered fallback page: "Concierge requires JavaScript to run. Please enable JavaScript in your browser settings."                                                                                             |
| Auto-save fails due to browser storage quota | The wizard does not depend on local storage for persistence. Server-side save is the primary mechanism. If the server save also fails, the network error state (Section 8.4) activates.                               |

---

## 11. UI Implementation Reference

The wizard UI uses these components from the Component Catalog (COMPONENT-CATALOG.md Section 9):

| Component           | Catalog Reference | Usage in Wizard                                                                  |
| ------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `OnboardingStepper` | Section 9.1       | 8-step horizontal stepper with progress tracking, shown at the top of the wizard |
| `WizardStep`        | Section 9.10      | Individual step container with header, content area, and navigation footer       |
| `ImportProgress`    | Section 9.8       | CSV import progress tracker used in Step 2 (Units) and Step 6 (Residents)        |

The wizard also uses these general components from Sections 1-6 of the Component Catalog: `Button`, `Input`, `Select`, `FileUpload`, and `DataTable`.

---

## ADDENDUM: Gap Analysis Fixes (2026-03-17)

> Added from GAP-ANALYSIS-FINAL.md gap 23.1

### A1. Parking Configuration in Onboarding (Gap 23.1, High)

Given the granular parking limit matrix (see PRD 13 Addendum A1), the onboarding wizard should include parking configuration.

#### Option A: Add as Step 4.5 (between Amenities and Event Types)

Add a "Parking Rules" sub-step with:

1. **Enable visitor parking**: Toggle (default: yes)
2. **Parking limit preset**: Dropdown with 3 presets:
   - "Relaxed" (all limits = 0 / unlimited)
   - "Standard" (3 consecutive nights, 5/unit/month, 2 day visits/unit/day)
   - "Strict" (2 consecutive nights, 3/unit/month, 1/plate/week, 1 day visit/unit/day)
   - "Custom" (opens full limit matrix from PRD 13 A1)
3. **Self-serve visitor parking**: Toggle (default: off)
4. **Pass printing**: Toggle (default: on)

#### Option B: Set Sensible Defaults, Configure Later

If adding a step makes onboarding too long (target is under 30 minutes), use the "Standard" preset as default and show a post-onboarding reminder: "Configure detailed parking rules in Settings > Parking."

Recommended: **Option B** for initial onboarding, with a prominent "Configure Parking" card on the admin dashboard during the first 7 days.

---

## 12. Completeness Checklist

### Feature Coverage

- [x] 8-step wizard with progress tracking and step validation
- [x] Auto-save on every field change (debounced 500ms)
- [x] CSV import for units (Step 2) and residents (Step 6) with template download
- [x] CSV validation: 4-stage pipeline (format, schema, business rules, duplicate detection)
- [x] Property details: name, address, unit count, timezone, logo upload
- [x] Unit creation: manual and bulk CSV import with floor/type/status fields
- [x] Common area definition: name, floor, type (from fixed list of 12 types)
- [x] Amenity setup: name, type, capacity, booking rules, time slots
- [x] Event type configuration: 15 default types with icon, color, notification toggle
- [x] Resident import: CSV with unit assignment, email invitation toggle
- [x] Review step: summary of all configured items with per-section edit links
- [x] Parking configuration: sensible defaults with post-onboarding reminder card

### Edge Case Coverage

- [x] Browser crash mid-wizard: auto-save restores last state on return
- [x] CSV with 0 valid rows: error banner "No valid rows found. Download the error report for details."
- [x] CSV with 10,000+ rows: chunked processing with progress bar, 60-second timeout per chunk
- [x] Concurrent CSV imports from two admin sessions: second import receives 409 Conflict with message "An import is already in progress. Wait for it to complete or cancel it from the Import Status page."
- [x] Wizard abandoned at Step 3: property created in "setup_incomplete" status, visible only to the admin who started it, auto-deleted after 30 days of inactivity
- [x] Unicode property names: supported up to 200 characters, validated for printable characters only (no control characters)
- [x] Session expiry mid-wizard: on re-login, redirect to the last completed step with banner "Your session expired. Your progress has been saved."
- [x] Duplicate unit numbers in CSV: rejected with row-level error "Duplicate unit number '{value}' found on rows {list}"

### UX Coverage

- [x] "Skip for now" available on Steps 3-6 (not Steps 1, 2, 7, 8 which are mandatory)
- [x] Back button preserves all entered data
- [x] Step indicator shows completed (checkmark), current (highlighted), and future (greyed) states
- [x] Estimated time remaining shown at top: calculated as (remaining steps \* 3 minutes average)
- [x] Mobile-responsive: steps stack vertically on screens narrower than 768px
