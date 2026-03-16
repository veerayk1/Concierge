import { PrismaClient } from '@prisma/client';

const globalForAuditPrisma = globalThis as unknown as {
  auditPrisma: PrismaClient | undefined;
};

/**
 * Separate Prisma client for audit writes.
 * In production, this should connect using a DB user with INSERT-only permissions.
 * Per SECURITY-RULEBOOK J.3, G.3.2
 */
export const auditPrisma =
  globalForAuditPrisma.auditPrisma ??
  new PrismaClient({
    datasourceUrl: process.env['DATABASE_AUDIT_URL'] || process.env['DATABASE_URL'],
    log: ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForAuditPrisma.auditPrisma = auditPrisma;
}

export default auditPrisma;
