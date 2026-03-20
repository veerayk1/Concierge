'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types (aligned with API response from /api/v1/settings)
// ---------------------------------------------------------------------------

interface PropertySettings {
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
    branding: Record<string, unknown> | null;
    type: string;
    subscriptionTier: string | null;
  };
  eventTypes: unknown[];
}

// Security company fields stored in branding JSON
interface SecurityCompanyData {
  companyName: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
  contractStartDate: string;
  contractEndDate: string;
  licenseNumber: string;
  insuranceExpiry: string;
  notes: string;
  brandedReportHeader: boolean;
}

const DEFAULT_SECURITY: SecurityCompanyData = {
  companyName: '',
  primaryContactName: '',
  primaryContactPhone: '',
  primaryContactEmail: '',
  contractStartDate: '',
  contractEndDate: '',
  licenseNumber: '',
  insuranceExpiry: '',
  notes: '',
  brandedReportHeader: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInsuranceExpiryWarning(expiryDate: string): string | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return `Expires in ${diffDays} days`;
  if (diffDays <= 90) return `Expires in ${Math.ceil(diffDays / 30)} months`;
  return null;
}

function getInsuranceBadgeVariant(expiryDate: string): 'error' | 'warning' | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'error';
  if (diffDays <= 90) return 'warning';
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SecurityCompanyPage() {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch settings from API
  const {
    data: settingsData,
    loading,
    error,
    refetch,
  } = useApi<PropertySettings>(apiUrl('/api/v1/settings', { propertyId: getPropertyId() }));

  // Extract security company data from branding JSON
  const [formData, setFormData] = useState<SecurityCompanyData>(DEFAULT_SECURITY);
  const [brandedReportHeader, setBrandedReportHeader] = useState(false);

  useEffect(() => {
    if (settingsData?.property?.branding) {
      const branding = settingsData.property.branding as Record<string, unknown>;
      const security = (branding.securityCompany as SecurityCompanyData) || DEFAULT_SECURITY;
      setFormData({
        ...DEFAULT_SECURITY,
        ...security,
      });
      setBrandedReportHeader(security.brandedReportHeader ?? false);
    }
  }, [settingsData]);

  const handleFieldChange = useCallback((field: keyof SecurityCompanyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const updatedSecurityData: SecurityCompanyData = {
        ...formData,
        brandedReportHeader,
      };

      const currentBranding = (settingsData?.property?.branding as Record<string, unknown>) ?? {};

      const response = await apiRequest('/api/v1/settings', {
        method: 'PATCH',
        body: {
          propertyId: getPropertyId(),
          branding: {
            ...currentBranding,
            securityCompany: updatedSecurityData,
          },
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setSaveMessage(result.message || 'Failed to save changes.');
        return;
      }

      setSaveMessage('Changes saved successfully.');
      refetch();
    } catch {
      setSaveMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formData, brandedReportHeader, settingsData, refetch]);

  const insuranceWarning = getInsuranceExpiryWarning(formData.insuranceExpiry);
  const insuranceBadgeVariant = getInsuranceBadgeVariant(formData.insuranceExpiry);

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
            Security Company
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Manage the security company details, contract information, and compliance documents.
          </p>
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load security company settings"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
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
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Security Company</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Manage the security company details, contract information, and compliance documents.
        </p>
      </div>

      {/* Company Information */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Company Information
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <Input
                label="Company Name"
                value={formData.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="Enter security company name"
                required
              />

              {/* Logo Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700">
                  Company Logo
                </label>
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                    <Shield className="h-8 w-8 text-neutral-300" />
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Contact */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Primary Contact
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <Input
                label="Contact Name"
                value={formData.primaryContactName}
                onChange={(e) => handleFieldChange('primaryContactName', e.target.value)}
                placeholder="Full name"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.primaryContactPhone}
                  onChange={(e) => handleFieldChange('primaryContactPhone', e.target.value)}
                  placeholder="(416) 555-0000"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => handleFieldChange('primaryContactEmail', e.target.value)}
                  placeholder="contact@company.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract & Compliance */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Contract &amp; Compliance
        </h2>
        <Card>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contract Start Date"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => handleFieldChange('contractStartDate', e.target.value)}
                  required
                />
                <Input
                  label="Contract End Date"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => handleFieldChange('contractEndDate', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="License Number"
                  value={formData.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                  placeholder="e.g., ON-PSA-2024-XXXXX"
                  helperText="Provincial security license identifier."
                />
                <div>
                  <Input
                    label="Insurance Expiry"
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => handleFieldChange('insuranceExpiry', e.target.value)}
                  />
                  {insuranceWarning && insuranceBadgeVariant && (
                    <div className="mt-2">
                      <Badge variant={insuranceBadgeVariant} size="md" dot>
                        {insuranceWarning}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Notes
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="security-notes"
                className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
              >
                Internal Notes
              </label>
              <textarea
                id="security-notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Add any notes about the security company, contract terms, or special arrangements..."
                className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 ease-out hover:border-neutral-300 focus:ring-4 focus:outline-none"
              />
              <p className="text-[13px] text-neutral-500">
                These notes are visible to property managers and administrators only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Branding */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Report Settings
        </h2>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-900">
                  Branded Report Header
                </h3>
                <p className="text-[13px] text-neutral-500">
                  Include the security company logo and name in exported report headers.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={brandedReportHeader}
                onClick={() => setBrandedReportHeader(!brandedReportHeader)}
                className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
                  brandedReportHeader ? 'bg-primary-500' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    brandedReportHeader ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {saveMessage && (
          <span
            className={`text-[14px] ${
              saveMessage.includes('success') ? 'text-success-600' : 'text-error-600'
            }`}
          >
            {saveMessage}
          </span>
        )}
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
