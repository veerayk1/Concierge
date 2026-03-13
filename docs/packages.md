# Package Management

The Package Management page provides tools for receiving, tracking, and releasing resident packages/parcels.

**URL**: `/packages/0`

**Title**: "Package Menu"

---

## Quick Create Icons

Two circular icon buttons labeled **"Click to create"** at the top:

| Icon | CSS Class | Action |
|------|-----------|--------|
| Inbox Icon | `i.inbox.huge.circular.icon.logs-button` | Opens **Record Packages** modal (receive incoming) |
| Sitemap Icon | `i.sitemap.huge.circular.icon.logs-button` | Release/distribute packages (batch release) |

---

## Manage Parcel Types

**"Manage Parcel Types"** button (top-right, dark blue) — opens a modal to configure package type categories.

### Parcel Types Modal

| Field | Type | Description |
|-------|------|-------------|
| Package Type | Text input | Name for the new parcel type category |
| **Save** | Button | Save the new type |

### Parcel Types Table

| Column | Description |
|--------|-------------|
| Package Type Category | Name of the parcel type |
| Added On | Date/time the type was created |
| Delete | Trash icon to remove the type |

### Sample Parcel Type Categories (11 types)
- white box
- brown box
- Small white box
- Small brown box
- Small white package
- Small brown package
- Big White box
- Big brown box
- Big brown package
- Big white package
- Large box

---

## Search Filters

| Filter | Type | Description |
|--------|------|-------------|
| Package Details | Text + search icon | Search by package description |
| Belongs To | Text + search icon | Search by recipient name |
| Select building | Dropdown | Filter by building |
| Filter by unit | Dropdown | Filter by unit number |
| Numéro de référence | Text + search icon | Search by reference number |
| Start Date | Date picker | Default: 90 days before today |
| End Date | Date picker | Default: 2 days from today |
| Clear Search | Button | Reset all filters |
| Search | Button (dark blue) | Execute search |
| Print Non Released Packages | Button (dark blue) | Print/export unreleased package list |

---

## Section 1: Non-Released Packages

Packages that have been received but not yet picked up/released to the resident.

### Table Columns

| Column | Description |
|--------|-------------|
| Reference # | Unique package reference number |
| Unit # | Associated unit number |
| Package Type | Type: "Incoming" |
| Belongs To | Resident name who the package is for |
| Package Details | Description of package (e.g., "white package", "brown package") |
| courier | Courier/delivery company (e.g., "Amazon") |
| Creation Time | Timestamp when package was logged |
| Storage Spot | Where the package is stored (e.g., "Parcel Room") |
| Parcel Type | Category from Manage Parcel Types |
| Release | Icon button to release package to resident |
| View | View icon to see full package details |
| Edit | Edit icon to modify package entry |
| Delete | Trash icon to delete package entry |
| Building Name | Which building (e.g., "Bond") |
| ReleaseTime | Timestamp when package was released (empty if not released) |

- **Pagination**: 5 rows per page, Previous/Next navigation

---

## Section 2: Released Packages — Past 21 Days

Packages that have been released/picked up within the last 21 days.

- Same table structure as Non-Released Packages
- Includes release timestamp
- Separate search filters (Clear Search, Search buttons)
- **Pagination**: 5 rows per page, Previous/Next navigation

---

## Record Packages Modal (Create)

Opened by clicking the **Inbox Icon**.

**Title**: "Record Packages"

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| Incoming | — | Toggle switch | Toggle for incoming package (default: on/blue) |
| Select Building | Yes* | Dropdown | Choose building (default: Bond) |
| Reference Number | Auto | Display | Auto-generated reference number (e.g., "1865") shown in red |
| Related Unit | No | Dropdown | Associate with a unit |
| Choose Resident | Yes* | Dropdown | Select the resident receiving the package |
| Courier Name | No | Dropdown | Courier/delivery company |
| Type of parcel | No | Dropdown | Parcel type from configured categories. Note: "(Add them on previous page using the button)" |
| Tracking Number (optional) | No | Text input | Package tracking number |
| Package Details | No | Textarea | Description/details of the package |
| Storage Spot | No | Dropdown | Where to store the package (e.g., "Choose Storage Spot") |
| Check if the item is Perishable | No | Checkbox | Flag perishable items |
| **Save** | — | Button | Submit and record the package |

**Bulk Addition** button (top-right, outlined) — allows recording multiple packages at once.

---

## Features Summary

- Dual-section layout: Non-Released vs Released packages
- Package lifecycle tracking (receive → store → release)
- Configurable parcel type categories
- Storage spot assignment
- Perishable item flagging
- Bulk package recording
- Print non-released packages report
- Courier tracking with tracking numbers
- 21-day released package history
- Multi-building support
