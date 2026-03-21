'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, ChevronRight, MapPin, Plus, Settings, Users } from 'lucide-react';
import { useApi } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CreatePropertyDialog } from '@/components/admin/create-property-dialog';
import { getPropertyId } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  unitCount: number;
  isActive: boolean;
  type: string;
  subscriptionTier: string | null;
  slug: string;
  propertyCode: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
  const router = useRouter();
  const { data: apiProperties, loading, error, refetch } = useApi<Property[]>('/api/v1/properties');
  const [createOpen, setCreateOpen] = useState(false);
  const [activePropertyId, setActivePropertyId] = useState(() => getPropertyId());

  const allProperties = useMemo(() => apiProperties ?? [], [apiProperties]);

  const handleManageProperty = useCallback(
    (propertyId: string) => {
      localStorage.setItem('demo_propertyId', propertyId);
      setActivePropertyId(propertyId);
      router.push('/admin/users' as never);
    },
    [router],
  );

  const handlePropertyCreated = useCallback(
    (newPropertyId?: string) => {
      if (newPropertyId) {
        setActivePropertyId(newPropertyId);
      }
      refetch();
    },
    [refetch],
  );

  return (
    <PageShell
      title="Property Management"
      description="Manage buildings and property configurations."
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      }
    >
      {/* Create Property Dialog */}
      <CreatePropertyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handlePropertyCreated}
      />

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
          title="No properties yet"
          description="Get started by adding your first property. System roles will be auto-created so you can immediately start adding users."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          }
        />
      )}

      {/* Data */}
      {!loading && !error && allProperties.length > 0 && (
        <div className="flex flex-col gap-4">
          {allProperties.map((property) => {
            const isActive = property.id === activePropertyId;
            return (
              <Card
                key={property.id}
                hoverable
                className={`cursor-pointer ${isActive ? 'ring-primary-500 ring-2' : ''}`}
                onClick={() => handleManageProperty(property.id)}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-primary-100' : 'bg-primary-50'}`}
                  >
                    <Building2
                      className={`h-7 w-7 ${isActive ? 'text-primary-700' : 'text-primary-600'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-bold text-neutral-900">{property.name}</h3>
                      {isActive && (
                        <Badge variant="primary" size="sm">
                          Managing
                        </Badge>
                      )}
                      <Badge variant={property.isActive ? 'success' : 'default'} size="sm" dot>
                        {property.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {property.subscriptionTier && (
                        <Badge variant="info" size="sm">
                          {property.subscriptionTier}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[14px] text-neutral-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {property.address}, {property.city}, {property.province}
                    </p>
                    <div className="mt-3 flex items-center gap-6 text-[13px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                        {property.unitCount} units
                      </span>
                      <span className="text-neutral-300">{property.propertyCode}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isActive ? 'primary' : 'secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageProperty(property.id);
                      }}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Manage
                    </Button>
                    <ChevronRight className="h-5 w-5 text-neutral-300" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
