/**
 * Admin Lead Detail API — Get, update, or delete a single lead
 *
 * GET    /api/v1/admin/leads/:id  — Single lead detail
 * PATCH  /api/v1/admin/leads/:id  — Update status, notes, assignedTo
 * DELETE /api/v1/admin/leads/:id  — Hard delete
 *
 * Requires super_admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { createLogger } from '@/server/logger';

const logger = createLogger('admin:leads:detail');

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;

const UpdateLeadSchema = z
  .object({
    status: z.enum(VALID_STATUSES).optional(),
    notes: z.string().max(10000).optional(),
    assignedTo: z.string().uuid().nullable().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// GET — Single lead
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const lead = await prisma.salesLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (err) {
    logger.error({ err }, 'Failed to get lead');
    return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update lead
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.salesLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updated = await prisma.salesLead.update({
      where: { id },
      data: parsed.data,
    });

    logger.info({ leadId: id, changes: Object.keys(parsed.data) }, 'Lead updated');

    return NextResponse.json(updated);
  } catch (err) {
    logger.error({ err }, 'Failed to update lead');
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Hard delete
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.salesLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await prisma.salesLead.delete({ where: { id } });

    logger.info({ leadId: id }, 'Lead deleted');

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to delete lead');
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
