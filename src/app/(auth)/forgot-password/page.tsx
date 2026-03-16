/**
 * Concierge — Forgot Password Page
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forgot Password | Concierge',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-neutral-900">Forgot Password</h1>
        <p className="text-sm text-neutral-500">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@building.com"
            className="focus:border-primary-500 focus:ring-primary-500/20 h-11 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="bg-primary-500 hover:bg-primary-600 h-11 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Send Reset Link
        </button>
      </form>

      <Link href="/login" className="text-primary-500 hover:text-primary-600 text-center text-sm">
        Back to Sign In
      </Link>
    </div>
  );
}
