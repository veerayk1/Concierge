'use client';

import { useMemo } from 'react';
import { AlertCircle, Building2, ChevronRight, MapPin, Plus, Users } from 'lucide-react';
import { useApi } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Property {
  id: string;
  name: string;
  address: string;
  unitCount: number;
  residentCount: number;
  staffCount: number;
  status: 'active' | 'inactive';
  tier: string;
  type: 'production' | 'demo';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
  const { data: apiProperties, loading, error, refetch } = useApi<Property[]>('/api/v1/properties');

  const allProperties = useMemo(() => apiProperties ?? [], [apiProperties]);

  return (
    <PageShell
      title="Property Management"
      description="Manage buildings and property configurations."
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="flex items-center gap-6">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load properties"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Empty State */}
      {!loading && !error && allProperties.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No properties found"
          description="Get started by adding your first property."
          action={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          }
        />
      )}

      {/* Data */}
      {!loading && !error && allProperties.length > 0 && (
        <div className="flex flex-col gap-4">
          {allProperties.map((property) => (
            <Card key={property.id} hoverable className="cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="bg-primary-50 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                  <Building2 className="text-primary-600 h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-bold text-neutral-900">{property.name}</h3>
                    <Badge
                      variant={property.status === 'active' ? 'success' : 'default'}
                      size="sm"
                      dot
                    >
                      {property.status}
                    </Badge>
                    <Badge variant={property.type === 'demo' ? 'info' : 'default'} size="sm">
                      {property.tier}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[14px] text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.address}
                  </p>
                  <div className="mt-3 flex items-center gap-6 text-[13px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                      {property.unitCount} units
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-neutral-400" />
                      {property.residentCount ?? 0} residents
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-neutral-400" />
                      {property.staffCount ?? 0} staff
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-300" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
