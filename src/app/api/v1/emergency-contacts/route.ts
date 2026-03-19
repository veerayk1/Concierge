/**
 * Emergency Contacts API — per PRD 07 + Aquarius emergency contacts
 * CRUD for emergency contacts per unit/resident
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createContactSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  userId: z.string().uuid(),
  contactName: z.string().min(1, 'Name is required').max(100),
  relationship: z.string().min(1).max(50),
  phonePrimary: z.string().min(1, 'Phone is required').max(20),
  phoneSecondary: z.string().max(20).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  sortOrder: z.number().int().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const unitId = new URL(request.url).searchParams.get('unitId');

    if (!unitId) {
      return NextResponse.json(
        { error: 'MISSING_UNIT', message: 'unitId is required' },
        { status: 400 },
      );
    }

    const contacts = await prisma.emergencyContact.findMany({
      where: { unitId },
      orderBy: [{ sortOrder: 'asc' }, { contactName: 'asc' }],
    });

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error('GET /api/v1/emergency-contacts error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch contacts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const contact = await prisma.emergencyContact.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        userId: input.userId,
        contactName: stripControlChars(stripHtml(input.contactName)),
        relationship: input.relationship,
        phonePrimary: input.phonePrimary,
        phoneSecondary: input.phoneSecondary || null,
        email: input.email || null,
        sortOrder: input.sortOrder,
      },
    });
    return NextResponse.json(
      { data: contact, message: 'Emergency contact added.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/emergency-contacts error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add contact' },
      { status: 500 },
    );
  }
}
