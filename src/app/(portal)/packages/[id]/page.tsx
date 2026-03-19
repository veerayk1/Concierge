'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  ImageIcon,
  Inbox,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  RotateCcw,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ReleasePackageDialog } from '@/components/forms/release-package-dialog';

// ---------------------------------------------------------------------------
// Mock Package Detail
// ---------------------------------------------------------------------------

const MOCK_PACKAGE = {
  id: '1',
  referenceNumber: 'PKG-4821',
  status: 'unreleased' as const,
  direction: 'incoming' as const,
  courier: 'Amazon',
  trackingNumber: 'TBA123456789012',
  category: 'Medium Box',
  description: 'Brown cardboard box, approx 30x20x15cm',
  unit: '1501',
  building: 'Tower A',
  recipient: 'Janet Smith',
  recipientPhone: '416-555-0123',
  recipientEmail: 'janet.smith@email.com',
  storageSpot: 'Shelf A-3',
  isPerishable: true,
  isOversized: true,
  receivedAt: '2026-03-18T09:15:00',
  receivedBy: 'Mike Johnson',
  notes: 'Resident requested to hold until Saturday. Do not leave outside the door.',
  history: [
    {
      id: '1',
      action: 'created',
      timestamp: '2026-03-18T09:15:00',
      actor: 'Mike Johnson',
      detail: 'Package received from Amazon',
    },
    {
      id: '2',
      action: 'notification_sent',
      timestamp: '2026-03-18T09:15:30',
      actor: 'System',
      detail: 'Email notification sent to janet.smith@email.com',
    },
    {
      id: '3',
      action: 'notification_sent',
      timestamp: '2026-03-18T09:15:31',
      actor: 'System',
      detail: 'Push notification sent',
    },
    {
      id: '4',
      action: 'edited',
      timestamp: '2026-03-18T10:30:00',
      actor: 'Mike Johnson',
      detail: 'Storage location updated to Shelf A-3',
    },
  ],
};

// ---------------------------------------------------------------------------
// Courier badge color helper
// ---------------------------------------------------------------------------

function getCourierVariant(courier: string): 'info' | 'warning' | 'primary' | 'default' {
  switch (courier.toLowerCase()) {
    case 'amazon':
      return 'warning';
    case 'fedex':
      return 'primary';
    case 'ups':
      return 'info';
    default:
      return 'default';
  }
}

// ---------------------------------------------------------------------------
// Timeline Icon Helper
// ---------------------------------------------------------------------------

function getTimelineIcon(action: string) {
  switch (action) {
    case 'created':
      return <Inbox className="text-success-600 h-4 w-4" />;
    case 'notification_sent':
      return <Bell className="text-info-600 h-4 w-4" />;
    case 'released':
      return <CheckCircle2 className="text-success-600 h-4 w-4" />;
    case 'edited':
      return <Edit2 className="h-4 w-4 text-neutral-500" />;
    case 'returned':
      return <RotateCcw className="text-warning-600 h-4 w-4" />;
    case 'deleted':
      return <Trash2 className="text-error-500 h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4 text-neutral-400" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = use(params);
  const pkg = { ...MOCK_PACKAGE, id };
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);

  const statusBadge = {
    unreleased: { variant: 'warning' as const, label: 'Unreleased' },
    released: { variant: 'success' as const, label: 'Released' },
    returned: { variant: 'default' as const, label: 'Returned' },
    disposed: { variant: 'error' as const, label: 'Disposed' },
  };

  const status = statusBadge[pkg.status];
  const receivedDate = new Date(pkg.receivedAt);
  const ageMs = Date.now() - receivedDate.getTime();
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to packages
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Package {pkg.referenceNumber}
            </h1>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
            {pkg.isPerishable && (
              <Badge variant="error" size="lg">
                Perishable
              </Badge>
            )}
            {pkg.isOversized && (
              <Badge variant="warning" size="lg">
                <AlertTriangle className="h-3 w-3" />
                Oversized
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" size="sm">
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
          {pkg.status === 'unreleased' && (
            <Button size="sm" onClick={() => setShowReleaseDialog(true)}>
              Release Package
            </Button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column — Info Cards */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Package Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Package Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reference Number
                  </p>
                  <p className="mt-1 font-mono text-[15px] font-medium text-neutral-900">
                    {pkg.referenceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Courier
                  </p>
                  <p className="mt-1">
                    <Badge variant={getCourierVariant(pkg.courier)} size="lg">
                      {pkg.courier}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description / Type
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-700">{pkg.description}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Storage Location
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-neutral-900">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {pkg.storageSpot}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Received At
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {receivedDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Direction
                  </p>
                  <p className="mt-1">
                    <Badge variant={pkg.direction === 'incoming' ? 'info' : 'primary'} size="md">
                      {pkg.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Tracking Number
                  </p>
                  <p className="text-primary-600 mt-1 font-mono text-[14px]">
                    {pkg.trackingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Age
                  </p>
                  <div className="mt-1">
                    <Badge
                      variant={ageHours < 24 ? 'success' : ageHours < 72 ? 'warning' : 'error'}
                      size="lg"
                      dot
                    >
                      {ageHours < 24 ? `${ageHours}h` : `${Math.floor(ageHours / 24)}d`}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipient */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Recipient</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Name
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">{pkg.recipient}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {pkg.building} &middot; Unit {pkg.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Email
                  </p>
                  <p className="text-primary-600 mt-1 flex items-center gap-1.5 text-[15px]">
                    <Mail className="h-3.5 w-3.5 text-neutral-400" />
                    {pkg.recipientEmail}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Phone
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                    {pkg.recipientPhone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flags */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Flags</h2>
            </div>
            <CardContent>
              <div className="flex items-center gap-3">
                {pkg.isPerishable ? (
                  <div className="border-error-200 bg-error-50 flex items-center gap-2 rounded-lg border px-3 py-2">
                    <span className="bg-error-500 h-2 w-2 rounded-full" />
                    <span className="text-error-700 text-[13px] font-semibold">Perishable</span>
                    <span className="text-error-600 text-[12px]">
                      — Handle with priority, temperature-sensitive
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-neutral-300" />
                    <span className="text-[13px] text-neutral-500">Not perishable</span>
                  </div>
                )}
                {pkg.isOversized ? (
                  <div className="border-warning-200 bg-warning-50 flex items-center gap-2 rounded-lg border px-3 py-2">
                    <AlertTriangle className="text-warning-600 h-3.5 w-3.5" />
                    <span className="text-warning-700 text-[13px] font-semibold">Oversized</span>
                    <span className="text-warning-600 text-[12px]">
                      — May require special handling
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-neutral-300" />
                    <span className="text-[13px] text-neutral-500">Standard size</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes / Comments */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Notes / Comments</h2>
            </div>
            <CardContent>
              {pkg.notes ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-[14px] leading-relaxed text-neutral-700">{pkg.notes}</p>
                  <p className="mt-2 text-[12px] text-neutral-400">
                    Added by {pkg.receivedBy} &middot;{' '}
                    {receivedDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No notes added.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Actions + Timeline + Photos */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                {pkg.status === 'unreleased' && (
                  <Button fullWidth size="lg" onClick={() => setShowReleaseDialog(true)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Release Package
                  </Button>
                )}
                <Button variant="secondary" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print Label
                </Button>
                <Button variant="secondary" fullWidth>
                  <Send className="h-4 w-4" />
                  Send Reminder
                </Button>
                <Button variant="secondary" fullWidth>
                  <RotateCcw className="h-4 w-4" />
                  Mark as Returned
                </Button>
                <Button variant="ghost" fullWidth className="text-error-600 hover:text-error-700">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History Timeline */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Timeline</h2>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />

                <div className="flex flex-col gap-4">
                  {pkg.history.map((event) => (
                    <div key={event.id} className="relative flex gap-3 pl-0">
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                        {getTimelineIcon(event.action)}
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <p className="text-[13px] font-medium text-neutral-900">{event.detail}</p>
                        <p className="text-[12px] text-neutral-400">
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' \u00B7 '}
                          {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Section */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Photos</h2>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                  <ImageIcon className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="mt-3 text-[13px] font-medium text-neutral-500">No photos yet</p>
                <Button variant="secondary" size="sm" className="mt-3">
                  <Camera className="h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ReleasePackageDialog
        open={showReleaseDialog}
        onOpenChange={setShowReleaseDialog}
        packageId={pkg.id}
        packageRef={pkg.referenceNumber}
        recipientName={pkg.recipient}
        unitNumber={pkg.unit}
        onSuccess={() => {
          setShowReleaseDialog(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
