# Concierge — Screen States Reference

> **Purpose**: Define every possible state for every primary screen in the Concierge platform.
> Every screen has 6 states: Empty, Loading, Error, Success, Partial, and Offline.
> This document ensures no state is left undesigned — users never see a blank page or cryptic error.

> **Audience**: Designers, front-end engineers, QA testers, accessibility auditors.

> **Design System Reference**: All tokens (`--accent`, `--text-primary`, `--bg-secondary`, etc.)
> reference `/docs/DESIGN-SYSTEM.md`. All layouts follow the 12-column grid with 24px gutters.

---

## Table of Contents

1. [Global State Patterns](#1-global-state-patterns)
2. [Authentication](#2-authentication)
3. [Layout Shell](#3-layout-shell)
4. [Dashboards](#4-dashboards)
5. [Event Log](#5-event-log)
6. [Package Management](#6-package-management)
7. [Security Console](#7-security-console)
8. [Maintenance](#8-maintenance)
9. [Amenity Booking](#9-amenity-booking)
10. [Communication](#10-communication)
11. [Unit Management](#11-unit-management)
12. [User Management](#12-user-management)
13. [Settings](#13-settings)
14. [Search](#14-search)
15. [Notification Center](#15-notification-center)
16. [Shift Log](#16-shift-log)
17. [Marketing Pages](#17-marketing-pages)
18. [Login & Property Routing](#18-login--property-routing)
19. [Onboarding Wizard](#19-onboarding-wizard)
20. [Demo & Training Mode](#20-demo--training-mode)
21. [Billing Dashboard](#21-billing-dashboard)
22. [Help Center](#22-help-center)

---

## 1. Global State Patterns

These patterns are reused across every screen. Screen-specific sections below reference these
patterns by name and only document deviations.

---

### 1.1 Empty State Pattern

Every empty state follows this structure:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ┌──────────────┐                      │
│              │  Line-art    │                      │
│              │  illustration│                      │
│              │  120x120px   │                      │
│              └──────────────┘                      │
│                                                    │
│            Headline (Title 2, 22px, 600)           │
│                                                    │
│       Description text explaining what this        │
│       screen does and why it matters.              │
│       (Body, 15px, 400, --text-secondary)          │
│                                                    │
│            [ Primary CTA Button ]                  │
│            (--accent, 44px height)                 │
│                                                    │
│        Optional: "Learn more" text link            │
│        (Callout, 14px, --accent)                   │
│                                                    │
└──────────────────────────────────────────────────┘
```

**Illustration Style**:

- Line-art only. Stroke weight: 1.5px.
- Primary color: `--text-tertiary` (#AEAEB2) for outlines.
- Accent color: `--accent` (#0071E3) for one focal detail per illustration (e.g., a package ribbon, a calendar dot, a shield check mark).
- No filled shapes, no gradients, no photographic elements.
- Each illustration is unique to its module — never reuse the same illustration for different empty states.
- Maximum 3 objects per illustration. Simplicity is mandatory.

**Copy Rules**:

- Headline: 3-6 words. Describes what will appear here, not what is missing. Use positive framing.
  - GOOD: "Your package log starts here"
  - BAD: "No packages found"
- Description: 1-2 sentences. Explains the value of this feature and what the user should do first.
- CTA: Verb + noun. "Log a Package", "Create Announcement", "Add a Unit".
- Never use: "Oops", "Uh oh", "Nothing here", "Empty", exclamation marks.

**Animation**:

- Illustration fades in: opacity 0 to 1, 400ms, ease-out.
- Text fades in: 200ms delay after illustration, opacity 0 to 1, 300ms, ease-out.
- Button fades in: 100ms delay after text, opacity 0 to 1, 300ms, ease-out.

**Accessibility**:

- Illustration has `role="img"` with `aria-label` describing the scene (e.g., "Line drawing of a mailbox").
- Headline is an `<h2>` element.
- CTA button has `aria-label` matching visible text.
- Screen reader announcement on page load: "[Page name] — no items yet. [CTA label] to get started."

---

### 1.2 Loading State Pattern (Skeleton Screens)

**Rule**: Never show a spinner alone. Every loading state renders a skeleton that matches the exact
layout of the loaded state. Users should recognize what screen they are on before data arrives.

**Shimmer Animation**:

- Direction: left-to-right.
- Duration: 1.5 seconds per cycle.
- Easing: ease-in-out.
- Gradient: `linear-gradient(90deg, --bg-secondary 0%, --bg-tertiary 50%, --bg-secondary 100%)`.
- Background-size: 200% 100%.
- Loops infinitely until data loads.

**Skeleton Shape Definitions**:

| Layout Element | Skeleton Shape             | Dimensions                                                     |
| -------------- | -------------------------- | -------------------------------------------------------------- |
| KPI card       | Rounded rect               | Full card width, 96px height, 12px border-radius               |
| Table row      | 4-5 horizontal bars        | 60% / 20% / 10% / 10% width, 14px height, 4px radius           |
| Card in grid   | Rounded rect               | Full card width, 180px height, 12px border-radius              |
| Avatar         | Circle                     | 40px diameter                                                  |
| Page title     | Horizontal bar             | 200px width, 28px height, 6px radius                           |
| Body text line | Horizontal bar             | 80% width (first), 60% width (second), 14px height, 4px radius |
| Button         | Rounded rect               | 120px width, 44px height, 10px radius                          |
| Chart area     | Rounded rect               | Full width, 240px height, 12px radius                          |
| Sidebar item   | Horizontal bar with circle | 20px circle + 120px bar, 16px height                           |
| Tab bar        | Row of bars                | 4 bars, 80px each, 14px height, spaced 24px apart              |
| Filter bar     | Row of rounded rects       | 3 rects, 100px each, 36px height, 8px radius                   |

**Skeleton Layout — Data Table Page**:

```
┌──────────────────────────────────────────────────┐
│  ████████████ (page title)     ░░░░░░ (button)   │
│                                                    │
│  ░░░░░░░░░  ░░░░░░░░░  ░░░░░░░░░  (filter bar)  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│              ░░░  ░  ░  ░  ░░░ (pagination)       │
└──────────────────────────────────────────────────┘
```

**Skeleton Layout — Dashboard**:

```
┌──────────────────────────────────────────────────┐
│  ████████████ (greeting)                           │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │        │
│  │ ████     │  │ ████     │  │ ████     │        │
│  │ ░░░░░    │  │ ░░░░░    │  │ ░░░░░    │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐│
│  │                     │  │                     ││
│  │   ░░░░░░░░░░░░░░   │  │   ░░░░░░░░░░░░░░   ││
│  │   (chart area)      │  │   (widget area)     ││
│  │                     │  │                     ││
│  └─────────────────────┘  └─────────────────────┘│
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  │ ████████████   ░░░░░░   ░░░░   ░░░░  ░░░░  │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Skeleton Layout — Detail/Form Page**:

```
┌──────────────────────────────────────────────────┐
│  ← ████████████ (back + title)                    │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  ○ ████████████        ░░░░░ (status badge)  │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │                                              │ │
│  │  ░░░░░░░░░░░░░░░░░░                         │ │
│  │  ░░░░░░░░░░░░                               │ │
│  │                                              │ │
│  │  ░░░░░  ░░░░░  ░░░░░  ░░░░░  (tab bar)     │ │
│  │  ─────────────────────────────               │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Accessibility**:

- Container has `aria-busy="true"` and `aria-label="Loading [page name]"`.
- Screen reader announcement: "Loading [page name], please wait."
- Skeleton elements are hidden from screen readers with `aria-hidden="true"`.
- When loading completes: `aria-busy` removed, screen reader announces "[Page name] loaded. [count] items."

---

### 1.3 Error State Pattern

**Structure**:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ┌──────────────┐                      │
│              │  Line-art    │                      │
│              │  error icon  │                      │
│              │  (cloud +    │                      │
│              │   warning)   │                      │
│              └──────────────┘                      │
│                                                    │
│       Something went wrong loading [feature]       │
│       (Title 2, 22px, 600, --text-primary)         │
│                                                    │
│       We could not reach our servers. This is       │
│       usually temporary — try again in a moment.   │
│       (Body, 15px, 400, --text-secondary)          │
│                                                    │
│            [ Try Again ]    Contact Support         │
│            (--accent)       (text link, --accent)   │
│                                                    │
│       ▸ Show technical details                     │
│       (Callout, 14px, --text-tertiary)             │
│                                                    │
└──────────────────────────────────────────────────┘
```

**Expanded Technical Details**:

```
│       ▾ Hide technical details                     │
│       ┌──────────────────────────────────────┐    │
│       │ Error code: 504                       │    │
│       │ Timestamp: 2026-03-16 14:32:01 UTC    │    │
│       │ Request ID: req_8f3a2b1c              │    │
│       │ Endpoint: /api/v1/events              │    │
│       │                                       │    │
│       │ [ Copy Details ]                      │    │
│       └──────────────────────────────────────┘    │
```

**Error Copy by Type**:

| Error Type            | Headline                              | Description                                                                                            |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Network / timeout     | "Could not connect to the server"     | "This is usually a temporary connection issue. Check your internet and try again."                     |
| Server error (5xx)    | "Something went wrong on our end"     | "Our team has been notified. This is usually resolved quickly — try again in a few minutes."           |
| Not found (404)       | "This page does not exist"            | "The item may have been removed, or the link may be incorrect. Go back to [parent page]."              |
| Forbidden (403)       | "You do not have access to this page" | "Your current role does not include permission for this feature. Contact your property administrator." |
| Validation error      | "Some fields need attention"          | Inline field-level errors. No full-page error state — form stays visible with errors highlighted.      |
| Rate limit (429)      | "Too many requests"                   | "Please wait a moment before trying again. This limit protects the system for all users."              |
| Session expired (401) | "Your session has expired"            | "For security, sessions expire after 30 minutes of inactivity. Sign in to continue."                   |

**Animation**:

- Error illustration fades in with a subtle 10px upward translate: 400ms, ease-out.
- Illustration has a single-pulse scale animation on the accent element (1.0 to 1.05 to 1.0, 600ms).

**Accessibility**:

- Error container has `role="alert"` and `aria-live="assertive"`.
- Screen reader announcement: "Error loading [page name]. [Headline]. [Description]. Try again button available."
- Technical details section uses `aria-expanded="false/true"` with `aria-controls`.
- "Try Again" button has `aria-label="Retry loading [page name]"`.

---

### 1.4 Success State Pattern

**Types**:

**A. Toast Notification (Minor Actions)**

```
┌─────────────────────────────────────────┐
│  ✓  Package logged successfully    ✕    │
│     Reference: PKG-20260316-0042        │
└─────────────────────────────────────────┘
```

- Position: top-right, 24px from edges, stacks downward.
- Background: `--bg-primary` with `--border-subtle` border and `box-shadow: 0 4px 12px rgba(0,0,0,0.10)`.
- Left accent bar: 3px, `--status-success`.
- Check icon: `--status-success`, 20px.
- Auto-dismiss: 3 seconds.
- Hover pauses auto-dismiss timer.
- Manual dismiss: click X button.
- Maximum 3 toasts visible simultaneously. Fourth pushes first off-screen.
- Animation in: slide from right 16px + fade, 300ms, ease-out.
- Animation out: fade + slide right 8px, 200ms, ease-in.

**B. Inline Confirmation (Major Actions)**

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ┌──────────────┐                      │
│              │  Animated    │                      │
│              │  checkmark   │                      │
│              │  (draws in)  │                      │
│              └──────────────┘                      │
│                                                    │
│           Announcement published                   │
│           (Title 2, 22px, 600)                     │
│                                                    │
│     Sent to 342 residents via email and push.      │
│     (Body, 15px, 400, --text-secondary)            │
│                                                    │
│    [ View Announcement ]   [ Back to List ]        │
│    (primary)               (secondary/text link)   │
│                                                    │
└──────────────────────────────────────────────────┘
```

- Persistent — does not auto-dismiss. User navigates away.
- Animated checkmark: SVG path draws in, 600ms, ease-out. Circle draws first (400ms), then check stroke (200ms).
- Circle color: `--status-success`.
- Content fades in 200ms after checkmark completes.

**C. Inline Success Banner (Contextual)**

```
┌──────────────────────────────────────────────────┐
│ ✓  Changes saved                            ✕    │
└──────────────────────────────────────────────────┘
```

- Appears at top of form/section that was modified.
- Background: `--status-success-bg`.
- Auto-dismiss: 3 seconds.
- Used for: settings saved, profile updated, preferences changed.

**Accessibility**:

- Toast has `role="status"` and `aria-live="polite"`.
- Screen reader announcement: "[Action] successful. [Summary detail if applicable]."
- Inline confirmation heading is focused automatically for screen reader users.
- Dismiss button has `aria-label="Dismiss notification"`.

---

### 1.5 Partial Load State Pattern

When some data loads but other widgets or sections fail:

```
┌──────────────────────────────────────────────────┐
│  Dashboard                                         │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 42       │  │ 7        │  │ ⚠ Could  │        │
│  │ Packages │  │ Visitors │  │ not load │        │
│  │ Today    │  │ Active   │  │ [Retry]  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐│
│  │                     │  │  ⚠ Chart data       ││
│  │  Event Feed         │  │  unavailable         ││
│  │  (loaded normally)  │  │                      ││
│  │                     │  │  [ Retry ]           ││
│  └─────────────────────┘  └─────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Rules**:

- Successfully loaded sections render normally.
- Failed sections show inline error within their container — same dimensions as the loaded state.
- Each failed section gets its own "Retry" button that only reloads that section.
- No full-page error overlay — show what works.
- Warning icon: `--status-warning`, 20px.
- Error text: Callout size (14px), `--text-secondary`.
- Retry button: text-style button, `--accent`, Callout size.
- Failed container background: `--bg-secondary`.
- Border: 1px dashed `--border-subtle`.

**Animation**:

- Failed section fades in with dashed border pulse (opacity 0.5 to 1.0, 1s, once).
- On retry: section shows skeleton shimmer, then loads or re-displays error.

**Accessibility**:

- Failed section has `role="alert"` with `aria-live="polite"` (not assertive — partial failure is not critical).
- Screen reader: "Dashboard loaded. 2 of 5 sections could not load. [Section name] failed to load. Retry button available."
- Retry button: `aria-label="Retry loading [section name]"`.

---

### 1.6 Offline State Pattern

**Banner**:

```
┌──────────────────────────────────────────────────┐
│  ⚡ You are offline. Showing cached data.  [i]   │
└──────────────────────────────────────────────────┘
```

- Position: fixed top, full-width, above header. 40px height.
- Background: `--status-warning-bg`.
- Text: `--status-warning` (dark orange), Caption size (12px), 500 weight.
- Info icon [i] expands to show: "Changes you make will be saved and sent when you reconnect."
- Does not dismiss automatically. Disappears when connectivity restores.
- Animation in: slide down from top, 300ms, ease-out.
- Animation out: slide up, 200ms, ease-in.

**Cached Data Indicators**:

- Every data element shows with reduced opacity: 0.7.
- Timestamp shown below data: "Last updated 4 minutes ago" in Caption, `--text-tertiary`.
- Stale data (>15 minutes): additional warning: "This data may be outdated."

**Action Queue**:

```
┌──────────────────────────────────────────────────┐
│  Queued Actions (3)                          ▾    │
│  ┌──────────────────────────────────────────────┐│
│  │  ● Log Package — PKG for Unit 1205    Queued ││
│  │  ● Add Visitor — John Smith, Unit 801 Queued ││
│  │  ● Shift Note — "Lobby door sticking" Queued ││
│  └──────────────────────────────────────────────┘│
│  These will send automatically when you reconnect.│
└──────────────────────────────────────────────────┘
```

- Queue indicator: persistent floating pill in bottom-right. "3 queued" with `--status-warning` dot.
- Click expands to show queue list.
- Each item: description + "Queued" badge (`--status-warning-bg`).
- On reconnect: items send sequentially. Badge updates: "Syncing 1/3..." then "All synced" with success animation.

**Disabled Actions While Offline**:

- Actions that require server validation are disabled (greyed out, cursor: not-allowed).
- Disabled actions show tooltip: "This action requires an internet connection."
- Actions that can work offline: creating events, logging packages, adding shift notes.
- Actions that cannot: releasing packages (requires signature), sending announcements, user management.

**Accessibility**:

- Offline banner: `role="alert"`, `aria-live="assertive"`.
- Screen reader: "You are offline. Showing cached data. Changes will be saved when you reconnect."
- Queued actions panel: `aria-label="Queued offline actions"` with count.
- Disabled buttons: `aria-disabled="true"` with `aria-describedby` pointing to tooltip text.

---

## 2. Authentication

---

### 2.1 Login Screen

**Layout**:

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────────┐  ┌────────────────────────────┐│
│  │                          │  │                            ││
│  │                          │  │     ◉ Concierge            ││
│  │                          │  │                            ││
│  │   Decorative panel       │  │   Welcome back             ││
│  │   Soft gradient:         │  │   (Title 1, 28px, 700)     ││
│  │   #F5F5F7 to #E8E8ED    │  │                            ││
│  │   with line-art          │  │   Sign in to your account  ││
│  │   building illustration  │  │   (Body, --text-secondary) ││
│  │                          │  │                            ││
│  │                          │  │   Email                    ││
│  │                          │  │   ┌──────────────────────┐ ││
│  │                          │  │   │                      │ ││
│  │                          │  │   └──────────────────────┘ ││
│  │                          │  │                            ││
│  │                          │  │   Password                 ││
│  │                          │  │   ┌──────────────────────┐ ││
│  │                          │  │   │                  👁  │ ││
│  │                          │  │   └──────────────────────┘ ││
│  │                          │  │                            ││
│  │                          │  │   [ Sign In ]              ││
│  │                          │  │   (full-width, --accent)   ││
│  │                          │  │                            ││
│  │                          │  │   Forgot password?         ││
│  │                          │  │   (text link, --accent)    ││
│  │                          │  │                            ││
│  └──────────────────────────┘  └────────────────────────────┘│
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**States**:

**EMPTY (Initial Load)**:

- Left panel: Line-art illustration of a modern building facade with a welcoming open door. Accent blue on the door handle.
- Right panel: Form with empty fields. Email field auto-focused with blue focus ring (`--border-focus`).
- Placeholders: "name@building.com" / "Enter your password".
- No error messages visible.
- Accessibility: `aria-label="Sign in to Concierge"` on form. Email input has `aria-required="true"`.

**LOADING (Signing In)**:

- "Sign In" button transitions to loading state: text fades to "Signing in..." with a small spinner (16px) replacing the text.
- Button is disabled (`aria-busy="true"`), background dims to `--accent-pressed`.
- Form fields are disabled (no interaction).
- Duration: typically 1-3 seconds. If >5 seconds, show subtle progress text below button: "Still working..."
- Accessibility: `aria-live="polite"` region announces "Signing in, please wait."

**ERROR — Invalid Credentials**:

- Shake animation on the form card: translate-x 0 to -8px to 8px to -4px to 4px to 0, 400ms.
- Error banner appears above email field:
  ```
  ┌──────────────────────────────────┐
  │ ✕  Incorrect email or password   │
  └──────────────────────────────────┘
  ```
- Background: `--status-error-bg`. Text: `--status-error`. Icon: `--status-error`.
- Both input fields get `--status-error` border.
- Password field is cleared. Email field retains value and receives focus.
- Button returns to "Sign In" state.
- After 3 failed attempts: "Too many attempts. Please wait 30 seconds." with countdown timer visible.
- After 5 failed attempts: redirect to Account Locked screen.
- Accessibility: `role="alert"`, `aria-live="assertive"`. Announcement: "Sign in failed. Incorrect email or password. Email field is focused."

**ERROR — Network**:

- Error banner: "Could not connect. Check your internet connection and try again."
- Button returns to "Sign In" state, enabled.
- No field clearing — all entered data preserved.
- Accessibility: same alert pattern.

**SUCCESS**:

- Button text changes to "Signed in" with animated checkmark (draw-in, 400ms).
- Button background transitions to `--status-success`, 200ms.
- Pause 600ms, then redirect to dashboard.
- Redirect uses a full-page crossfade transition: login fades out (300ms) while dashboard fades in (300ms).
- Accessibility: announcement "Signed in successfully. Redirecting to dashboard."

**PARTIAL**: Not applicable — login is all-or-nothing.

**OFFLINE**:

- Form renders but "Sign In" button is disabled.
- Message below button: "You are offline. Sign in requires an internet connection."
- If user was previously signed in and session is cached: auto-redirect to cached dashboard with offline banner.
- Accessibility: "Sign in unavailable. You are currently offline."

---

### 2.2 Two-Factor Authentication (2FA) Screen

**Layout**:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ◉ Concierge                           │
│                                                    │
│           Verify your identity                     │
│           (Title 1, 28px, 700)                     │
│                                                    │
│     Enter the 6-digit code from your               │
│     authenticator app.                             │
│     (Body, --text-secondary)                       │
│                                                    │
│     ┌───┐ ┌───┐ ┌───┐  ┌───┐ ┌───┐ ┌───┐        │
│     │   │ │   │ │   │  │   │ │   │ │   │        │
│     └───┘ └───┘ └───┘  └───┘ └───┘ └───┘        │
│     (6 individual digit inputs, 48px square)       │
│                                                    │
│            [ Verify ]                              │
│                                                    │
│     Use a backup code instead                      │
│     (text link, --accent)                          │
│                                                    │
│     ← Back to sign in                              │
│     (text link, --text-secondary)                  │
│                                                    │
└──────────────────────────────────────────────────┘
```

**EMPTY (Initial)**:

- 6 code input boxes, first box auto-focused with `--border-focus` ring.
- Inputs accept numbers only. Auto-advance to next box on digit entry.
- Paste support: pasting 6 digits fills all boxes simultaneously.
- Accessibility: `aria-label="Verification code digit [1-6]"` on each input. Group has `role="group"` with `aria-label="6-digit verification code"`.

**LOADING (Verifying)**:

- All inputs disabled. "Verify" button shows spinner + "Verifying...".
- Accessibility: "Verifying code, please wait."

**ERROR — Wrong Code**:

- All 6 boxes flash `--status-error` border, shake animation (same as login), then clear.
- First box receives focus.
- Error text: "That code is incorrect. Please try again."
- After 3 attempts: "Too many incorrect codes. Use a backup code or contact your administrator."
- Accessibility: `role="alert"`. "Verification failed. Incorrect code. First digit field is focused."

**ERROR — Expired Code**:

- Error text: "That code has expired. Enter a new code from your authenticator app."
- All boxes clear, first box focused.
- Accessibility: same pattern.

**SUCCESS**:

- All boxes turn `--status-success` border.
- Animated checkmark replaces the code boxes (draws in, 400ms).
- Redirect to dashboard after 600ms.
- Accessibility: "Verification successful. Redirecting to dashboard."

**PARTIAL**: Not applicable.

**OFFLINE**:

- "Verify" button disabled.
- Message: "Verification requires an internet connection."
- Note: TOTP codes are generated offline, but verification requires the server.

---

### 2.3 Forgot Password Screen

**Layout**:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ◉ Concierge                           │
│                                                    │
│           Reset your password                      │
│           (Title 1, 28px, 700)                     │
│                                                    │
│     Enter the email address associated with        │
│     your account. We will send you a link to       │
│     reset your password.                           │
│     (Body, --text-secondary)                       │
│                                                    │
│     Email                                          │
│     ┌──────────────────────────────────────┐      │
│     │ name@building.com                    │      │
│     └──────────────────────────────────────┘      │
│                                                    │
│            [ Send Reset Link ]                     │
│                                                    │
│     ← Back to sign in                              │
│                                                    │
└──────────────────────────────────────────────────┘
```

**EMPTY**: Email field auto-focused. CTA: "Send Reset Link".

**LOADING**: Button shows "Sending..." with spinner.

**ERROR — Invalid Email Format**: Inline field error: "Enter a valid email address." Red border on field.

**ERROR — Network**: Banner: "Could not send reset link. Check your connection and try again."

**SUCCESS**:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ◉ Concierge                           │
│                                                    │
│              ┌──────────────┐                      │
│              │  Line-art    │                      │
│              │  envelope    │                      │
│              │  with check  │                      │
│              └──────────────┘                      │
│                                                    │
│           Check your email                         │
│                                                    │
│     We sent a password reset link to               │
│     j***n@building.com. Check your inbox           │
│     and spam folder.                               │
│                                                    │
│     Did not receive it?  [ Resend ]                │
│     (Resend enabled after 60s countdown)           │
│                                                    │
│     ← Back to sign in                              │
│                                                    │
└──────────────────────────────────────────────────┘
```

- Email is partially masked for security.
- Resend button disabled for 60 seconds with visible countdown: "Resend in 47s".
- Accessibility: "Reset link sent to your email. Check your inbox."

**PARTIAL**: Not applicable.

**OFFLINE**: "Send Reset Link" disabled. "Password reset requires an internet connection."

---

### 2.4 Reset Password Screen

**Layout**:

```
┌──────────────────────────────────────────────────┐
│              ◉ Concierge                           │
│                                                    │
│           Create a new password                    │
│                                                    │
│     New Password                                   │
│     ┌──────────────────────────────────────┐      │
│     │                                  👁  │      │
│     └──────────────────────────────────────┘      │
│                                                    │
│     Password strength: ████░░░░░░ Fair             │
│                                                    │
│     ✓ At least 12 characters                       │
│     ✕ One uppercase letter                         │
│     ✓ One number                                   │
│     ✕ One special character                        │
│                                                    │
│     Confirm Password                               │
│     ┌──────────────────────────────────────┐      │
│     │                                  👁  │      │
│     └──────────────────────────────────────┘      │
│                                                    │
│            [ Reset Password ]                      │
│                                                    │
└──────────────────────────────────────────────────┘
```

**EMPTY**: First password field focused. Requirements list shows all items as neutral (grey circles, not yet evaluated).

**LOADING**: Button shows "Resetting..." with spinner.

**ERROR — Weak Password**: "Reset Password" button stays disabled until all requirements met. Requirements update in real-time as user types. Met requirements: `--status-success` check. Unmet: `--text-tertiary` circle.

**ERROR — Mismatch**: Confirm field shows error: "Passwords do not match." Red border.

**ERROR — Token Expired**: Full-page message: "This reset link has expired. Request a new one." CTA: "Request New Link".

**SUCCESS**: Animated checkmark. "Password updated. Sign in with your new password." CTA: "Sign In" redirects to login.

**PARTIAL**: Not applicable.

**OFFLINE**: Form disabled. "Password reset requires an internet connection."

---

### 2.5 Account Locked Screen

**Layout**:

```
┌──────────────────────────────────────────────────┐
│              ◉ Concierge                           │
│                                                    │
│              ┌──────────────┐                      │
│              │  Line-art    │                      │
│              │  lock icon   │                      │
│              │  (accent     │                      │
│              │   keyhole)   │                      │
│              └──────────────┘                      │
│                                                    │
│           Account temporarily locked               │
│                                                    │
│     Your account has been locked after too many    │
│     sign-in attempts. This protects your account   │
│     from unauthorized access.                      │
│                                                    │
│     You can try again in: 14:32                    │
│     (countdown timer, monospace, Title 2)          │
│                                                    │
│     Or, reset your password to unlock              │
│     immediately:                                   │
│                                                    │
│            [ Reset Password ]                      │
│                                                    │
│     Need help? Contact your property               │
│     administrator.                                 │
│                                                    │
└──────────────────────────────────────────────────┘
```

**States**: This screen is itself an error state. No separate loading/error/success states — only:

- **Active lockout**: Countdown timer visible, decrementing every second.
- **Lockout expired**: Timer replaced with "You can now try again." CTA becomes "Back to Sign In."
- **Accessibility**: `role="alert"`. Timer has `aria-live="off"` (do not announce every second). When timer reaches 0: `aria-live="polite"` announcement "Account unlocked. You can now sign in."

---

## 3. Layout Shell

---

### 3.1 Sidebar

**EMPTY**: Not applicable — sidebar always has navigation items.

**LOADING (Initial App Load)**:

```
┌─────────────────────┐
│  ◉ Concierge        │
│                     │
│  ░░░░░░░░░░░░░░░░░ │   (shimmer bars for menu groups)
│  ● ░░░░░░░░░░░░    │
│    ░░░░░░░░░░░░░░  │
│    ░░░░░░░░░░░░    │
│    ░░░░░░░░░░░░░░  │
│                     │
│  ░░░░░░░░░░░░░░░░░ │
│    ░░░░░░░░░░░░    │
│    ░░░░░░░░░░░░░░  │
│    ░░░░░░░░░░░░    │
│                     │
│  ─────────────────  │
│  ○ ░░░░░░░░░░░░    │
│  ░░░░░░░░░░░░░░░░  │
└─────────────────────┘
```

- Logo renders immediately (not a skeleton).
- Menu items show as shimmer bars matching expected layout.
- User profile section at bottom shows avatar circle + name bar shimmer.

**ERROR**: Sidebar fails to load menu items:

- Logo still visible.
- Single error message in sidebar body: "Menu unavailable. Refresh the page."
- Retry link below.

**SUCCESS**: Not applicable — sidebar does not have a success state.

**PARTIAL**: Some badge counts fail to load. Menu items render without badges. No error shown for missing badge counts.

**OFFLINE**: Sidebar renders from cache. All navigation works (routes load cached pages). Badge counts show last-known values with `--text-tertiary` color.

**Collapsed State (64px)**:

```
┌──────┐
│  ◉   │
│      │
│  🏠  │   (icons only, centered)
│  📦  │   Tooltip on hover: "Packages (3)"
│  🔒  │   Active: accent left border + accent icon
│  📋  │   Hover: --bg-tertiary background
│  📊  │
│      │
│  ──  │
│  👤  │
└──────┘
```

- Tooltip: appears after 300ms hover delay, positioned to the right of the icon.
- Tooltip style: `--bg-primary` background, `--border-subtle` border, 8px padding, Caption text.
- Transition between collapsed/expanded: width animates 200ms ease-in-out. Labels fade in/out independently.
- Keyboard: `[` toggles. Focus trap maintained within sidebar. `Tab` moves between items.

**Accessibility**:

- `<nav aria-label="Main navigation">`.
- Each item: `role="link"` or `role="button"`, `aria-current="page"` for active item.
- Collapsed: `aria-label` on each icon includes full label text ("Packages, 3 new").
- Category headers: `role="heading"` with `aria-level="3"`.
- Collapse toggle: `aria-label="Collapse sidebar"` / `"Expand sidebar"`, `aria-expanded="true/false"`.

---

### 3.2 Header

**LOADING**:

- Page title: shimmer bar, 200px x 28px.
- Greeting: shimmer bar, 300px x 14px.
- Notification bell: renders immediately with no badge until count loads.
- Search pill: renders immediately.

**ERROR**: Header itself does not fail. If notification count fails, bell renders without badge. No error indicator.

**PARTIAL**: Notification count fails — bell shows without badge. User avatar fails — shows default initial circle (first letter of name, `--bg-secondary` background).

**OFFLINE**: Header renders from cache. Notification badge shows last-known count in `--text-tertiary`. Search still opens command palette (searches cached data only).

**Accessibility**:

- Header: `role="banner"`.
- Page title: `<h1>`.
- Search trigger: `aria-label="Search, keyboard shortcut Command K"`.
- Notification bell: `aria-label="Notifications, [count] unread"`.
- User menu trigger: `aria-haspopup="true"`, `aria-expanded="false/true"`.

---

### 3.3 Command Palette

**EMPTY (Just Opened, No Query)**:

```
┌──────────────────────────────────────────────────┐
│  🔍  Search pages, units, residents, actions...   │
│                                                    │
│  RECENT                                            │
│  ↩ Unit 1205 — View Unit File                     │
│  ↩ Announcements — Create Announcement            │
│                                                    │
│  SUGGESTED                                         │
│  📦 3 packages awaiting release                   │
│  🔧 2 open service requests                       │
│  📢 1 announcement draft                          │
│                                                    │
└──────────────────────────────────────────────────┘
```

- Overlay: full-screen backdrop (`rgba(0,0,0,0.4)`), palette centered vertically in top third.
- Input auto-focused. Cursor blinking.
- Recent items: last 5 searches/navigations.
- Suggested items: actionable items requiring attention, pulled from dashboard data.
- Animation in: backdrop fades 200ms, palette scales from 0.95 to 1.0 + fades in, 200ms, ease-out.

**LOADING (Search In Progress)**:

- Spinner (16px) appears at right end of input field after 300ms of typing pause.
- Results area shows skeleton: 3 shimmer bars (text lines).
- Debounce: 300ms after last keystroke before querying.

**ERROR (Search Failed)**:

- Inline message below input: "Search is temporarily unavailable. Try again."
- Recent and suggested items still shown if cached.

**SUCCESS (Results Found)**:

```
┌──────────────────────────────────────────────────┐
│  🔍  unit 12                                      │
│                                                    │
│  UNITS                                             │
│  ▸ Unit 1201 — Floor 12, 2BR, Active             │
│  ▸ Unit 1205 — Floor 12, 1BR, Active             │
│  ▸ Unit 1210 — Floor 12, Studio, Vacant          │
│                                                    │
│  RESIDENTS                                         │
│  ▸ Sarah Chen — Unit 1205                         │
│                                                    │
│  PAGES                                             │
│  ▸ Unit Management                                │
│                                                    │
│  ─────────                                        │
│  ↵ Enter to select  ↑↓ Navigate  Esc Close       │
└──────────────────────────────────────────────────┘
```

- Results grouped by category with overline headers.
- Active result: `--accent-subtle` background. Arrow keys navigate.
- Enter selects and navigates. Esc closes palette.
- Maximum 10 results shown. "View all results" link at bottom if more exist.

**EMPTY (No Results)**:

```
│  🔍  xyzabc123                                    │
│                                                    │
│              No results found                      │
│     Try different keywords or check spelling.      │
│                                                    │
```

**PARTIAL**: Not applicable — search results are atomic.

**OFFLINE**: Searches cached data only. "Searching cached data — some results may be missing." shown as subtitle in `--text-tertiary`.

**Accessibility**:

- Palette: `role="dialog"`, `aria-label="Search"`, `aria-modal="true"`.
- Input: `role="combobox"`, `aria-expanded="true"`, `aria-controls="search-results"`, `aria-activedescendant` tracks focused result.
- Results list: `role="listbox"`. Each result: `role="option"`.
- Category headers: `role="presentation"` (not interactive).
- Footer shortcuts: `aria-hidden="true"` (visual only).
- Focus trap: Tab cycles within palette. Esc closes and returns focus to trigger element.

---

## 4. Dashboards

All dashboards follow the same state patterns with different content. Defined once, then only
screen-specific content is listed per dashboard.

---

### 4.1 Dashboard State Template

**EMPTY**: Dashboards are never truly empty — they always show the KPI row and widget containers. Individual widgets within the dashboard can be empty. See per-dashboard sections for widget empty states.

**LOADING**: Full dashboard skeleton (see Section 1.2 "Skeleton Layout — Dashboard"). All widgets shimmer simultaneously.

**ERROR (Full Page)**:

- Shown only if the dashboard data endpoint itself fails (not individual widgets).
- Full-page error pattern (Section 1.3).
- Headline: "Could not load your dashboard"
- Description: "We are having trouble connecting. This is usually temporary."
- CTA: "Try Again"

**PARTIAL**: Most common dashboard state. See Section 1.5. Individual widgets load independently and can fail independently.

**OFFLINE**: All widgets show cached data with reduced opacity and "Last updated X minutes ago" timestamps. Action buttons in Quick Actions widget remain enabled for offline-capable actions.

---

### 4.2 System Dashboard (Super Admin)

**Unique Widgets**:

- Property Overview (total properties, total units, total users)
- System Health (API response time, error rate, uptime)
- Recent Activity (cross-property event feed)
- Storage Usage (documents, photos, backups)
- License Utilization (seats used / available)

**Widget Empty States**:

| Widget              | Empty Headline                     | Empty Description                                                         | Empty CTA      |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------- | -------------- |
| Property Overview   | "Add your first property"          | "Properties are the foundation of Concierge. Start by adding a building." | "Add Property" |
| System Health       | (never empty — always has metrics) | —                                                                         | —              |
| Recent Activity     | "No recent activity"               | "Activity from all properties will appear here as users start working."   | —              |
| Storage Usage       | (never empty — shows 0 / limit)    | —                                                                         | —              |
| License Utilization | (never empty — shows 0 / limit)    | —                                                                         | —              |

**Accessibility**: Dashboard has `aria-label="System administration dashboard"`. Each widget: `role="region"` with `aria-label="[Widget name]"`.

---

### 4.3 Management Dashboard (Property Admin)

**Unique Widgets**:

- Building Stats (units, occupancy rate, open issues)
- Compliance Summary (vendor insurance, certifications due)
- Financial Summary (fees collected, outstanding, overdue)
- Staff Online (currently logged-in staff)
- Pending Approvals (amenity bookings, alteration requests)
- Open Maintenance (by priority)

**Widget Empty States**:

| Widget             | Empty Headline                          | Empty Description                                                       | Empty CTA |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------- | --------- |
| Building Stats     | (never empty — always shows unit count) | —                                                                       | —         |
| Compliance Summary | "All vendors compliant"                 | "No compliance items need attention right now."                         | —         |
| Financial Summary  | "No financial data yet"                 | "Financial summaries will appear as transactions are processed."        | —         |
| Staff Online       | "No staff currently online"             | "Staff sessions will appear here when team members sign in."            | —         |
| Pending Approvals  | "No pending approvals"                  | "You are all caught up. Approval requests will appear here."            | —         |
| Open Maintenance   | "No open requests"                      | "All maintenance requests are resolved. New requests will appear here." | —         |

---

### 4.4 Operations Dashboard (Property Manager)

**Unique Widgets**:

- Today's Activity (events logged today)
- Task Summary (open tasks, overdue, due today)
- Recent Events Feed (scrollable cards)
- Quick Actions (Log Package, Create Event, Add Visitor, New Announcement)
- Upcoming Bookings (next 24 hours)
- Shift Notes (current shift handoff notes)

**Widget Empty States**:

| Widget            | Empty Headline                              | Empty Description                                              | Empty CTA        |
| ----------------- | ------------------------------------------- | -------------------------------------------------------------- | ---------------- |
| Today's Activity  | "Quiet day so far"                          | "Events will appear as they are logged throughout the day."    | —                |
| Task Summary      | "No tasks assigned"                         | "Tasks assigned to you will appear here."                      | —                |
| Recent Events     | "No recent events"                          | "Events from the last 24 hours will show here."                | "Create Event"   |
| Quick Actions     | (never empty — always shows action buttons) | —                                                              | —                |
| Upcoming Bookings | "No upcoming bookings"                      | "Amenity reservations for the next 24 hours will appear here." | —                |
| Shift Notes       | "No shift notes yet"                        | "Leave a note for the next shift."                             | "Add Shift Note" |

---

### 4.5 Security Analytics Dashboard

**Unique Widgets**:

- Incident Trend (line chart, 30 days)
- Active Visitors (count + list)
- FOB Status Summary (active / inactive / lost / total)
- Parking Violations (open count)
- Camera Status (online / offline per camera)
- Recent Incidents (last 5)

**Widget Empty States**:

| Widget             | Empty Headline           | Empty Description                                                     | Empty CTA           |
| ------------------ | ------------------------ | --------------------------------------------------------------------- | ------------------- |
| Incident Trend     | "No incidents recorded"  | "Incident data will populate as reports are filed."                   | —                   |
| Active Visitors    | "No visitors on-site"    | "Visitor check-ins will appear here in real time."                    | —                   |
| FOB Status         | "No FOBs registered"     | "FOB assignments will appear once access devices are added to units." | "Manage FOBs"       |
| Parking Violations | "No open violations"     | "Parking violations will appear here when reported."                  | —                   |
| Camera Status      | "No cameras configured"  | "Camera integrations will display connection status here."            | "Configure Cameras" |
| Recent Incidents   | "No incidents to report" | "Incident reports from the last 7 days will show here."               | "File Incident"     |

---

### 4.6 Security Action Dashboard

**Unique Widgets**:

- Visitor Queue (visitors waiting for check-in)
- Pass-On Items (flagged items from previous shift)
- Quick Actions (Log Visitor, Log Incident, Parking Violation, Key Sign-Out)
- Unit Alerts (units with active instructions or flags)
- Recent Log (last 10 security entries, auto-refreshing)

**Widget Empty States**:

| Widget        | Empty Headline          | Empty Description                                            | Empty CTA      |
| ------------- | ----------------------- | ------------------------------------------------------------ | -------------- |
| Visitor Queue | "No visitors waiting"   | "Expected and walk-in visitors will appear here."            | "Log Visitor"  |
| Pass-On Items | "No pass-on items"      | "Nothing flagged from the previous shift."                   | —              |
| Quick Actions | (never empty)           | —                                                            | —              |
| Unit Alerts   | "No active unit alerts" | "Units with special instructions or flags will appear here." | —              |
| Recent Log    | "No entries today"      | "Security log entries will appear here as they are created." | "Create Entry" |

---

### 4.7 Concierge Dashboard

**Unique Widgets**:

- Package Counter (received today / awaiting release / overdue)
- Visitor Count (on-site / expected)
- Quick Actions (Log Package, Log Visitor, Release Package, Shift Note)
- Recent Packages (last 10, sortable)
- Expected Deliveries (scheduled for today)
- Shift Handoff (notes from previous shift)

**Widget Empty States**:

| Widget              | Empty Headline           | Empty Description                                        | Empty CTA        |
| ------------------- | ------------------------ | -------------------------------------------------------- | ---------------- |
| Package Counter     | "No packages today"      | "Package counts will update as deliveries arrive."       | "Log Package"    |
| Visitor Count       | "No visitors on-site"    | "Visitor activity will appear here."                     | "Log Visitor"    |
| Quick Actions       | (never empty)            | —                                                        | —                |
| Recent Packages     | "No recent packages"     | "Packages logged in the last 24 hours will appear here." | "Log Package"    |
| Expected Deliveries | "No expected deliveries" | "Scheduled deliveries will appear here."                 | —                |
| Shift Handoff       | "No handoff notes"       | "Notes from the outgoing shift will appear here."        | "Add Shift Note" |

---

### 4.8 Maintenance Dashboard

**Unique Widgets**:

- Open Requests by Priority (stacked bar or cards: critical, high, medium, low)
- Overdue Requests (count + list)
- Vendor Assignment (requests with/without vendor)
- Work Order Status (open, in progress, completed this week)
- Equipment Alerts (items due for service)
- Recent Completions (last 5 closed requests)

**Widget Empty States**:

| Widget             | Empty Headline          | Empty Description                                                | Empty CTA          |
| ------------------ | ----------------------- | ---------------------------------------------------------------- | ------------------ |
| Open Requests      | "No open requests"      | "Maintenance requests will appear as they are submitted."        | "Create Request"   |
| Overdue Requests   | "Nothing overdue"       | "All requests are within their expected timeframes."             | —                  |
| Vendor Assignment  | "No vendor assignments" | "Requests with vendor assignments will be tracked here."         | —                  |
| Work Order Status  | "No active work orders" | "Work orders will appear as requests are assigned and actioned." | —                  |
| Equipment Alerts   | "All equipment current" | "Equipment service reminders will appear here when due."         | "Manage Equipment" |
| Recent Completions | "No recent completions" | "Completed maintenance requests will show here."                 | —                  |

---

### 4.9 Governance Dashboard (Board Member)

**Unique Widgets**:

- Financial Overview (budget vs. actual, reserve fund)
- Pending Board Actions (items requiring vote or review)
- Building Performance (occupancy, satisfaction, maintenance KPIs)
- Upcoming Meetings (next 3 board meetings)
- Recent Reports (published reports available for review)
- Alteration Requests (pending board approval)

**Widget Empty States**:

| Widget                | Empty Headline             | Empty Description                                                 | Empty CTA |
| --------------------- | -------------------------- | ----------------------------------------------------------------- | --------- |
| Financial Overview    | "No financial reports yet" | "Budget and financial data will appear as reports are generated." | —         |
| Pending Board Actions | "No actions pending"       | "Items requiring board review will appear here."                  | —         |
| Building Performance  | "Performance data loading" | "Building metrics will populate as data is collected."            | —         |
| Upcoming Meetings     | "No meetings scheduled"    | "Board meetings will appear here when scheduled."                 | —         |
| Recent Reports        | "No reports published"     | "Published reports for board review will appear here."            | —         |
| Alteration Requests   | "No pending alterations"   | "Alteration requests requiring approval will appear here."        | —         |

---

### 4.10 Resident Portal Dashboard

**Unique Widgets**:

- My Packages (pending pickup)
- My Requests (open maintenance requests)
- My Bookings (upcoming amenity reservations)
- Building Announcements (recent, unread highlighted)
- Quick Actions (Request Maintenance, Book Amenity, View Packages)
- Community (latest classified ads, upcoming events)

**Widget Empty States**:

| Widget        | Empty Headline                 | Empty Description                                           | Empty CTA             |
| ------------- | ------------------------------ | ----------------------------------------------------------- | --------------------- |
| My Packages   | "No packages waiting"          | "You will be notified when a package arrives for you."      | —                     |
| My Requests   | "No open requests"             | "Submit a maintenance request when something needs fixing." | "Request Maintenance" |
| My Bookings   | "No upcoming bookings"         | "Reserve amenities like the party room or gym."             | "Book an Amenity"     |
| Announcements | "No announcements"             | "Building announcements will appear here."                  | —                     |
| Quick Actions | (never empty)                  | —                                                           | —                     |
| Community     | "Nothing new in the community" | "Classified ads and events will appear here."               | "Browse Community"    |

---

## 5. Event Log

---

### 5.1 Event Feed

**Layout**: Full-width data table with filter bar, search, and card/table view toggle.

**EMPTY**:

- Illustration: Line-art clipboard with a single checkmark, accent blue on the checkmark.
- Headline: "Your event log starts here"
- Description: "Events capture everything that happens in your building — packages, visitors, incidents, and more. Create your first event to get started."
- CTA: "Create Event"
- Accessibility: "Event feed. No events recorded. Create event button available."

**LOADING**: Skeleton table with 8 rows. Filter bar renders immediately (static controls). Column headers render immediately with shimmer in data cells.

**ERROR**:

- Headline: "Could not load events"
- Description: "We are having trouble loading the event feed. This is usually temporary."
- CTA: "Try Again"

**SUCCESS (Event Created)**: Toast notification: "Event created successfully. Reference: EVT-20260316-0001."

**PARTIAL**: Filter bar and search load. Table shows available results. If pagination data fails, show "Showing available results. Some data may be missing." footer.

**OFFLINE**: Cached events shown with reduced opacity. "Create Event" still works (queued). Filter and sort work on cached data. "Some events may not be shown while offline" banner.

---

### 5.2 Event Detail

**Layout**: Split view — event details on left (8 columns), activity timeline on right (4 columns).

**EMPTY**: Not applicable — event detail always has data (it was created).

**LOADING**: Left panel: shimmer for title, status badge, detail fields. Right panel: shimmer for timeline entries.

**ERROR**: "Could not load this event. It may have been removed or you may not have access." CTA: "Back to Events"

**SUCCESS (Event Updated)**: Toast: "Event updated successfully."

**PARTIAL**: Event details loaded but timeline failed: timeline panel shows inline error with retry. Event details failed but timeline loaded: detail panel shows inline error.

**OFFLINE**: Cached event detail shown. "Update Event" queued if used. Timeline shows cached entries.

---

### 5.3 Create Event

**Layout**: Form page — single column, max-width 640px centered.

**EMPTY (Fresh Form)**:

- All fields empty. Event Type dropdown focused.
- Required fields marked with `*` (Event Type, Unit, Description).
- Form section: Event Type, Unit, Description, Notes, Notification toggle, Attachments.
- CTA: "Create Event" (disabled until required fields filled).
- Accessibility: "Create event form. Event type field is focused. 3 required fields."

**LOADING (Submitting)**: Button shows "Creating..." with spinner. All fields disabled.

**ERROR (Validation)**: Inline errors on each invalid field. Red border + error text below field. Form scrolls to first error. Accessibility: "3 errors found. [First error message]. [Field name] field."

**ERROR (Server)**: Toast error: "Could not create event. Your data has been saved — try again." Form data preserved.

**SUCCESS**: Major success pattern (Section 1.4B). "Event created — EVT-20260316-0001". CTAs: "View Event" / "Create Another".

**PARTIAL**: Not applicable for form submission.

**OFFLINE**: Form available. "Create Event" queues the event. Toast: "Event queued. It will be submitted when you reconnect." Badge on queue indicator increments.

---

### 5.4 Batch Create Events

**Layout**: Multi-row form. 4 rows visible by default, "+ Add Row" button below. Each row: Event Type, Unit, Description, Notify toggle.

**EMPTY**: 4 empty rows. First row, first field focused. Helper text above: "Log multiple events at once. Each row creates a separate event."

**LOADING**: "Create All" button shows "Creating 4 events..." with progress: "1 of 4...". Each row updates as it submits: shimmer while pending, checkmark when done.

**ERROR (Partial Batch Failure)**:

```
┌──────────────────────────────────────────────────┐
│  Batch Results                                     │
│                                                    │
│  ✓ Row 1 — Package for Unit 1205    Created        │
│  ✓ Row 2 — Visitor for Unit 801     Created        │
│  ✕ Row 3 — Incident Unit 302       Failed          │
│  ✓ Row 4 — Cleaning Log Floor 3    Created         │
│                                                    │
│  3 of 4 events created. 1 failed.                  │
│                                                    │
│  [ Retry Failed ]    [ Done ]                      │
└──────────────────────────────────────────────────┘
```

- Failed rows highlighted with `--status-error-bg` background.
- "Retry Failed" re-submits only failed rows.
- Accessibility: "Batch creation complete. 3 events created. 1 event failed. Retry failed button available."

**SUCCESS**: All rows show checkmarks. Summary: "4 events created successfully." CTA: "View Events" / "Create More".

**PARTIAL**: Not applicable.

**OFFLINE**: Batch creation queues all rows. "4 events queued. They will be submitted when you reconnect."

---

## 6. Package Management

---

### 6.1 Package Feed

**EMPTY**:

- Illustration: Line-art mailbox with an open door, accent blue on a small package peeking out.
- Headline: "Your package log starts here"
- Description: "Track every delivery from arrival to pickup. Log your first package to see it here."
- CTA: "Log a Package"
- Accessibility: "Package feed. No packages recorded. Log a package button available."

**LOADING**: Skeleton card grid (3 columns) or skeleton table (if table view selected). 6 skeleton cards. Filter bar renders immediately.

**ERROR**: Standard error pattern. Headline: "Could not load packages"

**SUCCESS (Package Logged)**: Toast: "Package logged — PKG-20260316-0042. Label printed." (if label printing enabled). Toast includes courier icon if courier was selected.

**PARTIAL**: Package list loads but courier icons fail — show default package icon. Filter counts fail — filters render without counts.

**OFFLINE**: Cached packages shown. "Log Package" works offline (queued). "Release Package" disabled (requires signature/confirmation). Filter/sort on cached data.

---

### 6.2 Log Package

**Layout**: Form — optimized for speed. Fields laid out for quick entry with keyboard shortcuts.

**EMPTY (Fresh Form)**:

- Courier dropdown focused (most common first action).
- Fields: Courier (with logo icons), Unit (searchable dropdown), Recipient (auto-populated from unit), Description, Storage Location (dropdown), Notify Resident (toggle, on by default), Print Label (toggle).
- Reference number shown as auto-generated preview: "PKG-20260316-XXXX".
- CTA: "Log Package" (disabled until Courier + Unit filled).

**LOADING**: "Log Package" button shows "Logging..." with spinner.

**ERROR (Validation)**: Inline errors. Most common: Unit not found. Error: "No unit found matching '[input]'. Check the unit number."

**ERROR (Server)**: Toast: "Could not log package. Your data has been saved — try again."

**SUCCESS**: Toast: "Package logged — PKG-20260316-0042." If Print Label on: "Label sent to printer." If Notify on: "Notification sent to [Resident Name]." Form clears for next entry (stay on Log Package page for rapid entry).

**PARTIAL**: Not applicable.

**OFFLINE**: Form available. "Log Package" queued. Notification and label printing deferred: "Notification and label will process when you reconnect."

---

### 6.3 Package Detail

**Layout**: Detail page with package info, timeline, and actions.

**EMPTY**: Not applicable.

**LOADING**: Skeleton — status badge area, detail fields, timeline.

**ERROR**: "Could not load package details." CTA: "Back to Packages".

**SUCCESS (Released)**: Major success. "Package released to [Resident Name]." Animated checkmark. CTAs: "View Packages" / "Log Another".

**PARTIAL**: Package details load but timeline fails — inline error on timeline section.

**OFFLINE**: Cached detail shown. Release action disabled. "Releasing a package requires an internet connection."

---

### 6.4 Release Package

**Layout**: Confirmation modal overlaying Package Detail.

```
┌──────────────────────────────────────────────────┐
│  Release Package                          ✕       │
│                                                    │
│  Package: PKG-20260316-0042                        │
│  Courier: Amazon                                   │
│  Unit: 1205                                        │
│  Recipient: Sarah Chen                             │
│                                                    │
│  Releasing to:                                     │
│  ┌──────────────────────────────────────┐          │
│  │ Sarah Chen (resident)           ▾   │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Notes (optional)                                  │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│         [ Cancel ]    [ Release Package ]          │
└──────────────────────────────────────────────────┘
```

**EMPTY**: "Releasing to" pre-populated with registered unit resident. Notes empty.

**LOADING**: "Release Package" shows "Releasing..." with spinner.

**ERROR (Validation)**: "Select who is picking up the package."

**ERROR (Server)**: "Could not release package. Try again." Modal stays open, data preserved.

**SUCCESS**: Modal closes. Toast: "Package released to Sarah Chen." Package card in feed updates status to "Released" with `--status-success` badge.

**PARTIAL**: Not applicable.

**OFFLINE**: "Release Package" button disabled. "Package release requires an internet connection."

---

### 6.5 Batch Intake

**Layout**: Multi-row rapid entry form, similar to Batch Create Events but optimized for packages.

**EMPTY**: 4 empty rows. Columns: Courier, Unit, Recipient, Storage Location, Notify. First cell focused.

**LOADING**: "Log All" button shows progress: "Logging 6 packages... 3 of 6".

**ERROR**: Same partial batch failure pattern as Section 5.4.

**SUCCESS**: "6 packages logged successfully. 4 labels printed. 6 notifications sent." CTAs: "View Packages" / "Log More".

**PARTIAL**: Not applicable.

**OFFLINE**: All entries queued. "6 packages queued. Labels and notifications will process when you reconnect."

---

## 7. Security Console

---

### 7.1 Security Dashboard

See Section 4.5 (Security Analytics) and Section 4.6 (Security Action) for dashboard states.

---

### 7.2 Visitor Log

**Layout**: Data table with real-time status indicators (Active / Checked Out). Filter tabs: All, Active, Expected, Checked Out. Search by visitor name or unit.

**EMPTY**:

- Illustration: Line-art building entrance with a person approaching, accent blue on the door.
- Headline: "Track visitors as they arrive"
- Description: "Log every visitor for building security. Expected visitors, walk-ins, and deliveries all appear here."
- CTA: "Log a Visitor"
- Secondary text: "Visitors can also be pre-registered by residents through the portal."
- Accessibility: "Visitor log. No visitors recorded. Log a visitor button available."

**LOADING**: Skeleton table with columns: Visitor Name, Unit Visiting, Check-in Time, Status, Checked Out. Filter tabs render immediately. Active visitor count in tab badge shows skeleton circle.

**ERROR**: Standard error. "Could not load visitor log."

- Headline: "Could not load visitor log"
- Description: "The visitor records are temporarily unavailable. Active visitors may still be on-site."
- CTA: "Try Again"
- Accessibility: "Error loading visitor log. Try again button available."

**SUCCESS (Visitor Logged)**: Toast: "Visitor logged. [Name] visiting Unit [number]." New visitor row slides into table at top (200ms, ease-out). Active count badge increments with pulse animation.

**SUCCESS (Visitor Checked Out)**: Toast: "Visitor checked out. [Name] departed at [time]." Row status transitions from "Active" (green badge) to "Checked Out" (grey badge), 200ms color fade. Active count badge decrements.

**SUCCESS (Pre-Registered Visitor Arrived)**: Toast: "Expected visitor arrived. [Name] for Unit [number]." Row updates from "Expected" (blue badge) to "Active" (green badge).

**PARTIAL**: Visitor list loads but unit details fail — show unit number without resident name. Pre-registered visitor list fails — show manual entries only with note "Pre-registered visitors could not be loaded."

**OFFLINE**: Cached visitor log. "Log Visitor" works offline (queued). "Check Out" works offline (queued). Active visitors list may be stale — banner: "Visitor status may not reflect recent changes."

**Log Visitor Form (Modal)**:

```
┌──────────────────────────────────────────────────┐
│  Log Visitor                              ✕       │
│                                                    │
│  Visitor Name *                                    │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Visiting Unit *                                   │
│  ┌──────────────────────────────────────┐          │
│  │ Search units...                  ▾   │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Visitor Type                                      │
│  ○ Guest  ○ Contractor  ○ Delivery  ○ Other       │
│                                                    │
│  ID Presented                                      │
│  ○ Driver's License  ○ Passport  ○ None           │
│                                                    │
│  Vehicle (optional)                                │
│  ┌──────────────────────────────────────┐          │
│  │ License plate or description         │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Notes (optional)                                  │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│         [ Cancel ]    [ Log Visitor ]              │
└──────────────────────────────────────────────────┘
```

- Visitor Name focused on open. Required fields: Name, Unit.
- Unit dropdown auto-populates resident name when unit selected.
- Accessibility: modal has `role="dialog"`, `aria-label="Log visitor form"`, `aria-modal="true"`.

---

### 7.3 Incident Reports

**Layout**: Card grid view (default) or table view. Cards show severity color strip on left edge (red = critical, orange = urgent, yellow = moderate, grey = minor). Filter by severity, status, date range.

**EMPTY**:

- Illustration: Line-art shield with a checkmark, accent blue on the check.
- Headline: "No incidents to report"
- Description: "Incident reports document security events, property damage, and policy violations. File a report when something happens."
- CTA: "File Incident Report"
- Accessibility: "Incident reports. No incidents recorded. File incident report button available."

**LOADING**: Skeleton card grid. Each card: severity color strip (grey shimmer), title bar, 2 body lines, timestamp bar. Filter bar renders immediately with severity toggles.

**ERROR**: Standard error. "Could not load incident reports."

**SUCCESS (Report Filed)**: Major success pattern. "Incident report filed — INC-20260316-003. Property manager notified." CTAs: "View Report" / "File Another". If severity is Critical or Urgent: additional line: "Escalation notification sent to [Property Manager Name]."

**SUCCESS (Report Resolved)**: Toast: "Incident INC-20260316-003 resolved." Card severity strip transitions from color to grey (200ms). Status badge updates to "Resolved".

**PARTIAL**: Report list loads but severity counts in header fail — counts show "--". Report cards load but attached photos fail to thumbnail — show generic image placeholder icon.

**OFFLINE**: Cached reports shown. "File Incident Report" works offline (queued). "Photos and attachments will upload when you reconnect." Severity filters work on cached data.

**File Incident Report Form**:

```
┌──────────────────────────────────────────────────┐
│  ← File Incident Report                           │
│                                                    │
│  Severity *                                        │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │Critical│  │ Urgent │  │Moderate│  │ Minor  │ │
│  │  (red) │  │(orange)│  │(yellow)│  │ (grey) │ │
│  └────────┘  └────────┘  └────────┘  └────────┘ │
│  (card-style radio buttons with color indicator)   │
│                                                    │
│  Incident Type *                                   │
│  ┌──────────────────────────────────────┐          │
│  │ Select type...                   ▾   │          │
│  └──────────────────────────────────────┘          │
│  Types: Unauthorized Access, Property Damage,      │
│  Noise Complaint, Theft, Assault, Fire/Smoke,      │
│  Water Damage, Suspicious Activity, Other          │
│                                                    │
│  Location *                                        │
│  ┌──────────────────────────────────────┐          │
│  │ Where did this occur?                │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Description *                                     │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  │                              0/4,000 │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Involved Parties (optional)                       │
│  ┌──────────────────────────────────────┐          │
│  │ Search residents or enter names...   │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Photos / Evidence                                 │
│  ┌──────────────────────────────────────┐          │
│  │  Drag files here or click to browse  │          │
│  │  JPG, PNG, HEIC, PDF up to 4MB       │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  ☐ Notify property manager immediately             │
│  ☐ Police report filed                             │
│  ☐ Requires follow-up                              │
│                                                    │
│         [ Cancel ]    [ File Report ]              │
└──────────────────────────────────────────────────┘
```

- Severity selection required before other fields enabled.
- "Notify property manager" auto-checked for Critical and Urgent severities.
- Accessibility: severity cards are `role="radiogroup"`. Each card: `role="radio"` with `aria-label="[Severity] — [color description]"`.

---

### 7.4 Key/FOB Log

**EMPTY**:

- Illustration: Line-art key ring with two keys, accent blue on one key.
- Headline: "Track building access devices"
- Description: "Manage FOBs, keys, and garage clickers. Sign-outs and returns are logged here."
- CTA: "Log Key Sign-Out"

**LOADING**: Skeleton table. Columns: Device Type, Serial Number, Unit, Signed Out To, Date Out, Date In, Status.

**ERROR**: Standard error.

**SUCCESS (Key Signed Out)**: Toast: "FOB signed out. Serial: FOB-2847 to Unit 1205."

**SUCCESS (Key Returned)**: Toast: "FOB returned. Serial: FOB-2847."

**PARTIAL**: Key list loads but unit names fail — show unit numbers only.

**OFFLINE**: Cached log. Sign-out and return both work offline (queued). "Serial number validation will occur when you reconnect."

---

### 7.5 Pass-On Log

**EMPTY**:

- Illustration: Line-art notepad with a pen, accent blue on the pen tip.
- Headline: "Pass-on notes keep every shift informed"
- Description: "Leave notes for the next shift about ongoing situations, special instructions, or items needing follow-up."
- CTA: "Add Pass-On Note"

**LOADING**: Skeleton card list (single column, chronological).

**ERROR**: Standard error. "Could not load pass-on log."

**SUCCESS**: Toast: "Pass-on note added."

**PARTIAL**: Notes load but author avatars fail — show initials in circle.

**OFFLINE**: Cached notes shown. "Add Pass-On Note" works offline (queued).

---

### 7.6 Cleaning Log

**EMPTY**:

- Illustration: Line-art spray bottle, accent blue on the spray mist.
- Headline: "Track cleaning and sanitation"
- Description: "Document cleaning activities across common areas, amenities, and units."
- CTA: "Log Cleaning Activity"

**LOADING**: Skeleton table. Columns: Area, Activity, Completed By, Date/Time, Notes.

**ERROR**: Standard error.

**SUCCESS**: Toast: "Cleaning activity logged for [Area]."

**PARTIAL**: Log loads but area names from settings fail — show area IDs.

**OFFLINE**: Cached log. Logging works offline.

---

### 7.7 Notes

**EMPTY**:

- Illustration: Line-art sticky note, accent blue on a corner fold.
- Headline: "General notes for your team"
- Description: "Quick notes that do not fit a specific category. Visible to all security and concierge staff."
- CTA: "Add Note"

**LOADING**: Skeleton card list.

**ERROR**: Standard error.

**SUCCESS**: Toast: "Note added."

**PARTIAL**: Standard partial.

**OFFLINE**: Cached notes. Adding works offline.

---

### 7.8 Parking Violations

**EMPTY**:

- Illustration: Line-art car with a parking sign, accent blue on the P sign.
- Headline: "No parking violations reported"
- Description: "Report unauthorized parking, expired permits, and parking infractions. Violations are tracked through resolution."
- CTA: "Report Violation"

**LOADING**: Skeleton table. Columns: Vehicle, License Plate, Violation Type, Location, Date, Status.

**ERROR**: Standard error.

**SUCCESS (Violation Reported)**: Toast: "Parking violation reported. Reference: PV-20260316-001."

**SUCCESS (Violation Resolved)**: Toast: "Violation resolved. PV-20260316-001 marked as resolved."

**PARTIAL**: Violation list loads but resolution history fails — show current status only.

**OFFLINE**: Cached violations. "Report Violation" works offline (queued). "Resolve Violation" works offline (queued).

---

## 8. Maintenance

---

### 8.1 Request List

**EMPTY**:

- Illustration: Line-art wrench and screwdriver crossed, accent blue on a bolt.
- Headline: "Maintenance requests start here"
- Description: "Track repairs, inspections, and service requests from submission through completion."
- CTA: "Create Request"

**LOADING**: Skeleton table with priority color indicators on left edge. Filter bar with status tabs (All, Open, In Progress, On Hold, Closed) renders immediately.

**ERROR**: Standard error. "Could not load maintenance requests."

**SUCCESS**: Toast on status change: "Request MR-20260316-007 updated to In Progress."

**PARTIAL**: Request list loads but priority labels fail — show without color coding.

**OFFLINE**: Cached requests. "Create Request" works offline. Status updates queued.

---

### 8.2 Create Request

**Layout**: Rich form, max-width 720px. Photo upload area, category selection, priority, description (4000 char), permission to enter, entry instructions, contact info.

**EMPTY (Fresh Form)**:

- Category dropdown focused.
- Photo upload area: dashed border box, "Drag photos here or click to browse. JPG, PNG, HEIC up to 4MB."
- Permission to enter: radio buttons (Yes / No), neither selected.
- Priority: dropdown defaulting to "Medium".
- Description: empty textarea with character count "0 / 4,000".

**LOADING**: "Submit Request" shows "Submitting..." with spinner. If photos attached, shows upload progress: "Uploading 2 photos... 64%".

**ERROR (Validation)**: Inline errors. Required fields: Category, Description (min 20 characters), Unit.

**ERROR (Photo Upload Failed)**: Inline error on photo area: "2 of 3 photos uploaded. 1 failed. [Retry Upload]". Form submission proceeds with successful photos. Failed photo can be retried independently.

**SUCCESS**: Major success. "Maintenance request submitted — MR-20260316-007. Reference number copied to clipboard." CTAs: "View Request" / "Create Another" / "Print Work Order".

**PARTIAL**: Not applicable for form.

**OFFLINE**: Form available. "Submit Request" queued. "Photos will upload when you reconnect. Text details saved locally."

---

### 8.3 Request Detail

**Layout**: Left panel (8 col): request info, photos, documents. Right panel (4 col): activity timeline, assignments, status controls.

**EMPTY**: Not applicable.

**LOADING**: Skeleton — left panel fields, photo grid, right panel timeline.

**ERROR**: "Could not load request details." CTA: "Back to Requests."

**SUCCESS (Status Updated)**: Toast: "Request updated to Closed." Status badge animates color transition (200ms).

**SUCCESS (Vendor Assigned)**: Toast: "Request assigned to [Vendor Name]."

**PARTIAL**: Request details load but photos fail — photo area shows: "Photos could not be loaded. [Retry]". Timeline loads but assignment data fails — timeline shows entries without assignee details.

**OFFLINE**: Cached detail. Status updates and comments queued. Photos not available offline: "Photos are not available offline."

---

### 8.4 Work Order

**Layout**: Printable format — single column, optimized for A4/Letter paper.

**EMPTY**: Not applicable — work orders are generated from requests.

**LOADING**: Full-page skeleton matching print layout.

**ERROR**: "Could not generate work order." CTA: "Back to Request."

**SUCCESS (Printed)**: Toast: "Work order sent to printer."

**PARTIAL**: Work order loads but vendor contact info fails — shows "Vendor contact unavailable" in that field.

**OFFLINE**: Cached work order viewable. Print may work via browser print (cached). "Print to network printer requires an internet connection."

---

## 9. Amenity Booking

---

### 9.1 Calendar View

**Layout**: Full-width monthly/weekly/daily calendar grid with amenity filter sidebar.

**EMPTY**:

- Calendar grid renders with empty days. No illustration overlay — the calendar itself is the visual.
- Inline message in the calendar body: "No reservations yet. Book an amenity to see it on the calendar."
- CTA button in top-right (standard page action position): "Book Amenity"
- Amenity filter sidebar shows amenity list (always populated from settings).

**LOADING**: Calendar grid skeleton — day cells render with shimmer blocks where events would appear. Navigation (month/week/day toggle, prev/next) renders immediately.

**ERROR**: "Could not load calendar data." Calendar grid shows empty with error message centered.

**SUCCESS (Booking Created)**: Calendar event appears in the correct time slot with slide-in animation (200ms). Toast: "Amenity booked. [Amenity Name], [Date], [Time]."

**PARTIAL**: Calendar loads but some amenity data fails — show bookings for successful amenities. Failed amenity shown in filter sidebar with warning icon.

**OFFLINE**: Cached calendar shown. "Book Amenity" works offline (queued, subject to server-side availability check on reconnect). Warning: "Booking is queued. Availability will be confirmed when you reconnect."

---

### 9.2 List View

**EMPTY**:

- Illustration: Line-art calendar with a clock, accent blue on the clock hands.
- Headline: "No reservations to show"
- Description: "Book amenities like the party room, gym, or guest suite. All reservations appear here."
- CTA: "Book Amenity"

**LOADING**: Skeleton table. Columns: Amenity, Date, Time, Booked By, Unit, Status.

**ERROR**: Standard error.

**SUCCESS**: Toast on booking confirmation or cancellation.

**PARTIAL**: Standard partial.

**OFFLINE**: Cached reservations. Filtering on cached data.

---

### 9.3 Book Amenity

**Layout**: Multi-step form. Step 1: Select Amenity. Step 2: Select Date/Time. Step 3: Review and Confirm.

**EMPTY (Step 1)**:

- Grid of amenity cards with photos, names, capacity, and hourly rate.
- No amenity selected. Instruction: "Select an amenity to check availability."
- If no amenities configured (admin has not set up): illustration + "No amenities available yet. Your property administrator will set these up."

**LOADING (Checking Availability)**: After amenity + date selected, time slots show skeleton shimmer. "Checking availability..." text above time grid.

**ERROR (Availability Check Failed)**: "Could not check availability for [Amenity]. Try again."

**ERROR (Time Conflict)**: Selected time slot turns red with shake animation. "This time slot is no longer available. Select a different time."

**SUCCESS (Booked)**: Major success. "Reservation confirmed. [Amenity], [Date], [Time Slot]. Confirmation sent to your email." CTAs: "View Reservation" / "Add to Calendar" / "Book Another".

**PARTIAL**: Amenity list loads but photos fail — show amenity cards with default icon (building icon) instead.

**OFFLINE**: Step 1 works (cached amenity list). Step 2 shows cached availability with warning: "Availability may have changed. Your booking will be confirmed when you reconnect." Step 3 queues booking.

---

### 9.4 Reservation Detail

**EMPTY**: Not applicable.

**LOADING**: Skeleton — reservation info, amenity photo, timeline.

**ERROR**: "Could not load reservation." CTA: "Back to Bookings."

**SUCCESS (Cancelled)**: Toast: "Reservation cancelled. [Amenity], [Date]."

**SUCCESS (Approved — admin)**: Toast: "Reservation approved."

**PARTIAL**: Standard partial.

**OFFLINE**: Cached detail. Cancel action queued if used.

---

## 10. Communication

---

### 10.1 Announcement List

**EMPTY**:

- Illustration: Line-art megaphone, accent blue on sound waves.
- Headline: "Keep your community informed"
- Description: "Announcements reach residents via email, push notification, and the portal. Create your first announcement."
- CTA: "Create Announcement"

**LOADING**: Skeleton card list. Each card: title bar, body preview lines, date, distribution badges.

**ERROR**: Standard error.

**SUCCESS (Published)**: Major success. "Announcement published. Sent to 342 residents via [channels]."

**PARTIAL**: Announcement list loads but read counts fail — show without engagement metrics.

**OFFLINE**: Cached announcements shown. "Create Announcement" works offline (queued, will send on reconnect).

---

### 10.2 Create Announcement

**Layout**: Rich form with title, body (rich text editor), target audience selector, distribution channels (email, push, portal), scheduling (now or later).

**EMPTY (Fresh Form)**:

- Title field focused. Rich text editor below with toolbar (bold, italic, link, image, list).
- Audience: default "All Residents". Expandable to filter by floor, unit type, role.
- Channels: all three checked by default (Email, Push, Portal).
- Schedule: "Send Now" selected. "Schedule for Later" shows date/time picker.

**LOADING (Publishing)**: "Publish" button shows "Publishing..." with spinner. Progress if large audience: "Sending to 342 residents..."

**ERROR (Validation)**: Inline errors. Required: Title, Body (min 10 characters).

**ERROR (Send Failure)**: "Announcement saved as draft but could not be published. [Retry Publishing]." Draft preserved in announcement list with "Draft" badge.

**SUCCESS**: Major success pattern. "Announcement published." Distribution summary: "Email: 312 sent, 30 missing email. Push: 287 sent. Portal: visible to all."

**PARTIAL**: Not applicable for forms.

**OFFLINE**: Form available. "Save as Draft" works offline. "Publish" disabled. "Publishing requires an internet connection."

---

### 10.3 Emergency Broadcast

**Layout**: Simplified, high-urgency form. Red accent throughout. Minimal fields for speed. This is designed for maximum clarity under pressure — no unnecessary UI elements.

```
┌──────────────────────────────────────────────────┐
│  ⚠ EMERGENCY BROADCAST                            │
│  ─────────────────────────────────────────────── │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  This will immediately contact ALL residents  │ │
│  │  via email, SMS, push notification, and       │ │
│  │  voice call. Use only for genuine emergencies.│ │
│  └──────────────────────────────────────────────┘ │
│  (--status-error-bg background, --status-error     │
│   left border 3px)                                 │
│                                                    │
│  Severity *                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ CRITICAL   │  │  URGENT    │  │  WARNING   │  │
│  │ Immediate  │  │ Within 1hr │  │ Awareness  │  │
│  │ danger     │  │ response   │  │ only       │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                    │
│  Subject *                                         │
│  ┌──────────────────────────────────────┐          │
│  │ Brief, clear subject line            │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Message *                                         │
│  ┌──────────────────────────────────────┐          │
│  │ What is happening, what should       │          │
│  │ residents do, and when will they     │          │
│  │ receive an update?                   │          │
│  │                              0/1,000 │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Channels (all enabled for emergencies):           │
│  ✓ Email  ✓ SMS  ✓ Push  ✓ Voice Call             │
│  (locked on — cannot be deselected)                │
│                                                    │
│     [ Cancel ]    [ Send Emergency Broadcast ]     │
│                    (--status-error bg, white text)  │
└──────────────────────────────────────────────────┘
```

**EMPTY (Fresh Form)**:

- Severity cards unselected. Subject and Message empty.
- Warning banner prominent at top (always visible, not dismissable).
- Channel checkboxes locked-on — all four channels always enabled for emergency broadcasts.
- CTA disabled until Severity + Subject + Message filled.
- Accessibility: Page has `role="alert"` context. Form: `aria-label="Emergency broadcast form"`. Severity cards: `role="radiogroup"`, `aria-label="Broadcast severity"`.

**Confirmation Modal (After Submit Click)**:

```
┌──────────────────────────────────────────────────┐
│  ⚠ Confirm Emergency Broadcast              ✕    │
│                                                    │
│  You are about to send a CRITICAL broadcast to:   │
│                                                    │
│  • 342 residents via email                         │
│  • 298 residents via SMS                           │
│  • 312 residents via push notification             │
│  • 342 residents via voice call                    │
│                                                    │
│  Subject: "Fire Alarm — Evacuate Immediately"      │
│                                                    │
│  This action cannot be undone.                     │
│                                                    │
│     [ Go Back ]    [ CONFIRM AND SEND ]            │
│                    (--status-error, pulsing border) │
└──────────────────────────────────────────────────┘
```

- "Confirm and Send" button has subtle pulsing border animation (opacity 0.7 to 1.0, 1s loop) to draw attention.
- "Go Back" returns to form with all data preserved.
- No auto-dismiss, no timeout. User must explicitly choose.
- Accessibility: `role="alertdialog"`, `aria-label="Confirm emergency broadcast"`. Focus on "Go Back" button (safer default).

**LOADING**: "Sending broadcast..." with real-time per-channel progress:

```
┌──────────────────────────────────────────────────┐
│  Sending emergency broadcast...                    │
│                                                    │
│  Email    ████████████████░░░░  312 / 342          │
│  SMS      ████████████░░░░░░░░  200 / 298          │
│  Push     ████████████████████  312 / 312  ✓       │
│  Voice    ████████░░░░░░░░░░░░  150 / 342          │
│                                                    │
│  Do not close this page until sending completes.   │
└──────────────────────────────────────────────────┘
```

- Progress bars: `--status-error` color (consistent with emergency theme).
- Completed channels show green checkmark.
- Page navigation blocked during send (beforeunload warning).
- Accessibility: each progress bar has `role="progressbar"`, `aria-valuenow`, `aria-valuemax`. Status updates announced via `aria-live="polite"` region: "Email: 312 of 342 sent. SMS: 200 of 298 sent."

**ERROR**: "Broadcast partially sent. [X] of [Y] residents reached. [Retry for remaining]." Per-channel failure detail:

```
┌──────────────────────────────────────────────────┐
│  ⚠ Broadcast partially sent                       │
│                                                    │
│  Email    342 / 342  ✓  All sent                   │
│  SMS      250 / 298  ✕  48 failed                  │
│  Push     312 / 312  ✓  All sent                   │
│  Voice    100 / 342  ✕  242 failed — provider error│
│                                                    │
│  [ Retry Failed Channels ]    [ View Full Status ] │
└──────────────────────────────────────────────────┘
```

- Failed channels shown with `--status-error` icon and count.
- "Retry Failed Channels" only re-sends to residents who did not receive.
- Accessibility: `role="alert"`. "Emergency broadcast partially sent. Email complete. SMS 48 failed. Push complete. Voice 242 failed. Retry button available."

**SUCCESS**: Major success with urgency styling:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│              ┌──────────────┐                      │
│              │  Animated    │                      │
│              │  checkmark   │                      │
│              │  (red circle │                      │
│              │   + white ✓) │                      │
│              └──────────────┘                      │
│                                                    │
│     Emergency broadcast sent to 342 residents      │
│                                                    │
│     Email: 342  ✓    SMS: 298  ✓                   │
│     Push: 312  ✓     Voice: 342  ✓                 │
│                                                    │
│     Sent at 14:32:01 UTC — March 16, 2026          │
│                                                    │
│     [ View Delivery Status ]   [ Send Update ]     │
│                                                    │
└──────────────────────────────────────────────────┘
```

- Checkmark circle uses `--status-error` (red, not green — maintaining emergency visual context).
- "Send Update" pre-populates a follow-up broadcast referencing the original.
- Timestamp is monospace, prominent.
- Accessibility: "Emergency broadcast sent successfully to 342 residents across all channels. View delivery status or send update."

**PARTIAL**: Some channels succeed, others fail. Per-channel status shown (see Error section above). Retry available per channel.

**OFFLINE**: "Send Emergency Broadcast" button disabled with prominent message: "Emergency broadcasts require an internet connection. If this is a life-threatening emergency, call 911." The "911" text is styled as a phone link (`tel:911`) for mobile devices. Accessibility: "Emergency broadcast unavailable while offline. Call 911 for life-threatening emergencies."

---

## 11. Unit Management

---

### 11.1 Unit List

**EMPTY**:

- Illustration: Line-art apartment building with numbered doors, accent blue on door 101.
- Headline: "Add your building's units"
- Description: "Units are the foundation of your property. Add units to start managing residents, packages, and maintenance."
- CTA: "Add Unit"
- Secondary: "Import from CSV" text link.

**LOADING**: Skeleton table. Columns: Unit Number, Floor, Type, Occupants, Status. Filter bar with floor and status filters.

**ERROR**: Standard error. "Could not load units."

**SUCCESS (Unit Created)**: Toast: "Unit [number] created."

**PARTIAL**: Unit list loads but occupant counts fail — show "--" in occupant column.

**OFFLINE**: Cached unit list. "Add Unit" works offline (queued). Search and filter on cached data.

---

### 11.2 Unit Detail (Tabbed)

**Layout**: Header with unit number, floor, status. Tab bar: Overview, Residents, Packages, Maintenance, Access (FOBs/Keys), Documents, Instructions.

**EMPTY (Per Tab)**:

| Tab          | Empty Headline                      | Empty Description                                                                          | Empty CTA         |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------ | ----------------- |
| Overview     | (never empty — shows unit metadata) | —                                                                                          | —                 |
| Residents    | "No residents in this unit"         | "Add residents to this unit to track occupancy and contacts."                              | "Add Resident"    |
| Packages     | "No packages for this unit"         | "Package history will appear as deliveries are logged."                                    | —                 |
| Maintenance  | "No maintenance requests"           | "Maintenance requests for this unit will appear here."                                     | "Create Request"  |
| Access       | "No access devices assigned"        | "FOBs, keys, and clickers assigned to this unit appear here."                              | "Assign Device"   |
| Documents    | "No documents uploaded"             | "Unit-specific documents like leases and agreements go here."                              | "Upload Document" |
| Instructions | "No front desk instructions"        | "Add instructions that front desk staff will see when this unit is involved in any event." | "Add Instruction" |

**LOADING**: Tab bar renders immediately. Active tab content shows skeleton matching that tab's layout.

**ERROR**: Per-tab error with retry. Other tabs remain functional.

**SUCCESS**: Tab-specific toasts. "Resident added to Unit [number]." / "Instruction saved."

**PARTIAL**: Tab bar loads. Some tabs load, some fail — failed tabs show inline error.

**OFFLINE**: Cached unit data. Some tabs may show stale data warnings.

---

### 11.3 Create/Edit Unit

**Layout**: Form — unit number, floor, building (if multi-building), type (studio/1BR/2BR/3BR/penthouse), status (active/vacant/under renovation), custom fields.

**EMPTY (Create)**:

- Unit Number field focused.
- Building dropdown (if multi-building) pre-filled with current building.
- Custom fields section: dynamically rendered from property settings.
- CTA: "Create Unit" (disabled until Unit Number filled).

**EMPTY (Edit)**: All fields pre-populated with existing data. CTA: "Save Changes".

**LOADING**: Standard form submission loading.

**ERROR (Duplicate)**: "Unit [number] already exists in [building]. Each unit number must be unique per building."

**ERROR (Validation)**: Inline errors on required fields.

**SUCCESS (Created)**: Toast: "Unit [number] created." Redirect to Unit Detail.

**SUCCESS (Updated)**: Toast: "Unit [number] updated."

**PARTIAL**: Not applicable.

**OFFLINE**: Create/edit queued. "Unit changes will sync when you reconnect."

---

### 11.4 Resident Profile

**Layout**: Header with name, unit, role, contact info. Tabs: Overview, Emergency Contacts, Vehicles, Pets, Preferences, Activity.

**EMPTY (Per Tab)**:

| Tab                | Empty Headline                             | Empty Description                                                            | Empty CTA     |
| ------------------ | ------------------------------------------ | ---------------------------------------------------------------------------- | ------------- |
| Overview           | (never empty — shows profile info)         | —                                                                            | —             |
| Emergency Contacts | "No emergency contacts"                    | "Emergency contacts are critical for building safety. Add at least one."     | "Add Contact" |
| Vehicles           | "No vehicles registered"                   | "Register vehicles for parking management."                                  | "Add Vehicle" |
| Pets               | "No pets registered"                       | "Pet registration helps with building policy compliance."                    | "Add Pet"     |
| Preferences        | (never empty — shows notification toggles) | —                                                                            | —             |
| Activity           | "No recent activity"                       | "Activity for this resident will appear as they interact with the building." | —             |

**LOADING**: Profile header skeleton + active tab skeleton.

**ERROR**: "Could not load resident profile." CTA: "Back to Unit" or "Back to Users".

**SUCCESS**: Toast on profile updates.

**PARTIAL**: Standard per-tab partial loading.

**OFFLINE**: Cached profile. Edits queued.

---

## 12. User Management

---

### 12.1 User List

**EMPTY**:

- Illustration: Line-art group of 3 people silhouettes, accent blue on a badge/ID card.
- Headline: "Add your team and residents"
- Description: "Create user accounts for staff, property managers, board members, and residents. Each user gets role-based access."
- CTA: "Create User"
- Secondary: "Import Users from CSV" text link.

**LOADING**: Skeleton table. Columns: Name, Email, Role, Unit (if resident), Status (active/inactive), Last Login.

**ERROR**: Standard error.

**SUCCESS (User Created)**: Toast: "User [name] created. Welcome email sent to [email]."

**SUCCESS (User Deactivated)**: Toast: "User [name] deactivated."

**PARTIAL**: User list loads but last login timestamps fail — show "--" in that column.

**OFFLINE**: Cached user list. User creation disabled. "User management requires an internet connection."

---

### 12.2 Create User

**Layout**: Form — first name, last name, email, role (dropdown), unit assignment (if resident), phone, send welcome email (toggle).

**EMPTY**: First Name field focused. Role defaults to "Resident". "Send Welcome Email" toggle on by default.

**LOADING**: "Create User" shows "Creating..." with spinner.

**ERROR (Duplicate Email)**: "A user with this email address already exists. Use a different email or find the existing user."

**ERROR (Validation)**: Inline errors. Required: First Name, Last Name, Email, Role.

**SUCCESS**: Toast: "User [name] created." If welcome email: "Welcome email sent to [email]." Redirect to User Detail.

**PARTIAL**: Not applicable.

**OFFLINE**: Disabled. "Creating users requires an internet connection."

---

### 12.3 User Detail

**Layout**: Header with name, role badge, status. Tabs: Profile, Permissions, Activity Log, Sessions.

**EMPTY (Per Tab)**:

| Tab          | Empty Headline                            | Empty Description                                             |
| ------------ | ----------------------------------------- | ------------------------------------------------------------- |
| Profile      | (never empty)                             | —                                                             |
| Permissions  | (never empty — shows role-based defaults) | —                                                             |
| Activity Log | "No activity recorded"                    | "User activity will appear as this person uses the platform." |
| Sessions     | "No sessions recorded"                    | "Login sessions will appear here."                            |

**LOADING**: Standard tab skeleton.

**ERROR**: Standard error pattern.

**SUCCESS (Role Changed)**: Toast: "Role updated to [new role] for [user name]."

**PARTIAL**: Standard per-tab partial.

**OFFLINE**: Cached detail. Role changes and profile edits disabled. "User modifications require an internet connection."

---

### 12.4 Role Assignment

**Layout**: Modal with role dropdown, permission summary panel showing what the selected role can access.

**EMPTY**: Current role pre-selected. Permission summary shows current access.

**LOADING**: "Save" shows "Updating role..." with spinner.

**ERROR**: "Could not update role. Try again." Modal stays open.

**SUCCESS**: Modal closes. Toast: "Role updated." User Detail page refreshes to show new role badge.

**PARTIAL**: Not applicable.

**OFFLINE**: Disabled. "Role changes require an internet connection."

---

## 13. Settings

All 16 settings tabs follow the same state pattern. Defined once, then tab-specific content listed.

---

### 13.1 Settings State Template

**Layout**: Left sidebar with settings categories (vertical tab list). Right content area (active tab).

**EMPTY**: Settings are never truly empty — they always have default values or placeholder prompts.

**LOADING**: Left sidebar renders immediately (static category list). Right content shows skeleton matching the form fields for the active tab.

**ERROR**: Right content shows inline error: "Could not load [tab name] settings. [Retry]". Other tabs remain navigable.

**SUCCESS (Saved)**: Inline success banner (Section 1.4C): "Changes saved." Auto-dismiss 3 seconds.

**PARTIAL**: Some settings sections load, others fail — each section has independent error handling.

**OFFLINE**: Cached settings shown. "Save" disabled. "Settings changes require an internet connection."

---

### 13.2 Settings Tabs

| Tab                     | Key Fields                                                                     | First-Use Guidance                                           |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **General**             | Property name, address, timezone, logo upload                                  | "Configure your property's basic information."               |
| **Units**               | Unit types, floor configuration, custom fields                                 | "Define the unit types and custom fields for your property." |
| **Event Types**         | Configurable event type list with icons, colors, notifications                 | "Customize event types to match your building's needs."      |
| **Package Settings**    | Couriers, storage locations, label format, notification templates              | "Set up courier options and label printing preferences."     |
| **Amenities**           | Amenity list, booking rules, pricing, availability hours                       | "Configure bookable amenities and their rules."              |
| **Security**            | FOB types, parking zones, incident categories, camera integrations             | "Set up security device types and incident categories."      |
| **Maintenance**         | Categories, priority levels, SLA targets, auto-assignment rules                | "Configure maintenance categories and response targets."     |
| **Communication**       | Email templates, SMS settings, push notification config, announcement defaults | "Set up notification channels and message templates."        |
| **Roles & Permissions** | Role definitions, granular permission toggles per role                         | "Define what each role can see and do."                      |
| **Branding**            | Logo, colors (limited customization within design system), welcome message     | "Customize the look of your resident portal."                |
| **Integrations**        | API keys, webhook URLs, third-party connections                                | "Connect external services and configure APIs."              |
| **Billing**             | Subscription tier, payment method, invoice history                             | "Manage your subscription and billing details."              |
| **Notifications**       | Global notification rules, quiet hours, escalation chains                      | "Configure when and how notifications are sent."             |
| **Data & Privacy**      | Data retention policies, export data, GDPR/PIPEDA settings                     | "Manage data retention and privacy compliance."              |
| **Audit Log**           | Read-only log of all setting changes with timestamp and user                   | "Review who changed what and when."                          |
| **Access Control**      | IP allowlisting, session timeout, 2FA enforcement, password policies           | "Configure security policies for user access."               |

**Per-Tab Empty State Pattern**: Each tab shows its form fields with defaults pre-populated. A subtle info banner at the top (first visit only): "These defaults work for most properties. Adjust as needed."

---

## 14. Search

---

### 14.1 Command Palette

See Section 3.3 for full state definitions.

---

### 14.2 Full Search Results

**Layout**: Full page with search input at top, results grouped by category below, faceted filters on left sidebar.

**EMPTY (No Query)**:

- Search input focused. Recent searches shown below.
- Popular searches: "Units", "Open Packages", "Today's Events".

**EMPTY (No Results)**:

- Illustration: Line-art magnifying glass over empty page, accent blue on the glass lens.
- Headline: "No results for '[query]'"
- Description: "Try different keywords, check your spelling, or broaden your search."
- Suggestions: "Search for: [related terms based on query]".

**LOADING**: Search input active. Results area shows skeleton: 3 category groups, each with 2-3 shimmer result rows.

**ERROR**: "Search is temporarily unavailable. Try again in a moment." CTA: "Retry Search".

**SUCCESS**: Results shown grouped by category (Units, Residents, Events, Packages, Requests, Announcements). Result count per category. Click navigates to item.

**PARTIAL**: Some categories return results, others fail — failed categories show: "[Category] results unavailable" with retry.

**OFFLINE**: Searches cached data only. Banner: "Searching cached data. Some results may be missing."

---

## 15. Notification Center

---

### 15.1 Notification Panel

**Layout**: Slide-out panel from the right (400px wide) triggered by bell icon.

**EMPTY**:

- No illustration (panel is compact).
- Centered text: "You are all caught up"
- Subtitle: "Notifications will appear here as things happen."
- (Body text, --text-secondary)

**LOADING**: Skeleton: 5 notification item skeletons (avatar circle + 2 text lines each).

**ERROR**: "Could not load notifications. [Retry]". Panel stays open.

**SUCCESS (Marked Read)**: Notification item fades opacity from 1.0 to 0.7 (200ms). Unread dot disappears. Bell badge count decrements.

**SUCCESS (Marked All Read)**: All items simultaneously transition to read state. Badge disappears from bell.

**PARTIAL**: Some notifications load. "Some notifications could not be loaded" at bottom with retry.

**OFFLINE**: Cached notifications shown. New notifications will not appear until reconnect.

**Animation**: Panel slides in from right, 250ms, ease-out. Backdrop fades in, 200ms. Close: reverse, 200ms.

**Accessibility**: Panel has `role="dialog"`, `aria-label="Notifications"`, `aria-modal="true"`. Focus trap active. Each notification: `role="listitem"`. Unread items: `aria-label` includes "unread". "Mark all as read" button: `aria-label="Mark all notifications as read"`.

---

### 15.2 Notification Preferences

**Layout**: Full page, organized by module. Each module has a section with toggle switches per notification type.

**EMPTY**: Never empty — all toggles shown with default states (most on).

**LOADING**: Toggle sections show skeleton shimmer. Module headers render immediately.

**ERROR**: "Could not load your notification preferences. [Retry]".

**SUCCESS (Saved)**: Inline banner: "Preferences saved." Auto-dismiss 3s. Each toggle saves immediately on click (optimistic update).

**ERROR (Toggle Failed)**: Toggle reverts to previous state with micro-shake animation. Toast: "Could not update this preference. Try again."

**PARTIAL**: Some module preferences load, others fail — failed modules show inline error.

**OFFLINE**: Cached preferences shown (read-only). Toggles disabled. "Notification preferences require an internet connection to update."

---

## 16. Shift Log

---

### 16.1 Shift Notes

**Layout**: Chronological note feed with shift dividers (showing shift start/end times and staff names).

**EMPTY**:

- Illustration: Line-art clipboard with a clock, accent blue on the clock.
- Headline: "Start your shift log"
- Description: "Shift notes keep every shift informed about what happened, what is ongoing, and what needs attention next."
- CTA: "Add Shift Note"

**LOADING**: Skeleton note cards (3) with shift divider skeletons.

**ERROR**: Standard error. "Could not load shift notes."

**SUCCESS (Note Added)**: New note slides in at the top of the feed (300ms slide-down, ease-out). Toast: "Shift note added."

**SUCCESS (Shift Started)**: Shift divider appears: "Shift started — [Staff Name] — [Time]". Previous shift section visually de-emphasized (reduced opacity).

**PARTIAL**: Notes load but staff names fail — show "Staff Member" placeholder.

**OFFLINE**: Cached notes. "Add Shift Note" works offline (queued). Shift start/end tracking works offline.

---

### 16.2 Handoff

**Layout**: Dedicated handoff view shown during shift transition. Summary of outgoing shift: key events, unresolved items, pass-on notes. Designed as a single scrollable page with clear sections.

```
┌──────────────────────────────────────────────────┐
│  Shift Handoff                                     │
│  [Outgoing Staff] → [Incoming Staff]               │
│  Shift: 7:00 AM — 3:00 PM, March 16, 2026         │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 12       │  │ 3        │  │ 2        │        │
│  │ Events   │  │ Packages │  │ Open     │        │
│  │ Logged   │  │ Pending  │  │ Issues   │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  FLAGGED FOR NEXT SHIFT                            │
│  ┌──────────────────────────────────────────────┐ │
│  │ ⚠ Unit 302 — water leak reported, plumber   │ │
│  │   arriving at 4 PM. Monitor for updates.     │ │
│  ├──────────────────────────────────────────────┤ │
│  │ ⚠ Lobby door — automatic closer not working.│ │
│  │   Prop door open during peak hours.          │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 📦 3 packages awaiting release for Unit 1205 │ │
│  │   Resident was notified at 10 AM.            │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  PASS-ON NOTES                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ "Elevator B is slow between floors 8-12.     │ │
│  │  Technician scheduled for Wednesday."         │ │
│  │  — Added by Sarah C. at 11:42 AM             │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  SHIFT SUMMARY                                     │
│  Events: 12 created, 8 closed                      │
│  Packages: 15 received, 12 released               │
│  Visitors: 7 logged, 7 checked out                 │
│  Incidents: 1 filed (minor — noise complaint)      │
│                                                    │
│     [ Add Final Note ]    [ End Shift ]            │
└──────────────────────────────────────────────────┘
```

**EMPTY**:

- Shift summary stats show zeros.
- Flagged section: "Nothing to hand off."
- Pass-on notes section: "No notes this shift."
- Headline: "Clean handoff"
- Description: "No flagged items from this shift. The incoming team is all caught up."
- CTA: "End Shift" (confirms clean handoff).
- Accessibility: "Shift handoff. No flagged items. No pass-on notes. End shift button available."

**LOADING**: Skeleton: 3 KPI cards, flagged items list (3 shimmer rows), pass-on notes section (2 shimmer blocks), summary stats (shimmer lines).

**ERROR**: "Could not load handoff summary. Review the shift log manually." CTA: "View Shift Log" / "End Shift Anyway". Warning: "Ending shift without reviewing the handoff summary means the incoming team may miss important information."

**SUCCESS (Shift Ended)**: Major success. Animated checkmark draws in. "Shift ended at 3:02 PM. Handoff complete to [Incoming Staff Name]. [X] items flagged for attention." CTAs: "Sign Out" / "View Summary" / "Stay Signed In". If user selects "Sign Out": redirects to login with fade transition.

**PARTIAL**: Handoff summary loads but some sections fail — show available data with "[Section] unavailable" placeholders. "End Shift" remains available — partial data should not block shift transition.

**OFFLINE**: Cached handoff data. "End Shift" works offline (queued). "Handoff confirmation will sync when you reconnect. The incoming staff member will see the handoff summary once connectivity is restored."

---

## Appendix A: State Transition Matrix

Quick reference showing which transitions are possible between states:

| From → To   |     Loading     |   Empty   | Loaded  | Error | Partial | Offline |
| ----------- | :-------------: | :-------: | :-----: | :---: | :-----: | :-----: |
| **Initial** |       Yes       |     —     |    —    |   —   |    —    |  Yes\*  |
| **Loading** |        —        |    Yes    |   Yes   |  Yes  |   Yes   |   Yes   |
| **Empty**   |     Yes\*\*     |     —     | Yes\*\* |   —   |    —    |   Yes   |
| **Loaded**  |     Yes\*\*     | Yes\*\*\* |    —    |  Yes  |   Yes   |   Yes   |
| **Error**   |   Yes (retry)   |     —     |    —    |   —   |    —    |   Yes   |
| **Partial** |   Yes (retry)   |     —     |   Yes   |  Yes  |    —    |   Yes   |
| **Offline** | Yes (reconnect) |     —     |    —    |   —   |    —    |    —    |

`*` If offline detected before first load, go directly to offline state.
`**` Reload triggered (refresh, navigation, or filter change).
`***` If all data is deleted/removed, transition to empty.

---

## Appendix B: Animation Timing Reference

| Animation                                          | Duration              | Easing      | Delay                     |
| -------------------------------------------------- | --------------------- | ----------- | ------------------------- |
| Skeleton shimmer                                   | 1500ms (loop)         | ease-in-out | 0                         |
| Fade in (content)                                  | 300ms                 | ease-out    | 0                         |
| Fade in (sequential: illustration → text → button) | 400ms / 300ms / 300ms | ease-out    | 0 / 200ms / 300ms         |
| Toast slide-in                                     | 300ms                 | ease-out    | 0                         |
| Toast slide-out                                    | 200ms                 | ease-in     | 0 (or auto-dismiss timer) |
| Shake (error)                                      | 400ms                 | ease-out    | 0                         |
| Checkmark draw-in                                  | 600ms                 | ease-out    | 0                         |
| Panel slide (notification)                         | 250ms                 | ease-out    | 0                         |
| Status badge color transition                      | 200ms                 | ease-in-out | 0                         |
| Offline banner slide                               | 300ms                 | ease-out    | 0                         |
| Sidebar collapse/expand                            | 200ms                 | ease-in-out | 0                         |
| Command palette scale-in                           | 200ms                 | ease-out    | 0                         |
| Card hover elevation                               | 150ms                 | ease        | 0                         |
| Tab content crossfade                              | 200ms                 | ease-in-out | 0                         |
| Button disabled → enabled                          | 150ms                 | ease        | 0                         |
| Progress bar                                       | continuous            | linear      | 0                         |

---

## Appendix C: Accessibility Checklist per State

Every screen state implementation must satisfy:

### Empty State

- [ ] Illustration has `role="img"` and descriptive `aria-label`
- [ ] Headline is `<h2>` (page title is `<h1>`)
- [ ] CTA button is keyboard focusable and has descriptive `aria-label`
- [ ] Screen reader announces: page context + empty status + available action

### Loading State

- [ ] Container has `aria-busy="true"`
- [ ] Screen reader announces "Loading [page name]"
- [ ] Skeleton elements have `aria-hidden="true"`
- [ ] On load complete: `aria-busy` removed, content announced

### Error State

- [ ] Error container has `role="alert"` and `aria-live="assertive"`
- [ ] Error message is plain language (no codes)
- [ ] Retry button has `aria-label="Retry loading [page name]"`
- [ ] Technical details have `aria-expanded` toggle
- [ ] Focus moves to error message or retry button

### Success State

- [ ] Toast has `role="status"` and `aria-live="polite"`
- [ ] Major success heading receives focus
- [ ] Dismiss button has `aria-label="Dismiss notification"`
- [ ] Auto-dismiss respects `prefers-reduced-motion`

### Partial State

- [ ] Failed sections have `role="alert"` and `aria-live="polite"`
- [ ] Each failed section has independent retry with descriptive `aria-label`
- [ ] Screen reader announces count of failed vs. loaded sections

### Offline State

- [ ] Banner has `role="alert"` and `aria-live="assertive"` (first appearance only)
- [ ] Disabled actions have `aria-disabled="true"` with `aria-describedby` tooltip
- [ ] Queued action count announced on change
- [ ] Reconnection announcement: "Back online. Syncing [X] queued actions."

---

## Appendix D: Reduced Motion Support

When `prefers-reduced-motion: reduce` is active:

| Standard Animation                 | Reduced Motion Alternative                   |
| ---------------------------------- | -------------------------------------------- |
| Skeleton shimmer (moving gradient) | Static `--bg-secondary` fill, no animation   |
| Fade in (content, sequential)      | Instant appear, no fade                      |
| Shake (error)                      | Red border flash (opacity 0.5 to 1.0, 200ms) |
| Checkmark draw-in                  | Instant checkmark appear                     |
| Toast slide-in/out                 | Instant appear/disappear                     |
| Panel slide                        | Instant appear/disappear                     |
| Status badge color transition      | Instant color change                         |
| Sidebar collapse/expand            | Instant width change                         |
| Card hover elevation               | No elevation change, background color only   |
| Offline banner slide               | Instant appear                               |

**Rule**: No animation exceeds 200ms in reduced motion mode. Most are replaced with instant state changes.

---

## Appendix E: Form Validation State Reference

Every form in the platform follows these validation state patterns. Individual screen sections
reference these patterns by name.

---

### E.1 Field-Level Validation States

**Untouched (Default)**:

- Border: `--border-subtle` (1px solid #E5E5EA).
- Label: `--text-primary`, Headline weight (17px, 600).
- No helper text visible unless field has permanent helper (e.g., character count).
- Accessibility: `aria-invalid="false"` (implicit). `aria-required="true"` if required.

**Focused**:

- Border: `--border-focus` (2px solid #0071E3). Transition: 150ms ease.
- Label: `--accent` color.
- Cursor active in field.
- Accessibility: field name announced, required status announced.

**Valid (After Blur)**:

- Border returns to `--border-subtle`.
- Optional: subtle green checkmark (16px) at right edge of field for critical fields (email, password).
- No additional helper text — absence of error IS the success signal.

**Error (After Blur or Submit)**:

```
  Email *
  ┌──────────────────────────────────────┐
  │ invalid-email                        │
  └──────────────────────────────────────┘
  ✕ Enter a valid email address
```

- Border: `--status-error` (2px solid #FF3B30). Transition: 150ms ease.
- Error text: below field, `--status-error` color, Callout size (14px).
- Error icon: `--status-error`, 14px, inline before error text.
- Field background: remains `--bg-primary` (no red tint — color is reserved for border and text).
- Accessibility: `aria-invalid="true"`. `aria-describedby` points to error message element.
  Screen reader announces: "[Field name], invalid. [Error message]."

**Disabled**:

- Background: `--bg-tertiary` (#E8E8ED).
- Text: `--text-tertiary` (#AEAEB2).
- Border: none.
- Cursor: not-allowed.
- Accessibility: `aria-disabled="true"`. Screen reader: "[Field name], disabled."
- Tooltip on hover (optional): explains why disabled (e.g., "This field is managed by your administrator").

**Read-Only**:

- Background: `--bg-secondary` (#F5F5F7).
- Text: `--text-primary` (full opacity, readable).
- Border: none.
- Cursor: default.
- No focus ring on click.
- Accessibility: `aria-readonly="true"`. Screen reader includes "read-only" in announcement.

---

### E.2 Field Type Specific States

**Text Input**:

- Character count (when limited): "42 / 4,000" — positioned at bottom-right of field.
- At 90% of limit: count turns `--status-warning`.
- At 100%: count turns `--status-error`. No more typing allowed. Announcement: "Character limit reached."

**Dropdown / Select**:

- Empty: placeholder text in `--text-tertiary`. "Select a category..."
- Loading options: "Loading..." with inline spinner inside dropdown.
- No matches (searchable dropdown): "No results for '[query]'. Try different keywords."
- Error: same border treatment as text fields.

**Date Picker**:

- Empty: placeholder "Select a date" in `--text-tertiary`.
- Invalid date range: "Select a date after [min date]." Red border.
- Past date when future required: "Select a future date."
- Calendar popover: current month visible, today highlighted with `--accent` dot.

**File Upload**:

```
  ┌──────────────────────────────────────────────────┐
  │                                                    │
  │       Drag files here or click to browse           │
  │       JPG, PNG, HEIC, PDF up to 4MB each          │
  │       (Callout, --text-tertiary)                   │
  │                                                    │
  └──────────────────────────────────────────────────┘
```

- Default: dashed border, `--border-subtle`, 2px dashed.
- Drag hover: border becomes `--accent`, background becomes `--accent-subtle`. "Drop to upload" text.
- Uploading: progress bar per file. Filename + percentage. Cancel button per file.
- Upload complete: file thumbnail (for images) or file icon + name. Remove (X) button.
- Upload error: red border on the file. "[Filename] failed. [Retry] or [Remove]."
- Wrong file type: "This file type is not supported. Upload JPG, PNG, HEIC, or PDF."
- File too large: "[Filename] exceeds the 4MB limit. Choose a smaller file."
- Accessibility: drop zone has `role="button"`, `aria-label="Upload files. Drag and drop or click to browse."`.
  Progress: `role="progressbar"`, `aria-valuenow="64"`, `aria-valuemin="0"`, `aria-valuemax="100"`.

**Toggle Switch**:

- Off: track is `--bg-tertiary`. Thumb is white.
- On: track is `--accent`. Thumb is white, shifted right.
- Transition: 200ms ease.
- Disabled: reduced opacity (0.5) on both states.
- Accessibility: `role="switch"`, `aria-checked="true/false"`.

**Radio Group**:

- Unselected: 20px circle, `--border-subtle` border, white fill.
- Selected: 20px circle, `--accent` border, `--accent` inner dot (8px).
- Disabled: reduced opacity (0.5).
- Accessibility: `role="radiogroup"` on container, `role="radio"` on each option.

**Checkbox**:

- Unchecked: 18px square, `--border-subtle` border, white fill, 4px radius.
- Checked: 18px square, `--accent` fill, white checkmark stroke.
- Indeterminate (for "select all" with partial selection): `--accent` fill, white dash.
- Disabled: reduced opacity (0.5).
- Accessibility: `role="checkbox"`, `aria-checked="true/false/mixed"`.

**Rich Text Editor**:

- Empty: "Start typing..." placeholder in body area.
- Focused: toolbar becomes fully opaque (from 0.8 to 1.0). Border: `--border-focus`.
- Character count in footer bar.
- Error: red border around entire editor area. Error text below.
- Accessibility: `role="textbox"`, `aria-multiline="true"`, `aria-label="[Field name] rich text editor"`.
  Toolbar buttons: `aria-label` for each (e.g., "Bold", "Insert link").

---

### E.3 Form-Level Validation Patterns

**Submit Attempt with Errors**:

1. Button shows brief loading (200ms), then returns to default state.
2. Error summary banner appears at top of form:
   ```
   ┌──────────────────────────────────────────────────┐
   │ ✕  3 fields need attention                       │
   │    • Category is required                         │
   │    • Description must be at least 20 characters   │
   │    • Unit number not found                        │
   └──────────────────────────────────────────────────┘
   ```
3. Form auto-scrolls to first error field.
4. First error field receives focus.
5. Each listed error is a link that scrolls to and focuses that field.
6. Banner background: `--status-error-bg`. Border-left: 3px `--status-error`.
7. Accessibility: `role="alert"`, `aria-live="assertive"`. Links within use `role="link"`.
   Announcement: "Form has 3 errors. [First error]. [Error field] is focused."

**Progressive Validation**:

- Required fields: validated on blur (when user leaves the field).
- Format fields (email, phone): validated on blur with debounce (500ms after typing stops).
- Cross-field validation (password match, date range): validated on blur of second field.
- Server-side validation (duplicate check): validated on blur with loading indicator in field.

**Unsaved Changes Warning**:

- If user navigates away from a form with unsaved changes:
  ```
  ┌──────────────────────────────────────────────────┐
  │  Unsaved changes                            ✕    │
  │                                                   │
  │  You have unsaved changes on this form.           │
  │  Leaving will discard your entries.               │
  │                                                   │
  │        [ Discard ]    [ Keep Editing ]            │
  └──────────────────────────────────────────────────┘
  ```
- Modal with two actions. "Keep Editing" returns to form. "Discard" navigates away.
- Accessibility: `role="alertdialog"`, `aria-label="Unsaved changes warning"`.
  Focus on "Keep Editing" button (safer default).

---

### E.4 Multi-Step Form States

Used by: Book Amenity (3 steps), Create User (if wizard mode), Emergency Broadcast (2 steps).

**Step Indicator**:

```
  ● Select Amenity ─── ○ Choose Time ─── ○ Confirm
  (completed: accent)  (current: accent)  (pending: tertiary)
```

- Completed steps: `--accent` filled circle + `--accent` label.
- Current step: `--accent` outlined circle + `--text-primary` label (bold).
- Pending steps: `--text-tertiary` outlined circle + `--text-tertiary` label.
- Connecting lines: `--border-subtle` for pending, `--accent` for completed.
- Accessibility: `role="progressbar"` or `role="list"` with `aria-current="step"` on active step.
  Screen reader: "Step 2 of 3: Choose Time."

**Step Navigation**:

- "Back" button (left, text link): returns to previous step. Data preserved.
- "Continue" button (right, primary): advances to next step. Validates current step first.
- "Cancel" button (text link, `--text-secondary`): triggers unsaved changes warning if data entered.

**Step Loading (Server Validation Between Steps)**:

- "Continue" button shows spinner + "Checking...".
- Current step content slightly dims (opacity 0.8).
- Error: returns to current step with error message. Content restores full opacity.

---

## Appendix F: Empty State Illustration Catalog

Every empty state has a unique illustration. This catalog ensures no duplicates and maintains
visual consistency across the platform.

| Screen                         | Illustration Subject                           | Accent Detail            |
| ------------------------------ | ---------------------------------------------- | ------------------------ |
| Event Feed                     | Clipboard with checkmark                       | Blue checkmark           |
| Package Feed                   | Mailbox with open door                         | Blue package peeking out |
| Visitor Log                    | Building entrance with approaching person      | Blue door                |
| Incident Reports               | Shield with checkmark                          | Blue checkmark           |
| Key/FOB Log                    | Key ring with two keys                         | Blue key                 |
| Pass-On Log                    | Notepad with pen                               | Blue pen tip             |
| Cleaning Log                   | Spray bottle                                   | Blue spray mist          |
| Notes                          | Sticky note                                    | Blue corner fold         |
| Parking Violations             | Car with parking sign                          | Blue P sign              |
| Maintenance Request List       | Crossed wrench and screwdriver                 | Blue bolt                |
| Amenity List View              | Calendar with clock                            | Blue clock hands         |
| Announcement List              | Megaphone                                      | Blue sound waves         |
| Unit List                      | Apartment building with doors                  | Blue door 101            |
| User List                      | Group of 3 silhouettes                         | Blue ID badge            |
| Shift Notes                    | Clipboard with clock                           | Blue clock               |
| Search No Results              | Magnifying glass over page                     | Blue lens                |
| Notification Panel             | (text only, no illustration)                   | —                        |
| Forgot Password Success        | Envelope with check                            | Blue check               |
| Account Locked                 | Lock                                           | Blue keyhole             |
| Unit — Residents Tab           | Single person outline                          | Blue name badge          |
| Unit — Packages Tab            | Small box                                      | Blue ribbon              |
| Unit — Maintenance Tab         | Wrench                                         | Blue handle              |
| Unit — Access Tab              | FOB card                                       | Blue indicator light     |
| Unit — Documents Tab           | Folder with papers                             | Blue folder tab          |
| Unit — Instructions Tab        | Speech bubble with info "i"                    | Blue info icon           |
| Resident — Emergency Contacts  | Phone with heart                               | Blue heart               |
| Resident — Vehicles            | Car outline                                    | Blue windshield          |
| Resident — Pets                | Paw print                                      | Blue pad                 |
| Resident — Activity            | Timeline with dots                             | Blue recent dot          |
| User — Activity Log            | Clock with checkmarks                          | Blue recent check        |
| User — Sessions                | Computer screen                                | Blue power dot           |
| Resident Portal — My Packages  | Mailbox (closed)                               | Blue flag up             |
| Resident Portal — My Requests  | Wrench with speech bubble                      | Blue bubble              |
| Resident Portal — My Bookings  | Calendar with star                             | Blue star                |
| Resident Portal — Community    | People with speech bubbles                     | Blue bubbles             |
| Calendar View                  | (no illustration — empty calendar grid itself) | —                        |
| Handoff                        | Relay baton being passed                       | Blue baton               |
| Governance — Pending Actions   | Checkmark list                                 | Blue top checkmark       |
| Governance — Upcoming Meetings | Table with chairs                              | Blue chair               |
| Governance — Recent Reports    | Document stack                                 | Blue top document        |
| System Dashboard — Properties  | Building outline                               | Blue roof                |
| System Dashboard — Activity    | Activity pulse line                            | Blue pulse               |

**Illustration Production Rules**:

- Vector SVG only. No raster images.
- Artboard: 120x120px.
- Stroke only — no fills except the single accent detail.
- Stroke weight: 1.5px.
- Stroke color: `--text-tertiary` (#AEAEB2).
- Accent color: `--accent` (#0071E3) — applied to exactly ONE element per illustration.
- Maximum 3 distinct objects per illustration.
- Style: geometric, minimal, no perspective/3D. Flat line art.
- Must be legible at 80px (smallest display size on mobile).
- Each SVG includes a `<title>` element matching the `aria-label` text.

---

## Appendix G: Offline Capability Matrix

Defines which actions work offline and which require connectivity, organized by module.

### Read Operations (Cached Data)

| Module               | Offline Readable | Cache Duration | Stale Warning |
| -------------------- | :--------------: | :------------: | :-----------: |
| Dashboard widgets    |       Yes        |     15 min     | After 15 min  |
| Event feed           |       Yes        |     30 min     | After 15 min  |
| Package feed         |       Yes        |     30 min     | After 15 min  |
| Visitor log          |       Yes        |     15 min     |  After 5 min  |
| Incident reports     |       Yes        |     60 min     | After 30 min  |
| Key/FOB log          |       Yes        |     60 min     | After 30 min  |
| Maintenance requests |       Yes        |     30 min     | After 15 min  |
| Amenity calendar     |       Yes        |     30 min     | After 15 min  |
| Announcements        |       Yes        |     60 min     | After 30 min  |
| Unit list/detail     |       Yes        |     60 min     | After 30 min  |
| User list/detail     |       Yes        |     60 min     | After 30 min  |
| Shift notes          |       Yes        |     15 min     |  After 5 min  |
| Notification panel   |       Yes        |     15 min     |  After 5 min  |
| Settings             |       Yes        |     24 hr      |  After 1 hr   |
| Search               |   Cached only    |     30 min     | Always shown  |

### Write Operations (Queueable vs. Blocked)

| Action                     | Offline Queue | Reason if Blocked                                            |
| -------------------------- | :-----------: | ------------------------------------------------------------ |
| Create event               |      Yes      | —                                                            |
| Log package                |      Yes      | —                                                            |
| Release package            |      No       | Requires server-side confirmation and signature verification |
| Log visitor                |      Yes      | —                                                            |
| Check out visitor          |      Yes      | —                                                            |
| File incident report       |      Yes      | (photos deferred)                                            |
| Sign out key/FOB           |      Yes      | (serial validation deferred)                                 |
| Return key/FOB             |      Yes      | —                                                            |
| Add pass-on note           |      Yes      | —                                                            |
| Log cleaning               |      Yes      | —                                                            |
| Add note                   |      Yes      | —                                                            |
| Report parking violation   |      Yes      | —                                                            |
| Create maintenance request |      Yes      | (photos deferred)                                            |
| Update maintenance status  |      Yes      | —                                                            |
| Book amenity               |      Yes      | (availability unconfirmed)                                   |
| Cancel amenity booking     |      Yes      | —                                                            |
| Create announcement        |      No       | Requires multi-channel delivery infrastructure               |
| Send emergency broadcast   |      No       | Critical safety — must confirm delivery                      |
| Create user                |      No       | Requires email validation and welcome email                  |
| Modify user role           |      No       | Security-critical — requires server authorization            |
| Update settings            |      No       | Affects all users — must propagate immediately               |
| Add shift note             |      Yes      | —                                                            |
| Start/end shift            |      Yes      | —                                                            |

### Queue Behavior

- Maximum queue size: 50 actions. At 50, new offline actions are blocked with: "Offline queue is full. Reconnect to sync before adding more."
- Queue is stored in IndexedDB with encryption at rest.
- On reconnect: queue processes in FIFO order. Each action shows status: Syncing → Synced / Failed.
- Failed actions remain in queue with "Retry" option. User can also discard individual failed actions.
- Conflict resolution: if server data has changed (e.g., package already released by another user), the queued action fails with explanation: "This package was already released by [other user] at [time]. Your action has been discarded."

---

## Appendix H: Screen Reader Announcement Catalog

Complete list of screen reader announcements for every state transition, organized by trigger.

### Page Load Announcements

| Page               | Announcement                                                          |
| ------------------ | --------------------------------------------------------------------- |
| Login              | "Sign in to Concierge"                                                |
| 2FA                | "Verify your identity. Enter 6-digit code."                           |
| Forgot Password    | "Reset your password. Enter your email."                              |
| Reset Password     | "Create a new password."                                              |
| Account Locked     | "Account temporarily locked. Try again in [time]."                    |
| Dashboard          | "[Role] dashboard loaded. [X] items need attention."                  |
| Event Feed         | "Event feed. [X] events." / "Event feed. No events recorded."         |
| Package Feed       | "Package feed. [X] packages." / "Package feed. No packages recorded." |
| Any Create Form    | "[Create/Log] [item type] form. [X] required fields."                 |
| Any Detail Page    | "[Item type] detail. [Title/Reference]. Status: [status]."            |
| Any List Page      | "[Item type] list. [X] items." / "[Item type] list. No items."        |
| Settings           | "Settings. [Tab name] tab active."                                    |
| Search Results     | "Search results for '[query]'. [X] results in [Y] categories."        |
| Notification Panel | "Notifications. [X] unread."                                          |

### State Transition Announcements

| Transition             | Announcement                                                |
| ---------------------- | ----------------------------------------------------------- |
| Loading started        | "Loading [page name], please wait."                         |
| Loading complete       | "[Page name] loaded. [Context-specific summary]."           |
| Error occurred         | "Error. [Plain language description]. [Available action]."  |
| Toast success          | "[Action] successful. [Summary]."                           |
| Major success          | "[Action] complete. [Summary]. [Available next actions]."   |
| Partial load           | "[Page name] loaded. [X] of [Y] sections unavailable."      |
| Gone offline           | "You are offline. Showing cached data."                     |
| Back online            | "Back online. Syncing [X] queued actions."                  |
| Action queued          | "[Action] queued. Will sync when you reconnect."            |
| Queue synced           | "All queued actions synced successfully."                   |
| Queue item failed      | "Queued action failed: [description]. Retry available."     |
| Form validation error  | "[X] errors found. [First error]. [Field name] is focused." |
| Field validation error | "[Field name], invalid. [Error message]."                   |
| Unsaved changes        | "Warning: unsaved changes. Discard or keep editing?"        |

---

---

## Appendix I: Toast Notification Stacking and Priority

When multiple toasts fire simultaneously or in rapid succession:

### Stacking Rules

```
┌─────────────────────────────────────────┐  ← Newest (z-index highest)
│  ✓  Package logged — PKG-0043     ✕    │
└─────────────────────────────────────────┘
         ↕ 8px gap
┌─────────────────────────────────────────┐
│  ✓  Package logged — PKG-0042     ✕    │
└─────────────────────────────────────────┘
         ↕ 8px gap
┌─────────────────────────────────────────┐  ← Oldest (will dismiss first)
│  ✓  Visitor checked out           ✕    │
└─────────────────────────────────────────┘
```

- Position: top-right corner, 24px from top and right edges.
- Stack direction: downward. Newest on top.
- Maximum visible: 3 toasts. If a 4th arrives, the oldest auto-dismisses immediately (slide-out animation, 150ms).
- Each toast has its own 3-second auto-dismiss timer. Timers are independent.
- Hover on any toast pauses ALL toast timers (prevents jarring dismissals while user is reading).
- Mouse leave resumes all timers from where they paused.

### Priority Levels

| Priority | Left Accent Color  |          Auto-Dismiss           |                  Sound                  |
| -------- | ------------------ | :-----------------------------: | :-------------------------------------: |
| Error    | `--status-error`   | No (persistent until dismissed) | Error chime (optional, user preference) |
| Warning  | `--status-warning` |            5 seconds            |                  None                   |
| Success  | `--status-success` |            3 seconds            |                  None                   |
| Info     | `--accent`         |            3 seconds            |                  None                   |

- Error toasts always appear on top of the stack, regardless of timing.
- Error toasts push other toasts down.
- If 3 error toasts exist, no other toasts display until an error is dismissed.

### Toast Content Rules

- Maximum 2 lines of text. If content is longer, truncate with "..." and make toast clickable to navigate to detail.
- Line 1: Action summary (bold, Headline weight). "Package logged successfully"
- Line 2: Reference or detail (regular, Callout size). "Reference: PKG-20260316-0043"
- No icons larger than 20px.
- No action buttons inside toasts (except dismiss X). Actions belong on the page.
- Exception: "Undo" link for reversible actions (e.g., "Note deleted. Undo"). Undo link: `--accent`, Callout size. Undo window: 5 seconds (toast persists for 5s when undo is available).

### Accessibility

- Toast container: `role="region"`, `aria-label="Notifications"`, `aria-live="polite"`.
- Error toasts: `aria-live="assertive"`.
- Each toast: `role="status"`.
- Dismiss button: `aria-label="Dismiss"`.
- Toasts do not steal focus. Screen reader announces content without interrupting current task.
- Keyboard: `F6` cycles focus to toast region. `Escape` dismisses focused toast. `Tab` cycles between toasts.

---

## Appendix J: Confirmation Dialog Patterns

All destructive or irreversible actions require a confirmation dialog. These patterns standardize
the confirmation experience across the platform.

### Standard Confirmation (Reversible Actions)

```
┌──────────────────────────────────────────────────┐
│  Cancel this reservation?                    ✕    │
│                                                    │
│  Party Room — March 20, 2026, 6:00 PM             │
│  Booked by Sarah Chen, Unit 1205                   │
│                                                    │
│  The resident will be notified of the              │
│  cancellation.                                     │
│                                                    │
│         [ Keep Reservation ]    [ Cancel It ]      │
│         (secondary)             (--status-error)   │
└──────────────────────────────────────────────────┘
```

- Headline: question format. "[Action] this [item]?"
- Context: 1-2 lines identifying the specific item.
- Consequence: what will happen as a result.
- Primary action (destructive): right side, `--status-error` background, white text.
- Safe action: left side, secondary button style (outline).
- Focus: on safe action button (left) by default.
- Accessibility: `role="alertdialog"`, `aria-label="Confirm [action]"`. Focus trap active.

### High-Stakes Confirmation (Irreversible Actions)

Used for: deleting users, sending emergency broadcasts, bulk operations.

```
┌──────────────────────────────────────────────────┐
│  Deactivate this user?                       ✕    │
│                                                    │
│  John Smith — Property Manager                     │
│  This will immediately revoke their access         │
│  to the platform.                                  │
│                                                    │
│  Type "DEACTIVATE" to confirm:                     │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│         [ Cancel ]    [ Deactivate User ]          │
│                       (disabled until typed)        │
└──────────────────────────────────────────────────┘
```

- Requires typing a confirmation word (shown in monospace, uppercase).
- Destructive button disabled until exact text entered.
- Case-insensitive matching.
- Accessibility: instruction text includes `aria-label` on input: "Type DEACTIVATE to confirm. Destructive action."

### Bulk Operation Confirmation

```
┌──────────────────────────────────────────────────┐
│  Release 12 packages?                        ✕    │
│                                                    │
│  This will mark 12 packages as released and        │
│  notify 8 residents.                               │
│                                                    │
│  ▸ View affected packages (expandable list)        │
│                                                    │
│         [ Cancel ]    [ Release All ]              │
└──────────────────────────────────────────────────┘
```

- Count prominently displayed in headline.
- Expandable list to review affected items.
- Accessibility: "Confirm releasing 12 packages. 8 residents will be notified. View affected packages, expandable. Cancel or release all."

---

## 17. Marketing Pages

---

### 17.1 Landing Page

**Layout**: Full-width sections stacked vertically — Hero, Features Grid, Testimonials, Pricing Preview, CTA. No sidebar. Top nav is transparent over hero, switching to white on scroll. Max content width: 1200px centered.

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]                    Features  Pricing  Login  [CTA]   │
│  (transparent nav, becomes white + shadow on scroll)         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         Building management,                                 │
│         reimagined.                                          │
│         (Title 1, 56px, 700, --text-primary)                 │
│                                                              │
│         Everything your front desk, security team,           │
│         and residents need — in one place.                   │
│         (Body, 20px, 400, --text-secondary)                  │
│                                                              │
│         [ Start Free Trial ]    [ Book a Demo ]              │
│         (--accent, 52px h)      (outline, 52px h)            │
│                                                              │
│         ┌────────────────────────────────────────┐           │
│         │       Product screenshot / hero         │           │
│         │       image (lazy-loaded, WebP)         │           │
│         └────────────────────────────────────────┘           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  FEATURES GRID (3 columns, 24px gap)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Icon     │  │ Icon     │  │ Icon     │                   │
│  │ Title    │  │ Title    │  │ Title    │                   │
│  │ Desc     │  │ Desc     │  │ Desc     │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Icon     │  │ Icon     │  │ Icon     │                   │
│  │ Title    │  │ Title    │  │ Title    │                   │
│  │ Desc     │  │ Desc     │  │ Desc     │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
├──────────────────────────────────────────────────────────────┤
│  TESTIMONIALS (carousel, 3 cards visible)                    │
│  ◀  "Quote text..." — Name, Property  │  ...  │  ...   ▶   │
├──────────────────────────────────────────────────────────────┤
│  FINAL CTA                                                   │
│         Ready to modernize your building?                    │
│         [ Start Free Trial ]                                 │
├──────────────────────────────────────────────────────────────┤
│  Footer: Links │ Legal │ Social │ © 2026                     │
└──────────────────────────────────────────────────────────────┘
```

**DEFAULT**: All sections visible. Hero image lazy-loads with a blurred placeholder (LQIP). Testimonial carousel auto-advances every 6s (paused on hover or focus). Nav CTA uses `--accent` background.

**MOBILE RESPONSIVE** (< 768px):

- Nav collapses to hamburger menu. CTA button remains visible outside hamburger.
- Hero headline drops to 36px. Subheadline to 16px.
- Features grid: 1 column. Each card is full-width stacked.
- Testimonials: 1 card visible, swipe-enabled, dot indicators below.
- Pricing preview: cards stack vertically. Toggle remains above cards.
- Accessibility: hamburger button has `aria-expanded`, `aria-controls="mobile-nav"`. Carousel has `role="region"`, `aria-label="Customer testimonials"`, `aria-roledescription="carousel"`.

**REDUCED MOTION** (`prefers-reduced-motion: reduce`):

- Testimonial auto-advance disabled. Manual navigation only.
- Hero image loads without blur-up transition — instant swap.
- Scroll animations (feature card fade-in on scroll) disabled — all cards visible immediately.
- Nav background change on scroll is instant (no transition).

**i18n (fr-CA)**:

- All static strings loaded from locale file. Hero headline, subheadline, CTAs, feature titles/descriptions, footer links.
- `lang="fr-CA"` on `<html>`. Font: same family, no font swap needed.
- Button text may be longer (French is ~20% longer) — buttons use `min-width` not fixed `width`.
- Testimonials load locale-appropriate quotes. Fallback: English quotes with "(Translated)" badge.
- Date formats: `DD MMMM YYYY`. Currency: `$X,XX` with space before dollar sign.
- Accessibility: `aria-label` values localized. Screen reader announces language context.

---

### 17.2 Pricing Page

**Layout**: Page header, Monthly/Annual toggle, 3-tier comparison cards (Starter / Professional / Enterprise), feature checklist below.

```
┌──────────────────────────────────────────────────────────────┐
│  Simple, transparent pricing                                 │
│  (Title 2, 32px, 600, --text-primary, centered)              │
│                                                              │
│          [ Monthly ]  ●───○  [ Annual — Save 20% ]           │
│          (toggle, --accent active side)                      │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   STARTER      │  │  PROFESSIONAL  │  │   ENTERPRISE   │ │
│  │                │  │  ★ Most Popular│  │                │ │
│  │   $X/unit/mo   │  │  $X/unit/mo    │  │  Custom        │ │
│  │                │  │                │  │                │ │
│  │  ✓ Feature A   │  │  ✓ Feature A   │  │  ✓ Everything  │ │
│  │  ✓ Feature B   │  │  ✓ Feature B   │  │  ✓ Dedicated   │ │
│  │  ✕ Feature C   │  │  ✓ Feature C   │  │    support     │ │
│  │  ✕ Feature D   │  │  ✓ Feature D   │  │  ✓ Custom SLA  │ │
│  │                │  │                │  │                │ │
│  │ [Start Trial]  │  │ [Start Trial]  │  │ [Contact Us]   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                              │
│  FEATURE COMPARISON TABLE                                    │
│  ┌──────────────┬──────┬──────┬──────┐                      │
│  │ Feature      │Start │ Pro  │ Ent  │                      │
│  ├──────────────┼──────┼──────┼──────┤                      │
│  │ Units        │ 100  │ 500  │  ∞   │                      │
│  │ Storage      │ 5GB  │ 50GB │  ∞   │                      │
│  │ API Access   │  ✕   │  ✓   │  ✓   │                      │
│  └──────────────┴──────┴──────┴──────┘                      │
└──────────────────────────────────────────────────────────────┘
```

**DEFAULT**: Annual toggle selected by default (shows savings). Professional card has `--accent` top border (4px) and "Most Popular" badge. Enterprise shows "Contact Us" instead of price.

**MOBILE RESPONSIVE** (< 768px):

- Cards stack vertically: Professional first (most popular), then Starter, then Enterprise.
- Feature comparison table becomes a card-per-plan layout — each plan's features listed as a checklist card.
- Toggle remains sticky at top of pricing section.

**REDUCED MOTION**: Toggle switch snaps instantly (no slide animation). Card hover elevation change is instant.

**i18n (fr-CA)**: Prices formatted as `X $/unit/mois`. Feature labels and plan names from locale file. "Most Popular" becomes "Le plus populaire". CTA labels localized.

**Accessibility**: Toggle has `role="switch"`, `aria-checked`, `aria-label="Billing period. Currently [monthly/annual]."`. Plan cards use `role="region"`, `aria-labelledby` linking to plan name heading. Included features: `aria-label="Included"`. Excluded features: `aria-label="Not included"`. Feature comparison table has proper `<th>` headers with `scope="col"`.

---

### 17.3 Features Page

**Layout**: Tab bar showing 5 role personas (Concierge, Security, Manager, Resident, Board). Each tab reveals a role-specific feature showcase with screenshots and descriptions.

**DEFAULT**: First tab (Concierge) active. Each tab panel shows: hero screenshot, 4-6 feature cards with icons, descriptions, and mini-screenshots. Tab bar is sticky below the nav on scroll.

**MOBILE RESPONSIVE** (< 768px):

- Tab bar becomes a horizontal scroll with pill buttons. Active pill has `--accent` background.
- Feature cards stack in a single column.

**REDUCED MOTION**: Tab content swap is instant (no crossfade). Screenshot carousels disabled.

**i18n (fr-CA)**: Tab labels, feature titles, descriptions from locale file. Screenshots can optionally be locale-specific (French UI screenshots if available; English fallback acceptable).

**Accessibility**: Tab bar uses `role="tablist"`. Each tab: `role="tab"`, `aria-selected`, `aria-controls`. Tab panels: `role="tabpanel"`, `aria-labelledby`. Arrow keys navigate between tabs. Tab content announced on selection change via `aria-live="polite"` region.

---

## 18. Login & Property Routing

---

### 18.1 Email-First Login

**Layout**: Centered card (440px wide, vertically centered) on a white page. Property logo above the card (if arriving via vanity URL). Progressive steps within the same card — no page reload between steps.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ┌──────────────────┐                      │
│                    │  [Concierge Logo]│                      │
│                    └──────────────────┘                      │
│                                                              │
│              ┌────────────────────────────┐                  │
│              │  Sign in                   │                  │
│              │                            │                  │
│              │  Email address             │                  │
│              │  ┌──────────────────────┐  │                  │
│              │  │                      │  │                  │
│              │  └──────────────────────┘  │                  │
│              │                            │                  │
│              │  [ Continue ]              │                  │
│              │  (--accent, full width)    │                  │
│              │                            │                  │
│              │  Don't have an account?    │                  │
│              │  Contact your property     │                  │
│              │  manager.                  │                  │
│              └────────────────────────────┘                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Step 1 — Email Entry**:

- **EMPTY**: Email field focused on page load. "Continue" button disabled until valid email format entered.
- **LOADING**: "Continue" button shows spinner + "Checking...". Email field becomes read-only.
- **ERROR (Invalid Email)**: Inline error below field: "Enter a valid email address." Field border: `--status-error`. Shake animation (400ms).
- **ERROR (No Account)**: "We could not find an account with this email. Contact your property manager to get set up."
- **SUCCESS**: Transitions to Step 2 (property picker or password, depending on account).

**Step 2 — Property Picker** (multi-property users only):

```
┌────────────────────────────────┐
│  Select a property             │
│  jane@email.com                │
│  (--text-secondary, 14px)      │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🏢 Waterfront Towers    │  │
│  │    123 Lakeshore Blvd    │  │
│  ├──────────────────────────┤  │
│  │ 🏢 Parkview Condos      │  │
│  │    456 Queen St W        │  │
│  ├──────────────────────────┤  │
│  │ 🏢 Riverside Place      │  │
│  │    789 King St E         │  │
│  └──────────────────────────┘  │
│                                │
│  ◀ Use a different email       │
└────────────────────────────────┘
```

- Each property is a clickable card. Hover: `--bg-secondary`. Selected: `--accent` left border.
- Selecting a property transitions to Step 3 (password).
- Accessibility: property list uses `role="listbox"`, each property `role="option"`. Arrow keys navigate. Enter selects.

**Step 3 — Password**:

- **EMPTY**: Password field focused. "Sign In" disabled until password entered. "Forgot password?" link below.
- **LOADING**: "Sign In" shows spinner. Fields read-only.
- **ERROR (Wrong Password)**: "Incorrect password. Try again or reset your password." Attempt counter shown after 3 failures: "2 attempts remaining before account lock."
- **ERROR (Account Locked)**: Card content replaced with lock icon. "Account locked. Too many failed attempts. Check your email for unlock instructions or contact your property manager." No retry button — must use email link. Accessibility: `role="alert"`, message announced immediately.
- **SUCCESS**: Transitions to Step 4 (2FA) or directly to dashboard.

**Step 4 — Two-Factor Authentication**:

```
┌────────────────────────────────┐
│  Two-factor authentication     │
│                                │
│  Enter the 6-digit code from   │
│  your authenticator app.       │
│                                │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│  │  │ │  │ │  │ │  │ │  │ │  ││
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│
│  (6 individual digit inputs)   │
│                                │
│  [ Verify ]                    │
│                                │
│  Lost access? Use a backup     │
│  code instead.                 │
└────────────────────────────────┘
```

- **EMPTY**: First digit input focused. Digits auto-advance on entry. Paste support for all 6 digits.
- **LOADING**: "Verify" shows spinner. Inputs become read-only.
- **ERROR (Invalid Code)**: Inputs shake (400ms). Clear all fields. Re-focus first input. "Invalid code. Try again." shown below inputs in `--status-error`.
- **ERROR (Expired Session)**: "Your session has expired. Please sign in again." CTA: "Start Over". Redirects to Step 1.
- **SUCCESS**: Redirect to dashboard with fade transition.
- Accessibility: digit group has `role="group"`, `aria-label="6-digit verification code"`. Each input: `aria-label="Digit [N] of 6"`. `inputmode="numeric"`, `autocomplete="one-time-code"`.

**OFFLINE**: "Sign in requires an internet connection." All fields disabled. Retry checks connectivity every 10s. Banner at top: `--status-warning` background.

---

### 18.2 Property Code Entry

**Layout**: Centered card. Used when a user arrives at the generic login page without a vanity URL and does not know their email. 6-character alphanumeric code input.

```
┌────────────────────────────────┐
│  Enter your property code      │
│                                │
│  Your property manager         │
│  provided a 6-character code.  │
│                                │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│  │  │ │  │ │  │ │  │ │  │ │  ││
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│
│  (uppercase, alphanumeric)     │
│                                │
│  [ Continue ]                  │
│                                │
│  Don't have a code?            │
│  Sign in with email instead.   │
└────────────────────────────────┘
```

- **EMPTY**: First character input focused. Auto-uppercase. Auto-advance on entry.
- **LOADING**: "Continue" shows spinner. Inputs read-only.
- **ERROR (Invalid Code)**: "Property code not found. Check the code and try again." Inputs shake, clear, re-focus first.
- **SUCCESS**: Redirects to vanity login page for that property (logo, colors applied).
- **OFFLINE**: Same as 18.1 offline state.
- Accessibility: input group `role="group"`, `aria-label="6-character property code"`. Each input: `aria-label="Character [N] of 6"`. `autocomplete="off"`.

---

### 18.3 Vanity URL Login

**Layout**: Same centered card as 18.1, but with property branding: property logo replaces Concierge logo, optional background color or image behind the card (set by property admin).

**DEFAULT**: Property name shown as heading. "Powered by Concierge" small text at card footer. Login flow is identical to 18.1 Steps 1-4 but skips property picker (property already determined by URL).

**ERROR (Invalid Vanity URL)**: If `propertyname.concierge.app` does not resolve to a property: "This property page does not exist. Check the URL or sign in at the main page." CTA: "Go to Concierge Login". Concierge logo shown (not property logo).

**ERROR (Property Deactivated)**: "This property's account is no longer active. Contact your property manager." No login form shown. Concierge logo. `--status-warning` banner.

**Accessibility**: Property logo has `alt="[Property Name] logo"`. If custom background color is used, contrast ratio of card text against background is enforced server-side (minimum 4.5:1).

---

## 19. Onboarding Wizard

---

### 19.1 Horizontal Stepper

**Layout**: Full-page wizard. Top section: 8-step horizontal stepper. Below: step content area. Bottom: navigation buttons (Back / Continue / Skip).

```
┌──────────────────────────────────────────────────────────────┐
│  Set up your property                                        │
│  Step 3 of 8: Add Units                                      │
│                                                              │
│  ● ─── ● ─── ◉ ─── ○ ─── ○ ─── ○ ─── ○ ─── ○               │
│  Prop   Roles  Units  Resid  Amenity Access  Comms  Go-Live  │
│  (done) (done) (curr) (pend) (pend)  (pend)  (pend) (pend)  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │          [ Step Content Area ]                       │    │
│  │          (varies per step — see 19.2-19.5)           │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  [ ◀ Back ]                  [ Skip ]    [ Continue ▶ ]      │
│  (text link)                (secondary)  (--accent, primary) │
└──────────────────────────────────────────────────────────────┘
```

**Step States**:

| State            | Visual       | Stepper Icon                  | Label Style                                  |
| ---------------- | ------------ | ----------------------------- | -------------------------------------------- |
| Complete         | Green check  | `●` filled `--status-success` | `--text-primary`, 500 weight                 |
| In Progress      | Accent ring  | `◉` ring `--accent`           | `--text-primary`, 600 weight                 |
| Validation Error | Red ring     | `◉` ring `--status-error`     | `--status-error`, 600 weight                 |
| Pending          | Grey outline | `○` outline `--text-tertiary` | `--text-tertiary`, 400 weight                |
| Skipped          | Grey dash    | `–` `--text-tertiary`         | `--text-tertiary`, 400 weight, strikethrough |

**EMPTY (First Visit)**: Step 1 is In Progress. Steps 2-8 are Pending. "Back" hidden on Step 1. Progress: "0% complete" shown below stepper as subtle text.

**LOADING (Step Transition)**: "Continue" shows spinner (300ms max). Step content area crossfades (200ms). New step content fades in.

**ERROR (Validation)**: Step icon turns red ring. Error banner at top of step content: "[N] fields need attention." Fields with errors highlighted. "Continue" remains enabled but re-validates on click. Accessibility: `role="alert"` on error banner. Focus moves to first error field.

**SUCCESS (Step Complete)**: Step icon transitions to green check (200ms). Connecting line fills with `--accent`. Next step becomes In Progress. Progress percentage updates.

**PARTIAL (Some Steps Skipped)**: Skipped steps show dash icon. Summary on Go-Live step shows which steps were skipped with "Complete now" links.

**OFFLINE**: "Continue" disabled. "This step requires an internet connection." Data entered in forms is preserved locally. On reconnect, form data restored.

**Accessibility**: Stepper uses `role="list"`. Each step: `role="listitem"` with `aria-current="step"` on active. Screen reader: "Step 3 of 8, Add Units. Steps 1 and 2 complete. Steps 4 through 8 pending." Navigation buttons: "Go back to Roles", "Skip Add Units", "Continue to Residents."

---

### 19.2 CSV Import (within Onboarding Steps)

**Layout**: Used in Units and Residents steps. File upload zone, validation preview table, import progress.

**FILE UPLOAD**:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│         ┌──────────────────────┐                   │
│         │    ↑                  │                   │
│         │  Drop CSV file here   │                   │
│         │  or click to browse   │                   │
│         │                       │                   │
│         │  (.csv, max 10MB)     │                   │
│         └──────────────────────┘                   │
│         (dashed border, --border-subtle)            │
│                                                    │
│  [ Download Template ]  (text link, --accent)       │
│                                                    │
│  Or: [ Add Manually ] to enter one by one           │
│                                                    │
└──────────────────────────────────────────────────┘
```

- **EMPTY**: Drop zone with dashed border. Template download link. Manual entry fallback link.
- **LOADING (File Selected)**: Drop zone shows file name + spinner. "Validating 342 rows..."
- **DRAG OVER**: Drop zone border becomes solid `--accent`. Background: `--bg-secondary`. Icon arrows animate upward.

**VALIDATING**:

- Progress bar: "Validating row 150 of 342..."
- Cancel link available: "Cancel validation".

**VALIDATION ERRORS**:

```
┌──────────────────────────────────────────────────┐
│  Validation complete: 12 errors in 342 rows       │
│                                                    │
│  ┌──────┬──────────┬───────────────────────────┐  │
│  │ Row  │ Field    │ Error                     │  │
│  ├──────┼──────────┼───────────────────────────┤  │
│  │  15  │ Unit #   │ Duplicate: "101" already  │  │
│  │      │          │ exists                     │  │
│  │  23  │ Email    │ Invalid format             │  │
│  │  47  │ Floor    │ Required field is empty     │  │
│  │  ... │          │                            │  │
│  └──────┴──────────┴───────────────────────────┘  │
│                                                    │
│  [ Download Error Report ]   [ Import Valid Rows ] │
│  (CSV with errors only)      (330 of 342 rows)     │
│                                                    │
│  Or: [ Upload Corrected File ]                     │
└──────────────────────────────────────────────────┘
```

- Error table sortable by row number. Each error links to the specific row.
- "Import Valid Rows" imports only passing rows. "Download Error Report" gives a CSV of failed rows with error descriptions.
- Accessibility: error table has `role="table"`, `aria-label="CSV validation errors, 12 errors found"`. Each row: `role="row"`. Summary announced: "12 errors found in 342 rows. 330 rows are valid."

**IMPORT PROGRESS**:

- Progress bar: "Importing 150 of 330 units..."
- Items appear in a live feed below as they import.
- Cancel not available during import (data integrity).

**IMPORT COMPLETE**:

- Success banner: "330 units imported successfully. 12 rows skipped due to errors."
- CTA: "Review Imported Data" or "Continue to Next Step".
- Accessibility: `role="status"`, announced: "Import complete. 330 units imported. 12 skipped."

**OFFLINE**: File selection works. Validation works locally for format checks. Server-side validation (duplicate checks) deferred. "Some validations require an internet connection and will run when you continue."

---

### 19.3 Auto-Generate Units

**Layout**: Alternative to CSV import for the Units step. Input parameters form, preview grid, confirm button.

```
┌──────────────────────────────────────────────────┐
│  Auto-generate units                              │
│                                                    │
│  Floors    ┌──────┐  to  ┌──────┐                 │
│            │  1   │      │  30  │                  │
│            └──────┘      └──────┘                  │
│  Units per floor  ┌──────┐                         │
│                   │  12  │                          │
│                   └──────┘                          │
│  Numbering:  ○ Sequential (101, 102...)             │
│              ● Floor-based (101, 102... 201, 202...)│
│  Include:    ☑ Parking levels  ☑ Penthouse level    │
│                                                    │
│  Preview: 360 units will be created                 │
│  ┌──────────────────────────────────────────────┐  │
│  │ 101 102 103 104 105 106 107 108 109 110 111 112│ │
│  │ 201 202 203 204 205 206 207 208 209 210 211 212│ │
│  │ ...                                            │ │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [ Generate 360 Units ]                            │
└──────────────────────────────────────────────────┘
```

- **EMPTY**: Floor range and units-per-floor fields empty. Preview hidden. "Generate" disabled.
- **IN PROGRESS**: As user fills in parameters, preview updates live (debounced 300ms). Unit count shown.
- **VALIDATION ERROR**: "Starting floor must be less than ending floor." Inline under the field.
- **LOADING (Generating)**: "Generate" shows spinner + "Creating 360 units...". Progress bar.
- **SUCCESS**: "360 units created. You can edit individual units later." Grid shows created units with checkmarks.
- **OFFLINE**: Parameter entry works. Preview works (client-side calculation). "Generate" disabled: "Creating units requires an internet connection."
- Accessibility: preview grid has `role="grid"`, `aria-label="Unit number preview, 360 units"`. Live count announced via `aria-live="polite"`: "360 units will be created."

---

### 19.4 Go-Live Step

**Layout**: Final step (Step 8). Summary review of all configuration. Completion checklist. Welcome email toggle. Activate button.

```
┌──────────────────────────────────────────────────┐
│  Ready to go live                                  │
│                                                    │
│  SETUP SUMMARY                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ✓ Property Details         Complete           │  │
│  │ ✓ Roles & Permissions      3 roles            │  │
│  │ ✓ Units                    360 units           │  │
│  │ ✓ Residents                312 imported        │  │
│  │ – Amenities                Skipped             │  │
│  │   [ Complete Now ]                             │  │
│  │ ✓ Access Control           4 entry points      │  │
│  │ ✓ Communication            Email configured    │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  WELCOME EMAIL                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ☑ Send welcome email to 312 residents         │  │
│  │   Includes: login link, getting started guide │  │
│  │   [ Preview Email ]                           │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ⚠ Skipped steps can be completed later from       │
│    Settings, but residents will not have access     │
│    to those features until configured.              │
│                                                    │
│  [ ◀ Back ]           [ Activate Property ▶ ]      │
│                       (--accent, prominent)         │
└──────────────────────────────────────────────────┘
```

- **EMPTY**: Checklist populates from wizard state. Skipped steps show dash + "Complete Now" link.
- **LOADING (Activating)**: "Activate Property" shows "Activating..." with spinner. Progress: "Setting up 360 units... Sending 312 welcome emails..."
- **ERROR**: "Activation failed. Your data is saved — try again." CTA: "Retry Activation". Details expandable.
- **SUCCESS**: Major success with animation. Checkmark draws in. "Your property is live. 312 residents have been invited." CTAs: "Go to Dashboard" / "View Setup Guide".
- **PARTIAL**: Property activated but welcome emails partially sent. "Property is live. 280 of 312 welcome emails sent. [Retry remaining]."
- **OFFLINE**: "Activate Property" disabled. "Activation requires an internet connection."
- Accessibility: checklist uses `role="list"`. Each item: `role="listitem"` with status indicated by `aria-label` ("Units: complete, 360 units" / "Amenities: skipped"). "Activate Property" button: `aria-label="Activate property and send welcome emails to 312 residents"`.

---

## 20. Demo & Training Mode

---

### 20.1 Demo Mode Badge

**Layout**: Persistent badge in the top-right of the header bar, always visible on every page during a demo session.

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard  Events  ...       [ DEMO MODE 🟠 ] [👤] │
│  ────────────────────────────────────────────────────────── │
│  (normal app content below)                                  │
└──────────────────────────────────────────────────────────────┘
```

- Badge: `--status-warning` background (#FF9500), white text, 12px bold uppercase, `border-radius: 4px`, `padding: 4px 12px`.
- Badge is non-dismissable. Clicking it opens the Demo Control Panel (see 20.3).
- Accessibility: badge has `role="status"`, `aria-label="Demo mode active. Click to open demo controls."`.

**DEFAULT**: Badge reads "DEMO MODE". Subtle pulse animation on first load (3 cycles, then static).

**DEMO EXPIRED**: Badge turns `--status-error` (#FF3B30) background. Text: "DEMO EXPIRED". Clicking opens expiry dialog (see 20.6). All interactive elements below the header are disabled with 50% opacity overlay.

---

### 20.2 Training Mode Badge

**Layout**: Same position and size as demo badge but yellow.

- Badge: `#FFD60A` background, `--text-primary` text (dark), 12px bold uppercase.
- Badge text: "TRAINING MODE".
- Clicking opens Training Progress Dashboard (see 20.7).
- Accessibility: `role="status"`, `aria-label="Training mode active. Click to view training progress."`.

---

### 20.3 Role Switcher Overlay

**Layout**: Full-screen semi-transparent overlay (backdrop: rgba(0,0,0,0.5)) with a centered card containing 5 persona cards.

```
┌──────────────────────────────────────────────────────────────┐
│  (backdrop: 50% black overlay)                               │
│                                                              │
│         ┌──────────────────────────────────────┐             │
│         │  Switch Role                    ✕    │             │
│         │  Experience the platform as:         │             │
│         │                                      │             │
│         │  ┌────────┐  ┌────────┐  ┌────────┐ │             │
│         │  │ 🖥      │  │ 🛡      │  │ 📋     │ │             │
│         │  │Concierge│  │Security │  │Manager │ │             │
│         │  │Front    │  │Guard    │  │Property│ │             │
│         │  │Desk     │  │         │  │Mgmt    │ │             │
│         │  └────────┘  └────────┘  └────────┘ │             │
│         │  ┌────────┐  ┌────────┐              │             │
│         │  │ 🏠      │  │ 📊     │              │             │
│         │  │Resident │  │Board   │              │             │
│         │  │Owner /  │  │Member  │              │             │
│         │  │Tenant   │  │        │              │             │
│         │  └────────┘  └────────┘              │             │
│         │                                      │             │
│         │  Current role: Concierge (active)    │             │
│         └──────────────────────────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Each persona card: 120x120px, white background, subtle border, icon (line-art), role title, role subtitle.
- Active role: `--accent` border (2px), `--accent` background tint. Others: `--border-subtle`.
- Hover: card lifts (`box-shadow` elevation), border becomes `--accent`.
- Click: instant role switch. Overlay closes. Dashboard and navigation rebuild for the new role (300ms crossfade).
- Accessibility: overlay is `role="dialog"`, `aria-modal="true"`, `aria-label="Switch demo role"`. Cards: `role="radiogroup"`. Each card: `role="radio"`, `aria-checked`. Focus trap within overlay. Escape closes.

---

### 20.4 Demo Reset Confirmation

```
┌──────────────────────────────────────────────────┐
│  Reset demo data?                           ✕    │
│                                                    │
│  This will restore all demo data to its original   │
│  state. Any changes you made during this session   │
│  (events, packages, notes) will be removed.        │
│                                                    │
│  This cannot be undone.                            │
│                                                    │
│         [ Cancel ]    [ Reset Demo Data ]          │
│                       (--status-error bg)           │
└──────────────────────────────────────────────────┘
```

- "Reset Demo Data" is destructive — uses `--status-error` styling.
- **LOADING**: Button shows "Resetting..." with spinner. Modal stays open.
- **SUCCESS**: Modal closes. Toast: "Demo data has been reset." Dashboard reloads with fresh data.
- **ERROR**: "Could not reset demo data. Try again." Retry available within modal.
- Accessibility: `role="alertdialog"`, `aria-label="Confirm demo data reset"`. Focus on "Cancel" (safer default).

---

### 20.5 Demo Customization

**Layout**: Settings panel (accessible from Demo Control Panel) where the salesperson can upload a prospect's logo and enter their property name, so the demo feels personalized.

- **EMPTY**: Logo placeholder (grey circle with building icon). Property name: "Demo Property".
- **SUCCESS (Customized)**: Prospect logo appears in the header and login page. Property name replaces "Demo Property" across the UI.
- **ERROR (Upload Failed)**: "Logo upload failed. Try a smaller file (max 2MB, PNG or SVG)." Inline error.
- Accessibility: logo upload has `aria-label="Upload prospect logo"`. Property name input: `aria-label="Prospect property name"`.

---

### 20.6 Demo Expired State

**Layout**: Full-page overlay blocking all interaction.

```
┌──────────────────────────────────────────────────┐
│                                                    │
│         ┌──────────────┐                           │
│         │  Clock icon   │                           │
│         │  (line-art,   │                           │
│         │  --text-tert) │                           │
│         └──────────────┘                           │
│                                                    │
│         This demo session has expired              │
│         (Title 2, 22px, 600)                       │
│                                                    │
│         Demo sessions last 14 days. Contact        │
│         your sales representative to extend         │
│         or start a new demo.                       │
│         (Body, 15px, --text-secondary)             │
│                                                    │
│         [ Request Extension ]  [ Start New Demo ]  │
│         (--accent outline)     (--accent filled)   │
│                                                    │
└──────────────────────────────────────────────────┘
```

- Blocks all navigation. Only the two CTAs and a sign-out link are interactive.
- Accessibility: `role="alert"`. "Demo session expired. Request extension or start a new demo."

---

### 20.7 Training Progress Dashboard

**Layout**: Slide-out panel (500px wide, from right) showing which features each trainee has interacted with.

- **EMPTY**: "No training activity yet. Start exploring the platform and your progress will appear here."
- **LOADING**: Skeleton: trainee name header + 6 module progress bar skeletons.
- **SUCCESS**: Trainee name at top. Modules listed with progress bars (percentage of features used). Modules: Events, Packages, Security, Maintenance, Amenities, Communication. Each module expandable to show individual feature checkmarks.
- **ERROR**: "Could not load training progress. [Retry]."
- **OFFLINE**: Cached progress shown. "Training progress will update when you reconnect."
- Accessibility: panel is `role="dialog"`, `aria-label="Training progress"`. Each module progress: `role="progressbar"`, `aria-valuenow`, `aria-valuemax`. Expandable sections: `aria-expanded`.

---

## 21. Billing Dashboard

---

### 21.1 Plan Overview

**Layout**: Top section of billing page. Current plan badge, usage meters, and quick action buttons.

```
┌──────────────────────────────────────────────────────────────┐
│  Billing & Subscription                                      │
│                                                              │
│  CURRENT PLAN                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Professional Plan              [ Change Plan ]       │    │
│  │  $3.50/unit/month · 171 units · Billed annually       │    │
│  │  Next billing date: April 1, 2026                     │    │
│  │                                                       │    │
│  │  USAGE                                                │    │
│  │  Units      ████████████████░░░░  171 / 500           │    │
│  │  Storage    ████████░░░░░░░░░░░░  12GB / 50GB         │    │
│  │  API Calls  ██░░░░░░░░░░░░░░░░░░  2.1k / 50k         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- **EMPTY**: Never empty — always shows current plan even if no usage.
- **LOADING**: Skeleton: plan card with shimmer on plan name, price, and usage bars.
- **ERROR**: "Could not load billing information. [Retry]." Warning: "If you believe there is a billing issue, contact support."
- **SUCCESS**: All meters display with color coding: green (< 70%), `--status-warning` (70-90%), `--status-error` (> 90%).
- **PARTIAL**: Plan info loads but usage metrics fail. Plan card shown without meters. "Usage data temporarily unavailable."
- **OFFLINE**: Cached plan info shown. "Billing information may not be current."
- Accessibility: each usage meter has `role="meter"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="Units used: 171 of 500"`. Plan badge: `aria-label="Current plan: Professional"`.

---

### 21.2 Plan Comparison

**Layout**: 3-tier card layout, identical structure to pricing page (Section 17.2) but shown within the billing dashboard context. Current plan highlighted.

- **DEFAULT**: Current plan card has `--accent` border and "Current Plan" badge. Downgrade options show "Downgrade" in `--text-secondary`. Upgrade options show "Upgrade" in `--accent`.
- **LOADING**: Card skeletons (3 cards with shimmer).
- **ERROR**: "Could not load plan options. [Retry]."
- Accessibility: current plan card has `aria-current="true"`. Action buttons: `aria-label="Upgrade to Enterprise plan"` or `aria-label="Downgrade to Starter plan"`.

---

### 21.3 Upgrade / Downgrade Modal

```
┌──────────────────────────────────────────────────┐
│  Change to Professional Plan               ✕    │
│                                                    │
│  CURRENT: Starter ($2/unit/mo)                     │
│  NEW: Professional ($3.50/unit/mo)                 │
│                                                    │
│  PRORATION PREVIEW                                 │
│  ┌──────────────────────────────────────────────┐ │
│  │  Remaining on Starter (15 days): -$51.30     │ │
│  │  Professional for 15 days:       +$89.78     │ │
│  │  ──────────────────────────────────────       │ │
│  │  Amount due today:               $38.48      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ✓ New features available immediately              │
│  ✓ No service interruption                         │
│                                                    │
│       [ Cancel ]    [ Confirm Change ]             │
│                     (--accent)                      │
└──────────────────────────────────────────────────┘
```

- **LOADING**: "Calculating proration..." shimmer in the preview area.
- **ERROR**: "Could not calculate plan change. [Retry]." Modal stays open.
- **SUCCESS**: Modal closes. Toast: "Plan changed to Professional. New features are now available."
- **DOWNGRADE WARNING** (if downgrading): additional warning box: "Downgrading will disable: [list of features]. Data is preserved but inaccessible until you upgrade again." `--status-warning` background.
- Accessibility: `role="dialog"`, `aria-label="Change subscription plan"`. Proration table: `role="table"`. Focus on "Cancel" (safer default for financial action).

---

### 21.4 Invoice List

**Layout**: Paginated table of past invoices.

```
┌──────────────────────────────────────────────────────────────┐
│  Invoices                              [ Export All (CSV) ]  │
│                                                              │
│  ┌──────────┬───────────┬───────────┬────────┬─────────────┐ │
│  │ Date     │ Amount    │ Plan      │ Status │ Actions     │ │
│  ├──────────┼───────────┼───────────┼────────┼─────────────┤ │
│  │ Mar 1    │ $598.50   │ Profess.  │ ✓ Paid │ [Download]  │ │
│  │ Feb 1    │ $598.50   │ Profess.  │ ✓ Paid │ [Download]  │ │
│  │ Jan 1    │ $342.00   │ Starter   │ ✓ Paid │ [Download]  │ │
│  └──────────┴───────────┴───────────┴────────┴─────────────┘ │
│                                                              │
│  Showing 1-10 of 24        [ ◀ ]  1  2  3  [ ▶ ]           │
└──────────────────────────────────────────────────────────────┘
```

- **EMPTY**: "No invoices yet. Your first invoice will appear after your billing cycle begins."
- **LOADING**: Skeleton table rows (5 rows with shimmer).
- **ERROR**: "Could not load invoices. [Retry]."
- **SUCCESS**: Table with sortable columns. Download generates PDF. Status badges: "Paid" (green), "Pending" (yellow), "Failed" (red), "Refunded" (grey).
- **OFFLINE**: Cached invoices shown (if previously loaded). Download disabled: "PDF download requires an internet connection."
- Accessibility: table has proper `<th>` with `scope="col"`. Status badges: `aria-label="Payment status: paid"`. Download: `aria-label="Download invoice for March 1, 2026"`. Pagination: `role="navigation"`, `aria-label="Invoice pages"`.

---

### 21.5 Payment Method Management

**Layout**: Card display of saved payment methods with add/remove actions. Stripe Elements embedded for card entry.

- **EMPTY**: "No payment method on file. Add a card to continue your subscription." CTA: "Add Payment Method".
- **LOADING**: Skeleton card placeholder.
- **ERROR (Load)**: "Could not load payment methods. [Retry]."
- **SUCCESS (Card Added)**: New card appears in list. Toast: "Payment method added."
- **SUCCESS (Card Removed)**: Card fades out (200ms). Toast: "Payment method removed."
- **ERROR (Card Declined)**: Inline error within Stripe Elements: "Card was declined. Try a different card." Error styling from Stripe's embedded UI, consistent with our `--status-error` color.
- **PARTIAL**: Card list loads but default card indicator fails. Cards shown without default badge.
- **OFFLINE**: Cached card info shown (last 4 digits, expiry only — no sensitive data cached). "Add" and "Remove" disabled.
- Accessibility: each card: `role="listitem"`, `aria-label="Visa ending in 4242, expires 12/2028. Default payment method."`. Remove button: `aria-label="Remove Visa ending in 4242"`. Stripe Elements provides its own accessibility — do not override.

---

### 21.6 Failed Payment / Dunning States

**Layout**: Progressive severity banners shown at the top of the billing page (and as a persistent banner site-wide during grace period).

**GRACE PERIOD** (Days 1-7 after failure):

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Payment failed. Update your payment method by March 23   │
│    to avoid service interruption. [ Update Payment ]         │
│  (--status-warning background, site-wide banner)             │
└──────────────────────────────────────────────────────────────┘
```

- Banner is dismissable per session but reappears on next login.
- "Update Payment" links to payment method management.

**PAYMENT RETRY** (automatic, Days 1, 3, 7):

- Subtle inline status on billing page: "Retrying payment... Next retry: March 18."
- If retry succeeds: banner disappears. Toast: "Payment processed successfully."

**ACCOUNT SUSPENSION** (Day 14+):

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│         ┌──────────────┐                                     │
│         │  Lock icon    │                                     │
│         └──────────────┘                                     │
│                                                              │
│         Your account has been suspended                      │
│         (Title 2, 22px, 600, --status-error)                 │
│                                                              │
│         We were unable to process your payment               │
│         after multiple attempts. Update your payment         │
│         method to restore access.                            │
│                                                              │
│         Your data is safe and will be preserved              │
│         for 90 days.                                         │
│                                                              │
│         [ Update Payment Method ]  [ Contact Support ]       │
│         (--accent filled)          (outline)                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Blocks all app access. Only billing page and support contact accessible.
- Accessibility: `role="alert"`. "Account suspended due to failed payment. Update payment method to restore access. Data preserved for 90 days."

---

### 21.7 Trial States

**TRIAL BANNER** (shown site-wide during trial):

```
┌──────────────────────────────────────────────────────────────┐
│  🎉 You are on a 14-day free trial. 9 days remaining.       │
│     [ Choose a Plan ]                                        │
│  (--accent-light background, --accent text)                  │
└──────────────────────────────────────────────────────────────┘
```

- Dismissable per session. Reappears daily.

**TRIAL EXPIRING SOON** (last 3 days):

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠ Your trial ends in 2 days. Choose a plan to keep         │
│    your data and continue using the platform. [ Choose Plan ]│
│  (--status-warning background)                               │
└──────────────────────────────────────────────────────────────┘
```

- Not dismissable during last 3 days. Persistent.

**TRIAL EXPIRED**:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│         ┌──────────────┐                           │
│         │  Calendar     │                           │
│         │  icon with X  │                           │
│         └──────────────┘                           │
│                                                    │
│         Your free trial has ended                  │
│         (Title 2, 22px, 600)                       │
│                                                    │
│         Choose a plan to continue. All your        │
│         data from the trial is preserved.          │
│                                                    │
│         [ View Plans ]    [ Export My Data ]        │
│         (--accent)        (outline)                │
│                                                    │
└──────────────────────────────────────────────────┘
```

- Full-page block. Only plan selection and data export accessible.
- "Export My Data" generates a ZIP of all property data (CSV + documents). Ensures no vendor lock-in anxiety.
- Accessibility: `role="alert"`. "Free trial ended. Choose a plan to continue. Data is preserved. Export option available."

---

## 22. Help Center

---

### 22.1 Help Drawer

**Layout**: Slide-out panel from the right (440px wide), triggered by "?" icon in the header or `?` keyboard shortcut. Shows contextual help articles relevant to the current page.

```
┌──────────────────────────────────────────────────┐
│  Help                                       ✕    │
│  ───────────────────────────────────────────── │
│                                                    │
│  RELATED TO THIS PAGE                              │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📄 How to log a new package                   │ │
│  │    Learn the package intake workflow...        │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 📄 Understanding package statuses             │ │
│  │    Received, notified, released, returned...  │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 📄 Printing package labels                    │ │
│  │    Set up your label printer and formats...   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────┐          │
│  │ 🔍 Search all help articles...       │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  [ Browse Knowledge Base ]                         │
│  [ Contact Support ] (v2)                          │
│                                                    │
└──────────────────────────────────────────────────┘
```

- **EMPTY (No Articles for Page)**: "No help articles for this page yet. Browse the knowledge base or contact support." Illustration: line-art open book with question mark, accent blue on question mark.
- **LOADING**: Skeleton: 3 article card skeletons (icon + 2 text lines each).
- **ERROR**: "Could not load help articles. [Retry]."
- **SUCCESS**: Contextual articles listed. Click opens article within the drawer (push navigation, "Back" button appears).
- **PARTIAL**: Some articles load, others fail. Show loaded articles with "Some articles could not be loaded" note at bottom.
- **OFFLINE**: Cached articles shown if previously viewed. "Search and new articles require an internet connection."

**Animation**: Panel slides in from right, 250ms, ease-out. Backdrop fades in, 200ms. Close: reverse, 200ms. Same timing as Notification Panel (Section 15).

**Accessibility**: `role="dialog"`, `aria-modal="true"`, `aria-label="Help panel"`. Focus trap active. Articles: `role="list"`. Each article: `role="listitem"`, `aria-label="Article: [title]"`. Search input: `aria-label="Search help articles"`. Close button: `aria-label="Close help panel"`.

---

### 22.2 Knowledge Base

**Layout**: Full-page view with category sidebar (left, 240px) and article list (right). Top search bar.

```
┌──────────────────────────────────────────────────────────────┐
│  Knowledge Base                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🔍 Search articles...                                │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────┐  ┌──────────────────────────────────────────┐  │
│  │CATEGORIES│  │  Getting Started (8 articles)            │  │
│  │          │  │  ┌────────────────────────────────────┐  │  │
│  │ All      │  │  │ 📄 Setting up your property         │  │  │
│  │ Getting  │  │  │    First-time setup guide...        │  │  │
│  │ Started  │  │  ├────────────────────────────────────┤  │  │
│  │ Packages │  │  │ 📄 Managing your first package      │  │  │
│  │ Security │  │  │    Package lifecycle explained...   │  │  │
│  │ Amenities│  │  ├────────────────────────────────────┤  │  │
│  │ Mainten. │  │  │ 📄 Setting up amenity bookings      │  │  │
│  │ Reports  │  │  │    Calendar, rules, approvals...   │  │  │
│  │ Billing  │  │  └────────────────────────────────────┘  │  │
│  └──────────┘  │                                          │  │
│                │  Showing 1-10 of 8     [ ◀ ]  1  [ ▶ ]  │  │
│                └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- **EMPTY**: "No articles published yet. Check back soon." (Admin-facing: "No articles yet. Create your first article in Settings > Help Center.")
- **LOADING**: Category sidebar skeleton (6 items). Article list skeleton (5 items).
- **ERROR**: "Could not load the knowledge base. [Retry]."
- **SUCCESS (Search)**: Results highlight matching terms in yellow (`--status-warning-bg`). Result count: "12 results for 'package label'". Empty search: "No articles found for '[query]'. Try different keywords."
- **PARTIAL**: Categories load but article counts fail. Categories shown without counts.
- **OFFLINE**: Cached articles browsable. Search limited to cached content. "Showing cached articles. Connect to the internet for the latest content."
- Accessibility: category sidebar: `role="navigation"`, `aria-label="Article categories"`. Active category: `aria-current="true"`. Search: `role="search"`. Results: `role="list"`, `aria-label="Search results, 12 articles found"`.

---

### 22.3 Article View

**Layout**: Centered content column (720px max-width). MDX-rendered content with table of contents sidebar on wide screens (> 1200px).

- **LOADING**: Skeleton: title bar + 8 body text line skeletons + sidebar TOC skeleton.
- **ERROR**: "Could not load this article. [Retry]." Back link to knowledge base.
- **SUCCESS**: Article renders with: heading hierarchy (h2, h3), code blocks, images (lazy-loaded), video embeds (iframe, lazy-loaded), callout boxes (tip, warning, note), and step-by-step numbered lists. Related articles shown at bottom (3 cards).
- **PARTIAL**: Article content loads but video embeds fail. Placeholder: "Video could not be loaded. [Open in new tab]."
- **OFFLINE**: Cached article shown if previously viewed. Videos show "Requires internet" placeholder. Images show cached versions or alt text. "This article was cached on [date]. It may not reflect the latest changes."

**Video Embed States**:

- **LOADING**: Grey placeholder with play button skeleton. Aspect ratio preserved (16:9).
- **READY**: Thumbnail with centered play button overlay. Click loads the player.
- **ERROR**: "Video unavailable. [Open in new tab]." Fallback link.
- Accessibility: video embed: `role="region"`, `aria-label="Video: [title]"`. Related articles: `role="complementary"`, `aria-label="Related articles"`. TOC sidebar: `role="navigation"`, `aria-label="Table of contents"`. Active TOC heading highlighted and tracked on scroll.

---

### 22.4 Support Ticket Form (v2)

**Layout**: Multi-step form within the Help Drawer or as a standalone page.

```
┌──────────────────────────────────────────────────┐
│  Contact Support                                   │
│                                                    │
│  Category *                                        │
│  ┌──────────────────────────────────────┐          │
│  │ Select a category...             ▼   │          │
│  └──────────────────────────────────────┘          │
│  (Billing, Technical, Feature Request, Other)      │
│                                                    │
│  Subject *                                         │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Description *                                     │
│  ┌──────────────────────────────────────┐          │
│  │                                      │          │
│  │                              0/2,000 │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Attachments (optional)                            │
│  [ + Add Files ] (max 3 files, 5MB each)           │
│                                                    │
│  [ Cancel ]    [ Submit Ticket ]                   │
│                (--accent)                           │
└──────────────────────────────────────────────────┘
```

- **EMPTY**: Category dropdown focused. All fields empty. "Submit" disabled.
- **LOADING (Submitting)**: "Submit" shows spinner + "Submitting...". Fields read-only.
- **ERROR (Validation)**: Inline errors on required fields. Category, Subject, Description required. Description min 20 characters.
- **ERROR (Submit Failed)**: "Could not submit your ticket. Your message has been saved as a draft. [Retry]."
- **SUCCESS**: "Ticket #1234 submitted. We will respond within 24 hours. Check your email for updates." CTA: "View My Tickets" / "Submit Another".
- **OFFLINE**: Form available. "Submit" disabled. "Submitting a ticket requires an internet connection. Your draft will be saved."
- Accessibility: form has `aria-label="Support ticket form"`. Category select: `aria-required="true"`. Character counter: `aria-live="polite"`, updated every 100 characters. Attachment area: `aria-label="File attachments, optional, maximum 3 files"`.

**Ticket List** (within Help Drawer or standalone):

- Table: Ticket #, Subject, Status (Open/In Progress/Resolved/Closed), Last Updated.
- **EMPTY**: "No support tickets. Need help? Create a ticket."
- **LOADING**: Skeleton table (3 rows).
- Accessibility: table with `<th scope="col">`. Status badges with `aria-label`.

**Ticket Detail**:

- Conversation thread: alternating messages from user and support team.
- Reply form at bottom with same styling as ticket creation (description + attachments).
- Status badge at top. Timeline of status changes shown.
- **LOADING**: Skeleton conversation (3 message bubbles).
- **ERROR**: "Could not load ticket details. [Retry]."
- Accessibility: conversation uses `role="log"`, `aria-label="Support conversation"`. Each message: `role="article"`, `aria-label="Message from [name] at [time]"`.

---

### 22.5 Keyboard Shortcut Reference

**Layout**: Full-screen overlay triggered by pressing `?` (when no text input is focused). Centered card with categorized shortcut list.

```
┌──────────────────────────────────────────────────────────────┐
│  (backdrop: 50% black overlay)                               │
│                                                              │
│       ┌──────────────────────────────────────────────┐       │
│       │  Keyboard Shortcuts                     ✕    │       │
│       │  ──────────────────────────────────────────  │       │
│       │                                              │       │
│       │  NAVIGATION                                  │       │
│       │  g then d    Go to Dashboard                 │       │
│       │  g then e    Go to Event Log                 │       │
│       │  g then p    Go to Packages                  │       │
│       │  g then s    Go to Settings                  │       │
│       │                                              │       │
│       │  ACTIONS                                     │       │
│       │  n            New event / entry              │       │
│       │  /            Focus search bar               │       │
│       │  ?            Show this reference             │       │
│       │  Esc          Close panel / modal            │       │
│       │                                              │       │
│       │  LISTS                                       │       │
│       │  j / k        Move up / down in list         │       │
│       │  Enter        Open selected item             │       │
│       │  x            Select / deselect item         │       │
│       │                                              │       │
│       │  Press Esc to close                          │       │
│       └──────────────────────────────────────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- **DEFAULT**: Overlay with categorized shortcuts. Keys shown in `<kbd>` styled elements (monospace, `--bg-secondary` background, 1px border, `border-radius: 4px`, `padding: 2px 6px`).
- Escape closes the overlay. Clicking outside closes it.
- Shortcuts are role-aware: Security sees security-specific shortcuts, managers see management shortcuts.
- **REDUCED MOTION**: Overlay appears instantly (no fade).
- Accessibility: overlay is `role="dialog"`, `aria-modal="true"`, `aria-label="Keyboard shortcuts reference"`. Focus trap active. Each shortcut row: key in `<kbd>` with `aria-label` describing the full shortcut. Categories: `role="group"`, `aria-label="[Category name] shortcuts"`. Close: Escape key or close button.

---

_Document version: 1.1_
_Last updated: 2026-03-16_
_Total screens covered: 95+_
_Total states defined: 570+_
_Total appendices: 10_
