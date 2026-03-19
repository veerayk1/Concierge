'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  FileText,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Printer,
  Shield,
  ShieldAlert,
  Siren,
  User,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncidentUpdate {
  id: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
  statusChange?: { from: string; to: string };
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INCIDENT = {
  id: '1',
  referenceNumber: 'INC-0089',
  title: 'Noise Complaint — Floor 8',
  type: 'Noise Complaint',
  description:
    'Resident in unit 803 reports excessive noise from unit 805 starting around 11:45 PM. Loud music and voices heard through the walls. Guard attended the floor and issued a verbal warning to unit 805 occupants. Noise subsided temporarily but resumed around 1:15 AM. Second visit made, written notice left at the door. Building quiet hours policy (11 PM - 7 AM) was cited.',
  timeOccurred: '2026-03-18T23:45:00',
  location: 'Floor 8, Units 803-805 corridor',
  reportedBy: 'Guard Patel',
  reportedByRole: 'Security Guard',
  urgency: 'medium' as const,
  category: 'Noise',
  status: 'investigating' as const,
  escalationStatus: 'not_escalated' as const,
  assignedTo: 'Guard Patel',
  unit: '805',
  building: 'Tower A',

  suspectDescription:
    'Multiple individuals observed in unit 805. Approximately 6-8 people. No signs of intoxication or aggression. Cooperative when approached.',

  witnesses: [
    { name: 'Janet Smith', unit: '803', phone: '416-555-0123' },
    { name: 'Robert Chen', unit: '801', phone: '416-555-0189' },
  ],

  emergencyServices: {
    police: false,
    fire: false,
    ambulance: false,
  },

  attachments: [
    { id: '1', name: 'written-notice-805.pdf', type: 'document', size: '124 KB' },
    { id: '2', name: 'hallway-photo-0118am.jpg', type: 'image', size: '2.1 MB' },
  ],

  relatedEvent: { id: 'EVT-4201', type: 'Security Log' },
  relatedUnit: { number: '805', building: 'Tower A' },

  resolution: null as {
    summary: string;
    resolvedBy: string;
    resolvedAt: string;
  } | null,

  updates: [
    {
      id: '1',
      action: 'created',
      detail: 'Incident report filed. Resident in 803 reported noise from 805.',
      actor: 'Guard Patel',
      timestamp: '2026-03-18T23:50:00',
    },
    {
      id: '2',
      action: 'status_change',
      detail: 'First visit to unit 805. Verbal warning issued. Occupants cooperative.',
      actor: 'Guard Patel',
      timestamp: '2026-03-19T00:05:00',
      statusChange: { from: 'Open', to: 'Investigating' },
    },
    {
      id: '3',
      action: 'update',
      detail:
        'Noise resumed at 1:15 AM. Second visit made. Written notice left at door citing quiet hours policy. Building manager notified via email.',
      actor: 'Guard Patel',
      timestamp: '2026-03-19T01:20:00',
    },
  ] as IncidentUpdate[],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUpdateIcon(action: string) {
  switch (action) {
    case 'created':
      return <ShieldAlert className="text-error-600 h-4 w-4" />;
    case 'status_change':
      return <ArrowUpRight className="text-info-600 h-4 w-4" />;
    case 'update':
      return <MessageSquare className="text-warning-600 h-4 w-4" />;
    case 'resolved':
      return <CheckCircle2 className="text-success-600 h-4 w-4" />;
    case 'escalated':
      return <AlertTriangle className="text-error-600 h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4 text-neutral-400" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IncidentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const { id } = use(params);

  const statusMap = {
    open: { variant: 'warning' as const, label: 'Open' },
    investigating: { variant: 'info' as const, label: 'Investigating' },
    resolved: { variant: 'success' as const, label: 'Resolved' },
    closed: { variant: 'default' as const, label: 'Closed' },
  };

  const urgencyMap = {
    low: 'default' as const,
    medium: 'warning' as const,
    high: 'error' as const,
    critical: 'error' as const,
  };

  const escalationMap = {
    not_escalated: { variant: 'default' as const, label: 'Not Escalated' },
    escalated: { variant: 'error' as const, label: 'Escalated' },
    de_escalated: { variant: 'success' as const, label: 'De-escalated' },
  };

  const status = statusMap[MOCK_INCIDENT.status];
  const escalation = escalationMap[MOCK_INCIDENT.escalationStatus];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/security"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to security
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Incident {MOCK_INCIDENT.referenceNumber}
            </h1>
            <Badge variant={status.variant} size="lg" dot>
              {status.label}
            </Badge>
            <Badge variant={urgencyMap[MOCK_INCIDENT.urgency]} size="lg" dot>
              {MOCK_INCIDENT.urgency} urgency
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
            Print Report
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Incident Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Incident Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Title
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {MOCK_INCIDENT.title}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Type
                  </p>
                  <p className="mt-1">
                    <Badge variant="default" size="md">
                      {MOCK_INCIDENT.type}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Occurred
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {new Date(MOCK_INCIDENT.timeOccurred).toLocaleString('en-US', {
                      weekday: 'short',
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
                    Location
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {MOCK_INCIDENT.location}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Reported By
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    {MOCK_INCIDENT.reportedBy}
                    <span className="text-[13px] text-neutral-500">
                      ({MOCK_INCIDENT.reportedByRole})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Urgency
                  </p>
                  <p className="mt-1">
                    <Badge variant={urgencyMap[MOCK_INCIDENT.urgency]} size="md" dot>
                      {MOCK_INCIDENT.urgency}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {MOCK_INCIDENT.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suspect Description */}
          {MOCK_INCIDENT.suspectDescription && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Suspect Description</h2>
              </div>
              <CardContent>
                <p className="text-[15px] leading-relaxed text-neutral-700">
                  {MOCK_INCIDENT.suspectDescription}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Witness Information */}
          {MOCK_INCIDENT.witnesses.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Witness Information ({MOCK_INCIDENT.witnesses.length})
                </h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {MOCK_INCIDENT.witnesses.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-neutral-900">{w.name}</p>
                        <p className="text-[13px] text-neutral-500">Unit {w.unit}</p>
                      </div>
                      <p className="flex items-center gap-1 text-[13px] text-neutral-600">
                        <Phone className="h-3 w-3" />
                        {w.phone}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Services */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Siren className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Emergency Services Contacted
              </h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Police', contacted: MOCK_INCIDENT.emergencyServices.police },
                  { label: 'Fire', contacted: MOCK_INCIDENT.emergencyServices.fire },
                  { label: 'Ambulance', contacted: MOCK_INCIDENT.emergencyServices.ambulance },
                ].map((svc) => (
                  <div
                    key={svc.label}
                    className="flex items-center gap-3 rounded-xl border border-neutral-100 p-4"
                  >
                    {svc.contacted ? (
                      <CheckCircle2 className="text-success-600 h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-neutral-300" />
                    )}
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">{svc.label}</p>
                      <p className="text-[12px] text-neutral-500">
                        {svc.contacted ? 'Yes — Contacted' : 'Not contacted'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photos / Attachments */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Attachments ({MOCK_INCIDENT.attachments.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-2">
                {MOCK_INCIDENT.attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                        {a.type === 'image' ? (
                          <Eye className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900">{a.name}</p>
                        <p className="text-[12px] text-neutral-400">{a.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Updates Timeline */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Updates Timeline</h2>
            <CardContent>
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                <div className="flex flex-col gap-5">
                  {MOCK_INCIDENT.updates.map((update) => (
                    <div key={update.id} className="relative flex gap-3">
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                        {getUpdateIcon(update.action)}
                      </div>
                      <div className="flex flex-col gap-1 pt-0.5">
                        <p className="text-[13px] font-medium text-neutral-900">{update.detail}</p>
                        {update.statusChange && (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" size="sm">
                              {update.statusChange.from}
                            </Badge>
                            <ArrowUpRight className="h-3 w-3 text-neutral-400" />
                            <Badge variant="info" size="sm">
                              {update.statusChange.to}
                            </Badge>
                          </div>
                        )}
                        <p className="text-[12px] text-neutral-400">
                          {new Date(update.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' \u00B7 '}
                          {update.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
                <Button variant="danger" fullWidth size="lg">
                  <AlertTriangle className="h-4 w-4" />
                  Escalate
                </Button>
                <Button variant="secondary" fullWidth>
                  <MessageSquare className="h-4 w-4" />
                  Add Update
                </Button>
                <Button variant="secondary" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Close Incident
                </Button>
                <Button variant="secondary" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Status</h2>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Current Status
                  </p>
                  <p className="mt-1">
                    <Badge variant={status.variant} size="lg" dot>
                      {status.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Escalation
                  </p>
                  <p className="mt-1">
                    <Badge variant={escalation.variant} size="md">
                      {escalation.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Assigned To
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-neutral-900">
                    <Shield className="h-3.5 w-3.5 text-neutral-400" />
                    {MOCK_INCIDENT.assignedTo}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Items */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Linked Items</h2>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK_INCIDENT.relatedEvent && (
                  <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
                    <div>
                      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Related Event
                      </p>
                      <p className="text-primary-600 mt-0.5 font-mono text-[13px] font-semibold">
                        {MOCK_INCIDENT.relatedEvent.id}
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        {MOCK_INCIDENT.relatedEvent.type}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                  </div>
                )}
                {MOCK_INCIDENT.relatedUnit && (
                  <Link href={`/units/${MOCK_INCIDENT.relatedUnit.number}`}>
                    <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-colors hover:bg-neutral-50">
                      <div>
                        <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Related Unit
                        </p>
                        <p className="text-primary-600 mt-0.5 text-[13px] font-semibold">
                          Unit {MOCK_INCIDENT.relatedUnit.number}
                        </p>
                        <p className="text-[12px] text-neutral-500">
                          {MOCK_INCIDENT.relatedUnit.building}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resolution */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Resolution</h2>
            <CardContent>
              {MOCK_INCIDENT.resolution ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Summary
                    </p>
                    <p className="mt-1 text-[14px] leading-relaxed text-neutral-700">
                      {MOCK_INCIDENT.resolution.summary}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Resolved By
                    </p>
                    <p className="mt-1 text-[14px] text-neutral-900">
                      {MOCK_INCIDENT.resolution.resolvedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Resolved At
                    </p>
                    <p className="mt-1 text-[14px] text-neutral-900">
                      {new Date(MOCK_INCIDENT.resolution.resolvedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-8 text-center">
                  <Clock className="mb-2 h-5 w-5 text-neutral-300" />
                  <p className="text-[13px] text-neutral-400">Incident not yet resolved</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
