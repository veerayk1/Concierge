# Deep Dive: Amenities Module (Aquarius / ICON)

> **Platform**: Aquarius Condo Management Portal
> **Property**: TSCC 2584 — The Bond
> **URL**: `https://aquarius.iconconnect.ca/search-amenities`
> **Documented by**: Claude Code (automated deep-dive)
> **Date**: 2026-03-13

---

## 1. Amenities Listing Page (`/search-amenities`)

### Page Header
- **Title**: "Amenities" (with trophy/cup icon)
- **Building Selector**: Dropdown, default "Bond" (single-building property)
- **Top-Right Action Buttons**:
  - `View All Bookings` — Red background, white text, navigates to `/all-bookings`
  - `Check Combined Calendar` — Red background, white text, opens Combined Calendar modal

### Amenity Card Grid

Layout: 3 cards per row, responsive card grid.

**Card Structure** (per amenity):
| Element | Description |
|---------|-------------|
| Photo | Square amenity photo, fills top half of card |
| Amenity Name | Blue/teal link text, clickable (navigates to amenity detail) |
| Instruction Message | Full-text instructions including time slots, guest limits, fees, rules |
| Booking Fee | `Booking Fee: $ {amount}` |
| Damage Deposit Fee | `Damage Deposit Fee: $ {amount}` |
| Book button | Blue outline button — navigates to `/booking/{amenity_id}/{building_id}` |
| View button | Blue outline button — navigates to `/view-amenity/{amenity_id}` |

**Note**: BBQ 2 Bond has only a "View" button (no "Book" button). This may indicate a disabled/unavailable amenity.

**Note**: Elevator Bond shows a different fee structure on the card:
- Move-In Related Booking Fee: $50
- Move-Out Related Booking Fee: $50
- Delivery Related Booking Fee: $50
- Move-In Related Damage Deposit Fee: $250
- Move-Out Related Damage Deposit Fee: $500
- Delivery Related Damage Deposit Fee: $250

---

## 2. All 7 Amenities — Complete Data

### 2.1 BBQ Bond (ID: 153)
| Field | Value |
|-------|-------|
| Active | Yes |
| Max Guests | 4 people |
| Time Limit | 2 hours |
| Operating Hours | 11:00 AM – 11:00 PM |
| Time Slots | 6 slots: 11:00-13:00, 13:00-15:00, 15:00-17:00, 17:00-19:00, 19:00-21:00, 21:00-23:00 |
| Booking Fee | $0 |
| Damage Deposit | $0 |
| Rules Document | Yes (downloadable) |
| Book Button | Yes |

### 2.2 BBQ 2 Bond (ID: 154)
| Field | Value |
|-------|-------|
| Active | Yes (assumed — has View button) |
| Max Guests | 4 people |
| Time Limit | 2 hours |
| Operating Hours | 11:00 AM – 11:00 PM |
| Time Slots | 6 slots (same as BBQ Bond) |
| Booking Fee | $0 |
| Damage Deposit | $0 |
| Book Button | **No** — only View button available |

### 2.3 Billiard Room Bond (ID: 155)
| Field | Value |
|-------|-------|
| Active | Yes |
| Max Guests | 4 people |
| Time Limit | 2 hours |
| Operating Hours | 11:00 AM – 11:00 PM |
| Time Slots | 6 slots (same as BBQ Bond) |
| Booking Fee | $0 |
| Damage Deposit | $0 |
| Book Button | Yes |

### 2.4 Elevator Bond (ID: 156)
| Field | Value |
|-------|-------|
| Active | Yes |
| Is Elevator | **Yes** (special amenity type) |
| Operating Hours (Mon–Fri) | 9:00 AM – 9:00 PM |
| Operating Hours (Sat) | 9:00 AM – 4:00 PM |
| Operating Hours (Sun/Holidays) | **No bookings allowed** |
| Time Slots (Mon–Fri) | 3 slots: 9:00-12:00, 13:00-16:00, 18:00-21:00 |
| Time Slots (Sat) | 2 slots: 9:00-12:00, 13:00-16:00 |
| Booking Fee (all types) | $50 |
| Damage Deposit (Move-In) | $250 |
| Damage Deposit (Move-Out) | $500 |
| Damage Deposit (Delivery) | $250 |
| Stat Holidays | Not allowed |
| Rules Document | "TSCC 2584 Elevator agreement.pdf" (downloadable) |
| Online Payments | Yes (Stripe integration) |
| Book Button | Yes |

### 2.5 Guest Suite Bond (ID: 157)
| Field | Value |
|-------|-------|
| Active | Yes |
| Booking Fee | $200 |
| Damage Deposit | $250 |
| Rules Document | Yes (downloadable) |
| Payment | Cash or E-transfer to bondconcierge@royalcas.ca |
| Book Button | Yes |

### 2.6 Party Room Bond (ID: 158)
| Field | Value |
|-------|-------|
| Active | Yes |
| Booking Fee | $120 |
| Damage Deposit | $1,000 |
| Security Guard Required | Yes, for 11+ people |
| Guard Fee (min 4 hrs) | $106.20 + HST = $120.00 |
| Guard Additional Hour | $26.55 + HST |
| Guard Premium Rate | $52.50/hr if payment not received within 24 hours |
| Payment Methods | Personal or certified checks payable to TSCC 2584; cash or E-transfer for non-refundable fee + guard fee |
| Rules Document | "TSCC 2584 Party Room Rental Agreement - Revised May 2025.pdf" |
| Online Payments | Yes (Stripe integration) |
| Book Button | Yes |

### 2.7 Golf and Video Game Room (ID: unknown)
| Field | Value |
|-------|-------|
| Active | Yes |
| Max Guests | 4 people |
| Time Limit | 2 hours |
| Operating Hours | 11:00 AM – 11:00 PM |
| Time Slots | 6 slots (same as BBQ Bond) |
| Booking Fee | $0 |
| Damage Deposit | $0 |
| Prerequisite | Agreement between Bond building and Resident must be signed and handed to Concierge |
| Book Button | Yes |

---

## 3. Amenity Detail Page (`/view-amenity/{amenity_id}`)

### Page Header
- **Tab**: "Amenity Information" (single tab)
- **Amenity Photo**: Circular, centered
- **Amenity Name**: Large heading next to photo
- **Action Buttons** (top-right):
  - `Edit` — Blue outline button
  - `Edits Made` — Blue outline button (audit trail)

### Section 1: General Amenity Introduction

| Field | Type | Example (BBQ Bond) |
|-------|------|-------------------|
| Active | Yes/No | Yes |
| Amenity Id | Auto-generated integer | 153 |
| Amenity Name | Text | BBQ Bond |
| Amenity Photo | Image (circular thumbnail) | Photo displayed |
| Rules Document | PDF file with Download button | Filename shown + Download |
| Instruction Message | Long text (displayed as block) | Full instruction text |

### Section 2: Price Related Information

**Standard Amenity (non-elevator)**:
| Field | Type | Example (BBQ Bond) |
|-------|------|-------------------|
| Damage Deposit | Currency ($) | 0 |
| Unit Fee | Currency ($) | 0 |
| Is booking allowed on stat holidays | Yes/No | Yes |
| If Booking is allowed on Statutory Holidays then please specify the booking fee | Currency ($) | 0 |
| Is this an elevator? | Yes/No | No |
| Deposit required for confirmed booking (In percentage) | Percentage | 100 |
| Percent Tax on Fees | Percentage | 0 |

**Elevator Amenity (Is this an elevator? = Yes)** — Additional fields:
| Field | Type | Example (Elevator Bond) |
|-------|------|------------------------|
| Move-In Related Unit Fee | Currency ($) | 50 |
| Move-In Related Damage Deposit | Currency ($) | 250 |
| Move-Out Related Unit Fee | Currency ($) | 50 |
| Move-Out Related Damage Deposit | Currency ($) | 500 |
| Delivery Related Unit Fee | Currency ($) | 50 |
| Delivery Related Damage Deposit | Currency ($) | 250 |

### Section 3: Payment Related Information

| Field | Type | Example |
|-------|------|---------|
| Allow online Payments | Yes/No | No (BBQ) / Yes (Elevator, Party Room) |
| Stripe public key | Text (masked in some) | pk_live_... |
| Stripe private key | Text (always masked) | *************** |
| Who pays transaction fee | Dropdown | management |
| Allow online Payments for Guard Fee | Yes/No | No (BBQ) / Yes (Party Room) |
| Stripe public key for Guard Fee Payments | Text | pk_live_... |
| Stripe private key for Guard Fee Payments | Text (masked) | *************** |

### Section 4: Booking Related Information

| Field | Type | Example (BBQ Bond) | Example (Elevator) |
|-------|------|-------------------|-------------------|
| Property Manager approval required for confirmed bookings | Yes/No | No | No |
| Site supervisor approval required for confirmed bookings | Yes/No | Yes | Yes |
| Default Booking Duration | Minutes | 60 | 60 |
| Maximum Booking Duration | Minutes | 120 | 180 |
| Maximum Advance Booking | Minutes | 524,160 (~364 days) | 524,160 |
| Warning Time Before Cancellation | Minutes | 1,440 (24 hrs) | 1,440 |
| Warning Text | Text | "Please pay the deposit by the cancellation time to keep your reservation." | "Please pay the damage deposit with-in 24 hours to avoid the cancellation." |
| Cancellation Time (minutes) | Minutes | 2,880 (48 hrs) | 2,880 |
| Cancellation Text | Text | "Please be advised the booking has been automatically cancelled since the payments were not received." | Same |
| Time under which resident/tenant has to make a payment in case booking is made under 44 hours or less | Minutes | 0 | 0 |
| Preauthorization time (minutes) | Minutes | 5,760 (4 days) | 5,760 |
| Preauthorization Text | Text | "Please be advised that you can now make damage deposit payments." | Same |
| Allow manual fee recording | Yes/No | Yes | Yes |
| Disable reminder emails | Yes/No | Yes (BBQ) | No (Elevator) |
| Allow multiple bookings per day | Yes/No | Yes | Yes |
| Reverse meaning of expiry | Yes/No | No | No |
| Amenity Price type | Dropdown | Flat | Flat |

### Section 5: Time Related Information

**Fixed Time Mode (BBQ, Billiard, Guest Suite, Party Room, Golf)**:
| Field | Type | Example |
|-------|------|---------|
| Fixed Start and End Time | Yes/No | Yes |
| Fixed Start Time | Time (HH:MM) | 11:00 |
| Fixed End Time | Time (HH:MM) | 23:00 |
| Flexible Start and End Time | Yes/No | No |

**Flexible Time Mode (Elevator)** — Per-day time slots:
| Field | Type | Example |
|-------|------|---------|
| Fixed Start and End Time | Yes/No | No |
| Fixed Start Time | Time (HH:MM) | 09:00 |
| Fixed End Time | Time (HH:MM) | 21:00 |
| Flexible Start and End Time | Yes/No | Yes |
| Monday Start Time 1 | Time | 09:00 |
| Monday Start Time 2 | Time | 13:00 |
| Monday Start Time 3 | Time | 18:00 |
| Monday Start Time 4 | Time | (empty) |
| Tuesday Start Time 1-4 | Time | 09:00, 13:00, 18:00, (empty) |
| Wednesday Start Time 1-4 | Time | 09:00, 13:00, 18:00, (empty) |
| Thursday Start Time 1-4 | Time | 09:00, 13:00, 18:00, (empty) |
| Friday Start Time 1-4 | Time | 09:00, 13:00, 18:00, (empty) |
| Saturday Start Time 1-4 | Time | 09:00, 13:00, (empty), (empty) |
| Sunday Start Time 1-4 | Time | (all empty — no bookings) |

**Blackout Times (Elevator — per day)**:
| Field | Type | Example |
|-------|------|---------|
| Monday Blackout Start Time | Time | 21:05 |
| Monday Blackout End Time | Time | 23:59 |
| Tuesday–Friday Blackout | Time | 21:05 to 23:59 |
| Saturday Blackout Start Time | Time | 16:05 |
| Saturday Blackout End Time | Time | 23:59 |
| Sunday Blackout Start Time | Time | 00:01 |
| Sunday Blackout End Time | Time | 23:59 (full day blocked) |

### Section 6: Extra Guard Related Information

| Field | Type | Example (BBQ) | Example (Party Room) |
|-------|------|--------------|---------------------|
| Extra Guard May be Required? | Yes/No | No | Yes |
| Number of Guests After which extra guard is required | Integer | 0 | 10 |
| Guard Fee (in dollars) | Currency ($) | 0 | 26.55 |
| Tax on Guard Fee (In Percent) | Percentage | 0 | 13 |
| Statutory Fee Percent | Percentage | 0 | 2.5144 |
| Number of additional Hours for which Guard may be required (Other than the booking duration) | Integer | 0 | 0 |

### Section 7: Comments

| Field | Type | Example |
|-------|------|---------|
| Comments | Text | Free-text admin comments |

---

## 4. Amenity Booking Calendar Page (`/booking/{amenity_id}/{building_id}`)

### Page Header
- **Title**: "Amenity Booking"
- **Amenity Name**: Displayed below title (e.g., "BBQ Bond", "Elevator Bond")
- **Action Button**: `New Booking` — Blue outline button (top-right), opens New Booking modal

### Calendar Component

**Navigation Controls**:
| Element | Description |
|---------|-------------|
| Today button | Jump to current date |
| Back button | Navigate to previous period |
| Next button | Navigate to next period |
| Month/Year label | "March 2026" centered |

**View Modes** (5 modes, button group top-right):
| Mode | Description |
|------|-------------|
| **Month** | Default view, 7-column grid (Sun–Sat), shows booking pills |
| **Week** | Single week view with hourly breakdown |
| **Work Week** | Mon–Fri only view |
| **Day** | Single day with hourly timeline |
| **Agenda** | List view of upcoming bookings |

**Booking Entry Format** (pills on calendar):
- Standard: `Unit: {unit_number}, {Paid/Unpaid}, {HH:MM} to {HH:MM}`
- Color coding:
  - **Green pill**: Paid booking
  - **Yellow/Beige pill**: Unpaid booking
- "+X more" link when too many bookings on one day

**Calendar Behavior**:
- Today's date is highlighted with blue background
- Clicking a booking pill likely shows booking details
- Each pill shows unit number, payment status, and time range

---

## 5. New Booking Modal

Opens when clicking "New Booking" button on the calendar page. Modal dialog overlays the calendar.

### Standard Amenity Form (BBQ, Billiard, Guest Suite, Party Room, Golf)

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Booking Date | Date picker (DD-MM-YYYY format) | Yes | Today's date | X button to clear |
| Pick Timeslot (24 Hour Format) | Dropdown | Yes* | "Pick Timeslot" placeholder | Options load after date is selected; populated from amenity time slot configuration |
| Select Building | Dropdown (combobox) | Yes* | "Bond" (auto-selected) | Building selector |
| Related Unit | Dropdown (combobox) | No | "Related Unit:" placeholder | Lists all units in the building |
| On Behalf of | Dropdown (combobox) | No | "On Behalf of:" placeholder | Lists residents in the selected unit |
| Choose a payment method | Radio buttons | Yes | "Manual" selected | Options: **Manual**, **No Fee** |
| Event Details | Textarea | No | "Event Details" placeholder | Free-text description |
| **Next** button | Submit | — | — | Centered at bottom of form |

### Elevator Amenity Form (Additional/Different Fields)

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Rules and Regulations | Download link with icon | — | — | Links to PDF agreement document |
| Allowed start times display | Info text | — | — | Shows "Allowed start times today: [09:00, 13:00, 18:00]" and "Blackout time: 21:05 to 23:59" |
| Booking Start Time (24-Hour Format "DD-MM-YYYY") | DateTime picker | Yes | Empty with calendar icon | Replaces "Booking Date" + "Pick Timeslot" |
| Booking End Time (24-Hour Format "DD-MM-YYYY") | DateTime picker | Yes | Empty with calendar icon | New field (not on standard form) |
| Select Building | Dropdown | Yes* | "Bond" | Same as standard |
| Related Unit | Dropdown | No | "Related Unit:" | Same as standard |
| On Behalf of | Dropdown | No | "On Behalf of:" | Same as standard |
| Purpose of booking this amenity? | Radio buttons | Yes | None selected | Options: **Move In**, **Move Out**, **Delivery** |
| Choose a payment method | Radio buttons | Yes | "Manual" selected | Options: **Manual**, **No Fee**, **Online** (3rd option for Stripe-enabled amenities) |
| Event Details | Textarea | No | "Event Details" | Same as standard |
| **Next** button | Submit | — | — | Same as standard |

---

## 6. Booking Detail Page (`/booking-info/{booking_id}/{amenity_id}`)

### Page Header
- **Calendar icon**: Large circular icon (top-left)
- **Action Buttons** (top-right):
  - `Edit` — Blue outline button
  - `Cancel` — Blue outline button

### Booking Information Table

| Field | Type | Example |
|-------|------|---------|
| Booking Id | Auto-generated integer | 212736 |
| Amenity Name | Text | BBQ Bond |
| Unit Number | Integer | 9999 |
| Amenity Id | Integer | 153 |
| Payment Status | Text | Paid |
| Approved by administrator | Yes/No | Yes |
| Booking Confirmed | Yes/No + note | Yes + "(Note: Usually bookings are not confirmed till they have been approved by an administrator [if needed] and paid in full)" |
| **Payments** | Sub-section | — |
| — Booking Charges Paid | Currency (CAD) | CAD $0 |
| — Damage Deposit Paid | Currency (CAD) | CAD $0 |
| — Guard Fee Paid | Currency (CAD) | CAD $0 |
| Booking Start Time | DateTime (DD-MM-YYYY HH:MM) | 14-03-2026 11:00 |
| Booking End Time | DateTime (DD-MM-YYYY HH:MM) | 14-03-2026 13:00 |
| Booking By | Text (staff name) | Lasya |
| Booking on Behalf of | Text (resident name) | (empty if self-booked) |
| Details | Text | Free-text event details |
| Payment Method | Text | manual |
| Canceled | Yes/No | No |
| Canceled By | Text | (empty if not canceled) |
| Payment Warning Email Sent | Yes/No | No |
| Comments | Text | (free-text) |
| Plate | Text | (license plate, empty for non-elevator) |
| Created On | DateTime (DD-MM-YYYY HH:MM) | 13-03-2026 14:12 |
| Signature | Image/blob | (empty — may be premium feature) |

---

## 7. All Bookings Page (`/all-bookings`)

### Page Header
- **Title**: "ALL BOOKINGS" (uppercase)
- **Tip Text**: "Tips: If you select a different amenity from dropdown then search results will update automatically. But if you change any other search parameters (e.g Start and End Dates) then you must click search button on the right side"

### Filters Bar

| Filter | Type | Options/Default |
|--------|------|-----------------|
| Building | Combobox dropdown | "Bond" (only option for single-building) |
| Filter by Amenity | Combobox dropdown | All, BBQ Bond, BBQ 2 Bond, Billiard Room Bond, Elevator Bond, Guest Suite Bond, Party Room Bond, Golf and Video Game Room |
| Status | Combobox dropdown | **Active**, Cancelled |
| Start Date | Date picker (DD-MM-YYYY) | Auto-populated (e.g., 11-02-2026) |
| End Date | Date picker (DD-MM-YYYY) | Auto-populated (e.g., 28-03-2026) |

### Action Buttons

| Button | Style | Action |
|--------|-------|--------|
| Clear Search | Blue outline | Resets all filters |
| Search | Blue outline | Executes search with current filters |
| Print | Blue outline with printer icon | Prints current results |
| Download PDF | Green outline with download icon | Exports results as PDF |

### Results Table

**Columns** (13 columns, ag-grid):
| Column | Type | Sortable |
|--------|------|----------|
| Start Time | DateTime (DD-MM-YYYY HH:MM) | Yes |
| End Time | DateTime (DD-MM-YYYY HH:MM) | Yes |
| View | Link ("View") | No |
| Facility | Text (amenity name) | Yes |
| Unit | Integer | Yes |
| Booking Fee | Currency | Yes |
| Damage Deposit | Currency | Yes |
| Type | Text (Manual/Online) | Yes |
| Canceled | Yes/No | Yes |
| Booked By | Text (staff name) | Yes |
| Payment Completed | Yes/No | Yes |
| Created On | DateTime | Yes |
| Booking Id | Integer | Yes |

**Row Format**: Each booking is one row. "View" link navigates to `/booking-info/{booking_id}/{amenity_id}`.

### Pagination

| Element | Details |
|---------|---------|
| Rows per page dropdown | Options: 5 rows, 10 rows, 20 rows, 25 rows, 50 rows, 100 rows |
| Default | 10 rows |
| Page number input | Editable (default: 1) |
| Previous/Next buttons | Standard pagination navigation |

---

## 8. Combined Calendar Modal

Opens from "Check Combined Calendar" button on the amenities listing page. Full-screen modal overlay.

### Legend (Color-Coded by Amenity Category)

| Color | Category | Amenities |
|-------|----------|-----------|
| Blue (solid) | Gym | (not currently used — no gym amenity exists) |
| Teal/Cyan | Party Room | Party Room Bond |
| Yellow/Gold | Guest Suite | Guest Suite Bond |
| Red/Orange | Elevator | Elevator Bond |
| Green | Other | BBQ Bond, BBQ 2 Bond, Billiard Room Bond, Golf and Video Game Room |

### Calendar

- Same calendar component as individual amenity calendars (Month/Week/Work Week/Day/Agenda)
- Same navigation (Today/Back/Next)
- **Booking Entry Format**: `{Amenity Name (truncated)}, Unit: ({unit_number}), Status: {Paid/Unpaid}`
- All amenities displayed simultaneously, color-coded
- "+X more" overflow links for busy days
- Close button (X) in top-right of modal

---

## 9. Create New Amenity

Accessible via the sidebar "Amenities" link which points to `/new-amenity`.

**Note**: This page was not explored in detail in this session. The URL suggests a form for creating new amenities, likely mirroring the fields in the View/Edit Amenity Information page (Section 3).

---

## 10. URL Patterns

| Page | URL Pattern |
|------|-------------|
| Amenity Listing | `/search-amenities` |
| Create New Amenity | `/new-amenity` |
| View Amenity Detail | `/view-amenity/{amenity_id}` |
| Amenity Booking Calendar | `/booking/{amenity_id}/{building_id}` |
| All Bookings List | `/all-bookings` |
| Booking Detail | `/booking-info/{booking_id}/{amenity_id}` |

---

## 11. Concierge Design Implications

### Strengths to Retain
1. **Per-amenity calendar view** — intuitive visual scheduling
2. **Combined calendar with color coding** — brilliant for front desk to see all bookings at once
3. **5 calendar view modes** — Month/Week/Work Week/Day/Agenda covers all use cases
4. **Rules Document per amenity** — downloadable PDF agreement, critical for legal compliance
5. **Flexible vs Fixed time slots** — elevator needs different scheduling than BBQ
6. **Per-day time slot configuration** — Monday-Sunday individual start times + blackout windows
7. **Guard fee automation** — automatic guard requirement above guest threshold with tax calculation
8. **Approval workflow** — property manager and/or site supervisor approval toggles
9. **Payment status tracking** — Paid/Unpaid visible on calendar pills, multiple payment tracking (booking + deposit + guard)
10. **Cancellation automation** — warning text, cancellation time, auto-cancel if unpaid
11. **Preauthorization system** — timed payment authorization windows
12. **Stripe integration** — online payments for elevator and party room
13. **Booking on behalf of** — staff can book for residents
14. **Purpose tracking for elevator** — Move In/Move Out/Delivery distinction affects fees

### Gaps to Address in Concierge
1. **No recurring bookings** — can't set weekly billiard room reservation
2. **No waitlist** — if a slot is taken, no way to queue
3. **No conflict detection** — must manually check calendar before booking
4. **Instruction Message is unformatted** — raw text with asterisks used for bold formatting; should use rich text editor
5. **No photo gallery** — single photo per amenity; should support multiple photos
6. **No capacity tracking** — guest count is in instruction text, not a structured field
7. **No resident self-service booking review** — unclear if residents can see their own bookings
8. **Guard fee calculation is manual** — should auto-calculate based on duration and guest count
9. **No deposit return tracking** — records deposit paid but not deposit returned
10. **Single building filter only** — Combined Calendar doesn't aggregate across buildings in multi-building properties
11. **Booking entry doesn't show amenity name** — on individual calendar, pills show "Unit: X, Paid, HH:MM to HH:MM" but not the amenity name (needed on Combined Calendar only)
12. **No check-in/check-out tracking** — no way to record actual usage vs. booked time
13. **PDF export only** — should also support Excel export for bookings list
14. **No SMS/push notification** — booking confirmations and reminders appear to be email-only
15. **Signature field exists but appears empty** — may be a premium/disabled feature

### Architectural Notes
- Calendar component appears to be react-big-calendar or similar React calendar library
- Grid uses ag-grid for the All Bookings table
- Stripe integration is per-amenity (each amenity can have its own Stripe keys)
- Payment flow: booking created → preauthorization email → payment window → warning email → auto-cancel if unpaid
- Two approval paths: Property Manager approval OR Site Supervisor approval (independent toggles)
- "Amenity Price type: Flat" suggests there may be other price types (hourly? per-person?) — only Flat observed
- "Reverse meaning of expiry: No" — unclear what this does when set to Yes; possibly inverts deposit refund logic

---

## 12. Data Model (Deduced)

```
Amenity
├── amenity_id (integer, auto-generated)
├── building_id → Building
├── amenity_name (string, e.g., "BBQ Bond", "Elevator Bond")
├── active (boolean)
├── amenity_photo (image, circular thumbnail)
├── instruction_message (text, rich text)
├── rules_document (file, PDF)
├── comments (text)
├── is_elevator (boolean, default: false)
├── amenity_price_type (enum: Flat, possibly others)
├── pricing → AmenityPricing
├── payment_config → AmenityPaymentConfig
├── booking_config → AmenityBookingConfig
├── time_config → AmenityTimeConfig
├── guard_config → AmenityGuardConfig
└── bookings[] → Booking

AmenityPricing
├── unit_fee (currency, $)
├── damage_deposit (currency, $)
├── stat_holiday_booking_allowed (boolean)
├── stat_holiday_booking_fee (currency, $)
├── deposit_required_percentage (percentage, e.g., 100)
├── percent_tax_on_fees (percentage)
├── (elevator-only fields below)
├── move_in_unit_fee (currency, $)
├── move_in_damage_deposit (currency, $)
├── move_out_unit_fee (currency, $)
├── move_out_damage_deposit (currency, $)
├── delivery_unit_fee (currency, $)
└── delivery_damage_deposit (currency, $)

AmenityPaymentConfig
├── allow_online_payments (boolean)
├── stripe_public_key (string)
├── stripe_private_key (string, masked)
├── who_pays_transaction_fee (enum: management, resident)
├── allow_online_payments_guard_fee (boolean)
├── stripe_public_key_guard_fee (string)
└── stripe_private_key_guard_fee (string, masked)

AmenityBookingConfig
├── pm_approval_required (boolean)
├── supervisor_approval_required (boolean)
├── default_booking_duration (integer, minutes)
├── maximum_booking_duration (integer, minutes)
├── maximum_advance_booking (integer, minutes)
├── warning_time_before_cancellation (integer, minutes)
├── warning_text (text)
├── cancellation_time (integer, minutes)
├── cancellation_text (text)
├── short_notice_payment_time (integer, minutes)
├── preauthorization_time (integer, minutes)
├── preauthorization_text (text)
├── allow_manual_fee_recording (boolean)
├── disable_reminder_emails (boolean)
├── allow_multiple_bookings_per_day (boolean)
└── reverse_meaning_of_expiry (boolean)

AmenityTimeConfig
├── fixed_start_and_end_time (boolean)
├── fixed_start_time (time, HH:MM)
├── fixed_end_time (time, HH:MM)
├── flexible_start_and_end_time (boolean)
├── time_slots[] → TimeSlot (per day-of-week, up to 4 per day)
└── blackout_times[] → BlackoutTime (per day-of-week)

TimeSlot
├── day_of_week (enum: Monday–Sunday)
├── slot_number (integer, 1–4)
└── start_time (time, HH:MM)

BlackoutTime
├── day_of_week (enum: Monday–Sunday)
├── start_time (time, HH:MM)
└── end_time (time, HH:MM)

AmenityGuardConfig
├── extra_guard_required (boolean)
├── guest_threshold_for_guard (integer)
├── guard_fee (currency, $)
├── tax_on_guard_fee (percentage)
├── statutory_fee_percent (percentage)
└── additional_guard_hours (integer)

Booking
├── booking_id (integer, auto-generated)
├── amenity_id → Amenity
├── amenity_name (string)
├── unit_number (integer)
├── booking_start_time (datetime)
├── booking_end_time (datetime)
├── booking_by → User (staff)
├── booking_on_behalf_of → User (resident, nullable)
├── event_details (text)
├── payment_status (enum: Paid, Unpaid)
├── payment_method (enum: Manual, No Fee, Online)
├── approved_by_administrator (boolean)
├── booking_confirmed (boolean)
├── booking_charges_paid (currency, CAD)
├── damage_deposit_paid (currency, CAD)
├── guard_fee_paid (currency, CAD)
├── canceled (boolean, default: false)
├── canceled_by (string, nullable)
├── payment_warning_email_sent (boolean)
├── plate (string, nullable — elevator bookings)
├── purpose (enum: Move In, Move Out, Delivery — elevator only)
├── signature (blob, nullable)
├── comments (text)
└── created_on (datetime)
```

---

*Total fields documented: ~120+ across all pages*
*Pages covered: Amenity listing, Amenity detail (7 config sections), Booking calendar, New Booking modal (standard + elevator variants), Booking detail, All Bookings list, Combined Calendar*
