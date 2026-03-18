/**
 * Concierge — Login Form (Client Component)
 *
 * Handles email/password login with react-hook-form + Zod validation.
 * Features:
 * - Password show/hide toggle
 * - "Remember me" checkbox
 * - Inline error display with aria-live
 * - Loading state on submit
 * - MFA redirect when mfaRequired
 * - Redirect to dashboard on success
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema } from '@/schemas/auth';
import { useAuth } from '@/lib/hooks/use-auth';
import { ApiClientError } from '@/lib/api-client';

/**
 * Use the Zod input type for the form (before transforms/defaults),
 * since react-hook-form works with the raw input shape.
 */
type LoginFormValues = z.input<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  async function onSubmit(data: LoginFormValues) {
    setServerError(null);

    try {
      const response = await login(data.email, data.password, data.rememberMe ?? false);

      if ('mfaRequired' in response && response.mfaRequired) {
        // Redirect to 2FA verification with the mfaToken
        const url = `/verify-2fa?token=${encodeURIComponent(response.mfaToken)}`;
        router.push(url as never);
        return;
      }

      // Successful login — redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setServerError(error.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
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

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-body-sm text-text-primary font-medium">
          Password
          <span className="text-status-error ml-0.5">*</span>
        </label>
        <div className="relative">
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`bg-surface-primary text-body-md text-text-primary placeholder:text-text-tertiary h-10 w-full rounded-lg border px-3 pr-10 focus:ring-2 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
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
        {errors.password && (
          <p id="password-error" className="text-body-xs text-status-error" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me + Forgot Password */}
      <div className="flex items-center justify-between">
        <Checkbox
          checked={rememberMe ?? false}
          onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
          label="Remember me"
          id="remember-me"
        />
        <Link
          href="/forgot-password"
          className="text-primary-500 hover:text-primary-600 text-[14px] font-medium"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="h-11 w-full text-[15px]"
      >
        Sign In
      </Button>
    </form>
  );
}
