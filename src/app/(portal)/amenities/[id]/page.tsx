'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  MapPin,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EditAmenityDialog } from '@/components/forms/edit-amenity-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiBooking {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: string;
  guestCount: number;
  unit?: { id: string; number: string } | string;
}

interface Booking {
  id: string;
  resident: string;
  unit: string | { id: string; number: string };
  date: string;
  timeSlot: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'approved';
}

interface DayAvailability {
  day: string;
  slots: string[];
  booked: boolean[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AmenityDetail {
  id: string;
  name: string;
  category?: string;
  location?: string;
  capacity?: number;
  maxConcurrent?: number;
  description?: string;
  hours?: string;
  rules?: string[];
  fee?: number;
  securityDeposit?: number;
  availableNow?: boolean;
  requiresApproval?: boolean;
  approvalMode?: string;
  upcomingBookings?: Booking[];
  bookings?: ApiBooking[];
  weekAvailability?: DayAvailability[];
  group?: { id: string; name: string };
}

/** Map raw API bookings to the display shape */
function mapBookings(raw: ApiBooking[]): Booking[] {
  return raw.map((b) => {
    const startDate = b.startDate ? new Date(b.startDate) : null;
    const startTime = b.startTime ? new Date(b.startTime) : null;
    const endTime = b.endTime ? new Date(b.endTime) : null;
    const timeSlot =
      startTime && endTime
        ? `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : '—';
    return {
      id: b.id,
      resident: b.guestCount ? `${b.guestCount} guests` : 'Resident',
      unit: b.unit ?? '—',
      date: startDate ? startDate.toISOString() : '',
      timeSlot,
      status: b.status as Booking['status'],
    };
  });
}

const statusVariants: Record<string, 'success' | 'warning' | 'error'> = {
  confirmed: 'success',
  approved: 'success',
  pending: 'warning',
  cancelled: 'error',
  rejected: 'error',
};

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function AmenityDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-28 rounded bg-neutral-200" />
        <div className="h-8 w-48 rounded bg-neutral-200" />
        <div className="h-4 w-40 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="h-48 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
          <div className="h-40 rounded-xl bg-neutral-100" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-40 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AmenityDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: amenity,
    loading,
    error,
    refetch,
  } = useApi<AmenityDetail>(apiUrl(`/api/v1/amenities/${id}`, { propertyId: getPropertyId() }));

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  async function handleBookingAction(
    bookingId: string,
    status: 'confirmed' | 'rejected' | 'cancelled',
  ) {
    const labels: Record<string, string> = {
      confirmed: 'accept',
      rejected: 'reject',
      cancelled: 'cancel',
    };
    if (!confirm(`Are you sure you want to ${labels[status]} this booking?`)) return;

    setActionLoading(bookingId);
    try {
      const resp = await apiRequest(`/api/v1/bookings/${bookingId}`, {
        method: 'PATCH',
        body: { status },
      });
      if (!resp.ok) {
        const result = await resp.json().catch(() => ({}));
        alert(result.message || `Failed to ${labels[status]} booking.`);
      } else {
        await refetch();
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  // -- Loading State --
  if (loading) {
    return <AmenityDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Amenity Not Found' : 'Failed to Load Amenity'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/amenities">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to amenities
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!amenity) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Calendar className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Amenity Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The amenity you are looking for does not exist or has been removed.
        </p>
        <Link href="/amenities">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to amenities
          </Button>
        </Link>
      </div>
    );
  }

  // API returns "bookings" from Prisma include; map to display shape
  const rawBookings: ApiBooking[] = amenity.bookings ?? [];
  const bookings: Booking[] = amenity.upcomingBookings ?? mapBookings(rawBookings);
  const weekAvailability = amenity.weekAvailability ?? [];
  const rules = amenity.rules ?? [];
  const hasBookings = bookings.length > 0;
  const category = amenity.category ?? amenity.group?.name ?? '';

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
            <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">
              {amenity.name}
            </h1>
            <Badge variant={!hasBookings ? 'success' : 'default'} size="lg" dot>
              {!hasBookings ? 'Available' : 'Booked'}
            </Badge>
            {(amenity.requiresApproval || amenity.approvalMode === 'manual') && (
              <Badge variant="info" size="lg">
                Approval Required
              </Badge>
            )}
          </div>
          <p className="text-[14px] text-neutral-500">
            {category} {amenity.location ? `· ${amenity.location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="h-4 w-4" />
            Edit Amenity
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
            <DollarSign className="h-4 w-4" />
            Set Rates
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
            <FileText className="h-4 w-4" />
            Manage Rules
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-error-600"
            onClick={async () => {
              if (!confirm('Are you sure you want to disable bookings for this amenity?')) return;
              try {
                const resp = await apiRequest(`/api/v1/amenities/${id}`, {
                  method: 'PATCH',
                  body: { isActive: false },
                });
                if (resp.ok) {
                  await refetch();
                } else {
                  const result = await resp.json().catch(() => ({}));
                  alert((result as { message?: string }).message || 'Failed to disable bookings.');
                }
              } catch {
                alert('Network error. Please try again.');
              }
            }}
          >
            <Ban className="h-4 w-4" />
            Disable Bookings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Amenity Info */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Amenity Information</h2>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Name
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{amenity.name}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Location
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {amenity.location}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Capacity
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Users className="h-4 w-4 text-neutral-400" />
                    {amenity.capacity ?? amenity.maxConcurrent ?? '—'} people
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Hours
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    {amenity.hours}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Fee
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {amenity.fee === 0 ? 'Free' : `$${amenity.fee}/booking`}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Security Deposit
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {amenity.securityDeposit === 0 ? 'None' : `$${amenity.securityDeposit}`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {amenity.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Upcoming Bookings ({bookings.length})
                </h2>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Booking
              </Button>
            </div>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Date
                        </th>
                        <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Time Slot
                        </th>
                        <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Resident
                        </th>
                        <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Unit
                        </th>
                        <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Status
                        </th>
                        <th className="pb-3 text-right text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-neutral-50 last:border-0">
                          <td className="py-3 text-[14px] text-neutral-900">
                            {new Date(b.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-3 text-[14px] text-neutral-600">{b.timeSlot}</td>
                          <td className="py-3 text-[14px] font-medium text-neutral-900">
                            {b.resident}
                          </td>
                          <td className="py-3 text-[14px] text-neutral-600">
                            {typeof b.unit === 'object' && b.unit !== null
                              ? (b.unit as Record<string, string>).number
                              : b.unit || '—'}
                          </td>
                          <td className="py-3">
                            <Badge variant={statusVariants[b.status] ?? 'default'} size="sm" dot>
                              {b.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            {b.status === 'pending' && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading === b.id}
                                  onClick={() => handleBookingAction(b.id, 'confirmed')}
                                >
                                  <Check className="text-success-600 h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading === b.id}
                                  onClick={() => handleBookingAction(b.id, 'rejected')}
                                >
                                  <X className="text-error-600 h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            {b.status === 'confirmed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error-600"
                                disabled={actionLoading === b.id}
                                onClick={() => handleBookingAction(b.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No upcoming bookings.</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Availability */}
          {weekAvailability.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">Weekly Availability</h2>
              </div>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                          Day
                        </th>
                        {(weekAvailability[0]?.slots ?? []).map((slot) => (
                          <th
                            key={slot}
                            className="pb-3 text-center text-[12px] font-medium tracking-wide text-neutral-400 uppercase"
                          >
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weekAvailability.map((day) => (
                        <tr key={day.day} className="border-b border-neutral-50 last:border-0">
                          <td className="py-2.5 text-[14px] font-medium text-neutral-900">
                            {day.day}
                          </td>
                          {day.booked.map((isBooked, i) => (
                            <td key={i} className="py-2.5 text-center">
                              <span
                                className={`inline-flex h-8 w-full max-w-[80px] items-center justify-center rounded-lg text-[12px] font-medium ${
                                  isBooked
                                    ? 'bg-error-50 text-error-600'
                                    : 'bg-success-50 text-success-600'
                                }`}
                              >
                                {isBooked ? 'Booked' : 'Open'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Rules */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Rules & Guidelines</h2>
            <CardContent>
              {rules.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] text-neutral-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                      {rule}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-neutral-400">No rules configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Quick Info</h2>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Booking Fee</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {amenity.fee === 0 ? 'Free' : `$${amenity.fee}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Security Deposit</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    ${amenity.securityDeposit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Capacity</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {amenity.capacity ?? amenity.maxConcurrent ?? '—'} people
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Approval</span>
                  <Badge variant={amenity.requiresApproval ? 'warning' : 'success'} size="sm">
                    {amenity.requiresApproval ? 'Required' : 'Auto-approve'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {amenity && (
        <EditAmenityDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          amenity={amenity}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
