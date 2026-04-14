/**
 * Amenity Calendar — Shared Type Definitions
 */

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarAmenity {
  id: string;
  name: string;
  color: string; // hex from DB, e.g. "#2563EB"
  groupName: string;
  icon?: string | null;
}

export interface CalendarBooking {
  id: string;
  amenityId: string;
  amenityName: string;
  amenityColor: string;
  startDate: string; // ISO date
  startTime: string; // ISO datetime
  endDate: string;
  endTime: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed' | 'no_show';
  unitNumber: string;
  guestCount: number;
  referenceNumber?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string; // "9:00 AM"
}

/** Booking status → visual config */
export const STATUS_CONFIG: Record<
  string,
  { dotColor: string; label: string; variant: 'success' | 'warning' | 'error' | 'default' }
> = {
  approved: { dotColor: 'bg-success-500', label: 'Approved', variant: 'success' },
  pending: { dotColor: 'bg-warning-500', label: 'Pending', variant: 'warning' },
  cancelled: { dotColor: 'bg-error-500', label: 'Cancelled', variant: 'error' },
  declined: { dotColor: 'bg-error-500', label: 'Declined', variant: 'error' },
  completed: { dotColor: 'bg-neutral-400', label: 'Completed', variant: 'default' },
  no_show: { dotColor: 'bg-neutral-400', label: 'No Show', variant: 'default' },
};

/** Default calendar display range */
export const CALENDAR_START_HOUR = 7; // 7 AM
export const CALENDAR_END_HOUR = 22; // 10 PM
export const PX_PER_HOUR = 96; // 48px per 30min slot
export const SLOT_MINUTES = 30;
