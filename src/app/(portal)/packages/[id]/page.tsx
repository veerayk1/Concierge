'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Edit2,
  Inbox,
  MapPin,
  Package,
  Phone,
  Printer,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
  isPerishable: false,
  isOversized: false,
  receivedAt: '2026-03-18T09:15:00',
  receivedBy: 'Mike Johnson',
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
  ],
};

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
          {pkg.status === 'unreleased' && <Button size="sm">Release Package</Button>}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column — Info Cards */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Package Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Package Information</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Courier
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">{pkg.courier}</p>
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
                    Category
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{pkg.category}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Direction
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900 capitalize">{pkg.direction}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-700">{pkg.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Recipient</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
                    Resident
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{pkg.recipient}</p>
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
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Email
                  </p>
                  <p className="text-primary-600 mt-1 text-[15px]">{pkg.recipientEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Storage & Timing</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Location
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">{pkg.storageSpot}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Received
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
        </div>

        {/* Right Column — Timeline + Actions */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          {pkg.status === 'unreleased' && (
            <Card>
              <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Quick Actions</h2>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button fullWidth size="lg">
                    <CheckCircle2 className="h-4 w-4" />
                    Release Package
                  </Button>
                  <Button variant="secondary" fullWidth>
                    <Send className="h-4 w-4" />
                    Send Reminder
                  </Button>
                  <Button variant="ghost" fullWidth className="text-error-600 hover:text-error-700">
                    <Trash2 className="h-4 w-4" />
                    Delete Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History Timeline */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">History</h2>
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
        </div>
      </div>
    </div>
  );
}
