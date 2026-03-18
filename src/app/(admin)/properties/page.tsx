'use client';

import { Building2, ChevronRight, Globe, MapPin, Plus, Users } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PROPERTIES = [
  {
    id: '1',
    name: 'Bond Tower',
    address: '123 Bond Street, Toronto, ON M5B 1X4',
    unitCount: 487,
    residentCount: 823,
    staffCount: 12,
    status: 'active' as const,
    tier: 'Professional',
    type: 'production' as const,
  },
  {
    id: '2',
    name: 'Bond Tower — Demo',
    address: '123 Bond Street, Toronto, ON M5B 1X4',
    unitCount: 50,
    residentCount: 100,
    staffCount: 5,
    status: 'active' as const,
    tier: 'Demo',
    type: 'demo' as const,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertiesPage() {
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
      <div className="flex flex-col gap-4">
        {MOCK_PROPERTIES.map((property) => (
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
                    {property.residentCount} residents
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-neutral-400" />
                    {property.staffCount} staff
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-300" />
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
