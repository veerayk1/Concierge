/**
 * Amenity Calendar — Pure Utility Functions
 * All date math uses date-fns v4.
 */

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  getHours,
  getMinutes,
} from 'date-fns';
import type { CalendarView, CalendarBooking } from './calendar-types';
import { CALENDAR_START_HOUR, PX_PER_HOUR } from './calendar-types';

// ---------------------------------------------------------------------------
// Grid generation
// ---------------------------------------------------------------------------

/** Returns a 2D array of dates for a month calendar (5-6 rows x 7 cols) */
export function getMonthGrid(date: Date): Date[][] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}

/** Returns 7 days for the week containing the given date */
export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function navigateDate(date: Date, view: CalendarView, direction: 'prev' | 'next'): Date {
  switch (view) {
    case 'month':
      return direction === 'next' ? addMonths(date, 1) : subMonths(date, 1);
    case 'week':
      return direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1);
    case 'day':
      return direction === 'next' ? addDays(date, 1) : subDays(date, 1);
  }
}

// ---------------------------------------------------------------------------
// Date range for API queries
// ---------------------------------------------------------------------------

export function getVisibleDateRange(date: Date, view: CalendarView): { from: string; to: string } {
  let start: Date;
  let end: Date;

  switch (view) {
    case 'month': {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      start = startOfWeek(monthStart);
      end = endOfWeek(monthEnd);
      break;
    }
    case 'week': {
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    }
    case 'day': {
      start = date;
      end = date;
      break;
    }
  }

  return {
    from: format(start, 'yyyy-MM-dd'),
    to: format(end, 'yyyy-MM-dd'),
  };
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export function formatDateTitle(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week': {
      const days = getWeekDays(date);
      const first = days[0]!;
      const last = days[6]!;
      if (isSameMonth(first, last)) {
        return `${format(first, 'MMM d')} - ${format(last, 'd, yyyy')}`;
      }
      return `${format(first, 'MMM d')} - ${format(last, 'MMM d, yyyy')}`;
    }
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
  }
}

export function formatTime(isoString: string): string {
  const d = parseISO(isoString);
  return format(d, 'h:mm a');
}

// ---------------------------------------------------------------------------
// Time grid positioning
// ---------------------------------------------------------------------------

/** Convert a time to a pixel offset from the top of the grid */
export function getTimePosition(isoString: string): number {
  const d = parseISO(isoString);
  const hours = getHours(d);
  const minutes = getMinutes(d);
  const totalMinutes = (hours - CALENDAR_START_HOUR) * 60 + minutes;
  return (totalMinutes / 60) * PX_PER_HOUR;
}

/** Calculate block height in pixels from start/end times */
export function getBlockHeight(startIso: string, endIso: string): number {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const startMin = getHours(start) * 60 + getMinutes(start);
  const endMin = getHours(end) * 60 + getMinutes(end);
  const durationMin = Math.max(endMin - startMin, 30); // minimum 30min display
  return (durationMin / 60) * PX_PER_HOUR;
}

// ---------------------------------------------------------------------------
// Overlap detection for side-by-side rendering
// ---------------------------------------------------------------------------

/** Group overlapping bookings into columns for side-by-side rendering */
export function detectOverlaps(
  bookings: CalendarBooking[],
): { booking: CalendarBooking; column: number; totalColumns: number }[] {
  if (bookings.length === 0) return [];

  // Sort by start time
  const sorted = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const result: { booking: CalendarBooking; column: number; totalColumns: number }[] = [];

  // Track end times per column
  const columns: string[] = []; // stores end time of each column

  for (const booking of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      if (booking.startTime >= columns[col]!) {
        columns[col] = booking.endTime;
        result.push({ booking, column: col, totalColumns: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push(booking.endTime);
      result.push({ booking, column: columns.length - 1, totalColumns: 0 });
    }
  }

  // Set totalColumns for each booking
  const totalCols = columns.length;
  for (const item of result) {
    item.totalColumns = totalCols;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Grouping bookings by date
// ---------------------------------------------------------------------------

export function groupBookingsByDate(bookings: CalendarBooking[]): Map<string, CalendarBooking[]> {
  const map = new Map<string, CalendarBooking[]>();
  for (const b of bookings) {
    const dateKey = b.startDate.slice(0, 10); // yyyy-MM-dd
    const existing = map.get(dateKey) ?? [];
    existing.push(b);
    map.set(dateKey, existing);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { isSameDay, isSameMonth, isToday, format, parseISO };
