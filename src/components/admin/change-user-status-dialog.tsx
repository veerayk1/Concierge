'use client';

/**
 * Change User Status Dialog — per PRD 08 Section 3.1.2
 * Confirmation modal for activating, suspending, or deactivating users
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldOff } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type StatusAction = 'active' | 'suspended' | 'deactivated';

const ACTION_CONFIG: Record<
  StatusAction,
  {
    title: string;
    description: string;
    warning: string;
    buttonLabel: string;
    buttonClass: string;
    icon: typeof CheckCircle2;
    iconClass: string;
  }
> = {
  active: {
    title: 'Reactivate Account',
    description: 'This will restore full access to the platform.',
    warning: 'The user will be able to log in and access all features assigned to their role.',
    buttonLabel: 'Reactivate',
    buttonClass: 'bg-success-600 hover:bg-success-700',
    icon: CheckCircle2,
    iconClass: 'text-success-600',
  },
  suspended: {
    title: 'Suspend Account',
    description: 'Temporarily block this user from accessing the platform.',
    warning:
      'All active sessions will be terminated immediately. The user will not be able to log in until reactivated. Their data will be preserved.',
    buttonLabel: 'Suspend Account',
    buttonClass: 'bg-warning-600 hover:bg-warning-700',
    icon: ShieldOff,
    iconClass: 'text-warning-600',
  },
  deactivated: {
    title: 'Deactivate Account',
    description: 'Permanently deactivate this user account.',
    warning:
      'All active sessions will be terminated. The user will not be able to log in. Their data will be retained for audit purposes but marked as read-only. This can be reversed by an admin.',
    buttonLabel: 'Deactivate Account',
    buttonClass: 'bg-error-600 hover:bg-error-700',
    icon: AlertTriangle,
    iconClass: 'text-error-600',
  },
};

interface ChangeUserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  action: StatusAction;
  onSuccess?: () => void;
}

export function ChangeUserStatusDialog({
  open,
  onOpenChange,
  userId,
  userName,
  action,
  onSuccess,
}: ChangeUserStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;

  async function handleConfirm() {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to change status');
        return;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
              action === 'active'
                ? 'bg-success-50'
                : action === 'suspended'
                  ? 'bg-warning-50'
                  : 'bg-error-50'
            }`}
          >
            <Icon className={`h-7 w-7 ${config.iconClass}`} />
          </div>

          <DialogTitle className="text-[18px] font-bold text-neutral-900">
            {config.title}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[14px] text-neutral-500">
            {config.description}
          </DialogDescription>

          <p className="mt-4 text-[14px] font-medium text-neutral-900">{userName}</p>

          <div className="mt-4 w-full rounded-xl bg-neutral-50 p-4 text-left">
            <p className="text-[13px] leading-relaxed text-neutral-600">{config.warning}</p>
          </div>

          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 mt-4 w-full rounded-xl border px-4 py-3 text-left text-[14px]">
              {serverError}
            </div>
          )}

          <div className="mt-6 flex w-full gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              className={`text-white ${config.buttonClass}`}
              onClick={handleConfirm}
            >
              {isSubmitting ? 'Processing...' : config.buttonLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
