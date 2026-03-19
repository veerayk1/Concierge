'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
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
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlterationData {
  id: string;
  referenceNumber?: string;
  description?: string;
  type?: string;
  status: string;
  momentum?: string;
  unit?: { id: string; number: string } | null;
  contractorName?: string | null;
  contractorPhone?: string | null;
  contractorEmail?: string | null;
  hasPermit?: boolean;
  permitNumber?: string | null;
  hasInsurance?: boolean;
  insurancePolicyNumber?: string | null;
  insuranceExpiry?: string | null;
  expectedStartDate?: string | null;
  expectedEndDate?: string | null;
  actualStartDate?: string | null;
  actualCompletionDate?: string | null;
  lastActivityDate?: string | null;
  requiredDocuments?: Array<{ type: string; uploaded: boolean }>;
  timeline?: Array<{
    id: string;
    type: string;
    fromStatus: string;
    toStatus: string;
    reason: string | null;
    timestamp: string;
    userId: string;
  }>;
  documents?: Array<{ id: string; documentType: string; filePath: string; createdAt: string }>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'; label: string }
> = {
  submitted: { variant: 'default', label: 'Submitted' },
  pending_review: { variant: 'default', label: 'Pending Review' },
  approved: { variant: 'info', label: 'Approved' },
  in_progress: { variant: 'primary', label: 'In Progress' },
  inspection: { variant: 'warning', label: 'Inspection' },
  completed: { variant: 'success', label: 'Completed' },
  rejected: { variant: 'error', label: 'Rejected' },
  declined: { variant: 'error', label: 'Declined' },
};

const MOMENTUM_CONFIG: Record<
  string,
  { variant: 'success' | 'warning' | 'error' | 'default'; label: string }
> = {
  ok: { variant: 'success', label: 'OK' },
  slow: { variant: 'warning', label: 'Slow' },
  stalled: { variant: 'error', label: 'Stalled' },
  stopped: { variant: 'error', label: 'Stopped' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function AlterationSkeleton() {
  return (
    <PageShell title="" description="Alteration / Renovation Request">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlterationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [alt, setAlt] = useState<AlterationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchAlteration() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/alterations/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch alteration (${res.status})`);
        const json = await res.json();
        setAlt(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAlteration();
  }, [id]);

  if (loading) return <AlterationSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Hammer className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Alteration not found</h1>
        <p className="text-[14px] text-neutral-500">
          The alteration project you are looking for does not exist.
        </p>
        <Link href="/alterations">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to alterations
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading alteration</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href="/alterations">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to alterations
          </Button>
        </Link>
      </div>
    );
  }

  if (!alt) return null;

  const statusCfg = STATUS_CONFIG[alt.status] ?? {
    variant: 'default' as const,
    label: 'Submitted',
  };
  const momentumCfg = MOMENTUM_CONFIG[alt.momentum || 'stopped'] ?? {
    variant: 'error' as const,
    label: 'Stopped',
  };
  const timeline = alt.timeline || [];
  const documents = alt.documents || [];
  const refNumber = alt.referenceNumber || `ALT-${alt.id.slice(0, 8)}`;

  return (
    <PageShell
      title={refNumber}
      description="Alteration / Renovation Request"
      actions={
        <Button variant="secondary" size="sm">
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      }
    >
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
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Alteration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  label="Reference Number"
                  value={<span className="font-mono font-medium">{refNumber}</span>}
                />
                {alt.unit && <InfoRow label="Unit" value={`Unit ${alt.unit.number}`} />}
                {alt.type && (
                  <InfoRow
                    label="Type"
                    value={
                      <Badge variant="primary" size="lg">
                        {alt.type}
                      </Badge>
                    }
                  />
                )}
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
                {alt.description && (
                  <div className="sm:col-span-2">
                    <InfoRow
                      label="Description"
                      value={<p className="leading-relaxed text-neutral-700">{alt.description}</p>}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contractor */}
          {alt.contractorName && (
            <Card>
              <CardHeader>
                <CardTitle>Contractor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <InfoRow
                    label="Company Name"
                    value={<span className="font-medium">{alt.contractorName}</span>}
                  />
                  {alt.contractorPhone && (
                    <InfoRow
                      label="Phone"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          {alt.contractorPhone}
                        </span>
                      }
                    />
                  )}
                  {alt.contractorEmail && (
                    <InfoRow
                      label="Email"
                      value={
                        <a
                          href={`mailto:${alt.contractorEmail}`}
                          className="text-primary-600 inline-flex items-center gap-1 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {alt.contractorEmail}
                        </a>
                      }
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <Badge variant={alt.hasPermit ? 'success' : 'error'} size="lg" dot>
                      {alt.hasPermit ? 'Yes' : 'No'}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Permit Number"
                  value={<span className="font-mono">{alt.permitNumber || '\u2014'}</span>}
                />
                <InfoRow
                  label="Has Insurance"
                  value={
                    <Badge variant={alt.hasInsurance ? 'success' : 'error'} size="lg" dot>
                      {alt.hasInsurance ? 'Yes' : 'No'}
                    </Badge>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute top-2 bottom-2 left-[11px] w-px bg-neutral-200" />
                  <div className="flex flex-col gap-4">
                    {timeline.map((entry) => (
                      <div key={entry.id} className="relative flex gap-3">
                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100">
                          <Clock className="h-3.5 w-3.5 text-neutral-500" />
                        </div>
                        <div className="flex flex-col gap-0.5 pt-0.5">
                          <p className="text-[13px] font-medium text-neutral-900">
                            {entry.fromStatus} &rarr; {entry.toStatus}
                            {entry.reason ? ` \u2014 ${entry.reason}` : ''}
                          </p>
                          <p className="text-[12px] text-neutral-400">
                            {new Date(entry.timestamp).toLocaleString('en-US', {
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                          <FileText className="text-primary-600 h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-neutral-900">
                            {doc.documentType}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {new Date(doc.createdAt).toLocaleDateString('en-US', {
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
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
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
                {alt.expectedStartDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Expected Start
                    </span>
                    <span className="text-[13px] text-neutral-700">
                      {new Date(alt.expectedStartDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {alt.expectedEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Expected End
                    </span>
                    <span className="text-[13px] text-neutral-700">
                      {new Date(alt.expectedEndDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {alt.actualStartDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Actual Start
                    </span>
                    <span className="text-[13px] text-neutral-700">
                      {new Date(alt.actualStartDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
