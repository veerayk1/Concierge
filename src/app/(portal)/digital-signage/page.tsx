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

type SignageType = 'announcement' | 'weather' | 'event' | 'emergency' | 'welcome' | 'directory';
type SignageScreen = 'lobby' | 'elevator' | 'parking' | 'pool' | 'gym' | 'mailroom';
type SignageStatus = 'active' | 'scheduled' | 'paused' | 'expired';
type SignagePriority = 'normal' | 'high' | 'emergency';

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
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_SIGNAGE_ITEMS: SignageItem[] = [
  {
    id: '1',
    name: 'Welcome Message',
    content: 'Welcome to Maple Heights Condominiums. Please check in at the front desk.',
    type: 'welcome',
    screen: 'lobby',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 'normal',
    rotation: 15,
    createdBy: 'Sarah Mitchell',
    lastModified: '2026-03-01',
  },
  {
    id: '2',
    name: 'Holiday Hours',
    content:
      'Building office will be closed March 28-30 for Easter weekend. Emergency line available 24/7.',
    type: 'announcement',
    screen: 'elevator',
    status: 'scheduled',
    startDate: '2026-03-25',
    endDate: '2026-03-31',
    priority: 'normal',
    rotation: 10,
    createdBy: 'James Chen',
    lastModified: '2026-03-15',
  },
  {
    id: '3',
    name: 'Pool Maintenance Notice',
    content:
      'Pool area closed for annual maintenance March 20-22. We apologize for the inconvenience.',
    type: 'announcement',
    screen: 'pool',
    status: 'active',
    startDate: '2026-03-18',
    endDate: '2026-03-22',
    priority: 'high',
    rotation: 8,
    createdBy: 'Maria Santos',
    lastModified: '2026-03-17',
  },
  {
    id: '4',
    name: 'Emergency Contact Info',
    content:
      'Fire: 911 | Building Emergency: 416-555-0199 | Security Desk: Ext 100 | Property Manager: Ext 200',
    type: 'emergency',
    screen: 'lobby',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 'emergency',
    rotation: 20,
    createdBy: 'Sarah Mitchell',
    lastModified: '2026-02-10',
  },
  {
    id: '5',
    name: 'Gym Schedule',
    content: 'Mon-Fri: 6AM-10PM | Sat-Sun: 8AM-8PM. Personal training available by appointment.',
    type: 'directory',
    screen: 'gym',
    status: 'paused',
    startDate: '2026-01-15',
    endDate: '2026-06-30',
    priority: 'normal',
    rotation: 12,
    createdBy: 'James Chen',
    lastModified: '2026-03-10',
  },
];

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

  const { data: apiSignageItems } = useApi<SignageItem[]>(
    apiUrl('/api/v1/digital-signage', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allSignageItems = useMemo<SignageItem[]>(
    () => apiSignageItems ?? MOCK_SIGNAGE_ITEMS,
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
          <Button variant="secondary" size="sm">
            <Eye className="h-4 w-4" />
            Preview Mode
          </Button>
          <Button size="sm">
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
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{activeCount}</p>
            <p className="text-[13px] text-neutral-500">Active Displays</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Monitor className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{screensOnline}</p>
            <p className="text-[13px] text-neutral-500">Screens Online</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-error-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {emergencyCount}
            </p>
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        emptyMessage="No signage content found."
        emptyIcon={<Monitor className="h-6 w-6" />}
      />
    </PageShell>
  );
}
