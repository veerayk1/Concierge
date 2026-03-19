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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

type EntityType = 'units' | 'residents' | 'events' | 'maintenance' | 'packages';

interface CustomFieldDefinition {
  id: string;
  label: string;
  key: string;
  type: FieldType;
  required: boolean;
  sortOrder: number;
  visibleTo: string[];
  entityType: EntityType;
  options?: string[];
}

// ---------------------------------------------------------------------------
// Field type badge variant mapping
// ---------------------------------------------------------------------------

const fieldTypeBadgeVariant: Record<
  FieldType,
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

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_FIELDS: CustomFieldDefinition[] = [
  // Units
  {
    id: 'cf-u1',
    label: 'Pet Deposit Paid',
    key: 'pet_deposit_paid',
    type: 'boolean',
    required: false,
    sortOrder: 1,
    visibleTo: ['Property Admin', 'Property Manager'],
    entityType: 'units',
  },
  {
    id: 'cf-u2',
    label: 'Move-in Inspection Date',
    key: 'move_in_inspection_date',
    type: 'date',
    required: true,
    sortOrder: 2,
    visibleTo: ['Property Admin', 'Property Manager', 'Superintendent'],
    entityType: 'units',
  },
  {
    id: 'cf-u3',
    label: 'Special Instructions',
    key: 'special_instructions',
    type: 'text',
    required: false,
    sortOrder: 3,
    visibleTo: ['Property Admin', 'Property Manager', 'Front Desk', 'Security Guard'],
    entityType: 'units',
  },
  {
    id: 'cf-u4',
    label: 'Unit Classification',
    key: 'unit_classification',
    type: 'select',
    required: true,
    sortOrder: 4,
    visibleTo: ['Property Admin', 'Property Manager'],
    entityType: 'units',
    options: ['Standard', 'Premium', 'Penthouse', 'Townhouse'],
  },
  // Residents
  {
    id: 'cf-r1',
    label: 'Preferred Language',
    key: 'preferred_language',
    type: 'select',
    required: false,
    sortOrder: 1,
    visibleTo: ['Property Admin', 'Property Manager', 'Front Desk'],
    entityType: 'residents',
    options: ['English', 'French', 'Mandarin', 'Cantonese', 'Hindi', 'Urdu', 'Arabic'],
  },
  {
    id: 'cf-r2',
    label: 'Emergency Medical Condition',
    key: 'emergency_medical_condition',
    type: 'text',
    required: false,
    sortOrder: 2,
    visibleTo: ['Property Admin', 'Security Supervisor', 'Security Guard'],
    entityType: 'residents',
  },
  {
    id: 'cf-r3',
    label: 'Newsletter Subscription',
    key: 'newsletter_subscription',
    type: 'boolean',
    required: false,
    sortOrder: 3,
    visibleTo: ['Property Admin', 'Property Manager'],
    entityType: 'residents',
  },
  {
    id: 'cf-r4',
    label: 'LinkedIn Profile',
    key: 'linkedin_profile',
    type: 'url',
    required: false,
    sortOrder: 4,
    visibleTo: ['Property Admin'],
    entityType: 'residents',
  },
  // Events
  {
    id: 'cf-e1',
    label: 'External Reference ID',
    key: 'external_reference_id',
    type: 'text',
    required: false,
    sortOrder: 1,
    visibleTo: ['Property Admin', 'Property Manager', 'Security Supervisor'],
    entityType: 'events',
  },
  {
    id: 'cf-e2',
    label: 'Estimated Duration (minutes)',
    key: 'estimated_duration_minutes',
    type: 'number',
    required: false,
    sortOrder: 2,
    visibleTo: ['Property Admin', 'Property Manager', 'Front Desk'],
    entityType: 'events',
  },
  {
    id: 'cf-e3',
    label: 'Requires Follow-Up',
    key: 'requires_follow_up',
    type: 'boolean',
    required: false,
    sortOrder: 3,
    visibleTo: ['Property Admin', 'Property Manager', 'Security Supervisor'],
    entityType: 'events',
  },
  {
    id: 'cf-e4',
    label: 'Incident Severity',
    key: 'incident_severity',
    type: 'select',
    required: false,
    sortOrder: 4,
    visibleTo: ['Property Admin', 'Security Supervisor', 'Security Guard'],
    entityType: 'events',
    options: ['Low', 'Medium', 'High', 'Critical'],
  },
  // Maintenance
  {
    id: 'cf-m1',
    label: 'Insurance Claim Number',
    key: 'insurance_claim_number',
    type: 'text',
    required: false,
    sortOrder: 1,
    visibleTo: ['Property Admin', 'Property Manager'],
    entityType: 'maintenance',
  },
  {
    id: 'cf-m2',
    label: 'Estimated Cost',
    key: 'estimated_cost',
    type: 'number',
    required: false,
    sortOrder: 2,
    visibleTo: ['Property Admin', 'Property Manager', 'Superintendent'],
    entityType: 'maintenance',
  },
  {
    id: 'cf-m3',
    label: 'Warranty Covered',
    key: 'warranty_covered',
    type: 'boolean',
    required: false,
    sortOrder: 3,
    visibleTo: ['Property Admin', 'Property Manager'],
    entityType: 'maintenance',
  },
  {
    id: 'cf-m4',
    label: 'Contractor Email',
    key: 'contractor_email',
    type: 'email',
    required: false,
    sortOrder: 4,
    visibleTo: ['Property Admin', 'Property Manager', 'Superintendent'],
    entityType: 'maintenance',
  },
  // Packages
  {
    id: 'cf-p1',
    label: 'Tracking Number',
    key: 'tracking_number',
    type: 'text',
    required: false,
    sortOrder: 1,
    visibleTo: ['Property Admin', 'Front Desk', 'Security Guard'],
    entityType: 'packages',
  },
  {
    id: 'cf-p2',
    label: 'Declared Value',
    key: 'declared_value',
    type: 'number',
    required: false,
    sortOrder: 2,
    visibleTo: ['Property Admin', 'Property Manager'],
    entityType: 'packages',
  },
  {
    id: 'cf-p3',
    label: 'Requires Signature',
    key: 'requires_signature',
    type: 'boolean',
    required: true,
    sortOrder: 3,
    visibleTo: ['Property Admin', 'Front Desk', 'Security Guard'],
    entityType: 'packages',
  },
  {
    id: 'cf-p4',
    label: 'Recipient Phone',
    key: 'recipient_phone',
    type: 'phone',
    required: false,
    sortOrder: 4,
    visibleTo: ['Property Admin', 'Front Desk'],
    entityType: 'packages',
  },
];

const ENTITY_LABELS: Record<EntityType, string> = {
  units: 'Units',
  residents: 'Residents',
  events: 'Events',
  maintenance: 'Maintenance',
  packages: 'Packages',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomFieldsPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('units');
  const [searchQuery, setSearchQuery] = useState('');
  const [fields] = useState<CustomFieldDefinition[]>(MOCK_FIELDS);

  const filteredFields = useMemo(() => {
    const entityFields = fields.filter((f) => f.entityType === activeTab);
    if (!searchQuery.trim()) return entityFields;
    const q = searchQuery.toLowerCase();
    return entityFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q),
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
      accessorKey: 'label',
      sortable: true,
      cell: (row) => <span className="text-[14px] font-medium text-neutral-900">{row.label}</span>,
    },
    {
      id: 'key',
      header: 'Key',
      accessorKey: 'key',
      cell: (row) => (
        <code className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[12px] text-neutral-600">
          {row.key}
        </code>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => (
        <Badge variant={fieldTypeBadgeVariant[row.type]} size="md">
          {row.type}
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
      id: 'visibleTo',
      header: 'Visible To',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.visibleTo.length <= 2 ? (
            row.visibleTo.map((role) => (
              <Badge key={role} variant="default" size="sm">
                {role}
              </Badge>
            ))
          ) : (
            <>
              <Badge variant="default" size="sm">
                {row.visibleTo[0]}
              </Badge>
              <Badge variant="default" size="sm">
                +{row.visibleTo.length - 1} more
              </Badge>
            </>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            title="Edit field"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hover:bg-error-50 hover:text-error-600 rounded-lg p-1.5 text-neutral-400 transition-colors"
            title="Delete field"
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
    const counts: Record<EntityType, number> = {
      units: 0,
      residents: 0,
      events: 0,
      maintenance: 0,
      packages: 0,
    };
    for (const f of fields) {
      counts[f.entityType]++;
    }
    return counts;
  }, [fields]);

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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
        <TabsList>
          {(Object.keys(ENTITY_LABELS) as EntityType[]).map((entity) => (
            <TabsTrigger key={entity} value={entity}>
              {ENTITY_LABELS[entity]}
              <Badge variant="default" size="sm" className="ml-2">
                {fieldCountsByEntity[entity]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(ENTITY_LABELS) as EntityType[]).map((entity) => (
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
    </div>
  );
}
