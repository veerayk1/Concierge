/**
 * Calendar Bookings Hook — fetches bookings for the visible date range
 * and groups them by date for efficient calendar rendering.
 */

import { useMemo } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import type { CalendarView, CalendarBooking, CalendarAmenity } from './calendar-types';
import { getVisibleDateRange, groupBookingsByDate } from './calendar-utils';

interface ApiBooking {
  id: string;
  referenceNumber?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: string;
  guestCount: number;
  amenity?: { id: string; name: string; color?: string } | null;
  unit?: { id: string; number: string } | null;
}

interface UseCalendarBookingsReturn {
  bookings: CalendarBooking[];
  bookingsByDate: Map<string, CalendarBooking[]>;
  filteredBookings: CalendarBooking[];
  filteredByDate: Map<string, CalendarBooking[]>;
  loading: boolean;
  error: string | null;
}

export function useCalendarBookings(
  propertyId: string,
  currentDate: Date,
  view: CalendarView,
  selectedAmenityIds: Set<string>,
  amenities: CalendarAmenity[],
): UseCalendarBookingsReturn {
  const { from, to } = getVisibleDateRange(currentDate, view);

  const { data, loading, error } = useApi<{ data: ApiBooking[]; meta?: unknown }>(
    apiUrl('/api/v1/bookings', {
      propertyId,
      from,
      to,
      pageSize: '500',
    }),
  );

  // Build amenity color/name lookup
  const amenityMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const a of amenities) {
      map.set(a.id, { name: a.name, color: a.color });
    }
    return map;
  }, [amenities]);

  // Transform API response into CalendarBooking[]
  const bookings = useMemo<CalendarBooking[]>(() => {
    const raw = data?.data ?? (Array.isArray(data) ? data : []);
    return (raw as ApiBooking[]).map((b) => {
      const amenityInfo = amenityMap.get(b.amenity?.id ?? '') ?? {
        name: b.amenity?.name ?? 'Unknown',
        color: b.amenity?.color ?? '#6B7280',
      };
      return {
        id: b.id,
        amenityId: b.amenity?.id ?? '',
        amenityName: amenityInfo.name,
        amenityColor: amenityInfo.color,
        startDate: b.startDate,
        startTime: b.startTime,
        endDate: b.endDate,
        endTime: b.endTime,
        status: b.status as CalendarBooking['status'],
        unitNumber: b.unit?.number ?? '',
        guestCount: b.guestCount ?? 0,
        referenceNumber: b.referenceNumber,
      };
    });
  }, [data, amenityMap]);

  const bookingsByDate = useMemo(() => groupBookingsByDate(bookings), [bookings]);

  // Client-side amenity filtering
  const filteredBookings = useMemo(
    () => bookings.filter((b) => selectedAmenityIds.has(b.amenityId)),
    [bookings, selectedAmenityIds],
  );

  const filteredByDate = useMemo(() => groupBookingsByDate(filteredBookings), [filteredBookings]);

  return {
    bookings,
    bookingsByDate,
    filteredBookings,
    filteredByDate,
    loading,
    error: error ?? null,
  };
}
