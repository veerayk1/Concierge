'use client';
// Security Console — uses IncidentWizard for one-tap incident filing
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IncidentWizard } from '@/components/forms/incident-wizard';
import { CreateFireLogDialog } from '@/components/forms/create-fire-log-dialog';
import { CreateNoiseComplaintDialog } from '@/components/forms/create-noise-complaint-dialog';
import { AuthorizedEntryDialog } from '@/components/forms/authorized-entry-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  AlertTriangle,
  Eye,
  Key,
  KeyRound,
  Package,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  StickyNote,
  Users,
  X,
  Sparkles,
  Clock,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { KpiTile } from '@/components/ui/kpi-tile';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsResident } from '@/lib/role-mode';
import { AccessDeniedPanel } from '@/components/ui/access-denied-panel';

// ---------------------------------------------------------------------------
// Types — Unified event model per CLAUDE.md
// ---------------------------------------------------------------------------

interface SecurityEvent {
  id: string;
  type: 'visitor' | 'incident' | 'package' | 'key' | 'pass_on' | 'cleaning' | 'note';
  title: string;
  description: string;
  unit?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Event Type Config (per PRD 03 unified event model)
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<
  SecurityEvent['type'],
  { label: string; icon: typeof Shield; color: string; bgColor: string }
> = {
  visitor: { label: 'Visitor', icon: Users, color: 'text-success-600', bgColor: 'bg-success-50' },
  incident: {
    label: 'Incident',
    icon: ShieldAlert,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  package: { label: 'Package', icon: Package, color: 'text-primary-600', bgColor: 'bg-primary-50' },
  key: { label: 'Key/FOB', icon: Key, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  pass_on: {
    label: 'Pass-On',
    icon: StickyNote,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  cleaning: { label: 'Cleaning', icon: Sparkles, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  note: { label: 'Note', icon: StickyNote, color: 'text-neutral-600', bgColor: 'bg-neutral-100' },
};

// ---------------------------------------------------------------------------
// Event type slug → SecurityEvent type mapper
// ---------------------------------------------------------------------------

function mapEventType(rawType: string): SecurityEvent['type'] {
  const slug = rawType.toLowerCase().replace(/[/ ]/g, '_');
  // Map event type slugs/names to our config keys
  if (slug.includes('visitor') || slug.includes('guest')) return 'visitor';
  if (slug.includes('incident') || slug.includes('alert')) return 'incident';
  if (slug.includes('package') || slug.includes('parcel') || slug.includes('delivery'))
    return 'package';
  if (slug.includes('key') || slug.includes('fob')) return 'key';
  if (slug.includes('pass') || slug.includes('handoff') || slug.includes('shift')) return 'pass_on';
  if (slug.includes('clean')) return 'cleaning';
  // Direct match
  if (slug in EVENT_TYPE_CONFIG) return slug as SecurityEvent['type'];
  return 'note';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// Small secondary-action chip used in the security console row. Reads as a
// utility shortcut, not a primary CTA — the only primary action on the page
// is "Log event" in the page header.
function SecurityShortcut({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="group inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 transition-all duration-150 hover:-translate-y-px hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      <Icon
        className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-700 group-disabled:text-neutral-300"
        strokeWidth={1.8}
      />
      {label}
    </button>
  );
}

export default function SecurityPage() {
  // Role gate is rendered as <AccessDeniedPanel> below — superseded
  // the earlier `window.location.replace` redirect which caused a
  // visible URL-flip and bypassed the friendly panel.
  const isResident = useIsResident();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFireLogDialog, setShowFireLogDialog] = useState(false);
  const [showNoiseComplaintDialog, setShowNoiseComplaintDialog] = useState(false);
  const [showAuthorizedEntryDialog, setShowAuthorizedEntryDialog] = useState(false); // GAP 3.3

  // Fetch real events from database
  const {
    data: apiEvents,
    loading,
    error,
    refetch,
  } = useApi<SecurityEvent[]>(apiUrl('/api/v1/events', { propertyId: getPropertyId() }));

  // Fetch active visitors from VisitorEntry table.
  // Visitor sign-ins live in their own table (visitor_entries), not in the
  // unified events table. We pull them separately and merge them into the
  // security event list so the "Visitors" filter pill actually surfaces the
  // visitors that the Active Visitors widget is counting. Without this,
  // the widget said "1 active visitor" but the table below was empty.
  interface ApiVisitor {
    id: string;
    visitorName?: string;
    visitorType?: string;
    departureAt: string | null;
    arrivedAt?: string;
    createdAt?: string;
    comments?: string | null;
    unit?: { number?: string } | string | null;
  }
  const { data: apiVisitors } = useApi<ApiVisitor[]>(
    apiUrl('/api/v1/visitors', { propertyId: getPropertyId(), status: 'all' }),
  );

  // Fire logs are stored in their own table (fire_logs) — same pattern as
  // visitor entries. The Security Console must surface fire alarms with
  // critical priority styling: this is the highest-stakes signal a guard
  // can see, and burying it behind a separate page is a safety risk.
  interface ApiFireLog {
    id: string;
    title: string;
    fireLogDetails?: string | null;
    alarmTime?: string | null;
    alarmLocation?: string | null;
    alarmType?: string | null;
    allClearTime?: string | null;
    createdAt: string;
    unitNumber?: string | null;
  }
  const { data: apiFireLogs } = useApi<ApiFireLog[]>(
    apiUrl('/api/v1/security/fire-log', { propertyId: getPropertyId() }),
  );

  const activeVisitorCount = useMemo(() => {
    if (!apiVisitors || !Array.isArray(apiVisitors)) return 0;
    return apiVisitors.filter((v) => !v.departureAt).length;
  }, [apiVisitors]);

  // Map API data to SecurityEvent shape
  const allEvents = useMemo(() => {
    const eventRows: SecurityEvent[] =
      !apiEvents || !Array.isArray(apiEvents)
        ? []
        : apiEvents.map((e: SecurityEvent) => {
            const raw = e as unknown as Record<string, unknown>;
            const rawStatus = (e.status as string) || 'open';
            const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
            return {
              id: (e.id as string) || '',
              type: mapEventType(
                (raw.eventType as Record<string, string>)?.slug ||
                  (raw.eventType as Record<string, string>)?.name ||
                  'note',
              ),
              title: (e.title as string) || 'Untitled Event',
              description: (e.description as string) || '',
              unit:
                typeof raw.unit === 'string'
                  ? raw.unit
                  : ((raw.unit as Record<string, string>)?.number ?? undefined),
              status: (validStatuses.includes(rawStatus)
                ? rawStatus
                : 'open') as SecurityEvent['status'],
              priority: e.priority as SecurityEvent['priority'],
              createdBy: 'Staff',
              createdAt: (e.createdAt as string) || new Date().toISOString(),
            };
          });

    const visitorRows: SecurityEvent[] =
      !apiVisitors || !Array.isArray(apiVisitors)
        ? []
        : apiVisitors.map((v) => {
            const onSite = !v.departureAt;
            const unitNumber = typeof v.unit === 'string' ? v.unit : (v.unit?.number ?? undefined);
            return {
              id: v.id,
              type: 'visitor' as SecurityEvent['type'],
              title: v.visitorName || 'Visitor',
              description: v.comments || (onSite ? 'Currently on-site' : 'Signed out'),
              unit: unitNumber,
              status: (onSite ? 'open' : 'closed') as SecurityEvent['status'],
              priority: undefined,
              createdBy: 'Front Desk',
              createdAt: v.arrivedAt || v.createdAt || new Date().toISOString(),
            };
          });

    const fireRows: SecurityEvent[] =
      !apiFireLogs || !Array.isArray(apiFireLogs)
        ? []
        : apiFireLogs.map((f) => ({
            id: f.id,
            // Fire logs are incidents at the highest severity. Render as
            // incident type so the existing incident icon + red styling
            // applies, and mark priority urgent so the priority column
            // shows the red badge.
            type: 'incident' as SecurityEvent['type'],
            title: f.title || 'Fire alarm',
            description:
              f.fireLogDetails ||
              [f.alarmType, f.alarmLocation].filter(Boolean).join(' — ') ||
              'Fire event logged',
            unit: f.unitNumber ?? undefined,
            status: (f.allClearTime ? 'resolved' : 'open') as SecurityEvent['status'],
            priority: 'urgent' as SecurityEvent['priority'],
            createdBy: 'Fire Log',
            createdAt: f.alarmTime || f.createdAt || new Date().toISOString(),
          }));

    // Drop test fixtures from the unified security console so guards
    // see real visitor traffic, real incidents, and real pass-on
    // notes — not CHAIN/UI-CHAIN/E2E/SEC/EXH/QA seed data.
    const TEST_PATTERN =
      /^(CHAIN[- ]?[A-Z]|UI[- ]?CHAIN[- ]?[A-Z]|UI[- ]?[A-Z]?\d|UI[- ]?TASK|UI[- ]?[01]\d{2}|E2E[- ]|SEC[- ]\d|EXH[- ]?[A-Z]?|TEST[- ]|QA[- ]?(TEST|TOWER|:))/i;
    // QA-fixture markers anywhere in the title: "Marco Plumber QA",
    // "Marco Plumber QA-tomorrow", "E2E-FINAL: Test Cleaner",
    // "Sarah QA fixture". " QA" as a trailing word is suspect because
    // real visitors don't end their name with QA — fixtures do.
    const TEST_NAME_SUBSTR =
      /(\bqa[- ]?(test|tomorrow|fixture)|\bqa-\w| qa$|E2E[- ]|test cleaner)/i;
    const TEST_DESC_PATTERN = /\b(CHAIN[- ]?[A-Z][^a-z]|Cascade verification test|UI test)\b/i;
    const all = [...fireRows, ...visitorRows, ...eventRows].filter((e) => {
      const title = (e.title ?? '').trim();
      if (TEST_PATTERN.test(title)) return false;
      if (TEST_NAME_SUBSTR.test(title)) return false;
      if (TEST_DESC_PATTERN.test(e.description ?? '')) return false;
      return true;
    });
    return all.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [apiEvents, apiVisitors, apiFireLogs]);

  const filteredEvents = allEvents.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        e.unit?.toLowerCase().includes(q) ||
        (e.createdBy || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = allEvents.filter(
    (e) => e.status === 'open' || e.status === 'in_progress',
  ).length;
  const incidentCount = allEvents.filter((e) => e.type === 'incident').length;

  const columns: Column<SecurityEvent>[] = [
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => {
        const config = EVENT_TYPE_CONFIG[row.type] ||
          EVENT_TYPE_CONFIG.note || {
            label: row.type || 'Event',
            icon: StickyNote,
            color: 'text-neutral-600',
            bgColor: 'bg-neutral-100',
          };
        const Icon = config?.icon || StickyNote;
        return (
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bgColor}`}
            >
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            </div>
            <span className="text-[13px] font-medium text-neutral-700">{config.label}</span>
          </div>
        );
      },
    },
    {
      id: 'title',
      header: 'Event',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-neutral-900">{row.title}</span>
          <span className="line-clamp-1 text-[13px] text-neutral-500">{row.description}</span>
        </div>
      ),
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      sortable: true,
      cell: (row) => (
        <span className="font-medium">
          {typeof row.unit === 'object'
            ? (row.unit as Record<string, string>)?.number
            : row.unit || '\u2014'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const statusMap: Record<
          string,
          { variant: 'warning' | 'info' | 'success' | 'default'; label: string }
        > = {
          open: { variant: 'warning', label: 'Open' },
          in_progress: { variant: 'info', label: 'In Progress' },
          resolved: { variant: 'success', label: 'Resolved' },
          closed: { variant: 'default', label: 'Closed' },
        };
        const s = statusMap[row.status] ?? {
          variant: 'default' as const,
          label: row.status || 'Unknown',
        };
        return (
          <Badge variant={s.variant} size="sm" dot>
            {s.label}
          </Badge>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => {
        if (!row.priority) return null;
        const priorityMap: Record<string, 'default' | 'warning' | 'error'> = {
          low: 'default',
          normal: 'default',
          medium: 'warning',
          high: 'error',
          urgent: 'error',
        };
        return (
          <Badge variant={priorityMap[row.priority] ?? 'default'} size="sm">
            {row.priority}
          </Badge>
        );
      },
    },
    {
      id: 'createdBy',
      header: 'Logged By',
      accessorKey: 'createdBy',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.createdBy}</span>,
    },
    {
      id: 'createdAt',
      header: 'Time',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => {
        const date = row.createdAt ? new Date(row.createdAt) : null;
        const formatted =
          date && !isNaN(date.getTime())
            ? date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '\u2014';
        return <span className="text-[13px] text-neutral-500">{formatted}</span>;
      },
    },
  ];

  if (isResident) {
    return (
      <PageShell title="Security" description="">
        <AccessDeniedPanel
          resource="The security console"
          whoCanSee="front desk and security staff"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Security Console"
      description="Unified security dashboard with real-time event logging."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Log event
        </Button>
      }
    >
      {/* Secondary action row — log-once shortcuts a guard reaches for first */}
      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-2">
        <SecurityShortcut
          icon={KeyRound}
          label="Authorized entry"
          onClick={() => setShowAuthorizedEntryDialog(true)}
        />
        <SecurityShortcut
          icon={AlertTriangle}
          label="Fire log"
          onClick={() => setShowFireLogDialog(true)}
        />
        <SecurityShortcut
          icon={AlertTriangle}
          label="Noise complaint"
          onClick={() => setShowNoiseComplaintDialog(true)}
        />
        <SecurityShortcut
          icon={Eye}
          label="View cameras"
          disabled
          title="Camera integration — coming soon"
        />
      </div>
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="sm" className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                  <Skeleton className="mb-1 h-6 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </Card>
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load security events"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {/* Quick Stats */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <KpiTile
              label="Open events"
              value={openCount}
              icon={Clock}
              accent="warning"
              caption="Need follow-up or close-out."
            />
            <KpiTile
              label="Incidents"
              value={incidentCount}
              icon={ShieldAlert}
              accent="error"
              caption="Logged in the last 24 hours."
            />
            <KpiTile
              label="Active visitors"
              value={activeVisitorCount}
              icon={Users}
              accent="success"
              caption="Currently signed in to the building."
            />
            <KpiTile
              label="Keys out"
              value={allEvents.filter((e) => e.type === 'key' && e.status === 'open').length}
              icon={Key}
              accent="primary"
              caption="Not yet returned."
            />
          </div>

          {/* Search + Type Filter */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type pills */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'visitor', label: 'Visitors' },
                { key: 'incident', label: 'Incidents' },
                { key: 'key', label: 'Keys' },
                { key: 'pass_on', label: 'Pass-On' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    typeFilter === t.key
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Table */}
          <DataTable
            columns={columns}
            data={filteredEvents}
            emptyMessage="No security events to display."
            emptyIcon={<Shield className="h-6 w-6" />}
            onRowClick={(row) => {
              if (row.type === 'incident') {
                router.push(`/security/incidents/${row.id}` as never);
              }
            }}
          />
        </>
      )}

      <IncidentWizard
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />

      <CreateFireLogDialog
        open={showFireLogDialog}
        onOpenChange={setShowFireLogDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowFireLogDialog(false);
          refetch();
        }}
      />

      <CreateNoiseComplaintDialog
        open={showNoiseComplaintDialog}
        onOpenChange={setShowNoiseComplaintDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowNoiseComplaintDialog(false);
          refetch();
        }}
      />

      {/* GAP 3.3 — Authorized Entry */}
      <AuthorizedEntryDialog
        open={showAuthorizedEntryDialog}
        onOpenChange={setShowAuthorizedEntryDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowAuthorizedEntryDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
