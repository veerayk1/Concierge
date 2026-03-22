'use client';

/**
 * Step 1: Property Details (Required)
 * Manual form entry to create a new property.
 * File import is not supported for Step 1 because subsequent steps
 * depend on the propertyId returned immediately after creation.
 */

import { useState, useCallback } from 'react';
import { Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StepHeader } from '../shared/step-header';

interface StepPropertyDetailsProps {
  onPropertyCreated: (propertyId: string, propertyName: string) => void;
}

export function StepPropertyDetails({ onPropertyCreated }: StepPropertyDetailsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('CA');
  const [postalCode, setPostalCode] = useState('');
  const [unitCount, setUnitCount] = useState('');
  const [timezone, setTimezone] = useState('America/Toronto');
  const [propertyCode, setPropertyCode] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      setIsSubmitting(true);

      try {
        const token = localStorage.getItem('auth_token');
        const demoRole = localStorage.getItem('demo_role');

        const response = await fetch('/api/v1/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(demoRole && { 'x-demo-role': demoRole }),
          },
          body: JSON.stringify({
            name,
            address,
            city,
            province,
            country,
            postalCode: postalCode || undefined,
            unitCount: unitCount ? parseInt(unitCount, 10) : undefined,
            timezone,
            propertyCode: propertyCode || undefined,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setServerError(err.message || 'Failed to create property');
          return;
        }

        const result = await response.json();
        const propertyId = result.data?.id || result.id || 'new-property';
        onPropertyCreated(propertyId, name);
      } catch {
        setServerError('Network error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      name,
      address,
      city,
      province,
      country,
      postalCode,
      unitCount,
      timezone,
      propertyCode,
      onPropertyCreated,
    ],
  );

  return (
    <div>
      <StepHeader
        stepNumber={1}
        title="Property Details"
        description="Enter the basic information about your property to get started."
        required
      />

      {/* Info banner about file imports */}
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-[13px] text-blue-700">
          Enter property details manually. You can import units, residents, and other data in
          subsequent steps.
        </p>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
          )}

          <Input
            label="Property Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Maple Heights Condominiums"
          />

          <Input
            label="Address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 100 Main Street"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Toronto"
            />
            <Input
              label="Province / State"
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="e.g., ON"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-neutral-700">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900"
              >
                <option value="CA">Canada</option>
                <option value="US">United States</option>
              </select>
            </div>
            <Input
              label="Postal / Zip Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g., M5V 3L9"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-[14px] font-medium text-neutral-700">
                Unit Count (estimate)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={unitCount}
                  onChange={(e) => setUnitCount(e.target.value)}
                  placeholder="e.g., 200"
                />
                <span
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-help text-neutral-400"
                  title="Approximate number of units. This will be updated automatically as units are imported."
                >
                  <Info className="h-4 w-4" />
                </span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[14px] font-medium text-neutral-700">
                Timezone
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900"
                  title="Used for scheduling, notifications, and report timestamps"
                >
                  <option value="America/Toronto">Eastern (Toronto)</option>
                  <option value="America/Chicago">Central (Chicago)</option>
                  <option value="America/Denver">Mountain (Denver)</option>
                  <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                  <option value="America/Vancouver">Pacific (Vancouver)</option>
                  <option value="America/Edmonton">Mountain (Edmonton)</option>
                  <option value="America/Winnipeg">Central (Winnipeg)</option>
                  <option value="America/Halifax">Atlantic (Halifax)</option>
                  <option value="America/St_Johns">Newfoundland (St. John&apos;s)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[14px] font-medium text-neutral-700">
              Property Code
            </label>
            <div className="relative">
              <Input
                value={propertyCode}
                onChange={(e) => setPropertyCode(e.target.value)}
                placeholder="e.g., MPL-HTS (optional)"
              />
              <span
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-help text-neutral-400"
                title="A short unique identifier for this property (e.g., MPL-HTS). Used for login routing and internal reference."
              >
                <Info className="h-4 w-4" />
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !name || !address || !city || !province}
            fullWidth
            size="lg"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Property
          </Button>
        </form>
      </Card>
    </div>
  );
}
