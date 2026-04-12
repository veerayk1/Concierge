/**
 * Seed demo data — couriers, storage spots, and other reference data
 * Super Admin only — used for demo preparation
 * DELETE THIS FILE after use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

const COURIERS = [
  { name: 'Amazon', slug: 'amazon', color: '#FF9900', sortOrder: 1 },
  { name: 'FedEx', slug: 'fedex', color: '#4D148C', sortOrder: 2 },
  { name: 'UPS', slug: 'ups', color: '#351C15', sortOrder: 3 },
  { name: 'Canada Post', slug: 'canada-post', color: '#DC2626', sortOrder: 4 },
  { name: 'DHL', slug: 'dhl', color: '#FFCC00', sortOrder: 5 },
  { name: 'Purolator', slug: 'purolator', color: '#CC0000', sortOrder: 6 },
  { name: 'IntelCom', slug: 'intelcom', color: '#22C55E', sortOrder: 7 },
  { name: 'Uber Eats', slug: 'uber-eats', color: '#1A1A1A', sortOrder: 8 },
  { name: 'DoorDash', slug: 'doordash', color: '#FF3008', sortOrder: 9 },
  { name: 'SkipTheDishes', slug: 'skip', color: '#FF6B00', sortOrder: 10 },
  { name: 'Personal', slug: 'personal', color: '#6B7280', sortOrder: 11 },
  { name: 'Other', slug: 'other', color: '#9CA3AF', sortOrder: 12 },
];

const STORAGE_SPOTS = [
  { name: 'Front Desk', code: 'FD', description: 'Front desk counter area' },
  { name: 'Package Room', code: 'PR', description: 'Main package storage room' },
  { name: 'Oversized Storage', code: 'OS', description: 'Large package storage area' },
  { name: 'Fridge', code: 'FR', description: 'Refrigerated storage for perishables' },
  { name: 'Mailroom', code: 'MR', description: 'Building mailroom' },
  { name: 'Loading Dock', code: 'LD', description: 'Loading dock area' },
];

export async function POST(request: NextRequest) {
  const demoRole = request.headers.get('x-demo-role');
  if (demoRole !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId || '94fd28bd-37ce-4fb1-952e-4c182634fc90'; // Demo fallback property
    const results: Record<string, unknown> = {};
    const errors: string[] = [];

    // Seed couriers — iconUrl is required so use a placeholder
    let couriersCreated = 0;
    for (const c of COURIERS) {
      try {
        // Check if already exists by slug
        const existing = await prisma.courierType.findFirst({
          where: { slug: c.slug },
        });
        if (!existing) {
          await prisma.courierType.create({
            data: {
              name: c.name,
              slug: c.slug,
              iconUrl: `/icons/couriers/${c.slug}.svg`,
              color: c.color,
              sortOrder: c.sortOrder,
              isSystem: true,
              isActive: true,
              propertyId: null,
            },
          });
          couriersCreated++;
        }
      } catch (e) {
        errors.push(`courier ${c.slug}: ${String(e).substring(0, 100)}`);
      }
    }
    results.couriers = couriersCreated;

    // Seed storage spots
    let storageCreated = 0;
    for (const s of STORAGE_SPOTS) {
      try {
        const existing = await prisma.storageSpot.findFirst({
          where: { propertyId, code: s.code },
        });
        if (!existing) {
          await prisma.storageSpot.create({
            data: {
              propertyId,
              name: s.name,
              code: s.code,
              isActive: true,
            },
          });
          storageCreated++;
        }
      } catch (e) {
        errors.push(`storage ${s.code}: ${String(e).substring(0, 100)}`);
      }
    }
    results.storageSpots = storageCreated;

    if (errors.length > 0) {
      results.errors = errors;
    }

    return NextResponse.json({ data: results, message: 'Demo data seeded' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/system/seed-demo-data error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: String(error) }, { status: 500 });
  }
}
