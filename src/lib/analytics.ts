/**
 * Concierge — Privacy-Respecting Analytics Framework
 *
 * All analytics are privacy-safe by design:
 * - PII is detected and stripped from every event
 * - User IDs are hashed before storage
 * - Tracking respects user consent
 *
 * See docs/tech/ANALYTICS-FRAMEWORK.md for the full specification.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface PageView {
  path: string;
  userId: string; // hashed
  timestamp: string;
}

export interface FeatureUsageRecord {
  feature: string;
  userId: string; // hashed
  timestamp: string;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  pageViews: PageView[];
  featureUsage: FeatureUsageRecord[];
}

// ---------------------------------------------------------------------------
// PII field names (case-insensitive matching)
// ---------------------------------------------------------------------------

const PII_FIELD_NAMES = new Set([
  'email',
  'phone',
  'name',
  'firstname',
  'lastname',
  'fullname',
  'userid',
  'ipaddress',
  'unitnumber',
]);

// ---------------------------------------------------------------------------
// PII patterns for inline detection within string values
// ---------------------------------------------------------------------------

// Matches common email patterns
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Matches common North American phone number formats:
// 416-555-1234, (905) 555-6789, 555.123.4567, +1-416-555-1234, etc.
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

let store: AnalyticsData = {
  events: [],
  pageViews: [],
  featureUsage: [],
};

let consentGiven = true;

// ---------------------------------------------------------------------------
// Hashing (simple deterministic hash for analytics — NOT cryptographic)
// ---------------------------------------------------------------------------

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  // Return as a hex string with a prefix to make it clearly a hash
  return 'anon_' + Math.abs(hash).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// PII stripping
// ---------------------------------------------------------------------------

/**
 * Remove PII fields and redact PII patterns from event properties.
 *
 * Rules (per ANALYTICS-FRAMEWORK.md):
 * 1. Known PII field names are removed entirely.
 * 2. Email addresses embedded in string values are replaced with [REDACTED].
 * 3. Phone numbers embedded in string values are replaced with [REDACTED].
 */
export function stripPII(properties: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Step 1: Drop known PII field names
    if (PII_FIELD_NAMES.has(key.toLowerCase())) {
      continue;
    }

    // Step 2 & 3: Redact PII patterns within string values
    if (typeof value === 'string') {
      let cleaned = value;
      cleaned = cleaned.replace(EMAIL_PATTERN, '[REDACTED]');
      cleaned = cleaned.replace(PHONE_PATTERN, '[REDACTED]');
      sanitized[key] = cleaned;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

/**
 * Set the user's analytics consent preference.
 * When false, all track* calls are silently dropped.
 */
export function setConsent(consented: boolean): void {
  consentGiven = consented;
}

// ---------------------------------------------------------------------------
// Core tracking functions
// ---------------------------------------------------------------------------

/**
 * Track a named event with privacy-safe properties.
 * PII is automatically stripped from all properties before storage.
 */
export function trackEvent(name: string, properties: Record<string, unknown> = {}): void {
  if (!consentGiven) return;

  store.events.push({
    name,
    properties: stripPII(properties),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a page view. The userId is hashed before storage so that
 * individual users cannot be identified from analytics data.
 */
export function trackPageView(path: string, userId: string): void {
  if (!consentGiven) return;

  store.pageViews.push({
    path,
    userId: hashString(userId),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track feature usage. The userId is hashed before storage.
 */
export function trackFeatureUsage(feature: string, userId: string): void {
  if (!consentGiven) return;

  store.featureUsage.push({
    feature,
    userId: hashString(userId),
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Data retrieval
// ---------------------------------------------------------------------------

/**
 * Retrieve all collected analytics data.
 * Optionally filter by date range (ISO date strings).
 */
export function getAnalytics(startDate?: string, endDate?: string): AnalyticsData {
  if (!startDate && !endDate) {
    return { ...store };
  }

  const start = startDate ? new Date(startDate).getTime() : 0;
  const end = endDate ? new Date(endDate).getTime() : Infinity;

  const inRange = (ts: string) => {
    const t = new Date(ts).getTime();
    return t >= start && t <= end;
  };

  return {
    events: store.events.filter((e) => inRange(e.timestamp)),
    pageViews: store.pageViews.filter((pv) => inRange(pv.timestamp)),
    featureUsage: store.featureUsage.filter((fu) => inRange(fu.timestamp)),
  };
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

/**
 * Count unique users active on a specific day (YYYY-MM-DD).
 * A user is "active" if they have at least one page view or feature usage.
 */
export function getDailyActiveUsers(date: string): number {
  const dayStart = new Date(`${date}T00:00:00Z`).getTime();
  const dayEnd = new Date(`${date}T23:59:59.999Z`).getTime();

  const inDay = (ts: string) => {
    const t = new Date(ts).getTime();
    return t >= dayStart && t <= dayEnd;
  };

  const uniqueUsers = new Set<string>();

  for (const pv of store.pageViews) {
    if (inDay(pv.timestamp)) {
      uniqueUsers.add(pv.userId);
    }
  }

  for (const fu of store.featureUsage) {
    if (inDay(fu.timestamp)) {
      uniqueUsers.add(fu.userId);
    }
  }

  return uniqueUsers.size;
}

/**
 * Calculate the percentage of all known users who have used a specific feature.
 * "All known users" = unique users seen in page views + feature usage.
 */
export function getFeatureAdoptionRate(feature: string): number {
  const allUsers = new Set<string>();

  for (const pv of store.pageViews) {
    allUsers.add(pv.userId);
  }
  for (const fu of store.featureUsage) {
    allUsers.add(fu.userId);
  }

  if (allUsers.size === 0) return 0;

  const featureUsers = new Set<string>();
  for (const fu of store.featureUsage) {
    if (fu.feature === feature) {
      featureUsers.add(fu.userId);
    }
  }

  return Math.round((featureUsers.size / allUsers.size) * 100);
}

/**
 * Return page view counts grouped by route path.
 */
export function getPageViewCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const pv of store.pageViews) {
    counts[pv.path] = (counts[pv.path] ?? 0) + 1;
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Export all events as a CSV string.
 * Format: timestamp, name, properties (JSON-encoded)
 */
export function exportAnalyticsCSV(): string {
  const header = 'timestamp,name,properties';
  const rows = store.events.map((e) => {
    const propsJson = JSON.stringify(e.properties).replace(/"/g, '""');
    return `${e.timestamp},${e.name},"${propsJson}"`;
  });

  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// Reset (for testing)
// ---------------------------------------------------------------------------

/**
 * Reset the in-memory analytics store. Used in tests only.
 */
export function resetAnalyticsStore(): void {
  store = {
    events: [],
    pageViews: [],
    featureUsage: [],
  };
  consentGiven = true;
}
