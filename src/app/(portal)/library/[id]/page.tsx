'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  File,
  FileText,
  User,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentVersion {
  id: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
}

interface RelatedDocument {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
}

interface DocumentDetail {
  id: string;
  name: string;
  type: 'document' | 'policy' | 'form' | 'notice' | 'manual';
  category: 'governance' | 'maintenance' | 'safety' | 'financial' | 'operations' | 'general';
  fileType: 'pdf' | 'doc' | 'xlsx' | 'jpg' | 'png';
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  downloadCount: number;
  versions: DocumentVersion[];
  relatedDocuments: RelatedDocument[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_VARIANTS: Record<string, 'default' | 'primary' | 'info' | 'warning' | 'success'> = {
  document: 'default',
  policy: 'primary',
  form: 'info',
  notice: 'warning',
  manual: 'success',
};

const CATEGORY_VARIANTS: Record<
  string,
  'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'
> = {
  governance: 'primary',
  maintenance: 'warning',
  safety: 'error',
  financial: 'info',
  operations: 'default',
  general: 'success',
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DocumentSkeleton() {
  return (
    <PageShell title="" description="Library">
      <div className="-mt-4 mb-4">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
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

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: doc,
    loading,
    error,
    refetch,
  } = useApi<DocumentDetail>(apiUrl(`/api/v1/library/${id}`, { propertyId: DEMO_PROPERTY_ID }));

  if (loading) return <DocumentSkeleton />;

  if (error || !doc) {
    return (
      <PageShell title="Document" description="Library">
        <div className="-mt-4 mb-4">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to library
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertTriangle className="text-error-500 h-12 w-12" />
          <h1 className="text-[20px] font-bold text-neutral-900">
            {error ? 'Error loading document' : 'Document not found'}
          </h1>
          <p className="text-[14px] text-neutral-500">
            {error || 'The document you are looking for does not exist or has been removed.'}
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const versions = doc.versions ?? [];
  const relatedDocuments = doc.relatedDocuments ?? [];

  const versionColumns: Column<DocumentVersion>[] = [
    {
      id: 'version',
      header: 'Version',
      accessorKey: 'version',
      cell: (row) => (
        <span className="text-[13px] font-semibold text-neutral-900">{row.version}</span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'uploadedAt',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.uploadedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'uploadedBy',
      header: 'Uploaded By',
      accessorKey: 'uploadedBy',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.uploadedBy}</span>,
    },
    {
      id: 'fileSize',
      header: 'Size',
      accessorKey: 'fileSize',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.fileSize}</span>,
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: () => (
        <Button variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      title={doc.name}
      description="Library"
      actions={
        <Button size="sm" onClick={() => {}}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Preview Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                <div className="flex flex-col items-center gap-3 text-center">
                  <FileText className="h-12 w-12 text-neutral-300" />
                  <p className="text-[14px] font-medium text-neutral-500">{doc.name}</p>
                  <p className="text-[13px] text-neutral-400">PDF preview will render here</p>
                  <Button variant="secondary" size="sm">
                    <Download className="h-3.5 w-3.5" />
                    Download to view
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          {versions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <CardTitle>Version History ({versions.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={versionColumns}
                  data={versions}
                  emptyMessage="No version history."
                  emptyIcon={<File className="h-6 w-6" />}
                  compact
                />
              </CardContent>
            </Card>
          )}

          {/* Related Documents */}
          {relatedDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {relatedDocuments.map((rd) => (
                    <Link
                      key={rd.id}
                      href={`/library/${rd.id}`}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                          <FileText className="h-4 w-4 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-neutral-900">{rd.name}</p>
                          <p className="text-[12px] text-neutral-400">
                            {rd.fileType.toUpperCase()} &middot; {rd.fileSize}
                          </p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-neutral-300" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle>Document Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Name
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-neutral-900">{doc.name}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Type
                  </p>
                  <div className="mt-1">
                    <Badge variant={TYPE_VARIANTS[doc.type] || 'default'} size="sm">
                      {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Category
                  </p>
                  <div className="mt-1">
                    <Badge variant={CATEGORY_VARIANTS[doc.category] || 'default'} size="sm">
                      {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    File Type
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900 uppercase">{doc.fileType}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    File Size
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">{doc.fileSize}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Uploaded By
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    {doc.uploadedBy}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Uploaded At
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Last Modified
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[14px] text-neutral-900">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    {new Date(doc.lastModified).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Downloads
                  </p>
                  <p className="mt-1 text-[14px] text-neutral-900">{doc.downloadCount ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Action */}
          <Card>
            <CardContent>
              <Button fullWidth>
                <Download className="h-4 w-4" />
                Download Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
