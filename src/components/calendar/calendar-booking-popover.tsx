'use client';

/**
 * Calendar Booking Popover — click-on-booking detail card
 * Shows amenity, date, time, unit, guests, status, with link to full detail page.
 */

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react';
import { getAmenityIcon } from './amenity-icon-map';
import { formatTime, format, parseISO } from './calendar-utils';
import { STATUS_CONFIG } from './calendar-types';
import type { CalendarBooking } from './calendar-types';
import { Badge } from '@/components/ui/badge';

interface BookingPopoverProps {
  booking: CalendarBooking;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export function CalendarBookingPopover({ booking, onClose, anchorRect }: BookingPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending!;

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position the popover near the anchor element
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
  };
  if (anchorRect) {
    popoverStyle.top = anchorRect.bottom + 8;
    popoverStyle.left = anchorRect.left;
    // Keep within viewport
    if (anchorRect.left + 320 > window.innerWidth) {
      popoverStyle.left = window.innerWidth - 330;
    }
    if (anchorRect.bottom + 260 > window.innerHeight) {
      popoverStyle.top = anchorRect.top - 260;
    }
  }

  return (
    <div
      ref={ref}
      style={popoverStyle}
      className="w-[300px] rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span style={{ color: booking.amenityColor }}>
          {getAmenityIcon(booking.amenityName, 'h-5 w-5')}
        </span>
        <h3 className="flex-1 text-[15px] font-semibold text-neutral-900">{booking.amenityName}</h3>
        <Badge variant={status.variant} size="sm" dot>
          {status.label}
        </Badge>
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 text-[13px] text-neutral-600">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          {format(parseISO(booking.startDate), 'EEE, MMM d, yyyy')}
        </div>
        <div className="flex items-center gap-2.5 text-[13px] text-neutral-600">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </div>
        {booking.unitNumber && (
          <div className="flex items-center gap-2.5 text-[13px] text-neutral-600">
            <MapPin className="h-3.5 w-3.5 text-neutral-400" />
            Unit {booking.unitNumber}
          </div>
        )}
        {booking.guestCount > 0 && (
          <div className="flex items-center gap-2.5 text-[13px] text-neutral-600">
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-neutral-100 pt-3">
        <Link
          href={`/amenities/bookings/${booking.id}` as never}
          className="text-primary-500 hover:text-primary-600 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        >
          View Details
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
