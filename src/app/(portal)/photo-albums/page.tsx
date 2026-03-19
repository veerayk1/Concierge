'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Image,
  Plus,
  Search,
  X,
  Camera,
  Calendar,
  Eye,
  Lock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateAlbumDialog } from '@/components/forms/create-album-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlbumCategory = 'events' | 'building' | 'amenities' | 'renovations' | 'community' | 'seasonal';
type AlbumVisibility = 'public' | 'residents_only' | 'staff_only';

/** Raw shape from GET /api/v1/photo-albums */
interface ApiAlbum {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
  viewCount: number;
  coverPhotoId: string | null;
  eventDate: string | null;
  photos: Array<{ id: string; filePath: string; caption: string | null; sortOrder: number }>;
}

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
// Normalizer
// ---------------------------------------------------------------------------

const COVER_COLORS = [
  'bg-red-100',
  'bg-amber-100',
  'bg-sky-100',
  'bg-green-100',
  'bg-orange-100',
  'bg-slate-100',
  'bg-violet-100',
  'bg-teal-100',
];

function normalizeAlbum(raw: ApiAlbum, index: number): AlbumItem {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    coverColor: COVER_COLORS[index % COVER_COLORS.length] ?? 'bg-neutral-100',
    photoCount: raw.photoCount,
    category: (raw.category as AlbumCategory) || 'community',
    createdBy: raw.createdById ?? 'Admin',
    createdAt: raw.createdAt,
    visibility: (raw.visibility as AlbumVisibility) || 'public',
    viewCount: raw.viewCount,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

  const {
    data: apiAlbums,
    loading,
    error,
    refetch,
  } = useApi<ApiAlbum[]>(
    apiUrl('/api/v1/photo-albums', { propertyId: DEMO_PROPERTY_ID, pageSize: '200' }),
  );

  const allAlbums = useMemo<AlbumItem[]>(() => (apiAlbums ?? []).map(normalizeAlbum), [apiAlbums]);

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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[22px] font-bold text-neutral-900">{totalAlbums}</p>
            )}
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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[22px] font-bold text-neutral-900">{totalPhotos}</p>
            )}
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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-[22px] font-bold text-neutral-900">{publicAlbums}</p>
            )}
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

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading photo albums...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">
            Failed to load photo albums
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && allAlbums.length === 0 && (
        <EmptyState
          icon={<Image className="h-6 w-6" />}
          title="No albums yet"
          description="Create your first photo album to get started."
          action={
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              New Album
            </Button>
          }
        />
      )}

      {/* Albums loaded but filtered to 0 */}
      {!loading && !error && allAlbums.length > 0 && filteredAlbums.length === 0 && (
        <EmptyState
          icon={<Image className="h-6 w-6" />}
          title="No albums found"
          description="Try adjusting your search or filter criteria."
          action={
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
          }
        />
      )}

      {/* Album Grid */}
      {!loading && !error && filteredAlbums.length > 0 && (
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
