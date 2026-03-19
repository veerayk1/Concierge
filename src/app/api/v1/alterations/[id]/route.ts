/**
 * Alteration Project Detail API — Get & Update
 *
 * Handles status lifecycle transitions, momentum indicators,
 * inspection scheduling, contractor assignment, and multi-step review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import {
  updateAlterationSchema,
  calculateMomentum,
  VALID_TRANSITIONS,
  REQUIRED_DOCUMENT_TYPES,
  type AlterationStatus,
} from '@/schemas/alteration';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmail } from '@/server/email';

// ---------------------------------------------------------------------------
// GET /api/v1/alterations/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const project = await prisma.alterationProject.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        documents: true,
        statusChanges: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Alteration project not found' },
        { status: 404 },
      );
    }

    // Build required documents checklist
    const docs = (project as Record<string, unknown>).documents as
      | Array<{ documentType: string }>
      | undefined;
    const uploadedTypes = new Set((docs || []).map((d) => d.documentType));
    const requiredDocuments = REQUIRED_DOCUMENT_TYPES.map((type) => ({
      type,
      uploaded: uploadedTypes.has(type),
    }));

    // Calculate momentum
    const lastActivityDate = (project as Record<string, unknown>).lastActivityDate as
      | Date
      | undefined;
    const momentum = lastActivityDate ? calculateMomentum(lastActivityDate) : 'stopped';

    // Build timeline from status changes
    const statusChanges = (project as Record<string, unknown>).statusChanges as
      | Array<{
          id: string;
          fromStatus: string;
          toStatus: string;
          reason: string | null;
          createdAt: Date;
          changedById: string;
        }>
      | undefined;

    const timeline = (statusChanges || []).map((change) => ({
      id: change.id,
      type: 'status_change' as const,
      fromStatus: change.fromStatus,
      toStatus: change.toStatus,
      reason: change.reason,
      timestamp: change.createdAt,
      userId: change.changedById,
    }));

    return NextResponse.json({
      data: {
        ...project,
        requiredDocuments,
        momentum,
        timeline,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/alterations/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch alteration project' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/alterations/:id
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateAlterationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Fetch existing project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (await (prisma.alterationProject.findUnique as any)({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        documents: true,
      },
    })) as
      | (Record<string, unknown> & {
          id: string;
          propertyId: string;
          status: string;
          referenceNumber: string;
          createdById: string;
        })
      | null;

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Alteration project not found' },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // Status transition validation
    // ------------------------------------------------------------------
    const newStatus = input.status as AlterationStatus | undefined;
    const oldStatus = existing.status as AlterationStatus;
    const isStatusChange = newStatus && newStatus !== oldStatus;

    if (isStatusChange) {
      const allowed = VALID_TRANSITIONS[oldStatus];
      if (!allowed || !allowed.includes(newStatus)) {
        return NextResponse.json(
          {
            error: 'INVALID_TRANSITION',
            message: `Cannot transition from ${oldStatus} to ${newStatus}.`,
          },
          { status: 400 },
        );
      }

      // Declined requires reason
      if (newStatus === 'declined' && !input.declineReason) {
        return NextResponse.json(
          {
            error: 'DECLINE_REASON_REQUIRED',
            message: 'A decline reason is required.',
          },
          { status: 400 },
        );
      }
    }

    // ------------------------------------------------------------------
    // Build update payload
    // ------------------------------------------------------------------
    const updateData: Record<string, unknown> = {};

    if (newStatus) {
      updateData.status = newStatus;

      if (newStatus === 'declined' && input.declineReason) {
        updateData.declineReason = stripControlChars(stripHtml(input.declineReason));
      }

      if (newStatus === 'completed') {
        updateData.actualCompletionDate = input.actualCompletionDate
          ? new Date(input.actualCompletionDate)
          : new Date();
      }
    }

    if (input.description) {
      updateData.description = stripControlChars(stripHtml(input.description));
    }
    if (input.type) {
      updateData.type = input.type;
    }
    if (input.expectedEndDate) {
      updateData.expectedEndDate = new Date(input.expectedEndDate);
    }
    if (input.actualCompletionDate && !newStatus) {
      updateData.actualCompletionDate = new Date(input.actualCompletionDate);
    }
    if (input.contractorVendorId) {
      updateData.contractorVendorId = input.contractorVendorId;
    }
    if (input.contractorName !== undefined) {
      updateData.contractorName = input.contractorName
        ? stripControlChars(stripHtml(input.contractorName))
        : null;
    }
    if (input.contractorPhone !== undefined) {
      updateData.contractorPhone = input.contractorPhone || null;
    }
    if (input.contractorEmail !== undefined) {
      updateData.contractorEmail = input.contractorEmail || null;
    }
    if (input.hasPermit !== undefined) {
      updateData.hasPermit = input.hasPermit;
    }
    if (input.permitNumber !== undefined) {
      updateData.permitNumber = input.permitNumber
        ? stripControlChars(stripHtml(input.permitNumber))
        : null;
    }
    if (input.hasInsurance !== undefined) {
      updateData.hasInsurance = input.hasInsurance;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;
    }
    if (input.reviewStep) {
      updateData.reviewStep = input.reviewStep;
    }
    if (input.reviewNotes) {
      updateData.reviewNotes = stripControlChars(stripHtml(input.reviewNotes));
    }
    if (input.inspectionDate) {
      updateData.inspectionDate = new Date(input.inspectionDate);
    }
    if (input.inspectionNotes) {
      updateData.inspectionNotes = stripControlChars(stripHtml(input.inspectionNotes));
    }

    // Always update lastActivityDate on any change
    updateData.lastActivityDate = new Date();

    // ------------------------------------------------------------------
    // Persist update
    // ------------------------------------------------------------------
    const updated = await prisma.alterationProject.update({
      where: { id },
      data: updateData,
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    // Calculate momentum for response
    const updatedMomentum = calculateMomentum(
      (updated as Record<string, unknown>).lastActivityDate as Date,
    );

    // ------------------------------------------------------------------
    // Email notification on status change
    // ------------------------------------------------------------------
    if (isStatusChange) {
      const resident = (existing as Record<string, unknown>).resident as
        | { email: string; firstName?: string }
        | undefined;

      if (resident?.email) {
        await sendEmail({
          to: resident.email,
          subject: `Alteration ${existing.referenceNumber} — status changed to ${newStatus}`,
          text: `Hi${resident.firstName ? ` ${resident.firstName}` : ''},\n\nYour alteration project ${existing.referenceNumber} has been updated to: ${newStatus}.\n\n— Concierge`,
        });
      }

      // Audit record
      await prisma.alterationStatusChange.create({
        data: {
          alterationProjectId: id,
          changedById: auth.user.userId,
          fromStatus: oldStatus,
          toStatus: newStatus!,
          reason: input.declineReason || input.reviewNotes || null,
        },
      });
    }

    return NextResponse.json({
      data: { ...updated, momentum: updatedMomentum },
      message: `Alteration project ${isStatusChange ? newStatus : 'updated'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/alterations/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update alteration project' },
      { status: 500 },
    );
  }
}
