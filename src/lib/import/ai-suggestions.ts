/**
 * AI Suggestions Engine — Rule-Based Import Suggestions
 *
 * Generates helpful suggestions for column mappings without
 * requiring an LLM. Detects low-confidence mappings, missing
 * required fields, and unmapped columns that look useful.
 */

import type { ColumnMapping, EntityType } from './column-mapper';
import { getTargetFields } from './column-mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AISuggestion {
  id: string;
  type: 'mapping_fix' | 'missing_data' | 'format_normalize' | 'duplicate';
  message: string;
  severity: 'info' | 'warning';
  action?: {
    label: string;
    targetField: string;
    sourceHeader: string;
  };
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export function generateSuggestions(
  mappings: ColumnMapping[],
  entityType: EntityType,
  rows: Record<string, string>[],
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const fields = getTargetFields(entityType);
  let idCounter = 0;

  const nextId = () => `suggestion-${++idCounter}`;

  // 1. Low confidence mappings (< 70%)
  for (const mapping of mappings) {
    if (
      mapping.targetField &&
      !mapping.isCustomField &&
      mapping.confidence > 0 &&
      mapping.confidence < 70
    ) {
      const fieldLabel =
        fields.find((f) => f.key === mapping.targetField)?.label ?? mapping.targetField;

      suggestions.push({
        id: nextId(),
        type: 'mapping_fix',
        severity: 'warning',
        message: `Column "${mapping.sourceHeader}" was mapped to ${fieldLabel} at ${mapping.confidence}% confidence. This mapping might be incorrect.`,
        action: undefined,
      });
    }
  }

  // 2. Required fields not mapped
  const mappedTargets = new Set(
    mappings.filter((m) => m.targetField && !m.isCustomField).map((m) => m.targetField!),
  );

  for (const field of fields) {
    if (field.required && !mappedTargets.has(field.key)) {
      suggestions.push({
        id: nextId(),
        type: 'missing_data',
        severity: 'warning',
        message: `${field.label} is required but no column was mapped to it. Import may fail or produce incomplete records.`,
      });
    }
  }

  // 3. Unmapped columns that look useful
  const unmappedColumns = mappings.filter((m) => m.isCustomField && m.targetField === null);

  for (const mapping of unmappedColumns) {
    const header = mapping.sourceHeader.toLowerCase();

    // Check if the column name partially matches any known field
    const possibleMatch = fields.find((f) => {
      // Check if the column header contains any part of the field's aliases
      return f.aliases.some((alias) => {
        const normalizedAlias = alias.toLowerCase();
        const normalizedHeader = header.replace(/[_\-./\\]+/g, ' ').trim();
        return (
          normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)
        );
      });
    });

    if (possibleMatch && !mappedTargets.has(possibleMatch.key)) {
      suggestions.push({
        id: nextId(),
        type: 'mapping_fix',
        severity: 'info',
        message: `Column "${mapping.sourceHeader}" was not mapped. Should it be mapped to ${possibleMatch.label}?`,
        action: {
          label: `Map to ${possibleMatch.label}`,
          targetField: possibleMatch.key,
          sourceHeader: mapping.sourceHeader,
        },
      });
    } else if (!possibleMatch) {
      // Check if column has non-empty values — if so, suggest custom field
      const hasValues = rows.slice(0, 20).some((row) => {
        const val = row[mapping.sourceHeader]?.trim();
        return val && val.length > 0;
      });

      if (hasValues && mapping.suggestedFieldType) {
        suggestions.push({
          id: nextId(),
          type: 'mapping_fix',
          severity: 'info',
          message: `Column "${mapping.sourceHeader}" was not mapped. It contains ${mapping.suggestedFieldType} data. Should it be a custom field?`,
        });
      }
    }
  }

  return suggestions;
}
