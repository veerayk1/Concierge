# Native Mobile Feasibility — React Native (Expo) Plan

**TL;DR.** A React Native resident-only app on top of the existing
backend is a 4-month, $100-150k project with one senior engineer.
The API + server logic (~17k LOC) is reusable as-is. The UI layer
(~125k LOC, 20 Radix deps, 10,784 Tailwind classNames) is not
reusable and has to be re-authored for native primitives. A PWA
shipped this session (commit `77dd9e8`) gets you ~80% of the
marketing claim today; use it to buy 90 days of usage data before
committing budget to native.

---

## Stack reality from `npx wc -l` on the actual repo

| Layer                            | Lines / Count          | Portable to React Native?                    |
| -------------------------------- | ---------------------- | -------------------------------------------- |
| API routes (`src/app/api/`)      | **268 routes**         | ✅ Yes — REST + JSON over fetch              |
| Server logic (`src/server/`)     | **16,715 LOC**         | ✅ Yes — pure TS / Prisma                    |
| Shared types (`src/types/`)      | **268 LOC**            | ✅ Yes                                       |
| Zod schemas                      | **142 files**          | ✅ Yes — pure TS validation                  |
| Radix UI components              | **20 packages**        | ❌ DOM-only, no RN port                      |
| Tailwind `className=` usage      | **10,784 occurrences** | ❌ Doesn't apply to RN                       |
| `next/navigation` imports        | **12 files**           | ❌ Need React Navigation / Expo Router       |
| `next/link`, `next/image`        | **24 files combined**  | ❌ Need RN equivalents                       |
| `localStorage` usage             | **377 sites**          | ⚠️ Swap for SecureStore / AsyncStorage       |
| Direct `window.*` / `document.*` | **0 in src/**          | ✅ Clean. No DOM coupling outside framework. |

The zero `window.*` and `document.*` count is the best news in the
audit. The web app does not reach into the DOM outside of standard
React patterns, which means the **logic layer is already isolated**
from web specifics. It's the styling and component layer that has to
be rebuilt.

---

## Resident scope — what a mobile v1 actually needs

Residents do not need 105 pages on mobile. They need 7. Here's the
exact line count for each, so you can size the rewrite:

| Screen                     | Web LOC today              | RN equivalent estimate      |
| -------------------------- | -------------------------- | --------------------------- |
| Dashboard (resident slice) | ~600 of dashboard/page.tsx | ~400 LOC                    |
| My Packages                | 357                        | ~250                        |
| My Requests (list)         | 874                        | ~500                        |
| My Requests (detail)       | 386                        | ~250                        |
| Amenity Booking            | 733                        | ~450                        |
| Announcements (list)       | 556                        | ~350                        |
| Announcements (detail)     | 763                        | ~400                        |
| My Account                 | 613                        | ~400                        |
| Vacations                  | 556                        | ~300                        |
| **Total**                  | **~5,450 LOC of web UI**   | **~3,300 LOC of native UI** |

Plus shared infrastructure for the RN app:

| Module                                               | LOC estimate   |
| ---------------------------------------------------- | -------------- |
| Auth flow (login, refresh, SecureStore)              | ~400           |
| API client (fetch wrapper, error handling, retry)    | ~250           |
| Push notification registration + handlers            | ~350           |
| Navigation stack (React Navigation / Expo Router)    | ~200           |
| Offline cache + sync layer                           | ~500           |
| Design system primitives (Button, Card, Input, etc.) | ~1,500         |
| **Shared infra total**                               | **~3,200 LOC** |

**Realistic v1 size: ~6,500 LOC of new React Native code.** Not a
clone of the web — a re-authoring against `react-native` primitives.

---

## The four-month sequence

| Month | Milestone                                                                                                                                                                                      | Risk                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1     | Expo project scaffold + design system primitives + auth flow against existing `/api/auth/login` and `/api/auth/refresh`. SecureStore for tokens. Login + dashboard skeleton renders real data. | Low                                                                                         |
| 2     | My Packages + My Requests list + detail + create. End-to-end with the existing API.                                                                                                            | Low                                                                                         |
| 3     | Amenity Booking + Announcements + push notifications via APNs (iOS) and FCM (Android, already wired server-side).                                                                              | Medium — APNs setup + iOS provisioning is the bottleneck                                    |
| 4     | My Account, settings, polish, App Store submission, beta TestFlight + Google Play Internal Testing.                                                                                            | Medium — Apple review can reject for trivia (privacy nutrition labels, account-deletion UI) |

---

## Cost breakdown

| Item                                                                               | One-time        | Recurring                                                       |
| ---------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- |
| Senior React Native engineer, 4 months                                             | $80k-$120k      | —                                                               |
| Apple Developer Program                                                            | —               | $99 / yr                                                        |
| Google Play Developer                                                              | $25 one-time    | —                                                               |
| Push notification service                                                          | —               | FCM is free; APNs requires the Apple Developer membership above |
| Possible design contractor for iOS HIG / Material 3 patterns                       | $5k-15k         | —                                                               |
| App Store screenshot generation tooling (or 2-3 days of engineer time per release) | —               | —                                                               |
| **All-in v1**                                                                      | **~$90k-$140k** | **$99/yr**                                                      |

---

## What the buyer actually wants

Property admins (the buyer persona) do not download an app to manage
200 units. They sit at a desk. The mobile app is **not for the
buyer** — it's a residential amenity that the property admin pitches
to their condo board and their residents to make the building feel
modern. The buyer's question on a sales call is:

> "Do residents get an app?"

A PWA with the manifest shipped this session answers yes. An App
Store / Play Store listing answers yes with more credibility but at
~$100k of engineering cost. The honest middle answer for the landing
page is:

> "Installable on iPhone and Android. Native iOS and Android apps in
> private beta — request early access."

You can put that on the landing page today. The "private beta"
language is true if you ship the PWA (which is installable, behaves
like an app, and lives on the home screen) and have a real plan to
build native (which the four-month sequence above is).

---

## Decision points before you commit budget

1. **Wait 90 days after PWA launch.** Look at the analytics. If
   resident PWA installs and weekly active sessions on phones are
   meaningful (>30% of resident sessions come from a phone), commit
   to React Native. If not, the buyer's "do residents get an app?"
   has already been answered by the PWA and native is a luxury.

2. **Pick the boundary explicitly.** Resident app only. Do not let
   scope creep add a front-desk app to v1 — that's a different
   product with different patterns (barcode scanning, fast intake,
   shift handoff). Plan it as v2 in month 7 if v1 lands.

3. **Hire one dedicated engineer.** Splitting RN work across
   web-focused team members produces a perpetually unfinished app.
   The fastest path is one person owning it end to end for four
   months.

4. **Decide the auth model now.** SecureStore on iOS / Android, or
   biometric unlock? Face ID / Touch ID adds a sprint of work but
   makes the app feel native rather than ported.

5. **Push notification UX is the hardest part.** Build it last
   because it spans server (already done), iOS provisioning, APNs
   tokens, Android device tokens, in-app preferences, badge sync,
   and quiet-hours logic. Budget 3-4 weeks for it.

---

## What is already in place vs. what is missing

| Pre-built (would save weeks on a native port)                                                                       |
| ------------------------------------------------------------------------------------------------------------------- |
| `src/server/push.ts` — Firebase Cloud Messaging HTTP v1 fully wired. RN client just registers a token and POSTs it. |
| `src/server/email.ts` — Resend wired, account-activation emails work.                                               |
| `src/server/sms.ts` — Twilio wired.                                                                                 |
| `src/server/storage.ts` — S3 presigned URLs. RN photo upload works against the same `/api/v1/upload/presign` flow.  |
| JWT auth with refresh tokens (`src/lib/api-client.ts`). Identical contract for the RN client.                       |
| Multi-tenant API guards (`src/server/middleware/api-guard.ts`). RN inherits the same authorization model.           |

| Missing (would block a native port until built)                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Device-token registration endpoint `POST /api/v1/users/me/devices` (or similar). Server stores `{ userId, platform: 'ios' \| 'android', token, lastSeenAt }`. Push fan-out reads from this table. |
| Per-user, per-device push preference toggles (residents need quiet hours, mute by category).                                                                                                      |
| Account deletion UI inside the app. Required by App Store policy 5.1.1(v) for any app with account creation.                                                                                      |
| Privacy nutrition labels (data collected, linked to user, used for tracking — usually a 1-day exercise but mandatory before submission).                                                          |

---

## Recommendation

Ship the PWA today (done — commit `77dd9e8`). Update the landing
page to mention installable mobile. Watch usage for 90 days. If
mobile sessions meaningfully exceed desktop for residents,
commit to React Native and hire one dedicated engineer for a
four-month build. Do not pre-build the native app on the promise of
demand that hasn't materialized.
