/**
 * Concierge — Activate Account Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activate Account | Concierge',
};

export default function ActivatePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-neutral-900">Activate Account</h1>
        <p className="text-sm text-neutral-500">
          Set up your password to activate your Concierge account.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Create Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Choose a password"
            className="focus:border-primary-500 focus:ring-primary-500/20 h-11 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-neutral-700">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Confirm your password"
            className="focus:border-primary-500 focus:ring-primary-500/20 h-11 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="bg-primary-500 hover:bg-primary-600 h-11 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Activate Account
        </button>
      </form>
    </div>
  );
}
