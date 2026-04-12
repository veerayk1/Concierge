/**
 * Module Guard — Blocks API requests for disabled modules
 *
 * Usage in route handlers:
 *   const moduleCheck = await requireModule(request, 'amenity_booking');
 *   if (moduleCheck) return moduleCheck; // Returns 403 if module is disabled
 *
 * This checks the FeatureFlag table for per-property overrides.
 * If no DB record exists, falls back to DEFAULT_FLAGS from the feature-flags API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import type { ModuleKey } from '@/lib/module-config';

// Default enabled status for each module (matches DEFAULT_FLAGS in feature-flags/route.ts)
const MODULE_DEFAULTS: Record<string, boolean> = {
  packages: true,
  maintenance: true,
  security_console: true,
  amenity_booking: true,
  announcements: true,
  shift_log: true,
  visitor_management: true,
  key_management: true,
  parking: true,
  training_lms: false,
  community: false,
  reports: true,
  ai_features: false,
  api_access: false,
  white_label: false,
  sso: false,
};

/**
 * Check if a module is enabled for a property. Returns null if enabled,
 * or a 403 NextResponse if disabled.
 */
export async function requireModule(
  request: NextRequest,
  moduleKey: ModuleKey,
): Promise<NextResponse | null> {
  try {
    // Extract propertyId from query string or body
    const url = new URL(request.url);
    const propertyId =
      url.searchParams.get('propertyId') ||
      request.headers.get('x-demo-propertyId') ||
      '94fd28bd-37ce-4fb1-952e-4c182634fc90'; // Demo fallback property

    // Check the DB for this flag
    const flag = await prisma.featureFlag.findUnique({
      where: { key: moduleKey },
    });

    let enabled: boolean;

    if (flag) {
      const overrides = (flag.propertyOverrides ?? {}) as Record<string, boolean>;
      const propertyOverride = overrides[propertyId];
      enabled = propertyOverride !== undefined ? propertyOverride : flag.defaultValue;
    } else {
      enabled = MODULE_DEFAULTS[moduleKey] ?? true;
    }

    if (!enabled) {
      return NextResponse.json(
        {
          error: 'MODULE_DISABLED',
          message: `The "${moduleKey}" module is not enabled for this property.`,
        },
        { status: 403 },
      );
    }

    return null; // Module is enabled, proceed
  } catch {
    // On error, allow the request through (fail-open for module checks)
    return null;
  }
}
