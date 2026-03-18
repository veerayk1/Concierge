import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  createContext,
  useContext,
  useId,
  useMemo,
} from 'react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

interface FormFieldContextValue {
  id: string;
  errorId: string;
  helpId: string;
  hasError: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField(): FormFieldContextValue {
  const ctx = useContext(FormFieldContext);
  if (!ctx) {
    throw new Error('useFormField must be used within a <FormField>');
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  FormField                                                                  */
/* -------------------------------------------------------------------------- */

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Label text */
  label: string;
  /** Show required indicator (*) */
  required?: boolean;
  /** Error message — also sets aria-invalid on child inputs */
  error?: string;
  /** Helper text shown below the input */
  helpText?: string;
  /** The form input element(s) */
  children: ReactNode;
  /** Disable the entire field */
  disabled?: boolean;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, required, error, helpText, children, disabled, ...props }, ref) => {
    const generatedId = useId();
    const id = `field-${generatedId}`;
    const errorId = `${id}-error`;
    const helpId = `${id}-help`;

    const contextValue = useMemo(
      () => ({
        id,
        errorId,
        helpId,
        hasError: !!error,
      }),
      [id, errorId, helpId, error],
    );

    return (
      <FormFieldContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('flex flex-col gap-1.5', disabled && 'opacity-50', className)}
          {...props}
        >
          <label
            htmlFor={id}
            className={cn('text-[14px] font-medium', error ? 'text-error-700' : 'text-neutral-900')}
          >
            {label}
            {required && <span className="text-error-500 ml-0.5">*</span>}
          </label>

          {children}

          {error ? (
            <p id={errorId} className="text-error-600 text-[13px]" role="alert">
              {error}
            </p>
          ) : helpText ? (
            <p id={helpId} className="text-[13px] text-neutral-500">
              {helpText}
            </p>
          ) : null}
        </div>
      </FormFieldContext.Provider>
    );
  },
);

FormField.displayName = 'FormField';
