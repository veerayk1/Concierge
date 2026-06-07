/**
 * Concierge — Activate Account Page
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ActivateForm } from './activate-form';

export const metadata: Metadata = {
  title: 'Activate Account | BuildingAutopilot',
};

export default function ActivatePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
          Activate your account
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          Set up your password to activate your BuildingAutopilot account.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="h-32 animate-pulse rounded-xl bg-neutral-100" aria-hidden="true" />
        }
      >
        <ActivateForm />
      </Suspense>
    </div>
  );
}
