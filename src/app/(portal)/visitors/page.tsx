'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { exportToCsv } from '@/lib/export-csv';
import {
  AlertCircle,
  Users,
  Plus,
  Download,
  Search,
  Filter,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { KpiTile } from '@/components/ui/kpi-tile';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateVisitorDialog } from '@/components/forms/create-visitor-dialog';

// ---------------------------------------------------------------------------
// Test-seed filter — same regex as /my-packages, /my-requests, /dashboard.
// The demo property's visitor log is flooded with "CHAIN-D BKTPJK" entries
// that should never appear in a real building.
// ---------------------------------------------------------------------------
const TEST_TITLE_PATTERN =
  /^(EXH[-_]?[A-Z]+|UI[-_]?CHAIN|UI[-_]?TASK|CHAIN[-_]?[A-Z]|QA[-_ ]?(TEST|[A-Z]+:|TOWER)|QA TEST|UX[-_]?\d+|WRITE[-_]?MATRIX|SEC[-_]?\d+|TEST[-_ ]?|FBSNCK|VERIFY[-_ ]?|TC[-_]?\d+|E2E[-_ ]?)/i;
// Catches visitor names with "test"-style markers anywhere: "Marco
// Plumber QA-tomorrow", "Acme Test Guest", "Sarah Kim QA fixture".
const TEST_SUBSTRING_PATTERN =
  /\b(test (event|notice|announcement|item|run|data|visitor|guest)|qa[- ]?(test|tomorrow|fixture)|qa$|qa-)/i;
function isTestSeedTitle(s: string | undefined | null): boolean {
  if (!s) return false;
  const t = s.trim();
  return TEST_TITLE_PATTERN.test(t) || TEST_SUBSTRING_PATTERN.test(t);
}

// ---------------------------------------------------------------------------
// Types — mapped from API response (Prisma VisitorEntry + relations)
// ---------------------------------------------------------------------------

interface VisitorItem {
  id: string;
  visitorName: string;
  visitorType:
    | 'visitor'
    | 'contractor'
    | 'delivery_person'
    | 'real_estate_agent'
    | 'emergency_service'
    | 'other';
  unit: { id: string; number: string } | null;
  arrivalAt: string;
  departureAt: string | null;
  expectedDepartureAt: string | null;
  notifyResident: boolean;
  comments: string | null;
}

// ---------------------------------------------------------------------------
// Visitor Type Display
// ---------------------------------------------------------------------------

const VISITOR_TYPE_LABELS: Record<VisitorItem['visitorType'], string> = {
  visitor: 'Visitor',
  contractor: 'Contractor',
  delivery_person: 'Delivery',
  real_estate_agent: 'Real Estate',
  emergency_service: 'Emergency',
  other: 'Other',
};

// Visitor type chip colours. Soft, calmer palette — these chips appear on
// every row of the table and need to read as taxonomy, not status. Emergency
// stays red (real signal). Everything else is a low-saturation neutral.
const VISITOR_TYPE_COLORS: Record<VisitorItem['visitorType'], string> = {
  visitor: 'bg-neutral-100 text-neutral-700',
  contractor: 'bg-amber-50 text-amber-700',
  delivery_person: 'bg-neutral-100 text-neutral-700',
  real_estate_agent: 'bg-neutral-100 text-neutral-700',
  emergency_service: 'bg-red-50 text-red-700',
  other: 'bg-neutral-100 text-neutral-600',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDuration(arrival: string, departure: string): string {
  const diffMs = new Date(departure).getTime() - new Date(arrival).getTime();
  const totalMinutes = Math.round(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Roles allowed to see the building-wide visitor log. Residents must NOT
// see other residents' visitors (privacy). They have their own resident
// portal scoped to their unit. Without this gate, a resident could open
// /visitors and read every guest in the building with names + unit numbers.
const VISITOR_PAGE_ROLES = new Set([
  'super_admin',
  'property_admin',
  'property_manager',
  'front_desk',
  'security_guard',
  'security_supervisor',
  'superintendent',
]);

export default function VisitorsPage() {
  const router = useRouter();
  // Role gate — bounce residents and anyone else to their dashboard.
  if (typeof window !== 'undefined') {
    const role = localStorage.getItem('demo_role');
    if (role && !VISITOR_PAGE_ROLES.has(role)) {
      window.location.replace('/dashboard');
    }
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [signingOutId, setSigningOutId] = useState<string | null>(null);

  // Debounce search input to avoid firing API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all visitors (status=all) so we can split into currently-in vs departed
  const {
    data: apiVisitors,
    loading,
    error,
    refetch,
  } = useApi<VisitorItem[]>(
    apiUrl('/api/v1/visitors', {
      propertyId: getPropertyId(),
      status: 'all',
      search: debouncedSearch || undefined,
      visitorType: typeFilter !== 'all' ? typeFilter : undefined,
    }),
  );

  // Sign-out handler — calls PATCH /api/v1/visitors/{id} then refetches
  const handleSignOut = async (visitorId: string) => {
    setSigningOutId(visitorId);
    try {
      const res = await apiRequest(`/api/v1/visitors/${visitorId}`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Sign-out failed (${res.status})`);
      }
      refetch();
    } catch (err) {
      console.error('Failed to sign out visitor:', err);
    } finally {
      setSigningOutId(null);
    }
  };

  // Drop seed-pollution names like "CHAIN-D BKTPJK". Same regex pattern
  // used by /my-packages, /my-requests, /dashboard.
  const allVisitors = useMemo<VisitorItem[]>(() => {
    const raw = apiVisitors ?? [];
    return raw.filter((v) => !isTestSeedTitle(v.visitorName));
  }, [apiVisitors]);

  // Derive status from data: signed-out wins. Otherwise: if the
  // arrival is in the future, it's an "expected" pre-authorization
  // (resident-scheduled, hasn't shown up yet) — those should NOT
  // count as currently-in-building. Anything else with no departure
  // is on the floor right now.
  const getStatus = (v: VisitorItem): 'signed_in' | 'signed_out' | 'expected' => {
    if (v.departureAt) return 'signed_out';
    if (new Date(v.arrivalAt).getTime() > Date.now() + 5 * 60 * 1000) return 'expected';
    return 'signed_in';
  };

  // Filtered lists
  const filteredVisitors = useMemo(() => {
    return allVisitors.filter((v) => {
      // Status filter
      if (statusFilter !== 'all' && getStatus(v) !== statusFilter) return false;
      return true;
    });
  }, [statusFilter, allVisitors]);

  const currentlyIn = useMemo(
    () => filteredVisitors.filter((v) => getStatus(v) === 'signed_in'),
    [filteredVisitors],
  );

  const recentDepartures = useMemo(
    () => filteredVisitors.filter((v) => getStatus(v) === 'signed_out'),
    [filteredVisitors],
  );

  // Summary counts (unfiltered)
  const totalCurrentlyIn = allVisitors.filter((v) => getStatus(v) === 'signed_in').length;
  const totalSignedInToday = allVisitors.filter((v) => getStatus(v) !== 'expected').length;
  const totalExpected = allVisitors.filter((v) => getStatus(v) === 'expected').length;

  // ---------------------------------------------------------------------------
  // Currently In Building Columns
  // ---------------------------------------------------------------------------

  const currentlyInColumns: Column<VisitorItem>[] = [
    {
      id: 'visitorName',
      header: 'Visitor Name',
      accessorKey: 'visitorName',
      sortable: true,
      cell: (row) => <span className="font-semibold text-neutral-900">{row.visitorName}</span>,
    },
    {
      id: 'visitorType',
      header: 'Type',
      accessorKey: 'visitorType',
      sortable: true,
      cell: (row) => {
        const colorClass =
          VISITOR_TYPE_COLORS[row.visitorType] ?? 'bg-neutral-100 text-neutral-700';
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {VISITOR_TYPE_LABELS[row.visitorType] ?? row.visitorType}
          </span>
        );
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.unit?.number ?? '\u2014'}</span>,
    },
    {
      id: 'arrivalAt',
      header: 'Arrived',
      accessorKey: 'arrivalAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">{formatTime(row.arrivalAt)}</span>
      ),
    },
    {
      id: 'expectedDepartureAt',
      header: 'Expected Departure',
      accessorKey: 'expectedDepartureAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.expectedDepartureAt ? formatTime(row.expectedDepartureAt) : '\u2014'}
        </span>
      ),
    },
    {
      id: 'comments',
      header: 'Comments',
      accessorKey: 'comments',
      cell: (row) => (
        <span className="block max-w-[200px] truncate text-[13px] text-neutral-500">
          {row.comments ?? '\u2014'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => {
        const isSigningOut = signingOutId === row.id;
        return (
          <Button
            variant="secondary"
            size="sm"
            disabled={isSigningOut}
            onClick={(e) => {
              e.stopPropagation();
              handleSignOut(row.id);
            }}
          >
            {isSigningOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Button>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // Recent Departures Columns
  // ---------------------------------------------------------------------------

  const departedColumns: Column<VisitorItem>[] = [
    {
      id: 'visitorName',
      header: 'Visitor Name',
      accessorKey: 'visitorName',
      sortable: true,
    },
    {
      id: 'visitorType',
      header: 'Type',
      accessorKey: 'visitorType',
      sortable: true,
      cell: (row) => {
        const colorClass =
          VISITOR_TYPE_COLORS[row.visitorType] ?? 'bg-neutral-100 text-neutral-700';
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {VISITOR_TYPE_LABELS[row.visitorType] ?? row.visitorType}
          </span>
        );
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      sortable: true,
      cell: (row) => <span>{row.unit?.number ?? '\u2014'}</span>,
    },
    {
      id: 'arrivalAt',
      header: 'Arrived',
      accessorKey: 'arrivalAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">{formatTime(row.arrivalAt)}</span>
      ),
    },
    {
      id: 'departureAt',
      header: 'Departed',
      accessorKey: 'departureAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.departureAt ? formatTime(row.departureAt) : '\u2014'}
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.departureAt ? getDuration(row.arrivalAt, row.departureAt) : '\u2014'}
        </span>
      ),
    },
    {
      id: 'comments',
      header: 'Comments',
      accessorKey: 'comments',
      cell: (row) => (
        <span className="block max-w-[200px] truncate text-[13px] text-neutral-500">
          {row.comments ?? '\u2014'}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      hero="sky"
      title="Visitors"
      description="Who's in the building, who just signed out, who is expected."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const rows = filteredVisitors.map((v) => ({
                visitorName: v.visitorName,
                visitorType: VISITOR_TYPE_LABELS[v.visitorType],
                unit: v.unit?.number ?? '',
                arrivalAt: v.arrivalAt,
                departureAt: v.departureAt ?? '',
                status: getStatus(v) === 'signed_in' ? 'Signed In' : 'Signed Out',
                comments: v.comments ?? '',
              }));
              exportToCsv(
                rows,
                [
                  { key: 'visitorName', header: 'Visitor Name' },
                  { key: 'visitorType', header: 'Type' },
                  { key: 'unit', header: 'Unit' },
                  { key: 'arrivalAt', header: 'Arrived' },
                  { key: 'departureAt', header: 'Departed' },
                  { key: 'status', header: 'Status' },
                  { key: 'comments', header: 'Comments' },
                ],
                'visitors',
              );
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Quick Sign In
          </Button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading visitors...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load visitors"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {/* Summary tiles */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiTile
              label="Currently in building"
              value={totalCurrentlyIn}
              icon={LogIn}
              accent="warning"
              caption={totalCurrentlyIn === 0 ? 'Lobby is empty.' : 'On site right now.'}
            />
            <KpiTile
              label="Signed in today"
              value={totalSignedInToday}
              icon={Users}
              accent="info"
              caption="Visitor traffic since midnight."
            />
            <KpiTile
              label="Expected"
              value={totalExpected}
              icon={Clock}
              accent="neutral"
              caption="Pre-authorized for later today."
            />
          </div>

          {/* Search + Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by visitor name, unit, or resident..."
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
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="visitor">Visitor</option>
                <option value="contractor">Contractor</option>
                <option value="delivery_person">Delivery Person</option>
                <option value="real_estate_agent">Real Estate Agent</option>
                <option value="emergency_service">Emergency Service</option>
                <option value="other">Other</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="signed_in">Signed In</option>
                <option value="signed_out">Signed Out</option>
                <option value="expected">Expected</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Currently In Building Section */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-neutral-900">Currently In Building</h2>
              <Badge variant="warning" size="sm">
                {currentlyIn.length}
              </Badge>
            </div>
            {currentlyIn.length > 0 ? (
              <DataTable
                columns={currentlyInColumns}
                data={currentlyIn}
                onRowClick={(row) => router.push(`/visitors/${row.id}` as never)}
              />
            ) : (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No visitors in building"
                description="There are currently no signed-in visitors. New arrivals will appear here."
              />
            )}
          </div>

          {/* Recent Departures Section */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-neutral-900">Recent Departures</h2>
              <Badge variant="success" size="sm">
                {recentDepartures.length}
              </Badge>
              <span className="text-[12px] text-neutral-400">Today</span>
            </div>
            {recentDepartures.length > 0 ? (
              <DataTable
                columns={departedColumns}
                data={recentDepartures}
                onRowClick={(row) => router.push(`/visitors/${row.id}` as never)}
              />
            ) : (
              <EmptyState
                icon={<LogOut className="h-6 w-6" />}
                title="No departures yet"
                description="Signed-out visitors from today will appear here."
              />
            )}
          </div>
        </>
      )}
      <CreateVisitorDialog
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
