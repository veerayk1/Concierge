'use client';

/**
 * Add Resident Dialog — per PRD 08
 * Quick add a resident to the directory (simplified version of Create User)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const residentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email required').max(254),
  phone: z.string().max(20).optional().or(z.literal('')),
  unitId: z.string().min(1, 'Select a unit'),
  role: z
    .enum(['resident_owner', 'resident_tenant', 'family_member', 'offsite_owner'])
    .default('resident_tenant'),
  sendWelcomeEmail: z.boolean().default(true),
});

type ResidentInput = z.infer<typeof residentSchema>;

interface AddResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function AddResidentDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: AddResidentDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResidentInput>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      unitId: '',
      role: 'resident_tenant',
    },
  });

  async function onSubmit(data: ResidentInput) {
    setServerError(null);
    try {
      const roleMap: Record<string, string> = {
        resident_owner: 'role-9',
        resident_tenant: 'role-10',
        family_member: 'role-11',
        offsite_owner: 'role-12',
      };

      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          propertyId,
          roleId: roleMap[data.role] || 'role-10',
          unitId: data.unitId,
          sendWelcomeEmail: data.sendWelcomeEmail,
          languagePreference: 'en',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to add resident');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <UserPlus className="text-primary-500 h-5 w-5" />
          Add Resident
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Add a new resident to the building directory.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('firstName')}
              label="First Name"
              placeholder="e.g. Janet"
              required
              error={errors.firstName?.message}
            />
            <Input
              {...register('lastName')}
              label="Last Name"
              placeholder="e.g. Smith"
              required
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="name@email.com"
              required
              error={errors.email?.message}
            />
            <Input
              {...register('phone')}
              label="Phone"
              placeholder="+1 416-555-0123"
              error={errors.phone?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Unit<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('unitId')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${errors.unitId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'}`}
              >
                <option value="">Select unit...</option>
                <option value="unit-1">101</option>
                <option value="unit-2">305</option>
                <option value="unit-3">422</option>
                <option value="unit-4">710</option>
                <option value="unit-5">802</option>
                <option value="unit-6">1105</option>
                <option value="unit-7">1203</option>
                <option value="unit-8">1501</option>
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Type</label>
              <select
                {...register('role')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="resident_owner">Owner</option>
                <option value="resident_tenant">Tenant</option>
                <option value="family_member">Family Member</option>
                <option value="offsite_owner">Offsite Owner</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
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
              {isSubmitting ? 'Adding...' : 'Add Resident'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
