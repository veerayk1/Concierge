# Deep Dive: Settings Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/settings` and `/edit-building/92`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL (read-only view)**: `/settings`
**URL (edit form)**: `/edit-building/{building_id}` (e.g., `/edit-building/92`)
**Page title**: No visible title — tabs serve as navigation
**Sidebar label**: Not in sidebar — accessed from top nav or other pages

### Page Layout
1. **Building ID**: "92" displayed in top left
2. **Action button**: "Go to Building Setup" (outlined blue) — navigates to edit form
3. **Tab navigation**: 8 tabs with icons
4. **Content area**: Tab-specific content (read-only on `/settings`, editable on `/edit-building`)

### Settings Tabs (8 tabs)
| # | Tab | Icon | Purpose |
|---|-----|------|---------|
| 1 | General | 🏢 Building icon | Building info, email settings, contacts |
| 2 | Parking | 🚗 Car icon | Visitor parking rules and limits |
| 3 | Login | 🔑 Key icon | Welcome email configuration |
| 4 | Payment | 💳 Card icon | Online payment settings (Stripe) |
| 5 | Amenity | 👥 People icon | List of amenities with availability check |
| 6 | Groups | 👥 Group icon | User group/role management |
| 7 | Keys | 🔑 Key icon | Physical key tracking |
| 8 | Contractors | 👤 Person icon | Contractor directory management |

---

## 2. General Tab

### 2.1 General Settings (Building Information)
| Field | Value | Type |
|-------|-------|------|
| Management Name | IconConnect | Text (read-only) |
| Building Name | Bond | Text |
| Welcome Message | (Long HTML description of the building) | HTML/Rich text |
| Address | 290 Adelaide St., | Text |
| City | Toronto, ON | Text |
| Description | TSCC 2584 | Text |
| Postal Code | M5V0P3 | Text |
| Corp Number | TSCC 2584 | Text |

### 2.2 Default Email Settings (From Addresses)
| Purpose | Value | Notes |
|---------|-------|-------|
| For General Notifications | no-reply@iconconnect.ca | Bulletins, Visitor Parking, Parking Violations, Security Logs, New Shift, Bulk logs |
| For Event Log Notifications | no-reply@iconconnect.ca | When new events are created |
| For Front Desk Instructions Notifications | no-reply@iconconnect.ca | Package-related emails |
| For Maintenance Requests Notifications | no-reply@iconconnect.ca | Service Requests |
| For Amenity Reservations Notifications | no-reply@iconconnect.ca | New bookings and cancellations |
| Building "from" Email | no-reply@iconconnect.ca | Any other email type not covered above |

### 2.3 Auto-CC Email Settings (Per Log Type)
| Log Type | CC Recipients |
|----------|---------------|
| For General Log | bondconcierge@royalcas.ca, melissa@iconpm, wayne@iconpm.ca, arbi@iconpm.ca |
| For Incident Log | bondconcierge@royalcas.ca, melissa@iconpm, wayne@iconpm.ca, arbi@iconpm.ca |
| For Fire Log | (same pattern) |
| For Noise Log | bondconcierge@royalcas.ca, melissa@icompm.ca, wayne@iconpm.ca, arbi@iconpm.ca |

**Key insight**: Each log type has independently configurable CC email addresses. This allows different stakeholders to be notified for different event types.

### 2.4 Contacts
| Field | Value |
|-------|-------|
| Desk Email | bondconcierge@royalcas.ca |
| Management Office Email | wayne@iconpm.ca |
| Property Manager Email | wayne@iconpm.ca |
| Assistant Manager Email | (empty) |

**Contact 1:**
| Field | Value |
|-------|-------|
| Name | Wayne Sauder |
| Email | wayne@iconpm.ca |
| Phone | 416-551-4590 |
| Designation | Property Manager |

**Contact 2:**
| Field | Value |
|-------|-------|
| Name | Arbi Agastra |
| Email | arbi@iconpm.ca |
| Phone | 416-551-4590 |
| Designation | Property Administrator |

**Contact 3:**
| Field | Value |
|-------|-------|
| Name | Concierge Desk |
| Email | bondconcierge@royalcas.ca |
| Phone | 416-551-8309 |
| Designation | Concierge Desk |

**Security Company**: Royal Concierge and Security Inc
**Security Logo**: (Not set)

### 2.5 Other Settings (Feature Toggles)
| Setting | Value | Type |
|---------|-------|------|
| Allow in-person payments for this building? | Yes | Boolean |
| Allow editing locker info for this building | Yes | Boolean |
| Prevent offsite owners from booking facilities | No | Boolean |
| Enable maintenance tickets for this building | Yes | Boolean |
| Prevent non-staff from creating facility bookings | No | Boolean |
| Auto allow suite entry | (empty) | Boolean |
| Allow offsite owners in Packages? | (toggle) | Boolean |
| Send Email to residents notifying them of Package Release | (toggle) | Boolean |
| Show description Column in general logs table | (toggle) | Boolean |
| Do you want people to be able to order status certificates? | (toggle) | Boolean |
| Do you want to enable discussion forum? | (toggle) | Boolean |

---

## 3. Parking Tab

### Parking Settings
| Field | Value | Notes |
|-------|-------|-------|
| Parking Introduction | "Please note printed pass MUST be displayed on vehicle dashboard. You can print on the next page." | Displayed to users |
| Overnight limit per plate per week | 0 | 0 = unlimited |
| Overnight limit per unit per week | 0 | |
| Overnight limit per plate per month | 0 | |
| Overnight limit per unit per month | 0 | |
| Overnight limit per plate per year | 0 | |
| Overnight limit per unit per year | 0 | |
| Consecutive limit | 0 | Max consecutive days |
| Day visit limit per unit | 0 | |
| Day visit limit per plate | 0 | |
| Allow self serve for visitor parking | No | Residents can't self-register visitor parking |
| Allow residents to enter multi day passes | No | |
| Send email notice for this building | No | |
| Allow day visits for this building | Yes | |
| Restrict visitor parking editing | No | |
| Allow printing of parking passes | Yes | |
| In how many days should the advertisements expire | (configurable) | Ad expiry control |

### Parking Notification Settings (Per Role)
| Role | Notify When Limit Reached |
|------|---------------------------|
| Board Member | 0 (disabled) |
| Concierge | 0 |
| Owner | 0 |
| Property Manager | 0 |
| Security Head Office | 0 |
| Site Supervisor | 0 |
| Superintendent | 0 |
| Tenant | 0 |
| Admin | 0 |

### Additional Parking Fields
| Field | Value |
|-------|-------|
| Signature Pad Type | undefined (not configured) |
| Formatted Parking Passes | undefined (not configured) |

---

## 4. Login Tab

### Login Instructions (Welcome Email Configuration)
| Field | Value | Notes |
|-------|-------|-------|
| Headers Line | "Welcome to Bond" | Email header |
| Login Instructions Email Subject | no-reply@iconconnect.ca | Subject line |
| Login Instructions | (Long welcome email text) | Includes link to set password, contact info |

**Key insight**: This is the **onboarding email template** sent to new residents. It includes instructions for setting up their password and accessing the portal at `https://aquarius.iconconnect.ca`.

---

## 5. Payment Tab

### Payment Instructions
| Field | Value | Notes |
|-------|-------|-------|
| Allow online payments | No | Currently disabled |
| Online Payment Processor | null (not configured) | |
| Stripe Public Key | (empty) | Stripe integration |
| Stripe Private Key | *********** (masked) | Stripe integration |
| Who pays transaction fee | undefined | Not configured |

**Key insight**: The platform uses **Stripe** as its payment processor. Online payments are currently disabled for this building, which explains why the Online Store module shows "No appropriate payment methods" error.

---

## 6. Amenity Tab

### Amenity List (7 amenities)
| # | Amenity Name | Actions |
|---|-------------|---------|
| 1 | BBQ Bond | Check Availability |
| 2 | BBQ 2 Bond | (no Check Availability button visible) |
| 3 | Billiard Room Bond | Check Availability |
| 4 | Elevator Bond | Check Availability |
| 5 | Guest Suite Bond | Check Availability |
| 6 | Party Room Bond | Check Availability |
| 7 | Golf and Video Game Room | Check Availability |

**Key insight**: This lists all bookable amenities for the building. Each has a "Check Availability" action. Amenity names include the building name suffix ("Bond"). The 7 amenities match those found in the Amenities module.

---

## 7. Groups Tab

### User Group Taxonomy (18 groups)
| Group ID | Group Name | Type | Category |
|----------|------------|------|----------|
| 1 | admin | admin | Staff |
| 2 | Property Manager | staff | Staff |
| 3 | Family member - Spouse | tenant | Tenant family |
| 4 | Family Member - Child | tenant | Tenant family |
| 5 | Other Occupant | tenant | Tenant |
| 6 | Tenant | tenant | Tenant |
| 7 | Owner | owner | Owner |
| 8 | Family member - Spouse | owner | Owner family |
| 9 | Family Member - Child | owner | Owner family |
| 10 | Family Member - Other | owner | Owner family |
| 11 | Other Occupant | owner | Owner |
| 12 | Offsite Owner | owner | Owner |
| 13 | Other Group | owner | Other |
| 14 | Superintendent | staff | Staff |
| 15 | Supervisor | staff | Staff |
| 16 | Security Head Office | staff | Staff |
| 17 | Board Member | owner | Governance |
| 18 | Security Guard | staff | Staff |

### Table Columns
| Column | Notes |
|--------|-------|
| Actions | (action buttons) |
| Group Id | Auto-increment integer |
| Group Name | Display name |
| Type | One of: admin, staff, tenant, owner |

### Group Type Summary
| Type | Count | Groups |
|------|-------|--------|
| admin | 1 | admin |
| staff | 5 | Property Manager, Superintendent, Supervisor, Security Head Office, Security Guard |
| tenant | 3 | Family member - Spouse, Family Member - Child, Other Occupant, Tenant |
| owner | 9 | Owner, Family member - Spouse, Family Member - Child, Family Member - Other, Other Occupant, Offsite Owner, Other Group, Board Member |

**Key insight**: Groups are typed into 4 categories (admin, staff, tenant, owner). Family member groups are **duplicated** across tenant and owner types (e.g., "Family member - Spouse" exists as both tenant type and owner type). This means a spouse of an owner has different permissions than a spouse of a tenant.

---

## 8. Keys Tab

### Key Management Table
| Column | Notes |
|--------|-------|
| Key # | Numeric identifier |
| Key Name | Descriptive name |
| Status | Current status (e.g., "Checked In") |
| Edit | Edit button |
| Delete | Delete button |

### Action Button
| Button | Style | Action |
|--------|-------|--------|
| Add Keys | — | Add new key entry |

### Key Inventory (19 keys)
| Key # | Key Name | Status |
|-------|----------|--------|
| 1 | Cleaner-#1 | Checked In |
| 2 | Cleaner-#2 | Checked In |
| 3 | Cleaner-#3 | Checked In |
| 4 | Trade Key-#1 | Checked In |
| 5 | Trade Key-#2 | Checked In |
| 6 | Trade Key-#3 | Checked In |
| 7 | Trade Key-#4 | Checked In |
| 8 | Trade Key-#5 | Checked In |
| 9 | Party room and patio key | Checked In |
| 10 | Guest suite-#1 | Checked In |
| 11 | Guest suite-#2 | Checked In |
| 12 | Roof top Hatch padlock | Checked In |
| 13 | Spare mail room | Checked In |
| 14 | Freight elevator | Checked In |
| 15 | Fire sump pump | Checked In |
| 16 | Plunger-7th floor mech room | Checked In |
| 17 | Luggage cart | Checked In |
| 18 | 292-Master key - Black access card | Checked In |
| 19 | Century cannabis master key | Checked In |

### Pagination
- Default: 5 rows per page
- Options: 5, 10, 20, 25, 50, 100 rows
- 4 pages at 5 rows/page (19 keys total)

**Key insight**: Key tracking includes physical building keys, access cards, equipment (luggage cart, plunger), and vendor-specific keys. All 19 keys are currently "Checked In". The status suggests keys can be checked out to contractors, cleaners, or staff.

---

## 9. Contractors Tab (Settings)

### Contractor Management Table
| Column | Notes |
|--------|-------|
| Contact # | Phone number |
| Contact Name | Company/contractor name |
| Contact Details | Specialty/description |
| Edit | Edit button |
| Delete | Delete button |

### Action Button
| Button | Style | Action |
|--------|-------|--------|
| Add Contractors | Outlined blue | Add new contractor |

**Note**: This is the management view where contractors are added/edited/deleted. The sidebar "Contractors" page shows a read-only view of the same data.

---

## 10. Building Setup (Edit Form)

**URL**: `/edit-building/{building_id}`
**Trigger**: Click "Go to Building Setup" button on `/settings` page
**Style**: Full-page form with editable fields

### Form Sections (top to bottom)
1. **General Building Introduction**
   - Building Title (required, red asterisk)
   - Building Image (drag-and-drop upload, shows current image thumbnail)
   - Welcome Message (required, HTML/rich text textarea)

2. **Building Information** (same fields as General tab but editable)
   - Management Name, Building Name, Description, Address, City, Postal Code, Corporation Number

3. **Default "From" E-mail Addresses** (6 configurable)
   - General Notifications, Event Log, Front Desk Instructions, Maintenance Requests, Amenity Reservations, Building from email

4. **Auto-CC Email Settings** (per log type)
   - General Log CC, Incident Log CC, Fire Log CC, Noise Log CC

5. **Parking Specifications** (all parking settings from Parking tab, editable)

6. **Notify when parking limit reached** (checkbox per role: Board Member, Concierge, Owner, Property Manager, Security Head Office, Site Supervisor, Superintendent, Tenant, Admin)

7. **Contacts** (Desk email, Management Office email, PM email, Assistant Manager email, 3 contact slots with Name/Email/Phone/Designation)

8. **Security Company** + Security Logo (drag-and-drop)

9. **Building Payments for Online Store**
   - Allow online payments: Yes/No

10. **Login Instructions** (Headers Line, Subject, Body — character limits noted)

11. **Emergency Procedures** (text area — this is where the Emergency sidebar page content is configured)

12. **Other Settings** (feature toggles)
    - Allow in-person payments
    - Allow offsite owners in Packages
    - Send Email to residents notifying them of Package Release
    - Show description Column in general logs table
    - Order status certificates
    - Enable discussion forum
    - Enable maintenance tickets

13. **Update** button (submit form)

---

## 11. Concierge Design Implications

### Strengths to Preserve
1. **Comprehensive building configuration** — 8 tabs covering all operational settings
2. **Per-log-type email configuration** — Different notification recipients per log type
3. **3-contact system** — Structured contacts with name, email, phone, designation
4. **Physical key tracking** — 19 keys with check-in/out status
5. **Group/role management** — 18 groups with typed hierarchy
6. **Feature toggles** — Enable/disable modules per building
7. **Parking limit system** — Granular limits per plate/unit across week/month/year
8. **Separate read and edit views** — `/settings` is read-only, `/edit-building` is editable

### Gaps & Issues to Fix
1. **No settings search** — 100+ settings with no search/filter capability
2. **All-in-one edit form** — Building Setup is a massive single page with all settings; should be tabbed like the read view
3. **No audit trail** — No change history for settings modifications
4. **No role-based settings access** — No visibility into who can change which settings
5. **Limited payment options** — Only Stripe supported
6. **No amenity configuration** — Amenity tab only lists amenities, doesn't allow creating/editing
7. **No emergency procedure categories** — Single text block for all emergencies
8. **No key checkout history** — Keys show current status but no log of who checked them out
9. **Contractor data is minimal** — Only phone, name, description; no insurance, license, rating
10. **Inconsistent data in read vs edit** — Some fields show "null" or "undefined" in read view
11. **No multi-building batch settings** — Each building configured individually
12. **HTML in Welcome Message** — Raw HTML tags visible in edit form (no WYSIWYG for this field)

---

## 12. Data Model (Deduced)

```
BuildingSettings
├── Building Info
│   ├── building_id (92)
│   ├── building_title ("Bond")
│   ├── building_image (file upload)
│   ├── welcome_message (HTML text)
│   ├── management_name ("IconConnect")
│   ├── description ("TSCC 2584")
│   ├── address, city, postal_code
│   └── corp_number
├── Email Configuration
│   ├── from_emails (6 configurable "from" addresses)
│   └── auto_cc_emails (per log type: General, Incident, Fire, Noise)
├── Contacts
│   ├── desk_email
│   ├── management_office_email
│   ├── property_manager_email
│   ├── assistant_manager_email
│   ├── contacts[1-3] → {name, email, phone, designation}
│   ├── security_company (string)
│   └── security_logo (file)
├── Parking
│   ├── parking_introduction (text)
│   ├── limits (overnight/day per plate/unit per week/month/year)
│   ├── feature_flags (self-serve, multi-day, day visits, printing, etc.)
│   └── notifications[] → {role, threshold}
├── Payment
│   ├── allow_online_payments (boolean)
│   ├── processor (null | "Stripe")
│   ├── stripe_public_key
│   ├── stripe_private_key
│   └── transaction_fee_payer
├── Login
│   ├── header_line
│   ├── email_subject
│   └── login_instructions (text, 1600 char max)
├── Emergency
│   └── emergency_procedures (text)
├── Feature Toggles
│   ├── allow_in_person_payments (boolean)
│   ├── allow_editing_locker_info (boolean)
│   ├── prevent_offsite_booking (boolean)
│   ├── enable_maintenance_tickets (boolean)
│   ├── prevent_non_staff_bookings (boolean)
│   ├── auto_allow_suite_entry (boolean)
│   ├── allow_offsite_owners_packages (boolean)
│   ├── send_package_release_email (boolean)
│   ├── show_description_in_general_logs (boolean)
│   ├── enable_status_certificates (boolean)
│   ├── enable_discussion_forum (boolean)
│   └── ad_expiry_days (number)
├── Groups[] → Group
│   ├── group_id (auto-increment)
│   ├── group_name (string)
│   └── type (enum: admin | staff | tenant | owner)
├── Keys[] → Key
│   ├── key_number (integer)
│   ├── key_name (string)
│   └── status (enum: "Checked In" | "Checked Out")
└── Contractors[] → Contractor
    ├── contact_number (phone)
    ├── contact_name (company name)
    └── contact_details (specialty/description)
```

---

*Last updated: 2026-03-14*
*Settings tabs: 8 (General, Parking, Login, Payment, Amenity, Groups, Keys, Contractors)*
*Total fields documented: ~120+*
*Groups: 18 across 4 types*
*Keys: 19 tracked*
*Contractors: 7 listed*
