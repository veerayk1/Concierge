'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Dumbbell,
  Flame,
  MapPin,
  Plus,
  Tv,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Amenity {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  maxGuests: number;
  fee: string | number;
  maxConcurrent: number;
}

interface BookingAmenity {
  id: string;
  name: string;
}

interface BookingUnit {
  id: string;
  number: string;
}

interface MyBooking {
  id: string;
  referenceNumber: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: string;
  guestCount: number;
  requestorComments: string | null;
  amenity: BookingAmenity | null;
  unit: BookingUnit | null;
}

interface AmenitiesApiResponse {
  data: Amenity[];
  meta?: { total: number };
}

interface BookingsApiResponse {
  data: MyBooking[];
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
}

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function getAmenityIcon(icon: string | null) {
  switch (icon) {
    case 'pool':
    case 'waves':
      return <Waves className="h-5 w-5" />;
    case 'gym':
    case 'dumbbell':
      return <Dumbbell className="h-5 w-5" />;
    case 'bbq':
    case 'flame':
      return <Flame className="h-5 w-5" />;
    case 'meeting':
    case 'monitor':
    case 'tv':
      return <Tv className="h-5 w-5" />;
    case 'guest':
    case 'map-pin':
      return <MapPin className="h-5 w-5" />;
    default:
      return <Calendar className="h-5 w-5" />;
  }
}

function formatTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AmenityBookingPage() {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [cancelling, setCancelling] = useState<string | null>(null);
  // Page-level toast for events that outlive the modal (e.g., booking submit
  // closes the dialog and the resident loses the in-dialog confirmation).
  const [pageBanner, setPageBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Booking form state
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [comments, setComments] = useState('');

  // Fetch amenities
  const {
    data: amenitiesRaw,
    loading: amenitiesLoading,
    error: amenitiesError,
  } = useApi<Amenity[] | AmenitiesApiResponse>(
    apiUrl('/api/v1/amenities', { propertyId: getPropertyId() }),
  );

  const amenities = useMemo<Amenity[]>(() => {
    if (!amenitiesRaw) return [];
    if (Array.isArray(amenitiesRaw)) return amenitiesRaw;
    if (Array.isArray((amenitiesRaw as AmenitiesApiResponse).data))
      return (amenitiesRaw as AmenitiesApiResponse).data;
    return [];
  }, [amenitiesRaw]);

  // Fetch my bookings
  const {
    data: bookingsRaw,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useApi<MyBooking[] | BookingsApiResponse>(
    apiUrl('/api/v1/resident/bookings', { propertyId: getPropertyId() }),
  );

  const bookings = useMemo<MyBooking[]>(() => {
    if (!bookingsRaw) return [];
    let rows: MyBooking[] = [];
    if (Array.isArray(bookingsRaw)) rows = bookingsRaw;
    else if (Array.isArray((bookingsRaw as BookingsApiResponse).data))
      rows = (bookingsRaw as BookingsApiResponse).data;
    // "My upcoming bookings" should be exactly that — upcoming. Hide
    // cancelled rows (they're dead) and hide anything that already
    // ended today or earlier (they're past). Resident can still see
    // history on a dedicated /my-bookings page if we build one.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return rows.filter((b) => {
      if (b.status === 'cancelled' || b.status === 'declined') return false;
      const start = new Date(b.startDate);
      return start >= todayStart;
    });
  }, [bookingsRaw]);

  const openBookingDialog = useCallback((amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setGuestCount(1);
    setComments('');
    setFeedback(null);
    setBookingDialogOpen(true);
  }, []);

  const handleCreateBooking = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAmenity) return;

      setSubmitting(true);
      setFeedback(null);

      try {
        const resp = await apiRequest('/api/v1/resident/bookings', {
          method: 'POST',
          body: {
            amenityId: selectedAmenity.id,
            startDate,
            startTime,
            endDate: endDate || startDate,
            endTime,
            guestCount,
            requestorComments: comments || undefined,
          },
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: errData.message || 'Failed to create booking.',
          });
          return;
        }

        const result = await resp.json();
        const successMessage =
          result.message || `Booking submitted for ${selectedAmenity?.name ?? 'this amenity'}.`;
        setFeedback({ type: 'success', message: successMessage });

        setTimeout(() => {
          setBookingDialogOpen(false);
          setFeedback(null);
          refetchBookings();
          // Surface the success on the page itself so it survives the dialog
          // close, then scroll the resident down to the My Bookings table so
          // they can see the new entry. Auto-dismiss after 5s.
          setPageBanner({ type: 'success', message: successMessage });
          if (typeof window !== 'undefined') {
            const target = document.getElementById('my-bookings');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          setTimeout(() => setPageBanner(null), 5000);
        }, 1200);
      } catch {
        setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedAmenity,
      startDate,
      startTime,
      endDate,
      endTime,
      guestCount,
      comments,
      refetchBookings,
    ],
  );

  const handleCancelBooking = useCallback(
    async (bookingId: string) => {
      // Destructive action — confirm before firing.
      if (
        typeof window !== 'undefined' &&
        !window.confirm('Cancel this booking? This cannot be undone.')
      ) {
        return;
      }
      setCancelling(bookingId);
      try {
        const resp = await apiRequest(`/api/v1/resident/bookings/${bookingId}`, {
          method: 'DELETE',
        });
        const body = (await resp.json().catch(() => ({}))) as {
          message?: string;
        };
        if (!resp.ok) {
          setPageBanner({
            type: 'error',
            message: body.message ?? 'Failed to cancel booking.',
          });
        } else {
          setPageBanner({
            type: 'success',
            message: body.message ?? 'Booking cancelled.',
          });
        }
        refetchBookings();
        setTimeout(() => setPageBanner(null), 5000);
      } catch {
        setPageBanner({
          type: 'error',
          message: 'An unexpected error occurred while cancelling.',
        });
        setTimeout(() => setPageBanner(null), 5000);
      } finally {
        setCancelling(null);
      }
    },
    [refetchBookings],
  );

  const bookingColumns: Column<MyBooking>[] = [
    {
      id: 'amenity',
      header: 'Amenity',
      accessorKey: 'amenity',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-neutral-900">
            {row.amenity?.name || 'Unknown'}
          </span>
          {row.guestCount > 0 && (
            <span className="text-[11.5px] text-neutral-500">
              {row.guestCount} guest{row.guestCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'when',
      header: 'When',
      accessorKey: 'startDate',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-neutral-700">{formatDate(row.startDate)}</span>
          <span className="flex items-center gap-1 text-[11.5px] text-neutral-500">
            <Clock className="h-3 w-3 text-neutral-400" />
            {formatTime(row.startTime)} – {formatTime(row.endTime)}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const statusMap: Record<
          string,
          { variant: 'success' | 'warning' | 'error' | 'default'; label: string }
        > = {
          approved: { variant: 'success', label: 'Approved' },
          confirmed: { variant: 'success', label: 'Confirmed' },
          pending: { variant: 'warning', label: 'Pending' },
          cancelled: { variant: 'error', label: 'Cancelled' },
          rejected: { variant: 'error', label: 'Rejected' },
          completed: { variant: 'default', label: 'Completed' },
        };
        const s = statusMap[row.status] || { variant: 'default' as const, label: row.status };
        return (
          <Badge variant={s.variant} size="sm" dot>
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => {
        if (row.status !== 'pending' && row.status !== 'approved') return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={cancelling === row.id}
            onClick={() => handleCancelBooking(row.id)}
          >
            <X className="h-4 w-4" />
            {cancelling === row.id ? 'Cancelling...' : 'Cancel'}
          </Button>
        );
      },
    },
  ];

  // Loading skeleton
  if (amenitiesLoading) {
    return (
      <PageShell
        hero="sky"
        title="Book an Amenity"
        description="Reserve building amenities for your use."
      >
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (amenitiesError) {
    return (
      <PageShell
        hero="sky"
        title="Book an Amenity"
        description="Reserve building amenities for your use."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load amenities"
          description={amenitiesError}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      hero="sky"
      title="Book an Amenity"
      description="Reserve building amenities for your use."
    >
      {pageBanner && (
        <div
          role={pageBanner.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-[14px] ${
            pageBanner.type === 'error'
              ? 'border-error-200 bg-error-50 text-error-700'
              : 'border-success-200 bg-success-50 text-success-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {pageBanner.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{pageBanner.message}</span>
            {pageBanner.type === 'success' && (
              <a href="#my-bookings" className="ml-2 underline-offset-2 hover:underline">
                View my bookings →
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPageBanner(null)}
            className="shrink-0 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* My Bookings — render first so a resident with a reservation
          coming up sees it before the "browse" surface. Empty state is
          intentionally calm; the browse grid below carries the CTA. */}
      {(bookingsLoading || bookings.length > 0) && (
        <section id="my-bookings" className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-neutral-900">My upcoming bookings</h2>
            {bookings.length > 0 && (
              <span className="text-[12px] text-neutral-400">
                {bookings.length} reservation{bookings.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {bookingsLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : bookingsError ? (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6" />}
              title="Failed to load bookings"
              description={bookingsError}
            />
          ) : (
            <DataTable
              columns={bookingColumns}
              data={bookings}
              emptyMessage="You have no bookings yet."
              emptyIcon={<Calendar className="h-6 w-6" />}
            />
          )}
        </section>
      )}

      {/* Browse Amenities */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold text-neutral-900">Browse amenities</h2>
          <span className="text-[12px] text-neutral-400">
            {amenities.filter((a) => a.isActive).length} available
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {amenities
            .filter((a) => a.isActive)
            .map((amenity) => (
              <Card key={amenity.id} hoverable className="flex flex-col justify-between">
                <div>
                  {/* The Card header used to carry an "Available" success
                      badge next to the icon. It rendered on every card —
                      pure noise, since the page only lists active
                      amenities. Dropped in favour of a cleaner icon
                      row. */}
                  <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-xl">
                    {getAmenityIcon(amenity.icon)}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-[16px] font-semibold text-neutral-900">{amenity.name}</h3>
                    {amenity.description && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">
                        {amenity.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-neutral-500">
                    {amenity.maxGuests > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        Up to {amenity.maxGuests} guest{amenity.maxGuests === 1 ? '' : 's'}
                      </span>
                    )}
                    {Number(amenity.fee) > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-400" />$
                        {Number(amenity.fee)} per booking
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                        Free
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  <Button size="sm" fullWidth onClick={() => openBookingDialog(amenity)}>
                    <Plus className="h-4 w-4" />
                    Book
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogTitle>Book {selectedAmenity?.name}</DialogTitle>
          <DialogDescription>Select a date and time for your reservation.</DialogDescription>

          {feedback && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
                feedback.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
              role="alert"
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                  disabled={submitting}
                  min={new Date().toISOString().split('T')[0]}
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={submitting}
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={submitting}
                  className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                Number of Guests
              </label>
              <input
                type="number"
                min={0}
                max={selectedAmenity?.maxGuests || 100}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 0)}
                disabled={submitting}
                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-700 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-neutral-700">
                Comments (optional)
              </label>
              <textarea
                maxLength={1000}
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={submitting}
                placeholder="Any special requirements or notes..."
                className="focus:border-primary-300 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBookingDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !startDate || !startTime || !endTime}>
                {submitting ? 'Submitting...' : 'Submit Booking'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
