/**
 * User Management API — List & Create Users
 * Per PRD 08 Section 3.1.1 (Create) and 3.1.10 (Directory)
 *
 * GET  /api/v1/users — List users with filters, search, pagination
 * POST /api/v1/users — Create a new user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { createUserSchema } from '@/schemas/user';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmail } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';

// ---------------------------------------------------------------------------
// GET /api/v1/users — List users
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    // Auth: Only admins and managers can list users
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'property_manager', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const assistanceRequired = searchParams.get('assistanceRequired');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
      userProperties: {
        some: {
          propertyId,
          deletedAt: null,
          ...(role ? { role: { slug: role } } : {}),
        },
      },
    };

    // Search across name and email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // GAP 8.2: Filter by assistanceRequired for emergency reports
    if (assistanceRequired === 'true') {
      where.assistanceRequired = true;
    } else if (assistanceRequired === 'false') {
      where.assistanceRequired = false;
    }

    // Status filter
    if (status === 'active') {
      where.isActive = true;
      where.activatedAt = { not: null };
    } else if (status === 'suspended') {
      where.isActive = false;
      where.activatedAt = { not: null };
    } else if (status === 'pending') {
      where.activatedAt = null;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          mfaEnabled: true,
          isActive: true,
          activatedAt: true,
          lastLoginAt: true,
          createdAt: true,
          userProperties: {
            where: { propertyId, deletedAt: null },
            select: {
              role: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { firstName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // DEV: Fetch temporary passwords via raw SQL (column exists in DB but not in Prisma client)
    const userIds = users.map((u) => u.id);
    let tempPasswords: Record<string, string> = {};
    if (userIds.length > 0 && process.env.NODE_ENV !== 'production') {
      try {
        const rawRows = await prisma.$queryRawUnsafe<
          Array<{ id: string; temporaryPassword: string | null }>
        >(`SELECT id, "temporaryPassword" FROM users WHERE id = ANY($1::uuid[])`, userIds);
        tempPasswords = Object.fromEntries(
          rawRows.filter((r) => r.temporaryPassword).map((r) => [r.id, r.temporaryPassword!]),
        );
      } catch {
        // Column may not exist yet — silently skip
      }
    }

    // Transform to flat response
    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      mfaEnabled: u.mfaEnabled,
      isActive: u.isActive,
      status: !u.activatedAt ? 'pending' : u.isActive ? 'active' : 'suspended',
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      role: u.userProperties[0]?.role ?? null,
      temporaryPassword: tempPasswords[u.id] ?? null, // DEV: for testing
    }));

    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/users error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch users' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/users — Create user
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    // Auth: Only Super Admin and Property Admin can create accounts (PRD 08 Section 3.1.1)
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Check email uniqueness at this property
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email.toLowerCase(),
        deletedAt: null,
        userProperties: {
          some: { propertyId: input.propertyId, deletedAt: null },
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'EMAIL_EXISTS',
          message: 'This email is already in use at this property',
          fields: { email: ['This email is already in use at this property'] },
        },
        { status: 409 },
      );
    }

    // Generate temporary password
    const tempPassword = nanoid(16);
    const passwordHash = await hashPassword(tempPassword);

    // Create user + property assignment in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          firstName: stripControlChars(stripHtml(input.firstName)),
          lastName: stripControlChars(stripHtml(input.lastName)),
          phone: input.phone || null,
          isActive: true,
          // activatedAt is null until user completes onboarding
        },
      });

      await tx.userProperty.create({
        data: {
          userId: newUser.id,
          propertyId: input.propertyId,
          roleId: input.roleId,
        },
      });

      return newUser;
    });

    // DEV: Store temp password in plain text for testing. Remove before production.
    if (process.env.NODE_ENV !== 'production') {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE users SET "temporaryPassword" = $1 WHERE id = $2::uuid`,
          tempPassword,
          user.id,
        );
      } catch {
        // Column may not exist — silently skip
      }
    }

    // Send welcome email (fire-and-forget)
    void (async () => {
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
        select: { name: true },
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      await sendEmail({
        to: user.email,
        subject: `Welcome to ${property?.name ?? 'Concierge'}`,
        html: renderTemplate('welcome', {
          firstName: user.firstName,
          propertyName: property?.name ?? 'your property',
          loginUrl: `${appUrl}/auth/login`,
        }),
      });
    })().catch((err) => console.error('Failed to send welcome email:', err));

    // TODO: Store frontDeskInstructions on unit-user relation

    return NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: 'pending',
          createdAt: user.createdAt,
          tempPassword, // DEV: return temp password so admin can see it. Remove before production.
        },
        message: `Account created for ${user.firstName} ${user.lastName}. Welcome email sent with login credentials.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/users error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create account' },
      { status: 500 },
    );
  }
}
