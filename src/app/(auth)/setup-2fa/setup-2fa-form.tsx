'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Copy, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { apiClient, ApiClientError } from '@/lib/api-client';

interface SetupResponse {
  qrCodeUrl: string;
  secret: string;
}

interface VerifyResponse {
  message: string;
  recoveryCodes?: string[];
}

export function Setup2faForm() {
  const router = useRouter();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSubmitted = useRef(false);

  // Fetch QR code and secret on mount
  useEffect(() => {
    async function fetchSetup() {
      try {
        const data = await apiClient<SetupResponse>('/api/auth/2fa/setup', {
          method: 'GET',
        });
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setSetupError(err.message);
        } else {
          setSetupError('Failed to load 2FA setup. Please try again.');
        }
      } finally {
        setSetupLoading(false);
      }
    }

    fetchSetup();
  }, []);

  useEffect(() => {
    if (!setupLoading && !setupError && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [setupLoading, setupError]);

  // Redirect to dashboard after success (with delay to show recovery codes)
  useEffect(() => {
    if (success && !recoveryCodes) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, recoveryCodes, router]);

  const submitVerification = useCallback(
    async (totpCode: string) => {
      if (isSubmitting) return;
      setError(null);
      setIsSubmitting(true);

      try {
        const data = await apiClient<VerifyResponse>('/api/auth/2fa/verify', {
          method: 'POST',
          body: { code: totpCode },
        });
        setSuccess(true);
        if (data.recoveryCodes && data.recoveryCodes.length > 0) {
          setRecoveryCodes(data.recoveryCodes);
        }
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
    [isSubmitting],
  );

  // Auto-submit when 6 digits entered
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
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    await submitVerification(code);
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // Fallback: select the text for manual copy
    }
  }

  // Success state with recovery codes
  if (success && recoveryCodes) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Check className="text-success-600 h-8 w-8" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">2FA enabled</h2>
            <p className="max-w-[360px] text-[15px] leading-relaxed text-neutral-500">
              Save these recovery codes in a safe place. You will need them if you lose access to
              your authenticator app.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="grid grid-cols-2 gap-2">
            {recoveryCodes.map((rc) => (
              <code
                key={rc}
                className="rounded-lg bg-white px-3 py-2 text-center font-mono text-[13px] text-neutral-700"
              >
                {rc}
              </code>
            ))}
          </div>
        </div>

        <Button size="lg" fullWidth onClick={() => router.push('/dashboard')}>
          Continue to dashboard
        </Button>
      </div>
    );
  }

  // Success state without recovery codes
  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Check className="text-success-600 h-8 w-8" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">2FA enabled</h2>
          <p className="max-w-[320px] text-[15px] leading-relaxed text-neutral-500">
            Two-factor authentication is now active. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Security icon */}
      <div className="bg-primary-50 flex h-14 w-14 items-center justify-center rounded-2xl">
        <ShieldCheck className="text-primary-500 h-7 w-7" />
      </div>

      {setupError && (
        <div
          role="alert"
          aria-live="polite"
          className="border-error-200 bg-error-50 flex items-start gap-3 rounded-xl border px-4 py-3.5"
        >
          <p className="text-error-700 text-[14px] leading-5">{setupError}</p>
        </div>
      )}

      {/* QR Code Section */}
      <div className="flex flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
        {setupLoading ? (
          <div className="flex h-48 w-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : qrCodeUrl ? (
          <Image
            src={qrCodeUrl}
            alt="Scan this QR code with your authenticator app"
            width={192}
            height={192}
            className="rounded-lg"
            unoptimized
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-neutral-200 bg-white">
            <span className="text-xs text-neutral-400">QR code unavailable</span>
          </div>
        )}
        <p className="text-center text-[14px] text-neutral-500">
          Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
        </p>

        {/* Manual secret fallback */}
        {secret && (
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowSecret((prev) => !prev)}
              className="text-primary-500 hover:text-primary-600 text-[13px] font-medium transition-colors"
            >
              {showSecret ? 'Hide manual setup key' : "Can't scan? Enter key manually"}
            </button>
            {showSecret && (
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                <code className="flex-1 text-center font-mono text-[13px] tracking-wider text-neutral-700 select-all">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="rounded-md p-1 text-neutral-400 transition-colors hover:text-neutral-600"
                  aria-label="Copy secret key"
                >
                  {secretCopied ? (
                    <Check className="text-success-500 h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="border-error-200 bg-error-50 flex items-start gap-3 rounded-xl border px-4 py-3.5"
          >
            <p className="text-error-700 text-[14px] leading-5">{error}</p>
          </div>
        )}

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
            disabled={setupLoading || !!setupError}
            className="focus:border-primary-500 focus:ring-primary-100 h-14 w-full rounded-xl border border-neutral-200 bg-white px-4 text-center font-mono text-[24px] tracking-[0.4em] text-neutral-900 transition-all duration-200 placeholder:tracking-[0.4em] placeholder:text-neutral-300 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="6-digit verification code"
            aria-invalid={error ? 'true' : undefined}
          />
          <p className="text-[13px] text-neutral-400">
            Enter the 6-digit code from your authenticator app. Code auto-submits when complete.
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting || setupLoading || !!setupError}
          fullWidth
        >
          Verify &amp; Enable
        </Button>
      </form>
    </div>
  );
}
