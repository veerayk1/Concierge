/**
 * Cross-Property Billing API
 * Per-property subscription tracking across all managed properties.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { userId } = auth.user;

    // Get all properties the user manages
    const userProperties = await prisma.userProperty.findMany({
      where: { userId, deletedAt: null },
    });
    const propertyIds = userProperties.map((up) => up.propertyId);

    // Get subscriptions for all managed properties
    const subscriptions = await prisma.subscription.findMany({
      where: { propertyId: { in: propertyIds } },
    });

    return NextResponse.json({ data: subscriptions });
  } catch (error) {
    console.error('GET /api/v1/properties/billing error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch billing info' },
      { status: 500 },
    );
  }
}
