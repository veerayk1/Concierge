# Deep Dive: Top Navigation & User Account Pages (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Top Navigation Bar

### Layout
Fixed top bar with the following elements (left to right):
1. **Aquarius logo** (top-left, links to home)
2. **Navigation links**: Home | Amenities | Create User | Create Unit | Logs | Packages
3. **Search bar**: "Type and press enter to search" (magnifying glass icon)
4. **User dropdown**: RAY_007 ▾
5. **Notification bell icon** (right of user dropdown)

### Navigation Links
| # | Label | URL | Purpose |
|---|-------|-----|---------|
| 1 | Home | `/` (dashboard) | Returns to main dashboard |
| 2 | Amenities | `/amenities` | Amenity booking page |
| 3 | Create User | `/profile` | Create new user form |
| 4 | Create Unit | `/unit` | Create new unit form |
| 5 | Logs | `/logs` | Log entry creation page |
| 6 | Packages | `/packages` | Package management page |

### User Dropdown Menu (RAY_007 ▾)
| # | Menu Item | URL/Action | Purpose |
|---|-----------|------------|---------|
| 1 | View Profile | `/view-user/Ray_007` | View own user profile (read-only) |
| 2 | Switch Building | JavaScript action (no URL) | Switch active building context (multi-building properties) |
| 3 | Settings | `/settings` | Building settings page (read-only view) |
| 4 | User Management | `/manage-users` | User management menu |
| 5 | Email Preferences | `/preferences` | Notification settings |
| 6 | Change Password | JavaScript action (no URL, 404 on direct navigation) | Change current user password |
| 7 | Logout | Session termination | End session and return to login |

**Key insight**: "Switch Building" and "Change Password" are handled via JavaScript/React state (not dedicated URLs), while "View Profile", "Settings", "User Management", and "Email Preferences" have proper routes.

---

## 2. Create User Page (`/profile`)

**URL**: `/profile`
**Page title**: "Create User"
**Top nav label**: "Create User"

### Form Fields
| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Toggle Active | Toggle switch | — | ON (active) | Blue toggle, controls account status |
| 2 | Profile Image | Image upload (circular) | No | Default avatar silhouette | Click to upload profile photo |
| 3 | First Name | Text input | Yes* | — | Red asterisk indicates required |
| 4 | Last Name | Text input | Yes* | — | Red asterisk indicates required |
| 5 | Username | Text input | Yes* | — | System login identifier |
| 6 | Password | Password input | Yes* | — | Hidden text |
| 7 | Confirm Password | Password input | Yes* | — | Must match Password |
| 8 | About you | Text area | No | — | Bio/description field |
| 9 | Phone Number | Text input | No | — | Primary phone |
| 10 | Home Phone | Text input | No | — | Secondary phone |
| 11 | Work Phone | Text input | No | — | Tertiary phone |
| 12 | Email | Text input | Yes* | — | Red asterisk indicates required |

### Role Selection Section

**Section header**: "Select the roles that should be assigned to the user"

Two columns of role checkboxes:

#### Staff Roles (Left Column)
| # | Role | Type |
|---|------|------|
| 1 | Security Head Office | Staff |
| 2 | Superintendent | Staff |
| 3 | Supervisor | Staff |
| 4 | Security Guard | Staff |

#### Owner/Tenant Roles (Right Column)
| # | Role | Type |
|---|------|------|
| 1 | Tenant | Tenant |
| 2 | Owner | Owner |
| 3 | Family member - Spouse | Tenant/Owner |
| 4 | Family member - Child | Tenant/Owner |
| 5 | Family member - Other | Tenant/Owner |
| 6 | Authorized Agents (Owner) | Owner |
| 7 | Offsite Owner | Owner |
| 8 | Board Member | Owner |

**Key insight**: Roles are **not mutually exclusive** — checkboxes allow multiple role assignment. Staff roles are separated from resident roles. The "property manager" role visible in RAY_007's profile is not listed here — it may be an admin-only role or configured differently.

### Notification Preferences Section

**Section header**: "Select the notification preferences for this user"

| # | Preference | Type | Default |
|---|-----------|------|---------|
| 1 | When a service request is created. | Checkbox | Unchecked |
| 2 | When a service request is updated. | Checkbox | Unchecked |
| 3 | When a new security report/log is created. | Checkbox | Unchecked |
| 4 | When a new event is added. | Checkbox | Unchecked |

**Key insight**: Only 4 notification preferences are shown on the Create User form. The full Notification Settings page (`/preferences`) has 10 preferences — so 6 additional preferences are only configurable after user creation via Email Preferences.

### Form Action
| Button | Style | Action |
|--------|-------|--------|
| Save | Blue filled button | Creates the user account |

---

## 3. Create Unit Page (`/unit`)

**URL**: `/unit`
**Page title**: "Create Unit"
**Top nav label**: "Create Unit"

### Form Fields
| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Select building | Dropdown (combobox) | Yes | "Bond" (pre-selected) | Building selector |
| 2 | Unit Number | Text input | Yes* | — | Red asterisk indicates required |
| 3 | Package email notification | Toggle switch | — | ON | Whether unit gets package email alerts |
| 4 | Comments | Text area | No | — | General notes about unit |
| 5 | Phone code | Text input | No | — | Lobby phone/intercom code |
| 6 | Parking Spot | Text input | No | — | Assigned parking spot number |
| 7 | Locker | Text input | No | — | Assigned locker number |

### FOB/Remote/Key Section (6 slots)

Each of the 6 slots has:
| Sub-field | Type | Options/Notes |
|-----------|------|---------------|
| Type | Dropdown | Access Card, FOB, Key, Remote (4 options) |
| Serial Number | Text input | Physical key/fob identifier |

**Layout**: 6 rows, each with Type dropdown + Serial Number input
- Slot 1: FOB/Remote/Key
- Slot 2: FOB/Remote/Key 2
- Slot 3: FOB/Remote/Key 3
- Slot 4: FOB/Remote/Key 4
- Slot 5: FOB/Remote/Key 5
- Slot 6: FOB/Remote/Key 6

### Buzzer Codes Section (2 slots)

| Slot | Fields |
|------|--------|
| Buzzer Code 1 | Code (text input) + Comments (text input) |
| Buzzer Code 2 | Code (text input) + Comments (text input) |

### Garage Clickers Section (2 slots)

| Slot | Fields |
|------|--------|
| Garage Clicker 1 | Single text input |
| Garage Clicker 2 | Single text input |

### Key Tag Section

| Field | Type | Notes |
|-------|------|-------|
| Key Tag | Text input | Physical key tag identifier |

### Form Action
| Button | Style | Action |
|--------|-------|--------|
| Save | Blue filled button | Creates the unit |

**Key insight**: The Create Unit form combines unit identification (number, phone code, parking, locker) with physical access management (6 FOB slots, 2 buzzer codes, 2 garage clickers, key tag). This is unique to Aquarius — BuildingLink doesn't track physical access devices at the unit level.

---

## 4. User Management Page (`/manage-users`)

**URL**: `/manage-users`
**Page title**: "User Management Menu"
**Accessed via**: RAY_007 dropdown → User Management

### Page Layout
1. **Header**: "User Management Menu"
2. **Building selector**: Dropdown with building name (Bond)
3. **Welcome Email section**

### Building Selector
| Field | Type | Default |
|-------|------|---------|
| Select building | Dropdown (combobox) | "Bond" |

### Welcome Email Section
| Element | Type | Notes |
|---------|------|-------|
| Send Welcome Email | Blue filled button | Sends welcome email to all users |
| Status notice | Green text | "Welcome emails have been already sent for the Bond building!" |

**Key insight**: This page appears to be a simple management utility for sending welcome emails to all users in a building. The welcome email template is configured in Settings > Login tab. The notice indicates emails have already been sent for Bond. It's unclear if this page has additional functionality beyond the welcome email feature — it may serve as a hub that was not fully developed.

---

## 5. Email Preferences / Notification Settings Page (`/preferences`)

**URL**: `/preferences`
**Page title**: "Notification Settings"
**Accessed via**: RAY_007 dropdown → Email Preferences

### Page Layout
1. **Header**: Bell icon + "Notification Settings"
2. **Checkbox list**: 10 notification preferences
3. **Save button**

### Notification Preferences (10 options)
| # | Preference | Default (RAY_007) | Category |
|---|-----------|-------------------|----------|
| 1 | Emails Declined | Unchecked (OFF) | Global opt-out |
| 2 | Do you want to be notified when an amenity is booked? | Unchecked | Amenities |
| 3 | Do you want to be notified when an amenity booking is cancelled? | Unchecked | Amenities |
| 4 | When a service request is created. | ✓ Checked | Maintenance |
| 5 | When a service request is updated. | ✓ Checked | Maintenance |
| 6 | Do you want to be notified when a new security report/log is created. | ✓ Checked | Security |
| 7 | When a parking violation is created and updated | Unchecked | Parking |
| 8 | When a new event is added. | ✓ Checked | Events |
| 9 | Do you want to be notified when a resident edits his profile? | ✓ Checked | User Management |
| 10 | Do you want to be notified when a resident updates Emergency Assistance related requirements? | ✓ Checked | Emergency |

**Note on "Emails Declined"**: The full description reads: "Applies to emails sent via the Site. Does not apply to booking warnings or package notices or similar system generated emails. The content of this field is kept private and will not be shown publicly. If you want to receive announcement related emails you must keep this setting turned off."

### Key Observations
- **10 notification types** — compared to only 4 shown on the Create User form
- **Email-only** — All notifications are email-based (no SMS, push, or in-app options)
- **Global opt-out** — "Emails Declined" is a master toggle for site-generated emails (but excludes system emails like package notices and booking warnings)
- **No per-building preferences** — Settings are global, not building-specific
- **No frequency control** — No option for digest vs. immediate notifications
- **Inconsistent phrasing** — Mix of question format ("Do you want to be notified when...") and statement format ("When a service request is created.")

### Form Action
| Button | Style | Action |
|--------|-------|--------|
| Save | Blue filled button | Saves notification preferences |

---

## 6. View User Profile Page (`/view-user/{username}`)

**URL**: `/view-user/Ray_007`
**Page title**: Displays user's full name ("RAY KODAVALI")
**Accessed via**: RAY_007 dropdown → View Profile, OR clicking a user name in search results

### Page Header
| Element | Type | Notes |
|---------|------|-------|
| User icon | Default avatar | Blue person silhouette |
| Full Name | Bold heading | "RAY KODAVALI" (uppercase) |
| Edit button | Blue filled button | Navigates to edit form (top-right) |

### Tab Navigation (6 tabs)
| # | Tab Name | Description |
|---|----------|-------------|
| 1 | User | Basic user details, contacts, parcel waivers |
| 2 | Emergency Contacts | Emergency contact people for this user |
| 3 | Notification Preferences | Read-only view of user's notification settings |
| 4 | Vehicles And Parking | Vehicle details and parking rental info |
| 5 | Pets | Pet registration details |
| 6 | Documents | Legal documents (POA, lease, insurance) |

### Tab 1: User (Default)

#### USER DETAILS Section
| # | Field | Value (RAY_007) | Notes |
|---|-------|-----------------|-------|
| 1 | Username | Ray_007 | Login identifier |
| 2 | Firstname | Ray | — |
| 3 | Lastname | Kodavali | — |
| 4 | Front desk Instructions | (empty) | Per-user notes for concierge staff |
| 5 | User Group | staff - (property manager) | Role/group assignment |
| 6 | Offsite Address | (empty) | For offsite owners |
| 7 | Email Address | ray@iconpm.ca | Primary email |
| 8 | User Status | Active | Active/Inactive |
| 9 | Assistance Required | No | Accessibility/assistance flag |
| 10 | Last Logged In | 14-03-2026 03:43 | Last login timestamp |
| 11 | Account Created on | November 11, 2022 | Creation date |
| 12 | Account Updated on | March 13, 2026 | Last profile update |
| 13 | About you | (empty) | Bio/description |

#### CONTACTS Section
| # | Field | Value (RAY_007) |
|---|-------|-----------------|
| 1 | Email | ray@iconpm.ca |
| 2 | Phone Number | 647-299-5969 |
| 3 | Home Phone | (empty) |
| 4 | Work Phone | (empty) |

#### PARCEL WAIVERS Section
| # | Field | Value (RAY_007) |
|---|-------|-----------------|
| 1 | Signed At | (empty) |
| 2 | Attachment | --- KB |
| 3 | Notes | (empty) |

**Key insight**: Parcel waivers are legal documents where residents authorize the concierge to accept packages on their behalf. This is tracked per-user, not per-unit.

### Tab 2: Emergency Contacts
Content: "No Emergency contacts have been specified"

**Expected fields (when populated, from existing user-profile.md documentation)**:
| # | Field | Type |
|---|-------|------|
| 1 | Contact Name | Text |
| 2 | Relationship | Text |
| 3 | Phone Number | Text |
| 4 | Email | Text |

### Tab 3: Notification Preferences (Read-Only View)

Displays the same 8 notification preferences as the `/preferences` page, but in **read-only key-value format** (not checkboxes):

| # | Preference | Value (RAY_007) |
|---|-----------|-----------------|
| 1 | Emails Declined | No |
| 2 | Do you want to be notified when a service request is created? | Yes |
| 3 | Do you want to be notified when a service request is updated? | Yes |
| 4 | Do you want to be notified when an amenity is booked? | No |
| 5 | Do you want to be notified when an amenity booking is cancelled? | No |
| 6 | Do you want to be notified when a new security report/log is created. | Yes |
| 7 | When a parking violation is created and updated? | No |
| 8 | When a new event is added? | Yes |

**Note**: This view shows only 8 preferences (vs 10 on the editable `/preferences` page). Missing from the read-only view:
- "Do you want to be notified when a resident edits his profile?"
- "Do you want to be notified when a resident updates Emergency Assistance related requirements?"

### Tab 4: Vehicles And Parking

#### Vehicles Section
| # | Field | Value (RAY_007) |
|---|-------|-----------------|
| 1 | Vehicle 1 Plate Number | (empty) |
| 2 | Vehicle 1 Color | (empty) |
| 3 | Vehicle 1 Model | (empty) |
| 4 | Vehicle 2 Plate Number | (empty) |
| 5 | Vehicle 2 Color | (empty) |
| 6 | Vehicle 2 Model | (empty) |
| 7 | Vehicle 3 Plate Number | (empty) |
| 8 | Vehicle 3 Color | (empty) |
| 9 | Vehicle 3 Model | (empty) |

**3 vehicle slots**, each with: Plate Number, Color, Model

#### Parking Section
| # | Field | Value (RAY_007) |
|---|-------|-----------------|
| 1 | Renting a parking spot? | No |
| 2 | Which Unit Are You Renting From? | (empty) |

**Key insight**: Vehicle tracking supports up to 3 vehicles per user. The parking rental question tracks unit-to-unit parking spot rentals (a resident renting a spot from another unit's owner).

### Tab 5: Pets
Content: "No pet related details have been provided"

**Expected fields (when populated, from existing user-profile.md documentation)**:
| # | Field | Type |
|---|-------|------|
| 1 | Pet Type | Text/Dropdown |
| 2 | Pet Name | Text |
| 3 | Breed | Text |
| 4 | Color | Text |
| 5 | Weight | Text |

### Tab 6: Documents

| # | Field | Value (RAY_007) | Notes |
|---|-------|-----------------|-------|
| 1 | Power of Attorney for Owner? | (empty/No) | Legal POA document |
| 2 | Lease Agreement? | (empty/No) | Tenant lease document |
| 3 | Insurance Certificate? | (empty/No) | Insurance document |

**Key insight**: Documents tab tracks 3 legal document types. These appear to be Yes/No flags with optional file uploads — tracking whether the building has these documents on file for this user.

---

## 7. Concierge Design Implications

### Strengths to Preserve
1. **Comprehensive user profile** — 6 tabs covering all user aspects (details, emergency, notifications, vehicles, pets, documents)
2. **Physical access management** — 6 FOB slots, 2 buzzer codes, 2 garage clickers, key tag on unit creation
3. **Front desk instructions** — Per-user notes visible to concierge staff
4. **Parcel waivers** — Legal document tracking for package handling
5. **Multi-role assignment** — Users can have multiple roles (checkbox-based)
6. **Vehicle tracking** — 3 vehicle slots with plate/color/model
7. **Parking rental tracking** — Cross-unit parking spot rental information
8. **Legal document tracking** — POA, lease, insurance certificate per user
9. **Building context switching** — Multi-building support via dropdown
10. **Notification granularity** — 10 different notification types

### Gaps & Issues to Fix
1. **Email-only notifications** — No SMS, push, or in-app notification options
2. **Limited notification preferences on creation** — Only 4 of 10 shown when creating user
3. **No profile photo upload guidance** — No size/format restrictions visible
4. **No address fields on user creation** — Offsite Address only visible on profile view, not create form
5. **No unit assignment on user creation** — Users are created without linking to a unit
6. **Inconsistent notification wording** — Mix of question and statement formats
7. **No emergency contact on creation** — Must be added after user creation
8. **No vehicle/pet on creation** — Must be added after user creation
9. **Password requirements not shown** — No complexity rules visible on create form
10. **Change Password page is broken** — Returns 404 on direct navigation
11. **User Management is minimal** — Only has welcome email functionality visible
12. **No bulk user creation** — One user at a time only
13. **No user import** — No CSV/Excel import for bulk onboarding
14. **No deactivation workflow** — Toggle exists but no move-out/deactivation process
15. **Notification preferences mismatch** — 10 on edit page, 8 on read-only profile view
16. **No pet details structure** — Empty state message only, expected fields not confirmed
17. **3-vehicle limit** — Hard-coded to 3 vehicles per user, not configurable
18. **2-buzzer limit** — Hard-coded to 2 buzzer codes per unit
19. **6-FOB limit** — Hard-coded to 6 FOB/key slots per unit
20. **No audit trail** — No history of profile changes or who made them

---

## 8. Data Model (Deduced)

### User Account
```
User
├── id (auto-generated)
├── username (string, unique)
├── password (hashed)
├── first_name (string, required)
├── last_name (string, required)
├── email (string, required)
├── phone_number (string)
├── home_phone (string)
├── work_phone (string)
├── about_you (text)
├── profile_image (blob/url)
├── is_active (boolean, default: true)
├── offsite_address (text)
├── front_desk_instructions (text)
├── assistance_required (boolean, default: false)
├── roles[] → Role (many-to-many)
├── user_group (string — "staff - (property manager)", "owner", "tenant", etc.)
├── building_id → Building
├── last_logged_in (datetime)
├── account_created_on (datetime)
├── account_updated_on (datetime)
├── notification_preferences → NotificationPreferences
│   ├── emails_declined (boolean, default: false)
│   ├── notify_amenity_booked (boolean)
│   ├── notify_amenity_cancelled (boolean)
│   ├── notify_service_request_created (boolean)
│   ├── notify_service_request_updated (boolean)
│   ├── notify_security_report (boolean)
│   ├── notify_parking_violation (boolean)
│   ├── notify_new_event (boolean)
│   ├── notify_resident_profile_edit (boolean)
│   └── notify_emergency_update (boolean)
├── emergency_contacts[] → EmergencyContact
│   ├── contact_name
│   ├── relationship
│   ├── phone_number
│   └── email
├── vehicles[] (max 3)
│   ├── plate_number
│   ├── color
│   └── model
├── parking_rental
│   ├── renting_spot (boolean)
│   └── renting_from_unit (string)
├── pets[] → Pet
│   ├── pet_type
│   ├── pet_name
│   ├── breed
│   ├── color
│   └── weight
├── documents
│   ├── power_of_attorney (boolean + file)
│   ├── lease_agreement (boolean + file)
│   └── insurance_certificate (boolean + file)
└── parcel_waivers
    ├── signed_at (datetime)
    ├── attachment (file)
    └── notes (text)
```

### Unit (from Create Unit form)
```
Unit
├── building_id → Building (required)
├── unit_number (string, required)
├── package_email_notification (boolean, default: true)
├── comments (text)
├── phone_code (string — lobby intercom)
├── parking_spot (string)
├── locker (string)
├── fobs[] (max 6)
│   ├── type (enum: Access Card | FOB | Key | Remote)
│   └── serial_number (string)
├── buzzer_codes[] (max 2)
│   ├── code (string)
│   └── comments (string)
├── garage_clickers[] (max 2)
│   └── identifier (string)
└── key_tag (string)
```

---

*Last updated: 2026-03-14*
*Pages documented: 6 (Create User, Create Unit, User Management, Email Preferences, View Profile, User Dropdown)*
*User profile tabs: 6 (User, Emergency Contacts, Notification Preferences, Vehicles And Parking, Pets, Documents)*
*Notification types: 10 (editable), 8 (read-only view)*
*Role types: 12 (4 staff + 8 owner/tenant)*
