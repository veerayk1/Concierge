/**
 * Debug Event Detail API
 *
 * GET  /api/v1/debug/events/[id]  — Fetch a single event with correlations (Super Admin only)
 * PATCH /api/v1/debug/events/[id] — Update status, tester note, or groupId (Super Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { getDebugEventWithCorrelations, updateDebugEvent } from '@/server/debug';
import { generateRequestId } from '@/server/middleware/request-id';
import type { DebugEventStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// GET — Fetch event with correlations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const event = await getDebugEventWithCorrelations(id);

    if (!event) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Debug event not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: event, requestId: generateRequestId() });
  } catch (error) {
    console.error('GET /api/v1/debug/events/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch debug event' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update status, tester note, or groupId
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    let body: { status?: string; testerNote?: string; groupId?: string; duplicateOf?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
        { status: 400 },
      );
    }

    const updates: {
      status?: DebugEventStatus;
      testerNote?: string | null;
      groupId?: string | null;
      duplicateOf?: string | null;
    } = {};

    if (body.status !== undefined) {
      updates.status = body.status as DebugEventStatus;
    }
    if ('testerNote' in body) {
      updates.testerNote = body.testerNote ?? null;
    }
    if ('groupId' in body) {
      updates.groupId = body.groupId ?? null;
    }
    if ('duplicateOf' in body) {
      updates.duplicateOf = body.duplicateOf ?? null;
    }

    const updated = await updateDebugEvent(id, updates);
    return NextResponse.json({ data: updated, requestId: generateRequestId() });
  } catch (error) {
    console.error('PATCH /api/v1/debug/events/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update debug event' },
      { status: 500 },
    );
  }
}
