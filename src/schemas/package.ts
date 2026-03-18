import { z } from 'zod';

/**
 * Package schemas — per PRD 04 Package Management
 */

export const createPackageSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid('Select a unit'),
  residentId: z.string().uuid().optional().or(z.literal('')),
  direction: z.enum(['incoming', 'outgoing']).default('incoming'),
  courierId: z.string().uuid().optional().or(z.literal('')),
  courierOtherName: z.string().max(100).optional().or(z.literal('')),
  trackingNumber: z.string().max(100).optional().or(z.literal('')),
  parcelCategoryId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  storageSpotId: z.string().uuid().optional().or(z.literal('')),
  isPerishable: z.boolean().default(false),
  isOversized: z.boolean().default(false),
  notifyChannel: z
    .enum(['default', 'email', 'sms', 'push', 'voice', 'all', 'none'])
    .default('default'),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

export const releasePackageSchema = z.object({
  releasedToName: z.string().min(2, 'Name is required').max(200),
  idVerified: z.boolean().default(false),
  isAuthorizedDelegate: z.boolean().default(false),
  releaseComments: z.string().max(500).optional().or(z.literal('')),
});

export type ReleasePackageInput = z.infer<typeof releasePackageSchema>;

export const batchCreatePackageSchema = z.object({
  propertyId: z.string().uuid(),
  packages: z
    .array(createPackageSchema.omit({ propertyId: true }))
    .min(1)
    .max(20),
});

export type BatchCreatePackageInput = z.infer<typeof batchCreatePackageSchema>;
