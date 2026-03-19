'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Users,
  Plus,
  Download,
  Search,
  Filter,
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
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateVisitorDialog } from '@/components/forms/create-visitor-dialog';

// ---------------------------------------------------------------------------
// Types
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
  unit: string;
  residentName: string;
  arrivalAt: string;
  departureAt: string | null;
  expectedDepartureAt: string;
  status: 'signed_in' | 'signed_out' | 'expected';
  signedInBy: string;
  parkingPermit: boolean;
  comments: string | null;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_VISITORS: VisitorItem[] = [
  {
    id: '1',
    visitorName: 'Sarah Thompson',
    visitorType: 'visitor',
    unit: '1501',
    residentName: 'Janet Smith',
    arrivalAt: '2026-03-19T09:30:00',
    departureAt: null,
    expectedDepartureAt: '2026-03-19T17:00:00',
    status: 'signed_in',
    signedInBy: 'Mike Johnson',
    parkingPermit: true,
    comments: 'Family visit',
  },
  {
    id: '2',
    visitorName: 'James Rivera',
    visitorType: 'contractor',
    unit: '802',
    residentName: 'David Chen',
    arrivalAt: '2026-03-19T08:00:00',
    departureAt: null,
    expectedDepartureAt: '2026-03-19T16:00:00',
    status: 'signed_in',
    signedInBy: 'Angela Davis',
    parkingPermit: false,
    comments: 'Kitchen renovation — Phase 2',
  },
  {
    id: '3',
    visitorName: 'Carlos Mendez',
    visitorType: 'delivery_person',
    unit: '1203',
    residentName: 'Maria Garcia',
    arrivalAt: '2026-03-19T11:45:00',
    departureAt: null,
    expectedDepartureAt: '2026-03-19T12:15:00',
    status: 'signed_in',
    signedInBy: 'Mike Johnson',
    parkingPermit: false,
    comments: null,
  },
  {
    id: '4',
    visitorName: 'Emily Watson',
    visitorType: 'visitor',
    unit: '305',
    residentName: 'Robert Kim',
    arrivalAt: '2026-03-19T07:30:00',
    departureAt: '2026-03-19T09:45:00',
    expectedDepartureAt: '2026-03-19T10:00:00',
    status: 'signed_out',
    signedInBy: 'Angela Davis',
    parkingPermit: true,
    comments: 'Morning coffee visit',
  },
  {
    id: '5',
    visitorName: 'Alex Nguyen',
    visitorType: 'real_estate_agent',
    unit: '710',
    residentName: 'Sarah Wilson',
    arrivalAt: '2026-03-19T10:00:00',
    departureAt: '2026-03-19T11:00:00',
    expectedDepartureAt: '2026-03-19T11:30:00',
    status: 'signed_out',
    signedInBy: 'Mike Johnson',
    parkingPermit: true,
    comments: 'Unit showing for prospective buyer',
  },
  {
    id: '6',
    visitorName: 'Priya Patel',
    visitorType: 'contractor',
    unit: '1105',
    residentName: 'Lisa Brown',
    arrivalAt: '2026-03-19T08:15:00',
    departureAt: '2026-03-19T10:30:00',
    expectedDepartureAt: '2026-03-19T12:00:00',
    status: 'signed_out',
    signedInBy: 'Angela Davis',
    parkingPermit: false,
    comments: 'Plumbing inspection',
  },
];

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

const VISITOR_TYPE_COLORS: Record<VisitorItem['visitorType'], string> = {
  visitor: 'bg-blue-100 text-blue-700',
  contractor: 'bg-orange-100 text-orange-700',
  delivery_person: 'bg-purple-100 text-purple-700',
  real_estate_agent: 'bg-teal-100 text-teal-700',
  emergency_service: 'bg-red-100 text-red-700',
  other: 'bg-neutral-100 text-neutral-700',
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

export default function VisitorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: apiVisitors, refetch } = useApi<VisitorItem[]>(
    apiUrl('/api/v1/visitors', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allVisitors = useMemo<VisitorItem[]>(() => apiVisitors ?? MOCK_VISITORS, [apiVisitors]);

  // Filtered lists
  const filteredVisitors = useMemo(() => {
    return allVisitors.filter((v) => {
      // Type filter
      if (typeFilter !== 'all' && v.visitorType !== typeFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.visitorName.toLowerCase().includes(q) ||
          v.unit.toLowerCase().includes(q) ||
          v.residentName.toLowerCase().includes(q) ||
          VISITOR_TYPE_LABELS[v.visitorType].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, typeFilter, statusFilter, allVisitors]);

  const currentlyIn = useMemo(
    () => filteredVisitors.filter((v) => v.status === 'signed_in'),
    [filteredVisitors],
  );

  const recentDepartures = useMemo(
    () => filteredVisitors.filter((v) => v.status === 'signed_out'),
    [filteredVisitors],
  );

  // Summary counts (unfiltered)
  const totalCurrentlyIn = allVisitors.filter((v) => v.status === 'signed_in').length;
  const totalSignedInToday = allVisitors.filter(
    (v) => v.status === 'signed_in' || v.status === 'signed_out',
  ).length;
  const totalExpected = allVisitors.filter((v) => v.status === 'expected').length;

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
        const colorClass = VISITOR_TYPE_COLORS[row.visitorType];
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {VISITOR_TYPE_LABELS[row.visitorType]}
          </span>
        );
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.unit}</span>,
    },
    {
      id: 'residentName',
      header: 'Resident',
      accessorKey: 'residentName',
      sortable: true,
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
        <span className="text-[13px] text-neutral-500">{formatTime(row.expectedDepartureAt)}</span>
      ),
    },
    {
      id: 'parkingPermit',
      header: 'Parking',
      accessorKey: 'parkingPermit',
      cell: (row) =>
        row.parkingPermit ? (
          <Badge variant="success" size="sm">
            Yes
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            No
          </Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Sign-out action placeholder
            console.log('Sign out visitor:', row.id);
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      ),
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
        const colorClass = VISITOR_TYPE_COLORS[row.visitorType];
        return (
          <span
            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold ${colorClass}`}
          >
            {VISITOR_TYPE_LABELS[row.visitorType]}
          </span>
        );
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
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
      id: 'signedOutBy',
      header: 'Signed Out By',
      accessorKey: 'signedInBy',
      cell: (row) => (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="text-success-500 h-3.5 w-3.5" />
          {row.signedInBy}
        </span>
      ),
    },
  ];

  return (
    <PageShell
      title="Visitors"
      description="Track visitor sign-in and sign-out for building security."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
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
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <LogIn className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {totalCurrentlyIn}
            </p>
            <p className="text-[13px] text-neutral-500">Currently In Building</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Users className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {totalSignedInToday}
            </p>
            <p className="text-[13px] text-neutral-500">Signed In Today</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Clock className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalExpected}</p>
            <p className="text-[13px] text-neutral-500">Expected</p>
          </div>
        </Card>
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
      <CreateVisitorDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={DEMO_PROPERTY_ID}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
