# 29 -- Digital Signage

> **Status**: Draft
> **Last updated**: 2026-03-17
> **Owner**: Product
> **Depends on**: 01-Architecture (Multi-Tenancy, Real-Time Updates), 02-Roles and Permissions, 09-Communication (Emergency Broadcast, Announcements), 19-AI Framework

---

## 1. Overview

### What It Is

Digital Signage is a centralized content management system for building display screens. Property managers connect one or many screens throughout a building -- lobby monitors, elevator area displays, gym TVs, party room screens, mail room monitors -- and control exactly what content appears on each screen, when it appears, and for how long. Think of it like a restaurant TV system: connect the display, push content, and manage everything from a single dashboard.

The module provides a playlist-based scheduling engine, a template library for common layouts, media upload and management, real-time push updates, screen grouping by location, and deep integration with three existing Concierge modules: Announcements (auto-display toggled announcements), Weather (always-on widget), and Emergency Broadcast (immediate full-screen takeover of all connected screens).

### Why It Exists

Buildings have screens everywhere -- lobby TVs, elevator displays, gym monitors, common area screens -- but most management platforms either ignore them entirely or offer a basic announcement ticker. The result is that buildings either pay for a separate digital signage vendor (creating yet another tool to manage) or leave their screens showing cable news channels that no one reads.

Industry research across three production platforms revealed limited digital signage support:

1. **Basic lobby display** -- One platform offered a "virtual concierge board" that displayed announcements on a public URL. No scheduling, no media support, no templates, no screen grouping. Essentially a web page on a TV.
2. **Public display configuration** -- One platform had a "Public Display" feature with display duration settings and rotation order. Better than nothing, but still limited to text announcements.
3. **No digital signage** -- One platform had no screen display capability at all.

None of the observed platforms offered playlist scheduling, media uploads, template-based layouts, screen groups, weather integration, or emergency takeover. This is a significant gap. Buildings are spending $50-200/month on third-party digital signage tools that do not integrate with their management platform. Concierge eliminates that cost and complexity by building digital signage directly into the platform.

### Which Roles Use It

| Role                       | Access Level                             | Primary Use                                                                          |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| **Super Admin**            | Unrestricted                             | Global signage settings, default templates, system-wide configuration                |
| **Property Admin**         | Full configuration + content management  | Register screens, create screen groups, manage templates, configure defaults         |
| **Property Manager**       | Full content management                  | Create and schedule playlists, upload media, push content, manage day-to-day signage |
| **Front Desk / Concierge** | Create and edit content (limited config) | Upload media, create slides, schedule content for their shift                        |
| **Security Guard**         | View-only + emergency override           | Monitor screen status, trigger emergency display (if permitted by admin)             |

Roles that do **not** access Digital Signage: Board Member (no operational screen management), Resident (Owner), Resident (Tenant), Family Member, Maintenance Staff. These roles never see Digital Signage in their navigation.

### Module Scope

| Area                    | What It Covers                                                        |
| ----------------------- | --------------------------------------------------------------------- |
| **Screen Management**   | Register, name, group, and monitor connected display devices          |
| **Content Creation**    | Create slides with text, images, videos, and structured layouts       |
| **Media Library**       | Upload, organize, and reuse images and videos across playlists        |
| **Template System**     | Pre-built and custom layouts for common display scenarios             |
| **Playlist Engine**     | Ordered sequences of slides with configurable duration per slide      |
| **Scheduling**          | Time-based and date-based scheduling of playlists to screen groups    |
| **Real-Time Push**      | Instant content updates pushed to all connected screens via WebSocket |
| **Screen Groups**       | Logical grouping of screens by location for bulk content assignment   |
| **Preview**             | WYSIWYG preview of exactly what each screen will display              |
| **Emergency Takeover**  | Immediate full-screen emergency message on all screens                |
| **Module Integrations** | Auto-display of announcements, weather widget, emergency broadcasts   |
| **Analytics**           | Screen uptime, content play counts, schedule adherence                |

**Out of scope**: Hardware procurement or installation (property provides their own screens), video conferencing or intercom functionality, interactive touch-screen interfaces (all displays are passive/view-only), resident-submitted content (all content is staff-managed).

### Key Decisions

| Decision                                     | Rationale                                                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web-based display renderer (no native app)   | Screens load a URL in a browser. No app installation required. Works on any device with a browser -- Smart TVs, Chromecasts, Fire TV Sticks, dedicated signage players, or any computer connected to a monitor.                             |
| Playlist-based scheduling (not single-slide) | Buildings need different content at different times. Morning lobby content differs from evening content. Playlists with schedules solve this without manual intervention.                                                                   |
| Template system with pre-built layouts       | Non-technical property managers need to create professional-looking displays without design skills. Templates provide guardrails and speed.                                                                                                 |
| Emergency broadcast takes over ALL screens   | Life safety overrides aesthetics. When an emergency broadcast is sent via the Communication module, every connected screen immediately displays the emergency message. No configuration needed -- this is automatic and cannot be disabled. |
| No interactive/touch capabilities            | Building displays are passive monitors. Adding touch creates maintenance burden, accessibility challenges, and security risks. Content is view-only.                                                                                        |
| Vertical and horizontal orientation support  | Buildings have screens in both orientations. Elevator screens are often vertical. Lobby screens are often horizontal. Content must adapt.                                                                                                   |

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across three production platforms revealed the following patterns and gaps related to digital signage and lobby display:

| Capability                               | Where Observed   | Our Approach                                                                                                                                       |
| ---------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public display URL for announcements** | 2 of 3 platforms | Adopt and extend massively. Our display URL supports full playlists with media, templates, scheduling, and weather -- not just text announcements. |
| **Display duration per announcement**    | 1 of 3 platforms | Adopt. Extended to per-slide duration within playlists, with configurable defaults.                                                                |
| **Rotation order configuration**         | 1 of 3 platforms | Adopt. Extended to full playlist ordering with drag-and-drop reordering.                                                                           |
| **No authentication on display URL**     | 1 of 3 platforms | Adopt. Display URLs are public, read-only endpoints. No login required. Screens just load a URL.                                                   |
| **Auto-refresh for new content**         | 1 of 3 platforms | Adopt and improve. We use WebSocket push instead of polling. Content updates appear on screens within 2 seconds, not 5 minutes.                    |

### Best Practices Adopted

1. **WebSocket-powered real-time updates** -- screens receive content changes instantly via persistent WebSocket connection, eliminating the 5-minute polling delay observed in competitors
2. **Template-based design** -- non-technical users create professional displays using pre-built, customizable templates rather than free-form design tools
3. **Screen groups for bulk management** -- assign content to "All Lobby Screens" or "Elevator Displays" in one action instead of configuring each screen individually
4. **Emergency takeover is automatic** -- emergency broadcasts from the Communication module (PRD 09) automatically take over all screens without any additional configuration or manual intervention
5. **Orientation-aware rendering** -- content adapts to screen orientation (landscape or portrait) automatically based on the registered screen configuration
6. **Offline resilience** -- if the screen loses network connectivity, it continues displaying the last received playlist in a loop until reconnection

### Pitfalls Avoided

1. **No polling-based refresh** -- polling every 5 minutes means emergency content takes up to 5 minutes to appear. WebSocket push delivers in under 2 seconds.
2. **No text-only displays** -- text announcements on a TV look dated and unprofessional. Templates with images, weather, and structured layouts create a modern building experience.
3. **No manual screen-by-screen management** -- managing 8 screens individually is tedious and error-prone. Screen groups solve this.
4. **No app installation requirement** -- requiring a proprietary app on each display device limits hardware choices and creates update headaches. A browser URL works everywhere.
5. **No unmanaged emergency gap** -- if emergency broadcasts do not automatically appear on screens, someone must manually trigger it during a crisis. Automatic takeover removes that risk.
6. **No content without scheduling** -- a display that shows the same content 24/7 becomes invisible to residents. Scheduled playlists keep content fresh and relevant.

### Concierge Differentiators (Not Found in Any Observed Platform)

1. **Full playlist engine with scheduling** -- time-of-day and date-range scheduling for automated content rotation
2. **Template system with 8+ pre-built layouts** -- professional displays without design skills
3. **Media library with reusable assets** -- upload once, use across multiple playlists and templates
4. **Screen groups with bulk assignment** -- manage all lobby screens or all elevator screens as a single unit
5. **WYSIWYG preview** -- see exactly what the screen will display before publishing
6. **Weather widget integration** -- always-on weather display sourced from the property's location
7. **Announcement module integration** -- announcements auto-appear on screens when the "Digital Signage" channel is toggled
8. **Emergency broadcast auto-takeover** -- zero-configuration emergency display on all screens
9. **AI-powered content suggestions** -- generate slide text, suggest optimal scheduling, and auto-create holiday content
10. **Vertical and horizontal orientation** -- full support for both screen orientations with orientation-aware templates

---

## 3. Feature Specification

### 3.1 Core Features (v1)

#### 3.1.1 Screen Registration

Property Admin or Property Manager registers each physical display screen in the system.

**Entry Point**: Digital Signage > Screens > "Add Screen"

**Add Screen Form**:

| #   | Field         | Type                  | Required    | Max Length | Default          | Validation                                                                                                  | Error Message                                                                                    |
| --- | ------------- | --------------------- | ----------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Screen Name   | Text input            | Yes         | 100 chars  | Empty            | Min 2 chars, unique per property                                                                            | "Screen name must be unique within your property."                                               |
| 2   | Location      | Text input            | Yes         | 200 chars  | Empty            | Min 2 chars                                                                                                 | "Enter the screen location (e.g., Main Lobby, Elevator B, Gym)."                                 |
| 3   | Building      | Dropdown              | Conditional | --         | Property default | Required for multi-building properties. Must select from existing buildings.                                | "Please select a building."                                                                      |
| 4   | Floor         | Text input            | No          | 10 chars   | Empty            | --                                                                                                          | --                                                                                               |
| 5   | Orientation   | Radio group           | Yes         | --         | Landscape        | One of: Landscape (16:9), Portrait (9:16)                                                                   | --                                                                                               |
| 6   | Resolution    | Dropdown              | Yes         | --         | 1920x1080        | Options: 1920x1080 (Full HD), 3840x2160 (4K), 1080x1920 (Full HD Portrait), 2160x3840 (4K Portrait), Custom | "Please select a resolution."                                                                    |
| 7   | Custom Width  | Number                | Conditional | 5 digits   | --               | Required if Resolution = Custom. Range: 640-7680                                                            | "Width must be between 640 and 7680 pixels."                                                     |
| 8   | Custom Height | Number                | Conditional | 5 digits   | --               | Required if Resolution = Custom. Range: 480-4320                                                            | "Height must be between 480 and 4320 pixels."                                                    |
| 9   | Screen Group  | Multi-select dropdown | No          | --         | None             | Select from existing groups                                                                                 | --                                                                                               |
| 10  | Description   | Textarea              | No          | 500 chars  | Empty            | --                                                                                                          | Tooltip: "Internal notes about this screen (e.g., model, connection type, maintenance contact)." |
| 11  | Active        | Toggle                | Yes         | --         | true             | --                                                                                                          | --                                                                                               |

**On Save**:

1. System generates a unique display URL: `https://{domain}/display/{property-slug}/{screen-slug}`
2. System generates a 6-digit pairing code (valid for 15 minutes) for easy screen setup
3. Success toast: "Screen '{name}' registered. Display URL and pairing code are ready."
4. Redirect to Screen Detail page showing the URL, QR code, and pairing code

**Screen Detail Page**:

| Section                | Content                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Display URL**        | Full URL with "Copy" button. QR code image (scannable by Smart TVs).                                                                                                                              |
| **Pairing Code**       | Large 6-digit code with countdown timer (15 minutes). "Generate New Code" button.                                                                                                                 |
| **Setup Instructions** | Step-by-step: "1. Open the browser on your display device. 2. Navigate to the URL above (or scan the QR code). 3. The screen will display 'Waiting for content...' until a playlist is assigned." |
| **Connection Status**  | Green dot + "Connected" or Red dot + "Disconnected". Last seen timestamp. Device info (user agent).                                                                                               |
| **Current Content**    | Thumbnail of what is currently displayed on this screen. "N/A" if no playlist assigned.                                                                                                           |
| **Assigned Playlists** | Table of playlists assigned to this screen (via direct assignment or screen group).                                                                                                               |
| **Screen Settings**    | Edit button to modify name, location, orientation, resolution, group, description, active status.                                                                                                 |

**Action Buttons**:

| Button                  | Style                   | Action                                                                                   | Loading State   | Success State                                     | Failure State                                             |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Push Content Now        | Primary                 | Opens playlist selector to immediately push a playlist to this screen                    | "Pushing..."    | Toast: "Content pushed to '{screen name}'."       | Toast: "Failed to push content. Check screen connection." |
| Preview                 | Secondary               | Opens a browser window showing exactly what this screen displays                         | Window opens    | Preview loads                                     | Toast: "Preview unavailable. No content assigned."        |
| Regenerate Pairing Code | Tertiary (text link)    | Generates a new 6-digit code, invalidates the old one                                    | "Generating..." | New code displayed with fresh 15-minute timer     | Toast: "Failed to generate code."                         |
| Delete Screen           | Danger (text link, red) | Confirmation: "Remove '{name}' from Digital Signage? The display URL will stop working." | "Removing..."   | Toast: "Screen removed." Redirect to screen list. | Toast: "Failed to remove screen."                         |

#### 3.1.2 Screen List

**Entry Point**: Digital Signage > Screens

**Screen List Table**:

| #   | Column          | Sortable           | Format                                                               |
| --- | --------------- | ------------------ | -------------------------------------------------------------------- |
| 1   | Status          | No                 | Green dot (connected) / Red dot (disconnected) / Gray dot (inactive) |
| 2   | Screen Name     | Yes                | Clickable link to Screen Detail                                      |
| 3   | Location        | Yes                | Text                                                                 |
| 4   | Building        | Yes                | Building name (multi-building only)                                  |
| 5   | Orientation     | No                 | Icon: landscape rectangle or portrait rectangle                      |
| 6   | Screen Group(s) | No                 | Comma-separated group names, or "Ungrouped"                          |
| 7   | Current Content | No                 | Playlist name or "No content" (muted text)                           |
| 8   | Last Seen       | Yes (default sort) | Relative time ("2 min ago") with full timestamp on hover             |
| 9   | Actions         | No                 | Overflow menu: Edit, Push Content, Preview, Delete                   |

**Filter Bar**:

| #   | Filter       | Type       | Default         | Options                                                                              |
| --- | ------------ | ---------- | --------------- | ------------------------------------------------------------------------------------ |
| 1   | Search       | Text input | Empty           | Searches across screen name, location, description. Placeholder: "Search screens..." |
| 2   | Status       | Dropdown   | "All"           | All, Connected, Disconnected, Inactive                                               |
| 3   | Screen Group | Dropdown   | "All Groups"    | All Groups + configured group list + "Ungrouped"                                     |
| 4   | Building     | Dropdown   | "All Buildings" | All Buildings + building list (multi-building only)                                  |
| 5   | Orientation  | Dropdown   | "All"           | All, Landscape, Portrait                                                             |

**Empty State**: "No screens registered yet. Add your first screen to start displaying content on your building's monitors."

Action: "Add Screen" primary button.

Illustration: Monitor icon with a plus sign.

**Loading State**: Table skeleton with 4 pulsing rows.

#### 3.1.3 Screen Groups

Screen groups allow bulk content assignment. Instead of assigning a playlist to each of 4 lobby screens individually, the admin creates a "Lobby" group and assigns the playlist once.

**Entry Point**: Digital Signage > Screen Groups

**Create Screen Group Form**:

| #   | Field               | Type                         | Required | Max Length | Default   | Validation                         | Error Message                                                                                                                                     |
| --- | ------------------- | ---------------------------- | -------- | ---------- | --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Group Name          | Text input                   | Yes      | 100 chars  | Empty     | Min 2 chars, unique per property   | "A screen group with this name already exists."                                                                                                   |
| 2   | Description         | Text input                   | No       | 200 chars  | Empty     | --                                 | --                                                                                                                                                |
| 3   | Screens             | Multi-select with checkboxes | Yes      | --         | Empty     | At least 1 screen selected         | "Please select at least one screen for this group."                                                                                               |
| 4   | Default Orientation | Radio group                  | Yes      | --         | Landscape | One of: Landscape, Portrait, Mixed | Tooltip: "Select 'Mixed' if this group contains both landscape and portrait screens. Content will adapt to each screen's individual orientation." |

**Screen Group List Table**:

| #   | Column           | Sortable | Format                                                  |
| --- | ---------------- | -------- | ------------------------------------------------------- |
| 1   | Group Name       | Yes      | Clickable link to edit                                  |
| 2   | Screens          | No       | Count (e.g., "4 screens") with expandable list on click |
| 3   | Current Playlist | No       | Active playlist name or "No content"                    |
| 4   | Created By       | Yes      | Staff name                                              |
| 5   | Actions          | No       | Edit, Push Content, Delete                              |

**System Default Groups** (created automatically, editable):

- **All Screens** -- always contains every active screen. Cannot be deleted. Updated automatically when screens are added or removed.

**Empty State**: "No screen groups created yet. Group your screens by location to manage content more efficiently."

Action: "Create Group" primary button.

#### 3.1.4 Media Library

Central repository for images and videos used across playlists and slides.

**Entry Point**: Digital Signage > Media Library

**Upload Media Form**:

| #   | Field  | Type                              | Required | Max Length               | Default         | Validation                                                                                                                       | Error Message                                                                                                                                                                                                             |
| --- | ------ | --------------------------------- | -------- | ------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Files  | Drag-and-drop file upload (multi) | Yes      | 10 files per upload      | --              | Images: JPG, PNG, WebP, SVG. Max 10 MB each. Min 800px on shortest side. Videos: MP4, WebM. Max 200 MB each. Max 5 min duration. | "File '{name}' exceeds the maximum size." / "File type not supported. Accepted: JPG, PNG, WebP, SVG, MP4, WebM." / "Video exceeds 5-minute maximum duration." / "Image must be at least 800 pixels on the shortest side." |
| 2   | Folder | Dropdown + "New Folder"           | No       | 100 chars                | "Uncategorized" | --                                                                                                                               | --                                                                                                                                                                                                                        |
| 3   | Tags   | Tag input (multi)                 | No       | 50 chars per tag, max 10 | Empty           | Alphanumeric and hyphens                                                                                                         | "Tags can only contain letters, numbers, and hyphens."                                                                                                                                                                    |

**Media Grid View**:

Each media item displays as a card:

| Card Element    | Description                                                                |
| --------------- | -------------------------------------------------------------------------- |
| **Thumbnail**   | Image preview or video frame. 16:9 aspect ratio crop.                      |
| **Filename**    | Truncated at 30 chars with ellipsis. Full name on hover.                   |
| **Type Badge**  | "Image" (blue) or "Video" (purple) with duration for videos (e.g., "0:45") |
| **File Size**   | Formatted (e.g., "2.4 MB")                                                 |
| **Upload Date** | Relative time                                                              |
| **Used In**     | Count of playlists using this media. "Not used" if zero (muted text).      |

**Card Actions** (overflow menu):

| Action       | Label      | Behavior                                                                                                                     |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Preview      | "Preview"  | Opens lightbox with full-size image or video player                                                                          |
| Download     | "Download" | Downloads original file                                                                                                      |
| Edit Details | "Edit"     | Inline edit: rename, change folder, update tags                                                                              |
| Copy URL     | "Copy URL" | Copies the CDN URL to clipboard                                                                                              |
| Delete       | "Delete"   | Confirmation: "Delete '{filename}'? This media is used in {N} playlist(s). Slides using this media will show a placeholder." |

**Filter Bar**:

| #   | Filter | Type       | Default        | Options                                                                  |
| --- | ------ | ---------- | -------------- | ------------------------------------------------------------------------ |
| 1   | Search | Text input | Empty          | Searches across filename, tags. Placeholder: "Search media..."           |
| 2   | Type   | Dropdown   | "All"          | All, Images, Videos                                                      |
| 3   | Folder | Dropdown   | "All Folders"  | All Folders + folder list                                                |
| 4   | Sort   | Dropdown   | "Newest First" | Newest First, Oldest First, Name A-Z, Name Z-A, Largest First, Most Used |

**Responsive Layout**:

- Desktop: 5 cards per row
- Tablet: 3 cards per row
- Mobile: 2 cards per row

**Empty State**: "Your media library is empty. Upload images and videos to use in your digital signage playlists."

Action: "Upload Media" primary button.

Illustration: Image/film icon with an upload arrow.

**Storage Quota**: Each property has a media storage quota based on their subscription tier. The media library header shows: "Storage: 2.4 GB / 10 GB used". When quota reaches 90%, a warning banner appears: "You are running low on media storage. Delete unused media or contact support to upgrade." At 100%, uploads are blocked: "Storage limit reached. Delete unused media to free up space."

| Tier         | Storage Quota |
| ------------ | ------------- |
| Starter      | 5 GB          |
| Professional | 25 GB         |
| Enterprise   | 100 GB        |

#### 3.1.5 Content Creation (Slides)

A slide is a single piece of content displayed on a screen. Slides are assembled into playlists.

**Entry Point**: Digital Signage > Content > "Create Slide"

**Slide Types**:

| #   | Type              | Icon      | Description                                                           | Use Case                                                  |
| --- | ----------------- | --------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Announcement      | Megaphone | Displays a building announcement with title, body, and optional image | Daily notices, policy reminders, building updates         |
| 2   | Image             | Photo     | Full-screen image display                                             | Building photos, community art, sponsor ads               |
| 3   | Video             | Film      | Full-screen video playback (MP4, WebM, max 5 min)                     | Welcome videos, safety instructions, community highlights |
| 4   | Weather           | Cloud/Sun | Current weather and 3-day forecast for the property's location        | Always-on weather information                             |
| 5   | Event Calendar    | Calendar  | Upcoming community events from the Events module                      | Event promotion                                           |
| 6   | Celebration       | Party     | Holiday and celebration message with themed graphics                  | Christmas, New Year, Lunar New Year, Diwali, etc.         |
| 7   | Warning / Alert   | Triangle  | High-visibility warning with bold text and alert colors               | Weather alerts, maintenance notices, safety warnings      |
| 8   | Community Message | People    | Free-form message with customizable text and optional image           | Welcome messages, resident spotlights, community news     |
| 9   | Amenity Status    | Building  | Real-time amenity availability pulled from the Booking module         | "Party Room: Available", "Gym: Open until 10 PM"          |
| 10  | Custom HTML       | Code      | Custom HTML/CSS for advanced users                                    | Branded content, complex layouts                          |

**Create Slide Form (Common Fields)**:

| #   | Field       | Type                | Required | Max Length               | Default                         | Validation                                                                  | Error Message                                 |
| --- | ----------- | ------------------- | -------- | ------------------------ | ------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | Slide Name  | Text input          | Yes      | 100 chars                | Auto-generated from type + date | Min 2 chars                                                                 | "Slide name is required."                     |
| 2   | Slide Type  | Radio card selector | Yes      | --                       | --                              | Must select one                                                             | "Please select a slide type."                 |
| 3   | Duration    | Number + unit       | Yes      | --                       | 10 seconds                      | Range: 5-300 seconds for images/text. Range: video length for video slides. | "Duration must be between 5 and 300 seconds." |
| 4   | Orientation | Checkbox group      | Yes      | --                       | Both checked                    | At least one: Landscape, Portrait                                           | "Select at least one orientation."            |
| 5   | Active      | Toggle              | Yes      | --                       | true                            | --                                                                          | --                                            |
| 6   | Tags        | Tag input           | No       | 50 chars per tag, max 10 | Empty                           | Alphanumeric and hyphens                                                    | --                                            |

**Type-Specific Fields**:

**Announcement Slide**:

| #   | Field               | Type         | Required    | Max Length | Default              | Validation                                                                      | Error Message                    |
| --- | ------------------- | ------------ | ----------- | ---------- | -------------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| 7   | Source              | Radio group  | Yes         | --         | "Manual"             | One of: Manual, From Announcement Module                                        | --                               |
| 8   | Linked Announcement | Dropdown     | Conditional | --         | --                   | Required if Source = "From Announcement Module". Shows published announcements. | "Please select an announcement." |
| 9   | Headline            | Text input   | Conditional | 100 chars  | --                   | Required if Source = "Manual". Min 3 chars.                                     | "Headline is required."          |
| 10  | Body Text           | Textarea     | No          | 500 chars  | Empty                | --                                                                              | --                               |
| 11  | Background Image    | Media picker | No          | --         | White background     | Select from media library or upload                                             | --                               |
| 12  | Text Color          | Color picker | No          | --         | #1D1D1F (near-black) | Valid hex                                                                       | --                               |
| 13  | Background Color    | Color picker | No          | --         | #FFFFFF (white)      | Valid hex. Ignored if background image is set.                                  | --                               |

**Image Slide**:

| #   | Field            | Type         | Required    | Max Length | Default  | Validation                                                                                                       | Error Message             |
| --- | ---------------- | ------------ | ----------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 7   | Image            | Media picker | Yes         | --         | --       | Must select from library or upload                                                                               | "Please select an image." |
| 8   | Fit Mode         | Radio group  | No          | --         | "Cover"  | Options: Cover (fill screen, crop edges), Contain (fit within screen, letterbox), Stretch (fill screen, distort) | --                        |
| 9   | Caption          | Text input   | No          | 200 chars  | Empty    | --                                                                                                               | --                        |
| 10  | Caption Position | Dropdown     | Conditional | --         | "Bottom" | Shown if Caption is not empty. Options: Top, Bottom, Hidden                                                      | --                        |

**Video Slide**:

| #   | Field     | Type         | Required | Max Length | Default | Validation                                                              | Error Message                                                                   |
| --- | --------- | ------------ | -------- | ---------- | ------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 7   | Video     | Media picker | Yes      | --         | --      | Must select from library or upload. MP4 or WebM. Max 200 MB. Max 5 min. | "Please select a video."                                                        |
| 8   | Auto-Play | Toggle       | No       | --         | true    | --                                                                      | Tooltip: "Video starts automatically when this slide appears."                  |
| 9   | Mute      | Toggle       | No       | --         | true    | --                                                                      | Tooltip: "Mute audio by default. Building screens typically run without sound." |
| 10  | Loop      | Toggle       | No       | --         | false   | --                                                                      | Tooltip: "Loop the video continuously until the playlist advances."             |

**Weather Slide**:

| #   | Field            | Type        | Required | Max Length | Default          | Validation                                                                                             | Error Message                                                      |
| --- | ---------------- | ----------- | -------- | ---------- | ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 7   | Location         | Read-only   | --       | --         | Property address | Auto-populated from property settings                                                                  | --                                                                 |
| 8   | Units            | Radio group | No       | --         | Metric (Celsius) | Options: Metric (Celsius, km/h), Imperial (Fahrenheit, mph)                                            | --                                                                 |
| 9   | Show Forecast    | Toggle      | No       | --         | true             | --                                                                                                     | Tooltip: "Show a 3-day weather forecast below current conditions." |
| 10  | Background Style | Dropdown    | No       | --         | "Dynamic"        | Options: Dynamic (changes with weather -- sunny, cloudy, rainy backgrounds), Solid Color, Custom Image | --                                                                 |

**Celebration Slide**:

| #   | Field          | Type          | Required | Max Length | Default                      | Validation                                      | Error Message                |
| --- | -------------- | ------------- | -------- | ---------- | ---------------------------- | ----------------------------------------------- | ---------------------------- |
| 7   | Occasion       | Dropdown      | Yes      | --         | --                           | Must select one                                 | "Please select an occasion." |
| 8   | Custom Message | Textarea      | No       | 300 chars  | Auto-generated from occasion | --                                              | --                           |
| 9   | Theme          | Card selector | No       | --         | Auto-selected from occasion  | Visual grid of theme options (4-6 per occasion) | --                           |

**Occasion Options**: New Year, Lunar New Year, Valentine's Day, Easter, Eid al-Fitr, Eid al-Adha, Canada Day, Independence Day (US), Diwali, Thanksgiving (Canada), Thanksgiving (US), Christmas, Hanukkah, Kwanzaa, Mother's Day, Father's Day, Labour Day, Remembrance Day, Building Anniversary, Custom Occasion

**Warning / Alert Slide**:

| #   | Field      | Type        | Required | Max Length | Default                     | Validation                                            | Error Message                  |
| --- | ---------- | ----------- | -------- | ---------- | --------------------------- | ----------------------------------------------------- | ------------------------------ |
| 7   | Alert Type | Dropdown    | Yes      | --         | --                          | Must select one                                       | "Please select an alert type." |
| 8   | Headline   | Text input  | Yes      | 100 chars  | Auto-filled from alert type | Min 3 chars                                           | "Alert headline is required."  |
| 9   | Details    | Textarea    | No       | 500 chars  | Empty                       | --                                                    | --                             |
| 10  | Severity   | Radio group | Yes      | --         | "Warning"                   | Options: Info (blue), Warning (amber), Critical (red) | --                             |

**Alert Type Options**: Severe Weather Warning, Planned Power Outage, Water Shut-Off, Elevator Maintenance, Fire Alarm Testing, Pest Control Notice, Construction Notice, Parking Restriction, Snow Removal, General Safety Notice, Custom Alert

**Amenity Status Slide**:

| #   | Field                 | Type                    | Required | Max Length | Default              | Validation          | Error Message                                                           |
| --- | --------------------- | ----------------------- | -------- | ---------- | -------------------- | ------------------- | ----------------------------------------------------------------------- |
| 7   | Amenities to Display  | Multi-select checkboxes | Yes      | --         | All active amenities | At least 1 selected | "Select at least one amenity to display."                               |
| 8   | Show Hours            | Toggle                  | No       | --         | true                 | --                  | Tooltip: "Display operating hours next to each amenity."                |
| 9   | Show Current Bookings | Toggle                  | No       | --         | false                | --                  | Tooltip: "Show 'In Use' / 'Available' status based on active bookings." |

**Custom HTML Slide**:

| #   | Field        | Type             | Required | Max Length   | Default                   | Validation                                              | Error Message                                                                          |
| --- | ------------ | ---------------- | -------- | ------------ | ------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 7   | HTML Content | Code editor      | Yes      | 50,000 chars | Template boilerplate      | Must be valid HTML. No external scripts (CSP enforced). | "HTML content is required." / "External scripts are not allowed for security reasons." |
| 8   | Preview      | Read-only iframe | --       | --           | Renders HTML in real-time | --                                                      | --                                                                                     |

**Tooltip -- Custom HTML**: "For advanced users. Custom HTML slides are sandboxed for security. External JavaScript files, iframes to external URLs, and form submissions are blocked. Inline CSS is supported."

**Form Buttons**:

| Button                 | Style     | Action                                                  | Loading State        | Success State                                        | Failure State                                    |
| ---------------------- | --------- | ------------------------------------------------------- | -------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Save Slide             | Primary   | Saves slide to content library                          | "Saving..."          | Toast: "Slide saved." Redirect to content list.      | Toast: "Failed to save slide. Please try again." |
| Save & Add to Playlist | Secondary | Saves slide, then opens playlist selector               | "Saving..."          | Toast: "Slide saved." Playlist selector modal opens. | Toast: "Failed to save."                         |
| Preview                | Tertiary  | Opens preview window showing slide at actual resolution | Preview window opens | Slide renders                                        | Toast: "Preview unavailable."                    |
| Cancel                 | Text link | Discard confirmation if form modified                   | --                   | Redirect to content list                             | --                                               |

#### 3.1.6 Content List

**Entry Point**: Digital Signage > Content

**Content Grid**:

Each slide displays as a card with:

| Card Element          | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| **Preview Thumbnail** | Visual preview of the slide at card size. Landscape or portrait indicator.  |
| **Slide Name**        | Clickable link to edit. Truncated at 40 chars.                              |
| **Type Badge**        | Color-coded type (e.g., "Announcement" blue, "Weather" teal, "Warning" red) |
| **Duration**          | "10s" or "1:30" for videos                                                  |
| **Orientation Icons** | Landscape icon, portrait icon, or both                                      |
| **Used In**           | "In {N} playlist(s)" or "Not in any playlist" (muted)                       |
| **Last Modified**     | Relative time                                                               |

**Filter Bar**:

| #   | Filter           | Type       | Default     | Options                                                            |
| --- | ---------------- | ---------- | ----------- | ------------------------------------------------------------------ |
| 1   | Search           | Text input | Empty       | Searches across slide name, tags. Placeholder: "Search content..." |
| 2   | Type             | Dropdown   | "All Types" | All Types + slide type list                                        |
| 3   | Orientation      | Dropdown   | "All"       | All, Landscape, Portrait                                           |
| 4   | Status           | Dropdown   | "Active"    | Active, Inactive, All                                              |
| 5   | Used In Playlist | Dropdown   | "All"       | All, In a Playlist, Not in Any Playlist                            |

**Responsive Layout**:

- Desktop: 4 cards per row
- Tablet: 2 cards per row
- Mobile: 1 card per row

**Empty State**: "No content created yet. Create your first slide to start building playlists for your screens."

Action: "Create Slide" primary button.

#### 3.1.7 Template System

Pre-built slide templates that non-technical users can customize.

**Entry Point**: Digital Signage > Templates

**System Templates** (provided by default, cannot be deleted, can be duplicated and customized):

| #   | Template Name            | Layout                                                      | Orientation | Description                                                |
| --- | ------------------------ | ----------------------------------------------------------- | ----------- | ---------------------------------------------------------- |
| 1   | Full Screen Announcement | Single zone: headline + body + optional logo                | Both        | Clean text announcement on solid or image background       |
| 2   | Announcement + Weather   | Split: 70% announcement, 30% weather sidebar                | Landscape   | Announcement with live weather widget                      |
| 3   | Full Screen Image        | Single zone: edge-to-edge image                             | Both        | Full-bleed photo or artwork                                |
| 4   | Full Screen Video        | Single zone: edge-to-edge video                             | Both        | Video playback with optional caption overlay               |
| 5   | Split Screen (Two Items) | Two equal zones side by side                                | Landscape   | Two slides displayed simultaneously                        |
| 6   | Triple Zone              | Large zone (60%) + two smaller zones (20% each)             | Landscape   | Main content with weather and announcement sidebar         |
| 7   | Ticker + Content         | 90% main content + 10% scrolling text ticker at bottom      | Landscape   | Content with scrolling announcements ticker                |
| 8   | Event Board              | Grid layout: up to 6 upcoming events                        | Both        | Community events display                                   |
| 9   | Welcome Screen           | Centered logo + building name + date/time + weather         | Both        | Building entrance welcome display                          |
| 10  | Emergency Full Screen    | Full screen red background with white text, flashing border | Both        | Emergency takeover template (system-managed, not editable) |
| 11  | Portrait Announcement    | Vertical layout: image top, text bottom                     | Portrait    | Elevator/portrait screen announcement                      |
| 12  | Portrait Weather + Info  | Vertical split: weather top, announcement bottom            | Portrait    | Elevator/portrait screen information display               |

**Template Card Display**:

| Card Element       | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| **Preview**        | Visual mockup of the template layout with placeholder content |
| **Template Name**  | Name with "System" badge for built-in templates               |
| **Layout Diagram** | Simplified wireframe showing zone arrangement                 |
| **Orientation**    | Landscape, Portrait, or Both icon                             |
| **Zones**          | Count of configurable zones (e.g., "3 zones")                 |

**Template Actions**:

| Action       | System Templates                                     | Custom Templates                                                                         |
| ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Use Template | Opens slide creation pre-filled with template layout | Same                                                                                     |
| Duplicate    | Creates an editable copy                             | Creates a copy                                                                           |
| Edit         | Not allowed (system templates are read-only)         | Full edit                                                                                |
| Delete       | Not allowed                                          | Confirmation dialog: "Delete '{name}'? Slides using this template will not be affected." |

**Create Custom Template** (Property Admin, Property Manager):

| #   | Field              | Type               | Required | Max Length | Default          | Validation                                                        | Error Message                                  |
| --- | ------------------ | ------------------ | -------- | ---------- | ---------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Template Name      | Text input         | Yes      | 100 chars  | Empty            | Min 2 chars, unique per property                                  | "Template name must be unique."                |
| 2   | Base Layout        | Card selector      | Yes      | --         | --               | Must select one                                                   | "Please select a base layout."                 |
| 3   | Orientation        | Checkbox group     | Yes      | --         | Both             | At least one                                                      | "Select at least one orientation."             |
| 4   | Zone Configuration | Visual editor      | Yes      | --         | From base layout | Each zone must have a content type assigned                       | "All zones must have a content type assigned." |
| 5   | Default Colors     | Color picker group | No       | --         | System defaults  | --                                                                | --                                             |
| 6   | Default Font Size  | Dropdown           | No       | --         | "Large"          | Options: Medium (24px), Large (32px, default), Extra Large (48px) | --                                             |

**Base Layout Options**:

| Layout           | Zones | Description                                            |
| ---------------- | ----- | ------------------------------------------------------ |
| Single           | 1     | Full screen, one content area                          |
| Split Horizontal | 2     | Left + Right (configurable ratio: 50/50, 60/40, 70/30) |
| Split Vertical   | 2     | Top + Bottom (configurable ratio: 50/50, 60/40, 70/30) |
| Sidebar Right    | 2     | Main (70-80%) + Right sidebar (20-30%)                 |
| Sidebar Left     | 2     | Left sidebar (20-30%) + Main (70-80%)                  |
| Triple Column    | 3     | Three equal columns                                    |
| Main + Two Side  | 3     | Large main (60%) + Two stacked right (20% each)        |
| Quad Grid        | 4     | Four equal quadrants                                   |
| Main + Ticker    | 2     | Main content (90%) + scrolling ticker bar (10%)        |

**Empty State**: "No custom templates yet. The system templates above are ready to use, or create your own for a custom look."

Action: "Create Template" secondary button.

#### 3.1.8 Playlist Management

A playlist is an ordered sequence of slides that auto-rotates on assigned screens.

**Entry Point**: Digital Signage > Playlists > "Create Playlist"

**Create Playlist Form**:

| #   | Field                  | Type               | Required    | Max Length | Default       | Validation                                                                | Error Message                                                                                                                        |
| --- | ---------------------- | ------------------ | ----------- | ---------- | ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Playlist Name          | Text input         | Yes         | 100 chars  | Empty         | Min 2 chars, unique per property                                          | "Playlist name must be unique."                                                                                                      |
| 2   | Description            | Text input         | No          | 200 chars  | Empty         | --                                                                        | --                                                                                                                                   |
| 3   | Orientation            | Radio group        | Yes         | --         | Landscape     | One of: Landscape, Portrait                                               | "Playlists must target one orientation. Create separate playlists for landscape and portrait screens."                               |
| 4   | Default Slide Duration | Number + "seconds" | Yes         | --         | 10 seconds    | Range: 5-300                                                              | "Default duration must be between 5 and 300 seconds."                                                                                |
| 5   | Transition Effect      | Dropdown           | No          | --         | "Fade"        | Options: None, Fade, Slide Left, Slide Right, Slide Up, Slide Down        | --                                                                                                                                   |
| 6   | Transition Duration    | Dropdown           | Conditional | --         | "0.5 seconds" | Shown if Transition Effect is not "None". Options: 0.3s, 0.5s, 1.0s, 1.5s | --                                                                                                                                   |
| 7   | Loop                   | Toggle             | No          | --         | true          | --                                                                        | Tooltip: "When enabled, the playlist restarts from the first slide after the last slide. When disabled, it stops on the last slide." |
| 8   | Active                 | Toggle             | Yes         | --         | true          | --                                                                        | --                                                                                                                                   |

**Slide Assignment Section**:

Below the form fields, a drag-and-drop slide list:

| #   | Column      | Description                                                                                                                                   |
| --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Drag Handle | 6-dot grip icon for reordering                                                                                                                |
| 2   | Order       | Auto-numbered (1, 2, 3...)                                                                                                                    |
| 3   | Preview     | Small thumbnail of the slide                                                                                                                  |
| 4   | Slide Name  | Name with type badge                                                                                                                          |
| 5   | Duration    | Editable number input (overrides slide default). Tooltip: "Duration for this slide in this playlist. Overrides the slide's default duration." |
| 6   | Enabled     | Toggle (disable a slide in this playlist without removing it)                                                                                 |
| 7   | Remove      | X button to remove from playlist (does not delete the slide)                                                                                  |

**Add Slides**:

| Method                      | Description                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| "Add Existing Slide" button | Opens slide picker modal: searchable grid of all slides filtered by matching orientation. Multi-select with checkboxes. "Add Selected" button. |
| "Create New Slide" button   | Opens slide creation form. On save, slide is auto-added to this playlist.                                                                      |
| Drag from sidebar           | Desktop only: a collapsible sidebar panel shows available slides. Drag into the playlist list to add.                                          |

**Playlist Buttons**:

| Button             | Style                            | Action                                                                                            | Loading State        | Success State                                         | Failure State                     |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------- | --------------------------------- |
| Save Playlist      | Primary                          | Saves playlist and slide order                                                                    | "Saving..."          | Toast: "Playlist '{name}' saved."                     | Toast: "Failed to save playlist." |
| Preview Playlist   | Secondary                        | Opens full-screen preview that auto-rotates through all slides at configured durations            | Preview window opens | Slides rotate                                         | Toast: "Preview unavailable."     |
| Publish to Screens | Primary (shown after first save) | Opens screen/group selector to assign this playlist                                               | "Publishing..."      | Toast: "Playlist published to {N} screen(s)."         | Toast: "Failed to publish."       |
| Duplicate          | Tertiary                         | Creates a copy of the playlist with all slides                                                    | "Duplicating..."     | Toast: "Playlist duplicated as '{name} (Copy)'."      | Toast: "Failed to duplicate."     |
| Delete             | Danger text link                 | Confirmation: "Delete '{name}'? Screens assigned this playlist will show their fallback content." | "Deleting..."        | Toast: "Playlist deleted." Redirect to playlist list. | Toast: "Failed to delete."        |

**Playlist List Page**:

| #   | Column         | Sortable           | Format                                                                              |
| --- | -------------- | ------------------ | ----------------------------------------------------------------------------------- |
| 1   | Status         | No                 | Green dot (active + assigned), Blue dot (active, not assigned), Gray dot (inactive) |
| 2   | Playlist Name  | Yes                | Clickable link to edit                                                              |
| 3   | Slides         | No                 | Count (e.g., "8 slides")                                                            |
| 4   | Total Duration | No                 | Formatted (e.g., "1 min 30 sec")                                                    |
| 5   | Orientation    | No                 | Landscape / Portrait icon                                                           |
| 6   | Assigned To    | No                 | Screen group names or screen names. "Not assigned" if unassigned.                   |
| 7   | Schedule       | No                 | "Always" or schedule summary (e.g., "Weekdays 8 AM - 6 PM")                         |
| 8   | Last Modified  | Yes (default sort) | Relative time                                                                       |
| 9   | Actions        | No                 | Overflow: Edit, Preview, Publish, Duplicate, Delete                                 |

**Empty State**: "No playlists created yet. Create your first playlist by assembling slides into an auto-rotating sequence for your screens."

Action: "Create Playlist" primary button.

#### 3.1.9 Schedule System

Playlists are assigned to screens or screen groups with optional time-based and date-based schedules.

**Entry Point**: Digital Signage > Schedule

**Schedule Calendar View**:

A weekly calendar showing which playlists play on which screen groups at what times.

**Calendar Controls**:

| #   | Control             | Type              | Behavior                                                   |
| --- | ------------------- | ----------------- | ---------------------------------------------------------- |
| 1   | Previous / Next     | Navigation arrows | Move by week                                               |
| 2   | This Week           | Button            | Returns to current week                                    |
| 3   | Screen Group Filter | Dropdown          | Filter calendar to a specific group. Default: "All Groups" |
| 4   | View Toggle         | Button group      | Week (default), Day                                        |

**Calendar Display**: Each row represents a screen group. Each cell represents a time block. Playlist assignments appear as colored blocks spanning their scheduled time.

**Create Schedule Entry**:

| #   | Field             | Type                   | Required    | Max Length | Default          | Validation                                                                                                        | Error Message                             |
| --- | ----------------- | ---------------------- | ----------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1   | Playlist          | Dropdown               | Yes         | --         | --               | Must select an active playlist                                                                                    | "Please select a playlist."               |
| 2   | Target            | Radio group + selector | Yes         | --         | --               | "Screen Group" or "Individual Screen". Then dropdown to select which one.                                         | "Please select a target screen or group." |
| 3   | Schedule Type     | Radio group            | Yes         | --         | "Always On"      | Options: Always On, Time Range, Date Range, Time + Date Range                                                     | --                                        |
| 4   | Start Time        | Time picker            | Conditional | --         | 8:00 AM          | Required if Schedule Type includes "Time Range". Must be before end time.                                         | "Start time must be before end time."     |
| 5   | End Time          | Time picker            | Conditional | --         | 10:00 PM         | Required if Schedule Type includes "Time Range".                                                                  | --                                        |
| 6   | Days of Week      | Checkbox group         | Conditional | --         | All days checked | Required if Schedule Type includes "Time Range". At least 1 day.                                                  | "Select at least one day."                |
| 7   | Start Date        | Date picker            | Conditional | --         | Today            | Required if Schedule Type includes "Date Range".                                                                  | --                                        |
| 8   | End Date          | Date picker            | Conditional | --         | --               | Required if Schedule Type includes "Date Range". Must be after start date.                                        | "End date must be after start date."      |
| 9   | Priority          | Number                 | No          | 2 digits   | 10               | Range: 1-99. Lower number = higher priority. When multiple schedules overlap, the higher priority playlist plays. | "Priority must be between 1 and 99."      |
| 10  | Fallback Playlist | Dropdown               | No          | --         | Property default | Playlist that plays when no schedule is active for the target.                                                    | --                                        |

**Schedule Conflict Resolution**:

When multiple schedules overlap for the same screen or group:

1. The schedule with the **lowest priority number** (highest priority) wins.
2. If priorities are equal, the **most recently created** schedule wins.
3. Emergency broadcasts always override all schedules (priority 0, cannot be configured).

**Tooltip -- Priority**: "When two playlists are scheduled at the same time for the same screen, the one with the lower priority number plays. Use priority 1 for your most important content."

**Schedule Examples** (shown as helper text below form):

- "Show Christmas content Dec 15-26": Set Schedule Type = Date Range, Start Date = Dec 15, End Date = Dec 26.
- "Show pool rules May through September": Set Schedule Type = Date Range, Start Date = May 1, End Date = Sep 30.
- "Morning announcements 7-9 AM weekdays": Set Schedule Type = Time + Date Range, Start Time = 7:00 AM, End Time = 9:00 AM, Days = Mon-Fri.
- "Weekend event promotions": Set Schedule Type = Time Range, Days = Sat + Sun.

**Schedule List Table**:

| #   | Column     | Sortable | Format                                                                           |
| --- | ---------- | -------- | -------------------------------------------------------------------------------- |
| 1   | Status     | No       | Green dot (active now), Blue dot (scheduled future), Gray dot (expired/inactive) |
| 2   | Playlist   | Yes      | Playlist name with link                                                          |
| 3   | Target     | Yes      | Screen group or screen name                                                      |
| 4   | Schedule   | No       | Human-readable summary (e.g., "Mon-Fri, 8:00 AM - 6:00 PM")                      |
| 5   | Date Range | No       | "Always" or "Dec 15 - Dec 26, 2026"                                              |
| 6   | Priority   | Yes      | Number                                                                           |
| 7   | Actions    | No       | Edit, Duplicate, Delete                                                          |

**Empty State**: "No schedules configured. Assign playlists to your screens with time-based schedules to automate content rotation."

Action: "Create Schedule" primary button.

#### 3.1.10 Preview System

WYSIWYG preview of exactly what a screen will display.

**Preview Modes**:

| Mode             | Entry Point                                    | What It Shows                                                                                  |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Slide Preview    | Slide edit form > "Preview" button             | Single slide at actual resolution in a browser window                                          |
| Playlist Preview | Playlist edit form > "Preview Playlist" button | Full playlist auto-rotation with transitions                                                   |
| Screen Preview   | Screen detail > "Preview" button               | Exactly what the physical screen is currently displaying, including active schedule resolution |
| Schedule Preview | Schedule page > "Preview at Time"              | What a specific screen/group would display at a chosen date and time                           |

**Preview Window**:

- Opens as a new browser window (not a modal -- modals cannot show full-resolution content)
- Window title: "Preview: {screen name or playlist name}"
- Bottom toolbar (semi-transparent, auto-hides after 3 seconds, reappears on mouse movement):
  - Current slide name and number (e.g., "Slide 3 of 8: Holiday Greeting")
  - Progress bar showing time remaining on current slide
  - Pause / Play button
  - Previous / Next slide buttons
  - "Close Preview" button
  - Orientation toggle (switch between landscape and portrait rendering)

**"Preview at Time" Feature**:

On the Schedule page, a "Preview at Time" control allows staff to see what any screen would display at a specific future date and time:

| Field          | Type        | Default      |
| -------------- | ----------- | ------------ |
| Screen / Group | Dropdown    | First screen |
| Date           | Date picker | Today        |
| Time           | Time picker | Now          |

Clicking "Preview" opens the preview window showing exactly what would play at that moment based on all active schedules and priorities.

#### 3.1.11 Real-Time Push

All content updates are delivered to connected screens in real-time via WebSocket.

**How It Works**:

1. Screen loads the display URL in a browser
2. Browser establishes a WebSocket connection to the Concierge server
3. Server authenticates the connection using the screen's unique token (embedded in the URL)
4. When content changes (playlist update, schedule change, emergency broadcast), the server pushes a message to all affected screens
5. The screen's display client receives the message and updates within 2 seconds

**WebSocket Events for Digital Signage**:

| Event                        | Payload                             | Trigger                                           | Screen Response                                            |
| ---------------------------- | ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `signage.playlist_updated`   | `{ playlist_id, slides[] }`         | Playlist slides or order changed                  | Reload playlist, continue from current position            |
| `signage.schedule_changed`   | `{ screen_id, active_playlist_id }` | Schedule entry created/modified/deleted           | Switch to the newly active playlist                        |
| `signage.content_push`       | `{ screen_id, playlist_id }`        | Admin clicks "Push Content Now"                   | Immediately switch to pushed playlist                      |
| `signage.emergency_takeover` | `{ property_id, message, type }`    | Emergency broadcast sent (from PRD 09)            | Full-screen emergency display. Overrides everything.       |
| `signage.emergency_clear`    | `{ property_id }`                   | Emergency broadcast resolved                      | Return to previously scheduled playlist                    |
| `signage.screen_updated`     | `{ screen_id, settings }`           | Screen settings changed (orientation, resolution) | Reload display renderer with new settings                  |
| `signage.heartbeat`          | `{ screen_id, timestamp }`          | Every 30 seconds from server                      | Screen responds with `heartbeat_ack` to confirm connection |

**Connection Loss Behavior**:

| Duration               | Screen Behavior                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0-30 seconds           | No visible change. Reconnection attempts every 5 seconds.                                                                                  |
| 30 seconds - 5 minutes | Small "Reconnecting..." indicator in bottom-right corner (subtle, does not disrupt content). Continue playing current playlist from cache. |
| 5+ minutes             | Continue playing cached playlist. "Reconnecting..." indicator persists. On reconnection, sync latest content immediately.                  |
| Network restored       | Reconnect, fetch latest schedule and content, resume normal operation. No manual intervention required.                                    |

#### 3.1.12 Emergency Broadcast Integration

When an emergency broadcast is sent via the Communication module (PRD 09), Digital Signage responds automatically.

**Behavior**:

1. Property Manager sends emergency broadcast through Communication module
2. Server emits `signage.emergency_takeover` event to ALL connected screens for the property (regardless of screen group, schedule, or current content)
3. Every screen immediately displays the Emergency Full Screen template:
   - Red background (#FF3B30)
   - White text, extra-large (72px minimum)
   - Emergency type icon (if applicable)
   - Message text
   - Flashing border animation (alternating red/white, 1-second cycle)
   - "EMERGENCY" header
   - Building name
   - Current time (auto-updating)
4. Emergency display persists until the broadcast is marked as resolved in the Communication module
5. When resolved, server emits `signage.emergency_clear` and screens return to their previously scheduled playlists

**Configuration**: None. Emergency takeover is automatic and cannot be disabled or configured. This is a safety feature.

**Manual Emergency Override** (from Digital Signage module):

Security Guards and Property Managers can also trigger an emergency display directly from Digital Signage:

| Button              | Location                                                      | Role Required                                                        | Action                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Emergency Display" | Digital Signage dashboard header (red button, always visible) | Property Manager+ or Security Guard (if permitted by Property Admin) | Opens simplified emergency form: Message (text, 200 chars, required) + Severity (Info/Warning/Critical). Pushes to all screens immediately. Does NOT trigger the full Communication module emergency cascade (no SMS/voice/push to residents). |

**Tooltip -- Emergency Display**: "This pushes an emergency message to all building screens only. To send emergency notifications to residents via SMS, push, and voice, use the Emergency Broadcast feature in Communication."

#### 3.1.13 Announcement Module Integration

Announcements created in the Communication module can auto-appear on digital signage screens.

**How It Works**:

1. When creating an announcement in the Communication module (PRD 09), the channels checklist includes "Digital Signage" as an option (in addition to Email, SMS, Push, Voice)
2. When "Digital Signage" is checked, the system auto-creates an Announcement slide from the announcement content
3. The auto-created slide is added to a system-managed playlist called "Announcements Feed" (one per property, auto-created)
4. The "Announcements Feed" playlist is available for scheduling like any other playlist
5. When the announcement expires, the slide is automatically removed from the playlist

**Announcement Slide Auto-Creation**:

| Source Field                                   | Maps To                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Announcement title                             | Slide headline                                                   |
| Announcement body (first 500 chars, plaintext) | Slide body text                                                  |
| Announcement category color                    | Slide accent color                                               |
| Announcement priority                          | Slide duration: Low = 8s, Normal = 10s, High = 15s, Urgent = 20s |
| Announcement expiry                            | Slide auto-removal date                                          |

**Announcements Feed Playlist**:

- System-managed. Cannot be deleted.
- Property Admin can configure: max slides (default 10, newest announcements take priority), default duration per slide, transition effect.
- Slides in this playlist are ordered by announcement publish date (newest first).
- When max slides is reached, the oldest slide is removed when a new announcement is published.

#### 3.1.14 Weather Widget Integration

An always-on weather widget that can be embedded in any template zone or displayed as a standalone slide.

**Data Source**: OpenWeatherMap API (or provider configured in Settings > Integrations)

**Weather Display**:

| Element             | Content                                                                          |
| ------------------- | -------------------------------------------------------------------------------- |
| Current Temperature | Large number with degree symbol (e.g., "-5 C" or "72 F")                         |
| Weather Icon        | Animated icon matching conditions (sunny, cloudy, rain, snow, thunderstorm, fog) |
| Conditions Text     | "Partly Cloudy", "Light Rain", etc.                                              |
| Feels Like          | "Feels like -12 C"                                                               |
| High / Low          | "H: 2 C / L: -8 C"                                                               |
| 3-Day Forecast      | Three columns: day name, icon, high/low                                          |
| Last Updated        | "Updated 15 min ago" (weather refreshes every 15 minutes)                        |

**Weather Refresh**: Every 15 minutes via server-side API call. Cached per property. Display screens receive weather updates via WebSocket push (not independent API calls from each screen).

### 3.2 Enhanced Features (v2)

#### 3.2.1 Interactive Kiosk Mode

Touch-screen support for lobby kiosks with directory search, amenity booking, and package pickup notifications.

#### 3.2.2 Content Analytics Dashboard

Detailed analytics: which slides get the most screen time, which playlists are most used, screen uptime trends, content engagement heatmaps.

#### 3.2.3 Multi-Property Content Sharing

Management companies share playlists and templates across multiple properties. Corporate announcements push to all buildings simultaneously.

#### 3.2.4 External Content Sources

RSS feeds, social media widgets, Google Slides embed, and third-party content provider integrations.

#### 3.2.5 Resident-Submitted Content

Residents submit photos, event announcements, or classified ads for display. Staff approves before publishing.

---

## 4. Data Model

### 4.1 Screen

```
Screen
├── id (UUID, auto-generated)
├── property_id → Property (FK, required, tenant isolation)
├── name (varchar 100, required, unique per property)
├── slug (varchar 100, auto-generated from name, unique per property)
├── location (varchar 200, required)
├── building_id → Building (FK, nullable -- for multi-building properties)
├── floor (varchar 10, nullable)
├── orientation (enum: landscape, portrait)
├── resolution_width (integer, required)
├── resolution_height (integer, required)
├── description (text, 500 chars max, nullable)
├── active (boolean, default true)
├── display_url (varchar 500, auto-generated, unique)
├── access_token (varchar 64, auto-generated, unique -- embedded in display URL for auth)
├── pairing_code (varchar 6, nullable -- temporary, expires in 15 min)
├── pairing_code_expires_at (timestamp, nullable)
├── connection_status (enum: connected, disconnected)
├── last_seen_at (timestamp, nullable)
├── last_seen_user_agent (varchar 500, nullable)
├── current_playlist_id → Playlist (FK, nullable)
├── fallback_playlist_id → Playlist (FK, nullable)
├── created_by → User (FK)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.2 ScreenGroup

```
ScreenGroup
├── id (UUID, auto-generated)
├── property_id → Property (FK, required)
├── name (varchar 100, required, unique per property)
├── description (varchar 200, nullable)
├── default_orientation (enum: landscape, portrait, mixed)
├── is_system (boolean, default false -- true for "All Screens" group)
├── created_by → User (FK)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.3 ScreenGroupMembership

```
ScreenGroupMembership
├── id (UUID)
├── screen_id → Screen (FK, required)
├── screen_group_id → ScreenGroup (FK, required)
├── added_at (timestamp)
└── added_by → User (FK)
```

**Unique constraint**: `(screen_id, screen_group_id)` -- a screen can only be in a group once.

### 4.4 MediaAsset

```
MediaAsset
├── id (UUID, auto-generated)
├── property_id → Property (FK, required)
├── filename (varchar 255, required)
├── original_filename (varchar 255, required)
├── mime_type (varchar 100, required)
├── file_size_bytes (bigint, required)
├── width (integer, nullable -- for images and videos)
├── height (integer, nullable)
├── duration_seconds (integer, nullable -- for videos)
├── storage_url (varchar 500, required)
├── thumbnail_url (varchar 500, nullable -- auto-generated)
├── cdn_url (varchar 500, required)
├── folder (varchar 100, default 'Uncategorized')
├── tags[] (varchar 50 each, max 10)
├── usage_count (integer, default 0 -- number of slides using this asset)
├── uploaded_by → User (FK)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.5 Slide

```
Slide
├── id (UUID, auto-generated)
├── property_id → Property (FK, required)
├── name (varchar 100, required)
├── slide_type (enum: announcement, image, video, weather, event_calendar,
│               celebration, warning, community_message, amenity_status, custom_html)
├── orientation_landscape (boolean, default true)
├── orientation_portrait (boolean, default true)
├── default_duration_seconds (integer, required, range 5-300)
├── template_id → SlideTemplate (FK, nullable)
├── content (JSONB, required -- type-specific content data, see 4.5a)
├── active (boolean, default true)
├── tags[] (varchar 50 each, max 10)
├── source_announcement_id → Announcement (FK, nullable -- if auto-created from announcement)
├── auto_created (boolean, default false -- true for announcement integration slides)
├── auto_expires_at (timestamp, nullable -- for announcement-linked slides)
├── created_by → User (FK)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.5a Slide Content JSONB Schema (by type)

**Announcement**:

```json
{
  "source": "manual | from_announcement",
  "announcement_id": "uuid | null",
  "headline": "string",
  "body": "string",
  "background_image_id": "media-asset-uuid | null",
  "text_color": "#1D1D1F",
  "background_color": "#FFFFFF"
}
```

**Image**:

```json
{
  "image_id": "media-asset-uuid",
  "fit_mode": "cover | contain | stretch",
  "caption": "string | null",
  "caption_position": "top | bottom | hidden"
}
```

**Video**:

```json
{
  "video_id": "media-asset-uuid",
  "auto_play": true,
  "mute": true,
  "loop": false
}
```

**Weather**:

```json
{
  "units": "metric | imperial",
  "show_forecast": true,
  "background_style": "dynamic | solid | custom_image",
  "background_color": "#FFFFFF",
  "background_image_id": "media-asset-uuid | null"
}
```

**Celebration**:

```json
{
  "occasion": "string",
  "custom_message": "string",
  "theme_id": "string"
}
```

**Warning**:

```json
{
  "alert_type": "string",
  "headline": "string",
  "details": "string",
  "severity": "info | warning | critical"
}
```

**Amenity Status**:

```json
{
  "amenity_ids": ["uuid"],
  "show_hours": true,
  "show_current_bookings": false
}
```

**Custom HTML**:

```json
{
  "html": "string (max 50000 chars)"
}
```

### 4.6 SlideTemplate

```
SlideTemplate
├── id (UUID, auto-generated)
├── property_id → Property (FK, nullable -- null = system template)
├── name (varchar 100, required)
├── layout_type (enum: single, split_horizontal, split_vertical, sidebar_right,
│                sidebar_left, triple_column, main_two_side, quad_grid, main_ticker)
├── orientation_landscape (boolean, default true)
├── orientation_portrait (boolean, default true)
├── zone_config (JSONB -- zone sizes, content type per zone)
├── default_colors (JSONB -- background, text, accent)
├── default_font_size (enum: medium, large, extra_large)
├── is_system (boolean, default false)
├── is_emergency (boolean, default false -- true for emergency template)
├── preview_image_url (varchar 500, nullable)
├── created_by → User (FK, nullable -- null for system templates)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.7 Playlist

```
Playlist
├── id (UUID, auto-generated)
├── property_id → Property (FK, required)
├── name (varchar 100, required, unique per property)
├── description (varchar 200, nullable)
├── orientation (enum: landscape, portrait)
├── default_slide_duration_seconds (integer, default 10)
├── transition_effect (enum: none, fade, slide_left, slide_right, slide_up, slide_down)
├── transition_duration_ms (integer, default 500)
├── loop (boolean, default true)
├── active (boolean, default true)
├── is_system (boolean, default false -- true for "Announcements Feed")
├── is_announcement_feed (boolean, default false)
├── max_announcement_slides (integer, default 10 -- for announcement feed only)
├── created_by → User (FK)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.8 PlaylistSlide

```
PlaylistSlide
├── id (UUID)
├── playlist_id → Playlist (FK, required)
├── slide_id → Slide (FK, required)
├── sort_order (integer, required)
├── duration_override_seconds (integer, nullable -- overrides slide default)
├── enabled (boolean, default true)
├── added_at (timestamp)
└── added_by → User (FK)
```

**Unique constraint**: `(playlist_id, slide_id)` -- a slide can appear in a playlist only once.

### 4.9 Schedule

```
Schedule
├── id (UUID, auto-generated)
├── property_id → Property (FK, required)
├── playlist_id → Playlist (FK, required)
├── target_type (enum: screen, screen_group)
├── target_screen_id → Screen (FK, nullable)
├── target_group_id → ScreenGroup (FK, nullable)
├── schedule_type (enum: always, time_range, date_range, time_and_date_range)
├── start_time (time, nullable)
├── end_time (time, nullable)
├── days_of_week (integer[], nullable -- 0=Sun, 1=Mon, ..., 6=Sat)
├── start_date (date, nullable)
├── end_date (date, nullable)
├── priority (integer, default 10, range 1-99)
├── active (boolean, default true)
├── created_by → User (FK)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── deleted_at (timestamp, nullable -- soft delete)
```

### 4.10 SignageAuditLog

```
SignageAuditLog
├── id (UUID)
├── property_id → Property (FK, required)
├── entity_type (enum: screen, screen_group, slide, playlist, schedule, media_asset)
├── entity_id (UUID, required)
├── action (enum: created, updated, deleted, published, pushed, emergency_takeover,
│           emergency_cleared, content_assigned, content_removed)
├── performed_by → User (FK)
├── performed_at (timestamp with timezone)
├── details (JSONB -- before/after values, additional context)
└── ip_address (varchar 45)
```

### 4.11 Relationships

```
Property ──1:N──> Screen
Property ──1:N──> ScreenGroup
Property ──1:N──> MediaAsset
Property ──1:N──> Slide
Property ──1:N──> Playlist
Property ──1:N──> Schedule
Property ──1:N──> SlideTemplate (custom templates)

Screen    ──N:M──> ScreenGroup (via ScreenGroupMembership)
Screen    ──N:1──> Building (nullable)

Slide     ──N:1──> SlideTemplate (nullable)
Slide     ──N:1──> Announcement (nullable, for auto-created slides)
Slide     ──N:1──> MediaAsset (via JSONB content references)

Playlist  ──1:N──> PlaylistSlide
PlaylistSlide ──N:1──> Slide

Schedule  ──N:1──> Playlist
Schedule  ──N:1──> Screen (nullable, via target_screen_id)
Schedule  ──N:1──> ScreenGroup (nullable, via target_group_id)
```

### 4.12 Indexes

| Table                 | Index                                         | Purpose                             |
| --------------------- | --------------------------------------------- | ----------------------------------- |
| Screen                | `(property_id, active)`                       | Filter active screens per property  |
| Screen                | `(display_url)` UNIQUE                        | Display URL lookup                  |
| Screen                | `(access_token)` UNIQUE                       | Token-based authentication          |
| ScreenGroupMembership | `(screen_id, screen_group_id)` UNIQUE         | Prevent duplicate membership        |
| ScreenGroupMembership | `(screen_group_id)`                           | List screens in a group             |
| MediaAsset            | `(property_id, folder)`                       | Filter by folder                    |
| MediaAsset            | `(property_id, mime_type)`                    | Filter by type                      |
| Slide                 | `(property_id, slide_type, active)`           | Filter by type                      |
| Slide                 | `(source_announcement_id)`                    | Find slides linked to announcements |
| PlaylistSlide         | `(playlist_id, sort_order)`                   | Ordered slide retrieval             |
| Playlist              | `(property_id, active)`                       | Filter active playlists             |
| Schedule              | `(target_screen_id, active)`                  | Find schedules for a screen         |
| Schedule              | `(target_group_id, active)`                   | Find schedules for a group          |
| Schedule              | `(property_id, active, start_date, end_date)` | Date range filtering                |
| SignageAuditLog       | `(entity_type, entity_id)`                    | Audit trail per entity              |

---

## 5. User Flows

### 5.1 Property Manager Sets Up Digital Signage for the First Time

```
1. Property Manager navigates to Digital Signage from sidebar
2. Welcome screen: "Set up your building's digital displays in 3 steps."
   Step 1: Register your screens
   Step 2: Create or choose content
   Step 3: Assign content to screens
3. Manager clicks "Add First Screen"
4. Enters: Name "Main Lobby TV", Location "Front Lobby", Orientation "Landscape", Resolution "1920x1080"
5. System generates display URL and pairing code
6. Manager opens the URL on the lobby TV's browser
7. TV shows "Waiting for content..." with the Concierge logo
8. Screen status changes to "Connected" (green dot) on the dashboard
9. Manager clicks "Push Content Now" on the screen detail page
10. Selects the "Welcome Screen" system template
11. Lobby TV immediately displays the welcome screen with building name, date, and weather
12. Manager repeats for 3 more screens: "Elevator Display" (portrait), "Gym Monitor", "Mail Room Screen"
13. Manager creates a "Lobby" screen group containing Main Lobby TV and Mail Room Screen
14. Manager creates a playlist: "Daytime Lobby" with 5 slides (welcome, 2 announcements, weather, amenity status)
15. Manager schedules playlist to "Lobby" group: Mon-Fri, 7 AM - 10 PM
16. Manager creates "Evening Lobby" playlist with celebration messages and community photos
17. Schedules "Evening Lobby" to "Lobby" group: Mon-Fri, 6 PM - 10 PM (lower priority)
18. Daytime content plays during the day; evening content takes over at 6 PM
```

### 5.2 Front Desk Staff Uploads Holiday Content

```
1. Concierge navigates to Digital Signage > Media Library
2. Clicks "Upload Media"
3. Drags 4 Christmas-themed images into the upload area
4. Tags them: "christmas", "holiday", "december"
5. Saves to "Holiday" folder
6. Navigates to Content > "Create Slide"
7. Selects type: "Celebration"
8. Selects occasion: "Christmas"
9. Writes custom message: "Happy Holidays from the management team! Wishing you warmth and joy."
10. Selects a Christmas theme
11. Saves slide: "Holiday Greeting 2026"
12. Creates 3 more slides: image slides with the uploaded Christmas photos
13. Navigates to Playlists > "Create Playlist"
14. Names it: "Holiday Season 2026"
15. Adds the 4 holiday slides, sets duration to 12 seconds each
16. Saves playlist
17. Navigates to Schedule > "Create Schedule"
18. Selects playlist: "Holiday Season 2026"
19. Target: Screen Group "All Screens"
20. Schedule Type: Date Range
21. Start Date: Dec 15, End Date: Dec 26
22. Priority: 5 (high -- overrides regular content during this period)
23. Saves schedule
24. All screens show holiday content from Dec 15-26, then revert to normal playlists
```

### 5.3 Emergency Broadcast Takes Over Screens

```
1. Property Manager sends emergency broadcast: "Water pipe burst on Floor 14" via Communication module
2. Server emits signage.emergency_takeover to all 8 connected screens
3. Within 2 seconds, all 8 screens display:
   - Full red background
   - "EMERGENCY" header in white, 72px
   - "Water pipe burst on Floor 14. Avoid the east stairwell. Maintenance is on-site."
   - Flashing red/white border
   - Building name and current time
4. Screens remain in emergency mode while staff manages the situation
5. 45 minutes later, Manager marks emergency as resolved in Communication module
6. Server emits signage.emergency_clear
7. All screens return to their previously scheduled playlists
8. Audit log records: emergency takeover start time, end time, duration, and which screens were affected
```

### 5.4 Announcement Auto-Appears on Screens

```
1. Property Manager creates an announcement: "Pool closed for maintenance this weekend"
2. In the channels section, checks: Email, Push, and Digital Signage
3. Sends the announcement
4. System auto-creates an Announcement slide from the announcement content
5. Slide is added to the "Announcements Feed" playlist
6. If "Announcements Feed" is scheduled on any screens, the new announcement appears within 2 seconds
7. When the announcement expires (or is deleted), the slide is automatically removed
8. No manual signage work required for routine announcements
```

### 5.5 Security Guard Pushes Weather Alert to All Screens

```
1. Security Guard sees severe weather warning from Environment Canada
2. Navigates to Digital Signage > Content > "Create Slide"
3. Selects type: "Warning / Alert"
4. Alert Type: "Severe Weather Warning"
5. Headline: "Severe Thunderstorm Warning"
6. Details: "Environment Canada has issued a severe thunderstorm warning. Stay indoors and away from windows."
7. Severity: "Critical" (red)
8. Saves slide
9. Clicks "Save & Add to Playlist"
10. Selects playlist: "Daytime Lobby"
11. Sets slide duration to 20 seconds (longer for critical alerts)
12. Slide appears on all screens showing the lobby playlist within 2 seconds
13. After the weather clears, guard disables the slide from the playlist
```

---

## 6. UI/UX

### 6.1 Layout Specifications

| Screen                | Layout                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Screen List           | Full-width table. 16px row padding.                                                                                   |
| Screen Detail         | Two-column on desktop (60% info / 40% status + QR code). Single-column on mobile.                                     |
| Media Library         | Card grid: 5 columns desktop, 3 tablet, 2 mobile. 16px gap.                                                           |
| Content List (Slides) | Card grid: 4 columns desktop, 2 tablet, 1 mobile. 16px gap.                                                           |
| Slide Creation Form   | Single-column centered form, max-width 800px. Preview pane on right (desktop) or below (mobile).                      |
| Template Gallery      | Card grid: 3 columns desktop, 2 tablet, 1 mobile. 24px gap (larger cards).                                            |
| Playlist Editor       | Full-width. Left: slide list with drag-and-drop (65%). Right: playlist settings (35%). Single-column stack on mobile. |
| Schedule Calendar     | Full-width weekly calendar. Row per screen group.                                                                     |
| Schedule List         | Full-width table.                                                                                                     |
| Preview Window        | Separate browser window. Full-screen capable (F11 or button).                                                         |

### 6.2 Responsive Behavior

| Component         | Desktop (1280px+)                | Tablet (768px-1279px)                  | Mobile (<768px)                                 |
| ----------------- | -------------------------------- | -------------------------------------- | ----------------------------------------------- |
| Screen list       | Full table                       | Scrollable table                       | Card list (one card per screen)                 |
| Media grid        | 5 columns                        | 3 columns                              | 2 columns                                       |
| Content grid      | 4 columns                        | 2 columns                              | 1 column                                        |
| Template gallery  | 3 columns                        | 2 columns                              | 1 column                                        |
| Playlist editor   | Side-by-side (slides + settings) | Stacked (settings above, slides below) | Stacked, full-width                             |
| Schedule calendar | Full weekly view                 | Scrollable weekly view                 | Day view only                                   |
| Slide creation    | Form + live preview side by side | Form above, preview below              | Form only, "Preview" button opens separate view |
| Dashboard widgets | 4 columns                        | 2 columns                              | 1 column                                        |

### 6.3 Empty States

| Screen                           | Empty State Message                                                                                         | Illustration                      | Action                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------- |
| Dashboard (first visit)          | "Welcome to Digital Signage. Set up your building's display screens in minutes."                            | Monitor with sparkle              | "Get Started" button (starts 3-step wizard) |
| Screen List                      | "No screens registered yet. Add your first screen to start displaying content on your building's monitors." | Monitor with plus sign            | "Add Screen" button                         |
| Screen Groups                    | "No screen groups created yet. Group your screens by location to manage content more efficiently."          | Three monitors grouped            | "Create Group" button                       |
| Media Library                    | "Your media library is empty. Upload images and videos to use in your digital signage playlists."           | Image/film icon with upload arrow | "Upload Media" button                       |
| Content (Slides)                 | "No content created yet. Create your first slide to start building playlists for your screens."             | Slide icon with plus              | "Create Slide" button                       |
| Playlist List                    | "No playlists created yet. Create your first playlist by assembling slides into an auto-rotating sequence." | Playlist icon                     | "Create Playlist" button                    |
| Playlist Slides (empty playlist) | "This playlist has no slides yet. Add existing slides or create new ones."                                  | Empty list with arrow             | "Add Slide" and "Create New Slide" buttons  |
| Schedule                         | "No schedules configured. Assign playlists to your screens with time-based schedules."                      | Calendar with clock               | "Create Schedule" button                    |
| Templates (no custom)            | "No custom templates yet. The system templates above are ready to use, or create your own."                 | Template icon                     | "Create Template" button                    |

### 6.4 Loading States

| Component                | Loading Treatment                                                             |
| ------------------------ | ----------------------------------------------------------------------------- |
| Screen list              | Table skeleton with 4 pulsing rows                                            |
| Media grid               | Card skeletons (gray rectangles with image placeholder). Show 10 skeletons.   |
| Content grid             | Card skeletons matching card layout. Show 8.                                  |
| Playlist slide list      | Row skeletons with grip icon, thumbnail placeholder, and text blocks. Show 5. |
| Schedule calendar        | Calendar grid skeleton with random pulsing blocks                             |
| Preview window           | Full-screen loading spinner with "Loading preview..." text                    |
| Weather widget           | Weather card skeleton with temperature and icon placeholders                  |
| Screen connection status | Pulsing gray dot with "Checking..." text                                      |

### 6.5 Error States

| Error                  | Display                                                                                                                           | Recovery                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Failed to load screens | Full-page: "Unable to load screens. Please check your connection."                                                                | "Try Again" button                                       |
| Failed to upload media | Inline below upload area: "Failed to upload '{filename}'. {reason}."                                                              | "Try Again" per file                                     |
| Failed to save slide   | Toast: "Failed to save slide. Please try again." Form preserved.                                                                  | User clicks "Save" again                                 |
| Failed to push content | Toast: "Failed to push content to '{screen}'. Screen may be disconnected."                                                        | Check connection, retry                                  |
| Screen disconnected    | Red dot on screen list + "Disconnected" status                                                                                    | Auto-reconnects. "Troubleshoot" link opens help article. |
| Media storage full     | Banner: "Storage limit reached. Delete unused media to free up space."                                                            | Link to media library sorted by usage (unused first)     |
| Playlist has no slides | Warning when publishing: "This playlist has no slides. Add at least one slide before publishing."                                 | "Add Slide" button                                       |
| Schedule conflict      | Info message: "This schedule overlaps with '{other schedule}'. The schedule with lower priority number will play during overlap." | Adjust priority or times                                 |
| Emergency push failed  | Red banner: "EMERGENCY DISPLAY FAILED for {N} screens. Check connections immediately."                                            | List of affected screens with "Retry" buttons            |
| Preview failed         | Toast: "Preview unavailable. {reason}."                                                                                           | Close and retry                                          |

### 6.6 Component Usage

| Component          | Where Used                                                | Design System Reference                         |
| ------------------ | --------------------------------------------------------- | ----------------------------------------------- |
| Card               | Media items, slides, templates, screen list (mobile)      | Standard content card                           |
| Table              | Screen list, playlist list, schedule list, audit trail    | Standard data table with sorting                |
| Badge              | Slide type, orientation, status indicators                | Pill-shaped badges                              |
| Toggle             | Active states, mute, loop, auto-play                      | Standard toggle component                       |
| Drag-and-drop list | Playlist slide ordering                                   | Sortable list with grip handles                 |
| Color picker       | Slide backgrounds, text colors, template defaults         | Standard color picker                           |
| File upload        | Media library upload, slide image/video selection         | Drag-and-drop zone with file type indicators    |
| Date picker        | Schedule date range                                       | Standard date picker with calendar popup        |
| Time picker        | Schedule time range                                       | Standard time picker dropdown                   |
| Modal              | Slide picker, push content selector, delete confirmations | Standard modal with backdrop                    |
| Toast              | Success/failure notifications                             | Bottom-right positioned, auto-dismiss 5s        |
| Skeleton           | Loading states for all grids and tables                   | Gray pulsing rectangles matching content layout |
| Progress bar       | Media upload progress, storage usage                      | Thin horizontal bar                             |
| QR code            | Screen detail page, pairing                               | Generated SVG                                   |

### 6.7 Tooltips

| Field / Element    | Tooltip Text                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orientation        | "Select the physical orientation of your screen. Landscape is horizontal (wider than tall). Portrait is vertical (taller than wide)."                                         |
| Pairing Code       | "Enter this code on your display device to connect it. The code expires in 15 minutes."                                                                                       |
| Display URL        | "Open this URL in a web browser on your display device. The screen will automatically connect and start showing content."                                                     |
| Slide Duration     | "How long this slide displays before the playlist advances to the next slide. Range: 5 to 300 seconds."                                                                       |
| Schedule Priority  | "When two playlists are scheduled at the same time for the same screen, the one with the lower priority number plays. Emergency broadcasts always have the highest priority." |
| Fallback Playlist  | "This playlist plays when no schedule is active. Think of it as the default content."                                                                                         |
| Storage Quota      | "Your media storage usage. Images and videos count toward this limit. Delete unused media to free space."                                                                     |
| Announcements Feed | "System-managed playlist that auto-displays announcements marked for digital signage. Configure max slides and duration in settings."                                         |
| Emergency Display  | "Pushes a message to all building screens only. For emergency notifications to residents (SMS, push, voice), use Emergency Broadcast in Communication."                       |
| Custom HTML        | "For advanced users. HTML is sandboxed: external scripts, iframes, and form submissions are blocked. Inline CSS is supported."                                                |
| Mute (Video)       | "Mute audio by default. Building display screens typically run without sound to avoid disturbance."                                                                           |

---

## 7. AI Integration

Four AI capabilities enhance the Digital Signage module. All are optional, controlled by Super Admin toggles, and have manual fallbacks. See PRD 19 (AI Framework) for system-wide AI architecture, provider strategy, and cost management.

### 7.1 Slide Text Generation (AI ID: 70)

| Attribute                | Detail                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Generates display-optimized text for slides from a brief description                                                                                                                    |
| **Trigger**              | User clicks "AI Generate" button on any text field in slide creation                                                                                                                    |
| **Input**                | Slide type, occasion (if celebration), brief description (up to 200 chars), property name                                                                                               |
| **Output**               | Short, display-optimized text (large font, few words, high impact)                                                                                                                      |
| **Default model**        | Haiku                                                                                                                                                                                   |
| **Estimated cost**       | $0.001 per invocation                                                                                                                                                                   |
| **Default state**        | Enabled                                                                                                                                                                                 |
| **Graceful degradation** | User writes text manually. No AI button shown if disabled.                                                                                                                              |
| **UI treatment**         | Small "AI Generate" button with sparkle icon next to text fields. Opens inline input: "Describe what you want to say in a few words." Generates and inserts text. User can edit freely. |

### 7.2 Holiday Content Auto-Generation (AI ID: 71)

| Attribute                | Detail                                                                                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Auto-generates celebration slides for upcoming holidays based on property demographics and calendar                                                                                                                    |
| **Trigger**              | 7 days before a recognized holiday, system suggests content                                                                                                                                                            |
| **Input**                | Holiday name, property name, property demographics (if configured), previous holiday content                                                                                                                           |
| **Output**               | Pre-built celebration slide with message and theme suggestion                                                                                                                                                          |
| **Default model**        | Sonnet                                                                                                                                                                                                                 |
| **Estimated cost**       | $0.005 per invocation                                                                                                                                                                                                  |
| **Default state**        | Disabled                                                                                                                                                                                                               |
| **Graceful degradation** | No auto-suggestions. Staff creates holiday content manually.                                                                                                                                                           |
| **UI treatment**         | Dashboard notification card: "Christmas is in 7 days. We created a holiday greeting for your screens. [Preview] [Add to Playlist] [Dismiss]." Content is not published automatically -- staff must review and approve. |

### 7.3 Optimal Schedule Suggestion (AI ID: 72)

| Attribute                | Detail                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Suggests optimal content rotation schedules based on screen location and time of day                                                                              |
| **Input**                | Screen locations, existing playlists, building type (residential, mixed-use), typical traffic patterns                                                            |
| **Output**               | Suggested schedule: "Lobby screens: announcements 7-9 AM, weather + events 9 AM - 5 PM, community content 5-10 PM"                                                |
| **Default model**        | Haiku                                                                                                                                                             |
| **Estimated cost**       | $0.001 per invocation                                                                                                                                             |
| **Default state**        | Disabled                                                                                                                                                          |
| **Graceful degradation** | Staff creates schedules manually based on judgment.                                                                                                               |
| **UI treatment**         | On the Schedule page, an "AI Suggest" button appears when no schedules exist. Generates a suggested schedule that staff can review, modify, and accept or reject. |

### 7.4 Content Accessibility Check (AI ID: 73)

| Attribute                | Detail                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it does**         | Analyzes slide content for accessibility: color contrast, font size, text readability, image alt text                                                                                                                               |
| **Trigger**              | Automatic on slide save (debounced)                                                                                                                                                                                                 |
| **Input**                | Slide content, colors, font sizes, images                                                                                                                                                                                           |
| **Output**               | Accessibility score (A/B/C) with specific suggestions                                                                                                                                                                               |
| **Default model**        | Haiku                                                                                                                                                                                                                               |
| **Estimated cost**       | $0.001 per invocation                                                                                                                                                                                                               |
| **Default state**        | Enabled                                                                                                                                                                                                                             |
| **Graceful degradation** | No accessibility check. Content publishes without review.                                                                                                                                                                           |
| **UI treatment**         | Below the slide preview: "Accessibility: A (Good)" or "Accessibility: C -- Low contrast between text and background. [Fix automatically]." The "Fix automatically" button adjusts colors to meet WCAG 2.2 AA contrast requirements. |

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric                  | Description                                                 | Refresh Rate |
| ----------------------- | ----------------------------------------------------------- | ------------ |
| Connected Screens       | Count of screens currently connected                        | Real-time    |
| Disconnected Screens    | Count of screens not connected (with alert threshold)       | Real-time    |
| Active Playlists        | Count of playlists currently playing on at least one screen | Real-time    |
| Active Schedules        | Count of schedules currently in effect                      | Real-time    |
| Media Storage Used      | Total storage consumed (with quota percentage)              | Hourly       |
| Content Published Today | Count of new slides or playlists published today            | Real-time    |

### 8.2 Performance Metrics

| Metric                       | Description                                                                   | Refresh Rate |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------ |
| Screen Uptime                | Percentage of time each screen has been connected over the selected period    | Daily        |
| Average Uptime (All Screens) | Average uptime across all screens                                             | Daily        |
| Content Play Count           | How many times each slide has been displayed across all screens               | Daily        |
| Schedule Adherence           | Percentage of time the correct content played at the scheduled time           | Daily        |
| Emergency Response Time      | Time between emergency broadcast and all screens displaying emergency content | Per event    |
| Playlist Completion Rate     | Percentage of playlists that play through all slides before schedule changes  | Weekly       |

### 8.3 Digital Signage Dashboard Widget

A widget available for the main Dashboard (PRD 14) showing:

| Widget Element            | Content                                                        |
| ------------------------- | -------------------------------------------------------------- |
| Screen Status Summary     | "{N} of {M} screens connected" with green/red counts           |
| Current Content           | Thumbnail grid of what each screen is currently displaying     |
| Upcoming Schedule Changes | "In 2 hours: 'Evening Lobby' playlist starts on Lobby screens" |
| Storage Usage             | Progress bar: "2.4 GB / 10 GB"                                 |
| Quick Actions             | "Push Content", "Add Screen", "Create Slide" buttons           |

---

## 9. Notifications

### 9.1 Notification Triggers (Staff-Facing)

| Trigger                             | Recipients                       | Channel      | Template                                                                                                       |
| ----------------------------------- | -------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| Screen disconnected for 10+ minutes | Property Manager, Property Admin | Push + Email | "Screen '{name}' in {location} has been disconnected for {duration}. Check the device and network connection." |
| Screen reconnected after outage     | Property Manager, Property Admin | Push         | "Screen '{name}' is back online."                                                                              |
| Media storage at 90%                | Property Admin                   | Email        | "Digital signage media storage is at {percentage}%. Delete unused media or upgrade your plan."                 |
| Media storage at 100%               | Property Admin                   | Push + Email | "Digital signage storage limit reached. New uploads are blocked until space is freed."                         |
| Scheduled playlist failed to start  | Property Manager                 | Push         | "Playlist '{name}' failed to start on {screen/group} at {time}. Check screen connections."                     |
| Emergency takeover activated        | All staff at property            | Push         | "Emergency display activated on all screens: '{message}'."                                                     |
| Emergency takeover cleared          | All staff at property            | Push         | "Emergency display cleared. Screens returning to normal content."                                              |
| AI holiday content suggestion       | Property Manager                 | Push         | "Christmas is in 7 days. We created a holiday greeting for your screens. Review and publish."                  |

### 9.2 Notification Triggers (Resident-Facing)

None. Digital Signage is a staff-only module. Residents see the content on physical screens but do not receive notifications about signage operations.

---

## 10. API

### 10.1 Endpoints

| Method   | Path                                            | Description                                      | Auth         | Rate Limit    |
| -------- | ----------------------------------------------- | ------------------------------------------------ | ------------ | ------------- |
| `GET`    | `/api/v1/signage/screens`                       | List screens with filters                        | Bearer token | 60/min        |
| `GET`    | `/api/v1/signage/screens/:id`                   | Get screen detail with status                    | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/screens`                       | Register a new screen                            | Bearer token | 20/min        |
| `PUT`    | `/api/v1/signage/screens/:id`                   | Update screen settings                           | Bearer token | 20/min        |
| `DELETE` | `/api/v1/signage/screens/:id`                   | Remove a screen (soft delete)                    | Bearer token | 10/min        |
| `POST`   | `/api/v1/signage/screens/:id/push`              | Push a playlist to a specific screen immediately | Bearer token | 30/min        |
| `POST`   | `/api/v1/signage/screens/:id/pairing-code`      | Generate new pairing code                        | Bearer token | 10/min        |
| `GET`    | `/api/v1/signage/screen-groups`                 | List screen groups                               | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/screen-groups`                 | Create a screen group                            | Bearer token | 20/min        |
| `PUT`    | `/api/v1/signage/screen-groups/:id`             | Update a screen group                            | Bearer token | 20/min        |
| `DELETE` | `/api/v1/signage/screen-groups/:id`             | Delete a screen group                            | Bearer token | 10/min        |
| `POST`   | `/api/v1/signage/screen-groups/:id/push`        | Push a playlist to a screen group immediately    | Bearer token | 30/min        |
| `GET`    | `/api/v1/signage/media`                         | List media assets with filters                   | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/media`                         | Upload media asset(s)                            | Bearer token | 20/min        |
| `PUT`    | `/api/v1/signage/media/:id`                     | Update media metadata                            | Bearer token | 20/min        |
| `DELETE` | `/api/v1/signage/media/:id`                     | Delete media asset (soft delete)                 | Bearer token | 10/min        |
| `GET`    | `/api/v1/signage/slides`                        | List slides with filters                         | Bearer token | 60/min        |
| `GET`    | `/api/v1/signage/slides/:id`                    | Get slide detail                                 | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/slides`                        | Create a slide                                   | Bearer token | 20/min        |
| `PUT`    | `/api/v1/signage/slides/:id`                    | Update a slide                                   | Bearer token | 20/min        |
| `DELETE` | `/api/v1/signage/slides/:id`                    | Delete a slide (soft delete)                     | Bearer token | 10/min        |
| `GET`    | `/api/v1/signage/templates`                     | List templates (system + custom)                 | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/templates`                     | Create custom template                           | Bearer token | 10/min        |
| `PUT`    | `/api/v1/signage/templates/:id`                 | Update custom template                           | Bearer token | 10/min        |
| `DELETE` | `/api/v1/signage/templates/:id`                 | Delete custom template                           | Bearer token | 10/min        |
| `GET`    | `/api/v1/signage/playlists`                     | List playlists with filters                      | Bearer token | 60/min        |
| `GET`    | `/api/v1/signage/playlists/:id`                 | Get playlist with slides                         | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/playlists`                     | Create a playlist                                | Bearer token | 20/min        |
| `PUT`    | `/api/v1/signage/playlists/:id`                 | Update a playlist (including slide order)        | Bearer token | 20/min        |
| `DELETE` | `/api/v1/signage/playlists/:id`                 | Delete a playlist (soft delete)                  | Bearer token | 10/min        |
| `POST`   | `/api/v1/signage/playlists/:id/slides`          | Add slide(s) to a playlist                       | Bearer token | 30/min        |
| `DELETE` | `/api/v1/signage/playlists/:id/slides/:slideId` | Remove a slide from a playlist                   | Bearer token | 30/min        |
| `PUT`    | `/api/v1/signage/playlists/:id/slides/reorder`  | Reorder slides in a playlist                     | Bearer token | 30/min        |
| `GET`    | `/api/v1/signage/schedules`                     | List schedules with filters                      | Bearer token | 60/min        |
| `POST`   | `/api/v1/signage/schedules`                     | Create a schedule                                | Bearer token | 20/min        |
| `PUT`    | `/api/v1/signage/schedules/:id`                 | Update a schedule                                | Bearer token | 20/min        |
| `DELETE` | `/api/v1/signage/schedules/:id`                 | Delete a schedule                                | Bearer token | 10/min        |
| `GET`    | `/api/v1/signage/schedules/preview`             | Preview what plays at a given time               | Bearer token | 30/min        |
| `POST`   | `/api/v1/signage/emergency`                     | Trigger emergency display on all screens         | Bearer token | 5/min         |
| `POST`   | `/api/v1/signage/emergency/clear`               | Clear emergency display                          | Bearer token | 5/min         |
| `GET`    | `/api/v1/signage/analytics`                     | Get signage analytics                            | Bearer token | 30/min        |
| `GET`    | `/display/:property-slug/:screen-slug`          | Public display renderer (no auth, token in URL)  | Access token | None (public) |
| `WS`     | `/ws/signage/:screen-token`                     | WebSocket connection for screen updates          | Access token | 1 conn/screen |

### 10.2 Key Payloads

#### Register Screen (POST /api/v1/signage/screens)

```json
{
  "name": "Main Lobby TV",
  "location": "Front Lobby, near entrance",
  "building_id": "uuid",
  "floor": "1",
  "orientation": "landscape",
  "resolution_width": 1920,
  "resolution_height": 1080,
  "screen_group_ids": ["uuid-lobby-group"],
  "description": "Samsung 55 inch, mounted above reception desk"
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "name": "Main Lobby TV",
  "slug": "main-lobby-tv",
  "display_url": "https://app.concierge.com/display/maple-heights/main-lobby-tv?token=abc123",
  "pairing_code": "847291",
  "pairing_code_expires_at": "2026-03-17T15:15:00Z",
  "connection_status": "disconnected",
  "created_at": "2026-03-17T15:00:00Z"
}
```

#### Create Playlist (POST /api/v1/signage/playlists)

```json
{
  "name": "Daytime Lobby Content",
  "description": "Standard daytime content for lobby screens",
  "orientation": "landscape",
  "default_slide_duration_seconds": 10,
  "transition_effect": "fade",
  "transition_duration_ms": 500,
  "loop": true,
  "slide_ids": [
    { "slide_id": "uuid-1", "sort_order": 1, "duration_override_seconds": null },
    { "slide_id": "uuid-2", "sort_order": 2, "duration_override_seconds": 15 },
    { "slide_id": "uuid-3", "sort_order": 3, "duration_override_seconds": null }
  ]
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "name": "Daytime Lobby Content",
  "orientation": "landscape",
  "slide_count": 3,
  "total_duration_seconds": 35,
  "active": true,
  "created_at": "2026-03-17T15:30:00Z"
}
```

#### Create Schedule (POST /api/v1/signage/schedules)

```json
{
  "playlist_id": "uuid-playlist",
  "target_type": "screen_group",
  "target_group_id": "uuid-lobby-group",
  "schedule_type": "time_and_date_range",
  "start_time": "07:00",
  "end_time": "22:00",
  "days_of_week": [1, 2, 3, 4, 5],
  "start_date": "2026-12-15",
  "end_date": "2026-12-26",
  "priority": 5
}
```

#### Trigger Emergency Display (POST /api/v1/signage/emergency)

```json
{
  "message": "Water pipe burst on Floor 14. Avoid the east stairwell.",
  "severity": "critical"
}
```

**Response (201 Created)**:

```json
{
  "id": "uuid",
  "message": "Water pipe burst on Floor 14. Avoid the east stairwell.",
  "severity": "critical",
  "screens_affected": 8,
  "started_at": "2026-03-17T14:22:00Z"
}
```

### 10.3 Error Responses

| Status Code | Error                    | Description                                                      |
| ----------- | ------------------------ | ---------------------------------------------------------------- |
| 400         | `INVALID_ORIENTATION`    | Slide orientation does not match playlist orientation            |
| 400         | `EMPTY_PLAYLIST`         | Cannot publish a playlist with no slides                         |
| 400         | `INVALID_SCHEDULE`       | Schedule end time is before start time, or date range is invalid |
| 400         | `FILE_TOO_LARGE`         | Uploaded media exceeds size limit                                |
| 400         | `UNSUPPORTED_FILE_TYPE`  | File type not in allowed list                                    |
| 400         | `VIDEO_TOO_LONG`         | Video exceeds 5-minute maximum duration                          |
| 400         | `IMAGE_TOO_SMALL`        | Image does not meet minimum resolution (800px shortest side)     |
| 403         | `INSUFFICIENT_ROLE`      | User does not have permission for this action                    |
| 404         | `SCREEN_NOT_FOUND`       | Screen ID does not exist or belongs to another property          |
| 404         | `PLAYLIST_NOT_FOUND`     | Playlist ID does not exist or belongs to another property        |
| 409         | `SCREEN_NAME_EXISTS`     | A screen with this name already exists at this property          |
| 409         | `PLAYLIST_NAME_EXISTS`   | A playlist with this name already exists at this property        |
| 413         | `STORAGE_LIMIT_EXCEEDED` | Property media storage quota exceeded                            |
| 422         | `SCREEN_DISCONNECTED`    | Cannot push content to a disconnected screen                     |
| 429         | `RATE_LIMIT_EXCEEDED`    | Too many requests. Retry after `Retry-After` header value.       |
| 500         | `PUSH_FAILED`            | Internal error when pushing content to screen                    |
| 503         | `WEATHER_UNAVAILABLE`    | Weather data provider temporarily unavailable                    |

### 10.4 WebSocket Events

Real-time events for connected display screens:

| Event                               | Payload                                                                | Who Receives                                                  |
| ----------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| `signage.playlist_updated`          | `{ playlist_id, slides[], transition_effect, transition_duration_ms }` | All screens currently showing this playlist                   |
| `signage.schedule_changed`          | `{ screen_id, active_playlist_id, next_change_at }`                    | The affected screen                                           |
| `signage.content_push`              | `{ screen_id, playlist_id, slides[] }`                                 | The target screen                                             |
| `signage.emergency_takeover`        | `{ property_id, message, severity, type }`                             | All screens for the property                                  |
| `signage.emergency_clear`           | `{ property_id }`                                                      | All screens for the property                                  |
| `signage.screen_settings_updated`   | `{ screen_id, orientation, resolution_width, resolution_height }`      | The affected screen                                           |
| `signage.heartbeat`                 | `{ screen_id, timestamp }`                                             | Individual screen (server-initiated, expects `heartbeat_ack`) |
| `signage.weather_update`            | `{ property_id, weather_data }`                                        | All screens displaying weather slides                         |
| `signage.announcement_feed_updated` | `{ property_id, playlist_id, slides[] }`                               | All screens showing the announcement feed playlist            |

Real-time events for staff dashboard:

| Event                         | Payload                                       | Who Receives                                |
| ----------------------------- | --------------------------------------------- | ------------------------------------------- |
| `signage.screen_connected`    | `{ screen_id, name, location }`               | All staff viewing Digital Signage dashboard |
| `signage.screen_disconnected` | `{ screen_id, name, location, last_seen_at }` | All staff viewing Digital Signage dashboard |

---

## 11. Permissions Matrix

### 11.1 Role Access

| Feature                        | Front Desk / Concierge |      Security Guard      | Property Manager | Property Admin | Super Admin | Board Member | Resident |
| ------------------------------ | :--------------------: | :----------------------: | :--------------: | :------------: | :---------: | :----------: | :------: |
| View Digital Signage dashboard |          Yes           |           Yes            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Register screens               |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Edit screen settings           |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete screens                 |           No           |            No            |        No        |      Yes       |     Yes     |      No      |    No    |
| Create screen groups           |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Edit screen groups             |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete screen groups           |           No           |            No            |        No        |      Yes       |     Yes     |      No      |    No    |
| Upload media                   |          Yes           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete media                   |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Create slides                  |          Yes           | Yes (Warning/Alert only) |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Edit slides                    |     Yes (own only)     |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete slides                  |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Create playlists               |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Edit playlists                 |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete playlists               |           No           |            No            |        No        |      Yes       |     Yes     |      No      |    No    |
| Create schedules               |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Edit schedules                 |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete schedules               |           No           |            No            |        No        |      Yes       |     Yes     |      No      |    No    |
| Push content to screens        |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Preview screens/playlists      |          Yes           |           Yes            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Trigger emergency display      |           No           |       Configurable       |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Clear emergency display        |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Create custom templates        |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Edit custom templates          |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Delete custom templates        |           No           |            No            |        No        |      Yes       |     Yes     |      No      |    No    |
| View analytics                 |           No           |            No            |       Yes        |      Yes       |     Yes     |      No      |    No    |
| Configure signage settings     |           No           |            No            |        No        |      Yes       |     Yes     |      No      |    No    |

### 11.2 Security Guard Emergency Display Permission

The Security Guard role has a configurable permission for triggering emergency display:

| Setting                                            | Location                                 | Default | Description                                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Allow Security Guards to trigger emergency display | Settings > Digital Signage > Permissions | Off     | When enabled, Security Guards see the "Emergency Display" button on the Digital Signage dashboard. When disabled, the button is hidden (not grayed out). |

---

## 12. Settings (Property Admin)

**Entry Point**: Settings > Digital Signage

### 12.1 General Settings

| #   | Setting                   | Type             | Default        | Description                                                                                               |
| --- | ------------------------- | ---------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Module Enabled            | Toggle           | true           | Enable or disable Digital Signage for this property. When disabled, all display URLs return a blank page. |
| 2   | Default Slide Duration    | Number (seconds) | 10             | Default duration for new slides when not specified.                                                       |
| 3   | Default Transition Effect | Dropdown         | Fade           | Default transition for new playlists.                                                                     |
| 4   | Property Logo on Displays | Toggle           | true           | Show property logo watermark in corner of all slides.                                                     |
| 5   | Logo Position             | Dropdown         | Bottom Right   | Options: Top Left, Top Right, Bottom Left, Bottom Right.                                                  |
| 6   | Logo Opacity              | Slider           | 30%            | Range: 10% - 100%.                                                                                        |
| 7   | Clock Display             | Toggle           | true           | Show current time on all screens (small, corner).                                                         |
| 8   | Clock Format              | Radio group      | 12-hour        | Options: 12-hour, 24-hour.                                                                                |
| 9   | Clock Position            | Dropdown         | Top Right      | Options: Top Left, Top Right, Bottom Left, Bottom Right.                                                  |
| 10  | Weather Provider          | Dropdown         | OpenWeatherMap | Configurable weather data source.                                                                         |
| 11  | Temperature Units         | Radio group      | Metric         | Options: Metric (Celsius), Imperial (Fahrenheit).                                                         |

### 12.2 Announcement Feed Settings

| #   | Setting                       | Type             | Default                    | Description                                                                       |
| --- | ----------------------------- | ---------------- | -------------------------- | --------------------------------------------------------------------------------- |
| 1   | Auto-Create Announcement Feed | Toggle           | true                       | Automatically create and maintain the "Announcements Feed" playlist.              |
| 2   | Max Announcement Slides       | Number           | 10                         | Maximum slides in the announcement feed. Oldest removed first when limit reached. |
| 3   | Announcement Slide Duration   | Number (seconds) | 10                         | Duration per announcement slide.                                                  |
| 4   | Announcement Slide Template   | Dropdown         | "Full Screen Announcement" | Template used for auto-created announcement slides.                               |

### 12.3 Emergency Display Settings

| #   | Setting                         | Type      | Default        | Description                                                                                                                            |
| --- | ------------------------------- | --------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Emergency Takeover              | Read-only | Always Enabled | "Emergency broadcast takeover cannot be disabled. This is a safety feature."                                                           |
| 2   | Emergency Flash Animation       | Toggle    | true           | Enable/disable flashing border on emergency display. Some properties may prefer a static display for accessibility (photosensitivity). |
| 3   | Emergency Font Size             | Dropdown  | 72px           | Options: 48px, 60px, 72px, 96px.                                                                                                       |
| 4   | Security Guard Emergency Access | Toggle    | false          | Allow Security Guards to trigger emergency display from this module.                                                                   |

### 12.4 Storage Settings

| #   | Setting                  | Type      | Default               | Description                                                       |
| --- | ------------------------ | --------- | --------------------- | ----------------------------------------------------------------- |
| 1   | Storage Used             | Read-only | --                    | Current usage with progress bar.                                  |
| 2   | Storage Quota            | Read-only | Per subscription tier | "Contact support to upgrade."                                     |
| 3   | Auto-Delete Unused Media | Toggle    | false                 | Automatically delete media not used in any playlist for 90+ days. |
| 4   | Auto-Delete Warning Days | Number    | 7                     | Days of warning before auto-deletion. Staff notified via email.   |

---

## 13. Accessibility

### 13.1 Admin Interface Accessibility (WCAG 2.2 AA)

| Requirement           | Implementation                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keyboard navigation   | All forms, buttons, drag-and-drop lists, and calendar views are fully keyboard-accessible. Drag-and-drop has keyboard alternative (up/down arrow keys to reorder). |
| Screen reader support | All images have alt text. Form fields have labels. Status indicators have aria-labels.                                                                             |
| Color contrast        | All text meets WCAG 2.2 AA contrast ratio (4.5:1 for normal text, 3:1 for large text).                                                                             |
| Focus indicators      | Visible focus ring (2px blue outline) on all interactive elements.                                                                                                 |
| Error identification  | Form errors are announced by screen readers. Error messages appear directly below the invalid field.                                                               |
| Touch targets         | All interactive elements are at least 44x44px on touch devices.                                                                                                    |

### 13.2 Display Content Accessibility

| Requirement              | Implementation                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Font size minimum        | Display text is never smaller than 24px. Headlines are 48px+.                                                        |
| Color contrast on slides | AI accessibility check (7.4) warns when text-to-background contrast is below 4.5:1.                                  |
| No auto-playing audio    | Videos default to muted. Audio can be enabled per-slide but the default protects shared spaces.                      |
| Photosensitivity         | Emergency flash animation can be disabled in settings (12.3). No other content uses rapid flashing.                  |
| Slide duration minimum   | 5-second minimum ensures content is readable. AI check warns when text-heavy slides have durations under 10 seconds. |
| Weather icons            | Weather conditions are shown with both icon and text label (not icon-only).                                          |

---

## 14. Completeness Checklist

### Feature Coverage

| Requirement                                     | Section             | Status  |
| ----------------------------------------------- | ------------------- | ------- |
| Screen registration with URL and pairing        | 3.1.1               | Covered |
| Screen list with status monitoring              | 3.1.2               | Covered |
| Screen groups for bulk management               | 3.1.3               | Covered |
| Media library with upload and organization      | 3.1.4               | Covered |
| 10 slide types with type-specific fields        | 3.1.5               | Covered |
| Content list with filters                       | 3.1.6               | Covered |
| Template system (12 system + custom)            | 3.1.7               | Covered |
| Playlist creation with drag-and-drop ordering   | 3.1.8               | Covered |
| Schedule system with time and date ranges       | 3.1.9               | Covered |
| WYSIWYG preview (slide, playlist, screen, time) | 3.1.10              | Covered |
| Real-time push via WebSocket                    | 3.1.11              | Covered |
| Emergency broadcast auto-takeover               | 3.1.12              | Covered |
| Announcement module integration                 | 3.1.13              | Covered |
| Weather widget integration                      | 3.1.14              | Covered |
| Vertical and horizontal orientation             | 3.1.1, 3.1.5, 3.1.7 | Covered |
| Auto-rotate with configurable duration          | 3.1.8               | Covered |
| Schedule conflict resolution with priorities    | 3.1.9               | Covered |
| Offline resilience for screens                  | 3.1.11              | Covered |
| Storage quota management                        | 3.1.4               | Covered |

### AI Coverage

| AI Capability                   | AI ID | Section | Status  |
| ------------------------------- | ----- | ------- | ------- |
| Slide Text Generation           | 70    | 7.1     | Covered |
| Holiday Content Auto-Generation | 71    | 7.2     | Covered |
| Optimal Schedule Suggestion     | 72    | 7.3     | Covered |
| Content Accessibility Check     | 73    | 7.4     | Covered |

### Responsive Design

| Screen            | Desktop | Tablet  | Mobile  | Empty State | Loading State | Error State |
| ----------------- | ------- | ------- | ------- | ----------- | ------------- | ----------- |
| Dashboard         | Covered | Covered | Covered | Covered     | Covered       | Covered     |
| Screen list       | Covered | Covered | Covered | Covered     | Covered       | Covered     |
| Screen detail     | Covered | Covered | Covered | N/A         | Covered       | Covered     |
| Media library     | Covered | Covered | Covered | Covered     | Covered       | Covered     |
| Content list      | Covered | Covered | Covered | Covered     | Covered       | Covered     |
| Slide creation    | Covered | Covered | Covered | N/A         | Covered       | Covered     |
| Template gallery  | Covered | Covered | Covered | Covered     | Covered       | Covered     |
| Playlist editor   | Covered | Covered | Covered | Covered     | Covered       | Covered     |
| Schedule calendar | Covered | Covered | Covered | Covered     | Covered       | Covered     |

### Role Access

| Feature               | Front Desk  |   Security   | Prop. Manager | Prop. Admin | Super Admin |
| --------------------- | :---------: | :----------: | :-----------: | :---------: | :---------: |
| View dashboard        |     Yes     |     Yes      |      Yes      |     Yes     |     Yes     |
| Register/edit screens |     No      |      No      |      Yes      |     Yes     |     Yes     |
| Manage media          | Upload only |      No      |      Yes      |     Yes     |     Yes     |
| Create/edit slides    |     Yes     | Warning only |      Yes      |     Yes     |     Yes     |
| Manage playlists      |     No      |      No      |      Yes      |     Yes     |     Yes     |
| Manage schedules      |     No      |      No      |      Yes      |     Yes     |     Yes     |
| Push content          |     No      |      No      |      Yes      |     Yes     |     Yes     |
| Emergency display     |     No      | Configurable |      Yes      |     Yes     |     Yes     |
| Configure settings    |     No      |      No      |      No       |     Yes     |     Yes     |
| View analytics        |     No      |      No      |      Yes      |     Yes     |     Yes     |

---

## 15. Integration Points

| Integration         | Module                    | Direction     | Description                                                                               |
| ------------------- | ------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Emergency Broadcast | Communication (PRD 09)    | Inbound       | Emergency broadcasts auto-trigger full-screen takeover on all screens                     |
| Announcements       | Communication (PRD 09)    | Inbound       | Announcements with "Digital Signage" channel create auto-slides in the Announcements Feed |
| Weather             | Integrations (PRD 18)     | Inbound       | Weather data from configured provider refreshes every 15 minutes                          |
| Amenity Booking     | Amenity Booking (PRD 06)  | Inbound       | Amenity Status slides pull real-time availability from the Booking module                 |
| Community Events    | Community Events (future) | Inbound       | Event Calendar slides pull upcoming events                                                |
| WebSocket           | Architecture (PRD 01)     | Bidirectional | Real-time screen updates and heartbeat monitoring                                         |
| Media Storage       | Architecture (PRD 01)     | Internal      | CDN-backed storage for images and videos                                                  |
| Billing             | Billing (PRD 24)          | Internal      | Media storage quota tied to subscription tier                                             |
| Audit Trail         | Architecture (PRD 01)     | Internal      | All signage actions logged in SignageAuditLog                                             |

---

_Last updated: 2026-03-17_
_Module: Digital Signage_
_Dependencies: 01-Architecture, 02-Roles and Permissions, 09-Communication, 19-AI Framework_
_Integration points: OpenWeatherMap (Weather), WebSocket (Real-time), CDN (Media Storage), Communication Module (Emergency + Announcements), Amenity Booking Module (Status)_
