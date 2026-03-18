'use client';

import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  Shield,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportType {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: typeof BarChart3;
  iconColor: string;
  iconBg: string;
  lastGenerated?: string;
  formats: string[];
}

// ---------------------------------------------------------------------------
// Mock Data — 12 report types per PRD
// ---------------------------------------------------------------------------

const REPORT_TYPES: ReportType[] = [
  {
    id: '1',
    name: 'Package Activity Report',
    description: 'Daily, weekly, or monthly package volumes by courier, status, and unit.',
    category: 'Operations',
    icon: Package,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    lastGenerated: '2026-03-17',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: '2',
    name: 'Security Incident Report',
    description: 'Incident log summary with categories, resolutions, and response times.',
    category: 'Security',
    icon: Shield,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
    lastGenerated: '2026-03-15',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: '3',
    name: 'Maintenance Summary',
    description: 'Open, resolved, and overdue maintenance requests by category and vendor.',
    category: 'Operations',
    icon: Wrench,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    lastGenerated: '2026-03-17',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: '4',
    name: 'Amenity Usage Report',
    description: 'Booking frequency, popular amenities, peak hours, and revenue.',
    category: 'Facilities',
    icon: Calendar,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
    lastGenerated: '2026-03-10',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '5',
    name: 'Resident Directory Export',
    description: 'Full resident directory with contact information and unit assignments.',
    category: 'Administration',
    icon: Users,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    lastGenerated: '2026-03-01',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '6',
    name: 'Visitor Log Report',
    description: 'Visitor entries and exits with timestamps, units, and purpose.',
    category: 'Security',
    icon: Users,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: '7',
    name: 'Key/FOB Inventory',
    description: 'Current key and FOB assignments, serial numbers, and audit trail.',
    category: 'Security',
    icon: Shield,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '8',
    name: 'Parking Permit Report',
    description: 'Active permits, violations, and spot utilization across all areas.',
    category: 'Facilities',
    icon: BarChart3,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    formats: ['CSV', 'Excel'],
  },
  {
    id: '9',
    name: 'Financial Summary',
    description: 'Revenue from amenity bookings, parking fees, and other billable items.',
    category: 'Finance',
    icon: TrendingUp,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: '10',
    name: 'Training Compliance',
    description: 'Staff training completion status, overdue courses, and quiz scores.',
    category: 'HR',
    icon: FileText,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
    formats: ['CSV', 'PDF'],
  },
  {
    id: '11',
    name: 'Shift Log Summary',
    description: 'Shift handoff notes compilation for selected date range.',
    category: 'Operations',
    icon: Clock,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
    formats: ['PDF'],
  },
  {
    id: '12',
    name: 'Building Analytics',
    description: 'Overall building KPIs, trends, and performance metrics dashboard.',
    category: 'Administration',
    icon: BarChart3,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
    lastGenerated: '2026-03-17',
    formats: ['PDF'],
  },
];

const CATEGORIES = [...new Set(REPORT_TYPES.map((r) => r.category))];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  return (
    <PageShell
      title="Reports & Analytics"
      description="Generate and export reports across all modules."
    >
      {/* Category Groups */}
      {CATEGORIES.map((category) => {
        const reports = REPORT_TYPES.filter((r) => r.category === category);
        return (
          <div key={category} className="mb-8">
            <h2 className="mb-3 text-[14px] font-semibold text-neutral-900">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <Card key={report.id} hoverable className="group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${report.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${report.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-semibold text-neutral-900">
                          {report.name}
                        </h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                          {report.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {report.formats.map((fmt) => (
                            <Badge key={fmt} variant="default" size="sm">
                              {fmt}
                            </Badge>
                          ))}
                        </div>
                        {report.lastGenerated && (
                          <p className="mt-2 text-[11px] text-neutral-400">
                            Last generated:{' '}
                            {new Date(report.lastGenerated).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Generate
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
