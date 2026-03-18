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
        if (err.code === 'RATE_LIMIT_EXCEEDED') {
          setServerError(err.message);
        } else {
          setSubmitted(true);
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Mail className="text-success-600 h-8 w-8" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">
            Check your email
          </h2>
          <p className="max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
            If an account with that email exists, we&apos;ve sent a password reset link. Check your
            inbox and spam folder.
          </p>
        </div>
        <Link
          href="/login"
          className="text-primary-500 hover:text-primary-600 mt-2 text-[14px] font-medium transition-colors"
        >
          Back to sign in
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

      <Input
        {...register('email')}
        type="email"
        label="Email address"
        placeholder="name@company.com"
        autoComplete="email"
        required
        error={errors.email?.message}
      />

      <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting} fullWidth>
        Send reset link
      </Button>
    </form>
  );
}
