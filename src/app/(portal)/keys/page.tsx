'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  AlertCircle,
  Key,
  Loader2,
  Plus,
  Download,
  Search,
  Filter,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiTile } from '@/components/ui/kpi-tile';
import { CreateKeyCheckoutDialog } from '@/components/forms/create-key-checkout-dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { AddKeyDialog } from '@/components/forms/add-key-dialog';
import { exportToCsv } from '@/lib/export-csv';

// ---------------------------------------------------------------------------
// Types — mapped from API response (Prisma KeyInventory + enrichment)
// ---------------------------------------------------------------------------

interface ActiveCheckout {
  id: string;
  checkedOutTo: string | null;
  checkoutTime: string;
  returnTime: string | null;
  expectedReturn: string | null;
  unitId: string | null;
}

interface KeyItem {
  id: string;
  keyName: string;
  keyNumber: string | null;
  keyOwner: string | null;
  category: string;
  status: 'available' | 'checked_out' | 'lost' | 'decommissioned';
  notes: string | null;
  activeCheckout: ActiveCheckout | null;
  isOverdue: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KeysPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);
  const { flash, ConfirmHost } = useConfirmDialog();

  // Fetch real data from API with server-side filters
  const {
    data: apiKeys,
    loading,
    error,
    refetch,
  } = useApi<KeyItem[]>(
    apiUrl('/api/v1/keys', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      category: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  );

  const allKeys = useMemo<KeyItem[]>(() => apiKeys ?? [], [apiKeys]);

  // Data is already filtered server-side via query params
  const filteredKeys = allKeys;

  // Summary counts
  const totalCount = allKeys.length;
  const checkedOutCount = allKeys.filter((k) => k.status === 'checked_out').length;
  const lostCount = allKeys.filter((k) => k.status === 'lost').length;
  // Overdue is "checked out AND past expected return". A guard's first
  // glance at this page should answer "is anyone holding something
  // they were supposed to return"; surfacing the count next to the
  // header beats forcing them to scan the table.
  const overdueCount = allKeys.filter((k) => k.isOverdue).length;

  // Category badge color map
  const categoryBadgeVariant: Record<string, 'info' | 'error' | 'default' | 'warning' | 'success'> =
    {
      fob: 'info',
      master: 'error',
      unit: 'default',
      garage_clicker: 'warning',
      buzzer_code: 'success',
      common_area: 'info',
      mailbox: 'default',
      storage_locker: 'default',
      vehicle: 'warning',
      equipment: 'default',
      other: 'default',
    };

  // Status badge config
  const statusBadgeVariant: Record<string, 'success' | 'info' | 'error' | 'default'> = {
    available: 'success',
    checked_out: 'info',
    lost: 'error',
    decommissioned: 'default',
  };

  const statusLabel: Record<string, string> = {
    available: 'Available',
    checked_out: 'Checked Out',
    lost: 'Lost',
    decommissioned: 'Decommissioned',
  };

  const categoryLabel: Record<string, string> = {
    master: 'Master Key',
    unit: 'Unit Key',
    common_area: 'Common Area',
    fob: 'FOB',
    buzzer_code: 'Buzzer Code',
    garage_clicker: 'Garage Clicker',
    mailbox: 'Mailbox',
    storage_locker: 'Storage Locker',
    vehicle: 'Vehicle',
    equipment: 'Equipment',
    other: 'Other',
  };

  // Table columns mapped to API response shape
  const columns: Column<KeyItem>[] = [
    {
      id: 'keyName',
      header: 'Name',
      accessorKey: 'keyName',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 font-mono text-[13px] font-semibold">{row.keyName}</span>
      ),
    },
    {
      id: 'keyNumber',
      header: 'Serial #',
      accessorKey: 'keyNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-700">{row.keyNumber || '\u2014'}</span>
      ),
    },
    {
      id: 'category',
      header: 'Type',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => (
        <Badge variant={categoryBadgeVariant[row.category] ?? 'default'} size="sm">
          {categoryLabel[row.category] ?? row.category}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={statusBadgeVariant[row.status] ?? 'default'} size="sm" dot>
          {statusLabel[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      accessorKey: 'keyOwner',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-700">{row.keyOwner || '\u2014'}</span>
      ),
    },
    {
      id: 'checkedOutTo',
      header: 'Checked Out To',
      cell: (row) => (
        <span className="text-[13px] text-neutral-700">
          {row.activeCheckout?.checkedOutTo || '\u2014'}
        </span>
      ),
    },
    {
      id: 'expectedReturn',
      header: 'Expected Return',
      cell: (row) => {
        if (!row.activeCheckout?.expectedReturn) {
          return <span className="text-[13px] text-neutral-400">{'\u2014'}</span>;
        }
        const due = new Date(row.activeCheckout.expectedReturn);
        const ms = Date.now() - due.getTime();
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor(ms / (60 * 60 * 1000));
        // Compose a guard-friendly overdue label \u2014 "Overdue \u00b7 3 days"
        // beats "(Overdue)" because the guard knows immediately whether
        // it's an hour late (chase by phone) or three days late
        // (escalate to supervisor).
        const overdueLabel = row.isOverdue
          ? days >= 1
            ? `${days} day${days === 1 ? '' : 's'} late`
            : hours >= 1
              ? `${hours} hr late`
              : 'Just overdue'
          : null;
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`text-[13px] ${row.isOverdue ? 'text-error-700 font-semibold' : 'text-neutral-700'}`}
            >
              {due.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {overdueLabel && (
              <span className="bg-error-50 text-error-700 ring-error-200 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1">
                <span className="bg-error-500 h-1.5 w-1.5 rounded-full" />
                {overdueLabel}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) =>
        row.status === 'checked_out' && row.activeCheckout ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                const headers: Record<string, string> = {
                  'Content-Type': 'application/json',
                };
                if (typeof window !== 'undefined') {
                  const demoRole = localStorage.getItem('demo_role');
                  if (demoRole) headers['x-demo-role'] = demoRole;
                  const token = localStorage.getItem('auth_token');
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                }
                const res = await fetch(`/api/v1/keys/checkouts/${row.activeCheckout!.id}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify({ action: 'return' }),
                });
                if (!res.ok) {
                  const err = await res.json();
                  flash('err', err.message || 'Failed to return key');
                  return;
                }
                flash('ok', 'Key returned.');
                refetch();
              } catch {
                flash('err', 'An unexpected error occurred while returning the key.');
              }
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Return
          </Button>
        ) : null,
    },
  ];

  return (
    <PageShell
      hero="violet"
      title="Keys & FOBs"
      description={
        overdueCount > 0
          ? `${overdueCount} past return time — chase the borrower. ${checkedOutCount} checked out total.`
          : 'Every physical credential in the building — who has it, when it comes back.'
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              exportToCsv(
                allKeys,
                [
                  { key: 'keyName', header: 'Key Name' },
                  { key: 'keyNumber', header: 'Key Number' },
                  { key: 'keyOwner', header: 'Owner' },
                  { key: 'category', header: 'Category' },
                  { key: 'status', header: 'Status' },
                  { key: 'notes', header: 'Notes' },
                ],
                'keys-fobs',
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddKeyDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Key / FOB
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowCreateDialog(true)}>
            <RotateCcw className="h-4 w-4" />
            Check Out Key
          </Button>
        </div>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading keys & FOBs...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load keys"
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
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiTile
              label="Total Inventory"
              value={totalCount}
              icon={Key}
              accent="primary"
              caption="All keys, FOBs, and clickers tracked"
            />
            <KpiTile
              label="Checked Out"
              value={checkedOutCount}
              icon={CheckCircle2}
              accent="info"
              caption="Currently issued to staff or residents"
            />
            <KpiTile
              label="Lost"
              value={lostCount}
              icon={AlertTriangle}
              accent="error"
              caption="Reported missing — needs replacement"
            />
          </div>

          {/* Search + Filters */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search keys & FOBs..."
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

            {/* Type filter pills */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'fob', label: 'FOBs' },
                { key: 'master', label: 'Master' },
                { key: 'unit', label: 'Unit' },
                { key: 'garage_clicker', label: 'Clicker' },
                { key: 'buzzer_code', label: 'Buzzer' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    typeFilter === t.key
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-neutral-400" />
              {[
                { key: 'all', label: 'All Status' },
                { key: 'available', label: 'Available' },
                { key: 'checked_out', label: 'Checked Out' },
                { key: 'lost', label: 'Lost' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(s.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    statusFilter === s.key
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredKeys}
            emptyMessage="No keys or FOBs found."
            emptyIcon={<Key className="h-6 w-6" />}
            onRowClick={(row) => {
              window.location.href = `/keys/${row.id}`;
            }}
          />
        </>
      )}
      <AddKeyDialog
        open={showAddKeyDialog}
        onOpenChange={setShowAddKeyDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowAddKeyDialog(false);
          refetch();
        }}
      />
      <CreateKeyCheckoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
      <ConfirmHost />
    </PageShell>
  );
}
