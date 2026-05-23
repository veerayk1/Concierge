/**
 * Billing Checkout API — POST create checkout session
 *
 * Creates a Stripe Checkout session and returns the URL for redirect.
 * Supports subscription creation for all 3 tiers.
 *
 * Per PRD 24: Billing & Subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { createCheckoutSession, TIER_PRICE_IDS } from '@/server/billing';

const checkoutSchema = z.object({
  propertyId: z.string().uuid(),
  tier: z.enum(['starter', 'professional', 'enterprise']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // SEC-142 CRITICAL: checkout creation is a financial action — only
    // billing-authorized roles may initiate it. Previously the handler
    // had no role gate beyond authenticated AND no tenancy check on
    // body.propertyId, so a resident at Property A could create a
    // Stripe checkout that charges Property A's card to upgrade
    // Property B's subscription. Or downgrade B's subscription to
    // starter. Or just spam-create checkout sessions across every
    // property in the system.
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin'],
    });
    if (auth.error) return auth.error;

    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid checkout request',
          code: 'VALIDATION_ERROR',
          requestId: request.headers.get('X-Request-ID') || '',
          fields: parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { propertyId, tier, successUrl, cancelUrl, customerEmail } = parsed.data;

    // Cross-tenant: a property_admin at A must not be able to spawn a
    // checkout session targeting Property B (which would charge B's
    // existing Stripe customer for an unwanted upgrade/downgrade).
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    if (!TIER_PRICE_IDS[tier]) {
      return NextResponse.json(
        {
          error: 'INVALID_TIER',
          message: `Unknown subscription tier: ${tier}`,
          code: 'INVALID_TIER',
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
        },
        requestId: request.headers.get('X-Request-ID') || '',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('POST /billing/checkout error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create checkout session',
        code: 'INTERNAL_ERROR',
        requestId: '',
      },
      { status: 500 },
    );
  }
}
