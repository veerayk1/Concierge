'use client';

/**
 * Concierge — Debug Intelligence Dashboard
 *
 * Internal tool for Super Admins to review captured debug events during
 * active development and testing. Shows auto-captured errors, action trails,
 * correlations, and tester annotations to speed up root-cause diagnosis.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bug,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Server,
  Monitor,
  Loader2,
  Filter,
  Link2,
  GitBranch,
  CheckCircle2,
  Search,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import type { DebugEvent } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DebugEventsResponse {
  data: DebugEvent[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface CorrelatedEvent {
  id: string;
  type: string;
  severity: string;
  source: string;
  title: string;
  route: string | null;
  module: string | null;
  errorCode: string | null;
  createdAt: string | Date;
}

interface EventWithCorrelations extends DebugEvent {
  correlatedByRequest: CorrelatedEvent[];
  correlatedBySession: CorrelatedEvent[];
  fingerprintGroup: {
    count: number;
    firstSeen: string;
    lastSeen: string;
    affectedSessions: number;
  } | null;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    Icon: AlertCircle,
  },
  HIGH: {
    label: 'High',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    Icon: AlertTriangle,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
    Icon: AlertTriangle,
  },
  LOW: {
    label: 'Low',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-400',
    Icon: Info,
  },
  INFO: {
    label: 'Info',
    color: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    dot: 'bg-neutral-400',
    Icon: Info,
  },
} as const;

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'bg-red-50 text-red-600 border-red-100' },
  INVESTIGATING: {
    label: 'Investigating',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  },
  FIXED: { label: 'Fixed', color: 'bg-green-50 text-green-700 border-green-100' },
  WONT_FIX: { label: "Won't Fix", color: 'bg-neutral-50 text-neutral-500 border-neutral-100' },
  DUPLICATE: { label: 'Duplicate', color: 'bg-purple-50 text-purple-600 border-purple-100' },
} as const;

const SOURCE_CONFIG = {
  client: { label: 'Client', Icon: Monitor },
  server: { label: 'Server', Icon: Server },
} as const;

type Severity = keyof typeof SEVERITY_CONFIG;
type Status = keyof typeof STATUS_CONFIG;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build auth headers for fetch calls — handles both demo mode and real JWT auth. */
function getDebugAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window === 'undefined') return headers;
  const demoRole = localStorage.getItem('demo_role');
  if (demoRole) {
    headers['x-demo-role'] = demoRole;
  }
  return headers;
}

function timeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.INFO;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: 'client' | 'server' }) {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.client;
  const IconComp = cfg.Icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] text-neutral-500">
      <IconComp className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function CollapsibleBlock({
  label,
  children,
  defaultOpen = false,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-medium text-neutral-600 hover:bg-neutral-50"
      >
        <span className="flex items-center gap-2">
          {label}
          {badge !== undefined && (
            <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
              {badge}
            </span>
          )}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="border-t border-neutral-100 px-3 py-2">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel
// ---------------------------------------------------------------------------

function DetailPanel({
  event: initialEvent,
  onClose,
  onUpdated,
}: {
  event: DebugEvent;
  onClose: () => void;
  onUpdated: (updated: DebugEvent) => void;
}) {
  const [event, setEvent] = useState<DebugEvent>(initialEvent);
  const [correlations, setCorrelations] = useState<EventWithCorrelations | null>(null);
  const [correlationsLoading, setCorrelationsLoading] = useState(false);
  const [testerNote, setTesterNote] = useState(initialEvent.testerNote ?? '');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copyingPacket, setCopyingPacket] = useState(false);
  const [copiedPacket, setCopiedPacket] = useState(false);
  const noteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load correlations when panel opens
  useEffect(() => {
    setEvent(initialEvent);
    setTesterNote(initialEvent.testerNote ?? '');

    setCorrelationsLoading(true);
    fetch(`/api/v1/debug/events/${initialEvent.id}`, { headers: getDebugAuthHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setCorrelations(json.data as EventWithCorrelations);
      })
      .catch(() => {})
      .finally(() => setCorrelationsLoading(false));
  }, [initialEvent.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback(
    async (updates: Record<string, unknown>) => {
      const res = await fetch(`/api/v1/debug/events/${event.id}`, {
        method: 'PATCH',
        headers: getDebugAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data as DebugEvent;
        setEvent(updated);
        onUpdated(updated);
        return updated;
      }
    },
    [event.id, onUpdated],
  );

  // Auto-save tester note (debounced 800ms)
  const handleNoteChange = (val: string) => {
    setTesterNote(val);
    if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
    noteTimeoutRef.current = setTimeout(() => {
      setSavingNote(true);
      patch({ testerNote: val }).finally(() => setSavingNote(false));
    }, 800);
  };

  const handleStatusChange = async (newStatus: Status) => {
    if (event.status === newStatus) return;
    setUpdatingStatus(true);
    await patch({ status: newStatus });
    setUpdatingStatus(false);
  };

  const handleCopyAiPacket = async () => {
    if (copyingPacket) return;
    setCopyingPacket(true);
    try {
      const res = await fetch(`/api/v1/debug/events/${event.id}/ai-packet`, {
        headers: getDebugAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch AI packet');
      const json = await res.json();
      const prompt: string = json.data?.claudePrompt ?? '';
      await navigator.clipboard.writeText(prompt);
      setCopiedPacket(true);
      setTimeout(() => setCopiedPacket(false), 2500);
    } catch {
      // silently fail — clipboard may not be available in all contexts
    } finally {
      setCopyingPacket(false);
    }
  };

  const severityCfg = SEVERITY_CONFIG[event.severity as Severity] ?? SEVERITY_CONFIG.INFO;
  const SevIcon = severityCfg.Icon;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <SevIcon
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              event.severity === 'CRITICAL'
                ? 'text-red-600'
                : event.severity === 'HIGH'
                  ? 'text-orange-500'
                  : 'text-yellow-500'
            }`}
          />
          <div className="min-w-0">
            <p className="text-[13px] leading-snug font-semibold text-neutral-900">{event.title}</p>
            <p className="mt-0.5 text-[11px] text-neutral-400">{formatDate(event.createdAt)}</p>
          </div>
        </div>
        <div className="ml-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleCopyAiPacket()}
            disabled={copyingPacket}
            title="Copy AI prompt for this bug to clipboard"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              copiedPacket
                ? 'bg-green-50 text-green-600'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
            }`}
          >
            {copyingPacket ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : copiedPacket ? (
              <Check className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {copiedPacket ? 'Copied!' : 'AI Prompt'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={event.severity as Severity} />
          <StatusBadge status={event.status as Status} />
          <SourceBadge source={event.source as 'client' | 'server'} />
          {event.module && (
            <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] text-neutral-500">
              {event.module}
            </span>
          )}
          {event.isManualFlag && (
            <span className="inline-flex items-center rounded-md border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-600">
              Manual
            </span>
          )}
        </div>

        {/* Status actions */}
        <div>
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
            Change Status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['OPEN', 'INVESTIGATING', 'FIXED', 'WONT_FIX', 'DUPLICATE'] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={updatingStatus}
                onClick={() => void handleStatusChange(s)}
                className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                  event.status === s
                    ? STATUS_CONFIG[s].color + ' cursor-default'
                    : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {event.status === s && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                {STATUS_CONFIG[s].label}
              </button>
            ))}
            {updatingStatus && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
          </div>
        </div>

        {/* Core fields */}
        <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
          {event.route && (
            <div>
              <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                Route
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-neutral-700">{event.route}</p>
            </div>
          )}
          {event.errorCode && (
            <div>
              <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                Error Code
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-neutral-700">{event.errorCode}</p>
            </div>
          )}
          {event.errorMessage && (
            <div>
              <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                Error Message
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-700">{event.errorMessage}</p>
            </div>
          )}
          {event.userRole && (
            <div>
              <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                User Role
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-700">{event.userRole}</p>
            </div>
          )}
          {event.requestId && (
            <div>
              <p className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                <Link2 className="h-3 w-3" /> Request ID
              </p>
              <p className="mt-0.5 font-mono text-[11px] break-all text-neutral-500">
                {event.requestId}
              </p>
            </div>
          )}
          {event.sessionId && (
            <div>
              <p className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                Session ID
              </p>
              <p className="mt-0.5 font-mono text-[11px] break-all text-neutral-500">
                {event.sessionId}
              </p>
            </div>
          )}
          {event.fingerprint && (
            <div>
              <p className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
                <GitBranch className="h-3 w-3" /> Fingerprint
              </p>
              <p className="mt-0.5 font-mono text-[11px] break-all text-neutral-500">
                {event.fingerprint}
              </p>
            </div>
          )}
          {event.duplicateOf && (
            <div className="rounded-md border border-purple-100 bg-purple-50 px-2 py-1.5">
              <p className="text-[11px] text-purple-600">
                Duplicate of: <span className="font-mono">{event.duplicateOf}</span>
              </p>
            </div>
          )}
        </div>

        {/* Correlations */}
        {correlationsLoading ? (
          <div className="flex items-center gap-2 py-2 text-[12px] text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading correlations…
          </div>
        ) : correlations ? (
          <>
            {/* Fingerprint group */}
            {correlations.fingerprintGroup && correlations.fingerprintGroup.count > 1 && (
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                <p className="text-[11px] font-medium text-orange-700">
                  Recurring issue — {correlations.fingerprintGroup.count} occurrences across{' '}
                  {correlations.fingerprintGroup.affectedSessions} session(s)
                </p>
                <p className="mt-0.5 text-[10px] text-orange-500">
                  First: {timeAgo(correlations.fingerprintGroup.firstSeen)} · Last:{' '}
                  {timeAgo(correlations.fingerprintGroup.lastSeen)}
                </p>
              </div>
            )}

            {/* Server-side correlations (same requestId) */}
            {correlations.correlatedByRequest.length > 0 && (
              <CollapsibleBlock
                label="Server-Side Partner (same requestId)"
                defaultOpen={true}
                badge={correlations.correlatedByRequest.length}
              >
                <div className="space-y-1.5">
                  {correlations.correlatedByRequest.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-md border border-neutral-200 bg-white px-2 py-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={e.severity as Severity} />
                        <span className="font-mono text-[10px] text-neutral-400">{e.source}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-neutral-700">{e.title}</p>
                      {e.errorCode && (
                        <p className="font-mono text-[10px] text-neutral-400">{e.errorCode}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleBlock>
            )}

            {/* Session events */}
            {correlations.correlatedBySession.length > 0 && (
              <CollapsibleBlock
                label="Same Session (±10 min)"
                defaultOpen={false}
                badge={correlations.correlatedBySession.length}
              >
                <div className="space-y-1">
                  {correlations.correlatedBySession.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 text-[11px]">
                      <SeverityBadge severity={e.severity as Severity} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-700">{e.title}</p>
                        <p className="text-[10px] text-neutral-400">{timeAgo(e.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleBlock>
            )}
          </>
        ) : null}

        {/* Stack trace */}
        {event.stackTrace && (
          <CollapsibleBlock label="Stack Trace" defaultOpen={false}>
            <pre className="max-h-48 overflow-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-neutral-600">
              {event.stackTrace}
            </pre>
          </CollapsibleBlock>
        )}

        {/* Action trail */}
        {event.actionTrail && (
          <CollapsibleBlock label="Action Trail" defaultOpen={true}>
            {(() => {
              const trail = event.actionTrail as Array<{
                type: string;
                timestamp: string;
                route: string;
                element?: string;
              }>;
              if (!Array.isArray(trail) || trail.length === 0) {
                return <p className="text-[12px] text-neutral-400">No actions captured</p>;
              }
              return (
                <ol className="space-y-1">
                  {trail.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                      <div className="min-w-0">
                        <span className="font-medium text-neutral-600">{action.type}</span>
                        <span className="text-neutral-400"> on </span>
                        <span className="font-mono text-neutral-600">{action.route}</span>
                        {action.element && (
                          <span className="text-neutral-400"> ({action.element})</span>
                        )}
                        <div className="text-[10px] text-neutral-400">
                          {new Date(action.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              );
            })()}
          </CollapsibleBlock>
        )}

        {/* Context JSON */}
        {event.context && (
          <CollapsibleBlock label="Context" defaultOpen={false}>
            <pre className="max-h-40 overflow-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-neutral-600">
              {JSON.stringify(event.context, null, 2)}
            </pre>
          </CollapsibleBlock>
        )}

        {/* Tester note editor */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-neutral-400" />
            <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
              Tester Note
            </p>
            {savingNote && <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />}
            {!savingNote && testerNote && <CheckCircle2 className="h-3 w-3 text-green-500" />}
          </div>
          <textarea
            value={testerNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Add a note about what you were doing, what you observed..."
            rows={3}
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] text-neutral-800 placeholder-neutral-400 transition-colors outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
const STATUS_OPTIONS = ['OPEN', 'INVESTIGATING', 'FIXED', 'WONT_FIX', 'DUPLICATE'] as const;

export default function DebugIntelligencePage() {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DebugEvent | null>(null);

  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [module, setModule] = useState('');
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severity) params.set('severity', severity);
      if (status) params.set('status', status);
      if (module) params.set('module', module);
      params.set('page', String(page));
      params.set('pageSize', '50');

      const res = await fetch(`/api/v1/debug/events?${params.toString()}`, {
        headers: getDebugAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as DebugEventsResponse;
      setEvents(json.data ?? []);
      setMeta(json.meta ?? { page: 1, pageSize: 50, total: 0, totalPages: 0 });
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [severity, status, module, page]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // Sync selected event if it was updated in-panel
  const handleEventUpdated = useCallback((updated: DebugEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEvent(updated);
  }, []);

  return (
    <PageShell
      title="Debug Intelligence"
      description="Auto-captured errors, action trails, and correlations during active development"
    >
      {/* Filter bar */}
      <Card padding="sm" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
            <Filter className="h-3.5 w-3.5" />
            Filters:
          </div>

          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[12px] text-neutral-700 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
          >
            <option value="">All Severities</option>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_CONFIG[s].label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[12px] text-neutral-700 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPage(1);
              }}
              placeholder="Module…"
              className="h-8 rounded-lg border border-neutral-200 bg-white pr-2 pl-6 text-[12px] text-neutral-700 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
            />
          </div>

          {(severity || status !== 'OPEN' || module) && (
            <button
              type="button"
              onClick={() => {
                setSeverity('');
                setStatus('OPEN');
                setModule('');
                setPage(1);
              }}
              className="text-[12px] text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-neutral-400">{meta.total} events</span>
            <Button variant="ghost" size="sm" onClick={() => void fetchEvents()} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Two-panel layout */}
      <div className="flex min-h-0 gap-4">
        {/* Event list */}
        <div className={`flex flex-col ${selectedEvent ? 'w-[58%]' : 'w-full'} transition-all`}>
          <Card padding="none" className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bug className="mb-3 h-8 w-8 text-neutral-300" />
                <p className="text-[14px] font-medium text-neutral-500">No debug events found</p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Events are captured automatically when errors occur during testing.
                </p>
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Severity</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Module</th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Title</th>
                    <th className="hidden px-3 py-2 text-left font-medium text-neutral-500 lg:table-cell">
                      Route
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">
                      <Clock className="h-3.5 w-3.5" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const isSelected = selectedEvent?.id === event.id;
                    return (
                      <tr
                        key={event.id}
                        onClick={() => setSelectedEvent(isSelected ? null : event)}
                        className={`cursor-pointer border-b border-neutral-50 transition-colors hover:bg-neutral-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <SeverityBadge severity={event.severity as Severity} />
                        </td>
                        <td className="px-3 py-2">
                          {event.module ? (
                            <span className="font-mono text-[11px] text-neutral-500">
                              {event.module}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="max-w-[200px] px-3 py-2">
                          <p className="truncate font-medium text-neutral-800" title={event.title}>
                            {event.title}
                          </p>
                          {event.errorCode && (
                            <p className="truncate font-mono text-[10px] text-neutral-400">
                              {event.errorCode}
                            </p>
                          )}
                        </td>
                        <td className="hidden max-w-[150px] px-3 py-2 lg:table-cell">
                          {event.route ? (
                            <span
                              className="truncate font-mono text-[10px] text-neutral-400"
                              title={event.route}
                            >
                              {event.route}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-neutral-400">
                          {timeAgo(event.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={event.status as Status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-[12px] text-neutral-500">
              <span>
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedEvent && (
          <div className="w-[42%]">
            <Card padding="none" className="sticky top-4 max-h-[calc(100vh-12rem)] overflow-hidden">
              <DetailPanel
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onUpdated={handleEventUpdated}
              />
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
