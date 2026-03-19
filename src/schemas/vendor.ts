import { z } from 'zod';

/**
 * Vendor Compliance schemas — per BuildingLink's 5-status compliance dashboard
 */

export const COMPLIANCE_STATUSES = [
  'compliant',
  'not_compliant',
  'expiring',
  'expired',
  'not_tracking',
] as const;

export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const DOCUMENT_TYPES = ['insurance', 'license', 'wsib', 'bond', 'background_check'] as const;

export type VendorDocumentType = (typeof DOCUMENT_TYPES)[number];

export const createVendorSchema = z.object({
  propertyId: z.string().uuid(),
  companyName: z.string().min(1, 'Company name is required').max(200),
  serviceCategoryId: z.string().uuid('Select a service category'),
  contactName: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(200).optional().or(z.literal('')),
  streetAddress: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  stateProvince: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  serviceCategoryId: z.string().uuid().optional(),
  contactName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  streetAddress: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  stateProvince: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

export const createVendorDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().min(1).max(500),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateVendorDocumentInput = z.infer<typeof createVendorDocumentSchema>;
