/**
 * Integration Workflow Tests — Billing & Subscription Lifecycle
 *
 * Tests complete billing workflows across multiple API endpoints:
 *   - New subscription (property creation -> tier selection -> checkout -> payment -> activation)
 *   - Upgrade (starter -> professional with proration)
 *   - Failed payment / Dunning (retry cascade, suspension)
 *   - Cancellation (cancel -> grace period -> reactivation)
 *
 * Each test validates Stripe webhook handling, subscription state transitions,
 * invoice generation, and feature gating side effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockSubscriptionCreate = vi.fn();
const mockSubscriptionFindFirst = vi.fn();
const mockSubscriptionUpdate = vi.fn();

const mockInvoiceCreate = vi.fn();
const mockInvoiceFindFirst = vi.fn();
const mockInvoiceFindMany = vi.fn();
const mockInvoiceCount = vi.fn();
const mockInvoiceUpdate = vi.fn();

const mockPropertyUpdate = vi.fn();

const mockUnitCount = vi.fn();
const mockUserPropertyCount = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    subscription: {
      create: (...args: unknown[]) => mockSubscriptionCreate(...args),
      findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
    },
    invoice: {
      create: (...args: unknown[]) => mockInvoiceCreate(...args),
      findFirst: (...args: unknown[]) => mockInvoiceFindFirst(...args),
      findMany: (...args: unknown[]) => mockInvoiceFindMany(...args),
      count: (...args: unknown[]) => mockInvoiceCount(...args),
      update: (...args: unknown[]) => mockInvoiceUpdate(...args),
    },
    property: {
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
    },
    unit: {
      count: (...args: unknown[]) => mockUnitCount(...args),
    },
    userProperty: {
      count: (...args: unknown[]) => mockUserPropertyCount(...args),
    },
    $transaction: (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === 'function') {
        return mockTransaction(...args);
      }
      if (Array.isArray(first)) {
        return Promise.all(first);
      }
      return mockTransaction(...args);
    },
  },
}));

vi.mock('@/server/billing', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_session_001',
    url: 'https://checkout.stripe.com/pay/cs_test_session_001',
    customer: 'cus_test_001',
    subscription: null,
    metadata: { propertyId: '00000000-0000-4000-b000-000000000001', tier: 'professional' },
  }),
  cancelSubscription: vi.fn().mockResolvedValue({
    id: 'sub_test_001',
    status: 'active',
    cancel_at_period_end: true,
  }),
  reactivateSubscription: vi.fn().mockResolvedValue({
    id: 'sub_test_001',
    status: 'active',
    cancel_at_period_end: false,
  }),
  verifyWebhookSignature: vi.fn().mockResolvedValue(true),
  TIER_PRICE_IDS: {
    starter: 'price_starter',
    professional: 'price_professional',
    enterprise: 'price_enterprise',
  },
  TIER_FEATURES: {
    starter: {
      maxUnits: 50,
      maxUsers: 5,
      features: ['events', 'packages', 'visitors', 'announcements'],
    },
    professional: {
      maxUnits: 200,
      maxUsers: 25,
      features: [
        'events',
        'packages',
        'visitors',
        'announcements',
        'maintenance',
        'amenities',
        'reports',
        'api_access',
      ],
    },
    enterprise: {
      maxUnits: Infinity,
      maxUsers: Infinity,
      features: [
        'events',
        'packages',
        'visitors',
        'announcements',
        'maintenance',
        'amenities',
        'reports',
        'api_access',
        'white_label',
        'sso',
        'dedicated_support',
        'custom_integrations',
      ],
    },
  },
  checkDowngradeRestrictions: vi.fn().mockReturnValue({ allowed: true, reasons: [] }),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import {
  GET as getSubscription,
  POST as createCheckout,
  PATCH as updateSubscription,
} from '@/app/api/v1/billing/route';
import { POST as processWebhook } from '@/app/api/v1/billing/webhook/route';
import { GET as listInvoices } from '@/app/api/v1/billing/invoices/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const SUBSCRIPTION_ID = 'sub-001';
const STRIPE_SUB_ID = 'sub_test_001';
const STRIPE_CUSTOMER_ID = 'cus_test_001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: SUBSCRIPTION_ID,
    propertyId: PROPERTY_ID,
    tier: 'STARTER',
    status: 'ACTIVE',
    billingCycle: 'monthly',
    stripeCustomerId: STRIPE_CUSTOMER_ID,
    stripeSubscriptionId: STRIPE_SUB_ID,
    currentPeriodStart: new Date('2026-03-01'),
    currentPeriodEnd: new Date('2026-04-01'),
    canceledAt: null,
    trialEndsAt: null,
    createdAt: new Date('2026-03-01'),
    ...overrides,
  };
}

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-001',
    subscriptionId: SUBSCRIPTION_ID,
    propertyId: PROPERTY_ID,
    stripeInvoiceId: 'in_test_001',
    amount: 4000,
    tax: 520,
    currency: 'cad',
    status: 'paid',
    pdfUrl: 'https://stripe.com/invoice.pdf',
    periodStart: new Date('2026-03-01'),
    periodEnd: new Date('2026-04-01'),
    paidAt: new Date('2026-03-01'),
    createdAt: new Date('2026-03-01'),
    ...overrides,
  };
}

function makeWebhookRequest(eventType: string, data: Record<string, unknown>) {
  const event = {
    id: `evt_test_${Date.now()}`,
    type: eventType,
    data: { object: data },
  };

  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = `t=${timestamp},v1=test_signature`;

  return new Request('http://localhost:3000/api/v1/billing/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signature,
    },
    body: payload,
  });
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: New Subscription
// ===========================================================================

describe('Scenario 1: New Subscription (Create -> Checkout -> Activate)', () => {
  it('Step 1: property has no subscription initially', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);
    mockUnitCount.mockResolvedValue(0);
    mockUserPropertyCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string; tier: null } }>(res);
    expect(body.data.status).toBe('none');
    expect(body.data.tier).toBeNull();
  });

  it('Step 2: admin selects Professional tier and creates checkout session', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null); // No existing active subscription

    const req = createPostRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      tier: 'professional',
      billingPeriod: 'monthly',
      successUrl: 'https://app.concierge.com/billing/success',
      cancelUrl: 'https://app.concierge.com/billing/cancel',
      customerEmail: 'admin@building.com',
    });

    const res = await createCheckout(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { checkoutUrl: string; sessionId: string; tier: string };
    }>(res);
    expect(body.data.checkoutUrl).toContain('checkout.stripe.com');
    expect(body.data.sessionId).toBe('cs_test_session_001');
    expect(body.data.tier).toBe('professional');
  });

  it('Step 3: Stripe webhook — checkout.session.completed creates subscription', async () => {
    mockSubscriptionCreate.mockResolvedValue(
      makeSubscription({ tier: 'PROFESSIONAL', status: 'ACTIVE' }),
    );
    mockPropertyUpdate.mockResolvedValue({ id: PROPERTY_ID });

    const req = makeWebhookRequest('checkout.session.completed', {
      customer: STRIPE_CUSTOMER_ID,
      subscription: STRIPE_SUB_ID,
      metadata: { propertyId: PROPERTY_ID, tier: 'professional' },
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ received: boolean }>(res);
    expect(body.received).toBe(true);

    expect(mockSubscriptionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          tier: 'PROFESSIONAL',
          status: 'ACTIVE',
          stripeCustomerId: STRIPE_CUSTOMER_ID,
          stripeSubscriptionId: STRIPE_SUB_ID,
        }),
      }),
    );
  });

  it('Step 4: Stripe webhook — invoice.paid creates invoice record', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ tier: 'PROFESSIONAL' }));
    mockInvoiceFindFirst.mockResolvedValue(null); // No existing invoice
    mockInvoiceCreate.mockResolvedValue(makeInvoice({ amount: 8000 }));
    mockSubscriptionUpdate.mockResolvedValue(makeSubscription({ status: 'ACTIVE' }));

    const req = makeWebhookRequest('invoice.paid', {
      id: 'in_test_002',
      subscription: STRIPE_SUB_ID,
      amount_paid: 8000,
      tax: 1040,
      invoice_pdf: 'https://stripe.com/invoice-002.pdf',
      period_start: Math.floor(new Date('2026-03-01').getTime() / 1000),
      period_end: Math.floor(new Date('2026-04-01').getTime() / 1000),
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionId: SUBSCRIPTION_ID,
          propertyId: PROPERTY_ID,
          stripeInvoiceId: 'in_test_002',
          amount: 8000,
          status: 'paid',
        }),
      }),
    );
  });

  it('Step 5: subscription is now active and visible via GET /billing', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ tier: 'PROFESSIONAL', status: 'ACTIVE' }),
    );
    mockUnitCount.mockResolvedValue(30);
    mockUserPropertyCount.mockResolvedValue(8);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { tier: string; status: string; usage: { unitCount: number } };
    }>(res);
    expect(body.data.tier).toBe('professional');
    expect(body.data.status).toBe('active');
    expect(body.data.usage.unitCount).toBe(30);
  });

  it('Step 6: invoice listed via GET /billing/invoices', async () => {
    mockInvoiceFindMany.mockResolvedValue([makeInvoice({ amount: 8000 })]);
    mockInvoiceCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listInvoices(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; amount: number; status: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.status).toBe('paid');
    expect(body.meta.total).toBe(1);
  });

  it('should reject checkout when active subscription already exists', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'ACTIVE' }));

    const req = createPostRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      tier: 'professional',
      billingPeriod: 'monthly',
      successUrl: 'https://app.concierge.com/success',
      cancelUrl: 'https://app.concierge.com/cancel',
    });

    const res = await createCheckout(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ACTIVE_SUBSCRIPTION_EXISTS');
  });

  it('should require propertyId for subscription lookup', async () => {
    const req = createGetRequest('/api/v1/billing');
    const res = await getSubscription(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ===========================================================================
// SCENARIO 2: Upgrade (Starter -> Professional)
// ===========================================================================

describe('Scenario 2: Upgrade (Starter -> Professional)', () => {
  it('Step 1: starter subscription is active', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ tier: 'STARTER', status: 'ACTIVE' }),
    );
    mockUnitCount.mockResolvedValue(20);
    mockUserPropertyCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { tier: string; status: string } }>(res);
    expect(body.data.tier).toBe('starter');
    expect(body.data.status).toBe('active');
  });

  it('Step 2: admin upgrades to Professional via PATCH /billing', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ tier: 'STARTER', status: 'ACTIVE' }),
    );
    mockSubscriptionUpdate.mockResolvedValue(
      makeSubscription({ tier: 'PROFESSIONAL', status: 'ACTIVE' }),
    );

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'upgrade',
      targetTier: 'professional',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { previousTier: string; newTier: string; status: string };
      message: string;
    }>(res);
    expect(body.data.previousTier).toBe('starter');
    expect(body.data.newTier).toBe('professional');
    expect(body.message).toContain('upgraded');
  });

  it('Step 3: new features unlocked after upgrade', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ tier: 'PROFESSIONAL', status: 'ACTIVE' }),
    );
    mockUnitCount.mockResolvedValue(20);
    mockUserPropertyCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getSubscription(req);
    const body = await parseResponse<{
      data: { usage: { features: string[]; maxUnits: number } };
    }>(res);

    expect(body.data.usage.features).toContain('maintenance');
    expect(body.data.usage.features).toContain('amenities');
    expect(body.data.usage.features).toContain('reports');
    expect(body.data.usage.features).toContain('api_access');
    expect(body.data.usage.maxUnits).toBe(200);
  });

  it('should reject upgrade to same tier', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ tier: 'PROFESSIONAL', status: 'ACTIVE' }),
    );

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'upgrade',
      targetTier: 'professional',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('SAME_TIER');
  });

  it('should require targetTier for upgrade action', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ tier: 'STARTER', status: 'ACTIVE' }),
    );

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'upgrade',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// SCENARIO 3: Failed Payment / Dunning
// ===========================================================================

describe('Scenario 3: Failed Payment / Dunning Workflow', () => {
  it('Step 1: invoice.payment_failed webhook changes status to past_due', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'ACTIVE' }));
    mockSubscriptionUpdate.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));

    const req = makeWebhookRequest('invoice.payment_failed', {
      id: 'in_failed_001',
      subscription: STRIPE_SUB_ID,
      attempt_count: 1,
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SUBSCRIPTION_ID },
        data: { status: 'PAST_DUE' },
      }),
    );
  });

  it('Step 2: subscription shows as past_due via GET /billing', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));
    mockUnitCount.mockResolvedValue(20);
    mockUserPropertyCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('past_due');
  });

  it('Step 3: retry attempt 2 (3 days later) — still fails', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));
    mockSubscriptionUpdate.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));

    const req = makeWebhookRequest('invoice.payment_failed', {
      id: 'in_failed_002',
      subscription: STRIPE_SUB_ID,
      attempt_count: 2,
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'PAST_DUE' },
      }),
    );
  });

  it('Step 4: retry attempt 3 (7 days later) — still fails', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));
    mockSubscriptionUpdate.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));

    const req = makeWebhookRequest('invoice.payment_failed', {
      id: 'in_failed_003',
      subscription: STRIPE_SUB_ID,
      attempt_count: 3,
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);
  });

  it('Step 5: final attempt (14 days later) fails — Stripe updates subscription', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));
    mockSubscriptionUpdate.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));

    const req = makeWebhookRequest('invoice.payment_failed', {
      id: 'in_failed_004',
      subscription: STRIPE_SUB_ID,
      attempt_count: 4,
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);
  });

  it('Step 6: subscription suspended after Stripe cancellation webhook', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));
    mockSubscriptionUpdate.mockResolvedValue(
      makeSubscription({ status: 'CANCELED', canceledAt: new Date() }),
    );
    mockPropertyUpdate.mockResolvedValue({ id: PROPERTY_ID });

    const req = makeWebhookRequest('customer.subscription.updated', {
      id: STRIPE_SUB_ID,
      status: 'canceled',
      cancel_at_period_end: false,
      canceled_at: Math.floor(Date.now() / 1000),
      current_period_start: Math.floor(new Date('2026-03-01').getTime() / 1000),
      current_period_end: Math.floor(new Date('2026-04-01').getTime() / 1000),
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CANCELED',
        }),
      }),
    );
  });

  it('successful payment after past_due should restore to active', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'PAST_DUE' }));
    mockInvoiceFindFirst.mockResolvedValue(null);
    mockInvoiceCreate.mockResolvedValue(makeInvoice());
    mockSubscriptionUpdate.mockResolvedValue(makeSubscription({ status: 'ACTIVE' }));

    const req = makeWebhookRequest('invoice.paid', {
      id: 'in_recovery_001',
      subscription: STRIPE_SUB_ID,
      amount_paid: 4000,
      tax: 520,
      period_start: Math.floor(Date.now() / 1000),
      period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    // Subscription should be re-activated
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'ACTIVE' },
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 4: Cancellation & Reactivation
// ===========================================================================

describe('Scenario 4: Cancellation & Reactivation', () => {
  it('Step 1: admin cancels subscription via PATCH /billing', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'ACTIVE' }));
    mockSubscriptionUpdate.mockResolvedValue(
      makeSubscription({ status: 'CANCELED', canceledAt: new Date() }),
    );

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'cancel',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string; canceledAt: string };
      message: string;
    }>(res);
    expect(body.data.status).toBe('canceled');
    expect(body.data.canceledAt).toBeTruthy();
    expect(body.message).toContain('Access continues until end of billing period');
  });

  it('Step 2: subscription still accessible during grace period', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({
        status: 'CANCELED',
        canceledAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days remaining
      }),
    );
    mockUnitCount.mockResolvedValue(20);
    mockUserPropertyCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string; tier: string };
    }>(res);

    // Still shows the tier even though cancelled
    expect(body.data.tier).toBe('starter');
    expect(body.data.status).toBe('canceled');
  });

  it('Step 3: admin reactivates within grace period', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(
      makeSubscription({ status: 'CANCELED', canceledAt: new Date() }),
    );
    mockSubscriptionUpdate.mockResolvedValue(
      makeSubscription({ status: 'ACTIVE', canceledAt: null }),
    );

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'reactivate',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string };
      message: string;
    }>(res);
    expect(body.data.status).toBe('active');
    expect(body.message).toContain('reactivated');
  });

  it('should reject cancel on already-cancelled subscription', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'CANCELED' }));

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'cancel',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_CANCELLED');
  });

  it('should reject reactivate on non-cancelled subscription', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription({ status: 'ACTIVE' }));

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'reactivate',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_CANCELLED');
  });

  it('should return 404 when no subscription exists for PATCH', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      action: 'cancel',
    });

    const res = await updateSubscription(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NO_SUBSCRIPTION');
  });
});

// ===========================================================================
// Cross-Scenario: Webhook Security & Edge Cases
// ===========================================================================

describe('Billing: Webhook Security & Edge Cases', () => {
  it('webhook without Stripe-Signature header is rejected', async () => {
    const req = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'invoice.paid', data: { object: {} } }),
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_SIGNATURE');
  });

  it('webhook with invalid signature is rejected', async () => {
    const { verifyWebhookSignature } = await import('@/server/billing');
    (verifyWebhookSignature as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

    const req = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=12345,v1=invalid_signature',
      },
      body: JSON.stringify({ type: 'invoice.paid', data: { object: {} } }),
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(401);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_SIGNATURE');
  });

  it('invoices listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/billing/invoices');
    const res = await listInvoices(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('invoices can be filtered by status', async () => {
    mockInvoiceFindMany.mockResolvedValue([makeInvoice({ status: 'paid' })]);
    mockInvoiceCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID, status: 'paid' },
    });

    const res = await listInvoices(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }[] }>(res);
    expect(body.data.every((i) => i.status === 'paid')).toBe(true);
  });

  it('invoices reject invalid status filter', async () => {
    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID, status: 'invalid_status' },
    });

    const res = await listInvoices(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_STATUS');
  });

  it('checkout validation rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      // Missing: tier, successUrl, cancelUrl
    });

    const res = await createCheckout(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('existing invoice is updated (not duplicated) on re-payment', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(makeSubscription());
    mockInvoiceFindFirst.mockResolvedValue(makeInvoice({ status: 'pending' }));
    mockInvoiceUpdate.mockResolvedValue(makeInvoice({ status: 'paid' }));

    const req = makeWebhookRequest('invoice.paid', {
      id: 'in_test_001',
      subscription: STRIPE_SUB_ID,
      amount_paid: 4000,
      tax: 520,
      period_start: Math.floor(Date.now() / 1000),
      period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    // Should update the existing invoice, not create a new one
    expect(mockInvoiceUpdate).toHaveBeenCalled();
    expect(mockInvoiceCreate).not.toHaveBeenCalled();
  });
});
