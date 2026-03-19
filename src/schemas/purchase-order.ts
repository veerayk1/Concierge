import { z } from 'zod';

/**
 * Purchase Order schemas
 *
 * POs track building expenditures: HVAC repairs, lobby renovations, supplies.
 * Approval workflow ensures property_admin or board_member sign-off before
 * funds are committed.
 */

export const PO_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'ordered',
  'received',
  'closed',
] as const;

export type POStatus = (typeof PO_STATUSES)[number];

export const PO_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type POPriority = (typeof PO_PRIORITIES)[number];

export const PO_STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'], // can be sent back to draft
  approved: ['ordered'],
  ordered: ['received'],
  received: ['closed'],
  closed: [],
};

export const createPurchaseOrderItemSchema = z.object({
  description: z.string().min(1, 'Item description is required').max(500),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export type CreatePurchaseOrderItemInput = z.infer<typeof createPurchaseOrderItemSchema>;

export const createPurchaseOrderSchema = z.object({
  propertyId: z.string().uuid(),
  vendorId: z.string().uuid('Select a vendor'),
  budgetCategory: z.string().min(1, 'Budget category is required').max(100),
  priority: z.enum(PO_PRIORITIES).default('normal'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  expectedDelivery: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  items: z.array(createPurchaseOrderItemSchema).min(1, 'At least one item is required').max(50),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(PO_STATUSES).optional(),
  approvalNotes: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  priority: z.enum(PO_PRIORITIES).optional(),
  expectedDelivery: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable(),
  budgetCategory: z.string().max(100).optional(),
  vendorId: z.string().uuid().optional(),
});

export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>;

export const linkInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100),
  invoiceDate: z.string().datetime(),
  invoiceAmount: z.number().positive('Invoice amount must be positive'),
  attachmentKey: z.string().max(500).optional().or(z.literal('')),
});

export type LinkInvoiceInput = z.infer<typeof linkInvoiceSchema>;
