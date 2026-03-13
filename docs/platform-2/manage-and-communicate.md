# Manage & Communicate Modules

Overview of BuildingLink's Manage (12 sub-sections) and Communicate (11 sub-sections) modules with delta notes from Aquarius.

---

## Manage Module (12 sub-items)

### 1. Units/Occupants

**URL**: `/v2/mgmt/UnitProfile/Searchunit.aspx` (redirects to `/unit-overview/staff`)

#### Search Unit Profiles
- Search by: Unit #, Company/Family Name, Contact Name, Email Address
- Sort by: Unit # or Company/Family Name
- Include Deactivated Units checkbox
- Advanced Search option
- **171 units** observed in this property
- Special unit types: Commercial Unit, Bldg Mgmt
- **Create New Unit Profile** button

#### Unit Overview (3 tabs)

**Tab 1: Unit Overview**
10 modular, drag-reorderable sections:

| Section | Actions | Description |
|---------|---------|-------------|
| Instructions | Add new | Per-unit front desk instructions |
| Events | Add new | Unit event history |
| Custom Fields | Edit | Configurable fields (Breed, Locker, Pet Names, Pet Size, Parking, etc.) |
| Maintenance Requests | Add new | Unit maintenance history |
| Reservations | Show previous, Add new | Amenity bookings for this unit |
| Parking Permits | Add new | Active parking permits |
| Pets in Registry | Add new | Registered pets |
| Vehicle Information | Add new | Registered vehicles |
| Asset manager | — | Unit-level assets |
| Alterations | — | Renovation projects |

**Tab 2: Unit Details** — Unit configuration fields
**Tab 3: Documents** — Unit-level document management

#### Delta from Aquarius
Aquarius's unit page is a single form with fixed fields. BuildingLink's modular, drag-reorderable widget layout lets staff customize their view. The per-unit Instructions section is especially useful for front desk staff.

### 2. Filtered Groups
Custom resident grouping for targeted communication or management.
*Not available in Aquarius.*

### 3. Custom Fields
Configurable fields that can be added to unit profiles. Observed fields: Breed, "If this is a company enter 'C' here", Locker, Parking, Pet Names, Pet Size.
*Not available in Aquarius.*

### 4. Calendar
Building-wide calendar for events, meetings, and important dates. Dashboard shows "Calendar events today" section.
*Not available in Aquarius (Events page is different — it's community events, not a calendar).*

### 5. Library
Document library management. 3 Active Documents observed.
*Aquarius has a Library page — similar concept.*

### 6. Employees
Staff management for building employees. Dashboard shows "Employees logging-in today" with name, role (Security Supervisor, Operations Manager).
*Aquarius manages staff through user groups but doesn't have a dedicated employees section.*

### 7. Reservations (Amenity)

**URL**: `/amenities/staff`

#### Features
- Date range filter (default: 3 months forward)
- Status filter with badge count
- Amenities filter dropdown
- Advanced filter
- **3 View Modes**: List view, Calendar view, Grid view
- Print view button
- Create reservation dropdown
- Items per page: 25 (configurable)

#### List View Columns
| Column | Description |
|--------|-------------|
| Reservation time | Date and time range |
| Amenity | Resource name (e.g., "Moving Elevator", "Party room") |
| Requested for | Unit # + Resident name |
| Description | Booking notes |
| Status | Color-coded badge (green accent = Requested) |

#### Observed Amenities
- Moving Elevator (6 bookings)
- Party room (1 booking)

#### Delta from Aquarius
Aquarius has basic amenity booking. BuildingLink adds: 3 view modes (list/calendar/grid), status-based approval workflow, advanced filtering, and print view. The calendar and grid views are significant UX improvements.

### 8. Pet Registry
Dedicated pet tracking module.
*Aquarius has Pets tab on user profile — similar but less structured.*

### 9. Parking Management
See [unique-features.md](unique-features.md) — full permit system with 5 sub-pages.

### 10. Purchase Orders
Procurement tracking with approval workflow. Dashboard shows "0 Purchase orders to approve."
*Not available in Aquarius.*

### 11. Board Options
Board/governance management features.
*Not available in Aquarius.*

### 12. Asset Manager
Building asset tracking, also available per-unit in the Unit Overview widget layout.
*Not available in Aquarius.*

---

## Communicate Module (11 sub-items)

### Communication Hub Dashboard

**URL**: `/v2/mgmt/dashboard/communicatehome.aspx`

Central hub page with all communication actions listed:

| Action | Status | Description |
|--------|--------|-------------|
| Send Email | — | Email composition tool |
| Mailbox | — | Internal message inbox |
| Manage Library Documents | 3 Active Documents | Document management |
| Manage Special Email Groups | 1 Active | Custom distribution lists |
| View/Edit Scrolling Announcements | None Active | Ticker-style announcements |
| Send Emergency Voice/SMS Broadcast | — | Emergency communication |
| View/Create Survey Questions | — | Survey builder |
| Manage Photo Albums | — | Photo gallery |
| Configure Public Display(s) | None Active | Lobby screen content |

### Right Panel
- **Resident Directory** (formerly "Address Book")
- **Building Directory**
- **Manage Missing Email Addresses**: Employees (3 missing), Occupants (19 missing)

### 1. Send Email
Email composition with template system.

### 2. Mailbox
Internal messaging system — unique feature not in Aquarius.

### 3. Announcements

**URL**: `/content-creator/staff`

#### Multi-Channel Distribution
Each announcement targets one or more channels:
- **Public Display** — Lobby screens
- **Resident Site** — Resident web portal
- **Resident App** — Mobile application

#### Announcement Fields
| Field | Description |
|-------|-------------|
| Content | Announcement body with rich text |
| Channels | Multi-select: Public Display, Resident Site, Resident App |
| Status | Active/Expired with date |
| Expiry date | When announcement auto-expires |

#### Delta from Aquarius
Aquarius announcements are single-channel (web portal only). BuildingLink distributes to 3 channels simultaneously. The expiry system is also more robust.

### 4. Emergency Broadcast
See [unique-features.md](unique-features.md) — Voice + SMS broadcast system.

### 5. Survey
Survey creation and management.
*Aquarius has a basic survey module — comparable.*

### 6. Public Display
Lobby screen/digital signage configuration.
*Not available in Aquarius.*

### 7. Resident Directory
Resident contact directory (formerly "Address Book").

### 8. Building Directory
Building-level directory with facility information.
*Not available in Aquarius.*

### 9. Manage Photo Albums
Community photo gallery.
*Not available in Aquarius.*

### 10. Manage Special Email Groups
Custom email distribution lists beyond standard unit/building groups.
*Not available in Aquarius — Aquarius uses Auto-CC email lists in Settings but not customizable groups.*

---

## Concierge Design Implications

### From Manage Module
1. **Modular unit overview** — Drag-reorderable widget sections are excellent UX
2. **Custom fields** — Essential for properties with unique tracking needs
3. **3-view amenity reservations** — Calendar view is the most intuitive for booking management
4. **Employee management** — Dedicated staff section with login tracking
5. **Per-unit instructions** — Critical for front desk to have unit-specific notes

### From Communicate Module
1. **Communication hub** — Single page showing all communication tools and their status
2. **Multi-channel announcements** — Distribute once, reach everywhere
3. **Missing email tracking** — Proactive data quality management
4. **Mailbox** — Internal messaging reduces reliance on external email
5. **Emergency multi-channel** — Voice + SMS + Push for emergencies
