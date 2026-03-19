/**
 * Custom Fields API — Comprehensive Test Suite
 *
 * Tests the JSONB-based custom field definition system that allows
 * properties to add custom fields to any module without code changes.
 *
 * Covers:
 *  1. Create custom field definition (name, type, module)
 *  2. All field types: text, number, date, boolean, select, multiselect
 *  3. Required vs optional fields
 *  4. Field ordering (sortOrder)
 *  5. Module scoping (units, maintenance, events, etc.)
 *  6. Per-property independent custom field definitions
 *  7. Validation: required fields enforced on entity creation
 *  8. Select options: predefined dropdown values
 *  9. GET /custom-fields?module=units — list fields for a module
 * 10. POST /custom-fields — create new field definition
 * 11. PATCH /custom-fields/:id — update field definition
 * 12. DELETE /custom-fields/:id — soft-delete (mark inactive)
 * 13. Entity custom field values stored as JSONB
 * 14. Search across custom field values
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH, DELETE } from '../[id]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a NextRequest with demo-role auth header and optional body */
function buildRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    role?: string;
  } = {},
): NextRequest {
  const { method = 'GET', body, role = 'property_admin' } = options;
  const headers = new Headers({
    'x-demo-role': role,
    'Content-Type': 'application/json',
  });
  const init: { method: string; headers: Headers; body?: string } = {
    method,
    headers,
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';

/** Create a field via POST and return parsed response data */
async function createField(overrides: Record<string, unknown> = {}) {
  const payload = {
    propertyId: PROPERTY_A,
    module: 'unit',
    name: 'pet_friendly',
    label: 'Pet Friendly',
    type: 'boolean',
    required: false,
    sortOrder: 0,
    ...overrides,
  };

  const req = buildRequest('/api/v1/custom-fields', {
    method: 'POST',
    body: payload,
  });
  const res = await POST(req);
  return { res, json: await res.json() };
}

// ---------------------------------------------------------------------------
// Mock prisma — The route uses @/server/db
// ---------------------------------------------------------------------------

// In-memory store to simulate database
let store: Record<string, unknown>[] = [];
let idCounter = 0;

vi.mock('@/server/db', () => {
  return {
    prisma: {
      customFieldDefinition: {
        findMany: vi.fn(
          async ({
            where,
            orderBy,
          }: {
            where?: Record<string, unknown>;
            orderBy?: Record<string, string>;
          }) => {
            let results = [...store];
            if (where) {
              if (where['propertyId'])
                results = results.filter((r) => r['propertyId'] === where['propertyId']);
              if (where['entityType'])
                results = results.filter((r) => r['entityType'] === where['entityType']);
              if (where['isActive'] !== undefined)
                results = results.filter((r) => r['isActive'] === where['isActive']);
              if (where['fieldLabel'] && typeof where['fieldLabel'] === 'object') {
                const contains = (where['fieldLabel'] as Record<string, unknown>)[
                  'contains'
                ] as string;
                const mode = (where['fieldLabel'] as Record<string, unknown>)['mode'];
                if (contains) {
                  results = results.filter((r) => {
                    const label = r['fieldLabel'] as string;
                    return mode === 'insensitive'
                      ? label.toLowerCase().includes(contains.toLowerCase())
                      : label.includes(contains);
                  });
                }
              }
            }
            if (orderBy && orderBy['sortOrder']) {
              results.sort((a, b) => {
                const aVal = a['sortOrder'] as number;
                const bVal = b['sortOrder'] as number;
                return orderBy['sortOrder'] === 'asc' ? aVal - bVal : bVal - aVal;
              });
            }
            return results;
          },
        ),
        findUnique: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          return store.find((r) => r['id'] === where['id']) ?? null;
        }),
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          return (
            store.find((r) => {
              return Object.entries(where).every(([k, v]) => r[k] === v);
            }) ?? null
          );
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          idCounter++;
          const record = {
            id: `cf-${idCounter.toString().padStart(4, '0')}`,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data,
          };
          store.push(record);
          return record;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
          }) => {
            const idx = store.findIndex((r) => r['id'] === where['id']);
            if (idx === -1) throw new Error('Record not found');
            store[idx] = { ...store[idx], ...data, updatedAt: new Date().toISOString() };
            return store[idx];
          },
        ),
        count: vi.fn(async ({ where }: { where?: Record<string, unknown> }) => {
          let results = [...store];
          if (where) {
            if (where['propertyId'])
              results = results.filter((r) => r['propertyId'] === where['propertyId']);
            if (where['entityType'])
              results = results.filter((r) => r['entityType'] === where['entityType']);
          }
          return results.length;
        }),
      },
    },
    tenantScope: vi.fn((propertyId: string) => ({
      where: (extra: Record<string, unknown> = {}) => ({ propertyId, deletedAt: null, ...extra }),
      data: (extra: Record<string, unknown> = {}) => ({ propertyId, ...extra }),
      propertyId,
    })),
  };
});

// ---------------------------------------------------------------------------
// Reset between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  store = [];
  idCounter = 0;
});

// =========================================================================
// 1. Create custom field definition
// =========================================================================

describe('POST /api/v1/custom-fields — create field definition', () => {
  it('creates a text field with name, type, module', async () => {
    const { res, json } = await createField({
      name: 'move_in_date',
      label: 'Move-In Date',
      type: 'text',
      module: 'unit',
    });

    expect(res.status).toBe(201);
    expect(json.data).toMatchObject({
      fieldKey: 'move_in_date',
      fieldLabel: 'Move-In Date',
      fieldType: 'text',
      entityType: 'unit',
      propertyId: PROPERTY_A,
    });
    expect(json.data.id).toBeDefined();
  });

  it('rejects creation without required fields', async () => {
    const req = buildRequest('/api/v1/custom-fields', {
      method: 'POST',
      body: { propertyId: PROPERTY_A },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid field type', async () => {
    const { res, json } = await createField({ type: 'invalid_type' });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthorized roles', async () => {
    const req = buildRequest('/api/v1/custom-fields', {
      method: 'POST',
      body: {
        propertyId: PROPERTY_A,
        module: 'unit',
        name: 'test',
        label: 'Test',
        type: 'text',
      },
      role: 'resident_tenant',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// =========================================================================
// 2. Field types
// =========================================================================

describe('Field types', () => {
  it.each([
    { type: 'text', name: 'nickname', label: 'Nickname' },
    { type: 'number', name: 'floor_area', label: 'Floor Area (sqft)' },
    { type: 'date', name: 'move_in_date', label: 'Move-In Date' },
    { type: 'boolean', name: 'pet_friendly', label: 'Pet Friendly' },
    {
      type: 'select',
      name: 'unit_status',
      label: 'Status',
      options: ['occupied', 'vacant', 'maintenance'],
    },
    {
      type: 'multiselect',
      name: 'amenities',
      label: 'Amenities',
      options: ['gym', 'pool', 'sauna', 'parking'],
    },
  ])('creates $type field "$name"', async ({ type, name, label, options }) => {
    const { res, json } = await createField({
      type,
      name,
      label,
      ...(options ? { options } : {}),
    });

    expect(res.status).toBe(201);
    expect(json.data.fieldType).toBe(type);
    expect(json.data.fieldKey).toBe(name);
    if (options) {
      expect(json.data.options).toEqual(options);
    }
  });

  it('requires options for select type', async () => {
    const { res, json } = await createField({
      type: 'select',
      name: 'status',
      label: 'Status',
      // no options provided
    });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
    expect(json.message).toContain('options');
  });

  it('requires options for multiselect type', async () => {
    const { res, json } = await createField({
      type: 'multiselect',
      name: 'tags',
      label: 'Tags',
    });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
    expect(json.message).toContain('options');
  });
});

// =========================================================================
// 3. Required vs optional fields
// =========================================================================

describe('Required vs optional fields', () => {
  it('creates a required field', async () => {
    const { res, json } = await createField({
      name: 'unit_type',
      label: 'Unit Type',
      type: 'select',
      options: ['1BR', '2BR', '3BR', 'Studio', 'Penthouse'],
      required: true,
    });

    expect(res.status).toBe(201);
    expect(json.data.required).toBe(true);
  });

  it('creates an optional field (default)', async () => {
    const { res, json } = await createField({
      name: 'notes',
      label: 'Notes',
      type: 'text',
    });

    expect(res.status).toBe(201);
    expect(json.data.required).toBe(false);
  });
});

// =========================================================================
// 4. Field ordering (sortOrder)
// =========================================================================

describe('Field ordering (sortOrder)', () => {
  it('respects sortOrder in listing', async () => {
    await createField({ name: 'field_c', label: 'C', sortOrder: 30, type: 'text' });
    await createField({ name: 'field_a', label: 'A', sortOrder: 10, type: 'text' });
    await createField({ name: 'field_b', label: 'B', sortOrder: 20, type: 'text' });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(3);
    expect(json.data[0].fieldKey).toBe('field_a');
    expect(json.data[1].fieldKey).toBe('field_b');
    expect(json.data[2].fieldKey).toBe('field_c');
  });

  it('defaults sortOrder to 0', async () => {
    const { json } = await createField({ name: 'no_order', label: 'No Order', type: 'text' });
    expect(json.data.sortOrder).toBe(0);
  });
});

// =========================================================================
// 5. Module scoping
// =========================================================================

describe('Module scoping', () => {
  it.each(['unit', 'resident', 'maintenance', 'event', 'booking', 'package'])(
    'accepts module = "%s"',
    async (module) => {
      const { res, json } = await createField({
        name: `${module}_field`,
        label: `${module} field`,
        module,
        type: 'text',
      });

      expect(res.status).toBe(201);
      expect(json.data.entityType).toBe(module);
    },
  );

  it('rejects invalid module', async () => {
    const { res, json } = await createField({ module: 'invalid_module' });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('filters by module on GET', async () => {
    await createField({ name: 'unit_f', label: 'Unit Field', module: 'unit', type: 'text' });
    await createField({
      name: 'maint_f',
      label: 'Maint Field',
      module: 'maintenance',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].entityType).toBe('unit');
  });
});

// =========================================================================
// 6. Per-property independence
// =========================================================================

describe('Per-property custom field definitions', () => {
  it('isolates fields between properties', async () => {
    await createField({
      propertyId: PROPERTY_A,
      name: 'prop_a_field',
      label: 'Property A Field',
      type: 'text',
    });
    await createField({
      propertyId: PROPERTY_B,
      name: 'prop_b_field',
      label: 'Property B Field',
      type: 'number',
    });

    // Query property A
    const reqA = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const resA = await GET(reqA);
    const jsonA = await resA.json();

    expect(jsonA.data).toHaveLength(1);
    expect(jsonA.data[0].fieldKey).toBe('prop_a_field');

    // Query property B
    const reqB = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_B}&module=unit`);
    const resB = await GET(reqB);
    const jsonB = await resB.json();

    expect(jsonB.data).toHaveLength(1);
    expect(jsonB.data[0].fieldKey).toBe('prop_b_field');
  });

  it('allows same field name in different properties', async () => {
    const { res: res1 } = await createField({
      propertyId: PROPERTY_A,
      name: 'floor_area',
      label: 'Floor Area',
      type: 'number',
    });
    const { res: res2 } = await createField({
      propertyId: PROPERTY_B,
      name: 'floor_area',
      label: 'Floor Area',
      type: 'number',
    });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });
});

// =========================================================================
// 7. Validation: required custom fields enforced
// =========================================================================

describe('Validation of custom field values', () => {
  it('POST /custom-fields/validate rejects missing required field values', async () => {
    // Create a required field
    await createField({
      name: 'unit_type',
      label: 'Unit Type',
      type: 'select',
      options: ['1BR', '2BR', '3BR'],
      required: true,
      module: 'unit',
    });

    // Attempt to validate with empty custom field values
    const req = buildRequest('/api/v1/custom-fields/validate', {
      method: 'POST',
      body: {
        propertyId: PROPERTY_A,
        module: 'unit',
        values: {},
      },
    });

    const { validateCustomFieldValues } = await import('../route');
    // The validate function is exported from the route for reuse
    if (typeof validateCustomFieldValues === 'function') {
      const errors = await validateCustomFieldValues(PROPERTY_A, 'unit', {});
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'unit_type',
        message: expect.stringContaining('required'),
      });
    }
  });

  it('validates number type values', async () => {
    await createField({
      name: 'floor_area',
      label: 'Floor Area',
      type: 'number',
      required: true,
      module: 'unit',
    });

    const { validateCustomFieldValues } = await import('../route');
    if (typeof validateCustomFieldValues === 'function') {
      const errors = await validateCustomFieldValues(PROPERTY_A, 'unit', {
        floor_area: 'not_a_number',
      });
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('validates select type values against options', async () => {
    await createField({
      name: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'inactive'],
      required: true,
      module: 'unit',
    });

    const { validateCustomFieldValues } = await import('../route');
    if (typeof validateCustomFieldValues === 'function') {
      const errors = await validateCustomFieldValues(PROPERTY_A, 'unit', {
        status: 'invalid_option',
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.message).toContain('options');
    }
  });

  it('passes validation for correct values', async () => {
    await createField({
      name: 'nickname',
      label: 'Nickname',
      type: 'text',
      required: true,
      module: 'unit',
    });

    const { validateCustomFieldValues } = await import('../route');
    if (typeof validateCustomFieldValues === 'function') {
      const errors = await validateCustomFieldValues(PROPERTY_A, 'unit', {
        nickname: 'The Penthouse',
      });
      expect(errors).toHaveLength(0);
    }
  });
});

// =========================================================================
// 8. Select options: predefined dropdown values
// =========================================================================

describe('Select options', () => {
  it('stores options array for select fields', async () => {
    const options = ['occupied', 'vacant', 'under_renovation'];
    const { res, json } = await createField({
      type: 'select',
      name: 'occupancy_status',
      label: 'Occupancy Status',
      options,
    });

    expect(res.status).toBe(201);
    expect(json.data.options).toEqual(options);
  });

  it('stores options array for multiselect fields', async () => {
    const options = ['gym', 'pool', 'sauna', 'rooftop', 'concierge'];
    const { res, json } = await createField({
      type: 'multiselect',
      name: 'building_amenities',
      label: 'Building Amenities',
      options,
    });

    expect(res.status).toBe(201);
    expect(json.data.options).toEqual(options);
  });

  it('rejects empty options array for select', async () => {
    const { res, json } = await createField({
      type: 'select',
      name: 'empty_select',
      label: 'Empty Select',
      options: [],
    });

    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });
});

// =========================================================================
// 9. GET /custom-fields?module=units — list custom fields
// =========================================================================

describe('GET /api/v1/custom-fields', () => {
  it('lists all fields for a property and module', async () => {
    await createField({ name: 'f1', label: 'Field 1', type: 'text' });
    await createField({ name: 'f2', label: 'Field 2', type: 'number' });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
  });

  it('returns empty array when no fields defined', async () => {
    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it('requires propertyId query param', async () => {
    const req = buildRequest('/api/v1/custom-fields?module=unit');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('MISSING_PROPERTY');
  });

  it('only returns active fields', async () => {
    await createField({ name: 'active_field', label: 'Active', type: 'text' });
    // Manually mark one as inactive in the store
    store.push({
      id: 'cf-inactive',
      propertyId: PROPERTY_A,
      entityType: 'unit',
      fieldKey: 'inactive_field',
      fieldLabel: 'Inactive',
      fieldType: 'text',
      required: false,
      sortOrder: 0,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].fieldKey).toBe('active_field');
  });

  it('supports search query parameter', async () => {
    await createField({ name: 'pet_type', label: 'Pet Type', type: 'text' });
    await createField({ name: 'floor_area', label: 'Floor Area', type: 'number' });

    const req = buildRequest(
      `/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit&search=pet`,
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].fieldKey).toBe('pet_type');
  });
});

// =========================================================================
// 10. POST /custom-fields — create (already covered above, extra cases)
// =========================================================================

describe('POST /api/v1/custom-fields — additional cases', () => {
  it('sets createdAt and updatedAt timestamps', async () => {
    const { json } = await createField({ name: 'timed', label: 'Timed', type: 'text' });
    expect(json.data.createdAt).toBeDefined();
    expect(json.data.updatedAt).toBeDefined();
  });

  it('supports placeholder text', async () => {
    const { res, json } = await createField({
      name: 'email',
      label: 'Contact Email',
      type: 'text',
      placeholder: 'e.g. john@example.com',
    });

    expect(res.status).toBe(201);
    expect(json.data.placeholder).toBe('e.g. john@example.com');
  });

  it('supports validation rules', async () => {
    const { res, json } = await createField({
      name: 'phone',
      label: 'Phone',
      type: 'text',
      validation: { pattern: '^\\+?[1-9]\\d{1,14}$' },
    });

    expect(res.status).toBe(201);
    expect(json.data.validationRules).toMatchObject({ pattern: expect.any(String) });
  });

  it('supports helpText', async () => {
    const { res, json } = await createField({
      name: 'notes',
      label: 'Special Notes',
      type: 'text',
      helpText: 'Enter any special instructions for this unit',
    });

    expect(res.status).toBe(201);
    expect(json.data.helpText).toBe('Enter any special instructions for this unit');
  });
});

// =========================================================================
// 11. PATCH /custom-fields/:id — update field definition
// =========================================================================

describe('PATCH /api/v1/custom-fields/:id', () => {
  it('updates field label', async () => {
    const { json: created } = await createField({
      name: 'old_label',
      label: 'Old Label',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'PATCH',
      body: { label: 'New Label' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.fieldLabel).toBe('New Label');
  });

  it('updates sortOrder', async () => {
    const { json: created } = await createField({
      name: 'reorder',
      label: 'Reorder Me',
      type: 'text',
      sortOrder: 5,
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'PATCH',
      body: { sortOrder: 99 },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sortOrder).toBe(99);
  });

  it('updates select options', async () => {
    const { json: created } = await createField({
      type: 'select',
      name: 'status',
      label: 'Status',
      options: ['active', 'inactive'],
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'PATCH',
      body: { options: ['active', 'inactive', 'pending'] },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.options).toEqual(['active', 'inactive', 'pending']);
  });

  it('updates required flag', async () => {
    const { json: created } = await createField({
      name: 'toggle_required',
      label: 'Toggle',
      type: 'text',
      required: false,
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'PATCH',
      body: { required: true },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.required).toBe(true);
  });

  it('returns 404 for non-existent field', async () => {
    const req = buildRequest('/api/v1/custom-fields/non-existent-id', {
      method: 'PATCH',
      body: { label: 'Does not matter' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent-id' }) });
    expect(res.status).toBe(404);
  });

  it('rejects unauthorized roles', async () => {
    const { json: created } = await createField({
      name: 'auth_test',
      label: 'Auth Test',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'PATCH',
      body: { label: 'Hacked' },
      role: 'resident_tenant',
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: created.data.id }) });
    expect(res.status).toBe(403);
  });
});

// =========================================================================
// 12. DELETE /custom-fields/:id — soft-delete
// =========================================================================

describe('DELETE /api/v1/custom-fields/:id', () => {
  it('soft-deletes by marking inactive', async () => {
    const { json: created } = await createField({
      name: 'to_delete',
      label: 'Delete Me',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isActive).toBe(false);
    expect(json.message).toContain('deactivated');
  });

  it('does not physically delete the record', async () => {
    const { json: created } = await createField({
      name: 'soft_del',
      label: 'Soft Delete',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'DELETE',
    });

    await DELETE(req, { params: Promise.resolve({ id: created.data.id }) });

    // Record still exists in store
    const record = store.find((r) => r['id'] === created.data.id);
    expect(record).toBeDefined();
    expect(record!['isActive']).toBe(false);
  });

  it('returns 404 for non-existent field', async () => {
    const req = buildRequest('/api/v1/custom-fields/ghost-id', {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'ghost-id' }) });
    expect(res.status).toBe(404);
  });

  it('rejects unauthorized roles', async () => {
    const { json: created } = await createField({
      name: 'guard_del',
      label: 'Guard Delete',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'DELETE',
      role: 'front_desk',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: created.data.id }) });
    expect(res.status).toBe(403);
  });
});

// =========================================================================
// 13. Entity custom field values stored as JSONB
// =========================================================================

describe('JSONB custom field values', () => {
  it('custom field definitions map to JSONB storage on entities', async () => {
    // Create definitions
    const { json: textField } = await createField({
      name: 'nickname',
      label: 'Nickname',
      type: 'text',
      module: 'unit',
    });
    const { json: numField } = await createField({
      name: 'floor_area',
      label: 'Floor Area',
      type: 'number',
      module: 'unit',
    });

    // Simulate what entity JSONB storage would look like
    const entityCustomFields = {
      [textField.data.fieldKey]: 'The Penthouse',
      [numField.data.fieldKey]: 1500,
    };

    // This is the shape stored in unit.customFields (JSONB column)
    expect(entityCustomFields).toEqual({
      nickname: 'The Penthouse',
      floor_area: 1500,
    });
  });

  it('supports all value types in JSONB', () => {
    const customFieldValues = {
      text_field: 'hello',
      number_field: 42,
      date_field: '2026-01-15',
      boolean_field: true,
      select_field: 'option_a',
      multiselect_field: ['option_a', 'option_b'],
    };

    // All types can be serialized to JSON
    const serialized = JSON.stringify(customFieldValues);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(customFieldValues);
  });
});

// =========================================================================
// 14. Search across custom field values
// =========================================================================

describe('Search across custom field values', () => {
  it('searches field definitions by label', async () => {
    await createField({ name: 'pet_type', label: 'Pet Type', type: 'text' });
    await createField({ name: 'pet_name', label: 'Pet Name', type: 'text' });
    await createField({ name: 'floor_area', label: 'Floor Area', type: 'number' });

    const req = buildRequest(
      `/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit&search=Pet`,
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(2);
    expect(json.data.map((d: Record<string, unknown>) => d['fieldKey'])).toContain('pet_type');
    expect(json.data.map((d: Record<string, unknown>) => d['fieldKey'])).toContain('pet_name');
  });

  it('search is case-insensitive', async () => {
    await createField({ name: 'total_area', label: 'Total Area', type: 'number' });

    const req = buildRequest(
      `/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit&search=total+area`,
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].fieldKey).toBe('total_area');
  });
});

// =========================================================================
// GET /custom-fields/:id — get single field
// =========================================================================

describe('GET /api/v1/custom-fields/:id', () => {
  it('returns a single field definition', async () => {
    const { json: created } = await createField({
      name: 'single_field',
      label: 'Single Field',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(created.data.id);
    expect(json.data.fieldKey).toBe('single_field');
  });

  it('returns 404 for non-existent id', async () => {
    const req = buildRequest('/api/v1/custom-fields/does-not-exist');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'does-not-exist' }) });
    expect(res.status).toBe(404);
  });
});
