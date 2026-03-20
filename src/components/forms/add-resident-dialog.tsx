'use client';

/**
 * Add Resident Dialog — per PRD 08
 * Quick add a resident to the directory (simplified version of Create User)
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

// ---------------------------------------------------------------------------
// Role type from API
// ---------------------------------------------------------------------------

interface RoleFromApi {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const RESIDENT_ROLE_SLUGS = ['resident_owner', 'resident_tenant', 'family_member', 'offsite_owner'];

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
  const [roles, setRoles] = useState<RoleFromApi[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  // Fetch roles when dialog opens
  useEffect(() => {
    if (!open) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined' && localStorage.getItem('demo_role')) {
      headers['x-demo-role'] = localStorage.getItem('demo_role')!;
    }

    setRolesLoading(true);
    fetch(`/api/v1/roles?propertyId=${propertyId}`, { headers })
      .then((res) => res.json())
      .then((result) => {
        if (result.data && Array.isArray(result.data)) {
          setRoles(result.data);
        }
      })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, [open, propertyId]);

  const residentRoles = roles.filter((r) => RESIDENT_ROLE_SLUGS.includes(r.slug));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResidentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(residentSchema) as any,
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
      const matchedRole = roles.find((r) => r.slug === data.role);
      const fallbackRole = roles.find((r) => r.slug === 'resident_tenant');
      const roleId = matchedRole?.id || fallbackRole?.id || '';

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
          roleId,
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
                disabled={unitsLoading}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${errors.unitId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'}`}
              >
                <option value="">{unitsLoading ? 'Loading units...' : 'Select unit...'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Type</label>
              <select
                {...register('role')}
                disabled={rolesLoading}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                {rolesLoading ? (
                  <option value="">Loading roles...</option>
                ) : residentRoles.length > 0 ? (
                  residentRoles.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="resident_owner">Owner</option>
                    <option value="resident_tenant">Tenant</option>
                    <option value="family_member">Family Member</option>
                    <option value="offsite_owner">Offsite Owner</option>
                  </>
                )}
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
