'use client';

import { useState, useMemo } from 'react';
import { useApi } from '@/lib/hooks/use-api';
import {
  HelpCircle,
  Search,
  X,
  BookOpen,
  MessageSquare,
  FileText,
  ChevronRight,
  ExternalLink,
  Headphones,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateHelpTicketDialog } from '@/components/forms/create-help-ticket-dialog';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articleCount: number;
  color: string;
}

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  updatedAt: string;
  isFeatured: boolean;
}

/** Shape returned by the API (Prisma HelpArticle model) */
interface ApiHelpArticle {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string;
  tags: string[];
  isFeatured: boolean;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Static data (categories remain static, articles are fetched)              */
/* -------------------------------------------------------------------------- */

const CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: 'BookOpen',
    description: 'Learn the basics of navigating and using the portal.',
    articleCount: 12,
    color: 'bg-primary-50 text-primary-600',
  },
  {
    id: 'packages',
    name: 'Packages & Deliveries',
    icon: 'FileText',
    description: 'How to log, track, and release packages for residents.',
    articleCount: 8,
    color: 'bg-info-50 text-info-600',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    icon: 'FileText',
    description: 'Creating requests, assigning vendors, and tracking progress.',
    articleCount: 10,
    color: 'bg-warning-50 text-warning-600',
  },
  {
    id: 'security',
    name: 'Security & Access',
    icon: 'FileText',
    description: 'FOB management, visitor logging, and incident reports.',
    articleCount: 9,
    color: 'bg-error-50 text-error-600',
  },
  {
    id: 'amenities',
    name: 'Amenity Booking',
    icon: 'FileText',
    description: 'Reserve spaces, manage calendars, and set approval rules.',
    articleCount: 7,
    color: 'bg-success-50 text-success-600',
  },
  {
    id: 'account',
    name: 'Account & Settings',
    icon: 'FileText',
    description: 'Profile management, notification preferences, and roles.',
    articleCount: 6,
    color: 'bg-neutral-100 text-neutral-600',
  },
];

const FALLBACK_ARTICLES: HelpArticle[] = [
  {
    id: 'art-1',
    title: 'How to log a package delivery',
    category: 'Packages & Deliveries',
    excerpt:
      'Step-by-step guide to logging incoming packages, printing labels, and notifying residents automatically.',
    readTime: '3 min',
    updatedAt: '2026-03-15',
    isFeatured: true,
  },
  {
    id: 'art-2',
    title: 'Creating a maintenance request',
    category: 'Maintenance',
    excerpt:
      'Learn how to submit maintenance requests with photos, set priority levels, and track status through resolution.',
    readTime: '4 min',
    updatedAt: '2026-03-12',
    isFeatured: true,
  },
  {
    id: 'art-3',
    title: 'Setting up FOB access',
    category: 'Security & Access',
    excerpt:
      'How to register FOBs, assign them to residents, track serial numbers, and deactivate lost or stolen FOBs.',
    readTime: '5 min',
    updatedAt: '2026-03-10',
    isFeatured: true,
  },
  {
    id: 'art-4',
    title: 'Booking an amenity',
    category: 'Amenity Booking',
    excerpt:
      'Reserve common areas, view availability on the calendar, understand approval workflows, and manage recurring bookings.',
    readTime: '3 min',
    updatedAt: '2026-03-08',
    isFeatured: true,
  },
  {
    id: 'art-5',
    title: 'Managing announcements',
    category: 'Getting Started',
    excerpt:
      'Create and distribute announcements via email, push notifications, and lobby displays with scheduling options.',
    readTime: '4 min',
    updatedAt: '2026-03-05',
    isFeatured: true,
  },
  {
    id: 'art-6',
    title: 'Understanding reports',
    category: 'Account & Settings',
    excerpt:
      'Generate, filter, and export reports across all modules. Covers date ranges, CSV/PDF export, and scheduled reports.',
    readTime: '6 min',
    updatedAt: '2026-03-01',
    isFeatured: true,
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Estimate read time from body text length */
function estimateReadTime(body: string): string {
  const words = body.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}

/** Extract a plain-text excerpt from article body (strip markdown/html) */
function extractExcerpt(body: string, maxLength = 160): string {
  const plain = body
    .replace(/#{1,6}\s+/g, '') // headings
    .replace(/[*_~`]/g, '') // emphasis
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/<[^>]+>/g, '') // html tags
    .replace(/\n+/g, ' ')
    .trim();
  return plain.length > maxLength ? plain.slice(0, maxLength).trimEnd() + '...' : plain;
}

/** Map API article to the UI shape */
function mapApiArticle(a: ApiHelpArticle): HelpArticle {
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    excerpt: extractExcerpt(a.body),
    readTime: estimateReadTime(a.body),
    updatedAt: a.updatedAt.slice(0, 10),
    isFeatured: a.isFeatured,
  };
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function HelpCenterSkeleton() {
  return (
    <PageShell title="Help Center" description="Find answers, browse guides, and get support.">
      {/* Search bar skeleton */}
      <div className="mb-8">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      {/* Category grid skeleton */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-200/80 bg-white p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Articles skeleton */}
      <section className="mb-10">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-200/80 bg-white p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTicketDialog, setShowTicketDialog] = useState(false);

  // Fetch articles from API (featured first)
  const {
    data: apiArticles,
    loading,
    error,
  } = useApi<ApiHelpArticle[]>('/api/v1/help/articles?featured=true&pageSize=20');

  // Map API articles to UI shape, falling back to static data if API returns empty or errors
  const articles: HelpArticle[] = useMemo(() => {
    if (apiArticles && apiArticles.length > 0) {
      return apiArticles.map(mapApiArticle);
    }
    // Fallback to static articles when API returns nothing or on error
    return FALLBACK_ARTICLES;
  }, [apiArticles]);

  /* ---- Filter articles by search ---- */
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q),
    );
  }, [searchQuery, articles]);

  /* ---- Filter categories by search ---- */
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const hasResults = filteredCategories.length > 0 || filteredArticles.length > 0;

  // Show loading skeleton on initial load
  if (loading) {
    return <HelpCenterSkeleton />;
  }

  return (
    <PageShell title="Help Center" description="Find answers, browse guides, and get support.">
      {/* ------------------------------------------------------------------ */}
      {/*  Search bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative mb-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles, guides, and FAQs..."
          className="focus:border-primary-300 focus:ring-primary-100 h-12 w-full rounded-xl border border-neutral-200 bg-white pr-10 pl-11 text-[15px] text-neutral-900 transition-all placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!hasResults && (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No results found"
          description={`No articles or categories match "${searchQuery}". Try a different search term.`}
          action={
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          }
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  Category cards grid                                                */}
      {/* ------------------------------------------------------------------ */}
      {filteredCategories.length > 0 && (
        <section className="mb-10">
          {searchQuery && (
            <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Categories</h2>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((cat) => (
              <Card key={cat.id} hoverable padding="md" className="group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.color}`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="group-hover:text-primary-600 text-[15px] font-semibold text-neutral-900 transition-colors">
                        {cat.name}
                      </h3>
                      <ChevronRight className="group-hover:text-primary-500 h-4 w-4 shrink-0 text-neutral-300 transition-colors" />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                      {cat.description}
                    </p>
                    <Badge variant="default" size="sm" className="mt-3">
                      {cat.articleCount} articles
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  Featured / filtered articles                                       */}
      {/* ------------------------------------------------------------------ */}
      {filteredArticles.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
            {searchQuery ? 'Search Results' : 'Featured Articles'}
          </h2>
          <div className="flex flex-col gap-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} hoverable padding="md" className="group cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="group-hover:text-primary-600 text-[15px] font-semibold text-neutral-900 transition-colors">
                        {article.title}
                      </h3>
                      <Badge variant="info" size="sm">
                        {article.category}
                      </Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">
                      {article.excerpt}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-400">
                      <span>{article.readTime} read</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>Updated {article.updatedAt}</span>
                    </div>
                  </div>
                  <ChevronRight className="group-hover:text-primary-500 mt-1 h-4 w-4 shrink-0 text-neutral-300 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  Support actions                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <Card padding="lg" className="text-center">
          <div className="bg-primary-50 text-primary-600 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
            <Headphones className="h-6 w-6" />
          </div>
          <h3 className="text-[16px] font-semibold text-neutral-900">Still need help?</h3>
          <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-neutral-500">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="md">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Button>
            <Button variant="secondary" size="md" onClick={() => setShowTicketDialog(true)}>
              <FileText className="h-4 w-4" />
              Submit Ticket
            </Button>
          </div>
        </Card>
      </section>

      <CreateHelpTicketDialog
        open={showTicketDialog}
        onOpenChange={setShowTicketDialog}
        onSuccess={() => {
          // Ticket submitted successfully
        }}
      />
    </PageShell>
  );
}
