'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit2,
  Key,
  LogIn,
  LogOut,
  MessageSquare,
  Shield,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssignmentHistoryEntry {
  id: string;
  action: 'checkout' | 'return';
  resident: string;
  unit: string;
  date: string;
  actor: string;
  idVerified: boolean;
}

interface RelatedIncident {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface KeyDetail {
  id: string;
  serialNumber: string;
  type: string;
  status: string;
  property: string;
  createdAt: string;
  notes: string;
  currentAssignment: {
    resident: string;
    unit: string;
    building: string;
    checkedOutBy: string;
    checkedOutAt: string;
    expectedReturn: string | null;
    idVerified: boolean;
  } | null;
  assignmentHistory: AssignmentHistoryEntry[];
  relatedIncidents: RelatedIncident[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: string): {
  variant: 'success' | 'warning' | 'error' | 'default' | 'info' | 'primary';
  label: string;
} {
  switch (status) {
    case 'available':
      return { variant: 'success', label: 'Available' };
    case 'checked_out':
      return { variant: 'warning', label: 'Checked Out' };
    case 'lost':
      return { variant: 'error', label: 'Lost' };
    case 'decommissioned':
      return { variant: 'default', label: 'Decommissioned' };
    default:
      return { variant: 'default', label: status };
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'fob':
      return 'FOB';
    case 'master':
      return 'Master Key';
    case 'unit':
      return 'Unit Key';
    case 'mailbox':
      return 'Mailbox Key';
    case 'garage':
      return 'Garage Clicker';
    default:
      return type;
  }
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function KeyDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-20 rounded bg-neutral-200" />
        <div className="h-7 w-48 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="h-40 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
          <div className="h-48 rounded-xl bg-neutral-100" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-28 rounded-xl bg-neutral-100" />
          <div className="h-36 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KeyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: keyItem,
    loading,
    error,
  } = useApi<KeyDetail>(apiUrl(`/api/v1/keys/${id}`, { propertyId: getPropertyId() }));

  // -- Loading State --
  if (loading) {
    return <KeyDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Key Not Found' : 'Failed to Load Key'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/keys">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to keys
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!keyItem) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Key className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Key Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The key you are looking for does not exist or has been removed.
        </p>
        <Link href="/keys">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to keys
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(keyItem.status);
  const isCheckedOut = keyItem.status === 'checked_out';
  const isAvailable = keyItem.status === 'available';
  const assignmentHistory = keyItem.assignmentHistory ?? [];
  const relatedIncidents = keyItem.relatedIncidents ?? [];

  // Calculate days checked out
  const checkedOutDate = keyItem.currentAssignment
    ? new Date(keyItem.currentAssignment.checkedOutAt)
    : null;
  const daysOut = checkedOutDate
    ? Math.floor((Date.now() - checkedOutDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/keys"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to keys
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              {keyItem.serialNumber}
            </h1>
            <Badge variant={statusConfig.variant} size="lg" dot>
              {statusConfig.label}
            </Badge>
            <Badge variant="info" size="lg">
              {getTypeLabel(keyItem.type)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Key Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Key Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Serial Number
                  </p>
                  <p className="mt-1 font-mono text-[15px] font-medium text-neutral-900">
                    {keyItem.serialNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Type
                  </p>
                  <p className="mt-1">
                    <Badge variant="info" size="lg">
                      {getTypeLabel(keyItem.type)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Status
                  </p>
                  <p className="mt-1">
                    <Badge variant={statusConfig.variant} size="lg" dot>
                      {statusConfig.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Property
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{keyItem.property || '—'}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Registered
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {keyItem.createdAt
                      ? new Date(keyItem.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                {isCheckedOut && (
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Days Checked Out
                    </p>
                    <div className="mt-1">
                      <Badge
                        variant={daysOut > 30 ? 'error' : daysOut > 14 ? 'warning' : 'success'}
                        size="lg"
                        dot
                      >
                        {daysOut} {daysOut === 1 ? 'day' : 'days'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          {isCheckedOut && keyItem.currentAssignment && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Current Assignment</h2>
              </div>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Resident
                    </p>
                    <p className="mt-1 text-[15px] font-medium text-neutral-900">
                      {keyItem.currentAssignment.resident}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Unit
                    </p>
                    <p className="mt-1 text-[15px] font-medium text-neutral-900">
                      {keyItem.currentAssignment.building} &middot; Unit{' '}
                      {keyItem.currentAssignment.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Checked Out By
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-900">
                      {keyItem.currentAssignment.checkedOutBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Date
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-900">
                      {checkedOutDate
                        ? checkedOutDate.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      ID Verified
                    </p>
                    <p className="mt-1">
                      <Badge
                        variant={keyItem.currentAssignment.idVerified ? 'success' : 'error'}
                        size="md"
                        dot
                      >
                        {keyItem.currentAssignment.idVerified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Expected Return
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-500">
                      {keyItem.currentAssignment.expectedReturn
                        ? new Date(keyItem.currentAssignment.expectedReturn).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )
                        : 'No return date set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Assignment History</h2>
            </div>
            <CardContent>
              {assignmentHistory.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                          Action
                        </th>
                        <th className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                          Resident
                        </th>
                        <th className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                          Unit
                        </th>
                        <th className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                          Staff
                        </th>
                        <th className="px-4 py-2.5 text-left text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
                          ID Verified
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {assignmentHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-2.5">
                            <Badge
                              variant={entry.action === 'checkout' ? 'warning' : 'success'}
                              size="sm"
                            >
                              {entry.action === 'checkout' ? 'Check Out' : 'Return'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-[13px] font-medium text-neutral-900">
                            {entry.resident}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-neutral-700">{entry.unit}</td>
                          <td className="px-4 py-2.5 text-[13px] text-neutral-700">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-neutral-700">
                            {entry.actor}
                          </td>
                          <td className="px-4 py-2.5">
                            {entry.idVerified ? (
                              <CheckCircle2 className="text-success-600 h-4 w-4" />
                            ) : (
                              <XCircle className="text-error-500 h-4 w-4" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No assignment history.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <div className="flex flex-col items-center py-2">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  keyItem.status === 'available'
                    ? 'bg-success-50'
                    : keyItem.status === 'checked_out'
                      ? 'bg-warning-50'
                      : keyItem.status === 'lost'
                        ? 'bg-error-50'
                        : 'bg-neutral-100'
                }`}
              >
                {keyItem.status === 'available' ? (
                  <Key className="text-success-600 h-7 w-7" />
                ) : keyItem.status === 'checked_out' ? (
                  <LogOut className="text-warning-600 h-7 w-7" />
                ) : keyItem.status === 'lost' ? (
                  <AlertTriangle className="text-error-600 h-7 w-7" />
                ) : (
                  <Shield className="h-7 w-7 text-neutral-400" />
                )}
              </div>
              <Badge variant={statusConfig.variant} size="lg" dot className="mt-3">
                {statusConfig.label}
              </Badge>
              {isCheckedOut && keyItem.currentAssignment && (
                <p className="mt-2 text-[12px] text-neutral-400">
                  Held by {keyItem.currentAssignment.resident} &middot; Unit{' '}
                  {keyItem.currentAssignment.unit}
                </p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                {isAvailable && (
                  <Button fullWidth size="lg">
                    <LogIn className="h-4 w-4" />
                    Check Out
                  </Button>
                )}
                {isCheckedOut && (
                  <Button fullWidth size="lg">
                    <LogOut className="h-4 w-4" />
                    Return Key
                  </Button>
                )}
                <Button variant="secondary" fullWidth disabled={keyItem.status === 'lost'}>
                  <AlertTriangle className="h-4 w-4" />
                  Mark as Lost
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  className="text-error-600 hover:text-error-700"
                  disabled={keyItem.status === 'decommissioned'}
                >
                  <XCircle className="h-4 w-4" />
                  Decommission
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Incidents */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Related Incidents</h2>
            </div>
            <CardContent>
              {relatedIncidents.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {relatedIncidents.map((incident) => (
                    <Link
                      key={incident.id}
                      href={`/security/incidents/${incident.id}`}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
                    >
                      <p className="text-primary-600 text-[13px] font-medium">{incident.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          variant={incident.status === 'resolved' ? 'success' : 'warning'}
                          size="sm"
                          dot
                        >
                          {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </Badge>
                        <span className="text-[11px] text-neutral-400">{incident.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <ShieldAlert className="h-8 w-8 text-neutral-300" />
                  <p className="mt-2 text-[13px] text-neutral-400">No related incidents</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Notes</h2>
            </div>
            <CardContent>
              {keyItem.notes ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-[14px] leading-relaxed text-neutral-700">{keyItem.notes}</p>
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No notes added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
