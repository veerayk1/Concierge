'use client';

/**
 * Calendar Header — navigation bar with prev/next, date title, Today button,
 * and view mode pill tabs (Month / Week / Day).
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTitle } from './calendar-utils';
import type { CalendarView } from './calendar-types';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4">
      {/* Left: navigation + title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onPrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {formatDateTitle(currentDate, view)}
        </h2>
      </div>

      {/* Right: Today + view switcher */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>

        {/* View mode pill tabs */}
        <div className="flex rounded-lg bg-neutral-100 p-1">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onViewChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-all ${
                view === opt.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
