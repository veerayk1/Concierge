'use client';

/**
 * Create Equipment Dialog — per PRD Equipment Tracking
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const equipmentSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  category: z.string().min(1, 'Select a category'),
  location: z.string().min(2, 'Location is required').max(300),
  manufacturer: z.string().max(200).optional(),
  modelNumber: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  installDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type EquipmentInput = z.infer<typeof equipmentSchema>;

const CATEGORIES = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

interface CreateEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateEquipmentDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateEquipmentDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(equipmentSchema) as any,
    defaultValues: {
      name: '',
      category: '',
      location: '',
      manufacturer: '',
      modelNumber: '',
      serialNumber: '',
      installDate: '',
      warrantyExpiry: '',
      notes: '',
    },
  });

  async function onSubmit(data: EquipmentInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/equipment', {
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
        setServerError(result.message || 'Failed to add equipment');
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
          <Wrench className="text-primary-500 h-5 w-5" />
          Add Equipment
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Register a new piece of building equipment.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('name')}
              label="Name"
              placeholder="e.g. Rooftop HVAC Unit #1"
              required
              error={errors.name?.message}
            />

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
          </div>

          <Input
            {...register('location')}
            label="Location"
            placeholder="e.g. Basement Mechanical Room"
            required
            error={errors.location?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('manufacturer')}
              label="Manufacturer"
              placeholder="e.g. Carrier"
              error={errors.manufacturer?.message}
            />
            <Input
              {...register('modelNumber')}
              label="Model Number"
              placeholder="e.g. 50XC-A24"
              error={errors.modelNumber?.message}
            />
          </div>

          <Input
            {...register('serialNumber')}
            label="Serial Number"
            placeholder="e.g. CR-2023-44821"
            error={errors.serialNumber?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('installDate')}
              type="date"
              label="Install Date"
              error={errors.installDate?.message}
            />
            <Input
              {...register('warrantyExpiry')}
              type="date"
              label="Warranty Expiry"
              error={errors.warrantyExpiry?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional notes about this equipment..."
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
              {isSubmitting ? 'Adding...' : 'Add Equipment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
