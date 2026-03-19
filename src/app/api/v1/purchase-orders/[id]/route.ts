/**
 * Purchase Orders API — Get, Update, Status Transitions
 * Per CLAUDE.md nice-to-have #4
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import {
  updatePurchaseOrderStatusSchema,
  PO_STATUS_TRANSITIONS,
  type POStatus,
} from '@/schemas/purchase-order';
import { guardRoute } from '@/server/middleware/api-guard';

const PO_ALLOWED_ROLES = ['property_admin', 'board_member', 'property_manager', 'super_admin'];
const APPROVAL_ROLES = ['property_admin', 'board_member', 'super_admin'];

// ---------------------------------------------------------------------------
// GET /api/v1/purchase-orders/[id]
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
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
// PATCH /api/v1/purchase-orders/[id] — Status transition
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!PO_ALLOWED_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions to update purchase orders' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updatePurchaseOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { status: newStatus, approvalNotes } = parsed.data;

    // Fetch current PO
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Purchase order not found' },
        { status: 404 },
      );
    }

    // Validate status transition
    const currentStatus = po.status as POStatus;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      status: newStatus,
      updatedById: auth.user.userId,
    };

    if (newStatus === 'approved') {
      updateData.approvedById = auth.user.userId;
      updateData.approvedAt = new Date();
      if (approvalNotes) updateData.approvalNotes = approvalNotes;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        vendor: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    return NextResponse.json({
      data: updated,
      message: `Purchase order ${po.referenceNumber} status changed to ${newStatus}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/purchase-orders/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update purchase order' },
      { status: 500 },
    );
  }
}
