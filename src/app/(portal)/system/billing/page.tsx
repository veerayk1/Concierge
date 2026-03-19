'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CreditCard,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  BarChart3,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevenueCard {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: typeof DollarSign;
  iconColor: string;
  iconBg: string;
}

interface SubscriptionTier {
  name: string;
  count: number;
  revenue: string;
  pricePerUnit: string;
  color: string;
  percentage: number;
}

interface Transaction {
  id: string;
  property: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  plan: string;
}

interface DunningAlert {
  property: string;
  amount: string;
  failedAt: string;
  attempts: number;
  nextRetry: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const REVENUE_CARDS: RevenueCard[] = [
  {
    label: 'Monthly Recurring Revenue',
    value: '$48,750',
    change: '+12.3% vs last month',
    changeType: 'positive',
    icon: DollarSign,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
  },
  {
    label: 'Annual Run Rate',
    value: '$585,000',
    change: '+18.2% YoY',
    changeType: 'positive',
    icon: TrendingUp,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  {
    label: 'Active Subscriptions',
    value: '127',
    change: '+8 this month',
    changeType: 'positive',
    icon: Users,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    label: 'Churn Rate',
    value: '1.2%',
    change: '-0.3% vs last month',
    changeType: 'positive',
    icon: ArrowDownRight,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
  },
];

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    name: 'Starter',
    count: 42,
    revenue: '$8,400',
    pricePerUnit: '$200/mo',
    color: 'bg-neutral-400',
    percentage: 33,
  },
  {
    name: 'Professional',
    count: 58,
    revenue: '$23,200',
    pricePerUnit: '$400/mo',
    color: 'bg-primary-500',
    percentage: 46,
  },
  {
    name: 'Enterprise',
    count: 27,
    revenue: '$17,150',
    pricePerUnit: '$635/mo',
    color: 'bg-success-500',
    percentage: 21,
  },
];

const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001',
    property: 'Harbourview Condos',
    amount: '$635.00',
    date: '2026-03-19',
    status: 'paid',
    plan: 'Enterprise',
  },
  {
    id: 'TXN-002',
    property: 'Maple Ridge Towers',
    amount: '$400.00',
    date: '2026-03-19',
    status: 'paid',
    plan: 'Professional',
  },
  {
    id: 'TXN-003',
    property: 'Lakeside Residences',
    amount: '$200.00',
    date: '2026-03-18',
    status: 'paid',
    plan: 'Starter',
  },
  {
    id: 'TXN-004',
    property: 'The Wellington',
    amount: '$400.00',
    date: '2026-03-18',
    status: 'pending',
    plan: 'Professional',
  },
  {
    id: 'TXN-005',
    property: 'Parkdale Commons',
    amount: '$635.00',
    date: '2026-03-17',
    status: 'paid',
    plan: 'Enterprise',
  },
  {
    id: 'TXN-006',
    property: 'Riverside Place',
    amount: '$400.00',
    date: '2026-03-17',
    status: 'failed',
    plan: 'Professional',
  },
];

const DUNNING_ALERTS: DunningAlert[] = [
  {
    property: 'Riverside Place',
    amount: '$400.00',
    failedAt: '2026-03-17 09:15',
    attempts: 2,
    nextRetry: '2026-03-20',
  },
  {
    property: 'King West Lofts',
    amount: '$200.00',
    failedAt: '2026-03-15 14:30',
    attempts: 3,
    nextRetry: '2026-03-21',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const transactionStatusVariant = {
  paid: 'success' as const,
  pending: 'warning' as const,
  failed: 'error' as const,
  refunded: 'default' as const,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlatformBillingPage() {
  return (
    <PageShell
      title="Platform Billing"
      description="Overview of all property subscriptions and revenue."
      actions={
        <Button variant="secondary" size="sm">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      }
    >
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REVENUE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} padding="md">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-[13px] text-neutral-500">{card.label}</p>
                  <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                    {card.value}
                  </p>
                  <p
                    className={`text-[12px] ${
                      card.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                    }`}
                  >
                    {card.change}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Subscription Breakdown + Revenue Chart */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Subscription Breakdown */}
        <div>
          <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
            Subscription Breakdown
          </h2>
          <Card padding="md">
            {/* Stacked bar */}
            <div className="mb-6 flex h-4 w-full overflow-hidden rounded-full">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`${tier.color} transition-all duration-500`}
                  style={{ width: `${tier.percentage}%` }}
                  title={`${tier.name}: ${tier.count} properties`}
                />
              ))}
            </div>

            <div className="space-y-4">
              {SUBSCRIPTION_TIERS.map((tier, idx) => (
                <div
                  key={tier.name}
                  className={`flex items-center justify-between ${idx > 0 ? 'border-t border-neutral-100 pt-4' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${tier.color}`} />
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{tier.name}</p>
                      <p className="text-[12px] text-neutral-400">{tier.pricePerUnit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-semibold text-neutral-900">{tier.revenue}</p>
                    <p className="text-[12px] text-neutral-400">
                      {tier.count} properties ({tier.percentage}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Revenue Chart Placeholder */}
        <div>
          <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Revenue Trend</h2>
          <Card padding="md" className="flex h-full flex-col">
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <span className="text-[14px] text-neutral-400">Revenue chart coming soon</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dunning Alerts */}
      {DUNNING_ALERTS.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-neutral-900">
            <AlertTriangle className="text-warning-500 h-4 w-4" />
            Failed Payment Alerts
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DUNNING_ALERTS.map((alert) => (
              <Card
                key={alert.property}
                padding="md"
                className="border-warning-200/60 bg-warning-50/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="text-warning-600 h-4 w-4" />
                      <h3 className="text-[14px] font-semibold text-neutral-900">
                        {alert.property}
                      </h3>
                    </div>
                    <p className="mt-1 text-[13px] text-neutral-600">
                      Payment of {alert.amount} failed on {alert.failedAt}
                    </p>
                    <p className="mt-1 text-[12px] text-neutral-400">
                      {alert.attempts} attempt{alert.attempts !== 1 ? 's' : ''} made. Next retry:{' '}
                      {alert.nextRetry}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    <CreditCard className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Recent Transactions</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {RECENT_TRANSACTIONS.map((txn) => (
                  <tr key={txn.id} className="hover:bg-neutral-25 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-medium whitespace-nowrap text-neutral-900">
                      {txn.property}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default" size="sm">
                        {txn.plan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium whitespace-nowrap text-neutral-900">
                      {txn.amount}
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap text-neutral-500">
                      {txn.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={transactionStatusVariant[txn.status]} size="sm" dot>
                        {txn.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
