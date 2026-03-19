'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Camera, Eye, Lock, Plus, Upload, User } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AlbumCategory = 'events' | 'building' | 'amenities' | 'renovations' | 'community' | 'seasonal';
type AlbumVisibility = 'public' | 'residents_only' | 'staff_only';

interface PhotoItem {
  id: string;
  caption: string;
  color: string;
  uploadedAt: string;
}

interface AlbumDetail {
  id: string;
  title: string;
  description: string;
  category: AlbumCategory;
  visibility: AlbumVisibility;
  createdBy: string;
  createdAt: string;
  photoCount: number;
  viewCount: number;
  photos: PhotoItem[];
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

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ALBUM: AlbumDetail = {
  id: '1',
  title: 'Holiday Party 2025',
  description:
    'Annual holiday celebration in the main lobby with residents and staff. A wonderful evening of music, food, and community spirit. Thank you to everyone who attended and made it a memorable night!',
  category: 'events',
  visibility: 'public',
  createdBy: 'Sarah M.',
  createdAt: '2025-12-20T18:00:00',
  photoCount: 8,
  viewCount: 328,
  photos: [
    {
      id: 'p-1',
      caption: 'Lobby decorations',
      color: 'bg-red-100',
      uploadedAt: '2025-12-20T18:30:00',
    },
    {
      id: 'p-2',
      caption: 'Buffet spread',
      color: 'bg-amber-100',
      uploadedAt: '2025-12-20T18:45:00',
    },
    {
      id: 'p-3',
      caption: 'Live music performance',
      color: 'bg-emerald-100',
      uploadedAt: '2025-12-20T19:00:00',
    },
    {
      id: 'p-4',
      caption: 'Group photo by the tree',
      color: 'bg-sky-100',
      uploadedAt: '2025-12-20T19:30:00',
    },
    {
      id: 'p-5',
      caption: "Kids' craft corner",
      color: 'bg-violet-100',
      uploadedAt: '2025-12-20T20:00:00',
    },
    {
      id: 'p-6',
      caption: 'Dance floor action',
      color: 'bg-pink-100',
      uploadedAt: '2025-12-20T20:15:00',
    },
    {
      id: 'p-7',
      caption: 'Dessert table',
      color: 'bg-teal-100',
      uploadedAt: '2025-12-20T20:30:00',
    },
    {
      id: 'p-8',
      caption: 'Raffle prize winners',
      color: 'bg-orange-100',
      uploadedAt: '2025-12-20T21:00:00',
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoAlbumDetailPage() {
  const { id } = useParams<{ id: string }>();

  const album = MOCK_ALBUM;

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
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                {album.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={CATEGORY_VARIANT[album.category]} size="sm">
                  {CATEGORY_LABELS[album.category]}
                </Badge>
                <Badge variant={album.visibility === 'public' ? 'success' : 'warning'} size="sm">
                  {album.visibility !== 'public' && <Lock className="h-2.5 w-2.5" />}
                  {VISIBILITY_LABELS[album.visibility]}
                </Badge>
                <Badge variant="default" size="sm">
                  <Camera className="h-2.5 w-2.5" />
                  {album.photoCount} photos
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {album.createdBy}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {album.photos.map((photo) => (
          <Card key={photo.id} hoverable padding="none" className="cursor-pointer overflow-hidden">
            {/* Photo Placeholder */}
            <div className={`flex h-[220px] items-center justify-center ${photo.color}`}>
              <Camera className="h-10 w-10 text-neutral-300" />
            </div>

            {/* Photo Caption */}
            <div className="p-4">
              <p className="text-[13px] font-medium text-neutral-900">{photo.caption}</p>
              <p className="mt-1 text-[12px] text-neutral-400">
                {new Date(photo.uploadedAt).toLocaleDateString('en-US', {
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
    </PageShell>
  );
}
