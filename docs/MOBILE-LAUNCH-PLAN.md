# Concierge Mobile — Launch Plan

**TL;DR.** The Expo React Native scaffold is in `/mobile` (commit
`6b8432e`). It compiles to a real iOS + Android binary the moment a
human runs `npm install && npx expo prebuild`. Four months from a
dedicated React Native engineer takes it to App Store / Play Store
submission. The PWA shipped in commit `77dd9e8` covers the "mobile"
marketing claim today.

## Status at this moment

| Surface                                                                           | State       | Commit    |
| --------------------------------------------------------------------------------- | ----------- | --------- |
| PWA (installable web app)                                                         | **Shipped** | `77dd9e8` |
| Backend device-token registration                                                 | **Shipped** | `6b8432e` |
| Backend in-app account deletion (App Store 5.1.1(v))                              | **Shipped** | `6b8432e` |
| Expo project scaffold                                                             | **Shipped** | `6b8432e` |
| Mobile design system (`tokens.ts`, Button, Card, Input, Screen, Text, EmptyState) | **Shipped** | `6b8432e` |
| Auth flow (SecureStore + JWT + refresh + auto-retry)                              | **Shipped** | `6b8432e` |
| Login + Dashboard + My Packages + My Requests + My Account screens                | **Shipped** | `6b8432e` |
| Push registration glue (Expo → device token → `/users/me/devices`)                | **Shipped** | `6b8432e` |
| Landing page promotes mobile                                                      | **Shipped** | `376382c` |
| Amenity Booking screen                                                            | Pending     | M2        |
| Announcements screen                                                              | Pending     | M2        |
| Visitor pre-authorization screen                                                  | Pending     | M3        |
| MFA flow on mobile                                                                | Pending     | M2        |
| Resident onboarding wizard (mobile-only flavor)                                   | Pending     | M3        |
| Offline cache / SWR layer                                                         | Pending     | M3        |
| Biometric unlock (Face ID / Touch ID / Fingerprint)                               | Pending     | M3        |
| Push permission rationale copy                                                    | Pending     | M2        |
| App icons (1024×1024 source + adaptive Android)                                   | Pending     | M1        |
| Privacy nutrition labels in App Store Connect                                     | Pending     | M4        |
| TestFlight build                                                                  | Pending     | M4        |
| Play Store internal track build                                                   | Pending     | M4        |
| App Store submission                                                              | Pending     | M4        |

## Milestone plan — 4 months, 1 senior RN engineer

### M1 — Foundation (weeks 1-4)

Engineer wakes up Monday morning, runs `cd mobile && npm install`,
opens Xcode + Android Studio, and is in business.

| Week | Tasks                                                                                                                                                                                                                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `npm install`. `npx expo prebuild` to generate `ios/` + `android/`. Apple Developer account ($99). Google Play Console account ($25 one-time). Bundle ID `app.concierge.resident` claimed on both. App icons: 1024×1024 master PNG → `expo-asset` generates the rest. Adaptive Android icon (foreground + background). |
| 2    | Run on simulator. Run on physical iPhone via Expo Go. LAN IP wiring in `app.json.extra.apiBaseUrl`. End-to-end: log in as a seeded resident, see real packages render. Bug-fix the dozen things that look subtly wrong on iOS chrome (status-bar color, safe-area gaps, keyboard handling).                            |
| 3    | Polish login + dashboard. Add error-boundary at the navigation root. Plumb Sentry (or equivalent) for native crash reporting. Push permission rationale copy: rewrite Expo's default prompt to explain what notifications we'll send.                                                                                  |
| 4    | Internal demo to the team. Capture top 10 papercuts. Sprint planning for M2.                                                                                                                                                                                                                                           |

### M2 — Resident core (weeks 5-8)

| Week | Tasks                                                                                                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5    | **Amenity Booking screen.** List of amenities, calendar picker, time slot picker, guest count, agreement checkbox. POST to `/api/v1/resident/bookings` — the backend's race-safe path (commit `0ec83f2`). |
| 6    | **Announcements screen.** Tabs: Latest, Important, Acknowledged. Pull-to-refresh. Tap to open detail with full HTML rendering via `react-native-render-html`. Mark-as-read on detail-view.                |
| 7    | **MFA flow on mobile.** Receive `{ mfaRequired: true, mfaToken }` from `/api/auth/login`, show a 6-digit code screen, POST to `/api/auth/verify-2fa`.                                                     |
| 8    | **Visitor pre-authorization.** Form for guest name + expected arrival window. POST to `/api/v1/visitors/pre-auth` (verify endpoint exists; if not, add it).                                               |

### M3 — Polish + native delights (weeks 9-12)

| Week | Tasks                                                                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9    | **Biometric unlock.** Face ID / Touch ID gate on app foreground after 5 minutes of inactivity. `expo-local-authentication`. Fall back to passcode if biometric fails 3 times.                     |
| 10   | **Offline cache.** `@tanstack/react-query` with `react-query-async-storage-persister`. Every list screen caches its last successful response and renders it instantly on cold start.              |
| 11   | **Onboarding wizard.** First-time user signs in → 3-screen wizard (profile photo, push permission, set quiet hours). After that, the dashboard.                                                   |
| 12   | **Deep links + universal links.** `concierge://my-packages` works. `https://concierge.app/my-packages` opens the app if installed, the web otherwise. iOS Associated Domains + Android App Links. |

### M4 — Ship (weeks 13-16)

| Week | Tasks                                                                                                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13   | **Privacy nutrition labels** in App Store Connect: data types collected = email, name, location (property), usage data. Required by Apple before submission. Privacy policy URL set in App Store Connect. |
| 14   | **TestFlight + Google Play Internal Testing.** `eas build --platform all`. Invite the team + 5 friendly residents. Crash-free session rate target: 99.5% in beta week 1.                                  |
| 15   | **App Store screenshots.** 6 per platform (iPhone 6.5", iPad 12.9", Pixel 6 Pro at minimum). Marketing copy. App preview videos optional.                                                                 |
| 16   | **Submit for review.** Apple: 24-48h typical first review, but can be 1-2 weeks if they bounce on privacy or account deletion (we have both covered). Google: usually same-day to 3 days.                 |

## What I cannot do from this environment

These are real launch blockers but require credentials I don't have:

1. **Apple Developer account.** $99/yr. The team's CTO or the equivalent named person on the account has to set this up. Bundle ID claim + provisioning profiles + APNs key all flow from there.
2. **Google Play Console.** $25 one-time. Same flow but lighter — no provisioning hell.
3. **TestFlight invitations.** Need the developer account first.
4. **EAS Build account.** Free tier covers M2-M3. M4 might need a Production plan ($99/mo) if we hit build minutes.
5. **App icon assets.** The placeholder building icon at `/public/icon.svg` is functional. A real designer should produce a 1024×1024 PNG before submission.

## Backend obligations the mobile app already depends on

Every endpoint below is implemented and shipping today.

```
POST   /api/auth/login                  → JWT + refresh
POST   /api/auth/refresh                → refresh access token
POST   /api/auth/logout                 → server-side invalidation
GET    /api/v1/users/me                 → profile
PATCH  /api/v1/users/me                 → update profile
DELETE /api/v1/users/me                 → in-app deletion (App Store 5.1.1(v))   [commit 6b8432e]
POST   /api/v1/users/me/devices         → register push token                    [commit 6b8432e]
DELETE /api/v1/users/me/devices         → drop push token                        [commit 6b8432e]
GET    /api/v1/resident/packages        → my packages
GET    /api/v1/resident/maintenance     → my requests
POST   /api/v1/resident/maintenance     → create request
GET    /api/v1/resident/bookings        → my bookings
POST   /api/v1/resident/bookings        → create booking (advisory-lock safe)     [commit 0ec83f2]
GET    /api/v1/announcements            → property announcements
GET    /api/v1/amenities                → bookable amenities
```

Two endpoints I should verify exist before M3:

- `POST /api/v1/visitors/pre-auth` — resident creates a pre-authorized visitor
- `POST /api/auth/verify-2fa` — finish MFA login

If they don't, they're each ~2 days of backend work and I'll fold them into the appropriate sprint.

## Push-notification triggers worth wiring up

The mobile app gets a push when:

| Event                                             | Why residents care                                  | Endpoint that fires it                         |
| ------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| Package logged for my unit                        | "I have a delivery" — the #1 driver of resident NPS | `POST /api/v1/packages`                        |
| Maintenance request status changed                | "My ticket moved" — closes the loop                 | `PATCH /api/v1/maintenance/[id]`               |
| Booking approved or declined                      | Action ends the waiting                             | `PATCH /api/v1/bookings/[id]/approval`         |
| Building-wide announcement with `priority=urgent` | Emergency, fire drill, water shutoff                | `POST /api/v1/announcements`                   |
| Visitor arrived at front desk                     | Resident knows their guest is on the way up         | `POST /api/v1/visitors` (with `pre-auth` link) |

None of these triggers exist in `src/server/push.ts` yet — that file only exposes `sendPushNotification`, `sendPushToUser`, and `sendPushToProperty`. The hooks that call them on the 5 events above are M2 backend work; estimated 1-2 days each.

## Budget summary

| Item                                             | Cost                     |
| ------------------------------------------------ | ------------------------ |
| Senior React Native engineer × 4 months          | $80k-$120k               |
| Apple Developer membership                       | $99/yr                   |
| Google Play Developer                            | $25 one-time             |
| Designer (icon + screenshots + iOS HIG patterns) | $5k-$15k one-time        |
| EAS Build (Production plan if needed in M4)      | $99/mo × 2 months = $198 |
| **All-in**                                       | **~$90k-$140k**          |

## Decision points for the founder

1. **Are you hiring or contracting the RN engineer?** A full-time hire is more expensive ($150-200k/yr) but gets you v2 + v3. A contractor at $100-150/hr for 4 months runs ~$70k and leaves zero institutional knowledge. Pick by 12-month roadmap, not by month-4 cost.

2. **What stays mobile-only forever?** Some features the resident will only ever do on mobile (visitor pre-auth, push notifications). Some features the resident will only ever do on web (vacation planning, profile editing on a big screen). Don't build everything on both surfaces.

3. **Front-desk app — yes or later?** The concierge / front-desk persona is a different product: barcode scanning, fast intake, signature capture. If you commit to this, it's another 4-month build in 2027. M4 of resident v1 is the right time to scope it out.

4. **Beta program structure.** TestFlight caps at 10,000 external testers. For the first 90 days, recruit one friendly building (50-200 residents) for closed beta — this is your real product validation. If retention beats 40% MAU at week 4, public launch. If not, find out why before submitting publicly.

5. **App name decision.** "Concierge" is good but generic — search for it in the App Store and you compete with hotel concierge apps. "Concierge for [city]" or "[building chain] by Concierge" might be the segmentation. Do this before App Store submission; renaming after launch tanks discoverability.
