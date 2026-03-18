/**
 * Bulk User Import API — per PRD 08 Section 3.2.1
 * Import users from CSV for entire building onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, roleId, users } = body;

    if (!propertyId || !roleId || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId, roleId, and users array are required' },
        { status: 400 },
      );
    }

    if (users.length > 500) {
      return NextResponse.json(
        { error: 'LIMIT_EXCEEDED', message: 'Maximum 500 users per import' },
        { status: 400 },
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as { row: number; email: string; reason: string }[],
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const row = users[i];
      const email = (row.email || '').toLowerCase().trim();
      const firstName = (row.firstName || row.first_name || '').trim();
      const lastName = (row.lastName || row.last_name || '').trim();
      const phone = (row.phone || '').trim();

      // Validate required fields
      if (!email || !firstName || !lastName) {
        results.errors.push({
          row: i + 1,
          email,
          reason: 'Missing required fields (email, firstName, lastName)',
        });
        results.skipped++;
        continue;
      }

      // Check email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.errors.push({ row: i + 1, email, reason: 'Invalid email format' });
        results.skipped++;
        continue;
      }

      // Check duplicate
      const existing = await prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
          userProperties: { some: { propertyId, deletedAt: null } },
        },
      });

      if (existing) {
        results.errors.push({ row: i + 1, email, reason: 'Email already exists at this property' });
        results.skipped++;
        continue;
      }

      try {
        const tempPassword = nanoid(16);
        const passwordHash = await hashPassword(tempPassword);

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName,
              lastName,
              phone: phone || null,
              isActive: true,
            },
          });

          await tx.userProperty.create({
            data: {
              userId: user.id,
              propertyId,
              roleId,
            },
          });
        });

        results.created++;
      } catch {
        results.errors.push({ row: i + 1, email, reason: 'Database error' });
        results.skipped++;
      }
    }

    return NextResponse.json({
      data: results,
      message: `Import complete: ${results.created} created, ${results.skipped} skipped.`,
    });
  } catch (error) {
    console.error('POST /api/v1/users/bulk-import error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Bulk import failed' },
      { status: 500 },
    );
  }
}
