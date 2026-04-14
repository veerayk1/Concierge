'use client';

/**
 * Calendar Week View — 7-column time grid with absolutely positioned booking blocks.
 * Shows 7 AM - 10 PM (configurable), 48px per 30-min slot, current time red line.
 */

import { format, isToday } from 'date-fns';
import { getWeekDays, getTimePosition, getBlockHeight, detectOverlaps } from './calendar-utils';
import { CalendarBookingBlock } from './calendar-booking-block';
import type { CalendarBooking } from './calendar-types';
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR, PX_PER_HOUR } from './calendar-types';
import { useEffect, useState } from 'react';

const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

// Generate time labels
const TIME_LABELS: { hour: number; label: string }[] = [];
for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  TIME_LABELS.push({ hour: h, label: `${displayHour} ${ampm}` });
}

interface WeekViewProps {
  currentDate: Date;
  bookingsByDate: Map<string, CalendarBooking[]>;
  onBookingClick: (booking: CalendarBooking, rect: DOMRect) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

export function CalendarWeekView({
  currentDate,
  bookingsByDate,
  onBookingClick,
  onSlotClick,
}: WeekViewProps) {
  const days = getWeekDays(currentDate);

  // Current time line
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowOffset =
    nowHour >= CALENDAR_START_HOUR && nowHour < CALENDAR_END_HOUR
      ? (((nowHour - CALENDAR_START_HOUR) * 60 + nowMinute) / 60) * PX_PER_HOUR
      : null;

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-neutral-200/80">
      {/* Day column headers */}
      <div
        className="sticky top-0 z-10 grid border-b border-neutral-200/60 bg-white"
        style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
      >
        <div className="border-r border-neutral-200/60" /> {/* gutter placeholder */}
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={`border-r border-neutral-200/60 px-2 py-2.5 text-center ${
                today ? 'bg-primary-50/40' : ''
              }`}
            >
              <p
                className={`text-[11px] font-semibold tracking-wide uppercase ${
                  today ? 'text-primary-600' : 'text-neutral-400'
                }`}
              >
                {format(day, 'EEE')}
              </p>
              <p
                className={`mt-0.5 text-[16px] font-semibold ${
                  today ? 'text-primary-600' : 'text-neutral-700'
                }`}
              >
                {format(day, 'd')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div
        className="relative"
        style={{ gridTemplateColumns: '60px repeat(7, 1fr)', display: 'grid', height: GRID_HEIGHT }}
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

        {/* Day columns */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate.get(dateKey) ?? [];
          const positioned = detectOverlaps(dayBookings);
          const today = isToday(day);

          return (
            <div
              key={dateKey}
              className={`relative border-r border-neutral-200/60 ${
                today ? 'bg-primary-50/20' : ''
              }`}
              onClick={(e) => {
                // Calculate which time slot was clicked
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const minuteOffset = (y / PX_PER_HOUR) * 60;
                const clickHour = CALENDAR_START_HOUR + Math.floor(minuteOffset / 60);
                onSlotClick(day, clickHour);
              }}
            >
              {/* Hour gridlines */}
              {TIME_LABELS.map((t) => (
                <div key={t.hour}>
                  {/* Hour line */}
                  <div
                    className="absolute right-0 left-0 border-t border-neutral-100"
                    style={{ top: (t.hour - CALENDAR_START_HOUR) * PX_PER_HOUR }}
                  />
                  {/* Half-hour dashed line */}
                  {t.hour < CALENDAR_END_HOUR && (
                    <div
                      className="absolute right-0 left-0 border-t border-dashed border-neutral-100/50"
                      style={{
                        top: (t.hour - CALENDAR_START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2,
                      }}
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
                    className="absolute px-0.5"
                    style={{
                      top: Math.max(top, 0),
                      height: Math.max(height, 24),
                      width,
                      left,
                      zIndex: 5,
                    }}
                  >
                    <CalendarBookingBlock
                      booking={booking}
                      density="standard"
                      className="h-full"
                      onClick={(b) => {
                        const target = document.activeElement as HTMLElement;
                        onBookingClick(b, target?.getBoundingClientRect() ?? new DOMRect());
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Current time line */}
        {nowOffset !== null && (
          <div
            className="pointer-events-none absolute z-20"
            style={{
              top: nowOffset,
              left: 56,
              right: 0,
            }}
          >
            <div className="flex items-center">
              <div className="bg-primary-500 h-2.5 w-2.5 rounded-full" style={{ marginLeft: -5 }} />
              <div className="bg-primary-500 h-[2px] flex-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
