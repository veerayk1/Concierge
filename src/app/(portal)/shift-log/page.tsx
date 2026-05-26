'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  Megaphone,
  MessageSquare,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  User,
  Users,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { CreateShiftEntryDialog } from '@/components/forms/create-shift-entry-dialog';
import { SubmitShiftReportDialog } from '@/components/forms/submit-shift-report-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Test-seed filter — same regex as /my-packages, /my-requests, /dashboard.
// Demo property is heavily polluted with "CHAIN-H 2WC9QT routine patrol"
// entries that would otherwise drown the shift log.
// ---------------------------------------------------------------------------
const TEST_TITLE_PATTERN =
  /^(EXH[-_]?[A-Z]+|UI[-_]?CHAIN|UI[-_]?TASK|CHAIN[-_]?[A-Z]|QA[-_ ]?(TEST|[A-Z]+:|TOWER)|QA TEST|UX[-_]?\d+|WRITE[-_]?MATRIX|SEC[-_]?\d+|TEST[-_ ]?|FBSNCK|VERIFY[-_ ]?|TC[-_]?\d+|E2E[-_ ]?)/i;
const TEST_SUBSTRING_PATTERN = /\btest (event|notice|announcement|item|run|data|patrol|note)\b/i;
function isTestSeedTitle(s: string | undefined | null): boolean {
  if (!s) return false;
  const t = s.trim();
  return TEST_TITLE_PATTERN.test(t) || TEST_SUBSTRING_PATTERN.test(t);
}

// ---------------------------------------------------------------------------
// buildPriorShiftSummary
//
// Derives a "what happened on the last completed shift" mini-briefing
// from the entries list. It's deterministic (no LLM call) but the
// presentation feels AI-generated: three bullets, counts of patrol /
// incident / pass-on entries, a callout of any URGENT items that
// haven't been resolved yet.
//
// Returned shape is null when the prior shift is empty so the caller
// can simply not render the card.
// ---------------------------------------------------------------------------
type ShiftKey = 'morning' | 'afternoon' | 'night';

function priorShiftKey(now: Date): { key: ShiftKey; label: string } {
  const h = now.getHours();
  // Current shift -> prior shift mapping. Morning sees the prior
  // night, afternoon sees morning, night sees afternoon.
  if (h >= 6 && h < 14) return { key: 'night', label: 'overnight shift' };
  if (h >= 14 && h < 22) return { key: 'morning', label: 'morning shift' };
  return { key: 'afternoon', label: 'afternoon shift' };
}

function entryShiftKey(createdAt: string): ShiftKey {
  const h = new Date(createdAt).getHours();
  if (h >= 6 && h < 14) return 'morning';
  if (h >= 14 && h < 22) return 'afternoon';
  return 'night';
}

interface ShiftEntryForSummary {
  title: string;
  description: string | null;
  priority: string;
  createdAt: string;
  customFields: { category?: string; pinned?: boolean } | null;
  eventType: { name: string } | null;
}

function buildPriorShiftSummary(entries: ShiftEntryForSummary[]): {
  label: string;
  bullets: string[];
  important: { title: string; description: string | null }[];
} | null {
  if (!entries.length) return null;
  const now = new Date();
  const { key, label } = priorShiftKey(now);

  // Look back ~24h max (so "afternoon shift" doesn't grab last
  // week's afternoon entries when it's quiet). Trade-off: a shift
  // with truly nothing logged shows no summary, which is honest.
  const yesterday = now.getTime() - 24 * 60 * 60 * 1000;
  const priorEntries = entries.filter((e) => {
    const ts = new Date(e.createdAt).getTime();
    if (ts < yesterday) return false;
    return entryShiftKey(e.createdAt) === key;
  });
  if (!priorEntries.length) return null;

  let patrols = 0;
  let passOns = 0;
  let urgent = 0;
  const important: { title: string; description: string | null }[] = [];

  for (const e of priorEntries) {
    const title = (e.title || '').toLowerCase();
    const evt = (e.eventType?.name || '').toLowerCase();
    if (title.includes('patrol') || evt.includes('patrol')) patrols += 1;
    if (evt.includes('pass') || (e.customFields?.category || '').toLowerCase().includes('pass'))
      passOns += 1;
    if (e.priority === 'urgent') {
      urgent += 1;
      important.push({ title: e.title, description: e.description });
    } else if (e.priority === 'important' && important.length < 3) {
      important.push({ title: e.title, description: e.description });
    }
  }

  const bullets: string[] = [];
  bullets.push(
    `${priorEntries.length} entr${priorEntries.length === 1 ? 'y' : 'ies'} logged on the ${label}.`,
  );
  if (patrols > 0) bullets.push(`${patrols} patrol${patrols === 1 ? '' : 's'} completed.`);
  if (passOns > 0)
    bullets.push(`${passOns} pass-on note${passOns === 1 ? '' : 's'} waiting for follow-up.`);
  if (urgent > 0) bullets.push(`${urgent} urgent item${urgent === 1 ? '' : 's'} — see below.`);

  return { label, bullets, important: important.slice(0, 3) };
}

// ---------------------------------------------------------------------------
// Types — mapped from API response
// ---------------------------------------------------------------------------

interface ShiftEntry {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  referenceNo: string | null;
  createdAt: string;
  createdById: string | null;
  customFields: {
    category?: string;
    pinned?: boolean;
    readBy?: string[];
    mentionedUnitId?: string;
  } | null;
  eventType: { name: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-warning-50 text-warning-700',
  afternoon: 'bg-primary-50 text-primary-700',
  night: 'bg-neutral-800 text-white',
};

const SHIFT_ICONS: Record<string, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

type EntryTypeFilter = 'all' | 'important' | 'normal' | 'urgent';

function getCurrentShift(): 'morning' | 'afternoon' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

function getShiftTimes(shift: 'morning' | 'afternoon' | 'night') {
  switch (shift) {
    case 'morning':
      return { start: '6:00 AM', end: '2:00 PM' };
    case 'afternoon':
      return { start: '2:00 PM', end: '10:00 PM' };
    case 'night':
      return { start: '10:00 PM', end: '6:00 AM' };
  }
}

function getEntryShift(createdAt: string): string {
  const hour = new Date(createdAt).getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActiveShift {
  id: string;
  propertyId: string;
  guardId: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function ShiftLogPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>('all');
  const [clockBusy, setClockBusy] = useState(false);
  const [clockMessage, setClockMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    data: apiEntries,
    loading,
    error,
    refetch,
  } = useApi<ShiftEntry[]>(
    apiUrl('/api/v1/shift-log', {
      propertyId: getPropertyId(),
      priority: entryTypeFilter !== 'all' ? entryTypeFilter : undefined,
    }),
  );

  const { data: activeShiftRaw, refetch: refetchShift } = useApi<ActiveShift | null>(
    apiUrl('/api/v1/shift-log/clock', { propertyId: getPropertyId() }),
  );
  // useApi falls back to the entire response envelope when the API
  // returns { data: null } (because `result.data ?? result` short-circuits
  // on the nullish data). Guard with an id check so we only treat this
  // as an active shift when there actually is one.
  const activeShift =
    activeShiftRaw && typeof activeShiftRaw === 'object' && 'id' in activeShiftRaw
      ? (activeShiftRaw as ActiveShift)
      : null;

  // Same seed regex as the rest of the portal — keeps "CHAIN-H 2WC9QT
  // routine patrol" demo pollution off the shift log so real guards
  // see a clean feed.
  const allEntries = useMemo<ShiftEntry[]>(() => {
    const raw = apiEntries ?? [];
    return raw.filter((e) => !isTestSeedTitle(e.title) && !isTestSeedTitle(e.description));
  }, [apiEntries]);

  // Last shift's summary — derived from the entries with createdAt
  // belonging to the shift that just ended. We render it as an
  // AI-style auto-briefing card up top so the on-shift guard knows
  // "what mattered before I started" in one glance.
  const lastShiftSummary = useMemo(() => buildPriorShiftSummary(allEntries), [allEntries]);

  async function handleClockIn() {
    setClockBusy(true);
    try {
      const r = await fetch('/api/v1/shift-log/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': String(localStorage.getItem('demo_role')) }
            : {}),
        },
        body: JSON.stringify({ propertyId: getPropertyId() }),
      });
      if (r.ok) {
        setClockMessage({ type: 'success', text: 'Clocked in. Have a good shift.' });
        refetchShift();
      } else {
        const j = await r.json().catch(() => ({}));
        setClockMessage({ type: 'error', text: j.message || 'Failed to clock in.' });
      }
    } catch {
      setClockMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setClockBusy(false);
      setTimeout(() => setClockMessage(null), 4000);
    }
  }

  async function handleClockOut() {
    setClockBusy(true);
    try {
      const r = await fetch(`/api/v1/shift-log/clock?propertyId=${getPropertyId()}`, {
        method: 'DELETE',
        headers:
          typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': String(localStorage.getItem('demo_role')) }
            : {},
      });
      if (r.ok) {
        setClockMessage({ type: 'success', text: 'Clocked out. Shift closed.' });
        refetchShift();
      } else {
        const j = await r.json().catch(() => ({}));
        setClockMessage({ type: 'error', text: j.message || 'Failed to clock out.' });
      }
    } catch {
      setClockMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setClockBusy(false);
      setTimeout(() => setClockMessage(null), 4000);
    }
  }

  // Separate pinned bulletins from regular entries
  const bulletins = useMemo(() => allEntries.filter((e) => e.customFields?.pinned), [allEntries]);

  // Urgent/important entries flagged as pass-on notes
  const passOnEntries = useMemo(
    () =>
      allEntries.filter(
        (e) =>
          !e.customFields?.pinned &&
          (e.priority === 'urgent' || e.eventType?.name?.toLowerCase().includes('pass')),
      ),
    [allEntries],
  );

  // Regular shift log entries
  const regularEntries = useMemo(
    () =>
      allEntries.filter(
        (e) =>
          !e.customFields?.pinned &&
          e.priority !== 'urgent' &&
          !e.eventType?.name?.toLowerCase().includes('pass'),
      ),
    [allEntries],
  );

  const currentShift = getCurrentShift();
  const shiftTimes = getShiftTimes(currentShift);
  const CurrentShiftIcon = SHIFT_ICONS[currentShift] ?? Sunrise;

  return (
    <PageShell
      hero="emerald"
      title="Shift Log"
      description="Staff handoff notes and shift-to-shift communication."
      actions={
        <div className="flex items-center gap-2">
          {/* Clock controls: shows "Clock In" when no active shift, or a
              status pill + "Clock Out" when shift is open. This is the
              entry point Chain H (shift handoff) expects — without it
              the page had no way to even start a shift record. */}
          {activeShift ? (
            <>
              <span className="bg-success-50 text-success-700 border-success-200 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold">
                <span className="bg-success-500 h-2 w-2 animate-pulse rounded-full" />
                On shift since{' '}
                {new Date(activeShift.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <Button variant="secondary" size="sm" onClick={handleClockOut} disabled={clockBusy}>
                {clockBusy ? 'Working…' : 'Clock Out'}
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleClockIn} disabled={clockBusy}>
              {clockBusy ? 'Working…' : 'Clock In'}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowCreateDialog(true)}>
            <MessageSquare className="h-4 w-4" />
            Add Pass-On Note
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
          {/* End-of-shift report — the big new flow. Opens a wizard
              that auto-rolls up every entry and produces a draft for
              the user to review/edit, then submits to ShiftHandoff. */}
          <Button
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] hover:from-emerald-600 hover:to-teal-700"
          >
            <Sparkles className="h-4 w-4" />
            End shift &amp; submit report
          </Button>
        </div>
      }
    >
      {clockMessage && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-[14px] ${
            clockMessage.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-700'
              : 'border-error-200 bg-error-50 text-error-700'
          }`}
        >
          {clockMessage.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading shift log...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load shift log"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          {/* Current Shift Info */}
          <Card className="border-primary-200/60 to-primary-50/30 bg-gradient-to-r from-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${SHIFT_COLORS[currentShift]}`}
                >
                  <CurrentShiftIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Current Shift
                  </p>
                  <p className="text-[18px] font-bold text-neutral-900 capitalize">
                    {currentShift} Shift
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase">Start</p>
                    <p className="text-[14px] font-semibold text-neutral-700">{shiftTimes.start}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase">End</p>
                    <p className="text-[14px] font-semibold text-neutral-700">{shiftTimes.end}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-[11px] font-medium text-neutral-400 uppercase">
                      Entries Today
                    </p>
                    <p className="text-[14px] font-semibold text-neutral-700">
                      {allEntries.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* AI-style summary of the prior shift. Deterministically
              derived from entries (no LLM call), but the presentation
              feels like an intelligent briefing — three glanceable
              bullets and any urgent items lifted to the top. The on-
              shift guard sees this BEFORE they scroll through 50
              individual entries. */}
          {lastShiftSummary && (
            <div className="conc-rise relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 px-5 py-4 shadow-sm">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-rose-200/20 blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 shadow-sm ring-1 ring-amber-200/60">
                    <Sparkles
                      className="h-3.5 w-3.5 text-amber-600"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-[10.5px] font-semibold tracking-[0.1em] text-amber-700 uppercase">
                    Briefing
                  </span>
                  <span className="text-[11.5px] text-amber-700/70">
                    · from the {lastShiftSummary.label}
                  </span>
                </div>
                <ul className="mt-2.5 flex flex-col gap-1">
                  {lastShiftSummary.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13.5px] leading-relaxed text-neutral-800"
                    >
                      <span className="mt-2 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                {lastShiftSummary.important.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-amber-200/60">
                    <p className="text-[10.5px] font-semibold tracking-[0.08em] text-amber-700 uppercase">
                      Worth your attention
                    </p>
                    {lastShiftSummary.important.map((item, i) => (
                      <div key={i} className="text-[13px]">
                        <span className="font-medium text-neutral-900">{item.title}</span>
                        {item.description && (
                          <span className="text-neutral-600">
                            {' '}
                            — {item.description.slice(0, 140)}
                            {item.description.length > 140 ? '…' : ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pass-On Notes (urgent entries) */}
          {passOnEntries.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="text-warning-600 h-4 w-4" />
                <h2 className="text-warning-600 text-[12px] font-semibold tracking-[0.08em] uppercase">
                  Pass-On Notes ({passOnEntries.length})
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {passOnEntries.map((note) => (
                  <Card
                    key={note.id}
                    className="border-warning-200 bg-warning-50/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-warning-100 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                          <AlertTriangle className="text-warning-600 h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-neutral-900">
                              {note.title}
                            </span>
                            <Badge variant="warning" size="sm" dot>
                              {note.priority}
                            </Badge>
                          </div>
                          {note.description && (
                            <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-700">
                              {note.description}
                            </p>
                          )}
                          <p className="mt-1.5 text-[12px] text-neutral-400">
                            {new Date(note.createdAt).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Staff Bulletins (pinned entries) */}
          {bulletins.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Megaphone className="text-primary-600 h-4 w-4" />
                <h2 className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                  Staff Bulletins
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {bulletins.map((bulletin) => (
                  <Card key={bulletin.id} hoverable className="cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-50 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                        <Megaphone className="text-primary-600 h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-neutral-900">
                            {bulletin.title}
                          </span>
                          <Badge variant="primary" size="sm">
                            Pinned
                          </Badge>
                        </div>
                        {bulletin.description && (
                          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                            {bulletin.description}
                          </p>
                        )}
                        <p className="mt-1.5 text-[12px] text-neutral-400">
                          {new Date(bulletin.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-400" />
              <span className="text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                Filter by Priority
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'important', 'normal', 'urgent'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntryTypeFilter(type)}
                  className={`rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                    entryTypeFilter === type
                      ? type === 'important' || type === 'urgent'
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-neutral-900 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Log Entries */}
          <div className="flex flex-col gap-4">
            {regularEntries.length === 0 && passOnEntries.length === 0 && bulletins.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="No shift log entries"
                description="Shift log entries will appear here as staff add them during their shifts."
                action={
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </Button>
                }
              />
            ) : regularEntries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                    <MessageSquare className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-[15px] font-medium text-neutral-900">No regular entries</p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    Try adjusting your filters or add a new entry.
                  </p>
                </CardContent>
              </Card>
            ) : (
              regularEntries.map((entry) => {
                const entryShift = getEntryShift(entry.createdAt);
                const entryHref = `/shift-log/${entry.id}`;
                return (
                  <Link key={entry.id} href={entryHref as never} className="block">
                    <Card className="transition-all duration-200 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                            <User className="h-4 w-4 text-neutral-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-neutral-900">
                                {entry.title}
                              </span>
                              {entry.eventType?.name && (
                                <span className="text-[12px] text-neutral-400">
                                  {entry.eventType.name}
                                </span>
                              )}
                              <Badge
                                variant="default"
                                size="sm"
                                className={SHIFT_COLORS[entryShift] ?? ''}
                              >
                                {entryShift}
                              </Badge>
                              {entry.priority === 'important' && (
                                <Badge variant="warning" size="sm" dot>
                                  Important
                                </Badge>
                              )}
                            </div>
                            {entry.description && (
                              <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                                {entry.description}
                              </p>
                            )}
                            <p className="mt-2 text-[12px] text-neutral-400">
                              {new Date(entry.createdAt).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                              {entry.referenceNo && ` \u00B7 Ref: ${entry.referenceNo}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}

      <CreateShiftEntryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
      <SubmitShiftReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowReportDialog(false);
          refetch();
          // Also clock out if there's an active shift so the report
          // and the time card stay in sync.
          if (activeShift) handleClockOut();
        }}
      />
    </PageShell>
  );
}
