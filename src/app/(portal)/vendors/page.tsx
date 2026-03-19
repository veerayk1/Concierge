'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Plus,
  Search,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { CreateVendorDialog } from '@/components/forms/create-vendor-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorItem {
  id: string;
  name: string;
  category:
    | 'plumbing'
    | 'electrical'
    | 'elevator'
    | 'hvac'
    | 'cleaning'
    | 'landscaping'
    | 'general';
  contactName: string;
  phone: string;
  email: string;
  status: 'compliant' | 'non_compliant' | 'expiring' | 'expired' | 'not_tracking';
  insuranceExpiry: string;
  licenseNumber: string;
  rating: number;
  activeWorkOrders: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_VENDORS: VendorItem[] = [
  {
    id: '1',
    name: 'ThyssenKrupp Elevator',
    category: 'elevator',
    contactName: 'Mark Patterson',
    phone: '(416) 555-0101',
    email: 'mpatterson@tkelevator.com',
    status: 'compliant',
    insuranceExpiry: '2027-01-15',
    licenseNumber: 'EL-2024-8831',
    rating: 5,
    activeWorkOrders: 2,
  },
  {
    id: '2',
    name: 'GTA Plumbing Solutions',
    category: 'plumbing',
    contactName: 'Tony Russo',
    phone: '(416) 555-0202',
    email: 'tony@gtaplumbing.ca',
    status: 'expiring',
    insuranceExpiry: '2026-04-10',
    licenseNumber: 'PL-2023-4412',
    rating: 4,
    activeWorkOrders: 3,
  },
  {
    id: '3',
    name: 'CoolAir HVAC Services',
    category: 'hvac',
    contactName: 'Sandra Lee',
    phone: '(416) 555-0303',
    email: 'sandra@coolairhvac.ca',
    status: 'compliant',
    insuranceExpiry: '2026-11-30',
    licenseNumber: 'HV-2024-7790',
    rating: 4,
    activeWorkOrders: 1,
  },
  {
    id: '4',
    name: 'Sparkle Commercial Cleaning',
    category: 'cleaning',
    contactName: 'Maria Santos',
    phone: '(416) 555-0404',
    email: 'maria@sparkleclean.ca',
    status: 'non_compliant',
    insuranceExpiry: '2026-01-01',
    licenseNumber: 'CL-2022-3301',
    rating: 3,
    activeWorkOrders: 0,
  },
  {
    id: '5',
    name: 'BrightWire Electrical',
    category: 'electrical',
    contactName: 'James Okonkwo',
    phone: '(416) 555-0505',
    email: 'james@brightwire.ca',
    status: 'expired',
    insuranceExpiry: '2025-12-15',
    licenseNumber: 'EC-2023-6654',
    rating: 5,
    activeWorkOrders: 1,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  VendorItem['status'],
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  compliant: { variant: 'success', label: 'Compliant' },
  non_compliant: { variant: 'error', label: 'Non-Compliant' },
  expiring: { variant: 'warning', label: 'Expiring' },
  expired: { variant: 'error', label: 'Expired' },
  not_tracking: { variant: 'default', label: 'Not Tracking' },
};

const CATEGORY_LABELS: Record<VendorItem['category'], string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  elevator: 'Elevator',
  hvac: 'HVAC',
  cleaning: 'Cleaning',
  landscaping: 'Landscaping',
  general: 'General',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'fill-warning-400 text-warning-400' : 'text-neutral-200'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VendorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: apiVendors, refetch } = useApi<VendorItem[]>(
    apiUrl('/api/v1/vendors', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allVendors = useMemo(() => {
    if (apiVendors && Array.isArray(apiVendors) && apiVendors.length > 0) {
      return apiVendors;
    }
    return MOCK_VENDORS;
  }, [apiVendors]);

  const filteredVendors = useMemo(
    () =>
      allVendors.filter((v) => {
        if (statusFilter !== 'all' && v.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            v.name.toLowerCase().includes(q) ||
            v.contactName.toLowerCase().includes(q) ||
            v.email.toLowerCase().includes(q) ||
            v.phone.includes(q) ||
            v.licenseNumber.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [allVendors, searchQuery, statusFilter, categoryFilter],
  );

  const totalVendors = allVendors.length;
  const compliantCount = allVendors.filter((v) => v.status === 'compliant').length;
  const expiringCount = allVendors.filter((v) => v.status === 'expiring').length;

  const columns: Column<VendorItem>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="text-[13px] font-semibold text-neutral-900">{row.name}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => (
        <Badge variant="default" size="sm">
          {CATEGORY_LABELS[row.category]}
        </Badge>
      ),
    },
    {
      id: 'contactName',
      header: 'Contact',
      accessorKey: 'contactName',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-700">{row.contactName}</span>,
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.phone}</span>,
    },
    {
      id: 'status',
      header: 'Insurance Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status];
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'insuranceExpiry',
      header: 'Expiry Date',
      accessorKey: 'insuranceExpiry',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.insuranceExpiry).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      accessorKey: 'rating',
      sortable: true,
      cell: (row) => <StarRating rating={row.rating} />,
    },
    {
      id: 'activeWorkOrders',
      header: 'Active WOs',
      accessorKey: 'activeWorkOrders',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-medium text-neutral-700">{row.activeWorkOrders}</span>
      ),
    },
  ];

  return (
    <PageShell
      title="Vendors"
      description="Manage vendor relationships, contracts, and compliance."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Vendors',
            value: totalVendors,
            icon: Truck,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
          },
          {
            label: 'Compliant',
            value: compliantCount,
            icon: CheckCircle2,
            color: 'text-success-600',
            bg: 'bg-success-50',
          },
          {
            label: 'Expiring Soon',
            value: expiringCount,
            icon: AlertTriangle,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{stat.value}</p>
              <p className="text-[13px] text-neutral-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Filter Toggle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search vendors..."
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
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
            showFilters
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium tracking-wider text-neutral-500 uppercase">
              Status:
            </span>
            {[
              { key: 'all', label: 'All' },
              { key: 'compliant', label: 'Compliant' },
              { key: 'non_compliant', label: 'Non-Compliant' },
              { key: 'expiring', label: 'Expiring' },
              { key: 'expired', label: 'Expired' },
              { key: 'not_tracking', label: 'Not Tracking' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatusFilter(s.key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                  statusFilter === s.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium tracking-wider text-neutral-500 uppercase">
              Category:
            </span>
            {[
              { key: 'all', label: 'All' },
              { key: 'plumbing', label: 'Plumbing' },
              { key: 'electrical', label: 'Electrical' },
              { key: 'elevator', label: 'Elevator' },
              { key: 'hvac', label: 'HVAC' },
              { key: 'cleaning', label: 'Cleaning' },
              { key: 'landscaping', label: 'Landscaping' },
              { key: 'general', label: 'General' },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategoryFilter(c.key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                  categoryFilter === c.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vendor Table */}
      {filteredVendors.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredVendors}
          emptyMessage="No vendors found."
          emptyIcon={<Truck className="h-6 w-6" />}
          onRowClick={(row) => router.push(`/vendors/${row.id}` as never)}
        />
      ) : (
        <EmptyState
          icon={<Truck className="h-6 w-6" />}
          title="No vendors found"
          description="Try adjusting your search or filters to find what you are looking for."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
            >
              Clear Filters
            </Button>
          }
        />
      )}
      <CreateVendorDialog
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
