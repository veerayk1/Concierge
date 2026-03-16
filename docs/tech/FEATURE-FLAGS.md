# Concierge — Feature Flag System

> **Version**: 1.0 | **Date**: 2026-03-16 | **Status**: APPROVED
>
> This document defines how feature flags control rollouts, gate features by billing tier,
> enable or disable capabilities per property, and serve as emergency kill switches.
> Every new feature that is not universally available must be behind a feature flag.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Architecture](#2-architecture)
3. [Flag Types](#3-flag-types)
4. [Data Model](#4-data-model)
5. [Developer API](#5-developer-api)
6. [Admin UI](#6-admin-ui)
7. [Flag Lifecycle](#7-flag-lifecycle)
8. [Tier Integration](#8-tier-integration)
9. [Naming Convention](#9-naming-convention)
10. [Monitoring & Cleanup](#10-monitoring--cleanup)
11. [Edge Cases](#11-edge-cases)
12. [Developer Checklist](#12-developer-checklist)

---

## 1. Purpose

Feature flags solve four problems:

| Problem                   | How Flags Solve It                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Gradual rollouts**      | Deploy code to production but expose it to 10%, then 50%, then 100% of users.                            |
| **Billing tier gating**   | Starter properties cannot access Professional-only features. The flag resolves to `false` automatically. |
| **Per-property control**  | Enable a beta feature for one property without affecting others.                                         |
| **Emergency kill switch** | A Super Admin disables a broken feature globally in one click, without a code deploy.                    |

### Rules

- Every feature that ships behind a flag must work correctly when the flag is `false`. The default
  experience (flag off) must never break.
- Feature flags are NOT a replacement for environment variables. Environment variables control
  infrastructure (database URLs, API keys). Feature flags control product behavior.
- Feature flags are temporary. Every flag must eventually reach 100% and be removed from the codebase.
  Permanent gating uses the tier system, not flags.

---

## 2. Architecture

### Storage Layer

Feature flags are stored in PostgreSQL. This is the source of truth.

### Cache Layer

Flag values are cached in Redis with a **60-second TTL**. This means:

- A flag change takes at most 60 seconds to propagate.
- For emergency kill switches, a cache-busting endpoint forces immediate propagation.
- If Redis is unavailable, the system falls back to direct PostgreSQL reads.

### Resolution Flow

```
Request arrives
  → Middleware reads propertyId from JWT
  → Check Redis cache for propertyId flags
  → If cache miss, query PostgreSQL
  → Store in Redis with 60s TTL
  → Attach resolved flags to request context
  → Server Component / API route reads flags from context
  → Client Components receive flags via React context provider
```

### Client-Side Delivery

Flags are resolved on the server and passed to the client through a `<FeatureFlagProvider>`.
The client never calls the database or Redis directly. This prevents flag flickering and ensures
consistent rendering between server and client.

```typescript
// app/[locale]/layout.tsx
import { FeatureFlagProvider } from '@/lib/feature-flags/provider';

export default async function Layout({ children }) {
  const flags = await resolveFlags(propertyId);
  return (
    <FeatureFlagProvider flags={flags}>
      {children}
    </FeatureFlagProvider>
  );
}
```

---

## 3. Flag Types

### Boolean Flag

The simplest type. The feature is either on or off for a given property.

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| **Use case**   | Enable or disable a feature per property                            |
| **Resolution** | Check `propertyOverrides[propertyId]` → fall back to `defaultValue` |
| **Example**    | `training-lms` is `true` for Property A, `false` for Property B     |

### Percentage Rollout Flag

The feature is enabled for X% of users within a property. The assignment is deterministic:
it uses a hash of `userId + flagKey` so the same user always gets the same result.

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| **Use case**    | Gradual rollout to catch issues before 100%                          |
| **Resolution**  | `hash(userId + flagKey) % 100 < rolloutPercentage`                   |
| **Consistency** | Same user always resolves to the same value for a given flag         |
| **Example**     | `new-dashboard-layout` at 25% means 1 in 4 users sees the new layout |

### User Segment Flag

The feature is enabled for specific roles or specific user IDs.

| Field          | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| **Use case**   | Beta testing with specific staff, or role-gated features                        |
| **Resolution** | Check if current user's role or userId is in the segment list                   |
| **Example**    | `advanced-reports` enabled only for `property_manager` and `board_member` roles |

### Tier-Gated Flag

The feature is automatically enabled or disabled based on the property's subscription tier.

| Field          | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| **Use case**   | Features that are only available on higher-tier plans                               |
| **Resolution** | Compare property tier to flag's `tierRequirement`. If tier >= requirement, enabled. |
| **Example**    | `api-webhooks` requires `professional` tier. Starter properties resolve to `false`. |

---

## 4. Data Model

### FeatureFlag Table

```sql
CREATE TABLE feature_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  flag_type       VARCHAR(20) NOT NULL DEFAULT 'boolean',
                  -- 'boolean' | 'percentage' | 'segment' | 'tier'
  default_value   BOOLEAN NOT NULL DEFAULT false,
  rollout_pct     INTEGER CHECK (rollout_pct >= 0 AND rollout_pct <= 100),
  segment         JSONB,
                  -- { "roles": ["property_manager"], "userIds": ["uuid1", "uuid2"] }
  tier_requirement VARCHAR(20),
                  -- 'starter' | 'professional' | 'enterprise'
  property_overrides JSONB NOT NULL DEFAULT '{}',
                  -- { "propertyId1": true, "propertyId2": false }
  is_kill_switched BOOLEAN NOT NULL DEFAULT false,
                  -- If true, flag resolves to false for ALL properties regardless of other settings
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
```

### FeatureFlagAudit Table

Every change to a feature flag is logged for compliance and debugging:

```sql
CREATE TABLE feature_flag_audit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id         UUID NOT NULL REFERENCES feature_flags(id),
  action          VARCHAR(20) NOT NULL,
                  -- 'created' | 'updated' | 'kill_switched' | 'deleted'
  previous_value  JSONB,
  new_value       JSONB,
  changed_by      UUID NOT NULL REFERENCES users(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. Developer API

### Server Components & API Routes

```typescript
import { getFeatureFlags } from '@/lib/feature-flags/server';

export default async function PackagePage() {
  const flags = await getFeatureFlags(propertyId);

  return (
    <div>
      <PackageList />
      {flags.isEnabled('package-photo-capture') && <PhotoCaptureButton />}
    </div>
  );
}
```

### Client Components

```typescript
'use client';
import { useFeatureFlags } from '@/lib/feature-flags/client';

export function AmenityBooking() {
  const { isEnabled } = useFeatureFlags();

  return (
    <div>
      <BookingForm />
      {isEnabled('amenity-payments') && <PaymentSection />}
    </div>
  );
}
```

### API Route Guards

```typescript
// app/api/webhooks/route.ts
import { requireFlag } from '@/lib/feature-flags/guard';

export async function POST(request: Request) {
  await requireFlag('api-webhooks', propertyId);
  // If flag is disabled, requireFlag throws a 403 response automatically
  // ...handle webhook
}
```

### Type Safety

All flag keys are defined in a central TypeScript type:

```typescript
// src/lib/feature-flags/keys.ts
export type FeatureFlagKey =
  | 'amenity-payments'
  | 'package-photo-capture'
  | 'training-lms'
  | 'api-webhooks'
  | 'advanced-reports'
  | 'new-dashboard-layout'
  | 'classified-ads'
  | 'sms-notifications'
  | 'emergency-broadcast';
```

The `isEnabled()` function only accepts values from this type. Adding a new flag requires
updating this file, which makes all flags discoverable via TypeScript autocomplete.

---

## 6. Admin UI

Located at **Settings → Feature Flags** (Super Admin only).

### Flag Table

| Column          | Content                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **Flag Name**   | Human-readable name derived from the key (e.g., `amenity-payments` → "Amenity Payments")         |
| **Description** | One-line explanation of what the flag controls                                                   |
| **Type**        | Badge: Boolean / Percentage / Segment / Tier                                                     |
| **Status**      | Green dot (enabled), red dot (disabled), orange dot (partial rollout), black dot (kill switched) |
| **Properties**  | Count of properties where this flag is enabled (e.g., "12 / 47 properties")                      |
| **Actions**     | Toggle switch, Edit button, Kill Switch button (red, requires confirmation)                      |

### Toggle Behavior

- Clicking the toggle changes the `default_value` for all properties without overrides.
- Properties with explicit overrides are unaffected by the default toggle.
- A confirmation dialog shows: "This will affect X properties. Proceed?"

### Rollout Slider

For percentage flags, a slider from 0% to 100% with:

- Real-time preview: "This will enable the feature for approximately 234 users across 12 properties"
- Step increments: 1%, 5%, 10%, 25%, 50%, 100% quick buttons
- History: "Changed from 10% to 25% by admin@property.com 3 hours ago"

### Kill Switch

- A red button labeled "Kill Switch" on every flag row.
- Clicking it shows a confirmation: "This will immediately disable {flag name} for ALL properties. This overrides all property-level settings."
- Sets `is_kill_switched = true`. Flag resolves to `false` everywhere.
- Busts the Redis cache immediately (no 60-second wait).
- Only Super Admin can activate or deactivate kill switches.
- Kill switch activation is logged in the audit trail with timestamp and actor.

---

## 7. Flag Lifecycle

Every feature flag goes through these stages:

| Stage             | Description                                                                                    | Who              |
| ----------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| **Proposed**      | Developer creates the flag key in a PR. Flag does not exist in the database yet.               | Developer        |
| **Development**   | Flag is created in the database with `default_value: false`. Feature is coded behind the flag. | Developer        |
| **Staging**       | Flag is enabled on staging environment for QA testing.                                         | Developer / QA   |
| **Canary (10%)**  | Flag enabled for 10% of production users. Monitor error rates and feedback.                    | Engineering Lead |
| **Rollout (50%)** | Expanded to 50%. Monitor for 48 hours minimum.                                                 | Engineering Lead |
| **GA (100%)**     | Flag set to 100%. Feature is generally available.                                              | Product Manager  |
| **Cleanup**       | Remove the flag check from code. Delete the flag from the database. Close the tracking ticket. | Developer        |

### Cleanup Rules

- A flag at 100% for more than 90 days triggers a "stale flag" alert in the monitoring dashboard.
- The developer who created the flag is responsible for cleanup.
- Cleanup is a separate PR that removes all `isEnabled('flag-key')` checks and the key from the
  `FeatureFlagKey` type. This PR must not change any behavior — the feature should work identically
  with or without the flag check when the flag is at 100%.

---

## 8. Tier Integration

### Tier Hierarchy

```
starter < professional < enterprise
```

### Tier-Flag Mapping (Central Config)

```typescript
// src/lib/feature-flags/tier-config.ts
export const tierFeatures: Record<FeatureFlagKey, Tier | null> = {
  'amenity-payments': 'professional',
  'api-webhooks': 'enterprise',
  'advanced-reports': 'professional',
  'training-lms': 'professional',
  'sms-notifications': 'professional',
  'emergency-broadcast': 'enterprise',
  'classified-ads': null, // Available on all tiers
  'package-photo-capture': null,
};
```

### Resolution with Tiers

1. If the flag has `is_kill_switched = true`, resolve to `false`. Stop.
2. If the flag has a `tier_requirement`, check the property's tier. If the property tier is lower
   than the requirement, resolve to `false`. Stop.
3. If the flag has a `property_overrides[propertyId]`, use that value. Stop.
4. Use the flag's `default_value`.

### Super Admin Override

A Super Admin can manually enable a tier-gated flag for a specific property, regardless of that
property's tier. This is used for:

- Free trials of premium features
- Demo accounts for sales team
- Temporary access during migration between tiers

The override is stored in `property_overrides` and logged in the audit trail.

---

## 9. Naming Convention

| Rule                     | Example                                                         |
| ------------------------ | --------------------------------------------------------------- |
| Use kebab-case           | `amenity-payments`, not `amenityPayments`                       |
| Prefix with module name  | `package-photo-capture`, `training-lms`, `security-camera-feed` |
| Use positive naming      | `sms-notifications` (on = enabled), not `disable-sms`           |
| Keep under 40 characters | Short enough to display in the admin UI without truncation      |
| No version numbers       | `new-dashboard-layout`, not `dashboard-layout-v2`               |

---

## 10. Monitoring & Cleanup

### Metrics Tracked

| Metric                         | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| **Evaluation count**           | How many times a flag is checked per hour, per property |
| **Unique users evaluated**     | How many distinct users trigger the flag check          |
| **Time since last evaluation** | Flags not evaluated in 30+ days may be dead code        |
| **Time at 100%**               | Flags at 100% for 90+ days need cleanup                 |
| **Kill switch activations**    | Count and recency of emergency disables                 |

### Stale Flag Detection

A scheduled job runs weekly and reports:

- Flags at 100% for more than 90 days → "Ready for cleanup"
- Flags at 0% for more than 30 days → "Possibly abandoned"
- Flags not evaluated in 30+ days → "Possibly dead code"

The report is emailed to the engineering team lead and posted to the team's notification channel.

---

## 11. Edge Cases

### Flag Deleted While User Has Feature Open

If a flag is deleted from the database while a user is actively using the feature:

- The cached value in Redis continues to serve for up to 60 seconds.
- After cache expiry, `getFeatureFlags` returns `false` for unknown keys (safe default).
- The UI component behind the flag unmounts on the next server render or page navigation.
- No error is thrown. The feature simply disappears.

### Concurrent Flag Updates

Two admins editing the same flag simultaneously:

- The database uses optimistic locking (`updated_at` check).
- If a conflict is detected, the second admin sees: "This flag was updated by {name} at {time}.
  Please refresh and try again."

### Cache Poisoning

If Redis contains a stale or incorrect flag value:

- The 60-second TTL limits exposure.
- Super Admin can force a cache flush from the admin UI (Settings → System → Clear Flag Cache).
- The cache-busting endpoint is rate-limited to prevent abuse.

### Flag Resolution During Tier Downgrade

If a property downgrades from Professional to Starter:

- All tier-gated flags for Professional resolve to `false` immediately.
- Any active sessions see the change on their next page load (server render).
- In-progress actions (e.g., a form half-filled) are not interrupted, but submission may fail
  if the API route also checks the flag.

---

## 12. Developer Checklist

Before submitting a PR that adds a new feature flag:

- [ ] Flag key added to `FeatureFlagKey` type in `keys.ts`
- [ ] Flag key follows naming convention (kebab-case, module-prefixed)
- [ ] Feature works correctly when flag is `false` (no errors, no broken UI)
- [ ] Feature works correctly when flag is `true`
- [ ] Tier mapping added to `tier-config.ts` if this is a paid feature
- [ ] Database migration creates the flag record with `default_value: false`
- [ ] PR description includes the rollout plan (canary → rollout → GA timeline)
- [ ] Cleanup ticket created in the backlog with a due date

---

_Last updated: 2026-03-16_
