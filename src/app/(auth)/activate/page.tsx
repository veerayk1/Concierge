/**
 * Concierge — Activate Account Page
 */

import type { Metadata } from 'next';

import { ActivateForm } from './activate-form';

export const metadata: Metadata = {
  title: 'Activate Account | Concierge',
};

export default function ActivatePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
          Activate your account
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          Set up your password to activate your Concierge account.
        </p>
      </div>
      <ActivateForm />
    </div>
  );
}
