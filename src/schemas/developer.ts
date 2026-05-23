import { z } from 'zod';

/**
 * Developer Portal schemas — API keys, webhooks (PRD 26)
 */

// ---------------------------------------------------------------------------
// API Key Scopes
// ---------------------------------------------------------------------------

export const API_KEY_SCOPES = ['read', 'write', 'admin'] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

// ---------------------------------------------------------------------------
// API Key Schemas
// ---------------------------------------------------------------------------

export const createApiKeySchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1, 'At least one scope is required'),
  expiresAt: z.string().datetime().optional().nullable(),
  rateLimit: z.number().int().min(1).max(100000).optional().default(1000),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// ---------------------------------------------------------------------------
// Webhook Schemas
// ---------------------------------------------------------------------------

export const WEBHOOK_EVENTS = [
  'event.created',
  'event.updated',
  'event.closed',
  'package.received',
  'package.released',
  'maintenance.created',
  'maintenance.updated',
  'maintenance.resolved',
  'booking.created',
  'booking.approved',
  'booking.rejected',
  'visitor.signed_in',
  'visitor.signed_out',
  'announcement.published',
  'unit.updated',
  'resident.created',
  'resident.updated',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Reject webhook URLs that point at internal infrastructure. Without this an
 * authenticated property_admin could register a webhook pointing at
 * 169.254.169.254 (AWS instance metadata), localhost, or RFC1918 ranges,
 * and the worker that fires webhook deliveries would happily request the
 * URL — turning every event into an SSRF probe. Verified pre-fix: all of
 * https://169.254.169.254/, https://localhost:8443/, https://127.0.0.1/,
 * https://[::1]/ accepted with 201.
 *
 * This is a first-line check at create/update time only. Full DNS-rebinding
 * protection requires re-resolving the host at every fire and validating
 * the resolved IP isn't private — out of scope here.
 */
function validateWebhookUrl(rawUrl: string): true | string {
  if (!rawUrl.startsWith('https://')) return 'Webhook URL must use HTTPS';
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'Webhook URL must be a valid URL';
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // Block loopback hostnames + IPv4/IPv6 loopback addresses
  if (host === 'localhost' || host === '0.0.0.0' || host === '::' || host === '::1') {
    return 'Webhook URL cannot point at localhost or loopback addresses';
  }

  // Block IPv4 literal ranges: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12,
  // 192.168.0.0/16, 169.254.0.0/16 (link-local incl. AWS metadata),
  // 100.64.0.0/10 (CGNAT), and 0.0.0.0/8
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4;
    const o1 = Number(a);
    const o2 = Number(b);
    if (o1 === 127 || o1 === 10 || o1 === 0) {
      return 'Webhook URL cannot point at private or loopback IP ranges';
    }
    if (o1 === 172 && o2 >= 16 && o2 <= 31) {
      return 'Webhook URL cannot point at private or loopback IP ranges';
    }
    if (o1 === 192 && o2 === 168) {
      return 'Webhook URL cannot point at private or loopback IP ranges';
    }
    if (o1 === 169 && o2 === 254) {
      return 'Webhook URL cannot point at link-local addresses';
    }
    if (o1 === 100 && o2 >= 64 && o2 <= 127) {
      return 'Webhook URL cannot point at carrier-grade NAT ranges';
    }
  }

  // Block IPv6 link-local fe80::/10 and unique-local fc00::/7
  if (host.startsWith('fe8') || host.startsWith('fc') || host.startsWith('fd')) {
    return 'Webhook URL cannot point at IPv6 link-local or unique-local addresses';
  }

  // Block .local and .internal TLDs that often resolve to private infra
  if (host.endsWith('.local') || host.endsWith('.internal')) {
    return 'Webhook URL cannot point at .local or .internal hostnames';
  }

  return true;
}

export const createWebhookSchema = z.object({
  propertyId: z.string().uuid(),
  url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => validateWebhookUrl(url) === true,
      (url) => ({ message: validateWebhookUrl(url) as string }),
    ),
  events: z.array(z.string().min(1)).min(1, 'At least one event is required'),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => validateWebhookUrl(url) === true,
      (url) => ({ message: validateWebhookUrl(url) as string }),
    )
    .optional(),
  events: z.array(z.string().min(1)).min(1, 'At least one event is required').optional(),
  status: z.enum(['active', 'paused']).optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
