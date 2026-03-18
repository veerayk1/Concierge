/**
 * Concierge — Sign In Page
 *
 * Email + password login with form validation, show/hide toggle,
 * remember-me checkbox, MFA redirect, and accessible error display.
 */

import type { Metadata } from 'next';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | Concierge',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] leading-7 font-semibold text-neutral-900">Sign In</h1>
        <p className="text-[15px] text-neutral-500">
          Enter your credentials to access your account.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
