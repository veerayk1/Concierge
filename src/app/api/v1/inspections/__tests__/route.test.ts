/**
 * Inspections API Route Tests — per CLAUDE.md Phase 2
 *
 * Mobile-first inspection system with checklists, GPS verification,
 * and auto-maintenance-request creation on failed items. Property managers
 * need to prove fire extinguishers were inspected, HVAC filters changed,
 * and pool chemistry checked — with timestamped evidence and location proof.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockInspectionFindMany = vi.fn();
const mockInspectionFindUnique = vi.fn();
const mockInspectionCount = vi.fn();
const mockInspectionCreate = vi.fn();
const mockInspectionUpdate = vi.fn();

const mockItemFindMany = vi.fn();
const mockItemFindUnique = vi.fn();
const mockItemUpdate = vi.fn();
const mockItemCreate = vi.fn();

const mockTemplateFindMany = vi.fn();
const mockTemplateCount = vi.fn();
const mockTemplateCreate = vi.fn();
const mockTemplateFindUnique = vi.fn();

const mockMaintenanceCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    inspection: {
      findMany: (...args: unknown[]) => mockInspectionFindMany(...args),
      findUnique: (...args: unknown[]) => mockInspectionFindUnique(...args),
      count: (...args: unknown[]) => mockInspectionCount(...args),
      create: (...args: unknown[]) => mockInspectionCreate(...args),
      update: (...args: unknown[]) => mockInspectionUpdate(...args),
    },
    inspectionItem: {
      findMany: (...args: unknown[]) => mockItemFindMany(...args),
      findUnique: (...args: unknown[]) => mockItemFindUnique(...args),
      update: (...args: unknown[]) => mockItemUpdate(...args),
      create: (...args: unknown[]) => mockItemCreate(...args),
      createMany: vi.fn(),
    },
    inspectionTemplate: {
      findMany: (...args: unknown[]) => mockTemplateFindMany(...args),
      findUnique: (...args: unknown[]) => mockTemplateFindUnique(...args),
      count: (...args: unknown[]) => mockTemplateCount(...args),
      create: (...args: unknown[]) => mockTemplateCreate(...args),
    },
    maintenanceRequest: {
      create: (...args: unknown[]) => mockMaintenanceCreate(...args),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('X1Y2'),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Route imports MUST come after vi.mock calls
import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '../[id]/route';
import { GET as GET_ITEMS, POST as POST_ITEM } from '../[id]/items/route';
import { GET as GET_TEMPLATES, POST as POST_TEMPLATE } from '../templates/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockInspectionFindMany.mockResolvedValue([]);
  mockInspectionCount.mockResolvedValue(0);
  mockTemplateFindMany.mockResolvedValue([]);
  mockTemplateCount.mockResolvedValue(0);
  mockItemFindMany.mockResolvedValue([]);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const INSPECTION_ID = '00000000-0000-4000-d000-000000000001';
const TEMPLATE_ID = '00000000-0000-4000-e000-000000000001';
const ITEM_ID = '00000000-0000-4000-f000-000000000001';
const INSPECTOR_ID = '00000000-0000-4000-a000-000000000002';
const TASK_ID = '00000000-0000-4000-c000-000000000001';

// ---------------------------------------------------------------------------
// 1. Create inspection with checklist template
// ---------------------------------------------------------------------------

describe('POST /api/v1/inspections — Create inspection with checklist', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    title: 'Q1 Fire Safety Inspection',
    category: 'fire_safety' as const,
    templateId: TEMPLATE_ID,
    scheduledDate: '2026-04-01',
    inspectorId: INSPECTOR_ID,
    location: 'Building A — All Floors',
  };

  beforeEach(() => {
    mockTemplateFindUnique.mockResolvedValue({
      id: TEMPLATE_ID,
      propertyId: PROPERTY_ID,
      name: 'Fire Safety Checklist',
      category: 'fire_safety',
      items: [
        { name: 'Fire extinguisher present', required: true, type: 'pass_fail' },
        { name: 'Exit signs illuminated', required: true, type: 'pass_fail' },
        { name: 'Sprinkler pressure PSI', required: true, type: 'numeric' },
      ],
    });
  });

  it('creates an inspection with items from a template', async () => {
    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      ...validBody,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: [
        { id: 'item-1', name: 'Fire extinguisher present', type: 'pass_fail', required: true },
        { id: 'item-2', name: 'Exit signs illuminated', type: 'pass_fail', required: true },
        { id: 'item-3', name: 'Sprinkler pressure PSI', type: 'numeric', required: true },
      ],
    });

    const req = createPostRequest('/api/v1/inspections', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: Record<string, unknown>; message: string }>(res);
    expect(body.data).toBeDefined();
    expect(body.message).toContain('created');

    const createData = mockInspectionCreate.mock.calls[0]![0].data;
    expect(createData.title).toBe('Q1 Fire Safety Inspection');
    expect(createData.status).toBe('scheduled');
    expect(createData.templateId).toBe(TEMPLATE_ID);
  });

  it('creates an inspection with inline checklist items (no template)', async () => {
    const bodyWithItems = {
      propertyId: PROPERTY_ID,
      title: 'Ad-hoc Pool Inspection',
      category: 'pool' as const,
      items: [
        { name: 'pH level', required: true, type: 'numeric' as const },
        { name: 'Chlorine level', required: true, type: 'numeric' as const },
        { name: 'Pool fence condition', required: false, type: 'text' as const },
      ],
    };

    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      ...bodyWithItems,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: bodyWithItems.items.map((item, i) => ({
        id: `item-${i}`,
        ...item,
      })),
    });

    const req = createPostRequest('/api/v1/inspections', bodyWithItems);
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/inspections', {
      propertyId: PROPERTY_ID,
      category: 'fire_safety',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing propertyId — tenant isolation is non-negotiable', async () => {
    const req = createPostRequest('/api/v1/inspections', {
      title: 'Test',
      category: 'fire_safety',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('handles database errors gracefully', async () => {
    mockInspectionCreate.mockRejectedValue(new Error('DB connection lost'));

    const req = createPostRequest('/api/v1/inspections', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB connection lost');
  });
});

// ---------------------------------------------------------------------------
// 2. Checklist items: name, required, type (pass_fail, numeric, text, photo)
// ---------------------------------------------------------------------------

describe('Checklist item types', () => {
  const itemTypes = ['pass_fail', 'numeric', 'text', 'photo'] as const;

  it.each(itemTypes)('supports checklist item type: %s', async (type) => {
    const bodyWithItems = {
      propertyId: PROPERTY_ID,
      title: `${type} test inspection`,
      category: 'general' as const,
      items: [{ name: `Test ${type} item`, required: true, type }],
    };

    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      ...bodyWithItems,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: [{ id: ITEM_ID, name: `Test ${type} item`, type, required: true }],
    });

    const req = createPostRequest('/api/v1/inspections', bodyWithItems);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('requires name on each checklist item', async () => {
    const req = createPostRequest('/api/v1/inspections', {
      propertyId: PROPERTY_ID,
      title: 'Bad Items',
      category: 'general',
      items: [{ name: '', required: true, type: 'pass_fail' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('allows required and optional items in the same checklist', async () => {
    const body = {
      propertyId: PROPERTY_ID,
      title: 'Mixed Requirements',
      category: 'hvac' as const,
      items: [
        { name: 'Filter condition', required: true, type: 'pass_fail' as const },
        { name: 'Additional notes', required: false, type: 'text' as const },
      ],
    };

    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      ...body,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: body.items.map((item, i) => ({ id: `item-${i}`, ...item })),
    });

    const req = createPostRequest('/api/v1/inspections', body);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 3. Start inspection — status=in_progress, startedAt set
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/inspections/:id — Start inspection', () => {
  it('transitions scheduled → in_progress and sets startedAt', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Fire Safety Q1',
      status: 'scheduled',
      startedAt: null,
      completedAt: null,
      deletedAt: null,
      items: [],
    });
    mockInspectionUpdate.mockResolvedValue({
      id: INSPECTION_ID,
      status: 'in_progress',
      startedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'in_progress',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);

    const updateData = mockInspectionUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('in_progress');
    expect(updateData.startedAt).toBeDefined();
    expect(updateData.startedAt).toBeInstanceOf(Date);
  });

  it('rejects starting an already completed inspection', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'completed',
      deletedAt: null,
      items: [],
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'in_progress',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');
  });
});

// ---------------------------------------------------------------------------
// 4. Complete checklist item with value and optional photo
// ---------------------------------------------------------------------------

describe('POST /api/v1/inspections/:id/items — Complete checklist item', () => {
  beforeEach(() => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'in_progress',
      deletedAt: null,
    });
  });

  it('completes a pass_fail item with passed=true', async () => {
    mockItemFindUnique.mockResolvedValue({
      id: ITEM_ID,
      inspectionId: INSPECTION_ID,
      name: 'Fire extinguisher present',
      type: 'pass_fail',
      required: true,
      value: null,
      passed: null,
    });
    mockItemUpdate.mockResolvedValue({
      id: ITEM_ID,
      value: 'pass',
      passed: true,
      completedAt: new Date(),
      completedById: 'test-staff',
    });

    const req = createPostRequest(`/api/v1/inspections/${INSPECTION_ID}/items`, {
      itemId: ITEM_ID,
      value: 'pass',
      passed: true,
    });
    const res = await POST_ITEM(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);

    const updateData = mockItemUpdate.mock.calls[0]![0].data;
    expect(updateData.value).toBe('pass');
    expect(updateData.passed).toBe(true);
    expect(updateData.completedAt).toBeInstanceOf(Date);
  });

  it('completes a numeric item with numericValue', async () => {
    mockItemFindUnique.mockResolvedValue({
      id: ITEM_ID,
      inspectionId: INSPECTION_ID,
      name: 'Sprinkler pressure PSI',
      type: 'numeric',
      required: true,
      value: null,
    });
    mockItemUpdate.mockResolvedValue({
      id: ITEM_ID,
      value: '120',
      numericValue: 120,
      completedAt: new Date(),
    });

    const req = createPostRequest(`/api/v1/inspections/${INSPECTION_ID}/items`, {
      itemId: ITEM_ID,
      value: '120',
      numericValue: 120,
    });
    const res = await POST_ITEM(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockItemUpdate.mock.calls[0]![0].data;
    expect(updateData.numericValue).toBe(120);
  });

  it('attaches a photo to a checklist item', async () => {
    mockItemFindUnique.mockResolvedValue({
      id: ITEM_ID,
      inspectionId: INSPECTION_ID,
      name: 'Photo of fire panel',
      type: 'photo',
      required: true,
      value: null,
    });
    mockItemUpdate.mockResolvedValue({
      id: ITEM_ID,
      photoUrl: 'https://storage.example.com/inspections/photo-123.jpg',
      completedAt: new Date(),
    });

    const req = createPostRequest(`/api/v1/inspections/${INSPECTION_ID}/items`, {
      itemId: ITEM_ID,
      photoUrl: 'https://storage.example.com/inspections/photo-123.jpg',
    });
    const res = await POST_ITEM(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockItemUpdate.mock.calls[0]![0].data;
    expect(updateData.photoUrl).toContain('photo-123');
  });

  it('rejects completing item on a non-in_progress inspection', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'scheduled',
      deletedAt: null,
    });

    const req = createPostRequest(`/api/v1/inspections/${INSPECTION_ID}/items`, {
      itemId: ITEM_ID,
      value: 'pass',
      passed: true,
    });
    const res = await POST_ITEM(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INSPECTION_NOT_IN_PROGRESS');
  });
});

// ---------------------------------------------------------------------------
// 5. GPS location captured per inspection (lat/lng)
// ---------------------------------------------------------------------------

describe('GPS location capture', () => {
  it('stores GPS coordinates on inspection creation', async () => {
    const bodyWithGps = {
      propertyId: PROPERTY_ID,
      title: 'Pool Inspection',
      category: 'pool' as const,
      gpsLatitude: 43.6532,
      gpsLongitude: -79.3832,
      items: [{ name: 'pH level', required: true, type: 'numeric' as const }],
    };

    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      ...bodyWithGps,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: [{ id: ITEM_ID, name: 'pH level', type: 'numeric', required: true }],
    });

    const req = createPostRequest('/api/v1/inspections', bodyWithGps);
    const res = await POST(req);

    expect(res.status).toBe(201);

    const createData = mockInspectionCreate.mock.calls[0]![0].data;
    expect(createData.gpsLatitude).toBe(43.6532);
    expect(createData.gpsLongitude).toBe(-79.3832);
  });

  it('updates GPS coordinates via PATCH when starting inspection', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'scheduled',
      gpsLatitude: null,
      gpsLongitude: null,
      deletedAt: null,
      items: [],
    });
    mockInspectionUpdate.mockResolvedValue({
      id: INSPECTION_ID,
      status: 'in_progress',
      gpsLatitude: 43.6532,
      gpsLongitude: -79.3832,
      startedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'in_progress',
      gpsLatitude: 43.6532,
      gpsLongitude: -79.3832,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);

    const updateData = mockInspectionUpdate.mock.calls[0]![0].data;
    expect(updateData.gpsLatitude).toBe(43.6532);
    expect(updateData.gpsLongitude).toBe(-79.3832);
  });

  it('rejects invalid GPS coordinates', async () => {
    const req = createPostRequest('/api/v1/inspections', {
      propertyId: PROPERTY_ID,
      title: 'Bad GPS',
      category: 'general',
      gpsLatitude: 200, // Invalid: must be -90 to 90
      gpsLongitude: -79.3832,
      items: [{ name: 'Check', required: true, type: 'pass_fail' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 6. Complete inspection — status=completed, completedAt set
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/inspections/:id — Complete inspection', () => {
  it('transitions in_progress → completed and sets completedAt', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'in_progress',
      startedAt: new Date('2026-03-18T09:00:00Z'),
      completedAt: null,
      deletedAt: null,
      items: [
        { id: 'item-1', required: true, passed: true, completedAt: new Date() },
        { id: 'item-2', required: true, passed: true, completedAt: new Date() },
      ],
    });
    mockInspectionUpdate.mockResolvedValue({
      id: INSPECTION_ID,
      status: 'completed',
      completedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);

    const updateData = mockInspectionUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('completed');
    expect(updateData.completedAt).toBeDefined();
    expect(updateData.completedAt).toBeInstanceOf(Date);
  });

  it('rejects completing a scheduled inspection (must be in_progress first)', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'scheduled',
      deletedAt: null,
      items: [],
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects completing when required items are not finished', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'in_progress',
      deletedAt: null,
      items: [
        { id: 'item-1', required: true, passed: true, completedAt: new Date() },
        { id: 'item-2', required: true, passed: null, completedAt: null }, // Not completed
      ],
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INCOMPLETE_REQUIRED_ITEMS');
  });
});

// ---------------------------------------------------------------------------
// 7. Failed items flagged — auto-create maintenance request
// ---------------------------------------------------------------------------

describe('Failed items auto-create maintenance request', () => {
  it('creates a maintenance request when completing an inspection with failed items', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Fire Safety Q1',
      category: 'fire_safety',
      status: 'in_progress',
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          name: 'Fire extinguisher present',
          required: true,
          passed: true,
          completedAt: new Date(),
        },
        {
          id: 'item-2',
          name: 'Exit signs illuminated',
          required: true,
          passed: false,
          completedAt: new Date(),
        },
        {
          id: 'item-3',
          name: 'Sprinkler pressure',
          required: true,
          passed: true,
          completedAt: new Date(),
        },
      ],
    });

    mockInspectionUpdate.mockResolvedValue({
      id: INSPECTION_ID,
      status: 'completed',
      completedAt: new Date(),
    });

    mockMaintenanceCreate.mockResolvedValue({
      id: 'mr-auto-1',
      referenceNumber: 'MR-X1Y2',
      description: 'Failed inspection item: Exit signs illuminated',
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);
    expect(mockMaintenanceCreate).toHaveBeenCalled();

    const mrData = mockMaintenanceCreate.mock.calls[0]![0].data;
    expect(mrData.propertyId).toBe(PROPERTY_ID);
    expect(mrData.title).toContain('Exit signs illuminated');
  });

  it('does not create maintenance request when all items pass', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Fire Safety Q1',
      category: 'fire_safety',
      status: 'in_progress',
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          name: 'Fire extinguisher present',
          required: true,
          passed: true,
          completedAt: new Date(),
        },
        {
          id: 'item-2',
          name: 'Exit signs illuminated',
          required: true,
          passed: true,
          completedAt: new Date(),
        },
      ],
    });

    mockInspectionUpdate.mockResolvedValue({
      id: INSPECTION_ID,
      status: 'completed',
      completedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      status: 'completed',
    });
    await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(mockMaintenanceCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 8. Inspection templates: reusable checklists per category
// ---------------------------------------------------------------------------

describe('POST /api/v1/inspections/templates — Create template', () => {
  const validTemplate = {
    propertyId: PROPERTY_ID,
    name: 'Monthly Fire Safety Checklist',
    category: 'fire_safety' as const,
    description: 'Standard monthly fire safety inspection checklist',
    items: [
      { name: 'Fire extinguisher accessible', required: true, type: 'pass_fail' as const },
      { name: 'Emergency exits clear', required: true, type: 'pass_fail' as const },
      { name: 'Smoke detector test', required: true, type: 'pass_fail' as const },
      { name: 'Notes', required: false, type: 'text' as const },
    ],
  };

  it('creates a reusable inspection template', async () => {
    mockTemplateCreate.mockResolvedValue({
      id: TEMPLATE_ID,
      ...validTemplate,
      isActive: true,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/inspections/templates', validTemplate);
    const res = await POST_TEMPLATE(req);

    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; name: string }; message: string }>(res);
    expect(body.data.name).toBe('Monthly Fire Safety Checklist');
    expect(body.message).toContain('created');
  });

  it('rejects template without items', async () => {
    const req = createPostRequest('/api/v1/inspections/templates', {
      propertyId: PROPERTY_ID,
      name: 'Empty Template',
      category: 'fire_safety',
      items: [],
    });
    const res = await POST_TEMPLATE(req);
    expect(res.status).toBe(400);
  });

  const categories = ['fire_safety', 'hvac', 'elevator', 'pool'] as const;

  it.each(categories)('supports category: %s', async (category) => {
    mockTemplateCreate.mockResolvedValue({
      id: TEMPLATE_ID,
      propertyId: PROPERTY_ID,
      name: `${category} template`,
      category,
      items: [{ name: 'Check item', required: true, type: 'pass_fail' }],
      isActive: true,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/inspections/templates', {
      propertyId: PROPERTY_ID,
      name: `${category} template`,
      category,
      items: [{ name: 'Check item', required: true, type: 'pass_fail' }],
    });
    const res = await POST_TEMPLATE(req);
    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/inspections/templates — List templates', () => {
  it('lists templates filtered by propertyId', async () => {
    mockTemplateFindMany.mockResolvedValue([
      { id: TEMPLATE_ID, name: 'Fire Safety Checklist', category: 'fire_safety' },
    ]);
    mockTemplateCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/inspections/templates', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_TEMPLATES(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('filters templates by category', async () => {
    const req = createGetRequest('/api/v1/inspections/templates', {
      searchParams: { propertyId: PROPERTY_ID, category: 'hvac' },
    });
    await GET_TEMPLATES(req);

    const where = mockTemplateFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('hvac');
  });

  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/inspections/templates');
    const res = await GET_TEMPLATES(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 9. Schedule inspections linked to recurring tasks
// ---------------------------------------------------------------------------

describe('Schedule inspections linked to recurring tasks', () => {
  it('creates inspection with recurringTaskId', async () => {
    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Monthly HVAC Filter Check',
      category: 'hvac',
      recurringTaskId: TASK_ID,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: [{ id: ITEM_ID, name: 'Filter condition', type: 'pass_fail', required: true }],
    });

    const req = createPostRequest('/api/v1/inspections', {
      propertyId: PROPERTY_ID,
      title: 'Monthly HVAC Filter Check',
      category: 'hvac',
      recurringTaskId: TASK_ID,
      items: [{ name: 'Filter condition', required: true, type: 'pass_fail' }],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockInspectionCreate.mock.calls[0]![0].data;
    expect(createData.recurringTaskId).toBe(TASK_ID);
  });
});

// ---------------------------------------------------------------------------
// 10. Generate inspection report with pass/fail summary
// ---------------------------------------------------------------------------

describe('GET /api/v1/inspections/:id — Inspection report with pass/fail summary', () => {
  it('returns inspection with pass/fail summary in report', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Fire Safety Q1',
      category: 'fire_safety',
      status: 'completed',
      startedAt: new Date('2026-03-18T09:00:00Z'),
      completedAt: new Date('2026-03-18T11:30:00Z'),
      inspectorId: INSPECTOR_ID,
      gpsLatitude: 43.6532,
      gpsLongitude: -79.3832,
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          name: 'Fire extinguisher',
          type: 'pass_fail',
          passed: true,
          completedAt: new Date(),
        },
        {
          id: 'item-2',
          name: 'Exit signs',
          type: 'pass_fail',
          passed: true,
          completedAt: new Date(),
        },
        {
          id: 'item-3',
          name: 'Sprinkler PSI',
          type: 'numeric',
          passed: false,
          numericValue: 50,
          completedAt: new Date(),
        },
        {
          id: 'item-4',
          name: 'Notes',
          type: 'text',
          passed: null,
          value: 'All OK',
          completedAt: new Date(),
        },
      ],
    });

    const req = createGetRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        report: {
          totalItems: number;
          passedItems: number;
          failedItems: number;
          passRate: number;
          overallResult: string;
        };
      };
    }>(res);

    expect(body.data.report).toBeDefined();
    expect(body.data.report.totalItems).toBe(4);
    expect(body.data.report.passedItems).toBe(2);
    expect(body.data.report.failedItems).toBe(1);
    expect(body.data.report.overallResult).toBe('fail');
  });

  it('returns overall result as "pass" when no items failed', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Pool Inspection',
      status: 'completed',
      deletedAt: null,
      items: [
        { id: 'item-1', name: 'pH level', type: 'numeric', passed: true, completedAt: new Date() },
        { id: 'item-2', name: 'Chlorine', type: 'numeric', passed: true, completedAt: new Date() },
      ],
    });

    const req = createGetRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    const body = await parseResponse<{
      data: { report: { overallResult: string; passRate: number } };
    }>(res);
    expect(body.data.report.overallResult).toBe('pass');
    expect(body.data.report.passRate).toBe(100);
  });

  it('returns 404 when inspection does not exist', async () => {
    mockInspectionFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: INSPECTION_ID }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 11. Overdue inspections flagged
// ---------------------------------------------------------------------------

describe('GET /api/v1/inspections — Overdue flagging', () => {
  it('flags inspection as overdue when scheduledDate is in the past and status is scheduled', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    mockInspectionFindMany.mockResolvedValue([
      {
        id: INSPECTION_ID,
        title: 'Overdue Fire Inspection',
        status: 'scheduled',
        scheduledDate: pastDate,
      },
    ]);
    mockInspectionCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(true);
  });

  it('does not flag future inspections as overdue', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    mockInspectionFindMany.mockResolvedValue([
      {
        id: INSPECTION_ID,
        title: 'Upcoming Inspection',
        status: 'scheduled',
        scheduledDate: futureDate,
      },
    ]);
    mockInspectionCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(false);
  });

  it('does not flag completed inspections as overdue', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    mockInspectionFindMany.mockResolvedValue([
      {
        id: INSPECTION_ID,
        title: 'Completed Inspection',
        status: 'completed',
        scheduledDate: pastDate,
      },
    ]);
    mockInspectionCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 12. Inspector assignment from staff list
// ---------------------------------------------------------------------------

describe('Inspector assignment', () => {
  it('creates inspection with inspectorId assigned', async () => {
    mockInspectionCreate.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      title: 'Elevator Inspection',
      category: 'elevator',
      inspectorId: INSPECTOR_ID,
      status: 'scheduled',
      createdById: 'test-staff',
      createdAt: new Date(),
      items: [{ id: ITEM_ID, name: 'Cable condition', type: 'pass_fail', required: true }],
    });

    const req = createPostRequest('/api/v1/inspections', {
      propertyId: PROPERTY_ID,
      title: 'Elevator Inspection',
      category: 'elevator',
      inspectorId: INSPECTOR_ID,
      items: [{ name: 'Cable condition', required: true, type: 'pass_fail' }],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockInspectionCreate.mock.calls[0]![0].data;
    expect(createData.inspectorId).toBe(INSPECTOR_ID);
  });

  it('reassigns inspector via PATCH', async () => {
    const NEW_INSPECTOR = '00000000-0000-4000-a000-000000000099';

    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      status: 'scheduled',
      inspectorId: INSPECTOR_ID,
      deletedAt: null,
      items: [],
    });
    mockInspectionUpdate.mockResolvedValue({
      id: INSPECTION_ID,
      inspectorId: NEW_INSPECTOR,
    });

    const req = createPatchRequest(`/api/v1/inspections/${INSPECTION_ID}`, {
      inspectorId: NEW_INSPECTOR,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockInspectionUpdate.mock.calls[0]![0].data;
    expect(updateData.inspectorId).toBe(NEW_INSPECTOR);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/inspections — List with filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/inspections — Filtering & Pagination', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/inspections');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockInspectionFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId + soft-delete filter', async () => {
    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockInspectionFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('filters by status', async () => {
    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID, status: 'in_progress' },
    });
    await GET(req);

    const where = mockInspectionFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('in_progress');
  });

  it('filters by category', async () => {
    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID, category: 'fire_safety' },
    });
    await GET(req);

    const where = mockInspectionFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('fire_safety');
  });

  it('filters by inspectorId', async () => {
    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID, inspectorId: INSPECTOR_ID },
    });
    await GET(req);

    const where = mockInspectionFindMany.mock.calls[0]![0].where;
    expect(where.inspectorId).toBe(INSPECTOR_ID);
  });

  it('returns paginated results with meta', async () => {
    mockInspectionFindMany.mockResolvedValue([]);
    mockInspectionCount.mockResolvedValue(35);

    const req = createGetRequest('/api/v1/inspections', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ meta: { total: number; page: number; totalPages: number } }>(
      res,
    );
    expect(body.meta.total).toBe(35);
    expect(body.meta.page).toBe(2);
    expect(body.meta.totalPages).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/inspections/:id/items — List checklist items
// ---------------------------------------------------------------------------

describe('GET /api/v1/inspections/:id/items — List checklist items', () => {
  it('returns checklist items for an inspection', async () => {
    mockInspectionFindUnique.mockResolvedValue({
      id: INSPECTION_ID,
      propertyId: PROPERTY_ID,
      deletedAt: null,
    });
    mockItemFindMany.mockResolvedValue([
      { id: 'item-1', name: 'Fire extinguisher', type: 'pass_fail', required: true, passed: true },
      { id: 'item-2', name: 'Exit signs', type: 'pass_fail', required: true, passed: null },
    ]);

    const req = createGetRequest(`/api/v1/inspections/${INSPECTION_ID}/items`);
    const res = await GET_ITEMS(req, { params: Promise.resolve({ id: INSPECTION_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('returns 404 when inspection does not exist', async () => {
    mockInspectionFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/inspections/${INSPECTION_ID}/items`);
    const res = await GET_ITEMS(req, { params: Promise.resolve({ id: INSPECTION_ID }) });
    expect(res.status).toBe(404);
  });
});
