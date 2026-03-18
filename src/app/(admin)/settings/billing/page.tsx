'use client';

import Link from 'next/link';
import { ArrowLeft, Check, CreditCard, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const PLAN_FEATURES = [
  'Unlimited events and packages',
  'Up to 500 units',
  'All notification channels (email, SMS, push)',
  'Amenity booking with payments',
  'Maintenance management',
  'AI auto-categorization',
  'Custom roles and permissions',
  'Priority email support',
];

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

const INVOICES: Invoice[] = [
  {
    id: 'INV-2026-003',
    date: 'Mar 1, 2026',
    amount: '$299.00',
    status: 'pending',
    description: 'Professional Plan - March 2026',
  },
  {
    id: 'INV-2026-002',
    date: 'Feb 1, 2026',
    amount: '$299.00',
    status: 'paid',
    description: 'Professional Plan - February 2026',
  },
  {
    id: 'INV-2026-001',
    date: 'Jan 1, 2026',
    amount: '$299.00',
    status: 'paid',
    description: 'Professional Plan - January 2026',
  },
  {
    id: 'INV-2025-012',
    date: 'Dec 1, 2025',
    amount: '$299.00',
    status: 'paid',
    description: 'Professional Plan - December 2025',
  },
  {
    id: 'INV-2025-011',
    date: 'Nov 1, 2025',
    amount: '$249.00',
    status: 'paid',
    description: 'Starter Plan - November 2025',
  },
  {
    id: 'INV-2025-010',
    date: 'Oct 1, 2025',
    amount: '$249.00',
    status: 'paid',
    description: 'Starter Plan - October 2025',
  },
];

const INVOICE_COLUMNS: Column<Invoice>[] = [
  {
    id: 'id',
    header: 'Invoice',
    accessorKey: 'id',
    sortable: true,
    cell: (row) => <span className="font-medium text-neutral-900">{row.id}</span>,
  },
  {
    id: 'date',
    header: 'Date',
    accessorKey: 'date',
    sortable: true,
  },
  {
    id: 'description',
    header: 'Description',
    accessorKey: 'description',
  },
  {
    id: 'amount',
    header: 'Amount',
    accessorKey: 'amount',
    sortable: true,
    cell: (row) => <span className="font-semibold text-neutral-900">{row.amount}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: (row) => {
      const variant =
        row.status === 'paid' ? 'success' : row.status === 'pending' ? 'warning' : 'error';
      return (
        <Badge variant={variant} size="sm" dot>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: () => (
      <button
        type="button"
        className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1 text-[13px] font-medium transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        PDF
      </button>
    ),
    className: 'text-right',
    headerClassName: 'text-right',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BillingPage() {
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
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Manage your subscription plan, invoices, and payment methods.
        </p>
      </div>

      {/* Current Plan */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Current Plan
        </h2>
        <Card>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[20px] font-bold text-neutral-900">Professional</h3>
                  <Badge variant="primary" size="md">
                    Current Plan
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] text-neutral-500">
                  Billed monthly. Next invoice on{' '}
                  <span className="font-medium text-neutral-700">April 1, 2026</span>.
                </p>
              </div>
              <div className="text-right">
                <div className="text-[28px] font-bold text-neutral-900">
                  $299
                  <span className="text-[14px] font-normal text-neutral-400">/mo</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {PLAN_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="bg-success-50 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-success-600 h-3 w-3" />
                  </div>
                  <span className="text-[13px] text-neutral-600">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3 border-t border-neutral-100 pt-5">
              <Button variant="secondary" size="sm">
                Change Plan
              </Button>
              <Button variant="ghost" size="sm">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Payment Method
        </h2>
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-info-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <CreditCard className="text-info-600 h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-neutral-900">
                    Visa ending in 4242
                  </h3>
                  <Badge variant="default" size="sm">
                    Default
                  </Badge>
                </div>
                <p className="text-[13px] text-neutral-500">Expires 12/2028</p>
              </div>
              <Button variant="secondary" size="sm">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Invoice History
        </h2>
        <DataTable
          columns={INVOICE_COLUMNS}
          data={INVOICES}
          emptyMessage="No invoices yet."
          emptyIcon={<Receipt className="h-5 w-5" />}
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
