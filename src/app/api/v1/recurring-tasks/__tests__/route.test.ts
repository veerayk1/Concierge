/**
 * Recurring Tasks & Preventive Maintenance Scheduling — API Route Tests
 *
 * Tests cover: CRUD operations, schedule types (daily/weekly/monthly/cron),
 * next occurrence calculation, auto maintenance request creation on due date,
 * upcoming calendar view, pause/resume, staff/vendor assignment,
 * completion history tracking, overdue detection, equipment linkage,
 * and tenant isolation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';
import {
  isValidCronExpression,
  parseCronExpression,
  calculateNextOccurrence,
  generateOccurrences,
} from '@/server/scheduling';
import type { ScheduleConfig } from '@/server/scheduling';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockTaskFindMany = vi.fn();
const mockTaskFindUnique = vi.fn();
const mockTaskCount = vi.fn();
const mockTaskCreate = vi.fn();
const mockTaskUpdate = vi.fn();

const mockMaintenanceCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    recurringTask: {
      findMany: (...args: unknown[]) => mockTaskFindMany(...args),
      findUnique: (...args: unknown[]) => mockTaskFindUnique(...args),
      count: (...args: unknown[]) => mockTaskCount(...args),
      create: (...args: unknown[]) => mockTaskCreate(...args),
      update: (...args: unknown[]) => mockTaskUpdate(...args),
    },
    maintenanceRequest: {
      create: (...args: unknown[]) => mockMaintenanceCreate(...args),
    },
  },
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
import { GET as GET_DETAIL, PATCH, DELETE as DELETE_TASK } from '../[id]/route';
import { GET as GET_UPCOMING } from '../upcoming/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockTaskFindMany.mockResolvedValue([]);
  mockTaskCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const TASK_ID = '00000000-0000-4000-e000-000000000001';
const CATEGORY_ID = '00000000-0000-4000-d000-000000000001';
const EMPLOYEE_ID = '00000000-0000-4000-a000-000000000001';
const VENDOR_ID = '00000000-0000-4000-c000-000000000001';
const EQUIPMENT_ID = '00000000-0000-4000-f000-000000000001';

const validTaskBody = {
  propertyId: PROPERTY_ID,
  name: 'HVAC Filter Replacement',
  description: 'Replace all HVAC filters on floors 1-10',
  categoryId: CATEGORY_ID,
  intervalType: 'monthly' as const,
  startDate: '2026-03-01T00:00:00Z',
  autoCreateRequest: true,
  defaultPriority: 'normal' as const,
};

// ---------------------------------------------------------------------------
// 1. Create recurring task with schedule (daily, weekly, monthly, custom cron)
// ---------------------------------------------------------------------------

describe('POST /api/v1/recurring-tasks — Create with schedules', () => {
  beforeEach(() => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  it('creates a daily recurring task', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'daily',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.intervalType).toBe('daily');
    expect(data.isActive).toBe(true);
    expect(data.nextOccurrence).toBeDefined();
  });

  it('creates a weekly recurring task', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'weekly',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.intervalType).toBe('weekly');
  });

  it('creates a monthly recurring task', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'monthly',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.intervalType).toBe('monthly');
  });

  it('creates a custom cron-based recurring task', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'custom',
      cronExpression: '0 9 1 * *', // 1st of every month at 9am
      customIntervalDays: null,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('creates a custom interval-days based recurring task', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'custom',
      customIntervalDays: 45,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.customIntervalDays).toBe(45);
  });

  it('rejects custom interval without cron or days', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'custom',
      cronExpression: '',
      customIntervalDays: null,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      propertyId: PROPERTY_ID,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 201 with task data and message', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', validTaskBody);
    const res = await POST(req);

    const body = await parseResponse<{
      data: { id: string; name: string };
      message: string;
    }>(res);
    expect(body.data.name).toBe('HVAC Filter Replacement');
    expect(body.message).toContain('HVAC Filter Replacement');
  });

  it('handles database errors gracefully', async () => {
    mockTaskCreate.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/recurring-tasks', validTaskBody);
    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// 2. Validate cron expression format
// ---------------------------------------------------------------------------

describe('Cron expression validation', () => {
  it('accepts valid 5-field cron: "0 9 * * 1" (every Monday at 9am)', () => {
    expect(isValidCronExpression('0 9 * * 1')).toBe(true);
  });

  it('accepts "*/15 * * * *" (every 15 minutes)', () => {
    expect(isValidCronExpression('*/15 * * * *')).toBe(true);
  });

  it('accepts "0 0 1 * *" (1st of every month)', () => {
    expect(isValidCronExpression('0 0 1 * *')).toBe(true);
  });

  it('accepts "0 9 * * 1-5" (weekdays at 9am)', () => {
    expect(isValidCronExpression('0 9 * * 1-5')).toBe(true);
  });

  it('accepts comma-separated: "0 9 1,15 * *"', () => {
    expect(isValidCronExpression('0 9 1,15 * *')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidCronExpression('')).toBe(false);
  });

  it('rejects too few fields: "0 9 *"', () => {
    expect(isValidCronExpression('0 9 *')).toBe(false);
  });

  it('rejects too many fields: "0 9 * * * *"', () => {
    expect(isValidCronExpression('0 9 * * * *')).toBe(false);
  });

  it('rejects out-of-range minute: "60 9 * * *"', () => {
    expect(isValidCronExpression('60 9 * * *')).toBe(false);
  });

  it('rejects out-of-range hour: "0 25 * * *"', () => {
    expect(isValidCronExpression('0 25 * * *')).toBe(false);
  });

  it('rejects out-of-range day-of-month: "0 0 32 * *"', () => {
    expect(isValidCronExpression('0 0 32 * *')).toBe(false);
  });

  it('rejects out-of-range month: "0 0 * 13 *"', () => {
    expect(isValidCronExpression('0 0 * 13 *')).toBe(false);
  });

  it('rejects out-of-range day-of-week: "0 0 * * 7"', () => {
    expect(isValidCronExpression('0 0 * * 7')).toBe(false);
  });

  it('rejects non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidCronExpression(null as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidCronExpression(undefined as any)).toBe(false);
  });

  it('parseCronExpression returns parts for valid expression', () => {
    const parts = parseCronExpression('30 14 1 6 3');
    expect(parts.minute).toBe('30');
    expect(parts.hour).toBe('14');
    expect(parts.dayOfMonth).toBe('1');
    expect(parts.month).toBe('6');
    expect(parts.dayOfWeek).toBe('3');
  });

  it('parseCronExpression throws for invalid expression', () => {
    expect(() => parseCronExpression('invalid')).toThrow('Invalid cron expression');
  });

  it('rejects invalid cron on task creation', async () => {
    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      intervalType: 'custom',
      cronExpression: '99 99 99 99 99',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 3. Generate next occurrence date from schedule
// ---------------------------------------------------------------------------

describe('calculateNextOccurrence', () => {
  const baseDate = new Date('2026-03-01T00:00:00Z');

  it('daily: returns next day', () => {
    const config: ScheduleConfig = {
      intervalType: 'daily',
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toEqual(new Date('2026-03-02T00:00:00Z'));
  });

  it('weekly: returns 7 days later', () => {
    const config: ScheduleConfig = {
      intervalType: 'weekly',
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toEqual(new Date('2026-03-08T00:00:00Z'));
  });

  it('monthly: returns same day next month', () => {
    const config: ScheduleConfig = {
      intervalType: 'monthly',
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toEqual(new Date('2026-04-01T00:00:00Z'));
  });

  it('quarterly: returns 3 months later', () => {
    const config: ScheduleConfig = {
      intervalType: 'quarterly',
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toEqual(new Date('2026-06-01T00:00:00Z'));
  });

  it('annually: returns 12 months later', () => {
    const config: ScheduleConfig = {
      intervalType: 'annually',
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toEqual(new Date('2027-03-01T00:00:00Z'));
  });

  it('uses startDate as base when lastRun is null', () => {
    const config: ScheduleConfig = {
      intervalType: 'daily',
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, null);
    expect(next).toEqual(new Date('2026-03-02T00:00:00Z'));
  });

  it('returns null when next occurrence exceeds endDate', () => {
    const config: ScheduleConfig = {
      intervalType: 'daily',
      startDate: baseDate,
      endDate: new Date('2026-03-01T12:00:00Z'),
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toBeNull();
  });

  it('custom with customIntervalDays', () => {
    const config: ScheduleConfig = {
      intervalType: 'custom',
      customIntervalDays: 10,
      startDate: baseDate,
    };
    const next = calculateNextOccurrence(config, baseDate);
    expect(next).toEqual(new Date('2026-03-11T00:00:00Z'));
  });

  it('handles month overflow (Jan 31 + 1 month = Feb 28)', () => {
    const jan31 = new Date('2026-01-31T00:00:00Z');
    const config: ScheduleConfig = {
      intervalType: 'monthly',
      startDate: jan31,
    };
    const next = calculateNextOccurrence(config, jan31);
    // Should be last day of Feb, not March 3
    expect(next!.getUTCMonth()).toBe(1); // February
    expect(next!.getUTCDate()).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// 4. Auto-create maintenance request from recurring task on due date
// ---------------------------------------------------------------------------

describe('Auto-create maintenance request on due date', () => {
  it('POST sets autoCreateRequest flag on task', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      autoCreateRequest: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.autoCreateRequest).toBe(true);
  });

  it('task stores nextOccurrence for scheduler to pick up', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', validTaskBody);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.nextOccurrence).toBeDefined();
    expect(data.nextOccurrence).toBeInstanceOf(Date);
  });

  it('task with autoCreateRequest=false does not auto-generate requests', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      autoCreateRequest: false,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.autoCreateRequest).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. List upcoming scheduled tasks for next 30 days
// ---------------------------------------------------------------------------

describe('GET /api/v1/recurring-tasks/upcoming — Next 30 days calendar', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks/upcoming');
    const res = await GET_UPCOMING(req);
    expect(res.status).toBe(400);
  });

  it('returns upcoming occurrences for active tasks', async () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30); // started 30 days ago

    mockTaskFindMany.mockResolvedValue([
      {
        id: TASK_ID,
        propertyId: PROPERTY_ID,
        name: 'Weekly HVAC Check',
        intervalType: 'weekly',
        customIntervalDays: null,
        startDate,
        endDate: null,
        isActive: true,
        assignedEmployeeId: EMPLOYEE_ID,
        defaultPriority: 'normal',
        category: { id: CATEGORY_ID, name: 'HVAC' },
        equipment: null,
      },
    ]);

    const req = createGetRequest('/api/v1/recurring-tasks/upcoming', {
      searchParams: { propertyId: PROPERTY_ID, days: '30' },
    });
    const res = await GET_UPCOMING(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ taskId: string; taskName: string; date: string }>;
      meta: { days: number; total: number };
    }>(res);

    expect(body.meta.days).toBe(30);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]!.taskName).toBe('Weekly HVAC Check');
  });

  it('does not include paused tasks', async () => {
    mockTaskFindMany.mockResolvedValue([]); // paused tasks filtered by where clause

    const req = createGetRequest('/api/v1/recurring-tasks/upcoming', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_UPCOMING(req);
    expect(res.status).toBe(200);

    // Verify the query filters to isActive: true
    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(true);
  });

  it('sorts occurrences by date ascending', async () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 10);

    mockTaskFindMany.mockResolvedValue([
      {
        id: 'task-weekly',
        propertyId: PROPERTY_ID,
        name: 'Weekly Task',
        intervalType: 'weekly',
        customIntervalDays: null,
        startDate,
        endDate: null,
        isActive: true,
        assignedEmployeeId: null,
        defaultPriority: 'normal',
        category: { id: CATEGORY_ID, name: 'General' },
        equipment: null,
      },
      {
        id: 'task-daily',
        propertyId: PROPERTY_ID,
        name: 'Daily Task',
        intervalType: 'daily',
        customIntervalDays: null,
        startDate,
        endDate: null,
        isActive: true,
        assignedEmployeeId: null,
        defaultPriority: 'normal',
        category: { id: CATEGORY_ID, name: 'General' },
        equipment: null,
      },
    ]);

    const req = createGetRequest('/api/v1/recurring-tasks/upcoming', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_UPCOMING(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ date: string }>;
    }>(res);

    // Verify dates are sorted ascending
    for (let i = 1; i < body.data.length; i++) {
      const prev = new Date(body.data[i - 1]!.date).getTime();
      const curr = new Date(body.data[i]!.date).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Pause recurring task — stops generating new occurrences
// ---------------------------------------------------------------------------

describe('Pause recurring task', () => {
  it('sets isActive=false and clears nextOccurrence', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: true,
      intervalType: 'weekly',
      startDate: new Date('2026-01-01'),
      nextOccurrence: new Date('2026-04-01'),
    });
    mockTaskUpdate.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: false,
      nextOccurrence: null,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    });

    const req = createPatchRequest('/api/v1/recurring-tasks/update', {
      isActive: false,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });

    expect(res.status).toBe(200);

    const updateData = mockTaskUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(false);
    expect(updateData.nextOccurrence).toBeNull();

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('paused');
  });
});

// ---------------------------------------------------------------------------
// 7. Resume paused task
// ---------------------------------------------------------------------------

describe('Resume paused task', () => {
  it('sets isActive=true and recalculates nextOccurrence', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: false,
      intervalType: 'weekly',
      startDate: new Date('2026-01-01'),
      endDate: null,
      nextOccurrence: null,
      lastGeneratedAt: new Date('2026-03-10'),
      customIntervalDays: null,
    });
    mockTaskUpdate.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: true,
      nextOccurrence: new Date('2026-03-17'),
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    });

    const req = createPatchRequest('/api/v1/recurring-tasks/resume', {
      isActive: true,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });

    expect(res.status).toBe(200);

    const updateData = mockTaskUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(true);
    expect(updateData.nextOccurrence).toBeDefined();
    expect(updateData.nextOccurrence).not.toBeNull();

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('resumed');
  });
});

// ---------------------------------------------------------------------------
// 8. Assign recurring task to specific staff/vendor
// ---------------------------------------------------------------------------

describe('Assign recurring task to staff/vendor', () => {
  it('creates task with assignedEmployeeId', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      assignedEmployeeId: EMPLOYEE_ID,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.assignedEmployeeId).toBe(EMPLOYEE_ID);
  });

  it('updates assignedEmployeeId via PATCH', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: true,
      intervalType: 'weekly',
      startDate: new Date('2026-01-01'),
      assignedEmployeeId: null,
    });
    mockTaskUpdate.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      assignedEmployeeId: EMPLOYEE_ID,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    });

    const req = createPatchRequest('/api/v1/recurring-tasks/assign', {
      assignedEmployeeId: EMPLOYEE_ID,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockTaskUpdate.mock.calls[0]![0].data;
    expect(updateData.assignedEmployeeId).toBe(EMPLOYEE_ID);
  });

  it('updates assignedVendorId via PATCH', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: true,
      intervalType: 'weekly',
      startDate: new Date('2026-01-01'),
    });
    mockTaskUpdate.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      assignedVendorId: VENDOR_ID,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    });

    const req = createPatchRequest('/api/v1/recurring-tasks/assign-vendor', {
      assignedVendorId: VENDOR_ID,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockTaskUpdate.mock.calls[0]![0].data;
    expect(updateData.assignedVendorId).toBe(VENDOR_ID);
  });
});

// ---------------------------------------------------------------------------
// 9. Track completion history per occurrence
// ---------------------------------------------------------------------------

describe('Completion history tracking', () => {
  it('task stores lastGeneratedAt for tracking when occurrences were created', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      lastGeneratedAt: null,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', validTaskBody);
    await POST(req);

    // The task model has lastGeneratedAt to track the last time
    // an occurrence was generated / completed
    const body = await parseResponse<{
      data: { lastGeneratedAt: string | null };
    }>(await POST(createPostRequest('/api/v1/recurring-tasks', validTaskBody)));

    expect(body.data.lastGeneratedAt).toBeNull(); // Initially null
  });

  it('GET detail returns task with completion tracking fields', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      propertyId: PROPERTY_ID,
      name: 'HVAC Check',
      isActive: true,
      intervalType: 'weekly',
      nextOccurrence: new Date('2026-04-01'),
      lastGeneratedAt: new Date('2026-03-25'),
      startDate: new Date('2026-01-01'),
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    });

    const req = createGetRequest('/api/v1/recurring-tasks/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { lastGeneratedAt: string; nextOccurrence: string };
    }>(res);
    expect(body.data.lastGeneratedAt).toBeDefined();
    expect(body.data.nextOccurrence).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 10. Overdue detection: flag tasks not completed by due date
// ---------------------------------------------------------------------------

describe('Overdue detection', () => {
  it('flags task as overdue when nextOccurrence is in the past', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3); // 3 days ago

    mockTaskFindMany.mockResolvedValue([
      {
        id: TASK_ID,
        name: 'Overdue HVAC Check',
        isActive: true,
        nextOccurrence: pastDate,
        category: { id: CATEGORY_ID, name: 'HVAC' },
        equipment: null,
      },
    ]);
    mockTaskCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean; name: string }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(true);
  });

  it('does not flag future tasks as overdue', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    mockTaskFindMany.mockResolvedValue([
      {
        id: TASK_ID,
        name: 'Upcoming HVAC Check',
        isActive: true,
        nextOccurrence: futureDate,
        category: { id: CATEGORY_ID, name: 'HVAC' },
        equipment: null,
      },
    ]);
    mockTaskCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(false);
  });

  it('does not flag paused tasks as overdue', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    mockTaskFindMany.mockResolvedValue([
      {
        id: TASK_ID,
        name: 'Paused Task',
        isActive: false,
        nextOccurrence: pastDate,
        category: { id: CATEGORY_ID, name: 'HVAC' },
        equipment: null,
      },
    ]);
    mockTaskCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(false);
  });

  it('GET detail also includes isOverdue flag', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      propertyId: PROPERTY_ID,
      name: 'Overdue Task',
      isActive: true,
      nextOccurrence: pastDate,
      startDate: new Date('2026-01-01'),
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    });

    const req = createGetRequest('/api/v1/recurring-tasks/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });

    const body = await parseResponse<{
      data: { isOverdue: boolean };
    }>(res);
    expect(body.data.isOverdue).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 11. Equipment linkage: recurring task tied to equipment for lifecycle tracking
// ---------------------------------------------------------------------------

describe('Equipment linkage', () => {
  it('creates task with equipmentId', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: { id: EQUIPMENT_ID, name: 'Roof HVAC Unit' },
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', {
      ...validTaskBody,
      equipmentId: EQUIPMENT_ID,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.equipmentId).toBe(EQUIPMENT_ID);

    const body = await parseResponse<{
      data: { equipment: { id: string; name: string } };
    }>(res);
    expect(body.data.equipment.id).toBe(EQUIPMENT_ID);
  });

  it('lists tasks filtered by equipmentId', async () => {
    mockTaskFindMany.mockResolvedValue([]);
    mockTaskCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID, equipmentId: EQUIPMENT_ID },
    });
    await GET(req);

    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.equipmentId).toBe(EQUIPMENT_ID);
  });

  it('updates equipmentId via PATCH', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      isActive: true,
      intervalType: 'weekly',
      startDate: new Date('2026-01-01'),
      equipmentId: null,
    });
    mockTaskUpdate.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
      equipmentId: EQUIPMENT_ID,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: { id: EQUIPMENT_ID, name: 'Roof HVAC Unit' },
    });

    const req = createPatchRequest('/api/v1/recurring-tasks/equip', {
      equipmentId: EQUIPMENT_ID,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockTaskUpdate.mock.calls[0]![0].data;
    expect(updateData.equipmentId).toBe(EQUIPMENT_ID);
  });

  it('GET detail includes equipment relation', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      propertyId: PROPERTY_ID,
      name: 'HVAC Check',
      isActive: true,
      nextOccurrence: new Date('2026-04-01'),
      startDate: new Date('2026-01-01'),
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: { id: EQUIPMENT_ID, name: 'Roof HVAC Unit' },
    });

    const req = createGetRequest('/api/v1/recurring-tasks/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });

    // Verify findUnique includes equipment
    const include = mockTaskFindUnique.mock.calls[0]![0].include;
    expect(include.equipment).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 12. Tenant isolation on all operations
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('GET list scopes to propertyId', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('GET list rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('POST enforces propertyId from input', async () => {
    mockTaskCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: TASK_ID,
      ...args.data,
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: null,
    }));

    const req = createPostRequest('/api/v1/recurring-tasks', validTaskBody);
    await POST(req);

    const data = mockTaskCreate.mock.calls[0]![0].data;
    expect(data.propertyId).toBe(PROPERTY_ID);
  });

  it('upcoming endpoint scopes to propertyId', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks/upcoming', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_UPCOMING(req);

    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('upcoming endpoint rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks/upcoming');
    const res = await GET_UPCOMING(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Additional: GET detail, DELETE, generateOccurrences
// ---------------------------------------------------------------------------

describe('GET /api/v1/recurring-tasks/:id — Task detail', () => {
  it('returns 404 for non-existent task', async () => {
    mockTaskFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/recurring-tasks/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns task with category and equipment', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      propertyId: PROPERTY_ID,
      name: 'HVAC Check',
      isActive: true,
      nextOccurrence: new Date('2026-04-01'),
      startDate: new Date('2026-01-01'),
      category: { id: CATEGORY_ID, name: 'HVAC' },
      equipment: { id: EQUIPMENT_ID, name: 'Roof HVAC' },
    });

    const req = createGetRequest('/api/v1/recurring-tasks/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { name: string; category: { name: string } };
    }>(res);
    expect(body.data.name).toBe('HVAC Check');
    expect(body.data.category.name).toBe('HVAC');
  });
});

describe('PATCH /api/v1/recurring-tasks/:id — Validation', () => {
  it('returns 404 for non-existent task', async () => {
    mockTaskFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/recurring-tasks/update', {
      name: 'Updated Name',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/recurring-tasks/:id — Soft delete', () => {
  it('deactivates the task', async () => {
    mockTaskFindUnique.mockResolvedValue({
      id: TASK_ID,
      name: 'HVAC Check',
    });
    mockTaskUpdate.mockResolvedValue({
      id: TASK_ID,
      isActive: false,
      nextOccurrence: null,
    });

    const req = createDeleteRequest('/api/v1/recurring-tasks/delete');
    const res = await DELETE_TASK(req, {
      params: Promise.resolve({ id: TASK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deleted');

    const updateData = mockTaskUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(false);
    expect(updateData.nextOccurrence).toBeNull();
  });

  it('returns 404 for non-existent task', async () => {
    mockTaskFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/recurring-tasks/delete');
    const res = await DELETE_TASK(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('generateOccurrences — calendar view utility', () => {
  it('generates daily occurrences within a 7-day window', () => {
    const config: ScheduleConfig = {
      intervalType: 'daily',
      startDate: new Date('2026-03-01T00:00:00Z'),
    };
    const rangeStart = new Date('2026-03-01T00:00:00Z');
    const rangeEnd = new Date('2026-03-07T23:59:59Z');

    const occurrences = generateOccurrences(config, rangeStart, rangeEnd);
    // Should include Mar 1 (start) plus Mar 2-7 = 7 total
    expect(occurrences.length).toBe(7);
  });

  it('generates weekly occurrences within a 30-day window', () => {
    const config: ScheduleConfig = {
      intervalType: 'weekly',
      startDate: new Date('2026-03-01T00:00:00Z'),
    };
    const rangeStart = new Date('2026-03-01T00:00:00Z');
    const rangeEnd = new Date('2026-03-31T23:59:59Z');

    const occurrences = generateOccurrences(config, rangeStart, rangeEnd);
    // Mar 1, 8, 15, 22, 29 = 5 occurrences
    expect(occurrences.length).toBe(5);
  });

  it('respects endDate and stops generating', () => {
    const config: ScheduleConfig = {
      intervalType: 'daily',
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-03T00:00:00Z'),
    };
    const rangeStart = new Date('2026-03-01T00:00:00Z');
    const rangeEnd = new Date('2026-03-10T00:00:00Z');

    const occurrences = generateOccurrences(config, rangeStart, rangeEnd);
    // Mar 1, 2, 3 = 3 occurrences (endDate inclusive)
    expect(occurrences.length).toBe(3);
  });

  it('returns empty array if schedule starts after range', () => {
    const config: ScheduleConfig = {
      intervalType: 'daily',
      startDate: new Date('2026-04-01T00:00:00Z'),
    };
    const rangeStart = new Date('2026-03-01T00:00:00Z');
    const rangeEnd = new Date('2026-03-31T00:00:00Z');

    const occurrences = generateOccurrences(config, rangeStart, rangeEnd);
    expect(occurrences.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/recurring-tasks — List filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/recurring-tasks — List with filters', () => {
  it('filters by status=active', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });
    await GET(req);

    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(true);
  });

  it('filters by status=paused', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID, status: 'paused' },
    });
    await GET(req);

    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(false);
  });

  it('filters by assignedEmployeeId', async () => {
    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID, assignedEmployeeId: EMPLOYEE_ID },
    });
    await GET(req);

    const where = mockTaskFindMany.mock.calls[0]![0].where;
    expect(where.assignedEmployeeId).toBe(EMPLOYEE_ID);
  });

  it('returns pagination metadata', async () => {
    mockTaskCount.mockResolvedValue(25);
    mockTaskFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/recurring-tasks', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(25);
    expect(body.meta.totalPages).toBe(3);
  });
});
