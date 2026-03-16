/**
 * Concierge — Auth Validation Schemas
 *
 * Authentication-specific Zod schemas for login, MFA, password reset, etc.
 * Enforces password policy from Security Rulebook A.3.
 *
 * @module schemas/auth
 */

import { z } from 'zod';

import { PASSWORD_POLICY, PASSWORD_PATTERNS } from '@/lib/constants';
import { emailSchema } from '@/schemas/common';

// ---------------------------------------------------------------------------
// Password Validation
// ---------------------------------------------------------------------------

/**
 * Password schema with full policy validation per Security Rulebook A.3.
 *
 * - Minimum 12 characters (A.3.1)
 * - Maximum 128 characters (A.3.1)
 * - At least 1 uppercase letter (A.3.2)
 * - At least 1 lowercase letter (A.3.2)
 * - At least 1 digit (A.3.2)
 * - At least 1 special character (A.3.2)
 *
 * Note: HIBP check (A.3.3) and password history check (A.3.4) are
 * performed server-side in the auth service, not in the Zod schema.
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_POLICY.minLength,
    `Password must be at least ${PASSWORD_POLICY.minLength} characters`,
  )
  .max(
    PASSWORD_POLICY.maxLength,
    `Password must be at most ${PASSWORD_POLICY.maxLength} characters`,
  )
  .refine(
    (val) => PASSWORD_PATTERNS.uppercase.test(val),
    'Password must contain at least one uppercase letter',
  )
  .refine(
    (val) => PASSWORD_PATTERNS.lowercase.test(val),
    'Password must contain at least one lowercase letter',
  )
  .refine((val) => PASSWORD_PATTERNS.digit.test(val), 'Password must contain at least one digit')
  .refine(
    (val) => PASSWORD_PATTERNS.special.test(val),
    'Password must contain at least one special character',
  );

/**
 * Validates password complexity requirements and returns an array of
 * unmet rules. Useful for the client-side password strength meter.
 */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Must be at most ${PASSWORD_POLICY.maxLength} characters`);
  }
  if (!PASSWORD_PATTERNS.uppercase.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  if (!PASSWORD_PATTERNS.lowercase.test(password)) {
    errors.push('Must contain at least one lowercase letter');
  }
  if (!PASSWORD_PATTERNS.digit.test(password)) {
    errors.push('Must contain at least one digit');
  }
  if (!PASSWORD_PATTERNS.special.test(password)) {
    errors.push('Must contain at least one special character');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/** Login form / API request body. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(PASSWORD_POLICY.maxLength, 'Password is too long'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// MFA Verification
// ---------------------------------------------------------------------------

/** MFA TOTP code verification. */
export const verifyMfaSchema = z.object({
  /** 6-digit TOTP code */
  code: z
    .string()
    .length(6, 'MFA code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'MFA code must contain only digits'),
  /** Temporary MFA token issued after successful password auth */
  mfaToken: z.string().min(1, 'MFA token is required'),
});

export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;

/** MFA recovery code verification. */
export const verifyRecoveryCodeSchema = z.object({
  /** 8-character alphanumeric recovery code */
  recoveryCode: z
    .string()
    .length(8, 'Recovery code must be exactly 8 characters')
    .regex(/^[a-zA-Z0-9]{8}$/, 'Recovery code must be alphanumeric'),
  /** Temporary MFA token issued after successful password auth */
  mfaToken: z.string().min(1, 'MFA token is required'),
});

export type VerifyRecoveryCodeInput = z.infer<typeof verifyRecoveryCodeSchema>;

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------

/**
 * Forgot password request.
 * Note: API must not disclose whether the email exists (Security Rulebook A.8.4).
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------

/** Password reset form (reached via email link). */
export const resetPasswordSchema = z.object({
  /** One-time reset token from the email link */
  token: z.string().min(1, 'Reset token is required'),
  /** New password (with full policy validation) */
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------

/**
 * Change password (authenticated user).
 * Requires current password per Security Rulebook A.3.7.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(PASSWORD_POLICY.maxLength),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Account Activation
// ---------------------------------------------------------------------------

/** Account activation (set initial password from welcome email). */
export const activateAccountSchema = z.object({
  /** One-time activation token from the welcome email */
  token: z.string().min(1, 'Activation token is required'),
  /** Initial password (with full policy validation) */
  password: passwordSchema,
});

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;

// ---------------------------------------------------------------------------
// MFA Enrollment
// ---------------------------------------------------------------------------

/** Confirm MFA enrollment by providing a valid TOTP code. */
export const confirmMfaEnrollmentSchema = z.object({
  /** 6-digit TOTP code to confirm enrollment */
  code: z
    .string()
    .length(6, 'Confirmation code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Confirmation code must contain only digits'),
});

export type ConfirmMfaEnrollmentInput = z.infer<typeof confirmMfaEnrollmentSchema>;
