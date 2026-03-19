/**
 * Feature Flags API — per docs/tech/FEATURE-FLAGS.md
 * Per-property feature flag system backed by Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// Default flag definitions used when no DB records exist yet
const DEFAULT_FLAGS: Record<
  string,
  { name: string; description: string; enabled: boolean; tier: string }
> = {
  packages: {
    name: 'Package Management',
    description: 'Track incoming and outgoing packages',
    enabled: true,
    tier: 'starter',
  },
  maintenance: {
    name: 'Maintenance Requests',
    description: 'Submit and track maintenance requests',
    enabled: true,
    tier: 'starter',
  },
  security_console: {
    name: 'Security Console',
    description: 'Unified security event logging',
    enabled: true,
    tier: 'starter',
  },
  amenity_booking: {
    name: 'Amenity Booking',
    description: 'Reserve building amenities',
    enabled: true,
    tier: 'starter',
  },
  announcements: {
    name: 'Announcements',
    description: 'Multi-channel announcements',
    enabled: true,
    tier: 'starter',
  },
  shift_log: {
    name: 'Shift Log',
    description: 'Staff shift handoff notes',
    enabled: true,
    tier: 'starter',
  },
  visitor_management: {
    name: 'Visitor Management',
    description: 'Visitor sign-in and tracking',
    enabled: true,
    tier: 'professional',
  },
  key_management: {
    name: 'Key/FOB Management',
    description: 'Key and FOB inventory tracking',
    enabled: true,
    tier: 'professional',
  },
  parking: {
    name: 'Parking Management',
    description: 'Permits, violations, and spot tracking',
    enabled: true,
    tier: 'professional',
  },
  training_lms: {
    name: 'Training & LMS',
    description: 'Staff training courses with quizzes',
    enabled: false,
    tier: 'professional',
  },
  community: {
    name: 'Community',
    description: 'Classified ads and community features',
    enabled: false,
    tier: 'professional',
  },
  reports: {
    name: 'Reports & Analytics',
    description: 'Generate and export reports',
    enabled: true,
    tier: 'professional',
  },
  ai_features: {
    name: 'AI Features',
    description: 'AI-powered categorization and insights',
    enabled: false,
    tier: 'enterprise',
  },
  api_access: {
    name: 'Developer API',
    description: 'REST API and webhook access',
    enabled: false,
    tier: 'enterprise',
  },
  white_label: {
    name: 'White Label',
    description: 'Custom branding and domain',
    enabled: false,
    tier: 'enterprise',
  },
  sso: {
    name: 'Single Sign-On',
    description: 'SAML/OIDC authentication',
    enabled: false,
    tier: 'enterprise',
  },
};

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch all feature flags from the database
    const dbFlags = await prisma.featureFlag.findMany();

    // Build a map of DB flags keyed by flag key
    const dbFlagMap = new Map(dbFlags.map((f) => [f.key, f]));

    // Merge DB records with defaults, applying per-property overrides
    const flags = Object.entries(DEFAULT_FLAGS).map(([key, defaultDef]) => {
      const dbFlag = dbFlagMap.get(key);

      if (dbFlag) {
        // Check for a property-specific override in the JSONB column
        const overrides = (dbFlag.propertyOverrides ?? {}) as Record<string, boolean>;
        const propertyOverride = overrides[propertyId];
        const enabled = propertyOverride !== undefined ? propertyOverride : dbFlag.defaultValue;

        return {
          key,
          name: defaultDef.name,
          description: dbFlag.description ?? defaultDef.description,
          enabled,
          tier: dbFlag.tierRequirement?.toLowerCase() ?? defaultDef.tier,
        };
      }

      // No DB record — fall back to hardcoded default
      return {
        key,
        ...defaultDef,
      };
    });

    return NextResponse.json({ data: flags });
  } catch (error) {
    console.error('GET /api/v1/feature-flags error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch flags' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, key, enabled } = body;

    if (!propertyId || !key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId, key, and enabled are required' },
        { status: 400 },
      );
    }

    // Upsert the flag record, then set the property-specific override
    const existing = await prisma.featureFlag.findUnique({ where: { key } });

    const defaultDef = DEFAULT_FLAGS[key];
    const currentOverrides = (existing?.propertyOverrides ?? {}) as Record<string, boolean>;
    const updatedOverrides = { ...currentOverrides, [propertyId]: enabled };

    await prisma.featureFlag.upsert({
      where: { key },
      update: {
        propertyOverrides: updatedOverrides,
      },
      create: {
        key,
        description: defaultDef?.description ?? null,
        defaultValue: defaultDef?.enabled ?? false,
        propertyOverrides: updatedOverrides,
      },
    });

    return NextResponse.json({
      message: `Feature flag "${key}" ${enabled ? 'enabled' : 'disabled'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/feature-flags error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update flag' },
      { status: 500 },
    );
  }
}
