# Concierge Mobile

Resident-facing native iOS + Android app, built with Expo and React
Native. Talks to the existing Next.js backend at `/api/v1/*` — no
business logic is duplicated; this is a UI layer on top of the same
APIs the web portal uses.

## What's in here

```
mobile/
├── App.tsx                          # root component
├── app.json                         # Expo config — bundle id, push, plugins
├── index.ts                         # registerRootComponent entry
├── package.json                     # Expo SDK 53, React Native 0.76
├── tsconfig.json                    # strict TS, @/* path alias
└── src/
    ├── api/
    │   ├── auth.ts                  # /api/auth/login, /api/auth/refresh
    │   ├── client.ts                # fetch wrapper with auto-refresh
    │   └── resident.ts              # /api/v1/resident/* calls
    ├── auth/
    │   ├── AuthContext.tsx          # provider + useAuth hook
    │   └── storage.ts               # SecureStore (Keychain / Keystore)
    ├── components/
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── EmptyState.tsx
    │   ├── Input.tsx
    │   ├── Screen.tsx               # page wrapper — mobile PageShell
    │   └── Text.tsx
    ├── design/
    │   └── tokens.ts                # colors, spacing, typography
    ├── navigation/
    │   └── RootNavigator.tsx        # auth stack ↔ tabs
    ├── push/
    │   └── registerForPush.ts       # APNs/FCM via Expo
    └── screens/
        ├── DashboardScreen.tsx
        ├── LoginScreen.tsx
        ├── MyAccountScreen.tsx
        ├── MyPackagesScreen.tsx
        └── MyRequestsScreen.tsx
```

## Quick start

```bash
cd mobile
npm install
npx expo prebuild              # generate ios/ and android/ folders
npx expo start                 # Metro bundler + QR for Expo Go
```

For a physical device, set the API base URL to your dev machine's
LAN IP. The default in `app.json` points to `https://concierge.app`
which is fine for prod but useless from a simulator hitting localhost:

```bash
# Either edit app.json's `extra.apiBaseUrl`...
# ...or override per-run:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:3000 npx expo start
```

Then `app/api/client.ts` should be updated to read from
`process.env.EXPO_PUBLIC_API_BASE_URL` first. (Today it reads
`Constants.expoConfig.extra.apiBaseUrl`.)

## What's wired up

| Capability           | Implementation                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| JWT auth + refresh   | `src/api/client.ts` calls `/api/auth/login` and `/api/auth/refresh`; tokens stored in SecureStore.          |
| Resident packages    | `MyPackagesScreen` → `GET /api/v1/resident/packages`.                                                       |
| Maintenance requests | `MyRequestsScreen` → `GET /api/v1/resident/maintenance`.                                                    |
| Amenity bookings     | `src/api/resident.ts` exposes `listMyBookings()` and `createBooking()` — screen not yet rendered.           |
| Push notifications   | `src/push/registerForPush.ts` requests permission, fetches Expo token, POSTs to `/api/v1/users/me/devices`. |
| Account deletion     | `MyAccountScreen` calls `DELETE /api/v1/users/me` per App Store policy 5.1.1(v).                            |
| Pull-to-refresh      | Dashboard, Packages, Requests all support `RefreshControl`.                                                 |
| Empty states         | Every list screen renders `EmptyState` with copy + tone.                                                    |
| Safe-area handling   | `Screen` and SafeAreaView used on every top-level screen.                                                   |
| Cross-tenant safety  | Server-side — every API call goes through `guardRoute`; the mobile client cannot bypass it.                 |

## What's NOT here yet

These are intentionally deferred so v1 ships in 4 months instead of 8.

1. **Amenity Booking screen** — backend ready, UI deferred to month 3.
2. **Announcements feed** — backend ready (`/api/v1/announcements`), UI deferred.
3. **Visitor pre-authorization** — needs barcode generation; month 3.
4. **MFA flow** — login redirects to web for now if `mfaRequired`.
5. **Resident onboarding wizard** — mobile-installed users hit a stub.
6. **Offline cache** — every screen does a fresh fetch on mount. A
   SWR-like layer (`react-query` with persisted cache) is the next
   investment.
7. **Biometric unlock** — Face ID / Touch ID gate over the SecureStore
   read. ~1 sprint of work.

## App Store checklist

| Item                                        | Status                                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Bundle ID set (`app.concierge.resident`)    | ✅ in `app.json`                                                                                    |
| Camera + photo library usage descriptions   | ✅ in `app.json`                                                                                    |
| Account deletion in-app                     | ✅ MyAccountScreen + DELETE endpoint                                                                |
| Privacy nutrition labels                    | ⏳ author in App Store Connect: data types collected = email, name, location (property), usage data |
| Sign in with Apple                          | ❌ not required since we offer non-Apple login (no other 3rd-party login providers)                 |
| Push permission rationale                   | ✅ Expo's default prompt covers it; we should override copy in a future build                       |
| iOS provisioning profile + APNs key         | ⏳ requires Apple Developer membership ($99/yr)                                                     |
| Screenshots (iPhone 6.5", 5.5"; iPad 12.9") | ⏳ generate from working app once feature-complete                                                  |

## Backend dependencies

The mobile app expects these server endpoints. All are implemented
(commit history: see commit `cb09529` and ancestors).

```
POST   /api/auth/login                    — JWT + refresh
POST   /api/auth/refresh                  — refresh access token
POST   /api/auth/logout                   — best-effort server invalidation
GET    /api/v1/users/me                   — profile
PATCH  /api/v1/users/me                   — update profile
DELETE /api/v1/users/me                   — App Store self-delete (new)
POST   /api/v1/users/me/devices           — register push token (new)
DELETE /api/v1/users/me/devices           — drop push token (new)
GET    /api/v1/resident/packages          — list my packages
GET    /api/v1/resident/maintenance       — list my requests
POST   /api/v1/resident/maintenance       — create request
GET    /api/v1/resident/bookings          — list my bookings
POST   /api/v1/resident/bookings          — create booking (race-safe)
```

## Why not React Native Web?

Sharing UI between web and native produces uncanny-valley UX on both
platforms — Material on iOS, iOS chrome on Android, neither feels
native. The strategy here is shared API + shared types, NOT shared
UI. The web is in `src/app/`, the native app is in `mobile/src/`, and
the only files they look at together are `src/types/*` and the Zod
schemas in `src/schemas/*` (we should publish those as a tiny shared
package eventually).

## Next steps for the team

1. `cd mobile && npm install` — pulls down Expo + React Navigation.
2. `npx expo prebuild` — generates the `ios/` and `android/` native
   folders. From this point Xcode and Android Studio can open them.
3. Apple Developer account + bundle ID registration.
4. EAS Build for cloud builds (`npx eas build --platform ios`).
5. TestFlight upload, internal review.
6. Build out Amenity Booking + Announcements screens (estimate: 3-4
   weeks each with the existing API).
