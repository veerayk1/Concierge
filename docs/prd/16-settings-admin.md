# 16 -- Settings & Administration

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

Settings & Administration is the central configuration hub for the entire Concierge platform. It provides 16 tabbed sections where Super Admins and Property Admins manage every configurable aspect of the system -- from basic property details to AI provider keys, notification templates, billing, and backup/disaster recovery.

### Why This Module Exists

Building management is not one-size-fits-all. A 50-unit boutique condo has different needs than a 500-unit tower complex. Settings & Admin exists so that every property can tailor the platform to its specific operations -- event types, maintenance categories, amenity rules, notification channels, branding, custom fields -- without any code changes.

### Key Facts

| Aspect | Detail |
|--------|--------|
| **Total tabs** | 16 configuration sections |
| **Access** | Super Admin (full), Property Admin (property-level), Property Manager (view-only on select tabs) |
| **Multi-property** | Super Admin sees a property switcher; Property Admin sees only their assigned property |
| **Audit trail** | Every settings change is logged with timestamp, actor, and before/after values |
| **AI-enhanced** | Configuration recommendations, health monitoring, cost dashboards |
| **Real-time** | Changes take effect immediately -- no server restart or cache clear required |

### Tab Inventory

| # | Tab | Primary Role | Scope |
|---|-----|-------------|-------|
| 1 | Property Setup | Property Admin | Per property |
| 2 | Event Type Configuration | Property Admin | Per property |
| 3 | Maintenance Categories | Property Admin | Per property |
| 4 | Amenity Management | Property Admin | Per property |
| 5 | Notification Templates | Property Admin | Per property |
| 6 | Role & Permission Management | Property Admin | Per property |
| 7 | Custom Fields Configuration | Property Admin | Per property |
| 8 | AI Configuration | Super Admin | System-wide + per property |
| 9 | Branding & Theming | Property Admin | Per property |
| 10 | Audit Log | Property Admin | Per property (Super Admin: cross-property) |
| 11 | System Health | Super Admin | System-wide |
| 12 | Billing & Subscription | Super Admin | Per property + system |
| 13 | Data Import/Export | Property Admin | Per property |
| 14 | API Key Management | Super Admin | System-wide |
| 15 | Buzzer Code Directory | Property Admin | Per property |
| 16 | Backup & Recovery | Super Admin | System-wide |

---

## 2. Research Summary

### Industry Patterns Observed

Competitive analysis of three industry-leading platforms revealed consistent patterns in admin configuration:

| Finding | Detail | Impact on Concierge |
|---------|--------|---------------------|
| **Rigid log types** | One platform had 6 hardcoded log types with no ability to add more | Build a fully configurable event type system |
| **Flat settings pages** | Settings dumped into long scrollable pages with no organization | Use tabbed, categorized sections with progressive disclosure |
| **Role management as a table** | Up to 18 groups with basic edit-only controls | Build a visual permission matrix with clone, preview, and audit |
| **Missing buzzer directory** | One platform had a buzzer module but with legacy architecture and inconsistent formatting | Build a modern, searchable buzzer code directory with unit-based lookup |
| **No AI configuration** | No platform offered AI-related settings -- AI was either absent or hidden | Build a comprehensive AI control panel as a first-class settings tab |
| **No system health view** | No platform surfaced system health, uptime, or performance metrics to admins | Build a real-time system health dashboard |
| **Feature toggles as booleans** | Simple on/off toggles with no explanation of consequences | Add tooltips, preview impacts, and confirmation for destructive toggles |
| **No import/export** | Limited or no data import/export capabilities for migration | Build robust CSV/Excel import with validation and preview |

### Design Decisions from Research

1. **Configurable event types over hardcoded logs** -- Admins create, edit, reorder, and deactivate event types without engineering support
2. **Visual permission builder** -- A checkbox matrix organized by module and action, not a raw JSON editor
3. **Multi-channel notification templates** -- Separate templates for email, SMS, push, and voice per event type
4. **Buzzer codes as first-class entities** -- Searchable by unit, resident, or code with bulk import/export
5. **Progressive disclosure on every tab** -- Show essential fields by default; advanced options behind "Show Advanced" toggles

---

## 3. Feature Spec

### 3.1 Tab 1: Property Setup

The foundation of every property. Contains the building's identity, physical details, contacts, and operational toggles.

#### 3.1.1 Building Information

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Property Name | text | 200 chars | Yes | -- | Non-empty, no special characters except hyphens and apostrophes | "Property name is required" |
| Legal Name | text | 300 chars | No | -- | -- | -- |
| Street Address | text | 500 chars | Yes | -- | Non-empty | "Street address is required" |
| City | text | 100 chars | Yes | -- | Non-empty | "City is required" |
| Province/State | dropdown | -- | Yes | -- | Must select | "Province/State is required" |
| Country | dropdown | -- | Yes | Canada | Must select | "Country is required" |
| Postal/ZIP Code | text | 10 chars | Yes | -- | Regex: Canadian postal (`^[A-Z]\d[A-Z]\s?\d[A-Z]\d$`) or US ZIP (`^\d{5}(-\d{4})?$`) | "Enter a valid postal code" |
| Corporation Number | text | 50 chars | No | -- | Alphanumeric + hyphens | "Only letters, numbers, and hyphens allowed" |
| Total Floors | number | -- | Yes | 1 | Integer, 1-200 | "Must be between 1 and 200" |
| Total Units | number | -- | Yes | 1 | Integer, 1-5000 | "Must be between 1 and 5000" |
| Year Built | number | -- | No | -- | 1800-current year | "Enter a valid year" |
| Timezone | dropdown | -- | Yes | America/Toronto | Valid IANA timezone | "Select a timezone" |
| Property Logo | file upload | 5 MB | No | Concierge default | JPG/PNG/SVG, min 200x200px | "Upload a JPG, PNG, or SVG under 5 MB" |
| Welcome Message | rich text | 2000 chars | No | -- | -- | -- |
| Description | textarea | 500 chars | No | -- | -- | -- |

**Property Logo Upload Button**:
- **Action**: Opens file picker (JPG, PNG, SVG, max 5 MB)
- **Loading state**: Spinner replaces logo preview area, text "Uploading..."
- **Success state**: New logo renders in preview with green check and "Logo updated" toast
- **Failure state**: Red inline error below upload area with specific reason (file too large, wrong format)

#### 3.1.2 Contact Information

Repeatable contact block (minimum 1, maximum 10):

| Field | Type | Max Length | Required | Validation | Error Message |
|-------|------|-----------|----------|------------|---------------|
| Contact Name | text | 100 chars | Yes | Non-empty | "Contact name is required" |
| Contact Email | email | 254 chars | Yes | Valid email format | "Enter a valid email address" |
| Contact Phone | tel | 20 chars | No | Valid phone format (E.164 accepted) | "Enter a valid phone number" |
| Contact Role | dropdown | -- | Yes | Must select from: Property Manager, Assistant Manager, Superintendent, Concierge Desk, Security, Board President, Other | "Select a role" |
| Primary Contact | radio | -- | Yes (exactly 1) | Exactly one contact marked primary | "One contact must be marked as primary" |

**"Add Contact" Button**:
- **Action**: Appends a new blank contact row below existing contacts
- **Loading state**: None (instant client-side operation)
- **Success state**: New row appears with empty fields and focus on Contact Name
- **Failure state**: If at max (10), button is disabled with tooltip "Maximum 10 contacts reached"

#### 3.1.2a Security Provider (Optional)

Configures the security company providing on-site personnel. This branding appears on security reports, printed visitor passes, and the Security Console header.

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Security Company Name | text | 150 chars | No | -- | -- | -- |
| Security Company Logo | file upload | 2 MB | No | -- | JPG/PNG/SVG, min 100x100px | "Upload a JPG, PNG, or SVG under 2 MB" |
| Security Company Phone | tel | 20 chars | No | -- | Valid phone format (E.164 accepted) | "Enter a valid phone number" |
| Security Company Email | email | 254 chars | No | -- | Valid email format | "Enter a valid email address" |
| Display on Reports | boolean | -- | No | true | -- | -- |
| Display on Visitor Passes | boolean | -- | No | true | -- | -- |

**Tooltip** (on section header): "Optional. If your building uses a third-party security provider, enter their details here. The company name and logo will appear on security reports and printed visitor passes."

**Security Company Logo Upload Button**:
- **Action**: Opens file picker (JPG, PNG, SVG, max 2 MB)
- **Loading state**: Spinner replaces logo preview area
- **Success state**: New logo renders in preview, toast "Security provider logo updated"
- **Failure state**: Red inline error with reason (file too large, wrong format)

#### 3.1.3 Operational Toggles

| Toggle | Type | Default | Tooltip |
|--------|------|---------|---------|
| Enable maintenance requests | boolean | On | "When off, residents cannot submit maintenance requests through the portal" |
| Allow resident amenity booking | boolean | On | "When off, only staff can create amenity bookings" |
| Allow offsite owner amenity booking | boolean | Off | "When on, offsite owners can book amenities remotely" |
| Enable visitor self-registration | boolean | Off | "When on, residents can pre-register visitors through the resident portal" |
| Enable package notifications | boolean | On | "When off, package intake will not send automatic notifications to residents" |
| Require signature on package release | boolean | Off | "When on, package release requires resident signature on a signature pad or screen" |
| Signature capture method | dropdown | Touchscreen | Options: Touchscreen (browser-based canvas), Tablet (dedicated tablet input), Topaz Signature Pad (USB hardware). Only visible when "Require signature on package release" is On. | "Select how signatures are captured at the front desk" |
| Parking pass format | dropdown | Standard | Options: Standard (text-only pass), Formatted (branded pass with property logo, vehicle details, and barcode), None (no printed passes). See PRD 13 for parking pass printing workflow. | "Select the format for printed visitor parking passes" |
| Enable in-person payments | boolean | Off | "When on, staff can record in-person cash or check payments" |
| Enable online payments | boolean | Off | "When on, residents can pay for amenity bookings and fees through the portal" |
| Auto-approve suite entry | boolean | Off | "When on, suite entry requests are automatically approved without staff review" |

**Save Button** (bottom of tab):
- **Action**: Persists all Property Setup changes
- **Loading state**: Button text changes to "Saving...", spinner icon, button disabled
- **Success state**: Green toast "Property settings saved", button returns to "Save Changes"
- **Failure state**: Red toast "Failed to save -- please try again", button re-enables

---

### 3.2 Tab 2: Event Type Configuration

Manages the configurable event types that power the Unified Event Model. Admins add, edit, reorder, and deactivate event types without code changes.

#### 3.2.1 Event Groups

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Group Name | text | 100 chars | Yes | -- | Unique within property | "Group name already exists" |
| Group Icon | icon picker | -- | Yes | Folder icon | Must select | "Select an icon" |
| Group Color | color picker | 7 chars | Yes | #6E6E73 | Valid hex | "Select a valid color" |
| Sort Order | number | -- | Yes | Auto-increment | Integer >= 0 | "Enter a valid position" |
| Active | boolean | -- | Yes | true | -- | -- |

System default groups (cannot be deleted, can be renamed):
- Packages, Security Incidents, Visitors, Cleaning, Key Management, Shift Log, General

#### 3.2.2 Event Types (per group)

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Type Name | text | 100 chars | Yes | -- | Unique within property | "Event type name already exists" |
| Slug | text | 50 chars | Auto | Auto-generated from name | URL-safe, unique | "Slug already exists" |
| Icon | icon picker or upload | -- | Yes | Group default | Must select | "Select an icon" |
| Color | color picker | 7 chars | Yes | Group color | Valid hex | "Select a valid color" |
| Default Priority | dropdown | -- | Yes | Normal | low/normal/high/critical | -- |
| Requires Unit | boolean | -- | Yes | false | -- | -- |
| Requires Resident | boolean | -- | Yes | false | -- | -- |
| Auto-Notify Resident | boolean | -- | Yes | false | -- | -- |
| Public Display | boolean | -- | Yes | false | Tooltip: "Show on lobby digital signage" | -- |
| Label Printable | boolean | -- | Yes | false | -- | -- |
| Reference Number Prefix | text | 10 chars | Yes | Auto | Uppercase letters only | "Only uppercase letters allowed" |
| Expiry Hours | number | -- | No | null | Integer 1-8760 (1 year) or null | "Must be between 1 and 8760 hours" |
| Custom Fields | field builder | -- | No | [] | See 3.7 Custom Fields | -- |
| Notification on Create | template picker | -- | No | null | Must reference existing template | -- |
| Auto-CC Recipients | email[] | 10 max | No | [] | Valid email format per entry, max 10 recipients | "Enter a valid email address" / "Maximum 10 CC recipients allowed" |

> **Tooltip — Auto-CC Recipients**: "These email addresses will be automatically CC'd on every notification sent for events of this type. Use this to keep managers, supervisors, or the security office informed of specific event categories (e.g., CC the property manager on all incident reports)."
| Notification on Close | template picker | -- | No | null | Must reference existing template | -- |
| Active | boolean | -- | Yes | true | -- | -- |

**"Add Event Type" Button**:
- **Action**: Opens a slide-over panel with the event type creation form
- **Loading state**: "Creating..." with spinner on the submit button
- **Success state**: Panel closes, new type appears in list, green toast "Event type created"
- **Failure state**: Inline errors on invalid fields, panel stays open

**"Deactivate" Button** (per event type):
- **Action**: Sets active=false. Events of this type remain in history but the type cannot be used for new events
- **Loading state**: Confirmation modal: "Deactivate {TypeName}? Existing events of this type will remain but no new events can use it."
- **Success state**: Type row shows "Inactive" badge, moves to bottom of list
- **Failure state**: Toast "Failed to deactivate -- please try again"

**Drag-to-Reorder**: Event types within a group can be reordered by dragging. Sort order auto-saves.

---

### 3.3 Tab 3: Maintenance Categories

Manages the category tree for maintenance/service requests. Two-level hierarchy: Category > Sub-Category.

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Category Name | text | 100 chars | Yes | -- | Unique within property | "Category name already exists" |
| Category Icon | icon picker | -- | No | Wrench icon | -- | -- |
| Default Priority | dropdown | -- | Yes | Normal | low/normal/high/critical | -- |
| Default Assignment | dropdown (staff) | -- | No | Unassigned | Must reference active staff | "Selected staff member not found" |
| Active | boolean | -- | Yes | true | -- | -- |

Sub-categories share the same field structure minus Default Assignment.

System defaults (43 categories pre-loaded, all editable):
- Plumbing, Electrical, HVAC, Elevator, Appliance, Carpentry, Painting, Flooring, Locksmith, Pest Control, Fire Safety, Window/Glass, Roofing, Cleaning, Landscaping, Snow Removal, Parking Structure, Common Area, Lobby, Gym Equipment, Pool/Spa, Garbage/Recycling, Intercom, Security System, Door/Gate, Mailbox, Storage Locker, Balcony, Bathroom, Kitchen, Bedroom, Living Area, Hallway, Stairwell, Garage, Loading Dock, Visitor Parking, Signage, IT/Network, Phone System, Water Damage, Mold/Air Quality, Other

---

### 3.4 Tab 4: Amenity Management

Configures individual amenities, their rules, pricing, and booking constraints. See PRD 06 (Amenity Booking) for the full booking workflow.

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Amenity Name | text | 100 chars | Yes | -- | Unique within property | "Amenity name already exists" |
| Description | textarea | 500 chars | No | -- | -- | -- |
| Photo | file upload | 5 MB | No | Placeholder | JPG/PNG, min 400x300px | "Upload a JPG or PNG under 5 MB" |
| Category | dropdown | -- | Yes | General | Must select | "Select a category" |
| Capacity | number | -- | No | null | Integer >= 1 | "Must be at least 1" |
| Requires Approval | boolean | -- | Yes | false | Tooltip: "When on, bookings require admin approval before confirming" | -- |
| Requires Payment | boolean | -- | Yes | false | -- | -- |
| Booking Fee | currency | -- | Conditional | 0.00 | Required if Requires Payment = true. >= 0.01 | "Enter a valid fee" |
| Deposit Amount | currency | -- | No | 0.00 | >= 0 | "Enter a valid amount" |
| Max Booking Duration | dropdown | -- | Yes | 4 hours | 30 min to 24 hours in 30-min steps | -- |
| Min Lead Time | dropdown | -- | Yes | 0 hours | 0 to 168 hours (1 week) | -- |
| Max Advance Booking | dropdown | -- | Yes | 30 days | 1 to 365 days | -- |
| Max Bookings Per Unit Per Day | number | -- | Yes | 1 | Integer 1-10 | "Must be between 1 and 10" |
| Max Bookings Per Unit Per Month | number | -- | Yes | 4 | Integer 1-50 | "Must be between 1 and 50" |
| Available Days | multi-select | -- | Yes | All days | At least one day selected | "Select at least one day" |
| Available Hours Start | time picker | -- | Yes | 06:00 | Valid time | "Select a valid start time" |
| Available Hours End | time picker | -- | Yes | 23:00 | Must be after start | "End time must be after start time" |
| Maintenance Blackout Dates | date range picker | -- | No | [] | Valid date ranges | -- |
| Active | boolean | -- | Yes | true | -- | -- |

---

### 3.5 Tab 5: Notification Templates

Manages message templates for email, SMS, push, and voice notifications. Templates use merge fields (e.g., `{{resident_name}}`, `{{unit_number}}`, `{{event_type}}`).

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Template Name | text | 100 chars | Yes | -- | Unique within property | "Template name already exists" |
| Channel | dropdown | -- | Yes | Email | email/sms/push/voice | -- |
| Trigger Event | dropdown | -- | Yes | -- | Must reference an event type or system event | "Select a trigger event" |
| Trigger Action | dropdown | -- | Yes | On Create | on_create/on_close/on_update/scheduled | -- |
| Subject Line (email only) | text | 200 chars | Conditional | -- | Required for email channel | "Subject line is required for email" |
| Body | rich text (email) / textarea (SMS/push) | Email: 10000 chars, SMS: 160 chars, Push: 200 chars, Voice: 500 chars | Yes | -- | Non-empty, valid merge fields | "Template body is required" / "Unknown merge field: {{field}}" |
| Merge Fields Available | read-only list | -- | -- | -- | Auto-populated based on trigger event | -- |
| Active | boolean | -- | Yes | true | -- | -- |
| Send Test | button | -- | -- | -- | -- | -- |

**Merge Fields**: `{{resident_name}}`, `{{unit_number}}`, `{{property_name}}`, `{{event_type}}`, `{{event_description}}`, `{{reference_number}}`, `{{created_by}}`, `{{created_at}}`, `{{status}}`, `{{action_url}}`

**"Send Test" Button**:
- **Action**: Sends the template to the logged-in admin's email/phone with sample data
- **Loading state**: "Sending test..." with spinner
- **Success state**: Green toast "Test sent to {admin_email}"
- **Failure state**: Red toast "Failed to send test -- check notification provider settings"

**"Preview" Button**:
- **Action**: Renders the template with sample merge field data in a modal
- **Loading state**: None (instant render)
- **Success state**: Modal showing the rendered template
- **Failure state**: Modal with error highlighting invalid merge fields

#### System Default Templates

The following notification templates are pre-loaded on every new property. They cannot be deleted but can be edited by the admin.

| # | Template Name | Channel | Trigger | Description |
|---|--------------|---------|---------|-------------|
| 1 | Welcome / Onboarding Email | Email | User account creation | Sent automatically when a new user account is created. Contains login credentials, portal URL, and getting-started instructions. |
| 2 | Password Reset | Email | Password reset request | Standard password reset link with 24-hour expiry. |
| 3 | Package Arrival | Email + Push | Package intake | Notifies resident that a package has been received. |
| 4 | Maintenance Update | Email + Push | Service request status change | Notifies resident of status changes to their maintenance request. |
| 5 | Booking Confirmation | Email | Amenity booking confirmed | Confirms amenity reservation with date, time, and cancellation instructions. |
| 6 | Emergency Broadcast | Email + SMS + Push + Voice | Emergency event created | Multi-channel emergency notification with instructions. |

**Welcome / Onboarding Email Template** (default content):

| Attribute | Detail |
|-----------|--------|
| **Subject** | "Welcome to {{property_name}} -- Your Portal Account" |
| **Body sections** | 1. Greeting ("Welcome, {{resident_name}}!"), 2. Login URL ({{portal_url}}), 3. Temporary password or activation link, 4. Quick-start guide (3 bullet points: update profile, set notification preferences, explore amenity bookings), 5. Contact information ({{primary_contact_name}}, {{primary_contact_email}}) |
| **Merge fields** | `{{resident_name}}`, `{{unit_number}}`, `{{property_name}}`, `{{portal_url}}`, `{{temporary_password}}`, `{{activation_link}}`, `{{primary_contact_name}}`, `{{primary_contact_email}}` |
| **Trigger** | Auto-sent on user account creation. Admin can toggle to manual-only in Operational Toggles (3.1.3). |
| **Editable** | Yes -- admin can customize subject, body, and branding. Cannot delete. |

---

### 3.6 Tab 6: Role & Permission Management

Visual permission builder for managing built-in and custom roles. See PRD 02 for the full role hierarchy.

#### 3.6.1 Role List

Displays all roles (built-in + custom) with:

| Column | Description |
|--------|-------------|
| Role Name | Display name |
| Type | Staff / Resident / Admin |
| Users Assigned | Count of active users with this role |
| Source | Built-in / Custom |
| Actions | Edit, Clone, Delete (custom only) |

#### 3.6.2 Permission Matrix (Edit View)

Checkbox matrix organized by module:

| Module | View | Create | Edit | Delete | Export | Configure |
|--------|:----:|:------:|:----:|:------:|:------:|:---------:|
| Security Console | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Packages | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Maintenance | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Amenities | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Units & Residents | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Announcements | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Reports | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Training | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Community | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Parking | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Settings | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

#### 3.6.3 Create Custom Role

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Role Name | text | 50 chars | Yes | -- | Unique, 3-50 chars, not a built-in name | "Role name already exists" / "Cannot use a built-in role name" |
| Based On | dropdown | -- | Yes | -- | Must select existing role | "Select a base role" |
| Description | textarea | 200 chars | No | -- | -- | -- |
| Role Type | dropdown | -- | Yes | Staff | staff/resident | -- |
| Permissions | checkbox matrix | -- | Yes | Inherited from base | Cannot exceed creator's permissions | "Cannot grant permissions you do not have" |

**"Create Role" Button**:
- **Action**: Validates and creates the custom role
- **Loading state**: "Creating role..." with spinner
- **Success state**: Modal closes, new role appears in list, green toast "Role created"
- **Failure state**: Inline errors in the form

**"Delete Role" Button** (custom roles only):
- **Action**: Confirmation modal: "Delete role {name}? This cannot be undone. {count} users must be reassigned first."
- **Loading state**: "Deleting..." with spinner
- **Success state**: Role removed from list, green toast "Role deleted"
- **Failure state**: Red toast "Cannot delete -- {count} users still assigned to this role"

---

### 3.7 Tab 7: Custom Fields Configuration

Allows admins to define additional fields on any entity (Events, Units, Residents, Maintenance Requests) without schema changes. Fields are stored as JSONB.

#### 3.7.1 Field Definition

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Field Label | text | 100 chars | Yes | -- | Unique per entity type | "Field label already exists for this entity" |
| Field Key | text | 50 chars | Auto | Auto from label (snake_case) | Unique per entity, alphanumeric + underscores | "Field key already exists" |
| Entity Type | dropdown | -- | Yes | -- | event/unit/resident/maintenance_request | "Select an entity type" |
| Field Type | dropdown | -- | Yes | Text | text/number/date/boolean/dropdown/multi_select/url/email/phone/textarea | "Select a field type" |
| Required | boolean | -- | Yes | false | -- | -- |
| Default Value | varies | varies | No | null | Must match field type | "Default value does not match field type" |
| Placeholder Text | text | 100 chars | No | -- | -- | -- |
| Help Text | text | 200 chars | No | -- | Displayed as tooltip next to field | -- |
| Dropdown Options | text list | 50 chars each, max 50 options | Conditional | [] | Required if Field Type = dropdown or multi_select | "At least one option is required" |
| Min Value (number) | number | -- | No | null | Number fields only | -- |
| Max Value (number) | number | -- | No | null | Must be >= min | "Max must be greater than min" |
| Max Length (text) | number | -- | No | 500 | 1-5000 | "Must be between 1 and 5000" |
| Sort Order | number | -- | Yes | Auto-increment | Integer >= 0 | -- |
| Active | boolean | -- | Yes | true | -- | -- |

**"Add Custom Field" Button**:
- **Action**: Opens slide-over form for field creation
- **Loading state**: "Creating field..." on submit button
- **Success state**: Panel closes, field appears in list, toast "Custom field created"
- **Failure state**: Inline validation errors

**Deactivation Note**: Deactivating a custom field hides it from forms but preserves existing data. Reactivating restores all historical values.

---

### 3.8 Tab 8: AI Configuration

Central control panel for all AI features. See PRD 19 (AI Framework) for the complete feature catalog.

**Access**: Super Admin only for provider keys and global settings. Property Admin can toggle per-property features if permitted.

#### 3.8.1 Global Controls

| Control | Type | Default | Description |
|---------|------|---------|-------------|
| Global AI Toggle | on/off | On | Master switch for all AI features across all properties |
| Emergency Shutdown | button | -- | Immediately halts all AI API calls (requires confirmation) |

**Emergency Shutdown Button**:
- **Action**: Confirmation modal: "This will immediately stop all AI features across all properties. Manual fallbacks will activate. Continue?"
- **Loading state**: "Shutting down..." with red spinner
- **Success state**: Red banner appears at top of settings: "AI is currently shut down. Click here to re-enable."
- **Failure state**: Toast "Failed to shut down -- contact support"

#### 3.8.2 Provider Keys

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Anthropic API Key | password | 200 chars | No | -- | Starts with `sk-ant-` | "Invalid Anthropic API key format" |
| OpenAI API Key | password | 200 chars | No | -- | Starts with `sk-` | "Invalid OpenAI API key format" |

**"Test Connection" Button** (per provider):
- **Action**: Makes a minimal API call to verify the key works
- **Loading state**: "Testing..." with spinner
- **Success state**: Green badge "Connected" with latency (e.g., "142ms")
- **Failure state**: Red badge "Failed" with error detail ("Invalid key" / "Rate limited" / "Network error")

#### 3.8.3 Budget Controls

| Field | Type | Required | Default | Validation | Error Message |
|-------|------|----------|---------|------------|---------------|
| Daily Budget | currency | Yes | $5.00 | >= $0.50 | "Minimum $0.50 per day" |
| Weekly Budget | currency | Yes | $25.00 | >= daily * 7 | "Weekly budget must accommodate daily budget" |
| Monthly Budget | currency | Yes | $75.00 | >= weekly * 4 | "Monthly budget must accommodate weekly budget" |
| Per-Property Daily Limit | currency | Yes | $2.00 | >= $0.10 | "Minimum $0.10 per property per day" |
| Alert Threshold | dropdown (%) | Yes | 80% | 50/60/70/80/90/95 | -- |
| Over-Budget Behavior | dropdown | Yes | Downgrade models | downgrade_models/disable_nonessential/hard_stop | -- |

#### 3.8.4 Per-Module Toggles

Table showing all 14 AI-enabled modules with on/off toggles and feature counts:

| Module | Features | Enabled | Cost (30d) |
|--------|----------|---------|------------|
| Security Console | 12 | [toggle] | $12.40 |
| Package Management | 10 | [toggle] | $8.20 |
| Maintenance | 12 | [toggle] | $15.60 |
| ... | ... | ... | ... |

Expanding a module row reveals per-feature toggles with individual cost estimates.

#### 3.8.5 Per-Feature Controls

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Feature Toggle | on/off | Per AI catalog | Enable or disable this individual AI feature |
| Provider Override | dropdown | Auto | Claude / OpenAI / Auto |
| Model Override | dropdown | Auto | Provider-specific model list |

---

### 3.9 Tab 9: Branding & Theming

Allows each property to customize the visual appearance of the resident portal and communications.

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Primary Color | color picker | 7 chars | Yes | #007AFF | Valid hex, WCAG AA contrast against white | "Color does not meet accessibility standards" |
| Accent Color | color picker | 7 chars | Yes | #5856D6 | Valid hex | -- |
| Logo (header) | file upload | 5 MB | No | Concierge logo | JPG/PNG/SVG, max 400x100px | "Logo must be under 400x100px" |
| Favicon | file upload | 1 MB | No | Concierge favicon | ICO/PNG, 32x32 or 64x64 | "Favicon must be 32x32 or 64x64" |
| Email Header Logo | file upload | 5 MB | No | Same as header logo | JPG/PNG, max 600x150px | "Max 600x150px" |
| Email Signature | rich text | 1000 chars | No | -- | -- | -- |
| Login Page Header | text | 200 chars | No | "Welcome to {property_name}" | -- | -- |
| Login Page Background | file upload | 10 MB | No | Default gradient | JPG/PNG, min 1920x1080px | "Min resolution 1920x1080" |
| Custom CSS (advanced) | code editor | 5000 chars | No | -- | Valid CSS syntax | "Invalid CSS syntax at line {n}" |

**"Preview" Button**:
- **Action**: Opens a new tab showing the resident portal with branding applied
- **Loading state**: None
- **Success state**: New tab loads with branded preview
- **Failure state**: Toast "Failed to generate preview"

---

### 3.10 Tab 10: Audit Log

Immutable record of every significant action taken in the system. Cannot be edited or deleted by any role.

#### 3.10.1 Audit Log Table

| Column | Type | Sortable | Filterable |
|--------|------|----------|------------|
| Timestamp | datetime | Yes (default: newest first) | Yes (date range) |
| User | text (name + role) | Yes | Yes (user picker) |
| Action | text | Yes | Yes (dropdown: Create/Update/Delete/Login/Logout/Export/Configure) |
| Module | text | Yes | Yes (dropdown of all modules) |
| Entity | text (type + ID) | No | Yes (text search) |
| Details | expandable JSON | No | Yes (text search) |
| IP Address | text | No | Yes (text search) |

**Filters bar** at top with: Date Range picker, User selector, Action dropdown, Module dropdown, Search box.

**"Export" Button**:
- **Action**: Downloads audit log as CSV or Excel
- **Loading state**: "Preparing export..." with progress bar
- **Success state**: File downloads, toast "Exported {count} records"
- **Failure state**: Toast "Export failed -- too many records. Narrow your date range."

#### 3.10.2 Audit Entry Detail

Expanding a row shows the full before/after diff of the change:

| Field | Type | Description |
|-------|------|-------------|
| Before | JSON (highlighted) | State before the change. Red highlighting for removed values |
| After | JSON (highlighted) | State after the change. Green highlighting for added/changed values |
| Change Summary | text | AI-generated plain-English summary of what changed (e.g., "Changed amenity 'Party Room' max booking from 4 hours to 6 hours") |

---

### 3.11 Tab 11: System Health

Real-time platform monitoring visible to Super Admin only.

#### 3.11.1 Health Dashboard

| Widget | Type | Description |
|--------|------|-------------|
| System Status | traffic light (green/yellow/red) | Overall platform health |
| API Response Time | line chart (24h) | Average response time in ms |
| Active Users | counter | Currently logged-in users across all properties |
| WebSocket Connections | counter | Active real-time connections |
| Database Status | traffic light | Database connectivity and query performance |
| Cache Hit Rate | percentage + chart | Redis/cache effectiveness |
| Notification Delivery | bar chart | Sent/delivered/failed by channel (24h) |
| AI Provider Status | per-provider traffic light | Health of each AI provider |
| Storage Usage | progress bar | File storage used vs. quota |
| Background Jobs | table | Queued/running/failed job counts |

#### 3.11.2 Alert Configuration

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| Alert Email | email | Yes | Super Admin email | Valid email |
| Response Time Threshold | number (ms) | Yes | 2000 | 100-30000 |
| Error Rate Threshold | percentage | Yes | 5% | 1-50% |
| Disk Usage Threshold | percentage | Yes | 80% | 50-95% |
| Notification Channel | multi-select | Yes | Email | email/sms/push |

---

### 3.12 Tab 12: Billing & Subscription

Manages subscription plans, payment methods, and invoicing for the Concierge platform.

**Access**: Super Admin only.

#### 3.12.1 Current Plan

| Field | Type | Description |
|-------|------|-------------|
| Plan Name | read-only | Current subscription tier (Starter/Professional/Enterprise) |
| Properties Included | read-only | Number of properties in plan |
| Properties Used | read-only + progress bar | Current usage |
| Renewal Date | read-only | Next billing date |
| Monthly Cost | read-only | Base subscription cost |
| AI Add-On | read-only | AI usage cost for current billing period |

#### 3.12.2 Invoice History

| Column | Type | Sortable |
|--------|------|----------|
| Invoice Date | date | Yes |
| Description | text | No |
| Amount | currency | Yes |
| Status | badge (Paid/Pending/Overdue) | Yes |
| PDF | download link | No |

**"Download Invoice" Button**:
- **Action**: Downloads PDF invoice
- **Loading state**: Spinner on button
- **Success state**: PDF downloads
- **Failure state**: Toast "Failed to download invoice"

---

### 3.13 Tab 13: Data Import/Export

Tools for migrating data into Concierge from other platforms and exporting data for backup or analysis.

#### 3.13.1 Import

| Field | Type | Max | Required | Validation | Error Message |
|-------|------|-----|----------|------------|---------------|
| Import Type | dropdown | -- | Yes | residents/units/buzzer_codes/events/maintenance_categories/amenities | "Select an import type" |
| File | file upload | 50 MB | Yes | CSV or XLSX | "Upload a CSV or Excel file" |

**Import Process**:
1. Upload file
2. Column mapping screen: system auto-maps columns, admin verifies
3. Validation preview: shows first 10 rows with any errors highlighted
4. Import summary: "Ready to import {count} records. {errors} errors found."
5. Confirm button

**"Start Import" Button**:
- **Action**: Begins the import process
- **Loading state**: Progress bar showing "{n} of {total} records processed"
- **Success state**: Summary: "Imported {success} records. {skipped} skipped. {failed} failed." with downloadable error report
- **Failure state**: "Import failed at row {n}: {reason}" with option to retry

#### 3.13.2 Export

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Export Type | dropdown | Yes | -- |
| Date Range | date range | No | All time |
| Format | dropdown | Yes | CSV |
| Include Attachments | boolean | No | false |

Available formats: CSV, XLSX, JSON, PDF (summary reports only).

**"Export" Button**:
- **Action**: Generates and downloads the export file
- **Loading state**: "Preparing export..." with progress indicator
- **Success state**: File downloads, toast "Exported {count} records"
- **Failure state**: Toast with error reason

---

### 3.14 Tab 14: API Key Management

Manages API keys for third-party integrations connecting to the Concierge API.

**Access**: Super Admin only.

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Key Name | text | 100 chars | Yes | -- | Unique | "Key name already exists" |
| Scope | multi-select | -- | Yes | Read Only | read/write/admin | "Select at least one scope" |
| Property Access | multi-select | -- | Yes | All | Must select at least one | "Select at least one property" |
| Rate Limit | number | -- | Yes | 1000/hour | 10-100000 | "Must be between 10 and 100,000 per hour" |
| Expiry | date | -- | No | Never | Must be in future if set | "Expiry must be in the future" |
| IP Whitelist | text (comma-separated) | 500 chars | No | -- | Valid IPv4/IPv6 addresses or CIDR ranges | "Invalid IP address format" |

**"Generate Key" Button**:
- **Action**: Creates a new API key and displays it once
- **Loading state**: "Generating..." with spinner
- **Success state**: Modal with the key displayed (shown only once, copyable). Warning: "Copy this key now. It will not be shown again."
- **Failure state**: Toast with error reason

**"Revoke" Button**:
- **Action**: Immediately invalidates the API key
- **Loading state**: Confirmation modal: "Revoke key {name}? Any integrations using this key will immediately stop working."
- **Success state**: Key status changes to "Revoked" (red badge), toast "Key revoked"
- **Failure state**: Toast "Failed to revoke key"

---

### 3.15 Tab 15: Buzzer Code Directory

Building-wide buzzer/intercom code management with unit-based lookup.

#### 3.15.1 Buzzer Code Table

| Column | Type | Sortable | Filterable |
|--------|------|----------|------------|
| Unit Number | text | Yes | Yes (text search) |
| Resident Name(s) | text | Yes | Yes (text search) |
| Buzzer Code | text | Yes | Yes (text search) |
| Comments | text | No | Yes (text search) |
| Last Updated | datetime | Yes | Yes (date range) |
| Actions | edit/delete | No | No |

#### 3.15.2 Buzzer Code Entry

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| Unit | dropdown (unit picker) | -- | Yes | -- | Must reference existing unit | "Select a valid unit" |
| Buzzer Code | text | 20 chars | Yes | -- | Alphanumeric | "Only letters and numbers allowed" |
| Comments | textarea | 500 chars | No | -- | -- | -- |

**Design Improvements Over Industry**:
- One buzzer code per unit (not per resident) -- eliminates duplicate rows for shared units
- Searchable by unit number, resident name, or buzzer code
- Bulk import via CSV (Tab 13: Data Import)
- Export to CSV/PDF for front desk binder
- "Last Updated" column so staff knows when a code was last verified
- Comments field with suggested uses (tooltip: "e.g., 'Use after 10 PM' or 'Hard of hearing -- ring twice'")

**"Add Buzzer Code" Button**:
- **Action**: Opens inline row at top of table
- **Loading state**: "Saving..." on inline save button
- **Success state**: Row saves in place, green flash on row, toast "Buzzer code added"
- **Failure state**: Inline error below the invalid field

---

### 3.16 Super Admin Features

Features available only at the Super Admin level, designed from first principles for multi-property platform management.

#### 3.16.1 Property Onboarding Wizard

Step-by-step guided setup for new properties:

| Step | Name | Description | Fields |
|------|------|-------------|--------|
| 1 | Property Details | Basic building info | Name, Address, Floors, Units, Timezone, Logo |
| 2 | Admin Account | Create the Property Admin | Name, Email, Temporary Password, Phone |
| 3 | Core Configuration | Essential setup | Enable/disable modules (maintenance, amenities, parking, community) |
| 4 | Event Types | Configure or use defaults | Review default event types, add/remove as needed |
| 5 | Notification Setup | Channel configuration | Enable email/SMS/push, configure sender addresses |
| 6 | Branding | Property appearance | Logo, primary color, login page header |
| 7 | Data Import | Optional migration | CSV import for residents, units, buzzer codes |
| 8 | Review & Launch | Final confirmation | Summary of all settings, "Launch Property" button |

**"Launch Property" Button** (Step 8):
- **Action**: Creates the property with all configured settings, sends welcome email to Property Admin
- **Loading state**: Progress bar: "Setting up property... Creating units... Importing data..."
- **Success state**: Redirect to property dashboard with confetti animation, toast "Property launched"
- **Failure state**: Error summary with specific failed steps, option to retry individual steps

#### 3.16.2 Multi-Property Management

| Feature | Description |
|---------|-------------|
| Property Switcher | Dropdown in top navigation showing all properties with search |
| Portfolio Dashboard | Cross-property KPIs: total events, open requests, AI spend, active users |
| Bulk Settings | Apply configuration changes across multiple properties simultaneously |
| Property Health Grid | Status cards per property showing health, alerts, and recent activity |
| Comparative Analytics | Compare metrics across properties (events/unit, resolution time, satisfaction) |

#### 3.16.3 AI Cost Dashboard

See PRD 19, Section 6.4 for the full specification. Summary:

| Chart | Description |
|-------|-------------|
| Daily Spend | Line chart, 30-day rolling view |
| Spend by Module | Horizontal bar chart |
| Spend by Provider | Pie chart (Claude vs. OpenAI) |
| Spend by Property | Stacked bar chart |
| Projected Monthly | Extrapolated from current usage |
| Top 10 Features | Ranked by cost |

#### 3.16.4 Global Audit Log

Cross-property audit log with all columns from Tab 10 plus a "Property" column filter.

#### 3.16.5 Backup & Recovery Dashboard

A dedicated Super Admin dashboard for monitoring backups, verifying data integrity, managing retention policies, controlling disaster recovery, and handling compliance data exports. This tab surfaces all capabilities defined in PRD 01, Section 13.

**Access**: Super Admin only.

---

##### Backup Status Card

A top-level summary card showing the health of the most recent backup at a glance.

| Field | Data Type | Description | Source |
|-------|-----------|-------------|--------|
| `last_backup_time` | timestamp with timezone | When the most recent backup completed | `BackupRecord.completed_at` (latest where status = completed) |
| `last_backup_type` | enum: `full`, `incremental`, `pitr` | Type of the most recent backup | `BackupRecord.type` |
| `last_backup_status` | enum: `completed`, `failed`, `running` | Status of the most recent backup | `BackupRecord.status` |
| `last_backup_size` | string (formatted) | Human-readable size (e.g., "4.2 GB") | `BackupRecord.size_bytes`, formatted client-side |
| `next_scheduled_backup` | timestamp with timezone | When the next daily full snapshot will run | Computed: next occurrence of 03:00 property-local-time |
| `status_indicator` | enum: `green`, `yellow`, `red` | Visual health indicator | See rules below |

**Status indicator rules**:

| Color | Condition |
|-------|-----------|
| Green | Last backup completed successfully within the last 25 hours |
| Yellow | Last backup completed successfully but was more than 25 hours ago, OR last backup is currently running for more than 2 hours |
| Red | Last backup failed, OR no backup has completed in the last 48 hours |

**Empty state**: If no backups exist yet (brand-new platform), the card shows:
- Message: "No backups recorded yet. The first automated backup will run at 3:00 AM local time."
- Status indicator: Yellow
- No action buttons

---

##### Backup History Table

A paginated, sortable table listing all backup records.

| Column | Data Type | Max Length | Sortable | Filterable | Source |
|--------|-----------|-----------|----------|------------|--------|
| Date | timestamp with timezone | -- | Yes (default: newest first) | Yes (date range picker) | `BackupRecord.started_at` |
| Type | enum | -- | Yes | Yes (dropdown: All, Full, Incremental, PITR) | `BackupRecord.type` |
| Size | string (formatted) | -- | Yes | No | `BackupRecord.size_bytes` |
| Duration | string (formatted) | -- | Yes | No | Computed: `completed_at - started_at`, displayed as "2h 15m" |
| Status | enum | -- | Yes | Yes (dropdown: All, Completed, Failed, Running) | `BackupRecord.status` |
| Verification | enum | -- | Yes | Yes (dropdown: All, Passed, Failed, Pending) | `BackupRecord.verification_status` |
| Actions | -- | -- | No | No | See below |

**Action buttons per row**:

| Button | Label | Condition | States |
|--------|-------|-----------|--------|
| Download | "Download" | Only shown if status = `completed` | **Default**: Outlined secondary button. **Loading**: Spinner + "Preparing download...". **Success**: Toast "Backup download started." **Failure**: Toast "Download failed: {error}. Try again." |
| Restore | "Restore" | Only shown if status = `completed` | **Default**: Outlined danger button. **Confirmation**: Modal with text input requiring `RESTORE` typed exactly. **Loading**: Full-page overlay with progress bar: "Restoring backup from {date}... This may take several hours." **Success**: Toast "Restore initiated. You will be notified when complete." **Failure**: Modal "Restore failed: {error}. Contact support if this persists." |
| View Details | "Details" | Always shown | Opens a slide-over panel with full `BackupRecord` fields and associated `BackupVerification` records |

**Restore confirmation modal fields**:

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `confirmation_text` | varchar | 7 chars | Yes | -- | Must exactly equal `RESTORE` (case-sensitive) | "Type RESTORE to confirm. This will overwrite current data with the backup from {date}." |
| `restore_reason` | text | 500 chars | Yes | -- | Min length: 10, Max length: 500 | "Please provide a reason for this restore (10-500 characters)." |
| `notify_property_admins` | boolean | -- | Yes | `true` | Must be true or false | -- |

**Pagination**: 25 rows per page. Standard pagination controls (first, previous, page numbers, next, last).

**Empty state**: "No backups found matching your filters." with a "Clear Filters" button.

---

##### Integrity Verification Card

Shows the status of automated backup integrity checks and allows manual verification.

| Field | Data Type | Description | Source |
|-------|-----------|-------------|--------|
| `last_verification_date` | timestamp with timezone | When the last verification ran | `BackupVerification.verified_at` (latest) |
| `last_verification_status` | enum: `passed`, `failed` | Result of the last verification | `BackupVerification.status` |
| `record_count_match` | boolean | Whether database record counts matched | `BackupVerification.record_count_match` |
| `checksum_match` | boolean | Whether file checksums matched | `BackupVerification.checksum_match` |
| `boot_test_passed` | boolean | Whether the application booted from the backup | `BackupVerification.boot_test_passed` |
| `smoke_test_passed` | boolean | Whether read-only smoke tests passed | `BackupVerification.smoke_test_passed` |
| `verification_duration` | string (formatted) | How long verification took (e.g., "45 minutes") | `BackupVerification.duration_seconds` |
| `next_scheduled_verification` | timestamp with timezone | When the next automated weekly verification will run | Computed: next Sunday at 04:00 UTC |

**Sub-results display**: Each of the 4 checks (record count, checksum, boot test, smoke test) is shown as a row with a green checkmark or red X icon.

**"Run Verification Now" button**:

| State | Behavior |
|-------|----------|
| **Default** | Primary button: "Run Verification Now" |
| **Disabled** | If a verification is already running. Label changes to "Verification in Progress..." with a spinner |
| **Loading** | After click: spinner + "Starting verification... This runs in the background and typically takes 30-60 minutes." |
| **Success** | Toast: "Verification started. Results will appear here when complete." Button returns to default state. |
| **Failure** | Toast: "Could not start verification: {error}. Try again in a few minutes." Button returns to default state. |

**Empty state**: "No verification has been run yet. Click 'Run Verification Now' to verify your most recent backup." with the button below.

---

##### Retention Policy Configuration

Editable form for backup retention periods. Changes apply to all future backup expiry calculations. Existing backups are not retroactively deleted (their retention_expires_at is recalculated on next cleanup run).

| Field | Label | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-------|-----------|-----------|----------|---------|------------|---------------|
| `pitr_retention_days` | "Point-in-time recovery" | integer | -- | Yes | `7` | Min: 3, Max: 30 | "PITR retention must be between 3 and 30 days." |
| `daily_retention_days` | "Daily snapshots" | integer | -- | Yes | `30` | Min: 7, Max: 90 | "Daily snapshot retention must be between 7 and 90 days." |
| `weekly_retention_days` | "Weekly snapshots" | integer | -- | Yes | `90` | Min: 30, Max: 365 | "Weekly snapshot retention must be between 30 and 365 days." |
| `monthly_retention_months` | "Monthly snapshots" | integer | -- | Yes | `12` | Min: 6, Max: 84 | "Monthly snapshot retention must be between 6 and 84 months." |
| `annual_retention_years` | "Annual snapshots" | integer | -- | Yes | `7` | Min: 1, Max: 25 | "Annual snapshot retention must be between 1 and 25 years." |

Each field is displayed as a number input with a unit label suffix ("days", "months", or "years"). Inline help text below each field explains what that retention tier covers.

**"Save Retention Policy" button**:

| State | Behavior |
|-------|----------|
| **Default** | Primary button, disabled until at least one field changes from its saved value |
| **Loading** | Spinner + "Saving..." |
| **Success** | Toast: "Retention policy updated. Changes apply to future backups." Button returns to disabled state. |
| **Failure** | Inline error banner above the button: "Could not save: {error}. Your changes have not been applied." |

**"Reset to Defaults" link**: Resets all fields to their default values (7, 30, 90, 12, 7). Does not save automatically -- the Super Admin must still click "Save Retention Policy."

---

##### Storage Usage Chart

A bar chart showing backup storage consumption over time, with projected future growth.

| Aspect | Specification |
|--------|--------------|
| **Chart type** | Vertical bar chart |
| **X-axis** | Months (last 12 months + 3 months projected) |
| **Y-axis** | Storage in GB or TB (auto-scaled) |
| **Bar color** | Primary brand color for actual data; lighter/hatched for projected |
| **Data source** | Aggregated `BackupRecord.size_bytes` per month |
| **Projection** | Linear extrapolation from last 3 months of actual data |
| **Tooltip** | On hover: "{month}: {size} ({count} backups)" |

**Below the chart**:

| Metric | Description | Data Type |
|--------|-------------|-----------|
| Total storage used | Current total across all backup types | string (formatted, e.g., "142.5 GB") |
| Storage growth rate | Average monthly growth over last 3 months | string (formatted, e.g., "+8.3 GB/month") |
| Projected storage (12 months) | Estimated total in 12 months | string (formatted, e.g., "242.1 GB") |
| Storage limit | If the platform tier has a storage cap | string (formatted, or "Unlimited") |

**Empty state**: "Not enough data to display storage trends. Charts will appear after the first month of backups."

---

##### Disaster Recovery Controls

Controls for monitoring region health and triggering manual failover.

**Region Status Card**:

| Field | Data Type | Description |
|-------|-----------|-------------|
| `current_serving_region` | varchar 50 | The region currently serving production traffic (e.g., "Toronto (ca-central-1)") |
| `primary_region_status` | enum: `healthy`, `degraded`, `down` | Health of the primary region |
| `secondary_region_status` | enum: `healthy`, `degraded`, `down` | Health of the secondary region |
| `replication_lag_seconds` | integer | How far behind the secondary replica is (0 = fully caught up) |
| `last_health_check` | timestamp with timezone | When the last health check ran |
| `mode` | enum: `primary`, `failover` | Whether the system is running in normal mode or failover mode |

**Status indicators**: Each region shows a colored dot (green = healthy, yellow = degraded, red = down) with the region name and status text.

**"Trigger Manual Failover" button**:

| State | Behavior |
|-------|----------|
| **Default** | Danger button (red outline): "Trigger Manual Failover" |
| **Disabled** | If system is already in failover mode or secondary region is down. Tooltip explains why. |
| **Confirmation** | Modal opens with the following fields (see below) |
| **Loading** | Full-page overlay: "Failover in progress... Routing traffic to {secondary_region}. Do not close this page." Progress steps shown as a vertical timeline. |
| **Success** | Modal: "Failover complete. All traffic is now served from {secondary_region}. Failover took {duration}." with a "Dismiss" button. |
| **Failure** | Modal: "Failover failed at step: {step}. Error: {error}. Primary region is still serving traffic. Contact platform engineering immediately." with "Dismiss" and "Retry" buttons. |

**Failover confirmation modal fields**:

| Field | Label | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-------|-----------|-----------|----------|---------|------------|---------------|
| `confirmation_text` | "Type FAILOVER to confirm" | varchar | 8 chars | Yes | -- | Must exactly equal `FAILOVER` (case-sensitive) | "Type FAILOVER to confirm. This routes all traffic to the backup region." |
| `reason` | "Reason for failover" | text | 500 chars | Yes | -- | Min: 10, Max: 500 | "Please provide a reason (10-500 characters)." |

**Failover History Table**:

| Column | Data Type | Sortable | Source |
|--------|-----------|----------|--------|
| Date | timestamp with timezone | Yes (default: newest first) | `FailoverEvent.started_at` |
| Type | enum: `automated`, `manual` | Yes | `FailoverEvent.trigger_type` |
| Triggered By | varchar (user name or "System") | No | `FailoverEvent.triggered_by` -> User name, or "System" if automated |
| From | varchar | No | `FailoverEvent.source_region` |
| To | varchar | No | `FailoverEvent.target_region` |
| Duration | string (formatted) | Yes | `FailoverEvent.duration_seconds`, formatted as "Xm Ys" |
| Status | enum | Yes | `FailoverEvent.status` |
| Data Loss | string (formatted) | No | `FailoverEvent.data_loss_seconds`, formatted as "X seconds" or "None" |
| Reason | text (truncated) | No | `FailoverEvent.reason`, truncated to 100 chars with tooltip for full text |

**Empty state**: "No failover events recorded. This is a good thing -- it means the system has been running on the primary region without interruption."

---

##### Data Export (Compliance)

Tools for exporting all data for a specific property, used for compliance requests (PIPEDA right-to-access, legal discovery, etc.).

**"Export All Property Data" button**:

| State | Behavior |
|-------|----------|
| **Default** | Secondary button: "Export All Property Data" |
| **Click** | Opens a configuration modal (see fields below) |
| **Loading** | Modal content replaced with progress bar: "Generating export for {property_name}... This may take 30-60 minutes for large properties. You will be notified by email when the export is ready." |
| **Success** | Toast: "Export generated. Download link sent to {email}." Modal closes. Export appears in the export history table below. |
| **Failure** | Modal error: "Export failed: {error}. No data has been sent. Try again or contact support." |

**Export configuration modal fields**:

| Field | Label | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-------|-----------|-----------|----------|---------|------------|---------------|
| `property_id` | "Property" | UUID (dropdown) | -- | Yes | -- | Must be a valid property | "Select a property to export." |
| `format` | "Export format" | enum | -- | Yes | `json` | One of: `json`, `csv` | "Export format must be JSON or CSV." |
| `include_files` | "Include uploaded files (photos, documents, signatures)" | boolean | -- | Yes | `true` | -- | -- |
| `date_range_start` | "From date (optional)" | date | -- | No | `null` | Must be before date_range_end if both provided | "Start date must be before end date." |
| `date_range_end` | "To date (optional)" | date | -- | No | `null` | Must be after date_range_start if both provided | "End date must be after start date." |
| `recipient_email` | "Send download link to" | email | 320 chars | Yes | Super Admin's email | Valid email format | "A valid email address is required." |
| `export_reason` | "Reason for export" | text | 500 chars | Yes | -- | Min: 5, Max: 500 | "Please provide a reason for this export (5-500 characters)." |

**Export history table** (below the button):

| Column | Data Type | Source |
|--------|-----------|--------|
| Date | timestamp | Export request timestamp |
| Property | varchar | Property name |
| Format | enum | JSON or CSV |
| Size | string (formatted) | File size |
| Status | enum: `generating`, `ready`, `downloaded`, `expired` | Export status |
| Requested By | varchar | Super Admin name |
| Reason | text (truncated) | Export reason |
| Actions | -- | "Download" (if ready), "Delete" (if ready or expired) |

**Download link expiry**: 7 days. After expiry, the export file is permanently deleted and status changes to `expired`.

**Empty state**: "No data exports have been requested. Use the button above to generate a compliance export for any property."

---

##### Alerts Configuration

Configure who receives notifications for backup, verification, and disaster recovery events.

| Alert Type | Description | Default Recipients | Channels Available |
|------------|-------------|-------------------|-------------------|
| Backup failure | A scheduled backup did not complete successfully | Super Admin | Email, SMS |
| Backup warning | A backup completed but took longer than expected (>2 hours) | Super Admin | Email |
| Verification failure | Automated integrity verification failed one or more checks | Super Admin | Email, SMS |
| Verification overdue | No verification has run in 10+ days | Super Admin | Email |
| Failover triggered | Automated or manual failover has started | Super Admin | Email, SMS, Push |
| Failover completed | Failover has finished (success or failure) | Super Admin | Email, SMS, Push |
| Storage threshold | Backup storage exceeds 80% of tier limit (if applicable) | Super Admin | Email |
| Breach detected | A BreachIncident record has been created | Super Admin | Email, SMS, Push |

**Configuration per alert type**:

| Field | Label | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-------|-----------|-----------|----------|---------|------------|---------------|
| `enabled` | "Enabled" | boolean | -- | Yes | `true` | -- | -- |
| `email_recipients` | "Email recipients" | varchar array | 320 chars each, max 10 entries | Yes (if enabled) | Super Admin email | Each must be a valid email | "Each recipient must be a valid email address (max 10 recipients)." |
| `sms_recipients` | "SMS recipients" | varchar array | 20 chars each, max 5 entries | No | -- | Each must be a valid phone number (E.164 format) | "Each SMS recipient must be a valid phone number in E.164 format (max 5 recipients)." |
| `push_enabled` | "Send push notification" | boolean | -- | Yes | `true` for critical alerts, `false` for warnings | -- | -- |

Each alert type is displayed as a collapsible row. Expanding a row shows the recipient configuration fields.

**"Save Alert Settings" button**:

| State | Behavior |
|-------|----------|
| **Default** | Primary button, disabled until at least one field changes |
| **Loading** | Spinner + "Saving..." |
| **Success** | Toast: "Alert settings saved." |
| **Failure** | Inline error: "Could not save alert settings: {error}." |

**"Test Alerts" button** (per alert type):

| State | Behavior |
|-------|----------|
| **Default** | Text link: "Send test alert" |
| **Loading** | "Sending..." |
| **Success** | Inline confirmation: "Test alert sent to {count} recipients." |
| **Failure** | Inline error: "Test failed: {error}." |

**Empty state**: Not applicable -- all alert types are always shown with their default configuration.

---

## 4. Data Model

### 4.1 PropertySettings

```
PropertySettings
 ├── id (UUID)
 ├── property_id → Property (unique)
 ├── property_name (varchar 200)
 ├── legal_name (varchar 300, nullable)
 ├── address_street (varchar 500)
 ├── address_city (varchar 100)
 ├── address_province (varchar 100)
 ├── address_country (varchar 100, default "Canada")
 ├── address_postal_code (varchar 10)
 ├── corporation_number (varchar 50, nullable)
 ├── total_floors (integer, 1-200)
 ├── total_units (integer, 1-5000)
 ├── year_built (integer, nullable)
 ├── timezone (varchar 50, IANA format)
 ├── logo_url (varchar 500, nullable)
 ├── welcome_message (text, 2000 chars, nullable)
 ├── description (varchar 500, nullable)
 ├── contacts (JSONB — array of contact objects)
 ├── operational_toggles (JSONB — key-value boolean map)
 ├── branding (JSONB — colors, logos, login page config)
 ├── created_at (timestamp with timezone)
 ├── updated_at (timestamp with timezone)
 └── updated_by → User
```

### 4.2 CustomFieldDefinition

```
CustomFieldDefinition
 ├── id (UUID)
 ├── property_id → Property
 ├── entity_type (enum: event, unit, resident, maintenance_request)
 ├── field_key (varchar 50, unique per property+entity_type)
 ├── field_label (varchar 100)
 ├── field_type (enum: text, number, date, boolean, dropdown, multi_select, url, email, phone, textarea)
 ├── required (boolean, default false)
 ├── default_value (JSONB, nullable)
 ├── placeholder (varchar 100, nullable)
 ├── help_text (varchar 200, nullable)
 ├── options (JSONB — for dropdown/multi_select)
 ├── validation_rules (JSONB — min, max, regex, etc.)
 ├── sort_order (integer)
 ├── active (boolean, default true)
 ├── created_at (timestamp with timezone)
 └── updated_at (timestamp with timezone)
```

### 4.3 NotificationTemplate

```
NotificationTemplate
 ├── id (UUID)
 ├── property_id → Property
 ├── name (varchar 100)
 ├── channel (enum: email, sms, push, voice)
 ├── trigger_event_type_id → EventType (nullable)
 ├── trigger_system_event (varchar 50, nullable)
 ├── trigger_action (enum: on_create, on_close, on_update, scheduled)
 ├── subject (varchar 200, nullable — email only)
 ├── body (text, channel-specific max)
 ├── active (boolean, default true)
 ├── created_at (timestamp with timezone)
 └── updated_at (timestamp with timezone)
```

### 4.4 AuditEntry

```
AuditEntry
 ├── id (UUID)
 ├── property_id → Property (nullable — null for system-level)
 ├── user_id → User
 ├── user_name (varchar 200 — denormalized for immutability)
 ├── user_role (varchar 100 — denormalized)
 ├── action (enum: create, update, delete, login, logout, export, configure, import)
 ├── module (varchar 50)
 ├── entity_type (varchar 50)
 ├── entity_id (UUID, nullable)
 ├── before_state (JSONB, nullable)
 ├── after_state (JSONB, nullable)
 ├── ip_address (varchar 45)
 ├── user_agent (varchar 500)
 ├── created_at (timestamp with timezone)
 └── ai_summary (text, nullable — AI-generated change description)
```

### 4.5 ApiKey

```
ApiKey
 ├── id (UUID)
 ├── name (varchar 100)
 ├── key_hash (varchar 200 — bcrypt hash, original never stored)
 ├── key_prefix (varchar 10 — first 8 chars for identification)
 ├── scopes (JSONB — array of scope strings)
 ├── property_ids (JSONB — array of property UUIDs, or ["*"] for all)
 ├── rate_limit (integer — calls per hour)
 ├── ip_whitelist (JSONB — array of IP/CIDR strings, nullable)
 ├── expires_at (timestamp, nullable)
 ├── last_used_at (timestamp, nullable)
 ├── revoked_at (timestamp, nullable)
 ├── created_by → User
 ├── created_at (timestamp with timezone)
 └── updated_at (timestamp with timezone)
```

### 4.6 BuzzerCode

```
BuzzerCode
 ├── id (UUID)
 ├── property_id → Property
 ├── unit_id → Unit
 ├── code (varchar 20)
 ├── comments (text, 500 chars, nullable)
 ├── created_at (timestamp with timezone)
 ├── updated_at (timestamp with timezone)
 └── updated_by → User
```

---

## 5. User Flows

### 5.1 Super Admin: Onboarding a New Property

1. Super Admin clicks "Add Property" from the multi-property dashboard
2. Property Onboarding Wizard opens (Step 1 of 8)
3. Super Admin fills in property details (name, address, floors, units, timezone)
4. Super Admin creates the Property Admin account with a temporary password
5. Super Admin selects which modules to enable for this property
6. Super Admin reviews default event types, optionally customizes
7. Super Admin configures notification channels (email provider, SMS provider)
8. Super Admin optionally uploads branding (logo, colors)
9. Super Admin optionally imports resident/unit data via CSV
10. Super Admin reviews the full summary and clicks "Launch Property"
11. System creates all entities, sends welcome email to Property Admin
12. Super Admin is redirected to the new property's dashboard

### 5.2 Property Admin: Configuring Event Types

1. Property Admin navigates to Settings > Event Type Configuration
2. Sees list of event groups with their event types listed beneath
3. Clicks "Add Event Type" -- slide-over panel opens
4. Fills in: name, selects group, picks icon, sets color, configures toggles
5. Optionally adds custom fields specific to this event type
6. Optionally links notification templates (create/close)
7. Clicks "Create Event Type" -- validation runs
8. On success: panel closes, new type appears in list, immediately available for event creation

### 5.3 Property Admin: Creating a Custom Role

1. Navigate to Settings > Role & Permission Management
2. Click "Create Custom Role"
3. Enter role name, select base role, provide description
4. Review the permission matrix -- all permissions are inherited from base role
5. Toggle individual permissions on/off (cannot exceed own permissions)
6. Click "Create Role" -- validation confirms unique name and valid permissions
7. New role appears in the role list, immediately available for user assignment

### 5.4 Property Admin: Managing Notification Templates

1. Navigate to Settings > Notification Templates
2. See table of existing templates grouped by trigger event
3. Click "Add Template" -- slide-over opens
4. Select channel (Email), trigger event (Package Arrival), trigger action (On Create)
5. Write subject line using merge fields: "Package for {{resident_name}} in Unit {{unit_number}}"
6. Write body using the rich text editor with merge field toolbar
7. Click "Preview" to see rendered template with sample data
8. Click "Send Test" to receive the template at own email
9. Click "Save Template" to activate

### 5.5 Staff (Read-Only): Viewing Audit Log

1. Property Manager navigates to Settings > Audit Log
2. Sees the last 100 entries by default (newest first)
3. Uses the date range picker to narrow to last 7 days
4. Filters by Module: "Packages" to see only package-related changes
5. Expands a row to see the before/after diff
6. Reads the AI-generated change summary
7. Cannot edit, delete, or export (read-only access for Property Manager)

---

## 6. UI/UX

### 6.1 Layout Structure

**Desktop** (1280px+):
- Left sidebar: Settings tab navigation (vertical list with icons)
- Main content area: Selected tab's content
- Tab content uses a max-width of 800px, centered, with generous padding

**Tablet** (768px-1279px):
- Collapsible sidebar -- tabs shown as a horizontal scrollable strip at top
- Content area takes full width below the tab strip

**Mobile** (< 768px):
- Tab navigation becomes a dropdown selector at the top
- All content stacks vertically
- Forms use full-width fields
- Tables switch to card view

### 6.2 Empty States

| Tab | Empty State Message | CTA |
|-----|--------------------|----|
| Event Types | "No custom event types yet. Your property is using system defaults." | "Add Event Type" button |
| Maintenance Categories | "Using 43 default categories. Customize them to match your property." | "Customize Categories" button |
| Notification Templates | "No custom notification templates. Events will use system default messages." | "Create Template" button |
| Custom Fields | "No custom fields configured. Add fields to capture property-specific data." | "Add Custom Field" button |
| Buzzer Codes | "No buzzer codes registered. Add codes individually or import from CSV." | "Add Buzzer Code" / "Import CSV" buttons |
| API Keys | "No API keys created. Generate a key to connect third-party integrations." | "Generate API Key" button |
| Audit Log | "No activity recorded yet. Actions will appear here as users interact with the system." | None |

### 6.3 Loading States

- **Tab switching**: Content area shows a skeleton loader matching the tab's layout (table skeleton, form skeleton, or chart skeleton)
- **Form submission**: Primary button shows spinner and disabled state; all form fields become read-only
- **Data tables**: Show shimmer rows (5 rows of grey boxes matching column widths)
- **Charts/dashboards**: Show outline of chart area with pulsing grey fill

### 6.4 Error States

- **Tab load failure**: Full-width error card: "Failed to load {tab name}. [Retry] [Contact Support]"
- **Form validation**: Inline errors below each invalid field in red text, field border turns red
- **Save failure**: Red toast notification at top-right: "Failed to save changes. Your edits are preserved -- try again."
- **Permission denied**: Full-tab message: "You do not have permission to access this section. Contact your Property Admin."

### 6.5 Progressive Disclosure

Settings that fewer than 20% of properties will change are hidden behind "Show Advanced Settings" toggles:

| Tab | Advanced Section |
|-----|-----------------|
| Property Setup | Welcome Message, Description, Corporation Number, Year Built |
| Event Types | Expiry Hours, Reference Number Prefix, AI Features config |
| Amenity Management | Custom CSS, Maintenance Blackout Dates |
| Notification Templates | Voice channel configuration |
| Branding | Custom CSS, Login Page Background |
| AI Configuration | Per-feature provider/model overrides |

### 6.6 Design Rules

- White background throughout. No dark panels or colored sections
- Settings labels are left-aligned, 14px, medium weight, #1D1D1F
- Input fields: 16px height, 1px solid #D1D1D6 border, 8px border-radius
- Toggle switches: 48x28px, green (#34C759) when on, grey (#E5E5EA) when off
- Section headers: 18px, semibold, #1D1D1F, 32px top margin
- Tooltips: triggered on hover/tap of "?" icon, appear below the icon, max 200 chars, light grey background
- One primary button per section, aligned right. Secondary buttons use ghost/outline style

---

## 7. AI Integration

### 7.1 Settings-Specific AI Features

| ID | Feature | Description | Model | Cost | Trigger |
|----|---------|-------------|-------|------|---------|
| 1 | Audit Log Change Summarization | Generates plain-English summaries of audit log entries | Haiku | $0.001 | On audit entry creation |
| 2 | Configuration Recommendations | Suggests optimal settings based on property size, type, and usage patterns | Sonnet | $0.005 | On first setup or on demand |
| 3 | Anomalous Settings Detection | Flags unusual configuration changes (e.g., all notifications disabled, all AI turned off) | Haiku | $0.001 | On settings save |
| 4 | Template Grammar Check | Checks notification templates for grammar and tone before saving | Haiku | $0.001 | On template save |
| 5 | Import Data Validation | AI-assisted column mapping and data quality assessment during CSV import | Sonnet | $0.005 | On import file upload |
| 6 | System Health Insights | Generates actionable insights from system health metrics | Sonnet | $0.01 | Hourly (Super Admin dashboard) |

### 7.2 Graceful Degradation

| Feature | Fallback When AI Unavailable |
|---------|------------------------------|
| Audit change summaries | Raw before/after JSON displayed without summary |
| Configuration recommendations | No recommendations shown; admin configures manually |
| Anomalous settings detection | No automatic flagging; changes save without warning |
| Template grammar check | Template saves without grammar review |
| Import validation | Standard rule-based validation only |
| System health insights | Raw metrics without narrative insights |

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric | Description | Frequency |
|--------|-------------|-----------|
| Settings changes per day | Count of configuration changes | Real-time |
| Most modified settings | Which settings are changed most often | Weekly |
| Role distribution | Breakdown of users by role across properties | Real-time |
| Custom field usage | Which custom fields are actually filled in by users | Weekly |
| Template effectiveness | Open rates and engagement for notification templates | Daily |
| Import/export volume | Count and size of data imports and exports | Monthly |

### 8.2 Performance Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Settings page load time | Time to render any settings tab | < 500ms |
| Settings save latency | Time to persist a settings change | < 1000ms |
| Import processing speed | Records processed per second during CSV import | > 100 records/sec |
| Audit log query time | Time to return filtered audit log results | < 2000ms |
| API key validation time | Time to validate an API key on request | < 50ms |

### 8.3 AI Insights

| Insight | Description |
|---------|-------------|
| "3 notification templates have < 10% open rate" | Suggests reviewing underperforming templates |
| "Custom field {name} is filled in only 5% of the time" | Suggests deactivating or making optional |
| "Property {name} has 0 active event types in the Cleaning group" | Suggests enabling cleaning log if the property has cleaning staff |
| "AI spend increased 40% this week -- Package OCR is the top contributor" | Alerts on unexpected cost increases |

---

## 9. Notifications

### 9.1 Settings-Related Notifications

| Trigger | Recipients | Channels | Template |
|---------|-----------|----------|----------|
| Property launched | Property Admin | Email | Welcome email with login credentials and getting-started guide |
| Role changed | Affected user | Email + Push | "Your role has been updated to {new_role}" |
| API key expiring | Super Admin | Email | "API key {name} expires in {days} days" (30, 7, 1 day warnings) |
| AI budget threshold reached | Super Admin | Email + Push | "AI spend has reached {percent}% of your {period} budget" |
| System health alert | Super Admin | Email + SMS | "System alert: {metric} has exceeded threshold ({value})" |
| Failed login lockout | Property Admin + affected user | Email | "Account {email} locked after 5 failed login attempts" |
| Import completed | Initiating admin | Email + Push | "Data import completed: {success} imported, {failed} failed" |
| Billing invoice issued | Super Admin | Email | "Invoice #{number} for ${amount} is ready" |
| Settings change (critical) | Property Admin | Push | "Settings changed: {change_summary}" (only for critical toggles like disabling modules) |

### 9.2 Notification Preferences

Property Admins can configure which settings-related notifications they receive and through which channels (email, SMS, push). System health and billing notifications cannot be disabled for Super Admin.

---

## 10. API

### 10.1 Settings Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/properties/{id}/settings` | Get all property settings | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings` | Update property settings | Property Admin+ |
| GET | `/api/v1/properties/{id}/settings/event-types` | List event types | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/event-types` | Create event type | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/event-types/{id}` | Update event type | Property Admin+ |
| DELETE | `/api/v1/properties/{id}/settings/event-types/{id}` | Deactivate event type | Property Admin+ |
| GET | `/api/v1/properties/{id}/settings/event-groups` | List event groups | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/event-groups` | Create event group | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/event-groups/{id}` | Update event group | Property Admin+ |
| GET | `/api/v1/properties/{id}/settings/notification-templates` | List templates | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/notification-templates` | Create template | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/notification-templates/{id}` | Update template | Property Admin+ |
| DELETE | `/api/v1/properties/{id}/settings/notification-templates/{id}` | Delete template | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/notification-templates/{id}/test` | Send test notification | Property Admin+ |
| GET | `/api/v1/properties/{id}/settings/roles` | List roles | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/roles` | Create custom role | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/roles/{id}` | Update role permissions | Property Admin+ |
| DELETE | `/api/v1/properties/{id}/settings/roles/{id}` | Delete custom role | Property Admin+ |
| GET | `/api/v1/properties/{id}/settings/custom-fields` | List custom fields | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/custom-fields` | Create custom field | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/custom-fields/{id}` | Update custom field | Property Admin+ |
| GET | `/api/v1/properties/{id}/settings/buzzer-codes` | List buzzer codes | Concierge+ |
| POST | `/api/v1/properties/{id}/settings/buzzer-codes` | Create buzzer code | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/buzzer-codes/{id}` | Update buzzer code | Property Admin+ |
| DELETE | `/api/v1/properties/{id}/settings/buzzer-codes/{id}` | Delete buzzer code | Property Admin+ |
| GET | `/api/v1/properties/{id}/audit-log` | Query audit log | Property Manager+ |
| GET | `/api/v1/audit-log` | Query global audit log | Super Admin |
| GET | `/api/v1/properties/{id}/settings/maintenance-categories` | List categories | Property Admin+ |
| POST | `/api/v1/properties/{id}/settings/maintenance-categories` | Create category | Property Admin+ |
| PATCH | `/api/v1/properties/{id}/settings/maintenance-categories/{id}` | Update category | Property Admin+ |

### 10.2 Super Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/properties` | Create property (onboarding wizard) | Super Admin |
| GET | `/api/v1/properties` | List all properties | Super Admin |
| DELETE | `/api/v1/properties/{id}` | Deactivate property | Super Admin |
| GET | `/api/v1/system/health` | System health dashboard | Super Admin |
| GET | `/api/v1/system/ai/dashboard` | AI cost dashboard | Super Admin |
| PATCH | `/api/v1/system/ai/config` | Update AI configuration | Super Admin |
| POST | `/api/v1/system/ai/emergency-shutdown` | Emergency AI shutdown | Super Admin |
| GET | `/api/v1/system/api-keys` | List API keys | Super Admin |
| POST | `/api/v1/system/api-keys` | Generate API key | Super Admin |
| DELETE | `/api/v1/system/api-keys/{id}` | Revoke API key | Super Admin |
| GET | `/api/v1/system/billing/invoices` | List invoices | Super Admin |
| GET | `/api/v1/system/billing/plan` | Current plan details | Super Admin |
| POST | `/api/v1/properties/{id}/import` | Start data import | Property Admin+ |
| GET | `/api/v1/properties/{id}/import/{job_id}` | Import job status | Property Admin+ |
| POST | `/api/v1/properties/{id}/export` | Start data export | Property Admin+ |

### 10.3 Rate Limits

| Endpoint Group | Rate Limit | Burst |
|----------------|-----------|-------|
| Settings read | 100/minute | 200 |
| Settings write | 30/minute | 50 |
| Audit log | 60/minute | 100 |
| Import/export | 5/minute | 10 |
| System health | 30/minute | 60 |
| API key management | 10/minute | 20 |

### 10.4 Error Responses

| Code | Description | Example |
|------|-------------|---------|
| 400 | Validation error | `{"error": "validation_error", "fields": {"property_name": "Property name is required"}}` |
| 401 | Unauthorized | `{"error": "unauthorized", "message": "Valid authentication required"}` |
| 403 | Forbidden | `{"error": "forbidden", "message": "Super Admin access required"}` |
| 404 | Not found | `{"error": "not_found", "message": "Event type not found"}` |
| 409 | Conflict | `{"error": "conflict", "message": "Event type name already exists"}` |
| 422 | Unprocessable | `{"error": "unprocessable", "message": "Cannot delete role with assigned users"}` |
| 429 | Rate limited | `{"error": "rate_limited", "message": "Too many requests", "retry_after": 30}` |
| 500 | Server error | `{"error": "internal_error", "message": "An unexpected error occurred"}` |

---

### 3.17 Backup & Recovery Settings (Super Admin Only)

**Tab Label**: "Backup & Recovery"
**Access**: Super Admin only (hidden from all other roles)
**Tooltip**: "Monitor backup health, configure retention policies, and manage disaster recovery for all properties."

#### 3.17.1 Backup Health Dashboard

**Layout**: Full-width card grid (1920x1080 optimized)

**Per-Property Backup Status Cards** (one card per property):
| Field | Type | Description |
|-------|------|-------------|
| Property Name | Display | Property name with status indicator dot |
| Last Backup | Display | Timestamp of last successful backup (e.g., "2 hours ago") |
| Backup Size | Display | Current backup size with trend arrow (↑↓→) |
| Status | Badge | Green: Healthy / Yellow: Warning / Red: Critical |
| Next Scheduled | Display | Next backup timestamp |
| PITR Window | Display | Available point-in-time recovery range |
| Storage Used | Progress Bar | Percentage of allocated storage used |

**Status Definitions**:
- **Green (Healthy)**: Last backup < 24 hours, last integrity check passed
- **Yellow (Warning)**: Last backup 24-48 hours, OR integrity check pending, OR storage > 80%
- **Red (Critical)**: Last backup > 48 hours, OR integrity check failed, OR storage > 95%, OR 2+ consecutive backup failures

**Actions per property**:
- "Run Backup Now" button (with confirmation dialog: "This will create an immediate backup for [Property Name]. Continue?")
- "View History" → expands to show last 30 backup entries (timestamp, type, size, duration, status)
- "Test Restore" → initiates integrity verification (with confirmation: "This will test-restore [Property Name] data to a staging environment. No production data will be affected. Continue?")
- "Configure" → opens retention policy settings for that property

**Summary Bar** (top of page):
- Total properties: [count]
- Healthy: [count] (green)
- Warning: [count] (yellow)
- Critical: [count] (red)
- Total storage used: [X GB of Y GB]
- Last integrity verification: [timestamp]

#### 3.17.2 Retention Policy Configuration

**Per-Property Settings** (expandable accordion):
| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| Hot Retention | Number + "days" | 7 | Min: 7, Max: 30 | Days backups stay instantly restorable |
| Warm Retention | Number + "days" | 30 | Min: 30, Max: 90 | Days backups stay in secondary region |
| Cold Retention | Number + "days" | 365 | Min: 90, Max: 2555 (7 years) | Days backups in cold storage |
| Archive Retention | Number + "years" | 7 | Min: 1, Max: 25 | Years for regulatory archive |
| Auto-Delete Expired | Toggle | On | — | Automatically delete backups past retention |

**Global Override**: Super Admin can set default retention for all properties at once, then customize individual properties.
**Compliance Warning**: If retention is set below regulatory minimums, show warning: "This retention period may not meet regulatory requirements (PIPEDA). Minimum recommended: [X] days."

#### 3.17.3 Disaster Recovery Controls

**Recovery Actions** (each with 2-step confirmation):
| Action | Description | Confirmation Steps | ETA |
|--------|-------------|-------------------|-----|
| Restore Records | Restore specific records from PITR | Select property → Select time range → Confirm | 15 min |
| Restore Property | Full restore of one property's data | Select property → Select backup → Type property name to confirm | 1 hour |
| Restore Database | Full database restoration | Select backup → Type "RESTORE ALL" → Enter Super Admin password | 4 hours |
| Geographic Failover | Switch to secondary region | Confirm primary is unavailable → Type "FAILOVER" → Enter Super Admin password | 30 min |

**Recovery Status Dashboard** (visible during active recovery):
- Progress bar with percentage and ETA
- Affected properties list
- Current step description
- Log stream (real-time)
- "Abort Recovery" button (with confirmation)

**Communication During Recovery**:
- Auto-send status email to all Property Admins when recovery starts
- Template: "System maintenance in progress. Estimated completion: [ETA]. Your data is safe."
- Auto-send completion email when recovery finishes
- Template: "System maintenance complete. All data has been verified. If you notice any issues, contact support."

#### 3.17.4 Backup Alerts Configuration

| Alert | Default Channel | Threshold | Configurable |
|-------|----------------|-----------|--------------|
| Backup Failure | Email + SMS | 2 consecutive failures | Yes (1-5) |
| Size Anomaly | Email | >30% change from average | Yes (10-50%) |
| Storage Warning | Email | 80% capacity | Yes (70-95%) |
| Storage Critical | Email + SMS | 95% capacity | Yes (85-99%) |
| Integrity Failure | Email + SMS + Push | Any failure | Not configurable (always on) |
| PITR Gap | Email + SMS | Any gap > 1 hour | Yes (1-24 hours) |

#### 3.17.5 Backup Audit Log

**Immutable log of all backup-related operations**:
| Column | Description |
|--------|-------------|
| Timestamp | When the operation occurred |
| Operation | Backup / Restore / Verify / Delete / Config Change |
| Property | Which property (or "All") |
| Initiated By | System / Super Admin name |
| Status | Success / Failed / In Progress |
| Details | Size, duration, error message if failed |
| Result | Verification result if applicable |

**Filters**: Date range, operation type, property, status
**Export**: CSV, Excel, PDF

---

## 11. Completeness Checklist

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | Property setup with all building information fields | Done | 3.1 |
| 2 | Contact management with repeatable blocks | Done | 3.1.2 |
| 3 | Operational toggles with tooltips | Done | 3.1.3 |
| 4 | Configurable event types and event groups | Done | 3.2 |
| 5 | Maintenance category tree (43 defaults) | Done | 3.3 |
| 6 | Amenity configuration with booking rules | Done | 3.4 |
| 7 | Multi-channel notification templates with merge fields | Done | 3.5 |
| 8 | Visual role & permission management | Done | 3.6 |
| 9 | Custom fields configuration (JSONB-backed) | Done | 3.7 |
| 10 | AI configuration (keys, budgets, per-feature toggles) | Done | 3.8 |
| 11 | Branding & theming with accessibility checks | Done | 3.9 |
| 12 | Immutable audit log with before/after diffs | Done | 3.10 |
| 13 | System health monitoring dashboard | Done | 3.11 |
| 14 | Billing & subscription management | Done | 3.12 |
| 15 | Data import with validation preview | Done | 3.13 |
| 16 | Data export in multiple formats | Done | 3.13.2 |
| 17 | API key management with scoping and revocation | Done | 3.14 |
| 18 | Buzzer code directory with unit-based lookup | Done | 3.15 |
| 19 | Property onboarding wizard (8 steps) | Done | 3.16.1 |
| 20 | Multi-property management dashboard | Done | 3.16.2 |
| 21 | AI cost dashboard | Done | 3.16.3 |
| 22 | Desktop, tablet, and mobile layouts defined | Done | 6.1 |
| 23 | Empty states for all tabs | Done | 6.2 |
| 24 | Loading states for all async operations | Done | 6.3 |
| 25 | Error states for all failure scenarios | Done | 6.4 |
| 26 | Progressive disclosure for advanced settings | Done | 6.5 |
| 27 | Every button: action, loading, success, failure states | Done | Throughout 3.x |
| 28 | Every field: type, max length, required, validation, error | Done | Throughout 3.x |
| 29 | AI integration with graceful degradation | Done | 7 |
| 30 | Operational, performance, and AI analytics | Done | 8 |
| 31 | Notification triggers and templates | Done | 9 |
| 32 | Complete API endpoint inventory | Done | 10 |
| 33 | Rate limiting per endpoint group | Done | 10.3 |
| 34 | Error response formats | Done | 10.4 |
| 35 | Data model for all new entities | Done | 4 |
| 36 | User flows for key admin workflows | Done | 5 |
| 37 | No competitor names referenced | Done | Throughout |
| 38 | Security provider configuration (name, logo, contact) | Done | 3.1.2a |
| 39 | Auto-CC recipients per event type | Done | 3.2.2 |
| 40 | Signature capture method configuration | Done | 3.1.3 |
| 41 | Parking pass format configuration | Done | 3.1.3 |
| 42 | System default notification templates (6 pre-loaded) | Done | 3.5 |
| 43 | Welcome / Onboarding Email template with merge fields | Done | 3.5 |
| 44 | Backup health monitoring dashboard | Done | 3.17.1 |
| 45 | Retention policy configuration per property | Done | 3.17.2 |
| 46 | Disaster recovery controls with 2-step confirmation | Done | 3.17.3 |
| 47 | Backup alerts configuration | Done | 3.17.4 |
| 48 | Backup audit log with immutable history | Done | 3.17.5 |

---

*End of document.*
