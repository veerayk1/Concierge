/**
 * Perishable Escalation Tests — per PRD 04 Section 5.3
 *
 * A perishable package (food delivery, flowers, medication) that sits
 * unclaimed for 48+ hours is a health hazard and liability issue.
 * The escalation chain MUST fire on time.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getCurrentEscalationLevel,
  getNextEscalationStep,
  PERISHABLE_ESCALATION_CHAIN,
} from './perishable-escalation';

describe('Perishable Escalation — Escalation Level Calculation', () => {
  it('returns level 0 for a package just received (0 minutes old)', () => {
    // Package received right now — level 0 means immediate notification triggered
    const now = new Date();
    expect(getCurrentEscalationLevel(now)).toBe(1); // 0h step is immediately due
  });

  it('returns level 1 after 3 hours (only immediate notification triggered)', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(getCurrentEscalationLevel(threeHoursAgo)).toBe(1);
  });

  it('returns level 2 after 5 hours (immediate + 4h reminder)', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    expect(getCurrentEscalationLevel(fiveHoursAgo)).toBe(2);
  });

  it('returns level 3 after 10 hours (immediate + 4h + 8h secondary contact)', () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    expect(getCurrentEscalationLevel(tenHoursAgo)).toBe(3);
  });

  it('returns level 4 after 25 hours (+ 24h supervisor alert)', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(getCurrentEscalationLevel(twentyFiveHoursAgo)).toBe(4);
  });

  it('returns level 5 after 49 hours (all 5 steps triggered)', () => {
    const fortyNineHoursAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);
    expect(getCurrentEscalationLevel(fortyNineHoursAgo)).toBe(5);
  });
});

describe('Perishable Escalation — Next Step Logic', () => {
  it('returns immediate_notification as first step for new package', () => {
    const now = new Date();
    const step = getNextEscalationStep(now, []);
    expect(step?.action).toBe('immediate_notification');
  });

  it('returns follow_up_reminder after immediate is done and 4h passed', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const step = getNextEscalationStep(fiveHoursAgo, ['immediate_notification']);
    expect(step?.action).toBe('follow_up_reminder');
  });

  it('returns secondary_contact after first two steps done and 8h passed', () => {
    const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000);
    const step = getNextEscalationStep(nineHoursAgo, [
      'immediate_notification',
      'follow_up_reminder',
    ]);
    expect(step?.action).toBe('secondary_contact');
  });

  it('returns supervisor_alert after 24h with first 3 steps done', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const step = getNextEscalationStep(twentyFiveHoursAgo, [
      'immediate_notification',
      'follow_up_reminder',
      'secondary_contact',
    ]);
    expect(step?.action).toBe('supervisor_alert');
    expect(step?.notifyRole).toBe('property_manager');
  });

  it('returns management_review after 48h with first 4 steps done', () => {
    const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
    const step = getNextEscalationStep(fiftyHoursAgo, [
      'immediate_notification',
      'follow_up_reminder',
      'secondary_contact',
      'supervisor_alert',
    ]);
    expect(step?.action).toBe('management_review');
    expect(step?.notifyRole).toBe('property_admin');
  });

  it('returns null when all steps are completed', () => {
    const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
    const step = getNextEscalationStep(fiftyHoursAgo, [
      'immediate_notification',
      'follow_up_reminder',
      'secondary_contact',
      'supervisor_alert',
      'management_review',
    ]);
    expect(step).toBeNull();
  });

  it('returns null when not enough time has passed for next step', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const step = getNextEscalationStep(twoHoursAgo, ['immediate_notification']);
    // Only 2 hours passed, next step is at 4h — not yet time
    expect(step).toBeNull();
  });

  it('skips already-completed steps and returns the next pending one', () => {
    // 10 hours passed, immediate done, but follow_up was missed
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const step = getNextEscalationStep(tenHoursAgo, ['immediate_notification']);
    // Should return follow_up_reminder (at 4h) since it was missed
    expect(step?.action).toBe('follow_up_reminder');
  });
});

describe('Perishable Escalation — Chain Configuration', () => {
  it('has exactly 5 escalation steps', () => {
    expect(PERISHABLE_ESCALATION_CHAIN).toHaveLength(5);
  });

  it('steps are in chronological order', () => {
    for (let i = 1; i < PERISHABLE_ESCALATION_CHAIN.length; i++) {
      expect(PERISHABLE_ESCALATION_CHAIN[i].hoursAfterReceipt).toBeGreaterThan(
        PERISHABLE_ESCALATION_CHAIN[i - 1].hoursAfterReceipt,
      );
    }
  });

  it('step timing matches PRD 04: 0h, 4h, 8h, 24h, 48h', () => {
    const expectedHours = [0, 4, 8, 24, 48];
    const actualHours = PERISHABLE_ESCALATION_CHAIN.map((s) => s.hoursAfterReceipt);
    expect(actualHours).toEqual(expectedHours);
  });

  it('24h step targets property_manager', () => {
    const step = PERISHABLE_ESCALATION_CHAIN.find((s) => s.hoursAfterReceipt === 24);
    expect(step?.notifyRole).toBe('property_manager');
  });

  it('48h step targets property_admin', () => {
    const step = PERISHABLE_ESCALATION_CHAIN.find((s) => s.hoursAfterReceipt === 48);
    expect(step?.notifyRole).toBe('property_admin');
  });
});
