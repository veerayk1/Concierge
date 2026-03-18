/**
 * Concierge — Unit Test Factory
 *
 * Generates realistic condo unit records matching the Prisma Unit model.
 *
 * @module test/factories/unit
 */

import { faker } from '@faker-js/faker';

// ---------------------------------------------------------------------------
// Types (plain objects matching Prisma Unit model)
// ---------------------------------------------------------------------------

export interface UnitFactoryData {
  id: string;
  propertyId: string;
  buildingId: string | null;
  number: string;
  floor: number | null;
  unitType: string;
  status: string;
  squareFootage: number | null;
  enterPhoneCode: string | null;
  parkingSpot: string | null;
  locker: string | null;
  keyTag: string | null;
  packageEmailNotification: boolean;
  comments: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface BuildingFactoryData {
  id: string;
  propertyId: string;
  name: string;
  address: string | null;
  totalFloors: number;
  totalUnits: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a realistic unit number based on floor.
 * Floor 1 => 101-120, Floor 2 => 201-220, etc.
 */
function generateUnitNumber(floor: number): string {
  const unitOnFloor = faker.number.int({ min: 1, max: 20 });
  return `${floor}${unitOnFloor.toString().padStart(2, '0')}`;
}

/**
 * Generates a set of sequential unit numbers for a floor.
 */
function generateFloorUnits(floor: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const unitNum = i + 1;
    return `${floor}${unitNum.toString().padStart(2, '0')}`;
  });
}

// ---------------------------------------------------------------------------
// Factory Functions — Unit
// ---------------------------------------------------------------------------

/**
 * Creates a realistic condo unit with all required fields.
 * Override any field by passing partial data.
 */
export function createUnit(
  propertyId: string,
  overrides: Partial<UnitFactoryData> = {},
): UnitFactoryData {
  const floor = overrides.floor ?? faker.number.int({ min: 1, max: 40 });
  const now = new Date();

  return {
    id: faker.string.uuid(),
    propertyId,
    buildingId: null,
    number: generateUnitNumber(floor),
    floor,
    unitType: 'residential',
    status: 'occupied',
    squareFootage:
      faker.helpers.maybe(
        () => parseFloat(faker.number.float({ min: 400, max: 3000, fractionDigits: 2 }).toFixed(2)),
        { probability: 0.6 },
      ) ?? null,
    enterPhoneCode:
      faker.helpers.maybe(() => faker.string.numeric({ length: 4 }), { probability: 0.5 }) ?? null,
    parkingSpot:
      faker.helpers.maybe(
        () => `P${faker.number.int({ min: 1, max: 3 })}-${faker.string.numeric({ length: 3 })}`,
        { probability: 0.4 },
      ) ?? null,
    locker:
      faker.helpers.maybe(() => `L${faker.string.numeric({ length: 3 })}`, { probability: 0.3 }) ??
      null,
    keyTag:
      faker.helpers.maybe(() => `KT-${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`, {
        probability: 0.4,
      }) ?? null,
    packageEmailNotification: true,
    comments: null,
    customFields: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a unit with a specific number (bypasses auto-generation).
 */
export function createUnitWithNumber(
  propertyId: string,
  unitNumber: string,
  overrides: Partial<UnitFactoryData> = {},
): UnitFactoryData {
  const floor = parseInt(unitNumber.charAt(0), 10) || 1;
  return createUnit(propertyId, {
    number: unitNumber,
    floor,
    ...overrides,
  });
}

/**
 * Creates a set of units across multiple floors.
 * Returns an array of units with realistic sequential numbering.
 */
export function createUnitsForFloors(
  propertyId: string,
  floors: number,
  unitsPerFloor: number,
  overrides: Partial<UnitFactoryData> = {},
): UnitFactoryData[] {
  const units: UnitFactoryData[] = [];

  for (let floor = 1; floor <= floors; floor++) {
    const unitNumbers = generateFloorUnits(floor, unitsPerFloor);
    for (const number of unitNumbers) {
      units.push(
        createUnit(propertyId, {
          number,
          floor,
          ...overrides,
        }),
      );
    }
  }

  return units;
}

/**
 * Creates a unit with associated "residents" by returning user IDs
 * that should be linked via OccupancyRecord.
 * This is a data-only helper — the caller creates the actual OccupancyRecords.
 */
export function createUnitWithResidents(
  propertyId: string,
  residentCount: number = 2,
  overrides: Partial<UnitFactoryData> = {},
): {
  unit: UnitFactoryData;
  residentUserIds: string[];
} {
  const unit = createUnit(propertyId, { status: 'occupied', ...overrides });
  const residentUserIds = Array.from({ length: residentCount }, () => faker.string.uuid());

  return { unit, residentUserIds };
}

// ---------------------------------------------------------------------------
// Factory Functions — Building
// ---------------------------------------------------------------------------

const BUILDING_NAMES = [
  'North Tower',
  'South Tower',
  'East Tower',
  'West Tower',
  'Tower A',
  'Tower B',
  'Tower C',
  'Main Building',
  'Podium',
  'Heritage Wing',
];

/**
 * Creates a building record for a property.
 */
export function createBuilding(
  propertyId: string,
  overrides: Partial<BuildingFactoryData> = {},
): BuildingFactoryData {
  const now = new Date();
  const totalFloors = faker.number.int({ min: 5, max: 50 });

  return {
    id: faker.string.uuid(),
    propertyId,
    name: faker.helpers.arrayElement(BUILDING_NAMES),
    address: null,
    totalFloors,
    totalUnits: totalFloors * faker.number.int({ min: 6, max: 15 }),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a vacant unit (for testing move-in flows).
 */
export function createVacantUnit(
  propertyId: string,
  overrides: Partial<UnitFactoryData> = {},
): UnitFactoryData {
  return createUnit(propertyId, {
    status: 'vacant',
    enterPhoneCode: null,
    ...overrides,
  });
}

/**
 * Creates a commercial unit.
 */
export function createCommercialUnit(
  propertyId: string,
  overrides: Partial<UnitFactoryData> = {},
): UnitFactoryData {
  return createUnit(propertyId, {
    unitType: 'commercial',
    floor: 1,
    squareFootage: parseFloat(
      faker.number.float({ min: 1000, max: 10000, fractionDigits: 2 }).toFixed(2),
    ),
    ...overrides,
  });
}
