'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Settings,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EditCustomFieldDialog } from '@/components/forms/edit-custom-field-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'email'
  | 'phone'
  | 'url';

type EntityType = 'unit' | 'resident' | 'event' | 'maintenance' | 'package' | 'booking';

// API entity types to display tab entity types mapping
type TabEntityType = 'unit' | 'resident' | 'event' | 'maintenance' | 'package';

interface CustomFieldDefinition {
  id: string;
  fieldLabel: string;
  fieldKey: string;
  fieldType: FieldType;
  required: boolean;
  sortOrder: number;
  entityType: EntityType;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Field type badge variant mapping
// ---------------------------------------------------------------------------

const fieldTypeBadgeVariant: Record<
  string,
  'default' | 'info' | 'success' | 'warning' | 'error' | 'primary'
> = {
  text: 'default',
  number: 'info',
  date: 'primary',
  boolean: 'success',
  select: 'warning',
  multiselect: 'warning',
  email: 'info',
  phone: 'info',
  url: 'default',
};

const ENTITY_LABELS: Record<TabEntityType, string> = {
  unit: 'Units',
  resident: 'Residents',
  event: 'Events',
  maintenance: 'Maintenance',
  package: 'Packages',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomFieldsPage() {
  const [activeTab, setActiveTab] = useState<TabEntityType>('unit');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);

  // Fetch all custom fields for this property
  const {
    data: apiFields,
    loading,
    error,
    refetch,
  } = useApi<CustomFieldDefinition[]>(
    apiUrl('/api/v1/custom-fields', {
      propertyId: getPropertyId(),
    }),
  );

  const fields: CustomFieldDefinition[] = useMemo(() => {
    if (!apiFields) return [];
    return Array.isArray(apiFields) ? apiFields : [];
  }, [apiFields]);

  const filteredFields = useMemo(() => {
    const entityFields = fields.filter((f) => f.entityType === activeTab);
    if (!searchQuery.trim()) return entityFields;
    const q = searchQuery.toLowerCase();
    return entityFields.filter(
      (f) =>
        f.fieldLabel.toLowerCase().includes(q) ||
        f.fieldKey.toLowerCase().includes(q) ||
        f.fieldType.toLowerCase().includes(q),
    );
  }, [fields, activeTab, searchQuery]);

  const columns: Column<CustomFieldDefinition>[] = [
    {
      id: 'sortOrder',
      header: '#',
      cell: (row) => (
        <div className="flex items-center gap-2 text-neutral-400">
          <GripVertical className="h-4 w-4 cursor-grab" />
          <span className="text-[13px]">{row.sortOrder}</span>
        </div>
      ),
      className: 'w-16',
    },
    {
      id: 'label',
      header: 'Label',
      accessorKey: 'fieldLabel',
      sortable: true,
      cell: (row) => (
        <span className="text-[14px] font-medium text-neutral-900">{row.fieldLabel}</span>
      ),
    },
    {
      id: 'key',
      header: 'Key',
      accessorKey: 'fieldKey',
      cell: (row) => (
        <code className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[12px] text-neutral-600">
          {row.fieldKey}
        </code>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => (
        <Badge variant={fieldTypeBadgeVariant[row.fieldType] ?? 'default'} size="md">
          {row.fieldType}
        </Badge>
      ),
    },
    {
      id: 'required',
      header: 'Required',
      cell: (row) =>
        row.required ? (
          <Check className="text-success-600 h-4 w-4" />
        ) : (
          <X className="h-4 w-4 text-neutral-300" />
        ),
      className: 'w-24 text-center',
      headerClassName: 'text-center',
    },
    {
      id: 'options',
      header: 'Options',
      cell: (row) => {
        if (!row.options || row.options.length === 0) {
          return <span className="text-[13px] text-neutral-400">--</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {row.options.length <= 2 ? (
              row.options.map((opt) => (
                <Badge key={opt} variant="default" size="sm">
                  {opt}
                </Badge>
              ))
            ) : (
              <>
                <Badge variant="default" size="sm">
                  {row.options[0]}
                </Badge>
                <Badge variant="default" size="sm">
                  +{row.options.length - 1} more
                </Badge>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            title="Edit field"
            onClick={() => setEditingField(row)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hover:bg-error-50 hover:text-error-600 rounded-lg p-1.5 text-neutral-400 transition-colors"
            title="Delete field"
            onClick={async () => {
              if (!confirm(`Delete custom field "${row.fieldLabel}"? This cannot be undone.`))
                return;
              try {
                const res = await apiRequest(`/api/v1/custom-fields/${row.id}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  refetch();
                } else {
                  const result = await res.json().catch(() => ({}));
                  alert(result.message || 'Failed to delete field.');
                }
              } catch {
                alert('Network error. Please try again.');
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-24',
      headerClassName: 'text-right',
    },
  ];

  const fieldCountsByEntity = useMemo(() => {
    const counts: Record<TabEntityType, number> = {
      unit: 0,
      resident: 0,
      event: 0,
      maintenance: 0,
      package: 0,
    };
    for (const f of fields) {
      if (f.entityType in counts) {
        counts[f.entityType as TabEntityType]++;
      }
    }
    return counts;
  }, [fields]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Custom Fields</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Define custom fields for units, residents, events, and maintenance requests.
          </p>
        </div>
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load custom fields"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Custom Fields</h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Define custom fields for units, residents, events, and maintenance requests.
          </p>
        </div>
        <Button size="md">
          <Plus className="h-4 w-4" />
          Add Custom Field
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus:border-primary-500 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 ease-out placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none"
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

      {/* Entity Type Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabEntityType)}>
        <TabsList>
          {(Object.keys(ENTITY_LABELS) as TabEntityType[]).map((entity) => (
            <TabsTrigger key={entity} value={entity}>
              {ENTITY_LABELS[entity]}
              <Badge variant="default" size="sm" className="ml-2">
                {fieldCountsByEntity[entity]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(ENTITY_LABELS) as TabEntityType[]).map((entity) => (
          <TabsContent key={entity} value={entity}>
            {filteredFields.length === 0 ? (
              <EmptyState
                icon={<Settings className="h-6 w-6" />}
                title={
                  searchQuery
                    ? 'No fields match your search'
                    : `No custom fields for ${ENTITY_LABELS[entity]}`
                }
                description={
                  searchQuery
                    ? 'Try adjusting your search query.'
                    : `Add custom fields to capture additional data for ${ENTITY_LABELS[entity].toLowerCase()}.`
                }
                action={
                  !searchQuery ? (
                    <Button size="md">
                      <Plus className="h-4 w-4" />
                      Add Custom Field
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DataTable columns={columns} data={filteredFields} compact />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Field Type Reference */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Available Field Types
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'text',
                  'number',
                  'date',
                  'boolean',
                  'select',
                  'multiselect',
                  'email',
                  'phone',
                  'url',
                ] as FieldType[]
              ).map((type) => (
                <Badge key={type} variant={fieldTypeBadgeVariant[type]} size="lg">
                  {type}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-neutral-500">
              Select and multiselect types allow you to define a predefined list of options. All
              other types accept free-form input with built-in validation.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Custom Field Dialog */}
      {editingField && (
        <EditCustomFieldDialog
          open={!!editingField}
          onOpenChange={(open) => {
            if (!open) setEditingField(null);
          }}
          field={editingField}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
