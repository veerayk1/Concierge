'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    // If a property code is provided, route to the property-specific portal
    if (propertyCode.trim()) {
      router.push(`/${propertyCode.trim().toLowerCase()}` as never);
      return;
    }

    // Generic login — in production this would hit the auth API
    // and route to the correct property based on the user's account
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
            Sign in to Concierge
          </h1>
          <p className="mt-2 text-[15px] text-neutral-600">
            Enter your credentials to access your property portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {/* Property code (optional) */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="login-property-code"
              className="text-[14px] font-medium text-neutral-700"
            >
              Property Code
            </label>
            <input
              id="login-property-code"
              type="text"
              value={propertyCode}
              onChange={(e) => setPropertyCode(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
              placeholder="e.g. maple-heights (optional)"
            />
            <p className="text-[13px] text-neutral-500">
              If you know your property code, enter it here to go directly to your portal.
            </p>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-[14px] font-medium text-neutral-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-[14px] font-medium text-neutral-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-[13px] font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={'/' as never}
            className="text-[14px] text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
