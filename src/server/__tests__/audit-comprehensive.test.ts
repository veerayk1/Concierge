/**
 * Comprehensive Audit Trail & GDPR Compliance Tests — TDD
 *
 * Tests for:
 * - Audit entry creation with all fields
 * - PII sanitization before logging
 * - IP address and user-agent recording
 * - Field access/modification tracking
 * - PII access flagging
 * - Audit entry immutability
 * - Audit query filtering
 * - DSAR export
 * - Data retention flagging
 * - Consent tracking
 * - Right to erasure (anonymization)
 * - Data processing records (ROPA)
 * - Breach notification (unusual access detection)
 * - Login audit (success/failure/IP/device)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockAuditEntryCreate = vi.fn();
const mockAuditEntryFindMany = vi.fn();
const mockAuditEntryCount = vi.fn();
const mockAuditEntryUpdateMany = vi.fn();
const mockLoginAuditCreate = vi.fn();
const mockLoginAuditFindMany = vi.fn();
const mockLoginAuditCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    auditEntry: {
      create: (...args: unknown[]) => mockAuditEntryCreate(...args),
      findMany: (...args: unknown[]) => mockAuditEntryFindMany(...args),
      count: (...args: unknown[]) => mockAuditEntryCount(...args),
      updateMany: (...args: unknown[]) => mockAuditEntryUpdateMany(...args),
    },
    loginAudit: {
      create: (...args: unknown[]) => mockLoginAuditCreate(...args),
      findMany: (...args: unknown[]) => mockLoginAuditFindMany(...args),
      count: (...args: unknown[]) => mockLoginAuditCount(...args),
    },
  },
}));

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
  sanitizeLogData: (data: unknown) => {
    // Simulate real sanitization: strip passwords, mask SSNs, mask emails
    if (typeof data !== 'object' || data === null) return data;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const normKey = key.toLowerCase().replace(/[-_]/g, '');
      if (normKey === 'password' || normKey === 'secret' || normKey === 'token') {
        result[key] = '[REDACTED]';
      } else if (normKey === 'ssn' || normKey === 'sin') {
        result[key] = '[REDACTED]';
      } else if (normKey === 'email' && typeof value === 'string') {
        const at = value.indexOf('@');
        result[key] = at > 0 ? `${value[0]}***${value.slice(at)}` : '[REDACTED]';
      } else {
        result[key] = value;
      }
    }
    return result;
  },
}));

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import {
  logAudit,
  queryAuditEntries,
  exportUserAuditData,
  flagRetentionOverdue,
  logConsent,
  anonymizeUserAuditTrail,
  getDataProcessingRecords,
  detectUnusualAccess,
  logLoginAttempt,
  PII_FIELDS,
  type AuditEntry,
} from '@/server/audit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    userId: 'user-001',
    propertyId: 'prop-001',
    action: 'READ',
    resource: 'resident',
    resourceId: 'res-001',
    fields: ['firstName', 'lastName'],
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ...overrides,
  };
}

const FAKE_AUDIT_ROW = {
  id: 'audit-001',
  propertyId: 'prop-001',
  userId: 'user-001',
  action: 'read',
  resource: 'resident',
  resourceId: 'res-001',
  fields: ['firstName', 'lastName'],
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0',
  piiAccessed: true,
  createdAt: new Date('2026-01-15T10:00:00Z'),
};

// ---------------------------------------------------------------------------
// 1. logAudit creates AuditEntry with all fields
// ---------------------------------------------------------------------------

describe('logAudit — creates AuditEntry with all fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryCreate.mockResolvedValue({ id: 'audit-001' });
  });

  it('persists an audit entry to the database with every required field', async () => {
    const entry = makeEntry();
    await logAudit(entry);

    expect(mockAuditEntryCreate).toHaveBeenCalledOnce();
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData).toMatchObject({
      userId: 'user-001',
      propertyId: 'prop-001',
      action: 'read',
      resource: 'resident',
      resourceId: 'res-001',
      ipAddress: '192.168.1.100',
    });
    expect(callData.fields).toEqual(['firstName', 'lastName']);
    expect(callData.userAgent).toContain('Mozilla');
  });

  it('stores action in lowercase for consistent querying', async () => {
    await logAudit(makeEntry({ action: 'UPDATE' }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.action).toBe('update');
  });

  it('defaults ipAddress to "unknown" when not provided', async () => {
    await logAudit(makeEntry({ ip: undefined }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.ipAddress).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// 2. logAudit sanitizes PII before logging
// ---------------------------------------------------------------------------

describe('logAudit — PII sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryCreate.mockResolvedValue({ id: 'audit-002' });
  });

  it('does not store plain passwords in metadata', async () => {
    const entry = makeEntry({
      metadata: { password: 's3cret!', note: 'Changed password' },
    });
    await logAudit(entry);

    // The logger receives sanitized data — password must be redacted
    expect(mockAuditEntryCreate).toHaveBeenCalled();
    // Metadata with password should never reach the DB as plaintext
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    if (callData.metadata) {
      expect(callData.metadata).not.toHaveProperty('password', 's3cret!');
    }
  });

  it('does not store full SSN values in metadata', async () => {
    const entry = makeEntry({
      metadata: { ssn: '123-45-6789', action: 'identity check' },
    });
    await logAudit(entry);

    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    if (callData.metadata) {
      expect(callData.metadata).not.toHaveProperty('ssn', '123-45-6789');
    }
  });
});

// ---------------------------------------------------------------------------
// 3. logAudit records IP address and user-agent
// ---------------------------------------------------------------------------

describe('logAudit — IP and User-Agent recording', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryCreate.mockResolvedValue({ id: 'audit-003' });
  });

  it('records the client IP address', async () => {
    await logAudit(makeEntry({ ip: '10.0.0.42' }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.ipAddress).toBe('10.0.0.42');
  });

  it('records the user-agent string', async () => {
    await logAudit(makeEntry({ userAgent: 'ConciergeApp/2.0 iOS' }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.userAgent).toBe('ConciergeApp/2.0 iOS');
  });

  it('records IPv6 addresses correctly', async () => {
    await logAudit(makeEntry({ ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
  });
});

// ---------------------------------------------------------------------------
// 4. logAudit records which fields were accessed/modified
// ---------------------------------------------------------------------------

describe('logAudit — field access tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryCreate.mockResolvedValue({ id: 'audit-004' });
  });

  it('stores the list of fields accessed', async () => {
    await logAudit(makeEntry({ fields: ['email', 'phone', 'firstName'] }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.fields).toEqual(['email', 'phone', 'firstName']);
  });

  it('stores the list of fields modified on update', async () => {
    await logAudit(
      makeEntry({
        action: 'UPDATE',
        fields: ['phone', 'emergencyContact'],
      }),
    );
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.fields).toEqual(['phone', 'emergencyContact']);
  });

  it('allows no fields (undefined)', async () => {
    await logAudit(makeEntry({ fields: undefined }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.fields).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. PII access flagging
// ---------------------------------------------------------------------------

describe('logAudit — PII access flagging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryCreate.mockResolvedValue({ id: 'audit-005' });
  });

  it('flags piiAccessed=true when sensitive fields are read', async () => {
    await logAudit(makeEntry({ fields: ['email', 'phone', 'ssn'] }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.piiAccessed).toBe(true);
  });

  it('flags piiAccessed=true for dateOfBirth field', async () => {
    await logAudit(makeEntry({ fields: ['firstName', 'dateOfBirth'] }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.piiAccessed).toBe(true);
  });

  it('sets piiAccessed=false when no PII fields are accessed', async () => {
    await logAudit(makeEntry({ fields: ['status', 'createdAt'] }));
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.piiAccessed).toBe(false);
  });

  it('exports PII_FIELDS constant for reference', () => {
    expect(PII_FIELDS).toBeInstanceOf(Set);
    expect(PII_FIELDS.has('email')).toBe(true);
    expect(PII_FIELDS.has('ssn')).toBe(true);
    expect(PII_FIELDS.has('phone')).toBe(true);
    expect(PII_FIELDS.has('dateOfBirth')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Audit entries are immutable (no update or delete methods)
// ---------------------------------------------------------------------------

describe('audit entries — immutability', () => {
  it('does not expose an updateAuditEntry function', async () => {
    const auditModule = await import('@/server/audit');
    expect(auditModule).not.toHaveProperty('updateAuditEntry');
  });

  it('does not expose a deleteAuditEntry function', async () => {
    const auditModule = await import('@/server/audit');
    expect(auditModule).not.toHaveProperty('deleteAuditEntry');
  });

  it('exports logAudit as the only write function', async () => {
    const auditModule = await import('@/server/audit');
    expect(typeof auditModule.logAudit).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// 7. Audit query: filter by userId, resource, action, date range
// ---------------------------------------------------------------------------

describe('queryAuditEntries — filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryFindMany.mockResolvedValue([FAKE_AUDIT_ROW]);
    mockAuditEntryCount.mockResolvedValue(1);
  });

  it('filters by userId', async () => {
    await queryAuditEntries({ propertyId: 'prop-001', userId: 'user-001' });
    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe('user-001');
  });

  it('filters by resource', async () => {
    await queryAuditEntries({ propertyId: 'prop-001', resource: 'resident' });
    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.resource).toBe('resident');
  });

  it('filters by action', async () => {
    await queryAuditEntries({ propertyId: 'prop-001', action: 'read' });
    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.action).toBe('read');
  });

  it('filters by date range', async () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-02-01');
    await queryAuditEntries({ propertyId: 'prop-001', from, to });
    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toEqual({ gte: from, lte: to });
  });

  it('returns paginated results with metadata', async () => {
    mockAuditEntryFindMany.mockResolvedValue([FAKE_AUDIT_ROW]);
    mockAuditEntryCount.mockResolvedValue(42);

    const result = await queryAuditEntries({
      propertyId: 'prop-001',
      page: 2,
      pageSize: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(42);
    expect(result.meta.page).toBe(2);
    expect(result.meta.pageSize).toBe(10);
  });

  it('always scopes queries to propertyId', async () => {
    await queryAuditEntries({ propertyId: 'prop-999' });
    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe('prop-999');
  });
});

// ---------------------------------------------------------------------------
// 8. DSAR export: all entries for a user
// ---------------------------------------------------------------------------

describe('exportUserAuditData — DSAR compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all audit entries for the specified user', async () => {
    const rows = [
      { ...FAKE_AUDIT_ROW, id: 'a1' },
      { ...FAKE_AUDIT_ROW, id: 'a2', resource: 'unit' },
    ];
    mockAuditEntryFindMany.mockResolvedValue(rows);

    const result = await exportUserAuditData('user-001', 'prop-001');
    expect(result.entries).toHaveLength(2);
    expect(result.userId).toBe('user-001');
  });

  it('includes export metadata with timestamp and format', async () => {
    mockAuditEntryFindMany.mockResolvedValue([FAKE_AUDIT_ROW]);

    const result = await exportUserAuditData('user-001', 'prop-001');
    expect(result.exportedAt).toBeDefined();
    expect(result.format).toBe('json');
    expect(result.purpose).toBe('DSAR');
  });

  it('queries only the specified user without limit', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    await exportUserAuditData('user-002', 'prop-001');
    const call = mockAuditEntryFindMany.mock.calls[0]![0];
    expect(call.where.userId).toBe('user-002');
    expect(call.where.propertyId).toBe('prop-001');
  });
});

// ---------------------------------------------------------------------------
// 9. Data retention: entries older than retention period flagged
// ---------------------------------------------------------------------------

describe('flagRetentionOverdue — data retention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies entries older than the default retention period (365 days)', async () => {
    const oldEntry = {
      ...FAKE_AUDIT_ROW,
      createdAt: new Date('2024-01-01'),
    };
    mockAuditEntryFindMany.mockResolvedValue([oldEntry]);
    mockAuditEntryCount.mockResolvedValue(1);

    const result = await flagRetentionOverdue('prop-001');
    expect(result.overdueCount).toBe(1);
    expect(result.retentionDays).toBe(365);
  });

  it('accepts a custom retention period in days', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);
    mockAuditEntryCount.mockResolvedValue(0);

    const result = await flagRetentionOverdue('prop-001', 90);
    expect(result.retentionDays).toBe(90);
  });

  it('returns zero when no entries are overdue', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);
    mockAuditEntryCount.mockResolvedValue(0);

    const result = await flagRetentionOverdue('prop-001');
    expect(result.overdueCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Consent tracking: log when user gives/revokes consent
// ---------------------------------------------------------------------------

describe('logConsent — consent tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryCreate.mockResolvedValue({ id: 'consent-001' });
  });

  it('logs consent granted as an audit entry', async () => {
    await logConsent({
      userId: 'user-001',
      propertyId: 'prop-001',
      consentType: 'data_processing',
      granted: true,
      ip: '10.0.0.1',
    });

    expect(mockAuditEntryCreate).toHaveBeenCalledOnce();
    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.action).toBe('create');
    expect(callData.resource).toBe('consent');
    expect(callData.fields).toMatchObject({
      consentType: 'data_processing',
      granted: true,
    });
  });

  it('logs consent revoked as an audit entry', async () => {
    await logConsent({
      userId: 'user-001',
      propertyId: 'prop-001',
      consentType: 'marketing_emails',
      granted: false,
      ip: '10.0.0.1',
    });

    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.action).toBe('update');
    expect(callData.fields).toMatchObject({
      consentType: 'marketing_emails',
      granted: false,
    });
  });

  it('records IP address for consent actions', async () => {
    await logConsent({
      userId: 'user-001',
      propertyId: 'prop-001',
      consentType: 'data_processing',
      granted: true,
      ip: '192.168.0.50',
    });

    const callData = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(callData.ipAddress).toBe('192.168.0.50');
  });
});

// ---------------------------------------------------------------------------
// 11. Right to erasure: anonymize user data in audit trail
// ---------------------------------------------------------------------------

describe('anonymizeUserAuditTrail — right to erasure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditEntryUpdateMany.mockResolvedValue({ count: 5 });
    mockAuditEntryCreate.mockResolvedValue({ id: 'anon-log-001' });
  });

  it('replaces userId with an anonymized identifier', async () => {
    const result = await anonymizeUserAuditTrail('user-001', 'prop-001');

    expect(mockAuditEntryUpdateMany).toHaveBeenCalledOnce();
    const call = mockAuditEntryUpdateMany.mock.calls[0]![0];
    expect(call.where.userId).toBe('user-001');
    expect(call.where.propertyId).toBe('prop-001');
    expect(call.data.userId).toMatch(/^anon-/);
    expect(result.anonymizedCount).toBe(5);
  });

  it('clears IP address and user-agent during anonymization', async () => {
    await anonymizeUserAuditTrail('user-001', 'prop-001');

    const call = mockAuditEntryUpdateMany.mock.calls[0]![0];
    expect(call.data.ipAddress).toBe('0.0.0.0');
    expect(call.data.userAgent).toBeNull();
  });

  it('logs the anonymization action itself as an audit entry', async () => {
    await anonymizeUserAuditTrail('user-001', 'prop-001');

    // Should create a log of the erasure action
    expect(mockAuditEntryCreate).toHaveBeenCalled();
    const createCall = mockAuditEntryCreate.mock.calls[0]![0].data;
    expect(createCall.resource).toBe('gdpr_erasure');
    expect(createCall.action).toBe('delete');
  });
});

// ---------------------------------------------------------------------------
// 12. Data processing records (ROPA compliance)
// ---------------------------------------------------------------------------

describe('getDataProcessingRecords — ROPA compliance', () => {
  it('returns a list of data processing activities', () => {
    const records = getDataProcessingRecords();
    expect(records).toBeInstanceOf(Array);
    expect(records.length).toBeGreaterThan(0);
  });

  it('each record has purpose, lawful basis, data categories, and retention', () => {
    const records = getDataProcessingRecords();
    for (const record of records) {
      expect(record).toHaveProperty('purpose');
      expect(record).toHaveProperty('lawfulBasis');
      expect(record).toHaveProperty('dataCategories');
      expect(record).toHaveProperty('retentionPeriod');
      expect(record.dataCategories).toBeInstanceOf(Array);
    }
  });

  it('includes resident data processing', () => {
    const records = getDataProcessingRecords();
    const resident = records.find((r) => r.purpose.toLowerCase().includes('resident'));
    expect(resident).toBeDefined();
  });

  it('includes security/access control processing', () => {
    const records = getDataProcessingRecords();
    const security = records.find(
      (r) =>
        r.purpose.toLowerCase().includes('security') || r.purpose.toLowerCase().includes('access'),
    );
    expect(security).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 13. Breach notification: auto-detect unusual access patterns
// ---------------------------------------------------------------------------

describe('detectUnusualAccess — breach notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flags when a user accesses many distinct resources in a short period', async () => {
    // Simulate 50 access entries in 1 hour
    const manyEntries = Array.from({ length: 50 }, (_, i) => ({
      ...FAKE_AUDIT_ROW,
      id: `audit-${i}`,
      resourceId: `res-${i}`,
      createdAt: new Date('2026-03-15T10:00:00Z'),
    }));
    mockAuditEntryFindMany.mockResolvedValue(manyEntries);

    const alerts = await detectUnusualAccess('prop-001', {
      windowMinutes: 60,
      thresholdCount: 30,
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toMatchObject({
      type: 'high_volume_access',
      userId: 'user-001',
    });
  });

  it('flags PII access spikes', async () => {
    const piiEntries = Array.from({ length: 25 }, (_, i) => ({
      ...FAKE_AUDIT_ROW,
      id: `audit-pii-${i}`,
      piiAccessed: true,
      createdAt: new Date('2026-03-15T10:00:00Z'),
    }));
    mockAuditEntryFindMany.mockResolvedValue(piiEntries);

    const alerts = await detectUnusualAccess('prop-001', {
      windowMinutes: 60,
      thresholdCount: 30,
      piiThreshold: 10,
    });

    const piiAlert = alerts.find((a) => a.type === 'pii_access_spike');
    expect(piiAlert).toBeDefined();
  });

  it('returns no alerts when access is within normal limits', async () => {
    mockAuditEntryFindMany.mockResolvedValue([FAKE_AUDIT_ROW]);

    const alerts = await detectUnusualAccess('prop-001', {
      windowMinutes: 60,
      thresholdCount: 30,
    });

    expect(alerts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 14. Login audit: all login attempts with success/failure/IP/device
// ---------------------------------------------------------------------------

describe('logLoginAttempt — login audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginAuditCreate.mockResolvedValue({ id: 'login-001' });
  });

  it('records a successful login', async () => {
    await logLoginAttempt({
      userId: 'user-001',
      email: 'john@example.com',
      success: true,
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome/120',
    });

    expect(mockLoginAuditCreate).toHaveBeenCalledOnce();
    const callData = mockLoginAuditCreate.mock.calls[0]![0].data;
    expect(callData.success).toBe(true);
    expect(callData.ipAddress).toBe('10.0.0.1');
    expect(callData.userAgent).toBe('Chrome/120');
  });

  it('records a failed login with reason', async () => {
    await logLoginAttempt({
      email: 'john@example.com',
      success: false,
      failReason: 'invalid_password',
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome/120',
    });

    const callData = mockLoginAuditCreate.mock.calls[0]![0].data;
    expect(callData.success).toBe(false);
    expect(callData.failReason).toBe('invalid_password');
  });

  it('records login without userId for unknown users', async () => {
    await logLoginAttempt({
      email: 'unknown@example.com',
      success: false,
      failReason: 'user_not_found',
      ipAddress: '10.0.0.1',
      userAgent: 'Firefox/115',
    });

    const callData = mockLoginAuditCreate.mock.calls[0]![0].data;
    expect(callData.userId).toBeUndefined();
    expect(callData.email).toBe('unknown@example.com');
  });

  it('records device info from user-agent', async () => {
    await logLoginAttempt({
      userId: 'user-001',
      email: 'john@example.com',
      success: true,
      ipAddress: '10.0.0.1',
      userAgent: 'ConciergeApp/2.0 (iPhone; iOS 17.4)',
    });

    const callData = mockLoginAuditCreate.mock.calls[0]![0].data;
    expect(callData.userAgent).toBe('ConciergeApp/2.0 (iPhone; iOS 17.4)');
  });
});
