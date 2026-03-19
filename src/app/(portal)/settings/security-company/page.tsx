'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_COMPANY = {
  companyName: 'Royal Concierge and Security',
  primaryContactName: 'James Whitfield',
  primaryContactPhone: '(416) 555-0199',
  primaryContactEmail: 'j.whitfield@royalconcierge.ca',
  contractStartDate: '2025-01-01',
  contractEndDate: '2026-12-31',
  licenseNumber: 'ON-PSA-2024-08812',
  insuranceExpiry: '2026-06-30',
  notes:
    'Contracted for 24/7 concierge and security services. Includes lobby coverage, patrol rounds, and emergency response. Insurance renewal pending for Q3.',
  brandedReportHeader: true,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SecurityCompanyPage() {
  const [brandedReportHeader, setBrandedReportHeader] = useState(MOCK_COMPANY.brandedReportHeader);

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
                defaultValue={MOCK_COMPANY.companyName}
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
                defaultValue={MOCK_COMPANY.primaryContactName}
                placeholder="Full name"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  type="tel"
                  defaultValue={MOCK_COMPANY.primaryContactPhone}
                  placeholder="(416) 555-0000"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={MOCK_COMPANY.primaryContactEmail}
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
                  defaultValue={MOCK_COMPANY.contractStartDate}
                  required
                />
                <Input
                  label="Contract End Date"
                  type="date"
                  defaultValue={MOCK_COMPANY.contractEndDate}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="License Number"
                  defaultValue={MOCK_COMPANY.licenseNumber}
                  placeholder="e.g., ON-PSA-2024-XXXXX"
                  helperText="Provincial security license identifier."
                />
                <div>
                  <Input
                    label="Insurance Expiry"
                    type="date"
                    defaultValue={MOCK_COMPANY.insuranceExpiry}
                  />
                  <div className="mt-2">
                    <Badge variant="warning" size="md" dot>
                      Expires in 3 months
                    </Badge>
                  </div>
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
                defaultValue={MOCK_COMPANY.notes}
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
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
