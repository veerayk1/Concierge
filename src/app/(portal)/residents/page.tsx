'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Phone, Plus, Search, Users, X } from 'lucide-react';
import { AddResidentDialog } from '@/components/forms/add-resident-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types — matches API response shape from GET /api/v1/residents
// ---------------------------------------------------------------------------

interface ApiResident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: { name: string; slug: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface ApiResponse {
  data: ApiResident[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  role: 'owner' | 'tenant' | 'family_member';
  roleLabel: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResidentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<ApiResponse>(
    apiUrl('/api/v1/residents', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      pageSize: '100',
    }),
  );

  const residents = useMemo<Resident[]>(() => {
    const rawResidents = apiResponse?.data ?? (apiResponse as unknown as ApiResident[]);
    if (!rawResidents || !Array.isArray(rawResidents)) return [];

    return rawResidents.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone || '',
      avatarUrl: r.avatarUrl || null,
      role: normalizeRole(r.role?.slug),
      roleLabel: r.role?.name || 'Resident',
      status: 'active' as const,
      createdAt: r.createdAt,
    }));
  }, [apiResponse]);

  const columns: Column<Resident>[] = [
    {
      id: 'name',
      header: 'Resident',
      accessorKey: 'lastName',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-[12px] text-neutral-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Type',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => {
        const map: Record<string, { variant: 'primary' | 'info' | 'default'; label: string }> = {
          owner: { variant: 'primary', label: 'Owner' },
          tenant: { variant: 'info', label: 'Tenant' },
          family_member: { variant: 'default', label: 'Family' },
        };
        const r = map[row.role] || { variant: 'default' as const, label: row.roleLabel };
        return (
          <Badge variant={r.variant} size="sm">
            {r.label}
          </Badge>
        );
      },
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) =>
        row.phone ? (
          <span className="flex items-center gap-1 text-[13px] text-neutral-600">
            <Phone className="h-3 w-3 text-neutral-400" />
            {row.phone}
          </span>
        ) : (
          <span className="text-[13px] text-neutral-300">{'\u2014'}</span>
        ),
    },
    {
      id: 'joined',
      header: 'Joined',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'} size="sm" dot>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <PageShell title="Resident Directory" description="Loading...">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Resident Directory" description="Error loading residents">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Failed to load residents"
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
      title="Resident Directory"
      description={`${residents.length} residents`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Resident
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
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
      </div>

      {residents.length === 0 && !searchQuery ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No residents found"
          description="Residents will appear here once they are added to this property."
          action={
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Resident
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={residents}
          emptyMessage="No residents match your search."
          emptyIcon={<Users className="h-6 w-6" />}
          onRowClick={(row) => router.push(`/residents/${row.id}` as never)}
        />
      )}

      <AddResidentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowAddDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRole(slug: string | undefined): Resident['role'] {
  const map: Record<string, Resident['role']> = {
    resident_owner: 'owner',
    resident_tenant: 'tenant',
    family_member: 'family_member',
    offsite_owner: 'owner',
  };
  return map[slug || ''] || 'tenant';
}
