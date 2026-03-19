/**
 * Visitor Management API — per PRD 03 Section Visitor Management
 * Sign in, sign out, list active visitors
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const signInVisitorSchema = z.object({
  propertyId: z.string().uuid(),
  visitorName: z.string().min(1, 'Visitor name is required').max(200),
  unitId: z.string().uuid('Select a unit'),
  purpose: z.enum(['personal', 'delivery', 'service', 'realtor', 'other']).default('personal'),
  vehiclePlate: z.string().max(20).optional().or(z.literal('')),
  idType: z.string().max(50).optional(),
  idVerified: z.boolean().default(false),
  parkingAssigned: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
    };

    if (status === 'active') {
      where.departureAt = null;
    } else if (status === 'signed_out') {
      where.departureAt = { not: null };
    }

    if (search) {
      where.OR = [{ visitorName: { contains: search, mode: 'insensitive' } }];
    }

    const [visitors, total] = await Promise.all([
      prisma.visitorEntry.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.visitorEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: visitors,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch visitors' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = signInVisitorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const visitor = await prisma.visitorEntry.create({
      data: {
        propertyId: input.propertyId,
        visitorName: stripControlChars(stripHtml(input.visitorName)),
        unitId: input.unitId,
        visitorType: input.purpose,
        comments: input.notes
          ? stripControlChars(
              stripHtml(
                `${input.vehiclePlate ? `Vehicle: ${input.vehiclePlate}. ` : ''}${input.idType ? `ID: ${input.idType}${input.idVerified ? ' (verified)' : ''}. ` : ''}${input.notes}`,
              ),
            )
          : input.vehiclePlate
            ? `Vehicle: ${input.vehiclePlate}`
            : null,
      },
      include: {
        unit: { select: { number: true } },
      },
    });

    return NextResponse.json(
      {
        data: visitor,
        message: `${input.visitorName} signed in for Unit ${visitor.unit?.number}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to sign in visitor' },
      { status: 500 },
    );
  }
}
