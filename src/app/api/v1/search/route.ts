/**
 * Global Search API — per PRD 15 Search & Navigation
 * Searches across all modules: users, units, packages, events, announcements
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!propertyId || !q || q.length < 2) {
      return NextResponse.json({
        data: { users: [], units: [], packages: [], events: [], announcements: [] },
      });
    }

    // Search across all modules in parallel
    const [users, units, packages, events, announcements] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          userProperties: { some: { propertyId, deletedAt: null } },
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: limit,
      }),
      prisma.unit.findMany({
        where: {
          propertyId,
          deletedAt: null,
          number: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, number: true, status: true },
        take: limit,
      }),
      prisma.package.findMany({
        where: {
          propertyId,
          deletedAt: null,
          OR: [
            { referenceNumber: { contains: q, mode: 'insensitive' } },
            { trackingNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, referenceNumber: true, status: true },
        take: limit,
      }),
      prisma.event.findMany({
        where: {
          propertyId,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { referenceNo: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, referenceNo: true, status: true },
        take: limit,
      }),
      prisma.announcement.findMany({
        where: {
          propertyId,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, status: true },
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: { users, units, packages, events, announcements },
      meta: {
        totalResults:
          users.length + units.length + packages.length + events.length + announcements.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/search error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Search failed' },
      { status: 500 },
    );
  }
}
