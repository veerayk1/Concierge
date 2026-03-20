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

const activateFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ActivateFormInput = z.infer<typeof activateFormSchema>;

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

export function ActivateForm() {
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
  } = useForm<ActivateFormInput>({
    resolver: zodResolver(activateFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const strength = useMemo(() => getStrengthLevel(password), [password]);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  async function onSubmit(data: ActivateFormInput) {
    setServerError(null);

    try {
      await apiClient<{ message: string }>('/api/auth/activate', {
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
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Check className="text-success-600 h-8 w-8" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">
            Account activated
          </h2>
          <p className="max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
            Your account has been activated successfully. Redirecting you to sign in...
          </p>
        </div>
        <Link
          href="/login"
          className="text-primary-500 hover:text-primary-600 mt-2 text-[14px] font-medium transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="border-error-200 bg-error-50 flex items-start gap-3 rounded-xl border px-4 py-3.5"
        >
          <p className="text-error-700 text-[14px] leading-5">{serverError}</p>
        </div>
      )}

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
        >
          Create password
          <span className="text-error-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Choose a password"
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby="password-requirements"
            className={`h-[44px] w-full rounded-xl border bg-white px-4 pr-12 text-[15px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
              errors.password
                ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md p-0.5 text-neutral-400 transition-colors hover:text-neutral-600"
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    level <= strength.level ? strength.color : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] font-medium text-neutral-500">{strength.label}</span>
          </div>
        )}

        {/* Requirements Checklist */}
        <ul
          id="password-requirements"
          className="flex flex-col gap-1.5 pt-1"
          aria-label="Password requirements"
        >
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(password);
            return (
              <li key={req.label} className="flex items-center gap-2 text-[13px]">
                {password.length === 0 ? (
                  <div className="h-4 w-4 rounded-full border border-neutral-300" />
                ) : met ? (
                  <div className="bg-success-500 flex h-4 w-4 items-center justify-center rounded-full">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </div>
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
      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirm-password"
          className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
        >
          Confirm password
          <span className="text-error-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm your password"
            aria-invalid={errors.confirmPassword ? 'true' : undefined}
            aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            className={`h-[44px] w-full rounded-xl border bg-white px-4 pr-12 text-[15px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
              errors.confirmPassword
                ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md p-0.5 text-neutral-400 transition-colors hover:text-neutral-600"
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
          <p
            id="confirm-password-error"
            className="text-error-600 text-[13px] font-medium"
            role="alert"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting} fullWidth>
        Activate account
      </Button>
    </form>
  );
}
