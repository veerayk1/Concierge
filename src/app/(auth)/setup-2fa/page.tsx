/**
 * Concierge — Set Up Two-Factor Authentication Page
 */

import type { Metadata } from 'next';

import { Setup2faForm } from './setup-2fa-form';

export const metadata: Metadata = {
  title: 'Set Up 2FA | Concierge',
};

export default function Setup2FAPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
          Set up two-factor authentication
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          Enhance your account security by enabling two-factor authentication.
        </p>
      </div>
      <Setup2faForm />
    </div>
  );
}
