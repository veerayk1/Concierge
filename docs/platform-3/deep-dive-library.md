# Library — Granular Deep Dive

Field-level documentation of every element in Condo Control's Library (File Library) module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/library/landing`
**Sidebar menu**: Library (book icon)
**Breadcrumb**: Home > Library (on landing page); Home > Library > Folder (on folder view)
**Page title**: "Library | Condo Control" (landing); "Folder | Condo Control" (folder view)

The Library module is a **document management system** organized into folders. Each folder contains downloadable files (PDFs, Word docs, etc.). The module supports searching by file type and date range, and displays recent uploads.

**Role access**: Security & Concierge has **read-only** access. Can browse folders, view files, and download. No upload, create folder, or delete functionality observed.

---

## 2. Library Landing Page

**URL**: `/library/landing`

### 2.1 Search and Filter Bar

| # | Field | Type | ID/Name | Default | Options/Behavior |
|---|-------|------|---------|---------|------------------|
| 1 | Search | Text input | (unnamed) | Empty | Free-text search. No placeholder text. Label: "Search in Folder:" on folder view, no label on landing |
| 2 | File Type | Select dropdown | `FileTypeSelectID` | "All File Types" (0) | 36 file type options (see §2.2) |
| 3 | Date | Select dropdown | (unnamed) | "All Dates" (0) | 10 date range options (see §2.3) |
| 4 | Search | Button | — | — | Teal `btn-primary`. Applies filters |

### 2.2 File Type Dropdown Options (Complete)

| Value | Label | Value | Label |
|-------|-------|-------|-------|
| 0 | All File Types | 42 | *(empty label — bug)* |
| 28 | .acc | 21 | .avi |
| 33 | .bmp | 38 | .csv |
| 1 | .doc | 8 | .docx |
| 30 | .flac | 6 | .gif |
| 47 | .heic | 48 | .ico |
| 16 | .jpeg | 4 | .jpg |
| 32 | .m4a | 22 | .mov |
| 26 | .mp3 | 25 | .mp4 |
| 24 | .mpeg | 23 | .mpg |
| 13 | .msg | 46 | .numbers |
| 20 | .odt | 45 | .pages |
| 2 | .pdf | 11 | .png |
| 12 | .ppsx | 9 | .ppt |
| 37 | .pptx | 15 | .rtf |
| 14 | .txt | 19 | .wav |
| 27 | .wma | 34 | .wmv |
| 35 | .xls | 7 | .xlsx |

**Total**: 36 options (including "All File Types" and one empty-label option with value=42)

**Supported file categories**:
- **Documents**: .doc, .docx, .pdf, .rtf, .txt, .odt, .csv, .msg, .pages, .numbers
- **Spreadsheets**: .xls, .xlsx, .csv, .numbers
- **Presentations**: .ppt, .pptx, .ppsx
- **Images**: .jpg, .jpeg, .png, .gif, .bmp, .heic, .ico
- **Video**: .avi, .mov, .mp4, .mpeg, .mpg, .wmv
- **Audio**: .acc, .flac, .m4a, .mp3, .wav, .wma

**Bug**: Option with value=42 has an empty label — displays as a blank option in the dropdown.

### 2.3 Date Filter Dropdown Options

| Value | Label | Description |
|-------|-------|-------------|
| 0 | All Dates | No date filter |
| 1 | Last Week | Previous 7 days |
| 2 | This Week | Current week |
| 3 | Last Month | Previous calendar month |
| 4 | This Month | Current calendar month |
| 5 | Last Quarter | Previous quarter |
| 6 | This Quarter | Current quarter |
| 7 | Last Year | Previous calendar year |
| 8 | This Year | Current calendar year |
| 300 | Custom Date | Likely opens date picker (not tested) |

### 2.4 Recent Uploads Section

| # | Element | Description |
|---|---------|-------------|
| 1 | Section title | "Recent Uploads (30 days)" — h2-level heading |
| 2 | View More | Link, right-aligned. Navigates to `/library/search-recent` |
| 3 | Empty state | "There are no recent uploads in the last 30 days" — plain text message |

**Behavior**: Shows files uploaded within the last 30 days. Currently empty for this property — no uploads in the last 30 days.

---

## 3. Folder Tree Sidebar

**Position**: Left panel below the filter bar on both landing and folder view pages.
**Heading**: "Folders" (with list icon ☰)

### 3.1 Tree Structure

The folder tree is a **single-level hierarchy** with a root "File Library" node and child folders.

```
📁 File Library (root, folderID=76619)
  ├── BELL CABLE AND INTERNET TRANSITION (folderID=170676)
  ├── BUILDING DATA SHEET (folderID=80234)
  ├── BUILDING FIRE SAFETY PLAN (folderID=80230)
  ├── FORMS (folderID=170672)
  └── NEWSLETTERS AND OTHER COMMUNICATIONS (folderID=76623)
```

**Tree behavior**:
- Root "File Library" has a folder icon (📁) — teal link text
- Child folders are indented under root — teal link text, ALL CAPS names
- Clicking a folder navigates to `/library/view-folder?folderID={id}`
- Currently selected folder is shown in **bold** text in the sidebar
- No expand/collapse — all folders visible at once (flat, single-level)
- No subfolder nesting observed — all folders are direct children of root

### 3.2 Folder Data (Complete)

| Folder Name | Folder ID | Description | File Count |
|-------------|-----------|-------------|------------|
| File Library (root) | 76619 | Root container | — |
| BELL CABLE AND INTERNET TRANSITION | 170676 | Information relating to the transition from Rogers cable to Bell cable and internet. | 6 |
| BUILDING DATA SHEET | 80234 | For management, security and staff access only. | 1 |
| BUILDING FIRE SAFETY PLAN | 80230 | For management and security access only. | 1 |
| FORMS | 170672 | For booking the elevator or party room, updating resident info, signing up for pre-authorized maintenance fee payments, etc. | 6 |
| NEWSLETTERS AND OTHER COMMUNICATIONS | 76623 | Past and current issues of our condo newsletter, as well as other communications sent. | 5 |

**Total folders**: 5 (plus root)
**Total files across all folders**: 19

---

## 4. Landing Page — File Library (Root View)

**URL**: `/library/landing` or `/library/view-folder?folderID=76619`

### 4.1 Folder Listing Table (Right Panel)

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | (icon) | No | Folder icon — yellow/gold folder image |
| 2 | Name | Yes (▲ sort indicator) | Folder name (teal link) + description text below |

**Table header style**: Dark teal background, white text. "Name" column with ascending sort indicator (▲).

**Folder rows** display:
- Yellow folder icon (left)
- Folder name in teal link text (navigates to folder view)
- Description in grey/italic text below the name

---

## 5. Folder View Page

**URL**: `/library/view-folder?folderID={folderID}`
**Page title**: "Folder | Condo Control"
**Breadcrumb**: Home > Library > Folder

### 5.1 Layout

Same layout as landing page:
- **Top**: "Search in Folder:" label + search text input + File Type dropdown + Date dropdown + Search button
- **Left panel**: Folder tree sidebar (same as landing)
- **Right panel**: Folder name (h1, ALL CAPS) + file listing table

**Note**: The search label changes from no label (landing) to "Search in Folder:" (folder view).

### 5.2 Bulk Action Buttons

Two bulk action toolbars (hidden by default, toggled):

| # | Button | Style | Description |
|---|--------|-------|-------------|
| 1 | Select Multiple Items To Delete | Button | Enables checkbox selection for bulk delete |
| 2 | Cancel | Button | Cancels delete mode |
| 3 | Select Multiple Items To Move | Button | Enables checkbox selection for bulk move |
| 4 | Cancel | Button | Cancels move mode |

**Note**: Both bulk actions available for Security & Concierge role — contradicts the "read-only" assumption. May be visible but not functional.

### 5.2 File Listing Table

| # | Column | Sortable | Description |
|---|--------|----------|-------------|
| 1 | (icon) | No | File type icon — varies by file format (PDF icon, Word icon, etc.) |
| 2 | Name | Yes (▲ sort indicator) | File name (teal link) + optional description text below |

**File row display**:
- File type icon (left) — color-coded by type:
  - **PDF files**: Red/coral document icon with folded corner
  - **Word files (.docx)**: Blue "W" document icon
- File name in teal link text
- Optional description in grey text below the name
- Clicking the file name navigates to `/view-file.aspx?FileRecordID={id}&Key={guid}`

**File download behavior**: File links point to `/view-file.aspx` — a legacy ASP.NET page that serves the file for viewing/download.

**URL pattern**: `/view-file.aspx?FileRecordID={fileRecordID}&Key={guid}`
- `FileRecordID`: Integer unique file identifier
- `Key`: GUID security token for file access

---

## 6. Folder Contents (Complete Inventory)

### 6.1 BELL CABLE AND INTERNET TRANSITION (folderID=170676)

| # | File Name | Description | Type |
|---|-----------|-------------|------|
| 1 | Bell Installation - Chinese Translation | — | PDF |
| 2 | Bell Installation - Instructions | — | PDF |
| 3 | Channel Lineup | Channels included in new Bell package. | PDF |
| 4 | Channel Lineup | *(duplicate name, no description)* | PDF |
| 5 | Setting Up a Bell Email Address | Instructions for those who wish to set up a @bell.net email address. | PDF |
| 6 | Setting Up a MyBell Account | Instructions for setting up your MyBell account (so that you can use TV and Crave apps, make changes to your services, etc.). | PDF |

**Note**: Two files named "Channel Lineup" — duplicate names with no distinguishing description.

### 6.2 BUILDING DATA SHEET (folderID=80234)

| # | File Name | Description | Type |
|---|-----------|-------------|------|
| 1 | Building Data Sheet | Updated December 18 2023 | Word (.docx) |

### 6.3 BUILDING FIRE SAFETY PLAN (folderID=80230)

| # | File Name | Description | Type |
|---|-----------|-------------|------|
| 1 | Fire Safety Plan - Updated April 2023 | — | PDF |

### 6.4 FORMS (folderID=170672)

| # | File Name | Description | File Record ID | Type |
|---|-----------|-------------|----------------|------|
| 1 | Elevator Booking Agreement | Please fill out and submit at security desk along with required deposit to secure your booking. | 3081759 | PDF |
| 2 | Party Room Booking Agreement | Please fill out and submit at security desk along with required deposits to secure your booking. | 3081753 | PDF |
| 3 | Pre-Authorized Payment Form (For Unit Owners Only) | To sign up for pre-authorized withdrawal of maintenance fees. Please submit to management office with a VOID cheque/bank account info sheet. | 3081798 | PDF |
| 4 | Renovation Request Form (For Unit Owners Only) | Must be filled out and submitted to management, along with required documentation, prior to any in-suite renovations. | 3081819 | PDF |
| 5 | Resident Information Form | Please fill out and submit to management if an update is required, or if you are new to the building. | 3081803 | PDF |
| 6 | Service Request Form | Fill out and submit to management/security. Hard copies are available at the security desk. | 3081822 | PDF |

### 6.5 NEWSLETTERS AND OTHER COMMUNICATIONS (folderID=76623)

| # | File Name | Description | File Record ID | Type |
|---|-----------|-------------|----------------|------|
| 1 | 2023 Spring Newsletter | — | 2977513 | PDF |
| 2 | 2023 Summer Newsletter | — | 3243421 | PDF |
| 3 | 2023/2024 Winter Newsletter | — | 3860759 | PDF |
| 4 | Newsletter Summer 2024 | — | 4437420 | PDF |
| 5 | Tips for Reducing Condensation on Windows | — | 4314220 | PDF |

---

## 7. Data Model Observations

### 7.1 Folder Entity

| Field | Type | Description |
|-------|------|-------------|
| FolderID | Integer | Unique folder identifier (e.g., 76619, 170672) |
| FolderName | String | Display name (ALL CAPS convention at this property) |
| Description | String | Folder description text |
| ParentFolderID | Integer | Parent folder (76619 = File Library root for all observed) |

### 7.2 File Entity

| Field | Type | Description |
|-------|------|-------------|
| FileRecordID | Integer | Unique file identifier (e.g., 3081759) |
| Key | GUID | Security access token (required in URL to download) |
| FileName | String | Display name of the file |
| Description | String | Optional description text shown below file name |
| FileType | String | File extension (.pdf, .docx, etc.) |
| FolderID | Integer | Parent folder |
| UploadDate | DateTime | When the file was uploaded (used by Recent Uploads and date filter) |

### 7.3 File Type IDs

Non-sequential IDs suggest the file type list has been added to over time:
- Original types: .doc (1), .pdf (2), .jpg (4), .gif (6), .xlsx (7), .docx (8)
- Later additions: .heic (47), .ico (48), .numbers (46), .pages (45)
- Mystery type: ID 42 has an empty label (possible deleted/hidden type)

---

## 8. URL Map

| Page | URL Pattern |
|------|-------------|
| Library landing | `/library/landing` |
| Root folder view | `/library/view-folder?folderID=76619` |
| Folder view | `/library/view-folder?folderID={folderID}` |
| File download | `/view-file.aspx?FileRecordID={fileRecordID}&Key={guid}` |
| Recent uploads | `/library/search-recent` |

**Note**: File download uses a legacy ASP.NET page (`/view-file.aspx`) while the library module itself uses modern routes (`/library/`). This indicates the file serving infrastructure predates the current UI.

---

## 9. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Folder-based organization** — Simple, familiar file/folder metaphor. Easy for property managers to organize documents
2. **File type filtering** — 35 supported file types with dropdown filter. Covers documents, images, video, audio
3. **Date range filtering** — 10 preset date ranges + custom date. Good for finding recently uploaded documents
4. **File descriptions** — Optional description per file adds context without cluttering the file name
5. **Folder descriptions** — Each folder has a description explaining its purpose and access restrictions
6. **Recent Uploads section** — Dedicated 30-day recent uploads view on landing page. Quick access to new documents
7. **GUID-secured file URLs** — Files require both FileRecordID and a GUID Key to access. Prevents URL guessing
8. **File type icons** — Different icons for PDF vs Word vs other types. Visual identification of file format

### What CondoControl Gets Wrong
1. **No upload capability for Security & Concierge** — Read-only access. A concierge should be able to upload incident photos, shift reports, or form submissions
2. **Single-level folder hierarchy** — No subfolder nesting. Cannot organize FORMS into sub-categories (e.g., "Booking Forms", "Resident Forms", "Financial Forms")
3. **ALL CAPS folder names** — "BELL CABLE AND INTERNET TRANSITION" is shouting. Should use title case
4. **No file size displayed** — Cannot see how large files are before downloading
5. **No upload date displayed** — File listing doesn't show when files were uploaded. "Updated December 18 2023" is manually typed into the file name/description, not a system field
6. **No file preview** — Must download to view. No inline PDF preview or image thumbnail
7. **No version history** — No indication of file versions. "Updated April 2023" is in the filename, not system metadata
8. **Duplicate file names allowed** — Two "Channel Lineup" files in BELL CABLE folder with no way to distinguish them
9. **Legacy ASP.NET file serving** — `/view-file.aspx` endpoint reveals legacy infrastructure
10. **Empty file type option** — Value=42 in the file type dropdown has an empty label — UI bug
11. **No pagination on file listings** — All files load at once. Works for 6 files but would be problematic for folders with hundreds of files
12. **No search placeholder text** — Search input has no placeholder on landing page; "Search in Folder:" label only appears on folder view
13. **No drag-and-drop upload** — Modern file libraries support drag-and-drop. This only has a traditional file input (for roles that can upload)
14. **Breadcrumb says "Folder" not folder name** — Folder view breadcrumb shows generic "Folder" instead of the actual folder name (e.g., "FORMS")

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~250+*
