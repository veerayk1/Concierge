'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Download,
  Building2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Shield,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types matching /api/v1/billing response
// ---------------------------------------------------------------------------

interface BillingData {
  id?: string;
  propertyId: string;
  tier: string | null;
  status: string;
  billingCycle?: string;
  price?: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  trial: 'info' as 'default',
  past_due: 'warning',
  canceled: 'error',
  expired: 'error',
  none: 'default',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(cents: number | undefined): string {
  if (!cents) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

function tierLabel(tier: string | null): string {
  if (!tier) return 'No Plan';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlatformBillingPage() {
  const {
    data: billing,
    loading,
    error,
    refetch,
  } = useApi<BillingData>(apiUrl('/api/v1/billing', { propertyId: getPropertyId() }));

  return (
    <PageShell
      title="Platform Billing"
      description="Subscription status, usage, and billing details for this property."
      actions={
        <Button variant="secondary" size="sm">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading billing information...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load billing data"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* No Subscription */}
      {!loading && !error && billing && billing.status === 'none' && (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="No active subscription"
          description="This property does not have an active subscription. Set up billing to unlock all features."
          action={
            <Button size="sm">
              <CreditCard className="h-4 w-4" />
              Set Up Billing
            </Button>
          }
        />
      )}

      {/* Active Subscription */}
      {!loading && !error && billing && billing.status !== 'none' && (
        <>
          {/* Subscription Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                  <CreditCard className="text-primary-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] text-neutral-500">Current Plan</p>
                  <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                    {tierLabel(billing.tier)}
                  </p>
                  <Badge variant={statusVariant[billing.status] || 'default'} size="sm" dot>
                    {billing.status.charAt(0).toUpperCase() +
                      billing.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                  <DollarSign className="text-success-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] text-neutral-500">Monthly Price</p>
                  <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                    {billing.price ? formatPrice(billing.price) : 'Custom'}
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    per unit / {billing.billingCycle || 'month'}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Clock className="text-info-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] text-neutral-500">Next Billing Date</p>
                  <p className="text-[20px] font-bold tracking-tight text-neutral-900">
                    {formatDate(billing.nextBillingDate)}
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    Period: {formatDate(billing.currentPeriodStart)} -{' '}
                    {formatDate(billing.currentPeriodEnd)}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Building2 className="text-warning-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] text-neutral-500">Property</p>
                  <p className="text-[16px] font-bold tracking-tight text-neutral-900">
                    {billing.propertyId.slice(0, 8)}...
                  </p>
                  {billing.canceledAt && (
                    <p className="text-error-600 text-[12px]">
                      Cancelled: {formatDate(billing.canceledAt)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Usage + Features */}
          {billing.usage && (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Usage */}
              <div>
                <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Usage</h2>
                <Card padding="md">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-neutral-400" />
                        <span className="text-[14px] text-neutral-700">Units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[15px] font-bold text-neutral-900">
                          {billing.usage.unitCount}
                        </span>
                        <span className="text-[13px] text-neutral-400">
                          {' '}
                          / {billing.usage.maxUnits ?? 'Unlimited'}
                        </span>
                      </div>
                    </div>
                    {billing.usage.maxUnits && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            billing.usage.unitCount / billing.usage.maxUnits > 0.9
                              ? 'bg-error-500'
                              : billing.usage.unitCount / billing.usage.maxUnits > 0.7
                                ? 'bg-warning-500'
                                : 'bg-primary-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (billing.usage.unitCount / billing.usage.maxUnits) * 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-[14px] text-neutral-700">Users</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[15px] font-bold text-neutral-900">
                          {billing.usage.userCount}
                        </span>
                        <span className="text-[13px] text-neutral-400">
                          {' '}
                          / {billing.usage.maxUsers ?? 'Unlimited'}
                        </span>
                      </div>
                    </div>
                    {billing.usage.maxUsers && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            billing.usage.userCount / billing.usage.maxUsers > 0.9
                              ? 'bg-error-500'
                              : billing.usage.userCount / billing.usage.maxUsers > 0.7
                                ? 'bg-warning-500'
                                : 'bg-primary-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (billing.usage.userCount / billing.usage.maxUsers) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Plan Features */}
              <div>
                <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Plan Features</h2>
                <Card padding="md">
                  {billing.usage.features.length === 0 ? (
                    <p className="text-[13px] text-neutral-500">
                      No feature information available.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {billing.usage.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <CheckCircle2 className="text-success-500 h-4 w-4 shrink-0" />
                          <span className="text-[14px] text-neutral-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="mt-8">
            <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
              Subscription Details
            </h2>
            <Card padding="md">
              <div className="space-y-4">
                {billing.id && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-500">Subscription ID</span>
                    <span className="font-mono text-[13px] text-neutral-900">{billing.id}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                  <span className="text-[13px] text-neutral-500">Billing Cycle</span>
                  <span className="text-[13px] font-medium text-neutral-900">
                    {billing.billingCycle
                      ? billing.billingCycle.charAt(0).toUpperCase() + billing.billingCycle.slice(1)
                      : 'N/A'}
                  </span>
                </div>
                {billing.stripeCustomerId && (
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <span className="text-[13px] text-neutral-500">Stripe Customer</span>
                    <span className="font-mono text-[13px] text-neutral-900">
                      {billing.stripeCustomerId}
                    </span>
                  </div>
                )}
                {billing.trialEndsAt && (
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <span className="text-[13px] text-neutral-500">Trial Ends</span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {formatDate(billing.trialEndsAt)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
