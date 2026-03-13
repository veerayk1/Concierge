# Settings / Building Configuration

The Settings page provides comprehensive building configuration across 8 tabbed sections.

**URL**: `/settings`

**Header**: Building ID number (e.g., "92"), "Go to Building Setup" button (top-right)

---

## Tab Navigation

8 tabs with icons:
1. 🏢 **General** — Building info, email settings, contacts, feature toggles
2. 🚗 **Parking** — Visitor parking rules and limits
3. 🔐 **Login** — Login page customization and welcome emails
4. 💳 **Payment** — Payment processor configuration
5. 🏊 **Amenity** — Amenity card overview with availability check
6. 👥 **Groups** — Role/group management (18 groups)
7. 🔑 **Keys** — Key inventory management
8. 👷 **Contractors** — Contractor directory management

---

## Tab 1: General Settings

### Building Information
| Field | Example Value |
|-------|---------------|
| Management Name | IconConnect |
| Building Name | Bond |
| Welcome Message | Rich text description of the building |
| Address | 290 Adelaide St. |
| City | Toronto, ON |
| Description | TSCC 2584 |
| Postal Code | M5V0P3 |
| Corp Number | TSCC 2584 |

### Default Email Settings
Configurable "from" email address for each notification type:
- For General Notifications
- For Event Log Notifications
- For Front Desk Instructions Notifications
- For Maintenance Requests Notifications
- For Amenity Reservations Notifications
- When sending E-mails, what should the building "from" E-mail address be

### Auto-CC Email Lists (per log type)
- For General Log (auto-CC emails)
- For Incident Log (auto-CC emails — comma-separated list)
- For Fire Log (auto-CC emails)
- For Noise Log (auto-CC emails)

### Contacts Section
Multiple contact slots (at least 3), each with:
| Field | Description |
|-------|-------------|
| Desk Email | Front desk email |
| Management Office email | PM office email |
| Property manager Email | PM email |
| Assistant Manager email | Assistant PM email |
| Contact N Name | Contact person name |
| Contact N Email | Contact email |
| Contact N Phone | Contact phone |
| Contact N Designation | Role title (e.g., Property Manager, Property Administrator, Concierge Desk) |

### Security Company
| Field | Description |
|-------|-------------|
| Security Company | Company name (e.g., "Royal Concierge and Security Inc") |
| Security Logo | Uploaded logo image |

### Other Settings (Boolean Toggles)
| Setting | Description |
|---------|-------------|
| Allow in-person payments for this building? | Enable/disable in-person payments |
| Allow editing locker info for this building | Enable/disable locker info editing |
| Prevent offsite owners from booking facilities | Restrict offsite owner bookings |
| Enable maintenance tickets for this building | Enable/disable maintenance module |
| Prevent non-staff from creating facility bookings | Restrict booking creation to staff |
| Auto allow suite entry | Auto-approve suite entry requests |

---

## Tab 2: Parking Settings

### Overnight Limits (numeric values, 0 = unlimited)
| Limit Type | Granularity |
|------------|-------------|
| Overnight limit per plate per week | Per license plate, weekly |
| Overnight limit per unit per week | Per unit, weekly |
| Overnight limit per plate per month | Per license plate, monthly |
| Overnight limit per unit per month | Per unit, monthly |
| Overnight limit per plate per year | Per license plate, yearly |
| Overnight limit per unit per year | Per unit, yearly |
| Consecutive limit | Max consecutive overnight stays |

### Day Visit Limits
| Limit Type | Description |
|------------|-------------|
| Day visit limit per unit | Max day visits per unit |
| Day visit limit per plate | Max day visits per plate |

### Feature Toggles (yes/no)
| Setting | Description |
|---------|-------------|
| Allow self serve for visitor parking | Residents can register visitor parking themselves |
| Allow residents to enter multi day passes | Enable multi-day visitor passes |
| Send email notice for this building | Email notifications for parking events |
| Allow day visits for this building | Enable day visit type |
| Restrict visitor parking editing | Restrict who can edit visitor parking |
| Allow printing of parking passes | Enable pass printing feature |

### Role-Based Notifications (when parking limit reached)
Configurable notification threshold per role:
- Notify Board when Parking limit reached
- Notify Concierge when Parking limit reached
- Notify Owner when Parking limit reached
- Notify Property Manager when Parking limit reached
- Notify Security Head Office when Parking limit reached
- Notify Site supervisor when Parking limit reached
- Notify Superintendent when Parking limit reached
- Notify Tenant when Parking limit reached
- Notify Admin when Parking limit reached

### Additional Settings
| Setting | Description |
|---------|-------------|
| Signature Pad Type | Type of digital signature capture |
| Formatted Parking Passes | Formatted pass printing option |

---

## Tab 3: Login Instructions

| Field | Description |
|-------|-------------|
| Headers Line | Login page header text (e.g., "Welcome to Bond") |
| Login Instructions Email Subject | Subject line for welcome emails |
| Login Instructions | Body text of the welcome/onboarding email sent to new users |

---

## Tab 4: Payment Instructions

| Field | Description |
|-------|-------------|
| Allow online payments | Enable/disable online payments (yes/no) |
| Online Payment Processor | Payment processor name (e.g., Stripe) |
| Stripe Public Key | Stripe publishable key |
| Stripe Private Key | Stripe secret key (masked) |
| Who pays transaction fee | Who absorbs the processing fee |

---

## Tab 5: Amenity

Displays amenity cards in a grid (same as the amenity booking page):
- Each card shows: Amenity image, Name, Status (✓ active / ✗ inactive), "Check Availability" button
- Example amenities: BBQ Bond, BBQ 2 Bond, Billiard Room Bond, Elevator Bond, Guest Suite Bond, Party Room Bond, Golf and Video Game Room

---

## Tab 6: Groups (Role Management)

Table with columns: Actions (edit icon), Group Id, Group Name, Type

### Complete Group List (18 groups)

| ID | Group Name | Type |
|----|-----------|------|
| 1 | admin | admin |
| 2 | Property Manager | staff |
| 3 | Family member - Spouse | tenant |
| 4 | Family Member - Child | tenant |
| 5 | Other Occupant | tenant |
| 6 | Tenant | tenant |
| 7 | Owner | owner |
| 8 | Family member - Spouse | owner |
| 9 | Family Member - Child | owner |
| 10 | Family Member - Other | owner |
| 11 | Other Occupant | owner |
| 12 | Offsite Owner | owner |
| 13 | Other Group | owner |
| 14 | Superintendent | staff |
| 15 | Supervisor | staff |
| 16 | Security Head Office | staff |
| 17 | Board Member | owner |
| 18 | Security Guard | staff |

### Group Type Summary
- **admin** (1): admin
- **staff** (5): Property Manager, Superintendent, Supervisor, Security Head Office, Security Guard
- **tenant** (4): Family member - Spouse, Family Member - Child, Other Occupant, Tenant
- **owner** (8): Owner, Family member - Spouse, Family Member - Child, Family Member - Other, Other Occupant, Offsite Owner, Other Group, Board Member

---

## Tab 7: Keys

Key inventory management:
- **"Add Keys"** button to register new keys
- Table columns: Key #, Key Name, Status, Edit, Delete
- Status values: "Checked In", "Checked Out"

---

## Tab 8: Contractors

Contractor directory management:
- **"Add Contractors"** button
- Table columns: Contact # (phone), Contact Name, Contact Details (service type), Edit, Delete
- Same data as the sidebar Contractors panel but with full CRUD operations
