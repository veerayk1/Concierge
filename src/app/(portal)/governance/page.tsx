'use client';

import { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Download,
  Search,
  Filter,
  X,
  CheckCircle2,
  Calendar,
  FileText,
  Scale,
  Users,
  Clock,
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

type MeetingType = 'regular' | 'special' | 'agm' | 'emergency';
type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

type ResolutionStatus = 'proposed' | 'voting' | 'passed' | 'failed' | 'tabled';

interface MeetingItem {
  id: string;
  title: string;
  type: MeetingType;
  date: string;
  time: string;
  location: string;
  status: MeetingStatus;
  attendeeCount: number;
  minutesAvailable: boolean;
}

interface ResolutionItem {
  id: string;
  number: string;
  title: string;
  status: ResolutionStatus;
  proposedBy: string;
  proposedDate: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'meetings' | 'resolutions' | 'documents';

const MEETING_TYPE_COLORS: Record<MeetingType, 'default' | 'info' | 'warning' | 'error'> = {
  regular: 'default',
  special: 'info',
  agm: 'warning',
  emergency: 'error',
};

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  regular: 'Regular',
  special: 'Special',
  agm: 'AGM',
  emergency: 'Emergency',
};

const MEETING_STATUS_COLORS: Record<
  MeetingStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const RESOLUTION_STATUS_COLORS: Record<
  ResolutionStatus,
  'default' | 'info' | 'success' | 'error' | 'warning'
> = {
  proposed: 'default',
  voting: 'info',
  passed: 'success',
  failed: 'error',
  tabled: 'warning',
};

const RESOLUTION_STATUS_LABELS: Record<ResolutionStatus, string> = {
  proposed: 'Proposed',
  voting: 'Voting',
  passed: 'Passed',
  failed: 'Failed',
  tabled: 'Tabled',
};

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

interface MeetingsApiResponse {
  data: MeetingItem[];
  meta?: { total: number };
}

interface ResolutionsApiResponse {
  data: ResolutionItem[];
  meta?: { total: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('meetings');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: apiMeetings,
    loading: meetingsLoading,
    error: meetingsError,
    refetch: refetchMeetings,
  } = useApi<MeetingItem[] | MeetingsApiResponse>(
    apiUrl('/api/v1/governance/meetings', { propertyId: getPropertyId() }),
  );

  const {
    data: apiResolutions,
    loading: resolutionsLoading,
    error: resolutionsError,
    refetch: refetchResolutions,
  } = useApi<ResolutionItem[] | ResolutionsApiResponse>(
    apiUrl('/api/v1/governance/resolutions', { propertyId: getPropertyId() }),
  );

  const loading = meetingsLoading || resolutionsLoading;
  const error = meetingsError || resolutionsError;
  const refetch = () => {
    refetchMeetings();
    refetchResolutions();
  };

  const allMeetings = useMemo<MeetingItem[]>(() => {
    if (!apiMeetings) return [];
    if (Array.isArray(apiMeetings)) return apiMeetings;
    if (Array.isArray((apiMeetings as MeetingsApiResponse).data))
      return (apiMeetings as MeetingsApiResponse).data;
    return [];
  }, [apiMeetings]);

  const allResolutions = useMemo<ResolutionItem[]>(() => {
    if (!apiResolutions) return [];
    if (Array.isArray(apiResolutions)) return apiResolutions;
    if (Array.isArray((apiResolutions as ResolutionsApiResponse).data))
      return (apiResolutions as ResolutionsApiResponse).data;
    return [];
  }, [apiResolutions]);

  // ---- Filtered data ----

  const filteredMeetings = useMemo(() => {
    return allMeetings.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return m.title.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
    });
  }, [allMeetings, statusFilter, searchQuery]);

  const filteredResolutions = useMemo(() => {
    return allResolutions.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.number.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.proposedBy.toLowerCase().includes(q)
      );
    });
  }, [allResolutions, statusFilter, searchQuery]);

  // ---- Summary stats ----

  const upcomingMeetings = allMeetings.filter((m) => m.status === 'scheduled').length;
  const activeResolutions = allResolutions.filter(
    (r) => r.status === 'proposed' || r.status === 'voting',
  ).length;
  const passedThisYear = allResolutions.filter((r) => r.status === 'passed').length;

  const hasActiveFilters = statusFilter !== 'all';

  // ---- Meeting columns ----

  const meetingColumns: Column<MeetingItem>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-semibold text-neutral-900">{row.title}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={MEETING_TYPE_COLORS[row.type]} size="sm">
          {MEETING_TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-600">
          {new Date(row.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'time',
      header: 'Time',
      accessorKey: 'time',
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.time}</span>,
    },
    {
      id: 'location',
      header: 'Location',
      accessorKey: 'location',
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.location}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={MEETING_STATUS_COLORS[row.status]} size="sm" dot>
          {MEETING_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'attendeeCount',
      header: 'Attendees',
      accessorKey: 'attendeeCount',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-600">
          {row.attendeeCount > 0 ? row.attendeeCount : '\u2014'}
        </span>
      ),
    },
    {
      id: 'minutes',
      header: 'Minutes',
      cell: (row) =>
        row.minutesAvailable ? (
          <FileText className="text-primary-600 h-4 w-4" />
        ) : (
          <span className="text-[13px] text-neutral-300">\u2014</span>
        ),
    },
  ];

  // ---- Resolution columns ----

  const resolutionColumns: Column<ResolutionItem>[] = [
    {
      id: 'number',
      header: 'Number',
      accessorKey: 'number',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 font-mono text-[13px] font-semibold">{row.number}</span>
      ),
    },
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-semibold text-neutral-900">{row.title}</span>
      ),
    },
    {
      id: 'proposedBy',
      header: 'Proposed By',
      accessorKey: 'proposedBy',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.proposedBy}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={RESOLUTION_STATUS_COLORS[row.status]} size="sm" dot>
          {RESOLUTION_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      id: 'votesFor',
      header: 'For',
      accessorKey: 'votesFor',
      sortable: true,
      cell: (row) => (
        <span className="text-success-600 text-[13px] font-semibold">{row.votesFor}</span>
      ),
    },
    {
      id: 'votesAgainst',
      header: 'Against',
      accessorKey: 'votesAgainst',
      sortable: true,
      cell: (row) => (
        <span className="text-error-600 text-[13px] font-semibold">{row.votesAgainst}</span>
      ),
    },
    {
      id: 'votesAbstain',
      header: 'Abstain',
      accessorKey: 'votesAbstain',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.votesAbstain}</span>,
    },
    {
      id: 'proposedDate',
      header: 'Proposed Date',
      accessorKey: 'proposedDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.proposedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  // ---- Tab labels ----

  const tabs: { key: TabKey; label: string; icon: typeof Landmark }[] = [
    { key: 'meetings', label: 'Meetings', icon: Calendar },
    { key: 'resolutions', label: 'Resolutions', icon: Scale },
    { key: 'documents', label: 'Documents', icon: FileText },
  ];

  // ---- Reset filters on tab change ----

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setSearchQuery('');
    setStatusFilter('all');
    setShowFilters(false);
  }

  // Loading state
  if (loading) {
    return (
      <PageShell title="Governance" description="Loading...">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="mb-6 h-10 w-80" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Governance" description="Error loading governance data">
        <EmptyState
          icon={<Landmark className="h-6 w-6" />}
          title="Failed to load governance data"
          description={error}
          action={
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Governance"
      description="Board meetings, resolutions, votes, and governance documents."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {activeTab === 'meetings' && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Meeting
            </Button>
          )}
          {activeTab === 'resolutions' && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Resolution
            </Button>
          )}
          {activeTab === 'documents' && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Upload Document
            </Button>
          )}
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Calendar className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {upcomingMeetings}
            </p>
            <p className="text-[13px] text-neutral-500">Upcoming Meetings</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Scale className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {activeResolutions}
            </p>
            <p className="text-[13px] text-neutral-500">Active Resolutions</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {passedThisYear}
            </p>
            <p className="text-[13px] text-neutral-500">Passed This Year</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'meetings'
                ? 'Search meetings...'
                : activeTab === 'resolutions'
                  ? 'Search resolutions...'
                  : 'Search documents...'
            }
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
        <Button
          variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="primary" size="sm">
              1
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={() => setStatusFilter('all')}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-[13px] font-medium text-neutral-600">
              Status:
            </label>
            {activeTab === 'meetings' ? (
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ) : (
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="proposed">Proposed</option>
                <option value="voting">Voting</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="tabled">Tabled</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'meetings' && (
        <DataTable
          columns={meetingColumns}
          data={filteredMeetings}
          emptyMessage="No meetings found."
          emptyIcon={<Calendar className="h-6 w-6" />}
        />
      )}

      {activeTab === 'resolutions' && (
        <DataTable
          columns={resolutionColumns}
          data={filteredResolutions}
          emptyMessage="No resolutions found."
          emptyIcon={<Scale className="h-6 w-6" />}
        />
      )}

      {activeTab === 'documents' && (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No governance documents yet"
          description="Upload board meeting minutes, bylaws, declarations, and other governance documents."
          action={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Upload Document
            </Button>
          }
        />
      )}
    </PageShell>
  );
}
