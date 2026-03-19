/**
 * Event Type Email Configuration API — per PRD 03 + 16
 *
 * GET  — Get email config for a specific event type at a property
 * POST — Create or update (upsert) email config for an event type
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const emailConfigSchema = z
  .object({
    propertyId: z.string().uuid(),
    eventTypeId: z.string().uuid(),
    fromAddress: z.string().max(254).optional().nullable(),
    fromName: z.string().max(100).optional().nullable(),
    autoCcAddresses: z.array(z.string()).default([]),
    replyToAddress: z.string().max(254).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate fromAddress if provided
    if (data.fromAddress && !isValidEmail(data.fromAddress)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid email address',
        path: ['fromAddress'],
      });
    }

    // Validate replyToAddress if provided
    if (data.replyToAddress && !isValidEmail(data.replyToAddress)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid email address',
        path: ['replyToAddress'],
      });
    }

    // Validate each autoCcAddress
    if (data.autoCcAddresses && data.autoCcAddresses.length > 0) {
      data.autoCcAddresses.forEach((addr, index) => {
        if (!isValidEmail(addr)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid email address at index ${index}`,
            path: ['autoCcAddresses', index],
          });
        }
      });
    }

    // Limit auto-CC list to 10 addresses
    if (data.autoCcAddresses && data.autoCcAddresses.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 10 auto-CC addresses allowed',
        path: ['autoCcAddresses'],
      });
    }
  });

// ---------------------------------------------------------------------------
// GET /api/v1/event-types/email-config
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const eventTypeId = searchParams.get('eventTypeId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!eventTypeId) {
      return NextResponse.json(
        { error: 'MISSING_EVENT_TYPE', message: 'eventTypeId is required' },
        { status: 400 },
      );
    }

    const config = await prisma.eventTypeEmailConfig.findUnique({
      where: {
        propertyId_eventTypeId: {
          propertyId,
          eventTypeId,
        },
      },
      include: {
        eventType: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Email config not found for this event type' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('GET /api/v1/event-types/email-config error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch email config' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/event-types/email-config — Create or Update (Upsert)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = emailConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const config = await prisma.eventTypeEmailConfig.upsert({
      where: {
        propertyId_eventTypeId: {
          propertyId: data.propertyId,
          eventTypeId: data.eventTypeId,
        },
      },
      create: {
        propertyId: data.propertyId,
        eventTypeId: data.eventTypeId,
        fromAddress: data.fromAddress || null,
        fromName: data.fromName || null,
        autoCcAddresses: data.autoCcAddresses,
        replyToAddress: data.replyToAddress || null,
        isActive: true,
      },
      update: {
        fromAddress: data.fromAddress || null,
        fromName: data.fromName || null,
        autoCcAddresses: data.autoCcAddresses,
        replyToAddress: data.replyToAddress || null,
      },
    });

    return NextResponse.json({ data: config, message: 'Email config saved.' }, { status: 200 });
  } catch (error) {
    console.error('POST /api/v1/event-types/email-config error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to save email config' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/v1/event-types/email-config — Alias for POST (explicit update)
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  return POST(request);
}
