/**
 * Concierge — 2FA Verification Form (Client Component)
 *
 * Features:
 * - 6-digit TOTP code input with auto-focus and numeric enforcement
 * - Auto-submit when all 6 digits entered
 * - Toggle to recovery code input
 * - Back to login link
 * - Error display for invalid codes
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  // Auto-focus the code input on mount
  useEffect(() => {
    if (codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [useRecovery]);

  // Redirect to login if no mfaToken
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

  // Auto-submit when 6 digits are entered
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Error Display */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="border-error-200 bg-error-50 text-error-700 rounded-lg border px-4 py-3 text-[14px]"
        >
          {error}
        </div>
      )}

      {useRecovery ? (
        /* Recovery Code Input */
        <Input
          ref={codeInputRef}
          label="Recovery Code"
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
        /* TOTP Code Input */
        <div className="flex flex-col gap-1.5">
          <label htmlFor="totp-code" className="text-[14px] font-medium text-neutral-900">
            Verification Code
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
            className="bg-surface-primary text-body-md text-text-primary border-border-primary placeholder:text-text-tertiary focus:ring-interactive-focus h-12 w-full rounded-lg border px-4 text-center font-mono text-[20px] tracking-[0.3em] placeholder:tracking-[0.3em] focus:ring-2 focus:ring-offset-1 focus:outline-none"
            aria-label="6-digit verification code"
            aria-invalid={error ? 'true' : undefined}
          />
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="h-11 w-full text-[15px]"
      >
        Verify
      </Button>

      {/* Toggle Recovery / TOTP */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((prev) => !prev);
            setError(null);
            setCode('');
            setRecoveryCode('');
          }}
          className="text-primary-500 hover:text-primary-600 text-[14px] font-medium"
        >
          {useRecovery ? 'Use authenticator code instead' : 'Use recovery code instead'}
        </button>

        <Link href="/login" className="text-[14px] text-neutral-500 hover:text-neutral-700">
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
