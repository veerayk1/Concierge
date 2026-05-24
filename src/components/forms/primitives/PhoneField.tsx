'use client';

/**
 * PhoneField — libphonenumber-formatted phone input primitive.
 *
 * Built per docs/QUALITY-BAR.md Section A. Users see "(416) 555-0123" as
 * they type; the form value is stored as E.164 "+14165550123" so the
 * server schema and the database see a single canonical format.
 *
 *  - Live formatting via libphonenumber-js AsYouType
 *  - Validation on blur via parsePhoneNumberFromString (full RFC-style check)
 *  - Default country selectable (default: CA — matches our primary market)
 *  - autoComplete="tel" so password managers + browser autofill work
 *  - maxLength capped at 20 (matches existing phoneSchema)
 *  - Placeholder shows the expected format for the selected country
 *  - inputMode="tel" so mobile keyboards open the numeric+symbol keypad
 *
 * Pair with `phoneSchema` from `src/schemas/common.ts` via zodResolver.
 */

import { useMemo } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { AsYouType, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

import { Input } from '@/components/ui/input';

interface PhoneFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  helpText?: string;
  /**
   * ISO 3166-1 alpha-2 country code for default-country phone parsing.
   * Default: CA. Set to 'US' for US-first properties.
   */
  defaultCountry?: CountryCode;
  /** Override placeholder. Default derived from defaultCountry. */
  placeholder?: string;
  disabled?: boolean;
}

const PLACEHOLDERS: Record<string, string> = {
  CA: '(416) 555-0123',
  US: '(212) 555-0123',
  GB: '07700 900123',
  AU: '0412 345 678',
};

export function PhoneField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  helpText,
  defaultCountry = 'CA',
  placeholder,
  disabled = false,
}: PhoneFieldProps<T>) {
  const resolvedPlaceholder = placeholder ?? PLACEHOLDERS[defaultCountry] ?? '(555) 555-0123';

  // AsYouType is stateful — instantiate per render (cheap) so we don't carry
  // stale state across blur/refocus cycles.
  const format = useMemo(() => {
    return (raw: string) => {
      if (!raw) return '';
      // If user already started with "+", treat as international and let
      // libphonenumber handle the country detection.
      const formatter = new AsYouType(raw.startsWith('+') ? undefined : defaultCountry);
      return formatter.input(raw);
    };
  }, [defaultCountry]);

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
            // Store the formatted display value during typing for visual
            // continuity; normalize to E.164 on blur.
            field.onChange(e.target.value);
          }}
          onBlur={(e) => {
            // On blur, parse to E.164 canonical form. If parsing fails
            // (incomplete number), leave the raw user input so the
            // validation error surfaces and the user can correct.
            const raw = e.target.value;
            const parsed = parsePhoneNumberFromString(raw, defaultCountry);
            if (parsed && parsed.isValid()) {
              field.onChange(parsed.number); // E.164 e.g. +14165550123
            }
            field.onBlur();
          }}
          type="tel"
          label={label}
          required={required}
          disabled={disabled}
          autoComplete="tel"
          inputMode="tel"
          placeholder={resolvedPlaceholder}
          maxLength={20}
          helperText={helpText}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
