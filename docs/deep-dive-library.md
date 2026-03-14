# Deep Dive: Library Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/library`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/library`
**Page title**: "Library"
**Sidebar label**: "Library"

### Page Layout
1. **Header**: Title "Library" + 1 action button
2. **Search bar**: Search File + Search Folder inputs
3. **Building filter**: "Select building:" dropdown
4. **Stats cards**: 2 summary cards (Files Uploaded, Total Space Used)
5. **Recent Uploads section**: Folder accordion with files inside each folder

### Action Button
| Button | Style | Action |
|--------|-------|--------|
| Create New Folder | Filled dark blue | Opens Create New Folder modal |

### Search Bar
| Element | Type | Placeholder | Notes |
|---------|------|-------------|-------|
| Search File | Text input with search icon | "Search File" | Search within file names |
| Search Folder | Text input with search icon | "Search Folder" | Search within folder names |

### Building Filter
| Element | Type | Notes |
|---------|------|-------|
| Select building | Dropdown | Filter content by building |

### Stats Cards
| Card | Icon | Value | Label | Subtitle |
|------|------|-------|-------|----------|
| Files Uploaded | Purple folder icon | 23 | FILES | "All Time" |
| Total Space Used | Teal download icon | 10.02 | MEGABYTES | "All Time" |

---

## 2. Folder Structure (Accordion View)

The library uses a **numbered accordion** layout. Each folder is an expandable section showing its contents.

### Existing Folders (8 folders)
| # | Folder Name | Description | File Count |
|---|-------------|-------------|------------|
| 1 | Expert Tips | Tips and information from experts | 2 |
| 2 | Documents | Documents | 2 |
| 3 | Forms | Forms | 4 |
| 4 | Notices | Bond Notices | 15 |
| 5 | Minutes | Minutes | 0* |
| 6 | Newsletters | Newsletters | 0* |
| 7 | Rules | Rules | 0* |
| 8 | Suite plans | Suite plans | 0* |

*File counts for folders 5-8 not confirmed due to truncated data extraction

### Folder Action Buttons (4 per folder)
| Button | Purpose |
|--------|---------|
| Add File | Upload a new file to this folder |
| Permissions | Manage who can access this folder |
| Delete | Delete the folder |
| Update | Edit folder name/description |

### Sample Files by Folder

**1. Expert Tips** (2 files)
| File Name | Added On |
|-----------|----------|
| Main Water Shutoff Key (Photos- with instructions) 2-converted.pdf | Nov 6, 2020 10:43 AM |
| BOND - Homeowners 101 - HVAC Heat Pumps.pdf | Oct 27, 2020 6:59 PM |

**2. Documents** (2 files)
| File Name | Added On |
|-----------|----------|
| Put ORGANICS here.docx | Nov 19, 2020 3:18 PM |
| Bond Handyman Service- Cover Letter - Final (1).pdf | Nov 6, 2020 10:42 AM |

**3. Forms** (4 files)
| File Name | Added On |
|-----------|----------|
| TSCC 2584 Party Room Rental Agreement 12-2021.pdf | Aug 1, 2022 8:00 AM |
| TSCC 2584 Guest Suite Reservation.pdf | Aug 1, 2022 7:59 AM |
| TSCC 2584 Elevator agreement.pdf | Aug 1, 2022 7:59 AM |
| TSCC 2584 Action Alert Form.pdf | Aug 1, 2022 7:58 AM |

**4. Notices** (15 files — most populated folder, sample shown)
| File Name | Added On |
|-----------|----------|
| Pet Etiquette Reminder Notice-.pdf | Mar 19, 2021 12:41 PM |
| TSCC 2584-Garbage Chute Report (2019 02 22).pdf | Nov 6, 2020 10:37 AM |
| *(13 more files)* | — |

### Per-File Actions
| Action | Style | Notes |
|--------|-------|-------|
| Download | Green button with download icon | Downloads the file |
| Delete | Trash icon | Deletes the file |

---

## 3. Create New Folder Modal

**Modal title**: "Create New Folder"
**Trigger**: Click "Create New Folder" button
**Style**: Modal with X close button

### Form Fields
| # | Field | Type | Required | Default | Notes |
|---|-------|------|----------|---------|-------|
| 1 | Select Building | Dropdown | No* | "Bond" | Pre-selected for single-building property |
| 2 | Folder Display Name | Text input | Yes | — | What users see |
| 3 | Folder Name | Text input | Yes | — | Internal/system name |
| 4 | Folder Description | Text input | Yes | — | Description of folder contents |
| 5 | Save | Button (outlined blue) | — | — | Creates the folder |
| 6 | Cancel | Button (filled red) | — | — | Closes modal |

**Key insight**: There are TWO name fields — "Folder Display Name" (user-facing) and "Folder Name" (internal). This allows for a clean display name while keeping a system-friendly internal name.

---

## 4. Library Module Lifecycle

```
[Create Folder] → Folder appears in accordion
    ↓
[Add File] → Upload files to folder
    ↓
[Files appear] → Each file has Download + Delete actions
    ↓
[Manage] → Update folder, Permissions, Delete folder
```

### Key behaviors:
- **Folder-based organization** — All files must belong to a folder
- **Accordion UI** — Folders expand to show their files
- **Permission control** — Each folder has a "Permissions" button for access control
- **Dual search** — Separate search for files and folders
- **Building scoped** — Files are organized per building
- **Usage stats** — Dashboard cards show total files (23) and total space (10.02 MB)
- **File types** — Primarily PDFs and DOCXs observed
- **No versioning** — No visible file version history
- **No preview** — No inline file preview; download is the only way to view
- **Cross-module integration** — Announcements have a "Save to Library" toggle

---

## 5. Concierge Design Implications

### Strengths to Preserve
1. **Folder-based organization** — Simple, familiar structure for document management
2. **Per-folder permissions** — Different folders can have different access levels
3. **Dual name system** — Display name and internal name for flexibility
4. **Dual search** — Search files and folders independently
5. **Usage statistics** — File count and space used give quick overview
6. **Cross-module integration** — Announcements can be saved to Library
7. **Building-scoped** — Documents organized per building

### Gaps & Issues to Fix
1. **No file versioning** — Can't upload a new version of an existing file
2. **No inline preview** — Must download to view files
3. **No file metadata** — No tags, categories, or custom attributes per file
4. **No upload date sorting** — Files appear in order but no sort controls
5. **No file size display** — Individual file sizes not shown
6. **No bulk upload** — "Add File" appears to be single-file only
7. **No drag-and-drop to folders** — Can't drag files between folders
8. **No file sharing links** — Can't generate shareable links for specific files
9. **No expiry dates** — Documents don't expire (forms may become outdated)
10. **Folder names are generic** — "Documents", "Forms" etc. could use subcategories
11. **No nested folders** — Flat folder structure only, no subfolders
12. **No audit trail** — No log of who downloaded/uploaded files and when
13. **No file type restrictions visible** — No documented allowed file types
14. **Accordion renders below fold** — Folders are in DOM but difficult to scroll to visually

### Comparison: Aquarius Library vs BuildingLink Document Management

| Feature | Aquarius | BuildingLink |
|---------|----------|-------------|
| Folder organization | Yes (flat, 8 folders) | Unknown |
| Per-folder permissions | Yes | Unknown |
| File search | Yes (separate file + folder) | Unknown |
| Inline preview | No (download only) | Unknown |
| File versioning | No | Unknown |
| Usage stats | Yes (file count + space) | Unknown |
| Cross-module integration | Yes (from Announcements) | Unknown |
| Bulk upload | Not visible | Unknown |
| Nested folders | No | Unknown |
| File metadata/tags | No | Unknown |

---

## 6. Data Model (Deduced)

```
Library
├── Folder
│   ├── id
│   ├── folder_name (internal name)
│   ├── folder_display_name (user-facing name)
│   ├── folder_description (text)
│   ├── building_id → Building
│   ├── order (number — display position 1-8)
│   ├── permissions[] → Role/Group
│   ├── created_at
│   └── files[] → File
│       ├── id
│       ├── file_name (original filename)
│       ├── file_path (storage location)
│       ├── file_size (bytes)
│       ├── file_type (extension)
│       ├── added_on (datetime, format: "Nov 6, 2020 10:43 AM")
│       ├── uploaded_by → User
│       └── folder_id → Folder
└── Stats
    ├── total_files (count)
    └── total_space_used (bytes → displayed as MB)
```

---

*Last updated: 2026-03-14*
*Total fields documented: ~20*
*Folders documented: 8 (Expert Tips, Documents, Forms, Notices, Minutes, Newsletters, Rules, Suite plans)*
*Files observed: 23 total across all folders*
