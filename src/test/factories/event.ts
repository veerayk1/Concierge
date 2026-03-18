/**
 * Concierge — Event Test Factory
 *
 * Generates records for the Unified Event Model:
 * EventGroup, EventType, and Event (matching Prisma models).
 *
 * @module test/factories/event
 */

import { faker } from '@faker-js/faker';

// ---------------------------------------------------------------------------
// Types (plain objects matching Prisma models)
// ---------------------------------------------------------------------------

export interface EventGroupFactoryData {
  id: string;
  propertyId: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface EventTypeFactoryData {
  id: string;
  propertyId: string;
  eventGroupId: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  defaultPriority: string;
  notifyOnCreate: boolean;
  notifyOnClose: boolean;
  showOnLobby: boolean;
  customFieldsSchema: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface EventFactoryData {
  id: string;
  propertyId: string;
  eventTypeId: string;
  unitId: string | null;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  customFields: Record<string, unknown> | null;
  createdById: string;
  closedById: string | null;
  closedAt: Date | null;
  referenceNo: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Predefined Event Groups (matching Concierge unified model)
// ---------------------------------------------------------------------------

const DEFAULT_EVENT_GROUPS = [
  {
    name: 'Packages',
    slug: 'packages',
    description: 'Package intake, tracking, and release',
  },
  {
    name: 'Visitors',
    slug: 'visitors',
    description: 'Visitor check-in and check-out',
  },
  {
    name: 'Security',
    slug: 'security',
    description: 'Security incidents and reports',
  },
  {
    name: 'Cleaning',
    slug: 'cleaning',
    description: 'Cleaning logs and schedules',
  },
  {
    name: 'Maintenance',
    slug: 'maintenance',
    description: 'Maintenance requests and work orders',
  },
  {
    name: 'General',
    slug: 'general',
    description: 'General notes and observations',
  },
] as const;

const DEFAULT_EVENT_TYPES = [
  {
    group: 'packages',
    name: 'Package Received',
    slug: 'package-received',
    icon: 'package',
    color: '#2563EB',
  },
  {
    group: 'packages',
    name: 'Package Released',
    slug: 'package-released',
    icon: 'package-check',
    color: '#16A34A',
  },
  {
    group: 'visitors',
    name: 'Visitor Arrival',
    slug: 'visitor-arrival',
    icon: 'user-plus',
    color: '#7C3AED',
  },
  {
    group: 'visitors',
    name: 'Visitor Departure',
    slug: 'visitor-departure',
    icon: 'user-minus',
    color: '#6B7280',
  },
  {
    group: 'security',
    name: 'Incident Report',
    slug: 'incident-report',
    icon: 'shield-alert',
    color: '#DC2626',
  },
  {
    group: 'security',
    name: 'Parking Violation',
    slug: 'parking-violation',
    icon: 'car',
    color: '#EA580C',
  },
  {
    group: 'cleaning',
    name: 'Cleaning Completed',
    slug: 'cleaning-completed',
    icon: 'sparkles',
    color: '#0891B2',
  },
  {
    group: 'maintenance',
    name: 'Work Order Created',
    slug: 'work-order-created',
    icon: 'wrench',
    color: '#CA8A04',
  },
  {
    group: 'general',
    name: 'General Note',
    slug: 'general-note',
    icon: 'sticky-note',
    color: '#6B7280',
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateReferenceNo(): string {
  const prefix = 'EVT';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = faker.string.alphanumeric({ length: 4 }).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

// ---------------------------------------------------------------------------
// Factory Functions — EventGroup
// ---------------------------------------------------------------------------

/**
 * Creates a single event group.
 */
export function createEventGroup(
  propertyId: string,
  overrides: Partial<EventGroupFactoryData> = {},
): EventGroupFactoryData {
  const now = new Date();
  const template = faker.helpers.arrayElement(DEFAULT_EVENT_GROUPS);

  return {
    id: faker.string.uuid(),
    propertyId,
    name: template.name,
    slug: template.slug,
    description: template.description,
    sortOrder: faker.number.int({ min: 0, max: 100 }),
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates the complete default set of event groups for a property.
 */
export function createDefaultEventGroups(propertyId: string): EventGroupFactoryData[] {
  const now = new Date();

  return DEFAULT_EVENT_GROUPS.map((template, index) => ({
    id: faker.string.uuid(),
    propertyId,
    name: template.name,
    slug: template.slug,
    description: template.description,
    sortOrder: index * 10,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
}

// ---------------------------------------------------------------------------
// Factory Functions — EventType
// ---------------------------------------------------------------------------

/**
 * Creates a single event type for a given group.
 */
export function createEventType(
  propertyId: string,
  eventGroupId: string,
  overrides: Partial<EventTypeFactoryData> = {},
): EventTypeFactoryData {
  const now = new Date();
  const template = faker.helpers.arrayElement(DEFAULT_EVENT_TYPES);

  return {
    id: faker.string.uuid(),
    propertyId,
    eventGroupId,
    name: template.name,
    slug: template.slug,
    icon: template.icon,
    color: template.color,
    defaultPriority: 'normal',
    notifyOnCreate: true,
    notifyOnClose: false,
    showOnLobby: false,
    customFieldsSchema: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates all default event types with their groups for a property.
 * Returns groups and types together for convenience.
 */
export function createDefaultEventConfig(propertyId: string): {
  groups: EventGroupFactoryData[];
  types: EventTypeFactoryData[];
} {
  const groups = createDefaultEventGroups(propertyId);
  const groupBySlug = new Map(groups.map((g) => [g.slug, g]));
  const now = new Date();

  const types: EventTypeFactoryData[] = DEFAULT_EVENT_TYPES.map((template) => {
    const group = groupBySlug.get(template.group);
    if (!group) {
      throw new Error(`Group "${template.group}" not found — factory bug`);
    }

    return {
      id: faker.string.uuid(),
      propertyId,
      eventGroupId: group.id,
      name: template.name,
      slug: template.slug,
      icon: template.icon,
      color: template.color,
      defaultPriority: 'normal',
      notifyOnCreate: true,
      notifyOnClose: false,
      showOnLobby: false,
      customFieldsSchema: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  });

  return { groups, types };
}

// ---------------------------------------------------------------------------
// Factory Functions — Event
// ---------------------------------------------------------------------------

/**
 * Creates a single event record.
 */
export function createEvent(
  propertyId: string,
  eventTypeId: string,
  createdById: string,
  overrides: Partial<EventFactoryData> = {},
): EventFactoryData {
  const now = new Date();

  return {
    id: faker.string.uuid(),
    propertyId,
    eventTypeId,
    unitId: null,
    status: 'open',
    priority: 'normal',
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    description: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.6 }) ?? null,
    customFields: null,
    createdById,
    closedById: null,
    closedAt: null,
    referenceNo: generateReferenceNo(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a closed/resolved event.
 */
export function createClosedEvent(
  propertyId: string,
  eventTypeId: string,
  createdById: string,
  closedById: string,
  overrides: Partial<EventFactoryData> = {},
): EventFactoryData {
  const closedAt = faker.date.recent({ days: 7 });

  return createEvent(propertyId, eventTypeId, createdById, {
    status: 'closed',
    closedById,
    closedAt,
    ...overrides,
  });
}

/**
 * Creates multiple events in batch.
 */
export function createEvents(
  count: number,
  propertyId: string,
  eventTypeId: string,
  createdById: string,
  overrides: Partial<EventFactoryData> = {},
): EventFactoryData[] {
  return Array.from({ length: count }, () =>
    createEvent(propertyId, eventTypeId, createdById, overrides),
  );
}
