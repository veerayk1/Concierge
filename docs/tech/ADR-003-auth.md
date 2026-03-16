# ADR-003: Custom JWT Auth with Argon2id and TOTP 2FA

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge operates in a security-sensitive condo environment where authentication is
fundamentally different from typical SaaS applications:

- **No self-registration**: Admins create all accounts and assign roles. There is no public
  sign-up page, no SSO, no social login. This is a deliberate security decision for
  multi-residential buildings where access must be tightly controlled.
- **12-role hierarchy**: Super Admin, Property Admin, Property Manager, Building Manager,
  Front Desk/Concierge, Security Guard, Maintenance Staff, Board Member, Board Chair,
  Resident Owner, Resident Tenant, Visitor (limited). Each role has distinct permissions
  across 20+ modules.
- **Per-property tenant isolation**: A user may have different roles at different properties.
  A Property Manager at Building A might be a Board Member at Building B. Auth tokens must
  encode the current property context.
- **2FA enforcement by role**: Security-sensitive roles (Super Admin, Property Admin, Security
  Guard) require mandatory TOTP 2FA. Other roles have optional 2FA.
- **Complete audit trail**: Every login attempt (success and failure), session creation,
  password change, role change, and 2FA enrollment must be logged with IP, user agent, and
  timestamp. Required for SOC 2 and ISO 27001.
- **Session management**: Admins must be able to view active sessions for any user and
  terminate them. Users must see their own recent login activity via a "Recent Account Activity"
  panel showing device, IP, and status.
- **Password policy enforcement**: Minimum 12 characters, complexity requirements, breach
  database checking, password history (last 10), forced rotation per policy.

## Decision

Implement a **custom JWT-based authentication system** with:

- **Argon2id** for password hashing (memory-hard, GPU-resistant, OWASP-recommended).
- **TOTP-based 2FA** via RFC 6238, compatible with Google Authenticator, Authy, and 1Password.
- **Short-lived access tokens** (15-minute JWT) + **long-lived refresh tokens** (7-day,
  stored in PostgreSQL, rotated on each use).
- **HttpOnly, Secure, SameSite=Strict cookies** for token storage (not localStorage).
- **Next.js middleware** for token verification on every request (ADR-001).
- **Role and property context in JWT claims** for RBAC enforcement without database lookups
  on every request.

### Token Structure

```
Access Token (JWT, 15min):
{
  "sub": "user_uuid",
  "pid": "property_uuid",       // current property context
  "role": "property_manager",   // role at current property
  "perms": ["events:write", "maintenance:admin", ...],  // flattened permissions
  "mfa": true,                  // 2FA verified this session
  "iat": 1710500000,
  "exp": 1710500900
}

Refresh Token (opaque, stored in DB):
{
  "id": "token_uuid",
  "user_id": "user_uuid",
  "device_fingerprint": "sha256_hash",
  "ip": "192.168.1.1",
  "expires_at": "2026-03-22T00:00:00Z",
  "rotated_at": null
}
```

### 2FA Flow

1. User enters email + password.
2. Server validates credentials, checks if 2FA is enabled.
3. If 2FA required: return a short-lived `mfa_pending` token (5 minutes). Client shows
   TOTP input screen.
4. User enters 6-digit TOTP code.
5. Server validates TOTP, issues full access + refresh tokens with `mfa: true`.
6. If 2FA not required: issue tokens directly after password validation.

### Audit Trail Schema

```sql
CREATE TABLE auth_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  event_type    VARCHAR(50) NOT NULL,  -- login_success, login_failure, logout,
                                       -- password_change, mfa_enroll, mfa_verify,
                                       -- session_revoke, role_change, token_refresh
  ip_address    INET,
  user_agent    TEXT,
  device_info   JSONB,
  property_id   UUID REFERENCES properties(id),
  metadata      JSONB,                 -- failure_reason, old_role, new_role, etc.
  created_at    TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

## Rationale

1. **Admin-controlled accounts eliminate SSO/social auth complexity**: Since there is no
   self-registration, we do not need OAuth flows, social provider integrations, email
   verification for sign-up, or account linking. This dramatically simplifies the auth
   surface area.

2. **Multi-property role context requires custom JWT claims**: No off-the-shelf auth
   provider supports "user X is a Manager at Property A but a Board Member at Property B"
   with per-property permission sets in a single token. Custom JWTs encode this naturally.

3. **Argon2id is the current OWASP recommendation**: Supersedes bcrypt and scrypt. Memory-hard
   design resists GPU/ASIC attacks. Configurable memory (64MB), iterations (3), and
   parallelism (4) parameters allow tuning for server capacity.

4. **TOTP is universal and offline**: Works with any authenticator app. No SMS dependency
   (SMS 2FA is deprecated by NIST SP 800-63B). No vendor lock-in. Recovery codes (10
   single-use codes) handle device loss.

5. **Short-lived JWTs + refresh rotation limits blast radius**: A stolen access token expires
   in 15 minutes. Refresh tokens rotate on each use, so a stolen refresh token is invalidated
   when the legitimate user's next request uses it (detecting the theft).

6. **HttpOnly cookies prevent XSS token theft**: Tokens stored in HttpOnly cookies are
   inaccessible to JavaScript, eliminating the most common token theft vector in SPAs.

## Alternatives Considered

### NextAuth.js (Auth.js)
- **Pros**: Built for Next.js, supports many providers, session management, database adapters.
- **Rejected because**: Designed around OAuth/social login flows that we do not use. The
  admin-creates-account model does not fit NextAuth's user-initiated flow. Custom credential
  providers in NextAuth are explicitly discouraged in their docs as "less secure." No built-in
  support for multi-property role context in session tokens. Would require extensive
  customization that defeats the purpose of using a library.

### Clerk
- **Pros**: Excellent DX, pre-built UI components, session management dashboard.
- **Rejected because**: External dependency for the most security-critical path. User data
  (emails, passwords, sessions) would be stored on Clerk's infrastructure, complicating
  PIPEDA data residency requirements. No support for admin-created accounts without
  self-service flows. Per-MAU pricing becomes expensive at scale (thousands of residents
  across properties). Cannot customize the JWT claims structure for multi-property roles.

### Auth0
- **Pros**: Enterprise-grade, extensive customization via Actions, M2M tokens, RBAC.
- **Rejected because**: Complex pricing (per-MAU + per-organization for multi-tenant). Data
  residency in Canada requires Enterprise plan. Auth0's RBAC model does not natively support
  "different roles per organization" without custom Actions and metadata. Adds 100-200ms
  latency for token verification if using Auth0's `/userinfo` endpoint instead of local
  JWT verification.

### Supabase Auth
- **Pros**: PostgreSQL-native, RLS integration, built-in session management.
- **Rejected because**: Tied to Supabase ecosystem (rejected in ADR-002). Self-registration
  focused. Custom claims require edge functions. No built-in TOTP 2FA (only phone OTP).
  Multi-property role context not supported natively.

### Firebase Auth
- **Pros**: Free tier generous, good mobile SDK for future React Native app.
- **Rejected because**: Google Cloud infrastructure, data residency concerns for PIPEDA.
  Custom claims limited to 1000 bytes. No built-in 2FA for custom email/password
  (only phone-based). Firebase's auth model assumes self-registration.

## Consequences

### Positive
- Full control over the authentication flow, token structure, and session lifecycle.
- Multi-property role context encoded directly in JWT claims.
- No external dependency for the most security-critical component.
- Complete audit trail with IP, device, and event type for compliance.
- 2FA enforcement configurable per role by Super Admin.
- Session management (view and revoke) for both admins and users.
- Data residency fully controlled (all auth data in ca-central-1).

### Negative
- Significant implementation effort: password hashing, token lifecycle, refresh rotation,
  2FA enrollment, recovery codes, audit logging, session management UI.
- Security responsibility is fully on the team. No vendor to absorb liability for auth bugs.
- Must implement brute-force protection (rate limiting, account lockout) manually.
- Must handle edge cases: clock drift for TOTP, refresh token race conditions on concurrent
  requests, device fingerprint changes on browser updates.

### Risks
- **Implementation vulnerabilities**: Custom auth has more surface area for bugs than
  battle-tested libraries. Mitigated by: security-focused code review, automated SAST on
  every PR (OWASP ZAP, Semgrep), penetration testing before launch, following OWASP ASVS
  Level 2 verification standard.
- **Token theft via XSS**: Even with HttpOnly cookies, CSRF is possible. Mitigated by
  SameSite=Strict cookies and CSRF tokens on state-changing requests.
- **Refresh token database load**: Every API call that triggers a refresh hits the database.
  Mitigated by 15-minute access token lifetime (refresh only every 15 min) and connection
  pooling via PgBouncer.

## Related ADRs
- ADR-001: Framework (Next.js middleware enforces auth on every route)
- ADR-002: Database (user, session, and audit tables in PostgreSQL)
- ADR-004: Realtime (Socket.io connections authenticated via JWT)
