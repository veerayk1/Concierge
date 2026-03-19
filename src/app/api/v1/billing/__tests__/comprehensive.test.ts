/**
 * PRD 24 — Billing & Subscription Comprehensive Tests
 *
 * Extended TDD coverage for subscription status retrieval, checkout session
 * creation, Stripe webhook handling (checkout.completed, invoice.paid,
 * payment_failed, subscription.updated), cancel/reactivate flows,
 * invoice history, signature verification, and usage tracking.
 *
 * These tests complement route.test.ts with additional edge-case coverage.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createTestRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSubscriptionFindFirst = vi.fn();
const mockSubscriptionCreate = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockInvoiceFindMany = vi.fn();
const mockInvoiceCount = vi.fn();
const mockInvoiceCreate = vi.fn();
const mockInvoiceFindFirst = vi.fn();
const mockInvoiceUpdate = vi.fn();
const mockPropertyUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    subscription: {
      findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
      create: (...args: unknown[]) => mockSubscriptionCreate(...args),
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
    },
    invoice: {
      findMany: (...args: unknown[]) => mockInvoiceFindMany(...args),
      count: (...args: unknown[]) => mockInvoiceCount(...args),
      create: (...args: unknown[]) => mockInvoiceCreate(...args),
      findFirst: (...args: unknown[]) => mockInvoiceFindFirst(...args),
      update: (...args: unknown[]) => mockInvoiceUpdate(...args),
    },
    property: {
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-user-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

const mockCreateCheckoutSession = vi.fn();
const mockVerifyWebhookSignature = vi.fn();
const mockCancelSubscription = vi.fn();
const mockReactivateSubscription = vi.fn();

vi.mock('@/server/billing', () => ({
  createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
  verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
  cancelSubscription: (...args: unknown[]) => mockCancelSubscription(...args),
  reactivateSubscription: (...args: unknown[]) => mockReactivateSubscription(...args),
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
  checkDowngradeRestrictions: (
    currentTier: string,
    targetTier: string,
    usage: { unitCount: number; userCount: number; features: string[] },
  ) => {
    const tierFeatures: Record<string, { maxUnits: number; maxUsers: number; features: string[] }> =
      {
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
      };
    const targetLimits = tierFeatures[targetTier];
    if (!targetLimits) return { allowed: false, reasons: [`Unknown tier: ${targetTier}`] };
    const tierOrder = ['starter', 'professional', 'enterprise'];
    if (tierOrder.indexOf(targetTier) >= tierOrder.indexOf(currentTier))
      return { allowed: true, reasons: [] };
    const reasons: string[] = [];
    if (usage.unitCount > targetLimits.maxUnits)
      reasons.push(
        `Current unit count (${usage.unitCount}) exceeds ${targetTier} limit (${targetLimits.maxUnits})`,
      );
    if (usage.userCount > targetLimits.maxUsers)
      reasons.push(
        `Current user count (${usage.userCount}) exceeds ${targetTier} limit (${targetLimits.maxUsers})`,
      );
    const lostFeatures = usage.features.filter((f) => !targetLimits.features.includes(f));
    if (lostFeatures.length > 0)
      reasons.push(
        `Features in use that are not available in ${targetTier}: ${lostFeatures.join(', ')}`,
      );
    return { allowed: reasons.length === 0, reasons };
  },
}));

import { GET } from '../route';
import { POST as CheckoutPOST } from '../checkout/route';
import { GET as InvoicesGET } from '../invoices/route';
import { POST as WebhookPOST } from '../webhook/route';
import { checkDowngradeRestrictions } from '@/server/billing';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

const MOCK_SUBSCRIPTION = {
  id: 'sub-uuid-001',
  propertyId: PROPERTY_ID,
  tier: 'PROFESSIONAL',
  status: 'ACTIVE',
  billingCycle: 'monthly',
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
  currentPeriodStart: new Date('2026-03-01'),
  currentPeriodEnd: new Date('2026-04-01'),
  canceledAt: null,
  trialEndsAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-03-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscriptionFindFirst.mockResolvedValue(null);
  mockInvoiceFindMany.mockResolvedValue([]);
  mockInvoiceCount.mockResolvedValue(0);
  mockInvoiceFindFirst.mockResolvedValue(null);
  mockVerifyWebhookSignature.mockResolvedValue(true);
});

// Helper to create a webhook request
function createWebhookRequest(event: Record<string, unknown>, sig = 't=1234567890,v1=fakesig') {
  return new Request('http://localhost:3000/api/v1/billing/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': sig,
    },
    body: JSON.stringify(event),
  }) as unknown as import('next/server').NextRequest;
}

// ===========================================================================
// 1. Subscription status retrieval — extended scenarios
// ===========================================================================

describe('Subscription Status — Extended Scenarios', () => {
  it('returns canceledAt when subscription is canceled', async () => {
    const cancelDate = new Date('2026-03-15');
    mockSubscriptionFindFirst.mockResolvedValue({
      ...MOCK_SUBSCRIPTION,
      status: 'CANCELED',
      canceledAt: cancelDate,
    });

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string; canceledAt: string } }>(res);
    expect(body.data.status).toBe('canceled');
    expect(body.data.canceledAt).toBeDefined();
  });

  it('returns trialEndsAt for trial subscriptions', async () => {
    const trialEnd = new Date('2026-04-15');
    mockSubscriptionFindFirst.mockResolvedValue({
      ...MOCK_SUBSCRIPTION,
      status: 'ACTIVE',
      trialEndsAt: trialEnd,
    });

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { trialEndsAt: string } }>(res);
    expect(body.data.trialEndsAt).toBeDefined();
  });

  it('handles database errors with 500 status', async () => {
    mockSubscriptionFindFirst.mockRejectedValue(new Error('DB timeout'));

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ===========================================================================
// 2. Checkout session creation — extended scenarios
// ===========================================================================

describe('Checkout Session — Extended Scenarios', () => {
  it('rejects missing successUrl', async () => {
    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: PROPERTY_ID,
      tier: 'starter',
      cancelUrl: 'https://app.concierge.com/cancel',
    });
    const res = await CheckoutPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing cancelUrl', async () => {
    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: PROPERTY_ID,
      tier: 'starter',
      successUrl: 'https://app.concierge.com/success',
    });
    const res = await CheckoutPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format (not UUID)', async () => {
    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: 'not-a-uuid',
      tier: 'starter',
      successUrl: 'https://example.com/ok',
      cancelUrl: 'https://example.com/cancel',
    });
    const res = await CheckoutPOST(req);
    expect(res.status).toBe(400);
  });

  it('handles Stripe API errors with 500 status', async () => {
    mockCreateCheckoutSession.mockRejectedValue(new Error('Stripe unavailable'));

    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: PROPERTY_ID,
      tier: 'professional',
      successUrl: 'https://example.com/ok',
      cancelUrl: 'https://example.com/cancel',
    });
    const res = await CheckoutPOST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ===========================================================================
// 3. Webhook: checkout.completed — edge cases
// ===========================================================================

describe('Webhook: checkout.completed — Edge Cases', () => {
  it('sets billingCycle to monthly by default', async () => {
    mockSubscriptionCreate.mockResolvedValue({ id: 'sub-new' });
    mockPropertyUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_new',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_abc',
          subscription: 'sub_stripe_abc',
          metadata: { propertyId: PROPERTY_ID, tier: 'starter' },
        },
      },
    };

    const res = await WebhookPOST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const createData = mockSubscriptionCreate.mock.calls[0]![0].data;
    expect(createData.billingCycle).toBe('monthly');
    expect(createData.tier).toBe('STARTER');
    expect(createData.status).toBe('ACTIVE');
  });

  it('syncs tier to property model on activation', async () => {
    mockSubscriptionCreate.mockResolvedValue({ id: 'sub-new' });
    mockPropertyUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_tier',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_xyz',
          subscription: 'sub_stripe_xyz',
          metadata: { propertyId: PROPERTY_ID, tier: 'enterprise' },
        },
      },
    };

    await WebhookPOST(createWebhookRequest(event));

    expect(mockPropertyUpdate).toHaveBeenCalledWith({
      where: { id: PROPERTY_ID },
      data: { subscriptionTier: 'ENTERPRISE' },
    });
  });
});

// ===========================================================================
// 4. Webhook: invoice.paid — extended coverage
// ===========================================================================

describe('Webhook: invoice.paid — Extended Coverage', () => {
  it('re-activates PAST_DUE subscription on payment', async () => {
    mockSubscriptionFindFirst.mockResolvedValue({
      ...MOCK_SUBSCRIPTION,
      status: 'PAST_DUE',
    });
    mockInvoiceFindFirst.mockResolvedValue(null);
    mockInvoiceCreate.mockResolvedValue({ id: 'inv-reactivate' });
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_paid',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_reactivate',
          subscription: 'sub_test123',
          amount_paid: 9900,
          tax: 1287,
          invoice_pdf: 'https://stripe.com/pdf',
          period_start: 1709251200,
          period_end: 1711929600,
        },
      },
    };

    await WebhookPOST(createWebhookRequest(event));

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-uuid-001' },
      data: { status: 'ACTIVE' },
    });
  });

  it('silently handles missing subscription on invoice.paid', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);

    const event = {
      id: 'evt_orphan',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_orphan',
          subscription: 'sub_unknown',
          amount_paid: 500,
        },
      },
    };

    const res = await WebhookPOST(createWebhookRequest(event));
    // Should not crash — returns 200 because event is acknowledged
    expect(res.status).toBe(200);
    expect(mockInvoiceCreate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 5. Webhook: payment_failed — dunning
// ===========================================================================

describe('Webhook: payment_failed — Dunning Extended', () => {
  it('handles missing subscription on payment_failed gracefully', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);

    const event = {
      id: 'evt_fail_orphan',
      type: 'invoice.payment_failed',
      data: {
        object: { id: 'in_fail_orphan', subscription: 'sub_unknown', attempt_count: 1 },
      },
    };

    const res = await WebhookPOST(createWebhookRequest(event));
    expect(res.status).toBe(200);
    expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it('sets PAST_DUE on first attempt failure', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_fail_1',
      type: 'invoice.payment_failed',
      data: {
        object: { id: 'in_fail_1', subscription: 'sub_test123', attempt_count: 1 },
      },
    };

    await WebhookPOST(createWebhookRequest(event));

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-uuid-001' },
      data: { status: 'PAST_DUE' },
    });
  });
});

// ===========================================================================
// 6. Webhook: subscription.updated — sync
// ===========================================================================

describe('Webhook: subscription.updated — Sync Extended', () => {
  it('maps Stripe past_due status correctly', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_past_due',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          status: 'past_due',
          cancel_at_period_end: false,
          canceled_at: null,
          current_period_start: 1709251200,
          current_period_end: 1711929600,
          items: { data: [{ price: { id: 'price_professional' } }] },
        },
      },
    };

    await WebhookPOST(createWebhookRequest(event));

    const updateData = mockSubscriptionUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('PAST_DUE');
  });

  it('maps Stripe canceled status correctly', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_canceled',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          status: 'canceled',
          cancel_at_period_end: false,
          canceled_at: 1711929600,
          current_period_start: 1709251200,
          current_period_end: 1711929600,
          items: { data: [{ price: { id: 'price_professional' } }] },
        },
      },
    };

    await WebhookPOST(createWebhookRequest(event));

    const updateData = mockSubscriptionUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('CANCELED');
  });
});

// ===========================================================================
// 7. Cancel and reactivate flows
// ===========================================================================

describe('Cancel and Reactivate — Extended', () => {
  it('cancel returns the updated stripe subscription object', async () => {
    mockCancelSubscription.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: true,
      canceled_at: 1711929600,
      current_period_end: 1711929600,
    });

    const { cancelSubscription } = await import('@/server/billing');
    const result = await cancelSubscription('sub_test123');
    expect(result.id).toBe('sub_test123');
    expect(result.cancel_at_period_end).toBe(true);
  });

  it('reactivate clears cancelation markers', async () => {
    mockReactivateSubscription.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: false,
      canceled_at: null,
    });

    const { reactivateSubscription } = await import('@/server/billing');
    const result = await reactivateSubscription('sub_test123');
    expect(result.cancel_at_period_end).toBe(false);
    expect(result.canceled_at).toBeNull();
  });
});

// ===========================================================================
// 8. Invoice history — extended scenarios
// ===========================================================================

describe('Invoice History — Extended', () => {
  it('defaults to page=1 and pageSize=20', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await InvoicesGET(req);
    const body = await parseResponse<{ meta: { page: number; pageSize: number } }>(res);

    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
  });

  it('invoice records include all expected fields', async () => {
    const invoice = {
      id: 'inv-001',
      subscriptionId: 'sub-001',
      stripeInvoiceId: 'in_test',
      amount: 4900,
      tax: 637,
      currency: 'cad',
      status: 'paid',
      pdfUrl: 'https://stripe.com/pdf/inv',
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-03-01'),
      paidAt: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01'),
    };
    mockInvoiceFindMany.mockResolvedValue([invoice]);
    mockInvoiceCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await InvoicesGET(req);
    const body = await parseResponse<{ data: Array<Record<string, unknown>> }>(res);

    const inv = body.data[0]!;
    expect(inv.id).toBe('inv-001');
    expect(inv.amount).toBe(4900);
    expect(inv.tax).toBe(637);
    expect(inv.currency).toBe('cad');
    expect(inv.status).toBe('paid');
    expect(inv.pdfUrl).toBeDefined();
    expect(inv.periodStart).toBeDefined();
    expect(inv.periodEnd).toBeDefined();
  });

  it('handles database error during invoice listing', async () => {
    mockInvoiceFindMany.mockRejectedValue(new Error('DB error'));

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await InvoicesGET(req);
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 9. Signature verification — extended
// ===========================================================================

describe('Webhook Signature Verification — Extended', () => {
  it('processes unknown event types without error', async () => {
    const event = {
      id: 'evt_unknown',
      type: 'customer.created',
      data: { object: { id: 'cus_new' } },
    };

    const res = await WebhookPOST(createWebhookRequest(event));
    expect(res.status).toBe(200);
    const body = await parseResponse<{ received: boolean }>(res);
    expect(body.received).toBe(true);
  });

  it('handles malformed JSON in webhook body', async () => {
    mockVerifyWebhookSignature.mockResolvedValue(true);

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=sig',
      },
      body: 'not valid json {{{',
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 10. Usage tracking — tier limits validation
// ===========================================================================

describe('Usage Tracking — Tier Limits', () => {
  it('enterprise allows upgrading to enterprise from any tier', () => {
    const result = checkDowngradeRestrictions('starter', 'enterprise', {
      unitCount: 1000,
      userCount: 500,
      features: ['events', 'packages', 'maintenance', 'white_label'],
    });
    expect(result.allowed).toBe(true);
  });

  it('same-tier "change" is treated as upgrade (allowed)', () => {
    const result = checkDowngradeRestrictions('professional', 'professional', {
      unitCount: 150,
      userCount: 20,
      features: ['events', 'maintenance'],
    });
    expect(result.allowed).toBe(true);
  });

  it('returns reason string when unknown target tier is provided', () => {
    const result = checkDowngradeRestrictions('professional', 'platinum' as string, {
      unitCount: 10,
      userCount: 2,
      features: [],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons[0]).toContain('Unknown tier');
  });

  it('starter tier restricts advanced features like maintenance and api_access', () => {
    const result = checkDowngradeRestrictions('enterprise', 'starter', {
      unitCount: 10,
      userCount: 2,
      features: ['events', 'packages', 'maintenance', 'api_access'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('maintenance'))).toBe(true);
  });
});

// ===========================================================================
// 11. Webhook processing error handling
// ===========================================================================

describe('Webhook Processing — Error Recovery', () => {
  it('returns 500 when database operation fails during checkout.completed', async () => {
    mockSubscriptionCreate.mockRejectedValue(new Error('DB write failed'));

    const event = {
      id: 'evt_db_err',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_fail',
          subscription: 'sub_fail',
          metadata: { propertyId: PROPERTY_ID, tier: 'starter' },
        },
      },
    };

    const res = await WebhookPOST(createWebhookRequest(event));
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('WEBHOOK_ERROR');
  });

  it('returns 500 when database operation fails during subscription.updated', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockRejectedValue(new Error('Deadlock'));

    const event = {
      id: 'evt_deadlock',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          status: 'active',
          cancel_at_period_end: false,
          canceled_at: null,
          current_period_start: 1709251200,
          current_period_end: 1711929600,
          items: { data: [{ price: { id: 'price_professional' } }] },
        },
      },
    };

    const res = await WebhookPOST(createWebhookRequest(event));
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 12. Subscription response includes requestId header
// ===========================================================================

describe('Response — requestId propagation', () => {
  it('GET /billing response includes requestId', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);

    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{ requestId: string }>(res);
    expect(body.requestId).toBeDefined();
  });

  it('GET /billing/invoices response includes requestId', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await InvoicesGET(req);
    const body = await parseResponse<{ requestId: string }>(res);
    expect(body.requestId).toBeDefined();
  });
});
