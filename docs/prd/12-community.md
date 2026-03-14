# 12 -- Community

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 09-Communication, 19-AI Framework

---

## 1. Overview

The Community module is the social and informational hub of Concierge. It brings residents together, gives them a voice, and provides a central place for building documents, events, discussions, and resident-to-resident commerce. It is composed of five sub-modules plus two supporting features:

| Sub-module | Purpose |
|------------|---------|
| **Classified Ads** | Resident marketplace for buying, selling, giving away, and requesting items within the building |
| **Idea Board** | Crowdsourced suggestion system where residents propose ideas and vote on them |
| **Community Events** | Event calendar with RSVP, event creation, and attendance tracking |
| **Document Library** | Categorized file storage for building documents, forms, rules, and notices |
| **Discussion Forum** | Threaded conversations organized by topic for resident-to-resident dialogue |
| **Surveys / Polls** | Management-created questionnaires distributed to residents with response analytics |
| **Photo Albums** | Shared photo galleries for building events, renovations, and community moments |

### Why This Module Exists

Industry research revealed a clear gap: most building management platforms treat community engagement as an afterthought -- a forum tacked onto a package tracker, or a document library with no search. Residents who feel disconnected from their building are less likely to follow rules, attend meetings, or report issues early.

Concierge treats community as a first-class module because engaged residents make every other module work better.

### Design Philosophy

- **Resident-first**: Unlike operational modules (Security Console, Maintenance), Community is designed primarily for residents. Staff moderate and manage; residents create, browse, and participate.
- **AI-moderated**: Every piece of user-generated content passes through AI moderation before publication. The AI flags problems; human moderators make final decisions.
- **Progressive disclosure**: The default view is simple -- a feed of recent activity. Advanced features (voting analytics, export, bulk moderation) reveal on demand.
- **One primary action per screen**: The Classified Ads listing page has one CTA ("Post an Ad"). The Idea Board has one CTA ("Submit an Idea"). No competing buttons.

---

## 2. Research Summary

### Key Findings from Competitive Analysis

| Finding | Source | Impact on Concierge |
|---------|--------|---------------------|
| Classified ads built on a forum engine exposes implementation details in URLs and breadcrumbs | Industry research | Build Classified Ads as a standalone module with its own data model -- not a forum overlay |
| No category or status filtering on classified ads (no "For Sale" vs "Free" vs "Wanted") | Industry research | Implement structured categories and lifecycle statuses (Available, Sold, Expired) |
| Two-image upload limit is insufficient for furniture and appliance listings | Industry research | Support up to 8 images per classified ad with drag-and-drop reordering |
| Community events lack RSVP, attendance tracking, and capacity limits | Industry research | Build full RSVP workflow with waitlist support and attendance confirmation |
| No event creation capability for front desk / concierge roles | Industry research | Allow Front Desk to create internal calendar events |
| Document library limited to single-level folder hierarchy with no file preview | Industry research | Support nested folders (up to 3 levels) with inline PDF preview and image thumbnails |
| No file size or upload date displayed in document listings | Industry research | Show file size, upload date, uploader name, and download count on every file |
| Events never automatically transition from Active to Past status | Industry research | Auto-transition event status when end date passes |
| Idea board exists as a help-menu feature, not a dedicated module | Industry research | Promote Idea Board to a full sub-module with voting, status tracking, and admin response |
| Surveys lack question variety beyond multiple choice | Industry research | Support 6 question types: multiple choice, checkbox, rating scale, free text, ranking, and yes/no |
| Approval workflow for classified ads requires 2 business days with no notification to the submitter | Industry research | Notify residents on submission, approval, and rejection within the platform |

### What We Steal (Best Patterns Observed)

1. **Auto-expiry on classified ads** -- 30-day default prevents stale listings
2. **Dual calendar system** -- Internal (staff) and public (resident) event calendars with color coding
3. **Follow / subscribe on community content** -- Users opt into notifications for threads they care about
4. **Rich text editor for posts** -- Full formatting without complexity
5. **Folder descriptions with access restrictions** -- Each document folder explains its purpose and who can see it
6. **Recent Uploads section** -- 30-day window for newly added documents on the library landing page
7. **Role-based folder permissions** -- Read vs Read-Write per role group

### What We Fix (Mistakes Observed)

1. **No grid/card view for classified ads** -- Table-only layout is wrong for visual commerce. We use card grid with prominent images.
2. **Forum terminology leaking into classifieds UI** -- "List Forums" in breadcrumbs. We use clean, purpose-specific language.
3. **No structured contact field on ads** -- Sellers must embed contact info in description. We add structured contact preference fields.
4. **Date fields showing seconds precision** -- "4/15/2023 9:00:00 AM" for an event. We display human-friendly dates ("Apr 15, 2023 at 9:00 AM").
5. **Empty states with no guidance** -- "No records found" with no next step. We show helpful empty states with clear CTAs.
6. **No version history on documents** -- Files overwrite without audit trail. We track every version.

---

## 3. Feature Spec

### 3.1 Classified Ads

#### 3.1.1 Ad Listing Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Card grid layout | Ads displayed as visual cards with thumbnail, title, price, and status badge | Cards show image (or placeholder icon if no image), title (truncated at 60 chars), price or "Free" or "Negotiable", and time since posted |
| List view toggle | Switch between card grid and compact list view | Toggle persists in user preferences. List view shows: thumbnail (40x40), title, category, price, date posted, status |
| Category filter | Filter ads by category | Dropdown with "All Categories" default. Updates results without page reload. Count badge per category |
| Status filter | Filter by Available, Sold, Expired | Dropdown. Default: "Available". Staff/Admin can see all statuses. Residents see only Available by default |
| Search | Full-text search across title and description | Minimum 2 characters. Debounced 300ms. Highlights matching text in results. Searches title, description, and seller name |
| Sort options | Sort by newest, oldest, price low-to-high, price high-to-low | Default: newest first. Sort persists during session |
| Post an Ad button | Primary CTA to create a new classified ad | Visible to all residents. Opens create form. Button text: "Post an Ad" |
| Pagination | Paginated results with page size selector | Default: 20 per page. Options: 20, 40, 60. Show total count ("Showing 1-20 of 47 ads") |
| My Ads tab | View only ads posted by the logged-in user | Shows all statuses including Sold and Expired. Allows edit and delete actions |

#### 3.1.2 Create / Edit Ad Form

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `title` | Title | text | Yes | 120 chars | Empty | Min 5 chars, no URLs in title | "Title must be between 5 and 120 characters" / "URLs are not allowed in the title" |
| `category_id` | Category | select | Yes | -- | "For Sale" | Must select from predefined list | "Please select a category" |
| `description` | Description | rich text (Markdown) | Yes | 4,000 chars | Empty | Min 20 chars | "Description must be at least 20 characters" |
| `price` | Price | number | No | 8 digits | Empty | Non-negative, max 99999.99. Two decimal places | "Price must be a positive number under $100,000" |
| `price_type` | Price Type | radio | Yes | -- | "Fixed Price" | One must be selected | -- |
| `condition` | Condition | select | No | -- | "Used - Good" | Must be from predefined list | "Please select a condition" |
| `images` | Photos | file upload (multi) | No | 8 files, 5MB each | Empty | JPG, PNG, HEIC, WebP only. Min 400x400px | "Each photo must be JPG, PNG, HEIC, or WebP and under 5MB" |
| `contact_method` | Preferred Contact | checkbox group | Yes | -- | "In-App Message" | At least one selected | "Select at least one contact method" |
| `contact_phone` | Phone | tel | Conditional | 20 chars | Empty | Required if "Phone" contact method selected. Valid phone format | "Please enter a valid phone number" |
| `contact_email` | Email | email | Conditional | 254 chars | User's email | Required if "Email" contact method selected. Valid email format | "Please enter a valid email address" |
| `expiration_date` | Expires On | date | No | -- | Today + 30 days | Must be future date, max 90 days from today | "Expiration date must be within the next 90 days" |

**Price Type options**: Fixed Price, Negotiable, Free, Contact for Price

**Condition options**: New, Like New, Used - Good, Used - Fair, Not Applicable

**Contact Method options**: In-App Message (always available), Phone, Email

**Category options** (admin-configurable, system defaults):

| Category | Icon | Description |
|----------|------|-------------|
| For Sale | tag | General items for sale |
| Furniture | couch | Furniture and home decor |
| Electronics | monitor | Electronics and gadgets |
| Appliances | refrigerator | Kitchen and home appliances |
| Clothing | shirt | Clothing and accessories |
| Free Stuff | gift | Items being given away |
| Wanted | search | Items a resident is looking for |
| Services | wrench | Services offered (dog walking, tutoring, etc.) |
| Carpool / Ride Share | car | Transportation sharing |
| Other | box | Anything that does not fit above |

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Submit | "Post Ad" | Submits ad for moderation (or publishes if auto-approve is on) | Spinner + "Posting..." | Redirect to ad detail page with success toast: "Your ad has been posted and is pending review" (or "Your ad is now live" if auto-approved) | Inline error summary at top of form. Fields with errors highlighted in red. Form not cleared |
| Save Draft | "Save as Draft" | Saves without submitting | Spinner + "Saving..." | Toast: "Draft saved" | Toast: "Could not save draft. Please try again" |
| Cancel | "Cancel" | Returns to listing page | -- | Navigate to listing. If form has changes, confirm dialog: "You have unsaved changes. Discard?" | -- |

**AI Integration on this form**:
- **Category Suggestion** (AI #69): After user types title + description, a chip appears below the Category dropdown: "Suggested: Furniture" with an "Apply" button. Tooltip: "Our system analyzed your description to suggest the best category."
- **Price Suggestion** (AI, new): If category and condition are selected, a subtle hint appears below the price field: "Similar items typically sell for $50-$120." Tooltip: "Based on similar listings in your building and area."
- **Content Moderation** (AI #68): On submit, content is scanned. If flagged, the ad enters moderation queue with flag reason. If clean and auto-approve is enabled, ad publishes immediately.

#### 3.1.3 Ad Detail Page

| Element | Description |
|---------|-------------|
| Image carousel | Up to 8 images with thumbnail strip below. Click to enlarge (lightbox). Swipe on mobile. If no images, show category icon placeholder |
| Title | Full title, left-aligned, heading level 2 |
| Price badge | Large price display with price type label. "$75 - Negotiable" or "Free" or "Contact for Price" |
| Condition badge | Small badge next to price: "Used - Good" |
| Status badge | "Available" (green), "Sold" (gray), "Expired" (amber) |
| Category | Category name with icon |
| Description | Full rich text description |
| Posted by | Seller's display name (unit number hidden from non-staff). "Posted 3 days ago" relative timestamp |
| Contact section | Shows contact methods the seller selected. "Send Message" button for in-app messaging. Phone and email shown only if seller enabled them |
| Similar Ads | AI-powered "You might also like" section showing 3 related active ads. Falls back to most recent ads in same category if AI disabled |
| Actions (seller) | "Edit", "Mark as Sold", "Delete" buttons. "Mark as Sold" is primary action for seller's own active ad |
| Actions (moderator) | "Remove" with reason required. "Flag for Review" to escalate |
| Comments section | Threaded comments for questions and negotiation. Max depth: 2 levels. Rich text not supported in comments (plain text only, 500 char max) |

#### 3.1.4 Ad Lifecycle

```
Draft --> Pending Review --> Active (Available) --> Sold
                |                    |                |
                v                    v                v
            Rejected             Expired          Archived (30 days after Sold)
                |
                v
         Edited & Resubmitted --> Pending Review
```

- **Auto-expiry**: Ads expire on their expiration_date. System sends reminder notification 3 days before expiry: "Your ad '[title]' expires in 3 days. Renew it?"
- **Renewal**: Expired ads can be renewed (extends expiration by 30 days, max 2 renewals). After 2 renewals, must create a new ad.
- **Auto-archive**: Sold and Expired ads are archived (hidden from public listing) after 30 days. Archived ads remain visible to the seller in "My Ads".

### 3.2 Idea Board

#### 3.2.1 Idea Listing Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Idea cards | Cards showing title, description preview (120 chars), vote count, comment count, status badge, and submitter name | Cards sorted by vote count (most popular first) by default |
| Status filter | Filter by status: All, Open, Under Review, Planned, In Progress, Completed, Declined | Default: "All" (excludes Declined). Declined visible only if explicitly selected |
| Category filter | Filter by category (admin-defined) | Categories like: Building Amenities, Services, Rules & Policies, Technology, Social, Safety, Other |
| Sort options | Sort by: Most Votes, Newest, Most Discussed, Trending | "Trending" uses a time-weighted vote algorithm (recent votes count more). Default: Most Votes |
| Submit an Idea button | Primary CTA | Opens create form. Visible to all residents |
| Vote button | Upvote an idea | Each user gets 1 vote per idea. Toggle: click again to remove vote. Vote count updates in real-time. Users cannot vote on their own ideas |
| Search | Search ideas by keyword | Searches title and description |

#### 3.2.2 Create Idea Form

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `title` | What is your idea? | text | Yes | 150 chars | Empty | Min 10 chars | "Please describe your idea in at least 10 characters" |
| `description` | Tell us more | textarea | Yes | 2,000 chars | Empty | Min 30 chars | "Please provide at least 30 characters of detail" |
| `category_id` | Category | select | Yes | -- | Empty | Must select | "Please select a category" |
| `attachments` | Attachments | file upload | No | 3 files, 5MB each | Empty | JPG, PNG, PDF only | "Files must be JPG, PNG, or PDF and under 5MB each" |

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Submit | "Submit Idea" | Creates idea and triggers AI deduplication check | Spinner + "Submitting..." | Redirect to idea detail. Toast: "Your idea has been submitted!" | Inline errors on form |
| Cancel | "Cancel" | Returns to listing | -- | Navigate back | -- |

**AI Integration**:
- **Idea Deduplication** (AI #70 extended): On submit, AI compares the new idea against all Open/Under Review/Planned ideas. If a similar idea exists (>80% semantic similarity), a dialog appears: "A similar idea already exists: '[Similar Idea Title]' (42 votes). Would you like to vote for it instead, or submit yours as a separate idea?" Options: "Vote for Existing" (navigates to that idea and auto-votes), "Submit Anyway" (proceeds with submission).
- **Content Moderation** (AI #68): Idea text scanned for inappropriate content before publishing.

#### 3.2.3 Idea Detail Page

| Element | Description |
|---------|-------------|
| Title | Full title, heading level 2 |
| Description | Full text with any attachments shown below |
| Status badge | Open (blue), Under Review (amber), Planned (purple), In Progress (teal), Completed (green), Declined (gray) |
| Vote section | Large vote button with count. "42 residents support this idea" |
| Admin response | Colored banner showing official response from management. Timestamp and responder name. Only visible when management has responded |
| Status timeline | Visual timeline showing status transitions with dates: "Open (Mar 1) > Under Review (Mar 5) > Planned (Mar 12)" |
| Comments | Threaded discussion. Max depth: 3 levels. Plain text, 1,000 char max per comment |
| Submitted by | Submitter's display name and date |

#### 3.2.4 Admin Actions on Ideas

| Action | Description | Who Can Do It |
|--------|-------------|---------------|
| Change Status | Move idea through the lifecycle (Open > Under Review > Planned > In Progress > Completed or Declined) | Property Manager, Property Admin |
| Add Official Response | Post a highlighted management response visible to all | Property Manager, Property Admin |
| Merge Ideas | Combine two similar ideas. Votes merge. Comments merge. Submitters notified | Property Admin |
| Pin Idea | Pin to top of listing regardless of sort | Property Manager, Property Admin |
| Archive | Remove from active listing (completed or declined ideas auto-archive after 90 days) | Property Admin |

### 3.3 Community Events

#### 3.3.1 Event Calendar Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Calendar view | Month/Week/Day view using a calendar grid | Default: Month view. Current date highlighted. Events shown as color-coded blocks |
| List view | Chronological event list with details | Toggle between Calendar and List. List shows: title, date/time, location, RSVP count, status badge |
| Calendar types | Internal (staff) and Public (resident) calendars | Color-coded: Internal = orange, Public = blue. Toggle checkboxes to show/hide each calendar type. Staff see both; residents see only Public |
| Create Event button | Opens create event form | Visible to: Property Manager, Property Admin, Front Desk (internal only). Residents can request events (goes through approval) |
| Quick date navigation | Today button, month/week/day toggle, prev/next arrows | "Today" returns to current date. Arrows navigate in the selected view increment |
| Event detail on click | Click an event to see full details | Opens detail panel (side sheet on desktop, full page on mobile) |
| RSVP indicators | Show RSVP count on calendar blocks | "12/50 going" shown on event block if capacity is set |
| Print calendar | Export current calendar view | Generates a formatted PDF of the displayed month/week/day |

#### 3.3.2 Create / Edit Event Form

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `title` | Event Title | text | Yes | 200 chars | Empty | Min 3 chars | "Event title must be at least 3 characters" |
| `description` | Description | rich text (Markdown) | No | 5,000 chars | Empty | -- | -- |
| `start_datetime` | Starts | datetime | Yes | -- | Tomorrow at 10:00 AM | Must be future (for new events) | "Start date must be in the future" |
| `end_datetime` | Ends | datetime | Yes | -- | Tomorrow at 11:00 AM | Must be after start. Max duration: 14 days | "End time must be after start time" / "Events cannot exceed 14 days" |
| `location` | Location | text | No | 200 chars | Empty | -- | -- |
| `location_type` | Location Type | radio | Yes | -- | "On-Site" | -- | -- |
| `calendar_type` | Calendar | radio | Yes | -- | "Public" | Staff-created: Public or Internal. Resident-requested: always Public | -- |
| `recurrence` | Repeat | select | No | -- | "Does Not Repeat" | -- | -- |
| `capacity` | Capacity | number | No | 5 digits | Empty (unlimited) | Min 1, max 99999 | "Capacity must be at least 1" |
| `rsvp_enabled` | Enable RSVP | toggle | No | -- | true | -- | -- |
| `rsvp_deadline` | RSVP Deadline | datetime | Conditional | -- | 24 hours before start | Required if RSVP enabled. Must be before start | "RSVP deadline must be before the event start time" |
| `cover_image` | Cover Image | file upload | No | 1 file, 5MB | Empty | JPG, PNG, WebP | "Image must be JPG, PNG, or WebP and under 5MB" |
| `attachments` | Attachments | file upload (multi) | No | 5 files, 10MB each | Empty | PDF, DOC, DOCX, JPG, PNG | "Files must be under 10MB each" |
| `notify_residents` | Send Notification | toggle | No | -- | false | -- | -- |
| `target_groups` | Notify Groups | checkbox group | Conditional | -- | All Residents | Required if notify_residents is true | "Select at least one group to notify" |
| `guard_required` | Security Guard Required | toggle | No | -- | false | Visible to staff only | -- |

**Location Type options**: On-Site, Off-Site, Virtual (shows URL field when selected), Hybrid (shows URL field + location)

**Recurrence options**: Does Not Repeat, Daily, Weekly, Bi-Weekly, Monthly, Custom (opens recurrence builder)

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Publish | "Publish Event" | Creates and publishes the event | Spinner + "Publishing..." | Redirect to event detail. Toast: "Event published." If notify_residents is on, sends notifications | Inline form errors |
| Save Draft | "Save as Draft" | Saves without publishing | Spinner + "Saving..." | Toast: "Draft saved" | Toast: "Could not save" |
| Cancel | "Cancel" | Returns to calendar | -- | Discard confirmation if form has changes | -- |

#### 3.3.3 Event Detail Page

| Element | Description |
|---------|-------------|
| Cover image | Full-width hero image (or gradient placeholder with event icon if none) |
| Title | Heading level 2 |
| Date/Time | Formatted: "Saturday, March 15, 2026 -- 10:00 AM to 12:00 PM". If recurring: "Repeats monthly" label |
| Location | Address or "Virtual" with clickable meeting link. Map embed for on-site locations (optional) |
| Status | Active (green), Cancelled (red), Completed (gray), Draft (amber) |
| Description | Full rich text |
| RSVP section | "Going" / "Maybe" / "Not Going" buttons. Shows count: "23 going, 5 maybe". If capacity set: "23/50 spots filled". If full: "Waitlist" button replaces "Going" |
| Attendee list | Expandable list of RSVPs. Visible to event creator and staff. Shows name and RSVP status |
| Attachments | Downloadable files with filename, size, and type icon |
| Comments | Discussion section for event-related questions. Plain text, 500 chars max, 2-level threading |
| Calendar badge | "Public Event" (blue) or "Internal" (orange) |
| Share | "Add to Calendar" button generating .ics file download |

#### 3.3.4 Event Lifecycle

```
Draft --> Published (Active) --> In Progress --> Completed
              |                                      |
              v                                      v
          Cancelled                              Archived (90 days)
```

- **Auto-transition**: Events automatically move from Active to In Progress when start_datetime is reached, and from In Progress to Completed when end_datetime passes.
- **Auto-archive**: Completed and Cancelled events archive after 90 days (hidden from default calendar view, accessible via "Show Archived" filter).
- **Cancellation**: Cancelling a published event triggers notification to all RSVP'd attendees.

### 3.4 Document Library

#### 3.4.1 Library Landing Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Folder tree | Left sidebar with hierarchical folder navigation (up to 3 levels deep) | Root "Building Documents" with nested folders. Current folder highlighted. Expand/collapse arrows on folders with children |
| File listing | Right panel showing files in selected folder | Columns: File icon, Name, Size, Uploaded (date), Uploaded By, Downloads. Sortable by each column |
| Recent Uploads | Top section on landing showing files uploaded in the last 30 days | Max 10 files shown. "View All Recent" link to full list. Hidden if empty |
| Search | Global file search across all folders | Searches file name and description. Results show folder path. Min 2 characters |
| File type filter | Filter by document type | Options: All Types, Documents (PDF, DOC, DOCX, TXT), Spreadsheets (XLS, XLSX, CSV), Images (JPG, PNG), Presentations (PPT, PPTX), Other |
| Storage usage | Statistics bar showing used vs available storage | "23 files -- 45.2 MB used of 500 MB". Progress bar with color change at 80% (amber) and 95% (red). Visible to staff only |
| Create Folder button | Creates a new folder | Visible to: Property Manager, Property Admin. Inline folder name input on click |
| Upload Files button | Upload one or more files to the current folder | Visible based on folder permissions. Opens file picker or drag-and-drop zone |

#### 3.4.2 Upload File Form

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `files` | Files | file upload (multi) | Yes | 10 files per upload, 25MB each | Empty | Allowed types: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT, RTF, JPG, JPEG, PNG, GIF, MP4, MOV, MP3, WAV, ZIP | "File type not allowed. Accepted types: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT, RTF, JPG, PNG, GIF, MP4, MOV, MP3, WAV, ZIP" / "Each file must be under 25MB" |
| `description` | Description | text | No | 500 chars | Empty | -- | -- |
| `notify_on_upload` | Notify residents | toggle | No | -- | false | -- | -- |

**Upload behavior**:
- Drag-and-drop zone: "Drop files here or click to browse". Shows file list with individual progress bars during upload.
- Duplicate detection: If a file with the same name exists in the folder, prompt: "A file named '[name]' already exists. Replace it (previous version saved) or rename?"
- Version tracking: Replacing a file creates a new version. Previous versions accessible via "Version History" on the file detail.

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Upload | "Upload" | Uploads all selected files | Per-file progress bars + overall "Uploading 3 of 5..." | Toast: "5 files uploaded successfully" | Per-file error indicators. Successfully uploaded files remain. Failed files show retry option |
| Cancel | "Cancel" | Aborts upload and closes form | Confirms if upload in progress | Returns to file listing | -- |

#### 3.4.3 Folder Management

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `folder_name` | Folder Name | text | Yes | 100 chars | Empty | Min 2 chars. No special characters except hyphens and spaces. Unique within parent folder | "Folder name must be 2-100 characters" / "A folder with this name already exists" |
| `description` | Description | text | No | 300 chars | Empty | -- | -- |
| `parent_folder_id` | Location | select | Yes | -- | Current folder | Must be a valid folder the user has write access to | "You do not have permission to create folders here" |

**Folder Permissions** (set per folder):

| Permission | Description | Default |
|------------|-------------|---------|
| Read | Can view and download files | All authenticated roles |
| Write | Can upload and replace files | Property Manager, Property Admin |
| Delete | Can delete files | Property Admin |
| Manage | Can rename folder, change permissions, delete folder | Property Admin |

Role-level defaults are configurable by Property Admin. Permissions can be set per individual role group (matching the 14 role groups defined in 02-Roles and Permissions).

#### 3.4.4 File Detail View

| Element | Description |
|---------|-------------|
| File preview | Inline preview for PDF (embedded viewer), images (full-size), and text files. Other types show file icon with download button |
| File name | Heading level 3 with file type icon |
| Description | File description if provided |
| Metadata | File size, type, uploaded by, uploaded date, download count, folder path (breadcrumb) |
| Version history | Expandable list of previous versions with date, uploader, and download link. Current version highlighted |
| Download button | Primary action. Downloads current version. Increments download counter |
| Actions (with permission) | "Replace" (upload new version), "Move" (to another folder), "Rename", "Delete" (with confirmation: "This will permanently delete the file and all its versions. This cannot be undone.") |

### 3.5 Discussion Forum

#### 3.5.1 Forum Landing Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Topic list | Categorized discussion topics | Shows: category, topic title (link), reply count, view count, last activity timestamp, last commenter avatar |
| Category tabs | Filter topics by category | Admin-defined categories. Default: General, Building Life, Buy/Sell/Trade, Lost & Found, Recommendations, Off-Topic |
| Pinned topics | Admin-pinned topics always at top | Max 3 pinned topics per category. Visual pin icon indicator |
| New Topic button | Create a new discussion topic | Visible to all residents. "Start a Discussion" |
| Sort | Sort by Most Recent, Most Active, Most Views | Default: Most Recent (by last activity, not creation date) |
| Search | Search topic titles and content | Full-text search across all categories |

#### 3.5.2 Create Topic Form

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `title` | Topic Title | text | Yes | 200 chars | Empty | Min 5 chars | "Title must be at least 5 characters" |
| `category_id` | Category | select | Yes | -- | "General" | Must select | "Please select a category" |
| `body` | Your Post | rich text (Markdown) | Yes | 10,000 chars | Empty | Min 20 chars | "Post must be at least 20 characters" |
| `attachments` | Attachments | file upload | No | 5 files, 5MB each | Empty | JPG, PNG, PDF, GIF | "Files must be JPG, PNG, PDF, or GIF and under 5MB each" |

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Post | "Post Discussion" | Creates topic, triggers moderation | Spinner + "Posting..." | Redirect to topic page. Toast: "Discussion posted" | Form errors shown inline |
| Preview | "Preview" | Shows rendered preview of post | -- | Preview panel appears below form | -- |
| Cancel | "Cancel" | Returns to forum landing | Discard confirmation if form has content | Navigate back | -- |

#### 3.5.3 Topic Detail Page

| Element | Description |
|---------|-------------|
| Topic title | Heading level 2, with category badge |
| Original post | Full rich text with attachments, posted by name, timestamp, edit history indicator |
| Reply thread | Threaded replies up to 3 levels deep. Each reply: author name, avatar, timestamp, content (plain text or Markdown, 5,000 chars), like count, reply button |
| Reply box | Text area at bottom of thread. Rich text (Markdown). "Reply" button. 5,000 char max |
| Follow toggle | "Follow" button to receive notifications on new replies | Toggle on/off. Followers notified on new replies. Auto-follow when you reply |
| Like button | Heart icon on each reply | Toggle like/unlike. Shows count. Users cannot like their own replies |
| Report button | Flag a post or reply for moderator review | Opens report reason modal with predefined reasons: Spam, Inappropriate, Harassment, Off-Topic, Other (free text) |
| Topic actions (author) | Edit (within 30 minutes of posting), Delete (soft delete, content replaced with "[Deleted by author]") |
| Topic actions (moderator) | Lock (prevent new replies), Pin, Move (to different category), Delete (hard delete with reason), Ban user from forum |

**AI Integration**:
- **Discussion Summarization**: On topics with 20+ replies, a "Summarize Discussion" button appears at the top. AI generates a 2-3 sentence summary of the key points and consensus. Tooltip: "AI-generated summary of this discussion." Falls back to hidden if AI is disabled.

#### 3.5.4 Moderation Queue

| Feature | Description | Who Can Access |
|---------|-------------|----------------|
| Flagged content list | All AI-flagged and user-reported content in one queue | Property Manager, Property Admin |
| Bulk actions | Approve, Remove, or Warn on multiple items | Property Manager, Property Admin |
| Violation types | Categories: Spam, Inappropriate Language, Personal Information Shared, Harassment, Off-Topic, Policy Violation | -- |
| User history | View a user's moderation history (warnings, removals) from the queue | Property Admin |
| Auto-hide threshold | Content with 3+ user reports is auto-hidden pending review | Configurable by Property Admin (threshold: 1-10) |

### 3.6 Surveys / Polls

#### 3.6.1 Survey Listing Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Survey cards | Each survey shown as a card with title, status, response count, and expiry date | Cards show: title, status badge, "X responses from Y units", expiry date, created by, "View Results" / "Take Survey" button based on role and completion |
| Status filter | Filter by Active, Expired, Draft | Default: Active |
| Create Survey button | Opens survey builder | Visible to: Property Manager, Property Admin |

#### 3.6.2 Create Survey Form

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `title` | Survey Title | text | Yes | 200 chars | Empty | Min 5 chars | "Survey title must be at least 5 characters" |
| `description` | Description | textarea | No | 500 chars | Empty | -- | -- |
| `expiry_date` | Expiry Date | date | No | -- | Today + 14 days | Must be future | "Expiry date must be in the future" |
| `visible_to_owners` | Visible to Owners | toggle | No | -- | true | -- | -- |
| `visible_to_tenants` | Visible to Tenants | toggle | No | -- | true | -- | -- |
| `anonymous` | Anonymous Responses | toggle | No | -- | false | -- | -- |
| `questions` | Questions | question builder | Yes | 30 questions max | 1 empty question | At least 1 question | "Add at least one question" |

**Question Types**:

| Type | Description | Options |
|------|-------------|---------|
| Multiple Choice | Single answer from options | 2-10 options. "Add Option" button. "Other" toggle adds free-text option |
| Checkbox | Multiple answers from options | 2-10 options. Optional min/max selections |
| Rating Scale | 1-5 or 1-10 star/number rating | Scale range configurable. Optional label for low/high ends |
| Free Text | Open-ended text response | Max 2,000 chars. Optional "Short answer" toggle (200 chars) |
| Ranking | Drag to rank options in order | 2-8 options |
| Yes / No | Simple binary choice | No configuration needed |

Each question has: question text (required, 500 chars max), type (required), required toggle (default: false), and type-specific options.

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Publish | "Publish Survey" | Creates and distributes survey | Spinner + "Publishing..." | Redirect to survey detail with results view. Toast: "Survey published and sent to residents" | Form errors inline |
| Save Draft | "Save as Draft" | Saves without distributing | Spinner + "Saving..." | Toast: "Draft saved" | Toast: "Could not save" |
| Preview | "Preview" | Shows survey as residents will see it | -- | Preview modal opens | -- |
| Cancel | "Cancel" | Returns to listing | Confirm if form has content | Navigate back | -- |

#### 3.6.3 Survey Results View

| Element | Description |
|---------|-------------|
| Response rate | "32 of 171 units responded (18.7%)" with progress bar |
| Per-question results | Charts per question type: bar chart for multiple choice/checkbox, average + distribution for rating, word cloud for free text, ranked list for ranking |
| Individual responses | Expandable table of all responses (hidden if survey is anonymous). Columns: unit number, respondent name, submitted date, response per question |
| Export | "Export Results" button with format options: CSV, PDF, Excel. CSV includes all response data; PDF includes charts |
| Close survey | "Close Survey" button ends collection early. Confirmation: "This will stop accepting responses. Continue?" |

### 3.7 Photo Albums

#### 3.7.1 Album Listing Page

| Feature | Description | Acceptance Criteria |
|---------|-------------|---------------------|
| Album grid | Albums displayed as cards with cover photo, title, photo count, and date | 3 columns on desktop, 2 on tablet, 1 on mobile |
| Create Album button | Creates a new photo album | Visible to: Property Manager, Property Admin, Front Desk |
| View permissions | Albums can be set to Public (all residents) or Internal (staff only) | Visibility badge on album card |

#### 3.7.2 Create / Edit Album

| Field | Label | Type | Required | Max Length | Default | Validation | Error Message |
|-------|-------|------|----------|------------|---------|------------|---------------|
| `title` | Album Title | text | Yes | 100 chars | Empty | Min 3 chars | "Album title must be at least 3 characters" |
| `description` | Description | textarea | No | 300 chars | Empty | -- | -- |
| `visibility` | Visibility | radio | Yes | -- | "Public" | -- | -- |
| `photos` | Photos | file upload (multi) | No | 50 per upload, 10MB each | Empty | JPG, PNG, HEIC, WebP | "Photos must be JPG, PNG, HEIC, or WebP and under 10MB each" |
| `cover_photo` | Cover Photo | select from uploaded | No | -- | First uploaded photo | -- | -- |

**Buttons**:

| Button | Label | Action | Loading State | Success State | Failure State |
|--------|-------|--------|---------------|---------------|---------------|
| Create | "Create Album" | Creates album and uploads photos | Per-photo progress bars | Redirect to album view. Toast: "Album created with X photos" | Error on failed uploads with retry |
| Cancel | "Cancel" | Returns to album listing | Confirm if photos selected | Navigate back | -- |

#### 3.7.3 Album View

| Element | Description |
|---------|-------------|
| Photo grid | Masonry or uniform grid of photos. Click to open lightbox with navigation arrows |
| Lightbox | Full-screen photo viewer with prev/next navigation, photo description, download button |
| Add Photos button | Upload additional photos to existing album (permissions required) |
| Photo actions | On hover: Download, Set as Cover, Delete (with confirmation). Delete only for uploader or admin |
| Album info | Title, description, photo count, created by, created date |

---

## 4. Data Model

### 4.1 Classified Ad

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `user_id` | UUID (FK) | Yes | -- | Auth context | Seller/poster |
| `title` | varchar | Yes | 120 | -- | Ad title |
| `description` | text | Yes | 4,000 | -- | Rich text body |
| `category_id` | UUID (FK) | Yes | -- | -- | Links to ClassifiedCategory |
| `price` | decimal(8,2) | No | -- | null | Price in dollars |
| `price_type` | enum | Yes | -- | 'fixed' | fixed, negotiable, free, contact |
| `condition` | enum | No | -- | null | new, like_new, good, fair, not_applicable |
| `contact_method` | varchar[] | Yes | -- | ['in_app'] | Array of: in_app, phone, email |
| `contact_phone` | varchar | No | 20 | null | Phone if enabled |
| `contact_email` | varchar | No | 254 | null | Email if enabled |
| `status` | enum | Yes | -- | 'pending_review' | draft, pending_review, active, sold, expired, rejected, archived |
| `expiration_date` | timestamp | No | -- | created_at + 30 days | When the ad auto-expires |
| `renewal_count` | integer | Yes | -- | 0 | Number of times renewed (max 2) |
| `rejection_reason` | text | No | 500 | null | Reason if rejected by moderator |
| `moderation_flags` | jsonb | No | -- | null | AI moderation output (flag type, severity, details) |
| `view_count` | integer | Yes | -- | 0 | Number of views |
| `created_at` | timestamp | Auto | -- | now() | Creation timestamp |
| `updated_at` | timestamp | Auto | -- | now() | Last update timestamp |

### 4.2 Classified Ad Image

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `ad_id` | UUID (FK) | Yes | Links to ClassifiedAd |
| `file_path` | varchar(500) | Yes | Storage path |
| `file_size` | integer | Yes | Size in bytes |
| `mime_type` | varchar(50) | Yes | MIME type |
| `sort_order` | integer | Yes | Display order (0-based) |
| `created_at` | timestamp | Auto | Upload timestamp |

### 4.3 Idea

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `user_id` | UUID (FK) | Yes | -- | Auth context | Submitter |
| `title` | varchar | Yes | 150 | -- | Idea title |
| `description` | text | Yes | 2,000 | -- | Detailed description |
| `category_id` | UUID (FK) | Yes | -- | -- | Links to IdeaCategory |
| `status` | enum | Yes | -- | 'open' | open, under_review, planned, in_progress, completed, declined |
| `admin_response` | text | No | 2,000 | null | Official management response |
| `admin_response_by` | UUID (FK) | No | -- | null | Staff who responded |
| `admin_response_at` | timestamp | No | -- | null | When response was posted |
| `vote_count` | integer | Yes | -- | 0 | Denormalized vote count |
| `is_pinned` | boolean | Yes | -- | false | Pinned to top of listing |
| `merged_into_id` | UUID (FK) | No | -- | null | If merged, points to surviving idea |
| `moderation_flags` | jsonb | No | -- | null | AI moderation output |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.4 Idea Vote

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `idea_id` | UUID (FK) | Yes | Links to Idea |
| `user_id` | UUID (FK) | Yes | Voter |
| `created_at` | timestamp | Auto | Vote timestamp |

Unique constraint on `(idea_id, user_id)` -- one vote per user per idea.

### 4.5 Community Event

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `created_by` | UUID (FK) | Yes | -- | Auth context | Event creator |
| `title` | varchar | Yes | 200 | -- | Event title |
| `description` | text | No | 5,000 | null | Rich text body |
| `start_datetime` | timestamp | Yes | -- | -- | Event start |
| `end_datetime` | timestamp | Yes | -- | -- | Event end |
| `location` | varchar | No | 200 | null | Location text |
| `location_type` | enum | Yes | -- | 'on_site' | on_site, off_site, virtual, hybrid |
| `virtual_url` | varchar | No | 500 | null | Meeting link for virtual/hybrid |
| `calendar_type` | enum | Yes | -- | 'public' | public, internal |
| `recurrence_rule` | varchar | No | 200 | null | iCal RRULE string |
| `capacity` | integer | No | -- | null | Max attendees (null = unlimited) |
| `rsvp_enabled` | boolean | Yes | -- | true | Whether RSVP is active |
| `rsvp_deadline` | timestamp | No | -- | null | RSVP cutoff time |
| `status` | enum | Yes | -- | 'draft' | draft, active, in_progress, completed, cancelled, archived |
| `cover_image_path` | varchar | No | 500 | null | Cover image storage path |
| `guard_required` | boolean | Yes | -- | false | Security guard needed |
| `notify_on_publish` | boolean | Yes | -- | false | Send notification when published |
| `target_groups` | varchar[] | No | -- | null | Which role groups to notify |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.6 Event RSVP

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `event_id` | UUID (FK) | Yes | Links to CommunityEvent |
| `user_id` | UUID (FK) | Yes | Attendee |
| `status` | enum | Yes | going, maybe, not_going, waitlisted |
| `created_at` | timestamp | Auto | -- |
| `updated_at` | timestamp | Auto | -- |

Unique constraint on `(event_id, user_id)`.

### 4.7 Library Folder

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `parent_folder_id` | UUID (FK) | No | -- | null | Parent folder (null = root) |
| `name` | varchar | Yes | 100 | -- | Folder name |
| `description` | varchar | No | 300 | null | Folder description |
| `sort_order` | integer | Yes | -- | 0 | Display order among siblings |
| `created_by` | UUID (FK) | Yes | -- | Auth context | Creator |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.8 Library File

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `folder_id` | UUID (FK) | Yes | -- | -- | Parent folder |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `file_name` | varchar | Yes | 255 | -- | Display name |
| `file_path` | varchar | Yes | 500 | -- | Storage path |
| `file_size` | bigint | Yes | -- | -- | Size in bytes |
| `mime_type` | varchar | Yes | 100 | -- | MIME type |
| `description` | varchar | No | 500 | null | File description |
| `version` | integer | Yes | -- | 1 | Current version number |
| `download_count` | integer | Yes | -- | 0 | Total downloads |
| `uploaded_by` | UUID (FK) | Yes | -- | Auth context | Uploader |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.9 Library File Version

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `file_id` | UUID (FK) | Yes | Links to LibraryFile |
| `version_number` | integer | Yes | Version (1, 2, 3...) |
| `file_path` | varchar(500) | Yes | Storage path for this version |
| `file_size` | bigint | Yes | Size of this version |
| `uploaded_by` | UUID (FK) | Yes | Who uploaded this version |
| `created_at` | timestamp | Auto | Upload timestamp |

### 4.10 Forum Topic

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `user_id` | UUID (FK) | Yes | -- | Auth context | Topic author |
| `category_id` | UUID (FK) | Yes | -- | -- | Links to ForumCategory |
| `title` | varchar | Yes | 200 | -- | Topic title |
| `body` | text | Yes | 10,000 | -- | Rich text content |
| `is_pinned` | boolean | Yes | -- | false | Pinned to top |
| `is_locked` | boolean | Yes | -- | false | Replies disabled |
| `status` | enum | Yes | -- | 'active' | active, hidden, deleted |
| `reply_count` | integer | Yes | -- | 0 | Denormalized reply count |
| `view_count` | integer | Yes | -- | 0 | View count |
| `last_activity_at` | timestamp | Yes | -- | created_at | Last reply or edit timestamp |
| `moderation_flags` | jsonb | No | -- | null | AI moderation output |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.11 Forum Reply

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `topic_id` | UUID (FK) | Yes | -- | -- | Parent topic |
| `parent_reply_id` | UUID (FK) | No | -- | null | Parent reply (for threading, max depth 3) |
| `user_id` | UUID (FK) | Yes | -- | Auth context | Reply author |
| `body` | text | Yes | 5,000 | -- | Reply content |
| `like_count` | integer | Yes | -- | 0 | Denormalized like count |
| `status` | enum | Yes | -- | 'active' | active, hidden, deleted_by_author, deleted_by_moderator |
| `moderation_flags` | jsonb | No | -- | null | AI moderation output |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.12 Survey

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `created_by` | UUID (FK) | Yes | -- | Auth context | Survey creator |
| `title` | varchar | Yes | 200 | -- | Survey title |
| `description` | text | No | 500 | null | Survey description |
| `status` | enum | Yes | -- | 'draft' | draft, active, closed, expired |
| `expiry_date` | timestamp | No | -- | created_at + 14 days | When survey stops accepting responses |
| `visible_to_owners` | boolean | Yes | -- | true | Visible to owner role |
| `visible_to_tenants` | boolean | Yes | -- | true | Visible to tenant role |
| `anonymous` | boolean | Yes | -- | false | Whether responses are anonymous |
| `response_count` | integer | Yes | -- | 0 | Denormalized response count |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.13 Survey Question

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `survey_id` | UUID (FK) | Yes | Parent survey |
| `sort_order` | integer | Yes | Display order |
| `question_text` | varchar(500) | Yes | Question text |
| `question_type` | enum | Yes | multiple_choice, checkbox, rating, free_text, ranking, yes_no |
| `is_required` | boolean | Yes | Whether response is required (default: false) |
| `options` | jsonb | No | Array of option objects for choice-based questions |
| `config` | jsonb | No | Type-specific configuration (scale range, max selections, etc.) |

### 4.14 Photo Album

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `property_id` | UUID (FK) | Yes | -- | Context | Links to property |
| `created_by` | UUID (FK) | Yes | -- | Auth context | Album creator |
| `title` | varchar | Yes | 100 | -- | Album title |
| `description` | varchar | No | 300 | null | Album description |
| `visibility` | enum | Yes | -- | 'public' | public, internal |
| `cover_photo_id` | UUID (FK) | No | -- | null | Cover photo |
| `photo_count` | integer | Yes | -- | 0 | Denormalized count |
| `created_at` | timestamp | Auto | -- | now() | -- |
| `updated_at` | timestamp | Auto | -- | now() | -- |

### 4.15 Community Comment

A shared comment entity used across Classified Ads, Ideas, Events, and Forum Topics (in addition to ForumReply for threaded forum discussions).

| Field | Type | Required | Max Length | Default | Description |
|-------|------|----------|------------|---------|-------------|
| `id` | UUID | Auto | -- | Generated | Primary key |
| `commentable_type` | varchar | Yes | 50 | -- | 'classified_ad', 'idea', 'event' |
| `commentable_id` | UUID | Yes | -- | -- | ID of the parent entity |
| `parent_comment_id` | UUID (FK) | No | -- | null | For threading (max depth varies by type) |
| `user_id` | UUID (FK) | Yes | -- | Auth context | Author |
| `body` | text | Yes | 1,000 | -- | Comment text (plain text) |
| `status` | enum | Yes | -- | 'active' | active, hidden, deleted |
| `moderation_flags` | jsonb | No | -- | null | AI moderation output |
| `created_at` | timestamp | Auto | -- | now() | -- |

---

## 5. User Flows

### 5.1 Resident Posts a Classified Ad

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Resident clicks "Post an Ad" on Classified Ads listing | Create Ad form opens |
| 2 | Fills in title and description | AI suggests category (chip appears below Category dropdown) |
| 3 | Selects category (or applies suggestion) | If category + condition selected, AI shows price suggestion below price field |
| 4 | Sets price and price type | -- |
| 5 | Uploads 1-4 photos | Photos appear as draggable thumbnails with reorder capability |
| 6 | Selects contact method (In-App Message) | -- |
| 7 | Clicks "Post Ad" | Loading: "Posting..." spinner. AI moderation runs (~1 sec). If clean: ad created with status = pending_review (or active if auto-approve on). Redirect to ad detail. Toast: "Your ad has been posted and is pending review." If flagged: ad enters moderation queue. User sees: "Your ad is being reviewed by management." |
| 8 | Moderator receives notification of pending ad | Moderation queue badge increments |
| 9 | Moderator approves or rejects | If approved: status changes to active, resident notified: "Your ad '[title]' is now live!" If rejected: status changes to rejected, resident notified with reason |

### 5.2 Resident Submits an Idea

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Resident clicks "Submit an Idea" on Idea Board | Create Idea form opens |
| 2 | Types title and description | -- |
| 3 | Selects category | -- |
| 4 | Clicks "Submit Idea" | AI deduplication check runs. If similar idea found (>80% match): dialog shows existing idea with vote count and options "Vote for Existing" or "Submit Anyway". If no duplicate: idea created with status = open. Redirect to idea detail. Toast: "Your idea has been submitted!" |
| 5 | Other residents browse Idea Board | See new idea in listing sorted by vote count |
| 6 | Residents vote on the idea | Vote count increments in real-time. Voter's button toggles to "Voted" |
| 7 | Property Manager reviews idea | Changes status to "Under Review". Admin response posted. Submitter notified |
| 8 | Idea progresses through statuses | Status timeline updates on detail page. Submitter notified at each transition |

### 5.3 Staff Creates a Community Event

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Property Manager clicks "Create Event" on calendar | Create Event form opens with tomorrow's date pre-filled |
| 2 | Fills in title, description, date/time, location | If "Virtual" or "Hybrid" location type selected, URL field appears |
| 3 | Sets capacity to 50, enables RSVP | RSVP deadline field appears, defaulting to 24 hours before start |
| 4 | Enables "Send Notification" and selects target groups | -- |
| 5 | Clicks "Publish Event" | Event created with status = active. Notification sent to selected groups via configured channels. Calendar updates in real-time for all users viewing it. Redirect to event detail |
| 6 | Residents view the event | See event on calendar and in list view. "Going" / "Maybe" / "Not Going" RSVP buttons visible |
| 7 | RSVP reaches capacity | "Going" button replaced with "Join Waitlist" for subsequent residents |
| 8 | Event start_datetime reached | Status auto-transitions to in_progress |
| 9 | Event end_datetime reached | Status auto-transitions to completed |

### 5.4 Property Manager Uploads Documents

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | PM navigates to Document Library | Landing page shows folder tree (left) and recent uploads (top right) |
| 2 | Clicks on "Forms" folder | File listing for Forms folder shown |
| 3 | Clicks "Upload Files" | Drag-and-drop zone opens |
| 4 | Drags 3 PDF files into the zone | Files appear in upload queue with individual progress bars |
| 5 | Adds description: "Updated 2026 forms" | -- |
| 6 | Enables "Notify residents" | -- |
| 7 | Clicks "Upload" | Files upload with progress indicators. If a file name matches existing: prompt to replace (version) or rename. On complete: toast "3 files uploaded successfully". Notification sent to residents with folder permissions |

### 5.5 Resident Takes a Survey

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Resident sees survey notification or clicks Surveys in Community | Active surveys listed. Survey card shows "Take Survey" button |
| 2 | Clicks "Take Survey" | Survey form opens with all questions rendered by type |
| 3 | Answers questions | Required questions validated. Rating scales show interactive stars/numbers |
| 4 | Clicks "Submit" | Loading: "Submitting...". Response saved. Toast: "Thank you for your response!" Button changes to "View Results" (if results are public) or "Submitted" (if private). Response count increments |

### 5.6 Moderator Reviews Flagged Content

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Moderator sees badge on Community > Moderation Queue | Queue shows count of items needing review |
| 2 | Opens moderation queue | List of flagged items with: content preview, flag type, flag source (AI or user report), severity, timestamp |
| 3 | Reviews a flagged classified ad | Full ad content shown in context with AI flag details: "Flagged for: inappropriate language. Severity: medium. Excerpt: '...'" |
| 4 | Clicks "Approve" (false positive) | Ad published/remains active. Item removed from queue. AI feedback logged for model improvement |
| 5 | Or clicks "Remove" | Reason required (select from list or free text). Ad hidden from public. Poster notified: "Your ad '[title]' was removed because: [reason]." Item removed from queue |

---

## 6. UI/UX

### 6.1 Navigation Placement

Community appears as a top-level sidebar item with expandable sub-items:

```
Community
  |-- Classified Ads
  |-- Idea Board
  |-- Events
  |-- Library
  |-- Forum
  |-- Surveys (staff/admin only in nav)
  |-- Photo Albums
```

**Role visibility**:

| Sub-module | Resident | Front Desk | Security | Property Manager | Board Member | Property Admin |
|------------|----------|------------|----------|-----------------|--------------|----------------|
| Classified Ads | View, Create | View, Moderate | View | View, Create, Moderate | View | Full |
| Idea Board | View, Vote, Create | View | View | View, Manage, Respond | View | Full |
| Events | View, RSVP | View, Create (Internal) | View | View, Create, Manage | View | Full |
| Library | View, Download | View, Download, Upload (if folder permits) | View, Download | View, Upload, Manage | View, Download | Full |
| Forum | View, Post, Reply | View, Moderate | View | View, Moderate | View | Full |
| Surveys | Take, View Results | View Results | -- | Create, Manage, View Results | View Results | Full |
| Photo Albums | View | View, Create, Upload | View | View, Create, Manage | View | Full |

### 6.2 Responsive Layout Rules

#### Desktop (1280px+)

| Sub-module | Layout |
|------------|--------|
| Classified Ads | 4-column card grid with sidebar filters |
| Idea Board | 2-column: idea cards (left 70%), voting panel (right 30%) |
| Events | Calendar fills main content area. Side sheet for event detail on click |
| Library | 2-column: folder tree sidebar (250px fixed) + file listing |
| Forum | Full-width topic list. Topic detail: full-width with nested replies |
| Surveys | Centered content (max-width 720px) for survey taking. Full-width table for results |
| Photo Albums | 4-column masonry grid |

#### Tablet (768px-1279px)

| Sub-module | Layout |
|------------|--------|
| Classified Ads | 3-column card grid. Filters collapse to top bar dropdowns |
| Idea Board | Single column. Vote button inline on each card |
| Events | Calendar (week view default). Event detail: full page |
| Library | Folder tree collapses to hamburger menu. File listing full width |
| Forum | Full-width. Reply indentation reduced to 1 level visually |
| Surveys | Same as desktop (already centered) |
| Photo Albums | 3-column grid |

#### Mobile (< 768px)

| Sub-module | Layout |
|------------|--------|
| Classified Ads | Single-column card stack. Filter icon opens bottom sheet |
| Idea Board | Single column. Swipe right to vote (gesture + tap fallback) |
| Events | List view default (calendar available via toggle). Full page detail |
| Library | Bottom-sheet folder picker. File list full width |
| Forum | Full-width. Flat reply display (threading indicated by indent bar, not nesting) |
| Surveys | Full-width. Questions stack vertically |
| Photo Albums | 2-column grid. Lightbox is native fullscreen |

### 6.3 Empty States

| Sub-module | Empty State Message | CTA |
|------------|--------------------|----|
| Classified Ads | "No ads posted yet. Be the first to list something!" | "Post an Ad" button |
| Classified Ads (My Ads) | "You haven't posted any ads yet." | "Post Your First Ad" button |
| Idea Board | "No ideas submitted yet. What would make this building better?" | "Submit an Idea" button |
| Events (Calendar) | "No upcoming events. Check back soon!" | "Create Event" button (staff only) |
| Events (Resident view) | "No upcoming events. Check back soon!" | -- (no CTA for residents) |
| Library (Folder) | "This folder is empty." | "Upload Files" button (if user has write permission) |
| Library (Search) | "No files match your search." | "Clear search" link |
| Forum | "No discussions yet. Start the conversation!" | "Start a Discussion" button |
| Forum (Category) | "No topics in this category yet." | "Start a Discussion" button |
| Surveys | "No active surveys." | "Create Survey" button (staff only) |
| Photo Albums | "No photo albums yet." | "Create Album" button (staff only) |

### 6.4 Loading States

| Context | Behavior |
|---------|----------|
| Page load | Skeleton cards/rows matching the expected layout. No spinner on initial load |
| Filter/search | Content area dims (opacity: 0.5) with small spinner overlay. Results replace within 300ms |
| File upload | Per-file progress bar (0-100%) with file name. Overall progress: "Uploading 2 of 5 files..." |
| Image loading in cards | Gray placeholder with subtle shimmer animation. Fade in on load |
| Vote action | Optimistic update: vote count changes instantly. If server rejects, reverts with subtle shake animation |
| RSVP action | Optimistic update: button changes state instantly. Count updates |

### 6.5 Error States

| Context | Behavior |
|---------|----------|
| Page load failure | "Something went wrong loading [module name]. Please try again." with "Retry" button |
| Form submission failure | Inline error messages on each invalid field. Error summary at top of form: "Please fix 3 errors below" |
| File upload failure | Failed file shown in red with error message ("File too large" / "Network error") and "Retry" button. Successfully uploaded files remain |
| Search failure | "Search is temporarily unavailable. Please try again in a moment." |
| Vote failure | Vote reverts. Toast: "Could not register your vote. Please try again." |
| AI feature failure | Feature degrades silently. No error shown to user. Category suggestion simply does not appear. Moderation falls back to manual queue |

### 6.6 Component Library Reference

All sub-modules use components from the Concierge design system (see DESIGN-SYSTEM.md):

| Component | Usage |
|-----------|-------|
| Card | Classified ads, idea cards, survey cards, album cards, event cards |
| DataTable | Forum topic list, file listing, survey results, moderation queue |
| Calendar | Community Events (FullCalendar-based with Concierge theming) |
| FileUpload | Classified ad images, library files, album photos, event attachments |
| RichTextEditor | Ad descriptions, event descriptions, forum posts (Markdown-based) |
| EmptyState | All empty states per sub-module (illustration + message + CTA) |
| Badge | Status badges, category badges, calendar type badges |
| Modal | Delete confirmations, report forms, RSVP detail, merge ideas dialog |
| BottomSheet | Mobile filters, mobile folder picker |
| Lightbox | Photo album viewer, classified ad image viewer |
| Tooltip | AI suggestion explanations, price hint sources, permission explanations |

---

## 7. AI Integration

Six AI capabilities are embedded in the Community module. All are defined in PRD 19 (AI Framework) under section 4.8.

### 7.1 Content Moderation (AI #68)

| Aspect | Detail |
|--------|--------|
| **What it does** | Scans all user-generated content (classified ads, ideas, forum posts, forum replies, comments, event descriptions submitted by residents) for inappropriate, offensive, or policy-violating material |
| **Trigger** | On content submit (before publish) |
| **Input** | Post text + images (if any). Property-specific content policy rules (configurable by admin) |
| **Output** | Flag (yes/no), violation type (spam, inappropriate_language, personal_info, harassment, policy_violation), severity (low, medium, high), flagged excerpt |
| **Model** | Haiku (fast, cost-effective for classification) |
| **Cost** | ~$0.001 per check |
| **Behavior when flagged** | Content enters moderation queue. User sees: "Your post is being reviewed." Moderator sees flag details in queue |
| **Graceful degradation** | If AI unavailable, content publishes normally. Manual moderation via user reports only |
| **Default state** | Enabled |
| **Admin control** | Toggle on/off per sub-module. Adjustable severity threshold (flag only "high" severity vs all). Custom blocked words list |
| **Tooltip** | (On moderation queue) "AI automatically reviews content for policy violations. You make the final decision." |

### 7.2 Spam Detection (AI #70 extended)

| Aspect | Detail |
|--------|--------|
| **What it does** | Identifies duplicate classified ads, repetitive forum posts, and bulk posting patterns that indicate spam |
| **Trigger** | On content submit |
| **Input** | New content + user's recent posting history (last 24 hours) + existing active content in same category |
| **Output** | Spam probability (0-1), spam type (duplicate, bulk_post, promotional, scam), similar content IDs |
| **Model** | Embeddings (similarity) + Haiku (classification) |
| **Cost** | ~$0.002 per check |
| **Behavior when detected** | If probability > 0.8: auto-block with notification to user. If 0.5-0.8: flag for moderator review. If < 0.5: pass |
| **Graceful degradation** | No spam detection. Rely on user reports and manual moderation |
| **Default state** | Enabled |

### 7.3 Category Suggestion (AI #69)

| Aspect | Detail |
|--------|--------|
| **What it does** | Suggests the best category for classified ads based on title and description |
| **Trigger** | After user types title + description (debounced 1 second after typing stops) |
| **Input** | Ad title + description text |
| **Output** | Suggested category ID + confidence score. If confidence > 0.7, suggestion shown |
| **Model** | Haiku |
| **Cost** | ~$0.001 per suggestion |
| **UI** | Chip below Category dropdown: "Suggested: [Category]" with "Apply" button. Disappears if user manually selects a category |
| **Graceful degradation** | No suggestion shown. User selects category manually |
| **Default state** | Enabled |
| **Tooltip** | "Our system analyzed your description to suggest the best category." |

### 7.4 Price Suggestion (Community-specific, extends AI #69)

| Aspect | Detail |
|--------|--------|
| **What it does** | Suggests a price range for classified ads based on category, condition, and description |
| **Trigger** | After category and condition are both selected |
| **Input** | Category + condition + title + description + historical pricing data from same property |
| **Output** | Price range (min-max) based on similar past listings |
| **Model** | Haiku |
| **Cost** | ~$0.001 per suggestion |
| **UI** | Subtle helper text below price field: "Similar items typically sell for $X-$Y" |
| **Graceful degradation** | No price hint shown |
| **Default state** | Enabled |
| **Tooltip** | "Based on similar listings in your building." |
| **Privacy** | Only uses aggregate pricing data, never individual seller information |

### 7.5 Idea Deduplication (extends AI #70)

| Aspect | Detail |
|--------|--------|
| **What it does** | Compares newly submitted ideas against existing Open, Under Review, and Planned ideas to find semantic duplicates |
| **Trigger** | On idea submit (before creation) |
| **Input** | New idea title + description. Embedding vectors of all active ideas |
| **Output** | List of similar ideas with similarity scores. If any score > 0.8, deduplication dialog triggered |
| **Model** | Embeddings (similarity search) + Haiku (confirmation) |
| **Cost** | ~$0.002 per check |
| **UI** | Dialog: "A similar idea already exists: '[Title]' (X votes). Vote for it instead?" Options: "Vote for Existing", "Submit Anyway" |
| **Graceful degradation** | No deduplication. Duplicate ideas may exist |
| **Default state** | Enabled |

### 7.6 Discussion Summarization (Community-specific)

| Aspect | Detail |
|--------|--------|
| **What it does** | Generates a concise summary of forum discussions with 20+ replies, highlighting key points, areas of agreement, and unresolved questions |
| **Trigger** | On-demand: user clicks "Summarize Discussion" button (appears on topics with 20+ replies) |
| **Input** | All replies in the topic thread (text only, attachments excluded) |
| **Output** | 2-3 sentence summary + list of key points (max 5) + sentiment indicator (positive/neutral/negative) |
| **Model** | Sonnet (needs reasoning for accurate summarization) |
| **Cost** | ~$0.01 per summary |
| **UI** | Collapsible summary panel at top of topic. Label: "AI Summary". Refresh button to regenerate. Timestamp of when summary was last generated |
| **Graceful degradation** | "Summarize Discussion" button hidden. Users read full thread |
| **Default state** | Disabled (opt-in per property) |
| **Tooltip** | "This summary was generated by AI. It may not capture every nuance of the discussion." |
| **Cache** | Summary cached for 24 hours. Auto-invalidated when 5+ new replies are posted after generation |

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric | Description | Granularity | Visible To |
|--------|-------------|-------------|------------|
| Active classified ads | Count of ads with status = active | Daily | Property Manager, Admin |
| Ads posted (period) | Number of new ads created in date range | Daily, Weekly, Monthly | Property Manager, Admin |
| Ads sold (period) | Number of ads marked as Sold | Daily, Weekly, Monthly | Property Manager, Admin |
| Average time to sell | Mean days from posting to Sold status | Monthly | Property Manager, Admin |
| Idea submissions | Count of new ideas submitted | Monthly | Property Manager, Admin |
| Top voted ideas | Ideas ranked by vote count | Real-time | Property Manager, Admin |
| Event attendance rate | RSVP "Going" vs actual capacity utilization | Per event, Monthly aggregate | Property Manager, Admin |
| Library downloads | File downloads by folder, by file | Daily, Monthly | Property Manager, Admin |
| Forum activity | Posts, replies, and unique participants | Daily, Weekly, Monthly | Property Manager, Admin |
| Survey response rate | Responses / eligible units per survey | Per survey | Property Manager, Admin |
| Moderation queue volume | Items flagged per day, approval rate, rejection rate | Daily | Property Manager, Admin |

### 8.2 Performance Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Content moderation latency | Time from submit to AI moderation result | < 2 seconds |
| File upload throughput | Time to upload and process files | < 5 seconds for 10MB file |
| Search response time | Time from query to results displayed | < 500ms |
| Calendar render time | Time to render month view with events | < 1 second |
| Concurrent forum users | Number of simultaneous users on forum pages | 200+ without degradation |

### 8.3 AI Insight Metrics

| Metric | Description | Delivery |
|--------|-------------|----------|
| Community Sentiment Dashboard (AI #71) | Weekly sentiment analysis across all community content | Dashboard widget (weekly). Shows: overall sentiment score, trending topics, notable shifts, category breakdown |
| Content moderation accuracy | False positive and false negative rates for AI moderation | Monthly report to admin. Calculated from moderator override actions |
| Category suggestion accuracy | How often users accept AI-suggested categories | Monthly. Tracked by: suggested, applied, overridden |
| Spam detection effectiveness | Spam caught by AI vs reported by users | Monthly |

---

## 9. Notifications

### 9.1 Notification Triggers

| Trigger | Recipient | Channels | Template Summary |
|---------|-----------|----------|------------------|
| New classified ad pending approval | Property Manager, Admin | In-app, Email | "A new classified ad needs your review: '[title]'" |
| Classified ad approved | Ad poster | In-app, Email, Push | "Your ad '[title]' is now live!" |
| Classified ad rejected | Ad poster | In-app, Email | "Your ad '[title]' was not approved. Reason: [reason]" |
| Ad expiring in 3 days | Ad poster | In-app, Push | "Your ad '[title]' expires in 3 days. Renew it?" |
| New comment on your ad | Ad poster | In-app, Push | "[Name] commented on your ad '[title]'" |
| Idea status changed | Idea submitter | In-app, Email, Push | "Your idea '[title]' status changed to [status]" |
| Admin responded to idea | Idea submitter | In-app, Email, Push | "Management responded to your idea '[title]'" |
| Idea merged | Both idea submitters | In-app, Email | "Your idea was merged with '[surviving title]'" |
| New event published | Target resident groups | In-app, Email, Push | "New event: '[title]' on [date]" |
| Event cancelled | All RSVP'd attendees | In-app, Email, Push, SMS | "Event cancelled: '[title]' on [date] has been cancelled" |
| Event reminder | RSVP'd "Going" attendees | In-app, Push | "Reminder: '[title]' starts in 24 hours" |
| Event at capacity (waitlist available) | -- | -- | System state change only; no notification |
| Waitlist spot opened | Next person on waitlist | In-app, Push | "A spot opened for '[title]'. RSVP now!" |
| New file uploaded (if notify enabled) | Residents with folder read permission | In-app, Email | "New document available: '[filename]' in [folder name]" |
| New forum reply (if following) | Topic followers | In-app, Push | "[Name] replied to '[topic title]'" |
| Content flagged (AI or user report) | Property Manager, Admin | In-app | "Content flagged for review in [sub-module]" |
| Survey published | Target audience (owners/tenants) | In-app, Email, Push | "New survey: '[title]'. Share your opinion!" |
| Survey closing in 2 days | Residents who haven't responded | In-app, Push | "Survey '[title]' closes in 2 days. Have you responded?" |
| Survey results available | Respondents | In-app | "Results are in for '[title]'" |

### 9.2 Notification Preferences

Residents can control Community notifications at the sub-module level:

| Preference | Options | Default |
|------------|---------|---------|
| Classified Ads (my ads) | All / In-App Only / Off | All |
| Idea Board (my ideas) | All / In-App Only / Off | All |
| Events | All / In-App Only / Off | All |
| Library uploads | All / In-App Only / Off | In-App Only |
| Forum (followed topics) | All / In-App Only / Off | In-App Only |
| Surveys | All / In-App Only / Off | All |

"All" = In-app + Email + Push. Preferences set in the user's notification settings (see PRD 08-User Management).

---

## 10. API

### 10.1 Classified Ads Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/classifieds` | List ads with filters (category, status, search, sort, page) | Resident+ | 60/min |
| GET | `/api/v1/community/classifieds/:id` | Get ad detail | Resident+ | 60/min |
| POST | `/api/v1/community/classifieds` | Create classified ad | Resident+ | 10/min |
| PUT | `/api/v1/community/classifieds/:id` | Update ad (owner only) | Resident+ (owner) | 20/min |
| PATCH | `/api/v1/community/classifieds/:id/status` | Change ad status (mark sold, renew) | Resident+ (owner) or PM+ (moderate) | 20/min |
| DELETE | `/api/v1/community/classifieds/:id` | Soft delete ad | Resident+ (owner) or PM+ | 10/min |
| POST | `/api/v1/community/classifieds/:id/images` | Upload images (multipart) | Resident+ (owner) | 10/min |
| DELETE | `/api/v1/community/classifieds/:id/images/:imageId` | Delete image | Resident+ (owner) | 20/min |

### 10.2 Idea Board Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/ideas` | List ideas with filters | Resident+ | 60/min |
| GET | `/api/v1/community/ideas/:id` | Get idea detail | Resident+ | 60/min |
| POST | `/api/v1/community/ideas` | Submit idea | Resident+ | 5/min |
| PUT | `/api/v1/community/ideas/:id` | Update idea (author only, within 30 min) | Resident+ (author) | 10/min |
| POST | `/api/v1/community/ideas/:id/vote` | Vote for idea | Resident+ | 30/min |
| DELETE | `/api/v1/community/ideas/:id/vote` | Remove vote | Resident+ | 30/min |
| PATCH | `/api/v1/community/ideas/:id/status` | Change status | PM+ | 20/min |
| POST | `/api/v1/community/ideas/:id/response` | Add admin response | PM+ | 10/min |
| POST | `/api/v1/community/ideas/:id/merge` | Merge into another idea | Admin | 5/min |

### 10.3 Community Events Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/events` | List events (supports calendar range queries) | Resident+ | 60/min |
| GET | `/api/v1/community/events/:id` | Get event detail | Resident+ | 60/min |
| POST | `/api/v1/community/events` | Create event | FrontDesk+ | 10/min |
| PUT | `/api/v1/community/events/:id` | Update event | Creator or PM+ | 20/min |
| PATCH | `/api/v1/community/events/:id/status` | Change status (cancel, etc.) | Creator or PM+ | 10/min |
| POST | `/api/v1/community/events/:id/rsvp` | RSVP to event | Resident+ | 30/min |
| GET | `/api/v1/community/events/:id/attendees` | List attendees | Creator or PM+ | 30/min |
| GET | `/api/v1/community/events/:id/ics` | Download .ics calendar file | Resident+ | 30/min |

### 10.4 Document Library Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/library/folders` | List folders (tree) | Resident+ | 60/min |
| GET | `/api/v1/community/library/folders/:id` | Get folder contents | Resident+ (with folder read perm) | 60/min |
| POST | `/api/v1/community/library/folders` | Create folder | PM+ | 10/min |
| PUT | `/api/v1/community/library/folders/:id` | Update folder (name, description) | PM+ | 20/min |
| DELETE | `/api/v1/community/library/folders/:id` | Delete folder (must be empty) | Admin | 5/min |
| GET | `/api/v1/community/library/files/:id` | Get file detail + download URL | Resident+ (with folder read perm) | 60/min |
| POST | `/api/v1/community/library/folders/:id/files` | Upload files (multipart) | Write perm on folder | 10/min |
| PUT | `/api/v1/community/library/files/:id` | Update file metadata | Write perm on folder | 20/min |
| DELETE | `/api/v1/community/library/files/:id` | Delete file | Delete perm on folder | 5/min |
| GET | `/api/v1/community/library/files/:id/versions` | List file versions | Resident+ | 30/min |
| GET | `/api/v1/community/library/recent` | Recent uploads (30 days) | Resident+ | 30/min |
| GET | `/api/v1/community/library/search` | Search files | Resident+ | 30/min |

### 10.5 Discussion Forum Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/forum/topics` | List topics with filters | Resident+ | 60/min |
| GET | `/api/v1/community/forum/topics/:id` | Get topic with replies | Resident+ | 60/min |
| POST | `/api/v1/community/forum/topics` | Create topic | Resident+ | 5/min |
| PUT | `/api/v1/community/forum/topics/:id` | Edit topic (author, within 30 min) | Resident+ (author) | 10/min |
| POST | `/api/v1/community/forum/topics/:id/replies` | Add reply | Resident+ | 20/min |
| POST | `/api/v1/community/forum/topics/:id/follow` | Follow/unfollow topic | Resident+ | 30/min |
| POST | `/api/v1/community/forum/replies/:id/like` | Like/unlike reply | Resident+ | 30/min |
| POST | `/api/v1/community/forum/reports` | Report content | Resident+ | 10/min |
| GET | `/api/v1/community/forum/topics/:id/summary` | Get AI discussion summary | Resident+ | 10/min |

### 10.6 Survey Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/surveys` | List surveys | Resident+ | 60/min |
| GET | `/api/v1/community/surveys/:id` | Get survey with questions | Resident+ | 60/min |
| POST | `/api/v1/community/surveys` | Create survey | PM+ | 5/min |
| PUT | `/api/v1/community/surveys/:id` | Update survey (draft only) | PM+ | 10/min |
| POST | `/api/v1/community/surveys/:id/publish` | Publish survey | PM+ | 5/min |
| POST | `/api/v1/community/surveys/:id/close` | Close survey early | PM+ | 5/min |
| POST | `/api/v1/community/surveys/:id/responses` | Submit survey response | Resident+ | 5/min |
| GET | `/api/v1/community/surveys/:id/results` | Get aggregated results | PM+ or respondent (if public) | 30/min |
| GET | `/api/v1/community/surveys/:id/export` | Export results (CSV/PDF/Excel) | PM+ | 5/min |

### 10.7 Moderation Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/moderation/queue` | Get moderation queue | PM+ | 30/min |
| PATCH | `/api/v1/community/moderation/:id/approve` | Approve flagged content | PM+ | 30/min |
| PATCH | `/api/v1/community/moderation/:id/remove` | Remove content (reason required) | PM+ | 30/min |
| GET | `/api/v1/community/moderation/users/:id/history` | User moderation history | Admin | 10/min |

### 10.8 Photo Album Endpoints

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/albums` | List albums | Resident+ | 60/min |
| GET | `/api/v1/community/albums/:id` | Get album with photos | Resident+ | 60/min |
| POST | `/api/v1/community/albums` | Create album | FrontDesk+ | 5/min |
| PUT | `/api/v1/community/albums/:id` | Update album metadata | Creator or PM+ | 10/min |
| POST | `/api/v1/community/albums/:id/photos` | Upload photos (multipart) | Creator or PM+ | 10/min |
| DELETE | `/api/v1/community/albums/:id/photos/:photoId` | Delete photo | Creator or PM+ | 20/min |

### 10.9 Common Patterns

**Pagination**: All list endpoints support `?page=1&per_page=20` (max per_page: 100).

**Filtering**: Query parameters vary by endpoint. Common: `?status=active&category_id=uuid&search=keyword&sort=newest`.

**Response format**: Standard envelope:
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 47,
    "total_pages": 3
  }
}
```

**Error format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be at least 5 characters",
    "fields": {
      "title": "Title must be at least 5 characters"
    }
  }
}
```

**Authentication**: All endpoints require a valid JWT. Property context is derived from the authenticated user's current property.

---

## 11. Completeness Checklist

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | All 5 sub-modules fully specified (Classified Ads, Idea Board, Events, Library, Forum) | Done | Sections 3.1-3.5 |
| 2 | Surveys/Polls builder specified | Done | Section 3.6 |
| 3 | Photo Albums specified | Done | Section 3.7 |
| 4 | Every form field has: type, max length, required, default, validation, error message | Done | Sections 3.1-3.7 |
| 5 | Every button has: action, loading state, success state, failure state | Done | All sub-modules |
| 6 | Desktop, tablet, mobile layouts defined | Done | Section 6.2 |
| 7 | Empty states defined for every listing | Done | Section 6.3 |
| 8 | Loading states defined | Done | Section 6.4 |
| 9 | Error states defined | Done | Section 6.5 |
| 10 | All 6 AI capabilities documented | Done | Section 7 (Content Moderation, Spam Detection, Category Suggestion, Price Suggestion, Idea Deduplication, Discussion Summarization) |
| 11 | AI graceful degradation for all 6 capabilities | Done | Each AI section includes fallback behavior |
| 12 | Data model with all entities and fields | Done | Section 4 (15 entities) |
| 13 | User flows for primary scenarios | Done | Section 5 (6 flows) |
| 14 | Role-based access matrix | Done | Section 6.1 |
| 15 | API endpoints for all sub-modules | Done | Section 10 (8 endpoint groups, 50+ endpoints) |
| 16 | Notification triggers and templates | Done | Section 9 (19 triggers) |
| 17 | Notification preferences per sub-module | Done | Section 9.2 |
| 18 | Analytics (operational, performance, AI) | Done | Section 8 |
| 19 | Progressive disclosure applied | Done | AI suggestions appear contextually; advanced features hidden by default |
| 20 | Tooltips for complex features | Done | AI suggestions, moderation queue, discussion summary |
| 21 | No competitor names referenced | Done | Uses "industry research" and "competitive analysis" throughout |
| 22 | Classified ad lifecycle with auto-expiry and renewal | Done | Section 3.1.4 |
| 23 | Idea lifecycle with voting, merging, and admin response | Done | Sections 3.2.3, 3.2.4 |
| 24 | Event lifecycle with auto-status transitions | Done | Section 3.3.4 |
| 25 | Document versioning | Done | Sections 3.4.2, 3.4.4, Data model 4.9 |
| 26 | Forum moderation queue with bulk actions | Done | Section 3.5.4 |
| 27 | Survey with 6 question types | Done | Section 3.6.2 |
| 28 | Moderation shared across all community content types | Done | Sections 3.5.4, 7.1, 10.7 |

---

*This document is part of the Concierge PRD suite. See 00-prd-index.md for the complete file listing.*
