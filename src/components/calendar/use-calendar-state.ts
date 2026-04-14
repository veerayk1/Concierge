/**
 * Calendar State Hook — manages view mode, current date, navigation, and amenity filters
 */

import { useState, useCallback } from 'react';
import type { CalendarView } from './calendar-types';
import { navigateDate } from './calendar-utils';

interface UseCalendarStateReturn {
  currentDate: Date;
  view: CalendarView;
  selectedAmenityIds: Set<string>;
  setView: (view: CalendarView) => void;
  goToDate: (date: Date) => void;
  goToday: () => void;
  goNext: () => void;
  goPrev: () => void;
  toggleAmenity: (id: string) => void;
  selectAllAmenities: (ids: string[]) => void;
  deselectAllAmenities: () => void;
}

export function useCalendarState(allAmenityIds: string[]): UseCalendarStateReturn {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<string>>(
    () => new Set(allAmenityIds),
  );

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const goNext = useCallback(() => {
    setCurrentDate((d) => navigateDate(d, view, 'next'));
  }, [view]);

  const goPrev = useCallback(() => {
    setCurrentDate((d) => navigateDate(d, view, 'prev'));
  }, [view]);

  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);

  const toggleAmenity = useCallback((id: string) => {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllAmenities = useCallback((ids: string[]) => {
    setSelectedAmenityIds(new Set(ids));
  }, []);

  const deselectAllAmenities = useCallback(() => {
    setSelectedAmenityIds(new Set());
  }, []);

  return {
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
  };
}
