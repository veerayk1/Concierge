'use client';

/**
 * Calendar Booking Block — renders a single booking pill in the calendar.
 * Three density modes:
 *   compact  (month view) — icon + truncated name
 *   standard (week view)  — icon + name + time
 *   detailed (day view)   — icon + name + time + unit + status badge
 */

import { getAmenityIcon } from './amenity-icon-map';
import { formatTime } from './calendar-utils';
import { STATUS_CONFIG } from './calendar-types';
import type { CalendarBooking } from './calendar-types';

interface CalendarBookingBlockProps {
  booking: CalendarBooking;
  density?: 'compact' | 'standard' | 'detailed';
  onClick?: (booking: CalendarBooking) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function CalendarBookingBlock({
  booking,
  density = 'standard',
  onClick,
  className = '',
  style,
}: CalendarBookingBlockProps) {
  const statusDot = STATUS_CONFIG[booking.status]?.dotColor ?? 'bg-neutral-400';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(booking);
      }}
      className={`group relative flex w-full items-start gap-1.5 overflow-hidden rounded-lg text-left transition-all duration-150 ease-out hover:shadow-sm ${className}`}
      style={{
        borderLeft: `3px solid ${booking.amenityColor}`,
        backgroundColor: `${booking.amenityColor}12`,
        ...style,
      }}
    >
      {/* Status dot */}
      <div className={`absolute top-1.5 right-1.5 h-[6px] w-[6px] rounded-full ${statusDot}`} />

      {density === 'compact' && (
        <div className="flex min-w-0 items-center gap-1 px-1.5 py-0.5">
          <span className="shrink-0" style={{ color: booking.amenityColor }}>
            {getAmenityIcon(booking.amenityName, 'h-3 w-3')}
          </span>
          <span className="truncate text-[11px] font-medium text-neutral-700">
            {booking.amenityName}
          </span>
        </div>
      )}

      {density === 'standard' && (
        <div className="flex min-w-0 flex-col gap-0.5 px-2 py-1">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0" style={{ color: booking.amenityColor }}>
              {getAmenityIcon(booking.amenityName, 'h-3.5 w-3.5')}
            </span>
            <span className="truncate text-[12px] font-semibold text-neutral-800">
              {booking.amenityName}
            </span>
          </div>
          <span className="text-[11px] text-neutral-500">
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
        </div>
      )}

      {density === 'detailed' && (
        <div className="flex min-w-0 flex-col gap-1 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="shrink-0" style={{ color: booking.amenityColor }}>
              {getAmenityIcon(booking.amenityName, 'h-4 w-4')}
            </span>
            <span className="truncate text-[13px] font-semibold text-neutral-900">
              {booking.amenityName}
            </span>
          </div>
          <span className="text-[12px] text-neutral-600">
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span>Unit {booking.unitNumber}</span>
            {booking.guestCount > 0 && <span>{booking.guestCount} guests</span>}
          </div>
        </div>
      )}
    </button>
  );
}
