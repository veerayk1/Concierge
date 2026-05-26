'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Plus, Search, ShieldAlert, X, Loader2 } from 'lucide-react';
import { IncidentWizard } from '@/components/forms/incident-wizard';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { exportToCsv } from '@/lib/export-csv';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types — matches API response shape from GET /api/v1/events
// ---------------------------------------------------------------------------

interface ApiEvent {
  id: string;
  referenceNo: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdById: string;
  closedById: string | null;
  createdAt: string;
  closedAt: string | null;
  eventType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  unit: {
    id: string;
    number: string;
  } | null;
  // The incident wizard stores the actual incident type (fire,
  // medical, security, etc.) in customFields.category — eventType
  // is always the generic "Incident Report". Use the wizard value
  // when present so the table differentiates fire-alarm from a
  // noise complaint at a glance.
  customFields?: {
    category?: string;
    incidentTypeKey?: string;
    location?: string | null;
  } | null;
}

interface ApiResponse {
  data: ApiEvent[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface Incident {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  category: string;
  unit?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  assignedTo?: string;
  reportedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IncidentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Fetch security events from the unified event model
  // The events API filters by eventGroup when we pass the security event types
  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<ApiResponse>(
    apiUrl('/api/v1/events', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      pageSize: '100',
    }),
  );

  const incidents = useMemo<Incident[]>(() => {
    const events = apiResponse?.data ?? (apiResponse as unknown as ApiEvent[]);
    if (!events || !Array.isArray(events)) return [];

    // Filter out non-incident event types — the unified events feed
    // also contains shift logs, packages, visitors, etc. The Incidents
    // page should only show events whose type is the incident-report
    // type (slug 'incident-report' or 'incident_report' — both seed
    // patterns are valid).
    const INCIDENT_NAME_PATTERN = /^incident( report)?$/i;
    // Same test-seed filter pattern as the residents directory —
    // CHAIN-*, UI-CHAIN, E2E, SEC, EXH, TEST are demo-data prefixes
    // that should not pollute the production-feel security console.
    const TEST_TITLE_PATTERN =
      /^(CHAIN[- ]?[A-Z]|UI[- ]?CHAIN[- ]?[A-Z]|E2E[- ]|SEC[- ]\d|EXH[- ]|TEST[- ]|UI-?H[- ]?\d)/i;
    return events
      .filter((evt) => {
        const name = evt.eventType?.name?.trim() ?? '';
        if (!INCIDENT_NAME_PATTERN.test(name)) return false;
        if (TEST_TITLE_PATTERN.test(evt.title?.trim() ?? '')) return false;
        return true;
      })
      .map((evt) => ({
        id: evt.id,
        referenceNumber: evt.referenceNo || 'N/A',
        title: evt.title,
        description: evt.description || '',
        // Wizard-saved type takes precedence over the generic event
        // type name — "Fire / Smoke alarm" beats "Incident Report".
        category: evt.customFields?.category || evt.eventType?.name || 'General',
        unit: evt.unit?.number,
        status: normalizeStatus(evt.status),
        priority: normalizePriority(evt.priority),
        reportedBy: 'Staff', // createdById is a UUID; display name not included in response
        assignedTo: evt.closedById ? 'Assigned' : undefined,
        reportedAt: evt.createdAt,
      }));
  }, [apiResponse]);

  const openCount = incidents.filter(
    (i) => i.status === 'open' || i.status === 'investigating',
  ).length;

  const columns: Column<Incident>[] = [
    {
      id: 'ref',
      header: 'Ref #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row) => (
        <span className="text-error-600 font-mono text-[13px] font-semibold">
          {row.referenceNumber}
        </span>
      ),
    },
    {
      id: 'title',
      header: 'Incident',
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
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => {
        // Colour the category chip by incident-type family so the
        // table reads at a glance — fire/medical jump out red, noise
        // / parking are quieter neutral chips, etc. Variant maps
        // keep a single source of truth for the seven wizard types.
        const cat = row.category.toLowerCase();
        const variant: 'error' | 'warning' | 'info' | 'default' =
          cat.includes('fire') || cat.includes('medical') || cat.includes('flood')
            ? 'error'
            : cat.includes('theft') || cat.includes('vandalism') || cat.includes('suspicious')
              ? 'warning'
              : cat.includes('noise') || cat.includes('parking')
                ? 'default'
                : 'info';
        return (
          <Badge variant={variant} size="sm">
            {row.category}
          </Badge>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => {
        const m: Record<string, 'default' | 'warning' | 'error'> = {
          low: 'default',
          medium: 'warning',
          high: 'error',
          critical: 'error',
        };
        return (
          <Badge variant={m[row.priority] ?? 'default'} size="sm" dot>
            {row.priority ?? '—'}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const m: Record<string, { v: 'warning' | 'info' | 'success' | 'default'; l: string }> = {
          open: { v: 'warning', l: 'Open' },
          investigating: { v: 'info', l: 'Investigating' },
          resolved: { v: 'success', l: 'Resolved' },
          closed: { v: 'default', l: 'Closed' },
        };
        const s = m[row.status] ?? { v: 'default' as const, l: row.status ?? 'unknown' };
        return (
          <Badge variant={s.v} size="sm" dot>
            {s.l}
          </Badge>
        );
      },
    },
    {
      id: 'unit',
      header: 'Unit',
      accessorKey: 'unit',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {typeof row.unit === 'object' && row.unit !== null
            ? (row.unit as Record<string, string>).number
            : row.unit || '\u2014'}
        </span>
      ),
    },
    {
      id: 'reportedAt',
      header: 'Reported',
      accessorKey: 'reportedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.reportedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <PageShell title="Incident Reports" description="Loading...">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Incident Reports" description="Error loading incidents">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="Failed to load incidents"
          description={error}
          action={
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Incident Reports"
      description={`${incidents.length} incidents \u00B7 ${openCount} active`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={incidents.length === 0}
            onClick={() =>
              exportToCsv(
                incidents,
                [
                  { key: 'referenceNumber', header: 'Ref #' },
                  { key: 'title', header: 'Incident' },
                  { key: 'category', header: 'Category' },
                  { key: 'priority', header: 'Priority' },
                  { key: 'status', header: 'Status' },
                  { key: 'unit', header: 'Unit' },
                  { key: 'reportedAt', header: 'Reported' },
                ],
                'incidents',
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowReportDialog(true)}>
            <Plus className="h-4 w-4" />
            Report Incident
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search incidents..."
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
      </div>

      {incidents.length === 0 && !searchQuery ? (
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="No incidents reported"
          description="When incidents are logged through the security console, they will appear here."
          action={
            <Button size="sm" onClick={() => setShowReportDialog(true)}>
              <Plus className="h-4 w-4" />
              Report Incident
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={incidents}
          emptyMessage="No incidents match your search."
          emptyIcon={<ShieldAlert className="h-6 w-6" />}
          // Route to the security-incident detail page (where the
          // acknowledgment trail and incident-specific actions live)
          // rather than /events/[id], which is built for community
          // events and renders an incident as "Community Event" with
          // RSVPs, Send Reminder, Export RSVP List — none of which
          // apply to a fire alarm or suspicious activity.
          onRowClick={(row) => router.push(`/security/incidents/${row.id}`)}
        />
      )}

      <IncidentWizard
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowReportDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeStatus(status: string): Incident['status'] {
  const map: Record<string, Incident['status']> = {
    open: 'open',
    investigating: 'investigating',
    in_progress: 'investigating',
    resolved: 'resolved',
    closed: 'closed',
  };
  return map[status] || 'open';
}

function normalizePriority(priority: string): Incident['priority'] {
  const map: Record<string, Incident['priority']> = {
    low: 'low',
    normal: 'medium',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
    urgent: 'critical',
  };
  return map[priority] || 'medium';
}
