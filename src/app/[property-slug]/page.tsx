'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PropertyLoginPageProps {
  params: {
    'property-slug': string;
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PropertyLoginPage({ params }: PropertyLoginPageProps) {
  const router = useRouter();
  const propertySlug = params['property-slug'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    // In production this would authenticate and route to the property portal
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-lg font-semibold tracking-tight text-neutral-900">Concierge</p>
          <h1 className="mt-4 text-[28px] font-bold tracking-tight text-neutral-900">Sign in</h1>
          <p className="mt-2 text-[15px] text-neutral-600">
            Property: <span className="font-medium text-neutral-900">{propertySlug}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="property-login-email"
              className="text-[14px] font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="property-login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="property-login-password"
              className="text-[14px] font-medium text-neutral-700"
            >
              Password
            </label>
            <input
              id="property-login-password"
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

        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            href={'/login' as never}
            className="text-[14px] text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-700"
          >
            Sign in to a different property
          </Link>
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
