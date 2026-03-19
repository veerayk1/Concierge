'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
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
  User,
  UserX,
  Wrench,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResidentDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  unit: string;
  building: string;
  role: string;
  status: string;
  moveInDate: string;
  emergencyContacts: { name: string; relationship: string; phone: string }[];
  pets: { name: string; type: string; breed: string; weight: string }[];
  vehicles: { make: string; model: string; year: number; color: string; plate: string }[];
  access: {
    fobs: { serial: string; type: string; status: string }[];
    parkingSpot: string;
    locker: string;
    buzzerCode: string;
  };
  stats: { packages: number; requests: number; bookings: number };
  recentActivity: { id: string; type: string; description: string; time: string }[];
}

const activityIcons: Record<string, typeof Package> = {
  package: Package,
  booking: Calendar,
  maintenance: Wrench,
  visitor: Shield,
};

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function ResidentDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-28 rounded bg-neutral-200" />
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-neutral-200" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 rounded bg-neutral-200" />
            <div className="h-4 w-56 rounded bg-neutral-200" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="h-48 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-40 rounded-xl bg-neutral-100" />
          <div className="h-40 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: resident,
    loading,
    error,
  } = useApi<ResidentDetail>(apiUrl(`/api/v1/users/${id}`, { propertyId: DEMO_PROPERTY_ID }));

  // -- Loading State --
  if (loading) {
    return <ResidentDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Resident Not Found' : 'Failed to Load Resident'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/residents">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to residents
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!resident) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <User className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Resident Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The resident you are looking for does not exist or has been removed.
        </p>
        <Link href="/residents">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to residents
          </Button>
        </Link>
      </div>
    );
  }

  const emergencyContacts = resident.emergencyContacts ?? [];
  const pets = resident.pets ?? [];
  const vehicles = resident.vehicles ?? [];
  const access = resident.access ?? { fobs: [], parkingSpot: '', locker: '', buzzerCode: '' };
  const stats = resident.stats ?? { packages: 0, requests: 0, bookings: 0 };
  const recentActivity = resident.recentActivity ?? [];

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
            <Avatar name={`${resident.firstName} ${resident.lastName}`} size="lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {resident.firstName} {resident.lastName}
                </h1>
                <Badge variant="primary" size="lg">
                  {resident.role.charAt(0).toUpperCase() + resident.role.slice(1)}
                </Badge>
                <Badge variant={resident.status === 'active' ? 'success' : 'default'} size="lg" dot>
                  {resident.status.charAt(0).toUpperCase() + resident.status.slice(1)}
                </Badge>
              </div>
              <p className="mt-1 text-[14px] text-neutral-500">
                Unit {resident.unit} &middot; {resident.building} &middot; Since{' '}
                {new Date(resident.moveInDate).toLocaleDateString('en-US', {
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
                    {resident.firstName} {resident.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Email
                  </p>
                  <p className="text-primary-600 mt-1 flex items-center gap-1.5 text-[15px]">
                    <Mail className="h-4 w-4" />
                    {resident.email}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Phone
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {resident.phone}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Building2 className="h-4 w-4 text-neutral-400" />
                    {resident.building} &middot; Unit {resident.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Move-in Date
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    {new Date(resident.moveInDate).toLocaleDateString('en-US', {
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
                  <p className="mt-1 text-[15px] text-neutral-900 capitalize">{resident.role}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Status
                  </p>
                  <p className="mt-1">
                    <Badge
                      variant={resident.status === 'active' ? 'success' : 'default'}
                      size="md"
                      dot
                    >
                      {resident.status}
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
                Emergency Contacts ({emergencyContacts.length})
              </h2>
            </div>
            <CardContent>
              {emergencyContacts.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {emergencyContacts.map((c, i) => (
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
              ) : (
                <p className="text-[14px] text-neutral-400">No emergency contacts on file.</p>
              )}
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Vehicles ({vehicles.length})
              </h2>
            </div>
            <CardContent>
              {vehicles.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {vehicles.map((v, i) => (
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
              ) : (
                <p className="text-[14px] text-neutral-400">No vehicles registered.</p>
              )}
            </CardContent>
          </Card>

          {/* Pets */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Dog className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Pets ({pets.length})</h2>
            </div>
            <CardContent>
              {pets.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {pets.map((p, i) => (
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
              ) : (
                <p className="text-[14px] text-neutral-400">No pets registered.</p>
              )}
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
                    {(access.fobs ?? []).length > 0 ? (
                      access.fobs.map((f, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-[13px] font-medium text-neutral-900">
                              {f.serial}
                            </p>
                            <p className="text-[12px] text-neutral-500">{f.type}</p>
                          </div>
                          <Badge
                            variant={f.status === 'active' ? 'success' : 'default'}
                            size="sm"
                            dot
                          >
                            {f.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-neutral-400">None assigned</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Parking Spot
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <ParkingCircle className="h-4 w-4 text-neutral-400" />
                    {access.parkingSpot || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Locker
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">{access.locker || '—'}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Buzzer Code
                  </p>
                  <p className="mt-1 font-mono text-[14px] text-neutral-900">
                    {access.buzzerCode || '—'}
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
                  <span className="text-[16px] font-bold text-neutral-900">{stats.packages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Wrench className="h-4 w-4 text-neutral-400" />
                    Open Maintenance
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">{stats.requests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[14px] text-neutral-600">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    Upcoming Bookings
                  </span>
                  <span className="text-[16px] font-bold text-neutral-900">{stats.bookings}</span>
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
              {recentActivity.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {recentActivity.map((activity) => {
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
              ) : (
                <p className="text-[14px] text-neutral-400">No recent activity.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
