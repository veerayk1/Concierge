/**
 * DEV ONLY: Run raw SQL and utility operations for testing.
 * DO NOT deploy to production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.action === 'run-sql') {
      const result = await prisma.$executeRawUnsafe(body.sql);
      return NextResponse.json({ data: { affected: result } });
    }

    if (body.action === 'query-sql') {
      const result = await prisma.$queryRawUnsafe(body.sql);
      return NextResponse.json({ data: result });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('DEV API error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: String(error) }, { status: 500 });
  }
}
