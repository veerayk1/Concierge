'use client';

/**
 * EmailField — RFC 5321-validated email input primitive.
 *
 * Built per docs/QUALITY-BAR.md Section A. Forms using this primitive get:
 *  - Inline format validation on blur (not just on submit)
 *  - Auto-trim + auto-lowercase on blur (browser autofill keeps casing,
 *    server expects lowercase)
 *  - autoComplete="email" so password managers + browser autofill work
 *  - maxLength capped at 254 per RFC 5321
 *  - Placeholder showing expected format
 *  - Required-marker handled by underlying Input
 *  - Inline error reserved-space (no layout jump on validation fire)
 *
 * Pair with `emailSchema` from `src/schemas/common.ts` via zodResolver.
 * Server-side validation is the source of truth; this primitive's only job
 * is to surface bad input BEFORE the user submits, so they don't lose
 * 90 seconds of typing to a server round-trip.
 */

import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Input } from '@/components/ui/input';

interface EmailFieldProps<T extends FieldValues> {
  /** react-hook-form field name (must match the schema property). */
  name: Path<T>;
  /** react-hook-form control object from `useForm()`. */
  control: Control<T>;
  /** Visible label above the input. */
  label: string;
  /** Required indicator + native required attr. */
  required?: boolean;
  /** Optional sub-label text shown below input. */
  helpText?: string;
  /** Override placeholder. Default: you@example.com */
  placeholder?: string;
  /** Disable the input. */
  disabled?: boolean;
}

export function EmailField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  helpText,
  placeholder = 'you@example.com',
  disabled = false,
}: EmailFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input
          name={field.name}
          ref={field.ref}
          value={(field.value as string | undefined) ?? ''}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={(e) => {
            // Normalize on blur: trim whitespace, lowercase. This matches
            // the server-side emailSchema's `.transform(toLowerCase)` so
            // what the user sees == what the server stores.
            const normalized = e.target.value.trim().toLowerCase();
            if (normalized !== e.target.value) field.onChange(normalized);
            field.onBlur();
          }}
          type="email"
          label={label}
          required={required}
          disabled={disabled}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          autoCapitalize="off"
          placeholder={placeholder}
          maxLength={254}
          helperText={helpText}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
