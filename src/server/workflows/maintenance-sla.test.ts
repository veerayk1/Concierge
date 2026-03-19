/**
 * Maintenance SLA Enforcement Tests — per PRD 05
 *
 * Each maintenance category has an SLA timer. When a request exceeds
 * its SLA, it gets flagged and escalated through priority bumps and
 * notifications to property manager and admin.
 */

import { describe, expect, it } from 'vitest';
import { calculateSlaStatus, getSlaPriorityBump, DEFAULT_SLA_HOURS } from './maintenance-sla';

// ---------------------------------------------------------------------------
// SLA Status Calculation
// ---------------------------------------------------------------------------
describe('Maintenance SLA — calculateSlaStatus', () => {
  it('returns within_sla when 0 hours have elapsed', () => {
    const now = new Date();
    expect(calculateSlaStatus(now, 24)).toBe('within_sla');
  });

  it('returns within_sla at exactly 74% of SLA time', () => {
    // 74% of 24h = 17.76h
    const hoursAgo = 24 * 0.74;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('within_sla');
  });

  it('returns approaching at exactly 75% of SLA time', () => {
    // 75% of 24h = 18h
    const hoursAgo = 24 * 0.75;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('approaching');
  });

  it('returns approaching at 90% of SLA time', () => {
    const hoursAgo = 24 * 0.9;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('approaching');
  });

  it('returns approaching at 99% of SLA time', () => {
    const hoursAgo = 24 * 0.99;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('approaching');
  });

  it('returns overdue at exactly 100% of SLA time', () => {
    const createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('overdue');
  });

  it('returns overdue at 150% of SLA time', () => {
    const hoursAgo = 24 * 1.5;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('overdue');
  });

  it('returns overdue at 199% of SLA time', () => {
    const hoursAgo = 24 * 1.99;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('overdue');
  });

  it('returns critical at exactly 200% of SLA time', () => {
    const createdAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('critical');
  });

  it('returns critical at 300% of SLA time (3x SLA)', () => {
    const createdAt = new Date(Date.now() - 72 * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('critical');
  });

  it('works correctly with small SLA (Emergency = 4h)', () => {
    // 3h elapsed out of 4h SLA = 75% → approaching
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(calculateSlaStatus(threeHoursAgo, 4)).toBe('approaching');

    // 4h elapsed = 100% → overdue
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    expect(calculateSlaStatus(fourHoursAgo, 4)).toBe('overdue');

    // 8h elapsed = 200% → critical
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    expect(calculateSlaStatus(eightHoursAgo, 4)).toBe('critical');
  });

  it('works correctly with large SLA (General = 72h)', () => {
    // 54h = 75% → approaching
    const fiftyFourHoursAgo = new Date(Date.now() - 54 * 60 * 60 * 1000);
    expect(calculateSlaStatus(fiftyFourHoursAgo, 72)).toBe('approaching');

    // 72h = 100% → overdue
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    expect(calculateSlaStatus(seventyTwoHoursAgo, 72)).toBe('overdue');
  });

  it('handles 0 hours elapsed as within_sla', () => {
    const now = new Date();
    expect(calculateSlaStatus(now, 8)).toBe('within_sla');
  });

  it('handles future createdAt (negative elapsed) as within_sla', () => {
    const future = new Date(Date.now() + 10 * 60 * 60 * 1000);
    expect(calculateSlaStatus(future, 24)).toBe('within_sla');
  });
});

// ---------------------------------------------------------------------------
// Priority Bumping
// ---------------------------------------------------------------------------
describe('Maintenance SLA — getSlaPriorityBump', () => {
  it('does not bump priority when within_sla', () => {
    expect(getSlaPriorityBump('low', 'within_sla')).toBe('low');
    expect(getSlaPriorityBump('medium', 'within_sla')).toBe('medium');
    expect(getSlaPriorityBump('high', 'within_sla')).toBe('high');
    expect(getSlaPriorityBump('urgent', 'within_sla')).toBe('urgent');
  });

  it('does not bump priority when approaching', () => {
    expect(getSlaPriorityBump('low', 'approaching')).toBe('low');
    expect(getSlaPriorityBump('medium', 'approaching')).toBe('medium');
    expect(getSlaPriorityBump('high', 'approaching')).toBe('high');
    expect(getSlaPriorityBump('urgent', 'approaching')).toBe('urgent');
  });

  it('bumps low to medium when overdue', () => {
    expect(getSlaPriorityBump('low', 'overdue')).toBe('medium');
  });

  it('bumps medium to high when overdue', () => {
    expect(getSlaPriorityBump('medium', 'overdue')).toBe('high');
  });

  it('does not bump high when overdue (already high)', () => {
    expect(getSlaPriorityBump('high', 'overdue')).toBe('high');
  });

  it('does not bump urgent when overdue (already max)', () => {
    expect(getSlaPriorityBump('urgent', 'overdue')).toBe('urgent');
  });

  it('bumps low to urgent when critical', () => {
    expect(getSlaPriorityBump('low', 'critical')).toBe('urgent');
  });

  it('bumps medium to urgent when critical', () => {
    expect(getSlaPriorityBump('medium', 'critical')).toBe('urgent');
  });

  it('bumps high to urgent when critical', () => {
    expect(getSlaPriorityBump('high', 'critical')).toBe('urgent');
  });

  it('keeps urgent as urgent when critical', () => {
    expect(getSlaPriorityBump('urgent', 'critical')).toBe('urgent');
  });
});

// ---------------------------------------------------------------------------
// Default SLA Hours Configuration
// ---------------------------------------------------------------------------
describe('Maintenance SLA — DEFAULT_SLA_HOURS', () => {
  it('has Plumbing at 24h', () => {
    expect(DEFAULT_SLA_HOURS.Plumbing).toBe(24);
  });

  it('has Electrical at 12h', () => {
    expect(DEFAULT_SLA_HOURS.Electrical).toBe(12);
  });

  it('has HVAC at 8h (heating/cooling is urgent)', () => {
    expect(DEFAULT_SLA_HOURS.HVAC).toBe(8);
  });

  it('has Appliance at 48h', () => {
    expect(DEFAULT_SLA_HOURS.Appliance).toBe(48);
  });

  it('has General at 72h', () => {
    expect(DEFAULT_SLA_HOURS.General).toBe(72);
  });

  it('has Emergency at 4h', () => {
    expect(DEFAULT_SLA_HOURS.Emergency).toBe(4);
  });

  it('has exactly 6 categories defined', () => {
    expect(Object.keys(DEFAULT_SLA_HOURS)).toHaveLength(6);
  });

  it('all SLA values are positive numbers', () => {
    for (const [, hours] of Object.entries(DEFAULT_SLA_HOURS)) {
      expect(hours).toBeGreaterThan(0);
    }
  });

  it('Emergency has the shortest SLA', () => {
    const minHours = Math.min(...Object.values(DEFAULT_SLA_HOURS));
    expect(DEFAULT_SLA_HOURS.Emergency).toBe(minHours);
  });

  it('General has the longest SLA', () => {
    const maxHours = Math.max(...Object.values(DEFAULT_SLA_HOURS));
    expect(DEFAULT_SLA_HOURS.General).toBe(maxHours);
  });
});
