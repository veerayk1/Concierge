import { z } from 'zod';

/**
 * Create Event schema — per PRD 03 Security Console
 * Unified event model: every log entry is an "Event" with a configurable type
 */
export const createEventSchema = z.object({
  propertyId: z.string().uuid(),
  eventTypeId: z.string().min(1, 'Select an event type'),
  unitId: z.string().uuid().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(4000).optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'medium', 'high', 'urgent']).default('normal'),
  customFields: z.record(z.unknown()).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'medium', 'high', 'urgent']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
