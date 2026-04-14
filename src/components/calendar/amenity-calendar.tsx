'use client';

/**
 * Amenity Calendar — Top-level orchestrator component.
 * Composes header, filter sidebar, and active view (Month/Week/Day).
 * Receives amenity list and propertyId as props from the amenities page.
 */

import { useState, useMemo, useCallback } from 'react';
import { CalendarOff, Loader2 } from 'lucide-react';
import { CalendarHeader } from './calendar-header';
import { CalendarAmenityFilter } from './calendar-amenity-filter';
import { CalendarMonthView } from './calendar-month-view';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarDayView } from './calendar-day-view';
import { CalendarBookingPopover } from './calendar-booking-popover';
import { useCalendarState } from './use-calendar-state';
import { useCalendarBookings } from './use-calendar-bookings';
import type { CalendarAmenity, CalendarBooking } from './calendar-types';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiAmenity {
  id: string;
  name: string;
  color?: string;
  group?: { id: string; name: string } | null;
}

interface AmenityCalendarProps {
  amenities: ApiAmenity[];
  propertyId: string;
  onNewBooking?: (date?: Date, hour?: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AmenityCalendar({ amenities, propertyId, onNewBooking }: AmenityCalendarProps) {
  // Map raw API amenities to CalendarAmenity shape
  const calendarAmenities = useMemo<CalendarAmenity[]>(
    () =>
      amenities.map((a) => ({
        id: a.id,
        name: a.name,
        color: a.color || '#6B7280',
        groupName: a.group?.name ?? 'General',
      })),
    [amenities],
  );

  const allIds = useMemo(() => calendarAmenities.map((a) => a.id), [calendarAmenities]);

  const {
    currentDate,
    view,
    selectedAmenityIds,
    setView,
    goToDate,
    goToday,
    goNext,
    goPrev,
    toggleAmenity,
    selectAllAmenities,
    deselectAllAmenities,
  } = useCalendarState(allIds);

  const { filteredByDate, loading, error } = useCalendarBookings(
    propertyId,
    currentDate,
    view,
    selectedAmenityIds,
    calendarAmenities,
  );

  // Popover state
  const [popoverBooking, setPopoverBooking] = useState<CalendarBooking | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);

  const handleBookingClick = useCallback((booking: CalendarBooking, rect: DOMRect) => {
    setPopoverBooking(booking);
    setPopoverRect(rect);
  }, []);

  const handleClosePopover = useCallback(() => {
    setPopoverBooking(null);
    setPopoverRect(null);
  }, []);

  // Drill from month "+N more" to Day view
  const handleDayDrill = useCallback(
    (date: Date) => {
      goToDate(date);
      setView('day');
    },
    [goToDate, setView],
  );

  // Click empty slot → new booking
  const handleDateClick = useCallback(
    (date: Date) => {
      onNewBooking?.(date);
    },
    [onNewBooking],
  );

  const handleSlotClick = useCallback(
    (date: Date, hour: number) => {
      onNewBooking?.(date, hour);
    },
    [onNewBooking],
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      {/* Main area: sidebar + calendar */}
      <div className="flex gap-5">
        {/* Filter Sidebar */}
        <CalendarAmenityFilter
          amenities={calendarAmenities}
          selectedIds={selectedAmenityIds}
          onToggle={toggleAmenity}
          onSelectAll={selectAllAmenities}
          onDeselectAll={deselectAllAmenities}
        />

        {/* Calendar View */}
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-24">
            <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
            <p className="mt-3 text-[14px] text-neutral-500">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="flex-1">
            <EmptyState
              icon={<CalendarOff className="h-5 w-5" />}
              title="Failed to load bookings"
              description="There was an error loading the booking data. Please try again."
            />
          </div>
        ) : (
          <>
            {view === 'month' && (
              <CalendarMonthView
                currentDate={currentDate}
                bookingsByDate={filteredByDate}
                onBookingClick={handleBookingClick}
                onDateClick={handleDateClick}
                onDayDrill={handleDayDrill}
              />
            )}
            {view === 'week' && (
              <CalendarWeekView
                currentDate={currentDate}
                bookingsByDate={filteredByDate}
                onBookingClick={handleBookingClick}
                onSlotClick={handleSlotClick}
              />
            )}
            {view === 'day' && (
              <CalendarDayView
                currentDate={currentDate}
                bookingsByDate={filteredByDate}
                onBookingClick={handleBookingClick}
                onSlotClick={handleSlotClick}
              />
            )}
          </>
        )}
      </div>

      {/* Booking Detail Popover */}
      {popoverBooking && (
        <CalendarBookingPopover
          booking={popoverBooking}
          anchorRect={popoverRect}
          onClose={handleClosePopover}
        />
      )}
    </div>
  );
}
