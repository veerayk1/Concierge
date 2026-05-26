'use client';

/**
 * ConfirmDialog + useConfirmDialog
 *
 * Replaces native confirm()/alert() across the portal. UX-184/185/
 * 186/188/189/190 each rolled their own state machine; this is the
 * canonical shape so new pages don't have to.
 *
 * Usage:
 *
 *   const { confirm, ConfirmHost } = useConfirmDialog();
 *
 *   <button onClick={() =>
 *     confirm({
 *       title: 'Delete this thing?',
 *       body: 'Cannot be undone.',
 *       destructive: true,
 *       run: async () => { ... },
 *     })
 *   }>Delete</button>
 *
 *   <ConfirmHost />
 *
 * The host element renders nothing when closed. It manages the open
 * state internally so callers don't have to. Toast feedback is
 * exposed via the same hook as `flash(tone, text)`.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface InputPrompt {
  label: string;
  placeholder?: string;
  required?: boolean;
  /** Initial value, e.g. for editing flows. */
  defaultValue?: string;
  /** Validation message rendered under the field. Returning null = valid. */
  validate?: (value: string) => string | null;
  /** Max characters allowed before the input refuses further input. */
  maxLength?: number;
}

interface ConfirmConfig {
  title: string;
  body: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When set, dialog renders a textarea above the confirm buttons. The
   * confirm button stays disabled until validation passes. The trimmed
   * value is passed to `run`. */
  input?: InputPrompt;
  run: (input?: string) => Promise<void> | void;
}

interface FlashState {
  tone: 'ok' | 'err';
  text: string;
}

export function useConfirmDialog() {
  const [pending, setPending] = useState<ConfirmConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [flashState, setFlashState] = useState<FlashState | null>(null);

  const confirm = (config: ConfirmConfig) => {
    setInputValue(config.input?.defaultValue ?? '');
    setPending(config);
  };
  const flash = (tone: 'ok' | 'err', text: string) => {
    setFlashState({ tone, text });
    setTimeout(() => setFlashState(null), 4000);
  };

  function ConfirmHost() {
    const trimmed = inputValue.trim();
    const required = pending?.input?.required ?? false;
    const validationError = pending?.input?.validate ? pending.input.validate(trimmed) : null;
    const inputBlocked =
      !!pending?.input && ((required && trimmed.length === 0) || !!validationError);

    return (
      <>
        <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
          <DialogContent>
            <DialogTitle>{pending?.title ?? ''}</DialogTitle>
            <DialogDescription>{pending?.body ?? ''}</DialogDescription>
            {pending?.input && (
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-neutral-700">
                  {pending.input.label}
                  {pending.input.required && <span className="text-error-500 ml-0.5">*</span>}
                </label>
                <textarea
                  autoFocus
                  rows={3}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  maxLength={pending.input.maxLength}
                  placeholder={pending.input.placeholder}
                  className="focus:border-primary-300 focus:ring-primary-100 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                />
                {validationError && (
                  <p className="text-error-600 text-[12.5px]">{validationError}</p>
                )}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPending(null)}>
                {pending?.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                size="sm"
                disabled={inputBlocked}
                className={
                  pending?.destructive ? 'bg-error-500 hover:bg-error-600 text-white' : undefined
                }
                onClick={async () => {
                  const action = pending;
                  const value = pending?.input ? trimmed : undefined;
                  setPending(null);
                  if (action) await action.run(value);
                }}
              >
                {pending?.confirmLabel ?? (pending?.destructive ? 'Delete' : 'Confirm')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {flashState && (
          <div
            role="status"
            className={`fixed right-6 bottom-6 z-50 max-w-sm rounded-xl px-4 py-3 text-[13.5px] font-medium shadow-lg ring-1 ${
              flashState.tone === 'ok'
                ? 'bg-success-50 text-success-700 ring-success-200'
                : 'bg-error-50 text-error-700 ring-error-200'
            }`}
          >
            {flashState.text}
          </div>
        )}
      </>
    );
  }

  return { confirm, flash, ConfirmHost };
}
