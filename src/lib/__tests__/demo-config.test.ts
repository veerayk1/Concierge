import { describe, expect, it } from 'vitest';
import { DEMO_PROPERTY_ID, DEMO_PROPERTY_NAME, DEMO_PROPERTY, getPropertyId } from '../demo-config';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Demo Configuration', () => {
  // 1
  it('DEMO_PROPERTY_ID is a valid UUID v4 format', () => {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidV4Regex.test(DEMO_PROPERTY_ID)).toBe(true);
  });

  // 2
  it('DEMO_PROPERTY_NAME is a non-empty string', () => {
    expect(typeof DEMO_PROPERTY_NAME).toBe('string');
    expect(DEMO_PROPERTY_NAME.length).toBeGreaterThan(0);
  });

  // 3
  it('DEMO_PROPERTY has all required fields', () => {
    expect(DEMO_PROPERTY.id).toBe(DEMO_PROPERTY_ID);
    expect(DEMO_PROPERTY.name).toBe(DEMO_PROPERTY_NAME);
    expect(typeof DEMO_PROPERTY.address).toBe('string');
    expect(DEMO_PROPERTY.address.length).toBeGreaterThan(0);
    expect(typeof DEMO_PROPERTY.city).toBe('string');
    expect(typeof DEMO_PROPERTY.province).toBe('string');
    expect(typeof DEMO_PROPERTY.country).toBe('string');
    expect(typeof DEMO_PROPERTY.unitCount).toBe('number');
    expect(DEMO_PROPERTY.unitCount).toBeGreaterThan(0);
    expect(typeof DEMO_PROPERTY.timezone).toBe('string');
  });

  // 4
  it('DEMO_PROPERTY country is Canada (CA)', () => {
    expect(DEMO_PROPERTY.country).toBe('CA');
  });

  // 5
  it('DEMO_PROPERTY timezone is a valid IANA timezone', () => {
    expect(DEMO_PROPERTY.timezone).toBe('America/Toronto');
  });

  // 6
  it('getPropertyId returns the demo property ID', () => {
    const id = getPropertyId();
    expect(id).toBe(DEMO_PROPERTY_ID);
  });

  // 7
  it('DEMO_PROPERTY id and DEMO_PROPERTY_ID are consistent', () => {
    expect(DEMO_PROPERTY.id).toBe(DEMO_PROPERTY_ID);
  });

  // 8
  it('DEMO_PROPERTY name and DEMO_PROPERTY_NAME are consistent', () => {
    expect(DEMO_PROPERTY.name).toBe(DEMO_PROPERTY_NAME);
  });

  // 9
  it('DEMO_PROPERTY unitCount is a positive integer', () => {
    expect(Number.isInteger(DEMO_PROPERTY.unitCount)).toBe(true);
    expect(DEMO_PROPERTY.unitCount).toBeGreaterThan(0);
  });

  // 10
  it('DEMO_PROPERTY address contains city name', () => {
    expect(DEMO_PROPERTY.address).toContain(DEMO_PROPERTY.city);
  });
});
