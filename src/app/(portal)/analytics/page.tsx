'use client';

import { useMemo, useState, useCallback } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  Package,
  Wrench,
  Shield,
  Calendar,
  Download,
  Clock,
  Bell,
  BarChart3,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types (aligned with /api/v1/dashboard response)
// ---------------------------------------------------------------------------

interface DashboardKpis {
  unreleasedPackages: number;
  activeVisitors: number;
  openMaintenanceRequests: number;
  todayEvents: number;
  pendingBookingApprovals: number;
  unreadAnnouncements: number;
  overdueMaintenanceRequests: number;
  monthlyPackageVolume: number;
  avgResolutionTimeHours: number;
}

interface RecentActivityItem {
  id: string;
  type: string;
  title: string;
  unit?: string;
  status: string;
  createdAt: string;
}

interface DashboardResponse {
  kpis: DashboardKpis;
  recentActivity: RecentActivityItem[];
}

// ---------------------------------------------------------------------------
// KPI Card Definitions
// ---------------------------------------------------------------------------

interface KpiCardDef {
  key: keyof DashboardKpis;
  label: string;
  icon: typeof Activity;
  iconColor: string;
  iconBg: string;
  format?: (v: number) => string;
  changeLabel?: (v: number, kpis: DashboardKpis) => string | null;
  changeType?: (v: number, kpis: DashboardKpis) => 'positive' | 'negative' | 'neutral';
}

const KPI_DEFS: KpiCardDef[] = [
  {
    key: 'monthlyPackageVolume',
    label: 'Packages This Month',
    icon: Package,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    key: 'unreleasedPackages',
    label: 'Unreleased Packages',
    icon: Package,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    changeLabel: (v) => (v > 0 ? `${v} awaiting pickup` : null),
    changeType: (v) => (v > 5 ? 'negative' : v > 0 ? 'neutral' : 'positive'),
  },
  {
    key: 'openMaintenanceRequests',
    label: 'Open Maintenance',
    icon: Wrench,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    changeLabel: (_, kpis) =>
      kpis.overdueMaintenanceRequests > 0 ? `${kpis.overdueMaintenanceRequests} overdue` : null,
    changeType: (_, kpis) => (kpis.overdueMaintenanceRequests > 0 ? 'negative' : 'positive'),
  },
  {
    key: 'activeVisitors',
    label: 'Active Visitors',
    icon: Users,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    changeLabel: (v) => (v > 0 ? `${v} currently in building` : null),
    changeType: () => 'neutral',
  },
  {
    key: 'todayEvents',
    label: 'Events Today',
    icon: Shield,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
  },
  {
    key: 'pendingBookingApprovals',
    label: 'Pending Bookings',
    icon: Calendar,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    changeLabel: (v) => (v > 0 ? `${v} awaiting approval` : null),
    changeType: (v) => (v > 0 ? 'neutral' : 'positive'),
  },
  {
    key: 'unreadAnnouncements',
    label: 'Active Announcements',
    icon: Bell,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    key: 'avgResolutionTimeHours',
    label: 'Avg Resolution Time',
    icon: Clock,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    format: (v) => (v > 0 ? `${v}h` : '--'),
    changeLabel: (v) => (v > 0 ? (v <= 48 ? 'Within SLA' : 'Above SLA') : null),
    changeType: (v) => (v <= 48 ? 'positive' : 'negative'),
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

  const {
    data: apiData,
    loading,
    error,
    refetch,
  } = useApi<DashboardResponse>(apiUrl('/api/v1/dashboard', { propertyId: getPropertyId() }));

  // Parse the dashboard data
  const dashboardData = useMemo<DashboardResponse | null>(() => {
    if (!apiData) return null;
    const raw = apiData as unknown as { data?: DashboardResponse; kpis?: DashboardKpis };
    if (raw.data?.kpis) return raw.data;
    if (raw.kpis) return raw as unknown as DashboardResponse;
    return null;
  }, [apiData]);

  const kpis = dashboardData?.kpis;
  const recentActivity = dashboardData?.recentActivity || [];

  // Export analytics as CSV (must be before early returns per hooks rules)
  const handleExport = useCallback(() => {
    if (!kpis) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];

    // KPI summary section
    lines.push('Building Analytics Report');
    lines.push(`Generated,${new Date().toLocaleString()}`);
    lines.push(`Date Range,${dateRange}`);
    lines.push('');
    lines.push('KPI Summary');
    lines.push('Metric,Value');
    for (const def of KPI_DEFS) {
      const value = kpis[def.key];
      const formatted = def.format ? def.format(value) : String(value);
      lines.push(`"${def.label}",${formatted}`);
    }

    // Recent activity section
    if (recentActivity.length > 0) {
      lines.push('');
      lines.push('Recent Activity');
      lines.push('Type,Title,Unit,Status,Date');
      for (const item of recentActivity) {
        const date = new Date(item.createdAt).toLocaleString();
        lines.push(
          `"${item.type}","${(item.title ?? '').replace(/"/g, '""')}","${item.unit ?? ''}","${item.status}","${date}"`,
        );
      }
    }

    // Download as CSV
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [kpis, recentActivity, dateRange]);

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Building Analytics"
        description="Insights and trends across all building operations."
      >
        <Skeleton className="mb-6 h-10 w-64 rounded-lg" />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell
        title="Building Analytics"
        description="Insights and trends across all building operations."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load analytics"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  // Empty state
  if (!kpis) {
    return (
      <PageShell
        title="Building Analytics"
        description="Insights and trends across all building operations."
      >
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No analytics data"
          description="Analytics will appear here once there is activity on this property."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Building Analytics"
      description="Insights and trends across all building operations."
      actions={
        <Button variant="secondary" size="sm" onClick={handleExport}>
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
        {KPI_DEFS.map((def) => {
          const Icon = def.icon;
          const value = kpis[def.key];
          const displayValue = def.format ? def.format(value) : String(value);
          const changeLabel = def.changeLabel ? def.changeLabel(value, kpis) : null;
          const changeType = def.changeType ? def.changeType(value, kpis) : 'neutral';

          return (
            <Card key={def.key} padding="sm" className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${def.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${def.iconColor}`} />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {displayValue}
                </p>
                <p className="text-[13px] text-neutral-500">{def.label}</p>
                {changeLabel && (
                  <p
                    className={`text-[11px] ${
                      changeType === 'positive'
                        ? 'text-success-600'
                        : changeType === 'negative'
                          ? 'text-error-600'
                          : 'text-neutral-400'
                    }`}
                  >
                    {changeLabel}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-neutral-900">Recent Activity</h2>
          <Card>
            <div className="divide-y divide-neutral-100">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-neutral-400" />
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">
                        {item.title || item.type}
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        {item.type}
                        {item.unit ? ` - Unit ${item.unit}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.status === 'open' ? 'warning' : 'success'} size="sm">
                      {item.status}
                    </Badge>
                    <span className="text-[12px] text-neutral-400">
                      {new Date(item.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Chart Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {CHART_SECTIONS.map((section) => (
          <Card key={section.title}>
            <h2 className="mb-1 text-[14px] font-semibold text-neutral-900">{section.title}</h2>
            <p className="mb-4 text-[13px] text-neutral-500">{section.description}</p>
            <div className="flex h-48 flex-col justify-end gap-1.5">
              {/* Placeholder bars that hint at a chart */}
              <div className="flex items-end gap-2 px-2">
                {[35, 55, 40, 70, 50, 65, 45, 60, 30, 75, 55, 48].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-neutral-200"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="border-t border-neutral-100 pt-3 text-center">
                <BarChart3 className="mx-auto mb-1 h-4 w-4 text-neutral-300" />
                <p className="text-[12px] text-neutral-400">
                  No data yet. Activity will appear here once the property is active.
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
