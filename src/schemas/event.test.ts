/**
 * Event Schema Validation Tests — per PRD 03
 */

import { describe, expect, it } from 'vitest';
import { createEventSchema, updateEventSchema } from './event';

describe('createEventSchema', () => {
  const validInput = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    eventTypeId: '00000000-0000-4000-d000-000000000001',
    title: 'Visitor for unit 1501',
    description: 'Expected guest',
    priority: 'normal' as const,
  };

  it('accepts valid input', () => {
    expect(createEventSchema.safeParse(validInput).success).toBe(true);
  });

  it('requires propertyId', () => {
    const { propertyId, ...rest } = validInput;
    expect(createEventSchema.safeParse(rest).success).toBe(false);
  });

  it('requires eventTypeId as non-empty string', () => {
    // eventTypeId uses min(1) validation — empty string is rejected, non-empty strings pass
    expect(createEventSchema.safeParse({ ...validInput, eventTypeId: '' }).success).toBe(false);
    // Non-empty strings are valid (not restricted to UUID format)
    expect(createEventSchema.safeParse({ ...validInput, eventTypeId: 'not-uuid' }).success).toBe(
      true,
    );
  });

  it('requires title', () => {
    expect(createEventSchema.safeParse({ ...validInput, title: '' }).success).toBe(false);
  });

  it('enforces title max length 200', () => {
    expect(createEventSchema.safeParse({ ...validInput, title: 'X'.repeat(201) }).success).toBe(
      false,
    );
  });

  it('accepts optional unitId', () => {
    expect(createEventSchema.safeParse({ ...validInput, unitId: '' }).success).toBe(true);
    expect(
      createEventSchema.safeParse({ ...validInput, unitId: '00000000-0000-4000-e000-000000000001' })
        .success,
    ).toBe(true);
  });

  it('defaults priority to normal', () => {
    const { priority, ...rest } = validInput;
    const result = createEventSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe('normal');
  });

  it('accepts all priority levels', () => {
    for (const p of ['low', 'normal', 'medium', 'high', 'urgent']) {
      expect(createEventSchema.safeParse({ ...validInput, priority: p }).success).toBe(true);
    }
  });

  it('rejects invalid priority', () => {
    expect(createEventSchema.safeParse({ ...validInput, priority: 'critical' }).success).toBe(
      false,
    );
  });
});

describe('updateEventSchema', () => {
  it('accepts partial updates', () => {
    expect(updateEventSchema.safeParse({ status: 'closed' }).success).toBe(true);
    expect(updateEventSchema.safeParse({ priority: 'high' }).success).toBe(true);
    expect(updateEventSchema.safeParse({}).success).toBe(true);
  });

  it('validates status values', () => {
    expect(updateEventSchema.safeParse({ status: 'open' }).success).toBe(true);
    expect(updateEventSchema.safeParse({ status: 'in_progress' }).success).toBe(true);
    expect(updateEventSchema.safeParse({ status: 'resolved' }).success).toBe(true);
    expect(updateEventSchema.safeParse({ status: 'closed' }).success).toBe(true);
    expect(updateEventSchema.safeParse({ status: 'deleted' }).success).toBe(false);
  });
});
