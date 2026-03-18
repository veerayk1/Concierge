# Concierge — Final Technology Stack

> **Version**: 1.0 | **Date**: 2026-03-17 | **Status**: APPROVED
>
> Every technology decision in this document is justified against the PRD requirements (PRDs 01-28),
> the Security Rulebook, the Design System, and the existing tech docs. No placeholder decisions.
> Every entry includes what, why, what was rejected, version pinning policy, known limitations, and license.

---

## Table of Contents

1. [Decision Criteria](#1-decision-criteria)
2. [Core Framework](#2-core-framework)
3. [Language & Compiler](#3-language--compiler)
4. [Database](#4-database)
5. [ORM](#5-orm)
6. [Cache & Session Store](#6-cache--session-store)
7. [Authentication & Cryptography](#7-authentication--cryptography)
8. [UI Component Library](#8-ui-component-library)
9. [Styling](#9-styling)
10. [Internationalization](#10-internationalization)
11. [File Storage](#11-file-storage)
12. [Email Delivery](#12-email-delivery)
13. [SMS Delivery](#13-sms-delivery)
14. [Push Notifications](#14-push-notifications)
15. [PDF Generation](#15-pdf-generation)
16. [Excel Generation](#16-excel-generation)
17. [Search Engine](#17-search-engine)
18. [Job Queue & Background Processing](#18-job-queue--background-processing)
19. [Real-Time Communication](#19-real-time-communication)
20. [Monitoring & Observability](#20-monitoring--observability)
21. [Logging](#21-logging)
22. [Analytics](#22-analytics)
23. [Payment Processing](#23-payment-processing)
24. [Image Processing](#24-image-processing)
25. [Rate Limiting](#25-rate-limiting)
26. [Caching Patterns](#26-caching-patterns)
27. [CI/CD](#27-cicd)
28. [Hosting & Infrastructure](#28-hosting--infrastructure)
29. [Testing Tools](#29-testing-tools)
30. [Code Quality](#30-code-quality)
31. [Security Tooling](#31-security-tooling)
32. [AI & LLM Integration](#32-ai--llm-integration)
33. [Dependency Policy](#33-dependency-policy)
34. [Gap Analysis Summary](#34-gap-analysis-summary)

---

## 1. Decision Criteria

Every technology in this stack was evaluated against these criteria:

| Criterion            | Weight | Description                                                                  |
| -------------------- | ------ | ---------------------------------------------------------------------------- |
| **PRD coverage**     | 30%    | Does it satisfy documented requirements across all 28 PRDs?                  |
| **Security posture** | 25%    | Does it meet Security Rulebook requirements? SOC 2, PIPEDA, GDPR compliance? |
| **Performance**      | 15%    | Can it hit the SLAs in TESTING-STRATEGY.md (p95 < 500ms, page load < 2s)?    |
| **Maintainability**  | 15%    | Is the ecosystem active? Will a junior developer understand it in 6 months?  |
| **Cost**             | 10%    | Total cost at 500 properties, 50k users scale                                |
| **AI-friendliness**  | 5%     | Can AI coding assistants work with it effectively?                           |

---

## 2. Core Framework

| Property        | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| **Technology**  | Next.js 15 (App Router)                                               |
| **Version pin** | `^15.2.0` — minor updates allowed, no major bumps without team review |
| **License**     | MIT                                                                   |
| **Status**      | Already installed                                                     |

### Why Next.js 15

- **Server Components**: Reduce client bundle size. Server Components fetch data without waterfalls, render on the server, and send HTML. Critical for our 99% desktop-monitor audience (PRD 17) where we want instant page loads.
- **App Router**: Route groups `(portal)`, `(auth)`, `(admin)` map directly to our role-aware layout system (CLAUDE.md: Role-Aware Interfaces). Each group has its own layout with different navigation.
- **API Routes**: Colocated API handlers in `app/api/` eliminate the need for a separate backend. The middleware chain (`src/server/middleware/`) already uses this pattern.
- **Edge Middleware**: Our `middleware.ts` runs at the edge for CSP nonce generation and security headers. No alternative framework supports this as natively.
- **Standalone output**: `output: 'standalone'` in `next.config.ts` produces a minimal Docker-deployable artifact.
- **Image optimization**: Built-in `next/image` with AVIF + WebP support (already configured for S3 patterns).
- **Typed routes**: `typedRoutes: true` is already enabled, preventing broken links at compile time.

### Rejected Alternatives

| Alternative             | Rejection reason                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Remix**               | Weaker Server Component story. Smaller ecosystem. No edge middleware equivalent. Fewer hosting options with zero-config.               |
| **SvelteKit**           | Team has no Svelte experience. Smaller component library ecosystem. Would need to build Radix-equivalent primitives from scratch.      |
| **Astro**               | Content-focused framework. Not designed for interactive SaaS applications with complex state and real-time updates.                    |
| **Express + React SPA** | No SSR by default, no streaming, no Server Components. Would require significant boilerplate for what Next.js provides out of the box. |

### Known Limitations

- App Router is newer than Pages Router; some community packages still assume Pages Router patterns.
- Cold start times on serverless can be 1-3s for routes that import heavy server dependencies (argon2, Prisma). Mitigated by the standalone output + persistent containers.
- No built-in WebSocket support in Next.js; handled by separate Socket.io server (see Section 19).

---

## 3. Language & Compiler

| Property        | Value                            |
| --------------- | -------------------------------- |
| **Language**    | TypeScript 5.7                   |
| **Version pin** | `^5.7.3` — minor updates allowed |
| **Target**      | ES2022                           |
| **Module**      | ESNext with bundler resolution   |
| **License**     | Apache-2.0                       |
| **Status**      | Already installed                |

### Strict Mode Configuration (already in tsconfig.json)

| Flag                               | Value  | Why                                                                   |
| ---------------------------------- | ------ | --------------------------------------------------------------------- | ------------------------------------------ |
| `strict`                           | `true` | All strict checks enabled (no implicit any, strict null checks, etc.) |
| `noUncheckedIndexedAccess`         | `true` | Array/object index access returns `T                                  | undefined`, preventing null reference bugs |
| `noImplicitOverride`               | `true` | Class method overrides must be explicit                               |
| `forceConsistentCasingInFileNames` | `true` | Prevents case-sensitivity issues between macOS and Linux CI           |
| `isolatedModules`                  | `true` | Required for SWC transpilation in Next.js                             |

### Why Not Alternatives

| Alternative            | Rejection reason                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JavaScript (plain)** | No type safety. Unacceptable for a multi-tenant security-sensitive system. Security Rulebook mandates type-safe code.                                                         |
| **Go / Rust backend**  | Team expertise is TypeScript. Full-stack TypeScript shares types, Zod schemas, and validation logic between client and server. Splitting would double the validation surface. |

---

## 4. Database

| Property        | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| **Technology**  | PostgreSQL 16                                                             |
| **Version pin** | 16.x — use the latest patch. No upgrades to 17 without migration testing. |
| **License**     | PostgreSQL License (permissive, BSD-like)                                 |
| **Status**      | Already configured in schema.prisma                                       |

### Why PostgreSQL 16

- **JSONB**: The unified event model uses `customFields Json?` extensively (schema.prisma lines 290, 314, 347). PostgreSQL JSONB supports indexing, querying, and partial updates on JSON columns.
- **UUID native**: `@db.Uuid` throughout the schema. PostgreSQL's `gen_random_uuid()` is fast and native.
- **Row Level Security (RLS)**: Future enhancement for defense-in-depth multi-tenant isolation beyond application-layer `tenantScope()`.
- **Full-text search**: `tsvector` + `tsquery` for v1 search (Section 17). Eliminates a separate search service.
- **LISTEN/NOTIFY**: Native pub/sub for real-time event notifications without polling.
- **Partitioning**: Table partitioning by `property_id` for audit_entries and events tables at scale (500+ properties).
- **Proven at scale**: Powers multi-tenant SaaS at companies orders of magnitude larger than Concierge's initial scale.

### Rejected Alternatives

| Alternative              | Rejection reason                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **MySQL 8**              | Weaker JSONB support (JSON columns lack GIN indexing). No native UUID type. Partitioning less flexible.                                                                                          |
| **CockroachDB**          | Overkill for v1 scale. Higher operational complexity. PostgreSQL-compatible but with subtle differences in transaction isolation.                                                                |
| **MongoDB**              | Schema-less design is a liability for a multi-tenant system with strict data quality requirements (DATA-QUALITY.md). ACID transactions are essential for financial operations (PRD 24: Billing). |
| **Supabase (hosted PG)** | Vendor lock-in concerns. We need full control over RLS policies, extensions, and backup schedules for compliance (8 frameworks). Self-managed PostgreSQL on AWS RDS or Aurora.                   |

### Known Limitations

- Connection pooling required for serverless deployments. Use PgBouncer or Prisma Accelerate.
- Large JSONB columns can cause bloat if frequently updated. Mitigated by keeping `customFields` small and using TOAST compression.

### Extensions Required

| Extension   | Purpose                                                                             |
| ----------- | ----------------------------------------------------------------------------------- |
| `pgcrypto`  | `gen_random_uuid()` for UUID generation                                             |
| `pg_trgm`   | Trigram-based fuzzy text search for duplicate detection (DATA-QUALITY.md Section 4) |
| `unaccent`  | Accent-insensitive search for French-Canadian names                                 |
| `btree_gin` | GIN indexes on non-text columns for composite full-text + filter queries            |

---

## 5. ORM

| Property        | Value                            |
| --------------- | -------------------------------- |
| **Technology**  | Prisma 6                         |
| **Version pin** | `^6.4.0` — minor updates allowed |
| **License**     | Apache-2.0                       |
| **Status**      | Already installed (client + CLI) |

### Why Prisma 6

- **Schema-as-code**: `prisma/schema.prisma` is the single source of truth for the data model. Generates types, client, and migrations from one file.
- **Type-safe queries**: Every query is fully typed. `prisma.event.findMany({ where: { propertyId } })` returns a typed result. Prevents entire categories of SQL injection and type mismatch bugs.
- **Migration system**: `prisma migrate dev` generates SQL migrations from schema diffs. Migrations are versioned and applied in order.
- **Multi-tenant helper**: The existing `tenantScope()` function (src/server/db.ts) wraps Prisma queries with property_id filtering. Future: Prisma Client Extensions for automatic injection.
- **Relation mapping**: The schema already defines 30+ relations with proper foreign keys, cascades, and indexes.

### Rejected Alternatives

| Alternative      | Rejection reason                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drizzle ORM**  | More SQL-like API appeals to SQL experts, but the team benefits from Prisma's declarative schema and migration tooling. Drizzle's schema-in-TypeScript is harder to review in PRs. |
| **Kysely**       | Type-safe query builder but no migration system, no schema file, no automatic type generation from DB introspection. Would need manual type maintenance.                           |
| **Raw SQL (pg)** | Maximum control but no type safety, no migration management, high maintenance burden, and SQL injection risk without parameterization discipline.                                  |
| **TypeORM**      | Decorator-based, class-heavy API. Known performance issues with large schemas. Less active maintenance than Prisma.                                                                |

### Known Limitations

- Prisma Client adds ~1.5MB to the server bundle. Acceptable for our standalone deployment (not serverless edge).
- Complex raw SQL queries (CTEs, window functions) require `prisma.$queryRaw`. We accept this tradeoff for the 5% of queries that need it.
- Connection pooling in serverless requires Prisma Accelerate or an external PgBouncer. We run persistent containers, so this is not an issue for v1.

---

## 6. Cache & Session Store

| Property           | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Technology**     | Redis 7 (via ioredis)                                  |
| **Client library** | `ioredis` 5.x                                          |
| **Version pin**    | `^5.4.2`                                               |
| **License**        | Redis: RSALv2 + SSPLv1 (server) / MIT (ioredis client) |
| **Status**         | ioredis already installed in package.json              |

### What Redis Stores

| Use Case                  | Key Pattern                            | TTL                         | PRD Reference                           |
| ------------------------- | -------------------------------------- | --------------------------- | --------------------------------------- |
| **Session data**          | `session:{sessionId}`                  | 24h (sliding)               | Security Rulebook A.2                   |
| **Feature flags**         | `flags:{propertyId}`                   | 60s                         | FEATURE-FLAGS.md Section 2              |
| **Rate limit counters**   | `rl:{ip}:{endpoint}`                   | Window duration (1m/15m/1h) | PRD 01: Architecture, Security Rulebook |
| **Password reset tokens** | `pwd-reset:{hash}`                     | 15m                         | PRD 01: Auth                            |
| **2FA attempt counters**  | `2fa-attempts:{userId}`                | 15m                         | Security Rulebook A.3                   |
| **Job queue**             | `bull:{queueName}:*`                   | Until processed             | Section 18                              |
| **Real-time presence**    | `presence:{propertyId}`                | 30s heartbeat               | PRD 03: Security Console                |
| **Search autocomplete**   | `search-suggest:{propertyId}:{prefix}` | 5m                          | PRD 15: Search                          |

### Why Redis

- **Sub-millisecond reads**: Feature flag resolution, rate limiting, and session validation all happen on every request. They must be < 1ms.
- **Pub/Sub**: Redis PUBLISH/SUBSCRIBE powers real-time notifications between server instances and the Socket.io adapter.
- **BullMQ compatibility**: Our job queue (Section 18) requires Redis as its backing store.
- **Atomic operations**: `INCR`, `EXPIRE`, and Lua scripts enable race-condition-free rate limiting.

### Rejected Alternatives

| Alternative         | Rejection reason                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Memcached**       | No persistence, no pub/sub, no data structures beyond key-value. Insufficient for our needs.                |
| **Valkey**          | Redis fork with compatible API. Viable alternative if Redis licensing becomes an issue. Tagged as fallback. |
| **DragonflyDB**     | Redis-compatible with better memory efficiency but younger project. Risk of subtle compatibility issues.    |
| **In-memory (Map)** | Does not work across multiple server instances. Breaks horizontal scaling.                                  |

### Known Limitations

- Redis is single-threaded. CPU-bound Lua scripts can block other operations. Keep Lua scripts under 5ms.
- Memory is finite. We set `maxmemory-policy allkeys-lru` to evict least-recently-used keys when memory is full.
- Redis Cluster adds operational complexity. For v1, a single Redis instance with a read replica is sufficient (estimated peak: < 10k ops/sec).

---

## 7. Authentication & Cryptography

| Component                    | Technology                                    | Version   | License    | Status                                |
| ---------------------------- | --------------------------------------------- | --------- | ---------- | ------------------------------------- |
| **JWT signing/verification** | `jose`                                        | `^6.0.8`  | MIT        | Installed                             |
| **Password hashing**         | `argon2` (via `argon2` npm)                   | `^0.41.1` | MIT        | Installed                             |
| **TOTP (2FA)**               | Custom implementation using `jose` + `crypto` | N/A       | N/A        | Implemented (src/server/auth/totp.ts) |
| **HTML sanitization**        | `isomorphic-dompurify`                        | `^2.20.0` | Apache-2.0 | Installed                             |
| **ID generation**            | `nanoid`                                      | `^5.1.2`  | MIT        | Installed                             |

### Why jose for JWT

- **Edge-compatible**: Works in Edge Runtime (our middleware.ts), Node.js, and browsers. The only JWT library that runs everywhere Next.js code runs.
- **RS256 asymmetric signing**: Already implemented in `src/server/auth/jwt.ts`. Private key signs, public key verifies. Public key can be distributed to microservices without exposing the signing key.
- **Standards-compliant**: Full JOSE/JWK/JWS/JWE support. If we need token encryption (JWE) in the future, no library change needed.

### Why Argon2 (not bcrypt)

- **OWASP recommendation**: Argon2id is the recommended password hashing algorithm as of 2024. It resists GPU cracking, side-channel attacks, and time-memory tradeoffs.
- **Configurable cost**: Memory, time, and parallelism parameters can be tuned independently. Bcrypt only has a single cost factor.
- **Already integrated**: `src/server/auth/password.ts` uses Argon2id with parameters meeting Security Rulebook requirements.

### Rejected Alternatives

| Alternative          | Rejection reason                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **jsonwebtoken**     | Does not work in Edge Runtime. Not maintained as actively as jose.                                                                                          |
| **bcrypt**           | OWASP recommends Argon2id over bcrypt. Bcrypt has a 72-byte password limit.                                                                                 |
| **Passport.js**      | Monolithic auth framework. We need fine-grained control over the auth flow for our custom role hierarchy (12 roles) and multi-tenant model.                 |
| **NextAuth/Auth.js** | Designed for OAuth/social login. We explicitly do NOT use SSO (CLAUDE.md: "No SSO --- admin creates accounts"). Adding it would fight the library's design. |

---

## 8. UI Component Library

| Property        | Value                                                    |
| --------------- | -------------------------------------------------------- |
| **Technology**  | Radix UI Primitives                                      |
| **Version pin** | Individual `@radix-ui/react-*` packages at latest stable |
| **License**     | MIT                                                      |
| **Status**      | 20 Radix packages already installed                      |

### Why Radix Primitives (not a full component library)

- **Unstyled**: Radix provides accessible behavior (keyboard navigation, focus management, ARIA attributes) without any visual styling. This lets us implement the Concierge Design System exactly (DESIGN-SYSTEM.md: 2,243 lines) without fighting a library's opinions.
- **WCAG 2.2 AA out of the box**: Every Radix primitive meets WCAG 2.2 AA. Dialog traps focus, Select announces options, Tooltip positions correctly. This satisfies TESTING-STRATEGY.md Section 9 accessibility requirements.
- **Composable**: Each primitive is a separate package. We install only what we use (20 packages currently). No unused code.
- **Server Component compatible**: Radix primitives work as client components within our Server Component architecture.

### Installed Primitives (20)

Accordion, Alert Dialog, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Navigation Menu, Popover, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Toggle Group, Tooltip.

### Rejected Alternatives

| Alternative           | Rejection reason                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **shadcn/ui**         | Uses Radix under the hood but adds Tailwind styling opinions. We'd need to override most styles to match our Design System. Adding it on top of Radix adds no value. |
| **Chakra UI**         | Styled component library with its own theme system. Would conflict with our Tailwind-based Design System tokens.                                                     |
| **MUI (Material UI)** | Google's Material Design. Violates our "Apple-grade minimalism" design principle. Heavy bundle (400kb+).                                                             |
| **Ant Design**        | Enterprise-focused but heavily opinionated styling. Chinese documentation-first. Not aligned with our design language.                                               |
| **Headless UI**       | Tailwind Labs product. Fewer primitives than Radix (missing Slider, Scroll Area, Hover Card, Context Menu, Collapsible, Accordion, Toggle Group).                    |

### Icons

| Property        | Value        |
| --------------- | ------------ |
| **Technology**  | Lucide React |
| **Version pin** | `^0.474.0`   |
| **License**     | ISC          |
| **Status**      | Installed    |

Lucide is a fork of Feather Icons with 1,500+ icons, tree-shakeable imports, and consistent 24x24 grid. Each icon adds ~200 bytes to the bundle.

### Animation

| Property        | Value                           |
| --------------- | ------------------------------- |
| **Technology**  | Motion (formerly Framer Motion) |
| **Version pin** | `^12.4.0`                       |
| **License**     | MIT                             |
| **Status**      | Installed                       |

Used sparingly for: page transitions, toast enter/exit, modal overlays, skeleton loading states. Must respect `prefers-reduced-motion` (TESTING-STRATEGY.md Section 9).

---

## 9. Styling

| Property        | Value          |
| --------------- | -------------- |
| **Technology**  | Tailwind CSS 4 |
| **Version pin** | `^4.0.6`       |
| **License**     | MIT            |
| **Status**      | Installed      |

### Supporting Libraries

| Library                       | Version   | Purpose                                               |
| ----------------------------- | --------- | ----------------------------------------------------- |
| `tailwind-merge`              | `^3.0.2`  | Merge conflicting Tailwind classes without duplicates |
| `clsx`                        | `^2.1.1`  | Conditional class name composition                    |
| `prettier-plugin-tailwindcss` | `^0.6.11` | Auto-sort Tailwind classes in consistent order        |
| `@tailwindcss/postcss`        | `^4.0.6`  | PostCSS integration for Tailwind 4                    |

### Why Tailwind 4 (not 3)

- **CSS-first configuration**: Tailwind 4 uses CSS `@theme` blocks instead of `tailwind.config.js`. Our design tokens from DESIGN-SYSTEM.md map directly to CSS custom properties.
- **Lightning CSS**: Built-in CSS minification and vendor prefixing. No separate autoprefixer needed.
- **Smaller runtime**: Zero-runtime CSS extraction. No JavaScript class generation at runtime.
- **Logical properties**: Native support for `ms-*`, `me-*`, `ps-*`, `pe-*` utilities for RTL support (INTERNATIONALIZATION.md Section 12).

### Rejected Alternatives

| Alternative           | Rejection reason                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **CSS Modules**       | Scoped styles but no utility-first workflow. Leads to verbose CSS files with inconsistent spacing/color values.        |
| **Styled Components** | Runtime CSS-in-JS adds JavaScript overhead to every render. Incompatible with React Server Components.                 |
| **Vanilla Extract**   | Zero-runtime but requires TypeScript configuration for every style. Higher cognitive overhead than Tailwind utilities. |
| **Panda CSS**         | Newer, smaller ecosystem. Similar concept to Tailwind but with object-style API. Team has Tailwind experience.         |

---

## 10. Internationalization

| Property        | Value                                                     |
| --------------- | --------------------------------------------------------- |
| **Technology**  | next-intl 4.x                                             |
| **Version pin** | Latest 4.x                                                |
| **License**     | MIT                                                       |
| **Status**      | Not yet installed (documented in INTERNATIONALIZATION.md) |

**Full specification**: See `docs/tech/INTERNATIONALIZATION.md`. Library chosen for native App Router support, Server Component + Client Component compatibility, ICU message format, and < 5KB client bundle.

---

## 11. File Storage

| Property           | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| **Technology**     | AWS S3 (with CloudFront CDN)                           |
| **Client library** | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |
| **Version pin**    | Latest v3 SDK                                          |
| **License**        | Apache-2.0 (SDK)                                       |
| **Status**         | **Not yet installed**                                  |

### Why S3

- **Compliance**: Data residency in `ca-central-1` (Canada) for PIPEDA compliance. S3 supports server-side encryption (SSE-S3 and SSE-KMS) meeting Security Rulebook requirements.
- **Presigned URLs**: Upload and download via presigned URLs. The application server never handles file bytes. This keeps the Next.js server stateless and prevents memory issues with large files.
- **Lifecycle policies**: Automatic transition to S3 Glacier for compliance report archives (PRD 28). Automatic deletion of expired exports (DataExportRequest.expiresAt).
- **Versioning**: S3 object versioning for document library files (PRD: Library module). Residents can recover accidentally overwritten documents.
- **Cost**: $0.023/GB/month for standard storage. At 500 properties with 10GB each = 5TB = ~$115/month.

### Bucket Structure

```
concierge-{env}-uploads/
  {propertyId}/
    packages/       # Package photos
    maintenance/    # Maintenance request photos/documents
    documents/      # Document library files
    avatars/        # User profile photos
    announcements/  # Announcement attachments
    imports/        # CSV import files (temporary, 24h TTL)
    exports/        # Data export files (7-day TTL)
    branding/       # Property logos, custom branding assets
```

### CDN: CloudFront

Public-readable assets (property logos, announcement images) served via CloudFront with 24-hour cache. Private assets (documents, maintenance photos) served via presigned URLs with 15-minute expiry.

### Rejected Alternatives

| Alternative              | Rejection reason                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare R2**        | S3-compatible, no egress fees. Viable alternative. Rejected because our infrastructure is AWS-centric (RDS, ElastiCache, ECS). Mixing cloud providers adds operational complexity. Tagged as migration option if egress costs become significant. |
| **Vercel Blob**          | Tied to Vercel platform. No lifecycle policies, no versioning, no KMS encryption. Insufficient for compliance requirements.                                                                                                                       |
| **MinIO (self-hosted)**  | S3-compatible but adds operational burden. No benefit over managed S3 for our scale.                                                                                                                                                              |
| **Google Cloud Storage** | Would require GCP account management alongside AWS. No compelling advantage over S3 for our use case.                                                                                                                                             |

### Known Limitations

- S3 is eventually consistent for overwrite PUTs (read-after-write is consistent for new objects). Not an issue for our use case since we use unique keys per upload.
- Maximum object size 5TB (single PUT limited to 5GB, multipart for larger). Our file upload limit is 50MB per file, well within bounds.

---

## 12. Email Delivery

| Property           | Value                   |
| ------------------ | ----------------------- |
| **Technology**     | Resend                  |
| **Client library** | `resend` (official SDK) |
| **Version pin**    | Latest stable           |
| **License**        | MIT (SDK)               |
| **Status**         | **Not yet installed**   |

### Why Resend

- **React Email templates**: Resend integrates natively with React Email, allowing email templates to be React components. This means the same component library, TypeScript types, and i18n system (next-intl) that powers the web UI also powers email templates.
- **Deliverability**: Built by former SendGrid engineers. High deliverability rates with automatic DKIM, SPF, and DMARC configuration.
- **Webhooks**: Delivery status webhooks (delivered, bounced, complained) feed into our notification tracking system.
- **Cost**: Free tier (100 emails/day) for development. Pro tier ($20/month for 50k emails) sufficient for 500 properties.
- **API simplicity**: Single REST endpoint. No SMTP configuration needed. Reduces attack surface.

### Email Types (PRD 09: Communication)

| Email Type           | Trigger                  | Template                   |
| -------------------- | ------------------------ | -------------------------- |
| Package notification | Package received         | `package-received.tsx`     |
| Maintenance update   | Status change            | `maintenance-update.tsx`   |
| Booking confirmation | Booking created/approved | `booking-confirmation.tsx` |
| Announcement         | Published                | `announcement.tsx`         |
| Password reset       | Forgot password          | `password-reset.tsx`       |
| Welcome/activation   | Account created          | `welcome.tsx`              |
| Data quality digest  | Weekly cron              | `data-quality-digest.tsx`  |
| Invoice              | Subscription payment     | `invoice.tsx`              |
| Emergency broadcast  | Admin-triggered          | `emergency.tsx`            |

### Rejected Alternatives

| Alternative  | Rejection reason                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AWS SES**  | Cheapest option ($0.10/1000 emails) but requires manual DKIM/DMARC setup, no React Email integration, bare-bones API. Template management is primitive.  |
| **Postmark** | Excellent deliverability and transactional email focus. More expensive than Resend. No React Email native integration (requires HTML string conversion). |
| **SendGrid** | Feature bloat. Marketing email features we do not need. Higher pricing tier. Acquired by Twilio, uncertain roadmap.                                      |
| **Mailgun**  | EU-focused pricing advantage we do not need (our market is Canada). Less developer-friendly API than Resend.                                             |

### Known Limitations

- Resend is a younger company than SendGrid/Mailgun. Mitigated by keeping email sending behind an interface (`src/server/email/sender.ts`) so the provider can be swapped without changing application code.
- No built-in email scheduling (send-at). We handle this through our job queue (Section 18).

---

## 13. SMS Delivery

| Property           | Value                   |
| ------------------ | ----------------------- |
| **Technology**     | Twilio                  |
| **Client library** | `twilio` (official SDK) |
| **Version pin**    | Latest stable           |
| **License**        | MIT (SDK)               |
| **Status**         | **Not yet installed**   |

### Why Twilio

- **Canadian compliance**: Canadian long codes and toll-free numbers for A2P (Application-to-Person) messaging. Registered sender required under CRTC anti-spam regulations.
- **Voice calls**: Twilio also provides voice call API for emergency broadcasts (PRD 09: Emergency Broadcast v2). One vendor for both SMS and voice.
- **Delivery receipts**: Status callbacks (queued, sent, delivered, failed) for SMS tracking.
- **Phone number verification**: Twilio Verify for phone number validation (DATA-QUALITY.md Section 2).

### SMS Types

| SMS Type             | Trigger                                      | PRD Reference |
| -------------------- | -------------------------------------------- | ------------- |
| Package notification | Package received (if resident opted for SMS) | PRD 04        |
| Emergency broadcast  | Admin-triggered emergency                    | PRD 09        |
| 2FA codes            | Login with SMS-based 2FA                     | PRD 01        |
| Booking reminder     | 24h before amenity booking                   | PRD 06        |
| Maintenance update   | Critical status changes                      | PRD 05        |

### Rejected Alternatives

| Alternative        | Rejection reason                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AWS SNS**        | Cheaper per message but no voice call integration. Would need a separate service for emergency voice broadcasts. No Canadian long code management. |
| **Vonage (Nexmo)** | Viable alternative. Less developer-friendly API. Fewer Canadian-specific features.                                                                 |
| **MessageBird**    | EU-focused. Weaker Canadian presence.                                                                                                              |

### Cost Estimate

- SMS to Canadian numbers: ~$0.0075/message
- At 500 properties x 20 SMS/day average = 10,000 SMS/day = ~$75/day = ~$2,250/month

### Known Limitations

- SMS delivery is not guaranteed (carrier filtering, invalid numbers). Always pair SMS with another channel (email + push).
- 10DLC registration required for US numbers. Process takes 1-2 weeks.
- Twilio pricing can spike during emergency broadcasts to all residents. Budget for burst capacity.

---

## 14. Push Notifications

| Property        | Value                                               |
| --------------- | --------------------------------------------------- |
| **Technology**  | Firebase Cloud Messaging (FCM) via `firebase-admin` |
| **Version pin** | Latest stable                                       |
| **License**     | Apache-2.0 (SDK)                                    |
| **Status**      | **Not yet installed**                               |

### Why FCM

- **Web Push**: FCM supports Web Push (via Service Workers) for browser notifications on desktop. This is our primary use case since 99% of users are on desktop monitors.
- **Free**: No per-message cost for push notifications. Only infrastructure cost is the Firebase project (free tier sufficient).
- **Cross-platform**: When we build native mobile apps (v3+), FCM handles iOS (via APNs bridge) and Android natively.
- **Topic messaging**: Subscribe users to topics (e.g., `property-{id}-announcements`) for efficient broadcast to thousands of users.

### Implementation Pattern

```
Browser (Service Worker) ← FCM ← Concierge Server
```

1. Browser requests push permission on first login.
2. If granted, registers a Service Worker and obtains an FCM token.
3. Token stored in the database, associated with the user session.
4. Server sends push via `firebase-admin` SDK with the FCM token.
5. Service Worker receives the push and displays a native notification.

### Rejected Alternatives

| Alternative                          | Rejection reason                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OneSignal**                        | Third-party service with its own dashboard and user management. Adds vendor dependency for what is essentially a thin wrapper around FCM/APNs. Extra cost at scale. |
| **Web Push directly (web-push npm)** | Lower-level, requires managing VAPID keys, handling expiry, and building retry logic. FCM abstracts this while adding topic messaging and analytics.                |
| **Pusher**                           | Real-time messaging service, not push notifications. Would need to keep a WebSocket connection open. Not suitable for offline delivery.                             |

### Known Limitations

- Push notifications require user permission. Approximately 40-60% of users grant permission. Always have email as fallback.
- iOS Safari Web Push requires the site to be added to the home screen (prior to iOS 16.4) or a PWA manifest. Not a concern for our desktop-first audience.
- FCM requires a Google account and Firebase project. Minimal vendor coupling since we only use the messaging API.

---

## 15. PDF Generation

| Property        | Value                 |
| --------------- | --------------------- |
| **Technology**  | `@react-pdf/renderer` |
| **Version pin** | Latest stable (3.x)   |
| **License**     | MIT                   |
| **Status**      | **Not yet installed** |

### Why React PDF

- **React components as templates**: PDF layouts are React components. Developers use the same JSX patterns they already know. No separate templating language.
- **Server-side rendering**: Generates PDFs in Node.js without a browser. No Puppeteer/Playwright dependency. No Chrome binary in the Docker image.
- **Streaming**: Can stream PDF generation for large reports, keeping memory usage constant.
- **i18n compatible**: Since templates are React components, they can use our i18n system for bilingual reports (English/French-Canadian).

### PDF Types (PRD 10, 28)

| Document                | Content                     | Triggered By           |
| ----------------------- | --------------------------- | ---------------------- |
| Package label           | Barcode + unit + date       | Package intake         |
| Work order              | Maintenance request details | Maintenance assignment |
| Compliance report       | Audit data, access logs     | PRD 28                 |
| Invoice PDF             | Billing details, line items | PRD 24                 |
| Data export cover sheet | Export metadata, checksums  | PRD 27                 |
| Amenity booking receipt | Booking confirmation        | PRD 06                 |

### Rejected Alternatives

| Alternative                    | Rejection reason                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Puppeteer/Playwright**       | Requires a headless Chrome binary (~300MB). Heavy for containerized deployments. Slow (seconds per PDF). Memory-hungry.                     |
| **PDFKit**                     | Low-level API. Building layouts requires manual coordinate math. No component-based composition.                                            |
| **jsPDF**                      | Client-side focused. Limited layout capabilities. Not suitable for complex server-generated reports.                                        |
| **html-pdf / wkhtmltopdf**     | Deprecated. Uses an old WebKit binary. Security concerns with untrusted HTML.                                                               |
| **Gotenberg (Docker service)** | Powerful but adds a separate Docker container to manage. Overkill when @react-pdf/renderer handles our needs without external dependencies. |

### Known Limitations

- `@react-pdf/renderer` does not support all CSS properties. Complex table layouts may require workarounds.
- Font embedding increases PDF size. We embed Inter (our design system font) at ~200KB per variant.
- No interactive PDF features (forms, annotations). Our PDFs are read-only documents.

---

## 16. Excel Generation

| Property        | Value                 |
| --------------- | --------------------- |
| **Technology**  | ExcelJS               |
| **Version pin** | Latest stable (4.x)   |
| **License**     | MIT                   |
| **Status**      | **Not yet installed** |

### Why ExcelJS

- **Streaming writes**: Can write XLSX files row-by-row without loading the entire dataset in memory. Critical for large exports (PRD 10: "Export on every listing page", PRD 27: Data Migration).
- **Rich formatting**: Supports cell styles, conditional formatting, merged cells, number formats, and multiple worksheets. Reports need headers, subtotals, and color-coded status columns.
- **CSV support**: Also reads and writes CSV files, used for the data import pipeline (PRD 27).
- **No binary dependencies**: Pure JavaScript. No native modules that complicate Docker builds.

### Rejected Alternatives

| Alternative                   | Rejection reason                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **SheetJS (xlsx)**            | Community edition lacks streaming writes. Pro edition requires a commercial license ($750+/year). Core features are being moved behind paywall. |
| **csv-parse / csv-stringify** | CSV only. No XLSX support. We need formatted Excel files with multiple sheets, headers, and styles.                                             |
| **Archiver + XML**            | Manual XLSX XML assembly. Fragile, hard to maintain, and reinvents what ExcelJS already does.                                                   |

---

## 17. Search Engine

| Property       | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| **Technology** | PostgreSQL Full-Text Search (v1), Typesense (v2)                        |
| **License**    | PostgreSQL License (v1), GPL-3.0 with Commons Clause (Typesense server) |
| **Status**     | **Not yet implemented**                                                 |

### v1: PostgreSQL Full-Text Search

For v1, we use PostgreSQL's built-in full-text search. This eliminates an additional service to deploy and monitor.

#### Implementation

```sql
-- Add tsvector columns to searchable tables
ALTER TABLE events ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX idx_events_search ON events USING GIN(search_vector);

-- French-Canadian search uses 'french' dictionary
ALTER TABLE events ADD COLUMN search_vector_fr tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED;
```

#### Why PostgreSQL FTS for v1

- **Zero additional infrastructure**: No separate search service to deploy, scale, and secure.
- **Transactional consistency**: Search results are always up-to-date (no replication lag).
- **Multi-tenant isolation**: Search queries naturally include `WHERE property_id = ?` since they use the same database.
- **French-Canadian support**: PostgreSQL ships with a French dictionary for stemming and stop words.
- **pg_trgm**: Trigram similarity search for fuzzy matching (typo-tolerant search).

#### Performance Target

- < 200ms p50 for searches across 10,000 events per property (TESTING-STRATEGY.md Section 10).
- GIN indexes keep search performant up to ~100k rows per property.

### v2: Typesense

When search volume or complexity exceeds PostgreSQL's capabilities:

| Feature                | PostgreSQL FTS    | Typesense            |
| ---------------------- | ----------------- | -------------------- |
| **Typo tolerance**     | pg_trgm (good)    | Built-in (excellent) |
| **Faceted search**     | Manual (slow)     | Built-in (fast)      |
| **Relevance tuning**   | Limited           | Extensive            |
| **Search-as-you-type** | Possible but slow | < 50ms               |
| **Geosearch**          | PostGIS extension | Built-in             |

#### Why Typesense over Alternatives

| Alternative       | Rejection reason                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Meilisearch**   | Similar feature set. Typesense has better multi-tenant support (scoped API keys per collection), which maps to our property isolation model. |
| **Elasticsearch** | Massive operational overhead (JVM, cluster management, memory tuning). Overkill for our search volumes. Expensive to run.                    |
| **Algolia**       | Cloud-only, per-search pricing. At 500 properties with frequent searches, costs escalate quickly ($1+ per 1000 searches).                    |

---

## 18. Job Queue & Background Processing

| Property        | Value                 |
| --------------- | --------------------- |
| **Technology**  | BullMQ                |
| **Version pin** | Latest stable (5.x)   |
| **License**     | MIT                   |
| **Status**      | **Not yet installed** |

### Why BullMQ

- **Redis-backed**: Uses our existing Redis instance. No additional infrastructure.
- **Concurrency control**: Configurable worker concurrency. Critical for rate-limited external APIs (Twilio, Resend).
- **Retry with backoff**: Exponential backoff for failed jobs. Essential for webhook delivery (WebhookDelivery model in schema.prisma).
- **Scheduled jobs**: Cron-like scheduling for recurring tasks (data quality scans, stale flag detection, weekly digests).
- **Job priorities**: Urgent jobs (emergency broadcasts) process before normal jobs (weekly reports).
- **Admin dashboard**: Bull Board provides a web UI for monitoring queues, retrying failed jobs, and draining queues.

### Queue Types

| Queue         | Job Types                                                 | Concurrency | Retry Policy                                          |
| ------------- | --------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| `email`       | Package notification, password reset, digests             | 10          | 3 retries, exponential backoff (30s, 2m, 10m)         |
| `sms`         | Package SMS, emergency broadcast, 2FA                     | 5           | 3 retries, exponential backoff                        |
| `push`        | FCM push notifications                                    | 20          | 2 retries, 30s delay                                  |
| `webhook`     | Webhook deliveries (PRD 26)                               | 10          | 5 retries, exponential backoff (1m, 5m, 30m, 2h, 24h) |
| `export`      | PDF/Excel report generation, data exports                 | 3           | 1 retry, 5m delay                                     |
| `import`      | CSV data import processing (PRD 27)                       | 2           | No auto-retry (user re-triggers)                      |
| `maintenance` | Data quality scans, stale data cleanup, search index sync | 1           | 3 retries                                             |
| `analytics`   | PostHog event batching                                    | 5           | 2 retries                                             |

### Rejected Alternatives

| Alternative          | Rejection reason                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inngest**          | Event-driven functions with built-in scheduling. Cloud-hosted adds vendor dependency. Self-hosted option is newer and less battle-tested than BullMQ. Higher abstraction level than we need. |
| **pg-boss**          | PostgreSQL-backed queue. Eliminates Redis dependency but adds load to the primary database. Poll-based, not push-based. Higher latency than BullMQ.                                          |
| **AWS SQS + Lambda** | Serverless queue. Adds AWS-specific coupling. Lambda cold starts conflict with our sub-500ms SLA. No built-in cron scheduling.                                                               |
| **Temporal**         | Workflow orchestration engine. Massive operational overhead for what are mostly simple async jobs. Appropriate for complex multi-step workflows but overkill for v1.                         |

### Known Limitations

- BullMQ requires Redis >= 5.0 (we use Redis 7, so no issue).
- Job data is stored in Redis. Large payloads (e.g., CSV file contents) should not be stored in the job; store a reference (S3 key) instead.
- No built-in dead letter queue UI. Bull Board provides job inspection but manual intervention for poisoned jobs.

---

## 19. Real-Time Communication

| Property        | Value                              |
| --------------- | ---------------------------------- |
| **Technology**  | Socket.io 4.x                      |
| **Version pin** | `^4.8.1`                           |
| **License**     | MIT                                |
| **Status**      | Installed (both server and client) |

### Why Socket.io

- **WebSocket + fallback**: Socket.io automatically falls back to HTTP long-polling if WebSockets are blocked (common in corporate networks where condo management portals are accessed).
- **Rooms**: Socket.io rooms map directly to `property:{propertyId}` for multi-tenant event broadcasting. A security guard at Property A does not receive events from Property B.
- **Redis adapter**: `@socket.io/redis-adapter` enables horizontal scaling. Multiple Socket.io server instances share state via Redis pub/sub.
- **Already installed**: Both `socket.io` (server) and `socket.io-client` (client) are in package.json.

### Real-Time Events

| Event              | Direction       | Use Case                                          | PRD        |
| ------------------ | --------------- | ------------------------------------------------- | ---------- |
| `event:created`    | Server → Client | New package/visitor/incident appears on dashboard | PRD 03, 04 |
| `event:updated`    | Server → Client | Status change on event card                       | PRD 03     |
| `notification:new` | Server → Client | Bell icon badge increment                         | PRD 09     |
| `presence:update`  | Bidirectional   | Online staff indicator on security console        | PRD 03     |
| `shift:note`       | Server → Client | New shift log entry from another staff member     | PRD 03     |

### Rejected Alternatives

| Alternative                  | Rejection reason                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server-Sent Events (SSE)** | Unidirectional (server to client only). Cannot handle presence updates or bidirectional communication.                                                                        |
| **Pusher**                   | Third-party hosted WebSocket service. Per-connection pricing. At 500 properties with 5-10 concurrent staff each = 2,500-5,000 connections = $50-100/month. Socket.io is free. |
| **Ably**                     | Similar to Pusher. Higher reliability guarantees we do not need for non-critical real-time updates.                                                                           |
| **tRPC subscriptions**       | Tied to tRPC ecosystem. We use plain API routes, not tRPC.                                                                                                                    |

### Deployment Note

Socket.io runs as a separate process alongside the Next.js server in the same container (or as a sidecar). It does NOT run inside Next.js API routes because WebSocket connections are long-lived and incompatible with serverless function lifecycle.

---

## 20. Monitoring & Observability

| Component                  | Technology                                  | Purpose                                                           | License                |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------------------- | ---------------------- |
| **Error tracking**         | Sentry                                      | Capture, deduplicate, and alert on runtime errors                 | BSL (client SDKs: MIT) |
| **APM / Tracing**          | OpenTelemetry + Sentry Performance          | Distributed tracing across API routes, DB queries, external calls | Apache-2.0 (OTel)      |
| **Infrastructure metrics** | AWS CloudWatch                              | CPU, memory, disk, network for ECS/RDS/ElastiCache                | N/A (AWS service)      |
| **Uptime monitoring**      | Better Stack (formerly Better Uptime)       | External health checks every 30s, status page (PRD 25)            | N/A (SaaS)             |
| **Log aggregation**        | AWS CloudWatch Logs (v1), Grafana Loki (v2) | Centralized log storage and search                                | Apache-2.0 (Loki)      |

### Why Sentry for Errors

- **Next.js integration**: `@sentry/nextjs` hooks into Server Components, API routes, edge middleware, and client-side code with a single configuration.
- **Source maps**: Automatic source map upload during build. Stack traces show original TypeScript code, not minified output.
- **Breadcrumbs**: Automatic breadcrumb collection (HTTP requests, console logs, UI events) provides context for every error.
- **Release tracking**: Sentry releases correlate errors with specific deployments. Instant regression detection.
- **PII scrubbing**: Built-in data scrubbing for emails, IP addresses, and credit card numbers. Configurable deny lists.

### Why OpenTelemetry for Tracing

- **Vendor-neutral**: OTel instrumentation works with any backend (Sentry, Jaeger, Honeycomb, Grafana Tempo). No vendor lock-in.
- **Automatic instrumentation**: `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-pg` (Prisma queries), and `@opentelemetry/instrumentation-redis` capture spans without manual code.
- **Request correlation**: The `x-request-id` header (generated in middleware.ts) becomes the trace ID. Correlates logs, errors, and traces for a single request.

### Rejected Alternatives

| Alternative            | Rejection reason                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Datadog**            | Comprehensive but expensive ($23/host/month for APM). Overkill for v1. Consider for v3+ if observability needs grow. |
| **New Relic**          | Similar to Datadog. High cost, complex pricing model.                                                                |
| **Bugsnag**            | Error tracking only, no APM. Sentry covers both.                                                                     |
| **Self-hosted Sentry** | Operational overhead (PostgreSQL, Clickhouse, Kafka, Redis, Snuba). Not justified at our scale. Use Sentry cloud.    |

---

## 21. Logging

| Property        | Value                          |
| --------------- | ------------------------------ |
| **Technology**  | Pino 9.x                       |
| **Version pin** | `^9.6.0`                       |
| **License**     | MIT                            |
| **Status**      | Installed (pino + pino-pretty) |

### Why Pino

- **Performance**: Fastest Node.js logger. 5x faster than Winston due to worker-thread-based serialization.
- **Structured JSON**: Every log line is a JSON object. Parsed by CloudWatch Logs, Grafana Loki, or any log aggregator without custom parsers.
- **Log sanitization**: Our `src/server/middleware/log-sanitizer.ts` strips PII from log output. Pino's serializers make this straightforward.
- **Already integrated**: `src/server/logger.ts` creates the Pino instance. `pino-pretty` is a dev dependency for human-readable local logs.

### Log Levels

| Level   | When                                                                        |
| ------- | --------------------------------------------------------------------------- |
| `fatal` | Application cannot continue (missing DB, missing env vars)                  |
| `error` | Unexpected failures (uncaught exceptions, failed external calls)            |
| `warn`  | Degraded operation (rate limit approached, slow query, retried job)         |
| `info`  | Significant business events (user login, package created, export completed) |
| `debug` | Detailed diagnostic (query params, resolved feature flags)                  |
| `trace` | Extremely verbose (full request/response bodies). Never in production.      |

---

## 22. Analytics

| Property       | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| **Technology** | PostHog (self-hosted) for product analytics, Plausible for marketing |
| **License**    | MIT (PostHog), AGPL-3.0 (Plausible)                                  |
| **Status**     | **Not yet installed**                                                |

**Full specification**: See `docs/tech/ANALYTICS-FRAMEWORK.md`. PostHog self-hosted in `ca-central-1` for PIPEDA compliance. Autocapture disabled. Session recording disabled. No PII in events.

---

## 23. Payment Processing

| Property           | Value                   |
| ------------------ | ----------------------- |
| **Technology**     | Stripe                  |
| **Client library** | `stripe` (official SDK) |
| **Version pin**    | Latest stable           |
| **License**        | MIT (SDK)               |
| **Status**         | **Not yet installed**   |

### Why Stripe

- **Canadian compliance**: Stripe is a registered Payment Facilitator in Canada. Handles PCI DSS compliance, so we never touch raw card data.
- **Subscription billing**: Native support for recurring subscriptions with 3 tiers (Starter, Professional, Enterprise per schema.prisma `SubscriptionTier` enum).
- **Invoicing**: Automatic invoice generation with PDF download (PRD 24: Billing & Subscription).
- **Webhook events**: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated` drive our subscription lifecycle.
- **Dunning**: Automatic retry for failed payments with configurable retry schedules.
- **Stripe Checkout**: Hosted payment page eliminates PCI scope from our application. We redirect to Stripe, never see card numbers.
- **Multi-currency**: CAD primary, USD for American customers. Stripe handles currency conversion.
- **Already modeled**: `Subscription`, `Invoice` tables in schema.prisma include `stripeCustomerId`, `stripeSubscriptionId`, `stripeInvoiceId`.

### Rejected Alternatives

| Alternative   | Rejection reason                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Square**    | Weaker subscription billing. Stronger for in-person payments (not our use case).                                                         |
| **Chargebee** | Subscription management layer on top of payment gateways. Adds abstraction without clear benefit. Stripe handles subscriptions natively. |
| **Paddle**    | Merchant of Record model (Paddle handles tax/invoicing). Less control over the billing experience. Higher revenue share.                 |

---

## 24. Image Processing

| Property           | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| **Technology**     | Sharp (server-side) + Next.js Image Optimization               |
| **Client library** | `sharp`                                                        |
| **Version pin**    | Latest stable                                                  |
| **License**        | Apache-2.0                                                     |
| **Status**         | **Not yet installed** (Next.js image optimization is built-in) |

### Why Sharp

- **Upload processing**: When users upload photos (maintenance requests, profile avatars, package photos), Sharp resizes, compresses, and strips EXIF data before storing to S3.
- **Format conversion**: Convert uploaded images to WebP/AVIF for storage. Reduces S3 storage costs and improves download speed.
- **Metadata stripping**: EXIF data can contain GPS coordinates, device info, and timestamps. Must be stripped for privacy (Security Rulebook).
- **Thumbnail generation**: Generate 150x150, 300x300, and original-size variants on upload.
- **Performance**: Sharp uses libvips (C library), processing images 4-10x faster than ImageMagick/GraphicsMagick.

### Next.js Image Optimization

Already configured in `next.config.ts` with AVIF + WebP formats and remote patterns for S3 buckets. Handles responsive image generation and lazy loading on the client.

### Rejected Alternatives

| Alternative    | Rejection reason                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudinary** | Cloud-based image CDN. Per-transformation pricing. At our image volume, cost is higher than Sharp + S3 + CloudFront. Adds vendor dependency. |
| **imgproxy**   | Docker-based image processing proxy. Good for on-the-fly transformations but we prefer pre-processing on upload for predictable performance. |
| **Jimp**       | Pure JavaScript image processing. 10-50x slower than Sharp. No AVIF support.                                                                 |

---

## 25. Rate Limiting

| Property       | Value                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| **Technology** | Custom Redis-based implementation (already in `src/server/middleware/rate-limit.ts`) |
| **Algorithm**  | Sliding window counter                                                               |
| **Status**     | Implemented                                                                          |

### Rate Limit Tiers

| Endpoint Category                           | Window     | Limit                                   | Key                   |
| ------------------------------------------- | ---------- | --------------------------------------- | --------------------- |
| **Authentication** (login, forgot-password) | 15 minutes | 5 attempts                              | IP address            |
| **API read** (GET endpoints)                | 1 minute   | 100 requests                            | User ID + Property ID |
| **API write** (POST/PUT/DELETE)             | 1 minute   | 30 requests                             | User ID + Property ID |
| **File upload**                             | 1 hour     | 50 uploads                              | User ID               |
| **Search**                                  | 1 minute   | 30 queries                              | User ID + Property ID |
| **Webhook delivery** (outbound)             | 1 minute   | 60 deliveries                           | Property ID           |
| **Public API** (PRD 26)                     | 1 hour     | Configurable per API key (default 1000) | API key hash          |

### Why Custom (Not a Library)

- Our rate limiting must be multi-tenant aware (per property, per user, per API key).
- Off-the-shelf libraries (express-rate-limit, rate-limiter-flexible) assume single-tenant patterns.
- The existing implementation in `rate-limit.ts` uses Redis `INCR` + `EXPIRE` for atomic, distributed rate limiting.

---

## 26. Caching Patterns

### Cache Layers

| Layer             | Technology                              | TTL                          | Invalidation                      | Use Case                                           |
| ----------------- | --------------------------------------- | ---------------------------- | --------------------------------- | -------------------------------------------------- |
| **HTTP cache**    | `Cache-Control` headers + CloudFront    | 24h (public assets), 0 (API) | CloudFront invalidation           | Static assets, property logos                      |
| **Data cache**    | Redis                                   | 60s-5m                       | Event-driven invalidation         | Feature flags, property settings, role permissions |
| **Next.js cache** | Built-in fetch cache + `unstable_cache` | 60s                          | `revalidateTag()`                 | Server Component data fetching                     |
| **Client cache**  | React Query (TanStack Query)            | 30s-5m                       | `queryClient.invalidateQueries()` | Client Component data fetching                     |

### Client-Side Data Fetching

| Property        | Value                           |
| --------------- | ------------------------------- |
| **Technology**  | TanStack Query (React Query) v5 |
| **Version pin** | Latest stable                   |
| **License**     | MIT                             |
| **Status**      | **Not yet installed**           |

#### Why TanStack Query

- **Stale-while-revalidate**: Shows cached data instantly, refetches in the background. Critical for the front desk workflow where staff switch between tabs rapidly.
- **Automatic refetch**: Refetch on window focus, network reconnect, and configurable intervals.
- **Optimistic updates**: Update the UI immediately when creating/releasing packages, then reconcile with the server response.
- **Query invalidation**: When a package is created, invalidate the package list query. Precise control over what refetches.
- **DevTools**: Built-in devtools panel for debugging cache state during development.

#### Rejected Alternatives

| Alternative                 | Rejection reason                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SWR**                     | Simpler API but fewer features (no mutation tracking, no query invalidation by key, no infinite queries). TanStack Query's feature set matches our needs better. |
| **Apollo Client**           | GraphQL-focused. We use REST API routes. Adding GraphQL would double the API surface.                                                                            |
| **Native fetch + useState** | No caching, no deduplication, no automatic refetch. Manual cache management is error-prone.                                                                      |

---

## 27. CI/CD

| Property       | Value                  |
| -------------- | ---------------------- |
| **Technology** | GitHub Actions         |
| **License**    | N/A (GitHub service)   |
| **Status**     | **Not yet configured** |

### Why GitHub Actions

- **Repository integration**: Workflows live in `.github/workflows/` alongside the code. PR checks, merge pipelines, and scheduled jobs in one place.
- **Caching**: `actions/cache` for pnpm store, Next.js build cache, and Playwright browser binaries. Reduces CI time from 15m to < 8m.
- **Matrix builds**: Run tests across Node 22 and multiple OS (Ubuntu, macOS for native modules like argon2).
- **Environments**: GitHub Environments for staging and production with manual approval gates.
- **Cost**: Free for public repos. Private repos: 2,000 free minutes/month, then $0.008/minute. Estimated: 500-800 minutes/month.

### Pipeline Definition (per TESTING-STRATEGY.md Section 13)

```
PR Pipeline (< 8 minutes):
  pnpm install (cached) → lint → typecheck → unit tests → integration tests → build → preview deploy

Merge Pipeline (< 25 minutes):
  All PR steps → E2E tests → DAST scan → staging deploy → smoke tests → manual approval → production deploy
```

### Rejected Alternatives

| Alternative   | Rejection reason                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CircleCI**  | Similar features. No advantage over GitHub Actions for a GitHub-hosted repo. Additional vendor account.                                                   |
| **GitLab CI** | Would require migrating repository to GitLab. Team uses GitHub.                                                                                           |
| **Jenkins**   | Self-hosted. Massive operational overhead. Plugin ecosystem is fragile.                                                                                   |
| **Vercel CI** | Handles deployments well but lacks the flexibility for custom security scanning (OWASP ZAP), multi-database integration tests, and manual approval gates. |

---

## 28. Hosting & Infrastructure

| Component              | Service                                          | Region                                | Why                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------- | --------------------------------------------------- |
| **Application**        | AWS ECS Fargate (v1) or Vercel (preview/staging) | ca-central-1                          | PIPEDA compliance requires Canadian data residency  |
| **Database**           | AWS RDS PostgreSQL 16                            | ca-central-1                          | Managed PostgreSQL with automated backups, Multi-AZ |
| **Cache**              | AWS ElastiCache Redis 7                          | ca-central-1                          | Managed Redis with failover                         |
| **File storage**       | AWS S3                                           | ca-central-1                          | Object storage with lifecycle policies              |
| **CDN**                | CloudFront                                       | Global edge                           | Low-latency asset delivery                          |
| **DNS**                | AWS Route 53                                     | Global                                | Reliable DNS with health checks                     |
| **Secrets**            | AWS Secrets Manager                              | ca-central-1                          | Encrypted secret storage for JWT keys, API keys     |
| **Certificates**       | AWS Certificate Manager                          | ca-central-1 + us-east-1 (CloudFront) | Free TLS certificates with auto-renewal             |
| **Container registry** | AWS ECR                                          | ca-central-1                          | Private Docker image storage                        |

### Why AWS (Not Multi-Cloud)

- **Canadian region**: `ca-central-1` (Montreal) provides data residency for PIPEDA. All 8 compliance frameworks (PIPEDA, GDPR, SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, HIPAA) can be met on AWS.
- **Managed services**: RDS, ElastiCache, and S3 reduce operational burden. We manage application code, not infrastructure.
- **ECS Fargate**: Serverless containers without managing EC2 instances. Scales to zero during off-hours (Canadian condo buildings have predictable 8am-10pm usage patterns).
- **Single-vendor simplicity**: Networking, IAM, and monitoring work seamlessly within AWS. No cross-cloud networking complexity.

### Rejected Alternatives

| Alternative                  | Rejection reason                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vercel (production)**      | No Canadian region. Data would be processed in US East. PIPEDA compliance concern for a Canadian condo management platform. Vercel is used for preview deployments only. |
| **GCP**                      | Montreal region available. However, GCP's managed PostgreSQL (Cloud SQL) has weaker RLS support than AWS RDS. Less familiarity on team.                                  |
| **Azure**                    | Canada Central region available. More complex IAM model. Weaker developer experience for container workloads compared to ECS Fargate.                                    |
| **Railway / Render**         | No Canadian regions. Limited compliance certifications. Appropriate for prototyping, not production.                                                                     |
| **Self-hosted (bare metal)** | Maximum control but maximum operational burden. Not justified until regulatory requirements demand it.                                                                   |

---

## 29. Testing Tools

| Tool                    | Purpose                                         | Version    | License    | Status                |
| ----------------------- | ----------------------------------------------- | ---------- | ---------- | --------------------- |
| **Vitest**              | Unit + integration test runner                  | `^3.0.5`   | MIT        | Installed             |
| **Playwright**          | E2E browser testing                             | `^1.50.1`  | Apache-2.0 | Installed             |
| **Testing Library**     | Component testing (React, user-event, jest-dom) | `^16.2.0`  | MIT        | Installed             |
| **axe-core/playwright** | Accessibility testing in E2E                    | `^4.10.1`  | MPL-2.0    | Installed             |
| **Storybook**           | Component development + visual testing          | `^8.6.18`  | MIT        | Installed             |
| **MSW**                 | API mocking for component tests                 | Latest 2.x | MIT        | **Not yet installed** |
| **Faker.js**            | Test data generation                            | Latest 9.x | MIT        | **Not yet installed** |
| **k6**                  | Load/performance testing (v2)                   | Latest     | AGPL-3.0   | **Not yet installed** |

**Full specification**: See `docs/tech/TESTING-STRATEGY.md`.

---

## 30. Code Quality

| Tool                       | Purpose                          | Version   | License    | Status    |
| -------------------------- | -------------------------------- | --------- | ---------- | --------- |
| **ESLint 9**               | Linting (flat config)            | `^9.20.0` | MIT        | Installed |
| **Prettier**               | Code formatting                  | `^3.5.1`  | MIT        | Installed |
| **Husky**                  | Git hooks (pre-commit, pre-push) | `^9.1.7`  | MIT        | Installed |
| **lint-staged**            | Run linters on staged files only | `^15.4.3` | MIT        | Installed |
| **TypeScript strict mode** | Type-level error prevention      | `^5.7.3`  | Apache-2.0 | Installed |

### ESLint Plugin Stack

| Plugin                             | Purpose                                                | Status                |
| ---------------------------------- | ------------------------------------------------------ | --------------------- |
| `eslint-config-next`               | Next.js-specific rules (no img element, link handling) | Installed             |
| `@typescript-eslint/eslint-plugin` | TypeScript-specific rules                              | Installed             |
| `eslint-plugin-security`           | Security anti-patterns (eval, hardcoded secrets)       | **Not yet installed** |
| `eslint-plugin-jsx-a11y`           | Accessibility rules for JSX                            | **Not yet installed** |

---

## 31. Security Tooling

| Tool                | Purpose                              | When                                  | Status                 |
| ------------------- | ------------------------------------ | ------------------------------------- | ---------------------- |
| **gitleaks**        | Secret scanning in git history       | Pre-commit + CI                       | **Not yet installed**  |
| **OWASP ZAP**       | Dynamic application security testing | Post-deploy to staging                | **Not yet configured** |
| **license-checker** | License compliance auditing          | Weekly CI job                         | **Not yet installed**  |
| **pnpm audit**      | Dependency vulnerability scanning    | Every PR (configured in package.json) | Configured             |

---

## 32. AI & LLM Integration

| Property             | Value                         |
| -------------------- | ----------------------------- |
| **Primary LLM**      | Claude (Anthropic) via API    |
| **Secondary LLM**    | OpenAI GPT-4 via API          |
| **Client libraries** | `@anthropic-ai/sdk`, `openai` |
| **Status**           | **Not yet installed**         |

### AI Use Cases (PRD 19: AI Framework)

| Feature                    | Model  | Why                                                                                           |
| -------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| **Smart search**           | Claude | Natural language queries: "show me all packages for unit 305 this week"                       |
| **Maintenance triage**     | Claude | Auto-categorize and prioritize maintenance requests from description text                     |
| **Announcement drafting**  | Claude | Generate announcement drafts from bullet points                                               |
| **Report summarization**   | Claude | Executive summary of monthly compliance reports                                               |
| **Anomaly detection**      | OpenAI | Statistical anomaly detection on event patterns (unusual package volumes, security incidents) |
| **Translation assistance** | Claude | Assist with French-Canadian translation of admin-created content                              |

### Super Admin AI Controls

- Per-property AI feature toggles (feature flags)
- Token usage monitoring and monthly budget caps per property
- Audit log of all AI-generated content with model, prompt hash, and output hash
- Human-in-the-loop: AI suggestions always require staff confirmation before action

---

## 33. Dependency Policy

### Version Pinning Rules

| Dependency Type                       | Pin Strategy                  | Update Cadence                           |
| ------------------------------------- | ----------------------------- | ---------------------------------------- |
| **Framework (Next.js, React)**        | Caret (`^`) for minor updates | Monthly review, quarterly major upgrades |
| **Database (Prisma, ioredis)**        | Caret (`^`) for minor updates | Monthly review                           |
| **UI (Radix, Lucide)**                | Caret (`^`) for minor updates | As needed                                |
| **Security (jose, argon2)**           | Caret (`^`) for minor updates | Within 48 hours of security advisory     |
| **Dev tools (ESLint, Vitest)**        | Caret (`^`) for minor updates | Monthly                                  |
| **Infrastructure SDKs (AWS, Stripe)** | Caret (`^`) for minor updates | Within 1 week of release                 |

### Dependency Addition Rules

1. Every new dependency must be justified in the PR description: what it does, why we cannot build it ourselves in < 2 hours, and what alternatives were considered.
2. No dependency with fewer than 1,000 weekly npm downloads (exceptions require team lead approval).
3. No dependency with GPL or AGPL license in production dependencies (TESTING-STRATEGY.md Section 11: License compliance).
4. Every dependency is audited for known vulnerabilities before installation (`pnpm audit`).
5. Maximum 80 production dependencies. Current count: 22. Budget: 58 remaining.

### Lock File

- `pnpm-lock.yaml` is committed to the repository. CI installs with `--frozen-lockfile` to ensure reproducible builds.

---

## 34. Gap Analysis Summary

Technologies that are documented above but **not yet installed**. These must be added before v1 launch.

| Priority               | Technology           | Package(s) to Install                                 | Blocks                                                          |
| ---------------------- | -------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| **P0 (blocks MVP)**    | File storage         | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | Maintenance photos, document library, imports/exports           |
| **P0**                 | Email delivery       | `resend`                                              | Package notifications, password reset, all transactional email  |
| **P0**                 | Job queue            | `bullmq`                                              | Background email/SMS delivery, data imports, report generation  |
| **P0**                 | Client data fetching | `@tanstack/react-query`                               | Client Component data fetching with caching                     |
| **P0**                 | i18n                 | `next-intl`                                           | French-Canadian language support (legally required in Quebec)   |
| **P0**                 | Test data            | `@faker-js/faker`                                     | Test data factory (TESTING-STRATEGY.md Section 3)               |
| **P0**                 | API mocking          | `msw`                                                 | Component tests with mocked API (TESTING-STRATEGY.md Section 7) |
| **P0**                 | Error tracking       | `@sentry/nextjs`                                      | Production error monitoring                                     |
| **P1 (blocks launch)** | SMS delivery         | `twilio`                                              | Package SMS, emergency broadcast, 2FA SMS                       |
| **P1**                 | Push notifications   | `firebase-admin`                                      | Browser push notifications                                      |
| **P1**                 | Payment processing   | `stripe`                                              | Subscription billing (PRD 24)                                   |
| **P1**                 | PDF generation       | `@react-pdf/renderer`                                 | Reports, work orders, labels                                    |
| **P1**                 | Excel generation     | `exceljs`                                             | Data export on every listing page                               |
| **P1**                 | Image processing     | `sharp`                                               | Upload resize, EXIF strip, thumbnail generation                 |
| **P1**                 | Security scanning    | `gitleaks` (dev)                                      | Secret scanning in CI                                           |
| **P1**                 | Security linting     | `eslint-plugin-security`, `eslint-plugin-jsx-a11y`    | SAST checks                                                     |
| **P2 (post-launch)**   | AI integration       | `@anthropic-ai/sdk`, `openai`                         | Smart search, auto-triage (PRD 19)                              |
| **P2**                 | Performance testing  | `k6`                                                  | Load testing (v2)                                               |
| **P2**                 | Search engine        | `typesense`                                           | Advanced search (v2, after PG FTS proves insufficient)          |
| **P2**                 | OpenTelemetry        | `@opentelemetry/*` packages                           | Distributed tracing                                             |
| **P2**                 | Analytics            | `posthog-js`, `posthog-node`                          | Product analytics                                               |

---

_Last updated: 2026-03-17_
_Total production dependencies planned: ~40 (within 80 budget)_
_Total dev dependencies planned: ~35_
