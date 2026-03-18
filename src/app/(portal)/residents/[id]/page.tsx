'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Car,
  Dog,
  Edit2,
  Key,
  Mail,
  Package,
  Phone,
  Shield,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

const MOCK = {
  firstName: 'Janet',
  lastName: 'Smith',
  email: 'janet.smith@email.com',
  phone: '416-555-0123',
  unit: '1501',
  building: 'Tower A',
  role: 'owner' as const,
  status: 'active' as const,
  moveInDate: '2022-06-01',
  emergencyContacts: [{ name: 'Michael Smith', relationship: 'Brother', phone: '416-555-9999' }],
  pets: [{ name: 'Daisy', type: 'Dog', breed: 'Pomeranian' }],
  vehicles: [{ make: 'Tesla', model: 'Model 3', color: 'White', plate: 'ABCD 123', spot: 'P1-15' }],
  fobs: [
    { serial: 'SN-3201', type: 'Main Entry', status: 'active' },
    { serial: 'SN-3202', type: 'Parking', status: 'active' },
  ],
  stats: { packages: 12, requests: 3, bookings: 5 },
};

interface ResidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/residents"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to residents
          </Link>
          <div className="flex items-center gap-4">
            <Avatar name={`${MOCK.firstName} ${MOCK.lastName}`} size="lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {MOCK.firstName} {MOCK.lastName}
                </h1>
                <Badge variant="primary" size="lg">
                  Owner
                </Badge>
                <Badge variant="success" size="lg" dot>
                  Active
                </Badge>
              </div>
              <p className="mt-1 text-[14px] text-neutral-500">
                Unit {MOCK.unit} &middot; {MOCK.building} &middot; Since{' '}
                {new Date(MOCK.moveInDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Contact */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Contact Information</h2>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Email
                  </p>
                  <p className="text-primary-600 mt-1 flex items-center gap-1.5 text-[15px]">
                    <Mail className="h-4 w-4" />
                    {MOCK.email}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Phone
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {MOCK.phone}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Building2 className="h-4 w-4 text-neutral-400" />
                    {MOCK.building} · Unit {MOCK.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Move-in Date
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    {new Date(MOCK.moveInDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm" className="text-center">
              <p className="text-[24px] font-bold text-neutral-900">{MOCK.stats.packages}</p>
              <p className="text-[13px] text-neutral-500">Packages (all time)</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-[24px] font-bold text-neutral-900">{MOCK.stats.requests}</p>
              <p className="text-[13px] text-neutral-500">Maintenance Requests</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-[24px] font-bold text-neutral-900">{MOCK.stats.bookings}</p>
              <p className="text-[13px] text-neutral-500">Amenity Bookings</p>
            </Card>
          </div>

          {/* Vehicles */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Vehicles</h2>
            </div>
            <CardContent>
              {MOCK.vehicles.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                >
                  <div>
                    <p className="text-[15px] font-medium text-neutral-900">
                      {v.color} {v.make} {v.model}
                    </p>
                    <p className="mt-0.5 text-[13px] text-neutral-500">
                      Plate: <span className="font-mono">{v.plate}</span> · Spot: {v.spot}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Emergency Contacts</h2>
            <CardContent>
              {MOCK.emergencyContacts.map((c, i) => (
                <div key={i}>
                  <p className="text-[14px] font-medium text-neutral-900">{c.name}</p>
                  <p className="text-[13px] text-neutral-500">
                    {c.relationship} · {c.phone}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Dog className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Pets</h2>
            </div>
            <CardContent>
              {MOCK.pets.map((p, i) => (
                <div key={i}>
                  <p className="text-[14px] font-medium text-neutral-900">{p.name}</p>
                  <p className="text-[13px] text-neutral-500">
                    {p.breed} ({p.type})
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Keys & FOBs</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK.fobs.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[13px] font-medium text-neutral-900">
                        {f.serial}
                      </p>
                      <p className="text-[12px] text-neutral-500">{f.type}</p>
                    </div>
                    <Badge variant="success" size="sm" dot>
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
