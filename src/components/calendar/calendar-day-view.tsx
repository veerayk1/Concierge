'use client';

/**
 * Calendar Day View — single-column time grid with detailed booking blocks.
 * Shows full amenity info, time, unit, guests, and status badge per booking.
 */

import { format, isToday } from 'date-fns';
import { getTimePosition, getBlockHeight, detectOverlaps } from './calendar-utils';
import { CalendarBookingBlock } from './calendar-booking-block';
import type { CalendarBooking } from './calendar-types';
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR, PX_PER_HOUR } from './calendar-types';
import { useEffect, useState } from 'react';

const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

const TIME_LABELS: { hour: number; label: string }[] = [];
for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  TIME_LABELS.push({ hour: h, label: `${displayHour} ${ampm}` });
}

interface DayViewProps {
  currentDate: Date;
  bookingsByDate: Map<string, CalendarBooking[]>;
  onBookingClick: (booking: CalendarBooking, rect: DOMRect) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

export function CalendarDayView({
  currentDate,
  bookingsByDate,
  onBookingClick,
  onSlotClick,
}: DayViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dayBookings = bookingsByDate.get(dateKey) ?? [];
  const positioned = detectOverlaps(dayBookings);
  const today = isToday(currentDate);

  // Current time line
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const showNowLine = today && nowHour >= CALENDAR_START_HOUR && nowHour < CALENDAR_END_HOUR;
  const nowOffset = showNowLine
    ? (((nowHour - CALENDAR_START_HOUR) * 60 + nowMinute) / 60) * PX_PER_HOUR
    : 0;

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-neutral-200/80">
      {/* Day header */}
      <div
        className={`sticky top-0 z-10 border-b border-neutral-200/60 bg-white px-5 py-3 ${
          today ? 'bg-primary-50/30' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <p
            className={`text-[14px] font-semibold tracking-wide uppercase ${
              today ? 'text-primary-600' : 'text-neutral-500'
            }`}
          >
            {format(currentDate, 'EEEE')}
          </p>
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[18px] font-bold ${
              today ? 'bg-primary-500 text-white' : 'text-neutral-800'
            }`}
          >
            {format(currentDate, 'd')}
          </span>
          <p className="text-[13px] text-neutral-400">{format(currentDate, 'MMMM yyyy')}</p>
          {dayBookings.length > 0 && (
            <span className="text-[12px] font-medium text-neutral-400">
              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Time grid */}
      <div
        className="relative"
        style={{ display: 'grid', gridTemplateColumns: '60px 1fr', height: GRID_HEIGHT }}
      >
        {/* Time gutter */}
        <div className="relative border-r border-neutral-200/60">
          {TIME_LABELS.map((t) => (
            <div
              key={t.hour}
              className="absolute right-2 text-right text-[12px] text-neutral-400"
              style={{ top: (t.hour - CALENDAR_START_HOUR) * PX_PER_HOUR - 8 }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* Main column */}
        <div
          className="relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minuteOffset = (y / PX_PER_HOUR) * 60;
            const clickHour = CALENDAR_START_HOUR + Math.floor(minuteOffset / 60);
            onSlotClick(currentDate, clickHour);
          }}
        >
          {/* Hour gridlines */}
          {TIME_LABELS.map((t) => (
            <div key={t.hour}>
              <div
                className="absolute right-0 left-0 border-t border-neutral-100"
                style={{ top: (t.hour - CALENDAR_START_HOUR) * PX_PER_HOUR }}
              />
              {t.hour < CALENDAR_END_HOUR && (
                <div
                  className="absolute right-0 left-0 border-t border-dashed border-neutral-100/50"
                  style={{ top: (t.hour - CALENDAR_START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                />
              )}
            </div>
          ))}

          {/* Booking blocks */}
          {positioned.map(({ booking, column, totalColumns }) => {
            const top = getTimePosition(booking.startTime);
            const height = getBlockHeight(booking.startTime, booking.endTime);
            const width = totalColumns > 1 ? `${100 / totalColumns}%` : '100%';
            const left = totalColumns > 1 ? `${(column / totalColumns) * 100}%` : '0';

            return (
              <div
                key={booking.id}
                className="absolute px-1"
                style={{
                  top: Math.max(top, 0),
                  height: Math.max(height, 40),
                  width,
                  left,
                  zIndex: 5,
                }}
              >
                <CalendarBookingBlock
                  booking={booking}
                  density="detailed"
                  className="h-full"
                  onClick={(b) => {
                    const target = document.activeElement as HTMLElement;
                    onBookingClick(b, target?.getBoundingClientRect() ?? new DOMRect());
                  }}
                />
              </div>
            );
          })}

          {/* Current time line */}
          {showNowLine && (
            <div
              className="pointer-events-none absolute right-0 left-0 z-20"
              style={{ top: nowOffset }}
            >
              <div className="flex items-center">
                <div
                  className="bg-primary-500 h-2.5 w-2.5 rounded-full"
                  style={{ marginLeft: -5 }}
                />
                <div className="bg-primary-500 h-[2px] flex-1" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
