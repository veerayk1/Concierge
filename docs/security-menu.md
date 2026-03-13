# Security & Concierge Menu

The Security & Concierge Menu provides tools for managing visitor parking, key checkouts, key inventory, and parking violations/bans.

**URL**: `/security&concierge`

**Title**: "Security & Concierge Menu"

---

## Quick Create Icons

Three circular icon buttons labeled **"Click to create"** at the top:

| Icon | CSS Class | Action |
|------|-----------|--------|
| Car Icon | `i.car.huge.circular.icon.logs-button` | Opens **Create Visitor Parking** modal |
| Key Icon | `i.key.huge.circular.icon.logs-button` | Opens **Key Checkout** modal |
| Ban/Prohibited Icon | `i.ban.huge.circular.icon.logs-button` | Opens **Parking Violation** modal |

---

## Section 1: Recent Visitor Parking

### Search Filters

| Filter | Type | Description |
|--------|------|-------------|
| Plate Number | Text + search icon | Search by license plate number |
| Filter by building | Dropdown | Select building to filter |
| Filter by unit | Dropdown | Filter by unit number |
| Start Date | Date picker | Default: 14 days before today (e.g., 05-03-2026) |
| End Date | Date picker | Default: today + 7 days (e.g., 19-03-2026) |
| Search Deleted | Toggle switch | Include soft-deleted records in results |
| Clear Search | Button | Reset all filters |
| Search | Button | Execute search |

### Visitor Parking Table

| Column | Description |
|--------|-------------|
| Start Time | When visitor parking session begins |
| Override End Time | Manually overridden end time |
| Visitor Type | Category of visitor |
| License Plate | Vehicle license plate number |
| Creation Time | Timestamp of entry creation |
| Creation By | Staff member who created entry |
| Unit | Associated unit number |
| Sign Out | Button to sign out the visitor |
| View | View full details |
| Print | Print visitor parking pass |
| Edit | Edit entry |
| Delete | Delete/soft-delete entry |

- **Pagination**: 5 rows per page, Previous/Next navigation

### Create Visitor Parking Modal

Opened by clicking the **Car Icon** or a create button.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building (e.g., Bond) |
| Select Unit | Yes* | Dropdown | Choose unit number |
| Visitor Type | Yes* | Radio buttons | Type of visitor |
| Guest Name | No | Text input | Name of the guest/visitor |
| Parking | No | Toggle | Whether visitor needs parking |
| Image Upload | No | Drag-and-drop / file | Upload photo (e.g., vehicle, ID) |
| Comments | No | Textarea | Additional notes |
| **Save** | — | Button | Submit the visitor parking entry |

---

## Section 2: Recent Key Checkout

### Features
- **Print Key Checkout History** button — export/print all key checkout records

### Key Checkout Table

| Column | Description |
|--------|-------------|
| Reference # | Unique checkout reference number |
| Key Number | The key identifier number |
| Checkout Time | Date/time when key was checked out |
| Checked out to | Person who received the key |
| Company Name | Company the person represents |
| Signature | Digital signature captured at checkout |
| Check In | Button/timestamp for key return |
| View | View full checkout details |
| Edit | Edit checkout entry |
| Delete | Delete checkout entry |

- **Pagination**: 5 rows per page, Previous/Next navigation

### Key Checkout Modal (Create)

Opened by clicking the **Key Icon**.

**Title**: "Key Checkout"

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building (default: Bond) |
| Select Key | Yes* | Dropdown | Choose from available keys in the system |
| Checked out to | Yes* | Text input | Name of person receiving the key |
| Company Name | No | Text input | Company name of the person |

**Identification Details** section:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| ID Type | Yes* | Dropdown | Type of identification presented |
| ID Number | Yes* | Text input | ID document number |

**Additional Fields**:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Reason | Yes* | Text input | Reason for key checkout |
| Signature Pad | Yes* | Canvas | Digital signature capture area |
| — Sign | — | Button | Start signing |
| — Clear | — | Button | Clear the signature |
| — Done | — | Button | Confirm signature |
| Image Capture 1 | No | Camera/upload | First photo (e.g., ID front) — shows "No image captured" if empty |
| Image Capture 2 | No | Camera/upload | Second photo (e.g., ID back) — shows "No image captured" if empty |
| **Deliver Key** | — | Button | Submit and check out the key |

---

## Section 3: Keys Management

### Features
- **Add Keys** button — opens the **Record Key** modal to register new keys

### Keys Table

| Column | Description |
|--------|-------------|
| Key # | System-assigned key identifier number |
| Key Name | Descriptive name for the key |
| Status | Current status (e.g., "Checked In", "Checked Out") |
| Edit | Edit button — modify key details |
| Delete | Delete button — remove key from system |

### Sample Key Inventory
- Trade Key-#1 (Key #4) — Checked In
- Trade Key-#2 (Key #5) — Checked In
- Cleaner-#1 (Key #1) — Checked In
- Cleaner-#2 (Key #2) — Checked In
- Cleaner-#3 (Key #3) — Checked In

- **Pagination**: 5 rows per page, 4 pages total

### Record Key Modal (Add Keys)

**Title**: "Record Key"

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building (default: Bond) |
| Key Number | No | Text input | Key number/identifier |
| Key Name | No | Text input | Descriptive name for the key |
| **Send** | — | Button | Submit and register the new key |

- **Bulk Add** button — allows adding multiple keys at once (top-right of modal)

---

## Section 4: Parking Violation

### Search Filters

| Filter | Type | Description |
|--------|------|-------------|
| Clear Search | Button | Reset all filters |
| Plate Number | Text + search icon | Search by license plate |
| Search Start Time | Date picker with calendar | Filter violations from this date |
| Search End Time | Date picker with calendar | Filter violations until this date |
| Search Deleted | Toggle switch | Include soft-deleted violations |
| Search | Button | Execute search |

### Parking Violation Table

| Column | Description |
|--------|-------------|
| Reference # | Unique violation reference number |
| Ban Type | Type of action (Ban, Ticket, Warning, Vehicle Towed) |
| License Plate | Offending vehicle's plate number |
| Issued By | Staff member who issued the violation |
| Time | Date/time of the violation |
| Edit | Edit violation details |
| Delete | Delete violation record |

- **Pagination**: 5 rows per page, Previous/Next navigation

### Create Parking Violation Modal

Opened by clicking the **Ban/Prohibited Icon**.

**Title**: "Visitor Parking"

**Notice**: Yellow banner — *"This form is only for banning individual LICENSE PLATES."*

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Select Building | Yes* | Dropdown | Choose building (default: Bond) |
| License Plate Number | Yes* | Text input | The plate number to ban/warn |
| Ban Type | Yes* | Radio buttons | One of: **Ban**, **Ticket**, **Warning**, **Vehicle Towed** |
| Automatically Lift Ban On | No | Date picker | Date when the ban/restriction automatically expires |
| **Save** | — | Button | Submit the parking violation |

---

## Common Features

- All sections share consistent pagination (5 rows default, configurable)
- All tables support sorting by column headers
- "Search Deleted" toggle available in both Visitor Parking and Parking Violation sections
- Modal forms use the same UI framework with X close button (top-right)
- All entries support View, Edit, and Delete operations
