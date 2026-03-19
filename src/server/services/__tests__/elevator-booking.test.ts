/**
 * Elevator Booking Service Tests
 *
 * Validates fee calculations, time slot restrictions, padding logic,
 * and booking conflict detection for move-in/move-out elevator bookings.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateElevatorFee,
  getElevatorBookingRules,
  getFeeSchedule,
  getPaddingMinutes,
  hasBookingConflict,
  validateTimeSlot,
  type ElevatorBookingType,
} from '../elevator-booking';

// ---------------------------------------------------------------------------
// Fee Calculation — Move-In
// ---------------------------------------------------------------------------

describe('Elevator Booking — Move-In Fees', () => {
  it('calculates fee for exactly one block (4hr)', () => {
    const result = calculateElevatorFee('move_in', 4);
    expect(result.feeCents).toBe(15000); // $150
    expect(result.blocks).toBe(1);
  });

  it('calculates fee for two blocks (8hr)', () => {
    const result = calculateElevatorFee('move_in', 8);
    expect(result.feeCents).toBe(30000); // $300
    expect(result.blocks).toBe(2);
  });

  it('rounds up partial blocks (5hr = 2 blocks)', () => {
    const result = calculateElevatorFee('move_in', 5);
    expect(result.blocks).toBe(2);
    expect(result.feeCents).toBe(30000);
  });

  it('returns correct security deposit for move-in', () => {
    const result = calculateElevatorFee('move_in', 4);
    expect(result.securityDepositCents).toBe(50000); // $500
  });

  it('returns correct total (fee + deposit)', () => {
    const result = calculateElevatorFee('move_in', 4);
    expect(result.totalCents).toBe(15000 + 50000); // $650
  });

  it('throws on duration exceeding max (12hr)', () => {
    expect(() => calculateElevatorFee('move_in', 13)).toThrow('exceeds maximum');
  });

  it('allows maximum duration (12hr)', () => {
    const result = calculateElevatorFee('move_in', 12);
    expect(result.blocks).toBe(3);
    expect(result.feeCents).toBe(45000);
  });
});

// ---------------------------------------------------------------------------
// Fee Calculation — Move-Out
// ---------------------------------------------------------------------------

describe('Elevator Booking — Move-Out Fees', () => {
  it('calculates fee for one block (4hr)', () => {
    const result = calculateElevatorFee('move_out', 4);
    expect(result.feeCents).toBe(15000);
    expect(result.securityDepositCents).toBe(50000);
  });

  it('calculates fee for two blocks (8hr)', () => {
    const result = calculateElevatorFee('move_out', 8);
    expect(result.feeCents).toBe(30000);
    expect(result.blocks).toBe(2);
  });

  it('returns correct total for move-out', () => {
    const result = calculateElevatorFee('move_out', 4);
    expect(result.totalCents).toBe(65000);
  });
});

// ---------------------------------------------------------------------------
// Fee Calculation — Delivery
// ---------------------------------------------------------------------------

describe('Elevator Booking — Delivery Fees', () => {
  it('calculates fee for one block (2hr)', () => {
    const result = calculateElevatorFee('delivery', 2);
    expect(result.feeCents).toBe(7500); // $75
    expect(result.blocks).toBe(1);
  });

  it('calculates fee for two blocks (4hr)', () => {
    const result = calculateElevatorFee('delivery', 4);
    expect(result.feeCents).toBe(15000); // $150
    expect(result.blocks).toBe(2);
  });

  it('returns correct security deposit for delivery', () => {
    const result = calculateElevatorFee('delivery', 2);
    expect(result.securityDepositCents).toBe(20000); // $200
  });

  it('rounds up partial delivery blocks (3hr = 2 blocks)', () => {
    const result = calculateElevatorFee('delivery', 3);
    expect(result.blocks).toBe(2);
    expect(result.feeCents).toBe(15000);
  });

  it('throws on delivery duration exceeding max (6hr)', () => {
    expect(() => calculateElevatorFee('delivery', 7)).toThrow('exceeds maximum');
  });

  it('allows max delivery duration (6hr)', () => {
    const result = calculateElevatorFee('delivery', 6);
    expect(result.blocks).toBe(3);
    expect(result.feeCents).toBe(22500);
  });
});

// ---------------------------------------------------------------------------
// Fee Calculation — Edge Cases
// ---------------------------------------------------------------------------

describe('Elevator Booking — Fee Edge Cases', () => {
  it('throws on zero duration', () => {
    expect(() => calculateElevatorFee('move_in', 0)).toThrow('positive number');
  });

  it('throws on negative duration', () => {
    expect(() => calculateElevatorFee('move_in', -1)).toThrow('positive number');
  });

  it('handles fractional hours (1.5hr delivery = 1 block)', () => {
    const result = calculateElevatorFee('delivery', 1.5);
    expect(result.blocks).toBe(1);
    expect(result.feeCents).toBe(7500);
  });

  it('returns the booking type in the result', () => {
    const result = calculateElevatorFee('move_in', 4);
    expect(result.type).toBe('move_in');
  });

  it('returns the requested duration in the result', () => {
    const result = calculateElevatorFee('delivery', 2);
    expect(result.durationHours).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Time Slot Validation
// ---------------------------------------------------------------------------

describe('Elevator Booking — Time Slot Validation', () => {
  // Wednesday at 10 AM
  const validWeekday = new Date('2026-03-18T10:00:00');
  // Sunday at 10 AM
  const sunday = new Date('2026-03-22T10:00:00');
  // Saturday at 10 AM
  const saturday = new Date('2026-03-21T10:00:00');

  it('accepts move-in on a weekday within hours', () => {
    const result = validateTimeSlot('move_in', validWeekday, 4);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects move-in on Sunday', () => {
    const result = validateTimeSlot('move_in', sunday, 4);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects move-out on Saturday', () => {
    const result = validateTimeSlot('move_out', saturday, 4);
    expect(result.valid).toBe(false);
  });

  it('accepts delivery on Saturday', () => {
    const result = validateTimeSlot('delivery', saturday, 2);
    expect(result.valid).toBe(true);
  });

  it('rejects delivery on Sunday', () => {
    const result = validateTimeSlot('delivery', sunday, 2);
    expect(result.valid).toBe(false);
  });

  it('rejects move-in starting too early (7 AM)', () => {
    const earlyStart = new Date('2026-03-18T07:00:00');
    const result = validateTimeSlot('move_in', earlyStart, 4);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('before'))).toBe(true);
  });

  it('rejects booking that would end after allowed hours', () => {
    // Start at 3 PM, 4 hours = end at 7 PM, but move-in ends at 5 PM
    const lateStart = new Date('2026-03-18T15:00:00');
    const result = validateTimeSlot('move_in', lateStart, 4);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('end by'))).toBe(true);
  });

  it('rejects zero duration', () => {
    const result = validateTimeSlot('move_in', validWeekday, 0);
    expect(result.valid).toBe(false);
  });

  it('rejects duration exceeding max', () => {
    const result = validateTimeSlot('delivery', validWeekday, 8);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeds maximum'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Padding
// ---------------------------------------------------------------------------

describe('Elevator Booking — Padding', () => {
  it('returns 30 minutes padding', () => {
    expect(getPaddingMinutes()).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Booking Conflict Detection
// ---------------------------------------------------------------------------

describe('Elevator Booking — Conflict Detection', () => {
  const baseStart = new Date('2026-03-18T10:00:00');
  const baseEnd = new Date('2026-03-18T14:00:00');

  it('detects overlapping bookings', () => {
    const reqStart = new Date('2026-03-18T12:00:00');
    const reqEnd = new Date('2026-03-18T16:00:00');
    expect(hasBookingConflict(baseStart, baseEnd, reqStart, reqEnd)).toBe(true);
  });

  it('detects conflict within padding window', () => {
    // Existing ends at 14:00, padding = 30 min, so 14:15 should conflict
    const reqStart = new Date('2026-03-18T14:15:00');
    const reqEnd = new Date('2026-03-18T16:15:00');
    expect(hasBookingConflict(baseStart, baseEnd, reqStart, reqEnd)).toBe(true);
  });

  it('allows booking after padding window', () => {
    // Existing ends at 14:00, padding = 30 min, 14:31 should be fine
    const reqStart = new Date('2026-03-18T14:31:00');
    const reqEnd = new Date('2026-03-18T16:31:00');
    expect(hasBookingConflict(baseStart, baseEnd, reqStart, reqEnd)).toBe(false);
  });

  it('detects conflict when booking starts before padding window of existing start', () => {
    // Existing starts at 10:00, padding = 30 min before, so 9:35-9:50 should conflict
    const reqStart = new Date('2026-03-18T09:35:00');
    const reqEnd = new Date('2026-03-18T09:50:00');
    expect(hasBookingConflict(baseStart, baseEnd, reqStart, reqEnd)).toBe(true);
  });

  it('allows booking well before existing', () => {
    const reqStart = new Date('2026-03-18T06:00:00');
    const reqEnd = new Date('2026-03-18T09:00:00');
    expect(hasBookingConflict(baseStart, baseEnd, reqStart, reqEnd)).toBe(false);
  });

  it('detects fully contained booking as conflict', () => {
    const reqStart = new Date('2026-03-18T11:00:00');
    const reqEnd = new Date('2026-03-18T13:00:00');
    expect(hasBookingConflict(baseStart, baseEnd, reqStart, reqEnd)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Booking Rules
// ---------------------------------------------------------------------------

describe('Elevator Booking — Rules', () => {
  it('returns complete booking rules', () => {
    const rules = getElevatorBookingRules();
    expect(rules.feeSchedules).toHaveLength(3);
    expect(rules.timeSlotRestrictions).toHaveLength(3);
    expect(rules.paddingMinutes).toBe(30);
    expect(rules.cancellationNoticeHours).toBe(48);
    expect(rules.maxAdvanceBookingDays).toBe(90);
  });

  it('rules include insurance certificate requirement', () => {
    const rules = getElevatorBookingRules();
    expect(rules.requiresInsuranceCertificate).toBe(true);
  });

  it('rules include elevator padding requirement', () => {
    const rules = getElevatorBookingRules();
    expect(rules.requiresElevatorPadding).toBe(true);
  });

  it('rules include descriptive notes', () => {
    const rules = getElevatorBookingRules();
    expect(rules.notes.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Fee Schedule Lookup
// ---------------------------------------------------------------------------

describe('Elevator Booking — Fee Schedule Lookup', () => {
  it('returns fee schedule for move_in', () => {
    const schedule = getFeeSchedule('move_in');
    expect(schedule.baseFeePerBlockCents).toBe(15000);
    expect(schedule.baseBlockHours).toBe(4);
    expect(schedule.securityDepositCents).toBe(50000);
  });

  it('returns fee schedule for delivery', () => {
    const schedule = getFeeSchedule('delivery');
    expect(schedule.baseFeePerBlockCents).toBe(7500);
    expect(schedule.baseBlockHours).toBe(2);
    expect(schedule.securityDepositCents).toBe(20000);
  });

  it('returns a copy (not the original object)', () => {
    const schedule1 = getFeeSchedule('move_in');
    const schedule2 = getFeeSchedule('move_in');
    expect(schedule1).toEqual(schedule2);
    expect(schedule1).not.toBe(schedule2);
  });
});
