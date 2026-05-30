'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  User,
  UserX,
  Users,
  XCircle,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineStep {
  id: string;
  status: string;
  label: string;
  timestamp: string | null;
  completed: boolean;
}

interface BookingFees {
  rental: number;
  securityDeposit: number;
  depositStatus: 'held' | 'released';
  total: number;
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed';
  paymentMethod: string;
  paidAt: string | null;
}

interface BookingAmenity {
  name: string;
  location: string;
  capacity: number;
  todayBookings: number;
}

type ApiBookingStatus =
  | 'pending'
  | 'approved'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'completed'
  | 'no_show';

interface BookingData {
  id: string;
  reference: string;
  status: ApiBookingStatus;
  amenity: BookingAmenity;
  date: string;
  timeStart: string;
  timeEnd: string;
  resident: string;
  unit: string;
  building: string;
  guests: number;
  purpose: string;
  createdAt: string;
  rules: string[];
  fees: BookingFees;
  timeline: TimelineStep[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: string): {
  variant: 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary';
  label: string;
} {
  switch (status) {
    case 'pending':
      return { variant: 'warning', label: 'Pending Approval' };
    case 'approved':
      return { variant: 'success', label: 'Approved' };
    case 'confirmed':
      return { variant: 'success', label: 'Confirmed' };
    case 'completed':
      return { variant: 'primary', label: 'Completed' };
    case 'declined':
      return { variant: 'error', label: 'Declined' };
    case 'cancelled':
      return { variant: 'default', label: 'Cancelled' };
    case 'no_show':
      return { variant: 'error', label: 'No-show' };
    default:
      return { variant: 'default', label: status };
  }
}

function getPaymentVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'refunded':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function BookingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

// The API returns the raw Prisma row (snake_case fields like startDate,
// startTime, guestCount, referenceNumber, plus nested unit/amenity objects).
// This page was written against an aspirational normalized shape — keep the
// shape it expects, but build it from what we actually have. Missing data
// becomes safe defaults rather than crashing the page.
interface RawBooking {
  id: string;
  referenceNumber?: string | null;
  status: string;
  startDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  guestCount?: number | null;
  requestorComments?: string | null;
  createdAt?: string | null;
  feeAmount?: number | null;
  depositAmount?: number | null;
  totalAmount?: number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentReceivedAt?: string | null;
  depositRefunded?: boolean | null;
  amenity?: {
    id: string;
    name: string;
    description?: string | null;
    maxConcurrent?: number | null;
  } | null;
  unit?: { id: string; number: string } | null;
}

function normalizeBooking(raw: RawBooking | null | undefined): BookingData | null {
  if (!raw) return null;
  // Prisma stores Time columns as full ISO datetimes anchored at 1970-01-01,
  // so we extract just the time of day in 12-hour format. Fall back to the
  // raw value if parsing fails so the page never crashes on malformed data.
  const fmtTime = (t?: string | null): string => {
    if (!t) return '—';
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return t.slice(0, 5);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };
  const residentLabel = raw.unit?.number ? `Resident in Unit ${raw.unit.number}` : 'Resident';
  return {
    id: raw.id,
    reference: raw.referenceNumber ?? raw.id.slice(0, 8).toUpperCase(),
    status: raw.status as ApiBookingStatus,
    amenity: {
      name: raw.amenity?.name ?? 'Amenity',
      location: raw.amenity?.description ?? '',
      capacity: raw.amenity?.maxConcurrent ?? 0,
      todayBookings: 0,
    },
    date: raw.startDate ?? new Date().toISOString(),
    timeStart: fmtTime(raw.startTime),
    timeEnd: fmtTime(raw.endTime),
    resident: residentLabel,
    unit: raw.unit?.number ?? '—',
    building: 'Building',
    guests: raw.guestCount ?? 0,
    purpose: raw.requestorComments ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    rules: [],
    fees: {
      rental: Number(raw.feeAmount ?? 0),
      securityDeposit: Number(raw.depositAmount ?? 0),
      depositStatus: raw.depositRefunded ? 'released' : 'held',
      total: Number(raw.totalAmount ?? 0),
      paymentStatus: (raw.paymentStatus ?? 'pending') as BookingFees['paymentStatus'],
      paymentMethod: raw.paymentMethod ?? '—',
      paidAt: raw.paymentReceivedAt ?? null,
    },
    timeline: [],
  };
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const { confirm, flash, ConfirmHost } = useConfirmDialog();
  const [saving, setSaving] = useState(false);

  const {
    data: rawBooking,
    loading,
    error,
    refetch,
  } = useApi<RawBooking>(apiUrl(`/api/v1/bookings/${id}`, { propertyId: getPropertyId() }));

  const booking = normalizeBooking(rawBooking);

  async function patchStatus(
    nextStatus: 'approved' | 'declined' | 'cancelled' | 'completed' | 'no_show',
    successMessage: string,
  ) {
    setSaving(true);
    try {
      const res = await apiRequest(`/api/v1/bookings/${id}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        flash('err', data?.message ?? 'Could not update booking. Try again.');
        return;
      }
      flash('ok', successMessage);
      refetch();
    } catch {
      flash('err', 'Network error. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <BookingSkeleton />;

  if (error || !booking) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/amenities"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to amenities
        </Link>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertTriangle className="text-error-500 h-12 w-12" />
          <h1 className="text-[24px] font-bold text-neutral-900">
            {error ? 'Error loading booking' : 'Booking not found'}
          </h1>
          <p className="text-[14px] text-neutral-500">
            {error || 'The booking you are looking for does not exist.'}
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const bookingDate = new Date(booking.date);
  const timeline = booking.timeline ?? [];
  const rules = booking.rules ?? [];
  const fees = booking.fees;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/amenities"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to amenities
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Booking #{booking.reference}
            </h1>
            <Badge variant={statusConfig.variant} size="lg" dot>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled
            title="Resident messaging is coming with the in-app messaging release."
          >
            <MessageSquare className="h-4 w-4" />
            Message Resident
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Booking Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Booking Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Amenity
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {booking.amenity?.name ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Date
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {bookingDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Slot
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {booking.timeStart} &ndash; {booking.timeEnd}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Resident
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-neutral-900">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    {booking.resident}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {booking.building} &middot; Unit {booking.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Guests
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Users className="h-3.5 w-3.5 text-neutral-400" />
                    {booking.guests} guests
                  </p>
                </div>
                {booking.purpose && (
                  <div className="col-span-2">
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Purpose / Notes
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                      {booking.purpose}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {timeline.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Status Timeline</h2>
              </div>
              <CardContent>
                <div className="relative flex items-start justify-between">
                  <div className="absolute top-4 right-8 left-8 h-0.5 bg-neutral-200" />
                  <div
                    className="bg-primary-500 absolute top-4 left-8 h-0.5 transition-all"
                    style={{
                      width: `${((timeline.filter((t) => t.completed).length - 1) / (timeline.length - 1)) * 100}%`,
                    }}
                  />
                  {timeline.map((step) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          step.completed
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-neutral-300 bg-white text-neutral-400'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <p
                        className={`text-center text-[12px] font-medium ${
                          step.completed ? 'text-neutral-900' : 'text-neutral-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.timestamp && (
                        <p className="text-[11px] text-neutral-400">
                          {new Date(step.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules Acknowledgment */}
          {rules.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Rules Acknowledged</h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                    >
                      <CheckCircle2 className="text-success-600 mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-[13px] text-neutral-700">{rule}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee Summary */}
          {fees && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Fee Summary</h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-neutral-600">Rental Fee</span>
                    <span className="text-[14px] font-medium text-neutral-900">
                      ${(fees.rental ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-neutral-600">Security Deposit</span>
                      <Badge
                        variant={fees.depositStatus === 'held' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {fees.depositStatus === 'held' ? 'Held' : 'Released'}
                      </Badge>
                    </div>
                    <span className="text-[14px] font-medium text-neutral-900">
                      ${(fees.securityDeposit ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-neutral-900">Total</span>
                      <span className="text-[15px] font-bold text-neutral-900">
                        ${(fees.total ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {fees.paymentMethod && (
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-[13px] text-neutral-600">{fees.paymentMethod}</span>
                      </div>
                      <Badge variant={getPaymentVariant(fees.paymentStatus)} size="md" dot>
                        {fees.paymentStatus.charAt(0).toUpperCase() + fees.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <div className="flex flex-col items-center py-2">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  booking.status === 'approved' ||
                  booking.status === 'confirmed' ||
                  booking.status === 'completed'
                    ? 'bg-success-50'
                    : booking.status === 'pending'
                      ? 'bg-warning-50'
                      : booking.status === 'cancelled' ||
                          booking.status === 'declined' ||
                          booking.status === 'no_show'
                        ? 'bg-error-50'
                        : 'bg-neutral-50'
                }`}
              >
                {booking.status === 'approved' || booking.status === 'completed' ? (
                  <CheckCircle2 className="text-success-600 h-7 w-7" />
                ) : booking.status === 'cancelled' ||
                  booking.status === 'declined' ||
                  booking.status === 'no_show' ? (
                  <XCircle className="text-error-600 h-7 w-7" />
                ) : (
                  <Clock className="text-warning-600 h-7 w-7" />
                )}
              </div>
              <Badge variant={statusConfig.variant} size="lg" dot className="mt-3">
                {statusConfig.label}
              </Badge>
              <p className="mt-2 text-[12px] text-neutral-400">
                Booked on{' '}
                {new Date(booking.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </Card>

          {/* Actions */}
          {(booking.status === 'pending' ||
            booking.status === 'approved' ||
            booking.status === 'confirmed') && (
            <Card>
              <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        fullWidth
                        size="lg"
                        disabled={saving}
                        onClick={() =>
                          confirm({
                            title: `Approve ${booking.resident}'s booking?`,
                            body: `${booking.amenity?.name ?? 'Amenity'} on ${new Date(
                              booking.date,
                            ).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}, ${booking.timeStart}–${booking.timeEnd}. They'll get a confirmation email immediately.`,
                            confirmLabel: 'Approve booking',
                            run: () => patchStatus('approved', 'Booking approved.'),
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        fullWidth
                        disabled={saving}
                        onClick={() =>
                          confirm({
                            title: `Decline ${booking.resident}'s booking?`,
                            body: `${booking.amenity?.name ?? 'Amenity'} on ${new Date(
                              booking.date,
                            ).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}, ${booking.timeStart}–${booking.timeEnd}. They'll get a decline notification.`,
                            confirmLabel: 'Decline booking',
                            destructive: true,
                            run: () => patchStatus('declined', 'Booking declined.'),
                          })
                        }
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </Button>
                    </>
                  )}
                  {(booking.status === 'approved' || booking.status === 'confirmed') && (
                    <>
                      <Button
                        fullWidth
                        size="lg"
                        disabled={saving}
                        onClick={() =>
                          confirm({
                            title: 'Mark booking as completed?',
                            body: `${booking.resident}'s booking for ${
                              booking.amenity?.name ?? 'the amenity'
                            } on ${new Date(booking.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                            })}, ${booking.timeStart}–${booking.timeEnd}.`,
                            confirmLabel: 'Mark completed',
                            run: () => patchStatus('completed', 'Booking marked completed.'),
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark completed
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        disabled={saving}
                        onClick={() =>
                          confirm({
                            title: 'Mark resident as no-show?',
                            body: `${booking.resident} did not show up for their ${
                              booking.amenity?.name ?? 'amenity'
                            } booking on ${new Date(booking.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                            })}. This counts toward their no-show history.`,
                            confirmLabel: 'Mark no-show',
                            destructive: true,
                            run: () => patchStatus('no_show', 'Booking marked as no-show.'),
                          })
                        }
                      >
                        <UserX className="h-4 w-4" />
                        Mark no-show
                      </Button>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={saving}
                    onClick={() =>
                      confirm({
                        title: 'Cancel this booking?',
                        body: `${booking.amenity?.name ?? 'Amenity'} on ${new Date(
                          booking.date,
                        ).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}, ${booking.timeStart}–${booking.timeEnd}. ${booking.resident} will be notified.`,
                        confirmLabel: 'Cancel booking',
                        cancelLabel: 'Keep booking',
                        destructive: true,
                        run: () => patchStatus('cancelled', 'Booking cancelled.'),
                      })
                    }
                  >
                    <Ban className="h-4 w-4" />
                    Cancel booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amenity Info */}
          {booking.amenity && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Amenity Info</h2>
              </div>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Name
                    </span>
                    <span className="text-[13px] font-medium text-neutral-900">
                      {booking.amenity.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Location
                    </span>
                    <span className="text-[13px] text-neutral-700">{booking.amenity.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Capacity
                    </span>
                    <span className="text-[13px] text-neutral-700">{booking.amenity.capacity}</span>
                  </div>
                  {booking.amenity.todayBookings != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Bookings Today
                      </span>
                      <Badge variant="info" size="md">
                        {booking.amenity.todayBookings} bookings
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ConfirmHost />
    </div>
  );
}
