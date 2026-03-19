'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Plus, Search, X, Camera, Calendar, Eye, Lock } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateAlbumDialog } from '@/components/forms/create-album-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlbumCategory = 'events' | 'building' | 'amenities' | 'renovations' | 'community' | 'seasonal';
type AlbumVisibility = 'public' | 'residents_only' | 'staff_only';

interface AlbumItem {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  photoCount: number;
  category: AlbumCategory;
  createdBy: string;
  createdAt: string;
  visibility: AlbumVisibility;
  viewCount: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ALBUMS: AlbumItem[] = [
  {
    id: '1',
    title: 'Holiday Party 2025',
    description: 'Annual holiday celebration in the main lobby with residents and staff.',
    coverColor: 'bg-red-100',
    photoCount: 42,
    category: 'events',
    createdBy: 'Sarah M.',
    createdAt: '2025-12-20T18:00:00',
    visibility: 'public',
    viewCount: 328,
  },
  {
    id: '2',
    title: 'Lobby Renovation',
    description: 'Before and after photos of the lobby renovation completed in February.',
    coverColor: 'bg-amber-100',
    photoCount: 27,
    category: 'renovations',
    createdBy: 'James P.',
    createdAt: '2026-02-15T10:00:00',
    visibility: 'residents_only',
    viewCount: 156,
  },
  {
    id: '3',
    title: 'Pool Area',
    description: 'Rooftop pool and lounge area amenity photos for resident orientation.',
    coverColor: 'bg-sky-100',
    photoCount: 18,
    category: 'amenities',
    createdBy: 'Admin',
    createdAt: '2026-01-10T14:00:00',
    visibility: 'public',
    viewCount: 210,
  },
  {
    id: '4',
    title: 'Garden Terrace',
    description: 'Seasonal photos of the garden terrace across all four seasons.',
    coverColor: 'bg-green-100',
    photoCount: 35,
    category: 'seasonal',
    createdBy: 'Lisa K.',
    createdAt: '2026-03-01T09:00:00',
    visibility: 'public',
    viewCount: 189,
  },
  {
    id: '5',
    title: 'Annual BBQ',
    description: 'Summer BBQ event with games, food, and community bonding.',
    coverColor: 'bg-orange-100',
    photoCount: 53,
    category: 'community',
    createdBy: 'Mike R.',
    createdAt: '2025-08-12T16:00:00',
    visibility: 'residents_only',
    viewCount: 274,
  },
  {
    id: '6',
    title: 'Building Exterior',
    description: 'Professional exterior photos of the building for marketing and records.',
    coverColor: 'bg-slate-100',
    photoCount: 12,
    category: 'building',
    createdBy: 'Admin',
    createdAt: '2026-01-05T11:00:00',
    visibility: 'staff_only',
    viewCount: 45,
  },
];

const CATEGORIES: { label: string; value: 'All' | AlbumCategory }[] = [
  { label: 'All', value: 'All' },
  { label: 'Events', value: 'events' },
  { label: 'Building', value: 'building' },
  { label: 'Amenities', value: 'amenities' },
  { label: 'Renovations', value: 'renovations' },
  { label: 'Community', value: 'community' },
  { label: 'Seasonal', value: 'seasonal' },
];

const CATEGORY_VARIANT: Record<
  AlbumCategory,
  'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'
> = {
  events: 'primary',
  building: 'default',
  amenities: 'info',
  renovations: 'warning',
  community: 'success',
  seasonal: 'error',
};

const VISIBILITY_LABEL: Record<AlbumVisibility, string> = {
  public: 'Public',
  residents_only: 'Residents Only',
  staff_only: 'Staff Only',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoAlbumsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | AlbumCategory>('All');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: apiAlbums, refetch } = useApi<AlbumItem[]>(
    apiUrl('/api/v1/photo-albums', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allAlbums = useMemo<AlbumItem[]>(() => apiAlbums ?? MOCK_ALBUMS, [apiAlbums]);

  const filteredAlbums = useMemo(() => {
    return allAlbums.filter((album) => {
      if (categoryFilter !== 'All' && album.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return album.title.toLowerCase().includes(q) || album.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allAlbums, categoryFilter, searchQuery]);

  // Summary stats
  const totalAlbums = allAlbums.length;
  const totalPhotos = allAlbums.reduce((sum, a) => sum + a.photoCount, 0);
  const publicAlbums = allAlbums.filter((a) => a.visibility === 'public').length;

  return (
    <PageShell
      title="Photo Albums"
      description="Building photo galleries and community event albums."
      actions={
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          New Album
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Image className="text-primary-500 h-5 w-5" />
          </div>
          <div>
            <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
              Total Albums
            </p>
            <p className="text-[22px] font-bold text-neutral-900">{totalAlbums}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Camera className="text-info-500 h-5 w-5" />
          </div>
          <div>
            <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
              Total Photos
            </p>
            <p className="text-[22px] font-bold text-neutral-900">{totalPhotos}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Eye className="text-success-500 h-5 w-5" />
          </div>
          <div>
            <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
              Public Albums
            </p>
            <p className="text-[22px] font-bold text-neutral-900">{publicAlbums}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search albums..."
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
              key={cat.value}
              type="button"
              onClick={() => setCategoryFilter(cat.value)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 ${categoryFilter === cat.value ? 'bg-primary-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Album Grid */}
      {filteredAlbums.length === 0 ? (
        <EmptyState
          icon={<Image className="h-6 w-6" />}
          title="No albums found"
          description={
            searchQuery || categoryFilter !== 'All'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first photo album to get started.'
          }
          action={
            searchQuery || categoryFilter !== 'All' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                New Album
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAlbums.map((album) => (
            <Card
              key={album.id}
              hoverable
              padding="none"
              className="cursor-pointer overflow-hidden"
            >
              {/* Cover Placeholder */}
              <div className={`flex h-[200px] items-center justify-center ${album.coverColor}`}>
                <Camera className="h-12 w-12 text-neutral-300" />
              </div>

              {/* Card Body */}
              <div className="p-5">
                <h3 className="text-[15px] font-semibold text-neutral-900">{album.title}</h3>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">
                  {album.description}
                </p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant={CATEGORY_VARIANT[album.category]} size="sm">
                    {album.category}
                  </Badge>
                  <Badge variant="default" size="sm">
                    <Camera className="h-2.5 w-2.5" />
                    {album.photoCount}
                  </Badge>
                  <Badge variant={album.visibility === 'public' ? 'success' : 'warning'} size="sm">
                    {album.visibility !== 'public' && <Lock className="h-2.5 w-2.5" />}
                    {VISIBILITY_LABEL[album.visibility]}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="mt-3 flex items-center justify-between text-[12px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {album.viewCount} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(album.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="mt-2 text-[12px] text-neutral-400">By {album.createdBy}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <CreateAlbumDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        propertyId={DEMO_PROPERTY_ID}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
