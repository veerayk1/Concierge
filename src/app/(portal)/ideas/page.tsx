'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Plus, Search, X, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IdeaCategory = 'amenity' | 'security' | 'maintenance' | 'community' | 'policy' | 'other';

type IdeaStatus = 'new' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';

interface IdeaItem {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  author: string;
  authorUnit: string;
  status: IdeaStatus;
  votesUp: number;
  votesDown: number;
  commentCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<IdeaCategory, 'default' | 'warning' | 'info' | 'error' | 'success'> =
  {
    amenity: 'info',
    security: 'error',
    maintenance: 'warning',
    community: 'success',
    policy: 'default',
    other: 'default',
  };

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  amenity: 'Amenity',
  security: 'Security',
  maintenance: 'Maintenance',
  community: 'Community',
  policy: 'Policy',
  other: 'Other',
};

const STATUS_COLORS: Record<IdeaStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  new: 'default',
  under_review: 'info',
  planned: 'success',
  in_progress: 'warning',
  completed: 'success',
  declined: 'error',
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  new: 'New',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_IDEAS: IdeaItem[] = [
  {
    id: '1',
    title: 'Add EV charging stations',
    description:
      'Install electric vehicle charging stations in the underground parking garage. With more residents switching to EVs, this would be a huge quality-of-life improvement and increase property value.',
    category: 'amenity',
    author: 'David C.',
    authorUnit: '802',
    status: 'planned',
    votesUp: 47,
    votesDown: 3,
    commentCount: 12,
    createdAt: '2026-03-10T09:00:00',
  },
  {
    id: '2',
    title: 'Later pool hours on weekends',
    description:
      'Extend pool hours to 10pm on Friday and Saturday nights. The current 8pm closing time is too early for weekend use, especially during summer months.',
    category: 'amenity',
    author: 'Lisa B.',
    authorUnit: '1105',
    status: 'under_review',
    votesUp: 31,
    votesDown: 8,
    commentCount: 9,
    createdAt: '2026-03-12T14:30:00',
  },
  {
    id: '3',
    title: 'Community garden on roof',
    description:
      'Create a community garden on the rooftop terrace. Each interested resident could have a small plot. Great for building community and growing fresh herbs and vegetables.',
    category: 'community',
    author: 'Maria G.',
    authorUnit: '1203',
    status: 'new',
    votesUp: 22,
    votesDown: 5,
    commentCount: 7,
    createdAt: '2026-03-14T11:00:00',
  },
  {
    id: '4',
    title: 'Better recycling signage',
    description:
      'The current recycling signs in the garbage room are faded and confusing. Propose new clear, colour-coded signage with pictures showing what goes where.',
    category: 'maintenance',
    author: 'Robert K.',
    authorUnit: '305',
    status: 'in_progress',
    votesUp: 18,
    votesDown: 1,
    commentCount: 4,
    createdAt: '2026-03-15T08:00:00',
  },
  {
    id: '5',
    title: 'Guest WiFi in lobby',
    description:
      'Set up a free guest WiFi network in the lobby and common areas. Visitors and delivery drivers often need internet access while waiting.',
    category: 'security',
    author: 'Alice W.',
    authorUnit: '101',
    status: 'under_review',
    votesUp: 15,
    votesDown: 6,
    commentCount: 5,
    createdAt: '2026-03-16T16:00:00',
  },
  {
    id: '6',
    title: 'Monthly social events',
    description:
      'Organize monthly social events in the party room — game nights, movie screenings, potlucks. A great way for neighbours to get to know each other.',
    category: 'community',
    author: 'Karen L.',
    authorUnit: '905',
    status: 'new',
    votesUp: 26,
    votesDown: 2,
    commentCount: 8,
    createdAt: '2026-03-17T10:00:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IdeasPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IdeaCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');

  const { data: apiIdeas } = useApi<IdeaItem[]>(
    apiUrl('/api/v1/ideas', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allIdeas = useMemo<IdeaItem[]>(() => apiIdeas ?? MOCK_IDEAS, [apiIdeas]);

  const filteredIdeas = useMemo(() => {
    return allIdeas.filter((idea) => {
      if (categoryFilter !== 'all' && idea.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && idea.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.author.toLowerCase().includes(q)
      );
    });
  }, [allIdeas, categoryFilter, statusFilter, searchQuery]);

  const totalCount = allIdeas.length;
  const underReviewCount = allIdeas.filter((i) => i.status === 'under_review').length;
  const plannedCount = allIdeas.filter((i) => i.status === 'planned').length;

  return (
    <PageShell
      title="Idea Board"
      description="Share ideas and vote on community improvements."
      actions={
        <Button size="sm">
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
            <option value="amenity">Amenity</option>
            <option value="security">Security</option>
            <option value="maintenance">Maintenance</option>
            <option value="community">Community</option>
            <option value="policy">Policy</option>
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
                    {idea.votesUp}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-3.5 w-3.5 text-neutral-400" />
                    {idea.votesDown}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 text-neutral-400" />
                    {idea.commentCount}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-400">
                <span>
                  {idea.author} · Unit {idea.authorUnit}
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
    </PageShell>
  );
}
