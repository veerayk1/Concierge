'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreateAnnouncementDialog } from '@/components/forms/create-announcement-dialog';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  Calendar,
  Clock,
  Eye,
  FileText,
  Mail,
  Megaphone,
  Plus,
  Search,
  Send,
  Smartphone,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// Test-seed regex shared with /my-packages, /my-requests, /dashboard.
// Residents see "CHAIN-E FBSNCK test", "UI-CHAIN-E-E10: Emergency...",
// "QA Test:..." in the demo property; a real building won't, but the
// filter applies cleanly in production too.
const TEST_TITLE_PATTERN =
  /^(EXH[-_]?[A-Z]+|UI[-_]?CHAIN|UI[-_]?TASK|CHAIN[-_]?[A-Z]|QA[-_ ]?(TEST|[A-Z]+:|TOWER)|QA TEST|UX[-_]?\d+|WRITE[-_]?MATRIX|SEC[-_]?\d+|TEST[-_ ]?|FBSNCK|VERIFY[-_ ]?|TC[-_]?\d+|E2E[-_ ]?)/i;
const TEST_SUBSTRING_PATTERN = /\btest (event|notice|announcement|item|run|data|xyz)\b/i;

function isTestSeedTitle(title: string | undefined | null): boolean {
  if (!title) return false;
  const t = title.trim();
  return TEST_TITLE_PATTERN.test(t) || TEST_SUBSTRING_PATTERN.test(t);
}

// ---------------------------------------------------------------------------
// Types — matches API response shape from GET /api/v1/announcements
// ---------------------------------------------------------------------------

interface ApiAnnouncement {
  id: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  channels: string[] | string;
  isPinned: boolean;
  isEmergency: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
}

interface ApiResponse {
  data: ApiAnnouncement[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  priority: 'normal' | 'important' | 'urgent';
  channels: string[];
  category: string;
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  isPinned: boolean;
  isEmergency: boolean;
}

// ---------------------------------------------------------------------------
// Channel Icon
// ---------------------------------------------------------------------------

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel) {
    case 'email':
      return <Mail className="h-3 w-3" />;
    case 'sms':
      return <Smartphone className="h-3 w-3" />;
    case 'push':
      return <Send className="h-3 w-3" />;
    default:
      return <Eye className="h-3 w-3" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // /announcements/new redirects here with ?create=1 so older links don't dead-end.
  // Strip the param after opening so a refresh doesn't relaunch the dialog.
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('create') === '1') {
      setShowCreateDialog(true);
      router.replace('/announcements');
    }
  }, [searchParams, router]);

  // Residents can view announcements but not create them.
  // In demo mode useAuth() returns null — fall back to localStorage demo_role.
  const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
  const effectiveRole = user?.role ?? demoRole;
  const isResident = effectiveRole?.startsWith('resident') || effectiveRole === 'board_member';
  const canCreate = !isResident;

  // Residents are forced to "published" regardless of any UI filter —
  // they should never see drafts/scheduled/archived rows even
  // accidentally. Staff respect whatever the filter row is set to.
  const effectiveStatus = isResident ? 'published' : statusFilter;

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<ApiResponse>(
    apiUrl('/api/v1/announcements', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      status: effectiveStatus !== 'all' ? effectiveStatus : undefined,
      pageSize: '50',
    }),
  );

  // Read state shared with the dashboard (UX-166). When the resident
  // opens an announcement here, mark it read so the dashboard's NEW
  // pill goes away too. Same localStorage key, same Set semantics.
  const ANN_READ_KEY = 'conc_ann_read_ids';
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(ANN_READ_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  const markRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(ANN_READ_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // localStorage quota — silent
      }
      return next;
    });
  };
  // Same first-visit seed pattern as the dashboard (UX-166) — on the
  // very first visit, silently mark every existing announcement as
  // read so we don't scream NEW at the resident's entire history.
  // Only fires when the seeded flag is unset; after that, NEW only
  // appears for things actually published after the resident's first
  // visit. Shared seeded flag across dashboard + this page means a
  // resident who started on the dashboard won't re-seed here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isResident) return;
    if (localStorage.getItem('conc_ann_read_seeded') === '1') return;
    if (!apiResponse) return;
    const rawList = (apiResponse?.data ??
      (apiResponse as unknown as ApiAnnouncement[])) as ApiAnnouncement[];
    const ids = (rawList || []).map((a) => a.id).filter(Boolean);
    if (!ids.length) return;
    setReadIds(new Set(ids));
    try {
      localStorage.setItem(ANN_READ_KEY, JSON.stringify(ids));
      localStorage.setItem('conc_ann_read_seeded', '1');
    } catch {
      // ignore
    }
  }, [apiResponse, isResident]);

  const announcements = useMemo<Announcement[]>(() => {
    const rawAnnouncements = apiResponse?.data ?? (apiResponse as unknown as ApiAnnouncement[]);
    if (!rawAnnouncements || !Array.isArray(rawAnnouncements)) return [];

    const list = rawAnnouncements
      .filter((a) => !isTestSeedTitle(a.title))
      .map((a) => {
        // channels can be a JSON string or array
        let channels: string[] = ['web'];
        if (Array.isArray(a.channels)) {
          channels = a.channels;
        } else if (typeof a.channels === 'string') {
          try {
            channels = JSON.parse(a.channels);
          } catch {
            channels = ['web'];
          }
        }

        return {
          id: a.id,
          title: a.title,
          body: a.content, // API field is "content", UI displays as "body"
          status: normalizeAnnouncementStatus(a.status),
          priority: normalizeAnnouncementPriority(a.priority),
          channels,
          category: a.category?.name || '',
          publishedAt: a.publishedAt || undefined,
          scheduledFor: a.scheduledAt || undefined, // API field is "scheduledAt"
          createdAt: a.createdAt,
          isPinned: a.isPinned,
          isEmergency: a.isEmergency,
        };
      });

    // Sort: emergency → pinned → unread → recency. Only applied for
    // resident view — admins keep API-default ordering because they
    // care about workflow state more than read state.
    if (isResident) {
      list.sort((a, b) => {
        const aE = a.isEmergency ? 0 : 1;
        const bE = b.isEmergency ? 0 : 1;
        if (aE !== bE) return aE - bE;
        const aP = a.isPinned ? 0 : 1;
        const bP = b.isPinned ? 0 : 1;
        if (aP !== bP) return aP - bP;
        const aR = readIds.has(a.id) ? 1 : 0;
        const bR = readIds.has(b.id) ? 1 : 0;
        if (aR !== bR) return aR - bR;
        const aT = new Date(a.publishedAt ?? a.createdAt).getTime();
        const bT = new Date(b.publishedAt ?? b.createdAt).getTime();
        return bT - aT;
      });
    }
    return list;
  }, [apiResponse, isResident, readIds]);

  // Loading state
  if (loading) {
    return (
      <PageShell title="Announcements" description="Loading...">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Announcements" description="Error loading announcements">
        <EmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Failed to load announcements"
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
      hero={isResident ? 'rose' : 'none'}
      title="Announcements"
      description={
        isResident
          ? 'Notices from management.'
          : 'Create and distribute announcements via web, email, SMS, and push.'
      }
      actions={
        canCreate ? (
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        ) : undefined
      }
    >
      {/* Search + Filter. Residents only ever see published notices, so
          the draft/scheduled filter tabs are admin-only — they leak
          workflow concepts that residents shouldn't be aware of. */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search announcements..."
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
        {!isResident && (
          <div className="flex items-center gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'published', label: 'Published' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'draft', label: 'Drafts' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatusFilter(s.key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                  statusFilter === s.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="flex flex-col gap-4">
        {announcements.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title={
              searchQuery || statusFilter !== 'all'
                ? 'No announcements found'
                : isResident
                  ? 'All quiet from the desk.'
                  : 'No announcements yet'
            }
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : isResident
                  ? 'There are no active notices right now. Anything new from management will land here.'
                  : 'Create your first announcement to communicate with residents.'
            }
            action={
              canCreate && !searchQuery && statusFilter === 'all' ? (
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  New Announcement
                </Button>
              ) : undefined
            }
          />
        ) : (
          announcements.map((announcement) => {
            const statusConfig = {
              draft: { variant: 'default' as const, label: 'Draft' },
              scheduled: { variant: 'info' as const, label: 'Scheduled' },
              published: { variant: 'success' as const, label: 'Published' },
              archived: { variant: 'default' as const, label: 'Archived' },
            };
            const priorityConfig = {
              normal: null,
              important: { variant: 'warning' as const, label: 'Important' },
              urgent: { variant: 'error' as const, label: 'Urgent' },
            };
            const sc = statusConfig[announcement.status];
            const pc = priorityConfig[announcement.priority];

            const isUnread = isResident && !readIds.has(announcement.id);
            return (
              <Card
                key={announcement.id}
                hoverable
                className={`cursor-pointer transition-all duration-200 ${isUnread ? 'bg-sky-50/30 ring-1 ring-sky-100' : ''}`}
                onClick={() => {
                  markRead(announcement.id);
                  router.push(`/announcements/${announcement.id}` as never);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-sky-700 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          New
                        </span>
                      )}
                      <h3 className="text-[16px] font-semibold text-neutral-900">
                        {announcement.title}
                      </h3>
                      {/* Workflow status is admin metadata — residents
                          only see published anyway, so the pill carries
                          no signal for them. */}
                      {!isResident && (
                        <Badge variant={sc.variant} size="sm">
                          {sc.label}
                        </Badge>
                      )}
                      {pc && (
                        <Badge variant={pc.variant} size="sm" dot>
                          {pc.label}
                        </Badge>
                      )}
                      {announcement.isPinned && (
                        <Badge variant="primary" size="sm">
                          Pinned
                        </Badge>
                      )}
                      {announcement.isEmergency && (
                        <Badge variant="error" size="sm" dot>
                          Emergency
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-neutral-600">
                      {announcement.body
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-[12px] text-neutral-400">
                      {announcement.category && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {announcement.category}
                        </span>
                      )}
                      {announcement.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {announcement.scheduledFor && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduled:{' '}
                          {new Date(announcement.scheduledFor).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Distribution channels (web/email/sms/push) describe
                      how the announcement was delivered. Operational
                      concern — admin only. */}
                  {!isResident && (
                    <div className="flex items-center gap-1">
                      {announcement.channels.map((ch) => (
                        <div
                          key={ch}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500"
                          title={ch}
                        >
                          <ChannelIcon channel={ch} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <CreateAnnouncementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeAnnouncementStatus(status: string): Announcement['status'] {
  const map: Record<string, Announcement['status']> = {
    draft: 'draft',
    scheduled: 'scheduled',
    published: 'published',
    expired: 'archived',
    rejected: 'archived',
    archived: 'archived',
  };
  return map[status] || 'draft';
}

function normalizeAnnouncementPriority(priority: string): Announcement['priority'] {
  const map: Record<string, Announcement['priority']> = {
    low: 'normal',
    normal: 'normal',
    high: 'important',
    urgent: 'urgent',
  };
  return map[priority] || 'normal';
}
