'use client';

/**
 * FloatingDebugButton — Dev-only manual bug reporter
 *
 * Renders ONLY in development (tree-shaken at Next.js build time in production).
 * Keyboard shortcut: Shift+D
 * Position: Fixed bottom-right, z-9999
 */

import { useEffect, useState } from 'react';
import { Bug, X } from 'lucide-react';
import { reportDebugEvent, inferModuleFromRoute } from '@/lib/hooks/use-debug-session';

// Hard guard — Next.js build will tree-shake this entire module in production
if (process.env.NODE_ENV === 'production') {
  // Noop export handled below
}

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export function FloatingDebugButton() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [submitted, setSubmitted] = useState(false);

  // Keyboard shortcut: Shift+D
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D' && !e.target) return;
      if (e.shiftKey && e.key === 'D') {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleSubmit = () => {
    const pathname = window.location.pathname;
    reportDebugEvent({
      type: 'MANUAL_BUG_REPORT',
      source: 'client',
      severity,
      title: note.slice(0, 200) || 'Manual bug report',
      testerNote: note || null,
      isManualFlag: true,
      route: pathname,
      module: inferModuleFromRoute(pathname),
    });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setNote('');
      setSeverity('HIGH');
      setSubmitted(false);
    }, 1500);
  };

  // Production guard
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Report a bug (Shift+D)"
        className="fixed right-6 bottom-6 z-[9999] flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-transform duration-150 hover:scale-110 hover:bg-neutral-700 active:scale-95"
      >
        <Bug className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-neutral-700" strokeWidth={1.5} />
                <h2 className="text-base font-semibold text-neutral-900">Report a Bug</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Route context */}
            <p className="mb-4 rounded-lg bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-500">
              {typeof window !== 'undefined' ? window.location.pathname : ''}
            </p>

            {/* Severity */}
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Severity</label>
              <div className="flex gap-2">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      severity === s
                        ? s === 'CRITICAL'
                          ? 'bg-red-600 text-white'
                          : s === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : s === 'MEDIUM'
                              ? 'bg-yellow-500 text-white'
                              : s === 'LOW'
                                ? 'bg-blue-500 text-white'
                                : 'bg-neutral-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                What happened?
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe the bug — what you did, what you expected, what actually happened..."
                rows={4}
                className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all ${
                submitted
                  ? 'cursor-not-allowed bg-green-500'
                  : 'bg-neutral-900 hover:bg-neutral-700 active:scale-[0.98]'
              }`}
            >
              {submitted ? 'Reported ✓' : 'Submit Bug Report'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
