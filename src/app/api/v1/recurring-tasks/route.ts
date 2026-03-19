/**
 * Recurring Tasks API — List & Create
 * Preventive maintenance scheduling with cron support
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createRecurringTaskSchema } from '@/schemas/recurring-task';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { calculateNextOccurrence } from '@/server/scheduling';
import type { ScheduleConfig } from '@/server/scheduling';

// ---------------------------------------------------------------------------
// GET /api/v1/recurring-tasks — List recurring tasks for a property
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status'); // active | paused
    const equipmentId = searchParams.get('equipmentId');
    const assignedEmployeeId = searchParams.get('assignedEmployeeId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId };

    if (status === 'active') where.isActive = true;
    if (status === 'paused') where.isActive = false;
    if (equipmentId) where.equipmentId = equipmentId;
    if (assignedEmployeeId) where.assignedEmployeeId = assignedEmployeeId;

    const [tasks, total] = await Promise.all([
      prisma.recurringTask.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true } },
        },
        orderBy: { nextOccurrence: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recurringTask.count({ where }),
    ]);

    // Flag overdue tasks (active + nextOccurrence in the past)
    const now = new Date();
    const tasksWithOverdue = tasks.map((task) => ({
      ...task,
      isOverdue:
        task.isActive && task.nextOccurrence !== null && new Date(task.nextOccurrence) < now,
    }));

    return NextResponse.json({
      data: tasksWithOverdue,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/recurring-tasks error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch recurring tasks' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/recurring-tasks — Create recurring task
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createRecurringTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Calculate initial next occurrence
    const scheduleConfig: ScheduleConfig = {
      intervalType: input.intervalType,
      cronExpression: input.cronExpression || undefined,
      customIntervalDays: input.customIntervalDays ?? undefined,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
    };

    const nextOccurrence = calculateNextOccurrence(scheduleConfig, null);

    const task = await prisma.recurringTask.create({
      data: {
        propertyId: input.propertyId,
        name: stripControlChars(stripHtml(input.name)),
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        categoryId: input.categoryId,
        unitId: input.unitId ?? null,
        areaDescription: input.areaDescription || null,
        assignedEmployeeId: input.assignedEmployeeId ?? null,
        equipmentId: input.equipmentId ?? null,
        intervalType: input.intervalType,
        customIntervalDays: input.customIntervalDays ?? null,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        nextOccurrence,
        autoCreateRequest: input.autoCreateRequest,
        defaultPriority: input.defaultPriority,
        isActive: true,
        createdById: auth.user.userId,
      },
      include: {
        category: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { data: task, message: `Recurring task "${task.name}" created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/recurring-tasks error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create recurring task' },
      { status: 500 },
    );
  }
}
