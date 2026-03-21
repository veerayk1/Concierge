/**
 * Custom Fields API — per CLAUDE.md Technical Non-Negotiables
 * "Custom fields as JSONB, not schema changes per property."
 *
 * Properties can add custom fields to any module (unit, resident, package,
 * event, maintenance, booking) without code changes. Definitions are stored
 * in the custom_field_definitions table; actual values live as JSONB on
 * each entity's customFields column.
 *
 * Endpoints:
 *   GET  /api/v1/custom-fields?propertyId=...&module=...&search=...
 *   POST /api/v1/custom-fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const MODULES = ['unit', 'resident', 'package', 'event', 'maintenance', 'booking'] as const;
const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select', 'multiselect'] as const;

const createFieldSchema = z
  .object({
    propertyId: z.string().uuid(),
    module: z.enum(MODULES),
    name: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().default(false),
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
    sortOrder: z.number().int().default(0),
  })
  .superRefine((data, ctx) => {
    // select and multiselect MUST have non-empty options
    if (data.type === 'select' || data.type === 'multiselect') {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Field type "${data.type}" requires a non-empty options array.`,
          path: ['options'],
        });
      }
    }
  });

// ---------------------------------------------------------------------------
// GET /api/v1/custom-fields
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const module = searchParams.get('module');
    const search = searchParams.get('search');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
      isActive: true,
    };

    if (module) {
      where['entityType'] = module;
    }

    if (search) {
      where['fieldLabel'] = { contains: search, mode: 'insensitive' };
    }

    const fields = await prisma.customFieldDefinition.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ data: fields });
  } catch (error) {
    console.error('GET /api/v1/custom-fields error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch fields' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/custom-fields
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createFieldSchema.safeParse(body);

    if (!parsed.success) {
      const flatErrors = parsed.error.flatten();
      // Combine field errors and form errors for a clear message
      const allMessages = [
        ...Object.values(flatErrors.fieldErrors).flat(),
        ...flatErrors.formErrors,
      ];

      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: allMessages.join('; ') || 'Validation failed',
          fields: flatErrors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      propertyId,
      module: entityType,
      name,
      label,
      type,
      required,
      options,
      placeholder,
      helpText,
      validation,
      sortOrder,
    } = parsed.data;

    const field = await prisma.customFieldDefinition.create({
      data: {
        propertyId,
        entityType,
        fieldKey: name,
        fieldLabel: label,
        fieldType: type,
        required,
        options: options ?? undefined,
        placeholder: placeholder ?? undefined,
        helpText: helpText ?? undefined,
        validationRules: validation ?? undefined,
        sortOrder,
      },
    });

    return NextResponse.json({ data: field, message: 'Custom field created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/custom-fields error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create field' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Validation helper — reusable by other modules
// ---------------------------------------------------------------------------

/**
 * Validates custom field values against definitions for a given property + module.
 *
 * Returns an array of validation errors. Empty array = valid.
 *
 * Used by entity creation routes (units, events, maintenance, etc.) to enforce
 * required custom fields and type checks before saving JSONB values.
 */
async function validateCustomFieldValues(
  propertyId: string,
  module: string,
  values: Record<string, unknown>,
): Promise<Array<{ field: string; message: string }>> {
  const definitions = await prisma.customFieldDefinition.findMany({
    where: { propertyId, entityType: module, isActive: true },
  });

  const errors: Array<{ field: string; message: string }> = [];

  for (const def of definitions) {
    const value = values[def.fieldKey];

    // Required check
    if (def.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: def.fieldKey,
        message: `"${def.fieldLabel}" is required.`,
      });
      continue;
    }

    // Skip further checks if value not provided and not required
    if (value === undefined || value === null) continue;

    // Type-specific validation
    switch (def.fieldType) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push({
            field: def.fieldKey,
            message: `"${def.fieldLabel}" must be a valid number.`,
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: def.fieldKey,
            message: `"${def.fieldLabel}" must be true or false.`,
          });
        }
        break;

      case 'date':
        if (typeof value === 'string' && isNaN(Date.parse(value))) {
          errors.push({
            field: def.fieldKey,
            message: `"${def.fieldLabel}" must be a valid date.`,
          });
        }
        break;

      case 'select': {
        const opts = (def.options as string[]) ?? [];
        if (!opts.includes(value as string)) {
          errors.push({
            field: def.fieldKey,
            message: `"${def.fieldLabel}" must be one of the allowed options: ${opts.join(', ')}.`,
          });
        }
        break;
      }

      case 'multiselect': {
        const msOpts = (def.options as string[]) ?? [];
        if (!Array.isArray(value)) {
          errors.push({
            field: def.fieldKey,
            message: `"${def.fieldLabel}" must be an array.`,
          });
        } else {
          const invalid = (value as string[]).filter((v) => !msOpts.includes(v));
          if (invalid.length > 0) {
            errors.push({
              field: def.fieldKey,
              message: `"${def.fieldLabel}" contains invalid options: ${invalid.join(', ')}.`,
            });
          }
        }
        break;
      }
    }
  }

  return errors;
}
