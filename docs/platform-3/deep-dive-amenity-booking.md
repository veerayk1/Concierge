# Amenity Booking — Granular Deep Dive

Field-level documentation of every element in Condo Control's Amenity Booking module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/amenity/landing/`
**Sidebar menu**: Amenity Booking (calendar icon)
**Breadcrumb**: Home > Amenity Booking
**Page title**: "Amenity Booking | Condo Control"

The module has **3 tabs**:
1. **Calendar View** (`#tab-2`) — Calendar with pending approvals and legend
2. **Create Booking** (`#tab-1`) — Hero booking bar + amenity cards (default landing)
3. **All Bookings** (`#tab-3`) — Filtered list of all bookings

**Note**: The default landing tab is "Create Booking" (tab-1), but the tab order displayed is Calendar View | Create Booking | All Bookings.

---

## 2. Create Booking Tab (Default Landing)

**Tab**: `#tab-1`
**Default on load**: Yes — this is the page shown when navigating to `/amenity/landing/`

### 2.1 Hero Banner Booking Bar

Full-width banner image (swimming pool/amenity area photo) with overlay booking form.

**Banner text**: "What would you like to book today?"

| # | Field | Type | ID/Name | Default Value | Options/Behavior |
|---|-------|------|---------|---------------|------------------|
| 1 | Amenity Group | Select dropdown | `SelectedAmenityGroup` | "Billiard Room" (first option) | Billiard Room, Elevator, Party Room, Squash Court, Tennis Court |
| 2 | Pick Your Date | Text input (jQuery UI datepicker) | `txtBookingDate` / `BookingDate` | Empty | Placeholder: "Pick Your Date". Class: `hasDatepicker`. Opens jQuery UI calendar on click/focus |
| 3 | See Available Options | Select dropdown | `SelectedAmenityID` (header variant) | "See Available Options" | Populates dynamically after amenity + date are selected. Shows available time slots for the selected amenity on the chosen date |
| 4 | Book Now | Button | — | — | Teal button. Submits the hero booking bar form. Navigates to amenity detail page for the selected option |

**Hero booking bar behavior**:
- Step 1: Select amenity from dropdown
- Step 2: Pick a date (jQuery UI datepicker calendar popup)
- Step 3: "See Available Options" dropdown populates with available slots
- Step 4: Click "Book Now" to proceed
- Date format displayed: `M/DD/YYYY HH:MM` (e.g., "4/15/2026 00:00")

### 2.2 Search Bar

Below the hero banner, centered.

| # | Field | Type | Placeholder | Button |
|---|-------|------|-------------|--------|
| 1 | Search | Text input | "What are you looking for?" | "Search" (teal button, `btn-primary`) |

**Behavior**: Filters the amenity cards below by name.

### 2.3 Amenity Cards Grid

Cards arranged in a horizontal row (4 visible, scrollable if more). Each card follows an identical layout.

#### Card Layout Template

```
┌──────────────────────────┐
│  [placeholder image]     │
│                          │
│  Amenity Name    Fee     │
│                          │
│  [Book Now]              │
└──────────────────────────┘
```

#### Observed Amenity Cards

| # | Amenity Name | Amenity ID | Fee Display | Fee Type | Book Now URL |
|---|-------------|------------|-------------|----------|--------------|
| 1 | Billiard Room | 5733 | No Fee | — | `/amenity/amenity-details/5733` |
| 2 | Elevator | 5696 | No Fee | — | `/amenity/amenity-details/5696` |
| 3 | Party Room | 5697 | $100.00 | Flat rate per reservation | `/amenity/amenity-details/5697` |
| 4 | Squash Court | 5734 | No Fee | — | `/amenity/amenity-details/5734` |
| 5 | Tennis Court | 5735 | No Fee | — | `/amenity/amenity-details/5735` |

**Card elements**:
- **Image**: Placeholder image (gray image icon). Appears to support custom amenity photos but none uploaded for this property
- **Amenity Name**: Left-aligned text below image
- **Fee**: Right-aligned text. Shows "No Fee" or "$X.XX" + fee type description
- **Book Now button**: Teal `btn-primary btn-largeFont`. Links to `/amenity/amenity-details/{amenityId}`

**Card behavior**:
- Cards are not clickable — only the "Book Now" button is interactive
- Fee type displays below fee amount when present (e.g., "Flat rate per reservation")
- Cards have a light border with rounded corners

---

## 3. Amenity Detail / Booking Page

**URL**: `/amenity/amenity-details/{amenityId}`
**Example**: `/amenity/amenity-details/5697` (Party Room)
**Breadcrumb**: Home > Amenity Booking
**Page title**: "Amenity Booking | Condo Control"

### 3.1 Hero Banner

Full-width banner with amenity-specific image (or default pool image) and amenity name overlay.

| # | Element | Description |
|---|---------|-------------|
| 1 | Background image | Amenity-specific photo (party room/pool area). Full-width |
| 2 | Amenity name | White text overlay, centered: "Party Room" |

### 3.2 Amenity Info (Left Column)

| # | Element | Description |
|---|---------|-------------|
| 1 | Amenity name | "Party Room" — H2 heading |
| 2 | Back to List Page | Teal button. Returns to `/amenity/landing/` |
| 3 | Terms and conditions | Section heading. Content area below (empty for Party Room — no T&C configured) |

### 3.3 Create a Booking Form (Right Column)

Sidebar card with heading "Create a booking".

| # | Field | Type | ID/Name | Default Value | Description |
|---|-------|------|---------|---------------|-------------|
| 1 | Select Date | Text input (datepicker) | `StartDate` | Today's date (MM/DD/YYYY, e.g., "03/13/2026") | jQuery UI datepicker. Format: MM/DD/YYYY |
| 2 | Start Time | Text input | `StartTimeString` | Amenity opening time (e.g., "10:00 AM") | Time picker. Format: HH:MM AM/PM |
| 3 | End Time | Text input | `EndTimeString` | Amenity closing time (e.g., "11:30 PM") | Time picker. Format: HH:MM AM/PM |
| 4 | Book Now | Submit button | `btnBookNow` | — | Teal button. Submits booking request |

**Hidden form fields**:

| # | Field | ID/Name | Value (observed) | Description |
|---|-------|---------|------------------|-------------|
| 1 | BookingNowIsEnabled | `BookingNowIsEnabled` | True | Feature flag for instant booking |
| 2 | AmenityID | `AmenityID` | 5697 | Internal amenity identifier |
| 3 | BookingStyleID | `BookingStyleID` | 3 | Booking style type (3 = unknown style name) |
| 4 | PreSelectedDateAndTime | `PreSelectedDateAndTime` | (empty) | Pre-populated when arriving from hero bar |
| 5 | StripeApiKeyPublic | `StripeApiKeyPublic` | (masked) | Stripe public key for payment processing |
| 6 | OffsiteOwnerReadOnlyMode | `OffsiteOwnerReadOnlyMode` | False | Whether offsite owners have read-only access |
| 7 | WorkspaceID | `WorkspaceID` | 12039 | Property workspace identifier |
| 8 | localDatePlusOneHour | `localDatePlusOneHour` | 10:00 PM | Calculated time value |
| 9 | localDatePlusTwoHour | `localDatePlusTwoHour` | 11:00 PM | Calculated time value |
| 10 | localDatePlusOneDay | `localDatePlusOneDay` | 03/14/2026 | Calculated date value |

**Note**: Stripe integration present — platform supports credit card payments for amenity fees, but this property uses "Cheque" as payment method.

### 3.4 Pricing & Deposit Structure Card

Below the booking form, right column.

| # | Field | Value (Party Room) | Description |
|---|-------|--------------------|-------------|
| 1 | Amenity Fee | $100.00/Flat rate per reservation | Usage fee. Format: $amount/fee type |
| 2 | Security Deposit | $350.00 | Refundable deposit amount |
| 3 | Payment Method | Cheque | Accepted payment method |
| 4 | Cancellation | Cancel and refund up until the start of booking | Cancellation policy text |

**Note**: This section only appears for amenities with fees. "No Fee" amenities (Billiard Room, Squash Court, Tennis Court) show "No Fee" with Cancellation "N/A". Elevator shows $150.00 fee.

### 3.5 Hours of Operations Card

Below pricing card, right column.

| # | Field | Value (Party Room) | Description |
|---|-------|--------------------|-------------|
| 1 | Schedule | Every day from 10:00 AM to 11:30 PM | Operating hours. Format: frequency + time range |

**Note**: Start Time and End Time in the booking form default to these hours of operation values.

### 3.6 Per-Amenity Complete Configurations

#### Billiard Room (ID: 5733)

| Property | Value |
|----------|-------|
| **URL** | `/amenity/amenity-details/5733` |
| **BookingStyleID** | 1 |
| **Amenity Fee** | No Fee |
| **Security Deposit** | — |
| **Payment Method** | — |
| **Cancellation** | N/A |
| **Hours** | Available every day from 12:00 AM to 11:59 PM |
| **Terms & Conditions** | Empty (heading only) |
| **Booking Form Type** | Start Date + Start Time (dropdown) + End Date + End Time (dropdown) |
| **Time Slot Interval** | 30-minute increments (12:00 AM through 11:59 PM) |
| **Blocked Hours** | Sunday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM; Monday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM; Tuesday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM; Wednesday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM; Thursday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM; Friday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM; Saturday 12:01 AM–9:59 AM, 9:01 PM–11:59 PM |
| **Effective Available Hours** | Every day 10:00 AM–9:00 PM |

#### Elevator (ID: 5696)

| Property | Value |
|----------|-------|
| **URL** | `/amenity/amenity-details/5696` |
| **BookingStyleID** | 1 |
| **Amenity Fee** | $150.00 |
| **Security Deposit** | $150.00 |
| **Payment Method** | Cheque |
| **Cancellation** | Cancel and refund up until the start of booking |
| **Hours** | Available every day from 12:00 AM to 11:59 PM |
| **Terms & Conditions** | Lengthy agreement text — covers MTCC 872 move/delivery policies, $150 deposit requirements, elevator usage rules, corridor fire code compliance. Includes note about Wednesday bulk item disposal 6:00–8:00 PM |
| **Booking Form Type** | Start Date + Start Time (dropdown) + End Date + End Time (dropdown) |
| **Options** | Radio button: "Elevator Deposti" (note typo: "Deposti" not "Deposit") |
| **Blocked Hours** | Sunday ALL DAY (12:00 AM–11:59 PM); Monday 12:01 AM–8:59 AM, 8:01 PM–11:59 PM; Tuesday 12:01 AM–8:59 AM, 8:01 PM–11:59 PM; Wednesday 12:01 AM–8:59 AM, 8:01 PM–11:59 PM; Thursday 12:01 AM–8:59 AM, 8:01 PM–11:59 PM; Friday 12:01 AM–8:59 AM, 8:01 PM–11:59 PM; Saturday 12:00 AM–8:59 AM, 9:01 PM–11:59 PM |
| **Effective Available Hours** | Mon–Fri 9:00 AM–8:00 PM; Saturday 9:00 AM–9:00 PM; Sunday CLOSED |

#### Party Room (ID: 5697)

| Property | Value |
|----------|-------|
| **URL** | `/amenity/amenity-details/5697` |
| **BookingStyleID** | 3 |
| **Amenity Fee** | $100.00/Flat rate per reservation |
| **Security Deposit** | $350.00 |
| **Payment Method** | Cheque |
| **Cancellation** | Cancel and refund up until the start of booking |
| **Hours** | Every day from 10:00 AM to 11:30 PM |
| **Terms & Conditions** | Empty (heading only) |
| **Booking Form Type** | Single Date + Start Time (text input) + End Time (text input) — NOT dropdowns |
| **Blocked Hours** | None |
| **Effective Available Hours** | Every day 10:00 AM–11:30 PM |

**BookingStyleID Difference**: Party Room (style 3) uses text inputs for time, single date picker. Billiard/Elevator/Squash/Tennis (style 1) use start/end date pickers + time dropdowns with 30-min increments.

#### Squash Court (ID: 5734)

| Property | Value |
|----------|-------|
| **URL** | `/amenity/amenity-details/5734` |
| **BookingStyleID** | 1 |
| **Amenity Fee** | No Fee |
| **Security Deposit** | — |
| **Payment Method** | — |
| **Cancellation** | N/A |
| **Hours** | Available every day from 12:00 AM to 11:59 PM |
| **Terms & Conditions** | Empty (heading only) |
| **Booking Form Type** | Start Date + Start Time (dropdown) + End Date + End Time (dropdown) |
| **Blocked Hours** | None |
| **Effective Available Hours** | 24/7 |

#### Tennis Court (ID: 5735)

| Property | Value |
|----------|-------|
| **URL** | `/amenity/amenity-details/5735` |
| **BookingStyleID** | 1 |
| **Amenity Fee** | No Fee |
| **Security Deposit** | — |
| **Payment Method** | — |
| **Cancellation** | N/A |
| **Hours** | Available every day from 12:00 AM to 11:59 PM |
| **Terms & Conditions** | Empty (heading only) |
| **Booking Form Type** | Start Date + Start Time (dropdown) + End Date + End Time (dropdown) |
| **Blocked Hours** | None |
| **Effective Available Hours** | 24/7 |

### 3.7 Booking Form Validation Messages

Two hidden validation labels on every amenity detail page:

| # | Message | Trigger |
|---|---------|---------|
| 1 | "Amenity is not available for the selected date and time. Click to pick another time." | When selected time falls within blocked hours |
| 2 | "Amenity is not available for the selected date and time. The following amenities are available:" | When unavailable, shows alternative amenities |

---

## 4. Calendar View Tab

**Tab**: `#tab-2`
**URL fragment**: `#tab-2`

### 4.1 Requests Pending Approval Section

Displayed above the calendar when pending requests exist.

**Section heading**: "Requests Pending Approval" (warning/alert icon, teal)

**Bulk action button**: "Approve Selected" (teal `btn-primary`). Approves all checked bookings.

#### Pending Approvals Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | Action | No | Checkbox (for bulk approve) + View Details icon (calendar icon, links to `javascript:ViewAmenityBookingDetails(id)`) + Approve icon (checkmark, links to `/amenity/approve/{id}`) |
| 2 | Amenity | Yes (▼▲) | Amenity name (e.g., "Party Room") |
| 3 | Who | Yes (▼▲) | "LastName, FirstName (UnitNumber)" format (e.g., "Vishnu, Kadunthayil (1402)") |
| 4 | Start Date | Yes (▼▲) | Format: YYYY/MM/DD HH:MM AM/PM (e.g., "2026/04/03 10:00 AM") |
| 5 | End Date | Yes (▼▲) | Format: YYYY/MM/DD HH:MM AM/PM |
| 6 | Created Date | Yes (▼▲) | Format: YYYY/MM/DD HH:MM AM/PM |

**Action column icons** (per row):
1. ☐ Checkbox — for batch selection with "Approve Selected"
2. 📋 View Details — calendar/document icon. Calls `javascript:ViewAmenityBookingDetails({bookingId})` — opens booking detail modal or navigates to detail page
3. ✓ Approve — checkmark icon. Direct approve link: `/amenity/approve/{bookingId}`

**Observed pending request**:
- Party Room | Vishnu, Kadunthayil (1402) | 2026/04/03 10:00 AM | 2026/04/03 11:30 PM | 2026/03/09 12:17 PM

### 4.2 Legend Toggle

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Legend (Click to toggle) | Link/button | `<a>` with `data-toggle="collapse"` targeting `#collapseOne`. Bootstrap collapse. `btn-primary` style |
| 2 | Quick Booking | Link/button | `btn-primary pull-right`. ID: `btnQuickBooking`. Navigates to Create Booking tab |

**Legend panel** (collapsible, `#collapseOne`): Uses Bootstrap accordion with `data-parent="#accordion"`.

#### Legend — Amenity Colors

Each item is an `icheckbox_line-blue` styled checkbox that filters the calendar.

| # | Label | Color (RGB) | Hex Approx | Checked by Default |
|---|-------|-------------|------------|-------------------|
| 1 | Show All Bookings | rgb(36, 137, 197) | #2489C5 (teal blue) | ☑ Yes |
| 2 | Billiard Room | rgb(192, 80, 77) | #C0504D (red) | ☐ No |
| 3 | Elevator | rgb(31, 73, 125) | #1F497D (dark blue) | ☐ No |
| 4 | Party Room | rgb(79, 129, 189) | #4F81BD (medium blue) | ☐ No |
| 5 | Squash Court | rgb(155, 187, 89) | #9BBB59 (green) | ☐ No |
| 6 | Tennis Court | rgb(128, 100, 162) | #8064A2 (purple) | ☐ No |

#### Legend — Booking Status Colors

| # | Label | Color (RGB) | Hex Approx |
|---|-------|-------------|------------|
| 1 | Pending Approval | rgb(209, 148, 56) | #D19438 (amber/orange) |
| 2 | Approved | rgb(36, 137, 197) | #2489C5 (teal blue) |
| 3 | Declined | rgb(77, 77, 77) | #4D4D4D (dark gray) |
| 4 | Cancelled | rgb(77, 77, 77) | #4D4D4D (dark gray) |
| 5 | Payments Overdue | rgb(192, 80, 77) | #C0504D (red) |
| 6 | Outstanding Payment | rgb(192, 80, 77) | #C0504D (red) |
| 7 | Show Blocked Bookings | rgb(192, 192, 192) | #C0C0C0 (light gray) |

**Legend behavior**:
- Each checkbox toggles visibility of that amenity/status on the calendar
- "Show All Bookings" is checked by default — shows everything
- Clicking individual amenity filters shows only that amenity's bookings
- Amenity colors match the calendar event colors
- Declined and Cancelled share the same color (dark gray)
- Payments Overdue and Outstanding Payment share the same color (red)

### 4.3 Calendar

FullCalendar-style interactive calendar below the legend.

#### Calendar Navigation

| # | Element | Type | Description |
|---|---------|------|-------------|
| 1 | Previous month (◀) | Button | Teal circle with left arrow. Navigates to previous month |
| 2 | Next month (▶) | Button | Teal circle with right arrow. Navigates to next month |
| 3 | today | Button | "today" label. Navigates calendar to current date. Teal badge style |
| 4 | Month title | Text | Center-aligned. Format: "March 2026" |
| 5 | month | Button | View toggle — month view (default) |
| 6 | week | Button | View toggle — week view |
| 7 | day | Button | View toggle — day view |

**View toggle group** (right-aligned): `month | week | day`

#### Calendar Grid (Month View)

| Property | Value |
|----------|-------|
| **Columns** | Sun, Mon, Tue, Wed, Thu, Fri, Sat |
| **Column header style** | Teal background, white text |
| **Today highlight** | Date number in teal/red highlight |
| **Weekend columns** | Saturday column may have yellow/gold background tint |
| **Event display format** | "{startTime} - {endTime} {AmenityName} booked by {LASTNAME}, {FirstName} ({UnitNumber})" |
| **Event color** | Matches amenity legend color (e.g., Elevator = dark blue rgb(31, 73, 125)) |
| **Overflow** | "+N more" link when multiple events on same day |

**Observed calendar events** (March 2026):
- Sat 7: "9a - 12p Elevator booked by TAPPIN, Desiree (0310)" — dark blue
- Thu 12: "12p - 3p Elevator booked by LEE, Carolyn (0610)" — dark blue
- Sat 14: "9a - 11:30a Elevator booked by Vagianidis, Mary (1707)" + "+5 more" — dark blue

**Calendar behavior**:
- Events are clickable (presumably navigate to booking detail)
- "+N more" link expands or navigates to day view
- Calendar renders via FullCalendar JavaScript library
- Events show time ranges in short format (9a, 12p, 3p, 11:30a)
- Name format: LASTNAME, Firstname (UnitNumber)

---

## 5. All Bookings Tab

**Tab**: `#tab-3`

### 5.1 Filter Bar

Three filter fields in a horizontal row with Search button.

| # | Field | Type | ID/Name | Default | Options |
|---|-------|------|---------|---------|---------|
| 1 | Search | Text input | `SearchTerm` | Empty | Placeholder: "Search". Free-text search across bookings |
| 2 | Amenity | Select dropdown | `SelectedAmenityID` | "All Amenities" | All Amenities, Billiard Room (5733), Elevator (5696), Party Room (5697), Squash Court (5734), Tennis Court (5735) |
| 3 | Status | Select dropdown | `SelectedBookingStatusID` | "All" | All, Approved (11), Cancelled (13), Payment Overdue (41), Pending Approval (10), Outstanding Payment (55) |
| 4 | Search | Submit button | `btnSearchAmenityBooking` | — | Teal `btn-primary`. Applies filters |

**Status dropdown IDs**:

| Status | ID |
|--------|----|
| Approved | 11 |
| Pending Approval | 10 |
| Cancelled | 13 |
| Payment Overdue | 41 |
| Outstanding Payment | 55 |

**Note**: "Declined" status appears in the calendar legend but NOT in the All Bookings status filter dropdown. This is an inconsistency.

### 5.2 Booking Cards List

Results displayed as cards (not a table). Each card shows one booking.

#### Booking Card Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Amenity Name]                    Starts M/DD/YYYY HH:MM:SS AM/PM    │
│  Booked by [FirstName LastName]    Ends M/DD/YYYY HH:MM:SS AM/PM      │
│                                                          [Status]      │
└─────────────────────────────────────────────────────────────────────────┘
```

| # | Element | Position | Description |
|---|---------|----------|-------------|
| 1 | Amenity Name | Top-left | Teal link text. Clickable — navigates to booking detail page |
| 2 | Booked by | Below amenity name | "Booked by {FirstName} {LastName}" (note: different name format than calendar — FirstName LastName, not LASTNAME, Firstname) |
| 3 | Start date/time | Top-right | "Starts M/DD/YYYY HH:MM:SS AM/PM" |
| 4 | End date/time | Below start | "Ends M/DD/YYYY HH:MM:SS AM/PM" |
| 5 | Status | Right, colored text | Status badge. Color-coded: green "Approved", amber "Pending" |

**Observed bookings**:

| # | Amenity | Booked By | Start | End | Status |
|---|---------|-----------|-------|-----|--------|
| 1 | Elevator | Shu Zhen Pan | 4/6/2026 11:00:00 AM | 4/6/2026 2:00:00 PM | Approved (green) |
| 2 | Elevator | Carolyn LEE | 3/12/2026 12:00:00 PM | 3/12/2026 3:00:00 PM | Approved (green) |
| 3 | Party Room | Kadunthayil Vishnu | 4/3/2026 10:00:00 AM | 4/3/2026 11:30:00 PM | Pending (amber) |

**Status colors**:
- **Approved**: Green text
- **Pending**: Amber/orange text

---

## 6. Booking Detail Page (View)

**URL**: `/amenity/View/{bookingId}`
**Example**: `/amenity/View/8488428`
**Page title**: "Amenity Booking # {bookingNumber} | Condo Control"

### 6.1 Booking Information Table

Read-only table displaying all booking details. Two-column layout: Field Label | Value.

| # | Field Label | Value (observed) | Description |
|---|------------|------------------|-------------|
| 1 | Booking Number | 2654579639 | Auto-generated booking reference number |
| 2 | Amenity | Elevator | Amenity name |
| 3 | Amenity Option | Elevator Deposti | Amenity sub-option (note: typo "Deposti" instead of "Deposit" in production data) |
| 4 | Booked By | Pan, Shu Zhen (0703) - M.T.C.C. 872 | Format: "LastName, FirstName (UnitNumber) - PropertyName" |
| 5 | Email Address | pan.shuzhen88@gmail.com | Resident's email |
| 6 | Phone number | 416-818-6676 (Cell / Mobile) + 6473856676 (Cell / Mobile) | Can show multiple phone numbers, each with type label |
| 7 | Start Date | 4/6/2026 | Format: M/D/YYYY |
| 8 | Start Time | 11:00 AM | Format: HH:MM AM/PM |
| 9 | End Date | 4/6/2026 | Format: M/D/YYYY |
| 10 | End Time | 2:00 PM | Format: HH:MM AM/PM |
| 11 | Administrator Approval Status | Approved | Status values: Approved, Pending Approval, Declined, Cancelled |
| 12 | Items required for full approval | Cheque | Payment items needed before full approval |
| 13 | Amenity Usage Fee | $150.00 | Fee charged for this booking |
| 14 | Deposit Amount (CAD) | $150.00 | Security deposit amount |
| 15 | Payment Status (CAD) | Cheque required | Current payment status |
| 16 | Requestor Comments | Move out | Comments entered by the person making the booking |
| 17 | Approver Comments | (empty) | Comments from the administrator/approver |
| 18 | Agreement to Terms and Conditions | Agree Online — User agreed when reservation was saved. | Agreement method + confirmation text |

### 6.2 Action Buttons

Row of teal buttons below the booking information table.

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Cancel Booking | `btn-primary` (teal) | Cancels the booking |
| 2 | Update Booking | `btn-primary` (teal) | Opens edit mode for booking details |
| 3 | Revise Booking | `btn-primary` (teal) | Opens revision form (likely for date/time changes) |
| 4 | Return to Calendar | `btn-primary` (teal) | Navigates back to Calendar View |
| 5 | Reassign Booking | `btn-primary` (teal) | Reassigns booking to a different resident/unit |

**Button behavior notes**:
- All 5 buttons are available for Security & Concierge role
- "Cancel Booking" and "Revise Booking" are distinct — Cancel terminates, Revise allows modifications
- "Update Booking" vs "Revise Booking" distinction unclear — likely Update is for admin fields (approver comments, status), Revise is for booking details (date/time)
- "Revise Booking" links to `/amenity/revisebookingwithpayment/{bookingId}/`

### 6.3 Cancel Booking Form

Expandable section triggered by "Cancel Booking" button.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Please enter reason for cancellation: | Textarea | Free-text cancellation reason |
| 2 | Save | Submit button | Confirms cancellation |
| 3 | Cancel | Link | Closes the form without action |

### 6.4 Update Booking Form

Expandable section triggered by "Update Booking" button.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Requestor Comments | Textarea | Pre-populated with existing comments (e.g., "Move out") |
| 2 | Payment | Checkbox + inputs | "User will pay by cheque" checkbox, cheque number input, Security Deposit input |
| 3 | Agreement to Terms and Conditions | Read-only | Shows "Agree Online User agreed when reservation was saved." |
| 4 | Save | Submit button | Saves changes |
| 5 | Cancel | Link | Closes form |

### 6.5 Revise Booking Time Form

Expandable section for date/time changes.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Date | Text input (datepicker) | Booking date |
| 2 | Check Availability | Button | Checks if new date/time is available |
| 3 | Select a Time | Dropdown | Available time slots |
| 4 | Amenity Option | — | Shows current amenity option |
| 5 | From: Date + Time | Date input + time dropdown | Start date/time (30-min intervals, 12:00 AM–11:59 PM) |
| 6 | Until: Date + Time | Date input + time dropdown | End date/time (30-min intervals, 12:00 AM–11:59 PM) |
| 7 | Check Availability | Submit button | Validates revised times |
| 8 | Comparison table | Table | "Original Booking" vs "Revised Booking" side-by-side: Amenity, Start/End Date, Start/End Time, Method of Payment, Amenity Usage Fee, Security Deposit |
| 9 | International card notice | Alert text | "Our system detected the use of an international credit card. Due to higher charges levied by the pay..." |
| 10 | "I want to continue with higher fee" | Checkbox | Consent for international card surcharge |
| 11 | Save / Cancel | Buttons | Submit or cancel revision |

### 6.6 Reassign Booking Form

Expandable section triggered by "Reassign Booking" button.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Reassign to | Text input | User ID field (pre-populated with current user ID, e.g., "1739238"). Likely has autocomplete |
| 2 | Save / Cancel | Buttons | Submit or cancel reassignment |

### 6.7 Upload Signed Agreement

File upload section on booking detail page.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | Please select a file to upload | File input | File chooser button |
| 2 | Size limit | Validation | "File is too big. The maximum size is 5 MB." |
| 3 | Upload / Cancel | Buttons | Submit or cancel upload |

### 6.8 Total Charges Section

Financial breakdown at bottom of booking detail page.

| # | Label | Value (observed) | Description |
|---|-------|------------------|-------------|
| 1 | Amenity Usage Fee | $150.00 | Base amenity fee |
| 2 | Booking Service Fee | $2.00 | Platform service charge |
| 3 | Booking Service Fee Tax | ($2.00) | Tax on service fee (shown as negative = credit?) |
| 4 | Stripe Fee | $0.00 | Payment processing fee |
| 5 | Total Charges (CAD) | $150.00 | Grand total |

**Footer note**: "If and when applicable, additional charges may be applied to your credit card upon management approval."
**Fee explanation link**: "View a full explanation of fees." → `https://support.condocontrol.com/hc/en-us/articles/209630233`

### 6.9 Payment Dialog (Stripe)

Hidden Bootstrap modal for credit card payment processing.

| # | Element | Description |
|---|---------|-------------|
| 1 | Logo | CondoControl logo |
| 2 | Heading | "Payment Update Credit Card Details" |
| 3 | Card input | Stripe Elements secure iframe (`#card-element`) |
| 4 | Update button | Updates saved card details |
| 5 | Pay $ button | Processes payment |

**Stripe configuration**: Public key `pk_live_zw5vuHnv81ZmTqmlNpH0pY2v`, locale `en`, `hidePostalCode: false`

### 6.10 History Section

Audit trail table below action buttons.

**Section heading**: "History" (clock icon, teal)

| # | Column | Description |
|---|--------|-------------|
| 1 | Date / Time | Format: M/DD/YYYY HH:MM:SS AM/PM (e.g., "3/10/2026 10:55:31 PM") |
| 2 | Who | Email address of the person who performed the action (e.g., "r.ravichandra222@gmail.com") |
| 3 | Action | Action type (e.g., "Create Booking") |
| 4 | Details | Additional details column (empty in observed data) |

**Observed history entry**:
- 3/10/2026 10:55:31 PM | r.ravichandra222@gmail.com | Create Booking | (empty)

---

## 7. Booking Approval Flow

### 7.1 From Calendar View — Pending Approvals Table

1. Admin sees pending bookings in "Requests Pending Approval" section
2. **Individual approve**: Click checkmark icon → navigates to `/amenity/approve/{bookingId}`
3. **Batch approve**: Check multiple checkboxes → click "Approve Selected" button
4. **View details**: Click calendar icon → calls `javascript:ViewAmenityBookingDetails({id})`

### 7.2 From Booking Detail Page

1. Navigate to `/amenity/View/{bookingId}`
2. Review booking information
3. Click "Update Booking" to change approval status
4. Add Approver Comments
5. Status changes reflected in History section

---

## 8. Data Model Observations

### 8.1 Amenity Entity

| Field | Type | Description |
|-------|------|-------------|
| AmenityID | Integer | Unique identifier (e.g., 5696, 5697, 5733, 5734, 5735) |
| Name | String | Display name (e.g., "Elevator", "Party Room") |
| WorkspaceID | Integer | Property workspace (12039 for M.T.C.C. 872) |
| BookingStyleID | Integer | Booking configuration style (3 observed) |
| Image | URL/Blob | Amenity photo (supports upload, placeholder shown when none) |
| Fee | Decimal | Usage fee amount ($0 or $100.00) |
| FeeType | String | "No Fee" or "Flat rate per reservation" |
| SecurityDeposit | Decimal | Deposit amount (e.g., $350.00 for Party Room) |
| PaymentMethod | String | "Cheque" (also supports Stripe for credit card) |
| CancellationPolicy | String | Free-text policy (e.g., "Cancel and refund up until the start of booking") |
| HoursOfOperation | Object | Schedule definition (e.g., "Every day from 10:00 AM to 11:30 PM") |
| TermsAndConditions | HTML/Text | Configurable T&C content (empty for observed amenities) |
| Color | RGB | Calendar display color (unique per amenity) |

### 8.2 Booking Entity

| Field | Type | Description |
|-------|------|-------------|
| BookingID | Integer | Internal ID (e.g., 8488428) |
| BookingNumber | String | Display reference number (e.g., "2654579639") |
| AmenityID | Integer | FK to Amenity |
| AmenityOption | String | Sub-option name (e.g., "Elevator Deposti") |
| BookedBy | Object | Resident — name, unit, email, phone(s), property |
| StartDate | Date | Booking start date |
| StartTime | Time | Booking start time |
| EndDate | Date | Booking end date |
| EndTime | Time | Booking end time |
| ApprovalStatus | Enum | Pending Approval (10), Approved (11), Cancelled (13), Payment Overdue (41), Outstanding Payment (55) |
| ItemsRequiredForApproval | String | e.g., "Cheque" |
| AmenityUsageFee | Decimal | Fee for this booking |
| DepositAmount | Decimal | Deposit for this booking |
| PaymentStatus | String | e.g., "Cheque required" |
| RequestorComments | Text | Booker's comments |
| ApproverComments | Text | Admin's comments |
| AgreementToTerms | String | Agreement method + timestamp |
| CreatedDate | DateTime | When booking was created |
| History | Array | Audit trail entries (date, who, action, details) |

### 8.3 Booking Status IDs

| Status | ID | Calendar Color | Card Color |
|--------|----|---------------|------------|
| Pending Approval | 10 | Amber rgb(209, 148, 56) | Amber text |
| Approved | 11 | Teal blue rgb(36, 137, 197) | Green text |
| Cancelled | 13 | Dark gray rgb(77, 77, 77) | — |
| Payment Overdue | 41 | Red rgb(192, 80, 77) | — |
| Outstanding Payment | 55 | Red rgb(192, 80, 77) | — |
| Declined | — | Dark gray rgb(77, 77, 77) | — |

**Note**: "Declined" has a calendar legend entry but NO status ID in the filter dropdown — may be a legacy or hidden status.

---

## 9. URL Map

| Page | URL Pattern |
|------|-------------|
| Amenity Booking landing (Create Booking) | `/amenity/landing/` |
| Calendar View tab | `/amenity/landing/#tab-2` |
| All Bookings tab | `/amenity/landing/#tab-3` |
| Amenity Detail / Booking page | `/amenity/amenity-details/{amenityId}` |
| View Booking | `/amenity/View/{bookingId}` |
| Approve Booking (direct) | `/amenity/approve/{bookingId}` |
| View Booking Details (JS) | `javascript:ViewAmenityBookingDetails({bookingId})` |
| Revise Booking with Payment | `/amenity/revisebookingwithpayment/{bookingId}/` |
| Calendar Bookings | `/amenity/bookings/` |
| Get Amenity Rules (API) | `/amenity/get-amenity-rules/` |
| Update Pricing Structure (API) | `/amenity/update-pricing-structure/` |
| Get All Bookings List (API) | `/amenity/get-amenity-list/` |
| Fee Explanation (external) | `https://support.condocontrol.com/hc/en-us/articles/209630233` |

---

## 10. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Visual amenity cards** — Each amenity has a card with image, name, and fee. Easy visual browsing
2. **Hero booking bar** — 3-step inline booking (amenity → date → slot → book). Fast for residents who know what they want
3. **Calendar legend with color coding** — Each amenity has a unique color. Status colors are distinct. Filterable checkboxes
4. **Pending approvals prominently displayed** — Above calendar, not hidden. Clear batch approve workflow
5. **Pricing transparency** — Pricing & Deposit Structure shown on detail page before booking. Cancellation policy visible
6. **Booking history audit trail** — Every action logged with date, who (email), and action type
7. **Multiple action buttons on detail page** — Cancel, Update, Revise, Reassign all available. Full lifecycle management
8. **Stripe integration** — Payment infrastructure exists (public key present in hidden fields) even if this property uses cheques
9. **Hours of operation display** — Clear operating hours shown on amenity detail page

### What CondoControl Gets Wrong
1. **Duplicate "Book Now" paths** — Hero bar and card "Book Now" buttons both exist but lead to different flows. Hero bar is underused because cards are more prominent
2. **"Quick Booking" misleading** — Button on Calendar View just navigates to Create Booking tab. Not actually a quick/inline booking
3. **Options dropdown bug** — After selecting Elevator + date, "See Available Options" shows 4 identical "Elevator" entries with same ID (5696). No time slots or distinguishing labels
4. **Data typos in production** — "Elevator Deposti" instead of "Elevator Deposit" in amenity option name. URL typos elsewhere in platform
5. **Inconsistent name formats** — Calendar shows "LASTNAME, Firstname (Unit)", booking cards show "Firstname Lastname", detail page shows "Lastname, Firstname (Unit) - Property". Three different formats across the same module
6. **Inconsistent date formats** — Calendar uses "YYYY/MM/DD", booking cards use "M/DD/YYYY HH:MM:SS", detail page uses "M/D/YYYY". No standardization
7. **Declined status inconsistency** — "Declined" appears in calendar legend but not in All Bookings status filter dropdown
8. **No inline booking from calendar** — Can't click a calendar slot to create a booking. Must use the Create Booking tab
9. **No booking count or pagination** — All Bookings tab shows cards with no indication of total count or pagination controls
10. **Placeholder images** — All 5 amenities show generic placeholder images. No indication of upload capability from this role
11. **Terms and Conditions inconsistent** — Only Elevator has T&C content (lengthy move/delivery agreement). Other 4 amenities show empty heading
12. **Update vs Revise confusion** — Two separate buttons with unclear distinction. Should be one "Edit Booking" action
13. **Calendar events not interactive enough** — Events show time + amenity + who, but no hover tooltips for quick details

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~350+*
