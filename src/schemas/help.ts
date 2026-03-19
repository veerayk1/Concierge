import { z } from 'zod';

/**
 * Help Center schemas — per PRD 25 Help Center & Knowledge Base
 */

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const HELP_CATEGORIES = [
  'getting_started',
  'packages',
  'maintenance',
  'amenities',
  'security',
  'admin',
] as const;

export type HelpCategory = (typeof HELP_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const createHelpArticleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  body: z.string().min(50, 'Body must be at least 50 characters'),
  isFeatured: z.boolean().default(false),
  category: z.enum(HELP_CATEGORIES),
  tags: z.array(z.string().max(50)).max(10).default([]),
  sortOrder: z.number().int().min(0).default(0),
  contextPages: z.array(z.string().max(100)).max(20).default([]),
  roleVisibility: z.array(z.string()).default([]),
  locale: z.string().max(10).default('en'),
  status: z.enum(['draft', 'in_review', 'published', 'archived']).default('draft'),
});

export type CreateHelpArticleInput = z.infer<typeof createHelpArticleSchema>;

export const updateHelpArticleSchema = createHelpArticleSchema.partial();

export type UpdateHelpArticleInput = z.infer<typeof updateHelpArticleSchema>;

// ---------------------------------------------------------------------------
// Support Tickets
// ---------------------------------------------------------------------------

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const createSupportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  category: z.enum(HELP_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES).default('medium'),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

export const updateSupportTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z.string().uuid().optional(),
});

export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;

// ---------------------------------------------------------------------------
// Ticket Comments
// ---------------------------------------------------------------------------

export const createTicketCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required').max(4000),
});

export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;
