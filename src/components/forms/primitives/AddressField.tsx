'use client';

/**
 * AddressField — street address input with pluggable autocomplete provider.
 *
 * Built per docs/QUALITY-BAR.md Section A.
 *
 * Without a provider configured: behaves like a regular text input but
 * with `autoComplete="street-address"` so the browser's built-in autofill
 * (and OS-level address autofill on mobile) works.
 *
 * With a provider: shows live suggestions as the user types and auto-fills
 * sibling fields (city, province, postal code, country) when a suggestion
 * is selected.
 *
 * Configure a provider via:
 *  1. Set `NEXT_PUBLIC_GOOGLE_PLACES_KEY` in `.env.local` (Google Places)
 *  2. Or pass a custom `provider` prop implementing the AddressProvider
 *     interface from `src/components/forms/primitives/address-providers.ts`
 *
 * The provider is loaded lazily so users without the env var pay no
 * bundle-size cost.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AddressSuggestion {
  /** Human-readable display (e.g., "123 Main St, Toronto, ON M5V 2T6, Canada") */
  description: string;
  /** Provider-specific opaque token used to fetch full place details */
  placeId: string;
  /** Pre-parsed components if provider returns them inline */
  components?: AddressComponents;
}

export interface AddressComponents {
  street?: string;
  city?: string;
  province?: string; // state for US
  postalCode?: string;
  country?: string;
}

interface AddressFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Optional setValue from useForm to auto-fill sibling fields
   * (city, province, postalCode, country) when the user picks a suggestion.
   */
  setValue?: UseFormSetValue<T>;
  /**
   * Form field names that should be auto-filled. If not provided, only
   * the address field itself is updated.
   */
  siblingFieldNames?: {
    city?: Path<T>;
    province?: Path<T>;
    postalCode?: Path<T>;
    country?: Path<T>;
  };
}

export function AddressField<T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  helpText,
  placeholder = '123 Main St',
  disabled = false,
  setValue,
  siblingFieldNames,
}: AddressFieldProps<T>) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Provider availability check — at module load time, check the env var.
  // If absent, we skip the autocomplete request entirely (no bundle cost
  // because the dynamic import below is gated).
  const providerConfigured =
    typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const fetchSuggestions = async (query: string) => {
    if (!providerConfigured || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const { fetchGooglePlacesSuggestions } = await import('./address-providers');
      const results = await fetchGooglePlacesSuggestions(query);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      console.warn('[AddressField] suggestion fetch failed:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSuggestion = (s: AddressSuggestion, onChange: (v: string) => void) => {
    onChange(s.components?.street ?? s.description);
    if (setValue && siblingFieldNames && s.components) {
      const { city, province, postalCode, country } = siblingFieldNames;
      if (city && s.components.city) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(city, s.components.city as any, { shouldValidate: true, shouldDirty: true });
      }
      if (province && s.components.province) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(province, s.components.province as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (postalCode && s.components.postalCode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(postalCode, s.components.postalCode as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (country && s.components.country) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(country, s.components.country as any, { shouldValidate: true, shouldDirty: true });
      }
    }
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <>
            <Input
              name={field.name}
              ref={field.ref}
              value={(field.value as string | undefined) ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 250);
              }}
              onBlur={field.onBlur}
              onKeyDown={(e) => {
                if (!open || suggestions.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter' && activeIndex >= 0) {
                  e.preventDefault();
                  selectSuggestion(suggestions[activeIndex]!, field.onChange);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              type="text"
              label={label}
              required={required}
              disabled={disabled}
              autoComplete="street-address"
              placeholder={placeholder}
              maxLength={500}
              helperText={
                helpText ??
                (providerConfigured ? 'Start typing — suggestions will appear' : undefined)
              }
              error={fieldState.error?.message}
            />
            {open && suggestions.length > 0 ? (
              <ul
                role="listbox"
                className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg"
              >
                {isLoading ? (
                  <li className="px-4 py-3 text-[14px] text-neutral-400">Searching…</li>
                ) : null}
                {suggestions.map((s, i) => (
                  <li
                    key={s.placeId}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur before click
                      selectSuggestion(s, field.onChange);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'cursor-pointer px-4 py-3 text-[14px] text-neutral-900',
                      'hover:bg-neutral-50',
                      i === activeIndex ? 'bg-primary-50' : '',
                    )}
                  >
                    {s.description}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      />
    </div>
  );
}
