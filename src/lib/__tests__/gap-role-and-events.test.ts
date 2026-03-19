/**
 * GAP Analysis Fixes — Superintendent Role & Authorized Entry
 *
 * GAP 2.1: Superintendent role — verify it exists in the role definitions
 *          and has correct navigation access (maintenance + keys, no financials)
 *
 * GAP 3.3: Authorized Entry tracking — verify the event type template exists
 *          in the security category with proper custom fields schema
 *
 * Both are critical for the Concierge platform because:
 * - Superintendent is a distinct role from maintenance_staff (building-wide
 *   responsibility vs task-level assignment)
 * - Authorized Entry is a legal requirement for condo buildings — every time
 *   staff enters a unit, it must be logged with authorization type, entry/exit
 *   time, staff members present, and resident notification status
 */

import { describe, expect, it } from 'vitest';
import { getNavigationForRole, getFlatNavigationForRole, ROLE_DISPLAY_NAMES } from '../navigation';
import {
  getDefaultEventTypes,
  getEventTypeBySlug,
  getEventTypesByCategory,
  seedEventTypesForProperty,
} from '@/server/services/event-type-templates';
import type { Role } from '@/types';
import { ROLE_HIERARCHY } from '@/types';

// ===========================================================================
// GAP 2.1 — Superintendent Role
// ===========================================================================

describe('GAP 2.1 — Superintendent role', () => {
  const role: Role = 'superintendent';

  // -----------------------------------------------------------------------
  // Role exists in type system and navigation
  // -----------------------------------------------------------------------

  it('1. superintendent exists in ROLE_DISPLAY_NAMES', () => {
    expect(ROLE_DISPLAY_NAMES[role]).toBeDefined();
    expect(ROLE_DISPLAY_NAMES[role]).toBe('Superintendent');
  });

  it('2. superintendent gets non-empty navigation groups', () => {
    const groups = getNavigationForRole(role);
    expect(groups.length).toBeGreaterThan(0);
  });

  it('3. superintendent sees dashboard', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('dashboard');
  });

  // -----------------------------------------------------------------------
  // Superintendent has maintenance access
  // -----------------------------------------------------------------------

  it('4. superintendent sees service-requests (maintenance)', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('service-requests');
  });

  it('5. superintendent sees building-systems', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('building-systems');
  });

  it('6. superintendent sees shift-log', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('shift-log');
  });

  it('7. superintendent sees daily-training', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('daily-training');
  });

  it('8. superintendent sees vendors', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('vendors');
  });

  it('9. superintendent sees inspections', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('inspections');
  });

  it('10. superintendent sees recurring-tasks', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('recurring-tasks');
  });

  // -----------------------------------------------------------------------
  // Superintendent does NOT have financial/admin access
  // -----------------------------------------------------------------------

  it('11. superintendent does NOT see settings', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('settings');
  });

  it('12. superintendent does NOT see user-management', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('user-management');
  });

  it('13. superintendent does NOT see billing-system', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('billing-system');
  });

  it('14. superintendent does NOT see compliance', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('compliance');
  });

  it('15. superintendent does NOT see developer-portal', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('developer-portal');
  });

  it('16. superintendent does NOT see data-migration', () => {
    const items = getFlatNavigationForRole(role);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('data-migration');
  });

  // -----------------------------------------------------------------------
  // Superintendent sees OPERATIONS and DAILY groups
  // -----------------------------------------------------------------------

  it('17. superintendent has OPERATIONS group', () => {
    const groups = getNavigationForRole(role);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('OPERATIONS');
  });

  it('18. superintendent has DAILY group', () => {
    const groups = getNavigationForRole(role);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('DAILY');
  });

  it('19. superintendent does NOT have GOVERNANCE group', () => {
    const groups = getNavigationForRole(role);
    const labels = groups.map((g) => g.label);
    expect(labels).not.toContain('GOVERNANCE');
  });

  it('20. superintendent does NOT have SYSTEM group', () => {
    const groups = getNavigationForRole(role);
    const labels = groups.map((g) => g.label);
    expect(labels).not.toContain('SYSTEM');
  });

  // -----------------------------------------------------------------------
  // Superintendent role hierarchy
  // -----------------------------------------------------------------------

  it('21. superintendent has higher privilege than resident_owner', () => {
    expect(ROLE_HIERARCHY.superintendent).toBeGreaterThan(ROLE_HIERARCHY.resident_owner);
  });

  it('22. superintendent has lower privilege than property_manager', () => {
    expect(ROLE_HIERARCHY.superintendent).toBeLessThan(ROLE_HIERARCHY.property_manager);
  });
});

// ===========================================================================
// GAP 3.3 — Authorized Entry Tracking
// ===========================================================================

describe('GAP 3.3 — Authorized Entry event type template', () => {
  // -----------------------------------------------------------------------
  // Template existence
  // -----------------------------------------------------------------------

  it('23. authorized-entry template exists in default event types', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template).toBeDefined();
  });

  it('24. authorized-entry is in the security category', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.category).toBe('security');
  });

  it('25. authorized-entry has a name of "Authorized Entry"', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.name).toBe('Authorized Entry');
  });

  it('26. authorized-entry has medium default priority', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.defaultPriority).toBe('medium');
  });

  it('27. authorized-entry has a valid hex color', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('28. authorized-entry has kebab-case slug', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  // -----------------------------------------------------------------------
  // Custom fields schema — required fields
  // -----------------------------------------------------------------------

  it('29. authorized-entry has customFieldsSchema defined', () => {
    const template = getEventTypeBySlug('authorized-entry');
    expect(template!.customFieldsSchema).toBeDefined();
    expect(template!.customFieldsSchema).not.toBeNull();
  });

  it('30. authorized-entry requires unitNumber field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const required = schema['required'] as string[];
    expect(required).toContain('unitNumber');
  });

  it('31. authorized-entry requires authorizedBy field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const required = schema['required'] as string[];
    expect(required).toContain('authorizedBy');
  });

  it('32. authorized-entry requires entryReason field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const required = schema['required'] as string[];
    expect(required).toContain('entryReason');
  });

  it('33. authorized-entry requires entryTime field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const required = schema['required'] as string[];
    expect(required).toContain('entryTime');
  });

  // -----------------------------------------------------------------------
  // Custom fields schema — authorization types
  // -----------------------------------------------------------------------

  it('34. authorized-entry includes authorizationType enum', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const authType = props['authorizationType'];
    expect(authType).toBeDefined();
    expect(authType!['enum']).toBeDefined();
  });

  it('35. authorizationType includes resident_present', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const enumValues = props['authorizationType']!['enum'] as string[];
    expect(enumValues).toContain('resident_present');
  });

  it('36. authorizationType includes emergency', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const enumValues = props['authorizationType']!['enum'] as string[];
    expect(enumValues).toContain('emergency');
  });

  it('37. authorizationType includes management_order', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const enumValues = props['authorizationType']!['enum'] as string[];
    expect(enumValues).toContain('management_order');
  });

  it('38. authorizationType includes written_consent', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const enumValues = props['authorizationType']!['enum'] as string[];
    expect(enumValues).toContain('written_consent');
  });

  it('39. authorizationType includes standing_permission', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    const enumValues = props['authorizationType']!['enum'] as string[];
    expect(enumValues).toContain('standing_permission');
  });

  // -----------------------------------------------------------------------
  // Custom fields schema — tracking fields
  // -----------------------------------------------------------------------

  it('40. authorized-entry includes exitTime field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['exitTime']).toBeDefined();
  });

  it('41. authorized-entry includes staffMembers array field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['staffMembers']).toBeDefined();
    expect(props['staffMembers']!['type']).toBe('array');
  });

  it('42. authorized-entry includes residentNotified boolean', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['residentNotified']).toBeDefined();
    expect(props['residentNotified']!['type']).toBe('boolean');
  });

  it('43. authorized-entry includes workPerformed text field', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const props = schema['properties'] as Record<string, Record<string, unknown>>;
    expect(props['workPerformed']).toBeDefined();
    expect(props['workPerformed']!['type']).toBe('string');
  });

  // -----------------------------------------------------------------------
  // Seeding
  // -----------------------------------------------------------------------

  it('44. authorized-entry is included when seeding a new property', () => {
    const result = seedEventTypesForProperty('test-property-id');
    expect(result.templates).toContain('authorized-entry');
  });

  it('45. authorized-entry is part of security category', () => {
    const securityTemplates = getEventTypesByCategory('security');
    const slugs = securityTemplates.map((t) => t.slug);
    expect(slugs).toContain('authorized-entry');
  });

  it('46. creating an authorized entry event uses the template schema', () => {
    const template = getEventTypeBySlug('authorized-entry');
    const eventData = {
      eventTypeSlug: 'authorized-entry',
      customFields: {
        unitNumber: '1205',
        authorizedBy: 'Cory Manager',
        authorizationType: 'management_order',
        entryReason: 'Annual fire inspection of smoke detectors',
        entryTime: '2026-03-19T10:30:00Z',
        exitTime: '2026-03-19T10:45:00Z',
        staffMembers: ['Mike Technician', 'Sara Inspector'],
        workPerformed: 'Tested and replaced batteries in smoke detectors. All units pass.',
        residentNotified: true,
      },
    };

    // Verify event data matches the schema required fields
    const schema = template!.customFieldsSchema as Record<string, unknown>;
    const requiredFields = schema['required'] as string[];
    for (const field of requiredFields) {
      expect(eventData.customFields).toHaveProperty(field);
    }
  });
});
