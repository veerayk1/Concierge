# Deep Dive: Security & Concierge Menu (Aquarius / ICON)

> **Platform**: Aquarius Condo Management Portal
> **Property**: TSCC 2584 — The Bond
> **URL**: `https://aquarius.iconconnect.ca/security&concierge`
> **Documented by**: Claude Code (automated deep-dive)
> **Date**: 2026-03-13

---

## 1. Page Overview

**Title**: "Security & Concierge Menu"

The page is a single scrollable view with 4 sections:
1. **Click to create** — 3 action icons for creating entries
2. **Recent Visitor Parking** — Filterable table of visitor parking records
3. **Recent Key Checkout / Keys** — Key checkout history + Key inventory management
4. **Parking Violation** — Filterable table of parking violations

---

## 2. Click to Create — 3 Action Icons

Three large circular icons with dark navy blue backgrounds, arranged horizontally:

| Icon | Tooltip | Action | Modal Title |
|------|---------|--------|-------------|
| Car icon | "Visitor Parking" | Opens Visitor Parking modal | "Visitor Parking" |
| Key icon | "Key Checkout" | Opens Key Checkout modal | "Key Checkout" |
| Prohibition/Ban icon | "Parking Violation" | Opens Parking Violation form (inside Visitor Parking modal) | "Visitor Parking" |

---

## 3. Visitor Parking Create Modal

### Base Fields (always visible)

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Visiting Building | Dropdown (combobox) | Yes* | "Bond" | Building selector |
| Visiting Unit Number | Dropdown (combobox) | No | "Visiting Unit Number" placeholder | Lists all units |
| Select Visitor Type | Dropdown (combobox) | Yes* | "Select Visitor Type" placeholder | Options: **Visitor**, **Contractor** |
| Guest name | Text input | No | "Guest name" placeholder | Free text |
| Check here if visitor requires parking | Toggle switch | No | Off | Reveals parking fields when enabled |
| (Image area) | Image capture | No | "No image" | Photo capture / upload area |
| Comments | Textarea | No | "Comments:" placeholder | Free text |
| **Save** button | Submit | — | — | Saves visitor record |

### Parking Fields (revealed when toggle is ON)

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| License Plate Number | Text input | Yes* | "License Plate Number" placeholder | Free text |
| License Plate Province | Dropdown (combobox) | Yes* | "ON" | Options: **AB**, **BC**, **MB**, **NB**, **NL**, **NT**, **NS**, **NU**, **ON**, **PE**, **QC**, **SK**, **YT**, **USA License Plate** |
| Parking Spot | Text input | No | "Parking Spot" placeholder | Free text |
| Parking Start Time | DateTime picker | Yes* | Current datetime (DD-MM-YYYY HH:MM) | X button to clear |
| Number of overnights | Number input | Yes* | 1 | Integer |
| Override Parking End Time | DateTime picker | No | Auto-calculated from start + overnights | Note: "Optional. NOT USED FOR LIMITS CALCULATIONS. IT DOES NOT CHANGE THE NUMBER OF OVERNIGHTS. IT IS FOR DISPLAY ONLY." |
| Vehicle Make | Dropdown (combobox) | Yes* | "Vehicle Make" placeholder | 56 options: Acura, Alfa Romeo, Asuna, Audi, Bentley, BMW, Buick, Cadillac, Chevrolet, Chrysler, Dodge, Ferrari, Fiat, Ford, GMC, Harley Davidson, Honda, Hummer, Hyundai, Infiniti, Isuzu, Jaguar, Jeep, Kawasaki, Kia, Lambhorgini, Landrover, Lexus, Lincoln, Lotus, Mazerati, Mazda, Mercedes-Benz, Mercury, Mini, Mitsubishi, Nissan, Oldsmobile, Other, Peugeot, Plymouth, Pontiac, Porsche, Ram, Saab, Saturn, Scion, Smart, Subaru, Suzuki, Tesla, Toyota, Volkswagen, Volvo, Yamaha |
| Vehicle Color | Dropdown (combobox) | Yes* | "Vehicle Color" placeholder | Options: **White**, **Black**, **Silver**, **Grey**, **Red**, **Blue**, **Brown/Beige**, **Yellow/Gold**, **Green**, **Other** |

---

## 4. Key Checkout Create Modal

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | Yes* | "Bond" | Building selector |
| Select Key | Dropdown (combobox) | Yes* | "Select Key:" placeholder | Format: `{key_id} > {key_name} > {building}`. 19 keys observed (see Keys Inventory below) |
| Checked out to | Text input | Yes* | "Checked out to:" placeholder | Name of person taking the key |
| Company Name | Text input | No | "Company Name:" placeholder | Company affiliation |
| **Identification Details** (sub-section) | | | | |
| ID Type | Dropdown (combobox) | Yes* | "ID Type:" placeholder | Options: **Drivers License**, **Health Card**, **Passport**, **Company Id**, **Other** |
| ID Number | Text input | Yes* | "ID Number:" placeholder | ID document number |
| Reason | Text input | Yes* | "Reason:" placeholder | Why the key is being checked out |
| Signature Pad | Canvas area | No | Empty | Draw signature area with 3 buttons: **Sign**, **Clear**, **Done** |
| Image capture (x2) | Image areas | No | "No image captured" | Two image slots (likely front and back of ID) |
| **Deliver Key** button | Submit | — | — | Completes key checkout |

---

## 5. Parking Violation Create Form

Appears inside the "Visitor Parking" modal when the prohibition/ban icon is clicked.

**Warning banner**: "This form is only for banning individual LICENSE PLATES." (yellow/cream background)

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | Yes* | "Bond" | Building selector |
| License Plate Number | Text input | Yes* | "License Plate Number" placeholder | Plate to ban/warn/ticket |
| Ban Type | Radio buttons | Yes | None selected | Options: **Ban**, **Ticket**, **Warning**, **Vehicle Towed** |
| Automatically Lift Ban On | DateTime picker | No | Empty (calendar icon) | Date when ban expires automatically |
| **Save** button | Submit | — | — | Creates the violation record |

---

## 6. Recent Visitor Parking Table

### Filters

| Filter | Type | Details |
|--------|------|---------|
| Plate Number | Text input with search icon | "Plate Number.." placeholder |
| Filter by building | Dropdown (combobox) | "Filter by building:" placeholder |
| Filter by unit | Dropdown (combobox) | "Filter by unit:" placeholder |
| Start Date | Date picker (DD-MM-YYYY) | Default: 7 days ago |
| End Date | Date picker (DD-MM-YYYY) | Default: 7 days from now |
| Search Deleted | Toggle switch | Off by default |

### Action Buttons
| Button | Style | Action |
|--------|-------|--------|
| Clear Search | Blue filled | Reset all filters |
| Search | Blue filled | Execute search |

### Table Columns (12 columns)

| Column | Type | Description |
|--------|------|-------------|
| Start Time | DateTime | When parking started |
| Override End Time | DateTime | Overridden end time (if set) |
| Visitor Type | Text | Visitor or Contractor |
| License Plate | Text | Vehicle plate number |
| Creation Time | DateTime | When record was created |
| Creation By | Text | Staff who created the record |
| Unit | Integer | Unit being visited |
| Sign Out | Action button | Sign out the visitor |
| View | Action link | View full record |
| Print | Action link | Print parking pass |
| Edit | Action link | Edit record |
| Delete | Action link | Delete record |

### Pagination
Same as other tables: 5/10/20/25/50/100 rows, Previous/Next, page number.

---

## 7. Recent Key Checkout Table

### Header Action
| Button | Style | Action |
|--------|-------|--------|
| Print Key Checkout History | Text link | Print checkout log |

### Table Columns (9 columns)

| Column | Type | Description |
|--------|------|-------------|
| Reference # | Auto-generated | Unique checkout reference |
| Key Number | Integer | Key ID |
| Checkout Time | DateTime | When key was checked out |
| Checked out to | Text | Person who has the key |
| Company Name | Text | Company of key holder |
| Signature | Image | Captured signature image |
| Check In | Action button | Return the key (check in) |
| View | Action link | View full checkout record |
| Edit | Action link | Edit checkout record |
| Delete | Action link | Delete checkout record |

### Pagination
Same as other tables: 5/10/20/25/50/100 rows, Previous/Next, page number.

---

## 8. Keys Inventory Section

### Header
- **Title**: "Keys:"
- **Action Button**: `Add Keys` — Blue filled button (top-right)

### Keys Table Columns (5 columns)

| Column | Type | Description |
|--------|------|-------------|
| Key # | Integer | Auto-generated key ID |
| Key Name | Text | Descriptive key name |
| Status | Text | Current status: "Checked In" or "Checked Out" |
| Edit | Action button | Blue "Edit" button |
| Delete | Action button | Blue "Delete" button |

### Observed Keys (19 keys in property)

| Key # | Key Name | Status |
|-------|----------|--------|
| 4 | Trade Key-#1 | Checked In |
| 5 | Trade Key-#2 | Checked In |
| 1 | Cleaner-#1 | Checked In |
| 2 | Cleaner-#2 | Checked In |
| 3 | Cleaner-#3 | Checked In |
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
| 18 | 292-Master key -Black access card | Checked In |
| 19 | Century cannabis master key | Checked In |

### Pagination
5/10/20/25/50/100 rows, Previous/Next, page number. Default: 5 rows per page, 4 total pages.

---

## 9. Parking Violation Section

### Filters

| Filter | Type | Details |
|--------|------|---------|
| Search Deleted | Toggle switch | Off by default |

### Action Buttons
| Button | Style | Action |
|--------|-------|--------|
| Clear Search | Text link | Reset filters |
| Search | Text link (implied) | Execute search |

### Table Columns (7 columns)

| Column | Type | Description |
|--------|------|-------------|
| Reference # | Auto-generated | Violation reference number |
| Ban Type | Text | Ban, Ticket, Warning, or Vehicle Towed |
| License Plate | Text | Banned/ticketed plate number |
| Issued By | Text | Staff who issued violation |
| Time | DateTime | When violation was created |
| Edit | Action link | Edit violation |
| Delete | Action link | Delete violation |

### Pagination
Same as other tables: 5/10/20/25/50/100 rows, Previous/Next, page number.

---

## 10. URL Patterns

| Page | URL |
|------|-----|
| Security & Concierge Menu | `/security&concierge` |

**Note**: All forms on this page are modals — there are no separate URLs for creating or viewing individual records. The entire Security & Concierge module lives on a single page.

---

## 11. Concierge Design Implications

### Strengths to Retain
1. **Single-page security dashboard** — all security functions on one page for quick front desk access
2. **Visitor parking with toggle** — conditional fields reduce clutter when parking isn't needed
3. **Key checkout with signature** — legal compliance for key handoff documentation
4. **ID verification fields** — ID Type + ID Number for key checkout accountability
5. **Parking violation lifecycle** — Ban/Ticket/Warning/Towed with auto-lift date
6. **Key inventory management** — centralized list of all building keys with status tracking
7. **Print Key Checkout History** — audit trail for key management
8. **License plate province tracking** — Canadian provinces + USA as option
9. **Vehicle Make/Color dropdowns** — standardized vehicle identification
10. **Override End Time** — flexible parking display without changing overnight calculation

### Gaps to Address in Concierge
1. **No incident reporting** — security incidents aren't tracked here (no assault/theft/noise complaint forms)
2. **No camera feed integration** — no way to link security footage to events
3. **No visitor pre-registration** — residents can't pre-authorize visitors from their portal
4. **No QR code / digital pass** — parking passes are print-only, no digital option
5. **No automatic plate recognition** — manual entry of all license plates
6. **No visitor frequency tracking** — no analytics on repeat visitors or patterns
7. **No key checkout notifications** — no alert when keys are overdue
8. **No multi-key checkout** — one form per key, can't check out multiple keys at once
9. **No integration with unit instructions** — "Unit 815 has a dog that bites" not shown during visitor check-in
10. **Parking violation doesn't link to unit** — violation is plate-level only, no unit association
11. **No security guard shift notes** — no shift handoff log in this section
12. **No emergency contacts quick access** — should be one click away on security page
13. **Photo capture shows "No image captured"** — unclear if webcam or file upload, UX is poor
14. **No visitor badge printing** — no way to generate a visitor badge with photo
15. **No contractor insurance verification** — contractor checked in but no insurance check

### Architectural Notes
- All 3 creation forms are modals on the same page (no separate routes)
- The Parking Violation form shares the "Visitor Parking" modal container (unusual UX — could be confusing)
- Key inventory uses a simple CRUD table with no advanced features (no search, no filter)
- Visitor parking and key checkout tables both support "Search Deleted" for soft-delete audit
- Signature pad uses HTML Canvas element with Sign/Clear/Done controls
- Image capture appears to support 2 image slots (likely front/back of ID)
- Key format in dropdown: `{key_id} > {key_name} > {building}` — good for multi-building support
- Pagination is consistent across all tables: 5/10/20/25/50/100 rows

---

## 12. Data Model (Deduced)

```
VisitorParking
├── id (integer, auto-generated)
├── building_id → Building
├── unit_number (integer, nullable)
├── visitor_type (enum: Visitor, Contractor)
├── guest_name (string)
├── has_parking (boolean)
├── image (blob, nullable)
├── comments (text)
├── start_time (datetime)
├── override_end_time (datetime, nullable — display only)
├── number_of_overnights (integer, default: 1)
├── created_by → User (staff)
├── creation_time (datetime)
├── signed_out (boolean, default: false)
├── deleted (boolean, default: false — soft delete)
└── vehicle → VisitorVehicle (nullable, when has_parking = true)

VisitorVehicle
├── license_plate_number (string)
├── license_plate_province (enum: AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT, USA License Plate)
├── parking_spot (string, nullable)
├── vehicle_make (enum: 56 options — Acura, Alfa Romeo, ..., Volvo, Yamaha)
└── vehicle_color (enum: White, Black, Silver, Grey, Red, Blue, Brown/Beige, Yellow/Gold, Green, Other)

Key
├── key_number (integer, auto-generated)
├── key_name (string, e.g., "Trade Key-#1", "Party room and patio key")
├── building_id → Building
└── status (enum: Checked In, Checked Out)

KeyCheckout
├── reference_number (integer, auto-generated)
├── key_number → Key
├── building_id → Building
├── checked_out_to (string)
├── company_name (string, nullable)
├── id_type (enum: Drivers License, Health Card, Passport, Company Id, Other)
├── id_number (string)
├── reason (string)
├── signature (blob, canvas capture, nullable)
├── id_images[] (blob, up to 2 image slots)
├── checkout_time (datetime)
├── checked_in (boolean, default: false)
├── checked_in_time (datetime, nullable)
└── deleted (boolean, default: false — soft delete)

ParkingViolation
├── reference_number (integer, auto-generated)
├── building_id → Building
├── license_plate (string)
├── ban_type (enum: Ban, Ticket, Warning, Vehicle Towed)
├── auto_lift_ban_on (datetime, nullable)
├── issued_by → User (staff)
├── time (datetime)
└── deleted (boolean, default: false — soft delete)
```

---

*Total fields documented: ~60+ across all forms and tables*
*Sections covered: 3 creation modals, 4 data tables, 1 key inventory management*
