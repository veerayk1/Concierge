# 06 -- Amenity Booking

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 18-Integrations, 19-AI Framework

---

## 1. Overview

Amenity Booking manages the full lifecycle of reservable building facilities -- from party rooms and BBQ areas to guest suites, elevators, and sports courts. Residents browse available amenities, pick a date and time, pay any required fees, and receive confirmation. Staff approve or decline requests, track payments and deposits, and manage amenity schedules. Property Admins configure everything: pricing, hours, capacity, approval rules, terms and conditions, photos, and cancellation policies.

### Why This Module Exists

Every condo building has shared spaces that residents want to use. Without a booking system, management resorts to paper sign-up sheets, phone calls, and spreadsheets. This creates double-bookings, missed payments, and disputes. Concierge replaces all of that with a self-service booking flow that handles scheduling, payment, approvals, and communication in one place.

### Key Facts

| Attribute | Value |
|-----------|-------|
| **User roles** | Resident (book), Front Desk (book on behalf, manage), Property Manager (configure, approve, report), Property Admin (full configuration), Board Member (usage reports read-only) |
| **Payment provider** | Stripe (credit/debit cards) + offline methods (cheque, cash, e-transfer) |
| **Calendar library** | FullCalendar (month, week, day, agenda views) |
| **Views** | Calendar, List, Card Grid |
| **Booking styles** | Fixed time slots, flexible time range, full-day |
| **Approval modes** | Auto-approve, manager-approve, admin-approve |
| **AI capabilities** | 8 (see Section 7) |
| **Real-time updates** | WebSocket -- new bookings, approvals, and cancellations appear live |

### Scope

**In scope**: Amenity setup (49+ admin fields), resident and staff booking flows, calendar and list views, Stripe payment integration, approval workflows, terms and conditions, waitlist, recurring bookings, maintenance schedule blocking, capacity management, booking modification and cancellation, deposit tracking, reporting.

**Out of scope**: Equipment tracking (see 05-Maintenance), event creation for community events (see 12-Community), digital signage display of amenity schedules (see 20-Innovation).

---

## 2. Research Summary

Industry research across three production platforms revealed the following patterns that shaped Concierge's amenity booking design.

### What the Industry Gets Right

| # | Pattern | Observed In | Concierge Adoption |
|---|---------|-------------|-------------------|
| 1 | **Visual amenity cards with photos** | 2 of 3 platforms | Adopted -- card grid with uploaded photos, fee display, and one-click booking |
| 2 | **Hero booking bar** | 1 of 3 platforms | Adopted -- streamlined 3-step inline flow (amenity, date, slot, book) for residents who know what they want |
| 3 | **Color-coded calendar with legend** | 2 of 3 platforms | Adopted -- unique color per amenity, status colors (approved, pending, cancelled), filterable checkboxes |
| 4 | **Pending approvals above calendar** | 1 of 3 platforms | Adopted -- prominent display with batch approve capability |
| 5 | **Pricing and deposit transparency** | All 3 platforms | Adopted -- fee, deposit, payment method, and cancellation policy shown before booking |
| 6 | **Booking history audit trail** | 1 of 3 platforms | Adopted -- every action logged with timestamp, actor, and details |
| 7 | **Stripe payment integration** | 1 of 3 platforms | Adopted -- credit card payments for amenity fees and deposits |
| 8 | **Variable fee structures** | All 3 platforms | Adopted -- flat rate, hourly, per-guest, and per-event pricing models |
| 9 | **Time slot-based booking** | All 3 platforms | Adopted -- configurable slot durations per amenity |
| 10 | **Combined multi-amenity calendar** | 2 of 3 platforms | Adopted -- single calendar showing all amenities with color filtering |

### What the Industry Gets Wrong

| # | Anti-Pattern | Observed In | Concierge Fix |
|---|-------------|-------------|---------------|
| 1 | **Duplicate booking entry points with inconsistent flows** | 1 platform | Single unified booking flow regardless of entry point (card, calendar click, hero bar) |
| 2 | **"Quick Booking" button that just navigates to another tab** | 1 platform | True quick-book: click a calendar slot to create a booking inline |
| 3 | **Inconsistent name formats across views** | 1 platform | Standardized name format across all views: "First Last (Unit)" |
| 4 | **Inconsistent date/time formats** | 1 platform | ISO-derived format everywhere: "MMM D, YYYY" for dates, "h:mm A" for times |
| 5 | **Update vs Revise vs Edit -- three buttons for similar actions** | 1 platform | Single "Edit Booking" action with clearly scoped sections (dates, payment, notes) |
| 6 | **No inline booking from calendar clicks** | 2 of 3 platforms | Click any empty calendar slot to start a booking pre-filled with that date and time |
| 7 | **No pagination or total count on booking lists** | 1 platform | Paginated list with total count, sort, and filter controls |
| 8 | **Placeholder images with no upload guidance** | 1 platform | Empty state prompts admin to upload photos with recommended dimensions |
| 9 | **Empty terms and conditions sections** | 2 of 3 platforms | If no T&C configured, the section is hidden entirely -- not shown as an empty heading |
| 10 | **Declined status in legend but missing from filters** | 1 platform | Every status that appears anywhere is available in every filter dropdown |

### Concierge Differentiators (Not Found in Any Platform)

1. **AI-powered demand prediction** -- suggests optimal booking times and predicts no-shows
2. **Dynamic pricing suggestions** -- AI recommends peak/off-peak pricing based on utilization data
3. **Inline calendar booking** -- click any empty slot to instantly start a booking
4. **Waitlist with automatic promotion** -- when a booking is cancelled, the next person on the waitlist is automatically offered the slot
5. **Maintenance schedule blocking** -- amenity maintenance windows automatically block bookings
6. **Recurring booking support** -- residents can book weekly yoga sessions or monthly party room reservations
7. **Smart conflict resolution** -- AI suggests alternative times when a conflict is detected

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Amenity Setup (Admin)

Property Admin configures each amenity with the following fields, organized into 7 sections. Fields marked with progressive disclosure are hidden behind an "Advanced Settings" toggle.

**Section A: Basic Information**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 1 | Amenity Name | text | 100 chars | Yes | -- | Non-empty, unique within property | "An amenity with this name already exists." |
| 2 | Description | textarea | 2000 chars | No | -- | -- | -- |
| 3 | Amenity Group | select | -- | Yes | "General" | Must select from existing groups | "Please select an amenity group." |
| 4 | Display Order | number | 3 digits | No | Auto-increment | Integer >= 0 | "Display order must be a positive number." |
| 5 | Active | toggle | -- | Yes | true | -- | -- |
| 6 | Color | color picker | 7 chars (hex) | Yes | Auto-assigned | Valid hex color | "Please select a valid color." |
| 7 | Icon | icon picker | -- | No | Default per group | From icon library or custom SVG upload | -- |

**Section B: Photos & Media**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 8 | Primary Photo | file upload | 5 MB | No | Placeholder | JPG, PNG, WebP. Min 800x400px | "Photo must be JPG, PNG, or WebP and at least 800x400 pixels." |
| 9 | Gallery Photos | multi-file upload | 5 MB each, 10 max | No | -- | Same as primary photo | "Each photo must be under 5 MB. Maximum 10 photos." |
| 10 | Photo Caption | text | 200 chars | No | -- | -- | -- |

**Section C: Scheduling**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 11 | Booking Style | select | -- | Yes | "Fixed Slots" | One of: Fixed Slots, Flexible Range, Full Day | "Please select a booking style." |
| 12 | Operating Hours Start | time picker | -- | Yes | 9:00 AM | Valid time, before end time | "Start time must be before end time." |
| 13 | Operating Hours End | time picker | -- | Yes | 10:00 PM | Valid time, after start time | "End time must be after start time." |
| 14 | Time Slot Duration | select | -- | Conditional | 60 min | Required if Booking Style = Fixed Slots. Options: 30, 60, 90, 120, 180, 240 min | "Please select a slot duration." |
| 15 | Minimum Booking Duration | select | -- | Conditional | 30 min | Required if Booking Style = Flexible Range. Options: 15, 30, 60, 90, 120 min | "Please select a minimum booking duration." |
| 16 | Maximum Booking Duration | select | -- | Conditional | 240 min | Required if Booking Style = Flexible Range. Must be >= min duration | "Maximum duration must be at least the minimum duration." |
| 17 | Days of Week Available | multi-select checkboxes | -- | Yes | All days checked | At least 1 day selected | "Select at least one day of the week." |
| 18 | Holiday Closures | toggle | -- | No | true (closed on holidays) | -- | -- |
| 19 | Blocked Hours per Day | repeatable group | 7 entries (per day) | No | -- | Start before end, no overlaps within same day | "Blocked hours overlap on {day}." |
| 20 | Buffer Between Bookings | select | -- | No | 0 min | Options: 0, 15, 30, 60 min | -- |
| 21 | Maximum Concurrent Bookings | number | 3 digits | No | 1 | Integer >= 1. Tooltip: "How many bookings can overlap at the same time. Use for amenities with multiple units (e.g., 3 BBQ stations)." | "Must be at least 1." |

**Section D: Booking Rules**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 22 | Advance Booking Minimum | number + unit | -- | No | 0 (same day) | Integer >= 0. Units: hours or days | "Must be 0 or more." |
| 23 | Advance Booking Maximum | number + unit | -- | No | 90 days | Integer >= 1. Must be > minimum | "Maximum advance days must be greater than minimum." |
| 24 | Max Bookings per Unit per Week | number | 2 digits | No | Unlimited (0) | Integer >= 0. 0 = unlimited | "Must be 0 (unlimited) or a positive number." |
| 25 | Max Bookings per Unit per Month | number | 2 digits | No | Unlimited (0) | Integer >= 0 | Same as above |
| 26 | Max Guest Count | number | 3 digits | No | Unlimited (0) | Integer >= 0 | "Must be 0 (unlimited) or a positive number." |
| 27 | Guest Count Triggers Security | number | 3 digits | No | 0 (disabled) | Integer >= 0. Tooltip: "When guest count exceeds this number, a security guard is automatically added to the booking." | "Must be a positive number." |
| 28 | Security Guard Rate | currency | -- | Conditional | $0.00 | Required if Guest Count Triggers Security > 0 | "Please enter the security guard hourly rate." |
| 29 | Security Guard Minimum Hours | number | 2 digits | Conditional | 4 | Required if Guest Count Triggers Security > 0 | "Please enter the minimum security hours." |
| 30 | Allow Recurring Bookings | toggle | -- | No | false | -- | -- |
| 31 | Max Recurring Weeks | number | 2 digits | Conditional | 12 | Required if Allow Recurring Bookings = true. Range: 1-52 | "Recurring bookings can be set for 1 to 52 weeks." |
| 32 | Resident Booking Only | toggle | -- | No | true | Tooltip: "When enabled, only residents can book. When disabled, staff can book on behalf of non-residents." | -- |
| 33 | Require Agreement | toggle | -- | No | false | -- | -- |

**Section E: Pricing & Payment**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 34 | Amenity Fee | currency | -- | No | $0.00 | Decimal >= 0, max 2 decimal places | "Fee must be a valid dollar amount." |
| 35 | Fee Type | select | -- | Conditional | "Flat rate" | Required if Amenity Fee > 0. Options: Flat rate per reservation, Per hour, Per guest, Per guest per hour | "Please select a fee type." |
| 36 | Security Deposit | currency | -- | No | $0.00 | Decimal >= 0 | "Deposit must be a valid dollar amount." |
| 37 | Deposit Refund Policy | select | -- | Conditional | "Full refund if no damage" | Required if Security Deposit > 0. Options: Full refund if no damage, Partial refund (specify %), Non-refundable | "Please select a refund policy." |
| 38 | Accepted Payment Methods | multi-select | -- | Conditional | All methods | Required if fee or deposit > 0. Options: Credit Card (Stripe), Cheque, Cash, E-Transfer | "Select at least one payment method." |
| 39 | Tax Rate | percentage | 5 chars | No | Property default | Decimal 0-100 | "Tax rate must be between 0% and 100%." |
| 40 | Service Fee | currency | -- | No | $0.00 | Platform service fee added to bookings | -- |

**Section F: Approval & Cancellation**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 41 | Approval Mode | select | -- | Yes | "Auto-approve" | Options: Auto-approve, Manager approval required, Admin approval required | -- |
| 42 | Cancellation Policy | select | -- | Yes | "Free cancellation until start" | Options: Free cancellation until start, Cancel up to X hours before, No cancellation after booking, Non-refundable | "Please select a cancellation policy." |
| 43 | Cancellation Hours | number | 3 digits | Conditional | 24 | Required if policy = "Cancel up to X hours before" | "Please enter the number of hours." |
| 44 | Waitlist Enabled | toggle | -- | No | false | -- | -- |
| 45 | Max Waitlist Size | number | 2 digits | Conditional | 5 | Required if Waitlist Enabled = true. Range: 1-50 | "Waitlist can hold 1 to 50 entries." |

**Section G: Terms & Conditions**

| # | Field | Type | Max Length | Required | Default | Validation | Error Message |
|---|-------|------|-----------|----------|---------|------------|---------------|
| 46 | Terms and Conditions | rich text editor | 10,000 chars | Conditional | -- | Required if Require Agreement = true | "Please enter terms and conditions." |
| 47 | Agreement Method | select | -- | Conditional | "Checkbox" | Required if Require Agreement = true. Options: Checkbox, Digital signature, Upload signed document | -- |
| 48 | Agreement Document Template | file upload | 10 MB | No | -- | PDF only | "Agreement template must be a PDF file." |
| 49 | Custom Instructions | textarea | 2000 chars | No | -- | Displayed on the booking page below description | -- |

**Buttons on Amenity Setup Form**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Save Amenity | Validates all fields, creates/updates amenity | Toast: "Amenity saved successfully." Redirect to amenity list. | Inline field errors highlighted in red. Toast: "Please fix the errors below." | Button shows spinner, text changes to "Saving..." Disabled. |
| Save as Draft | Saves with active=false | Toast: "Amenity saved as draft." | Same as Save | Same as Save |
| Cancel | Discards changes, returns to amenity list | If changes made, confirmation dialog: "Discard unsaved changes?" | -- | -- |
| Delete Amenity | Soft-deletes amenity | Confirmation dialog: "Delete {name}? Existing bookings will be preserved but no new bookings can be made." On confirm: toast "Amenity deleted." | Toast: "Unable to delete amenity. Please try again." | Button disabled with spinner |
| Upload Photo | Opens file picker for photo upload | Photo preview appears in gallery. Toast: "Photo uploaded." | Toast: "Upload failed. File must be JPG, PNG, or WebP under 5 MB." | Upload progress bar shown |

#### 3.1.2 Browse Amenities (Resident & Staff)

Residents see a card grid of available amenities for their building. Each card shows:

- **Photo** (primary photo or placeholder with guidance text if none uploaded)
- **Amenity name** (clickable, links to detail page)
- **Fee summary** ("No Fee" or "$120.00 / flat rate per reservation")
- **Availability indicator** (green dot = available today, orange = limited, gray = closed)
- **Book Now button** (primary action)

**Search and Filter Bar**:

| # | Control | Type | Behavior |
|---|---------|------|----------|
| 1 | Search | text input, placeholder "Search amenities..." | Filters cards by name and description. Debounced (300ms). |
| 2 | Amenity Group | select dropdown | Filters by group (e.g., Recreation, Common Areas, Move-In/Out). Default: "All Groups" |
| 3 | Availability | select dropdown | Options: All, Available Today, Available This Week. Default: "All" |
| 4 | Building | select dropdown | Shown only for multi-building properties. Default: user's building |

**Empty State**: "No amenities are available for booking. Contact your property manager for more information." Illustration of a calendar with a question mark.

**Loading State**: 4 skeleton cards with pulsing animation (photo placeholder, two text lines, button placeholder).

**Error State**: "Unable to load amenities. Please try again." Retry button.

**Responsive Layout**:
- Desktop: 4 cards per row
- Tablet: 2 cards per row
- Mobile: 1 card per row (full width)

#### 3.1.3 Amenity Detail Page

Shows full information about a single amenity with a booking form.

**Layout** (two columns on desktop, single column on mobile):

Left column:
- Hero photo (or photo gallery carousel)
- Amenity name (H1)
- Description
- Terms and conditions (collapsible, shown only if configured)
- Custom instructions (shown only if configured)
- "Back to Amenities" link

Right column (sticky on scroll):
- **Create a Booking** form (see 3.1.4)
- Pricing and deposit card
- Hours of operation card
- Cancellation policy

**Pricing Card Fields**:

| # | Field | Display Logic |
|---|-------|---------------|
| 1 | Amenity Fee | Shown if > $0. Format: "$120.00 / flat rate per reservation" |
| 2 | Security Deposit | Shown if > $0. Format: "$250.00 (refundable)" |
| 3 | Payment Methods | Shown if fee or deposit > $0. Format: "Credit Card, Cheque, E-Transfer" |
| 4 | Cancellation Policy | Always shown. Format: "Free cancellation until start of booking" or "Cancel up to 24 hours before" |

If amenity has no fees: show "No Fee" badge. Hide payment methods. Hide deposit.

#### 3.1.4 Booking Creation Flow

**Step 1: Select Date and Time**

| # | Field | Type | Required | Default | Validation | Error Message |
|---|-------|------|----------|---------|------------|---------------|
| 1 | Date | date picker | Yes | Today (or clicked calendar date) | Must be within advance booking window. Cannot be in the past. Cannot be a blocked day. | "This date is not available for booking." / "Bookings must be made at least {X} hours in advance." / "Bookings can only be made up to {X} days in advance." |
| 2 | Start Time | time picker or slot selector | Yes | First available slot | Must be within operating hours. Cannot be in the past. | "This time is outside operating hours ({start} - {end})." |
| 3 | End Time | time picker | Conditional | Start + default duration | Required for Flexible Range style. Must be after start. Must be within operating hours. Duration must be between min and max. | "End time must be after start time." / "Booking duration must be between {min} and {max} minutes." |
| 4 | Time Slot | slot selector | Conditional | -- | Required for Fixed Slots style. Shows only available slots. | "This time slot is no longer available." |

**Conflict Detection**: When a date and time are selected, the system checks for conflicts in real time. If the slot is taken, the form shows:

- "This time is not available."
- **AI suggestion** (if enabled): "Based on your preferences, try {alternative time 1} or {alternative time 2}."
- Link: "Join waitlist" (if waitlist is enabled and the slot is full)

**Step 2: Guest and Details**

| # | Field | Type | Required | Default | Validation | Error Message |
|---|-------|------|----------|---------|------------|---------------|
| 5 | Number of Guests | number | Conditional | 1 | Required if Max Guest Count is configured. Range: 1 to max. | "Maximum {X} guests allowed." |
| 6 | Purpose / Comments | textarea | No | -- | Max 1000 chars | "Comments cannot exceed 1,000 characters." |
| 7 | Booking on Behalf Of | resident search | Conditional | Current user | Staff only. Searches by name, unit, email. | "Please select a valid resident." |

**Step 3: Agreement** (shown only if Require Agreement = true)

| # | Field | Type | Required | Validation | Error Message |
|---|-------|------|----------|------------|---------------|
| 8 | Terms checkbox | checkbox | Yes | Must be checked | "You must agree to the terms and conditions to proceed." |
| 9 | Digital signature | signature pad | Conditional | Required if Agreement Method = Digital signature | "Please provide your signature." |
| 10 | Upload signed document | file upload | Conditional | Required if Agreement Method = Upload. PDF only, 10 MB max | "Please upload a signed agreement (PDF, max 10 MB)." |

**Step 4: Payment** (shown only if Amenity Fee or Security Deposit > 0)

| # | Field | Type | Required | Validation | Error Message |
|---|-------|------|----------|------------|---------------|
| 11 | Payment Method | radio group | Yes | Must select one of the configured methods | "Please select a payment method." |
| 12 | Credit Card (Stripe Elements) | Stripe card input | Conditional | Required if payment method = Credit Card. Stripe validates card number, expiry, CVC | "Your card was declined. Please try a different payment method." / "Invalid card number." |
| 13 | Offline Payment Note | info text | Conditional | Shown if method = Cheque/Cash/E-Transfer. Text: "Please bring your {method} to the front desk before {date}." | -- |

**Order Summary** (shown before final submit):

| Line Item | Value |
|-----------|-------|
| Amenity Fee | $120.00 |
| Security Deposit | $250.00 |
| Service Fee | $2.00 |
| Tax (13% HST) | $15.86 |
| **Total** | **$387.86** |

**Submit Booking Button**:

| Button | Action | Success State | Failure State | Loading State |
|--------|--------|---------------|---------------|---------------|
| Book Now | Validates all steps, creates booking, processes payment if applicable | If auto-approve: "Your booking is confirmed! Booking #{reference}." with calendar event download link. If approval required: "Your booking request has been submitted. You will be notified when it is approved." | Payment failure: "Payment failed. {Stripe error}. Please try again." Conflict: "This slot was just booked by someone else. Please select a different time." General: "Unable to complete booking. Please try again." | Button shows spinner, text changes to "Booking..." All form fields disabled. |
| Cancel | Returns to amenity detail page | No state change | -- | -- |

#### 3.1.5 Calendar View

Interactive calendar showing all bookings across amenities. This is the primary management view for staff.

**Calendar Controls**:

| # | Control | Type | Behavior |
|---|---------|------|----------|
| 1 | Previous / Next | navigation arrows | Move backward or forward by current view unit (month, week, day) |
| 2 | Today | button | Returns calendar to today's date |
| 3 | View Toggle | button group | Month (default), Week, Day, Agenda |
| 4 | Legend | collapsible panel | Color-coded checkboxes per amenity + status colors. Toggles visibility. |
| 5 | Quick Book | button | Opens quick booking modal pre-filled with today's date |

**Calendar Event Display**:

Each booking appears as a colored block with:
- Time range (short format: "9a - 12p")
- Amenity name
- Resident name and unit: "First Last (Unit)"
- Status indicator (small icon: checkmark for approved, clock for pending, X for cancelled)

**Click Behaviors**:
- **Click existing event**: Opens booking detail sidebar panel (not a full page navigation)
- **Click empty slot**: Opens quick booking form pre-filled with that date and time
- **Hover event**: Tooltip with full details (name, unit, time, status, fee)

**Overflow**: When a day has more events than can display, show "+N more" link that switches to day view.

**Pending Approvals Banner**: When bookings await approval, a banner appears above the calendar:

- Yellow background, text: "{N} bookings pending approval"
- "View All" link opens the pending approvals list
- "Approve All" button (with confirmation dialog: "Approve all {N} pending bookings?")

**Responsive**:
- Desktop: Full calendar with sidebar legend
- Tablet: Calendar with collapsible legend
- Mobile: Agenda view by default (list of upcoming bookings)

**Empty State**: Calendar with no events shows: "No bookings this month. Residents can book amenities from the resident portal."

**Loading State**: Calendar skeleton with pulsing blocks on random days.

**Error State**: "Unable to load calendar. Please try again." Retry button.

#### 3.1.6 All Bookings List View

Sortable, filterable, paginated list of all bookings.

**Filter Bar**:

| # | Filter | Type | Default | Options |
|---|--------|------|---------|---------|
| 1 | Search | text input | -- | Searches across resident name, unit number, amenity name, booking reference |
| 2 | Amenity | select | "All Amenities" | All configured amenities |
| 3 | Status | select | "All" | All, Approved, Pending Approval, Declined, Cancelled, Payment Overdue, Outstanding Payment |
| 4 | Date Range | date range picker | Current month | From / To date pickers |
| 5 | Search button | button | -- | Applies filters |
| 6 | Clear Filters | text link | -- | Resets all filters to defaults |

**List Columns**:

| # | Column | Sortable | Format |
|---|--------|----------|--------|
| 1 | Reference # | Yes | Auto-generated (e.g., "AMN-2026-00042") |
| 2 | Amenity | Yes | Amenity name with color dot |
| 3 | Booked By | Yes | "First Last (Unit)" |
| 4 | Date | Yes (default sort, descending) | "Mar 14, 2026" |
| 5 | Time | No | "9:00 AM - 12:00 PM" |
| 6 | Status | Yes | Color-coded badge (green=Approved, amber=Pending, red=Overdue, gray=Cancelled/Declined) |
| 7 | Fee | Yes | "$120.00" or "No Fee" |
| 8 | Actions | No | Dropdown: View, Edit, Cancel, Approve/Decline (staff only) |

**Pagination**: 25 rows per page. Shows "Showing 1-25 of 142 bookings". Page navigation: Previous, page numbers, Next.

**Export**: "Export" button with dropdown: CSV, Excel, PDF. Exports current filtered view.

**Empty State**: "No bookings match your filters." Link: "Clear filters" to reset.

**Loading State**: Table skeleton with 5 pulsing rows.

#### 3.1.7 Booking Detail View

Full detail page for a single booking. Read-only display with action buttons.

**Booking Information**:

| # | Field | Format |
|---|-------|--------|
| 1 | Booking Reference | "AMN-2026-00042" |
| 2 | Amenity | Name with color dot and link to amenity detail |
| 3 | Booked By | "First Last (Unit) - Property Name" with link to resident profile |
| 4 | Email | Resident email |
| 5 | Phone | Resident phone(s) with type labels |
| 6 | Date | "Mar 14, 2026" |
| 7 | Start Time | "9:00 AM" |
| 8 | End Time | "12:00 PM" |
| 9 | Number of Guests | "8" |
| 10 | Status | Color-coded badge |
| 11 | Payment Status | "Paid", "Cheque required", "Payment overdue" |
| 12 | Amenity Fee | "$120.00" |
| 13 | Security Deposit | "$250.00 (refundable)" |
| 14 | Total Charges | "$387.86" with breakdown link |
| 15 | Requestor Comments | Free text |
| 16 | Approver Comments | Free text (staff only) |
| 17 | Agreement Status | "Agreed online on Mar 13, 2026 at 4:30 PM" or "Signed document uploaded" |

**Action Buttons** (role-dependent):

| Button | Visible To | Action | Success State | Failure State | Loading State |
|--------|-----------|--------|---------------|---------------|---------------|
| Edit Booking | Staff, Booking owner (if before cancellation deadline) | Opens edit form for date/time/guests | Toast: "Booking updated." | "Unable to update. The selected time is no longer available." | Spinner on button |
| Cancel Booking | Staff, Booking owner (if before cancellation deadline) | Expand inline form: reason textarea + Save/Discard buttons | Toast: "Booking cancelled." Refund processed if applicable. | "Unable to cancel booking." | Spinner on button |
| Approve | Staff with approval permission | Changes status to Approved. Sends notification to resident. | Toast: "Booking approved." | "Unable to approve." | Spinner |
| Decline | Staff with approval permission | Expand inline form: reason textarea + Decline/Discard buttons | Toast: "Booking declined. Resident has been notified." | "Unable to decline." | Spinner |
| Reassign | Staff only | Expand inline form: resident search + Save/Discard | Toast: "Booking reassigned to {name}." | "Unable to reassign." | Spinner |
| Record Payment | Staff only | Expand inline form: payment method, cheque number, notes + Save | Toast: "Payment recorded." | "Unable to record payment." | Spinner |
| Refund Deposit | Staff only | Expand inline form: refund amount (pre-filled with deposit), reason + Refund/Discard | Toast: "Deposit of {amount} refunded." | "Refund failed." | Spinner |
| Upload Agreement | Booking owner, Staff | File upload: PDF only, 5 MB max | Toast: "Agreement uploaded." | "Upload failed." | Progress bar |

**History / Audit Trail**:

Table below booking information showing every action taken on this booking.

| # | Column | Format |
|---|--------|--------|
| 1 | Date / Time | "Mar 14, 2026 9:30 AM" |
| 2 | Who | "Jane Smith (Front Desk)" -- name and role |
| 3 | Action | "Booking Created", "Approved", "Payment Recorded", "Cancelled", "Reassigned" |
| 4 | Details | Contextual info: "Reason: Scheduling conflict", "Cheque #4521 received" |

#### 3.1.8 Approval Workflow

**Auto-Approve Mode**: Booking is immediately confirmed. Resident receives confirmation notification. Appears on calendar as "Approved."

**Manager/Admin Approval Mode**:
1. Resident submits booking. Status = "Pending Approval."
2. Notification sent to designated approver(s).
3. Booking appears in "Pending Approvals" section above calendar.
4. Approver reviews and clicks Approve or Decline.
5. If approved: status changes, resident notified, payment processed (if credit card).
6. If declined: status changes, resident notified with reason, any hold on credit card is released.

**Batch Approval**: Staff can select multiple pending bookings and approve them all at once. Confirmation dialog: "Approve {N} selected bookings?"

### 3.2 Enhanced Features (v2)

#### 3.2.1 Recurring Bookings

Residents can create bookings that repeat weekly for up to 52 weeks.

| # | Field | Type | Required | Default | Validation | Error Message |
|---|-------|------|----------|---------|------------|---------------|
| 1 | Repeat | toggle | No | Off | -- | -- |
| 2 | Frequency | select | Conditional | Weekly | Options: Weekly, Bi-weekly, Monthly. Required if Repeat = on | -- |
| 3 | Repeat Until | date picker | Conditional | 12 weeks from start | Required if Repeat = on. Cannot exceed Max Recurring Weeks. | "Recurring bookings can repeat for up to {X} weeks." |

The system creates individual booking records for each occurrence. If a conflict exists for one date, that specific occurrence is flagged, and the resident can skip it or choose an alternative time. Remaining occurrences are unaffected.

#### 3.2.2 Waitlist

When a time slot is fully booked and Waitlist is enabled:

1. Resident clicks "Join Waitlist" on the conflict message.
2. System records their position and preferred time.
3. When a cancellation occurs, the first person on the waitlist receives a notification: "A slot has opened for {amenity} on {date} at {time}. Book now before it's taken." Link expires in 4 hours.
4. If the first person does not book within 4 hours, the next person on the waitlist is notified.
5. Resident can view their waitlist position and remove themselves.

#### 3.2.3 Maintenance Schedule Blocking

When a maintenance task is scheduled for an amenity (from the Maintenance module):

1. Those time windows are automatically blocked on the booking calendar.
2. Blocked times appear in gray with a wrench icon and text: "Unavailable - Maintenance."
3. Residents cannot book during blocked windows.
4. If a booking already exists during a newly scheduled maintenance window, staff are warned and can reschedule the booking or the maintenance.

#### 3.2.4 Amenity Usage Reports

Available to Property Manager, Property Admin, and Board Member roles.

| # | Report | Description | Export Formats |
|---|--------|-------------|----------------|
| 1 | Utilization Report | Bookings per amenity over time, peak hours heatmap, average occupancy rate | CSV, Excel, PDF |
| 2 | Revenue Report | Fee revenue per amenity, deposit held vs refunded, outstanding payments | CSV, Excel, PDF |
| 3 | Booking Trends | Month-over-month booking volume, cancellation rate, no-show rate | CSV, Excel, PDF |
| 4 | Resident Usage | Bookings per unit, most active residents, units that never book | CSV, Excel, PDF |

### 3.3 Future Features (v3+)

#### 3.3.1 Dynamic Pricing

AI suggests peak and off-peak pricing adjustments based on historical demand. Admin reviews and approves pricing changes. System applies time-of-day and day-of-week multipliers automatically.

#### 3.3.2 Digital Signage Integration

Amenity availability and upcoming bookings display on lobby screens and elevator displays. Shows real-time status: "Party Room - Available" or "BBQ Area - Booked until 3:00 PM."

#### 3.3.3 Guest Pre-Registration

Residents can pre-register guests for amenity bookings. Guests receive a QR code for building entry that is valid only during the booking window.

#### 3.3.4 Amenity Rating and Feedback

After a booking ends, residents receive a prompt to rate the amenity (1-5 stars) and leave feedback. AI analyzes feedback to identify recurring issues.

---

## 4. Data Model

### 4.1 Amenity

```
Amenity
├── id (UUID, auto-generated)
├── property_id → Property (FK, required)
├── name (varchar 100, required, unique per property)
├── description (text, 2000 chars max)
├── group_id → AmenityGroup (FK, required)
├── display_order (integer, default auto-increment)
├── active (boolean, default true)
├── color (varchar 7, hex, required)
├── icon (varchar 100, nullable)
├── booking_style (enum: fixed_slots, flexible_range, full_day)
├── operating_hours_start (time, required)
├── operating_hours_end (time, required)
├── slot_duration_minutes (integer, nullable -- for fixed_slots)
├── min_booking_minutes (integer, nullable -- for flexible_range)
├── max_booking_minutes (integer, nullable -- for flexible_range)
├── days_available (integer[], bitmask or array of day numbers 0-6)
├── holiday_closures (boolean, default true)
├── blocked_hours (JSONB -- per-day blocked time windows)
├── buffer_minutes (integer, default 0)
├── max_concurrent (integer, default 1)
├── advance_min_hours (integer, default 0)
├── advance_max_days (integer, default 90)
├── max_per_unit_week (integer, default 0 = unlimited)
├── max_per_unit_month (integer, default 0 = unlimited)
├── max_guests (integer, default 0 = unlimited)
├── guest_security_threshold (integer, default 0 = disabled)
├── security_rate (decimal 10,2, default 0)
├── security_min_hours (integer, default 4)
├── allow_recurring (boolean, default false)
├── max_recurring_weeks (integer, default 12)
├── resident_only (boolean, default true)
├── require_agreement (boolean, default false)
├── agreement_method (enum: checkbox, signature, upload, nullable)
├── terms_and_conditions (text, 10000 chars max, nullable)
├── agreement_template_url (varchar 500, nullable)
├── custom_instructions (text, 2000 chars max, nullable)
├── fee (decimal 10,2, default 0)
├── fee_type (enum: flat, hourly, per_guest, per_guest_hourly, nullable)
├── security_deposit (decimal 10,2, default 0)
├── deposit_refund_policy (enum: full, partial, non_refundable, nullable)
├── accepted_payment_methods (varchar[], nullable)
├── tax_rate (decimal 5,2, nullable -- inherits property default)
├── service_fee (decimal 10,2, default 0)
├── approval_mode (enum: auto, manager, admin)
├── cancellation_policy (enum: free_until_start, hours_before, no_cancel, non_refundable)
├── cancellation_hours (integer, nullable)
├── waitlist_enabled (boolean, default false)
├── max_waitlist_size (integer, default 5)
├── primary_photo_url (varchar 500, nullable)
├── gallery_photos (JSONB -- array of {url, caption, order})
├── ai_metadata (JSONB -- usage patterns, demand scores)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
├── created_by → User (FK)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.2 AmenityGroup

```
AmenityGroup
├── id (UUID)
├── property_id → Property (FK, nullable -- null = system default)
├── name (varchar 100, required)
├── display_order (integer)
├── icon (varchar 100, nullable)
├── active (boolean, default true)
├── created_at (timestamp)
└── updated_at (timestamp)
```

System default groups: Recreation, Common Areas, Move-In/Out, Guest Accommodations, Sports & Fitness.

### 4.3 Booking

```
Booking
├── id (UUID, auto-generated)
├── reference_number (varchar 20, auto-generated, unique per property -- format: "AMN-YYYY-NNNNN")
├── property_id → Property (FK, required)
├── amenity_id → Amenity (FK, required)
├── unit_id → Unit (FK, required)
├── resident_id → User (FK, required -- the person the booking is for)
├── created_by → User (FK, required -- may differ from resident if staff books on behalf)
├── start_date (date, required)
├── start_time (time, required)
├── end_date (date, required)
├── end_time (time, required)
├── guest_count (integer, default 1)
├── status (enum: pending, approved, declined, cancelled, completed, no_show)
├── approval_status (enum: pending, approved, declined)
├── approved_by → User (FK, nullable)
├── approved_at (timestamp, nullable)
├── declined_reason (text, 1000 chars, nullable)
├── cancellation_reason (text, 1000 chars, nullable)
├── cancelled_by → User (FK, nullable)
├── cancelled_at (timestamp, nullable)
├── requestor_comments (text, 1000 chars, nullable)
├── approver_comments (text, 1000 chars, nullable)
├── fee_amount (decimal 10,2, default 0)
├── deposit_amount (decimal 10,2, default 0)
├── service_fee (decimal 10,2, default 0)
├── tax_amount (decimal 10,2, default 0)
├── total_amount (decimal 10,2, computed)
├── payment_status (enum: not_required, pending, paid, overdue, refunded, partial_refund)
├── payment_method (enum: credit_card, cheque, cash, e_transfer, nullable)
├── stripe_payment_intent_id (varchar 100, nullable)
├── stripe_refund_id (varchar 100, nullable)
├── cheque_number (varchar 50, nullable)
├── payment_received_at (timestamp, nullable)
├── deposit_refunded (boolean, default false)
├── deposit_refund_amount (decimal 10,2, default 0)
├── deposit_refund_reason (text, 500 chars, nullable)
├── agreement_accepted (boolean, default false)
├── agreement_method (enum: checkbox, signature, upload, nullable)
├── agreement_accepted_at (timestamp, nullable)
├── agreement_document_url (varchar 500, nullable -- uploaded signed doc)
├── signature_data (binary, nullable)
├── recurring_group_id (UUID, nullable -- links recurring instances)
├── recurring_sequence (integer, nullable -- 1st, 2nd, 3rd occurrence)
├── waitlist_position (integer, nullable)
├── ai_metadata (JSONB -- no-show probability, suggested alternatives)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── audit_log[] → BookingAuditEntry
```

### 4.4 BookingAuditEntry

```
BookingAuditEntry
├── id (UUID)
├── booking_id → Booking (FK)
├── action (enum: created, approved, declined, cancelled, updated, payment_recorded,
│           deposit_refunded, reassigned, status_changed, agreement_uploaded)
├── performed_by → User (FK)
├── performed_at (timestamp with timezone)
├── details (JSONB -- before/after values, reason text, payment info)
└── ip_address (varchar 45)
```

### 4.5 WaitlistEntry

```
WaitlistEntry
├── id (UUID)
├── amenity_id → Amenity (FK)
├── booking_date (date)
├── preferred_start_time (time)
├── preferred_end_time (time)
├── resident_id → User (FK)
├── unit_id → Unit (FK)
├── position (integer)
├── status (enum: waiting, offered, booked, expired, removed)
├── offered_at (timestamp, nullable)
├── offer_expires_at (timestamp, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### 4.6 Relationships

```
Property ──1:N──> Amenity
Property ──1:N──> AmenityGroup
Amenity  ──N:1──> AmenityGroup
Amenity  ──1:N──> Booking
Booking  ──N:1──> Unit
Booking  ──N:1──> User (resident)
Booking  ──N:1──> User (created_by)
Booking  ──1:N──> BookingAuditEntry
Amenity  ──1:N──> WaitlistEntry
```

### 4.7 Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| Amenity | `(property_id, active)` | Filter active amenities per property |
| Booking | `(amenity_id, start_date, start_time)` | Conflict detection |
| Booking | `(property_id, status, start_date)` | Calendar and list filtering |
| Booking | `(unit_id, start_date)` | Per-unit booking limits |
| Booking | `(recurring_group_id)` | Group recurring instances |
| Booking | `(reference_number)` UNIQUE | Reference number lookup |
| WaitlistEntry | `(amenity_id, booking_date, position)` | Waitlist ordering |

---

## 5. User Flows

### 5.1 Resident Books an Amenity (Happy Path)

```
1. Resident navigates to Amenity Booking from sidebar
2. Card grid loads showing available amenities
3. Resident clicks "Book Now" on Party Room card
4. Amenity detail page loads with booking form (right column)
5. Resident selects date: March 28, 2026
6. Available time slots load for that date
7. Resident selects 6:00 PM - 10:00 PM
8. Resident enters guest count: 15
   → System detects guest count > security threshold (11)
   → Info message: "A security guard is required for events with 11+ guests.
     Security fee: $120.00 (4 hours minimum)."
9. Resident reads and accepts terms and conditions (checkbox)
10. Order summary appears: Fee $120 + Security $120 + Deposit $1,000 + Tax $31.20 = $1,271.20
11. Resident selects Credit Card and enters card details via Stripe Elements
12. Resident clicks "Book Now"
13. System validates, creates booking, processes payment
14. Success: "Your booking is confirmed! Reference #AMN-2026-00089"
15. Confirmation email sent with calendar event attachment (.ics)
```

### 5.2 Staff Books on Behalf of Resident

```
1. Front Desk staff navigates to Amenity Booking
2. Clicks "Quick Book" button on calendar view
3. Selects amenity: Elevator
4. Selects date and time
5. In "Booking on Behalf Of" field, searches for "Pan" → selects "Shu Zhen Pan (0703)"
6. Selects payment method: Cheque
7. Clicks "Book Now"
8. Booking created with status based on approval mode
9. Notification sent to resident: "A booking has been made on your behalf..."
```

### 5.3 Manager Approves a Booking

```
1. Property Manager opens Amenity Booking → Calendar View
2. Yellow banner: "3 bookings pending approval"
3. Clicks "View All" → Pending Approvals table shown
4. Reviews Party Room booking for Vishnu K. (1402) on Apr 3
5. Clicks "View Details" → Booking detail sidebar opens
6. Reviews booking info, adds Approver Comment: "Approved. Please deliver cheque by March 30."
7. Clicks "Approve"
8. Status changes to Approved
9. Resident receives notification: "Your booking for Party Room has been approved."
10. Booking color changes on calendar from amber (pending) to amenity color
```

### 5.4 Resident Cancels a Booking

```
1. Resident navigates to Amenity Booking → My Bookings (list of their bookings)
2. Finds the booking to cancel
3. Clicks "Cancel" action
4. Inline form expands: "Reason for cancellation" textarea
5. Resident enters reason and clicks "Confirm Cancellation"
6. System checks cancellation policy:
   - If within cancellation window: booking cancelled, refund processed
   - If outside window: message "This booking cannot be cancelled less than 24 hours before start time."
7. On success: Toast "Booking cancelled. Refund of $120.00 will be processed within 5-7 business days."
8. If waitlist exists: first person on waitlist is notified
```

### 5.5 Waitlist Flow

```
1. Resident tries to book Party Room for Saturday April 5
2. System: "This time is not available."
3. Waitlist button appears: "Join Waitlist (Position: 2)"
4. Resident clicks "Join Waitlist"
5. Confirmation: "You are #2 on the waitlist for Party Room on April 5."
6. [Later] Original booking is cancelled
7. Position 1 person receives notification with 4-hour booking link
8. Position 1 does not act within 4 hours → link expires
9. Resident (position 2) receives notification: "A slot has opened!"
10. Resident clicks link, completes booking within 4 hours
11. Booking confirmed, waitlist entry removed
```

---

## 6. UI/UX

### 6.1 Layout Specifications

**Amenity Card Grid**:

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Cards per row | 4 | 2 | 1 |
| Card width | 280px | 340px | 100% |
| Card height | Auto (photo 180px + content) | Same | Same |
| Photo aspect ratio | 16:9 | 16:9 | 16:9 |
| Gap between cards | 24px | 16px | 12px |
| Card border | 1px solid #E5E5EA | Same | Same |
| Card border radius | 12px | Same | Same |
| Card shadow | 0 1px 3px rgba(0,0,0,0.08) | Same | Same |
| Card hover | Shadow increases to 0 4px 12px rgba(0,0,0,0.12) | No hover (touch) | No hover |

**Amenity Detail Page**:

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Layout | 2 columns (60% / 40%) | 2 columns (55% / 45%) | Single column |
| Right column | Sticky (sticks on scroll) | Sticky | Below left column |
| Hero photo height | 400px | 300px | 200px |
| Booking form | Always visible in right column | Same | Collapsible card, "Book Now" sticky footer button reveals form |

**Calendar View**:

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Default view | Month | Week | Agenda (list) |
| Legend | Sidebar (always visible) | Collapsible above calendar | Collapsible above list |
| Event text | Full: "9a-12p Party Room - Smith (1205)" | Abbreviated: "9a Party Room" | List item with full details |
| Click behavior | Sidebar panel opens | Sidebar panel opens | Full-screen detail |

### 6.2 Component Specifications

**Status Badges**:

| Status | Background | Text Color | Icon |
|--------|-----------|------------|------|
| Approved | #34C75920 (green, 12% opacity) | #34C759 | Checkmark |
| Pending Approval | #FF9F0A20 (amber, 12% opacity) | #FF9F0A | Clock |
| Declined | #8E8E9320 (gray, 12% opacity) | #8E8E93 | X mark |
| Cancelled | #8E8E9320 | #8E8E93 | X mark |
| Payment Overdue | #FF3B3020 (red, 12% opacity) | #FF3B30 | Exclamation |
| Outstanding Payment | #FF3B3020 | #FF3B30 | Dollar sign |
| Completed | #5AC8FA20 (blue, 12% opacity) | #5AC8FA | Check circle |
| No-Show | #AF52DE20 (purple, 12% opacity) | #AF52DE | Person X |

**Booking Form Stepper** (progressive disclosure):

Step indicators appear as a horizontal bar above the form:
1. Date & Time (circle with "1")
2. Details (circle with "2")
3. Agreement (circle with "3", shown only if required)
4. Payment (circle with "4", shown only if fee > 0)

Active step: filled primary color circle with white number. Completed step: green checkmark circle. Upcoming step: gray outlined circle.

### 6.3 Empty States

| Screen | Empty State Message | Illustration | Action |
|--------|-------------------|--------------|--------|
| Amenity Card Grid (Resident) | "No amenities are available for booking right now. Check back later or contact your property manager." | Calendar with question mark | -- |
| Amenity Card Grid (Admin) | "No amenities configured yet. Add your first amenity to get started." | Plus icon with sparkle | "Add Amenity" button |
| Calendar (no bookings) | "No bookings this month." | Empty calendar | "Create Booking" link |
| All Bookings (no results) | "No bookings match your filters." | Magnifying glass | "Clear Filters" link |
| My Bookings (Resident, no bookings) | "You have no upcoming bookings. Browse amenities to make your first reservation." | Calendar with star | "Browse Amenities" button |
| Waitlist (empty) | "No one is on the waitlist for this amenity." | -- | -- |
| Pending Approvals (none) | Section is hidden entirely when there are no pending bookings | -- | -- |

### 6.4 Tooltips

| Field / Element | Tooltip Text |
|----------------|-------------|
| Maximum Concurrent Bookings | "How many bookings can overlap at the same time. Set to 3 if you have 3 BBQ stations that can each be booked independently." |
| Guest Count Triggers Security | "When a booking has more guests than this number, a security guard is automatically added and the security fee applies." |
| Buffer Between Bookings | "Time gap between bookings for cleanup or turnover. A 30-minute buffer means if one booking ends at 2:00 PM, the next cannot start until 2:30 PM." |
| Advance Booking Minimum | "Minimum lead time before a booking. Set to 24 hours to prevent same-day bookings." |
| Waitlist Enabled | "When a time slot is full, residents can join a waitlist. They are notified automatically when a cancellation opens the slot." |
| Approval Mode | "Auto-approve: bookings are confirmed instantly. Manager/Admin approval: bookings wait for manual review before confirmation." |
| Recurring Bookings | "Allows residents to set up weekly or bi-weekly bookings that repeat for a set number of weeks." |

---

## 7. AI Integration

Eight AI capabilities enhance the Amenity Booking module. All are optional and controlled by Super Admin toggles. Every capability has a manual fallback -- the module works without AI.

### 7.1 Smart Conflict Resolution

| Attribute | Detail |
|-----------|--------|
| **Trigger** | When a resident selects a date/time that is already booked |
| **Model** | Claude Haiku |
| **Cost** | ~$0.001 per invocation |
| **Input** | Selected amenity, requested date/time, resident's booking history, full availability calendar |
| **Output** | Top 3 alternative time slot suggestions ranked by likelihood of acceptance |
| **Display** | Below the conflict message: "Try these available times: [Sat 2:00 PM], [Sun 10:00 AM], [Next Sat 9:00 AM]" |
| **Fallback** | Resident manually browses the calendar to find an open slot |
| **Privacy** | No PII sent to AI. Only anonymized slot data and usage patterns. |

### 7.2 Demand Prediction

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Weekly scheduled task (Monday 4:00 AM) |
| **Model** | Claude Sonnet |
| **Cost** | ~$0.01 per invocation |
| **Input** | All booking data for the past 90 days, seasonal patterns, holiday calendar |
| **Output** | Demand forecast per amenity per day for next 30 days. Heatmap data. |
| **Display** | Admin dashboard widget: "High demand expected for Party Room next Saturday." Calendar overlay showing predicted demand intensity (light/medium/heavy color bands). |
| **Fallback** | No demand prediction. Admin relies on historical reports. |

### 7.3 Dynamic Pricing Suggestions

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Monthly scheduled task |
| **Model** | Claude Sonnet |
| **Cost** | ~$0.005 per invocation |
| **Input** | Booking data, revenue data, utilization rates per amenity per time slot |
| **Output** | Pricing recommendations: "Increase Party Room Saturday evening fee by 20% (high demand). Reduce Tuesday morning fee by 30% (low utilization)." |
| **Display** | Admin notification card in Settings. Requires manual approval to apply changes. Never auto-applied. |
| **Fallback** | Static pricing maintained by admin. |

### 7.4 Usage Pattern Analysis

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Weekly scheduled task (Monday 4:00 AM) |
| **Model** | Claude Sonnet |
| **Cost** | ~$0.01 per invocation |
| **Input** | All booking data for past 90 days |
| **Output** | Usage analytics report: peak hours, underutilized periods, seasonal trends, busiest amenities, average booking duration |
| **Display** | Reports module: "Amenity Usage Intelligence" report with charts and heatmaps |
| **Fallback** | Standard utilization report without AI commentary |

### 7.5 Cancellation Prediction (No-Show Prediction)

| Attribute | Detail |
|-----------|--------|
| **Trigger** | 24 hours before each booking |
| **Model** | Claude Haiku |
| **Cost** | ~$0.001 per invocation |
| **Input** | Resident's booking history, historical no-show rate, booking characteristics |
| **Output** | No-show probability (0-100%). If high risk (>60%), triggers a preemptive reminder. |
| **Display** | Staff sees a small warning icon on high-risk bookings: "This booking has a 73% no-show probability." Resident receives an extra reminder: "Don't forget your booking tomorrow!" |
| **Fallback** | Standard 24-hour reminder sent to all bookings regardless of risk |

### 7.6 Capacity Optimization

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Monthly scheduled task |
| **Model** | Claude Sonnet |
| **Cost** | ~$0.005 per invocation |
| **Input** | Usage data, incident reports, resident feedback (if collected), current capacity settings |
| **Output** | Capacity recommendations: "BBQ area can safely support 6 concurrent bookings (currently set to 4). Party Room should reduce from 50 to 40 guests based on 3 noise complaints." |
| **Display** | Admin notification in Settings. Requires manual approval. |
| **Fallback** | Static capacity limits maintained by admin. |

### 7.7 Terms Auto-Generation

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Admin clicks "Generate Terms" button on amenity setup |
| **Model** | Claude Sonnet |
| **Cost** | ~$0.005 per invocation |
| **Input** | Amenity type, capacity, fees, building rules, existing terms from other amenities at this property |
| **Output** | Draft terms and conditions text tailored to the amenity type |
| **Display** | Populates the Terms and Conditions rich text editor with a draft. Admin reviews and edits before saving. Banner: "AI-generated draft. Please review and customize." |
| **Fallback** | Admin writes terms manually or copies from a template. |

### 7.8 Booking Recommendation

| Attribute | Detail |
|-----------|--------|
| **Trigger** | When resident opens the booking form |
| **Model** | Claude Haiku |
| **Cost** | ~$0.001 per invocation |
| **Input** | Resident's booking history, availability calendar, time preferences inferred from past bookings |
| **Output** | Top 3 suggested time slots: "Based on your history, you usually book on Saturday mornings. Here are available slots:" |
| **Display** | Subtle suggestion bar above the date picker. Dismissible. |
| **Fallback** | No suggestions. Resident picks date and time manually. |

---

## 8. Analytics

Three layers of analytics, following the platform-wide pattern defined in 01-Architecture.

### 8.1 Operational Metrics (What Happened)

| # | Metric | Calculation | Display |
|---|--------|-------------|---------|
| 1 | Total Bookings | Count of bookings in period | KPI card on dashboard |
| 2 | Bookings by Status | Count per status (approved, pending, cancelled, declined, no-show) | Stacked bar chart |
| 3 | Bookings by Amenity | Count per amenity in period | Horizontal bar chart |
| 4 | Cancellation Rate | Cancelled / Total bookings * 100 | Percentage with trend arrow |
| 5 | No-Show Rate | No-shows / Total approved bookings * 100 | Percentage with trend arrow |
| 6 | Average Booking Duration | Mean duration in minutes across all bookings | KPI card |
| 7 | Peak Booking Day | Day of week with highest booking count | Text widget |
| 8 | Peak Booking Hour | Hour of day with highest booking count | Text widget |

### 8.2 Performance Metrics (How Well)

| # | Metric | Calculation | Display |
|---|--------|-------------|---------|
| 1 | Utilization Rate | Booked hours / Available hours * 100, per amenity | Gauge chart per amenity |
| 2 | Revenue | Sum of fee_amount for paid bookings in period | Currency KPI with trend |
| 3 | Outstanding Payments | Sum of unpaid fees | Currency KPI (red if > 0) |
| 4 | Deposit Balance | Deposits held - Deposits refunded | Currency KPI |
| 5 | Approval Turnaround | Median time from booking creation to approval | Duration KPI |
| 6 | Waitlist Conversion | Waitlist offers that converted to bookings / Total offers * 100 | Percentage |
| 7 | Repeat Booking Rate | Residents with 2+ bookings / Total unique bookers * 100 | Percentage |

### 8.3 AI Insights (What To Do)

| # | Insight | Source AI Capability | Example |
|---|---------|---------------------|---------|
| 1 | Demand forecast | Demand Prediction | "Party Room demand expected to spike 40% next month (graduation season)." |
| 2 | Pricing opportunity | Dynamic Pricing | "Tuesday BBQ bookings are 15% of capacity. Consider a 25% discount." |
| 3 | Capacity recommendation | Capacity Optimization | "Guest Suite utilization is 95%. Consider adding hours." |
| 4 | At-risk bookings | Cancellation Prediction | "4 bookings this week have >60% no-show probability." |
| 5 | Underutilized amenity | Usage Pattern Analysis | "Tennis Court has been booked only 3 times in the past 30 days." |

---

## 9. Notifications

### 9.1 Notification Triggers

| # | Event | Recipients | Channels | Template |
|---|-------|-----------|----------|----------|
| 1 | Booking Created (auto-approve) | Resident | Email, Push | "Your booking for {amenity} on {date} at {time} is confirmed. Reference: {ref}." |
| 2 | Booking Created (approval required) | Resident, Approver(s) | Email, Push | Resident: "Your booking request for {amenity} has been submitted." Approver: "New booking request for {amenity} from {name} ({unit})." |
| 3 | Booking Approved | Resident | Email, Push, SMS | "Your booking for {amenity} on {date} has been approved." |
| 4 | Booking Declined | Resident | Email, Push | "Your booking for {amenity} on {date} has been declined. Reason: {reason}." |
| 5 | Booking Cancelled (by resident) | Staff (approver) | Email, Push | "{name} cancelled their {amenity} booking on {date}." |
| 6 | Booking Cancelled (by staff) | Resident | Email, Push, SMS | "Your booking for {amenity} on {date} has been cancelled by management. Reason: {reason}." |
| 7 | Payment Reminder | Resident | Email, Push | "Payment of {amount} is due for your {amenity} booking on {date}. Please deliver {method} to the front desk." |
| 8 | Payment Overdue | Resident, Staff | Email, Push, SMS | "Payment for your {amenity} booking is overdue. Your booking may be cancelled." |
| 9 | 24-Hour Reminder | Resident | Email, Push | "Reminder: You have a booking for {amenity} tomorrow at {time}." |
| 10 | Waitlist Offer | Resident | Email, Push, SMS | "A slot has opened for {amenity} on {date}. Book now -- this offer expires in 4 hours." |
| 11 | Booking Modified | Resident | Email, Push | "Your booking for {amenity} has been updated. New time: {date} {time}." |
| 12 | Deposit Refunded | Resident | Email | "Your deposit of {amount} for {amenity} has been refunded." |
| 13 | Recurring Booking Conflict | Resident | Email, Push | "Your recurring booking for {amenity} on {date} could not be created due to a conflict. All other dates are confirmed." |

### 9.2 Notification Preferences

Residents can control amenity booking notifications per channel in their notification preferences (see 08-User Management). The 24-hour reminder can be turned on or off. Payment-related notifications cannot be disabled.

### 9.3 Calendar Event Attachment

Booking confirmation and approval emails include an `.ics` calendar event attachment with:
- Event title: "{Amenity Name} Booking"
- Start/end time matching the booking
- Location: Building name and amenity name
- Description: Booking reference, guest count, special instructions
- Reminder: 1 hour before

---

## 10. API

### 10.1 Endpoints

All endpoints require authentication. Responses follow the standard envelope format defined in 01-Architecture.

#### Amenity Endpoints

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/amenities` | List amenities for property (filterable by group, active status) | All authenticated |
| GET | `/api/v1/amenities/:id` | Get amenity detail with availability | All authenticated |
| POST | `/api/v1/amenities` | Create amenity | Property Admin |
| PUT | `/api/v1/amenities/:id` | Update amenity | Property Admin, Property Manager |
| DELETE | `/api/v1/amenities/:id` | Soft-delete amenity | Property Admin |
| GET | `/api/v1/amenities/:id/availability` | Get available slots for a date range | All authenticated |
| POST | `/api/v1/amenities/:id/photos` | Upload amenity photo | Property Admin, Property Manager |
| DELETE | `/api/v1/amenities/:id/photos/:photoId` | Remove amenity photo | Property Admin, Property Manager |

#### Booking Endpoints

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/bookings` | List bookings (filterable by amenity, status, date, unit) | Staff: all bookings. Resident: own bookings. |
| GET | `/api/v1/bookings/:id` | Get booking detail | Staff: any booking. Resident: own bookings. |
| POST | `/api/v1/bookings` | Create booking | All authenticated (staff can book on behalf) |
| PUT | `/api/v1/bookings/:id` | Update booking (date/time/guests/comments) | Staff: any. Resident: own, if before cancellation deadline. |
| POST | `/api/v1/bookings/:id/cancel` | Cancel booking | Staff: any. Resident: own, if within cancellation policy. |
| POST | `/api/v1/bookings/:id/approve` | Approve booking | Staff with approval permission |
| POST | `/api/v1/bookings/:id/decline` | Decline booking (body: reason) | Staff with approval permission |
| POST | `/api/v1/bookings/:id/reassign` | Reassign to different resident | Staff only |
| POST | `/api/v1/bookings/:id/payment` | Record offline payment | Staff only |
| POST | `/api/v1/bookings/:id/refund` | Refund deposit | Staff only |
| POST | `/api/v1/bookings/:id/agreement` | Upload signed agreement | Booking owner, Staff |
| GET | `/api/v1/bookings/calendar` | Calendar events for date range (optimized for FullCalendar) | Staff |
| GET | `/api/v1/bookings/pending` | List pending approvals | Staff with approval permission |
| POST | `/api/v1/bookings/batch-approve` | Approve multiple bookings (body: booking IDs) | Staff with approval permission |

#### Waitlist Endpoints

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/api/v1/waitlist` | Join waitlist for a slot | Resident |
| GET | `/api/v1/waitlist` | Get resident's waitlist entries | Resident: own. Staff: all. |
| DELETE | `/api/v1/waitlist/:id` | Remove from waitlist | Resident: own. Staff: any. |

#### AI Endpoints

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| GET | `/api/v1/amenities/:id/ai/suggestions` | Get AI booking time suggestions | All authenticated |
| GET | `/api/v1/amenities/:id/ai/demand` | Get demand forecast data | Staff, Board Member |
| POST | `/api/v1/amenities/:id/ai/generate-terms` | Generate terms and conditions draft | Property Admin |

### 10.2 Key Request / Response Examples

**Create Booking Request**:

```json
POST /api/v1/bookings
{
  "amenity_id": "uuid-here",
  "start_date": "2026-03-28",
  "start_time": "18:00",
  "end_date": "2026-03-28",
  "end_time": "22:00",
  "guest_count": 15,
  "requestor_comments": "Birthday party for my daughter",
  "payment_method": "credit_card",
  "stripe_payment_method_id": "pm_xxx",
  "agreement_accepted": true,
  "resident_id": null
}
```

**Create Booking Response (Success)**:

```json
{
  "status": "success",
  "data": {
    "id": "booking-uuid",
    "reference_number": "AMN-2026-00089",
    "status": "approved",
    "amenity": { "id": "...", "name": "Party Room" },
    "start_date": "2026-03-28",
    "start_time": "18:00",
    "end_date": "2026-03-28",
    "end_time": "22:00",
    "guest_count": 15,
    "total_amount": 1271.20,
    "payment_status": "paid",
    "created_at": "2026-03-14T15:30:00Z"
  }
}
```

**Conflict Response**:

```json
{
  "status": "error",
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This time slot is not available.",
    "details": {
      "conflicting_booking": { "start_time": "17:00", "end_time": "23:00" },
      "ai_suggestions": [
        { "date": "2026-03-29", "start_time": "18:00", "end_time": "22:00", "confidence": 0.92 },
        { "date": "2026-04-04", "start_time": "18:00", "end_time": "22:00", "confidence": 0.87 },
        { "date": "2026-03-28", "start_time": "10:00", "end_time": "14:00", "confidence": 0.65 }
      ],
      "waitlist_available": true,
      "waitlist_position": 2
    }
  }
}
```

### 10.3 WebSocket Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `booking.created` | Booking summary | Real-time calendar update |
| `booking.approved` | Booking ID, new status | Calendar color change |
| `booking.cancelled` | Booking ID | Remove from calendar |
| `booking.updated` | Booking summary | Update calendar event |
| `waitlist.offered` | Waitlist entry, amenity, time | Notify waiting resident |

### 10.4 Rate Limits

| Endpoint Group | Rate Limit | Window |
|---------------|------------|--------|
| GET (list/detail) | 60 requests | Per minute |
| POST (create booking) | 10 requests | Per minute per user |
| POST (batch approve) | 5 requests | Per minute |
| AI endpoints | 20 requests | Per minute per property |

---

## 11. Completeness Checklist

| # | Requirement | Status | Section |
|---|-------------|--------|---------|
| 1 | Amenity setup with 49+ fields across 7 sections | Done | 3.1.1 |
| 2 | Calendar view (month, week, day, agenda) | Done | 3.1.5 |
| 3 | List view with sort, filter, pagination | Done | 3.1.6 |
| 4 | Card grid view for browsing amenities | Done | 3.1.2 |
| 5 | Booking flow with time slot selection | Done | 3.1.4 |
| 6 | Payment integration (Stripe) | Done | 3.1.4 (Step 4), 4.3 |
| 7 | Offline payment methods (cheque, cash, e-transfer) | Done | 3.1.4, 3.1.7 |
| 8 | Approval workflow (auto-approve, manager-approve, admin-approve) | Done | 3.1.8 |
| 9 | Terms and conditions with multiple agreement methods | Done | 3.1.1 (Section G), 3.1.4 (Step 3) |
| 10 | Capacity limits and concurrent booking support | Done | 3.1.1 (fields 21, 26) |
| 11 | Booking rules (advance days, max per unit, cancellation policy) | Done | 3.1.1 (Section D, F) |
| 12 | Waitlist with automatic promotion | Done | 3.2.2 |
| 13 | Recurring bookings | Done | 3.2.1 |
| 14 | Amenity photos (primary + gallery) | Done | 3.1.1 (Section B), 3.1.2 |
| 15 | Maintenance schedule blocking | Done | 3.2.3 |
| 16 | Resident vs staff booking (including on-behalf-of) | Done | 3.1.4, 5.1, 5.2 |
| 17 | Security guard auto-assignment for large events | Done | 3.1.1 (fields 27-29), 5.1 |
| 18 | Booking detail with full action set | Done | 3.1.7 |
| 19 | Audit trail / history | Done | 3.1.7, 4.4 |
| 20 | AI: Smart Conflict Resolution | Done | 7.1 |
| 21 | AI: Demand Prediction | Done | 7.2 |
| 22 | AI: Dynamic Pricing Suggestions | Done | 7.3 |
| 23 | AI: Usage Pattern Analysis | Done | 7.4 |
| 24 | AI: Cancellation Prediction | Done | 7.5 |
| 25 | AI: Capacity Optimization | Done | 7.6 |
| 26 | AI: Terms Auto-Generation | Done | 7.7 |
| 27 | AI: Booking Recommendation | Done | 7.8 |
| 28 | Analytics: operational, performance, AI insight layers | Done | 8.1, 8.2, 8.3 |
| 29 | Notifications: 13 trigger types, multi-channel, .ics attachment | Done | 9.1, 9.3 |
| 30 | API: full CRUD, calendar, waitlist, batch approve, AI endpoints | Done | 10.1 |
| 31 | WebSocket real-time events | Done | 10.3 |
| 32 | Data model with all entities, relationships, and indexes | Done | 4.1-4.7 |
| 33 | User flows for all 5 key scenarios | Done | 5.1-5.5 |
| 34 | Desktop, tablet, mobile layouts for all screens | Done | 6.1 |
| 35 | Empty states with guidance for all screens | Done | 6.3 |
| 36 | Loading states for all screens | Done | 3.1.2, 3.1.5, 3.1.6 |
| 37 | Error states for all screens | Done | 3.1.2, 3.1.5, 3.1.6 |
| 38 | Tooltips for complex features | Done | 6.4 |
| 39 | Every field: data type, max length, required, default, validation, error message | Done | 3.1.1, 3.1.4, 3.2.1 |
| 40 | Every button: action, success, failure, loading states | Done | 3.1.1, 3.1.4, 3.1.7 |
| 41 | Role-based access on every endpoint | Done | 10.1 |
| 42 | Rate limits | Done | 10.4 |
| 43 | Reports: utilization, revenue, trends, resident usage | Done | 3.2.4 |
| 44 | Export: CSV, Excel, PDF | Done | 3.1.6, 3.2.4 |
| 45 | Multi-building support (building selector) | Done | 3.1.2 |
| 46 | Progressive disclosure in admin form | Done | 3.1.1 |
| 47 | Deposit refund workflow | Done | 3.1.7 |
| 48 | Reference number auto-generation | Done | 4.3 |
| 49 | Cancellation with refund processing | Done | 5.4, 3.1.7 |
| 50 | Future: dynamic pricing, digital signage, guest pre-registration, ratings | Done | 3.3 |

---

*Document: 06-amenity-booking.md*
*Module: Amenity Booking*
*Lines: ~750*
*Last updated: 2026-03-14*
