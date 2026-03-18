/**
 * Concierge — Property Test Factory
 *
 * Generates realistic Canadian condo property records
 * matching the Prisma Property model.
 *
 * @module test/factories/property
 */

import { faker } from '@faker-js/faker';

// ---------------------------------------------------------------------------
// Types (plain objects matching Prisma Property model)
// ---------------------------------------------------------------------------

export interface PropertyFactoryData {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  unitCount: number;
  timezone: string;
  logo: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  type: 'PRODUCTION' | 'DEMO' | 'TRAINING';
  slug: string | null;
  branding: Record<string, unknown> | null;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | null;
  expiresAt: Date | null;
  parentPropertyId: string | null;
  demoTemplateId: string | null;
  assignedSalesRepId: string | null;
  demoLabel: string | null;
  lastAccessedAt: Date | null;
  prospectName: string | null;
  prospectLogoUrl: string | null;
  prospectAccentColor: string | null;
  notificationSuppressed: boolean;
  maxTrainees: number | null;
  createdFromTemplate: string | null;
  propertyCode: string | null;
}

// ---------------------------------------------------------------------------
// Canadian condo name components for realistic generation
// ---------------------------------------------------------------------------

const CONDO_PREFIXES = [
  'Maple',
  'Harbour',
  'Lakeshore',
  'King West',
  'Yonge',
  'Bloor',
  'Queen',
  'Bay',
  'Yorkville',
  'Liberty',
  'Distillery',
  'Waterfront',
  'Parkview',
  'Royal',
  'Summit',
  'Pinnacle',
  'Riverview',
  'Skyline',
  'Grand',
  'Cedar',
];

const CONDO_SUFFIXES = [
  'Condominiums',
  'Residences',
  'Tower',
  'Place',
  'Towers',
  'Suites',
  'Lofts',
  'Heights',
  'Gardens',
  'Terrace',
  'Park',
  'Square',
  'Manor',
  'Court',
  'Village',
];

const CANADIAN_CITIES = [
  'Toronto',
  'Vancouver',
  'Montreal',
  'Calgary',
  'Ottawa',
  'Edmonton',
  'Mississauga',
  'Winnipeg',
  'Hamilton',
  'Brampton',
  'Surrey',
  'Kitchener',
  'Markham',
  'Richmond Hill',
  'Oakville',
];

const PROVINCES: Record<string, string> = {
  Toronto: 'ON',
  Vancouver: 'BC',
  Montreal: 'QC',
  Calgary: 'AB',
  Ottawa: 'ON',
  Edmonton: 'AB',
  Mississauga: 'ON',
  Winnipeg: 'MB',
  Hamilton: 'ON',
  Brampton: 'ON',
  Surrey: 'BC',
  Kitchener: 'ON',
  Markham: 'ON',
  'Richmond Hill': 'ON',
  Oakville: 'ON',
};

const TIMEZONES: Record<string, string> = {
  ON: 'America/Toronto',
  BC: 'America/Vancouver',
  QC: 'America/Montreal',
  AB: 'America/Edmonton',
  MB: 'America/Winnipeg',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCondoName(): string {
  const prefix = faker.helpers.arrayElement(CONDO_PREFIXES);
  const suffix = faker.helpers.arrayElement(CONDO_SUFFIXES);
  return `${prefix} ${suffix}`;
}

function generateCanadianPostalCode(): string {
  const letters = 'ABCEGHJKLMNPRSTVXY';
  const l = () => letters[Math.floor(Math.random() * letters.length)];
  const d = () => Math.floor(Math.random() * 10);
  return `${l()}${d()}${l()} ${d()}${l()}${d()}`;
}

function generatePropertyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const c = () => chars[Math.floor(Math.random() * chars.length)];
  return `${c()}${c()}${c()}-${c()}${c()}${c()}`;
}

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------

/**
 * Creates a realistic Canadian condo property with all required fields.
 * Override any field by passing partial data.
 */
export function createProperty(overrides: Partial<PropertyFactoryData> = {}): PropertyFactoryData {
  const city = faker.helpers.arrayElement(CANADIAN_CITIES);
  const province = PROVINCES[city] ?? 'ON';
  const timezone = TIMEZONES[province] ?? 'America/Toronto';
  const now = new Date();

  return {
    id: faker.string.uuid(),
    name: generateCondoName(),
    address: `${faker.number.int({ min: 1, max: 9999 })} ${faker.location.street()}`,
    city,
    province,
    country: 'CA',
    postalCode: generateCanadianPostalCode(),
    unitCount: faker.number.int({ min: 50, max: 800 }),
    timezone,
    logo: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    type: 'PRODUCTION',
    slug: null,
    branding: null,
    subscriptionTier: null,
    expiresAt: null,
    parentPropertyId: null,
    demoTemplateId: null,
    assignedSalesRepId: null,
    demoLabel: null,
    lastAccessedAt: null,
    prospectName: null,
    prospectLogoUrl: null,
    prospectAccentColor: null,
    notificationSuppressed: false,
    maxTrainees: null,
    createdFromTemplate: null,
    propertyCode: null,
    ...overrides,
  };
}

/**
 * Creates a property with common overrides applied for various scenarios.
 */
export function createPropertyOverrides(
  scenario:
    | 'demo'
    | 'training'
    | 'starter'
    | 'professional'
    | 'enterprise'
    | 'inactive'
    | 'with_code',
  overrides: Partial<PropertyFactoryData> = {},
): PropertyFactoryData {
  const scenarioDefaults: Record<string, Partial<PropertyFactoryData>> = {
    demo: {
      type: 'DEMO',
      notificationSuppressed: true,
      demoLabel: 'Sales Demo',
      slug: `demo-${faker.string.alphanumeric(8)}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    training: {
      type: 'TRAINING',
      notificationSuppressed: true,
      demoLabel: 'Staff Training',
      maxTrainees: 25,
      slug: `training-${faker.string.alphanumeric(8)}`,
    },
    starter: {
      subscriptionTier: 'STARTER',
      unitCount: faker.number.int({ min: 20, max: 100 }),
    },
    professional: {
      subscriptionTier: 'PROFESSIONAL',
      unitCount: faker.number.int({ min: 100, max: 400 }),
    },
    enterprise: {
      subscriptionTier: 'ENTERPRISE',
      unitCount: faker.number.int({ min: 300, max: 1000 }),
    },
    inactive: {
      isActive: false,
      deletedAt: new Date(),
    },
    with_code: {
      propertyCode: generatePropertyCode(),
    },
  };

  return createProperty({
    ...scenarioDefaults[scenario],
    ...overrides,
  });
}

/**
 * Creates multiple properties in batch.
 */
export function createProperties(
  count: number,
  overrides: Partial<PropertyFactoryData> = {},
): PropertyFactoryData[] {
  return Array.from({ length: count }, () => createProperty(overrides));
}
