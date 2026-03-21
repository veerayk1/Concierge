'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Upload,
  Search,
  Activity,
  BarChart3,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Types (aligned with API response from /api/v1/properties)
// ---------------------------------------------------------------------------

interface PropertyFromApi {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  unitCount: number;
  timezone: string;
  logo: string | null;
  type: string; // PRODUCTION, DEMO, SANDBOX
  subscriptionTier: string | null;
  slug: string | null;
  branding: unknown;
  propertyCode: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeVariant(type: string): 'primary' | 'info' | 'warning' | 'default' {
  switch (type.toUpperCase()) {
    case 'PRODUCTION':
      return 'primary';
    case 'DEMO':
      return 'info';
    case 'SANDBOX':
      return 'warning';
    default:
      return 'default';
  }
}

function subscriptionVariant(sub: string | null): 'default' | 'primary' | 'info' {
  switch (sub?.toUpperCase()) {
    case 'STARTER':
      return 'default';
    case 'PROFESSIONAL':
      return 'primary';
    case 'ENTERPRISE':
      return 'info';
    default:
      return 'default';
  }
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: Column<PropertyFromApi>[] = [
  {
    id: 'name',
    header: 'Property',
    accessorKey: 'name',
    sortable: true,
    cell: (row) => (
      <div>
        <p className="font-medium text-neutral-900">{row.name}</p>
        <p className="text-[12px] text-neutral-500">
          {row.address}, {row.city}
          {row.province ? `, ${row.province}` : ''}
        </p>
      </div>
    ),
  },
  {
    id: 'unitCount',
    header: 'Units',
    accessorKey: 'unitCount',
    sortable: true,
    cell: (row) => <span className="font-medium text-neutral-900">{row.unitCount}</span>,
  },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    sortable: true,
    cell: (row) => (
      <Badge variant={typeVariant(row.type)} size="sm">
        {row.type.charAt(0) + row.type.slice(1).toLowerCase()}
      </Badge>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={row.isActive ? 'success' : 'default'} size="sm" dot>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'subscription',
    header: 'Subscription',
    accessorKey: 'subscriptionTier',
    sortable: true,
    cell: (row) => {
      if (!row.subscriptionTier) {
        return <span className="text-[13px] text-neutral-400">--</span>;
      }
      const tierLabel =
        row.subscriptionTier.charAt(0).toUpperCase() + row.subscriptionTier.slice(1).toLowerCase();
      return (
        <Badge variant={subscriptionVariant(row.subscriptionTier)} size="sm">
          {tierLabel}
        </Badge>
      );
    },
  },
  {
    id: 'createdAt',
    header: 'Created',
    accessorKey: 'createdAt',
    sortable: true,
    cell: (row) => (
      <span className="text-[13px] text-neutral-500">{formatRelativeTime(row.createdAt)}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Create Property Dialog
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = ['PRODUCTION', 'DEMO', 'SANDBOX'] as const;
const TIMEZONES = [
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns',
];

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreatePropertyDialog({ open, onOpenChange, onSuccess }: CreatePropertyDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get('name') as string,
      slug: (form.get('slug') as string) || undefined,
      address: form.get('address') as string,
      city: form.get('city') as string,
      province: form.get('province') as string,
      postalCode: form.get('postalCode') as string,
      country: (form.get('country') as string) || 'CA',
      type: form.get('type') as string,
      unitCount: parseInt((form.get('unitCount') as string) || '0', 10),
      timezone: form.get('timezone') as string,
      phone: (form.get('phone') as string) || undefined,
      email: (form.get('email') as string) || undefined,
    };

    try {
      const res = await apiRequest('/api/v1/properties', { method: 'POST', body });
      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || 'Failed to create property');
        return;
      }

      // Auto-switch property context so admin can immediately manage this property
      const newPropertyId = result.data?.id;
      if (newPropertyId && typeof window !== 'undefined') {
        localStorage.setItem('demo_propertyId', newPropertyId);
      }

      setSuccessMsg(`Property "${result.data?.name || body.name}" created successfully.`);
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMsg(null);
        onSuccess();
      }, 1200);
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Building2 className="text-primary-500 h-5 w-5" />
          Add Property
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new property. Required fields are marked with an asterisk.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}
          {successMsg && (
            <div className="border-success-200 bg-success-50 text-success-700 rounded-xl border px-4 py-3 text-[14px]">
              {successMsg}
            </div>
          )}

          <p className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Property Information
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="name"
              label="Property Name"
              placeholder="e.g. Maple Heights Condominiums"
              required
            />
            <Input name="slug" label="Slug (optional)" placeholder="e.g. maple-heights" />
          </div>

          <Input
            name="address"
            label="Street Address"
            placeholder="e.g. 100 Maple Avenue"
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input name="city" label="City" placeholder="e.g. Toronto" required />
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Province<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                name="province"
                defaultValue="Ontario"
                required
                className="focus:border-primary-500 focus:ring-primary-500/20 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 focus:ring-2 focus:outline-none"
              >
                {[
                  'Alberta',
                  'British Columbia',
                  'Manitoba',
                  'New Brunswick',
                  'Newfoundland and Labrador',
                  'Nova Scotia',
                  'Ontario',
                  'Prince Edward Island',
                  'Quebec',
                  'Saskatchewan',
                  'Northwest Territories',
                  'Nunavut',
                  'Yukon',
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Input name="postalCode" label="Postal Code" placeholder="e.g. M5V 2H1" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Country</label>
              <select
                name="country"
                defaultValue="CA"
                className="focus:border-primary-500 focus:ring-primary-500/20 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 focus:ring-2 focus:outline-none"
              >
                <option value="CA">Canada</option>
                <option value="US">United States</option>
              </select>
            </div>
            <Input
              name="unitCount"
              label="Total Units"
              type="number"
              defaultValue="0"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                name="type"
                defaultValue="PRODUCTION"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Timezone</label>
              <select
                name="timezone"
                defaultValue="America/Toronto"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-2 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Contact (Optional)
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input name="phone" label="Phone" placeholder="+1 416-555-0100" />
            <Input name="email" label="Email" type="email" placeholder="admin@property.com" />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Property'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch properties from API with search param
  const {
    data: apiProperties,
    loading,
    error,
    refetch,
  } = useApi<PropertyFromApi[]>(
    apiUrl('/api/v1/properties', {
      search: searchQuery || null,
    }),
  );

  const properties: PropertyFromApi[] = useMemo(() => {
    if (!apiProperties) return [];
    return Array.isArray(apiProperties) ? apiProperties : [];
  }, [apiProperties]);

  const handlePropertyCreated = useCallback(() => {
    refetch();
  }, [refetch]);

  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.isActive).length;
  const demoProperties = properties.filter((p) => p.type === 'DEMO' || p.type === 'SANDBOX').length;
  const totalUnits = properties.reduce((sum, p) => sum + p.unitCount, 0);

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Properties"
        description="Manage all properties in your portfolio."
        actions={
          <>
            <Button variant="secondary">
              <Upload className="h-4 w-4" />
              Import Property
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-64 rounded-2xl" />
        <CreatePropertyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handlePropertyCreated}
        />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Properties" description="Manage all properties in your portfolio.">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load properties"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
        <CreatePropertyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handlePropertyCreated}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Properties"
      description="Manage all properties in your portfolio."
      actions={
        <>
          <Button variant="secondary">
            <Upload className="h-4 w-4" />
            Import Property
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {totalProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Total Properties</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Activity className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {activeProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Active</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <BarChart3 className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {demoProperties}
            </p>
            <p className="text-[13px] text-neutral-500">Demo / Sandbox</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalUnits}</p>
            <p className="text-[13px] text-neutral-500">Total Units</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
        </div>
      </div>

      {/* Properties Table */}
      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No properties found"
          description={
            searchQuery
              ? 'No properties match your search. Try a different query.'
              : 'Add your first property to get started.'
          }
          action={
            !searchQuery ? (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable<PropertyFromApi>
          columns={columns}
          data={properties}
          emptyMessage="No properties found."
          emptyIcon={<Building2 className="h-6 w-6" />}
          onRowClick={(row) => {
            router.push(`/system/properties/${row.id}` as never);
          }}
        />
      )}

      {/* Create Property Dialog */}
      <CreatePropertyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handlePropertyCreated}
      />
    </PageShell>
  );
}
