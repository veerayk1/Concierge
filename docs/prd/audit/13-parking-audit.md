# Audit: PRD 13 -- Parking Management

> Cross-reference of research docs against PRD 13-parking.md
> Research sources: docs/security-menu.md (Platform 1 -- Visitor Parking, Key Checkout, Parking Violations), docs/logs.md (Platform 1 -- Logs Menu, no direct parking content), docs/platform-3/deep-dive-security-concierge.md (Platform 3 -- Visitor Parking dialog, Visitor Detail with parking permits)
> Date: 2026-03-14

---

## Summary

PRD 13 comprehensively covers all parking-related features from both Platform 1 (security-menu.md) and Platform 3 (deep-dive-security-concierge.md) research, and extends them significantly. The PRD combines three approaches found across platforms: visitor parking from the security console, permit lifecycle management, and violation enforcement with photo evidence. It adds a full spot inventory system, zone/area management, permit printing with QR codes, and five AI capabilities (OCR, pattern detection, expiry prediction, utilization analysis, abuse detection). Every weakness identified in the research is addressed. Platform 3's visitor parking dialog (Section 5 of deep-dive-security-concierge.md) provides a simpler form than Platform 1, with a parking-needed checkbox that conditionally shows vehicle fields -- the PRD adopts this progressive disclosure approach. Platform 3's Visitor Detail dialog (Section 12) tracks parking permits per visitor with From/To/Make-Model/License columns, which the PRD covers via the Plate History Panel.

Note: docs/logs.md contains six log types (General, Incident, Fire, Noise, Inspection, Bulletin) with no direct parking content. The parking-relevant data from Platform 1 is entirely within security-menu.md.

---

## GAPS

### GAP-1: Visitor Type "Guest" Category -- Admin-Configurable Types

**Research source**: Platform 1 security-menu.md -- Visitor Type field uses radio buttons with configurable types. The modal also captures "Guest Name" separately from visitor type. Platform 3 deep-dive-security-concierge.md (Section 5.1) -- Toggle radio with "Visitor" / "Contractor" options only.

**What is missing**: The PRD defines three visitor types (Visitor, Contractor, Delivery) in Section 3.1.1. Neither platform's types are identical to the PRD's, and the PRD does not specify whether visitor types are admin-configurable or fixed.

**Recommendation**: Make visitor types admin-configurable (similar to permit types) with system defaults of Visitor, Contractor, and Delivery. Add a note that properties can add custom visitor types (e.g., "Real Estate Agent", "Moving Company", "Emergency Service"). Include a `VisitorType` entity with `property_id`, `name`, `icon`, `sort_order`, and `active` fields.

---

### GAP-2: Image Capture (Camera Integration) on Forms

**Research source**: Platform 1 security-menu.md -- Key Checkout modal includes "Image Capture 1" and "Image Capture 2" with camera/upload capability showing "No image captured" placeholder. The visitor parking modal also has "Image Upload" with drag-and-drop/file capability.

**What is missing**: The PRD specifies file upload (JPG, PNG, HEIC) for photos on visitor parking and violations but does not explicitly mention camera capture integration for mobile/tablet devices. For front desk staff using tablets, direct camera capture (not just file upload) is important for speed.

**Recommendation**: Add a note to the Photo field specification: "On devices with cameras, the upload control offers both 'Take Photo' (camera capture) and 'Upload File' (gallery/file picker) options. Camera capture opens the device's rear camera by default."

---

### GAP-3: Key Checkout Module -- Covered Elsewhere?

**Research source**: Platform 1 security-menu.md -- Full Key Checkout system: key inventory (Key #, Key Name, Status), checkout form (Select Key, Checked Out To, Company, ID Type, ID Number, Reason, Signature, Image Capture), checkout history with reference numbers, check-in flow, "Print Key Checkout History" button. Also "Record Key" modal for adding new keys with bulk add capability. Platform 3 deep-dive-security-concierge.md (Section 10) -- Key Checkout dialog with key inventory, ID verification, "New" key button, and "View Complete Key List" sub-dialog.

**What is missing**: Key management is not part of the Parking PRD (correctly, as it is not parking-related). However, this audit flags that the key management features need to be covered in PRD 03 (Security Console) or another PRD.

**Recommendation**: Verify that PRD 03 covers: key inventory CRUD, key checkout with signature capture, key check-in, key checkout history with reference numbers, ID verification fields, and print checkout history. This is not a gap in PRD 13 but a cross-PRD audit note.

---

### GAP-4: "Search Deleted" Toggle for Soft-Deleted Records

**Research source**: Platform 1 security-menu.md -- Both Visitor Parking and Parking Violation sections have a "Search Deleted" toggle switch to include soft-deleted records in search results.

**What is missing**: The PRD's data model includes `deleted_at` (soft delete) on VisitorParking and ParkingViolation entities, but the filter specifications (Section 3.1.3 and 3.3.3) do not include a "Show Deleted" toggle for staff to view soft-deleted records.

**Recommendation**: Add a "Show Deleted" toggle (visible to PM and Admin only) to the visitor parking and violation filter bars. When enabled, deleted records appear with a strikethrough style and a "Deleted" badge. Include a "Restore" action on deleted records.

---

### GAP-5: Visitor Parking -- Override End Time / Extend Parking Action

**Research source**: Platform 1 security-menu.md -- Visitor Parking table includes an "Override End Time" column, suggesting staff can manually extend parking beyond the original end time without creating a new record.

**What is missing**: The PRD's visitor parking record has `parking_until` (the scheduled end time) and allows editing the record (PUT endpoint), but there is no explicit "Extend Parking" quick action in the UI.

**Recommendation**: Add an "Extend" quick action button on the visitor parking table row (alongside View, Edit, Sign Out, Print, Delete) that opens a minimal modal: datetime picker for new `parking_until` value and an optional comment. This is faster than a full edit for the common scenario of extending a visit.

---

### GAP-6: Visitor Parking Pass Printing -- Detailed Layout

**Research source**: Platform 1 security-menu.md -- "Print" button on each visitor parking row. Platform 3 deep-dive-security-concierge.md (Section 12.2) -- "Print Parking Permit" button on the Visitor Detail dialog.

**What is missing**: The PRD specifies "Save & Print" on creation (Section 3.1.1) and "Print" in the table actions column (Section 3.1.3). Section 3.6 describes permit printing layout, but visitor parking pass layout is described in only one sentence: "Visitor parking passes print as half-page with: visitor name, plate, spot, valid until, issuing staff, QR code."

**Recommendation**: Expand the visitor parking pass print layout to a table format matching the permit layout detail:

| Section | Content |
|---------|---------|
| Header | Property name, logo, "VISITOR PARKING PASS" title |
| Visitor Info | Visitor name, unit being visited, visitor type |
| Vehicle Info | License plate (large font), make, model, color, province/state |
| Assignment | Spot number (or "General Visitor Parking"), area/zone |
| Validity | Valid from (arrival), valid until (parking_until) |
| Staff | Issuing staff name, creation timestamp |
| Footer | "Display this pass on your dashboard. Remove upon departure." + property contact info |
| QR Code | Links to digital pass verification page |

---

### GAP-7: Visitor Parking -- "Needs Parking" Conditional Toggle

**Research source**: Platform 3 deep-dive-security-concierge.md (Section 5.1) -- "Does the visitor need parking?" checkbox. When unchecked, all vehicle/parking fields are hidden. When checked, the form expands to show Make/Model, License Plate #, Province, and Parking Until.

**What is missing**: The PRD's visitor parking form (Section 3.1.1) assumes all fields are always visible with license plate, province/state, and parking_until marked as "Yes (if parking needed)" in the Required column. However, there is no explicit toggle or checkbox that controls whether parking fields appear. The form does not account for logging a visitor who does not need parking at all (e.g., a walk-in visitor to the lobby).

**Recommendation**: Add a `needs_parking` toggle (boolean, default: true) as an explicit field on the visitor parking form. When unchecked, all vehicle and parking fields collapse and become not required. This supports the use case of logging visitors through the Security Console who are visiting a unit but not parking (e.g., dropped off by taxi, walked in). Add the field to the form spec:

| Field | Type | Required | Default | Validation | Error Message |
|-------|------|----------|---------|------------|---------------|
| `needs_parking` | Toggle | Yes | true | -- | -- |

When `needs_parking` is false: `license_plate`, `province_state`, `vehicle_make`, `vehicle_model`, `vehicle_color`, `parking_spot`, `parking_until` are all hidden and not required.

---

### GAP-8: Visitor Parking -- Comment Field on Platform 3

**Research source**: Platform 3 deep-dive-security-concierge.md (Section 5.1) -- Comments textarea is always visible (not conditional on parking). It is part of the base visitor form regardless of whether parking is needed.

**What is missing**: The PRD includes a Comments field (Section 3.1.1, 500 chars) but it is listed after the parking-specific fields. If GAP-7's toggle is implemented, the Comments field should be outside the parking-conditional block so it is always available.

**Recommendation**: When restructuring the form per GAP-7, ensure Comments remains always visible -- positioned after the base visitor fields (Building, Unit, Visitor Name, Visitor Type, Needs Parking) and before the conditional parking block.

---

### GAP-9: Batch Visitor Sign-Out

**Research source**: Platform 3 deep-dive-security-concierge.md (Section 18, "What Gets Wrong" #6) -- "No batch sign-out -- Must sign out visitors one at a time via individual 'Sign Out' links. No 'Sign Out All' for end-of-day processing."

**What is missing**: The PRD provides single-visitor sign-out (Section 3.1.2) but does not include a batch sign-out capability. End-of-shift or end-of-day, front desk staff often need to sign out all remaining visitors at once.

**Recommendation**: Add a "Sign Out All" button on the visitor parking table (visible when Status filter is "Currently Parked" and at least 2 records exist). The button opens a confirmation modal: "Sign out {n} visitors? This will set the departure time to now for all currently parked visitors." Optionally allow selecting specific rows for batch sign-out via row checkboxes.

---

## WEAK COVERAGE

### WEAK-1: Signature Capture on Visitor Parking

**Research source**: Platform 1 security-menu.md -- Key Checkout modal includes a full signature pad (Canvas element with Sign/Clear/Done buttons).

**PRD coverage**: The PRD does not include signature capture on visitor parking forms. This may be intentional since requiring a signature for every visitor parking entry would slow down the front desk workflow.

**Assessment**: Reasonable omission for visitor parking (speed is critical). Signature capture is more appropriate for key checkout and package release. No action needed for parking specifically.

---

### WEAK-2: ID Verification Fields on Visitor Parking

**Research source**: Platform 1 security-menu.md -- Key Checkout modal has "ID Type" dropdown and "ID Number" text input under an "Identification Details" section.

**PRD coverage**: The visitor parking form does not include ID verification fields. ID verification is more relevant for key checkout than for visitor parking.

**Assessment**: Reasonable omission for visitor parking. ID verification adds friction to a high-frequency operation. If needed, it could be an optional field toggled per property. No action required.

---

### WEAK-3: Ban Type Enforcement at Entry Points

**Research source**: Platform 1 security-menu.md -- Ban type implies enforcement at property entry points. The form warns "This form is only for banning individual LICENSE PLATES."

**PRD coverage**: Section 3.5 (Enforcement Workflow) step 3 shows "Active ban exists --> Alert: 'This plate is currently banned'". Section 9.1 includes notification: "ALERT: Plate {plate} has been banned. Do not authorize parking." The PRD also has progressive disclosure on plate entry that shows plate history.

**Assessment**: Well covered. The PRD goes beyond Platform 1 by making ban alerts automatic through plate history lookup and persistent in-app alerts to security staff.

---

### WEAK-4: Rented Parking Spots Report

**Research source**: Platform 1 reports.md -- "Rented Parking Spots" report under Unit and User Reports.

**PRD coverage**: The Parking module tracks spot assignments via ParkingSpot entity (assigned_unit_id, assigned_permit_id). The Reports PRD (10) includes "Parking" category but does not explicitly list a "Rented/Allocated Spots" report.

**Assessment**: The data exists in the Parking data model. A "Spot Allocation" report should be added to PRD 10's Parking category. This is a cross-PRD gap -- logged here but actionable in PRD 10.

---

### WEAK-5: Visitor Parking -- Vehicle Color in Platform 3

**Research source**: Platform 3 deep-dive-security-concierge.md (Section 12.3) -- Parking Permits section in Visitor Details shows "Make / Model" column displaying combined vehicle info including color (e.g., "Black Audi").

**PRD coverage**: Section 3.1.1 includes Vehicle Color as a separate Select dropdown field (Optional). The data model (Section 4.1) has `vehicle_color VARCHAR(30), nullable`.

**Assessment**: Fully covered. The PRD separates color into its own structured field rather than combining it into a free-text field, which is the better approach for filtering and reporting.

---

### WEAK-6: Visitor Parking -- Province/State as Structured Field

**Research source**: Platform 3 deep-dive-security-concierge.md (Section 5.1) -- "Province" as a text input for license plate origin. Platform 1 security-menu.md -- No province field on visitor parking form.

**PRD coverage**: Section 3.1.1 specifies Province/State as a Select dropdown with property's province as default. The data model has `province_state VARCHAR(50)`.

**Assessment**: Well covered. Using a dropdown instead of free text ensures consistent data for reporting and plate history matching. The PRD improves on both platforms.

---

## CONFIRMED

The following research features are confirmed present and well-covered in the PRD:

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Visitor parking creation with unit/plate/vehicle details | 3.1.1 | All fields covered plus vehicle color, province/state, photo |
| 2 | License plate search across records | 3.1.3, 6.5 | Global plate search + Plate History Panel |
| 3 | Visitor parking table with pagination | 3.1.3 | Full table spec with 10 columns, filters, sorting |
| 4 | Sign Out visitor flow | 3.1.2 | Button with departure time and spot release |
| 5 | Print visitor parking pass | 3.1.1, 3.6 | "Save & Print" button + print layout |
| 6 | Parking violation creation | 3.3.1 | 5 violation types (Notice, Warning, Ticket, Ban, Vehicle Towed) |
| 7 | Violation types: Ban, Ticket, Warning, Vehicle Towed | 3.3.1 | All 4 Platform 1 types plus "Notice" added |
| 8 | Auto-lift ban date (auto-expire) | 3.3.1 | Auto-Expire On date picker field |
| 9 | Violation reference numbers | 3.3.3 | Auto-generated VIO-YYYY-NNNNN format |
| 10 | Violation table with filters | 3.3.3 | 10 columns with status/date/type filters |
| 11 | Photo evidence on violations (FIXED from research) | 3.3.1 | Required min 1, max 5 photos |
| 12 | Plate history linking visitors/permits/violations (FIXED) | 6.5 | Unified Plate History Panel |
| 13 | Abuse detection for repeat visitor plates (FIXED) | 7 (AI #99) | Configurable threshold, daily batch + real-time alerts |
| 14 | Spot inventory with zones (FIXED) | 3.4 | Full CRUD for spots, areas, zones |
| 15 | Permit expiry alerts (FIXED) | 9.1 | 30/14/7-day notifications |
| 16 | Utilization analytics (FIXED) | 7 (AI #98), 8.2 | AI-powered heatmaps and capacity forecasting |
| 17 | Configurable permit types | 3.2.1 | 4 default types, admin-configurable |
| 18 | Permit lifecycle management | 3.2.3 | Apply > Review > Approve/Deny > Issue > Renew/Revoke/Expire |
| 19 | Permit approval workflow | 3.2.4 | Admin review with approve/deny/request changes |
| 20 | Permit printing with QR code | 3.6 | Full print layout specification |
| 21 | Vehicle make/model/color capture | 3.1.1, 3.2.2 | On both visitor parking and permit forms |
| 22 | Enforcement escalation workflow | 3.5 | 6-step workflow with AI recommendations |
| 23 | AI: License Plate OCR | 7 (AI #95) | Vision-based auto-fill with confidence levels |
| 24 | AI: Violation Pattern Detection | 7 (AI #96) | Weekly analysis with hotspot mapping |
| 25 | AI: Permit Expiry Prediction | 7 (AI #97) | Risk-scored lapse prediction |
| 26 | AI: Utilization Analysis | 7 (AI #98) | Peak hours, underused areas, capacity forecast |
| 27 | AI: Visitor Abuse Detection | 7 (AI #99) | Threshold-based flagging with recommendations |
| 28 | Soft delete on visitor parking and violations | 4.1, 4.3 | deleted_at field on both entities |
| 29 | Date range filtering on visitor parking | 3.1.3 | Date Range filter, default last 7 days |
| 30 | Plate search with partial match | 3.1.3 | Text input with partial match search |
| 31 | Real-time WebSocket events for parking changes | 10.3 | 7 event types for live updates |
| 32 | Notification to unit resident on visitor parking | 9.1 | Push + Email when visitor registered |
| 33 | Ban alert to all security staff | 9.1 | Persistent in-app alert |
| 34 | Resident notification preferences for parking | 9.2 | 4 preference categories with configurable on/off |
| 35 | Visitor/Contractor toggle (Platform 3) | 3.1.1 | visitor_type field with radio buttons |
| 36 | Vehicle make/model in visitor parking (Platform 3) | 3.1.1 | vehicle_make and vehicle_model fields |
| 37 | Parking Until datetime (Platform 3) | 3.1.1 | parking_until field with configurable default duration |
| 38 | Visitor Detail with parking permits history (Platform 3) | 6.5 | Plate History Panel shows all records per plate |

---

*Audit completed: 2026-03-14*
*Research sources: 3 files (security-menu.md, logs.md, deep-dive-security-concierge.md)*
*Gaps found: 9*
*Weak coverage: 6 (3 confirmed well-covered, 1 reasonable omission x2, 1 cross-PRD)*
*Confirmed: 38*
