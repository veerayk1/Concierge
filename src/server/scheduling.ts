/**
 * Recurring Task Scheduling Utilities
 *
 * Handles cron expression parsing, next occurrence calculation, and
 * occurrence generation for the preventive maintenance scheduler.
 *
 * Supports interval types: daily, weekly, biweekly, monthly, quarterly,
 * semiannually, annually, custom (cron expression).
 *
 * @module server/scheduling
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IntervalType =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannually'
  | 'annually'
  | 'custom';

export interface ScheduleConfig {
  intervalType: IntervalType;
  /** Custom cron expression (required when intervalType is 'custom') */
  cronExpression?: string;
  /** Custom interval in days (alternative to cron for simple custom schedules) */
  customIntervalDays?: number;
  /** Start date of the recurring schedule */
  startDate: Date;
  /** Optional end date — no occurrences generated after this */
  endDate?: Date | null;
}

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

// ---------------------------------------------------------------------------
// Cron Validation
// ---------------------------------------------------------------------------

/**
 * Validates a 5-field cron expression.
 * Format: minute hour day-of-month month day-of-week
 *
 * Supports: numbers, commas, hyphens, slashes, asterisks.
 *
 * @returns true if valid, false otherwise
 */
export function isValidCronExpression(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;

  const trimmed = expression.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 5) return false;

  const ranges: Array<{ min: number; max: number }> = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 6 }, // day of week (0=Sunday)
  ];

  for (let i = 0; i < 5; i++) {
    const part = parts[i]!;
    const range = ranges[i]!;
    if (!isValidCronField(part, range.min, range.max)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a single cron field against its valid range.
 */
function isValidCronField(field: string, min: number, max: number): boolean {
  // Asterisk matches all
  if (field === '*') return true;

  // Step values: */2, 1-5/2
  if (field.includes('/')) {
    const [range, stepStr] = field.split('/');
    if (!range || !stepStr) return false;
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step < 1 || step > max) return false;
    if (range === '*') return true;
    return isValidCronField(range, min, max);
  }

  // Comma-separated list: 1,3,5
  if (field.includes(',')) {
    return field.split(',').every((sub) => isValidCronField(sub, min, max));
  }

  // Range: 1-5
  if (field.includes('-')) {
    const [startStr, endStr] = field.split('-');
    if (!startStr || !endStr) return false;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
  }

  // Single value
  const val = parseInt(field, 10);
  return !isNaN(val) && val >= min && val <= max;
}

/**
 * Parses a cron expression into its 5 component parts.
 * Throws if the expression is invalid.
 */
export function parseCronExpression(expression: string): CronParts {
  if (!isValidCronExpression(expression)) {
    throw new Error(`Invalid cron expression: "${expression}"`);
  }

  const parts = expression.trim().split(/\s+/);
  return {
    minute: parts[0]!,
    hour: parts[1]!,
    dayOfMonth: parts[2]!,
    month: parts[3]!,
    dayOfWeek: parts[4]!,
  };
}

// ---------------------------------------------------------------------------
// Next Occurrence Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the next occurrence date from a schedule configuration.
 *
 * @param schedule - The schedule configuration
 * @param lastRun - The last time this task was generated/completed (null = use startDate)
 * @returns The next occurrence Date, or null if the schedule has ended
 */
export function calculateNextOccurrence(
  schedule: ScheduleConfig,
  lastRun: Date | null = null,
): Date | null {
  const baseDate = lastRun ?? schedule.startDate;

  let next: Date;

  switch (schedule.intervalType) {
    case 'daily':
      next = addDays(baseDate, 1);
      break;

    case 'weekly':
      next = addDays(baseDate, 7);
      break;

    case 'biweekly':
      next = addDays(baseDate, 14);
      break;

    case 'monthly':
      next = addMonths(baseDate, 1);
      break;

    case 'quarterly':
      next = addMonths(baseDate, 3);
      break;

    case 'semiannually':
      next = addMonths(baseDate, 6);
      break;

    case 'annually':
      next = addMonths(baseDate, 12);
      break;

    case 'custom':
      if (schedule.customIntervalDays && schedule.customIntervalDays > 0) {
        next = addDays(baseDate, schedule.customIntervalDays);
      } else if (schedule.cronExpression) {
        const result = getNextCronDate(schedule.cronExpression, baseDate);
        if (!result) return null;
        next = result;
      } else {
        return null;
      }
      break;

    default:
      return null;
  }

  // If the computed date is before the start date, use start date
  if (next < schedule.startDate) {
    next = new Date(schedule.startDate);
  }

  // If past end date, no more occurrences
  if (schedule.endDate && next > schedule.endDate) {
    return null;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Occurrence Generation
// ---------------------------------------------------------------------------

/**
 * Generates all occurrence dates within a date range for a schedule.
 * Used for calendar views (e.g., "next 30 days").
 *
 * @param schedule - The schedule configuration
 * @param rangeStart - Start of the range to generate occurrences for
 * @param rangeEnd - End of the range
 * @param maxOccurrences - Safety limit (default 366, one per day for a year)
 * @returns Array of occurrence dates within the range
 */
export function generateOccurrences(
  schedule: ScheduleConfig,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 366,
): Date[] {
  const occurrences: Date[] = [];

  // Start from the schedule start date or range start, whichever is later
  let current: Date | null = schedule.startDate > rangeStart ? new Date(schedule.startDate) : null;

  // If we need to find the first occurrence within range
  if (!current) {
    // Walk forward from startDate until we reach or pass rangeStart
    let walker: Date | null = new Date(schedule.startDate);
    while (walker && walker < rangeStart) {
      walker = calculateNextOccurrence(schedule, walker);
    }
    current = walker;
  }

  // Check if start date itself falls in range
  if (schedule.startDate >= rangeStart && schedule.startDate <= rangeEnd) {
    occurrences.push(new Date(schedule.startDate));
  }

  // Generate subsequent occurrences
  let lastRun = current ? new Date(current) : new Date(schedule.startDate);

  // If startDate is already added, start generating from after it
  if (occurrences.length > 0) {
    lastRun = occurrences[occurrences.length - 1]!;
  }

  while (occurrences.length < maxOccurrences) {
    const next = calculateNextOccurrence(schedule, lastRun);
    if (!next) break;
    if (next > rangeEnd) break;

    // Avoid duplicates and ensure forward progress
    if (next <= lastRun) break;

    if (next >= rangeStart) {
      occurrences.push(next);
    }

    lastRun = next;
  }

  return occurrences;
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCMonth(result.getUTCMonth() + months);
  // Handle month overflow (e.g., Jan 31 + 1 month = Feb 28, not Mar 3)
  if (result.getUTCDate() !== originalDay) {
    result.setUTCDate(0); // Set to last day of previous month
  }
  return result;
}

/**
 * Computes the next date matching a cron expression after `after`.
 * This is a simplified matcher supporting basic cron patterns.
 * For production-scale scheduling, consider a dedicated cron library.
 *
 * Checks each day starting from the day after `after` for up to 400 days.
 */
function getNextCronDate(expression: string, after: Date): Date | null {
  const cron = parseCronExpression(expression);

  const candidate = new Date(after);
  candidate.setUTCDate(candidate.getUTCDate() + 1);
  candidate.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < 400; i++) {
    if (matchesCron(candidate, cron)) {
      return new Date(candidate);
    }
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  return null;
}

/**
 * Checks if a date matches a parsed cron expression (day-level granularity).
 */
function matchesCron(date: Date, cron: CronParts): boolean {
  const dayOfMonth = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // 1-indexed
  const dayOfWeek = date.getUTCDay(); // 0=Sunday

  return (
    matchesCronField(cron.dayOfMonth, dayOfMonth) &&
    matchesCronField(cron.month, month) &&
    matchesCronField(cron.dayOfWeek, dayOfWeek)
  );
}

/**
 * Checks if a value matches a cron field pattern.
 */
function matchesCronField(field: string, value: number): boolean {
  if (field === '*') return true;

  // Step values
  if (field.includes('/')) {
    const [range, stepStr] = field.split('/');
    const step = parseInt(stepStr!, 10);
    if (range === '*') {
      return value % step === 0;
    }
    // Range with step: e.g., 1-30/5
    if (range!.includes('-')) {
      const [startStr, endStr] = range!.split('-');
      const start = parseInt(startStr!, 10);
      const end = parseInt(endStr!, 10);
      return value >= start && value <= end && (value - start) % step === 0;
    }
    const start = parseInt(range!, 10);
    return value >= start && (value - start) % step === 0;
  }

  // Comma-separated
  if (field.includes(',')) {
    return field.split(',').some((sub) => matchesCronField(sub, value));
  }

  // Range
  if (field.includes('-')) {
    const [startStr, endStr] = field.split('-');
    const start = parseInt(startStr!, 10);
    const end = parseInt(endStr!, 10);
    return value >= start && value <= end;
  }

  // Single value
  return parseInt(field, 10) === value;
}
