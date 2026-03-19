/**
 * Upcoming Recurring Tasks API — Calendar View
 * Lists all scheduled task occurrences for the next N days (default 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { generateOccurrences } from '@/server/scheduling';
import type { ScheduleConfig } from '@/server/scheduling';

// ---------------------------------------------------------------------------
// GET /api/v1/recurring-tasks/upcoming — Next 30 days calendar
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const daysAhead = parseInt(searchParams.get('days') || '30', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch all active recurring tasks for the property
    const tasks = await prisma.recurringTask.findMany({
      where: { propertyId, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
      },
    });

    const now = new Date();
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + daysAhead);

    // Generate occurrences for each task within the window
    const upcoming: Array<{
      taskId: string;
      taskName: string;
      date: Date;
      category: { id: string; name: string } | null;
      equipment: { id: string; name: string } | null;
      assignedEmployeeId: string | null;
      defaultPriority: string;
      isOverdue: boolean;
    }> = [];

    for (const task of tasks) {
      const scheduleConfig: ScheduleConfig = {
        intervalType: task.intervalType as ScheduleConfig['intervalType'],
        customIntervalDays: task.customIntervalDays ?? undefined,
        startDate: task.startDate,
        endDate: task.endDate,
      };

      const occurrences = generateOccurrences(scheduleConfig, now, rangeEnd);

      for (const date of occurrences) {
        upcoming.push({
          taskId: task.id,
          taskName: task.name,
          date,
          category: task.category,
          equipment: task.equipment,
          assignedEmployeeId: task.assignedEmployeeId,
          defaultPriority: task.defaultPriority,
          isOverdue: date < now,
        });
      }
    }

    // Sort by date
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

    return NextResponse.json({
      data: upcoming,
      meta: { days: daysAhead, total: upcoming.length },
    });
  } catch (error) {
    console.error('GET /api/v1/recurring-tasks/upcoming error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch upcoming tasks' },
      { status: 500 },
    );
  }
}
