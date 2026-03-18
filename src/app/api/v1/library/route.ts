/**
 * Document Library API — per PRD research (all 3 platforms)
 * Manage building documents (rules, forms, minutes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const uploadDocumentSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  fileUrl: z.string().url(),
  fileName: z.string().max(255),
  fileSize: z.number().int().min(0),
  mimeType: z.string().max(100),
  isPublic: z.boolean().default(true),
  visibleToRoles: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Return mock library data since we don't have a Document model yet
    const documents = [
      {
        id: '1',
        title: 'Building Rules & Regulations',
        category: 'Rules',
        fileName: 'building-rules-2026.pdf',
        fileSize: 245000,
        uploadedAt: '2026-01-15',
        uploadedBy: 'Property Management',
      },
      {
        id: '2',
        title: 'Move-In/Move-Out Procedures',
        category: 'Procedures',
        fileName: 'move-procedures.pdf',
        fileSize: 180000,
        uploadedAt: '2026-02-01',
        uploadedBy: 'Property Management',
      },
      {
        id: '3',
        title: 'Amenity Booking Policy',
        category: 'Policies',
        fileName: 'amenity-policy.pdf',
        fileSize: 95000,
        uploadedAt: '2026-01-20',
        uploadedBy: 'Board of Directors',
      },
      {
        id: '4',
        title: 'AGM Minutes — February 2026',
        category: 'Minutes',
        fileName: 'agm-feb-2026.pdf',
        fileSize: 320000,
        uploadedAt: '2026-03-01',
        uploadedBy: 'Board Secretary',
      },
      {
        id: '5',
        title: 'Emergency Procedures Manual',
        category: 'Safety',
        fileName: 'emergency-manual.pdf',
        fileSize: 520000,
        uploadedAt: '2025-12-15',
        uploadedBy: 'Property Management',
      },
      {
        id: '6',
        title: 'Pet Policy',
        category: 'Policies',
        fileName: 'pet-policy.pdf',
        fileSize: 75000,
        uploadedAt: '2026-01-10',
        uploadedBy: 'Board of Directors',
      },
      {
        id: '7',
        title: 'Parking Rules',
        category: 'Rules',
        fileName: 'parking-rules.pdf',
        fileSize: 110000,
        uploadedAt: '2026-01-15',
        uploadedBy: 'Property Management',
      },
      {
        id: '8',
        title: 'Insurance Certificate 2026',
        category: 'Insurance',
        fileName: 'insurance-cert-2026.pdf',
        fileSize: 290000,
        uploadedAt: '2026-01-05',
        uploadedBy: 'Property Management',
      },
    ];

    let filtered = documents;
    if (category) filtered = filtered.filter((d) => d.category === category);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q),
      );
    }

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error('GET /api/v1/library error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = uploadDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // TODO: Store in database + S3
    return NextResponse.json(
      { data: { id: crypto.randomUUID(), ...parsed.data }, message: 'Document uploaded.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/library error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upload document' },
      { status: 500 },
    );
  }
}
