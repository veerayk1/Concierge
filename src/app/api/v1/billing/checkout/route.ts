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
import { guardRoute } from '@/server/middleware/api-guard';
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
    const auth = await guardRoute(request);
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
