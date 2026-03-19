/**
 * Audit Log API — Enhanced with filtering, export, and GDPR compliance
 *
 * GET  /api/v1/audit-log         — Query audit entries with filters
 * GET  /api/v1/audit-log?export=dsar&userId=...  — DSAR export for a user
 *
 * Per PRD 16 Settings & Admin, PRD 28 Compliance Reports
 * Immutable log of all administrative actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { queryAuditEntries, exportUserAuditData } from '@/server/audit';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 200);
    const exportType = searchParams.get('export');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // --- DSAR Export ---
    if (exportType === 'dsar') {
      if (!userId) {
        return NextResponse.json(
          { error: 'MISSING_USER', message: 'userId is required for DSAR export' },
          { status: 400 },
        );
      }

      const dsarData = await exportUserAuditData(userId, propertyId);
      return NextResponse.json({ data: dsarData });
    }

    // --- Standard Query with Filters ---
    const result = await queryAuditEntries({
      propertyId,
      userId: userId ?? undefined,
      action: action ?? undefined,
      resource: resource ?? undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/v1/audit-log error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch audit log' },
      { status: 500 },
    );
  }
}
