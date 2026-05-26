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

interface ConfirmConfig {
  title: string;
  body: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  run: () => Promise<void> | void;
}

interface FlashState {
  tone: 'ok' | 'err';
  text: string;
}

export function useConfirmDialog() {
  const [pending, setPending] = useState<ConfirmConfig | null>(null);
  const [flashState, setFlashState] = useState<FlashState | null>(null);

  const confirm = (config: ConfirmConfig) => setPending(config);
  const flash = (tone: 'ok' | 'err', text: string) => {
    setFlashState({ tone, text });
    setTimeout(() => setFlashState(null), 4000);
  };

  function ConfirmHost() {
    return (
      <>
        <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
          <DialogContent>
            <DialogTitle>{pending?.title ?? ''}</DialogTitle>
            <DialogDescription>{pending?.body ?? ''}</DialogDescription>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPending(null)}>
                {pending?.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                size="sm"
                className={
                  pending?.destructive ? 'bg-error-500 hover:bg-error-600 text-white' : undefined
                }
                onClick={async () => {
                  const action = pending;
                  setPending(null);
                  if (action) await action.run();
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
