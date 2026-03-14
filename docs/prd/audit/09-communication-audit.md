# Audit: 09-Communication PRD vs Research

> **Date**: 2026-03-14
> **Auditor**: Cross-reference audit
> **Research sources**: docs/announcement.md (Aquarius), docs/platform-3/deep-dive-announcements.md (Condo Control), docs/platform-2/manage-and-communicate.md (BuildingLink), docs/preferences.md (Aquarius)

---

## Summary

The Communication PRD (09-communication.md) is exceptionally thorough. It covers all major features observed across all three platforms and introduces significant innovations (AI capabilities, emergency cascade, draft-approve workflow, per-channel read receipts). The PRD successfully addresses every "What Gets Wrong" item from the research. Only a handful of minor features from the research lack explicit coverage.

**Coverage score**: 95/100

---

## GAPS (Features in research but missing from PRD)

### GAP-1: Virtual Concierge Board Integration
- **Source**: Aquarius announcement.md -- "Do you also want to post the announcement to virtual concierge board?" checkbox
- **What's missing**: The PRD has no mention of a virtual concierge board or digital display integration. BuildingLink also has a "Public Display" channel for lobby screens. The PRD mentions lobby display as a "5th output channel for v2" in the Research Summary table (Section 2) but it is not in the feature spec, data model, or channel enums.
- **Impact**: Medium. Lobby screens are a real distribution channel in multiple competing platforms.
- **Recommendation**: Add "lobby_display" as a future channel in the channel enum documentation. Add a v2 note in the data model for the `channels` field.

### GAP-2: AGM Notice Opt-In Compliance
- **Source**: Aquarius announcement.md -- "AGM Notice Opt-in notification setting only applies to tenants/owners"
- **What's missing**: The PRD has no mention of AGM (Annual General Meeting) notice compliance. In Ontario condo law, AGM notices have specific delivery requirements. The Aquarius platform has a dedicated toggle for this.
- **Impact**: Medium. This is a regulatory compliance feature for Canadian condo corporations.
- **Recommendation**: Add a "Regulatory/Legal Notice" category with special delivery rules (e.g., must be delivered to all owners regardless of opt-out preferences, similar to emergency broadcasts).

### GAP-3: Budget Mailout / Financial Communication Type
- **Source**: Condo Control deep-dive-announcements.md -- "Budget mailout" option at `/budgetmailout/choose-data`
- **What's missing**: The PRD does not include a dedicated financial/budget communication type. Condo Control has a separate "Budget mailout" workflow for targeted financial communications from the board to owners.
- **Impact**: Low-Medium. This is a specialized board-to-owner communication need.
- **Recommendation**: Consider adding "Financial" as a system default announcement category and a "Budget Mailout" template with owner-only audience pre-set.

### GAP-4: No-Reply Email Option
- **Source**: Aquarius announcement.md -- "Do you want to send an email through no-reply account?" checkbox
- **What's missing**: The PRD does not specify whether announcements can be sent from a no-reply address vs. a reply-enabled address. This is relevant because some announcements should not accept replies.
- **Impact**: Low. This is an email configuration detail.
- **Recommendation**: Add a "Reply-to" field option in the create announcement form: None (no-reply), Management Office, Custom Email.

### GAP-5: Announcement Print Functionality
- **Source**: Aquarius announcement.md -- "Print" button in the filter bar
- **What's missing**: The PRD has "Export" (CSV/PDF) on the list page but does not mention a print-friendly view. Aquarius has a dedicated Print button for visible announcements.
- **Impact**: Low. Export to PDF covers most use cases.
- **Recommendation**: Ensure the PDF export produces a print-friendly layout. No separate feature needed.

---

## WEAK COVERAGE (Features present but underspecified)

### WEAK-1: Missing Email/Contact Data Tracking
- **Source**: BuildingLink manage-and-communicate.md -- "Manage Missing Email Addresses: Employees (3 missing), Occupants (19 missing)"
- **PRD coverage**: The PRD mentions "Missing Contact Data" as an analytics metric in Section 8.1 and the send confirmation dialog shows "5 residents have no email address on file." However, there is no dedicated proactive data quality dashboard or report that helps admins identify and fix missing contact data.
- **Recommendation**: Add a "Communication Health" widget or report that shows: residents missing email (count), residents missing phone (count), residents missing push token (count), with a "View List" link to the user management module filtered to those with gaps.

### WEAK-2: Email Delivery Failure Detail
- **Source**: Aquarius announcement.md -- Non-Delivered Mailing List Modal with columns: Sender, Recipient Email, Delivery Status, Error, Username, Unit #, Time Recorded
- **PRD coverage**: Section 3.3.3 covers delivery failure tracking with recipient, channel, error, timestamp, and retry. However, the PRD does not include the sender address, which is useful when multiple "from" addresses are configured.
- **Recommendation**: Add "sender_address" to the delivery failure table fields.

### WEAK-3: Scrolling/Ticker-Style Announcements
- **Source**: BuildingLink manage-and-communicate.md -- "View/Edit Scrolling Announcements" (None Active)
- **PRD coverage**: Not mentioned. Scrolling/ticker announcements are a distinct display format for lobby screens or digital signage.
- **Recommendation**: Document this as part of the v2 Lobby Display channel. Ticker-style announcements are a display mode, not a separate feature.

### WEAK-4: Internal Messaging / Mailbox
- **Source**: BuildingLink manage-and-communicate.md -- "Mailbox" internal messaging system
- **PRD coverage**: The Communication PRD focuses on announcements and broadcast communication. Internal messaging (staff-to-staff or staff-to-resident direct messages) is not covered.
- **Recommendation**: Confirm whether internal messaging is scoped for a separate PRD or is deferred to v2+. Add a cross-reference note if it exists elsewhere.

### WEAK-5: Announcement Type Filtering (Regular vs. Customized)
- **Source**: Condo Control deep-dive-announcements.md -- Two checkboxes: "Regular Announcement" and "Customized Announcement"
- **PRD coverage**: The PRD uses Categories (General, Maintenance, Safety, etc.) which is a superior approach. However, the concept of "customized" or "targeted" mailings (budget mailouts, personalized letters) as a distinct type is not captured.
- **Recommendation**: The Category system covers this adequately. No change needed unless budget mailout (GAP-3) is added.

### WEAK-6: Notification Preference -- Staff vs. Resident Differentiation
- **Source**: Aquarius preferences.md -- Documents 10 notification categories with role-based relevance table (Admin, Concierge, Security, Resident, Owner)
- **PRD coverage**: Section 3.7.1 covers the resident-facing preference matrix with 10 modules. However, staff notification preferences (e.g., "Notify when a resident edits profile", "Parking violation created and updated", "Emergency Assistance updates") are not fully specified in the preference matrix.
- **Recommendation**: Add a staff-facing notification preference matrix alongside the resident-facing one, or note that staff preferences are configured in 02-Roles and Permissions.

---

## CONFIRMED (Features properly covered)

| # | Research Feature | PRD Section | Notes |
|---|-----------------|-------------|-------|
| 1 | Multi-channel distribution (web, mobile, lobby) | 3.1.1, Research Summary | Four channels at launch, lobby display noted for v2 |
| 2 | Emergency SMS that bypasses preferences | 3.4 | Fully covered with cascade system |
| 3 | Announcement expiry dates | 3.1.1 | Covered with "Never Expire" option |
| 4 | Template-based creation | 3.5 | Covered with variable substitution and AI generation |
| 5 | Scheduled delivery | 3.1.1 | Covered with AI send-time optimization |
| 6 | Custom recipient groups | 3.6 | Covered with building, floor, unit, role, custom group targeting |
| 7 | Email delivery failure tracking | 3.3.3 | Extended to all channels with per-channel status |
| 8 | Rich text editor | 3.1.2 | Full toolbar spec with images, video, emoji |
| 9 | File attachments | 3.1.1 | 10 files, 25 MB total (expanded from Aquarius 4 files/5 MB) |
| 10 | 3-column card grid layout | 3.2.2, 6.1 | Responsive: 3 desktop, 2 tablet, 1 mobile |
| 11 | Status filtering (Current/Past/All) | 3.2.1 | Extended: Current, Scheduled, Draft, Expired, Rejected, All |
| 12 | Audience targeting (all, owners, tenants, units) | 3.1.3 | Extended with floor and role targeting |
| 13 | Category/tag system | 3.1.1, 4.5 | Categories + tags (Condo Control lacked this) |
| 14 | Draft announcements | 3.1.5 | Full draft-approve workflow (fixes Condo Control gap) |
| 15 | Announcement history/audit trail | 3.3.4 | Full audit trail visible to all roles (fixes Condo Control gap) |
| 16 | Read receipts / engagement tracking | 3.3.3, 4.2 | Per-channel delivery and read tracking |
| 17 | Emergency broadcast with voice calls | 3.4 | Full cascade: push > SMS > voice |
| 18 | Save to library | 3.1.1 | "Save to Library" toggle |
| 19 | Send copy to self | 3.1.1 | "Send Copy to Self" checkbox |
| 20 | Notification preferences per module | 3.7.1 | Per-module, per-channel matrix |
| 21 | Master email opt-out with exceptions | 3.7.1 | Emergency and security cannot be opted out |
| 22 | Building filter for multi-building | 3.2.1, 3.1.3 | Building filter in list and audience selector |
| 23 | Pinned announcements | 3.8 | Max 5 per property, PM+ can pin |
| 24 | Announcement archive | 3.9 | Indefinite retention with full search |
| 25 | Email digest option | 3.7.2 | Daily/weekly digest with time picker |
| 26 | Do-not-disturb hours | 3.7.3 | DND with emergency override |
| 27 | Priority levels | 3.1.1 | Low, Normal, High, Urgent with distinct behaviors |
| 28 | Duplicate announcement action | 3.2.3 | "Duplicate" in card overflow menu |
| 29 | Resend to unread recipients | 3.3.5 | "Resend" button on detail page |
| 30 | Clean plaintext extraction for previews | Research Summary (Anti-Pattern) | Explicitly addressed: "Clean plaintext extraction with proper spacing" |

---

*Audit complete. 5 gaps identified (1 medium, 3 low-medium, 1 low). 6 areas of weak coverage identified. 30 features confirmed as properly covered.*
