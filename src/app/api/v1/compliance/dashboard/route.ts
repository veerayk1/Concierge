/**
 * Compliance Dashboard API — Monitoring overview with health scores
 * Per PRD 28
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { calculateComplianceDashboard } from '@/server/compliance';
import { handleDemoRequest } from '@/server/demo';

// ---------------------------------------------------------------------------
// GET /api/v1/compliance/dashboard — Compliance monitoring overview
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const dashboard = await calculateComplianceDashboard(propertyId);

    return NextResponse.json({
      data: dashboard,
    });
  } catch (error) {
    console.error('GET /api/v1/compliance/dashboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to calculate compliance dashboard' },
      { status: 500 },
    );
  }
}
