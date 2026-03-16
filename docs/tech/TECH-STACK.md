# Concierge — Technology Stack Reference

> **Version**: 1.0 | **Date**: 2026-03-15 | **Status**: LOCKED
>
> This document is the canonical reference for every technology choice in the Concierge platform.
> All version pins, rationale, and constraints are recorded here. No technology should be added
> or changed without updating this document and creating a corresponding ADR.

---

## Table of Contents

1. [Decision Framework](#1-decision-framework)
2. [Runtime & Language](#2-runtime--language)
3. [Frontend Framework](#3-frontend-framework)
4. [Styling & UI](#4-styling--ui)
5. [Animation](#5-animation)
6. [Database](#6-database)
7. [ORM & Data Access](#7-orm--data-access)
8. [Authentication](#8-authentication)
9. [Real-Time Communication](#9-real-time-communication)
10. [Object Storage](#10-object-storage)
11. [Search](#11-search)
12. [AI Gateway](#12-ai-gateway)
13. [Payment Processing](#13-payment-processing)
14. [Email Delivery](#14-email-delivery)
15. [SMS & Voice](#15-sms--voice)
16. [Push Notifications](#16-push-notifications)
17. [Testing](#17-testing)
18. [Code Quality](#18-code-quality)
19. [CI/CD](#19-cicd)
20. [Hosting & Deployment](#20-hosting--deployment)
21. [Monitoring & Observability](#21-monitoring--observability)
22. [Secrets Management](#22-secrets-management)
23. [Caching](#23-caching)
24. [Version Summary Table](#24-version-summary-table)
25. [Future: React Native Mobile](#25-future-react-native-mobile)

---

## 1. Decision Framework

Every technology was evaluated against these criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Security** | 30% | Compliance with PIPEDA, GDPR, SOC2, ISO 27001. Encryption support. Audit capabilities. |
| **Developer Experience** | 20% | TypeScript support, documentation quality, ecosystem maturity. |
| **Performance** | 15% | Response time, bundle size, scalability under load. |
| **Maintainability** | 15% | Community size, release cadence, backward compatibility. |
| **Mobile Readiness** | 10% | API patterns that work for both web and future React Native app. |
| **Cost** | 10% | Licensing, hosting costs, usage-based pricing predictability. |

---

## 2. Runtime & Language

| Property | Value |
|----------|-------|
| **Runtime** | Node.js 22 LTS |
| **Language** | TypeScript 5.6+ |
| **Package Manager** | pnpm 9.x |
| **License** | MIT (Node.js), Apache 2.0 (TypeScript) |

### Why Node.js 22 LTS
- Long-term support until April 2027
- Native ESM support (no CommonJS compatibility layer)
- Built-in `fetch` API (no polyfill needed)
- Performance improvements from V8 engine updates
- Largest ecosystem for web tooling

### Why TypeScript 5.6+
- `strict: true` mode enforced (per RULEBOOK Rule 16)
- `noUncheckedIndexedAccess: true` — prevents undefined access
- `satisfies` keyword for type-safe object literals
- No `any` types allowed — use `unknown` with type guards
- Exact optional property types enabled

### Why pnpm
- 3x faster than npm for install
- Strict dependency resolution (prevents phantom dependencies)
- Built-in workspace support for potential monorepo
- Disk space efficient (content-addressable storage)

### TypeScript Configuration (Key Settings)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true
  }
}
```

---

## 3. Frontend Framework

| Property | Value |
|----------|-------|
| **Framework** | Next.js 15.x (App Router) |
| **React** | 19.x |
| **License** | MIT |
| **ADR** | [ADR-001-framework.md](ADR-001-framework.md) |

### Why Next.js 15 App Router
- **React Server Components (RSC)**: Data-heavy pages (reports, audit logs, dashboards) render on the server — smaller client bundle, faster TTI
- **File-based routing**: Intuitive route structure matches our module organization
- **API Routes**: Backend endpoints co-located in the same project — can extract to standalone later for React Native
- **Middleware**: Authentication, RBAC, and tenant isolation enforced at the edge
- **ISR (Incremental Static Regeneration)**: Static pages (announcements, library) regenerated without full rebuild
- **Image optimization**: Built-in `next/image` with AVIF/WebP
- **Streaming**: Suspense boundaries for progressive page loading

### What It Replaces
- No prior framework (greenfield project)

### Mobile Strategy Alignment
- API Routes serve JSON responses usable by any client (web or React Native)
- Clear separation between page components (web-only) and API layer (shared)
- API routes will be extracted to a standalone Express/Fastify service when React Native development begins

---

## 4. Styling & UI

| Property | Value |
|----------|-------|
| **CSS Framework** | Tailwind CSS 4.x |
| **Component Primitives** | Radix UI (latest) |
| **Icons** | Lucide React |
| **License** | MIT (all three) |
| **ADR** | [ADR-006-styling.md](ADR-006-styling.md) |

### Why Tailwind CSS 4.x
- Utility-first approach maps directly to our design tokens
- CSS custom properties integration — design tokens defined once, consumed everywhere
- Tree-shaking removes unused styles — minimal production CSS
- `@apply` for component-level abstractions when utilities get verbose
- Dark mode support via `dark:` variant (future-proofing)
- Responsive design via `sm:`, `md:`, `lg:`, `xl:`, `2xl:` breakpoints
- Official v4 features: native CSS nesting, Lightning CSS engine, faster builds

### Why Radix UI
- **Unstyled**: We apply our own design system — no fighting framework opinions
- **Accessible by default**: ARIA patterns, keyboard navigation, focus management built-in
- **Composable**: Compound component pattern (e.g., `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`)
- **Components used**: Dialog, DropdownMenu, Select, Checkbox, RadioGroup, Tabs, Tooltip, Popover, ScrollArea, Separator, Switch, Toast, AlertDialog, NavigationMenu, Accordion, Collapsible, ContextMenu, HoverCard, Menubar, Slider, ToggleGroup

### Why Lucide React
- Fork of Feather Icons with 1,400+ icons
- Outlined style at 1.5px stroke — matches our design system
- Tree-shakeable (import only icons used)
- TypeScript definitions included
- 24x24 default size, consistent across all icons

---

## 5. Animation

| Property | Value |
|----------|-------|
| **Library** | Framer Motion 12.x |
| **License** | MIT |
| **ADR** | [ADR-006-styling.md](ADR-006-styling.md) |

### Why Framer Motion
- **Spring physics**: Natural-feeling animations with configurable stiffness/damping
- **Layout animations**: Smooth transitions when elements change position (list reordering, sidebar collapse)
- **AnimatePresence**: Animate elements entering/exiting the DOM (page transitions, toast stacking)
- **Gesture support**: Drag, hover, tap, pan — essential for mobile interactions
- **Variants**: Declarative animation states that propagate through component trees
- **Performance**: Hardware-accelerated transforms, will-change optimization
- **Reduced motion**: Built-in `useReducedMotion()` hook for accessibility

### Key Animation Values (from Design System)

| Animation | Spring Config | Duration |
|-----------|--------------|----------|
| Page transition enter | `stiffness: 300, damping: 30` | ~300ms |
| Page transition exit | `stiffness: 300, damping: 30` | ~200ms |
| Toast slide-in | `stiffness: 400, damping: 25` | ~250ms |
| Card hover lift | `stiffness: 500, damping: 30` | ~150ms |
| Sidebar indicator | `stiffness: 300, damping: 25` | ~200ms |
| Modal open | `stiffness: 260, damping: 20` | ~350ms |
| Skeleton shimmer | CSS linear gradient | 1500ms loop |
| Status badge pulse | CSS keyframe | 2000ms loop |

---

## 6. Database

| Property | Value |
|----------|-------|
| **Database** | PostgreSQL 16+ |
| **License** | PostgreSQL License (permissive, BSD-like) |
| **ADR** | [ADR-002-database.md](ADR-002-database.md) |

### Why PostgreSQL 16+
- **JSONB**: Native JSON storage for custom fields — queryable, indexable, schema-flexible
- **Full-text search**: Built-in `tsvector`/`tsquery` with stemming, ranking, highlighting — no external search engine for v1
- **Row-level security (RLS)**: Defense-in-depth layer for multi-tenant isolation
- **GIN indexes**: Efficient JSONB path queries and full-text search
- **Mature ecosystem**: 30+ years of production reliability
- **Compliance**: AES-256 encryption at rest (via cloud provider), TLS 1.3 in transit
- **PITR (Point-in-Time Recovery)**: Restore to any second — critical for compliance (RPO 1 hour)
- **Partitioning**: Table partitioning by `property_id` for large-scale multi-tenant performance (future optimization)

### Hosting
- **Primary**: AWS RDS PostgreSQL (ca-central-1, Toronto — PIPEDA compliance)
- **Replica**: AWS RDS Read Replica (ca-central-1, Montreal)
- **Cold Standby**: Calgary (archival)

### Key PostgreSQL Features Used

| Feature | Use Case |
|---------|----------|
| JSONB | Custom fields on Event, Unit, Resident, MaintenanceRequest |
| tsvector | Full-text search across all modules |
| GIN Index | JSONB path queries, full-text search |
| Partial Index | Active records only (WHERE status != 'CLOSED') |
| Composite Index | (property_id, status), (property_id, created_at) |
| UUID | Primary keys (no sequential leaking) |
| ENUM | Status fields, priority levels |
| Timestamp with TZ | All date/time fields (timezone-aware) |
| Array | Notification channels, tags |
| Row-Level Security | Defense-in-depth tenant isolation |

---

## 7. ORM & Data Access

| Property | Value |
|----------|-------|
| **ORM** | Prisma 6.x |
| **License** | Apache 2.0 |
| **ADR** | [ADR-002-database.md](ADR-002-database.md) |

### Why Prisma
- **Type-safe queries**: Generated TypeScript types from schema — no runtime type errors
- **Migrations**: Declarative schema changes with automatic migration SQL generation
- **Middleware**: Custom middleware for multi-tenant query filtering (`property_id` injection)
- **Relations**: First-class relation mapping with eager/lazy loading
- **Prisma Studio**: Visual database browser for development
- **Raw SQL escape hatch**: When ORM abstractions are insufficient

### Multi-Tenant Middleware Pattern

```typescript
// Every query automatically filtered by property_id
prisma.$use(async (params, next) => {
  if (params.model && TENANT_SCOPED_MODELS.includes(params.model)) {
    params.args.where = {
      ...params.args.where,
      propertyId: context.propertyId,
    };
  }
  return next(params);
});
```

---

## 8. Authentication

| Property | Value |
|----------|-------|
| **Strategy** | Custom JWT + Refresh Token |
| **Password Hashing** | Argon2id |
| **2FA** | TOTP (RFC 6238) |
| **ADR** | [ADR-003-auth.md](ADR-003-auth.md) |

### Why Custom Auth (Not NextAuth/Clerk/Auth0)
- **Admin-controlled accounts**: No self-registration, no SSO — admin creates every account and assigns roles
- **Multi-tenant isolation**: Auth must enforce property-level access at the token level
- **Role hierarchy**: 12+ roles with custom permission matrices per property
- **2FA enforcement**: Per-role 2FA policy (mandatory for staff, optional for residents)
- **Audit requirements**: Complete login history with device, IP, status — not available in managed auth services
- **Session control**: Admin can invalidate all sessions for a user instantly
- **Cost**: No per-user pricing at scale (managed auth can cost $0.05-0.15/user/month)

### Token Strategy

| Token | Type | Lifetime | Storage | Rotation |
|-------|------|----------|---------|----------|
| Access Token | JWT (RS256) | 15 minutes | Memory / Authorization header | Refreshed via refresh token |
| Refresh Token | Opaque UUID | 7 days | httpOnly secure cookie | Rotated on every use (old token invalidated) |
| 2FA Token | TOTP (6 digits) | 30 seconds | Generated by authenticator app | N/A |

### Password Policy
- Minimum 12 characters
- At least 1 uppercase, 1 lowercase, 1 number, 1 special character
- Checked against Have I Been Pwned API (k-anonymity model — only first 5 chars of SHA-1 hash sent)
- Password history: last 5 passwords cannot be reused
- Hashed with Argon2id (memory: 64MB, iterations: 3, parallelism: 4)

---

## 9. Real-Time Communication

| Property | Value |
|----------|-------|
| **Library** | Socket.io 4.x |
| **Transport** | WebSocket (primary), HTTP long-polling (fallback) |
| **License** | MIT |
| **ADR** | [ADR-004-realtime.md](ADR-004-realtime.md) |

### Why Socket.io
- **Fallback transports**: Automatic fallback to HTTP long-polling when WebSocket blocked
- **Rooms/Namespaces**: Natural mapping to multi-tenant properties (`/property/{id}`)
- **Authentication**: Middleware for JWT validation on connection
- **Acknowledgments**: Guaranteed message delivery with callback confirmation
- **Binary support**: Photo uploads, document sharing in real-time
- **Redis adapter**: Horizontal scaling across multiple server instances

### Events Published

| Event | Trigger | Rooms |
|-------|---------|-------|
| `event:created` | New event logged | Property room |
| `event:updated` | Event status/comment change | Property room + Unit room |
| `package:logged` | New package intake | Property room |
| `package:released` | Package picked up | Property room + Resident room |
| `maintenance:updated` | Status change on request | Property room + Unit room |
| `shift:note` | Shift log entry added | Property room (staff only) |
| `notification:new` | New notification | User-specific room |
| `announcement:published` | New announcement | Property room |

---

## 10. Object Storage

| Property | Value |
|----------|-------|
| **Service** | AWS S3 |
| **Encryption** | SSE-KMS (server-side, per-property keys) |
| **Region** | ca-central-1 (Toronto — PIPEDA) |

### Storage Organization

```
concierge-{environment}/
├── {property_id}/
│   ├── events/
│   │   └── {event_id}/{filename}
│   ├── maintenance/
│   │   └── {request_id}/{filename}
│   ├── units/
│   │   └── {unit_id}/{filename}
│   ├── users/
│   │   └── {user_id}/avatar.{ext}
│   ├── announcements/
│   │   └── {announcement_id}/{filename}
│   ├── training/
│   │   └── {course_id}/{filename}
│   └── branding/
│       ├── logo.{ext}
│       └── email-header.{ext}
```

### File Security
- **Presigned URLs**: All file access through time-limited presigned URLs (15 min expiry)
- **Upload validation**: MIME type checked via magic bytes (not file extension)
- **Size limits**: Images 5MB, Documents 10MB, Videos 50MB
- **Virus scanning**: ClamAV scan on upload before storage
- **Lifecycle policies**: Soft-deleted files moved to Glacier after 90 days, permanently deleted after 2 years

---

## 11. Search

| Property | Value |
|----------|-------|
| **v1** | PostgreSQL Full-Text Search (tsvector/tsquery) |
| **v2** | Meilisearch (dedicated search engine) |

### Why PostgreSQL FTS for v1
- No additional infrastructure to manage
- Good enough for <100K documents
- Built-in stemming, ranking, highlighting
- Supports weighted search (title > description > comments)
- GIN indexes for performance

### Why Meilisearch for v2
- Sub-50ms search results at scale
- Typo tolerance built-in
- Faceted search and filtering
- Instant search (search-as-you-type)
- Easy to self-host, GDPR-compliant
- Will be introduced when search volume exceeds PostgreSQL FTS performance

---

## 12. AI Gateway

| Property | Value |
|----------|-------|
| **Providers** | Claude (Anthropic) + OpenAI |
| **Architecture** | Custom gateway service |
| **ADR** | [ADR-005-ai-gateway.md](ADR-005-ai-gateway.md) |

### Architecture

```
Client → API Route → AI Gateway → Provider (Claude/OpenAI)
                         ↓
                    PII Stripper
                    Cost Meter
                    Rate Limiter
                    Response Cache
                    Audit Logger
```

### Provider Selection Strategy

| Complexity | Provider | Model | Cost/Call |
|-----------|----------|-------|-----------|
| Simple (categorization, suggestions) | Claude | Haiku | ~$0.001 |
| Medium (summaries, analysis) | Claude | Sonnet | ~$0.005 |
| Complex (report generation, insights) | Claude | Sonnet | ~$0.01 |
| Fallback (if Claude unavailable) | OpenAI | GPT-4o-mini | ~$0.002 |

### Cost Target
- ~$15-25/month for a 500-unit building
- Super Admin controls per-feature, per-property budgets
- Over-budget behavior: downgrade models → disable non-essential → hard stop

### PII Handling
- PII detected and stripped before any API call
- Replaced with anonymous tokens (`[RESIDENT_1]`, `[UNIT_302]`)
- Original PII restored in response before returning to client
- No user data used for model training (contractual guarantee)

---

## 13. Payment Processing

| Property | Value |
|----------|-------|
| **Provider** | Stripe |
| **Integration** | Stripe.js (client-side) + Webhooks (server-side) |
| **License** | Proprietary (usage-based pricing) |

### Why Stripe
- **PCI compliance outsourced**: Card data never touches our servers
- **Client-side capture**: `Stripe.js` + `Elements` handle card input
- **Webhook-driven**: Async payment status updates (no polling)
- **Canadian support**: CAD currency, Canadian payment methods
- **Subscription billing**: Future subscription management for properties

### Use Cases
- Amenity booking fees and deposits
- Parking permit fees
- Community event registration fees
- Future: Property subscription billing

---

## 14. Email Delivery

| Property | Value |
|----------|-------|
| **Provider** | SendGrid |
| **License** | Proprietary (usage-based) |

### Capabilities Used
- Transactional email (password resets, package notifications, maintenance updates)
- Template engine with variable substitution
- Deliverability tracking (sent, delivered, opened, bounced)
- Suppression list management
- Dedicated IP (for production — improves deliverability)

---

## 15. SMS & Voice

| Property | Value |
|----------|-------|
| **Provider** | Twilio |
| **License** | Proprietary (usage-based) |

### SMS
- Transactional SMS notifications
- Opt-out keyword handling (`STOP`)
- Daily sending limits per property
- Delivery status tracking

### Voice
- Emergency broadcast voice calls
- TwiML scripts for call flow
- Concurrent call limit: 50 per property
- Retry logic with exponential backoff
- Real-time delivery dashboard

---

## 16. Push Notifications

| Property | Value |
|----------|-------|
| **Provider** | Firebase Cloud Messaging (FCM) |
| **License** | Proprietary (free tier generous) |

### Why FCM
- **Web push**: Service worker-based push notifications
- **Future mobile**: Same FCM tokens work for React Native (iOS via APNs, Android native)
- **Free**: No per-message cost
- **Reliable**: Google infrastructure
- **TTL**: Configurable time-to-live (24 hours default)
- **Topics**: Subscribe users to property-level topics

---

## 17. Testing

| Property | Value |
|----------|-------|
| **Unit/Integration** | Vitest 3.x |
| **E2E** | Playwright (latest) |
| **Component** | Storybook 8.x |
| **Visual Regression** | Chromatic (Storybook addon) |
| **Load Testing** | k6 |
| **ADR** | [ADR-007-testing.md](ADR-007-testing.md) |

### Coverage Requirements (from RULEBOOK)

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| Line coverage | 95% minimum | CI hard-fail |
| Branch coverage | 92% minimum | CI hard-fail |
| New code coverage | 100% | CI hard-fail |
| Mutation score | 80% minimum | Weekly report |
| E2E critical paths | All 12 personas | Pre-release gate |
| Accessibility scan | Zero violations | PR blocker |

### Why Vitest
- 10-20x faster than Jest (native ESM, Vite-powered)
- Jest-compatible API (easy migration if needed)
- TypeScript-native (no ts-jest configuration)
- In-source testing support
- Built-in coverage via v8

### Why Playwright
- Cross-browser testing (Chromium, Firefox, WebKit)
- Visual regression testing built-in
- Network interception for API mocking
- Accessibility testing via axe-core integration
- Parallel test execution

---

## 18. Code Quality

| Tool | Purpose | Version |
|------|---------|---------|
| ESLint | Linting (TypeScript-aware) | 9.x (flat config) |
| Prettier | Code formatting | 3.x |
| Husky | Git hooks | Latest |
| lint-staged | Pre-commit lint/format | Latest |
| gitleaks | Pre-commit secrets scanning | Latest |
| commitlint | Conventional commit enforcement | Latest |

### ESLint Key Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| `@typescript-eslint/no-explicit-any` | error | RULEBOOK Rule 16 |
| `complexity` | ["error", 10] | Max cyclomatic complexity |
| `max-lines-per-function` | ["error", 50] | Function size limit |
| `max-lines` | ["error", 400] | File size limit |
| `no-console` | error | Use structured logger |
| `@typescript-eslint/strict-boolean-expressions` | error | Prevent truthy coercion bugs |

---

## 19. CI/CD

| Property | Value |
|----------|-------|
| **Platform** | GitHub Actions |
| **ADR** | N/A (industry standard) |

### CI Pipeline (Every PR)

```
Trigger: push, pull_request
Jobs (parallel):
  ├── lint          — ESLint + Prettier
  ├── typecheck     — tsc --noEmit
  ├── test          — Vitest (coverage threshold 95%)
  ├── build         — next build
  ├── sast          — Semgrep security scan
  ├── secrets       — gitleaks on diff
  ├── licenses      — license compliance check
  └── accessibility — axe-core on Storybook
```

### CD Pipeline (Merge to main)

```
Trigger: push to main
Jobs (sequential):
  ├── full-ci       — Run all CI checks
  ├── deploy-staging — Vercel preview deployment
  ├── dast          — OWASP ZAP against staging
  ├── e2e           — Playwright against staging
  ├── approval      — Manual approval gate
  └── deploy-prod   — Production deployment
```

---

## 20. Hosting & Deployment

| Property | Value |
|----------|-------|
| **Frontend** | Vercel |
| **Backend (future extraction)** | AWS ECS Fargate or AWS Lambda |
| **Database** | AWS RDS PostgreSQL (ca-central-1) |
| **ADR** | [ADR-008-hosting.md](ADR-008-hosting.md) |

### Why Vercel
- **Edge functions**: Authentication middleware at the edge
- **Preview deployments**: Every PR gets a preview URL
- **ISR**: Incremental static regeneration for content pages
- **Analytics**: Web Vitals monitoring built-in
- **CDN**: Global edge network for static assets

### Why AWS (Backend Services)
- **Data residency**: ca-central-1 (Toronto) — PIPEDA compliance
- **RDS**: Managed PostgreSQL with automated backups, PITR
- **S3**: Object storage with per-property encryption keys
- **KMS**: Hardware security modules for key management
- **CloudWatch**: Monitoring and alerting
- **VPC**: Network isolation for database tier

### Deployment Strategy
- **Canary**: 1% → 10% → 50% → 100% rollout
- **Auto-rollback**: If error rate > 1% within 5 minutes
- **Feature flags**: Every feature behind a flag (per-property toggle)
- **Blue/green**: Database migrations use blue/green for zero-downtime

---

## 21. Monitoring & Observability

| Property | Value |
|----------|-------|
| **Error Tracking** | Sentry |
| **APM** | Sentry Performance (or Datadog) |
| **Logging** | Structured JSON logs → CloudWatch |
| **Uptime** | Better Uptime or Pingdom |

### Alerting Rules

| Alert | Threshold | Channel |
|-------|-----------|---------|
| Error rate spike | >1% in 5 min | PagerDuty → SMS |
| API latency P95 | >500ms for 5 min | Slack |
| Database CPU | >80% for 10 min | Slack + Email |
| Failed login spike | >10 from single IP in 5 min | Security team Slack |
| Cross-tenant access attempt | Any | PagerDuty → SMS (immediate) |
| Backup failure | Any | PagerDuty → SMS (immediate) |

---

## 22. Secrets Management

| Property | Value |
|----------|-------|
| **Service** | AWS KMS + Systems Manager Parameter Store |
| **Key Rotation** | Quarterly (automated) |

### Secret Categories

| Category | Storage | Access |
|----------|---------|--------|
| Database credentials | Parameter Store (SecureString) | Application only |
| JWT signing keys | KMS (asymmetric RSA-2048) | Application only |
| API keys (SendGrid, Twilio, Stripe) | Parameter Store (SecureString) | Application only |
| AI provider keys (Claude, OpenAI) | Parameter Store (SecureString) | AI Gateway only |
| Per-property encryption keys | KMS (symmetric AES-256) | Encryption service only |
| User session secrets | Parameter Store (SecureString) | Auth service only |

### Rules
- No secrets in source code (gitleaks enforced)
- No secrets in environment variables in CI logs
- `.env.example` contains only placeholder values
- Secret rotation does not require application restart

---

## 23. Caching

| Property | Value |
|----------|-------|
| **Service** | Redis 7.x (via AWS ElastiCache) |
| **Use Cases** | Session cache, rate limiting, permission cache, AI response cache |

### Cache Strategy

| Data | TTL | Invalidation |
|------|-----|-------------|
| Role permissions | 60 seconds | On role change event |
| Property config | 5 minutes | On settings change |
| Event types/groups | 5 minutes | On config change |
| AI responses | 24 hours | On data change |
| Rate limit counters | 1 minute (sliding window) | Auto-expire |
| Session data | 15 minutes (access) / 7 days (refresh) | On logout/password change |

---

## 24. Version Summary Table

| Layer | Technology | Version | License |
|-------|-----------|---------|---------|
| Runtime | Node.js | 22 LTS | MIT |
| Language | TypeScript | 5.6+ | Apache 2.0 |
| Package Manager | pnpm | 9.x | MIT |
| Framework | Next.js | 15.x | MIT |
| React | React | 19.x | MIT |
| Styling | Tailwind CSS | 4.x | MIT |
| Components | Radix UI | Latest | MIT |
| Icons | Lucide React | Latest | ISC |
| Animation | Framer Motion | 12.x | MIT |
| Database | PostgreSQL | 16+ | PostgreSQL License |
| ORM | Prisma | 6.x | Apache 2.0 |
| Auth | Custom (JWT + Argon2id) | — | N/A |
| Real-time | Socket.io | 4.x | MIT |
| Storage | AWS S3 | — | Proprietary |
| Search (v1) | PostgreSQL FTS | — | PostgreSQL License |
| Search (v2) | Meilisearch | 1.x | MIT |
| AI (Primary) | Claude API (Anthropic) | Latest | Proprietary |
| AI (Fallback) | OpenAI API | Latest | Proprietary |
| Payments | Stripe | Latest | Proprietary |
| Email | SendGrid | Latest | Proprietary |
| SMS/Voice | Twilio | Latest | Proprietary |
| Push | Firebase Cloud Messaging | Latest | Proprietary |
| Unit Testing | Vitest | 3.x | MIT |
| E2E Testing | Playwright | Latest | Apache 2.0 |
| Component Testing | Storybook | 8.x | MIT |
| Linting | ESLint | 9.x | MIT |
| Formatting | Prettier | 3.x | MIT |
| Git Hooks | Husky | Latest | MIT |
| CI/CD | GitHub Actions | — | Proprietary |
| Frontend Hosting | Vercel | — | Proprietary |
| Backend Hosting | AWS (ECS/Lambda) | — | Proprietary |
| Database Hosting | AWS RDS | — | Proprietary |
| Error Tracking | Sentry | Latest | BSL |
| Caching | Redis | 7.x | BSD |
| Secrets | AWS KMS + Parameter Store | — | Proprietary |

---

## 25. Future: React Native Mobile

The entire technology stack has been chosen with React Native mobile compatibility in mind:

| Web Technology | React Native Equivalent | Shared? |
|---------------|----------------------|---------|
| Next.js API Routes | Same API (extracted to standalone) | YES — same backend |
| PostgreSQL | Same database | YES — same database |
| Prisma | Same ORM | YES — same data access |
| Socket.io | socket.io-client (React Native) | YES — same events |
| JWT Auth | Same tokens | YES — same auth |
| FCM Push | react-native-firebase | YES — same FCM tokens |
| Stripe | @stripe/stripe-react-native | YES — same Stripe account |
| Tailwind CSS | NativeWind (Tailwind for RN) | PARTIAL — same tokens, different runtime |
| Framer Motion | react-native-reanimated | NO — different API, same principles |
| Radix UI | Custom RN components | NO — rebuild for native |

### API Extraction Plan
When React Native development begins:
1. Extract `src/app/api/` routes to a standalone Express/Fastify server
2. Both web (Next.js) and mobile (React Native) consume the same REST API
3. WebSocket server (Socket.io) serves both web and mobile clients
4. FCM push notifications serve both web and mobile
5. Same database, same auth tokens, same business logic

---

*Last updated: 2026-03-15*
*Status: LOCKED — changes require ADR*
