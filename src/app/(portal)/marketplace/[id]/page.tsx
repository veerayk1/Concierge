'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  Flag,
  ImageIcon,
  MessageCircle,
  RefreshCw,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClassifiedAdData {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  priceType?: string;
  condition?: string;
  category?: string;
  status: string;
  userId?: string;
  viewCount?: number;
  createdAt?: string;
  expirationDate?: string | null;
  contactMethod?: string[];
  contactPhone?: string | null;
  contactEmail?: string | null;
  images?: Array<{ id: string; filePath: string; sortOrder: number }>;
  photoCount?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  active: { variant: 'success', label: 'Active' },
  sold: { variant: 'default', label: 'Sold' },
  expired: { variant: 'warning', label: 'Expired' },
  archived: { variant: 'error', label: 'Removed' },
};

const CONDITION_CONFIG: Record<
  string,
  { variant: 'success' | 'info' | 'warning' | 'default'; label: string }
> = {
  new: { variant: 'success', label: 'New' },
  like_new: { variant: 'success', label: 'Like New' },
  good: { variant: 'info', label: 'Good' },
  fair: { variant: 'warning', label: 'Fair' },
  not_applicable: { variant: 'default', label: 'N/A' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function MarketplaceSkeleton() {
  return (
    <PageShell title="" description="Classified Ad">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ClassifiedAdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/classifieds/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch listing (${res.status})`);
        const json = await res.json();
        setListing(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchListing();
  }, [id]);

  if (loading) return <MarketplaceSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Tag className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Listing not found</h1>
        <p className="text-[14px] text-neutral-500">
          The classified ad you are looking for does not exist or has been removed.
        </p>
        <Link href="/marketplace">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading listing</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Link href="/marketplace">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Button>
        </Link>
      </div>
    );
  }

  if (!listing) return null;

  const statusCfg = STATUS_CONFIG[listing.status] ?? {
    variant: 'success' as const,
    label: 'Active',
  };
  const conditionCfg = CONDITION_CONFIG[listing.condition || 'not_applicable'] ?? {
    variant: 'default' as const,
    label: 'N/A',
  };
  const price = listing.price ?? 0;
  const images = listing.images || [];

  return (
    <PageShell
      title={listing.title}
      description="Classified Ad"
      actions={
        <Button variant="secondary" size="sm">
          <Edit2 className="h-4 w-4" />
          Edit Listing
        </Button>
      }
    >
      <div className="-mt-4 mb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="flex aspect-[4/3] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50"
                    >
                      <ImageIcon className="h-8 w-8 text-neutral-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
                  <ImageIcon className="h-10 w-10 text-neutral-300" />
                  <p className="mt-2 text-[13px] text-neutral-400">No photos uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Title"
                    value={<span className="text-[16px] font-semibold">{listing.title}</span>}
                  />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Description"
                    value={
                      <p className="leading-relaxed text-neutral-700">{listing.description}</p>
                    }
                  />
                </div>
                <InfoRow
                  label="Price"
                  value={
                    <span className="text-[20px] font-bold text-neutral-900">
                      {formatCurrency(price)}
                    </span>
                  }
                />
                <InfoRow
                  label="Condition"
                  value={
                    <Badge variant={conditionCfg.variant} size="lg" dot>
                      {conditionCfg.label}
                    </Badge>
                  }
                />
                {listing.category && (
                  <InfoRow
                    label="Category"
                    value={
                      <Badge variant="primary" size="lg">
                        {listing.category}
                      </Badge>
                    }
                  />
                )}
                {listing.createdAt && (
                  <InfoRow
                    label="Posted"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(listing.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
                {listing.expirationDate && (
                  <InfoRow
                    label="Expires"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(listing.expirationDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <DollarSign className="text-success-600 h-8 w-8" />
                </div>
                <p className="text-[36px] font-bold tracking-tight text-neutral-900">
                  {formatCurrency(price)}
                </p>
                <Badge variant={conditionCfg.variant} size="lg" dot>
                  {conditionCfg.label}
                </Badge>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button fullWidth>
                  <MessageCircle className="h-4 w-4" />
                  Contact Seller
                </Button>
                <Button variant="secondary" fullWidth>
                  <Flag className="h-4 w-4" />
                  Report Listing
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                {listing.viewCount !== undefined && (
                  <p className="text-[13px] text-neutral-500">{listing.viewCount} views</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" fullWidth>
                  <Edit2 className="h-4 w-4" />
                  Edit Listing
                </Button>
                <Button variant="secondary" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Sold
                </Button>
                <Button variant="secondary" fullWidth>
                  <RefreshCw className="h-4 w-4" />
                  Renew Listing
                </Button>
                <Button variant="danger" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Remove Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
