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
  _rows: Record<string, string>[],
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const fields = getTargetFields(entityType);
  let idCounter = 0;

  const nextId = () => `suggestion-${++idCounter}`;

  // 1. Missing required fields (highest priority)
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

  // 2. Low confidence mappings (< 70%) — might be wrong
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
        message: `Column "${mapping.sourceHeader}" was mapped to ${fieldLabel} at ${mapping.confidence}% confidence. This mapping might be incorrect — consider changing it.`,
        action: undefined,
      });
    }
  }

  // Cap at 3 most important suggestions (missing required first, then low confidence)
  return suggestions.slice(0, 3);
}
