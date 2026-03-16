# ADR-008: Hosting & Deployment Architecture

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge is a multi-tenant condo management platform handling personal resident data (names, unit numbers, emergency contacts, package tracking, security logs) under Canadian privacy law. The hosting architecture must satisfy:

1. **PIPEDA data residency**: All personally identifiable information must reside within Canada. No exceptions.
2. **Disaster recovery**: RPO (Recovery Point Objective) of 1 hour, RTO (Recovery Time Objective) of 4 hours, as mandated by RULEBOOK Rule 12 and the Data Security & Backup architecture.
3. **Geographic redundancy**: Primary, secondary, and cold standby — all within Canadian borders.
4. **Encryption**: AES-256 at rest (per-property KMS keys), TLS 1.3 in transit.
5. **Performance**: Sub-200ms API response times for dashboard loads. Real-time WebSocket delivery under 100ms.
6. **Deployment velocity**: Preview deployments on every PR, canary rollouts to production, auto-rollback on error rate spikes.
7. **Cost efficiency**: Startup-appropriate pricing that scales with property count, not fixed enterprise infrastructure costs.
8. **Compliance**: SOC 2, ISO 27001, ISO 27701, ISO 27017, ISO 9001, GDPR, and HIPAA-ready infrastructure (per RULEBOOK Rule 12).

The frontend (Next.js 15 App Router with RSC) and backend (API routes, database, file storage, real-time) have fundamentally different hosting requirements. The frontend benefits from edge distribution and instant deployments; the backend requires Canadian data residency, managed database services, and hardware security modules.

## Decision

We adopt a split hosting architecture:

| Layer | Provider | Region |
|-------|----------|--------|
| **Frontend** | Vercel | Edge (global CDN, serverless functions in ca-central-1) |
| **Backend API** (future extraction) | AWS ECS Fargate or Lambda | ca-central-1 (Toronto) |
| **Database** | AWS RDS PostgreSQL 16+ | Primary: ca-central-1 (Toronto), Replica: ca-central-1 (Montreal AZ) |
| **Object Storage** | AWS S3 | ca-central-1 (Toronto) |
| **Encryption Keys** | AWS KMS | ca-central-1 (Toronto) |
| **Caching** | AWS ElastiCache (Redis 7.x) | ca-central-1 (Toronto) |
| **Cold Standby** | AWS S3 Glacier | ca-west-1 (Calgary) |
| **DNS & CDN** | Vercel (frontend), AWS CloudFront (API/assets) | Edge |

### Geographic Strategy

All data-bearing infrastructure is within Canada:

| Tier | Location | Purpose | Failover |
|------|----------|---------|----------|
| **Primary** | Toronto (ca-central-1) | All services — RDS, S3, Redis, KMS, ECS/Lambda | Active |
| **Secondary** | Montreal (ca-central-1 alternate AZ) | RDS read replica, S3 cross-region replication | Warm standby |
| **Cold Standby** | Calgary (ca-west-1) | Daily encrypted backups in S3 Glacier, archived WAL segments | Cold recovery |

## Rationale

### Vercel for Frontend

Vercel is the canonical hosting platform for Next.js. It provides:

- **Zero-config deployments**: `git push` triggers build and deploy. No Dockerfile, no container orchestration, no Nginx configuration.
- **Preview deployments**: Every PR gets a unique URL. QA, design review, and stakeholder feedback happen on real deployments, not local screenshots.
- **Edge functions**: Next.js middleware (authentication checks, RBAC enforcement, tenant routing) executes at the edge — the auth check happens before the request reaches the origin.
- **ISR (Incremental Static Regeneration)**: Content pages (announcements, library documents, building directory) are statically generated and revalidated on demand. No full rebuild needed.
- **Web Vitals monitoring**: Built-in performance analytics tied to Core Web Vitals (LCP, FID, CLS). Aligns with our performance monitoring requirements.
- **Serverless function region**: Configured to `cen1` (Canada) for server-side rendering and API route execution, keeping data processing within Canadian borders.

Vercel's pricing scales with usage (bandwidth, function invocations, build minutes) rather than fixed infrastructure — appropriate for a startup growing from 1 property to 100.

### AWS for Backend Services

AWS provides the Canadian data residency, managed database, encryption, and compliance certifications we require:

- **RDS PostgreSQL**: Managed database with automated backups, point-in-time recovery (PITR to any second within retention window), automated patching, and multi-AZ failover. RPO 1 hour is satisfied by continuous WAL archiving; RTO 4 hours is satisfied by automated failover + application reconnection.
- **S3**: Object storage for maintenance photos, documents, training materials, and property branding assets. Per-property encryption via KMS keys ensures one property's files cannot be decrypted with another property's key.
- **KMS**: Hardware security modules for encryption key management. Per-property symmetric keys (AES-256) for S3 objects, asymmetric keys (RSA-2048) for JWT signing. Quarterly automated key rotation.
- **ElastiCache (Redis)**: Session cache, rate limiting, permission cache, and AI response cache. In-VPC deployment ensures cache traffic never leaves the private network.
- **VPC**: Database and cache tiers in private subnets with no public internet access. Only the application tier (ECS/Lambda) can reach them through security groups.

AWS holds SOC 2 Type II, ISO 27001, ISO 27017, ISO 27018, and PIPEDA compliance certifications for ca-central-1 — satisfying our 8-framework compliance requirement.

### Why Split Hosting (Not All-AWS or All-Vercel)

**All-AWS** would require managing container deployments, build pipelines, CDN configuration, and SSL certificates for the frontend. This is undifferentiated heavy lifting that Vercel handles automatically. A small team should not operate Nginx, manage Docker builds, or configure CloudFront distributions for a Next.js app when Vercel does it in one click.

**All-Vercel** cannot satisfy our data residency requirements for the database tier (Vercel's managed Postgres is US-based), does not offer KMS-grade encryption key management, and does not provide the compliance certifications we need for PIPEDA, SOC 2, and ISO 27001.

The split approach gives us the best of both: Vercel's developer experience and deployment speed for the frontend, AWS's compliance, managed services, and Canadian data residency for everything that touches PII.

### Deployment Strategy

| Strategy | Scope | Details |
|----------|-------|---------|
| **Preview deployments** | Every PR | Vercel auto-deploys a preview URL. Playwright E2E and DAST run against it. |
| **Canary rollout** | Production deploys | 1% -> 10% -> 50% -> 100% traffic shift. Each stage holds for 5 minutes. |
| **Auto-rollback** | Production | If error rate exceeds 1% within 5 minutes at any canary stage, automatic rollback to previous version. |
| **Feature flags** | Per-property | Every feature behind a flag. Properties can opt into new features independently. |
| **Blue/green** | Database migrations | Schema changes deployed to "blue" environment, validated, then traffic switched. Zero-downtime migrations. |

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **All AWS (ECS + CloudFront)** | Requires managing container builds, CDN config, SSL certs for frontend. Undifferentiated ops work for a small team. |
| **All Vercel** | No Canadian-region managed PostgreSQL, no KMS, insufficient compliance certifications for PIPEDA/SOC2/ISO. |
| **Railway** | Good DX but limited Canadian region support, no KMS equivalent, no SOC 2 certification. |
| **Fly.io** | Excellent edge compute but immature managed PostgreSQL, no Canadian-specific compliance certifications, no KMS. |
| **DigitalOcean** | Toronto region available but managed database lacks PITR granularity, no KMS, limited compliance certifications. |
| **GCP (Google Cloud)** | Montreal region (northamerica-northeast1) available, but smaller Canadian partner ecosystem and less mature Canadian compliance posture than AWS. |
| **Azure** | Canada Central region available with strong compliance, but smaller Next.js/Node.js ecosystem, higher operational complexity for a small team. |

## Consequences

### Positive
- Full PIPEDA compliance with all data-bearing services in Canadian regions.
- RPO 1 hour / RTO 4 hours achieved through RDS PITR, multi-AZ failover, and Calgary cold standby.
- Per-property KMS encryption keys ensure cryptographic tenant isolation.
- Vercel preview deployments accelerate feedback cycles — every PR is reviewable as a live deployment.
- Canary rollouts with auto-rollback minimize blast radius of bad deployments.
- Cost scales with usage (Vercel functions + AWS on-demand) rather than fixed infrastructure reservations.

### Negative
- Split hosting adds operational complexity: two billing accounts, two monitoring dashboards, two deployment pipelines.
- Network latency between Vercel serverless functions and AWS RDS (within the same region) adds ~5-15ms per database call. Mitigated by connection pooling and Redis caching.
- Team must understand both Vercel's deployment model and AWS infrastructure management (VPC, security groups, IAM).
- Vercel vendor lock-in for frontend deployment. Mitigated by the fact that Next.js can be self-hosted on any Node.js server if needed.

### Risks
- Vercel pricing can spike unexpectedly with traffic surges (amenity booking rush, emergency broadcast pages). Mitigation: set Vercel spending limits and alerts, use ISR for cacheable pages.
- AWS ca-central-1 has fewer AZs than us-east-1; a regional outage could affect both primary and secondary. Mitigation: Calgary cold standby in ca-west-1 provides geographic diversity.
- Cross-provider networking (Vercel -> AWS) introduces a dependency on public internet between providers. Mitigation: AWS API Gateway with WAF provides a hardened entry point for Vercel serverless functions calling backend services.

## Related ADRs
- [ADR-001-framework.md](ADR-001-framework.md) — Next.js 15 App Router is the frontend deployed to Vercel
- [ADR-002-database.md](ADR-002-database.md) — PostgreSQL 16+ on AWS RDS is the database layer
- [ADR-007-testing.md](ADR-007-testing.md) — CI/CD pipeline runs against Vercel preview deployments
- [ADR-009-mobile-strategy.md](ADR-009-mobile-strategy.md) — Backend API extraction to standalone AWS service when React Native begins
