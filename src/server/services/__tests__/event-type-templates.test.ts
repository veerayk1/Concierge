/**
 * Event Type Templates Tests
 *
 * Validates the default event type templates, seed logic, and
 * integration with fire-safety and noise-complaint custom field schemas.
 */

import { describe, expect, it } from 'vitest';
import {
  getDefaultEventTypes,
  getEventTypesByCategory,
  getEventTypeBySlug,
  getEventTypeCategories,
  seedEventTypesForProperty,
  type EventTypeTemplate,
  type EventTypeCategory,
} from '../event-type-templates';
import { getFireSafetyTemplate } from '../fire-safety';
import { getNoiseComplaintTemplate } from '../noise-complaint';

// ---------------------------------------------------------------------------
// Template Structure
// ---------------------------------------------------------------------------

describe('Event Type Templates — Structure', () => {
  it('returns all default event type templates', () => {
    const templates = getDefaultEventTypes();
    expect(templates.length).toBeGreaterThanOrEqual(12);
  });

  it('each template has all required fields', () => {
    const templates = getDefaultEventTypes();
    for (const t of templates) {
      expect(t.name).toBeTruthy();
      expect(t.slug).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(t.color).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.defaultPriority).toBeTruthy();
      expect(t.description).toBeTruthy();
      // customFieldsSchema can be null for generic types
      expect(t).toHaveProperty('customFieldsSchema');
    }
  });

  it('all slugs are unique', () => {
    const templates = getDefaultEventTypes();
    const slugs = templates.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all names are unique', () => {
    const templates = getDefaultEventTypes();
    const names = templates.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('colors are valid hex codes', () => {
    const templates = getDefaultEventTypes();
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const t of templates) {
      expect(t.color).toMatch(hexPattern);
    }
  });

  it('slugs are kebab-case', () => {
    const templates = getDefaultEventTypes();
    const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const t of templates) {
      expect(t.slug).toMatch(kebabPattern);
    }
  });

  it('defaultPriority is a valid value', () => {
    const templates = getDefaultEventTypes();
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    for (const t of templates) {
      expect(validPriorities).toContain(t.defaultPriority);
    }
  });

  it('category is a valid value', () => {
    const templates = getDefaultEventTypes();
    const validCategories: EventTypeCategory[] = ['security', 'package', 'building'];
    for (const t of templates) {
      expect(validCategories).toContain(t.category);
    }
  });
});

// ---------------------------------------------------------------------------
// Category Grouping
// ---------------------------------------------------------------------------

describe('Event Type Templates — Categories', () => {
  it('returns security templates', () => {
    const security = getEventTypesByCategory('security');
    expect(security.length).toBeGreaterThanOrEqual(6);
    expect(security.every((t) => t.category === 'security')).toBe(true);
  });

  it('returns package templates', () => {
    const packages = getEventTypesByCategory('package');
    expect(packages.length).toBeGreaterThanOrEqual(3);
    expect(packages.every((t) => t.category === 'package')).toBe(true);
  });

  it('returns building templates', () => {
    const building = getEventTypesByCategory('building');
    expect(building.length).toBeGreaterThanOrEqual(3);
    expect(building.every((t) => t.category === 'building')).toBe(true);
  });

  it('all categories are represented', () => {
    const categories = getEventTypeCategories();
    expect(categories).toContain('security');
    expect(categories).toContain('package');
    expect(categories).toContain('building');
    expect(categories).toHaveLength(3);
  });

  it('total templates equals sum of all categories', () => {
    const all = getDefaultEventTypes();
    const security = getEventTypesByCategory('security');
    const packages = getEventTypesByCategory('package');
    const building = getEventTypesByCategory('building');
    expect(all.length).toBe(security.length + packages.length + building.length);
  });
});

// ---------------------------------------------------------------------------
// Specific Templates
// ---------------------------------------------------------------------------

describe('Event Type Templates — Fire Safety', () => {
  it('Fire Safety template exists', () => {
    const template = getEventTypeBySlug('fire-safety');
    expect(template).toBeDefined();
    expect(template!.name).toBe('Fire Safety');
  });

  it('Fire Safety template has customFieldsSchema from fire-safety service', () => {
    const template = getEventTypeBySlug('fire-safety');
    expect(template!.customFieldsSchema).toEqual(getFireSafetyTemplate());
  });

  it('Fire Safety template has critical priority', () => {
    const template = getEventTypeBySlug('fire-safety');
    expect(template!.defaultPriority).toBe('critical');
  });

  it('Fire Safety schema includes required alarm fields', () => {
    const template = getEventTypeBySlug('fire-safety');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const required = schema['required'] as string[];
    expect(required).toContain('alarmTime');
    expect(required).toContain('alarmLocation');
    expect(required).toContain('alarmZone');
  });
});

describe('Event Type Templates — Noise Complaint', () => {
  it('Noise Complaint template exists', () => {
    const template = getEventTypeBySlug('noise-complaint');
    expect(template).toBeDefined();
    expect(template!.name).toBe('Noise Complaint');
  });

  it('Noise Complaint template has customFieldsSchema from noise-complaint service', () => {
    const template = getEventTypeBySlug('noise-complaint');
    expect(template!.customFieldsSchema).toEqual(getNoiseComplaintTemplate());
  });

  it('Noise Complaint template has medium priority', () => {
    const template = getEventTypeBySlug('noise-complaint');
    expect(template!.defaultPriority).toBe('medium');
  });
});

describe('Event Type Templates — Authorized Entry', () => {
  it('Authorized Entry template exists', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template).toBeDefined();
    expect(template!.name).toBe('Authorized Entry');
  });

  it('Authorized Entry is in the security category', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.category).toBe('security');
  });

  it('Authorized Entry has customFieldsSchema with required fields', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    expect(schema).toBeDefined();
    const required = schema['required'] as string[];
    expect(required).toContain('unitNumber');
    expect(required).toContain('authorizedBy');
    expect(required).toContain('entryReason');
    expect(required).toContain('entryTime');
  });

  it('Authorized Entry schema includes authorization type enum', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const authType = props['authorizationType'];
    expect(authType).toBeDefined();
    const enumValues = authType!['enum'] as string[];
    expect(enumValues).toContain('resident_present');
    expect(enumValues).toContain('emergency');
    expect(enumValues).toContain('management_order');
  });

  it('Authorized Entry schema includes exitTime and staffMembers', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['exitTime']).toBeDefined();
    expect(props['staffMembers']).toBeDefined();
    expect(props['residentNotified']).toBeDefined();
  });
});

describe('Event Type Templates — Security Patrol', () => {
  it('Security Patrol template exists', () => {
    const template = getEventTypeBySlug('security-patrol');
    expect(template).toBeDefined();
    expect(template!.name).toBe('Security Patrol');
  });

  it('Security Patrol has checkpoint tracking in schema', () => {
    const template = getEventTypeBySlug('security-patrol');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['checkpoints']).toBeDefined();
    expect(props['patrolRoute']).toBeDefined();
    expect(props['startTime']).toBeDefined();
  });

  it('Security Patrol has low default priority', () => {
    const template = getEventTypeBySlug('security-patrol');
    expect(template!.defaultPriority).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// Slug Lookup
// ---------------------------------------------------------------------------

describe('Event Type Templates — Lookup', () => {
  it('finds templates by slug', () => {
    expect(getEventTypeBySlug('general-security')).toBeDefined();
    expect(getEventTypeBySlug('package-received')).toBeDefined();
    expect(getEventTypeBySlug('cleaning-log')).toBeDefined();
  });

  it('returns undefined for unknown slug', () => {
    expect(getEventTypeBySlug('does-not-exist')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Seed Function
// ---------------------------------------------------------------------------

describe('Event Type Templates — Seeding', () => {
  it('seeds all templates for a new property', () => {
    const result = seedEventTypesForProperty('property-1');
    const allTemplates = getDefaultEventTypes();
    expect(result.created).toBe(allTemplates.length);
    expect(result.skipped).toBe(0);
    expect(result.templates).toHaveLength(allTemplates.length);
  });

  it('is idempotent — skips existing slugs', () => {
    const existingSlugs = ['fire-safety', 'noise-complaint', 'authorized-entry'];
    const result = seedEventTypesForProperty('property-2', existingSlugs);
    expect(result.skipped).toBe(3);
    expect(result.created).toBe(getDefaultEventTypes().length - 3);
    expect(result.templates).not.toContain('fire-safety');
    expect(result.templates).not.toContain('noise-complaint');
    expect(result.templates).not.toContain('authorized-entry');
  });

  it('skips all when all exist', () => {
    const allSlugs = getDefaultEventTypes().map((t) => t.slug);
    const result = seedEventTypesForProperty('property-3', allSlugs);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(allSlugs.length);
    expect(result.templates).toHaveLength(0);
  });

  it('throws on empty propertyId', () => {
    expect(() => seedEventTypesForProperty('')).toThrow('propertyId is required');
  });

  it('throws on whitespace-only propertyId', () => {
    expect(() => seedEventTypesForProperty('   ')).toThrow('propertyId is required');
  });

  it('returns created slugs in order', () => {
    const result = seedEventTypesForProperty('property-4');
    const expectedSlugs = getDefaultEventTypes().map((t) => t.slug);
    expect(result.templates).toEqual(expectedSlugs);
  });
});
