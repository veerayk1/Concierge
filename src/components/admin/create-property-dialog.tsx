'use client';

/**
 * Create Property Dialog — Admin panel property creation form
 *
 * Per docs/QUALITY-BAR.md: built on react-hook-form + zodResolver + the
 * typed form primitives. The user sees:
 *  - Inline validation on blur (not just on submit)
 *  - Address autocomplete (if NEXT_PUBLIC_GOOGLE_PLACES_KEY is set)
 *  - Auto-formatted postal code (M5V 2T6 / 90210-1234)
 *  - Auto-formatted phone ((416) 555-0123)
 *  - Auto-validated email (RFC 5321)
 *  - Auto-fill of city/province/postalCode/country when an address
 *    suggestion is picked
 *  - Submit button disabled until form is valid
 *  - "Discard changes?" confirmation when closing with dirty fields
 *
 * Auto-switches property context after creation so admin can immediately manage it.
 */

import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AddressField,
  EmailField,
  PhoneField,
  PostalCodeField,
} from '@/components/forms/primitives';
import {
  createPropertySchema,
  type CreatePropertyInput,
  CANADIAN_TIMEZONES,
  PROPERTIES_TIMEZONE_LABELS,
  PROPERTY_TYPES,
  PROVINCES_AND_STATES,
} from '@/schemas/property';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_VALUES: CreatePropertyInput = {
  name: '',
  slug: '',
  address: '',
  city: '',
  province: 'Ontario',
  postalCode: '',
  country: 'CA',
  type: 'PRODUCTION',
  unitCount: 0,
  timezone: 'America/Toronto',
  phone: '',
  email: '',
};

const TYPE_LABELS: Record<string, string> = {
  PRODUCTION: 'Production',
  DEMO: 'Demo',
  SANDBOX: 'Sandbox',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (propertyId?: string) => void;
  /**
   * If provided, the dialog opens in EDIT mode: pre-fills with this property's
   * current values, changes the title to "Edit Property", and PATCHes instead
   * of POSTing. Pass any object matching CreatePropertyInput plus { id }.
   */
  editingProperty?: (Partial<CreatePropertyInput> & { id: string }) | null;
}

export function CreatePropertyDialog({
  open,
  onOpenChange,
  onSuccess,
  editingProperty,
}: CreatePropertyDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isEditMode = Boolean(editingProperty);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    register,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  // Pre-fill the form when entering edit mode — runs whenever the
  // editingProperty changes (e.g., a different property is selected).
  useEffect(() => {
    if (editingProperty) {
      reset({
        ...DEFAULT_VALUES,
        ...editingProperty,
      } as CreatePropertyInput);
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [editingProperty, reset]);

  const country = watch('country');

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setSuccessMsg(null);

    // Strip empty optional strings so the server doesn't see them as ""
    const payload = {
      ...data,
      slug: data.slug || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
    };

    try {
      const url = isEditMode ? `/api/v1/properties/${editingProperty!.id}` : '/api/v1/properties';
      const method = isEditMode ? 'PATCH' : 'POST';
      const res = await apiRequest(url, { method, body: payload });
      const result = await res.json();

      if (!res.ok) {
        const verb = isEditMode ? 'update' : 'create';
        setServerError(result.message || `Failed to ${verb} property (${res.status})`);
        return;
      }

      const newPropertyId = result.data?.id ?? editingProperty?.id;
      if (newPropertyId && typeof window !== 'undefined' && !isEditMode) {
        // Only switch context on CREATE — when editing, stay where you are.
        localStorage.setItem('demo_propertyId', newPropertyId);
      }

      setSuccessMsg(
        isEditMode
          ? `Saved changes to "${data.name}".`
          : `Property "${result.data?.name || data.name}" created successfully.`,
      );
      setTimeout(() => {
        reset(DEFAULT_VALUES);
        setSuccessMsg(null);
        onOpenChange(false);
        onSuccess?.(newPropertyId);
      }, 1000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Network error. Please try again.');
    }
  });

  const requestClose = (next: boolean) => {
    if (!next && isDirty && !isSubmitting && !successMsg) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(next);
  };

  const discardAndClose = () => {
    reset(DEFAULT_VALUES);
    setServerError(null);
    setConfirmDiscard(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
            <Building2 className="text-primary-500 h-5 w-5" />
            {isEditMode ? 'Edit Property' : 'Add Property'}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-500">
            {isEditMode
              ? 'Update this property’s details. Changes apply immediately.'
              : 'Create a new property. Required fields are marked with an asterisk.'}
          </DialogDescription>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
            {serverError ? (
              <div
                role="alert"
                className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]"
              >
                {serverError}
              </div>
            ) : null}
            {successMsg ? (
              <div
                role="status"
                className="border-success-200 bg-success-50 text-success-700 rounded-xl border px-4 py-3 text-[14px]"
              >
                {successMsg}
              </div>
            ) : null}

            <p className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Property Information
            </p>

            {/* Name + Slug */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('name')}
                label="Property Name"
                required
                placeholder="e.g. Your Property Name"
                autoComplete="organization"
                maxLength={150}
                error={errors.name?.message}
              />
              <Input
                {...register('slug')}
                label="Slug (optional)"
                placeholder="e.g. your-property-name"
                autoComplete="off"
                maxLength={80}
                error={errors.slug?.message}
                helperText="URL-safe identifier. Auto-generated if empty."
              />
            </div>

            {/* Address with autocomplete + sibling auto-fill */}
            <AddressField
              name="address"
              control={control}
              label="Street Address"
              required
              placeholder="e.g. 123 Main Street"
              setValue={setValue}
              siblingFieldNames={{
                city: 'city',
                province: 'province',
                postalCode: 'postalCode',
                country: 'country',
              }}
            />

            {/* City + Province + Postal */}
            <div className="grid grid-cols-3 gap-4">
              <Input
                {...register('city')}
                label="City"
                required
                placeholder="e.g. Toronto"
                autoComplete="address-level2"
                maxLength={100}
                error={errors.city?.message}
              />
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cpd-province"
                  className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                >
                  Province / State
                  <span className="text-error-500 ml-0.5" aria-hidden="true">
                    *
                  </span>
                </label>
                <Select
                  value={watch('province')}
                  onValueChange={(val) =>
                    setValue('province', val as CreatePropertyInput['province'], {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="cpd-province" size="md" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES_AND_STATES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province?.message ? (
                  <p className="text-error-600 text-[13px] font-medium" role="alert">
                    {errors.province.message}
                  </p>
                ) : null}
              </div>
              <PostalCodeField
                name="postalCode"
                control={control}
                label="Postal Code"
                required
                country={country === 'US' ? 'US' : 'CA'}
              />
            </div>

            {/* Country + Total Units */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cpd-country"
                  className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                >
                  Country
                </label>
                <Select
                  value={watch('country')}
                  onValueChange={(val) =>
                    setValue('country', val as 'CA' | 'US', {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="cpd-country" size="md" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                {...register('unitCount', { valueAsNumber: true })}
                type="number"
                min={0}
                max={10000}
                label="Total Units"
                placeholder="0"
                error={errors.unitCount?.message}
              />
            </div>

            {/* Type + Timezone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cpd-type"
                  className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                >
                  Type
                  <span className="text-error-500 ml-0.5" aria-hidden="true">
                    *
                  </span>
                </label>
                <Select
                  value={watch('type')}
                  onValueChange={(val) =>
                    setValue('type', val as CreatePropertyInput['type'], {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="cpd-type" size="md" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t] ?? t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="cpd-tz"
                  className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                >
                  Timezone
                </label>
                <Select
                  value={watch('timezone')}
                  onValueChange={(val) =>
                    setValue('timezone', val, { shouldValidate: true, shouldDirty: true })
                  }
                >
                  <SelectTrigger id="cpd-tz" size="md" className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANADIAN_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {PROPERTIES_TIMEZONE_LABELS[tz] ?? tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="mt-2 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Contact (Optional)
            </p>

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-4">
              <PhoneField
                name="phone"
                control={control}
                label="Phone"
                defaultCountry={country === 'US' ? 'US' : 'CA'}
              />
              <EmailField name="email" control={control} label="Email" />
            </div>

            <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => requestClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditMode ? 'Saving…' : 'Creating…'}
                  </>
                ) : isEditMode ? (
                  'Save Changes'
                ) : (
                  'Create Property'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="text-base font-semibold">Discard changes?</DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            You have unsaved changes. Closing now will lose them.
          </DialogDescription>
          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDiscard(false)}
            >
              Keep editing
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={discardAndClose}>
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
