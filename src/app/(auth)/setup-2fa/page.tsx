/**
 * Concierge — Set Up Two-Factor Authentication Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set Up 2FA | Concierge',
};

export default function Setup2FAPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-neutral-900">Set Up Two-Factor Authentication</h1>
        <p className="text-sm text-neutral-500">
          Enhance your account security by enabling two-factor authentication.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        {/* QR code placeholder */}
        <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-neutral-200 bg-white">
          <span className="text-xs text-neutral-400">QR Code</span>
        </div>
        <p className="text-center text-sm text-neutral-500">
          Scan this QR code with your authenticator app.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium text-neutral-700">
            Verification Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="Enter 6-digit code"
            className="focus:border-primary-500 focus:ring-primary-500/20 h-11 rounded-lg border border-neutral-300 px-3 text-center text-sm tracking-widest text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="bg-primary-500 hover:bg-primary-600 h-11 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Verify &amp; Enable
        </button>
      </form>
    </div>
  );
}
