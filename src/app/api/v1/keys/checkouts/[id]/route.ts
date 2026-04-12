/**
 * Key Checkout Detail — Return a key
 * Per PRD 03 Key/FOB Management lifecycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    if (body.action === 'return') {
      // Find the checkout
      const checkout = await prisma.keyCheckout.findUnique({ where: { id } });

      if (!checkout) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Checkout record not found.' },
          { status: 404 },
        );
      }

      // Prevent double-return
      if (checkout.returnTime) {
        return NextResponse.json(
          { error: 'ALREADY_RETURNED', message: 'This key has already been returned.' },
          { status: 409 },
        );
      }

      // Close the checkout
      const updated = await prisma.keyCheckout.update({
        where: { id },
        data: {
          returnTime: new Date(),
          returnedToId: auth.user.userId,
          conditionNotes: body.conditionNotes || null,
        },
      });

      // Restore key status
      await prisma.keyInventory.update({
        where: { id: checkout.keyId },
        data: { status: 'available' },
      });

      return NextResponse.json({
        data: updated,
        message: 'Key returned successfully.',
      });
    }

    return NextResponse.json(
      { error: 'INVALID_ACTION', message: 'Supported actions: return' },
      { status: 400 },
    );
  } catch (error) {
    console.error('PATCH /api/v1/keys/checkouts/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update checkout' },
      { status: 500 },
    );
  }
}
