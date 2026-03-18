/**
 * Concierge — Auth Schema Tests
 *
 * Tests for Zod validation schemas: login, MFA, password reset, etc.
 * Per Security Rulebook A.3.
 */

import { describe, it, expect } from 'vitest';

import {
  loginSchema,
  verifyMfaSchema,
  verifyRecoveryCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  activateAccountSchema,
  confirmMfaEnrollmentSchema,
  passwordSchema,
  getPasswordErrors,
} from '@/schemas/auth';

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------

describe('loginSchema', () => {
  it('validates correct email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'any-password',
    });

    expect(result.success).toBe(true);
  });

  it('lowercases email', () => {
    const result = loginSchema.safeParse({
      email: 'User@Example.COM',
      password: 'any-password',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'any-password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({
      password: 'any-password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(false);
  });

  it('defaults rememberMe to false', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'any-password',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });

  it('accepts rememberMe as true', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'any-password',
      rememberMe: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(true);
    }
  });

  it('rejects extremely long email (>254 chars)', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = loginSchema.safeParse({
      email: longEmail,
      password: 'any-password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects extremely long password (>128 chars)', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'A'.repeat(129),
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifyMfaSchema
// ---------------------------------------------------------------------------

describe('verifyMfaSchema', () => {
  it('validates a correct 6-digit code with mfaToken', () => {
    const result = verifyMfaSchema.safeParse({
      code: '123456',
      mfaToken: 'some-mfa-token-string',
    });

    expect(result.success).toBe(true);
  });

  it('rejects code shorter than 6 digits', () => {
    const result = verifyMfaSchema.safeParse({
      code: '12345',
      mfaToken: 'token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects code longer than 6 digits', () => {
    const result = verifyMfaSchema.safeParse({
      code: '1234567',
      mfaToken: 'token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-numeric code', () => {
    const result = verifyMfaSchema.safeParse({
      code: 'abcdef',
      mfaToken: 'token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects code with spaces', () => {
    const result = verifyMfaSchema.safeParse({
      code: '123 56',
      mfaToken: 'token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing mfaToken', () => {
    const result = verifyMfaSchema.safeParse({
      code: '123456',
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty mfaToken', () => {
    const result = verifyMfaSchema.safeParse({
      code: '123456',
      mfaToken: '',
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifyRecoveryCodeSchema
// ---------------------------------------------------------------------------

describe('verifyRecoveryCodeSchema', () => {
  it('validates a correct 8-character alphanumeric recovery code', () => {
    const result = verifyRecoveryCodeSchema.safeParse({
      recoveryCode: 'ABCD1234',
      mfaToken: 'token',
    });

    expect(result.success).toBe(true);
  });

  it('rejects recovery code shorter than 8 characters', () => {
    const result = verifyRecoveryCodeSchema.safeParse({
      recoveryCode: 'ABC123',
      mfaToken: 'token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects recovery code with special characters', () => {
    const result = verifyRecoveryCodeSchema.safeParse({
      recoveryCode: 'ABC-1234',
      mfaToken: 'token',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing mfaToken', () => {
    const result = verifyRecoveryCodeSchema.safeParse({
      recoveryCode: 'ABCD1234',
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// forgotPasswordSchema
// ---------------------------------------------------------------------------

describe('forgotPasswordSchema', () => {
  it('validates a correct email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = forgotPasswordSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resetPasswordSchema
// ---------------------------------------------------------------------------

describe('resetPasswordSchema', () => {
  const STRONG_PASSWORD = 'MyStr0ng!Password';

  it('validates a correct token and strong password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it('rejects missing token', () => {
    const result = resetPasswordSchema.safeParse({
      password: STRONG_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      password: STRONG_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('rejects weak password (too short)', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'valid-token',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'valid-token',
      password: 'alllowercase1!aa',
    });

    expect(result.success).toBe(false);
  });

  it('rejects password without digit', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'valid-token',
      password: 'NoDigitsHere!Aa',
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------

describe('changePasswordSchema', () => {
  const STRONG_NEW_PASSWORD = 'NewStr0ng!Pass22';

  it('validates correct current + new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: STRONG_NEW_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it('rejects when new password equals current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: STRONG_NEW_PASSWORD,
      newPassword: STRONG_NEW_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: STRONG_NEW_PASSWORD,
    });

    expect(result.success).toBe(false);
  });

  it('rejects weak new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword123!',
      newPassword: 'weak',
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// activateAccountSchema
// ---------------------------------------------------------------------------

describe('activateAccountSchema', () => {
  it('validates token + strong password', () => {
    const result = activateAccountSchema.safeParse({
      token: 'activation-token-123',
      password: 'MyStr0ng!Pass99',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty token', () => {
    const result = activateAccountSchema.safeParse({
      token: '',
      password: 'MyStr0ng!Pass99',
    });

    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = activateAccountSchema.safeParse({
      token: 'activation-token-123',
      password: 'weak',
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// confirmMfaEnrollmentSchema
// ---------------------------------------------------------------------------

describe('confirmMfaEnrollmentSchema', () => {
  it('validates a 6-digit code', () => {
    const result = confirmMfaEnrollmentSchema.safeParse({
      code: '654321',
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-6-digit code', () => {
    const result = confirmMfaEnrollmentSchema.safeParse({
      code: '12345',
    });

    expect(result.success).toBe(false);
  });

  it('rejects letters in code', () => {
    const result = confirmMfaEnrollmentSchema.safeParse({
      code: '12ab56',
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// passwordSchema (standalone)
// ---------------------------------------------------------------------------

describe('passwordSchema', () => {
  it('accepts a password meeting all requirements', () => {
    const result = passwordSchema.safeParse('MyStr0ng!Pass');

    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 12 characters', () => {
    const result = passwordSchema.safeParse('Short1!a');

    expect(result.success).toBe(false);
  });

  it('rejects password longer than 128 characters', () => {
    const result = passwordSchema.safeParse('Aa1!' + 'x'.repeat(126));

    expect(result.success).toBe(false);
  });

  it('rejects password without special character', () => {
    const result = passwordSchema.safeParse('NoSpecialChar1Aa');

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPasswordErrors
// ---------------------------------------------------------------------------

describe('getPasswordErrors', () => {
  it('returns empty array for strong password', () => {
    const errors = getPasswordErrors('MyStr0ng!Pass');

    expect(errors).toEqual([]);
  });

  it('returns all relevant errors for empty string', () => {
    const errors = getPasswordErrors('');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('12 characters'))).toBe(true);
  });

  it('returns specific error for missing uppercase', () => {
    const errors = getPasswordErrors('alllowercase1!');

    expect(errors.some((e) => e.includes('uppercase'))).toBe(true);
  });

  it('returns specific error for missing digit', () => {
    const errors = getPasswordErrors('NoDigitsHere!Aa');

    expect(errors.some((e) => e.includes('digit'))).toBe(true);
  });
});
