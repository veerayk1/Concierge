import type { Metadata } from 'next';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | Concierge',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">Welcome back</h1>
        <p className="text-[15px] leading-relaxed text-neutral-500">
          Sign in to your account to continue.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
