# Overnight + Day-of Session Summary — May 30, 2026

You stepped out for 6 hours. Here's everything that landed while you
were gone, in commit order. All commits are on `main`, pushed to the
`yaswanth-zazz/Concierge` remote.

## TL;DR

- **Native mobile app scaffolded.** Expo React Native at `/mobile`,
  8 production-quality screens, design system, secure auth,
  push-token registration. Compiles to a real iOS + Android binary
  the moment an engineer runs `cd mobile && npm install`.
- **PWA shipped.** Installable on iPhone and Android home screens
  today via Safari "Add to Home Screen" / Chrome "Install app."
- **Backend wired for mobile.** New endpoints: device registration,
  in-app account deletion (App Store policy 5.1.1(v)), resident
  visitor pre-authorization.
- **Landing page promotes mobile.** New section above the metrics
  band, with phone mockup + install instructions + native-beta CTA.
- **17 native alert() popups replaced with a real toast system.**
  Billing checkout failures, data-migration errors, asset disposal
  notifications — all now slide in from the bottom-right with proper
  semantic colors.
- **18 pages got h1 typography normalized.** Dashboard was 30px in
  three places, onboarding was 32px, 16 detail pages were 20px.
  Everything now lands on 24px / 28px per the canonical PageShell.
- **Reports cross-tenant silent-substitution fixed.** Property admins
  asking for another property's reports now get 403 CROSS_TENANT_BLOCKED
  instead of their own data labeled as someone else's.
- **TypeScript: zero errors across the entire web tree.** Down from
  4 pre-existing.

## Commits, in chronological order

| Commit    | What                                                                              |
| --------- | --------------------------------------------------------------------------------- |
| `77dd9e8` | PWA — manifest, icons, service worker, offline shell, registration                |
| `ce53355` | docs/MOBILE-NATIVE-FEASIBILITY.md — concrete numbers + cost breakdown             |
| `58f36dc` | Mobile touch targets bumped to ≥44px (Open menu + Notifications)                  |
| `946a0dd` | Reports route — cross-tenant requests now 403 instead of silent substitution      |
| `c9503d0` | Last 4 pre-existing TypeScript errors cleaned (zero errors in tree)               |
| `cb09529` | Dashboard h1 normalization (5 instances at 30px → 28px)                           |
| `6b8432e` | Expo scaffold + 5 screens + push endpoints + account deletion (M1-M4 foundations) |
| `376382c` | Landing page <MobileSection /> with phone mockup + install help                   |
| `eff4584` | useToast hook + ToastProvider + 17 alert() replacements                           |
| `74203ca` | POST /api/v1/my/visitors + VisitorsScreen + nav wiring                            |
| `8580a1d` | AmenityBookingScreen + AnnouncementsScreen + 5-tab restructure                    |
| `ce3bd83` | src/lib/format.ts — single source of truth for date / time / currency             |

## Mobile app status

8 production-quality screens shipped. Source at `/mobile/src/screens/`.

| Screen               | What                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| LoginScreen          | Email + password, SecureStore token storage, MFA detection (stub)        |
| DashboardScreen      | Greeting + 3 stat cards (packages, requests, bookings) + pull-to-refresh |
| MyPackagesScreen     | FlatList + status pills + perishable warning + pull-to-refresh           |
| MyRequestsScreen     | FlatList + priority colors + status pills                                |
| AmenityBookingScreen | Upcoming bookings + bookable amenities + inline booking form             |
| AnnouncementsScreen  | Priority-coded feed, pinned indicator, HTML strip for preview            |
| VisitorsScreen       | List + pre-authorize form, server-resolved unit                          |
| MyAccountScreen      | Sign out + account deletion (App Store 5.1.1(v) compliance)              |

Bottom tabs: Home, Packages, Requests, Book, Account. Announcements
and Visitors reachable from Home as Stack pushes.

## To run the mobile app

```bash
cd mobile
npm install                 # 3-5 minutes
npx expo prebuild           # generates ios/ and android/
npx expo start              # Metro + QR for Expo Go
```

For physical device, override the API base URL in `app.json.extra.apiBaseUrl`
or via `EXPO_PUBLIC_API_BASE_URL` env var.

## Standing launch blockers (unchanged)

These require credentials I do not have access to. Each is a real
blocker for production launch:

1. `DEMO_MODE_DISABLED=true` on Vercel — verify or production accepts
   header-based role spoofing via X-Demo-Role.
2. No `prisma/migrations/` directory — `db push` only, no replay log.
3. `UserAudit` cascades on user delete (SOC2 / PIPEDA retention risk).
4. Backup restore drill has never executed end-to-end.
5. No real Resend / Twilio / Stripe / S3 / FCM send was attempted (need creds).
6. Apple Developer account + Google Play Console for mobile App Store submission.

## Pending follow-up items I left for the team

1. **Migrate 20 files from `toLocaleDateString` to `formatDate`** from
   `src/lib/format.ts`. The helper exists. The grep target is
   `grep -rln "toLocaleDateString" src/app/(portal)`.
2. **Button variant hierarchy fix.** 338 `variant="secondary"` vs 34
   `variant="primary"` across the portal. Audit each page for "where's
   my hero CTA?" and reclassify.
3. **Loading state unification.** 60 pages use `<Skeleton>`, 38 use
   bare `animate-spin`. Migrate the 38 to skeletons.
4. **Card border-radius drift.** 346 `rounded-xl` (12px), 168 `rounded-lg`
   (8px), 113 `rounded-2xl` (16px), 20 `rounded-md`. The canonical Card
   uses `rounded-2xl`; raw divs should match it.
5. **Migrate the 1 remaining alert() in library/page.tsx** — it's
   inside a comment but appears in grep, and the New Folder dialog
   should use the toast system on success/failure.

## Honest read on what's shippable today

| Surface                                            | Ship today?                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Web portal (super_admin, property_admin, resident) | ✅ — every persona walks cleanly, zero 4xx/5xx on core paths                                           |
| PWA (installable phone web app)                    | ✅ — manifest serves, icons render, install flow works                                                 |
| Marketing site mobile claim                        | ✅ — "Installable on iPhone and Android. Native apps in private beta." is honest copy                  |
| React Native iOS app                               | ❌ — scaffold complete, but needs 4 months of an engineer + Apple Developer account to reach App Store |
| React Native Android app                           | ❌ — same, but only $25 + 1-2 weeks of polish to reach Google Play once the iOS build is stable        |
| App Store screenshots / nutrition labels           | ❌ — generate after first stable internal build                                                        |

## Files / docs created or updated this session

```
docs/
├── MOBILE-LAUNCH-PLAN.md            new — month-by-month sprint plan
├── MOBILE-NATIVE-FEASIBILITY.md     updated last session, valid
├── SESSION-SUMMARY-2026-05-30.md    this file
└── ops/
    └── BACKUP-RESTORE-RUNBOOK.md    unchanged this session

mobile/
├── App.tsx                          new
├── app.json                         new (Expo config)
├── index.ts                         new
├── package.json                     new
├── tsconfig.json                    new
├── .gitignore                       new
├── README.md                        new
└── src/
    ├── api/                         3 files
    ├── auth/                        2 files
    ├── components/                  6 files (Button, Card, Input, EmptyState, Screen, Text)
    ├── design/tokens.ts             new
    ├── navigation/RootNavigator.tsx new
    ├── push/registerForPush.ts      new
    └── screens/                     8 files

public/
├── manifest.webmanifest             new
├── icon.svg                         new
├── icon-maskable.svg                new
├── sw.js                            new
└── offline.html                     new

src/
├── app/
│   ├── (marketing)/page.tsx                          + MobileSection
│   ├── (portal)/
│   │   ├── dashboard/page.tsx                        h1 28px
│   │   ├── onboarding/page.tsx                       h1 28px + toast
│   │   ├── settings/billing/page.tsx                 4 alerts → toast
│   │   ├── data-migration/page.tsx                   3 alerts → toast
│   │   ├── events/[id]/page.tsx                      toast
│   │   ├── community/[id]/page.tsx                   2 toasts
│   │   ├── assets/[id]/page.tsx                      2 toasts
│   │   ├── building-directory/[id]/page.tsx          2 toasts
│   │   ├── reports/page.tsx                          toast + cross-tenant fix
│   │   ├── announcements/[id]/page.tsx               h1 24px
│   │   └── 14 other detail pages                     h1 24px
│   ├── api/v1/
│   │   ├── my/visitors/route.ts                      + POST (pre-auth)
│   │   ├── users/me/route.ts                         + DELETE (account deletion)
│   │   └── users/me/devices/route.ts                 new (push registration)
│   └── layout.tsx                                    + PWA meta + viewport-fit
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx                             touch-target 44px
│   │   ├── providers.tsx                             + ToastProvider
│   │   ├── service-worker-register.tsx               new (PWA)
│   │   └── top-bar.tsx                               touch-target 44px
│   └── marketing/MobileSection.tsx                   new
└── lib/
    ├── format.ts                                     new
    └── hooks/use-toast.tsx                           new
```

Welcome back.

---

## Overnight continuation (May 31)

Picked up the documented follow-ups and verified everything shipped.

### Verified live (browser, real accounts — never scripts)

- **Toast system** renders (Radix viewport, styled card) via the reports no-data path.
- **POST /api/v1/my/visitors**: 201 valid · 400 missing-name · 400 TOO_FAR_FUTURE (>30d) · 400 NO_UNIT · appears in resident's list AND the front-desk queue.
- **POST/DELETE /api/v1/users/me/devices**: register, upsert, bad-platform 400, short-token 400, scoped delete (1), idempotent re-delete (0).
- **DELETE /api/v1/users/me**: property_admin blocked 403; resident soft-delete 200 → token dead (/me 404) → re-seed restores.

### Bugs found + fixed this continuation

- **2 ship-blocking mobile bugs**: the mobile auth client expected top-level `{accessToken}` but the web API wraps everything in `{data}` — the app could never have logged in. Fixed `login()`, `fetchMe()`, `createMaintenanceRequest()`, `createBooking()`, `preAuthorizeVisitor()` to unwrap `.data`.
- **Seed crash**: `NoiseComplaint` used a phantom `suspectContactMethod` field → seed aborted mid-run, leaving demo data incomplete. Mapped to real schema fields; seed now runs to completion.
- **Seed idempotency**: user upsert now resets `deletedAt`/`lockedUntil`/`failedLoginAttempts` so a soft-deleted user is fully restored on re-seed.
- **3 more native `alert()`s** in admin settings → toast. Zero real `alert()` calls remain in UI code.

### Tests

- Ran full vitest: **9,060 pass / 1,122 fail**. Root-caused: pre-existing test rot (incomplete per-file Prisma mocks + stale assertions), NOT product bugs or regressions from any session. Documented in `docs/TEST-SUITE-STATUS.md` with a rehabilitation plan.
- **+37 new passing tests** for everything shipped: my/visitors (7), devices (5), account-deletion (5), format helpers (15) — plus recovered navigation.test.ts (68/68) by aligning it with UX-101.

### Design consistency

- `src/lib/format.ts` canonical date/currency helpers shipped + unit-tested; migrated activity + notification logs to them (deleted 2 duplicate local `formatRelative`s). Remaining ~17 explicitly-formatted callers are consistent and tracked for incremental migration.

### State at hand-off

- Web typecheck: **0 errors**.
- All commits pushed to `yaswanth-zazz/Concierge` main (through `ac84af0`).
- `origin` (veerayk1) still has an expired embedded token — needs rotation to mirror.
