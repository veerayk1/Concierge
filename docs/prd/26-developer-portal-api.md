# 26 — Developer Portal & API

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 16-Settings Admin, 18-Integrations, 24-Billing Subscription

---

## 1. Overview

### What It Is

The Developer Portal & API is the programmatic interface that exposes Concierge's capabilities to external systems, integration partners, and enterprise customers. It consists of four components:

1. **Public REST API** -- a versioned, RESTful JSON API covering all core modules (units, residents, events, packages, maintenance, amenities, announcements, reports, and users).
2. **Webhook System** -- an event-driven push mechanism that notifies external systems when something happens inside Concierge (a package arrives, a maintenance request changes status, a booking is approved).
3. **Developer Documentation Portal** -- a public-facing website with interactive API documentation, getting-started guides, code examples, and a changelog.
4. **API Key Management Dashboard** -- an in-app administration panel where Property Admins generate, scope, rotate, and revoke API keys.

Together, these components allow third-party developers to build on top of Concierge, enterprise customers to connect Concierge to their internal tools, and the Concierge team itself to power mobile apps, integrations, and automation workflows.

### Why It Exists

Industry research revealed a consistent gap: none of the production platforms analyzed offered a documented public API or outbound webhook system. Enterprise property management companies routinely need to connect their building management software to accounting systems, CRM platforms, custom dashboards, access control hardware, and business intelligence tools. Without an API, these integrations require manual data export and re-entry -- an error-prone, time-consuming process.

A well-designed API also future-proofs the platform. New front-end clients (mobile apps, kiosks, digital signage) can consume the same API rather than requiring custom back-end work. Partners can build marketplace integrations. And Concierge's own internal tooling (analytics, reporting, AI features) can use the same API surface, ensuring consistency between what the UI shows and what the API returns.

### Who Uses It

| Audience                          | Primary Use Case                                                                                     | Access Path                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Enterprise IT Teams**           | Connect Concierge to internal ERP, accounting, or BI systems                                         | API keys generated in Settings > Integrations |
| **Integration Partners**          | Build third-party apps and marketplace integrations (e.g., smart lock vendors, accounting platforms) | OAuth 2.0 authorization (v2)                  |
| **Property Managers (Technical)** | Automate repetitive tasks via scripts (bulk package logging, report generation)                      | API keys with scoped permissions              |
| **Internal Engineering**          | Power mobile apps, digital signage, and automation workflows                                         | Internal API keys                             |
| **Super Admin**                   | Monitor API usage, manage rate limits, review audit logs                                             | Super Admin dashboard                         |
| **Property Admin**                | Generate and manage API keys for their property                                                      | Settings > Integrations > API Keys            |

### Which Roles Interact With It

| Role                   | Access Level        | What They Can Do                                                                                                                   |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Super Admin**        | Full access         | Configure global API settings, view all properties' API usage, manage rate limit tiers, access all developer portal admin features |
| **Property Admin**     | Property-scoped     | Generate API keys, configure webhooks, view usage stats and audit logs for their property                                          |
| **Property Manager**   | Read-only dashboard | View API usage statistics and webhook delivery logs for their property                                                             |
| **Board Member**       | No access           | API management is not visible in their navigation                                                                                  |
| **All Staff Roles**    | No access           | API management is not visible in their navigation                                                                                  |
| **All Resident Roles** | No access           | API management is not visible in their navigation                                                                                  |

---

## 2. Research Summary

### Key Capabilities from Competitive Analysis

Industry research across three production platforms and analysis of leading SaaS API platforms (Stripe, Twilio, SendGrid, Slack) revealed these essential patterns for a developer portal:

| Capability                            | Where Observed                                                                                                      | Our Approach                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **No public API**                     | None of the three property management platforms analyzed offered a documented public API                            | Build a comprehensive RESTful API as a market differentiator                     |
| **No webhook support**                | None of the platforms analyzed offered outbound webhooks for event-driven integrations                              | Build a 40+ event-type webhook system from launch                                |
| **Versioned API with sunset policy**  | Industry best practice from Stripe and Twilio: URL-path versioning with long deprecation windows                    | Adopt. `/api/v1/` prefix with 12-month sunset policy                             |
| **Cursor-based pagination**           | Stripe and Slack use cursor-based pagination for performance on large datasets                                      | Adopt. Cursor-based pagination on all list endpoints                             |
| **Consistent response envelope**      | Stripe, Twilio, and SendGrid all use a standard response wrapper                                                    | Adopt. `{ data, meta, errors }` envelope on every response                       |
| **Interactive API docs**              | Stripe's API docs are the industry gold standard: interactive, code samples in multiple languages, "Try it" console | Adopt. Interactive docs with code samples in JavaScript, Python, and cURL        |
| **Webhook signature verification**    | Stripe and Twilio sign webhooks with HMAC-SHA256 for authenticity                                                   | Adopt. HMAC-SHA256 signature in `X-Concierge-Signature` header                   |
| **API key prefix for identification** | Stripe uses `sk_live_` and `sk_test_` prefixes for instant key identification                                       | Adopt. `conc_live_` and `conc_test_` prefixes                                    |
| **Sandbox environment**               | Stripe and Twilio provide sandbox modes with test credentials                                                       | Adopt. Test keys point to a demo property with no real notifications             |
| **Rate limiting with headers**        | Standard across all major API platforms                                                                             | Adopt. `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers |

### Best Practices Adopted

1. **REST over GraphQL** -- RESTful endpoints with Zod-validated schemas provide sufficient type safety with a smaller attack surface (per Security Rulebook I.10)
2. **OpenAPI 3.1 as source of truth** -- the machine-readable spec is generated from Zod schemas and route definitions, validated on every CI run (per Security Rulebook I.14)
3. **Bearer token authentication** -- API keys sent via `Authorization: Bearer` header, never in URL parameters (per Security Rulebook I.1)
4. **Idempotency keys on POST** -- all creation endpoints accept `Idempotency-Key` header to prevent duplicate resources (per Security Rulebook I.8)
5. **No sensitive data in URLs** -- all filtering and search parameters that may contain PII use POST request bodies, not query strings

### Pitfalls Avoided

1. **No API key in URL** -- API keys are never passed as query parameters (leaks in server logs, browser history, referrer headers)
2. **No unlimited rate limits** -- every tier has a hard ceiling to prevent abuse and ensure fair usage
3. **No silent webhook failures** -- webhook delivery is logged with full status codes, response times, and retry history visible in the dashboard
4. **No breaking changes without notice** -- the sunset policy guarantees 12 months of deprecation notice before any breaking change
5. **No unscoped API keys** -- every key is either scoped to specific modules or inherits permissions from the creating user's role, never full-access by default
6. **No webhook secrets in plaintext** -- webhook signing secrets are stored hashed, never displayed again after creation

---

## 3. API Design Principles

### 3.1 RESTful JSON API

All API endpoints follow REST conventions. Resources are nouns, actions are HTTP verbs.

| HTTP Method | Meaning                              | Example                       |
| ----------- | ------------------------------------ | ----------------------------- |
| `GET`       | Read a resource or list resources    | `GET /api/v1/packages`        |
| `POST`      | Create a new resource                | `POST /api/v1/packages`       |
| `PUT`       | Replace a resource entirely          | `PUT /api/v1/packages/:id`    |
| `PATCH`     | Update specific fields on a resource | `PATCH /api/v1/packages/:id`  |
| `DELETE`    | Soft-delete a resource               | `DELETE /api/v1/packages/:id` |

### 3.2 URL Structure and Versioning

All API endpoints are prefixed with `/api/v1/`. When a new version is released, the previous version enters a 12-month sunset period.

```
Base URL: https://{property}.concierge.com/api/v1/
```

**Sunset policy**:

| Phase          | Duration                              | Behavior                                                                                                                |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Active**     | Indefinite (until successor released) | Fully supported, all new features added                                                                                 |
| **Deprecated** | 12 months after successor release     | Works normally, `Sunset` header added to every response with retirement date, `Link` header points to successor version |
| **Retired**    | After 12-month deprecation            | Returns `410 Gone` with a JSON body containing the migration guide URL                                                  |

### 3.3 Response Envelope

Every API response uses a consistent envelope. No exceptions.

**Success response (single resource)**:

```json
{
  "data": {
    "id": "pkg_01HXYZ",
    "type": "package",
    "unit_id": "unit_302",
    "courier": "fedex",
    "status": "received",
    "created_at": "2026-03-16T14:22:00Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

**Success response (list)**:

```json
{
  "data": [
    { "id": "pkg_01HXYZ", "type": "package", "status": "received" },
    { "id": "pkg_01HABC", "type": "package", "status": "released" }
  ],
  "meta": {
    "request_id": "req_abc123",
    "pagination": {
      "cursor": "eyJpZCI6InBrZ18wMUhBQkMifQ==",
      "has_more": true,
      "total_count": 1472
    }
  }
}
```

**Error response**:

```json
{
  "data": null,
  "meta": {
    "request_id": "req_abc123"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "The 'unit_id' field is required.",
      "field": "unit_id"
    }
  ]
}
```

### 3.4 Pagination

All list endpoints use cursor-based pagination. Offset-based pagination is not supported because it degrades on large datasets and produces inconsistent results when records are inserted during traversal.

| Parameter | Type    | Default | Description                                                                                   |
| --------- | ------- | ------- | --------------------------------------------------------------------------------------------- |
| `limit`   | integer | 25      | Number of records to return. Minimum: 1. Maximum: 100.                                        |
| `cursor`  | string  | (none)  | Opaque cursor from the previous response's `meta.pagination.cursor`. Omit for the first page. |

### 3.5 Filtering

List endpoints support filtering via query parameters. All filter values are validated server-side.

```
GET /api/v1/events?status=open&event_type=visitor&created_after=2026-01-01T00:00:00Z&created_before=2026-03-16T23:59:59Z
```

| Pattern         | Example                                               | Description                                            |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Exact match     | `?status=open`                                        | Return only records where `status` equals `open`       |
| Multiple values | `?status=open,in_progress`                            | Return records matching any listed value (OR)          |
| Date range      | `?created_after=2026-01-01&created_before=2026-03-31` | Inclusive date range filter                            |
| Relationship    | `?unit_id=unit_302`                                   | Filter by related resource                             |
| Search          | `?q=broken+elevator`                                  | Full-text search within the resource (where supported) |

### 3.6 Sorting

```
GET /api/v1/maintenance?sort=created_at&order=desc
```

| Parameter | Values                                                       | Default      |
| --------- | ------------------------------------------------------------ | ------------ |
| `sort`    | Any sortable field on the resource (documented per endpoint) | `created_at` |
| `order`   | `asc` or `desc`                                              | `desc`       |

### 3.7 Field Selection

Reduce payload size by requesting only the fields you need.

```
GET /api/v1/residents?fields=id,name,unit_id,email
```

When `fields` is provided, the `data` object contains only the requested fields plus `id` (always included). Relationships and nested objects can be requested with dot notation: `?fields=id,name,unit.number`.

### 3.8 Rate Limiting Headers

Every API response includes rate limiting headers.

| Header                  | Description                                             | Example      |
| ----------------------- | ------------------------------------------------------- | ------------ |
| `X-RateLimit-Limit`     | Maximum requests allowed in the current window          | `10000`      |
| `X-RateLimit-Remaining` | Requests remaining in the current window                | `9847`       |
| `X-RateLimit-Reset`     | Unix timestamp when the window resets                   | `1710604800` |
| `Retry-After`           | Seconds to wait before retrying (only on 429 responses) | `32`         |

---

## 4. Authentication

### 4.1 API Keys (v1)

API keys are the primary authentication method. Each key is scoped to a single property and carries specific permissions.

**Key format**:

| Environment | Prefix       | Example                                      |
| ----------- | ------------ | -------------------------------------------- |
| Production  | `conc_live_` | `conc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| Sandbox     | `conc_test_` | `conc_test_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4` |

**Sending the key**:

```
Authorization: Bearer conc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

API keys are never sent as URL query parameters (per Security Rulebook I.1).

**Key generation rules**:

| Rule               | Detail                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Who can create** | Property Admin or Super Admin                                                                                                        |
| **Scope**          | Per-property. A key can only access data for the property it was created under.                                                      |
| **Permissions**    | Inherit from creating user's role, OR scoped to specific modules (e.g., read-only packages, read-write maintenance)                  |
| **Expiry**         | Optional. If set, the key stops working at the expiry timestamp. No expiry means the key is valid until revoked.                     |
| **Storage**        | Only the SHA-256 hash of the key is stored. The full key is shown once at creation and never again.                                  |
| **Prefix storage** | The first 12 characters of the key (the prefix, e.g., `conc_live_a1b2`) are stored in plaintext for identification in the dashboard. |

**Key rotation**:

To rotate a key without downtime:

1. Admin clicks "Rotate" on the existing key in the dashboard.
2. A new key is generated immediately. The admin copies it.
3. The old key remains valid for 24 hours (grace period).
4. After 24 hours, the old key is automatically revoked.
5. Both the creation of the new key and the scheduled revocation of the old key are logged in the audit trail.

### 4.2 OAuth 2.0 (v2)

For third-party app integrations (marketplace apps, partner integrations), OAuth 2.0 authorization code flow will be supported in v2.

| Parameter                  | Value                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| **Grant type**             | Authorization Code                                                    |
| **Authorization endpoint** | `https://auth.concierge.com/oauth/authorize`                          |
| **Token endpoint**         | `https://auth.concierge.com/oauth/token`                              |
| **Scopes**                 | `read:units`, `write:events`, `read:packages`, `write:packages`, etc. |
| **Token lifetime**         | Access token: 1 hour. Refresh token: 30 days.                         |
| **PKCE**                   | Required for all clients (public and confidential)                    |

OAuth 2.0 is out of scope for this PRD's v1 implementation. It is documented here for architectural awareness.

---

## 5. Rate Limiting

### 5.1 Tier-Based Limits

Rate limits are enforced per API key, measured in requests per hour.

| Subscription Tier | Requests per Hour | Requests per Second (sustained) | Burst (10-second window)           |
| ----------------- | ----------------- | ------------------------------- | ---------------------------------- |
| **Starter**       | 1,000             | ~0.28                           | 10x (2.8 req/s for 10 seconds)     |
| **Professional**  | 10,000            | ~2.78                           | 10x (27.8 req/s for 10 seconds)    |
| **Enterprise**    | 100,000           | ~27.78                          | 10x (277.8 req/s for 10 seconds)   |
| **Internal**      | 500,000           | ~138.89                         | 10x (1,388.9 req/s for 10 seconds) |

### 5.2 Rate Limit Groups

Certain endpoints have additional per-endpoint limits to protect expensive operations.

| Group             | Limit              | Endpoints                                                               |
| ----------------- | ------------------ | ----------------------------------------------------------------------- |
| **Standard**      | Tier limit applies | Most GET, POST, PATCH, DELETE endpoints                                 |
| **Batch**         | 100 requests/hour  | `POST /v1/events/batch`, `POST /v1/packages/batch`                      |
| **Reports**       | 50 requests/hour   | `GET /v1/reports/:type`                                                 |
| **Search**        | 200 requests/hour  | Any endpoint with `?q=` parameter                                       |
| **Notifications** | 500 requests/hour  | `POST /v1/packages/:id/notify`, `POST /v1/announcements/:id/distribute` |

### 5.3 Rate Limit Exceeded Response

When a request exceeds the rate limit, the API returns `429 Too Many Requests`:

```json
{
  "data": null,
  "meta": {
    "request_id": "req_abc123"
  },
  "errors": [
    {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "You have exceeded the rate limit of 10,000 requests per hour. Please wait 32 seconds before retrying.",
      "retry_after": 32
    }
  ]
}
```

The response includes a `Retry-After` header with the number of seconds to wait.

---

## 6. API Resource Endpoints

### 6.1 Properties

| Method  | Endpoint             | Description                                | Permissions        | Rate Group |
| ------- | -------------------- | ------------------------------------------ | ------------------ | ---------- |
| `GET`   | `/v1/properties`     | List all properties accessible to this key | `read:properties`  | Standard   |
| `GET`   | `/v1/properties/:id` | Get a single property's details            | `read:properties`  | Standard   |
| `PATCH` | `/v1/properties/:id` | Update property settings                   | `write:properties` | Standard   |

**GET /v1/properties/:id response**:

```json
{
  "data": {
    "id": "prop_01H",
    "name": "Maple Heights Condominiums",
    "address": "123 Maple St, Toronto, ON M5V 2T6",
    "unit_count": 200,
    "timezone": "America/Toronto",
    "status": "active",
    "created_at": "2026-01-15T09:00:00Z"
  },
  "meta": { "request_id": "req_abc123" }
}
```

### 6.2 Units

| Method   | Endpoint                  | Description                                            | Permissions      | Rate Group |
| -------- | ------------------------- | ------------------------------------------------------ | ---------------- | ---------- |
| `GET`    | `/v1/units`               | List all units (filterable by floor, building, status) | `read:units`     | Standard   |
| `GET`    | `/v1/units/:id`           | Get a single unit with occupant summary                | `read:units`     | Standard   |
| `POST`   | `/v1/units`               | Create a new unit                                      | `write:units`    | Standard   |
| `PATCH`  | `/v1/units/:id`           | Update unit fields                                     | `write:units`    | Standard   |
| `DELETE` | `/v1/units/:id`           | Soft-delete a unit                                     | `write:units`    | Standard   |
| `GET`    | `/v1/units/:id/residents` | List current residents of a unit                       | `read:residents` | Standard   |
| `GET`    | `/v1/units/:id/events`    | List events associated with a unit                     | `read:events`    | Standard   |
| `GET`    | `/v1/units/:id/packages`  | List packages for a unit                               | `read:packages`  | Standard   |

### 6.3 Residents

| Method   | Endpoint                        | Description                                       | Permissions        | Rate Group |
| -------- | ------------------------------- | ------------------------------------------------- | ------------------ | ---------- |
| `GET`    | `/v1/residents`                 | List residents (filterable by unit, status, role) | `read:residents`   | Standard   |
| `GET`    | `/v1/residents/:id`             | Get a single resident's profile                   | `read:residents`   | Standard   |
| `POST`   | `/v1/residents`                 | Create a new resident                             | `write:residents`  | Standard   |
| `PATCH`  | `/v1/residents/:id`             | Update resident fields                            | `write:residents`  | Standard   |
| `DELETE` | `/v1/residents/:id`             | Soft-delete a resident                            | `write:residents`  | Standard   |
| `GET`    | `/v1/residents/:id/packages`    | List packages for a resident                      | `read:packages`    | Standard   |
| `GET`    | `/v1/residents/:id/maintenance` | List maintenance requests by a resident           | `read:maintenance` | Standard   |
| `GET`    | `/v1/residents/:id/bookings`    | List amenity bookings by a resident               | `read:bookings`    | Standard   |

### 6.4 Events

| Method   | Endpoint           | Description                                                | Permissions    | Rate Group |
| -------- | ------------------ | ---------------------------------------------------------- | -------------- | ---------- |
| `GET`    | `/v1/events`       | List events (filterable by type, status, unit, date range) | `read:events`  | Standard   |
| `GET`    | `/v1/events/:id`   | Get a single event with full detail                        | `read:events`  | Standard   |
| `POST`   | `/v1/events`       | Create a new event                                         | `write:events` | Standard   |
| `PATCH`  | `/v1/events/:id`   | Update event fields (status, comments)                     | `write:events` | Standard   |
| `DELETE` | `/v1/events/:id`   | Soft-delete an event                                       | `write:events` | Standard   |
| `POST`   | `/v1/events/batch` | Create up to 100 events in a single request                | `write:events` | Batch      |

### 6.5 Packages

| Method  | Endpoint                   | Description                                               | Permissions      | Rate Group    |
| ------- | -------------------------- | --------------------------------------------------------- | ---------------- | ------------- |
| `GET`   | `/v1/packages`             | List packages (filterable by status, courier, unit, date) | `read:packages`  | Standard      |
| `GET`   | `/v1/packages/:id`         | Get a single package with full history                    | `read:packages`  | Standard      |
| `POST`  | `/v1/packages`             | Log a new package                                         | `write:packages` | Standard      |
| `PATCH` | `/v1/packages/:id`         | Update package fields                                     | `write:packages` | Standard      |
| `POST`  | `/v1/packages/:id/notify`  | Send pickup notification to resident                      | `write:packages` | Notifications |
| `POST`  | `/v1/packages/:id/release` | Mark package as released (with optional signature data)   | `write:packages` | Standard      |
| `POST`  | `/v1/packages/:id/return`  | Mark package as returned to courier                       | `write:packages` | Standard      |
| `POST`  | `/v1/packages/batch`       | Log up to 100 packages in a single request                | `write:packages` | Batch         |

### 6.6 Maintenance Requests

| Method   | Endpoint                       | Description                                                                | Permissions         | Rate Group |
| -------- | ------------------------------ | -------------------------------------------------------------------------- | ------------------- | ---------- |
| `GET`    | `/v1/maintenance`              | List maintenance requests (filterable by status, priority, category, unit) | `read:maintenance`  | Standard   |
| `GET`    | `/v1/maintenance/:id`          | Get a single request with comments and attachments                         | `read:maintenance`  | Standard   |
| `POST`   | `/v1/maintenance`              | Create a new maintenance request                                           | `write:maintenance` | Standard   |
| `PATCH`  | `/v1/maintenance/:id`          | Update fields (status, priority, notes)                                    | `write:maintenance` | Standard   |
| `POST`   | `/v1/maintenance/:id/assign`   | Assign to a staff member or vendor                                         | `write:maintenance` | Standard   |
| `POST`   | `/v1/maintenance/:id/comments` | Add a comment to the request                                               | `write:maintenance` | Standard   |
| `DELETE` | `/v1/maintenance/:id`          | Soft-delete a maintenance request                                          | `write:maintenance` | Standard   |

### 6.7 Amenities and Bookings

| Method   | Endpoint                         | Description                                                   | Permissions      | Rate Group |
| -------- | -------------------------------- | ------------------------------------------------------------- | ---------------- | ---------- |
| `GET`    | `/v1/amenities`                  | List all bookable amenity spaces                              | `read:amenities` | Standard   |
| `GET`    | `/v1/amenities/:id`              | Get amenity details (rules, pricing, availability)            | `read:amenities` | Standard   |
| `GET`    | `/v1/amenities/:id/availability` | Get available time slots for a date range                     | `read:bookings`  | Standard   |
| `GET`    | `/v1/bookings`                   | List bookings (filterable by amenity, resident, status, date) | `read:bookings`  | Standard   |
| `GET`    | `/v1/bookings/:id`               | Get a single booking with payment details                     | `read:bookings`  | Standard   |
| `POST`   | `/v1/bookings`                   | Create a new booking                                          | `write:bookings` | Standard   |
| `PATCH`  | `/v1/bookings/:id`               | Update booking (reschedule, change notes)                     | `write:bookings` | Standard   |
| `POST`   | `/v1/bookings/:id/approve`       | Approve a pending booking                                     | `write:bookings` | Standard   |
| `POST`   | `/v1/bookings/:id/reject`        | Reject a pending booking (with reason)                        | `write:bookings` | Standard   |
| `DELETE` | `/v1/bookings/:id`               | Cancel a booking                                              | `write:bookings` | Standard   |

### 6.8 Announcements

| Method   | Endpoint                           | Description                                               | Permissions           | Rate Group    |
| -------- | ---------------------------------- | --------------------------------------------------------- | --------------------- | ------------- |
| `GET`    | `/v1/announcements`                | List announcements (filterable by status, category, date) | `read:announcements`  | Standard      |
| `GET`    | `/v1/announcements/:id`            | Get a single announcement with read tracking stats        | `read:announcements`  | Standard      |
| `POST`   | `/v1/announcements`                | Create a draft announcement                               | `write:announcements` | Standard      |
| `PATCH`  | `/v1/announcements/:id`            | Update announcement content                               | `write:announcements` | Standard      |
| `POST`   | `/v1/announcements/:id/distribute` | Publish and distribute via configured channels            | `write:announcements` | Notifications |
| `DELETE` | `/v1/announcements/:id`            | Soft-delete an announcement                               | `write:announcements` | Standard      |

### 6.9 Reports

| Method | Endpoint                     | Description                                          | Permissions    | Rate Group |
| ------ | ---------------------------- | ---------------------------------------------------- | -------------- | ---------- |
| `GET`  | `/v1/reports`                | List available report types                          | `read:reports` | Standard   |
| `GET`  | `/v1/reports/:type`          | Generate a report (filterable by date range, format) | `read:reports` | Reports    |
| `GET`  | `/v1/reports/:type/download` | Download a report as PDF or Excel                    | `read:reports` | Reports    |

**Supported report types**: `package_summary`, `maintenance_summary`, `event_log`, `booking_utilization`, `security_incidents`, `parking_violations`, `access_audit`, `occupancy`, `announcement_engagement`.

### 6.10 Users

| Method | Endpoint        | Description                          | Permissions   | Rate Group |
| ------ | --------------- | ------------------------------------ | ------------- | ---------- |
| `GET`  | `/v1/users`     | List staff users (admin only)        | `admin:users` | Standard   |
| `GET`  | `/v1/users/:id` | Get a single user's profile and role | `admin:users` | Standard   |

User creation and role assignment are not exposed via API. These operations require the web UI for security reasons (mandatory role review, audit confirmation).

---

## 7. Webhook System

### 7.1 Event Types

Concierge supports 40+ webhook event types organized by module. Each event type follows the pattern `{module}.{action}`.

**Package events**:

| Event Type         | Trigger                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `package.received` | A new package is logged into the system                          |
| `package.notified` | A pickup notification is sent to the resident                    |
| `package.released` | A package is marked as picked up by the resident                 |
| `package.returned` | A package is returned to the courier                             |
| `package.overdue`  | A package has not been picked up within the configured threshold |

**Maintenance events**:

| Event Type                   | Trigger                                                |
| ---------------------------- | ------------------------------------------------------ |
| `maintenance.created`        | A new maintenance request is submitted                 |
| `maintenance.assigned`       | A request is assigned to a staff member or vendor      |
| `maintenance.status_changed` | A request's status changes (e.g., open to in_progress) |
| `maintenance.comment_added`  | A comment is added to a maintenance request            |
| `maintenance.closed`         | A request is marked as resolved and closed             |

**Booking events**:

| Event Type          | Trigger                                           |
| ------------------- | ------------------------------------------------- |
| `booking.created`   | A new amenity booking is submitted                |
| `booking.approved`  | A pending booking is approved                     |
| `booking.rejected`  | A pending booking is rejected                     |
| `booking.cancelled` | A booking is cancelled by the resident or admin   |
| `booking.reminder`  | A booking reminder is triggered (24 hours before) |

**Event (security console) events**:

| Event Type      | Trigger                                       |
| --------------- | --------------------------------------------- |
| `event.created` | A new event is logged in the security console |
| `event.updated` | An existing event's fields are modified       |
| `event.closed`  | An event is marked as closed                  |

**Announcement events**:

| Event Type               | Trigger                                      |
| ------------------------ | -------------------------------------------- |
| `announcement.created`   | A new announcement draft is created          |
| `announcement.published` | An announcement is published and distributed |
| `announcement.expired`   | An announcement reaches its expiry date      |

**User events**:

| Event Type         | Trigger                                          |
| ------------------ | ------------------------------------------------ |
| `user.created`     | A new user account is created                    |
| `user.updated`     | A user's profile or role is changed              |
| `user.deactivated` | A user account is deactivated                    |
| `user.login`       | A user logs in (includes device and IP metadata) |

**Unit events**:

| Event Type              | Trigger                             |
| ----------------------- | ----------------------------------- |
| `unit.created`          | A new unit is added to the property |
| `unit.updated`          | Unit details are modified           |
| `unit.occupant_added`   | A new resident is linked to a unit  |
| `unit.occupant_removed` | A resident is unlinked from a unit  |

**Security events**:

| Event Type                    | Trigger                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `security.incident_created`   | A new security incident is reported                            |
| `security.incident_escalated` | An incident is escalated to a supervisor or external authority |
| `security.incident_closed`    | A security incident is resolved                                |
| `security.key_checked_out`    | A key or FOB is checked out to a visitor or contractor         |
| `security.key_returned`       | A key or FOB is returned                                       |

**Parking events**:

| Event Type                   | Trigger                           |
| ---------------------------- | --------------------------------- |
| `parking.violation_created`  | A new parking violation is logged |
| `parking.violation_resolved` | A parking violation is resolved   |

**System events**:

| Event Type        | Trigger                                                  |
| ----------------- | -------------------------------------------------------- |
| `api_key.created` | A new API key is generated                               |
| `api_key.revoked` | An API key is revoked                                    |
| `webhook.paused`  | A webhook endpoint is paused due to consecutive failures |

### 7.2 Webhook Endpoint Registration

Property Admins register webhook endpoints in Settings > Integrations > Webhooks.

**Registration fields**:

| Field         | Type           | Required       | Description                                                                             |
| ------------- | -------------- | -------------- | --------------------------------------------------------------------------------------- |
| `url`         | string (HTTPS) | Yes            | The endpoint URL. Must use HTTPS.                                                       |
| `events`      | string[]       | Yes            | Array of event types to subscribe to. Use `*` for all events.                           |
| `description` | string         | No             | Human-readable label for this endpoint (e.g., "Accounting system sync")                 |
| `secret`      | string         | Auto-generated | HMAC-SHA256 signing secret. Generated by Concierge, shown once, stored as SHA-256 hash. |
| `status`      | enum           | Auto           | `active`, `paused`, or `disabled`. Starts as `active`.                                  |
| `headers`     | object         | No             | Custom headers to include with each delivery (e.g., `{ "X-Custom-Auth": "token123" }`)  |

**Limits**: Maximum 10 webhook endpoints per property (Starter), 25 (Professional), 50 (Enterprise).

### 7.3 Webhook Payload

Every webhook delivery uses a consistent payload structure.

```json
{
  "id": "whevt_01HXYZ",
  "type": "package.received",
  "created_at": "2026-03-16T14:22:00Z",
  "property_id": "prop_01H",
  "api_version": "v1",
  "data": {
    "id": "pkg_01HXYZ",
    "unit_id": "unit_302",
    "courier": "fedex",
    "tracking_number": "789456123",
    "status": "received",
    "created_at": "2026-03-16T14:22:00Z",
    "created_by": "user_guard01"
  }
}
```

### 7.4 Webhook Signature Verification

Every webhook delivery is signed with the endpoint's secret using HMAC-SHA256.

**Signature header**: `X-Concierge-Signature`

**Signature computation**:

```
signature = HMAC-SHA256(webhook_secret, timestamp + "." + payload_body)
```

The `X-Concierge-Timestamp` header contains the Unix timestamp of the delivery. Receivers should reject requests with timestamps older than 5 minutes to prevent replay attacks (per Security Rulebook L.4).

**Verification pseudocode**:

```python
import hmac, hashlib, time

def verify_webhook(payload_body, signature_header, timestamp_header, secret):
    # Reject old timestamps (replay protection)
    if abs(time.time() - int(timestamp_header)) > 300:
        return False

    # Compute expected signature
    message = f"{timestamp_header}.{payload_body}"
    expected = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()

    # Constant-time comparison
    return hmac.compare_digest(expected, signature_header)
```

### 7.5 Retry Policy

If a webhook delivery fails (non-2xx response or timeout), Concierge retries with exponential backoff.

| Attempt     | Delay After Failure | Total Elapsed |
| ----------- | ------------------- | ------------- |
| 1st attempt | Immediate           | 0 minutes     |
| 2nd attempt | 1 minute            | 1 minute      |
| 3rd attempt | 5 minutes           | 6 minutes     |
| 4th attempt | 30 minutes          | 36 minutes    |

After 4 failed attempts, the delivery is marked as `failed` in the delivery log and no further retries are attempted for that event.

**Auto-pause**: If an endpoint accumulates 100 consecutive failed deliveries (across any events), the webhook is automatically paused. The Property Admin receives an email notification. The endpoint can be manually re-activated in the dashboard.

### 7.6 Delivery Log

Every webhook delivery is logged and visible in the dashboard.

| Field              | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `delivery_id`      | Unique ID for this delivery attempt                         |
| `webhook_id`       | Which webhook endpoint received this                        |
| `event_type`       | The event type (e.g., `package.received`)                   |
| `timestamp`        | When the delivery was attempted                             |
| `status_code`      | HTTP status code returned by the endpoint (or `timeout`)    |
| `response_time_ms` | Milliseconds to receive a response                          |
| `response_body`    | First 1,024 characters of the response body (for debugging) |
| `attempt`          | Which attempt this was (1, 2, 3, or 4)                      |
| `success`          | Boolean: was the delivery accepted (2xx status)?            |

**Retention**: Delivery logs are retained for 30 days.

### 7.7 Webhook Testing Tool

Each registered webhook endpoint has a "Send Test Event" button. Clicking it sends a test payload for the selected event type with clearly marked test data (`"test": true` in the payload). Test deliveries appear in the delivery log with a `[TEST]` badge.

---

## 8. Developer Portal UI

### 8.1 Public Portal

The developer portal is publicly accessible at `developers.concierge.com` (or `/developers` from the main domain). No authentication is required to read documentation.

**Portal sections**:

| Section              | Content                                                                               | Purpose                                    |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Getting Started**  | Step-by-step guide: create API key, make first request, handle responses              | Onboard new developers in under 10 minutes |
| **Authentication**   | API key setup, header format, key rotation, OAuth 2.0 overview                        | Ensure developers authenticate correctly   |
| **API Reference**    | Full endpoint catalog with request/response schemas, organized by module              | Interactive reference for all endpoints    |
| **Webhooks**         | Event type catalog, payload format, signature verification guide, retry policy        | Set up reliable event-driven integrations  |
| **SDKs & Libraries** | Links to official SDKs (JavaScript, Python) with installation and usage examples      | Reduce integration time                    |
| **Code Examples**    | Practical examples in JavaScript, Python, and cURL for common workflows               | Copy-paste starting points                 |
| **Changelog**        | Dated list of all API changes, clearly marking breaking changes with migration guides | Keep developers informed of changes        |
| **Status**           | Real-time API health and uptime metrics (embedded from status page)                   | Transparency during outages                |

### 8.2 Interactive API Documentation

The API reference is rendered from the OpenAPI 3.1 specification using an interactive documentation tool (Redoc or Stoplight Elements).

**Features**:

| Feature             | Description                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| **Try It console**  | Developers enter their API key and make live API calls from the browser. Sandbox keys are recommended.    |
| **Request builder** | Form-based request builder with all parameters, headers, and body fields populated from the OpenAPI spec. |
| **Response viewer** | Syntax-highlighted JSON response with status code, headers, and timing information.                       |
| **Schema explorer** | Expandable data model schemas showing all fields, types, required/optional, and descriptions.             |
| **Code generation** | Auto-generated code snippets in JavaScript (fetch), Python (requests), and cURL for every endpoint.       |
| **Search**          | Full-text search across all documentation, endpoint names, field names, and descriptions.                 |

### 8.3 Changelog

The changelog is a dated, reverse-chronological list of all API changes.

**Change types**:

| Type           | Badge Color | Description                                              |
| -------------- | ----------- | -------------------------------------------------------- |
| **New**        | Green       | New endpoint, field, or feature added                    |
| **Changed**    | Yellow      | Existing behavior modified (non-breaking)                |
| **Deprecated** | Orange      | Feature entering 12-month sunset period                  |
| **Breaking**   | Red         | Backwards-incompatible change (only in new API versions) |
| **Fixed**      | Blue        | Bug fix in API behavior                                  |

Breaking changes include a detailed migration guide with before/after examples.

---

## 9. API Key Management Dashboard

### 9.1 Location

Settings > Integrations > API Keys (visible to Property Admin and Super Admin roles only).

### 9.2 Create API Key

**Form fields**:

| Field         | Type         | Required | Description                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string       | Yes      | Human-readable name (e.g., "Accounting Integration", "Mobile App")                                                                                                                                                                                                                                                            |
| `permissions` | multi-select | Yes      | Module-level permissions. Options: `read:units`, `write:units`, `read:residents`, `write:residents`, `read:events`, `write:events`, `read:packages`, `write:packages`, `read:maintenance`, `write:maintenance`, `read:bookings`, `write:bookings`, `read:announcements`, `write:announcements`, `read:reports`, `admin:users` |
| `expiry`      | date picker  | No       | Optional expiration date. Blank means no expiry.                                                                                                                                                                                                                                                                              |
| `environment` | radio        | Yes      | Production (`conc_live_`) or Sandbox (`conc_test_`)                                                                                                                                                                                                                                                                           |

**Post-creation**: The full API key is displayed once in a modal with a "Copy to Clipboard" button and a warning: "This key will not be shown again. Store it securely." The modal cannot be dismissed until the user clicks "I've copied the key."

### 9.3 Key List View

The dashboard displays all API keys for the property in a table.

| Column          | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| **Name**        | Human-readable label                                               |
| **Key prefix**  | First 12 characters (e.g., `conc_live_a1b2...`) for identification |
| **Environment** | "Production" or "Sandbox" badge                                    |
| **Permissions** | Comma-separated list of scopes, truncated with "+N more"           |
| **Created**     | Timestamp and creator's name                                       |
| **Last used**   | Timestamp of the most recent API call, or "Never"                  |
| **Status**      | Active (green), Expired (grey), Revoked (red)                      |
| **Actions**     | Rotate, Revoke, View Usage                                         |

### 9.4 Usage Statistics Per Key

Clicking "View Usage" on any key opens a detail panel.

| Metric               | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| **Calls today**      | Total API requests made with this key today                       |
| **Calls this month** | Total API requests made with this key this calendar month         |
| **Error rate**       | Percentage of requests that returned 4xx or 5xx status codes      |
| **Top endpoints**    | The 5 most-called endpoints and their request counts              |
| **Rate limit usage** | Percentage of the hourly rate limit consumed                      |
| **Last 24h chart**   | Line chart showing request volume per hour over the past 24 hours |

### 9.5 Audit Log

Every API key lifecycle event is logged and visible in the audit trail.

| Event                   | Logged Fields                                                             |
| ----------------------- | ------------------------------------------------------------------------- |
| **Key created**         | Key name, prefix, permissions, creator user ID, timestamp                 |
| **Key rotated**         | Old prefix, new prefix, rotator user ID, grace period end, timestamp      |
| **Key revoked**         | Key prefix, revoker user ID, reason (optional), timestamp                 |
| **Key expired**         | Key prefix, expiry timestamp                                              |
| **Permissions changed** | Key prefix, old permissions, new permissions, modifier user ID, timestamp |

---

## 10. SDKs (v2)

### 10.1 JavaScript / TypeScript SDK

**Package**: `@concierge/sdk` (npm)

**Key features**:

| Feature                  | Description                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Type-safe**            | Full TypeScript types auto-generated from OpenAPI spec                                           |
| **Retry logic**          | Automatic retry with exponential backoff for 429 and 5xx responses                               |
| **Pagination helpers**   | `client.packages.list().autoPaginate()` iterates through all pages                               |
| **Error handling**       | Typed error classes: `ConciergeAuthError`, `ConciergeRateLimitError`, `ConciergeValidationError` |
| **Webhook verification** | `Concierge.webhooks.verify(payload, signature, secret)` helper                                   |

**Usage example**:

```typescript
import { Concierge } from '@concierge/sdk';

const client = new Concierge({ apiKey: 'conc_live_...' });

// List packages for a unit
const packages = await client.packages.list({
  unit_id: 'unit_302',
  status: 'received',
  limit: 50,
});

// Create a maintenance request
const request = await client.maintenance.create({
  unit_id: 'unit_302',
  description: 'Leaking faucet in kitchen',
  category: 'plumbing',
  priority: 'medium',
  permission_to_enter: true,
});
```

### 10.2 Python SDK

**Package**: `concierge-python` (PyPI)

**Key features**: Same as JavaScript SDK -- type hints, retry logic, pagination helpers, webhook verification.

**Usage example**:

```python
from concierge import Concierge

client = Concierge(api_key="conc_live_...")

# List open maintenance requests
requests = client.maintenance.list(status="open", limit=25)

# Release a package
client.packages.release(
    package_id="pkg_01HXYZ",
    released_to="John Smith",
    signature_data=None,
)
```

### 10.3 SDK Generation

Both SDKs are auto-generated from the OpenAPI 3.1 specification using a code generation pipeline. When the API spec changes, the SDKs are regenerated, tested, and published automatically. This ensures the SDKs always match the live API.

---

## 11. Sandbox Environment

### 11.1 Purpose

The sandbox allows developers to test their integrations without affecting production data or triggering real notifications.

### 11.2 Sandbox Behavior

| Aspect             | Sandbox Behavior                                                                                              | Production Behavior                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **API key prefix** | `conc_test_`                                                                                                  | `conc_live_`                                    |
| **Data source**    | Pre-populated demo property ("Maple Heights Condominiums" with 200 units, 400 residents, 6 months of history) | Real property data                              |
| **Notifications**  | No real emails, SMS, or push notifications are sent. All notification events are logged but not delivered.    | Real notifications sent via configured channels |
| **Payments**       | Stripe test mode. Use Stripe test card numbers.                                                               | Stripe live mode with real charges              |
| **Webhooks**       | Delivered normally to registered endpoints, but payloads include `"sandbox": true`                            | Delivered normally                              |
| **Data reset**     | All sandbox data resets to the demo baseline daily at 04:00 UTC                                               | No automatic reset                              |
| **Rate limits**    | Same tier limits as production                                                                                | Same tier limits                                |
| **API parity**     | 100% feature parity with production                                                                           | N/A                                             |

### 11.3 Switching Environments

Developers switch between sandbox and production by changing only the API key prefix in their code. No URL changes, no endpoint changes, no header changes. The API detects the environment from the key prefix.

---

## 12. Data Model

### 12.1 ApiKey

| Field             | Type                 | Description                                                              |
| ----------------- | -------------------- | ------------------------------------------------------------------------ |
| `id`              | UUID                 | Primary key                                                              |
| `property_id`     | UUID (FK)            | Which property this key belongs to                                       |
| `user_id`         | UUID (FK)            | Which user created this key                                              |
| `name`            | string(100)          | Human-readable label                                                     |
| `key_hash`        | string(64)           | SHA-256 hash of the full API key                                         |
| `key_prefix`      | string(16)           | First 12 characters of the key for dashboard display                     |
| `environment`     | enum                 | `production` or `sandbox`                                                |
| `permissions`     | jsonb                | Array of permission scopes (e.g., `["read:packages", "write:packages"]`) |
| `rate_limit_tier` | enum                 | `starter`, `professional`, `enterprise`, `internal`                      |
| `expires_at`      | timestamp (nullable) | When this key expires. Null means no expiry.                             |
| `last_used_at`    | timestamp (nullable) | Timestamp of the most recent API call with this key                      |
| `revoked_at`      | timestamp (nullable) | When this key was revoked. Null means active.                            |
| `revoked_by`      | UUID (nullable, FK)  | Who revoked this key                                                     |
| `created_at`      | timestamp            | When the key was created                                                 |
| `updated_at`      | timestamp            | Last modification time                                                   |

**Indexes**: `property_id`, `key_hash` (unique), `key_prefix`, `environment`, `revoked_at`.

### 12.2 Webhook

| Field                  | Type                 | Description                                                                        |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `id`                   | UUID                 | Primary key                                                                        |
| `property_id`          | UUID (FK)            | Which property this webhook belongs to                                             |
| `url`                  | string(2048)         | The endpoint URL (HTTPS required)                                                  |
| `description`          | string(255)          | Human-readable label                                                               |
| `events`               | jsonb                | Array of subscribed event types (e.g., `["package.received", "package.released"]`) |
| `secret_hash`          | string(64)           | SHA-256 hash of the signing secret                                                 |
| `custom_headers`       | jsonb (nullable)     | Optional headers to include with each delivery                                     |
| `status`               | enum                 | `active`, `paused`, `disabled`                                                     |
| `consecutive_failures` | integer              | Counter for auto-pause logic. Resets to 0 on successful delivery.                  |
| `last_delivery_at`     | timestamp (nullable) | Timestamp of the most recent delivery attempt                                      |
| `created_at`           | timestamp            | When the webhook was registered                                                    |
| `updated_at`           | timestamp            | Last modification time                                                             |

**Indexes**: `property_id`, `status`, `last_delivery_at`.

### 12.3 WebhookDelivery

| Field              | Type               | Description                                               |
| ------------------ | ------------------ | --------------------------------------------------------- |
| `id`               | UUID               | Primary key                                               |
| `webhook_id`       | UUID (FK)          | Which webhook endpoint this delivery was for              |
| `event_type`       | string(100)        | The event type (e.g., `package.received`)                 |
| `event_id`         | string(50)         | The unique event ID (`whevt_01HXYZ`)                      |
| `payload`          | jsonb              | The full webhook payload that was sent                    |
| `status_code`      | integer (nullable) | HTTP status code returned. Null if the request timed out. |
| `response_body`    | text (nullable)    | First 1,024 characters of the response body               |
| `response_time_ms` | integer (nullable) | Milliseconds to receive a response                        |
| `attempt`          | integer            | Which attempt this was (1, 2, 3, or 4)                    |
| `success`          | boolean            | Whether the delivery was accepted (2xx status)            |
| `created_at`       | timestamp          | When this delivery was attempted                          |

**Indexes**: `webhook_id`, `event_type`, `created_at`, `success`.

**Retention**: Records older than 30 days are automatically purged by a background job.

---

## 13. Edge Cases and Error Handling

### 13.1 API Key Compromised

| Step | Action                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------- |
| 1    | Admin discovers key leak (or automated detection flags suspicious usage patterns)              |
| 2    | Admin clicks "Revoke" on the key in the dashboard. Revocation is immediate -- no grace period. |
| 3    | All requests with the revoked key immediately return `401 Unauthorized`                        |
| 4    | An audit alert is generated and sent to all Property Admins via email                          |
| 5    | Admin creates a new key with the same permissions and updates their integration                |
| 6    | The audit log records the revocation reason, revoker, and timestamp                            |

**Automated detection** (v2): If a single API key makes requests from 10+ distinct IP addresses within 1 hour, an alert is sent to the Property Admin suggesting key rotation.

### 13.2 Webhook Endpoint Failures

| Scenario                         | System Behavior                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Endpoint returns 4xx             | Logged as failed. No retry (client error). Counts toward consecutive failure counter.                    |
| Endpoint returns 5xx             | Logged as failed. Retried per the retry policy (Section 7.5). Counts toward consecutive failure counter. |
| Endpoint times out (>30 seconds) | Logged as failed with `status_code: null`. Retried per the retry policy.                                 |
| 100 consecutive failures         | Webhook auto-paused. Admin notified via email. Manual re-activation required.                            |
| Endpoint DNS resolution fails    | Logged as failed. Retried per the retry policy.                                                          |

### 13.3 API Version Sunset

| Phase                           | Client Experience                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **12 months before retirement** | Every response includes `Sunset: Sat, 16 Mar 2027 00:00:00 GMT` header and `Link: </api/v2/>; rel="successor-version"` header                                                                                                                                      |
| **6 months before retirement**  | `X-Concierge-Deprecation-Warning` header added with a human-readable message. Changelog publishes a migration guide.                                                                                                                                               |
| **1 month before retirement**   | Admin email sent to all API key owners with migration instructions                                                                                                                                                                                                 |
| **Retirement day**              | All requests to the retired version return `410 Gone` with a JSON body: `{ "error": "API_VERSION_RETIRED", "message": "API v1 was retired on 2027-03-16. Please migrate to /api/v2/.", "migration_guide": "https://developers.concierge.com/migration/v1-to-v2" }` |

### 13.4 Rate Limit During Critical Operations

If a rate limit is hit during a time-sensitive operation (e.g., distributing an emergency announcement), the system queues the request internally and processes it when the rate limit window resets. The caller receives a `202 Accepted` response with a job ID that can be polled for completion.

```json
{
  "data": {
    "job_id": "job_01HXYZ",
    "status": "queued",
    "poll_url": "/api/v1/jobs/job_01HXYZ"
  },
  "meta": { "request_id": "req_abc123" }
}
```

### 13.5 Large Batch Operations

Batch endpoints (`POST /v1/events/batch`, `POST /v1/packages/batch`) are limited to 100 items per request. For operations exceeding 100 items:

1. The client splits items into batches of 100 and submits sequentially.
2. Each batch is processed within a database transaction (per Security Rulebook I.12).
3. If any item in a batch fails validation, the entire batch is rejected with per-item error details.
4. The response includes a `results` array with the status of each item.

**Batch response**:

```json
{
  "data": {
    "total": 100,
    "succeeded": 98,
    "failed": 2,
    "results": [
      { "index": 0, "id": "pkg_01HA", "status": "created" },
      {
        "index": 47,
        "id": null,
        "status": "error",
        "error": { "code": "VALIDATION_ERROR", "message": "unit_id 'unit_999' does not exist" }
      }
    ]
  },
  "meta": { "request_id": "req_abc123" }
}
```

### 13.6 Idempotency

All POST endpoints accept an `Idempotency-Key` header. If a request with the same idempotency key is received within 24 hours, the original response is returned without re-executing the operation. This prevents duplicate resource creation during network retries.

| Header            | Value                                                                | Behavior                                                                                                     |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Idempotency-Key` | Client-generated UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`) | First request: executed normally. Subsequent requests with same key within 24 hours: return cached response. |

### 13.7 Concurrent Key Rotation

If two admins attempt to rotate the same API key simultaneously:

1. The first rotation request succeeds and generates a new key.
2. The second rotation request fails with `409 Conflict` and the message "This key has already been rotated. Please refresh the page."
3. Optimistic locking on the `ApiKey` record prevents race conditions.

---

## 14. Security Requirements

All API security rules defined in the Security Rulebook (Section I) apply to the Developer Portal & API. Key security controls specific to this module:

| Requirement                   | Implementation                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **No sensitive data in URLs** | API keys in `Authorization` header only, never in query params (I.1)                                               |
| **Consistent error format**   | All errors use the standard envelope. No stack traces, SQL queries, or internal paths in responses (I.2, I.3, I.4) |
| **Request ID tracing**        | Every response includes `X-Request-ID` for log correlation (I.5)                                                   |
| **CORS**                      | Strict origin allowlist, never `*` (I.6)                                                                           |
| **Webhook signatures**        | HMAC-SHA256 with timestamp-based replay protection (I.7, L.3, L.4)                                                 |
| **Idempotency**               | All POST endpoints accept `Idempotency-Key` header (I.8)                                                           |
| **URL-path versioning**       | `/api/v1/` with `Sunset` header on deprecated versions (I.9)                                                       |
| **Mandatory pagination**      | All list endpoints paginated, max 100 per page (I.11)                                                              |
| **Batch limits**              | Max 100 items per batch, processed in a transaction (I.12)                                                         |
| **OpenAPI validation**        | Spec validated against actual API on every CI run (I.14)                                                           |
| **Key storage**               | Only SHA-256 hash stored. Full key shown once at creation.                                                         |
| **Webhook secret storage**    | Hashed with SHA-256, never retrievable after creation                                                              |
| **TLS**                       | All API traffic over HTTPS. HTTP requests are redirected with 301.                                                 |
| **Input validation**          | All request bodies validated with Zod schemas. Invalid requests return 400 with field-level errors.                |

---

## 15. Performance Requirements

| Metric                         | Target       | Measurement                                            |
| ------------------------------ | ------------ | ------------------------------------------------------ |
| **API response time (p50)**    | < 100ms      | Measured at the API gateway, excluding network latency |
| **API response time (p99)**    | < 500ms      | Measured at the API gateway                            |
| **Report generation (p99)**    | < 5 seconds  | Measured for pre-built reports with default date range |
| **Webhook delivery (p50)**     | < 2 seconds  | Time from event to first delivery attempt              |
| **Webhook delivery (p99)**     | < 10 seconds | Time from event to first delivery attempt              |
| **API uptime**                 | 99.9%        | Monthly, excluding scheduled maintenance               |
| **Developer portal uptime**    | 99.5%        | Monthly, static site so higher availability expected   |
| **Concurrent API connections** | 1,000+       | Per property, sustained                                |

---

## 16. Implementation Priority

| Phase  | Component            | Description                                                                                                     |
| ------ | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **v1** | Core API             | All CRUD endpoints for units, residents, events, packages, maintenance, bookings, announcements, reports, users |
| **v1** | API key management   | Dashboard for creating, listing, rotating, and revoking keys                                                    |
| **v1** | Rate limiting        | Tier-based rate limiting with standard headers                                                                  |
| **v1** | OpenAPI spec         | Auto-generated spec validated on CI                                                                             |
| **v1** | Basic developer docs | Getting started guide, authentication guide, API reference (generated from OpenAPI)                             |
| **v2** | Webhook system       | Event subscriptions, signature verification, retry logic, delivery log, testing tool                            |
| **v2** | Interactive docs     | "Try it" console, code generation, full developer portal site                                                   |
| **v2** | Sandbox environment  | Test keys, demo property, daily reset                                                                           |
| **v2** | SDK (JavaScript)     | Auto-generated TypeScript SDK with retry logic and pagination helpers                                           |
| **v2** | OAuth 2.0            | Authorization code flow with PKCE for third-party apps                                                          |
| **v3** | SDK (Python)         | Auto-generated Python SDK                                                                                       |
| **v3** | API analytics        | Usage dashboards, top consumers, error rate trends, latency percentiles                                         |
| **v3** | Marketplace          | Partner app directory with OAuth-based installation flow                                                        |

---

_Last updated: 2026-03-16_
_Author: Concierge Product Team_
