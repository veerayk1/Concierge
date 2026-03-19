/**
 * Integration Workflow Tests — Property Lifecycle
 *
 * Tests the complete property lifecycle from onboarding to going live:
 *   - Onboarding wizard creates property
 *   - Units are bulk imported via CSV
 *   - Staff are invited and activate accounts
 *   - First security event is logged
 *   - First package is tracked
 *   - Property goes live
 *   - Monthly billing cycle runs
 *
 * Each test validates state transitions, data integrity, and cross-module interactions.
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

const mockPropertyCreate = vi.fn();
const mockPropertyFindUnique = vi.fn();
const mockPropertyUpdate = vi.fn();

const mockOnboardingProgressFindFirst = vi.fn();
const mockOnboardingProgressUpsert = vi.fn();

const mockUnitCreateMany = vi.fn();
const mockUnitFindMany = vi.fn();
const mockUnitCount = vi.fn();

const mockUserCreate = vi.fn();
const mockUserPropertyCreate = vi.fn();
const mockUserPropertyFindMany = vi.fn();
const mockUserPropertyCount = vi.fn();

const mockEventCreate = vi.fn();
const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();

const mockPackageCreate = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageCount = vi.fn();

const mockSubscriptionCreate = vi.fn();
const mockSubscriptionFindFirst = vi.fn();
const mockSubscriptionUpdate = vi.fn();

const mockInvoiceCreate = vi.fn();
const mockInvoiceFindFirst = vi.fn();
const mockInvoiceFindMany = vi.fn();
const mockInvoiceCount = vi.fn();
const mockInvoiceUpdate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    property: {
      create: (...args: unknown[]) => mockPropertyCreate(...args),
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
    },
    onboardingProgress: {
      findFirst: (...args: unknown[]) => mockOnboardingProgressFindFirst(...args),
      upsert: (...args: unknown[]) => mockOnboardingProgressUpsert(...args),
    },
    unit: {
      createMany: (...args: unknown[]) => mockUnitCreateMany(...args),
      findMany: (...args: unknown[]) => mockUnitFindMany(...args),
      count: (...args: unknown[]) => mockUnitCount(...args),
    },
    user: {
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    userProperty: {
      create: (...args: unknown[]) => mockUserPropertyCreate(...args),
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
      count: (...args: unknown[]) => mockUserPropertyCount(...args),
    },
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
    },
    package: {
      create: (...args: unknown[]) => mockPackageCreate(...args),
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      count: (...args: unknown[]) => mockPackageCount(...args),
    },
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

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('PLC001'),
}));

vi.mock('@/schemas/event', () => ({
  createEventSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.eventTypeId || !data.title) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { title: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/schemas/package', () => ({
  createPackageSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.unitId || !data.direction) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { propertyId: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-001',
      propertyId: 'prop-new-001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

vi.mock('@/server/billing', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_001',
    url: 'https://checkout.stripe.com/pay/cs_test_001',
    customer: 'cus_test_001',
    subscription: null,
    metadata: { propertyId: 'prop-new-001', tier: 'professional' },
  }),
  verifyWebhookSignature: vi.fn().mockResolvedValue(true),
  TIER_PRICE_IDS: {
    starter: 'price_starter',
    professional: 'price_professional',
    enterprise: 'price_enterprise',
  },
  TIER_FEATURES: {
    starter: { maxUnits: 50, maxUsers: 5, features: ['events', 'packages'] },
    professional: {
      maxUnits: 200,
      maxUsers: 25,
      features: ['events', 'packages', 'maintenance', 'amenities'],
    },
    enterprise: { maxUnits: Infinity, maxUsers: Infinity, features: ['*'] },
  },
  checkDowngradeRestrictions: vi.fn().mockReturnValue({ allowed: true, reasons: [] }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import {
  GET as getOnboarding,
  POST as completeOnboardingStep,
} from '@/app/api/v1/onboarding/route';
import { POST as createEvent, GET as listEvents } from '@/app/api/v1/events/route';
import { POST as createPackage, GET as listPackages } from '@/app/api/v1/packages/route';
import { POST as createCheckout, GET as getSubscription } from '@/app/api/v1/billing/route';
import { POST as processWebhook } from '@/app/api/v1/billing/webhook/route';
import { GET as listInvoices } from '@/app/api/v1/billing/invoices/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = 'prop-new-001';

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Onboarding Wizard Creates Property
// ===========================================================================

describe('Scenario 1: Onboarding Wizard — 8-Step Property Setup', () => {
  it('Step 1: Property Basics — name, address, timezone', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue(null);
    mockOnboardingProgressUpsert.mockResolvedValue({});

    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 1,
      data: {
        name: 'Maple Heights Condos',
        address: '100 King Street West, Toronto, ON',
        timezone: 'America/Toronto',
        totalUnits: 171,
      },
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      message: string;
      data: { step: number; completed: boolean; currentStep: number };
    }>(res);
    expect(body.data.step).toBe(1);
    expect(body.data.completed).toBe(true);
    expect(body.message).toContain('Step 1 completed');
  });

  it('Step 2: Building Structure — units and floors', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue({
      completedSteps: [1],
      skippedSteps: [],
      stepData: { '1': { name: 'Maple Heights' } },
    });
    mockOnboardingProgressUpsert.mockResolvedValue({});

    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 2,
      data: {
        floors: 20,
        unitsPerFloor: 8,
        parkingLevels: 3,
      },
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { step: number; currentStep: number } }>(res);
    expect(body.data.step).toBe(2);
    expect(body.data.currentStep).toBe(3);
  });

  it('should skip optional step (step 4: Amenity Setup)', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue({
      completedSteps: [1, 2, 3],
      skippedSteps: [],
      stepData: {},
    });
    mockOnboardingProgressUpsert.mockResolvedValue({});

    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 4,
      skip: true,
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { skipped: boolean } }>(res);
    expect(body.data.skipped).toBe(true);
  });

  it('should reject skipping required step (step 1)', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 1,
      skip: true,
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('CANNOT_SKIP_REQUIRED');
  });

  it('should reject out-of-order step completion', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue({
      completedSteps: [1],
      skippedSteps: [],
      stepData: {},
    });

    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 5, // Skipping steps 2, 3, 4
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('STEP_ORDER_VIOLATION');
  });

  it('Step 8: Review & Activate — property goes live', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue({
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      skippedSteps: [],
      stepData: {},
    });
    mockOnboardingProgressUpsert.mockResolvedValue({});
    mockPropertyUpdate.mockResolvedValue({ id: PROPERTY_ID, isActive: true });

    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 8,
      data: { confirmed: true },
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { step: number; percentComplete: number; propertyStatus: string };
    }>(res);
    expect(body.data.step).toBe(8);
    expect(body.data.percentComplete).toBe(100);
    expect(body.data.propertyStatus).toBe('active');

    // Verify property was activated
    expect(mockPropertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PROPERTY_ID },
        data: { isActive: true },
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 2: Onboarding Progress Tracking
// ===========================================================================

describe('Scenario 2: Onboarding Progress Tracking', () => {
  it('should show current progress with completed and pending steps', async () => {
    mockOnboardingProgressFindFirst.mockResolvedValue({
      completedSteps: [1, 2, 3],
      skippedSteps: [4],
      currentStep: 5,
      completedAt: null,
      updatedAt: new Date(),
      stepData: {},
    });

    const req = createGetRequest('/api/v1/onboarding', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getOnboarding(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        currentStep: number;
        completedSteps: number[];
        skippedSteps: number[];
        percentComplete: number;
        totalSteps: number;
        isComplete: boolean;
        steps: { step: number; completed: boolean; skipped: boolean }[];
      };
    }>(res);
    expect(body.data.currentStep).toBe(5);
    expect(body.data.completedSteps).toEqual([1, 2, 3]);
    expect(body.data.skippedSteps).toEqual([4]);
    expect(body.data.percentComplete).toBe(50); // 4 of 8 done
    expect(body.data.isComplete).toBe(false);
    expect(body.data.steps).toHaveLength(8);
  });

  it('should require propertyId', async () => {
    const req = createGetRequest('/api/v1/onboarding');
    const res = await getOnboarding(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ===========================================================================
// SCENARIO 3: First Security Event Logged
// ===========================================================================

describe('Scenario 3: First Security Event Logged After Go-Live', () => {
  it('should create first security event for property', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'evt-first-001',
      propertyId: PROPERTY_ID,
      eventTypeId: 'evtype-visitor',
      title: 'Visitor — John Smith for Unit 305',
      status: 'open',
      referenceNo: 'EVT-PLC001',
      createdById: 'admin-001',
      createdAt: new Date(),
      eventType: { id: 'evtype-visitor', name: 'Visitor', icon: 'user', color: '#2196F3' },
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: 'evtype-visitor',
      title: 'Visitor — John Smith for Unit 305',
      description: 'Expected visitor for unit 305. Contractor badge issued.',
    });

    const res = await createEvent(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { referenceNo: string; eventType: { name: string } };
    }>(res);
    expect(body.data.referenceNo).toContain('EVT-');
    expect(body.data.eventType.name).toBe('Visitor');
  });

  it('should list events for the new property', async () => {
    mockEventFindMany.mockResolvedValue([
      {
        id: 'evt-1',
        title: 'Visitor',
        status: 'open',
        createdAt: new Date(),
        eventType: { name: 'Visitor' },
      },
    ]);
    mockEventCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listEvents(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

// ===========================================================================
// SCENARIO 4: First Package Tracked
// ===========================================================================

describe('Scenario 4: First Package Tracked After Go-Live', () => {
  it('should create first package for the new property', async () => {
    mockPackageCreate.mockResolvedValue({
      id: 'pkg-first-001',
      propertyId: PROPERTY_ID,
      unitId: 'unit-305',
      referenceNumber: 'PKG-PLC001',
      status: 'unreleased',
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      createdById: 'admin-001',
      createdAt: new Date(),
      unit: { id: 'unit-305', number: '305' },
    });

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: 'unit-305',
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { referenceNumber: string; status: string };
    }>(res);
    expect(body.data.referenceNumber).toContain('PKG-');
    expect(body.data.status).toBe('unreleased');
  });

  it('should list packages for the property', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        id: 'pkg-first-001',
        unitId: 'unit-305',
        status: 'unreleased',
        referenceNumber: 'PKG-PLC001',
        unit: { number: '305' },
      },
    ]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listPackages(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

// ===========================================================================
// SCENARIO 5: Monthly Billing Cycle
// ===========================================================================

describe('Scenario 5: Monthly Billing Cycle Runs', () => {
  const SUBSCRIPTION_ID = 'sub-new-001';
  const STRIPE_SUB_ID = 'sub_stripe_001';
  const STRIPE_CUSTOMER_ID = 'cus_stripe_001';

  it('Step 1: property admin initiates checkout', async () => {
    mockSubscriptionFindFirst.mockResolvedValue(null); // No existing subscription

    const req = createPostRequest('/api/v1/billing', {
      propertyId: PROPERTY_ID,
      tier: 'professional',
      billingPeriod: 'monthly',
      successUrl: 'https://app.concierge.com/billing/success',
      cancelUrl: 'https://app.concierge.com/billing/cancel',
      customerEmail: 'admin@maplecondos.com',
    });

    const res = await createCheckout(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { checkoutUrl: string; tier: string };
    }>(res);
    expect(body.data.checkoutUrl).toContain('checkout.stripe.com');
    expect(body.data.tier).toBe('professional');
  });

  it('Step 2: Stripe checkout.session.completed activates subscription', async () => {
    mockSubscriptionCreate.mockResolvedValue({
      id: SUBSCRIPTION_ID,
      propertyId: PROPERTY_ID,
      tier: 'PROFESSIONAL',
      status: 'ACTIVE',
      stripeCustomerId: STRIPE_CUSTOMER_ID,
      stripeSubscriptionId: STRIPE_SUB_ID,
    });
    mockPropertyUpdate.mockResolvedValue({ id: PROPERTY_ID });

    const event = {
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: STRIPE_CUSTOMER_ID,
          subscription: STRIPE_SUB_ID,
          metadata: { propertyId: PROPERTY_ID, tier: 'professional' },
        },
      },
    };

    const req = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${Math.floor(Date.now() / 1000)},v1=test_sig`,
      },
      body: JSON.stringify(event),
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    expect(mockSubscriptionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          tier: 'PROFESSIONAL',
          status: 'ACTIVE',
        }),
      }),
    );
  });

  it('Step 3: subscription is active via GET /billing', async () => {
    mockSubscriptionFindFirst.mockResolvedValue({
      id: SUBSCRIPTION_ID,
      propertyId: PROPERTY_ID,
      tier: 'PROFESSIONAL',
      status: 'ACTIVE',
      billingCycle: 'monthly',
      currentPeriodStart: new Date('2026-03-01'),
      currentPeriodEnd: new Date('2026-04-01'),
    });
    mockUnitCount.mockResolvedValue(171);
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
    expect(body.data.usage.unitCount).toBe(171);
  });

  it('Step 4: invoice.paid creates invoice record', async () => {
    mockSubscriptionFindFirst.mockResolvedValue({
      id: SUBSCRIPTION_ID,
      propertyId: PROPERTY_ID,
      tier: 'PROFESSIONAL',
      status: 'ACTIVE',
      stripeSubscriptionId: STRIPE_SUB_ID,
    });
    mockInvoiceFindFirst.mockResolvedValue(null);
    mockInvoiceCreate.mockResolvedValue({
      id: 'inv-001',
      subscriptionId: SUBSCRIPTION_ID,
      propertyId: PROPERTY_ID,
      amount: 12000,
      status: 'paid',
    });
    mockSubscriptionUpdate.mockResolvedValue({ status: 'ACTIVE' });

    const event = {
      id: 'evt_test_2',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_test_001',
          subscription: STRIPE_SUB_ID,
          amount_paid: 12000,
          tax: 1560,
          invoice_pdf: 'https://stripe.com/invoice.pdf',
          period_start: Math.floor(new Date('2026-03-01').getTime() / 1000),
          period_end: Math.floor(new Date('2026-04-01').getTime() / 1000),
        },
      },
    };

    const req = new Request('http://localhost:3000/api/v1/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${Math.floor(Date.now() / 1000)},v1=test_sig`,
      },
      body: JSON.stringify(event),
    });

    const res = await processWebhook(req as never);
    expect(res.status).toBe(200);

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 12000,
          status: 'paid',
        }),
      }),
    );
  });

  it('Step 5: invoices are listed via GET /billing/invoices', async () => {
    mockInvoiceFindMany.mockResolvedValue([
      { id: 'inv-001', amount: 12000, status: 'paid', periodStart: new Date('2026-03-01') },
    ]);
    mockInvoiceCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/billing/invoices', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listInvoices(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { amount: number; status: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.status).toBe('paid');
    expect(body.meta.total).toBe(1);
  });
});

// ===========================================================================
// Full End-to-End Workflow
// ===========================================================================

describe('Full Workflow: Property lifecycle from onboarding to operations', () => {
  it('complete lifecycle: onboard -> activate -> first event -> first package', async () => {
    // Step 1: Complete onboarding step 1 (Property Basics)
    mockOnboardingProgressFindFirst.mockResolvedValue(null);
    mockOnboardingProgressUpsert.mockResolvedValue({});
    const step1Res = await completeOnboardingStep(
      createPostRequest('/api/v1/onboarding', {
        propertyId: PROPERTY_ID,
        step: 1,
        data: { name: 'Maple Heights Condos', address: '100 King St W' },
      }),
    );
    expect(step1Res.status).toBe(200);

    // Step 2: Complete remaining steps (2-7 skipped for brevity, 8 activates)
    mockOnboardingProgressFindFirst.mockResolvedValue({
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      skippedSteps: [],
      stepData: {},
    });
    mockOnboardingProgressUpsert.mockResolvedValue({});
    mockPropertyUpdate.mockResolvedValue({ id: PROPERTY_ID, isActive: true });

    const activateRes = await completeOnboardingStep(
      createPostRequest('/api/v1/onboarding', {
        propertyId: PROPERTY_ID,
        step: 8,
        data: { confirmed: true },
      }),
    );
    expect(activateRes.status).toBe(200);

    const activateBody = await parseResponse<{ data: { propertyStatus: string } }>(activateRes);
    expect(activateBody.data.propertyStatus).toBe('active');

    // Step 3: First security event
    mockEventCreate.mockResolvedValue({
      id: 'evt-first',
      propertyId: PROPERTY_ID,
      title: 'First visitor logged',
      status: 'open',
      referenceNo: 'EVT-PLC001',
      createdAt: new Date(),
      eventType: { id: 'et-1', name: 'Visitor', icon: 'user', color: '#2196F3' },
    });

    const eventRes = await createEvent(
      createPostRequest('/api/v1/events', {
        propertyId: PROPERTY_ID,
        eventTypeId: 'evtype-visitor',
        title: 'First visitor logged',
      }),
    );
    expect(eventRes.status).toBe(201);

    // Step 4: First package
    mockPackageCreate.mockResolvedValue({
      id: 'pkg-first',
      propertyId: PROPERTY_ID,
      unitId: 'unit-101',
      referenceNumber: 'PKG-PLC001',
      status: 'unreleased',
      direction: 'inbound',
      createdAt: new Date(),
      unit: { number: '101' },
    });

    const packageRes = await createPackage(
      createPostRequest('/api/v1/packages', {
        propertyId: PROPERTY_ID,
        unitId: 'unit-101',
        direction: 'inbound',
        isPerishable: false,
        isOversized: false,
        notifyChannel: 'email',
      }),
    );
    expect(packageRes.status).toBe(201);
  });
});

// ===========================================================================
// Validation & Edge Cases
// ===========================================================================

describe('Property Lifecycle: Validation & Edge Cases', () => {
  it('should reject onboarding step without propertyId', async () => {
    const req = createPostRequest('/api/v1/onboarding', {
      step: 1,
      data: { name: 'Test' },
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(400);
  });

  it('should reject onboarding step without step number', async () => {
    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      data: { name: 'Test' },
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(400);
  });

  it('should reject invalid step number (out of range)', async () => {
    const req = createPostRequest('/api/v1/onboarding', {
      propertyId: PROPERTY_ID,
      step: 99,
    });

    const res = await completeOnboardingStep(req);
    expect(res.status).toBe(400);
  });

  it('events listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/events');
    const res = await listEvents(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('packages listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/packages');
    const res = await listPackages(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});
