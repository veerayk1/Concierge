/**
 * Incident Escalation API — per PRD 03 Section Incident Escalation
 * Escalate an incident to a higher authority
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const escalateSchema = z.object({
  escalateTo: z.string().min(1, 'Escalation target is required').max(200),
  reason: z.string().min(1, 'Reason is required').max(1000),
  priority: z.enum(['high', 'critical']).default('high'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = escalateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Update the event priority and status
    const event = await prisma.event.update({
      where: { id },
      data: {
        priority: input.priority,
        status: 'in_progress',
        customFields: {
          escalatedTo: input.escalateTo,
          escalationReason: input.reason,
          escalatedAt: new Date().toISOString(),
          escalatedBy: 'demo-user',
        },
      },
    });

    // TODO: Send notification to escalation target
    // TODO: Log escalation in event history

    return NextResponse.json({
      data: event,
      message: `Incident escalated to ${input.escalateTo}.`,
    });
  } catch (error) {
    console.error('POST /api/v1/incidents/:id/escalate error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to escalate' },
      { status: 500 },
    );
  }
}
