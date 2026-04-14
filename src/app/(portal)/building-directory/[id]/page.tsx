'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Power,
  Trash2,
  User,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EditDirectoryEntryDialog } from '@/components/forms/edit-directory-entry-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntryCategory =
  | 'management'
  | 'emergency'
  | 'amenity'
  | 'commercial'
  | 'utility'
  | 'service'
  | 'security'
  | 'maintenance'
  | 'common_area';
type EntryStatus = 'active' | 'inactive';

interface RelatedEntry {
  id: string;
  name: string;
  category: EntryCategory;
}

interface DirectoryEntry {
  id: string;
  name: string;
  category: EntryCategory;
  status: EntryStatus;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  hoursOfOperation: string;
  hours?: string;
  notes: string;
  isActive?: boolean;
  relatedEntries: RelatedEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  string,
  { variant: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }
> = {
  management: { variant: 'primary', label: 'Management' },
  emergency: { variant: 'error', label: 'Emergency' },
  amenity: { variant: 'info', label: 'Amenity' },
  commercial: { variant: 'warning', label: 'Commercial' },
  utility: { variant: 'default', label: 'Utility' },
  service: { variant: 'success', label: 'Service' },
  security: { variant: 'info', label: 'Security' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  common_area: { variant: 'primary', label: 'Common Area' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <PageShell title="" description="Building Directory">
      <div className="-mt-4 mb-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="mb-4 h-6 w-2/3" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
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

export default function BuildingDirectoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    data: entry,
    loading,
    error,
    refetch,
  } = useApi<DirectoryEntry>(
    apiUrl(`/api/v1/building-directory/${id}`, { propertyId: getPropertyId() }),
  );

  if (loading) return <DetailSkeleton />;

  if (error || !entry) {
    return (
      <PageShell title="Directory Entry" description="Building Directory">
        <div className="-mt-4 mb-4">
          <Link
            href="/building-directory"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to building directory
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertTriangle className="text-error-500 h-12 w-12" />
          <h1 className="text-[20px] font-bold text-neutral-900">
            {error ? 'Error loading entry' : 'Entry not found'}
          </h1>
          <p className="text-[14px] text-neutral-500">
            {error || 'The directory entry you are looking for does not exist.'}
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const categoryCfg = CATEGORY_CONFIG[entry.category] || {
    variant: 'default' as const,
    label: entry.category,
  };
  const isActive = entry.isActive ?? entry.status === 'active';
  const hours = entry.hoursOfOperation || entry.hours || 'N/A';
  const relatedEntries = entry.relatedEntries ?? [];

  return (
    <PageShell
      title={entry.name}
      description="Building Directory"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="h-4 w-4" />
            Edit Entry
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/building-directory"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to building directory
        </Link>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6">
          {/* Entry Details */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Name"
                    value={<span className="text-[16px] font-semibold">{entry.name}</span>}
                  />
                </div>
                <InfoRow
                  label="Category"
                  value={
                    <Badge variant={categoryCfg.variant} size="lg">
                      {categoryCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={isActive ? 'success' : 'default'} size="lg" dot>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Contact Person"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.contactPerson || 'N/A'}
                    </span>
                  }
                />
                <InfoRow
                  label="Phone"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.phone}
                    </span>
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.email || 'N/A'}
                    </span>
                  }
                />
                <InfoRow
                  label="Location"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      {entry.location}
                    </span>
                  }
                />
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Hours of Operation"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {hours}
                      </span>
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Notes"
                    value={
                      <p className="leading-relaxed text-neutral-700">
                        {entry.notes || 'No notes.'}
                      </p>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50">
                <MapPin className="h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-[14px] font-medium text-neutral-500">{entry.location}</p>
                <p className="mt-1 text-[12px] text-neutral-400">Map view coming soon</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditDialogOpen(true)}>
                  <Edit2 className="h-4 w-4" />
                  Edit Entry
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const action = isActive ? 'deactivate' : 'activate';
                    if (!confirm(`Are you sure you want to ${action} this entry?`)) return;
                    try {
                      const res = await apiRequest(`/api/v1/building-directory/${id}`, {
                        method: 'PATCH',
                        body: { isActive: !isActive },
                      });
                      if (res.ok) {
                        await refetch();
                      } else {
                        alert(`Failed to ${action} entry. Please try again.`);
                      }
                    } catch {
                      alert(`Failed to ${action} entry. Please try again.`);
                    }
                  }}
                >
                  <Power className="h-4 w-4" />
                  {isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (
                      !confirm(
                        'Are you sure you want to delete this entry? This action cannot be undone.',
                      )
                    )
                      return;
                    try {
                      const res = await apiRequest(`/api/v1/building-directory/${id}`, {
                        method: 'DELETE',
                      });
                      if (res.ok) {
                        router.push('/building-directory');
                      } else {
                        alert('Failed to delete entry. Please try again.');
                      }
                    } catch {
                      alert('Failed to delete entry. Please try again.');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Entries */}
          {relatedEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {relatedEntries.map((related) => {
                    const relCfg = CATEGORY_CONFIG[related.category] || {
                      variant: 'default' as const,
                      label: related.category,
                    };
                    return (
                      <Link
                        key={related.id}
                        href={`/building-directory/${related.id}`}
                        className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 transition-colors hover:bg-neutral-100/50"
                      >
                        <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-lg">
                          <Building2 className="text-primary-600 h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-neutral-900">{related.name}</p>
                        </div>
                        <Badge variant={relCfg.variant} size="sm">
                          {relCfg.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Directory Entry Dialog */}
      <EditDirectoryEntryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        entry={entry}
        onSuccess={refetch}
      />
    </PageShell>
  );
}
