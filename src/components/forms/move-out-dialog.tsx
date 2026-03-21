'use client';

/**
 * Move-Out Confirmation Dialog
 * Records a move-out date for an occupancy record.
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LogOut } from 'lucide-react';

interface MoveOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupancyId: string;
  residentName: string;
  unitNumber: string;
  onSuccess?: () => void;
}

export function MoveOutDialog({
  open,
  onOpenChange,
  occupancyId,
  residentName,
  unitNumber,
  onSuccess,
}: MoveOutDialogProps) {
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      setIsSubmitting(true);

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/v1/occupancy/${occupancyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(localStorage.getItem('demo_role') && {
              'x-demo-role': localStorage.getItem('demo_role')!,
            }),
          },
          body: JSON.stringify({ moveOutDate }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setServerError(err.message || 'Failed to record move-out');
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        onOpenChange(false);
        onSuccess?.();
      } catch {
        setServerError('Network error');
        setIsSubmitting(false);
      }
    },
    [occupancyId, moveOutDate, onOpenChange, onSuccess],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Confirm Move-Out</DialogTitle>
        <DialogDescription>
          Record move-out for <strong>{residentName}</strong> from{' '}
          <strong>Unit {unitNumber}</strong>.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              This will remove {residentName} from Unit {unitNumber}. If no other residents remain,
              the unit status will change to <strong>Vacant</strong>.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Move-out Date</label>
            <Input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Confirm Move-Out
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
