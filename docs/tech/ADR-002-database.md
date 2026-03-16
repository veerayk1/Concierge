# ADR-002: PostgreSQL 16+ with Prisma ORM

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

Concierge manages structured relational data (units, residents, events, maintenance requests,
amenity bookings) alongside semi-structured data (custom fields per property, event metadata,
form builder responses). The database must support:

- **JSONB columns** for custom fields that vary per property without schema migrations. The
  unified event model stores configurable event type metadata, unit files have property-specific
  custom fields, and maintenance categories are per-property.
- **Full-text search** for v1 global search across events, units, residents, announcements,
  and maintenance requests without deploying a separate search service.
- **Point-in-time recovery (PITR)** for compliance with PIPEDA, SOC 2, and ISO 27001.
  Data loss is unacceptable; the system must recover to any second within the retention window.
- **Multi-tenant data isolation** via row-level security (RLS) or application-level tenant
  scoping to ensure Property A never sees Property B's data.
- **Strong referential integrity** across 30+ tables with foreign keys, cascading deletes,
  and constraint validation at the database level.
- **Type-safe query building** in TypeScript to prevent SQL injection and catch schema
  mismatches at compile time rather than runtime.
- **Data residency in Canada** (ca-central-1) for PIPEDA compliance. All resident PII,
  unit data, and communication logs must remain in Canadian infrastructure.

The schema includes approximately 35-40 tables for v1 (events, event_types, event_groups,
units, residents, users, roles, permissions, maintenance_requests, maintenance_categories,
amenities, reservations, announcements, documents, fobs, vehicles, pets, parking_permits,
shift_logs, notifications, audit_logs, properties, buildings, floors, etc.).

## Decision

Use **PostgreSQL 16+** as the primary database, hosted on **AWS RDS in ca-central-1**,
with **Prisma ORM 6.x** as the TypeScript query layer.

Specifically:
- **PostgreSQL 16** for JSONB operators, full-text search with `tsvector`/`tsquery`,
  row-level security policies, partitioning for audit logs, and logical replication.
- **Prisma ORM** for schema management (`prisma migrate`), type-safe queries, relation
  loading, and migration version control.
- **Prisma Client extensions** for automatic tenant scoping (inject `property_id` filter
  on every query via middleware).
- **Raw SQL via `$queryRaw`** for complex reporting queries, full-text search with ranking,
  and performance-critical paths where Prisma's generated SQL is suboptimal.
- **JSONB columns** on `events.custom_fields`, `units.custom_fields`,
  `maintenance_requests.metadata`, and `form_responses.data`.
- **GIN indexes** on all JSONB columns and `tsvector` columns for search performance.
- **Table partitioning** on `audit_logs` (by month) and `events` (by property_id) for
  query performance at scale.
- **Connection pooling** via PgBouncer in transaction mode, with Prisma configured for
  external connection pooling.

## Rationale

1. **JSONB is a first-class citizen in PostgreSQL**: Properties can define custom fields
   (e.g., "Pet weight limit", "Move-in deposit amount") without schema migrations. JSONB
   with GIN indexes provides indexed queries on arbitrary keys, which MongoDB offers but
   with weaker transactional guarantees.

2. **Built-in full-text search eliminates a dependency**: For v1, `tsvector` with `ts_rank`
   provides good-enough global search across events, units, and residents. This avoids
   deploying and maintaining Elasticsearch or Meilisearch. Can migrate to a dedicated search
   service in v2 if needed.

3. **PITR on RDS satisfies compliance**: AWS RDS automated backups with PITR to any second
   within a 35-day window, encrypted at rest with AES-256, satisfies PIPEDA, SOC 2, and
   ISO 27001 backup and recovery requirements.

4. **Row-level security for tenant isolation**: PostgreSQL RLS policies can enforce
   `property_id` filtering at the database level as a defense-in-depth layer behind
   application-level scoping. Even a bug in Prisma middleware cannot leak cross-tenant data.

5. **Prisma provides type safety without raw SQL risk**: Schema changes generate TypeScript
   types automatically. Queries are validated at compile time. Relation loading is explicit
   (no lazy loading surprises). Migration history is version-controlled.

6. **ca-central-1 availability**: AWS RDS PostgreSQL is fully available in the Montreal
   region with Multi-AZ deployment for high availability.

## Alternatives Considered

### MySQL 8
- **Pros**: Widely used, good performance, JSON support.
- **Rejected because**: JSON support is less mature than PostgreSQL JSONB (no GIN indexes
  on JSON, fewer operators). No native full-text search with ranking comparable to `tsvector`.
  No row-level security. Prisma supports both, but PostgreSQL-specific features are critical.

### MongoDB
- **Pros**: Native JSON documents, flexible schema, good for event-style data.
- **Rejected because**: Weak transactional guarantees across collections (multi-document
  transactions are slower and more limited). No foreign key constraints. The data model is
  fundamentally relational (units have residents have events have comments). Prisma's MongoDB
  support is less mature than PostgreSQL. Harder to enforce referential integrity.

### Supabase (managed PostgreSQL + auth + realtime)
- **Pros**: PostgreSQL under the hood, built-in auth, realtime subscriptions, row-level
  security via their dashboard.
- **Rejected because**: Auth is handled by our custom JWT system (ADR-003). Realtime is
  handled by Socket.io (ADR-004). Using Supabase only for the database adds a vendor
  dependency without using its differentiating features. Direct RDS gives more control over
  configuration, backups, and compliance documentation.

### Raw SQL with pg driver (node-postgres)
- **Pros**: Maximum performance, no ORM overhead, full SQL control.
- **Rejected because**: No type safety without extensive manual typing. Migration management
  requires a separate tool (knex, node-pg-migrate). Vulnerable to SQL injection without
  disciplined parameterization. Development velocity is significantly slower for CRUD-heavy
  modules (of which there are 20+).

### Drizzle ORM
- **Pros**: Lighter weight than Prisma, SQL-like syntax, better raw query support.
- **Rejected because**: Smaller ecosystem, fewer community resources, less mature migration
  tooling. Prisma's introspection, studio, and migration system are more battle-tested for
  a 35+ table schema. Drizzle is a viable backup if Prisma performance becomes a bottleneck.

### TypeORM
- **Pros**: Decorator-based, active record pattern, mature.
- **Rejected because**: TypeScript type inference is weaker than Prisma. Known issues with
  complex relation queries. Migration system is less reliable. Community momentum has shifted
  to Prisma and Drizzle.

## Consequences

### Positive
- JSONB custom fields enable per-property configuration without migrations.
- Full-text search in v1 without deploying a separate search service.
- PITR and encrypted backups satisfy 8 compliance frameworks out of the box.
- Row-level security provides defense-in-depth for tenant isolation.
- Type-safe queries catch schema mismatches at compile time.
- All data resides in Canada (ca-central-1) for PIPEDA.

### Negative
- PostgreSQL-specific features (JSONB operators, `tsvector`, RLS) create database lock-in.
  Migrating to MySQL or another database would require rewriting search and custom field logic.
- Prisma adds a query translation layer that may generate suboptimal SQL for complex reports.
  Mitigated by using `$queryRaw` for performance-critical queries.
- Prisma Client generates a large query engine binary (~15MB). Mitigated by using Prisma's
  engine-less mode (available in recent versions) for serverless contexts.

### Risks
- **JSONB schema drift**: Without validation, custom fields can accumulate inconsistent data
  over time. Mitigated by validating JSONB writes against a JSON Schema stored per event type
  in application code.
- **Full-text search scaling**: PostgreSQL FTS may not scale to millions of events with
  sub-100ms response times. Mitigated by monitoring query performance and planning
  Elasticsearch migration for v2 if needed.
- **Prisma version churn**: Prisma releases frequently with occasional breaking changes.
  Mitigated by pinning versions and upgrading quarterly with full test suite validation.

## Related ADRs
- ADR-001: Framework (Prisma integrates with Next.js API routes and Server Actions)
- ADR-003: Auth (user and session tables in PostgreSQL, audit log partitioned by month)
- ADR-005: AI Gateway (query logs and cost metering stored in PostgreSQL)
