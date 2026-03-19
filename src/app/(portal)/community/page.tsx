'use client';

import { useState, useMemo } from 'react';
import { Calendar, Heart, MessageCircle, Plus, Search, ShoppingBag, Tag, X } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { CreateClassifiedAdDialog } from '@/components/forms/create-classified-ad-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassifiedAd {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  isFree: boolean;
  author: string;
  unit: string;
  createdAt: string;
  imageCount: number;
}

const CATEGORIES = [
  'All',
  'Furniture',
  'Free Stuff',
  'Services',
  'Wanted',
  'Fitness',
  'Electronics',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showPostDialog, setShowPostDialog] = useState(false);

  const {
    data: apiAds,
    loading,
    error,
    refetch,
  } = useApi<ClassifiedAd[]>(apiUrl('/api/v1/community', { propertyId: DEMO_PROPERTY_ID }));

  const allAds = useMemo<ClassifiedAd[]>(() => apiAds ?? [], [apiAds]);

  const filteredAds = allAds.filter((ad) => {
    if (categoryFilter !== 'All' && ad.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ad.title.toLowerCase().includes(q) || ad.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <PageShell
      title="Community"
      description="Classified ads, services, and community engagement."
      actions={
        <Button size="sm" onClick={() => setShowPostDialog(true)}>
          <Plus className="h-4 w-4" />
          Post Ad
        </Button>
      }
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search listings..."
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
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${categoryFilter === cat ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="mb-4 h-40 w-full" />
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="h-6 w-1/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Failed to load listings"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredAds.length === 0 && (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="No listings found"
          description={
            searchQuery || categoryFilter !== 'All'
              ? 'Try adjusting your search or category filter.'
              : 'Be the first to post a classified ad in your community.'
          }
          action={
            searchQuery || categoryFilter !== 'All' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowPostDialog(true)}>
                <Plus className="h-4 w-4" />
                Post Ad
              </Button>
            )
          }
        />
      )}

      {/* Content */}
      {!loading && !error && filteredAds.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAds.map((ad) => (
            <Card key={ad.id} hoverable className="cursor-pointer">
              {/* Image placeholder */}
              {ad.imageCount > 0 && (
                <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-neutral-100">
                  <ShoppingBag className="h-8 w-8 text-neutral-300" />
                  <span className="absolute right-2 bottom-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {ad.imageCount} photos
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-neutral-900">{ad.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                    {ad.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" size="sm">
                    <Tag className="h-2.5 w-2.5" />
                    {ad.category}
                  </Badge>
                  {ad.isFree ? (
                    <Badge variant="success" size="sm">
                      Free
                    </Badge>
                  ) : (
                    ad.price && (
                      <span className="text-[16px] font-bold text-neutral-900">${ad.price}</span>
                    )
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-400">
                <span>
                  {ad.author} · Unit {ad.unit}
                </span>
                <span>
                  {new Date(ad.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateClassifiedAdDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onSuccess={() => {
          setShowPostDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
