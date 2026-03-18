'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Edit2,
  Key,
  Mail,
  Package,
  Phone,
  User,
  Users,
  Wrench,
  Dog,
  Car,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

// ---------------------------------------------------------------------------
// Mock Unit Detail
// ---------------------------------------------------------------------------

const MOCK_UNIT = {
  number: '1501',
  floor: 15,
  building: 'Tower A',
  type: 'Penthouse',
  sqft: 1850,
  bedrooms: 3,
  bathrooms: 2,
  status: 'owner_occupied' as const,
  instructions:
    'Has a small dog (Daisy) — may bark at visitors. Ring doorbell twice, resident is slightly hard of hearing.',
  residents: [
    {
      id: '1',
      name: 'Janet Smith',
      role: 'Owner',
      email: 'janet.smith@email.com',
      phone: '416-555-0123',
      isPrimary: true,
    },
    {
      id: '2',
      name: 'Tom Smith',
      role: 'Family',
      email: 'tom.s@email.com',
      phone: '416-555-0124',
      isPrimary: false,
    },
  ],
  emergencyContacts: [{ name: 'Michael Smith', relationship: 'Brother', phone: '416-555-9999' }],
  pets: [{ name: 'Daisy', type: 'Dog', breed: 'Pomeranian' }],
  vehicles: [{ make: 'Tesla', model: 'Model 3', color: 'White', plate: 'ABCD 123', spot: 'P1-15' }],
  fobs: [
    { serial: 'SN-3201', type: 'Main Entry', status: 'active', issuedAt: '2022-06-01' },
    { serial: 'SN-3202', type: 'Parking', status: 'active', issuedAt: '2022-06-01' },
  ],
  stats: { unreleasedPackages: 2, openRequests: 1, upcomingBookings: 1 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UnitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function UnitDetailPage({ params }: UnitDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/units"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to units
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
              Unit {MOCK_UNIT.number}
            </h1>
            <Badge variant="primary" size="lg">
              Owner Occupied
            </Badge>
          </div>
          <p className="text-[14px] text-neutral-500">
            {MOCK_UNIT.building} &middot; Floor {MOCK_UNIT.floor} &middot; {MOCK_UNIT.type} &middot;{' '}
            {MOCK_UNIT.sqft} sq ft
          </p>
        </div>
        <Button variant="secondary" size="sm">
          <Edit2 className="h-4 w-4" />
          Edit Unit
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Unreleased Packages',
            value: MOCK_UNIT.stats.unreleasedPackages,
            icon: Package,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
          {
            label: 'Open Requests',
            value: MOCK_UNIT.stats.openRequests,
            icon: Wrench,
            color: 'text-error-600',
            bg: 'bg-error-50',
          },
          {
            label: 'Upcoming Bookings',
            value: MOCK_UNIT.stats.upcomingBookings,
            icon: Building2,
            color: 'text-info-600',
            bg: 'bg-info-50',
          },
        ].map((s) => (
          <Card key={s.label} padding="sm" className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[24px] font-bold tracking-tight text-neutral-900">{s.value}</p>
              <p className="text-[13px] text-neutral-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Front Desk Instructions */}
          {MOCK_UNIT.instructions && (
            <Card className="border-warning-200 bg-warning-50/30">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="text-warning-600 h-4 w-4" />
                <h2 className="text-warning-800 text-[14px] font-semibold">
                  Front Desk Instructions
                </h2>
              </div>
              <p className="text-warning-900 text-[14px] leading-relaxed">
                {MOCK_UNIT.instructions}
              </p>
            </Card>
          )}

          {/* Residents */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Residents ({MOCK_UNIT.residents.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                {MOCK_UNIT.residents.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 rounded-xl border border-neutral-100 p-4"
                  >
                    <Avatar name={r.name} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-medium text-neutral-900">{r.name}</p>
                        <Badge variant={r.isPrimary ? 'primary' : 'default'} size="sm">
                          {r.role}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-[13px] text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {r.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Vehicles ({MOCK_UNIT.vehicles.length})
              </h2>
            </div>
            <CardContent>
              {MOCK_UNIT.vehicles.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                >
                  <div>
                    <p className="text-[15px] font-medium text-neutral-900">
                      {v.color} {v.make} {v.model}
                    </p>
                    <p className="mt-0.5 text-[13px] text-neutral-500">
                      Plate: <span className="font-mono">{v.plate}</span> &middot; Spot: {v.spot}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Emergency Contacts */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Emergency Contacts</h2>
            <CardContent>
              {MOCK_UNIT.emergencyContacts.map((c, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="text-[14px] font-medium text-neutral-900">{c.name}</p>
                  <p className="text-[13px] text-neutral-500">{c.relationship}</p>
                  <p className="flex items-center gap-1 text-[13px] text-neutral-600">
                    <Phone className="h-3 w-3" />
                    {c.phone}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pets */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Dog className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Pets ({MOCK_UNIT.pets.length})
              </h2>
            </div>
            <CardContent>
              {MOCK_UNIT.pets.map((p, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-medium text-neutral-900">{p.name}</p>
                  <p className="text-[13px] text-neutral-500">
                    {p.breed} ({p.type})
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FOBs / Keys */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Keys & FOBs ({MOCK_UNIT.fobs.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK_UNIT.fobs.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[13px] font-medium text-neutral-900">
                        {f.serial}
                      </p>
                      <p className="text-[12px] text-neutral-500">{f.type}</p>
                    </div>
                    <Badge variant={f.status === 'active' ? 'success' : 'error'} size="sm" dot>
                      {f.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
