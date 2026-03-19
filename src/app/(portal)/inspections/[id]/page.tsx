'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Printer,
  CalendarPlus,
  ClipboardCheck,
  MapPin,
  AlertTriangle,
  Camera,
  Link2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InspectionType =
  | 'fire_safety'
  | 'elevator'
  | 'plumbing'
  | 'electrical'
  | 'structural'
  | 'general'
  | 'move_in'
  | 'move_out';
type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'overdue';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type ChecklistResult = 'pass' | 'fail' | 'na';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  result: ChecklistResult;
  notes: string;
}

interface Finding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  hasPhoto: boolean;
}

interface InspectionDetail {
  id: string;
  title: string;
  type: InspectionType;
  status: InspectionStatus;
  priority: Priority;
  inspector: string;
  location: string;
  scheduledDate: string;
  completedItems: number;
  totalItems: number;
  checklist: ChecklistItem[];
  findings: Finding[];
  gpsLatitude: string;
  gpsLongitude: string;
  gpsTimestamp: string;
  linkedEquipment: string;
  linkedMaintenanceRequest: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_INSPECTION: InspectionDetail = {
  id: '1',
  title: 'Annual Fire Safety Inspection',
  type: 'fire_safety',
  status: 'in_progress',
  priority: 'critical',
  inspector: 'Fire Marshal Rodriguez',
  location: 'All Floors (1-25)',
  scheduledDate: '2026-03-25T09:00:00',
  completedItems: 12,
  totalItems: 15,
  checklist: [
    {
      id: 'c1',
      text: 'Fire alarm panel operational',
      checked: true,
      result: 'pass',
      notes: 'Panel tested — all zones responsive.',
    },
    {
      id: 'c2',
      text: 'Sprinkler system pressure within range',
      checked: true,
      result: 'pass',
      notes: 'Pressure at 155 PSI (normal range 150-175).',
    },
    { id: 'c3', text: 'Emergency lighting functional', checked: true, result: 'pass', notes: '' },
    {
      id: 'c4',
      text: 'Fire extinguishers inspected and tagged',
      checked: true,
      result: 'fail',
      notes: 'Floor 14 extinguisher past inspection date. Replacement ordered.',
    },
    {
      id: 'c5',
      text: 'Exit signs illuminated and visible',
      checked: true,
      result: 'pass',
      notes: '',
    },
    {
      id: 'c6',
      text: 'Stairwell doors self-closing properly',
      checked: true,
      result: 'pass',
      notes: 'All stairwell doors A, B, C tested.',
    },
    {
      id: 'c7',
      text: 'Fire escape routes clear of obstructions',
      checked: true,
      result: 'fail',
      notes: 'Storage boxes found in Floor 8 stairwell. Removed during inspection.',
    },
    {
      id: 'c8',
      text: 'Smoke detectors in common areas tested',
      checked: true,
      result: 'pass',
      notes: 'All 48 common-area detectors passed.',
    },
    {
      id: 'c9',
      text: 'Fire pump operational and tested',
      checked: true,
      result: 'pass',
      notes: 'Weekly test log reviewed — all clear.',
    },
    {
      id: 'c10',
      text: 'Standpipe connections accessible',
      checked: true,
      result: 'pass',
      notes: '',
    },
    {
      id: 'c11',
      text: 'Kitchen hood suppression system checked',
      checked: true,
      result: 'na',
      notes: 'N/A — no commercial kitchen.',
    },
    {
      id: 'c12',
      text: 'Fire safety plan posted on every floor',
      checked: true,
      result: 'pass',
      notes: '',
    },
    {
      id: 'c13',
      text: 'Generator fuel level and auto-start test',
      checked: false,
      result: 'pass',
      notes: '',
    },
    {
      id: 'c14',
      text: 'Fire department access keys in Knox Box',
      checked: false,
      result: 'pass',
      notes: '',
    },
    { id: 'c15', text: 'Annual fire drill completed', checked: false, result: 'pass', notes: '' },
  ],
  findings: [
    {
      severity: 'high',
      description:
        'Floor 14 fire extinguisher past inspection date — replacement ordered from FireTech Supply.',
      hasPhoto: true,
    },
    {
      severity: 'medium',
      description:
        'Storage boxes obstructing stairwell exit on Floor 8. Items removed during inspection.',
      hasPhoto: true,
    },
    {
      severity: 'low',
      description:
        'Minor rust on standpipe connection cap at Floor 3. Functional but should be replaced at next maintenance cycle.',
      hasPhoto: false,
    },
  ],
  gpsLatitude: '43.6532',
  gpsLongitude: '-79.3832',
  gpsTimestamp: '2026-03-25T09:15:00',
  linkedEquipment: 'Fire Alarm Panel — Honeywell Silent Knight 6820',
  linkedMaintenanceRequest: 'MR-2026-0412 — Replace Floor 14 extinguisher',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<InspectionType, string> = {
  fire_safety: 'Fire Safety',
  elevator: 'Elevator',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  structural: 'Structural',
  general: 'General',
  move_in: 'Move-In',
  move_out: 'Move-Out',
};

const TYPE_BADGE_VARIANT: Record<
  InspectionType,
  'primary' | 'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  fire_safety: 'error',
  elevator: 'warning',
  plumbing: 'info',
  electrical: 'warning',
  structural: 'primary',
  general: 'default',
  move_in: 'success',
  move_out: 'info',
};

const STATUS_LABELS: Record<InspectionStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  overdue: 'Overdue',
};

const STATUS_BADGE_VARIANT: Record<
  InspectionStatus,
  'primary' | 'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  failed: 'error',
  overdue: 'error',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const PRIORITY_BADGE_VARIANT: Record<Priority, 'default' | 'info' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

const RESULT_CONFIG: Record<
  ChecklistResult,
  { label: string; variant: 'success' | 'error' | 'default' }
> = {
  pass: { label: 'Pass', variant: 'success' },
  fail: { label: 'Fail', variant: 'error' },
  na: { label: 'N/A', variant: 'default' },
};

const SEVERITY_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const _id = params.id as string;

  // In production this would fetch by id
  const inspection = MOCK_INSPECTION;
  const progressPercent = Math.round((inspection.completedItems / inspection.totalItems) * 100);

  return (
    <PageShell
      title={inspection.title}
      description={`Inspection scheduled for ${formatDate(inspection.scheduledDate)}`}
      actions={
        <Button variant="secondary" size="sm" onClick={() => router.push('/inspections')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Inspections
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT COLUMN (2/3) */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Inspection Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Title
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-neutral-900">
                    {inspection.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Type
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={TYPE_BADGE_VARIANT[inspection.type]}>
                      {TYPE_LABELS[inspection.type]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Priority
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={PRIORITY_BADGE_VARIANT[inspection.priority]} dot>
                      {PRIORITY_LABELS[inspection.priority]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Inspector
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{inspection.inspector}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{inspection.location}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Scheduled Date
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">
                    {formatDateTime(inspection.scheduledDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={STATUS_BADGE_VARIANT[inspection.status]} dot>
                      {STATUS_LABELS[inspection.status]}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
              <Badge variant="info" size="sm">
                {inspection.completedItems}/{inspection.totalItems} completed
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {inspection.checklist.map((item) => {
                  const resultCfg = RESULT_CONFIG[item.result];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-neutral-100 px-4 py-3 transition-colors hover:bg-neutral-50/50"
                    >
                      {/* Checkbox */}
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                        {item.checked ? (
                          <CheckCircle2 className="text-success-500 h-5 w-5" />
                        ) : (
                          <div className="h-4 w-4 rounded border-2 border-neutral-300" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1">
                        <p
                          className={`text-[14px] ${item.checked ? 'text-neutral-900' : 'text-neutral-500'}`}
                        >
                          {item.text}
                        </p>
                        {item.notes && (
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      {/* Result badge */}
                      <Badge variant={resultCfg.variant} size="sm">
                        {resultCfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Findings */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Findings</CardTitle>
              <Badge variant={inspection.findings.length > 0 ? 'warning' : 'success'} size="sm">
                {inspection.findings.length}{' '}
                {inspection.findings.length === 1 ? 'finding' : 'findings'}
              </Badge>
            </CardHeader>
            <CardContent>
              {inspection.findings.length === 0 ? (
                <p className="text-[13px] text-neutral-500">No findings recorded.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {inspection.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-neutral-100 px-4 py-3"
                    >
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          finding.severity === 'critical' || finding.severity === 'high'
                            ? 'text-error-500'
                            : finding.severity === 'medium'
                              ? 'text-warning-500'
                              : 'text-neutral-400'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant={SEVERITY_VARIANT[finding.severity]} size="sm">
                            {finding.severity}
                          </Badge>
                          {finding.hasPhoto && (
                            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                              <Camera className="h-3 w-3" />
                              Photo attached
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-relaxed text-neutral-700">
                          {finding.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* GPS Verification */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>GPS Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Latitude
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="font-mono text-[14px] text-neutral-900">
                      {inspection.gpsLatitude}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Longitude
                  </dt>
                  <dd className="mt-1 font-mono text-[14px] text-neutral-900">
                    {inspection.gpsLongitude}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Timestamp
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">
                    {formatDateTime(inspection.gpsTimestamp)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT COLUMN (1/3) */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-6">
          {/* Status + Progress */}
          <Card padding="md" className="flex flex-col items-center gap-4 text-center">
            <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
              Progress
            </p>
            <Badge variant={STATUS_BADGE_VARIANT[inspection.status]} size="lg" dot>
              {STATUS_LABELS[inspection.status]}
            </Badge>
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-[12px] text-neutral-500">
                <span>
                  {inspection.completedItems} of {inspection.totalItems} items
                </span>
                <span className="font-semibold text-neutral-900">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPercent === 100
                      ? 'bg-success-500'
                      : progressPercent >= 50
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="sm" fullWidth>
                  <Play className="h-4 w-4" />
                  Start Inspection
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Related Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Linked Equipment
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-primary-600 text-[13px]">
                      {inspection.linkedEquipment}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Linked Maintenance Request
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-primary-600 text-[13px]">
                      {inspection.linkedMaintenanceRequest}
                    </span>
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
