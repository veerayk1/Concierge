import { z } from 'zod';

/**
 * Asset Management schemas — tracking furniture, appliances, IT equipment,
 * and building systems with depreciation and audit capabilities.
 */

// ---------------------------------------------------------------------------
// Asset Categories & Statuses
// ---------------------------------------------------------------------------

export const ASSET_CATEGORIES = ['furniture', 'appliance', 'it', 'building_system'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_STATUSES = ['in_use', 'in_storage', 'under_repair', 'disposed'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSIGNMENT_TYPES = ['common_area', 'unit'] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const createAssetSchema = z.object({
  propertyId: z.string().uuid(),
  tagNumber: z.string().min(1, 'Tag number is required').max(50),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum(ASSET_CATEGORIES),
  status: z.enum(ASSET_STATUSES).default('in_use'),
  location: z.string().min(1, 'Location is required').max(200),
  assignmentType: z.enum(ASSIGNMENT_TYPES).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchaseValue: z.number().min(0).optional().nullable(),
  usefulLifeYears: z.number().int().min(1).max(100).optional().nullable(),
  manufacturer: z.string().max(200).optional().or(z.literal('')),
  modelNumber: z.string().max(200).optional().or(z.literal('')),
  serialNumber: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  category: z.enum(ASSET_CATEGORIES).optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  location: z.string().min(1).max(200).optional(),
  assignmentType: z.enum(ASSIGNMENT_TYPES).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  purchaseValue: z.number().min(0).optional().nullable(),
  usefulLifeYears: z.number().int().min(1).max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const assetAuditSchema = z.object({
  propertyId: z.string().uuid(),
  auditDate: z.string().datetime(),
  conductedById: z.string().uuid(),
  findings: z.array(
    z.object({
      assetId: z.string().uuid(),
      found: z.boolean(),
      condition: z.enum(['good', 'fair', 'poor', 'missing']).optional(),
      notes: z.string().max(500).optional(),
    }),
  ),
});

export type AssetAuditInput = z.infer<typeof assetAuditSchema>;

// ---------------------------------------------------------------------------
// Depreciation Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates straight-line depreciation for an asset.
 *
 * @param purchaseValue - Original purchase price
 * @param usefulLifeYears - Expected useful life in years
 * @param purchaseDate - Date of purchase
 * @param asOfDate - Date to calculate depreciation as of (default: now)
 * @returns Object with current book value, accumulated depreciation, annual rate
 */
export function calculateDepreciation(
  purchaseValue: number,
  usefulLifeYears: number,
  purchaseDate: Date | string,
  asOfDate: Date = new Date(),
): {
  currentValue: number;
  accumulatedDepreciation: number;
  annualDepreciation: number;
  percentDepreciated: number;
  isFullyDepreciated: boolean;
} {
  const purchase = new Date(purchaseDate);
  const annualDepreciation = purchaseValue / usefulLifeYears;
  const yearsElapsed = (asOfDate.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const clampedYears = Math.min(Math.max(yearsElapsed, 0), usefulLifeYears);
  const accumulatedDepreciation = Math.round(annualDepreciation * clampedYears * 100) / 100;
  const currentValue = Math.max(
    Math.round((purchaseValue - accumulatedDepreciation) * 100) / 100,
    0,
  );
  const percentDepreciated = Math.min(
    Math.round((clampedYears / usefulLifeYears) * 10000) / 100,
    100,
  );

  return {
    currentValue,
    accumulatedDepreciation,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    percentDepreciated,
    isFullyDepreciated: clampedYears >= usefulLifeYears,
  };
}
