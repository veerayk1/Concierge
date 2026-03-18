/**
 * Concierge — Reset Password Form (Client Component)
 *
 * Features:
 * - Token from URL search params
 * - New password with show/hide toggle
 * - Confirm password with match validation
 * - Password requirements checklist (checkmarks as each is met)
 * - Password strength indicator bar
 * - Success state with redirect countdown
 * - Error state for invalid/expired token
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { passwordSchema } from '@/schemas/auth';
import { PASSWORD_POLICY, PASSWORD_PATTERNS } from '@/lib/constants';
import { apiClient, ApiClientError } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Form Schema (with confirm password)
// ---------------------------------------------------------------------------

const resetFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormInput = z.infer<typeof resetFormSchema>;

// ---------------------------------------------------------------------------
// Password Requirements
// ---------------------------------------------------------------------------

interface PasswordRequirement {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: `At least ${PASSWORD_POLICY.minLength} characters`,
    test: (pw) => pw.length >= PASSWORD_POLICY.minLength,
  },
  { label: 'One uppercase letter', test: (pw) => PASSWORD_PATTERNS.uppercase.test(pw) },
  { label: 'One lowercase letter', test: (pw) => PASSWORD_PATTERNS.lowercase.test(pw) },
  { label: 'One digit', test: (pw) => PASSWORD_PATTERNS.digit.test(pw) },
  { label: 'One special character', test: (pw) => PASSWORD_PATTERNS.special.test(pw) },
];

function getStrengthLevel(password: string): { level: number; label: string; color: string } {
  const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;

  if (password.length === 0) return { level: 0, label: '', color: '' };
  if (metCount <= 2) return { level: 1, label: 'Weak', color: 'bg-error-500' };
  if (metCount <= 3) return { level: 2, label: 'Fair', color: 'bg-warning-500' };
  if (metCount <= 4) return { level: 3, label: 'Good', color: 'bg-info-500' };
  return { level: 4, label: 'Strong', color: 'bg-success-500' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormInput>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const strength = useMemo(() => getStrengthLevel(password), [password]);

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Auto-redirect after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  async function onSubmit(data: ResetFormInput) {
    setServerError(null);

    try {
      await apiClient<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password: data.password },
        skipAuth: true,
        skipRefresh: true,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="bg-success-50 flex h-14 w-14 items-center justify-center rounded-full">
          <Check className="text-success-600 h-7 w-7" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[18px] font-semibold text-neutral-900">Password Reset!</h2>
          <p className="text-[15px] leading-6 text-neutral-500">
            Your password has been reset successfully. Redirecting to sign in...
          </p>
        </div>
        <Link
          href="/login"
          className="text-primary-500 hover:text-primary-600 mt-2 text-[14px] font-medium"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {/* Server Error */}
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="border-error-200 bg-error-50 text-error-700 rounded-lg border px-4 py-3 text-[14px]"
        >
          {serverError}
        </div>
      )}

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[14px] font-medium text-neutral-900">
          New Password
          <span className="text-error-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Enter new password"
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby="password-requirements"
            className={`bg-surface-primary text-body-md text-text-primary placeholder:text-text-tertiary h-10 w-full rounded-lg border px-3 pr-10 focus:ring-2 focus:ring-offset-1 focus:outline-none ${
              errors.password
                ? 'border-status-error focus:ring-status-error'
                : 'border-border-primary hover:border-border-secondary focus:ring-interactive-focus'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>

        {/* Strength Indicator */}
        {password.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    level <= strength.level ? strength.color : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] text-neutral-500">{strength.label}</span>
          </div>
        )}

        {/* Requirements Checklist */}
        <ul
          id="password-requirements"
          className="flex flex-col gap-1 pt-1"
          aria-label="Password requirements"
        >
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(password);
            return (
              <li key={req.label} className="flex items-center gap-2 text-[13px]">
                {password.length === 0 ? (
                  <div className="h-4 w-4 rounded-full border border-neutral-300" />
                ) : met ? (
                  <Check className="text-success-500 h-4 w-4" />
                ) : (
                  <X className="h-4 w-4 text-neutral-300" />
                )}
                <span
                  className={met && password.length > 0 ? 'text-neutral-700' : 'text-neutral-400'}
                >
                  {req.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-[14px] font-medium text-neutral-900">
          Confirm Password
          <span className="text-error-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm new password"
            aria-invalid={errors.confirmPassword ? 'true' : undefined}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            className={`bg-surface-primary text-body-md text-text-primary placeholder:text-text-tertiary h-10 w-full rounded-lg border px-3 pr-10 focus:ring-2 focus:ring-offset-1 focus:outline-none ${
              errors.confirmPassword
                ? 'border-status-error focus:ring-status-error'
                : 'border-border-primary hover:border-border-secondary focus:ring-interactive-focus'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-error-600 text-[13px]" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="h-11 w-full text-[15px]"
      >
        Reset Password
      </Button>

      {/* Back to Login */}
      <Link
        href="/login"
        className="text-center text-[14px] text-neutral-500 hover:text-neutral-700"
      >
        Back to Sign In
      </Link>
    </form>
  );
}
