/**
 * Billing & Subscription API Tests — per PRD 24
 *
 * Stripe integration with 3 tiers (starter, professional, enterprise),
 * invoicing, dunning, and webhook handling. All Stripe API calls are mocked.
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

// Mock the billing module's Stripe-facing functions
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

// Import route handlers AFTER mocks are set up
import { GET } from '../route';
import { POST as CheckoutPOST } from '../checkout/route';
import { GET as InvoicesGET } from '../invoices/route';
import { POST as WebhookPOST } from '../webhook/route';
import { checkDowngradeRestrictions, TIER_FEATURES } from '@/server/billing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const MOCK_INVOICE = {
  id: 'inv-uuid-001',
  subscriptionId: 'sub-uuid-001',
  propertyId: PROPERTY_ID,
  stripeInvoiceId: 'in_test123',
  amount: 9900,
  tax: 1287,
  currency: 'cad',
  status: 'paid',
  pdfUrl: 'https://stripe.com/invoice/pdf/in_test123',
  periodStart: new Date('2026-02-01'),
  periodEnd: new Date('2026-03-01'),
  paidAt: new Date('2026-02-01'),
  createdAt: new Date('2026-02-01'),
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockSubscriptionFindFirst.mockResolvedValue(null);
  mockInvoiceFindMany.mockResolvedValue([]);
  mockInvoiceCount.mockResolvedValue(0);
  mockInvoiceFindFirst.mockResolvedValue(null);
  mockVerifyWebhookSignature.mockResolvedValue(true);
});

// ===========================================================================
// 1. GET /billing — returns current subscription status
// ===========================================================================

describe('GET /api/v1/billing — Subscription Status', () => {
  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/billing');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse(res);
    expect(body).toHaveProperty('error', 'MISSING_PROPERTY');
  });

  it('returns status=none when no subscription exists', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null);
    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string; tier: null } }>(res);
    expect(body.data.status).toBe('none');
    expect(body.data.tier).toBeNull();
  });

  it('returns full subscription details when active', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    const req = createGetRequest('/api/v1/billing', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);
    expect(body.data.tier).toBe('professional');
    expect(body.data.status).toBe('active');
    expect(body.data.billingCycle).toBe('monthly');
    expect(body.data.stripeCustomerId).toBe('cus_test123');
    expect(body.data.stripeSubscriptionId).toBe('sub_test123');
  });
});

// ===========================================================================
// 2. Subscription tiers: starter, professional, enterprise
// ===========================================================================

describe('Subscription Tiers', () => {
  it.each(['starter', 'professional', 'enterprise'] as const)(
    'recognizes %s tier in subscription response',
    async (tier) => {
      mockSubscriptionFindFirst.mockResolvedValue({
        ...MOCK_SUBSCRIPTION,
        tier: tier.toUpperCase(),
      });
      const req = createGetRequest('/api/v1/billing', {
        searchParams: { propertyId: PROPERTY_ID },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await parseResponse<{ data: { tier: string } }>(res);
      expect(body.data.tier).toBe(tier);
    },
  );
});

// ===========================================================================
// 3. Create checkout session -> returns Stripe checkout URL
// ===========================================================================

describe('POST /api/v1/billing/checkout — Create Checkout Session', () => {
  it('creates a checkout session and returns URL', async () => {
    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });

    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: PROPERTY_ID,
      tier: 'professional',
      successUrl: 'https://app.concierge.com/billing/success',
      cancelUrl: 'https://app.concierge.com/billing/cancel',
      customerEmail: 'admin@building.com',
    });

    const res = await CheckoutPOST(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { checkoutUrl: string; sessionId: string } }>(res);
    expect(body.data.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
    expect(body.data.sessionId).toBe('cs_test_123');
  });

  it('rejects invalid tier', async () => {
    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: PROPERTY_ID,
      tier: 'platinum',
      successUrl: 'https://app.concierge.com/billing/success',
      cancelUrl: 'https://app.concierge.com/billing/cancel',
    });

    const res = await CheckoutPOST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/billing/checkout', {
      tier: 'starter',
    });

    const res = await CheckoutPOST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('passes customerEmail to Stripe when provided', async () => {
    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_456',
      url: 'https://checkout.stripe.com/c/pay/cs_test_456',
    });

    const req = createPostRequest('/api/v1/billing/checkout', {
      propertyId: PROPERTY_ID,
      tier: 'starter',
      successUrl: 'https://app.concierge.com/billing/success',
      cancelUrl: 'https://app.concierge.com/billing/cancel',
      customerEmail: 'admin@condo.com',
    });

    await CheckoutPOST(req);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'admin@condo.com' }),
    );
  });
});

// ===========================================================================
// 4. Webhook: checkout.session.completed -> activate subscription
// ===========================================================================

describe('Webhook: checkout.session.completed', () => {
  it('activates subscription on checkout completion', async () => {
    mockSubscriptionCreate.mockResolvedValue({ id: 'sub-new-001' });
    mockPropertyUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_new123',
          subscription: 'sub_stripe_new',
          metadata: {
            propertyId: PROPERTY_ID,
            tier: 'professional',
          },
        },
      },
    };

    const req = createTestRequest('/api/v1/billing/webhook', {
      method: 'POST',
      body: event,
      headers: { 'Stripe-Signature': 't=1234567890,v1=fakesig' },
    });

    // Override the request to provide raw text body for signature verification
    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);

    expect(mockSubscriptionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: PROPERTY_ID,
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        stripeCustomerId: 'cus_new123',
        stripeSubscriptionId: 'sub_stripe_new',
      }),
    });

    expect(mockPropertyUpdate).toHaveBeenCalledWith({
      where: { id: PROPERTY_ID },
      data: { subscriptionTier: 'PROFESSIONAL' },
    });
  });
});

// ===========================================================================
// 5. Webhook: invoice.paid -> update invoice record
// ===========================================================================

describe('Webhook: invoice.paid', () => {
  it('creates a new invoice record when one does not exist', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockInvoiceFindFirst.mockResolvedValue(null);
    mockInvoiceCreate.mockResolvedValue({ id: 'inv-new-001' });
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_002',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_new_123',
          subscription: 'sub_test123',
          amount_paid: 9900,
          tax: 1287,
          invoice_pdf: 'https://stripe.com/invoice/pdf/in_new_123',
          period_start: 1709251200,
          period_end: 1711929600,
        },
      },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);

    expect(mockInvoiceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'sub-uuid-001',
        propertyId: PROPERTY_ID,
        stripeInvoiceId: 'in_new_123',
        amount: 9900,
        status: 'paid',
      }),
    });
  });

  it('updates an existing invoice record', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockInvoiceFindFirst.mockResolvedValue({ id: 'inv-existing-001' });
    mockInvoiceUpdate.mockResolvedValue({});
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_003',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_existing_123',
          subscription: 'sub_test123',
          amount_paid: 9900,
          tax: 1287,
          invoice_pdf: 'https://stripe.com/invoice/pdf/in_existing_123',
          period_start: 1709251200,
          period_end: 1711929600,
        },
      },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);

    expect(mockInvoiceUpdate).toHaveBeenCalledWith({
      where: { id: 'inv-existing-001' },
      data: expect.objectContaining({
        status: 'paid',
      }),
    });
    expect(mockInvoiceCreate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 6. Webhook: invoice.payment_failed -> trigger dunning
// ===========================================================================

describe('Webhook: invoice.payment_failed', () => {
  it('marks subscription as PAST_DUE on payment failure', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_004',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed_123',
          subscription: 'sub_test123',
          attempt_count: 1,
        },
      },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-uuid-001' },
      data: { status: 'PAST_DUE' },
    });
  });

  it('handles multiple payment failure attempts', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_005',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed_456',
          subscription: 'sub_test123',
          attempt_count: 3,
        },
      },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-uuid-001' },
      data: { status: 'PAST_DUE' },
    });
  });
});

// ===========================================================================
// 7. Webhook: customer.subscription.updated -> sync plan changes
// ===========================================================================

describe('Webhook: customer.subscription.updated', () => {
  it('syncs plan changes from Stripe', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});
    mockPropertyUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_006',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          status: 'active',
          cancel_at_period_end: false,
          canceled_at: null,
          current_period_start: 1709251200,
          current_period_end: 1711929600,
          items: {
            data: [{ price: { id: 'price_enterprise' } }],
          },
        },
      },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-uuid-001' },
      data: expect.objectContaining({
        status: 'ACTIVE',
        tier: 'ENTERPRISE',
      }),
    });

    expect(mockPropertyUpdate).toHaveBeenCalledWith({
      where: { id: PROPERTY_ID },
      data: { subscriptionTier: 'ENTERPRISE' },
    });
  });

  it('handles subscription cancellation at period end', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(MOCK_SUBSCRIPTION);
    mockSubscriptionUpdate.mockResolvedValue({});

    const event = {
      id: 'evt_test_007',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          status: 'active',
          cancel_at_period_end: true,
          canceled_at: 1711929600,
          current_period_start: 1709251200,
          current_period_end: 1711929600,
          items: {
            data: [{ price: { id: 'price_professional' } }],
          },
        },
      },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=fakesig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);

    expect(mockSubscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-uuid-001' },
      data: expect.objectContaining({
        status: 'ACTIVE',
        canceledAt: expect.any(Date),
      }),
    });
  });
});

// ===========================================================================
// 8. Cancel subscription -> status=cancelling, cancelAt set (end of period)
// ===========================================================================

describe('Cancel Subscription', () => {
  it('calls Stripe to cancel at period end and returns updated subscription', async () => {
    mockCancelSubscription.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: true,
      canceled_at: 1711929600,
      current_period_start: 1709251200,
      current_period_end: 1711929600,
    });

    const { cancelSubscription } = await import('@/server/billing');
    const result = await cancelSubscription('sub_test123');

    expect(result.cancel_at_period_end).toBe(true);
    expect(result.canceled_at).toBeTruthy();
    expect(mockCancelSubscription).toHaveBeenCalledWith('sub_test123');
  });
});

// ===========================================================================
// 9. Reactivate cancelled subscription (before period end)
// ===========================================================================

describe('Reactivate Subscription', () => {
  it('calls Stripe to reactivate by clearing cancel_at_period_end', async () => {
    mockReactivateSubscription.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: false,
      canceled_at: null,
      current_period_start: 1709251200,
      current_period_end: 1711929600,
    });

    const { reactivateSubscription } = await import('@/server/billing');
    const result = await reactivateSubscription('sub_test123');

    expect(result.cancel_at_period_end).toBe(false);
    expect(result.canceled_at).toBeNull();
    expect(mockReactivateSubscription).toHaveBeenCalledWith('sub_test123');
  });
});

// ===========================================================================
// 10. Invoice history: GET /billing/invoices
// ===========================================================================

describe('GET /api/v1/billing/invoices — Invoice History', () => {
  it('returns 400 without propertyId', async () => {
    const req = createGetRequest('/api/v1/billing/invoices');
    const res = await InvoicesGET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse(res);
    expect(body).toHaveProperty('error', 'MISSING_PROPERTY');
  });

  it('returns paginated invoice list', async () => {
    mockInvoiceFindMany.mockResolvedValue([MOCK_INVOICE]);
    mockInvoiceCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await InvoicesGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ id: string; amount: number; status: string }>;
      meta: { page: number; total: number };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.amount).toBe(9900);
    expect(body.data[0]?.status).toBe('paid');
    expect(body.meta.total).toBe(1);
  });

  it('returns empty array when no invoices exist', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await InvoicesGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });

  it('supports pagination parameters', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '10' },
    });
    const res = await InvoicesGET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.totalPages).toBe(5);
  });
});

// ===========================================================================
// 11. Usage tracking: monthly active users per property
// ===========================================================================

describe('Usage Tracking — Tier Feature Limits', () => {
  it('starter tier limits: 50 units, 5 users', () => {
    const starter = TIER_FEATURES['starter'];
    expect(starter).toBeDefined();
    expect(starter!.maxUnits).toBe(50);
    expect(starter!.maxUsers).toBe(5);
  });

  it('professional tier limits: 200 units, 25 users', () => {
    const professional = TIER_FEATURES['professional'];
    expect(professional).toBeDefined();
    expect(professional!.maxUnits).toBe(200);
    expect(professional!.maxUsers).toBe(25);
  });

  it('enterprise tier: unlimited units and users', () => {
    const enterprise = TIER_FEATURES['enterprise'];
    expect(enterprise).toBeDefined();
    expect(enterprise!.maxUnits).toBe(Infinity);
    expect(enterprise!.maxUsers).toBe(Infinity);
  });
});

// ===========================================================================
// 12. Downgrade restrictions: check feature usage before allowing downgrade
// ===========================================================================

describe('Downgrade Restrictions', () => {
  it('allows upgrade from starter to professional', () => {
    const result = checkDowngradeRestrictions('starter', 'professional', {
      unitCount: 30,
      userCount: 3,
      features: ['events', 'packages'],
    });
    expect(result.allowed).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks downgrade when unit count exceeds target tier limit', () => {
    const result = checkDowngradeRestrictions('professional', 'starter', {
      unitCount: 100,
      userCount: 3,
      features: ['events', 'packages'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('unit count'))).toBe(true);
  });

  it('blocks downgrade when user count exceeds target tier limit', () => {
    const result = checkDowngradeRestrictions('professional', 'starter', {
      unitCount: 30,
      userCount: 15,
      features: ['events', 'packages'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('user count'))).toBe(true);
  });

  it('blocks downgrade when features in use are not in target tier', () => {
    const result = checkDowngradeRestrictions('professional', 'starter', {
      unitCount: 30,
      userCount: 3,
      features: ['events', 'packages', 'maintenance', 'api_access'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.some((r) => r.includes('maintenance'))).toBe(true);
  });

  it('allows downgrade when usage is within target tier limits', () => {
    const result = checkDowngradeRestrictions('professional', 'starter', {
      unitCount: 30,
      userCount: 3,
      features: ['events', 'packages'],
    });
    expect(result.allowed).toBe(true);
  });

  it('reports multiple restriction reasons simultaneously', () => {
    const result = checkDowngradeRestrictions('enterprise', 'starter', {
      unitCount: 300,
      userCount: 50,
      features: ['events', 'packages', 'maintenance', 'white_label'],
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });
});

// ===========================================================================
// 13. Webhook signature verification (Stripe-Signature header)
// ===========================================================================

describe('Webhook Signature Verification', () => {
  it('rejects requests without Stripe-Signature header', async () => {
    const event = {
      id: 'evt_test_sig_001',
      type: 'checkout.session.completed',
      data: { object: {} },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_SIGNATURE');
  });

  it('rejects requests with invalid signature', async () => {
    mockVerifyWebhookSignature.mockResolvedValue(false);

    const event = {
      id: 'evt_test_sig_002',
      type: 'checkout.session.completed',
      data: { object: {} },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=invalidsig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(401);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_SIGNATURE');
  });

  it('accepts requests with valid signature', async () => {
    mockVerifyWebhookSignature.mockResolvedValue(true);

    const event = {
      id: 'evt_test_sig_003',
      type: 'unknown.event.type',
      data: { object: {} },
    };

    const rawReq = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=validsig',
      },
      body: JSON.stringify(event),
    });

    const res = await WebhookPOST(rawReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ received: boolean }>(res);
    expect(body.received).toBe(true);
  });
});
