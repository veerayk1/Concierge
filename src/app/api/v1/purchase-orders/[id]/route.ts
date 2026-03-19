/**
 * Purchase Order Detail API — Get, Update, Status Transitions
 *
 * Handles PO lifecycle: draft -> submitted -> approved -> ordered -> received -> closed.
 * Supports field updates and approval workflow with role-based access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import {
  updatePurchaseOrderStatusSchema,
  PO_STATUS_TRANSITIONS,
  type POStatus,
} from '@/schemas/purchase-order';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const PO_ALLOWED_ROLES = ['property_admin', 'board_member', 'property_manager', 'super_admin'];
const APPROVAL_ROLES = ['property_admin', 'board_member', 'super_admin'];

// ---------------------------------------------------------------------------
// GET /api/v1/purchase-orders/[id]
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id, deletedAt: null },
      include: {
        vendor: { select: { id: true, companyName: true } },
        items: true,
        attachments: true,
      },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Purchase order not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: po });
  } catch (error) {
    console.error('GET /api/v1/purchase-orders/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch purchase order' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/purchase-orders/[id] — Update fields & status transition
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!PO_ALLOWED_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions to update purchase orders' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePurchaseOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Fetch current PO
    const po = await prisma.purchaseOrder.findUnique({
      where: { id, deletedAt: null },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Purchase order not found' },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updatedById: auth.user.userId,
    };

    // ------------------------------------------------------------------
    // Status transition (optional — PATCH may only update fields)
    // ------------------------------------------------------------------
    const newStatus = input.status as POStatus | undefined;
    const currentStatus = po.status as POStatus;
    const isStatusChange = newStatus && newStatus !== currentStatus;

    if (isStatusChange) {
      const allowedTransitions = PO_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(newStatus)) {
        return NextResponse.json(
          {
            error: 'INVALID_TRANSITION',
            message: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
          },
          { status: 422 },
        );
      }

      // Approval requires property_admin or board_member
      if (newStatus === 'approved' && !APPROVAL_ROLES.includes(auth.user.role)) {
        return NextResponse.json(
          {
            error: 'FORBIDDEN',
            message: 'Only property admins or board members can approve purchase orders',
          },
          { status: 403 },
        );
      }

      updateData.status = newStatus;

      if (newStatus === 'approved') {
        updateData.approvedById = auth.user.userId;
        updateData.approvedAt = new Date();
        if (input.approvalNotes) {
          updateData.approvalNotes = stripControlChars(stripHtml(input.approvalNotes));
        }
      }
    }

    // ------------------------------------------------------------------
    // Field updates (allowed on draft/submitted POs)
    // ------------------------------------------------------------------
    if (input.notes !== undefined) {
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;
    }
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    if (input.expectedDelivery !== undefined) {
      updateData.expectedDelivery = input.expectedDelivery
        ? new Date(input.expectedDelivery)
        : null;
    }
    if (input.budgetCategory !== undefined) {
      // Only allow category change on draft POs
      if (currentStatus !== 'draft') {
        return NextResponse.json(
          {
            error: 'FIELD_LOCKED',
            message: 'Budget category can only be changed on draft purchase orders.',
          },
          { status: 400 },
        );
      }
      updateData.budgetCategory = stripControlChars(stripHtml(input.budgetCategory));
    }
    if (input.vendorId !== undefined) {
      // Only allow vendor change on draft POs
      if (currentStatus !== 'draft') {
        return NextResponse.json(
          {
            error: 'FIELD_LOCKED',
            message: 'Vendor can only be changed on draft purchase orders.',
          },
          { status: 400 },
        );
      }
      updateData.vendorId = input.vendorId;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        vendor: { select: { id: true, companyName: true } },
        items: true,
        attachments: true,
      },
    });

    const message = isStatusChange
      ? `Purchase order ${po.referenceNumber} status changed to ${newStatus}.`
      : `Purchase order ${po.referenceNumber} updated.`;

    return NextResponse.json({ data: updated, message });
  } catch (error) {
    console.error('PATCH /api/v1/purchase-orders/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update purchase order' },
      { status: 500 },
    );
  }
}
