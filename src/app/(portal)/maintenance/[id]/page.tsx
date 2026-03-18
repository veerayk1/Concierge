'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  MapPin,
  MessageSquare,
  Paperclip,
  User,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_REQUEST = {
  referenceNumber: 'MR-0841',
  unit: '1501',
  building: 'Tower A',
  resident: 'Janet Smith',
  residentPhone: '416-555-0123',
  residentEmail: 'janet.smith@email.com',
  category: 'Plumbing',
  description:
    'Kitchen sink leaking under cabinet. Water pooling on floor. Started noticing yesterday evening. The leak seems to come from the U-bend pipe connection.',
  status: 'open' as const,
  priority: 'high' as const,
  permissionToEnter: true,
  entryInstructions: 'Key is with front desk. Dog Daisy will be in the bedroom.',
  assignedTo: undefined as string | undefined,
  vendor: undefined as string | undefined,
  createdAt: '2026-03-18T08:00:00',
  updatedAt: '2026-03-18T08:00:00',
  history: [
    {
      id: '1',
      action: 'created',
      detail: 'Request submitted by Janet Smith',
      actor: 'Janet Smith',
      timestamp: '2026-03-18T08:00:00',
    },
    {
      id: '2',
      action: 'notification',
      detail: 'Email notification sent to property management',
      actor: 'System',
      timestamp: '2026-03-18T08:00:30',
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MaintenanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  const { id } = use(params);

  const statusMap = {
    open: { variant: 'warning' as const, label: 'Open' },
    assigned: { variant: 'info' as const, label: 'Assigned' },
    in_progress: { variant: 'primary' as const, label: 'In Progress' },
    on_hold: { variant: 'default' as const, label: 'On Hold' },
    resolved: { variant: 'success' as const, label: 'Resolved' },
    closed: { variant: 'default' as const, label: 'Closed' },
  };
  const priorityMap = {
    low: 'default' as const,
    medium: 'warning' as const,
    high: 'error' as const,
    urgent: 'error' as const,
  };

  const status = statusMap[MOCK_REQUEST.status];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/maintenance"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Request {MOCK_REQUEST.referenceNumber}
            </h1>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
            <Badge variant={priorityMap[MOCK_REQUEST.priority]} size="lg" dot>
              {MOCK_REQUEST.priority} priority
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm">
            <Wrench className="h-4 w-4" />
            Assign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: Details */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Issue Description */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Issue Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <p className="mt-1">
                    <Badge variant="default" size="md">
                      {MOCK_REQUEST.category}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {MOCK_REQUEST.building} &middot; Unit {MOCK_REQUEST.unit}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {MOCK_REQUEST.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Access & Entry</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Permission to Enter
                  </p>
                  <p className="mt-1">
                    <Badge
                      variant={MOCK_REQUEST.permissionToEnter ? 'success' : 'error'}
                      size="md"
                      dot
                    >
                      {MOCK_REQUEST.permissionToEnter ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Entry Instructions
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-700">
                    {MOCK_REQUEST.entryInstructions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resident Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Submitted By</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Resident
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {MOCK_REQUEST.resident}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Phone
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-700">{MOCK_REQUEST.residentPhone}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Email
                  </p>
                  <p className="text-primary-600 mt-1 text-[15px]">{MOCK_REQUEST.residentEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions + Timeline */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth size="lg">
                  <Wrench className="h-4 w-4" />
                  Assign Staff
                </Button>
                <Button variant="secondary" fullWidth>
                  <MessageSquare className="h-4 w-4" />
                  Add Comment
                </Button>
                <Button variant="secondary" fullWidth>
                  <Camera className="h-4 w-4" />
                  Upload Photo
                </Button>
                <Button variant="secondary" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Resolved
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">History</h2>
            <CardContent>
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                <div className="flex flex-col gap-4">
                  {MOCK_REQUEST.history.map((event) => (
                    <div key={event.id} className="relative flex gap-3">
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                        {event.action === 'created' ? (
                          <Wrench className="text-primary-600 h-3.5 w-3.5" />
                        ) : (
                          <Bell className="text-info-600 h-3.5 w-3.5" />
                        )}
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
