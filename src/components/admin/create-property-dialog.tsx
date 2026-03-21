'use client';

/**
 * Create Property Dialog — Admin panel property creation form
 * Fields: name, address, city, province, postalCode, country, unitCount, timezone
 * Auto-switches property context after creation so admin can immediately manage it.
 */

import { useState } from 'react';
import { Building2 } from 'lucide-react';

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
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon',
];

const TIMEZONES = [
  { value: 'America/Toronto', label: 'Toronto (Eastern)' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific)' },
  { value: 'America/Edmonton', label: 'Edmonton (Mountain)' },
  { value: 'America/Winnipeg', label: 'Winnipeg (Central)' },
  { value: 'America/Halifax', label: 'Halifax (Atlantic)' },
  { value: 'America/St_Johns', label: "St. John's (Newfoundland)" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (propertyId?: string) => void;
}

export function CreatePropertyDialog({ open, onOpenChange, onSuccess }: CreatePropertyDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    province: 'Ontario',
    postalCode: '',
    country: 'CA',
    unitCount: 0,
    timezone: 'America/Toronto',
  });

  function updateField(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest('/api/v1/properties', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setServerError(result.message || `Failed to create property (${response.status})`);
        return;
      }

      const result = await response.json();
      const newPropertyId = result.data?.id;

      // Auto-switch property context so the admin can immediately manage this property
      if (newPropertyId && typeof window !== 'undefined') {
        localStorage.setItem('demo_propertyId', newPropertyId);
      }

      // Reset and close
      setFormData({
        name: '',
        address: '',
        city: '',
        province: 'Ontario',
        postalCode: '',
        country: 'CA',
        unitCount: 0,
        timezone: 'America/Toronto',
      });
      onOpenChange(false);
      onSuccess?.(newPropertyId);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div className="flex items-center gap-3 pb-2">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">Add Property</DialogTitle>
            <DialogDescription className="text-sm text-neutral-500">
              Create a new building or property. System roles will be auto-created.
            </DialogDescription>
          </div>
        </div>

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Property Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Harbourfront Residences"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Address <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="e.g. 100 Queens Quay West"
              required
            />
          </div>

          {/* City + Province */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                City <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="e.g. Toronto"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Province <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.province}
                onValueChange={(val) => updateField('province', val)}
              >
                <SelectTrigger size="md" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Postal Code + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                placeholder="e.g. M5J 2Y5"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Country</label>
              <Select value={formData.country} onValueChange={(val) => updateField('country', val)}>
                <SelectTrigger size="md" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit Count + Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Number of Units
              </label>
              <Input
                type="number"
                min={0}
                value={formData.unitCount}
                onChange={(e) => updateField('unitCount', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Timezone</label>
              <Select
                value={formData.timezone}
                onValueChange={(val) => updateField('timezone', val)}
              >
                <SelectTrigger size="md" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
