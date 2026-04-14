/**
 * User Sessions API — per PRD 08 Section 3.1.9
 * View and manage active sessions for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Users can view their own sessions; admins can view anyone's
    const isAdmin = ['super_admin', 'property_admin'].includes(auth.user.role);
    if (!isAdmin && auth.user.userId !== id) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceFingerprint: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    return NextResponse.json({
      data: sessions.map((s) => ({
        id: s.id,
        device: parseUserAgent(s.userAgent),
        ipAddress: s.ipAddress,
        lastActive: s.lastActiveAt,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/v1/users/:id/sessions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }
}

// Revoke a specific session or all sessions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: userId } = await params;

    // Users can revoke their own sessions; admins can revoke anyone's
    const isAdmin = ['super_admin', 'property_admin'].includes(auth.user.role);
    if (!isAdmin && auth.user.userId !== userId) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Revoke specific session
      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      return NextResponse.json({ message: 'Session revoked.' });
    }

    // Revoke all sessions for user
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ message: `${result.count} sessions revoked.` });
  } catch (error) {
    console.error('DELETE /api/v1/users/:id/sessions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to revoke sessions' },
      { status: 500 },
    );
  }
}

function parseUserAgent(ua: string): string {
  if (ua.includes('Chrome') && ua.includes('Mac')) return 'Chrome on macOS';
  if (ua.includes('Chrome') && ua.includes('Windows')) return 'Chrome on Windows';
  if (ua.includes('Safari') && ua.includes('iPhone')) return 'Safari on iPhone';
  if (ua.includes('Safari') && ua.includes('Mac')) return 'Safari on macOS';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return ua.substring(0, 50);
}
