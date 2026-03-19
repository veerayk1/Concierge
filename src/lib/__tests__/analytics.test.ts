/**
 * Concierge — Analytics Framework Tests
 *
 * Privacy-respecting analytics: event tracking, PII detection/stripping,
 * page views, feature usage, aggregations, CSV export, and consent.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  trackEvent,
  trackPageView,
  trackFeatureUsage,
  getAnalytics,
  getDailyActiveUsers,
  getFeatureAdoptionRate,
  getPageViewCounts,
  exportAnalyticsCSV,
  setConsent,
  stripPII,
  resetAnalyticsStore,
} from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoTimestamp(value: unknown): boolean {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('analytics', () => {
  beforeEach(() => {
    resetAnalyticsStore();
    setConsent(true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- 1. trackEvent records event with timestamp -------------------------

  describe('trackEvent', () => {
    it('records an event with a timestamp', () => {
      const now = new Date('2026-03-18T12:00:00Z');
      vi.setSystemTime(now);

      trackEvent('package.created', { courier: 'fedex' });

      const data = getAnalytics();
      expect(data.events).toHaveLength(1);
      expect(data.events[0]!.name).toBe('package.created');
      expect(data.events[0]!.properties.courier).toBe('fedex');
      expect(isoTimestamp(data.events[0]!.timestamp)).toBe(true);
      expect(data.events[0]!.timestamp).toBe('2026-03-18T12:00:00.000Z');
    });
  });

  // ---- 2. Event properties are sanitized (no PII) -------------------------

  describe('PII sanitization', () => {
    it('strips PII from event properties', () => {
      trackEvent('maintenance.created', {
        category: 'plumbing',
        email: 'john@example.com',
        phone: '416-555-1234',
        name: 'John Doe',
      });

      const data = getAnalytics();
      const props = data.events[0]!.properties;
      expect(props.category).toBe('plumbing');
      expect(props.email).toBeUndefined();
      expect(props.phone).toBeUndefined();
      expect(props.name).toBeUndefined();
    });

    // ---- 3. PII detection: email addresses stripped -----------------------

    it('strips email addresses embedded in string values', () => {
      trackEvent('search.performed', {
        query: 'contact john@example.com for details',
        resultCount: 5,
      });

      const data = getAnalytics();
      const props = data.events[0]!.properties;
      expect(props.query).not.toContain('john@example.com');
      expect(props.resultCount).toBe(5);
    });

    // ---- 4. PII detection: phone numbers stripped -------------------------

    it('strips phone numbers embedded in string values', () => {
      trackEvent('search.performed', {
        query: 'call me at 416-555-1234 or (905) 555-6789',
        resultCount: 0,
      });

      const data = getAnalytics();
      const props = data.events[0]!.properties;
      expect(props.query).not.toContain('416-555-1234');
      expect(props.query).not.toContain('(905) 555-6789');
    });

    // ---- 5. PII detection: names not tracked ------------------------------

    it('removes known PII field names regardless of casing', () => {
      trackEvent('admin.settingsUpdated', {
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        userId: 'usr_123',
        ipAddress: '192.168.1.1',
        unitNumber: '1502',
      });

      const data = getAnalytics();
      const props = data.events[0]!.properties;
      expect(props.firstName).toBeUndefined();
      expect(props.lastName).toBeUndefined();
      expect(props.fullName).toBeUndefined();
      expect(props.userId).toBeUndefined();
      expect(props.ipAddress).toBeUndefined();
      expect(props.unitNumber).toBeUndefined();
    });
  });

  // ---- 6. Page view tracking ----------------------------------------------

  describe('trackPageView', () => {
    it('records a page view with path and hashed userId', () => {
      const now = new Date('2026-03-18T14:00:00Z');
      vi.setSystemTime(now);

      trackPageView('/dashboard', 'user-abc-123');

      const data = getAnalytics();
      expect(data.pageViews).toHaveLength(1);
      expect(data.pageViews[0]!.path).toBe('/dashboard');
      // userId should be hashed, not stored raw
      expect(data.pageViews[0]!.userId).not.toBe('user-abc-123');
      expect(typeof data.pageViews[0]!.userId).toBe('string');
      expect(data.pageViews[0]!.userId.length).toBeGreaterThan(0);
      expect(isoTimestamp(data.pageViews[0]!.timestamp)).toBe(true);
    });
  });

  // ---- 7. Feature usage tracking ------------------------------------------

  describe('trackFeatureUsage', () => {
    it('records feature usage with feature name and hashed userId', () => {
      trackFeatureUsage('amenity.booking', 'user-xyz-456');

      const data = getAnalytics();
      expect(data.featureUsage).toHaveLength(1);
      expect(data.featureUsage[0]!.feature).toBe('amenity.booking');
      // userId should be hashed
      expect(data.featureUsage[0]!.userId).not.toBe('user-xyz-456');
      expect(typeof data.featureUsage[0]!.userId).toBe('string');
    });
  });

  // ---- 8. Aggregate: daily active users count -----------------------------

  describe('getDailyActiveUsers', () => {
    it('counts unique users active on a given day', () => {
      vi.setSystemTime(new Date('2026-03-18T10:00:00Z'));
      trackPageView('/dashboard', 'user-1');
      trackPageView('/packages', 'user-2');
      trackPageView('/settings', 'user-1'); // duplicate user

      vi.setSystemTime(new Date('2026-03-19T10:00:00Z'));
      trackPageView('/dashboard', 'user-3');

      const dau = getDailyActiveUsers('2026-03-18');
      expect(dau).toBe(2);
    });
  });

  // ---- 9. Aggregate: feature adoption rate --------------------------------

  describe('getFeatureAdoptionRate', () => {
    it('returns percentage of users who used a feature', () => {
      trackFeatureUsage('amenity.booking', 'user-1');
      trackFeatureUsage('amenity.booking', 'user-2');
      trackFeatureUsage('maintenance.create', 'user-3');
      trackPageView('/dashboard', 'user-4'); // active user but did not use amenity.booking

      // 2 out of 4 unique users used amenity.booking
      const rate = getFeatureAdoptionRate('amenity.booking');
      expect(rate).toBe(50);
    });
  });

  // ---- 10. Aggregate: page view counts per route --------------------------

  describe('getPageViewCounts', () => {
    it('returns page view counts grouped by route', () => {
      trackPageView('/dashboard', 'user-1');
      trackPageView('/dashboard', 'user-2');
      trackPageView('/packages', 'user-1');
      trackPageView('/settings', 'user-3');
      trackPageView('/packages', 'user-2');

      const counts = getPageViewCounts();
      expect(counts).toEqual({
        '/dashboard': 2,
        '/packages': 2,
        '/settings': 1,
      });
    });
  });

  // ---- 11. Export analytics data as CSV -----------------------------------

  describe('exportAnalyticsCSV', () => {
    it('exports events as CSV with headers', () => {
      vi.setSystemTime(new Date('2026-03-18T12:00:00Z'));
      trackEvent('package.created', { courier: 'ups' });

      vi.setSystemTime(new Date('2026-03-18T13:00:00Z'));
      trackEvent('amenity.booked', { amenityType: 'gym' });

      const csv = exportAnalyticsCSV();
      const lines = csv.trim().split('\n');

      expect(lines[0]).toBe('timestamp,name,properties');
      expect(lines).toHaveLength(3); // header + 2 events
      expect(lines[1]).toContain('package.created');
      expect(lines[2]).toContain('amenity.booked');
    });
  });

  // ---- 12. Consent-based: only track if user has consented ----------------

  describe('consent management', () => {
    it('does not track events when consent is not given', () => {
      setConsent(false);

      trackEvent('package.created', { courier: 'fedex' });
      trackPageView('/dashboard', 'user-1');
      trackFeatureUsage('amenity.booking', 'user-1');

      const data = getAnalytics();
      expect(data.events).toHaveLength(0);
      expect(data.pageViews).toHaveLength(0);
      expect(data.featureUsage).toHaveLength(0);
    });

    it('resumes tracking when consent is granted', () => {
      setConsent(false);
      trackEvent('package.created', { courier: 'fedex' });

      setConsent(true);
      trackEvent('amenity.booked', { amenityType: 'gym' });

      const data = getAnalytics();
      expect(data.events).toHaveLength(1);
      expect(data.events[0]!.name).toBe('amenity.booked');
    });
  });

  // ---- stripPII unit tests ------------------------------------------------

  describe('stripPII', () => {
    it('returns safe properties unchanged', () => {
      const result = stripPII({ courier: 'fedex', hasPhoto: true });
      expect(result).toEqual({ courier: 'fedex', hasPhoto: true });
    });

    it('removes all PII fields', () => {
      const result = stripPII({
        email: 'test@test.com',
        phone: '555-1234',
        name: 'Test',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        userId: '123',
        ipAddress: '1.2.3.4',
        unitNumber: '101',
      });
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('redacts email patterns within string values', () => {
      const result = stripPII({ note: 'Email me at foo@bar.com please' });
      expect(result.note).not.toContain('foo@bar.com');
      expect(result.note).toContain('[REDACTED]');
    });

    it('redacts phone patterns within string values', () => {
      const result = stripPII({ note: 'Call 416-555-0199' });
      expect(result.note).not.toContain('416-555-0199');
      expect(result.note).toContain('[REDACTED]');
    });
  });
});
