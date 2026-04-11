/**
 * Consent Documents API — Electronic Signature & Tracking
 * Per GAP 7.2 — Electronic consent document tracking with IP and user agent capture
 *
 * GET  /api/v1/consent-documents — List consent documents for a user/property
 * POST /api/v1/consent-documents — Create/sign a consent document
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/consent-documents
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');
    const documentType = searchParams.get('documentType');
    const signed = searchParams.get('signed');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
    };

    // Users can only view their own documents unless they're admin
    const isAdmin = ['property_admin', 'property_manager', 'super_admin'].includes(auth.user.role);
    if (!isAdmin) {
      where.userId = auth.user.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (documentType) where.documentType = documentType;
    if (signed === 'true') where.signedAt = { not: null };
    if (signed === 'false') where.signedAt = null;

    const [documents, total] = await Promise.all([
      prisma.consentDocument.findMany({
        where,
        include: {
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.consentDocument.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/consent-documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch consent documents' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/consent-documents — Create/sign consent document
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, userId, documentType, documentUrl, expiresAt } = body;

    if (!propertyId || !userId || !documentType || !documentUrl) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'propertyId, userId, documentType, and documentUrl are required',
        },
        { status: 400 },
      );
    }

    // Capture IP and user agent from request (for audit trail)
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    const document = await prisma.consentDocument.create({
      data: {
        propertyId,
        userId,
        documentType: stripControlChars(stripHtml(documentType)),
        documentUrl: stripControlChars(stripHtml(documentUrl)),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        signedAt: new Date(),
        ipAddress,
        userAgent,
        isRevoked: false,
      },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        data: document,
        message: `Consent document "${documentType}" created and signed for ${user.firstName} ${user.lastName}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/consent-documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create consent document' },
      { status: 500 },
    );
  }
}
