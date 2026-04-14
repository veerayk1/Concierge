'use client';

/**
 * Admin Leads & Inquiries Page
 *
 * Displays all demo requests and contact form submissions with filtering,
 * search, inline detail expansion, status management, and internal notes.
 */

import { useState, useMemo, useCallback } from 'react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Inbox,
  Mail,
  MessageSquare,
  Monitor,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesLead {
  id: string;
  source: string;
  status: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  units?: string | null;
  propertyType?: string | null;
  subject?: string | null;
  message?: string | null;
  notes?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadsResponse {
  leads: SalesLead[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'info' | 'warning' | 'success' | 'primary' | 'error';
    dotColor?: string;
  }
> = {
  new: { label: 'New', variant: 'info' },
  contacted: { label: 'Contacted', variant: 'warning' },
  qualified: { label: 'Qualified', variant: 'success' },
  converted: { label: 'Converted', variant: 'primary' },
  lost: { label: 'Lost', variant: 'error' },
};

const SOURCE_LABELS: Record<string, string> = {
  demo_request: 'Demo Request',
  contact_form: 'Contact',
};

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'converted', label: 'Converted' },
  { key: 'lost', label: 'Lost' },
];

const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const apiUrlStr = apiUrl('/api/v1/admin/leads', {
    status: statusFilter || null,
    search: searchQuery || null,
    pageSize: '100',
  });

  const { data, loading, error, refetch } = useApi<LeadsResponse>(apiUrlStr);

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;

  // Compute stats from all data (unfiltered)
  const { data: allData } = useApi<LeadsResponse>(
    apiUrl('/api/v1/admin/leads', { pageSize: '1000' }),
  );
  const allLeads = allData?.leads ?? [];

  const stats = useMemo(() => {
    const newCount = allLeads.filter((l) => l.status === 'new').length;
    const demoCount = allLeads.filter((l) => l.source === 'demo_request').length;
    const contactCount = allLeads.filter((l) => l.source === 'contact_form').length;
    return { total: allLeads.length, newCount, demoCount, contactCount };
  }, [allLeads]);

  // Handlers
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  }, []);

  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: string) => {
      setSavingId(leadId);
      try {
        const res = await apiRequest(`/api/v1/admin/leads/${leadId}`, {
          method: 'PATCH',
          body: { status: newStatus },
        });
        if (!res.ok) throw new Error('Failed to update');
        showMessage(
          'success',
          `Status updated to "${STATUS_CONFIG[newStatus]?.label ?? newStatus}"`,
        );
        refetch();
      } catch {
        showMessage('error', 'Failed to update status');
      } finally {
        setSavingId(null);
      }
    },
    [refetch, showMessage],
  );

  const handleSaveNotes = useCallback(
    async (leadId: string) => {
      const notes = editingNotes[leadId];
      if (notes === undefined) return;
      setSavingId(leadId);
      try {
        const res = await apiRequest(`/api/v1/admin/leads/${leadId}`, {
          method: 'PATCH',
          body: { notes },
        });
        if (!res.ok) throw new Error('Failed to save');
        showMessage('success', 'Notes saved');
        refetch();
      } catch {
        showMessage('error', 'Failed to save notes');
      } finally {
        setSavingId(null);
      }
    },
    [editingNotes, refetch, showMessage],
  );

  const handleDelete = useCallback(
    async (lead: SalesLead) => {
      if (!window.confirm(`Delete lead from ${lead.name}? This cannot be undone.`)) return;
      setSavingId(lead.id);
      try {
        const res = await apiRequest(`/api/v1/admin/leads/${lead.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete');
        showMessage('success', `Lead from ${lead.name} deleted`);
        if (expandedId === lead.id) setExpandedId(null);
        refetch();
      } catch {
        showMessage('error', 'Failed to delete lead');
      } finally {
        setSavingId(null);
      }
    },
    [expandedId, refetch, showMessage],
  );

  const toggleExpand = useCallback(
    (leadId: string, lead: SalesLead) => {
      if (expandedId === leadId) {
        setExpandedId(null);
      } else {
        setExpandedId(leadId);
        // Pre-populate notes editor
        if (editingNotes[leadId] === undefined) {
          setEditingNotes((prev) => ({ ...prev, [leadId]: lead.notes || '' }));
        }
      }
    },
    [expandedId, editingNotes],
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <PageShell
      title="Leads & Inquiries"
      description={
        loading ? 'Loading leads...' : `${stats.total} total leads \u00B7 ${stats.newCount} new`
      }
      actions={
        <Button variant="secondary" size="sm" disabled>
          <Download className="h-4 w-4" />
          Export
        </Button>
      }
    >
      {/* Action Feedback */}
      {actionMessage && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-[14px] ${
            actionMessage.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-700'
              : 'border-error-200 bg-error-50 text-error-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} padding="sm" className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load leads"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Stats Bar */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card padding="sm" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <Users className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {stats.total}
                </p>
                <p className="text-[13px] text-neutral-500">Total Leads</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Inbox className="text-info-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {stats.newCount}
                </p>
                <p className="text-[13px] text-neutral-500">New (Uncontacted)</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Monitor className="text-primary-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {stats.demoCount}
                </p>
                <p className="text-[13px] text-neutral-500">Demo Requests</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <MessageSquare className="text-warning-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {stats.contactCount}
                </p>
                <p className="text-[13px] text-neutral-500">Contact Messages</p>
              </div>
            </Card>
          </div>

          {/* Search + Status Filter */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
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
            <div className="flex items-center gap-1.5">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    statusFilter === tab.key
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Table */}
          {leads.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="No leads found"
              description={
                statusFilter || searchQuery
                  ? 'Try adjusting your filters or search query.'
                  : 'Demo requests and contact form submissions will appear here.'
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_140px_120px_120px_160px_48px] gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <span className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Name
                </span>
                <span className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Email
                </span>
                <span className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Company
                </span>
                <span className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Source
                </span>
                <span className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Status
                </span>
                <span className="text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Date
                </span>
                <span />
              </div>

              {/* Table Rows */}
              {leads.map((lead) => {
                const isExpanded = expandedId === lead.id;
                const statusCfg = STATUS_CONFIG[lead.status] ?? {
                  label: lead.status,
                  variant: 'default' as const,
                };

                return (
                  <div key={lead.id} className="border-b border-neutral-100 last:border-b-0">
                    {/* Row */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(lead.id, lead)}
                      className="grid w-full grid-cols-[1fr_1fr_140px_120px_120px_160px_48px] gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                        )}
                        <span className="truncate text-[14px] font-medium text-neutral-900">
                          {lead.name}
                        </span>
                      </div>
                      <span className="truncate text-[13px] text-neutral-600">{lead.email}</span>
                      <span className="truncate text-[13px] text-neutral-500">
                        {lead.company || '\u2014'}
                      </span>
                      <div>
                        <Badge
                          variant={lead.source === 'demo_request' ? 'primary' : 'default'}
                          size="sm"
                        >
                          {SOURCE_LABELS[lead.source] ?? lead.source}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={statusCfg.variant} size="sm" dot>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <span className="text-[13px] text-neutral-500">
                        {formatDate(lead.createdAt)}
                      </span>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(lead);
                          }}
                          className="hover:bg-error-50 hover:text-error-600 rounded-lg p-1.5 text-neutral-300 transition-colors"
                          title="Delete lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-5">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          {/* Left: Lead Details */}
                          <div className="space-y-4">
                            <h3 className="text-[14px] font-semibold text-neutral-900">
                              Lead Details
                            </h3>
                            <div className="space-y-2.5">
                              <DetailRow label="Name" value={lead.name} />
                              <DetailRow label="Email" value={lead.email} />
                              {lead.phone && <DetailRow label="Phone" value={lead.phone} />}
                              {lead.company && <DetailRow label="Company" value={lead.company} />}
                              {lead.units && <DetailRow label="Units" value={lead.units} />}
                              {lead.propertyType && (
                                <DetailRow label="Property Type" value={lead.propertyType} />
                              )}
                              {lead.subject && <DetailRow label="Subject" value={lead.subject} />}
                              <DetailRow
                                label="Source"
                                value={SOURCE_LABELS[lead.source] ?? lead.source}
                              />
                              <DetailRow label="Submitted" value={formatDate(lead.createdAt)} />
                            </div>
                            {lead.message && (
                              <div className="mt-4">
                                <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                                  Message
                                </p>
                                <div className="rounded-lg border border-neutral-200 bg-white p-3 text-[14px] leading-relaxed whitespace-pre-wrap text-neutral-700">
                                  {lead.message}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Status + Notes */}
                          <div className="space-y-4">
                            {/* Status Dropdown */}
                            <div>
                              <label
                                htmlFor={`status-${lead.id}`}
                                className="mb-1.5 block text-[12px] font-semibold tracking-wide text-neutral-500 uppercase"
                              >
                                Status
                              </label>
                              <select
                                id={`status-${lead.id}`}
                                value={lead.status}
                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                disabled={savingId === lead.id}
                                className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full max-w-xs rounded-xl border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 transition-all focus:ring-4 focus:outline-none disabled:opacity-50"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {STATUS_CONFIG[s]?.label ?? s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Internal Notes */}
                            <div>
                              <label
                                htmlFor={`notes-${lead.id}`}
                                className="mb-1.5 block text-[12px] font-semibold tracking-wide text-neutral-500 uppercase"
                              >
                                Internal Notes
                              </label>
                              <textarea
                                id={`notes-${lead.id}`}
                                value={editingNotes[lead.id] ?? lead.notes ?? ''}
                                onChange={(e) =>
                                  setEditingNotes((prev) => ({
                                    ...prev,
                                    [lead.id]: e.target.value,
                                  }))
                                }
                                rows={4}
                                placeholder="Add internal notes about this lead..."
                                className="focus:border-primary-300 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white p-3 text-[14px] text-neutral-700 transition-all placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
                              />
                              <div className="mt-2 flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNotes(lead.id)}
                                  disabled={
                                    savingId === lead.id ||
                                    (editingNotes[lead.id] ?? '') === (lead.notes ?? '')
                                  }
                                >
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Result count */}
          {leads.length > 0 && (
            <p className="mt-3 text-[13px] text-neutral-400">
              Showing {leads.length} of {total} leads
            </p>
          )}
        </>
      )}
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 shrink-0 text-[13px] font-medium text-neutral-500">{label}</span>
      <span className="text-[14px] text-neutral-900">{value}</span>
    </div>
  );
}
