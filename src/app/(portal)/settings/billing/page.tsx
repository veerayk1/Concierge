'use client';

import { useState, useMemo } from 'react';
import {
  Check,
  CreditCard,
  Download,
  HardDrive,
  TrendingUp,
  Zap,
  Building2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useCallback } from 'react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types (aligned with API responses)
// ---------------------------------------------------------------------------

interface SubscriptionData {
  id?: string;
  propertyId: string;
  tier: string | null;
  status: string;
  billingCycle?: string;
  price?: number; // cents per unit
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  canceledAt?: string | null;
  trialEndsAt?: string | null;
  usage?: {
    unitCount: number;
    userCount: number;
    maxUnits: number | null;
    maxUsers: number | null;
    features: string[];
  };
}

interface Invoice {
  id: string;
  amount: number;
  tax: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  createdAt: string;
}

interface InvoicesResponse {
  data: Invoice[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
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
// Static plan tiers (these are marketing info, not from API)
// ---------------------------------------------------------------------------

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

function formatCurrency(amount: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
    case 'open':
    case 'draft':
      return 'warning';
    case 'overdue':
    case 'uncollectible':
    case 'void':
      return 'error';
    default:
      return 'default';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [selectedPlan] = useState('Professional');

  // Fetch subscription data
  const {
    data: subscription,
    loading: subLoading,
    error: subError,
    refetch: refetchSub,
  } = useApi<SubscriptionData>(apiUrl('/api/v1/billing', { propertyId: getPropertyId() }));

  // Fetch invoices
  const {
    data: invoicesResponse,
    loading: invLoading,
    error: invError,
    refetch: refetchInv,
  } = useApi<InvoicesResponse>(apiUrl('/api/v1/billing/invoices', { propertyId: getPropertyId() }));

  const invoices: Invoice[] = useMemo(() => {
    if (!invoicesResponse) return [];
    // The useApi hook extracts .data automatically, but invoicesResponse may be the full response or just data
    if (Array.isArray(invoicesResponse)) return invoicesResponse as unknown as Invoice[];
    if (Array.isArray((invoicesResponse as InvoicesResponse).data))
      return (invoicesResponse as InvoicesResponse).data;
    return [];
  }, [invoicesResponse]);

  const loading = subLoading || invLoading;
  const error = subError || invError;

  // Stripe checkout handler
  const handleUpgrade = useCallback(async (tier: 'starter' | 'professional' | 'enterprise') => {
    try {
      const resp = await apiRequest('/api/v1/billing/checkout', {
        method: 'POST',
        body: {
          propertyId: getPropertyId(),
          tier,
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/settings/billing?cancelled=true`,
        },
      });
      const result = (await resp.json()) as { data?: { checkoutUrl?: string } };
      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        alert('Unable to start checkout. Please ensure Stripe is configured.');
      }
    } catch {
      alert('Unable to start checkout. Please try again or contact support.');
    }
  }, []);

  // Stripe billing portal handler (for payment method management)
  const handleManagePayment = useCallback(async () => {
    try {
      const resp = await apiRequest('/api/v1/billing', {
        method: 'POST',
        body: {
          propertyId: getPropertyId(),
          action: 'create_portal_session',
          returnUrl: window.location.href,
        },
      });
      const result = (await resp.json()) as { data?: { portalUrl?: string } };
      if (result.data?.portalUrl) {
        window.location.href = result.data.portalUrl;
      } else {
        alert('Unable to open billing portal. Please ensure Stripe is configured.');
      }
    } catch {
      alert('Unable to open billing portal. Please try again or contact support.');
    }
  }, []);

  // Mark current plan tier
  const planTiers = useMemo(() => {
    const currentTier = subscription?.tier?.toLowerCase() ?? 'professional';
    return PLAN_TIERS.map((tier) => ({
      ...tier,
      current: tier.name.toLowerCase() === currentTier,
      highlighted: tier.name.toLowerCase() === currentTier,
    }));
  }, [subscription]);

  const unitCount = subscription?.usage?.unitCount ?? 0;
  const maxUnits = subscription?.usage?.maxUnits ?? 500;
  const pricePerUnit = subscription?.price ?? 800; // cents
  const monthlyTotal = unitCount * pricePerUnit;
  const tierName = subscription?.tier
    ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
    : 'Professional';

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Billing & Subscription"
        description="Manage your subscription, payment methods, and invoices."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-32 rounded-2xl" />
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell
        title="Billing & Subscription"
        description="Manage your subscription, payment methods, and invoices."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load billing information"
          description={error}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refetchSub();
                refetchInv();
              }}
            >
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

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
              {tierName}
            </Badge>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-bold tracking-tight text-neutral-900">
                {formatCurrency(monthlyTotal)}
              </span>
              <span className="text-[14px] text-neutral-500">/month</span>
            </div>
            <div className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Billing period</span>
                <span className="font-medium text-neutral-900">
                  {subscription?.billingCycle
                    ? subscription.billingCycle.charAt(0).toUpperCase() +
                      subscription.billingCycle.slice(1)
                    : 'Monthly'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Unit count</span>
                <span className="font-medium text-neutral-900">{unitCount} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Per-unit rate</span>
                <span className="font-medium text-neutral-900">
                  {formatCurrency(pricePerUnit)} /unit
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Next billing date</span>
                <span className="font-medium text-neutral-900">
                  {subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate) : '--'}
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => handleUpgrade('professional')}
            >
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
                <span className="font-medium text-neutral-900">
                  {unitCount} / {maxUnits ?? 'Unlimited'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="bg-primary-500 h-full rounded-full"
                  style={{
                    width: `${maxUnits ? Math.min((unitCount / maxUnits) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Storage placeholder — not tracked in current API */}
            <div>
              <div className="mb-2 flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700">Storage</span>
                </div>
                <span className="font-medium text-neutral-900">-- / --</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="bg-info-500 h-full rounded-full" style={{ width: '0%' }} />
              </div>
            </div>

            {/* API Calls placeholder */}
            <div>
              <div className="mb-2 flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700">API Calls (this month)</span>
                </div>
                <span className="font-medium text-neutral-900">-- / --</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                <div className="bg-success-500 h-full rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <Button variant="secondary" size="sm" onClick={handleManagePayment}>
            Add Payment Method
          </Button>
        </CardHeader>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white">
              <CreditCard className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">
                {subscription?.status === 'none'
                  ? 'No payment method on file'
                  : 'Payment method on file'}
              </p>
              <p className="text-[13px] text-neutral-500">Managed via Stripe billing portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm">
              Default
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleManagePayment}>
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
        {invoices.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={<CreditCard className="h-6 w-6" />}
              title="No invoices yet"
              description="Invoices will appear here once your first billing cycle completes."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80">
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-[0.04em] text-neutral-500 uppercase">
                    Period
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-[14px] font-medium text-neutral-900">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-neutral-600">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-neutral-900">
                      {formatCurrency(invoice.amount, invoice.currency || 'CAD')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant(invoice.status)} size="sm" dot>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.pdfUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.pdfUrl!, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-[13px] text-neutral-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Plan Comparison */}
      <div className="mt-8">
        <h2 className="mb-2 text-[20px] font-bold text-neutral-900">Compare Plans</h2>
        <p className="mb-6 text-[14px] text-neutral-500">
          Choose the plan that best fits your property needs.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {planTiers.map((tier) => (
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
                  <Button variant="secondary" fullWidth onClick={() => handleUpgrade('enterprise')}>
                    Contact Sales
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant={selectedPlan === tier.name ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={() => handleUpgrade('professional')}
                  >
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
