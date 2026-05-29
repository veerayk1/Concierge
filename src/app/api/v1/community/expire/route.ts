/**
 * Auto-expire Classified Ads — POST /api/v1/community/expire
 * Marks active ads older than 30 days as expired.
 * Intended to be called by a cron job or admin action.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

const EXPIRATION_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    // Restrict to admin roles + optional cron caller. Without this any
    // authenticated user (incl. residents) could mass-expire every ad on
    // every property by hitting this endpoint.
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');
    // Non-super-admins must scope to their own property — otherwise an admin
    // of Property A could expire Property B's ads.
    if (auth.user.role !== 'super_admin') {
      if (!propertyId) {
        return NextResponse.json(
          { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
          { status: 400 },
        );
      }
      const tenancy = enforcePropertyAccess(auth.user, propertyId);
      if (tenancy) return tenancy;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - EXPIRATION_DAYS);

    const where: { status: string; createdAt: { lte: Date }; propertyId?: string } = {
      status: 'active',
      createdAt: { lte: cutoff },
    };
    if (propertyId) where.propertyId = propertyId;

    const result = await prisma.classifiedAd.updateMany({
      where,
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
