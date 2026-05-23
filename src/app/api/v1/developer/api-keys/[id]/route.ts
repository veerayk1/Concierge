/**
 * Developer API Key Detail — Revoke (DELETE)
 * Per PRD 26 — Developer Portal & API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';

// ---------------------------------------------------------------------------
// DELETE /api/v1/developer/api-keys/:id — Revoke API key
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // API key revocation is a property_admin operation. Without this gate
    // any logged-in resident could revoke any API key on the platform by
    // guessing the UUID, DoSing every customer's integrations.
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid API key id.' },
        { status: 400 },
      );
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'API key not found' },
        { status: 404 },
      );
    }

    // Cross-tenant: even with the role gate, a property_admin at A must
    // not revoke Property B's keys.
    const tenancy = enforcePropertyAccess(auth.user, apiKey.propertyId);
    if (tenancy) return tenancy;

    if (apiKey.revokedAt) {
      return NextResponse.json(
        { error: 'ALREADY_REVOKED', message: 'API key is already revoked' },
        { status: 400 },
      );
    }

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      data: { id, revoked: true },
      message: 'API key revoked successfully.',
    });
  } catch (error) {
    console.error('DELETE /api/v1/developer/api-keys/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to revoke API key' },
      { status: 500 },
    );
  }
}
