import { z } from 'zod';

/**
 * Maintenance Request schemas — per PRD 05
 */
export const createMaintenanceSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid('Select a unit'),
  categoryId: z.string().uuid('Select a category').optional().or(z.literal('')),
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  permissionToEnter: z.boolean().default(false),
  entryInstructions: z.string().max(1000).optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  /** GAP 5.1 — Hide from resident portal (default: false = visible to residents) */
  hideFromResident: z.boolean().default(false),
  /** S3 keys of files uploaded via presigned URL (max 10 attachments). */
  attachments: z
    .array(
      z.object({
        key: z.string().min(1),
        fileName: z.string().min(1).max(255),
        contentType: z.string().min(1).max(100),
        fileSizeBytes: z.number().int().positive(),
      }),
    )
    .max(10)
    .optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const updateMaintenanceSchema = z.object({
  status: z
    .enum(['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'resolved', 'closed'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  assignedVendorId: z.string().uuid().optional(),
  description: z.string().max(4000).optional(),
  comments: z.string().max(2000).optional(),
  /** Required when putting a request on hold. */
  holdReason: z.string().min(1).max(500).optional(),
  /** Required when completing a request. */
  resolutionNotes: z.string().min(1).max(2000).optional(),
  /** GAP 5.1 — Toggle resident visibility on existing requests. */
  hideFromResident: z.boolean().optional(),
  /** Attach photos/documents to an existing request. */
  attachments: z
    .array(
      z.object({
        key: z.string().min(1),
        fileName: z.string().min(1).max(255),
        contentType: z.string().min(1).max(100),
        fileSizeBytes: z.number().int().positive(),
      }),
    )
    .max(10)
    .optional(),
});

export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;

export const createMaintenanceCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(2000),
  visibleToResident: z.boolean().default(true),
});

export type CreateMaintenanceCommentInput = z.infer<typeof createMaintenanceCommentSchema>;
