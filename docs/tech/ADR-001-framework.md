# ADR-001: Next.js 15 App Router as Primary Web Framework

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge is a multi-module building management portal with 20+ distinct feature modules
(event logging, maintenance, amenity booking, security console, reports, admin settings, etc.),
role-aware interfaces for 12+ roles, and data-heavy listing pages that benefit from server-side
rendering. The framework must support:

- **Server-side rendering (SSR)** for initial page loads on data-heavy dashboards and listing
  pages (event logs, unit files, reports) where residents and staff expect sub-second paint.
- **API route co-location** so the same codebase can serve both the web portal and a future
  React Native mobile app without duplicating business logic.
- **File-based routing** to keep 20+ modules organized without a monolithic route config.
- **Middleware layer** for auth verification, RBAC enforcement, tenant isolation, and request
  logging on every route, executed at the edge before page rendering.
- **React Server Components** for reducing client bundle size on read-heavy pages (dashboards,
  reports, unit overviews) while keeping interactive components client-side.
- **Streaming and Suspense** for progressive loading of complex pages (e.g., unit file with
  6+ widget sections loading independently).
- **Static generation** for marketing pages, help docs, and building directories that rarely change.

The team is experienced with React and TypeScript. The design system (2,243 lines) is built
around React component patterns. The product targets desktop monitors as the primary viewport.

## Decision

Adopt **Next.js 15 with App Router** as the primary web framework for the Concierge portal.

Specifically:
- Use **App Router** (not Pages Router) for all new development.
- Use **React Server Components** by default; add `"use client"` only for interactive components.
- Use **Route Handlers** (`app/api/`) for all backend API endpoints.
- Use **Middleware** (`middleware.ts`) for auth token verification, role-based route guards,
  tenant context injection, and request audit logging.
- Use **Parallel Routes and Intercepting Routes** for modal patterns (e.g., quick-view package
  details overlaid on the event log).
- Use **Server Actions** for form mutations (maintenance request creation, event logging,
  amenity booking) to reduce client-side API call boilerplate.
- Use **Route Groups** to organize modules: `(portal)/`, `(admin)/`, `(auth)/`, `(public)/`.

## Rationale

1. **SSR + API co-location**: Next.js is the only mature React framework that provides both
   SSR and API routes in a single deployment unit. This avoids maintaining a separate Express
   or Fastify backend for v1 while preserving the option to extract API routes later.

2. **File-based routing scales to 20+ modules**: Each module gets its own directory under
   `app/(portal)/` with co-located layouts, loading states, and error boundaries. No central
   route registry to maintain.

3. **Middleware for auth/RBAC**: Next.js middleware runs before every request, enabling
   JWT verification, role checks, and tenant isolation at the edge without repeating logic
   in every page component.

4. **React Server Components reduce bundle size**: The unit file page, for example, has 6+
   read-only widget sections. RSC renders these server-side, sending only HTML to the client.
   Only interactive widgets (event creation form, quick actions) ship JavaScript.

5. **Ecosystem maturity**: Next.js has the largest React framework ecosystem for auth libraries,
   ORM integrations, testing tools, and deployment platforms.

6. **Team velocity**: The team knows React. Choosing a non-React framework (Svelte, Vue) would
   require retraining and rewriting the design system.

## Alternatives Considered

### Remix
- **Pros**: Excellent data loading patterns, nested routes, progressive enhancement.
- **Rejected because**: Smaller ecosystem, fewer deployment options, no equivalent to React
  Server Components for zero-JS read-heavy pages. Community momentum has consolidated around
  Next.js since the React Router v7 merge created ecosystem confusion.

### SvelteKit
- **Pros**: Smaller bundle sizes, simpler reactivity model, excellent performance.
- **Rejected because**: Requires rewriting the entire design system in Svelte. Team has no
  Svelte experience. Smaller hiring pool for future team growth. No React Native code sharing.

### Astro
- **Pros**: Excellent for content-heavy sites, island architecture.
- **Rejected because**: Primarily a content/marketing framework. Lacks the interactive
  application patterns needed for real-time event logging, form-heavy maintenance requests,
  and complex state management across modules.

### Plain React + Vite
- **Pros**: Maximum flexibility, no framework lock-in, fast dev server.
- **Rejected because**: No SSR out of the box (would need custom setup), no file-based routing,
  no middleware layer, no API route co-location. Would require assembling 5+ libraries to match
  what Next.js provides integrated.

## Consequences

### Positive
- Single deployment unit for frontend and API, reducing infrastructure complexity for v1.
- Sub-second initial page loads on data-heavy pages via SSR and streaming.
- Clean module organization via file-based routing with route groups.
- Future React Native app can consume the same API routes.
- Large talent pool for hiring React/Next.js developers.

### Negative
- Locked into the React ecosystem. Migration to another UI framework would be a full rewrite.
- Next.js release cadence is aggressive; major version upgrades require migration effort.
- App Router patterns are newer and have fewer community examples than Pages Router.
- Vercel-optimized features (ISR, edge functions) may not work identically on other hosts.

### Risks
- **Vendor coupling**: If Vercel changes pricing or strategy, self-hosting Next.js on Node.js
  is possible but loses some optimizations. Mitigated by keeping deployment config portable
  and testing on Docker/Node.js regularly.
- **App Router stability**: Some App Router features are still maturing. Mitigated by pinning
  Next.js versions and running canary builds in CI before upgrading.
- **Bundle size creep**: Without discipline, `"use client"` boundaries can expand, negating RSC
  benefits. Mitigated by bundle analysis in CI and code review guidelines.

## Related ADRs
- ADR-002: Database (Prisma ORM integrates tightly with Next.js API routes and Server Actions)
- ADR-003: Auth (middleware-based JWT verification depends on Next.js middleware)
- ADR-004: Realtime (Socket.io server attaches to the Next.js custom server)
