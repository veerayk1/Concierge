'use client';

/**
 * Create User Dialog — per PRD 08 Section 3.1.1
 * 13 fields: firstName, lastName, email, phone, property, role, unit,
 * dateOfBirth, companyName, requireAssistance, frontDeskInstructions,
 * sendWelcomeEmail, languagePreference
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createUserSchema, type CreateUserInput } from '@/schemas/user';
import { apiRequest } from '@/lib/hooks/use-api';

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateUserDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleFromApi[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch roles from API when dialog opens
  useEffect(() => {
    if (!open) return;
    setRolesLoading(true);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined' && localStorage.getItem('demo_role')) {
      headers['x-demo-role'] = localStorage.getItem('demo_role')!;
    }
    fetch(`/api/v1/roles?propertyId=${propertyId}`, { headers })
      .then((res) => res.json())
      .then((result) => {
        if (result.data && Array.isArray(result.data)) {
          setRoles(result.data);
        }
      })
      .catch(() => {
        // Silently fail — roles dropdown will be empty
      })
      .finally(() => setRolesLoading(false));
  }, [open, propertyId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      propertyId,
      roleId: '',
      unitId: '',
      dateOfBirth: '',
      companyName: '',
      requireAssistance: false,
      frontDeskInstructions: '',
      sendWelcomeEmail: true,
      languagePreference: 'en',
    },
  });

  const selectedRoleId = watch('roleId');
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isResidentRole = selectedRole ? RESIDENT_ROLE_SLUGS.includes(selectedRole.slug) : false;
  const sendWelcome = watch('sendWelcomeEmail');
  const requireAssistance = watch('requireAssistance');

  async function onSubmit(data: CreateUserInput) {
    setServerError(null);
    setSuccessMsg(null);

    try {
      const response = await apiRequest('/api/v1/users', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.fields) {
          // Set field-level errors
          Object.entries(result.fields).forEach(([field, messages]) => {
            // @ts-expect-error — dynamic field name
            setValue(field, watch(field), { shouldValidate: false });
          });
        }
        setServerError(result.message || 'Failed to create account');
        return;
      }

      setSuccessMsg(result.message || 'Account created successfully.');
      setTimeout(() => {
        reset();
        setSuccessMsg(null);
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <UserPlus className="text-primary-500 h-5 w-5" />
          Create Account
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new user account and assign a role. The user will receive a welcome email with
          setup instructions.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
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

          {/* Section: Personal Information */}
          <p className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Personal Information
          </p>

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
              label="Email Address"
              placeholder="name@building.com"
              required
              error={errors.email?.message}
            />
            <Input
              {...register('phone')}
              label="Phone Number"
              placeholder="+1 416-555-0123"
              error={errors.phone?.message}
            />
          </div>

          {/* Section: Role & Assignment */}
          <p className="mt-2 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Role & Assignment
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Role<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('roleId')}
                disabled={rolesLoading}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.roleId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">{rolesLoading ? 'Loading roles...' : 'Select a role...'}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.roleId.message}</p>
              )}
            </div>

            {isResidentRole && (
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Unit<span className="text-error-500 ml-0.5">*</span>
                </label>
                <select
                  {...register('unitId')}
                  className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                    errors.unitId
                      ? 'border-error-300'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <option value="">Select a unit...</option>
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
            )}
          </div>

          {/* Section: Additional Details */}
          <p className="mt-2 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Additional Details
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('dateOfBirth')}
              type="date"
              label="Date of Birth"
              error={errors.dateOfBirth?.message}
            />
            <Input
              {...register('companyName')}
              label="Company Name"
              placeholder="Optional"
              error={errors.companyName?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Front Desk Instructions
            </label>
            <textarea
              {...register('frontDeskInstructions')}
              placeholder="e.g. Has a small dog, ring doorbell twice"
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              maxLength={500}
            />
            {errors.frontDeskInstructions && (
              <p className="text-error-600 text-[13px] font-medium">
                {errors.frontDeskInstructions.message}
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <Checkbox
              checked={requireAssistance}
              onCheckedChange={(c) => setValue('requireAssistance', c === true)}
              label="Require Assistance"
              description="Enable if resident needs accessibility accommodations. Visible to front desk and security."
              id="require-assistance"
            />

            <Checkbox
              checked={sendWelcome}
              onCheckedChange={(c) => setValue('sendWelcomeEmail', c === true)}
              label="Send Welcome Email"
              description="Send an onboarding email with setup instructions to the user."
              id="send-welcome"
            />
          </div>

          {/* Language */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Language Preference</label>
            <select
              {...register('languagePreference')}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="fr">Fran\u00e7ais</option>
            </select>
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
