/**
 * Debug endpoint to test what crashes on Vercel
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Production guard — block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SYSTEM_ROUTES) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const results: Record<string, string> = {};

  // Test 1: Prisma import
  try {
    const { prisma } = await import('@/server/db');
    const count = await prisma.property.count();
    results['prisma'] = `OK (${count} properties)`;
  } catch (e: unknown) {
    results['prisma'] = `FAIL: ${(e as Error).message}`;
  }

  // Test 2: Guard route import
  try {
    const { guardRoute } = await import('@/server/middleware/api-guard');
    results['guardRoute'] = 'OK (imported)';

    // Test calling it
    const auth = await guardRoute(request);
    if (auth.error) {
      results['guardResult'] = `Auth error: ${auth.error.status}`;
    } else {
      results['guardResult'] =
        `OK: userId=${auth.user.userId}, role=${auth.user.role}, propertyId=${auth.user.propertyId}`;
    }
  } catch (e: unknown) {
    results['guardRoute'] = `FAIL: ${(e as Error).message}`;
  }

  // Test 3: Sanitize import
  try {
    const { stripHtml } = await import('@/lib/sanitize');
    results['sanitize'] = `OK: ${stripHtml('<b>test</b>')}`;
  } catch (e: unknown) {
    results['sanitize'] = `FAIL: ${(e as Error).message}`;
  }

  // Test 4: Password/argon2 import
  try {
    const { hashPassword } = await import('@/server/auth/password');
    results['argon2'] = 'OK (imported, not called)';
  } catch (e: unknown) {
    results['argon2'] = `FAIL: ${(e as Error).message}`;
  }

  return NextResponse.json({ results });
}
