/**
 * Demo/Development configuration
 * Centralized property ID and demo settings
 *
 * getPropertyId() reads from localStorage so multi-tenancy works:
 * - Demo quick-login buttons set `demo_propertyId`
 * - Real login stores the propertyId from the JWT response
 * - Falls back to the seeded demo property for backwards compatibility
 */

export const DEFAULT_DEMO_PROPERTY_ID = '94fd28bd-37ce-4fb1-952e-4c182634fc90';

/** @deprecated Use getPropertyId() instead — this constant breaks multi-tenancy */
export const DEMO_PROPERTY_ID = DEFAULT_DEMO_PROPERTY_ID;

export const DEMO_PROPERTY_NAME = 'Maple Heights Condominiums';

export const DEMO_PROPERTY = {
  id: DEFAULT_DEMO_PROPERTY_ID,
  name: DEMO_PROPERTY_NAME,
  address: '100 Maple Avenue, Toronto, ON M5V 2H1',
  city: 'Toronto',
  province: 'Ontario',
  country: 'CA',
  unitCount: 200,
  timezone: 'America/Toronto',
};

/**
 * Get the current property ID from localStorage, falling back to the demo default.
 * Always use this instead of the DEMO_PROPERTY_ID constant.
 */
export function getPropertyId(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('demo_propertyId');
    if (stored) return stored;
  }
  return DEFAULT_DEMO_PROPERTY_ID;
}

/**
 * Store the active property ID (called on login).
 */
export function setPropertyId(propertyId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_propertyId', propertyId);
  }
}
