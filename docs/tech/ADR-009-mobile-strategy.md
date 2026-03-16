# ADR-009: Mobile Strategy — API-First with Planned React Native Extraction

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge's primary users are desktop-based staff (security guards, property managers, concierge) sitting at front-desk monitors. However, several use cases require mobile access:

1. **Security guard patrols**: Incident reporting, photo capture, GPS-verified inspections while walking the building.
2. **Resident self-service**: Package pickup notifications, amenity booking, maintenance request submission from their phone.
3. **Property manager on-the-go**: Approval workflows (alteration permits, amenity bookings, vendor compliance) while away from the desk.
4. **Push notifications**: Real-time alerts for packages, security incidents, and maintenance updates delivered to personal devices.

Mobile is explicitly a **secondary** experience (RULEBOOK Rule 1: desktop monitor-first design), but it must exist for the use cases above. The architecture must support a native mobile app without requiring a backend rewrite.

The challenge: we are building the web platform first with Next.js 15, which co-locates API routes alongside page components. When mobile development begins, these API routes must serve both the web frontend and a native mobile client. The API layer cannot contain Next.js-specific patterns (server actions, `revalidatePath`, `redirect()`) that assume a web browser context.

## Decision

We adopt an **API-first architecture** from day one, with a planned extraction to a standalone backend server when React Native development begins.

### Phase 1: Web-Only (Current)

```
Next.js 15 App Router
├── src/app/(pages)/     → Server Components + Client Components (web UI)
├── src/app/api/         → REST API routes (JSON in, JSON out)
├── src/lib/services/    → Business logic (framework-agnostic)
├── src/lib/validators/  → Zod schemas (shared validation)
└── src/lib/types/       → TypeScript types (shared)
```

API routes in `src/app/api/` return pure JSON. They do NOT use `revalidatePath()`, `redirect()`, `cookies()` from `next/headers`, or any Next.js-specific server utility. Business logic lives in `src/lib/services/` — plain TypeScript classes/functions with no framework imports.

### Phase 2: Mobile Development Begins (Future)

```
Standalone API Server (Express or Fastify)
├── src/routes/          → Extracted from Next.js API routes
├── src/services/        → Same business logic (moved or shared via monorepo)
├── src/validators/      → Same Zod schemas
└── src/types/           → Same TypeScript types

Next.js 15 (Web)         → Calls standalone API (or keeps co-located routes as proxy)
React Native (Mobile)    → Calls same standalone API
Socket.io Server         → Serves both web and mobile WebSocket clients
```

### Technology Mapping

| Concern | Web (Next.js) | Mobile (React Native) | Shared? |
|---------|--------------|----------------------|---------|
| API consumption | `fetch` / React Query | `fetch` / React Query | YES — same API client |
| Authentication | JWT (httpOnly cookie for web) | JWT (secure storage for mobile) | YES — same tokens, different storage |
| Real-time | Socket.io client (browser) | Socket.io client (React Native) | YES — same events, same server |
| Push notifications | FCM via service worker | FCM via `react-native-firebase` | YES — same FCM project |
| Validation | Zod schemas | Same Zod schemas | YES — shared package |
| State management | React Query + Zustand | React Query + Zustand | YES — same libraries |
| Styling | Tailwind CSS | NativeWind (Tailwind for RN) | PARTIAL — same tokens, different runtime |
| Animation | Framer Motion | react-native-reanimated | NO — different API |
| UI Components | Radix UI | Custom RN components | NO — rebuild for native |
| Payments | Stripe.js (web) | @stripe/stripe-react-native | YES — same Stripe account |
| File upload | `<input type="file">` | react-native-image-picker | NO — different capture |

## Rationale

### API-First from Day One (Not Retrofit Later)

Retrofitting an API layer onto a web app that uses Next.js server actions and `revalidatePath()` throughout is a 2-4 month rewrite. By enforcing API-first from the start, we pay a small discipline cost now (keeping API routes as pure JSON endpoints) to avoid a large extraction cost later.

The key architectural rule: **`src/app/api/` routes are thin HTTP handlers. They parse the request, call a service function from `src/lib/services/`, and return JSON.** No business logic in the route handler. No Next.js imports in the service layer. This makes extraction mechanical: move the route handler to Express/Fastify, swap the request parsing, keep the service call identical.

### React Native (Future) over Flutter, Ionic/Capacitor, PWA-Only, or Native iOS/Android

**React Native** is chosen for the future mobile app because:

- **Ecosystem reuse**: Same language (TypeScript), same package manager (pnpm), same validation library (Zod), same state management (React Query + Zustand), same API client patterns. One team builds both platforms.
- **Code sharing**: Business logic, validation schemas, type definitions, API client, and Socket.io event handlers are shared between web and mobile via a monorepo. Estimated 60-70% logic reuse.
- **Platform coverage**: Single React Native codebase produces both iOS and Android apps with ~90% shared code between platforms.
- **Talent pool**: React/TypeScript developers can contribute to mobile immediately. No Dart (Flutter) or Swift/Kotlin specialization required.

**Flutter** was rejected because it introduces Dart — a separate language, separate toolchain, separate package ecosystem. No code sharing with our TypeScript web stack. The team would need to maintain two technology stacks indefinitely.

**Ionic/Capacitor** wraps a web view in a native shell. Performance is inferior to React Native for interactions like swipe gestures, camera capture, and real-time list updates. It also inherits all web rendering limitations on mobile (no native scroll physics, no native navigation transitions).

**PWA-only** was rejected because:
- iOS Safari has limited PWA support (no push notifications until iOS 16.4, no background sync, no badging on older versions).
- No App Store/Play Store presence — residents expect to find their building's app in their device's app store.
- Offline support is constrained by service worker limitations versus React Native's persistent storage.
- Camera and file access are more limited in the browser than in native.

**Native iOS (Swift) + Android (Kotlin)** was rejected because it requires two separate development teams, two codebases, and doubles the maintenance surface. This is cost-prohibitive for a startup.

### Shared Validation with Zod

Zod schemas defined in `src/lib/validators/` are used by both the web frontend (form validation), the API routes (request validation), and will be used by the React Native app (form validation). This guarantees validation rules are identical across all three layers — a resident cannot submit a maintenance request from the mobile app that the API would reject, or vice versa.

Example shared schema:
```typescript
// src/lib/validators/maintenance.ts — used by web, API, and future mobile
export const createMaintenanceRequestSchema = z.object({
  unitId: z.string().uuid(),
  description: z.string().min(10).max(4000),
  categoryId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  permissionToEnter: z.boolean(),
  entryInstructions: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
});
```

### Socket.io Works Across Both Platforms

Socket.io's client library (`socket.io-client`) works identically in the browser and in React Native. The same event names, same room structure (`/property/{id}`), same JWT authentication middleware — mobile clients receive real-time package notifications, maintenance updates, and security alerts through the same WebSocket infrastructure as web clients.

### FCM Push Unifies Web and Mobile

Firebase Cloud Messaging serves push notifications to both web (via service workers) and mobile (via `react-native-firebase`). A single notification dispatch from the backend reaches the user on whatever device they are using. The FCM token per device is stored per user, and the backend sends to all registered tokens.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **Flutter** | Introduces Dart language and separate toolchain. Zero code sharing with TypeScript web stack. |
| **Ionic/Capacitor** | Web view wrapper — inferior performance for gestures, camera, real-time lists. Not truly native. |
| **PWA-only** | Limited iOS support, no App Store presence, constrained camera/file/offline access. |
| **Native iOS + Android** | Two languages (Swift + Kotlin), two teams, double maintenance. Cost-prohibitive for a startup. |
| **Server Actions in Next.js** | Tightly couples API to Next.js. Extraction to standalone backend becomes a rewrite, not a move. |
| **GraphQL** | Adds complexity (schema management, resolver boilerplate) without clear benefit for our CRUD-heavy use cases. REST with Zod validation is simpler and sufficient. |

## Consequences

### Positive
- API routes are client-agnostic from day one — any HTTP client (web, mobile, third-party integration) can consume them.
- Business logic in `src/lib/services/` has zero framework dependencies — testable with Vitest in isolation, portable to any server framework.
- Shared Zod schemas guarantee validation parity across web, API, and future mobile.
- Socket.io and FCM work identically across web and React Native — no notification infrastructure changes for mobile.
- React Native extraction can happen incrementally (screen by screen) rather than as a big-bang rewrite.
- One TypeScript team builds everything — no need to hire Dart, Swift, or Kotlin specialists.

### Negative
- API-first discipline adds friction: developers cannot use convenient Next.js patterns like server actions, `revalidatePath()` in API routes, or `cookies()` in service functions.
- React Native components must be rebuilt from scratch — Radix UI has no React Native equivalent. This is a significant development cost when mobile begins.
- NativeWind (Tailwind for React Native) covers most utility classes but has gaps in complex responsive layouts. Some mobile-specific styling will diverge.
- Framer Motion does not work in React Native; `react-native-reanimated` has a different API. Animation code is not shared.

### Risks
- The API-first rule may be violated under deadline pressure (developer uses a Next.js server action "just this once"). Mitigation: ESLint rule that flags `next/headers` or `next/cache` imports inside `src/lib/services/` and `src/app/api/` directories.
- React Native development may not begin for 12-18 months. The API-first architecture carries a small ongoing cost for a benefit that is deferred. Mitigation: the API-first constraint also benefits third-party integrations, automated testing, and any future client (smart displays, digital signage).
- React Native ecosystem changes rapidly. By the time mobile development begins, the recommended navigation library, state management, or styling approach may have shifted. Mitigation: core decisions (TypeScript, Zod, React Query, Socket.io, FCM) are stable and framework-agnostic.

## Related ADRs
- [ADR-001-framework.md](ADR-001-framework.md) — Next.js 15 API routes are the initial API layer before extraction
- [ADR-003-auth.md](ADR-003-auth.md) — JWT authentication works across web (cookie) and mobile (secure storage)
- [ADR-004-realtime.md](ADR-004-realtime.md) — Socket.io serves both web and React Native clients
- [ADR-006-styling.md](ADR-006-styling.md) — Framer Motion gestures inform mobile interaction design; Tailwind tokens shared via NativeWind
- [ADR-008-hosting.md](ADR-008-hosting.md) — Backend extraction deploys to AWS ECS/Lambda alongside existing RDS and S3
