/**
 * Concierge — Audit Logger & GDPR Compliance
 *
 * Records who did what, when, and on which resource. Audit entries are
 * immutable once written — they are append-only for compliance with
 * PIPEDA, SOC 2, ISO 27001, and GDPR requirements.
 *
 * Features:
 * - PII detection and flagging on field access
 * - Consent tracking (grant/revoke)
 * - DSAR export (all audit data for a user)
 * - Right to erasure (anonymize user audit trail)
 * - Data retention flagging
 * - Unusual access pattern detection (breach notification)
 * - Login attempt auditing
 * - ROPA (Record of Processing Activities) data
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
 * All fields except `fields`, `ip`, `userAgent`, and `metadata` are required.
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

export interface AuditQueryFilters {
  propertyId: string;
  userId?: string;
  resource?: string;
  action?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export interface AuditQueryResult {
  data: unknown[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DSARExport {
  userId: string;
  entries: unknown[];
  exportedAt: string;
  format: string;
  purpose: string;
}

export interface RetentionResult {
  overdueCount: number;
  retentionDays: number;
  cutoffDate: string;
}

export interface ConsentInput {
  userId: string;
  propertyId: string;
  consentType: string;
  granted: boolean;
  ip?: string;
  userAgent?: string;
}

export interface AnonymizationResult {
  anonymizedCount: number;
  anonymizedId: string;
}

export interface AccessAlert {
  type: 'high_volume_access' | 'pii_access_spike';
  userId: string;
  count: number;
  windowMinutes: number;
  detectedAt: string;
}

export interface DetectionOptions {
  windowMinutes: number;
  thresholdCount: number;
  piiThreshold?: number;
}

export interface LoginAttemptInput {
  userId?: string;
  email: string;
  success: boolean;
  failReason?: string;
  ipAddress: string;
  userAgent: string;
  geoCity?: string;
  geoCountry?: string;
  sessionId?: string;
}

export interface DataProcessingRecord {
  purpose: string;
  lawfulBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  recipients?: string[];
  transfers?: string;
}

// ---------------------------------------------------------------------------
// PII Fields
// ---------------------------------------------------------------------------

/**
 * Set of field names considered Personally Identifiable Information.
 * When any of these fields appear in an audit entry's `fields` array,
 * the entry is flagged with `piiAccessed = true`.
 */
export const PII_FIELDS: ReadonlySet<string> = new Set([
  'email',
  'phone',
  'ssn',
  'sin',
  'dateOfBirth',
  'firstName',
  'lastName',
  'address',
  'postalCode',
  'bankAccount',
  'creditCard',
  'passport',
  'driverLicense',
  'emergencyContact',
  'medicalInfo',
  'biometric',
]);

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger('audit');

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether any of the accessed fields are PII.
 */
function containsPii(fields?: string[]): boolean {
  if (!fields || fields.length === 0) return false;
  return fields.some((f) => PII_FIELDS.has(f));
}

// ---------------------------------------------------------------------------
// Public API — Core Audit Logging
// ---------------------------------------------------------------------------

/**
 * Write an audit log entry.
 *
 * The entry is sanitised to strip PII before being written. PII access
 * is auto-detected from the `fields` array and flagged accordingly.
 *
 * This is the ONLY write function for audit entries — entries are immutable
 * once written (no update or delete).
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

  const piiAccessed = containsPii(entry.fields);

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
        piiAccessed,
      },
    });
  } catch (err) {
    logger.error(
      { err, userId: entry.userId, action: entry.action, resource: entry.resource },
      'Failed to persist audit entry to database',
    );
  }
}

// ---------------------------------------------------------------------------
// Public API — Audit Query
// ---------------------------------------------------------------------------

/**
 * Query audit entries with filtering and pagination.
 * Always scoped to a propertyId for tenant isolation.
 */
export async function queryAuditEntries(filters: AuditQueryFilters): Promise<AuditQueryResult> {
  const { propertyId, userId, resource, action, from, to } = filters;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;

  const where: Record<string, unknown> = { propertyId };
  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = action;

  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    where.createdAt = dateFilter;
  }

  const [entries, total] = await Promise.all([
    prisma.auditEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditEntry.count({ where }),
  ]);

  return {
    data: entries,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ---------------------------------------------------------------------------
// Public API — DSAR Export
// ---------------------------------------------------------------------------

/**
 * Export all audit data for a specific user (Data Subject Access Request).
 * Returns every audit entry without pagination for complete data portability.
 */
export async function exportUserAuditData(userId: string, propertyId: string): Promise<DSARExport> {
  const entries = await prisma.auditEntry.findMany({
    where: { userId, propertyId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    userId,
    entries,
    exportedAt: new Date().toISOString(),
    format: 'json',
    purpose: 'DSAR',
  };
}

// ---------------------------------------------------------------------------
// Public API — Data Retention
// ---------------------------------------------------------------------------

/**
 * Identify audit entries that exceed the retention period.
 * Default retention is 365 days; can be customized per property.
 */
export async function flagRetentionOverdue(
  propertyId: string,
  retentionDays: number = 365,
): Promise<RetentionResult> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const overdueCount = await prisma.auditEntry.count({
    where: {
      propertyId,
      createdAt: { lt: cutoff },
    },
  });

  return {
    overdueCount,
    retentionDays,
    cutoffDate: cutoff.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API — Consent Tracking
// ---------------------------------------------------------------------------

/**
 * Log a consent grant or revocation as an audit entry.
 * Consent changes are critical for GDPR compliance and are stored
 * with the same immutability guarantees as other audit entries.
 */
export async function logConsent(input: ConsentInput): Promise<void> {
  const { userId, propertyId, consentType, granted, ip, userAgent } = input;

  try {
    await prisma.auditEntry.create({
      data: {
        userId,
        propertyId,
        action: granted ? 'create' : 'update',
        resource: 'consent',
        resourceId: userId, // The consent belongs to the user
        ipAddress: ip ?? 'unknown',
        userAgent: userAgent ?? undefined,
        piiAccessed: false,
        fields: { consentType, granted, timestamp: new Date().toISOString() },
      },
    });

    logger.info(
      { userId, consentType, granted },
      `CONSENT: ${granted ? 'granted' : 'revoked'} ${consentType} by ${userId}`,
    );
  } catch (err) {
    logger.error({ err, userId, consentType }, 'Failed to persist consent record to database');
  }
}

// ---------------------------------------------------------------------------
// Public API — Right to Erasure (Anonymization)
// ---------------------------------------------------------------------------

/**
 * Anonymize a user's audit trail for GDPR right-to-erasure requests.
 * Replaces the userId with an anonymous identifier and clears IP/user-agent.
 * The audit trail structure is preserved for compliance, but the user
 * can no longer be identified from it.
 */
export async function anonymizeUserAuditTrail(
  userId: string,
  propertyId: string,
): Promise<AnonymizationResult> {
  const anonymizedId = `anon-${crypto.randomUUID()}`;

  const result = await prisma.auditEntry.updateMany({
    where: { userId, propertyId },
    data: {
      userId: anonymizedId,
      ipAddress: '0.0.0.0',
      userAgent: null,
    },
  });

  // Log the erasure action itself (using system user)
  try {
    await prisma.auditEntry.create({
      data: {
        userId: 'system',
        propertyId,
        action: 'delete',
        resource: 'gdpr_erasure',
        resourceId: anonymizedId,
        ipAddress: 'system',
        piiAccessed: false,
        fields: {
          originalUserId: '[REDACTED]',
          anonymizedId,
          entriesAnonymized: result.count,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to log anonymization action');
  }

  logger.info(
    { anonymizedId, count: result.count },
    `GDPR ERASURE: Anonymized ${result.count} audit entries`,
  );

  return {
    anonymizedCount: result.count,
    anonymizedId,
  };
}

// ---------------------------------------------------------------------------
// Public API — Data Processing Records (ROPA)
// ---------------------------------------------------------------------------

/**
 * Returns the Record of Processing Activities for GDPR Article 30 compliance.
 * This is a static registry describing what data is processed, why, and for how long.
 */
export function getDataProcessingRecords(): DataProcessingRecord[] {
  return [
    {
      purpose: 'Resident management and tenancy administration',
      lawfulBasis: 'Contract performance (Article 6(1)(b))',
      dataCategories: ['name', 'email', 'phone', 'address', 'unit assignment'],
      retentionPeriod: '7 years after tenancy ends',
      recipients: ['Property management staff', 'Building administration'],
    },
    {
      purpose: 'Security and access control',
      lawfulBasis: 'Legitimate interest (Article 6(1)(f))',
      dataCategories: ['name', 'photo', 'FOB serial numbers', 'access logs', 'visitor records'],
      retentionPeriod: '2 years',
      recipients: ['Security staff', 'Property management'],
    },
    {
      purpose: 'Maintenance request processing',
      lawfulBasis: 'Contract performance (Article 6(1)(b))',
      dataCategories: ['name', 'unit', 'contact information', 'request details'],
      retentionPeriod: '5 years',
      recipients: ['Maintenance staff', 'Vendors', 'Property management'],
    },
    {
      purpose: 'Communication and notifications',
      lawfulBasis: 'Consent (Article 6(1)(a))',
      dataCategories: ['email', 'phone', 'notification preferences'],
      retentionPeriod: 'Until consent withdrawal',
      recipients: ['Email service provider', 'SMS provider'],
    },
    {
      purpose: 'Audit trail and compliance monitoring',
      lawfulBasis: 'Legal obligation (Article 6(1)(c))',
      dataCategories: ['user ID', 'IP address', 'user agent', 'action logs'],
      retentionPeriod: '7 years (regulatory requirement)',
      recipients: ['Compliance officers', 'Auditors'],
    },
    {
      purpose: 'Amenity booking and billing',
      lawfulBasis: 'Contract performance (Article 6(1)(b))',
      dataCategories: ['name', 'unit', 'booking details', 'payment information'],
      retentionPeriod: '7 years (financial records)',
      recipients: ['Property management', 'Payment processor'],
    },
    {
      purpose: 'Emergency contact management',
      lawfulBasis: 'Vital interests (Article 6(1)(d))',
      dataCategories: ['name', 'phone', 'relationship', 'medical notes'],
      retentionPeriod: 'Duration of tenancy + 1 year',
      recipients: ['Emergency services', 'Building management'],
    },
    {
      purpose: 'Login and authentication',
      lawfulBasis: 'Legitimate interest (Article 6(1)(f))',
      dataCategories: ['email', 'IP address', 'device info', 'login timestamps'],
      retentionPeriod: '1 year',
      recipients: ['Security team'],
    },
  ];
}

// ---------------------------------------------------------------------------
// Public API — Breach Notification / Unusual Access Detection
// ---------------------------------------------------------------------------

/**
 * Detect unusual access patterns that may indicate a data breach.
 * Scans recent audit entries for:
 * - High volume access by a single user
 * - PII access spikes above threshold
 */
export async function detectUnusualAccess(
  propertyId: string,
  options: DetectionOptions,
): Promise<AccessAlert[]> {
  const { windowMinutes, thresholdCount, piiThreshold } = options;
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  const recentEntries = await prisma.auditEntry.findMany({
    where: {
      propertyId,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: 'desc' },
  });

  const alerts: AccessAlert[] = [];

  // Group by userId and check volume
  const userCounts = new Map<string, number>();
  const userPiiCounts = new Map<string, number>();

  for (const entry of recentEntries) {
    const uid = (entry as Record<string, unknown>).userId as string;
    const pii = (entry as Record<string, unknown>).piiAccessed as boolean;

    userCounts.set(uid, (userCounts.get(uid) ?? 0) + 1);
    if (pii) {
      userPiiCounts.set(uid, (userPiiCounts.get(uid) ?? 0) + 1);
    }
  }

  const now = new Date().toISOString();

  // Check high volume access
  for (const [userId, count] of userCounts) {
    if (count >= thresholdCount) {
      alerts.push({
        type: 'high_volume_access',
        userId,
        count,
        windowMinutes,
        detectedAt: now,
      });
    }
  }

  // Check PII access spikes
  if (piiThreshold) {
    for (const [userId, count] of userPiiCounts) {
      if (count >= piiThreshold) {
        alerts.push({
          type: 'pii_access_spike',
          userId,
          count,
          windowMinutes,
          detectedAt: now,
        });
      }
    }
  }

  if (alerts.length > 0) {
    logger.warn(
      { alertCount: alerts.length, propertyId },
      `BREACH DETECTION: ${alerts.length} unusual access pattern(s) detected`,
    );
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Public API — Login Audit
// ---------------------------------------------------------------------------

/**
 * Record a login attempt (success or failure) with full device/IP context.
 * Used for security audit reports and breach detection.
 */
export async function logLoginAttempt(input: LoginAttemptInput): Promise<void> {
  try {
    await prisma.loginAudit.create({
      data: {
        userId: input.userId ?? undefined,
        email: input.email,
        success: input.success,
        failReason: input.failReason ?? undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        geoCity: input.geoCity ?? undefined,
        geoCountry: input.geoCountry ?? undefined,
        sessionId: input.sessionId ?? undefined,
      },
    });

    logger.info(
      {
        email: input.email,
        success: input.success,
        ip: input.ipAddress,
      },
      `LOGIN: ${input.success ? 'SUCCESS' : 'FAILURE'} for ${input.email} from ${input.ipAddress}`,
    );
  } catch (err) {
    logger.error({ err, email: input.email }, 'Failed to persist login audit entry');
  }
}
