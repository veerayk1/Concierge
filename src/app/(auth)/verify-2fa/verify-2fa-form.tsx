'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, ApiClientError, setAccessToken, setRefreshToken } from '@/lib/api-client';
import type { Role } from '@/types';

interface Verify2faResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}

export function Verify2faForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaToken = searchParams.get('token') ?? '';

  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    if (codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [useRecovery]);

  useEffect(() => {
    if (!mfaToken) {
      router.replace('/login');
    }
  }, [mfaToken, router]);

  const submitVerification = useCallback(
    async (totpCode?: string, recovery?: string) => {
      if (isSubmitting) return;
      setError(null);
      setIsSubmitting(true);

      try {
        const body: Record<string, string> = { mfaToken };
        if (totpCode) body.code = totpCode;
        if (recovery) body.recoveryCode = recovery;

        const data = await apiClient<Verify2faResponse>('/api/auth/verify-2fa', {
          method: 'POST',
          body,
          skipAuth: true,
          skipRefresh: true,
        });

        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        router.push('/dashboard');
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Verification failed. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [mfaToken, isSubmitting, router],
  );

  useEffect(() => {
    if (code.length === 6 && /^\d{6}$/.test(code) && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      submitVerification(code);
    }
    if (code.length < 6) {
      hasAutoSubmitted.current = false;
    }
  }, [code, submitVerification]);

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (useRecovery) {
      if (recoveryCode.length < 8) {
        setError('Recovery code must be at least 8 characters.');
        return;
      }
      await submitVerification(undefined, recoveryCode);
    } else {
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        setError('Please enter a valid 6-digit code.');
        return;
      }
      await submitVerification(code);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* Security icon */}
      <div className="bg-primary-50 flex h-14 w-14 items-center justify-center rounded-2xl">
        <ShieldCheck className="text-primary-500 h-7 w-7" />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="border-error-200 bg-error-50 flex items-start gap-3 rounded-xl border px-4 py-3.5"
        >
          <p className="text-error-700 text-[14px] leading-5">{error}</p>
        </div>
      )}

      {useRecovery ? (
        <Input
          ref={codeInputRef}
          label="Recovery code"
          value={recoveryCode}
          onChange={(e) => {
            setRecoveryCode(e.target.value);
            setError(null);
          }}
          placeholder="Enter your recovery code"
          autoComplete="off"
          required
        />
      ) : (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="totp-code"
            className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
          >
            Verification code
          </label>
          <input
            ref={codeInputRef}
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={6}
            className="focus:border-primary-500 focus:ring-primary-100 h-14 w-full rounded-xl border border-neutral-200 bg-white px-4 text-center font-mono text-[24px] tracking-[0.4em] text-neutral-900 transition-all duration-200 placeholder:tracking-[0.4em] placeholder:text-neutral-300 hover:border-neutral-300 focus:ring-4 focus:outline-none"
            aria-label="6-digit verification code"
            aria-invalid={error ? 'true' : undefined}
          />
          <p className="text-[13px] text-neutral-400">
            Code auto-submits when all 6 digits are entered.
          </p>
        </div>
      )}

      <Button type="submit" size="lg" loading={isSubmitting} disabled={isSubmitting} fullWidth>
        Verify
      </Button>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((prev) => !prev);
            setError(null);
            setCode('');
            setRecoveryCode('');
          }}
          className="text-primary-500 hover:text-primary-600 text-[14px] font-medium transition-colors"
        >
          {useRecovery ? 'Use authenticator code instead' : 'Use recovery code instead'}
        </button>

        <Link
          href="/login"
          className="text-[14px] text-neutral-500 transition-colors hover:text-neutral-700"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
