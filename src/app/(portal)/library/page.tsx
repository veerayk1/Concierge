'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { BookOpen, Plus, Download, Search, X, FileText, Folder, File } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LibraryItem {
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
  isPublic: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_ITEMS: LibraryItem[] = [
  {
    id: '1',
    name: 'Building Bylaws & Declaration',
    type: 'policy',
    category: 'governance',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    uploadedBy: 'Admin',
    uploadedAt: '2026-01-15T10:00:00',
    lastModified: '2026-03-01T14:30:00',
    downloadCount: 87,
    isPublic: true,
  },
  {
    id: '2',
    name: 'Fire Safety Manual',
    type: 'manual',
    category: 'safety',
    fileType: 'pdf',
    fileSize: '5.1 MB',
    uploadedBy: 'Admin',
    uploadedAt: '2026-02-10T09:00:00',
    lastModified: '2026-02-10T09:00:00',
    downloadCount: 42,
    isPublic: true,
  },
  {
    id: '3',
    name: 'Move-In/Move-Out Checklist',
    type: 'form',
    category: 'operations',
    fileType: 'doc',
    fileSize: '340 KB',
    uploadedBy: 'Sarah Wilson',
    uploadedAt: '2026-02-20T11:00:00',
    lastModified: '2026-03-05T16:00:00',
    downloadCount: 156,
    isPublic: true,
  },
  {
    id: '4',
    name: '2026 Annual Budget Report',
    type: 'document',
    category: 'financial',
    fileType: 'xlsx',
    fileSize: '1.8 MB',
    uploadedBy: 'Admin',
    uploadedAt: '2026-01-30T08:00:00',
    lastModified: '2026-01-30T08:00:00',
    downloadCount: 34,
    isPublic: false,
  },
  {
    id: '5',
    name: 'Maintenance Request Form',
    type: 'form',
    category: 'maintenance',
    fileType: 'pdf',
    fileSize: '220 KB',
    uploadedBy: 'Mike Johnson',
    uploadedAt: '2026-03-01T13:00:00',
    lastModified: '2026-03-10T10:00:00',
    downloadCount: 73,
    isPublic: true,
  },
  {
    id: '6',
    name: 'Pool & Amenity Rules',
    type: 'notice',
    category: 'general',
    fileType: 'pdf',
    fileSize: '450 KB',
    uploadedBy: 'Admin',
    uploadedAt: '2026-03-12T09:30:00',
    lastModified: '2026-03-12T09:30:00',
    downloadCount: 21,
    isPublic: true,
  },
];

// ---------------------------------------------------------------------------
// Badge Helpers
// ---------------------------------------------------------------------------

const TYPE_VARIANTS: Record<
  LibraryItem['type'],
  'default' | 'primary' | 'info' | 'warning' | 'success'
> = {
  document: 'default',
  policy: 'primary',
  form: 'info',
  notice: 'warning',
  manual: 'success',
};

const CATEGORY_VARIANTS: Record<
  LibraryItem['category'],
  'default' | 'primary' | 'info' | 'warning' | 'success' | 'error'
> = {
  governance: 'primary',
  maintenance: 'warning',
  safety: 'error',
  financial: 'info',
  operations: 'default',
  general: 'success',
};

const FILE_ICONS: Record<LibraryItem['fileType'], typeof FileText> = {
  pdf: FileText,
  doc: File,
  xlsx: File,
  jpg: File,
  png: File,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: apiItems } = useApi<LibraryItem[]>(
    apiUrl('/api/v1/library', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allItems = useMemo<LibraryItem[]>(() => apiItems ?? MOCK_ITEMS, [apiItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.uploadedBy.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allItems, typeFilter, categoryFilter, searchQuery]);

  const totalDocuments = allItems.length;
  const publicCount = allItems.filter((i) => i.isPublic).length;
  const downloadedToday = allItems.reduce((sum, i) => sum + (i.downloadCount > 50 ? 1 : 0), 0);

  const columns: Column<LibraryItem>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => {
        const Icon = FILE_ICONS[row.fileType] || File;
        return (
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-neutral-400" />
            <span className="font-semibold text-neutral-900">{row.name}</span>
          </span>
        );
      },
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={TYPE_VARIANTS[row.type]} size="sm">
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => (
        <Badge variant={CATEGORY_VARIANTS[row.category]} size="sm">
          {row.category.charAt(0).toUpperCase() + row.category.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'fileType',
      header: 'File Type',
      accessorKey: 'fileType',
      cell: (row) => <span className="text-[13px] text-neutral-500 uppercase">{row.fileType}</span>,
    },
    {
      id: 'fileSize',
      header: 'Size',
      accessorKey: 'fileSize',
      cell: (row) => <span className="text-[13px] text-neutral-500">{row.fileSize}</span>,
    },
    {
      id: 'uploadedBy',
      header: 'Uploaded By',
      accessorKey: 'uploadedBy',
      sortable: true,
    },
    {
      id: 'lastModified',
      header: 'Last Modified',
      accessorKey: 'lastModified',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-500">
          {new Date(row.lastModified).toLocaleDateString('en-US', {
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
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      ),
    },
  ];

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
            <p className="text-[13px] text-neutral-500">Total Documents</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <FileText className="text-info-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">{publicCount}</p>
            <p className="text-[13px] text-neutral-500">Public</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Download className="text-success-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-[24px] font-bold tracking-tight text-neutral-900">
              {downloadedToday}
            </p>
            <p className="text-[13px] text-neutral-500">Downloaded Today</p>
          </div>
        </Card>
      </div>

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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="document">Document</option>
          <option value="policy">Policy</option>
          <option value="form">Form</option>
          <option value="notice">Notice</option>
          <option value="manual">Manual</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="focus:border-primary-300 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-700 focus:ring-2 focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="governance">Governance</option>
          <option value="maintenance">Maintenance</option>
          <option value="safety">Safety</option>
          <option value="financial">Financial</option>
          <option value="operations">Operations</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Data Table */}
      {filteredItems.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredItems}
          onRowClick={(row) => router.push(`/library/${row.id}` as never)}
        />
      ) : (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No documents found"
          description="Upload building documents, policies, and shared files to get started."
        />
      )}
    </PageShell>
  );
}
