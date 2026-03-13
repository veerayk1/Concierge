# Security & Concierge Menu

The Security & Concierge Menu provides tools for managing visitor parking, key checkouts, and parking violations.

**URL**: `/security&concierge`

## Quick Create Icons

Three circular icon buttons at the top to quickly create entries:
1. **Car Icon**: Create a new visitor parking entry
2. **Key Icon**: Create a new key checkout entry
3. **Prohibited/Ban Icon**: Create a new parking violation/ban entry

## Section 1: Recent Visitor Parking

### Search Filters
- **Plate Number**: Search by license plate
- **Filter by Building**: Dropdown to select building
- **Filter by Unit**: Dropdown to filter by unit number
- **Date Range**: Start date and end date pickers (default: 2-week window)
- **Search Deleted**: Toggle to include deleted records
- **Clear Search / Search**: Action buttons

### Visitor Parking Table Columns
| Column | Description |
|--------|-------------|
| Start Time | When visitor parking begins |
| Override End Time | Manual override of parking end time |
| Visitor Type | Type of visitor |
| License Plate | Vehicle license plate number |
| Creation Time | When the entry was created |
| Creation By | Who created the entry |
| Unit | Associated unit number |
| Sign Out | Sign out action |
| View | View details |
| Print | Print entry |
| Edit | Edit entry |
| Delete | Delete entry |

### Pagination
- Configurable rows per page (default: 5)
- Page navigation (Previous/Next)

## Section 2: Recent Key Checkout

### Features
- **Print Key Checkout History**: Button to print/export key checkout records

### Key Checkout Table Columns
| Column | Description |
|--------|-------------|
| Reference # | Unique reference number |
| Key Number | The key identifier |
| Checkout Time | When the key was checked out |
| Checked out to | Person who received the key |
| Company Name | Associated company |
| Signature | Digital signature capture |
| Check In | Check-in action/time |
| View | View details |
| Edit | Edit entry |
| Delete | Delete entry |

### Pagination
- Configurable rows per page (default: 5)

## Section 3: Keys Management

### Features
- **Add Keys**: Button to add new keys to the system

### Keys Table Columns
| Column | Description |
|--------|-------------|
| Key # | Key identifier number |
| Key Name | Descriptive name (e.g., Trade Key-#1, Cleaner-#1) |
| Status | Current status (e.g., "Checked In") |
| Edit | Edit key details |
| Delete | Delete key |

### Sample Key Types
- Trade Keys (Trade Key-#1, Trade Key-#2)
- Cleaner Keys (Cleaner-#1, Cleaner-#2, Cleaner-#3)
- 4 pages of keys total

### Pagination
- Configurable rows per page (default: 5)

## Section 4: Parking Violation

### Search Filters
- **Clear Search**: Reset search filters
- **Plate Number**: Search by license plate
- **Search Start Time / End Time**: Date pickers with calendar
- **Search Deleted**: Toggle for deleted records
- **Search**: Execute search button

### Parking Violation Table Columns
| Column | Description |
|--------|-------------|
| Reference # | Violation reference number |
| Ban Type | Type of ban/violation |
| License Plate | Offending vehicle plate |
| Issued By | Who issued the violation |
| Time | When the violation occurred |
| Edit | Edit violation |
| Delete | Delete violation |

### Pagination
- Configurable rows per page (default: 5)
