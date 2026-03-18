'use client';

import { useState } from 'react';
import { Calendar, Heart, MessageCircle, Plus, Search, ShoppingBag, Tag, X } from 'lucide-react';
import { CreateClassifiedAdDialog } from '@/components/forms/create-classified-ad-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ADS: ClassifiedAd[] = [
  {
    id: '1',
    title: 'IKEA KALLAX Shelf Unit — White',
    description: 'Moving out sale. 4x4 KALLAX in excellent condition. Must pick up from unit.',
    category: 'Furniture',
    price: 80,
    isFree: false,
    author: 'Lisa B.',
    unit: '1105',
    createdAt: '2026-03-18T10:00:00',
    imageCount: 3,
  },
  {
    id: '2',
    title: 'Free Moving Boxes — Various Sizes',
    description:
      'Just moved in and have about 20 boxes to give away. First come first served. Leave a message.',
    category: 'Free Stuff',
    isFree: true,
    author: 'Alice W.',
    unit: '101',
    createdAt: '2026-03-17T15:00:00',
    imageCount: 1,
  },
  {
    id: '3',
    title: 'Dog Walker Available — Weekdays',
    description:
      'Experienced dog walker, available Mon-Fri 10am-4pm. Flexible rates. References available.',
    category: 'Services',
    price: 25,
    isFree: false,
    author: 'Maria G.',
    unit: '1203',
    createdAt: '2026-03-16T09:00:00',
    imageCount: 0,
  },
  {
    id: '4',
    title: 'Looking for Carpool — Downtown',
    description: 'Working at King & Bay, looking for carpool partner. Leave 8am, return 5:30pm.',
    category: 'Wanted',
    isFree: true,
    author: 'Robert K.',
    unit: '305',
    createdAt: '2026-03-15T12:00:00',
    imageCount: 0,
  },
  {
    id: '5',
    title: 'Peloton Bike — Like New',
    description:
      'Barely used Peloton bike with screen. Selling due to relocation. Paid $2,200, asking $1,200 OBO.',
    category: 'Fitness',
    price: 1200,
    isFree: false,
    author: 'David C.',
    unit: '802',
    createdAt: '2026-03-14T18:00:00',
    imageCount: 4,
  },
];

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

  const filteredAds = MOCK_ADS.filter((ad) => {
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

      <CreateClassifiedAdDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onSuccess={() => setShowPostDialog(false)}
      />
    </PageShell>
  );
}
