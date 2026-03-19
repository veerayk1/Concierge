/**
 * Privacy / GDPR Endpoints
 *
 * GET    /api/v1/privacy?type=dsar&userId=...       — Data Subject Access Request export
 * GET    /api/v1/privacy?type=ropa                   — Record of Processing Activities
 * GET    /api/v1/privacy?type=retention              — Data retention status
 * GET    /api/v1/privacy?type=breach-detect          — Breach detection scan
 * POST   /api/v1/privacy  { action: "erasure" }      — Right to erasure (anonymize)
 * POST   /api/v1/privacy  { action: "consent" }      — Log consent grant/revoke
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import {
  exportUserAuditData,
  getDataProcessingRecords,
  flagRetentionOverdue,
  detectUnusualAccess,
  anonymizeUserAuditTrail,
  logConsent,
} from '@/server/audit';

// ---------------------------------------------------------------------------
// GET — Read-only GDPR queries
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const propertyId = searchParams.get('propertyId');

    if (!propertyId && type !== 'ropa') {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    switch (type) {
      // --- DSAR: Data Subject Access Request ---
      case 'dsar': {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { error: 'MISSING_USER', message: 'userId is required for DSAR export' },
            { status: 400 },
          );
        }
        const data = await exportUserAuditData(userId, propertyId!);
        return NextResponse.json({ data });
      }

      // --- ROPA: Record of Processing Activities ---
      case 'ropa': {
        const records = getDataProcessingRecords();
        return NextResponse.json({ data: records });
      }

      // --- Data Retention Status ---
      case 'retention': {
        const retentionDays = parseInt(searchParams.get('retentionDays') || '365', 10);
        const result = await flagRetentionOverdue(propertyId!, retentionDays);
        return NextResponse.json({ data: result });
      }

      // --- Breach Detection ---
      case 'breach-detect': {
        const windowMinutes = parseInt(searchParams.get('windowMinutes') || '60', 10);
        const thresholdCount = parseInt(searchParams.get('thresholdCount') || '30', 10);
        const piiThreshold = searchParams.get('piiThreshold')
          ? parseInt(searchParams.get('piiThreshold')!, 10)
          : undefined;

        const alerts = await detectUnusualAccess(propertyId!, {
          windowMinutes,
          thresholdCount,
          piiThreshold,
        });

        return NextResponse.json({
          data: {
            alerts,
            scannedAt: new Date().toISOString(),
            params: { windowMinutes, thresholdCount, piiThreshold },
          },
        });
      }

      default:
        return NextResponse.json(
          {
            error: 'INVALID_TYPE',
            message: 'Query parameter "type" must be one of: dsar, ropa, retention, breach-detect',
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('GET /api/v1/privacy error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process privacy request' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — GDPR write actions
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { action } = body as { action?: string };

    switch (action) {
      // --- Right to Erasure (Anonymization) ---
      case 'erasure': {
        const { userId, propertyId } = body as { userId?: string; propertyId?: string };
        if (!userId || !propertyId) {
          return NextResponse.json(
            { error: 'MISSING_FIELDS', message: 'userId and propertyId are required' },
            { status: 400 },
          );
        }

        const result = await anonymizeUserAuditTrail(userId, propertyId);
        return NextResponse.json({
          data: result,
          message: `Anonymized ${result.anonymizedCount} audit entries`,
        });
      }

      // --- Consent Tracking ---
      case 'consent': {
        const { userId, propertyId, consentType, granted } = body as {
          userId?: string;
          propertyId?: string;
          consentType?: string;
          granted?: boolean;
        };

        if (!userId || !propertyId || !consentType || granted === undefined) {
          return NextResponse.json(
            {
              error: 'MISSING_FIELDS',
              message: 'userId, propertyId, consentType, and granted are required',
            },
            { status: 400 },
          );
        }

        const ip = request.headers.get('x-forwarded-for') ?? undefined;
        const userAgent = request.headers.get('user-agent') ?? undefined;

        await logConsent({ userId, propertyId, consentType, granted, ip, userAgent });
        return NextResponse.json({
          message: `Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`,
        });
      }

      default:
        return NextResponse.json(
          {
            error: 'INVALID_ACTION',
            message: 'Body "action" must be one of: erasure, consent',
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('POST /api/v1/privacy error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process privacy action' },
      { status: 500 },
    );
  }
}
