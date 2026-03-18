/**
 * Demo/Development configuration
 * Centralized property ID and demo settings
 * Will be replaced with real auth context in production
 */

export const DEMO_PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
export const DEMO_PROPERTY_NAME = 'Maple Heights Condominiums';

export const DEMO_PROPERTY = {
  id: DEMO_PROPERTY_ID,
  name: DEMO_PROPERTY_NAME,
  address: '100 Maple Avenue, Toronto, ON M5V 2H1',
  city: 'Toronto',
  province: 'Ontario',
  country: 'CA',
  unitCount: 200,
  timezone: 'America/Toronto',
};

/**
 * Get the current property ID (from auth context or demo mode)
 */
export function getPropertyId(): string {
  // In production, this would come from the auth context
  return DEMO_PROPERTY_ID;
}
