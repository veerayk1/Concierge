/**
 * Key Detail — Get key detail, update status, decommission, mark lost
 * Per PRD 03 Key/FOB Management + Aquarius FOB lifecycle
 *
 * GET   /api/v1/keys/:id — Get key detail with checkout history
 * PATCH /api/v1/keys/:id — Update status, decommission, or mark lost
 *
 * Lost keys auto-create an incident report (security alert).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/keys/:id — Key detail with checkout history
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const key = await prisma.keyInventory.findUnique({
      where: { id },
      include: {
        checkouts: {
          orderBy: { checkoutTime: 'desc' },
          take: 20,
          select: {
            id: true,
            checkedOutTo: true,
            company: true,
            unitId: true,
            idType: true,
            reason: true,
            checkoutTime: true,
            expectedReturn: true,
            returnTime: true,
            conditionNotes: true,
          },
        },
      },
    });

    if (!key) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Key not found' }, { status: 404 });
    }

    // Compute active checkout and overdue status
    const activeCheckout = key.checkouts.find((c) => !c.returnTime) || null;
    const isOverdue = activeCheckout?.expectedReturn
      ? new Date(activeCheckout.expectedReturn) < new Date()
      : false;

    return NextResponse.json({
      data: {
        ...key,
        activeCheckout,
        isOverdue,
        totalCheckouts: key.checkouts.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/keys/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch key' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/keys/:id — Update status, decommission, mark lost
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    if (body.action === 'decommission') {
      const key = await prisma.keyInventory.update({
        where: { id },
        data: {
          status: 'decommissioned',
          decommissionReason: body.reason || null,
          decommissionedAt: new Date(),
        },
      });

      return NextResponse.json({ data: key, message: `Key ${key.keyName} decommissioned.` });
    }

    if (body.action === 'lost') {
      const key = await prisma.keyInventory.update({
        where: { id },
        data: { status: 'lost' },
      });

      // Auto-create incident report (security alert) for lost keys
      await prisma.incidentReport.create({
        data: {
          propertyId: key.propertyId,
          incidentTypeId: '00000000-0000-4000-b000-000000000000', // system default "lost_key" type
          title: `Lost Key: ${key.keyName}`,
          reportBody: `Key "${key.keyName}" (category: ${key.category}) has been reported as lost. ${body.reportedBy ? `Reported by: ${body.reportedBy}.` : ''} Immediate review recommended.`,
          timeOccurred: new Date(),
          urgency: true,
          reportedBy: body.reportedBy || null,
        },
      });

      return NextResponse.json({
        data: key,
        message: `Key ${key.keyName} marked as lost. Security alert created.`,
      });
    }

    // Generic update
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined)
      updateData.notes = body.notes ? stripControlChars(stripHtml(body.notes)) : null;
    if (body.keyOwner !== undefined)
      updateData.keyOwner = body.keyOwner ? stripControlChars(stripHtml(body.keyOwner)) : null;

    const key = await prisma.keyInventory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: key, message: 'Key updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/keys/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update key' },
      { status: 500 },
    );
  }
}
