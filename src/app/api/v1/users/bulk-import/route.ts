/**
 * Bulk User Import API — per PRD 08 Section 3.2.1
 * Import users from CSV for entire building onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { z } from 'zod';

const bulkImportUserSchema = z.object({
  email: z.string().optional(),
  firstName: z.string().optional(),
  first_name: z.string().optional(),
  lastName: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

const bulkImportSchema = z.object({
  propertyId: z.string().uuid(),
  roleId: z.string().uuid(),
  users: z.array(bulkImportUserSchema).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();

    const parsed = bulkImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { propertyId, roleId, users } = parsed.data;

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as { row: number; email: string; reason: string }[],
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const row = users[i]!;
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
