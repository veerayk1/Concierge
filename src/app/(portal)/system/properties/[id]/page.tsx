'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Globe,
  Clock,
  ArrowLeft,
  Settings,
  Activity,
  Package,
  Wrench,
  Shield,
  BarChart3,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Property {
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
  type: string;
  subscriptionTier: string;
  slug: string;
  branding: Record<string, unknown>;
  propertyCode: string;
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data: property, loading, error } = useApi<Property>(`/api/v1/properties/${propertyId}`);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-current" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <XCircle className="h-12 w-12 text-neutral-300" />
        <p className="text-[16px] font-medium text-neutral-900">{error || 'Property not found'}</p>
        <Button variant="secondary" onClick={() => router.push('/system/properties')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Button>
      </div>
    );
  }

  const tierLabel =
    property.subscriptionTier === 'TIER_3'
      ? 'Enterprise'
      : property.subscriptionTier === 'TIER_2'
        ? 'Professional'
        : 'Starter';

  const typeColor =
    property.type === 'PRODUCTION' ? 'success' : property.type === 'DEMO' ? 'info' : 'warning';

  const createdDate = new Date(property.createdAt).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">{property.name}</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            {property.address}, {property.city}, {property.province} {property.postalCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push('/system/properties')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('demo_propertyId', property.id);
                localStorage.setItem('demo_mode', 'showcase');
                localStorage.setItem('demo_role', 'property_admin');
                localStorage.setItem('demo_return_role', 'super_admin');
              }
              window.location.href = '/dashboard';
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Open Portal
          </Button>
          <Button onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Status Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={typeColor as 'success' | 'info' | 'warning'}>{property.type}</Badge>
        <Badge variant={property.isActive ? 'success' : 'default'}>
          {property.isActive ? 'Active' : 'Inactive'}
        </Badge>
        <Badge variant="default">{tierLabel}</Badge>
        <span className="text-[13px] text-neutral-400">Code: {property.propertyCode}</span>
        <span className="text-[13px] text-neutral-400">Slug: /{property.slug}</span>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Building2 className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {property.unitCount}
            </p>
            <p className="text-[13px] text-neutral-500">Total Units</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Users className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">0</p>
            <p className="text-[13px] text-neutral-500">Active Users</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Package className="text-warning-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">0</p>
            <p className="text-[13px] text-neutral-500">Unreleased Packages</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Wrench className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">0</p>
            <p className="text-[13px] text-neutral-500">Open Maintenance</p>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Property Info */}
        <Card>
          <h3 className="mb-4 text-[16px] font-semibold text-neutral-900">Property Information</h3>
          <div className="flex flex-col gap-3">
            <InfoRow
              icon={MapPin}
              label="Address"
              value={`${property.address}, ${property.city}, ${property.province} ${property.postalCode}`}
            />
            <InfoRow icon={Globe} label="Country" value={property.country} />
            <InfoRow icon={Clock} label="Timezone" value={property.timezone} />
            <InfoRow icon={Calendar} label="Created" value={createdDate} />
            <InfoRow icon={Shield} label="Property Code" value={property.propertyCode} />
            <InfoRow icon={Activity} label="Subscription" value={tierLabel} />
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="mb-4 text-[16px] font-semibold text-neutral-900">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ActionCard
              icon={Users}
              title="Manage Users"
              description="View and manage staff and residents"
              onClick={() => {
                localStorage.setItem('demo_propertyId', property.id);
                router.push('/users');
              }}
            />
            <ActionCard
              icon={Package}
              title="Packages"
              description="Track incoming and outgoing packages"
              onClick={() => {
                localStorage.setItem('demo_propertyId', property.id);
                router.push('/packages');
              }}
            />
            <ActionCard
              icon={Wrench}
              title="Maintenance"
              description="View and assign work orders"
              onClick={() => {
                localStorage.setItem('demo_propertyId', property.id);
                router.push('/maintenance');
              }}
            />
            <ActionCard
              icon={BarChart3}
              title="Reports"
              description="Generate property reports"
              onClick={() => {
                localStorage.setItem('demo_propertyId', property.id);
                router.push('/reports');
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-4 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
      <span className="w-28 shrink-0 text-[13px] font-medium text-neutral-500">{label}</span>
      <span className="text-[14px] text-neutral-900">{value}</span>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition-all hover:border-neutral-300 hover:shadow-sm"
    >
      <div className="bg-primary-50 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-primary-600 h-4 w-4" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-neutral-900">{title}</p>
        <p className="text-[12px] text-neutral-500">{description}</p>
      </div>
    </button>
  );
}
