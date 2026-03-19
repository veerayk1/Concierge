/**
 * Vendor Compliance Status Calculator
 *
 * Implements BuildingLink's 5-status compliance model:
 * - compliant: all required docs present and valid
 * - not_compliant: missing required documents
 * - expiring: at least one document expiring within 30 days
 * - expired: at least one document past expiry
 * - not_tracking: no documents uploaded (default)
 */

import type { ComplianceStatus } from '@/schemas/vendor';

const EXPIRY_WARNING_DAYS = 30;

export interface VendorDocumentForCompliance {
  documentType: string;
  expiresAt: Date | string | null;
}

/**
 * Calculates vendor compliance status from their documents.
 *
 * Priority (highest to lowest):
 * 1. expired — any doc past expiry date
 * 2. not_compliant — missing required doc types (insurance, license)
 * 3. expiring — any doc expiring within 30 days
 * 4. compliant — all required docs present and valid
 * 5. not_tracking — no documents at all
 */
export function calculateComplianceStatus(
  documents: VendorDocumentForCompliance[],
  now: Date = new Date(),
): ComplianceStatus {
  if (documents.length === 0) {
    return 'not_tracking';
  }

  const requiredTypes = ['insurance', 'license'];
  const docTypeSet = new Set(documents.map((d) => d.documentType));

  let hasExpired = false;
  let hasExpiring = false;

  for (const doc of documents) {
    if (doc.expiresAt) {
      const expiryDate = new Date(doc.expiresAt);
      if (expiryDate < now) {
        hasExpired = true;
      } else {
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
          hasExpiring = true;
        }
      }
    }
  }

  if (hasExpired) {
    return 'expired';
  }

  const missingRequired = requiredTypes.some((type) => !docTypeSet.has(type));
  if (missingRequired) {
    return 'not_compliant';
  }

  if (hasExpiring) {
    return 'expiring';
  }

  return 'compliant';
}

/**
 * Returns vendors with documents expiring within the next N days.
 */
export function getExpiringDocumentFilter(
  days: number = EXPIRY_WARNING_DAYS,
  now: Date = new Date(),
) {
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  return {
    documents: {
      some: {
        expiresAt: {
          gte: now,
          lte: futureDate,
        },
      },
    },
  };
}

export { EXPIRY_WARNING_DAYS };
