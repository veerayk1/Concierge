/**
 * Concierge — Email Delivery Tracker Service
 *
 * Tracks email delivery status across the notification pipeline.
 * Supports the full email lifecycle: queued -> sent -> delivered -> opened -> clicked,
 * with failure states: bounced, failed, spam_reported.
 *
 * Provides delivery rate calculations and failed delivery reports for
 * property managers to monitor communication health.
 *
 * @module server/services/email-delivery-tracker
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** All possible email delivery statuses. */
export type DeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'spam_reported';

/** All valid delivery status values. */
export const DELIVERY_STATUSES: DeliveryStatus[] = [
  'queued',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed',
  'spam_reported',
];

/** A single delivery tracking record. */
export interface DeliveryRecord {
  id: string;
  messageId: string;
  recipient: string;
  propertyId: string;
  status: DeliveryStatus;
  errorReason?: string | null;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/** Aggregated delivery statistics. */
export interface DeliveryStats {
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  spam_reported: number;
  total: number;
}

/** A failed delivery entry for reporting. */
export interface FailedDelivery {
  messageId: string;
  recipient: string;
  status: 'bounced' | 'failed';
  errorReason: string;
  timestamp: Date;
}

/** Date range filter. */
export interface DateRange {
  from: Date;
  to: Date;
}

/** Delivery rate result. */
export interface DeliveryRate {
  /** Percentage of emails that reached delivered/opened/clicked status. */
  rate: number;
  /** Total emails that reached a terminal state (delivered + opened + clicked + bounced + failed). */
  totalTerminal: number;
  /** Total emails that were successfully delivered (delivered + opened + clicked). */
  totalDelivered: number;
}

// ---------------------------------------------------------------------------
// In-memory store (production would use database)
// ---------------------------------------------------------------------------

let records: DeliveryRecord[] = [];
let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `edt_${Date.now()}_${idCounter}`;
}

/**
 * Clear all tracking records (primarily for testing).
 */
export function clearRecords(): void {
  records = [];
  idCounter = 0;
}

/**
 * Get all records (primarily for testing).
 */
export function getAllRecords(): DeliveryRecord[] {
  return [...records];
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Track a delivery event for an email message.
 *
 * Each call creates a new record capturing the status at a point in time.
 * Multiple records can exist for the same messageId+recipient as the email
 * progresses through statuses (queued -> sent -> delivered -> opened).
 *
 * @param messageId - The email message identifier (from the email provider)
 * @param recipient - The recipient email address
 * @param propertyId - The property this email relates to (tenant isolation)
 * @param status - The delivery status
 * @param errorReason - Optional error reason for bounced/failed statuses
 * @param metadata - Optional additional metadata
 * @param now - Current time (for testability)
 * @returns The created delivery record
 */
export function trackDelivery(
  messageId: string,
  recipient: string,
  propertyId: string,
  status: DeliveryStatus,
  errorReason?: string | null,
  metadata?: Record<string, unknown>,
  now: Date = new Date(),
): DeliveryRecord {
  const record: DeliveryRecord = {
    id: generateId(),
    messageId,
    recipient,
    propertyId,
    status,
    errorReason: errorReason ?? null,
    timestamp: now,
    metadata,
  };

  records.push(record);
  return record;
}

/**
 * Get aggregated delivery statistics for a property.
 *
 * Counts are based on the latest status for each unique messageId+recipient
 * combination. If a message was queued, then sent, then delivered, it counts
 * only as "delivered" (the latest status).
 *
 * @param propertyId - The property to get stats for
 * @param dateRange - Optional date range filter
 * @returns Aggregated delivery stats
 */
export function getDeliveryStats(propertyId: string, dateRange?: DateRange): DeliveryStats {
  const filtered = filterRecords(propertyId, dateRange);
  const latestByKey = getLatestStatusPerMessage(filtered);

  const stats: DeliveryStats = {
    queued: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
    spam_reported: 0,
    total: 0,
  };

  for (const record of latestByKey.values()) {
    stats[record.status]++;
    stats.total++;
  }

  return stats;
}

/**
 * Get all failed/bounced deliveries for a property.
 *
 * Returns only messages whose latest status is 'bounced' or 'failed'.
 *
 * @param propertyId - The property to check
 * @param dateRange - Optional date range filter
 * @returns List of failed deliveries with error reasons
 */
export function getFailedDeliveries(propertyId: string, dateRange?: DateRange): FailedDelivery[] {
  const filtered = filterRecords(propertyId, dateRange);
  const latestByKey = getLatestStatusPerMessage(filtered);

  const failed: FailedDelivery[] = [];

  for (const record of latestByKey.values()) {
    if (record.status === 'bounced' || record.status === 'failed') {
      failed.push({
        messageId: record.messageId,
        recipient: record.recipient,
        status: record.status,
        errorReason: record.errorReason ?? 'Unknown error',
        timestamp: record.timestamp,
      });
    }
  }

  return failed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Calculate the delivery success rate for a property.
 *
 * Rate = (delivered + opened + clicked) / (delivered + opened + clicked + bounced + failed)
 *
 * Only considers messages that reached a terminal state. Messages still
 * queued or sent are not counted.
 *
 * @param propertyId - The property to check
 * @param dateRange - Optional date range filter
 * @returns Delivery rate as a percentage (0-100)
 */
export function getDeliveryRate(propertyId: string, dateRange?: DateRange): DeliveryRate {
  const stats = getDeliveryStats(propertyId, dateRange);

  const totalDelivered = stats.delivered + stats.opened + stats.clicked;
  const totalTerminal = totalDelivered + stats.bounced + stats.failed;

  // If no terminal states yet, rate is 100% (no failures)
  const rate = totalTerminal === 0 ? 100 : Math.round((totalDelivered / totalTerminal) * 100);

  return { rate, totalTerminal, totalDelivered };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Filter records by propertyId and optional date range.
 */
function filterRecords(propertyId: string, dateRange?: DateRange): DeliveryRecord[] {
  return records.filter((r) => {
    if (r.propertyId !== propertyId) return false;
    if (dateRange) {
      if (r.timestamp < dateRange.from || r.timestamp > dateRange.to) return false;
    }
    return true;
  });
}

/**
 * For each unique messageId+recipient pair, keep only the latest record.
 */
function getLatestStatusPerMessage(filteredRecords: DeliveryRecord[]): Map<string, DeliveryRecord> {
  const map = new Map<string, DeliveryRecord>();

  for (const record of filteredRecords) {
    const key = `${record.messageId}::${record.recipient}`;
    const existing = map.get(key);
    if (!existing || record.timestamp > existing.timestamp) {
      map.set(key, record);
    }
  }

  return map;
}
