'use client';

/**
 * Create Purchase Order Dialog — New Purchase Order
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const purchaseOrderSchema = z.object({
  vendor: z.string().min(2, 'Vendor name is required').max(200),
  description: z.string().min(5, 'Description is required').max(2000),
  category: z.string().min(1, 'Select a category'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  priority: z.string().min(1, 'Select a priority'),
  expectedDelivery: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'safety', label: 'Safety' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreatePurchaseOrderDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(purchaseOrderSchema) as any,
    defaultValues: {
      vendor: '',
      description: '',
      category: '',
      amount: undefined,
      priority: '',
      expectedDelivery: '',
      notes: '',
    },
  });

  async function onSubmit(data: PurchaseOrderInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to create purchase order');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <ShoppingCart className="text-primary-500 h-5 w-5" />
          New Purchase Order
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new purchase order for building supplies or services.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('vendor')}
            label="Vendor"
            placeholder="e.g. Office Depot, Home Hardware"
            required
            error={errors.vendor?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe items or services being ordered..."
              rows={3}
              className={`${textareaBase} ${errors.description ? 'border-error-300 focus:border-primary-500' : textareaDefault}`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Category<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('category')}
                className={errors.category ? selectErrorClass : selectClass}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
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
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              label="Amount ($)"
              placeholder="0.00"
              required
              error={errors.amount?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Priority<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('priority')}
                className={errors.priority ? selectErrorClass : selectClass}
              >
                <option value="">Select priority...</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="text-error-600 text-[13px] font-medium">{errors.priority.message}</p>
              )}
            </div>

            <Input
              {...register('expectedDelivery')}
              type="date"
              label="Expected Delivery"
              error={errors.expectedDelivery?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional notes or special instructions..."
              rows={3}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={2000}
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
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
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
