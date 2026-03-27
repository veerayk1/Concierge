/**
 * Maintenance Request Detail API — Get, Update, Assign
 * Per PRD 05
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateMaintenanceSchema } from '@/schemas/maintenance';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmail } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';
import {
  calculateSlaStatus,
  getSlaPriorityBump,
  DEFAULT_SLA_HOURS,
  type MaintenancePriority,
  type MaintenanceCategory,
} from '@/server/workflows/maintenance-sla';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REOPEN_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

// ---------------------------------------------------------------------------
// GET /api/v1/maintenance/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!req) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found' },
        { status: 404 },
      );
    }

    // Fetch resident separately to avoid crash if residentId references a deleted/missing user
    let resident: { id: string; firstName: string; lastName: string; email: string } | null = null;
    if (req.residentId) {
      resident = await prisma.user.findUnique({
        where: { id: req.residentId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    }

    return NextResponse.json({ data: { ...req, resident } });
  } catch (error) {
    console.error('GET /api/v1/maintenance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch request' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/maintenance/:id — Status transitions, assignment, SLA
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateMaintenanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Fetch existing request for transition validation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (await (prisma.maintenanceRequest.findUnique as any)({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        category: { select: { id: true, name: true } },
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })) as
      | (Record<string, unknown> & {
          id: string;
          propertyId: string;
          status: string;
          priority: string;
          referenceNumber: string;
          residentId: string;
          createdAt: Date;
          completedDate: Date | null;
          category: { id: string; name: string } | null;
          unit: { id: true; number: true } | null;
        })
      | null;

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found' },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // Status transition validation
    // ------------------------------------------------------------------
    const newStatus = input.status;
    const oldStatus = existing.status;
    const isStatusChange = newStatus && newStatus !== oldStatus;

    if (isStatusChange) {
      // on_hold requires holdReason
      if (newStatus === 'on_hold' && !input.holdReason) {
        return NextResponse.json(
          {
            error: 'HOLD_REASON_REQUIRED',
            message: 'A hold reason is required to put a request on hold.',
          },
          { status: 400 },
        );
      }

      // completed requires resolutionNotes
      if (newStatus === 'completed' && !input.resolutionNotes) {
        return NextResponse.json(
          {
            error: 'RESOLUTION_NOTES_REQUIRED',
            message: 'Resolution notes are required to complete a request.',
          },
          { status: 400 },
        );
      }

      // Re-open from completed: only within 48h
      if (newStatus === 'open' && oldStatus === 'completed') {
        const completedDate = (existing as Record<string, unknown>).completedDate as Date | null;
        if (completedDate) {
          const elapsed = Date.now() - new Date(completedDate).getTime();
          if (elapsed > REOPEN_WINDOW_MS) {
            return NextResponse.json(
              {
                error: 'REOPEN_WINDOW_EXPIRED',
                message: 'Cannot re-open a request more than 48 hours after completion.',
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Build update payload
    // ------------------------------------------------------------------
    const updateData: Record<string, unknown> = {};

    if (newStatus) {
      updateData.status = newStatus;

      if (newStatus === 'completed') {
        updateData.completedDate = new Date();
        updateData.resolutionNotes = input.resolutionNotes;
      }

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.completedDate = new Date();
      }

      // Re-opening clears completedDate
      if (newStatus === 'open' && oldStatus === 'completed') {
        updateData.completedDate = null;
        updateData.resolutionNotes = null;
      }
    }

    if (input.priority) updateData.priority = input.priority;
    if (input.assignedEmployeeId) updateData.assignedEmployeeId = input.assignedEmployeeId;
    if (input.assignedVendorId) updateData.assignedVendorId = input.assignedVendorId;
    if (input.description) updateData.description = stripControlChars(stripHtml(input.description));
    // GAP 5.1: Toggle resident visibility
    if (typeof input.hideFromResident === 'boolean')
      updateData.hideFromResident = input.hideFromResident;

    // ------------------------------------------------------------------
    // SLA priority escalation (on any status change)
    // ------------------------------------------------------------------
    if (
      isStatusChange &&
      newStatus !== 'completed' &&
      newStatus !== 'closed' &&
      newStatus !== 'resolved'
    ) {
      const categoryName = (existing.category as { name: string } | null)?.name as
        | string
        | undefined;
      if (categoryName && categoryName in DEFAULT_SLA_HOURS) {
        const slaHours = DEFAULT_SLA_HOURS[categoryName as MaintenanceCategory];
        const slaStatus = calculateSlaStatus(new Date(existing.createdAt), slaHours);
        const currentPriority = (existing.priority as MaintenancePriority) || 'medium';
        const newPriority = getSlaPriorityBump(currentPriority, slaStatus);
        if (newPriority !== currentPriority) {
          updateData.priority = newPriority;
        }
      }
    }

    // ------------------------------------------------------------------
    // Persist update
    // ------------------------------------------------------------------
    const req = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    // ------------------------------------------------------------------
    // Photo/document attachment wiring
    // ------------------------------------------------------------------
    if (input.attachments && input.attachments.length > 0) {
      await Promise.all(
        input.attachments.map((attachment) =>
          prisma.attachment.create({
            data: {
              propertyId: existing.propertyId,
              attachableType: 'maintenance_request',
              attachableId: id,
              fileName: attachment.fileName,
              fileType: attachment.contentType,
              fileSizeBytes: attachment.fileSizeBytes,
              storageUrl: attachment.key,
              uploadedById: auth.user.userId,
              maintenanceRequestId: id,
            },
          }),
        ),
      );
    }

    // ------------------------------------------------------------------
    // Status change audit record + email notification
    // ------------------------------------------------------------------
    if (isStatusChange) {
      // Look up the resident who created this request for email notification.
      // The `resident` field may be populated from include (if relation exists)
      // or we access it from the existing record's extra data.
      const resident = (existing as Record<string, unknown>).resident as
        | { id: string; email: string; firstName?: string }
        | undefined;

      // Send email notification to requester
      let notificationSent = false;
      if (resident?.email) {
        await sendEmail({
          to: resident.email,
          subject: `Maintenance ${existing.referenceNumber} — status changed to ${newStatus}`,
          html: renderTemplate('maintenance_update', {
            requestRef: existing.referenceNumber,
            status: newStatus ?? 'open',
            updatedBy: auth.user.userId,
            ...(input.resolutionNotes ? { resolutionNotes: input.resolutionNotes } : {}),
          }),
        });
        notificationSent = true;
      }

      // Vendor notification on assignment
      if (input.assignedVendorId && !notificationSent) {
        await sendEmail({
          to: 'vendor-notifications@concierge.app', // placeholder — real vendor lookup would go here
          subject: `Maintenance ${existing.referenceNumber} — vendor assigned`,
          text: `A maintenance request has been assigned to your organization. Reference: ${existing.referenceNumber}.`,
        });
        notificationSent = true;
      }

      // Create audit record
      await prisma.maintenanceStatusChange.create({
        data: {
          requestId: id,
          changedById: auth.user.userId,
          fromStatus: oldStatus,
          toStatus: newStatus!,
          reason: input.holdReason || null,
          resolutionNotes: input.resolutionNotes || null,
          notificationSent,
        },
      });
    } else if (input.assignedVendorId) {
      // Vendor assigned without status change — still notify
      await sendEmail({
        to: 'vendor-notifications@concierge.app',
        subject: `Maintenance ${existing.referenceNumber} — vendor assigned`,
        text: `A maintenance request has been assigned to your organization. Reference: ${existing.referenceNumber}.`,
      });
    }

    return NextResponse.json({
      data: req,
      message: `Request ${newStatus ? newStatus : 'updated'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/maintenance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update request' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/maintenance/:id — Soft delete
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    await prisma.maintenanceRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ message: 'Request deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/maintenance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete request' },
      { status: 500 },
    );
  }
}
