import { z } from 'zod';

/**
 * Inspection schemas — per CLAUDE.md Phase 2
 * Mobile-first with checklists, GPS verification
 */

export const INSPECTION_CATEGORIES = [
  'fire_safety',
  'hvac',
  'elevator',
  'pool',
  'general',
  'plumbing',
  'electrical',
  'structural',
  'move_in',
  'move_out',
] as const;

export type InspectionCategory = (typeof INSPECTION_CATEGORIES)[number];

export const INSPECTION_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const CHECKLIST_ITEM_TYPES = ['pass_fail', 'numeric', 'text', 'photo'] as const;

export type ChecklistItemType = (typeof CHECKLIST_ITEM_TYPES)[number];

// ---------------------------------------------------------------------------
// Template schemas
// ---------------------------------------------------------------------------

export const templateItemSchema = z.object({
  name: z.string().min(1).max(200),
  required: z.boolean().default(true),
  type: z.enum(CHECKLIST_ITEM_TYPES),
});

export const createInspectionTemplateSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  category: z.enum(INSPECTION_CATEGORIES),
  description: z.string().max(2000).optional().or(z.literal('')),
  items: z.array(templateItemSchema).min(1, 'At least one checklist item is required'),
});

export type CreateInspectionTemplateInput = z.infer<typeof createInspectionTemplateSchema>;

// ---------------------------------------------------------------------------
// Inspection schemas
// ---------------------------------------------------------------------------

export const createInspectionSchema = z.object({
  propertyId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  recurringTaskId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  category: z.enum(INSPECTION_CATEGORIES),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  inspectorId: z.string().uuid().optional(),
  location: z.string().max(200).optional().or(z.literal('')),
  gpsLatitude: z.number().min(-90).max(90).optional(),
  gpsLongitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  /** Checklist items — provided when not using a template */
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        required: z.boolean().default(true),
        type: z.enum(CHECKLIST_ITEM_TYPES),
      }),
    )
    .optional(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;

export const updateInspectionSchema = z.object({
  status: z.enum(INSPECTION_STATUSES).optional(),
  inspectorId: z.string().uuid().optional(),
  gpsLatitude: z.number().min(-90).max(90).optional(),
  gpsLongitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
});

export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;

// ---------------------------------------------------------------------------
// Inspection item completion schema
// ---------------------------------------------------------------------------

export const completeInspectionItemSchema = z.object({
  value: z.string().max(500).optional(),
  numericValue: z.number().optional(),
  passed: z.boolean().optional(),
  photoUrl: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type CompleteInspectionItemInput = z.infer<typeof completeInspectionItemSchema>;
