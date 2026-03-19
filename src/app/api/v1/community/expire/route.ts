/**
 * Auto-expire Classified Ads — POST /api/v1/community/expire
 * Marks active ads older than 30 days as expired.
 * Intended to be called by a cron job or admin action.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

const EXPIRATION_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - EXPIRATION_DAYS);

    const result = await prisma.classifiedAd.updateMany({
      where: {
        status: 'active',
        createdAt: { lte: cutoff },
      },
      data: {
        status: 'expired',
      },
    });

    return NextResponse.json({
      data: { expiredCount: result.count },
      message: `${result.count} ad(s) expired.`,
    });
  } catch (error) {
    console.error('POST /api/v1/community/expire error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to expire ads' },
      { status: 500 },
    );
  }
}
