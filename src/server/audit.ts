/**
 * Concierge — Audit Logger
 *
 * Records who did what, when, and on which resource. Audit entries are
 * immutable once written — they are append-only for compliance with
 * PIPEDA, SOC 2, and ISO 27001 requirements.
 *
 * **Current implementation:** Writes structured log entries via pino.
 * **Future implementation:** Will write to a dedicated `audit_log` table
 * in PostgreSQL via Prisma, with optional forwarding to an external SIEM.
 */

import { createLogger, sanitizeLogData } from '@/server/logger';
import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The four canonical CRUD audit actions.
 */
export const AuditAction = {
  Read: 'READ',
  Create: 'CREATE',
  Update: 'UPDATE',
  Delete: 'DELETE',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * A single audit log entry.
 *
 * All fields except `fields`, `ip`, and `userAgent` are required.
 */
export interface AuditEntry {
  /** The user who performed the action (UUID). */
  userId: string;

  /** The property (tenant) context (UUID). */
  propertyId: string;

  /** What was done. */
  action: AuditActionType;

  /** The resource type (e.g. "event", "unit", "maintenance_request"). */
  resource: string;

  /** The specific resource ID (UUID). */
  resourceId: string;

  /** Optional list of field names that were read or modified. */
  fields?: string[];

  /** The client IP address (from x-forwarded-for or socket). */
  ip?: string;

  /** The client user-agent string. */
  userAgent?: string;

  /** Additional metadata (will be sanitised before logging). */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger('audit');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Write an audit log entry.
 *
 * The entry is sanitised to strip PII before being written. In the future,
 * this will also INSERT into the `audit_log` database table.
 *
 * @param entry - The audit entry to record.
 *
 * @example
 * ```ts
 * await logAudit({
 *   userId: token.sub,
 *   propertyId: token.pid,
 *   action: AuditAction.Update,
 *   resource: 'unit',
 *   resourceId: 'abc-123',
 *   fields: ['customFields', 'instructions'],
 *   ip: req.headers.get('x-forwarded-for') ?? undefined,
 *   userAgent: req.headers.get('user-agent') ?? undefined,
 * });
 * ```
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const sanitised = sanitizeLogData(entry);

  logger.info(
    {
      audit: true,
      ...((typeof sanitised === 'object' && sanitised !== null
        ? sanitised
        : { raw: sanitised }) as Record<string, unknown>),
      timestamp: new Date().toISOString(),
    },
    `AUDIT: ${entry.action} ${entry.resource}/${entry.resourceId} by ${entry.userId}`,
  );

  try {
    await prisma.auditEntry.create({
      data: {
        userId: entry.userId,
        propertyId: entry.propertyId,
        action: entry.action.toLowerCase(),
        resource: entry.resource,
        resourceId: entry.resourceId,
        fields: entry.fields ?? undefined,
        ipAddress: entry.ip ?? 'unknown',
        userAgent: entry.userAgent ?? undefined,
        piiAccessed: false,
      },
    });
  } catch (err) {
    logger.error(
      { err, userId: entry.userId, action: entry.action, resource: entry.resource },
      'Failed to persist audit entry to database',
    );
  }
}
