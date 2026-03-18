/**
 * Concierge — Reset Password Page
 *
 * New password form with strength indicator and requirements checklist.
 * Gets reset token from URL search params.
 */

import type { Metadata } from 'next';

import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password | Concierge',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] leading-7 font-semibold text-neutral-900">Reset Password</h1>
        <p className="text-[15px] text-neutral-500">Choose a new password for your account.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
