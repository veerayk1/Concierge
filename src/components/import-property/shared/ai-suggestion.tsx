'use client';

/**
 * AI Suggestion Card — Displays import mapping suggestions
 *
 * Light blue/indigo card with sparkle icon, suggestion text,
 * and optional Apply/Dismiss actions.
 */

import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AISuggestion } from '@/lib/import/ai-suggestions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onApply?: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AISuggestionCard({ suggestion, onApply, onDismiss }: AISuggestionCardProps) {
  const isWarning = suggestion.severity === 'warning';

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        isWarning ? 'border-amber-200 bg-amber-50/60' : 'border-indigo-200 bg-indigo-50/60'
      }`}
    >
      <Sparkles
        className={`mt-0.5 h-4 w-4 shrink-0 ${isWarning ? 'text-amber-500' : 'text-indigo-500'}`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] ${isWarning ? 'text-amber-800' : 'text-indigo-800'}`}>
          {suggestion.message}
        </p>
        {(onApply || suggestion.action) && (
          <div className="mt-2 flex items-center gap-2">
            {suggestion.action && onApply && (
              <Button size="sm" onClick={onApply}>
                {suggestion.action.label}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        )}
        {!suggestion.action && (
          <div className="mt-2">
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
