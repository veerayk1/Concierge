/**
 * Billing API — GET subscription status
 *
 * Returns the current subscription for a property, including tier,
 * status, billing cycle, and period dates.
 *
 * Per PRD 24: Billing & Subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        {
          error: 'MISSING_PROPERTY',
          message: 'propertyId is required',
          code: 'MISSING_PROPERTY',
          requestId: '',
        },
        { status: 400 },
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          data: {
            status: 'none',
            tier: null,
            propertyId,
          },
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        data: {
          id: subscription.id,
          propertyId: subscription.propertyId,
          tier: subscription.tier.toLowerCase(),
          status: subscription.status.toLowerCase(),
          billingCycle: subscription.billingCycle,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          canceledAt: subscription.canceledAt,
          trialEndsAt: subscription.trialEndsAt,
        },
        requestId: request.headers.get('X-Request-ID') || '',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /billing error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch subscription',
        code: 'INTERNAL_ERROR',
        requestId: '',
      },
      { status: 500 },
    );
  }
}
