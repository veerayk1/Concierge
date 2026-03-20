'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  AlertTriangle,
  BookOpen,
  Plus,
  Download,
  Search,
  X,
  FileText,
  Folder,
  File,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types (aligned with API response from /api/v1/library)
// ---------------------------------------------------------------------------

interface LibraryFolder {
  id: string;
  name: string;
  description: string | null;
  _count?: { files: number; childFolders: number };
}

interface LibraryFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  downloadCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  folder: { id: string; name: string; description: string | null } | null;
}

interface LibraryResponse {
  files: LibraryFile[];
  folders: LibraryFolder[];
}

// ---------------------------------------------------------------------------
// Badge Helpers
// ---------------------------------------------------------------------------

const CATEGORY_VARIANTS: Record<
  string,
  'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'
> = {
  rules: 'primary',
  policies: 'primary',
  procedures: 'info',
  minutes: 'default',
  safety: 'error',
  insurance: 'warning',
  financials: 'info',
  forms: 'success',
  notices: 'warning',
  other: 'default',
};

function getMimeIcon(mimeType: string): typeof FileText {
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return File;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'text/plain': 'TXT',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
  };
  return map[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'FILE';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string>('');

  const {
    data: apiData,
    loading,
    error,
    refetch,
  } = useApi<LibraryResponse>(
    apiUrl('/api/v1/library', {
      propertyId: getPropertyId(),
      folderId: currentFolderId || null,
      category: categoryFilter || null,
      search: searchQuery || null,
    }),
  );

  // The useApi hook unwraps .data, so apiData is { files, folders } or wrapped
  const libraryData = useMemo<LibraryResponse>(() => {
    if (!apiData) return { files: [], folders: [] };
    const raw = apiData as unknown as {
      data?: LibraryResponse;
      files?: LibraryFile[];
      folders?: LibraryFolder[];
    };
    if (raw.data) return raw.data;
    if (raw.files) return { files: raw.files, folders: raw.folders || [] };
    return { files: [], folders: [] };
  }, [apiData]);

  const { files, folders } = libraryData;

  const totalDocuments = files.length;
  const totalFolders = folders.length;

  const columns: Column<LibraryFile>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'fileName',
      sortable: true,
      cell: (row) => {
        const Icon = getMimeIcon(row.mimeType);
        return (
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-neutral-400" />
            <span className="font-semibold text-neutral-900">{row.fileName}</span>
          </span>
        );
      },
    },
    {
      id: 'folder',
      header: 'Folder',
      accessorKey: 'folder',
      sortable: true,
      cell: (row) => (
        <Badge variant={CATEGORY_VARIANTS[row.folder?.name || ''] || 'default'} size="sm">
          {row.folder?.name || 'Root'}
        </Badge>
      ),
    },
    {
      id: 'fileType',
      header: 'File Type',
      accessorKey: 'mimeType',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500 uppercase">
          {getFileExtension(row.mimeType)}
        </span>
      ),
    },
    {
      id: 'fileSize',
      header: 'Size',
      accessorKey: 'fileSize',
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">{formatFileSize(row.fileSize)}</span>
      ),
    },
    {
      id: 'lastModified',
      header: 'Last Modified',
      accessorKey: 'updatedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'downloadCount',
      header: 'Downloads',
      accessorKey: 'downloadCount',
      sortable: true,
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.downloadCount}</span>,
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // In a real app, this would trigger a download via the file path
            window.open(row.filePath, '_blank');
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      ),
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <PageShell title="Library" description="Building documents, policies, and shared files.">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="mt-4 h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell title="Library" description="Building documents, policies, and shared files.">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load documents"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Library"
      description="Building documents, policies, and shared files."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Folder className="h-4 w-4" />
            New Folder
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <BookOpen className="text-primary-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {totalDocuments}
            </p>
            <p className="text-[13px] text-neutral-500">Documents</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Folder className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalFolders}</p>
            <p className="text-[13px] text-neutral-500">Folders</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Download className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {files.reduce((sum, f) => sum + f.downloadCount, 0)}
            </p>
            <p className="text-[13px] text-neutral-500">Total Downloads</p>
          </div>
        </Card>
      </div>

      {/* Folder Navigation */}
      {folders.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
            Folders
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentFolderId && (
              <button
                type="button"
                onClick={() => setCurrentFolderId('')}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                &larr; Back to Root
              </button>
            )}
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <Folder className="h-4 w-4 text-neutral-400" />
                {folder.name}
                {folder._count && (
                  <span className="text-[11px] text-neutral-400">
                    ({folder._count.files} files)
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents..."
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
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="rules">Rules</option>
          <option value="policies">Policies</option>
          <option value="procedures">Procedures</option>
          <option value="minutes">Minutes</option>
          <option value="safety">Safety</option>
          <option value="insurance">Insurance</option>
          <option value="financials">Financials</option>
          <option value="forms">Forms</option>
          <option value="notices">Notices</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Data Table */}
      {files.length > 0 ? (
        <DataTable
          columns={columns}
          data={files}
          onRowClick={(row) => router.push(`/library/${row.id}` as never)}
        />
      ) : (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No documents found"
          description={
            searchQuery || categoryFilter
              ? 'No documents match your search or filter criteria.'
              : 'Upload building documents, policies, and shared files to get started.'
          }
        />
      )}
    </PageShell>
  );
}
