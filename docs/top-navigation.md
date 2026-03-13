# Top Navigation Bar

The top navigation bar provides quick access to core management functions across the platform.

**Navigation Items**: Home | Amenities | Create User | Create Unit | Logs | Packages

Also includes:
- **Quick Search**: "Type and press enter to" search bar
- **User Menu**: Logged-in user dropdown (e.g., RAY_007)
- **Notification Icon**: Camera/notification icon

---

## Create User

**URL**: `/profile`

### General User Introduction

| Field | Required | Description |
|-------|----------|-------------|
| Active | Yes* | Toggle to enable/disable the account (default: active) |
| Profile Image | No | Drag-and-drop image upload |
| First Name | Yes* | User's first name |
| Last Name | No | User's last name |
| Username | Yes* | Login username |
| Password | Yes* | Account password |
| Confirm Password | Yes* | Password confirmation |
| About you | No | Description of yourself (textarea) |

### Contact

| Field | Description |
|-------|-------------|
| Phone Number | Primary phone |
| Home Phone | Home phone number |
| Work Phone | Work phone number |
| Email | Email address |

### Role

Users must choose **one** role category:

#### Staff Specific Roles
- Security Head Office
- Superintendent
- Supervisor
- Security Guard

#### OR Owner/Tenant Specific Roles

**Tenant Roles:**
- Tenant
- Family member - Spouse(Tenant)
- Family member - Child(Tenant)
- Family member - Other(Tenant)

**Owner Roles:**
- Owner
- Family member - Spouse(Owner)
- Family member - Child(Owner)
- Family member - Other(Owner)
- Authorized Agents (Owner)
- Offsite Owner
- Board Member

### Notification Preferences

Toggle switches for:
- **Emails Declined** — Applies to emails sent via the Site for Announcements (does not apply to booking warnings or package notices)
- **When a service request is created**
- **When a service request is updated**
- **When a new event is added**

### Front Desk Instructions
- Comments textarea for front desk notes about the user

### Actions
- **Save** button to create the user

---

## Create Unit

**URL**: `/unit`

### Unit Information

| Field | Required | Description |
|-------|----------|-------------|
| Select Building | Yes* | Dropdown to choose the building |
| Unit Number | Yes* | Unit identifier |
| Package Email Notification | No | Checkbox: "Do you want to send package related Email notification to all residents of this unit?" |
| Comments | No | General comments (textarea) |
| EnterPhone code | No | Entry phone/buzzer code |
| Parking Spot | No | Assigned parking spot number |
| Locker | No | Assigned locker number |

### FOB/Remote/Key Management

Up to **6 FOB/Remote/Key entries** (FOB/Remote/Key 1 through 6), each with:
- **Type**: Dropdown selector
- **Serial Number**: Text field

### Buzzer Codes

| Field | Description |
|-------|-------------|
| Buzzer Code 1: Code | Buzzer code value |
| Buzzer Code 1: Comments | Notes about this buzzer code |
| Buzzer Code 2: Code | Second buzzer code value |
| Buzzer Code 2: Comments | Notes about second buzzer code |

### Garage Clickers

| Field | Description |
|-------|-------------|
| Garage Clicker 1 | First garage clicker identifier |
| Garage Clicker 2 | Second garage clicker identifier |

### Key Tag

- **Key Tag**: Key tag identifier field

### Actions
- **Save** button to create the unit

---

## Logs

**URL**: `/logs`

**Title**: "Logs Menu"

The Logs page consolidates five different log types and a bulletin system, each with its own table and create button.

### 1. General Log

- **Create General Log** button
- **View All** link

| Column | Description |
|--------|-------------|
| Reference # | Unique log identifier |
| Title | Log entry title (e.g., "shift report") |
| Creation By | Author name |
| Creation Time | Date and time created |
| View | View link |
| Edit | Edit icon |
| Delete | Delete icon |

- Pagination: 5 rows per page (20 pages)

### 2. Incident Log

- **Create Incident Log** button
- **View All** link

| Column | Description |
|--------|-------------|
| Reference # | Unique log identifier |
| Title | Incident description |
| Creation By | Author name |
| Creation Time | Date and time created |
| View | View link |
| Download | Download icon |
| Edit | Edit icon |
| Delete | Delete icon |

- Pagination: 5 rows per page (20 pages)

### 3. Fire Log

- **Create Fire Log** button
- **View All** link

| Column | Description |
|--------|-------------|
| Reference # | Unique log identifier |
| Title | Fire event description (e.g., "Fire alarm activated") |
| Creation By | Author name |
| Creation Time | Date and time created |
| View | View link |
| Download | Download icon |
| Edit | Edit icon |
| Delete | Delete icon |

- Pagination: 5 rows per page (6 pages)

### 4. Noise Log

- **Create Noise Log** button
- **View All** link

| Column | Description |
|--------|-------------|
| Reference # | Unique log identifier |
| Title | Noise complaint description |
| Creation By | Author name |
| Creation Time | Date and time created |
| View | View link |
| Download | Download icon |
| Edit | Edit icon |
| Delete | Delete icon |

- Pagination: 5 rows per page (20 pages)

### 5. Inspection Log

- **Create Inspection Log** button
- **View All** link

| Column | Description |
|--------|-------------|
| Reference # | Unique log identifier |
| Type | Inspection type (e.g., "pre") |
| Title | Inspection description |
| Booking Id | Associated booking ID |
| Creation By | Author name |
| Creation Time | Date and time created |
| View | View link |
| Edit | Edit icon |
| Delete | Delete icon |

- Pagination: 5 rows per page (1 page)

### 6. Bulletin

- **Create Bulletin** button
- **Send Global Notification** button

| Column | Description |
|--------|-------------|
| Reference # | Unique bulletin identifier |
| Title | Bulletin title |
| Creation By | Author name |
| Set as 'Never Expire' | Yes/No flag |
| Expiry Date | Expiration date (if applicable) |
| View | View link |
| Edit | Edit icon |

### Common Features
- All log types share the same table structure with pagination
- Each log type has its own Create button
- View All links to see complete log history
- Incident, Fire, and Noise logs support PDF download
- All logs support View, Edit, and Delete operations (except Bulletin which has no Delete)

---

## Packages

**URL**: `/packages/0`

**Title**: "Package Menu"

### Quick Create Icons
Two circular icons for creating packages:
1. **Incoming Package** — Log a package received for a resident
2. **Outgoing Package** — Log a package being sent out

### Manage Parcel Types
- **Manage Parcel Types** button — Configure available parcel type categories

### Search & Filters (Non-Released)

| Filter | Description |
|--------|-------------|
| Package Details | Search by package description |
| Belongs To | Search by recipient name |
| Select Building | Building dropdown filter |
| Filter by unit | Unit number filter |
| Numéro de référence | Reference number search |
| Date Range | Start and end date filters (e.g., 12-12-2025 to 14-03-2026) |
| Search | Execute search button |
| Clear Search | Reset all filters |
| Print Non Released Packages | Print button for pending packages |

### Non-Released Packages Table

| Column | Description |
|--------|-------------|
| Reference # | Unique package identifier |
| Unit # | Destination unit number |
| Package Type | Incoming/Outgoing |
| Package Description | Physical description (e.g., "brown box", "white package") |
| Courier | Delivery service (e.g., Amazon, Other) |
| Creation Date | Date package was logged |
| Storage Location | Where package is stored (e.g., "Parcel Room", "CACF") |
| Parcel Type | Category type |
| Release | Release action icon |
| View | View details |
| Edit | Edit entry |
| Delete | Delete entry |
| Building | Building name (e.g., "Bond") |
| Release Time | Timestamp of release (if released) |

- Pagination: 10 rows per page (11 pages)

### Released Packages: Past 21 Days

Separate section showing packages that have been released within the last 21 days, with its own:
- Search filters (Package Details, Belongs To, SearchBuilding, Filter by unit)
- Reference number and date range filters
- Search and Clear Search buttons

### Features
- Dual package creation (incoming/outgoing)
- Parcel type management
- Storage location tracking (Parcel Room, CACF)
- Release workflow (log receipt → release to resident)
- 21-day released package history
- Multi-filter search across both released and non-released
- Print capability for non-released packages
