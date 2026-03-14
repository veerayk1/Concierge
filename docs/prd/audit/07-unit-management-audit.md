# Audit: 07-Unit-Management PRD vs Research

> **Audit date**: 2026-03-14
> **PRD reviewed**: `/docs/prd/07-unit-management.md`
> **Research files reviewed**:
> - `/docs/unit-file.md` (Aquarius unit listing)
> - `/docs/create-unit.md` (Aquarius create unit)
> - `/docs/user-profile.md` (Aquarius user profile, 6 tabs)
> - `/docs/user-management.md` (Aquarius user management)
> - `/docs/platform-3/deep-dive-unit-file.md` (Condo Control unit file)
> - `/docs/platform-3/deep-dive-my-account.md` (Condo Control my account)
> - `/docs/platform-2/manage-and-communicate.md` (BuildingLink manage section)

---

## Summary

The PRD is **comprehensive and well-structured**. It covers the vast majority of features and fields observed across all three platforms, and in many cases exceeds them (unlimited FOB slots, 8-tab resident profile, AI capabilities, move-in/move-out workflows, bulk import). A small number of gaps and areas of weak coverage remain, primarily in fields that were present in the research but not explicitly surfaced in the PRD.

- **GAPS found**: 5
- **WEAK COVERAGE found**: 7
- **CONFIRMED coverage**: 40+ items

---

## GAPS

Items present in research that are **missing entirely** from the PRD.

### GAP-1: Key Tag field on units (Aquarius)

**Source**: `create-unit.md` -- "Key Tag: Text input -- Key tag identifier for the unit"

Aquarius has a dedicated "Key Tag" field separate from FOBs, buzzer codes, and garage clickers. The PRD's FOB/Access Device section includes "Key Tag" as a Device Type dropdown option (FOB, Access Card, Key, Remote, Key Tag) but does not provide a dedicated unit-level key tag field as Aquarius does. A key tag in Aquarius appears to be a unit-level identifier (like a tag on the physical key ring for the unit), not a trackable access device with serial numbers and issuance lifecycle.

**Recommendation**: Consider adding a simple `key_tag` varchar field on the Unit entity, or document explicitly that key tags are tracked as access devices with Device Type = "Key Tag".

### GAP-2: Search All Buildings checkbox (Aquarius)

**Source**: `unit-file.md` -- "Search All Buildings: Checkbox to search across all buildings"

Aquarius has an explicit "Search All Buildings" checkbox on the unit list page. The PRD has a Building Selector dropdown with "All Buildings" as the default option for multi-building properties, which achieves the same result. However, there is no explicit cross-building search toggle mentioned. The Aquarius pattern lets a user search within a single building but then quickly expand to search all buildings without changing the building filter.

**Recommendation**: Minor gap. The PRD's "All Buildings" default in the building dropdown covers this. No action needed unless the UX specifically requires a persistent building filter combined with an override checkbox.

### GAP-3: Buzzer Code Comments field (Aquarius)

**Source**: `create-unit.md` -- Buzzer Codes have both "Code" and "Comments" fields for each of the 2 slots.

The PRD's buzzer code fields (section 3.1.6) have Code, Label, and Active -- but no "Comments" or "Notes" field. The Aquarius research shows a dedicated comments field per buzzer code (e.g., "Front door", "Side entrance"). The PRD has a "Label" field which partially covers this, but a separate notes/comments field for additional context is missing.

**Recommendation**: Either rename "Label" to "Label / Notes" with an increased max length, or add a dedicated Notes textarea to the BuzzerCode entity.

### GAP-4: Account balance / Transactions tab (Condo Control)

**Source**: `deep-dive-unit-file.md` section 8 -- Transactions tab with per-unit account balance lookup.

Condo Control has a "Transactions" tab on the user profile showing per-unit account balance retrieval. The PRD's 8-tab resident profile does not include any financial/transaction tab. This is likely intentional (financial/billing management is listed as "Out of Scope" in section 1), but it is not documented as a deliberate exclusion from the resident profile.

**Recommendation**: Add an explicit note in the scope boundaries or resident profile section stating that financial transactions and account balances are deferred to a future billing module (or v3+).

### GAP-5: Filtered Groups / Custom Grouping (BuildingLink)

**Source**: `manage-and-communicate.md` section 2 -- "Filtered Groups: Custom resident grouping for targeted communication or management. Not available in Aquarius."

BuildingLink has a "Filtered Groups" feature for creating custom resident groups for targeted communication. The PRD mentions "Group-based filtering with 31+ groups" in the research summary and "dynamic group creation and multi-group membership" as a Concierge decision, but the feature specification does not include any section on creating, managing, or using custom groups. The Unit List has filter dropdowns but no group-based filter. The Resident Profile has no group membership display or management.

**Recommendation**: Add a subsection under Unit Management or cross-reference to a separate Groups module describing how custom groups are created, managed, and used for filtering/communication. This was explicitly called out as a "Concierge Decision" to adopt but never specified.

---

## WEAK COVERAGE

Items present in research that are **partially covered** but lack detail or specificity.

### WEAK-1: Resident Group Types (Aquarius)

**Source**: `unit-file.md` -- "Resident Group Types: Owner, Tenant, Offsite Owner"

The PRD covers this with Resident Type dropdown (Owner, Tenant, Offsite Owner, Family Member) in section 3.1.5. Family Member is an addition. However, Condo Control's research shows 31 groups including per-floor groups, board members, staff groups, etc. The PRD's research summary says "Adopt with dynamic group creation and multi-group membership" but the feature spec only has a single "Resident Type" dropdown, not a multi-group membership system. The gap between the research commitment and the specification is notable.

**Recommendation**: Clarify whether "Resident Type" is the same as group membership, or whether there is a separate group system. If groups are a separate concept, specify the group management CRUD and multi-group assignment UI.

### WEAK-2: Parking Spot Rental Tracking (Aquarius)

**Source**: `user-profile.md` Tab 4 -- "Renting a parking spot? Yes/No" and "Which Unit Are You Renting From?"

The PRD's Parking & Vehicles tab (3.1.5, Tab 6) includes "Renting a parking spot? Yes/No display" and "Renting From: Unit number if renting from another unit." These are listed as display fields but there are no form fields specified for creating/editing these values. Who sets them? What is the validation? What is the max length for "Renting From"?

**Recommendation**: Add editable field specs for the parking rental fields (who can edit, validation rules, error messages) consistent with the level of detail elsewhere in the PRD.

### WEAK-3: "About You" / Bio field (Aquarius)

**Source**: `user-profile.md` -- "About you: Free-text bio/description"

The PRD has an "About" textarea on Tab 1 (field #16, max 500 chars, editable by Admin, Manager, Self). Coverage is present but the field is named "About" in the PRD vs "About you" in Aquarius. This is minor but noted for naming consistency checks.

**Recommendation**: No action needed. Naming difference is cosmetic.

### WEAK-4: Username / System Identifier (Aquarius + Condo Control)

**Source**: `user-profile.md` -- "Username: System username (e.g., 'Ray_007')" and `deep-dive-unit-file.md` -- "UserId: String (hashed) -- Encoded unique identifier"

Aquarius uses human-readable usernames (Ray_007). Condo Control uses hashed IDs in URLs. The PRD commits to UUIDs in URLs (research finding #7) but does not specify whether users have a human-readable username separate from their email. The PRD's User data model (section 4 of 08-user-management) does not have a `username` field. The 08-user-management PRD section 3.1.7 lists "Username" as a read-only field that is "System-generated, permanent identifier" but does not define its format or generation rules.

**Recommendation**: Clarify in the 07-unit-management PRD whether usernames appear on the unit/resident views, or whether residents are identified solely by name + email in the UI.

### WEAK-5: Parcel Waiver Management (Aquarius + Condo Control)

**Source**: `user-profile.md` -- Parcel Waivers section with Signed At, Attachment, Notes fields. `deep-dive-unit-file.md` -- "Parcel Waivers widget" on user profile.

The PRD includes "Parcel Waivers" as a right-column widget on the Personal Information tab (section 3.1.5) with "Signed waiver documents with dates and attachments. 'Add Waiver' button." However, there are no field-level specs for parcel waivers (data types, max lengths, validations, error messages) comparable to the detail given for emergency contacts, vehicles, pets, and documents. No data model entity for ParcelWaiver is defined in section 4.

**Recommendation**: Add field-level specs for Parcel Waivers (signed_at timestamp, attachment file upload with size/format limits, notes textarea with max length). Add a ParcelWaiver entity to the data model or document that waivers are stored as Documents with document_type = "Parcel Waiver".

### WEAK-6: Electronic Consent Tracking (Condo Control)

**Source**: `deep-dive-unit-file.md` section 4.2 -- "Electronic Consent: E-consent status. Empty: 'There are no e-consent documents signed.'" and `deep-dive-my-account.md` section 2.3 -- "Electronic Consent: checkmark/document icon"

The PRD includes "Electronic Consent: E-consent document status" as a right-column widget on the Personal Information tab. However, like parcel waivers, there are no field-level specs, no data model entity, and no workflow description for how e-consent documents are created, presented to users, signed, and tracked.

**Recommendation**: Add field-level specs for Electronic Consent (document title, version, signed_at, signature method, signer_id). Either define an ElectronicConsent entity or cross-reference to a future Legal/Compliance module.

### WEAK-7: "Invalid Email" indicator and Missing Email Tracking (Condo Control + BuildingLink)

**Source**: `deep-dive-unit-file.md` -- "Invalid Email: shown in red text below name when email validation fails" and `manage-and-communicate.md` -- "Manage Missing Email Addresses: Employees (3 missing), Occupants (19 missing)"

The PRD mentions AI-powered "Missing Data Detection" (capability #93) that scans for missing emails, but does not specify a UI indicator for invalid emails on the unit list or resident profile. BuildingLink's "Manage Missing Email Addresses" dashboard showing counts of employees and occupants missing emails is not represented in the PRD's analytics or dashboard metrics.

**Recommendation**: Add an "Email Status" indicator (Valid, Invalid, Missing) to the unit list table and resident profile header. Add "Missing email count" as a dashboard metric or report dimension.

---

## CONFIRMED

Items from research that are **fully covered** in the PRD with adequate detail.

| # | Research Item | Source | PRD Location | Notes |
|---|--------------|--------|-------------|-------|
| 1 | Building selector dropdown | Aquarius unit-file.md | 3.1.1 (#2) | Covered with "All Buildings" default |
| 2 | Status filter (Active/Inactive) | Aquarius unit-file.md | 3.1.1 (#4) | Expanded to Occupied/Vacant/Under Renovation |
| 3 | Sortable table columns | Aquarius unit-file.md | 3.1.1 table view | All columns sortable as specified |
| 4 | Unit number field | Aquarius create-unit.md | 3.1.2 (#2) | With validation and uniqueness constraint |
| 5 | Package email notification toggle | Aquarius create-unit.md | 3.1.2 (#10) | Toggle with tooltip |
| 6 | Comments field on unit | Aquarius create-unit.md | 3.1.2 (#11) | 2000 char textarea |
| 7 | Enter Phone Code | Aquarius create-unit.md | 3.1.2 (#7) | With validation |
| 8 | Parking Spot field | Aquarius create-unit.md | 3.1.2 (#8) | With validation |
| 9 | Locker field | Aquarius create-unit.md | 3.1.2 (#9) | With validation |
| 10 | FOB/Access device tracking (6 types) | Aquarius create-unit.md | 3.1.6 | Expanded to unlimited slots with lifecycle |
| 11 | FOB type classification (Access Card, FOB, Key, Remote) | Aquarius create-unit.md | 3.1.6 (#1) | Added "Key Tag" as 5th type |
| 12 | FOB serial numbers | Aquarius create-unit.md | 3.1.6 (#2) | With uniqueness validation |
| 13 | Buzzer codes (2 slots in Aquarius) | Aquarius create-unit.md | 3.1.6 | Expanded with Label and Active toggle |
| 14 | Garage clickers (2 slots in Aquarius) | Aquarius create-unit.md | 3.1.6 | Expanded with lifecycle tracking |
| 15 | Front desk instructions | Aquarius unit-file.md | 3.1.4 | Enhanced with priority levels and role visibility |
| 16 | Emergency contacts tab | Aquarius user-profile.md | 3.1.5 Tab 2, 3.1.7 | With field-level specs and Emergency View |
| 17 | Vehicles tab (3 vehicles, plate/color/model) | Aquarius user-profile.md | 3.1.5 Tab 6 | Expanded to 5 vehicles with year, province |
| 18 | Pets tab | Aquarius user-profile.md | 3.1.5 Tab 7 | With species, breed, weight, registration |
| 19 | Documents tab (POA, Lease, Insurance) | Aquarius user-profile.md | 3.1.5 Tab 8 | Expanded with file upload, expiry, 7 document types |
| 20 | User status (Active/Inactive) | Aquarius user-profile.md | 3.1.5 (#17) | Expanded to Active/Inactive/Suspended/Pending |
| 21 | Offsite address for offsite owners | Aquarius user-profile.md | 3.1.5 (#13) | Conditional display when type = Offsite Owner |
| 22 | Assistance Required flag | Aquarius user-profile.md | 3.1.5 (#14) | With tooltip explaining use case |
| 23 | Last logged in tracking | Aquarius user-profile.md | Data model | last_login_at on User entity |
| 24 | Account created/updated dates | Aquarius user-profile.md | Data model | created_at, updated_at timestamps |
| 25 | Modular drag-reorderable unit overview | BuildingLink manage.md | 3.1.3 | 12 widget sections with drag-reorder |
| 26 | Per-unit Instructions section | BuildingLink manage.md | 3.1.4 | Enhanced with priority and role visibility |
| 27 | Custom fields configurable per property | BuildingLink manage.md | 3.1.2, 3.1.3, 4.1 | JSONB architecture |
| 28 | 3-tab unit overview (BL: Overview/Details/Docs) | BuildingLink manage.md | 3.1.3 | Expanded to widget-based single page |
| 29 | Pet Registry integration | BuildingLink manage.md | 3.1.5 Tab 7, widget #8 | Dedicated pets tab + unit widget |
| 30 | Vehicle Information section | BuildingLink manage.md | 3.1.5 Tab 6, widget #7 | Dedicated vehicles tab + unit widget |
| 31 | Parking Permits widget | BuildingLink manage.md | 3.1.3 widget #9 | Links to Parking Management module |
| 32 | Asset manager widget | BuildingLink manage.md | 3.1.3 | Mentioned as future (v3+) |
| 33 | Hashed user IDs in URLs | CC deep-dive-unit-file.md | Research summary #7 | UUIDs in all URLs |
| 34 | Quick search vs Search All Fields | CC deep-dive-unit-file.md | 3.1.1 search bar | Single search with debounce covers both |
| 35 | User navigation (<< Previous / Next >>) | CC deep-dive-unit-file.md | 3.1.3 (#6) | Sequential browsing navigation |
| 36 | Staff-only notes invisible to residents | CC deep-dive-unit-file.md | 3.1.5 Tab 1 (Staff Notes widget) | With blue info banner |
| 37 | History Records / audit trail per user | CC deep-dive-unit-file.md | 8.3 | Full audit trail on every entity |
| 38 | Vacation/away tracking | CC deep-dive-unit-file.md, my-account.md | 3.2.3 | With package instructions and away badge |
| 39 | Salutation/preferred name | CC deep-dive-unit-file.md | 3.1.5 (#3 Preferred Name, #4 Salutation) | Both covered |
| 40 | Date of Birth field | CC deep-dive-unit-file.md | 3.1.5 (#5) | With validation |
| 41 | Company Name field | CC deep-dive-unit-file.md | 3.1.5 (via 08-user-management) | On user data model |
| 42 | Language Preference | CC deep-dive-unit-file.md, my-account.md | 3.1.5 (#15) | Dropdown with 8 options |
| 43 | Registration Code system | CC deep-dive-unit-file.md | Research summary #8 | Mentioned but deferred to onboarding flow |
| 44 | Multiple phone types (Cell, Home, Work) | CC deep-dive-unit-file.md | 3.1.5 (#7, #8, #9) | Three separate phone fields |
| 45 | Email Status tracking | CC deep-dive-unit-file.md | Partially via AI #93 | See WEAK-7 |
| 46 | Occupancy record / unit history | CC deep-dive-unit-file.md | 3.1.8 | Full timeline with data model |
| 47 | Bulk import via CSV | BuildingLink unique feature | 3.2.4 | 3-step wizard with validation |
| 48 | Export (CSV/Excel/PDF) | CLAUDE.md non-negotiable | 3.1.1 (#10), 8.2 | On every listing page |

---

*Audit completed: 2026-03-14*
*Total items audited: 52+*
*Gaps: 5 | Weak coverage: 7 | Confirmed: 48*
