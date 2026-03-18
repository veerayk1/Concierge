/**
 * Custom Fields API — per PRD 16 + ADMIN-SUPERADMIN-ARCHITECTURE
 * Property-specific custom fields stored as JSONB
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createFieldSchema = z.object({
  propertyId: z.string().uuid(),
  module: z.enum(['unit', 'resident', 'package', 'event', 'maintenance', 'booking']),
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum([
    'text',
    'number',
    'date',
    'boolean',
    'select',
    'multiselect',
    'textarea',
    'email',
    'phone',
    'url',
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().max(200).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  sortOrder: z.number().int().default(0),
});

// In-memory store for demo (will be DB-backed)
const customFields: Record<string, unknown>[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const module = searchParams.get('module');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    let filtered = customFields.filter((f) => f.propertyId === propertyId);
    if (module) filtered = filtered.filter((f) => f.module === module);

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error('GET /api/v1/custom-fields error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch fields' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createFieldSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const field = { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() };
    customFields.push(field);

    return NextResponse.json({ data: field, message: 'Custom field created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/custom-fields error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create field' },
      { status: 500 },
    );
  }
}
