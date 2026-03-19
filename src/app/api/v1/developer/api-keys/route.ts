/**
 * Developer API Keys — List & Create
 * Per PRD 26 — Developer Portal & API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createApiKeySchema } from '@/schemas/developer';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

/**
 * Hash an API key using SHA-256 for storage.
 * We use SHA-256 rather than Argon2 for API keys because they're
 * already high-entropy random strings (not user-chosen passwords).
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Mask an API key for display: show prefix + first 4 chars + last 4 chars.
 * e.g., "conc_live_abc...wxyz"
 */
function maskApiKey(prefix: string): string {
  return `${prefix}...`;
}

// ---------------------------------------------------------------------------
// GET /api/v1/developer/api-keys — List API keys (masked)
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

    const maskedKeys = keys.map((key) => ({
      ...key,
      maskedKey: maskApiKey(key.keyPrefix),
    }));

    return NextResponse.json({ data: maskedKeys });
  } catch (error) {
    console.error('GET /api/v1/developer/api-keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch API keys' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/developer/api-keys — Create API key
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createApiKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Generate the full API key
    const rawKey = `conc_live_${nanoid(32)}`;
    const keyPrefix = rawKey.slice(0, 14); // "conc_live_" + first 4 chars
    const keyHash = hashApiKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        propertyId: input.propertyId,
        userId: auth.user.userId,
        name: stripControlChars(stripHtml(input.name)),
        keyPrefix,
        keyHash,
        permissions: { scopes: input.scopes },
        rateLimit: input.rateLimit ?? 1000,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    // Return the raw key ONCE — it will never be shown again
    return NextResponse.json(
      {
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: rawKey,
          scopes: input.scopes,
          rateLimit: apiKey.rateLimit,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        message: 'API key created. Save this key — it will not be shown again.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/developer/api-keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create API key' },
      { status: 500 },
    );
  }
}
