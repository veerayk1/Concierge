/**
 * Board Governance — Board Member Directory API
 *
 * GET  /api/v1/governance/members — list board members
 * POST /api/v1/governance/members — add a board member
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const ADMIN_ROLES = ['property_admin', 'super_admin'];

const createMemberSchema = z
  .object({
    propertyId: z.string().uuid(),
    userId: z.string().min(1),
    name: z.string().min(1).max(200),
    email: z.string().email().max(254).optional(),
    boardRole: z.enum(['president', 'vice_president', 'secretary', 'treasurer', 'director']),
    termStart: z.string().min(1),
    termEnd: z.string().min(1),
  })
  .refine(
    (data) => {
      const start = new Date(data.termStart);
      const end = new Date(data.termEnd);
      return end > start;
    },
    { message: 'termEnd must be after termStart', path: ['termEnd'] },
  );

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

    const status = searchParams.get('status');
    const boardRole = searchParams.get('boardRole');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = { propertyId };
    if (status) where.status = status;
    if (boardRole) where.boardRole = boardRole;

    const [members, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.boardMemberRecord.findMany as any)({
        where,
        orderBy: { termStart: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.boardMemberRecord.count({ where } as Parameters<
        typeof prisma.boardMemberRecord.count
      >[0]),
    ]);

    return NextResponse.json({
      data: members,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/governance/members error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch board members' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only property admins can add board members' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member = await (prisma.boardMemberRecord.create as any)({
      data: {
        propertyId: input.propertyId,
        userId: input.userId,
        name: input.name,
        email: input.email || null,
        boardRole: input.boardRole,
        termStart: new Date(input.termStart),
        termEnd: new Date(input.termEnd),
        status: 'active',
      },
    });

    return NextResponse.json({ data: member, message: 'Board member added.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/governance/members error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add board member' },
      { status: 500 },
    );
  }
}
