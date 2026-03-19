/**
 * Concierge — Stripe Billing Client
 *
 * Lightweight wrapper around the Stripe REST API using native fetch.
 * No stripe npm package — keeps the bundle lean and avoids native deps.
 *
 * All monetary values are in cents (CAD).
 *
 * @module server/billing
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return key;
}

function getStripeWebhookSecret(): string {
  const key = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  return key;
}

// ---------------------------------------------------------------------------
// Subscription Tier → Stripe Price mapping
// ---------------------------------------------------------------------------

export const TIER_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
};

export const TIER_FEATURES: Record<
  string,
  { maxUnits: number; maxUsers: number; features: string[] }
> = {
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

// ---------------------------------------------------------------------------
// Stripe API helpers (fetch-based)
// ---------------------------------------------------------------------------

interface StripeRequestOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, string>;
}

export async function stripeRequest<T>(options: StripeRequestOptions): Promise<T> {
  const { method, path, body } = options;
  const url = `${STRIPE_API_BASE}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getStripeSecretKey()}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const init: RequestInit = { method, headers };

  if (body && method !== 'GET') {
    init.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(url, init);
  const data = (await response.json()) as T;

  if (!response.ok) {
    const err = data as unknown as { error?: { message?: string; type?: string } };
    throw new StripeApiError(
      err?.error?.message || 'Stripe API error',
      response.status,
      err?.error?.type || 'api_error',
    );
  }

  return data;
}

export class StripeApiError extends Error {
  readonly statusCode: number;
  readonly stripeErrorType: string;

  constructor(message: string, statusCode: number, stripeErrorType: string) {
    super(message);
    this.name = 'StripeApiError';
    this.statusCode = statusCode;
    this.stripeErrorType = stripeErrorType;
  }
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string;
  subscription: string | null;
  metadata: Record<string, string>;
}

export async function createCheckoutSession(params: {
  propertyId: string;
  tier: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<StripeCheckoutSession> {
  const priceId = TIER_PRICE_IDS[params.tier];
  if (!priceId) throw new Error(`Unknown tier: ${params.tier}`);

  const body: Record<string, string> = {
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    'metadata[propertyId]': params.propertyId,
    'metadata[tier]': params.tier,
  };

  if (params.customerEmail) {
    body['customer_email'] = params.customerEmail;
  }

  return stripeRequest<StripeCheckoutSession>({
    method: 'POST',
    path: '/checkout/sessions',
    body,
  });
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  items: { data: Array<{ price: { id: string } }> };
  metadata: Record<string, string>;
}

export async function cancelSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>({
    method: 'POST',
    path: `/subscriptions/${subscriptionId}`,
    body: { cancel_at_period_end: 'true' },
  });
}

export async function reactivateSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>({
    method: 'POST',
    path: `/subscriptions/${subscriptionId}`,
    body: { cancel_at_period_end: 'false' },
  });
}

export async function getSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>({
    method: 'GET',
    path: `/subscriptions/${subscriptionId}`,
  });
}

// ---------------------------------------------------------------------------
// Webhook Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verifies a Stripe webhook signature using HMAC-SHA256.
 * Implements Stripe's v1 signature scheme without the stripe npm package.
 */
export async function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
): Promise<boolean> {
  const secret = getStripeWebhookSecret();

  // Parse the Stripe-Signature header
  const parts = signatureHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value ?? '';
    if (key === 'v1' && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  // Check timestamp tolerance (5 minutes)
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (age > 300) return false;

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatures.some((s) => timingSafeEqual(s, expectedSig));
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// Feature gating helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether a downgrade from current tier to target tier is allowed
 * given current usage levels.
 */
export function checkDowngradeRestrictions(
  currentTier: string,
  targetTier: string,
  usage: { unitCount: number; userCount: number; features: string[] },
): { allowed: boolean; reasons: string[] } {
  const targetLimits = TIER_FEATURES[targetTier];
  if (!targetLimits) return { allowed: false, reasons: [`Unknown tier: ${targetTier}`] };

  // Upgrading is always allowed
  const tierOrder = ['starter', 'professional', 'enterprise'];
  if (tierOrder.indexOf(targetTier) >= tierOrder.indexOf(currentTier)) {
    return { allowed: true, reasons: [] };
  }

  const reasons: string[] = [];

  if (usage.unitCount > targetLimits.maxUnits) {
    reasons.push(
      `Current unit count (${usage.unitCount}) exceeds ${targetTier} limit (${targetLimits.maxUnits})`,
    );
  }

  if (usage.userCount > targetLimits.maxUsers) {
    reasons.push(
      `Current user count (${usage.userCount}) exceeds ${targetTier} limit (${targetLimits.maxUsers})`,
    );
  }

  const lostFeatures = usage.features.filter((f) => !targetLimits.features.includes(f));
  if (lostFeatures.length > 0) {
    reasons.push(
      `Features in use that are not available in ${targetTier}: ${lostFeatures.join(', ')}`,
    );
  }

  return { allowed: reasons.length === 0, reasons };
}
