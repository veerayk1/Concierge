'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Building2, ImagePlus, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMEZONES = [
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns',
];

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface SettingsApiData {
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
    unitCount: number;
    timezone: string;
    logo: string | null;
    branding: unknown;
    type: string;
    subscriptionTier: string;
  };
  eventTypes: unknown[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GeneralSettingsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    data: apiData,
    loading,
    error,
    refetch,
  } = useApi<SettingsApiData>(apiUrl('/api/v1/settings', { propertyId: DEMO_PROPERTY_ID }));

  async function handleSave() {
    if (!formRef.current) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const form = new FormData(formRef.current);
    const body = {
      propertyId: DEMO_PROPERTY_ID,
      name: form.get('name') as string,
      address: form.get('address') as string,
      city: form.get('city') as string,
      province: form.get('province') as string,
      postalCode: form.get('postalCode') as string,
      timezone: form.get('timezone') as string,
    };

    try {
      const res = await apiRequest('/api/v1/settings', { method: 'PATCH', body });
      const result = await res.json();

      if (!res.ok) {
        setSaveError(result.message || 'Failed to save settings');
        return;
      }

      setSaveSuccess(true);
      refetch();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const settings = useMemo(() => {
    if (!apiData?.property) return null;
    const p = apiData.property;
    return {
      name: p.name || '',
      address: p.address || '',
      city: p.city || '',
      province: p.province || '',
      postalCode: p.postalCode || '',
      timezone: p.timezone || 'America/Toronto',
      unitCount: p.unitCount ?? 0,
    };
  }, [apiData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load settings"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No property settings found"
          description="This property has not been configured yet. Please contact your administrator."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">General Settings</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure your property details, branding, and general preferences.
        </p>
      </div>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* Property Information */}
        <div>
          <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Property Information
          </h2>
          <Card>
            <CardContent>
              <div className="space-y-5">
                <Input
                  name="name"
                  label="Property Name"
                  defaultValue={settings.name}
                  placeholder="Enter property name"
                  required
                />
                <Input
                  name="address"
                  label="Street Address"
                  defaultValue={settings.address}
                  placeholder="Enter street address"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="city"
                    label="City"
                    defaultValue={settings.city}
                    placeholder="Enter city"
                    required
                  />
                  <Input
                    name="province"
                    label="Province / State"
                    defaultValue={settings.province}
                    placeholder="Enter province"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="postalCode"
                    label="Postal Code"
                    defaultValue={settings.postalCode}
                    placeholder="A1A 1A1"
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="timezone"
                      className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                    >
                      Timezone <span className="text-error-500 ml-0.5">*</span>
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      defaultValue={settings.timezone}
                      className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 ease-out hover:border-neutral-300 focus:ring-4 focus:outline-none"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Total Units"
                  type="number"
                  defaultValue={String(settings.unitCount)}
                  placeholder="Number of units"
                  helperText="Total number of residential and commercial units in the property."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branding */}
        <div>
          <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Branding
          </h2>
          <Card>
            <CardContent>
              <div className="space-y-5">
                {/* Logo Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                    Property Logo
                  </label>
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                      <Building2 className="h-8 w-8 text-neutral-300" />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        <ImagePlus className="h-4 w-4" />
                        Upload Logo
                      </button>
                      <p className="mt-1.5 text-[13px] text-neutral-500">
                        SVG, PNG, or JPG. Max 2 MB. Recommended 256 x 256px.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Brand Color */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="brand-color"
                    className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                  >
                    Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="brand-color"
                      type="color"
                      defaultValue="#2563eb"
                      className="h-[44px] w-[44px] cursor-pointer rounded-xl border border-neutral-200 p-1"
                    />
                    <Input defaultValue="#2563EB" placeholder="#000000" className="max-w-[160px]" />
                    <span className="text-[13px] text-neutral-500">
                      Used for buttons, links, and highlights across the portal.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save feedback */}
        {saveError && (
          <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="border-success-200 bg-success-50 text-success-700 flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px]">
            <Check className="h-4 w-4" />
            Settings saved successfully.
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end pt-2">
          <Button size="lg" type="submit" disabled={saving} onClick={handleSave}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
