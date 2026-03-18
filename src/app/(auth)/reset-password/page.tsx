import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password | Concierge',
};

export default function ResetPasswordPage() {
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
          Reset your password
        </h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          Choose a strong, unique password for your account.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
