# Audit: 06-Amenity Booking PRD vs Research

> **Auditor**: Cross-reference audit
> **Date**: 2026-03-14
> **Research sources**: `docs/amenities.md` (Aquarius), `docs/platform-3/deep-dive-amenity-booking.md` (Condo Control)
> **PRD audited**: `docs/prd/06-amenity-booking.md`

---

## Summary

The PRD is comprehensive and covers the vast majority of features, fields, workflows, and edge cases observed in both Aquarius (Platform 1) and Condo Control (Platform 3). The 49-field admin setup, booking creation flow, calendar view, all-bookings list, booking detail view, approval workflow, payment integration, and audit trail are all well-specified. The PRD also adds significant enhancements beyond what either platform offers (AI capabilities, waitlist, recurring bookings, maintenance blocking, dynamic pricing).

**Overall coverage**: ~93% of research features are in the PRD. A handful of gaps and a few areas of weak coverage remain.

---

## GAPS (Features in research but missing from PRD)

### GAP-1: Amenity Sub-Options / Booking Options

**Source**: Condo Control -- Elevator amenity has a radio button "Amenity Option" (e.g., "Elevator Deposit"). Booking detail page shows "Amenity Option" as a distinct field (Section 3.6, field `BookingStyleID` variations; Section 6.1, field #3).

**What's missing**: The PRD has no concept of sub-options or variants within a single amenity. In Aquarius, the Elevator has different fee structures for Move-In vs Move-Out vs Delivery (e.g., Move-In deposit $250, Move-Out deposit $500, Delivery deposit $250). Condo Control models this as "Amenity Options" with radio buttons on the booking form.

**Recommendation**: Add an `AmenityOption` entity or a `options` JSONB array on the Amenity model. Each option would have: name, fee override, deposit override, and description. The booking form would show a radio group when options exist. The Booking entity needs an `amenity_option_id` field.

### GAP-2: Different Day-of-Week Operating Hours

**Source**: Aquarius -- Elevator has different hours per day: Mon-Fri 3 slots (9am-12pm, 1pm-4pm, 6pm-9pm), Saturday 2 slots (9am-12pm, 1pm-4pm), Sunday/holidays no bookings. Condo Control -- Elevator has Mon-Fri 9AM-8PM, Saturday 9AM-9PM, Sunday CLOSED.

**What's missing**: The PRD specifies a single `operating_hours_start` and `operating_hours_end` pair (fields 12-13 in Section 3.1.1). The `blocked_hours` JSONB field (field 19) can partially address this by blocking hours per day, but the operating hours themselves cannot vary by day. There is no explicit support for "closed on specific days" beyond the `days_available` multi-select.

**Recommendation**: Change operating hours from a single start/end pair to a per-day schedule structure (JSONB), e.g., `{ "monday": {"start": "09:00", "end": "20:00"}, "saturday": {"start": "09:00", "end": "21:00"}, "sunday": null }`. This is more intuitive than using blocked hours to simulate different schedules.

### GAP-3: Booking Style Differences Affecting Form UI

**Source**: Condo Control -- `BookingStyleID` 1 uses Start Date + Start Time dropdown + End Date + End Time dropdown (30-min increments). `BookingStyleID` 3 uses single date picker + freeform Start Time + End Time text inputs. The form UI changes based on booking style.

**What's missing**: The PRD defines three booking styles (Fixed Slots, Flexible Range, Full Day) in field 11, but does not specify whether Flexible Range uses text inputs or dropdowns for time, or whether the time increment is configurable. The PRD also does not mention that some styles may need separate start and end dates (multi-day bookings within Flexible Range).

**Recommendation**: Add a `time_increment_minutes` field (e.g., 15, 30, 60) for Flexible Range style. Clarify that Fixed Slots shows a slot selector (not time pickers), Flexible Range shows time pickers with configurable increments, and Full Day hides time pickers entirely. Also clarify whether start_date and end_date can differ for Flexible Range (multi-day bookings like elevator reservations).

### GAP-4: Amenity-Specific Fee Structures per Booking Purpose

**Source**: Aquarius -- Elevator has different booking fees AND different damage deposits based on purpose: Move-In ($50 fee, $250 deposit), Move-Out ($50 fee, $500 deposit), Delivery ($50 fee, $250 deposit).

**What's missing**: The PRD has a single fee and deposit per amenity. There is no mechanism to vary fees/deposits based on the purpose or type of booking. This is closely related to GAP-1 (sub-options).

**Recommendation**: Address via the AmenityOption entity from GAP-1. Each option can carry its own fee and deposit values.

### GAP-5: "View All Bookings" Button on Amenity Landing Page Header

**Source**: Aquarius -- Page header has a "View All Bookings" button alongside "Check Combined Calendar" as top-level navigation actions.

**What's missing**: The PRD has Calendar View and All Bookings List as tabs/views, but does not specify a prominent "View All Bookings" button on the amenity card grid page header. The card grid page (3.1.2) has search/filter controls but no navigation shortcuts to the other views.

**Recommendation**: Add a header-level action bar on the amenity browse page with "Calendar" and "All Bookings" navigation links, consistent with both research platforms having these as top-level access points.

### GAP-6: International Credit Card Surcharge Handling

**Source**: Condo Control -- Revise Booking form includes an alert: "Our system detected the use of an international credit card. Due to higher charges..." with a checkbox: "I want to continue with higher fee."

**What's missing**: The PRD mentions Stripe integration but does not address international card detection, surcharge disclosure, or consent for higher processing fees.

**Recommendation**: Add a note in the Payment step (3.1.4 Step 4) about international card surcharge handling. Stripe can detect card country; if international, show a disclosure with the additional fee and require checkbox consent.

### GAP-7: Booking Comparison View for Revisions

**Source**: Condo Control -- Revise Booking form shows an "Original Booking vs Revised Booking" side-by-side comparison table with fields: Amenity, Start/End Date, Start/End Time, Method of Payment, Amenity Usage Fee, Security Deposit.

**What's missing**: The PRD's "Edit Booking" action (Section 3.1.7) does not specify a comparison view showing original vs revised values. The user just edits fields and saves.

**Recommendation**: When editing date/time/payment fields, show a before-and-after comparison card so the user can confirm the changes before saving. This is especially important when fee amounts change due to time changes.

### GAP-8: Security Guard Premium Rate for Late Payment

**Source**: Aquarius -- Party Room security guard rate is $106.20 + HST normally, but increases to $52.50/hour premium if payment not received within 24 hours.

**What's missing**: The PRD has security guard rate and minimum hours (fields 28-29) but no concept of a late-payment premium rate or escalating security fees.

**Recommendation**: Consider adding a `security_late_rate` field or handling this via configurable payment reminders with penalty logic. This may be an edge case best handled via custom instructions (field 49) for v1.

---

## WEAK COVERAGE (In PRD but insufficiently detailed)

### WEAK-1: Blocked Hours Configuration UI

**Source**: Condo Control documents per-day blocked hours in detail (e.g., Sunday all day blocked, Monday 12:01 AM-8:59 AM and 8:01 PM-11:59 PM blocked for Elevator). Aquarius shows different slot availability per day.

**PRD coverage**: Field 19 mentions "Blocked Hours per Day" as a "repeatable group" with "7 entries (per day)" and validation "Start before end, no overlaps within same day." This is correct but lacks UI specification.

**What's weak**: No detail on the form UI for configuring blocked hours. Is it a matrix/grid? Seven expandable sections? A visual timeline editor? How are multiple blocked ranges per day entered?

**Recommendation**: Specify the UI pattern -- suggest a 7-row table (one per day) where each row allows adding multiple blocked time ranges with add/remove buttons. Each range has start time and end time dropdowns.

### WEAK-2: "Check Availability" Before Submitting Revised Booking

**Source**: Condo Control -- Revise Booking form has a "Check Availability" button that validates the new date/time before allowing the save. This is a two-step process: pick new time, check availability, then save.

**PRD coverage**: The Edit Booking action mentions failure state "The selected time is no longer available" but does not specify an explicit availability check step before saving.

**What's weak**: The PRD implies real-time conflict detection (Section 3.1.4) for new bookings but does not clarify if edits also go through the same availability check, or if there is a "Check Availability" button for edits.

**Recommendation**: State explicitly that the Edit Booking form performs real-time availability checks identical to new booking creation, with an explicit "Check Availability" action or automatic validation on time change.

### WEAK-3: Calendar Event Display Format Details

**Source**: Condo Control specifies exact calendar event format: "{startTime} - {endTime} {AmenityName} booked by {LASTNAME}, {FirstName} ({UnitNumber})". Also specifies overflow ("+N more"), time short format (9a, 12p, 3p), and that events are color-coded per amenity.

**PRD coverage**: Section 3.1.5 specifies time range, amenity name, resident name and unit, status icon. Format example: "9a - 12p Party Room - Smith (1205)".

**What's weak**: The PRD covers this adequately at a high level but does not specify week view and day view event formats separately, or how events truncate when the calendar cell is narrow.

**Recommendation**: Add a brief note on truncation behavior: month view shows abbreviated text, week view shows full text, day view shows full text with additional details. Specify text truncation with ellipsis when the event block is too narrow.

### WEAK-4: Amenity Group Dropdown Behavior in Hero Bar

**Source**: Condo Control -- Hero booking bar has a 3-step flow: (1) Select Amenity Group dropdown, (2) Pick date, (3) "See Available Options" populates dynamically. The third dropdown populates after both amenity and date are selected.

**PRD coverage**: Section 2 (Research Summary) mentions the hero booking bar is adopted. Section 3.1.2 does not include the hero bar in the Browse Amenities specification. It is not clear where the hero bar lives in the PRD UI.

**What's weak**: The hero booking bar is mentioned in the research summary as "adopted" but is never specified as a UI component in the feature spec. It is unclear if it exists on the amenity browse page or is replaced by the card grid + search.

**Recommendation**: Either (a) explicitly specify the hero booking bar as a component on the amenity browse page above the card grid, with its three-step flow, or (b) explicitly state it was evaluated but not adopted in favor of the card grid + inline calendar booking approach. Do not leave it ambiguous.

### WEAK-5: Offsite Owner Read-Only Mode

**Source**: Condo Control -- Hidden form field `OffsiteOwnerReadOnlyMode` (value: False). This implies a feature where offsite owners (landlords who don't live on-site) may have read-only access to amenity booking.

**PRD coverage**: The PRD does not mention offsite owner access restrictions for amenity booking. The roles table in Section 1 lists Resident, Front Desk, Property Manager, Property Admin, and Board Member but does not distinguish between resident-owner, resident-tenant, and offsite-owner.

**What's weak**: No specification for how ownership type affects booking permissions.

**Recommendation**: Cross-reference with the User Management PRD (08). If resident sub-types (owner, tenant, offsite owner) are defined there, add a note here about whether offsite owners can book or only view.

### WEAK-6: Payment Recording Details (Cheque Number, Deposit Tracking)

**Source**: Condo Control -- Update Booking form has: "User will pay by cheque" checkbox, cheque number input, Security Deposit input. Booking detail shows "Items required for full approval" = "Cheque" and "Payment Status" = "Cheque required."

**PRD coverage**: Section 3.1.7 has "Record Payment" action with "payment method, cheque number, notes + Save." The Booking data model includes `cheque_number` and `payment_received_at`.

**What's weak**: The PRD covers the basics but does not specify the "Items required for full approval" concept -- the idea that a booking can be approved but still awaiting a physical payment item. The flow of "approved but payment outstanding" vs "fully approved with payment received" is not clearly distinguished.

**Recommendation**: Add a concept of "conditional approval" or clarify the relationship between `approval_status` and `payment_status`. Specify that a booking can be Approved (administratively) but still have Payment Status = "Pending" until physical payment is received. The booking detail should show "Items required for full approval" when payment is pending.

### WEAK-7: Cancellation Reason Form Expand/Collapse UX

**Source**: Condo Control -- Cancel Booking is an expandable section triggered by the button, with textarea + Save/Cancel. Update Booking and Revise Booking are also expandable sections.

**PRD coverage**: Section 3.1.7 specifies "Expand inline form: reason textarea + Save/Discard buttons" for Cancel and Decline actions. This matches the research.

**What's weak**: The PRD correctly specifies inline expansion but does not clarify whether multiple action forms can be open simultaneously or if opening one closes others (accordion behavior).

**Recommendation**: Add a note: "Only one action form can be expanded at a time. Opening a new action collapses any previously open form."

---

## CONFIRMED (Correctly covered in PRD)

| # | Research Feature | Source | PRD Section |
|---|-----------------|--------|-------------|
| 1 | Amenity cards with photo, name, fee, book button | Aquarius + CC | 3.1.2 |
| 2 | Building selector / multi-building filtering | Aquarius | 3.1.2 (filter #4) |
| 3 | Booking fee + damage deposit per amenity | Aquarius + CC | 3.1.1 Section E (fields 34-36) |
| 4 | Time slot-based booking system | Aquarius + CC | 3.1.1 (field 14), 3.1.4 |
| 5 | Combined calendar view across amenities | Aquarius + CC | 3.1.5 |
| 6 | Calendar month/week/day views | CC | 3.1.5 (control #3) |
| 7 | Calendar navigation (prev/next/today) | CC | 3.1.5 (controls #1-2) |
| 8 | Calendar legend with color-coded amenities | CC | 3.1.5 (control #4) |
| 9 | Calendar legend with booking status colors | CC | 6.2 (Status Badges table) |
| 10 | Legend toggle/filter functionality | CC | 3.1.5 (control #4) |
| 11 | Pending approvals section above calendar | CC | 3.1.5 (Pending Approvals Banner) |
| 12 | Batch approve for pending bookings | CC | 3.1.8 (Batch Approval) |
| 13 | Individual approve from pending list | CC | 3.1.7 (Approve button), 10.1 |
| 14 | All Bookings list with search/filter | CC | 3.1.6 |
| 15 | Status filter dropdown (All, Approved, Pending, Cancelled, Overdue, Outstanding) | CC | 3.1.6 (filter #3) |
| 16 | Amenity filter dropdown on bookings list | CC | 3.1.6 (filter #2) |
| 17 | Booking detail with all information fields | CC | 3.1.7 |
| 18 | Booking reference number (auto-generated) | Aquarius + CC | 4.3 (reference_number) |
| 19 | Resident name + unit + email + phone on detail | CC | 3.1.7 (fields #3-5) |
| 20 | Start/end date and time on booking detail | CC | 3.1.7 (fields #6-8) |
| 21 | Approval status field | CC | 3.1.7 (field #10) |
| 22 | Amenity usage fee + deposit on detail | CC | 3.1.7 (fields #12-14) |
| 23 | Requestor comments field | CC | 3.1.7 (field #15) |
| 24 | Approver comments field | CC | 3.1.7 (field #16) |
| 25 | Agreement to terms status | CC | 3.1.7 (field #17) |
| 26 | Cancel Booking action with reason textarea | CC | 3.1.7 (Cancel Booking button) |
| 27 | Reassign Booking action | CC | 3.1.7 (Reassign button) |
| 28 | Upload Signed Agreement | CC | 3.1.7 (Upload Agreement button) |
| 29 | Booking history / audit trail | CC | 3.1.7 (History), 4.4 |
| 30 | Audit trail columns: date, who, action, details | CC | 4.4 (BookingAuditEntry) |
| 31 | Stripe payment integration | CC | 3.1.4 Step 4, 4.3 |
| 32 | Offline payment methods (cheque, cash, e-transfer) | Aquarius + CC | 3.1.1 (field 38), 3.1.4 |
| 33 | Cancellation policy per amenity | CC | 3.1.1 Section F (fields 42-43) |
| 34 | Hours of operation display on detail page | CC | 3.1.3 (Hours of operation card) |
| 35 | Pricing transparency before booking | CC | 3.1.3 (Pricing card) |
| 36 | Terms and conditions (configurable, rich text) | CC | 3.1.1 Section G (field 46) |
| 37 | Agreement methods (checkbox, signature, upload) | CC | 3.1.1 (field 47), 3.1.4 Step 3 |
| 38 | Max guest count | Aquarius + CC | 3.1.1 (field 26) |
| 39 | Security guard auto-assignment for large events | Aquarius | 3.1.1 (fields 27-29), 5.1 |
| 40 | Search bar on amenity browse page | CC | 3.1.2 (filter #1) |
| 41 | Photo upload for amenities | CC | 3.1.1 Section B |
| 42 | Amenity groups for categorization | CC | 3.1.1 (field 3) |
| 43 | Booking on behalf of resident (staff flow) | CC (implied) | 3.1.4 (field 7), 5.2 |
| 44 | Declined status in both legend and filters | CC (fixed inconsistency) | 3.1.6, 6.2 |
| 45 | Standardized name format (fixed CC inconsistency) | CC | 3.1.5, 3.1.6 |
| 46 | Standardized date format (fixed CC inconsistency) | CC | Section 2 (anti-pattern #4) |
| 47 | Single Edit action (merged Update/Revise from CC) | CC | 3.1.7, Section 2 (anti-pattern #5) |
| 48 | Inline calendar booking (click empty slot) | CC (missing, added) | 3.1.5 |
| 49 | Pagination on booking list (CC lacked this) | CC (missing, added) | 3.1.6 |
| 50 | Photo placeholder with upload guidance (CC lacked) | CC (missing, added) | 3.1.2 |
| 51 | Hidden empty T&C sections (CC showed empty heading) | CC (fixed) | Section 2 (anti-pattern #9) |
| 52 | Service fee / platform fee on booking | CC | 3.1.1 (field 40), 3.1.4 |
| 53 | Tax calculation on bookings | CC | 3.1.1 (field 39), 3.1.4 |
| 54 | Quick Book button on calendar | CC | 3.1.5 (control #5) |
| 55 | "+N more" overflow on calendar days | CC | 3.1.5 |
| 56 | Record Payment action (staff) | CC | 3.1.7 |
| 57 | Refund Deposit action (staff) | CC | 3.1.7 |
| 58 | Booking detail page URL routing | CC | 10.1 (endpoints) |
| 59 | Holiday closures toggle | Aquarius (implied) | 3.1.1 (field 18) |
| 60 | Variable fee structures (flat, hourly, per-guest) | Aquarius + CC | 3.1.1 (field 35) |
| 61 | Calendar event color-coding per amenity | CC | 3.1.5, 6.2 |
| 62 | Booking status color scheme | CC | 6.2 (Status Badges) |
| 63 | Payment overdue + outstanding payment statuses | CC | 3.1.6, 6.2, 4.3 |
| 64 | File upload size limit (5 MB) | CC | 3.1.1 (field 8), 3.1.7 |
| 65 | Export (CSV, Excel, PDF) | CC | 3.1.6, 3.2.4 |

---

## Severity Assessment

| Category | Count | Severity |
|----------|-------|----------|
| **GAPS** | 8 | GAP-1, GAP-2 are Medium (affect real booking scenarios like elevator move-in/out). GAP-3, GAP-4 are Medium (closely tied to GAP-1). GAP-5 is Low. GAP-6, GAP-7 are Low-Medium. GAP-8 is Low. |
| **WEAK** | 7 | WEAK-4 is Medium (hero bar ambiguity). WEAK-6 is Medium (conditional approval unclear). Rest are Low. |
| **CONFIRMED** | 65 | -- |

**Priority actions**:
1. Address GAP-1 + GAP-4 together (amenity sub-options with per-option fees/deposits)
2. Address GAP-2 (per-day operating hours)
3. Clarify WEAK-4 (hero booking bar adoption status)
4. Clarify WEAK-6 (approved-but-payment-pending workflow)

---

*Audit completed: 2026-03-14*
*Research lines reviewed: ~840 (98 Aquarius + 739 Condo Control)*
*PRD lines reviewed: ~1264*
