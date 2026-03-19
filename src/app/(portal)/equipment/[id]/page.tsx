'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit,
  Settings,
  Shield,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EquipmentData {
  id: string;
  name: string;
  category: string;
  status: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  location?: string | null;
  installDate?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  warrantyExpiry?: string | null;
  expectedLifespanYears?: number | null;
  nextInspectionDate?: string | null;
  nextServiceDate?: string | null;
  notes?: string | null;
  warrantyStatus?: 'active' | 'expired' | 'unknown';
  replacementForecast?: { estimatedReplacementDate: string; isPastDue: boolean } | null;
  costSummary?: { purchasePrice: number; maintenanceCost: number; totalCostOfOwnership: number };
  maintenanceRequests?: Array<{ id: string; status: string }>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'warning' | 'error' | 'default' | 'info'; label: string }
> = {
  active: { variant: 'success', label: 'Active' },
  maintenance: { variant: 'warning', label: 'Under Maintenance' },
  decommissioned: { variant: 'default', label: 'Decommissioned' },
  out_of_service: { variant: 'error', label: 'Out of Service' },
  retired: { variant: 'default', label: 'Retired' },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function EquipmentSkeleton() {
  return (
    <PageShell title="" description="">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
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

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/equipment/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch equipment (${res.status})`);
        const json = await res.json();
        setEquipment(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchEquipment();
  }, [id]);

  if (loading) return <EquipmentSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Settings className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Equipment not found</h1>
        <p className="text-[14px] text-neutral-500">
          The equipment you are looking for does not exist or has been removed.
        </p>
        <Button variant="secondary" onClick={() => router.push('/equipment')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading equipment</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Button variant="secondary" onClick={() => router.push('/equipment')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Button>
      </div>
    );
  }

  if (!equipment) return null;

  const statusCfg = STATUS_CONFIG[equipment.status] ?? {
    variant: 'success' as const,
    label: 'Active',
  };
  const costSummary = equipment.costSummary;
  const replacement = equipment.replacementForecast;

  return (
    <PageShell
      title={equipment.name}
      description={`${equipment.category} Equipment`}
      actions={
        <Button variant="secondary" size="sm" onClick={() => router.push('/equipment')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Equipment Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Equipment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Name
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-neutral-900">
                    {equipment.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Category
                  </dt>
                  <dd className="mt-1">
                    <Badge variant="primary">{equipment.category}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={statusCfg.variant} dot>
                      {statusCfg.label}
                    </Badge>
                  </dd>
                </div>
                {equipment.serialNumber && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Serial Number
                    </dt>
                    <dd className="mt-1 font-mono text-[14px] text-neutral-900">
                      {equipment.serialNumber}
                    </dd>
                  </div>
                )}
                {equipment.manufacturer && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Manufacturer
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">{equipment.manufacturer}</dd>
                  </div>
                )}
                {equipment.modelNumber && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Model Number
                    </dt>
                    <dd className="mt-1 font-mono text-[14px] text-neutral-900">
                      {equipment.modelNumber}
                    </dd>
                  </div>
                )}
                {equipment.location && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Location
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">{equipment.location}</dd>
                  </div>
                )}
                {equipment.installDate && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Install Date
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">
                      {formatDate(equipment.installDate)}
                    </dd>
                  </div>
                )}
              </dl>
              {equipment.notes && (
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <dt className="mb-1 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Notes
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-neutral-600">
                    {equipment.notes}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warranty & Lifecycle */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Warranty &amp; Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Warranty Status
                  </dt>
                  <dd className="mt-1">
                    <Badge
                      variant={
                        equipment.warrantyStatus === 'active'
                          ? 'success'
                          : equipment.warrantyStatus === 'expired'
                            ? 'error'
                            : 'default'
                      }
                      dot
                    >
                      {equipment.warrantyStatus === 'active'
                        ? 'Active'
                        : equipment.warrantyStatus === 'expired'
                          ? 'Expired'
                          : 'Unknown'}
                    </Badge>
                  </dd>
                </div>
                {equipment.warrantyExpiry && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Warranty Expiry
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-[14px] text-neutral-900">
                        {formatDate(equipment.warrantyExpiry)}
                      </span>
                    </dd>
                  </div>
                )}
                {equipment.expectedLifespanYears && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Expected Lifespan
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">
                      {equipment.expectedLifespanYears} years
                    </dd>
                  </div>
                )}
                {replacement && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Est. Replacement
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`text-[14px] ${replacement.isPastDue ? 'text-error-600 font-semibold' : 'text-neutral-900'}`}
                      >
                        {formatDate(replacement.estimatedReplacementDate)}
                      </span>
                      {replacement.isPastDue && (
                        <Badge variant="error" size="sm" className="ml-2">
                          Past Due
                        </Badge>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          {costSummary && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-neutral-100 p-4 text-center">
                    <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Purchase Price
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-neutral-900">
                      {formatCurrency(costSummary.purchasePrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 p-4 text-center">
                    <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Maintenance Cost
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-neutral-900">
                      {formatCurrency(costSummary.maintenanceCost)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-100 p-4 text-center">
                    <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Total Cost
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-neutral-900">
                      {formatCurrency(costSummary.totalCostOfOwnership)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card padding="md" className="flex flex-col items-center gap-3 text-center">
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
              <Settings
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
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" fullWidth>
                  <Edit className="h-4 w-4" />
                  Edit Equipment
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <Wrench className="h-4 w-4" />
                  Create Maintenance Request
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <Calendar className="h-4 w-4" />
                  Schedule Inspection
                </Button>
                <Button variant="danger" size="sm" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Decommission
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Dates */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Upcoming Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {equipment.nextInspectionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Next Inspection
                    </span>
                    <span className="text-[13px] text-neutral-700">
                      {formatDate(equipment.nextInspectionDate)}
                    </span>
                  </div>
                )}
                {equipment.nextServiceDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Next Service
                    </span>
                    <span className="text-[13px] text-neutral-700">
                      {formatDate(equipment.nextServiceDate)}
                    </span>
                  </div>
                )}
                {!equipment.nextInspectionDate && !equipment.nextServiceDate && (
                  <p className="py-2 text-center text-[13px] text-neutral-400">
                    No upcoming dates scheduled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
