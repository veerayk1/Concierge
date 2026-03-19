'use client';

import { useState, useMemo } from 'react';
import {
  IdCard,
  Plus,
  Download,
  Search,
  X,
  CheckCircle2,
  Clock,
  Printer,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateResidentCardDialog } from '@/components/forms/create-resident-card-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CardType = 'resident' | 'owner' | 'tenant' | 'family_member' | 'staff';
type CardStatus = 'active' | 'expired' | 'suspended' | 'pending' | 'lost' | 'revoked';

/** Raw shape from GET /api/v1/resident-cards */
interface ApiResidentCard {
  id: string;
  qrCode: string;
  residentName: string;
  residentId: string | null;
  unitId: string | null;
  designTemplate: string;
  status: string;
  accessLevel: string;
  photoUrl: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  issuedById: string | null;
  property?: { name: string };
}

interface ResidentCardItem {
  id: string;
  cardNumber: string;
  residentName: string;
  unit: string;
  type: CardType;
  status: CardStatus;
  issuedDate: string;
  expiryDate: string;
  photoOnFile: boolean;
  lastUsed: string | null;
}

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

function normalizeCard(raw: ApiResidentCard): ResidentCardItem {
  const typeMap: Record<string, CardType> = {
    resident: 'resident',
    owner: 'owner',
    tenant: 'tenant',
    family_member: 'family_member',
    staff: 'staff',
    standard: 'resident',
  };

  return {
    id: raw.id,
    cardNumber: raw.qrCode,
    residentName: raw.residentName,
    unit: raw.unitId ?? 'N/A',
    type: typeMap[raw.designTemplate] ?? 'resident',
    status: (raw.status as CardStatus) || 'active',
    issuedDate: raw.createdAt,
    expiryDate: raw.expiresAt,
    photoOnFile: !!raw.photoUrl,
    lastUsed: null, // Not tracked in current API
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<CardType, string> = {
  resident: 'Resident',
  owner: 'Owner',
  tenant: 'Tenant',
  family_member: 'Family',
  staff: 'Staff',
};

const TYPE_BADGE_VARIANT: Record<CardType, 'default' | 'primary' | 'info' | 'warning' | 'success'> =
  {
    resident: 'default',
    owner: 'primary',
    tenant: 'info',
    family_member: 'warning',
    staff: 'success',
  };

const STATUS_CONFIG: Record<
  CardStatus,
  {
    label: string;
    variant: 'success' | 'error' | 'warning' | 'info' | 'default';
    icon: typeof CheckCircle2;
  }
> = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  expired: { label: 'Expired', variant: 'error', icon: AlertTriangle },
  suspended: { label: 'Suspended', variant: 'warning', icon: AlertTriangle },
  pending: { label: 'Pending', variant: 'info', icon: Clock },
  lost: { label: 'Lost', variant: 'error', icon: X },
  revoked: { label: 'Revoked', variant: 'error', icon: X },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResidentCardsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CardStatus | 'all'>('all');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiCards,
    loading,
    error,
    refetch,
  } = useApi<ApiResidentCard[]>(
    apiUrl('/api/v1/resident-cards', { propertyId: DEMO_PROPERTY_ID, pageSize: '200' }),
  );

  const cards = useMemo<ResidentCardItem[]>(() => (apiCards ?? []).map(normalizeCard), [apiCards]);

  // Filtered data
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (typeFilter !== 'all' && card.type !== typeFilter) return false;
      if (statusFilter !== 'all' && card.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          card.cardNumber.toLowerCase().includes(q) ||
          card.residentName.toLowerCase().includes(q) ||
          card.unit.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cards, typeFilter, statusFilter, searchQuery]);

  // Summary counts
  const totalCards = cards.length;
  const activeCards = cards.filter((c) => c.status === 'active').length;
  const expiredLostCards = cards.filter(
    (c) => c.status === 'expired' || c.status === 'lost' || c.status === 'revoked',
  ).length;

  // Toggle card selection for batch print
  function toggleCardSelection(id: string) {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Columns
  const columns: Column<ResidentCardItem>[] = [
    {
      id: 'cardNumber',
      header: 'Card #',
      accessorKey: 'cardNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-[13px] text-neutral-700">{row.cardNumber}</span>
      ),
    },
    {
      id: 'residentName',
      header: 'Resident',
      accessorKey: 'residentName',
      sortable: true,
      cell: (row) => <span className="font-semibold text-neutral-900">{row.residentName}</span>,
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={TYPE_BADGE_VARIANT[row.type]} size="sm">
          {TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const config = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.active;
        return (
          <Badge variant={config.variant} size="sm" dot>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'issuedDate',
      header: 'Issued',
      accessorKey: 'issuedDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-600">{formatDate(row.issuedDate)}</span>
      ),
    },
    {
      id: 'expiryDate',
      header: 'Expires',
      accessorKey: 'expiryDate',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-600">{formatDate(row.expiryDate)}</span>
      ),
    },
    {
      id: 'photoOnFile',
      header: 'Photo',
      cell: (row) =>
        row.photoOnFile ? (
          <CheckCircle2 className="text-success-500 h-4 w-4" />
        ) : (
          <X className="h-4 w-4 text-neutral-300" />
        ),
      className: 'text-center',
      headerClassName: 'text-center',
    },
    {
      id: 'lastUsed',
      header: 'Last Used',
      accessorKey: 'lastUsed',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {row.lastUsed ? formatDate(row.lastUsed) : '--'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Print single card
          }}
          title="Print card"
        >
          <Printer className="h-4 w-4" />
        </Button>
      ),
      className: 'w-12',
    },
  ];

  return (
    <PageShell
      title="Resident Cards"
      description="Issue and manage resident identification cards."
      actions={
        <>
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Issue New Card
          </Button>
        </>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <IdCard className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-500">Total Cards</p>
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-[22px] font-bold text-neutral-900">{totalCards}</p>
              )}
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
              <CheckCircle2 className="text-success-600 h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-500">Active</p>
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-success-700 text-[22px] font-bold">{activeCards}</p>
              )}
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="bg-error-50 flex h-10 w-10 items-center justify-center rounded-xl">
              <AlertTriangle className="text-error-600 h-5 w-5" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-neutral-500">Expired / Lost</p>
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-error-700 text-[22px] font-bold">{expiredLostCards}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative max-w-sm min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, card #, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-9 w-full rounded-lg border border-neutral-200 bg-white pr-3 pl-9 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CardType | 'all')}
          className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="resident">Resident</option>
          <option value="owner">Owner</option>
          <option value="tenant">Tenant</option>
          <option value="family_member">Family Member</option>
          <option value="staff">Staff</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CardStatus | 'all')}
          className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="lost">Lost</option>
          <option value="revoked">Revoked</option>
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Batch Print */}
        <Button
          variant="secondary"
          size="sm"
          disabled={selectedCards.size === 0}
          onClick={() => {
            // Batch print selected cards
          }}
        >
          <Printer className="h-4 w-4" />
          Batch Print{selectedCards.size > 0 ? ` (${selectedCards.size})` : ''}
        </Button>
      </div>

      {/* Data Table */}
      <div className="mt-4">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
            <p className="mt-3 text-[14px] text-neutral-500">Loading resident cards...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
            <AlertTriangle className="text-error-500 h-8 w-8" />
            <p className="mt-3 text-[14px] font-medium text-neutral-900">
              Failed to load resident cards
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && cards.length === 0 && (
          <EmptyState
            icon={<IdCard className="h-6 w-6" />}
            title="No resident cards yet"
            description="Issue your first resident card to get started."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                Issue New Card
              </Button>
            }
          />
        )}

        {/* Filtered empty */}
        {!loading && !error && cards.length > 0 && filteredCards.length === 0 && (
          <EmptyState
            icon={<IdCard className="h-6 w-6" />}
            title="No resident cards found"
            description="Try adjusting your search or filters."
          />
        )}

        {/* Table */}
        {!loading && !error && filteredCards.length > 0 && (
          <DataTable<ResidentCardItem> columns={columns} data={filteredCards} />
        )}
      </div>

      <CreateResidentCardDialog
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
