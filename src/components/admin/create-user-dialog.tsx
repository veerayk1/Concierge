'use client';

/* HMR force rebuild - v2 */
/**
 * Create User Dialog — per PRD 08 Section 3.1.1
 * 13 fields: firstName, lastName, email, phone, property, role, unit,
 * dateOfBirth, companyName, requireAssistance, frontDeskInstructions,
 * sendWelcomeEmail, languagePreference
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUserSchema, type CreateUserInput } from '@/schemas/user';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoleFromApi {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface UnitFromApi {
  id: string;
  number: string;
  floor?: number;
}

const RESIDENT_ROLE_SLUGS = ['resident_owner', 'resident_tenant', 'family_member', 'offsite_owner'];

// ---------------------------------------------------------------------------
// Auth headers helper (supports both demo mode and real Bearer auth)
// ---------------------------------------------------------------------------

function getDialogHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window === 'undefined') return headers;

  // Demo mode takes priority
  const demoRole = localStorage.getItem('demo_role');
  if (demoRole) {
    headers['x-demo-role'] = demoRole;
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode) headers['x-demo-mode'] = demoMode;
    return headers;
  }

  // Real auth: include Bearer token
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

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
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleFromApi[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [units, setUnits] = useState<UnitFromApi[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Fetch roles and units from API when dialog opens
  useEffect(() => {
    if (!open) return;
    const headers = getDialogHeaders();

    // Fetch roles
    setRolesLoading(true);
    setRolesError(null);
    fetch(`/api/v1/roles?propertyId=${propertyId}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load roles (${res.status})`);
        return res.json();
      })
      .then((result) => {
        if (result.data && Array.isArray(result.data)) {
          setRoles(result.data);
          if (result.data.length === 0) {
            setRolesError('No roles found. Please ensure this property is set up correctly.');
          }
        } else {
          setRolesError('Invalid response from roles API.');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch roles:', err);
        setRolesError(err.message || 'Failed to load roles. Please try again.');
      })
      .finally(() => setRolesLoading(false));

    // Fetch units for resident role assignment
    setUnitsLoading(true);
    fetch(`/api/v1/units?propertyId=${propertyId}&pageSize=500`, { headers })
      .then((res) => {
        if (!res.ok) return { data: [] };
        return res.json();
      })
      .then((result) => {
        const data = result.data ?? result;
        if (Array.isArray(data)) setUnits(data);
      })
      .catch((err) => console.error('Failed to fetch units:', err))
      .finally(() => setUnitsLoading(false));

    // Reset temp password display when opening fresh
    setTempPassword(null);
    setCreatedEmail(null);
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
          Object.entries(result.fields).forEach(([field]) => {
            // @ts-expect-error — dynamic field name
            setValue(field, watch(field), { shouldValidate: false });
          });
        }
        setServerError(result.message || 'Failed to create account');
        return;
      }

      // Show temp password so admin can share it with the new user
      if (result.data?.tempPassword) {
        setTempPassword(result.data.tempPassword);
        setCreatedEmail(result.data.email);
        setSuccessMsg(`Account created for ${result.data.firstName} ${result.data.lastName}.`);
        reset();
        // Do NOT call onSuccess or close here — keep dialog open so admin can see credentials.
        // onSuccess will be called when the admin clicks "Done".
      } else {
        setSuccessMsg(result.message || 'Account created successfully.');
        setTimeout(() => {
          reset();
          setSuccessMsg(null);
          onOpenChange(false);
          onSuccess?.();
        }, 1500);
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Prevent closing via backdrop/escape when temp password is displayed
        if (!isOpen && tempPassword) return;
        onOpenChange(isOpen);
      }}
    >
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
          {tempPassword && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-[14px]">
              <p className="mb-2 font-semibold text-amber-800">Temporary Login Credentials</p>
              <div className="space-y-1 text-amber-700">
                <p>
                  Email: <span className="font-mono font-semibold">{createdEmail}</span>
                </p>
                <p>
                  Password: <span className="font-mono font-semibold">{tempPassword}</span>
                </p>
              </div>
              <p className="mt-3 text-[12px] text-amber-600">
                Share these credentials with the user. They should change their password on first
                login.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Email: ${createdEmail}\nPassword: ${tempPassword}`,
                    );
                  }}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Copy Credentials
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempPassword(null);
                    setCreatedEmail(null);
                    setSuccessMsg(null);
                    onOpenChange(false);
                    onSuccess?.();
                  }}
                  className="rounded-lg border border-amber-300 bg-amber-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-amber-700"
                >
                  Done
                </button>
              </div>
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
              {rolesError && <p className="text-error-600 text-[13px]">{rolesError}</p>}
              <Select
                value={selectedRoleId || undefined}
                onValueChange={(val) => setValue('roleId', val)}
                disabled={rolesLoading}
              >
                <SelectTrigger size="lg" error={!!errors.roleId} className="rounded-xl">
                  <SelectValue
                    placeholder={rolesLoading ? 'Loading roles...' : 'Select a role...'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.roleId.message}</p>
              )}
            </div>

            {isResidentRole && (
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Unit<span className="text-error-500 ml-0.5">*</span>
                </label>
                <Select
                  value={watch('unitId') || undefined}
                  onValueChange={(val) => setValue('unitId', val)}
                  disabled={unitsLoading}
                >
                  <SelectTrigger size="lg" error={!!errors.unitId} className="rounded-xl">
                    <SelectValue
                      placeholder={unitsLoading ? 'Loading units...' : 'Select a unit...'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.number}
                        {unit.floor != null ? ` (Floor ${unit.floor})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Select
              value={watch('languagePreference') || 'en'}
              onValueChange={(val) => setValue('languagePreference', val as 'en' | 'fr')}
            >
              <SelectTrigger size="lg" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Fran&ccedil;ais</SelectItem>
              </SelectContent>
            </Select>
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
