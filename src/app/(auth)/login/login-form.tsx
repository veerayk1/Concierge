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
import { DEFAULT_DEMO_PROPERTY_ID } from '@/lib/demo-config';

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

      // Check if this is a first-time login for a resident — redirect to onboarding
      const userData =
        'user' in response
          ? (
              response as {
                user?: {
                  isFirstLogin?: boolean;
                  role?: string;
                  requiresPasswordChange?: boolean;
                  activationToken?: string | null;
                };
              }
            ).user
          : null;
      const isFirstLogin = userData?.isFirstLogin === true;
      const isResident =
        userData?.role === 'resident_owner' || userData?.role === 'resident_tenant';

      // Force a password change before anything else when the account
      // has never been activated. Skips the resident-onboarding wizard
      // because activation has to come first — the wizard would gate on
      // the same activatedAt flag once we land there post-activation.
      if (userData?.requiresPasswordChange && userData.activationToken) {
        window.location.href = `/activate?token=${encodeURIComponent(userData.activationToken)}`;
        return;
      }

      if (isFirstLogin && isResident) {
        window.location.href = '/resident-onboarding';
        return;
      }

      // Use hard navigation to ensure the full page lifecycle re-runs
      // with the new auth state. router.push (soft nav) can fail when
      // the auth layout still caches the unauthenticated state.
      window.location.href = '/dashboard';
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

      {/* Demo Access — quick login for testing & investor walkthroughs.
          Monochrome list grouped by audience; clicking a row jumps straight
          into the dashboard for that role. */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <span className="relative bg-white px-3 text-[11px] tracking-[0.1em] text-neutral-400 uppercase">
          Try a demo role
        </span>
      </div>

      <DemoRoleSection
        title="Admin"
        roles={[
          { role: 'super_admin', label: 'Super Admin', desc: 'Cross-property control' },
          { role: 'property_admin', label: 'Property Admin', desc: 'Owner / buyer view' },
          { role: 'property_manager', label: 'Property Manager', desc: 'Day-to-day operations' },
          { role: 'board_member', label: 'Board Member', desc: 'Governance and reports' },
        ]}
      />

      <DemoRoleSection
        title="On-site staff"
        roles={[
          { role: 'front_desk', label: 'Front Desk', desc: 'Concierge / reception' },
          { role: 'security_guard', label: 'Security Guard', desc: 'Security console' },
          { role: 'security_supervisor', label: 'Security Supervisor', desc: 'Security oversight' },
          { role: 'maintenance_staff', label: 'Maintenance', desc: 'Work orders' },
          { role: 'superintendent', label: 'Superintendent', desc: 'Building operations' },
        ]}
      />

      <DemoRoleSection
        title="Residents"
        roles={[
          { role: 'resident_owner', label: 'Resident (Owner)', desc: 'Unit owner portal' },
          { role: 'resident_tenant', label: 'Resident (Tenant)', desc: 'Tenant portal' },
        ]}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// DemoRoleSection — small grouped list, monochrome, fast to scan
// ---------------------------------------------------------------------------

interface DemoRole {
  role: string;
  label: string;
  desc: string;
}

function DemoRoleSection({ title, roles }: { title: string; roles: DemoRole[] }) {
  const go = (role: string) => {
    localStorage.setItem('demo_role', role);
    localStorage.setItem('demo_propertyId', DEFAULT_DEMO_PROPERTY_ID);
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('demo_return_role');
    window.location.href = '/dashboard';
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
        {title}
      </p>
      <div className="overflow-hidden rounded-xl border border-neutral-200">
        {roles.map((demo, idx) => (
          <button
            key={demo.role}
            type="button"
            onClick={() => go(demo.role)}
            className={`group flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-neutral-50 active:bg-neutral-100 ${
              idx === 0 ? '' : 'border-t border-neutral-100'
            }`}
          >
            <div className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-neutral-800">
                {demo.label}
              </span>
              <span className="block truncate text-[11px] text-neutral-500">{demo.desc}</span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-600"
              aria-hidden="true"
            >
              <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
