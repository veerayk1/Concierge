'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Power,
  RefreshCw,
  Shield,
  Star,
  Upload,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EditVendorDialog } from '@/components/forms/edit-vendor-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkOrder {
  id: string;
  refNumber: string;
  unit: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  date: string;
  rating: number;
}

interface VendorDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

type InsuranceStatus = 'compliant' | 'non_compliant' | 'expiring' | 'expired' | 'not_tracking';

interface VendorDetail {
  id: string;
  name: string;
  category: string;
  licenseNumber: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  contactName: string;
  notes: string;
  insuranceStatus: InsuranceStatus;
  insuranceProvider: string;
  policyNumber: string;
  coverageAmount: string;
  insuranceExpiry: string;
  averageRating: number;
  totalReviews: number;
  starBreakdown: number[];
  workOrders: WorkOrder[];
  documents: VendorDocument[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  InsuranceStatus,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string; description: string }
> = {
  compliant: {
    variant: 'success',
    label: 'Compliant',
    description: 'All insurance and compliance requirements are met and up to date.',
  },
  non_compliant: {
    variant: 'error',
    label: 'Non-Compliant',
    description:
      'This vendor does not meet current compliance requirements. Work orders should not be assigned until resolved.',
  },
  expiring: {
    variant: 'warning',
    label: 'Expiring Soon',
    description:
      'Insurance or compliance documents are expiring within 30 days. Request an update from the vendor.',
  },
  expired: {
    variant: 'error',
    label: 'Expired',
    description:
      'Insurance or compliance documents have expired. Vendor cannot be assigned new work orders.',
  },
  not_tracking: {
    variant: 'default',
    label: 'Not Tracking',
    description: 'Compliance tracking has not been enabled for this vendor.',
  },
};

const WO_STATUS_CONFIG: Record<
  WorkOrder['status'],
  { variant: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'; label: string }
> = {
  open: { variant: 'warning', label: 'Open' },
  in_progress: { variant: 'info', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  closed: { variant: 'default', label: 'Closed' },
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < Math.round(rating) ? 'fill-warning-400 text-warning-400' : 'text-neutral-200'
          }`}
        />
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function VendorDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-28 rounded bg-neutral-200" />
        <div className="h-8 w-64 rounded bg-neutral-200" />
        <div className="h-4 w-32 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="h-48 rounded-xl bg-neutral-100" />
          <div className="h-40 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-36 rounded-xl bg-neutral-100" />
          <div className="h-48 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    data: vendor,
    loading,
    error,
    refetch,
  } = useApi<VendorDetail>(apiUrl(`/api/v1/vendors/${id}`, { propertyId: getPropertyId() }));

  // -- Action Handlers --
  const handleDeactivateVendor = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate this vendor? They will no longer be assignable to new work orders.',
    );
    if (!confirmed) return;
    try {
      const res = await apiRequest(
        apiUrl(`/api/v1/vendors/${id}`, { propertyId: getPropertyId() }),
        { method: 'PATCH', body: { status: 'inactive' } },
      );
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        alert(result.message || 'Failed to deactivate vendor.');
        return;
      }
      alert('Vendor has been deactivated.');
      refetch();
    } catch {
      alert('Network error. Please try again.');
    }
  };

  // -- Loading State --
  if (loading) {
    return <VendorDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Vendor Not Found' : 'Failed to Load Vendor'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href={'/vendors' as never}>
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to vendors
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Building2 className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Vendor Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The vendor you are looking for does not exist or has been removed.
        </p>
        <Link href={'/vendors' as never}>
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to vendors
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[vendor.insuranceStatus] ?? STATUS_CONFIG.not_tracking;
  const workOrders = vendor.workOrders ?? [];
  const documents = vendor.documents ?? [];
  const starBreakdown = vendor.starBreakdown ?? [0, 0, 0, 0, 0];

  const workOrderColumns: Column<WorkOrder>[] = [
    {
      id: 'refNumber',
      header: 'Ref #',
      accessorKey: 'refNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-primary-600 text-[13px] font-semibold">{row.refNumber}</span>
      ),
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] font-medium text-neutral-900">
          {typeof row.unit === 'object' && row.unit !== null
            ? (row.unit as Record<string, string>).number
            : row.unit || '—'}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => <span className="text-[13px] text-neutral-700">{row.description}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const cfg = WO_STATUS_CONFIG[row.status];
        return (
          <Badge variant={cfg.variant} size="sm" dot>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.date).toLocaleDateString('en-US', {
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
      cell: (row) =>
        row.rating > 0 ? (
          <StarRating rating={row.rating} />
        ) : (
          <span className="text-[12px] text-neutral-300">--</span>
        ),
    },
  ];

  return (
    <PageShell
      title={vendor.name}
      description={`${vendor.category} vendor`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="h-4 w-4" />
            Edit Vendor
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href={'/vendors' as never}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vendors
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Vendor Info */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow label="Company Name" value={vendor.name} />
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant="default" size="lg">
                      {vendor.category}
                    </Badge>
                  }
                />
                <InfoRow label="License Number" value={vendor.licenseNumber || '—'} />
                <InfoRow label="Primary Contact" value={vendor.contactName || '—'} />
                <InfoRow
                  label="Email"
                  value={
                    vendor.email ? (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-primary-600 inline-flex items-center gap-1 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {vendor.email}
                      </a>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow
                  label="Phone"
                  value={
                    vendor.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-neutral-400" />
                        {vendor.phone}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow
                  label="Address"
                  value={
                    vendor.address ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {vendor.address}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow
                  label="Website"
                  value={
                    vendor.website ? (
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {vendor.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      '—'
                    )
                  }
                />
                <div className="sm:col-span-2">
                  <InfoRow label="Notes" value={vendor.notes || 'No notes.'} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance &amp; Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Insurance Status"
                  value={
                    <Badge variant={statusCfg.variant} size="lg" dot>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                <InfoRow label="Insurance Provider" value={vendor.insuranceProvider || '—'} />
                <InfoRow label="Policy Number" value={vendor.policyNumber || '—'} />
                <InfoRow label="Coverage Amount" value={vendor.coverageAmount || '—'} />
                <InfoRow
                  label="Expiry Date"
                  value={
                    vendor.insuranceExpiry ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(vendor.insuranceExpiry).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow
                  label="Insurance Certificate"
                  value={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert('Certificate upload is coming soon.')}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload / View Certificate
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Work History */}
          <Card>
            <CardHeader>
              <CardTitle>Work History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={workOrderColumns}
                data={workOrders}
                emptyMessage="No work orders found for this vendor."
                emptyIcon={<FileText className="h-6 w-6" />}
                compact
              />
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    statusCfg.variant === 'success'
                      ? 'bg-success-50'
                      : statusCfg.variant === 'error'
                        ? 'bg-error-50'
                        : statusCfg.variant === 'warning'
                          ? 'bg-warning-50'
                          : 'bg-neutral-100'
                  }`}
                >
                  <Shield
                    className={`h-8 w-8 ${
                      statusCfg.variant === 'success'
                        ? 'text-success-600'
                        : statusCfg.variant === 'error'
                          ? 'text-error-600'
                          : statusCfg.variant === 'warning'
                            ? 'text-warning-600'
                            : 'text-neutral-400'
                    }`}
                  />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <p className="text-[13px] leading-relaxed text-neutral-500">
                  {statusCfg.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2">
                <p className="text-[40px] font-bold tracking-tight text-neutral-900">
                  {vendor.averageRating ?? 0}
                </p>
                <StarRating rating={vendor.averageRating ?? 0} size="lg" />
                <p className="text-[13px] text-neutral-500">
                  {vendor.totalReviews ?? 0} review{(vendor.totalReviews ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                {starBreakdown.map((count, i) => {
                  const starLevel = 5 - i;
                  const totalReviews = vendor.totalReviews ?? 0;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={starLevel} className="flex items-center gap-2">
                      <span className="w-8 text-right text-[12px] font-medium text-neutral-500">
                        {starLevel}
                      </span>
                      <Star className="fill-warning-400 text-warning-400 h-3 w-3" />
                      <div className="h-2 flex-1 rounded-full bg-neutral-100">
                        <div
                          className="bg-warning-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-6 text-[12px] text-neutral-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth onClick={() => setEditDialogOpen(true)}>
                  <Edit2 className="h-4 w-4" />
                  Edit Vendor
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => alert('Insurance update request sent.')}
                >
                  <RefreshCw className="h-4 w-4" />
                  Request Insurance Update
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => alert('Contract viewer is coming soon.')}
                >
                  <FileText className="h-4 w-4" />
                  View Contract
                </Button>
                <Button variant="secondary" fullWidth onClick={handleDeactivateVendor}>
                  <Power className="h-4 w-4" />
                  Deactivate Vendor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                          <FileText className="text-primary-600 h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-neutral-900">{doc.name}</p>
                          <p className="text-[11px] text-neutral-400">
                            {doc.type} &middot; {doc.size} &middot;{' '}
                            {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-neutral-400 transition-colors hover:text-neutral-600"
                        onClick={async () => {
                          try {
                            const resp = await apiRequest(
                              `/api/v1/vendors/${vendor.id}/documents/${doc.id}/download`,
                              { method: 'GET' },
                            );
                            const result = (await resp.json()) as {
                              data?: { url: string; fileName: string };
                            };
                            if (result.data?.url) {
                              const link = document.createElement('a');
                              link.href = result.data.url;
                              link.download = result.data.fileName || doc.name;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              alert('Download link not available.');
                            }
                          } catch {
                            alert('Failed to download document.');
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No documents uploaded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Vendor Dialog */}
      <EditVendorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        vendor={vendor}
        onSuccess={refetch}
      />
    </PageShell>
  );
}
