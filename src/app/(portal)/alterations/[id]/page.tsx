'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Edit2,
  FileText,
  Hammer,
  ImageIcon,
  Mail,
  Phone,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlterationStatus =
  | 'submitted'
  | 'approved'
  | 'in_progress'
  | 'inspection'
  | 'completed'
  | 'rejected';
type MomentumLevel = 'ok' | 'slow' | 'stalled' | 'stopped';

interface TimelineEntry {
  id: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
}

interface AlterationDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface AlterationDetail {
  id: string;
  referenceNumber: string;
  unit: string;
  building: string;
  resident: string;
  type: string;
  description: string;
  status: AlterationStatus;
  momentum: MomentumLevel;
  contractor: {
    name: string;
    phone: string;
    email: string;
    licenseNumber: string;
  };
  permit: {
    hasPermit: boolean;
    permitNumber: string;
  };
  insurance: {
    hasInsurance: boolean;
    policyNumber: string;
    expiry: string;
  };
  schedule: {
    expectedStart: string;
    expectedEnd: string;
    actualStart: string;
    elapsedDays: number;
    progressPercent: number;
  };
  timeline: TimelineEntry[];
  documents: AlterationDocument[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ALTERATION: AlterationDetail = {
  id: '1',
  referenceNumber: 'ALT-004782',
  unit: '1501',
  building: 'Tower A',
  resident: 'Janet Smith',
  type: 'Kitchen Renovation',
  description:
    'Full kitchen renovation including new cabinetry, quartz countertops, backsplash tile, under-cabinet lighting, and replacement of all appliances. Plumbing relocated for island sink. Electrical panel upgrade required for induction cooktop.',
  status: 'in_progress',
  momentum: 'ok',
  contractor: {
    name: 'Premier Renovations Inc.',
    phone: '(416) 555-0199',
    email: 'projects@premierreno.ca',
    licenseNumber: 'CON-2024-11287',
  },
  permit: {
    hasPermit: true,
    permitNumber: 'BP-2026-03-04821',
  },
  insurance: {
    hasInsurance: true,
    policyNumber: 'GL-2026-PR-88412',
    expiry: '2027-02-28',
  },
  schedule: {
    expectedStart: '2026-03-01',
    expectedEnd: '2026-04-15',
    actualStart: '2026-03-03',
    elapsedDays: 16,
    progressPercent: 45,
  },
  timeline: [
    {
      id: 't1',
      action: 'submitted',
      detail: 'Alteration request submitted by Janet Smith',
      actor: 'Janet Smith',
      timestamp: '2026-02-10T09:00:00',
    },
    {
      id: 't2',
      action: 'approved',
      detail: 'Alteration approved by Property Manager',
      actor: 'Mike Johnson',
      timestamp: '2026-02-14T14:30:00',
    },
    {
      id: 't3',
      action: 'permit',
      detail: 'Building permit BP-2026-03-04821 uploaded',
      actor: 'Janet Smith',
      timestamp: '2026-02-25T11:00:00',
    },
    {
      id: 't4',
      action: 'started',
      detail: 'Renovation work commenced — demolition phase',
      actor: 'Premier Renovations Inc.',
      timestamp: '2026-03-03T08:00:00',
    },
    {
      id: 't5',
      action: 'update',
      detail: 'Plumbing rough-in completed. Electrical panel upgrade in progress.',
      actor: 'Premier Renovations Inc.',
      timestamp: '2026-03-15T16:00:00',
    },
  ],
  documents: [
    {
      id: 'doc1',
      name: 'Building Permit BP-2026-03-04821.pdf',
      type: 'Permit',
      size: '1.4 MB',
      uploadedAt: '2026-02-25',
    },
    {
      id: 'doc2',
      name: 'General Liability Insurance Certificate.pdf',
      type: 'Insurance',
      size: '320 KB',
      uploadedAt: '2026-02-12',
    },
    {
      id: 'doc3',
      name: 'Kitchen Floor Plan — Revised.pdf',
      type: 'Floor Plan',
      size: '2.1 MB',
      uploadedAt: '2026-02-10',
    },
    {
      id: 'doc4',
      name: 'Contractor License CON-2024-11287.pdf',
      type: 'License',
      size: '185 KB',
      uploadedAt: '2026-02-12',
    },
    {
      id: 'doc5',
      name: 'Noise Waiver — Signed.pdf',
      type: 'Waiver',
      size: '95 KB',
      uploadedAt: '2026-02-28',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  AlterationStatus,
  { variant: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'; label: string }
> = {
  submitted: { variant: 'default', label: 'Submitted' },
  approved: { variant: 'info', label: 'Approved' },
  in_progress: { variant: 'primary', label: 'In Progress' },
  inspection: { variant: 'warning', label: 'Inspection' },
  completed: { variant: 'success', label: 'Completed' },
  rejected: { variant: 'error', label: 'Rejected' },
};

const MOMENTUM_CONFIG: Record<
  MomentumLevel,
  { variant: 'success' | 'warning' | 'error' | 'default'; label: string; color: string }
> = {
  ok: { variant: 'success', label: 'OK', color: 'text-success-600' },
  slow: { variant: 'warning', label: 'Slow', color: 'text-warning-600' },
  stalled: { variant: 'error', label: 'Stalled', color: 'text-orange-600' },
  stopped: { variant: 'error', label: 'Stopped', color: 'text-error-600' },
};

function getTimelineIcon(action: string) {
  switch (action) {
    case 'submitted':
      return <FileText className="text-primary-600 h-3.5 w-3.5" />;
    case 'approved':
      return <CheckCircle2 className="text-success-600 h-3.5 w-3.5" />;
    case 'rejected':
      return <XCircle className="text-error-600 h-3.5 w-3.5" />;
    case 'permit':
      return <ClipboardCheck className="text-info-600 h-3.5 w-3.5" />;
    case 'started':
      return <Hammer className="text-warning-600 h-3.5 w-3.5" />;
    case 'update':
      return <Clock className="h-3.5 w-3.5 text-neutral-500" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-neutral-400" />;
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AlterationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AlterationDetailPage({ params }: AlterationDetailPageProps) {
  const { id } = use(params);

  const alt = { ...MOCK_ALTERATION, id };
  const statusCfg = STATUS_CONFIG[alt.status];
  const momentumCfg = MOMENTUM_CONFIG[alt.momentum];

  return (
    <PageShell
      title={alt.referenceNumber}
      description="Alteration / Renovation Request"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/alterations"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to alterations
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Alteration Details */}
          <Card>
            <CardHeader>
              <CardTitle>Alteration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Reference Number"
                  value={<span className="font-mono font-medium">{alt.referenceNumber}</span>}
                />
                <InfoRow label="Unit" value={`${alt.building} \u00B7 Unit ${alt.unit}`} />
                <InfoRow label="Resident" value={alt.resident} />
                <InfoRow
                  label="Type"
                  value={
                    <Badge variant="primary" size="lg">
                      {alt.type}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={statusCfg.variant} size="lg" dot>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Momentum"
                  value={
                    <Badge variant={momentumCfg.variant} size="lg" dot>
                      {momentumCfg.label}
                    </Badge>
                  }
                />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Description"
                    value={<p className="leading-relaxed text-neutral-700">{alt.description}</p>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Company Name"
                  value={<span className="font-medium">{alt.contractor.name}</span>}
                />
                <InfoRow
                  label="License Number"
                  value={<span className="font-mono">{alt.contractor.licenseNumber}</span>}
                />
                <InfoRow
                  label="Phone"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      {alt.contractor.phone}
                    </span>
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    <a
                      href={`mailto:${alt.contractor.email}`}
                      className="text-primary-600 inline-flex items-center gap-1 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {alt.contractor.email}
                    </a>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Permit & Insurance */}
          <Card>
            <CardHeader>
              <CardTitle>Permit &amp; Insurance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Has Permit"
                  value={
                    <Badge variant={alt.permit.hasPermit ? 'success' : 'error'} size="lg" dot>
                      {alt.permit.hasPermit ? 'Yes' : 'No'}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Permit Number"
                  value={<span className="font-mono">{alt.permit.permitNumber || '\u2014'}</span>}
                />
                <InfoRow
                  label="Has Insurance"
                  value={
                    <Badge variant={alt.insurance.hasInsurance ? 'success' : 'error'} size="lg" dot>
                      {alt.insurance.hasInsurance ? 'Yes' : 'No'}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Policy Number"
                  value={
                    <span className="font-mono">{alt.insurance.policyNumber || '\u2014'}</span>
                  }
                />
                <InfoRow
                  label="Insurance Expiry"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(alt.insurance.expiry).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                <div className="flex flex-col gap-4">
                  {alt.timeline.map((entry) => (
                    <div key={entry.id} className="relative flex gap-3">
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                        {getTimelineIcon(entry.action)}
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <p className="text-[13px] font-medium text-neutral-900">{entry.detail}</p>
                        <p className="text-[12px] text-neutral-400">
                          {new Date(entry.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' \u00B7 '}
                          {entry.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {alt.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                        <FileText className="text-primary-600 h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900">{doc.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          {doc.type} &middot; {doc.size} &middot;{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-neutral-400 transition-colors hover:text-neutral-600"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    statusCfg.variant === 'success'
                      ? 'bg-success-50'
                      : statusCfg.variant === 'primary'
                        ? 'bg-primary-50'
                        : statusCfg.variant === 'error'
                          ? 'bg-error-50'
                          : statusCfg.variant === 'warning'
                            ? 'bg-warning-50'
                            : statusCfg.variant === 'info'
                              ? 'bg-info-50'
                              : 'bg-neutral-100'
                  }`}
                >
                  <Hammer
                    className={`h-8 w-8 ${
                      statusCfg.variant === 'success'
                        ? 'text-success-600'
                        : statusCfg.variant === 'primary'
                          ? 'text-primary-600'
                          : statusCfg.variant === 'error'
                            ? 'text-error-600'
                            : statusCfg.variant === 'warning'
                              ? 'text-warning-600'
                              : statusCfg.variant === 'info'
                                ? 'text-info-600'
                                : 'text-neutral-400'
                    }`}
                  />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <Badge variant={momentumCfg.variant} size="lg" dot>
                  Momentum: {momentumCfg.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="danger" fullWidth>
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button variant="secondary" fullWidth>
                  <ClipboardCheck className="h-4 w-4" />
                  Schedule Inspection
                </Button>
                <Button variant="secondary" fullWidth>
                  <FileText className="h-4 w-4" />
                  Request Documents
                </Button>
                <Button variant="secondary" fullWidth>
                  <Shield className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Expected Start
                  </span>
                  <span className="text-[13px] text-neutral-700">
                    {new Date(alt.schedule.expectedStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Expected End
                  </span>
                  <span className="text-[13px] text-neutral-700">
                    {new Date(alt.schedule.expectedEnd).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Actual Start
                  </span>
                  <span className="text-[13px] text-neutral-700">
                    {new Date(alt.schedule.actualStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Elapsed Days
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {alt.schedule.elapsedDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Progress
                  </span>
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {alt.schedule.progressPercent}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-neutral-100">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${alt.schedule.progressPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Renovation Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Demolition', bg: 'bg-orange-50' },
                  { label: 'Plumbing', bg: 'bg-blue-50' },
                  { label: 'Electrical', bg: 'bg-yellow-50' },
                  { label: 'Progress', bg: 'bg-green-50' },
                ].map((photo) => (
                  <div
                    key={photo.label}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl border border-neutral-200 ${photo.bg}`}
                  >
                    <ImageIcon className="h-6 w-6 text-neutral-300" />
                    <span className="mt-1 text-[11px] text-neutral-400">{photo.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" fullWidth className="mt-3">
                <ImageIcon className="h-4 w-4" />
                Upload Photos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
