# Concierge — Analytics Framework

> **Version**: 1.0 | **Date**: 2026-03-16 | **Status**: APPROVED
>
> This document defines how the Concierge platform collects, stores, and visualizes product
> analytics. The system is privacy-respecting by design: no personally identifiable information
> (PII) is ever included in analytics events. All implementations must comply with PIPEDA and GDPR.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Provider Selection](#2-provider-selection)
3. [Event Taxonomy](#3-event-taxonomy)
4. [Implementation Patterns](#4-implementation-patterns)
5. [Key Metrics](#5-key-metrics)
6. [Funnel Analysis](#6-funnel-analysis)
7. [Super Admin Analytics Dashboard](#7-super-admin-analytics-dashboard)
8. [A/B Testing (v2)](#8-ab-testing-v2)
9. [Data Retention & Privacy](#9-data-retention--privacy)
10. [Opt-Out Mechanism](#10-opt-out-mechanism)
11. [Developer Checklist](#11-developer-checklist)

---

## 1. Philosophy

### Core Principles

| Principle                   | Rule                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **No PII in events**        | Never include userId, email, name, IP address, unit number, or any data that identifies a person. Use hashed, anonymized identifiers only. |
| **Property-level analysis** | Analytics answer "How is Property X using feature Y?" not "What is User Z doing?"                                                          |
| **Opt-out respected**       | Residents can disable analytics tracking. Staff tracking is mandatory for operational monitoring.                                          |
| **Minimal collection**      | Only collect events that inform a product decision. No "track everything and figure it out later."                                         |
| **Compliance first**        | PIPEDA (Canada), GDPR (EU future expansion), and provincial privacy laws govern all data collection.                                       |

### What We Track

- Which features are used and how often (adoption)
- Where users drop off in multi-step flows (funnels)
- How long it takes to complete key tasks (performance)
- Which properties are at risk of churn (engagement trends)

### What We NEVER Track

- Individual user behavior or browsing patterns
- Content of messages, announcements, or maintenance requests
- Personal details of residents, staff, or visitors
- Keystrokes, mouse movements, or session recordings
- Data that could identify a specific person when combined with other fields

---

## 2. Provider Selection

| Use Case              | Provider  | Reason                                                                                                             |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| **Product analytics** | PostHog   | Open-source, self-hosted option for data sovereignty, feature flag integration, funnel analysis, retention charts. |
| **Marketing pages**   | Plausible | Lightweight (< 1 KB script), cookie-free, GDPR-compliant out of the box, simple page view tracking.                |

### PostHog Configuration

| Setting               | Value                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Deployment**        | Self-hosted on AWS (same region as primary database) for PIPEDA compliance              |
| **Data residency**    | Canada (ca-central-1)                                                                   |
| **Autocapture**       | Disabled. All events are manually instrumented for precision.                           |
| **Session recording** | Disabled. Privacy requirement.                                                          |
| **Heatmaps**          | Disabled. Privacy requirement.                                                          |
| **Feature flags**     | Disabled in PostHog. Concierge uses its own feature flag system (see FEATURE-FLAGS.md). |

### Plausible Configuration

| Setting           | Value                                                   |
| ----------------- | ------------------------------------------------------- |
| **Deployment**    | Plausible Cloud (EU-hosted) or self-hosted              |
| **Tracking**      | Cookie-free, no personal data collected                 |
| **Pages tracked** | Marketing site only: homepage, pricing, features, blog  |
| **Not tracked**   | Authenticated application pages (PostHog handles those) |

---

## 3. Event Taxonomy

### Naming Convention

All events follow the pattern: `{module}.{action}`

| Module         | Actions                                                             | Examples                                      |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `package`      | `created`, `released`, `notified`, `searched`, `exported`           | `package.created`, `package.released`         |
| `maintenance`  | `created`, `assigned`, `statusChanged`, `resolved`, `commented`     | `maintenance.created`, `maintenance.resolved` |
| `amenity`      | `booked`, `cancelled`, `approved`, `rejected`, `searched`           | `amenity.booked`, `amenity.cancelled`         |
| `security`     | `incidentCreated`, `visitorLogged`, `fobIssued`, `violationCreated` | `security.incidentCreated`                    |
| `announcement` | `created`, `published`, `viewed`                                    | `announcement.published`                      |
| `report`       | `generated`, `exported`, `scheduled`                                | `report.exported`                             |
| `admin`        | `eventTypeCreated`, `userInvited`, `settingsUpdated`, `tierChanged` | `admin.userInvited`                           |
| `auth`         | `login`, `logout`, `passwordReset`, `2faEnabled`, `2faDisabled`     | `auth.login`                                  |
| `onboarding`   | `started`, `stepCompleted`, `completed`, `abandoned`                | `onboarding.stepCompleted`                    |
| `search`       | `performed`, `noResults`, `resultClicked`                           | `search.performed`                            |

### Event Properties

Every event includes these base properties:

| Property     | Type     | Description                                                                        |
| ------------ | -------- | ---------------------------------------------------------------------------------- |
| `propertyId` | string   | SHA-256 hash of the property UUID. Not the raw UUID.                               |
| `role`       | string   | The user's role at the time of the event (e.g., `front_desk`, `property_manager`). |
| `timestamp`  | ISO 8601 | When the event occurred, in UTC.                                                   |
| `sessionId`  | string   | Random session identifier, not linked to any user. Resets on logout.               |

Some events include additional properties:

| Event                      | Additional Properties                                                              |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `package.created`          | `courier` (e.g., "fedex", "ups", "amazon"), `hasPhoto` (boolean)                   |
| `maintenance.created`      | `category` (e.g., "plumbing", "electrical"), `priority` (e.g., "urgent", "normal") |
| `amenity.booked`           | `amenityType` (e.g., "party_room", "gym"), `daysInAdvance` (integer)               |
| `onboarding.stepCompleted` | `stepNumber` (1-8), `stepName` (e.g., "property_info", "unit_import")              |
| `report.exported`          | `reportType` (e.g., "packages", "maintenance"), `format` (e.g., "pdf", "excel")    |
| `search.performed`         | `module` (e.g., "global", "packages"), `resultCount` (integer)                     |
| `auth.login`               | `method` (e.g., "email_password", "2fa")                                           |

### Properties That Are NEVER Included

These fields must never appear in any analytics event, in any form:

- `userId` or any user identifier (raw or hashed)
- `email` or `phone`
- `name` (first, last, or full)
- `unitNumber`
- `ipAddress`
- Content of any text field (description, comments, notes)
- File names or URLs of uploaded documents or photos

---

## 4. Implementation Patterns

### Client-Side Tracking

```typescript
// src/lib/analytics/client.ts
import posthog from 'posthog-js';

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (isOptedOut()) return; // Respect resident opt-out

  posthog.capture(event, {
    ...properties,
    propertyId: getHashedPropertyId(),
    role: getCurrentRole(),
  });
}
```

Usage in a Client Component:

```typescript
'use client';
import { track } from '@/lib/analytics/client';

function handlePackageReceive(courier: string) {
  // ... business logic ...
  track('package.created', { courier, hasPhoto: !!photo });
}
```

### Server-Side Tracking

```typescript
// src/lib/analytics/server.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: process.env.POSTHOG_HOST,
});

export function trackServer(
  event: AnalyticsEvent,
  properties: Record<string, unknown>,
  context: { propertyId: string; role: string },
) {
  posthog.capture({
    distinctId: hashPropertyId(context.propertyId), // Property-level, not user-level
    event,
    properties: {
      ...properties,
      role: context.role,
    },
  });
}
```

Usage in an API route:

```typescript
// app/api/maintenance/route.ts
import { trackServer } from '@/lib/analytics/server';

export async function POST(request: Request) {
  // ... create maintenance request ...
  trackServer('maintenance.created', { category, priority }, { propertyId, role });
}
```

### Type Safety

All event names and their allowed properties are defined in a central type:

```typescript
// src/lib/analytics/events.ts
export type AnalyticsEvent =
  | 'package.created'
  | 'package.released'
  | 'package.notified'
  | 'maintenance.created'
  | 'maintenance.assigned'
  | 'maintenance.resolved'
  | 'amenity.booked'
  | 'amenity.cancelled'
  | 'security.incidentCreated'
  | 'announcement.published'
  | 'report.exported'
  | 'auth.login'
  | 'auth.logout'
  | 'onboarding.stepCompleted'
  | 'onboarding.completed'
  | 'search.performed';
```

The `track()` and `trackServer()` functions only accept values from this type.

---

## 5. Key Metrics

### Engagement Metrics

| Metric            | Definition                        | How Calculated                                          |
| ----------------- | --------------------------------- | ------------------------------------------------------- |
| **DAU**           | Daily Active Users per property   | Unique sessions with at least 1 event per day           |
| **WAU**           | Weekly Active Users per property  | Unique sessions with at least 1 event per 7-day period  |
| **MAU**           | Monthly Active Users per property | Unique sessions with at least 1 event per 30-day period |
| **DAU/MAU ratio** | Stickiness indicator              | DAU divided by MAU. Target: > 0.3                       |

### Feature Adoption

| Metric                 | Definition                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| **Module adoption**    | % of properties that have used a module at least once in the last 30 days |
| **Feature depth**      | Average number of distinct actions per module per property per week       |
| **New feature uptake** | % of properties using a feature within 14 days of its launch              |

### Onboarding Metrics

| Metric                     | Definition                                        | Target                            |
| -------------------------- | ------------------------------------------------- | --------------------------------- |
| **Time to first value**    | Time from property creation to first event logged | < 30 minutes                      |
| **Wizard completion rate** | % of properties completing all 8 onboarding steps | > 80%                             |
| **Drop-off step**          | Which wizard step has the highest abandonment     | Optimize the worst step quarterly |

### Churn Indicators

| Signal                   | Threshold                                      | Action                        |
| ------------------------ | ---------------------------------------------- | ----------------------------- |
| **Login frequency drop** | 50% decline in weekly logins over 4 weeks      | Alert Customer Success team   |
| **Feature usage drop**   | Property stops using a module they used weekly | Alert Customer Success team   |
| **Admin inactivity**     | Property admin has not logged in for 14+ days  | Automated re-engagement email |
| **Support ticket spike** | 3+ tickets in 7 days from the same property    | Alert Customer Success team   |

---

## 6. Funnel Analysis

### Onboarding Funnel

```
Property Created
  → Step 1: Property Information (name, address, timezone)
  → Step 2: Upload Unit List (CSV import)
  → Step 3: Configure Event Types
  → Step 4: Invite Staff Members
  → Step 5: Set Up Amenities
  → Step 6: Configure Notifications
  → Step 7: Brand Settings (logo, colors)
  → Step 8: Go Live
```

Each step fires `onboarding.stepCompleted` with `stepNumber` and `stepName`. The funnel
visualization shows drop-off rate between each step.

### Package Lifecycle Funnel

```
package.created → package.notified → package.released
```

Measures: average time between steps, % of packages that are never released.

### Maintenance Request Funnel

```
maintenance.created → maintenance.assigned → maintenance.statusChanged → maintenance.resolved
```

Measures: average resolution time, % of requests that stall at "assigned" for more than 48 hours.

### Amenity Booking Funnel

```
amenity.searched → amenity.booked → amenity.approved (if approval required)
```

Measures: search-to-book conversion rate, average approval time.

---

## 7. Super Admin Analytics Dashboard

This dashboard is accessible only to Super Admin users at **System → Analytics**.

### Dashboard Sections

| Section                      | Content                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Platform Health**          | Total active properties, total events this month, API response time p50/p95, error rate                                |
| **Feature Adoption Heatmap** | Grid of modules (rows) vs properties (columns). Color intensity = usage frequency. Identifies unused modules.          |
| **Onboarding Funnel**        | Visual funnel chart showing conversion between each onboarding step. Click a step to see which properties dropped off. |
| **Engagement Trends**        | Line chart: DAU, WAU, MAU over time. Filterable by property, role, module.                                             |
| **Churn Risk**               | Table of properties sorted by churn risk score. Score based on login frequency decline + feature usage decline.        |
| **Top Events**               | Bar chart of the 20 most frequent events this month. Identifies what the platform is used for most.                    |

### Filters

Every section supports these filters:

- Date range (last 7 days, 30 days, 90 days, custom)
- Property (specific property or all)
- Role (specific role or all)
- Module (specific module or all)

### Export

All dashboard sections can be exported as:

- PNG image (chart)
- CSV (underlying data)
- PDF (full dashboard snapshot)

---

## 8. A/B Testing (v2)

A/B testing integrates with the feature flag system described in `FEATURE-FLAGS.md`.

### How It Works

1. Create a feature flag with `flag_type: 'percentage'` and `rollout_pct: 50`.
2. Users in the 50% who see the feature are the "treatment" group.
3. Users in the other 50% are the "control" group.
4. Both groups emit the same analytics events.
5. PostHog compares metrics between the two groups.

### Statistical Significance

- Minimum sample size: 1,000 events per variant before drawing conclusions.
- Significance threshold: p < 0.05 (95% confidence).
- PostHog calculates this automatically using a Bayesian model.
- Tests run for a minimum of 7 days regardless of sample size (to capture day-of-week effects).

### A/B Test Lifecycle

1. **Hypothesis**: Document what you expect to change and by how much.
2. **Flag setup**: Create the flag at 50% rollout.
3. **Run**: Collect data for 7-30 days.
4. **Analyze**: Review results in PostHog. Check statistical significance.
5. **Decide**: Roll to 100% (winner) or 0% (revert). Document the result.
6. **Cleanup**: Remove the flag per the flag lifecycle in `FEATURE-FLAGS.md`.

---

## 9. Data Retention & Privacy

### Retention Periods

| Data Type           | Retention | Justification                                                                         |
| ------------------- | --------- | ------------------------------------------------------------------------------------- |
| **Raw events**      | 12 months | Sufficient for year-over-year comparison. Longer storage increases compliance risk.   |
| **Aggregated data** | Unlimited | Aggregated counts and averages contain no individual data. Safe to keep indefinitely. |
| **Session data**    | 30 days   | Sessions are short-lived analytical constructs. No reason to keep longer.             |

### Data Subject Access Request (DSAR)

Under PIPEDA and GDPR, individuals can request deletion of their data.

Since analytics events contain no PII and use anonymized property-level identifiers, individual
deletion is not applicable. However, if a property is deleted from the platform:

- All analytics events for that property's hashed ID are deleted within 30 days.
- Aggregated data that included that property is NOT modified (it is already anonymous).

### Compliance Checklist

- [ ] No PII in any analytics event (verified by automated test)
- [ ] PostHog self-hosted in Canada (ca-central-1)
- [ ] Data processing agreement (DPA) signed with PostHog
- [ ] Privacy policy updated to describe analytics collection
- [ ] Cookie consent not required (no cookies used for analytics tracking)

---

## 10. Opt-Out Mechanism

### Residents

Residents can opt out of analytics tracking in **My Account → Privacy → Analytics**.

When opted out:

- The `track()` function checks the opt-out flag and silently drops the event.
- No analytics events are sent for that user's session.
- The opt-out preference is stored in the `users` table as `analyticsOptOut: boolean`.
- Opting out does not affect operational data (event logs, packages, maintenance requests).

### Staff

Staff members cannot opt out of analytics tracking. This is because:

- Staff analytics are used for operational monitoring (e.g., "Are packages being processed?").
- Staff analytics are anonymized at the role level, not the individual level.
- This is documented in the employment/contractor agreement.

### Property-Level Opt-Out

A Property Admin can disable analytics for their entire property in **Settings → Privacy**.
This is a nuclear option that disables all analytics collection for all users at that property.
Super Admin is notified when this happens.

---

## 11. Developer Checklist

Before submitting a PR that adds analytics tracking:

- [ ] Event name follows `{module}.{action}` convention
- [ ] Event name added to `AnalyticsEvent` type in `events.ts`
- [ ] No PII in event properties (no userId, email, name, unit number, IP)
- [ ] `propertyId` is hashed before sending (use `hashPropertyId()`)
- [ ] Resident opt-out is respected (use the `track()` helper, never call PostHog directly)
- [ ] Server-side events use `trackServer()` with explicit context
- [ ] Unit test verifies the event is fired with correct properties
- [ ] Analytics event documented in the event taxonomy table above

---

_Last updated: 2026-03-16_
