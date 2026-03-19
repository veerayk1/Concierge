/**
 * Developer API Key Detail — Revoke (DELETE)
 * Per PRD 26 — Developer Portal & API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// DELETE /api/v1/developer/api-keys/:id — Revoke API key
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'API key not found' },
        { status: 404 },
      );
    }

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
