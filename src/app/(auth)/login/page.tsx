/**
 * Concierge — Sign In Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Concierge',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-neutral-900">Sign In</h1>
        <p className="text-sm text-neutral-500">Enter your credentials to access your account.</p>
      </div>

      {/* Placeholder form — will be replaced with a proper client component */}
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="focus:border-primary-500 focus:ring-primary-500/20 h-11 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="bg-primary-500 hover:bg-primary-600 h-11 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Sign In
        </button>
      </form>

      <a
        href="/forgot-password"
        className="text-primary-500 hover:text-primary-600 text-center text-sm"
      >
        Forgot your password?
      </a>
    </div>
  );
}
