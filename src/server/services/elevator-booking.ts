/**
 * Elevator Booking Service
 *
 * Specialized amenity booking for move-in/move-out elevator reservations.
 * Addresses GAP-ANALYSIS item 6.1: Move-in/move-out elevator booking
 * with distinct fee structures, security deposits, and scheduling rules.
 *
 * This is a special amenity type that requires different fee matrices,
 * deposit amounts, time slot restrictions, and padding rules depending
 * on the booking purpose (move-in, move-out, delivery).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ElevatorBookingType = 'move_in' | 'move_out' | 'delivery';

export interface FeeSchedule {
  type: ElevatorBookingType;
  /** Base fee for the standard time block (in cents to avoid floating-point issues) */
  baseFeePerBlockCents: number;
  /** Duration of one base block in hours */
  baseBlockHours: number;
  /** Security deposit required (in cents) */
  securityDepositCents: number;
  /** Maximum allowed duration in hours */
  maxDurationHours: number;
}

export interface FeeCalculation {
  type: ElevatorBookingType;
  durationHours: number;
  blocks: number;
  feeCents: number;
  securityDepositCents: number;
  totalCents: number;
}

export interface TimeSlotRestriction {
  type: ElevatorBookingType;
  allowedDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startHour: number; // 24-hour format
  endHour: number; // 24-hour format
  description: string;
}

export interface BookingRules {
  feeSchedules: FeeSchedule[];
  timeSlotRestrictions: TimeSlotRestriction[];
  paddingMinutes: number;
  cancellationNoticeHours: number;
  maxAdvanceBookingDays: number;
  requiresInsuranceCertificate: boolean;
  requiresElevatorPadding: boolean;
  notes: string[];
}

export interface TimeSlotValidation {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Fee Schedules
// ---------------------------------------------------------------------------

const FEE_SCHEDULES: Record<ElevatorBookingType, FeeSchedule> = {
  move_in: {
    type: 'move_in',
    baseFeePerBlockCents: 15000, // $150 per 4-hour block
    baseBlockHours: 4,
    securityDepositCents: 50000, // $500
    maxDurationHours: 12,
  },
  move_out: {
    type: 'move_out',
    baseFeePerBlockCents: 15000, // $150 per 4-hour block
    baseBlockHours: 4,
    securityDepositCents: 50000, // $500
    maxDurationHours: 12,
  },
  delivery: {
    type: 'delivery',
    baseFeePerBlockCents: 7500, // $75 per 2-hour block
    baseBlockHours: 2,
    securityDepositCents: 20000, // $200
    maxDurationHours: 6,
  },
};

// ---------------------------------------------------------------------------
// Time Slot Restrictions
// ---------------------------------------------------------------------------

const TIME_SLOT_RESTRICTIONS: TimeSlotRestriction[] = [
  {
    type: 'move_in',
    allowedDays: [1, 2, 3, 4, 5], // Monday–Friday
    startHour: 9,
    endHour: 17, // 5 PM
    description: 'Move-in bookings are only allowed Monday to Friday, 9:00 AM to 5:00 PM',
  },
  {
    type: 'move_out',
    allowedDays: [1, 2, 3, 4, 5], // Monday–Friday
    startHour: 9,
    endHour: 17,
    description: 'Move-out bookings are only allowed Monday to Friday, 9:00 AM to 5:00 PM',
  },
  {
    type: 'delivery',
    allowedDays: [1, 2, 3, 4, 5, 6], // Monday–Saturday
    startHour: 8,
    endHour: 18, // 6 PM
    description: 'Delivery bookings are allowed Monday to Saturday, 8:00 AM to 6:00 PM',
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PADDING_MINUTES = 30;
const CANCELLATION_NOTICE_HOURS = 48;
const MAX_ADVANCE_BOOKING_DAYS = 90;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the fee and deposit for an elevator booking.
 *
 * @param type - The booking type (move_in, move_out, delivery)
 * @param durationHours - Requested duration in hours (must be positive)
 * @returns FeeCalculation with fee breakdown
 * @throws Error if duration exceeds maximum or is not positive
 */
export function calculateElevatorFee(
  type: ElevatorBookingType,
  durationHours: number,
): FeeCalculation {
  if (durationHours <= 0) {
    throw new Error('Duration must be a positive number of hours');
  }

  const schedule = FEE_SCHEDULES[type];
  if (!schedule) {
    throw new Error(`Invalid booking type: ${type as string}`);
  }

  if (durationHours > schedule.maxDurationHours) {
    throw new Error(
      `Duration ${durationHours}h exceeds maximum of ${schedule.maxDurationHours}h for ${type}`,
    );
  }

  // Calculate blocks: round up to nearest block
  const blocks = Math.ceil(durationHours / schedule.baseBlockHours);
  const feeCents = blocks * schedule.baseFeePerBlockCents;

  return {
    type,
    durationHours,
    blocks,
    feeCents,
    securityDepositCents: schedule.securityDepositCents,
    totalCents: feeCents + schedule.securityDepositCents,
  };
}

/**
 * Returns the complete set of elevator booking rules and restrictions.
 */
export function getElevatorBookingRules(): BookingRules {
  return {
    feeSchedules: Object.values(FEE_SCHEDULES),
    timeSlotRestrictions: TIME_SLOT_RESTRICTIONS,
    paddingMinutes: PADDING_MINUTES,
    cancellationNoticeHours: CANCELLATION_NOTICE_HOURS,
    maxAdvanceBookingDays: MAX_ADVANCE_BOOKING_DAYS,
    requiresInsuranceCertificate: true,
    requiresElevatorPadding: true,
    notes: [
      'Elevator pads must be installed before the booking start time',
      'Security deposit is refundable if no damage occurs',
      'Insurance certificate required for all move-in and move-out bookings',
      'Building reserves the right to cancel bookings on statutory holidays',
      'Overtime charges apply at 1.5x the base rate per additional block',
    ],
  };
}

/**
 * Returns the fee schedule for a specific booking type.
 */
export function getFeeSchedule(type: ElevatorBookingType): FeeSchedule {
  const schedule = FEE_SCHEDULES[type];
  if (!schedule) {
    throw new Error(`Invalid booking type: ${type as string}`);
  }
  return { ...schedule };
}

/**
 * Validates a requested time slot against the booking rules.
 *
 * @param type - The booking type
 * @param startTime - The requested start time
 * @param durationHours - The requested duration in hours
 * @returns TimeSlotValidation with any validation errors
 */
export function validateTimeSlot(
  type: ElevatorBookingType,
  startTime: Date,
  durationHours: number,
): TimeSlotValidation {
  const errors: string[] = [];

  if (durationHours <= 0) {
    errors.push('Duration must be a positive number of hours');
  }

  const schedule = FEE_SCHEDULES[type];
  if (!schedule) {
    return { valid: false, errors: [`Invalid booking type: ${type as string}`] };
  }

  if (durationHours > schedule.maxDurationHours) {
    errors.push(
      `Duration ${durationHours}h exceeds maximum of ${schedule.maxDurationHours}h for ${type}`,
    );
  }

  // Find restriction for this type
  const restriction = TIME_SLOT_RESTRICTIONS.find((r) => r.type === type);
  if (restriction) {
    const dayOfWeek = startTime.getDay();
    if (!restriction.allowedDays.includes(dayOfWeek)) {
      errors.push(restriction.description);
    }

    const startHour = startTime.getHours();
    if (startHour < restriction.startHour) {
      errors.push(`Booking cannot start before ${restriction.startHour}:00`);
    }

    // Check that the booking ends before the end hour
    const endHour = startHour + durationHours;
    if (endHour > restriction.endHour) {
      errors.push(`Booking must end by ${restriction.endHour}:00 (requested end: ${endHour}:00)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Returns the required padding time in minutes between consecutive bookings.
 */
export function getPaddingMinutes(): number {
  return PADDING_MINUTES;
}

/**
 * Checks if two booking time ranges conflict, accounting for padding.
 *
 * @param existingStart - Start of existing booking
 * @param existingEnd - End of existing booking
 * @param requestedStart - Start of requested booking
 * @param requestedEnd - End of requested booking
 * @returns true if the bookings conflict
 */
export function hasBookingConflict(
  existingStart: Date,
  existingEnd: Date,
  requestedStart: Date,
  requestedEnd: Date,
): boolean {
  const paddingMs = PADDING_MINUTES * 60 * 1000;
  const existingEndWithPadding = new Date(existingEnd.getTime() + paddingMs);
  const existingStartWithPadding = new Date(existingStart.getTime() - paddingMs);

  return requestedStart < existingEndWithPadding && requestedEnd > existingStartWithPadding;
}
