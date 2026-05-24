'use client';

/**
 * PostalCodeField — locale-aware postal code primitive.
 *
 * Built per docs/QUALITY-BAR.md Section A.
 *
 * Canadian (default):
 *  - Auto-uppercase
 *  - Auto-insert space after 3 chars ("M5V2T6" -> "M5V 2T6")
 *  - maxLength 7 (incl. space)
 *
 * US:
 *  - Digits only
 *  - Auto-insert hyphen after 5 chars for ZIP+4 ("902101234" -> "90210-1234")
 *  - maxLength 10
 *
 * Validation pairs with `postalCodeSchema` from `src/schemas/common.ts`
 * via zodResolver. The schema regex accepts both CA and US formats.
 */

import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Input } from '@/components/ui/input';

interface PostalCodeFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  helpText?: string;
  /** Country code controls formatting + maxLength. Default: CA. */
  country?: 'CA' | 'US';
  placeholder?: string;
  disabled?: boolean;
}

function formatCanadian(raw: string): string {
  // Strip everything except letters and digits, uppercase, then insert space
  const clean = raw
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

function formatUS(raw: string): string {
  // Digits only, max 9, hyphen after 5
  const clean = raw.replace(/\D/g, '').slice(0, 9);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

export function PostalCodeField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  helpText,
  country = 'CA',
  placeholder,
  disabled = false,
}: PostalCodeFieldProps<T>) {
  const format = country === 'CA' ? formatCanadian : formatUS;
  const resolvedPlaceholder = placeholder ?? (country === 'CA' ? 'M5V 2T6' : '90210');
  const maxLen = country === 'CA' ? 7 : 10;
  const autoComplete = country === 'CA' ? 'postal-code' : 'postal-code';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input
          name={field.name}
          ref={field.ref}
          value={format((field.value as string | undefined) ?? '')}
          onChange={(e) => {
            // Re-format on every keystroke so the display always matches
            // canonical form. The field value IS the formatted string —
            // the server schema accepts both spaced and un-spaced CA
            // codes via its regex, so no extra normalization needed.
            field.onChange(format(e.target.value));
          }}
          onBlur={field.onBlur}
          type="text"
          label={label}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={country === 'US' ? 'numeric' : 'text'}
          placeholder={resolvedPlaceholder}
          maxLength={maxLen}
          spellCheck={false}
          autoCapitalize={country === 'CA' ? 'characters' : 'off'}
          helperText={helpText}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
