/**
 * Feature Flags API — per docs/tech/FEATURE-FLAGS.md
 * Per-property feature flag system
 */

import { NextRequest, NextResponse } from 'next/server';

// Feature flags stored in-memory for now (will be DB-backed)
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
    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // In production, merge property-specific overrides with defaults
    const flags = Object.entries(DEFAULT_FLAGS).map(([key, flag]) => ({
      key,
      ...flag,
    }));

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
    const body = await request.json();
    const { propertyId, key, enabled } = body;

    if (!propertyId || !key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId, key, and enabled are required' },
        { status: 400 },
      );
    }

    // TODO: Store override in database
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
