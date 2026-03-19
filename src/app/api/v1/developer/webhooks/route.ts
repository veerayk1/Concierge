/**
 * Developer Webhooks — List, Register, Update & Remove
 * Per PRD 26 — Developer Portal & API
 *
 * GET    /api/v1/developer/webhooks — List registered webhooks
 * POST   /api/v1/developer/webhooks — Register webhook endpoint
 * PATCH  /api/v1/developer/webhooks — Update webhook (url, events, pause/resume)
 * DELETE /api/v1/developer/webhooks — Remove webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createWebhookSchema, updateWebhookSchema } from '@/schemas/developer';
import { guardRoute } from '@/server/middleware/api-guard';
import { sanitizeUrl } from '@/lib/sanitize';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// GET /api/v1/developer/webhooks — List registered webhooks
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

    const webhooks = await prisma.webhook.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        lastDeliveryAt: true,
        failureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: webhooks });
  } catch (error) {
    console.error('GET /api/v1/developer/webhooks error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch webhooks' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/developer/webhooks — Register webhook endpoint
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Generate a shared secret for HMAC signatures
    const secret = `whsec_${nanoid(32)}`;
    const secretHash = createHash('sha256').update(secret).digest('hex');

    const webhook = await prisma.webhook.create({
      data: {
        propertyId: input.propertyId,
        url: input.url,
        events: input.events,
        secretHash,
        status: 'active',
      },
    });

    // Return the secret ONCE — it will never be shown again
    return NextResponse.json(
      {
        data: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          secret,
          status: webhook.status,
          createdAt: webhook.createdAt,
        },
        message: 'Webhook registered. Save the secret — it will not be shown again.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/developer/webhooks error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to register webhook' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/developer/webhooks — Update webhook (url, events, pause/resume)
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, ...rest } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Webhook id is required' },
        { status: 400 },
      );
    }

    const parsed = updateWebhookSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Verify webhook exists and belongs to the caller's property
    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Webhook not found' },
        { status: 404 },
      );
    }

    // Sanitize URL if provided
    if (input.url) {
      const sanitized = sanitizeUrl(input.url);
      if (!sanitized) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Invalid or blocked webhook URL' },
          { status: 400 },
        );
      }
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(input.url && { url: input.url }),
        ...(input.events && { events: input.events }),
        ...(input.status && { status: input.status }),
      },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        lastDeliveryAt: true,
        failureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: webhook });
  } catch (error) {
    console.error('PATCH /api/v1/developer/webhooks error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update webhook' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/developer/webhooks — Remove webhook
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Webhook id is required' },
        { status: 400 },
      );
    }

    // Verify webhook exists
    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Webhook not found' },
        { status: 404 },
      );
    }

    await prisma.webhook.delete({ where: { id } });

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/v1/developer/webhooks error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete webhook' },
      { status: 500 },
    );
  }
}
