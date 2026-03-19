/**
 * Package Schema Validation Tests — per PRD 04
 */

import { describe, expect, it } from 'vitest';
import { createPackageSchema, releasePackageSchema, batchCreatePackageSchema } from './package';

describe('createPackageSchema', () => {
  const validInput = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    unitId: '00000000-0000-4000-e000-000000000001',
    direction: 'incoming' as const,
    isPerishable: false,
    isOversized: false,
    notifyChannel: 'default' as const,
  };

  it('accepts valid input with minimal fields', () => {
    expect(createPackageSchema.safeParse(validInput).success).toBe(true);
  });

  it('requires propertyId', () => {
    const { propertyId: _propertyId, ...rest } = validInput;
    expect(createPackageSchema.safeParse(rest).success).toBe(false);
  });

  it('requires unitId as UUID', () => {
    expect(createPackageSchema.safeParse({ ...validInput, unitId: '' }).success).toBe(false);
    expect(createPackageSchema.safeParse({ ...validInput, unitId: 'not-uuid' }).success).toBe(
      false,
    );
  });

  it('defaults direction to incoming', () => {
    const { direction: _direction, ...rest } = validInput;
    const result = createPackageSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.direction).toBe('incoming');
  });

  it('accepts outgoing direction', () => {
    expect(createPackageSchema.safeParse({ ...validInput, direction: 'outgoing' }).success).toBe(
      true,
    );
  });

  it('rejects invalid direction', () => {
    expect(createPackageSchema.safeParse({ ...validInput, direction: 'returned' }).success).toBe(
      false,
    );
  });

  it('accepts optional tracking number', () => {
    expect(
      createPackageSchema.safeParse({ ...validInput, trackingNumber: 'TBA123456789' }).success,
    ).toBe(true);
    expect(createPackageSchema.safeParse({ ...validInput, trackingNumber: '' }).success).toBe(true);
  });

  it('enforces description max length 500', () => {
    expect(
      createPackageSchema.safeParse({ ...validInput, description: 'X'.repeat(501) }).success,
    ).toBe(false);
    expect(
      createPackageSchema.safeParse({ ...validInput, description: 'X'.repeat(500) }).success,
    ).toBe(true);
  });

  it('accepts all notify channels', () => {
    for (const ch of ['default', 'email', 'sms', 'push', 'voice', 'all', 'none']) {
      expect(createPackageSchema.safeParse({ ...validInput, notifyChannel: ch }).success).toBe(
        true,
      );
    }
  });

  it('defaults isPerishable to false', () => {
    const { isPerishable: _isPerishable, ...rest } = validInput;
    const result = createPackageSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPerishable).toBe(false);
  });
});

describe('releasePackageSchema', () => {
  it('requires releasedToName with min 2 chars', () => {
    expect(releasePackageSchema.safeParse({ releasedToName: '' }).success).toBe(false);
    expect(releasePackageSchema.safeParse({ releasedToName: 'A' }).success).toBe(false);
    expect(releasePackageSchema.safeParse({ releasedToName: 'AB' }).success).toBe(true);
  });

  it('defaults idVerified to false', () => {
    const result = releasePackageSchema.safeParse({ releasedToName: 'Janet Smith' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.idVerified).toBe(false);
  });

  it('defaults isAuthorizedDelegate to false', () => {
    const result = releasePackageSchema.safeParse({ releasedToName: 'Janet Smith' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isAuthorizedDelegate).toBe(false);
  });

  it('enforces releaseComments max 500', () => {
    expect(
      releasePackageSchema.safeParse({
        releasedToName: 'Janet',
        releaseComments: 'X'.repeat(501),
      }).success,
    ).toBe(false);
  });
});

describe('batchCreatePackageSchema', () => {
  const singlePkg = {
    unitId: '00000000-0000-4000-e000-000000000001',
    direction: 'incoming' as const,
    isPerishable: false,
    isOversized: false,
    notifyChannel: 'default' as const,
  };

  it('requires at least 1 package', () => {
    expect(
      batchCreatePackageSchema.safeParse({
        propertyId: '00000000-0000-4000-b000-000000000001',
        packages: [],
      }).success,
    ).toBe(false);
  });

  it('accepts up to 20 packages', () => {
    expect(
      batchCreatePackageSchema.safeParse({
        propertyId: '00000000-0000-4000-b000-000000000001',
        packages: Array.from({ length: 20 }, () => singlePkg),
      }).success,
    ).toBe(true);
  });

  it('rejects more than 20 packages', () => {
    expect(
      batchCreatePackageSchema.safeParse({
        propertyId: '00000000-0000-4000-b000-000000000001',
        packages: Array.from({ length: 21 }, () => singlePkg),
      }).success,
    ).toBe(false);
  });
});
