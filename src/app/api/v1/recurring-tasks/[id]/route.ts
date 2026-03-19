/**
 * Recurring Task Detail API — Get, Update, Delete
 * Supports pause/resume, schedule changes, and equipment linkage
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateRecurringTaskSchema } from '@/schemas/recurring-task';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { calculateNextOccurrence } from '@/server/scheduling';
import type { ScheduleConfig } from '@/server/scheduling';

// ---------------------------------------------------------------------------
// GET /api/v1/recurring-tasks/:id — Task detail with completion history
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const task = await prisma.recurringTask.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
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
