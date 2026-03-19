'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, X, DollarSign, Tag, Calendar } from 'lucide-react';
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

type ListingCategory =
  | 'furniture'
  | 'electronics'
  | 'clothing'
  | 'services'
  | 'free_stuff'
  | 'wanted'
  | 'other';

type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

type ListingStatus = 'active' | 'sold' | 'expired' | 'removed';

interface ClassifiedItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  author: string;
  authorUnit: string;
  status: ListingStatus;
  photos: number;
  createdAt: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<
  ListingCategory,
  'default' | 'warning' | 'info' | 'error' | 'success'
> = {
  furniture: 'info',
  electronics: 'warning',
  clothing: 'default',
  services: 'success',
  free_stuff: 'success',
  wanted: 'error',
  other: 'default',
};

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  furniture: 'Furniture',
  electronics: 'Electronics',
  clothing: 'Clothing',
  services: 'Services',
  free_stuff: 'Free Stuff',
  wanted: 'Wanted',
  other: 'Other',
};

const CONDITION_COLORS: Record<
  ListingCondition,
  'default' | 'warning' | 'info' | 'error' | 'success'
> = {
  new: 'success',
  like_new: 'success',
  good: 'info',
  fair: 'warning',
  poor: 'error',
};

const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const STATUS_COLORS: Record<ListingStatus, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  active: 'success',
  sold: 'default',
  expired: 'warning',
  removed: 'error',
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Active',
  sold: 'Sold',
  expired: 'Expired',
  removed: 'Removed',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_LISTINGS: ClassifiedItem[] = [
  {
    id: '1',
    title: 'Grey Sectional Sofa — Lightly Used',
    description:
      'Moving out and selling a 3-piece sectional sofa in grey fabric. Great condition, no stains or damage. Must pick up from unit.',
    price: 450,
    category: 'furniture',
    condition: 'good',
    author: 'Lisa B.',
    authorUnit: '1105',
    status: 'active',
    photos: 4,
    createdAt: '2026-03-15T10:00:00',
    expiresAt: '2026-04-15T10:00:00',
  },
  {
    id: '2',
    title: 'Trek Mountain Bike — 21-Speed',
    description:
      'Selling my Trek mountain bike. 21-speed, recently tuned up with new brake pads. Perfect for spring riding.',
    price: 300,
    category: 'electronics',
    condition: 'like_new',
    author: 'David C.',
    authorUnit: '802',
    status: 'active',
    photos: 3,
    createdAt: '2026-03-16T14:00:00',
    expiresAt: '2026-04-16T14:00:00',
  },
  {
    id: '3',
    title: 'Free Moving Boxes — Various Sizes',
    description:
      'Just moved in and have about 20 boxes to give away. Various sizes, some with packing paper. First come first served.',
    price: 0,
    category: 'free_stuff',
    condition: 'fair',
    author: 'Alice W.',
    authorUnit: '101',
    status: 'active',
    photos: 1,
    createdAt: '2026-03-17T09:00:00',
    expiresAt: '2026-03-24T09:00:00',
  },
  {
    id: '4',
    title: 'Sony WH-1000XM5 Headphones',
    description:
      'Selling Sony noise-cancelling headphones. Bought 3 months ago, barely used. Comes with original box and all accessories.',
    price: 250,
    category: 'electronics',
    condition: 'like_new',
    author: 'Robert K.',
    authorUnit: '305',
    status: 'sold',
    photos: 2,
    createdAt: '2026-03-12T16:00:00',
    expiresAt: '2026-04-12T16:00:00',
  },
  {
    id: '5',
    title: 'Babysitting Services — Evenings & Weekends',
    description:
      'Experienced babysitter available evenings and weekends. CPR certified, references available. Flexible rates for building residents.',
    price: 20,
    category: 'services',
    condition: 'new',
    author: 'Maria G.',
    authorUnit: '1203',
    status: 'active',
    photos: 0,
    createdAt: '2026-03-14T11:00:00',
    expiresAt: '2026-04-14T11:00:00',
  },
  {
    id: '6',
    title: 'Canada Goose Winter Jacket — Size M',
    description:
      'Selling Canada Goose Expedition parka, size medium. Worn one season, in excellent condition. Dry cleaned and ready to go.',
    price: 600,
    category: 'clothing',
    condition: 'good',
    author: 'Karen L.',
    authorUnit: '905',
    status: 'active',
    photos: 3,
    createdAt: '2026-03-18T08:00:00',
    expiresAt: '2026-04-18T08:00:00',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketplacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ListingCategory | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<ListingCondition | 'all'>('all');
  const [freeOnly, setFreeOnly] = useState(false);

  const { data: apiListings } = useApi<ClassifiedItem[]>(
    apiUrl('/api/v1/marketplace', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allListings = useMemo<ClassifiedItem[]>(() => apiListings ?? MOCK_LISTINGS, [apiListings]);

  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;
      if (freeOnly && item.price !== 0) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q)
      );
    });
  }, [allListings, categoryFilter, conditionFilter, freeOnly, searchQuery]);

  const activeCount = allListings.filter((i) => i.status === 'active').length;
  const freeCount = allListings.filter((i) => i.price === 0 && i.status === 'active').length;
  const soldCount = allListings.filter((i) => i.status === 'sold').length;

  return (
    <PageShell
      title="Marketplace"
      description="Buy, sell, and trade with your neighbours."
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Post Listing
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Store className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{activeCount}</p>
            <p className="text-[13px] text-neutral-500">Active Listings</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <DollarSign className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{freeCount}</p>
            <p className="text-[13px] text-neutral-500">Free Items</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <Tag className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{soldCount}</p>
            <p className="text-[13px] text-neutral-500">Recently Sold</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
        <div className="flex items-center gap-2">
          <label
            htmlFor="marketplace-category-filter"
            className="text-[13px] font-medium text-neutral-600"
          >
            Category:
          </label>
          <select
            id="marketplace-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ListingCategory | 'all')}
            className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="services">Services</option>
            <option value="free_stuff">Free Stuff</option>
            <option value="wanted">Wanted</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="marketplace-condition-filter"
            className="text-[13px] font-medium text-neutral-600"
          >
            Condition:
          </label>
          <select
            id="marketplace-condition-filter"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value as ListingCondition | 'all')}
            className="focus:border-primary-300 focus:ring-primary-100 h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
          >
            <option value="all">All Conditions</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-600">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300"
          />
          Free only
        </label>
      </div>

      {/* Card Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="No listings found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((item) => (
            <Card key={item.id} hoverable className="cursor-pointer">
              {/* Image placeholder */}
              <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-neutral-100">
                <Tag className="h-8 w-8 text-neutral-300" />
                {item.photos > 0 && (
                  <span className="absolute right-2 bottom-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {item.photos} photos
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-neutral-900">{item.title}</h3>
                {item.status !== 'active' && (
                  <Badge variant={STATUS_COLORS[item.status]} size="sm">
                    {STATUS_LABELS[item.status]}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {item.price === 0 ? (
                  <Badge variant="success" size="sm">
                    FREE
                  </Badge>
                ) : (
                  <span className="text-[16px] font-bold text-neutral-900">${item.price}</span>
                )}
                <Badge variant={CONDITION_COLORS[item.condition]} size="sm">
                  {CONDITION_LABELS[item.condition]}
                </Badge>
                <Badge variant={CATEGORY_COLORS[item.category]} size="sm">
                  {CATEGORY_LABELS[item.category]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-400">
                <span>
                  {item.author} · Unit {item.authorUnit}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
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
