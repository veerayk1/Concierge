'use client';

/**
 * AcknowledgmentTrail
 *
 * Inline staff acknowledgment surface for an event (typically an
 * incident). Renders the list of people who've tapped "I've seen
 * this" with their role + when. A one-tap button at the bottom adds
 * (or refreshes) the current user's acknowledgment.
 *
 * Closes the "did the manager see my incident?" anxiety loop a guard
 * has after they file. The trail also feeds the manager's dashboard
 * — once any property_admin / property_manager acknowledges, the
 * filing guard knows it landed.
 */

import { useState } from 'react';
import { CheckCircle2, Users } from 'lucide-react';

interface Ack {
  userId: string;
  name: string;
  role: string;
  at: string;
}

interface AcknowledgmentTrailProps {
  eventId: string;
  initial?: Ack[];
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  property_admin: 'Property Admin',
  property_manager: 'Property Manager',
  security_guard: 'Security',
  security_supervisor: 'Security Supervisor',
  front_desk: 'Front Desk',
  superintendent: 'Superintendent',
  board_member: 'Board Member',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AcknowledgmentTrail({ eventId, initial }: AcknowledgmentTrailProps) {
  const [acks, setAcks] = useState<Ack[]>(initial ?? []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function acknowledge() {
    setBusy(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const tok = localStorage.getItem('auth_token');
        if (tok) headers['Authorization'] = `Bearer ${tok}`;
        const dr = localStorage.getItem('demo_role');
        if (dr) headers['x-demo-role'] = dr;
      }
      const r = await fetch(`/api/v1/events/${eventId}/acknowledge`, {
        method: 'POST',
        headers,
      });
      const j = await r.json();
      if (j?.data?.acknowledgments) {
        setAcks(j.data.acknowledgments);
        setMessage('Acknowledged — the filer will see this');
      } else {
        setMessage(j?.message || 'Failed to acknowledge');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 px-5 py-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-600" strokeWidth={1.8} />
        <span className="text-[10.5px] font-semibold tracking-[0.1em] text-violet-700 uppercase">
          Acknowledged by
        </span>
        <span className="text-[11.5px] text-violet-700/80">· {acks.length} staff</span>
      </div>
      {acks.length === 0 ? (
        <p className="mt-2 text-[13px] text-neutral-500 italic">
          No one has acknowledged yet. The filing guard can't tell if anyone has seen this.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {acks
            .slice()
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .map((a) => (
              <li
                key={a.userId}
                className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5 text-[13px] ring-1 ring-violet-100"
              >
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                <span className="font-semibold text-neutral-900">{a.name}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-600">{ROLE_LABEL[a.role] ?? a.role}</span>
                <span className="ml-auto text-[11.5px] text-neutral-400">{timeAgo(a.at)}</span>
              </li>
            ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        {message ? (
          <span className="text-[12px] font-medium text-emerald-700">{message}</span>
        ) : (
          <span className="text-[11.5px] text-neutral-500">
            Tap to log that you've seen this incident.
          </span>
        )}
        <button
          type="button"
          onClick={acknowledge}
          disabled={busy}
          className="flex items-center gap-1 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)] transition hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {busy ? 'Marking…' : 'I have seen this'}
        </button>
      </div>
    </div>
  );
}
