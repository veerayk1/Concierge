/**
 * Inspection Detail API — Get & Update (status transitions)
 * Supports start/complete lifecycle with GPS verification
 * Per CLAUDE.md Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateInspectionSchema } from '@/schemas/inspection';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// Prisma models not yet generated — use type-safe casts so this compiles now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// ---------------------------------------------------------------------------
// Status transition rules
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ---------------------------------------------------------------------------
// Report generation helper
// ---------------------------------------------------------------------------

interface InspectionItemResult {
  passed: boolean | null;
  type: string;
  name?: string;
  required?: boolean;
  completedAt?: Date | null;
  notes?: string | null;
}

function generateReport(items: InspectionItemResult[]) {
  const totalItems = items.length;
  const passedItems = items.filter((i) => i.passed === true).length;
  const failedItems = items.filter((i) => i.passed === false).length;
  const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;
  const overallResult = failedItems > 0 ? 'fail' : 'pass';

  return { totalItems, passedItems, failedItems, passRate, overallResult };
}

// ---------------------------------------------------------------------------
// GET /api/v1/inspections/:id — Detail with report
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const inspection = await db.inspection.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inspection not found' },
        { status: 404 },
      );
    }

    const report = generateReport(inspection.items as InspectionItemResult[]);

    return NextResponse.json({
      data: { ...inspection, report },
    });
  } catch (error) {
    console.error('GET /api/v1/inspections/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch inspection' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/inspections/:id — Update / Start / Complete
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateInspectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Fetch existing with items for status validation
    const existing = await db.inspection.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inspection not found' },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // Status transition validation
    // ------------------------------------------------------------------
    if (input.status && input.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(input.status)) {
        return NextResponse.json(
          {
            error: 'INVALID_STATUS_TRANSITION',
            message: `Cannot transition from "${existing.status}" to "${input.status}". Allowed: ${allowed.join(', ') || 'none'}.`,
          },
          { status: 400 },
        );
      }

      // Completion guard: all required items must be completed
      if (input.status === 'completed') {
        const incompleteRequired = (existing.items as InspectionItemResult[]).filter(
          (item: InspectionItemResult) => item.required && item.completedAt === null,
        );
        if (incompleteRequired.length > 0) {
          return NextResponse.json(
            {
              error: 'INCOMPLETE_REQUIRED_ITEMS',
              message: `${incompleteRequired.length} required item(s) are not completed.`,
              incompleteItems: incompleteRequired.map((i: InspectionItemResult) => i.name),
            },
            { status: 400 },
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // Build update payload
    // ------------------------------------------------------------------
    const updateData: Record<string, unknown> = {};

    if (input.status) updateData.status = input.status;
    if (input.inspectorId !== undefined) updateData.inspectorId = input.inspectorId;
    if (input.gpsLatitude !== undefined) updateData.gpsLatitude = input.gpsLatitude;
    if (input.gpsLongitude !== undefined) updateData.gpsLongitude = input.gpsLongitude;
    if (input.notes !== undefined)
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;
    if (input.location !== undefined)
      updateData.location = input.location ? stripControlChars(stripHtml(input.location)) : null;

    // Set startedAt when transitioning to in_progress
    if (input.status === 'in_progress' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }

    // Set completedAt when transitioning to completed
    if (input.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updated = await db.inspection.update({
      where: { id },
      data: updateData,
    });

    // ------------------------------------------------------------------
    // Auto-create maintenance requests for failed items
    // ------------------------------------------------------------------
    if (input.status === 'completed') {
      const failedItems = (existing.items as InspectionItemResult[]).filter(
        (item: InspectionItemResult) => item.passed === false,
      );

      for (const failedItem of failedItems) {
        const referenceNumber = `MR-${nanoid(4).toUpperCase()}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma.maintenanceRequest.create as any)({
          data: {
            propertyId: existing.propertyId,
            title: `Failed inspection item: ${failedItem.name}`,
            description: `Auto-generated from inspection "${existing.title}" (${existing.category}). Item "${failedItem.name}" failed during inspection.${failedItem.notes ? ` Notes: ${failedItem.notes}` : ''}`,
            referenceNumber,
            status: 'open',
            priority: 'high',
            createdById: auth.user.userId,
          },
        });
      }
    }

    // Build message
    let message = 'Inspection updated.';
    if (input.status === 'in_progress') message = 'Inspection started.';
    if (input.status === 'completed') message = 'Inspection completed.';
    if (input.status === 'cancelled') message = 'Inspection cancelled.';

    return NextResponse.json({ data: updated, message });
  } catch (error) {
    console.error('PATCH /api/v1/inspections/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update inspection' },
      { status: 500 },
    );
  }
}
