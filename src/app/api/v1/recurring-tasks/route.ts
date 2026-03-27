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
    const category = searchParams.get('category');
    const frequency = searchParams.get('frequency');
    const search = searchParams.get('search') || '';
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
    if (category) where.categoryId = category;
    if (frequency) where.intervalType = frequency;
    if (equipmentId) where.equipmentId = equipmentId;
    if (assignedEmployeeId) where.assignedEmployeeId = assignedEmployeeId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { areaDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

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

    const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const priorityMap: Record<string, string> = { medium: 'normal', low: 'low', high: 'high', critical: 'critical' };

    // Map dialog field names to schema field names
    const resolvedPropertyId = body.propertyId || auth.user.propertyId;

    // Resolve categoryId: from UUID, name lookup, or auto-create
    let categoryId = body.categoryId;
    if (!categoryId && body.category) {
      const cat = await prisma.maintenanceCategory.findFirst({
        where: { propertyId: resolvedPropertyId, name: { equals: body.category, mode: 'insensitive' } },
      });
      if (cat) {
        categoryId = cat.id;
      } else {
        // Auto-create the category
        const newCat = await prisma.maintenanceCategory.create({
          data: { propertyId: resolvedPropertyId, name: body.category.charAt(0).toUpperCase() + body.category.slice(1).replace(/_/g, ' ') },
        });
        categoryId = newCat.id;
      }
    }

    // Resolve assignedEmployeeId: only pass if it's a valid UUID
    const rawAssigned = body.assignedEmployeeId || body.assignedTo;
    const assignedEmployeeId = rawAssigned && isUuid(rawAssigned) ? rawAssigned : undefined;

    // Default startDate to now if not provided
    const startDate = body.startDate || new Date().toISOString();
    const rawPriority = body.priority || body.defaultPriority || 'normal';

    const mapped: Record<string, unknown> = {
      propertyId: resolvedPropertyId,
      name: body.name || body.taskName,
      description: body.description,
      categoryId,
      intervalType: body.intervalType || body.frequency || 'monthly',
      assignedEmployeeId: assignedEmployeeId || undefined,
      startDate,
      endDate: body.endDate || undefined,
      defaultPriority: priorityMap[rawPriority] || rawPriority,
      autoCreateRequest: body.autoCreateRequest ?? true,
      location: body.location,
      notes: body.notes,
      equipmentId: body.equipmentId,
      unitId: body.unitId,
      areaDescription: body.areaDescription,
    };

    const parsed = createRecurringTaskSchema.safeParse(mapped);

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
        location: input.location || null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
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
