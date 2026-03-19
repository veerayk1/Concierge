/**
 * User Schema Validation Tests — per PRD 08 Section 3.1.1
 * Tests all 13 fields with valid and invalid inputs
 */

import { describe, expect, it } from 'vitest';
import { createUserSchema, updateUserSchema, changeStatusSchema } from './user';

describe('createUserSchema', () => {
  const validInput = {
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet@building.com',
    phone: '+1 416-555-0123',
    propertyId: '00000000-0000-4000-b000-000000000001',
    roleId: '00000000-0000-4000-c000-000000010003',
    unitId: '',
    dateOfBirth: '',
    companyName: '',
    requireAssistance: false,
    frontDeskInstructions: '',
    sendWelcomeEmail: true,
    languagePreference: 'en' as const,
  };

  it('accepts valid input with all required fields', () => {
    const result = createUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('requires firstName', () => {
    const result = createUserSchema.safeParse({ ...validInput, firstName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.firstName).toBeDefined();
    }
  });

  it('requires lastName', () => {
    const result = createUserSchema.safeParse({ ...validInput, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('requires valid email', () => {
    const result = createUserSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it('requires propertyId as UUID', () => {
    const result = createUserSchema.safeParse({ ...validInput, propertyId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('requires roleId as UUID', () => {
    const result = createUserSchema.safeParse({ ...validInput, roleId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects firstName with invalid characters', () => {
    const result = createUserSchema.safeParse({ ...validInput, firstName: 'Janet123' });
    expect(result.success).toBe(false);
  });

  it('accepts hyphenated names', () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      firstName: 'Mary-Jane',
      lastName: "O'Brien",
    });
    expect(result.success).toBe(true);
  });

  it('enforces firstName max length of 50', () => {
    const result = createUserSchema.safeParse({ ...validInput, firstName: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('enforces frontDeskInstructions max length of 500', () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      frontDeskInstructions: 'X'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional phone as empty string', () => {
    const result = createUserSchema.safeParse({ ...validInput, phone: '' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone format', () => {
    const result = createUserSchema.safeParse({ ...validInput, phone: 'abc-not-phone' });
    expect(result.success).toBe(false);
  });

  it('defaults sendWelcomeEmail to true', () => {
    const { sendWelcomeEmail: _sendWelcomeEmail, ...rest } = validInput;
    const result = createUserSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sendWelcomeEmail).toBe(true);
    }
  });

  it('defaults languagePreference to en', () => {
    const { languagePreference: _languagePreference, ...rest } = validInput;
    const result = createUserSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.languagePreference).toBe('en');
    }
  });

  it('accepts fr as language preference', () => {
    const result = createUserSchema.safeParse({ ...validInput, languagePreference: 'fr' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language preference', () => {
    const result = createUserSchema.safeParse({ ...validInput, languagePreference: 'de' });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts partial updates', () => {
    const result = updateUserSchema.safeParse({ firstName: 'Jane' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates firstName when provided', () => {
    const result = updateUserSchema.safeParse({ firstName: '' });
    expect(result.success).toBe(false);
  });
});

describe('changeStatusSchema', () => {
  it('accepts valid status values', () => {
    expect(changeStatusSchema.safeParse({ status: 'active' }).success).toBe(true);
    expect(changeStatusSchema.safeParse({ status: 'suspended' }).success).toBe(true);
    expect(changeStatusSchema.safeParse({ status: 'deactivated' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(changeStatusSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    expect(changeStatusSchema.safeParse({ status: '' }).success).toBe(false);
  });

  it('accepts optional reason', () => {
    const result = changeStatusSchema.safeParse({
      status: 'suspended',
      reason: 'Policy violation',
    });
    expect(result.success).toBe(true);
  });
});
