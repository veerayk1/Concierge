'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  Plus,
  Download,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Eye,
  Loader2,
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
import { CreateSignageDialog } from '@/components/forms/create-signage-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SignageType = 'announcement' | 'weather' | 'event' | 'emergency' | 'welcome' | 'directory';
type SignageScreen = 'lobby' | 'elevator' | 'parking' | 'pool' | 'gym' | 'mailroom';
type SignageStatus = 'active' | 'scheduled' | 'paused' | 'expired';
type SignagePriority = 'normal' | 'high' | 'emergency';

/** Raw shape from GET /api/v1/digital-signage */
interface ApiSignageContent {
  id: string;
  title: string;
  body: string | null;
  contentType: string;
  zone: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  priority: number;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
}

interface SignageItem {
  id: string;
  name: string;
  content: string;
  type: SignageType;
  screen: SignageScreen;
  status: SignageStatus;
  startDate: string;
  endDate: string;
  priority: SignagePriority;
  rotation: number;
  createdBy: string;
  lastModified: string;
}

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeSignage(raw: ApiSignageContent): SignageItem {
  const now = new Date();
  const start = new Date(raw.startDate);
  const end = new Date(raw.endDate);

  let status: SignageStatus;
  if (!raw.isActive) {
    status = 'paused';
  } else if (end < now) {
    status = 'expired';
  } else if (start > now) {
    status = 'scheduled';
  } else {
    status = 'active';
  }

  let priority: SignagePriority = 'normal';
  if (raw.priority >= 10) priority = 'emergency';
  else if (raw.priority >= 5) priority = 'high';

  return {
    id: raw.id,
    name: raw.title,
    content: raw.body ?? '',
    type: (raw.contentType as SignageType) || 'announcement',
    screen: (raw.zone as SignageScreen) || 'lobby',
    status,
    startDate: raw.startDate,
    endDate: raw.endDate,
    priority,
    rotation: raw.durationSeconds,
    createdBy: raw.createdById ?? 'System',
    lastModified: raw.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<
  SignageType,
  'default' | 'info' | 'warning' | 'success' | 'error' | 'primary'
> = {
  announcement: 'info',
  weather: 'primary',
  event: 'success',
  emergency: 'error',
  welcome: 'warning',
  directory: 'default',
};

const TYPE_LABELS: Record<SignageType, string> = {
  announcement: 'Announcement',
  weather: 'Weather',
  event: 'Event',
  emergency: 'Emergency',
  welcome: 'Welcome',
  directory: 'Directory',
};

const SCREEN_COLORS: Record<
  SignageScreen,
  'default' | 'info' | 'warning' | 'success' | 'error' | 'primary'
> = {
  lobby: 'primary',
  elevator: 'info',
  parking: 'warning',
  pool: 'success',
  gym: 'default',
  mailroom: 'info',
};

const SCREEN_LABELS: Record<SignageScreen, string> = {
  lobby: 'Lobby',
  elevator: 'Elevator',
  parking: 'Parking',
  pool: 'Pool',
  gym: 'Gym',
  mailroom: 'Mailroom',
};

const STATUS_COLORS: Record<SignageStatus, 'success' | 'info' | 'warning' | 'default'> = {
  active: 'success',
  scheduled: 'info',
  paused: 'warning',
  expired: 'default',
};

const STATUS_LABELS: Record<SignageStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  paused: 'Paused',
  expired: 'Expired',
};

const PRIORITY_COLORS: Record<SignagePriority, 'default' | 'warning' | 'error'> = {
  normal: 'default',
  high: 'warning',
  emergency: 'error',
};

const PRIORITY_LABELS: Record<SignagePriority, string> = {
  normal: 'Normal',
  high: 'High',
  emergency: 'Emergency',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DigitalSignagePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SignageType | 'all'>('all');
  const [screenFilter, setScreenFilter] = useState<SignageScreen | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SignageStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiSignageItems,
    loading,
    error,
    refetch,
  } = useApi<ApiSignageContent[]>(
    apiUrl('/api/v1/digital-signage', {
      propertyId: getPropertyId(),
      status: 'all',
      pageSize: '200',
    }),
  );

  const allSignageItems = useMemo<SignageItem[]>(
    () => (apiSignageItems ?? []).map(normalizeSignage),
    [apiSignageItems],
  );

  const filteredItems = useMemo(() => {
    return allSignageItems.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (screenFilter !== 'all' && item.screen !== screenFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.createdBy.toLowerCase().includes(q)
      );
    });
  }, [allSignageItems, typeFilter, screenFilter, statusFilter, searchQuery]);

  const activeCount = allSignageItems.filter((i) => i.status === 'active').length;
  const screensOnline = new Set(
    allSignageItems.filter((i) => i.status === 'active').map((i) => i.screen),
  ).size;
  const emergencyCount = allSignageItems.filter((i) => i.priority === 'emergency').length;

  const hasActiveFilters = typeFilter !== 'all' || screenFilter !== 'all' || statusFilter !== 'all';

  const columns: Column<SignageItem>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="text-[14px] font-semibold text-neutral-900">{row.name}</span>,
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
      id: 'screen',
      header: 'Screen / Location',
      accessorKey: 'screen',
      sortable: true,
      cell: (row) => (
        <Badge variant={SCREEN_COLORS[row.screen]} size="sm">
          {SCREEN_LABELS[row.screen]}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'active' && <Play className="text-success-600 h-3 w-3" />}
          {row.status === 'paused' && <Pause className="text-warning-600 h-3 w-3" />}
          <Badge variant={STATUS_COLORS[row.status]} size="sm" dot>
            {STATUS_LABELS[row.status]}
          </Badge>
        </div>
      ),
    },
    {
      id: 'schedule',
      header: 'Schedule',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.startDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          {' \u2013 '}
          {new Date(row.endDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => (
        <Badge variant={PRIORITY_COLORS[row.priority]} size="sm">
          {PRIORITY_LABELS[row.priority]}
        </Badge>
      ),
    },
    {
      id: 'rotation',
      header: 'Rotation',
      accessorKey: 'rotation',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-600">{row.rotation}s</span>,
    },
    {
      id: 'lastModified',
      header: 'Last Modified',
      accessorKey: 'lastModified',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.lastModified).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Digital Signage"
      description="Manage lobby displays, announcement screens, and digital notice boards."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const activeItems = allSignageItems.filter((s) => s.status === 'active');
              const previewHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Digital Signage Preview</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
.container{width:100%;max-width:960px;padding:48px}
.slide{background:#1a1a1a;border-radius:16px;padding:40px;margin-bottom:24px}
.slide h2{font-size:28px;margin-bottom:12px}
.slide p{font-size:18px;line-height:1.6;color:#ccc}
.badge{display:inline-block;font-size:12px;padding:4px 10px;border-radius:20px;background:#333;color:#aaa;margin-bottom:16px}
.empty{text-align:center;color:#666;font-size:20px;padding:80px 0}
</style></head><body><div class="container">
${activeItems.length === 0 ? '<div class="empty">No active signage content</div>' : activeItems.map((s) => `<div class="slide"><span class="badge">${s.screen.toUpperCase()} &middot; ${s.type.toUpperCase()}</span><h2>${s.name.replace(/</g, '&lt;')}</h2><p>${s.content.replace(/</g, '&lt;')}</p></div>`).join('')}
</div></body></html>`;
              const blob = new Blob([previewHtml], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank', 'width=1024,height=768');
            }}
          >
            <Eye className="h-4 w-4" />
            Preview Mode
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <p className="text-[13px] text-neutral-500">Active Displays</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Monitor className="text-info-600 h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                {screensOnline}
              </p>
            )}
            <p className="text-[13px] text-neutral-500">Screens Online</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-error-600 h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                {emergencyCount}
              </p>
            )}
            <p className="text-[13px] text-neutral-500">Emergency Alerts</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search signage content..."
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
              {(typeFilter !== 'all' ? 1 : 0) +
                (screenFilter !== 'all' ? 1 : 0) +
                (statusFilter !== 'all' ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setScreenFilter('all');
              setStatusFilter('all');
            }}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-[13px] font-medium text-neutral-600">
              Type:
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SignageType | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="weather">Weather</option>
              <option value="event">Event</option>
              <option value="emergency">Emergency</option>
              <option value="welcome">Welcome</option>
              <option value="directory">Directory</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="screen-filter" className="text-[13px] font-medium text-neutral-600">
              Screen:
            </label>
            <select
              id="screen-filter"
              value={screenFilter}
              onChange={(e) => setScreenFilter(e.target.value as SignageScreen | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Screens</option>
              <option value="lobby">Lobby</option>
              <option value="elevator">Elevator</option>
              <option value="parking">Parking</option>
              <option value="pool">Pool</option>
              <option value="gym">Gym</option>
              <option value="mailroom">Mailroom</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-[13px] font-medium text-neutral-600">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SignageStatus | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading signage content...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">
            Failed to load signage content
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && allSignageItems.length === 0 && (
        <EmptyState
          icon={<Monitor className="h-6 w-6" />}
          title="No signage content yet"
          description="Create your first digital signage content to display on lobby screens and monitors."
          action={
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              New Content
            </Button>
          }
        />
      )}

      {/* Data Table */}
      {!loading && !error && allSignageItems.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredItems}
          emptyMessage="No signage content found."
          emptyIcon={<Monitor className="h-6 w-6" />}
        />
      )}

      <CreateSignageDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
