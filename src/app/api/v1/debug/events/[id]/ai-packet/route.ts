/**
 * GET /api/v1/debug/events/[id]/ai-packet
 *
 * Returns a structured AI context bundle for a debug event:
 * - Full event details
 * - Correlated events (same request, same session, recurrence count)
 * - Suggested files to read
 * - Ready-to-paste claudePrompt markdown
 *
 * Super Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { buildAiPacket } from '@/server/debug';
import { generateRequestId } from '@/server/middleware/request-id';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const packet = await buildAiPacket(id);

    if (!packet) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Debug event not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: packet, requestId: generateRequestId() });
  } catch (error) {
    console.error('GET /api/v1/debug/events/[id]/ai-packet error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to build AI packet' },
      { status: 500 },
    );
  }
}
