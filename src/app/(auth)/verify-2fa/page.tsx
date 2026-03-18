import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Verify2faForm } from './verify-2fa-form';

export const metadata: Metadata = {
  title: 'Verify Identity | Concierge',
};

export default function Verify2faPage() {
  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
          Two-factor authentication
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          Enter the 6-digit code from your authenticator app to verify your identity.
        </p>
      </div>
      <Verify2faForm />
    </div>
  );
}
