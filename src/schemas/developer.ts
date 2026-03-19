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

export const createWebhookSchema = z.object({
  propertyId: z.string().uuid(),
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((url) => url.startsWith('https://'), {
      message: 'Webhook URL must use HTTPS',
    }),
  events: z.array(z.string().min(1)).min(1, 'At least one event is required'),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((url) => url.startsWith('https://'), {
      message: 'Webhook URL must use HTTPS',
    })
    .optional(),
  events: z.array(z.string().min(1)).min(1, 'At least one event is required').optional(),
  status: z.enum(['active', 'paused']).optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
