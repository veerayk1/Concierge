/**
 * Device Push Token Registration
 *
 * POST   /api/v1/users/me/devices  — register or refresh a token
 * DELETE /api/v1/users/me/devices  — drop a specific token (sign-out)
 *
 * The mobile app (Expo) calls these on cold start and on sign-out
 * respectively. The web app does not use them — web push (if we ever
 * enable it) would use the same model but key off the user-agent
 * string instead of an APNs / FCM device token.
 *
 * Auth: every caller must be a signed-in user. We never write a
 * token without a userId — orphan tokens are unfindable spam.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

const PLATFORM = z.enum(['ios', 'android', 'web']);

const registerSchema = z.object({
  platform: PLATFORM,
  // Expo push tokens look like `ExponentPushToken[xxxxxxxx...]` and
  // can run ~50-150 chars. APNs raw tokens are 64 hex chars. FCM
  // raw tokens are longer. 500 is the schema column ceiling.
  token: z.string().min(20).max(500),
  deviceName: z.string().max(120).optional(),
});

const deleteSchema = z.object({
  token: z.string().min(20).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { allowDemo: false });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    // Upsert by token. If the same token was previously registered to
    // a DIFFERENT user (phone got handed off, two accounts on one
    // device) we overwrite — the token now belongs to whoever is
    // currently signed in on that device.
    const record = await prisma.devicePushToken.upsert({
      where: { token: input.token },
      update: {
        userId: auth.user.userId,
        platform: input.platform,
      },
      create: {
        userId: auth.user.userId,
        token: input.token,
        platform: input.platform,
      },
    });

    return NextResponse.json({
      data: { id: record.id, platform: record.platform, registeredAt: record.createdAt },
    });
  } catch (error) {
    console.error('POST /api/v1/users/me/devices error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to register device' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { allowDemo: false });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Only delete if the token belongs to the caller. Without this
    // gate, any signed-in user could nuke another user's device
    // registration by guessing or observing their token.
    const result = await prisma.devicePushToken.deleteMany({
      where: { token: parsed.data.token, userId: auth.user.userId },
    });

    if (result.count === 0) {
      // Idempotent — already gone or never registered. Tell the
      // client it's done either way; don't leak whether a token
      // existed for some other user.
      return NextResponse.json({ data: { deleted: 0 } });
    }

    return NextResponse.json({ data: { deleted: result.count } });
  } catch (error) {
    console.error('DELETE /api/v1/users/me/devices error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to unregister device' },
      { status: 500 },
    );
  }
}
