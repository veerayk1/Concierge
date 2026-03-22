/**
 * Bulk Staff Creation API
 * Import staff members in batch during property setup wizard.
 * Creates User + UserProperty records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { z } from 'zod';
import crypto from 'crypto';

const bulkStaffSchema = z.object({
  propertyId: z.string().uuid(),
  staff: z
    .array(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().max(254),
        phone: z.string().max(20).optional().nullable(),
        role: z.string().max(100).optional().nullable(),
      }),
    )
    .min(1)
    .max(1000),
});

export async function POST(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = bulkStaffSchema.safeParse(body);

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

    const { propertyId, staff } = parsed.data;

    // Pre-fetch existing users by email to skip duplicates
    const emails = staff.map((s) => s.email.toLowerCase());
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: emails }, deletedAt: null },
      select: { id: true, email: true },
    });
    const existingEmailMap = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u.id]));

    // Pre-fetch existing user-property links
    const existingLinks = await prisma.userProperty.findMany({
      where: { propertyId, deletedAt: null },
      select: { userId: true },
    });
    const linkedUserIds = new Set(existingLinks.map((l) => l.userId));

    // Pre-fetch roles for this property to resolve role name -> roleId
    const roles = await prisma.role.findMany({
      where: { propertyId, deletedAt: null },
      select: { id: true, name: true, slug: true },
    });
    const roleMap = new Map<string, string>();
    for (const role of roles) {
      roleMap.set(role.name.toLowerCase(), role.id);
      roleMap.set(role.slug.toLowerCase(), role.id);
    }

    // Get a fallback role (first non-system role, or the first available)
    const defaultRole = roles.find((r) => !r.name.toLowerCase().includes('resident')) ?? roles[0];

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; email: string; message: string }>,
    };

    for (let i = 0; i < staff.length; i++) {
      const member = staff[i]!;
      const email = member.email.toLowerCase().trim();
      const firstName = stripControlChars(stripHtml(member.firstName)).trim();
      const lastName = stripControlChars(stripHtml(member.lastName)).trim();

      try {
        let userId = existingEmailMap.get(email);

        if (!userId) {
          // Create new user with a random temporary password
          const tempPassword = crypto.randomBytes(16).toString('hex');
          const user = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              phone: member.phone ? stripControlChars(member.phone) : null,
              passwordHash: tempPassword, // Should be hashed in production; user will reset via email
              isActive: true,
            },
          });
          userId = user.id;
          existingEmailMap.set(email, userId);
        }

        // Link user to property if not already linked
        if (linkedUserIds.has(userId)) {
          results.skipped++;
          continue;
        }

        // Resolve role
        const roleName = member.role?.toLowerCase().trim() || '';
        let roleId = roleMap.get(roleName);
        if (!roleId && defaultRole) {
          roleId = defaultRole.id;
        }

        if (!roleId) {
          results.errors.push({
            index: i,
            email,
            message: 'No roles found for this property. Create roles first.',
          });
          continue;
        }

        await prisma.userProperty.create({
          data: {
            userId,
            propertyId,
            roleId,
          },
        });

        linkedUserIds.add(userId);
        results.created++;
      } catch (err) {
        results.errors.push({
          index: i,
          email,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(
      {
        data: results,
        message: `${results.created} staff members created, ${results.skipped} skipped, ${results.errors.length} errors`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/staff/bulk error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to bulk create staff' },
      { status: 500 },
    );
  }
}
