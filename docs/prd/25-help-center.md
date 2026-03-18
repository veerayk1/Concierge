# 25 — Help Center

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 15-Search and Navigation, 19-AI Framework

---

## 1. Overview

### What It Is

The Help Center is a **three-part support system** that enables every Concierge user -- from first-time residents to experienced property administrators -- to find answers, learn workflows, and get assistance without leaving the platform. The three components are:

1. **In-App Help System** -- a slide-out drawer accessible from every page, providing contextual articles, search, video tutorials, and an onboarding checklist.
2. **External Knowledge Base** -- a public-facing, SEO-indexed website at `help.concierge.com` with role-filtered documentation, release notes, and AI-powered search.
3. **Support Ticket System** (v2) -- a structured way for users to contact the Concierge support team when self-service content does not resolve their issue.

### Why It Exists

Property management software serves users with wildly different technical skills. A security guard logging packages at 2 AM needs different help than a property administrator configuring notification rules. Without a built-in help system, every question becomes a support email or phone call. This creates three problems:

1. **Support burden scales linearly** -- every new property adds proportional support volume. Self-service content breaks this linear relationship.
2. **Onboarding is slow** -- new staff and residents cannot discover features they do not know exist. Contextual help surfaces relevant features at the right moment.
3. **Feature adoption stalls** -- powerful features like batch event creation, saved filter presets, and keyboard shortcuts go unused because users never learn about them. The help system drives discovery.

Industry research across SaaS platforms confirms that products with integrated help systems see 30-50% fewer support tickets and significantly faster onboarding times.

### Which Roles Use It

| Role                        | Access Level                                   | Primary Use                                                                                                              |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Super Admin**             | Full read + full content management            | Create and manage help articles across all properties. Configure knowledge base settings. View support ticket analytics. |
| **Property Admin**          | Full read + property-scoped content management | Create property-specific articles. Manage article visibility. View support tickets for their property.                   |
| **Property Manager**        | Full read                                      | Access help articles. Submit support tickets. View onboarding checklist.                                                 |
| **Security Supervisor**     | Full read                                      | Access help articles. Submit support tickets.                                                                            |
| **Security Guard**          | Full read                                      | Access help articles. Submit support tickets. View video tutorials.                                                      |
| **Front Desk / Concierge**  | Full read                                      | Access help articles. Submit support tickets. View video tutorials.                                                      |
| **Maintenance Staff**       | Full read                                      | Access help articles. Submit support tickets.                                                                            |
| **Board Member**            | Full read (governance-filtered)                | Access help articles relevant to board functions. Submit support tickets.                                                |
| **Resident (Owner)**        | Full read (resident-filtered)                  | Access resident-facing articles. Submit support tickets. View onboarding checklist.                                      |
| **Resident (Tenant)**       | Full read (resident-filtered)                  | Access resident-facing articles. Submit support tickets. View onboarding checklist.                                      |
| **Family Member**           | Full read (resident-filtered)                  | Access resident-facing articles.                                                                                         |
| **Unauthenticated visitor** | Public knowledge base only                     | Browse public articles on `help.concierge.com`. Cannot access in-app help or submit tickets.                             |

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across production platforms and leading SaaS help systems revealed these essential patterns:

| Capability                      | Where Observed                                                                                     | Our Approach                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Contextual help panels**      | Leading SaaS platforms detect the current page and surface relevant articles in a slide-out drawer | Adopt. HelpDrawer reads the current URL path and auto-filters articles by matching `contextPaths` metadata |
| **Role-filtered documentation** | Platforms with role-based access show different help content to different user types               | Adopt. Every article has a `roleVisibility` array. Users only see articles matching their role             |
| **AI-powered search**           | Modern knowledge bases accept natural language queries instead of exact keyword matches            | Adopt. Integrate with AI framework (PRD 19) for semantic search across all help content                    |
| **Video tutorial embeds**       | Platforms embed short how-to videos directly in help articles for visual learners                  | Adopt. Support YouTube and Vimeo embeds with fallback thumbnails                                           |
| **Onboarding checklists**       | SaaS products guide new users through setup steps with a progress indicator                        | Adopt. Role-specific onboarding checklists that track completion state                                     |
| **Article feedback collection** | Help systems collect thumbs-up/down ratings on every article to identify weak content              | Adopt. Binary feedback plus optional comment. Analytics dashboard for content quality                      |
| **Keyboard shortcut overlays**  | Productivity-focused tools provide a quick-reference shortcut sheet via a hotkey                   | Adopt. `?` key opens a categorized shortcut cheat sheet overlay                                            |
| **Multi-language support**      | Platforms serving Canadian markets provide English and French content                              | Adopt. Full bilingual support (en, fr-CA) with locale-aware article retrieval                              |
| **Changelog and release notes** | SaaS platforms maintain a public changelog so users know what changed                              | Adopt. Dedicated release notes section with version tags and date filters                                  |

### Best Practices Adopted

1. **Help is always one click away** -- the `?` icon is permanently visible in the global header on every page, every role, every screen size.
2. **Context before search** -- when the drawer opens, it immediately shows articles relevant to the current page before the user types anything.
3. **Progressive depth** -- tooltips for quick answers, drawer articles for workflows, external knowledge base for deep dives.
4. **Content quality feedback loop** -- article ratings and search-with-no-results logs feed into a content improvement pipeline.
5. **Offline-friendly structure** -- articles use MDX (Markdown + JSX components) so they render fast, cache well, and work in low-connectivity environments.

### Pitfalls Avoided

1. **No help-gated features** -- help content never replaces intuitive UI design. If users need help to complete a basic task, the UI itself needs fixing.
2. **No stale documentation** -- every article has a `lastReviewedAt` date. Articles older than 90 days without review are flagged for the content team.
3. **No role-mismatched content** -- a resident must never see an article about configuring event types. Role filtering is mandatory, not optional.
4. **No video-only documentation** -- every video tutorial has a companion text article. Screen readers cannot parse video content.
5. **No orphaned articles** -- every article must belong to at least one category and have at least one `contextPath` mapping.
6. **No broken internal links** -- article cross-references are validated at build time. Broken links block publishing.

---

## 3. In-App Help System

### 3.1 Help Drawer

The HelpDrawer is a slide-out panel that opens from the right side of the screen. It is the primary entry point for all in-app help.

**Trigger**: The `?` icon button in the global header (right side, next to the notification bell and user avatar).

**Layout**:

| Property      | Value                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Width**     | 400px on desktop, full-screen on mobile (< 768px)                                                                                       |
| **Position**  | Fixed, right edge of viewport                                                                                                           |
| **Animation** | Slide in from right, 200ms ease-out                                                                                                     |
| **Backdrop**  | Semi-transparent overlay (`rgba(0, 0, 0, 0.3)`) on mobile only. Desktop has no backdrop -- main content remains visible and interactive |
| **Z-index**   | 1000 (above page content, below modal dialogs)                                                                                          |
| **Close**     | `X` button in drawer header, `Esc` key, or click outside on mobile backdrop                                                             |

**Drawer Sections (top to bottom)**:

| #   | Section                     | Description                                                                                                                                                       |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Search bar**              | Full-text search input with placeholder "Search help articles...". Debounced at 300ms. Results appear inline below the search bar, replacing the default content. |
| 2   | **Contextual articles**     | Auto-populated list of articles matching the current page URL path. Heading reads "Help for this page". If no contextual articles match, this section is hidden.  |
| 3   | **Onboarding checklist**    | Shown only for users who have not completed all onboarding steps. Collapsible section with progress bar. See Section 3.5.                                         |
| 4   | **Recent articles**         | Last 5 articles the user viewed, stored in `localStorage`. Heading reads "Recently viewed". Hidden if the user has not viewed any articles yet.                   |
| 5   | **Popular articles**        | Top 10 most-viewed articles across the platform, filtered by the user's role. Heading reads "Popular articles".                                                   |
| 6   | **Browse categories**       | List of help categories with icons and article counts. Clicking a category filters the article list.                                                              |
| 7   | **Contact Support**         | Button at the bottom of the drawer. Opens the support ticket form (v2) or displays the support email address (v1). Always visible.                                |
| 8   | **Keyboard shortcuts link** | Text link: "View keyboard shortcuts". Opens the shortcut cheat sheet overlay (Section 7).                                                                         |

**Article Detail View (within drawer)**:

When a user clicks an article from any list, the drawer navigates to the article detail view:

| Element                    | Description                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Back button**            | `< Back` link returns to the previous drawer view                                                                                               |
| **Title**                  | Article title, `font-size: 18px`, `font-weight: 600`                                                                                            |
| **Last updated**           | Relative date (e.g., "Updated 3 days ago")                                                                                                      |
| **Reading time**           | Estimated reading time (calculated at ~200 words per minute)                                                                                    |
| **Body**                   | Rendered MDX content with headings, code blocks, images, callout boxes, and embedded videos                                                     |
| **Table of contents**      | Auto-generated from H2 and H3 headings. Sticky sidebar on the external knowledge base; collapsible section at the top within the drawer         |
| **Related articles**       | Up to 3 related articles shown below the body, based on shared tags and category                                                                |
| **Feedback widget**        | "Was this helpful?" with thumbs-up and thumbs-down buttons. After clicking, show "Thanks for your feedback!" with an optional comment text area |
| **Open in knowledge base** | Link to view the full article on `help.concierge.com` in a new tab                                                                              |

### 3.2 Contextual Help

The help system detects the user's current page and surfaces relevant articles automatically. This is the most important feature for reducing support load.

**How it works**:

1. Every help article has a `contextPaths` metadata field -- an array of URL path patterns.
2. When the HelpDrawer opens, the front end sends the current `window.location.pathname` to the API.
3. The API matches the path against all articles' `contextPaths` using glob-style matching.
4. Matching articles are returned sorted by relevance score (exact match > prefix match > glob match).

**Path matching examples**:

| Article Context Path  | Matches URL                                                             | Does Not Match               |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| `/security-console`   | `/security-console`, `/security-console?filter=packages`                | `/security-console/settings` |
| `/security-console/*` | `/security-console/incidents`, `/security-console/packages`             | `/security-console` (exact)  |
| `/settings/**`        | `/settings`, `/settings/notifications`, `/settings/notifications/email` | `/admin/settings`            |
| `/units/:id`          | `/units/123`, `/units/abc`                                              | `/units`, `/units/123/edit`  |

**Fallback behavior**: If no articles match the current path, the contextual section is hidden and the drawer shows recent articles, popular articles, and category browsing instead.

### 3.3 Tooltip System

Complex form fields throughout Concierge display a small `(i)` icon next to their label. Hovering (desktop) or tapping (mobile) the icon shows a tooltip with a short explanation.

**Tooltip specifications**:

| Property      | Value                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Icon**      | `(i)` circle, 16px diameter, `color: #6B7280` (gray-500)                                                                   |
| **Trigger**   | Hover on desktop (200ms delay), tap on mobile                                                                              |
| **Position**  | Above the icon by default. Auto-repositions if clipped by viewport edge                                                    |
| **Max width** | 280px                                                                                                                      |
| **Content**   | Plain text only. Maximum 120 characters. For longer explanations, include a "Learn more" link to the relevant help article |
| **Dismiss**   | Mouse-out on desktop, tap anywhere else on mobile                                                                          |
| **Z-index**   | 1100 (above the HelpDrawer)                                                                                                |

**Tooltip content is stored in the help article system**, not hardcoded in components. Each tooltip maps to a `tooltipKey` string (e.g., `maintenance.permissionToEnter`). This allows admins to update tooltip text without code changes.

**Tooltip data model**:

```
TooltipContent
├── key (string, unique, e.g., "maintenance.permissionToEnter")
├── text (string, max 120 chars)
├── articleSlug (string, nullable — links to full article)
└── locale (string, "en" or "fr-CA")
```

### 3.4 Video Tutorial Embeds

Help articles can embed video tutorials for visual learners. Videos are hosted externally (YouTube or Vimeo) and embedded via iframe.

**Embed specifications**:

| Property                        | Value                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Container**                   | Responsive 16:9 aspect ratio wrapper                                                                                                              |
| **Max width in drawer**         | 100% of drawer content area (360px usable)                                                                                                        |
| **Max width in knowledge base** | 720px                                                                                                                                             |
| **Loading**                     | Lazy-loaded. Show thumbnail placeholder until the user clicks play                                                                                |
| **Fallback**                    | If the embed fails to load (network error, blocked domain), show the video thumbnail as a static image with a "Watch on YouTube/Vimeo" link below |
| **Accessibility**               | Every video must have a companion text article. The video embed includes `title` attribute for screen readers                                     |
| **Tracking**                    | Log video play events to analytics (articleId, videoProvider, timestamp, userId)                                                                  |

### 3.5 Onboarding Checklist

New users see a checklist of setup steps in the HelpDrawer. The checklist is role-specific -- a resident sees different steps than a property administrator.

**Checklist behavior**:

| Behavior            | Detail                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visibility**      | Shown only if the user has incomplete checklist items. Hidden once all items are checked                                                            |
| **Persistence**     | Completion state is stored server-side per user. Survives logout and device changes                                                                 |
| **Progress bar**    | Horizontal bar at the top of the checklist section. Shows "3 of 7 complete" with percentage fill                                                    |
| **Item format**     | Checkbox + label + optional "Go" link that navigates to the relevant page                                                                           |
| **Dismiss**         | "Dismiss checklist" link collapses the section permanently. The user can re-enable it from their profile settings                                   |
| **Auto-completion** | Some items auto-complete when the user performs the action (e.g., "Submit your first maintenance request" marks complete when a request is created) |

**Default checklists by role**:

| Role                        | Checklist Items                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Resident (Owner/Tenant)** | Update your profile, Add emergency contacts, Set notification preferences, Submit your first maintenance request, Book an amenity, View your package history, Browse the help center |
| **Front Desk / Concierge**  | Review your shift dashboard, Log your first event, Process a package, Register a visitor, Read the shift notes, Explore keyboard shortcuts, Review the help center                   |
| **Security Guard**          | Review the security dashboard, Log your first incident, Process a visitor, Check out a key, Review emergency contacts for your building, Learn keyboard shortcuts                    |
| **Property Admin**          | Configure property settings, Set up event types, Create user accounts, Configure amenity spaces, Set notification rules, Customize the resident portal, Review reports               |

### 3.6 Article Feedback

Every article displays a feedback widget at the bottom of its content.

**Feedback flow**:

1. User sees "Was this helpful?" with thumbs-up (outlined) and thumbs-down (outlined) icons.
2. User clicks one icon. The selected icon fills solid. The other icon disappears.
3. Text changes to "Thanks for your feedback!"
4. If thumbs-down was selected, an optional text area appears: "Tell us how we can improve this article" (max 500 characters) with a "Submit" button.
5. Feedback is stored as an `ArticleFeedback` record (see Section 8).
6. A user can only submit one feedback per article. Re-visiting the article shows their previous selection (editable).

**Analytics from feedback**:

- Articles with > 30% negative feedback are flagged for review in the content management dashboard.
- Search queries that result in no clicks are logged as "unresolved searches" for content gap analysis.

---

## 4. External Knowledge Base

### 4.1 Hosting and Access

The external knowledge base is a public-facing website hosted at `help.concierge.com` (or `/help` on the main domain if a subdomain is not configured).

| Property                       | Value                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access**                     | Public. No authentication required to browse                                                                                                          |
| **SEO**                        | Fully indexed by search engines. Each article has its own URL, meta title, meta description, and Open Graph tags                                      |
| **Authentication integration** | If a logged-in user visits the knowledge base, articles are filtered by their role. If unauthenticated, only articles marked `public: true` are shown |
| **Performance**                | Static site generation (SSG) for article pages. Rebuild triggered on article publish/update. Target: < 1 second Time to First Byte                    |

### 4.2 Information Architecture

**Top-level categories**:

| #   | Category                   | Icon          | Target Audience  | Description                                                              |
| --- | -------------------------- | ------------- | ---------------- | ------------------------------------------------------------------------ |
| 1   | **Getting Started**        | `rocket`      | All roles        | Account setup, first login, profile configuration, onboarding guides     |
| 2   | **Packages & Deliveries**  | `package`     | Staff, Residents | Package logging, notifications, pickup, release workflows                |
| 3   | **Maintenance**            | `wrench`      | Staff, Residents | Submitting requests, tracking status, work orders, vendor assignment     |
| 4   | **Amenity Booking**        | `calendar`    | Staff, Residents | Reserving spaces, cancellation policies, payment, approval workflows     |
| 5   | **Security & Access**      | `shield`      | Staff            | Security console, incident reporting, key management, visitor logs       |
| 6   | **Communication**          | `megaphone`   | Staff, Residents | Announcements, notifications, email preferences                          |
| 7   | **Reports & Analytics**    | `bar-chart`   | Managers, Admins | Generating reports, exporting data, understanding dashboards             |
| 8   | **Admin Settings**         | `settings`    | Admins           | Property configuration, role management, event types, notification rules |
| 9   | **Billing & Subscription** | `credit-card` | Super Admin      | Plans, invoices, payment methods, usage                                  |
| 10  | **API & Integrations**     | `code`        | Developers       | API documentation, webhooks, SDKs, authentication                        |
| 11  | **Release Notes**          | `megaphone`   | All roles        | Changelog, new features, improvements, bug fixes                         |

### 4.3 AI-Powered Search

The knowledge base search uses the AI framework (PRD 19) to understand natural language queries.

**Search behavior**:

| Behavior            | Detail                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Input**           | Single search bar at the top of every knowledge base page. Placeholder: "Ask a question or search for help..."                                                                 |
| **Processing**      | Query is sent to the AI search endpoint. The AI generates a vector embedding and performs semantic similarity search against all article embeddings                            |
| **Results**         | Ranked list of articles with title, category badge, excerpt (highlighted match), and relevance score. Maximum 20 results per page                                              |
| **Instant answers** | For simple factual queries (e.g., "what file types can I upload"), the AI generates a one-sentence answer above the results list, citing the source article                    |
| **No results**      | If no articles match, show: "We could not find an answer to your question." followed by a "Contact Support" button and a list of popular articles                              |
| **Query logging**   | Every search query is logged with the user's role (if authenticated), results returned count, and whether the user clicked a result. Zero-click searches indicate content gaps |

### 4.4 Article Structure

Every knowledge base article follows a consistent structure:

| Element              | Required    | Description                                                                                                                                          |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**            | Yes         | Descriptive title, max 80 characters. Uses sentence case                                                                                             |
| **Category**         | Yes         | Primary category from the list in Section 4.2                                                                                                        |
| **Tags**             | Yes (min 1) | Freeform tags for cross-cutting topics (e.g., "billing", "notifications", "mobile")                                                                  |
| **Role visibility**  | Yes         | Array of roles that can see this article. `["*"]` means all roles                                                                                    |
| **Public**           | Yes         | Boolean. If `true`, visible to unauthenticated visitors on the knowledge base                                                                        |
| **Locale**           | Yes         | Language code: `en` or `fr-CA`                                                                                                                       |
| **Body**             | Yes         | MDX content. Supports headings (H2-H4), paragraphs, lists, code blocks, images, callout boxes (`info`, `warning`, `tip`, `danger`), and video embeds |
| **Excerpt**          | Yes         | Plain text summary, max 200 characters. Used in search results and article cards                                                                     |
| **Related articles** | No          | Array of up to 5 article slugs shown at the bottom of the page                                                                                       |
| **Context paths**    | No          | Array of in-app URL patterns where this article is surfaced contextually                                                                             |
| **Meta title**       | No          | SEO title override. Falls back to article title                                                                                                      |
| **Meta description** | No          | SEO description override. Falls back to excerpt                                                                                                      |

### 4.5 Release Notes

The Release Notes section is a chronological feed of platform updates.

**Release note structure**:

| Field                | Description                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| **Version**          | Semantic version string (e.g., `2.4.0`)                                   |
| **Date**             | Publication date                                                          |
| **Title**            | Summary title (e.g., "Batch package creation and improved search")        |
| **Categories**       | Tags: `new-feature`, `improvement`, `bug-fix`, `security`, `deprecation`  |
| **Body**             | MDX content describing changes with screenshots                           |
| **Breaking changes** | Boolean flag. If `true`, a warning banner is shown at the top of the note |

**Display**: Reverse-chronological list. Filterable by category tag. Each note is collapsible to show title and date only, or expandable to show full content.

---

## 5. Content Management

### 5.1 Article Editor

Super Admin and Property Admin users access the article editor from **Settings > Help Center > Manage Articles**.

**Editor features**:

| Feature                       | Description                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MDX editor**                | Split-pane editor with raw MDX on the left and live preview on the right. Syntax highlighting for Markdown and JSX components                            |
| **Toolbar**                   | Formatting buttons: bold, italic, heading levels, bulleted list, numbered list, code block, link, image, video embed, callout box                        |
| **Image upload**              | Drag-and-drop or click-to-upload. Images are stored in the media library (Section 5.4). Supported formats: JPG, PNG, GIF, WebP. Max size: 5 MB per image |
| **Auto-save**                 | Draft content is auto-saved every 30 seconds. Unsaved indicator shown in the editor header                                                               |
| **Slug generation**           | Auto-generated from the title on creation. Editable but validated for URL safety (lowercase, hyphens only, no special characters)                        |
| **Table of contents preview** | Auto-generated from H2 and H3 headings in the live preview panel                                                                                         |
| **Metadata panel**            | Collapsible right sidebar with fields for category, tags, role visibility, locale, context paths, SEO overrides, and public toggle                       |

### 5.2 Article Lifecycle

Every article moves through a defined workflow:

```
Draft → In Review → Published → Archived
  |         |            |          |
  |         |            |          +--→ (can be restored to Draft)
  |         |            |
  |         |            +--→ (can be moved to Archived or back to Draft for edits)
  |         |
  |         +--→ (reviewer approves → Published, or rejects → back to Draft with comments)
  |
  +--→ (author submits for review → In Review)
```

| State         | Who Can Transition                                                              | Visible to Users                                   |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Draft**     | Author (any admin)                                                              | No                                                 |
| **In Review** | Author submits; reviewer (Super Admin or designated editor) approves or rejects | No                                                 |
| **Published** | Reviewer approves                                                               | Yes (filtered by role and locale)                  |
| **Archived**  | Any admin                                                                       | No (removed from search index and contextual help) |

**Review notes**: When a reviewer rejects an article, they must provide a comment explaining what needs to change. The comment appears on the article's edit page.

### 5.3 Version History

Every save of a published article creates a version record.

| Field              | Description                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Version number** | Auto-incrementing integer (v1, v2, v3, ...)                                                   |
| **Saved by**       | User who made the change                                                                      |
| **Saved at**       | Timestamp                                                                                     |
| **Diff**           | Computed diff between this version and the previous version. Displayed as added/removed lines |
| **Restore**        | Any admin can restore a previous version, which creates a new version (non-destructive)       |

Maximum stored versions: 50 per article. Oldest versions beyond 50 are pruned automatically.

### 5.4 Media Library

A centralized repository for all images and videos referenced in help articles.

| Feature            | Description                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Upload**         | Drag-and-drop or click-to-browse. Supports JPG, PNG, GIF, WebP (images) and MP4, MOV (videos for thumbnail generation only -- actual videos are hosted on YouTube/Vimeo) |
| **Organization**   | Folder structure mirroring help categories. Drag-and-drop to reorganize                                                                                                  |
| **Search**         | Search by filename, alt text, or upload date                                                                                                                             |
| **Metadata**       | Each media item has: filename, alt text (required for accessibility), dimensions, file size, uploaded by, uploaded at                                                    |
| **Reuse tracking** | Shows which articles reference each media item. Prevents deletion of media still in use                                                                                  |
| **Size limits**    | Images: 5 MB max. Total media library: 10 GB per property (configurable by Super Admin)                                                                                  |

### 5.5 Multi-Language Support

Concierge supports English (`en`) and Canadian French (`fr-CA`) for help content.

| Behavior             | Detail                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Article pairing**  | Each article can have a linked translation. The article editor shows a "Translate" button that creates a new draft pre-filled with the original content for translation                           |
| **Language toggle**  | Users switch languages via a toggle in the knowledge base header and the help drawer header                                                                                                       |
| **Fallback**         | If an article does not have a translation in the user's preferred locale, the English version is shown with a banner: "This article is not yet available in French. Showing the English version." |
| **Locale detection** | The user's locale preference (from their profile settings) determines the default language. Falls back to browser `Accept-Language` header for unauthenticated visitors                           |
| **URL structure**    | Knowledge base URLs include locale prefix: `help.concierge.com/en/articles/...` and `help.concierge.com/fr-ca/articles/...`                                                                       |

---

## 6. Support Ticket System (v2)

> This section describes a v2 feature. The v1 launch includes only the "Contact Support" button that opens the user's email client with a pre-filled `mailto:` link to `support@concierge.com`.

### 6.1 Ticket Creation

Users create support tickets from the HelpDrawer by clicking the "Contact Support" button.

**Ticket form fields**:

| Field            | Type                   | Required | Validation                                                                                                    |
| ---------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| **Subject**      | Text input             | Yes      | Min 5 characters, max 200 characters                                                                          |
| **Description**  | Rich text area         | Yes      | Min 20 characters, max 5000 characters. Supports basic formatting (bold, italic, lists)                       |
| **Category**     | Select dropdown        | Yes      | Options: General Question, Bug Report, Feature Request, Billing, Account Access, **Privacy Complaint**, Other |
| **Priority**     | Select dropdown        | No       | Options: Low, Normal (default), High, Urgent                                                                  |
| **Screenshots**  | File upload (multiple) | No       | Up to 5 files. Formats: JPG, PNG, GIF. Max 5 MB each                                                          |
| **Page URL**     | Hidden field           | Auto     | Automatically captured from the page where the user opened the help drawer                                    |
| **Browser info** | Hidden field           | Auto     | User agent string for debugging (only sent if user consents in privacy settings)                              |

### 6.2 Ticket Lifecycle

```
Open → In Progress → Waiting on Customer → Resolved → Closed
  |        |               |                   |          |
  |        |               |                   |          +--→ (archived after 30 days)
  |        |               |                   |
  |        |               |                   +--→ (customer reopens → In Progress)
  |        |               |
  |        |               +--→ (customer replies → In Progress)
  |        |
  |        +--→ (agent requests info → Waiting on Customer)
  |
  +--→ (agent picks up → In Progress)
```

| State                   | Description                                                                                            | SLA Timer                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Open**                | Ticket submitted, not yet picked up by an agent                                                        | First response SLA starts                                                        |
| **In Progress**         | Agent is working on the ticket                                                                         | Resolution SLA running                                                           |
| **Waiting on Customer** | Agent asked a question, waiting for customer reply                                                     | SLA paused. Auto-close after 7 days of no response with a warning email at day 5 |
| **Resolved**            | Agent marked the issue as resolved                                                                     | Customer has 48 hours to reopen                                                  |
| **Closed**              | Finalized. No further action. Automatically closed 48 hours after Resolved if customer does not reopen | N/A                                                                              |

### 6.3 SLA Tracking

| Metric                    | Target (Business Hours)                              | Escalation                                            |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| **First response time**   | 4 hours (Normal), 1 hour (High), 30 minutes (Urgent) | Auto-escalation email to support lead if SLA breached |
| **Resolution time**       | 24 hours (Normal), 8 hours (High), 4 hours (Urgent)  | Dashboard warning at 80% of SLA window                |
| **Customer satisfaction** | Target: 90%+ "Resolved" rating                       | Tickets rated "Not resolved" are auto-reopened        |

### 6.3.1 Privacy Complaint Handling (Compliance Required)

The "Privacy Complaint" ticket category has special handling required by PIPEDA Principle 10 (Challenging Compliance), GDPR Article 77 (Right to lodge a complaint), and SOC 2 P8.1. See `docs/tech/COMPLIANCE-MATRIX.md` gap C7.

| Aspect                | Specification                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Routing**           | Privacy Complaint tickets are automatically routed to the Data Protection Officer (DPO) configured in Settings > Company > DPO Contact (see PRD 16). If no DPO is configured, tickets route to the Super Admin.                                                                                                                                   |
| **SLA**               | First response: 5 business days. Resolution: 30 calendar days (PIPEDA and GDPR requirement). These SLAs override the standard ticket SLAs.                                                                                                                                                                                                        |
| **Escalation**        | If not acknowledged within 5 business days, auto-escalate to Super Admin with a warning: "COMPLIANCE: Privacy complaint SLA at risk."                                                                                                                                                                                                             |
| **Additional fields** | When "Privacy Complaint" is selected as the category, two additional fields appear: (1) "Nature of Complaint" (dropdown: Data access denied, Data correction denied, Unauthorized data use, Data breach concern, Consent violation, Other), (2) "Affected Data" (multi-select: Personal info, Health info, Security data, Financial info, Other). |
| **Response template** | Auto-populated response template acknowledging receipt and citing the resident's right to escalate to the Privacy Commissioner of Canada (for PIPEDA) or the relevant Supervisory Authority (for GDPR).                                                                                                                                           |
| **Audit trail**       | All Privacy Complaint tickets and their resolutions are included in the DSAR Report (PRD 28 Report 7) and the Consent Records Report (PRD 28 Report 6).                                                                                                                                                                                           |
| **Retention**         | Privacy Complaint tickets are retained for 5 years after resolution (longer than standard ticket retention of 2 years) per audit trail requirements.                                                                                                                                                                                              |

### 6.4 Email Integration

- Tickets can be created by emailing `support@concierge.com`. The system parses the email subject as the ticket subject and the body as the description.
- All ticket updates (new reply from agent, status change) are sent to the user via email.
- Users can reply to ticket notification emails, and their reply is appended to the ticket thread.
- Attachments in emails are added to the ticket (subject to the same size and format limits).

---

## 7. Keyboard Shortcuts Reference

### 7.1 Shortcut Overlay

Pressing `?` (Shift + /) on any page opens a full-screen overlay listing all keyboard shortcuts.

**Overlay specifications**:

| Property         | Value                                                             |
| ---------------- | ----------------------------------------------------------------- |
| **Trigger**      | `?` key (only when no text input is focused)                      |
| **Layout**       | Centered modal, 800px wide, max 80vh height with scroll           |
| **Close**        | `Esc` key, `?` key again, or click outside                        |
| **Organization** | Shortcuts grouped by category in a multi-column grid              |
| **Print**        | "Print cheat sheet" button generates a PDF for physical reference |

### 7.2 Global Shortcuts

These shortcuts work on every page throughout the application.

| Shortcut           | Action                                   | Notes                                                                                                         |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Cmd+K` / `Ctrl+K` | Open global search                       | Focus moves to search input                                                                                   |
| `?`                | Open keyboard shortcuts overlay          | Only when no text input is focused                                                                            |
| `Esc`              | Close current dialog, drawer, or overlay | Cascading: closes the topmost element                                                                         |
| `Cmd+/` / `Ctrl+/` | Open HelpDrawer                          | Same as clicking the `?` header icon                                                                          |
| `G then D`         | Go to Dashboard                          | Sequential key press (press G, then D within 1 second)                                                        |
| `G then S`         | Go to Security Console                   | Staff roles only                                                                                              |
| `G then P`         | Go to Packages                           |                                                                                                               |
| `G then M`         | Go to Maintenance                        |                                                                                                               |
| `G then A`         | Go to Amenity Booking                    |                                                                                                               |
| `G then R`         | Go to Reports                            |                                                                                                               |
| `G then U`         | Go to Unit Management                    | Staff roles only                                                                                              |
| `G then T`         | Go to Settings                           | Admin roles only                                                                                              |
| `N`                | Create new (context-dependent)           | On Packages page: new package. On Maintenance page: new request. On Security Console: opens quick-create menu |

### 7.3 Module-Specific Shortcuts

These shortcuts work only within their respective modules.

**Security Console**:

| Shortcut                   | Action                                                           |
| -------------------------- | ---------------------------------------------------------------- |
| `F`                        | Open filter panel                                                |
| `B`                        | Toggle batch mode                                                |
| `1`-`9`                    | Quick-create entry type (1=Visitor, 2=Package, 3=Incident, etc.) |
| `Cmd+Enter` / `Ctrl+Enter` | Submit current form                                              |
| `J` / `K`                  | Navigate up/down in event list                                   |
| `Enter`                    | Open selected event detail                                       |

**Table/List Views** (Packages, Maintenance, Units, etc.):

| Shortcut           | Action                             |
| ------------------ | ---------------------------------- |
| `J` / `K`          | Navigate up/down in list           |
| `Enter`            | Open selected item                 |
| `E`                | Edit selected item (if permitted)  |
| `Cmd+E` / `Ctrl+E` | Export current view                |
| `/`                | Focus the page search/filter input |

### 7.4 Printable Cheat Sheet

The "Print cheat sheet" button in the shortcuts overlay generates a formatted PDF that includes:

- All global shortcuts
- Module-specific shortcuts for the user's role (role-filtered -- a resident does not see Security Console shortcuts)
- Concierge logo and version number in the footer
- Formatted for standard letter size (8.5 x 11 inches) single page

---

## 8. Data Model

### 8.1 HelpArticle

| Field                 | Type                | Required | Description                                                                                     |
| --------------------- | ------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `id`                  | UUID                | Auto     | Primary key                                                                                     |
| `title`               | String(80)          | Yes      | Article title, sentence case                                                                    |
| `slug`                | String(120)         | Yes      | URL-safe identifier, unique per locale. Auto-generated from title, editable                     |
| `body`                | Text (MDX)          | Yes      | Full article content in MDX format. No character limit                                          |
| `excerpt`             | String(200)         | Yes      | Plain text summary for search results and cards                                                 |
| `categoryId`          | UUID → HelpCategory | Yes      | Foreign key to the article's primary category                                                   |
| `tags`                | String[]            | Yes      | Array of freeform tag strings (min 1). Stored as a PostgreSQL text array                        |
| `roleVisibility`      | String[]            | Yes      | Array of role keys (e.g., `["resident_owner", "resident_tenant"]`). `["*"]` means all roles     |
| `public`              | Boolean             | Yes      | If `true`, visible to unauthenticated visitors on the knowledge base. Default: `false`          |
| `locale`              | String(5)           | Yes      | `en` or `fr-CA`                                                                                 |
| `translationOfId`     | UUID → HelpArticle  | No       | Links to the original article this is a translation of. `null` for originals                    |
| `contextPaths`        | String[]            | No       | Array of URL path patterns for contextual help matching                                         |
| `status`              | Enum                | Yes      | `draft`, `in_review`, `published`, `archived`. Default: `draft`                                 |
| `version`             | Integer             | Auto     | Auto-incrementing version number. Starts at 1                                                   |
| `metaTitle`           | String(70)          | No       | SEO title override                                                                              |
| `metaDescription`     | String(160)         | No       | SEO description override                                                                        |
| `relatedArticleSlugs` | String[]            | No       | Array of up to 5 article slugs                                                                  |
| `authorId`            | UUID → User         | Auto     | User who created the article                                                                    |
| `reviewerId`          | UUID → User         | No       | User who approved/rejected the article                                                          |
| `reviewNote`          | Text                | No       | Comment from reviewer (used when rejecting)                                                     |
| `publishedAt`         | Timestamp           | No       | When the article was first published                                                            |
| `lastReviewedAt`      | Timestamp           | No       | When the article was last reviewed for accuracy. Triggers a stale content flag if > 90 days old |
| `createdAt`           | Timestamp           | Auto     | Record creation timestamp                                                                       |
| `updatedAt`           | Timestamp           | Auto     | Last modification timestamp                                                                     |

**Indexes**: `slug` + `locale` (unique), `categoryId`, `status`, `locale`, `roleVisibility` (GIN), `tags` (GIN), `contextPaths` (GIN), full-text search index on `title` + `body` + `tags`.

### 8.2 HelpCategory

| Field         | Type        | Required | Description                                                                 |
| ------------- | ----------- | -------- | --------------------------------------------------------------------------- |
| `id`          | UUID        | Auto     | Primary key                                                                 |
| `name`        | String(50)  | Yes      | Category display name                                                       |
| `slug`        | String(60)  | Yes      | URL-safe identifier, unique                                                 |
| `icon`        | String(30)  | Yes      | Icon identifier from the icon library (e.g., `package`, `wrench`, `shield`) |
| `description` | String(200) | No       | Short description shown on the category page                                |
| `order`       | Integer     | Yes      | Display order in category lists. Lower numbers appear first                 |
| `locale`      | String(5)   | Yes      | `en` or `fr-CA`                                                             |
| `createdAt`   | Timestamp   | Auto     | Record creation timestamp                                                   |
| `updatedAt`   | Timestamp   | Auto     | Last modification timestamp                                                 |

**Indexes**: `slug` + `locale` (unique), `order`.

### 8.3 ArticleFeedback

| Field       | Type               | Required | Description                                             |
| ----------- | ------------------ | -------- | ------------------------------------------------------- |
| `id`        | UUID               | Auto     | Primary key                                             |
| `articleId` | UUID → HelpArticle | Yes      | The article this feedback is for                        |
| `userId`    | UUID → User        | Yes      | The user who gave feedback                              |
| `helpful`   | Boolean            | Yes      | `true` = thumbs up, `false` = thumbs down               |
| `comment`   | String(500)        | No       | Optional comment (only shown when `helpful` is `false`) |
| `createdAt` | Timestamp          | Auto     | When the feedback was submitted                         |
| `updatedAt` | Timestamp          | Auto     | When the feedback was last modified                     |

**Constraints**: Unique on `articleId` + `userId` (one feedback per user per article). Updates overwrite previous feedback.

**Indexes**: `articleId`, `userId`, `helpful`.

### 8.4 ArticleVersion

| Field       | Type               | Required | Description                         |
| ----------- | ------------------ | -------- | ----------------------------------- |
| `id`        | UUID               | Auto     | Primary key                         |
| `articleId` | UUID → HelpArticle | Yes      | The article this version belongs to |
| `version`   | Integer            | Yes      | Version number (sequential)         |
| `title`     | String(80)         | Yes      | Title at this version               |
| `body`      | Text               | Yes      | Full MDX body at this version       |
| `savedBy`   | UUID → User        | Yes      | User who saved this version         |
| `createdAt` | Timestamp          | Auto     | When this version was created       |

**Indexes**: `articleId` + `version` (unique).

### 8.5 SupportTicket (v2)

| Field                | Type            | Required | Description                                                                               |
| -------------------- | --------------- | -------- | ----------------------------------------------------------------------------------------- |
| `id`                 | UUID            | Auto     | Primary key                                                                               |
| `referenceNumber`    | String(20)      | Auto     | Human-readable reference: `SUP-{YEAR}-{SEQUENCE}` (e.g., `SUP-2026-00042`)                |
| `subject`            | String(200)     | Yes      | Ticket subject                                                                            |
| `description`        | Text            | Yes      | Rich text description, max 5000 characters                                                |
| `category`           | Enum            | Yes      | `general_question`, `bug_report`, `feature_request`, `billing`, `account_access`, `other` |
| `priority`           | Enum            | Yes      | `low`, `normal`, `high`, `urgent`. Default: `normal`                                      |
| `status`             | Enum            | Yes      | `open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`. Default: `open`       |
| `submittedBy`        | UUID → User     | Yes      | The user who created the ticket                                                           |
| `assignedTo`         | UUID → User     | No       | Support agent assigned to the ticket                                                      |
| `propertyId`         | UUID → Property | No       | Property context. Null for Super Admin tickets that are not property-specific.            |
| `pageUrl`            | String(500)     | No       | The page URL where the ticket was created                                                 |
| `browserInfo`        | String(500)     | No       | User agent string (only if user consented)                                                |
| `attachments`        | JSONB           | No       | Array of `{ filename, url, size, mimeType }` objects. Max 5 attachments                   |
| `slaFirstResponseAt` | Timestamp       | No       | When the first agent response was sent                                                    |
| `slaResolvedAt`      | Timestamp       | No       | When the ticket was marked resolved                                                       |
| `satisfactionRating` | Enum            | No       | `resolved`, `not_resolved` -- set by the customer after resolution                        |
| `createdAt`          | Timestamp       | Auto     | Ticket creation timestamp                                                                 |
| `updatedAt`          | Timestamp       | Auto     | Last modification timestamp                                                               |
| `closedAt`           | Timestamp       | No       | When the ticket was closed                                                                |

**Indexes**: `referenceNumber` (unique), `submittedBy`, `assignedTo`, `status`, `priority`, `propertyId`, `createdAt`.

### 8.6 TicketMessage (v2)

| Field         | Type                 | Required | Description                                                                    |
| ------------- | -------------------- | -------- | ------------------------------------------------------------------------------ |
| `id`          | UUID                 | Auto     | Primary key                                                                    |
| `ticketId`    | UUID → SupportTicket | Yes      | The ticket this message belongs to                                             |
| `authorId`    | UUID → User          | Yes      | Who sent the message                                                           |
| `body`        | Text                 | Yes      | Message content, max 5000 characters                                           |
| `isInternal`  | Boolean              | Yes      | If `true`, only visible to support agents (not the customer). Default: `false` |
| `attachments` | JSONB                | No       | Array of `{ filename, url, size, mimeType }` objects                           |
| `createdAt`   | Timestamp            | Auto     | When the message was sent                                                      |

**Indexes**: `ticketId`, `authorId`, `createdAt`.

### 8.7 OnboardingChecklist

| Field       | Type        | Required | Description                                                                        |
| ----------- | ----------- | -------- | ---------------------------------------------------------------------------------- | ------------------ | ------- |
| `id`        | UUID        | Auto     | Primary key                                                                        |
| `userId`    | UUID → User | Yes      | The user this checklist belongs to                                                 |
| `role`      | String      | Yes      | The user's role when the checklist was created                                     |
| `items`     | JSONB       | Yes      | Array of `{ key: string, label: string, completed: boolean, completedAt: timestamp | null, link: string | null }` |
| `dismissed` | Boolean     | Yes      | If `true`, the checklist is hidden. Default: `false`                               |
| `createdAt` | Timestamp   | Auto     | When the checklist was initialized                                                 |
| `updatedAt` | Timestamp   | Auto     | Last modification timestamp                                                        |

**Indexes**: `userId` (unique -- one checklist per user).

---

## 9. API Endpoints

### 9.1 Help Articles

| Method   | Path                                   | Description                                    | Auth     | Role                                             |
| -------- | -------------------------------------- | ---------------------------------------------- | -------- | ------------------------------------------------ |
| `GET`    | `/api/help/articles`                   | List articles with filtering and pagination    | Optional | All (filtered by role)                           |
| `GET`    | `/api/help/articles/:slug`             | Get a single article by slug                   | Optional | All (if role permitted)                          |
| `POST`   | `/api/help/articles`                   | Create a new article                           | Required | Super Admin, Property Admin                      |
| `PUT`    | `/api/help/articles/:id`               | Update an existing article                     | Required | Super Admin, Property Admin (author or reviewer) |
| `DELETE` | `/api/help/articles/:id`               | Archive an article (soft delete)               | Required | Super Admin                                      |
| `POST`   | `/api/help/articles/:id/publish`       | Transition article from In Review to Published | Required | Super Admin                                      |
| `POST`   | `/api/help/articles/:id/submit-review` | Transition article from Draft to In Review     | Required | Super Admin, Property Admin                      |

**GET `/api/help/articles` query parameters**:

| Parameter  | Type    | Description                                                                         |
| ---------- | ------- | ----------------------------------------------------------------------------------- |
| `category` | String  | Filter by category slug                                                             |
| `tag`      | String  | Filter by tag (multiple allowed)                                                    |
| `locale`   | String  | `en` or `fr-CA`. Default: user's preference or `en`                                 |
| `status`   | String  | `draft`, `in_review`, `published`, `archived`. Default for public: `published` only |
| `q`        | String  | Full-text search query                                                              |
| `page`     | Integer | Page number, 1-indexed. Default: 1                                                  |
| `limit`    | Integer | Results per page. Default: 20, max: 100                                             |
| `sort`     | String  | `relevance` (default for search), `newest`, `oldest`, `popular`                     |

### 9.2 Help Search

| Method | Path               | Description                                   | Auth     | Role                   |
| ------ | ------------------ | --------------------------------------------- | -------- | ---------------------- |
| `GET`  | `/api/help/search` | Full-text and semantic search across articles | Optional | All (filtered by role) |

**Query parameters**:

| Parameter  | Type              | Description                       |
| ---------- | ----------------- | --------------------------------- |
| `q`        | String (required) | Search query. Min 2 characters    |
| `locale`   | String            | Language filter                   |
| `category` | String            | Category filter                   |
| `limit`    | Integer           | Max results. Default: 10, max: 20 |

**Response**:

```json
{
  "query": "how do I book the party room",
  "instantAnswer": "Navigate to Amenity Booking, select the Party Room, choose a date and time, and click Reserve.",
  "instantAnswerSourceSlug": "booking-an-amenity",
  "results": [
    {
      "slug": "booking-an-amenity",
      "title": "How to Book an Amenity",
      "excerpt": "Step-by-step guide to reserving common areas...",
      "category": "amenity-booking",
      "relevanceScore": 0.95
    }
  ],
  "totalResults": 3
}
```

### 9.3 Contextual Help

| Method | Path                   | Description                                 | Auth     | Role                   |
| ------ | ---------------------- | ------------------------------------------- | -------- | ---------------------- |
| `GET`  | `/api/help/contextual` | Get articles matching the current page path | Required | All (filtered by role) |

**Query parameters**:

| Parameter | Type              | Description                                       |
| --------- | ----------------- | ------------------------------------------------- |
| `path`    | String (required) | Current page URL path (e.g., `/security-console`) |
| `locale`  | String            | Language filter. Default: user's preference       |
| `limit`   | Integer           | Max articles. Default: 5, max: 10                 |

### 9.4 Article Feedback

| Method | Path                                    | Description                                    | Auth     | Role                        |
| ------ | --------------------------------------- | ---------------------------------------------- | -------- | --------------------------- |
| `POST` | `/api/help/feedback`                    | Submit or update feedback on an article        | Required | All authenticated           |
| `GET`  | `/api/help/feedback/:articleId`         | Get the current user's feedback for an article | Required | All authenticated           |
| `GET`  | `/api/help/articles/:id/feedback-stats` | Get aggregated feedback stats for an article   | Required | Super Admin, Property Admin |

**POST `/api/help/feedback` request body**:

```json
{
  "articleId": "uuid",
  "helpful": true,
  "comment": "optional string, max 500 chars"
}
```

### 9.5 Onboarding Checklist

| Method  | Path                              | Description                                 | Auth     | Role              |
| ------- | --------------------------------- | ------------------------------------------- | -------- | ----------------- |
| `GET`   | `/api/help/onboarding`            | Get the current user's onboarding checklist | Required | All authenticated |
| `PATCH` | `/api/help/onboarding/items/:key` | Mark a checklist item as complete           | Required | All authenticated |
| `PATCH` | `/api/help/onboarding/dismiss`    | Dismiss the onboarding checklist            | Required | All authenticated |

### 9.6 Support Tickets (v2)

| Method  | Path                                | Description                                  | Auth     | Role                   |
| ------- | ----------------------------------- | -------------------------------------------- | -------- | ---------------------- |
| `POST`  | `/api/support/tickets`              | Create a new support ticket                  | Required | All authenticated      |
| `GET`   | `/api/support/tickets`              | List tickets (user sees own, agents see all) | Required | All authenticated      |
| `GET`   | `/api/support/tickets/:id`          | Get ticket detail with messages              | Required | Owner or support agent |
| `POST`  | `/api/support/tickets/:id/messages` | Add a message to a ticket                    | Required | Owner or support agent |
| `PATCH` | `/api/support/tickets/:id/status`   | Update ticket status                         | Required | Support agent          |
| `PATCH` | `/api/support/tickets/:id/assign`   | Assign a ticket to an agent                  | Required | Support agent          |

---

## 10. Permissions

### 10.1 Help Article Permissions

| Action                    | Super Admin | Property Admin              | Property Manager    | Staff Roles         | Board Member        | Resident Roles      | Unauthenticated   |
| ------------------------- | ----------- | --------------------------- | ------------------- | ------------------- | ------------------- | ------------------- | ----------------- |
| Read published articles   | Yes (all)   | Yes (all)                   | Yes (role-filtered) | Yes (role-filtered) | Yes (role-filtered) | Yes (role-filtered) | Yes (public only) |
| Search articles           | Yes         | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 | Yes (public only) |
| Create articles           | Yes         | Yes                         | No                  | No                  | No                  | No                  | No                |
| Edit articles             | Yes (all)   | Yes (own + property-scoped) | No                  | No                  | No                  | No                  | No                |
| Delete (archive) articles | Yes         | No                          | No                  | No                  | No                  | No                  | No                |
| Publish articles          | Yes         | No                          | No                  | No                  | No                  | No                  | No                |
| Submit for review         | Yes         | Yes                         | No                  | No                  | No                  | No                  | No                |
| View article analytics    | Yes         | Yes                         | No                  | No                  | No                  | No                  | No                |
| Submit feedback           | Yes         | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 | No                |
| Manage categories         | Yes         | No                          | No                  | No                  | No                  | No                  | No                |
| Manage media library      | Yes         | Yes                         | No                  | No                  | No                  | No                  | No                |

### 10.2 Support Ticket Permissions (v2)

| Action               | Super Admin | Property Admin        | All Other Authenticated Roles | Unauthenticated |
| -------------------- | ----------- | --------------------- | ----------------------------- | --------------- |
| Create ticket        | Yes         | Yes                   | Yes                           | No              |
| View own tickets     | Yes         | Yes                   | Yes                           | No              |
| View all tickets     | Yes         | Yes (property-scoped) | No                            | No              |
| Reply to ticket      | Yes         | Yes                   | Yes (own tickets only)        | No              |
| Change ticket status | Yes         | Yes                   | No                            | No              |
| Assign ticket        | Yes         | Yes                   | No                            | No              |
| View SLA analytics   | Yes         | Yes                   | No                            | No              |

### 10.3 Keyboard Shortcut Filtering

Keyboard shortcuts are role-filtered. The shortcuts overlay only shows shortcuts for modules the user has access to. For example:

- A **Resident** sees: global shortcuts, navigation shortcuts for resident-accessible pages, and table/list shortcuts.
- A **Security Guard** sees: all of the above plus Security Console shortcuts.
- A **Property Admin** sees: all shortcuts.

---

## 11. Edge Cases and Error Handling

### 11.1 Search Returns No Results

**Scenario**: User searches for a term that matches no articles.

**Behavior**:

1. Display the message: "No articles found for '{query}'."
2. Show a "Contact Support" call-to-action button below the message.
3. Show a "Popular articles" section with the top 5 most-viewed articles for the user's role.
4. Log the query as an "unresolved search" for content gap analysis.

### 11.2 Article References Inaccessible Feature

**Scenario**: An article discusses a feature that the user's plan or role does not include.

**Behavior**:

1. The article is still shown (it may contain useful context).
2. A callout banner is inserted at the top of the article: "Some features described in this article may not be available on your current plan. Contact your property administrator for details."
3. If the feature is role-restricted (e.g., admin settings article viewed by a resident via direct knowledge base link), the article is hidden from search results and contextual help but accessible via direct URL with the callout banner.

### 11.3 Video Embed Fails to Load

**Scenario**: The YouTube or Vimeo iframe fails to load (network error, blocked by firewall, or deleted video).

**Behavior**:

1. Show the video thumbnail as a static image (thumbnails are cached in the media library at article publish time).
2. Below the thumbnail, display: "Video could not be loaded."
3. Show a link: "Watch on YouTube" or "Watch on Vimeo" that opens the video URL in a new tab.
4. Log the embed failure for monitoring (articleId, videoUrl, error type, timestamp).

### 11.4 Help Drawer During Page Navigation

**Scenario**: The user navigates to a different page while the HelpDrawer is open.

**Behavior**:

1. The drawer remains open during client-side navigation (SPA routing).
2. The contextual articles section refreshes to match the new page path.
3. If the user was reading an article, the article view is preserved (not reset to the drawer home).
4. The search query (if active) is preserved across navigation.
5. On full page reload (hard refresh), the drawer state is lost and defaults to closed.

### 11.5 Stale Article Content

**Scenario**: An article's `lastReviewedAt` date is more than 90 days ago.

**Behavior**:

1. The article remains published and visible to users.
2. A subtle banner appears at the top: "This article was last reviewed on {date}. Some information may be outdated."
3. In the admin content management dashboard, stale articles are highlighted with an orange "Needs Review" badge.
4. A weekly digest email is sent to content administrators listing all stale articles.

### 11.6 Concurrent Article Editing

**Scenario**: Two administrators open the same article for editing simultaneously.

**Behavior**:

1. When a second user opens an article that is already being edited, show a warning: "This article is currently being edited by {username}. Your changes may conflict."
2. The system does not lock the article -- both editors can save.
3. If a conflict occurs (both save changes to the same version), the second save creates a new version and the administrator is shown a diff between their changes and the other editor's changes with the option to merge or overwrite.

### 11.7 Onboarding Checklist for Role Changes

**Scenario**: A user's role is changed (e.g., promoted from Security Guard to Security Supervisor).

**Behavior**:

1. The existing checklist is archived (not deleted).
2. A new checklist is generated for the new role.
3. Items that were completed in the previous role and are also present in the new role's checklist are pre-marked as complete.

### 11.8 Knowledge Base Downtime

**Scenario**: The external knowledge base at `help.concierge.com` is unreachable.

**Behavior**:

1. The in-app HelpDrawer continues to function independently (it uses the same API as the main application, not the external knowledge base).
2. The "Open in knowledge base" link on articles is hidden when the knowledge base health check fails.
3. The status page (if configured) reflects the knowledge base outage.

### 11.9 Article Translation Missing

**Scenario**: User's locale is `fr-CA` but the article has no French translation.

**Behavior**:

1. Show the English version of the article.
2. Display an info banner at the top: "Cet article n'est pas encore disponible en francais. La version anglaise est affichee." ("This article is not yet available in French. The English version is displayed.")
3. In search results, untranslated articles are shown with a small "EN" badge to indicate the language mismatch.

### 11.10 Rate Limiting on Search

**Scenario**: A user or bot sends excessive search requests.

**Behavior**:

1. Rate limit: 30 requests per minute for authenticated users, 10 requests per minute for unauthenticated visitors.
2. When the limit is reached, return HTTP 429 with the message: "Too many search requests. Please wait a moment and try again."
3. The search input shows a temporary disabled state with a countdown timer.

---

## 12. Non-Functional Requirements

### 12.1 Performance

| Metric                         | Target                           |
| ------------------------------ | -------------------------------- |
| HelpDrawer open animation      | < 200ms                          |
| Contextual article load        | < 300ms (cached), < 800ms (cold) |
| Full-text search response      | < 500ms for 95th percentile      |
| AI semantic search response    | < 1500ms for 95th percentile     |
| Knowledge base page load (SSG) | < 1 second Time to First Byte    |
| Article editor auto-save       | < 500ms round-trip               |

### 12.2 Accessibility

| Requirement            | Detail                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| WCAG 2.2 AA compliance | All help components meet AA standards                                                                       |
| Keyboard navigation    | HelpDrawer is fully navigable via keyboard (Tab, Shift+Tab, Enter, Esc)                                     |
| Screen reader support  | All articles render as semantic HTML. Images have alt text. Videos have text companions                     |
| Focus management       | When the drawer opens, focus moves to the search input. When it closes, focus returns to the trigger button |
| Reduced motion         | Drawer animation respects `prefers-reduced-motion` media query                                              |

### 12.3 Analytics

The help system tracks the following metrics for content improvement:

| Metric                                 | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| Article views (per article, per role)  | Identify most-needed content                  |
| Search queries (with results count)    | Identify content gaps (zero-result queries)   |
| Search-to-click rate                   | Measure search result quality                 |
| Feedback scores (per article)          | Identify articles needing improvement         |
| Onboarding checklist completion rate   | Measure onboarding effectiveness              |
| HelpDrawer open rate (per page)        | Identify pages where users need the most help |
| Support ticket volume (v2)             | Track self-service deflection rate            |
| Time to first article view (new users) | Measure help discoverability                  |

---

## 13. Edge Cases

| Scenario                                                        | Behavior                                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Article updated while user is reading it                        | The user continues seeing the version they opened. On next visit, they see the updated version. No in-place refresh. Articles are versioned: each edit creates a new version. The drawer does not auto-refresh open articles.            |
| AI search returns no results                                    | Display: "We could not find an answer to your question." followed by a "Contact Support" button and a list of the 5 most popular articles for the user's role. Log the query as a "zero-result search" for content gap analysis.         |
| Help article references a feature the user's role cannot access | The article is still displayed (it may be educational), but any "Go to [feature]" links within the article are hidden for that role. A note appears: "This feature is available to [role names]. Contact your administrator for access." |
| User submits feedback on a deleted article                      | If the article was soft-deleted between the user opening it and submitting feedback, the feedback is still stored (linked to the article version). The user sees "Thanks for your feedback!" as normal.                                  |
| Knowledge base SSG build fails                                  | The previous build remains live. An alert is sent to the content team. The build is retried automatically up to 3 times with 5-minute intervals. If all retries fail, the content team is notified via email with the build error log.   |
| Tooltip content missing for a tooltip key                       | Display nothing (no broken tooltip icon). Log a warning: "Missing tooltip content for key: {key}." The tooltip icon is hidden for that field until content is added.                                                                     |
| User with no role accesses the help drawer                      | Show only articles with `roleVisibility: ["*"]` (all-roles articles). This covers the edge case of a user whose role assignment is pending or in transition.                                                                             |

---

## 14. Completeness Checklist

### Feature Coverage

| #   | Requirement                                        | Status  | Section |
| --- | -------------------------------------------------- | ------- | ------- |
| 1   | In-app HelpDrawer with slide-out panel             | Covered | 3.1     |
| 2   | Contextual help (auto-detect current page)         | Covered | 3.2     |
| 3   | Tooltip system with stored content                 | Covered | 3.3     |
| 4   | Video tutorial embeds with fallback                | Covered | 3.4     |
| 5   | Role-specific onboarding checklists                | Covered | 3.5     |
| 6   | Article feedback widget (thumbs up/down + comment) | Covered | 3.6     |
| 7   | External knowledge base (public, SEO-indexed)      | Covered | 4       |
| 8   | AI-powered semantic search                         | Covered | 4.3     |
| 9   | Bilingual support (en, fr-CA)                      | Covered | 4.4     |
| 10  | Keyboard shortcut cheat sheet overlay              | Covered | 7       |
| 11  | Release notes section                              | Covered | 4.2     |
| 12  | Support ticket system (v2)                         | Covered | 10      |

### UX Coverage

| #   | Requirement                                                       | Status  | Section |
| --- | ----------------------------------------------------------------- | ------- | ------- |
| 1   | HelpDrawer responsive layout (400px desktop, full-screen mobile)  | Covered | 3.1     |
| 2   | Drawer close methods (X button, Esc key, click outside on mobile) | Covered | 3.1     |
| 3   | Article detail view within drawer                                 | Covered | 3.1     |
| 4   | Search debouncing (300ms)                                         | Covered | 3.1     |
| 5   | Empty state: no contextual articles found                         | Covered | 3.2     |
| 6   | Empty state: no search results                                    | Covered | 13      |
| 7   | Loading state: article loading                                    | Covered | 12.1    |
| 8   | Keyboard navigation (Tab, Shift+Tab, Enter, Esc)                  | Covered | 12.2    |
| 9   | Screen reader support                                             | Covered | 12.2    |

### Edge Case Coverage

| #   | Requirement                             | Status  | Section |
| --- | --------------------------------------- | ------- | ------- |
| 1   | Article updated while user reading      | Covered | 13      |
| 2   | AI search zero results                  | Covered | 13      |
| 3   | Article references inaccessible feature | Covered | 13      |
| 4   | Feedback on deleted article             | Covered | 13      |
| 5   | Knowledge base build failure            | Covered | 13      |
| 6   | Missing tooltip content                 | Covered | 13      |

---

## ADDENDUM: Gap Analysis Fixes (2026-03-17)

> Added from GAP-ANALYSIS-FINAL.md gap 25.1

### A1. Feature Request / Idea Submission from Help Center (Gap 25.1, Medium)

Industry research revealed that one platform integrates an "Idea Board" directly into the Help button, allowing users to post feature ideas and browse community suggestions. Concierge should provide a feature request pathway from the Help Center that feeds into the Community module's Idea Board (PRD 12).

#### Feature Request Entry Point

In the Help Center slide-out drawer, add a section below the search bar and above the article list:

| #   | Element            | Specification                                                                                    |
| --- | ------------------ | ------------------------------------------------------------------------------------------------ |
| 1   | Section label      | "Have a suggestion?" (gray text, small)                                                          |
| 2   | Submit Idea button | Secondary button: "Submit a Feature Request". Links to the Idea Board submission form in PRD 12. |
| 3   | Browse Ideas link  | Text link: "Browse community ideas". Links to the Idea Board listing page in PRD 12.             |

#### Behavioral Rules

1. The "Submit a Feature Request" button opens the Idea Board post form (PRD 12) in a new page (not within the Help drawer). The Help drawer closes.
2. The "Browse community ideas" link opens the Idea Board listing page.
3. If the Idea Board module is disabled for this property (via feature flags), both the button and link are hidden. No empty state -- the section simply does not render.
4. The feature request form pre-fills the category as "Feature Request" (vs. other Idea Board categories like "Improvement" or "Bug Report").
5. Staff roles see all submitted ideas. Resident roles see only ideas visible to their role.

#### External Knowledge Base Integration

On the public knowledge base at `help.concierge.com`, a "Feature Requests" link appears in the footer navigation. It links to a public-facing, read-only view of the most-upvoted ideas (top 20) with a "Log in to submit your own idea" CTA. This drives engagement and signals product transparency.

---
