'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PropertyData {
  name: string;
  logo?: string;
  primaryColor: string;
  unitCount: number;
}

interface PropertyLoginFormProps {
  property: PropertyData;
  slug: string;
}

// ---------------------------------------------------------------------------
// Property Login Form (Client Component)
// ---------------------------------------------------------------------------

export default function PropertyLoginForm({ property, slug }: PropertyLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberProperty, setRememberProperty] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // In production this would authenticate against the API
    // and validate the user belongs to this property
    if (rememberProperty) {
      try {
        localStorage.setItem('concierge-last-property', slug);
      } catch {
        // localStorage may be unavailable
      }
    }

    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-[420px]">
        {/* Property branding */}
        <div className="text-center">
          {property.logo ? (
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.logo}
                alt={`${property.name} logo`}
                className="h-16 w-16 rounded-2xl object-contain"
              />
            </div>
          ) : (
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-[24px] font-bold text-white"
              style={{ backgroundColor: property.primaryColor }}
              aria-hidden="true"
            >
              {property.name.charAt(0)}
            </div>
          )}

          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">
            Sign in to {property.name}
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500">
            Enter your credentials to access your resident portal
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="property-login-email"
              className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase"
            >
              Email
            </label>
            <input
              id="property-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className="h-[48px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-[15px] text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-200 focus:outline-none"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="property-login-password"
                className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase"
              >
                Password
              </label>
              <Link
                href={'/forgot-password' as never}
                className="text-[13px] font-medium transition-colors hover:text-neutral-700"
                style={{ color: property.primaryColor }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="property-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="h-[48px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-[15px] text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-200 focus:outline-none"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {/* Remember property */}
          <label className="flex cursor-pointer items-center gap-3 select-none">
            <input
              type="checkbox"
              checked={rememberProperty}
              onChange={(e) => setRememberProperty(e.target.checked)}
              className="h-[18px] w-[18px] rounded border-neutral-300 accent-current"
              style={{ accentColor: property.primaryColor }}
              disabled={loading}
            />
            <span className="text-[14px] text-neutral-600">Remember this property</span>
          </label>

          {/* Error message */}
          {error && (
            <div
              className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex h-[50px] items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: property.primaryColor }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-10 border-t border-neutral-100 pt-6 text-center">
          <p className="text-[14px] text-neutral-500">
            Not a resident here?{' '}
            <Link
              href={'/login' as never}
              className="font-medium text-neutral-900 underline underline-offset-4 transition-colors hover:text-neutral-700"
            >
              Sign in to a different property
            </Link>
          </p>
        </div>

        {/* Powered by */}
        <p className="mt-8 text-center text-[12px] text-neutral-400">
          Powered by{' '}
          <Link
            href={'/' as never}
            className="font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            Concierge
          </Link>
        </p>
      </div>
    </div>
  );
}
