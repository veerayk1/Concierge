'use client';

/**
 * ScheduleVisitorDialog (resident-side)
 *
 * "My plumber is coming at 9am tomorrow." Today residents call the
 * front desk. With this dialog they tap the resident dashboard,
 * fill three fields, hit Save — and tomorrow morning the on-shift
 * concierge sees a card with one-tap "Arrived" instead of having
 * to ask "who are you here for?" while three other people queue.
 *
 * The dialog is intentionally lean: just the visitor's name, type,
 * and expected arrival time. The unit is read from the logged-in
 * resident's profile. No parking permit, no photo upload — that's
 * the staff sign-in workflow, not this one.
 */

import { useEffect, useState } from 'react';
import { Briefcase, CalendarClock, HardHat, Heart, Package, User } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type VisitorType =
  | 'visitor'
  | 'contractor'
  | 'delivery_person'
  | 'real_estate_agent'
  | 'emergency_service'
  | 'other';

const TYPE_OPTIONS: { key: VisitorType; label: string; icon: typeof User }[] = [
  { key: 'visitor', label: 'Friend or family', icon: Heart },
  { key: 'contractor', label: 'Contractor / repair', icon: HardHat },
  { key: 'delivery_person', label: 'Delivery', icon: Package },
  { key: 'real_estate_agent', label: 'Realtor / viewing', icon: Briefcase },
  { key: 'other', label: 'Other', icon: User },
];

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const tok = localStorage.getItem('auth_token');
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    const demoRole = localStorage.getItem('demo_role');
    if (demoRole) h['x-demo-role'] = demoRole;
  }
  return h;
}

function defaultArrivalIso(): string {
  // Default to tomorrow at 9am local time — the most common pre-auth
  // pattern (next-day morning service call).
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(9, 0, 0, 0);
  // datetime-local needs "YYYY-MM-DDTHH:mm" with no timezone suffix
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

interface ScheduleVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  /** Optional override — if omitted the dialog resolves it from /api/v1/users/me. */
  unitId?: string | null;
  onSuccess?: () => void;
}

export function ScheduleVisitorDialog({
  open,
  onOpenChange,
  propertyId,
  unitId: unitIdProp,
  onSuccess,
}: ScheduleVisitorDialogProps) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>('visitor');
  const [arrivalIso, setArrivalIso] = useState(defaultArrivalIso());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resolvedUnitId, setResolvedUnitId] = useState<string | null>(unitIdProp ?? null);

  // Resolve the resident's unit if the caller didn't pass one. Self-
  // contained so this dialog can mount anywhere without prop-drilling.
  useEffect(() => {
    if (!open) return;
    if (unitIdProp) {
      setResolvedUnitId(unitIdProp);
      return;
    }
    fetch('/api/v1/users/me', { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => {
        const u = j?.data?.occupancyUnitId ?? j?.data?.unitId ?? j?.data?.occupancy?.unitId ?? null;
        setResolvedUnitId(u);
      })
      .catch(() => setResolvedUnitId(null));
  }, [open, unitIdProp]);
  const unitId = resolvedUnitId;

  function reset() {
    setVisitorName('');
    setVisitorType('visitor');
    setArrivalIso(defaultArrivalIso());
    setNotes('');
    setError(null);
    setSuccess(null);
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    if (!visitorName.trim()) {
      setError('Visitor name is required.');
      return;
    }
    if (!unitId) {
      setError('We could not find your unit. Refresh and try again.');
      return;
    }
    // arrivalIso is a "YYYY-MM-DDTHH:mm" local string. Convert to UTC ISO.
    const localDate = new Date(arrivalIso);
    if (Number.isNaN(localDate.getTime())) {
      setError('Pick a valid arrival time.');
      return;
    }
    if (localDate.getTime() < Date.now()) {
      setError('Arrival must be in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch('/api/v1/visitors', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          propertyId,
          unitId,
          visitorName: visitorName.trim(),
          visitorType,
          expectedArrivalAt: localDate.toISOString(),
          notifyResident: true,
          comments: notes.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Save failed (${r.status})`);
      }
      setSuccess(`Front desk will be ready for ${visitorName.trim()} on arrival.`);
      onSuccess?.();
      // Auto-close shortly after the success banner so it doesn't trap
      // residents who scheduled one and want to move on.
      setTimeout(() => onOpenChange(false), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <CalendarClock className="h-5 w-5 text-sky-600" />
          Expecting someone?
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          The front desk will recognize them and let them up without calling you.
        </DialogDescription>

        {error && (
          <div className="border-error-200 bg-error-50 text-error-700 mt-4 rounded-xl border px-4 py-3 text-[14px]">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">
            {success}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              Their name
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Mike from Acme Plumbing"
              autoFocus
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              Who are they?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = visitorType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setVisitorType(opt.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition ${
                      active
                        ? 'border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-sky-600' : 'text-neutral-500'}`}
                      strokeWidth={1.8}
                    />
                    <span className="text-[11.5px] font-medium text-neutral-800">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* When */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              When are they coming?
            </label>
            <input
              type="datetime-local"
              value={arrivalIso}
              onChange={(e) => setArrivalIso(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:ring-4 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              Anything else? (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. He's tall, wearing a red hat. Send him straight up."
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-5">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !visitorName.trim()}
            className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-[0_2px_8px_rgba(56,189,248,0.4)] hover:from-sky-600 hover:to-indigo-700"
          >
            {submitting ? 'Saving…' : 'Let the front desk know'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
