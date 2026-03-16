import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Creates a tenant-scoped query helper.
 * Per SECURITY-RULEBOOK B.2.2 — all queries auto-scoped to tenant.
 *
 * Usage:
 *   const tenant = tenantScope(propertyId);
 *   const events = await prisma.event.findMany({ where: tenant.where() });
 *
 * In a future iteration, this will be replaced with Prisma Client Extensions
 * that automatically inject property_id into every query at the ORM level.
 */
export function tenantScope(propertyId: string) {
  return {
    /** Base where clause that enforces tenant isolation + soft delete filter */
    where(extra: Record<string, unknown> = {}) {
      return { propertyId, deletedAt: null, ...extra };
    },
    /** For create operations — auto-injects propertyId */
    data(extra: Record<string, unknown> = {}) {
      return { propertyId, ...extra };
    },
    propertyId,
  };
}

export default prisma;
