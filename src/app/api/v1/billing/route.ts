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
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import {
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
  TIER_PRICE_IDS,
  TIER_FEATURES,
  checkDowngradeRestrictions,
} from '@/server/billing';

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

    // Fetch usage data for the property
    const [unitCount, userCount] = await Promise.all([
      prisma.unit.count({ where: { propertyId } }),
      prisma.userProperty.count({ where: { propertyId, deletedAt: null } }),
    ]);

    const tierKey = subscription.tier.toLowerCase();
    const tierLimits = TIER_FEATURES[tierKey] ?? { maxUnits: 0, maxUsers: 0, features: [] };

    // Price per unit per month (cents)
    const pricePerUnit: Record<string, number> = {
      starter: 400,
      professional: 800,
      enterprise: 0, // custom pricing
    };

    return NextResponse.json(
      {
        data: {
          id: subscription.id,
          propertyId: subscription.propertyId,
          tier: tierKey,
          status: subscription.status.toLowerCase(),
          billingCycle: subscription.billingCycle,
          price: pricePerUnit[tierKey] ?? 0,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextBillingDate: subscription.currentPeriodEnd,
          canceledAt: subscription.canceledAt,
          trialEndsAt: subscription.trialEndsAt,
          usage: {
            unitCount,
            userCount,
            maxUnits: tierLimits.maxUnits === Infinity ? null : tierLimits.maxUnits,
            maxUsers: tierLimits.maxUsers === Infinity ? null : tierLimits.maxUsers,
            features: tierLimits.features,
          },
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

// ---------------------------------------------------------------------------
// POST — Create checkout session (tier, billingPeriod)
// ---------------------------------------------------------------------------

const checkoutSchema = z.object({
  propertyId: z.string().uuid(),
  tier: z.enum(['starter', 'professional', 'enterprise']),
  billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const rawBody: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 400 },
      );
    }

    const { propertyId, tier, billingPeriod, successUrl, cancelUrl, customerEmail } = parsed.data;

    // Check if property already has an active subscription
    const existing = await prisma.subscription.findFirst({
      where: { propertyId, status: { in: ['ACTIVE', 'TRIAL'] } },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'ACTIVE_SUBSCRIPTION_EXISTS',
          message: 'Property already has an active subscription. Use PATCH to change plans.',
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 409 },
      );
    }

    if (!TIER_PRICE_IDS[tier]) {
      return NextResponse.json(
        {
          error: 'INVALID_TIER',
          message: `Unknown subscription tier: ${tier}`,
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 400 },
      );
    }

    const session = await createCheckoutSession({
      propertyId,
      tier,
      successUrl,
      cancelUrl,
      customerEmail,
    });

    return NextResponse.json(
      {
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
          tier,
          billingPeriod,
        },
        requestId: request.headers.get('X-Request-ID') || '',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /billing error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create checkout session',
        requestId: '',
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update subscription (upgrade, downgrade, cancel)
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  propertyId: z.string().uuid(),
  action: z.enum(['upgrade', 'downgrade', 'cancel', 'reactivate']),
  targetTier: z.enum(['starter', 'professional', 'enterprise']).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const rawBody: unknown = await request.json();
    const parsed = updateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 400 },
      );
    }

    const { propertyId, action, targetTier } = parsed.data;

    const subscription = await prisma.subscription.findFirst({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'NO_SUBSCRIPTION',
          message: 'No subscription found for this property',
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 404 },
      );
    }

    // Handle cancel
    if (action === 'cancel') {
      if (subscription.status === 'CANCELED') {
        return NextResponse.json(
          {
            error: 'ALREADY_CANCELLED',
            message: 'Subscription is already cancelled',
            requestId: request.headers.get('X-Request-ID') || '',
          },
          { status: 400 },
        );
      }

      if (subscription.stripeSubscriptionId) {
        await cancelSubscription(subscription.stripeSubscriptionId);
      }

      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      return NextResponse.json({
        data: { id: updated.id, status: 'canceled', canceledAt: updated.canceledAt },
        message: 'Subscription cancelled. Access continues until end of billing period.',
        requestId: request.headers.get('X-Request-ID') || '',
      });
    }

    // Handle reactivate
    if (action === 'reactivate') {
      if (subscription.status !== 'CANCELED') {
        return NextResponse.json(
          {
            error: 'NOT_CANCELLED',
            message: 'Subscription is not cancelled',
            requestId: request.headers.get('X-Request-ID') || '',
          },
          { status: 400 },
        );
      }

      if (subscription.stripeSubscriptionId) {
        await reactivateSubscription(subscription.stripeSubscriptionId);
      }

      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          canceledAt: null,
        },
      });

      return NextResponse.json({
        data: { id: updated.id, status: 'active' },
        message: 'Subscription reactivated.',
        requestId: request.headers.get('X-Request-ID') || '',
      });
    }

    // Handle upgrade / downgrade
    if (!targetTier) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'targetTier is required for upgrade/downgrade',
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 400 },
      );
    }

    const currentTier = subscription.tier.toLowerCase();
    if (currentTier === targetTier) {
      return NextResponse.json(
        {
          error: 'SAME_TIER',
          message: `Already on the ${targetTier} plan`,
          requestId: request.headers.get('X-Request-ID') || '',
        },
        { status: 400 },
      );
    }

    // For downgrades, check usage restrictions
    if (action === 'downgrade') {
      const [unitCount, userCount] = await Promise.all([
        prisma.unit.count({ where: { propertyId } }),
        prisma.userProperty.count({ where: { propertyId, deletedAt: null } }),
      ]);

      const currentFeatures = TIER_FEATURES[currentTier]?.features ?? [];
      const restrictions = checkDowngradeRestrictions(currentTier, targetTier, {
        unitCount,
        userCount,
        features: currentFeatures,
      });

      if (!restrictions.allowed) {
        return NextResponse.json(
          {
            error: 'DOWNGRADE_RESTRICTED',
            message: 'Cannot downgrade due to current usage',
            reasons: restrictions.reasons,
            requestId: request.headers.get('X-Request-ID') || '',
          },
          { status: 400 },
        );
      }
    }

    // Update the subscription tier in our database
    const tierEnum = targetTier.toUpperCase() as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { tier: tierEnum },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        previousTier: currentTier,
        newTier: targetTier,
        status: updated.status.toLowerCase(),
      },
      message: `Subscription ${action}d to ${targetTier}.`,
      requestId: request.headers.get('X-Request-ID') || '',
    });
  } catch (error) {
    console.error('PATCH /billing error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to update subscription',
        requestId: '',
      },
      { status: 500 },
    );
  }
}
