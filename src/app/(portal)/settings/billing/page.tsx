'use client';

import { useState } from 'react';
import {
  Check,
  CreditCard,
  Download,
  HardDrive,
  TrendingUp,
  Zap,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface PlanTier {
  name: string;
  price: string;
  priceUnit: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  current?: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    number: 'INV-2026-003',
    date: '2026-03-01',
    amount: 1368.0,
    status: 'pending',
  },
  {
    id: '2',
    number: 'INV-2026-002',
    date: '2026-02-01',
    amount: 1368.0,
    status: 'paid',
  },
  {
    id: '3',
    number: 'INV-2026-001',
    date: '2026-01-01',
    amount: 1368.0,
    status: 'paid',
  },
];

const PLAN_TIERS: PlanTier[] = [
  {
    name: 'Starter',
    price: '$4',
    priceUnit: '/unit/month',
    description: 'Essential features for small properties.',
    features: [
      'Up to 100 units',
      'Event logging',
      'Package tracking',
      'Basic reporting',
      'Email notifications',
      '5 GB storage',
    ],
  },
  {
    name: 'Professional',
    price: '$8',
    priceUnit: '/unit/month',
    description: 'Advanced tools for growing properties.',
    features: [
      'Up to 500 units',
      'All Starter features',
      'Maintenance module',
      'Amenity booking',
      'Multi-channel notifications',
      'Vendor management',
      'Custom reports',
      '50 GB storage',
      'API access',
    ],
    highlighted: true,
    current: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceUnit: '',
    description: 'Full platform for portfolios and management companies.',
    features: [
      'Unlimited units',
      'All Professional features',
      'Multi-property management',
      'White-label branding',
      'Dedicated support',
      'SLA guarantee',
      'Unlimited storage',
      'Advanced API + webhooks',
      'Custom integrations',
      'Compliance reports',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusVariant(status: Invoice['status']): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [selectedPlan] = useState('Professional');

  return (
    <PageShell
      title="Billing & Subscription"
      description="Manage your subscription, payment methods, and invoices."
    >
      {/* Current Plan + Usage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <Badge variant="primary" size="md">
              Professional
            </Badge>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-bold tracking-tight text-neutral-900">$1,368</span>
              <span className="text-[14px] text-neutral-500">/month</span>
            </div>
            <div className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Billing period</span>
                <span className="font-medium text-neutral-900">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Unit count</span>
                <span className="font-medium text-neutral-900">171 units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Per-unit rate</span>
                <span className="font-medium text-neutral-900">$8.00 /unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Next billing date</span>
                <span className="font-medium text-neutral-900">Apr 1, 2026</span>
              </div>
            </div>
            <Button variant="secondary" className="mt-2">
              <TrendingUp className="h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-5">
            {/* Units */}
            <div>
              <div className="mb-2 flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700">Units</span>
                </div>
                <span className="font-medium text-neutral-900">171 / 500</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="bg-primary-500 h-full rounded-full" style={{ width: '34.2%' }} />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="mb-2 flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700">Storage</span>
                </div>
                <span className="font-medium text-neutral-900">12.4 GB / 50 GB</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="bg-info-500 h-full rounded-full" style={{ width: '24.8%' }} />
              </div>
            </div>

            {/* API Calls */}
            <div>
              <div className="mb-2 flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700">API Calls (this month)</span>
                </div>
                <span className="font-medium text-neutral-900">8,421 / 50,000</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="bg-success-500 h-full rounded-full" style={{ width: '16.8%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <Button variant="secondary" size="sm">
            Add Payment Method
          </Button>
        </CardHeader>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white">
              <CreditCard className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">Visa ending in 4242</p>
              <p className="text-[13px] text-neutral-500">Expires 12/2027</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm">
              Default
            </Badge>
            <Button variant="ghost" size="sm">
              Update Payment
            </Button>
          </div>
        </div>
      </Card>

      {/* Invoice History */}
      <Card className="mt-6" padding="none">
        <div className="px-6 pt-6 pb-4">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {MOCK_INVOICES.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-neutral-50/50">
                  <td className="px-6 py-4 text-[14px] font-medium text-neutral-900">
                    {invoice.number}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-neutral-600">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-neutral-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant(invoice.status)} size="sm" dot>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Plan Comparison */}
      <div className="mt-8">
        <h2 className="mb-2 text-[20px] font-bold text-neutral-900">Compare Plans</h2>
        <p className="mb-6 text-[14px] text-neutral-500">
          Choose the plan that best fits your property needs.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLAN_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? 'ring-primary-500 relative ring-2' : ''}
            >
              {tier.current && (
                <Badge variant="primary" size="sm" className="absolute top-4 right-4">
                  Current Plan
                </Badge>
              )}
              <h3 className="text-[18px] font-bold text-neutral-900">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[32px] font-bold tracking-tight text-neutral-900">
                  {tier.price}
                </span>
                {tier.priceUnit && (
                  <span className="text-[14px] text-neutral-500">{tier.priceUnit}</span>
                )}
              </div>
              <p className="mt-2 text-[13px] text-neutral-500">{tier.description}</p>

              <div className="mt-6 flex flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="text-success-500 h-4 w-4 shrink-0" />
                    <span className="text-[13px] text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {tier.current ? (
                  <Button variant="secondary" fullWidth disabled>
                    Current Plan
                  </Button>
                ) : tier.name === 'Enterprise' ? (
                  <Button variant="secondary" fullWidth>
                    Contact Sales
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant={selectedPlan === tier.name ? 'primary' : 'secondary'} fullWidth>
                    {tier.name === 'Starter' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
