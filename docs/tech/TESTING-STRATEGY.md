# Concierge — Testing Strategy

> **Version**: 1.0 | **Date**: 2026-03-16 | **Status**: MANDATORY
>
> This document defines the testing standards, tools, patterns, and requirements for the
> Concierge platform. Zero tolerance for production issues. Every feature must be tested at
> multiple levels before it reaches users. This strategy is referenced by the Security Rulebook
> and the CI/CD pipeline configuration.

---

## Table of Contents

1. [Testing Pyramid](#1-testing-pyramid)
2. [Coverage Requirements](#2-coverage-requirements)
3. [Test Data Factory](#3-test-data-factory)
4. [Test Database](#4-test-database)
5. [Unit Testing](#5-unit-testing)
6. [API Route Testing](#6-api-route-testing)
7. [Component Testing](#7-component-testing)
8. [E2E Testing](#8-e2e-testing)
9. [Accessibility Testing](#9-accessibility-testing)
10. [Performance Testing (v2)](#10-performance-testing-v2)
11. [Security Testing](#11-security-testing)
12. [Staging Environment](#12-staging-environment)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Test Naming Convention](#14-test-naming-convention)
15. [Mocking Rules](#15-mocking-rules)
16. [Developer Checklist](#16-developer-checklist)

---

## 1. Testing Pyramid

The Concierge platform follows the standard testing pyramid. Most tests are fast, isolated unit
tests. Fewer tests are integration tests. The fewest are slow, end-to-end tests.

| Layer           | Percentage       | Tool             | What It Tests                                                               |
| --------------- | ---------------- | ---------------- | --------------------------------------------------------------------------- |
| **Unit**        | 70% of all tests | Vitest           | Isolated functions, Zod schemas, utility helpers, business logic, hooks     |
| **Integration** | 20% of all tests | Vitest + test DB | API routes with real database, middleware chains, multi-module interactions |
| **E2E**         | 10% of all tests | Playwright       | Full user journeys through the browser, critical paths only                 |

### Why This Ratio

- **Unit tests** run in milliseconds. Developers get instant feedback. They catch logic bugs,
  validation errors, and regression in pure functions.
- **Integration tests** catch problems that unit tests miss: database query bugs, middleware
  ordering issues, authorization gaps between modules.
- **E2E tests** are slow (seconds per test) and flaky by nature. They are reserved for the
  critical paths that, if broken, would block users from doing their primary job.

---

## 2. Coverage Requirements

These thresholds are enforced in `vitest.config.ts` and the CI pipeline. A PR cannot merge
if coverage drops below these thresholds.

| Metric                 | Threshold   | Applies To                 |
| ---------------------- | ----------- | -------------------------- |
| **Line coverage**      | 95% minimum | All source files in `src/` |
| **Branch coverage**    | 90% minimum | All source files in `src/` |
| **Function coverage**  | 95% minimum | All source files in `src/` |
| **Statement coverage** | 95% minimum | All source files in `src/` |

### Excluded from Coverage

These paths are excluded from coverage measurement (configured in `vitest.config.ts`):

- `src/**/*.d.ts` — Type declaration files
- `src/**/*.stories.tsx` — Storybook stories
- `src/**/index.ts` — Re-export barrel files
- `src/lib/analytics/**` — Analytics instrumentation (tested via integration tests)
- `prisma/migrations/**` — Database migrations (tested via migration tests)

### Coverage Reports

- **Local**: Run `pnpm test:coverage` to see a coverage report in the terminal.
- **CI**: Coverage report is uploaded as a PR comment showing delta from the base branch.
- **Dashboard**: Coverage trends are tracked over time in the CI dashboard.

---

## 3. Test Data Factory

The test data factory provides helper functions that create realistic test data with sensible
defaults. Every factory function accepts optional overrides for customization.

### Factory Functions

```typescript
// src/test/factories/property.ts
export function createTestProperty(overrides?: Partial<Property>): Property {
  return {
    id: faker.string.uuid(),
    name: faker.company.name() + ' Condos',
    address: faker.location.streetAddress(),
    city: 'Toronto',
    province: 'ON',
    postalCode: faker.helpers.fromRegexp(/[A-Z]\d[A-Z] \d[A-Z]\d/),
    timezone: 'America/Toronto',
    defaultLocale: 'en',
    tier: 'professional',
    ...overrides,
  };
}

// src/test/factories/user.ts
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    role: 'front_desk',
    propertyId: faker.string.uuid(),
    status: 'active',
    ...overrides,
  };
}

// src/test/factories/unit.ts
export function createTestUnit(overrides?: Partial<Unit>): Unit {
  return {
    id: faker.string.uuid(),
    number: faker.number.int({ min: 100, max: 9999 }).toString(),
    floor: faker.number.int({ min: 1, max: 50 }),
    propertyId: faker.string.uuid(),
    ...overrides,
  };
}

// src/test/factories/event.ts
export function createTestEvent(overrides?: Partial<Event>): Event {
  return {
    id: faker.string.uuid(),
    eventTypeId: faker.string.uuid(),
    unitId: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    status: 'open',
    createdBy: faker.string.uuid(),
    createdAt: new Date(),
    comments: faker.lorem.sentence(),
    ...overrides,
  };
}
```

### Deterministic Seeds

For reproducible tests, set a seed before generating data:

```typescript
import { faker } from '@faker-js/faker';

beforeAll(() => {
  faker.seed(12345); // Same seed = same data every time
});
```

### Shared Fixtures

For integration and E2E tests that need a realistic dataset:

```typescript
// src/test/fixtures/standard-property.ts
export async function seedStandardProperty(db: PrismaClient) {
  const property = await db.property.create({ data: createTestProperty() });
  const units = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      db.unit.create({
        data: createTestUnit({ propertyId: property.id, number: String(100 + i) }),
      }),
    ),
  );
  const residents = await Promise.all(
    units.flatMap((unit) =>
      Array.from({ length: 5 }, () =>
        db.user.create({
          data: createTestUser({ propertyId: property.id, unitId: unit.id, role: 'resident' }),
        }),
      ),
    ),
  );
  // ... create 1000 events, 50 maintenance requests, etc.
  return { property, units, residents };
}
```

This fixture creates: 1 property, 100 units, 500 residents, and 1,000 events.

---

## 4. Test Database

### Configuration

| Setting           | Value                                                |
| ----------------- | ---------------------------------------------------- |
| **Database name** | `concierge_test`                                     |
| **Host**          | `localhost` (CI uses a PostgreSQL service container) |
| **Schema sync**   | `prisma migrate deploy` runs before each test suite  |
| **Isolation**     | Transaction rollback pattern (see below)             |

### Transaction Rollback Pattern

Each test runs inside a database transaction that is rolled back after the test completes.
This means tests do not leave data behind and can run in any order.

```typescript
// src/test/helpers/db.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeEach(async () => {
  // Start a transaction
  prisma = new PrismaClient();
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  // Rollback the transaction — all data created during the test is gone
  await prisma.$executeRaw`ROLLBACK`;
  await prisma.$disconnect();
});
```

### Database Cleanup Between Suites

For test suites that cannot use transaction rollback (e.g., tests that commit transactions
as part of their logic), truncate all tables between suites:

```typescript
afterAll(async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
  }
});
```

---

## 5. Unit Testing

### What to Unit Test

| Category            | Examples                                                                              |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Pure functions**  | `formatCurrency()`, `formatDate()`, `hashPropertyId()`, `calculateDataQualityScore()` |
| **Zod schemas**     | Every validation schema: valid input, invalid input, boundary cases, edge cases       |
| **Business logic**  | `resolveFeatureFlag()`, `calculateRolloutPercentage()`, `detectDuplicates()`          |
| **React hooks**     | `useFeatureFlags()`, `useTranslations()`, `usePagination()`                           |
| **Utility helpers** | `slugify()`, `truncate()`, `groupBy()`, `debounce()`                                  |

### Unit Test Example

```typescript
// src/lib/format-currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('should format CAD in English locale', () => {
    expect(formatCurrency(2500, 'en', 'CAD')).toBe('$25.00');
  });

  it('should format CAD in French-Canadian locale', () => {
    expect(formatCurrency(2500, 'fr-CA', 'CAD')).toBe('25,00 $');
  });

  it('should handle zero amount', () => {
    expect(formatCurrency(0, 'en', 'CAD')).toBe('$0.00');
  });

  it('should handle large amounts without overflow', () => {
    expect(formatCurrency(99999999, 'en', 'CAD')).toBe('$999,999.99');
  });
});
```

---

## 6. API Route Testing

API routes are tested by calling the route handler function directly. No HTTP server is started.

### Pattern

```typescript
// app/api/packages/route.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { withAuth } from '@/test/helpers/auth';
import { createTestProperty, createTestUnit } from '@/test/factories';

describe('POST /api/packages', () => {
  it('should create a package when user has front_desk role', async () => {
    const property = await seedProperty();
    const unit = await seedUnit({ propertyId: property.id });

    const request = new Request('http://localhost/api/packages', {
      method: 'POST',
      body: JSON.stringify({ unitId: unit.id, courier: 'fedex', notes: 'Leave at door' }),
    });

    const response = await POST(
      withAuth(request, {
        userId: 'staff-1',
        role: 'front_desk',
        propertyId: property.id,
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.courier).toBe('fedex');
    expect(body.referenceNumber).toBeDefined();
  });

  it('should return 403 when user has resident role', async () => {
    const request = new Request('http://localhost/api/packages', {
      method: 'POST',
      body: JSON.stringify({ unitId: 'unit-1', courier: 'fedex' }),
    });

    const response = await POST(
      withAuth(request, {
        userId: 'resident-1',
        role: 'resident',
        propertyId: 'property-1',
      }),
    );

    expect(response.status).toBe(403);
  });
});
```

### Middleware Testing

Each middleware is tested independently:

```typescript
// src/middleware/rate-limit.test.ts
describe('rateLimitMiddleware', () => {
  it('should allow requests under the limit', () => {
    /* ... */
  });
  it('should return 429 when limit is exceeded', () => {
    /* ... */
  });
  it('should reset the counter after the window expires', () => {
    /* ... */
  });
});
```

### What to Assert

For every API route test, assert:

- Response status code (200, 201, 400, 401, 403, 404, 422, 500)
- Response body structure and content
- Response headers (Content-Type, Cache-Control)
- Database state (record was created, updated, or deleted)
- Audit trail entry was created (for write operations)
- Analytics event was fired (mock the analytics module)

---

## 7. Component Testing

### Tools

| Tool                          | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `@testing-library/react`      | Render components and query the DOM                   |
| `@testing-library/user-event` | Simulate user interactions (clicks, typing, keyboard) |
| `vitest`                      | Test runner and assertions                            |
| `axe-core` + `vitest-axe`     | Accessibility checks on every component               |
| `msw` (Mock Service Worker)   | Mock API responses for components that fetch data     |

### Component Test Example

```typescript
// src/components/package-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { PackageCard } from './package-card';

describe('PackageCard', () => {
  const defaultProps = {
    id: 'pkg-1',
    courier: 'FedEx',
    unit: '305',
    receivedAt: new Date('2026-03-16T10:00:00Z'),
    status: 'pending' as const,
    onRelease: vi.fn(),
  };

  it('should display courier name and unit number', () => {
    render(<PackageCard {...defaultProps} />);
    expect(screen.getByText('FedEx')).toBeInTheDocument();
    expect(screen.getByText('305')).toBeInTheDocument();
  });

  it('should call onRelease when release button is clicked', async () => {
    const user = userEvent.setup();
    render(<PackageCard {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /release/i }));
    expect(defaultProps.onRelease).toHaveBeenCalledWith('pkg-1');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PackageCard {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing Rules

- **Test behavior, not implementation.** Test what the user sees and does, not internal state.
- **Never test CSS classes or styles.** Test visible outcomes: "button is disabled", not "button has class disabled".
- **Use accessible queries first.** Prefer `getByRole`, `getByLabelText`, `getByText` over `getByTestId`.
- **Every component test includes an `axe()` check.** This is not optional.

---

## 8. E2E Testing

### Tool: Playwright

| Setting         | Value                                                     |
| --------------- | --------------------------------------------------------- |
| **Browser**     | Chromium (primary), Firefox and WebKit (smoke tests only) |
| **Base URL**    | `http://localhost:3000` (local) or staging URL (CI)       |
| **Parallelism** | Up to 4 workers in CI                                     |
| **Retries**     | 1 retry on failure in CI (0 retries locally)              |
| **Timeout**     | 30 seconds per test, 10 seconds per action                |

### Critical User Journeys

These are the E2E test scenarios. Each tests a complete workflow from start to finish.

#### 1. Login Flow

```
Navigate to /login
  → Enter email
  → Enter password
  → Submit
  → Enter 2FA code (if enabled)
  → Verify dashboard loads
  → Verify correct role-based navigation is shown
```

#### 2. Package Lifecycle

```
Login as front_desk
  → Navigate to Packages
  → Click "Receive Package"
  → Fill form (unit, courier, notes)
  → Submit
  → Verify package appears in list
  → Click "Notify Resident"
  → Verify notification sent indicator
  → Click "Release Package"
  → Fill release form (released to, signature)
  → Verify package status changes to "Released"
```

#### 3. Maintenance Request

```
Login as resident
  → Navigate to Maintenance
  → Click "New Request"
  → Fill form (category, description, photos, permission to enter)
  → Submit
  → Verify request appears in list

Login as property_manager
  → Navigate to Maintenance
  → Find the request
  → Assign to staff member
  → Verify status changes to "Assigned"
  → Mark as "In Progress"
  → Mark as "Resolved"
  → Verify closed status
```

#### 4. Amenity Booking

```
Login as resident
  → Navigate to Amenities
  → Select a bookable amenity
  → Choose date and time slot
  → Submit booking
  → Verify confirmation

Login as property_manager (if approval required)
  → Navigate to Amenity Approvals
  → Approve the booking
  → Verify resident sees "Approved" status

Login as resident
  → Cancel the booking
  → Verify cancellation
```

#### 5. Admin Settings

```
Login as property_manager
  → Navigate to Settings → Event Types
  → Create a new event type (name, icon, color)
  → Save
  → Navigate to the event console
  → Verify the new event type appears in the dropdown
  → Create an event with the new type
  → Verify event card shows the correct icon and color
```

#### 6. Onboarding Wizard

```
Login as new property_manager (fresh property)
  → Verify wizard starts automatically
  → Step 1: Enter property information
  → Step 2: Upload unit list (CSV)
  → Step 3: Configure event types
  → Step 4: Invite staff members
  → Step 5: Set up amenities
  → Step 6: Configure notifications
  → Step 7: Brand settings (logo, colors)
  → Step 8: Go live
  → Verify dashboard loads with configured data
```

### Responsive Testing

Each E2E scenario runs at three viewport widths:

| Viewport            | Width  | Height | Device                        |
| ------------------- | ------ | ------ | ----------------------------- |
| **Desktop monitor** | 1920px | 1080px | Primary target (99% of users) |
| **Tablet**          | 768px  | 1024px | Secondary                     |
| **Mobile**          | 375px  | 812px  | Tertiary                      |

---

## 9. Accessibility Testing

### Automated (Every Test)

- `axe-core` runs on every component test via `vitest-axe`.
- `axe-core` runs on every E2E page via Playwright's `@axe-core/playwright`.
- Any violation fails the test. No exceptions.

### Manual Testing Checklist

This checklist is completed before every major release:

- [ ] **Keyboard navigation**: Every interactive element is reachable via Tab key. Focus order is logical.
- [ ] **Screen reader**: Tested with VoiceOver (macOS). All content is announced correctly. All
      form fields have labels. All images have alt text. All status changes are announced via ARIA live regions.
- [ ] **High contrast**: Windows High Contrast Mode renders all text and interactive elements visibly.
- [ ] **Zoom 200%**: Page layout remains usable at 200% browser zoom. No horizontal scrolling.
      No overlapping elements.
- [ ] **Reduced motion**: Animations respect `prefers-reduced-motion`. No essential information
      is conveyed only through animation.

### WCAG 2.2 AA Compliance

Every component must meet WCAG 2.2 Level AA. The compliance matrix is maintained in a spreadsheet
(linked from the project wiki) with one row per component and columns for each applicable criterion.

| Criterion | Category               | Requirement                                         |
| --------- | ---------------------- | --------------------------------------------------- |
| 1.1.1     | Non-text Content       | All images have alt text                            |
| 1.3.1     | Info and Relationships | Semantic HTML, proper heading hierarchy             |
| 1.4.3     | Contrast (Minimum)     | 4.5:1 for normal text, 3:1 for large text           |
| 1.4.11    | Non-text Contrast      | 3:1 for UI components and graphical objects         |
| 2.1.1     | Keyboard               | All functionality available via keyboard            |
| 2.4.7     | Focus Visible          | Focus indicator visible on all interactive elements |
| 3.3.1     | Error Identification   | Errors described in text, not just color            |
| 4.1.2     | Name, Role, Value      | ARIA attributes correct on all custom widgets       |

---

## 10. Performance Testing (v2)

### Tool: k6

Performance testing is introduced in v2 after the core features are stable.

### Scenarios

| Scenario                 | Description                                          | Target                            |
| ------------------------ | ---------------------------------------------------- | --------------------------------- |
| **Concurrent users**     | 100 users performing mixed operations simultaneously | No errors, all SLAs met           |
| **Package intake burst** | 1,000 packages created in 1 hour (busy delivery day) | < 500ms p95 response time         |
| **Concurrent bookings**  | 50 residents booking the same amenity simultaneously | No double-bookings, < 1s response |
| **Report generation**    | 10 concurrent report exports (PDF/Excel)             | < 10s per report                  |
| **Search under load**    | 100 concurrent search queries across 10,000+ records | < 200ms p50                       |

### Response Time SLAs

| Metric              | Target                                      |
| ------------------- | ------------------------------------------- |
| **API p50**         | < 200ms                                     |
| **API p95**         | < 500ms                                     |
| **API p99**         | < 1,000ms                                   |
| **Page load (TTI)** | < 2,000ms on desktop, < 3,000ms on mobile   |
| **Database query**  | No single query > 100ms in normal operation |

### Database Performance Rules

- Every database query must have an `EXPLAIN ANALYZE` review during code review.
- Queries scanning more than 10,000 rows must use an index.
- N+1 query patterns are caught by a custom Prisma middleware that logs query counts per request.
  More than 10 queries per request triggers a warning in development.

---

## 11. Security Testing

### Static Analysis (SAST)

| Tool                                                  | When                 | What It Catches                                                  |
| ----------------------------------------------------- | -------------------- | ---------------------------------------------------------------- |
| **ESLint security plugin** (`eslint-plugin-security`) | Every PR             | Hardcoded secrets, unsafe regex, eval usage, prototype pollution |
| **TypeScript strict mode**                            | Every PR             | Type safety issues that could lead to runtime vulnerabilities    |
| **gitleaks**                                          | Pre-commit hook + CI | API keys, tokens, passwords committed to the repository          |

### Dependency Auditing

| Check                     | Command           | When          | Threshold                                                   |
| ------------------------- | ----------------- | ------------- | ----------------------------------------------------------- |
| **Known vulnerabilities** | `pnpm audit`      | Every PR      | Block on high or critical severity                          |
| **License compliance**    | `license-checker` | Weekly CI job | Block on copyleft licenses (GPL) in production dependencies |
| **Outdated packages**     | `pnpm outdated`   | Weekly CI job | Report only (no block)                                      |

### Dynamic Analysis (DAST)

| Tool             | When                              | Scope                                               |
| ---------------- | --------------------------------- | --------------------------------------------------- |
| **OWASP ZAP**    | After every deployment to staging | Full application scan including authenticated pages |
| **ZAP API scan** | After every deployment to staging | All API routes with authentication tokens           |

ZAP findings are categorized by severity. High and Critical findings block production deployment.

### Penetration Testing

- **Frequency**: Annual third-party penetration test by a certified security firm.
- **Scope**: Full application including API, authentication, authorization, file uploads, and
  multi-tenant isolation.
- **Remediation SLA**: Critical findings fixed within 72 hours. High within 2 weeks. Medium
  within 30 days.

### Secret Scanning

- **Pre-commit**: `gitleaks` runs as a pre-commit hook. Commits containing secrets are rejected.
- **CI**: `gitleaks` runs in CI as a safety net for developers who bypass the pre-commit hook.
- **Monitoring**: GitHub Advanced Security (or equivalent) continuously scans the repository history.

---

## 12. Staging Environment

### Configuration

| Setting           | Value                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| **URL**           | `staging.concierge.com`                                                      |
| **Deployment**    | Vercel preview environment, auto-deployed from `staging` branch              |
| **Database**      | Separate PostgreSQL instance with anonymized production data                 |
| **Services**      | Same third-party services as production (Stripe test mode, SendGrid sandbox) |
| **Feature flags** | All flags enabled at 100% for full testing coverage                          |

### PR Preview Deployments

Every pull request gets a preview deployment on Vercel. The preview URL is posted as a comment
on the PR. This allows reviewers to test the changes in a live environment before merging.

### Anonymized Data Refresh

Weekly automated job:

1. Export production database (encrypted backup).
2. Replace all PII with faker-generated data (names, emails, phones, addresses).
3. Preserve relationships and data volumes (so performance testing is realistic).
4. Import into staging database.
5. Verify import integrity (row counts match, no orphaned records).

This ensures staging data is realistic in volume and structure but contains no real personal
information.

---

## 13. CI/CD Pipeline

### Pull Request Pipeline

```
PR opened or updated
  → pnpm install (cached)
  → pnpm lint (ESLint + Prettier check)
  → pnpm typecheck (TypeScript strict mode)
  → pnpm test:unit (Vitest unit tests + coverage)
  → pnpm test:integration (Vitest integration tests with test DB)
  → pnpm build (Next.js production build)
  → Vercel preview deploy
  → Post coverage report as PR comment
  → Post preview URL as PR comment
```

If any step fails, the PR cannot be merged. All steps are required.

### Merge to Main Pipeline

```
Merge to main
  → All PR pipeline steps (re-run on merged code)
  → pnpm test:e2e (Playwright E2E tests against preview deploy)
  → OWASP ZAP scan (DAST) against staging
  → Deploy to staging
  → Smoke tests against staging (subset of E2E)
  → Manual approval gate (for production deploy)
  → Deploy to production
  → Post-deploy smoke tests against production
```

### Pipeline Timing Targets

| Step                 | Target Duration |
| -------------------- | --------------- |
| Lint + typecheck     | < 30 seconds    |
| Unit tests           | < 2 minutes     |
| Integration tests    | < 3 minutes     |
| Build                | < 2 minutes     |
| E2E tests            | < 10 minutes    |
| Total PR pipeline    | < 8 minutes     |
| Total merge pipeline | < 25 minutes    |

---

## 14. Test Naming Convention

### File Names

Test files are co-located with their source files:

```
src/lib/format-currency.ts
src/lib/format-currency.test.ts

src/components/package-card.tsx
src/components/package-card.test.tsx

app/api/packages/route.ts
app/api/packages/route.test.ts
```

### Test Structure

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange → Act → Assert
    });
  });
});
```

### Naming Rules

- Start with "should" followed by the expected behavior.
- Include the condition that triggers the behavior using "when".
- Be specific enough that a failing test name tells you what broke without reading the code.

Good: `it('should return 403 when user has resident role')`
Bad: `it('should fail for wrong role')`
Bad: `it('test unauthorized access')`

---

## 15. Mocking Rules

### What to Mock

| Category                  | Example                      | Why                                                        |
| ------------------------- | ---------------------------- | ---------------------------------------------------------- |
| **External APIs**         | Stripe, SendGrid, S3, Twilio | Unreliable in tests, costly, rate-limited                  |
| **Time**                  | `vi.useFakeTimers()`         | For time-dependent logic (token expiry, stale data checks) |
| **Random values**         | `faker.seed(12345)`          | For deterministic test data                                |
| **Environment variables** | `vi.stubEnv()`               | For testing different configurations                       |

### What NOT to Mock

| Category                     | Example                                    | Why                                                           |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **The thing being tested**   | Do not mock the function you are testing   | Defeats the purpose                                           |
| **Database (Prisma)**        | Use real Prisma client against test DB     | Mocking Prisma hides real query bugs                          |
| **Validation schemas (Zod)** | Use real schemas                           | Mocking schemas hides validation gaps                         |
| **Internal modules**         | Business logic called by the route handler | Integration between modules is what integration tests are for |

### MSW (Mock Service Worker) for Component Tests

Components that fetch data use MSW to mock API responses:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/packages', () => {
    return HttpResponse.json([{ id: 'pkg-1', courier: 'FedEx', unit: '305', status: 'pending' }]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Time Mocking

For tests that depend on time (e.g., token expiry, stale data detection):

```typescript
import { vi, describe, it, beforeEach, afterEach } from 'vitest';

describe('token expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should reject expired tokens', () => {
    const token = createToken({ expiresIn: '15m' });
    vi.advanceTimersByTime(16 * 60 * 1000); // 16 minutes
    expect(validateToken(token)).toBe(false);
  });
});
```

---

## 16. Developer Checklist

Before submitting a PR:

- [ ] All new functions have unit tests
- [ ] All new API routes have integration tests
- [ ] All new components have component tests with `axe()` accessibility check
- [ ] Coverage thresholds are met (95% lines, 90% branches, 95% functions)
- [ ] Test names follow the convention: `should [behavior] when [condition]`
- [ ] No mocking of the module being tested
- [ ] External services are mocked (Stripe, SendGrid, S3)
- [ ] Database tests use real Prisma client against test DB
- [ ] Time-dependent tests use `vi.useFakeTimers()`
- [ ] `pnpm test` passes locally before pushing
- [ ] No `test.skip` or `test.todo` in the PR (unless documented in the PR description)

---

_Last updated: 2026-03-16_
