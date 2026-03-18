/**
 * Concierge — Forgot Password Form (Client Component)
 *
 * Features:
 * - Email input with Zod validation
 * - Success state with email icon and message
 * - Always shows success (no email enumeration)
 * - Back to login link
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/schemas/auth';
import { apiClient, ApiClientError } from '@/lib/api-client';

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);

    try {
      await apiClient<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: data,
        skipAuth: true,
        skipRefresh: true,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        // Rate limiting is the only error we surface
        if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setServerError(err.message);
        } else {
          // For all other errors, still show success (prevent enumeration)
          setSubmitted(true);
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="bg-success-50 flex h-14 w-14 items-center justify-center rounded-full">
          <Mail className="text-success-600 h-7 w-7" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[18px] font-semibold text-neutral-900">Check Your Email</h2>
          <p className="text-[15px] leading-6 text-neutral-500">
            If an account with that email exists, we&#39;ve sent a password reset link. Please check
            your inbox and spam folder.
          </p>
        </div>
        <Link
          href="/login"
          className="text-primary-500 hover:text-primary-600 mt-2 text-[14px] font-medium"
        >
          Back to Sign In
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

      {/* Email */}
      <Input
        {...register('email')}
        type="email"
        label="Email"
        placeholder="you@building.com"
        autoComplete="email"
        required
        error={errors.email?.message}
      />

      {/* Submit */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="h-11 w-full text-[15px]"
      >
        Send Reset Link
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
