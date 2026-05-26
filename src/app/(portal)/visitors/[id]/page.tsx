'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Home,
  LogIn,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApi, apiRequest } from '@/lib/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AccessDeniedPanel } from '@/components/ui/access-denied-panel';

interface ParkingPermit {
  id: string;
  permitNumber?: string | null;
  spaceNumber?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

interface VisitorDetail {
  id: string;
  visitorName: string;
  visitorType:
    | 'visitor'
    | 'contractor'
    | 'delivery_person'
    | 'real_estate_agent'
    | 'emergency_service'
    | 'other';
  arrivalAt: string;
  departureAt: string | null;
  expectedDepartureAt: string | null;
  vehiclePlate?: string | null;
  idVerified?: boolean;
  notifyResident?: boolean;
  comments?: string | null;
  status: 'signed_in' | 'signed_out';
  durationMinutes: number | null;
  unit: { id: string; number: string } | null;
  visitorParkingPermit?: ParkingPermit | null;
}

const VISITOR_TYPE_LABELS: Record<VisitorDetail['visitorType'], string> = {
  visitor: 'Visitor',
  contractor: 'Contractor',
  delivery_person: 'Delivery',
  real_estate_agent: 'Realtor',
  emergency_service: 'Emergency Service',
  other: 'Other',
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export default function VisitorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const { data, loading, error, forbidden, refetch } = useApi<VisitorDetail>(
    id ? `/api/v1/visitors/${id}` : null,
  );

  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signOutComments, setSignOutComments] = useState('');
  // Native confirm() looked unfinished and blocked the page during
  // automated QA. Confirm dialog state machine instead.
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-[14px] text-neutral-400">Loading visitor…</div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <AccessDeniedPanel resource="Visitor records" whoCanSee="front desk and security staff" />
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="border-error-200 bg-error-50 flex items-start gap-3 rounded-2xl border p-6">
          <AlertCircle className="text-error-600 h-5 w-5 shrink-0" />
          <div className="flex flex-col gap-2">
            <p className="text-error-700 text-[15px] font-medium">
              We couldn&apos;t load this visitor.
            </p>
            <p className="text-error-600 text-[13px]">
              The visitor may have been removed, or you may not have permission to view it.
            </p>
            <Link
              href="/visitors"
              className="text-error-700 mt-1 inline-flex items-center gap-1 text-[13px] font-medium underline-offset-2 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to visitors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSignedIn = data.status === 'signed_in';

  // Open confirm dialog. The real sign-out work runs from
  // performSignOut() when the user clicks "Sign out" in the dialog.
  function handleSignOut() {
    if (!data) return;
    setConfirmingSignOut(true);
  }

  async function performSignOut() {
    if (!data) return;
    setConfirmingSignOut(false);
    setSigningOut(true);
    setSignOutError(null);
    try {
      const resp = await apiRequest(`/api/v1/visitors/${data.id}`, {
        method: 'PATCH',
        body: signOutComments.trim() ? { comments: signOutComments.trim() } : {},
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { message?: string };
        setSignOutError(body.message ?? 'Failed to sign out visitor.');
        return;
      }
      setSignOutComments('');
      await refetch();
    } catch {
      setSignOutError('An unexpected error occurred.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push('/visitors')}
          className="hover:text-primary-600 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to visitors
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-bold text-neutral-900">{data.visitorName}</h1>
              <Badge variant={isSignedIn ? 'success' : 'default'}>
                {isSignedIn ? 'Signed In' : 'Signed Out'}
              </Badge>
            </div>
            <p className="text-[14px] text-neutral-500">
              {VISITOR_TYPE_LABELS[data.visitorType] ?? data.visitorType}
              {data.unit ? ` · Visiting Unit ${data.unit.number}` : ''}
            </p>
          </div>

          {isSignedIn && (
            <Button onClick={handleSignOut} loading={signingOut} disabled={signingOut} size="sm">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>

      {signOutError && (
        <div
          role="alert"
          className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]"
        >
          {signOutError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: Visit Info */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Visit Information</h2>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailRow icon={User} label="Visitor Name" value={data.visitorName} />
                <DetailRow
                  icon={Home}
                  label="Unit"
                  value={data.unit ? data.unit.number : 'Not set'}
                />
                <DetailRow icon={LogIn} label="Arrived" value={formatDateTime(data.arrivalAt)} />
                <DetailRow
                  icon={Calendar}
                  label="Expected Departure"
                  value={formatDateTime(data.expectedDepartureAt)}
                />
                <DetailRow
                  icon={LogOut}
                  label="Signed Out"
                  value={data.departureAt ? formatDateTime(data.departureAt) : 'Still on site'}
                />
                <DetailRow
                  icon={Clock}
                  label="Duration"
                  value={data.durationMinutes != null ? formatDuration(data.durationMinutes) : '—'}
                />
                <DetailRow
                  icon={Car}
                  label="Vehicle Plate"
                  value={data.vehiclePlate || 'Not provided'}
                />
                <DetailRow
                  icon={ShieldCheck}
                  label="ID Verified"
                  value={data.idVerified ? 'Yes' : 'No'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Comments</h2>
            <CardContent>
              {data.comments ? (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-neutral-700">
                  {data.comments}
                </p>
              ) : (
                <p className="text-[14px] text-neutral-400 italic">No comments on file.</p>
              )}
            </CardContent>
          </Card>

          {isSignedIn && (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
                <MessageSquare className="h-4 w-4 text-neutral-400" /> Add a sign-out note
              </h2>
              <CardContent>
                <textarea
                  value={signOutComments}
                  onChange={(e) => setSignOutComments(e.target.value)}
                  placeholder="Optional — append a note when this visitor signs out."
                  maxLength={500}
                  className="focus:border-primary-500 focus:ring-primary-100 min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
                />
                <p className="mt-1 text-right text-[12px] text-neutral-400">
                  {signOutComments.length}/500
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Quick Status */}
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Status</h2>
            <CardContent>
              <div className="flex flex-col gap-3 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Status</span>
                  <Badge variant={isSignedIn ? 'success' : 'default'}>
                    {isSignedIn ? 'On site' : 'Departed'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Notify Resident</span>
                  <span className="font-medium text-neutral-900">
                    {data.notifyResident ? 'Yes' : 'No'}
                  </span>
                </div>
                {data.idVerified && (
                  <div className="text-success-700 flex items-center gap-1.5 text-[13px]">
                    <CheckCircle2 className="h-4 w-4" />
                    ID verified at sign-in
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {data.visitorParkingPermit && (
            <Card>
              <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Parking Permit</h2>
              <CardContent>
                <div className="flex flex-col gap-3 text-[14px]">
                  <DetailRow
                    icon={Car}
                    label="Permit #"
                    value={data.visitorParkingPermit.permitNumber || 'Not set'}
                  />
                  <DetailRow
                    icon={Home}
                    label="Space"
                    value={data.visitorParkingPermit.spaceNumber || 'Unassigned'}
                  />
                  <DetailRow
                    icon={Clock}
                    label="Valid Until"
                    value={formatDateTime(data.visitorParkingPermit.validUntil)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm dialog replaces native confirm() — looks consistent
          with the rest of the portal and doesn't block the page. */}
      <Dialog
        open={confirmingSignOut}
        onOpenChange={(open) => !open && setConfirmingSignOut(false)}
      >
        <DialogContent>
          <DialogTitle>Sign out {data?.visitorName ?? 'visitor'}?</DialogTitle>
          <DialogDescription>
            Their visit will be marked complete. Any comments you typed will be saved with the
            record.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmingSignOut(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={performSignOut}>
              Sign out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
        <Icon className="h-4 w-4 text-neutral-400" />
        {value}
      </p>
    </div>
  );
}
