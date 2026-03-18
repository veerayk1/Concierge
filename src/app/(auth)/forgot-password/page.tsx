/**
 * Concierge — Forgot Password Page
 *
 * Email input form that sends a password reset link.
 * Always shows success to prevent email enumeration.
 */

import type { Metadata } from 'next';

import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password | Concierge',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] leading-7 font-semibold text-neutral-900">Forgot Password</h1>
        <p className="text-[15px] text-neutral-500">
          Enter your email address and we&#39;ll send you a link to reset your password.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
