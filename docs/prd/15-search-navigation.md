# 15 — Search & Navigation

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 19-AI Framework

---

## 1. Overview

Search & Navigation is the connective tissue of Concierge. It determines how users find information, move between modules, and perform actions without hunting through menus. Every role -- from a security guard logging an incident at 2 AM to a resident checking on a package -- must be able to reach what they need in three actions or fewer.

### Core Components

| Component                    | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Command Palette**          | A Cmd+K / Ctrl+K overlay that combines search, quick actions, and navigation into one interface       |
| **Role-Aware Sidebar**       | A collapsible left navigation panel that shows only the modules relevant to the logged-in user's role |
| **Breadcrumbs**              | A hierarchical path indicator showing current location and enabling backward navigation               |
| **Notification Bell**        | A persistent icon with count badges showing unread alerts across modules                              |
| **Mobile Bottom Navigation** | A fixed bottom bar replacing the sidebar on mobile devices                                            |
| **Recent Items**             | A list of the user's last 10 visited pages for quick return                                           |
| **Search History**           | A rolling record of the user's last 20 searches for repeat queries                                    |

### Why This Module Exists

Industry research revealed consistent navigation failures across competing platforms:

- Alphabetical sidebar ordering that ignores usage frequency (a security guard's most-used module was item 9 of 14)
- No keyboard shortcuts for power users
- Search limited to keyword matching with no understanding of intent
- No quick actions from search (users must navigate to a module, then find the create button)
- No badge counters on sidebar items to indicate pending work
- Duplicate navigation links wasting space
- No role-aware ordering -- everyone sees the same menu regardless of their job

Concierge addresses all of these with role-aware navigation, semantic search, a command palette for power users, and badge counters that surface pending work without requiring clicks.

---

## 2. Research Summary

### Key Findings from Competitive Analysis

| Finding             | Industry Pattern                                               | Concierge Decision                                                             |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Sidebar ordering    | Alphabetical, same for all roles                               | Role-aware ordering by usage frequency per role                                |
| Search capability   | Keyword-only, limited to specific modules                      | Semantic search across all modules with AI ranking                             |
| Quick actions       | Not available from search                                      | Command palette supports "Log package", "Create incident" directly from search |
| Badge counters      | Not present on sidebar items                                   | Real-time badge counters on relevant sidebar items                             |
| Keyboard navigation | Not observed in any platform                                   | Full keyboard navigation with Cmd+K command palette                            |
| Collapsible sidebar | Supported in one platform (icon-only mode)                     | Collapsible with icon-only mode, remembers user preference                     |
| Mobile navigation   | Not optimized                                                  | Fixed bottom bar with 4-5 role-relevant items                                  |
| Breadcrumbs         | Present in one platform                                        | Consistent breadcrumb trail on every page                                      |
| Search modes        | Two modes (full search vs. unit/people search) in one platform | Unified search with automatic scope detection                                  |
| Building filter     | Checkbox-based building selection                              | Auto-scoped to active property with multi-building toggle                      |
| Search type filters | Checkbox filters for content types (logs, maintenance, etc.)   | Smart filters that auto-suggest based on query intent                          |
| Role indicator      | Not visible in navigation                                      | Role badge shown below user name in sidebar                                    |
| Favorites/pinning   | Not supported                                                  | Users can pin frequently-used modules to the top of sidebar                    |

### Patterns Worth Adopting

1. **Collapsible sidebar with icon-only mode** -- saves screen space while maintaining navigation access
2. **Quick search in top bar** -- global search always accessible from any page
3. **Help panel integration** -- help, search, and support accessible from any page
4. **Breadcrumb navigation** -- consistent wayfinding on all pages
5. **Cross-module search** -- search across all content types from a single input

### Patterns to Avoid

1. **Alphabetical sidebar ordering** -- does not reflect real usage patterns
2. **Duplicate navigation links** -- same destination appearing in multiple places
3. **Wrong icons on navigation items** -- every item must have a semantically meaningful icon
4. **Collapse toggle styled as a navigation item** -- collapse control must be visually distinct
5. **No badge counters** -- users should not have to click into each module to discover pending items
6. **External help links** -- help should be embedded, not a context switch to a different site

---

## 3. Feature Spec

### 3.1 Command Palette (Cmd+K / Ctrl+K)

The command palette is a floating overlay that combines search, navigation, and quick actions into a single keyboard-driven interface.

#### Trigger

| Method            | Action                                                |
| ----------------- | ----------------------------------------------------- |
| Keyboard shortcut | Cmd+K (macOS) or Ctrl+K (Windows/Linux) from any page |
| Click             | Click the search icon in the top navigation bar       |
| Slash key         | Press `/` when no input field is focused              |

#### Search Input Field

| Attribute         | Value                                                             |
| ----------------- | ----------------------------------------------------------------- |
| **Field name**    | `command_palette_query`                                           |
| **Data type**     | String                                                            |
| **Max length**    | 200 characters                                                    |
| **Required**      | No (palette can open empty to show recent items)                  |
| **Default**       | Empty string                                                      |
| **Placeholder**   | "Search or type a command..."                                     |
| **Validation**    | No special characters blocked; all input is sanitized server-side |
| **Error message** | None -- any input is valid; empty results are handled gracefully  |
| **Debounce**      | 300ms after last keystroke before triggering search               |
| **Tooltip**       | "Search across all modules, jump to pages, or run quick actions"  |

**Property scoping**: Command palette results are always scoped to the user's active property. For multi-building properties, results from all buildings within the property are shown. Each result's subtitle includes the building name for disambiguation (e.g., "Unit 1205 -- Tower A"). Users can switch properties via the Property Switcher in the top bar (Section 3.8) before searching.

#### Result Categories

Results are grouped into categories, displayed in this order:

| Priority | Category          | Icon           | Description                                                           | Max Results |
| -------- | ----------------- | -------------- | --------------------------------------------------------------------- | ----------- |
| 1        | Quick Actions     | Lightning bolt | Actions the user can perform (e.g., "Log Package", "Create Incident") | 5           |
| 2        | Recent Items      | Clock          | Pages the user recently visited                                       | 5           |
| 3        | Navigation        | Compass        | Pages and modules the user can navigate to                            | 8           |
| 4        | Residents & Units | Person         | Resident names, unit numbers, contact info                            | 5           |
| 5        | Events & Packages | Box/Shield     | Open events, recent packages, active visitors                         | 5           |
| 6        | Maintenance       | Wrench         | Open service requests, equipment records                              | 5           |
| 7        | Announcements     | Megaphone      | Published and draft announcements                                     | 3           |
| 8        | Documents         | File           | Library files, uploaded documents                                     | 3           |

#### Quick Actions Available per Role

| Action              | Roles with Access                                                                             | What It Does                              |
| ------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Log Package         | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin, Super Admin | Opens the package intake form pre-focused |
| Create Incident     | Security Guard, Security Supervisor, Property Manager, Property Admin, Super Admin            | Opens the incident creation form          |
| Log Visitor         | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin, Super Admin | Opens the visitor check-in form           |
| Add Shift Note      | Concierge, Security Guard, Security Supervisor, Maintenance Staff, Property Manager           | Opens the shift note entry                |
| Submit Request      | All resident roles, Property Manager, Property Admin                                          | Opens the maintenance request form        |
| Book Amenity        | All resident roles, Concierge, Property Manager, Property Admin                               | Opens the amenity booking calendar        |
| Create Announcement | Property Manager, Property Admin, Super Admin                                                 | Opens the announcement creation form      |
| Create User         | Property Admin, Super Admin                                                                   | Opens the user creation form              |
| Run Report          | Property Manager, Security Supervisor, Board Member, Property Admin, Super Admin              | Opens the report builder                  |

#### Keyboard Navigation

| Key                         | Action                                                                   |
| --------------------------- | ------------------------------------------------------------------------ |
| Arrow Up / Arrow Down       | Move highlight through results                                           |
| Enter                       | Execute the highlighted result (navigate, open action, or select entity) |
| Escape                      | Close the command palette                                                |
| Tab                         | Move between result categories                                           |
| Cmd+K / Ctrl+K (while open) | Clear the current query and reset                                        |

#### Buttons

**Close Button (X)**

- **Position**: Top-right corner of the palette overlay
- **What it does**: Closes the command palette and returns focus to the underlying page
- **Success state**: Palette closes, page regains focus
- **Failure state**: N/A (purely client-side operation)
- **Loading state**: N/A

**"View All Results" Link**

- **Position**: Bottom of the palette, visible when results exceed display limits
- **What it does**: Navigates to the full search results page (`/search?q={query}`) with the current query pre-filled
- **Success state**: Full search page loads with results
- **Failure state**: Search page loads with error banner: "Search is temporarily unavailable. Please try again."
- **Loading state**: Link text changes to "Loading..." with spinner

#### States

| State                   | Behavior                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty (no query)**    | Shows "Recent Items" (last 10 pages visited) and "Quick Actions" (top 5 for the user's role)                                                                   |
| **Typing (debouncing)** | Shows a subtle typing indicator below the input field; previous results remain visible                                                                         |
| **Loading**             | Skeleton loader cards appear in each category section (3 skeleton rows per section)                                                                            |
| **Results found**       | Grouped results appear with category headers, icons, and keyboard-navigable highlights                                                                         |
| **No results**          | Message: "No results found for '{query}'." Below: "Try a different search term or use a quick action." Quick actions remain visible below the message.         |
| **Error**               | Message: "Search is temporarily unavailable." Below: "Quick actions and navigation are still available." Quick actions and navigation items remain functional. |
| **Offline**             | Message: "You are offline. Showing cached results only." Cached recent items and navigation items are shown.                                                   |

#### Responsive Behavior

| Breakpoint               | Behavior                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Desktop (1024px+)**    | Centered overlay, 640px wide, max 70vh height, slight background dimming       |
| **Tablet (768-1023px)**  | Centered overlay, 90% screen width, max 70vh height                            |
| **Mobile (below 768px)** | Full-screen overlay, input at top, results scroll below, swipe-down to dismiss |

---

### 3.2 Role-Aware Sidebar Navigation

The sidebar is the primary navigation element. It adapts to the user's role, showing only relevant modules with sections organized by workflow priority, not alphabetical order.

#### Sidebar Structure

| Element                    | Description                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Property Logo and Name** | Top of sidebar. Property logo (48x48px) and property name (truncated at 24 characters with tooltip for full name).    |
| **User Identity Block**    | Below property name. Avatar (32x32px), full name (truncated at 20 chars), role badge (e.g., "Concierge", "Security"). |
| **Navigation Sections**    | Grouped navigation items with section headers (e.g., "OVERVIEW", "OPERATIONS", "DAILY").                              |
| **Pinned Items**           | User-pinned modules appear at the very top of the navigation list, above sections. Max 3 pins.                        |
| **Badge Counters**         | Red circle badges on items with pending work (e.g., unreleased packages count, open requests count).                  |
| **Collapse Toggle**        | Bottom of sidebar. Chevron icon (not styled as a nav item). Toggles between full and icon-only mode.                  |

#### Navigation Items per Role

Navigation items are defined in `02-roles-and-permissions.md` Section 7. The sidebar renders only the items listed for the authenticated user's role. Items not in the user's list are completely absent -- never shown disabled or grayed out.

#### Badge Counter Rules

| Sidebar Item     | Badge Shows                                                                      | Roles That See It                                                                | Updates                                 |
| ---------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------- |
| Packages         | Count of unreleased packages for the property                                    | Concierge, Security Guard, Security Supervisor, Property Manager, Property Admin | Real-time via WebSocket                 |
| Security Console | Count of open/unresolved events from current shift                               | Security Guard, Security Supervisor, Concierge                                   | Real-time via WebSocket                 |
| Service Requests | Count of open requests (assigned to user for Maintenance; all open for managers) | Maintenance Staff, Property Manager, Property Admin                              | Real-time via WebSocket                 |
| Announcements    | Count of unread announcements                                                    | All roles                                                                        | On page load, refreshed every 5 minutes |
| Training         | Count of incomplete assigned courses                                             | All staff roles                                                                  | On page load                            |

#### Sidebar Item Fields

Each sidebar navigation item has the following attributes:

| Attribute      | Data Type            | Description                                              |
| -------------- | -------------------- | -------------------------------------------------------- |
| `id`           | String               | Unique identifier (e.g., `nav_packages`)                 |
| `label`        | String, max 30 chars | Display text (e.g., "Packages")                          |
| `icon`         | String               | Icon reference from the design system icon set           |
| `route`        | String               | URL path to navigate to (e.g., `/packages`)              |
| `section`      | String               | Section header this item belongs to (e.g., "OPERATIONS") |
| `sort_order`   | Integer              | Display order within the section                         |
| `badge_source` | String, nullable     | API endpoint for badge count (null if no badge)          |
| `expandable`   | Boolean              | Whether item has sub-items                               |
| `sub_items`    | Array, nullable      | Child navigation items                                   |
| `pinnable`     | Boolean              | Whether the user can pin this item                       |

#### Collapse Behavior

| Attribute           | Full Mode                       | Icon-Only Mode                     |
| ------------------- | ------------------------------- | ---------------------------------- |
| **Width**           | 260px                           | 64px                               |
| **Labels**          | Visible                         | Hidden (shown as tooltip on hover) |
| **Section headers** | Visible                         | Hidden                             |
| **User identity**   | Name + role visible             | Avatar only                        |
| **Property name**   | Visible                         | Logo only                          |
| **Badge counters**  | Number badge                    | Dot indicator (red dot, no number) |
| **Transition**      | 200ms ease-in-out               | 200ms ease-in-out                  |
| **Persistence**     | Stored in localStorage per user | Restored on next login             |

#### Pin/Unpin Button

- **Position**: Appears on hover over any pinnable sidebar item (pin icon to the right of the label)
- **What it does**: Toggles the item's pinned status. Pinned items move to the top of the sidebar, above section headers.
- **Success state**: Item appears at the top of the sidebar with a small pin indicator. Toast: "Pinned to top."
- **Failure state**: If 3 items are already pinned, toast: "Maximum 3 pinned items. Unpin one to add another."
- **Loading state**: N/A (client-side toggle, synced to server in background)

#### Responsive Behavior

| Breakpoint               | Behavior                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Desktop (1024px+)**    | Persistent sidebar on the left. Collapsible between full and icon-only modes.                                                                                                                          |
| **Tablet (768-1023px)**  | Sidebar defaults to icon-only mode. Expands to full on hover or tap. Overlay mode (does not push content).                                                                                             |
| **Mobile (below 768px)** | Sidebar is hidden. Replaced by mobile bottom navigation bar (see 3.5). Accessible via hamburger menu icon in top bar. When opened, slides in from left as a full-height overlay with backdrop dimming. |

---

### 3.3 Breadcrumbs

Breadcrumbs provide a hierarchical path showing where the user is within the application.

#### Structure

```
Home > [Module] > [Sub-page] > [Entity Name]
```

**Examples**:

- `Home > Packages > Non-Released`
- `Home > Security Console > Incident #INC-2026-00031`
- `Home > Units > Unit 1205 > Maintenance History`
- `Home > Reports > Security Incident Report`

#### Breadcrumb Item Fields

| Attribute    | Data Type | Max Length                              | Description                                                         |
| ------------ | --------- | --------------------------------------- | ------------------------------------------------------------------- |
| `label`      | String    | 40 characters (truncated with ellipsis) | Display text for the breadcrumb segment                             |
| `route`      | String    | 200 characters                          | URL path for the segment. Last segment has no route (current page). |
| `is_current` | Boolean   | --                                      | True for the last segment (not clickable)                           |

#### Behavior

- Each segment except the last is a clickable link.
- "Home" always links to the role-appropriate dashboard (`/dashboard`).
- On screens narrower than 768px, intermediate breadcrumb segments collapse into a "..." menu. Only the first ("Home") and last (current page) segments remain visible, with a dropdown for collapsed segments.
- Breadcrumbs never exceed 4 levels deep. If deeper navigation exists, only the last 4 levels are shown.

---

### 3.4 Notification Bell

A persistent icon in the top navigation bar that shows the total count of unread notifications.

#### Notification Bell Fields

| Attribute      | Data Type | Description                                                                   |
| -------------- | --------- | ----------------------------------------------------------------------------- |
| `unread_count` | Integer   | Total unread notifications. Displays as a red badge.                          |
| `max_display`  | Integer   | Maximum number shown in badge. Default: 99. Values above 99 display as "99+". |

#### Bell Icon Button

- **Position**: Top navigation bar, right side, before the user avatar
- **What it does**: Opens a dropdown panel showing the most recent 10 notifications
- **Success state**: Panel opens with notification list. Notifications marked as "seen" (not "read") on panel open.
- **Failure state**: Panel opens with message: "Unable to load notifications. Pull down to retry."
- **Loading state**: Panel opens with 3 skeleton notification rows

#### Notification Panel

| Element                | Description                                                                                                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**             | "Notifications" title with a "Mark All Read" text button on the right                                                                                                                                                                        |
| **Notification Items** | List of up to 10 most recent notifications. Each shows: icon (module-specific), title (max 60 chars), description (max 120 chars, truncated), timestamp (relative: "2 min ago", "1 hour ago", "Yesterday"), and unread indicator (blue dot). |
| **Empty State**        | Icon: bell with checkmark. Message: "You're all caught up!" Sub-text: "No new notifications."                                                                                                                                                |
| **Footer**             | "View All Notifications" link navigating to `/notifications`                                                                                                                                                                                 |

#### "Mark All Read" Button

- **What it does**: Marks all notifications as read, clearing the badge counter to 0
- **Success state**: All blue dots disappear. Badge counter resets to 0. Toast: "All notifications marked as read."
- **Failure state**: Toast: "Could not update notifications. Please try again."
- **Loading state**: Button text changes to "Marking..." with spinner

#### Responsive Behavior

| Breakpoint  | Behavior                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| **Desktop** | Dropdown panel, 380px wide, max 500px height, positioned below the bell icon |
| **Tablet**  | Same as desktop                                                              |
| **Mobile**  | Full-screen slide-up panel with swipe-down to dismiss                        |

---

### 3.5 Mobile Bottom Navigation

On screens below 768px, the sidebar is replaced by a fixed bottom navigation bar.

#### Bottom Bar Structure

| Attribute            | Value                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| **Height**           | 56px (plus safe area inset on notched devices)                           |
| **Background**       | White with 1px top border (#E5E5EA)                                      |
| **Items**            | 4-5 items depending on role (see table below)                            |
| **Active indicator** | Filled icon + primary color label (inactive: outlined icon + gray label) |

#### Bottom Bar Items per Role

| Role                     | Item 1    | Item 2   | Item 3        | Item 4        | Item 5 |
| ------------------------ | --------- | -------- | ------------- | ------------- | ------ |
| **Concierge**            | Dashboard | Packages | Security      | Shift Log     | More   |
| **Security Guard**       | Dashboard | Security | Packages      | Parking       | More   |
| **Security Supervisor**  | Dashboard | Security | Reports       | Shift Log     | More   |
| **Property Manager**     | Dashboard | Requests | Packages      | Announcements | More   |
| **Property Admin**       | Dashboard | Requests | Users         | Settings      | More   |
| **Maintenance Staff**    | Dashboard | Requests | Equipment     | Shift Log     | More   |
| **Resident (all types)** | Dashboard | Packages | Bookings      | Announcements | More   |
| **Board Member**         | Dashboard | Reports  | Announcements | Events        | More   |

The "More" item opens the full sidebar as a bottom sheet overlay, showing all remaining navigation items for the role.

#### Bottom Bar Item Fields

| Attribute     | Data Type            | Description                                                 |
| ------------- | -------------------- | ----------------------------------------------------------- |
| `icon`        | String               | Icon reference (outlined when inactive, filled when active) |
| `label`       | String, max 12 chars | Short label displayed below the icon                        |
| `route`       | String               | Navigation target                                           |
| `badge_count` | Integer, nullable    | Red badge count (same source as sidebar badges)             |

---

### 3.6 Full Search Results Page

When the user clicks "View All Results" from the command palette or navigates to `/search`, a dedicated full-page search experience loads.

#### URL

`/search?q={query}&type={filter}&page={page}`

#### Search Input Field (Full Page)

| Attribute         | Value                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Field name**    | `search_query`                                                                         |
| **Data type**     | String                                                                                 |
| **Max length**    | 200 characters                                                                         |
| **Required**      | No                                                                                     |
| **Default**       | Pre-filled from query parameter if present                                             |
| **Placeholder**   | "Search across all modules..."                                                         |
| **Validation**    | Sanitized server-side. No client-side restrictions.                                    |
| **Error message** | N/A                                                                                    |
| **Auto-focus**    | Yes, on page load                                                                      |
| **Tooltip**       | "Search by name, unit number, reference number, keyword, or natural language question" |

#### Filter Sidebar (Left Panel -- Desktop Only)

| Filter           | Type                                            | Options                                                                                             | Default                   |
| ---------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| **Content Type** | Checkbox group                                  | All Modules, Residents & Units, Events & Packages, Maintenance, Announcements, Documents, Amenities | All Modules (all checked) |
| **Date Range**   | Date picker (start/end)                         | Any date                                                                                            | Last 90 days              |
| **Status**       | Checkbox group                                  | Open, Closed, All                                                                                   | All                       |
| **Building**     | Checkbox group (multi-building properties only) | List of buildings                                                                                   | All buildings             |
| **Sort By**      | Radio group                                     | Relevance, Newest First, Oldest First                                                               | Relevance                 |

#### Search Results

Each result displays:

| Field          | Data Type | Max Length | Description                                                                 |
| -------------- | --------- | ---------- | --------------------------------------------------------------------------- |
| `title`        | String    | 100 chars  | Primary identifier (resident name, event title, unit number, document name) |
| `subtitle`     | String    | 200 chars  | Secondary info (unit number, event type, date, status)                      |
| `module_badge` | String    | 20 chars   | Color-coded badge indicating source module (e.g., "Package", "Incident")    |
| `timestamp`    | String    | --         | Relative or absolute timestamp                                              |
| `snippet`      | String    | 300 chars  | Contextual excerpt with search terms highlighted in bold                    |
| `route`        | String    | --         | Link to the full entity page                                                |

#### Pagination

| Attribute            | Value                                             |
| -------------------- | ------------------------------------------------- |
| **Results per page** | 20                                                |
| **Pagination style** | "Load More" button at bottom (not numbered pages) |
| **Max pages**        | 50 (1,000 results total)                          |

#### "Load More" Button

- **What it does**: Fetches the next 20 results and appends them below existing results
- **Success state**: New results appear below existing ones with a smooth scroll animation
- **Failure state**: Button text changes to "Failed to load more results. Tap to retry."
- **Loading state**: Button text changes to "Loading..." with spinner. Button disabled during load.

#### States

| State                        | Behavior                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty (no query entered)** | Shows search history (last 20 queries) and recent items (last 10 pages)                                                                                                                  |
| **Loading**                  | 6 skeleton result cards with pulsing animation                                                                                                                                           |
| **Results found**            | Grouped results with module badges, snippets, and timestamps                                                                                                                             |
| **No results**               | Icon: magnifying glass with question mark. Heading: "No results found." Sub-text: "Try different keywords or adjust your filters." Below: list of suggested searches based on the query. |
| **Error**                    | Icon: warning triangle. Heading: "Search is temporarily unavailable." Sub-text: "Please try again in a moment." Retry button.                                                            |

---

### 3.7 Search History and Recent Items

#### Search History

| Attribute        | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| **Storage**      | Server-side, per user, per property                                      |
| **Max entries**  | 20 (oldest entry drops when 21st is added)                               |
| **Displayed in** | Command palette (when empty) and full search page (when no query)        |
| **Clear option** | "Clear Search History" text button at the bottom of the history list     |
| **Privacy**      | Only visible to the user who created the entries. Not visible to admins. |

#### Recent Items

| Attribute        | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **Storage**      | Client-side (localStorage), synced to server for cross-device access   |
| **Max entries**  | 10 (oldest entry drops when 11th is added)                             |
| **Displayed in** | Command palette (when empty) and full search page sidebar              |
| **Entry fields** | Page title (max 60 chars), module icon, route, timestamp of last visit |
| **Clear option** | "Clear Recent Items" text button                                       |

#### "Clear Search History" Button

- **What it does**: Deletes all 20 search history entries for the current user at the current property
- **Success state**: History list disappears. Message: "Search history cleared."
- **Failure state**: Toast: "Could not clear history. Please try again."
- **Loading state**: Button text: "Clearing..."

#### "Clear Recent Items" Button

- **What it does**: Deletes all recent items from localStorage and server
- **Success state**: Recent items list disappears. Message: "Recent items cleared."
- **Failure state**: Toast: "Could not clear recent items. Please try again."
- **Loading state**: Button text: "Clearing..."

---

### 3.8 Top Navigation Bar

A fixed horizontal bar at the top of every page.

#### Elements

| #   | Element                     | Position                         | Description                                                                       |
| --- | --------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Hamburger Menu              | Far left (mobile/tablet only)    | Opens the sidebar overlay                                                         |
| 2   | Property Switcher           | Left (multi-property users only) | Dropdown to switch active property                                                |
| 3   | Search Icon + Shortcut Hint | Center-left                      | Magnifying glass icon with "Cmd+K" hint text. Clicking opens the command palette. |
| 4   | Notification Bell           | Right                            | Bell icon with unread count badge (see 3.4)                                       |
| 5   | User Avatar                 | Far right                        | Circular avatar with initials fallback. Click opens user menu dropdown.           |

**v2 addition -- Quick Contacts icon**: For staff roles (Concierge, Security Guard, Security Supervisor, Maintenance Staff, Property Manager), a phone icon will be added between the Notification Bell and User Avatar. Clicking it opens a dropdown panel showing: management office phone number, emergency contacts for the property, and a searchable list of vendor contacts. This addresses the high-frequency contact lookup task for front desk staff. Deferred to v2 to avoid top bar clutter at launch.

**Interaction patterns**: Each top bar element has a distinct interaction behavior:

| Element           | Click Behavior                                                                 | Interaction Type |
| ----------------- | ------------------------------------------------------------------------------ | ---------------- |
| Hamburger Menu    | Opens the sidebar as a slide-over overlay (mobile/tablet only)                 | Overlay panel    |
| Property Switcher | Opens a dropdown list of properties                                            | Dropdown         |
| Search Icon       | Opens the command palette as a centered modal overlay                          | Modal overlay    |
| Notification Bell | Opens a dropdown panel anchored to the bell icon, showing recent notifications | Dropdown panel   |
| User Avatar       | Opens a dropdown menu anchored to the avatar                                   | Dropdown menu    |

#### User Menu Dropdown

| Item                     | Route                    | Description                                                 |
| ------------------------ | ------------------------ | ----------------------------------------------------------- |
| My Account               | `/account`               | User profile and settings                                   |
| Notification Preferences | `/account/notifications` | Channel and frequency preferences                           |
| Switch Property          | (dropdown)               | List of properties user has access to (multi-property only) |
| Keyboard Shortcuts       | (modal)                  | Opens a modal listing all keyboard shortcuts                |
| Help                     | `/help`                  | Opens the help center (see 3.9 Help Center)                 |
| Sign Out                 | `/logout`                | Signs the user out and redirects to the login page          |

### 3.9 Help Center (`/help`)

The help center is an embedded page within Concierge (not an external link). It provides contextual help, searchable articles, and a path to support.

#### Layout

```
+----------------------------------------------------------------------+
|  Help Center                                              [X Close]   |
|                                                                       |
|  [Search icon] Search help articles...                               |
|                                                                       |
|  QUICK LINKS                                                          |
|  [icon] Getting Started Guide                                         |
|  [icon] Contact Management Office                                     |
|  [icon] Submit a Support Request                                      |
|  [icon] View My Support Cases                                         |
|                                                                       |
|  CONTEXTUAL HELP                                                      |
|  Articles relevant to the current page (auto-detected via route)      |
|                                                                       |
|  POPULAR ARTICLES                                                     |
|  Top 5 most-viewed help articles for this property                    |
+----------------------------------------------------------------------+
```

#### Help Article Search

| Attribute         | Value                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| **Field name**    | `help_search_query`                                                            |
| **Data type**     | String                                                                         |
| **Max length**    | 200 characters                                                                 |
| **Placeholder**   | "Search help articles..."                                                      |
| **Debounce**      | 300ms                                                                          |
| **Results**       | Up to 10 matching articles with title and excerpt. Click to open full article. |
| **Empty results** | "No articles found. Try a different search term or contact management."        |

#### Quick Links

| Link                      | Description                                                          | Visibility |
| ------------------------- | -------------------------------------------------------------------- | ---------- |
| Getting Started Guide     | Onboarding walkthrough for the user's role                           | All roles  |
| Contact Management Office | Shows property management office phone, email, and hours             | All roles  |
| Submit a Support Request  | Opens a form to create a support ticket (sent to Property Admin)     | All roles  |
| View My Support Cases     | List of the user's previously submitted support requests with status | All roles  |
| Keyboard Shortcuts        | Opens the keyboard shortcuts modal (same as top bar shortcut)        | All roles  |

#### Contextual Help

The help center detects the user's current page route and displays up to 3 relevant articles. For example, when viewing `/packages`, the contextual section shows articles about package tracking, release procedures, and notification settings.

| Attribute        | Value                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **Detection**    | Matches current route prefix to article tags (e.g., `/packages` matches articles tagged "packages") |
| **Max articles** | 3                                                                                                   |
| **Fallback**     | If no contextual articles exist for the current route, this section is hidden                       |

**v2 note**: Live chat support widget integration is deferred to v2. If live chat is added, it will appear as a floating button on the help center page and optionally on all pages (configurable by Property Admin).

### 3.10 Global Footer

A minimal footer appears at the bottom of every page, below the main content area.

#### Footer Elements

| Element              | Position     | Description                                                                                                                                  |
| -------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Copyright            | Left         | "(c) {current_year} {property_name}. Powered by Concierge."                                                                                  |
| Privacy Policy       | Center-left  | Link to `/legal/privacy`. Opens in the same window.                                                                                          |
| Terms of Service     | Center       | Link to `/legal/terms`. Opens in the same window.                                                                                            |
| System Status        | Center-right | Link to `/status`. Shows a green dot when all systems operational, yellow dot for degraded performance, red dot for outage.                  |
| Mobile App Downloads | Right        | App Store and Google Play badges linking to the Concierge mobile app. Hidden on mobile devices (users are already on the app or mobile web). |

#### Footer Fields

| Field           | Data Type | Max Length | Required | Default                                            |
| --------------- | --------- | ---------- | -------- | -------------------------------------------------- |
| copyright_text  | string    | 100 chars  | Yes      | Auto-generated from property name and current year |
| privacy_url     | string    | 255 chars  | Yes      | `/legal/privacy`                                   |
| terms_url       | string    | 255 chars  | Yes      | `/legal/terms`                                     |
| status_url      | string    | 255 chars  | Yes      | `/status`                                          |
| ios_app_url     | string    | 255 chars  | No       | null (hidden if not configured)                    |
| android_app_url | string    | 255 chars  | No       | null (hidden if not configured)                    |

#### Footer Design Rules

| Rule           | Detail                                                              |
| -------------- | ------------------------------------------------------------------- |
| **Typography** | 12px regular, #8E8E93 gray                                          |
| **Background** | White (#FFFFFF), 1px top border #E5E5EA                             |
| **Height**     | 48px                                                                |
| **Padding**    | 16px horizontal                                                     |
| **Sticky**     | Not sticky. Appears after page content ends.                        |
| **Mobile**     | Stack vertically. Copyright on top, links below. App badges hidden. |

---

## 4. Data Model

### 4.1 SearchQuery

Stores search history for users.

```
SearchQuery
├── id (UUID, auto-generated)
├── user_id → User (required)
├── property_id → Property (required)
├── query_text (varchar 200, required)
├── result_count (integer, default 0)
├── selected_result_id (UUID, nullable -- which result the user clicked)
├── selected_result_type (varchar 50, nullable -- e.g., "event", "user", "unit")
├── search_duration_ms (integer -- how long the search took)
├── ai_enhanced (boolean -- whether semantic search was used)
├── filters_applied (JSONB, nullable -- which filters were active)
├── created_at (timestamp with timezone)
```

### 4.2 RecentItem

Tracks recently visited pages per user.

```
RecentItem
├── id (UUID, auto-generated)
├── user_id → User (required)
├── property_id → Property (required)
├── page_title (varchar 60, required)
├── route (varchar 200, required)
├── module_slug (varchar 50, required -- e.g., "packages", "security")
├── entity_id (UUID, nullable -- if visiting a specific entity)
├── entity_type (varchar 50, nullable -- e.g., "event", "unit")
├── visited_at (timestamp with timezone)
```

### 4.3 NavigationPreference

Stores per-user sidebar customization.

```
NavigationPreference
├── id (UUID, auto-generated)
├── user_id → User (required, unique per user+property)
├── property_id → Property (required)
├── sidebar_collapsed (boolean, default false)
├── pinned_items (varchar[] -- array of nav item IDs, max 3)
├── updated_at (timestamp with timezone)
```

### 4.4 SearchIndex

The search index is a materialized view that aggregates searchable content from all modules into a single searchable structure.

```
SearchIndex
├── id (UUID)
├── property_id → Property (required)
├── entity_type (varchar 50 -- "event", "user", "unit", "maintenance_request", "announcement", "document", "amenity")
├── entity_id (UUID -- reference to the source entity)
├── title (varchar 200 -- primary searchable text)
├── body (text -- secondary searchable text, max 4000 chars)
├── metadata (JSONB -- module-specific fields: status, unit_number, reference_number, etc.)
├── visible_to_roles (varchar[] -- which roles can see this entry)
├── embedding (vector(1536) -- AI-generated semantic search vector, nullable)
├── last_indexed_at (timestamp with timezone)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
```

**Indexing rules**: The SearchIndex is updated whenever a source entity is created, updated, or deleted. Embeddings are generated asynchronously by the AI service and stored for semantic search queries.

---

## 5. User Flows

### 5.1 Command Palette Search (Staff -- Any Role)

1. User presses Cmd+K (or Ctrl+K, or clicks the search icon).
2. Command palette overlay appears with focus in the search input.
3. If no text is entered, the palette shows Recent Items (last 10) and Quick Actions (role-filtered).
4. User types a query (e.g., "unit 1205 packages").
5. After 300ms debounce, the system sends the query to the search API.
6. Results appear grouped by category. AI semantic search reranks results if enabled.
7. User navigates results with arrow keys or mouse.
8. User presses Enter or clicks a result.
9. Palette closes and user is navigated to the selected page.
10. The query is saved to SearchQuery history.

### 5.2 Quick Action from Command Palette (Concierge)

1. User presses Cmd+K.
2. User types "log pack" (partial match).
3. Quick Action "Log Package" appears as the first result.
4. User presses Enter.
5. Palette closes and the package intake form opens with focus on the first field.

### 5.3 Sidebar Navigation with Badge (Security Guard)

1. Security Guard logs in. Sidebar renders with role-specific items: Dashboard, Security Console (badge: 3), Packages (badge: 7), Parking, Shift Log, Training.
2. Guard sees the red "7" badge on Packages and clicks it.
3. Packages page loads showing 7 unreleased packages.
4. Guard releases a package. Badge updates to "6" in real-time via WebSocket.

### 5.4 Mobile Navigation (Resident)

1. Resident opens the app on their phone.
2. Bottom bar shows: Dashboard, Packages (badge: 2), Bookings, Announcements, More.
3. Resident taps "Packages" to see their 2 unreleased packages.
4. To access Library (not in bottom bar), resident taps "More".
5. Full navigation slides up from the bottom, showing all available modules.
6. Resident taps "Library" and is navigated to the library page.

### 5.5 Full-Page Search with Filters (Property Manager)

1. Property Manager presses Cmd+K, types "leaking", then clicks "View All Results".
2. Full search page loads with "leaking" pre-filled in the search bar.
3. Left sidebar shows filters. Manager checks "Maintenance" under Content Type.
4. Results narrow to maintenance requests containing "leaking" or semantically related terms.
5. Manager clicks "Sort By: Newest First" to see recent issues first.
6. Manager clicks a result to view the full maintenance request.

---

## 6. UI/UX

### 6.1 Command Palette Layout (Desktop)

```
+----------------------------------------------------------+
|  [magnifying glass icon]  Search or type a command...  [X]|
+----------------------------------------------------------+
|  QUICK ACTIONS                                            |
|  [lightning] Log Package                                  |
|  [lightning] Create Incident                              |
|  [lightning] Log Visitor                                  |
|                                                           |
|  RECENT ITEMS                                             |
|  [clock] Unit 1205 - Resident Profile        2 min ago    |
|  [clock] Package #PKG-2026-00147             15 min ago   |
|  [clock] Security Console                    1 hour ago   |
|                                                           |
|  RESIDENTS & UNITS                                        |
|  [person] Jane Smith - Unit 1205                          |
|  [person] John Doe - Unit 803                             |
|                                                           |
|  EVENTS & PACKAGES                                        |
|  [box] PKG-2026-00147 - Amazon - Unit 1205   Open        |
|  [shield] INC-2026-00031 - Noise Complaint   Open        |
|                                                           |
|  View all results for "query" -->                         |
+----------------------------------------------------------+
```

### 6.2 Sidebar Layout (Desktop -- Full Mode)

```
+----------------------------+
| [Logo] Property Name       |
| [Avatar] Jane Smith        |
|          Concierge         |
+----------------------------+
| * Packages [7]          [pin]|
| * Dashboard             [pin]|
+----------------------------+
| OVERVIEW                   |
|   [house] Dashboard        |
|                            |
| OPERATIONS                 |
|   [shield] Security Console|
|   [box] Packages     [7]  |
|                            |
| DAILY                      |
|   [note] Shift Log         |
|   [book] Training    [2]  |
|   [megaphone] Announcements|
+----------------------------+
|   [<<] Collapse            |
+----------------------------+
```

### 6.3 Mobile Bottom Navigation Bar

```
+--------+--------+--------+--------+--------+
| [house]| [box]  |[shield]| [note] | [...]  |
| Home   |Packages|Security| Shift  | More   |
|        |  (7)   |  (3)   | Log    |        |
+--------+--------+--------+--------+--------+
```

### 6.4 Design Rules

| Rule                       | Detail                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Typography**             | Sidebar labels: 14px medium. Section headers: 11px uppercase semibold, #8E8E93 gray. Badge text: 11px bold white on red circle.                                                                                                                                                                                                    |
| **Colors**                 | Active nav item: primary blue (#007AFF) icon and label with a 3px solid #007AFF left border bar as the active indicator. This left border provides a strong visual signal for users with color vision deficiency. Inactive: #8E8E93 gray, no left border. Badge: #FF3B30 red with white text. Sidebar background: white (#FFFFFF). |
| **Spacing**                | Sidebar items: 40px height, 16px left padding. Section headers: 24px top margin, 8px bottom margin.                                                                                                                                                                                                                                |
| **Icons**                  | 20x20px for sidebar items. Outlined when inactive, filled when active. Consistent icon set across all items.                                                                                                                                                                                                                       |
| **Transitions**            | Sidebar collapse: 200ms ease-in-out. Command palette open/close: 150ms fade-in. Result highlight: instant (no animation).                                                                                                                                                                                                          |
| **Z-index**                | Command palette: z-9999. Notification panel: z-9998. Sidebar overlay (mobile): z-9997. Bottom nav: z-9996.                                                                                                                                                                                                                         |
| **Progressive disclosure** | Sub-items hidden under expandable sections. Section headers toggle open/closed with chevron. Multiple sections can be open simultaneously.                                                                                                                                                                                         |
| **Tooltips**               | Sidebar (icon-only mode): tooltip appears after 500ms hover delay showing the full label. Command palette search input: tooltip on focus showing keyboard shortcuts.                                                                                                                                                               |

---

## 7. AI Integration

Three AI capabilities enhance Search & Navigation. All three are defined in `19-ai-framework.md` Section 4.11.

### 7.1 Semantic Search (AI Feature #85)

| Attribute                | Detail                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Understands natural language queries and returns relevant results across all modules, not just keyword matching. "Leaking faucet in unit 12" finds maintenance requests about plumbing issues in Unit 1205 even if the words do not exactly match.                            |
| **Default model**        | OpenAI Embeddings + Claude Haiku                                                                                                                                                                                                                                              |
| **Estimated cost**       | $0.001 per query                                                                                                                                                                                                                                                              |
| **Trigger**              | On every search query submitted through the command palette or full search page                                                                                                                                                                                               |
| **Input**                | Natural language query text + user's permission scope (role, property, accessible modules)                                                                                                                                                                                    |
| **Output**               | Ranked results across all modules the user has access to, ordered by semantic relevance                                                                                                                                                                                       |
| **Graceful degradation** | Falls back to keyword-only search using PostgreSQL full-text search. Results are still functional but less intelligent. User sees no error -- just potentially less relevant results.                                                                                         |
| **Default state**        | Enabled                                                                                                                                                                                                                                                                       |
| **How embeddings work**  | Every entity in the SearchIndex has a 1536-dimension vector generated when the entity is created or updated. Search queries are also converted to vectors. Results are ranked by cosine similarity between the query vector and entity vectors, filtered by role permissions. |

### 7.2 Context-Aware Suggestions (AI Feature #87)

| Attribute                | Detail                                                                                                                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Suggests search queries as the user types, based on partial input, popular queries for the user's role, and the user's recent activity. A concierge typing "pac" sees "packages unreleased", "package release unit 1205", and "package intake" -- not generic autocomplete. |
| **Default model**        | Claude Haiku                                                                                                                                                                                                                                                                |
| **Estimated cost**       | $0.0005 per suggestion request                                                                                                                                                                                                                                              |
| **Trigger**              | On typing in the command palette or search page, debounced at 300ms                                                                                                                                                                                                         |
| **Input**                | Partial query text + user role + user's recent search history + popular queries for this property                                                                                                                                                                           |
| **Output**               | Top 5 query suggestions displayed below the search input                                                                                                                                                                                                                    |
| **Graceful degradation** | Falls back to basic autocomplete on entity names (resident names, unit numbers, reference numbers). No AI suggestions shown.                                                                                                                                                |
| **Default state**        | Enabled                                                                                                                                                                                                                                                                     |

### 7.3 Cross-Module Correlation (AI Feature #86)

| Attribute                | Detail                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Personalizes search result ordering based on user role, recent activity, and query context. If a Security Guard searches "1205", the system prioritizes security events and visitor logs for Unit 1205 over maintenance requests. If a Property Manager searches the same term, maintenance requests and unit file information rank higher. |
| **Default model**        | Claude Haiku                                                                                                                                                                                                                                                                                                                                |
| **Estimated cost**       | $0.001 per re-ranking request                                                                                                                                                                                                                                                                                                               |
| **Trigger**              | After initial search results are returned, before displaying to the user                                                                                                                                                                                                                                                                    |
| **Input**                | Initial search results + user role + user's recent activity + query text                                                                                                                                                                                                                                                                    |
| **Output**               | Re-ranked results with relevance scores adjusted for the user's context                                                                                                                                                                                                                                                                     |
| **Graceful degradation** | Falls back to default relevance ranking (keyword match score only). No personalization applied.                                                                                                                                                                                                                                             |
| **Default state**        | Enabled                                                                                                                                                                                                                                                                                                                                     |

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric                     | Description                                                  | Visibility                  |
| -------------------------- | ------------------------------------------------------------ | --------------------------- |
| Total searches per day     | Count of search queries across all users                     | Property Admin, Super Admin |
| Search-to-click rate       | Percentage of searches that result in a clicked result       | Property Admin, Super Admin |
| Average results per query  | Mean number of results returned per search                   | Super Admin                 |
| Most common queries        | Top 20 search queries by frequency (last 30 days)            | Property Admin, Super Admin |
| Zero-result queries        | Queries that returned no results (indicates content gaps)    | Property Admin, Super Admin |
| Command palette usage rate | Percentage of users who use Cmd+K vs. clicking sidebar items | Super Admin                 |
| Navigation heatmap         | Which sidebar items are clicked most frequently, by role     | Property Admin, Super Admin |

### 8.2 Performance Metrics

| Metric                              | Description                                             | Target                   | Visibility  |
| ----------------------------------- | ------------------------------------------------------- | ------------------------ | ----------- |
| Search latency (P50)                | Median time from query submission to results rendered   | Under 200ms              | Super Admin |
| Search latency (P95)                | 95th percentile search latency                          | Under 500ms              | Super Admin |
| Semantic search latency             | Time added by AI semantic processing                    | Under 300ms additional   | Super Admin |
| Command palette open-to-action time | Time between opening the palette and selecting a result | Under 3 seconds (median) | Super Admin |
| Sidebar render time                 | Time to render the sidebar with badge counts            | Under 100ms              | Super Admin |

### 8.3 AI Insight Metrics

| Metric                          | Description                                                                | Visibility  |
| ------------------------------- | -------------------------------------------------------------------------- | ----------- |
| Semantic search acceptance rate | How often users click AI-ranked results vs. scrolling past them            | Super Admin |
| Suggestion acceptance rate      | How often users accept auto-suggested queries vs. typing their own         | Super Admin |
| Re-ranking improvement          | Click-through rate difference between AI-ranked and default-ranked results | Super Admin |
| AI cost per search              | Average AI cost per search query (embedding generation + re-ranking)       | Super Admin |

---

## 9. Notifications

Search & Navigation does not generate its own notifications. It is a consumer of notification data from other modules. The notification bell and badge counters aggregate counts from:

| Source Module    | Notification Type                                       | Badge Location                                     |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Packages         | New package received, package unclaimed reminder        | Sidebar "Packages" item, notification bell         |
| Security Console | New incident, escalation alert, shift change            | Sidebar "Security Console" item, notification bell |
| Maintenance      | New request assigned, status change, overdue alert      | Sidebar "Service Requests" item, notification bell |
| Amenities        | Booking confirmation, booking reminder, approval needed | Notification bell                                  |
| Announcements    | New announcement published                              | Sidebar "Announcements" item, notification bell    |
| Training         | New course assigned, course deadline approaching        | Sidebar "Training" item, notification bell         |
| Community        | New classified ad response, new event posted            | Notification bell                                  |

### Notification Bell Update Rules

| Rule                   | Detail                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Real-time updates**  | Badge count updates via WebSocket whenever a new notification arrives or is read                      |
| **Batch reading**      | Opening the notification panel marks all visible notifications as "seen" (reduces badge count)        |
| **Individual reading** | Clicking a notification marks it as "read" and navigates to the relevant page                         |
| **Max age**            | Notifications older than 30 days are auto-archived and no longer appear in the bell dropdown          |
| **Quiet hours**        | Notification bell still accumulates badges during quiet hours but does not produce sound or vibration |

---

## 10. API

### 10.1 Search

#### `GET /api/v1/search`

Global search endpoint. Returns results filtered by the authenticated user's role and permissions.

| Parameter     | Type     | Required | Default       | Description                                                                                                      |
| ------------- | -------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `q`           | string   | Yes      | --            | Search query text (max 200 chars)                                                                                |
| `type`        | string   | No       | `all`         | Content type filter: `all`, `events`, `users`, `units`, `maintenance`, `announcements`, `documents`, `amenities` |
| `status`      | string   | No       | `all`         | Status filter: `all`, `open`, `closed`                                                                           |
| `date_from`   | ISO 8601 | No       | 90 days ago   | Start date for results                                                                                           |
| `date_to`     | ISO 8601 | No       | today         | End date for results                                                                                             |
| `building_id` | UUID     | No       | all buildings | Filter by building                                                                                               |
| `sort`        | string   | No       | `relevance`   | Sort order: `relevance`, `newest`, `oldest`                                                                      |
| `page`        | integer  | No       | 1             | Page number (1-indexed)                                                                                          |
| `per_page`    | integer  | No       | 20            | Results per page (max 50)                                                                                        |
| `semantic`    | boolean  | No       | true          | Whether to use AI semantic search                                                                                |

**Response (200 OK)**:

```json
{
  "results": [
    {
      "id": "uuid",
      "entity_type": "event",
      "entity_id": "uuid",
      "title": "Package #PKG-2026-00147",
      "subtitle": "Amazon - Unit 1205 - Unreleased",
      "snippet": "Brown box delivered by **Amazon** for unit **1205**...",
      "module": "packages",
      "module_color": "#FF9900",
      "timestamp": "2026-03-14T09:30:00Z",
      "route": "/packages/uuid",
      "relevance_score": 0.94
    }
  ],
  "total": 47,
  "page": 1,
  "per_page": 20,
  "query": "amazon package 1205",
  "ai_enhanced": true,
  "search_duration_ms": 142
}
```

**Error responses**:
| Code | Condition | Body |
|------|-----------|------|
| 400 | Query exceeds 200 characters | `{ "error": "Query must be 200 characters or fewer." }` |
| 401 | Not authenticated | `{ "error": "Authentication required." }` |
| 429 | Rate limit exceeded (60 requests/minute) | `{ "error": "Too many search requests. Please wait a moment." }` |
| 500 | Search service error | `{ "error": "Search is temporarily unavailable." }` |

#### `GET /api/v1/search/suggestions`

Returns query suggestions based on partial input.

| Parameter | Type    | Required | Default | Description                      |
| --------- | ------- | -------- | ------- | -------------------------------- |
| `q`       | string  | Yes      | --      | Partial query text (min 2 chars) |
| `limit`   | integer | No       | 5       | Number of suggestions (max 10)   |

**Response (200 OK)**:

```json
{
  "suggestions": [
    { "text": "packages unreleased", "type": "query" },
    { "text": "Package #PKG-2026-00147", "type": "entity", "route": "/packages/uuid" },
    { "text": "Log Package", "type": "action", "action_id": "log_package" }
  ]
}
```

### 10.2 Recent Items

#### `GET /api/v1/me/recent-items`

Returns the user's recently visited pages.

| Parameter | Type    | Required | Default | Description              |
| --------- | ------- | -------- | ------- | ------------------------ |
| `limit`   | integer | No       | 10      | Number of items (max 20) |

#### `DELETE /api/v1/me/recent-items`

Clears all recent items for the authenticated user.

**Response (204 No Content)**: Empty body.

### 10.3 Search History

#### `GET /api/v1/me/search-history`

Returns the user's search history.

| Parameter | Type    | Required | Default | Description                |
| --------- | ------- | -------- | ------- | -------------------------- |
| `limit`   | integer | No       | 20      | Number of entries (max 50) |

#### `DELETE /api/v1/me/search-history`

Clears all search history for the authenticated user.

**Response (204 No Content)**: Empty body.

### 10.4 Navigation Preferences

#### `GET /api/v1/me/navigation-preferences`

Returns sidebar state and pinned items.

#### `PATCH /api/v1/me/navigation-preferences`

Updates sidebar collapse state or pinned items.

| Parameter           | Type     | Required | Description                          |
| ------------------- | -------- | -------- | ------------------------------------ |
| `sidebar_collapsed` | boolean  | No       | Whether sidebar is in icon-only mode |
| `pinned_items`      | string[] | No       | Array of nav item IDs (max 3)        |

**Validation errors**:
| Condition | Error |
|-----------|-------|
| More than 3 pinned items | `{ "error": "Maximum 3 pinned items allowed." }` |
| Invalid nav item ID | `{ "error": "Navigation item '{id}' not found or not available for your role." }` |

### 10.5 Notification Bell

#### `GET /api/v1/me/notifications`

Returns notifications for the authenticated user.

| Parameter     | Type    | Required | Default | Description                      |
| ------------- | ------- | -------- | ------- | -------------------------------- |
| `limit`       | integer | No       | 10      | Number of notifications (max 50) |
| `unread_only` | boolean | No       | false   | Filter to unread only            |

#### `PATCH /api/v1/me/notifications/mark-all-read`

Marks all notifications as read for the authenticated user.

**Response (200 OK)**:

```json
{ "marked_count": 12 }
```

### 10.6 Rate Limits

| Endpoint                         | Limit        | Window     |
| -------------------------------- | ------------ | ---------- |
| `GET /api/v1/search`             | 60 requests  | Per minute |
| `GET /api/v1/search/suggestions` | 120 requests | Per minute |
| `GET /api/v1/me/notifications`   | 30 requests  | Per minute |
| All other endpoints              | 120 requests | Per minute |

---

## 11. Completeness Checklist

| #   | Requirement                                                           | Status     | Section                                               |
| --- | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| 1   | Command palette triggered by Cmd+K / Ctrl+K                           | Defined    | 3.1                                                   |
| 2   | Command palette triggered by click on search icon                     | Defined    | 3.1                                                   |
| 3   | Command palette triggered by `/` key                                  | Defined    | 3.1                                                   |
| 4   | Quick actions filtered by user role                                   | Defined    | 3.1                                                   |
| 5   | Search results grouped by category                                    | Defined    | 3.1                                                   |
| 6   | Keyboard navigation (arrows, enter, escape, tab)                      | Defined    | 3.1                                                   |
| 7   | Semantic search across all modules                                    | Defined    | 7.1                                                   |
| 8   | Context-aware query suggestions                                       | Defined    | 7.2                                                   |
| 9   | Cross-module result re-ranking by role                                | Defined    | 7.3                                                   |
| 10  | Role-aware sidebar navigation                                         | Defined    | 3.2                                                   |
| 11  | Sidebar items per role (12 roles)                                     | Referenced | 3.2 (defers to 02-roles-and-permissions.md Section 7) |
| 12  | Badge counters with real-time updates                                 | Defined    | 3.2                                                   |
| 13  | Sidebar collapse (full/icon-only) with persistence                    | Defined    | 3.2                                                   |
| 14  | Sidebar pinning (max 3 items)                                         | Defined    | 3.2                                                   |
| 15  | Breadcrumb navigation on every page                                   | Defined    | 3.3                                                   |
| 16  | Breadcrumb responsive collapse on mobile                              | Defined    | 3.3                                                   |
| 17  | Notification bell with count badge                                    | Defined    | 3.4                                                   |
| 18  | Notification panel with 10 most recent items                          | Defined    | 3.4                                                   |
| 19  | Mark all notifications as read                                        | Defined    | 3.4                                                   |
| 20  | Mobile bottom navigation bar                                          | Defined    | 3.5                                                   |
| 21  | Bottom bar items per role (8 role groups)                             | Defined    | 3.5                                                   |
| 22  | "More" item opens full navigation                                     | Defined    | 3.5                                                   |
| 23  | Full search results page with filters                                 | Defined    | 3.6                                                   |
| 24  | Search filters: content type, date, status, building, sort            | Defined    | 3.6                                                   |
| 25  | Pagination via "Load More" button                                     | Defined    | 3.6                                                   |
| 26  | Search history (20 entries, server-side)                              | Defined    | 3.7                                                   |
| 27  | Recent items (10 entries, client + server sync)                       | Defined    | 3.7                                                   |
| 28  | Clear search history button                                           | Defined    | 3.7                                                   |
| 29  | Clear recent items button                                             | Defined    | 3.7                                                   |
| 30  | Top navigation bar with property switcher                             | Defined    | 3.8                                                   |
| 31  | User menu dropdown with sign out                                      | Defined    | 3.8                                                   |
| 32  | Desktop responsive behavior (1024px+)                                 | Defined    | 3.1, 3.2, 3.4                                         |
| 33  | Tablet responsive behavior (768-1023px)                               | Defined    | 3.1, 3.2, 3.4                                         |
| 34  | Mobile responsive behavior (below 768px)                              | Defined    | 3.1, 3.2, 3.4, 3.5                                    |
| 35  | Empty states for all components                                       | Defined    | 3.1, 3.4, 3.6                                         |
| 36  | Loading states for all components                                     | Defined    | 3.1, 3.4, 3.6                                         |
| 37  | Error states for all components                                       | Defined    | 3.1, 3.4, 3.6                                         |
| 38  | Offline state for command palette                                     | Defined    | 3.1                                                   |
| 39  | Tooltips for complex features                                         | Defined    | 3.1, 6.4                                              |
| 40  | Progressive disclosure (sub-items, expandable sections)               | Defined    | 6.4                                                   |
| 41  | Data model for search queries                                         | Defined    | 4.1                                                   |
| 42  | Data model for recent items                                           | Defined    | 4.2                                                   |
| 43  | Data model for navigation preferences                                 | Defined    | 4.3                                                   |
| 44  | Data model for search index with embeddings                           | Defined    | 4.4                                                   |
| 45  | API: search endpoint with all parameters                              | Defined    | 10.1                                                  |
| 46  | API: suggestions endpoint                                             | Defined    | 10.1                                                  |
| 47  | API: recent items CRUD                                                | Defined    | 10.2                                                  |
| 48  | API: search history CRUD                                              | Defined    | 10.3                                                  |
| 49  | API: navigation preferences CRUD                                      | Defined    | 10.4                                                  |
| 50  | API: notification bell endpoints                                      | Defined    | 10.5                                                  |
| 51  | API: rate limits defined                                              | Defined    | 10.6                                                  |
| 52  | Operational analytics (searches/day, click rate, zero-result queries) | Defined    | 8.1                                                   |
| 53  | Performance analytics (latency targets)                               | Defined    | 8.2                                                   |
| 54  | AI analytics (acceptance rate, cost per search)                       | Defined    | 8.3                                                   |
| 55  | Notification aggregation from all modules                             | Defined    | 9                                                     |

---

## ADDENDUM: Search Indexing Delay Tolerance

> Added from PRD Quality Audit (2026-03-17). Specifies exact behavior when a user searches immediately after creating or updating a record.

### Indexing Delay Specification

| Parameter                                    | Value                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maximum indexing delay (write to searchable) | 2 seconds                                                                                                                                                                                                                                                                                                                                                                                           |
| Indexing mechanism                           | Synchronous index update on write path for the primary search fields (name, unit number, reference number). Asynchronous background job for full-text and embedding updates within 2 seconds.                                                                                                                                                                                                       |
| User feedback during delay                   | If a user creates a record and immediately searches for it (within 2 seconds), and the record does not appear in results, the search results page displays: "Recently created items may take a few seconds to appear in search. Try again in a moment." This message appears only when the search query matches a record the current user created within the last 10 seconds (tracked client-side). |

### Search Consistency Model

| Scenario                                        | Behavior                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record created, searched within 500ms           | Record appears in results (synchronous primary index covers name, unit number, reference number fields).                                                                                      |
| Record created, full-text searched within 500ms | Record may not appear. Client-side hint message displayed. Record appears within 2 seconds.                                                                                                   |
| Record deleted, searched within 500ms           | Record no longer appears in results (synchronous delete from index).                                                                                                                          |
| Record updated, searched for old value          | Old value returns no results within 2 seconds of update.                                                                                                                                      |
| Embedding generation fails (AI unavailable)     | Semantic search (natural language queries) returns no results for the affected record. Keyword search still works. Background job retries embedding generation every 5 minutes up to 3 times. |

---

_End of document._
