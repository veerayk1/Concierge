'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
  ImageIcon,
  Link2,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Printer,
  Send,
  Settings,
  ShieldAlert,
  User,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_REQUEST = {
  id: '1',
  referenceNumber: 'MR-0841',
  title: 'Kitchen Sink Leak — Unit 1501',
  unit: '1501',
  building: 'Tower A',
  resident: 'Janet Smith',
  residentPhone: '416-555-0123',
  residentEmail: 'janet.smith@email.com',
  category: 'Plumbing',
  description:
    'Kitchen sink leaking under cabinet. Water pooling on floor. Started noticing yesterday evening. The leak seems to come from the U-bend pipe connection. Towels placed underneath to absorb water for now.',
  areaDescription: 'Kitchen — under the sink cabinet, left side near dishwasher connection',
  status: 'open' as const,
  priority: 'high' as const,
  permissionToEnter: true,
  entryInstructions:
    'Key is with front desk. Dog Daisy will be in the bedroom — do not let her out.',
  assignedStaff: 'Carlos Rivera',
  assignedStaffPhone: '416-555-0456',
  assignedStaffEmail: 'c.rivera@concierge.app',
  assignedVendor: undefined as string | undefined,
  scheduledDate: undefined as string | undefined,
  createdAt: '2026-03-18T08:00:00',
  updatedAt: '2026-03-18T14:22:00',
  sla: {
    targetHours: 48,
    reportedAt: '2026-03-18T08:00:00',
    status: 'on_track' as 'on_track' | 'at_risk' | 'breached',
  },
  linkedEquipment: {
    id: 'eq-102',
    name: 'Kitchen Sink Faucet — Moen #7594',
    location: 'Unit 1501, Kitchen',
  },
  linkedEvent: {
    id: 'evt-3891',
    type: 'Water Leak Report',
    date: '2026-03-17',
  },
  comments: [
    {
      id: 'c1',
      author: 'Janet Smith',
      role: 'Resident',
      timestamp: '2026-03-18T08:00:00',
      message:
        'The leak started last night around 10pm. I placed towels but the floor is getting warped. Please address ASAP.',
    },
    {
      id: 'c2',
      author: 'Mike Johnson',
      role: 'Concierge',
      timestamp: '2026-03-18T09:15:00',
      message:
        'Thank you Janet. I have escalated this to maintenance. Carlos will be assigned shortly. In the meantime, please turn off the water valve under the sink if possible.',
    },
    {
      id: 'c3',
      author: 'Carlos Rivera',
      role: 'Maintenance Staff',
      timestamp: '2026-03-18T14:22:00',
      message:
        'Inspected the unit. The U-bend connection is corroded and needs replacement. I have ordered the part — expected delivery tomorrow morning. Will return to complete the repair.',
    },
  ],
  history: [
    {
      id: 'h1',
      action: 'created',
      detail: 'Request submitted by Janet Smith',
      actor: 'Janet Smith',
      timestamp: '2026-03-18T08:00:00',
    },
    {
      id: 'h2',
      action: 'notification',
      detail: 'Email notification sent to property management',
      actor: 'System',
      timestamp: '2026-03-18T08:00:30',
    },
    {
      id: 'h3',
      action: 'assigned',
      detail: 'Assigned to Carlos Rivera (Maintenance Staff)',
      actor: 'Mike Johnson',
      timestamp: '2026-03-18T09:20:00',
    },
    {
      id: 'h4',
      action: 'comment',
      detail: 'Carlos Rivera added a comment',
      actor: 'Carlos Rivera',
      timestamp: '2026-03-18T14:22:00',
    },
  ],
};

// ---------------------------------------------------------------------------
// Timeline icon helper
// ---------------------------------------------------------------------------

function getTimelineIcon(action: string) {
  switch (action) {
    case 'created':
      return <Wrench className="text-primary-600 h-3.5 w-3.5" />;
    case 'notification':
      return <Bell className="text-info-600 h-3.5 w-3.5" />;
    case 'assigned':
      return <User className="text-warning-600 h-3.5 w-3.5" />;
    case 'comment':
      return <MessageSquare className="h-3.5 w-3.5 text-neutral-500" />;
    case 'resolved':
      return <CheckCircle2 className="text-success-600 h-3.5 w-3.5" />;
    case 'closed':
      return <XCircle className="h-3.5 w-3.5 text-neutral-400" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-neutral-400" />;
  }
}

// ---------------------------------------------------------------------------
// SLA helpers
// ---------------------------------------------------------------------------

function getSlaVariant(status: string): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'on_track':
      return 'success';
    case 'at_risk':
      return 'warning';
    case 'breached':
      return 'error';
    default:
      return 'success';
  }
}

function getSlaLabel(status: string): string {
  switch (status) {
    case 'on_track':
      return 'On Track';
    case 'at_risk':
      return 'At Risk';
    case 'breached':
      return 'Breached';
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MaintenanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  const { id } = use(params);
  const [commentText, setCommentText] = useState('');

  const statusMap = {
    open: { variant: 'warning' as const, label: 'Open' },
    assigned: { variant: 'info' as const, label: 'Assigned' },
    in_progress: { variant: 'primary' as const, label: 'In Progress' },
    on_hold: { variant: 'default' as const, label: 'On Hold' },
    resolved: { variant: 'success' as const, label: 'Resolved' },
    closed: { variant: 'default' as const, label: 'Closed' },
  };
  const priorityMap = {
    low: { variant: 'default' as const, label: 'Low' },
    medium: { variant: 'warning' as const, label: 'Medium' },
    high: { variant: 'error' as const, label: 'High' },
    urgent: { variant: 'error' as const, label: 'Urgent' },
  };

  const req = { ...MOCK_REQUEST, id };
  const status = statusMap[req.status];
  const priority = priorityMap[req.priority];
  const reportedDate = new Date(req.createdAt);

  // SLA time calculations
  const slaElapsedMs = Date.now() - new Date(req.sla.reportedAt).getTime();
  const slaElapsedHours = Math.floor(slaElapsedMs / (1000 * 60 * 60));
  const slaRemainingHours = Math.max(0, req.sla.targetHours - slaElapsedHours);

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
              Request {req.referenceNumber}
            </h1>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
            <Badge variant={priority.variant} size="lg" dot>
              {priority.label} Priority
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="secondary" size="sm">
            <Printer className="h-4 w-4" />
            Print Work Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column: Details */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Request Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Request Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reference Number
                  </p>
                  <p className="mt-1 font-mono text-[15px] font-medium text-neutral-900">
                    {req.referenceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <p className="mt-1">
                    <Badge variant="default" size="md">
                      {req.category}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Title
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">{req.title}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {req.description}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {req.building} &middot; Unit {req.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reported By
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{req.resident}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Date Reported
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {reportedDate.toLocaleString('en-US', {
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
                    Permission to Enter
                  </p>
                  <p className="mt-1">
                    <Badge variant={req.permissionToEnter ? 'success' : 'error'} size="md" dot>
                      {req.permissionToEnter ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Entry Instructions
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-700">{req.entryInstructions}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Area Description
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-700">{req.areaDescription}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos / Attachments */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Photos / Attachments</h2>
            </div>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                  <ImageIcon className="h-5 w-5 text-neutral-400" />
                </div>
                <p className="mt-3 text-[13px] font-medium text-neutral-500">
                  No photos or attachments yet
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Camera className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Paperclip className="h-4 w-4" />
                    Attach File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Thread */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Comments ({req.comments.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                {req.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary-100 text-primary-700 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold">
                          {comment.author
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {comment.author}
                          </span>
                          <span className="ml-1.5 text-[11px] text-neutral-400">
                            {comment.role}
                          </span>
                        </div>
                      </div>
                      <span className="text-[12px] text-neutral-400">
                        {new Date(comment.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                      {comment.message}
                    </p>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="mt-2 border-t border-neutral-200 pt-4">
                  <Textarea
                    label="Add a comment"
                    placeholder="Type your comment here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" disabled={!commentText.trim()}>
                      <Send className="h-4 w-4" />
                      Submit Comment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions, Assignment, SLA, Related, Timeline */}
        <div className="flex flex-col gap-6">
          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Update Status */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Update Status
                  </p>
                  <select className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none">
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Assign Staff */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Assign Staff
                  </p>
                  <select className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none">
                    <option value="">Select staff member...</option>
                    <option value="carlos">Carlos Rivera</option>
                    <option value="sarah">Sarah Chen</option>
                    <option value="james">James Wilson</option>
                  </select>
                </div>

                {/* Assign Vendor */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Assign Vendor
                  </p>
                  <select className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none">
                    <option value="">Select vendor...</option>
                    <option value="acme">Acme Plumbing Co.</option>
                    <option value="elite">Elite HVAC Services</option>
                    <option value="pro">Pro Electric Ltd.</option>
                  </select>
                </div>

                {/* Schedule Date */}
                <div>
                  <p className="mb-1.5 text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Schedule Date
                  </p>
                  <input
                    type="date"
                    className="focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-700 focus:ring-2 focus:outline-none"
                  />
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  <Button variant="secondary" fullWidth>
                    <Printer className="h-4 w-4" />
                    Print Work Order
                  </Button>
                  <Button variant="danger" fullWidth>
                    <XCircle className="h-4 w-4" />
                    Close Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Currently Assigned</h2>
            </div>
            <CardContent>
              {req.assignedStaff ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 text-primary-700 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold">
                      {req.assignedStaff
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-neutral-900">
                        {req.assignedStaff}
                      </p>
                      <p className="text-[12px] text-neutral-500">Maintenance Staff</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="flex items-center gap-1.5 text-[13px] text-neutral-600">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      {req.assignedStaffPhone}
                    </p>
                    <p className="text-primary-600 flex items-center gap-1.5 text-[13px]">
                      <Settings className="h-3 w-3 text-neutral-400" />
                      {req.assignedStaffEmail}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <User className="h-8 w-8 text-neutral-300" />
                  <p className="mt-2 text-[13px] text-neutral-400">Not yet assigned</p>
                </div>
              )}
              {req.assignedVendor && (
                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Vendor
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-neutral-900">
                    {req.assignedVendor}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Tracking */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">SLA Tracking</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Status
                  </span>
                  <Badge variant={getSlaVariant(req.sla.status)} size="lg" dot>
                    {getSlaLabel(req.sla.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reported
                  </span>
                  <span className="text-[13px] text-neutral-700">
                    {reportedDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Target Resolution
                  </span>
                  <span className="text-[13px] text-neutral-700">{req.sla.targetHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Elapsed
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {slaElapsedHours}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Remaining
                  </span>
                  <span
                    className={`text-[13px] font-semibold ${
                      slaRemainingHours <= 0
                        ? 'text-error-600'
                        : slaRemainingHours <= 12
                          ? 'text-warning-600'
                          : 'text-success-600'
                    }`}
                  >
                    {slaRemainingHours}h
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1">
                  <div className="h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        req.sla.status === 'breached'
                          ? 'bg-error-500'
                          : req.sla.status === 'at_risk'
                            ? 'bg-warning-500'
                            : 'bg-success-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (slaElapsedHours / req.sla.targetHours) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Related Items</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {req.linkedEquipment && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
                      Linked Equipment
                    </p>
                    <p className="text-primary-600 mt-1 text-[13px] font-medium">
                      {req.linkedEquipment.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-neutral-500">
                      <MapPin className="h-3 w-3" />
                      {req.linkedEquipment.location}
                    </p>
                  </div>
                )}
                {req.linkedEvent && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
                      Linked Event
                    </p>
                    <p className="text-primary-600 mt-1 text-[13px] font-medium">
                      {req.linkedEvent.type}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-neutral-500">
                      <Calendar className="h-3 w-3" />
                      {req.linkedEvent.date}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History Timeline */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">History</h2>
            <CardContent>
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                <div className="flex flex-col gap-4">
                  {req.history.map((event) => (
                    <div key={event.id} className="relative flex gap-3">
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
