/**
 * Notification Templates API — per PRD 09 + 16
 * Manage email/SMS/push notification templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createTemplateSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  channel: z.enum(['email', 'sms', 'push', 'voice']),
  triggerAction: z.enum(['on_create', 'on_close', 'on_update', 'scheduled']),
  triggerEventTypeId: z.string().uuid().nullable().optional(),
  triggerSystemEvent: z.string().max(50).nullable().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const channel = url.searchParams.get('channel') ?? url.searchParams.get('type');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId };
    if (channel) {
      where.channel = channel;
    }

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('GET /api/v1/notifications/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch templates' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        propertyId: parsed.data.propertyId,
        name: parsed.data.name,
        channel: parsed.data.channel,
        triggerAction: parsed.data.triggerAction,
        triggerEventTypeId: parsed.data.triggerEventTypeId ?? null,
        triggerSystemEvent: parsed.data.triggerSystemEvent ?? null,
        subject: parsed.data.subject ?? null,
        body: parsed.data.body,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({ data: template, message: 'Template created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/notifications/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create template' },
      { status: 500 },
    );
  }
}
