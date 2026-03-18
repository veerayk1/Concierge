# 01 — Architecture Specification

> **Document type**: Product Requirements Document (PRD)
> **Status**: Draft
> **Last updated**: 2026-03-14

---

## 1. Overview

Concierge is a **multi-tenant, role-aware building management platform** with AI-native intelligence. It is purpose-built for condominium and residential building management, combining the best patterns observed across industry research and competitive analysis into a single, cohesive product.

### Core Characteristics

- **Multi-tenant**: Supports 1 to N properties per management company, with full data isolation between properties
- **Role-aware**: 5+ distinct user roles (Front Desk, Security Guard, Property Manager, Board Member, Resident), each with a fundamentally different interface — not just permission-gated access to the same UI
- **AI-native**: Artificial intelligence is a first-class service layer, not a bolt-on feature. Every module can call AI capabilities through a unified gateway
- **Real-time collaborative**: Multiple staff members working the same shift see live updates without refreshing
- **Offline-capable**: Mobile clients queue operations when disconnected and sync transparently on reconnect
- **Configurable, not coded**: Event types, categories, custom fields, notification templates, and roles are all managed by administrators without engineering involvement

### What This Document Covers

This specification defines **what the architecture must support** — the entities, relationships, data flows, and system capabilities that every module in the platform depends on. Individual module PRDs (02 through 19) reference this document for foundational patterns.

---

## 2. Core Architectural Principles

### 2.1 Unified Event Model

Everything that happens in a building — a package arriving, a noise complaint, a fire alarm, a visitor check-in, a cleaning log entry — is an **Event**. Events have configurable **Event Types** organized into **Event Groups**.

This is the single most important architectural decision in Concierge. Properties must be able to add, remove, rename, and customize event types without any code changes. A property that tracks dry cleaning pickups and another that tracks boat slip assignments must both be served by the same event infrastructure.

Each event type defines its own: icon, color, default priority, notification templates (on create and on close), whether it appears on lobby displays, which custom fields are required, and which AI features are active.

**Why this matters**: Industry research revealed that platforms with hardcoded log types (e.g., exactly 6 types with no ability to add more) force properties into workarounds. Platforms with configurable event systems are dramatically more adaptable.

### 2.2 Multi-Tenancy

Every row of data belongs to a property. Management companies oversee multiple properties but cannot accidentally cross-contaminate data. Super Admins see everything; Property Admins see only their assigned properties.

- Property-level data isolation at the application layer
- Shared infrastructure (database, compute) with logical separation
- Cross-property portfolio dashboards for management companies
- Property-specific configuration (event types, custom fields, branding) with the ability to inherit shared templates

### 2.3 Role-Aware Rendering

The same API endpoint returns different data shapes and action sets based on the authenticated user's role. This is not simple permission gating — it is a fundamentally different experience per role:

| Role                       | Primary View               | Core Actions                                                                     | Hidden From                                              |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Front Desk / Concierge** | Event grid + quick actions | Package intake, visitor log, shift notes, unit instructions                      | Alteration projects, financial reports, board governance |
| **Security Guard**         | Security dashboard         | Incident log, parking violations, FOB tracking, emergency contacts, camera feeds | Maintenance requests, purchase orders, surveys           |
| **Property Manager**       | Management dashboard       | All maintenance, vendor compliance, alteration tracking, reports, financials     | Batch package entry, shift log                           |
| **Board Member**           | Governance view            | Reports, financials, alteration approvals, building analytics                    | Operational details, individual unit data                |
| **Resident**               | Resident portal            | Their packages, maintenance requests, bookings, announcements                    | All staff and administrative functions                   |

Navigation menus, dashboard widgets, available actions, and even the data columns in tables adapt per role. Features a user cannot access must be completely invisible — never shown in a disabled or grayed-out state.

API responses include all user-facing labels and messages in the requesting user's locale. The client never hardcodes display strings — every label, error message, and status name is a translation key resolved server-side. See Section 12 for the full i18n architecture.

### 2.4 AI as a Service Layer

AI capabilities are exposed through an internal gateway service that any module can call. The AI layer is:

- **Dual-provider**: Routes requests to Claude (Anthropic) or OpenAI based on Super Admin configuration per feature
- **Gracefully degrading**: Every feature that uses AI must work without it. AI enhances — it never gates
- **Privacy-first**: PII is stripped before any external API call
- **Cost-tracked**: Every AI invocation is metered, logged, and attributable to a property
- **Rate-limited and cached**: Identical queries within a window return cached results

### 2.5 Real-Time Updates

WebSocket connections deliver live updates for collaborative staff scenarios. When one concierge logs a package, every other staff member viewing the package list sees the new entry appear without refreshing.

Real-time updates apply to:

- Event creation, status changes, and closures
- Maintenance request updates
- Shift log entries
- Notification delivery confirmations
- Amenity reservation changes

#### WebSocket Event Type Enumeration (Gap 1.2)

The following table defines which event types trigger real-time WebSocket pushes and which use standard polling. All WebSocket messages include `property_id`, `building_id`, `event_type`, `entity_id`, `version`, and `timestamp` fields.

| #   | Event Type                  | Channel Pattern               | Trigger                                                                 | Recipients                                                                     | Delivery              |
| --- | --------------------------- | ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------- |
| 1   | `event.created`             | `property.{id}.events`        | New event logged (any type: package, visitor, incident, cleaning, etc.) | All staff currently viewing the event list or dashboard                        | WebSocket (real-time) |
| 2   | `event.updated`             | `property.{id}.events`        | Event status change, comment added, or fields edited                    | All staff currently viewing the event list, detail page, or dashboard          | WebSocket (real-time) |
| 3   | `event.closed`              | `property.{id}.events`        | Event marked as closed/resolved                                         | Same as event.updated                                                          | WebSocket (real-time) |
| 4   | `package.created`           | `property.{id}.packages`      | New package logged                                                      | Staff on package list; resident via push notification                          | WebSocket (real-time) |
| 5   | `package.released`          | `property.{id}.packages`      | Package picked up by resident                                           | Staff on package list                                                          | WebSocket (real-time) |
| 6   | `maintenance.created`       | `property.{id}.maintenance`   | New maintenance request submitted                                       | Staff on maintenance list; assigned employee                                   | WebSocket (real-time) |
| 7   | `maintenance.updated`       | `property.{id}.maintenance`   | Status change, assignment change, comment added                         | Staff on maintenance list; assigned employee; requesting resident (if visible) | WebSocket (real-time) |
| 8   | `booking.created`           | `property.{id}.bookings`      | New amenity reservation                                                 | Staff viewing calendar; amenity manager (if approval required)                 | WebSocket (real-time) |
| 9   | `booking.updated`           | `property.{id}.bookings`      | Booking approved, rejected, or cancelled                                | Staff viewing calendar; booking owner                                          | WebSocket (real-time) |
| 10  | `shift_log.created`         | `property.{id}.shift-log`     | New shift log entry                                                     | All staff viewing the shift log                                                | WebSocket (real-time) |
| 11  | `announcement.published`    | `property.{id}.announcements` | New announcement published                                              | All users on dashboard or announcement list                                    | WebSocket (real-time) |
| 12  | `notification.delivered`    | `user.{id}.notifications`     | Notification sent to a specific user                                    | The target user only                                                           | WebSocket (real-time) |
| 13  | `unit.updated`              | `property.{id}.units`         | Unit record changed (occupant, instructions, custom fields)             | Staff viewing the unit file                                                    | WebSocket (real-time) |
| 14  | `parking.violation_created` | `property.{id}.parking`       | New parking violation logged                                            | Security and property manager on parking dashboard                             | WebSocket (real-time) |
| 15  | `incident.created`          | `property.{id}.incidents`     | New incident report filed                                               | All security staff on duty                                                     | WebSocket (real-time) |

**Events that use polling (not WebSocket)**:

| #   | Event Type                      | Polling Interval          | Reason                                  |
| --- | ------------------------------- | ------------------------- | --------------------------------------- |
| 1   | Report generation complete      | 10 seconds                | Reports are background jobs; infrequent |
| 2   | Scheduled announcement queued   | 60 seconds                | Batch operation; not time-critical      |
| 3   | Vendor compliance status change | 300 seconds               | External data; infrequent updates       |
| 4   | Billing/subscription changes    | No polling (page refresh) | Rare; admin-only                        |
| 5   | System health metrics           | 60 seconds                | Admin dashboard only                    |

### 2.6 Offline-First Mobile

Mobile clients must function during network interruptions:

- All read data is cached locally
- Create and update operations are queued with timestamps
- On reconnect, queued operations sync with conflict detection
- Conflicts are surfaced to the user with resolution options (keep mine, keep server, merge)

### 2.7 Configurable, Not Hardcoded

The following must be configurable by Super Admin or Property Admin without code changes:

| Configurable Element         | Scope                                     | Who Configures  |
| ---------------------------- | ----------------------------------------- | --------------- |
| Event Types and Event Groups | Per property (with system defaults)       | Property Admin  |
| Custom fields on any entity  | Per property, per entity type             | Property Admin  |
| Notification templates       | Per property, per event type, per channel | Property Admin  |
| Roles and permissions        | Per property (with system defaults)       | Super Admin     |
| Maintenance categories       | Per property                              | Property Admin  |
| Amenity rules and pricing    | Per amenity                               | Property Admin  |
| Report definitions           | Per property                              | Property Admin  |
| Dashboard widget layout      | Per user                                  | Individual user |
| Branding (logo, colors)      | Per property                              | Property Admin  |
| Translation overrides        | Per property, per locale                  | Property Admin  |
| Supported locales            | Per property                              | Property Admin  |

---

## 3. Unified Event Model (Central Architecture)

### 3.1 Event

The Event entity is the backbone of the platform. Every operational occurrence in a building is recorded as an event.

```
Event
├── id (UUID, auto-generated)
├── event_type_id → EventType (configurable)
├── event_group_id → EventGroup
├── property_id → Property
├── unit_id → Unit (nullable — not all events relate to a unit)
├── resident_id → Resident (nullable — not all events relate to a resident)
├── status (enum: draft, open, in_progress, closed)
├── priority (enum: low, normal, high, critical)
├── created_by → User (staff who created the event)
├── created_at (timestamp with timezone)
├── updated_by → User (nullable)
├── updated_at (timestamp with timezone)
├── closed_by → User (nullable)
├── closed_at (timestamp with timezone, nullable)
├── title (varchar 200)
├── description (text, 4000 chars max)
├── comments[] → EventComment (threaded, timestamped)
├── attachments[] → Attachment (photos, documents, signatures)
├── notification_sent (boolean)
├── notification_channels[] (enum array: email, sms, push, voice)
├── label_printed (boolean)
├── signature (binary, optional — for package release confirmation)
├── photo (binary, optional — for visual evidence)
├── location (varchar 200, optional — storage spot, parking area, etc.)
├── reference_number (varchar 50, auto-generated, unique per property)
├── custom_fields (JSONB — schema defined by the associated EventType)
├── ai_metadata (JSONB — AI suggestions, classification scores, analysis)
└── audit_log[] → AuditEntry (immutable history of every change)
```

**Key design decisions**:

- `custom_fields` as JSONB allows each event type to define its own data shape without schema migrations. A "Package" event type might require `courier`, `tracking_number`, `storage_spot`. A "Noise Complaint" event type might require `noise_type`, `duration`, `decibel_estimate`.
- `ai_metadata` is a separate JSONB column so AI-generated data never contaminates human-entered data and can be independently cleared or regenerated.
- `reference_number` is auto-generated per property (e.g., `PKG-2026-00147`) for verbal communication — staff and residents refer to events by reference number, not UUID.
- `status` includes `draft` for events created by AI suggestion that await human confirmation.

### 3.2 EventType

Event Types are the configurable definitions that give the Unified Event Model its flexibility. Each property starts with system defaults and can add, modify, or deactivate types.

```
EventType
├── id (UUID)
├── property_id (nullable — null means system-wide default)
├── group_id → EventGroup
├── name (varchar 100, e.g., "Amazon Package", "Noise Complaint", "Fire Alarm")
├── slug (varchar 50, URL-safe identifier)
├── icon (varchar 100 — icon name, courier logo reference, or custom upload)
├── color (varchar 7, hex — for card accent and badge color)
├── default_priority (enum: low, normal, high, critical)
├── requires_unit (boolean — must this event type be linked to a unit?)
├── requires_resident (boolean — must this event type be linked to a resident?)
├── notification_template_on_create → NotificationTemplate
├── notification_template_on_close → NotificationTemplate
├── notification_template_on_update → NotificationTemplate
├── auto_notify_resident (boolean — send notification on creation?)
├── public_display (boolean — show on lobby digital signage?)
├── label_printable (boolean — can a physical label be printed?)
├── sort_order (integer)
├── active (boolean)
├── required_fields[] (array of custom field keys that must be filled)
├── optional_fields[] (array of custom field keys shown but not required)
├── ai_features_enabled (JSONB — which AI capabilities are active for this type)
├── reference_number_prefix (varchar 10, e.g., "PKG", "INC", "VST")
├── default_expiry_hours (integer, nullable — auto-escalate if not closed)
└── created_at, updated_at
```

**Examples of event types a property might configure**:

| Event Type         | Group              | Icon         | Color     | Auto-Notify | Fields                                              |
| ------------------ | ------------------ | ------------ | --------- | ----------- | --------------------------------------------------- |
| Amazon Package     | Packages           | Amazon logo  | `#FF9900` | Yes         | courier, tracking_number, storage_spot, perishable  |
| FedEx Package      | Packages           | FedEx logo   | `#4D148C` | Yes         | courier, tracking_number, storage_spot              |
| Noise Complaint    | Security Incidents | Alert icon   | `#FF3B30` | No          | noise_type, duration, floor_affected                |
| Fire Alarm         | Security Incidents | Fire icon    | `#FF3B30` | No          | alarm_zone, false_alarm, fire_dept_called           |
| Visitor Check-In   | Visitors           | Person icon  | `#5AC8FA` | Yes         | visitor_name, visiting_unit, id_type, vehicle_plate |
| Cleaning Completed | Cleaning           | Sparkle icon | `#34C759` | No          | area_cleaned, cleaning_type                         |
| Shift Note         | Shift Log          | Note icon    | `#6E6E73` | No          | note_category, priority_for_next_shift              |
| Key Checkout       | Key Management     | Key icon     | `#FF9500` | No          | key_type, checkout_reason, id_verified              |

### 3.3 EventGroup

Event Groups organize Event Types into logical categories. Groups control visibility — a Security Guard might see the "Security Incidents" and "Key Management" groups, while a Resident sees only "Packages" and "Visitors" (filtered to their own unit).

```
EventGroup
├── id (UUID)
├── property_id (nullable — null means system-wide default)
├── name (varchar 100, e.g., "Packages", "Security Incidents", "Cleaning", "Shift Log")
├── slug (varchar 50)
├── icon (varchar 100)
├── color (varchar 7, hex)
├── sort_order (integer)
├── visible_to_roles[] (array of Role IDs — which roles see events in this group)
├── active (boolean)
└── created_at, updated_at
```

### 3.4 How Modules Use the Unified Event Model

The Unified Event Model is not a generic logging system — it is the operational backbone. Other modules extend or specialize it:

| Module                 | Relationship to Events                                                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Packages**           | Package intake creates an Event of a package-type EventType. Package release closes the event. The package module provides a specialized UI (courier icons, label printing, batch intake) but the underlying data is an Event.                               |
| **Security**           | Incidents, parking violations, key checkouts, and authorized entries are all Events with security-group EventTypes. The security module provides a dedicated dashboard with filtering and escalation workflows.                                              |
| **Visitor Management** | Visitor check-ins and check-outs are Events. Pre-authorized visitors create draft Events that are confirmed on arrival.                                                                                                                                      |
| **Shift Log**          | Shift notes are Events in the "Shift Log" group. They are always accessible from a persistent UI element (not buried in navigation).                                                                                                                         |
| **Cleaning**           | Cleaning log entries are Events. Checklists attach as structured custom_fields.                                                                                                                                                                              |
| **Maintenance**        | Maintenance requests have their own entity (see Section 4) because they require a richer data model (vendor assignment, equipment linkage, work orders). However, creating a maintenance request also generates a correlated Event for the unified timeline. |

---

## 4. Entity Relationship Overview

### 4.1 Core Entities

#### Property

The multi-tenant root entity. Every piece of data in the system belongs to a property.

```
Property
├── id (UUID)
├── management_company_id → ManagementCompany
├── name (varchar 200)
├── address (text)
├── city, province_state, postal_code, country
├── timezone (varchar 50)
├── total_units (integer)
├── buildings[] → Building
├── logo_url (varchar 500)
├── branding (JSONB — primary color, accent color)
├── default_locale (varchar 10, default: "en-US" — the property's primary language)
├── supported_locales[] (varchar 10 array — all languages enabled for this property, e.g., ["en-US", "fr-CA"])
├── features_enabled (JSONB — which modules are active)
├── subscription_tier (enum: starter, professional, enterprise)
├── custom_fields (JSONB)
└── created_at, updated_at
```

**Relationships**: Has many Buildings, Users, Events, Amenities, Announcements, Documents. Belongs to ManagementCompany.

#### ManagementCompany

The entity that oversees multiple properties. A management company's admins can see a portfolio view across all their properties.

```
ManagementCompany
├── id (UUID)
├── name (varchar 200)
├── properties[] → Property
├── admins[] → User (Super Admin role)
├── shared_event_types[] → EventType (templates shared across properties)
├── shared_notification_templates[] → NotificationTemplate
└── created_at, updated_at
```

#### Building

A property can consist of multiple buildings (e.g., a condo complex with Tower A, Tower B, and a Townhouse block).

```
Building
├── id (UUID)
├── property_id → Property
├── name (varchar 100, e.g., "Tower A", "North Building")
├── address (text, if different from property)
├── total_floors (integer)
├── total_units (integer)
├── units[] → Unit
└── created_at, updated_at
```

**Relationships**: Belongs to Property. Has many Units.

#### Unit

The fundamental residential or commercial space.

```
Unit
├── id (UUID)
├── building_id → Building
├── property_id → Property (denormalized for query performance)
├── number (varchar 20, e.g., "1205", "PH-3", "TH-7")
├── floor (integer)
├── unit_type (enum: residential, commercial, storage, parking)
├── status (enum: occupied, vacant, under_renovation)
├── square_footage (decimal, nullable)
├── occupants[] → User (residents linked to this unit)
├── instructions[] → UnitInstruction (front desk notes)
├── custom_fields (JSONB — property-defined fields)
├── events[] → Event
├── maintenance_requests[] → MaintenanceRequest
├── reservations[] → AmenityReservation
├── parking_permits[] → ParkingPermit
├── pets[] → Pet
├── vehicles[] → Vehicle
├── fobs[] → FOB
├── buzzer_codes[] → BuzzerCode
├── garage_clickers[] → GarageClicker
├── emergency_contacts[] → EmergencyContact
├── documents[] → Document
└── created_at, updated_at
```

**Relationships**: Belongs to Building and Property. Has many Users, Events, MaintenanceRequests, Reservations, Pets, Vehicles, FOBs, BuzzerCodes, EmergencyContacts, Documents.

#### UnitInstruction

Per-unit notes visible to front desk and security staff. These are critical operational context (e.g., "Unit 815: Dog bites, do not enter without owner present" or "Unit 302: Resident is hearing-impaired, ring doorbell twice").

```
UnitInstruction
├── id (UUID)
├── unit_id → Unit
├── instruction_text (text, 1000 chars)
├── priority (enum: normal, important, critical)
├── visible_to_roles[] (array of Role IDs)
├── active (boolean)
├── created_by → User
└── created_at, updated_at
```

#### User

All people in the system — residents, staff, admins, board members.

```
User
├── id (UUID)
├── property_ids[] → Property (staff can be assigned to multiple)
├── unit_id → Unit (nullable — staff don't have units)
├── role_id → Role
├── email (varchar 255, unique)
├── phone (varchar 20)
├── first_name, last_name (varchar 100)
├── avatar_url (varchar 500)
├── status (enum: active, inactive, suspended, pending_invitation)
├── user_type (enum: resident, owner, tenant, staff, admin, board_member)
├── move_in_date (date, nullable)
├── move_out_date (date, nullable)
├── preferred_locale (varchar 10, default: null — falls back to property default)
├── two_factor_enabled (boolean)
├── notification_preferences → NotificationPreference
├── emergency_contacts[] → EmergencyContact
├── vehicles[] → Vehicle
├── pets[] → Pet
├── fobs[] → FOB
├── custom_fields (JSONB)
├── last_login_at (timestamp)
└── created_at, updated_at
```

**Relationships**: Belongs to Role. Belongs to Unit (if resident). Assigned to Properties. Has many EmergencyContacts, Vehicles, Pets, FOBs, NotificationPreferences.

#### Role

Role-based access control. Roles define what a user sees, what actions they can take, and which modules are accessible.

```
Role
├── id (UUID)
├── property_id (nullable — null means system-wide default role)
├── name (varchar 100)
├── slug (varchar 50)
├── description (text)
├── permissions (JSONB — structured permission matrix)
├── visible_modules[] (array of module slugs)
├── visible_event_groups[] (array of EventGroup IDs)
├── dashboard_layout (JSONB — default widget arrangement)
├── is_system_role (boolean — cannot be deleted)
├── hierarchy_level (integer — Super Admin=0, Admin=1, Staff=2, Resident=3)
└── created_at, updated_at
```

**System default roles**: Super Admin, Property Admin, Property Manager, Front Desk / Concierge, Security Guard, Maintenance Staff, Board Member, Resident, Owner, Tenant.

**Permission structure** (within the JSONB `permissions` field):

```
{
  "events": { "create": true, "read": true, "update": true, "delete": false, "batch_create": true },
  "maintenance": { "create": true, "read": true, "assign_vendor": false },
  "amenities": { "book": true, "approve": false, "manage": false },
  "units": { "read": true, "edit": false, "manage_residents": false },
  "reports": { "view": false, "export": false, "create_custom": false },
  "settings": { "access": false },
  "users": { "manage": false }
}
```

### 4.2 Module Entities

#### MaintenanceRequest

Maintenance requests have a richer data model than generic Events because they involve vendor assignment, equipment linkage, work order generation, and multi-step resolution workflows.

```
MaintenanceRequest
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── resident_id → User (who submitted the request)
├── correlated_event_id → Event (the event generated for the unified timeline)
├── reference_number (auto-generated, e.g., "MR-2026-00089")
├── category_id → MaintenanceCategory (configurable per property)
├── title (varchar 200)
├── description (text, 4000 chars)
├── status (enum: open, in_progress, on_hold, closed)
├── priority (enum: low, normal, high, critical)
├── urgency_flag (boolean)
├── permission_to_enter (enum: yes, no, not_applicable)
├── entry_instructions (text, 1000 chars)
├── assigned_employee_id → User (staff)
├── assigned_vendor_id → Vendor
├── equipment_id → Equipment (nullable — linked equipment)
├── photos[] → Attachment
├── documents[] → Attachment
├── contact_numbers (varchar 100)
├── print_work_order (boolean)
├── comments[] → MaintenanceComment (timestamped thread)
├── status_history[] → StatusChange (who changed, when, from/to)
├── ai_metadata (JSONB — category suggestion, priority recommendation)
├── scheduled_date (date, nullable)
├── completed_date (date, nullable)
└── created_at, updated_at
```

**Relationships**: Belongs to Property, Unit, User (submitter). Optionally assigned to User (staff) and Vendor. Optionally linked to Equipment. Has many Attachments, Comments, StatusChanges. Correlated to an Event.

#### Amenity

A bookable resource within a property.

```
Amenity
├── id (UUID)
├── property_id → Property
├── name (varchar 200, e.g., "Party Room", "Guest Suite", "Tennis Court")
├── description (text)
├── location (varchar 200)
├── capacity (integer)
├── photos[] → Attachment
├── requires_approval (boolean)
├── requires_payment (boolean)
├── price_per_slot (decimal, nullable)
├── deposit_amount (decimal, nullable)
├── booking_rules (JSONB — max duration, advance booking window, cooldown period, etc.)
├── available_slots (JSONB — weekly schedule of available time blocks)
├── blackout_dates[] (date array)
├── visible_to_roles[] (array of Role IDs)
├── active (boolean)
└── created_at, updated_at
```

#### AmenityReservation

```
AmenityReservation
├── id (UUID)
├── amenity_id → Amenity
├── property_id → Property
├── unit_id → Unit
├── user_id → User (who booked)
├── start_time (timestamp with timezone)
├── end_time (timestamp with timezone)
├── status (enum: requested, approved, rejected, cancelled, completed)
├── approval_status (enum: pending, approved, rejected — if amenity requires approval)
├── approved_by → User (nullable)
├── payment_status (enum: not_required, pending, paid, refunded)
├── payment_amount (decimal, nullable)
├── notes (text, 500 chars)
├── cancellation_reason (text, nullable)
├── guest_count (integer)
└── created_at, updated_at
```

**Relationships**: Belongs to Amenity, Property, Unit, User. Optionally approved by User (admin).

#### Announcement

```
Announcement
├── id (UUID)
├── property_id → Property
├── title (varchar 200)
├── body (text — rich text / HTML)
├── type (enum: regular, urgent, emergency)
├── distribution_channels[] (enum array: web_portal, email, sms, push, lobby_display, voice)
├── target_audience (JSONB — all residents, specific buildings, specific floors, specific roles)
├── published_at (timestamp, nullable — null means draft)
├── expires_at (timestamp, nullable)
├── pinned (boolean)
├── attachments[] → Attachment
├── created_by → User
├── read_by[] → AnnouncementRead (tracking which users have seen it)
└── created_at, updated_at
```

#### Notification and NotificationPreference

```
Notification
├── id (UUID)
├── property_id → Property
├── user_id → User (recipient)
├── channel (enum: email, sms, push, voice)
├── template_id → NotificationTemplate
├── subject (varchar 200)
├── body (text)
├── status (enum: queued, sent, delivered, failed, bounced)
├── related_entity_type (varchar 50 — "Event", "MaintenanceRequest", etc.)
├── related_entity_id (UUID)
├── sent_at (timestamp, nullable)
├── delivered_at (timestamp, nullable)
├── read_at (timestamp, nullable)
├── error_message (text, nullable)
└── created_at

NotificationPreference
├── id (UUID)
├── user_id → User
├── property_id → Property
├── preferences (JSONB — per-module, per-channel toggles)
└── updated_at
```

**Preference structure**:

```
{
  "packages": { "email": true, "sms": true, "push": true },
  "maintenance": { "email": true, "sms": false, "push": true },
  "amenities": { "email": true, "sms": false, "push": true },
  "announcements": { "email": true, "sms": true, "push": true },
  "security": { "email": false, "sms": false, "push": false },
  "emergency": { "email": true, "sms": true, "push": true, "voice": true }
}
```

**Emergency override**: Notifications with type `emergency` bypass user preferences and are sent on all available channels.

#### NotificationTemplate

```
NotificationTemplate
├── id (UUID)
├── property_id (nullable — null means system default)
├── name (varchar 100)
├── channel (enum: email, sms, push, voice)
├── subject_template (varchar 200 — with {{variable}} placeholders)
├── body_template (text — with {{variable}} placeholders)
├── variables[] (array of available placeholder names)
├── active (boolean)
└── created_at, updated_at
```

#### TrainingCourse, LearningPath, Quiz

Staff training and onboarding — a capability identified as a gap in the broader market.

```
TrainingCourse
├── id (UUID)
├── property_id → Property (nullable — null means shared across company)
├── title (varchar 200)
├── description (text)
├── content_blocks[] → CourseContent (ordered sections of text, video, images)
├── quiz_id → Quiz (nullable)
├── estimated_duration_minutes (integer)
├── required_for_roles[] (array of Role IDs)
├── passing_score (integer, percentage — e.g., 80)
├── active (boolean)
├── sort_order (integer)
└── created_at, updated_at

LearningPath
├── id (UUID)
├── property_id → Property
├── name (varchar 200)
├── description (text)
├── courses[] → TrainingCourse (ordered sequence)
├── required_for_roles[] (array of Role IDs)
├── deadline_days (integer — days from assignment to complete)
└── created_at, updated_at

Quiz
├── id (UUID)
├── course_id → TrainingCourse
├── questions[] → QuizQuestion
├── passing_score (integer, percentage)
├── max_attempts (integer)
└── created_at, updated_at

UserCourseProgress
├── id (UUID)
├── user_id → User
├── course_id → TrainingCourse
├── status (enum: not_started, in_progress, completed, failed)
├── score (integer, nullable — quiz score)
├── attempts (integer)
├── started_at (timestamp)
├── completed_at (timestamp, nullable)
└── updated_at
```

#### ClassifiedAd

A community marketplace for residents — builds engagement and differentiates from competitors.

```
ClassifiedAd
├── id (UUID)
├── property_id → Property
├── user_id → User (poster)
├── unit_id → Unit
├── title (varchar 200)
├── description (text, 2000 chars)
├── category (enum: for_sale, wanted, free, services, lost_found)
├── price (decimal, nullable)
├── photos[] → Attachment
├── status (enum: active, sold, expired, removed)
├── expires_at (timestamp)
├── contact_method (enum: in_app_message, email, phone)
└── created_at, updated_at
```

#### Idea

Crowdsourced feedback from residents.

```
Idea
├── id (UUID)
├── property_id → Property
├── user_id → User
├── title (varchar 200)
├── description (text, 2000 chars)
├── category (varchar 100)
├── status (enum: submitted, under_review, planned, implemented, declined)
├── upvotes (integer)
├── upvoted_by[] → User
├── admin_response (text, nullable)
├── responded_by → User (nullable)
└── created_at, updated_at
```

#### ParkingPermit and ParkingViolation

```
ParkingPermit
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── user_id → User
├── vehicle_id → Vehicle
├── permit_type_id → ParkingPermitType (configurable: resident, visitor, temporary)
├── parking_area (varchar 100)
├── spot_number (varchar 20, nullable)
├── valid_from (date)
├── valid_until (date, nullable — null means permanent)
├── status (enum: active, expired, revoked, suspended)
├── printed (boolean)
└── created_at, updated_at

ParkingViolation
├── id (UUID)
├── property_id → Property
├── correlated_event_id → Event
├── vehicle_description (text)
├── license_plate (varchar 20)
├── violation_type (varchar 100)
├── location (varchar 200)
├── status (enum: open, warning_issued, fined, resolved)
├── photos[] → Attachment
├── notes (text)
├── reported_by → User
└── created_at, updated_at
```

#### Vendor

```
Vendor
├── id (UUID)
├── property_id → Property
├── company_name (varchar 200)
├── contact_name (varchar 200)
├── email (varchar 255)
├── phone (varchar 20)
├── address (text)
├── specialty (varchar 200 — e.g., "Plumbing", "Electrical", "HVAC")
├── insurance_status (enum: compliant, non_compliant, expiring_soon, expired, not_tracked)
├── insurance_expiry_date (date, nullable)
├── insurance_documents[] → Document
├── rating (decimal, 1-5)
├── notes (text)
├── active (boolean)
└── created_at, updated_at
```

#### Equipment

```
Equipment
├── id (UUID)
├── property_id → Property
├── name (varchar 200)
├── category_id → EquipmentCategory (configurable)
├── location (varchar 200)
├── serial_number (varchar 100)
├── manufacturer (varchar 200)
├── model (varchar 200)
├── install_date (date)
├── warranty_expiry (date, nullable)
├── expected_replacement_date (date, nullable)
├── status (enum: operational, needs_repair, out_of_service, decommissioned)
├── maintenance_requests[] → MaintenanceRequest
├── documents[] → Document
├── photos[] → Attachment
├── custom_fields (JSONB)
└── created_at, updated_at
```

#### Attachment and Document

```
Attachment
├── id (UUID)
├── property_id → Property
├── parent_entity_type (varchar 50 — polymorphic: "Event", "MaintenanceRequest", etc.)
├── parent_entity_id (UUID)
├── file_name (varchar 255)
├── file_type (varchar 50 — mime type)
├── file_size (integer — bytes)
├── storage_url (varchar 500)
├── thumbnail_url (varchar 500, nullable)
├── uploaded_by → User
└── created_at

Document
├── id (UUID)
├── property_id → Property
├── category (varchar 100 — e.g., "Rules & Bylaws", "Insurance", "Forms")
├── title (varchar 200)
├── description (text)
├── file_id → Attachment
├── visible_to_roles[] (array of Role IDs)
├── published (boolean)
├── pinned (boolean)
└── created_at, updated_at
```

#### ShiftLog

While shift notes are Events in the unified model, the ShiftLog entity provides the always-accessible, persistent UI component.

```
ShiftLog
├── id (UUID)
├── property_id → Property
├── correlated_event_id → Event
├── author_id → User
├── shift_date (date)
├── shift_period (enum: morning, afternoon, evening, overnight)
├── content (text, 4000 chars)
├── priority_for_next_shift (boolean)
├── read_by[] → ShiftLogRead (who has acknowledged)
├── attachments[] → Attachment
└── created_at, updated_at
```

#### EmergencyContact

```
EmergencyContact
├── id (UUID)
├── user_id → User (the resident this contact belongs to)
├── unit_id → Unit
├── contact_name (varchar 200)
├── relationship (varchar 100)
├── phone_primary (varchar 20)
├── phone_secondary (varchar 20, nullable)
├── email (varchar 255, nullable)
├── notes (text, nullable)
├── sort_order (integer)
└── created_at, updated_at
```

#### Physical Access Entities

```
FOB
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── user_id → User
├── serial_number (varchar 50)
├── fob_type (enum: building_entry, amenity, parking, elevator)
├── status (enum: active, deactivated, lost, returned)
├── issued_date (date)
├── deactivated_date (date, nullable)
└── created_at, updated_at

BuzzerCode
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── code (varchar 20)
├── label (varchar 100 — resident name or unit label)
├── active (boolean)
└── updated_at

GarageClicker
├── id (UUID)
├── property_id → Property
├── unit_id → Unit
├── user_id → User
├── serial_number (varchar 50)
├── status (enum: active, deactivated, lost, returned)
├── issued_date (date)
└── created_at, updated_at

Vehicle
├── id (UUID)
├── user_id → User
├── unit_id → Unit
├── make (varchar 100)
├── model (varchar 100)
├── year (integer)
├── color (varchar 50)
├── license_plate (varchar 20)
├── province_state (varchar 50)
├── parking_spot (varchar 20, nullable)
└── created_at, updated_at

Pet
├── id (UUID)
├── user_id → User
├── unit_id → Unit
├── name (varchar 100)
├── species (enum: dog, cat, bird, fish, reptile, other)
├── breed (varchar 100, nullable)
├── weight (decimal, nullable)
├── registration_number (varchar 50, nullable)
├── notes (text, nullable)
└── created_at, updated_at
```

---

## 5. Custom Fields Architecture

### 5.1 Purpose

Properties have unique needs. One building tracks bicycle storage locker assignments; another tracks authorized moving companies; a third needs a field for "preferred language" on every resident. Custom fields allow properties to extend any entity without schema migrations.

### 5.2 CustomFieldDefinition

```
CustomFieldDefinition
├── id (UUID)
├── property_id → Property
├── entity_type (varchar 50 — "Unit", "User", "Event", "MaintenanceRequest", etc.)
├── event_type_id → EventType (nullable — for Event-specific custom fields)
├── field_key (varchar 50, unique per property+entity_type)
├── field_label (varchar 200 — display name)
├── field_type (enum: text, textarea, number, decimal, date, datetime, dropdown, multi_select, checkbox, file, url, email, phone)
├── required (boolean)
├── default_value (text, nullable)
├── options[] (text array — for dropdown and multi_select types)
├── validation_rules (JSONB — min/max length, regex pattern, min/max value)
├── placeholder (varchar 200)
├── help_text (varchar 500)
├── sort_order (integer)
├── visible_to_roles[] (array of Role IDs)
├── editable_by_roles[] (array of Role IDs)
├── searchable (boolean — include in global search index)
├── filterable (boolean — appear as a filter option in listings)
├── exportable (boolean — include in Excel/PDF exports)
├── active (boolean)
└── created_at, updated_at
```

### 5.3 How Custom Fields Work

1. **Definition**: Property Admin creates a custom field definition (e.g., "Locker Number" of type `text` on entity type `Unit`)
2. **Storage**: The field value is stored in the `custom_fields` JSONB column on the target entity (e.g., `Unit.custom_fields = { "locker_number": "B-42" }`)
3. **Rendering**: The UI reads CustomFieldDefinitions for the current entity type and property, then dynamically renders form inputs in the appropriate section
4. **Validation**: Field type and validation rules are enforced both client-side and server-side
5. **Search**: Fields marked `searchable` are indexed for full-text search
6. **Filtering**: Fields marked `filterable` appear in the filter panel on listing pages
7. **Export**: Fields marked `exportable` appear as columns in Excel/PDF exports

### 5.4 Supported Field Types

| Field Type   | Input Component                 | Storage Format          | Searchable |     Filterable     |
| ------------ | ------------------------------- | ----------------------- | :--------: | :----------------: |
| text         | Text input (single line)        | String                  |    Yes     |   Yes (contains)   |
| textarea     | Multi-line text area            | String                  |    Yes     |         No         |
| number       | Number input (integer)          | Integer                 |    Yes     |    Yes (range)     |
| decimal      | Number input (2 decimal places) | Decimal                 |    Yes     |    Yes (range)     |
| date         | Date picker                     | ISO 8601 date           |    Yes     |    Yes (range)     |
| datetime     | Date + time picker              | ISO 8601 datetime       |    Yes     |    Yes (range)     |
| dropdown     | Select menu                     | String (selected value) |    Yes     |    Yes (exact)     |
| multi_select | Multi-select checkboxes         | Array of strings        |    Yes     | Yes (contains any) |
| checkbox     | Single checkbox                 | Boolean                 |     No     |  Yes (true/false)  |
| file         | File upload                     | Attachment ID reference |     No     |         No         |
| url          | URL input with validation       | String                  |     No     |         No         |
| email        | Email input with validation     | String                  |    Yes     |         No         |
| phone        | Phone input with formatting     | String                  |    Yes     |         No         |

---

## 6. Notification Architecture

### 6.1 Channels

Concierge supports four notification channels from day one:

| Channel   | Use Cases                                   | Delivery Speed |  Cost  |
| --------- | ------------------------------------------- | :------------: | :----: |
| **Email** | Detailed notifications, documents, receipts |    Minutes     |  Low   |
| **SMS**   | Time-sensitive alerts, confirmations        |    Seconds     | Medium |
| **Push**  | Real-time updates, reminders                |    Seconds     |  Free  |
| **Voice** | Emergency broadcasts, critical escalations  |    Seconds     |  High  |

### 6.2 Notification Flow

```
Triggering Action (e.g., package created)
    │
    ▼
Event Bus (internal message queue)
    │
    ▼
Notification Service
    ├── 1. Determine recipients (unit residents, assigned staff, etc.)
    ├── 2. Check per-user preferences (unless emergency override)
    ├── 3. Select template for event type + channel
    ├── 4. Render template with event data
    ├── 5. Smart batching (AI groups related notifications)
    ├── 6. Dispatch to channel providers
    │       ├── Email → Email service provider
    │       ├── SMS → SMS gateway
    │       ├── Push → Push notification service
    │       └── Voice → Voice call service
    └── 7. Track delivery status (queued → sent → delivered → read)
```

### 6.3 Template System

- Every EventType has default notification templates for `on_create`, `on_close`, and `on_update`
- Templates use `{{variable}}` placeholders (e.g., `"Hi {{resident_name}}, a {{event_type}} has been logged for Unit {{unit_number}}"`)
- Properties can override system default templates
- Templates are versioned — changes to a template do not affect already-sent notifications
- Separate templates per channel (email templates are rich HTML; SMS templates are plain text under 160 characters; push templates are title + short body)
- **Locale-aware**: Each template exists in every locale the property supports. The system ships default templates in all launch locales (en-US, en-CA, fr-CA). When sending, the notification service selects the template matching the recipient's `preferred_locale`, falling back to the property's `default_locale`, then to `en-US`. See Section 12 for full i18n architecture.

### 6.4 Per-User Preferences

- Residents control which notification types they receive and on which channels
- Preferences are organized by module (Packages, Maintenance, Amenities, Announcements, Security, Emergency) for clarity
- Default preferences are set at the property level; residents can modify their own
- Staff notification preferences are managed by Property Admin

### 6.5 Emergency Override

Notifications classified as `emergency` bypass all user preferences and are sent on every available channel. This is used for:

- Fire alarms
- Building evacuations
- Security threats
- Critical infrastructure failures (e.g., water main break)

Emergency broadcasts cascade through channels: Push (instant) → SMS (seconds) → Email (minutes) → Voice (if configured).

### 6.6 Smart Batching

The AI service layer can group related notifications to prevent notification fatigue:

- If 5 packages arrive for the same unit within 10 minutes, send one notification listing all 5
- If a maintenance request is updated 3 times in an hour, batch into a single "status update" notification
- Batching rules are configurable per property and per event type

---

## 7. AI Service Layer Architecture

### 7.1 AI Gateway

All AI capabilities are routed through a central AI Gateway service. No module calls an AI provider directly.

```
Module (e.g., Maintenance)
    │
    ▼
AI Gateway
    ├── Request validation and rate limiting
    ├── PII detection and stripping
    ├── Provider routing (Claude or OpenAI per feature config)
    ├── Prompt library lookup (version-controlled prompts)
    ├── Response caching (identical queries return cached results)
    ├── Cost metering (per property, per feature)
    └── Graceful degradation (return null/fallback if AI unavailable)
        │
        ▼
    AI Provider (Claude API or OpenAI API)
```

### 7.2 Provider Configuration

- Super Admin selects which AI provider powers each feature category
- Provider can be switched without code changes
- Both providers are always available as fallback
- Provider health is monitored; automatic failover on sustained errors

### 7.3 Privacy and PII

Before any data leaves the platform for an AI API call:

- PII fields (names, phone numbers, email addresses, unit numbers) are detected and replaced with anonymous tokens
- AI responses are de-tokenized before being stored or displayed
- Properties can opt out of AI features entirely
- All AI API calls are logged with a hash of the prompt (not the prompt itself) for audit purposes

### 7.4 Cost Management

- Every AI invocation is tagged with: property_id, module, feature, token count, cost
- Properties have configurable monthly AI spending caps
- Super Admin sees cost dashboards per property and per feature
- When a property approaches its cap, non-critical AI features are disabled first; critical features (emergency classification) are last

### 7.5 Graceful Degradation

Every feature that uses AI must define a non-AI fallback:

| AI Feature              | What It Does                         | Fallback Without AI                       |
| ----------------------- | ------------------------------------ | ----------------------------------------- |
| Event classification    | Suggests event type from description | Manual selection from dropdown            |
| Priority recommendation | Suggests priority level              | Default priority from event type          |
| Smart search            | Semantic search across entities      | Full-text keyword search                  |
| Notification batching   | Groups related notifications         | Time-based batching (configurable window) |
| Report insights         | Natural language summary of trends   | Raw data tables and charts                |

### 7.6 Prompt Library

- Prompts are stored in the database, not hardcoded
- Each prompt has a version number; updates create new versions
- A/B testing support: route a percentage of requests to a new prompt version
- Prompts reference the entity schema so the AI understands the data shape

---

## 8. Search Architecture

### 8.1 Global Search (Command+K)

The platform provides a unified search experience accessible from any page via keyboard shortcut (Cmd+K / Ctrl+K) or the search bar in the top navigation.

### 8.2 Search Scope

Global search spans all modules and entity types:

| Searchable Entity  | Indexed Fields                                      | Example Query          |
| ------------------ | --------------------------------------------------- | ---------------------- |
| Unit               | number, floor, building name, custom fields         | "Unit 1205"            |
| User / Resident    | first_name, last_name, email, phone                 | "Sarah Chen"           |
| Event              | title, description, reference_number, custom fields | "PKG-2026-00147"       |
| MaintenanceRequest | title, description, reference_number, category      | "leaking faucet"       |
| Amenity            | name, description, location                         | "party room"           |
| Announcement       | title, body                                         | "holiday hours"        |
| Document           | title, description, category                        | "fire safety plan"     |
| Vendor             | company_name, contact_name, specialty               | "ABC Plumbing"         |
| Equipment          | name, serial_number, model                          | "elevator motor"       |
| TrainingCourse     | title, description                                  | "fire safety training" |

### 8.3 Search Capabilities

- **Full-text search**: Traditional keyword matching with stemming and fuzzy matching
- **Semantic search**: AI-powered embedding-based search that understands intent (e.g., searching "water problem" finds maintenance requests about "leaking pipe")
- **Role-filtered results**: Search results are filtered by the current user's role permissions. A resident searching "Unit 1205" sees only their own unit data; a property manager sees everything.
- **Recent searches**: Last 10 searches are saved per user for quick re-access
- **Suggested actions**: Search results include contextual actions (e.g., searching "announcement" suggests "Create New Announcement" as an action)
- **Cross-module correlation**: Related entities surface together (searching a unit shows its residents, recent events, open maintenance requests)

### 8.4 Search Index

- All searchable fields are indexed in a full-text search engine
- Embeddings are generated for semantic search via the AI Gateway
- Index updates are near-real-time (eventual consistency within seconds of a data change)
- Custom fields marked as `searchable` are included in the index
- **Multi-language indexing**: Search analyzers are configured per locale. Properties with multiple supported locales index content with language-appropriate stemming and tokenization (e.g., French stemming for `fr-CA` content). User-generated content (announcements, classified ads) is indexed in the language it was written in. System UI labels are indexed in all supported locales so a French-language user searching "colis" finds packages. See Section 12 for full i18n architecture.

---

## 9. Audit and Compliance

### 9.1 Audit Trail

Every mutation in the system is recorded in an immutable audit log:

```
AuditEntry
├── id (UUID)
├── property_id → Property
├── entity_type (varchar 50 — "Event", "User", "Unit", etc.)
├── entity_id (UUID)
├── action (enum: create, update, delete, login, logout, permission_change, export, print)
├── actor_id → User (who performed the action)
├── actor_role (varchar 50 — role at the time of action)
├── ip_address (varchar 45)
├── user_agent (varchar 500)
├── device_info (JSONB — browser, OS, device type)
├── changes (JSONB — { field: { old: value, new: value } } for updates)
├── metadata (JSONB — additional context)
└── created_at (timestamp, immutable)
```

### 9.2 What Is Audited

| Category            | Events Logged                                                          |
| ------------------- | ---------------------------------------------------------------------- |
| **Authentication**  | Login (success/failure), logout, password change, 2FA enable/disable   |
| **Data changes**    | Every create, update, delete on any entity — with old and new values   |
| **Access**          | Who viewed which resident's data, which unit file was opened           |
| **Exports**         | Who exported what data, in what format, how many records               |
| **Permissions**     | Role assignments, permission changes, user status changes              |
| **Notifications**   | What was sent, to whom, on which channel, delivery status              |
| **AI interactions** | Which AI features were invoked, by whom (prompt content is not stored) |

### 9.3 Login Audit Trail

A dedicated view shows recent account activity per user:

- Timestamp of every login and logout
- IP address and geolocation (city/country)
- Device and browser information
- Success or failure status
- Alerts for: new device, new location, failed attempts exceeding threshold

### 9.4 Retention and Compliance

- Audit logs are retained for a configurable period per property (default: 7 years)
- Audit logs are append-only and cannot be edited or deleted by any user, including Super Admin
- Export to CSV/PDF for compliance reporting and legal requests
- PIPEDA (Canada) and GDPR (if applicable) compliance: right to access personal data, right to data portability
- Data deletion requests are logged and executed with a retention hold for legal compliance

---

## 10. Multi-Property Support

### 10.1 Property Isolation

- All queries are scoped by `property_id` at the application layer
- A user authenticated for Property A cannot access Property B data, even via direct API calls
- Database indexes include `property_id` as the leading column for query performance
- File storage (attachments, photos) is partitioned by property

### 10.2 Portfolio Dashboard

Management companies with multiple properties see a portfolio-level dashboard:

| Widget                  | Content                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| Property overview cards | Key metrics per property (open events, pending maintenance, occupancy)     |
| Cross-property alerts   | Vendor insurance expiring, equipment due for replacement, training overdue |
| Aggregated reports      | Combined metrics across all properties with drill-down                     |
| Staff allocation        | Which staff are assigned to which properties, shift coverage               |

### 10.3 Shared Configuration

Management companies can create shared templates that properties inherit:

- Event Types (e.g., a standard set of package courier types)
- Notification Templates
- Training Courses and Learning Paths
- Report Definitions
- Custom Field Definitions

Properties can use shared templates as-is or clone and customize them.

### 10.4 Staff Multi-Property Assignment

- Staff users can be assigned to multiple properties
- When a multi-property staff member logs in, they select which property to work in (or see a combined view if their role permits)
- Actions are always scoped to the currently selected property
- The property switcher is accessible from the user profile area in the sidebar

---

## 11. Data Model Summary Table

| Entity                     | Primary Fields (Top 5)                                       | Owned By Module | Key Relationships                                 |
| -------------------------- | ------------------------------------------------------------ | --------------- | ------------------------------------------------- |
| **Property**               | name, address, timezone, default_locale, supported_locales[] | Core            | → ManagementCompany, → Buildings[], → Users[]     |
| **ManagementCompany**      | name, properties[], admins[]                                 | Core            | → Properties[], → Users[]                         |
| **Building**               | name, address, total_floors, total_units                     | Core            | → Property, → Units[]                             |
| **Unit**                   | number, floor, unit_type, status, square_footage             | Core            | → Building, → Users[], → Events[], → FOBs[]       |
| **UnitInstruction**        | instruction_text, priority, visible_to_roles[], active       | Core            | → Unit                                            |
| **User**                   | email, first_name, last_name, role_id, preferred_locale      | Core            | → Role, → Unit, → Properties[]                    |
| **Role**                   | name, permissions, visible_modules[], hierarchy_level        | Core            | → Users[]                                         |
| **Event**                  | title, status, priority, event_type_id, reference_number     | Events          | → EventType, → Property, → Unit, → User           |
| **EventType**              | name, icon, color, default_priority, group_id                | Events          | → EventGroup, → Property, → NotificationTemplates |
| **EventGroup**             | name, icon, color, visible_to_roles[]                        | Events          | → EventTypes[], → Property                        |
| **MaintenanceRequest**     | title, description, status, priority, category_id            | Maintenance     | → Property, → Unit, → User, → Vendor, → Equipment |
| **Amenity**                | name, capacity, requires_approval, price_per_slot            | Amenities       | → Property, → Reservations[]                      |
| **AmenityReservation**     | start_time, end_time, status, payment_status                 | Amenities       | → Amenity, → Unit, → User                         |
| **Announcement**           | title, body, type, distribution_channels[], published_at     | Communication   | → Property, → User (author)                       |
| **Notification**           | channel, subject, body, status, sent_at                      | Communication   | → User, → NotificationTemplate                    |
| **NotificationPreference** | preferences (JSONB per module per channel)                   | Communication   | → User, → Property                                |
| **NotificationTemplate**   | name, channel, subject_template, body_template               | Communication   | → Property                                        |
| **TrainingCourse**         | title, description, passing_score, estimated_duration        | Training        | → Property, → Quiz, → LearningPath                |
| **LearningPath**           | name, courses[], required_for_roles[], deadline_days         | Training        | → Property, → TrainingCourses[]                   |
| **Quiz**                   | questions[], passing_score, max_attempts                     | Training        | → TrainingCourse                                  |
| **UserCourseProgress**     | status, score, attempts, completed_at                        | Training        | → User, → TrainingCourse                          |
| **ClassifiedAd**           | title, description, category, price, status                  | Community       | → Property, → User, → Unit                        |
| **Idea**                   | title, description, status, upvotes                          | Community       | → Property, → User                                |
| **ParkingPermit**          | permit_type_id, parking_area, spot_number, valid_until       | Parking         | → Property, → Unit, → User, → Vehicle             |
| **ParkingViolation**       | violation_type, license_plate, status, location              | Parking         | → Property, → Event                               |
| **Vendor**                 | company_name, specialty, insurance_status, insurance_expiry  | Vendors         | → Property, → MaintenanceRequests[]               |
| **Equipment**              | name, category_id, serial_number, status, location           | Equipment       | → Property, → MaintenanceRequests[]               |
| **Attachment**             | file_name, file_type, file_size, storage_url                 | Core            | Polymorphic → any entity                          |
| **Document**               | title, category, visible_to_roles[], published               | Library         | → Property, → Attachment                          |
| **ShiftLog**               | content, shift_date, shift_period, priority_for_next_shift   | Operations      | → Property, → Event, → User                       |
| **EmergencyContact**       | contact_name, relationship, phone_primary                    | Core            | → User, → Unit                                    |
| **FOB**                    | serial_number, fob_type, status, issued_date                 | Security        | → Property, → Unit, → User                        |
| **BuzzerCode**             | code, label, active                                          | Security        | → Property, → Unit                                |
| **GarageClicker**          | serial_number, status, issued_date                           | Security        | → Property, → Unit, → User                        |
| **Vehicle**                | make, model, license_plate, color, year                      | Core            | → User, → Unit                                    |
| **Pet**                    | name, species, breed, weight                                 | Core            | → User, → Unit                                    |
| **AuditEntry**             | action, actor_id, entity_type, changes, ip_address           | Audit           | → Property, → User                                |
| **TranslationOverride**    | locale, namespace, key, value                                | i18n            | → Property, → User (created_by)                   |
| **CustomFieldDefinition**  | field_key, field_label, field_type, entity_type              | Core            | → Property, → EventType                           |

---

## 12. Internationalization (i18n) & Multi-Language Support

Concierge is built for the Canadian condo market, where bilingual requirements (English and French) are a legal and practical reality in Ontario and Quebec. Multi-language support is a day-one capability, not a retrofit.

### 12.1 Architecture

All user-facing strings are stored as **translation keys**, never hardcoded in source code. The platform resolves keys to display text at render time using the active locale.

**Translation file structure**: One JSON file per locale, organized by module namespace.

```
locales/
├── en-US/
│   ├── common.json          (shared labels: Save, Cancel, Search, etc.)
│   ├── events.json           (event module strings)
│   ├── maintenance.json      (maintenance module strings)
│   ├── amenities.json        (amenity module strings)
│   ├── notifications.json    (notification subject/body templates)
│   └── ...                   (one file per module)
├── en-CA/
│   └── ...                   (overrides only — inherits from en-US)
└── fr-CA/
    └── ...                   (full French-Canadian translations)
```

**Fallback chain**: When a translation key is missing, the system resolves it in this order:

1. **User's preferred locale** (`User.preferred_locale`, e.g., `fr-CA`)
2. **Property default locale** (`Property.default_locale`, e.g., `en-CA`)
3. **Base language** (e.g., `fr-CA` falls back to `fr`, `en-CA` falls back to `en-US`)
4. **System default** (`en-US` — always complete, never has missing keys)

This means a property can enable French without translating every custom string. Untranslated strings gracefully appear in English rather than showing broken keys.

### 12.2 Supported Languages at Launch

| Locale Code | Language           | Reason                                                          |
| ----------- | ------------------ | --------------------------------------------------------------- |
| `en-US`     | English (US)       | System default and base language                                |
| `en-CA`     | English (Canadian) | Canadian spelling and date formats (e.g., "colour", dd/mm/yyyy) |
| `fr-CA`     | French (Canadian)  | Required for Quebec properties and bilingual Ontario buildings  |

Additional locales can be added post-launch without code changes — only new translation JSON files are needed.

### 12.3 Translation Management

**System-provided translations**: Concierge ships with complete, professional translations for all system UI strings in every launch locale. These are the defaults.

**Property-level overrides**: A Property Admin can customize any translation string for their property. This is stored as a per-property override layer that takes priority over system defaults.

```
TranslationOverride
├── id (UUID)
├── property_id → Property
├── locale (varchar 10, e.g., "fr-CA")
├── namespace (varchar 50, e.g., "events", "common")
├── key (varchar 200, e.g., "event_type.package.name")
├── value (text — the custom translation)
├── created_by → User
└── created_at, updated_at
```

**Use cases for overrides**:

- A property calls its amenity "Party Suite" instead of the default "Party Room"
- A property uses industry-specific terminology in French that differs from the system default
- Custom event type names need translated labels

**Admin UI**: The translation management screen shows all keys for a selected locale with the system default and any property override side by side. Admins can search, filter by module, and export/import overrides as CSV for bulk editing.

### 12.4 Content Translation

There are two categories of text in Concierge, and each is handled differently:

**System UI strings** (labels, buttons, menus, error messages, status names):

- Translated via the translation file system described above
- Every key has a professional translation in all launch locales
- Rendered in the viewer's preferred locale

**User-generated content** (announcements, classified ads, event descriptions, maintenance notes):

- Stored in the language the author wrote it in
- **AI auto-translation**: When a property has multiple supported locales, the AI service layer (via the AI Gateway — see Section 7) can auto-translate user-generated content on demand. For example, a Property Manager writes an announcement in English and the system generates a French version for `fr-CA` residents. This is capability #45 as defined in PRD 09 (Announcements & Communication).
- Auto-translated content is clearly labeled as machine-translated so readers know it was not written by the author
- Authors can review and edit auto-translations before publishing
- The original language version is always preserved as the source of truth

### 12.5 RTL (Right-to-Left) Support

Full RTL layout support for languages like Arabic and Hebrew is a **future consideration** (v3+). However, the architecture is built to support it without rework:

- All layout uses logical properties (`margin-inline-start` instead of `margin-left`)
- The CSS direction is driven by a `dir` attribute on the root element, set from the active locale
- Icon mirroring rules are defined per icon (some icons like arrows flip in RTL; others like logos do not)
- No layout assumes left-to-right text flow

### 12.6 Date, Time, and Currency Formatting

All dates, times, numbers, and currencies are formatted using **locale-aware formatting** (via the `Intl` API on the client and equivalent libraries server-side). Nothing is hardcoded to a single format.

| Data Type | en-US      | en-CA      | fr-CA      |
| --------- | ---------- | ---------- | ---------- |
| Date      | 03/14/2026 | 2026-03-14 | 2026-03-14 |
| Time      | 2:30 PM    | 2:30 p.m.  | 14 h 30    |
| Currency  | $1,250.00  | $1,250.00  | 1 250,00 $ |
| Numbers   | 1,250.50   | 1,250.50   | 1 250,50   |

**Rules**:

- The property's timezone (`Property.timezone`) governs time display. Users always see times in the building's local timezone, regardless of their browser timezone.
- Currency symbol and format follow the active locale
- Relative timestamps ("5 minutes ago", "il y a 5 minutes") are locale-aware
- Calendar controls (week start day, month names, day abbreviations) adapt to the active locale
- Export files (Excel, PDF) use the requesting user's locale for formatting

### 12.7 Data Model Fields

Three fields across two entities support the i18n system:

| Entity     | Field                 | Type                          | Purpose                                                                                                                                                       |
| ---------- | --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`     | `preferred_locale`    | varchar 10, nullable          | The user's chosen language. When null, falls back to the property default.                                                                                    |
| `Property` | `default_locale`      | varchar 10, default `"en-US"` | The property's primary language for all UI and notifications.                                                                                                 |
| `Property` | `supported_locales[]` | varchar 10 array              | All locales enabled for this property. Controls which languages appear in the user language picker and which notification template translations are required. |

**Locale picker**: Users see a language selector in their profile settings. The options come from `Property.supported_locales[]`. Changing the locale immediately re-renders the entire UI — no page reload is needed.

**Validation**: `Property.default_locale` must always be present in `Property.supported_locales[]`. The API enforces this constraint.

### 12.8 Integration with Other Sections

This section connects to several other parts of the architecture:

- **Notification Templates (Section 6.3)**: Templates exist per locale. The notification service picks the template matching the recipient's locale.
- **Search Index (Section 8.4)**: Multi-language analyzers index content with locale-appropriate stemming. System labels are indexed in all supported locales.
- **API Responses (Section 2.3)**: All user-facing labels in API responses are resolved to the requesting user's locale server-side. Clients display what they receive without local translation logic.
- **AI Service Layer (Section 7)**: The AI Gateway accepts a `target_locale` parameter for translation tasks. PII stripping (Section 7.3) is language-aware.
- **Configurable Elements (Section 2.7)**: Translation overrides and supported locales are property-level configurations managed by admins.
- **Announcements (PRD 09)**: AI auto-translation of announcement content is defined as capability #45.

---

## 13. Data Security, Backup & Disaster Recovery

Concierge is a multi-tenant SaaS platform handling sensitive personal information for hundreds of buildings and thousands of residents. This section defines the encryption, backup, disaster recovery, data isolation, PII handling, and compliance requirements that protect every byte of data in the system.

---

### 13.1 Encryption Architecture

All data is encrypted twice: once by the storage layer (at rest) and once by the transport layer (in transit). Sensitive PII fields receive a third encryption layer at the application level before they ever reach the database.

#### At-Rest Encryption

| Aspect             | Specification                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Algorithm**      | AES-256 (Advanced Encryption Standard, 256-bit keys)                                                                |
| **Scope**          | All databases, file storage buckets, backup archives, log archives, search indexes                                  |
| **Implementation** | Storage-layer encryption enabled on every volume and bucket -- no unencrypted storage exists anywhere in the system |
| **Key storage**    | Keys are never stored alongside the data they protect                                                               |

#### In-Transit Encryption

| Aspect                     | Specification                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Protocol**               | TLS 1.3 minimum for all connections (client-to-server, server-to-server, server-to-database, server-to-cache)                      |
| **Older protocols**        | TLS 1.0 and 1.1 are rejected. TLS 1.2 is accepted only as a fallback for legacy integrations and must be approved per-integration. |
| **Certificate management** | Automated certificate provisioning and renewal (no manual certificate rotation)                                                    |
| **Internal traffic**       | All internal service-to-service communication uses mutual TLS (mTLS) -- even within the same data center                           |

#### Application-Level PII Encryption (Double Encryption Layer)

Sensitive PII fields are encrypted by the application before being written to the database. This means that even if someone gains direct database access (bypassing the application), they cannot read PII without the application-level encryption keys.

**Fields with application-level encryption**:

| Entity               | Field                | Data Type                                     | Why It Needs Double Encryption                                                                 |
| -------------------- | -------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Resident`           | `email`              | varchar 320 (encrypted blob up to 1024 bytes) | Primary contact, identity anchor                                                               |
| `Resident`           | `phone`              | varchar 20 (encrypted blob up to 512 bytes)   | Personal contact number                                                                        |
| `Resident`           | `emergency_contacts` | JSONB (encrypted blob up to 4096 bytes)       | Contains names, phones, and relationships of third parties who did not consent to the platform |
| `Incident`           | `description`        | text (encrypted blob up to 16384 bytes)       | May contain witness names, suspect descriptions, medical details                               |
| `Incident`           | `suspect_info`       | text (encrypted blob up to 8192 bytes)        | Physical descriptions, identifying information                                                 |
| `Package`            | `signature`          | bytea (encrypted blob up to 65536 bytes)      | Biometric-adjacent data (handwriting pattern)                                                  |
| `MaintenanceRequest` | `entry_instructions` | text (encrypted blob up to 4096 bytes)        | May contain alarm codes, key locations, access details                                         |

**How it works**:

1. Application receives plaintext PII from the API request
2. Application encrypts the field value using the property's encryption key via the KMS
3. Encrypted blob is written to the database column
4. Database applies its own storage-layer encryption (AES-256) on top
5. On read, the database decrypts its layer, then the application decrypts the PII layer
6. Plaintext PII is returned only to authorized users who pass role-based access checks

#### Encryption Key Management

| Aspect                               | Specification                                                                                                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Key Management Service (KMS)**     | Dedicated KMS (cloud-provider-managed or HashiCorp Vault). No keys stored in application code, environment variables, or config files.                                                                     |
| **Key hierarchy**                    | Master key (KMS-managed, never exported) > Property-level data encryption keys (DEKs) > wrapped with the master key                                                                                        |
| **Key rotation**                     | Every 90 days (quarterly) for property-level DEKs. Master key rotated annually.                                                                                                                            |
| **Rotation process**                 | New key encrypts new writes. Background job re-encrypts existing data with the new key within 72 hours. Old key retained in retired state until re-encryption completes.                                   |
| **Per-property keys (Premium tier)** | Each property gets its own DEK. Standard tier shares a DEK across properties but still has full row-level isolation.                                                                                       |
| **Key access audit**                 | Every key usage (encrypt/decrypt) is logged with timestamp, user ID, and target field                                                                                                                      |
| **Key compromise procedure**         | If a key is suspected compromised: (1) generate new key immediately, (2) re-encrypt all data within 24 hours, (3) retire old key, (4) notify affected properties, (5) log incident in BreachIncident table |

---

### 13.2 Backup Strategy

Backups run continuously and automatically. No human action is needed for routine backups. The system takes multiple backup types at different frequencies to balance recovery speed against storage cost.

| Backup Type                       | Frequency                                   | Description                                                                                                                                    |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Point-in-time recovery (PITR)** | Continuous (every transaction)              | Write-ahead log (WAL) streaming. Allows restoring the database to any second within the retention window.                                      |
| **Daily full snapshot**           | Every 24 hours at 03:00 property-local-time | Complete database dump plus file storage snapshot. Taken during lowest-traffic window.                                                         |
| **File/document replication**     | Continuous                                  | Photos, PDFs, signatures, and all uploaded files replicated to secondary storage with versioning enabled (last 30 versions retained per file). |

**Backup encryption**: Every backup is encrypted with AES-256 before it leaves the primary server. Backups at rest in secondary storage are encrypted with a separate backup-specific encryption key (not the same key as the production data).

**Geographic redundancy**:

| Location      | Role                                                 | Purpose                                                        |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **Primary**   | Toronto (ca-central-1)                               | All production traffic, primary database, primary file storage |
| **Secondary** | Montreal (ca-central-1b) or separate Canadian region | Backup storage, standby replica, failover target               |

**Rules**:

- Minimum 2 copies of every backup in geographically separate locations (minimum 250 km apart)
- Both locations must be within Canada (data residency requirement)
- Secondary receives backup data within 15 minutes of creation
- File/document backups include full version history

---

### 13.3 Backup Retention Policy

Different backup types are retained for different periods based on recovery needs and compliance requirements.

| Backup Type                   | Retention Period             | Automated Deletion                                                   |
| ----------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| Point-in-time recovery (PITR) | 7 days (continuous, rolling) | Oldest WAL segments purged as new ones arrive                        |
| Daily snapshots               | 30 days                      | Snapshot deleted on day 31                                           |
| Weekly snapshots              | 90 days                      | One snapshot per week promoted from daily; deleted after 90 days     |
| Monthly snapshots             | 1 year (12 months)           | One snapshot per month promoted from weekly; deleted after 12 months |
| Annual snapshots              | 7 years                      | One snapshot per year promoted from monthly; deleted after 7 years   |

**Configurable retention**:

| Field                      | Data Type | Max Length | Required | Default | Validation                | Error Message                                                 |
| -------------------------- | --------- | ---------- | -------- | ------- | ------------------------- | ------------------------------------------------------------- |
| `pitr_retention_days`      | integer   | --         | Yes      | `7`     | Min: 3, Max: 30           | "PITR retention must be between 3 and 30 days."               |
| `daily_retention_days`     | integer   | --         | Yes      | `30`    | Min: 7, Max: 90           | "Daily snapshot retention must be between 7 and 90 days."     |
| `weekly_retention_days`    | integer   | --         | Yes      | `90`    | Min: 30, Max: 365         | "Weekly snapshot retention must be between 30 and 365 days."  |
| `monthly_retention_months` | integer   | --         | Yes      | `12`    | Min: 6, Max: 84 (7 years) | "Monthly snapshot retention must be between 6 and 84 months." |
| `annual_retention_years`   | integer   | --         | Yes      | `7`     | Min: 1, Max: 25           | "Annual snapshot retention must be between 1 and 25 years."   |

Properties in jurisdictions with longer legal retention requirements (e.g., Quebec condos under certain regulations) can extend any retention period up to the maximum.

**Automated deletion**:

- Expired backups are deleted automatically by a daily cleanup job running at 04:00 UTC
- Every deletion is logged in the audit trail with: backup ID, backup type, original creation date, deletion reason ("retention expired"), and the retention policy that triggered it
- Deletion audit entries are retained for 7 years (they are never auto-deleted)

---

### 13.4 Backup Integrity Verification

Backups are useless if they are corrupted or incomplete. The system automatically verifies backup integrity on a recurring schedule.

#### Automated Weekly Verification

| Step | Action                                                                          | Pass Criteria                                                              |
| ---- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | Restore the latest daily snapshot to an isolated environment                    | Restore completes without errors                                           |
| 2    | Compare database record counts against production                               | Counts match within 0.1% (accounts for records created during restore)     |
| 3    | Verify file checksums (random sample of 1000 files)                             | All checksums match                                                        |
| 4    | Boot the application against the restored database                              | Application starts and responds to health-check endpoint within 60 seconds |
| 5    | Run a read-only smoke test (query each table, load one record from each module) | All queries return results                                                 |
| 6    | Log results to `BackupVerification` table                                       | --                                                                         |
| 7    | Tear down the isolated environment                                              | --                                                                         |

#### Monthly Full Restore Drill

- Full restore of the most recent daily snapshot to an identical-to-production environment
- Verify RTO by measuring time from "start restore" to "application serving traffic"
- Verify RPO by comparing the latest record timestamp in the restored database against the backup timestamp
- Property Managers and Super Admins can view drill results in the Backup & Recovery Dashboard (see PRD 16, Section 3.16.5)

#### Verification Alerts

| Condition                                  | Alert Channel      | Recipients  |
| ------------------------------------------ | ------------------ | ----------- |
| Weekly verification fails                  | Email + SMS        | Super Admin |
| Monthly drill exceeds RTO target (4 hours) | Email + SMS        | Super Admin |
| Checksum mismatch detected                 | Email + SMS + Push | Super Admin |
| Verification has not run in 10+ days       | Email              | Super Admin |

#### Verification Result Fields

| Field                | Data Type | Max Length | Required | Default | Validation            | Error Message                                                |
| -------------------- | --------- | ---------- | -------- | ------- | --------------------- | ------------------------------------------------------------ |
| `record_count_match` | boolean   | --         | Yes      | --      | Must be true or false | "Record count match status is required."                     |
| `checksum_match`     | boolean   | --         | Yes      | --      | Must be true or false | "Checksum match status is required."                         |
| `boot_test_passed`   | boolean   | --         | Yes      | --      | Must be true or false | "Boot test status is required."                              |
| `duration_seconds`   | integer   | --         | Yes      | --      | Min: 1, Max: 86400    | "Verification duration must be between 1 and 86400 seconds." |
| `notes`              | text      | 2000 chars | No       | `null`  | Max length: 2000      | "Verification notes must not exceed 2000 characters."        |

---

### 13.5 Disaster Recovery Plan

A disaster is any event that makes the primary region unable to serve production traffic -- data center outage, network partition, hardware failure, or catastrophic data corruption.

#### Recovery Objectives

| Metric                             | Target  | Meaning                                                                                                                                                  |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RPO** (Recovery Point Objective) | 1 hour  | Maximum acceptable data loss. In a worst-case scenario, at most 1 hour of data may be lost. In practice, PITR reduces this to seconds for most failures. |
| **RTO** (Recovery Time Objective)  | 4 hours | Maximum time from failure detection to full service restoration. Target is under 1 hour for automated failover scenarios.                                |

#### Automated Failover Procedure

This is the step-by-step process that runs when the primary region fails. It is designed to work without human intervention, though a Super Admin can trigger it manually at any time.

| Step | What Happens                                                                                                                                                                                                 | Timing       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| 1    | **Detection**: Health-check probes (running every 10 seconds) detect that the primary region is not responding.                                                                                              | 0:00         |
| 2    | **Confirmation**: System waits for 3 consecutive health-check failures, 30 seconds apart, to rule out transient network blips.                                                                               | 0:00 -- 1:30 |
| 3    | **DNS failover**: Automated DNS update routes all traffic from the primary region to the secondary region. DNS TTL is set to 60 seconds so clients pick up the change quickly.                               | 1:30 -- 3:00 |
| 4    | **Database promotion**: The secondary (read-replica) database is promoted to become the new primary database. It accepts reads and writes.                                                                   | 3:00 -- 5:00 |
| 5    | **File storage switch**: Application switches to the secondary file storage replica. Uploads and downloads work against the secondary copy.                                                                  | 5:00 -- 6:00 |
| 6    | **Application servers start serving**: Application servers in the secondary region begin handling production traffic.                                                                                        | 6:00 -- 8:00 |
| 7    | **Notification**: Super Admin receives SMS + email + push notification: "Automated failover complete. Primary region [name] is down. Secondary region [name] is now serving traffic."                        | 8:00         |
| 8    | **Failback** (after primary recovers): Once the primary region is healthy again, data is synced from secondary back to primary. Failback is scheduled during a maintenance window to avoid disrupting users. | Manual       |

**Total automated failover time**: Under 10 minutes for most scenarios. The 4-hour RTO target accounts for worst-case scenarios requiring manual intervention.

#### Manual Failover

Super Admins can trigger failover manually from the Backup & Recovery Dashboard (PRD 16, Section 3.16.5):

| Field               | Data Type | Max Length | Required | Default | Validation                                     | Error Message                                                                    |
| ------------------- | --------- | ---------- | -------- | ------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `confirmation_text` | varchar   | 8 chars    | Yes      | --      | Must exactly equal `FAILOVER` (case-sensitive) | "Type FAILOVER to confirm. This action routes all traffic to the backup region." |
| `reason`            | text      | 500 chars  | Yes      | --      | Min length: 10, Max length: 500                | "Please provide a reason for manual failover (10-500 characters)."               |

#### Failover History Fields

| Field               | Data Type               | Max Length | Required | Default                       | Validation                                                  | Error Message                                                         |
| ------------------- | ----------------------- | ---------- | -------- | ----------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `trigger_type`      | enum                    | --         | Yes      | --                            | One of: `automated`, `manual`                               | "Trigger type must be automated or manual."                           |
| `triggered_by`      | UUID                    | --         | No       | `null` (system for automated) | Valid user UUID if manual                                   | "Invalid user ID for manual failover trigger."                        |
| `source_region`     | varchar                 | 50 chars   | Yes      | --                            | Non-empty, valid region identifier                          | "Source region is required."                                          |
| `target_region`     | varchar                 | 50 chars   | Yes      | --                            | Non-empty, valid region identifier                          | "Target region is required."                                          |
| `started_at`        | timestamp with timezone | --         | Yes      | --                            | Must be a valid ISO 8601 timestamp                          | "Valid start timestamp is required."                                  |
| `completed_at`      | timestamp with timezone | --         | No       | `null`                        | Must be after `started_at`                                  | "Completion time must be after start time."                           |
| `duration_seconds`  | integer                 | --         | No       | `null`                        | Min: 0, Max: 86400                                          | "Failover duration must be between 0 and 86400 seconds."              |
| `status`            | enum                    | --         | Yes      | `in_progress`                 | One of: `in_progress`, `completed`, `failed`, `rolled_back` | "Status must be one of: in_progress, completed, failed, rolled_back." |
| `reason`            | text                    | 500 chars  | No       | `null`                        | Max length: 500                                             | "Failover reason must not exceed 500 characters."                     |
| `data_loss_seconds` | integer                 | --         | No       | `null`                        | Min: 0                                                      | "Data loss estimate cannot be negative."                              |

---

### 13.6 Per-Property Data Isolation

Every property's data is isolated from every other property's data. This is enforced at multiple layers so that a bug or breach in one layer does not expose cross-property data.

#### Isolation Layers

| Layer                             | Mechanism                                                                                                                                                                                                                                       | What It Prevents                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Database (Row-Level Security)** | Every table includes a `property_id` column. PostgreSQL RLS policies ensure that every query is automatically scoped to the authenticated user's `property_id`. Even raw SQL run against the database cannot return rows from another property. | Database-level cross-property access    |
| **API layer**                     | The authentication token includes `property_id`. Every API handler extracts and enforces this value. There is no API endpoint that accepts a `property_id` as a user-supplied parameter (it always comes from the token).                       | Application-level cross-property access |
| **Application logic**             | All ORM queries include an automatic `.where(property_id = context.property_id)` scope. Developers cannot accidentally omit this -- it is injected by middleware.                                                                               | Developer error                         |
| **Search index**                  | Search indexes are partitioned by `property_id`. A search query for "John" in Property A never returns results from Property B.                                                                                                                 | Cross-property search leakage           |
| **File storage**                  | Uploaded files are stored in property-scoped paths (`/properties/{property_id}/files/`). Bucket policies prevent cross-path access.                                                                                                             | Cross-property file access              |

#### Access Matrix

| Role                         | Cross-Property Access                                          | Audited                                                     |
| ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Super Admin (platform level) | Yes -- can access all properties through the property switcher | Every access logged with property ID, timestamp, and action |
| Property Admin               | Only their assigned properties (1 or more)                     | Yes                                                         |
| Property Manager             | Only their assigned property (exactly 1)                       | Yes                                                         |
| All other roles              | Only their property (exactly 1)                                | Yes                                                         |

#### Premium Tier: Dedicated Connection Pools

Properties on the premium tier get dedicated database connection pools. This provides:

- Performance isolation: a traffic spike on Property A does not slow down Property B's queries
- Enhanced security: connection credentials are unique per property
- Easier compliance: connection logs can be filtered to a single property

#### Breach Containment

If one property's data is compromised:

- Only that property's encryption key (DEK) is affected
- All other properties use different DEKs and are not impacted
- The compromised property's DEK is rotated immediately
- Affected residents are notified within 72 hours (see Section 13.8)
- Incident is logged in the `BreachIncident` table

---

### 13.7 PII Data Handling

Every field in the system is classified into one of three categories. This classification drives encryption, access logging, retention, and deletion behavior.

#### Classification Tiers

| Tier              | Definition                                                                                                                    | Encryption                                                                                           | Access Logging                                                                     | Examples                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Sensitive PII** | Data that could cause significant harm if exposed -- financial, medical, biometric-adjacent, or government-issued identifiers | Double encryption (application + storage layer)                                                      | Every read and write logged                                                        | Medical info in incident reports, photos of people, package signatures, suspect descriptions  |
| **PII**           | Data that identifies a specific individual but is commonly shared (business cards, email signatures, etc.)                    | Standard encryption (storage layer) + application-level encryption for fields listed in Section 13.1 | Every write logged; reads logged for bulk access (export, search result sets > 50) | Name, email, phone, address, emergency contacts, vehicle license plates, FOB serial numbers   |
| **Non-PII**       | Data that does not identify an individual, even when combined with other non-PII fields                                       | Standard encryption (storage layer only)                                                             | Standard audit trail (no field-level logging)                                      | Event counts, timestamps, configuration settings, anonymized analytics, system health metrics |

#### PII Field Inventory

| Entity               | Field                | Classification | Encrypted at App Level              | Max Length                  |
| -------------------- | -------------------- | -------------- | ----------------------------------- | --------------------------- |
| `Resident`           | `first_name`         | PII            | No (standard encryption)            | 100 chars                   |
| `Resident`           | `last_name`          | PII            | No (standard encryption)            | 100 chars                   |
| `Resident`           | `email`              | PII            | Yes                                 | 320 chars                   |
| `Resident`           | `phone`              | PII            | Yes                                 | 20 chars                    |
| `Resident`           | `emergency_contacts` | PII            | Yes                                 | JSONB, 4096 bytes encrypted |
| `Resident`           | `profile_photo`      | Sensitive PII  | Yes (file encrypted before storage) | 10 MB                       |
| `Unit`               | `buzzer_code`        | PII            | No (standard encryption)            | 20 chars                    |
| `Vehicle`            | `license_plate`      | PII            | No (standard encryption)            | 15 chars                    |
| `Incident`           | `description`        | Sensitive PII  | Yes                                 | 4000 chars                  |
| `Incident`           | `suspect_info`       | Sensitive PII  | Yes                                 | 2000 chars                  |
| `Incident`           | `photos`             | Sensitive PII  | Yes (file encrypted before storage) | 10 MB per photo             |
| `Package`            | `signature`          | Sensitive PII  | Yes                                 | 64 KB                       |
| `MaintenanceRequest` | `entry_instructions` | PII            | Yes                                 | 1000 chars                  |
| `FOB`                | `serial_number`      | PII            | No (standard encryption)            | 50 chars                    |

#### PII Access Logging

Every access to a PII or Sensitive PII field is logged in the `DataAccessLog` table:

| Field         | Data Type               | Max Length | Required | Default        | Validation                                  | Error Message                                                |
| ------------- | ----------------------- | ---------- | -------- | -------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `id`          | UUID                    | --         | Yes      | Auto-generated | Valid UUID v4                               | --                                                           |
| `user_id`     | UUID                    | --         | Yes      | --             | Valid user UUID, must exist                 | "User ID is required for PII access logging."                |
| `property_id` | UUID                    | --         | Yes      | --             | Valid property UUID, must exist             | "Property ID is required for PII access logging."            |
| `table_name`  | varchar                 | 100 chars  | Yes      | --             | Non-empty, must match a known table         | "Table name is required and must be a valid entity table."   |
| `record_id`   | UUID                    | --         | Yes      | --             | Valid UUID                                  | "Record ID is required."                                     |
| `field_name`  | varchar                 | 100 chars  | Yes      | --             | Non-empty, must match a known PII field     | "Field name is required and must be a recognized PII field." |
| `access_type` | enum                    | --         | Yes      | --             | One of: `read`, `write`, `delete`, `export` | "Access type must be one of: read, write, delete, export."   |
| `timestamp`   | timestamp with timezone | --         | Yes      | `now()`        | Must be a valid timestamp                   | "Valid timestamp is required."                               |
| `ip_address`  | varchar                 | 45 chars   | Yes      | --             | Valid IPv4 or IPv6 address                  | "A valid IP address is required."                            |
| `user_agent`  | varchar                 | 500 chars  | No       | `null`         | Max length: 500                             | "User agent must not exceed 500 characters."                 |

**Retention for access logs**: PII access logs are retained for 2 years. They are never auto-deleted before that period.

#### Data Minimization

- Every field must justify its existence. If fewer than 80% of properties use a field, it must be a custom field (JSONB), not a schema column.
- Optional fields default to `null`, not empty strings or placeholder values.
- File uploads are scanned for embedded metadata (EXIF data from photos, author info from PDFs) and stripped of non-essential metadata before storage.
- Analytics dashboards use anonymized, aggregated data -- never raw PII.

#### Right to Deletion (Data Subject Requests)

A resident can request that all their PII be permanently removed from the system. This is required under PIPEDA (Canada) and GDPR (EU, for future expansion).

**Deletion request fields**:

| Field              | Data Type               | Max Length | Required | Default        | Validation                                                | Error Message                                                                          |
| ------------------ | ----------------------- | ---------- | -------- | -------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `id`               | UUID                    | --         | Yes      | Auto-generated | Valid UUID v4                                             | --                                                                                     |
| `resident_id`      | UUID                    | --         | Yes      | --             | Valid resident UUID, must exist                           | "Resident ID is required."                                                             |
| `property_id`      | UUID                    | --         | Yes      | --             | Valid property UUID, must exist                           | "Property ID is required."                                                             |
| `requested_at`     | timestamp with timezone | --         | Yes      | `now()`        | Valid timestamp                                           | "Valid request timestamp is required."                                                 |
| `requested_by`     | enum                    | --         | Yes      | --             | One of: `resident`, `property_admin`, `super_admin`       | "Requester must be one of: resident, property_admin, super_admin."                     |
| `status`           | enum                    | --         | Yes      | `pending`      | One of: `pending`, `in_progress`, `completed`, `rejected` | "Status must be one of: pending, in_progress, completed, rejected."                    |
| `completed_at`     | timestamp with timezone | --         | No       | `null`         | Must be after `requested_at` if present                   | "Completion time must be after request time."                                          |
| `rejection_reason` | text                    | 500 chars  | No       | `null`         | Required if status is `rejected`; max 500 chars           | "Rejection reason is required when rejecting a deletion request (max 500 characters)." |
| `fields_deleted`   | JSONB                   | --         | No       | `null`         | Array of field names that were purged                     | "Fields deleted must be a valid JSON array."                                           |
| `audit_note`       | text                    | 1000 chars | No       | `null`         | Max length: 1000                                          | "Audit note must not exceed 1000 characters."                                          |

**Deletion process**:

1. Resident submits deletion request (via resident portal or written request processed by Property Admin)
2. Property Admin reviews and approves (or rejects with a reason)
3. System replaces all PII fields with `[DELETED]` (text) or `null` (binary) -- the record itself is not removed to preserve audit integrity
4. Associated files (photos, signatures, documents) are permanently deleted from all storage locations including backups older than 30 days
5. Deletion is logged in the audit trail and the `DataAccessLog`
6. Resident is notified by email that deletion is complete
7. Backups created after the deletion will not contain the deleted PII (it was replaced in the live database)
8. Backups created before the deletion are retained per retention policy but the encryption key for those specific records is destroyed after 30 days, rendering the data unrecoverable

**Deadline**: Deletion requests must be completed within 30 calendar days of receipt (PIPEDA requirement).

#### Data Export (Data Subject Requests)

A resident can request a machine-readable copy of all their data stored in the system.

| Field             | Data Type               | Max Length | Required | Default        | Validation                                                        | Error Message                                                             |
| ----------------- | ----------------------- | ---------- | -------- | -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`              | UUID                    | --         | Yes      | Auto-generated | Valid UUID v4                                                     | --                                                                        |
| `resident_id`     | UUID                    | --         | Yes      | --             | Valid resident UUID, must exist                                   | "Resident ID is required."                                                |
| `property_id`     | UUID                    | --         | Yes      | --             | Valid property UUID, must exist                                   | "Property ID is required."                                                |
| `requested_at`    | timestamp with timezone | --         | Yes      | `now()`        | Valid timestamp                                                   | "Valid request timestamp is required."                                    |
| `format`          | enum                    | --         | Yes      | `json`         | One of: `json`, `csv`                                             | "Export format must be json or csv."                                      |
| `status`          | enum                    | --         | Yes      | `pending`      | One of: `pending`, `generating`, `ready`, `downloaded`, `expired` | "Status must be one of: pending, generating, ready, downloaded, expired." |
| `download_url`    | varchar                 | 500 chars  | No       | `null`         | Valid URL, must be a signed/temporary URL                         | "Download URL must be a valid temporary URL."                             |
| `expires_at`      | timestamp with timezone | --         | No       | `null`         | Must be after `requested_at`                                      | "Expiry must be after request time."                                      |
| `file_size_bytes` | bigint                  | --         | No       | `null`         | Min: 0                                                            | "File size cannot be negative."                                           |

**Export includes**: All data associated with the resident -- profile fields, event history, package history, maintenance requests, amenity bookings, notification preferences, and login history. Files (photos, documents) are included as attachments in a ZIP archive.

**Export excludes**: Data about other residents, system configuration, and internal audit logs (which are platform records, not resident data).

**Download link**: Available for 7 days after generation, then automatically deleted. Link is signed and tied to the resident's authenticated session.

---

### 13.8 Compliance Framework

Concierge is built for the Canadian market first, with architecture that supports international expansion.

#### PIPEDA (Personal Information Protection and Electronic Documents Act) -- Canada

| Requirement             | How Concierge Meets It                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Data residency**      | All primary and backup data stored in Canadian data centers (Toronto and Montreal)                                 |
| **Consent**             | Residents explicitly consent to data collection during onboarding. Consent is recorded with timestamp and version. |
| **Purpose limitation**  | Each data field has a documented purpose. Data is not used beyond that purpose.                                    |
| **Right to access**     | Residents can export all their data via the Data Export feature (Section 13.7)                                     |
| **Right to deletion**   | Residents can request PII deletion via the Right to Deletion process (Section 13.7)                                |
| **Breach notification** | Automated system notifies affected properties within 72 hours of breach detection (see below)                      |
| **Accountability**      | Data Protection Officer (DPO) designated. Privacy Impact Assessments conducted for new features.                   |

#### GDPR (General Data Protection Regulation) -- EU

| Requirement                    | Status                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| **Data portability**           | Ready -- Data Export in machine-readable format (JSON/CSV) |
| **Right to be forgotten**      | Ready -- Right to Deletion process                         |
| **Consent management**         | Ready -- Granular consent tracking                         |
| **Data Protection Officer**    | Ready -- DPO role defined                                  |
| **Data Processing Agreements** | Future -- Required when expanding to EU market             |

#### SOC 2 Type II

| Principle                | How Concierge Meets It                                                                                                                                                                                                                                         | Target Timeline             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Security**             | Role-based access controls (RBAC) with 12 roles, per-property isolation via RLS, AES-256 encryption at rest, TLS 1.3 in transit, application-level PII double encryption, quarterly key rotation, automated vulnerability scanning, annual penetration testing | Year 2 certification target |
| **Availability**         | Geographic redundancy (Toronto primary, Montreal secondary, Calgary cold), automated failover with 30-minute RTO for regional outage, 99.9% uptime SLA, continuous health monitoring with automated alerts                                                     | Year 2 certification target |
| **Confidentiality**      | Per-property encryption keys, PII tiered classification (Critical/Sensitive/Standard), access logging for all Tier 1/2 PII reads, PII stripped from application logs and AI prompts, data residency enforced in Canada                                         | Year 2 certification target |
| **Processing integrity** | Immutable audit trail for all data modifications with before/after diffs, input validation on every field, database constraints and referential integrity, automated backup integrity verification (weekly checksum, monthly restore test)                     | Year 3                      |
| **Privacy**              | Granular consent tracking with timestamp and version, right to access (data export), right to deletion (PII erasure workflow), purpose limitation per data field, privacy impact assessments for new features, DPO role designated                             | Year 3                      |

**SOC 2 Type II Audit Requirements**:

- **Evidence collection**: Automated collection of access logs, change logs, incident records, and configuration snapshots
- **Continuous monitoring**: Real-time dashboards for all 5 trust principles with threshold-based alerts
- **Annual audit**: Third-party auditor engagement with 90-day observation window
- **Remediation tracking**: All audit findings tracked to resolution with deadlines and owner assignment

#### ISO 27001 -- Information Security Management System (ISMS)

| Control Area                | How Concierge Meets It                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Risk assessment**         | Formal risk register maintained. Each module has documented threats, vulnerabilities, and mitigations. Risk assessment reviewed quarterly and after any security incident.                             |
| **Security policies**       | Written policies for: access control, encryption, backup, incident response, acceptable use, change management, vendor management. Reviewed annually. All staff must acknowledge.                      |
| **Asset inventory**         | All data assets classified by sensitivity tier (Critical/Sensitive/Standard). Infrastructure assets tracked in configuration management database. Software dependencies scanned every build.           |
| **Access control**          | Least-privilege principle enforced via RBAC. 12 predefined roles with granular permissions. Custom roles supported. Access reviews conducted quarterly. Inactive accounts auto-disabled after 90 days. |
| **Cryptography**            | AES-256 at rest, TLS 1.3 in transit. Per-property encryption keys. Key lifecycle management via cloud KMS. Quarterly key rotation. Certificate monitoring with 30-day expiry alerts.                   |
| **Physical security**       | Cloud provider (Canadian data centers) handles physical security. SOC 2 / ISO 27001 certification required from cloud provider. Data center access audited.                                            |
| **Operations security**     | Change management process for all production deployments. Separation of development, staging, and production environments. Malware protection via container scanning and dependency auditing.          |
| **Communications security** | All API traffic encrypted. Webhook payloads signed with HMAC. Internal service-to-service communication uses mTLS. Network segmentation between tenant data stores.                                    |
| **Supplier relationships**  | All third-party vendors (AI providers, payment processor, notification services) assessed for security compliance. Vendor register maintained with contract review dates.                              |
| **Incident management**     | P1-P4 incident classification with defined SLAs (see Section 13.9). Incident response team defined. Post-incident reviews mandatory. Lessons learned documented and tracked.                           |
| **Business continuity**     | RPO: 1 hour, RTO: 4 hours. Geographic redundancy. Quarterly disaster recovery drills. Recovery runbook maintained. Communication templates for stakeholder notification.                               |
| **Compliance**              | Regular internal audits against ISO 27001 controls. External audit annually. Non-conformities tracked to resolution. Regulatory changes monitored and assessed for impact.                             |

**Certification timeline**: Year 2 -- Gap assessment and remediation. Year 3 -- Stage 1 and Stage 2 certification audit.

#### ISO 27701 -- Privacy Information Management System (PIMS)

ISO 27701 extends ISO 27001 specifically for privacy management. It defines requirements for PII controllers and PII processors.

| Requirement                     | How Concierge Meets It                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PII controller obligations**  | Concierge acts as PII processor. Property management companies are PII controllers. Roles and responsibilities documented in Data Processing Agreements (DPAs) with each property.                                                                                                                                                                                             |
| **Lawful basis for processing** | Each data field has a documented processing purpose and lawful basis (consent, contract, legitimate interest). Tracked in a Record of Processing Activities (ROPA).                                                                                                                                                                                                            |
| **Privacy impact assessments**  | Privacy Impact Assessment (PIA) conducted before launching any new feature that handles PII. PIA template standardized. Results reviewed by DPO.                                                                                                                                                                                                                               |
| **Data subject rights**         | Right to access: Data Export feature (Section 13.7). Right to correction: Residents and admins can update profile data. Right to deletion: Right to Deletion workflow (Section 13.7) with 30-day completion SLA. Right to restrict processing: Admin can disable specific data processing per resident. Right to data portability: JSON/CSV export in machine-readable format. |
| **Cross-border data transfers** | All data stored in Canada. No cross-border transfer by default. If future expansion requires transfer, Standard Contractual Clauses (SCCs) or adequacy decisions will be used.                                                                                                                                                                                                 |
| **Privacy by design**           | Privacy considerations embedded in development lifecycle. Default settings favor privacy (opt-in, not opt-out). Data minimization: only collect what is needed. Anonymization used for analytics.                                                                                                                                                                              |
| **Breach management**           | Breach notification within 72 hours (PIPEDA) or 60 days (HIPAA for health data). Breach severity assessment automated. Affected data subjects identified via access logs.                                                                                                                                                                                                      |
| **Training and awareness**      | All development staff complete annual privacy training. Privacy awareness included in LMS module for property staff.                                                                                                                                                                                                                                                           |

**Certification timeline**: After ISO 27001 certification -- ISO 27701 extends the same audit framework.

#### ISO 27017 -- Cloud Security Controls

ISO 27017 provides cloud-specific security guidance for multi-tenant SaaS platforms.

| Control                                    | How Concierge Meets It                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-tenant isolation**                 | Row-Level Security (RLS) at database level. Per-property encryption keys. API middleware validates tenant context on every request. Search indexes partitioned by property. File storage uses separate prefixes per property.                                                                                             |
| **Shared responsibility model**            | Documented matrix showing: what the cloud provider is responsible for (physical security, network infrastructure, hypervisor), what Concierge is responsible for (application security, data encryption, access control), what the property admin is responsible for (user management, password policies, data accuracy). |
| **Virtual resource hardening**             | Container images scanned for vulnerabilities before deployment. Base images updated monthly. No root access in containers. Read-only file systems where possible. Resource limits enforced (CPU, memory, storage).                                                                                                        |
| **Cloud service customer data protection** | Customer data never leaves Canadian data centers. Data encrypted at rest and in transit. Logical deletion followed by cryptographic erasure when tenants leave. Backup data follows same geographic and encryption policies.                                                                                              |
| **Secure data deletion**                   | When a property terminates service: all live data deleted within 30 days, per-property encryption keys destroyed (rendering backup data unrecoverable), deletion confirmation provided to property admin, deletion logged in immutable audit trail.                                                                       |
| **Cloud service monitoring**               | Cloud infrastructure monitored 24/7 for availability, performance, and security anomalies. Super Admin dashboard shows system health, uptime, and resource utilization.                                                                                                                                                   |
| **Audit logging for cloud operations**     | All cloud infrastructure changes logged (deployments, scaling events, configuration changes). Logs retained for 2 years. Accessible to auditors on request.                                                                                                                                                               |

#### ISO 9001 -- Quality Management System (QMS)

ISO 9001 ensures consistent quality in operations and continuous improvement.

| Principle                          | How Concierge Meets It                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer focus**                 | Admin experience is paramount (Rule 3). UX priority hierarchy ensures the buyer always has the best experience. Feature requests tracked and prioritized. Customer satisfaction measured via in-app feedback and NPS surveys.                                             |
| **Leadership**                     | Product vision and quality standards documented in RULEBOOK.md. 12 mandatory rules applied to every feature. Quality objectives reviewed quarterly.                                                                                                                       |
| **Engagement of people**           | Staff training via built-in LMS module. Role-specific onboarding flows. Clear documentation for every feature. Tooltips and contextual help throughout the interface.                                                                                                     |
| **Process approach**               | Every critical operation has a documented process: property onboarding (8-step wizard), incident response (P1-P4 classification), backup verification (weekly/monthly/quarterly), resident data deletion (8-step process).                                                |
| **Improvement**                    | Continuous improvement cycle (Plan-Do-Check-Act): Plan -- PRD defines requirements. Do -- Development implements. Check -- Automated testing, security scanning, backup verification. Act -- Post-incident reviews, audit findings, customer feedback drive improvements. |
| **Evidence-based decision making** | Three analytics layers per module (Operational, Performance, AI Insights). 52 report types. AI-powered anomaly detection. All decisions backed by data from dashboards and reports.                                                                                       |
| **Relationship management**        | Vendor scorecard for third-party service providers. Integration health monitoring. Cloud provider SLA tracking. Property admin communication during incidents and maintenance.                                                                                            |

**Internal audits**: Quarterly self-assessment against ISO 9001 processes. Annual review of quality objectives and metrics.

#### HIPAA -- Health Insurance Portability and Accountability Act

HIPAA compliance is required because resident profiles may store Protected Health Information (PHI): medical conditions, accessibility needs, emergency medical information, allergies, and medications.

| Requirement                             | How Concierge Meets It                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PHI identification**                  | The following fields are classified as PHI: `medical_conditions`, `accessibility_needs`, `emergency_medical_info`, `allergies`, `medications`, `hearing_impaired`, `vision_impaired`, `mobility_impaired`, `cognitive_impaired` on resident and emergency contact records.                                                                                                                                                                                                          |
| **Encryption**                          | All PHI fields receive Tier 1 (Critical) encryption: AES-256 at database level PLUS application-level encryption before database storage. Decryption requires authenticated session with appropriate role.                                                                                                                                                                                                                                                                          |
| **Minimum necessary standard**          | PHI is only displayed to roles that need it: Security Guard sees accessibility flags (hearing/vision/mobility) for emergency response, but NOT full medical history. Property Admin sees all PHI for unit management. Resident sees their own PHI only. Board Members, Contractors, and other roles see NO PHI.                                                                                                                                                                     |
| **Access controls**                     | PHI access requires: authenticated session, role with PHI permission, active property context, valid reason (screen/feature that legitimately needs PHI).                                                                                                                                                                                                                                                                                                                           |
| **Access logging**                      | Every read, write, or export of PHI is logged in `DataAccessLog` with: user ID, timestamp, IP address, field accessed, access type (read/write/export), session ID. PHI access logs retained for **6 years** (HIPAA requirement -- longer than the standard 2-year PII log retention).                                                                                                                                                                                              |
| **Business Associate Agreements (BAA)** | Required with every third party that could access PHI: Cloud hosting provider (data at rest), AI providers (if PHI were ever sent -- but our architecture strips PII/PHI before AI processing, so BAA may not be required for AI providers), Backup storage provider, Customer support tools (if agents can view resident data). BAA register maintained with renewal dates.                                                                                                        |
| **Breach notification**                 | PHI breaches must be reported within **60 days** to affected individuals (stricter than PIPEDA's 72-hour requirement for the notification itself, but PIPEDA requires faster initial reporting). If breach affects 500+ individuals, must also notify HHS (U.S. Department of Health and Human Services) and media. Breach notification includes: description of breach, types of PHI involved, steps individuals should take, what Concierge is doing to investigate and mitigate. |
| **PHI in AI processing**                | PHI is NEVER sent to AI providers. Before any AI API call, PHI fields are stripped and replaced with anonymized placeholders: "Resident has [MEDICAL_CONDITION]" not "Resident has diabetes." AI responses are cached without PHI.                                                                                                                                                                                                                                                  |
| **PHI in notifications**                | Notifications NEVER include PHI. Emergency notifications say "Unit 302 has a medical alert on file" not "Resident in 302 has a pacemaker and is diabetic."                                                                                                                                                                                                                                                                                                                          |
| **PHI in exports**                      | Exporting data containing PHI requires: role with PHI export permission, confirmation dialog: "This export contains sensitive health information. Proceed?", export event logged with all PHI field names included in the log.                                                                                                                                                                                                                                                      |
| **PHI disposal**                        | When a resident moves out: PHI is archived encrypted for the retention period (configurable, default 7 years for HIPAA). After retention: PHI fields replaced with `[DELETED]`, encryption key for those records destroyed. Disposal logged in audit trail.                                                                                                                                                                                                                         |
| **Training**                            | All staff with PHI access must complete HIPAA awareness training via the LMS module. Training completion tracked. Annual recertification required.                                                                                                                                                                                                                                                                                                                                  |
| **Risk analysis**                       | Annual HIPAA risk analysis covering: administrative safeguards (policies, training, access management), physical safeguards (cloud provider's responsibility, verified via their SOC 2/ISO 27001), technical safeguards (encryption, access controls, audit logs, transmission security).                                                                                                                                                                                           |

**HIPAA compliance note**: While HIPAA is a U.S. regulation, Concierge implements these controls because: (1) Canadian buildings may have U.S. residents whose health data is protected, (2) future U.S. market expansion requires readiness, (3) HIPAA standards represent best-in-class PHI protection that exceeds PIPEDA requirements for health data.

#### Security Testing

| Test Type                        | Frequency   | Scope                                                                          |
| -------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| Automated vulnerability scanning | Weekly      | All public-facing endpoints, dependencies, container images                    |
| Automated penetration testing    | Quarterly   | OWASP Top 10 attacks against API and web application                           |
| Manual penetration testing       | Annually    | Full-scope engagement by third-party security firm                             |
| Security audit                   | Annually    | Code review, architecture review, access controls, encryption verification     |
| Dependency scanning              | Every build | Check all packages for known CVEs; block deployment if critical/high CVE found |

#### Breach Notification System

When a data breach is detected (or suspected), the system follows this automated process:

| Step | Action                                                                     | Timing                     |
| ---- | -------------------------------------------------------------------------- | -------------------------- |
| 1    | Security team creates a `BreachIncident` record                            | Immediately upon detection |
| 2    | Affected properties identified automatically (from data access logs)       | Within 1 hour              |
| 3    | Super Admin notified via SMS + email + push                                | Within 1 hour              |
| 4    | Affected Property Admins notified via email + push                         | Within 24 hours            |
| 5    | Affected residents notified via email (if PII was exposed)                 | Within 72 hours            |
| 6    | Privacy Commissioner of Canada notified (if breach meets PIPEDA threshold) | Within 72 hours            |
| 7    | Incident resolved and resolution documented                                | As soon as possible        |

#### Breach Incident Fields

| Field                      | Data Type               | Max Length | Required | Default        | Validation                                                             | Error Message                                                                  |
| -------------------------- | ----------------------- | ---------- | -------- | -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`                       | UUID                    | --         | Yes      | Auto-generated | Valid UUID v4                                                          | --                                                                             |
| `detected_at`              | timestamp with timezone | --         | Yes      | `now()`        | Valid timestamp                                                        | "Detection timestamp is required."                                             |
| `severity`                 | enum                    | --         | Yes      | --             | One of: `low`, `medium`, `high`, `critical`                            | "Severity must be one of: low, medium, high, critical."                        |
| `affected_properties`      | JSONB                   | --         | Yes      | `[]`           | Array of valid property UUIDs                                          | "Affected properties must be a valid JSON array of property IDs."              |
| `affected_records_count`   | integer                 | --         | Yes      | `0`            | Min: 0                                                                 | "Affected records count cannot be negative."                                   |
| `affected_data_types`      | JSONB                   | --         | Yes      | `[]`           | Array of strings (e.g., `["email", "phone", "name"]`)                  | "Affected data types must be a valid JSON array of field names."               |
| `description`              | text                    | 4000 chars | Yes      | --             | Min length: 20, Max length: 4000                                       | "Description is required (20-4000 characters)."                                |
| `root_cause`               | text                    | 2000 chars | No       | `null`         | Max length: 2000                                                       | "Root cause must not exceed 2000 characters."                                  |
| `notification_sent_at`     | timestamp with timezone | --         | No       | `null`         | Must be after `detected_at`                                            | "Notification time must be after detection time."                              |
| `resolved_at`              | timestamp with timezone | --         | No       | `null`         | Must be after `detected_at`                                            | "Resolution time must be after detection time."                                |
| `resolution_notes`         | text                    | 4000 chars | No       | `null`         | Max length: 4000                                                       | "Resolution notes must not exceed 4000 characters."                            |
| `status`                   | enum                    | --         | Yes      | `detected`     | One of: `detected`, `investigating`, `contained`, `resolved`, `closed` | "Status must be one of: detected, investigating, contained, resolved, closed." |
| `reported_to_commissioner` | boolean                 | --         | Yes      | `false`        | Must be true or false                                                  | "Commissioner reporting status is required."                                   |

---

### 13.9 Data Model Additions

These entities support the backup, verification, access logging, and breach management capabilities defined in this section.

#### BackupRecord

```
BackupRecord
├── id (UUID, primary key, auto-generated)
├── type (enum: full, incremental, pitr — required)
│   Validation: must be one of: full, incremental, pitr
│   Error: "Backup type must be one of: full, incremental, pitr."
├── started_at (timestamp with timezone, required)
│   Validation: valid ISO 8601 timestamp
│   Error: "Valid start timestamp is required."
├── completed_at (timestamp with timezone, nullable)
│   Validation: must be after started_at if present
│   Error: "Completion time must be after start time."
├── size_bytes (bigint, required, default 0)
│   Validation: min 0
│   Error: "Backup size cannot be negative."
├── status (enum: running, completed, failed — required, default running)
│   Validation: must be one of: running, completed, failed
│   Error: "Backup status must be one of: running, completed, failed."
├── storage_location (varchar 500, required)
│   Validation: non-empty, max 500 chars
│   Error: "Storage location is required (max 500 characters)."
├── secondary_storage_location (varchar 500, nullable)
│   Validation: max 500 chars
│   Error: "Secondary storage location must not exceed 500 characters."
├── encryption_key_id (varchar 200, required)
│   Validation: non-empty, max 200 chars, must reference a valid key in KMS
│   Error: "Encryption key ID is required and must reference a valid KMS key."
├── retention_expires_at (timestamp with timezone, required)
│   Validation: must be after completed_at
│   Error: "Retention expiry must be after backup completion."
├── verification_status (enum: pending, passed, failed — default pending)
│   Validation: must be one of: pending, passed, failed
│   Error: "Verification status must be one of: pending, passed, failed."
├── verification_date (timestamp with timezone, nullable)
│   Validation: must be after completed_at if present
│   Error: "Verification date must be after backup completion."
├── error_message (text, 2000 chars, nullable)
│   Validation: max 2000 chars
│   Error: "Error message must not exceed 2000 characters."
├── created_at (timestamp with timezone, auto-set)
└── updated_at (timestamp with timezone, auto-set)
```

#### BackupVerification

```
BackupVerification
├── id (UUID, primary key, auto-generated)
├── backup_id (UUID, required, foreign key → BackupRecord)
│   Validation: must reference an existing BackupRecord
│   Error: "Backup ID must reference a valid backup record."
├── verified_at (timestamp with timezone, required)
│   Validation: valid ISO 8601 timestamp
│   Error: "Valid verification timestamp is required."
├── status (enum: passed, failed — required)
│   Validation: must be one of: passed, failed
│   Error: "Verification status must be passed or failed."
├── record_count_match (boolean, required)
│   Validation: must be true or false
│   Error: "Record count match result is required."
├── checksum_match (boolean, required)
│   Validation: must be true or false
│   Error: "Checksum match result is required."
├── boot_test_passed (boolean, required)
│   Validation: must be true or false
│   Error: "Boot test result is required."
├── smoke_test_passed (boolean, required)
│   Validation: must be true or false
│   Error: "Smoke test result is required."
├── duration_seconds (integer, required)
│   Validation: min 1, max 86400
│   Error: "Verification duration must be between 1 and 86400 seconds."
├── notes (text, 2000 chars, nullable)
│   Validation: max 2000 chars
│   Error: "Notes must not exceed 2000 characters."
├── environment_id (varchar 100, required)
│   Validation: non-empty, max 100 chars
│   Error: "Isolated environment ID is required (max 100 characters)."
├── created_at (timestamp with timezone, auto-set)
└── updated_at (timestamp with timezone, auto-set)
```

#### DataAccessLog

```
DataAccessLog
├── id (UUID, primary key, auto-generated)
├── user_id (UUID, required, foreign key → User)
│   Validation: must reference an existing User
│   Error: "User ID is required and must reference a valid user."
├── property_id (UUID, required, foreign key → Property)
│   Validation: must reference an existing Property
│   Error: "Property ID is required and must reference a valid property."
├── table_name (varchar 100, required)
│   Validation: non-empty, max 100 chars, must be a recognized entity table
│   Error: "Table name is required and must be a recognized entity table."
├── record_id (UUID, required)
│   Validation: valid UUID
│   Error: "Record ID is required."
├── field_name (varchar 100, required)
│   Validation: non-empty, max 100 chars, must be a recognized PII field
│   Error: "Field name is required and must be a recognized PII field."
├── access_type (enum: read, write, delete, export — required)
│   Validation: must be one of: read, write, delete, export
│   Error: "Access type must be one of: read, write, delete, export."
├── timestamp (timestamp with timezone, required, default now())
│   Validation: valid timestamp
│   Error: "Valid timestamp is required."
├── ip_address (varchar 45, required)
│   Validation: valid IPv4 or IPv6 address
│   Error: "A valid IP address is required."
├── user_agent (varchar 500, nullable)
│   Validation: max 500 chars
│   Error: "User agent must not exceed 500 characters."
├── session_id (varchar 200, nullable)
│   Validation: max 200 chars
│   Error: "Session ID must not exceed 200 characters."
└── created_at (timestamp with timezone, auto-set)
```

**Index requirements**:

- `DataAccessLog`: composite index on `(property_id, timestamp)` for time-range queries
- `DataAccessLog`: composite index on `(user_id, timestamp)` for per-user audit queries
- `DataAccessLog`: composite index on `(table_name, record_id)` for per-record audit queries
- `BackupRecord`: index on `(status, retention_expires_at)` for cleanup job
- `BackupRecord`: index on `(verification_status)` for verification job

#### BreachIncident

```
BreachIncident
├── id (UUID, primary key, auto-generated)
├── detected_at (timestamp with timezone, required, default now())
│   Validation: valid ISO 8601 timestamp
│   Error: "Detection timestamp is required."
├── severity (enum: low, medium, high, critical — required)
│   Validation: must be one of: low, medium, high, critical
│   Error: "Severity must be one of: low, medium, high, critical."
├── affected_properties (JSONB, required, default [])
│   Validation: array of valid property UUIDs
│   Error: "Affected properties must be a valid JSON array of property IDs."
├── affected_records_count (integer, required, default 0)
│   Validation: min 0
│   Error: "Affected records count cannot be negative."
├── affected_data_types (JSONB, required, default [])
│   Validation: array of strings
│   Error: "Affected data types must be a valid JSON array of field names."
├── description (text, 4000 chars, required)
│   Validation: min 20, max 4000 chars
│   Error: "Description is required (20-4000 characters)."
├── root_cause (text, 2000 chars, nullable)
│   Validation: max 2000 chars
│   Error: "Root cause must not exceed 2000 characters."
├── notification_sent_at (timestamp with timezone, nullable)
│   Validation: must be after detected_at
│   Error: "Notification time must be after detection time."
├── resolved_at (timestamp with timezone, nullable)
│   Validation: must be after detected_at
│   Error: "Resolution time must be after detection time."
├── resolution_notes (text, 4000 chars, nullable)
│   Validation: max 4000 chars
│   Error: "Resolution notes must not exceed 4000 characters."
├── status (enum: detected, investigating, contained, resolved, closed — required, default detected)
│   Validation: must be one of: detected, investigating, contained, resolved, closed
│   Error: "Status must be one of: detected, investigating, contained, resolved, closed."
├── reported_to_commissioner (boolean, required, default false)
│   Validation: must be true or false
│   Error: "Commissioner reporting status is required."
├── created_by (UUID, required, foreign key → User)
│   Validation: must reference an existing User
│   Error: "Created by must reference a valid user."
├── created_at (timestamp with timezone, auto-set)
└── updated_at (timestamp with timezone, auto-set)
```

#### FailoverEvent

```
FailoverEvent
├── id (UUID, primary key, auto-generated)
├── trigger_type (enum: automated, manual — required)
│   Validation: must be one of: automated, manual
│   Error: "Trigger type must be automated or manual."
├── triggered_by (UUID, nullable, foreign key → User)
│   Validation: required if trigger_type is manual; valid user UUID
│   Error: "User ID is required for manual failover."
├── source_region (varchar 50, required)
│   Validation: non-empty, max 50 chars
│   Error: "Source region is required (max 50 characters)."
├── target_region (varchar 50, required)
│   Validation: non-empty, max 50 chars
│   Error: "Target region is required (max 50 characters)."
├── started_at (timestamp with timezone, required)
│   Validation: valid ISO 8601 timestamp
│   Error: "Valid start timestamp is required."
├── completed_at (timestamp with timezone, nullable)
│   Validation: must be after started_at
│   Error: "Completion time must be after start time."
├── duration_seconds (integer, nullable)
│   Validation: min 0, max 86400
│   Error: "Failover duration must be between 0 and 86400 seconds."
├── status (enum: in_progress, completed, failed, rolled_back — required, default in_progress)
│   Validation: must be one of: in_progress, completed, failed, rolled_back
│   Error: "Status must be one of: in_progress, completed, failed, rolled_back."
├── reason (text, 500 chars, nullable)
│   Validation: max 500 chars
│   Error: "Failover reason must not exceed 500 characters."
├── data_loss_seconds (integer, nullable)
│   Validation: min 0
│   Error: "Data loss estimate cannot be negative."
├── created_at (timestamp with timezone, auto-set)
└── updated_at (timestamp with timezone, auto-set)
```

### 13.10 Capacity Management (SOC 2 A1.1, ISO 27017 CLD.12.1.3)

**Purpose**: SOC 2 Trust Services Criteria A1.1 requires that the entity maintains, monitors, and evaluates current processing capacity and usage to meet business objectives. ISO 27017 CLD.12.1.3 requires capacity management for cloud services.

#### 13.10.1 Auto-Scaling Thresholds

| Resource                   | Scale-Up Trigger                                              | Scale-Down Trigger                       | Maximum Scale           | Cooldown Period |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------- | ----------------------- | --------------- |
| **API servers**            | CPU > 70% for 3 minutes, or request queue > 100               | CPU < 30% for 10 minutes                 | 20 instances            | 5 minutes       |
| **Background workers**     | Queue depth > 500 jobs, or oldest job > 5 minutes             | Queue depth < 50 for 10 minutes          | 10 instances            | 5 minutes       |
| **Database read replicas** | Connection count > 80% of max, or replication lag > 5 seconds | Connection count < 30% for 15 minutes    | 5 replicas              | 10 minutes      |
| **Search index**           | Query latency P99 > 500ms                                     | Query latency P99 < 100ms for 30 minutes | 3 nodes                 | 15 minutes      |
| **File storage (CDN)**     | Automatic (cloud-managed)                                     | Automatic                                | Unlimited (usage-based) | N/A             |

#### 13.10.2 Capacity Alerts

| Alert                                   | Threshold                                      | Recipients                    | Channels             |
| --------------------------------------- | ---------------------------------------------- | ----------------------------- | -------------------- |
| **Database storage approaching limit**  | > 80% of provisioned storage                   | Super Admin, Security Officer | Email + SMS          |
| **File storage cost anomaly**           | > 150% of 30-day average daily cost            | Super Admin                   | Email                |
| **API server sustained high load**      | CPU > 85% for 15 minutes despite auto-scaling  | Super Admin, Security Officer | Email + SMS + in-app |
| **Database connection pool exhaustion** | > 90% of max connections for 5 minutes         | Super Admin                   | Email + SMS          |
| **Background job backlog**              | Queue depth > 2,000 or oldest job > 30 minutes | Super Admin                   | Email + in-app       |
| **Search index degradation**            | Query latency P99 > 2 seconds                  | Super Admin                   | Email                |
| **Backup storage growth**               | Monthly growth > 50% of previous month         | Super Admin                   | Email                |

#### 13.10.3 Capacity Planning

| Activity                        | Frequency                 | Owner                 | Output                                                                          |
| ------------------------------- | ------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| **Resource utilization review** | Monthly                   | DevOps team           | Capacity report with utilization trends and projections                         |
| **Growth projection**           | Quarterly                 | DevOps team + Product | Estimated resource needs for next quarter based on property onboarding pipeline |
| **Cost optimization review**    | Quarterly                 | Super Admin + DevOps  | Identify over-provisioned resources and right-sizing opportunities              |
| **Load testing**                | Before each major release | QA team               | Verify system handles 2x current peak load without degradation                  |

#### 13.10.4 Capacity Dashboard

Displayed on Super Admin > System Health (PRD 16, Section 3.11):

| Widget                   | Content                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Resource Utilization** | Bar charts showing CPU, memory, storage, connections as percentage of capacity for each component |
| **Cost Trend**           | Line chart of daily infrastructure cost over last 90 days                                         |
| **Scaling Events**       | Timeline of auto-scale events (up and down) in last 30 days                                       |
| **Projected Capacity**   | AI-generated forecast of when current capacity limits will be reached based on growth trends      |

### 13.11 KMS Audit Log Forwarding (All Encryption Frameworks)

**Purpose**: Every key access (encrypt/decrypt operation) must be logged and forwarded to the compliance dashboard for monitoring. This satisfies SOC 2 CC6.1 (logical access), ISO 27001 A.10.1 (cryptographic controls), and ISO 27017 CLD.10.1.1 (key management for cloud services).

#### 13.11.1 KMS Events to Capture

| Event Type            | Description                                               | Logged Fields                                                                     |
| --------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `kms.encrypt`         | A field was encrypted using a property DEK                | timestamp, property_id, user_id, field_name, key_id                               |
| `kms.decrypt`         | A field was decrypted for display                         | timestamp, property_id, user_id, field_name, key_id, access_reason                |
| `kms.key_create`      | A new DEK was generated for a property                    | timestamp, property_id, key_id, created_by                                        |
| `kms.key_rotate`      | A DEK was rotated (new key activated)                     | timestamp, property_id, old_key_id, new_key_id, initiated_by                      |
| `kms.key_retire`      | An old DEK was retired after re-encryption completed      | timestamp, property_id, key_id, retired_by                                        |
| `kms.key_destroy`     | A key was permanently destroyed (property termination)    | timestamp, property_id, key_id, destroyed_by, authorization_reference             |
| `kms.reencrypt_batch` | Background re-encryption job processed a batch of records | timestamp, property_id, old_key_id, new_key_id, records_processed, records_failed |

#### 13.11.2 Log Forwarding Pipeline

```
KMS Event → Application Event Bus → Two Destinations:
  1. Compliance Dashboard (PRD 28, Section 4.7 Infrastructure Changes panel)
  2. Long-term audit storage (encrypted, append-only, tamper-evident)
```

#### 13.11.3 Retention

| Log Type                   | Retention Period                      | Storage Tier                                                 | Justification                                                          |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| KMS encrypt/decrypt events | 1 year (hot), 10 years (cold archive) | Hot: database table. Cold: compressed, encrypted S3 archive. | SOC 2 audit trail requirements. ISO 27001 A.10.1 control evidence.     |
| KMS key lifecycle events   | 10 years (all hot)                    | Database table with tamper-evident checksums                 | Key lifecycle must be fully traceable for entire data retention period |

#### 13.11.4 Anomaly Detection on KMS Events

The compliance monitoring system (PRD 28, Section 5.1) includes a real-time check for unusual KMS access patterns:

| Anomaly                    | Detection Logic                                                               | Alert Level                                         |
| -------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| **Bulk decryption**        | > 100 decrypt operations by a single user in 10 minutes                       | Critical — potential data exfiltration              |
| **After-hours key access** | Any key lifecycle event (create/rotate/retire/destroy) outside business hours | High                                                |
| **Cross-property decrypt** | User decrypts data from a property they do not have an active role in         | Critical — RLS bypass attempt                       |
| **Failed decrypt spike**   | > 10 failed decrypt attempts in 5 minutes                                     | High — potential key compromise or permission issue |

---

## 14. Quality Assurance, Testing & Code Quality Standards

This section defines the quality requirements that every piece of code, every feature, and every deployment in Concierge must meet. These requirements are non-negotiable. No code merges to the main branch, and no release reaches production, unless every standard in this section is satisfied.

Concierge handles sensitive personal information (PII) for thousands of residents across multiple properties. A single quality failure — a missed edge case, an untested role boundary, an accessibility gap — can cause data leaks, legal liability, or loss of property management contracts. These standards exist to prevent that.

Every requirement in this section is **specific and measurable**. "Good enough" is not a metric. Every threshold has a number. Every process has an owner. Every failure has a consequence.

---

### 14.1 Unit & Component Testing

#### 14.1.1 Coverage Requirements

| Module Type                                    | Minimum Line Coverage | Minimum Branch Coverage | Rationale                                                             |
| ---------------------------------------------- | --------------------- | ----------------------- | --------------------------------------------------------------------- |
| API route handlers                             | 95%                   | 95%                     | Every endpoint is a potential attack surface                          |
| Business logic (services, helpers, validators) | 98%                   | 95%                     | Core logic errors cascade to every consumer                           |
| UI components (React/equivalent)               | 90%                   | 85%                     | Visual regressions caught by snapshot + interaction tests             |
| Utility functions                              | 100%                  | 100%                    | Pure functions have no excuse for missing coverage                    |
| Middleware (auth, RLS, rate limiting)          | 98%                   | 98%                     | Security-critical path — zero gaps allowed                            |
| Database models and queries                    | 95%                   | 90%                     | Data integrity depends on correct query behavior                      |
| WebSocket event handlers                       | 95%                   | 90%                     | Real-time updates must never send wrong data to wrong user            |
| AI service integrations                        | 90%                   | 85%                     | AI outputs are non-deterministic — test the wrapping logic rigorously |

**Overall project minimum**: 95% line coverage AND 92% branch coverage. No module may fall below its threshold listed above.

#### 14.1.2 What Counts Toward Coverage

**Counted**:

- Application source code (all TypeScript/JavaScript files in `src/`)
- Database migration scripts (tested via rollback tests)
- Configuration validation logic
- Custom middleware

**Not counted** (excluded from coverage calculation):

- Auto-generated code (OpenAPI client stubs, GraphQL type definitions, Prisma client)
- Type definition files (`.d.ts`)
- Test files themselves
- Build configuration files (webpack, vite, esbuild configs)
- Seed scripts (covered by integration tests instead)
- Third-party library wrappers that are thin pass-throughs (must be explicitly marked with `/* istanbul ignore file — thin wrapper */` and reviewed in PR)

#### 14.1.3 Coverage Enforcement in CI/CD

- Every pull request runs the full unit test suite.
- The CI pipeline **fails the build** if coverage drops below the thresholds defined in 14.1.1.
- Coverage reports are generated in both HTML (for developer review) and JSON (for dashboard ingestion) formats.
- Coverage results are posted as a comment on every pull request, showing:
  - Overall project coverage (line and branch)
  - Per-file coverage for changed files
  - Coverage delta compared to the target branch
  - Any files that dropped below their module threshold
- A coverage dashboard (accessible to all developers and Super Admins) displays:
  - Current coverage by module
  - Coverage trend over the past 90 days
  - Files with the lowest coverage (bottom 10)
  - Modules approaching their threshold (within 2%)

#### 14.1.4 Per-PR Coverage Delta Requirements

- New code introduced in a pull request must have **98% line coverage and 95% branch coverage** or higher.
- If a PR reduces overall project coverage by more than **0.5%**, the build fails.
- If a PR reduces any module's coverage by more than **1.0%**, the build fails.
- Exceptions require written justification in the PR description AND approval from the Tech Lead.

#### 14.1.5 Mutation Testing

- Mutation testing runs nightly on the main branch using a mutation testing framework (e.g., Stryker for TypeScript).
- **Minimum mutation score**: 80% across the project.
- **Business logic modules**: minimum 85% mutation score.
- **Security-critical modules** (authentication, authorization, RLS, encryption): minimum 90% mutation score.
- Mutation testing results are tracked on the quality dashboard with weekly trend reports.
- Any module whose mutation score drops below its threshold generates an alert to the Tech Lead.
- Mutation testing is NOT required to pass on every PR (due to runtime cost), but the nightly run is a blocking gate for the next release candidate.

#### 14.1.6 Test Naming Conventions

All test names must follow this pattern:

```
[unit under test] — [scenario] — [expected outcome]
```

Examples:

- `createEvent — when event type is disabled — throws EventTypeDisabledError`
- `PackageCard — when status is "picked up" — renders green checkmark icon`
- `validateEmail — when input contains unicode characters — returns validation error`
- `applyRLS — when user belongs to Property A — excludes all Property B records`

Rules:

- Test names must describe behavior, not implementation.
- Test names must be readable as a sentence by a non-developer.
- Do not use "should" — use declarative present tense ("renders", "throws", "returns").
- Group related tests using `describe` blocks named after the unit under test.
- Nest `describe` blocks for sub-scenarios (e.g., `describe("when user is Security Guard")`).

#### 14.1.7 Mocking and Stubbing Rules

**When to mock**:

- External API calls (email provider, SMS provider, push notification service, AI providers)
- System clock (use a deterministic clock for all time-dependent tests)
- File system operations
- Environment variables
- Third-party SDKs (payment processors, analytics)

**When NOT to mock**:

- Database queries — use a test database with real schema (see 14.2 for integration test database strategy)
- Internal service calls between modules — test the real integration
- Validation logic — test the actual validators, not mocked versions
- Authorization checks — never mock the RLS or role-checking layer

**Mocking rules**:

- Every mock must be explicitly set up in the test — no global mocks that apply across test files.
- Mocks must verify they were called with expected arguments (not just that they were called).
- Mocks must be reset between tests (`beforeEach` / `afterEach`) to prevent test pollution.
- If a test file has more than 10 mocks, it is a code smell — refactor the code under test to reduce dependencies.

#### 14.1.8 Snapshot Testing Rules

- Snapshot tests are required for every UI component that renders visible output.
- Snapshots must be reviewed in every PR — changes to snapshots require explicit approval from a reviewer.
- Snapshots must NOT include dynamic data (timestamps, random IDs, user-specific content). Use deterministic test data.
- Snapshot files must be committed alongside the component code, never in a separate directory.
- If a snapshot is larger than 200 lines, the component is too complex — break it into smaller components and snapshot each one.
- Snapshot tests are a supplement, not a replacement, for behavioral tests. Every component with a snapshot must also have at least one behavioral test (click handler, conditional rendering, etc.).

#### 14.1.9 Test Data Management

**Factories**:

- Every database model must have a corresponding test factory that generates valid instances with sensible defaults.
- Factories must support override of any field (e.g., `createEvent({ status: "closed" })`).
- Factories must generate unique values for unique fields (sequential IDs, unique email addresses).
- Factories must respect foreign key relationships (creating an Event automatically creates the associated Property and EventType if not provided).

**Fixtures**:

- Static test fixtures (JSON files representing API responses, file uploads, etc.) are stored in a `__fixtures__/` directory next to the test file.
- Fixtures must be realistic — use production-like data structures, not simplified versions.
- Fixtures must not contain real PII — use generated fake data.

**Seeds**:

- Seed data for local development and staging environments is maintained in version-controlled seed scripts.
- Seed scripts generate a minimum of: 3 properties, 5 roles, 50 units, 200 residents, 1,000 events, 50 maintenance requests, 20 amenity bookings.
- Seed data must cover edge cases: units with no residents, residents with no email, events with maximum-length text fields, events with Unicode/emoji content.

#### 14.1.10 Edge Case Requirements

Every unit test suite must include explicit tests for the following edge cases where applicable:

| Edge Case Category                   | Specific Tests Required                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Null and undefined**               | null input, undefined input, null nested fields, optional fields omitted                                                                                          |
| **Empty values**                     | Empty string `""`, empty array `[]`, empty object `{}`, whitespace-only string `"   "`                                                                            |
| **Boundary values**                  | Field at minimum length, field at maximum length, field one character over maximum, integer at min/max for its type                                               |
| **Timezone handling**                | UTC midnight, timezone boundary crossings (11:59 PM → 12:00 AM in user's timezone vs UTC), daylight saving time transitions, dates in UTC-12 and UTC+14           |
| **Unicode and internationalization** | Emoji in text fields (👋🏽), CJK characters, right-to-left text (Arabic, Hebrew), combining diacritical marks, zero-width characters                                |
| **Numeric edge cases**               | Zero, negative numbers (where applicable), very large numbers, floating-point precision (0.1 + 0.2), NaN, Infinity                                                |
| **Date edge cases**                  | Leap year dates (Feb 29), end of month (Jan 31 → Feb), year boundaries (Dec 31 → Jan 1), dates far in the past (1900-01-01), dates far in the future (2099-12-31) |
| **Concurrent access**                | Two users updating the same record simultaneously, optimistic locking conflicts                                                                                   |
| **Maximum field lengths**            | Event description at 4,000 characters, unit number at maximum length, resident name at maximum length                                                             |

#### 14.1.11 Accessibility Component Testing

- Every interactive component (button, link, input, select, checkbox, radio, dialog, menu, tab, accordion, tooltip) must have unit tests verifying:
  - It is reachable via `Tab` key navigation
  - It responds to `Enter` and/or `Space` key activation (as appropriate for the element type)
  - It has an accessible name (via visible label, `aria-label`, or `aria-labelledby`)
  - It announces its role to assistive technology (correct ARIA role)
  - If it has a disabled state, `aria-disabled="true"` is set
  - If it has an expanded/collapsed state, `aria-expanded` toggles correctly
  - If it is a form input, it is linked to its error message via `aria-describedby`
- Use a testing library that supports accessibility queries (e.g., Testing Library's `getByRole`, `getByLabelText`).
- Every new component must pass `axe-core` automated checks within its test suite (zero violations).

---

### 14.2 Integration Testing

#### 14.2.1 API Endpoint Testing

Every API endpoint must have integration tests covering:

| Test Category             | Requirement                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Happy path**            | Valid request with valid authentication returns expected response body and status code                                                             |
| **Authentication**        | Request without token returns `401`. Request with expired token returns `401`. Request with invalid token returns `401`.                           |
| **Authorization**         | Request with valid token but insufficient role returns `403`. Test every role that should be denied.                                               |
| **Validation**            | Request with missing required fields returns `422` with field-specific error messages. Request with invalid field types returns `422`.             |
| **Not found**             | Request for non-existent resource returns `404`. Request for resource in different property returns `404` (not `403` — prevent enumeration).       |
| **Conflict**              | Request that violates a uniqueness constraint returns `409` with clear error message.                                                              |
| **Rate limiting**         | Exceeding rate limit returns `429` with `Retry-After` header.                                                                                      |
| **Method not allowed**    | Using an unsupported HTTP method returns `405`.                                                                                                    |
| **Pagination**            | Page 1 returns correct count. Last page returns partial results. Page beyond range returns empty array (not error).                                |
| **Filtering and sorting** | Each supported filter parameter returns correct subset. Sort order is correct ascending and descending.                                            |
| **Response format**       | Response includes all required fields. Response excludes fields not visible to the requesting role. Dates are ISO 8601. IDs are consistent format. |

**Minimum integration test count per module**: 50 tests per API module (e.g., Events, Units, Residents, Maintenance). Modules with fewer than 10 endpoints may have fewer tests, but must still cover every category above for every endpoint.

#### 14.2.2 Database Integration Tests

- **Migration tests**: Every migration runs forward successfully. Every migration rolls back successfully. Running all migrations from zero results in identical schema to running the latest snapshot.
- **Data integrity tests**: Foreign key constraints are enforced. Unique constraints are enforced. Check constraints (e.g., status must be one of a defined set) are enforced. Cascade deletes work correctly. Soft deletes do not break foreign key relationships.
- **RLS (Row-Level Security) enforcement tests**: A query executed in the context of Property A returns zero rows from Property B. This must be tested for every table that contains property-scoped data. At minimum, test: events, units, residents, maintenance_requests, amenity_bookings, announcements, packages, documents, audit_logs.
- **Index performance tests**: Queries used in list/search endpoints execute within 50ms on a dataset of 100,000 rows (measured via `EXPLAIN ANALYZE`).
- **Transaction tests**: Operations that span multiple tables either all succeed or all rollback. No partial state is ever persisted.

#### 14.2.3 Third-Party Service Integration Tests

| Service                       | Test Requirements                                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Email provider**            | Send test email, verify delivery via provider API or test mailbox. Test HTML and plain-text variants. Test attachment handling. Test bounce handling. Test rate limit behavior.                                                                  |
| **SMS provider**              | Send test SMS, verify delivery status callback. Test opt-out handling. Test international number formatting. Test message length limits (160 chars / concatenation).                                                                             |
| **Push notification service** | Send test push, verify receipt on test device or emulator. Test payload formatting. Test badge count updates. Test silent push for background sync.                                                                                              |
| **AI providers**              | Test prompt submission and response parsing. Test timeout handling (AI provider takes >30 seconds). Test fallback when primary provider is unavailable. Test response validation (AI returns unexpected format). Test cost tracking per request. |
| **File storage**              | Upload file, verify retrieval. Test signed URL generation and expiry. Test file deletion. Test storage quota enforcement.                                                                                                                        |
| **Virus scanning**            | Submit clean file — passes. Submit EICAR test file — rejected with correct error message. Test timeout when scanner is slow.                                                                                                                     |

- Third-party integration tests run against **sandbox/test environments** of each provider, never against production APIs.
- If a provider does not offer a sandbox, use a contract test with recorded responses (Pact or equivalent).

#### 14.2.4 Multi-Tenant Isolation Testing

This is the most critical category of integration tests. A multi-tenant isolation failure is a **P1 security incident**.

**Mandatory tests** (run on every PR):

1. Create Event in Property A. Query Events as Property B user. Result: zero events returned.
2. Create Resident in Property A. Search for resident by name as Property B user. Result: not found.
3. Create Maintenance Request in Property A. Attempt to update it as Property B Property Manager. Result: `404` (not `403`).
4. Upload Document to Property A. Attempt to download via signed URL as Property B user. Result: `404` or `403`.
5. Create Announcement in Property A. Verify it does not appear in Property B's announcement feed.
6. Generate Report for Property A. Verify it contains zero data from Property B.
7. List Units as Property A admin. Verify zero Property B units in the response.
8. Access Audit Log as Property A admin. Verify zero Property B audit entries.
9. Perform Global Search as Property A user. Verify zero Property B results across all indexed entities.
10. WebSocket subscription for Property A events. Publish event in Property B. Verify Property A client does NOT receive it.

**Stress tests** (run nightly):

- Create 100 properties with 1,000 events each. Run isolation queries for every property pair. Zero cross-contamination allowed.
- Simulate concurrent requests from 50 different properties hitting the same API endpoint. Verify every response contains only the requesting property's data.

#### 14.2.5 Role-Based Access Testing

Maintain a **role × endpoint access matrix** as a test configuration file. This matrix defines, for every API endpoint, which roles should receive `200`/`201`/`204` and which roles should receive `403`.

**Matrix dimensions**:

- Roles: Super Admin, Property Admin, Property Manager, Front Desk / Concierge, Security Guard, Maintenance Staff, Board Member, Resident, Unauthenticated
- Endpoints: Every API endpoint in the system (minimum 150+ endpoints at full build)

**Requirements**:

- The matrix must be machine-readable (YAML or JSON) and used as the source of truth for auto-generated role tests.
- Every cell in the matrix has an explicit test: either "allowed" (test returns expected success status) or "denied" (test returns `403`).
- The matrix must be updated with every PR that adds or modifies an endpoint.
- A CI check verifies that every endpoint in the OpenAPI spec has a corresponding entry in the matrix. Missing entries fail the build.
- Quarterly manual audit compares the matrix to the product requirements to catch role creep.

#### 14.2.6 Webhook and Event System Testing

- Every internal event (e.g., `event.created`, `package.picked_up`, `maintenance.assigned`) must be tested for:
  - Correct payload structure (all required fields present, correct types)
  - Delivery to all registered subscribers
  - Idempotency (delivering the same event twice does not cause duplicate side effects)
  - Ordering guarantees (events for the same entity are processed in order)
  - Dead letter queue behavior (failed deliveries are retried 3 times, then moved to dead letter queue with alert)
- External webhook tests:
  - Test webhook delivery to a mock endpoint
  - Test webhook retry logic (3 retries with exponential backoff: 1s, 5s, 30s)
  - Test webhook signature verification (HMAC-SHA256)
  - Test webhook payload does not include PII beyond what the subscriber is authorized to access

#### 14.2.7 File Upload and Download Testing

| Test Case                                                                               | Expected Behavior                                                       |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Upload JPEG under 4MB                                                                   | Succeeds, file stored, thumbnail generated                              |
| Upload PNG under 4MB                                                                    | Succeeds, file stored, thumbnail generated                              |
| Upload PDF under 10MB                                                                   | Succeeds, file stored, preview generated                                |
| Upload file at exact size limit                                                         | Succeeds                                                                |
| Upload file 1 byte over size limit                                                      | Rejected with `413` and clear error message                             |
| Upload with wrong MIME type (e.g., `.exe` renamed to `.jpg`)                            | Rejected with `422` — MIME type validated by file header, not extension |
| Upload with no file extension                                                           | Rejected with `422`                                                     |
| Upload zero-byte file                                                                   | Rejected with `422`                                                     |
| Upload file with filename containing special characters (`../`, `<script>`, null bytes) | Filename sanitized, file stored safely                                  |
| Download file with valid signed URL                                                     | Succeeds, correct content-type header, content-disposition header       |
| Download file with expired signed URL                                                   | Returns `403`                                                           |
| Download file belonging to different property                                           | Returns `404`                                                           |
| Concurrent upload of 10 files to the same entity                                        | All succeed, all files associated correctly                             |

#### 14.2.8 Search Integration Testing

- Full-text search returns results within **200ms** for a dataset of 500,000 indexed documents.
- Search respects RLS — Property A user searching "fire" finds only Property A incidents, never Property B.
- Search respects role permissions — a Resident searching "maintenance" finds only their own requests, not all property requests.
- Search handles: partial matches, typos (fuzzy matching), quoted exact phrases, special characters, Unicode content.
- Search index stays in sync with the database — create a record, wait max 2 seconds, search finds it.
- Search index correctly removes deleted/soft-deleted records within 2 seconds.
- Search results include the correct highlight/snippet showing where the match occurred.
- Empty search returns helpful suggestion, not an error.

#### 14.2.9 Cache Invalidation Testing

- When a record is updated in the database, the corresponding cache entry is invalidated within **1 second**.
- After cache invalidation, the next read returns the updated data (not stale data).
- Cache keys include the property ID — Property A's cache never serves data to Property B.
- Cache keys include the user's role — a cached response for a Property Manager does not get served to a Resident.
- Test cache stampede protection: when 100 concurrent requests arrive for an expired cache key, only 1 database query is executed (the rest wait for the cache to be repopulated).
- Test cache failure gracefully: when the cache service is unavailable, the application falls back to direct database queries with no user-visible error (degraded performance only).

#### 14.2.10 Rate Limiting Testing

| Scenario                               | Expected Behavior                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Normal usage (under limit)             | All requests succeed with `200`                                                                     |
| Exactly at rate limit                  | Last request within window succeeds                                                                 |
| One request over rate limit            | Returns `429` with `Retry-After` header                                                             |
| Burst of 100 requests in 1 second      | Only the allowed number succeed; rest get `429`                                                     |
| Different users hitting same endpoint  | Each user has independent rate limit counters                                                       |
| Rate limit resets after window expires | Requests succeed again without manual intervention                                                  |
| Login endpoint rate limiting           | After 5 failed attempts in 15 minutes, account is temporarily locked with `429` and lockout message |
| API key rate limiting                  | Per-API-key limits enforced independently from per-user limits                                      |

#### 14.2.11 Notification Delivery Testing

Test notification delivery across all 4 channels for every notification event:

| Channel                 | Test Requirements                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Email**               | Correct recipient. Correct subject line. Correct body content (HTML and plain text). Correct sender address. Unsubscribe link works. Attachment included when applicable. Template renders correctly with all variable combinations. |
| **SMS**                 | Correct phone number. Message within 160 chars (or correctly concatenated). Opt-out reply ("STOP") processed. Delivery status callback received and logged.                                                                          |
| **Push notification**   | Correct device token. Correct title and body. Deep link opens correct screen. Badge count updated. Notification grouped correctly (by property, by type).                                                                            |
| **In-app notification** | Notification appears in notification center within 2 seconds. Read/unread status toggles correctly. Clicking notification navigates to correct entity. Notification count in header badge updates in real time.                      |

- Test notification preferences: if a resident has disabled email notifications for package events, they must NOT receive an email when a package arrives (but should still receive push if push is enabled).
- Test notification throttling: if 50 events fire in 1 minute for the same resident, notifications are batched into a digest, not sent individually.
- Test notification failure: if email delivery fails, the system retries 3 times, then logs the failure and alerts the admin.

#### 14.2.12 Real-Time Collaboration Testing (WebSocket)

- When Staff A creates an event, Staff B (same property, same shift) sees it within **1 second** without refreshing.
- When Staff A updates an event, Staff B's view updates live.
- When Staff A is editing a record, Staff B sees a "currently being edited by [Staff A]" indicator.
- WebSocket connections reconnect automatically after network interruption (test by dropping connection for 5 seconds, then restoring).
- WebSocket messages include property ID and are filtered server-side — a client subscribed to Property A never receives Property B messages.
- Test 100 concurrent WebSocket connections to the same property — all receive broadcast messages within 2 seconds.
- WebSocket authentication: expired tokens cause disconnection with a clear re-authentication prompt.

#### 14.2.13 Cross-Module Workflow Testing

Test complete end-to-end workflows that span multiple modules:

| Workflow                          | Steps to Test                                                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package arrival to pickup**     | Front desk creates package event → notification sent to resident (all channels per preferences) → resident sees package in portal → resident confirms pickup → front desk marks as picked up → event closed → audit log entry created              |
| **Maintenance request lifecycle** | Resident submits request with photos → Property Manager receives notification → PM assigns to vendor → vendor receives notification → vendor updates status → resident receives update notification → PM closes request → satisfaction survey sent |
| **Amenity booking with approval** | Resident books amenity → approval-required flag triggers admin review → admin approves → resident notified → calendar updated → reminder sent 24hrs before → resident checks in → booking marked as used                                           |
| **Security incident escalation**  | Security guard logs incident → classified as high severity → automatic escalation to Property Manager → PM notified via SMS and push → PM acknowledges → follow-up task created → incident closed with resolution notes                            |
| **Resident onboarding**           | Admin creates resident → welcome email sent → resident activates account → resident completes profile → FOB assigned → unit instructions visible → resident can book amenities and submit maintenance requests                                     |

Each workflow must be tested as a single integration test that runs all steps sequentially, verifying state changes and notifications at each step.

#### 14.2.14 Test Environment Requirements

- **Staging environment** must be identical to production in: infrastructure configuration, database engine and version, cache engine and version, search engine and version, environment variable structure (with test values), SSL/TLS configuration, and CORS policies.
- Staging database is seeded with production-representative data volumes: at least 10 properties, 500 units, 2,000 residents, 50,000 events, 5,000 maintenance requests.
- Staging is rebuilt from scratch every 2 weeks (automated teardown and re-provision) to prevent environment drift.
- Developers cannot access production databases. All debugging is done against staging.

#### 14.2.15 Data Seeding Strategy

- Seed scripts are version-controlled and run in CI for integration tests.
- Seed data includes at least 3 properties with distinct configurations (different event types, different custom fields, different amenity rules) to catch property-specific logic errors.
- Seed data includes at least one instance of every edge case: resident with no email, unit with no residents, event with maximum-length text, event with emoji content, resident with accessibility preferences, booking with a conflict, expired vendor insurance.
- Seed data is deterministic — running the same seed script twice produces identical data (use fixed seeds for random generators).

---

### 14.3 Accessibility Testing

#### 14.3.1 Compliance Standard

Concierge must meet **WCAG 2.2 Level AA** compliance. This is a mandatory requirement, not a stretch goal. Failure to meet Level AA is treated as a **P2 bug** and blocks release.

Specific WCAG 2.2 success criteria that are especially important for Concierge:

| Success Criterion      | ID    | Why It Matters for Concierge                                                                                 |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| Non-text Content       | 1.1.1 | Package photos, floor plans, uploaded documents must have alt text                                           |
| Info and Relationships | 1.3.1 | Data tables (event logs, resident lists) must use proper `<th>` and `<td>` markup                            |
| Meaningful Sequence    | 1.3.2 | Dashboard widgets must have a logical reading order regardless of visual layout                              |
| Use of Color           | 1.4.1 | Status indicators (open/closed, compliant/expired) must not rely on color alone — add text labels or icons   |
| Contrast (Minimum)     | 1.4.3 | Normal text: 4.5:1 contrast ratio minimum. Large text (18px+ or 14px+ bold): 3:1 minimum                     |
| Resize Text            | 1.4.4 | All content readable at 200% zoom without horizontal scrolling                                               |
| Keyboard               | 2.1.1 | Every function available via keyboard. No keyboard traps.                                                    |
| Focus Visible          | 2.4.7 | Custom focus indicator: 2px solid ring, offset by 2px, using the brand accent color                          |
| Target Size (Minimum)  | 2.5.8 | All interactive targets are at least 24x24 CSS pixels (Concierge standard: 44x44px on touch devices)         |
| Error Identification   | 3.3.1 | All form errors identified in text (not just red borders)                                                    |
| Labels or Instructions | 3.3.2 | Every form input has a visible label — no placeholder-only inputs                                            |
| Status Messages        | 4.1.3 | Toast notifications and live updates announced to screen readers via `role="status"` or `aria-live="polite"` |

#### 14.3.2 Automated Accessibility Testing

- **axe-core** (or equivalent automated scanner) runs on every pull request as part of the CI pipeline.
- Zero violations at "critical" or "serious" severity. Build fails on any critical or serious violation.
- "Moderate" violations must be resolved within 1 sprint of detection.
- "Minor" violations tracked in backlog with a 2-sprint SLA.
- Automated scans run against every page/route in the application (minimum 50 routes at full build).
- Automated scans run with at least 3 viewport sizes: 1920x1080 (desktop monitor), 1280x800 (laptop), 375x812 (mobile).

#### 14.3.3 Manual Accessibility Audit

- **Quarterly** manual audit by a trained accessibility specialist (internal team member with IAAP certification or external consultancy).
- Audit covers the top 20 user flows (package logging, maintenance requests, amenity booking, event creation, resident onboarding, search, navigation, form submission, notification review, report generation, settings modification, unit file review, announcement creation, shift log, login, password reset, profile editing, role switching, document upload, dashboard interaction).
- Audit results documented as accessibility tickets with severity, affected user population estimate, and remediation steps.
- All "critical" audit findings remediated within 2 sprints. All "major" findings within 4 sprints.

#### 14.3.4 Screen Reader Testing

- Test with **3 screen readers** on critical flows (login, dashboard, event creation, search, navigation):
  - NVDA on Windows with Chrome
  - VoiceOver on macOS with Safari
  - VoiceOver on iOS with Safari (mobile)
- Screen reader testing performed at minimum **twice per release cycle** (before staging deployment and before production deployment).
- Documented pass/fail results for each flow with each screen reader, stored in the test management system.

#### 14.3.5 Keyboard Navigation Testing

- Every interactive element is reachable via the `Tab` key (or `Shift+Tab` for reverse).
- Every interactive element is activatable via `Enter` key, `Space` key, or both (as appropriate).
- Focus order follows the visual order of the page (left-to-right, top-to-bottom for LTR layouts).
- Modal dialogs trap focus — `Tab` from the last element returns to the first element within the modal, not the page behind it.
- Closing a modal restores focus to the element that triggered it.
- Dropdown menus support `Arrow Up` / `Arrow Down` navigation, `Escape` to close, and `Enter` to select.
- Data tables support `Arrow` key navigation between cells when in focus mode.
- Skip navigation link is the first focusable element on every page, linking to `#main-content`.
- Custom keyboard shortcuts (if any) are documented, do not conflict with screen reader shortcuts, and can be disabled in user preferences.

#### 14.3.6 Focus Management Rules

| Scenario                   | Focus Behavior                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Modal opens                | Focus moves to the first interactive element inside the modal (or the modal heading if no interactive element) |
| Modal closes               | Focus returns to the trigger element                                                                           |
| Toast notification appears | Focus stays where it is — toast is announced via `aria-live`                                                   |
| Inline form error          | Focus moves to the first field with an error                                                                   |
| Page navigation (SPA)      | Focus moves to the page heading (`<h1>`) or skip-nav target                                                    |
| Accordion section expands  | Focus stays on the trigger button                                                                              |
| Dropdown menu opens        | Focus moves to the first menu item                                                                             |
| Search results update      | Focus stays in the search input — results announced via `aria-live`                                            |
| Record deleted from table  | Focus moves to the next row (or previous if last row was deleted)                                              |
| Tab panel switches         | Focus moves to the tab panel content area                                                                      |

#### 14.3.7 Color and Contrast Requirements

- All text meets AA contrast ratios: 4.5:1 for normal text, 3:1 for large text (18px+ regular weight or 14px+ bold).
- Non-text UI elements (icons, borders, form field outlines) must have at least 3:1 contrast against their background.
- Status indicators must not rely on color alone. Every color-coded status must also have: a text label, or a distinct icon shape, or a pattern/texture.
- Charts and graphs must use patterns or textures in addition to colors. Data series must be distinguishable without color.
- Focus indicators must have at least 3:1 contrast against the background.
- The application must be fully usable in Windows High Contrast Mode.

#### 14.3.8 Motion and Animation

- All animations respect the `prefers-reduced-motion` media query.
- When `prefers-reduced-motion: reduce` is active: all decorative animations are disabled, transitions complete instantly (or within 100ms), auto-playing carousels or slideshows stop, parallax scrolling is disabled.
- No content flashes more than 3 times per second (WCAG 2.3.1).
- Loading spinners are announced to screen readers (via `aria-live` or `role="status"`).

#### 14.3.9 Form Accessibility Requirements

- Every form input has a visible `<label>` element associated via `htmlFor`/`id` pairing or wrapping.
- Placeholder text is never used as a substitute for a label.
- Required fields are indicated with both a visual marker (asterisk) and `aria-required="true"`.
- Error messages are displayed below the field, styled in red with an error icon, and linked to the field via `aria-describedby`.
- Error summary appears at the top of the form listing all errors with links to the corresponding fields.
- Form submission errors move focus to the error summary.
- Help text and instructions are linked via `aria-describedby` (separate from error messages, both can coexist).
- Character count for text areas (e.g., "150 / 4000 characters") is announced to screen readers on value change.
- Multi-step forms display progress indicator with current step announced (e.g., "Step 2 of 4").

#### 14.3.10 Responsive Text and Zoom

- At 200% browser zoom on a 1920x1080 display, all content remains readable and functional with no horizontal scrollbar.
- At 400% zoom, core content is still accessible (navigation and primary content — secondary widgets may reflow).
- Text is sized in `rem` units, never `px`, to respect user font size preferences.
- Line height is at least 1.5x the font size for body text.
- Paragraph spacing is at least 2x the font size.

#### 14.3.11 Alt Text and Media

- Every non-decorative image has descriptive `alt` text.
- Decorative images have `alt=""` (empty alt) and `aria-hidden="true"`.
- Icon-only buttons have `aria-label` describing the action (e.g., `aria-label="Delete event"`).
- SVG icons have `role="img"` and `aria-label` or `<title>` element.
- Uploaded photos (package photos, incident photos) have auto-generated alt text via AI service, editable by the user.
- Video content (if any) must have captions and audio descriptions.

#### 14.3.12 Live Regions and Dynamic Content

- Toast notifications use `role="status"` with `aria-live="polite"`.
- Urgent alerts (security incidents, emergency broadcasts) use `aria-live="assertive"`.
- Real-time event feed updates use `aria-live="polite"` with `aria-atomic="false"` (announce only new items, not the entire list).
- Loading states use `aria-busy="true"` on the container and announce "Loading" to screen readers.
- Record counts that update dynamically (e.g., "Showing 1-25 of 342 events") announce changes via `aria-live`.

#### 14.3.13 Accessibility Statement

- An accessibility statement page is available from the footer of every page.
- The statement includes: compliance standard (WCAG 2.2 AA), known limitations (if any), contact information for accessibility feedback, date of last audit.
- The accessibility statement page itself must be accessible.

#### 14.3.14 Assistive Technology User Testing

- **Annual** testing session with at least 3 users who rely on assistive technology (screen readers, switch devices, voice control).
- Test the top 5 user flows during each session.
- Findings documented and prioritized as accessibility bugs.
- All critical findings remediated within 2 sprints.

---

### 14.4 Code Quality Standards

#### 14.4.1 Linting

- **Frontend**: ESLint with the following rule sets enabled and enforced:
  - `eslint:recommended`
  - `@typescript-eslint/strict-type-checked`
  - `eslint-plugin-react/recommended` (or framework equivalent)
  - `eslint-plugin-react-hooks/recommended`
  - `eslint-plugin-jsx-a11y/recommended`
  - `eslint-plugin-import/recommended` (enforce consistent import ordering)
  - `eslint-plugin-security/recommended`
- **Backend**: ESLint (if Node.js) or equivalent linter for the backend language, with:
  - `@typescript-eslint/strict-type-checked`
  - `eslint-plugin-security/recommended`
  - `eslint-plugin-no-unsanitized`
  - SQL injection detection rules
- All lint rules are enforced in CI — zero warnings allowed. Warnings are treated as errors.
- Lint configuration is committed to the repository and identical for all developers.
- No inline `eslint-disable` comments without a preceding comment explaining why the disable is necessary. PRs with unexplained disables are rejected.

#### 14.4.2 Code Formatting

- **Prettier** (or equivalent) enforces consistent formatting across the entire codebase.
- Formatting is checked in CI — unformatted code fails the build.
- Format-on-save is configured in the project's editor settings (`.editorconfig`, `.vscode/settings.json`).
- Formatting rules include:
  - Print width: 100 characters
  - Tab width: 2 spaces (no tabs)
  - Semicolons: required
  - Single quotes for strings
  - Trailing commas: `all`
  - Bracket spacing: `true`
  - JSX bracket same line: `false`
- No formatting debates in code reviews — the formatter's output is final.

#### 14.4.3 Complexity Limits

| Metric                                                  | Maximum Allowed | Enforcement                                       |
| ------------------------------------------------------- | --------------- | ------------------------------------------------- |
| Cyclomatic complexity per function                      | 10              | ESLint `complexity` rule — build fails            |
| Cognitive complexity per function                       | 15              | SonarQube or equivalent — build fails             |
| Lines per function (excluding comments and blank lines) | 50              | ESLint `max-lines-per-function` — build fails     |
| Lines per file (excluding comments and blank lines)     | 400             | ESLint `max-lines` — build fails                  |
| Parameters per function                                 | 4               | ESLint `max-params` — warning, enforced in review |
| Depth of nesting                                        | 4 levels        | ESLint `max-depth` — build fails                  |
| Classes per file                                        | 1               | Convention enforced in review                     |
| Imports per file                                        | 25              | ESLint custom rule — warning, enforced in review  |

When a function or file exceeds these limits, it must be refactored — not have an exception added. The only exception process is a written Tech Lead approval in the PR with a linked follow-up ticket to refactor within 2 sprints.

#### 14.4.4 Naming Conventions

| Item                               | Convention                         | Example                                               |
| ---------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| Files (components)                 | PascalCase                         | `EventCard.tsx`, `PackageForm.tsx`                    |
| Files (utilities, hooks, services) | camelCase                          | `useEventList.ts`, `formatDate.ts`, `eventService.ts` |
| Files (test files)                 | Same as source + `.test`           | `EventCard.test.tsx`, `eventService.test.ts`          |
| Files (styles)                     | Same as component + `.module`      | `EventCard.module.css`                                |
| Variables and functions            | camelCase                          | `eventCount`, `getActiveEvents()`                     |
| Constants (true constants)         | SCREAMING_SNAKE_CASE               | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`                  |
| React components                   | PascalCase                         | `EventCard`, `MainDashboard`                          |
| React hooks                        | camelCase prefixed with `use`      | `useEventList`, `useAuth`                             |
| TypeScript interfaces              | PascalCase prefixed with nothing   | `Event`, `CreateEventInput` (no `I` prefix)           |
| TypeScript types                   | PascalCase                         | `EventStatus`, `UserRole`                             |
| TypeScript enums                   | PascalCase with PascalCase members | `EventStatus.InProgress`                              |
| API endpoints                      | kebab-case, plural nouns           | `/api/v1/events`, `/api/v1/maintenance-requests`      |
| Database tables                    | snake_case, plural                 | `events`, `maintenance_requests`                      |
| Database columns                   | snake_case                         | `created_at`, `event_type_id`                         |
| Environment variables              | SCREAMING_SNAKE_CASE               | `DATABASE_URL`, `SMTP_HOST`                           |
| CSS classes (modules)              | camelCase                          | `.eventCard`, `.statusBadge`                          |
| Feature flags                      | kebab-case                         | `enable-ai-suggestions`, `new-dashboard-layout`       |

#### 14.4.5 TypeScript Strict Mode

The following TypeScript compiler options are mandatory and must be enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- Use of `any` type is prohibited. Use `unknown` for truly unknown types and narrow with type guards.
- Use of `@ts-ignore` is prohibited. Use `@ts-expect-error` only when accompanied by a comment explaining the error and a linked issue for the fix.
- Use of type assertions (`as Type`) is limited to test files and framework-specific boundary code. Production code must use type guards.
- All function parameters and return types must be explicitly typed (no inferred return types for exported functions).

#### 14.4.6 Code Review Requirements

- **Minimum reviewers**: 2 approvals required for any PR to merge.
- **Security-critical PRs** (authentication, authorization, RLS, encryption, PII handling): 3 approvals required, including at least 1 from the Security Champion or Tech Lead.
- **Maximum PR size**: 400 lines of changed code (excluding auto-generated files, test fixtures, and migration files). PRs exceeding this limit must be split.
- **Review turnaround SLA**: First review within 4 business hours of PR submission. Final approval within 8 business hours.
- **Review checklist** (every reviewer must verify):
  - [ ] Tests are present and meaningful (not just for coverage)
  - [ ] No PII in logs, error messages, or comments
  - [ ] No hardcoded secrets or credentials
  - [ ] New endpoints have corresponding role-access matrix entries
  - [ ] Database queries avoid N+1 patterns
  - [ ] Error handling is explicit (no swallowed exceptions)
  - [ ] Accessibility requirements met for UI changes
  - [ ] API response does not leak data from other properties
  - [ ] TypeScript types are correct and specific (no `any`)
  - [ ] Naming conventions followed
  - [ ] Feature flag added for new features (if applicable)
- **Blocking conditions** (any of these prevents merge):
  - Failing CI pipeline (any stage)
  - Unresolved reviewer comments marked as "blocking"
  - Missing tests for new functionality
  - Coverage below thresholds
  - Lint or formatting violations
  - Any `eslint-disable` without justification

#### 14.4.7 Technical Debt Tracking

- Every instance of technical debt is tracked as a ticket labeled `tech-debt` in the project management system.
- Technical debt tickets must include: description of the debt, reason it was incurred, impact if not resolved, and estimated effort to resolve.
- **SLA for resolution**:
  - Critical debt (security risk, data integrity risk): resolved within 1 sprint
  - High debt (performance impact, maintainability risk): resolved within 2 sprints
  - Medium debt (code quality, readability): resolved within 4 sprints
  - Low debt (style, convenience): resolved within 8 sprints
- Technical debt backlog is reviewed weekly by the Tech Lead.
- No more than 15% of the codebase may be flagged as technical debt at any time (measured by file count with `tech-debt` TODO comments). If this threshold is exceeded, 50% of the next sprint is allocated to debt reduction.

#### 14.4.8 Dead Code Detection and Removal

- Dead code detection runs in CI using a tool such as `ts-prune`, `knip`, or equivalent.
- Unreachable code, unused exports, unused variables, and unused dependencies fail the build.
- Exception: deprecated API endpoints that are past their sunset date but still have active clients — these must be tracked with a removal ticket.
- Quarterly dead code audit: manual review of code paths that automated tools cannot detect (e.g., feature flags that are always on/off).

#### 14.4.9 Dependency Management

- Automated vulnerability scanning runs daily using `npm audit`, Snyk, or Dependabot.
- **Critical vulnerabilities**: block merge, must be resolved within 24 hours.
- **High vulnerabilities**: block merge, must be resolved within 72 hours.
- **Medium vulnerabilities**: do not block merge, must be resolved within 1 sprint.
- **Low vulnerabilities**: tracked, resolved at the team's discretion.
- Dependency updates are applied weekly (automated PRs via Dependabot or Renovate).
- Major version updates require manual review and testing before merge.
- No dependencies with licenses incompatible with commercial SaaS distribution (GPL, AGPL). Allowed licenses: MIT, Apache 2.0, BSD, ISC, 0BSD.
- New dependencies require Tech Lead approval — the PR must justify why the dependency is needed and why an existing solution cannot suffice.
- Maximum 200 production dependencies (not counting dev dependencies). Exceeding this triggers a consolidation review.

#### 14.4.10 Performance Budgets

| Metric                                      | Budget           | Measurement Method          |
| ------------------------------------------- | ---------------- | --------------------------- |
| Initial JavaScript bundle (compressed)      | < 250 KB         | Build output, checked in CI |
| Per-route JavaScript chunk (compressed)     | < 80 KB          | Build output, checked in CI |
| Largest Contentful Paint (LCP)              | < 1.5 seconds    | Lighthouse CI on staging    |
| First Input Delay (FID)                     | < 50 ms          | Lighthouse CI on staging    |
| Cumulative Layout Shift (CLS)               | < 0.05           | Lighthouse CI on staging    |
| Time to Interactive (TTI)                   | < 2.0 seconds    | Lighthouse CI on staging    |
| Lighthouse Performance Score                | > 90             | Lighthouse CI on staging    |
| Lighthouse Accessibility Score              | > 95             | Lighthouse CI on staging    |
| Lighthouse Best Practices Score             | > 95             | Lighthouse CI on staging    |
| API response time (simple CRUD)             | < 100 ms (p95)   | Load test on staging        |
| API response time (complex queries/reports) | < 500 ms (p95)   | Load test on staging        |
| API response time (search)                  | < 200 ms (p95)   | Load test on staging        |
| API response time (AI-powered features)     | < 5,000 ms (p95) | Load test on staging        |
| Database query time (single record)         | < 10 ms (p95)    | Query monitoring            |
| Database query time (list with pagination)  | < 50 ms (p95)    | Query monitoring            |
| WebSocket message delivery                  | < 500 ms (p95)   | Real-time monitoring        |
| Image/thumbnail loading                     | < 300 ms (p95)   | CDN monitoring              |

- Performance budgets are enforced in CI — builds that exceed budgets fail.
- Performance regression testing runs nightly against staging with production-like data volumes.

#### 14.4.11 Database Query Standards

- **N+1 detection**: All ORM queries are analyzed for N+1 patterns. Tools like `pg-query-analyzer` or ORM-specific N+1 detectors run in development and CI. Any detected N+1 fails the build.
- **Query plan review**: Any query that joins 3+ tables or scans more than 10,000 rows must have an `EXPLAIN ANALYZE` review documented in the PR.
- **Index requirements**: Every foreign key column must have an index. Every column used in a `WHERE` clause on a table with more than 10,000 expected rows must have an index. Index decisions are documented in migration files.
- **Query timeout**: All database queries have a 5-second timeout. Queries that hit the timeout are logged as warnings and investigated.
- **Connection pooling**: Minimum 10 connections per pool, maximum 50. Connection pool exhaustion triggers an alert.
- **Read replica usage**: All read-heavy operations (reports, search, dashboards) are directed to read replicas. Write operations always use the primary.

#### 14.4.12 Error Handling Standards

- **No swallowed exceptions**: Every `catch` block must either rethrow the error, log it and return an error response, or explicitly document why it is safe to ignore.
- **Structured error objects**: All API errors return a JSON body with the following structure:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable error description",
      "details": [
        {
          "field": "email",
          "message": "Email address is not valid",
          "code": "INVALID_FORMAT"
        }
      ],
      "requestId": "req_abc123",
      "timestamp": "2026-03-14T10:30:00.000Z"
    }
  }
  ```
- **Error codes are enumerated**: A central error code registry defines every error code, its HTTP status, and its default message. No ad-hoc error strings.
- **Client-facing error messages**: Must be clear, actionable, and free of technical jargon. "An unexpected error occurred" is not acceptable — provide the user with a next step.
- **Error boundary components**: Every major page section has an error boundary that catches rendering errors and displays a graceful fallback UI (not a white screen).
- **Unhandled rejection tracking**: All unhandled promise rejections are captured, logged, and reported to the error monitoring service.

#### 14.4.13 Logging Standards

- **Format**: Structured JSON logs with fields: `timestamp`, `level`, `message`, `service`, `requestId`, `propertyId`, `userId`, `traceId`, `spanId`.
- **Levels**: `debug`, `info`, `warn`, `error`, `fatal`. Production minimum level: `info`.
- **What to log**: API request/response metadata (method, path, status code, duration), authentication events (login, logout, token refresh), authorization failures, database query durations (warn if > 1s), external service calls (provider, duration, status), job queue operations, cache hits/misses, feature flag evaluations.
- **What NOT to log**: Passwords, API keys, tokens, session IDs, PII (names, emails, phone numbers, addresses, unit numbers), request/response bodies (except in debug mode on non-production environments), database query parameters that contain PII.
- **PII scrubbing**: A log sanitization layer runs on all log output and redacts any field matching PII patterns (email regex, phone regex, names from a known-fields list). This layer is tested with unit tests.
- **Log retention**: 90 days in hot storage (searchable), 1 year in cold storage (archived), 7 years for audit logs (compliance requirement).

---

### 14.5 Documentation & Knowledge Transfer

#### 14.5.1 Inline Code Documentation

- Every exported function, class, interface, and type must have a JSDoc/TSDoc comment block.
- JSDoc must include: `@description` (what the function does), `@param` (every parameter with type and description), `@returns` (return type and description), `@throws` (every exception the function may throw), `@example` (at least one usage example for complex functions).
- React components must have a TSDoc comment describing: what the component renders, required vs optional props, and any side effects (API calls, state changes).
- Private functions do not require JSDoc but must have a brief inline comment if the purpose is not obvious from the name.
- CI enforces JSDoc presence on exported members — missing JSDoc on exported functions fails the build.

#### 14.5.2 API Documentation

- OpenAPI 3.1 specification is the single source of truth for API documentation.
- The OpenAPI spec is auto-generated from code annotations or maintained alongside route definitions.
- The spec must be updated in the same PR that modifies an endpoint — stale API docs fail code review.
- Interactive API documentation (Swagger UI or Redoc) is deployed at `/api/docs` on staging and production.
- Every endpoint in the spec includes: summary, description, request body schema with examples, response schemas for every status code, authentication requirements, rate limiting details, and role requirements.
- The OpenAPI spec is validated in CI — invalid spec fails the build.

#### 14.5.3 Architecture Decision Records (ADR)

- Every significant technical decision is documented as an ADR in `docs/adr/` using the format:
  - **Title**: Short decision description
  - **Status**: Proposed / Accepted / Deprecated / Superseded
  - **Context**: Why this decision needed to be made
  - **Decision**: What was decided
  - **Consequences**: What changes as a result (positive and negative)
  - **Alternatives Considered**: What other options were evaluated and why they were rejected
- "Significant" means: new technology adoption, architectural pattern change, database schema design, security model change, third-party service selection, or any decision affecting more than 3 modules.
- ADRs are numbered sequentially (`0001-use-postgresql.md`, `0002-event-model-design.md`).
- ADRs are never deleted — superseded ADRs link to their replacement.

#### 14.5.4 Runbooks

Every production operation must have a runbook in `docs/runbooks/`:

| Runbook                   | Contents                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `deployment.md`           | Step-by-step deployment process, environment variables to verify, health check URLs, rollback procedure                      |
| `rollback.md`             | How to rollback to previous version, database migration rollback steps, cache invalidation steps                             |
| `scaling.md`              | How to scale horizontally (add instances), vertically (resize), database scaling, cache scaling                              |
| `incident-response.md`    | Severity classification, escalation chain, communication templates, post-mortem template                                     |
| `database-maintenance.md` | Backup verification, vacuum/analyze schedule, index maintenance, slow query investigation                                    |
| `disaster-recovery.md`    | RPO and RTO targets, recovery procedures for: database failure, cache failure, file storage failure, complete region failure |
| `security-incident.md`    | Steps for: data breach, unauthorized access, DDoS, compromised credentials                                                   |
| `on-call-guide.md`        | Alert categories, triage process, common issues and their resolutions, escalation contacts                                   |

- Runbooks are reviewed and updated every quarter.
- Every runbook is tested annually via tabletop exercise or live drill.

#### 14.5.5 Developer Onboarding

- `docs/onboarding/` contains a step-by-step guide for new developers:
  - Environment setup (prerequisites, installation, configuration)
  - Architecture overview (10-minute read covering the major systems)
  - Coding standards summary (link to this section)
  - First contribution guide (how to pick a ticket, branch naming, PR process)
  - Testing guide (how to run tests, how to write tests, test data setup)
  - Deployment guide (how code gets to production)
- Onboarding documentation is updated with every major architectural change.
- Target: a new developer can set up the project, run tests, and submit a PR within **4 hours** of starting.

#### 14.5.6 Module Documentation

- Every module directory contains a `README.md` with:
  - Module purpose (1-2 sentences)
  - Key entities and their relationships
  - API endpoints provided by this module
  - Events published and consumed by this module
  - Configuration options
  - Dependencies on other modules
  - Testing instructions specific to this module

#### 14.5.7 Changelog

- A `CHANGELOG.md` is maintained at the repository root following the [Keep a Changelog](https://keepachangelog.com) format.
- Every PR must include a changelog entry under the `[Unreleased]` section.
- Changelog categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- On release, `[Unreleased]` is renamed to the version number with the release date.
- CI checks that every PR has modified `CHANGELOG.md` — PRs without changelog entries fail (with an override label `skip-changelog` for infrastructure-only changes).

#### 14.5.8 Database Schema Documentation

- An Entity-Relationship Diagram (ERD) is auto-generated from the current database schema on every merge to main.
- ERD is published to the internal documentation site and linked from the architecture overview.
- Every migration file includes a comment block describing: what changed, why it changed, and the PR that introduced it.
- Migration history is browsable in the documentation site with diffs between versions.

#### 14.5.9 Environment Variable Documentation

- A file `docs/env-vars.md` documents every environment variable with:

| Variable              | Type   | Required | Default | Purpose                      | Example                                      |
| --------------------- | ------ | -------- | ------- | ---------------------------- | -------------------------------------------- |
| `DATABASE_URL`        | string | Yes      | —       | PostgreSQL connection string | `postgresql://user:pass@host:5432/concierge` |
| `SMTP_HOST`           | string | Yes      | —       | Email provider hostname      | `smtp.sendgrid.net`                          |
| `AI_PROVIDER_API_KEY` | string | Yes      | —       | Primary AI provider API key  | `sk-...`                                     |
| ...                   | ...    | ...      | ...     | ...                          | ...                                          |

- This file is updated in the same PR that adds, removes, or changes an environment variable.
- CI validates that every environment variable referenced in code has a corresponding entry in `docs/env-vars.md`.
- A `.env.example` file is maintained with all variables (using placeholder values, never real credentials).

#### 14.5.10 UI Component Library (Storybook)

- Every reusable UI component has a Storybook story file.
- Each story demonstrates: default state, loading state, error state, empty state, disabled state, all size variants, all color variants, responsive behavior, dark mode (if supported), keyboard interaction, and screen reader behavior notes.
- Storybook is deployed to an internal URL on every merge to main.
- Storybook is the single source of truth for component appearance — design reviews reference Storybook, not the running application.
- New components that lack a Storybook story fail code review.

#### 14.5.11 API Testing Collection

- A Postman or Insomnia collection is maintained covering every API endpoint.
- The collection is organized by module (Events, Units, Residents, Maintenance, etc.).
- Each request includes: valid example request body, expected response, authentication headers, and environment variable references.
- The collection is updated in the same PR that modifies an endpoint.
- The collection is tested nightly against staging to catch drift between docs and implementation.

#### 14.5.12 Disaster Recovery Runbook

- Step-by-step recovery procedures for every failure scenario:
  - Primary database failure: failover to replica, verify data integrity, notify users
  - Cache service failure: graceful degradation, automatic fallback to database, performance impact assessment
  - File storage failure: CDN cache serves existing files, upload queue holds new files, switchover to backup storage
  - Search service failure: disable search UI, show fallback "search unavailable" message, queue indexing operations
  - Complete region failure: DNS failover to secondary region, database replication catch-up, health check verification
  - AI provider failure: fallback to secondary provider, disable AI features with graceful degradation messages
- Each procedure lists: trigger condition, estimated recovery time, responsible person/role, verification steps.

#### 14.5.13 Knowledge Base

- A `docs/troubleshooting/` directory contains solutions for common development and operational issues.
- Format: problem description, root cause, solution steps, prevention measures.
- Updated whenever a new issue is encountered and resolved.
- Reviewed quarterly for accuracy and relevance.

#### 14.5.14 Documentation Review Cycle

- All documentation is reviewed quarterly for accuracy.
- Stale documentation (not updated in 6+ months and referencing changed systems) is flagged for update.
- Documentation review is a standing agenda item in quarterly planning.

---

### 14.6 Acceptance & Audit Rights

#### 14.6.1 User Acceptance Testing (UAT) Process

- Every feature release goes through UAT before production deployment.
- UAT is performed in a dedicated UAT environment that mirrors production in every way: same infrastructure, same database engine version, same third-party service integrations, same data volumes (seeded with production-representative data).
- UAT test cases are written by the Product Owner or QA Lead, not by the developer who built the feature.
- UAT test cases cover: happy path, edge cases, error handling, role-based access, performance under load, accessibility, and multi-tenant isolation.
- UAT duration: minimum 2 business days for minor features, 5 business days for major features, 10 business days for platform-level changes.

#### 14.6.2 UAT Sign-Off Requirements

| Feature Type                                       | Required Sign-Offs                                        | Sign-Off Criteria                                                              |
| -------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| UI changes (visual only)                           | Product Owner, QA Lead                                    | Matches design spec, responsive, accessible                                    |
| API changes                                        | QA Lead, Tech Lead                                        | All endpoints tested, documentation updated, backward-compatible               |
| New module                                         | Product Owner, QA Lead, Tech Lead, Security Champion      | Full feature coverage, security review passed, performance benchmarks met      |
| Security-sensitive changes (auth, RLS, encryption) | QA Lead, Tech Lead, Security Champion, CTO/VP Engineering | Penetration test passed, multi-tenant isolation verified, audit trail verified |
| Data migration                                     | QA Lead, Tech Lead, DBA                                   | Data integrity verified, rollback tested, performance impact assessed          |
| Third-party integration                            | QA Lead, Tech Lead                                        | Contract tests passing, error handling verified, fallback behavior tested      |

- All sign-offs are recorded in the release management system with timestamp, name, and approval/rejection notes.
- A single rejection from any required signer blocks the release until the issue is resolved and re-tested.

#### 14.6.3 Client Audit Rights

- Property management companies that are Concierge clients have the right to audit their data handling practices.
- Audit scope includes: what data is stored, where it is stored, who has access, how it is encrypted, how long it is retained, and how it is deleted.
- Audit requests must be responded to within 10 business days with a written report.
- Clients can request a copy of their data in machine-readable format (JSON or CSV) within 15 business days.
- Clients can request deletion of their data upon contract termination, with confirmation of deletion provided within 30 business days.

#### 14.6.4 Third-Party Audit Support

- Concierge must support audits from third-party auditors for:
  - **SOC 2 Type II**: Auditors receive read-only access to: security policies, access control logs, change management records, incident response records, and infrastructure configuration documentation.
  - **ISO 27001 / 27701**: Auditors receive access to: information security management system (ISMS) documentation, risk assessments, treatment plans, internal audit records, and management review minutes.
  - **PIPEDA / GDPR**: Auditors receive access to: data processing records, consent management logs, data subject request records, breach notification records, and data protection impact assessments.
- Auditor access is provisioned via time-limited, read-only accounts with full audit trail of auditor actions.
- Evidence collection is automated where possible — audit reports are generated from system data, not manually compiled.

#### 14.6.5 Audit Trail Requirements

Every data mutation in Concierge is logged in the audit trail with the following fields:

| Field         | Description                                                        | Example                                                   |
| ------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| `audit_id`    | Unique identifier                                                  | `aud_8f3k2j`                                              |
| `timestamp`   | When it happened (UTC, microsecond precision)                      | `2026-03-14T10:30:00.123456Z`                             |
| `actor_id`    | Who did it (user ID or system service name)                        | `usr_abc123` or `system:notification-service`             |
| `actor_role`  | Role of the actor at the time of action                            | `property_manager`                                        |
| `property_id` | Which property's data was affected                                 | `prop_xyz789`                                             |
| `entity_type` | What kind of record was changed                                    | `event`, `resident`, `maintenance_request`                |
| `entity_id`   | Identifier of the changed record                                   | `evt_def456`                                              |
| `action`      | What happened                                                      | `create`, `update`, `delete`, `archive`, `export`, `view` |
| `changes`     | Before/after values for updates                                    | `{ "status": { "from": "open", "to": "closed" } }`        |
| `ip_address`  | IP address of the actor                                            | `192.168.1.100`                                           |
| `user_agent`  | Browser/device information                                         | `Mozilla/5.0 ...`                                         |
| `request_id`  | Correlation ID for the HTTP request                                | `req_ghi789`                                              |
| `reason`      | Optional reason for the change (required for sensitive operations) | `"Resident requested account deletion"`                   |

- Audit logs are append-only — they cannot be modified or deleted by any user, including Super Admins.
- Audit logs are stored in a separate database or partition from application data.
- Audit log retention: 7 years minimum (compliance requirement).
- Audit logs are searchable by: actor, property, entity, action, and date range.
- Audit logs are exportable in CSV and JSON formats for compliance reporting.

#### 14.6.6 Data Integrity Audits

- **Daily**: Automated reconciliation between cache and database for critical counters (event counts, unread notification counts, package counts).
- **Weekly**: Automated check for orphaned records (records with broken foreign key references due to soft deletes or failed transactions).
- **Monthly**: Full data integrity scan comparing row counts and checksums between primary database and read replicas.
- **Quarterly**: Manual review of a random sample of 100 audit log entries to verify they accurately reflect system behavior.
- Discrepancies found during any audit trigger a **P2 incident** and are investigated within 24 hours.

#### 14.6.7 Performance Audit

- **Monthly** load testing against staging environment with production-representative data:
  - Simulate 500 concurrent users across 10 properties
  - Simulate peak traffic patterns (Monday 9 AM, package delivery surge at 3 PM)
  - Measure: API response times (p50, p95, p99), error rate, database connection pool usage, memory usage, CPU usage
  - Compare results against baselines from previous month
  - Performance degradation of more than 10% triggers investigation
- **Quarterly**: Full performance audit including database query analysis, index review, and caching effectiveness review.

#### 14.6.8 Compliance Audit Automation

Automated compliance checks run on every release candidate:

| Framework                 | Automated Checks                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PIPEDA**                | Consent collection verified for all PII fields, data retention policies enforced, breach notification process tested, data export functionality verified       |
| **GDPR**                  | Right to erasure verified, data portability verified, consent management verified, DPA templates available, cross-border transfer controls verified            |
| **SOC 2**                 | Access controls enforced, encryption at rest and in transit verified, audit logging active, change management process followed, incident response plan current |
| **ISO 27001**             | Asset inventory current, risk register updated, access review completed, vulnerability scan results reviewed                                                   |
| **ISO 27701**             | PII inventory current, processing purposes documented, data subject rights verified, privacy impact assessment completed                                       |
| **ISO 27017**             | Cloud security controls verified, shared responsibility documentation current                                                                                  |
| **ISO 9001**              | Quality objectives measured, nonconformity tracking active, corrective actions verified                                                                        |
| **HIPAA** (if applicable) | PHI identified and protected, minimum necessary standard enforced, BAA in place for sub-processors                                                             |

- Compliance check results are logged and available for auditor review.
- Any failed compliance check blocks the release.

#### 14.6.9 Penetration Testing

- **Frequency**: Full penetration test every 6 months by an independent third-party firm.
- **Scope**: All API endpoints, web application, mobile application, infrastructure, third-party integrations.
- **Focus areas**: Multi-tenant isolation, authentication/authorization bypass, injection attacks, PII exposure, session management.
- **Remediation SLAs**:
  - Critical findings: 24 hours
  - High findings: 72 hours
  - Medium findings: 2 weeks
  - Low findings: 1 sprint
  - Informational: tracked, addressed at team discretion
- Penetration test reports are stored securely and available to auditors.
- Every finding that is fixed must have a corresponding regression test added to the automated security test suite.

#### 14.6.10 Bug Classification and SLA Matrix

| Priority          | Definition                                                 | Response Time     | Resolution Time | Examples                                                                             |
| ----------------- | ---------------------------------------------------------- | ----------------- | --------------- | ------------------------------------------------------------------------------------ |
| **P1 — Critical** | System down, data loss, security breach, multi-tenant leak | 15 minutes        | 4 hours         | Database unavailable, PII exposed to wrong property, auth bypass                     |
| **P2 — High**     | Major feature broken for all users, data integrity risk    | 1 hour            | 24 hours        | Event creation failing, notifications not delivering, search returning wrong results |
| **P3 — Medium**   | Feature partially broken, workaround available             | 4 hours           | 1 week          | Report export missing columns, filter not working on one field, slow page load       |
| **P4 — Low**      | Minor issue, cosmetic, edge case                           | Next business day | 2 sprints       | Typo in UI text, alignment off by 2px, tooltip missing on one button                 |

- P1 and P2 bugs trigger immediate notification to the on-call engineer via PagerDuty or equivalent.
- P1 bugs trigger an incident channel with mandatory post-mortem within 48 hours.
- All bugs are tracked in the project management system with timestamps for detection, acknowledgment, and resolution.
- SLA compliance is measured monthly and reported on the quality dashboard.

#### 14.6.11 Release Acceptance Criteria

Before any release is deployed to production, ALL of the following must be true:

- [ ] All unit tests pass (100% green)
- [ ] All integration tests pass (100% green)
- [ ] Code coverage meets or exceeds thresholds (14.1.1)
- [ ] SAST scan shows zero critical or high findings
- [ ] DAST scan shows zero critical or high findings
- [ ] Accessibility scan shows zero critical or serious violations
- [ ] Performance budgets met (14.4.10)
- [ ] All required UAT sign-offs obtained (14.6.2)
- [ ] Changelog updated
- [ ] API documentation updated
- [ ] Database migrations tested (forward and rollback)
- [ ] Feature flags configured for new features
- [ ] Rollback plan documented and tested
- [ ] On-call engineer identified and briefed
- [ ] Zero open P1 or P2 bugs
- [ ] Compliance checks pass (14.6.8)
- [ ] Multi-tenant isolation tests pass (14.2.4)

Any single failing criterion blocks the release. No exceptions without written CTO approval.

#### 14.6.12 Rollback Criteria and Procedure

**When to rollback** (any one of these triggers automatic rollback):

- Error rate exceeds 1% of requests within 10 minutes of deployment
- API response time (p95) exceeds 2x the pre-deployment baseline
- Any P1 bug reported within 30 minutes of deployment
- Health check endpoint returns unhealthy
- Multi-tenant isolation check fails

**Who decides**: The on-call engineer can trigger rollback unilaterally. No approval chain needed for rollback.

**How fast**: Rollback must complete within **5 minutes** of the decision.

**Procedure**:

1. Trigger rollback via deployment pipeline (one-command rollback)
2. Verify previous version is serving traffic (health check)
3. Verify database migration rollback (if applicable)
4. Invalidate CDN cache for static assets
5. Notify all stakeholders via incident channel
6. Begin investigation into the failure
7. Document findings in post-mortem

#### 14.6.13 Feature Flag Requirements

- Every new user-facing feature must be wrapped in a feature flag.
- Feature flags are managed via a feature flag service (LaunchDarkly, Unleash, or equivalent), not environment variables.
- Feature flag naming: `kebab-case` with module prefix (e.g., `events-ai-suggestions`, `maintenance-photo-upload`).
- Feature flags support targeting by: property, user role, user ID, percentage rollout, and environment.
- Feature flags have an expiry date — flags older than 90 days trigger a cleanup alert.
- Removing a feature flag (when the feature is fully rolled out) requires a PR that removes all flag checks and the flag definition.
- Feature flag changes are logged in the audit trail.

#### 14.6.14 Canary Deployment Requirements

- New releases are deployed to a canary group (5% of traffic) before full rollout.
- Canary runs for a minimum of **30 minutes** while monitoring:
  - Error rate (must remain below 0.5%)
  - Response time (must remain within 10% of baseline)
  - Resource utilization (CPU and memory must not spike more than 20%)
- If canary metrics are healthy after 30 minutes, traffic is gradually increased: 25% → 50% → 100% over 1 hour.
- If any metric breaches its threshold during canary, automatic rollback is triggered.
- Canary metrics are displayed on the deployment dashboard in real time.

#### 14.6.15 Post-Deployment Verification

After every production deployment, the following automated checks run:

- [ ] Health check endpoints return `200` for all services
- [ ] Database connection pool is healthy
- [ ] Cache service is responding
- [ ] Search service is responding
- [ ] WebSocket connections can be established
- [ ] Email test message sends successfully
- [ ] SMS test message sends successfully
- [ ] Push notification test sends successfully
- [ ] AI provider is responding
- [ ] File upload/download works
- [ ] Multi-tenant isolation spot check passes (create record in Property A, verify absence in Property B)
- [ ] Login flow completes successfully
- [ ] Critical API endpoints respond within budget

Results are logged and any failure triggers an automatic alert.

---

### 14.7 Security Testing

#### 14.7.1 Authentication Testing

| Test Category                 | Specific Tests                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brute force**               | After 5 failed login attempts in 15 minutes, account is locked for 30 minutes. Locked account returns generic error (not "account locked" — prevent enumeration). |
| **Session fixation**          | Session ID changes on login. Old session IDs are invalid after login.                                                                                             |
| **Credential stuffing**       | Rate limiting on login endpoint (max 10 attempts per IP per minute). CAPTCHA triggered after 3 failed attempts from same IP.                                      |
| **Token expiry**              | Access tokens expire after 15 minutes. Refresh tokens expire after 7 days. Expired tokens are rejected with `401`.                                                |
| **Token refresh**             | Refresh token rotation — used refresh token is invalidated. Attempting to reuse a refresh token invalidates all tokens for that user (theft detection).           |
| **Password reset**            | Reset token expires after 1 hour. Reset token is single-use. Reset link does not reveal whether email exists in system.                                           |
| **Multi-device sessions**     | User can view all active sessions. User can revoke individual sessions. User can revoke all other sessions ("log out everywhere").                                |
| **Concurrent session limits** | Configurable per-property limit (default: 5 concurrent sessions per user). New login beyond limit terminates oldest session.                                      |

#### 14.7.2 Authorization Testing

| Test Category                                        | Specific Tests                                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Horizontal privilege escalation (cross-property)** | Property A admin cannot access, modify, or delete any resource belonging to Property B. Tested for every API endpoint. Returns `404` (not `403`).   |
| **Vertical privilege escalation (cross-role)**       | Resident cannot access admin endpoints. Security Guard cannot access Property Manager endpoints. Test for every role combination.                   |
| **IDOR (Insecure Direct Object Reference)**          | Changing an entity ID in the URL does not grant access to another user's resource. Test with: sequential IDs, UUID guessing, previous resource IDs. |
| **Mass assignment**                                  | Sending unexpected fields in API requests does not modify protected attributes (e.g., sending `role: "admin"` in a profile update).                 |
| **Function-level access**                            | Admin-only functions (user creation, property config, role assignment) are not accessible by non-admin roles.                                       |
| **Record-level access**                              | Resident can only see their own maintenance requests, packages, and bookings. Staff can only see data for properties they are assigned to.          |

#### 14.7.3 Multi-Tenant Isolation Penetration Testing

This is the most critical security test category. Run quarterly, minimum.

- Attempt to access Property B data by manipulating: URL parameters, request body fields (`propertyId`), HTTP headers, JWT claims, WebSocket channel subscriptions, GraphQL queries (if applicable), search queries, file download URLs, export/report parameters.
- Attempt to access Property B data via: SQL injection in filter parameters, NoSQL injection, LDAP injection, ORM manipulation, GraphQL introspection.
- Attempt cross-tenant data access via: timing attacks (response time differences between "not found" and "forbidden"), error message differences, cache poisoning (requesting Property A data with Property B's cache key).
- Every attempt must fail with `404` (not `403`) to prevent tenant enumeration.
- Results documented in a penetration test report with proof-of-concept for any finding.

#### 14.7.4 Input Validation Testing

| Attack Type                            | Test Details                                                                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **SQL injection**                      | Test all input fields with: `' OR '1'='1`, `'; DROP TABLE events; --`, union-based injection, blind injection (time-based and boolean-based). All queries must use parameterized statements. |
| **XSS (Cross-Site Scripting)**         | Test: `<script>alert('xss')</script>`, event handlers (`onerror`, `onload`), SVG injection, CSS injection, DOM-based XSS via URL fragments. All output must be contextually encoded.         |
| **CSRF (Cross-Site Request Forgery)**  | All state-changing endpoints require a CSRF token. Token is validated server-side. Token is rotated per session.                                                                             |
| **Command injection**                  | Test any input that reaches a shell command (e.g., file processing): `; ls -la`, `                                                                                                           | cat /etc/passwd`, backtick injection. All inputs must be sanitized or avoided entirely. |
| **Path traversal**                     | Test file upload/download paths: `../../etc/passwd`, `%2e%2e%2f`, null byte injection. File paths must be resolved and validated against an allowlist.                                       |
| **XML/XXE injection**                  | If XML parsing is used: test external entity expansion, billion laughs attack, SSRF via DTD. Use secure XML parser with external entities disabled.                                          |
| **SSRF (Server-Side Request Forgery)** | Test any endpoint that accepts a URL: internal network scanning, cloud metadata endpoint access (`169.254.169.254`). URL inputs must validate against an allowlist of permitted domains.     |

#### 14.7.5 File Upload Security Testing

- Upload executable file disguised as image → rejected (validate by file header magic bytes, not extension).
- Upload file with embedded malware → detected and rejected by virus scanner.
- Upload polyglot file (valid JPEG that is also valid JavaScript) → virus scanner detects and rejects.
- Upload file with null byte in filename (`photo.jpg%00.exe`) → rejected.
- Upload file exceeding size limit → rejected with clear error (no partial file stored).
- Upload to another property's storage path → rejected (storage paths include property ID).
- Direct access to uploaded file via guessed URL → rejected (signed URLs required).

#### 14.7.6 API Security Testing

- All API endpoints require authentication (except: login, password reset, public health check).
- All API endpoints enforce authorization (role check + property check).
- All API endpoints enforce rate limiting.
- All API endpoints validate Content-Type header.
- All API endpoints reject requests with unexpected query parameters (strict parameter validation).
- All API endpoints return consistent error format (14.4.12).
- API versioning prevents breaking changes from affecting existing clients.
- GraphQL endpoints (if applicable): introspection disabled in production, query depth limited to 10, query complexity limited to 1000.

#### 14.7.7 PII Exposure Testing

Verify that PII is NOT present in:

- Server logs (checked by log scrubbing layer tests — 14.4.13)
- Error messages returned to clients
- URL parameters or query strings
- API responses beyond what the requesting role is authorized to see
- Browser console output
- Exported reports for unauthorized roles
- WebSocket broadcast messages to unauthorized subscribers
- Search index metadata (only searchable by authorized users)
- Cache keys (keys may contain entity IDs but not PII values)
- Third-party analytics payloads
- Client-side state management stores (Redux, Zustand, etc.) for data not visible to the current user

#### 14.7.8 Encryption Verification

| Layer                      | Requirement                                                                                                                                                     | Verification Method                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **In transit**             | TLS 1.2 minimum (TLS 1.3 preferred). No SSL 3.0, TLS 1.0, or TLS 1.1.                                                                                           | SSL Labs test (grade A or A+). Certificate expiry monitoring.                  |
| **At rest (database)**     | AES-256 encryption for the database volume                                                                                                                      | Cloud provider configuration audit. Encryption key rotation verified.          |
| **At rest (file storage)** | AES-256 encryption for stored files                                                                                                                             | Cloud provider configuration audit.                                            |
| **At rest (backups)**      | AES-256 encryption for all backups                                                                                                                              | Backup restoration test verifies encryption.                                   |
| **Application-level**      | Sensitive fields (SSN, government ID if stored) encrypted with application-level encryption before database storage                                             | Unit tests verify encrypted storage and correct decryption.                    |
| **Key management**         | Encryption keys stored in a dedicated key management service (AWS KMS, GCP KMS, or equivalent). No keys in source code, environment variables, or config files. | Automated scan for key material in source code. Key rotation tested quarterly. |

#### 14.7.9 Session Management Testing

- Session timeout: 30 minutes of inactivity (configurable per property, minimum 15 minutes, maximum 8 hours).
- Session invalidation on password change (all sessions for the user are invalidated).
- Session invalidation on role change (user must re-authenticate to receive new role permissions).
- Session cookie attributes: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`.
- Session ID entropy: minimum 128 bits of randomness.
- Session storage: server-side only (no session data in cookies).

#### 14.7.10 Dependency Vulnerability Scanning

- Automated scanning runs on every PR and nightly on main branch.
- **Critical** vulnerability in any dependency: blocks merge, must be resolved within 24 hours (upgrade, patch, or remove dependency).
- **High** vulnerability: blocks merge, must be resolved within 72 hours.
- **Medium** vulnerability: does not block merge, tracked with 1-sprint SLA.
- **Low** vulnerability: tracked, resolved at team discretion.
- Scanning covers: direct dependencies, transitive dependencies, OS-level packages in Docker images, infrastructure-as-code templates.
- Results are aggregated on the security dashboard with trend charts.

#### 14.7.11 Secret Management Testing

- No secrets in source code (scanned by automated secret detection tool — e.g., GitLeaks, TruffleHog).
- No secrets in commit history (scan entire Git history monthly).
- No secrets in logs (verified by log scrubbing tests — 14.4.13).
- No secrets in environment variable values committed to source control (`.env` files are in `.gitignore`).
- Secrets are stored in a dedicated secret management service (AWS Secrets Manager, HashiCorp Vault, or equivalent).
- Secret rotation is automated: API keys rotated every 90 days, database passwords rotated every 30 days.
- Secret access is logged — who accessed which secret, when, from where.

#### 14.7.12 Security Headers

Every HTTP response must include:

| Header                      | Value                                                                        | Purpose                           |
| --------------------------- | ---------------------------------------------------------------------------- | --------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                               | Enforce HTTPS                     |
| `X-Content-Type-Options`    | `nosniff`                                                                    | Prevent MIME sniffing             |
| `X-Frame-Options`           | `DENY`                                                                       | Prevent clickjacking              |
| `X-XSS-Protection`          | `0` (rely on CSP instead)                                                    | Disable legacy XSS filter         |
| `Content-Security-Policy`   | Strict CSP with nonce-based script allowlist                                 | Prevent XSS                       |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                            | Limit referrer information        |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=()`                       | Disable unused browser features   |
| `Cache-Control`             | `no-store` for API responses with PII; appropriate caching for static assets | Prevent caching of sensitive data |

- Security headers are verified by automated tests on every deployment.
- CORS is configured to allow only the application's own domains — no wildcards (`*`).

#### 14.7.13 Security Regression Testing

- Every security vulnerability that is fixed must have a corresponding automated test that verifies the fix.
- This test is added to the security regression test suite and runs on every PR.
- The security regression test suite is a permanent, growing body of tests — tests are never removed.
- The suite is organized by vulnerability category (injection, authentication, authorization, etc.).
- Quarterly review ensures all fixed vulnerabilities have regression tests.

---

### 14.8 Static Application Security Testing (SAST)

#### 14.8.1 Required SAST Tools

Two categories of SAST tools are required:

| Category                  | Purpose                                                                              | Recommended Tools (or equivalent) |
| ------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| **Code-level SAST**       | Analyze source code for vulnerabilities (injection, insecure patterns, logic errors) | Semgrep, SonarQube, CodeQL        |
| **Dependency-level SAST** | Analyze third-party dependencies for known vulnerabilities                           | Snyk, npm audit, Dependabot       |

- At least one tool from each category must be active and enforced in CI.
- Both tools must support TypeScript and SQL analysis.

#### 14.8.2 SAST in CI Pipeline

- SAST runs on every pull request. Results are posted as PR comments.
- **Critical severity findings**: block merge. No exceptions.
- **High severity findings**: block merge. Override requires Security Champion approval with documented justification.
- **Medium severity findings**: do not block merge. Must be resolved within 1 week.
- **Low severity findings**: do not block merge. Must be resolved within 1 sprint.

#### 14.8.3 Nightly SAST

- Full SAST scan runs nightly on the main branch.
- Nightly scan catches issues that per-PR scans might miss (cross-file analysis, deep dataflow analysis).
- Nightly scan results are reviewed by the Security Champion every morning.
- Any new critical or high finding triggers an immediate alert.

#### 14.8.4 Custom SAST Rules

Custom rules are required for Concierge-specific patterns:

| Rule                       | What It Detects                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **PII logging**            | Any log statement that includes variables named `email`, `phone`, `name`, `address`, `ssn`, or similar PII field names |
| **Missing RLS check**      | Database queries in API handlers that do not include a `property_id` filter                                            |
| **Direct database access** | API handlers that bypass the service layer and query the database directly                                             |
| **Hardcoded property ID**  | Any property ID literal in source code (must always come from auth context)                                            |
| **Unvalidated file path**  | File system operations that use user-supplied input without path validation                                            |
| **Missing rate limit**     | New API endpoints without rate limiting middleware                                                                     |
| **Insecure random**        | Use of `Math.random()` for security-sensitive operations (tokens, IDs)                                                 |
| **Missing audit log**      | State-changing operations (create, update, delete) without an audit log entry                                          |

- Custom rules are maintained in the repository alongside the application code.
- Custom rules have their own tests to prevent false positives.

#### 14.8.5 Remediation SLAs

| Severity     | Response Time                       | Resolution Time       |
| ------------ | ----------------------------------- | --------------------- |
| **Critical** | Acknowledged within 1 hour          | Fixed within 24 hours |
| **High**     | Acknowledged within 4 hours         | Fixed within 72 hours |
| **Medium**   | Acknowledged within 1 business day  | Fixed within 1 week   |
| **Low**      | Acknowledged within 2 business days | Fixed within 1 sprint |

- SLA clock starts when the finding is reported (not when it is triaged).
- SLA compliance is tracked on the security dashboard.

#### 14.8.6 False Positive Management

- False positives are marked in the SAST tool with a justification comment.
- False positive markings require Security Champion approval.
- False positives are reviewed quarterly — patterns of false positives trigger custom rule refinement.
- A maximum of 5% of total findings may be marked as false positives. Exceeding this threshold triggers a tool configuration review.

#### 14.8.7 SAST Dashboard

The SAST dashboard (accessible to Tech Lead, Security Champion, and Super Admin) displays:

- Total open findings by severity
- Findings trend over the past 90 days (new vs resolved)
- Top 10 most common vulnerability types
- Mean time to resolve by severity
- Modules with the most findings
- SLA compliance rate
- False positive rate

#### 14.8.8 Language-Specific SAST Configuration

| Language/Technology        | Specific Configuration                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript**             | Taint analysis for user inputs → database queries, template injection detection, prototype pollution detection                   |
| **SQL**                    | Injection detection in raw queries, privilege escalation patterns, unsafe dynamic query construction                             |
| **Infrastructure-as-Code** | Terraform/CloudFormation misconfiguration detection: open security groups, unencrypted resources, overly permissive IAM policies |
| **Docker**                 | Dockerfile best practices: no root user, minimal base images, no secrets in build args                                           |
| **CI/CD configuration**    | Pipeline injection detection, secret exposure in pipeline logs                                                                   |

#### 14.8.9 Secrets Scanning

- Secrets scanning runs on every PR and on every commit to main.
- Scanned patterns include: API keys, OAuth tokens, database connection strings, private keys, certificates, AWS/GCP/Azure credentials, generic passwords.
- Scanning includes the full Git history (not just the current diff) — run monthly on complete history.
- Any detected secret triggers an immediate alert and the secret is considered compromised (rotated immediately, regardless of whether it was exposed publicly).

#### 14.8.10 License Compliance Scanning

- Every dependency's license is scanned on every PR.
- **Blocked licenses**: GPL, AGPL, SSPL, Commons Clause, any license that requires source disclosure or restricts commercial use.
- **Allowed licenses**: MIT, Apache 2.0, BSD (2-clause and 3-clause), ISC, 0BSD, Unlicense, CC0.
- **Review-required licenses**: MPL, LGPL, EUPL — these require legal review before adoption.
- New dependencies with blocked licenses fail the build.
- License compliance report is generated monthly and stored for audit.

#### 14.8.11 IDE Integration

- SAST tools must have IDE plugins (VS Code, JetBrains) installed and configured for all developers.
- IDE plugins show SAST findings inline (in the code editor) as developers write code.
- IDE plugin configuration is standardized via project configuration files committed to the repository.
- This "shift-left" approach catches issues before they reach CI, reducing feedback loop time.

---

### 14.9 Dynamic Application Security Testing (DAST)

#### 14.9.1 Required DAST Tools

- At least one DAST tool is required (e.g., OWASP ZAP, Burp Suite Enterprise, Nuclei, or equivalent).
- The DAST tool must support: authenticated scanning, API scanning (OpenAPI-driven), and scheduled scans.

#### 14.9.2 DAST on Release Candidates

- Every release candidate is scanned by DAST against the staging environment before production deployment.
- DAST scan must complete before the release candidate is approved.
- **Critical findings**: block release. Must be fixed and re-scanned.
- **High findings**: block release. Must be fixed and re-scanned.
- **Medium findings**: do not block release if acknowledged by Security Champion. Must be fixed within 1 week.
- **Low findings**: tracked, resolved within 1 sprint.

#### 14.9.3 Scheduled DAST

- Full DAST scan runs weekly against staging (Sundays at 2 AM local time).
- Scheduled scan results are reviewed by the Security Champion on Monday morning.
- Scheduled scans use the latest staging deployment (may include unreleased features behind feature flags).

#### 14.9.4 Authenticated DAST Scans

- DAST scans run with credentials for every user role:
  - Super Admin
  - Property Admin
  - Property Manager
  - Front Desk / Concierge
  - Security Guard
  - Maintenance Staff
  - Board Member
  - Resident
- Each role's scan verifies that the role cannot access resources beyond its authorization.
- Authenticated scans include: session management testing, privilege escalation testing, and IDOR testing.

#### 14.9.5 DAST Scope

| Target                   | What Is Scanned                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **API endpoints**        | Every endpoint defined in the OpenAPI spec, including: all HTTP methods, all parameter combinations, error responses |
| **Web pages**            | Every route in the SPA, including: all interactive elements, all form submissions, all navigation flows              |
| **File operations**      | Upload and download endpoints with various file types and sizes                                                      |
| **Authentication flows** | Login, logout, password reset, token refresh, session management                                                     |
| **WebSocket endpoints**  | Connection establishment, message handling, authentication                                                           |

#### 14.9.6 API-Specific DAST (Fuzzing)

- OpenAPI-driven fuzzing generates random inputs for every endpoint based on the schema definition.
- Fuzzing covers: boundary values, unexpected types, oversized payloads, malformed JSON, nested objects at extreme depth, special characters in every field.
- Fuzzing runs a minimum of 10,000 requests per endpoint per scan.
- Any unhandled exception (500 response) during fuzzing is treated as a **High** severity finding.
- Any information disclosure in error responses during fuzzing is treated as a **Medium** severity finding.

#### 14.9.7 Cross-Tenant DAST Testing

- Automated DAST tests that attempt to access one tenant's data from another tenant's session.
- These tests run against every API endpoint with two different tenant sessions.
- Test methodology:
  1. Authenticate as Tenant A
  2. Capture Tenant A's resource IDs from normal API responses
  3. Authenticate as Tenant B
  4. Attempt to access Tenant A's resource IDs using Tenant B's session
  5. Verify every attempt returns `404` (not `403`, not `200`)
- Any cross-tenant data access is treated as a **Critical** finding (24-hour resolution SLA).

#### 14.9.8 DAST for Mobile-Responsive Views

- DAST scans include testing at mobile viewport sizes (375px width) to catch security issues specific to mobile layouts (e.g., hidden form fields that bypass validation, mobile-specific routes that lack authentication).
- Mobile-responsive testing verifies that no security controls are bypassed by viewport changes.

#### 14.9.9 DAST Reporting

- DAST results are integrated into the security dashboard alongside SAST results.
- Reports include: finding severity, affected URL/endpoint, proof-of-concept request/response, remediation guidance.
- Trend charts show: total findings over time, mean time to resolve, most commonly found vulnerability types.

#### 14.9.10 Runtime Protection Rules

- Findings from DAST inform Web Application Firewall (WAF) rules.
- When a new attack pattern is discovered via DAST, a corresponding WAF rule is added to block that pattern in production.
- WAF rules are tested against the DAST tool to verify they block the attack without causing false positives for legitimate requests.

#### 14.9.11 SAST-DAST Correlation

- Findings from SAST and DAST are correlated to identify vulnerabilities that appear in both analyses.
- Correlated findings are prioritized higher — a vulnerability confirmed by both static and dynamic analysis is promoted by one severity level (e.g., Medium becomes High).
- Correlation is performed by the Security Champion during weekly security review.
- Uncorrelated findings (found by only one tool) are still tracked and resolved according to their individual severity SLAs.

---

### 14.10 Quality Gates — CI/CD Pipeline Enforcement

#### 14.10.1 Pipeline Stages

Every code change passes through the following pipeline stages in order. Each stage must pass before the next begins.

```
Stage 1: Lint & Format
    ↓ (pass)
Stage 2: Type Check
    ↓ (pass)
Stage 3: Unit Tests + Coverage
    ↓ (pass)
Stage 4: Build
    ↓ (pass)
Stage 5: Integration Tests
    ↓ (pass)
Stage 6: SAST Scan
    ↓ (pass)
Stage 7: Accessibility Scan
    ↓ (pass)
Stage 8: Deploy to Staging
    ↓ (pass)
Stage 9: DAST Scan (on staging)
    ↓ (pass)
Stage 10: Performance Tests (on staging)
    ↓ (pass)
Stage 11: UAT Sign-Off (manual gate)
    ↓ (approved)
Stage 12: Canary Deploy to Production (5%)
    ↓ (metrics healthy for 30 min)
Stage 13: Full Production Deploy (25% → 50% → 100%)
    ↓ (complete)
Stage 14: Post-Deployment Verification
```

#### 14.10.2 Quality Gates Definition

| Gate                      | Criteria to Pass                                                                                       | What Happens on Failure                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **G1: Lint & Format**     | Zero lint errors, zero formatting differences                                                          | Build fails. Developer must fix locally.                                       |
| **G2: Type Check**        | Zero TypeScript errors                                                                                 | Build fails. Developer must fix locally.                                       |
| **G3: Unit Tests**        | All tests pass. Coverage meets thresholds (14.1.1). New code coverage meets delta thresholds (14.1.4). | Build fails. PR cannot merge.                                                  |
| **G4: Build**             | Application builds without errors. Bundle size within budget.                                          | Build fails. PR cannot merge.                                                  |
| **G5: Integration Tests** | All integration tests pass. Multi-tenant isolation tests pass.                                         | Build fails. PR cannot merge.                                                  |
| **G6: SAST**              | Zero critical or high findings.                                                                        | Build fails. PR cannot merge (overridable by Security Champion for high only). |
| **G7: Accessibility**     | Zero critical or serious axe-core violations.                                                          | Build fails. PR cannot merge.                                                  |
| **G8: Staging Deploy**    | Deployment succeeds. Health checks pass.                                                               | Deployment rolled back. Team investigates.                                     |
| **G9: DAST**              | Zero critical findings. Zero high findings.                                                            | Release candidate rejected. Findings must be fixed.                            |
| **G10: Performance**      | All performance budgets met (14.4.10).                                                                 | Release candidate rejected. Optimization required.                             |
| **G11: UAT**              | All required sign-offs obtained (14.6.2).                                                              | Release blocked until sign-offs obtained.                                      |
| **G12: Canary**           | Error rate < 0.5%. Response time within 10% of baseline.                                               | Automatic rollback.                                                            |
| **G13: Full Deploy**      | Gradual rollout completes without metric breaches.                                                     | Automatic rollback to canary or previous version.                              |
| **G14: Post-Deploy**      | All verification checks pass (14.6.15).                                                                | Alert triggered. Investigation begins. Rollback if P1 issue found.             |

#### 14.10.3 Gate Override Policy

| Gate                | Who Can Override          | Override Condition                                                                              |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| G1 (Lint)           | Nobody                    | No overrides — fix the code.                                                                    |
| G2 (Type Check)     | Nobody                    | No overrides — fix the code.                                                                    |
| G3 (Unit Tests)     | Tech Lead                 | Only for known flaky tests with a linked fix ticket.                                            |
| G4 (Build)          | Nobody                    | No overrides — fix the build.                                                                   |
| G5 (Integration)    | Tech Lead                 | Only for known environment issues with a linked fix ticket.                                     |
| G6 (SAST)           | Security Champion         | Only for high severity (not critical). Must document justification and link remediation ticket. |
| G7 (Accessibility)  | Nobody                    | No overrides — fix the violation.                                                               |
| G8 (Staging Deploy) | Nobody                    | No overrides — fix the deployment.                                                              |
| G9 (DAST)           | CTO                       | Only in an emergency with a public incident timeline for remediation.                           |
| G10 (Performance)   | Tech Lead + Product Owner | Only if degradation is expected and documented (e.g., new feature adds necessary weight).       |
| G11 (UAT)           | Product Owner             | Can defer non-blocking UAT findings to a follow-up release with documented acceptance.          |
| G12 (Canary)        | Nobody                    | Automatic rollback — no human override during canary.                                           |
| G13 (Full Deploy)   | Nobody                    | Automatic rollback — no human override during rollout.                                          |
| G14 (Post-Deploy)   | On-call Engineer          | Can acknowledge non-critical findings. P1 findings trigger mandatory rollback.                  |

- Every override is logged in the audit trail with: who overrode, which gate, justification, and linked remediation ticket.
- More than 3 overrides in a single release triggers a mandatory retrospective.

#### 14.10.4 Environment Promotion Criteria

| Environment     | Promoted From | Criteria                                   |
| --------------- | ------------- | ------------------------------------------ |
| **Development** | Local         | Code compiles. Unit tests pass.            |
| **Staging**     | Development   | Gates G1-G7 pass.                          |
| **UAT**         | Staging       | Gates G1-G9 pass. UAT test cases prepared. |
| **Production**  | UAT           | Gates G1-G14 pass. All sign-offs obtained. |

- No environment may be skipped — code always flows through all environments in order.
- Hotfixes follow an accelerated pipeline but still pass through all gates (with expedited UAT, minimum 4 hours).

#### 14.10.5 Automated Rollback Triggers

The following conditions trigger an **automatic rollback** in production without human intervention:

| Trigger                        | Threshold                                            | Measurement Window                        |
| ------------------------------ | ---------------------------------------------------- | ----------------------------------------- |
| Error rate spike               | > 1% of requests return 5xx                          | 5-minute rolling window                   |
| Response time degradation      | p95 response time > 2x pre-deployment baseline       | 5-minute rolling window                   |
| Health check failure           | Any service health check returns unhealthy           | 2 consecutive failures (30 seconds apart) |
| Memory leak detection          | Memory usage growing > 5% per minute with no plateau | 10-minute window                          |
| Database connection exhaustion | Connection pool utilization > 90%                    | Any single measurement                    |
| Multi-tenant isolation failure | Any cross-tenant data access detected                | Immediate (single occurrence)             |

- After automatic rollback, an incident is created automatically and the on-call engineer is paged.
- Automatic rollback completes within 5 minutes.
- The rolled-back version is the last known-good deployment (verified by deployment history).

---

### 14.11 Quality Metrics Dashboard (Super Admin)

#### 14.11.1 Dashboard Overview

Super Admins have access to a real-time quality health dashboard that provides visibility into the overall quality posture of the platform. This dashboard is accessible from the Super Admin navigation under "System Health > Quality Metrics."

#### 14.11.2 Metrics Displayed

| Metric                            | Display Format                                                                           | Data Source                      | Refresh Interval       |
| --------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- | ---------------------- |
| **Test coverage (line %)**        | Gauge with threshold indicator (green > 95%, yellow 90-95%, red < 90%)                   | CI pipeline coverage reports     | On every merge to main |
| **Test coverage (branch %)**      | Gauge with threshold indicator (green > 92%, yellow 88-92%, red < 88%)                   | CI pipeline coverage reports     | On every merge to main |
| **Build success rate**            | Percentage over trailing 30 days. Trend line showing daily rate.                         | CI pipeline results              | Hourly                 |
| **Open security vulnerabilities** | Count by severity (critical, high, medium, low). Bar chart with trend.                   | SAST + DAST aggregated results   | Real-time              |
| **Accessibility score**           | Lighthouse accessibility score (latest and 30-day trend)                                 | Lighthouse CI results            | On every merge to main |
| **Mean time to resolve bugs**     | Average days from bug creation to resolution, broken down by priority (P1-P4)            | Issue tracker                    | Daily                  |
| **Deployment frequency**          | Deployments per week (trailing 4 weeks). Trend line.                                     | Deployment pipeline              | Real-time              |
| **Change failure rate**           | Percentage of deployments that triggered rollback (trailing 30 days)                     | Deployment pipeline              | Real-time              |
| **Lead time for changes**         | Average time from PR creation to production deployment (trailing 30 days)                | CI/CD pipeline + deployment logs | Daily                  |
| **Open technical debt items**     | Count by severity. Percentage of codebase flagged as tech debt.                          | Issue tracker + codebase scan    | Daily                  |
| **SLA compliance rate**           | Percentage of bugs resolved within their SLA (trailing 30 days), broken down by priority | Issue tracker                    | Daily                  |
| **MTTR (Mean Time to Recovery)**  | Average time from incident detection to resolution (trailing 90 days)                    | Incident management system       | Daily                  |
| **Uptime**                        | 30-day and 90-day uptime percentage. Target: 99.95%.                                     | Health check monitoring          | Real-time              |
| **Dependency vulnerability age**  | Average age of open dependency vulnerabilities (in days)                                 | Dependency scanning tool         | Daily                  |
| **Test suite execution time**     | Average CI pipeline duration (trailing 7 days). Trend line.                              | CI pipeline                      | Hourly                 |

#### 14.11.3 Alert Thresholds

The dashboard generates alerts when quality metrics degrade:

| Metric                        | Warning Threshold          | Critical Threshold         | Alert Channel                  |
| ----------------------------- | -------------------------- | -------------------------- | ------------------------------ |
| Test coverage (line)          | < 95%                      | < 92%                      | Email to Tech Lead             |
| Build success rate (7-day)    | < 95%                      | < 90%                      | Slack to engineering channel   |
| Open critical vulnerabilities | > 0 for more than 24 hours | > 0 for more than 48 hours | PagerDuty to Security Champion |
| Open high vulnerabilities     | > 3                        | > 5                        | Email to Security Champion     |
| Mean time to resolve P1 bugs  | > 4 hours                  | > 8 hours                  | PagerDuty to Tech Lead         |
| Change failure rate (30-day)  | > 5%                       | > 10%                      | Email to Tech Lead + CTO       |
| Uptime (30-day)               | < 99.95%                   | < 99.9%                    | PagerDuty to on-call engineer  |
| Tech debt percentage          | > 10%                      | > 15%                      | Email to Tech Lead             |
| Dependency vuln age (avg)     | > 7 days                   | > 14 days                  | Email to Security Champion     |

#### 14.11.4 Historical Trend Charts

- All metrics have historical trend charts showing data over: 7 days, 30 days, 90 days, and 1 year.
- Charts support comparison between time periods (e.g., this month vs last month).
- Charts display key events (deployments, incidents, major releases) as annotations on the timeline.
- Trend data is retained for 2 years.

#### 14.11.5 Export Capability

- All dashboard data is exportable in CSV, Excel, and PDF formats.
- Exports include: raw metric data, trend charts (as images in PDF), and summary statistics.
- Automated weekly quality report is emailed to the Tech Lead and CTO every Monday at 9 AM.
- Automated monthly quality report is emailed to all stakeholders on the 1st of each month.

---

### 14.12 Completeness Checklist

Before marking this section as complete for any release, verify every item:

1. **Unit test coverage meets all thresholds** defined in 14.1.1 for every module type.
2. **Branch coverage meets all thresholds** defined in 14.1.1.
3. **Mutation testing score meets minimum** (80% project, 85% business logic, 90% security modules) per 14.1.5.
4. **Edge case tests exist** for all categories listed in 14.1.10.
5. **Accessibility component tests exist** for every interactive component per 14.1.11.
6. **Every API endpoint has integration tests** covering all categories in 14.2.1.
7. **Multi-tenant isolation tests pass** for all 10 mandatory scenarios in 14.2.4.
8. **Role × endpoint access matrix is complete** with zero missing entries per 14.2.5.
9. **Cross-module workflow tests exist** for all 5 workflows in 14.2.13.
10. **WCAG 2.2 AA compliance verified** via automated scan (zero critical/serious violations) per 14.3.2.
11. **Manual accessibility audit completed** within the last quarter per 14.3.3.
12. **Screen reader testing completed** with 3 screen readers per 14.3.4.
13. **Keyboard navigation tested** for every interactive element per 14.3.5.
14. **ESLint runs with zero warnings** per 14.4.1.
15. **Prettier formatting enforced** with zero differences per 14.4.2.
16. **Cyclomatic complexity within limits** (max 10 per function) per 14.4.3.
17. **TypeScript strict mode enabled** with all flags per 14.4.5.
18. **Code review checklist completed** for every PR per 14.4.6.
19. **Performance budgets met** for all metrics in 14.4.10.
20. **No N+1 queries** detected per 14.4.11.
21. **No PII in logs** verified per 14.4.13.
22. **OpenAPI spec up-to-date** and valid per 14.5.2.
23. **Storybook stories exist** for every reusable component per 14.5.10.
24. **UAT sign-offs obtained** per 14.6.2.
25. **Audit trail captures all mutations** per 14.6.5.
26. **Data integrity audit passing** per 14.6.6.
27. **Performance audit completed** within the last month per 14.6.7.
28. **Compliance checks passing** for all frameworks per 14.6.8.
29. **Penetration test completed** within the last 6 months per 14.6.9.
30. **Zero open P1 or P2 bugs** per 14.6.11.
31. **Release acceptance criteria satisfied** (all items checked) per 14.6.11.
32. **Authentication tests passing** for all scenarios in 14.7.1.
33. **Authorization tests passing** for all role/endpoint combinations per 14.7.2.
34. **Input validation tests passing** for all attack types in 14.7.4.
35. **Security headers verified** per 14.7.12.
36. **SAST scan clean** (zero critical/high) per 14.8.2.
37. **Custom SAST rules active** for all patterns in 14.8.4.
38. **Secrets scan clean** per 14.8.9.
39. **License compliance verified** per 14.8.10.
40. **DAST scan clean** (zero critical/high) per 14.9.2.
41. **Cross-tenant DAST tests passing** per 14.9.7.
42. **All CI/CD quality gates passing** per 14.10.2.
43. **Quality metrics dashboard operational** with all metrics reporting per 14.11.2.
44. **Alert thresholds configured** per 14.11.3.
45. **Weekly quality report generating** per 14.11.5.

---

## Appendix A: Cross-Cutting Concerns

### Data Export

- Every listing page must support export to Excel and PDF
- Export respects the current user's role permissions (cannot export data they cannot view)
- Export actions are logged in the audit trail
- Multiple export formats supported: CSV, Excel (.xlsx), PDF

### Mobile Responsiveness

- All interfaces must be responsive from day one
- Breakpoints: mobile (<768px), tablet (768-1279px), desktop (1280px+)
- Critical staff workflows (package intake, incident logging) must be fully functional on mobile
- Sidebar collapses to icon-only at <1280px and becomes an overlay at <768px

### Error Handling

- Every empty state must include a clear message and an action to resolve it (e.g., "No emergency contacts. Add one now.")
- Features that are unavailable to a user's role must be invisible, not disabled
- Network errors must show retry options, not generic error pages
- Form validation must be real-time with clear requirement indicators

---

## Marketing & Public Routes

### Route Group: `(marketing)`

Concierge serves public-facing pages -- landing page, feature overview, pricing, blog, and authentication screens -- through a dedicated `(marketing)` route group. These pages are accessible without authentication and use a completely different layout from the authenticated portal.

### Marketing Layout

| Aspect                   | Detail                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sidebar**              | None. Marketing pages have no sidebar navigation.                                                                                                            |
| **Navigation**           | Public navigation bar at the top: Logo, Features, Pricing, Blog, Login, "Get Started" CTA.                                                                   |
| **Footer**               | Standard marketing footer: links (About, Contact, Privacy Policy, Terms of Service, Status Page), social media icons, copyright.                             |
| **Authentication state** | If a user is already logged in and visits a marketing page, the Login button changes to "Go to Dashboard" and redirects to their role-appropriate dashboard. |

### Rendering Strategy

| Page Type                              | Strategy                         | Rationale                                                                                                                                                                             |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing page, Features, Pricing, About | **Static Site Generation (SSG)** | These pages change infrequently. Build at deploy time for maximum performance. Rebuild on content update via ISR (Incremental Static Regeneration) with a 1-hour revalidation window. |
| Blog posts, Changelog                  | **SSG with ISR**                 | Generated at build time, revalidated on demand when new posts are published.                                                                                                          |
| Login, Forgot Password                 | **Server-Side Rendering (SSR)**  | Login must check session state server-side. If already authenticated, redirect to dashboard. CSRF token generation requires server rendering.                                         |
| Property vanity URL pages              | **SSR with caching**             | Dynamic route that loads property-specific branding. Cached at the edge (CDN) with a 15-minute TTL, purged on branding change.                                                        |

### Property Type Enum

The `Property` model includes a `property_type` enum that determines behavioral flags across the platform:

| Value        | Description                                 | Behavioral Differences                                                                                                                                                   |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PRODUCTION` | Live property with real residents and staff | Full notification delivery, billing active, audit logging enforced, data retention policies apply                                                                        |
| `DEMO`       | Sales demonstration property with seed data | Notifications suppressed (logged but not delivered), billing inactive, watermark "DEMO" on all screens, auto-expires after 30 days (configurable), role switcher enabled |
| `TRAINING`   | Staff training environment                  | Notifications suppressed, billing inactive, watermark "TRAINING" on all screens, no expiry, training-specific analytics tracked separately                               |

**Database impact**: Demo and training properties use the same multi-tenant database and schema as production properties. They are logically separated by the `property_type` field. All queries that touch production analytics, billing, or aggregate reporting filter out `DEMO` and `TRAINING` properties automatically.

### Vanity URL Routing

Properties can be accessed via branded vanity URLs: `concierge.com/[property-slug]`.

| Aspect              | Detail                                                                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route**           | `/(marketing)/[property-slug]` -- dynamic route segment                                                                                                                                                                                                                                        |
| **Slug format**     | Lowercase letters, numbers, and hyphens. Max 30 characters. Must be unique across all properties.                                                                                                                                                                                              |
| **Resolution**      | On request, the server looks up the slug in the `Property` table. If found, renders a branded login/welcome page with the property's logo, primary color, welcome message, and name. If not found, returns a 404 page with a "Property not found" message and a link to the main landing page. |
| **Branding loaded** | Property logo, primary brand color (maps to `--concierge-color-primary-*` tokens), welcome message, and custom favicon.                                                                                                                                                                        |
| **SEO**             | Vanity URL pages are not indexed (`noindex` meta tag). They are private entry points for property residents, not public marketing pages.                                                                                                                                                       |
| **Caching**         | Edge-cached (CDN) with a 15-minute TTL. Cache is purged when a property updates its branding settings (see PRD 16, Branding & White-Label tab).                                                                                                                                                |

### Demo Property Data Flow

```
Super Admin creates a Demo property
  → property_type set to DEMO
  → Seed data template applied (units, sample residents, sample events, sample packages)
  → Demo watermark badge injected into layout
  → Notification service checks property_type: DEMO → log but do not deliver
  → Role Switcher component enabled in the top bar
  → All data isolated within standard multi-tenant boundaries
  → Auto-expiry job checks daily: if demo is older than expiry_days → deactivate
  → Deactivated demos: data retained for 30 days, then purged
```

Training properties follow the same flow except: no auto-expiry, training completion metrics are tracked (linked to the Training/LMS module in PRD 12), and the watermark reads "TRAINING" instead of "DEMO".

### Route Group Summary

| Route Group   | Purpose                                                                                    | Layout                                                         | Auth Required                                | Rendering                                                   |
| ------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `(auth)`      | Login, forgot password, reset password, set initial password                               | Minimal centered layout, no sidebar, no nav                    | No (redirects to dashboard if authenticated) | SSR                                                         |
| `(portal)`    | Resident-facing authenticated pages (dashboard, packages, requests, bookings, community)   | Sidebar + top bar, role-aware navigation                       | Yes                                          | SSR with client-side hydration                              |
| `(admin)`     | Staff and admin authenticated pages (security console, user management, settings, reports) | Sidebar + top bar, role-aware navigation, admin-specific tools | Yes (staff/admin roles only)                 | SSR with client-side hydration                              |
| `(marketing)` | Public pages (landing, features, pricing, blog, property vanity URLs)                      | Public nav bar + footer, no sidebar                            | No                                           | SSG for static pages, SSR for vanity URLs and login routing |

---

_This document is referenced by all module PRDs (02 through 19). Changes to this architecture specification must be reviewed for downstream impact._

---

## ADDENDUM: Gap Analysis Fixes (2026-03-17)

> Added from GAP-ANALYSIS-FINAL.md gap 1.1

### A1. Multi-Building Context Switching (Gap 1.1, High)

Platform 1 has a building selector dropdown on every page. Platform 2 has facility-level context. Concierge's multi-tenancy architecture supports multiple buildings per property but the UI mechanism for switching between buildings is not specified.

#### Building Selector Component

| Aspect                         | Specification                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Location**                   | Top bar, left of the search input                                                                                              |
| **Component**                  | Dropdown select with building name and optional building icon                                                                  |
| **Default**                    | "All Buildings" (shows aggregated data across all buildings in the property)                                                   |
| **Options**                    | "All Buildings" + one option per building in the property                                                                      |
| **Persistence**                | Selected building is stored in user session. Persists across page navigations. Resets on logout.                               |
| **URL impact**                 | Selected building appends `?building={buildingId}` to all API calls. Does not change the visible URL path.                     |
| **Data filtering**             | When a specific building is selected, ALL data views (events, packages, units, maintenance, etc.) filter to that building only |
| **Single-building properties** | For properties with only one building, the selector is hidden                                                                  |

#### Building Selector Behavior

1. On page load, check user's stored building preference
2. If stored building is valid, apply filter
3. If stored building is invalid (deleted, user lost access), reset to "All Buildings"
4. Changing the building selector:
   - Updates the current page data immediately (no full page reload)
   - Stores preference in session
   - Fires a `building-changed` event that all components listen to for reactive updates
5. The building selector is visible to ALL authenticated roles

#### Multi-Building API Pattern

All list endpoints accept an optional `building_id` query parameter:

- `GET /api/v1/events?building_id=abc` -- events for building abc
- `GET /api/v1/events` (no building_id) -- events for all buildings in the user's property
- Response includes `building_name` on each item for display in "All Buildings" mode

---

## APPENDIX D: Cross-Cutting Edge Cases

> These edge cases apply across all modules and are not repeated in individual PRDs. Every module implementation must handle these scenarios.

### D.1 Database Failover

| Scenario                             | Behavior                                                                                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary database becomes unreachable | Application switches to read replica within 5 seconds. All write operations return `503 Service Unavailable` with `Retry-After: 30` header. UI displays banner: "Some features are temporarily read-only. We are working on it." |
| Read replica lag exceeds 10 seconds  | Dashboard and list views display a warning icon with tooltip: "Data may be up to {lag_seconds} seconds behind."                                                                                                                  |
| Database connection pool exhausted   | Requests queue for up to 5 seconds, then return 503. Circuit breaker opens after 10 consecutive failures, rejecting immediately for 30 seconds before retrying.                                                                  |

### D.2 Cache Invalidation Race Conditions

| Scenario                                                  | Behavior                                                                                                                                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User A updates a record while User B has a cached version | User B sees stale data until their next API call or WebSocket push (whichever comes first). WebSocket events include a `version` field; clients discard events with a version older than their local state.                 |
| Cache write fails after database write succeeds           | The API response returns the fresh data directly from the database. A background job retries cache write 3 times with 1-second delays. If all retries fail, the cache entry is deleted (forcing a cache miss on next read). |
| Bulk operation invalidates hundreds of cache keys         | Cache invalidation is batched in groups of 50 keys with 100ms delays between batches to prevent cache stampede.                                                                                                             |

### D.3 File Upload Edge Cases

| Scenario                                         | Behavior                                                                                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload interrupted mid-transfer                  | Client retries using resumable upload protocol (tus). If the connection is lost for more than 60 seconds, the partial upload is discarded from S3 via lifecycle policy. UI shows: "Upload interrupted. Click to retry." |
| File passes size validation but virus scan fails | File is quarantined. User sees: "This file was flagged by our security scan and cannot be uploaded. Contact support if you believe this is an error." The file reference is logged for admin review.                    |
| S3 becomes unavailable                           | File upload buttons display disabled state with tooltip: "File uploads are temporarily unavailable." Existing file URLs served from CloudFront cache continue to work.                                                  |

### D.4 WebSocket Disconnection

| Scenario                              | Behavior                                                                                                                                                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebSocket connection drops            | Client attempts reconnection with exponential backoff: 1s, 2s, 4s, 8s, 16s, then every 30s. On reconnect, client sends last received event timestamp; server replays missed events (up to 1,000 events or 1 hour of history, whichever is smaller). |
| WebSocket server restart (deployment) | Server sends a `server-restart` event 10 seconds before shutdown. Clients immediately reconnect to a new server instance. Missed events during the ~5 second gap are replayed on reconnect.                                                         |
| Client has many stale tabs open       | Each tab maintains its own WebSocket connection. Server enforces a maximum of 5 concurrent WebSocket connections per user. The 6th connection closes the oldest one with code 4001 and reason "Too many connections."                               |

### D.5 Concurrent Edit Conflicts

| Scenario                                       | Behavior                                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two users edit the same record simultaneously  | Optimistic concurrency control using `version` field. The second save receives `409 Conflict` with the current server version. UI displays: "This record was updated by {user_name} at {time}. Review their changes and try again." with a diff view showing changed fields. |
| User saves a form referencing a deleted entity | Server returns `422 Unprocessable Entity` with message identifying the deleted reference. The deleted entity is removed from all dropdown menus on the next render.                                                                                                          |
| Bulk operation partially fails                 | The operation completes for successful items and returns a detailed result: `{succeeded: N, failed: M, errors: [{id, reason}]}`. UI shows a summary with an option to retry only the failed items.                                                                           |

### D.6 Session and Authentication Edge Cases

| Scenario                                   | Behavior                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT expires during a long form fill        | On form submit, the 401 response triggers a silent token refresh using the refresh token. If refresh succeeds, the original request is retried automatically. If refresh fails, the user is redirected to login with their form data preserved in sessionStorage (restored after re-login). |
| User role changed by admin while logged in | The next API call returns a `X-Role-Changed: true` header. Client displays a banner: "Your permissions have been updated. Refresh to apply changes." Page refreshes automatically after 30 seconds if the user takes no action.                                                             |
| User deactivated while logged in           | The next API call returns `403 Forbidden` with `reason: "account_deactivated"`. Client immediately clears local storage and redirects to an "Account deactivated" page with a "Contact your property manager" link.                                                                         |

### D.7 Timezone Edge Cases

| Scenario                                              | Behavior                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Browser timezone differs from property timezone       | All timestamps stored in UTC. Display uses the **property timezone** for building operations (events, bookings, shift logs) and the **user's local timezone** for personal items (notification preferences, login history). A globe icon next to timestamps indicates property time. |
| Daylight Saving Time transition                       | Scheduled tasks use IANA timezone identifiers (e.g., `America/Toronto`), not UTC offsets. Amenity bookings during the "lost" hour are rejected: "This time slot does not exist due to Daylight Saving Time. Select a different time."                                                |
| Event logged at 11:59 PM appears in next day boundary | Reports use the property timezone for date boundaries. An event at 11:59 PM ET on March 10 belongs to the March 10 report, regardless of its UTC timestamp.                                                                                                                          |
