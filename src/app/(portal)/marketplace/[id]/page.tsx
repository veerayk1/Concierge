'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListingStatus = 'active' | 'sold' | 'expired' | 'removed';
type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

interface SimilarListing {
  id: string;
  title: string;
  price: number;
  condition: ListingCondition;
  imageColor: string;
}

interface ClassifiedListing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  category: string;
  status: ListingStatus;
  seller: {
    name: string;
    unit: string;
    memberSince: string;
    otherListings: number;
  };
  postedAt: string;
  expiresAt: string;
  similarListings: SimilarListing[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_LISTING: ClassifiedListing = {
  id: '1',
  title: 'Leather Sofa \u2014 Like New',
  description:
    'Beautiful genuine leather 3-seater sofa in dark brown. Purchased from West Elm two years ago for $2,200. Barely used — was in a guest room. No scratches, stains, or wear marks. Cushions are firm and supportive. Dimensions: 84"W x 36"D x 34"H. Buyer must arrange pickup from unit. Available weekday evenings or weekends. Cash or e-transfer accepted.',
  price: 450,
  condition: 'like_new',
  category: 'Furniture',
  status: 'active',
  seller: {
    name: 'David Chen',
    unit: '802',
    memberSince: '2024-06-15',
    otherListings: 2,
  },
  postedAt: '2026-03-10T14:00:00',
  expiresAt: '2026-04-10T23:59:59',
  similarListings: [
    {
      id: 'sim-1',
      title: 'IKEA Sectional Couch',
      price: 300,
      condition: 'good',
      imageColor: 'bg-sky-50',
    },
    {
      id: 'sim-2',
      title: 'Coffee Table — Walnut',
      price: 120,
      condition: 'like_new',
      imageColor: 'bg-amber-50',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ListingStatus,
  { variant: 'success' | 'error' | 'warning' | 'default'; label: string }
> = {
  active: { variant: 'success', label: 'Active' },
  sold: { variant: 'default', label: 'Sold' },
  expired: { variant: 'warning', label: 'Expired' },
  removed: { variant: 'error', label: 'Removed' },
};

const CONDITION_CONFIG: Record<
  ListingCondition,
  { variant: 'success' | 'info' | 'warning' | 'default' | 'error'; label: string }
> = {
  new: { variant: 'success', label: 'New' },
  like_new: { variant: 'success', label: 'Like New' },
  good: { variant: 'info', label: 'Good' },
  fair: { variant: 'warning', label: 'Fair' },
  poor: { variant: 'default', label: 'Poor' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MarketplaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MarketplaceDetailPage({ params }: MarketplaceDetailPageProps) {
  const { id } = use(params);

  const listing = { ...MOCK_LISTING, id };
  const statusCfg = STATUS_CONFIG[listing.status];
  const conditionCfg = CONDITION_CONFIG[listing.condition];

  return (
    <PageShell
      title={listing.title}
      description="Classified Ad"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Listing
          </Button>
        </div>
      }
    >
      {/* Back link */}
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
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Photo Gallery Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Front View', bg: 'bg-amber-50' },
                  { label: 'Side View', bg: 'bg-orange-50' },
                  { label: 'Detail', bg: 'bg-rose-50' },
                ].map((photo) => (
                  <div
                    key={photo.label}
                    className={`flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-neutral-200 ${photo.bg}`}
                  >
                    <ImageIcon className="h-8 w-8 text-neutral-300" />
                    <span className="mt-2 text-[12px] text-neutral-400">{photo.label}</span>
                  </div>
                ))}
              </div>
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
                      {formatCurrency(listing.price)}
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
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant="primary" size="lg">
                      {listing.category}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Posted"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(listing.postedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
                <InfoRow
                  label="Expires"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(listing.expiresAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Seller */}
          <Card>
            <CardHeader>
              <CardTitle>Seller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 text-primary-700 flex h-12 w-12 items-center justify-center rounded-full text-[16px] font-bold">
                  {listing.seller.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {listing.seller.name}
                  </p>
                  <p className="text-[13px] text-neutral-500">Unit {listing.seller.unit}</p>
                  <p className="text-[12px] text-neutral-400">
                    Member since{' '}
                    {new Date(listing.seller.memberSince).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    {listing.seller.otherListings} other active listing
                    {listing.seller.otherListings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Price Card */}
          <Card>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="bg-success-50 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <DollarSign className="text-success-600 h-8 w-8" />
                </div>
                <p className="text-[36px] font-bold tracking-tight text-neutral-900">
                  {formatCurrency(listing.price)}
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

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                <p className="text-[13px] text-neutral-500">
                  Expires{' '}
                  {new Date(listing.expiresAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
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

          {/* Similar Listings */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {listing.similarListings.map((item) => {
                  const itemCondition = CONDITION_CONFIG[item.condition];
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3"
                    >
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-neutral-200 ${item.imageColor}`}
                      >
                        <ImageIcon className="h-5 w-5 text-neutral-300" />
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <p className="text-[13px] font-medium text-neutral-900">{item.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-neutral-900">
                            {formatCurrency(item.price)}
                          </span>
                          <Badge variant={itemCondition.variant} size="sm">
                            {itemCondition.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
