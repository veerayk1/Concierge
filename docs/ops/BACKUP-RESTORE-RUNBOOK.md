# Backup & Restore Runbook

## Status

**Not production-ready.** Two operational gaps below must close before
any customer onboards. The runbook below documents what we have and
what is missing.

---

## Launch blockers

### 1. No Prisma migration history

`prisma/migrations/` does not exist. The team has been using `prisma db push`
for every schema change, which mutates the database in place without
producing a versioned migration. Consequences:

- Restoring data into a freshly created Postgres instance requires the
  schema to be re-applied via `db push` against the running code at
  whatever commit was live when the backup was taken. There is no replay
  log.
- No rollback story. There is no way to migrate "down" to a known prior
  schema.
- `db:migrate` and `db:reset` in `package.json` would error today since
  no migration history exists.

**Action before launch:**

```bash
# Snapshot the current schema as the baseline migration.
pnpm prisma migrate dev --name baseline_pre_launch --create-only

# Review the generated SQL in prisma/migrations/<timestamp>_baseline_pre_launch/
# Apply against staging:
pnpm prisma migrate deploy

# Switch all production schema changes to `prisma migrate dev` going forward.
# Remove or alias `db:push` so no one runs it against production by accident.
```

### 2. UserAudit cascade on user delete

`prisma/schema.prisma` declares:

```prisma
model UserAudit {
  user User @relation("UserAuditTarget", fields: [userId], references: [id], onDelete: Cascade)
}
```

When a user is hard-deleted (GDPR right-to-erasure, account purge), every
audit row for that user — role changes, status changes, profile updates —
is destroyed by the cascade. SOC2 and PIPEDA both require audit retention
beyond the lifecycle of the audited subject.

**Action before launch:** change the FK to `onDelete: SetNull` and make
`UserAudit.userId` nullable, so the audit row survives with a null
`userId`. Same review needed for `LoginAudit`.

---

## Backup procedure

### What to back up

| Layer                     | Tool                                          | Frequency                       |
| ------------------------- | --------------------------------------------- | ------------------------------- |
| Postgres (full)           | `pg_dump --format=custom --no-owner --no-acl` | Hourly snapshot + daily archive |
| Postgres WAL              | Provider-managed (Supabase, Neon, RDS)        | Continuous                      |
| S3 buckets (uploads)      | Bucket versioning + cross-region replication  | Continuous                      |
| `.env.production` secrets | Vercel env export + offline encrypted copy    | On every rotation               |

### Postgres backup command

```bash
# Capture a full dump. Use --format=custom for parallel restore and
# selective table recovery later.
pg_dump \
  --format=custom \
  --no-owner --no-acl \
  --compress=9 \
  --file="concierge-$(date -u +%Y%m%dT%H%M%SZ).dump" \
  "$DATABASE_URL"

# Verify the dump is restorable before trusting it.
pg_restore --list "concierge-*.dump" | head
```

### Required automation

Any of these is acceptable as long as you can prove the next item works:

- Supabase / Neon / RDS automated daily snapshot + WAL retention >= 7
  days for PITR.
- A scheduled job (GitHub Actions, fly.io cron, or Postgres provider's
  scheduled dumps) that runs the `pg_dump` command above hourly and
  ships the dump to a separate cloud account / region.

**A backup that has never been restored is not a backup.** See the
restore drill below.

---

## Restore drill

Run this **before customer onboarding** and once per quarter thereafter.
Target: end-to-end restore in under 30 minutes.

### Drill steps

```bash
# 1. Provision a scratch Postgres instance. Use a different DATABASE_URL
#    than production; never restore into production.
export SCRATCH_DATABASE_URL="postgresql://scratch:..."

# 2. Apply the schema. After Launch Blocker #1 is fixed:
DATABASE_URL="$SCRATCH_DATABASE_URL" pnpm prisma migrate deploy

# Until #1 is fixed:
DATABASE_URL="$SCRATCH_DATABASE_URL" pnpm prisma db push

# 3. Restore the latest dump into the scratch DB.
pg_restore \
  --no-owner --no-acl \
  --jobs=4 \
  --dbname="$SCRATCH_DATABASE_URL" \
  --verbose \
  concierge-latest.dump

# 4. Run smoke checks against the restored data.
DATABASE_URL="$SCRATCH_DATABASE_URL" pnpm tsx scripts/restore-smoke.ts

# 5. Tear down the scratch instance.
```

### `scripts/restore-smoke.ts` (to be added)

The drill is only meaningful if step 4 catches missing or corrupt data.
At minimum the smoke script must assert:

- Every property has at least one user.
- Every resident has an active occupancy record (relevant after the
  occupancy seed fix in commit `481cd8c`; otherwise resident endpoints
  400 with NO_UNIT on restored data).
- No `bookings` with overlapping (amenityId, startDate, time-range) and
  status not in (cancelled, declined). Relevant after the concurrency
  fix in commit `0ec83f2`.
- No orphaned FKs — every FK column resolves to a row in its parent.

### Pass criteria

- pg_restore exits 0 with no warnings about missing roles or invalid
  data.
- All smoke assertions pass.
- Application boots against the scratch DB and admin login succeeds.

Document the drill date and pass/fail status in `docs/ops/DRILL-LOG.md`
(to be created on first run).

---

## Restore-safety checks already in code

These already protect the data layer and need no action:

| Concern                      | Protection                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| Double-booked amenity slot   | `pg_advisory_xact_lock` + INSERT…WHERE NOT EXISTS in `/api/v1/resident/bookings`            |
| Double-released package      | `prisma.updateMany({ where: { id, status: 'unreleased' } })` CAS in `/api/v1/packages/[id]` |
| Race on role permission edit | `/api/v1/roles/[id]` schema accepts the actual payload shape                                |

---

## What I cannot verify from this environment

Items below need production console access to confirm. Each is a launch
blocker if unverified.

1. **`DEMO_MODE_DISABLED=true` is set on the production Vercel
   deployment.** Without it the X-Demo-Role header bypass in
   `src/server/middleware/api-guard.ts` is active in production and any
   unauthenticated client can act as super_admin.
2. **PITR window** on the managed Postgres instance is at least 7 days.
3. **S3 bucket versioning + cross-region replication** are enabled and
   the IAM policy on the replicated bucket disallows delete.
4. **`pg_dump` automation actually runs.** Look for the most recent
   archived dump within the last 24 hours and confirm size > 0.
5. **Vercel env exports** are stored encrypted somewhere off-Vercel so a
   Vercel-account compromise doesn't wipe the only copy.
