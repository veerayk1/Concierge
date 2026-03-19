'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Download,
  Search,
  X,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SurveyType = 'poll' | 'survey' | 'feedback';

type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';

interface SurveyItem {
  id: string;
  title: string;
  description: string;
  type: SurveyType;
  status: SurveyStatus;
  responseCount: number;
  targetCount: number;
  createdBy: string;
  createdAt: string;
  closesAt: string;
  responseRate: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<SurveyType, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  poll: 'info',
  survey: 'default',
  feedback: 'warning',
};

const TYPE_LABELS: Record<SurveyType, string> = {
  poll: 'Poll',
  survey: 'Survey',
  feedback: 'Feedback',
};

const STATUS_COLORS: Record<SurveyStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  draft: 'default',
  active: 'success',
  closed: 'warning',
  archived: 'error',
};

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
  archived: 'Archived',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_SURVEYS: SurveyItem[] = [
  {
    id: '1',
    title: 'Annual Building Satisfaction Survey',
    description:
      'Comprehensive survey covering maintenance quality, amenity satisfaction, staff performance, and overall living experience.',
    type: 'survey',
    status: 'active',
    responseCount: 87,
    targetCount: 150,
    createdBy: 'Property Manager',
    createdAt: '2026-03-01T09:00:00',
    closesAt: '2026-03-31T23:59:00',
    responseRate: 58,
  },
  {
    id: '2',
    title: 'Amenity Feedback — Gym Equipment',
    description:
      'Tell us what new gym equipment you would like to see and how satisfied you are with current offerings.',
    type: 'feedback',
    status: 'active',
    responseCount: 42,
    targetCount: 100,
    createdBy: 'James Chen',
    createdAt: '2026-03-10T10:00:00',
    closesAt: '2026-03-25T23:59:00',
    responseRate: 42,
  },
  {
    id: '3',
    title: 'Holiday Decoration Poll — Spring 2026',
    description:
      'Vote on your preferred lobby decoration theme for the spring season. Choose from 4 options.',
    type: 'poll',
    status: 'closed',
    responseCount: 112,
    targetCount: 150,
    createdBy: 'Social Committee',
    createdAt: '2026-02-15T09:00:00',
    closesAt: '2026-03-01T23:59:00',
    responseRate: 75,
  },
  {
    id: '4',
    title: 'Pet Policy Feedback',
    description:
      'Share your thoughts on current pet policies including designated areas, size restrictions, and noise complaints process.',
    type: 'feedback',
    status: 'draft',
    responseCount: 0,
    targetCount: 150,
    createdBy: 'Property Manager',
    createdAt: '2026-03-18T14:00:00',
    closesAt: '2026-04-18T23:59:00',
    responseRate: 0,
  },
  {
    id: '5',
    title: 'Parking Improvement Survey',
    description:
      'Help us plan parking improvements. Topics include EV charging, visitor parking allocation, and signage clarity.',
    type: 'survey',
    status: 'active',
    responseCount: 63,
    targetCount: 120,
    createdBy: 'James Chen',
    createdAt: '2026-03-05T08:00:00',
    closesAt: '2026-03-28T23:59:00',
    responseRate: 53,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SurveysPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SurveyType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');

  const { data: apiSurveys } = useApi<SurveyItem[]>(
    apiUrl('/api/v1/surveys', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allSurveys = useMemo<SurveyItem[]>(() => apiSurveys ?? MOCK_SURVEYS, [apiSurveys]);

  const filteredSurveys = useMemo(() => {
    return allSurveys.filter((survey) => {
      if (typeFilter !== 'all' && survey.type !== typeFilter) return false;
      if (statusFilter !== 'all' && survey.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        survey.title.toLowerCase().includes(q) ||
        survey.description.toLowerCase().includes(q) ||
        survey.createdBy.toLowerCase().includes(q)
      );
    });
  }, [allSurveys, typeFilter, statusFilter, searchQuery]);

  const totalCount = allSurveys.length;
  const activeCount = allSurveys.filter((s) => s.status === 'active').length;
  const avgResponseRate =
    allSurveys.length > 0
      ? Math.round(allSurveys.reduce((sum, s) => sum + s.responseRate, 0) / allSurveys.length)
      : 0;

  const columns: Column<SurveyItem>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="text-[14px] font-semibold text-neutral-900">{row.title}</span>
          <p className="mt-0.5 line-clamp-1 text-[12px] text-neutral-400">{row.description}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={TYPE_COLORS[row.type]} size="sm">
          {TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={STATUS_COLORS[row.status]} size="sm" dot>
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'responses',
      header: 'Responses',
      accessorKey: 'responseCount',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
            <div
              className={`h-full rounded-full ${
                row.responseRate >= 75
                  ? 'bg-success-500'
                  : row.responseRate >= 40
                    ? 'bg-primary-500'
                    : 'bg-warning-500'
              }`}
              style={{ width: `${Math.min(row.responseRate, 100)}%` }}
            />
          </div>
          <span className="text-[13px] text-neutral-600">
            {row.responseCount}/{row.targetCount}
          </span>
        </div>
      ),
    },
    {
      id: 'responseRate',
      header: 'Rate',
      accessorKey: 'responseRate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-medium text-neutral-900">{row.responseRate}%</span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'closesAt',
      header: 'Closes',
      accessorKey: 'closesAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.closesAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <Button variant="secondary" size="sm">
          <BarChart3 className="h-3.5 w-3.5" />
          View Results
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      title="Surveys"
      description="Create and manage resident surveys and polls."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create Survey
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <ClipboardList className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            <p className="text-[13px] text-neutral-500">Total Surveys</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{activeCount}</p>
            <p className="text-[13px] text-neutral-500">Active</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Users className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {avgResponseRate}%
            </p>
            <p className="text-[13px] text-neutral-500">Avg Response Rate</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search surveys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="survey-type-filter" className="text-[13px] font-medium text-neutral-600">
            Type:
          </label>
          <select
            id="survey-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as SurveyType | 'all')}
            className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="poll">Poll</option>
            <option value="survey">Survey</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="survey-status-filter"
            className="text-[13px] font-medium text-neutral-600"
          >
            Status:
          </label>
          <select
            id="survey-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SurveyStatus | 'all')}
            className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSurveys}
        emptyMessage="No surveys found."
        emptyIcon={<ClipboardList className="h-6 w-6" />}
      />
    </PageShell>
  );
}
