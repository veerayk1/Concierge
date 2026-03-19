/**
 * Custom Fields — Single field operations
 *
 * Endpoints:
 *   GET    /api/v1/custom-fields/:id — get field definition
 *   PATCH  /api/v1/custom-fields/:id — update field definition
 *   DELETE /api/v1/custom-fields/:id — soft-delete (mark inactive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Update schema — all fields optional
// ---------------------------------------------------------------------------

const updateFieldSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().max(100).optional(),
  helpText: z.string().max(200).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  sortOrder: z.number().int().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/custom-fields/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const field = await prisma.customFieldDefinition.findUnique({ where: { id } });

    if (!field) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Custom field definition not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: field });
  } catch (error) {
    console.error('GET /api/v1/custom-fields/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch custom field.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/custom-fields/:id
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.customFieldDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Custom field definition not found.' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateFieldSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid update payload.',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { label, required, options, placeholder, helpText, validation, sortOrder } = parsed.data;

    const data: Record<string, unknown> = {};
    if (label !== undefined) data['fieldLabel'] = label;
    if (required !== undefined) data['required'] = required;
    if (options !== undefined) data['options'] = options;
    if (placeholder !== undefined) data['placeholder'] = placeholder;
    if (helpText !== undefined) data['helpText'] = helpText;
    if (validation !== undefined) data['validationRules'] = validation;
    if (sortOrder !== undefined) data['sortOrder'] = sortOrder;

    const updated = await prisma.customFieldDefinition.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated, message: 'Custom field updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/custom-fields/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update custom field.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/custom-fields/:id — Soft delete
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.customFieldDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Custom field definition not found.' },
        { status: 404 },
      );
    }

    const deactivated = await prisma.customFieldDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      data: deactivated,
      message: `Custom field "${existing.fieldLabel}" deactivated.`,
    });
  } catch (error) {
    console.error('DELETE /api/v1/custom-fields/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to deactivate custom field.' },
      { status: 500 },
    );
  }
}
