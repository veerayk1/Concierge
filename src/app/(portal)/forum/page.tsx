'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  X,
  MessageCircle,
  ThumbsUp,
  Pin,
  Eye,
  Lock,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateForumThreadDialog } from '@/components/forms/create-forum-thread-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThreadCategory = 'general' | 'maintenance' | 'amenities' | 'safety' | 'social' | 'suggestions';

type ThreadStatus = 'active' | 'closed' | 'resolved';

interface ForumThread {
  id: string;
  title: string;
  category?: ThreadCategory;
  categoryId?: string | null;
  moderationFlags?: { category?: string } | null;
  author?: string;
  authorUnit?: string;
  userId?: string;
  createdAt: string;
  lastReplyAt?: string;
  lastActivityAt?: string;
  replyCount: number;
  viewCount: number;
  likeCount?: number;
  isPinned: boolean;
  isLocked: boolean;
  status: ThreadStatus;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<
  ThreadCategory,
  'default' | 'warning' | 'info' | 'error' | 'success'
> = {
  general: 'default',
  maintenance: 'warning',
  amenities: 'info',
  safety: 'error',
  social: 'success',
  suggestions: 'info',
};

const CATEGORY_LABELS: Record<ThreadCategory, string> = {
  general: 'General',
  maintenance: 'Maintenance',
  amenities: 'Amenities',
  safety: 'Safety',
  social: 'Social',
  suggestions: 'Suggestions',
};

const STATUS_COLORS: Record<ThreadStatus, 'default' | 'success' | 'error'> = {
  active: 'default',
  closed: 'error',
  resolved: 'success',
};

const STATUS_LABELS: Record<ThreadStatus, string> = {
  active: 'Active',
  closed: 'Closed',
  resolved: 'Resolved',
};

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface ApiResponse {
  data: ForumThread[];
  meta?: { total: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForumPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ThreadCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiThreads,
    loading,
    error,
    refetch,
  } = useApi<ForumThread[] | ApiResponse>(
    apiUrl('/api/v1/forum', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  );

  const allThreads = useMemo<ForumThread[]>(() => {
    if (!apiThreads) return [];
    if (Array.isArray(apiThreads)) return apiThreads;
    if (Array.isArray((apiThreads as ApiResponse).data)) return (apiThreads as ApiResponse).data;
    return [];
  }, [apiThreads]);

  // Extract category from moderationFlags or direct field
  const getThreadCategory = (thread: ForumThread): string => {
    return thread.category || thread.moderationFlags?.category || 'general';
  };

  const filteredThreads = useMemo(() => {
    return allThreads.filter((thread) => {
      if (categoryFilter !== 'all' && getThreadCategory(thread) !== categoryFilter) return false;
      if (statusFilter !== 'all' && thread.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(q) ||
        (thread.author || '').toLowerCase().includes(q) ||
        (thread.authorUnit || '').toLowerCase().includes(q)
      );
    });
  }, [allThreads, categoryFilter, statusFilter, searchQuery]);

  const totalCount = allThreads.length;
  const activeTodayCount = allThreads.filter((t) => {
    const lastActivity = new Date(t.lastReplyAt || t.lastActivityAt || t.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return lastActivity >= today;
  }).length;
  const pinnedCount = allThreads.filter((t) => t.isPinned).length;

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all';

  const columns: Column<ForumThread>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.isPinned && <Pin className="text-info-600 h-3.5 w-3.5 shrink-0" />}
          {row.isLocked && <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />}
          <span className="text-[14px] font-semibold text-neutral-900">{row.title}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => {
        const cat = getThreadCategory(row) as ThreadCategory;
        return (
          <Badge variant={CATEGORY_COLORS[cat] || 'default'} size="sm">
            {CATEGORY_LABELS[cat] || cat}
          </Badge>
        );
      },
    },
    {
      id: 'author',
      header: 'Author',
      accessorKey: 'author',
      sortable: true,
      cell: (row) => (
        <div className="text-[13px]">
          <span className="font-medium text-neutral-900">{row.author || 'Resident'}</span>
          {row.authorUnit && <span className="ml-1 text-neutral-400">· {row.authorUnit}</span>}
        </div>
      ),
    },
    {
      id: 'replyCount',
      header: 'Replies',
      accessorKey: 'replyCount',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-[13px] text-neutral-600">
          <MessageCircle className="h-3.5 w-3.5 text-neutral-400" />
          {row.replyCount}
        </span>
      ),
    },
    {
      id: 'viewCount',
      header: 'Views',
      accessorKey: 'viewCount',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-[13px] text-neutral-600">
          <Eye className="h-3.5 w-3.5 text-neutral-400" />
          {row.viewCount}
        </span>
      ),
    },
    {
      id: 'likeCount',
      header: 'Likes',
      accessorKey: 'likeCount',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-[13px] text-neutral-600">
          <ThumbsUp className="h-3.5 w-3.5 text-neutral-400" />
          {row.likeCount || 0}
        </span>
      ),
    },
    {
      id: 'lastReplyAt',
      header: 'Last Activity',
      accessorKey: 'lastReplyAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {formatRelativeTime(row.lastReplyAt || row.lastActivityAt || row.createdAt)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <Badge variant={STATUS_COLORS[row.status]} size="sm" dot>
          {STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <PageShell title="Forum" description="Loading...">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Forum" description="Error loading forum">
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="Failed to load forum threads"
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
      title="Forum"
      description="Community discussions and threaded conversations."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Thread
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <MessageSquare className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            <p className="text-[13px] text-neutral-500">Total Threads</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <MessageCircle className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {activeTodayCount}
            </p>
            <p className="text-[13px] text-neutral-500">Active Today</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Pin className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{pinnedCount}</p>
            <p className="text-[13px] text-neutral-500">Pinned</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search threads..."
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
        <Button
          variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="primary" size="sm">
              {(categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-[13px] font-medium text-neutral-600">
              Category:
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ThreadCategory | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="maintenance">Maintenance</option>
              <option value="amenities">Amenities</option>
              <option value="safety">Safety</option>
              <option value="social">Social</option>
              <option value="suggestions">Suggestions</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-[13px] font-medium text-neutral-600">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ThreadStatus | 'all')}
              className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredThreads}
        emptyMessage="No threads found."
        emptyIcon={<MessageSquare className="h-6 w-6" />}
      />

      <CreateForumThreadDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
      />
    </PageShell>
  );
}
