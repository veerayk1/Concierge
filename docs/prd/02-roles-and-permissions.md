# 02 — Roles and Permissions

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-PRD Index

---

## 1. Overview

Concierge uses a hierarchical **Role-Based Access Control (RBAC)** system designed for the security-sensitive realities of condominium and multi-residential property management.

### Core Principles

| #   | Principle                        | Detail                                                                                                                                                  |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **No SSO, no self-registration** | Admin creates all accounts and assigns roles. This is a deliberate security decision for condo environments where physical building access is at stake. |
| 2   | **Hierarchy enforced**           | Super Admin > Property Admin > Roles. Higher tiers inherit and can override lower-tier permissions.                                                     |
| 3   | **Role-aware interfaces**        | Navigation, dashboards, and available actions adapt based on the logged-in user's role. Users never see features they cannot access.                    |
| 4   | **One role per property**        | A user holds exactly one role per property but may have different roles across properties.                                                              |
| 5   | **Immediate enforcement**        | Role changes take effect immediately. No session caching of stale permissions.                                                                          |
| 6   | **Audit everything**             | Every role assignment, change, and permission modification is logged with timestamp, actor, and before/after state.                                     |

### Access Hierarchy

```
Super Admin
  |
  +-- Property Admin
        |
        +-- Board Member
        +-- Property Manager
        |     |
        |     +-- Security Supervisor
        |     |     |
        |     |     +-- Security Guard
        |     |
        |     +-- Front Desk / Concierge
        |     +-- Maintenance Staff
        |
        +-- Resident (Owner)
        |     |
        |     +-- Family Member
        |
        +-- Resident (Tenant)
        |     |
        |     +-- Family Member
        |
        +-- Resident (Offsite Owner)
```

---

## 2. Role Definitions

### 2.1 Staff and Admin Roles

#### Super Admin

| Attribute             | Detail                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Platform owner with unrestricted access across all properties. Manages system-level configuration, AI settings, provider keys, billing, and multi-property oversight. |
| **Primary Dashboard** | System dashboard -- cross-property KPIs, platform health, AI cost monitoring, global alerts                                                                           |
| **What They See**     | Everything across every property. System Settings, AI Configuration, Provider Management, Multi-Property Analytics, User Audit Logs, Billing.                         |
| **What Is Hidden**    | Nothing. Full access to all modules, all properties, all data.                                                                                                        |
| **Typical User**      | Platform operator, SaaS company admin                                                                                                                                 |

#### Property Admin

| Attribute             | Detail                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**       | Top-level administrator for a single property. Manages all operations, user accounts, roles, settings, and property-level configuration. Cannot access system-level settings or other properties.      |
| **Primary Dashboard** | Management dashboard -- full building overview with operational KPIs, staff activity, compliance status                                                                                                |
| **What They See**     | All modules for their property: Security Console, Packages, Maintenance, Amenities, Units, Users, Announcements, Reports, Training, Community, Parking, Settings (property-level), AI feature toggles. |
| **What Is Hidden**    | System Settings, Multi-Property views, AI provider key management, billing configuration.                                                                                                              |
| **Typical User**      | Property management company owner, senior property manager                                                                                                                                             |

#### Board Member

| Attribute             | Detail                                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Condo board member with a governance-focused, read-heavy view. Access to reports, financials, building analytics, and approval workflows. Cannot perform day-to-day operational tasks. |
| **Primary Dashboard** | Governance dashboard -- financial summaries, compliance metrics, pending approvals, building health score                                                                              |
| **What They See**     | Reports (all types), Announcements, Building Analytics, Amenity usage reports, Service Request summaries, Events, Library, Surveys, Unit directory (read-only).                        |
| **What Is Hidden**    | Security Console, Package operations, User Management, Settings, Training admin, Shift Log, direct maintenance operations, individual resident data beyond their own unit.             |
| **Typical User**      | Elected board director, treasurer, board president                                                                                                                                     |

#### Property Manager

| Attribute             | Detail                                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Day-to-day operations manager. Handles maintenance, vendor assignments, staff coordination, and resident communications. Full operational access without admin-level configuration.                              |
| **Primary Dashboard** | Operations dashboard -- open requests, staff assignments, vendor compliance, upcoming inspections, announcement drafts                                                                                           |
| **What They See**     | Security Console, Packages, Maintenance (full), Amenities (configure + manage), Units & Residents, Announcements (create + send), Reports, Training (manage), Community (moderate), Parking (manage), Shift Log. |
| **What Is Hidden**    | System Settings, User Management (create/delete accounts), role assignment, payment configuration, AI provider settings.                                                                                         |
| **Typical User**      | On-site property manager, assistant property manager                                                                                                                                                             |

#### Security Supervisor

| Attribute             | Detail                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**       | Oversees the security team. Reviews security reports, accesses analytics, manages guard assignments, and handles escalations. Inherits all Security Guard capabilities plus team oversight.                  |
| **Primary Dashboard** | Security analytics dashboard -- incident trends, guard performance, patrol coverage, open escalations, shift summary                                                                                         |
| **What They See**     | Security Console (full + analytics + export), Packages, Parking (violations + visitor passes + analytics), Shift Log (all guards), Training (team progress), Key/FOB Management, Reports (security-related). |
| **What Is Hidden**    | Maintenance assignments, Amenity configuration, User Management, Settings, Financial reports, Vendor management, Announcements (create).                                                                     |
| **Typical User**      | Head of security, security team lead                                                                                                                                                                         |

#### Security Guard

| Attribute             | Detail                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**       | Front-line security personnel. Logs events, manages visitor access, handles package intake, conducts patrols, and reports incidents. Action-oriented interface with minimal reading. |
| **Primary Dashboard** | Security action dashboard -- active visitors, unreleased packages, keys out, quick-action buttons (large tap targets), recent activity log                                           |
| **What They See**     | Security Console (create + view), Packages (create + release), Parking (create visitor pass + create violation), Shift Log (own shift), Dashboard, Training (own courses).           |
| **What Is Hidden**    | Maintenance, Amenity management, Units (edit), User Management, Announcements (create), Reports, Settings, Analytics, Community moderation, Financial data.                          |
| **Typical User**      | Lobby security guard, overnight security, patrol guard                                                                                                                               |

#### Front Desk / Concierge

| Attribute             | Detail                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Primary resident-facing staff. Manages package intake and release, visitor registration, resident inquiries, and general front desk operations. Similar to Security Guard but focused on hospitality over security. |
| **Primary Dashboard** | Concierge dashboard -- unreleased packages, expected visitors, pending requests, shift notes, quick actions                                                                                                         |
| **What They See**     | Security Console (create events: visitors, parcels, notes), Packages (full lifecycle), Amenity Booking (on behalf of residents), Dashboard, Shift Log (own shift), Training (own courses), Announcements (view).    |
| **What Is Hidden**    | Maintenance (assignment), Unit editing, User Management, Reports, Settings, Analytics, Parking violations, Security analytics, Community moderation, Financial data.                                                |
| **Typical User**      | Concierge, front desk attendant, lobby receptionist                                                                                                                                                                 |

#### Maintenance Staff

| Attribute             | Detail                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Handles service requests, equipment management, and facility upkeep. Sees only maintenance-related workflows with ability to update request status, log work, and manage equipment.   |
| **Primary Dashboard** | Maintenance dashboard -- assigned requests (priority-sorted), equipment alerts, scheduled tasks, work order queue                                                                     |
| **What They See**     | Maintenance (assigned requests, update status, log work), Equipment (view + update), Dashboard (maintenance KPIs), Training (own courses), Shift Log (own entries).                   |
| **What Is Hidden**    | Security Console, Packages, Amenity configuration, Units (edit), User Management, Announcements (create), Reports (except maintenance), Settings, Community, Parking, Financial data. |
| **Typical User**      | Maintenance technician, janitor, handyperson                                                                                                                                          |

#### Superintendent

| Attribute             | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Building's on-site superintendent responsible for hands-on maintenance, building systems oversight, and facility upkeep. Distinct from Maintenance Staff by having broader authority over building systems, equipment, unit entry coordination, and direct communication with Property Manager. Has their own dedicated login and dashboard. In Canadian condo culture, the superintendent is a recognized title with specific legal obligations (e.g., Ontario RTA provisions for live-in superintendents). Using a distinct role improves admin clarity during property setup.                                                                                                         |
| **Primary Dashboard** | Superintendent command center -- assigned requests (priority-sorted), building systems status (HVAC, plumbing, electrical), equipment alerts, today's schedule, parts/supply requests pending, emergency contacts quick-access                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **What They See**     | Maintenance requests assigned to them (full lifecycle: view details, change status, log work, upload photos/notes, print work orders), Equipment they are responsible for (view, update status, flag for replacement), Unit access instructions and permission-to-enter status for units with assigned requests (read-only), Building systems status panel (HVAC, plumbing, electrical -- read-only), Emergency contacts for units they service, Their own work log and completed work history, Their assigned schedule and upcoming tasks, Parts/supply request channel to Property Manager, Training (own courses), Shift Log (own entries), Announcements (view only).                |
| **What Is Hidden**    | Financial data and reports (budgets, invoices, cost summaries), Board governance (meetings, votes, documents), Resident personal information beyond unit number and entry instructions needed for service, Admin settings and configuration, Billing and subscription management, User management (create/edit/deactivate accounts), Security Console (create/manage security events), Package operations (intake/release), Amenity configuration and booking management, Parking management and violations, Community moderation, Announcement creation/editing, Analytics dashboards beyond own work metrics, Vendor management and compliance, Report generation beyond own work log. |
| **Typical User**      | Building superintendent, building super, resident superintendent, live-in super                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### 2.2 Resident Roles

#### Resident (Owner)

| Attribute             | Detail                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Unit owner with full resident features. Can submit maintenance requests, book amenities, view packages, participate in community features, and vote in surveys. Eligible for Board Member role. |
| **Primary Dashboard** | Resident portal -- personal packages, open requests, upcoming bookings, announcements, quick actions                                                                                            |
| **What They See**     | Dashboard (personal), My Packages (own), My Requests (create + view own), Amenity Booking, Announcements, Events, Library, Classified Ads, Surveys, My Account, Emergency Contacts (own).       |
| **What Is Hidden**    | Security Console, other units' data, User Management, Reports, Settings, Staff tools, Shift Log, Training (staff), Maintenance assignment, Analytics.                                           |
| **Typical User**      | Condo unit owner living in the building                                                                                                                                                         |

#### Resident (Tenant)

| Attribute             | Detail                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**       | Renting unit occupant with standard resident features. Same as Owner minus board eligibility and certain governance features.                          |
| **Primary Dashboard** | Resident portal -- identical layout to Owner                                                                                                           |
| **What They See**     | Dashboard (personal), My Packages (own), My Requests (create + view own), Amenity Booking, Announcements, Events, Library, Classified Ads, My Account. |
| **What Is Hidden**    | Everything hidden from Owner, plus: Surveys (governance), Board meeting documents, Financial reports.                                                  |
| **Typical User**      | Renter, leaseholder                                                                                                                                    |

#### Resident (Offsite Owner)

| Attribute             | Detail                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**       | Owns the unit but does not reside there. Limited features focused on ownership responsibilities: financials, governance, announcements. Cannot book amenities (configurable per property). |
| **Primary Dashboard** | Resident portal (limited) -- announcements, building updates, governance documents                                                                                                         |
| **What They See**     | Dashboard (limited), Announcements, Library, Surveys, Events (view only), My Account.                                                                                                      |
| **What Is Hidden**    | Packages, Amenity Booking (configurable -- some properties allow), Classified Ads, Maintenance requests, Security Console, all staff tools.                                                |
| **Typical User**      | Investor who rents out their unit, snowbird owner                                                                                                                                          |

#### Family Member

| Attribute             | Detail                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**       | Associated with a unit through an Owner or Tenant. Basic access to personal and community features. Cannot create maintenance requests (must go through primary resident). |
| **Primary Dashboard** | Resident portal (basic) -- packages, announcements, bookings                                                                                                               |
| **What They See**     | Dashboard (basic), My Packages (own), Amenity Booking, Announcements, Events, Library.                                                                                     |
| **What Is Hidden**    | Maintenance requests (create), Surveys, Classified Ads (create), My Account (limited editing), all staff and admin tools.                                                  |
| **Typical User**      | Spouse, child (18+), other household member                                                                                                                                |

---

## 3. Permission Matrix

### 3.1 Security Console

| Action              | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create event        |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      | None  |  None  |     None      |  None  |
| View all events     |    Full     |      Full      |     None     |       Full       |        Full         |   View Only    | View Only |    None     |      None      | None  |  None  |     None      |  None  |
| Edit events         |    Full     |      Full      |     None     |       Full       |        Full         |    Own Only    | Own Only  |    None     |      None      | None  |  None  |     None      |  None  |
| Delete events       |    Full     |      Full      |     None     |   Configurable   |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View analytics      |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Export              |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Emergency broadcast |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.2 Packages

| Action          | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent |  Owner   |  Tenant  | Offsite Owner |  Family  |
| --------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :------: | :------: | :-----------: | :------: |
| Create (intake) |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      |   None   |   None   |     None      |   None   |
| Release         |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      |   None   |   None   |     None      |   None   |
| View all        |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      |   None   |   None   |     None      |   None   |
| View own        |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      | Own Only | Own Only |     None      | Own Only |
| Export          |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Analytics       |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Print label     |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      |   None   |   None   |     None      |   None   |

### 3.3 Maintenance

| Action             | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent |  Owner   |  Tenant  | Offsite Owner | Family |
| ------------------ | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :------: | :------: | :-----------: | :----: |
| Create request     |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      Full      | Own Only | Own Only |     None      |  None  |
| Assign vendor      |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |  None  |
| Assign staff       |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |  None  |
| Change status      |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    Full     |      Full      |   None   |   None   |     None      |  None  |
| View all requests  |    Full     |      Full      |  View Only   |       Full       |        None         |      None      |   None    |  View Only  |    Assigned    |   None   |   None   |     None      |  None  |
| View own requests  |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |  Own Only   |    Own Only    | Own Only | Own Only |     None      |  None  |
| Upload photos/docs |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    Full     |      Full      | Own Only | Own Only |     None      |  None  |
| Analytics          |    Full     |      Full      |  View Only   |       Full       |        None         |      None      |   None    |    None     |    Own Work    |   None   |   None   |     None      |  None  |
| Print work order   |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    Full     |      Full      |   None   |   None   |     None      |  None  |

### 3.4 Amenities

| Action                | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| --------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Book                  |    Full     |      Full      |     Full     |       Full       |        None         |      None      |   Full    |    None     |      None      | Full  |  Full  | Configurable  |  Full  |
| Approve booking       |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Configure amenity     |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View calendar         |    Full     |      Full      |     Full     |       Full       |        None         |      None      |   Full    |    None     |      None      | Full  |  Full  | Configurable  |  Full  |
| Cancel own booking    |    Full     |      Full      |     Full     |       Full       |        None         |      None      |   Full    |    None     |      None      | Full  |  Full  | Configurable  |  Full  |
| Cancel any booking    |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Analytics             |    Full     |      Full      |  View Only   |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Payment configuration |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.5 Units and Residents

| Action                       | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent |  Owner   |  Tenant  | Offsite Owner |  Family  |
| ---------------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :------: | :------: | :-----------: | :------: |
| View unit file               |    Full     |      Full      |  View Only   |       Full       |      View Only      |   View Only    | View Only |  View Only  |    Limited     | Own Only | Own Only |   Own Only    | Own Only |
| Edit unit                    |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Add resident                 |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Remove resident              |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| View all units               |    Full     |      Full      |  View Only   |       Full       |      View Only      |   View Only    | View Only |    None     |      None      |   None   |   None   |     None      |   None   |
| Edit front desk instructions |    Full     |      Full      |     None     |       Full       |        None         |      None      |   Full    |    None     |      None      |   None   |   None   |     None      |   None   |
| View emergency contacts      |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |    Assigned    | Own Only | Own Only |     None      |   None   |
| Manage FOBs/keys             |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |

### 3.6 User Management

| Action             | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent |  Owner   |  Tenant  | Offsite Owner |  Family  |
| ------------------ | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :------: | :------: | :-----------: | :------: |
| Create user        |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Edit user          |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Deactivate user    |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| View profile       |    Full     |      Full      |     None     |       Full       |      View Only      |   View Only    | View Only |    None     |      None      | Own Only | Own Only |   Own Only    | Own Only |
| Change role        |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| View audit log     |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |
| Send welcome email |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |   None   |

### 3.7 Announcements

| Action                   | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ------------------------ | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create                   |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Edit                     |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Delete                   |    Full     |      Full      |     None     |   Configurable   |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View                     |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | Full  |  Full  |     Full      |  Full  |
| Send emergency           |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Multi-channel distribute |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.8 Reports

| Action               | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| -------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View reports         |    Full     |      Full      |     Full     |       Full       |     Own Module      |      None      |   None    | Own Module  |    Own Work    | None  |  None  |     None      |  None  |
| Export (Excel/PDF)   |    Full     |      Full      |     Full     |       Full       |     Own Module      |      None      |   None    |    None     |    Own Work    | None  |  None  |     None      |  None  |
| Schedule reports     |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Create custom report |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| AI summaries         |    Full     |      Full      |     Full     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.9 Training / LMS

| Action             | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ------------------ | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create course      |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Edit course        |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Assign course      |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Complete course    |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | None  |  None  |     None      |  None  |
| View team progress |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View own progress  |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | None  |  None  |     None      |  None  |

### 3.10 Community (Events, Classified Ads, Marketplace)

| Action                   | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent |  Owner   |  Tenant  | Offsite Owner | Family |
| ------------------------ | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :------: | :------: | :-----------: | :----: |
| Post                     |    Full     |      Full      |     Full     |       Full       |        None         |      None      |   None    |    None     |      None      |   Full   |   Full   |     None      |  None  |
| Edit own post            |    Full     |      Full      |     Full     |       Full       |        None         |      None      |   None    |    None     |      None      |   Full   |   Full   |     None      |  None  |
| Moderate (edit/hide any) |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      |   None   |   None   |     None      |  None  |
| Delete                   |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | Own Only | Own Only |     None      |  None  |
| View                     |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      |   Full   |   Full   |     Full      |  Full  |

### 3.11 Parking

| Action                 | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ---------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create visitor pass    |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      | Full  |  Full  |     None      |  None  |
| Create violation       |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Manage permits         |    Full     |      Full      |     None     |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View analytics         |    Full     |      Full      |  View Only   |       Full       |        Full         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Configure rules/limits |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Print pass             |    Full     |      Full      |     None     |       Full       |        Full         |      Full      |   Full    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.12 Settings

| Action                 | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ---------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View settings          |    Full     |      Full      |     None     |    View Only     |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Edit settings          |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| AI configuration       |    Full     |  Configurable  |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Payment configuration  |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Role management        |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Building configuration |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.13 AI Features

| Action              | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Global AI toggle    |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Per-feature toggle  |    Full     |  Configurable  |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View cost dashboard |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Configure provider  |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Use AI features     |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | Full  |  Full  |     Full      |  Full  |

### 3.14 Dashboard and Search

| Action          | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent |  Owner   |  Tenant  | Offsite Owner |  Family  |
| --------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :------: | :------: | :-----------: | :------: |
| View dashboard  |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      |   Full   |   Full   |     Full      |   Full   |
| Global search   |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | Own Data | Own Data |   Own Data    | Own Data |
| Command palette |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      |   Full   |   Full   |     Full      |   Full   |

### 3.15 Approvals

| Action          | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| --------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View pending    |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Approve/decline |    Full     |      Full      |     None     |   Configurable   |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Batch approve   |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.16 Scheduled Reports

| Action             | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ------------------ | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create schedule    |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Edit schedule      |    Full     |      Full      |     None     |     Own Only     |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Delete schedule    |    Full     |      Full      |     None     |     Own Only     |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View all schedules |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.17 Feature Flags (Super Admin Only)

| Action                | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| --------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View flags            |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Toggle global         |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Override per property |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.18 Compliance

| Action               | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| -------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View dashboard       |    Full     |      Full      |  View Only   |    View Only     |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Generate reports     |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Grant auditor access |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Configure monitoring |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.19 Demo & Training Environments

| Action                  | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ----------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create sales demo       |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Manage sales demos      |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Create training sandbox |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Manage training sandbox |    Full     |      Full      |     None     |       Full       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Manage demo templates   |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.20 Platform Operations (Super Admin Only)

| Action                     | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| -------------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| Create property            |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Delete property            |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View system health         |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Backup & recovery          |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Cross-property user search |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Merge user accounts        |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Platform analytics         |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Revenue dashboard          |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Manage release notes       |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Support ticket escalation  |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Emergency AI shutdown      |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Event type library         |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.21 Billing & Subscription

| Action                  | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| ----------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View current plan       |    Full     |      Full      |     None     |    View Only     |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View usage meters       |    Full     |      Full      |     None     |    View Only     |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Change plan             |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Update payment method   |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View invoices           |    Full     |      Full      |  View Only   |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Download invoice PDF    |    Full     |      Full      |     Full     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Cancel subscription     |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| View revenue dashboard  |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Apply credits/discounts |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Configure plan tiers    |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

### 3.22 Help Center

| Action                | Super Admin | Property Admin | Board Member | Property Manager | Security Supervisor | Security Guard | Concierge | Maintenance | Superintendent | Owner | Tenant | Offsite Owner | Family |
| --------------------- | :---------: | :------------: | :----------: | :--------------: | :-----------------: | :------------: | :-------: | :---------: | :------------: | :---: | :----: | :-----------: | :----: |
| View help articles    |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | Full  |  Full  |     Full      |  Full  |
| Create/edit articles  |    Full     |      Full      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |
| Submit support ticket |    Full     |      Full      |     Full     |       Full       |        Full         |      Full      |   Full    |    Full     |      Full      | Full  |  Full  |     None      |  None  |
| Manage KB settings    |    Full     |      None      |     None     |       None       |        None         |      None      |   None    |    None     |      None      | None  |  None  |     None      |  None  |

---

## 4. Role Hierarchy and Inheritance

### 4.1 Inheritance Rules

Permissions flow downward through the hierarchy. A higher-tier role inherits all permissions of the roles below it in its branch, plus additional permissions specific to its tier.

| Role                       | Inherits From           | Additional Permissions                                                                                                                                                               |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Super Admin**            | All roles               | System settings, multi-property, AI provider config, billing, platform-wide analytics                                                                                                |
| **Property Admin**         | Property Manager        | User management (CRUD), role assignment, property settings, payment config, AI feature toggles                                                                                       |
| **Property Manager**       | (base staff role)       | Maintenance assignment, vendor management, announcements (CRUD), reports, amenity config, community moderation                                                                       |
| **Security Supervisor**    | Security Guard          | Security analytics, team performance, export, shift log (all guards), escalation management, report access                                                                           |
| **Security Guard**         | (base security role)    | Event creation, package intake/release, visitor passes, parking violations, key checkout                                                                                             |
| **Front Desk / Concierge** | (base front desk role)  | Package full lifecycle, visitor registration, amenity booking (on behalf), front desk instructions edit                                                                              |
| **Maintenance Staff**      | (base maintenance role) | Work order updates, equipment management, own shift entries                                                                                                                          |
| **Superintendent**         | Maintenance Staff       | Building systems status, unit entry instructions (assigned units), emergency contacts (assigned units), parts/supply requests to PM, create maintenance requests, own work analytics |
| **Board Member**           | (independent branch)    | Reports, governance docs, building analytics, survey access, approval workflows                                                                                                      |

### 4.2 Inheritance Constraints

- Inheritance is **additive only** -- a higher role cannot have fewer permissions than a lower role in its branch.
- **Cross-branch permissions do not inherit.** A Security Supervisor does not gain Maintenance Staff permissions, and vice versa.
- **Resident roles do not inherit from staff roles.** These are entirely separate branches.
- Board Member is an **independent branch** -- it does not inherit from any staff role, and staff roles do not inherit from it.

---

## 5. Custom Roles

### 5.1 Overview

Property Admins can create custom roles to accommodate unique property needs (e.g., "Night Security," "Pool Attendant," "Resident Manager").

### 5.2 Creation Process

1. Property Admin navigates to Settings > Roles.
2. Selects "Create Custom Role" or clones an existing role.
3. Provides: Role Name, Description, Role Type (staff/resident).
4. Adjusts permissions via a checkbox matrix organized by module and action.
5. Saves. The new role becomes available for assignment immediately.

### 5.3 Custom Role Rules

| Rule                        | Detail                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Clone and modify**        | Custom roles are always based on an existing role template. Start from the closest match and adjust. |
| **Cannot exceed creator**   | A Property Admin cannot create a custom role with permissions exceeding their own.                   |
| **Maximum 20 per property** | Prevents permission sprawl.                                                                          |
| **Naming constraints**      | Must be unique within the property. Cannot reuse built-in role names. 3-50 characters.               |
| **Deletable**               | Custom roles can be deleted if no users are currently assigned. Users must be reassigned first.      |
| **No hierarchy override**   | Custom roles cannot be inserted into the built-in hierarchy. They exist as leaf nodes.               |

### 5.4 Custom Role Builder UI

```
+--------------------------------------------------+
|  Create Custom Role                               |
|                                                   |
|  Name: [_______________________]                  |
|  Based on: [Security Guard     v]                 |
|  Description: [____________________________]      |
|                                                   |
|  PERMISSIONS                                      |
|  +----------------------------------------------+|
|  | Module          | View | Create | Edit | Del ||
|  |-----------------|------|--------|------|-----||
|  | Security Console|  [x] |  [x]   | [x]  | [ ]||
|  | Packages        |  [x] |  [x]   | [ ]  | [ ]||
|  | Maintenance     |  [ ] |  [ ]   | [ ]  | [ ]||
|  | Amenities       |  [x] |  [ ]   | [ ]  | [ ]||
|  | ...             |      |        |      |     ||
|  +----------------------------------------------+|
|                                                   |
|  [Cancel]                          [Create Role]  |
+--------------------------------------------------+
```

---

## 6. Role Assignment Rules

| Rule                           | Detail                                                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **One role per property**      | A user holds exactly one role per property. No multi-role stacking within a single property.                                        |
| **Multi-property, multi-role** | A user can have different roles at different properties (e.g., Owner at Property A, Board Member at Property B).                    |
| **Immediate effect**           | Role changes invalidate the user's current session. On next request, the new role's permissions apply. No stale permission caching. |
| **Audit trail**                | Every role change is logged: who changed it, from what role, to what role, timestamp, IP address.                                   |
| **Downgrade protection**       | When a user is downgraded (e.g., Property Manager to Resident), a confirmation dialog warns about lost access.                      |
| **Self-demotion prevention**   | A Property Admin cannot remove their own admin role. Another Property Admin or Super Admin must do it.                              |
| **Last admin protection**      | The system prevents removing the last Property Admin from a property. At least one admin must exist at all times.                   |
| **Bulk assignment**            | Property Admin can assign roles in bulk (e.g., import 50 residents via CSV with role assignment).                                   |

---

## 7. Navigation Visibility Per Role

The sidebar adapts to show only relevant items. Items not listed for a role are completely invisible (not greyed out, not disabled -- absent).

### 7.1 Super Admin

| Section        | Items                                                            |
| -------------- | ---------------------------------------------------------------- |
| **SYSTEM**     | Multi-Property Dashboard, Platform Health, AI Dashboard, Billing |
| **OVERVIEW**   | Dashboard, Units & Residents, Amenities                          |
| **OPERATIONS** | Security Console, Packages, Service Requests, Announcements      |
| **COMMUNITY**  | Events, Marketplace, Library, Surveys                            |
| **MANAGEMENT** | Reports, User Management, Training, Logs, Settings               |

### 7.2 Property Admin

| Section        | Items                                                       |
| -------------- | ----------------------------------------------------------- |
| **OVERVIEW**   | Dashboard, Units & Residents, Amenities                     |
| **OPERATIONS** | Security Console, Packages, Service Requests, Announcements |
| **COMMUNITY**  | Events, Marketplace, Library, Surveys                       |
| **MANAGEMENT** | Reports, User Management, Training, Logs, Settings          |

### 7.3 Board Member

| Section         | Items                                   |
| --------------- | --------------------------------------- |
| **OVERVIEW**    | Dashboard, Amenities                    |
| **INFORMATION** | Announcements, Events, Library, Surveys |
| **GOVERNANCE**  | Reports, Building Analytics             |

### 7.4 Property Manager

| Section        | Items                                                       |
| -------------- | ----------------------------------------------------------- |
| **OVERVIEW**   | Dashboard, Units & Residents, Amenities                     |
| **OPERATIONS** | Security Console, Packages, Service Requests, Announcements |
| **COMMUNITY**  | Events, Marketplace, Library, Surveys                       |
| **MANAGEMENT** | Reports, Training, Logs                                     |

### 7.5 Security Supervisor

| Section        | Items                                          |
| -------------- | ---------------------------------------------- |
| **OVERVIEW**   | Dashboard                                      |
| **OPERATIONS** | Security Console, Packages, Parking            |
| **MANAGEMENT** | Reports (security), Training (team), Shift Log |

### 7.6 Security Guard

| Section        | Items                               |
| -------------- | ----------------------------------- |
| **OVERVIEW**   | Dashboard                           |
| **OPERATIONS** | Security Console, Packages, Parking |
| **DAILY**      | Shift Log, Training                 |

### 7.7 Front Desk / Concierge

| Section        | Items                                     |
| -------------- | ----------------------------------------- |
| **OVERVIEW**   | Dashboard                                 |
| **OPERATIONS** | Security Console, Packages                |
| **DAILY**      | Shift Log, Training, Announcements (view) |

### 7.8 Maintenance Staff

| Section        | Items                       |
| -------------- | --------------------------- |
| **OVERVIEW**   | Dashboard                   |
| **OPERATIONS** | Service Requests (assigned) |
| **DAILY**      | Shift Log, Training         |

### 7.9 Superintendent

| Section        | Items                                                       |
| -------------- | ----------------------------------------------------------- |
| **OVERVIEW**   | Dashboard                                                   |
| **OPERATIONS** | Service Requests (assigned + own created), Building Systems |
| **RESOURCES**  | Equipment, Parts & Supplies                                 |
| **DAILY**      | My Schedule, Shift Log, Training, Announcements (view)      |

### 7.10 Resident (Owner)

| Section      | Items                                                |
| ------------ | ---------------------------------------------------- |
| **HOME**     | Dashboard                                            |
| **MY UNIT**  | My Packages, My Requests, Amenity Booking            |
| **BUILDING** | Announcements, Events, Marketplace, Library, Surveys |
| **ACCOUNT**  | My Account                                           |

### 7.11 Resident (Tenant)

| Section      | Items                                       |
| ------------ | ------------------------------------------- |
| **HOME**     | Dashboard                                   |
| **MY UNIT**  | My Packages, My Requests, Amenity Booking   |
| **BUILDING** | Announcements, Events, Marketplace, Library |
| **ACCOUNT**  | My Account                                  |

### 7.12 Resident (Offsite Owner)

| Section      | Items                                          |
| ------------ | ---------------------------------------------- |
| **HOME**     | Dashboard                                      |
| **BUILDING** | Announcements, Events (view), Library, Surveys |
| **ACCOUNT**  | My Account                                     |

### 7.13 Family Member

| Section      | Items                          |
| ------------ | ------------------------------ |
| **HOME**     | Dashboard                      |
| **MY UNIT**  | My Packages, Amenity Booking   |
| **BUILDING** | Announcements, Events, Library |
| **ACCOUNT**  | My Account                     |

---

## 8. Role-Based Dashboard Layouts

Each role sees a different dashboard layout optimized for their workflow.

| Role                    | Dashboard Type            | KPI Cards                                                                                 | Quick Actions                                          | Activity Feed                          |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| **Super Admin**         | System overview           | Platform health, total properties, AI spend, active users                                 | Switch property, View alerts, AI config                | Cross-property alerts                  |
| **Property Admin**      | Management overview       | Open requests, unreleased packages, active visitors, bookings, resident count             | Create user, Send announcement, View reports           | All building activity                  |
| **Board Member**        | Governance overview       | Financial summary, compliance %, pending approvals, satisfaction score                    | View reports, Upcoming meetings                        | Governance-relevant items              |
| **Property Manager**    | Operations command center | Open requests, unreleased packages, active visitors, bookings                             | Create announcement, Assign request, View reports      | Staff activity, requests, packages     |
| **Security Supervisor** | Security analytics        | Incident count, guard coverage, open escalations, patrol status                           | View reports, Manage shifts, Review incidents          | Security events (all guards)           |
| **Security Guard**      | Action-oriented           | Active visitors, unreleased packages, keys out                                            | + Visitor, + Package, + Incident, + Key                | Recent activity log (own shift)        |
| **Concierge**           | Front desk hub            | Unreleased packages, expected visitors, pending items                                     | + Package, + Visitor, + Note                           | Recent front desk activity             |
| **Maintenance**         | Work queue                | Assigned requests (by priority), equipment alerts, scheduled tasks                        | Update request, Log work, View schedule                | Assigned work orders                   |
| **Superintendent**      | Superintendent command    | Assigned requests (priority), building systems status, equipment alerts, today's schedule | Update request, Log work, Request parts, View schedule | Assigned work, building systems alerts |
| **Resident (Owner)**    | Personal portal           | My packages, open requests, upcoming bookings                                             | Book amenity, Submit request, View directory           | Personal notifications                 |
| **Resident (Tenant)**   | Personal portal           | My packages, open requests, upcoming bookings                                             | Book amenity, Submit request                           | Personal notifications                 |
| **Offsite Owner**       | Limited portal            | Announcements count, upcoming events                                                      | View announcements, View library                       | Building updates                       |
| **Family Member**       | Basic portal              | My packages, upcoming bookings                                                            | Book amenity                                           | Personal notifications                 |

---

## 9. Session and Authentication

| Aspect                        | Detail                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication method**     | Email + password (admin-created accounts). No SSO, no self-registration, no social login.                                           |
| **Password requirements**     | Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character. Displayed inline during creation.   |
| **Session duration**          | 8 hours for staff roles, 30 days for resident roles (with "Remember me").                                                           |
| **Multi-device**              | Users can be logged in on multiple devices simultaneously.                                                                          |
| **Session invalidation**      | Role changes, password changes, and admin deactivation immediately invalidate all active sessions.                                  |
| **Login audit trail**         | Every login recorded: timestamp, IP address, device/browser, success/failure status. Visible to the user (last 10) and admin (all). |
| **Two-factor authentication** | Optional for all roles. Enforced by Property Admin for specific roles (recommended for all staff roles).                            |
| **Failed login lockout**      | 5 failed attempts triggers a 15-minute lockout. Admin can unlock manually.                                                          |
| **Welcome email**             | Configurable template sent on account creation with temporary password and login instructions.                                      |

---

## 10. Data Isolation

| Rule                           | Detail                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Property isolation**         | Users can only access data for properties they are assigned to. No cross-property data leakage.                                                                  |
| **Unit isolation (residents)** | Residents can only see their own unit's data: packages, requests, bookings, contacts.                                                                            |
| **Unit visibility (staff)**    | Staff roles see unit data based on their permission level (View Only vs Full). Security/Concierge see unit instructions and emergency contacts.                  |
| **Search scope**               | Global search respects role permissions. A resident searching "Unit 1205" sees only their own unit (if 1205) or nothing. Staff see based on their module access. |
| **Report filtering**           | Reports auto-filter to the user's data scope. Board Members see aggregate data. Residents see only own activity.                                                 |
| **API enforcement**            | Permissions are enforced at the API level, not just the UI. Removing a sidebar item is not sufficient -- the backend rejects unauthorized requests.              |

---

## Demo & Training Permissions

### Demo Role Switcher

In `DEMO` property environments, any authenticated user can preview the platform as any role via a "View as [Role]" dropdown in the top navigation bar.

| Aspect               | Detail                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**          | Dropdown in the top bar, visible only when `property_type = DEMO`                                                                                                                                                                                                                                                                                   |
| **Options**          | All 13 built-in roles: Super Admin, Property Admin, Board Member, Property Manager, Security Supervisor, Security Guard, Front Desk / Concierge, Maintenance Staff, Superintendent, Resident (Owner), Resident (Tenant), Offsite Owner, Family Member                                                                                               |
| **Behavior**         | Switching the dropdown changes the **UI rendering context only**. The sidebar, dashboard, available actions, and data visibility all update to reflect the selected role.                                                                                                                                                                           |
| **Does NOT change**  | The user's actual role in the database. The user's session token. The user's audit trail identity. API permissions remain bound to the user's real role -- the switcher applies a client-side rendering override with a server-side "view-as" parameter that adjusts response shapes but does not grant write access beyond the user's actual role. |
| **Visual indicator** | A persistent banner at the top of the page: "You are viewing as [Role Name]. Your actual role is [Real Role]." with a "Reset" button.                                                                                                                                                                                                               |
| **Audit**            | Role switcher usage is logged: who, when, which role they viewed as.                                                                                                                                                                                                                                                                                |

### Training Sandbox Role

When a user is assigned to a `TRAINING` property, their role assignment works identically to production, with one behavioral modification:

| Aspect                      | Detail                                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Role assignment**         | The trainee receives the exact role they are training for (e.g., Security Guard, Front Desk / Concierge). They see the same interface, same actions, same workflows.                                                        |
| **Training flag**           | The `UserProperty` junction table includes a `training` boolean flag (default: `false`). When `true`, all external side effects are suppressed.                                                                             |
| **Suppressed side effects** | Email delivery, SMS delivery, push notifications, webhook triggers, payment processing, and any external API calls. These actions are logged internally (visible in the training audit trail) but never leave the platform. |
| **Training analytics**      | Actions taken by training-flagged users are tracked separately and feed into the Training/LMS module (PRD 12) for progress and competency assessment.                                                                       |
| **Graduation**              | When the trainee completes their training, the admin assigns them to a `PRODUCTION` property with the same role. The training flag is not transferred -- it exists only on the training property assignment.                |

### API Key Permissions

API keys created through the API Key Management interface (PRD 16, Tab 14) follow these permission rules:

| Aspect                            | Detail                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Inheritance**                   | By default, an API key inherits the full permission set of the user who created it. If a Property Admin creates an API key, that key has Property Admin-level access.                                                          |
| **Scoping**                       | The creating user can optionally restrict the key to specific modules with specific access levels. Scoping is per-module: `read` or `read-write`.                                                                              |
| **Available modules for scoping** | Security Console, Packages, Maintenance, Amenities, Units, Users, Announcements, Reports, Training, Community, Parking                                                                                                         |
| **Cannot exceed creator**         | An API key can never have more permissions than the user who created it. A Property Manager cannot create a key with Property Admin access.                                                                                    |
| **Rotation**                      | API keys have an optional expiry date. Expired keys return `401 Unauthorized`. Keys can be rotated (new key generated, old key revoked) with a configurable grace period (default: 24 hours where both old and new keys work). |
| **Audit**                         | Every API call made with a key is logged with the key ID, endpoint, method, timestamp, and response status.                                                                                                                    |

### Multi-Property Role Model

A single user account can hold different roles across different properties. This is a core multi-tenancy capability.

| Aspect                    | Detail                                                                                                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Junction table**        | `UserProperty` stores the relationship: `user_id`, `property_id`, `role_id`, `training` (boolean), `assigned_at`, `assigned_by`.                                                                                                        |
| **Example**               | User "Jane Smith" can be a Property Manager at Property A, a Front Desk / Concierge at Property B, and a Resident (Owner) at Property C. Each assignment is an independent row in `UserProperty`.                                       |
| **Property switcher**     | Users with multiple property assignments see a property switcher in the top navigation bar. Switching properties changes the active property context, reloads the sidebar for the new role, and redirects to the appropriate dashboard. |
| **Session scope**         | At any given moment, a user's session is scoped to one property. The active property is stored in the session. All API calls are scoped to the active property.                                                                         |
| **Role change isolation** | Changing a user's role at Property A has zero effect on their role at Property B. Role changes are per-property.                                                                                                                        |
| **Deactivation scope**    | A user can be deactivated at one property while remaining active at others. Full account deactivation (across all properties) is a separate Super Admin action.                                                                         |

---

## ADDENDUM: Gap Analysis Fixes (2026-03-17)

> Added from GAP-ANALYSIS-FINAL.md gap 2.1

### A1. Superintendent Role (Gap 2.1, High) -- RESOLVED

**Resolution**: Option A implemented. Superintendent added as the 13th built-in role with full role definition (Section 2.1), complete permission matrix across all 22 modules (Section 3), navigation visibility (Section 7.9), dashboard layout (Section 8), and inheritance rules (Section 4.1). The Superintendent inherits from Maintenance Staff with additional permissions for building systems status, unit entry instructions, emergency contacts, parts/supply requests, and own work analytics. See also PRD 05 (Maintenance) for the Superintendent-specific workflow.

### A2. Security Officer Role Designation (Gap M9, Medium — ISO 27001 A.5.2)

**Purpose**: ISO 27001 Annex A Control A.5.2 requires that information security roles and responsibilities are defined and allocated. The platform must support designating a "Security Officer" — the person responsible for information security policy oversight at the property level.

**Implementation**: This is NOT a new role in the RBAC system. It is a **tag/designation** applied to an existing user who holds an Admin-tier role (Property Admin, Super Admin, or Property Manager).

#### Security Officer Tag

| Aspect                     | Specification                                                        |
| -------------------------- | -------------------------------------------------------------------- |
| **Who can be tagged**      | Any user with role: Property Admin, Super Admin, or Property Manager |
| **Who can assign the tag** | Super Admin or Property Admin                                        |
| **Maximum per property**   | 1 primary Security Officer, 1 backup Security Officer                |
| **Where it is configured** | Settings > Compliance > Security Officer Designation                 |

#### Configuration Screen

| Field                    | Type                                         | Required       | Description                              |
| ------------------------ | -------------------------------------------- | -------------- | ---------------------------------------- |
| Primary Security Officer | user dropdown (filtered to Admin-tier roles) | Yes            | The designated information security lead |
| Backup Security Officer  | user dropdown (filtered to Admin-tier roles) | No             | Covers when primary is unavailable       |
| Designation Date         | date                                         | Auto-populated | When the assignment was made             |
| Designated By            | user                                         | Auto-populated | Who made the assignment                  |

#### What the Security Officer Tag Enables

1. **Compliance Dashboard Access**: Security Officer automatically gets access to the full Compliance Dashboard (PRD 28) even if their base role would not normally include it.
2. **Breach Notification Routing**: Security Officer is automatically included in all breach notification chains (in addition to Super Admin).
3. **Security Anomaly Alerts**: Security Officer receives all Critical and High severity anomaly alerts (PRD 28, Section 4.6).
4. **Audit Log Access**: Security Officer can view the full Audit Log (Settings > Audit Log) regardless of base role restrictions.
5. **Compliance Action Items**: Security Officer is the default assignee for security-related compliance action items.
6. **Annual Review Reminder**: System sends an annual reminder to Property Admin to confirm or update the Security Officer designation.

#### Data Model Addition

Add to the `PropertySettings` model (PRD 16, Section 4.1):

```
├── security_officer_id → User (FK, nullable)
├── backup_security_officer_id → User (FK, nullable)
├── security_officer_designated_at (timestamp with tz, nullable)
├── security_officer_designated_by → User (FK, nullable)
```

#### Validation

- If the designated user's role is downgraded below Admin-tier, the system removes the Security Officer tag and notifies Super Admin: "Security Officer designation removed for [Name] because their role was changed to [New Role]. Please designate a new Security Officer."
- If the designated user is deactivated, same notification is sent.

---

## 8. Edge Cases

### 8.1 Role Lifecycle Conflicts

| Scenario                                                      | Behavior                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role deleted while users hold it                              | Not possible. Roles cannot be deleted, only deactivated. Deactivated roles remain assigned to existing users but cannot be assigned to new users. To remove users from a deactivated role, the admin must reassign each user individually.                                                                                                                                       |
| Concurrent role changes by two admins                         | Last-write-wins. If Admin A and Admin B both modify the "Security Guard" role permissions simultaneously, the last save overwrites the first. A version number is incremented on each save. If a conflict is detected (version mismatch), the saving admin sees: "This role was modified by another admin since you started editing. Reload to see their changes before saving." |
| Role assigned to a deactivated user                           | Blocked. Error: "Cannot assign role to a deactivated user. Reactivate the user first."                                                                                                                                                                                                                                                                                           |
| User's only role removed                                      | Blocked. Every user must have exactly one role per property. The admin must assign a new role before removing the current one. Error: "Users must have exactly one role. Assign a new role before removing the current one."                                                                                                                                                     |
| Super Admin role reassignment                                 | The Super Admin role cannot be removed from the last remaining Super Admin. Error: "At least one Super Admin must exist. Assign another user as Super Admin before removing this assignment."                                                                                                                                                                                    |
| Role permissions changed while user is logged in              | New permissions take effect on the user's next API request. The user does not need to log out and back in. If a permission is revoked, any in-progress action that requires that permission fails gracefully with a 403 response and the message: "Your permissions have been updated. You no longer have access to this action."                                                |
| Property Admin demoted while onboarding wizard is in progress | The wizard becomes inaccessible. On next login, the user sees their new role's dashboard. If another Property Admin exists, they can resume the wizard. If no Property Admin exists, Super Admin must assign one.                                                                                                                                                                |

---

## 9. Completeness Checklist

### Permission Coverage

| #   | Requirement                                                    | Status  | Section |
| --- | -------------------------------------------------------------- | ------- | ------- |
| 1   | Hierarchical RBAC: Super Admin > Property Admin > Roles        | Covered | 3.1     |
| 2   | One role per user per property                                 | Covered | 3.2     |
| 3   | No SSO, no self-registration (deliberate security decision)    | Covered | 2       |
| 4   | Admin creates accounts and assigns roles                       | Covered | 3.3     |
| 5   | Permission matrix for all 13 built-in roles across all modules | Covered | 4.1     |
| 6   | Denial behavior for every permission (invisible, not disabled) | Covered | 4.2     |
| 7   | Role-aware navigation (only show accessible menu items)        | Covered | 4.3     |
| 8   | Immediate enforcement on role change                           | Covered | 5.1     |
| 9   | Security Officer designation with tag system                   | Covered | 7.3     |
| 10  | Auditor role with time-bounded access                          | Covered | 7.2     |

### UX Coverage

| #   | Requirement                             | Status  | Section |
| --- | --------------------------------------- | ------- | ------- |
| 1   | Role management admin UI                | Covered | 6.1     |
| 2   | Permission matrix display (visual grid) | Covered | 6.2     |
| 3   | Role assignment workflow                | Covered | 6.3     |
| 4   | Unauthorized access message (403)       | Covered | 4.2     |
| 5   | Role indicator in user profile          | Covered | 6.4     |

### Edge Case Coverage

| #   | Requirement                             | Status  | Section |
| --- | --------------------------------------- | ------- | ------- |
| 1   | Role deleted while users hold it        | Covered | 8.1     |
| 2   | Concurrent role changes                 | Covered | 8.1     |
| 3   | Role assigned to deactivated user       | Covered | 8.1     |
| 4   | Last Super Admin removal prevention     | Covered | 8.1     |
| 5   | Permission change during active session | Covered | 8.1     |

---

_End of document._
