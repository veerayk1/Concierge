/**
 * Email Delivery Tracker Service Tests
 *
 * Validates delivery tracking, statistics aggregation, failed delivery
 * reporting, delivery rate calculation, and date range filtering.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  trackDelivery,
  getDeliveryStats,
  getFailedDeliveries,
  getDeliveryRate,
  clearRecords,
  getAllRecords,
  DELIVERY_STATUSES,
  type DeliveryStatus,
} from '../email-delivery-tracker';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRecords();
});

// ---------------------------------------------------------------------------
// trackDelivery
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — trackDelivery', () => {
  it('records a delivery event with correct fields', () => {
    const now = new Date('2026-03-19T10:00:00Z');
    const record = trackDelivery(
      'msg-1',
      'user@example.com',
      'prop-1',
      'sent',
      null,
      undefined,
      now,
    );

    expect(record.messageId).toBe('msg-1');
    expect(record.recipient).toBe('user@example.com');
    expect(record.propertyId).toBe('prop-1');
    expect(record.status).toBe('sent');
    expect(record.timestamp).toEqual(now);
    expect(record.id).toBeDefined();
  });

  it('records error reason for bounced status', () => {
    const record = trackDelivery('msg-2', 'bad@example.com', 'prop-1', 'bounced', 'Mailbox full');

    expect(record.status).toBe('bounced');
    expect(record.errorReason).toBe('Mailbox full');
  });

  it('records error reason for failed status', () => {
    const record = trackDelivery(
      'msg-3',
      'invalid@bad.com',
      'prop-1',
      'failed',
      'DNS lookup failed',
    );

    expect(record.status).toBe('failed');
    expect(record.errorReason).toBe('DNS lookup failed');
  });

  it('stores metadata when provided', () => {
    const meta = { templateId: 'welcome', campaignId: 'onboard-1' };
    const record = trackDelivery('msg-4', 'user@example.com', 'prop-1', 'queued', null, meta);

    expect(record.metadata).toEqual(meta);
  });

  it('generates unique IDs for each record', () => {
    const r1 = trackDelivery('msg-1', 'a@b.com', 'prop-1', 'queued');
    const r2 = trackDelivery('msg-2', 'c@d.com', 'prop-1', 'queued');

    expect(r1.id).not.toBe(r2.id);
  });

  it('allows multiple status records for the same message', () => {
    const t1 = new Date('2026-03-19T10:00:00Z');
    const t2 = new Date('2026-03-19T10:01:00Z');
    const t3 = new Date('2026-03-19T10:05:00Z');

    trackDelivery('msg-1', 'user@example.com', 'prop-1', 'queued', null, undefined, t1);
    trackDelivery('msg-1', 'user@example.com', 'prop-1', 'sent', null, undefined, t2);
    trackDelivery('msg-1', 'user@example.com', 'prop-1', 'delivered', null, undefined, t3);

    const allRecords = getAllRecords();
    const msg1Records = allRecords.filter((r) => r.messageId === 'msg-1');
    expect(msg1Records).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getDeliveryStats
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — getDeliveryStats', () => {
  it('returns correct counts per status (latest status per message)', () => {
    const t1 = new Date('2026-03-19T10:00:00Z');
    const t2 = new Date('2026-03-19T10:01:00Z');

    // msg-1: queued -> delivered (should count as delivered)
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'queued', null, undefined, t1);
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t2);

    // msg-2: queued -> bounced (should count as bounced)
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'queued', null, undefined, t1);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'bounced', 'Bad address', undefined, t2);

    // msg-3: still queued
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'queued', null, undefined, t1);

    const stats = getDeliveryStats('prop-1');

    expect(stats.delivered).toBe(1);
    expect(stats.bounced).toBe(1);
    expect(stats.queued).toBe(1);
    expect(stats.total).toBe(3);
  });

  it('returns empty stats for a new property', () => {
    const stats = getDeliveryStats('prop-new');

    expect(stats.total).toBe(0);
    expect(stats.queued).toBe(0);
    expect(stats.sent).toBe(0);
    expect(stats.delivered).toBe(0);
    expect(stats.bounced).toBe(0);
    expect(stats.failed).toBe(0);
  });

  it('counts opened and clicked statuses', () => {
    const t1 = new Date('2026-03-19T10:00:00Z');
    const t2 = new Date('2026-03-19T10:05:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t1);
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'opened', null, undefined, t2);

    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'opened', null, undefined, t1);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'clicked', null, undefined, t2);

    const stats = getDeliveryStats('prop-1');

    expect(stats.opened).toBe(1);
    expect(stats.clicked).toBe(1);
    expect(stats.total).toBe(2);
  });

  it('counts spam_reported status', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'spam_reported');

    const stats = getDeliveryStats('prop-1');

    expect(stats.spam_reported).toBe(1);
    expect(stats.total).toBe(1);
  });

  it('filters by date range', () => {
    const jan = new Date('2026-01-15T10:00:00Z');
    const feb = new Date('2026-02-15T10:00:00Z');
    const mar = new Date('2026-03-15T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, jan);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'delivered', null, undefined, feb);
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'delivered', null, undefined, mar);

    const stats = getDeliveryStats('prop-1', {
      from: new Date('2026-02-01T00:00:00Z'),
      to: new Date('2026-02-28T23:59:59Z'),
    });

    expect(stats.total).toBe(1);
    expect(stats.delivered).toBe(1);
  });

  it('tracks multiple recipients independently', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'alice@example.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-1', 'bob@example.com', 'prop-1', 'bounced', 'Bad address', undefined, t);
    trackDelivery('msg-1', 'carol@example.com', 'prop-1', 'delivered', null, undefined, t);

    const stats = getDeliveryStats('prop-1');

    expect(stats.delivered).toBe(2);
    expect(stats.bounced).toBe(1);
    expect(stats.total).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getFailedDeliveries
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — getFailedDeliveries', () => {
  it('returns only bounced and failed deliveries', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'bounced', 'Mailbox full', undefined, t);
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'failed', 'SMTP error', undefined, t);
    trackDelivery('msg-4', 'g@h.com', 'prop-1', 'opened', null, undefined, t);

    const failed = getFailedDeliveries('prop-1');

    expect(failed).toHaveLength(2);
    expect(failed.map((f) => f.status).sort()).toEqual(['bounced', 'failed']);
  });

  it('includes error reasons in failed deliveries', () => {
    trackDelivery('msg-1', 'bad@example.com', 'prop-1', 'bounced', 'Mailbox full');

    const failed = getFailedDeliveries('prop-1');

    expect(failed[0]!.errorReason).toBe('Mailbox full');
    expect(failed[0]!.recipient).toBe('bad@example.com');
    expect(failed[0]!.messageId).toBe('msg-1');
  });

  it('returns empty array when no failures exist', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered');

    const failed = getFailedDeliveries('prop-1');
    expect(failed).toHaveLength(0);
  });

  it('uses "Unknown error" when no error reason provided', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'failed');

    const failed = getFailedDeliveries('prop-1');
    expect(failed[0]!.errorReason).toBe('Unknown error');
  });

  it('sorts failed deliveries by most recent first', () => {
    const t1 = new Date('2026-03-19T08:00:00Z');
    const t2 = new Date('2026-03-19T12:00:00Z');

    trackDelivery('msg-old', 'a@b.com', 'prop-1', 'bounced', 'Old bounce', undefined, t1);
    trackDelivery('msg-new', 'c@d.com', 'prop-1', 'failed', 'New failure', undefined, t2);

    const failed = getFailedDeliveries('prop-1');

    expect(failed[0]!.messageId).toBe('msg-new');
    expect(failed[1]!.messageId).toBe('msg-old');
  });
});

// ---------------------------------------------------------------------------
// getDeliveryRate
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — getDeliveryRate', () => {
  it('returns 100% when all deliveries succeed', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'opened', null, undefined, t);

    const rate = getDeliveryRate('prop-1');

    expect(rate.rate).toBe(100);
    expect(rate.totalDelivered).toBe(3);
    expect(rate.totalTerminal).toBe(3);
  });

  it('calculates rate correctly with mixed results', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'opened', null, undefined, t);
    trackDelivery('msg-4', 'g@h.com', 'prop-1', 'bounced', 'Bad addr', undefined, t);

    const rate = getDeliveryRate('prop-1');

    // 3 delivered out of 4 terminal = 75%
    expect(rate.rate).toBe(75);
    expect(rate.totalDelivered).toBe(3);
    expect(rate.totalTerminal).toBe(4);
  });

  it('returns 100% for a new property with no emails', () => {
    const rate = getDeliveryRate('prop-empty');

    expect(rate.rate).toBe(100);
    expect(rate.totalTerminal).toBe(0);
    expect(rate.totalDelivered).toBe(0);
  });

  it('excludes queued and sent from rate calculation', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'queued', null, undefined, t);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'sent', null, undefined, t);
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'delivered', null, undefined, t);

    const rate = getDeliveryRate('prop-1');

    // Only 1 terminal (delivered), 0 failures => 100%
    expect(rate.rate).toBe(100);
    expect(rate.totalTerminal).toBe(1);
  });

  it('counts clicked as a successful delivery', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'clicked', null, undefined, t);
    trackDelivery('msg-2', 'c@d.com', 'prop-1', 'failed', 'Error', undefined, t);

    const rate = getDeliveryRate('prop-1');

    // 1 delivered (clicked) out of 2 terminal = 50%
    expect(rate.rate).toBe(50);
  });

  it('applies date range filter to rate calculation', () => {
    const jan = new Date('2026-01-15T10:00:00Z');
    const mar = new Date('2026-03-15T10:00:00Z');

    trackDelivery('msg-old', 'a@b.com', 'prop-1', 'bounced', 'Bad', undefined, jan);
    trackDelivery('msg-new', 'c@d.com', 'prop-1', 'delivered', null, undefined, mar);

    const rate = getDeliveryRate('prop-1', {
      from: new Date('2026-03-01T00:00:00Z'),
      to: new Date('2026-03-31T23:59:59Z'),
    });

    // Only March data: 1 delivered, 0 failed => 100%
    expect(rate.rate).toBe(100);
    expect(rate.totalTerminal).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tenant isolation
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — Tenant Isolation', () => {
  it('stats only include records for the specified property', () => {
    const t = new Date('2026-03-19T10:00:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t);
    trackDelivery('msg-2', 'c@d.com', 'prop-2', 'delivered', null, undefined, t);
    trackDelivery('msg-3', 'e@f.com', 'prop-1', 'bounced', 'Error', undefined, t);

    const stats1 = getDeliveryStats('prop-1');
    const stats2 = getDeliveryStats('prop-2');

    expect(stats1.total).toBe(2);
    expect(stats1.delivered).toBe(1);
    expect(stats1.bounced).toBe(1);

    expect(stats2.total).toBe(1);
    expect(stats2.delivered).toBe(1);
    expect(stats2.bounced).toBe(0);
  });

  it('failed deliveries are isolated by property', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'bounced', 'Error 1');
    trackDelivery('msg-2', 'c@d.com', 'prop-2', 'bounced', 'Error 2');

    const failed1 = getFailedDeliveries('prop-1');
    const failed2 = getFailedDeliveries('prop-2');

    expect(failed1).toHaveLength(1);
    expect(failed1[0]!.messageId).toBe('msg-1');

    expect(failed2).toHaveLength(1);
    expect(failed2[0]!.messageId).toBe('msg-2');
  });
});

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — Status Transitions', () => {
  it('latest status wins when same message has multiple statuses', () => {
    const t1 = new Date('2026-03-19T10:00:00Z');
    const t2 = new Date('2026-03-19T10:01:00Z');
    const t3 = new Date('2026-03-19T10:02:00Z');

    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'queued', null, undefined, t1);
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'sent', null, undefined, t2);
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'delivered', null, undefined, t3);

    const stats = getDeliveryStats('prop-1');

    expect(stats.queued).toBe(0);
    expect(stats.sent).toBe(0);
    expect(stats.delivered).toBe(1);
    expect(stats.total).toBe(1);
  });

  it('all 8 delivery statuses are defined', () => {
    expect(DELIVERY_STATUSES).toHaveLength(8);
    expect(DELIVERY_STATUSES).toContain('queued');
    expect(DELIVERY_STATUSES).toContain('sent');
    expect(DELIVERY_STATUSES).toContain('delivered');
    expect(DELIVERY_STATUSES).toContain('opened');
    expect(DELIVERY_STATUSES).toContain('clicked');
    expect(DELIVERY_STATUSES).toContain('bounced');
    expect(DELIVERY_STATUSES).toContain('failed');
    expect(DELIVERY_STATUSES).toContain('spam_reported');
  });
});

// ---------------------------------------------------------------------------
// Spam report handling
// ---------------------------------------------------------------------------

describe('Email Delivery Tracker — Spam Reports', () => {
  it('spam_reported is tracked as a distinct status', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'spam_reported');

    const stats = getDeliveryStats('prop-1');
    expect(stats.spam_reported).toBe(1);
  });

  it('spam_reported does not count as failed delivery', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'spam_reported');

    const failed = getFailedDeliveries('prop-1');
    expect(failed).toHaveLength(0);
  });

  it('spam_reported does not count in delivery rate terminal states', () => {
    trackDelivery('msg-1', 'a@b.com', 'prop-1', 'spam_reported');

    const rate = getDeliveryRate('prop-1');
    // spam_reported is not a terminal state for rate calculation
    expect(rate.totalTerminal).toBe(0);
    expect(rate.rate).toBe(100);
  });
});
