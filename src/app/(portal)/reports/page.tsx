'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Download,
  FileText,
  Package,
  Shield,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvailableReport {
  type: string;
  name: string;
}

interface ReportsListResponse {
  availableReports: AvailableReport[];
}

// ---------------------------------------------------------------------------
// Report Metadata (icons, descriptions, categories, formats)
// ---------------------------------------------------------------------------

interface ReportMeta {
  description: string;
  category: string;
  icon: typeof BarChart3;
  iconColor: string;
  iconBg: string;
  formats: string[];
}

const REPORT_META: Record<string, ReportMeta> = {
  package_activity: {
    description: 'Daily, weekly, or monthly package volumes by courier, status, and unit.',
    category: 'Operations',
    icon: Package,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  maintenance_summary: {
    description: 'Open, resolved, and overdue maintenance requests by category and vendor.',
    category: 'Operations',
    icon: Wrench,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  security_incidents: {
    description: 'Incident log summary with categories, resolutions, and response times.',
    category: 'Security',
    icon: Shield,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  amenity_usage: {
    description: 'Booking frequency, popular amenities, peak hours, and revenue.',
    category: 'Facilities',
    icon: Calendar,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
    formats: ['CSV', 'Excel'],
  },
  resident_directory: {
    description: 'Full resident directory with contact information and unit assignments.',
    category: 'Administration',
    icon: Users,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    formats: ['CSV', 'Excel'],
  },
  visitor_log: {
    description: 'Visitor entries and exits with timestamps, units, and purpose.',
    category: 'Security',
    icon: Users,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  key_inventory: {
    description: 'Current key and FOB assignments, serial numbers, and audit trail.',
    category: 'Security',
    icon: Shield,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    formats: ['CSV', 'Excel'],
  },
  parking_permits: {
    description: 'Active permits, violations, and spot utilization across all areas.',
    category: 'Facilities',
    icon: BarChart3,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    formats: ['CSV', 'Excel'],
  },
  financial_summary: {
    description: 'Revenue from amenity bookings, parking fees, and other billable items.',
    category: 'Finance',
    icon: TrendingUp,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  training_compliance: {
    description: 'Staff training completion status, overdue courses, and quiz scores.',
    category: 'HR',
    icon: FileText,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
    formats: ['CSV', 'PDF'],
  },
  shift_log_summary: {
    description: 'Shift handoff notes compilation for selected date range.',
    category: 'Operations',
    icon: Clock,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    formats: ['PDF'],
  },
  building_analytics: {
    description: 'Overall building KPIs, trends, and performance metrics dashboard.',
    category: 'Administration',
    icon: BarChart3,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    formats: ['PDF'],
  },
};

// Fallback for unknown report types
const DEFAULT_META: ReportMeta = {
  description: 'Generate and download this report.',
  category: 'General',
  icon: FileText,
  iconColor: 'text-neutral-600',
  iconBg: 'bg-neutral-50',
  formats: ['CSV'],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const {
    data: apiData,
    loading,
    error,
    refetch,
  } = useApi<ReportsListResponse>(
    apiUrl('/api/v1/reports', {
      propertyId: DEMO_PROPERTY_ID,
    }),
  );

  // Parse the available reports from the API
  const availableReports = useMemo<AvailableReport[]>(() => {
    if (!apiData) return [];
    const raw = apiData as unknown as {
      data?: ReportsListResponse;
      availableReports?: AvailableReport[];
    };
    const reports = raw.data?.availableReports ?? raw.availableReports;
    return Array.isArray(reports) ? reports : [];
  }, [apiData]);

  // Group reports by category
  const groupedReports = useMemo(() => {
    const groups: Record<string, Array<AvailableReport & { meta: ReportMeta }>> = {};
    for (const report of availableReports) {
      const meta = REPORT_META[report.type] || DEFAULT_META;
      const category = meta.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push({ ...report, meta });
    }
    return groups;
  }, [availableReports]);

  const categories = Object.keys(groupedReports);

  const handleGenerate = useCallback(
    async (reportType: string) => {
      setGenerating(reportType);
      try {
        const resp = await fetch(
          apiUrl('/api/v1/reports', {
            propertyId: DEMO_PROPERTY_ID,
            type: reportType,
            from: dateFrom || null,
            to: dateTo || null,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
                ? { 'x-demo-role': localStorage.getItem('demo_role')! }
                : {}),
            },
          },
        );

        if (!resp.ok) {
          console.error('Report generation failed:', resp.status);
          return;
        }

        const result = await resp.json();
        // For now, log the result. In production, this would trigger a download.
        console.log(`Report ${reportType} generated:`, result);
      } catch (err) {
        console.error('Report generation error:', err);
      } finally {
        setGenerating(null);
      }
    },
    [dateFrom, dateTo],
  );

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Reports & Analytics"
        description="Generate and export reports across all modules."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell
        title="Reports & Analytics"
        description="Generate and export reports across all modules."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load reports"
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
  if (availableReports.length === 0) {
    return (
      <PageShell
        title="Reports & Analytics"
        description="Generate and export reports across all modules."
      >
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No reports available"
          description="Report types will appear here once configured for your property."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Reports & Analytics"
      description="Generate and export reports across all modules."
    >
      {/* Date Range Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium text-neutral-600">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium text-neutral-600">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="text-[13px] text-neutral-400 hover:text-neutral-600"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Category Groups */}
      {categories.map((category) => {
        const reports = groupedReports[category] ?? [];
        return (
          <div key={category} className="mb-8">
            <h2 className="mb-3 text-[14px] font-semibold text-neutral-900">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => {
                const Icon = report.meta.icon;
                const isGenerating = generating === report.type;
                return (
                  <Card key={report.type} hoverable className="group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${report.meta.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${report.meta.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-semibold text-neutral-900">
                          {report.name}
                        </h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                          {report.meta.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {report.meta.formats.map((fmt) => (
                            <Badge key={fmt} variant="default" size="sm">
                              {fmt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        disabled={isGenerating}
                        onClick={() => handleGenerate(report.type)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isGenerating ? 'Generating...' : 'Generate'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </PageShell>
  );
}
