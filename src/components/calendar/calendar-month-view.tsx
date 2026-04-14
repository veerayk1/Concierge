'use client';

/**
 * Calendar Month View — 7-column grid with booking pills per day cell.
 * Today highlighted with primary circle. Max 3 bookings shown per cell,
 * "+N more" overflow links to Day view. Click empty space to book.
 */

import { format } from 'date-fns';
import { getMonthGrid, isSameMonth, isToday } from './calendar-utils';
import { CalendarBookingBlock } from './calendar-booking-block';
import type { CalendarBooking } from './calendar-types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE = 3;

interface MonthViewProps {
  currentDate: Date;
  bookingsByDate: Map<string, CalendarBooking[]>;
  onBookingClick: (booking: CalendarBooking, rect: DOMRect) => void;
  onDateClick: (date: Date) => void;
  onDayDrill: (date: Date) => void; // "+N more" → switch to Day view
}

export function CalendarMonthView({
  currentDate,
  bookingsByDate,
  onBookingClick,
  onDateClick,
  onDayDrill,
}: MonthViewProps) {
  const weeks = getMonthGrid(currentDate);

  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-neutral-200/80">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200/60 bg-neutral-50/80">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="px-3 py-2.5 text-center text-[11px] font-semibold tracking-[0.06em] text-neutral-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7" style={{ minHeight: '120px' }}>
          {week.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDate.get(dateKey) ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const visible = dayBookings.slice(0, MAX_VISIBLE);
            const overflow = dayBookings.length - MAX_VISIBLE;

            return (
              <div
                key={dateKey}
                className={`relative flex flex-col border-r border-b border-neutral-200/60 p-1.5 transition-colors hover:bg-neutral-50/50 ${
                  !isCurrentMonth ? 'bg-neutral-50/30' : ''
                } ${isTodayDate ? 'bg-primary-50/30' : ''}`}
                onClick={() => onDateClick(day)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onDateClick(day);
                }}
              >
                {/* Date number */}
                <div className="mb-1 flex items-start justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium ${
                      isTodayDate
                        ? 'bg-primary-500 font-semibold text-white'
                        : isCurrentMonth
                          ? 'text-neutral-600'
                          : 'text-neutral-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] font-medium text-neutral-400">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Booking pills */}
                <div className="flex flex-1 flex-col gap-0.5">
                  {visible.map((booking) => (
                    <CalendarBookingBlock
                      key={booking.id}
                      booking={booking}
                      density="compact"
                      onClick={(b) => {
                        const target = document.activeElement as HTMLElement;
                        onBookingClick(b, target?.getBoundingClientRect() ?? new DOMRect());
                      }}
                    />
                  ))}

                  {overflow > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayDrill(day);
                      }}
                      className="text-primary-500 hover:text-primary-600 mt-0.5 text-left text-[11px] font-medium transition-colors"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
