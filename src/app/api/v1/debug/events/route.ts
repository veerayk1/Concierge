/**
 * Debug Events API
 *
 * POST /api/v1/debug/events  — Create a debug event (client or server)
 * GET  /api/v1/debug/events  — List debug events (Super Admin only)
 *
 * The POST endpoint accepts requests from:
 * - Authenticated users (any role) — error captured with userId/propertyId
 * - Unauthenticated contexts (pre-login errors) — userId/propertyId will be null
 *
 * Errors in this endpoint are intentionally not captured by the debug layer
 * (recursion guard in captureServerDebugEvent checks the path).
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { createDebugEvent, queryDebugEvents, type CreateDebugEventInput } from '@/server/debug';
import { generateRequestId } from '@/server/middleware/request-id';
import type { DebugEventType, DebugSeverity, DebugEventStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// POST — Create a debug event
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Auth is best-effort — we still capture events without a valid session
    // (e.g. errors that happen before login completes)
    const auth = await guardRoute(request, { roles: [] });
    // Note: auth.error means unauthenticated — that's OK for this endpoint
    // We still process the event, just without userId/propertyId from token

    let body: Partial<CreateDebugEventInput>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!body.type || !body.source || !body.title) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'type, source, and title are required' },
        { status: 400 },
      );
    }

    // Merge auth context with body (auth overrides client-provided userId for security)
    const input: CreateDebugEventInput = {
      type: body.type as DebugEventType,
      source: body.source as 'client' | 'server',
      severity: body.severity as DebugSeverity | undefined,
      sessionId: body.sessionId ?? null,
      requestId: body.requestId ?? null,
      traceId: body.traceId ?? null,
      // If authenticated, use verified token values; otherwise trust client values
      userId: auth.user ? auth.user.userId : (body.userId ?? null),
      propertyId: auth.user ? auth.user.propertyId : (body.propertyId ?? null),
      userRole: auth.user ? auth.user.role : (body.userRole ?? null),
      route: body.route ?? null,
      module: body.module ?? null,
      title: String(body.title).slice(0, 200),
      description: body.description ?? null,
      errorCode: body.errorCode ?? null,
      errorMessage: body.errorMessage ?? null,
      // Stack traces only in non-production
      stackTrace: process.env['NODE_ENV'] !== 'production' ? (body.stackTrace ?? null) : null,
      context: body.context ?? null,
      actionTrail: Array.isArray(body.actionTrail) ? body.actionTrail : null,
      testerNote: body.testerNote ?? null,
      isManualFlag: body.isManualFlag ?? false,
      environment: body.environment ?? process.env['NODE_ENV'] ?? 'development',
    };

    const id = await createDebugEvent(input);

    return NextResponse.json({ data: { id }, requestId: generateRequestId() }, { status: 201 });
  } catch (error) {
    // Intentionally minimal error handling — do not capture this in debug layer
    console.error('POST /api/v1/debug/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create debug event' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET — List debug events (Super Admin only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);

    const severity = searchParams.get('severity') as DebugSeverity | null;
    const module = searchParams.get('module');
    const status = searchParams.get('status');
    const sessionId = searchParams.get('sessionId');
    const requestId = searchParams.get('requestId');
    const fingerprint = searchParams.get('fingerprint');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '50', 10), 100);

    const result = await queryDebugEvents({
      severity: severity ?? undefined,
      module: module ?? undefined,
      status: status ? (status as DebugEventStatus) : undefined,
      sessionId: sessionId ?? undefined,
      requestId: requestId ?? undefined,
      fingerprint: fingerprint ?? undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      pageSize,
    });

    return NextResponse.json({ ...result, requestId: generateRequestId() });
  } catch (error) {
    console.error('GET /api/v1/debug/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch debug events' },
      { status: 500 },
    );
  }
}
