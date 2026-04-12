import { z } from 'zod';

/**
 * Equipment Lifecycle schemas — per CLAUDE.md Phase 2
 */

export const EQUIPMENT_CATEGORIES = [
  'HVAC',
  'plumbing',
  'electrical',
  'fire_safety',
  'elevator',
  'security',
  'other',
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export const EQUIPMENT_STATUSES = [
  'active',
  'needs_repair',
  'under_repair',
  'decommissioned',
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

/** Valid status transitions for the equipment lifecycle. */
export const EQUIPMENT_STATUS_TRANSITIONS: Record<EquipmentStatus, EquipmentStatus[]> = {
  active: ['needs_repair', 'decommissioned'],
  needs_repair: ['under_repair', 'decommissioned'],
  under_repair: ['active', 'decommissioned'],
  decommissioned: [],
};

export const createEquipmentSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  category: z.enum(EQUIPMENT_CATEGORIES).default('other'),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  manufacturer: z.string().max(100).optional().or(z.literal('')),
  modelNumber: z.string().max(100).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  installDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  purchaseDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  purchasePrice: z.number().nonnegative().optional(),
  warrantyExpiry: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  expectedLifespanYears: z.number().int().positive().optional(),
  nextInspectionDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().date().optional()),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export const updateEquipmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(EQUIPMENT_CATEGORIES).optional(),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  manufacturer: z.string().max(100).optional().or(z.literal('')),
  modelNumber: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(EQUIPMENT_STATUSES).optional(),
  location: z.string().max(200).optional().or(z.literal('')),
  installDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  purchaseDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  purchasePrice: z.number().nonnegative().optional(),
  warrantyExpiry: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  expectedLifespanYears: z.number().int().positive().optional(),
  nextInspectionDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().date().optional()),
  nextServiceDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().date().optional()),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;

export const bulkImportRowSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(EQUIPMENT_CATEGORIES).default('other'),
  serialNumber: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  installDate: z.string().optional(),
  purchasePrice: z
    .union([z.number(), z.string().transform((v) => (v === '' ? undefined : Number(v)))])
    .optional(),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;
