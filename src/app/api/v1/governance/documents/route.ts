/**
 * Board Governance — Document Sharing API
 *
 * GET  /api/v1/governance/documents — list governance documents
 * POST /api/v1/governance/documents — upload a governance document
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const GOVERNANCE_ROLES = ['board_member', 'property_admin', 'property_manager', 'super_admin'];

const createDocumentSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(300),
  type: z.enum([
    'meeting_minutes',
    'financial_statement',
    'resolution',
    'bylaw',
    'policy',
    'other',
  ]),
  filePath: z.string().min(1).max(1000),
  meetingId: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
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

    const type = searchParams.get('type');
    const meetingId = searchParams.get('meetingId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = { propertyId };
    if (type) where.type = type;
    if (meetingId) where.meetingId = meetingId;

    const [documents, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.governanceDocument.findMany as any)({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.governanceDocument.count({ where } as Parameters<
        typeof prisma.governanceDocument.count
      >[0]),
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
    console.error('GET /api/v1/governance/documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!GOVERNANCE_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only board members and admins can upload documents' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = await (prisma.governanceDocument.create as any)({
      data: {
        propertyId: input.propertyId,
        title: input.title,
        type: input.type,
        filePath: input.filePath,
        meetingId: input.meetingId || null,
        description: input.description || null,
        uploadedBy: auth.user.userId,
      },
    });

    return NextResponse.json({ data: document, message: 'Document uploaded.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/governance/documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upload document' },
      { status: 500 },
    );
  }
}
