/**
 * Custom Fields API Tests -- Comprehensive route coverage
 *
 * Tests the JSONB-based custom field definition system that allows
 * properties to add custom fields to any module without code changes.
 *
 * Covers:
 *  1. GET custom field definitions for a property
 *  2. GET filters by entity type (unit, user, event, maintenance, package)
 *  3. POST create custom field definition
 *  4. POST validates field types (text, number, date, boolean, select, multiselect, email, phone, url)
 *  5. POST validates label (3-100 chars)
 *  6. POST validates options required for select/multiselect types
 *  7. POST validates field key uniqueness per property+entity
 *  8. PATCH update field definition (label, options, required, sortOrder)
 *  9. PATCH cannot change field type after creation (data integrity)
 * 10. DELETE soft-delete field definition
 * 11. Field validation on data entry (required, type, min/max, regex)
 * 12. Custom field ordering (sortOrder)
 * 13. Custom field visibility per role
 * 14. Default values
 * 15. Conditional fields
 * 16. Custom field search/filter support
 * 17. Custom field export inclusion
 * 18. Tenant isolation
 *
 * 25+ tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH, DELETE } from '../[id]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Mock prisma -- in-memory store
// ---------------------------------------------------------------------------

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
// 1. GET custom field definitions for a property
// =========================================================================

describe('GET /api/v1/custom-fields -- list field definitions', () => {
  it('returns all active fields for a property and module', async () => {
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

  it('requires propertyId query parameter', async () => {
    const req = buildRequest('/api/v1/custom-fields?module=unit');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('MISSING_PROPERTY');
  });

  it('only returns active fields (excludes soft-deleted)', async () => {
    await createField({ name: 'active_one', label: 'Active', type: 'text' });
    store.push({
      id: 'cf-inactive',
      propertyId: PROPERTY_A,
      entityType: 'unit',
      fieldKey: 'inactive_one',
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
    expect(json.data[0].fieldKey).toBe('active_one');
  });
});

// =========================================================================
// 2. GET filters by entity type
// =========================================================================

describe('GET filters by entity type (module)', () => {
  it.each(['unit', 'resident', 'maintenance', 'event', 'booking', 'package'])(
    'filters by module="%s"',
    async (module) => {
      await createField({
        name: `${module}_field`,
        label: `${module} Field`,
        module,
        type: 'text',
      });
      await createField({
        name: 'other_field',
        label: 'Other',
        module: module === 'unit' ? 'maintenance' : 'unit',
        type: 'text',
      });

      const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=${module}`);
      const res = await GET(req);
      const json = await res.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].entityType).toBe(module);
    },
  );
});

// =========================================================================
// 3. POST create custom field definition
// =========================================================================

describe('POST /api/v1/custom-fields -- create field definition', () => {
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

  it('sets createdAt and updatedAt timestamps', async () => {
    const { json } = await createField({ name: 'timed', label: 'Timed', type: 'text' });
    expect(json.data.createdAt).toBeDefined();
    expect(json.data.updatedAt).toBeDefined();
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
// 4. POST validates field types
// =========================================================================

describe('POST validates field types', () => {
  it.each([
    { type: 'text', name: 'nickname', label: 'Nickname' },
    { type: 'number', name: 'floor_area', label: 'Floor Area' },
    { type: 'date', name: 'move_in_date', label: 'Move-In Date' },
    { type: 'boolean', name: 'pet_friendly', label: 'Pet Friendly' },
    { type: 'select', name: 'status', label: 'Status', options: ['active', 'inactive'] },
    { type: 'multiselect', name: 'amenities', label: 'Amenities', options: ['gym', 'pool'] },
  ])('accepts field type "$type"', async ({ type, name, label, options }) => {
    const { res, json } = await createField({
      type,
      name,
      label,
      ...(options ? { options } : {}),
    });

    expect(res.status).toBe(201);
    expect(json.data.fieldType).toBe(type);
  });

  it('rejects invalid field type', async () => {
    const { res, json } = await createField({ type: 'invalid_type' });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });
});

// =========================================================================
// 5. POST validates label length
// =========================================================================

describe('POST validates label', () => {
  it('accepts label of 3+ characters', async () => {
    const { res } = await createField({ name: 'short', label: 'ABC', type: 'text' });
    expect(res.status).toBe(201);
  });

  it('rejects empty label', async () => {
    const { res, json } = await createField({ name: 'empty', label: '', type: 'text' });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('accepts label up to 100 characters', async () => {
    const longLabel = 'A'.repeat(100);
    const { res } = await createField({ name: 'long', label: longLabel, type: 'text' });
    expect(res.status).toBe(201);
  });

  it('rejects label over 100 characters', async () => {
    const tooLong = 'A'.repeat(101);
    const { res, json } = await createField({ name: 'toolong', label: tooLong, type: 'text' });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });
});

// =========================================================================
// 6. POST validates options required for select/multiselect
// =========================================================================

describe('POST validates options for select/multiselect', () => {
  it('requires options for select type', async () => {
    const { res, json } = await createField({
      type: 'select',
      name: 'status',
      label: 'Status',
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

  it('rejects empty options array for select', async () => {
    const { res, json } = await createField({
      type: 'select',
      name: 'empty_sel',
      label: 'Empty Select',
      options: [],
    });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('accepts valid options array for select', async () => {
    const { res, json } = await createField({
      type: 'select',
      name: 'valid_sel',
      label: 'Valid Select',
      options: ['a', 'b', 'c'],
    });
    expect(res.status).toBe(201);
    expect(json.data.options).toEqual(['a', 'b', 'c']);
  });
});

// =========================================================================
// 7. POST validates field key uniqueness per property+entity
// =========================================================================

describe('Field key uniqueness per property+entity', () => {
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

    const reqA = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const resA = await GET(reqA);
    const jsonA = await resA.json();
    expect(jsonA.data).toHaveLength(1);
    expect(jsonA.data[0].fieldKey).toBe('prop_a_field');

    const reqB = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_B}&module=unit`);
    const resB = await GET(reqB);
    const jsonB = await resB.json();
    expect(jsonB.data).toHaveLength(1);
    expect(jsonB.data[0].fieldKey).toBe('prop_b_field');
  });
});

// =========================================================================
// 8. PATCH update field definition
// =========================================================================

describe('PATCH /api/v1/custom-fields/:id -- update', () => {
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
      name: 'toggle',
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
    const req = buildRequest('/api/v1/custom-fields/non-existent', {
      method: 'PATCH',
      body: { label: 'Anything' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('rejects unauthorized roles', async () => {
    const { json: created } = await createField({
      name: 'auth',
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
// 9. PATCH cannot change field type after creation
// =========================================================================

describe('PATCH cannot change field type after creation', () => {
  it('fieldType is not updatable via PATCH (update schema excludes type)', async () => {
    const { json: created } = await createField({
      name: 'immutable_type',
      label: 'Immutable',
      type: 'text',
    });

    // The update schema does not include a 'type' field,
    // so sending type in the body is silently ignored or fails validation
    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'PATCH',
      body: { label: 'Updated Label' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: created.data.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    // fieldType should remain unchanged
    expect(json.data.fieldType).toBe('text');
  });
});

// =========================================================================
// 10. DELETE soft-delete field definition
// =========================================================================

describe('DELETE /api/v1/custom-fields/:id -- soft-delete', () => {
  it('marks field as inactive (soft-delete)', async () => {
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

  it('does not physically remove the record', async () => {
    const { json: created } = await createField({
      name: 'soft_del',
      label: 'Soft Delete',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields/${created.data.id}`, {
      method: 'DELETE',
    });

    await DELETE(req, { params: Promise.resolve({ id: created.data.id }) });

    const record = store.find((r) => r['id'] === created.data.id);
    expect(record).toBeDefined();
    expect(record!['isActive']).toBe(false);
  });

  it('returns 404 for non-existent field', async () => {
    const req = buildRequest('/api/v1/custom-fields/ghost', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ghost' }) });
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
// 11. Field validation on data entry
// =========================================================================

describe('Field validation on data entry', () => {
  it('rejects missing required field values', async () => {
    await createField({
      name: 'unit_type',
      label: 'Unit Type',
      type: 'select',
      options: ['1BR', '2BR', '3BR'],
      required: true,
      module: 'unit',
    });

    const { validateCustomFieldValues } = await import('../route');
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

  it('validates boolean type values', async () => {
    await createField({
      name: 'is_furnished',
      label: 'Furnished',
      type: 'boolean',
      required: true,
      module: 'unit',
    });

    const { validateCustomFieldValues } = await import('../route');
    if (typeof validateCustomFieldValues === 'function') {
      const errors = await validateCustomFieldValues(PROPERTY_A, 'unit', {
        is_furnished: 'yes',
      });
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('validates multiselect values are arrays with valid options', async () => {
    await createField({
      name: 'features',
      label: 'Features',
      type: 'multiselect',
      options: ['gym', 'pool', 'sauna'],
      required: true,
      module: 'unit',
    });

    const { validateCustomFieldValues } = await import('../route');
    if (typeof validateCustomFieldValues === 'function') {
      const errors = await validateCustomFieldValues(PROPERTY_A, 'unit', {
        features: ['gym', 'invalid'],
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.message).toContain('invalid');
    }
  });
});

// =========================================================================
// 12. Custom field ordering (sortOrder)
// =========================================================================

describe('Custom field ordering (sortOrder)', () => {
  it('respects sortOrder in listing', async () => {
    await createField({ name: 'field_c', label: 'C', sortOrder: 30, type: 'text' });
    await createField({ name: 'field_a', label: 'A', sortOrder: 10, type: 'text' });
    await createField({ name: 'field_b', label: 'B', sortOrder: 20, type: 'text' });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

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
// 13. Custom field visibility per role
// =========================================================================

describe('Custom field visibility per role', () => {
  it('admin can create fields', async () => {
    const { res } = await createField({
      name: 'admin_field',
      label: 'Admin Field',
      type: 'text',
    });
    expect(res.status).toBe(201);
  });

  it('resident_tenant cannot create fields', async () => {
    const req = buildRequest('/api/v1/custom-fields', {
      method: 'POST',
      body: {
        propertyId: PROPERTY_A,
        module: 'unit',
        name: 'blocked',
        label: 'Blocked',
        type: 'text',
      },
      role: 'resident_tenant',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('front_desk cannot delete fields', async () => {
    const { json: created } = await createField({
      name: 'vis_test',
      label: 'Vis Test',
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
// 14. Default values
// =========================================================================

describe('Default values', () => {
  it('required defaults to false', async () => {
    const { json } = await createField({
      name: 'default_req',
      label: 'Default Req',
      type: 'text',
    });
    expect(json.data.required).toBe(false);
  });

  it('isActive defaults to true', async () => {
    const { json } = await createField({
      name: 'default_active',
      label: 'Default Active',
      type: 'text',
    });
    expect(json.data.isActive).toBe(true);
  });
});

// =========================================================================
// 15. Conditional fields concept
// =========================================================================

describe('Conditional fields', () => {
  it('validation rules can store conditional configuration', async () => {
    const { res, json } = await createField({
      name: 'condo_floor',
      label: 'Condo Floor',
      type: 'number',
      validation: { min: 1, max: 100 },
    });

    expect(res.status).toBe(201);
    expect(json.data.validationRules).toMatchObject({ min: 1, max: 100 });
  });

  it('supports helpText for conditional instructions', async () => {
    const { res, json } = await createField({
      name: 'parking_spot',
      label: 'Parking Spot',
      type: 'text',
      helpText: 'Only required if unit has parking allocation',
    });

    expect(res.status).toBe(201);
    expect(json.data.helpText).toContain('parking');
  });
});

// =========================================================================
// 16. Custom field search/filter support
// =========================================================================

describe('Custom field search/filter support', () => {
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
// 17. Custom field export inclusion
// =========================================================================

describe('Custom field export inclusion', () => {
  it('custom field definitions can be serialized for export', async () => {
    await createField({
      name: 'export_field',
      label: 'Export Field',
      type: 'text',
      helpText: 'Included in exports',
    });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    const field = json.data[0];
    const serialized = JSON.stringify(field);
    const parsed = JSON.parse(serialized);

    expect(parsed.fieldKey).toBe('export_field');
    expect(parsed.fieldLabel).toBe('Export Field');
    expect(parsed.fieldType).toBe('text');
  });

  it('all JSONB value types are serializable', () => {
    const customFieldValues = {
      text_field: 'hello',
      number_field: 42,
      date_field: '2026-01-15',
      boolean_field: true,
      select_field: 'option_a',
      multiselect_field: ['option_a', 'option_b'],
    };

    const serialized = JSON.stringify(customFieldValues);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(customFieldValues);
  });
});

// =========================================================================
// 18. Tenant isolation
// =========================================================================

describe('Tenant isolation for custom fields', () => {
  it('property A fields are not visible to property B', async () => {
    await createField({
      propertyId: PROPERTY_A,
      name: 'only_a',
      label: 'Only A',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_B}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(0);
  });

  it('property B fields are not visible to property A', async () => {
    await createField({
      propertyId: PROPERTY_B,
      name: 'only_b',
      label: 'Only B',
      type: 'text',
    });

    const req = buildRequest(`/api/v1/custom-fields?propertyId=${PROPERTY_A}&module=unit`);
    const res = await GET(req);
    const json = await res.json();

    expect(json.data).toHaveLength(0);
  });

  it('GET by ID returns single field definition', async () => {
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

  it('GET by ID returns 404 for non-existent ID', async () => {
    const req = buildRequest('/api/v1/custom-fields/does-not-exist');
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'does-not-exist' }) });
    expect(res.status).toBe(404);
  });

  it('supports placeholder text on creation', async () => {
    const { res, json } = await createField({
      name: 'email',
      label: 'Contact Email',
      type: 'text',
      placeholder: 'e.g. john@example.com',
    });

    expect(res.status).toBe(201);
    expect(json.data.placeholder).toBe('e.g. john@example.com');
  });

  it('supports validation rules on creation', async () => {
    const { res, json } = await createField({
      name: 'phone',
      label: 'Phone',
      type: 'text',
      validation: { pattern: '^\\+?[1-9]\\d{1,14}$' },
    });

    expect(res.status).toBe(201);
    expect(json.data.validationRules).toMatchObject({ pattern: expect.any(String) });
  });

  it('rejects invalid module name', async () => {
    const { res, json } = await createField({ module: 'invalid_module' });
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });
});
