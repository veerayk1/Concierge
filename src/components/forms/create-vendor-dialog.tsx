'use client';

/**
 * Create Vendor Dialog — per PRD 14 Vendor Compliance
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const vendorSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(200),
  category: z.string().min(1, 'Select a category'),
  contactName: z.string().min(2, 'Contact name is required').max(100),
  phone: z.string().min(7, 'Phone number is required').max(20),
  email: z.string().email('Enter a valid email address'),
  address: z.string().max(500).optional(),
  licenseNumber: z.string().max(100).optional(),
  insuranceProvider: z.string().max(200).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
  insuranceExpiry: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type VendorInput = z.infer<typeof vendorSchema>;

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'general', label: 'General' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'security', label: 'Security' },
];

interface CreateVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateVendorDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateVendorDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: {
      companyName: '',
      category: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      licenseNumber: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      insuranceExpiry: '',
      notes: '',
    },
  });

  async function onSubmit(data: VendorInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to add vendor');
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
          <Truck className="text-primary-500 h-5 w-5" />
          Add New Vendor
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Register a new vendor for your property.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('companyName')}
              label="Company Name"
              placeholder="e.g. ABC Plumbing Inc."
              required
              error={errors.companyName?.message}
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('contactName')}
              label="Contact Name"
              placeholder="Full name"
              required
              error={errors.contactName?.message}
            />
            <Input
              {...register('phone')}
              label="Phone"
              placeholder="(416) 555-0100"
              required
              error={errors.phone?.message}
            />
          </div>

          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="vendor@company.com"
            required
            error={errors.email?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Address</label>
            <textarea
              {...register('address')}
              placeholder="Street address, city, postal code"
              rows={2}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={500}
            />
          </div>

          <Input
            {...register('licenseNumber')}
            label="License Number"
            placeholder="Trade license or contractor ID"
            error={errors.licenseNumber?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('insuranceProvider')}
              label="Insurance Provider"
              placeholder="e.g. Intact Insurance"
              error={errors.insuranceProvider?.message}
            />
            <Input
              {...register('insurancePolicyNumber')}
              label="Insurance Policy Number"
              placeholder="Policy #"
              error={errors.insurancePolicyNumber?.message}
            />
          </div>

          <Input
            {...register('insuranceExpiry')}
            type="date"
            label="Insurance Expiry"
            error={errors.insuranceExpiry?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional notes about this vendor..."
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
              {isSubmitting ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
