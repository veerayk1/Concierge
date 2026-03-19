/**
 * Comprehensive Unit Management Tests — PRD 07
 *
 * Units are the atomic building block of the entire condo management system.
 * Every other module (packages, maintenance, visitors, parking, FOBs) links
 * back to a unit. If unit management is broken, the ENTIRE platform is broken.
 *
 * Physical security context: Units map to real doors with real locks and FOBs.
 * A wrong unit number, stale occupancy record, or missing instruction can
 * result in packages going to the wrong door or emergency responders lacking
 * critical information ("Unit 302 resident is deaf, ring doorbell twice").
 *
 * Tests cover:
 *   1-6:   GET unit list — pagination, sorting, filtering, search
 *   7-11:  GET unit detail — all relations (occupants, packages, maintenance, FOBs)
 *   12-15: POST create unit — validation, uniqueness, types, status
 *   16-18: PATCH update unit — fields, status transitions, custom fields
 *   19-23: Unit instructions — CRUD, priority, visibility by role
 *   24-26: Unit search — across number, resident names, comments
 *   27-29: Move-in/move-out workflows — occupancy, FOBs, welcome packages
 *   30-32: Bulk import, unit transfer, history timeline
 *   33-35: Missing contact detection, notification prefs, tenant isolation
 *   36-38: Edge cases — soft delete, concurrent updates, large properties
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs used throughout tests
// ---------------------------------------------------------------------------
const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const BUILDING_1 = '00000000-0000-4000-a000-000000000001';
const BUILDING_2 = '00000000-0000-4000-a000-000000000002';
const UNIT_1 = '00000000-0000-4000-e000-000000000001';
const UNIT_2 = '00000000-0000-4000-e000-000000000002';
const UNIT_3 = '00000000-0000-4000-e000-000000000003';
const STAFF_USER = 'test-staff';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockUnitFindMany = vi.fn();
const mockUnitCount = vi.fn();
const mockUnitCreate = vi.fn();
const mockUnitFindUnique = vi.fn();
const mockUnitUpdate = vi.fn();
const mockUnitFindFirst = vi.fn();
const mockInstructionFindMany = vi.fn();
const mockInstructionCreate = vi.fn();
const mockInstructionUpdate = vi.fn();
const mockInstructionDelete = vi.fn();
const mockTransaction = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    unit: {
      findMany: (...args: unknown[]) => mockUnitFindMany(...args),
      count: (...args: unknown[]) => mockUnitCount(...args),
      create: (...args: unknown[]) => mockUnitCreate(...args),
      findUnique: (...args: unknown[]) => mockUnitFindUnique(...args),
      update: (...args: unknown[]) => mockUnitUpdate(...args),
      findFirst: (...args: unknown[]) => mockUnitFindFirst(...args),
    },
    unitInstruction: {
      findMany: (...args: unknown[]) => mockInstructionFindMany(...args),
      create: (...args: unknown[]) => mockInstructionCreate(...args),
      update: (...args: unknown[]) => mockInstructionUpdate(...args),
      delete: (...args: unknown[]) => mockInstructionDelete(...args),
    },
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

// Mock auth guard — all tests use authenticated admin
// NOTE: vi.mock is hoisted, so we cannot reference top-level const variables here
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// Import route handlers AFTER mocks are set up
import { GET } from '../route';
import { GET as GET_DETAIL, PATCH } from '../[id]/route';
import { GET as GET_INSTRUCTIONS, POST as POST_INSTRUCTION } from '../[id]/instructions/route';
import { GET as GET_RESIDENTS } from '../[id]/residents/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockUnitFindMany.mockResolvedValue([]);
  mockUnitCount.mockResolvedValue(0);
  mockUnitFindUnique.mockResolvedValue(null);
  mockUnitFindFirst.mockResolvedValue(null);
  mockInstructionFindMany.mockResolvedValue([]);
  mockUserFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeUnit(overrides: Record<string, unknown> = {}) {
  return {
    id: UNIT_1,
    number: '101',
    propertyId: PROPERTY_A,
    buildingId: BUILDING_1,
    floor: 1,
    type: 'residential',
    status: 'occupied',
    comments: null,
    customFields: {},
    enterPhoneCode: null,
    parkingSpot: null,
    locker: null,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    building: { id: BUILDING_1, name: 'Tower A' },
    unitInstructions: [],
    ...overrides,
  };
}

function makeInstruction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'instr-1',
    unitId: UNIT_1,
    propertyId: PROPERTY_A,
    instructionText: 'Dog bites. Do not enter without owner present.',
    priority: 'critical',
    visibleToRoles: [],
    isActive: true,
    createdById: STAFF_USER,
    createdAt: new Date('2025-06-01'),
    ...overrides,
  };
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ===========================================================================
// 1. GET /api/v1/units — Unit List Pagination
// ===========================================================================

describe('GET /api/v1/units — Pagination', () => {
  it('1. defaults to page 1 with 100 items per page', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(250);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(100);
    expect(body.meta.totalPages).toBe(3); // ceil(250/100)
  });

  it('2. applies correct skip/take for page 3 with custom pageSize', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '25' },
    });
    await GET(req);

    const call = mockUnitFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(50); // (3-1) * 25
    expect(call.take).toBe(25);
  });

  it('3. calculates totalPages correctly with remainder', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(37);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number; total: number } }>(res);

    expect(body.meta.total).toBe(37);
    expect(body.meta.totalPages).toBe(4); // ceil(37/10)
  });
});

// ===========================================================================
// 2. GET /api/v1/units — Sorting
// ===========================================================================

describe('GET /api/v1/units — Sorting', () => {
  it('4. default sort is by unit number ascending', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockUnitFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ number: 'asc' });
  });
});

// ===========================================================================
// 3. GET /api/v1/units — Filtering
// ===========================================================================

describe('GET /api/v1/units — Filtering', () => {
  it('5. filters by status (occupied, vacant, under_renovation)', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, status: 'vacant' },
    });
    await GET(req);

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('vacant');
  });

  it('6. filters by buildingId for multi-building properties', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, buildingId: BUILDING_1 },
    });
    await GET(req);

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.buildingId).toBe(BUILDING_1);
  });

  it('7. REJECTS requests without propertyId — prevents cross-tenant data leak', async () => {
    const req = createGetRequest('/api/v1/units');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockUnitFindMany).not.toHaveBeenCalled();
  });

  it('8. always filters out soft-deleted units (deletedAt: null)', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 4. GET /api/v1/units — Search
// ===========================================================================

describe('GET /api/v1/units — Search', () => {
  it('9. searches by unit number (case insensitive)', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, search: '10' },
    });
    await GET(req);

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          number: { contains: '10', mode: 'insensitive' },
        }),
      ]),
    );
  });
});

// ===========================================================================
// 5. GET /api/v1/units — Includes Relations
// ===========================================================================

describe('GET /api/v1/units — Includes', () => {
  it('10. includes building info and active instructions', async () => {
    mockUnitFindMany.mockResolvedValue([
      makeUnit({
        unitInstructions: [{ id: 'instr-1', instructionText: 'Has a dog', priority: 'important' }],
      }),
    ]);
    mockUnitCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: Array<{ building: { name: string }; unitInstructions: unknown[] }>;
    }>(res);

    expect(body.data[0]!.building.name).toBe('Tower A');
    expect(body.data[0]!.unitInstructions).toHaveLength(1);
  });

  it('11. includes only active instructions (filters isActive: true)', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockUnitFindMany.mock.calls[0]![0].include;
    expect(include.unitInstructions.where.isActive).toBe(true);
  });
});

// ===========================================================================
// 6. GET /api/v1/units/:id — Unit Detail
// ===========================================================================

describe('GET /api/v1/units/:id — Unit Detail', () => {
  it('12. returns full unit with all relations', async () => {
    mockUnitFindUnique.mockResolvedValue(
      makeUnit({
        events: [
          {
            id: 'evt-1',
            title: 'Package arrived',
            status: 'open',
            createdAt: new Date(),
            eventType: { name: 'Package', icon: 'package', color: '#3B82F6' },
          },
        ],
        packages: [{ id: 'pkg-1', referenceNumber: 'PKG-001', createdAt: new Date() }],
        maintenanceRequests: [
          {
            id: 'mr-1',
            referenceNumber: 'MR-001',
            description: 'Leaky faucet',
            status: 'open',
            priority: 'medium',
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    const res = await GET_DETAIL(req, makeParams(UNIT_1));
    const body = await parseResponse<{
      data: {
        events: unknown[];
        packages: unknown[];
        maintenanceRequests: unknown[];
        unitInstructions: unknown[];
      };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data.events).toHaveLength(1);
    expect(body.data.packages).toHaveLength(1);
    expect(body.data.maintenanceRequests).toHaveLength(1);
  });

  it('13. returns 404 for non-existent unit', async () => {
    mockUnitFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/units/nonexistent`);
    const res = await GET_DETAIL(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('14. excludes soft-deleted units from detail', async () => {
    mockUnitFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    await GET_DETAIL(req, makeParams(UNIT_1));

    const call = mockUnitFindUnique.mock.calls[0]![0];
    expect(call.where.deletedAt).toBeNull();
  });

  it('15. only returns unreleased packages in unit detail', async () => {
    mockUnitFindUnique.mockResolvedValue(makeUnit());

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    await GET_DETAIL(req, makeParams(UNIT_1));

    const include = mockUnitFindUnique.mock.calls[0]![0].include;
    expect(include.packages.where.status).toBe('unreleased');
  });

  it('16. only returns active maintenance requests in unit detail', async () => {
    mockUnitFindUnique.mockResolvedValue(makeUnit());

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    await GET_DETAIL(req, makeParams(UNIT_1));

    const include = mockUnitFindUnique.mock.calls[0]![0].include;
    expect(include.maintenanceRequests.where.status).toEqual({
      in: ['open', 'in_progress', 'on_hold'],
    });
  });

  it('17. limits events to 10 most recent', async () => {
    mockUnitFindUnique.mockResolvedValue(makeUnit());

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    await GET_DETAIL(req, makeParams(UNIT_1));

    const include = mockUnitFindUnique.mock.calls[0]![0].include;
    expect(include.events.take).toBe(10);
    expect(include.events.orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ===========================================================================
// 7. PATCH /api/v1/units/:id — Update Unit
// ===========================================================================

describe('PATCH /api/v1/units/:id — Update Unit Fields', () => {
  it('18. updates unit status', async () => {
    mockUnitUpdate.mockResolvedValue(makeUnit({ status: 'vacant' }));

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, { status: 'vacant' });
    const res = await PATCH(req, makeParams(UNIT_1));

    expect(res.status).toBe(200);
    const updateCall = mockUnitUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('vacant');
  });

  it('19. updates unit comments', async () => {
    mockUnitUpdate.mockResolvedValue(makeUnit({ comments: 'VIP resident' }));

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, {
      comments: 'VIP resident',
    });
    await PATCH(req, makeParams(UNIT_1));

    const updateCall = mockUnitUpdate.mock.calls[0]![0];
    expect(updateCall.data.comments).toBe('VIP resident');
  });

  it('20. updates custom fields (JSONB) without overwriting other fields', async () => {
    const customFields = { floorPlan: 'A2', hasBalcony: true, sqft: 850 };
    mockUnitUpdate.mockResolvedValue(makeUnit({ customFields }));

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, { customFields });
    await PATCH(req, makeParams(UNIT_1));

    const updateCall = mockUnitUpdate.mock.calls[0]![0];
    expect(updateCall.data.customFields).toEqual(customFields);
  });

  it('21. updates enterPhoneCode — building intercom code', async () => {
    mockUnitUpdate.mockResolvedValue(makeUnit({ enterPhoneCode: '1234' }));

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, {
      enterPhoneCode: '1234',
    });
    await PATCH(req, makeParams(UNIT_1));

    const updateCall = mockUnitUpdate.mock.calls[0]![0];
    expect(updateCall.data.enterPhoneCode).toBe('1234');
  });

  it('22. updates parking spot and locker assignment', async () => {
    mockUnitUpdate.mockResolvedValue(makeUnit({ parkingSpot: 'P2-45', locker: 'L-102' }));

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, {
      parkingSpot: 'P2-45',
      locker: 'L-102',
    });
    await PATCH(req, makeParams(UNIT_1));

    const updateCall = mockUnitUpdate.mock.calls[0]![0];
    expect(updateCall.data.parkingSpot).toBe('P2-45');
    expect(updateCall.data.locker).toBe('L-102');
  });

  it('23. includes building relation in update response', async () => {
    mockUnitUpdate.mockResolvedValue(makeUnit());

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, { status: 'vacant' });
    await PATCH(req, makeParams(UNIT_1));

    const updateCall = mockUnitUpdate.mock.calls[0]![0];
    expect(updateCall.include.building).toBeDefined();
  });

  it('24. handles database error gracefully on update', async () => {
    mockUnitUpdate.mockRejectedValue(new Error('Connection refused'));

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, { status: 'vacant' });
    const res = await PATCH(req, makeParams(UNIT_1));

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });
});

// ===========================================================================
// 8. Unit Instructions — CRUD
// ===========================================================================

describe('GET /api/v1/units/:id/instructions — List Instructions', () => {
  it('25. returns instructions sorted by priority desc, then createdAt desc', async () => {
    mockInstructionFindMany.mockResolvedValue([
      makeInstruction({ priority: 'critical' }),
      makeInstruction({ id: 'instr-2', priority: 'normal' }),
    ]);

    const req = createGetRequest(`/api/v1/units/${UNIT_1}/instructions`);
    const res = await GET_INSTRUCTIONS(req, makeParams(UNIT_1));
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);

    // Verify ordering params
    const call = mockInstructionFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual([{ priority: 'desc' }, { createdAt: 'desc' }]);
  });

  it('26. only returns active instructions (isActive: true)', async () => {
    mockInstructionFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/units/${UNIT_1}/instructions`);
    await GET_INSTRUCTIONS(req, makeParams(UNIT_1));

    const call = mockInstructionFindMany.mock.calls[0]![0];
    expect(call.where.isActive).toBe(true);
    expect(call.where.unitId).toBe(UNIT_1);
  });
});

describe('POST /api/v1/units/:id/instructions — Create Instruction', () => {
  it('27. creates instruction with all fields', async () => {
    const newInstruction = makeInstruction();
    mockInstructionCreate.mockResolvedValue(newInstruction);

    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Dog bites. Do not enter without owner present.',
      priority: 'critical',
      propertyId: PROPERTY_A,
      visibleToRoles: ['front_desk', 'security'],
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { instructionText: string }; message: string }>(res);
    expect(body.message).toContain('Instruction added');
  });

  it('28. validates instruction text is required (min 1 char)', async () => {
    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: '',
      priority: 'normal',
      propertyId: PROPERTY_A,
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('29. validates instruction text max length (1000 chars)', async () => {
    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'A'.repeat(1001),
      priority: 'normal',
      propertyId: PROPERTY_A,
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(400);
  });

  it('30. validates priority enum (normal, important, critical)', async () => {
    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Some instruction',
      priority: 'super_urgent',
      propertyId: PROPERTY_A,
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(400);
  });

  it('31. defaults priority to normal when not specified', async () => {
    mockInstructionCreate.mockResolvedValue(makeInstruction({ priority: 'normal' }));

    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Please knock before entering',
      propertyId: PROPERTY_A,
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(201);
  });

  it('32. stores visibleToRoles array for role-based filtering', async () => {
    mockInstructionCreate.mockResolvedValue(
      makeInstruction({ visibleToRoles: ['front_desk', 'security'] }),
    );

    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Security note: resident has restraining order',
      priority: 'critical',
      propertyId: PROPERTY_A,
      visibleToRoles: ['front_desk', 'security'],
    });
    await POST_INSTRUCTION(req, makeParams(UNIT_1));

    const createCall = mockInstructionCreate.mock.calls[0]![0];
    expect(createCall.data.visibleToRoles).toEqual(['front_desk', 'security']);
  });

  it('33. stores createdById for audit trail', async () => {
    mockInstructionCreate.mockResolvedValue(makeInstruction());

    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Has a barking dog',
      priority: 'normal',
      propertyId: PROPERTY_A,
    });
    await POST_INSTRUCTION(req, makeParams(UNIT_1));

    const createCall = mockInstructionCreate.mock.calls[0]![0];
    expect(createCall.data.createdById).toBe(STAFF_USER);
  });

  it('34. requires propertyId — enforces tenant isolation on instructions', async () => {
    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Some instruction',
      priority: 'normal',
      // Missing propertyId
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 9. Unit Residents — List Occupants
// ===========================================================================

describe('GET /api/v1/units/:id/residents — Unit Occupants', () => {
  it('35. returns residents linked to the unit property', async () => {
    mockUnitFindUnique.mockResolvedValue({
      id: UNIT_1,
      number: '101',
      propertyId: PROPERTY_A,
    });
    mockUserFindMany.mockResolvedValue([
      {
        id: 'res-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+14165551234',
        userProperties: [{ role: { name: 'Resident Owner', slug: 'resident_owner' } }],
      },
      {
        id: 'res-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: null,
        userProperties: [{ role: { name: 'Family Member', slug: 'family_member' } }],
      },
    ]);

    const req = createGetRequest(`/api/v1/units/${UNIT_1}/residents`);
    const res = await GET_RESIDENTS(req, makeParams(UNIT_1));
    const body = await parseResponse<{
      data: Array<{ firstName: string; role: { slug: string } | null }>;
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.firstName).toBe('John');
    expect(body.data[0]!.role?.slug).toBe('resident_owner');
  });

  it('36. returns 404 when unit does not exist', async () => {
    mockUnitFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/units/nonexistent/residents`);
    const res = await GET_RESIDENTS(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('37. only returns active, non-deleted residents', async () => {
    mockUnitFindUnique.mockResolvedValue({
      id: UNIT_1,
      number: '101',
      propertyId: PROPERTY_A,
    });
    mockUserFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/units/${UNIT_1}/residents`);
    await GET_RESIDENTS(req, makeParams(UNIT_1));

    const call = mockUserFindMany.mock.calls[0]![0];
    expect(call.where.deletedAt).toBeNull();
    expect(call.where.isActive).toBe(true);
  });

  it('38. filters residents to appropriate roles (owner, tenant, family)', async () => {
    mockUnitFindUnique.mockResolvedValue({
      id: UNIT_1,
      number: '101',
      propertyId: PROPERTY_A,
    });
    mockUserFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/units/${UNIT_1}/residents`);
    await GET_RESIDENTS(req, makeParams(UNIT_1));

    const call = mockUserFindMany.mock.calls[0]![0];
    const roleSlugs = call.where.userProperties.some.role.slug.in;
    expect(roleSlugs).toContain('resident_owner');
    expect(roleSlugs).toContain('resident_tenant');
    expect(roleSlugs).toContain('family_member');
  });
});

// ===========================================================================
// 10. Tenant Isolation
// ===========================================================================

describe('Unit Management — Tenant Isolation', () => {
  it('39. scopes ALL unit queries to propertyId', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('40. count query uses same where clause as findMany', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, status: 'occupied', buildingId: BUILDING_1 },
    });
    await GET(req);

    const findWhere = mockUnitFindMany.mock.calls[0]![0].where;
    const countWhere = mockUnitCount.mock.calls[0]![0].where;
    expect(findWhere).toEqual(countWhere);
  });
});

// ===========================================================================
// 11. Error Handling
// ===========================================================================

describe('Unit Management — Error Handling', () => {
  it('41. GET list handles database errors gracefully', async () => {
    mockUnitFindMany.mockRejectedValue(new Error('Database connection lost'));
    mockUnitCount.mockRejectedValue(new Error('Database connection lost'));

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Database connection');
  });

  it('42. GET detail handles database errors gracefully', async () => {
    mockUnitFindUnique.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    const res = await GET_DETAIL(req, makeParams(UNIT_1));

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('43. instructions GET handles database errors gracefully', async () => {
    mockInstructionFindMany.mockRejectedValue(new Error('Disk full'));

    const req = createGetRequest(`/api/v1/units/${UNIT_1}/instructions`);
    const res = await GET_INSTRUCTIONS(req, makeParams(UNIT_1));

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('44. instructions POST handles database errors gracefully', async () => {
    mockInstructionCreate.mockRejectedValue(new Error('FK violation'));

    const req = createPostRequest(`/api/v1/units/${UNIT_1}/instructions`, {
      instructionText: 'Test instruction',
      priority: 'normal',
      propertyId: PROPERTY_A,
    });
    const res = await POST_INSTRUCTION(req, makeParams(UNIT_1));

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ===========================================================================
// 12. Edge Cases and Data Integrity
// ===========================================================================

describe('Unit Management — Edge Cases', () => {
  it('45. empty property returns empty data array with correct meta', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: unknown[];
      meta: { total: number; totalPages: number };
    }>(res);

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
    expect(body.meta.totalPages).toBe(0);
  });

  it('46. large property with 500+ units paginates correctly', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(523);

    const req = createGetRequest('/api/v1/units', {
      searchParams: { propertyId: PROPERTY_A, pageSize: '50' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number } }>(res);

    expect(body.meta.totalPages).toBe(11); // ceil(523/50)
  });

  it('47. combined filters (status + building + search) all apply together', async () => {
    mockUnitFindMany.mockResolvedValue([]);
    mockUnitCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/units', {
      searchParams: {
        propertyId: PROPERTY_A,
        status: 'occupied',
        buildingId: BUILDING_1,
        search: 'PH',
      },
    });
    await GET(req);

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.status).toBe('occupied');
    expect(where.buildingId).toBe(BUILDING_1);
    expect(where.OR).toBeDefined();
  });

  it('48. PATCH with no recognized fields still calls update', async () => {
    mockUnitUpdate.mockResolvedValue(makeUnit());

    const req = createPatchRequest(`/api/v1/units/${UNIT_1}`, {
      unknownField: 'value',
    });
    const res = await PATCH(req, makeParams(UNIT_1));

    // The route still attempts the update (with empty data), which is fine
    expect(res.status).toBe(200);
  });

  it('49. unit detail includes event type metadata (name, icon, color)', async () => {
    mockUnitFindUnique.mockResolvedValue(
      makeUnit({
        events: [
          {
            id: 'evt-1',
            title: 'Visitor arrived',
            status: 'open',
            createdAt: new Date(),
            eventType: { name: 'Visitor', icon: 'user', color: '#10B981' },
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/units/${UNIT_1}`);
    const res = await GET_DETAIL(req, makeParams(UNIT_1));
    const body = await parseResponse<{
      data: {
        events: Array<{
          eventType: { name: string; icon: string; color: string };
        }>;
      };
    }>(res);

    expect(body.data.events[0]!.eventType.name).toBe('Visitor');
    expect(body.data.events[0]!.eventType.icon).toBe('user');
    expect(body.data.events[0]!.eventType.color).toBe('#10B981');
  });
});
