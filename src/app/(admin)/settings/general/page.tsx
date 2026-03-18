'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Mock Data
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
// Component
// ---------------------------------------------------------------------------

export default function GeneralSettingsPage() {
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

      {/* Property Information */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Property Information
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <Input
                label="Property Name"
                defaultValue="The Residence at Harbourfront"
                placeholder="Enter property name"
                required
              />
              <Input
                label="Street Address"
                defaultValue="225 Queens Quay West"
                placeholder="Enter street address"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" defaultValue="Toronto" placeholder="Enter city" required />
                <Input
                  label="Province / State"
                  defaultValue="Ontario"
                  placeholder="Enter province"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Postal Code" defaultValue="M5J 1B5" placeholder="A1A 1A1" required />
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="timezone"
                    className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
                  >
                    Timezone <span className="text-error-500 ml-0.5">*</span>
                  </label>
                  <select
                    id="timezone"
                    defaultValue="America/Toronto"
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
                defaultValue="342"
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

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
