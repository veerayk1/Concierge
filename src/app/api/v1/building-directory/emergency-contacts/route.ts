/**
 * Emergency Contacts API — Property-level emergency contacts
 *
 * Per Aquarius's model: emergency contacts are prominently featured,
 * 2 clicks to find fire dept, police, utilities. These are property-level
 * contacts (not resident emergency contacts).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createEmergencyContactSchema } from '@/schemas/building-directory';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/building-directory/emergency-contacts
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const contacts = await (prisma as any).propertyEmergencyContact.findMany({
      where: { propertyId },
      orderBy: { contactType: 'asc' },
    });

    return NextResponse.json({ data: contacts });
  } catch (error) {
    console.error('GET /api/v1/building-directory/emergency-contacts error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch emergency contacts' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/building-directory/emergency-contacts
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createEmergencyContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const contact = await (prisma as any).propertyEmergencyContact.create({
      data: {
        propertyId: input.propertyId,
        contactType: input.contactType,
        name: stripControlChars(stripHtml(input.name)),
        phone: input.phone,
        altPhone: input.altPhone || null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json(
      { data: contact, message: `Emergency contact ${contact.name} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/building-directory/emergency-contacts error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create emergency contact' },
      { status: 500 },
    );
  }
}
