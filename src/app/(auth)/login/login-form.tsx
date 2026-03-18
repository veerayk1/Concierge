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
        const url = `/verify-2fa?token=${encodeURIComponent(response.mfaToken)}`;
        router.push(url as never);
        return;
      }

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="border-error-200 bg-error-50 flex items-start gap-3 rounded-xl border px-4 py-3.5"
        >
          <div className="bg-error-100 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
            <svg
              className="text-error-600 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
          >
            Password
            <span className="text-error-500 ml-0.5">*</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-primary-500 hover:text-primary-600 text-[13px] font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`h-[44px] w-full rounded-xl border bg-white px-4 pr-12 text-[15px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:bg-neutral-50 ${
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
        {errors.password && (
          <p id="password-error" className="text-error-600 text-[13px] font-medium" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <Checkbox
        checked={rememberMe ?? false}
        onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
        label="Keep me signed in"
        id="remember-me"
      />

      <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting} fullWidth>
        Sign in
      </Button>

      {/* Demo Access — quick login for testing */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <span className="relative bg-white px-3 text-[12px] text-neutral-400">
          or quick demo access
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          {
            role: 'front_desk',
            label: 'Front Desk',
            email: 'concierge1@mapleheights.ca',
            password: 'StaffPass123!@',
          },
          {
            role: 'security_guard',
            label: 'Security',
            email: 'guard1@mapleheights.ca',
            password: 'StaffPass123!@',
          },
          {
            role: 'property_admin',
            label: 'Admin',
            email: 'admin@concierge.app',
            password: 'SuperAdmin123!',
          },
          {
            role: 'resident_owner',
            label: 'Resident',
            email: 'resident1@mapleheights.ca',
            password: 'Resident123!@',
          },
        ].map((demo) => (
          <button
            key={demo.role}
            type="button"
            onClick={() => {
              localStorage.setItem('demo_role', demo.role);
              window.location.href = '/dashboard';
            }}
            className="hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 group rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.98]"
          >
            <span className="group-hover:text-primary-700 block text-[13px] font-medium text-neutral-700">
              Demo: {demo.label}
            </span>
            <span className="block truncate text-[11px] text-neutral-400">{demo.email}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-neutral-400">
        Demo buttons bypass auth. To test real login, use credentials above with the sign-in form.
      </p>
    </form>
  );
}
