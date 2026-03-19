import { z } from 'zod';

/**
 * Alteration/Renovation Project schemas
 *
 * Tracks renovation projects with permit/insurance compliance,
 * momentum indicators (OK/Slow/Stalled/Stopped), and multi-step
 * admin approval workflow.
 */

// ---------------------------------------------------------------------------
// Momentum indicator — calculated from last activity date
// ---------------------------------------------------------------------------

export const MOMENTUM_THRESHOLDS = {
  OK: 7, // days
  SLOW: 14,
  STALLED: 30,
  // STOPPED: 30+ days
} as const;

export type MomentumIndicator = 'ok' | 'slow' | 'stalled' | 'stopped';

/**
 * Calculate momentum indicator based on days since last activity.
 * Per BuildingLink's alteration tracking pattern.
 */
export function calculateMomentum(lastActivityDate: Date | string): MomentumIndicator {
  const lastActivity = new Date(lastActivityDate);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= MOMENTUM_THRESHOLDS.OK) return 'ok';
  if (diffDays <= MOMENTUM_THRESHOLDS.SLOW) return 'slow';
  if (diffDays <= MOMENTUM_THRESHOLDS.STALLED) return 'stalled';
  return 'stopped';
}

// ---------------------------------------------------------------------------
// Status lifecycle
// ---------------------------------------------------------------------------

export const ALTERATION_STATUSES = [
  'submitted',
  'under_review',
  'approved',
  'declined',
  'in_progress',
  'completed',
] as const;

export type AlterationStatus = (typeof ALTERATION_STATUSES)[number];

export const VALID_TRANSITIONS: Record<AlterationStatus, readonly AlterationStatus[]> = {
  submitted: ['under_review', 'declined'],
  under_review: ['approved', 'declined'],
  approved: ['in_progress', 'declined'],
  declined: [],
  in_progress: ['completed'],
  completed: [],
};

// ---------------------------------------------------------------------------
// Required documents
// ---------------------------------------------------------------------------

export const REQUIRED_DOCUMENT_TYPES = ['insurance_certificate', 'permit', 'floor_plan'] as const;

export type RequiredDocumentType = (typeof REQUIRED_DOCUMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Create alteration schema
// ---------------------------------------------------------------------------

export const createAlterationSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid('Select a unit'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  expectedStartDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  expectedEndDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  contractorVendorId: z.string().uuid().optional(),
  scope: z.string().max(2000).optional(),
});

export type CreateAlterationInput = z.infer<typeof createAlterationSchema>;

// ---------------------------------------------------------------------------
// Update alteration schema
// ---------------------------------------------------------------------------

export const updateAlterationSchema = z.object({
  status: z.enum(ALTERATION_STATUSES).optional(),
  declineReason: z.string().min(1).max(2000).optional(),
  description: z.string().max(4000).optional(),
  expectedEndDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  actualCompletionDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  contractorVendorId: z.string().uuid().optional(),
  reviewStep: z.enum(['documents_check', 'board_review', 'final_approval']).optional(),
  reviewNotes: z.string().max(2000).optional(),
  inspectionDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  inspectionNotes: z.string().max(2000).optional(),
});

export type UpdateAlterationInput = z.infer<typeof updateAlterationSchema>;

// ---------------------------------------------------------------------------
// Upload document schema
// ---------------------------------------------------------------------------

export const uploadAlterationDocumentSchema = z.object({
  documentType: z.enum([...REQUIRED_DOCUMENT_TYPES, 'other'] as const),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().min(1).max(500),
  fileSizeBytes: z.number().int().positive(),
  contentType: z.string().min(1).max(100),
});

export type UploadAlterationDocumentInput = z.infer<typeof uploadAlterationDocumentSchema>;
