/**
 * Custom field value validation — server-side helper.
 *
 * Lives outside the API route handler because Next.js 15 disallows
 * arbitrary exports from `route.ts` files (only HTTP verbs + a small
 * set of config keys are permitted). The route imports this and re-uses
 * it; entity creation routes (units, events, maintenance, etc.) can
 * also import it directly to enforce required fields + type checks
 * before saving JSONB values.
 */

import { prisma } from '@/server/db';

export async function validateCustomFieldValues(
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
