/**
 * Concierge — 2FA Verification Page
 *
 * Verifies a 6-digit TOTP code or recovery code after login.
 * Auto-submits when 6 digits are entered.
 */

import type { Metadata } from 'next';

import { Verify2faForm } from './verify-2fa-form';

export const metadata: Metadata = {
  title: 'Verify Identity | Concierge',
};

export default function Verify2faPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] leading-7 font-semibold text-neutral-900">
          Two-Factor Authentication
        </h1>
        <p className="text-[15px] text-neutral-500">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>
      <Verify2faForm />
    </div>
  );
}
