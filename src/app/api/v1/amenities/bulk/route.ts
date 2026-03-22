/**
 * Bulk Amenity Creation API
 * Import amenities in batch during property setup wizard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { z } from 'zod';

const bulkAmenitySchema = z.object({
  propertyId: z.string().uuid(),
  amenities: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(2000).optional().nullable(),
        capacity: z.number().int().positive().optional().nullable(),
        fee: z.number().min(0).optional().nullable(),
        bookingStyle: z
          .enum(['fixed_slots', 'flexible_range', 'full_day', 'first_come'])
          .optional()
          .nullable(),
        group: z.string().max(100).optional().nullable(),
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
    const parsed = bulkAmenitySchema.safeParse(body);

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

    const { propertyId, amenities } = parsed.data;

    // Get or create a "General" amenity group for this property
    let defaultGroup = await prisma.amenityGroup.findFirst({
      where: { propertyId, name: 'General' },
    });

    if (!defaultGroup) {
      defaultGroup = await prisma.amenityGroup.create({
        data: {
          propertyId,
          name: 'General',
          displayOrder: 0,
        },
      });
    }

    // Track group lookups/creations
    const groupCache = new Map<string, string>();
    groupCache.set('general', defaultGroup.id);

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; name: string; message: string }>,
    };

    // Check for existing amenity names
    const existingAmenities = await prisma.amenity.findMany({
      where: { propertyId, deletedAt: null },
      select: { name: true },
    });
    const existingNames = new Set(existingAmenities.map((a) => a.name.toLowerCase()));

    const userId = auth.user?.userId ?? 'system';

    for (let i = 0; i < amenities.length; i++) {
      const amenity = amenities[i]!;
      const sanitizedName = stripControlChars(stripHtml(amenity.name)).trim();

      if (existingNames.has(sanitizedName.toLowerCase())) {
        results.skipped++;
        continue;
      }

      try {
        // Resolve group
        const groupName = amenity.group?.trim() || 'General';
        const groupKey = groupName.toLowerCase();
        let groupId = groupCache.get(groupKey);

        if (!groupId) {
          let group = await prisma.amenityGroup.findFirst({
            where: { propertyId, name: groupName },
          });
          if (!group) {
            group = await prisma.amenityGroup.create({
              data: { propertyId, name: groupName, displayOrder: groupCache.size },
            });
          }
          groupId = group.id;
          groupCache.set(groupKey, groupId);
        }

        await prisma.amenity.create({
          data: {
            propertyId,
            name: sanitizedName,
            description: amenity.description
              ? stripControlChars(stripHtml(amenity.description))
              : null,
            groupId,
            bookingStyle: amenity.bookingStyle || 'fixed_slots',
            maxConcurrent: amenity.capacity || 1,
            fee: amenity.fee ?? 0,
            color: '#3B82F6',
            createdById: userId,
          },
        });

        existingNames.add(sanitizedName.toLowerCase());
        results.created++;
      } catch (err) {
        results.errors.push({
          index: i,
          name: sanitizedName,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(
      {
        data: results,
        message: `${results.created} amenities created, ${results.skipped} skipped, ${results.errors.length} errors`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/amenities/bulk error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to bulk create amenities' },
      { status: 500 },
    );
  }
}
