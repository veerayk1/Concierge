# 17 — Mobile & Responsive

> **Status**: Draft
> **Last updated**: 2026-03-14
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 15-Search and Navigation, 19-AI Framework

---

## 1. Overview

Concierge is a **mobile-first, responsive web application** that installs like a native app through Progressive Web App (PWA) technology. Every screen, form, and workflow is designed for touch interaction first and then enhanced for keyboard and mouse on larger screens.

### Why This Matters

Building management does not happen at a desk. Security guards patrol hallways. Maintenance staff inspect equipment in mechanical rooms. Concierges stand at a front desk with a tablet. Residents check packages from their couch. The platform must work flawlessly on every screen size, in every network condition, and with the device capabilities each role depends on.

### Key Facts

| Aspect | Detail |
|--------|--------|
| **Approach** | Progressive Web App (PWA) -- single codebase, installable on all devices |
| **Breakpoints** | Mobile (375px), Tablet (768px), Desktop (1280px+) |
| **Offline support** | Service worker caching with background sync for create/update operations |
| **Push notifications** | Firebase Cloud Messaging (FCM) for Android and web, APNs for iOS Safari |
| **Biometric auth** | Web Authentication API (WebAuthn) for Face ID, Touch ID, and fingerprint |
| **Native app** | Considered for v3+ if PWA limitations block critical workflows |
| **Target performance** | First Contentful Paint under 1.5s on 4G, Time to Interactive under 3s |

### Design Principle

> One codebase. Three breakpoints. Every role optimized for the device they actually use.

---

## 2. Research Summary

Industry research across three competing platforms revealed critical gaps in mobile strategy:

| Finding | Detail | Concierge Decision |
|---------|--------|--------------------|
| **Desktop-only design** | One platform has no mobile app at all. Its forms and tables are unusable on phones. | Mobile-first responsive design from day one. |
| **Separate native apps** | Another platform ships two separate native apps (staff and resident) with different feature sets and inconsistent UI. | Single PWA codebase with role-aware rendering eliminates feature fragmentation. |
| **No offline capability** | None of the platforms observed support offline operation. Guards lose access during network outages. | Service worker caching with offline queue for critical operations (incident reports, visitor logs). |
| **Missing push notifications** | One platform relies entirely on email. Another has push but only for residents, not staff. | FCM-based push for all roles, all event types, with per-user channel preferences. |
| **No biometric login** | No platform observed supports Face ID or fingerprint authentication. Guards re-enter passwords dozens of times per shift. | WebAuthn integration for fast biometric re-authentication. |
| **No camera integration** | Maintenance forms on competing platforms do not access the device camera directly. Users must take a photo separately and then upload it. | Direct camera access in forms for photos, barcode scanning, and document capture. |
| **No voice input** | No platform supports voice-to-text for incident reporting. Guards type descriptions on tiny keyboards. | Web Speech API integration for voice-to-text on incident and event descriptions. |
| **Poor touch targets** | Table-heavy interfaces with small click targets designed for mouse cursors. Buttons under 30px. | Minimum 44x44px touch targets. Swipe gestures for common actions. Pull-to-refresh on all lists. |

---

## 3. Feature Spec

### 3.1 Responsive Breakpoints

Three breakpoints govern layout adaptation. The system uses a fluid grid between breakpoints -- it does not "snap" between fixed widths.

| Breakpoint | Min Width | Max Width | Target Devices | Layout Strategy |
|------------|-----------|-----------|----------------|-----------------|
| **Mobile** | 320px | 767px | Phones (iPhone SE through iPhone Pro Max, Android) | Single column. Bottom navigation. Stacked cards. Full-width forms. |
| **Tablet** | 768px | 1279px | iPads, Android tablets, small laptops | Two-column where useful. Side navigation (collapsible). Split-view for list/detail. |
| **Desktop** | 1280px | No max | Laptops, desktops, large monitors | Multi-column. Persistent side navigation. Tables with full column sets. Modals and slide-overs. |

#### Breakpoint Behavior Rules

| Rule | Detail |
|------|--------|
| **Fluid grid** | Columns use percentage widths and CSS Grid/Flexbox. No fixed pixel widths for content containers. |
| **Content priority** | On mobile, secondary content moves below primary content (never hidden entirely). Progressive disclosure hides "advanced" fields behind expandable sections. |
| **Typography scaling** | Base font size: 16px (mobile), 15px (tablet), 14px (desktop). Line height: 1.5 across all breakpoints. |
| **Touch target minimum** | All interactive elements are at least 44x44px on mobile and tablet. Desktop can use 32x32px. |
| **Image optimization** | Responsive images via `srcset`. WebP with JPEG fallback. Lazy loading for off-screen images. |
| **Table adaptation** | Tables with more than 4 columns convert to card view on mobile. Tables with 4 or fewer columns use horizontal scroll. |

### 3.2 Progressive Web App (PWA)

Concierge ships as a PWA -- installable on the home screen with an app-like experience.

#### Web App Manifest

| Field | Value | Type | Required |
|-------|-------|------|----------|
| `name` | `Concierge` | string, max 45 chars | Yes |
| `short_name` | `Concierge` | string, max 12 chars | Yes |
| `description` | `Building management portal` | string, max 100 chars | Yes |
| `start_url` | `/dashboard` | URL path | Yes |
| `display` | `standalone` | enum: `standalone`, `fullscreen`, `minimal-ui`, `browser` | Yes |
| `orientation` | `any` | enum: `any`, `portrait`, `landscape` | Yes |
| `theme_color` | `#FFFFFF` | hex color, 7 chars | Yes |
| `background_color` | `#FFFFFF` | hex color, 7 chars | Yes |
| `icons` | Array of icon objects (192x192, 512x512 minimum) | array of `{src, sizes, type}` | Yes |
| `scope` | `/` | URL path | Yes |
| `categories` | `["business", "productivity"]` | string array | Optional |

**Validation**: Manifest must pass Lighthouse PWA audit with a score of 100.

**Error state**: If the manifest fails to load, the app functions as a standard web app. No user-facing error.

#### Install Prompt

| Attribute | Detail |
|-----------|--------|
| **Trigger** | After the user has visited 3+ times AND spent 5+ minutes total. Never on first visit. |
| **UI** | Bottom sheet on mobile: "Add Concierge to your home screen for quick access." with [Install] and [Not now] buttons. |
| **Dismissal** | "Not now" suppresses the prompt for 30 days. |
| **Re-prompt** | After 30 days, shows once more. After second dismissal, never shows again (stored in localStorage). |
| **Already installed** | Prompt never appears if the app is already installed (detected via `display-mode: standalone` media query). |

**Tooltip**: _"Installing Concierge adds it to your home screen. It opens instantly like a native app, works offline, and sends push notifications."_

#### PWA Capabilities by Platform

| Capability | Chrome (Android) | Safari (iOS) | Chrome (Desktop) | Firefox | Edge |
|------------|:---:|:---:|:---:|:---:|:---:|
| Install to home screen | Yes | Yes (Add to Home) | Yes | No | Yes |
| Service worker | Yes | Yes | Yes | Yes | Yes |
| Push notifications | Yes | Yes (iOS 16.4+) | Yes | Yes | Yes |
| Background sync | Yes | Limited | Yes | No | Yes |
| WebAuthn (biometric) | Yes | Yes | Yes | Yes | Yes |
| Camera access | Yes | Yes | Yes | Yes | Yes |
| Geolocation | Yes | Yes | Yes | Yes | Yes |

### 3.3 Offline Capability

Concierge works during network interruptions. Staff cannot be blocked from logging incidents or receiving packages because the Wi-Fi went down.

#### Service Worker Caching Strategy

| Resource Type | Strategy | Cache Duration | Max Size |
|---------------|----------|---------------|----------|
| **App shell** (HTML, CSS, JS) | Cache-first, network-update | Until next deployment | 10 MB |
| **API responses** (lists, dashboards) | Network-first, cache-fallback | 15 minutes | 50 MB |
| **Static assets** (icons, images, fonts) | Cache-first | 30 days | 25 MB |
| **User-generated content** (photos, docs) | Network-only (no offline cache) | N/A | N/A |
| **Authentication tokens** | Stored in IndexedDB (encrypted) | Session duration | N/A |

**Validation**: Total offline cache must not exceed 100 MB per device.

**Error message** (when offline and trying to access uncached data): _"You are currently offline. This content is not available offline. It will load automatically when your connection returns."_

#### Offline Operation Queue

When the device is offline, create and update operations are queued locally and synced when the connection returns.

| Field | Type | Max Length | Required | Default | Validation |
|-------|------|-----------|----------|---------|------------|
| `queue_id` | UUID | 36 chars | Auto | Auto-generated | UUID v4 format |
| `operation_type` | enum | N/A | Yes | N/A | One of: `create_event`, `update_event`, `create_note`, `update_status` |
| `entity_type` | string | 50 chars | Yes | N/A | Must match a valid entity name |
| `payload` | JSON | 50 KB | Yes | N/A | Must be valid JSON, must pass entity-level validation |
| `created_at` | ISO 8601 timestamp | N/A | Auto | Current device time | Valid ISO 8601 with timezone offset |
| `user_id` | UUID | 36 chars | Auto | Authenticated user | Must match active session |
| `property_id` | UUID | 36 chars | Auto | Active property | Must match user's assigned property |
| `sync_status` | enum | N/A | Auto | `pending` | One of: `pending`, `syncing`, `synced`, `conflict`, `failed` |
| `retry_count` | integer | N/A | Auto | `0` | 0-5. After 5 retries, status becomes `failed`. |
| `conflict_resolution` | enum | N/A | No | `null` | One of: `keep_local`, `keep_server`, `merge`, `null` |

**Tooltip** (on sync indicator): _"Items created offline are saved on your device and will sync automatically when you reconnect. A badge shows how many items are waiting to sync."_

#### Offline-Capable Operations by Role

| Role | Offline Operations Allowed |
|------|---------------------------|
| **Security Guard** | Create incident report, log visitor entry, create shift note, update event status |
| **Front Desk / Concierge** | Create package intake, log visitor, create shift note |
| **Maintenance Staff** | Update work order status, add work log entry |
| **Property Manager** | Create shift note, draft announcement (syncs as draft) |
| **Resident** | Submit maintenance request (syncs when online), view cached packages |

#### Sync Behavior

| Scenario | Behavior |
|----------|----------|
| **Connection restored** | Background sync triggers automatically. Queue processes in FIFO order. |
| **Conflict detected** | If the server version changed while offline, the user sees a conflict resolution dialog: "This record was modified while you were offline. Keep your version, keep the server version, or merge both?" |
| **Sync failure** | After 5 retries (exponential backoff: 1s, 2s, 4s, 8s, 16s), the item is marked `failed`. The user sees: "This item could not be synced. Tap to retry or discard." |
| **Offline indicator** | A persistent banner at the top of the screen: yellow background, text "You are offline. Changes will sync when connected." with a sync count badge. |

**Empty state** (no queued items): Sync indicator is hidden. No empty state needed.

### 3.4 Push Notifications

Push notifications use Firebase Cloud Messaging (FCM) for delivery across all platforms.

#### Notification Permission Flow

| Step | Action |
|------|--------|
| 1 | User logs in for the first time on a new device. |
| 2 | After completing their first action (not immediately on login), a bottom sheet appears: "Enable notifications to get alerts for packages, visitors, and emergencies." |
| 3 | User taps [Enable] or [Not now]. |
| 4 | If [Enable], the browser's native permission dialog appears. |
| 5 | If granted, the FCM token is registered to the user's device record. |
| 6 | If [Not now], the prompt is suppressed for 7 days. |
| 7 | If the browser permission is denied, the app shows: "Notifications are blocked. To enable, go to your browser settings and allow notifications for this site." |

#### Notification Payload

| Field | Type | Max Length | Required | Default | Validation |
|-------|------|-----------|----------|---------|------------|
| `title` | string | 65 chars | Yes | N/A | Cannot be empty. Truncated at 65 chars with ellipsis. |
| `body` | string | 240 chars | Yes | N/A | Cannot be empty. Truncated at 240 chars with ellipsis. |
| `icon` | URL | 2048 chars | No | Property logo or Concierge default icon | Must be HTTPS URL to a PNG/JPEG image. |
| `badge` | URL | 2048 chars | No | Concierge monochrome badge | Must be HTTPS URL to a PNG image. |
| `tag` | string | 100 chars | No | `null` | Used for notification grouping. Same tag replaces previous notification. |
| `data.url` | URL path | 2048 chars | Yes | `/dashboard` | Deep link URL opened when notification is tapped. |
| `data.event_id` | UUID | 36 chars | No | `null` | If present, navigates directly to the event detail screen. |
| `data.module` | string | 50 chars | No | `null` | Module name for analytics tracking. |
| `requireInteraction` | boolean | N/A | No | `false` | If `true`, notification stays until user interacts. Used for emergencies. |
| `silent` | boolean | N/A | No | `false` | If `true`, no sound or vibration. Used for low-priority updates. |

#### Notification Categories

| Category | Priority | Sound | Vibration | Persist | Example |
|----------|----------|-------|-----------|---------|---------|
| **Emergency** | Critical | Alert tone | Long pulse | Yes (until dismissed) | Fire alarm, security breach |
| **Package** | Normal | Default | Short pulse | No | "You have a package at the front desk" |
| **Visitor** | Normal | Default | Short pulse | No | "A visitor is waiting for you in the lobby" |
| **Maintenance** | Low | Silent | None | No | "Your maintenance request has been updated" |
| **Announcement** | Normal | Default | Short pulse | No | "New announcement from management" |
| **Shift** | Normal | Default | Short pulse | No | "Your shift starts in 30 minutes" |
| **Booking** | Low | Silent | None | No | "Your amenity booking is confirmed" |

### 3.5 Mobile-Optimized Forms

Forms on mobile use device capabilities to reduce typing and speed up data entry.

#### Camera Access

| Feature | Trigger | API | Fallback |
|---------|---------|-----|----------|
| **Photo capture** | Tap camera icon on any photo upload field | `<input type="file" accept="image/*" capture="environment">` | Standard file picker |
| **Barcode scanning** | Tap barcode icon on package intake form | Barcode Detection API (or ZXing.js polyfill) | Manual text entry for tracking number |
| **Document scan** | Tap document icon on attachment fields | Camera capture with edge detection (client-side) | Standard file upload |

**Photo capture field**:

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `photo` | binary (JPEG/PNG/WebP/HEIC) | 10 MB per file | No | `null` | Max 10 MB. Accepted types: JPEG, PNG, WebP, HEIC. Max 5 photos per form. | "File is too large. Maximum size is 10 MB." / "File type not supported. Use JPEG, PNG, WebP, or HEIC." / "Maximum 5 photos per form." |
| `photo_source` | enum | N/A | Auto | `camera` | One of: `camera`, `gallery`, `file` | N/A |
| `photo_location` | GeoJSON point | N/A | No | Device GPS if available | Valid latitude (-90 to 90) and longitude (-180 to 180) | "Unable to determine location." |
| `photo_timestamp` | ISO 8601 | N/A | Auto | Capture time | Valid ISO 8601 | N/A |

**Tooltip** (on camera icon): _"Take a photo directly or choose from your gallery."_

#### GPS for Inspections

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `inspection_lat` | decimal | 10 digits | Conditionally required (inspections only) | Device GPS | Valid latitude: -90.000000 to 90.000000 | "Location is required for inspections. Please enable location services." |
| `inspection_lng` | decimal | 11 digits | Conditionally required (inspections only) | Device GPS | Valid longitude: -180.000000 to 180.000000 | "Location is required for inspections. Please enable location services." |
| `inspection_accuracy` | decimal (meters) | 6 digits | Auto | N/A | Positive number. Warning if > 50 meters. | N/A (warning only: "Location accuracy is low. Move to an open area for better accuracy.") |
| `inspection_timestamp` | ISO 8601 | N/A | Auto | Current time | Valid ISO 8601 with timezone | N/A |

**Tooltip** (on location badge): _"Your location is recorded to verify that the inspection was performed at the correct spot. Location data is only visible to supervisors."_

#### Voice-to-Text

| Attribute | Detail |
|-----------|--------|
| **API** | Web Speech API (`SpeechRecognition` interface) |
| **Trigger** | Microphone icon on all multi-line text fields (descriptions, notes, comments) |
| **Languages** | English (default), French. Language follows the user's app language setting. |
| **Max duration** | 120 seconds per recording. Timer shown to the user. |
| **Feedback** | Real-time transcription appears in the text field as the user speaks. Waveform animation on the microphone icon. |
| **Editing** | Transcribed text is fully editable. The user can speak, then correct by typing. |
| **Fallback** | If Web Speech API is unavailable, the microphone icon is hidden. Standard keyboard input only. |
| **Privacy** | Audio is processed by the browser's speech engine (Google/Apple). Not sent to Concierge servers. Privacy note shown on first use: "Voice is processed by your device or browser. Concierge does not store audio recordings." |

**Error message** (microphone permission denied): _"Microphone access is needed for voice input. To enable, go to your browser settings and allow microphone access for this site."_

**Error message** (speech not recognized): _"Could not understand speech. Please try again or type your text."_

### 3.6 Touch Interactions

| Gesture | Where | Action | Visual Feedback |
|---------|-------|--------|-----------------|
| **Swipe left** | Event cards, package cards, notification items | Reveals action buttons (Archive, Delete, Mark Read) | Card slides left, action buttons slide in from right with colored backgrounds (red for delete, gray for archive) |
| **Swipe right** | Event cards, package cards | Quick action (e.g., Mark Complete, Release Package) | Card slides right, green background with checkmark icon revealed |
| **Pull-to-refresh** | All list views, dashboard | Refreshes data from server | Spinner animation pulled down from top. Haptic feedback on release threshold. |
| **Long press** | List items, cards | Opens context menu (share, copy reference, view details) | Subtle scale animation (1.02x) + haptic pulse. Context menu appears as bottom sheet on mobile. |
| **Pinch-to-zoom** | Photos, documents, floor plans | Zooms in/out | Standard browser zoom behavior within the image container |
| **Double tap** | Calendar day cells | Creates new booking for that date | Cell highlights, booking creation form opens |
| **Tap and hold + drag** | Dashboard widget reordering | Repositions widgets | Widget lifts with shadow, other widgets animate to make room |

### 3.7 Bottom Navigation (Mobile)

On mobile (< 768px), the sidebar collapses into a bottom navigation bar with 4-5 items based on the user's role.

#### Bottom Navigation by Role

| Role | Item 1 | Item 2 | Item 3 | Item 4 | Item 5 (More) |
|------|--------|--------|--------|--------|---------------|
| **Security Guard** | Dashboard | Security | Packages | Shift Log | More |
| **Concierge** | Dashboard | Packages | Visitors | Shift Log | More |
| **Maintenance** | Dashboard | Requests | Schedule | Shift Log | More |
| **Property Manager** | Dashboard | Requests | Packages | Reports | More |
| **Resident** | Dashboard | Packages | Bookings | Requests | More |

| Attribute | Detail |
|-----------|--------|
| **Max items** | 5 (including "More" overflow) |
| **Active indicator** | Filled icon + accent color label. Inactive items use outline icons + gray label. |
| **Badge count** | Red badge with white number on items with pending actions (e.g., "3" on Packages for unreleased items). Max displayed: "99+". |
| **"More" menu** | Opens a bottom sheet with remaining navigation items in a grid layout (icon + label). |
| **Hide on scroll** | Bottom nav hides when scrolling down, reappears when scrolling up or reaching the bottom. Transition: 200ms slide. |
| **Safe area** | Bottom nav respects iOS safe area insets (notch/home indicator). Minimum 34px bottom padding on notched devices. |

### 3.8 Biometric Authentication

Concierge uses the Web Authentication API (WebAuthn) for biometric login -- Face ID on iPhone, Touch ID on Mac, fingerprint on Android.

#### Biometric Setup Flow

| Step | Screen | Action |
|------|--------|--------|
| 1 | Login (after password auth) | "Speed up future logins with Face ID / fingerprint?" with [Enable] and [Skip] buttons. |
| 2 | Enable tapped | Browser's native biometric enrollment dialog appears. |
| 3 | Enrollment succeeds | Credential stored. "Biometric login enabled. You can disable it in Account Settings." |
| 4 | Next login | Biometric prompt appears automatically. Password field available as fallback via "Use password instead" link. |

#### Biometric Configuration

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `webauthn_enabled` | boolean | N/A | No | `false` | N/A | N/A |
| `webauthn_credential_id` | string | 1024 chars | Conditionally (if enabled) | `null` | Base64url-encoded credential ID | "Biometric setup failed. Please try again." |
| `webauthn_public_key` | string | 2048 chars | Conditionally (if enabled) | `null` | Valid COSE public key | "Biometric setup failed. Please try again." |
| `webauthn_device_name` | string | 100 chars | No | Auto-detected (e.g., "iPhone 15 Pro") | Alphanumeric + spaces, 1-100 chars | "Device name must be between 1 and 100 characters." |
| `webauthn_created_at` | ISO 8601 | N/A | Auto | Registration time | Valid ISO 8601 | N/A |
| `webauthn_last_used_at` | ISO 8601 | N/A | Auto | Last successful auth | Valid ISO 8601 | N/A |

**Tooltip** (in Account Settings): _"Biometric login uses your device's Face ID, Touch ID, or fingerprint sensor. Your biometric data never leaves your device -- only a cryptographic key is stored on our servers."_

**Error message** (biometric auth fails): _"Biometric authentication failed. Please try again or use your password."_

**Error message** (biometric unavailable): _"Biometric login is not available on this device or browser."_

#### Security Rules

| Rule | Detail |
|------|--------|
| **Max devices** | 5 registered biometric devices per user. Oldest can be removed from Account Settings. |
| **Session duration** | Biometric login creates a standard session (8 hours staff, 30 days resident with "Remember me"). |
| **Sensitive actions** | Password change, role change, and 2FA modification always require full password re-authentication, even with biometric enabled. |
| **Revocation** | Admin can revoke all biometric credentials for a user. User can revoke individual devices from Account Settings. |
| **Fallback** | Password login is always available. Biometric is a convenience layer, never the only option. |

### 3.9 Mobile-Specific Features

#### Barcode Scanning for Packages

| Attribute | Detail |
|-----------|--------|
| **Trigger** | Barcode icon button on the package intake form, next to the tracking number field |
| **Supported formats** | Code 128, Code 39, EAN-13, UPC-A, QR Code, Data Matrix |
| **API** | Barcode Detection API (Chrome, Edge) with ZXing.js fallback for Safari/Firefox |
| **Behavior** | Camera viewfinder opens in a modal. Detected barcode value auto-fills the tracking number field. Haptic feedback on successful scan. |
| **Multiple scans** | "Scan another" button for batch package intake. Each scan adds a new package row. |
| **Fallback** | If camera is unavailable, the barcode icon is hidden. Manual entry only. |

**Error message** (camera denied): _"Camera access is needed to scan barcodes. To enable, go to your browser settings and allow camera access for this site."_

**Error message** (scan failed): _"Could not read barcode. Try adjusting the angle or distance, or enter the tracking number manually."_

**Empty state** (camera viewfinder before scan): Crosshair overlay on camera feed with text: _"Point your camera at the barcode on the package."_

#### App-Like Transitions

| Transition | When | Animation |
|------------|------|-----------|
| **Page navigation** | Navigating between modules | Slide from right (forward) / slide from left (back). Duration: 250ms. Easing: ease-out. |
| **Modal open** | Opening detail views, forms | Slide up from bottom. Duration: 300ms. Overlay fades in at 200ms. |
| **Modal close** | Closing modals | Slide down. Supports swipe-down gesture to dismiss. |
| **Tab switch** | Switching tabs within a module | Cross-fade. Duration: 150ms. |
| **List item action** | Swipe actions on cards | Physics-based spring animation. Velocity-aware. |
| **Pull-to-refresh** | Refreshing list data | Overscroll with spinner. Bounce-back on release. |

#### Haptic Feedback

| Action | Vibration Pattern | API |
|--------|------------------|-----|
| Pull-to-refresh threshold reached | Single short pulse (10ms) | `navigator.vibrate(10)` |
| Barcode scan success | Double short pulse (10ms, 50ms gap, 10ms) | `navigator.vibrate([10, 50, 10])` |
| Swipe action confirmed | Single medium pulse (20ms) | `navigator.vibrate(20)` |
| Error / validation failure | Triple short pulse (10ms, 30ms gap, repeated 3x) | `navigator.vibrate([10, 30, 10, 30, 10])` |
| Long press recognized | Single short pulse (10ms) | `navigator.vibrate(10)` |

**Fallback**: If `navigator.vibrate` is unavailable (iOS Safari), haptic feedback is silently skipped. No error shown.

---

## 4. Data Model

### 4.1 DeviceRegistration

Tracks devices registered for push notifications and biometric authentication.

```
DeviceRegistration
├── id (UUID, auto-generated)
├── user_id → User (required)
├── property_id → Property (required)
├── device_token (varchar 512) — FCM registration token
├── device_type (enum: android, ios, web_chrome, web_safari, web_firefox, web_edge)
├── device_name (varchar 100) — e.g., "iPhone 15 Pro", "Chrome on Windows"
├── os_version (varchar 50) — e.g., "iOS 17.4", "Android 14"
├── app_version (varchar 20) — PWA version string
├── push_enabled (boolean, default true)
├── webauthn_credential_id (varchar 1024, nullable)
├── webauthn_public_key (text, nullable)
├── last_active_at (timestamp with timezone)
├── created_at (timestamp with timezone)
├── updated_at (timestamp with timezone)
└── active (boolean, default true)
```

### 4.2 OfflineQueue

Stores operations created while the device is offline.

```
OfflineQueue (client-side IndexedDB, synced to server)
├── queue_id (UUID, auto-generated)
├── user_id → User
├── property_id → Property
├── operation_type (enum: create_event, update_event, create_note, update_status, create_request)
├── entity_type (varchar 50)
├── payload (JSON, max 50 KB)
├── created_at (ISO 8601 with timezone — device clock)
├── sync_status (enum: pending, syncing, synced, conflict, failed)
├── retry_count (integer, default 0, max 5)
├── last_retry_at (timestamp, nullable)
├── conflict_data (JSON, nullable — server version when conflict detected)
├── conflict_resolution (enum: keep_local, keep_server, merge, nullable)
├── synced_at (timestamp, nullable — when successfully synced)
└── server_id (UUID, nullable — server-assigned ID after sync)
```

### 4.3 NotificationPreference (Mobile Extension)

Extends the user's notification preferences with mobile-specific settings.

```
NotificationPreference (mobile fields)
├── user_id → User
├── push_enabled (boolean, default true)
├── push_sound (boolean, default true)
├── push_vibration (boolean, default true)
├── push_badge_count (boolean, default true)
├── quiet_hours_enabled (boolean, default false)
├── quiet_hours_start (time, default "22:00")
├── quiet_hours_end (time, default "07:00")
├── quiet_hours_exceptions (enum array: emergency) — categories that bypass quiet hours
├── emergency_override (boolean, default true) — emergencies always come through
└── per_category_push (JSONB) — per-category on/off: {"package": true, "visitor": true, ...}
```

---

## 5. User Flows

### 5.1 Security Guard: Offline Incident Report

| Step | Screen | Action | Device State |
|------|--------|--------|-------------|
| 1 | Dashboard | Guard notices offline indicator banner at top of screen. | Offline |
| 2 | Dashboard | Taps "+ Incident" quick action button (available offline). | Offline |
| 3 | Incident form | Fills description using voice-to-text (Web Speech API works offline in some browsers). Takes photo with camera. Selects incident type from cached dropdown. | Offline |
| 4 | Incident form | Taps "Save." Success toast: "Incident saved offline. It will sync when you reconnect." Badge appears on sync indicator: "1 pending." | Offline |
| 5 | -- | Guard continues patrol. Network reconnects. | Reconnecting |
| 6 | Any screen | Sync indicator animates. Toast: "1 item synced successfully." Badge clears. | Online |
| 7 | Security console | The incident appears in the event list with the original creation timestamp (device time, not sync time). | Online |

### 5.2 Resident: Install PWA and Enable Notifications

| Step | Screen | Action |
|------|--------|--------|
| 1 | Login page (3rd visit) | Bottom sheet appears: "Add Concierge to your home screen for quick access." |
| 2 | Install prompt | Resident taps [Install]. Browser's native install dialog appears. |
| 3 | Home screen | Concierge icon appears on home screen. App launches in standalone mode. |
| 4 | Dashboard (after first action) | Bottom sheet: "Enable notifications to get alerts for packages, visitors, and emergencies." |
| 5 | Notification prompt | Resident taps [Enable]. Browser permission dialog appears. |
| 6 | Permission granted | "Notifications enabled. You can customize which notifications you receive in Account Settings." |
| 7 | Account Settings > Notifications | Resident configures per-category preferences: Packages (on), Visitors (on), Maintenance updates (on), Announcements (off). |

### 5.3 Concierge: Package Intake with Barcode Scan (Mobile)

| Step | Screen | Action |
|------|--------|--------|
| 1 | Bottom nav | Taps "Packages" icon. |
| 2 | Package list | Taps floating action button "+ Package." |
| 3 | Package form | Taps barcode icon next to tracking number field. |
| 4 | Camera viewfinder | Points camera at package barcode. Crosshair overlay guides alignment. |
| 5 | Scan success | Barcode detected. Tracking number auto-fills. Haptic pulse confirms. Camera closes. |
| 6 | Package form | AI auto-detects courier from tracking number format (e.g., "1Z..." = UPS). Courier field auto-fills. Unit field shows smart suggestions. |
| 7 | Package form | Taps camera icon in photo field. Takes photo of package. |
| 8 | Package form | Selects unit from dropdown, taps "Save." Label prints if configured. |

### 5.4 Maintenance Staff: GPS-Verified Inspection (Tablet)

| Step | Screen | Action |
|------|--------|--------|
| 1 | Dashboard | Maintenance staff sees "3 inspections due today" card. |
| 2 | Inspection list | Taps the first inspection. Split-view: checklist on left, details on right. |
| 3 | Inspection form | Walks to the inspection location. GPS auto-captures coordinates. Green badge: "Location verified." |
| 4 | Inspection form | Works through the checklist (tapping checkboxes with 44px targets). Takes photos for flagged items. |
| 5 | Inspection form | Adds voice note for item needing attention: "Water stain on ceiling above unit 3B. Possible roof leak." Voice transcribes to text. |
| 6 | Inspection form | Taps "Complete Inspection." Confirmation dialog. Submits. |

---

## 6. UI/UX

### 6.1 Layout Rules by Breakpoint

#### Mobile (< 768px)

```
+---------------------------+
|  Status bar (system)      |
+---------------------------+
|  Top bar: Logo + Search   |
|  + Notifications bell     |
+---------------------------+
|                           |
|  Main Content Area        |
|  (single column,          |
|   full-width cards,       |
|   stacked layout)         |
|                           |
|                           |
+---------------------------+
|  Bottom Navigation        |
|  [ Home | Pkg | Vis | Log | ··· ]
+---------------------------+
```

#### Tablet (768px - 1279px)

```
+------------------------------------------+
|  Top bar: Logo + Search + Notifications  |
+------+-----------------------------------+
| Side |                                   |
| nav  |  Main Content Area               |
| (col-|  (list + detail split-view       |
| laps-|   or two-column cards)            |
| ible)|                                   |
|      |                                   |
+------+-----------------------------------+
```

#### Desktop (1280px+)

```
+--------------------------------------------------+
|  Top bar: Logo + Global Search + Notifications   |
+--------+-----------------------------------------+
|        |                                         |
| Side   |  Main Content Area                      |
| nav    |  (multi-column, tables with             |
| (per-  |   full columns, modals,                 |
| sistent|   slide-over panels)                    |
| 240px) |                                         |
|        |                                         |
+--------+-----------------------------------------+
```

### 6.2 Component Adaptations

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| **Data tables** | Card list (one card per row) | Compact table (key columns) | Full table (all columns) |
| **Forms** | Full-width, stacked fields. One field per row. | Two-column for short fields. Full-width for text areas. | Two or three column grid. Inline labels for short fields. |
| **Modals** | Full-screen bottom sheet | Centered modal (600px max width) | Centered modal or slide-over panel from right |
| **Calendar** | Month view with dot indicators. Day view for details. | Week view with time slots. | Month + week + day views. Side panel for event details. |
| **Search** | Full-screen overlay with search field. | Expanded search in top bar. Dropdown results. | Persistent search in top bar. Inline dropdown results. |
| **Charts/graphs** | Simplified charts. Single metric per card. Swipe between metrics. | Standard charts. Two per row. | Full dashboard layout. Four+ charts visible. |
| **Navigation** | Bottom bar (4-5 items) + "More" overflow | Collapsible sidebar (icons-only when collapsed) | Persistent sidebar (icon + label, 240px) |
| **Filters** | Bottom sheet with filter chips | Horizontal filter bar above content | Sidebar filter panel or horizontal filter bar |
| **Action buttons** | Floating Action Button (FAB) for primary. Bottom sheet for secondary. | FAB or inline button row. | Inline button row in toolbar. |

### 6.3 Progressive Disclosure on Mobile

Mobile screens use aggressive progressive disclosure to keep forms lean:

| Strategy | Example |
|----------|---------|
| **Collapsed sections** | Package form shows: Unit, Tracking Number, Courier. "More details" expands: Storage spot, Perishable flag, Notes. |
| **Step-by-step forms** | Maintenance request splits into 3 steps: (1) What is the issue? (2) Photos & details (3) Scheduling & permissions. Progress bar at top. |
| **Contextual actions** | Swipe-reveal actions instead of visible button rows. Long-press for context menus. |
| **Smart defaults** | AI pre-fills fields to reduce the number of visible form fields. Courier auto-detected from tracking number. Unit suggested from recent activity. |

### 6.4 Empty States

| Screen | Empty State Message | Action |
|--------|--------------------|---------|
| **Offline queue** | _"All synced. Nothing is waiting to upload."_ | No action needed. |
| **Push notification list** | _"No notifications yet. You will see alerts for packages, visitors, and important updates here."_ | [Manage notification preferences] button. |
| **Registered devices** (Account Settings) | _"No devices registered. Install Concierge on your phone or tablet to enable biometric login and push notifications."_ | Link to install instructions. |
| **Barcode scanner** (before scan) | _"Point your camera at the barcode on the package."_ | Crosshair overlay animation. |
| **Voice input** (before speaking) | _"Tap the microphone and start speaking. Your words will appear here as text."_ | Pulsing microphone icon. |

---

## 7. AI Integration

AI capabilities that are specific to or enhanced by mobile contexts.

| ID | Feature | Description | Trigger | Model | Fallback |
|----|---------|-------------|---------|-------|----------|
| M-01 | **Voice transcription cleanup** | Cleans up voice-to-text output: fixes grammar, removes filler words, adds punctuation | After voice input completes | Claude Haiku | Raw transcription displayed as-is |
| M-02 | **Smart form completion** | Pre-fills form fields based on recent activity patterns, time of day, and role context | On form open (mobile) | Claude Haiku | Empty form with manual entry |
| M-03 | **Photo auto-tagging** | Analyzes photos taken via camera to suggest event type, severity, or category | After photo capture | OpenAI GPT-4o (vision) | Manual category selection |
| M-04 | **Barcode courier detection** | Identifies courier from tracking number format without API lookup | After barcode scan | Rule-based (no AI cost) | Manual courier selection |
| M-05 | **Offline conflict resolution suggestion** | When sync conflicts occur, AI suggests the best resolution based on data comparison | On conflict detection | Claude Haiku | Manual "keep mine / keep server" choice |
| M-06 | **Notification priority ranking** | Ranks queued notifications by relevance to the user's current context and role | Before notification delivery | Claude Haiku | Chronological order |
| M-07 | **GPS anomaly detection** | Flags inspections where GPS coordinates do not match the expected building location | On inspection submission | Rule-based (geofence check, no AI cost) | Manual location verification |

---

## 8. Analytics

### 8.1 Operational Metrics

| Metric | Description | Tracked By |
|--------|-------------|------------|
| **Device distribution** | Percentage of sessions by device type (mobile/tablet/desktop) per role | Auto |
| **PWA install rate** | Percentage of eligible users who install the PWA | Auto |
| **Offline operations count** | Number of operations created while offline, by type and role | Auto |
| **Sync success rate** | Percentage of offline operations that sync successfully on first attempt | Auto |
| **Push opt-in rate** | Percentage of users who enable push notifications, by role | Auto |
| **Push delivery rate** | Percentage of push notifications successfully delivered | FCM dashboard |
| **Push open rate** | Percentage of push notifications tapped/opened | Auto |
| **Biometric adoption** | Percentage of users who enable biometric login, by role | Auto |
| **Voice input usage** | Number of voice-to-text sessions per day, by role | Auto |
| **Barcode scan usage** | Number of successful barcode scans vs manual entries | Auto |
| **Camera usage** | Number of photos taken via camera vs uploaded from gallery | Auto |

### 8.2 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.5s on 4G | Lighthouse, Web Vitals |
| **Largest Contentful Paint (LCP)** | < 2.5s on 4G | Lighthouse, Web Vitals |
| **First Input Delay (FID)** | < 100ms | Web Vitals |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Web Vitals |
| **Time to Interactive (TTI)** | < 3s on 4G | Lighthouse |
| **Total Bundle Size** | < 500 KB (initial load, gzipped) | Build pipeline |
| **Service Worker Cache Hit Rate** | > 80% for repeat visits | Custom analytics |
| **Offline Queue Sync Latency** | < 5s from reconnect to full sync | Custom analytics |

### 8.3 AI-Specific Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Voice cleanup acceptance rate** | Percentage of AI-cleaned transcriptions kept by users | > 80% |
| **Smart form field acceptance** | Percentage of AI-suggested field values kept | > 70% |
| **Photo tag accuracy** | Percentage of auto-tags confirmed by users | > 75% |
| **Conflict resolution suggestion accuracy** | Percentage of AI-suggested resolutions accepted | > 65% |

---

## 9. Notifications

### 9.1 Push Notification Triggers

| Event | Recipient | Channel | Priority | Quiet Hours |
|-------|-----------|---------|----------|-------------|
| New package received | Unit resident(s) | Push + Email | Normal | Respected |
| Package unclaimed > 24h | Unit resident(s) | Push | Normal | Respected |
| Visitor waiting | Unit resident(s) | Push | Normal | Respected |
| Emergency broadcast | All residents + staff | Push + SMS | Critical | **Bypassed** |
| Maintenance request updated | Requesting resident | Push | Low | Respected |
| Amenity booking confirmed | Booking resident | Push | Low | Respected |
| Shift starts in 30 min | Assigned staff | Push | Normal | **Bypassed** |
| New announcement | Targeted audience | Push | Normal | Respected |
| Offline sync completed | Device user | Local notification | Low | Respected |
| Offline sync conflict | Device user | Local notification + Push | Normal | Respected |

### 9.2 Quiet Hours

| Field | Type | Max Length | Required | Default | Validation | Error Message |
|-------|------|-----------|----------|---------|------------|---------------|
| `quiet_hours_enabled` | boolean | N/A | No | `false` | N/A | N/A |
| `quiet_hours_start` | time (HH:MM) | 5 chars | Conditionally (if enabled) | `22:00` | Valid 24-hour time format | "Enter a valid time (e.g., 22:00)." |
| `quiet_hours_end` | time (HH:MM) | 5 chars | Conditionally (if enabled) | `07:00` | Valid 24-hour time format. Must differ from start. | "Enter a valid time (e.g., 07:00). End time must differ from start time." |
| `quiet_hours_exceptions` | enum array | N/A | No | `["emergency"]` | Valid category names | N/A |

**Tooltip** (on quiet hours toggle): _"During quiet hours, non-emergency notifications are silently delivered. They will appear in your notification list but will not make sound or vibration. Emergency alerts always come through."_

### 9.3 Notification Grouping

| Rule | Detail |
|------|--------|
| **By category** | Notifications of the same category are grouped (e.g., "3 new packages"). |
| **Threshold** | Grouping activates when 3+ notifications of the same category arrive within 5 minutes. |
| **Expansion** | Tapping a grouped notification expands to show individual items. |
| **Emergency exception** | Emergency notifications are never grouped. Each one appears individually. |

---

## 10. API

### 10.1 Device Registration

#### Register Device

```
POST /api/v1/devices
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `device_token` | string | Yes | Non-empty, max 512 chars |
| `device_type` | enum | Yes | One of: `android`, `ios`, `web_chrome`, `web_safari`, `web_firefox`, `web_edge` |
| `device_name` | string | No | Max 100 chars |
| `os_version` | string | No | Max 50 chars |
| `push_enabled` | boolean | No | Defaults to `true` |

**Response**: `201 Created` with device ID.

**Error**: `409 Conflict` if device token already registered for this user. `422 Unprocessable` if validation fails.

#### Update Device

```
PATCH /api/v1/devices/{device_id}
```

Accepts any subset of registration fields. Returns `200 OK`.

#### Deregister Device

```
DELETE /api/v1/devices/{device_id}
```

Returns `204 No Content`. Revokes push token and biometric credential.

#### List User Devices

```
GET /api/v1/users/{user_id}/devices
```

Returns array of registered devices. Filtered by `property_id` if provided.

### 10.2 Push Notifications

#### Send Notification

```
POST /api/v1/notifications/push
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `recipient_user_ids` | UUID array | Yes (or `recipient_roles`) | Max 1000 per request |
| `recipient_roles` | enum array | No | Valid role names. Sends to all users with those roles at the property. |
| `title` | string | Yes | Max 65 chars |
| `body` | string | Yes | Max 240 chars |
| `category` | enum | Yes | One of: `emergency`, `package`, `visitor`, `maintenance`, `announcement`, `shift`, `booking` |
| `data` | object | No | `{url, event_id, module}` |
| `silent` | boolean | No | Default `false` |

**Response**: `202 Accepted` with notification batch ID. Delivery is asynchronous.

**Rate limit**: 100 push requests per minute per property. Emergency category is exempt.

### 10.3 Offline Sync

#### Submit Offline Queue

```
POST /api/v1/sync
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `operations` | array | Yes | Max 50 operations per request |
| `operations[].queue_id` | UUID | Yes | Client-generated UUID |
| `operations[].operation_type` | enum | Yes | Valid operation type |
| `operations[].entity_type` | string | Yes | Valid entity name |
| `operations[].payload` | object | Yes | Must pass entity validation |
| `operations[].created_at` | ISO 8601 | Yes | Must include timezone offset |

**Response**: `200 OK` with per-operation results:

```json
{
  "results": [
    {"queue_id": "...", "status": "synced", "server_id": "..."},
    {"queue_id": "...", "status": "conflict", "server_version": {...}, "conflict_fields": ["status", "description"]}
  ]
}
```

**Error**: `413 Payload Too Large` if total payload exceeds 5 MB.

### 10.4 WebAuthn

#### Begin Registration

```
POST /api/v1/auth/webauthn/register/begin
```

Returns WebAuthn `PublicKeyCredentialCreationOptions`.

#### Complete Registration

```
POST /api/v1/auth/webauthn/register/complete
```

Accepts the credential response from the browser. Returns `201 Created` with credential metadata.

#### Begin Authentication

```
POST /api/v1/auth/webauthn/authenticate/begin
```

Returns WebAuthn `PublicKeyCredentialRequestOptions`.

#### Complete Authentication

```
POST /api/v1/auth/webauthn/authenticate/complete
```

Accepts the assertion response. Returns `200 OK` with session token (same format as password login).

---

## 11. Completeness Checklist

| # | Requirement | Section | Status |
|---|-------------|---------|--------|
| 1 | Responsive breakpoints defined (mobile, tablet, desktop) | 3.1 | Done |
| 2 | PWA manifest and install prompt specified | 3.2 | Done |
| 3 | Service worker caching strategy defined | 3.3 | Done |
| 4 | Offline operation queue with sync and conflict resolution | 3.3 | Done |
| 5 | Offline-capable operations defined per role | 3.3 | Done |
| 6 | Push notification payload and categories defined | 3.4 | Done |
| 7 | Notification permission flow specified | 3.4 | Done |
| 8 | Camera access for photos and document capture | 3.5 | Done |
| 9 | GPS integration for inspections with field-level spec | 3.5 | Done |
| 10 | Voice-to-text with privacy disclosure | 3.5 | Done |
| 11 | Barcode scanning for package intake | 3.9 | Done |
| 12 | Touch gestures defined (swipe, pull-to-refresh, long press) | 3.6 | Done |
| 13 | Bottom navigation defined per role | 3.7 | Done |
| 14 | Biometric authentication (WebAuthn) with setup flow | 3.8 | Done |
| 15 | App-like transitions and haptic feedback | 3.9 | Done |
| 16 | Data model for DeviceRegistration, OfflineQueue, NotificationPreference | 4 | Done |
| 17 | User flows for offline incident, PWA install, barcode scan, GPS inspection | 5 | Done |
| 18 | Layout wireframes for all three breakpoints | 6.1 | Done |
| 19 | Component adaptation rules per breakpoint | 6.2 | Done |
| 20 | Progressive disclosure strategy for mobile forms | 6.3 | Done |
| 21 | Empty states with guidance for all mobile-specific screens | 6.4 | Done |
| 22 | AI integration for voice cleanup, smart forms, photo tagging | 7 | Done |
| 23 | Operational, performance, and AI analytics defined | 8 | Done |
| 24 | Push notification triggers with quiet hours | 9 | Done |
| 25 | Notification grouping rules | 9.3 | Done |
| 26 | API endpoints for device registration, push, sync, WebAuthn | 10 | Done |
| 27 | Error messages for all failure states | Throughout | Done |
| 28 | Tooltips for complex features | Throughout | Done |
| 29 | Fallbacks for unavailable device capabilities | Throughout | Done |
| 30 | Native app consideration documented for v3+ | 1 (Key Facts) | Done |

---

*End of document.*
