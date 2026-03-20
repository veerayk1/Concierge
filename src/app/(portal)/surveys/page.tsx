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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SurveyType = 'poll' | 'survey' | 'feedback';
type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';

/** Raw shape from GET /api/v1/surveys */
interface ApiSurvey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  anonymous: boolean;
  responseCount: number;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  questionCount: number;
  questions: unknown[];
}

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
// Normalizer
// ---------------------------------------------------------------------------

function normalizeSurvey(raw: ApiSurvey): SurveyItem {
  const targetCount = 150; // Default target; could be property-specific
  const responseRate = targetCount > 0 ? Math.round((raw.responseCount / targetCount) * 100) : 0;

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    type: 'survey', // API doesn't have type field yet; default to survey
    status: (raw.status as SurveyStatus) || 'draft',
    responseCount: raw.responseCount,
    targetCount,
    createdBy: raw.createdById ?? 'System',
    createdAt: raw.createdAt,
    closesAt: raw.expiryDate ?? raw.createdAt,
    responseRate,
  };
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
// Component
// ---------------------------------------------------------------------------

export default function SurveysPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SurveyType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');

  const {
    data: apiSurveys,
    loading,
    error,
    refetch,
  } = useApi<ApiSurvey[]>(
    apiUrl('/api/v1/surveys', { propertyId: getPropertyId(), pageSize: '200' }),
  );

  const allSurveys = useMemo<SurveyItem[]>(
    () => (apiSurveys ?? []).map(normalizeSurvey),
    [apiSurveys],
  );

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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            )}
            <p className="text-[13px] text-neutral-500">Total Surveys</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{activeCount}</p>
            )}
            <p className="text-[13px] text-neutral-500">Active</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Users className="text-info-600 h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                {avgResponseRate}%
              </p>
            )}
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

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading surveys...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">Failed to load surveys</p>
          <p className="mt-1 text-[13px] text-neutral-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && allSurveys.length === 0 && (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No surveys yet"
          description="Create your first survey to start gathering resident feedback."
          action={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Create Survey
            </Button>
          }
        />
      )}

      {/* Data Table */}
      {!loading && !error && allSurveys.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredSurveys}
          emptyMessage="No surveys found."
          emptyIcon={<ClipboardList className="h-6 w-6" />}
        />
      )}
    </PageShell>
  );
}
