'use client';

/**
 * Change Password Dialog
 *
 * Allows authenticated users to change their password from the My Account page.
 * Validates against password policy (12+ chars, uppercase, lowercase, digit,
 * special char) with real-time feedback.
 */

import { useState, useCallback } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordRequirement {
  label: string;
  test: (pw: string) => boolean;
}

// ---------------------------------------------------------------------------
// Password requirements (mirrors server-side checkPasswordPolicy)
// ---------------------------------------------------------------------------

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 12 characters', test: (pw) => pw.length >= 12 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One digit', test: (pw) => /\d/.test(pw) },
  {
    label: 'One special character',
    test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Reset form state when dialog opens/closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setFeedback(null);
        setFieldErrors({});
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && allRequirementsMet && passwordsMatch && !saving;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSaving(true);
      setFeedback(null);
      setFieldErrors({});

      try {
        await apiRequest('/api/v1/users/me/change-password', {
          method: 'POST',
          body: { currentPassword, newPassword, confirmPassword },
        });

        setFeedback({ type: 'success', message: 'Password changed successfully.' });

        // Auto-close after showing success
        setTimeout(() => {
          handleOpenChange(false);
        }, 1500);
      } catch (err: unknown) {
        const apiErr = err as { message?: string; details?: Record<string, string[]> };
        if (apiErr.details) {
          setFieldErrors(apiErr.details);
        }
        setFeedback({
          type: 'error',
          message: apiErr.message ?? 'Failed to change password. Please try again.',
        });
      } finally {
        setSaving(false);
      }
    },
    [canSubmit, currentPassword, newPassword, confirmPassword, handleOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>Enter your current password and choose a new one.</DialogDescription>

        {feedback && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
              feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {/* Current Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="current-password" className="text-[14px] font-medium text-neutral-700">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={saving}
                autoComplete="current-password"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 pr-11 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="text-[13px] font-medium text-red-600">
                {fieldErrors.currentPassword[0]}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="new-password" className="text-[14px] font-medium text-neutral-700">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 pr-11 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="text-[13px] font-medium text-red-600">{fieldErrors.newPassword[0]}</p>
            )}

            {/* Password Requirements Checklist */}
            {newPassword.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(newPassword);
                  return (
                    <div key={req.label} className="flex items-center gap-2">
                      {met ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-neutral-300" />
                      )}
                      <span
                        className={`text-[12px] ${met ? 'text-green-600' : 'text-neutral-400'}`}
                      >
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-password" className="text-[14px] font-medium text-neutral-700">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
                autoComplete="new-password"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 pr-11 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[13px] font-medium text-red-600">Passwords do not match</p>
            )}
            {fieldErrors.confirmPassword && (
              <p className="text-[13px] font-medium text-red-600">
                {fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
