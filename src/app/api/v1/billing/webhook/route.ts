/**
 * Stripe Webhook Handler — POST /api/v1/billing/webhook
 *
 * Processes Stripe webhook events for subscription lifecycle:
 * - checkout.session.completed → activate subscription
 * - invoice.paid → record payment
 * - invoice.payment_failed → trigger dunning
 * - customer.subscription.updated → sync plan changes
 *
 * Per PRD 24: Billing & Subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { verifyWebhookSignature } from '@/server/billing';

// Stripe webhook event types we handle
type StripeEventType =
  | 'checkout.session.completed'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.subscription.updated';

interface StripeEvent {
  id: string;
  type: StripeEventType;
  data: {
    object: Record<string, unknown>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('Stripe-Signature');

    if (!signature) {
      return NextResponse.json(
        {
          error: 'MISSING_SIGNATURE',
          message: 'Stripe-Signature header is required',
          code: 'MISSING_SIGNATURE',
          requestId: '',
        },
        { status: 400 },
      );
    }

    const isValid = await verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json(
        {
          error: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed',
          code: 'INVALID_SIGNATURE',
          requestId: '',
        },
        { status: 401 },
      );
    }

    const event = JSON.parse(payload) as StripeEvent;

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('POST /billing/webhook error:', error);
    return NextResponse.json(
      {
        error: 'WEBHOOK_ERROR',
        message: 'Webhook processing failed',
        code: 'WEBHOOK_ERROR',
        requestId: '',
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Record<string, unknown>) {
  const metadata = session.metadata as Record<string, string> | undefined;
  const propertyId = metadata?.propertyId;
  const tier = metadata?.tier;

  if (!propertyId || !tier) {
    console.error('checkout.session.completed missing metadata', { metadata });
    return;
  }

  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  const tierMap: Record<string, 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'> = {
    starter: 'STARTER',
    professional: 'PROFESSIONAL',
    enterprise: 'ENTERPRISE',
  };

  await prisma.subscription.create({
    data: {
      propertyId,
      tier: tierMap[tier] || 'STARTER',
      status: 'ACTIVE',
      stripeCustomerId,
      stripeSubscriptionId,
      billingCycle: 'monthly',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Update property subscription tier
  await prisma.property.update({
    where: { id: propertyId },
    data: { subscriptionTier: tierMap[tier] || 'STARTER' },
  });
}

async function handleInvoicePaid(invoice: Record<string, unknown>) {
  const stripeInvoiceId = invoice.id as string;
  const subscriptionId = invoice.subscription as string;
  const amountPaid = invoice.amount_paid as number;
  const tax = (invoice.tax as number) || 0;
  const invoicePdf = invoice.invoice_pdf as string | undefined;
  const periodStart = invoice.period_start as number;
  const periodEnd = invoice.period_end as number;

  // Find the subscription by stripe ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.error('invoice.paid: no subscription found for', subscriptionId);
    return;
  }

  // Create or update the invoice record
  const existing = await prisma.invoice.findFirst({
    where: { stripeInvoiceId },
  });

  if (existing) {
    await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        pdfUrl: invoicePdf || null,
      },
    });
  } else {
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        propertyId: subscription.propertyId,
        stripeInvoiceId,
        amount: amountPaid,
        tax,
        currency: 'cad',
        status: 'paid',
        paidAt: new Date(),
        pdfUrl: invoicePdf || null,
        periodStart: new Date(periodStart * 1000),
        periodEnd: new Date(periodEnd * 1000),
      },
    });
  }

  // Ensure subscription is active
  if (subscription.status !== 'ACTIVE') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Record<string, unknown>) {
  const subscriptionId = invoice.subscription as string;
  const attemptCount = (invoice.attempt_count as number) || 1;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.error('invoice.payment_failed: no subscription found for', subscriptionId);
    return;
  }

  // Mark subscription as past_due (dunning state)
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' },
  });

  // Log the failed attempt for dunning workflow
  console.warn(
    `Payment failed for subscription ${subscription.id}, attempt ${attemptCount}. ` +
      `Property: ${subscription.propertyId}`,
  );
}

async function handleSubscriptionUpdated(sub: Record<string, unknown>) {
  const stripeSubscriptionId = sub.id as string;
  const status = sub.status as string;
  const cancelAtPeriodEnd = sub.cancel_at_period_end as boolean;
  const canceledAt = sub.canceled_at as number | null;
  const currentPeriodStart = sub.current_period_start as number;
  const currentPeriodEnd = sub.current_period_end as number;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.error('customer.subscription.updated: no subscription found for', stripeSubscriptionId);
    return;
  }

  // Map Stripe status to our status
  const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'PAST_DUE',
    incomplete_expired: 'EXPIRED',
  };

  const newStatus = statusMap[status] || 'ACTIVE';

  // Detect tier change from price ID
  const items = sub.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const priceId = items?.data?.[0]?.price?.id;
  let newTier = subscription.tier;

  if (priceId) {
    const priceToTier: Record<string, 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'> = {
      [process.env.STRIPE_PRICE_STARTER || 'price_starter']: 'STARTER',
      [process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional']: 'PROFESSIONAL',
      [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: 'ENTERPRISE',
    };
    newTier = priceToTier[priceId] || subscription.tier;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: cancelAtPeriodEnd && newStatus === 'ACTIVE' ? 'ACTIVE' : newStatus,
      tier: newTier,
      canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
    },
  });

  // Sync tier to property
  if (newTier !== subscription.tier) {
    await prisma.property.update({
      where: { id: subscription.propertyId },
      data: { subscriptionTier: newTier },
    });
  }
}
