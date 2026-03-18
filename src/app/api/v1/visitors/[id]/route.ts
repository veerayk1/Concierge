/**
 * Visitor Detail — Sign out a visitor
 * Per PRD 03 Visitor Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const visitor = await prisma.visitorEntry.findUnique({
      where: { id, deletedAt: null },
      include: { unit: { select: { id: true, number: true } } },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Visitor not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: visitor });
  } catch (error) {
    console.error('GET /api/v1/visitors/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch visitor' },
      { status: 500 },
    );
  }
}

// Sign out visitor
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const visitor = await prisma.visitorEntry.findUnique({ where: { id } });
    if (!visitor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Visitor not found' },
        { status: 404 },
      );
    }

    if (visitor.signedOutAt) {
      return NextResponse.json(
        { error: 'ALREADY_SIGNED_OUT', message: 'Visitor already signed out' },
        { status: 400 },
      );
    }

    const updated = await prisma.visitorEntry.update({
      where: { id },
      data: {
        signedOutAt: new Date(),
        signedOutById: 'demo-user',
      },
    });

    return NextResponse.json({ data: updated, message: `${visitor.visitorName} signed out.` });
  } catch (error) {
    console.error('PATCH /api/v1/visitors/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to sign out visitor' },
      { status: 500 },
    );
  }
}
