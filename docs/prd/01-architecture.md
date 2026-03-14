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

| Role | Primary View | Core Actions | Hidden From |
|------|-------------|-------------|-------------|
| **Front Desk / Concierge** | Event grid + quick actions | Package intake, visitor log, shift notes, unit instructions | Alteration projects, financial reports, board governance |
| **Security Guard** | Security dashboard | Incident log, parking violations, FOB tracking, emergency contacts, camera feeds | Maintenance requests, purchase orders, surveys |
| **Property Manager** | Management dashboard | All maintenance, vendor compliance, alteration tracking, reports, financials | Batch package entry, shift log |
| **Board Member** | Governance view | Reports, financials, alteration approvals, building analytics | Operational details, individual unit data |
| **Resident** | Resident portal | Their packages, maintenance requests, bookings, announcements | All staff and administrative functions |

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

### 2.6 Offline-First Mobile

Mobile clients must function during network interruptions:
- All read data is cached locally
- Create and update operations are queued with timestamps
- On reconnect, queued operations sync with conflict detection
- Conflicts are surfaced to the user with resolution options (keep mine, keep server, merge)

### 2.7 Configurable, Not Hardcoded

The following must be configurable by Super Admin or Property Admin without code changes:

| Configurable Element | Scope | Who Configures |
|---------------------|-------|---------------|
| Event Types and Event Groups | Per property (with system defaults) | Property Admin |
| Custom fields on any entity | Per property, per entity type | Property Admin |
| Notification templates | Per property, per event type, per channel | Property Admin |
| Roles and permissions | Per property (with system defaults) | Super Admin |
| Maintenance categories | Per property | Property Admin |
| Amenity rules and pricing | Per amenity | Property Admin |
| Report definitions | Per property | Property Admin |
| Dashboard widget layout | Per user | Individual user |
| Branding (logo, colors) | Per property | Property Admin |
| Translation overrides | Per property, per locale | Property Admin |
| Supported locales | Per property | Property Admin |

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

| Event Type | Group | Icon | Color | Auto-Notify | Fields |
|-----------|-------|------|-------|------------|--------|
| Amazon Package | Packages | Amazon logo | `#FF9900` | Yes | courier, tracking_number, storage_spot, perishable |
| FedEx Package | Packages | FedEx logo | `#4D148C` | Yes | courier, tracking_number, storage_spot |
| Noise Complaint | Security Incidents | Alert icon | `#FF3B30` | No | noise_type, duration, floor_affected |
| Fire Alarm | Security Incidents | Fire icon | `#FF3B30` | No | alarm_zone, false_alarm, fire_dept_called |
| Visitor Check-In | Visitors | Person icon | `#5AC8FA` | Yes | visitor_name, visiting_unit, id_type, vehicle_plate |
| Cleaning Completed | Cleaning | Sparkle icon | `#34C759` | No | area_cleaned, cleaning_type |
| Shift Note | Shift Log | Note icon | `#6E6E73` | No | note_category, priority_for_next_shift |
| Key Checkout | Key Management | Key icon | `#FF9500` | No | key_type, checkout_reason, id_verified |

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

| Module | Relationship to Events |
|--------|----------------------|
| **Packages** | Package intake creates an Event of a package-type EventType. Package release closes the event. The package module provides a specialized UI (courier icons, label printing, batch intake) but the underlying data is an Event. |
| **Security** | Incidents, parking violations, key checkouts, and authorized entries are all Events with security-group EventTypes. The security module provides a dedicated dashboard with filtering and escalation workflows. |
| **Visitor Management** | Visitor check-ins and check-outs are Events. Pre-authorized visitors create draft Events that are confirmed on arrival. |
| **Shift Log** | Shift notes are Events in the "Shift Log" group. They are always accessible from a persistent UI element (not buried in navigation). |
| **Cleaning** | Cleaning log entries are Events. Checklists attach as structured custom_fields. |
| **Maintenance** | Maintenance requests have their own entity (see Section 4) because they require a richer data model (vendor assignment, equipment linkage, work orders). However, creating a maintenance request also generates a correlated Event for the unified timeline. |

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

| Field Type | Input Component | Storage Format | Searchable | Filterable |
|-----------|----------------|---------------|:----------:|:----------:|
| text | Text input (single line) | String | Yes | Yes (contains) |
| textarea | Multi-line text area | String | Yes | No |
| number | Number input (integer) | Integer | Yes | Yes (range) |
| decimal | Number input (2 decimal places) | Decimal | Yes | Yes (range) |
| date | Date picker | ISO 8601 date | Yes | Yes (range) |
| datetime | Date + time picker | ISO 8601 datetime | Yes | Yes (range) |
| dropdown | Select menu | String (selected value) | Yes | Yes (exact) |
| multi_select | Multi-select checkboxes | Array of strings | Yes | Yes (contains any) |
| checkbox | Single checkbox | Boolean | No | Yes (true/false) |
| file | File upload | Attachment ID reference | No | No |
| url | URL input with validation | String | No | No |
| email | Email input with validation | String | Yes | No |
| phone | Phone input with formatting | String | Yes | No |

---

## 6. Notification Architecture

### 6.1 Channels

Concierge supports four notification channels from day one:

| Channel | Use Cases | Delivery Speed | Cost |
|---------|----------|:-------------:|:----:|
| **Email** | Detailed notifications, documents, receipts | Minutes | Low |
| **SMS** | Time-sensitive alerts, confirmations | Seconds | Medium |
| **Push** | Real-time updates, reminders | Seconds | Free |
| **Voice** | Emergency broadcasts, critical escalations | Seconds | High |

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

| AI Feature | What It Does | Fallback Without AI |
|-----------|-------------|-------------------|
| Event classification | Suggests event type from description | Manual selection from dropdown |
| Priority recommendation | Suggests priority level | Default priority from event type |
| Smart search | Semantic search across entities | Full-text keyword search |
| Notification batching | Groups related notifications | Time-based batching (configurable window) |
| Report insights | Natural language summary of trends | Raw data tables and charts |

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

| Searchable Entity | Indexed Fields | Example Query |
|------------------|---------------|--------------|
| Unit | number, floor, building name, custom fields | "Unit 1205" |
| User / Resident | first_name, last_name, email, phone | "Sarah Chen" |
| Event | title, description, reference_number, custom fields | "PKG-2026-00147" |
| MaintenanceRequest | title, description, reference_number, category | "leaking faucet" |
| Amenity | name, description, location | "party room" |
| Announcement | title, body | "holiday hours" |
| Document | title, description, category | "fire safety plan" |
| Vendor | company_name, contact_name, specialty | "ABC Plumbing" |
| Equipment | name, serial_number, model | "elevator motor" |
| TrainingCourse | title, description | "fire safety training" |

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

| Category | Events Logged |
|----------|-------------|
| **Authentication** | Login (success/failure), logout, password change, 2FA enable/disable |
| **Data changes** | Every create, update, delete on any entity — with old and new values |
| **Access** | Who viewed which resident's data, which unit file was opened |
| **Exports** | Who exported what data, in what format, how many records |
| **Permissions** | Role assignments, permission changes, user status changes |
| **Notifications** | What was sent, to whom, on which channel, delivery status |
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

| Widget | Content |
|--------|---------|
| Property overview cards | Key metrics per property (open events, pending maintenance, occupancy) |
| Cross-property alerts | Vendor insurance expiring, equipment due for replacement, training overdue |
| Aggregated reports | Combined metrics across all properties with drill-down |
| Staff allocation | Which staff are assigned to which properties, shift coverage |

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

| Entity | Primary Fields (Top 5) | Owned By Module | Key Relationships |
|--------|----------------------|----------------|-------------------|
| **Property** | name, address, timezone, default_locale, supported_locales[] | Core | → ManagementCompany, → Buildings[], → Users[] |
| **ManagementCompany** | name, properties[], admins[] | Core | → Properties[], → Users[] |
| **Building** | name, address, total_floors, total_units | Core | → Property, → Units[] |
| **Unit** | number, floor, unit_type, status, square_footage | Core | → Building, → Users[], → Events[], → FOBs[] |
| **UnitInstruction** | instruction_text, priority, visible_to_roles[], active | Core | → Unit |
| **User** | email, first_name, last_name, role_id, preferred_locale | Core | → Role, → Unit, → Properties[] |
| **Role** | name, permissions, visible_modules[], hierarchy_level | Core | → Users[] |
| **Event** | title, status, priority, event_type_id, reference_number | Events | → EventType, → Property, → Unit, → User |
| **EventType** | name, icon, color, default_priority, group_id | Events | → EventGroup, → Property, → NotificationTemplates |
| **EventGroup** | name, icon, color, visible_to_roles[] | Events | → EventTypes[], → Property |
| **MaintenanceRequest** | title, description, status, priority, category_id | Maintenance | → Property, → Unit, → User, → Vendor, → Equipment |
| **Amenity** | name, capacity, requires_approval, price_per_slot | Amenities | → Property, → Reservations[] |
| **AmenityReservation** | start_time, end_time, status, payment_status | Amenities | → Amenity, → Unit, → User |
| **Announcement** | title, body, type, distribution_channels[], published_at | Communication | → Property, → User (author) |
| **Notification** | channel, subject, body, status, sent_at | Communication | → User, → NotificationTemplate |
| **NotificationPreference** | preferences (JSONB per module per channel) | Communication | → User, → Property |
| **NotificationTemplate** | name, channel, subject_template, body_template | Communication | → Property |
| **TrainingCourse** | title, description, passing_score, estimated_duration | Training | → Property, → Quiz, → LearningPath |
| **LearningPath** | name, courses[], required_for_roles[], deadline_days | Training | → Property, → TrainingCourses[] |
| **Quiz** | questions[], passing_score, max_attempts | Training | → TrainingCourse |
| **UserCourseProgress** | status, score, attempts, completed_at | Training | → User, → TrainingCourse |
| **ClassifiedAd** | title, description, category, price, status | Community | → Property, → User, → Unit |
| **Idea** | title, description, status, upvotes | Community | → Property, → User |
| **ParkingPermit** | permit_type_id, parking_area, spot_number, valid_until | Parking | → Property, → Unit, → User, → Vehicle |
| **ParkingViolation** | violation_type, license_plate, status, location | Parking | → Property, → Event |
| **Vendor** | company_name, specialty, insurance_status, insurance_expiry | Vendors | → Property, → MaintenanceRequests[] |
| **Equipment** | name, category_id, serial_number, status, location | Equipment | → Property, → MaintenanceRequests[] |
| **Attachment** | file_name, file_type, file_size, storage_url | Core | Polymorphic → any entity |
| **Document** | title, category, visible_to_roles[], published | Library | → Property, → Attachment |
| **ShiftLog** | content, shift_date, shift_period, priority_for_next_shift | Operations | → Property, → Event, → User |
| **EmergencyContact** | contact_name, relationship, phone_primary | Core | → User, → Unit |
| **FOB** | serial_number, fob_type, status, issued_date | Security | → Property, → Unit, → User |
| **BuzzerCode** | code, label, active | Security | → Property, → Unit |
| **GarageClicker** | serial_number, status, issued_date | Security | → Property, → Unit, → User |
| **Vehicle** | make, model, license_plate, color, year | Core | → User, → Unit |
| **Pet** | name, species, breed, weight | Core | → User, → Unit |
| **AuditEntry** | action, actor_id, entity_type, changes, ip_address | Audit | → Property, → User |
| **TranslationOverride** | locale, namespace, key, value | i18n | → Property, → User (created_by) |
| **CustomFieldDefinition** | field_key, field_label, field_type, entity_type | Core | → Property, → EventType |

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

| Locale Code | Language | Reason |
|------------|----------|--------|
| `en-US` | English (US) | System default and base language |
| `en-CA` | English (Canadian) | Canadian spelling and date formats (e.g., "colour", dd/mm/yyyy) |
| `fr-CA` | French (Canadian) | Required for Quebec properties and bilingual Ontario buildings |

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

| Data Type | en-US | en-CA | fr-CA |
|-----------|-------|-------|-------|
| Date | 03/14/2026 | 2026-03-14 | 2026-03-14 |
| Time | 2:30 PM | 2:30 p.m. | 14 h 30 |
| Currency | $1,250.00 | $1,250.00 | 1 250,00 $ |
| Numbers | 1,250.50 | 1,250.50 | 1 250,50 |

**Rules**:
- The property's timezone (`Property.timezone`) governs time display. Users always see times in the building's local timezone, regardless of their browser timezone.
- Currency symbol and format follow the active locale
- Relative timestamps ("5 minutes ago", "il y a 5 minutes") are locale-aware
- Calendar controls (week start day, month names, day abbreviations) adapt to the active locale
- Export files (Excel, PDF) use the requesting user's locale for formatting

### 12.7 Data Model Fields

Three fields across two entities support the i18n system:

| Entity | Field | Type | Purpose |
|--------|-------|------|---------|
| `User` | `preferred_locale` | varchar 10, nullable | The user's chosen language. When null, falls back to the property default. |
| `Property` | `default_locale` | varchar 10, default `"en-US"` | The property's primary language for all UI and notifications. |
| `Property` | `supported_locales[]` | varchar 10 array | All locales enabled for this property. Controls which languages appear in the user language picker and which notification template translations are required. |

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

| Aspect | Specification |
|--------|--------------|
| **Algorithm** | AES-256 (Advanced Encryption Standard, 256-bit keys) |
| **Scope** | All databases, file storage buckets, backup archives, log archives, search indexes |
| **Implementation** | Storage-layer encryption enabled on every volume and bucket -- no unencrypted storage exists anywhere in the system |
| **Key storage** | Keys are never stored alongside the data they protect |

#### In-Transit Encryption

| Aspect | Specification |
|--------|--------------|
| **Protocol** | TLS 1.3 minimum for all connections (client-to-server, server-to-server, server-to-database, server-to-cache) |
| **Older protocols** | TLS 1.0 and 1.1 are rejected. TLS 1.2 is accepted only as a fallback for legacy integrations and must be approved per-integration. |
| **Certificate management** | Automated certificate provisioning and renewal (no manual certificate rotation) |
| **Internal traffic** | All internal service-to-service communication uses mutual TLS (mTLS) -- even within the same data center |

#### Application-Level PII Encryption (Double Encryption Layer)

Sensitive PII fields are encrypted by the application before being written to the database. This means that even if someone gains direct database access (bypassing the application), they cannot read PII without the application-level encryption keys.

**Fields with application-level encryption**:

| Entity | Field | Data Type | Why It Needs Double Encryption |
|--------|-------|-----------|-------------------------------|
| `Resident` | `email` | varchar 320 (encrypted blob up to 1024 bytes) | Primary contact, identity anchor |
| `Resident` | `phone` | varchar 20 (encrypted blob up to 512 bytes) | Personal contact number |
| `Resident` | `emergency_contacts` | JSONB (encrypted blob up to 4096 bytes) | Contains names, phones, and relationships of third parties who did not consent to the platform |
| `Incident` | `description` | text (encrypted blob up to 16384 bytes) | May contain witness names, suspect descriptions, medical details |
| `Incident` | `suspect_info` | text (encrypted blob up to 8192 bytes) | Physical descriptions, identifying information |
| `Package` | `signature` | bytea (encrypted blob up to 65536 bytes) | Biometric-adjacent data (handwriting pattern) |
| `MaintenanceRequest` | `entry_instructions` | text (encrypted blob up to 4096 bytes) | May contain alarm codes, key locations, access details |

**How it works**:

1. Application receives plaintext PII from the API request
2. Application encrypts the field value using the property's encryption key via the KMS
3. Encrypted blob is written to the database column
4. Database applies its own storage-layer encryption (AES-256) on top
5. On read, the database decrypts its layer, then the application decrypts the PII layer
6. Plaintext PII is returned only to authorized users who pass role-based access checks

#### Encryption Key Management

| Aspect | Specification |
|--------|--------------|
| **Key Management Service (KMS)** | Dedicated KMS (cloud-provider-managed or HashiCorp Vault). No keys stored in application code, environment variables, or config files. |
| **Key hierarchy** | Master key (KMS-managed, never exported) > Property-level data encryption keys (DEKs) > wrapped with the master key |
| **Key rotation** | Every 90 days (quarterly) for property-level DEKs. Master key rotated annually. |
| **Rotation process** | New key encrypts new writes. Background job re-encrypts existing data with the new key within 72 hours. Old key retained in retired state until re-encryption completes. |
| **Per-property keys (Premium tier)** | Each property gets its own DEK. Standard tier shares a DEK across properties but still has full row-level isolation. |
| **Key access audit** | Every key usage (encrypt/decrypt) is logged with timestamp, user ID, and target field |
| **Key compromise procedure** | If a key is suspected compromised: (1) generate new key immediately, (2) re-encrypt all data within 24 hours, (3) retire old key, (4) notify affected properties, (5) log incident in BreachIncident table |

---

### 13.2 Backup Strategy

Backups run continuously and automatically. No human action is needed for routine backups. The system takes multiple backup types at different frequencies to balance recovery speed against storage cost.

| Backup Type | Frequency | Description |
|-------------|-----------|-------------|
| **Point-in-time recovery (PITR)** | Continuous (every transaction) | Write-ahead log (WAL) streaming. Allows restoring the database to any second within the retention window. |
| **Daily full snapshot** | Every 24 hours at 03:00 property-local-time | Complete database dump plus file storage snapshot. Taken during lowest-traffic window. |
| **File/document replication** | Continuous | Photos, PDFs, signatures, and all uploaded files replicated to secondary storage with versioning enabled (last 30 versions retained per file). |

**Backup encryption**: Every backup is encrypted with AES-256 before it leaves the primary server. Backups at rest in secondary storage are encrypted with a separate backup-specific encryption key (not the same key as the production data).

**Geographic redundancy**:

| Location | Role | Purpose |
|----------|------|---------|
| **Primary** | Toronto (ca-central-1) | All production traffic, primary database, primary file storage |
| **Secondary** | Montreal (ca-central-1b) or separate Canadian region | Backup storage, standby replica, failover target |

**Rules**:
- Minimum 2 copies of every backup in geographically separate locations (minimum 250 km apart)
- Both locations must be within Canada (data residency requirement)
- Secondary receives backup data within 15 minutes of creation
- File/document backups include full version history

---

### 13.3 Backup Retention Policy

Different backup types are retained for different periods based on recovery needs and compliance requirements.

| Backup Type | Retention Period | Automated Deletion |
|-------------|-----------------|-------------------|
| Point-in-time recovery (PITR) | 7 days (continuous, rolling) | Oldest WAL segments purged as new ones arrive |
| Daily snapshots | 30 days | Snapshot deleted on day 31 |
| Weekly snapshots | 90 days | One snapshot per week promoted from daily; deleted after 90 days |
| Monthly snapshots | 1 year (12 months) | One snapshot per month promoted from weekly; deleted after 12 months |
| Annual snapshots | 7 years | One snapshot per year promoted from monthly; deleted after 7 years |

**Configurable retention**:

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `pitr_retention_days` | integer | -- | Yes | `7` | Min: 3, Max: 30 | "PITR retention must be between 3 and 30 days." |
| `daily_retention_days` | integer | -- | Yes | `30` | Min: 7, Max: 90 | "Daily snapshot retention must be between 7 and 90 days." |
| `weekly_retention_days` | integer | -- | Yes | `90` | Min: 30, Max: 365 | "Weekly snapshot retention must be between 30 and 365 days." |
| `monthly_retention_months` | integer | -- | Yes | `12` | Min: 6, Max: 84 (7 years) | "Monthly snapshot retention must be between 6 and 84 months." |
| `annual_retention_years` | integer | -- | Yes | `7` | Min: 1, Max: 25 | "Annual snapshot retention must be between 1 and 25 years." |

Properties in jurisdictions with longer legal retention requirements (e.g., Quebec condos under certain regulations) can extend any retention period up to the maximum.

**Automated deletion**:
- Expired backups are deleted automatically by a daily cleanup job running at 04:00 UTC
- Every deletion is logged in the audit trail with: backup ID, backup type, original creation date, deletion reason ("retention expired"), and the retention policy that triggered it
- Deletion audit entries are retained for 7 years (they are never auto-deleted)

---

### 13.4 Backup Integrity Verification

Backups are useless if they are corrupted or incomplete. The system automatically verifies backup integrity on a recurring schedule.

#### Automated Weekly Verification

| Step | Action | Pass Criteria |
|------|--------|--------------|
| 1 | Restore the latest daily snapshot to an isolated environment | Restore completes without errors |
| 2 | Compare database record counts against production | Counts match within 0.1% (accounts for records created during restore) |
| 3 | Verify file checksums (random sample of 1000 files) | All checksums match |
| 4 | Boot the application against the restored database | Application starts and responds to health-check endpoint within 60 seconds |
| 5 | Run a read-only smoke test (query each table, load one record from each module) | All queries return results |
| 6 | Log results to `BackupVerification` table | -- |
| 7 | Tear down the isolated environment | -- |

#### Monthly Full Restore Drill

- Full restore of the most recent daily snapshot to an identical-to-production environment
- Verify RTO by measuring time from "start restore" to "application serving traffic"
- Verify RPO by comparing the latest record timestamp in the restored database against the backup timestamp
- Property Managers and Super Admins can view drill results in the Backup & Recovery Dashboard (see PRD 16, Section 3.16.5)

#### Verification Alerts

| Condition | Alert Channel | Recipients |
|-----------|--------------|------------|
| Weekly verification fails | Email + SMS | Super Admin |
| Monthly drill exceeds RTO target (4 hours) | Email + SMS | Super Admin |
| Checksum mismatch detected | Email + SMS + Push | Super Admin |
| Verification has not run in 10+ days | Email | Super Admin |

#### Verification Result Fields

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `record_count_match` | boolean | -- | Yes | -- | Must be true or false | "Record count match status is required." |
| `checksum_match` | boolean | -- | Yes | -- | Must be true or false | "Checksum match status is required." |
| `boot_test_passed` | boolean | -- | Yes | -- | Must be true or false | "Boot test status is required." |
| `duration_seconds` | integer | -- | Yes | -- | Min: 1, Max: 86400 | "Verification duration must be between 1 and 86400 seconds." |
| `notes` | text | 2000 chars | No | `null` | Max length: 2000 | "Verification notes must not exceed 2000 characters." |

---

### 13.5 Disaster Recovery Plan

A disaster is any event that makes the primary region unable to serve production traffic -- data center outage, network partition, hardware failure, or catastrophic data corruption.

#### Recovery Objectives

| Metric | Target | Meaning |
|--------|--------|---------|
| **RPO** (Recovery Point Objective) | 1 hour | Maximum acceptable data loss. In a worst-case scenario, at most 1 hour of data may be lost. In practice, PITR reduces this to seconds for most failures. |
| **RTO** (Recovery Time Objective) | 4 hours | Maximum time from failure detection to full service restoration. Target is under 1 hour for automated failover scenarios. |

#### Automated Failover Procedure

This is the step-by-step process that runs when the primary region fails. It is designed to work without human intervention, though a Super Admin can trigger it manually at any time.

| Step | What Happens | Timing |
|------|-------------|--------|
| 1 | **Detection**: Health-check probes (running every 10 seconds) detect that the primary region is not responding. | 0:00 |
| 2 | **Confirmation**: System waits for 3 consecutive health-check failures, 30 seconds apart, to rule out transient network blips. | 0:00 -- 1:30 |
| 3 | **DNS failover**: Automated DNS update routes all traffic from the primary region to the secondary region. DNS TTL is set to 60 seconds so clients pick up the change quickly. | 1:30 -- 3:00 |
| 4 | **Database promotion**: The secondary (read-replica) database is promoted to become the new primary database. It accepts reads and writes. | 3:00 -- 5:00 |
| 5 | **File storage switch**: Application switches to the secondary file storage replica. Uploads and downloads work against the secondary copy. | 5:00 -- 6:00 |
| 6 | **Application servers start serving**: Application servers in the secondary region begin handling production traffic. | 6:00 -- 8:00 |
| 7 | **Notification**: Super Admin receives SMS + email + push notification: "Automated failover complete. Primary region [name] is down. Secondary region [name] is now serving traffic." | 8:00 |
| 8 | **Failback** (after primary recovers): Once the primary region is healthy again, data is synced from secondary back to primary. Failback is scheduled during a maintenance window to avoid disrupting users. | Manual |

**Total automated failover time**: Under 10 minutes for most scenarios. The 4-hour RTO target accounts for worst-case scenarios requiring manual intervention.

#### Manual Failover

Super Admins can trigger failover manually from the Backup & Recovery Dashboard (PRD 16, Section 3.16.5):

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `confirmation_text` | varchar | 8 chars | Yes | -- | Must exactly equal `FAILOVER` (case-sensitive) | "Type FAILOVER to confirm. This action routes all traffic to the backup region." |
| `reason` | text | 500 chars | Yes | -- | Min length: 10, Max length: 500 | "Please provide a reason for manual failover (10-500 characters)." |

#### Failover History Fields

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `trigger_type` | enum | -- | Yes | -- | One of: `automated`, `manual` | "Trigger type must be automated or manual." |
| `triggered_by` | UUID | -- | No | `null` (system for automated) | Valid user UUID if manual | "Invalid user ID for manual failover trigger." |
| `source_region` | varchar | 50 chars | Yes | -- | Non-empty, valid region identifier | "Source region is required." |
| `target_region` | varchar | 50 chars | Yes | -- | Non-empty, valid region identifier | "Target region is required." |
| `started_at` | timestamp with timezone | -- | Yes | -- | Must be a valid ISO 8601 timestamp | "Valid start timestamp is required." |
| `completed_at` | timestamp with timezone | -- | No | `null` | Must be after `started_at` | "Completion time must be after start time." |
| `duration_seconds` | integer | -- | No | `null` | Min: 0, Max: 86400 | "Failover duration must be between 0 and 86400 seconds." |
| `status` | enum | -- | Yes | `in_progress` | One of: `in_progress`, `completed`, `failed`, `rolled_back` | "Status must be one of: in_progress, completed, failed, rolled_back." |
| `reason` | text | 500 chars | No | `null` | Max length: 500 | "Failover reason must not exceed 500 characters." |
| `data_loss_seconds` | integer | -- | No | `null` | Min: 0 | "Data loss estimate cannot be negative." |

---

### 13.6 Per-Property Data Isolation

Every property's data is isolated from every other property's data. This is enforced at multiple layers so that a bug or breach in one layer does not expose cross-property data.

#### Isolation Layers

| Layer | Mechanism | What It Prevents |
|-------|-----------|-----------------|
| **Database (Row-Level Security)** | Every table includes a `property_id` column. PostgreSQL RLS policies ensure that every query is automatically scoped to the authenticated user's `property_id`. Even raw SQL run against the database cannot return rows from another property. | Database-level cross-property access |
| **API layer** | The authentication token includes `property_id`. Every API handler extracts and enforces this value. There is no API endpoint that accepts a `property_id` as a user-supplied parameter (it always comes from the token). | Application-level cross-property access |
| **Application logic** | All ORM queries include an automatic `.where(property_id = context.property_id)` scope. Developers cannot accidentally omit this -- it is injected by middleware. | Developer error |
| **Search index** | Search indexes are partitioned by `property_id`. A search query for "John" in Property A never returns results from Property B. | Cross-property search leakage |
| **File storage** | Uploaded files are stored in property-scoped paths (`/properties/{property_id}/files/`). Bucket policies prevent cross-path access. | Cross-property file access |

#### Access Matrix

| Role | Cross-Property Access | Audited |
|------|----------------------|---------|
| Super Admin (platform level) | Yes -- can access all properties through the property switcher | Every access logged with property ID, timestamp, and action |
| Property Admin | Only their assigned properties (1 or more) | Yes |
| Property Manager | Only their assigned property (exactly 1) | Yes |
| All other roles | Only their property (exactly 1) | Yes |

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

| Tier | Definition | Encryption | Access Logging | Examples |
|------|-----------|------------|---------------|----------|
| **Sensitive PII** | Data that could cause significant harm if exposed -- financial, medical, biometric-adjacent, or government-issued identifiers | Double encryption (application + storage layer) | Every read and write logged | Medical info in incident reports, photos of people, package signatures, suspect descriptions |
| **PII** | Data that identifies a specific individual but is commonly shared (business cards, email signatures, etc.) | Standard encryption (storage layer) + application-level encryption for fields listed in Section 13.1 | Every write logged; reads logged for bulk access (export, search result sets > 50) | Name, email, phone, address, emergency contacts, vehicle license plates, FOB serial numbers |
| **Non-PII** | Data that does not identify an individual, even when combined with other non-PII fields | Standard encryption (storage layer only) | Standard audit trail (no field-level logging) | Event counts, timestamps, configuration settings, anonymized analytics, system health metrics |

#### PII Field Inventory

| Entity | Field | Classification | Encrypted at App Level | Max Length |
|--------|-------|---------------|----------------------|-----------|
| `Resident` | `first_name` | PII | No (standard encryption) | 100 chars |
| `Resident` | `last_name` | PII | No (standard encryption) | 100 chars |
| `Resident` | `email` | PII | Yes | 320 chars |
| `Resident` | `phone` | PII | Yes | 20 chars |
| `Resident` | `emergency_contacts` | PII | Yes | JSONB, 4096 bytes encrypted |
| `Resident` | `profile_photo` | Sensitive PII | Yes (file encrypted before storage) | 10 MB |
| `Unit` | `buzzer_code` | PII | No (standard encryption) | 20 chars |
| `Vehicle` | `license_plate` | PII | No (standard encryption) | 15 chars |
| `Incident` | `description` | Sensitive PII | Yes | 4000 chars |
| `Incident` | `suspect_info` | Sensitive PII | Yes | 2000 chars |
| `Incident` | `photos` | Sensitive PII | Yes (file encrypted before storage) | 10 MB per photo |
| `Package` | `signature` | Sensitive PII | Yes | 64 KB |
| `MaintenanceRequest` | `entry_instructions` | PII | Yes | 1000 chars |
| `FOB` | `serial_number` | PII | No (standard encryption) | 50 chars |

#### PII Access Logging

Every access to a PII or Sensitive PII field is logged in the `DataAccessLog` table:

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `id` | UUID | -- | Yes | Auto-generated | Valid UUID v4 | -- |
| `user_id` | UUID | -- | Yes | -- | Valid user UUID, must exist | "User ID is required for PII access logging." |
| `property_id` | UUID | -- | Yes | -- | Valid property UUID, must exist | "Property ID is required for PII access logging." |
| `table_name` | varchar | 100 chars | Yes | -- | Non-empty, must match a known table | "Table name is required and must be a valid entity table." |
| `record_id` | UUID | -- | Yes | -- | Valid UUID | "Record ID is required." |
| `field_name` | varchar | 100 chars | Yes | -- | Non-empty, must match a known PII field | "Field name is required and must be a recognized PII field." |
| `access_type` | enum | -- | Yes | -- | One of: `read`, `write`, `delete`, `export` | "Access type must be one of: read, write, delete, export." |
| `timestamp` | timestamp with timezone | -- | Yes | `now()` | Must be a valid timestamp | "Valid timestamp is required." |
| `ip_address` | varchar | 45 chars | Yes | -- | Valid IPv4 or IPv6 address | "A valid IP address is required." |
| `user_agent` | varchar | 500 chars | No | `null` | Max length: 500 | "User agent must not exceed 500 characters." |

**Retention for access logs**: PII access logs are retained for 2 years. They are never auto-deleted before that period.

#### Data Minimization

- Every field must justify its existence. If fewer than 80% of properties use a field, it should be a custom field (JSONB), not a schema column.
- Optional fields default to `null`, not empty strings or placeholder values.
- File uploads are scanned for embedded metadata (EXIF data from photos, author info from PDFs) and stripped of non-essential metadata before storage.
- Analytics dashboards use anonymized, aggregated data -- never raw PII.

#### Right to Deletion (Data Subject Requests)

A resident can request that all their PII be permanently removed from the system. This is required under PIPEDA (Canada) and GDPR (EU, for future expansion).

**Deletion request fields**:

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `id` | UUID | -- | Yes | Auto-generated | Valid UUID v4 | -- |
| `resident_id` | UUID | -- | Yes | -- | Valid resident UUID, must exist | "Resident ID is required." |
| `property_id` | UUID | -- | Yes | -- | Valid property UUID, must exist | "Property ID is required." |
| `requested_at` | timestamp with timezone | -- | Yes | `now()` | Valid timestamp | "Valid request timestamp is required." |
| `requested_by` | enum | -- | Yes | -- | One of: `resident`, `property_admin`, `super_admin` | "Requester must be one of: resident, property_admin, super_admin." |
| `status` | enum | -- | Yes | `pending` | One of: `pending`, `in_progress`, `completed`, `rejected` | "Status must be one of: pending, in_progress, completed, rejected." |
| `completed_at` | timestamp with timezone | -- | No | `null` | Must be after `requested_at` if present | "Completion time must be after request time." |
| `rejection_reason` | text | 500 chars | No | `null` | Required if status is `rejected`; max 500 chars | "Rejection reason is required when rejecting a deletion request (max 500 characters)." |
| `fields_deleted` | JSONB | -- | No | `null` | Array of field names that were purged | "Fields deleted must be a valid JSON array." |
| `audit_note` | text | 1000 chars | No | `null` | Max length: 1000 | "Audit note must not exceed 1000 characters." |

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

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `id` | UUID | -- | Yes | Auto-generated | Valid UUID v4 | -- |
| `resident_id` | UUID | -- | Yes | -- | Valid resident UUID, must exist | "Resident ID is required." |
| `property_id` | UUID | -- | Yes | -- | Valid property UUID, must exist | "Property ID is required." |
| `requested_at` | timestamp with timezone | -- | Yes | `now()` | Valid timestamp | "Valid request timestamp is required." |
| `format` | enum | -- | Yes | `json` | One of: `json`, `csv` | "Export format must be json or csv." |
| `status` | enum | -- | Yes | `pending` | One of: `pending`, `generating`, `ready`, `downloaded`, `expired` | "Status must be one of: pending, generating, ready, downloaded, expired." |
| `download_url` | varchar | 500 chars | No | `null` | Valid URL, must be a signed/temporary URL | "Download URL must be a valid temporary URL." |
| `expires_at` | timestamp with timezone | -- | No | `null` | Must be after `requested_at` | "Expiry must be after request time." |
| `file_size_bytes` | bigint | -- | No | `null` | Min: 0 | "File size cannot be negative." |

**Export includes**: All data associated with the resident -- profile fields, event history, package history, maintenance requests, amenity bookings, notification preferences, and login history. Files (photos, documents) are included as attachments in a ZIP archive.

**Export excludes**: Data about other residents, system configuration, and internal audit logs (which are platform records, not resident data).

**Download link**: Available for 7 days after generation, then automatically deleted. Link is signed and tied to the resident's authenticated session.

---

### 13.8 Compliance Framework

Concierge is built for the Canadian market first, with architecture that supports international expansion.

#### PIPEDA (Personal Information Protection and Electronic Documents Act) -- Canada

| Requirement | How Concierge Meets It |
|-------------|----------------------|
| **Data residency** | All primary and backup data stored in Canadian data centers (Toronto and Montreal) |
| **Consent** | Residents explicitly consent to data collection during onboarding. Consent is recorded with timestamp and version. |
| **Purpose limitation** | Each data field has a documented purpose. Data is not used beyond that purpose. |
| **Right to access** | Residents can export all their data via the Data Export feature (Section 13.7) |
| **Right to deletion** | Residents can request PII deletion via the Right to Deletion process (Section 13.7) |
| **Breach notification** | Automated system notifies affected properties within 72 hours of breach detection (see below) |
| **Accountability** | Data Protection Officer (DPO) designated. Privacy Impact Assessments conducted for new features. |

#### GDPR (General Data Protection Regulation) -- EU

| Requirement | Status |
|-------------|--------|
| **Data portability** | Ready -- Data Export in machine-readable format (JSON/CSV) |
| **Right to be forgotten** | Ready -- Right to Deletion process |
| **Consent management** | Ready -- Granular consent tracking |
| **Data Protection Officer** | Ready -- DPO role defined |
| **Data Processing Agreements** | Future -- Required when expanding to EU market |

#### SOC 2 Type II

| Principle | How Concierge Meets It | Target Timeline |
|-----------|----------------------|----------------|
| **Security** | Role-based access controls (RBAC) with 12 roles, per-property isolation via RLS, AES-256 encryption at rest, TLS 1.3 in transit, application-level PII double encryption, quarterly key rotation, automated vulnerability scanning, annual penetration testing | Year 2 certification target |
| **Availability** | Geographic redundancy (Toronto primary, Montreal secondary, Calgary cold), automated failover with 30-minute RTO for regional outage, 99.9% uptime SLA, continuous health monitoring with automated alerts | Year 2 certification target |
| **Confidentiality** | Per-property encryption keys, PII tiered classification (Critical/Sensitive/Standard), access logging for all Tier 1/2 PII reads, PII stripped from application logs and AI prompts, data residency enforced in Canada | Year 2 certification target |
| **Processing integrity** | Immutable audit trail for all data modifications with before/after diffs, input validation on every field, database constraints and referential integrity, automated backup integrity verification (weekly checksum, monthly restore test) | Year 3 |
| **Privacy** | Granular consent tracking with timestamp and version, right to access (data export), right to deletion (PII erasure workflow), purpose limitation per data field, privacy impact assessments for new features, DPO role designated | Year 3 |

**SOC 2 Type II Audit Requirements**:
- **Evidence collection**: Automated collection of access logs, change logs, incident records, and configuration snapshots
- **Continuous monitoring**: Real-time dashboards for all 5 trust principles with threshold-based alerts
- **Annual audit**: Third-party auditor engagement with 90-day observation window
- **Remediation tracking**: All audit findings tracked to resolution with deadlines and owner assignment

#### ISO 27001 -- Information Security Management System (ISMS)

| Control Area | How Concierge Meets It |
|-------------|----------------------|
| **Risk assessment** | Formal risk register maintained. Each module has documented threats, vulnerabilities, and mitigations. Risk assessment reviewed quarterly and after any security incident. |
| **Security policies** | Written policies for: access control, encryption, backup, incident response, acceptable use, change management, vendor management. Reviewed annually. All staff must acknowledge. |
| **Asset inventory** | All data assets classified by sensitivity tier (Critical/Sensitive/Standard). Infrastructure assets tracked in configuration management database. Software dependencies scanned every build. |
| **Access control** | Least-privilege principle enforced via RBAC. 12 predefined roles with granular permissions. Custom roles supported. Access reviews conducted quarterly. Inactive accounts auto-disabled after 90 days. |
| **Cryptography** | AES-256 at rest, TLS 1.3 in transit. Per-property encryption keys. Key lifecycle management via cloud KMS. Quarterly key rotation. Certificate monitoring with 30-day expiry alerts. |
| **Physical security** | Cloud provider (Canadian data centers) handles physical security. SOC 2 / ISO 27001 certification required from cloud provider. Data center access audited. |
| **Operations security** | Change management process for all production deployments. Separation of development, staging, and production environments. Malware protection via container scanning and dependency auditing. |
| **Communications security** | All API traffic encrypted. Webhook payloads signed with HMAC. Internal service-to-service communication uses mTLS. Network segmentation between tenant data stores. |
| **Supplier relationships** | All third-party vendors (AI providers, payment processor, notification services) assessed for security compliance. Vendor register maintained with contract review dates. |
| **Incident management** | P1-P4 incident classification with defined SLAs (see Section 13.9). Incident response team defined. Post-incident reviews mandatory. Lessons learned documented and tracked. |
| **Business continuity** | RPO: 1 hour, RTO: 4 hours. Geographic redundancy. Quarterly disaster recovery drills. Recovery runbook maintained. Communication templates for stakeholder notification. |
| **Compliance** | Regular internal audits against ISO 27001 controls. External audit annually. Non-conformities tracked to resolution. Regulatory changes monitored and assessed for impact. |

**Certification timeline**: Year 2 -- Gap assessment and remediation. Year 3 -- Stage 1 and Stage 2 certification audit.

#### ISO 27701 -- Privacy Information Management System (PIMS)

ISO 27701 extends ISO 27001 specifically for privacy management. It defines requirements for PII controllers and PII processors.

| Requirement | How Concierge Meets It |
|-------------|----------------------|
| **PII controller obligations** | Concierge acts as PII processor. Property management companies are PII controllers. Roles and responsibilities documented in Data Processing Agreements (DPAs) with each property. |
| **Lawful basis for processing** | Each data field has a documented processing purpose and lawful basis (consent, contract, legitimate interest). Tracked in a Record of Processing Activities (ROPA). |
| **Privacy impact assessments** | Privacy Impact Assessment (PIA) conducted before launching any new feature that handles PII. PIA template standardized. Results reviewed by DPO. |
| **Data subject rights** | Right to access: Data Export feature (Section 13.7). Right to correction: Residents and admins can update profile data. Right to deletion: Right to Deletion workflow (Section 13.7) with 30-day completion SLA. Right to restrict processing: Admin can disable specific data processing per resident. Right to data portability: JSON/CSV export in machine-readable format. |
| **Cross-border data transfers** | All data stored in Canada. No cross-border transfer by default. If future expansion requires transfer, Standard Contractual Clauses (SCCs) or adequacy decisions will be used. |
| **Privacy by design** | Privacy considerations embedded in development lifecycle. Default settings favor privacy (opt-in, not opt-out). Data minimization: only collect what is needed. Anonymization used for analytics. |
| **Breach management** | Breach notification within 72 hours (PIPEDA) or 60 days (HIPAA for health data). Breach severity assessment automated. Affected data subjects identified via access logs. |
| **Training and awareness** | All development staff complete annual privacy training. Privacy awareness included in LMS module for property staff. |

**Certification timeline**: After ISO 27001 certification -- ISO 27701 extends the same audit framework.

#### ISO 27017 -- Cloud Security Controls

ISO 27017 provides cloud-specific security guidance for multi-tenant SaaS platforms.

| Control | How Concierge Meets It |
|---------|----------------------|
| **Multi-tenant isolation** | Row-Level Security (RLS) at database level. Per-property encryption keys. API middleware validates tenant context on every request. Search indexes partitioned by property. File storage uses separate prefixes per property. |
| **Shared responsibility model** | Documented matrix showing: what the cloud provider is responsible for (physical security, network infrastructure, hypervisor), what Concierge is responsible for (application security, data encryption, access control), what the property admin is responsible for (user management, password policies, data accuracy). |
| **Virtual resource hardening** | Container images scanned for vulnerabilities before deployment. Base images updated monthly. No root access in containers. Read-only file systems where possible. Resource limits enforced (CPU, memory, storage). |
| **Cloud service customer data protection** | Customer data never leaves Canadian data centers. Data encrypted at rest and in transit. Logical deletion followed by cryptographic erasure when tenants leave. Backup data follows same geographic and encryption policies. |
| **Secure data deletion** | When a property terminates service: all live data deleted within 30 days, per-property encryption keys destroyed (rendering backup data unrecoverable), deletion confirmation provided to property admin, deletion logged in immutable audit trail. |
| **Cloud service monitoring** | Cloud infrastructure monitored 24/7 for availability, performance, and security anomalies. Super Admin dashboard shows system health, uptime, and resource utilization. |
| **Audit logging for cloud operations** | All cloud infrastructure changes logged (deployments, scaling events, configuration changes). Logs retained for 2 years. Accessible to auditors on request. |

#### ISO 9001 -- Quality Management System (QMS)

ISO 9001 ensures consistent quality in operations and continuous improvement.

| Principle | How Concierge Meets It |
|-----------|----------------------|
| **Customer focus** | Admin experience is paramount (Rule 3). UX priority hierarchy ensures the buyer always has the best experience. Feature requests tracked and prioritized. Customer satisfaction measured via in-app feedback and NPS surveys. |
| **Leadership** | Product vision and quality standards documented in RULEBOOK.md. 12 mandatory rules applied to every feature. Quality objectives reviewed quarterly. |
| **Engagement of people** | Staff training via built-in LMS module. Role-specific onboarding flows. Clear documentation for every feature. Tooltips and contextual help throughout the interface. |
| **Process approach** | Every critical operation has a documented process: property onboarding (8-step wizard), incident response (P1-P4 classification), backup verification (weekly/monthly/quarterly), resident data deletion (8-step process). |
| **Improvement** | Continuous improvement cycle (Plan-Do-Check-Act): Plan -- PRD defines requirements. Do -- Development implements. Check -- Automated testing, security scanning, backup verification. Act -- Post-incident reviews, audit findings, customer feedback drive improvements. |
| **Evidence-based decision making** | Three analytics layers per module (Operational, Performance, AI Insights). 52 report types. AI-powered anomaly detection. All decisions backed by data from dashboards and reports. |
| **Relationship management** | Vendor scorecard for third-party service providers. Integration health monitoring. Cloud provider SLA tracking. Property admin communication during incidents and maintenance. |

**Internal audits**: Quarterly self-assessment against ISO 9001 processes. Annual review of quality objectives and metrics.

#### HIPAA -- Health Insurance Portability and Accountability Act

HIPAA compliance is required because resident profiles may store Protected Health Information (PHI): medical conditions, accessibility needs, emergency medical information, allergies, and medications.

| Requirement | How Concierge Meets It |
|-------------|----------------------|
| **PHI identification** | The following fields are classified as PHI: `medical_conditions`, `accessibility_needs`, `emergency_medical_info`, `allergies`, `medications`, `hearing_impaired`, `vision_impaired`, `mobility_impaired`, `cognitive_impaired` on resident and emergency contact records. |
| **Encryption** | All PHI fields receive Tier 1 (Critical) encryption: AES-256 at database level PLUS application-level encryption before database storage. Decryption requires authenticated session with appropriate role. |
| **Minimum necessary standard** | PHI is only displayed to roles that need it: Security Guard sees accessibility flags (hearing/vision/mobility) for emergency response, but NOT full medical history. Property Admin sees all PHI for unit management. Resident sees their own PHI only. Board Members, Contractors, and other roles see NO PHI. |
| **Access controls** | PHI access requires: authenticated session, role with PHI permission, active property context, valid reason (screen/feature that legitimately needs PHI). |
| **Access logging** | Every read, write, or export of PHI is logged in `DataAccessLog` with: user ID, timestamp, IP address, field accessed, access type (read/write/export), session ID. PHI access logs retained for **6 years** (HIPAA requirement -- longer than the standard 2-year PII log retention). |
| **Business Associate Agreements (BAA)** | Required with every third party that could access PHI: Cloud hosting provider (data at rest), AI providers (if PHI were ever sent -- but our architecture strips PII/PHI before AI processing, so BAA may not be required for AI providers), Backup storage provider, Customer support tools (if agents can view resident data). BAA register maintained with renewal dates. |
| **Breach notification** | PHI breaches must be reported within **60 days** to affected individuals (stricter than PIPEDA's 72-hour requirement for the notification itself, but PIPEDA requires faster initial reporting). If breach affects 500+ individuals, must also notify HHS (U.S. Department of Health and Human Services) and media. Breach notification includes: description of breach, types of PHI involved, steps individuals should take, what Concierge is doing to investigate and mitigate. |
| **PHI in AI processing** | PHI is NEVER sent to AI providers. Before any AI API call, PHI fields are stripped and replaced with anonymized placeholders: "Resident has [MEDICAL_CONDITION]" not "Resident has diabetes." AI responses are cached without PHI. |
| **PHI in notifications** | Notifications NEVER include PHI. Emergency notifications say "Unit 302 has a medical alert on file" not "Resident in 302 has a pacemaker and is diabetic." |
| **PHI in exports** | Exporting data containing PHI requires: role with PHI export permission, confirmation dialog: "This export contains sensitive health information. Proceed?", export event logged with all PHI field names included in the log. |
| **PHI disposal** | When a resident moves out: PHI is archived encrypted for the retention period (configurable, default 7 years for HIPAA). After retention: PHI fields replaced with `[DELETED]`, encryption key for those records destroyed. Disposal logged in audit trail. |
| **Training** | All staff with PHI access must complete HIPAA awareness training via the LMS module. Training completion tracked. Annual recertification required. |
| **Risk analysis** | Annual HIPAA risk analysis covering: administrative safeguards (policies, training, access management), physical safeguards (cloud provider's responsibility, verified via their SOC 2/ISO 27001), technical safeguards (encryption, access controls, audit logs, transmission security). |

**HIPAA compliance note**: While HIPAA is a U.S. regulation, Concierge implements these controls because: (1) Canadian buildings may have U.S. residents whose health data is protected, (2) future U.S. market expansion requires readiness, (3) HIPAA standards represent best-in-class PHI protection that exceeds PIPEDA requirements for health data.

#### Security Testing

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Automated vulnerability scanning | Weekly | All public-facing endpoints, dependencies, container images |
| Automated penetration testing | Quarterly | OWASP Top 10 attacks against API and web application |
| Manual penetration testing | Annually | Full-scope engagement by third-party security firm |
| Security audit | Annually | Code review, architecture review, access controls, encryption verification |
| Dependency scanning | Every build | Check all packages for known CVEs; block deployment if critical/high CVE found |

#### Breach Notification System

When a data breach is detected (or suspected), the system follows this automated process:

| Step | Action | Timing |
|------|--------|--------|
| 1 | Security team creates a `BreachIncident` record | Immediately upon detection |
| 2 | Affected properties identified automatically (from data access logs) | Within 1 hour |
| 3 | Super Admin notified via SMS + email + push | Within 1 hour |
| 4 | Affected Property Admins notified via email + push | Within 24 hours |
| 5 | Affected residents notified via email (if PII was exposed) | Within 72 hours |
| 6 | Privacy Commissioner of Canada notified (if breach meets PIPEDA threshold) | Within 72 hours |
| 7 | Incident resolved and resolution documented | As soon as possible |

#### Breach Incident Fields

| Field | Data Type | Max Length | Required | Default | Validation | Error Message |
|-------|-----------|-----------|----------|---------|------------|---------------|
| `id` | UUID | -- | Yes | Auto-generated | Valid UUID v4 | -- |
| `detected_at` | timestamp with timezone | -- | Yes | `now()` | Valid timestamp | "Detection timestamp is required." |
| `severity` | enum | -- | Yes | -- | One of: `low`, `medium`, `high`, `critical` | "Severity must be one of: low, medium, high, critical." |
| `affected_properties` | JSONB | -- | Yes | `[]` | Array of valid property UUIDs | "Affected properties must be a valid JSON array of property IDs." |
| `affected_records_count` | integer | -- | Yes | `0` | Min: 0 | "Affected records count cannot be negative." |
| `affected_data_types` | JSONB | -- | Yes | `[]` | Array of strings (e.g., `["email", "phone", "name"]`) | "Affected data types must be a valid JSON array of field names." |
| `description` | text | 4000 chars | Yes | -- | Min length: 20, Max length: 4000 | "Description is required (20-4000 characters)." |
| `root_cause` | text | 2000 chars | No | `null` | Max length: 2000 | "Root cause must not exceed 2000 characters." |
| `notification_sent_at` | timestamp with timezone | -- | No | `null` | Must be after `detected_at` | "Notification time must be after detection time." |
| `resolved_at` | timestamp with timezone | -- | No | `null` | Must be after `detected_at` | "Resolution time must be after detection time." |
| `resolution_notes` | text | 4000 chars | No | `null` | Max length: 4000 | "Resolution notes must not exceed 4000 characters." |
| `status` | enum | -- | Yes | `detected` | One of: `detected`, `investigating`, `contained`, `resolved`, `closed` | "Status must be one of: detected, investigating, contained, resolved, closed." |
| `reported_to_commissioner` | boolean | -- | Yes | `false` | Must be true or false | "Commissioner reporting status is required." |

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

*This document is referenced by all module PRDs (02 through 19). Changes to this architecture specification must be reviewed for downstream impact.*
