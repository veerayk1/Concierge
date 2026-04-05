'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Dog,
  Edit2,
  FileText,
  History,
  Key,
  Lock,
  Mail,
  MessageSquare,
  Package,
  ParkingCircle,
  Phone,
  Send,
  Shield,
  User,
  UserX,
  Wrench,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { useAuth } from '@/lib/hooks/use-auth';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

interface ConsentDocument {
  id: string;
  documentType: string;
  signedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  fields: Record<string, unknown> | null;
  createdAt: string;
  userId: string | null;
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
  const router = useRouter();

  const { user: currentUser } = useAuth();
  const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
  const effectiveRole = currentUser?.role ?? demoRole ?? '';
  const isStaff = !effectiveRole.startsWith('resident') && effectiveRole !== 'board_member';
  const isAdminOrManager = ['super_admin', 'property_admin', 'property_manager'].includes(
    effectiveRole,
  );

  const {
    data: resident,
    loading,
    error,
    refetch,
  } = useApi<ResidentDetail>(apiUrl(`/api/v1/users/${id}`, { propertyId: getPropertyId() }));

  // Consent documents — GAP 7.2 (staff-only)
  const { data: consentData } = useApi<{ data: ConsentDocument[] }>(
    isStaff && id
      ? apiUrl('/api/v1/consent-documents', { propertyId: getPropertyId(), userId: id })
      : null,
  );

  // Audit history — GAP 7.3 (admin/manager-only)
  const { data: historyData } = useApi<{ data: AuditEntry[] }>(
    isAdminOrManager && id
      ? apiUrl('/api/v1/audit-log', {
          propertyId: getPropertyId(),
          resource: 'users',
          resourceId: id,
          pageSize: '20',
        })
      : null,
  );

  // --- Action dialog state ---
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);

  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [sendMessageResult, setSendMessageResult] = useState<string | null>(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // --- Action handlers ---

  async function handleResetPassword() {
    setResetPasswordLoading(true);
    setResetPasswordResult(null);
    try {
      const res = await apiRequest(`/api/v1/users/${id}/reset-password`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResetPasswordResult(body.message || `Failed to reset password (${res.status})`);
      } else {
        const body = await res.json().catch(() => ({}));
        setResetPasswordResult(
          body.temporaryPassword
            ? `Password reset. Temporary password: ${body.temporaryPassword}`
            : 'Password reset email sent successfully.',
        );
      }
    } catch {
      setResetPasswordResult('Network error. Please try again.');
    } finally {
      setResetPasswordLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!messageText.trim()) return;
    setSendMessageLoading(true);
    setSendMessageResult(null);
    try {
      const res = await apiRequest(
        apiUrl('/api/v1/announcements', { propertyId: getPropertyId() }),
        {
          method: 'POST',
          body: {
            title: `Message to ${resident?.firstName ?? 'Resident'}`,
            content: messageText.trim(),
            recipientUserIds: [id],
            channels: ['email'],
          },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSendMessageResult(body.message || `Failed to send message (${res.status})`);
      } else {
        setSendMessageResult('Message sent successfully.');
        setMessageText('');
      }
    } catch {
      setSendMessageResult('Network error. Please try again.');
    } finally {
      setSendMessageLoading(false);
    }
  }

  async function handleDeactivate() {
    setDeactivateLoading(true);
    setDeactivateError(null);
    try {
      const res = await apiRequest(`/api/v1/users/${id}`, {
        method: 'PATCH',
        body: { isActive: false, status: 'deactivated' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDeactivateError(body.message || `Failed to deactivate (${res.status})`);
      } else {
        setDeactivateOpen(false);
        await refetch();
      }
    } catch {
      setDeactivateError('Network error. Please try again.');
    } finally {
      setDeactivateLoading(false);
    }
  }

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
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push(`/residents/${id}/edit` as never)}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setResetPasswordResult(null);
                    setResetPasswordOpen(true);
                  }}
                >
                  <Lock className="h-4 w-4" />
                  Reset Password
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setMessageText('');
                    setSendMessageResult(null);
                    setSendMessageOpen(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error-600 w-full justify-start"
                  onClick={() => {
                    setDeactivateError(null);
                    setDeactivateOpen(true);
                  }}
                >
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

      {/* ---------- Consent Documents — GAP 7.2 ---------- */}
      {isStaff && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-400" />
            <h2 className="text-[14px] font-semibold text-neutral-900">Consent Documents</h2>
          </div>
          <CardContent>
            {(consentData?.data ?? []).length === 0 ? (
              <p className="text-[14px] text-neutral-400">No consent documents on file.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="pb-2 text-left font-medium text-neutral-500">Document Type</th>
                      <th className="pb-2 text-left font-medium text-neutral-500">Signed At</th>
                      <th className="pb-2 text-left font-medium text-neutral-500">Expires</th>
                      <th className="pb-2 text-left font-medium text-neutral-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {(consentData?.data ?? []).map((doc) => {
                      const statusLabel = doc.isRevoked
                        ? 'Revoked'
                        : doc.signedAt
                          ? 'Signed'
                          : 'Pending';
                      const statusClass = doc.isRevoked
                        ? 'bg-red-100 text-red-700'
                        : doc.signedAt
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700';
                      return (
                        <tr key={doc.id}>
                          <td className="py-2 pr-4 font-medium text-neutral-900 capitalize">
                            {doc.documentType.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 pr-4 text-neutral-600">
                            {doc.signedAt ? (
                              new Date(doc.signedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-neutral-600">
                            {doc.expiresAt ? (
                              new Date(doc.expiresAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            ) : (
                              <span className="text-neutral-300">Never</span>
                            )}
                          </td>
                          <td className="py-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}
                            >
                              {doc.signedAt && !doc.isRevoked && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------- Resident History — GAP 7.3 ---------- */}
      {isAdminOrManager && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-neutral-400" />
            <h2 className="text-[14px] font-semibold text-neutral-900">Change History</h2>
          </div>
          <CardContent>
            {(historyData?.data ?? []).length === 0 ? (
              <p className="text-[14px] text-neutral-400">No history records found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(historyData?.data ?? []).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
                      <Clock className="h-3 w-3 text-neutral-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-neutral-900 capitalize">
                        {entry.action}
                      </p>
                      {entry.fields && Object.keys(entry.fields).length > 0 && (
                        <p className="text-[12px] text-neutral-500">
                          {Object.keys(entry.fields).join(', ')}
                        </p>
                      )}
                      <p className="text-[12px] text-neutral-400">
                        {new Date(entry.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------- Reset Password Confirmation Dialog ---------- */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="bg-warning-50 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Lock className="text-warning-600 h-7 w-7" />
            </div>
            <DialogTitle className="text-[18px] font-bold text-neutral-900">
              Reset Password
            </DialogTitle>
            <DialogDescription className="mt-1 text-[14px] text-neutral-500">
              Send a password reset for{' '}
              <span className="font-medium text-neutral-700">
                {resident.firstName} {resident.lastName}
              </span>
              ? They will receive a temporary password or reset link.
            </DialogDescription>

            {resetPasswordResult && (
              <div
                className={`mt-4 w-full rounded-xl border px-4 py-3 text-left text-[14px] ${
                  resetPasswordResult.startsWith('Password reset')
                    ? 'border-success-200 bg-success-50 text-success-700'
                    : 'border-error-200 bg-error-50 text-error-700'
                }`}
              >
                {resetPasswordResult}
              </div>
            )}

            <div className="mt-6 flex w-full gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setResetPasswordOpen(false)}
                disabled={resetPasswordLoading}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                loading={resetPasswordLoading}
                disabled={resetPasswordLoading}
                className="bg-warning-600 hover:bg-warning-700 text-white"
                onClick={handleResetPassword}
              >
                {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Send Message Dialog ---------- */}
      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary-50 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <MessageSquare className="text-primary-600 h-7 w-7" />
            </div>
            <DialogTitle className="text-[18px] font-bold text-neutral-900">
              Send Message
            </DialogTitle>
            <DialogDescription className="mt-1 text-[14px] text-neutral-500">
              Send a message to{' '}
              <span className="font-medium text-neutral-700">
                {resident.firstName} {resident.lastName}
              </span>{' '}
              via email.
            </DialogDescription>

            <textarea
              className="focus:border-primary-300 focus:ring-primary-100 mt-4 w-full rounded-xl border border-neutral-200 p-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
              rows={4}
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={sendMessageLoading}
            />

            {sendMessageResult && (
              <div
                className={`mt-3 w-full rounded-xl border px-4 py-3 text-left text-[14px] ${
                  sendMessageResult.includes('successfully')
                    ? 'border-success-200 bg-success-50 text-success-700'
                    : 'border-error-200 bg-error-50 text-error-700'
                }`}
              >
                {sendMessageResult}
              </div>
            )}

            <div className="mt-6 flex w-full gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSendMessageOpen(false)}
                disabled={sendMessageLoading}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                loading={sendMessageLoading}
                disabled={sendMessageLoading || !messageText.trim()}
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
                {sendMessageLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Deactivate Confirmation Dialog ---------- */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="bg-error-50 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <AlertTriangle className="text-error-600 h-7 w-7" />
            </div>
            <DialogTitle className="text-[18px] font-bold text-neutral-900">
              Deactivate Account
            </DialogTitle>
            <DialogDescription className="mt-1 text-[14px] text-neutral-500">
              Are you sure you want to deactivate{' '}
              <span className="font-medium text-neutral-700">
                {resident.firstName} {resident.lastName}
              </span>
              ?
            </DialogDescription>

            <div className="mt-4 w-full rounded-xl bg-neutral-50 p-4 text-left">
              <p className="text-[13px] leading-relaxed text-neutral-600">
                All active sessions will be terminated. The user will not be able to log in. Their
                data will be retained for audit purposes but marked as read-only. This can be
                reversed by an admin.
              </p>
            </div>

            {deactivateError && (
              <div className="border-error-200 bg-error-50 text-error-700 mt-3 w-full rounded-xl border px-4 py-3 text-left text-[14px]">
                {deactivateError}
              </div>
            )}

            <div className="mt-6 flex w-full gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setDeactivateOpen(false)}
                disabled={deactivateLoading}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                loading={deactivateLoading}
                disabled={deactivateLoading}
                className="bg-error-600 hover:bg-error-700 text-white"
                onClick={handleDeactivate}
              >
                {deactivateLoading ? 'Deactivating...' : 'Deactivate Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
