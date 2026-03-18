# Concierge — Enterprise Development Principles

> **Version**: 1.0 | **Date**: 2026-03-17 | **Status**: MANDATORY
>
> This document defines the engineering standards, patterns, and conventions that every developer
> must follow when contributing to the Concierge codebase. Every decision is justified.
> No exceptions without team lead approval and a documented reason.

---

## Table of Contents

1. [Code Architecture](#1-code-architecture)
2. [Naming Conventions](#2-naming-conventions)
3. [Error Handling](#3-error-handling)
4. [Data Fetching Patterns](#4-data-fetching-patterns)
5. [State Management](#5-state-management)
6. [Form Handling](#6-form-handling)
7. [Authentication Patterns](#7-authentication-patterns)
8. [Multi-Tenancy Patterns](#8-multi-tenancy-patterns)
9. [Testing Patterns](#9-testing-patterns)
10. [Security](#10-security)
11. [Performance](#11-performance)
12. [AI Token Optimization](#12-ai-token-optimization)

---

## 1. Code Architecture

### 1.1 Folder Structure

```
src/
├── app/                          # Next.js App Router (pages + API routes)
│   ├── (auth)/                   # Auth layout group: login, forgot-password, etc.
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── activate/page.tsx
│   │   ├── setup-2fa/page.tsx
│   │   └── layout.tsx            # Minimal layout (no sidebar, centered card)
│   ├── (portal)/                 # Authenticated portal layout group
│   │   ├── dashboard/page.tsx
│   │   ├── packages/
│   │   │   ├── page.tsx          # List view
│   │   │   └── [id]/page.tsx     # Detail view
│   │   ├── maintenance/
│   │   ├── events/
│   │   ├── amenities/
│   │   ├── security/
│   │   ├── units/
│   │   ├── residents/
│   │   ├── announcements/
│   │   ├── shift-log/
│   │   ├── training/
│   │   ├── community/
│   │   ├── parking/
│   │   ├── reports/
│   │   ├── my-account/
│   │   └── layout.tsx            # Sidebar + top nav + role-aware navigation
│   ├── (admin)/                  # Admin layout group
│   │   ├── settings/
│   │   │   ├── general/page.tsx
│   │   │   ├── event-types/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── integrations/page.tsx
│   │   │   ├── ai/page.tsx
│   │   │   └── audit-log/page.tsx
│   │   ├── users/page.tsx
│   │   ├── properties/page.tsx
│   │   ├── system-health/page.tsx
│   │   └── layout.tsx            # Admin sidebar layout
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # Auth endpoints
│   │   ├── health/               # Health check endpoints
│   │   ├── csp-report/           # CSP violation reports
│   │   ├── packages/             # Package CRUD
│   │   ├── events/               # Event CRUD
│   │   ├── maintenance/          # Maintenance CRUD
│   │   ├── units/                # Unit CRUD
│   │   ├── users/                # User management
│   │   ├── announcements/        # Announcement CRUD
│   │   ├── amenities/            # Amenity booking
│   │   ├── reports/              # Report generation
│   │   ├── search/               # Global search
│   │   ├── webhooks/             # External webhook delivery
│   │   └── v1/                   # Public API (PRD 26) versioned routes
│   ├── layout.tsx                # Root layout (html, body, providers)
│   ├── error.tsx                 # Global error boundary
│   ├── global-error.tsx          # Root error boundary
│   ├── not-found.tsx             # 404 page
│   └── loading.tsx               # Global loading state
├── components/                   # Shared React components
│   ├── ui/                       # Design system primitives (Button, Input, Card, Badge, etc.)
│   ├── forms/                    # Form components (FormField, FormError, etc.)
│   ├── layout/                   # Layout components (Sidebar, TopNav, PageHeader, etc.)
│   ├── data-display/             # Table, DataGrid, StatCard, EmptyState, etc.
│   └── feedback/                 # Toast, Dialog, AlertDialog, Skeleton, etc.
├── features/                     # Feature-specific components (not shared across features)
│   ├── packages/                 # PackageCard, PackageForm, PackageFilters
│   ├── maintenance/              # MaintenanceForm, MaintenanceTimeline
│   ├── events/                   # EventCard, EventGrid, BatchEventForm
│   ├── security/                 # IncidentForm, VisitorLog, FOBManager
│   ├── amenities/                # BookingCalendar, BookingForm
│   ├── announcements/            # AnnouncementEditor, ChannelSelector
│   ├── units/                    # UnitOverview, UnitInstructions
│   ├── residents/                # ResidentProfile, EmergencyContacts
│   ├── reports/                  # ReportBuilder, ExportButton
│   ├── settings/                 # SettingsForm, EventTypeEditor, RoleEditor
│   └── onboarding/               # WizardStep, WizardProgress
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Auth state and actions
│   ├── use-permissions.ts        # Permission checks
│   ├── use-feature-flags.ts      # Feature flag checks
│   ├── use-pagination.ts         # Pagination state
│   ├── use-debounce.ts           # Debounced values
│   ├── use-media-query.ts        # Responsive breakpoints
│   └── use-local-storage.ts      # Persistent client state
├── lib/                          # Pure utility functions and configuration
│   ├── constants.ts              # App-wide constants (field lengths, pagination defaults)
│   ├── env.ts                    # Environment variable validation (Zod)
│   ├── utils.ts                  # General utilities (cn, formatters)
│   ├── sanitize.ts               # HTML sanitization
│   ├── security-headers.ts       # CSP and security header generation
│   ├── format-currency.ts        # Currency formatting helper
│   ├── format-date.ts            # Date formatting with timezone
│   ├── format-number.ts          # Number formatting (locale-aware)
│   └── feature-flags/            # Feature flag client + server modules
│       ├── client.ts
│       ├── server.ts
│       ├── provider.tsx
│       ├── guard.ts
│       └── keys.ts
├── schemas/                      # Zod validation schemas (shared client + server)
│   ├── common.ts                 # Reusable primitives (email, phone, UUID, pagination)
│   ├── auth.ts                   # Login, register, password reset schemas
│   ├── packages.ts               # Package create/update schemas
│   ├── maintenance.ts            # Maintenance request schemas
│   ├── events.ts                 # Event create/update schemas
│   ├── units.ts                  # Unit create/update schemas
│   ├── users.ts                  # User management schemas
│   ├── amenities.ts              # Booking schemas
│   └── announcements.ts          # Announcement schemas
├── server/                       # Server-only code (never imported by client components)
│   ├── auth/                     # Authentication logic
│   │   ├── jwt.ts                # JWT signing and verification
│   │   ├── password.ts           # Argon2id hashing
│   │   ├── session.ts            # Session management
│   │   └── totp.ts               # TOTP 2FA
│   ├── middleware/                # API middleware chain
│   │   ├── chain.ts              # Middleware composition utility
│   │   ├── auth.ts               # JWT verification middleware
│   │   ├── rbac.ts               # Role-based access control
│   │   ├── tenant.ts             # Multi-tenant scoping
│   │   ├── validate.ts           # Zod schema validation
│   │   ├── rate-limit.ts         # Redis-based rate limiting
│   │   ├── request-id.ts         # Request ID extraction
│   │   └── log-sanitizer.ts      # PII stripping from logs
│   ├── services/                 # Business logic (domain layer)
│   │   ├── package.service.ts
│   │   ├── event.service.ts
│   │   ├── maintenance.service.ts
│   │   ├── amenity.service.ts
│   │   ├── announcement.service.ts
│   │   ├── user.service.ts
│   │   ├── unit.service.ts
│   │   ├── search.service.ts
│   │   ├── notification.service.ts
│   │   ├── report.service.ts
│   │   └── import.service.ts
│   ├── email/                    # Email sending
│   │   ├── sender.ts             # Provider-agnostic email interface
│   │   ├── resend.ts             # Resend implementation
│   │   └── templates/            # React Email templates
│   ├── queues/                   # BullMQ queue definitions
│   │   ├── email.queue.ts
│   │   ├── sms.queue.ts
│   │   ├── push.queue.ts
│   │   ├── webhook.queue.ts
│   │   ├── export.queue.ts
│   │   └── maintenance.queue.ts
│   ├── db.ts                     # Prisma client singleton + tenantScope
│   ├── db-audit.ts               # Audit trail helpers
│   ├── audit.ts                  # Audit entry creation
│   ├── errors.ts                 # Error class hierarchy
│   ├── logger.ts                 # Pino logger instance
│   └── redis.ts                  # Redis client singleton
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Shared types (roles, statuses, API types)
├── test/                         # Test utilities
│   ├── setup.ts                  # Global test setup
│   ├── factories/                # Test data factories
│   │   ├── property.ts
│   │   ├── user.ts
│   │   ├── unit.ts
│   │   └── event.ts
│   ├── fixtures/                 # Seed data for integration tests
│   │   └── standard-property.ts
│   └── helpers/                  # Test helper utilities
│       ├── auth.ts               # withAuth request wrapper
│       └── db.ts                 # Transaction rollback helper
├── middleware.ts                  # Next.js Edge Middleware (CSP, security headers)
└── i18n/                         # Internationalization config
    └── config.ts                 # Locale list, default locale
```

### 1.2 Folder Structure Rules

| Rule                                                                                                         | Justification                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **`app/` is thin**: Pages contain layout and data fetching only. No business logic.                          | Server Components fetch data, Client Components render UI. Business logic lives in `server/services/`.            |
| **`components/` vs `features/`**: Shared components in `components/`, feature-specific in `features/`.       | A `Button` is shared. A `PackageCard` is only used in the packages feature. This prevents circular dependencies.  |
| **`server/` is never imported by client code**: Enforced by Next.js bundler and ESLint rule.                 | Prevents accidental server secrets (DB URL, JWT keys) leaking to the browser bundle.                              |
| **`schemas/` is shared**: Same Zod schemas used by both API routes and React forms.                          | Single source of truth for validation. Client validation is a convenience; server validation is the authority.    |
| **Co-located tests**: Test files sit next to their source files (`foo.ts` + `foo.test.ts`).                  | Easy to find, easy to maintain, clear 1:1 relationship.                                                           |
| **No barrel files for features**: Only `components/ui/index.ts` re-exports. Feature folders import directly. | Barrel files cause circular dependencies and bloat bundle sizes via tree-shaking failures.                        |
| **Maximum 300 lines per file**: If a file exceeds 300 lines, split it.                                       | Long files are hard for humans and AI to reason about. Smaller files = better code reviews, better AI assistance. |

### 1.3 Module Dependency Direction

```
app/ (pages)
  → features/ (feature components)
    → components/ (shared components)
      → hooks/ (shared hooks)
        → lib/ (pure utilities)

app/api/ (API routes)
  → server/middleware/ (middleware chain)
    → server/services/ (business logic)
      → server/db.ts (database)
      → schemas/ (validation)
        → lib/ (pure utilities)
```

**Rule**: Dependencies flow downward only. A lower layer never imports from a higher layer. `lib/` never imports from `server/`. `components/` never imports from `features/`. `server/services/` never imports from `app/`.

---

## 2. Naming Conventions

### 2.1 Files and Directories

| Type                      | Convention                                           | Example                                             |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| **React component**       | kebab-case file, PascalCase export                   | `package-card.tsx` exports `PackageCard`            |
| **Hook**                  | kebab-case file starting with `use-`                 | `use-pagination.ts` exports `usePagination`         |
| **Utility function**      | kebab-case file                                      | `format-currency.ts` exports `formatCurrency`       |
| **Zod schema**            | kebab-case file, camelCase export                    | `schemas/packages.ts` exports `createPackageSchema` |
| **Service**               | kebab-case with `.service.ts` suffix                 | `package.service.ts` exports `PackageService`       |
| **Queue**                 | kebab-case with `.queue.ts` suffix                   | `email.queue.ts` exports `emailQueue`               |
| **Test**                  | Source file name + `.test.ts(x)`                     | `format-currency.test.ts`                           |
| **Constants**             | UPPER_SNAKE_CASE for values                          | `MAX_FILE_SIZE`, `PAGINATION_DEFAULT`               |
| **Type/Interface**        | PascalCase                                           | `PackageStatus`, `TokenPayload`                     |
| **Enum values**           | PascalCase in Prisma, snake_case in TypeScript types | Prisma: `PRODUCTION`, TypeScript: `'in_progress'`   |
| **CSS class**             | Tailwind utilities only (no custom classes)          | `className="flex items-center gap-2"`               |
| **i18n keys**             | dot.separated.camelCase                              | `packages.pendingCount`                             |
| **Feature flags**         | kebab-case, module-prefixed                          | `package-photo-capture`                             |
| **Analytics events**      | module.action camelCase                              | `package.created`                                   |
| **Environment variables** | UPPER_SNAKE_CASE                                     | `DATABASE_URL`, `JWT_PRIVATE_KEY`                   |
| **Directory**             | kebab-case                                           | `data-display/`, `feature-flags/`                   |

### 2.2 Database Tables and Columns

| Type             | Convention                                                | Example                                 |
| ---------------- | --------------------------------------------------------- | --------------------------------------- |
| **Table name**   | snake_case plural (via `@@map`)                           | `user_properties`, `event_types`        |
| **Column name**  | camelCase in Prisma schema, snake_case in DB (via `@map`) | Prisma: `propertyId`, DB: `property_id` |
| **Primary key**  | `id` (UUID)                                               | `id String @id @default(uuid())`        |
| **Foreign key**  | `{relation}Id` in Prisma, `{relation}_id` in DB           | `propertyId` / `property_id`            |
| **Timestamps**   | `createdAt`, `updatedAt`, `deletedAt`                     | ISO 8601 UTC                            |
| **Boolean**      | Positive form, prefixed with `is` or `has`                | `isActive`, `hasPhoto`, `mfaEnabled`    |
| **JSON columns** | camelCase key name                                        | `customFields`, `permissions`           |
| **Index**        | `@@index([column1, column2])`                             | `@@index([propertyId, status])`         |

### 2.3 API Routes

| Convention                         | Example                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| **Path**: plural nouns, kebab-case | `/api/packages`, `/api/maintenance-requests`                          |
| **Nested resources**               | `/api/properties/{id}/units`, `/api/units/{id}/events`                |
| **Actions** (non-CRUD)             | `/api/packages/{id}/release`, `/api/packages/{id}/notify`             |
| **Query params**: camelCase        | `?pageSize=20&sortBy=createdAt&sortOrder=desc`                        |
| **Response envelope**              | `{ data: T, meta?: PaginationMeta, requestId: string }`               |
| **Error envelope**                 | `{ error: string, message: string, code: string, requestId: string }` |

### 2.4 React Components

| Convention           | Example                                             |
| -------------------- | --------------------------------------------------- | -------------------------------------------------- |
| **Props interface**  | `{ComponentName}Props`                              | `PackageCardProps`                                 |
| **Event handlers**   | `on{Event}` for props, `handle{Event}` for internal | `onRelease` (prop), `handleClick` (internal)       |
| **Boolean props**    | Positive form, no `is` prefix on props              | `disabled`, `loading`, `open`                      |
| **Render functions** | `render{Thing}`                                     | `renderEmptyState()`                               |
| **Ref forwarding**   | Always forward refs on interactive components       | `React.forwardRef<HTMLButtonElement, ButtonProps>` |

---

## 3. Error Handling

### 3.1 Error Class Hierarchy (already implemented in src/server/errors.ts)

```
AppError (abstract)
├── AuthError          (401)  — Authentication required or failed
├── ForbiddenError     (403)  — Insufficient permissions
├── NotFoundError      (404)  — Resource not found
├── ValidationError    (400)  — Input validation failed (with field-level errors)
├── RateLimitError     (429)  — Rate limit exceeded (with retryAfter)
├── ConflictError      (409)  — Resource conflict (duplicate, stale update)
└── InternalError      (500)  — Unexpected bug (isOperational = false)
```

### 3.2 API Route Error Handling Pattern

Every API route handler follows this pattern:

```typescript
// app/api/packages/route.ts
import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/server/errors';

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? 'unknown';

  try {
    // 1. Authenticate (middleware)
    // 2. Validate input (Zod schema)
    // 3. Authorize (RBAC check)
    // 4. Execute business logic (service layer)
    // 5. Return success response

    return NextResponse.json({ data: result, requestId }, { status: 201 });
  } catch (error) {
    const { body, status } = toErrorResponse(error, requestId);

    // Log non-operational errors (bugs) at error level
    if (!(error instanceof AppError) || !error.isOperational) {
      logger.error({ err: error, requestId }, 'Unhandled error in POST /api/packages');
    }

    return NextResponse.json(body, { status });
  }
}
```

### 3.3 Error Handling Rules

| Rule                                                                                                                                                                      | Justification                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never throw generic `Error`**. Always use an `AppError` subclass.                                                                                                       | Generic errors become 500s with no useful information. AppError subclasses carry HTTP status codes and machine-readable error codes.                 |
| **Never expose stack traces**. The `toErrorResponse` function strips them.                                                                                                | Stack traces reveal file paths, dependency versions, and internal architecture. The `requestId` is sufficient for correlating errors in server logs. |
| **Operational vs non-operational**: `isOperational = true` means "expected" (bad input, rate limit). `isOperational = false` means "bug" (null pointer, missing env var). | Non-operational errors trigger alerts in Sentry. Operational errors are logged but do not trigger alerts.                                            |
| **Field-level errors**: `ValidationError` includes a `fields` array with `{ field, message, code }`.                                                                      | Frontend forms display errors next to the specific field that failed validation.                                                                     |
| **Never catch and swallow**. If you catch, you must re-throw, log, or handle.                                                                                             | Swallowed errors are invisible bugs.                                                                                                                 |
| **Client components**: Use Error Boundaries for rendering errors. Use try/catch for event handler errors.                                                                 | Error Boundaries catch rendering failures. Event handlers need explicit error handling because React does not catch async errors in event handlers.  |

### 3.4 Client-Side Error Handling

```typescript
// Error boundary: app/error.tsx (already exists)
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // Log to Sentry
  // Show user-friendly error message with "Try Again" button
  // Include requestId if available
}

// Event handler pattern:
async function handleSubmit(data: PackageFormData) {
  try {
    const result = await createPackage(data);
    toast.success('Package received');
  } catch (error) {
    if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
      // Set field-level errors on the form
      setFieldErrors(error.fields);
    } else {
      toast.error('Failed to create package. Please try again.');
    }
  }
}
```

---

## 4. Data Fetching Patterns

### 4.1 Server Components (Default)

Server Components are the default. They fetch data directly in the component body using `async/await`. No client-side JavaScript is sent for data fetching.

```typescript
// app/(portal)/packages/page.tsx — Server Component
import { prisma, tenantScope } from '@/server/db';
import { getAuthContext } from '@/server/auth/session';
import { PackageList } from '@/features/packages/package-list';

export default async function PackagesPage() {
  const auth = await getAuthContext(); // Reads JWT from cookies
  const tenant = tenantScope(auth.pid);

  const packages = await prisma.event.findMany({
    where: tenant.where({ eventType: { slug: 'package' } }),
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <PackageList packages={packages} />;
}
```

### 4.2 When to Use Server Components vs Client Components

| Use Server Component When...                                    | Use Client Component When...                        |
| --------------------------------------------------------------- | --------------------------------------------------- |
| Page loads with data already rendered (SEO, initial load speed) | User interacts with the UI (forms, modals, toggles) |
| Data does not change after page load                            | Data updates in real-time (Socket.io events)        |
| No event handlers needed                                        | onClick, onChange, onSubmit needed                  |
| No browser APIs needed (localStorage, window)                   | Browser APIs required                               |
| Large data lists (render HTML, send no JS)                      | Optimistic updates (immediate UI feedback)          |

### 4.3 Client Components with TanStack Query

```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch packages (client-side, with caching)
function usePackages(propertyId: string) {
  return useQuery({
    queryKey: ['packages', propertyId],
    queryFn: () => fetch(`/api/packages`).then((res) => res.json()),
    staleTime: 30_000, // 30 seconds before refetch
    refetchOnWindowFocus: true,
  });
}

// Create package (with optimistic update)
function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePackageInput) =>
      fetch('/api/packages', { method: 'POST', body: JSON.stringify(data) }).then((res) =>
        res.json(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}
```

### 4.4 Data Fetching Rules

| Rule                                                                                                             | Justification                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Components for initial page data**. Never `useEffect` + `fetch` for data that exists at page load time. | Server-rendered data is faster (no waterfall), better for SEO, and reduces client JavaScript.                                                                                |
| **TanStack Query for interactive data**. Real-time lists, polling, optimistic updates use TanStack Query.        | TanStack Query handles caching, deduplication, refetching, and error state. Manual `useState` + `useEffect` does not.                                                        |
| **Never fetch in `useEffect` without a caching layer**.                                                          | Bare `useEffect` fetches on every render, with no deduplication, no caching, no retry, and no loading/error state management.                                                |
| **API routes return `{ data, meta, requestId }`**. Always this shape.                                            | Consistent response envelope enables generic error handling, pagination, and request correlation on the client.                                                              |
| **Every database query is tenant-scoped**. Use `tenantScope(propertyId).where()`.                                | Multi-tenant isolation. A query without `propertyId` is a data leak.                                                                                                         |
| **Pagination is cursor-based for large datasets, offset-based for admin tables**.                                | Cursor-based pagination is O(1) regardless of offset. Offset-based is simpler but O(n) at high page numbers. Front desk event grids use cursor. Admin user lists use offset. |

### 4.5 Caching Strategy

| Layer                      | Tool                             | TTL                                            | Invalidation                                  |
| -------------------------- | -------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| **Server Component cache** | `unstable_cache` / `fetch` cache | 60s                                            | `revalidateTag('packages')` on mutation       |
| **Client cache**           | TanStack Query                   | 30s `staleTime`                                | `queryClient.invalidateQueries()` on mutation |
| **Redis cache**            | ioredis                          | 60s (flags), 5m (settings)                     | Event-driven: publish invalidation message    |
| **HTTP cache**             | `Cache-Control` header           | `no-store` for API, `max-age=86400` for static | CloudFront invalidation for assets            |

---

## 5. State Management

### 5.1 Approach: No Global State Library

Concierge does NOT use Redux, Zustand, Jotai, or any global state library.

**Why**: Next.js App Router with Server Components eliminates most use cases for global state. Data flows from the server to components via props. The remaining interactive state is local.

### 5.2 State Ownership

| State Type                                       | Where It Lives                             | Tool                                 |
| ------------------------------------------------ | ------------------------------------------ | ------------------------------------ |
| **Server data** (packages, events, users)        | Server, cached via TanStack Query          | `useQuery` / Server Components       |
| **URL state** (filters, pagination, search)      | URL search params                          | `useSearchParams` + `useRouter`      |
| **Form state** (field values, validation errors) | Component-local                            | React Hook Form + Zod                |
| **UI state** (modal open, sidebar collapsed)     | Component-local                            | `useState`                           |
| **Auth state** (current user, role, permissions) | React Context (read-only, set from JWT)    | `AuthProvider` at root layout        |
| **Feature flags**                                | React Context (read-only, set from server) | `FeatureFlagProvider` at root layout |
| **Theme/locale**                                 | React Context (from cookie/profile)        | `next-intl` provider                 |
| **Real-time events**                             | Socket.io → TanStack Query invalidation    | Socket.io client + `useEffect`       |

### 5.3 Rules

| Rule                                                                                                                                 | Justification                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URL is the source of truth for filterable/paginated views**. Filters, sort order, page number, and search queries live in the URL. | Bookmarkable, shareable, back-button-friendly. If a front desk worker shares "show me all pending packages", the URL carries that state.             |
| **Never duplicate server data in local state**. If you fetched it with TanStack Query, read it from the query cache.                 | Duplicating data means two sources of truth. When one updates and the other does not, you have a bug.                                                |
| **Context is for read-only cross-cutting concerns only**. Auth, feature flags, locale. Never for mutable business data.              | Mutable context triggers re-renders of every consumer. TanStack Query has surgical re-rendering (only components using the changed query re-render). |
| **No prop drilling beyond 3 levels**. If a prop passes through 3 components that do not use it, extract a hook or use composition.   | Deep prop drilling makes code brittle and hard to refactor.                                                                                          |

---

## 6. Form Handling

### 6.1 Stack

| Tool                          | Role                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| **React Hook Form**           | Form state management, field registration, submission handling |
| **Zod**                       | Validation schema (shared with API routes)                     |
| **`@hookform/resolvers/zod`** | Connects Zod schema to React Hook Form                         |

**Note**: React Hook Form is not yet installed. Add `react-hook-form` and `@hookform/resolvers` to dependencies.

### 6.2 Form Pattern

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPackageSchema, type CreatePackageInput } from '@/schemas/packages';

export function PackageForm({ onSubmit }: { onSubmit: (data: CreatePackageInput) => void }) {
  const form = useForm<CreatePackageInput>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: { courier: '', unitId: '', notes: '' },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        label="Unit"
        error={form.formState.errors.unitId?.message}
        {...form.register('unitId')}
      />
      <FormField
        label="Courier"
        error={form.formState.errors.courier?.message}
        {...form.register('courier')}
      />
      <Button type="submit" loading={form.formState.isSubmitting}>
        Receive Package
      </Button>
    </form>
  );
}
```

### 6.3 Form Rules

| Rule                                                                                                                                 | Justification                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Same Zod schema validates client AND server**. The schema in `schemas/packages.ts` is imported by both the form and the API route. | Single source of truth. If a field is required on the server, it is required on the client. If max length is 200 on the server, it is 200 on the client. |
| **Server validation is the authority**. Client validation is a convenience for fast feedback.                                        | A malicious client can bypass client validation. Server validation is the security boundary.                                                             |
| **Every form field has a visible label**. No placeholder-only fields.                                                                | WCAG 2.2 AA requires visible labels for all form controls (Criterion 3.3.2). Placeholders disappear on focus.                                            |
| **Error messages are next to the field, not in a banner**.                                                                           | Users should not scroll to find which field failed. Field-level errors are immediately visible.                                                          |
| **Disable the submit button during submission**. Show a loading spinner.                                                             | Prevents double submission. Provides feedback that the action is in progress.                                                                            |
| **Confirm before destructive actions**. Delete, cancel, revoke always show a confirmation dialog.                                    | One-click destructive actions lead to support tickets. Confirmation prevents accidents.                                                                  |

---

## 7. Authentication Patterns

### 7.1 Token Flow (already implemented)

```
Login → Server validates credentials → Signs RS256 JWT (access token, 15m)
     → Creates refresh token (opaque UUID, stored in DB, 7d)
     → Sets httpOnly secure cookies for both tokens
     → Returns user data + role + permissions

Every request → Edge middleware reads x-nonce, sets security headers
            → API route middleware verifies JWT, extracts TokenPayload
            → Attaches { sub, pid, role, perms, mfa } to request context
```

### 7.2 Auth Patterns by Context

| Context                               | Pattern                                                                                                         | Implementation                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Edge Middleware** (`middleware.ts`) | Read JWT from cookie, verify signature, extract claims. Redirect to `/login` if invalid.                        | Already implemented for security headers. Auth redirect TBD. |
| **API Routes**                        | `authMiddleware` in the middleware chain extracts and verifies the JWT. Attaches `TokenPayload` to the request. | `src/server/middleware/auth.ts`                              |
| **Server Components**                 | `getAuthContext()` reads the JWT from cookies and returns `TokenPayload`.                                       | `src/server/auth/session.ts`                                 |
| **Client Components**                 | `useAuth()` hook reads auth state from `AuthProvider` context.                                                  | `src/hooks/use-auth.ts`                                      |
| **Per-route protection**              | Layout-level auth check in route group layouts. `(portal)/layout.tsx` checks auth and redirects.                | Layout files                                                 |
| **Per-component protection**          | `usePermissions().can('event:create')` conditionally renders UI elements.                                       | `src/hooks/use-permissions.ts`                               |

### 7.3 Auth Rules

| Rule                                                                                                                                                          | Justification                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **JWT in httpOnly cookies only**. Never in localStorage, never in Authorization header from the client.                                                       | httpOnly cookies are immune to XSS. localStorage tokens can be stolen by injected scripts.                                 |
| **Access token: 15 minutes**. Refresh token: 7 days.                                                                                                          | Short access tokens limit the damage window of a stolen token. Refresh tokens provide session continuity without re-login. |
| **Refresh token rotation**: Each refresh issues a new refresh token and invalidates the old one.                                                              | If a refresh token is stolen, the legitimate user's next refresh attempt fails, alerting them to compromise.               |
| **MFA gate**: Certain operations (change password, manage API keys, delete property) require `mfa: true` in the token even if the user has an active session. | Defense in depth. A stolen session cookie without the 2FA device cannot perform critical operations.                       |
| **No client-side route protection alone**. Server must verify.                                                                                                | Client-side checks can be bypassed by modifying JavaScript. Server auth is the security boundary.                          |

---

## 8. Multi-Tenancy Patterns

### 8.1 Tenant Isolation Model

Concierge uses **shared database, shared schema** multi-tenancy. Every user-visible table has a `property_id` column. Tenant isolation is enforced at three layers:

| Layer                 | Mechanism                                                          | File                              |
| --------------------- | ------------------------------------------------------------------ | --------------------------------- |
| **Application**       | `tenantScope(propertyId).where()` on every Prisma query            | `src/server/db.ts`                |
| **Middleware**        | `tenantMiddleware` extracts `pid` from JWT and attaches to request | `src/server/middleware/tenant.ts` |
| **Database** (future) | Row Level Security (RLS) policies on PostgreSQL                    | Planned for v2                    |

### 8.2 property_id Flow

```
JWT token contains `pid` (property ID)
  → tenantMiddleware extracts `pid`
  → Passes to service layer as `propertyId`
  → Service calls `tenantScope(propertyId)`
  → All Prisma queries auto-scoped:
      prisma.event.findMany({ where: tenant.where({ status: 'open' }) })
      // Produces: WHERE property_id = ? AND deleted_at IS NULL AND status = 'open'
```

### 8.3 Multi-Tenancy Rules

| Rule                                                                                                                                          | Justification                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Every query MUST include `propertyId`**. A query without `tenantScope` or manual `propertyId` where clause is a security vulnerability.     | Without `propertyId`, a query returns data from ALL properties. This is a data leak across tenants.                                        |
| **Super Admin queries explicitly opt out of tenant scope**. They use `{ propertyId: undefined }` with a documented reason.                    | Super Admin legitimately needs cross-property views (system health, analytics). But the opt-out must be explicit and auditable.            |
| **Test every query's tenant isolation**. Integration tests create data in Property A, query from Property B context, and assert zero results. | The most dangerous bug in a multi-tenant system is data leakage between tenants. It must be tested explicitly.                             |
| **Soft deletes everywhere**. `deletedAt` is checked by `tenantScope().where()`. Hard deletes are prohibited except for DSAR compliance.       | Soft deletes enable audit trails, data recovery, and compliance (PIPEDA right-to-deletion is satisfied by anonymization, not hard delete). |
| **Cross-property operations audit logged**. Any Super Admin action that touches multiple properties creates an audit entry per property.      | Compliance frameworks (SOC 2, ISO 27001) require audit trails for privileged access across tenants.                                        |

---

## 9. Testing Patterns

**Full specification**: See `docs/tech/TESTING-STRATEGY.md`. This section covers patterns not in that document.

### 9.1 Test Organization Pattern

```typescript
describe('PackageService', () => {
  describe('createPackage', () => {
    it('should create a package with auto-generated reference number', async () => {
      // Arrange
      const property = await seedProperty();
      const unit = await seedUnit({ propertyId: property.id });
      const input = { unitId: unit.id, courier: 'fedex', notes: 'Leave at door' };

      // Act
      const result = await PackageService.create(input, {
        propertyId: property.id,
        userId: 'staff-1',
      });

      // Assert
      expect(result.referenceNo).toMatch(/^PKG-\d{6}$/);
      expect(result.status).toBe('received');
      expect(result.propertyId).toBe(property.id);
    });

    it('should reject when unit belongs to a different property', async () => {
      // Arrange
      const propertyA = await seedProperty();
      const propertyB = await seedProperty();
      const unitInB = await seedUnit({ propertyId: propertyB.id });

      // Act & Assert — tenant isolation
      await expect(
        PackageService.create(
          { unitId: unitInB.id, courier: 'ups' },
          { propertyId: propertyA.id, userId: 'staff-1' },
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

### 9.2 Tenant Isolation Test Pattern

Every service that reads or writes data MUST have a tenant isolation test:

```typescript
it('should not return events from another property', async () => {
  const propA = await seedProperty();
  const propB = await seedProperty();

  await createEvent({ propertyId: propA.id, title: 'Event in A' });
  await createEvent({ propertyId: propB.id, title: 'Event in B' });

  const results = await EventService.list({ propertyId: propA.id });

  expect(results).toHaveLength(1);
  expect(results[0].title).toBe('Event in A');
});
```

### 9.3 Permission Test Pattern

Every API route MUST have tests for each role that should and should not have access:

```typescript
const roles = [
  { role: 'front_desk', expected: 201 },
  { role: 'security_guard', expected: 201 },
  { role: 'property_manager', expected: 201 },
  { role: 'resident_owner', expected: 403 },
  { role: 'visitor', expected: 403 },
];

it.each(roles)('should return $expected for $role role', async ({ role, expected }) => {
  const response = await POST(withAuth(request, { role }));
  expect(response.status).toBe(expected);
});
```

---

## 10. Security

### 10.1 Input Validation

| Rule                                                               | Implementation                                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Validate all input on the server with Zod**.                     | Every API route's first action is `schema.parse(body)`.                                                                                                          |
| **Validate request body, query params, and path params**.          | Body: `createPackageSchema.parse(body)`. Params: `idParamSchema.parse(params)`. Query: `paginationQuerySchema.parse(searchParams)`.                              |
| **Reject unknown fields**. Zod schemas use `.strict()` on objects. | Prevents mass assignment attacks where extra fields overwrite protected properties.                                                                              |
| **Sanitize HTML in user-generated content**.                       | `isomorphic-dompurify` (already installed) strips script tags, event handlers, and dangerous HTML from rich text fields. Applied before storage, not on display. |
| **Limit string lengths at the schema level**.                      | Every string field has a `.max()` constraint in its Zod schema (see `src/schemas/common.ts`).                                                                    |

### 10.2 Output Encoding

| Context                | Rule                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **HTML rendering**     | React automatically escapes JSX expressions. Never use `dangerouslySetInnerHTML` except for DOMPurify-sanitized content.           |
| **JSON API responses** | `NextResponse.json()` handles JSON serialization. Never manually concatenate JSON strings.                                         |
| **SQL**                | Prisma parameterizes all queries. Never use string interpolation in `$queryRaw`. Use `Prisma.sql` tagged template for raw queries. |
| **URLs**               | Use `encodeURIComponent()` for dynamic URL segments. Never concatenate user input into URLs.                                       |
| **HTTP headers**       | Never reflect user input in HTTP headers (prevents header injection).                                                              |

### 10.3 CSRF Protection

- **Double-submit cookie pattern**: The middleware generates a CSRF token, sets it as a cookie, and the client includes it in a custom header (`X-CSRF-Token`) on mutating requests.
- **SameSite=Lax cookies**: JWT cookies use `SameSite=Lax` which prevents CSRF from cross-origin form submissions.
- **API routes check Origin header**: Mutating API routes verify that the `Origin` header matches the application's domain.

### 10.4 Rate Limiting (see TECH-STACK-FINAL.md Section 25)

Applied at three levels:

1. **Edge**: Cloudflare/CloudFront rate limiting for DDoS protection.
2. **Middleware**: Redis-based sliding window rate limiting per IP, per user, per endpoint.
3. **Application**: Business-level limits (e.g., max 50 file uploads per hour per user).

### 10.5 XSS Prevention

| Vector            | Defense                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stored XSS**    | DOMPurify sanitization before storage. CSP blocks inline scripts.                                                                                        |
| **Reflected XSS** | React auto-escapes output. CSP nonce-based script-src.                                                                                                   |
| **DOM XSS**       | No `eval()`, no `innerHTML` outside DOMPurify. ESLint security plugin flags these.                                                                       |
| **CSP**           | Strict Content-Security-Policy with nonce (generated per request in middleware.ts). `default-src 'self'`, `script-src 'nonce-{nonce}' 'strict-dynamic'`. |

### 10.6 File Upload Validation

| Check                     | Implementation                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File type**             | Validate MIME type AND file extension. Accept: JPG, PNG, GIF, WebP, HEIC, PDF, DOC, DOCX, XLSX, CSV. Reject everything else.                             |
| **Magic bytes**           | Read first 8 bytes of the file and verify magic number matches claimed MIME type. Prevents `.jpg.exe` attacks.                                           |
| **File size**             | Maximum 50MB per file. Enforced on both client (form validation) and server (stream limit).                                                              |
| **Filename sanitization** | Strip path traversal characters (`../`, `..\\`). Replace special characters with hyphens. Limit to 255 characters.                                       |
| **Antivirus**             | Pass uploaded files through ClamAV scan before storage (v2).                                                                                             |
| **No execution**          | S3 bucket policy denies `s3:GetObject` with `Content-Type: text/html`. Files served with `Content-Disposition: attachment` to prevent browser execution. |

### 10.7 JWT Lifecycle

| Event                        | Action                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**                    | Issue access token (15m) + refresh token (7d). Store refresh token hash in DB.                                                                       |
| **API request**              | Verify access token signature, expiry, issuer, audience. Extract claims.                                                                             |
| **Access token expired**     | Client calls `/api/auth/refresh` with refresh token cookie. Server verifies refresh token hash in DB, issues new access + refresh tokens (rotation). |
| **Refresh token expired**    | User must re-login.                                                                                                                                  |
| **Logout**                   | Revoke refresh token in DB (`revokedAt = now()`). Clear cookies.                                                                                     |
| **Password change**          | Revoke ALL refresh tokens for the user. Force re-login on all devices.                                                                               |
| **Suspicious activity**      | Revoke ALL sessions and refresh tokens for the user.                                                                                                 |
| **Token in revoked session** | Return 401. Even if the JWT signature is valid, the session may have been revoked. Check session status for sensitive operations.                    |

---

## 11. Performance

### 11.1 Database Query Optimization

| Rule                                         | Target                                                               | Enforcement                                                    |
| -------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Every query has an execution plan review** | No sequential scans on tables > 1000 rows                            | Code review checklist                                          |
| **N+1 query detection**                      | Max 10 queries per API request                                       | Prisma middleware logs query count; warn in dev, error in test |
| **Index coverage**                           | Every `WHERE` and `ORDER BY` column in frequent queries has an index | Index audit script runs monthly                                |
| **Query timeout**                            | No query > 5 seconds                                                 | Prisma `$queryRawUnsafe` with timeout parameter                |
| **Connection pooling**                       | Max 20 connections per server instance                               | Prisma connection pool configuration                           |
| **Read replicas** (v2)                       | Read-heavy queries (reports, search) route to replica                | Prisma read replicas configuration                             |

### 11.2 Caching Strategy

See TECH-STACK-FINAL.md Section 26 for the full caching matrix.

**Cache invalidation patterns**:

| Pattern                       | When                                            | Implementation                    |
| ----------------------------- | ----------------------------------------------- | --------------------------------- |
| **Time-based expiry**         | Feature flags (60s), settings (5m)              | Redis TTL                         |
| **Event-driven invalidation** | Data mutation (package created, user updated)   | `revalidateTag()` + Redis PUBLISH |
| **Stale-while-revalidate**    | Client-side data (TanStack Query 30s staleTime) | TanStack Query configuration      |
| **Manual bust**               | Emergency (kill switch, config change)          | Admin UI "Clear Cache" button     |

### 11.3 Image Optimization

| Technique               | Implementation                                                                |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Responsive images**   | `next/image` generates srcset for 640, 750, 828, 1080, 1200, 1920px widths    |
| **Modern formats**      | AVIF (primary), WebP (fallback). Configured in `next.config.ts`.              |
| **Lazy loading**        | `loading="lazy"` on below-fold images. `loading="eager"` on above-fold (LCP). |
| **Upload optimization** | Sharp resizes uploads to max 2000px width, strips EXIF, converts to WebP.     |
| **CDN**                 | CloudFront with 24-hour cache for public images.                              |

### 11.4 Bundle Budget

| Metric                             | Budget             | Enforcement                        |
| ---------------------------------- | ------------------ | ---------------------------------- |
| **Total JavaScript (gzipped)**     | < 200KB first load | Next.js bundle analyzer + CI check |
| **Per-page JavaScript**            | < 50KB per route   | `@next/bundle-analyzer`            |
| **CSS**                            | < 50KB (gzipped)   | Tailwind purge + CI check          |
| **Largest Contentful Paint (LCP)** | < 1.5s on desktop  | Lighthouse CI                      |
| **First Input Delay (FID)**        | < 50ms             | Lighthouse CI                      |
| **Cumulative Layout Shift (CLS)**  | < 0.05             | Lighthouse CI                      |
| **Time to Interactive (TTI)**      | < 2s on desktop    | Lighthouse CI                      |

### 11.5 Pagination

| Pattern          | When                                                | Why                                                                                                                                                                   |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cursor-based** | Event grid, package list, security log, audit trail | O(1) performance regardless of offset. Essential for real-time feeds where new items are constantly added. No missed/duplicate items when data changes between pages. |
| **Offset-based** | Admin user list, unit management, settings tables   | Simpler implementation. Allows "jump to page 5". Acceptable for smaller, less frequently updated datasets.                                                            |

**Cursor implementation**:

```typescript
// API: GET /api/events?cursor=abc123&limit=50
const events = await prisma.event.findMany({
  where: tenant.where({ status: 'open' }),
  take: 51, // Fetch 1 extra to determine if there's a next page
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});

const hasNextPage = events.length > 50;
const items = hasNextPage ? events.slice(0, 50) : events;
const nextCursor = hasNextPage ? items[items.length - 1].id : null;

return { data: items, meta: { nextCursor, hasNextPage } };
```

---

## 12. AI Token Optimization

These conventions make the Concierge codebase AI-friendly. When an AI coding assistant reads our code, it should understand the patterns quickly, make fewer mistakes, and produce consistent output.

### 12.1 Self-Documenting Code

| Convention                       | Example                                                               | Why                                                                                  |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Descriptive variable names**   | `pendingPackages` not `pp` or `data`                                  | AI and humans understand the intent without reading surrounding code                 |
| **Type everything**              | `function createPackage(input: CreatePackageInput): Promise<Package>` | AI can infer behavior from types alone. No guessing about shapes.                    |
| **JSDoc on public functions**    | `/** Signs an access token (RS256). Per SECURITY-RULEBOOK A.1 */`     | AI reads JSDoc to understand purpose and constraints without reading implementation. |
| **Constants over magic numbers** | `PAGINATION.maxPageSize` not `100`                                    | AI can trace the constant to its definition to understand the constraint.            |
| **Explicit error messages**      | `'Unit number must be at most 10 characters'` not `'Invalid input'`   | AI can read the error message to understand the validation rule.                     |

### 12.2 Consistent Patterns

| Convention                                       | Rule                                                                                                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One pattern per concern**                      | All forms use React Hook Form + Zod. Not some forms with `useState` and others with RHF.                                                                                                                   |
| **Same file structure in every feature**         | `features/packages/` has the same layout as `features/maintenance/`. Same file naming, same export patterns.                                                                                               |
| **Predictable API routes**                       | `GET /api/{resource}` for list, `GET /api/{resource}/{id}` for detail, `POST /api/{resource}` for create, `PATCH /api/{resource}/{id}` for update, `DELETE /api/{resource}/{id}` for delete. No surprises. |
| **Same middleware chain on every route**         | `chain(auth, tenant, validate(schema), rbac('event:create'), handler)`. Same order, same pattern.                                                                                                          |
| **Same error handling try/catch in every route** | The pattern in Section 3.2 is copy-paste consistent. AI can template new routes from existing ones.                                                                                                        |

### 12.3 File Size Limits

| Rule                                | Limit                              | Enforcement                                       |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------- |
| **Maximum lines per file**          | 300 lines                          | ESLint custom rule (warning at 250, error at 300) |
| **Maximum functions per file**      | 10                                 | Code review                                       |
| **Maximum parameters per function** | 4 (use an options object for more) | TypeScript lint rule                              |
| **Maximum nesting depth**           | 3 levels of indentation            | ESLint `max-depth` rule                           |

**Why 300 lines**: AI models have context windows. A 300-line file fits comfortably in context alongside its test file, its types, and the calling code. A 1,000-line file forces the AI to work with partial context, leading to inconsistent suggestions.

### 12.4 Import Organization

Imports are sorted by ESLint and Prettier into this order:

```typescript
// 1. Node.js built-ins
import { createHash } from 'node:crypto';

// 2. External packages (alphabetical)
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// 3. Internal aliases (alphabetical by path)
import { tenantScope } from '@/server/db';
import { ValidationError } from '@/server/errors';
import { logger } from '@/server/logger';

// 4. Relative imports (alphabetical)
import { formatCurrency } from './format-currency';

// 5. Type-only imports (at the end of each group)
import type { TokenPayload } from '@/types';
```

**Why this order**: AI models predict imports based on patterns. Consistent ordering means the AI learns the project's import structure from a few examples and applies it correctly everywhere.

### 12.5 Code Comments

| Comment Type           | When                                                        | Format                                          |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| **JSDoc**              | Public functions, exported types, module headers            | `/** ... */`                                    |
| **Inline explanation** | Non-obvious business logic, security decisions, workarounds | `// Reason:` prefix                             |
| **TODO**               | Known technical debt with a ticket reference                | `// TODO(CONC-123): description`                |
| **Section headers**    | Grouping related code within a file                         | `// --- Section Name ---` or `// ----` dividers |
| **NEVER**              | Commented-out code. Delete it. Git has history.             | Remove before PR.                               |

### 12.6 AI-Friendly File Headers

Every file starts with a comment block that tells an AI what the file does and where it fits:

```typescript
/**
 * Concierge — Package Service
 *
 * Business logic for package lifecycle: receive, notify, release, return.
 * Called by API routes in app/api/packages/.
 * Uses tenantScope for multi-tenant isolation.
 *
 * @module server/services/package
 */
```

This 5-line header saves the AI from reading 200 lines of code to understand the file's purpose.

### 12.7 Type Exports

| Rule                                                       | Why                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------- |
| **Export types alongside their implementations**           | AI can see `createPackage(input: CreatePackageInput)` and jump to `CreatePackageInput` in the same file or schema file.              |
| **Avoid `any` and `unknown` in public interfaces**         | `any` tells the AI nothing about the shape. Explicit types enable accurate suggestions.                                              |
| **Use discriminated unions for polymorphic types**         | `type Event = PackageEvent                                                                                                           | VisitorEvent | IncidentEvent`with a`type` discriminant field. AI can narrow the type in switch statements. |
| **Re-export Prisma-generated types with meaningful names** | `export type Package = Prisma.EventGetPayload<{ include: { unit: true } }>`. AI understands `Package` better than `EventGetPayload`. |

---

_Last updated: 2026-03-17_
_Applies to: All code in the Concierge repository_
_Enforcement: Code review + ESLint rules + CI pipeline_
