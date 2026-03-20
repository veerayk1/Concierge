'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Plus, Search, X, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateIdeaDialog } from '@/components/forms/create-idea-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IdeaCategory =
  | 'amenities'
  | 'security'
  | 'maintenance'
  | 'community'
  | 'communication'
  | 'technology'
  | 'other';

type IdeaStatus =
  | 'new'
  | 'submitted'
  | 'under_review'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'declined';

interface IdeaItem {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  author?: string;
  authorUnit?: string;
  userId?: string;
  status: IdeaStatus;
  votesUp?: number;
  votesDown?: number;
  voteCount?: number;
  commentCount?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<IdeaCategory, 'default' | 'warning' | 'info' | 'error' | 'success'> =
  {
    amenities: 'info',
    security: 'error',
    maintenance: 'warning',
    community: 'success',
    communication: 'default',
    technology: 'info',
    other: 'default',
  };

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  amenities: 'Amenities',
  security: 'Security',
  maintenance: 'Maintenance',
  community: 'Community',
  communication: 'Communication',
  technology: 'Technology',
  other: 'Other',
};

const STATUS_COLORS: Record<IdeaStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  new: 'default',
  submitted: 'default',
  under_review: 'info',
  planned: 'success',
  in_progress: 'warning',
  completed: 'success',
  declined: 'error',
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  new: 'New',
  submitted: 'Submitted',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
};

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface ApiResponse {
  data: IdeaItem[];
  meta?: { total: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IdeasPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    data: apiIdeas,
    loading,
    error,
    refetch,
  } = useApi<IdeaItem[] | ApiResponse>(
    apiUrl('/api/v1/ideas', {
      propertyId: getPropertyId(),
      search: searchQuery || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
  );

  const allIdeas = useMemo<IdeaItem[]>(() => {
    if (!apiIdeas) return [];
    if (Array.isArray(apiIdeas)) return apiIdeas;
    if (Array.isArray((apiIdeas as ApiResponse).data)) return (apiIdeas as ApiResponse).data;
    return [];
  }, [apiIdeas]);

  const filteredIdeas = useMemo(() => {
    return allIdeas.filter((idea) => {
      if (categoryFilter !== 'all' && idea.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && idea.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        (idea.author || '').toLowerCase().includes(q)
      );
    });
  }, [allIdeas, categoryFilter, statusFilter, searchQuery]);

  const totalCount = allIdeas.length;
  const underReviewCount = allIdeas.filter((i) => i.status === 'under_review').length;
  const plannedCount = allIdeas.filter((i) => i.status === 'planned').length;

  // Loading state
  if (loading) {
    return (
      <PageShell title="Idea Board" description="Loading...">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Idea Board" description="Error loading ideas">
        <EmptyState
          icon={<Lightbulb className="h-6 w-6" />}
          title="Failed to load ideas"
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
      title="Idea Board"
      description="Share ideas and vote on community improvements."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Post Idea
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Lightbulb className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalCount}</p>
            <p className="text-[13px] text-neutral-500">Total Ideas</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Lightbulb className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {underReviewCount}
            </p>
            <p className="text-[13px] text-neutral-500">Under Review</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Lightbulb className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{plannedCount}</p>
            <p className="text-[13px] text-neutral-500">Planned</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search ideas..."
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
        <div className="flex items-center gap-2">
          <label
            htmlFor="idea-category-filter"
            className="text-[13px] font-medium text-neutral-600"
          >
            Category:
          </label>
          <select
            id="idea-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as IdeaCategory | 'all')}
            className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="amenities">Amenities</option>
            <option value="security">Security</option>
            <option value="maintenance">Maintenance</option>
            <option value="community">Community</option>
            <option value="communication">Communication</option>
            <option value="technology">Technology</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="idea-status-filter" className="text-[13px] font-medium text-neutral-600">
            Status:
          </label>
          <select
            id="idea-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | 'all')}
            className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Card Grid */}
      {filteredIdeas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="h-6 w-6" />}
          title="No ideas found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} hoverable className="cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-neutral-900">{idea.title}</h3>
                <Badge variant={STATUS_COLORS[idea.status]} size="sm" dot>
                  {STATUS_LABELS[idea.status]}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                {idea.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={CATEGORY_COLORS[idea.category]} size="sm">
                  {CATEGORY_LABELS[idea.category]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[13px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-neutral-400" />
                    {idea.votesUp || idea.voteCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-3.5 w-3.5 text-neutral-400" />
                    {idea.votesDown || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 text-neutral-400" />
                    {idea.commentCount || 0}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-400">
                <span>
                  {idea.author || 'Resident'}
                  {idea.authorUnit ? ` · Unit ${idea.authorUnit}` : ''}
                </span>
                <span>
                  {new Date(idea.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateIdeaDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={getPropertyId()}
      />
    </PageShell>
  );
}
