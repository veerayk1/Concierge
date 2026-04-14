'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Wrench,
  QrCode,
  Trash2,
  FileBox,
  Shield,
  StickyNote,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EditAssetDialog } from '@/components/forms/edit-asset-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AssetCategory =
  | 'furniture'
  | 'appliance'
  | 'fixture'
  | 'technology'
  | 'vehicle'
  | 'tool'
  | 'infrastructure';
type AssetStatus = 'in_service' | 'storage' | 'repair' | 'disposed' | 'on_order';
type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
  cost: number;
  vendor: string;
}

interface AssetDetail {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  location: string;
  status: AssetStatus;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationMethod: string;
  annualDepreciation: number;
  usefulLife: number;
  yearsRemaining: number;
  condition: AssetCondition;
  conditionDescription: string;
  warrantyStatus: 'active' | 'expired';
  warrantyProvider: string;
  warrantyExpiry: string;
  warrantyPolicyNumber: string;
  notes: string;
  maintenanceHistory: MaintenanceRecord[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const categoryLabels: Record<AssetCategory, string> = {
  furniture: 'Furniture',
  appliance: 'Appliance',
  fixture: 'Fixture',
  technology: 'Technology',
  vehicle: 'Vehicle',
  tool: 'Tool',
  infrastructure: 'Infrastructure',
};

const statusConfig: Record<
  AssetStatus,
  { label: string; variant: 'success' | 'default' | 'warning' | 'error' | 'info' }
> = {
  in_service: { label: 'In Service', variant: 'success' },
  storage: { label: 'Storage', variant: 'default' },
  repair: { label: 'Repair', variant: 'warning' },
  disposed: { label: 'Disposed', variant: 'error' },
  on_order: { label: 'On Order', variant: 'info' },
};

const conditionConfig: Record<
  AssetCondition,
  { label: string; variant: 'success' | 'info' | 'warning' | 'error' }
> = {
  excellent: { label: 'Excellent', variant: 'success' },
  good: { label: 'Good', variant: 'info' },
  fair: { label: 'Fair', variant: 'warning' },
  poor: { label: 'Poor', variant: 'error' },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AssetDetailSkeleton() {
  return (
    <PageShell title="" description="">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card padding="md">
            <CardContent>
              <Skeleton className="mb-4 h-6 w-1/3" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card padding="md">
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    data: asset,
    loading,
    error,
    refetch,
  } = useApi<AssetDetail>(apiUrl(`/api/v1/assets/${id}`, { propertyId: getPropertyId() }));

  if (loading) return <AssetDetailSkeleton />;

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">
          {error ? 'Error loading asset' : 'Asset not found'}
        </h1>
        <p className="text-[14px] text-neutral-500">
          {error || 'The asset you are looking for does not exist.'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => router.push('/assets')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[asset.status] || { label: asset.status, variant: 'default' as const };
  const condition = conditionConfig[asset.condition] || {
    label: asset.condition,
    variant: 'default' as const,
  };
  const maintenanceHistory = asset.maintenanceHistory ?? [];

  return (
    <PageShell
      title={asset.name}
      description={`Asset Tag: ${asset.assetTag}`}
      actions={
        <Button variant="secondary" size="sm" onClick={() => router.push('/assets')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (2/3) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Asset Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Asset Tag
                  </dt>
                  <dd className="mt-1 font-mono text-[14px] text-neutral-900">{asset.assetTag}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Name
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{asset.name}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Category
                  </dt>
                  <dd className="mt-1">
                    <Badge variant="default">
                      {categoryLabels[asset.category] || asset.category}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{asset.location}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={status.variant} dot>
                      {status.label}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Manufacturer
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">
                    {asset.manufacturer || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Model Number
                  </dt>
                  <dd className="mt-1 font-mono text-[14px] text-neutral-900">
                    {asset.modelNumber || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Serial Number
                  </dt>
                  <dd className="mt-1 font-mono text-[14px] text-neutral-900">
                    {asset.serialNumber || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Purchase Date
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">
                    {asset.purchaseDate ? formatDate(asset.purchaseDate) : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Purchase Price
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-neutral-900">
                    {asset.purchasePrice != null ? formatCurrency(asset.purchasePrice) : 'N/A'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Depreciation */}
          {asset.currentValue != null && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Depreciation</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Current Value
                    </dt>
                    <dd className="mt-1 text-[18px] font-bold text-neutral-900">
                      {formatCurrency(asset.currentValue)}
                    </dd>
                  </div>
                  {asset.depreciationMethod && (
                    <div>
                      <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Depreciation Method
                      </dt>
                      <dd className="mt-1 text-[14px] text-neutral-900">
                        {asset.depreciationMethod}
                      </dd>
                    </div>
                  )}
                  {asset.annualDepreciation != null && (
                    <div>
                      <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Annual Depreciation
                      </dt>
                      <dd className="mt-1 text-[14px] text-neutral-900">
                        {formatCurrency(asset.annualDepreciation)}
                      </dd>
                    </div>
                  )}
                  {asset.usefulLife != null && (
                    <div>
                      <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Useful Life
                      </dt>
                      <dd className="mt-1 text-[14px] text-neutral-900">
                        {asset.usefulLife} years
                      </dd>
                    </div>
                  )}
                  {asset.yearsRemaining != null && (
                    <div>
                      <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Years Remaining
                      </dt>
                      <dd className="mt-1 text-[14px] text-neutral-900">
                        {asset.yearsRemaining} years
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Maintenance History */}
          {maintenanceHistory.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Maintenance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                          Date
                        </th>
                        <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                          Type
                        </th>
                        <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                          Description
                        </th>
                        <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                          Cost
                        </th>
                        <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                          Vendor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceHistory.map((record, idx) => (
                        <tr key={idx} className="border-b border-neutral-50 last:border-0">
                          <td className="py-3 text-[13px] text-neutral-600">
                            {formatDate(record.date)}
                          </td>
                          <td className="py-3">
                            <Badge variant="default" size="sm">
                              {record.type}
                            </Badge>
                          </td>
                          <td className="py-3 text-[13px] text-neutral-700">
                            {record.description}
                          </td>
                          <td className="py-3 text-[13px] font-medium text-neutral-900">
                            {record.cost > 0 ? formatCurrency(record.cost) : '--'}
                          </td>
                          <td className="py-3 text-[13px] text-neutral-600">{record.vendor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card padding="md" className="flex flex-col items-center gap-3 text-center">
            <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
              Current Status
            </p>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
          </Card>

          {/* Actions */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Asset
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => router.push(`/maintenance?assetId=${asset.id}`)}
                >
                  <Wrench className="h-4 w-4" />
                  Schedule Maintenance
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    const assetUrl = `${window.location.origin}/assets/${asset.id}`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(assetUrl)}`;
                    window.open(qrUrl, '_blank');
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  Generate QR Code
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={async () => {
                    if (
                      !confirm(
                        'Are you sure you want to dispose this asset? This action cannot be undone.',
                      )
                    )
                      return;
                    try {
                      const res = await apiRequest(`/api/v1/assets/${id}`, {
                        method: 'PATCH',
                        body: { status: 'disposed' },
                      });
                      if (!res.ok) {
                        const result = await res.json();
                        alert(`Failed to dispose asset: ${result.message || 'Unknown error'}`);
                        return;
                      }
                      alert('Asset has been disposed successfully.');
                      refetch();
                    } catch {
                      alert('Network error. Please try again.');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Dispose Asset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warranty */}
          {asset.warrantyExpiry && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Warranty</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3">
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <Badge variant={asset.warrantyStatus === 'active' ? 'success' : 'error'} dot>
                        {asset.warrantyStatus === 'active' ? 'Active' : 'Expired'}
                      </Badge>
                    </dd>
                  </div>
                  {asset.warrantyProvider && (
                    <div>
                      <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Provider
                      </dt>
                      <dd className="mt-1 text-[14px] text-neutral-900">
                        {asset.warrantyProvider}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Expiry Date
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">
                      {formatDate(asset.warrantyExpiry)}
                    </dd>
                  </div>
                  {asset.warrantyPolicyNumber && (
                    <div>
                      <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Policy Number
                      </dt>
                      <dd className="mt-1 font-mono text-[13px] text-neutral-700">
                        {asset.warrantyPolicyNumber}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Condition */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Badge variant={condition.variant} size="lg" dot>
                  {condition.label}
                </Badge>
                {asset.conditionDescription && (
                  <p className="text-[13px] leading-relaxed text-neutral-600">
                    {asset.conditionDescription}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {asset.notes && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <p className="text-[13px] leading-relaxed text-neutral-600">{asset.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Asset Dialog */}
      <EditAssetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        asset={asset}
        onSuccess={refetch}
      />
    </PageShell>
  );
}
