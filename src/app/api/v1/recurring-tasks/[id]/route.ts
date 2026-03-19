/**
 * Recurring Task Detail API — Get, Update, Complete, Delete
 * Supports pause/resume, schedule changes, mark complete, and equipment linkage
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateRecurringTaskSchema, completeRecurringTaskSchema } from '@/schemas/recurring-task';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { calculateNextOccurrence } from '@/server/scheduling';
import type { ScheduleConfig } from '@/server/scheduling';

// ---------------------------------------------------------------------------
// Helper: calculate current period boundaries for a task
// ---------------------------------------------------------------------------

function getCurrentPeriod(task: {
  intervalType: string;
  nextOccurrence: Date | null;
  startDate: Date;
}): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const nextDue = task.nextOccurrence ? new Date(task.nextOccurrence) : now;

  // Period end is the next occurrence; period start is one interval before
  const periodEnd = new Date(nextDue);
  const periodStart = new Date(nextDue);

  switch (task.intervalType) {
    case 'daily':
      periodStart.setDate(periodStart.getDate() - 1);
      break;
    case 'weekly':
      periodStart.setDate(periodStart.getDate() - 7);
      break;
    case 'biweekly':
      periodStart.setDate(periodStart.getDate() - 14);
      break;
    case 'monthly':
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
    case 'quarterly':
      periodStart.setMonth(periodStart.getMonth() - 3);
      break;
    case 'semiannually':
      periodStart.setMonth(periodStart.getMonth() - 6);
      break;
    case 'annually':
      periodStart.setFullYear(periodStart.getFullYear() - 1);
      break;
    default:
      periodStart.setDate(periodStart.getDate() - 1);
      break;
  }

  return { periodStart, periodEnd };
}

// ---------------------------------------------------------------------------
// GET /api/v1/recurring-tasks/:id — Task detail with completion history
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = await (prisma.recurringTask.findUnique as any)({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Recurring task not found' },
        { status: 404 },
      );
    }

    const now = new Date();
    const isOverdue =
      task.isActive && task.nextOccurrence !== null && new Date(task.nextOccurrence) < now;

    return NextResponse.json({
      data: { ...task, isOverdue },
    });
  } catch (error) {
    console.error('GET /api/v1/recurring-tasks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch recurring task' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/recurring-tasks/:id — Update / Pause / Resume
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateRecurringTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Verify task exists
    const existing = await prisma.recurringTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Recurring task not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = stripControlChars(stripHtml(input.name));
    if (input.description !== undefined)
      updateData.description = input.description
        ? stripControlChars(stripHtml(input.description))
        : null;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.unitId !== undefined) updateData.unitId = input.unitId;
    if (input.areaDescription !== undefined) updateData.areaDescription = input.areaDescription;
    if (input.location !== undefined) updateData.location = input.location || null;
    if (input.notes !== undefined)
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;
    if (input.assignedEmployeeId !== undefined)
      updateData.assignedEmployeeId = input.assignedEmployeeId;
    if (input.assignedVendorId !== undefined) updateData.assignedVendorId = input.assignedVendorId;
    if (input.equipmentId !== undefined) updateData.equipmentId = input.equipmentId;
    if (input.intervalType !== undefined) updateData.intervalType = input.intervalType;
    if (input.cronExpression !== undefined) updateData.cronExpression = input.cronExpression;
    if (input.customIntervalDays !== undefined)
      updateData.customIntervalDays = input.customIntervalDays;
    if (input.endDate !== undefined)
      updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.autoCreateRequest !== undefined)
      updateData.autoCreateRequest = input.autoCreateRequest;
    if (input.defaultPriority !== undefined) updateData.defaultPriority = input.defaultPriority;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Recalculate next occurrence if schedule changed or task resumed
    const scheduleChanged =
      input.intervalType !== undefined ||
      input.cronExpression !== undefined ||
      input.customIntervalDays !== undefined;
    const resumed = input.isActive === true && !existing.isActive;

    if (scheduleChanged || resumed) {
      const intervalType = input.intervalType ?? existing.intervalType;
      const scheduleConfig: ScheduleConfig = {
        intervalType: intervalType as ScheduleConfig['intervalType'],
        cronExpression: input.cronExpression ?? undefined,
        customIntervalDays: input.customIntervalDays ?? existing.customIntervalDays ?? undefined,
        startDate: existing.startDate,
        endDate: input.endDate ? new Date(input.endDate) : existing.endDate,
      };

      const nextOccurrence = calculateNextOccurrence(scheduleConfig, existing.lastGeneratedAt);
      updateData.nextOccurrence = nextOccurrence;
    }

    // When pausing, clear next occurrence
    if (input.isActive === false) {
      updateData.nextOccurrence = null;
    }

    const task = await prisma.recurringTask.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
      },
    });

    // Build message
    let message = `Recurring task "${task.name}" updated.`;
    if (input.isActive === false) {
      message = `Recurring task "${task.name}" paused.`;
    } else if (resumed) {
      message = `Recurring task "${task.name}" resumed.`;
    }

    return NextResponse.json({ data: task, message });
  } catch (error) {
    console.error('PATCH /api/v1/recurring-tasks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update recurring task' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/recurring-tasks/:id — Mark complete for current period
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = completeRecurringTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Fetch task
    const existing = await prisma.recurringTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Recurring task not found' },
        { status: 404 },
      );
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { error: 'TASK_PAUSED', message: 'Cannot complete a paused task. Resume it first.' },
        { status: 400 },
      );
    }

    // Calculate current period
    const { periodStart, periodEnd } = getCurrentPeriod(existing);

    // Check for duplicate completion in the same period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingCompletion = await (prisma as any).recurringTaskCompletion.findFirst({
      where: {
        recurringTaskId: id,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    if (existingCompletion) {
      return NextResponse.json(
        {
          error: 'ALREADY_COMPLETED',
          message: 'This task has already been completed for the current period.',
        },
        { status: 409 },
      );
    }

    // Calculate the next due date
    const scheduleConfig: ScheduleConfig = {
      intervalType: existing.intervalType as ScheduleConfig['intervalType'],
      customIntervalDays: existing.customIntervalDays ?? undefined,
      startDate: existing.startDate,
      endDate: existing.endDate,
    };

    const now = new Date();
    const nextOccurrence = calculateNextOccurrence(scheduleConfig, now);

    // Create completion record and advance nextDue in a transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [completion, updatedTask] = await (prisma as any).$transaction([
      (prisma as any).recurringTaskCompletion.create({
        data: {
          recurringTaskId: id,
          completedById: auth.user.userId,
          completedAt: now,
          notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
          periodStart,
          periodEnd,
        },
      }),
      prisma.recurringTask.update({
        where: { id },
        data: {
          lastGeneratedAt: now,
          nextOccurrence,
        },
        include: {
          category: { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        task: updatedTask,
        completion,
        nextDue: nextOccurrence,
      },
      message: `Task "${existing.name}" marked complete. Next due: ${nextOccurrence ? nextOccurrence.toISOString().split('T')[0] : 'none'}.`,
    });
  } catch (error) {
    console.error('POST /api/v1/recurring-tasks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to complete recurring task' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/recurring-tasks/:id — Soft delete
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.recurringTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Recurring task not found' },
        { status: 404 },
      );
    }

    // Deactivate rather than hard delete to preserve history
    await prisma.recurringTask.update({
      where: { id },
      data: { isActive: false, nextOccurrence: null },
    });

    return NextResponse.json({
      message: `Recurring task "${existing.name}" deleted.`,
    });
  } catch (error) {
    console.error('DELETE /api/v1/recurring-tasks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete recurring task' },
      { status: 500 },
    );
  }
}
