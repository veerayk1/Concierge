/**
 * Developer Webhook Detail — Get, Update, Delete
 * Per PRD 26 — Developer Portal & API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateWebhookSchema } from '@/schemas/developer';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/developer/webhooks/:id — Webhook detail
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const webhook = await prisma.webhook.findUnique({
      where: { id },
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

    if (!webhook) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Webhook not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: webhook });
  } catch (error) {
    console.error('GET /api/v1/developer/webhooks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch webhook' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/developer/webhooks/:id — Update webhook
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Webhook not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.url !== undefined) updateData.url = input.url;
    if (input.events !== undefined) updateData.events = input.events;
    if (input.status !== undefined) updateData.status = input.status;

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      data: webhook,
      message: 'Webhook updated.',
    });
  } catch (error) {
    console.error('PATCH /api/v1/developer/webhooks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update webhook' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/developer/webhooks/:id — Delete webhook
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Webhook not found' },
        { status: 404 },
      );
    }

    await prisma.webhook.delete({ where: { id } });

    return NextResponse.json({
      data: { id, deleted: true },
      message: 'Webhook deleted.',
    });
  } catch (error) {
    console.error('DELETE /api/v1/developer/webhooks/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete webhook' },
      { status: 500 },
    );
  }
}
