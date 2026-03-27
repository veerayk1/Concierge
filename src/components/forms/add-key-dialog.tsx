'use client';

/**
 * Add Key to Inventory Dialog — Add a new key/FOB to the property inventory.
 * Posts to /api/v1/keys
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, apiUrl } from '@/lib/hooks/use-api';

const addKeySchema = z.object({
  keyName: z.string().min(1, 'Name is required').max(200),
  keyNumber: z.string().max(100).optional(),
  category: z.string().min(1, 'Category is required'),
  keyOwner: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

type AddKeyInput = z.infer<typeof addKeySchema>;

const KEY_CATEGORIES = [
  { value: 'fob', label: 'FOB' },
  { value: 'master', label: 'Master Key' },
  { value: 'unit', label: 'Unit Key' },
  { value: 'garage_clicker', label: 'Garage Clicker' },
  { value: 'buzzer_code', label: 'Buzzer Code' },
  { value: 'common_area', label: 'Common Area' },
  { value: 'mailbox', label: 'Mailbox Key' },
  { value: 'storage_locker', label: 'Storage Locker' },
  { value: 'other', label: 'Other' },
];

interface AddKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function AddKeyDialog({ open, onOpenChange, propertyId, onSuccess }: AddKeyDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddKeyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addKeySchema) as any,
    defaultValues: {
      keyName: '',
      keyNumber: '',
      category: '',
      keyOwner: '',
      notes: '',
    },
  });

  async function onSubmit(data: AddKeyInput) {
    setServerError(null);
    setSuccessMsg(null);

    try {
      const response = await apiRequest(
        apiUrl('/api/v1/keys', { propertyId }),
        {
          method: 'POST',
          body: { ...data, propertyId },
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setServerError(result?.message || `Failed to add key (${response.status})`);
        return;
      }

      setSuccessMsg('Key added to inventory successfully.');
      setTimeout(() => {
        reset();
        setSuccessMsg(null);
        onOpenChange(false);
        onSuccess?.();
      }, 1200);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Key className="text-primary-500 h-5 w-5" />
          Add Key / FOB to Inventory
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Add a new key, FOB, clicker, or buzzer code to the property inventory.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}
          {successMsg && (
            <div className="border-success-200 bg-success-50 text-success-700 rounded-xl border px-4 py-3 text-[14px]">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('keyName')}
              label="Key Name"
              placeholder="e.g. FOB #1208, Master Key A"
              required
              error={errors.keyName?.message}
            />
            <Input
              {...register('keyNumber')}
              label="Serial / Number"
              placeholder="e.g. SN-20452"
              error={errors.keyNumber?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Category<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('category')}
                className={`h-11 w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.category
                    ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                    : 'border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-primary-100'
                }`}
              >
                <option value="">Select type...</option>
                {KEY_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-error-600 text-[13px] font-medium">{errors.category.message}</p>
              )}
            </div>
            <Input
              {...register('keyOwner')}
              label="Assigned Owner"
              placeholder="e.g. Unit 1208, Building"
              error={errors.keyOwner?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Optional notes about this key..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              maxLength={500}
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add to Inventory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
