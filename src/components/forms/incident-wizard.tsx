'use client';

/**
 * IncidentWizard — type-driven, click-through incident report
 *
 * Optimised for "guard is panicking, has 30 seconds, wants to file
 * something correct and complete." Strategy:
 *
 *   STEP 1: Big type picker — 8 incident kinds with icon + colour.
 *           One tap routes the rest of the wizard.
 *
 *   STEP 2: Where & when. Now-by-default, optional unit picker, common
 *           area chips ("Lobby", "P1 Parking", "Stairwell B", "Roof").
 *
 *   STEP 3: What happened — quick chip choices ("False alarm", "Burnt
 *           food", "Small fire", "Major fire") tailored to the type.
 *           Each chip auto-appends a sentence to the description.
 *
 *   STEP 4: What you did — action chips tailored to the type.
 *           "Reset panel", "Called fire dept", "Evacuated floor", etc.
 *           Each tap adds a bullet to the actions list.
 *
 *   STEP 5: Photos + review. Final summary with everything filled in.
 *
 * Submit posts an Event with eventType.slug='incident_report' and a
 * rich customFields blob.
 */

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Flame,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  Trash2,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

interface IncidentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Type catalogue — each type ships with its own palette, default
// priority, common "what happened" chips, and common "what you did"
// chips. The wizard reads from this map; everything else is generic.
// ---------------------------------------------------------------------------
type IncidentTypeKey =
  | 'fire'
  | 'medical'
  | 'theft'
  | 'vandalism'
  | 'flood'
  | 'suspicious'
  | 'parking'
  | 'noise';

interface IncidentTypeConfig {
  key: IncidentTypeKey;
  label: string;
  icon: typeof AlertTriangle;
  tone: string;
  ringTone: string;
  iconColor: string;
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  whatHappened: string[];
  actions: string[];
  emergencyServices: {
    police?: boolean;
    fire?: boolean;
    ambulance?: boolean;
  };
}

const TYPES: IncidentTypeConfig[] = [
  {
    key: 'fire',
    label: 'Fire alarm / fire',
    icon: Flame,
    tone: 'from-rose-50 via-white to-orange-50',
    ringTone: 'ring-rose-300',
    iconColor: 'text-rose-600',
    defaultPriority: 'urgent',
    whatHappened: [
      'False alarm — no smoke, no fire',
      'Burnt food set off the detector',
      'Small contained fire',
      'Major fire — building evacuated',
      'Smoke from unknown source',
    ],
    actions: [
      'Silenced and reset the panel',
      'Notified residents on affected floor',
      'Checked the floor for smoke',
      'Called the fire department',
      'Evacuated the building',
      'Notified property manager',
    ],
    emergencyServices: { fire: true },
  },
  {
    key: 'medical',
    label: 'Medical emergency',
    icon: HeartPulse,
    tone: 'from-rose-50 via-white to-pink-50',
    ringTone: 'ring-rose-300',
    iconColor: 'text-pink-600',
    defaultPriority: 'urgent',
    whatHappened: [
      'Resident slipped / fell',
      'Resident reported chest pain',
      'Resident unconscious',
      'Resident requested ambulance',
      'Bleeding / visible injury',
    ],
    actions: [
      'Called 911',
      'Stayed with the resident until help arrived',
      'Notified emergency contact',
      'Guided paramedics to the unit',
      'Filed report with property manager',
    ],
    emergencyServices: { ambulance: true },
  },
  {
    key: 'theft',
    label: 'Theft',
    icon: ShieldAlert,
    tone: 'from-amber-50 via-white to-orange-50',
    ringTone: 'ring-amber-300',
    iconColor: 'text-amber-700',
    defaultPriority: 'high',
    whatHappened: [
      'Package stolen from lobby',
      'Bike stolen from storage',
      'Mail tampered with',
      'Item stolen from common area',
      'Suspect on camera',
    ],
    actions: [
      'Checked security footage',
      'Filed a police report',
      'Notified the affected resident',
      'Posted notice in lobby',
      'Reviewed access logs',
    ],
    emergencyServices: { police: true },
  },
  {
    key: 'vandalism',
    label: 'Vandalism',
    icon: Trash2,
    tone: 'from-violet-50 via-white to-pink-50',
    ringTone: 'ring-violet-300',
    iconColor: 'text-violet-600',
    defaultPriority: 'medium',
    whatHappened: [
      'Graffiti in stairwell',
      'Broken window',
      'Damaged door / lock',
      'Damaged signage',
      'Litter / dumping in common area',
    ],
    actions: [
      'Photographed the damage',
      'Filed maintenance request',
      'Notified property manager',
      'Reviewed cameras for suspect',
      'Cleaned up area',
    ],
    emergencyServices: {},
  },
  {
    key: 'flood',
    label: 'Water / flood',
    icon: Droplet,
    tone: 'from-sky-50 via-white to-cyan-50',
    ringTone: 'ring-sky-300',
    iconColor: 'text-sky-600',
    defaultPriority: 'high',
    whatHappened: [
      'Active leak from ceiling',
      'Burst pipe',
      'Water in mechanical room',
      'Toilet / sink overflow',
      'Standing water — source unknown',
    ],
    actions: [
      'Shut off the water valve',
      'Placed warning signs',
      'Called emergency plumber',
      'Notified affected residents',
      'Notified property manager',
    ],
    emergencyServices: {},
  },
  {
    key: 'suspicious',
    label: 'Suspicious activity',
    icon: AlertTriangle,
    tone: 'from-amber-50 via-white to-rose-50',
    ringTone: 'ring-amber-300',
    iconColor: 'text-amber-700',
    defaultPriority: 'high',
    whatHappened: [
      'Loitering near entrance',
      'Unknown person at unit door',
      'Suspect followed resident in',
      'Vehicle circling lot',
      'Tampering with mailboxes',
    ],
    actions: [
      'Approached and asked their business',
      'Asked them to leave',
      'Called police non-emergency',
      'Reviewed cameras',
      'Pinned to pass-on for next shift',
    ],
    emergencyServices: { police: true },
  },
  {
    key: 'parking',
    label: 'Parking issue',
    icon: Car,
    tone: 'from-amber-50 via-white to-yellow-50',
    ringTone: 'ring-amber-300',
    iconColor: 'text-yellow-700',
    defaultPriority: 'low',
    whatHappened: [
      'Unauthorised vehicle in resident spot',
      'Vehicle blocking driveway / fire lane',
      'Abandoned vehicle',
      'Vehicle damaged in lot',
      'Repeat violator',
    ],
    actions: [
      'Photographed the plate and spot',
      'Notified the spot owner',
      'Called tow truck',
      'Issued written warning',
      'Logged for next shift to monitor',
    ],
    emergencyServices: {},
  },
  {
    key: 'noise',
    label: 'Noise complaint',
    icon: Volume2,
    tone: 'from-sky-50 via-white to-blue-50',
    ringTone: 'ring-sky-300',
    iconColor: 'text-blue-600',
    defaultPriority: 'low',
    whatHappened: [
      'Loud music after quiet hours',
      'Loud party in unit',
      'Construction noise out of hours',
      'Argument heard from hallway',
      'Pet barking continuously',
    ],
    actions: [
      'Visited the unit and asked to lower volume',
      'Issued a warning',
      'Called the resident on file',
      'Logged for repeat-offender tracking',
      'Escalated to property manager',
    ],
    emergencyServices: {},
  },
];

// Keywords by type for the "looks like a different incident — switch?"
// inline suggestion in step 2. Per-type regex over what the guard
// types into free-text.
const TYPE_KEYWORDS: Record<IncidentTypeKey, RegExp> = {
  fire: /\b(fire|smoke|burning|alarm|evacuat|burnt|burn)\b/i,
  medical:
    /\b(medical|injury|injured|bleeding|unconscious|chest pain|paramedic|ambulance|fell|fall|seizure)\b/i,
  theft: /\b(theft|stole|stolen|missing|robbed|broken into)\b/i,
  vandalism: /\b(graffiti|vandal|spray|broken window|smashed|damaged door|defaced)\b/i,
  flood: /\b(leak|leaking|flood|burst pipe|water|overflow|wet|pooling)\b/i,
  suspicious: /\b(suspicious|loiter|stranger|trespass|prowl|tampering|prowling)\b/i,
  parking: /\b(parking|tow|towed|vehicle|car|abandoned|blocked)\b/i,
  noise: /\b(noise|loud|music|party|argument|barking|shouting)\b/i,
};

const COMMON_LOCATIONS = [
  'Lobby',
  'P1 Parking',
  'P2 Parking',
  'Stairwell A',
  'Stairwell B',
  'Roof / Terrace',
  'Elevator',
  'Gym / Fitness',
  'Mailroom',
  'Loading dock',
];

const PRIORITY_TONE: Record<string, string> = {
  low: 'bg-neutral-50 text-neutral-700 ring-neutral-200',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
  high: 'bg-amber-50 text-amber-700 ring-amber-200',
  urgent: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function IncidentWizard({ open, onOpenChange, propertyId, onSuccess }: IncidentWizardProps) {
  const [step, setStep] = useState(0);
  const [typeKey, setTypeKey] = useState<IncidentTypeKey | null>(null);
  const [location, setLocation] = useState('');
  const [unitId, setUnitId] = useState('');
  const [happenedAt, setHappenedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [whatHappened, setWhatHappened] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [polishing, setPolishing] = useState(false);

  async function polishFreeText() {
    if (!freeText.trim() || polishing) return;
    setPolishing(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const tok = localStorage.getItem('auth_token');
        if (tok) headers['Authorization'] = `Bearer ${tok}`;
        const dr = localStorage.getItem('demo_role');
        if (dr) headers['x-demo-role'] = dr;
      }
      const r = await fetch('/api/v1/ai/polish', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: freeText }),
      });
      const j = await r.json();
      if (j?.data?.polished) setFreeText(j.data.polished);
    } catch {
      /* silent */
    } finally {
      setPolishing(false);
    }
  }
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);

  function reset() {
    setStep(0);
    setTypeKey(null);
    setLocation('');
    setUnitId('');
    setHappenedAt(new Date().toISOString().slice(0, 16));
    setWhatHappened([]);
    setActions([]);
    setFreeText('');
    setPriority('medium');
    setPhotos([]);
    setError(null);
  }

  function selectType(t: IncidentTypeConfig) {
    setTypeKey(t.key);
    setPriority(t.defaultPriority);
    setStep(1);
  }

  // If the guard picks one type and then types content that strongly
  // matches a different type, suggest the switch. Skip when there's
  // no free text or the matched type IS the current type.
  const suggestedSwitchType = useMemo<IncidentTypeConfig | null>(() => {
    const text = freeText.trim();
    if (text.length < 8 || !typeKey) return null;
    for (const t of TYPES) {
      if (t.key === typeKey) continue;
      if (TYPE_KEYWORDS[t.key].test(text)) return t;
    }
    return null;
  }, [freeText, typeKey]);

  function toggle(list: string[], setter: (next: string[]) => void, value: string) {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else setter([...list, value]);
  }

  function buildDescription(): string {
    const parts: string[] = [];
    if (whatHappened.length) {
      parts.push(whatHappened.join('; '));
    }
    if (actions.length) {
      parts.push(`Actions taken: ${actions.join('; ')}`);
    }
    if (freeText.trim()) parts.push(freeText.trim());
    return parts.join('. ') + (parts.length && !/[.!?]$/.test(parts.join('. ')) ? '.' : '');
  }

  async function handleSubmit() {
    const type = TYPES.find((t) => t.key === typeKey);
    if (!type) return;
    setSubmitting(true);
    setError(null);
    try {
      // Resolve the event type id for incident_report by hitting the
      // same lookup the legacy dialog used.
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined' && localStorage.getItem('demo_role')) {
        headers['x-demo-role'] = localStorage.getItem('demo_role')!;
      }
      if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('auth_token')}`;
      }
      const typesRes = await fetch(`/api/v1/event-types?propertyId=${propertyId}`, { headers });
      const typesBody = await typesRes.json().catch(() => ({}));
      const typesList = Array.isArray(typesBody.data ?? typesBody)
        ? (typesBody.data ?? typesBody)
        : [];
      const incidentType = typesList.find(
        (t: { slug?: string; name?: string }) =>
          t.slug === 'incident_report' ||
          t.slug === 'incident-report' ||
          t.name?.toLowerCase().includes('incident'),
      );
      const eventTypeId = incidentType?.id ?? 'incident-report';

      const title = `${type.label}${location ? ` — ${location}` : ''}`;
      const description = buildDescription() || type.label;
      const body = {
        propertyId,
        eventTypeId,
        unitId: unitId || undefined,
        title,
        description,
        priority,
        customFields: {
          category: type.label,
          incidentTypeKey: type.key,
          location: location || null,
          happenedAt,
          whatHappened,
          actions,
          freeText: freeText || null,
          emergencyServices: type.emergencyServices,
          pendingPhotos: photos.map((f) => f.name),
        },
      };
      const r = await fetch('/api/v1/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Submit failed (${r.status})`);
      }
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const type = TYPES.find((t) => t.key === typeKey) ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          File an incident
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          {step === 0
            ? 'Pick the kind. Everything else fills itself in.'
            : type
              ? `${type.label} — step ${step} of 4`
              : ''}
        </DialogDescription>

        {/* Thin gradient progress bar — 20% per step (5 steps total).
            Color tracks the urgency of the picked type so a fire
            incident reads rose, a noise complaint reads blue. */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out ${
              type?.tone ?? 'from-rose-400 via-amber-400 to-emerald-400'
            }`}
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>

        {error && (
          <div className="border-error-200 bg-error-50 text-error-700 mt-4 rounded-xl border px-4 py-3 text-[14px]">
            {error}
          </div>
        )}

        {/* STEP 0 — Type picker */}
        {step === 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectType(t)}
                  className={`group flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br px-3 py-4 text-center transition-all duration-150 hover:-translate-y-px hover:border-neutral-300 hover:shadow-md ${t.tone}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 ring-1 ${t.ringTone} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]`}
                  >
                    <Icon className={`h-5 w-5 ${t.iconColor}`} strokeWidth={1.8} />
                  </div>
                  <span className="text-[12.5px] font-semibold text-neutral-900">{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 1 — Where & when */}
        {step === 1 && type && (
          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                Where did it happen?
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_LOCATIONS.map((loc) => {
                  const active = location === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(active ? '' : loc)}
                      className={`rounded-xl px-3 py-1.5 text-[12.5px] font-medium ring-1 transition-all duration-150 ${
                        active
                          ? 'bg-primary-500 ring-primary-500 text-white shadow-sm'
                          : 'bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-300'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Or type a location — e.g. unit 1204 hallway"
                className="focus:border-primary-500 focus:ring-primary-100 mt-1 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                  When
                </label>
                <input
                  type="datetime-local"
                  value={happenedAt}
                  onChange={(e) => setHappenedAt(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:ring-4 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                  Related unit
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[14px] text-neutral-900 focus:ring-4 focus:outline-none"
                >
                  <option value="">{unitsLoading ? 'Loading…' : 'No specific unit'}</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — What happened */}
        {step === 2 && type && (
          <div className="mt-5 flex flex-col gap-4">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              What happened? Tap all that apply.
            </label>
            <div className="flex flex-wrap gap-2">
              {type.whatHappened.map((chip) => {
                const active = whatHappened.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggle(whatHappened, setWhatHappened, chip)}
                    className={`rounded-xl px-3 py-2 text-left text-[12.5px] font-medium ring-1 transition-all duration-150 ${
                      active
                        ? `bg-gradient-to-br ${type.tone} text-neutral-900 shadow-sm ring-rose-300`
                        : 'bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-300'
                    }`}
                  >
                    {active && '✓ '}
                    {chip}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-neutral-500">
                Each tap adds it to the report. You can also write details below.
              </p>
              <button
                type="button"
                onClick={polishFreeText}
                disabled={polishing || !freeText.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50 disabled:opacity-50"
                title="Fix typos and capitalize sentences"
              >
                <Sparkles className="h-3 w-3" />
                {polishing ? 'Polishing…' : 'Polish with AI'}
              </button>
            </div>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={3}
              placeholder="Anything specific not covered above…"
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
            />
            {/* AI category-switch suggestion — if what they typed
                sounds like a different incident type, surface a soft
                nudge with a one-tap switch. The guard can keep the
                current type and ignore the banner. */}
            {suggestedSwitchType && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                <span className="flex-1">
                  This sounds more like a{' '}
                  <strong className="text-amber-900">{suggestedSwitchType.label}</strong> incident.
                  Want to switch?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTypeKey(suggestedSwitchType.key);
                    setPriority(suggestedSwitchType.defaultPriority);
                  }}
                  className="rounded-md bg-white px-2 py-0.5 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                >
                  Switch
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-xl py-2 text-[12.5px] font-semibold capitalize ring-1 transition-all duration-150 ${
                        active
                          ? `${PRIORITY_TONE[p]} shadow-sm ring-2`
                          : `${PRIORITY_TONE[p]} opacity-60`
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              {priority === 'urgent' && (
                <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11.5px] font-medium text-rose-700 ring-1 ring-rose-200">
                  <Zap className="h-3 w-3" />
                  Property manager and supervisor get an immediate notification.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — What you did */}
        {step === 3 && type && (
          <div className="mt-5 flex flex-col gap-4">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              What did you do? Tap all that apply.
            </label>
            <div className="flex flex-wrap gap-2">
              {type.actions.map((chip) => {
                const active = actions.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggle(actions, setActions, chip)}
                    className={`rounded-xl px-3 py-2 text-left text-[12.5px] font-medium ring-1 transition-all duration-150 ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-emerald-300'
                        : 'bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-300'
                    }`}
                  >
                    {active && '✓ '}
                    {chip}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
                Photos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) setPhotos((prev) => [...prev, ...Array.from(files)]);
                  e.target.value = '';
                }}
                className="block w-full text-[13px] text-neutral-600 file:mr-4 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
              />
              {photos.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {photos.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-[13px] text-neutral-700"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Camera className="h-3.5 w-3.5 text-neutral-400" />
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 — Review */}
        {step === 4 && type && (
          <div className="mt-5 flex flex-col gap-4">
            <div
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-4 ${type.tone}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 ring-1 ring-rose-200">
                  <type.icon className={`h-5 w-5 ${type.iconColor}`} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold tracking-[0.1em] text-rose-700 uppercase">
                    {type.label}
                  </p>
                  <p className="text-[14px] font-semibold text-neutral-900">
                    {location || 'No location specified'}
                    {unitId && ` · Unit ${units.find((u) => u.id === unitId)?.number ?? ''}`}
                  </p>
                </div>
                <span
                  className={`ml-auto rounded-lg px-2 py-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase ring-1 ${PRIORITY_TONE[priority]}`}
                >
                  {priority}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3 text-[13px] text-neutral-800">
                <div>
                  <p className="text-[10.5px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
                    What happened
                  </p>
                  {whatHappened.length === 0 && !freeText.trim() ? (
                    <p className="mt-1 text-neutral-400 italic">Not specified.</p>
                  ) : (
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {whatHappened.map((c) => (
                        <li key={c} className="leading-relaxed">
                          • {c}
                        </li>
                      ))}
                      {freeText.trim() && (
                        <li className="mt-1 leading-relaxed text-neutral-700">{freeText.trim()}</li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
                    Actions taken
                  </p>
                  {actions.length === 0 ? (
                    <p className="mt-1 text-neutral-400 italic">None recorded.</p>
                  ) : (
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {actions.map((a) => (
                        <li key={a} className="leading-relaxed">
                          ✓ {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {photos.length > 0 && (
                  <p className="text-[11.5px] text-neutral-500">
                    {photos.length} photo{photos.length === 1 ? '' : 's'} attached.
                  </p>
                )}
              </div>
            </div>

            {/* Notification preview — make it explicit who gets paged
                so the guard knows the consequence of clicking File
                incident. Urgent items wake up the manager and
                supervisor; emergency services get a chip per service. */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
              <p className="text-[10.5px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
                When you file
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-neutral-700">
                <li>· Saved to the building incident log immediately</li>
                {priority === 'urgent' && (
                  <li className="text-rose-700">
                    · Property manager and supervisor get an immediate notification
                  </li>
                )}
                {priority === 'high' && (
                  <li className="text-amber-700">
                    · Supervisor sees it on their next dashboard load
                  </li>
                )}
                {type.emergencyServices.fire && (
                  <li>· Reminder: call 911 / fire department directly if you haven't already</li>
                )}
                {type.emergencyServices.ambulance && (
                  <li>· Reminder: call 911 directly if you haven't already</li>
                )}
                {type.emergencyServices.police && (
                  <li>
                    · Reminder: police involvement is appropriate — consider 911 or non-emergency
                    line
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 0 || submitting}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={step === 0 && !typeKey}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={
                priority === 'urgent'
                  ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-[0_2px_8px_rgba(220,38,38,0.4)] hover:from-rose-700 hover:to-red-800'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] hover:from-emerald-600 hover:to-teal-700'
              }
            >
              {submitting ? 'Filing…' : 'File incident'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
