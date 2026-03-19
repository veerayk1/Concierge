'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Car,
  Clock,
  Dog,
  Edit2,
  Key,
  Lock,
  Mail,
  MessageSquare,
  Package,
  ParkingCircle,
  Phone,
  Shield,
  UserX,
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
  emergencyContacts: [
    { name: 'Michael Smith', relationship: 'Brother', phone: '416-555-9999' },
    { name: 'Laura Chen', relationship: 'Partner', phone: '416-555-8877' },
  ],
  pets: [
    { name: 'Daisy', type: 'Dog', breed: 'Pomeranian', weight: '5 lbs' },
    { name: 'Whiskers', type: 'Cat', breed: 'Tabby', weight: '10 lbs' },
  ],
  vehicles: [
    { make: 'Tesla', model: 'Model 3', year: 2024, color: 'White', plate: 'ABCD 123' },
    { make: 'BMW', model: 'X5', year: 2023, color: 'Black', plate: 'EFGH 456' },
  ],
  access: {
    fobs: [
      { serial: 'SN-3201', type: 'Main Entry', status: 'active' as const },
      { serial: 'SN-3202', type: 'Parking', status: 'active' as const },
    ],
    parkingSpot: 'P1-15',
    locker: 'L-42',
    buzzerCode: '1501',
  },
  stats: { packages: 12, requests: 3, bookings: 5 },
  recentActivity: [
    { id: '1', type: 'package', description: 'Package received from Amazon', time: '2 hours ago' },
    { id: '2', type: 'booking', description: 'Booked Party Room for Mar 25', time: '1 day ago' },
    {
      id: '3',
      type: 'maintenance',
      description: 'Submitted maintenance request — Leaky faucet',
      time: '3 days ago',
    },
    { id: '4', type: 'package', description: 'Package picked up (FedEx)', time: '5 days ago' },
    { id: '5', type: 'visitor', description: 'Visitor registered: John Doe', time: '1 week ago' },
  ],
};

const activityIcons: Record<string, typeof Package> = {
  package: Package,
  booking: Calendar,
  maintenance: Wrench,
  visitor: Shield,
};

interface ResidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Personal Info */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">
              Personal Information
            </h2>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Full Name
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {MOCK.firstName} {MOCK.lastName}
                  </p>
                </div>
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
                    {MOCK.building} &middot; Unit {MOCK.unit}
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
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Type
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900 capitalize">{MOCK.role}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Status
                  </p>
                  <p className="mt-1">
                    <Badge variant="success" size="md" dot>
                      {MOCK.status}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Emergency Contacts ({MOCK.emergencyContacts.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK.emergencyContacts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{c.name}</p>
                      <p className="mt-0.5 text-[13px] text-neutral-500">{c.relationship}</p>
                    </div>
                    <p className="flex items-center gap-1.5 text-[13px] text-neutral-600">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      {c.phone}
                    </p>
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
                Vehicles ({MOCK.vehicles.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK.vehicles.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                  >
                    <div>
                      <p className="text-[15px] font-medium text-neutral-900">
                        {v.year} {v.color} {v.make} {v.model}
                      </p>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        Plate: <span className="font-mono">{v.plate}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pets */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Dog className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Pets ({MOCK.pets.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK.pets.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{p.name}</p>
                      <p className="text-[13px] text-neutral-500">
                        {p.breed} ({p.type}) &middot; {p.weight}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <Lock className="h-4 w-4" />
                  Reset Password
                </Button>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="ghost" size="sm" className="text-error-600 w-full justify-start">
                  <UserX className="h-4 w-4" />
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Access */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Access</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    FOBs Assigned
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {MOCK.access.fobs.map((f, i) => (
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
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Parking Spot
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <ParkingCircle className="h-4 w-4 text-neutral-400" />
                    {MOCK.access.parkingSpot}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Locker
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">{MOCK.access.locker}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Buzzer Code
                  </p>
                  <p className="mt-1 font-mono text-[14px] text-neutral-900">
                    {MOCK.access.buzzerCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Quick Stats</h2>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Package className="h-4 w-4 text-neutral-400" />
                    Total Packages
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">
                    {MOCK.stats.packages}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Wrench className="h-4 w-4 text-neutral-400" />
                    Open Maintenance
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">
                    {MOCK.stats.requests}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    Upcoming Bookings
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">
                    {MOCK.stats.bookings}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Recent Activity</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                {MOCK.recentActivity.map((activity) => {
                  const Icon = activityIcons[activity.type] || Clock;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <Icon className="h-3.5 w-3.5 text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-[13px] text-neutral-700">{activity.description}</p>
                        <p className="mt-0.5 text-[12px] text-neutral-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
