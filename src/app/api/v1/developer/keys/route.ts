/**
 * API Keys Management — List, Generate & Revoke
 * Per PRD 26 — Developer Portal & API
 *
 * GET    /api/v1/developer/keys — List API keys (masked, prefix only)
 * POST   /api/v1/developer/keys — Generate new API key
 * DELETE /api/v1/developer/keys — Revoke API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createApiKeySchema } from '@/schemas/developer';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { randomBytes, createHash } from 'crypto';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

// ---------------------------------------------------------------------------
// GET /api/v1/developer/keys — List API keys (masked)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const keys = await prisma.apiKey.findMany({
      where: { propertyId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Return only the prefix for display (e.g., "conc_live_a3b8...")
    const masked = keys.map((key) => ({
      ...key,
      maskedKey: `${key.keyPrefix}...`,
    }));

    return NextResponse.json({ data: masked });
  } catch (error) {
    console.error('GET /api/v1/developer/keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch API keys' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/developer/keys — Generate new API key
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createApiKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Sanitize the key name
    const sanitizedName = stripControlChars(stripHtml(input.name));

    // Generate the full API key: conc_live_ + 32-char random hex
    const randomHex = randomBytes(16).toString('hex'); // 32 hex chars
    const fullKey = `conc_live_${randomHex}`;
    const keyPrefix = fullKey.substring(0, 18); // "conc_live_" + first 8 hex chars

    // Store hashed version (SHA-256) — the full key is never stored
    const keyHash = createHash('sha256').update(fullKey).digest('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        propertyId: input.propertyId,
        userId: auth.user.userId,
        name: sanitizedName,
        keyPrefix,
        keyHash,
        permissions: { scopes: input.scopes },
        rateLimit: input.rateLimit,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    // Return the FULL key only on creation — it will never be shown again
    return NextResponse.json(
      {
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: fullKey,
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
          rateLimit: apiKey.rateLimit,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        message: 'API key created. Save the key — it will not be shown again.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/developer/keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create API key' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/developer/keys — Revoke API key
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'API key id is required' },
        { status: 400 },
      );
    }

    // Verify key exists and is not already revoked
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'API key not found' },
        { status: 404 },
      );
    }

    if (existing.revokedAt) {
      return NextResponse.json(
        { error: 'ALREADY_REVOKED', message: 'API key is already revoked' },
        { status: 409 },
      );
    }

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('DELETE /api/v1/developer/keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to revoke API key' },
      { status: 500 },
    );
  }
}
