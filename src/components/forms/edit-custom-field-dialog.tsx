'use client';

/**
 * Edit Custom Field Dialog
 *
 * Allows admin to edit custom field label, type, required status, and help text.
 */

import { useState, useCallback, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomFieldData {
  id: string;
  fieldLabel: string;
  fieldKey: string;
  fieldType: string;
  required: boolean;
  helpText?: string | null;
  placeholder?: string | null;
  options?: string[] | null;
  isActive: boolean;
}

interface EditCustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: CustomFieldData;
  onSuccess?: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditCustomFieldDialog({
  open,
  onOpenChange,
  field,
  onSuccess,
}: EditCustomFieldDialogProps) {
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [required, setRequired] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [optionsText, setOptionsText] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (open && field) {
      setFieldLabel(field.fieldLabel || '');
      setFieldType(field.fieldType || 'text');
      setRequired(field.required ?? false);
      setHelpText(field.helpText || '');
      setPlaceholder(field.placeholder || '');
      setOptionsText((field.options ?? []).join('\n'));
      setFeedback(null);
    }
  }, [open, field]);

  const showOptions = fieldType === 'select' || fieldType === 'multiselect';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!field?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const body: Record<string, unknown> = {
          fieldLabel,
          fieldType,
          required,
          helpText: helpText || null,
          placeholder: placeholder || null,
        };

        if (showOptions) {
          body.options = optionsText
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean);
        }

        const resp = await apiRequest(`/api/v1/custom-fields/${field.id}`, {
          method: 'PATCH',
          body,
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update field.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Custom field updated successfully.' });
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1000);
      } catch {
        setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
      } finally {
        setSaving(false);
      }
    },
    [
      field,
      fieldLabel,
      fieldType,
      required,
      helpText,
      placeholder,
      optionsText,
      showOptions,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Settings className="text-primary-500 h-5 w-5" />
          Edit Custom Field
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update field settings. The field key cannot be changed.
        </DialogDescription>

        {feedback && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
              feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          <Input
            label="Field Label"
            required
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            disabled={saving}
            placeholder="e.g. Move-in Date"
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Field Type</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              disabled={saving}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Checkbox
            checked={required}
            onCheckedChange={(c) => setRequired(c === true)}
            label="Required"
            description="Users must fill in this field"
            id="field-required"
            disabled={saving}
          />

          <Input
            label="Placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            disabled={saving}
            placeholder="e.g. Enter value..."
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Help Text</label>
            <textarea
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              disabled={saving}
              placeholder="Optional guidance for users..."
              rows={2}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
          </div>

          {showOptions && (
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Options</label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                disabled={saving}
                placeholder="One option per line..."
                rows={4}
                className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              />
              <p className="text-[12px] text-neutral-400">Enter one option per line.</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !fieldLabel.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
