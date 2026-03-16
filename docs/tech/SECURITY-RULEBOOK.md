# Concierge — Security Rulebook

> **Version**: 1.0 | **Date**: 2026-03-15 | **Status**: MANDATORY
>
> This document defines security controls enforced at every phase of development.
> Every developer, reviewer, and deployment must comply with these rules.
> Violations are treated as P1 bugs with 4-hour fix SLA.
>
> **Authority**: This rulebook is referenced by `RULEBOOK.md` (Rule 12) and the Architecture PRD (Section 13).
> It is the single source of truth for security implementation details.

---

## Table of Contents

- [Section A: Authentication](#section-a-authentication)
- [Section B: Authorization](#section-b-authorization)
- [Section C: Input Validation](#section-c-input-validation)
- [Section D: Transport & Storage Encryption](#section-d-transport--storage-encryption)
- [Section E: Security Headers](#section-e-security-headers)
- [Section F: Dependency Security](#section-f-dependency-security)
- [Section G: Logging & Monitoring](#section-g-logging--monitoring)
- [Section H: Incident Response](#section-h-incident-response)
- [Section I: API Security](#section-i-api-security)
- [Section J: Database Security](#section-j-database-security)
- [Section K: File Upload Security](#section-k-file-upload-security)
- [Section L: Third-Party Integration Security](#section-l-third-party-integration-security)
- [Section M: Development Practices](#section-m-development-practices)
- [Phase Boundary Checklist](#phase-boundary-checklist)

---

## Section A: Authentication

> 27 rules governing identity verification, credential storage, and session management.

### A.1 JSON Web Tokens (JWT)

| Parameter | Value | Rationale |
|---|---|---|
| **Signing algorithm** | RS256 (RSA + SHA-256) | Asymmetric signing allows public key verification without exposing the private key. |
| **Access token lifetime** | 15 minutes | Short-lived tokens limit the blast radius of a stolen token. |
| **Refresh token lifetime** | 7 days | Balances usability (weekly re-login) with security. |
| **Refresh token storage** | `httpOnly`, `Secure`, `SameSite=Strict` cookie | Prevents JavaScript access (XSS-proof) and cross-site request attachment. |
| **Access token delivery** | Authorization header (`Bearer <token>`) | Standard pattern; never stored in cookies or localStorage. |
| **Token payload** | `sub` (userId), `pid` (propertyId), `role`, `iat`, `exp` | Minimum claims needed for authorization. No PII in tokens. |
| **Key rotation** | RSA key pair rotated every 90 days via AWS KMS | Old public keys remain in JWKS for token validation until all tokens issued under them expire. |

- **A.1.1**: Access tokens are stateless. The API validates them against the JWKS endpoint without a database lookup.
- **A.1.2**: Refresh tokens are stateful. Each refresh token is stored as a hashed value in the `refresh_tokens` table with `user_id`, `device_fingerprint`, `created_at`, `expires_at`, `revoked_at`.
- **A.1.3**: Refresh token rotation is mandatory. Every time a refresh token is used, it is immediately invalidated and a new refresh token + access token pair is issued. If a revoked refresh token is presented, all refresh tokens for that user are invalidated (replay detection).
- **A.1.4**: On logout, both the access token (added to a short-lived deny list in Redis, TTL = remaining token lifetime) and the refresh token (marked `revoked_at = NOW()`) are invalidated.

### A.2 Password Hashing

| Parameter | Value |
|---|---|
| **Algorithm** | Argon2id |
| **Memory cost** | 64 MB (`m=65536`) |
| **Iterations (time cost)** | 3 (`t=3`) |
| **Parallelism** | 4 (`p=4`) |
| **Salt** | 16 bytes, cryptographically random, per-password |
| **Hash output** | 32 bytes |

- **A.2.1**: Never use MD5, SHA-1, SHA-256, bcrypt, or scrypt for password hashing. Argon2id is the only approved algorithm.
- **A.2.2**: Hash parameters are stored alongside the hash (`$argon2id$v=19$m=65536,t=3,p=4$...`) so they can be upgraded without requiring all users to reset passwords.
- **A.2.3**: On login, if the stored hash uses older parameters, re-hash with current parameters transparently after successful verification.

### A.3 Password Policy

- **A.3.1**: Minimum 12 characters. No maximum limit (up to 128 characters for practical storage).
- **A.3.2**: Must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.
- **A.3.3**: Checked against the Have I Been Pwned (HIBP) Passwords API using k-anonymity (send first 5 characters of SHA-1 hash, check result locally). Passwords appearing in any breach are rejected.
- **A.3.4**: Password history: the last 5 passwords cannot be reused. Comparison uses Argon2id verification against stored historical hashes.
- **A.3.5**: Common password dictionary check: reject passwords matching the top 100,000 common passwords (loaded at startup, checked in-memory).
- **A.3.6**: Password strength meter displayed on all password input fields (client-side, using zxcvbn library). The meter is advisory; server-side rules are authoritative.
- **A.3.7**: Password change requires the current password to be entered and verified before accepting the new password.

### A.4 Account Lockout

- **A.4.1**: After 5 consecutive failed login attempts, the account is locked for 15 minutes.
- **A.4.2**: Progressive delay after each failed attempt within a window: 1s, 2s, 4s, 8s, 16s (exponential backoff).
- **A.4.3**: After 15 consecutive failed attempts (3 lockout cycles), the account is locked until Admin intervention. An email is sent to the account owner and the Property Admin.
- **A.4.4**: Failed attempt counters are tracked per `(user_id, ip_address)` pair in Redis with a 30-minute sliding window.
- **A.4.5**: Account lockout events are logged as security events and visible in the Admin audit log.
- **A.4.6**: IP-level lockout: if a single IP accumulates 20 failed attempts across any accounts within 10 minutes, that IP is temporarily blocked for 30 minutes.

### A.5 Two-Factor Authentication (2FA)

- **A.5.1**: TOTP (Time-based One-Time Password) per RFC 6238 with SHA-1, 6-digit codes, 30-second step.
- **A.5.2**: 2FA is mandatory for: Super Admin, Property Admin, Property Manager, Front Desk/Concierge, Security Guard. Enforcement is checked on every login; if 2FA is required but not enrolled, the user is forced through enrollment before accessing any feature.
- **A.5.3**: 2FA is optional for Resident accounts. Property Admin can make it mandatory per property via settings.
- **A.5.4**: 2FA enrollment: user scans a QR code (otpauth:// URI) with any TOTP app (Google Authenticator, Authy, 1Password). The shared secret is displayed as both QR and manual entry key. The user must enter a valid code to confirm enrollment.
- **A.5.5**: The TOTP shared secret is encrypted at rest using AES-256-GCM with a per-user key derived from the property KMS key.
- **A.5.6**: Recovery codes: 10 single-use codes generated at enrollment, each 8 alphanumeric characters. Displayed once. Stored as Argon2id hashes. Each code can only be used once. User can regenerate all 10 codes (invalidates previous set).
- **A.5.7**: Time window tolerance: accept codes from the current period and one period before/after (90-second total window) to account for clock drift.
- **A.5.8**: Used TOTP codes are tracked in Redis (TTL = 90 seconds) to prevent replay within the validity window.

### A.6 Session Management

- **A.6.1**: One active session per device. A new login from the same device (identified by fingerprint) invalidates the previous session.
- **A.6.2**: All active sessions for a user are invalidated on: password change, role change, account deactivation by Admin, or explicit "Log out all devices" action.
- **A.6.3**: Session timeout: staff roles expire after 8 hours of inactivity. Resident sessions expire after 30 days of inactivity (with "Remember me" checked) or 24 hours (without).
- **A.6.4**: 5 minutes before session expiry, a non-blocking toast notification warns the user. Clicking "Stay logged in" triggers a silent token refresh.
- **A.6.5**: Concurrent session listing: every user can view their active sessions (device, IP, last active time, location) and revoke any session individually.
- **A.6.6**: Admin can view and terminate any user's session within their property.
- **A.6.7**: Super Admin can view and terminate any session system-wide.

### A.7 Login Audit

- **A.7.1**: Every authentication attempt (success and failure) is logged with: timestamp (UTC), user ID (if known), email attempted, IP address, user agent, geo-location (city/country from IP), success/failure, failure reason (invalid password, locked account, invalid 2FA, expired token), session ID (if successful).
- **A.7.2**: Login audit entries are immutable (INSERT-only table, no UPDATE or DELETE permissions for the application user).
- **A.7.3**: Login audit is accessible to the user (their own logins), Property Admin (all users in their property), and Super Admin (all users).
- **A.7.4**: Anomaly detection: alert if a user logs in from a new country, a new device, or at an unusual time (>2 standard deviations from their pattern). Alert goes to the user via email and to the Property Admin dashboard.

### A.8 Account Activation & Password Reset

- **A.8.1**: Welcome email contains a one-time activation link. The token is a cryptographically random 32-byte value, URL-safe base64-encoded, stored as a SHA-256 hash in the database.
- **A.8.2**: Activation link expires in 24 hours. After expiry, Admin must resend the invitation.
- **A.8.3**: Password reset tokens: cryptographically random 32-byte value, single-use, 1-hour expiry. Stored as SHA-256 hash. Invalidated on: use, expiry, new reset request, or password change.
- **A.8.4**: Password reset rate limit: 3 reset requests per email per hour. Do not disclose whether the email exists ("If an account with that email exists, a reset link has been sent").
- **A.8.5**: After successful password reset, all existing sessions and refresh tokens for that user are invalidated.

---

## Section B: Authorization

> 22 rules governing access control, tenant isolation, and permission enforcement.

### B.1 Role-Based Access Control (RBAC)

- **B.1.1**: Authorization is enforced at the API middleware layer. UI-level hiding is cosmetic only and must never be the sole access control mechanism.
- **B.1.2**: Every API route handler follows this exact middleware chain: `requireAuth()` → `requireRole(allowedRoles)` → `requireProperty(propertyId)` → route handler.
- **B.1.3**: `requireAuth()` validates the JWT, checks the deny list, and attaches the decoded user context to the request.
- **B.1.4**: `requireRole(allowedRoles)` checks that `ctx.user.role` is in the allowed set. Returns `403 Forbidden` with a generic message if not.
- **B.1.5**: `requireProperty(propertyId)` checks that the resource being accessed belongs to `ctx.user.propertyId`. Returns `404 Not Found` (not 403) to prevent enumeration.

### B.2 Multi-Tenant Isolation

- **B.2.1**: Every database table containing tenant data has a `property_id` column. There are zero exceptions.
- **B.2.2**: A Prisma middleware automatically appends `WHERE property_id = $ctx.propertyId` to every query. This middleware cannot be bypassed by application code.
- **B.2.3**: Row-Level Security (RLS) is enabled at the PostgreSQL level as a defense-in-depth layer. Even if the Prisma middleware is somehow bypassed, RLS prevents cross-tenant data access.
- **B.2.4**: Cross-tenant access attempts return `404 Not Found`, never `403 Forbidden`. This prevents an attacker from confirming that a resource exists in another tenant.
- **B.2.5**: Super Admin queries that span multiple properties use a separate database connection with explicit property filtering, never by disabling tenant isolation.
- **B.2.6**: Automated cross-tenant isolation tests run on every PR (see Section 14.9.7 of Architecture PRD).

### B.3 Horizontal & Vertical Access Prevention

- **B.3.1**: Horizontal access: a user at Role X in Property A cannot access data belonging to another user at Role X in Property A unless the permission model explicitly allows it (e.g., Admin can view all users in their property).
- **B.3.2**: Vertical access: a user at a lower privilege level cannot invoke endpoints restricted to higher privilege levels. The role hierarchy is: Super Admin > Property Admin > Property Manager > Front Desk/Concierge = Security Guard > Resident.
- **B.3.3**: Every API endpoint is annotated with its minimum required role in the route definition. There are no endpoints accessible to "any authenticated user" without an explicit role list.
- **B.3.4**: Resource ownership checks: for endpoints that modify a resource, verify that the requesting user either owns the resource or has a role with sufficient privilege to modify others' resources.

### B.4 Permission Caching

- **B.4.1**: Resolved permissions are cached in Redis with a 60-second TTL, keyed by `permissions:{userId}`.
- **B.4.2**: Cache is explicitly invalidated (not just expired) on: role change, permission update, account deactivation, or property-level permission policy change.
- **B.4.3**: Cache invalidation is synchronous — the role change API call does not return success until the cache entry is deleted.

### B.5 Custom Roles

- **B.5.1**: Property Admin can create custom roles derived from the built-in role templates.
- **B.5.2**: A custom role cannot have permissions exceeding its creator's permission level. The API validates this constraint on creation and on every update.
- **B.5.3**: Deleting a custom role requires reassigning all users to another role first. The system prevents orphaned users.

### B.6 API Key Scoping

- **B.6.1**: API keys are scoped to: property (one key per property), permission level (read, write, admin), and module (e.g., packages-only, events-only).
- **B.6.2**: API keys are generated as 32-byte cryptographically random values, prefixed with `conc_` for easy identification in logs and secret scanning.
- **B.6.3**: API key hashes (SHA-256) are stored in the database. The plaintext key is shown once at creation and never again.
- **B.6.4**: API keys can be rotated, with a 24-hour grace period where both old and new keys are valid.

### B.7 Super Admin Elevated Operations

- **B.7.1**: Super Admin endpoints that perform destructive or system-wide operations (delete property, modify billing, change encryption keys) require re-authentication within the last 5 minutes.
- **B.7.2**: Re-authentication requires password + 2FA code, not just password.
- **B.7.3**: Re-authentication is validated server-side by checking `ctx.user.lastReauthAt` against `NOW() - 5 minutes`.

---

## Section C: Input Validation

> 17 rules governing request validation, sanitization, and rate limiting.

### C.1 Schema Validation

- **C.1.1**: Every API endpoint defines a Zod schema for: request body, query parameters, and path parameters. No endpoint accepts unvalidated input.
- **C.1.2**: Zod schemas are defined in a shared `schemas/` directory and imported by both the API route and the frontend form. Single source of truth.
- **C.1.3**: Schema validation runs before any business logic. Invalid requests return `400 Bad Request` with field-level error details.
- **C.1.4**: Unknown fields are stripped (Zod `.strict()` or `.strip()`). The API never processes fields it does not expect.

### C.2 SQL Injection Prevention

- **C.2.1**: All database queries go through Prisma ORM, which uses parameterized queries exclusively.
- **C.2.2**: Raw SQL queries (`$queryRaw`, `$executeRaw`) are prohibited in application code. If absolutely necessary (performance-critical reporting), they require Security Champion review and must use Prisma's tagged template literal syntax (`Prisma.sql`) for parameterization.
- **C.2.3**: A custom ESLint rule flags any use of string concatenation or template literals in database query contexts.

### C.3 XSS Prevention

- **C.3.1**: React auto-escaping handles the default case. Never use `dangerouslySetInnerHTML` without Security Champion approval and DOMPurify sanitization.
- **C.3.2**: User-generated content that supports rich text (announcements, comments, descriptions) is sanitized server-side via DOMPurify with a strict allowlist: `<b>`, `<i>`, `<u>`, `<a href>`, `<ul>`, `<ol>`, `<li>`, `<p>`, `<br>`, `<strong>`, `<em>`. All other tags and attributes are stripped.
- **C.3.3**: Content-Security-Policy headers (Section E) provide defense-in-depth against XSS.
- **C.3.4**: URLs in user content are validated against an allowlist of protocols (`https:` only; `javascript:`, `data:`, `vbscript:` are blocked).

### C.4 Rate Limiting

Rate limits are enforced by a Redis-backed middleware at the API gateway level.

| Endpoint Group | Limit | Key | Window |
|---|---|---|---|
| **Authentication** (login, register, reset) | 5 requests | Per IP | 1 minute |
| **Read endpoints** (GET) | 100 requests | Per user | 1 minute |
| **Write endpoints** (POST, PUT, PATCH, DELETE) | 30 requests | Per user | 1 minute |
| **Emergency broadcast** | 5 requests | Per property | 1 minute |
| **File upload** | 10 requests | Per user | 1 minute |
| **Password reset request** | 3 requests | Per email | 1 hour |
| **2FA verification** | 5 requests | Per user | 5 minutes |
| **API key endpoints** | 10 requests | Per API key | 1 minute |
| **Global per-IP** | 300 requests | Per IP | 1 minute |

- **C.4.1**: Rate limit responses return `429 Too Many Requests` with `Retry-After` header indicating seconds until the limit resets.
- **C.4.2**: Rate limit counters use Redis sliding window (not fixed window) to prevent burst attacks at window boundaries.
- **C.4.3**: Super Admin is exempt from rate limits on read endpoints only (for bulk operations). Write limits still apply.

### C.5 Request Size Limits

- **C.5.1**: Default request body size limit: 10 MB.
- **C.5.2**: File upload endpoints: 50 MB (configured per-route, not globally).
- **C.5.3**: JSON depth limit: maximum 10 levels of nesting. Deeper payloads are rejected with `400 Bad Request`.
- **C.5.4**: Array length limit in request bodies: maximum 1,000 items per array field (prevents memory exhaustion).
- **C.5.5**: String field length limits are defined per-field in Zod schemas (e.g., `description` max 4,000 chars, `comment` max 2,000 chars, `name` max 200 chars).

### C.6 URL Parameter Safety

- **C.6.1**: No PII in URL parameters. User IDs, email addresses, phone numbers, names, and other identifying information must be sent in request headers or body, never in query strings or path segments.
- **C.6.2**: A custom ESLint rule flags PII field names (`email`, `phone`, `ssn`, `name`, `address`) in URL construction code.
- **C.6.3**: Resource identifiers in URLs use UUIDs, not sequential IDs (prevents enumeration attacks).

---

## Section D: Transport & Storage Encryption

> 18 rules governing data protection in transit and at rest.

### D.1 Transport Layer Security

- **D.1.1**: TLS 1.3 is the minimum supported version. TLS 1.0, 1.1, and 1.2 are disabled at the load balancer.
- **D.1.2**: HSTS is enabled: `max-age=31536000; includeSubDomains; preload`. The domain is submitted to the HSTS preload list.
- **D.1.3**: Certificate: issued by a trusted CA (e.g., AWS ACM), RSA 2048-bit or ECDSA P-256 minimum. Auto-renewed 30 days before expiry.
- **D.1.4**: OCSP stapling is enabled on the load balancer for fast certificate revocation checking.
- **D.1.5**: Internal service-to-service communication uses mTLS (mutual TLS) within the VPC.

### D.2 Data-at-Rest Encryption

- **D.2.1**: All database volumes (RDS PostgreSQL) use AES-256-GCM encryption via AWS RDS encryption (enabled at instance creation, cannot be disabled).
- **D.2.2**: All Redis volumes use AES-256 encryption at rest (ElastiCache encryption).
- **D.2.3**: All S3 buckets use SSE-KMS (server-side encryption with AWS KMS managed keys).

### D.3 Application-Level Encryption (PII Tiers)

| Tier | Classification | Examples | Encryption Method |
|---|---|---|---|
| **Tier 1 — Critical** | Government-issued identifiers, financial data | SIN, passport number, bank account, credit card | AES-256-GCM with per-property KMS key. Encrypted/decrypted in application layer. |
| **Tier 2 — Sensitive** | Contact and personal information | Email, phone, address, date of birth, emergency contacts | Encrypted at rest (database-level encryption). Application reads plaintext. |
| **Tier 3 — Standard** | Non-sensitive identifiers | Name, unit number, role, event descriptions | No additional encryption beyond database-level. |

- **D.3.1**: Tier 1 fields are encrypted before writing to the database and decrypted after reading. The application never stores Tier 1 plaintext in the database.
- **D.3.2**: Each property has its own KMS key for Tier 1 encryption. If one property's key is compromised, other properties are unaffected.
- **D.3.3**: Encrypted Tier 1 fields include a version prefix (`v1:`) so future algorithm changes can be handled without mass re-encryption.
- **D.3.4**: Tier 1 fields are never included in search indexes, log outputs, or analytics pipelines.

### D.4 Key Management

- **D.4.1**: All encryption keys are managed by AWS KMS. No encryption keys are stored in application code, configuration files, or environment variables.
- **D.4.2**: Automated quarterly key rotation via KMS key rotation policy. Old key versions remain available for decrypting data encrypted under them.
- **D.4.3**: Manual emergency key rotation is available via a Super Admin action, triggered during incident response.
- **D.4.4**: Backup encryption uses a separate KMS key from production. Compromise of the production key does not expose backups, and vice versa.
- **D.4.5**: Key access is restricted by IAM policy: only the application role can encrypt/decrypt, only the DevOps role can manage keys, and only the DR role can access backup keys.
- **D.4.6**: Key deletion requires a 30-day waiting period (AWS KMS default). Accidental deletion is recoverable.

### D.5 Certificate & Secret Rotation

- **D.5.1**: TLS certificates auto-renew 30 days before expiry via AWS ACM.
- **D.5.2**: Database credentials rotate every 90 days via AWS Secrets Manager automatic rotation.
- **D.5.3**: JWT signing keys rotate every 90 days, with a JWKS endpoint serving both old and new public keys during the transition window.
- **D.5.4**: API integration keys (third-party services) rotate annually or immediately on suspected compromise.

---

## Section E: Security Headers

> Every HTTP response from the API and web application includes the following headers. No exceptions.

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: https://api.anthropic.com https://api.openai.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';` | Prevents XSS, clickjacking, and unauthorized resource loading. Nonce is generated per-request. |
| `X-Frame-Options` | `DENY` | Prevents embedding in iframes (defense-in-depth alongside `frame-ancestors 'none'`). |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing. |
| `X-XSS-Protection` | `0` | Disabled; modern browsers' XSS auditors can introduce vulnerabilities. CSP is the correct defense. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends origin only on cross-origin requests; full URL on same-origin. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables browser APIs not needed by the application. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year, including all subdomains. |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetching to reduce information leakage. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context from cross-origin popups. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin reading of resources. |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Ensures all loaded resources have appropriate CORS/CORP headers. |
| `Cache-Control` | `no-store, no-cache, must-revalidate` (for API responses containing user data) | Prevents caching of sensitive data. Static assets use `public, max-age=31536000, immutable`. |

- **E.1**: CSP nonces are generated per-request using `crypto.randomBytes(16).toString('base64')`. Never use `'unsafe-eval'` or `'unsafe-inline'` for scripts.
- **E.2**: CSP violation reports are sent to a `/api/csp-report` endpoint and logged for analysis.
- **E.3**: A dedicated integration test verifies that every security header is present on every response.

---

## Section F: Dependency Security

> 12 rules governing supply chain safety and third-party code.

- **F.1**: `pnpm audit` runs on every CI build. Zero critical or high severity vulnerabilities are allowed. The build fails if any are found.
- **F.2**: Renovate (preferred) or Dependabot is configured for automated dependency update PRs with a daily check schedule.
- **F.3**: License scanning is enforced in CI. Allowed licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, CC0-1.0, Unlicense. Blocked licenses: GPL, AGPL, LGPL, SSPL, EUPL, or any copyleft license in production dependencies. Dev dependencies with copyleft licenses are permitted.
- **F.4**: Pre-commit secrets scanning via gitleaks. The pre-commit hook rejects any commit containing patterns matching API keys, tokens, passwords, private keys, or connection strings.
- **F.5**: The lock file (`pnpm-lock.yaml`) must be committed to the repository. PRs that modify dependencies without updating the lock file are rejected.
- **F.6**: No wildcard version ranges in `package.json`. Exact versions (`1.2.3`) or caret ranges (`^1.2.3`) only. Tilde (`~1.2.3`) and greater-than (`>=1.2.3`) ranges are prohibited.
- **F.7**: Integrity hashes in `pnpm-lock.yaml` are verified on every install (`pnpm install --frozen-lockfile` in CI). Any integrity mismatch fails the build.
- **F.8**: New dependencies require a PR description explaining: what it does, why it is needed, what alternatives were considered, its license, its maintenance status (last publish date, open issues, bus factor).
- **F.9**: Dependencies with fewer than 100 weekly downloads or no updates in the past 12 months require Security Champion approval.
- **F.10**: No post-install scripts from third-party packages (`pnpm config set ignore-scripts true` for untrusted packages, with explicit allowlist for packages that need install scripts).
- **F.11**: Critical CVE patches: when a critical CVE is published for a dependency we use, a patched version must be deployed within 48 hours.
- **F.12**: Quarterly dependency audit: review all dependencies for necessity, check for lighter alternatives, remove unused packages.

---

## Section G: Logging & Monitoring

> 18 rules governing observability, audit trails, and alerting.

### G.1 Log Format & Structure

- **G.1.1**: All logs are structured JSON. No plaintext log lines. Every log entry contains: `timestamp` (ISO 8601 UTC), `level` (debug, info, warn, error, fatal), `service`, `requestId`, `userId` (if authenticated), `propertyId` (if applicable), `message`, `data` (structured payload).
- **G.1.2**: Log levels: `debug` (local development only, never in production), `info` (normal operations), `warn` (recoverable issues), `error` (unrecoverable issues requiring investigation), `fatal` (system cannot continue).
- **G.1.3**: Request correlation: every inbound HTTP request is assigned a unique `requestId` (UUID v4) that propagates through all log entries, database queries, and downstream service calls for that request.

### G.2 PII Sanitization

- **G.2.1**: No PII in logs. A sanitization middleware strips the following fields before logging: `password`, `token`, `secret`, `authorization`, `cookie`, `ssn`, `sin`, `passport`, `creditCard`, `bankAccount`, `dateOfBirth`. These fields are replaced with `[REDACTED]`.
- **G.2.2**: Email addresses in logs are masked: `j***@example.com`.
- **G.2.3**: IP addresses are logged for security events (login attempts, failed RBAC checks) but masked in general application logs.
- **G.2.4**: The sanitization middleware is tested with dedicated unit tests that verify no PII leaks through. These tests run on every PR.

### G.3 Audit Trail

- **G.3.1**: All PII access is logged in a dedicated audit trail table: `who` (userId), `when` (timestamp), `from_where` (IP, user agent), `what` (action: read, create, update, delete), `which_resource` (table, record ID), `which_fields` (list of accessed/modified fields), `property_id`.
- **G.3.2**: The audit trail table uses a separate database user with INSERT-only permissions. The application cannot UPDATE or DELETE audit records.
- **G.3.3**: Audit entries for Tier 1 PII fields (Section D.3) are flagged and included in compliance reports.

### G.4 Real-Time Alerting

| Condition | Severity | Alert Channel | Response |
|---|---|---|---|
| >5 failed logins from single IP in 5 minutes | High | PagerDuty + Slack #security | Auto-block IP for 30 minutes. Investigate. |
| Any cross-tenant access attempt | Critical (P1) | PagerDuty + Slack #security + SMS to Security Champion | Immediate investigation. Incident response triggered. |
| API request volume >10x normal for a user | High | Slack #security | Investigate for compromised account or abuse. |
| Failed RBAC check (privilege escalation attempt) | High | Slack #security | Investigate. Check for exploit attempts. |
| File upload with ClamAV detection | High | Slack #security | File quarantined. Investigate upload source. |
| Error rate >5% on any endpoint for 5 minutes | Medium | Slack #engineering | Investigate for degradation or attack. |
| Database connection pool >80% utilized | Medium | Slack #engineering | Scale or investigate query issues. |
| JWT signing key approaching rotation deadline | Low | Slack #engineering | Verify automated rotation is scheduled. |
| Unusual data export volume (>5 exports by same user in 1 hour) | Medium | Slack #security | Investigate for data exfiltration. |

- **G.4.1**: Alert fatigue prevention: alerts that fire >3 times per day without action are reviewed and either tuned or escalated.
- **G.4.2**: All alerts include: what happened, when, who/what triggered it, link to relevant logs, and suggested first response action.

### G.5 Log Retention & Integrity

- **G.5.1**: Log retention: 2 years in searchable storage (CloudWatch Logs), then archived to S3 Glacier for an additional 5 years (7 years total for PIPEDA compliance).
- **G.5.2**: Logs are append-only. No modification or deletion is permitted. CloudWatch Logs retention policies enforce this.
- **G.5.3**: Log integrity: S3 archived logs use object lock (WORM — Write Once Read Many) to prevent tampering.
- **G.5.4**: Centralized logging pipeline: Application → CloudWatch Logs → S3 (archive) + CloudWatch Insights (query) + alerting rules.

---

## Section H: Incident Response

> 14 rules governing breach response, vulnerability handling, and post-incident process.

### H.1 Severity Classification

| Severity | Definition | Examples | Containment SLA | Notification SLA | Fix SLA |
|---|---|---|---|---|---|
| **P1 — Critical** | Active breach, data exposure, or system compromise | Cross-tenant data leak, credential dump, ransomware, active exploitation | 15 minutes | Super Admin in 15 min; Privacy Commissioner (PIPEDA) within 72 hours; affected users as required | Immediate (all hands) |
| **P2 — High** | Exploitable vulnerability discovered (no evidence of exploitation) | SQL injection found, auth bypass, privilege escalation path | 1 hour | Security Champion + Tech Lead in 1 hour | 24 hours |
| **P3 — Medium** | Security improvement needed | Missing security header, rate limit too lenient, insecure default configuration | 4 hours | Security Champion in 4 hours | 1 week |
| **P4 — Low** | Minor hardening opportunity | Informational header disclosure, verbose error in edge case, dependency with medium CVE | 24 hours | Logged in security backlog | 1 sprint |

### H.2 Incident Response Process

- **H.2.1**: On P1 detection: (1) Contain — isolate affected systems, revoke compromised credentials, block attack vector. (2) Assess — determine scope of data exposure. (3) Notify — Super Admin within 15 minutes, legal counsel within 1 hour, Privacy Commissioner within 72 hours (PIPEDA requirement), affected individuals "as soon as feasible" per PIPEDA. (4) Remediate — patch vulnerability, rotate all potentially compromised secrets. (5) Recover — restore services, verify integrity.
- **H.2.2**: Post-incident report is mandatory within 7 calendar days. The report includes: timeline, root cause analysis (5 Whys), blast radius, data exposed, remediation steps taken, and preventive measures added.
- **H.2.3**: A regression test is added for every security fix. The test must demonstrate that the vulnerability is no longer exploitable.
- **H.2.4**: Incident communication templates are pre-prepared for: user notification, regulatory notification, press statement, and internal post-mortem.
- **H.2.5**: Tabletop exercise: the team conducts a simulated incident response quarterly (rotating scenarios: data breach, DDoS, insider threat, ransomware).
- **H.2.6**: Incident response contacts are documented and updated monthly. On-call rotation includes at least one person with database access and one with infrastructure access.
- **H.2.7**: Evidence preservation: during a P1/P2 incident, all logs, database snapshots, and network captures are preserved before any remediation action that might alter them.
- **H.2.8**: External communication during incidents goes through a single designated spokesperson. No individual developer communicates externally about security incidents.

---

## Section I: API Security

> 14 rules governing REST API hardening and secure communication patterns.

- **I.1**: No sensitive data in URL parameters. All sensitive data is transmitted in request body or headers (see C.6).
- **I.2**: Error responses to clients use a consistent format: `{ "error": "<ERROR_CODE>", "message": "<user-friendly message>", "code": "<machine-readable code>" }`. Error responses never include: stack traces, SQL queries, internal file paths, library versions, or server configuration details.
- **I.3**: Server-side error details (stack traces, query details) are logged at `error` level with the `requestId` for debugging, but never returned to the client.
- **I.4**: Stack traces are never included in production API responses. A global error handler catches all unhandled exceptions and returns a generic `500 Internal Server Error` with a `requestId`.
- **I.5**: Every request receives a unique `X-Request-ID` header in the response, matching the server-side `requestId` for log correlation.
- **I.6**: CORS configuration: strict origin allowlist. `Access-Control-Allow-Origin` is set to the exact frontend domain(s), never `*`. `Access-Control-Allow-Credentials: true`. Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`. Allowed headers: `Authorization, Content-Type, X-Request-ID`.
- **I.7**: Webhook endpoints verify the sender's signature using HMAC-SHA256. The webhook secret is stored in AWS KMS/Secrets Manager. Webhooks include a timestamp; requests older than 5 minutes are rejected (replay protection).
- **I.8**: Idempotency keys: all POST endpoints that create resources accept an `Idempotency-Key` header. Duplicate requests with the same key within 24 hours return the original response without re-executing.
- **I.9**: API versioning via URL path (`/api/v1/`, `/api/v2/`). Deprecated versions serve a `Sunset` header with the retirement date and a `Link` header pointing to the successor version.
- **I.10**: GraphQL is not used. REST with Zod-validated schemas provides sufficient type safety with a smaller attack surface.
- **I.11**: Pagination is mandatory on all list endpoints. Maximum page size: 100 items. Default: 25. Cursor-based pagination preferred over offset-based for large datasets.
- **I.12**: Bulk operations (batch create/update/delete) are limited to 100 items per request and are processed within a database transaction.
- **I.13**: Health check endpoint (`/api/health`) is unauthenticated but returns only `{ "status": "ok" }` with no system details. A detailed health endpoint (`/api/health/detailed`) requires Super Admin authentication and returns database, cache, and storage status.
- **I.14**: OpenAPI specification is generated from Zod schemas and route definitions. It is validated on every CI run to ensure it matches the actual API.

---

## Section J: Database Security

> 13 rules governing data layer protection, access control, and integrity.

- **J.1**: Connection pooling via PgBouncer (or Prisma's built-in connection pool). Maximum connections per tenant are capped to prevent one property from exhausting the pool. Default: 10 connections per property, 100 total.
- **J.2**: Read replicas handle all reporting and analytics queries. Read replicas have no write access. The application uses separate Prisma clients for read and write operations.
- **J.3**: The audit log table (`audit_entries`) is accessed by a separate database user (`audit_writer`) with INSERT-only permissions. The application user cannot UPDATE or DELETE audit records. No database trigger or function can modify audit records.
- **J.4**: Soft deletes only. Every table with user-visible data has a `deleted_at` column (nullable timestamp). Application code uses `WHERE deleted_at IS NULL` on all queries (enforced by Prisma middleware). Hard `DELETE` statements are prohibited in application code.
- **J.5**: Permanent data purge (hard delete) is a scheduled background job that removes soft-deleted records older than the retention period (default: 7 years for PIPEDA). This job requires Super Admin confirmation and logs every purged record ID.
- **J.6**: Database migrations require review by at least 2 engineers. Destructive migrations (DROP TABLE, DROP COLUMN, ALTER TYPE) require an Architecture Decision Record (ADR) with rollback plan.
- **J.7**: Backup verification: automated restore test runs monthly against the latest backup, verifying row counts and data integrity checksums.
- **J.8**: Point-in-time recovery (PITR) is enabled and tested quarterly. The test restores to a random point in the past 7 days and verifies data integrity.
- **J.9**: Database access from developer machines is prohibited in production. Production database access requires a jump box with MFA, session recording, and a time-limited access grant (maximum 4 hours).
- **J.10**: Database credentials are managed by AWS Secrets Manager with automatic rotation every 90 days. The application fetches credentials at startup and on rotation events.
- **J.11**: Query timeout: maximum 30 seconds for user-facing queries, 5 minutes for background jobs and reports. Queries exceeding the timeout are terminated.
- **J.12**: Slow query logging: queries exceeding 1 second are logged with the full query plan for analysis. Queries exceeding 5 seconds trigger an alert.
- **J.13**: Database user privileges follow least-privilege: the application user has SELECT, INSERT, UPDATE on data tables; no DROP, TRUNCATE, or ALTER permissions. Schema migrations use a separate `migration_user` with elevated privileges, used only during deployment.

---

## Section K: File Upload Security

> 13 rules governing safe file handling, storage, and delivery.

- **K.1**: Allowlist of accepted MIME types (not a denylist). Allowed types:
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`
  - Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Video: `video/mp4`, `video/quicktime` (for inspection evidence)
- **K.2**: MIME type validation via magic bytes (file signature), not file extension. The first 8 bytes of the file are checked against known magic byte sequences. Extension-based validation is defense-in-depth only.
- **K.3**: File size limits: images 5 MB, documents 10 MB, video 50 MB. Enforced at both the API gateway (request size) and application layer (post-parse).
- **K.4**: Files are renamed on upload to UUID v4 with the original extension preserved for display purposes only. The storage key is `{propertyId}/{year}/{month}/{uuid}.{ext}`. User-supplied filenames are never used in the storage path.
- **K.5**: Files are stored in a dedicated S3 bucket, separate from application code and configuration. The bucket has: versioning enabled, public access blocked (Block All Public Access), server-side encryption (SSE-KMS), and lifecycle rules for cost optimization.
- **K.6**: File access uses presigned S3 URLs with 15-minute expiry. The API generates a presigned URL on-demand when the user requests the file, after verifying authorization. Files are never served through the application server.
- **K.7**: `Content-Disposition: attachment` is set on all file downloads to prevent inline script execution in the browser.
- **K.8**: Image processing: EXIF metadata (including GPS coordinates, device information, and timestamps) is stripped from all uploaded images using a server-side library (e.g., sharp) before storage.
- **K.9**: Virus scanning: every uploaded file is scanned by ClamAV before being moved to permanent storage. Infected files are quarantined in a separate S3 bucket with restricted access and an alert is sent to the Security Champion.
- **K.10**: Upload progress: large file uploads use multipart upload with server-side assembly. Each part is scanned individually; if any part fails scanning, the entire upload is rejected.
- **K.11**: File type re-validation on download: when generating a presigned URL, the `Content-Type` header is set based on the stored MIME type (from magic byte validation at upload), not the file extension.
- **K.12**: Maximum files per request: 10 files. Maximum total upload size per request: 50 MB.
- **K.13**: Uploaded files are not indexed by search engines. The S3 bucket has `x-robots-tag: noindex` and the application never generates public URLs.

---

## Section L: Third-Party Integration Security

> 11 rules governing external API connections, webhooks, and data sharing.

- **L.1**: All API keys, tokens, and secrets for third-party services are stored in AWS KMS or AWS Secrets Manager. They are never committed to code, stored in environment variables on disk, or included in Docker images.
- **L.2**: All external API calls are made server-side only. The frontend never communicates directly with third-party APIs. This prevents API key exposure and allows server-side logging and rate limiting.
- **L.3**: Webhook endpoints verify the sender's identity via HMAC-SHA256 signature verification. The webhook body, timestamp, and a shared secret are used to compute the expected signature.
- **L.4**: Webhook replay protection: each webhook request includes a timestamp. Requests with timestamps older than 5 minutes are rejected. A nonce (unique request ID) is stored in Redis (TTL = 10 minutes) to prevent replay of recent requests.
- **L.5**: Rate limiting on outbound API calls prevents cost overruns and abuse. Per-provider limits:
  - AI providers (Anthropic, OpenAI): 100 requests/minute
  - Email (SES): 50 emails/second (AWS limit)
  - SMS (Twilio): 10 messages/second
  - Payment (Stripe): 25 requests/second
- **L.6**: Circuit breaker pattern: if a third-party provider returns >50% errors over a 30-second window, the circuit opens and all requests to that provider are short-circuited with a graceful fallback for 60 seconds before retrying.
- **L.7**: No PII is sent to AI providers (Anthropic, OpenAI) without first stripping or anonymizing identifiable fields. Unit numbers, names, phone numbers, and email addresses are replaced with placeholders before sending content for AI processing. The AI provider configuration explicitly opts out of training on our data.
- **L.8**: Third-party service health is monitored on the system health dashboard. Degraded providers show a warning banner to Admin users.
- **L.9**: Vendor security assessment: before integrating any new third-party service, a security questionnaire is completed covering: data handling practices, encryption standards, compliance certifications, breach notification policy, and data residency.
- **L.10**: Data residency: all third-party services must store and process Canadian resident data within Canada or the US, per PIPEDA requirements. Services that route data through other jurisdictions are not approved.
- **L.11**: Third-party SDK inclusion: any client-side JavaScript SDK (analytics, chat widgets, etc.) requires Security Champion approval and must be loaded from our own domain via a reverse proxy, not directly from the vendor's CDN.

---

## Section M: Development Practices

> 14 rules governing secure coding standards and team processes.

- **M.1**: No hardcoded secrets anywhere in the codebase. Gitleaks runs as a pre-commit hook and in CI. Any commit containing a secret pattern (API key, token, password, private key, connection string) is rejected.
- **M.2**: No `TODO` or `FIXME` comments related to security without a linked ticket (e.g., `// TODO(SEC-123): Add rate limiting to this endpoint`). A CI check scans for unlinked security TODOs.
- **M.3**: Security-sensitive code changes require 3 reviewers (not the standard 2). Security-sensitive areas: authentication, authorization, encryption, session management, file upload, payment processing, PII handling, audit logging.
- **M.4**: Penetration test findings are tracked in the issue tracker with severity labels and due dates matching Section H SLAs. Each finding has an assigned owner.
- **M.5**: OWASP Top 10 compliance is verified quarterly via a checklist review against the latest OWASP Top 10 list. Findings are tracked as P2 or P3 issues depending on exploitability.
- **M.6**: Critical CVE response: when a critical CVE is published for any dependency in our stack, a patched version must be deployed within 48 hours. If no patch exists, a mitigation (WAF rule, code workaround) must be deployed within 24 hours.
- **M.7**: Code review security checklist (appended to every PR template):
  - [ ] No hardcoded secrets or credentials
  - [ ] Input validation on all new/modified endpoints
  - [ ] Authorization checks on all new/modified endpoints
  - [ ] Tenant isolation maintained (property_id in all queries)
  - [ ] No PII in logs
  - [ ] No PII in URL parameters
  - [ ] Error messages do not leak internal details
  - [ ] File uploads validated (MIME type, size, virus scan)
  - [ ] New dependencies reviewed (license, maintenance, necessity)
  - [ ] Tests cover the security-relevant behavior
- **M.8**: Feature flags for security-related features: new authentication methods, authorization changes, and encryption upgrades are deployed behind feature flags with gradual rollout.
- **M.9**: Developer environments do not have access to production data. Staging environments use anonymized data generated by a seeding script.
- **M.10**: Security training: every developer completes OWASP-based secure coding training annually. New hires complete it within their first 2 weeks.
- **M.11**: Responsible disclosure policy: a `/.well-known/security.txt` file is served at the application root, pointing to a `security@concierge.app` email for external vulnerability reports.
- **M.12**: All security decisions are documented as ADRs (Architecture Decision Records) in `docs/tech/ADR-*` files.
- **M.13**: No disabling of security controls in test environments. Test environments run with the same security middleware, headers, and encryption as production (with test keys).
- **M.14**: Branch protection: `main` branch requires passing CI (including SAST, audit, and lint), at least 2 approvals (3 for security-sensitive code per M.3), and no direct pushes. Force push to `main` is disabled.

---

## Phase Boundary Checklist

> This checklist defines which security controls must be verified at each development phase.
> A phase cannot be considered complete until all applicable checks pass.

| # | Security Check | Design | Implement | PR Review | CI Pipeline | Staging | Production |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Authentication flows designed/implemented per Section A | X | X | X | | | |
| 2 | RBAC middleware on every API route (Section B) | | X | X | X | X | |
| 3 | Multi-tenant isolation with property_id (B.2) | | X | X | X | X | X |
| 4 | Zod schema validation on every endpoint (C.1) | | X | X | X | | |
| 5 | Parameterized queries only — no raw SQL (C.2) | | X | X | X | | |
| 6 | HTML sanitization on user content (C.3) | | X | X | | | |
| 7 | Rate limiting configured per endpoint group (C.4) | | X | | | X | X |
| 8 | TLS 1.3 enforced, HSTS enabled (D.1) | | | | | X | X |
| 9 | Tier 1 PII encrypted at application level (D.3) | X | X | X | | X | |
| 10 | All security headers present (Section E) | | X | | X | X | X |
| 11 | Dependency audit — zero critical/high (F.1) | | | | X | | |
| 12 | Secrets scanning — no hardcoded secrets (F.4, M.1) | | | X | X | | |
| 13 | License compliance verified (F.3) | | | X | X | | |
| 14 | Structured JSON logging, no PII in logs (G.1, G.2) | | X | X | | X | |
| 15 | Audit trail for PII access (G.3) | | X | X | | X | X |
| 16 | Alerting rules configured (G.4) | | | | | X | X |
| 17 | Incident response contacts updated (H.2.6) | | | | | | X |
| 18 | Error responses sanitized — no stack traces (I.2, I.4) | | X | X | | X | |
| 19 | CORS strict origin whitelist (I.6) | | X | | | X | X |
| 20 | Soft deletes only — no hard DELETE (J.4) | | X | X | X | | |
| 21 | File upload security: magic bytes, ClamAV, UUID rename (Section K) | | X | X | | X | |
| 22 | Third-party API calls server-side only (L.2) | X | X | X | | | |
| 23 | No PII sent to AI providers (L.7) | X | X | X | | X | |
| 24 | SAST scan — zero critical/high findings | | | | X | | |
| 25 | DAST scan — zero critical/high findings | | | | | X | |
| 26 | Cross-tenant DAST test passing | | | | | X | |
| 27 | PR security checklist completed (M.7) | | | X | | | |
| 28 | 3 reviewers for security-sensitive changes (M.3) | | | X | | | |
| 29 | Backup encryption verified (D.4.4) | | | | | | X |
| 30 | Key rotation schedule confirmed (D.4.2) | | | | | | X |

**Legend**: X = This check is required at this phase. Empty = Not applicable at this phase.

**Gate rule**: No code moves from one phase to the next unless all X-marked checks for the current phase pass. There are no exceptions. If a check fails, the phase is blocked until the issue is resolved.

---

## Quick Reference: Rule Count by Section

| Section | Rules | Focus Area |
|---|---|---|
| A — Authentication | 27 | Identity, credentials, sessions |
| B — Authorization | 22 | Access control, tenant isolation |
| C — Input Validation | 17 | Schemas, sanitization, rate limits |
| D — Transport & Storage | 18 | Encryption in transit and at rest |
| E — Security Headers | 12 | HTTP response hardening |
| F — Dependency Security | 12 | Supply chain safety |
| G — Logging & Monitoring | 18 | Observability, audit, alerts |
| H — Incident Response | 14 | Breach handling, SLAs |
| I — API Security | 14 | REST hardening |
| J — Database Security | 13 | Data layer protection |
| K — File Upload Security | 13 | Safe file handling |
| L — Third-Party Integration | 11 | External API safety |
| M — Development Practices | 14 | Secure coding standards |
| **Total** | **205** | |

---

*This document is mandatory. Every rule is enforceable. Every violation is a P1 bug.*
*Review quarterly. Update when new attack vectors, compliance requirements, or architecture changes arise.*
