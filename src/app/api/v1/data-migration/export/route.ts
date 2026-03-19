/**
 * Data Migration Export API — POST /api/v1/data-migration/export
 *
 * Per PRD 27: Exports property data in CSV or JSON format.
 * Supports DSAR-compliant personal data exports (PIPEDA/GDPR)
 * and full property data exports for administrators.
 *
 * @module app/api/v1/data-migration/export/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { exportPropertyData, ENTITY_FIELDS } from '@/server/data-migration';
import type { EntityType } from '@/server/data-migration';

const VALID_ENTITY_TYPES = Object.keys(ENTITY_FIELDS) as EntityType[];
const VALID_FORMATS = ['csv', 'json'] as const;

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      propertyId,
      entityTypes,
      format = 'json',
      dsarCompliant = false,
    } = body as {
      propertyId?: string;
      entityTypes?: string[];
      format?: string;
      dsarCompliant?: boolean;
    };

    if (!propertyId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!VALID_FORMATS.includes(format as (typeof VALID_FORMATS)[number])) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid format: ${format}. Must be one of: ${VALID_FORMATS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate entity types if provided
    if (entityTypes) {
      const invalid = entityTypes.filter((t) => !VALID_ENTITY_TYPES.includes(t as EntityType));
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: `Invalid entity types: ${invalid.join(', ')}. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
          },
          { status: 400 },
        );
      }
    }

    // For DSAR compliance, residents can only export their own data
    const isResident = auth.user.role === 'resident_owner' || auth.user.role === 'resident_tenant';
    const userId = dsarCompliant && isResident ? auth.user.userId : undefined;

    // Non-admin roles can only do DSAR exports of their own data
    if (
      !dsarCompliant &&
      !['super_admin', 'property_admin', 'property_manager'].includes(auth.user.role)
    ) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message:
            'Only administrators can perform full property exports. Use dsarCompliant: true for personal data export.',
        },
        { status: 403 },
      );
    }

    const result = await exportPropertyData({
      propertyId,
      entityTypes: entityTypes as EntityType[] | undefined,
      format: format as 'csv' | 'json',
      userId,
      dsarCompliant,
    });

    return NextResponse.json({
      data: {
        exportId: result.id,
        propertyId: result.propertyId,
        entityTypes: result.entityTypes,
        format: result.format,
        dsarCompliant: result.dsarCompliant,
        generatedAt: result.generatedAt.toISOString(),
        data: result.data,
      },
      message: dsarCompliant
        ? 'DSAR-compliant personal data export generated'
        : 'Property data export generated',
    });
  } catch (error) {
    console.error('POST /api/v1/data-migration/export error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Export failed' },
      { status: 500 },
    );
  }
}
