# Audit: PRD 12 -- Community

> Cross-reference of research docs against PRD 12-community.md
> Research sources: docs/platform-3/deep-dive-classified-ads.md, docs/platform-3/deep-dive-events.md, docs/platform-3/deep-dive-library.md, docs/events.md (Aquarius), docs/library.md (Aquarius), docs/advertisement.md (Aquarius), docs/survey.md (Aquarius), docs/store.md (Aquarius)
> Date: 2026-03-14

---

## Summary

PRD 12 is the largest PRD in the suite and covers seven sub-modules comprehensively. It directly addresses nearly every weakness identified across all three platforms for community features. Classified Ads are built as a standalone module (not on a forum engine like Condo Control), with 8-image support, structured categories, lifecycle states, and AI moderation. Community Events add RSVP, waitlists, and auto-status transitions that Condo Control lacks. The Document Library supports nested folders (3 levels), file versioning, and inline preview. The Discussion Forum, Idea Board, Surveys, and Photo Albums are all well-specified. Six AI capabilities are integrated.

---

## GAPS

### GAP-1: Online Store / Marketplace Commerce Module

**Research source**: Aquarius store.md -- Full online store with product catalog, shopping cart, order management (Place Order, Existing Orders, Your Orders tabs), payment tracking, order status, and building-specific product catalog.

**What is missing**: The PRD covers Classified Ads (resident-to-resident commerce) but does not include a building-managed online store for property-level purchases (e.g., laundry cards, parking passes, event tickets, amenity-related products). Aquarius has a dedicated Store module with product browsing, cart, and order tracking.

**Recommendation**: Add an "Online Store" sub-module to Community (or as a separate PRD) for building-managed commerce. This is listed as "Nice-to-Have (v3+)" in CLAUDE.md but the research data is available. At minimum, note the intentional deferral in the PRD.

---

### GAP-2: Property Manager Approval Workflow for Classified Ads -- Approval Queue Detail

**Research source**: Aquarius advertisement.md -- Dedicated "Approve Advertisements" modal with a table showing: Approve checkbox, Title, Category, Details, Expiry Date, Building, Price, Author, Created On. Two-business-day review SLA documented.

**What is missing**: The PRD describes moderation (AI + manual) in Section 3.5.4 and Section 7.1, and the classified ad lifecycle includes "Pending Review" status. However, the specific approval queue UI for classified ads is described only in the general moderation queue (Section 3.5.4), which is shared across all community content types. Aquarius has a dedicated advertisement approval table.

**Recommendation**: The shared moderation queue is actually a better design. However, consider adding a "Classified Ads" filter/tab within the moderation queue so property managers can quickly process ad approvals separately from forum moderation. Minor enhancement.

---

### GAP-3: Terms and Conditions Agreement on Classified Ads

**Research source**: Aquarius advertisement.md -- "I agree to term and conditions?" checkbox required before posting.

**What is missing**: The PRD's classified ad creation form (Section 3.1.2) does not include a terms and conditions checkbox or agreement. This is important for legal liability when residents transact through the platform.

**Recommendation**: Add a `terms_accepted` boolean field (required, no default) to the classified ad creation form with text: "I agree to the building's classified ad terms and conditions" linking to a configurable terms document.

---

### GAP-4: Building-Specific Event Filtering

**Research source**: Aquarius events.md -- "Select Building" dropdown for multi-building properties. Condo Control deep-dive-events.md -- Dual calendar system with INTERNAL CALENDAR and property-specific calendar, each with unique calendar IDs (16984, 16988).

**What is missing**: The PRD supports `calendar_type` (public vs internal) and `target_groups` for notifications, but does not explicitly support building-level filtering for multi-building properties. The "Building" field is not present on the event creation form.

**Recommendation**: Add a `building_id` field to the Community Event entity and creation form for multi-building properties. The PRD's architecture doc (01) likely handles multi-building context, but the Community Events form should include building selection.

---

### GAP-5: Event Guard Required Field -- Notification to Security

**Research source**: Aquarius events.md -- "Guard required" checkbox on event creation. When checked, indicates security guard presence is needed.

**What is missing**: The PRD includes `guard_required` (boolean, Section 3.3.2) on the event form, which is correct. However, the notification triggers (Section 9.1) do not include a notification to security staff when an event is created with guard_required = true.

**Recommendation**: Add a notification trigger: "Event published with security required" -> Recipients: Security Supervisor, assigned security staff -> Channels: In-app, Push -> Template: "Security presence required: '[title]' on [date] at [location]."

---

### GAP-6: Event Recurrence Details -- Work Week and Agenda Views

**Research source**: Aquarius events.md -- 5 calendar view modes: Month, Week, Work Week, Day, Agenda. Condo Control deep-dive-events.md -- Month, Week, Day views.

**What is missing**: The PRD specifies Month/Week/Day views (Section 3.3.1) but does not include Work Week (Monday-Friday only) or Agenda (list-based upcoming events) views that Aquarius provides.

**Recommendation**: Add Work Week and Agenda as additional calendar view options. The Agenda view is particularly useful for residents who want a quick list of upcoming events without navigating a calendar grid. Low priority for v1 but worth noting.

---

### GAP-7: Document Library -- Building-Specific Filtering

**Research source**: Aquarius library.md -- "Select Building" dropdown to filter documents by building. Also tracks "Files Uploaded" count and "Total Space Used" statistics.

**What is missing**: The PRD's Document Library (Section 3.4.1) includes storage usage tracking and search, but building-specific filtering is not explicit. For multi-building properties, documents may need per-building organization.

**Recommendation**: Add building_id to the Library Folder entity if multi-building support requires building-level document separation. Alternatively, use top-level folders per building.

---

### GAP-8: Document Library -- Drag-and-Drop Upload for Concierge/Security Role

**Research source**: Condo Control deep-dive-library.md -- Security & Concierge has read-only access. Flagged as wrong: "A concierge should be able to upload incident photos, shift reports, or form submissions."

**What is missing**: The PRD role matrix (Section 6.1) gives Front Desk "View, Download, Upload (if folder permits)" but Security only "View, Download". The research explicitly calls out that security should be able to upload.

**Recommendation**: Update the role matrix to give Security "View, Download, Upload (if folder permits)" matching Front Desk. Security staff need to upload incident documentation.

---

### GAP-9: Survey Question Download/Export -- Per-Question Analytics

**Research source**: Aquarius survey.md -- "Download Survey Report" button for exporting results. Survey completion tracked by unit count.

**What is missing**: The PRD covers survey results view (Section 3.6.3) with per-question charts, export (CSV/PDF/Excel), and response rate. However, it does not specify per-question export or the ability to export results segmented by respondent type (owner vs tenant).

**Recommendation**: Add a "Segment by" option on survey results (Owner vs Tenant vs All) and ensure per-question data is included in CSV export. Minor enhancement.

---

## WEAK COVERAGE

### WEAK-1: Classified Ads -- Expiry Date Precision

**Research source**: Condo Control deep-dive-classified-ads.md -- Default expiration includes seconds-level precision ("04/14/2026 01:17:45"). Flagged as wrong: "Unnecessary for classified ads. Should be date-only."

**PRD coverage**: Section 3.1.2 specifies `expiration_date` as type `date` with default "Today + 30 days". Maximum 90 days.

**Assessment**: Correctly fixed. Date-only (no time component) is specified. Well handled.

---

### WEAK-2: Classified Ads -- Forum URL Leak Fix

**Research source**: Condo Control deep-dive-classified-ads.md -- URLs use `/forum/` paths with `?mode=classifieds`, exposing that classifieds are built on a forum engine.

**PRD coverage**: Section 10.1 uses clean API paths: `/api/v1/community/classifieds`. The data model (Section 4.1) is a standalone ClassifiedAd entity, not a forum thread.

**Assessment**: Fully fixed. Standalone data model with clean URLs.

---

### WEAK-3: Events -- No Category/Tag System

**Research source**: Condo Control deep-dive-events.md -- "No event categories or tags -- Can't distinguish maintenance events from social events from board meetings without reading the title."

**PRD coverage**: The PRD uses `calendar_type` (public/internal) as the primary categorization, plus `location_type` (on-site, off-site, virtual, hybrid). There is no explicit event category or tag system beyond calendar type.

**Assessment**: Partially addressed. The dual calendar system (internal/public) helps, but a finer-grained category system (Social, Board Meeting, Maintenance, Health & Safety, etc.) would improve filtering and analytics. Consider adding an optional `category_id` field to the event form.

---

### WEAK-4: Events -- RSVP "Maybe" and "Not Going" Tracking

**Research source**: Condo Control deep-dive-events.md -- "No RSVP or attendance tracking -- Events have no 'Attend' button, no attendee count, no capacity limit."

**PRD coverage**: Section 3.3.3 specifies full RSVP with "Going" / "Maybe" / "Not Going" buttons, capacity limits, waitlist support, and attendee lists. Section 4.6 defines the EventRSVP entity with status enum (going, maybe, not_going, waitlisted).

**Assessment**: Fully fixed and well-specified. The PRD adds features far beyond what any research platform offers.

---

### WEAK-5: Document Library -- File Size Display

**Research source**: Condo Control deep-dive-library.md -- "No file size displayed -- Cannot see how large files are before downloading."

**PRD coverage**: Section 3.4.1 specifies file listing columns including "Size". Section 3.4.4 (File Detail) includes "File size" in metadata. Data model (Section 4.8) has `file_size` (bigint).

**Assessment**: Fully fixed.

---

### WEAK-6: Document Library -- No File Preview

**Research source**: Condo Control deep-dive-library.md -- "No file preview -- Must download to view. No inline PDF preview or image thumbnail."

**PRD coverage**: Section 3.4.4 specifies "Inline preview for PDF (embedded viewer), images (full-size), and text files. Other types show file icon with download button."

**Assessment**: Fully fixed with specific preview capabilities per file type.

---

### WEAK-7: Document Library -- No Version History

**Research source**: Condo Control deep-dive-library.md -- "No version history -- No indication of file versions."

**PRD coverage**: Section 3.4.2 specifies version tracking ("Replacing a file creates a new version. Previous versions accessible via 'Version History' on the file detail."). Data model includes LibraryFileVersion entity (Section 4.9).

**Assessment**: Fully fixed with dedicated version entity.

---

### WEAK-8: Classified Ads -- Only Two Images

**Research source**: Condo Control deep-dive-classified-ads.md -- "Only two images -- Limited to 2 photos per ad."

**PRD coverage**: Section 3.1.2 specifies 8 images per ad (5MB each, JPG/PNG/HEIC/WebP). Image carousel on detail page (Section 3.1.3).

**Assessment**: Fully fixed. 4x improvement over Condo Control.

---

### WEAK-9: Classified Ads -- No Category Filtering

**Research source**: Condo Control deep-dive-classified-ads.md -- "No category/type filtering -- Can't filter by 'For Sale', 'Wanted', 'Free', 'Services'."

**PRD coverage**: Section 3.1.1 specifies category filter dropdown with count badges. Section 3.1.2 defines 10 default categories (For Sale, Furniture, Electronics, Appliances, Clothing, Free Stuff, Wanted, Services, Carpool/Ride Share, Other).

**Assessment**: Fully fixed with comprehensive category system.

---

### WEAK-10: Classified Ads -- No Status Indicators

**Research source**: Condo Control deep-dive-classified-ads.md -- "No ad status indicators -- No 'Sold', 'Available', 'Pending' status."

**PRD coverage**: Section 3.1.2 defines 7 statuses (draft, pending_review, active, sold, expired, rejected, archived). Section 3.1.1 specifies status filter and status badges on cards.

**Assessment**: Fully fixed with complete lifecycle management.

---

## CONFIRMED

The following research features are confirmed present and well-covered in the PRD:

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Auto-expiry on classified ads (30-day default) | 3.1.2, 3.1.4 | Default 30 days, max 90, plus 2 renewals |
| 2 | Follow/subscribe on community content | 3.5.3 | Follow toggle on forum topics, auto-follow on reply |
| 3 | Rich text editor for posts | 3.1.2, 3.3.2, 3.5.2 | Markdown-based rich text across all sub-modules |
| 4 | Folder descriptions with access restrictions | 3.4.3 | Description field + role-based permissions (Read/Write/Delete/Manage) |
| 5 | Recent Uploads section (30-day window) | 3.4.1 | Max 10 files, "View All Recent" link |
| 6 | Role-based folder permissions | 3.4.3 | 4 permission levels per role group |
| 7 | Card grid view for classifieds (not table-only) | 3.1.1 | Card grid default + list view toggle |
| 8 | Structured contact fields on ads | 3.1.2 | contact_method, contact_phone, contact_email fields |
| 9 | Human-friendly date display | 3.3.3 | "Saturday, March 15, 2026 -- 10:00 AM to 12:00 PM" |
| 10 | Empty states with guidance | 6.3 | All 11 empty states specified with CTAs |
| 11 | Document versioning | 3.4.2, 4.9 | LibraryFileVersion entity |
| 12 | Dual calendar system (internal/public) | 3.3.1, 3.3.2 | calendar_type with color coding |
| 13 | RSVP and attendance tracking on events | 3.3.3, 4.6 | Going/Maybe/Not Going + waitlist |
| 14 | Event capacity limits | 3.3.2 | capacity field with waitlist when full |
| 15 | Auto-status transition on events | 3.3.4 | Active > In Progress > Completed auto-transition |
| 16 | Event cancellation notifications | 9.1 | "Event cancelled" trigger with multi-channel delivery |
| 17 | Approval workflow for classified ads | 3.1.4, 7.1 | AI moderation + manual review queue |
| 18 | Idea Board with voting | 3.2 | Full sub-module with votes, status lifecycle, admin response |
| 19 | Surveys with multiple question types | 3.6.2 | 6 types vs Aquarius's multiple choice only |
| 20 | Discussion Forum | 3.5 | Full threaded forum with moderation |
| 21 | Photo Albums | 3.7 | Album management with lightbox viewer |
| 22 | AI: Content moderation | 7.1 | Haiku-based scanning on submit |
| 23 | AI: Spam detection | 7.2 | Duplicate and bulk posting detection |
| 24 | AI: Category suggestion for ads | 7.3 | Auto-suggest based on title + description |
| 25 | AI: Price suggestion for ads | 7.4 | Based on similar listings |
| 26 | AI: Idea deduplication | 7.5 | Semantic similarity check on submit |
| 27 | AI: Discussion summarization | 7.6 | For topics with 20+ replies |
| 28 | Survey audience targeting (Owners/Tenants) | 3.6.2 | visible_to_owners and visible_to_tenants toggles |
| 29 | Survey expiry management | 3.6.2 | expiry_date with auto-expiration |
| 30 | Survey report download | 3.6.3 | Export results as CSV, PDF, Excel |
| 31 | Library file type filtering | 3.4.1 | File type filter with grouped categories |
| 32 | Print calendar | 3.3.1 | Formatted PDF of current view |
| 33 | Event attachments | 3.3.2 | Up to 5 files, 10MB each |
| 34 | Event recurrence support | 3.3.2 | Daily, Weekly, Bi-Weekly, Monthly, Custom |
| 35 | Guard required flag on events | 3.3.2 | guard_required boolean, staff-only visibility |
| 36 | Notification preferences per sub-module | 9.2 | All/In-App Only/Off per community sub-module |
| 37 | Add to Calendar (.ics export) | 3.3.3 | .ics file download button |
| 38 | Moderation queue with bulk actions | 3.5.4 | Approve, Remove, Warn on multiple items |

---

*Audit completed: 2026-03-14*
*Gaps found: 9*
*Weak coverage: 10 (8 confirmed fixed, 2 partially addressed)*
*Confirmed: 38*
