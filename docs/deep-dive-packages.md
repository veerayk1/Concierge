# Deep Dive: Packages Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/packages/0`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-13

---

## 1. Page Overview

**URL**: `/packages/0` (the `0` parameter likely represents a building filter or "all")
**Page title**: "Package Menu"

### Page Layout (top to bottom)
1. **"Click to create" section** — 2 circular action icons
2. **"Manage Parcel Types" button** — top right, navy blue
3. **"Recent Packages:" heading** — section divider
4. **Filter bar** — shared search/filter controls for Non-Released Packages
5. **Non-Released Packages table** — main operational table (15 columns)
6. **Pagination** — Previous/Next with page jump and rows-per-page selector
7. **"Released Packages: Past 21 Days" heading** — section divider
8. **Filter bar** — separate search/filter controls for Released Packages
9. **Released Packages table** — historical table (12 columns)
10. **Pagination** — same controls as Non-Released

---

## 2. Create Action Icons

Two circular icons under "Click to create" heading. Both use Semantic UI icon classes with `huge circular icon logs-button` styling.

### Icon 1: Record Package (Single)
- **Icon class**: `inbox huge circular icon logs-button`
- **Visual**: Inbox/tray icon (package coming in)
- **Action**: Opens "Record Packages" modal for **single package entry**
- **Contains**: Incoming/Outgoing toggle, all form fields, Save button

### Icon 2: Record Packages (Bulk)
- **Icon class**: `sitemap huge circular icon logs-button`
- **Visual**: Sitemap/network icon (multiple items)
- **Action**: Opens "Record Packages" modal in **bulk entry mode**
- **Contains**: Multi-row tabular form with Add button to add more rows

---

## 3. Record Package Modal (Single Entry)

**Modal title**: "Record Packages"
**Trigger**: Click Icon 1 (inbox icon)

### Header Controls
| Control | Type | Details |
|---------|------|---------|
| Incoming toggle | Toggle switch | Blue when ON = Incoming package. Toggle OFF = Outgoing |
| Bulk Addition | Button | Top-right, switches to bulk entry view |

### Form Fields

| Field | Type | Required | Default | Placeholder | Notes |
|-------|------|----------|---------|-------------|-------|
| Reference Number | Auto-generated | — | e.g., `#1931` | — | Displayed in RED, read-only, auto-increments |
| Select Building | Dropdown (combobox) | * | "Bond" | — | Pre-filled for single-building properties |
| Related Unit | Dropdown (combobox) | No | — | "Related Unit" | Searchable, clearable (X button) |
| Choose Resident | Dropdown (combobox) | * | — | "Choose Resident" | Required, linked to selected unit |
| Courier Name | Dropdown (combobox) | No | — | — | 24 options (see Section 3.1) |
| Type of parcel | Dropdown (combobox) | No | — | — | 11 configurable options (see Section 3.2). Label includes "(Add them on previous page using the button)" referring to Manage Parcel Types |
| Tracking Number | Text input | No | — | "Tracking Number" | Label says "(optional)" |
| Package Details | Textarea | No | — | "Package Details" | Multi-line text area, right column |
| Storage Spot | Dropdown (combobox) | No | — | "Choose Storage Spot" | 37 options (see Section 3.3) |
| Check if the item is Perishable | Checkbox | No | Unchecked | — | Single checkbox |
| Save | Button | — | — | — | Navy blue, centered at bottom |

### 3.1 Courier Name Options (24 total)

| # | Courier Name | Notes |
|---|-------------|-------|
| 1 | Fedex | Major carrier |
| 2 | Purolator | Canadian carrier |
| 3 | Amazon | Most common |
| 4 | UPS | Major carrier |
| 5 | T-Force | Regional |
| 6 | Canpar | Canadian carrier |
| 7 | Canada Post | National postal |
| 8 | GO Logistics | Regional |
| 9 | Property Management | Internal |
| 10 | Keys | Special item type |
| 11 | Individual drop-off | Person-to-person |
| 12 | Key/envelop (OUT) | Outgoing item |
| 13 | Courier pickup (OUT) | Outgoing pickup |
| 14 | Intelcom | Amazon delivery partner |
| 15 | Fleet Optics | Regional |
| 16 | RUSH | Express courier |
| 17 | APPLE EXPRESS | Regional |
| 18 | HONG MALL | Specialty |
| 19 | Herb | Individual/store |
| 20 | Dragonfly | Regional |
| 21 | Temu | E-commerce |
| 22 | Intercon | Regional |
| 23 | eParcel | Digital/postal |
| 24 | Other | Catch-all |

**Key insight**: Some couriers include directionality ("OUT" suffix), meaning this dropdown serves both incoming AND outgoing packages. Mix of major carriers, regional services, e-commerce platforms, and internal categories.

### 3.2 Type of Parcel Options (11 total, configurable)

| # | Parcel Type |
|---|------------|
| 1 | white box |
| 2 | brown box |
| 3 | Small white box |
| 4 | Small brown box |
| 5 | Small white package |
| 6 | Small brown package |
| 7 | Big White box |
| 8 | Big brown box |
| 9 | Big brown package |
| 10 | Big white package |
| 11 | Large box |

**Note**: These are CONFIGURABLE via "Manage Parcel Types" (Section 7). The naming convention follows a pattern: [Size] + [Color] + [Container Type]. This is property-specific and can be customized per building.

### 3.3 Storage Spot Options (37 total, configurable)

| # | Storage Spot | Category |
|---|-------------|----------|
| 1 | Aisle 1 - Basket | Aisle storage |
| 2 | Aisle 1 - Top | Aisle storage |
| 3 | Aisle 1 - Bottom | Aisle storage |
| 4 | Aisle 2 - Basket | Aisle storage |
| 5 | Aisle 2 - Top | Aisle storage |
| 6 | Aisle 2 - Bottom | Aisle storage |
| 7 | G Floor Storage | Floor storage |
| 8 | Desk Drawer | Front desk |
| 9 | Behind the desk | Front desk |
| 10 | Storage Spot A | Generic |
| 11 | Storage Spot B | Generic |
| 12 | Storage Spot C | Generic |
| 13 | Storage Spot D | Generic |
| 14 | Storage Spot D | Generic (duplicate) |
| 15 | Security Room | Secure |
| 16 | Parcel Room | Dedicated |
| 17 | Mail room storage | Mail room |
| 18 | Mail room storage shelves | Mail room |
| 19 | RSS | Abbreviated |
| 20 | LSS | Abbreviated |
| 21 | Aisle Top 1 | Aisle storage |
| 22 | Aisle Top 2 | Aisle storage |
| 23 | Desk Drawer | Front desk (duplicate) |
| 24 | Behind the Desk | Front desk (case variant) |
| 25 | Supervisor Inbox | Staff-specific |
| 26 | Supervisor Outbox | Staff-specific |
| 27 | Desk drawer 1 | Numbered drawers |
| 28 | Desk drawer 2 | Numbered drawers |
| 29 | Desk drawer 3 | Numbered drawers |
| 30 | Desk drawer 4 | Numbered drawers |
| 31 | Desk drawer 5 | Numbered drawers |
| 32 | Parcel room | Dedicated (case variant) |
| 33 | Supervisor folder | Staff-specific |
| 34 | Management folder | Staff-specific |
| 35 | Resident Mail Drawer | Resident-specific |
| 36 | RC Desk | Specific location |
| 37 | Other | Catch-all |

**Observations**:
- Contains duplicates (e.g., "Desk Drawer" at #8 and #23, "Storage Spot D" at #13 and #14)
- Case inconsistency ("Parcel Room" vs "Parcel room", "Behind the desk" vs "Behind the Desk")
- No deduplication or validation — property can add any text
- Mix of physical locations (aisles, rooms) and containers (drawers, folders, baskets)

---

## 4. Record Packages Modal (Bulk Entry)

**Modal title**: "Record Packages"
**Trigger**: Click Icon 2 (sitemap icon)

### Layout
- **Back button** — Red, top-left, returns to Package Menu
- **Building tag** — Shows "Bond" with X to clear/change
- **Tabular form** — One row per package, horizontal layout
- **Add button** — Below the table row, adds another row

### Row Columns (per package)

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Related Unit | Dropdown | Required | Unit number selection |
| Package Details | Text input | No | Free text |
| Choose Resident | Dropdown | Required | Resident selection |
| Delivery Provider | Dropdown | Required | Same as Courier Name in single entry |
| Parcel Type | Dropdown | No | Same options as Type of parcel |
| Tracking# | Text input | Optional | Label says "(Optional):" |
| Storage | Dropdown | No | Placeholder "Choose Storage". Label: "Choose from below or add your own by typing" |
| Perishable Item | Dropdown | Required | Yes/No dropdown (not checkbox like single entry) |

**Key differences from single entry**:
- No Reference Number visible (auto-assigned on save)
- No Incoming/Outgoing toggle (defaults to Incoming?)
- "Delivery Provider" label instead of "Courier Name"
- "Perishable Item" is a Required dropdown (Yes/No) vs optional checkbox in single entry
- Compact horizontal layout vs vertical form
- Storage field allows free-text typing in addition to dropdown
- Can add unlimited rows via "Add" button

---

## 5. Release Package Modal

**Modal title**: "Release Package"
**Trigger**: Click the Release icon (signing icon) on a Non-Released package row

### Read-Only Summary Fields (top section)
| Field | Example Value |
|-------|--------------|
| Package Id | 2814280 |
| Package Type | incoming |
| Unit Number | 2804 |
| Type of parcel | (may be empty) |
| Package Details | brown package |
| Courier Name | Amazon |
| Tracking Number | undefined (shows "undefined" if not set) |
| Storage Spot | Parcel Room |

### Editable Fields
| Field | Type | Required | Placeholder | Notes |
|-------|------|----------|-------------|-------|
| Package Released to whom | Dropdown (combobox) | * | "Package Released to whom" | Select who is picking up |
| Any Comments | Textarea | * | "Package Comments" | Required release comments |

### Signature Capture Section
| Element | Type | Notes |
|---------|------|-------|
| "Check if signature capture is not needed?" | Toggle switch | Default OFF (signature IS needed) |
| Signature canvas | HTML Canvas | Dashed border, blank drawing area |
| Sign | Button | Activates the canvas for drawing |
| Clear | Button | Clears the signature |
| Done | Button | Confirms the signature capture |

### Batch Release Table
Below the signature area, a table allows selecting MULTIPLE packages belonging to the same resident for batch release:

| Column | Notes |
|--------|-------|
| Release | Checkbox per row |
| Reference Number | Package reference |
| Package Type | Incoming/Outgoing |
| Courier Name | Courier |
| Parcel Type | Type of parcel |
| Package Details | Description |
| Storage Spot | Location |
| Tracking Number | Tracking info |

- **Select All** toggle above the table
- **Save** button at bottom
- Table is empty if the resident has only one unreleased package

---

## 6. View/Edit Package Modal

**Modal title**: "Record Packages" (reuses same modal as creation)
**Trigger**: Click the View icon (envelope open icon) on a package row

### Fields (same as Record Package + additional release fields)

**All creation fields pre-populated**:
- Incoming toggle, Date and Time Created (read-only), Select Building, Related Unit, Choose Resident, Courier Name, Type of parcel, Tracking Number, Package Details, Storage Spot, Check if Perishable

**Additional release-tracking fields**:
| Field | Type | Placeholder | Notes |
|-------|------|-------------|-------|
| Package Release Comments | Textarea | "Package Release Comments:" | Empty for unreleased packages |
| Released To Whom | Text input | "Released To Whom:" | Free text, populated after release |
| Released By Whom | Text input | "Released By Whom:" | Staff who released |
| Package Release Date and Time | Text input | "Package Release Date and Time:" | Timestamp of release |
| Package Released to whom | Dropdown (combobox) | "Package Released to whom" | Required (*), same as in Release modal |

---

## 7. Manage Parcel Types Modal

**Modal title**: "Package Types:"
**Trigger**: Click "Manage Parcel Types" button on Package Menu page

### Add New Type
| Element | Type | Notes |
|---------|------|-------|
| Package Type | Text input | Placeholder "Package Type:" |
| Save | Button | Navy blue, adds the new type |

### Existing Types Table
| Column | Notes |
|--------|-------|
| Package Type Category | The type name |
| Added On | Timestamp (e.g., "Nov 5, 2024 2:27 PM") |
| Delete | Trash icon to remove |

**Current types**: All 11 types listed in Section 3.2, all added Nov 5, 2024 around 2:25-2:27 PM

**Key insight**: Types are property-level configuration. Any text can be added — no validation, no categorization, no deduplication enforcement.

---

## 8. Non-Released Packages Section

### Filter Bar
| Filter | Type | Default | Placeholder |
|--------|------|---------|-------------|
| Clear Search | Button (red) | — | — |
| Package Details | Text search | — | "Package Details" |
| Belongs To | Text search | — | "Belongs To" |
| Select building | Dropdown (combobox) | — | "Select building" |
| Filter by unit | Dropdown (combobox) | — | "Filter by unit:" (all units listed) |
| Numéro de réference | Text search | — | "Numéro de réference" (French!) |
| Start Date | Date picker | 3 months ago (e.g., 13-12-2025) | "Start Date Time" |
| End Date | Date picker | Today (e.g., 15-03-2026) | "End Date Time" |
| Search | Button (navy) | — | — |
| Print Non Released Packages | Button (navy) | — | — |

### Table: Non-Released Packages (15 columns)

| # | Column Header | Data Example | Notes |
|---|--------------|--------------|-------|
| 1 | Reference # | 1927 | Auto-incrementing integer |
| 2 | Unit # | 2804 | Unit number |
| 3 | Package Type | Incoming | "Incoming" or "Outgoing" |
| 4 | Belongs To | Jacqueline Tung (Username) | Resident name with username |
| 5 | Package Details | brown package | Free text description |
| 6 | courier | Amazon | Courier name (lowercase header!) |
| 7 | Creation Time | 13-03-2026 19:08 | DD-MM-YYYY HH:MM format |
| 8 | Storage Spot | Parcel Room | Storage location |
| 9 | Parcel Type | (may be empty) | Type of parcel |
| 10 | Release | (signing icon) | Action: opens Release Package modal |
| 11 | View | (envelope open icon) | Action: opens View/Edit modal |
| 12 | Edit | (edit outline icon) | Action: opens Edit mode |
| 13 | Delete | (trash icon) | Action: deletes the package |
| 14 | Building Name | Bond | Building name |
| 15 | ReleaseTime | (empty for non-released) | Timestamp when released |

### Row Action Icons (Semantic UI icons)
| Action | Icon Class | Behavior |
|--------|-----------|----------|
| Release | `signing icon` | Opens Release Package modal with signature capture |
| View | `envelope open icon` | Opens View/Edit modal with all fields pre-populated |
| Edit | `edit outline icon` | Opens Edit mode (same modal as View) |
| Delete | `trash icon` | Deletes the package record |

### Pagination
- Page navigation: Previous / Next buttons
- Page display: "Page [input] of 11"
- Rows per page: Dropdown with options: **5, 10, 20, 25, 50, 100** (default: 10)

---

## 9. Released Packages Section

**Heading**: "Released Packages: Past 21 Days"

### Filter Bar
Same structure as Non-Released but with these differences:
| Difference | Non-Released | Released |
|-----------|-------------|---------|
| Default date range | 3 months (e.g., 13-12-2025 to 15-03-2026) | 21 days (e.g., 06-03-2026 to 15-03-2026) |
| Building dropdown label | "Select building" | "SearchBuilding" |
| Print button | "Print Non Released Packages" | **NOT PRESENT** |

### Table: Released Packages (12 columns)

| # | Column Header | Data Example | Notes |
|---|--------------|--------------|-------|
| 1 | Reference # | 1560 | Same auto-increment |
| 2 | Unit # | 3605 | Unit number |
| 3 | Package Type | Incoming | Incoming/Outgoing |
| 4 | Belongs To | Brandon Won... | Resident name (truncated) |
| 5 | Package Details | Green package | Free text |
| 6 | Creation Time | 09-03-2026 1... | Creation timestamp |
| 7 | courier | Canada Post | Courier name |
| 8 | ReleaseTime | 13-03-2026 2... | When the package was released |
| 9 | Parcel Type | (may be empty) | Type of parcel |
| 10 | View | (envelope open icon) | Only action available |
| 11 | Building Name | Bond | Building |
| 12 | Comments | (may be empty) | Release comments |

**Key differences from Non-Released table**:
- **No Release, Edit, or Delete actions** — only View
- **ReleaseTime column populated** with actual timestamp
- **Comments column added** — shows release comments
- **Storage Spot column REMOVED** — no longer relevant after release
- **3 fewer columns** (15 vs 12)

### Pagination
Same as Non-Released: Previous/Next, page jump, rows per page (5/10/20/25/50/100)

---

## 10. Package Lifecycle

```
[Create Package] → Non-Released Packages table
        ↓
[Release Package] → signature capture + release-to-whom + comments
        ↓
Released Packages table (past 21 days visible by default)
```

### States
1. **Non-Released (Active)**: Package is in storage, awaiting pickup
   - All actions available: Release, View, Edit, Delete
   - ReleaseTime column empty
2. **Released (Historical)**: Package has been picked up
   - Only View action available
   - ReleaseTime populated
   - Comments visible
   - Displayed for 21 days by default (configurable via date range)

---

## 11. Incoming vs Outgoing

The **Incoming** toggle in the Record Package modal switches between:
- **Incoming** (toggle ON, blue): Package received at building for a resident
- **Outgoing** (toggle OFF): Package being sent out from a resident

The Courier Name dropdown includes outgoing-specific options:
- "Key/envelop (OUT)"
- "Courier pickup (OUT)"

The Package Type column in both tables shows "Incoming" or "Outgoing".

---

## 12. Concierge Design Implications

### Strengths to Preserve
1. **Auto-generated reference numbers** — trackable, no manual entry needed
2. **Signature capture on release** — legal proof of pickup, with option to skip
3. **Batch release** — release multiple packages to same resident with one signature
4. **Configurable parcel types** — property can add/remove types via Manage Parcel Types
5. **Physical storage tracking** — 37 storage spots give precise location tracking
6. **Perishable flag** — important for prioritizing time-sensitive deliveries
7. **Separated Non-Released/Released views** — clear operational focus
8. **Print Non Released Packages** — generates printable list for lobby/mailroom posting
9. **Bulk entry mode** — fast multi-package intake for busy front desks
10. **Courier diversity** — 24 couriers including e-commerce (Temu, Amazon) and internal categories

### Gaps & Issues to Fix
1. **"undefined" showing for empty tracking** — should show blank or "N/A"
2. **Duplicate storage spots** — "Desk Drawer" appears twice, "Storage Spot D" twice, case inconsistencies
3. **No courier logos/icons** — BuildingLink has visual courier icons (Amazon/FedEx/UPS), Aquarius is text-only
4. **No photo capture** — can't photograph the package at intake
5. **No notification on intake** — no visible "notify resident" option when recording a package
6. **No QR/barcode scanning** — all entry is manual text
7. **French label leak** — "Numéro de réference" in an English UI (localization issue)
8. **No package categories** — everything is flat. BuildingLink has Event Types that could categorize (large parcel vs envelope vs grocery delivery)
9. **No driver's license capture** — BuildingLink offers this as a premium feature for release verification
10. **Modal title confusion** — View, Edit, and Create all use "Record Packages" title
11. **No email/SMS notification on release** — no visible outbound notification when package is released
12. **Released packages limited to 21 days** — requires manual date range change for older packages
13. **Storage spots not configurable via UI** — unlike Parcel Types, no "Manage Storage Spots" feature visible
14. **No bulk import** — can't import tracking numbers from carrier APIs
15. **Outgoing packages mixed with incoming** — share same form, courier list, and table. Could benefit from separate workflows

---

## 13. Data Model (Inferred)

```
Package
├── id (internal, e.g., 2814280)
├── reference_number (auto-generated, e.g., 1927)
├── building_id → Building
├── unit_id → Unit (optional)
├── resident_id → Resident (required)
├── package_type (enum: "Incoming" | "Outgoing")
├── courier_name (string, from configurable list)
├── parcel_type_id → ParcelType (configurable, optional)
├── package_details (text, free-form description)
├── tracking_number (string, optional)
├── storage_spot (string, from configurable list)
├── is_perishable (boolean)
├── created_at (datetime)
├── created_by → Staff
├── released_at (datetime, nullable)
├── released_by → Staff (nullable) — "Released By Whom"
├── released_to (string, nullable) — "Released To Whom" (free text)
├── released_to_resident_id → Resident (nullable) — "Package Released to whom" (dropdown)
├── release_comments (text, nullable)
├── signature (blob, nullable) — canvas signature capture
└── signature_required (boolean, default true)

ParcelType (configurable per property)
├── id
├── name (string)
├── property_id → Property
└── created_at (datetime)
```

---

## 14. Cross-Reference: Aquarius vs BuildingLink Package Features

| Feature | Aquarius | BuildingLink | Concierge Decision |
|---------|----------|-------------|-------------------|
| Auto-reference numbers | Yes (#1927) | Yes | Keep — essential tracking |
| Courier logos/icons | No (text only) | Yes (Amazon/FedEx/UPS icons) | **Add** — visual scanning is critical for busy front desks |
| Signature capture | Yes (HTML Canvas) | Yes (premium) | Keep — include in base product, not premium |
| Batch release | Yes (same-resident multi-select) | Limited | Keep — very useful feature |
| Bulk entry | Yes (tabular multi-row) | Yes (4-row form) | Keep — match Aquarius's unlimited rows |
| Photo capture | No | Yes (premium) | **Add** — photo proof of package condition |
| Notification on intake | Not visible | Yes (per-row notification control) | **Add** — residents should be notified immediately |
| QR/barcode scanning | No | No | **Add** — modern package management requires this |
| Physical storage tracking | Yes (37 spots) | Limited | Keep — Aquarius is better here |
| Perishable flag | Yes | No | Keep — time-sensitive prioritization |
| Package types configurable | Yes (Manage Parcel Types) | Via Event Types | Keep Aquarius approach — simpler |
| Incoming/Outgoing toggle | Yes (single toggle) | Separate workflows | Evaluate — toggle is simpler but may conflate workflows |
| Print non-released list | Yes | No | Keep — useful for lobby posting |
| Driver's license capture | No | Yes (premium) | Evaluate for v2 |
| Carrier API integration | No | No | **Add for v2** — auto-populate from tracking numbers |
| Resident self-service | Not visible | Limited | **Add** — residents should see their packages in portal |

---

*Last updated: 2026-03-13*
*Total fields documented: ~80+*
*Dropdown options fully extracted: 3 (Courier: 24, Type of Parcel: 11, Storage Spot: 37)*
