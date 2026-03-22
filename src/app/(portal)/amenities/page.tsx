'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { CreateBookingDialog } from '@/components/forms/create-booking-dialog';
import {
  AlertCircle,
  Calendar,
  Clock,
  Dumbbell,
  Loader2,
  MapPin,
  Plus,
  Search,
  Tv,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types — mapped from API response (Prisma Amenity + relations)
// ---------------------------------------------------------------------------

interface AmenityBooking {
  id: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  status: string;
}

interface AmenityGroup {
  id: string;
  name: string;
}

interface Amenity {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  requiresApproval: boolean;
  fee: number | null;
  group: AmenityGroup | null;
  bookings: AmenityBooking[];
}

function getAmenityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('pool') || lower.includes('swim')) return <Waves className="h-5 w-5" />;
  if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="h-5 w-5" />;
  if (lower.includes('theatre') || lower.includes('theater')) return <Tv className="h-5 w-5" />;
  return <Calendar className="h-5 w-5" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AmenitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const {
    data: amenities,
    loading,
    error,
    refetch,
  } = useApi<Amenity[]>(
    apiUrl('/api/v1/amenities', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
    }),
  );

  const allAmenities = useMemo<Amenity[]>(() => amenities ?? [], [amenities]);

  return (
    <PageShell
      title="Amenity Booking"
      description="Browse and reserve building amenities."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled title="Calendar view — coming soon">
            <Calendar className="h-4 w-4" />
            Calendar View
          </Button>
          <Button size="sm" onClick={() => setShowBookingDialog(true)}>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading amenities...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load amenities"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Empty State */}
      {!loading && !error && allAmenities.length === 0 && (
        <EmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="No amenities found"
          description={
            searchQuery
              ? 'Try adjusting your search to find what you are looking for.'
              : 'No amenities have been set up for this property yet.'
          }
          action={
            searchQuery ? (
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Amenity Cards */}
      {!loading && !error && allAmenities.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allAmenities.map((amenity) => {
            const hasUpcomingBookings = amenity.bookings.length > 0;
            const category = amenity.group?.name ?? 'General';
            return (
              <Card
                key={amenity.id}
                hoverable
                className="cursor-pointer"
                onClick={() => router.push(`/amenities/${amenity.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-xl">
                    {getAmenityIcon(amenity.name)}
                  </div>
                  <Badge variant={!hasUpcomingBookings ? 'success' : 'default'} size="sm" dot>
                    {!hasUpcomingBookings ? 'Available' : 'Booked'}
                  </Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-[16px] font-semibold text-neutral-900">{amenity.name}</h3>
                  <p className="mt-0.5 text-[13px] text-neutral-500">{category}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-[13px] text-neutral-500">
                  {amenity.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {amenity.location}
                    </span>
                  )}
                  {amenity.capacity && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-neutral-400" />
                      Capacity: {amenity.capacity}
                    </span>
                  )}
                  {hasUpcomingBookings && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {amenity.bookings.length} upcoming booking
                      {amenity.bookings.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {amenity.requiresApproval && (
                    <Badge variant="info" size="sm">
                      Requires Approval
                    </Badge>
                  )}
                  {amenity.fee !== null && amenity.fee > 0 && (
                    <Badge variant="default" size="sm">
                      ${amenity.fee}/booking
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateBookingDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowBookingDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
