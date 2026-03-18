/**
 * Concierge — Password Module Tests
 *
 * Tests for Argon2id password hashing, verification, and policy checks.
 * Per Security Rulebook A.2 and A.3.
 */

import { describe, it, expect } from 'vitest';

import { hashPassword, verifyPassword, checkPasswordPolicy } from '@/server/auth/password';

// ---------------------------------------------------------------------------
// hashPassword
// ---------------------------------------------------------------------------

describe('hashPassword', () => {
  it('returns a hash different from the input', async () => {
    const password = 'MySecureP@ssw0rd!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(password);
  });

  it('produces an Argon2id hash (starts with $argon2id$)', async () => {
    const hash = await hashPassword('TestPassword123!');

    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('produces different hashes for the same input (unique salts)', async () => {
    const password = 'IdenticalPassword1!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string without throwing', async () => {
    // The hash function should still produce a valid hash for empty string
    // (policy enforcement is separate from hashing)
    const hash = await hashPassword('');

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('handles very long passwords (up to 128 characters)', async () => {
    const longPassword = 'A'.repeat(128);
    const hash = await hashPassword(longPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  it('handles unicode characters in passwords', async () => {
    const unicodePassword = 'P@ssw0rd!日本語テスト';
    const hash = await hashPassword(unicodePassword);

    expect(hash).toBeDefined();
    const { valid } = await verifyPassword(unicodePassword, hash);
    expect(valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// verifyPassword
// ---------------------------------------------------------------------------

describe('verifyPassword', () => {
  it('returns { valid: true } for correct password', async () => {
    const password = 'CorrectP@ssw0rd!';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);

    expect(result.valid).toBe(true);
  });

  it('returns { valid: false } for wrong password', async () => {
    const hash = await hashPassword('CorrectP@ssw0rd!');
    const result = await verifyPassword('WrongPassword123!', hash);

    expect(result.valid).toBe(false);
  });

  it('returns needsRehash flag when applicable', async () => {
    const password = 'TestP@ssw0rd123!';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);

    // Fresh hash with current params should not need rehash
    expect(result).toHaveProperty('needsRehash');
    expect(typeof result.needsRehash).toBe('boolean');
  });

  it('is case-sensitive', async () => {
    const hash = await hashPassword('CaseSensitive1!');
    const result = await verifyPassword('casesensitive1!', hash);

    expect(result.valid).toBe(false);
  });

  it('rejects password against hash of different password', async () => {
    const hash1 = await hashPassword('FirstPassword1!');
    const result = await verifyPassword('SecondPassword2!', hash1);

    expect(result.valid).toBe(false);
  });

  it('verifies empty string against its own hash', async () => {
    const hash = await hashPassword('');
    const result = await verifyPassword('', hash);

    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// checkPasswordPolicy
// ---------------------------------------------------------------------------

describe('checkPasswordPolicy', () => {
  it('returns empty array for a strong password', () => {
    const violations = checkPasswordPolicy('MyStr0ng!Pass');

    expect(violations).toEqual([]);
  });

  it('rejects passwords shorter than 12 characters', () => {
    const violations = checkPasswordPolicy('Short1!a');

    expect(violations).toContain('Password must be at least 12 characters');
  });

  it('rejects passwords longer than 128 characters', () => {
    const violations = checkPasswordPolicy('A'.repeat(129) + '1!a');

    expect(violations).toContain('Password must not exceed 128 characters');
  });

  it('requires at least one lowercase letter', () => {
    const violations = checkPasswordPolicy('ALLUPPERCASE1!');

    expect(violations).toContain('Password must contain at least one lowercase letter');
  });

  it('requires at least one uppercase letter', () => {
    const violations = checkPasswordPolicy('alllowercase1!');

    expect(violations).toContain('Password must contain at least one uppercase letter');
  });

  it('requires at least one digit', () => {
    const violations = checkPasswordPolicy('NoDigitsHere!@');

    expect(violations).toContain('Password must contain at least one digit');
  });

  it('requires at least one special character', () => {
    const violations = checkPasswordPolicy('NoSpecial1234Aa');

    expect(violations).toContain('Password must contain at least one special character');
  });

  it('returns multiple violations for a truly weak password', () => {
    const violations = checkPasswordPolicy('bad');

    expect(violations.length).toBeGreaterThanOrEqual(4);
  });

  it('accepts a password that meets all criteria exactly at boundary', () => {
    // Exactly 12 characters with all requirements
    const violations = checkPasswordPolicy('Abcdefghij1!');

    expect(violations).toEqual([]);
  });
});
