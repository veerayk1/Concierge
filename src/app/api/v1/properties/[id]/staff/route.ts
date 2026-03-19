/**
 * Property Staff Assignment API
 * Assign/unassign staff to specific properties.
 * Supports multi-property staff (one user, multiple properties).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id: propertyId } = await params;
    const body = await request.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'userId and roleId are required' },
        { status: 400 },
      );
    }

    // Check for existing assignment
    const existing = await prisma.userProperty.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'User is already assigned to this property' },
        { status: 409 },
      );
    }

    const assignment = await prisma.userProperty.create({
      data: { userId, propertyId, roleId },
    });

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/properties/:id/staff error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to assign staff' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id: propertyId } = await params;

    const assignments = await prisma.userProperty.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ data: assignments });
  } catch (error) {
    console.error('GET /api/v1/properties/:id/staff error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch staff' },
      { status: 500 },
    );
  }
}
