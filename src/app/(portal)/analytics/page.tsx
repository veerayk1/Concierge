'use client';

import { useState } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Activity,
  TrendingUp,
  Users,
  Package,
  Wrench,
  Shield,
  Calendar,
  Download,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// KPI Data
// ---------------------------------------------------------------------------

interface KpiCard {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: typeof Activity;
  iconColor: string;
  iconBg: string;
}

const KPI_CARDS: KpiCard[] = [
  {
    label: 'Total Residents',
    value: '487',
    change: '+12 this month',
    changeType: 'positive',
    icon: Users,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  {
    label: 'Packages Today',
    value: '23',
    change: '+5 vs yesterday',
    changeType: 'positive',
    icon: Package,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    label: 'Open Maintenance',
    value: '14',
    change: '3 overdue',
    changeType: 'negative',
    icon: Wrench,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
  },
  {
    label: 'Security Events Today',
    value: '7',
    change: 'Normal activity',
    changeType: 'neutral',
    icon: Shield,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
  },
  {
    label: 'Amenity Bookings This Week',
    value: '34',
    change: '+8 vs last week',
    changeType: 'positive',
    icon: Calendar,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
  },
  {
    label: 'Overdue Tasks',
    value: '5',
    change: '2 critical',
    changeType: 'negative',
    icon: Activity,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
  },
  {
    label: 'Vendor Compliance %',
    value: '92%',
    change: '+2% this month',
    changeType: 'positive',
    icon: TrendingUp,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
  },
  {
    label: 'Response Rate',
    value: '96%',
    change: 'Above target',
    changeType: 'positive',
    icon: Activity,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
];

// ---------------------------------------------------------------------------
// Chart Section Data
// ---------------------------------------------------------------------------

interface ChartSection {
  title: string;
  description: string;
}

const CHART_SECTIONS: ChartSection[] = [
  {
    title: 'Package Volume',
    description: 'Daily package intake and release counts over the last 30 days.',
  },
  {
    title: 'Maintenance Resolution Time',
    description: 'Average time to resolve maintenance requests by category.',
  },
  {
    title: 'Security Events by Type',
    description: 'Breakdown of security events by incident type and severity.',
  },
  {
    title: 'Amenity Usage by Day',
    description: 'Amenity booking frequency across days of the week.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>('month');

  // Pre-wire API hook for future integration
  const { data: _apiData } = useApi<Record<string, unknown>>(
    apiUrl('/api/v1/analytics', { propertyId: DEMO_PROPERTY_ID }),
  );

  return (
    <PageShell
      title="Building Analytics"
      description="Insights and trends across all building operations."
      actions={
        <Button variant="secondary" size="sm">
          <Download className="h-4 w-4" />
          Export Analytics
        </Button>
      }
    >
      {/* Date Range Selector */}
      <div className="mb-6 flex items-center gap-1.5">
        {(['today', 'week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setDateRange(range)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${dateRange === range ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Cards Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} padding="sm" className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">{kpi.value}</p>
                <p className="text-[13px] text-neutral-500">{kpi.label}</p>
                {kpi.change && (
                  <p
                    className={`text-[11px] ${
                      kpi.changeType === 'positive'
                        ? 'text-success-600'
                        : kpi.changeType === 'negative'
                          ? 'text-error-600'
                          : 'text-neutral-400'
                    }`}
                  >
                    {kpi.change}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {CHART_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-1 text-[14px] font-semibold text-neutral-900">{section.title}</h2>
            <p className="mb-3 text-[13px] text-neutral-500">{section.description}</p>
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
              <span className="text-[14px] text-neutral-400">Chart coming soon</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
