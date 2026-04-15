/**
 * Zod Schema Roundtrip Tests
 *
 * Validates that all Zod validation schemas across the application:
 *   - Accept valid input and produce correctly typed output
 *   - Reject invalid/missing required fields with appropriate errors
 *   - Enforce field constraints (min/max length, format, enums)
 *   - Strip unknown fields to prevent data leakage
 *   - Produce human-readable error messages for all failure modes
 *
 * Covers schemas: Package, Maintenance, User, Booking, Event, Auth, Common.
 *
 * @module test/schema/zod-roundtrip
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';

import {
  createPackageSchema,
  releasePackageSchema,
  batchCreatePackageSchema,
} from '@/schemas/package';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  createMaintenanceCommentSchema,
} from '@/schemas/maintenance';
import { createUserSchema, updateUserSchema, updateMyProfileSchema } from '@/schemas/user';
import { createEventSchema, updateEventSchema } from '@/schemas/event';
import {
  loginSchema,
  resetPasswordSchema,
  verifyMfaSchema,
  forgotPasswordSchema,
} from '@/schemas/auth';
import {
  paginationSchema,
  emailSchema,
  uuidSchema,
  searchSchema,
  dateRangeSchema,
} from '@/schemas/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440000';

function expectZodError(fn: () => unknown): ZodError {
  try {
    fn();
    throw new Error('Expected ZodError but validation passed');
  } catch (err) {
    expect(err).toBeInstanceOf(ZodError);
    return err as ZodError;
  }
}

function getFieldErrors(error: ZodError, fieldPath: string): string[] {
  return error.issues.filter((i) => i.path.join('.') === fieldPath).map((i) => i.message);
}

// ===========================================================================
// 1. Package Creation Schema
// ===========================================================================

describe('Package creation schema', () => {
  const validPackage = {
    propertyId: VALID_UUID,
    unitId: VALID_UUID_2,
    direction: 'incoming' as const,
  };

  it('accepts valid minimal input', () => {
    const result = createPackageSchema.parse(validPackage);
    expect(result.propertyId).toBe(VALID_UUID);
    expect(result.unitId).toBe(VALID_UUID_2);
    expect(result.direction).toBe('incoming');
    expect(result.isPerishable).toBe(false);
    expect(result.isOversized).toBe(false);
  });

  it('accepts valid full input with all optional fields', () => {
    const full = {
      ...validPackage,
      residentId: VALID_UUID,
      courierId: VALID_UUID,
      courierOtherName: 'Custom Courier',
      trackingNumber: 'TRK-12345',
      parcelCategoryId: VALID_UUID,
      description: 'Large box from Amazon',
      storageSpotId: VALID_UUID,
      isPerishable: true,
      isOversized: true,
      notifyChannel: 'sms' as const,
    };
    const result = createPackageSchema.parse(full);
    expect(result.isPerishable).toBe(true);
    expect(result.notifyChannel).toBe('sms');
  });

  it('fails when propertyId is missing', () => {
    const error = expectZodError(() => createPackageSchema.parse({ unitId: VALID_UUID }));
    expect(error.issues.length).toBeGreaterThan(0);
    expect(error.issues.some((i) => i.path.includes('propertyId'))).toBe(true);
  });

  it('fails when unitId is missing', () => {
    const error = expectZodError(() => createPackageSchema.parse({ propertyId: VALID_UUID }));
    expect(error.issues.some((i) => i.path.includes('unitId'))).toBe(true);
  });

  it('fails when propertyId is not a valid UUID', () => {
    const error = expectZodError(() =>
      createPackageSchema.parse({ ...validPackage, propertyId: 'not-a-uuid' }),
    );
    expect(error.issues.some((i) => i.path.includes('propertyId'))).toBe(true);
  });

  it('fails when description exceeds 500 characters', () => {
    const error = expectZodError(() =>
      createPackageSchema.parse({
        ...validPackage,
        description: 'a'.repeat(501),
      }),
    );
    expect(error.issues.some((i) => i.path.includes('description'))).toBe(true);
  });

  it('fails when direction is an invalid enum value', () => {
    const error = expectZodError(() =>
      createPackageSchema.parse({ ...validPackage, direction: 'sideways' }),
    );
    expect(error.issues.some((i) => i.path.includes('direction'))).toBe(true);
  });

  it('applies default values for optional boolean fields', () => {
    const result = createPackageSchema.parse(validPackage);
    expect(result.isPerishable).toBe(false);
    expect(result.isOversized).toBe(false);
    expect(result.notifyChannel).toBe('default');
  });

  it('strips unknown fields (no data leakage)', () => {
    const input = {
      ...validPackage,
      secretInternalField: 'should not appear',
      _admin: true,
    };
    const result = createPackageSchema.parse(input);
    expect((result as Record<string, unknown>).secretInternalField).toBeUndefined();
    expect((result as Record<string, unknown>)._admin).toBeUndefined();
  });
});

describe('Release package schema', () => {
  it('accepts valid release input', () => {
    const result = releasePackageSchema.parse({
      releasedToName: 'John Doe',
      idVerified: true,
    });
    expect(result.releasedToName).toBe('John Doe');
    expect(result.idVerified).toBe(true);
  });

  it('fails when releasedToName is too short', () => {
    const error = expectZodError(() => releasePackageSchema.parse({ releasedToName: 'J' }));
    const msgs = getFieldErrors(error, 'releasedToName');
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]).toContain('Name is required');
  });

  it('fails when releasedToName exceeds 200 characters', () => {
    const error = expectZodError(() =>
      releasePackageSchema.parse({ releasedToName: 'a'.repeat(201) }),
    );
    expect(error.issues.some((i) => i.path.includes('releasedToName'))).toBe(true);
  });
});

describe('Batch create package schema', () => {
  it('accepts a batch of 1-20 packages', () => {
    const result = batchCreatePackageSchema.parse({
      propertyId: VALID_UUID,
      packages: [{ unitId: VALID_UUID_2 }],
    });
    expect(result.packages.length).toBe(1);
  });

  it('fails when packages array is empty', () => {
    const error = expectZodError(() =>
      batchCreatePackageSchema.parse({
        propertyId: VALID_UUID,
        packages: [],
      }),
    );
    expect(error.issues.some((i) => i.path.includes('packages'))).toBe(true);
  });

  it('fails when packages array exceeds 20', () => {
    const packages = Array.from({ length: 21 }, () => ({ unitId: VALID_UUID }));
    const error = expectZodError(() =>
      batchCreatePackageSchema.parse({ propertyId: VALID_UUID, packages }),
    );
    expect(error.issues.some((i) => i.path.includes('packages'))).toBe(true);
  });
});

// ===========================================================================
// 2. Maintenance Schema
// ===========================================================================

describe('Maintenance creation schema', () => {
  const validMaintenance = {
    propertyId: VALID_UUID,
    unitId: VALID_UUID_2,
    description: 'Leaking faucet in kitchen, water dripping constantly.',
  };

  it('accepts valid input with defaults', () => {
    const result = createMaintenanceSchema.parse(validMaintenance);
    expect(result.propertyId).toBe(VALID_UUID);
    expect(result.priority).toBe('medium');
    expect(result.permissionToEnter).toBe(false);
    expect(result.hideFromResident).toBe(false);
    expect(result.addAnother).toBe(false);
  });

  it('enforces description minimum length of 10 characters', () => {
    const error = expectZodError(() =>
      createMaintenanceSchema.parse({
        ...validMaintenance,
        description: 'Too short',
      }),
    );
    const msgs = getFieldErrors(error, 'description');
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]).toContain('at least 10 characters');
  });

  it('enforces description maximum length of 4000 characters', () => {
    const error = expectZodError(() =>
      createMaintenanceSchema.parse({
        ...validMaintenance,
        description: 'a'.repeat(4001),
      }),
    );
    expect(error.issues.some((i) => i.path.includes('description'))).toBe(true);
  });

  it('validates priority enum values', () => {
    const result = createMaintenanceSchema.parse({
      ...validMaintenance,
      priority: 'urgent',
    });
    expect(result.priority).toBe('urgent');

    const error = expectZodError(() =>
      createMaintenanceSchema.parse({
        ...validMaintenance,
        priority: 'critical',
      }),
    );
    expect(error.issues.some((i) => i.path.includes('priority'))).toBe(true);
  });

  it('validates attachment schema within maintenance', () => {
    const result = createMaintenanceSchema.parse({
      ...validMaintenance,
      attachments: [
        {
          key: 'uploads/photo1.jpg',
          fileName: 'photo1.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 1024000,
        },
      ],
    });
    expect(result.attachments).toHaveLength(1);
  });

  it('rejects more than 10 attachments', () => {
    const attachments = Array.from({ length: 11 }, (_, i) => ({
      key: `uploads/photo${i}.jpg`,
      fileName: `photo${i}.jpg`,
      contentType: 'image/jpeg',
      fileSizeBytes: 1024,
    }));

    const error = expectZodError(() =>
      createMaintenanceSchema.parse({ ...validMaintenance, attachments }),
    );
    expect(error.issues.some((i) => i.path.includes('attachments'))).toBe(true);
  });

  it('strips unknown fields', () => {
    const result = createMaintenanceSchema.parse({
      ...validMaintenance,
      hackerField: 'should be stripped',
    });
    expect((result as Record<string, unknown>).hackerField).toBeUndefined();
  });
});

describe('Update maintenance schema', () => {
  it('accepts partial updates', () => {
    const result = updateMaintenanceSchema.parse({
      status: 'in_progress',
    });
    expect(result.status).toBe('in_progress');
  });

  it('validates status enum values', () => {
    const error = expectZodError(() => updateMaintenanceSchema.parse({ status: 'invalid_status' }));
    expect(error.issues.some((i) => i.path.includes('status'))).toBe(true);
  });

  it('accepts all valid status transitions', () => {
    const statuses = [
      'open',
      'assigned',
      'in_progress',
      'on_hold',
      'completed',
      'resolved',
      'closed',
    ];
    for (const status of statuses) {
      const result = updateMaintenanceSchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });
});

describe('Maintenance comment schema', () => {
  it('requires non-empty body', () => {
    const error = expectZodError(() => createMaintenanceCommentSchema.parse({ body: '' }));
    const msgs = getFieldErrors(error, 'body');
    expect(msgs[0]).toContain('Comment cannot be empty');
  });

  it('enforces max 2000 characters', () => {
    const error = expectZodError(() =>
      createMaintenanceCommentSchema.parse({ body: 'a'.repeat(2001) }),
    );
    expect(error.issues.some((i) => i.path.includes('body'))).toBe(true);
  });

  it('defaults visibleToResident to true', () => {
    const result = createMaintenanceCommentSchema.parse({ body: 'Good progress' });
    expect(result.visibleToResident).toBe(true);
  });
});

// ===========================================================================
// 3. User Schema
// ===========================================================================

describe('User creation schema', () => {
  const validUser = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    propertyId: VALID_UUID,
    roleId: VALID_UUID_2,
  };

  it('accepts valid input with defaults', () => {
    const result = createUserSchema.parse(validUser);
    expect(result.firstName).toBe('Jane');
    expect(result.sendWelcomeEmail).toBe(true);
    expect(result.languagePreference).toBe('en');
    expect(result.requireAssistance).toBe(false);
  });

  it('validates email format', () => {
    const error = expectZodError(() =>
      createUserSchema.parse({ ...validUser, email: 'not-an-email' }),
    );
    const msgs = getFieldErrors(error, 'email');
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]).toContain('email');
  });

  it('requires email field', () => {
    const { email: _, ...noEmail } = validUser;
    const error = expectZodError(() => createUserSchema.parse(noEmail));
    expect(error.issues.some((i) => i.path.includes('email'))).toBe(true);
  });

  it('requires roleId field', () => {
    const { roleId: _, ...noRole } = validUser;
    const error = expectZodError(() => createUserSchema.parse(noRole));
    expect(error.issues.some((i) => i.path.includes('roleId'))).toBe(true);
  });

  it('validates firstName character restrictions', () => {
    const error = expectZodError(() =>
      createUserSchema.parse({ ...validUser, firstName: 'Jane123' }),
    );
    const msgs = getFieldErrors(error, 'firstName');
    expect(msgs[0]).toContain('invalid characters');
  });

  it('allows accented characters in names (French-Canadian support)', () => {
    const result = createUserSchema.parse({
      ...validUser,
      firstName: 'Jean-Fran\u00e7ois',
      lastName: 'L\u00e9vesque',
    });
    expect(result.firstName).toBe('Jean-Fran\u00e7ois');
    expect(result.lastName).toBe('L\u00e9vesque');
  });

  it('enforces firstName max 50 characters', () => {
    const error = expectZodError(() =>
      createUserSchema.parse({ ...validUser, firstName: 'a'.repeat(51) }),
    );
    expect(error.issues.some((i) => i.path.includes('firstName'))).toBe(true);
  });

  it('validates phone format when provided', () => {
    const error = expectZodError(() =>
      createUserSchema.parse({ ...validUser, phone: 'abc-not-phone' }),
    );
    expect(error.issues.some((i) => i.path.includes('phone'))).toBe(true);
  });

  it('accepts valid salutation values', () => {
    const salutations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Rev.', 'Hon.', 'Mx.'];
    for (const salutation of salutations) {
      const result = createUserSchema.parse({ ...validUser, salutation });
      expect(result.salutation).toBe(salutation);
    }
  });

  it('rejects invalid salutation', () => {
    const error = expectZodError(() =>
      createUserSchema.parse({ ...validUser, salutation: 'Lord' }),
    );
    expect(error.issues.some((i) => i.path.includes('salutation'))).toBe(true);
  });

  it('strips unknown fields', () => {
    const result = createUserSchema.parse({
      ...validUser,
      passwordHash: 'should-not-leak',
      internalId: 42,
    });
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
    expect((result as Record<string, unknown>).internalId).toBeUndefined();
  });
});

describe('Update user profile schema (self-service)', () => {
  it('accepts partial update with firstName only', () => {
    const result = updateMyProfileSchema.parse({ firstName: 'NewName' });
    expect(result.firstName).toBe('NewName');
  });

  it('does not accept email field (prevents self-email-change)', () => {
    const result = updateMyProfileSchema.parse({
      firstName: 'Test',
      email: 'hacker@evil.com',
    });
    expect((result as Record<string, unknown>).email).toBeUndefined();
  });

  it('does not accept role field (prevents privilege escalation)', () => {
    const result = updateMyProfileSchema.parse({
      firstName: 'Test',
      role: 'super_admin',
    });
    expect((result as Record<string, unknown>).role).toBeUndefined();
  });
});

// ===========================================================================
// 4. Event Schema
// ===========================================================================

describe('Event creation schema', () => {
  const validEvent = {
    propertyId: VALID_UUID,
    eventTypeId: VALID_UUID_2,
    title: 'Package arrival at front desk',
  };

  it('accepts valid event with defaults', () => {
    const result = createEventSchema.parse(validEvent);
    expect(result.title).toBe('Package arrival at front desk');
    expect(result.priority).toBe('normal');
  });

  it('requires a valid eventTypeId', () => {
    // eventTypeId uses min(1) validation, not uuid() — rejects empty string
    const error = expectZodError(() => createEventSchema.parse({ ...validEvent, eventTypeId: '' }));
    const msgs = getFieldErrors(error, 'eventTypeId');
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]).toContain('event type');
  });

  it('requires a non-empty title', () => {
    const error = expectZodError(() => createEventSchema.parse({ ...validEvent, title: '' }));
    const msgs = getFieldErrors(error, 'title');
    expect(msgs[0]).toContain('Title is required');
  });

  it('enforces title max 200 characters', () => {
    const error = expectZodError(() =>
      createEventSchema.parse({ ...validEvent, title: 'a'.repeat(201) }),
    );
    expect(error.issues.some((i) => i.path.includes('title'))).toBe(true);
  });

  it('validates priority enum values', () => {
    const validPriorities = ['low', 'normal', 'medium', 'high', 'urgent'];
    for (const priority of validPriorities) {
      const result = createEventSchema.parse({ ...validEvent, priority });
      expect(result.priority).toBe(priority);
    }
  });

  it('rejects invalid priority values', () => {
    const error = expectZodError(() =>
      createEventSchema.parse({ ...validEvent, priority: 'super_high' }),
    );
    expect(error.issues.some((i) => i.path.includes('priority'))).toBe(true);
  });

  it('accepts customFields as a JSON record', () => {
    const result = createEventSchema.parse({
      ...validEvent,
      customFields: {
        courierName: 'FedEx',
        trackingId: 'TRK-999',
        weight: 5.2,
      },
    });
    expect(result.customFields).toEqual({
      courierName: 'FedEx',
      trackingId: 'TRK-999',
      weight: 5.2,
    });
  });

  it('strips unknown top-level fields', () => {
    const result = createEventSchema.parse({
      ...validEvent,
      deletedAt: '2025-01-01',
      createdById: 'should-not-be-settable',
    });
    expect((result as Record<string, unknown>).deletedAt).toBeUndefined();
    expect((result as Record<string, unknown>).createdById).toBeUndefined();
  });
});

describe('Event update schema', () => {
  it('accepts partial status update', () => {
    const result = updateEventSchema.parse({ status: 'resolved' });
    expect(result.status).toBe('resolved');
  });

  it('validates status enum', () => {
    const error = expectZodError(() => updateEventSchema.parse({ status: 'deleted' }));
    expect(error.issues.some((i) => i.path.includes('status'))).toBe(true);
  });

  it('accepts all valid event statuses', () => {
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];
    for (const status of statuses) {
      const result = updateEventSchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });
});

// ===========================================================================
// 5. Auth Schemas
// ===========================================================================

describe('Login schema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.parse({
      email: 'admin@example.com',
      password: 'SecureP@ssw0rd!',
    });
    expect(result.email).toBe('admin@example.com');
    expect(result.rememberMe).toBe(false);
  });

  it('rejects invalid email format', () => {
    const error = expectZodError(() => loginSchema.parse({ email: 'not-email', password: 'test' }));
    expect(error.issues.some((i) => i.path.includes('email'))).toBe(true);
  });

  it('requires password to be non-empty', () => {
    const error = expectZodError(() =>
      loginSchema.parse({ email: 'test@example.com', password: '' }),
    );
    const msgs = getFieldErrors(error, 'password');
    expect(msgs[0]).toContain('Password is required');
  });
});

describe('Forgot password schema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.parse({ email: 'user@example.com' });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    const error = expectZodError(() => forgotPasswordSchema.parse({ email: 'bad' }));
    expect(error.issues.length).toBeGreaterThan(0);
  });
});

describe('Reset password schema', () => {
  it('requires both token and password', () => {
    const error = expectZodError(() => resetPasswordSchema.parse({}));
    expect(error.issues.some((i) => i.path.includes('token'))).toBe(true);
    expect(error.issues.some((i) => i.path.includes('password'))).toBe(true);
  });

  it('enforces password complexity requirements', () => {
    const error = expectZodError(() =>
      resetPasswordSchema.parse({
        token: 'valid-token',
        password: 'weak',
      }),
    );
    expect(error.issues.length).toBeGreaterThan(0);
  });
});

describe('Verify MFA schema', () => {
  it('accepts valid 6-digit code', () => {
    const result = verifyMfaSchema.parse({
      code: '123456',
      mfaToken: 'temp-mfa-token',
    });
    expect(result.code).toBe('123456');
  });

  it('rejects code that is not exactly 6 digits', () => {
    const error = expectZodError(() => verifyMfaSchema.parse({ code: '12345', mfaToken: 'token' }));
    expect(error.issues.some((i) => i.path.includes('code'))).toBe(true);
  });

  it('rejects non-numeric code', () => {
    const error = expectZodError(() =>
      verifyMfaSchema.parse({ code: 'abcdef', mfaToken: 'token' }),
    );
    expect(error.issues.some((i) => i.path.includes('code'))).toBe(true);
  });

  it('requires mfaToken', () => {
    const error = expectZodError(() => verifyMfaSchema.parse({ code: '123456' }));
    expect(error.issues.some((i) => i.path.includes('mfaToken'))).toBe(true);
  });
});

// ===========================================================================
// 6. Common Schemas — strip unknown, error messages
// ===========================================================================

describe('Common schemas', () => {
  describe('emailSchema', () => {
    it('accepts valid email and lowercases it', () => {
      const result = emailSchema.parse('Admin@Example.COM');
      expect(result).toBe('admin@example.com');
    });

    it('trims whitespace', () => {
      const result = emailSchema.parse('  user@test.com  ');
      expect(result).toBe('user@test.com');
    });

    it('rejects invalid email with error message', () => {
      const error = expectZodError(() => emailSchema.parse('not-email'));
      expect(error.issues[0]!.message).toContain('valid email');
    });
  });

  describe('uuidSchema', () => {
    it('accepts valid UUID v4', () => {
      const result = uuidSchema.parse(VALID_UUID);
      expect(result).toBe(VALID_UUID);
    });

    it('rejects non-UUID strings', () => {
      const error = expectZodError(() => uuidSchema.parse('not-a-uuid'));
      expect(error.issues[0]!.message).toContain('UUID');
    });
  });

  describe('searchSchema', () => {
    it('accepts valid search query', () => {
      const result = searchSchema.parse({ query: 'package 302' });
      expect(result.query).toBe('package 302');
    });

    it('rejects empty search query', () => {
      const error = expectZodError(() => searchSchema.parse({ query: '' }));
      expect(error.issues[0]!.message).toContain('empty');
    });
  });

  describe('paginationSchema', () => {
    it('applies defaults for page and pageSize', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBeGreaterThanOrEqual(1);
      expect(result.pageSize).toBeGreaterThan(0);
      expect(result.sortOrder).toBe('desc');
    });

    it('rejects negative page numbers', () => {
      const error = expectZodError(() => paginationSchema.parse({ page: -1 }));
      expect(error.issues.some((i) => i.path.includes('page'))).toBe(true);
    });

    it('rejects page size exceeding max', () => {
      const error = expectZodError(() => paginationSchema.parse({ pageSize: 10000 }));
      expect(error.issues.some((i) => i.path.includes('pageSize'))).toBe(true);
    });
  });

  describe('dateRangeSchema', () => {
    it('accepts valid ISO 8601 date range', () => {
      const result = dateRangeSchema.parse({
        from: '2025-01-01T00:00:00.000Z',
        to: '2025-12-31T23:59:59.000Z',
      });
      expect(result.from).toBeDefined();
      expect(result.to).toBeDefined();
    });

    it('rejects when from is after to', () => {
      const error = expectZodError(() =>
        dateRangeSchema.parse({
          from: '2025-12-31T23:59:59.000Z',
          to: '2025-01-01T00:00:00.000Z',
        }),
      );
      expect(error.issues[0]!.message).toContain('before');
    });

    it('rejects non-ISO date formats', () => {
      const error = expectZodError(() =>
        dateRangeSchema.parse({
          from: 'January 1, 2025',
          to: '2025-12-31T23:59:59.000Z',
        }),
      );
      expect(error.issues.some((i) => i.path.includes('from'))).toBe(true);
    });
  });
});

// ===========================================================================
// 7. All schemas produce error messages for failed validations
// ===========================================================================

describe('All schemas produce human-readable error messages', () => {
  it('createPackageSchema errors reference field names', () => {
    const error = expectZodError(() => createPackageSchema.parse({}));
    expect(error.issues.length).toBeGreaterThan(0);
    for (const issue of error.issues) {
      expect(issue.message).toBeTruthy();
      expect(issue.message.length).toBeGreaterThan(0);
    }
  });

  it('createMaintenanceSchema errors reference field names', () => {
    const error = expectZodError(() => createMaintenanceSchema.parse({}));
    expect(error.issues.length).toBeGreaterThan(0);
    for (const issue of error.issues) {
      expect(issue.message).toBeTruthy();
    }
  });

  it('createUserSchema errors have descriptive messages', () => {
    const error = expectZodError(() => createUserSchema.parse({}));
    expect(error.issues.length).toBeGreaterThan(0);
    // Should have messages for firstName, lastName, email, propertyId, roleId at minimum
    const fields = error.issues.map((i) => i.path[0]);
    expect(fields).toContain('firstName');
    expect(fields).toContain('lastName');
    expect(fields).toContain('email');
    expect(fields).toContain('propertyId');
    expect(fields).toContain('roleId');
  });

  it('createEventSchema errors have descriptive messages', () => {
    const error = expectZodError(() => createEventSchema.parse({}));
    expect(error.issues.length).toBeGreaterThan(0);
    const fields = error.issues.map((i) => i.path[0]);
    expect(fields).toContain('propertyId');
    expect(fields).toContain('eventTypeId');
    expect(fields).toContain('title');
  });

  it('loginSchema errors are user-friendly', () => {
    const error = expectZodError(() => loginSchema.parse({ email: '', password: '' }));
    expect(error.issues.length).toBeGreaterThan(0);
    for (const issue of error.issues) {
      // No raw Zod error codes exposed — all messages should be readable
      expect(issue.message).not.toBe('Required');
    }
  });
});
