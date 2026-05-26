'use client';

/**
 * QuickReportStrip
 *
 * Resident inline "report a problem" compose strip — mirrors the
 * shift-log inline compose for staff. Resident notices a leak,
 * types one sentence on the dashboard, hits Enter. The request
 * lands in /my-requests with the AI triage already applied
 * server-side.
 *
 * Doesn't replace the full New Maintenance Request dialog — that
 * surface still lets the resident upload photos, mark entry
 * permission, choose category manually. This is the 80% case:
 * one-sentence quick file.
 */

import { useRef, useState } from 'react';
import { Send, Wrench } from 'lucide-react';

import { useRouter } from 'next/navigation';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const tok = localStorage.getItem('auth_token');
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    const dr = localStorage.getItem('demo_role');
    if (dr) h['x-demo-role'] = dr;
  }
  return h;
}

// Quick urgency detection — same dictionary as the wizard. Flips
// priority to 'urgent' before submit if the text reads emergency.
const URGENT_KEYWORDS =
  /\b(urgent|emergency|flood|flooding|burst|sparking|smoke|no heat|no hot water|no power|gas|leak|leaking)\b/i;

export function QuickReportStrip() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const desc = text.trim();
    if (!desc || busy) return;
    setBusy(true);
    const urgent = URGENT_KEYWORDS.test(desc);
    try {
      const r = await fetch('/api/v1/resident/maintenance', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          description: desc,
          category: 'general',
          priority: urgent ? 'urgent' : 'medium',
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setMessage(j.message || `Failed (${r.status})`);
        return;
      }
      setText('');
      setMessage(
        urgent ? 'Filed as urgent — front desk notified ⚡' : 'Filed. Front desk will pick it up.',
      );
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setMessage('Network error — please try again.');
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '300ms' }}
      aria-label="Quick report a problem"
    >
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/80 px-4 py-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
          <span className="text-[10.5px] font-semibold tracking-[0.1em] text-emerald-700 uppercase">
            Spot a problem?
          </span>
          <span className="text-[11.5px] text-emerald-700/80">
            · Type one sentence — we'll route it to the right person.
          </span>
          <button
            type="button"
            onClick={() => router.push('/my-requests' as never)}
            className="ml-auto text-[11.5px] font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Need photos? Open the full form →
          </button>
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='e.g. "Kitchen sink dripping — water pooling under cabinet"'
            maxLength={500}
            disabled={busy}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          {message && <span className="text-[12px] font-medium text-emerald-700">{message}</span>}
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {busy ? 'Filing…' : 'Send it'}
          </button>
        </form>
      </div>
    </section>
  );
}
