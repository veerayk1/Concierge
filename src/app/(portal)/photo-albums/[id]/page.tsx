'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  Eye,
  Loader2,
  Lock,
  Plus,
  Upload,
  User,
} from 'lucide-react';
import { useApi } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlbumCategory = 'events' | 'building' | 'amenities' | 'renovations' | 'community' | 'seasonal';
type AlbumVisibility = 'public' | 'residents_only' | 'staff_only';

interface ApiAlbumDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  createdById: string | null;
  createdAt: string;
  photoCount: number;
  viewCount: number;
  coverPhotoId: string | null;
  eventDate: string | null;
  photos: Array<{
    id: string;
    filePath: string;
    caption: string | null;
    sortOrder: number;
    uploadedBy: string | null;
    createdAt: string;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const CATEGORY_LABELS: Record<AlbumCategory, string> = {
  events: 'Events',
  building: 'Building',
  amenities: 'Amenities',
  renovations: 'Renovations',
  community: 'Community',
  seasonal: 'Seasonal',
};

const VISIBILITY_LABELS: Record<AlbumVisibility, string> = {
  public: 'Public',
  residents_only: 'Residents Only',
  staff_only: 'Staff Only',
};

const PHOTO_COLORS = [
  'bg-red-100',
  'bg-amber-100',
  'bg-emerald-100',
  'bg-sky-100',
  'bg-violet-100',
  'bg-pink-100',
  'bg-teal-100',
  'bg-orange-100',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoAlbumDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: album,
    loading,
    error,
    refetch,
  } = useApi<ApiAlbumDetail>(`/api/v1/photo-albums/${id}`);

  // Loading
  if (loading) {
    return (
      <PageShell title="Photo Album" description="Loading...">
        <div className="-mt-4 mb-4">
          <Link
            href="/photo-albums"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to photo albums
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading album...</p>
        </div>
      </PageShell>
    );
  }

  // Error
  if (error || !album) {
    return (
      <PageShell title="Photo Album" description="Error">
        <div className="-mt-4 mb-4">
          <Link
            href="/photo-albums"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to photo albums
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">Failed to load album</p>
          <p className="mt-1 text-[13px] text-neutral-500">{error ?? 'Album not found'}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const category = (album.category as AlbumCategory) || 'community';
  const visibility = (album.visibility as AlbumVisibility) || 'public';

  return (
    <PageShell
      title={album.title}
      description="Photo Albums"
      actions={
        <Button size="sm" onClick={() => {}}>
          <Upload className="h-4 w-4" />
          Upload Photo
        </Button>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/photo-albums"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to photo albums
        </Link>
      </div>

      {/* Album Info Card */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-neutral-900">{album.title}</h2>
              {album.description && (
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                  {album.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={CATEGORY_VARIANT[category]} size="sm">
                  {CATEGORY_LABELS[category]}
                </Badge>
                <Badge variant={visibility === 'public' ? 'success' : 'warning'} size="sm">
                  {visibility !== 'public' && <Lock className="h-2.5 w-2.5" />}
                  {VISIBILITY_LABELS[visibility]}
                </Badge>
                <Badge variant="default" size="sm">
                  <Camera className="h-2.5 w-2.5" />
                  {album.photoCount} photos
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {album.createdById ?? 'Admin'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(album.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {album.viewCount} views
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Grid */}
      {album.photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Camera className="h-12 w-12 text-neutral-200" />
          <p className="mt-4 text-[14px] font-medium text-neutral-600">
            No photos in this album yet
          </p>
          <p className="mt-1 text-[13px] text-neutral-400">
            Upload your first photo to get started.
          </p>
          <Button size="sm" className="mt-4" onClick={() => {}}>
            <Upload className="h-4 w-4" />
            Upload Photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {album.photos.map((photo, index) => (
            <Card
              key={photo.id}
              hoverable
              padding="none"
              className="cursor-pointer overflow-hidden"
            >
              {/* Photo Placeholder */}
              <div
                className={`flex h-[220px] items-center justify-center ${PHOTO_COLORS[index % PHOTO_COLORS.length]}`}
              >
                <Camera className="h-10 w-10 text-neutral-300" />
              </div>

              {/* Photo Caption */}
              <div className="p-4">
                <p className="text-[13px] font-medium text-neutral-900">
                  {photo.caption ?? 'Untitled'}
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  {new Date(photo.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </Card>
          ))}

          {/* Upload Placeholder Card */}
          <Card padding="none" className="overflow-hidden">
            <button
              type="button"
              className="flex h-full w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-neutral-200 py-16 text-center transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              onClick={() => {}}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
                <Plus className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-[13px] font-medium text-neutral-500">Upload Photo</p>
            </button>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
