/**
 * Property schemas — used by /api/v1/properties POST and the
 * create-property dialog. Single source of truth for validation rules.
 *
 * See docs/QUALITY-BAR.md Section A — client and server use the SAME
 * schema so what the user sees == what the server enforces.
 */

import { z } from 'zod';

import { emailSchema, phoneSchema, postalCodeSchema } from './common';

const CANADIAN_PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon',
] as const;

const US_STATES = [
  // Subset for now — extend as needed
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
] as const;

export const PROVINCES_AND_STATES = [...CANADIAN_PROVINCES, ...US_STATES] as const;

export const CANADIAN_TIMEZONES = [
  'America/Toronto',
  'America/Vancouver',
  'America/Edmonton',
  'America/Winnipeg',
  'America/Halifax',
  'America/St_Johns',
] as const;

export const PROPERTY_TYPES = ['PRODUCTION', 'DEMO', 'SANDBOX'] as const;

export const PROPERTIES_TIMEZONE_LABELS: Record<string, string> = {
  'America/Toronto': 'Toronto (Eastern)',
  'America/Vancouver': 'Vancouver (Pacific)',
  'America/Edmonton': 'Edmonton (Mountain)',
  'America/Winnipeg': 'Winnipeg (Central)',
  'America/Halifax': 'Halifax (Atlantic)',
  'America/St_Johns': "St. John's (Newfoundland)",
};

export const createPropertySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Property name must be at least 2 characters')
    .max(150, 'Property name must be at most 150 characters'),
  slug: z
    .string()
    .trim()
    .max(80, 'Slug must be at most 80 characters')
    .regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens only')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().min(3, 'Street address is required').max(500, 'Address is too long'),
  city: z.string().trim().min(2, 'City is required').max(100, 'City is too long'),
  province: z.enum(PROVINCES_AND_STATES, {
    errorMap: () => ({ message: 'Choose a province or state' }),
  }),
  postalCode: postalCodeSchema,
  country: z.enum(['CA', 'US'], {
    errorMap: () => ({ message: 'Choose CA or US' }),
  }),
  type: z.enum(PROPERTY_TYPES, {
    errorMap: () => ({ message: 'Choose a property type' }),
  }),
  unitCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Whole number only')
    .min(0, 'Cannot be negative')
    .max(10000, 'That seems too many — contact support for large portfolios')
    .optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  // Optional contact — only validated if provided
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
